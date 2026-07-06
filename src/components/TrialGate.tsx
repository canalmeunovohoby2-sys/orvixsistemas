import { useEffect, useState, useCallback } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from "@/components/ui/alert-dialog";
import { Lock, CreditCard, Sparkles, AlertTriangle, ArrowRight } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { checkTrialStatus } from "@/lib/trial.functions";
import { useSaaS } from "@/lib/saas-context";

export const TRIAL_EMAIL_KEY = "orvix_trial_email";
export const TRIAL_ACTIVE_KEY = "orvix_trial_active"; // "1" enquanto sessão de teste em uso
const CHECK_INTERVAL_MS = 60_000; // reverifica a cada 60s
const WARN_24H_ACK_KEY = "orvix_trial_warn24_ack"; // dismissal por sessão

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
  const [state, setState] = useState<
    { daysLeft: number; hoursLeft: number; expired: boolean; expiresAt: string } | null
  >(null);
  const [warn24Dismissed, setWarn24Dismissed] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(WARN_24H_ACK_KEY) === "1";
    } catch {
      return false;
    }
  });

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
        setState({ daysLeft: 0, hoursLeft: 0, expired: true, expiresAt: new Date().toISOString() });
        return;
      }
      const msLeft = Math.max(0, new Date(res.expiresAt).getTime() - new Date(res.serverNow).getTime());
      const hoursLeft = Math.ceil(msLeft / 3_600_000);
      setState({
        daysLeft: res.daysLeft,
        hoursLeft,
        expired: res.expired,
        expiresAt: res.expiresAt,
      });
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

  // Redireciona para a tela de planos quando expira — bloqueio total. Só permite
  // ficar na própria tela de planos, na landing e na área de download.
  useEffect(() => {
    if (!email || !state?.expired) return;
    if (pathname === "/assinatura" || pathname === "/" || pathname === "/download") return;
    navigate({ to: "/assinatura" });
  }, [email, state?.expired, pathname, navigate]);

  // Sem trial → não renderiza nada.
  if (!email) return null;

  // Trial expirado → bloqueio total (não dispensável). Também protege rotas internas.
  // Na tela de planos exibimos um banner topo persistente; nas demais o modal fullscreen.
  if (state?.expired) {
    if (pathname === "/assinatura") {
      return (
        <div className="fixed top-0 left-0 right-0 z-[80] bg-gradient-to-r from-red-700 to-red-900 text-white shadow-lg">
          <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center gap-3 text-sm">
            <Lock className="w-4 h-4 shrink-0" />
            <span className="flex-1 leading-tight">
              <strong>Acesso bloqueado.</strong> Seu teste de 7 dias terminou —
              contrate um plano abaixo para reativar o software.
            </span>
          </div>
        </div>
      );
    }
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
              O software está bloqueado — contrate um plano mensal para continuar usando.
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

  // Trial ativo → badge + alerta de 24h quando aplicável.
  const showOnRoute = pathname !== "/" && pathname !== "/download";
  if (!state || !showOnRoute) return null;

  const in24hWindow = state.daysLeft === 1 || state.hoursLeft <= 24;
  const badgeAccent = in24hWindow
    ? "border-amber-500/70 bg-amber-500/15 text-amber-100"
    : "border-[#850405]/40 bg-black/80 text-white";

  return (
    <>
      <div className="fixed bottom-4 right-4 z-40 pointer-events-none">
        <button
          type="button"
          onClick={() => navigate({ to: "/assinatura" })}
          className={`pointer-events-auto inline-flex items-center gap-2 rounded-full border backdrop-blur-md px-3 py-1.5 text-xs font-semibold shadow-lg hover:brightness-110 transition ${badgeAccent}`}
        >
          {in24hWindow ? (
            <AlertTriangle className="w-3.5 h-3.5" />
          ) : (
            <Sparkles className="w-3.5 h-3.5 text-[#e94f4f]" />
          )}
          Teste: {state.hoursLeft <= 24
            ? `${state.hoursLeft}h restantes`
            : `${state.daysLeft} ${state.daysLeft === 1 ? "dia restante" : "dias restantes"}`}
          <ArrowRight className="w-3 h-3 opacity-70" />
        </button>
      </div>

      {in24hWindow && !warn24Dismissed && pathname !== "/assinatura" && (
        <AlertDialog open>
          <AlertDialogContent className="bg-zinc-950 border-amber-500/50 text-zinc-100">
            <AlertDialogHeader>
              <div className="mx-auto mb-2 grid place-items-center w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-700">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <AlertDialogTitle className="text-center text-zinc-50">
                Seu período de teste vence em 24 horas
              </AlertDialogTitle>
              <AlertDialogDescription className="text-center text-zinc-400">
                Faltam aproximadamente <strong>{state.hoursLeft}h</strong> para o
                bloqueio total do software. Garanta o seu acesso agora contratando
                um dos planos mensais — sem perder nenhum dado da sua operação.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="sm:justify-center gap-2">
              <button
                onClick={() => {
                  try { sessionStorage.setItem(WARN_24H_ACK_KEY, "1"); } catch { /* ok */ }
                  setWarn24Dismissed(true);
                }}
                className="inline-flex items-center gap-2 h-11 px-5 rounded-md border border-zinc-700 text-zinc-200 font-medium hover:bg-zinc-900 transition"
              >
                Lembrar mais tarde
              </button>
              <button
                onClick={() => {
                  try { sessionStorage.setItem(WARN_24H_ACK_KEY, "1"); } catch { /* ok */ }
                  setWarn24Dismissed(true);
                  navigate({ to: "/assinatura" });
                }}
                className="inline-flex items-center gap-2 h-11 px-6 rounded-md bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold shadow hover:from-amber-400 hover:to-orange-500 transition"
              >
                <CreditCard className="w-4 h-4" /> Contratar plano mensal
              </button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
