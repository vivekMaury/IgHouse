ALTER TABLE ig_accounts
    ADD COLUMN IF NOT EXISTS name TEXT,
    ADD COLUMN IF NOT EXISTS instagram_account_id TEXT;

UPDATE ig_accounts
SET name = COALESCE(NULLIF(BTRIM(username), ''), instagram_page_id)
WHERE name IS NULL;
