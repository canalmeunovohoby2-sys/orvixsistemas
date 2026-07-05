/**
 * QZ Tray integration.
 *
 * Carrega o cliente oficial (`qz-tray`) sob demanda a partir da CDN,
 * mantém uma conexão WebSocket com o driver instalado na máquina do
 * cliente e expõe utilitários para listar impressoras e imprimir cupom
 * em modo silencioso (sem diálogo do navegador).
 *
 * O driver deve ser baixado e instalado a partir do link oficial:
 *   https://github.com/qzind/tray/releases/download/v2.2.6/qz-tray-2.2.6-x86_64.exe
 *
 * O QZ Tray sem certificado assinado apenas exibe um pop-up de permissão
 * na primeira conexão de cada dia — o que já é aceitável para o SaaS.
 */

export const QZ_DOWNLOAD_URL =
  "https://github.com/qzind/tray/releases/download/v2.2.6/qz-tray-2.2.6-x86_64.exe";

const QZ_CDN = "https://cdn.jsdelivr.net/npm/qz-tray@2.2.4/qz-tray.min.js";

type QZAny = any; // biblioteca externa sem tipos

let qzPromise: Promise<QZAny> | null = null;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof document === "undefined") return reject(new Error("no-dom"));
    const existing = document.querySelector<HTMLScriptElement>(`script[data-qz="1"]`);
    if (existing) {
      if ((window as any).qz) return resolve();
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("qz-load-fail")));
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.dataset.qz = "1";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("qz-load-fail"));
    document.head.appendChild(s);
  });
}

async function loadQz(): Promise<QZAny> {
  if (qzPromise) return qzPromise;
  qzPromise = (async () => {
    await loadScript(QZ_CDN);
    const qz = (window as any).qz;
    if (!qz) throw new Error("qz-missing");
    // Modo sem assinatura: o QZ Tray mostra pop-up de permissão ao usuário.
    try {
      qz.security.setCertificatePromise((resolve: any) => resolve());
      qz.security.setSignaturePromise(() => (resolve: any) => resolve());
    } catch { /* noop */ }
    return qz;
  })().catch((e) => { qzPromise = null; throw e; });
  return qzPromise;
}

export type QZStatus = "idle" | "connecting" | "connected" | "unavailable";

let statusListeners = new Set<(s: QZStatus) => void>();
let currentStatus: QZStatus = "idle";

function setStatus(s: QZStatus) {
  currentStatus = s;
  statusListeners.forEach((l) => { try { l(s); } catch { /* noop */ } });
}

export function subscribeQzStatus(fn: (s: QZStatus) => void): () => void {
  statusListeners.add(fn);
  fn(currentStatus);
  return () => { statusListeners.delete(fn); };
}

export function getQzStatus(): QZStatus { return currentStatus; }

/** Conecta ao QZ Tray. Retorna true se conectado. Silencioso em falha. */
export async function connectQz(opts: { retries?: number } = {}): Promise<boolean> {
  try {
    setStatus("connecting");
    const qz = await loadQz();
    if (qz.websocket.isActive()) { setStatus("connected"); return true; }
    await qz.websocket.connect({ retries: opts.retries ?? 1, delay: 1 });
    setStatus("connected");
    // Se o socket cair, atualiza o status.
    try {
      qz.websocket.setClosedCallbacks(() => setStatus("unavailable"));
      qz.websocket.setErrorCallbacks(() => { /* silencioso */ });
    } catch { /* noop */ }
    return true;
  } catch {
    setStatus("unavailable");
    return false;
  }
}

export async function disconnectQz(): Promise<void> {
  try {
    const qz = (window as any).qz;
    if (qz?.websocket?.isActive()) await qz.websocket.disconnect();
  } catch { /* noop */ }
  setStatus("idle");
}

export async function listPrinters(): Promise<string[]> {
  const ok = await connectQz();
  if (!ok) return [];
  const qz = (window as any).qz;
  try {
    const res = await qz.printers.find();
    return Array.isArray(res) ? res.filter(Boolean) : res ? [res] : [];
  } catch {
    return [];
  }
}

export async function getDefaultPrinter(): Promise<string | null> {
  const ok = await connectQz();
  if (!ok) return null;
  const qz = (window as any).qz;
  try {
    const name = await qz.printers.getDefault();
    return name || null;
  } catch { return null; }
}

/** Imprime HTML (bobina 80mm) diretamente na impressora escolhida. */
export async function printReceiptHtml(printer: string, html: string): Promise<boolean> {
  const ok = await connectQz();
  if (!ok || !printer) return false;
  const qz = (window as any).qz;
  try {
    const config = qz.configs.create(printer, {
      margins: { top: 0, right: 0, bottom: 0, left: 0 },
      size: { width: 80 }, // mm — bobina térmica padrão
      units: "mm",
      copies: 1,
      rasterize: false,
    });
    await qz.print(config, [{ type: "pixel", format: "html", flavor: "plain", data: html }]);
    return true;
  } catch {
    return false;
  }
}

// ── Preferência de impressora por empresa ───────────────────────────────────

const PRINTER_KEY = (cid: string | null | undefined) => `orvix_qz_printer_${cid ?? "default"}`;

export function getSelectedPrinter(cid: string | null | undefined): string | null {
  try {
    if (typeof localStorage === "undefined") return null;
    return localStorage.getItem(PRINTER_KEY(cid));
  } catch { return null; }
}

export function setSelectedPrinter(cid: string | null | undefined, printer: string | null): void {
  try {
    if (typeof localStorage === "undefined") return;
    if (printer) localStorage.setItem(PRINTER_KEY(cid), printer);
    else localStorage.removeItem(PRINTER_KEY(cid));
  } catch { /* noop */ }
}