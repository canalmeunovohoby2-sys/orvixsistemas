import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/**
 * Fila "Oportunidades de Remarketing": e-mails de trial cujo período expirou há
 * MAIS de 7 dias (i.e. trial_start_date < now() - 14 dias), que ainda não
 * possuem plano ativo e ainda não foram contatados pelo Super Admin.
 */

export type RemarketingLead = {
  email: string;
  trialStartDate: string;
  daysSinceExpiry: number;
  contactedAt: string | null;
};

async function assertSuperAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("app_users")
    .select("role, email")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error("Falha ao validar permissão.");
  if (!data || data.role !== "super_admin") throw new Error("Acesso negado.");
  return data.email as string;
}

export const listRemarketingLeads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ pending: RemarketingLead[]; contacted: RemarketingLead[] }> => {
    await assertSuperAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Trials expirados há mais de 7 dias → trial_start_date < now() - 14d
    const cutoff = new Date(Date.now() - 14 * 86_400_000).toISOString();
    const { data: trials, error } = await supabaseAdmin
      .from("trial_accounts")
      .select("email, trial_start_date, contacted_at")
      .lt("trial_start_date", cutoff)
      .order("trial_start_date", { ascending: false });
    if (error) throw new Error("Falha ao listar leads de remarketing.");

    const emails = (trials ?? []).map((t) => t.email.toLowerCase());
    // Exclui quem já tem conta vinculada a uma empresa ativa.
    let activeEmails = new Set<string>();
    if (emails.length) {
      const { data: active } = await supabaseAdmin
        .from("app_users")
        .select("email, companies!inner(status)")
        .in("email", emails);
      for (const u of (active ?? []) as Array<{ email: string; companies: { status: string } | null }>) {
        if (u.companies && u.companies.status === "active") activeEmails.add(u.email.toLowerCase());
      }
    }

    const now = Date.now();
    const pending: RemarketingLead[] = [];
    const contacted: RemarketingLead[] = [];
    for (const t of trials ?? []) {
      if (activeEmails.has(t.email.toLowerCase())) continue;
      const startMs = new Date(t.trial_start_date).getTime();
      const daysSinceExpiry = Math.floor((now - startMs) / 86_400_000) - 7;
      const lead: RemarketingLead = {
        email: t.email,
        trialStartDate: t.trial_start_date,
        daysSinceExpiry,
        contactedAt: t.contacted_at ?? null,
      };
      if (t.contacted_at) contacted.push(lead);
      else pending.push(lead);
    }
    return { pending, contacted };
  });

function buildRemarketingEmail(email: string) {
  const checkoutUrl = "https://orvixsistemas.lovable.app/#planos";
  const subject = "Orvix Sistemas: Seu negócio não pode parar!";
  const text = [
    `Olá,`,
    ``,
    `Percebemos que você testou o ORVIX SISTEMAS nos últimos dias — e sabemos como é difícil administrar um comércio sem ferramentas que realmente funcionam.`,
    ``,
    `Durante o seu teste, o ORVIX te entregou:`,
    `• PDV completo (venda em segundos, com impressão silenciosa)`,
    `• Controle de estoque, clientes e fornecedores em tempo real`,
    `• Relatórios financeiros que mostram para onde o dinheiro está indo`,
    `• Sincronização automática entre a nuvem e o computador da loja`,
    ``,
    `Sem uma solução assim, cada venda perdida por lentidão, cada estoque estourado e cada relatório impreciso continua custando caro — todo santo dia.`,
    ``,
    `Por isso, preparamos uma OFERTA EXCLUSIVA para você reativar o acesso agora:`,
    `→ 15% OFF no primeiro mês de qualquer plano.`,
    `→ Cupom automático ao contratar por este link: ${checkoutUrl}`,
    ``,
    `O botão do software instalado no seu computador continua funcionando — basta contratar o plano e fazer login normalmente com o mesmo e-mail: ${email}.`,
    ``,
    `Qualquer dúvida, responda este e-mail. Estamos aqui para ajudar você a voltar a vender com o ORVIX.`,
    ``,
    `Equipe ORVIX SISTEMAS`,
  ].join("\n");

  const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111">
    <div style="max-width:600px;margin:0 auto;padding:32px 24px;background:#ffffff">
      <h1 style="color:#850405;font-size:22px;margin:0 0 16px">Seu negócio não pode parar 🚀</h1>
      <p style="font-size:15px;line-height:1.6">Olá,</p>
      <p style="font-size:15px;line-height:1.6">Percebemos que você testou o <b>ORVIX SISTEMAS</b> nos últimos dias — e sabemos como é difícil administrar um comércio sem ferramentas que realmente funcionam.</p>
      <p style="font-size:15px;line-height:1.6"><b>Durante o seu teste, o ORVIX te entregou:</b></p>
      <ul style="font-size:15px;line-height:1.7;padding-left:20px">
        <li>PDV completo (venda em segundos, com impressão silenciosa)</li>
        <li>Controle de estoque, clientes e fornecedores em tempo real</li>
        <li>Relatórios financeiros que mostram para onde o dinheiro está indo</li>
        <li>Sincronização automática entre a nuvem e o computador da loja</li>
      </ul>
      <p style="font-size:15px;line-height:1.6">Sem uma solução assim, cada venda perdida por lentidão e cada estoque estourado continua custando caro — todo dia.</p>
      <div style="background:#fff8ee;border:1px solid #FDAA3E;border-radius:12px;padding:20px;margin:24px 0">
        <p style="margin:0;font-size:16px"><b>Oferta exclusiva para voltar hoje:</b></p>
        <p style="margin:8px 0 0;font-size:18px;color:#850405"><b>15% OFF no primeiro mês</b> de qualquer plano.</p>
      </div>
      <p style="text-align:center;margin:28px 0">
        <a href="${checkoutUrl}" style="display:inline-block;background:#850405;color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:700;font-size:15px">Contratar plano com 15% OFF</a>
      </p>
      <p style="font-size:14px;line-height:1.6;color:#555">Basta contratar e fazer login no software instalado com o mesmo e-mail: <b>${email}</b>.</p>
      <p style="font-size:13px;line-height:1.6;color:#888;margin-top:32px">Qualquer dúvida, responda este e-mail. Estamos aqui para ajudar.<br/>Equipe ORVIX SISTEMAS</p>
    </div>
  </body></html>`;

  return { subject, text, html };
}

export const sendRemarketingEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { email: string }) =>
    z.object({ email: z.string().trim().toLowerCase().email() }).parse(input),
  )
  .handler(async ({ data, context }): Promise<{ ok: true; simulated: boolean } | { ok: false; reason: string }> => {
    await assertSuperAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: trial, error: findErr } = await supabaseAdmin
      .from("trial_accounts")
      .select("email, contacted_at")
      .eq("email", data.email)
      .maybeSingle();
    if (findErr || !trial) return { ok: false, reason: "Lead não encontrado." };
    if (trial.contacted_at) return { ok: false, reason: "Este lead já foi contatado." };

    const { subject, text, html } = buildRemarketingEmail(data.email);
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL || "ORVIX SISTEMAS <onboarding@resend.dev>";
    let simulated = true;
    if (apiKey) {
      const resp = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from,
          to: [data.email],
          subject,
          text,
          html,
          headers: {
            // Cabeçalho de "one-click unsubscribe" ajuda a evitar SPAM.
            "List-Unsubscribe": "<mailto:orvixsistemas@gmail.com?subject=unsubscribe>",
          },
        }),
      });
      if (!resp.ok) {
        const detail = await resp.text().catch(() => "");
        return { ok: false, reason: `Falha no provedor (${resp.status}): ${detail.slice(0, 200)}` };
      }
      simulated = false;
    }

    const { error: updErr } = await supabaseAdmin
      .from("trial_accounts")
      .update({ contacted_at: new Date().toISOString() })
      .eq("email", data.email);
    if (updErr) return { ok: false, reason: "E-mail enviado, mas falha ao marcar como contatado." };

    return { ok: true, simulated };
  });