/**
 * Ponte para detectar se o ORVIX está rodando dentro do app nativo (Electron)
 * ou apenas no navegador. Toda a comunicação com o processo principal do
 * Electron passa por `window.orvix`, injetado pelo preload script.
 *
 * IMPORTANTE: este módulo NÃO altera nenhuma regra de negócio. Ele apenas
 * expõe capacidades nativas (impressão silenciosa, versão do app, updates)
 * quando disponíveis, e sinaliza para a UI que estamos em ambiente nativo.
 */
import { useEffect, useState } from "react";

export type OrvixBridge = {
  /** Versão do shell nativo (ex.: "1.0.0"). */
  version: string;
  /** Plataforma reportada pelo Electron: "win32" | "darwin" | "linux". */
  platform: string;
  /** Imprime HTML na impressora padrão sem abrir diálogo. */
  printSilent: (html: string) => Promise<{ ok: boolean; error?: string }>;
  /** Consulta status do auto-update (checking | available | downloaded | none). */
  getUpdateStatus?: () => Promise<
    "checking" | "available" | "downloaded" | "none" | "error"
  >;
  /** Aplica update baixado e reinicia. */
  quitAndInstall?: () => void;
};

declare global {
  interface Window {
    orvix?: OrvixBridge;
  }
}

export function isElectron(): boolean {
  if (typeof window === "undefined") return false;
  if (window.orvix) return true;
  const ua = (window.navigator.userAgent || "").toLowerCase();
  return ua.includes("electron") || ua.includes("orvix-pdv");
}

/** Hook SSR-safe para detectar o app nativo no cliente. */
export function useIsElectron(): { ready: boolean; native: boolean; version: string | null } {
  const [state, setState] = useState<{ ready: boolean; native: boolean; version: string | null }>({
    ready: false,
    native: false,
    version: null,
  });
  useEffect(() => {
    const native = isElectron();
    setState({ ready: true, native, version: native ? window.orvix?.version ?? null : null });
  }, []);
  return state;
}

/**
 * Imprime um HTML de forma silenciosa quando o app nativo estiver disponível.
 * No navegador cai no fluxo padrão `window.print()`, mantendo compatibilidade.
 */
export async function orvixPrint(html: string): Promise<void> {
  if (typeof window === "undefined") return;
  if (window.orvix?.printSilent) {
    const res = await window.orvix.printSilent(html);
    if (!res.ok) throw new Error(res.error || "Falha na impressão nativa");
    return;
  }
  const w = window.open("", "_blank", "width=380,height=600");
  if (!w) throw new Error("Popup bloqueado pelo navegador");
  w.document.write(html);
  w.document.close();
  w.focus();
  w.print();
  w.close();
}