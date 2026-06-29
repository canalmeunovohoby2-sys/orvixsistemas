import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/** E-mail do Super Admin oficial da ORVIX SISTEMAS (bootstrap). */
const SUPER_ADMIN_EMAIL = "orvixsistemas@gmail.com";
/** Senha padrão de primeiro acesso — usada APENAS quando ainda não existe Super Admin. */
const SUPER_ADMIN_DEFAULT_PASSWORD = "OrvixAdmin@2026";

/* ============================================================
 * Bootstrap do Super Admin (idempotente, público).
 * Garante que o e-mail principal sempre consiga acessar o painel
 * mesmo em um banco recém-criado. NÃO sobrescreve senha se já existir.
 * ============================================================ */
export const ensureSuperAdmin = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // 1) Já existe alguma linha em app_users com role=super_admin?
  const { data: existing } = await supabaseAdmin
    .from("app_users")
    .select("id, email")
    .eq("role", "super_admin")
    .limit(1)
    .maybeSingle();
  if (existing) return { ok: true, created: false, email: existing.email };

  // 2) Procura usuário Auth com o e-mail oficial. Se não existir, cria.
  let userId: string | null = null;
  const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const found = list?.users.find((u) => (u.email ?? "").toLowerCase() === SUPER_ADMIN_EMAIL);
  if (found) {
    userId = found.id;
  } else {
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: SUPER_ADMIN_EMAIL,
      password: SUPER_ADMIN_DEFAULT_PASSWORD,
      email_confirm: true,
      user_metadata: { name: "Tiago (Orvix Sistemas)" },
    });
    if (error || !created.user) {
      return { ok: false, reason: error?.message ?? "Falha ao criar Super Admin." };
    }
    userId = created.user.id;
  }

  // 3) Insere/atualiza a linha em app_users com role super_admin.
  const { error: upErr } = await supabaseAdmin.from("app_users").upsert({
    id: userId,
    name: "Tiago (Orvix Sistemas)",
    email: SUPER_ADMIN_EMAIL,
    role: "super_admin",
    company_id: null,
    is_temporary_password: false,
  });
  if (upErr) return { ok: false, reason: upErr.message };

  return { ok: true, created: true, email: SUPER_ADMIN_EMAIL };
});

/* ============================================================
 * Cria uma nova empresa + usuário admin (dono) com senha temporária.
 * Só pode ser chamado por um Super Admin.
 * ============================================================ */
const CreateCompanySchema = z.object({
  razaoSocial: z.string().min(2),
  fantasia: z.string().min(2),
  cnpj: z.string().default(""),
  plan: z.enum(["bronze", "prata", "ouro"]).default("bronze"),
  status: z.enum(["trial", "active", "pending", "blocked", "canceled"]).default("active"),
  ownerName: z.string().min(2),
  ownerEmail: z.string().email(),
  ownerPassword: z.string().min(6),
  isDemo: z.boolean().default(false),
  onboardingPending: z.boolean().default(true),
});

export const adminCreateCompanyWithOwner = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => CreateCompanySchema.parse(d))
  .handler(async ({ data, context }) => {
    // Autoriza: somente super_admin
    const { data: isSA } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "super_admin",
    });
    if (!isSA) return { ok: false as const, reason: "Acesso negado." };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Gera próximo ID via função SQL
    const { data: nextIdRow, error: nidErr } = await supabaseAdmin.rpc("next_company_id");
    if (nidErr || !nextIdRow) return { ok: false as const, reason: nidErr?.message ?? "Falha ao gerar ID." };
    const companyId = String(nextIdRow);

    // Cria empresa
    const { data: company, error: cErr } = await supabaseAdmin
      .from("companies")
      .insert({
        id: companyId,
        razao_social: data.razaoSocial,
        fantasia: data.fantasia,
        cnpj: data.cnpj,
        plan: data.plan,
        status: data.status,
        mrr: 0,
        due_date: new Date(Date.now() + 30 * 86400000).toISOString(),
        onboarding_pending: data.onboardingPending,
        is_demo: data.isDemo,
      })
      .select()
      .single();
    if (cErr || !company) return { ok: false as const, reason: cErr?.message ?? "Falha ao criar empresa." };

    // Cria usuário Auth do dono
    const email = data.ownerEmail.trim().toLowerCase();
    const { data: created, error: aErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: data.ownerPassword,
      email_confirm: true,
      user_metadata: { name: data.ownerName, company_id: companyId, role: "admin" },
    });
    if (aErr || !created.user) {
      // rollback empresa
      await supabaseAdmin.from("companies").delete().eq("id", companyId);
      return { ok: false as const, reason: aErr?.message ?? "Falha ao criar usuário do dono." };
    }

    // Cria/atualiza app_users do dono
    const { error: uErr } = await supabaseAdmin.from("app_users").upsert({
      id: created.user.id,
      name: data.ownerName,
      email,
      role: "admin",
      company_id: companyId,
      is_temporary_password: true,
    });
    if (uErr) {
      await supabaseAdmin.auth.admin.deleteUser(created.user.id);
      await supabaseAdmin.from("companies").delete().eq("id", companyId);
      return { ok: false as const, reason: uErr.message };
    }

    return { ok: true as const, companyId, ownerId: created.user.id, ownerEmail: email };
  });

/* ============================================================
 * Cria um operador de caixa (cashier) com credenciais explícitas
 * dentro da empresa do admin chamador (ou de qualquer empresa, se super_admin).
 * ============================================================ */
const CreateCashierSchema = z.object({
  companyId: z.string().min(1),
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

export const adminCreateCashier = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => CreateCashierSchema.parse(d))
  .handler(async ({ data, context }) => {
    // Autoriza: super_admin OU admin do mesmo company
    const { data: meRow } = await context.supabase
      .from("app_users")
      .select("role, company_id")
      .eq("id", context.userId)
      .maybeSingle();
    if (!meRow) return { ok: false as const, reason: "Sessão inválida." };
    const canManage =
      meRow.role === "super_admin" || (meRow.role === "admin" && meRow.company_id === data.companyId);
    if (!canManage) return { ok: false as const, reason: "Acesso negado." };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = data.email.trim().toLowerCase();

    const { data: created, error: aErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: data.password,
      email_confirm: true,
      user_metadata: { name: data.name, company_id: data.companyId, role: "cashier" },
    });
    if (aErr || !created.user) return { ok: false as const, reason: aErr?.message ?? "Falha ao criar usuário." };

    const { error: uErr } = await supabaseAdmin.from("app_users").upsert({
      id: created.user.id,
      name: data.name,
      email,
      role: "cashier",
      company_id: data.companyId,
      is_temporary_password: false,
    });
    if (uErr) {
      await supabaseAdmin.auth.admin.deleteUser(created.user.id);
      return { ok: false as const, reason: uErr.message };
    }

    return { ok: true as const, userId: created.user.id, email };
  });

/* ============================================================
 * Remove um usuário (auth + app_users) — para apagar cashier
 * criado pelo dono ou usuários removidos pelo Super Admin.
 * ============================================================ */
export const adminDeleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ userId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: target } = await context.supabase
      .from("app_users")
      .select("id, role, company_id")
      .eq("id", data.userId)
      .maybeSingle();
    if (!target) return { ok: false as const, reason: "Usuário não encontrado." };

    const { data: meRow } = await context.supabase
      .from("app_users")
      .select("role, company_id")
      .eq("id", context.userId)
      .maybeSingle();
    if (!meRow) return { ok: false as const, reason: "Sessão inválida." };
    const canManage =
      meRow.role === "super_admin" ||
      (meRow.role === "admin" && meRow.company_id === target.company_id && target.role === "cashier");
    if (!canManage) return { ok: false as const, reason: "Acesso negado." };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("app_users").delete().eq("id", data.userId);
    await supabaseAdmin.auth.admin.deleteUser(data.userId);
    return { ok: true as const };
  });

/* ============================================================
 * Remove uma empresa inteira (cascata via FK ON DELETE CASCADE)
 * + apaga todos os usuários Auth vinculados.
 * ============================================================ */
export const adminDeleteCompany = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ companyId: z.string().min(1) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: isSA } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "super_admin",
    });
    if (!isSA) return { ok: false as const, reason: "Acesso negado." };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: users } = await supabaseAdmin
      .from("app_users")
      .select("id")
      .eq("company_id", data.companyId);
    await supabaseAdmin.from("companies").delete().eq("id", data.companyId);
    if (users) {
      for (const u of users) {
        await supabaseAdmin.auth.admin.deleteUser(u.id);
      }
    }
    return { ok: true as const };
  });

/* ============================================================
 * Atualiza a senha de um usuário (usado pelo modal de troca obrigatória
 * em nome do próprio usuário; basta passar a nova senha).
 * ============================================================ */
export const adminClearTemporaryPasswordFlag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("app_users")
      .update({ is_temporary_password: false })
      .eq("id", context.userId);
    return { ok: true as const };
  });