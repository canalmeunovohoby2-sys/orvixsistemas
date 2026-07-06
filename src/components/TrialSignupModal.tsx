import { useEffect, useState } from "react";
import { Mail, Sparkles, X, Loader2, ShieldCheck, User, Phone } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { startTrial } from "@/lib/trial.functions";

function maskWhatsapp(raw: string) {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}
function isValidWhatsapp(masked: string) {
  const d = masked.replace(/\D/g, "");
  return d.length === 10 || d.length === 11;
}

/**
 * Modal de cadastro do Acesso de Teste (7 dias).
 * Ao confirmar, grava/consulta em `trial_accounts` (idempotente) e devolve
 * o e-mail para o chamador — que persiste em localStorage e faz o auto-login
 * no ambiente de demonstração.
 */
export function TrialSignupModal({
  open,
  onClose,
  onActivated,
}: {
  open: boolean;
  onClose: () => void;
  onActivated: (email: string, daysLeft: number) => void;
}) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const startTrialFn = useServerFn(startTrial);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (fullName.trim().length < 3) {
      toast.error("Informe seu nome completo.");
      return;
    }
    if (!isValidWhatsapp(whatsapp)) {
      toast.error("WhatsApp inválido. Use o formato (XX) 9XXXX-XXXX.");
      return;
    }
    setSubmitting(true);
    try {
      // Limpa cache de UI de sessões anteriores (demo/mock) antes de ativar
      // o novo teste, garantindo um Dashboard limpo para o novo usuário.
      try {
        const keep = new Set(["theme", "lovable-cookie-consent"]);
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const k = localStorage.key(i);
          if (k && !keep.has(k)) localStorage.removeItem(k);
        }
        sessionStorage.clear();
      } catch { /* storage bloqueado */ }
      const res = await startTrialFn({
        data: { email, fullName: fullName.trim(), whatsapp: whatsapp.replace(/\D/g, "") },
      });
      if (!res.ok) {
        toast.error(res.reason ?? "Falha ao iniciar o teste.");
        return;
      }
      if (res.expired) {
        toast.error("Este e-mail já teve o período de teste expirado. Contrate um plano para continuar.");
        return;
      }
      toast.success(`Teste ativado! ${res.daysLeft} ${res.daysLeft === 1 ? "dia restante" : "dias restantes"}.`);
      onActivated(res.email, res.daysLeft);
    } catch (err) {
      console.error("[TrialSignupModal]", err);
      toast.error("Erro inesperado. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[110] grid place-items-center bg-black/60 p-4"
      onMouseDown={onClose}
    >
      <form
        onSubmit={submit}
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-border bg-card text-card-foreground shadow-2xl"
      >
        <header className="px-6 pt-6 pb-4 border-b border-border flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#e94f4f] to-[#850405] grid place-items-center text-white shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-base leading-tight">Acesso de Teste — 7 dias grátis</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Plano Bronze · 1 terminal · Sem cartão de crédito. A contagem começa neste momento.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="px-6 py-5 space-y-4">
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Nome completo
            </span>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                required
                autoFocus
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ex: João Silva"
                className="w-full h-11 pl-9 pr-3 rounded-md bg-background border border-input text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              WhatsApp
            </span>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="tel"
                required
                inputMode="numeric"
                value={whatsapp}
                onChange={(e) => setWhatsapp(maskWhatsapp(e.target.value))}
                placeholder="(11) 9XXXX-XXXX"
                className="w-full h-11 pl-9 pr-3 rounded-md bg-background border border-input text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Seu e-mail
            </span>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@suaempresa.com.br"
                className="w-full h-11 pl-9 pr-3 rounded-md bg-background border border-input text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </label>

          <div className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2.5 text-xs text-foreground/80 leading-relaxed">
            <div className="flex gap-2">
              <ShieldCheck className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" />
              <span>
                Durante o teste você opera no <strong>Plano Bronze</strong> — 1 terminal (caixa). Para
                adicionar mais terminais, contrate os planos Prata ou Ouro após o período. O tempo é
                contado pelo servidor da ORVIX; alterar o relógio do computador <strong>não estende</strong> o teste.
              </span>
            </div>
          </div>
        </div>

        <footer className="px-6 pb-6 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground font-semibold shadow hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {submitting ? "Ativando..." : "Ativar meu teste de 7 dias"}
          </button>
          <p className="mt-3 text-[10px] uppercase tracking-wider text-center text-muted-foreground">
            ORVIX SISTEMAS · Período de avaliação
          </p>
        </footer>
      </form>
    </div>
  );
}
