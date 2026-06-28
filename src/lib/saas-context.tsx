import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";

export type Role = "super_admin" | "admin" | "cashier";

export type SubscriptionStatus = "trial" | "active" | "overdue" | "canceled";
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
};

export type SaaSUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  /** null para super_admin (acesso global) */
  companyId: string | null;
};

export const COMPANIES: Company[] = [
  { id: "EMP001", razaoSocial: "Orvix Comercial LTDA", fantasia: "Mercadinho Orvix", cnpj: "12.345.678/0001-90", status: "active",  plan: "pro",        mrr: 349.00, createdAt: "2025-01-12" },
  { id: "EMP002", razaoSocial: "Padaria Trigo Dourado ME", fantasia: "Trigo Dourado", cnpj: "98.765.432/0001-10", status: "trial",   plan: "starter",    mrr: 0,      createdAt: "2026-06-02" },
  { id: "EMP003", razaoSocial: "Açougue Boi Bom LTDA", fantasia: "Boi Bom", cnpj: "55.444.333/0001-22", status: "overdue", plan: "starter",    mrr: 149.00, createdAt: "2025-11-20" },
  { id: "EMP004", razaoSocial: "Distribuidora Norte SA", fantasia: "Norte Distribuição", cnpj: "11.222.333/0001-44", status: "active",  plan: "enterprise", mrr: 1290.00, createdAt: "2024-08-30" },
];

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
};

const Ctx = createContext<SaaSCtx | null>(null);

export function SaaSProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

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
  }, []);

  const logout = useCallback(() => {
    setUserId(null);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }, []);

  const user = hydrated ? SAAS_USERS.find((u) => u.id === userId) ?? null : null;
  const company = user?.companyId ? COMPANIES.find((c) => c.id === user.companyId) ?? null : null;

  const hasRole = useCallback(
    (...roles: Role[]) => !!user && roles.includes(user.role),
    [user],
  );

  return (
    <Ctx.Provider value={{ user, company, companies: COMPANIES, loginAs, logout, hasRole }}>
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
  overdue: "Inadimplente",
  canceled: "Cancelada",
};
