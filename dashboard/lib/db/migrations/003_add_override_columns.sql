-- Add override columns for manual corrections (preserving original imported data)

-- Override columns for jira_tickets
ALTER TABLE jira_tickets ADD COLUMN phase_override TEXT;
ALTER TABLE jira_tickets ADD COLUMN discipline_override TEXT;
ALTER TABLE jira_tickets ADD COLUMN complexity_override TEXT CHECK(complexity_override IN ('XS', 'S', 'M', 'L', 'XL'));
ALTER TABLE jira_tickets ADD COLUMN excluded_from_metrics INTEGER DEFAULT 0;
ALTER TABLE jira_tickets ADD COLUMN custom_labels TEXT;
ALTER TABLE jira_tickets ADD COLUMN override_modified_at DATETIME;

-- Override columns for lifecycle_events
ALTER TABLE lifecycle_events ADD COLUMN phase_override TEXT;
ALTER TABLE lifecycle_events ADD COLUMN discipline_override TEXT;
ALTER TABLE lifecycle_events ADD COLUMN excluded_from_metrics INTEGER DEFAULT 0;
ALTER TABLE lifecycle_events ADD COLUMN override_modified_at DATETIME;

-- Override columns for normalized_events
ALTER TABLE normalized_events ADD COLUMN phase_override TEXT;
ALTER TABLE normalized_events ADD COLUMN discipline_override TEXT;
ALTER TABLE normalized_events ADD COLUMN excluded_from_metrics INTEGER DEFAULT 0;
ALTER TABLE normalized_events ADD COLUMN override_modified_at DATETIME;

-- Indexes for filtering by override status
CREATE INDEX IF NOT EXISTS idx_jira_tickets_excluded ON jira_tickets(excluded_from_metrics);
CREATE INDEX IF NOT EXISTS idx_jira_tickets_phase_override ON jira_tickets(phase_override);
CREATE INDEX IF NOT EXISTS idx_lifecycle_events_excluded ON lifecycle_events(excluded_from_metrics);
CREATE INDEX IF NOT EXISTS idx_normalized_events_excluded ON normalized_events(excluded_from_metrics);
