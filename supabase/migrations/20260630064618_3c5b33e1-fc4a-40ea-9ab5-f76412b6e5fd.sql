
CREATE TABLE IF NOT EXISTS public.sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id text NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  local_id text,
  user_email text,
  total_amount numeric(14,2) NOT NULL CHECK (total_amount >= 0),
  cost_amount numeric(14,2) NOT NULL DEFAULT 0 CHECK (cost_amount >= 0),
  items_count integer NOT NULL DEFAULT 0,
  payment_method text,
  installments integer,
  customer_name text,
  customer_id text,
  crediario boolean NOT NULL DEFAULT false,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sales_company_id_idx   ON public.sales (company_id);
CREATE INDEX IF NOT EXISTS sales_occurred_at_idx  ON public.sales (occurred_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS sales_company_local_uidx
  ON public.sales (company_id, local_id) WHERE local_id IS NOT NULL;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales TO authenticated;
GRANT ALL ON public.sales TO service_role;

ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members read own sales"
  ON public.sales FOR SELECT TO authenticated
  USING (company_id = private.current_company_id());

CREATE POLICY "Super admin reads all sales"
  ON public.sales FOR SELECT TO authenticated
  USING (private.is_super_admin(auth.uid()));

CREATE POLICY "Company members insert own sales"
  ON public.sales FOR INSERT TO authenticated
  WITH CHECK (company_id = private.current_company_id());

CREATE POLICY "Super admin updates sales"
  ON public.sales FOR UPDATE TO authenticated
  USING (private.is_super_admin(auth.uid()))
  WITH CHECK (private.is_super_admin(auth.uid()));

CREATE POLICY "Super admin deletes sales"
  ON public.sales FOR DELETE TO authenticated
  USING (private.is_super_admin(auth.uid()));

CREATE TRIGGER sales_set_updated_at
  BEFORE UPDATE ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
