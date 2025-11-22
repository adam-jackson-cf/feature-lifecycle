-- Migration: Add complexity, discipline, and AI flag columns
-- Version: 001
-- Date: 2025-11-22

-- Add columns to jira_tickets table
ALTER TABLE jira_tickets ADD COLUMN complexity_score INTEGER;
ALTER TABLE jira_tickets ADD COLUMN complexity_size TEXT CHECK(complexity_size IN ('XS', 'S', 'M', 'L', 'XL'));
ALTER TABLE jira_tickets ADD COLUMN complexity_factors TEXT; -- JSON object
ALTER TABLE jira_tickets ADD COLUMN discipline TEXT;
ALTER TABLE jira_tickets ADD COLUMN ai_flag INTEGER DEFAULT 0;

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_jira_tickets_complexity_size ON jira_tickets(complexity_size);
CREATE INDEX IF NOT EXISTS idx_jira_tickets_discipline ON jira_tickets(discipline);
CREATE INDEX IF NOT EXISTS idx_jira_tickets_ai_flag ON jira_tickets(ai_flag);

-- Add columns to lifecycle_events table
ALTER TABLE lifecycle_events ADD COLUMN discipline TEXT;
ALTER TABLE lifecycle_events ADD COLUMN complexity_size TEXT CHECK(complexity_size IN ('XS', 'S', 'M', 'L', 'XL'));

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_lifecycle_events_discipline ON lifecycle_events(discipline);
CREATE INDEX IF NOT EXISTS idx_lifecycle_events_complexity_size ON lifecycle_events(complexity_size);

