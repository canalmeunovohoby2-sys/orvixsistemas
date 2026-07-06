
ALTER TABLE public.trial_accounts
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS whatsapp  text;

-- Índice para lookup por whatsapp (útil no painel).
CREATE INDEX IF NOT EXISTS trial_accounts_whatsapp_idx ON public.trial_accounts (whatsapp);
