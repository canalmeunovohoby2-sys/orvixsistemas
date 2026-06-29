import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { logEvent } from "./mock-data";

export type Role = "super_admin" | "admin" | "cashier";

export type SubscriptionStatus = "trial" | "active" | "pending" | "blocked" | "canceled";
export type Plan = "starter" | "pro" | "enterprise";

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
};

export const PLAN_PRICE: Record<Plan, number> = {
  starter: 149,
  pro: 349,
  enterprise: 1290,
};
export const PLAN_LABEL: Record<Plan, string> = {
  starter: "Starter",
  pro: "Pro",
  enterprise: "Enterprise",
};

const SEED_COMPANIES: Company[] = [
  { id: "EMP001", razaoSocial: "Orvix Comercial LTDA",    fantasia: "Mercadinho Orvix",  cnpj: "12.345.678/0001-90", status: "active",  plan: "pro",        mrr: 349.00, createdAt: "2025-01-12", dueDate: "2026-07-12" },
  { id: "EMP002", razaoSocial: "Padaria Trigo Dourado ME",fantasia: "Trigo Dourado",     cnpj: "98.765.432/0001-10", status: "trial",   plan: "starter",    mrr: 0,      createdAt: "2026-06-02", dueDate: "2026-07-16" },
  { id: "EMP003", razaoSocial: "Açougue Boi Bom LTDA",    fantasia: "Boi Bom",           cnpj: "55.444.333/0001-22", status: "blocked", plan: "starter",    mrr: 149.00, createdAt: "2025-11-20", dueDate: "2026-05-20" },
  { id: "EMP004", razaoSocial: "Distribuidora Norte SA",  fantasia: "Norte Distribuição",cnpj: "11.222.333/0001-44", status: "pending", plan: "enterprise", mrr: 1290.00,createdAt: "2024-08-30", dueDate: "2026-07-04" },
];

/** Lista mutável compartilhada (super_admin pode alterar status em runtime). */
export const COMPANIES: Company[] = [...SEED_COMPANIES];

export const SAAS_USERS: SaaSUser[] = [
  { id: "U000", name: "Ricardo Cunha (Plataforma)", email: "ricardo@orvix.app", role: "super_admin", companyId: null },
  { id: "U001", name: "Ana Mendes",                 email: "ana@orvix.com.br",  role: "admin",       companyId: "EMP001" },
  { id: "U002", name: "Bruno Caixa",                email: "bruno@orvix.com.br",role: "cashier",     companyId: "EMP001" },
  { id: "U003", name: "Carla (Trigo Dourado)",      email: "carla@trigo.com.br",role: "admin",       companyId: "EMP002" },
];

const STORAGE_KEY = "saas_session_user_id";

type SaaSCtx = {
  user: SaaSUser | null;
  company: Company | null;
  companies: Company[];
  loginAs: (userId: string) => void;
  logout: () => void;
  hasRole: (...roles: Role[]) => boolean;
  setCompanyStatus: (companyId: string, status: SubscriptionStatus) => void;
  setCompanyPlan: (companyId: string, plan: Plan) => void;
  setCompanyDueDate: (companyId: string, isoDate: string) => void;
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
    });
  }, [realUser]);

  const setCompanyPlan = useCallback((companyId: string, plan: Plan) => {
    const c = COMPANIES.find((x) => x.id === companyId);
    if (!c) return;
    const prev = c.plan;
    c.plan = plan;
    if (c.status === "active") c.mrr = PLAN_PRICE[plan];
    setCompaniesTick((t) => t + 1);
    logEvent({
      kind: "PLAN_CHANGE",
      company_id: c.id, companyName: c.fantasia,
      user: realUser?.name ?? "Sistema",
      action: `Plano alterado: ${PLAN_LABEL[prev]} → ${PLAN_LABEL[plan]}.`,
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

  // referência apenas para silenciar o linter sobre originalUserId
  void originalUserId;

  return (
    <Ctx.Provider
      value={{
        user, company, companies: COMPANIES, loginAs, logout, hasRole,
        setCompanyStatus, setCompanyPlan, setCompanyDueDate,
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
