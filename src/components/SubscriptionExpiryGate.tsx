import { useEffect, useMemo, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from "@/components/ui/alert-dialog";
import { useSaaS, PLAN_PRICE, PLAN_LABEL, PLAN_LIMITS, type Plan } from "@/lib/saas-context";
import { AlertTriangle, CreditCard, Lock, Check, Crown, Shield, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Monitor global de assinatura baseado em `company.dueDate`.
 * - D-3 / D-2 / D-1: Dialog (dispensável uma vez por dia/empresa) com vitrine de planos.
 * - D0 ou após o vencimento: AlertDialog não-dispensável + redireciono forçado para /assinatura.
 * - super_admin nunca é afetado. Rotas /assinatura e /login também ignoram.
 */

const PLAN_ORDER: Plan[] = ["bronze", "prata", "ouro"];

const PLAN_HIGHLIGHTS: Record<Plan, string[]> = {
  bronze: [
    `${PLAN_LIMITS.bronze.caixas} caixa / terminal`,
    `${PLAN_LIMITS.bronze.users} operador`,
    "Estoque e PDV completos",
    "Relatórios essenciais",
  ],
  prata: [
    `${PLAN_LIMITS.prata.caixas} caixas / terminais`,
    `Até ${PLAN_LIMITS.prata.users} operadores`,
    "Crediário e financeiro",
    "Suporte prioritário",
  ],
  ouro: [
    `${PLAN_LIMITS.ouro.caixas} caixas / terminais`,
    `Até ${PLAN_LIMITS.ouro.users} operadores`,
    "Relatórios avançados",
    "Atendimento dedicado",
  ],
};

const PLAN_ICON: Record<Plan, typeof Shield> = {
  bronze: Shield,
  prata: Sparkles,
  ouro: Crown,
};

function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const due = new Date(iso);
  if (Number.isNaN(due.getTime())) return null;
  // Compara em UTC puro para evitar deslocamento por fuso (ex.: due_date salvo
  // como 30/07 02:52 UTC virava 29/07 local em America/Sao_Paulo, gerando
  // bloqueios incorretos).
  const now = new Date();
  const a = Date.UTC(due.getUTCFullYear(), due.getUTCMonth(), due.getUTCDate());
  const b = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((a - b) / 86_400_000);
}

function todayUtcComparisonDate(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    .toISOString()
    .slice(0, 10);
}

function PlanShowcase({ currentPlan, onPick }: { currentPlan: Plan; onPick: () => void }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {PLAN_ORDER.map((plan) => {
        const Icon = PLAN_ICON[plan];
        const current = plan === currentPlan;
        return (
          <button
            key={plan}
            onClick={onPick}
            className={[
              "group text-left rounded-xl border bg-zinc-950/60 p-4 transition-all",
              "hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-12px_rgba(220,38,38,0.45)]",
              current
                ? "border-red-500/70 ring-1 ring-red-500/40"
                : "border-zinc-800 hover:border-red-500/50",
            ].join(" ")}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="grid place-items-center w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-red-900 text-white">
                  <Icon className="w-4 h-4" />
                </span>
                <span className="font-semibold text-zinc-100">{PLAN_LABEL[plan]}</span>
              </div>
              {current && (
                <span className="text-[10px] uppercase tracking-wider text-red-300 border border-red-500/40 px-1.5 py-0.5 rounded">
                  Atual
                </span>
              )}
            </div>
            <div className="mt-3 flex items-baseline gap-1 text-zinc-100">
              <span className="text-2xl font-extrabold tabular-nums">
                {PLAN_PRICE[plan].toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
              <span className="text-xs text-zinc-400">/mês</span>
            </div>
            <ul className="mt-3 space-y-1.5">
              {PLAN_HIGHLIGHTS[plan].map((f) => (
                <li key={f} className="flex items-start gap-2 text-xs text-zinc-300">
                  <Check className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </button>
        );
      })}
    </div>
  );
}

export function SubscriptionExpiryGate() {
  const { user, company, ready } = useSaaS();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Busca autoritativa direto do banco — evita decisões com base em estado
  // potencialmente desatualizado (cache de contexto / localStorage).
  const [liveDueDate, setLiveDueDate] = useState<string | null>(null);
  const [dueDateFetchComplete, setDueDateFetchComplete] = useState(false);
  useEffect(() => {
    let alive = true;
    if (!company?.id || user?.role === "super_admin") {
      setLiveDueDate(null);
      setDueDateFetchComplete(false);
      return;
    }
    setDueDateFetchComplete(false);
    (async () => {
      const { data } = await supabase
        .from("companies")
        .select("due_date")
        .eq("id", company.id)
        .maybeSingle();
      if (!alive) return;
      setLiveDueDate((data?.due_date as string | null) ?? null);
      setDueDateFetchComplete(true);
    })();
    return () => { alive = false; };
  }, [company?.id, user?.role]);

  const effectiveDue = liveDueDate ?? company?.dueDate ?? null;
  const days = useMemo(() => daysUntil(effectiveDue), [effectiveDue]);
  const isPrivileged = !user || user.role === "super_admin";
  const onAuthPage = pathname === "/login" || pathname === "/assinatura";

  const expired = days !== null && days <= 0;
  const warning = days !== null && days >= 1 && days <= 3;

  useEffect(() => {
    if (!ready || isPrivileged || !company || !dueDateFetchComplete) return;
    console.log("[SubscriptionExpiryGate] Verificação de vencimento", {
      due_date_banco: liveDueDate,
      hoje_comparacao_utc: todayUtcComparisonDate(),
      deve_bloquear: expired,
    });
  }, [ready, isPrivileged, company, dueDateFetchComplete, liveDueDate, expired]);

  // Bloqueio total: data vencida → empurra para /assinatura.
  useEffect(() => {
    if (!ready || isPrivileged) return;
    if (expired && pathname !== "/assinatura" && pathname !== "/login") {
      navigate({ to: "/assinatura" });
    }
  }, [ready, isPrivileged, expired, pathname, navigate]);

  // Dialog dispensável uma vez por dia por empresa.
  const dismissKey = company && days !== null ? `orvix_expiry_dismissed_${company.id}_d${days}` : null;
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    if (!dismissKey) { setDismissed(false); return; }
    try { setDismissed(sessionStorage.getItem(dismissKey) === "1"); }
    catch { setDismissed(false); }
  }, [dismissKey]);

  if (!ready || isPrivileged || !company) return null;

  // (1) Vencido → AlertDialog total. Não renderiza fora de /assinatura porque o useEffect já redireciona,
  // mas mantemos a tela de bloqueio caso o redirecionamento ainda esteja em transição.
  if (expired && !onAuthPage) {
    return (
      <AlertDialog open>
        <AlertDialogContent className="bg-zinc-950 border-red-900/60 text-zinc-100 shadow-[0_30px_80px_-20px_rgba(220,38,38,0.5)]">
          <AlertDialogHeader>
            <div className="mx-auto mb-2 grid place-items-center w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-red-900">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <AlertDialogTitle className="text-center text-zinc-50">
              Acesso bloqueado: plano vencido
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-zinc-400">
              Sua assinatura Orvix expirou. Renove agora para liberar o ERP, o PDV e o restante da plataforma.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center">
            <button
              onClick={() => navigate({ to: "/assinatura" })}
              className="inline-flex items-center gap-2 h-11 px-6 rounded-md bg-gradient-to-r from-red-600 to-red-800 text-white font-bold shadow hover:from-red-500 hover:to-red-700 active:scale-[0.98] transition"
            >
              <CreditCard className="w-4 h-4" /> Renovar agora
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  // (2) Aviso D-3 / D-2 / D-1 (dispensável)
  if (!warning || onAuthPage || dismissed || days === null) return null;

  const handleDismiss = () => {
    if (dismissKey) { try { sessionStorage.setItem(dismissKey, "1"); } catch {} }
    setDismissed(true);
  };

  return (
    <Dialog open onOpenChange={(o) => { if (!o) handleDismiss(); }}>
      <DialogContent className="max-w-3xl bg-zinc-950 border-red-900/60 text-zinc-100 shadow-[0_30px_80px_-20px_rgba(220,38,38,0.45)]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="grid place-items-center w-10 h-10 rounded-lg bg-gradient-to-br from-red-600 to-red-900 text-white">
              <AlertTriangle className="w-5 h-5" />
            </span>
            <div>
              <DialogTitle className="text-zinc-50 text-lg">
                Sua assinatura Orvix vence em {days} {days === 1 ? "dia" : "dias"}!
              </DialogTitle>
              <DialogDescription className="text-zinc-400">
                Garanta a continuidade do {PLAN_LABEL[company.plan]} ou faça upgrade abaixo. Após o vencimento o acesso ao PDV e ao painel será bloqueado.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-2">
          <PlanShowcase currentPlan={company.plan} onPick={() => navigate({ to: "/assinatura" })} />
        </div>

        <div className="mt-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <button
            onClick={handleDismiss}
            className="h-10 px-4 rounded-md border border-zinc-800 text-sm text-zinc-300 hover:bg-zinc-900 transition"
          >
            Lembrar mais tarde
          </button>
          <button
            onClick={() => navigate({ to: "/assinatura" })}
            className="inline-flex items-center justify-center gap-2 h-10 px-5 rounded-md bg-gradient-to-r from-red-600 to-red-800 text-white font-bold shadow hover:from-red-500 hover:to-red-700 active:scale-[0.98] transition"
          >
            <CreditCard className="w-4 h-4" /> Renovar agora
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}