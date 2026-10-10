ALTER TABLE public.conversations
    ADD COLUMN IF NOT EXISTS instagram_conversation_id TEXT,
    ADD COLUMN IF NOT EXISTS last_message TEXT;

CREATE OR REPLACE VIEW public.connected_accounts
WITH (security_invoker = true)
AS
SELECT
    id,
    workspace_id,
    instagram_page_id AS page_id,
    instagram_account_id,
    is_webhook_subscribed,
    access_token_encrypted AS access_token,
    is_active,
    created_at
FROM public.ig_accounts;

CREATE OR REPLACE VIEW public.messages
WITH (security_invoker = true)
AS
SELECT
    id,
    contact_id AS conversation_id,
    external_event_id AS instagram_message_id,
    COALESCE(message_text, message_body) AS message_text,
    COALESCE(is_from_user, direction = 'inbound') AS is_from_user,
    created_at
FROM public.conversations;

COMMENT ON VIEW public.connected_accounts IS
    'Compatibility projection over ig_accounts; access_token contains the encrypted Page token.';
COMMENT ON VIEW public.messages IS
    'Compatibility projection over the legacy per-message conversations table.';
