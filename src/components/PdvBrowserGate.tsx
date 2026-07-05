import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Download, Monitor, ShieldCheck, Printer, Zap, X } from "lucide-react";
import { useIsElectron } from "@/lib/electron";

/**
 * Banner + modal que aparece SOMENTE quando o PDV está sendo aberto pelo
 * navegador. Não altera nenhuma regra de negócio: apenas orienta a equipe
 * do caixa a migrar para o app nativo ORVIX PDV para obter impressão
 * silenciosa, foco de janela e estabilidade.
 *
 * Quando rodando dentro do Electron, mostra um badge discreto "App Nativo".
 */
export function PdvBrowserGate() {
  const { ready, native, version } = useIsElectron();
  const [dismissed, setDismissed] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!ready || native) return;
    try {
      const key = "orvix_pdv_gate_dismissed_at";
      const last = Number(localStorage.getItem(key) || 0);
      // Mostra o modal 1x por sessão / no máximo a cada 12h.
      if (Date.now() - last > 12 * 60 * 60 * 1000) setShowModal(true);
    } catch {
      setShowModal(true);
    }
  }, [ready, native]);

  const closeModal = () => {
    setShowModal(false);
    setDismissed(true);
    try { localStorage.setItem("orvix_pdv_gate_dismissed_at", String(Date.now())); } catch {}
  };

  if (!ready) return null;

  if (native) {
    return (
      <span
        className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 text-[11px] font-semibold"
        title={`ORVIX Sistemas nativo${version ? ` v${version}` : ""} · conectado`}
      >
        <ShieldCheck className="w-3.5 h-3.5" />
        App Nativo{version ? ` · v${version}` : ""}
      </span>
    );
  }

  return (
    <>
      {!dismissed && (
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[11px] font-semibold hover:bg-amber-500/25 transition-colors"
          title="Você está usando o sistema pelo navegador. Baixe o app nativo."
        >
          <Monitor className="w-3.5 h-3.5" />
          Modo Navegador
        </button>
      )}

      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pdv-gate-title"
          className="fixed inset-0 z-[100] grid place-items-center bg-black/60 p-4"
          onClick={closeModal}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-xl rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
          >
            <button
              type="button"
              onClick={closeModal}
              aria-label="Fechar"
              className="absolute top-3 right-3 w-8 h-8 grid place-items-center rounded-md hover:bg-accent"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="p-6 md:p-7 border-b border-border bg-gradient-to-br from-primary/10 to-transparent">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-11 h-11 rounded-xl bg-primary/15 text-primary grid place-items-center">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h2 id="pdv-gate-title" className="text-lg md:text-xl font-bold leading-tight">
                    Instale o ORVIX Sistemas para Windows
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    App nativo · impressão silenciosa · sem travamentos
                  </p>
                </div>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Você está acessando pelo navegador. Para garantir
                <strong className="text-foreground"> impressão automática</strong>,
                foco de janela e desempenho máximo, migre para o app nativo.
              </p>
            </div>

            <ol className="p-6 md:p-7 grid gap-4 md:grid-cols-3">
              <Step n={1} icon={<Download className="w-4 h-4" />} title="Baixe">
                Instalador oficial (.exe) assinado.
              </Step>
              <Step n={2} icon={<Zap className="w-4 h-4" />} title="Instale">
                Atalho automático na área de trabalho.
              </Step>
              <Step n={3} icon={<Printer className="w-4 h-4" />} title="Abra">
                Login normal, agora com impressão silenciosa.
              </Step>
            </ol>

            <div className="px-6 md:px-7 pb-6 md:pb-7 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={closeModal}
                className="h-10 px-4 rounded-md text-sm font-medium hover:bg-accent transition-colors order-2 sm:order-1"
              >
                Continuar no navegador
              </button>
              <Link
                to="/download"
                onClick={closeModal}
                className="h-10 px-5 inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors order-1 sm:order-2"
              >
                <Download className="w-4 h-4" />
                Baixar Instalador ORVIX Sistemas
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Step({ n, icon, title, children }: { n: number; icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <li className="rounded-xl border border-border bg-background p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-6 h-6 grid place-items-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
          {n}
        </span>
        <span className="text-primary">{icon}</span>
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{children}</p>
    </li>
  );
}