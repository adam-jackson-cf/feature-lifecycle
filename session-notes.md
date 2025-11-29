# Recent Development Activity

  Active Themes (last 30 days):
  - Time-in-status and churn metrics implementation
  - Interactive timeline visualization
  - Data quality view with sticky filters
  - PR import and counting in metrics
  - Sprint-aware velocity flow
  - Export control and chart empty states
  - Dashboard theming (mint theme)
  - Migration to Bun, Next.js 16, and Ultracite

  Recent Commits:
  - 6f3eb70 Fix Next.js routing conflict by renaming case-studies [id] to [caseStudyId]
  - 32de052 Add time-in-status and churn metrics
  - 0119631 Stabilize tests by stubbing changelog fetch and add size total
  - 9882424 Add interactive timeline visualization
  - 85b3ca9 Add data quality view and sticky filters
  - 67e2ddb Import PRs and count them in metrics

## Session Notes (latest changes summary)

Date: 2025-11-22

## What we did
- Implemented deterministic RCS complexity model (B/T/S/A/U) with oversize flag, clamping, and thresholds. Updated config (`dashboard/config/complexity.config.json`) and complexity service to use Jira labels/components and raw ticket data.
- Wired Jira import to compute and persist complexity, discipline, and AI flag on tickets and lifecycle events. Added discipline/AI detection via rules config and labels.
- Added metrics & exports API routes (`app/api/metrics/[caseStudyId]/...`) for timeline, summary (with flow/complexity breakdown), cycle/lead time, velocity, and CSV export.
- Added Jira import API routes for project/sprint/ticket; GitHub import already existed.
- Frontend: Dashboard now renders metrics cards, charts, effort/complexity view, and timeline using hooks to the new APIs.
- Added rules/config files: `config/complexity.config.json`, `config/discipline-rules.json`; rules editor page exists.
- Tests: new unit tests for complexity, discipline, metrics summary, Jira import complexity/AI; live integration test exercises Apache Kafka Jira/GitHub data.
- Quality gates fixed: lint (ultracite), typecheck, unit tests now pass via `make`. Integration suite hits Apache Kafka Jira/GitHub via `bun run test:integration` when network allowed.

## Key files touched
- Services: `dashboard/lib/services/complexity.service.ts`, `jira-import.service.ts`, `discipline.service.ts`, `metrics.service.ts`
- API: `dashboard/app/api/import/jira/*`, `dashboard/app/api/metrics/[caseStudyId]/*`
- Repos/Types: `dashboard/lib/repositories/jira-ticket.repository.ts`, `lifecycle-event.repository.ts`, `dashboard/lib/types/index.ts`
- Frontend: `dashboard/components/dashboard/*`, `app/case-studies/[id]/*`, `app/page.tsx`
- Config: `dashboard/config/complexity.config.json`, `dashboard/config/discipline-rules.json`
- Tests: `tests/unit/complexity.service.test.ts`, `discipline.service.test.ts`, `metrics.service.test.ts`, `jira-import.service.test.ts`; integration `tests/integration/real-apache-kafka.integration.test.ts`

## How to run
- Quality gates: `cd dashboard && make` (lint, typecheck, unit, fast integration stub).
- Live integration: `cd dashboard && bun run test:integration` (hits Kafka Jira/GitHub).

## Open follow-ups
- Wire UI filters (discipline/complexity/AI) fully to timeline/charts; fetch real Jira/GitHub data with pagination/changelog/PR files.
- Extend exports to Parquet; add PR churn/time-in-status from changelog.

---

## Session: 2025-11-29

### Discussion Overview
Comprehensive frontend design audit and seed data generation session. Used browser tools to visually test the dashboard, identified and fixed critical visual issues in the Lifecycle Timeline, and created realistic seed data to populate all charts meaningfully.

### Actions Taken
- Audited all dashboard pages using browser-tools for visual testing
- Fixed critical Timeline visual issues (event overlap, text collision, cramped height)
- Fixed missing pie chart on Aggregate/Overview page (ResponsiveContainer dimensions)
- Fixed React duplicate key warning in CycleTimeChart
- Created comprehensive seed data script with 48 tickets across 4 sprints
- Generated ~500 lifecycle events (Jira + GitHub) for realistic chart population
- Verified all charts populate correctly with new seed data

### Files Referenced
- `dashboard/components/dashboard/TimelineView.tsx` - Timeline visual fixes
- `dashboard/components/dashboard/AggregatePhaseView.tsx` - Pie chart fix
- `dashboard/components/dashboard/CycleTimeChart.tsx` - Duplicate key fix
- `dashboard/scripts/seed-data.ts` - Complete rewrite with comprehensive data generation
- `dashboard/lib/db/schema.sql` - Schema reference for seed script

### Outstanding Tasks
- Pull Requests count shows "-" (no PR data in seed script - could add github_pull_requests table inserts)
- Pre-existing lint warnings (unused imports, fragment issues) not addressed
- Could add XS complexity tickets to seed data for fuller distribution

### Key Decisions
- Used vis-timeline configuration options (`stackSubgroups`, `groupHeightMode: 'auto'`, `verticalScroll`) instead of custom CSS for Timeline fixes
- Changed Timeline height from fixed 360px to responsive min-h-500px with max 600px
- Seed data covers 8-week sprint cycle with realistic E-Commerce project scenario
- Events generated for development disciplines only (backend, frontend, mobile, devops) - QA/data/unknown don't generate GitHub events

### Suggested Next Steps
1. Add github_pull_requests seed data for PR count metric
2. Add XS complexity tickets for complete complexity distribution
3. Address pre-existing lint warnings (unused imports)
4. Consider adding more case studies with different project types

### Context for Next Session
- New case study "E-Commerce Platform Rebuild" available at `/case-studies/8e902c43-d35b-4824-9e76-55cbe29bf2e2`
- All charts now populate with meaningful data
- Timeline shows proper event stacking and no text collisions
- Seed script can be re-run with `ENABLE_SEED_DATA=true npx tsx scripts/seed-data.ts`

### Commits This Session
```
748d645 Add comprehensive seed data for realistic chart population
40f5336 Fix duplicate React key warning in CycleTimeChart
c255425 Fix ResponsiveContainer dimensions for pie chart in aggregate view
14e7029 Fix critical visual issues in Lifecycle Timeline component
```
