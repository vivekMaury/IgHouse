ALTER TABLE workflows
    DROP CONSTRAINT IF EXISTS workflows_status_check;

ALTER TABLE workflows
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT false;

UPDATE workflows
SET is_active = true,
    status = 'published'
WHERE status = 'active';

ALTER TABLE workflows
    ADD CONSTRAINT workflows_status_check
    CHECK (status IN ('draft', 'published'));
