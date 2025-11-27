-- Add normalized_events table to store canonical lifecycle records

CREATE TABLE IF NOT EXISTS normalized_events (
  id TEXT PRIMARY KEY,
  case_study_id TEXT NOT NULL,
  ticket_key TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_source TEXT NOT NULL CHECK(event_source IN ('jira', 'github')),
  occurred_at DATETIME NOT NULL,
  actor_name TEXT NOT NULL,
  actor_id TEXT,
  discipline TEXT,
  complexity_size TEXT CHECK(complexity_size IN ('XS', 'S', 'M', 'L', 'XL')),
  details TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (case_study_id) REFERENCES case_studies(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_normalized_events_case_study ON normalized_events(case_study_id);
CREATE INDEX IF NOT EXISTS idx_normalized_events_ticket ON normalized_events(ticket_key);
CREATE INDEX IF NOT EXISTS idx_normalized_events_date ON normalized_events(occurred_at);
CREATE INDEX IF NOT EXISTS idx_normalized_events_type ON normalized_events(event_type);
CREATE INDEX IF NOT EXISTS idx_normalized_events_discipline ON normalized_events(discipline);

-- Backfill from lifecycle_events if present
INSERT OR IGNORE INTO normalized_events (
  id, case_study_id, ticket_key, event_type, event_source, occurred_at,
  actor_name, actor_id, discipline, complexity_size, details, created_at
)
SELECT
  id,
  case_study_id,
  ticket_key,
  event_type,
  event_source,
  event_date AS occurred_at,
  actor_name,
  actor_id,
  discipline,
  complexity_size,
  details,
  created_at
FROM lifecycle_events;
