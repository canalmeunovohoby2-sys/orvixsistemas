
CREATE OR REPLACE FUNCTION public.is_super_admin(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(SELECT 1 FROM public.app_users WHERE id = _uid AND role = 'super_admin');
$$;

CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id text NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  requester_name text NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  priority text NOT NULL DEFAULT 'media' CHECK (priority IN ('baixa','media','alta')),
  status text NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto','em_andamento','resolvido')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_tickets TO authenticated;
GRANT ALL ON public.support_tickets TO service_role;

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view own tickets"
  ON public.support_tickets FOR SELECT TO authenticated
  USING (
    public.is_super_admin(auth.uid())
    OR company_id IN (SELECT company_id FROM public.app_users WHERE id = auth.uid())
  );

CREATE POLICY "Company members can insert own tickets"
  ON public.support_tickets FOR INSERT TO authenticated
  WITH CHECK (
    company_id IN (SELECT company_id FROM public.app_users WHERE id = auth.uid())
  );

CREATE POLICY "Super admin manages all tickets"
  ON public.support_tickets FOR UPDATE TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admin deletes tickets"
  ON public.support_tickets FOR DELETE TO authenticated
  USING (public.is_super_admin(auth.uid()));

CREATE INDEX support_tickets_company_idx ON public.support_tickets(company_id);
CREATE INDEX support_tickets_created_idx ON public.support_tickets(created_at DESC);

CREATE TRIGGER support_tickets_set_updated
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
