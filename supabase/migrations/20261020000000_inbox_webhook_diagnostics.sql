ALTER TABLE public.webhook_logs
    DROP CONSTRAINT IF EXISTS webhook_logs_queue_status_check;

ALTER TABLE public.webhook_logs
    ADD CONSTRAINT webhook_logs_queue_status_check
    CHECK (queue_status IN ('processed', 'queued', 'failed'));
