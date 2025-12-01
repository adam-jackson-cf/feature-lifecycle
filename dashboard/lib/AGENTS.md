# Core Business Logic

Backend services, repositories, and shared utilities.

## Backend Patterns and Practices

- Repository Pattern: Each entity (case studies, tickets, events, commits, PRs) has its own repository with typed methods
- Service Layer: Business logic separated from data access; services orchestrate repository calls
- Zod Validation: Runtime type safety for API inputs
- Parameterized Queries: SQLite uses better-sqlite3 with parameterized queries for SQL injection prevention
- UUID Identifiers: All entities use UUID primary keys
- JSON Storage: Complex nested data stored as JSON columns (raw_jira_data, details, ticket_keys)
- Cascade Deletes: Foreign keys configured with ON DELETE CASCADE
- Index Strategy: Strategic indexes on foreign keys and common query patterns

## Key Components

- **JiraImportService**: Fetches tickets and changelogs from Jira API, creates lifecycle events
- **GitHubImportService**: Correlates commits/PRs to tickets via ID extraction from messages
- **MetricsService**: Calculates cycle time, lead time, velocity, time-in-status metrics
- **EffortCalculator**: Computes per-discipline analytics using normalized events
- **CorrelationService**: Links GitHub activity to Jira tickets and builds unified timelines
- **ComplexityService**: Applies RCS scoring model to tickets
- **DisciplineService**: Tags tickets with discipline classification

## Directory Structure

- `db/` - Database schema, connection, migrations
- `repositories/` - Data access layer (one per entity)
- `services/` - Business logic services
- `hooks/` - React Query hooks for frontend
- `types/` - TypeScript interfaces and types
