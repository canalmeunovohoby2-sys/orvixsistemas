
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS is_trial boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_companies_is_trial ON public.companies(is_trial);

-- Backfill: empresas em status 'trial' que NÃO são dados fictícios passam a
-- ter is_trial=true. Dados fictícios ficam com is_trial=false para não
-- misturar as duas categorias.
UPDATE public.companies
   SET is_trial = true
 WHERE status = 'trial' AND COALESCE(is_mock, false) = false AND is_trial = false;

-- Trigger: ao converter uma empresa para 'active' (pagamento confirmado),
-- limpa automaticamente a flag de teste. Também limpa ao virar 'canceled'.
CREATE OR REPLACE FUNCTION public.companies_clear_trial_on_active()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status IN ('active', 'canceled') AND COALESCE(OLD.is_trial, false) = true THEN
    NEW.is_trial := false;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_companies_clear_trial_on_active ON public.companies;
CREATE TRIGGER trg_companies_clear_trial_on_active
BEFORE UPDATE ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.companies_clear_trial_on_active();
