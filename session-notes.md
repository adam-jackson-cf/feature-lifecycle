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
