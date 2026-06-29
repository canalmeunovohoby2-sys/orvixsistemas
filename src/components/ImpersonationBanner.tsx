import { useSaaS } from "@/lib/saas-context";
import { useNavigate } from "@tanstack/react-router";
import { ShieldAlert, LogOut } from "lucide-react";
import { toast } from "sonner";

/**
 * Banner flutuante de impersonação. Visível quando o Super Admin assume
 * temporariamente o papel de admin de uma empresa para suporte técnico.
 */
export function ImpersonationBanner() {
  const { impersonating, impersonatedCompany, stopImpersonation } = useSaaS();
  const navigate = useNavigate();
  if (!impersonating || !impersonatedCompany) return null;

  return (
    <div
      role="alert"
      className="fixed left-1/2 -translate-x-1/2 top-3 z-[100] max-w-[640px] w-[calc(100%-1.5rem)] rounded-xl border border-destructive/60 bg-destructive text-destructive-foreground shadow-2xl px-4 py-2.5 flex items-center gap-3 animate-in fade-in slide-in-from-top-4"
    >
      <ShieldAlert className="w-5 h-5 shrink-0" />
      <div className="text-sm leading-tight min-w-0 flex-1">
        <p className="font-bold uppercase tracking-wide text-[11px] opacity-90">Modo Suporte ativo</p>
        <p className="truncate">
          Impersonando <strong>{impersonatedCompany.fantasia}</strong> · {impersonatedCompany.cnpj}
        </p>
      </div>
      <button
        onClick={() => {
          stopImpersonation();
          toast.success("Modo suporte encerrado.");
          navigate({ to: "/super-admin" });
        }}
        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-background/15 hover:bg-background/25 text-xs font-semibold transition-colors"
      >
        <LogOut className="w-3.5 h-3.5" /> Sair
      </button>
    </div>
  );
}