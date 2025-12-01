# Jobs To Be Done — Feature Lifecycle Dashboard (updated 2025-11-22)

## Context
- Hypothesis: effort spend across the SDLC is the universal unit to measure AI impact; start with engineering tasks to prove the signal, then expand to other disciplines.
- Aim: establish a **pre-AI baseline** for CreateFuture projects, then compare similar engineering tasks after AI enablement using a consistent complexity rubric.

## Current State (repo reality)
- Data layer exists: SQLite schema + repositories for case studies, Jira tickets, lifecycle events, GitHub commits/PRs (`dashboard/lib/db/*.ts`, `dashboard/lib/repositories/*`).
- Import services are partly built against mock data: `JiraImportService` converts issues/changelogs to tickets + events; `GitHubImportService` creates commit events but is not wired to persistence or PR data yet.
- Tests: 8 unit tests around Jira import/changelog logic (`dashboard/tests/unit/jira-import.service.test.ts`) using fixtures; integration test stub is present but unimplemented.
- UI/API: Next.js app is still the default template (`dashboard/app/page.tsx`); no API routes or frontend surfaces for imports/metrics/timeline.

## JTBD (prioritised)
1) **Ingest real Jira/GitHub data for baseline**
   - Status: API routes scaffolded (`/api/import/jira/*`, `/api/import/github`) and Jira import now tags discipline/AI + computes complexity; still need real Jira/GitHub clients and pagination + changelog fetch.
   - Next: add real Jira/GitHub fetchers with auth, toggle mock vs live input, persist PRs/files and changelogs for time-in-status.

2) **Tag engineering-only scope and discipline**
   - Derive a `discipline` field per ticket (backend/frontend/mobile/devops/data/qa) using Jira labels/components + repo path heuristics; store as a derived column on `jira_tickets`.
   - Add a lightweight ruleset JSON so new heuristics can be adjusted without code deploy; log unmatched tickets for manual labelling.
   - Extend lifecycle events to include `discipline` for aggregation by engineering sub-domain.

3) **Define perceived-complexity rubric (for like-for-like comparisons)**
   - Status: RCS model scaffolded (`complexity.service.ts`, `config/complexity.config.json`) using deterministic B/T/S/A/U metrics with thresholds/oversize; needs refinement of heuristics and integration into API responses/UI.
   - Next: tighten heuristics (technology/system allowlists per repo), add PR/file-signal enrichment, expose size/oversize in metrics endpoints and dashboard filters.

4) **Compute baseline metrics for effort spend**
   - Status: metrics endpoints added (timeline, summary, cycle/lead time, velocity, exports CSV) with complexity/disc/AI fields; flow efficiency and complexity breakdown implemented.
   - Next: add PR churn/commit stats, time-in-status from changelog, and Parquet export; wire charts to filters.

5) **Design post-AI comparison instrumentation**
   - Add flags per ticket/PR for AI assistance (e.g., label, PR description template, or commit trailer `AI-CoAuthored: yes`).
   - Capture IDE/agent usage signals where possible (manual toggle or webhook if available) and log as lifecycle events (`ai_assist_used`).
   - Define pairing rules for comparison: match tickets by discipline + complexity bucket + repo + story point band; compare cycle/lead time deltas and review churn.

6) **Evolve the dashboard surfaces**
   - Build an import wizard UI to create a case study (project/sprint/ticket) and trigger Jira/GitHub pulls.
   - Timeline view: Jira + GitHub events stitched per ticket; filters by discipline, complexity, AI flag.
   - Metrics cards and charts: cycle/lead time, time-in-status stacked bar, throughput, complexity vs cycle-time scatter, AI vs non-AI deltas.
   - Add “effort spend” view: share of tickets/time by discipline and complexity bucket, before vs after AI.

7) **Data quality & operability**
   - Add validation/observability: row counts per import, missing story points/sprint IDs, timezone normalisation, duplicate ticket keys across projects.
   - Backfill & re-run support: idempotent imports keyed by ticket/commit SHA; delta mode for daily refresh.
   - Error handling surfaced in UI + structured logs; simple health endpoint for data freshness.

## Suggested two-sprint path (example)
- Sprint 1: ship ingestion + baseline metrics
  - Wire Jira/GitHub API routes; persist real data; basic metrics API; CSV export; doc `complexity_rubric.md`.
- Sprint 2: add AI comparison + dashboard UI
  - AI flag capture, matching rules, comparison API; timeline + metrics UI; discipline tagging rule editor.

## Open questions for CreateFuture
- What Jira project keys / label conventions identify engineering vs design/PM work today?
- Do we have reliable story points or should we use PR size/commit count as effort proxy?
- Can we standardise an AI-use signal in PR templates or commit trailers across teams?
- Which repositories map to each discipline (frontend/mobile/backend/devops/data) for heuristic tagging?
- Preferred output format for baseline reporting (CSV/BigQuery/Snowflake)?
