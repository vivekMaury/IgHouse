ALTER TABLE public.ig_accounts
    ADD COLUMN IF NOT EXISTS is_webhook_subscribed BOOLEAN NOT NULL DEFAULT false;
