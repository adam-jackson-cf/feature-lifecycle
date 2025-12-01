# Database

SQLite database schema, connection, and migrations.

## Engine

SQLite with better-sqlite3

## Location

- Default: `data/lifecycle.db` (relative to dashboard root)
- Custom: Set `DATABASE_PATH` environment variable

## Schema

Auto-initialized on startup. Migrations in `migrations/`.

## Key Tables

- `case_studies` - Import metadata and status
- `case_study_imports` - Multiple imports per case study
- `jira_tickets` - Processed ticket data with complexity/discipline
- `lifecycle_events` - Unified Jira/GitHub timeline events
- `normalized_events` - Canonical events for discipline analytics
- `github_commits` - Commit data linked to tickets
- `github_pull_requests` - PR data linked to tickets

## Migrations

Migrations run automatically on database initialization. Files are numbered sequentially (001, 002, etc.) and executed in order.

Latest migration (004) adds support for multiple imports per case study via the `case_study_imports` table.

To reset: delete `data/lifecycle.db` and restart the application.
