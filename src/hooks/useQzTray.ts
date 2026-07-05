import { useEffect, useState } from "react";
import { connectQz, subscribeQzStatus, type QZStatus } from "@/lib/qz-tray";

/**
 * Assina o status do QZ Tray e tenta uma conexão silenciosa ao montar.
 * Retorna o status atual — `connected` significa impressão automática ativa.
 */
export function useQzTray(autoConnect = true): QZStatus {
  const [status, setStatus] = useState<QZStatus>("idle");

  useEffect(() => {
    const unsub = subscribeQzStatus(setStatus);
    if (autoConnect) { void connectQz({ retries: 0 }); }
    return () => { unsub(); };
  }, [autoConnect]);

  return status;
}