import { useEffect, useState, type ReactNode } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useSaaS, type Role } from "@/lib/saas-context";
import { ShieldAlert } from "lucide-react";

/**
 * Protege uma rota verificando se o usuário logado tem um dos papéis permitidos.
 * - Sem sessão: redireciona para /login.
 * - Sessão sem permissão: caixa vai para /caixa; super_admin para /super-admin; admin vai para /dashboard.
 */
export function RoleGuard({ allow, children }: { allow: Role[]; children: ReactNode }) {
  const { user, company, ready } = useSaaS();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted || !ready) return;
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    // Bloqueio progressivo da assinatura: empresa BLOQUEADA → /assinatura.
    // super_admin nunca é bloqueado (gerencia a plataforma).
    if (
      user.role !== "super_admin" &&
      company?.status === "blocked" &&
      pathname !== "/assinatura"
    ) {
      navigate({ to: "/assinatura" });
      return;
    }
    // Vencimento da assinatura (D0+): bloqueio efetivo mesmo se o status
    // ainda não foi marcado como `blocked` pelo backend.
    if (user.role !== "super_admin" && company?.dueDate && pathname !== "/assinatura") {
      const due = new Date(company.dueDate);
      if (!Number.isNaN(due.getTime())) {
        const a = Date.UTC(due.getFullYear(), due.getMonth(), due.getDate());
        const now = new Date();
        const b = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
        if (a - b <= 0) {
          navigate({ to: "/assinatura" });
          return;
        }
      }
    }
    if (!allow.includes(user.role)) {
      if (user.role === "cashier") navigate({ to: "/caixa" });
      else if (user.role === "super_admin") navigate({ to: "/super-admin" });
      else navigate({ to: "/dashboard" });
    }
  }, [mounted, ready, user, company, pathname, allow, navigate]);

  if (!mounted || !ready) {
    return <div className="min-h-[60vh] grid place-items-center text-sm text-muted-foreground">Carregando…</div>;
  }
  if (!user || !allow.includes(user.role)) {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <div className="text-center max-w-sm space-y-2">
          <ShieldAlert className="w-10 h-10 mx-auto text-muted-foreground" />
          <p className="font-semibold">Acesso restrito</p>
          <p className="text-sm text-muted-foreground">Você não tem permissão para acessar esta área. Redirecionando…</p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
