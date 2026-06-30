CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typnamespace = 'public'::regnamespace AND typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'cashier');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typnamespace = 'public'::regnamespace AND typname = 'plan_tier') THEN
    CREATE TYPE public.plan_tier AS ENUM ('bronze', 'prata', 'ouro');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typnamespace = 'public'::regnamespace AND typname = 'subscription_status') THEN
    CREATE TYPE public.subscription_status AS ENUM ('trial', 'active', 'pending', 'blocked', 'canceled');
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY,
  display_name text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS public.companies (
  id text PRIMARY KEY,
  razao_social text NOT NULL DEFAULT '',
  fantasia text NOT NULL DEFAULT '',
  cnpj text NOT NULL DEFAULT '',
  phone text,
  segment text,
  plan public.plan_tier NOT NULL DEFAULT 'bronze',
  status public.subscription_status NOT NULL DEFAULT 'trial',
  due_date date,
  mrr numeric(12,2) NOT NULL DEFAULT 0,
  onboarding_pending boolean NOT NULL DEFAULT true,
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO authenticated;
GRANT ALL ON public.companies TO service_role;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS razao_social text NOT NULL DEFAULT '';
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS fantasia text NOT NULL DEFAULT '';
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS cnpj text NOT NULL DEFAULT '';
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS segment text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS plan public.plan_tier NOT NULL DEFAULT 'bronze';
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS status public.subscription_status NOT NULL DEFAULT 'trial';
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS due_date date;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS mrr numeric(12,2) NOT NULL DEFAULT 0;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS onboarding_pending boolean NOT NULL DEFAULT true;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS is_demo boolean NOT NULL DEFAULT false;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS public.app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id text REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  role public.app_role NOT NULL DEFAULT 'cashier',
  is_temporary_password boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_users TO authenticated;
GRANT ALL ON public.app_users TO service_role;
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.app_users ADD COLUMN IF NOT EXISTS company_id text REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.app_users ADD COLUMN IF NOT EXISTS name text NOT NULL DEFAULT '';
ALTER TABLE public.app_users ADD COLUMN IF NOT EXISTS email text NOT NULL DEFAULT '';
ALTER TABLE public.app_users ADD COLUMN IF NOT EXISTS role public.app_role NOT NULL DEFAULT 'cashier';
ALTER TABLE public.app_users ADD COLUMN IF NOT EXISTS is_temporary_password boolean NOT NULL DEFAULT true;
ALTER TABLE public.app_users ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.app_users ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'app_users_email_key' AND conrelid = 'public.app_users'::regclass) THEN
    ALTER TABLE public.app_users ADD CONSTRAINT app_users_email_key UNIQUE (email);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id text NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  doc text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  credit_limit numeric(12,2) NOT NULL DEFAULT 0,
  current_debt numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS company_id text REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS name text NOT NULL DEFAULT '';
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS doc text NOT NULL DEFAULT '';
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS email text NOT NULL DEFAULT '';
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS phone text NOT NULL DEFAULT '';
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS city text NOT NULL DEFAULT '';
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS credit_limit numeric(12,2) NOT NULL DEFAULT 0;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS current_debt numeric(12,2) NOT NULL DEFAULT 0;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS public.habits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  color text NOT NULL DEFAULT '#FDAA3E',
  frequency jsonb NOT NULL DEFAULT '{}'::jsonb,
  position integer NOT NULL DEFAULT 0,
  reminder_time time,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.habits TO authenticated;
GRANT ALL ON public.habits TO service_role;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS user_id uuid NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS name text NOT NULL DEFAULT '';
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT '';
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS color text NOT NULL DEFAULT '#FDAA3E';
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS frequency jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS position integer NOT NULL DEFAULT 0;
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS reminder_time time;
ALTER TABLE public.habits ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS public.habit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id uuid NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  date date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.habit_logs TO authenticated;
GRANT ALL ON public.habit_logs TO service_role;
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.habit_logs ADD COLUMN IF NOT EXISTS habit_id uuid REFERENCES public.habits(id) ON DELETE CASCADE;
ALTER TABLE public.habit_logs ADD COLUMN IF NOT EXISTS user_id uuid NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE public.habit_logs ADD COLUMN IF NOT EXISTS date date NOT NULL DEFAULT current_date;
ALTER TABLE public.habit_logs ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'habit_logs_habit_id_user_id_date_key' AND conrelid = 'public.habit_logs'::regclass) THEN
    ALTER TABLE public.habit_logs ADD CONSTRAINT habit_logs_habit_id_user_id_date_key UNIQUE (habit_id, user_id, date);
  END IF;
END $$;

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
    INTO max_n
    FROM public.companies
   WHERE id ~ '^EMP[0-9]+$';
  RETURN 'EMP' || LPAD((max_n + 1)::text, 3, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', NEW.raw_user_meta_data ->> 'picture')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.app_users
     WHERE id = _user_id
       AND role = 'super_admin'
  );
$$;

CREATE OR REPLACE FUNCTION private.current_company_id(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id
    FROM public.app_users
   WHERE id = _user_id
   LIMIT 1;
$$;

REVOKE ALL ON FUNCTION private.is_super_admin(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.current_company_id(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_super_admin(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.current_company_id(uuid) TO authenticated, service_role;

DROP TRIGGER IF EXISTS set_companies_updated_at ON public.companies;
CREATE TRIGGER set_companies_updated_at
BEFORE UPDATE ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_app_users_updated_at ON public.app_users;
CREATE TRIGGER set_app_users_updated_at
BEFORE UPDATE ON public.app_users
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_customers_updated_at ON public.customers;
CREATE TRIGGER set_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP POLICY IF EXISTS "Super admins can manage companies" ON public.companies;
DROP POLICY IF EXISTS "Company admins can read own company" ON public.companies;
DROP POLICY IF EXISTS "Users can view own company" ON public.companies;
CREATE POLICY "Super admins can manage companies"
  ON public.companies
  FOR ALL
  TO authenticated
  USING (private.is_super_admin(auth.uid()))
  WITH CHECK (private.is_super_admin(auth.uid()));
CREATE POLICY "Users can view own company"
  ON public.companies
  FOR SELECT
  TO authenticated
  USING (id = private.current_company_id(auth.uid()));

DROP POLICY IF EXISTS "Super admins can manage app users" ON public.app_users;
DROP POLICY IF EXISTS "Users can read own profile" ON public.app_users;
DROP POLICY IF EXISTS "Admins can read company users" ON public.app_users;
DROP POLICY IF EXISTS "Company users can read company profiles" ON public.app_users;
CREATE POLICY "Super admins can manage app users"
  ON public.app_users
  FOR ALL
  TO authenticated
  USING (private.is_super_admin(auth.uid()))
  WITH CHECK (private.is_super_admin(auth.uid()));
CREATE POLICY "Users can read own app user"
  ON public.app_users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());
CREATE POLICY "Company users can read company profiles"
  ON public.app_users
  FOR SELECT
  TO authenticated
  USING (company_id = private.current_company_id(auth.uid()));

DROP POLICY IF EXISTS "Super admins can manage customers" ON public.customers;
DROP POLICY IF EXISTS "Company users can manage company customers" ON public.customers;
CREATE POLICY "Super admins can manage customers"
  ON public.customers
  FOR ALL
  TO authenticated
  USING (private.is_super_admin(auth.uid()))
  WITH CHECK (private.is_super_admin(auth.uid()));
CREATE POLICY "Company users can manage company customers"
  ON public.customers
  FOR ALL
  TO authenticated
  USING (company_id = private.current_company_id(auth.uid()))
  WITH CHECK (company_id = private.current_company_id(auth.uid()));

DROP POLICY IF EXISTS "Users can manage own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super admins can manage profiles" ON public.profiles;
CREATE POLICY "Users can manage own profile"
  ON public.profiles
  FOR ALL
  TO authenticated
  USING (id = auth.uid() OR private.is_super_admin(auth.uid()))
  WITH CHECK (id = auth.uid() OR private.is_super_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can manage own habits" ON public.habits;
CREATE POLICY "Users can manage own habits"
  ON public.habits
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can manage own habit logs" ON public.habit_logs;
CREATE POLICY "Users can manage own habit logs"
  ON public.habit_logs
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS app_users_company_id_idx ON public.app_users(company_id);
CREATE INDEX IF NOT EXISTS app_users_email_idx ON public.app_users(lower(email));
CREATE INDEX IF NOT EXISTS customers_company_id_idx ON public.customers(company_id);
CREATE INDEX IF NOT EXISTS habits_user_id_idx ON public.habits(user_id);
CREATE INDEX IF NOT EXISTS habit_logs_user_id_date_idx ON public.habit_logs(user_id, date);
CREATE INDEX IF NOT EXISTS habit_logs_habit_id_idx ON public.habit_logs(habit_id);