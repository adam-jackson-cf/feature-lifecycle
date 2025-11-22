# Feature Lifecycle Dashboard

A comprehensive dashboard application that tracks the complete development lifecycle of features from Jira ticket creation through GitHub PR merge and release deployment.

## Project Structure

```
feature-lifecycle/
├── README.md              # This file
├── research.md            # Consolidated research documentation
├── ARCHITECTURE.md        # System architecture and design decisions
└── dashboard/             # Next.js application implementation
    ├── app/               # Next.js pages and routes
    ├── components/        # React components
    ├── lib/
    │   ├── db/            # Database schema and connection
    │   ├── repositories/  # Data access layer
    │   ├── services/      # Business logic
    │   ├── types/         # TypeScript definitions
    │   └── utils/         # Helper functions
    ├── tests/
    │   ├── fixtures/      # Mock data for testing
    │   ├── unit/          # Unit tests (14 passing)
    │   └── integration/   # Real API integration tests
    └── public/            # Static assets
```

## Features

- **Multi-level Import**: Import data at project, sprint, or individual ticket level
- **Jira Integration**: Fetch tickets, changelogs, and status transitions
- **GitHub Integration**: Fetch commits, PRs, reviews, and merge history
- **Data Correlation**: Match Jira tickets with GitHub commits via ticket ID patterns
- **Timeline Visualization**: Chronological view of the complete development lifecycle
- **Metrics Calculation**: Lead time, cycle time, sprint velocity

## Quick Start

```bash
cd dashboard
bun install
bun run dev
```

## Running Tests

```bash
cd dashboard

# Unit tests (offline, uses mock data)
bun run test:unit

# Integration tests (requires network access)
bun run test:integration

# All tests
bun run test:run
```

## Quality Gates

All must pass before commit:
- TypeScript type checking: `bun run typecheck`
- Ultracite linting: `bun run lint`
- Unit tests: `bun run test:unit`

Or use the Makefile for all quality gates:
```bash
cd dashboard
make quality-gates
```

## Documentation

- [Research Documentation](./research.md) - Library selection, API research, test data sources
- [Architecture Document](./ARCHITECTURE.md) - System design, data models, API endpoints

## Test Data Sources

The project uses **Apache Kafka** as the primary test data source:
- **Jira**: https://issues.apache.org/jira/projects/KAFKA (public API)
- **GitHub**: https://github.com/apache/kafka (public API)

Both APIs are publicly accessible without authentication for read-only access.

## Technology Stack

- **Runtime**: Bun (replaces npm)
- **Language**: TypeScript 5+
- **Framework**: Next.js 16 (App Router)
- **Database**: SQLite with better-sqlite3
- **Linting/Formatting**: Ultracite (Biome-based)
- **Jira Integration**: jira.js
- **GitHub Integration**: Octokit
- **Testing**: Vitest
- **UI**: React 19, Tailwind CSS, Recharts, vis-timeline
- **State Management**: TanStack Query
