ALTER TABLE public.app_users ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;
CREATE INDEX IF NOT EXISTS app_users_last_seen_at_idx ON public.app_users (last_seen_at DESC);