# Feature Lifecycle Dashboard

A comprehensive dashboard application that tracks the complete development lifecycle of features from Jira ticket creation through GitHub PR merge and release deployment.

## Quick Start

```bash
cd dashboard
bun install
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the dashboard.

## Technology Stack

- **Runtime**: Bun (replaces npm)
- **Language**: TypeScript 5.7+
- **Framework**: Next.js 16 (App Router)
- **Database**: SQLite with better-sqlite3
- **Linting/Formatting**: Ultracite (Biome-based)
- **Jira Integration**: jira.js
- **GitHub Integration**: Octokit
- **Testing**: Vitest
- **UI**: React 19, Tailwind CSS, Recharts, vis-timeline
- **State Management**: TanStack Query

## Installation

### Prerequisites

- Bun runtime installed ([bun.sh](https://bun.sh))

### Setup

```bash
# Install dependencies
bun install

# Run development server
bun run dev

# Build for production
bun run build

# Start production server
bun run start
```

## Available Scripts

- `bun run dev` - Start development server
- `bun run build` - Build for production
- `bun run start` - Start production server
- `bun run lint` - Run Ultracite linter (check only)
- `bun run lint:fix` - Run Ultracite linter and auto-fix issues
- `bun run format` - Format code with Ultracite
- `bun run format:check` - Check code formatting
- `bun run test` - Run all tests
- `bun run test:unit` - Run unit tests only
- `bun run test:integration` - Run integration tests (requires network)
- `bun run typecheck` - Run TypeScript type checking

## Linting & Formatting

This project uses **Ultracite** (a zero-configuration Biome setup) for linting and formatting.

### Ultracite Usage

```bash
# Check for linting issues
bun run lint

# Auto-fix linting issues
bun run lint:fix

# Format code
bun run format

# Check formatting
bun run format:check
```

Ultracite configuration is in `biome.jsonc`. It provides:
- Zero-configuration setup with sensible defaults
- Fast Rust-based linting and formatting
- Automatic import organisation
- TypeScript-aware rules

## Running Tests

```bash
# Unit tests (offline, uses mock data)
bun run test:unit

# Integration tests (requires network access)
bun run test:integration

# All tests
bun run test:run
```

## API Endpoints

### Case Studies
- `GET /api/case-studies` - List all case studies
- `POST /api/case-studies` - Create new case study
- `GET /api/case-studies/:id` - Get case study details
- `DELETE /api/case-studies/:id` - Delete case study

### Import
- `POST /api/import/jira/project` - Import Jira project
- `POST /api/import/jira/sprint` - Import Jira sprint
- `POST /api/import/jira/ticket` - Import single Jira ticket
- `POST /api/import/github` - Import GitHub data for case study

### Metrics
- `GET /api/metrics/:caseStudyId/timeline` - Get lifecycle timeline
- `GET /api/metrics/:caseStudyId/summary` - Get metrics summary
- `GET /api/metrics/:caseStudyId/cycle-time` - Get cycle time data
- `GET /api/metrics/:caseStudyId/lead-time` - Get lead time data
- `GET /api/metrics/:caseStudyId/velocity` - Get sprint velocity
- `GET /api/metrics/:caseStudyId/exports?format=csv` - Export data as CSV

### Rules
- `GET /api/rules` - Fetch complexity and discipline rules
- `PUT /api/rules` - Update rules
- `GET /api/rules/complexity` - Fetch complexity config
- `PUT /api/rules/complexity` - Update complexity config
- `GET /api/rules/discipline` - Fetch discipline rules
- `PUT /api/rules/discipline` - Update discipline rules

### Health
- `GET /api/health` - Health check endpoint
- `GET /api/health/data-quality` - Data quality report

## Frontend Pages

- `/` - Home page with case study list
- `/case-studies/[id]` - Case study dashboard
- `/case-studies/[id]/timeline` - Full timeline view
- `/import/new` - Import wizard
- `/rules` - Rules configuration editor

## Configuration Files

- `config/complexity.config.json` - Complexity scoring configuration (RCS model)
- `config/discipline-rules.json` - Discipline tagging rules
- `biome.jsonc` - Ultracite/Biome linting and formatting configuration

## Database

The application uses SQLite with the database file located at:
- Default: `data/lifecycle.db` (relative to project root)
- Custom: Set `DATABASE_PATH` environment variable

Database schema is automatically initialized on app startup. Migrations are located in `lib/db/migrations/`.

## Test Data Sources

The project uses **Apache Kafka** as the primary test data source:
- **Jira**: https://issues.apache.org/jira/projects/KAFKA (public API)
- **GitHub**: https://github.com/apache/kafka (public API)

Both APIs are publicly accessible without authentication for read-only access.

## Documentation

- [Research Documentation](../research.md) - Library selection, API research, test data sources
- [Architecture Document](../ARCHITECTURE.md) - System design, data models, API endpoints
- [Complexity Rubric](./docs/complexity_rubric.md) - RCS metrics, weights, thresholds

## Quality Gates

All must pass before commit:
- TypeScript type checking: `bun run typecheck`
- Ultracite linting: `bun run lint`
- Unit tests: `bun run test:unit`
