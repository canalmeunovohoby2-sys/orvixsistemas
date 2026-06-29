/**
 * Fila in-memory de eventos do Mercado Pago (server-side).
 *
 * O webhook recebe a notificação, normaliza e empilha um evento aqui.
 * O cliente (Painel Master) consome esses eventos via GET no mesmo endpoint,
 * cria a empresa correspondente e registra a auditoria.
 *
 * Usamos `globalThis` para sobreviver a HMR no dev e a invocações sucessivas
 * dentro do mesmo isolate em produção. Em ambiente serverless realmente
 * stateless, a persistência migraria para uma tabela — para o ambiente atual
 * (demonstração ORVIX SISTEMAS), o queue em memória atende o fluxo.
 */

export type MercadoPagoQueueEvent = {
  id: string;
  receivedAt: string;
  type: "payment" | "subscription" | "unknown";
  externalId: string;
  status: "approved" | "authorized" | "pending" | "rejected" | "unknown";
  amount: number;
  payerEmail: string | null;
  payerName: string | null;
  rawTopic: string | null;
};

type QueueState = { events: MercadoPagoQueueEvent[]; processedIds: Set<string> };

const KEY = "__orvix_mp_queue__";

function getState(): QueueState {
  const g = globalThis as unknown as Record<string, QueueState | undefined>;
  if (!g[KEY]) g[KEY] = { events: [], processedIds: new Set<string>() };
  return g[KEY]!;
}

export function enqueueEvent(ev: MercadoPagoQueueEvent) {
  const s = getState();
  if (s.processedIds.has(ev.id)) return;
  if (s.events.some((e) => e.id === ev.id)) return;
  s.events.push(ev);
  // Mantém no máximo os 200 eventos mais recentes.
  if (s.events.length > 200) s.events.splice(0, s.events.length - 200);
}

export function drainPending(): MercadoPagoQueueEvent[] {
  return [...getState().events];
}

export function ackEvents(ids: string[]) {
  const s = getState();
  const set = new Set(ids);
  s.events = s.events.filter((e) => !set.has(e.id));
  ids.forEach((id) => s.processedIds.add(id));
}