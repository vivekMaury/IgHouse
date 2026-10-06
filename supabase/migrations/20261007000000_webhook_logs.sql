CREATE TABLE IF NOT EXISTS webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    object_type TEXT,
    event_types TEXT[] NOT NULL DEFAULT '{}',
    queue_status TEXT NOT NULL CHECK (queue_status IN ('queued', 'failed')),
    error_message TEXT,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS webhook_logs_received_at_idx
    ON webhook_logs (received_at DESC);

ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;
