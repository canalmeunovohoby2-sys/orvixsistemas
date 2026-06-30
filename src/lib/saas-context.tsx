import {
  createContext, useContext, useEffect, useState, useCallback, useRef,
  type ReactNode,
} from "react";
import { notifyAdminNewClient } from "./admin-notifications";
import { isStrongPassword } from "./password-policy";
import {
  logEvent, markLogReverted, updateSaaSSettings, SAAS_SETTINGS,
  type SaaSSettings, SYSTEM_LOGS,
} from "./mock-data";
import { supabase } from "@/integrations/supabase/client";
import {
  ensureSuperAdmin,
  ensureTestUser,
  resolveLoginProfile,
  adminCreateCompanyWithOwner,
  adminCreateCashier,
  adminDeleteUser,
  adminDeleteCompany as adminDeleteCompanyFn,
  adminClearTemporaryPasswordFlag,
} from "./saas-admin.functions";

/* ============================================================
 * Tipos e constantes públicas (mantidos compatíveis com a UI)
 * ============================================================ */

export type Role = "super_admin" | "admin" | "cashier";
export type SubscriptionStatus = "trial" | "active" | "pending" | "blocked" | "canceled";
export type Plan = "bronze" | "prata" | "ouro";

export type Company = {
  id: string;
  razaoSocial: string;
  fantasia: string;
  cnpj: string;
  status: SubscriptionStatus;
  plan: Plan;
  mrr: number;
  createdAt: string;
  dueDate: string;
  phone?: string;
  segment?: string;
  onboardingPending?: boolean;
  isDemo?: boolean;
};

export type SaaSUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  /** null para super_admin (acesso global) */
  companyId: string | null;
  /** Mantido só por compat. de tipo — auth real fica no Supabase. */
  password: string;
  isTemporaryPassword: boolean;
};

export const PLAN_PRICE: Record<Plan, number> = {
  bronze: 99.9,
  prata: 149.9,
  ouro: 249.9,
};
export const PLAN_LABEL: Record<Plan, string> = {
  bronze: "Bronze (Essencial)",
  prata: "Prata (Pro)",
  ouro: "Ouro (Premium)",
};

export const PLAN_LIMITS: Record<Plan, { caixas: number; users: number; advancedReports: boolean }> = {
  bronze: { caixas: 1, users: 1, advancedReports: false },
  prata:  { caixas: 3, users: 5, advancedReports: false },
  ouro:   { caixas: 10, users: 10, advancedReports: true },
};

export function getPlanUsersLimit(plan: Plan): number {
  const cfg = Number(SAAS_SETTINGS.usersLimit?.[plan]);
  return Number.isFinite(cfg) && cfg > 0 ? cfg : PLAN_LIMITS[plan].users;
}
export function getPlanCaixasLimit(plan: Plan): number {
  if (plan === "ouro") return getPlanUsersLimit("ouro");
  return PLAN_LIMITS[plan].caixas;
}

/* ============================================================
 * Espelho em memória das tabelas Supabase (somente para reutilizar
 * a árvore de componentes existente que filtra `companies` / `users`).
 * ============================================================ */
export const COMPANIES: Company[] = [];
export const SAAS_USERS: SaaSUser[] = [];

/** E-mail oficial do Super Admin. */
export const SUPER_ADMIN_EMAIL = "orvixsistemas@gmail.com";
export const TEST_ADMIN_EMAIL = "teste@orvix.com";
export const TEST_ADMIN_PASSWORD = "Orvix@2026";
export const TEST_CASHIER_EMAIL = "caixa.teste@orvix.com";
export const TEST_CASHIER_PASSWORD = "OrvixCaixa@2026";
const TEST_COMPANY_ID = "EMP_TESTE";

/* ============================================================
 * Snapshots de reversão (mantidos para auditoria — Phase 1 cobre
 * reverts simples; COMPANY_DELETE devolve mensagem amigável).
 * ============================================================ */
export type UndoPayload =
  | { type: "COMPANY_DELETE"; companyId: string; fantasia: string }
  | { type: "PLAN_CHANGE"; companyId: string; previousPlan: Plan; previousMrr: number }
  | { type: "DUE_CHANGE"; companyId: string; previousDueDate: string }
  | { type: "SUBSCRIPTION_CHANGE"; companyId: string; previousStatus: SubscriptionStatus }
  | { type: "SETTINGS_UPDATE"; previousSettings: SaaSSettings };

/* ============================================================
 * Mapeamento DB ↔ UI
 * ============================================================ */
type DbCompany = {
  id: string;
  razao_social: string;
  fantasia: string;
  cnpj: string;
  status: SubscriptionStatus;
  plan: Plan;
  mrr: number | string;
  due_date: string | null;
  phone: string | null;
  segment: string | null;
  onboarding_pending: boolean;
  is_demo: boolean;
  created_at: string;
};
type DbAppUser = {
  id: string;
  name: string;
  email: string;
  role: Role | "operator" | "client" | string;
  company_id: string | null;
  is_temporary_password: boolean;
};

function normalizeRole(role: DbAppUser["role"]): Role {
  if (role === "super_admin" || role === "admin" || role === "cashier") return role;
  if (role === "operator" || role === "client") return "cashier";
  return "cashier";
}

function mapCompany(c: DbCompany): Company {
  return {
    id: c.id,
    razaoSocial: c.razao_social,
    fantasia: c.fantasia,
    cnpj: c.cnpj,
    status: c.status,
    plan: c.plan,
    mrr: Number(c.mrr),
    createdAt: c.created_at?.slice(0, 10) ?? "",
    dueDate: c.due_date ?? "",
    phone: c.phone ?? undefined,
    segment: c.segment ?? undefined,
    onboardingPending: c.onboarding_pending,
    isDemo: c.is_demo,
  };
}
function mapUser(u: DbAppUser): SaaSUser {
  return {
    id: u.id,
    name: u.name || u.email,
    email: u.email,
    role: normalizeRole(u.role),
    companyId: u.company_id,
    password: "",
    isTemporaryPassword: u.is_temporary_password,
  };
}

/* ============================================================
 * Contexto
 * ============================================================ */
type SaaSCtx = {
  user: SaaSUser | null;
  company: Company | null;
  companies: Company[];
  users: SaaSUser[];
  ready: boolean;

  loginWithCredentials: (email: string, password: string) => Promise<{ ok: boolean; user?: SaaSUser; reason?: string }>;
  logout: () => Promise<void>;
  hasRole: (...roles: Role[]) => boolean;

  setCompanyStatus: (companyId: string, status: SubscriptionStatus) => Promise<void>;
  setCompanyPlan: (companyId: string, plan: Plan) => void;
  setCompanyDueDate: (companyId: string, isoDate: string) => void;
  activateRevenue: (companyId: string) => void;

  updatePassword: (newPassword: string) => Promise<{ ok: boolean; reason?: string }>;
  changeOwnPassword: (
    currentPassword: string, newPassword: string, confirmPassword: string,
  ) => Promise<{ ok: boolean; reason?: string }>;

  completeOnboarding: (
    companyId: string,
    data: { fantasia: string; cnpj: string; phone: string; segment: string },
  ) => Promise<{ ok: boolean; reason?: string }>;

  createDemoAccess: () => Promise<{ ok: boolean; reason?: string; user?: SaaSUser; company?: Company; password?: string }>;
  processWebhookPayment: (ev: {
    id: string; externalId: string;
    type: "payment" | "subscription" | "unknown";
    status: string; amount: number;
    payerEmail: string | null; payerName: string | null;
  }) => Promise<{ ok: boolean; reason?: string; user?: SaaSUser; company?: Company }>;

  countUsers: (companyId: string) => number;
  canAddUser: (companyId: string) => { ok: boolean; reason?: string };
  inviteUser: (companyId: string, role: Exclude<Role, "super_admin">) =>
    Promise<{ ok: boolean; user?: SaaSUser; reason?: string; password?: string }>;

  countCashiers: (companyId: string) => number;
  canAddCashier: (companyId: string) => { ok: boolean; reason?: string; limit: number; current: number };
  createCashier: (
    companyId: string, data: { name: string; email: string; password: string },
  ) => Promise<{ ok: boolean; reason?: string; user?: SaaSUser; password?: string }>;
  deleteCashier: (userId: string) => Promise<{ ok: boolean; reason?: string }>;

  deleteCompany: (companyId: string) => Promise<{ ok: boolean; reason?: string }>;
  revertLog: (logId: string) => { ok: boolean; reason?: string };

  impersonating: boolean;
  impersonatedCompany: Company | null;
  startImpersonation: (companyId: string) => void;
  stopImpersonation: () => void;

  /** Recarrega empresas + usuários do banco (após mutações fora do contexto). */
  refresh: () => Promise<void>;

  /** Última sincronização bem-sucedida com o Supabase (null antes do primeiro fetch). */
  lastSync: Date | null;
};

const Ctx = createContext<SaaSCtx | null>(null);

/* ============================================================
 * Provider
 * ============================================================ */
export function SaaSProvider({ children }: { children: ReactNode }) {
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [realUser, setRealUser] = useState<SaaSUser | null>(null);
  const [ready, setReady] = useState(false);
  const [, force] = useState(0);
  const tick = useCallback(() => force((t) => t + 1), []);
  const [impersonatedCompanyId, setImpersonatedCompanyId] = useState<string | null>(null);
  const bootstrappedRef = useRef(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const updateLastSync = useCallback(() => { setLastSync(new Date()); }, []);

  /* ---------- Hidratação inicial: garante super admin + sessão ---------- */
  useEffect(() => {
    let alive = true;
    (async () => {
      // Bootstrap: garante que o Super Admin oficial exista no banco (idempotente).
      if (!bootstrappedRef.current) {
        bootstrappedRef.current = true;
        try { await ensureSuperAdmin(); } catch (e) { console.warn("[ORVIX] ensureSuperAdmin", e); }
        try { await ensureTestUser(); } catch (e) { console.warn("[ORVIX] ensureTestUser", e); }
      }
      const { data } = await supabase.auth.getSession();
      if (!alive) return;
      setAuthUserId(data.session?.user.id ?? null);
      setReady(true);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED" || event === "INITIAL_SESSION") {
        setAuthUserId(session?.user.id ?? null);
      }
    });
    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, []);

  /* ---------- Carrega perfil + empresas/usuários conforme o papel ---------- */
  const loadAll = useCallback(async (uid: string | null) => {
    if (!uid) {
      setRealUser(null);
      COMPANIES.length = 0; SAAS_USERS.length = 0;
      tick();
      return;
    }
    // 1) Perfil do usuário logado
    const { data: meRow } = await supabase
      .from("app_users")
      .select("id, name, email, role, company_id, is_temporary_password")
      .eq("id", uid)
      .maybeSingle();
    const resolvedMe = meRow
      ? { ok: true as const, user: mapUser(meRow as DbAppUser) }
      : await resolveLoginProfile();
    if (!resolvedMe.ok) {
      setRealUser(null);
      COMPANIES.length = 0; SAAS_USERS.length = 0;
      tick();
      return;
    }
    const me: SaaSUser = { ...resolvedMe.user, password: "", role: normalizeRole(resolvedMe.user.role) };
    setRealUser(me);

    // 2) Empresas + usuários conforme RLS (super_admin vê tudo; demais veem só a própria empresa)
    const [companiesRes, usersRes] = await Promise.all([
      supabase.from("companies").select("*").order("created_at", { ascending: true }),
      supabase.from("app_users").select("id, name, email, role, company_id, is_temporary_password"),
    ]);
    COMPANIES.length = 0;
    if (companiesRes.data) {
      for (const c of companiesRes.data as DbCompany[]) COMPANIES.push(mapCompany(c));
    }
    SAAS_USERS.length = 0;
    if (usersRes.data) {
      for (const u of usersRes.data as DbAppUser[]) SAAS_USERS.push(mapUser(u));
    }
    if (!companiesRes.error && !usersRes.error) updateLastSync();
    tick();
  }, [tick, updateLastSync]);

  useEffect(() => { void loadAll(authUserId); }, [authUserId, loadAll]);

  const refresh = useCallback(async () => { await loadAll(authUserId); }, [authUserId, loadAll]);

  /* ---------- Login ---------- */
  const loginWithCredentials = useCallback(
    async (email: string, password: string): Promise<{ ok: boolean; user?: SaaSUser; reason?: string }> => {
      const normalized = email.trim().toLowerCase();
      if (!normalized || !password) return { ok: false, reason: "Informe e-mail e senha." };

      const activateLocalTestBypass = (role: Role): SaaSUser => {
        const companyRow: Company = {
          id: TEST_COMPANY_ID,
          razaoSocial: "ORVIX Loja de Testes LTDA",
          fantasia: "ORVIX Loja de Testes",
          cnpj: "00.000.000/0001-91",
          status: "active",
          plan: "ouro",
          mrr: 0,
          createdAt: new Date().toISOString().slice(0, 10),
          dueDate: new Date(Date.now() + 30 * 86400000).toISOString(),
          phone: "(11) 99999-2026",
          segment: "Homologação / PDV",
          onboardingPending: false,
          isDemo: true,
        };
        const adminUser: SaaSUser = {
          id: "mock-admin-teste-orvix",
          name: "Admin Teste ORVIX",
          email: TEST_ADMIN_EMAIL,
          role: "admin",
          companyId: TEST_COMPANY_ID,
          password: "",
          isTemporaryPassword: false,
        };
        const cashierUser: SaaSUser = {
          id: "mock-caixa-teste-orvix",
          name: "Caixa Teste ORVIX",
          email: TEST_CASHIER_EMAIL,
          role: "cashier",
          companyId: TEST_COMPANY_ID,
          password: "",
          isTemporaryPassword: false,
        };
        COMPANIES.length = 0; COMPANIES.push(companyRow);
        SAAS_USERS.length = 0; SAAS_USERS.push(adminUser, cashierUser);
        const selected = role === "cashier" ? cashierUser : adminUser;
        setRealUser(selected);
        tick();
        logEvent({
          kind: "LOGIN_OK", company_id: TEST_COMPANY_ID,
          companyName: companyRow.fantasia, user: selected.name,
          action: `Login de homologação liberado via bypass mockado (${selected.role}).`,
        });
        return selected;
      };

      // Bypass idempotente de homologação: garante que o usuário master exista
      // no mesmo fluxo/tabela dos demais usuários antes de validar a senha.
      if (normalized === TEST_ADMIN_EMAIL || normalized === TEST_CASHIER_EMAIL) {
        try { await ensureTestUser(); } catch (e) { console.warn("[ORVIX] ensureTestUser(login)", e); }
      }

      let { error } = await supabase.auth.signInWithPassword({ email: normalized, password });
      // Auto-bootstrap do super admin se ele tentar com a senha padrão e ainda não existir.
      if (error && normalized === SUPER_ADMIN_EMAIL) {
        try { await ensureSuperAdmin(); } catch {}
        ({ error } = await supabase.auth.signInWithPassword({ email: normalized, password }));
      }
      // Se a senha de teste foi digitada corretamente mas a sessão ainda falhou
      // por inconsistência de migração, refaz o bootstrap e tenta uma última vez.
      if (error && normalized === TEST_ADMIN_EMAIL && password === TEST_ADMIN_PASSWORD) {
        try { await ensureTestUser(); } catch {}
        ({ error } = await supabase.auth.signInWithPassword({ email: normalized, password }));
      }
      if (error && normalized === TEST_CASHIER_EMAIL && password === TEST_CASHIER_PASSWORD) {
        try { await ensureTestUser(); } catch {}
        ({ error } = await supabase.auth.signInWithPassword({ email: normalized, password }));
      }
      if (error && normalized === TEST_ADMIN_EMAIL && password === TEST_ADMIN_PASSWORD) {
        return { ok: true, user: activateLocalTestBypass("admin") };
      }
      if (error && normalized === TEST_CASHIER_EMAIL && password === TEST_CASHIER_PASSWORD) {
        return { ok: true, user: activateLocalTestBypass("cashier") };
      }
      if (error) return { ok: false, reason: "E-mail ou senha incorretos." };

      const { data: sess } = await supabase.auth.getSession();
      const uid = sess.session?.user.id ?? null;
      if (!uid) return { ok: false, reason: "Sessão não estabelecida." };
      const { data: meRow } = await supabase
        .from("app_users")
        .select("id, name, email, role, company_id, is_temporary_password")
        .eq("id", uid)
        .maybeSingle();
      const resolved = meRow
        ? { ok: true as const, user: mapUser(meRow as DbAppUser) }
        : await resolveLoginProfile();

      if (!resolved.ok) {
        await supabase.auth.signOut();
        return { ok: false, reason: resolved.reason ?? "Usuário sem perfil cadastrado na plataforma." };
      }

      const me: SaaSUser = {
        ...resolved.user,
        password: "",
        role: normalizeRole(resolved.user.role),
      };
      if (!me) {
        await supabase.auth.signOut();
        return { ok: false, reason: "Usuário sem perfil cadastrado na plataforma." };
      }
      await loadAll(uid);
      const comp = me.companyId ? COMPANIES.find((c) => c.id === me.companyId) : null;
      logEvent({
        kind: "LOGIN_OK", company_id: me.companyId,
        companyName: comp?.fantasia ?? "Plataforma",
        user: me.name, action: `Login efetuado (${me.role}).`,
      });
      return { ok: true, user: me };
    },
    [loadAll, tick],
  );

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setRealUser(null);
    setImpersonatedCompanyId(null);
    COMPANIES.length = 0; SAAS_USERS.length = 0;
    tick();
  }, [tick]);

  /* ---------- Usuário efetivo (com impersonação) ---------- */
  let user: SaaSUser | null = realUser;
  let company: Company | null = realUser?.companyId
    ? COMPANIES.find((c) => c.id === realUser.companyId) ?? null
    : null;
  const impersonatedCompany = impersonatedCompanyId ? COMPANIES.find((c) => c.id === impersonatedCompanyId) ?? null : null;
  if (realUser?.role === "super_admin" && impersonatedCompany) {
    user = {
      id: realUser.id, name: `${realUser.name} (Suporte)`, email: realUser.email,
      role: "admin", companyId: impersonatedCompany.id, password: "", isTemporaryPassword: false,
    };
    company = impersonatedCompany;
  }

  const hasRole = useCallback(
    (...roles: Role[]) => !!user && roles.includes(user.role),
    [user],
  );

  /* ---------- Mutations simples (UPDATE direto via RLS) ---------- */
  const updateCompanyOptimistic = useCallback(async (companyId: string, patch: Record<string, unknown>) => {
    const local = COMPANIES.find((c) => c.id === companyId);
    if (local) Object.assign(local, patch);
    tick();
    const { error } = await supabase.from("companies").update(patch).eq("id", companyId);
    if (!error) updateLastSync();
  }, [tick, updateLastSync]);

  const setCompanyStatus = useCallback(async (companyId: string, status: SubscriptionStatus) => {
    const c = COMPANIES.find((x) => x.id === companyId); if (!c) return;
    const prev = c.status;
    await updateCompanyOptimistic(companyId, { status });
    logEvent({
      kind: "SUBSCRIPTION_CHANGE", company_id: c.id, companyName: c.fantasia,
      user: realUser?.name ?? "Sistema",
      action: `Status alterado: ${prev.toUpperCase()} → ${status.toUpperCase()}.`,
      undo: { type: "SUBSCRIPTION_CHANGE", companyId: c.id, previousStatus: prev } satisfies UndoPayload,
    });
  }, [realUser, updateCompanyOptimistic]);

  const setCompanyPlan = useCallback((companyId: string, plan: Plan) => {
    const c = COMPANIES.find((x) => x.id === companyId); if (!c) return;
    const prev = c.plan; const prevMrr = c.mrr;
    const patch: Record<string, unknown> = { plan };
    if (c.status === "active" && c.mrr > 0) patch.mrr = PLAN_PRICE[plan];
    void updateCompanyOptimistic(companyId, patch);
    logEvent({
      kind: "PLAN_CHANGE", company_id: c.id, companyName: c.fantasia,
      user: realUser?.name ?? "Sistema",
      action: `Plano alterado: ${PLAN_LABEL[prev]} → ${PLAN_LABEL[plan]}.`,
      undo: { type: "PLAN_CHANGE", companyId: c.id, previousPlan: prev, previousMrr: prevMrr } satisfies UndoPayload,
    });
  }, [realUser, updateCompanyOptimistic]);

  const setCompanyDueDate = useCallback((companyId: string, isoDate: string) => {
    const c = COMPANIES.find((x) => x.id === companyId); if (!c) return;
    const prev = c.dueDate;
    void updateCompanyOptimistic(companyId, { due_date: isoDate });
    logEvent({
      kind: "DUE_CHANGE", company_id: c.id, companyName: c.fantasia,
      user: realUser?.name ?? "Sistema",
      action: `Vencimento alterado: ${prev?.slice(0, 10)} → ${isoDate.slice(0, 10)}.`,
      undo: { type: "DUE_CHANGE", companyId: c.id, previousDueDate: prev } satisfies UndoPayload,
    });
  }, [realUser, updateCompanyOptimistic]);

  const activateRevenue = useCallback((companyId: string) => {
    const c = COMPANIES.find((x) => x.id === companyId); if (!c) return;
    if (c.status !== "active" || c.mrr > 0) return;
    const newMrr = PLAN_PRICE[c.plan];
    void updateCompanyOptimistic(companyId, { mrr: newMrr });
    logEvent({
      kind: "SETTINGS_UPDATE", company_id: c.id, companyName: c.fantasia,
      user: realUser?.name ?? "Sistema",
      action: `Faturamento ativado — MRR ${PLAN_LABEL[c.plan]} reconhecido (${newMrr.toFixed(2)}).`,
    });
  }, [realUser, updateCompanyOptimistic]);

  /* ---------- Impersonation ---------- */
  const startImpersonation = useCallback((companyId: string) => {
    if (realUser?.role !== "super_admin") return;
    const target = COMPANIES.find((c) => c.id === companyId); if (!target) return;
    setImpersonatedCompanyId(companyId);
    logEvent({
      kind: "IMPERSONATION_START", company_id: target.id, companyName: target.fantasia,
      user: realUser.name,
      action: `Super Admin iniciou modo suporte (impersonação) em ${target.fantasia}.`,
    });
  }, [realUser]);

  const stopImpersonation = useCallback(() => {
    const target = impersonatedCompanyId ? COMPANIES.find((c) => c.id === impersonatedCompanyId) : null;
    setImpersonatedCompanyId(null);
    if (target && realUser) {
      logEvent({
        kind: "IMPERSONATION_END", company_id: target.id, companyName: target.fantasia,
        user: realUser.name,
        action: `Super Admin encerrou impersonação em ${target.fantasia}.`,
      });
    }
  }, [impersonatedCompanyId, realUser]);

  /* ---------- Senha ---------- */
  const updatePassword = useCallback(async (newPassword: string): Promise<{ ok: boolean; reason?: string }> => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { ok: false, reason: error.message };
    await adminClearTemporaryPasswordFlag();
    updateLastSync();
    if (realUser) {
      const u = SAAS_USERS.find((x) => x.id === realUser.id);
      if (u) u.isTemporaryPassword = false;
      setRealUser({ ...realUser, isTemporaryPassword: false });
    }
    logEvent({
      kind: "SETTINGS_UPDATE", company_id: realUser?.companyId ?? null,
      companyName: company?.fantasia ?? "Plataforma",
      user: realUser?.name ?? "Usuário",
      action: "Senha atualizada com sucesso (Supabase Auth).",
    });
    return { ok: true };
  }, [realUser, company, updateLastSync]);

  const changeOwnPassword = useCallback(
    async (currentPassword: string, newPassword: string, confirmPassword: string): Promise<{ ok: boolean; reason?: string }> => {
      const u = realUser;
      if (!u) return { ok: false, reason: "Sessão expirada. Faça login novamente." };
      if (!newPassword || newPassword.length < 6) return { ok: false, reason: "A nova senha precisa ter pelo menos 6 caracteres." };
      if (newPassword !== confirmPassword) return { ok: false, reason: "A confirmação não confere com a nova senha." };
      // Revalida a senha atual via tentativa de login.
      const { error: vErr } = await supabase.auth.signInWithPassword({ email: u.email, password: currentPassword });
      if (vErr) return { ok: false, reason: "Senha atual incorreta." };
      const res = await updatePassword(newPassword);
      if (!res.ok) return res;
      return { ok: true };
    },
    [realUser, updatePassword],
  );

  /* ---------- Onboarding ---------- */
  const completeOnboarding = useCallback(
    async (companyId: string, data: { fantasia: string; cnpj: string; phone: string; segment: string }) => {
      const c = COMPANIES.find((x) => x.id === companyId);
      if (!c) return { ok: false, reason: "Empresa não encontrada." };
      const fantasia = data.fantasia.trim();
      const cnpj = data.cnpj.trim();
      const phone = data.phone.trim();
      const segment = data.segment.trim();
      if (fantasia.length < 2) return { ok: false, reason: "Informe o nome da loja / razão social." };
      if (cnpj.length < 11) return { ok: false, reason: "Informe um CNPJ ou CPF válido (mínimo 11 dígitos)." };
      if (phone.length < 8) return { ok: false, reason: "Informe um telefone comercial válido." };
      if (!segment) return { ok: false, reason: "Selecione o segmento do negócio." };

      const { error } = await supabase.from("companies").update({
        fantasia, razao_social: fantasia, cnpj, phone, segment, onboarding_pending: false,
      }).eq("id", companyId);
      if (error) return { ok: false, reason: error.message };
      updateLastSync();

      c.fantasia = fantasia; c.razaoSocial = fantasia; c.cnpj = cnpj;
      c.phone = phone; c.segment = segment; c.onboardingPending = false;
      tick();
      logEvent({
        kind: "SETTINGS_UPDATE", company_id: c.id, companyName: c.fantasia,
        user: realUser?.name ?? "Lojista",
        action: `Cadastro concluído pelo lojista — empresa "${fantasia}" (${cnpj}) · ${segment} · ${phone}.`,
      });
      const owner = SAAS_USERS.find((u) => u.companyId === c.id && u.role === "admin");
      void notifyAdminNewClient({
        storeName: c.fantasia, ownerName: owner?.name ?? realUser?.name ?? "Lojista",
        contactEmail: owner?.email ?? realUser?.email ?? "—",
        planLabel: PLAN_LABEL[c.plan], planPrice: PLAN_PRICE[c.plan],
        terminalsLimit: getPlanCaixasLimit(c.plan), origin: "Cadastro Real",
        companyId: c.id, cnpj: c.cnpj, phone: c.phone, segment: c.segment,
      });
      return { ok: true };
    },
    [realUser, tick, updateLastSync],
  );

  /* ---------- Criação de empresa demo (Super Admin) ---------- */
  const createDemoAccess = useCallback(async () => {
    const seq = COMPANIES.length + 1;
    const ownerEmail = `cliente${Date.now().toString(36)}@orvix.com.br`.toLowerCase();
    const tempPassword = `Orvix${Math.random().toString(36).slice(2, 8)}!1`;
    const res = await adminCreateCompanyWithOwner({
      data: {
        razaoSocial: `Cliente ORVIX ${seq} LTDA`,
        fantasia: `Loja ORVIX #${seq}`,
        cnpj: "00.000.000/0001-00",
        plan: "bronze", status: "active",
        ownerName: `Admin Loja #${seq}`,
        ownerEmail, ownerPassword: tempPassword,
        isDemo: false, onboardingPending: true,
      },
    });
    if (!res.ok) return { ok: false, reason: res.reason };
    await refresh();
    const newCompany = COMPANIES.find((c) => c.id === res.companyId);
    const newUser = SAAS_USERS.find((u) => u.id === res.ownerId);
    logEvent({
      kind: "SETTINGS_UPDATE", company_id: res.companyId, companyName: newCompany?.fantasia ?? res.companyId,
      user: realUser?.name ?? "Sistema",
      action: `🔐 Credenciais de teste geradas — Usuário: ${res.ownerEmail} | Senha: ${tempPassword} (role=admin, empresa=${res.companyId}).`,
    });
    if (newCompany) {
      void notifyAdminNewClient({
        storeName: newCompany.fantasia, ownerName: newUser?.name ?? "Admin",
        contactEmail: res.ownerEmail, planLabel: PLAN_LABEL[newCompany.plan],
        planPrice: PLAN_PRICE[newCompany.plan], terminalsLimit: getPlanCaixasLimit(newCompany.plan),
        origin: "Simulação", companyId: newCompany.id, cnpj: newCompany.cnpj,
      });
    }
    return { ok: true, user: newUser, company: newCompany, password: tempPassword };
  }, [realUser, refresh]);

  /* ---------- Webhook Mercado Pago ---------- */
  const processWebhookPayment = useCallback(
    async (ev: {
      id: string; externalId: string;
      type: "payment" | "subscription" | "unknown";
      status: string; amount: number;
      payerEmail: string | null; payerName: string | null;
    }) => {
      const okStatus = ev.status === "approved" || ev.status === "authorized";
      if (!okStatus) {
        logEvent({
          kind: "SETTINGS_UPDATE", company_id: null, companyName: "Plataforma",
          user: "Webhook Mercado Pago",
          action: `Webhook recebido (${ev.type}#${ev.externalId}) com status "${ev.status}" — nenhuma ação executada.`,
        });
        return { ok: false, reason: `Status ${ev.status} não dispara provisionamento.` };
      }
      const dupKey = `mp:${ev.type}:${ev.externalId}`;
      const already = SYSTEM_LOGS.some((l) => typeof l.action === "string" && l.action.includes(dupKey));
      if (already) return { ok: false, reason: "Evento já processado." };
      const plan: Plan =
        ev.amount >= PLAN_PRICE.ouro - 0.5 ? "ouro"
        : ev.amount >= PLAN_PRICE.prata - 0.5 ? "prata"
        : "bronze";
      const email = (ev.payerEmail || `cliente${Date.now().toString(36)}@orvix.com.br`).toLowerCase();
      const tempPassword = `Orvix${Math.random().toString(36).slice(2, 8)}!1`;
      const res = await adminCreateCompanyWithOwner({
        data: {
          razaoSocial: ev.payerName ? `${ev.payerName} (Auto-MP)` : `Cliente MP`,
          fantasia: ev.payerName ?? `Cliente MP`,
          cnpj: "00.000.000/0001-00", plan, status: "active",
          ownerName: ev.payerName ? `Admin ${ev.payerName}` : "Admin Cliente MP",
          ownerEmail: email, ownerPassword: tempPassword,
          isDemo: false, onboardingPending: true,
        },
      });
      if (!res.ok) return { ok: false, reason: res.reason };
      await refresh();
      const newCompany = COMPANIES.find((c) => c.id === res.companyId);
      const newUser = SAAS_USERS.find((u) => u.id === res.ownerId);
      logEvent({
        kind: "SETTINGS_UPDATE", company_id: res.companyId, companyName: newCompany?.fantasia ?? res.companyId,
        user: "Webhook Mercado Pago",
        action: `🔐 Credenciais — Usuário: ${email} | Senha: ${tempPassword} (admin, ${res.companyId}). Ref ${dupKey}.`,
      });
      return { ok: true, user: newUser, company: newCompany };
    },
    [refresh],
  );

  /* ---------- Contagens / limites ---------- */
  const countUsers = useCallback(
    (companyId: string) => SAAS_USERS.filter((u) => u.companyId === companyId).length,
    [],
  );

  const canAddUser = useCallback((companyId: string) => {
    const c = COMPANIES.find((x) => x.id === companyId);
    if (!c) return { ok: false, reason: "Empresa não encontrada." };
    const limit = getPlanUsersLimit(c.plan);
    const current = SAAS_USERS.filter((u) => u.companyId === companyId).length;
    if (current >= limit) {
      return { ok: false, reason: `🚫 Limite Atingido: plano ${PLAN_LABEL[c.plan]} permite até ${limit} usuário(s).` };
    }
    return { ok: true };
  }, []);

  const inviteUser = useCallback(async (companyId: string, role: Exclude<Role, "super_admin">) => {
    const guard = canAddUser(companyId);
    if (!guard.ok) return { ok: false, reason: guard.reason };
    const c = COMPANIES.find((x) => x.id === companyId)!;
    const slug = c.fantasia.toLowerCase().replace(/\W+/g, "") || "empresa";
    const email = `usuario${Date.now().toString(36)}@${slug}.com.br`;
    const password = `Orvix${Math.random().toString(36).slice(2, 8)}!1`;
    const res = await adminCreateCashier({
      data: { companyId, name: role === "admin" ? "Gerente Convidado" : "Operador Convidado", email, password },
    });
    if (!res.ok) return { ok: false, reason: res.reason };
    await refresh();
    logEvent({
      kind: "SETTINGS_UPDATE", company_id: c.id, companyName: c.fantasia,
      user: realUser?.name ?? "Sistema",
      action: `Convite criado: ${email} (${role}). Senha temporária: ${password}.`,
    });
    const newUser = SAAS_USERS.find((u) => u.id === res.userId);
    return { ok: true, user: newUser, password };
  }, [canAddUser, realUser, refresh]);

  const countCashiers = useCallback(
    (companyId: string) => SAAS_USERS.filter((u) => u.companyId === companyId && u.role === "cashier").length,
    [],
  );

  const canAddCashier = useCallback((companyId: string) => {
    const c = COMPANIES.find((x) => x.id === companyId);
    if (!c) return { ok: false, reason: "Empresa não encontrada.", limit: 0, current: 0 };
    const limit = getPlanCaixasLimit(c.plan);
    const current = SAAS_USERS.filter((u) => u.companyId === companyId && u.role === "cashier").length;
    if (current >= limit) {
      return {
        ok: false, limit, current,
        reason: `🚫 Limite Atingido: seu plano ${PLAN_LABEL[c.plan]} permite até ${limit} terminal(is).`,
      };
    }
    return { ok: true, limit, current };
  }, []);

  const createCashier = useCallback(
    async (companyId: string, data: { name: string; email: string; password: string }) => {
      const c = COMPANIES.find((x) => x.id === companyId);
      if (!c) return { ok: false, reason: "Empresa não encontrada." };
      const guard = canAddCashier(companyId);
      if (!guard.ok) return { ok: false, reason: guard.reason };
      const name = data.name.trim();
      const email = data.email.trim().toLowerCase();
      if (name.length < 2) return { ok: false, reason: "Informe o nome do operador." };
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, reason: "Informe um e-mail válido." };
      if (!isStrongPassword(data.password)) {
        return { ok: false, reason: "A senha do caixa precisa ter no mínimo 8 caracteres com 1 maiúscula, 1 minúscula, 1 número e 1 caractere especial." };
      }
      const res = await adminCreateCashier({
        data: { companyId, name, email, password: data.password },
      });
      if (!res.ok) return { ok: false, reason: res.reason };
      await refresh();
      logEvent({
        kind: "SETTINGS_UPDATE", company_id: c.id, companyName: c.fantasia,
        user: realUser?.name ?? "Lojista",
        action: `Operador de caixa criado: ${name} (${email}) — plano ${PLAN_LABEL[c.plan]}.`,
      });
      const newUser = SAAS_USERS.find((u) => u.id === res.userId);
      return { ok: true, user: newUser, password: data.password };
    },
    [canAddCashier, realUser, refresh],
  );

  const deleteCashier = useCallback(async (userId: string) => {
    const target = SAAS_USERS.find((u) => u.id === userId && u.role === "cashier");
    if (!target) return { ok: false, reason: "Operador não encontrado." };
    const res = await adminDeleteUser({ data: { userId } });
    if (!res.ok) return { ok: false, reason: res.reason };
    await refresh();
    const c = target.companyId ? COMPANIES.find((x) => x.id === target.companyId) : null;
    logEvent({
      kind: "SETTINGS_UPDATE", company_id: target.companyId,
      companyName: c?.fantasia ?? "Plataforma",
      user: realUser?.name ?? "Lojista",
      action: `Operador de caixa removido: ${target.name} (${target.email}).`,
    });
    return { ok: true };
  }, [realUser, refresh]);

  const deleteCompany = useCallback(async (companyId: string) => {
    const c = COMPANIES.find((x) => x.id === companyId);
    if (!c) return { ok: false, reason: "Empresa não encontrada." };
    const res = await adminDeleteCompanyFn({ data: { companyId } });
    if (!res.ok) return { ok: false, reason: res.reason };
    await refresh();
    logEvent({
      kind: "SETTINGS_UPDATE", company_id: null, companyName: "Plataforma",
      user: realUser?.name ?? "Sistema",
      action: `Empresa removida permanentemente: ${c.fantasia} (${c.cnpj}).`,
      undo: { type: "COMPANY_DELETE", companyId: c.id, fantasia: c.fantasia } satisfies UndoPayload,
    });
    if (impersonatedCompanyId === companyId) setImpersonatedCompanyId(null);
    return { ok: true };
  }, [realUser, refresh, impersonatedCompanyId]);

  /* ---------- Reversão simples (status, plan, due, settings) ---------- */
  const revertLog = useCallback((logId: string) => {
    const log = SYSTEM_LOGS.find((l) => l.id === logId);
    if (!log) return { ok: false, reason: "Log não encontrado." };
    if (log.reverted) return { ok: false, reason: "Este evento já foi revertido." };
    const undo = log.undo as UndoPayload | undefined;
    if (!undo) return { ok: false, reason: "Este evento não é elegível para reversão." };
    switch (undo.type) {
      case "SUBSCRIPTION_CHANGE":
        setCompanyStatus(undo.companyId, undo.previousStatus); break;
      case "PLAN_CHANGE":
        setCompanyPlan(undo.companyId, undo.previousPlan); break;
      case "DUE_CHANGE":
        setCompanyDueDate(undo.companyId, undo.previousDueDate); break;
      case "SETTINGS_UPDATE":
        updateSaaSSettings(undo.previousSettings); break;
      case "COMPANY_DELETE":
        return { ok: false, reason: "Reversão de exclusão de empresa não é suportada nesta fase. Recadastre manualmente." };
    }
    markLogReverted(logId);
    tick();
    logEvent({
      kind: "SETTINGS_UPDATE", company_id: null, companyName: "Plataforma",
      user: realUser?.name ?? "Sistema",
      action: `Reversão aplicada (log ${logId}): estado anterior restaurado [${undo.type}].`,
    });
    return { ok: true };
  }, [realUser, setCompanyStatus, setCompanyPlan, setCompanyDueDate, tick]);

  return (
    <Ctx.Provider value={{
      user, company, companies: COMPANIES, users: SAAS_USERS, ready,
      loginWithCredentials, logout, hasRole,
      setCompanyStatus, setCompanyPlan, setCompanyDueDate, activateRevenue,
      updatePassword, changeOwnPassword, completeOnboarding,
      createDemoAccess, processWebhookPayment,
      countUsers, canAddUser, inviteUser,
      countCashiers, canAddCashier, createCashier, deleteCashier,
      deleteCompany, revertLog,
      impersonating: !!impersonatedCompanyId, impersonatedCompany,
      startImpersonation, stopImpersonation,
      refresh,
      lastSync,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useSaaS(): SaaSCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSaaS must be used within SaaSProvider");
  return ctx;
}

export const ROLE_LABEL: Record<Role, string> = {
  super_admin: "Super Admin",
  admin: "Dono / Gerente",
  cashier: "Operador de Caixa",
};

export const STATUS_LABEL: Record<SubscriptionStatus, string> = {
  trial: "Trial",
  active: "Ativa",
  pending: "Vencendo",
  blocked: "Bloqueada",
  canceled: "Cancelada",
};