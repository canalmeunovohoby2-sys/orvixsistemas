
CREATE TABLE public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id text NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  doc text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  credit_limit numeric NOT NULL DEFAULT 0,
  current_debt numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX customers_company_id_idx ON public.customers(company_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Member reads own company customers"
  ON public.customers FOR SELECT
  USING (company_id = public.current_company_id() OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admin inserts own company customers"
  ON public.customers FOR INSERT
  WITH CHECK (
    (company_id = public.current_company_id() AND public.has_role(auth.uid(), 'admin'))
    OR public.has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Admin updates own company customers"
  ON public.customers FOR UPDATE
  USING (
    (company_id = public.current_company_id() AND public.has_role(auth.uid(), 'admin'))
    OR public.has_role(auth.uid(), 'super_admin')
  )
  WITH CHECK (
    (company_id = public.current_company_id() AND public.has_role(auth.uid(), 'admin'))
    OR public.has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Admin deletes own company customers"
  ON public.customers FOR DELETE
  USING (
    (company_id = public.current_company_id() AND public.has_role(auth.uid(), 'admin'))
    OR public.has_role(auth.uid(), 'super_admin')
  );

CREATE TRIGGER customers_set_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
