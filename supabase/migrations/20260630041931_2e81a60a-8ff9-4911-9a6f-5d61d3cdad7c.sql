CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
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
       AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION private.current_company_id()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.app_users WHERE id = auth.uid()
$$;

REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT USAGE ON SCHEMA private TO service_role;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA private FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION private.current_company_id() TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA private TO service_role;

DROP POLICY IF EXISTS "Super admin manages all companies" ON public.companies;
DROP POLICY IF EXISTS "Super admins can manage companies" ON public.companies;
DROP POLICY IF EXISTS "Member reads own company" ON public.companies;
DROP POLICY IF EXISTS "Company users can view own company" ON public.companies;
DROP POLICY IF EXISTS "Admin updates own company" ON public.companies;

CREATE POLICY "Super admin manages all companies"
ON public.companies
FOR ALL
TO authenticated
USING (private.has_role(auth.uid(), 'super_admin'))
WITH CHECK (private.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Member reads own company"
ON public.companies
FOR SELECT
TO authenticated
USING (id = private.current_company_id());

CREATE POLICY "Admin updates own company"
ON public.companies
FOR UPDATE
TO authenticated
USING (id = private.current_company_id() AND private.has_role(auth.uid(), 'admin'))
WITH CHECK (id = private.current_company_id() AND private.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Super admin manages all users" ON public.app_users;
DROP POLICY IF EXISTS "Super admins can manage app users" ON public.app_users;
DROP POLICY IF EXISTS "Self reads own user row" ON public.app_users;
DROP POLICY IF EXISTS "Users can view own app user" ON public.app_users;
DROP POLICY IF EXISTS "Same company reads users" ON public.app_users;
DROP POLICY IF EXISTS "Self updates own user row" ON public.app_users;

CREATE POLICY "Super admin manages all users"
ON public.app_users
FOR ALL
TO authenticated
USING (private.has_role(auth.uid(), 'super_admin'))
WITH CHECK (private.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Self reads own user row"
ON public.app_users
FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Same company reads users"
ON public.app_users
FOR SELECT
TO authenticated
USING (company_id = private.current_company_id());

CREATE POLICY "Self updates own user row"
ON public.app_users
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Company users can view customers" ON public.customers;
DROP POLICY IF EXISTS "Company admins can create customers" ON public.customers;
DROP POLICY IF EXISTS "Company admins can update customers" ON public.customers;
DROP POLICY IF EXISTS "Company admins can delete customers" ON public.customers;
DROP POLICY IF EXISTS "Member reads own company customers" ON public.customers;
DROP POLICY IF EXISTS "Admin inserts own company customers" ON public.customers;
DROP POLICY IF EXISTS "Admin updates own company customers" ON public.customers;
DROP POLICY IF EXISTS "Admin deletes own company customers" ON public.customers;

CREATE POLICY "Member reads own company customers"
ON public.customers
FOR SELECT
TO authenticated
USING (company_id = private.current_company_id() OR private.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admin inserts own company customers"
ON public.customers
FOR INSERT
TO authenticated
WITH CHECK ((company_id = private.current_company_id() AND private.has_role(auth.uid(), 'admin')) OR private.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admin updates own company customers"
ON public.customers
FOR UPDATE
TO authenticated
USING ((company_id = private.current_company_id() AND private.has_role(auth.uid(), 'admin')) OR private.has_role(auth.uid(), 'super_admin'))
WITH CHECK ((company_id = private.current_company_id() AND private.has_role(auth.uid(), 'admin')) OR private.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admin deletes own company customers"
ON public.customers
FOR DELETE
TO authenticated
USING ((company_id = private.current_company_id() AND private.has_role(auth.uid(), 'admin')) OR private.has_role(auth.uid(), 'super_admin'));

DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);
DROP FUNCTION IF EXISTS public.current_company_id();