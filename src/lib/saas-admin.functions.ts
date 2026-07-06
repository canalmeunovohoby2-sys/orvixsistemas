import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/** E-mail do Super Admin oficial da ORVIX SISTEMAS (bootstrap). */
const SUPER_ADMIN_EMAIL = "orvixsistemas@gmail.com";
/** Senha padrão de primeiro acesso — usada APENAS quando ainda não existe Super Admin. */
const SUPER_ADMIN_DEFAULT_PASSWORD = "OrvixAdmin@2026";
/** Credencial master de homologação solicitada para destravar testes. */
const TEST_ADMIN_EMAIL = "teste@orvix.com";
const TEST_ADMIN_PASSWORD = "Orvix@2026";
const TEST_COMPANY_ID = "EMP_TESTE";
const TEST_CASHIER_EMAIL = "caixa.teste@orvix.com";
const TEST_CASHIER_PASSWORD = "OrvixCaixa@2026";

type CanonicalRole = "super_admin" | "admin" | "cashier";

function normalizeAppRole(value: unknown): CanonicalRole {
  if (value === "super_admin" || value === "admin" || value === "cashier") return value;
  if (value === "operator" || value === "client") return "cashier";
  return "cashier";
}

async function findAuthUserIdByEmail(
  supabaseAdmin: Awaited<typeof import("@/integrations/supabase/client.server")>["supabaseAdmin"],
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

async function ensureAuthUser(
  supabaseAdmin: Awaited<typeof import("@/integrations/supabase/client.server")>["supabaseAdmin"],
  input: { email: string; password: string; name: string; companyId: string | null; role: CanonicalRole },
): Promise<{ ok: true; userId: string } | { ok: false; reason: string }> {
  const email = input.email.trim().toLowerCase();
  const metadata = { name: input.name, company_id: input.companyId, role: input.role };
  const existingId = await findAuthUserIdByEmail(supabaseAdmin, email);

  if (existingId) {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(existingId, {
      password: input.password,
      email_confirm: true,
      user_metadata: metadata,
    });
    if (error) return { ok: false, reason: error.message };
    return { ok: true, userId: existingId };
  }

  const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
    user_metadata: metadata,
  });
  if (error || !created.user) {
    return { ok: false, reason: error?.message ?? `Falha ao criar ${email}.` };
  }
  return { ok: true, userId: created.user.id };
}

async function getAuthenticatedProfile(
  supabaseAdmin: Awaited<typeof import("@/integrations/supabase/client.server")>["supabaseAdmin"],
  userId: string,
) {
  const { data } = await supabaseAdmin
    .from("app_users")
    .select("id, name, email, role, company_id, is_temporary_password")
    .eq("id", userId)
    .maybeSingle();
  return data;
}

async function isSuperAdminUser(
  supabaseAdmin: Awaited<typeof import("@/integrations/supabase/client.server")>["supabaseAdmin"],
  userId: string,
) {
  const profile = await getAuthenticatedProfile(supabaseAdmin, userId);
  return profile?.role === "super_admin";
}

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
 * Bootstrap público de homologação (idempotente).
 * Garante login imediato em teste@orvix.com / Orvix@2026 e uma
 * empresa ativa com um terminal de caixa associado.
 * ============================================================ */
export const ensureTestUser = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { error: companyErr } = await supabaseAdmin.from("companies").upsert({
    id: TEST_COMPANY_ID,
    razao_social: "ORVIX Loja de Testes LTDA",
    fantasia: "ORVIX Loja de Testes",
    cnpj: "00.000.000/0001-91",
    plan: "ouro",
    status: "active",
    mrr: 0,
    due_date: new Date(Date.now() + 7 * 86400000).toISOString(),
    onboarding_pending: false,
    is_demo: true,
    phone: "(11) 99999-2026",
    segment: "Homologação / PDV",
  });
  if (companyErr) return { ok: false as const, reason: companyErr.message };

  const admin = await ensureAuthUser(supabaseAdmin, {
    email: TEST_ADMIN_EMAIL,
    password: TEST_ADMIN_PASSWORD,
    name: "Admin Teste ORVIX",
    companyId: TEST_COMPANY_ID,
    role: "admin",
  });
  if (!admin.ok) return { ok: false as const, reason: admin.reason };

  const { error: adminProfileErr } = await supabaseAdmin.from("app_users").upsert({
    id: admin.userId,
    name: "Admin Teste ORVIX",
    email: TEST_ADMIN_EMAIL,
    role: "admin",
    company_id: TEST_COMPANY_ID,
    is_temporary_password: false,
  });
  if (adminProfileErr) return { ok: false as const, reason: adminProfileErr.message };

  const cashier = await ensureAuthUser(supabaseAdmin, {
    email: TEST_CASHIER_EMAIL,
    password: TEST_CASHIER_PASSWORD,
    name: "Caixa Teste ORVIX",
    companyId: TEST_COMPANY_ID,
    role: "cashier",
  });
  if (!cashier.ok) return { ok: false as const, reason: cashier.reason };

  const { error: cashierProfileErr } = await supabaseAdmin.from("app_users").upsert({
    id: cashier.userId,
    name: "Caixa Teste ORVIX",
    email: TEST_CASHIER_EMAIL,
    role: "cashier",
    company_id: TEST_COMPANY_ID,
    is_temporary_password: false,
  });
  if (cashierProfileErr) return { ok: false as const, reason: cashierProfileErr.message };

  return {
    ok: true as const,
    email: TEST_ADMIN_EMAIL,
    companyId: TEST_COMPANY_ID,
    cashierEmail: TEST_CASHIER_EMAIL,
  };
});

/* ============================================================
 * Validação/reparo de login (fallback server-side com service role).
 * Garante que qualquer usuário aceito pelo Supabase Auth seja lido na
 * mesma tabela app_users usada na criação de empresas/terminais, mesmo
 * quando a RLS ou uma migração deixou o perfil invisível ao client.
 * ============================================================ */
export const resolveLoginProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let profile = await getAuthenticatedProfile(supabaseAdmin, context.userId);

    if (!profile) {
      const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.getUserById(context.userId);
      const authUser = authData?.user;
      if (authErr || !authUser?.email) {
        return { ok: false as const, reason: authErr?.message ?? "Usuário Auth não encontrado." };
      }

      const metadata = authUser.user_metadata ?? {};
      const role = normalizeAppRole(metadata.role);
      const companyId = typeof metadata.company_id === "string" ? metadata.company_id : null;
      if (role !== "super_admin" && !companyId) {
        return { ok: false as const, reason: "Usuário Auth sem empresa vinculada no metadata." };
      }

      if (companyId) {
        const { data: companyExists } = await supabaseAdmin
          .from("companies")
          .select("id")
          .eq("id", companyId)
          .maybeSingle();
        if (!companyExists) return { ok: false as const, reason: "Empresa vinculada ao usuário não existe." };
      }

      const name = typeof metadata.name === "string" && metadata.name.trim()
        ? metadata.name.trim()
        : authUser.email;
      const { error: upErr } = await supabaseAdmin.from("app_users").upsert({
        id: context.userId,
        name,
        email: authUser.email.toLowerCase(),
        role,
        company_id: role === "super_admin" ? null : companyId,
        is_temporary_password: false,
      });
      if (upErr) return { ok: false as const, reason: upErr.message };
      profile = await getAuthenticatedProfile(supabaseAdmin, context.userId);
    }

    if (!profile) return { ok: false as const, reason: "Usuário sem perfil cadastrado na plataforma." };

    const canonicalRole = normalizeAppRole(profile.role);
    if (profile.role !== canonicalRole) {
      // Perfis legados operator/client viram cashier no app; caso o banco aceite
      // apenas o enum canônico, esta atualização também elimina dessinc futuro.
      await supabaseAdmin.from("app_users").update({ role: canonicalRole }).eq("id", context.userId);
    }

    return {
      ok: true as const,
      user: {
        id: profile.id,
        name: profile.name || profile.email,
        email: String(profile.email).toLowerCase(),
        role: canonicalRole,
        companyId: profile.company_id,
        isTemporaryPassword: Boolean(profile.is_temporary_password),
      },
    };
  });

/* ============================================================
 * Reparo de perfil pós-login.
 * Se o Auth aceitou a senha, mas app_users ficou ausente/inconsistente
 * durante a migração, recria o perfil a partir do metadata do Auth.
 * ============================================================ */
export const repairAuthenticatedUserProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: existing } = await context.supabase
      .from("app_users")
      .select("id")
      .eq("id", context.userId)
      .maybeSingle();
    if (existing) return { ok: true as const, repaired: false };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.getUserById(context.userId);
    const authUser = authData?.user;
    if (authErr || !authUser?.email) {
      return { ok: false as const, reason: authErr?.message ?? "Usuário Auth não encontrado." };
    }

    const metadata = authUser.user_metadata ?? {};
    const role = normalizeAppRole(metadata.role);
    const companyId = typeof metadata.company_id === "string" ? metadata.company_id : null;
    if (role !== "super_admin" && !companyId) {
      return { ok: false as const, reason: "Usuário Auth sem empresa vinculada no metadata." };
    }
    if (companyId) {
      const { data: companyExists } = await supabaseAdmin
        .from("companies")
        .select("id")
        .eq("id", companyId)
        .maybeSingle();
      if (!companyExists) return { ok: false as const, reason: "Empresa vinculada ao usuário não existe." };
    }

    const name = typeof metadata.name === "string" && metadata.name.trim()
      ? metadata.name.trim()
      : authUser.email;
    const { error: upErr } = await supabaseAdmin.from("app_users").upsert({
      id: context.userId,
      name,
      email: authUser.email.toLowerCase(),
      role,
      company_id: role === "super_admin" ? null : companyId,
      is_temporary_password: false,
    });
    if (upErr) return { ok: false as const, reason: upErr.message };
    return { ok: true as const, repaired: true };
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
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Autoriza: somente super_admin
    const isSA = await isSuperAdminUser(supabaseAdmin, context.userId);
    if (!isSA) return { ok: false as const, reason: "Acesso negado." };

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
        due_date: new Date(Date.now() + (data.status === "trial" ? 7 : 30) * 86400000).toISOString(),
        onboarding_pending: data.onboardingPending,
        is_demo: data.isDemo,
      })
      .select()
      .single();
    if (cErr || !company) return { ok: false as const, reason: cErr?.message ?? "Falha ao criar empresa." };

    // Cria/atualiza usuário Auth do dono no MESMO fluxo usado pelo login.
    // Se o e-mail já existir por causa de uma tentativa anterior de migração,
    // resetamos senha + metadata em vez de deixar um perfil órfão.
    const email = data.ownerEmail.trim().toLowerCase();
    const owner = await ensureAuthUser(supabaseAdmin, {
      email,
      password: data.ownerPassword,
      name: data.ownerName,
      companyId,
      role: "admin",
    });
    if (!owner.ok) {
      // rollback empresa
      await supabaseAdmin.from("companies").delete().eq("id", companyId);
      return { ok: false as const, reason: owner.reason };
    }

    // Cria/atualiza app_users do dono
    const { error: uErr } = await supabaseAdmin.from("app_users").upsert({
      id: owner.userId,
      name: data.ownerName,
      email,
      role: "admin",
      company_id: companyId,
      is_temporary_password: true,
    });
    if (uErr) {
      await supabaseAdmin.auth.admin.deleteUser(owner.userId);
      await supabaseAdmin.from("companies").delete().eq("id", companyId);
      return { ok: false as const, reason: uErr.message };
    }

    return { ok: true as const, companyId, ownerId: owner.userId, ownerEmail: email };
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

    const cashier = await ensureAuthUser(supabaseAdmin, {
      email,
      password: data.password,
      name: data.name,
      companyId: data.companyId,
      role: "cashier",
    });
    if (!cashier.ok) return { ok: false as const, reason: cashier.reason };

    const { error: uErr } = await supabaseAdmin.from("app_users").upsert({
      id: cashier.userId,
      name: data.name,
      email,
      role: "cashier",
      company_id: data.companyId,
      is_temporary_password: false,
    });
    if (uErr) {
      await supabaseAdmin.auth.admin.deleteUser(cashier.userId);
      return { ok: false as const, reason: uErr.message };
    }

    return { ok: true as const, userId: cashier.userId, email };
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
 * Renomeia um usuário (apenas o campo `name` em app_users).
 * Usado pelo botão "Editar" da página de Terminais para trocar
 * o nome do operador sem precisar deletar/recriar o caixa.
 * ============================================================ */
export const adminRenameUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      userId: z.string().uuid(),
      name: z.string().trim().min(2).max(120),
    }).parse(d),
  )
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
      (meRow.role === "admin" && meRow.company_id === target.company_id);
    if (!canManage) return { ok: false as const, reason: "Acesso negado." };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("app_users")
      .update({ name: data.name })
      .eq("id", data.userId);
    if (error) return { ok: false as const, reason: error.message };
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
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const isSA = await isSuperAdminUser(supabaseAdmin, context.userId);
    if (!isSA) return { ok: false as const, reason: "Acesso negado." };

    const { data: users } = await supabaseAdmin
      .from("app_users")
      .select("id")
      .eq("company_id", data.companyId);
    const { error: delErr } = await supabaseAdmin
      .from("companies")
      .delete()
      .eq("id", data.companyId);
    if (delErr) {
      console.error("[adminDeleteCompany] Falha ao excluir companies:", delErr);
      return { ok: false as const, reason: delErr.message };
    }
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