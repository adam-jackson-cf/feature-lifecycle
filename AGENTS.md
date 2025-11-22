# Repository Guidelines

## Project Structure & Module Organization
- Root docs: `README.md`, `ARCHITECTURE.md`, `research.md`, `jtbd.md`, `.cursor/plans/*.md`.
- App code lives in `dashboard/` (Next.js 15 + TS): `app/` routes, `lib/` (db, repositories, services, utils, types), `components/` (to be expanded), `tests/` (unit + integration stub), `public/` assets.
- Database schema: `dashboard/lib/db/schema.sql`; SQLite DB path defaults to `dashboard/data/lifecycle.db` (override via `DATABASE_PATH`).

## Build, Test, and Development Commands
- Install deps: `cd dashboard && npm install`.
- Dev server: `npm run dev` (http://localhost:3000).
- Unit tests: `npm run test:unit` (Vitest, mock data).
- Integration tests: `npm run test:integration` (hits public Kafka Jira/GitHub; requires network).
- All tests: `npm run test:run`.
- Lint: `npm run lint`; TypeScript check: `npm run typecheck`.
- Quality gates (preferred): `cd dashboard && make` or `make quality-gates` (runs lint, typecheck, unit, fast integration). Must be green before considering a task complete.

## Coding Style & Naming Conventions
- Language: TypeScript (strict), React/Next.js app router.
- Style: ESLint + Prettier (see `eslint.config.mjs`, `prettier.config.js`); run lint before commits.
- Naming: files kebab-case; React components PascalCase; types/interfaces PascalCase; constants SCREAMING_SNAKE_CASE; helper functions camelCase.
- Commit/PR hygiene: avoid committing `.env` or database files; keep schema changes in `schema.sql`.

## Testing Guidelines
- Framework: Vitest. Unit fixtures in `tests/fixtures/`; unit specs in `tests/unit/`; integration in `tests/integration/`.
- Write focused tests per service/repository; prefer in-memory SQLite for unit tests (see `jira-import.service.test.ts` setup).
- Naming: `*.test.ts`; keep one describe block per unit under test; include edge cases for null/undefined payloads.

## Commit & Pull Request Guidelines
- Commit messages: short imperative (“Add metrics service”, “Fix Jira changelog parsing”).
- Before PR: run `npm run lint`, `npm run typecheck`, `npm run test:unit` (and integration when touching import/network code).
- PR description: scope, testing done, risk/rollback notes; attach screenshots for UI changes; link Jira/GitHub issue keys in title/body.

## Security & Configuration Tips
- Secrets: use environment variables (`.env.local` ignored by git). Needed values: `JIRA_HOST`, `JIRA_EMAIL`, `JIRA_API_TOKEN`, `GITHUB_TOKEN`, `DATABASE_PATH`.
- Data hygiene: test imports target public Kafka data by default—avoid real customer data unless configs are set explicitly.
