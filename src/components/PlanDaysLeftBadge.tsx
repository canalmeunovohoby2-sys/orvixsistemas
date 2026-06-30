import { useEffect, useMemo, useState } from "react";
import { CalendarClock, AlertTriangle } from "lucide-react";
import { useSaaS } from "@/lib/saas-context";

/**
 * Dias restantes do plano — calculado a partir de `companies.due_date`
 * em relação à data de hoje (comparação em UTC para evitar oscilação
 * por fuso). Atualiza sozinho a cada hora.
 *
 * Cores:
 *   > 7 dias  → neutro (verde discreto)
 *   3–7 dias  → âmbar (aviso)
 *   < 3 dias  → vermelho (urgente)
 *   vencido   → destrutivo "Plano vencido"
 */
export function PlanDaysLeftBadge({ compact = false }: { compact?: boolean }) {
  const { company } = useSaaS();
  const [, force] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => force((n) => n + 1), 60 * 60 * 1000);
    return () => window.clearInterval(t);
  }, []);

  const info = useMemo(() => {
    const raw = company?.dueDate;
    if (!raw) return null;
    const due = new Date(raw);
    if (isNaN(due.getTime())) return null;
    const today = new Date();
    const a = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
    const b = Date.UTC(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate());
    const days = Math.round((b - a) / 86400000);
    return { days, dueLocal: due.toLocaleDateString("pt-BR") };
  }, [company?.dueDate]);

  if (!info) return null;

  const { days, dueLocal } = info;
  const expired = days < 0;
  const tone =
    expired ? "border-destructive/50 bg-destructive/10 text-destructive"
    : days < 3 ? "border-destructive/40 bg-destructive/10 text-destructive"
    : days <= 7 ? "border-amber-400/50 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
    : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  const Icon = expired || days < 3 ? AlertTriangle : CalendarClock;
  const label = expired
    ? `Plano vencido há ${Math.abs(days)} dia${Math.abs(days) === 1 ? "" : "s"}`
    : days === 0
      ? "Vence hoje"
      : `${days} dia${days === 1 ? "" : "s"} restante${days === 1 ? "" : "s"}`;

  return (
    <span
      title={`Vencimento do plano: ${dueLocal}`}
      className={
        "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold whitespace-nowrap " +
        tone
      }
      aria-label={`${label}. Vencimento ${dueLocal}.`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      {compact ? label : <>{label} <span className="font-normal opacity-75">· {dueLocal}</span></>}
    </span>
  );
}