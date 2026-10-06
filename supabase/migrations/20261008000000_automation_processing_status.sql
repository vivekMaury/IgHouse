ALTER TABLE automation_logs
    DROP CONSTRAINT IF EXISTS automation_logs_status_check;

ALTER TABLE automation_logs
    ADD CONSTRAINT automation_logs_status_check
    CHECK (status IN ('processing', 'success', 'failed', 'filtered'));
