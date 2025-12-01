# Dashboard Application

Next.js 16 application with React 19 for the Feature Lifecycle Dashboard.

## Build & Quality Gate Commands

- Install: `bun install`
- Dev Server: `bun run dev` - Start development server at http://localhost:3000
- Build: `bun run build` - Build for production
- Start: `bun run start` - Start production server
- Lint: `bun run lint` - Run Ultracite linter (check only)
- Lint Fix: `bun run lint:fix` - Auto-fix linting issues
- Type Check: `bun run typecheck` - TypeScript strict mode check
- Unit Tests: `bun run test:unit` - Run unit tests only
- Integration Tests: `bun run test:integration` - Run integration tests (requires network)
- All Tests: `bun run test:run` - Run all tests
- Quality Gates: `make` or `make quality-gates` - Runs lint, typecheck, unit, fast integration

### Debugging Errors

```bash
make status   # Show running node/bun/next processes
make logs     # Tail the unified log file
make clean-logs  # Truncate log file to start fresh
```

## Frontend Patterns and Practices

- TanStack Query: All API calls managed via custom hooks (useMetrics, useCaseStudies, etc.)
- shadcn/ui Components: Button, Card, Form, Dialog, Select from radix primitives
- Tailwind CSS: Utility-first styling; avoid bespoke classes
- Recharts: Bar, Area, Pie charts for metrics visualization
- vis-timeline: Interactive timeline component for lifecycle events
- React Hook Form + Zod: Form validation with schema definitions
- Next.js App Router: File-based routing with page.tsx/route.ts conventions

## Key Files

- `lib/db/schema.sql` - Database schema definitions
- `lib/services/metrics.service.ts` - Core metrics calculations
- `lib/services/jira-import.service.ts` - Jira data ingestion
- `lib/services/github-import.service.ts` - GitHub data correlation
- `lib/services/effort-calculator.ts` - Discipline/effort analytics
- `biome.jsonc` - Ultracite linting configuration
- `Makefile` - Quality gate commands

## Entry Points

- `app/page.tsx` - Home page (case study list)
- `app/layout.tsx` - Root layout with providers
- `app/api/*/route.ts` - API route handlers

## Configuration Files

- `config/complexity.config.json` - RCS complexity scoring thresholds and weights
- `config/discipline-rules.json` - Discipline tagging rules (labels, components, paths)
- `biome.jsonc` - Ultracite/Biome linting and formatting configuration
