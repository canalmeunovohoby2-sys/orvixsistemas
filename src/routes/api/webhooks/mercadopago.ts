import { createFileRoute } from "@tanstack/react-router";

/**
 * Endpoint público de webhook do Mercado Pago.
 *
 * POST  /api/webhooks/mercadopago   → Recebe a notificação IPN/Webhooks oficial.
 * GET   /api/webhooks/mercadopago   → Drena eventos pendentes (consumido pelo Painel Master).
 * POST  /api/webhooks/mercadopago?ack=ID1,ID2 → Confirma o processamento client-side.
 *
 * A rota fica sob `/api/webhooks/*` para deixar claro que é um endpoint público
 * (sem auth de usuário). Em produção, o Mercado Pago não assina o webhook por
 * padrão — apenas o `x-signature` opcional —, por isso usamos o `id` da
 * notificação como chave de idempotência e revalidamos com a API oficial
 * antes de promover qualquer ação destrutiva.
 */
export const Route = createFileRoute("/api/webhooks/mercadopago")({
  server: {
    handlers: {
      POST: async ({ request }) => handlePost(request),
      GET: async () => handleGet(),
      OPTIONS: async () =>
        new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, X-Signature, X-Request-Id",
          },
        }),
    },
  },
});

const JSON_HEADERS = { "Content-Type": "application/json" } as const;

async function handleGet() {
  const { drainPending } = await import("@/lib/mercadopago-queue.server");
  return new Response(JSON.stringify({ events: drainPending() }), { status: 200, headers: JSON_HEADERS });
}

async function handlePost(request: Request) {
  const url = new URL(request.url);
  const ackParam = url.searchParams.get("ack");
  if (ackParam) {
    const { ackEvents } = await import("@/lib/mercadopago-queue.server");
    const ids = ackParam.split(",").map((s) => s.trim()).filter(Boolean);
    ackEvents(ids);
    return new Response(JSON.stringify({ ok: true, acked: ids.length }), { status: 200, headers: JSON_HEADERS });
  }

  let payload: Record<string, unknown> = {};
  try {
    const text = await request.text();
    payload = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    // Mercado Pago às vezes envia querystring apenas; mesmo nesse caso devolvemos 200
    // para evitar reenvio em loop.
    payload = {};
  }

  // O MP pode entregar tanto via `topic` no querystring quanto via `type`/`action` no body.
  const topic =
    url.searchParams.get("topic") ||
    (typeof payload.type === "string" ? (payload.type as string) : null) ||
    (typeof payload.action === "string" ? (payload.action as string) : null);

  const queryId = url.searchParams.get("id") || url.searchParams.get("data.id");
  const dataObj = (payload.data as Record<string, unknown> | undefined) ?? undefined;
  const externalId =
    queryId ||
    (dataObj && typeof dataObj.id !== "undefined" ? String(dataObj.id) : null) ||
    (typeof payload.id !== "undefined" ? String(payload.id) : null);

  if (!externalId || !topic) {
    // Sem identificadores suficientes; ainda assim 200 para não causar retry infinito.
    return new Response(JSON.stringify({ ok: true, ignored: "missing identifiers" }), {
      status: 200,
      headers: JSON_HEADERS,
    });
  }

  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN || "";
  let resource: Record<string, unknown> | null = null;
  if (accessToken) {
    resource = await fetchMpResource(topic, externalId, accessToken);
  }

  const normalized = normalizeEvent({ topic, externalId, payload, resource });

  const { enqueueEvent } = await import("@/lib/mercadopago-queue.server");
  enqueueEvent(normalized);

  return new Response(JSON.stringify({ ok: true, queued: normalized.id }), {
    status: 200,
    headers: JSON_HEADERS,
  });
}

async function fetchMpResource(topic: string, id: string, token: string): Promise<Record<string, unknown> | null> {
  const path = topic.includes("subscription") || topic.includes("preapproval")
    ? `https://api.mercadopago.com/preapproval/${encodeURIComponent(id)}`
    : `https://api.mercadopago.com/v1/payments/${encodeURIComponent(id)}`;
  try {
    const res = await fetch(path, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return null;
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function normalizeEvent(args: {
  topic: string;
  externalId: string;
  payload: Record<string, unknown>;
  resource: Record<string, unknown> | null;
}) {
  const { topic, externalId, payload, resource } = args;
  const isSubscription = topic.includes("subscription") || topic.includes("preapproval");
  const type: "payment" | "subscription" | "unknown" = isSubscription
    ? "subscription"
    : topic.includes("payment")
      ? "payment"
      : "unknown";

  const r = resource ?? {};
  const payer = (r.payer as Record<string, unknown> | undefined) ?? undefined;
  const auto = (r.auto_recurring as Record<string, unknown> | undefined) ?? undefined;

  const rawStatus = String(r.status ?? "").toLowerCase();
  const status: "approved" | "authorized" | "pending" | "rejected" | "unknown" =
    rawStatus === "approved" ? "approved"
    : rawStatus === "authorized" ? "authorized"
    : rawStatus === "pending" || rawStatus === "in_process" ? "pending"
    : rawStatus === "rejected" || rawStatus === "cancelled" ? "rejected"
    : "unknown";

  const amount = Number(
    (r.transaction_amount as number | undefined) ??
      (auto?.transaction_amount as number | undefined) ??
      0,
  );

  const payerEmail = (payer?.email as string | undefined) || null;
  const firstName = (payer?.first_name as string | undefined) || "";
  const lastName = (payer?.last_name as string | undefined) || "";
  const fullName = `${firstName} ${lastName}`.trim();
  const payerName = fullName || ((payer?.name as string | undefined) ?? null);

  return {
    id: `${type}-${externalId}`,
    receivedAt: new Date().toISOString(),
    type,
    externalId,
    status,
    amount: Number.isFinite(amount) ? amount : 0,
    payerEmail,
    payerName,
    rawTopic: topic,
    // Mantém o payload bruto fora do contrato público — útil só em logs.
    _raw: payload,
  } as const as unknown as import("@/lib/mercadopago-queue.server").MercadoPagoQueueEvent;
}