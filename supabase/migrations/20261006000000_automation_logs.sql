ALTER TABLE workflows
    ADD COLUMN IF NOT EXISTS execution_count BIGINT NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS automation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('comment', 'message', 'story_mention')),
    sender_id TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'filtered')),
    response_sent JSONB,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS automation_logs_workflow_created_idx
    ON automation_logs (workflow_id, created_at DESC);
CREATE INDEX IF NOT EXISTS automation_logs_user_created_idx
    ON automation_logs (user_id, created_at DESC);

ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their automation logs" ON automation_logs;
CREATE POLICY "Users can view their automation logs"
    ON automation_logs FOR SELECT
    USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION increment_workflow_execution_count(target_workflow_id UUID)
RETURNS VOID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
    UPDATE workflows
    SET execution_count = execution_count + 1,
        updated_at = NOW()
    WHERE id = target_workflow_id;
$$;

REVOKE ALL ON FUNCTION increment_workflow_execution_count(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION increment_workflow_execution_count(UUID) TO service_role;