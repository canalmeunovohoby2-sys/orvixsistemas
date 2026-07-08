import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const TRIAL_DAYS = 7;

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email({ message: "Informe um e-mail válido." })
  .max(254);

const nameSchema = z
  .string()
  .trim()
  .min(3, { message: "Informe seu nome completo." })
  .max(120);

// WhatsApp brasileiro: aceita com/sem máscara, valida 11 dígitos (DDD + 9XXXXXXXX)
// ou 10 dígitos (DDD + fixo). Normaliza para dígitos apenas.
const whatsappSchema = z
  .string()
  .transform((v) => (v ?? "").replace(/\D/g, ""))
  .refine((d) => d.length === 10 || d.length === 11, {
    message: "WhatsApp inválido. Use (XX) 9XXXX-XXXX.",
  });

const passwordSchema = z
  .string()
  .min(8, { message: "A senha precisa ter pelo menos 8 caracteres." })
  .max(72, { message: "A senha é muito longa." });

export type TrialStatus = {
  ok: true;
  email: string;
  trialStartDate: string;   // ISO
  serverNow: string;        // ISO (Postgres now())
  daysLeft: number;
  expired: boolean;
  expiresAt: string;        // ISO
};

export type TrialError = { ok: false; reason: string };

/**
 * Cria a conta de teste (idempotente). Se já existir, NÃO reinicia a contagem —
 * apenas retorna os dados atuais. Sempre usa `now()` do Postgres para evitar
 * fraude por manipulação do relógio local (Windows).
 */
export const startTrial = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string; fullName: string; whatsapp: string; password: string }) =>
    z
      .object({
        email: emailSchema,
        fullName: nameSchema,
        whatsapp: whatsappSchema,
        password: passwordSchema,
      })
      .parse(input),
  )
  .handler(async ({ data }): Promise<TrialStatus | TrialError> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Insere se novo; se já existir, mantém trial_start_date original.
    const { data: existing } = await supabaseAdmin
      .from("trial_accounts")
      .select("email, trial_start_date")
      .eq("email", data.email)
      .maybeSingle();

    if (!existing) {
      const { error: insertErr } = await supabaseAdmin
        .from("trial_accounts")
        .insert({
          email: data.email,
          full_name: data.fullName,
          whatsapp: data.whatsapp,
        } as never);
      if (insertErr) {
        return { ok: false, reason: "Falha ao registrar teste. Tente novamente." };
      }
    } else {
      // Atualiza last_seen (não reinicia a contagem).
      await supabaseAdmin
        .from("trial_accounts")
        .update({
          last_seen_at: new Date().toISOString(),
          full_name: data.fullName,
          whatsapp: data.whatsapp,
        } as never)
        .eq("email", data.email);
    }

    // Provisiona/atualiza credenciais reais no Auth + empresa Bronze/Trial dedicada
    // para este e-mail. Idempotente: se o usuário já tem empresa, apenas atualiza
    // a senha para permitir novo login.
    const provision = await provisionTrialAccount(supabaseAdmin, {
      email: data.email,
      fullName: data.fullName,
      password: data.password,
    });
    if (!provision.ok) return { ok: false, reason: provision.reason };

    return computeStatus(data.email, supabaseAdmin);
  });

/**
 * Consulta status atual do teste — usa `now()` do banco.
 * Retorna `expired: true` quando (server_now - trial_start_date) > 7 dias.
 */
export const checkTrialStatus = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string }) =>
    z.object({ email: emailSchema }).parse(input),
  )
  .handler(async ({ data }): Promise<TrialStatus | TrialError> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    return computeStatus(data.email, supabaseAdmin);
  });

async function computeStatus(
  email: string,
  supabaseAdmin: Awaited<ReturnType<typeof getAdmin>>,
): Promise<TrialStatus | TrialError> {
  // Uma única chamada RPC-ish via select: server_now e trial_start_date juntos.
  const { data, error } = await supabaseAdmin
    .from("trial_accounts")
    .select("email, trial_start_date")
    .eq("email", email)
    .maybeSingle();

  if (error) return { ok: false, reason: "Falha ao consultar teste." };
  if (!data) return { ok: false, reason: "Conta de teste não encontrada." };

  // Busca `now()` do banco em uma segunda consulta trivial — imune ao relógio local.
  const { data: nowRow } = await supabaseAdmin
    .rpc("trial_server_now")
    .single<{ now: string }>();

  const serverNowIso: string =
    (nowRow as { now?: string } | null)?.now ?? new Date().toISOString();

  const start = new Date(data.trial_start_date).getTime();
  const now = new Date(serverNowIso).getTime();
  const elapsedMs = now - start;
  const totalMs = TRIAL_DAYS * 86_400_000;
  const daysLeft = Math.max(0, Math.ceil((totalMs - elapsedMs) / 86_400_000));
  const expired = elapsedMs > totalMs;
  const expiresAt = new Date(start + totalMs).toISOString();

  return {
    ok: true,
    email: data.email,
    trialStartDate: data.trial_start_date,
    serverNow: serverNowIso,
    daysLeft,
    expired,
    expiresAt,
  };
}

// Tipo auxiliar para o cliente admin (evita import direto no top-level).
async function getAdmin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/**
 * Cria/atualiza o usuário Auth do trial + empresa dedicada no plano Bronze,
 * status `trial`, `is_mock=false`. Idempotente por e-mail.
 */
async function provisionTrialAccount(
  supabaseAdmin: Awaited<ReturnType<typeof getAdmin>>,
  input: { email: string; fullName: string; password: string },
): Promise<{ ok: true; userId: string; companyId: string } | { ok: false; reason: string }> {
  const email = input.email;

  // 1) Já existe app_user com esta identidade? Se sim, apenas atualiza a senha.
  const existingId = await findAuthUserIdByEmailPaged(supabaseAdmin, email);
  if (existingId) {
    const { data: profile } = await supabaseAdmin
      .from("app_users")
      .select("id, company_id, role")
      .eq("id", existingId)
      .maybeSingle();
    if (profile?.company_id) {
      const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(existingId, {
        password: input.password,
        email_confirm: true,
        user_metadata: { name: input.fullName, company_id: profile.company_id, role: profile.role ?? "admin" },
      });
      if (updErr) return { ok: false, reason: "Falha ao atualizar senha." };
      return { ok: true, userId: existingId, companyId: String(profile.company_id) };
    }
  }

  // 2) Nova conta: gera ID da empresa, cria empresa Bronze/Trial e vincula.
  const { data: nextIdRow, error: nidErr } = await supabaseAdmin.rpc("next_company_id");
  if (nidErr || !nextIdRow) return { ok: false, reason: "Falha ao gerar ID da empresa." };
  const companyId = String(nextIdRow);

  const fantasia = deriveCompanyName(email, input.fullName);
  const { error: cErr } = await supabaseAdmin.from("companies").insert({
    id: companyId,
    razao_social: `${fantasia} — Teste 7 dias`,
    fantasia,
    cnpj: "",
    plan: "bronze",
    status: "trial",
    mrr: 0,
    due_date: new Date(Date.now() + TRIAL_DAYS * 86_400_000).toISOString(),
    onboarding_pending: true,
    is_demo: false,
    is_mock: false,
    is_trial: true,
  } as never);
  if (cErr) return { ok: false, reason: `Falha ao criar empresa (${cErr.message}).` };

  const metadata = { name: input.fullName, company_id: companyId, role: "admin" as const };
  let userId = existingId ?? "";
  if (userId) {
    const { error: updErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: input.password,
      email_confirm: true,
      user_metadata: metadata,
    });
    if (updErr) {
      await supabaseAdmin.from("companies").delete().eq("id", companyId);
      return { ok: false, reason: "Falha ao atualizar credenciais." };
    }
  } else {
    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: input.password,
      email_confirm: true,
      user_metadata: metadata,
    });
    if (createErr || !created.user) {
      await supabaseAdmin.from("companies").delete().eq("id", companyId);
      return { ok: false, reason: createErr?.message ?? "Falha ao criar usuário." };
    }
    userId = created.user.id;
  }

  const { error: uErr } = await supabaseAdmin.from("app_users").upsert({
    id: userId,
    name: input.fullName,
    email,
    role: "admin",
    company_id: companyId,
    is_temporary_password: false,
  } as never);
  if (uErr) {
    await supabaseAdmin.from("companies").delete().eq("id", companyId);
    return { ok: false, reason: uErr.message };
  }

  return { ok: true, userId, companyId };
}

async function findAuthUserIdByEmailPaged(
  supabaseAdmin: Awaited<ReturnType<typeof getAdmin>>,
  email: string,
): Promise<string | null> {
  const normalized = email.trim().toLowerCase();
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) return null;
    const found = data?.users.find((u) => (u.email ?? "").toLowerCase() === normalized);
    if (found) return found.id;
    if (!data?.users.length || data.users.length < 1000) break;
  }
  return null;
}

function deriveCompanyName(email: string, fullName: string): string {
  const first = (fullName || "").trim().split(/\s+/)[0] ?? "";
  if (first && first.length >= 2) return `Loja ${first}`;
  const local = email.split("@")[0] ?? "cliente";
  return `Loja ${local}`;
}
