
-- ============================================================
-- ORVIX SISTEMAS — Fase 1: Auth real + Empresas + Usuários
-- ============================================================

-- ENUMs (idempotentes)
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'cashier');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.subscription_status AS ENUM ('trial', 'active', 'pending', 'blocked', 'canceled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.plan_tier AS ENUM ('bronze', 'prata', 'ouro');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- Tabela: companies (tenants)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.companies (
  id text PRIMARY KEY,
  razao_social text NOT NULL,
  fantasia text NOT NULL,
  cnpj text NOT NULL DEFAULT '',
  status public.subscription_status NOT NULL DEFAULT 'active',
  plan public.plan_tier NOT NULL DEFAULT 'bronze',
  mrr numeric(12,2) NOT NULL DEFAULT 0,
  due_date timestamptz,
  phone text,
  segment text,
  onboarding_pending boolean NOT NULL DEFAULT true,
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO authenticated;
GRANT ALL ON public.companies TO service_role;

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Tabela: app_users (perfil ligado a auth.users + papel + tenant)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.app_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  email text NOT NULL UNIQUE,
  role public.app_role NOT NULL,
  company_id text REFERENCES public.companies(id) ON DELETE CASCADE,
  is_temporary_password boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_users TO authenticated;
GRANT ALL ON public.app_users TO service_role;

ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Helpers SECURITY DEFINER (evitam recursão em policies)
-- ============================================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.app_users WHERE id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.current_company_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.app_users WHERE id = auth.uid()
$$;

-- ============================================================
-- RLS: app_users
-- ============================================================
DROP POLICY IF EXISTS "Super admin manages all users" ON public.app_users;
CREATE POLICY "Super admin manages all users" ON public.app_users
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "Self reads own user row" ON public.app_users;
CREATE POLICY "Self reads own user row" ON public.app_users
FOR SELECT TO authenticated
USING (id = auth.uid());

DROP POLICY IF EXISTS "Same company reads users" ON public.app_users;
CREATE POLICY "Same company reads users" ON public.app_users
FOR SELECT TO authenticated
USING (company_id IS NOT NULL AND company_id = public.current_company_id());

DROP POLICY IF EXISTS "Self updates own user row" ON public.app_users;
CREATE POLICY "Self updates own user row" ON public.app_users
FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- ============================================================
-- RLS: companies
-- ============================================================
DROP POLICY IF EXISTS "Super admin manages all companies" ON public.companies;
CREATE POLICY "Super admin manages all companies" ON public.companies
FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "Member reads own company" ON public.companies;
CREATE POLICY "Member reads own company" ON public.companies
FOR SELECT TO authenticated
USING (id = public.current_company_id());

DROP POLICY IF EXISTS "Admin updates own company" ON public.companies;
CREATE POLICY "Admin updates own company" ON public.companies
FOR UPDATE TO authenticated
USING (id = public.current_company_id() AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (id = public.current_company_id());

-- ============================================================
-- Trigger: updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_companies_updated_at ON public.companies;
CREATE TRIGGER trg_companies_updated_at
BEFORE UPDATE ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_app_users_updated_at ON public.app_users;
CREATE TRIGGER trg_app_users_updated_at
BEFORE UPDATE ON public.app_users
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- Próximo ID de empresa (EMP001, EMP002, ...)
-- ============================================================
CREATE OR REPLACE FUNCTION public.next_company_id()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  max_n integer;
BEGIN
  SELECT COALESCE(MAX(NULLIF(regexp_replace(id, '^EMP', ''), '')::int), 0)
    INTO max_n FROM public.companies WHERE id ~ '^EMP[0-9]+$';
  RETURN 'EMP' || LPAD((max_n + 1)::text, 3, '0');
END;
$$;
