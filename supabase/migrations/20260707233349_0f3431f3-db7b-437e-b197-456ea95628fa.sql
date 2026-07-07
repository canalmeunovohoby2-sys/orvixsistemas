-- Adiciona flag `is_mock` para diferenciar clientes fictícios (gerados por scripts / ambiente de demonstração) dos reais.
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS is_mock boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_companies_is_mock ON public.companies(is_mock);
