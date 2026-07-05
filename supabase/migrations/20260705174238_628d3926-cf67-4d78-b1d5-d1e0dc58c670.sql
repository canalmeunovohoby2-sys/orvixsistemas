CREATE TABLE public.global_products (
  ean text PRIMARY KEY,
  name text NOT NULL,
  brand text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'Geral',
  unit text NOT NULL DEFAULT 'un',
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.global_products TO anon, authenticated;
GRANT INSERT, UPDATE ON public.global_products TO authenticated;
GRANT ALL ON public.global_products TO service_role;

ALTER TABLE public.global_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Global products are readable by anyone"
  ON public.global_products FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can contribute products"
  ON public.global_products FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL AND char_length(ean) BETWEEN 8 AND 14);

CREATE POLICY "Authenticated users can enrich products"
  ON public.global_products FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE TRIGGER global_products_set_updated_at
BEFORE UPDATE ON public.global_products
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();