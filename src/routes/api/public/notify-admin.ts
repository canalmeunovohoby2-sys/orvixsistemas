import { createFileRoute } from "@tanstack/react-router";

/**
 * Endpoint público de notificação ao administrador.
 *
 * POST /api/public/notify-admin
 * Body: { to: string; subject: string; text: string; html: string }
 *
 * Se RESEND_API_KEY estiver configurada nos secrets do Lovable Cloud,
 * dispara o e-mail real via API do Resend. Caso contrário, retorna
 * `{ simulated: true }` — o lado do cliente já registra o corpo
 * completo na Auditoria como contingência.
 */
export const Route = createFileRoute("/api/public/notify-admin")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const JSON_HEADERS = { "Content-Type": "application/json" } as const;
        try {
          const payload = (await request.json().catch(() => null)) as
            | { to?: string; subject?: string; text?: string; html?: string }
            | null;
          if (!payload?.to || !payload.subject || !(payload.text || payload.html)) {
            return new Response(JSON.stringify({ ok: false, error: "invalid_payload" }), {
              status: 400, headers: JSON_HEADERS,
            });
          }

          const apiKey = process.env.RESEND_API_KEY;
          const from = process.env.RESEND_FROM_EMAIL || "ORVIX SISTEMAS <onboarding@resend.dev>";
          if (!apiKey) {
            return new Response(JSON.stringify({ ok: true, simulated: true }), {
              status: 200, headers: JSON_HEADERS,
            });
          }

          const resp = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              from,
              to: [payload.to],
              subject: payload.subject,
              text: payload.text,
              html: payload.html,
            }),
          });
          if (!resp.ok) {
            const detail = await resp.text().catch(() => "");
            return new Response(JSON.stringify({ ok: false, status: resp.status, detail }), {
              status: 502, headers: JSON_HEADERS,
            });
          }
          const data = await resp.json().catch(() => ({}));
          return new Response(JSON.stringify({ ok: true, sent: true, id: (data as { id?: string }).id }), {
            status: 200, headers: JSON_HEADERS,
          });
        } catch (err) {
          return new Response(JSON.stringify({ ok: false, error: (err as Error).message }), {
            status: 500, headers: JSON_HEADERS,
          });
        }
      },
    },
  },
});