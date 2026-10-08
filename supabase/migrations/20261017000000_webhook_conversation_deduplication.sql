ALTER TABLE conversations
    ADD COLUMN IF NOT EXISTS external_event_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS conversations_contact_external_event_id_key
    ON conversations (contact_id, external_event_id);
