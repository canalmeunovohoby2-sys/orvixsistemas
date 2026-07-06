import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const TRIAL_DAYS = 7;

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email({ message: "Informe um e-mail válido." })
  .max(254);

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
  .inputValidator((input: { email: string }) =>
    z.object({ email: emailSchema }).parse(input),
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
        .insert({ email: data.email });
      if (insertErr) {
        return { ok: false, reason: "Falha ao registrar teste. Tente novamente." };
      }
    } else {
      // Atualiza last_seen (não reinicia a contagem).
      await supabaseAdmin
        .from("trial_accounts")
        .update({ last_seen_at: new Date().toISOString() })
        .eq("email", data.email);
    }

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
