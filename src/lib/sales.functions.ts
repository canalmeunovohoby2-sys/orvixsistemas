import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SaleItem = z.object({
  id: z.string(),
  name: z.string(),
  qty: z.number(),
  price: z.number().optional(),
  unit: z.string().optional(),
});

const SaleInput = z.object({
  company_id: z.string().min(1),
  local_id: z.string().optional(),
  total_amount: z.number().nonnegative(),
  cost_amount: z.number().nonnegative().default(0),
  items_count: z.number().int().nonnegative().default(0),
  payment_method: z.string().optional(),
  installments: z.number().int().optional(),
  customer_name: z.string().optional(),
  customer_id: z.string().optional(),
  crediario: z.boolean().default(false),
  items: z.array(SaleItem).default([]),
  occurred_at: z.string().optional(),
});

/** Insere uma venda do PDV no banco. RLS garante company_id = empresa do usuário. */
export const insertSale = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => SaleInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, claims } = context;
    const email = (claims as any)?.email ?? null;
    const { data: row, error } = await supabase
      .from("sales")
      .insert({
        company_id: data.company_id,
        local_id: data.local_id ?? null,
        user_email: email,
        total_amount: data.total_amount,
        cost_amount: data.cost_amount,
        items_count: data.items_count,
        payment_method: data.payment_method ?? null,
        installments: data.installments ?? null,
        customer_name: data.customer_name ?? null,
        customer_id: data.customer_id ?? null,
        crediario: data.crediario,
        items: data.items,
        occurred_at: data.occurred_at ?? new Date().toISOString(),
      })
      .select("id")
      .single();
    if (error) {
      // Idempotência: se já existe (local_id duplicado), tratar como sucesso.
      if ((error as any).code === "23505") return { ok: true, duplicate: true };
      throw new Error(error.message);
    }
    return { ok: true, id: row.id };
  });

/** Agregação consolidada para o Painel Master (somente Super Admin via RLS). */
export const getConsolidatedSalesMetrics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: isSuper, error: roleErr } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "super_admin",
    });
    if (roleErr) throw new Error(roleErr.message);
    if (!isSuper) throw new Error("Forbidden");

    const { data, error } = await supabase
      .from("sales")
      .select("company_id,total_amount,cost_amount");
    if (error) throw new Error(error.message);

    let gmv = 0;
    let profit = 0;
    const companies = new Set<string>();
    for (const r of data ?? []) {
      const t = Number(r.total_amount) || 0;
      const c = Number(r.cost_amount) || 0;
      gmv += t;
      profit += t - c;
      if (r.company_id) companies.add(r.company_id);
    }
    return {
      gmv: +gmv.toFixed(2),
      profit: +profit.toFixed(2),
      salesCount: data?.length ?? 0,
      companiesWithSales: companies.size,
    };
  });