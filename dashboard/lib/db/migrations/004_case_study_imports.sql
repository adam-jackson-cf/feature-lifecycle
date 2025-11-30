-- Migration: Add case_study_imports table to support multiple imports per case study
-- This allows a case study to have multiple import runs, each with its own type and metadata

CREATE TABLE IF NOT EXISTS case_study_imports (
  id TEXT PRIMARY KEY,
  case_study_id TEXT NOT NULL,
  import_type TEXT NOT NULL CHECK(import_type IN ('project', 'sprint', 'ticket', 'feature')),
  jira_project_key TEXT NOT NULL,
  jira_project_id TEXT,
  jira_sprint_id TEXT,
  jira_ticket_key TEXT,
  jira_label TEXT,
  status TEXT NOT NULL CHECK(status IN ('importing', 'completed', 'error')) DEFAULT 'importing',
  ticket_count INTEGER DEFAULT 0,
  event_count INTEGER DEFAULT 0,
  start_date DATETIME,
  end_date DATETIME,
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (case_study_id) REFERENCES case_studies(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_case_study_imports_case_study ON case_study_imports(case_study_id);
CREATE INDEX IF NOT EXISTS idx_case_study_imports_type ON case_study_imports(import_type);
CREATE INDEX IF NOT EXISTS idx_case_study_imports_status ON case_study_imports(status);

