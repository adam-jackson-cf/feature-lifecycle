# Project: Feature Lifecycle Dashboard

A comprehensive dashboard application that tracks the complete development lifecycle of features from Jira ticket creation through GitHub PR merge and release deployment. Provides metrics visualization, timeline tracking, and discipline/effort analytics for software development teams.

## Features

- Jira Integration: Import projects, sprints, or individual tickets with full changelog history
- GitHub Correlation: Automatically link commits and PRs to Jira tickets via ticket ID extraction
- Timeline Visualization: Interactive vis-timeline showing complete feature lifecycle events
- Metrics Dashboard: Cycle time, lead time, sprint velocity, time-in-status, and churn metrics
- Discipline/Effort Analytics: Per-discipline lead/cycle medians, active vs queue hours, efficiency %, oversize rate, reopen counts
- Complexity Scoring: RCS (Relative Complexity Score) model with configurable rules
- Data Export: CSV export capability for metrics data
- Data Quality Reporting: Health checks and quality assessment endpoints

## Tech Stack

- Languages: TypeScript 5.7+ (strict mode)
- Runtime: Bun
- Framework: Next.js 16 (App Router) with React 19
- Database: SQLite with better-sqlite3
- UI Components: shadcn/ui, Tailwind CSS, Recharts, vis-timeline
- State Management: TanStack Query + React Context
- Testing: Vitest + happy-dom + msw (Mock Service Worker)
- Linting/Formatting: Ultracite (Biome-based)
- Package Manager: Bun

## Structure

```
feature-lifecycle/
├── README.md                      # End-user documentation
├── CLAUDE.md                      # AI assistant instructions
├── AGENTS.md                      # Project overview (this file)
├── docs/                          # Technical documentation
│   ├── ARCHITECTURE.md            # System design documentation
│   ├── research.md                # Library research notes
│   └── complexity_rubric.md       # RCS complexity scoring guide
├── .audit/                        # Product/UX analysis artifacts
└── dashboard/                     # Next.js application
    ├── AGENTS.md                  # Build, frontend patterns, config
    ├── app/
    │   └── api/
    │       └── AGENTS.md          # API endpoints documentation
    ├── lib/
    │   ├── AGENTS.md              # Backend patterns, services
    │   └── db/
    │       └── AGENTS.md          # Database schema, tables
    └── tests/
        └── AGENTS.md              # Testing guide
```

## Data Flow

1. User imports Jira data (project/sprint/ticket)
2. System fetches tickets and changelog from Jira API
3. GitHub import correlates commits/PRs by scanning for ticket IDs
4. Normalized events table provides unified timeline
5. Metrics calculated on-demand via API endpoints
6. Frontend renders charts and visualizations via TanStack Query
