import { useEffect, useState } from "react";
import { Mail, Sparkles, X, Loader2, ShieldCheck, Download, Check, User, Phone } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { startTrial } from "@/lib/trial.functions";

/** Máscara BR: (XX) 9XXXX-XXXX ou (XX) XXXX-XXXX. */
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

const INSTALLER_URL =
  "https://drive.google.com/uc?export=download&id=19ze1QZeFptEGt1bQnG5jaEYVltDwI5vy";
const INSTALLER_FILENAME = "OrvixSistemasSetup.exe";

/**
 * Modal exibido a partir dos CTAs "Teste Grátis (7 dias)" da Landing Page.
 * Coleta o e-mail, registra em `trial_accounts` (idempotente, contagem no
 * servidor) e só então libera o download do instalador oficial. Assim que o
 * usuário abre o .exe e faz login com o mesmo e-mail, o app já reconhece o
 * direito aos 7 dias.
 */
export function TrialLandingModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<null | { email: string; daysLeft: number }>(null);
  const startTrialFn = useServerFn(startTrial);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setDone(null);
      setEmail("");
      setFullName("");
      setWhatsapp("");
    }
  }, [open]);

  if (!open) return null;

  const triggerDownload = () => {
    try {
      const a = document.createElement("a");
      a.href = INSTALLER_URL;
      a.download = INSTALLER_FILENAME;
      a.rel = "noopener";
      a.target = "_self";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      window.location.href = INSTALLER_URL;
    }
  };

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
      const res = await startTrialFn({
        data: { email, fullName: fullName.trim(), whatsapp: whatsapp.replace(/\D/g, "") },
      });
      if (!res.ok) {
        toast.error(res.reason ?? "Falha ao registrar o teste.");
        return;
      }
      if (res.expired) {
        toast.error(
          "Este e-mail já teve o período de teste expirado. Contrate um plano para continuar.",
        );
        return;
      }
      setDone({ email: res.email, daysLeft: res.daysLeft });
      toast.success("E-mail pré-cadastrado! Iniciando o download do instalador…");
      // Dispara o download automaticamente após o registro.
      setTimeout(triggerDownload, 400);
    } catch (err) {
      console.error("[TrialLandingModal]", err);
      toast.error("Erro inesperado. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[110] grid place-items-center bg-black/70 p-4"
      onMouseDown={onClose}
    >
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0a0a0a] text-white shadow-2xl"
      >
        <header className="px-6 pt-6 pb-4 border-b border-white/10 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#e94f4f] to-[#850405] grid place-items-center text-white shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-base leading-tight">
                Teste Grátis — 7 dias
              </h2>
              <p className="text-xs text-white/60 mt-0.5">
                Informe seu e-mail para liberar o instalador oficial.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="p-1.5 rounded-md text-white/60 hover:text-white hover:bg-white/5"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        {done ? (
          <div className="px-6 py-6 space-y-5">
            <div className="rounded-lg border border-[#850405]/40 bg-[#850405]/10 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Check className="w-4 h-4 text-[#e94f4f]" />
                Pré-cadastro confirmado
              </div>
              <p className="mt-2 text-xs text-white/70 leading-relaxed">
                O e-mail <strong className="text-white">{done.email}</strong> foi
                registrado como conta de teste. Você tem{" "}
                <strong className="text-white">
                  {done.daysLeft} {done.daysLeft === 1 ? "dia" : "dias"}
                </strong>{" "}
                de acesso completo assim que abrir o app.
              </p>
            </div>

            <ol className="text-xs text-white/70 space-y-2 leading-relaxed">
              <li>
                <strong className="text-white">1.</strong> Aguarde o download do
                instalador terminar (se não iniciou, clique no botão abaixo).
              </li>
              <li>
                <strong className="text-white">2.</strong> Execute o{" "}
                <code className="text-white">OrvixSistemasSetup.exe</code>.
              </li>
              <li>
                <strong className="text-white">3.</strong> Faça login usando o mesmo
                e-mail — os 7 dias já estão ativos no servidor.
              </li>
            </ol>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={triggerDownload}
                className="flex-1 h-11 inline-flex items-center justify-center gap-2 rounded-md bg-[#850405] hover:bg-[#9a0507] text-white font-semibold text-sm transition-colors"
              >
                <Download className="w-4 h-4" />
                Baixar novamente
              </button>
              <button
                type="button"
                onClick={onClose}
                className="h-11 px-4 rounded-md border border-white/15 text-white/80 hover:text-white hover:border-white/30 text-sm font-medium transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit}>
            <div className="px-6 py-5 space-y-4">
              <label className="block space-y-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-white/60">
                  Nome completo
                </span>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
                  <input
                    type="text"
                    required
                    autoFocus
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ex: João Silva"
                    className="w-full h-11 pl-9 pr-3 rounded-md bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-[#850405]"
                  />
                </div>
              </label>

              <label className="block space-y-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-white/60">
                  WhatsApp
                </span>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
                  <input
                    type="tel"
                    required
                    inputMode="numeric"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(maskWhatsapp(e.target.value))}
                    placeholder="(11) 9XXXX-XXXX"
                    className="w-full h-11 pl-9 pr-3 rounded-md bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-[#850405]"
                  />
                </div>
              </label>

              <label className="block space-y-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-white/60">
                  Seu e-mail
                </span>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="voce@suaempresa.com.br"
                    className="w-full h-11 pl-9 pr-3 rounded-md bg-white/[0.04] border border-white/10 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-[#850405]"
                  />
                </div>
              </label>

              <div className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-2.5 text-xs text-white/70 leading-relaxed">
                <div className="flex gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[#e94f4f]" />
                  <span>
                    O tempo do teste é contado pelo servidor da ORVIX. Alterar o
                    relógio do computador <strong>não estende</strong> o período.
                  </span>
                </div>
              </div>
            </div>

            <footer className="px-6 pb-6 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full h-11 inline-flex items-center justify-center gap-2 rounded-md bg-[#850405] hover:bg-[#9a0507] text-white font-semibold text-sm shadow-[0_10px_30px_-10px_rgba(133,4,5,0.8)] transition-colors disabled:opacity-60"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {submitting ? "Registrando…" : "Confirmar e baixar instalador"}
              </button>
              <p className="mt-3 text-[10px] uppercase tracking-widest text-center text-white/40">
                Sem cartão · Sem senha · Acesso pelo app instalado
              </p>
            </footer>
          </form>
        )}
      </div>
    </div>
  );
}