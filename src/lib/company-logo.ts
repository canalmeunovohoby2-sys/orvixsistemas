import { useEffect, useState } from "react";

/**
 * Logo do cliente: armazenamento simples em localStorage (base64 dataURL).
 * Chave por empresa para garantir isolamento multi-tenant.
 * Limite: 2 MB no upload original (validado antes de salvar).
 */
const KEY = (cid: string) => `orvix_logo_${cid}`;
const EVENT = "orvix:logo-updated";

export function getCompanyLogo(cid: string | null | undefined): string | null {
  if (!cid || typeof window === "undefined") return null;
  try { return window.localStorage.getItem(KEY(cid)); } catch { return null; }
}

export function setCompanyLogo(cid: string, dataUrl: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (dataUrl) window.localStorage.setItem(KEY(cid), dataUrl);
    else window.localStorage.removeItem(KEY(cid));
    window.dispatchEvent(new CustomEvent(EVENT, { detail: { cid } }));
  } catch {}
}

export function useCompanyLogo(cid: string | null | undefined): string | null {
  const [logo, setLogo] = useState<string | null>(() => getCompanyLogo(cid));
  useEffect(() => {
    setLogo(getCompanyLogo(cid));
    const onLocal = (e: Event) => {
      const ce = e as CustomEvent<{ cid?: string }>;
      if (!cid || ce.detail?.cid === cid) setLogo(getCompanyLogo(cid));
    };
    const onStorage = (e: StorageEvent) => {
      if (cid && e.key === KEY(cid)) setLogo(getCompanyLogo(cid));
    };
    window.addEventListener(EVENT, onLocal as EventListener);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(EVENT, onLocal as EventListener);
      window.removeEventListener("storage", onStorage);
    };
  }, [cid]);
  return logo;
}