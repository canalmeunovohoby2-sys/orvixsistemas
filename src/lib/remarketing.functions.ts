import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const TRIAL_DAYS = 7;

/**
 * Painel de Remarketing (2 seções):
 *  A) "Ainda em Teste"           → trial ativo (dentro dos 7 dias).
 *  B) "Oportunidades de Venda"   → trial expirado e sem plano ativo.
 */

export type RemarketingLead = {
  email: string;
  fullName: string | null;
  whatsapp: string | null;
  trialStartDate: string;
  daysLeft: number;              // 0 se expirado
  daysSinceExpiry: number;
  contactedAt: string | null;
  expired: boolean;
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
  .handler(async ({ context }): Promise<{
    active: RemarketingLead[];    // Seção A — ainda em teste
    expired: RemarketingLead[];   // Seção B — oportunidades (pendentes de contato)
    contacted: RemarketingLead[]; // Seção B — já contatados (sub-lista)
  }> => {
    await assertSuperAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Buscamos TODOS os trials — separamos em ativos/expirados em memória.
    const { data: trials, error } = await supabaseAdmin
      .from("trial_accounts")
      .select("email, full_name, whatsapp, trial_start_date, contacted_at")
      .order("trial_start_date", { ascending: false });
    if (error) throw new Error("Falha ao listar leads de remarketing.");

    const emails = (trials ?? []).map((t: any) => (t.email as string).toLowerCase());
    // Exclui quem já tem conta vinculada a uma empresa ativa.
    const activeEmails = new Set<string>();
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
    const totalTrialMs = TRIAL_DAYS * 86_400_000;
    const active: RemarketingLead[] = [];
    const expired: RemarketingLead[] = [];
    const contacted: RemarketingLead[] = [];

    for (const t of (trials ?? []) as Array<{
      email: string; full_name: string | null; whatsapp: string | null;
      trial_start_date: string; contacted_at: string | null;
    }>) {
      // Já assinou plano → sai do funil de remarketing.
      if (activeEmails.has(t.email.toLowerCase())) continue;
      const startMs = new Date(t.trial_start_date).getTime();
      const elapsedMs = now - startMs;
      const isExpired = elapsedMs > totalTrialMs;
      const daysLeft = isExpired ? 0 : Math.max(0, Math.ceil((totalTrialMs - elapsedMs) / 86_400_000));
      const daysSinceExpiry = isExpired ? Math.floor(elapsedMs / 86_400_000) - TRIAL_DAYS : 0;

      const lead: RemarketingLead = {
        email: t.email,
        fullName: t.full_name,
        whatsapp: t.whatsapp,
        trialStartDate: t.trial_start_date,
        daysLeft,
        daysSinceExpiry,
        contactedAt: t.contacted_at ?? null,
        expired: isExpired,
      };

      if (!isExpired) {
        active.push(lead);
      } else if (t.contacted_at) {
        contacted.push(lead);
      } else {
        expired.push(lead);
      }
    }
    return { active, expired, contacted };
  });

function buildRemarketingEmail(email: string, fullName: string | null) {
  const checkoutUrl = "https://orvixsistemas.lovable.app/#planos";
  const nameGreeting = fullName?.trim() ? fullName.trim().split(" ")[0] : "Empreendedor";
  const subject = "O seu negócio evoluiu? O ORVIX está pronto para te ajudar!";
  const advantages = [
    "PDV de alta performance com impressão silenciosa",
    "Modo Offline-First: continue vendendo mesmo sem internet",
    "Sincronização em tempo real entre nuvem e computador",
    "Painel do empresário com relatórios de lucro e vendas",
    "Gestão de estoque precisa e leitor de código de barras",
    "Segurança de dados de nível bancário e suporte humanizado",
  ];
  const advantagesText = advantages.map((a) => `• ${a}`).join("\n");
  const advantagesHtml = advantages.map((a) => `<li>${a}</li>`).join("");

  const text = [
    `Olá ${nameGreeting},`,
    ``,
    `Notamos que seu período de teste no ORVIX encerrou. Não perca a chance de manter seu PDV rodando com:`,
    advantagesText,
    ``,
    `Aproveite nossa oferta mensal e destrave seu acesso agora: ${checkoutUrl}`,
    ``,
    `Basta contratar e fazer login no software instalado com o mesmo e-mail: ${email}.`,
    ``,
    `Qualquer dúvida, responda este e-mail. Estamos aqui para ajudar.`,
    `Equipe ORVIX SISTEMAS`,
  ].join("\n");

  const html = `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111">
    <div style="max-width:600px;margin:0 auto;padding:32px 24px;background:#ffffff">
      <h1 style="color:#850405;font-size:22px;margin:0 0 16px">O seu negócio evoluiu? O ORVIX está pronto para te ajudar! 🚀</h1>
      <p style="font-size:15px;line-height:1.6">Olá <b>${nameGreeting}</b>,</p>
      <p style="font-size:15px;line-height:1.6">Notamos que seu período de teste no <b>ORVIX SISTEMAS</b> encerrou. Não perca a chance de manter seu PDV rodando com:</p>
      <ul style="font-size:15px;line-height:1.7;padding-left:20px">${advantagesHtml}</ul>
      <div style="background:#fff8ee;border:1px solid #FDAA3E;border-radius:12px;padding:20px;margin:24px 0">
        <p style="margin:0;font-size:16px"><b>Aproveite nossa oferta mensal</b> e destrave seu acesso agora.</p>
      </div>
      <p style="text-align:center;margin:28px 0">
        <a href="${checkoutUrl}" style="display:inline-block;background:#850405;color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:700;font-size:15px">Contratar plano mensal agora</a>
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
      .select("email, full_name, contacted_at")
      .eq("email", data.email)
      .maybeSingle();
    if (findErr || !trial) return { ok: false, reason: "Lead não encontrado." };
    if ((trial as any).contacted_at) return { ok: false, reason: "Este lead já foi contatado." };

    const { subject, text, html } = buildRemarketingEmail(
      data.email,
      (trial as any).full_name ?? null,
    );
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
      .update({ contacted_at: new Date().toISOString() } as never)
      .eq("email", data.email);
    if (updErr) return { ok: false, reason: "E-mail enviado, mas falha ao marcar como contatado." };

    return { ok: true, simulated };
  });

export const deleteRemarketingLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { email: string }) =>
    z.object({ email: z.string().trim().toLowerCase().email() }).parse(input),
  )
  .handler(async ({ data, context }): Promise<{ ok: true } | { ok: false; reason: string }> => {
    await assertSuperAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("trial_accounts")
      .delete()
      .eq("email", data.email);
    if (error) return { ok: false, reason: "Falha ao remover o lead." };
    return { ok: true };
  });