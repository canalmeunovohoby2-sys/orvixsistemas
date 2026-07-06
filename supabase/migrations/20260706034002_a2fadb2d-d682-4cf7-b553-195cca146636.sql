-- Recria como SECURITY INVOKER (não precisa elevação — só retorna now())
CREATE OR REPLACE FUNCTION public.trial_server_now()
RETURNS TABLE(now TIMESTAMPTZ)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT now();
$$;

-- Remove qualquer permissão anterior e concede só ao servidor.
REVOKE ALL ON FUNCTION public.trial_server_now() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.trial_server_now() TO service_role;