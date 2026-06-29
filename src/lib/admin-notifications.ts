import { logEvent, type Plan } from "./mock-data";
import { PLAN_LABEL, PLAN_PRICE, SUPER_ADMIN_EMAIL, getPlanCaixasLimit } from "./saas-context-constants";

export type AdminNotificationOrigin = "Cadastro Real" | "Simulação";

export type AdminNotificationPayload = {
  storeName: string;
  ownerName: string;
  contactEmail: string;
  plan: Plan;
  origin: AdminNotificationOrigin;
  companyId: string;
  cnpj?: string;
  phone?: string;
  segment?: string;
};

function buildEmailBody(p: AdminNotificationPayload): { subject: string; text: string; html: string } {
  const terminals = getPlanCaixasLimit(p.plan);
  const price = PLAN_PRICE[p.plan];
  const subject = `[ORVIX] ${p.origin} — ${p.storeName} (${PLAN_LABEL[p.plan]})`;
  const lines = [
    `Origem do cadastro:  ${p.origin}`,
    `Loja / Razão Social: ${p.storeName}`,
    `Proprietário:        ${p.ownerName}`,
    `E-mail de contato:   ${p.contactEmail}`,
    `CNPJ/CPF:            ${p.cnpj ?? "—"}`,
    `Telefone:            ${p.phone ?? "—"}`,
    `Segmento:            ${p.segment ?? "—"}`,
    `Plano selecionado:   ${PLAN_LABEL[p.plan]} (R$ ${price.toFixed(2)}/mês)`,
    `Limite de terminais: ${terminals}`,
    `ID da empresa:       ${p.companyId}`,
  ];
  const text = lines.join("\n");
  const html = `<div style="font-family:ui-sans-serif,system-ui;font-size:14px;color:#0a0a0a">
    <h2 style="margin:0 0 12px;color:#850405">${subject}</h2>
    <pre style="background:#0a0a0a;color:#f5f5f5;padding:16px;border-radius:8px;line-height:1.55">${lines.join("\n")}</pre>
    <p style="color:#666;margin-top:12px">Notificação automática · ORVIX SISTEMAS</p>
  </div>`;
  return { subject, text, html };
}

/**
 * Notifica o administrador (orvixsistemas@gmail.com) sobre um novo cliente —
 * tanto cadastros reais (onboarding concluído) quanto simulações geradas no
 * Painel Master. Sempre grava o corpo completo na Auditoria como contingência;
 * se RESEND_API_KEY estiver configurada no servidor, também dispara o e-mail
 * real via /api/public/notify-admin.
 */
export async function notifyAdminNewClient(payload: AdminNotificationPayload): Promise<void> {
  const { subject, text, html } = buildEmailBody(payload);

  // 1) Contingência sempre executada: registro completo na Auditoria.
  logEvent({
    kind: "SETTINGS_UPDATE",
    company_id: payload.companyId,
    companyName: payload.storeName,
    user: "Notificação Admin",
    action:
      `📧 E-mail para ${SUPER_ADMIN_EMAIL} — ${subject}\n\n${text}`,
  });

  // 2) Tenta disparar o e-mail real (silencioso se a chave não estiver setada).
  try {
    const res = await fetch("/api/public/notify-admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: SUPER_ADMIN_EMAIL, subject, text, html }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      logEvent({
        kind: "SETTINGS_UPDATE",
        company_id: payload.companyId,
        companyName: payload.storeName,
        user: "Notificação Admin",
        action: `⚠️ Falha ao entregar e-mail (HTTP ${res.status}). Detalhe: ${detail.slice(0, 240)}`,
      });
    }
  } catch (err) {
    logEvent({
      kind: "SETTINGS_UPDATE",
      company_id: payload.companyId,
      companyName: payload.storeName,
      user: "Notificação Admin",
      action: `⚠️ Erro de rede ao tentar enviar e-mail: ${(err as Error).message}`,
    });
  }
}