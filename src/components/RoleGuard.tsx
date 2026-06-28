import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useSaaS, type Role } from "@/lib/saas-context";
import { ShieldAlert } from "lucide-react";

/**
 * Protege uma rota verificando se o usuário logado tem um dos papéis permitidos.
 * - Sem sessão: redireciona para /login.
 * - Sessão sem permissão: caixa vai para /vendas; super_admin para /super-admin; demais ficam bloqueados.
 */
export function RoleGuard({ allow, children }: { allow: Role[]; children: ReactNode }) {
  const { user } = useSaaS();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    if (!allow.includes(user.role)) {
      if (user.role === "cashier") navigate({ to: "/vendas" });
      else if (user.role === "super_admin") navigate({ to: "/super-admin" });
      else navigate({ to: "/" });
    }
  }, [mounted, user, allow, navigate]);

  if (!mounted) {
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
