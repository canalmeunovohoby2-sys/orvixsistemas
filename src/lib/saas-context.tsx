import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import {
  logEvent, markLogReverted, SAAS_SETTINGS, updateSaaSSettings,
  type SaaSSettings, type Product, type Sale, type Movement, type Person,
  type FinancialRecord, type SupportTicket,
  PRODUCTS, SALES, MOVEMENTS, SUPPLIERS, CUSTOMERS,
  FINANCIAL_RECORDS, SUPPORT_TICKETS, SYSTEM_LOGS,
} from "./mock-data";

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
  /** Data de vencimento da próxima fatura (ISO). */
  dueDate: string;
};

export type SaaSUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  /** null para super_admin (acesso global) */
  companyId: string | null;
  /** Senha do usuário. Em produção fica hasheada no backend. */
  password: string;
  /** Quando true, o login força a abertura do modal de troca obrigatória. */
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

/**
 * Limites estritos de cada plano da ORVIX SISTEMAS.
 * - `caixas`: PDVs simultaneamente abertos por empresa.
 * - `users`: usuários (admin/cashier) cadastrados na empresa.
 * - `advancedReports`: libera Lucro Real & Desempenho Financeiro.
 */
export const PLAN_LIMITS: Record<Plan, { caixas: number; users: number; advancedReports: boolean }> = {
  bronze: { caixas: 1, users: 1, advancedReports: false },
  prata:  { caixas: 3, users: 5, advancedReports: false },
  ouro:   { caixas: Infinity, users: Infinity, advancedReports: true },
};

// MRR inicia em 0 para todas as empresas-seed — o faturamento real só passa a contar
// quando uma venda é registrada no PDV (activateRevenue) ou quando o Super Admin
// simula o pagamento ativamente para a empresa.
const SEED_COMPANIES: Company[] = [
  { id: "EMP001", razaoSocial: "Orvix Comercial LTDA",    fantasia: "Mercadinho Orvix",  cnpj: "12.345.678/0001-90", status: "active",  plan: "prata",  mrr: 0, createdAt: "2025-01-12", dueDate: "2026-07-12" },
  { id: "EMP002", razaoSocial: "Padaria Trigo Dourado ME",fantasia: "Trigo Dourado",     cnpj: "98.765.432/0001-10", status: "active",  plan: "bronze", mrr: 0, createdAt: "2026-06-02", dueDate: "2026-07-16" },
  { id: "EMP003", razaoSocial: "Açougue Boi Bom LTDA",    fantasia: "Boi Bom",           cnpj: "55.444.333/0001-22", status: "blocked", plan: "bronze", mrr: 0, createdAt: "2025-11-20", dueDate: "2026-05-20" },
  { id: "EMP004", razaoSocial: "Distribuidora Norte SA",  fantasia: "Norte Distribuição",cnpj: "11.222.333/0001-44", status: "pending", plan: "ouro",   mrr: 0, createdAt: "2024-08-30", dueDate: "2026-07-04" },
];

/** Lista mutável compartilhada (super_admin pode alterar status em runtime). */
export const COMPANIES: Company[] = [...SEED_COMPANIES];

export const SAAS_USERS: SaaSUser[] = [
  { id: "U000", name: "Tiago (Orvix Sistemas)", email: "orvixsistemas@gmail.com", role: "super_admin", companyId: null, password: "admin123", isTemporaryPassword: false },
  { id: "U001", name: "Ana Mendes",    email: "ana@orvix.com.br",   role: "admin",       companyId: "EMP001",password: "123",     isTemporaryPassword: false },
  { id: "U002", name: "Bruno Caixa",   email: "bruno@orvix.com.br", role: "cashier",     companyId: "EMP001",password: "123",     isTemporaryPassword: false },
  { id: "U003", name: "Carla Souza",   email: "carla@trigo.com.br", role: "admin",       companyId: "EMP002",password: "123",     isTemporaryPassword: false },
  // Conta de validação do fluxo de Primeiro Acesso (Sessões 3, 4 e 18).
  { id: "U004", name: "Novo Cliente",  email: "novo-cliente@orvix.com.br", role: "admin", companyId: "EMP001", password: "temp123", isTemporaryPassword: true },
];

const STORAGE_KEY = "saas_session_user_id";

/** E-mail único autorizado a acessar o Painel Master da ORVIX SISTEMAS. */
export const SUPER_ADMIN_EMAIL = "orvixsistemas@gmail.com";

/**
 * Snapshots de reversão anexados a logs críticos.
 * Cada variante carrega o estado anterior suficiente para restaurar a operação.
 */
export type UndoPayload =
  | { type: "COMPANY_DELETE"; company: Company; users: SaaSUser[];
      products: unknown[]; sales: unknown[]; movements: unknown[];
      suppliers: unknown[]; customers: unknown[];
      financialRecords: unknown[]; supportTickets: unknown[] }
  | { type: "PLAN_CHANGE"; companyId: string; previousPlan: Plan; previousMrr: number }
  | { type: "DUE_CHANGE"; companyId: string; previousDueDate: string }
  | { type: "SUBSCRIPTION_CHANGE"; companyId: string; previousStatus: SubscriptionStatus }
  | { type: "SETTINGS_UPDATE"; previousSettings: SaaSSettings };

type SaaSCtx = {
  user: SaaSUser | null;
  company: Company | null;
  companies: Company[];
  users: SaaSUser[];
  loginAs: (userId: string) => void;
  /** Autenticação real por e-mail + senha contra o store. */
  loginWithCredentials: (email: string, password: string) => { ok: boolean; user?: SaaSUser; reason?: string };
  logout: () => void;
  hasRole: (...roles: Role[]) => boolean;
  setCompanyStatus: (companyId: string, status: SubscriptionStatus) => void;
  setCompanyPlan: (companyId: string, plan: Plan) => void;
  setCompanyDueDate: (companyId: string, isoDate: string) => void;
  /** Ativa o MRR real da empresa (chamado na 1ª venda do PDV ou simulação de pagamento). */
  activateRevenue: (companyId: string) => void;
  /** Atualiza senha do usuário e zera o flag de primeiro acesso. */
  updatePassword: (userId: string, newPassword: string) => void;
  /** Simula a criação de uma nova empresa pós-venda + usuário admin com senha temporária. */
  createDemoAccess: () => { user: SaaSUser; company: Company };
  /** Conta admins/cashiers cadastrados na empresa (não conta super_admin). */
  countUsers: (companyId: string) => number;
  /** Verifica se a empresa pode receber mais um usuário conforme PLAN_LIMITS. */
  canAddUser: (companyId: string) => { ok: boolean; reason?: string };
  /** Convida (mock) um novo usuário. Aplica trava do plano antes de criar. */
  inviteUser: (companyId: string, role: Exclude<Role, "super_admin">) => { ok: boolean; user?: SaaSUser; reason?: string };
  /** Remove a empresa e TODOS os dados vinculados (usuários, produtos, vendas, financeiro, tickets, logs). */
  deleteCompany: (companyId: string) => { ok: boolean; reason?: string };
  /** Reverte o estado capturado no `undo` de um log de auditoria. */
  revertLog: (logId: string) => { ok: boolean; reason?: string };
  /** Suporte/impersonação — super_admin assume o papel de admin de uma empresa. */
  impersonating: boolean;
  impersonatedCompany: Company | null;
  startImpersonation: (companyId: string) => void;
  stopImpersonation: () => void;
};

const Ctx = createContext<SaaSCtx | null>(null);

export function SaaSProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [, setCompaniesTick] = useState(0);
  const [impersonatedCompanyId, setImpersonatedCompanyId] = useState<string | null>(null);
  const [originalUserId, setOriginalUserId] = useState<string | null>(null);
  const [, setUsersTick] = useState(0);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setUserId(stored);
    } catch {}
    setHydrated(true);
  }, []);

  const loginAs = useCallback((id: string) => {
    setUserId(id);
    try { localStorage.setItem(STORAGE_KEY, id); } catch {}
    const u = SAAS_USERS.find((x) => x.id === id);
    if (u) {
      const comp = u.companyId ? COMPANIES.find((c) => c.id === u.companyId) : null;
      logEvent({
        kind: "LOGIN_OK",
        company_id: u.companyId,
        companyName: comp?.fantasia ?? "Plataforma",
        user: u.name,
        action: `Login efetuado (${u.role}).`,
      });
    }
  }, []);

  const loginWithCredentials = useCallback(
    (email: string, password: string) => {
      const target = SAAS_USERS.find(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password,
      );
      if (!target) return { ok: false, reason: "E-mail ou senha incorretos." };
      setUserId(target.id);
      try { localStorage.setItem(STORAGE_KEY, target.id); } catch {}
      const comp = target.companyId ? COMPANIES.find((c) => c.id === target.companyId) : null;
      logEvent({
        kind: "LOGIN_OK",
        company_id: target.companyId,
        companyName: comp?.fantasia ?? "Plataforma",
        user: target.name,
        action: `Login efetuado (${target.role}).`,
      });
      return { ok: true, user: target };
    },
    [],
  );

  const logout = useCallback(() => {
    setUserId(null);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    setImpersonatedCompanyId(null);
    setOriginalUserId(null);
  }, []);

  const realUser = hydrated ? SAAS_USERS.find((u) => u.id === userId) ?? null : null;

  // Quando o super_admin inicia uma impersonação, o usuário "efetivo" passa a
  // ser um admin virtual da empresa-alvo (mantendo o id/nome originais para auditoria).
  let user: SaaSUser | null = realUser;
  let company: Company | null = realUser?.companyId ? COMPANIES.find((c) => c.id === realUser.companyId) ?? null : null;
  const impersonatedCompany = impersonatedCompanyId ? COMPANIES.find((c) => c.id === impersonatedCompanyId) ?? null : null;
  if (realUser?.role === "super_admin" && impersonatedCompany) {
    user = {
      id: realUser.id,
      name: `${realUser.name} (Suporte)`,
      email: realUser.email,
      role: "admin",
      companyId: impersonatedCompany.id,
      password: realUser.password,
      isTemporaryPassword: false,
    };
    company = impersonatedCompany;
  }

  const hasRole = useCallback(
    (...roles: Role[]) => !!user && roles.includes(user.role),
    [user],
  );

  const setCompanyStatus = useCallback((companyId: string, status: SubscriptionStatus) => {
    const c = COMPANIES.find((x) => x.id === companyId);
    if (!c) return;
    const prev = c.status;
    c.status = status;
    setCompaniesTick((t) => t + 1);
    logEvent({
      kind: "SUBSCRIPTION_CHANGE",
      company_id: c.id, companyName: c.fantasia,
      user: realUser?.name ?? "Sistema",
      action: `Status alterado: ${prev.toUpperCase()} → ${status.toUpperCase()}.`,
      undo: { type: "SUBSCRIPTION_CHANGE", companyId: c.id, previousStatus: prev } satisfies UndoPayload,
    });
  }, [realUser]);

  const setCompanyPlan = useCallback((companyId: string, plan: Plan) => {
    const c = COMPANIES.find((x) => x.id === companyId);
    if (!c) return;
    const prev = c.plan;
    const prevMrr = c.mrr;
    c.plan = plan;
    // Mantém o princípio de "recontagem": só ajusta MRR se a empresa já estava faturando.
    if (c.status === "active" && c.mrr > 0) c.mrr = PLAN_PRICE[plan];
    setCompaniesTick((t) => t + 1);
    logEvent({
      kind: "PLAN_CHANGE",
      company_id: c.id, companyName: c.fantasia,
      user: realUser?.name ?? "Sistema",
      action: `Plano alterado: ${PLAN_LABEL[prev]} → ${PLAN_LABEL[plan]}.`,
      undo: { type: "PLAN_CHANGE", companyId: c.id, previousPlan: prev, previousMrr: prevMrr } satisfies UndoPayload,
    });
  }, [realUser]);

  const setCompanyDueDate = useCallback((companyId: string, isoDate: string) => {
    const c = COMPANIES.find((x) => x.id === companyId);
    if (!c) return;
    const prev = c.dueDate;
    c.dueDate = isoDate;
    setCompaniesTick((t) => t + 1);
    logEvent({
      kind: "DUE_CHANGE",
      company_id: c.id, companyName: c.fantasia,
      user: realUser?.name ?? "Sistema",
      action: `Vencimento alterado: ${prev?.slice(0, 10)} → ${isoDate.slice(0, 10)}.`,
      undo: { type: "DUE_CHANGE", companyId: c.id, previousDueDate: prev } satisfies UndoPayload,
    });
  }, [realUser]);

  const activateRevenue = useCallback((companyId: string) => {
    const c = COMPANIES.find((x) => x.id === companyId);
    if (!c) return;
    if (c.status !== "active" || c.mrr > 0) return;
    c.mrr = PLAN_PRICE[c.plan];
    setCompaniesTick((t) => t + 1);
    logEvent({
      kind: "SETTINGS_UPDATE",
      company_id: c.id, companyName: c.fantasia,
      user: realUser?.name ?? "Sistema",
      action: `Faturamento ativado — MRR ${PLAN_LABEL[c.plan]} reconhecido (${PLAN_PRICE[c.plan].toFixed(2)}).`,
    });
  }, [realUser]);

  const startImpersonation = useCallback((companyId: string) => {
    if (realUser?.role !== "super_admin") return;
    const target = COMPANIES.find((c) => c.id === companyId);
    if (!target) return;
    setOriginalUserId(realUser.id);
    setImpersonatedCompanyId(companyId);
    logEvent({
      kind: "IMPERSONATION_START",
      company_id: target.id, companyName: target.fantasia,
      user: realUser.name,
      action: `Super Admin iniciou modo suporte (impersonação) em ${target.fantasia}.`,
    });
  }, [realUser]);

  const stopImpersonation = useCallback(() => {
    const target = impersonatedCompanyId ? COMPANIES.find((c) => c.id === impersonatedCompanyId) : null;
    setImpersonatedCompanyId(null);
    setOriginalUserId(null);
    if (target && realUser) {
      logEvent({
        kind: "IMPERSONATION_END",
        company_id: target.id, companyName: target.fantasia,
        user: realUser.name,
        action: `Super Admin encerrou impersonação em ${target.fantasia}.`,
      });
    }
  }, [impersonatedCompanyId, realUser]);

  const updatePassword = useCallback((id: string, newPassword: string) => {
    const u = SAAS_USERS.find((x) => x.id === id);
    if (!u) return;
    u.password = newPassword;
    u.isTemporaryPassword = false;
    setUsersTick((t) => t + 1);
    const comp = u.companyId ? COMPANIES.find((c) => c.id === u.companyId) : null;
    logEvent({
      kind: "SETTINGS_UPDATE",
      company_id: u.companyId,
      companyName: comp?.fantasia ?? "Plataforma",
      user: u.name,
      action: "Senha de primeiro acesso atualizada com sucesso (ORVIX SISTEMAS).",
    });
  }, []);

  const createDemoAccess = useCallback(() => {
    const seq = COMPANIES.length + 1;
    const id = `EMP${String(seq).padStart(3, "0")}`;
    const newCompany: Company = {
      id,
      razaoSocial: `Cliente ORVIX ${seq} LTDA`,
      fantasia: `Loja ORVIX #${seq}`,
      cnpj: "00.000.000/0001-00",
      status: "active",
      plan: "bronze",
      mrr: 0,
      createdAt: new Date().toISOString().slice(0, 10),
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString(),
    };
    COMPANIES.push(newCompany);
    // Pagamento simulado ativamente → reconhece MRR da nova empresa.
    newCompany.mrr = PLAN_PRICE[newCompany.plan];
    const newUser: SaaSUser = {
      id: `U${String(100 + SAAS_USERS.length).padStart(3, "0")}`,
      name: `Admin ${newCompany.fantasia}`,
      email: `cliente${seq}@orvix.com.br`,
      role: "admin",
      companyId: newCompany.id,
      password: "temp123",
      isTemporaryPassword: true,
    };
    SAAS_USERS.push(newUser);
    setCompaniesTick((t) => t + 1);
    setUsersTick((t) => t + 1);
    logEvent({
      kind: "SETTINGS_UPDATE",
      company_id: newCompany.id,
      companyName: newCompany.fantasia,
      user: realUser?.name ?? "Sistema",
      action: `Venda automatizada — acesso ORVIX criado para ${newUser.email} (senha temporária) · cópia administrativa para ${SUPER_ADMIN_EMAIL}.`,
    });
    return { user: newUser, company: newCompany };
  }, [realUser]);

  const countUsers = useCallback(
    (companyId: string) => SAAS_USERS.filter((u) => u.companyId === companyId).length,
    [],
  );

  const canAddUser = useCallback((companyId: string) => {
    const c = COMPANIES.find((x) => x.id === companyId);
    if (!c) return { ok: false, reason: "Empresa não encontrada." };
    const limit = PLAN_LIMITS[c.plan].users;
    const current = SAAS_USERS.filter((u) => u.companyId === companyId).length;
    if (current >= limit) {
      return {
        ok: false,
        reason: `🚫 Limite Atingido: Seu plano ${PLAN_LABEL[c.plan]} permite até ${limit === Infinity ? "∞" : limit} usuário(s). Faça upgrade para o Plano ${c.plan === "bronze" ? "Prata ou Ouro" : "Ouro"}!`,
      };
    }
    return { ok: true };
  }, []);

  const inviteUser = useCallback((companyId: string, role: Exclude<Role, "super_admin">) => {
    const guard = canAddUser(companyId);
    if (!guard.ok) return { ok: false, reason: guard.reason };
    const c = COMPANIES.find((x) => x.id === companyId)!;
    const newUser: SaaSUser = {
      id: `U${String(100 + SAAS_USERS.length).padStart(3, "0")}`,
      name: `${role === "admin" ? "Gerente" : "Operador"} #${SAAS_USERS.length + 1}`,
      email: `usuario${SAAS_USERS.length + 1}@${c.fantasia.toLowerCase().replace(/\W+/g, "")}.com.br`,
      role,
      companyId,
      password: "temp123",
      isTemporaryPassword: true,
    };
    SAAS_USERS.push(newUser);
    setUsersTick((t) => t + 1);
    logEvent({
      kind: "SETTINGS_UPDATE",
      company_id: c.id, companyName: c.fantasia,
      user: realUser?.name ?? "Sistema",
      action: `Convite enviado para ${newUser.email} (${role}) — plano ${PLAN_LABEL[c.plan]}.`,
    });
    return { ok: true, user: newUser };
  }, [canAddUser, realUser]);

  const deleteCompany = useCallback((companyId: string) => {
    const idx = COMPANIES.findIndex((x) => x.id === companyId);
    if (idx < 0) return { ok: false, reason: "Empresa não encontrada." };
    const c = COMPANIES[idx];
    // Captura snapshot ANTES de purgar — habilita reversão completa via Auditoria.
    const snapshot = {
      type: "COMPANY_DELETE" as const,
      company: { ...c },
      users: SAAS_USERS.filter((u) => u.companyId === companyId).map((u) => ({ ...u })),
      products: PRODUCTS.filter((p) => p.company_id === companyId).map((p) => ({ ...p })),
      sales: SALES.filter((s) => s.company_id === companyId).map((s) => ({ ...s })),
      movements: MOVEMENTS.filter((m) => m.company_id === companyId).map((m) => ({ ...m })),
      suppliers: SUPPLIERS.filter((s) => s.company_id === companyId).map((s) => ({ ...s })),
      customers: CUSTOMERS.filter((s) => s.company_id === companyId).map((s) => ({ ...s })),
      financialRecords: FINANCIAL_RECORDS.filter((f) => f.company_id === companyId).map((f) => ({ ...f })),
      supportTickets: SUPPORT_TICKETS.filter((t) => t.company_id === companyId).map((t) => ({ ...t })),
    } satisfies UndoPayload;
    // Remove dados vinculados (in-place para preservar referências exportadas).
    const purge = <T extends { company_id?: string | null }>(arr: T[]) => {
      for (let i = arr.length - 1; i >= 0; i--) {
        if (arr[i].company_id === companyId) arr.splice(i, 1);
      }
    };
    purge(PRODUCTS as Array<{ company_id?: string | null }>);
    purge(SALES as Array<{ company_id?: string | null }>);
    purge(MOVEMENTS as Array<{ company_id?: string | null }>);
    purge(SUPPLIERS as Array<{ company_id?: string | null }>);
    purge(CUSTOMERS as Array<{ company_id?: string | null }>);
    purge(FINANCIAL_RECORDS as Array<{ company_id?: string | null }>);
    purge(SUPPORT_TICKETS as Array<{ company_id?: string | null }>);
    // NOTA: SYSTEM_LOGS são preservados intencionalmente para manter o histórico de auditoria.
    // Remove usuários vinculados.
    for (let i = SAAS_USERS.length - 1; i >= 0; i--) {
      if (SAAS_USERS[i].companyId === companyId) SAAS_USERS.splice(i, 1);
    }
    COMPANIES.splice(idx, 1);
    if (impersonatedCompanyId === companyId) {
      setImpersonatedCompanyId(null);
      setOriginalUserId(null);
    }
    setCompaniesTick((t) => t + 1);
    setUsersTick((t) => t + 1);
    logEvent({
      kind: "SETTINGS_UPDATE",
      company_id: null,
      companyName: "Plataforma",
      user: realUser?.name ?? "Sistema",
      action: `Empresa removida permanentemente: ${c.fantasia} (${c.cnpj}). Todos os dados vinculados foram apagados.`,
      undo: snapshot,
    });
    return { ok: true };
  }, [impersonatedCompanyId, realUser]);

  const revertLog = useCallback((logId: string) => {
    const log = SYSTEM_LOGS.find((l) => l.id === logId);
    if (!log) return { ok: false, reason: "Log não encontrado." };
    if (log.reverted) return { ok: false, reason: "Este evento já foi revertido." };
    const undo = log.undo as UndoPayload | undefined;
    if (!undo) return { ok: false, reason: "Este evento não é elegível para reversão." };

    switch (undo.type) {
      case "SUBSCRIPTION_CHANGE": {
        const c = COMPANIES.find((x) => x.id === undo.companyId);
        if (!c) return { ok: false, reason: "Empresa não existe mais." };
        c.status = undo.previousStatus;
        break;
      }
      case "PLAN_CHANGE": {
        const c = COMPANIES.find((x) => x.id === undo.companyId);
        if (!c) return { ok: false, reason: "Empresa não existe mais." };
        c.plan = undo.previousPlan;
        c.mrr = undo.previousMrr;
        break;
      }
      case "DUE_CHANGE": {
        const c = COMPANIES.find((x) => x.id === undo.companyId);
        if (!c) return { ok: false, reason: "Empresa não existe mais." };
        c.dueDate = undo.previousDueDate;
        break;
      }
      case "SETTINGS_UPDATE": {
        updateSaaSSettings(undo.previousSettings);
        break;
      }
      case "COMPANY_DELETE": {
        if (COMPANIES.some((x) => x.id === undo.company.id)) {
          return { ok: false, reason: "A empresa já foi restaurada." };
        }
        COMPANIES.push({ ...undo.company });
        undo.users.forEach((u) => SAAS_USERS.push({ ...u }));
        (PRODUCTS as Product[]).push(...(undo.products as Product[]));
        (SALES as Sale[]).push(...(undo.sales as Sale[]));
        (MOVEMENTS as Movement[]).push(...(undo.movements as Movement[]));
        (SUPPLIERS as Person[]).push(...(undo.suppliers as Person[]));
        (CUSTOMERS as Person[]).push(...(undo.customers as Person[]));
        (FINANCIAL_RECORDS as FinancialRecord[]).push(...(undo.financialRecords as FinancialRecord[]));
        (SUPPORT_TICKETS as SupportTicket[]).push(...(undo.supportTickets as SupportTicket[]));
        break;
      }
    }

    markLogReverted(logId);
    setCompaniesTick((t) => t + 1);
    setUsersTick((t) => t + 1);
    logEvent({
      kind: "SETTINGS_UPDATE",
      company_id: null,
      companyName: "Plataforma",
      user: realUser?.name ?? "Sistema",
      action: `Reversão aplicada (log ${logId}): estado anterior restaurado [${undo.type}].`,
    });
    return { ok: true };
  }, [realUser]);

  // referência apenas para silenciar o linter sobre originalUserId
  void originalUserId;

  return (
    <Ctx.Provider
      value={{
        user, company, companies: COMPANIES, users: SAAS_USERS,
        loginAs, loginWithCredentials, logout, hasRole,
        setCompanyStatus, setCompanyPlan, setCompanyDueDate, activateRevenue,
        updatePassword, createDemoAccess,
        countUsers, canAddUser, inviteUser,
        deleteCompany, revertLog,
        impersonating: !!impersonatedCompanyId, impersonatedCompany,
        startImpersonation, stopImpersonation,
      }}
    >
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
