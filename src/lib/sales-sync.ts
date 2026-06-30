import { insertSale } from "@/lib/sales.functions";

/**
 * Persistência da venda no Supabase com tolerância a falhas (offline / RLS / rede).
 * - Tentativa imediata; se falhar, a venda fica na fila local (`orvix_sales_queue_v1`)
 *   e é drenada na próxima vez que `flushSalesQueue()` rodar (ex.: ao voltar conexão
 *   ou na inicialização da app).
 */

export type QueuedSale = {
  company_id: string;
  local_id?: string;
  total_amount: number;
  cost_amount: number;
  items_count: number;
  payment_method?: string;
  installments?: number;
  customer_name?: string;
  customer_id?: string;
  crediario: boolean;
  items: Array<{ id: string; name: string; qty: number; price?: number; unit?: string }>;
  occurred_at: string;
};

const QUEUE_KEY = "orvix_sales_queue_v1";

function readQueue(): QueuedSale[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as QueuedSale[]) : [];
  } catch { return []; }
}
function writeQueue(items: QueuedSale[]) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(QUEUE_KEY, JSON.stringify(items)); } catch { /* noop */ }
}
function enqueue(sale: QueuedSale) {
  const q = readQueue();
  q.push(sale);
  writeQueue(q);
}

let flushing = false;

export async function flushSalesQueue(): Promise<{ sent: number; remaining: number }> {
  if (flushing) return { sent: 0, remaining: readQueue().length };
  flushing = true;
  let sent = 0;
  try {
    let q = readQueue();
    while (q.length > 0) {
      const next = q[0];
      try {
        await insertSale({ data: next });
        sent++;
        q = q.slice(1);
        writeQueue(q);
      } catch (err) {
        // Mantém a fila para nova tentativa; sai do loop para não travar.
        // eslint-disable-next-line no-console
        console.warn("[sales-sync] falha ao enviar venda da fila — tentaremos novamente.", err);
        break;
      }
    }
  } finally {
    flushing = false;
  }
  return { sent, remaining: readQueue().length };
}

/** Envia a venda; em caso de qualquer erro, enfileira para sincronização posterior. */
export async function pushSaleToCloud(sale: QueuedSale): Promise<void> {
  try {
    await insertSale({ data: sale });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[sales-sync] enfileirando venda offline:", err);
    enqueue(sale);
  }
  // tenta drenar pendências antigas após qualquer venda nova
  void flushSalesQueue();
}

/** Conecta listeners para drenar a fila quando a conexão voltar. */
export function initSalesSync() {
  if (typeof window === "undefined") return;
  void flushSalesQueue();
  window.addEventListener("online", () => { void flushSalesQueue(); });
}

export function pendingSalesCount(): number {
  return readQueue().length;
}