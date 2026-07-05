
-- 1) app_users: restrict self-update so users cannot escalate role or move company
DROP POLICY IF EXISTS "Self updates own user row" ON public.app_users;

CREATE POLICY "Self updates own user row"
ON public.app_users
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (
  id = auth.uid()
  AND role = (SELECT au.role FROM public.app_users au WHERE au.id = auth.uid())
  AND company_id IS NOT DISTINCT FROM (SELECT au.company_id FROM public.app_users au WHERE au.id = auth.uid())
);

-- 2) profiles: remove the broad "any authenticated user can read all profiles" policy.
-- Own-profile reads remain via "Users can view their own profile" and "Users can manage own profile".
DROP POLICY IF EXISTS "Profiles are visible to authenticated users" ON public.profiles;
