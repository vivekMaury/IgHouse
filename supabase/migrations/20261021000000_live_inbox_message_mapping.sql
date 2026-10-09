ALTER TABLE public.contacts
    ADD COLUMN IF NOT EXISTS sender_id TEXT,
    ADD COLUMN IF NOT EXISTS sender_name TEXT,
    ADD COLUMN IF NOT EXISTS sender_username TEXT,
    ADD COLUMN IF NOT EXISTS sender_avatar_url TEXT;

ALTER TABLE public.conversations
    ADD COLUMN IF NOT EXISTS message_text TEXT,
    ADD COLUMN IF NOT EXISTS sender_id TEXT,
    ADD COLUMN IF NOT EXISTS sender_name TEXT,
    ADD COLUMN IF NOT EXISTS sender_username TEXT,
    ADD COLUMN IF NOT EXISTS sender_avatar_url TEXT,
    ADD COLUMN IF NOT EXISTS is_from_user BOOLEAN;

UPDATE public.conversations
SET message_text = message_body
WHERE message_text IS NULL;

UPDATE public.conversations
SET is_from_user = (direction = 'inbound')
WHERE is_from_user IS NULL;
