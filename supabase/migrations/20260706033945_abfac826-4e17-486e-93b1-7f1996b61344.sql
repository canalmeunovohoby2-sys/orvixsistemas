CREATE OR REPLACE FUNCTION public.trial_server_now()
RETURNS TABLE(now TIMESTAMPTZ)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT now();
$$;

GRANT EXECUTE ON FUNCTION public.trial_server_now() TO anon, authenticated, service_role;