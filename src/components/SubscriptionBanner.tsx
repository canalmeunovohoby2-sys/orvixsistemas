import { Link, useRouterState } from "@tanstack/react-router";
import { AlertCircle } from "lucide-react";
import { useSaaS } from "@/lib/saas-context";

/**
 * Banner fixo de aviso de assinatura.
 * - status "pending"  → barra amarela discreta com CTA.
 * - demais status     → nada (bloqueio total acontece via RoleGuard).
 */
export function SubscriptionBanner() {
  const { user, company } = useSaaS();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname === "/") return null;
  if (!user || user.role === "super_admin") return null;
  if (!company || company.status !== "pending") return null;

  return (
    <div
      role="status"
      className="sticky top-0 z-[55] w-full bg-amber-400/95 dark:bg-amber-500/90 text-amber-950 dark:text-amber-50 border-b border-amber-600/40"
    >
      <div className="px-3 lg:px-6 h-9 flex items-center gap-2 text-xs sm:text-sm">
        <AlertCircle className="w-4 h-4 shrink-0" />
        <span className="font-medium truncate">
          Sua assinatura vence em breve. Regularize seu plano clicando aqui.
        </span>
        <Link
          to="/assinatura"
          className="ml-auto inline-flex items-center px-2.5 py-1 rounded bg-amber-950/15 hover:bg-amber-950/25 dark:bg-amber-950/30 dark:hover:bg-amber-950/50 font-semibold uppercase tracking-wide text-[11px]"
        >
          Regularizar
        </Link>
      </div>
    </div>
  );
}