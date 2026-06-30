import { useCallback, useEffect, useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";

/**
 * Botão de tela cheia para o Caixa/PDV.
 * - Clique: alterna Fullscreen API do navegador.
 * - Atalho: Ctrl+Shift+Q sai do modo tela cheia (ESC também sai, nativo do browser).
 * - Quando em tela cheia, renderiza um rodapé fixo com instrução de saída.
 */
export function FullscreenToggle({ className = "" }: { className?: string }) {
  const [isFs, setIsFs] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFs(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    onChange();
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const exit = useCallback(async () => {
    if (document.fullscreenElement) {
      try { await document.exitFullscreen(); } catch { /* noop */ }
    }
  }, []);

  const enter = useCallback(async () => {
    try { await document.documentElement.requestFullscreen(); } catch { /* noop */ }
  }, []);

  const toggle = useCallback(() => {
    if (document.fullscreenElement) void exit();
    else void enter();
  }, [enter, exit]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ctrl+Shift+Q → sair do modo tela cheia.
      if (e.ctrlKey && e.shiftKey && (e.key === "Q" || e.key === "q")) {
        if (document.fullscreenElement) {
          e.preventDefault();
          void exit();
        }
      }
    };
    window.addEventListener("keydown", handler, { capture: true });
    return () => window.removeEventListener("keydown", handler, { capture: true } as EventListenerOptions);
  }, [exit]);

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        title={isFs ? "Sair da tela cheia (Esc)" : "Entrar em tela cheia"}
        aria-label={isFs ? "Sair da tela cheia" : "Entrar em tela cheia"}
        className={`h-10 w-10 inline-flex items-center justify-center rounded-md border border-border bg-card text-foreground/80 hover:bg-accent hover:text-foreground transition-colors ${className}`}
      >
        {isFs ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
      </button>

      {isFs && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-0 inset-x-0 z-[9999] pointer-events-none flex justify-center pb-2"
        >
          <span className="pointer-events-auto rounded-full bg-black/70 text-white/90 text-[11px] font-medium px-3 py-1 backdrop-blur-sm shadow-lg">
            Pressione <kbd className="font-mono">[ESC]</kbd> ou <kbd className="font-mono">[Ctrl+Shift+Q]</kbd> para sair do modo tela cheia
          </span>
        </div>
      )}
    </>
  );
}
