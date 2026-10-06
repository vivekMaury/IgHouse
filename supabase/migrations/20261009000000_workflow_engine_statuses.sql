ALTER TABLE automation_logs
    DROP CONSTRAINT IF EXISTS automation_logs_status_check;

UPDATE automation_logs
SET status = CASE status
    WHEN 'success' THEN 'EXECUTED'
    WHEN 'failed' THEN 'FAILED'
    WHEN 'processing' THEN 'MATCHED'
    WHEN 'filtered' THEN 'MATCHED'
    ELSE status
END;

ALTER TABLE automation_logs
    ADD CONSTRAINT automation_logs_status_check
    CHECK (status IN ('MATCHED', 'EXECUTED', 'FAILED'));

ALTER TABLE webhook_logs
    DROP CONSTRAINT IF EXISTS webhook_logs_queue_status_check;

ALTER TABLE webhook_logs
    ADD CONSTRAINT webhook_logs_queue_status_check
    CHECK (queue_status IN ('processed', 'queued', 'failed'));
