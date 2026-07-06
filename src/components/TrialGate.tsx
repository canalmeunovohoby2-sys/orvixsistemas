import { useEffect, useState, useCallback } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from "@/components/ui/alert-dialog";
import { Lock, CreditCard, Sparkles } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { checkTrialStatus } from "@/lib/trial.functions";
import { useSaaS } from "@/lib/saas-context";

export const TRIAL_EMAIL_KEY = "orvix_trial_email";
export const TRIAL_ACTIVE_KEY = "orvix_trial_active"; // "1" enquanto sessão de teste em uso
const CHECK_INTERVAL_MS = 60_000; // reverifica a cada 60s

/**
 * Gate global de expiração do Acesso de Teste (7 dias).
 *
 * Só age quando existe `orvix_trial_email` no localStorage (usuário em modo teste).
 * Para clientes pagantes esse componente é um **no-op absoluto** — o `SubscriptionExpiryGate`
 * continua responsável por eles.
 *
 * A verificação usa `now()` do servidor Postgres (server function `checkTrialStatus`),
 * imune a mudanças no relógio do Windows.
 */
export function TrialGate() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user: paidUser } = useSaaS();
  const check = useServerFn(checkTrialStatus);

  const [email, setEmail] = useState<string | null>(null);
  const [state, setState] = useState<{ daysLeft: number; expired: boolean } | null>(null);

  // Lê a chave de teste no mount.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(TRIAL_EMAIL_KEY);
      setEmail(stored && stored.includes("@") ? stored : null);
    } catch { /* SSR ou storage desativado */ }
  }, []);

  // Se um cliente pagante real logou (super_admin/admin/cashier com company), sai do modo teste.
  useEffect(() => {
    if (paidUser && paidUser.email !== "teste@orvix.com" && paidUser.role !== "super_admin") {
      // Cliente real → limpa vestígios de teste; não interferimos.
      try {
        localStorage.removeItem(TRIAL_EMAIL_KEY);
        localStorage.removeItem(TRIAL_ACTIVE_KEY);
      } catch {}
      setEmail(null);
    }
  }, [paidUser]);

  const runCheck = useCallback(async () => {
    if (!email) return;
    try {
      const res = await check({ data: { email } });
      if (!res.ok) {
        // Registro inválido — encerra o modo teste com segurança.
        setState({ daysLeft: 0, expired: true });
        return;
      }
      setState({ daysLeft: res.daysLeft, expired: res.expired });
    } catch (e) {
      console.warn("[TrialGate] checkTrialStatus falhou", e);
    }
  }, [email, check]);

  useEffect(() => {
    if (!email) return;
    void runCheck();
    const id = window.setInterval(runCheck, CHECK_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [email, runCheck]);

  // Redireciona para a tela de planos quando expira.
  useEffect(() => {
    if (!email || !state?.expired) return;
    if (pathname === "/assinatura" || pathname === "/login" || pathname === "/" || pathname === "/download") return;
    navigate({ to: "/assinatura" });
  }, [email, state?.expired, pathname, navigate]);

  // Sem trial → não renderiza nada.
  if (!email) return null;

  // Trial expirado → bloqueio total (não dispensável). Também protege rotas internas.
  if (state?.expired) {
    return (
      <AlertDialog open>
        <AlertDialogContent className="bg-zinc-950 border-red-900/60 text-zinc-100">
          <AlertDialogHeader>
            <div className="mx-auto mb-2 grid place-items-center w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-red-900">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <AlertDialogTitle className="text-center text-zinc-50">
              Seu período de teste terminou
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-zinc-400">
              Os 7 dias grátis do ORVIX Sistemas para <strong>{email}</strong> expiraram.
              Contrate um dos planos para continuar usando o software.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center">
            <button
              onClick={() => navigate({ to: "/assinatura" })}
              className="inline-flex items-center gap-2 h-11 px-6 rounded-md bg-gradient-to-r from-red-600 to-red-800 text-white font-bold shadow hover:from-red-500 hover:to-red-700 transition"
            >
              <CreditCard className="w-4 h-4" /> Ver planos
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  // Trial ativo → badge discreto flutuante com dias restantes.
  if (state && !state.expired && pathname !== "/" && pathname !== "/download") {
    return (
      <div className="fixed bottom-4 right-4 z-40 pointer-events-none">
        <div className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-[#850405]/40 bg-black/80 backdrop-blur-md px-3 py-1.5 text-xs font-semibold text-white shadow-lg">
          <Sparkles className="w-3.5 h-3.5 text-[#e94f4f]" />
          Teste: {state.daysLeft} {state.daysLeft === 1 ? "dia restante" : "dias restantes"}
        </div>
      </div>
    );
  }

  return null;
}
