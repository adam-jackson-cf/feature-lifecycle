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
├── dashboard/                 # Next.js application
│   ├── app/                   # App Router pages and API routes
│   │   ├── api/               # REST API endpoints
│   │   │   ├── case-studies/  # CRUD operations
│   │   │   ├── import/        # Jira/GitHub import
│   │   │   ├── metrics/       # Analytics endpoints
│   │   │   ├── rules/         # Configuration endpoints
│   │   │   └── health/        # Health/data quality
│   │   ├── case-studies/      # Dashboard views
│   │   ├── import/            # Import wizard
│   │   └── rules/             # Rules configuration
│   ├── components/            # React components
│   │   ├── dashboard/         # Chart/metric components
│   │   ├── ui/                # shadcn/ui primitives
│   │   └── layout/            # Layout components
│   ├── lib/                   # Core business logic
│   │   ├── db/                # Database schema and connection
│   │   ├── repositories/      # Data access layer
│   │   ├── services/          # Business logic services
│   │   ├── hooks/             # React Query hooks
│   │   └── types/             # TypeScript interfaces
│   ├── tests/                 # Test suites
│   │   ├── unit/              # Unit tests
│   │   ├── integration/       # Integration tests
│   │   └── fixtures/          # Mock data
│   ├── config/                # Configuration files
│   └── data/                  # SQLite database (gitignored)
├── ARCHITECTURE.md            # System design documentation
├── AGENTS.md                  # Repository guidelines
└── research.md                # Library research notes
```

## Key Files

- dashboard/lib/db/schema.sql - Database schema definitions
- dashboard/lib/services/metrics.service.ts - Core metrics calculations
- dashboard/lib/services/jira-import.service.ts - Jira data ingestion
- dashboard/lib/services/github-import.service.ts - GitHub data correlation
- dashboard/lib/services/effort-calculator.ts - Discipline/effort analytics
- dashboard/biome.jsonc - Ultracite linting configuration
- dashboard/Makefile - Quality gate commands

## Entry Points

- dashboard/app/page.tsx - Home page (case study list)
- dashboard/app/layout.tsx - Root layout with providers
- dashboard/app/api/*/route.ts - API route handlers

## Architecture

The application follows a layered architecture:

**Frontend (React/Next.js) → API Layer (Next.js API Routes) → Service Layer → Repository Layer → SQLite**

### Key Components

- JiraImportService: Fetches tickets and changelogs from Jira API, creates lifecycle events
- GitHubImportService: Correlates commits/PRs to tickets via ID extraction from messages
- MetricsService: Calculates cycle time, lead time, velocity, time-in-status metrics
- EffortCalculator: Computes per-discipline analytics using normalized events
- CorrelationService: Links GitHub activity to Jira tickets and builds unified timelines
- ComplexityService: Applies RCS scoring model to tickets
- DisciplineService: Tags tickets with discipline classification

### Data Flow

1. User imports Jira data (project/sprint/ticket)
2. System fetches tickets and changelog from Jira API
3. GitHub import correlates commits/PRs by scanning for ticket IDs
4. Normalized events table provides unified timeline
5. Metrics calculated on-demand via API endpoints
6. Frontend renders charts and visualizations via TanStack Query

## Backend Patterns and Practices

- Repository Pattern: Each entity (case studies, tickets, events, commits, PRs) has its own repository with typed methods
- Service Layer: Business logic separated from data access; services orchestrate repository calls
- Zod Validation: Runtime type safety for API inputs
- Parameterized Queries: SQLite uses better-sqlite3 with parameterized queries for SQL injection prevention
- UUID Identifiers: All entities use UUID primary keys
- JSON Storage: Complex nested data stored as JSON columns (raw_jira_data, details, ticket_keys)
- Cascade Deletes: Foreign keys configured with ON DELETE CASCADE
- Index Strategy: Strategic indexes on foreign keys and common query patterns

## Frontend Patterns and Practices

- TanStack Query: All API calls managed via custom hooks (useMetrics, useCaseStudies, etc.)
- shadcn/ui Components: Button, Card, Form, Dialog, Select from radix primitives
- Tailwind CSS: Utility-first styling; avoid bespoke classes
- Recharts: Bar, Area, Pie charts for metrics visualization
- vis-timeline: Interactive timeline component for lifecycle events
- React Hook Form + Zod: Form validation with schema definitions
- Next.js App Router: File-based routing with page.tsx/route.ts conventions

## Build & Quality Gate Commands

- Install: `cd dashboard && bun install`
- Dev Server: `bun run dev` - Start development server at http://localhost:3000
- Build: `bun run build` - Build for production
- Start: `bun run start` - Start production server
- Lint: `bun run lint` - Run Ultracite linter (check only)
- Lint Fix: `bun run lint:fix` - Auto-fix linting issues
- Type Check: `bun run typecheck` - TypeScript strict mode check
- Unit Tests: `bun run test:unit` - Run unit tests only
- Integration Tests: `bun run test:integration` - Run integration tests (requires network)
- All Tests: `bun run test:run` - Run all tests
- Quality Gates: `cd dashboard && make` or `make quality-gates` - Runs lint, typecheck, unit, fast integration

## Testing

**Framework:** Vitest with happy-dom environment

### Running Tests

```bash
cd dashboard
bun run test:unit        # Unit tests (offline, mock data)
bun run test:integration # Integration tests (requires network)
bun run test:run         # All tests
```

### Creating New Tests

Tests go in `dashboard/tests/unit/` or `dashboard/tests/integration/`:

```typescript
// tests/unit/example.service.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ExampleService } from '@/lib/services/example.service';

describe('ExampleService', () => {
  beforeEach(() => {
    // Setup in-memory SQLite or mocks
  });

  it('should handle the happy path', () => {
    // Arrange, Act, Assert
  });

  it('should handle null/undefined edge cases', () => {
    // Edge case coverage
  });
});
```

**Test Data:** Uses Apache Kafka as primary test data source (public Jira/GitHub APIs)