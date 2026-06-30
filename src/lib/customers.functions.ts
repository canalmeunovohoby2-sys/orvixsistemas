import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const CustomerInput = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório"),
  doc: z.string().trim().default(""),
  email: z.string().trim().default(""),
  phone: z.string().trim().default(""),
  city: z.string().trim().default(""),
  creditLimit: z.number().nonnegative().default(0),
});

export const createCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => CustomerInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: me, error: meErr } = await supabase
      .from("app_users")
      .select("company_id, role")
      .eq("id", userId)
      .maybeSingle();
    if (meErr) throw new Error(meErr.message);
    if (!me?.company_id) throw new Error("Usuário sem empresa vinculada.");
    if (me.role !== "admin" && me.role !== "super_admin") {
      throw new Error("Apenas administradores podem cadastrar clientes.");
    }

    const { data: row, error } = await supabase
      .from("customers")
      .insert({
        company_id: me.company_id,
        name: data.name,
        doc: data.doc,
        email: data.email,
        phone: data.phone,
        city: data.city,
        credit_limit: data.creditLimit,
      })
      .select("id, company_id, name, doc, email, phone, city, credit_limit, current_debt")
      .single();
    if (error || !row) throw new Error(error?.message ?? "Falha ao inserir cliente.");

    return {
      id: row.id,
      company_id: row.company_id,
      name: row.name,
      doc: row.doc,
      email: row.email,
      phone: row.phone,
      city: row.city,
      creditLimit: Number(row.credit_limit ?? 0),
      currentDebt: Number(row.current_debt ?? 0),
    };
  });