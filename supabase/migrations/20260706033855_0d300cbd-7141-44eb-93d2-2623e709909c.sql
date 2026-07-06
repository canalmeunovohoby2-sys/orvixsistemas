-- Tabela isolada para trials, sem FK para auth.users nem para app_users.
CREATE TABLE public.trial_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  is_trial BOOLEAN NOT NULL DEFAULT true,
  trial_start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Normaliza e-mail em minúsculas para evitar duplicatas.
CREATE OR REPLACE FUNCTION public.trial_accounts_normalize_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.email = lower(trim(NEW.email));
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trial_accounts_before_write
BEFORE INSERT OR UPDATE ON public.trial_accounts
FOR EACH ROW EXECUTE FUNCTION public.trial_accounts_normalize_email();

-- Índice para lookup rápido por e-mail.
CREATE INDEX IF NOT EXISTS trial_accounts_email_idx ON public.trial_accounts (email);

-- Acesso: apenas service_role (servidor). Nenhum acesso anon/authenticated direto.
GRANT ALL ON public.trial_accounts TO service_role;

ALTER TABLE public.trial_accounts ENABLE ROW LEVEL SECURITY;

-- Nenhuma política para anon/authenticated: só o service_role bypassa RLS.
-- Toda leitura/gravação acontece através de server functions com service key.