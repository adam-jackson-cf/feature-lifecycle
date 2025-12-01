# API Endpoints

REST API routes for the Feature Lifecycle Dashboard.

## Case Studies

- `GET /api/case-studies` - List all case studies
- `POST /api/case-studies` - Create new case study
- `GET /api/case-studies/:id` - Get case study details
- `DELETE /api/case-studies/:id` - Delete case study

## Import

- `POST /api/import/jira/project` - Import Jira project
- `POST /api/import/jira/sprint` - Import Jira sprint
- `POST /api/import/jira/ticket` - Import single Jira ticket
- `POST /api/import/jira/feature` - Import Jira tickets by label
- `POST /api/import/github` - Import GitHub data for case study

## Metrics

- `GET /api/metrics/:caseStudyId/timeline` - Get lifecycle timeline
- `GET /api/metrics/:caseStudyId/summary` - Get metrics summary
- `GET /api/metrics/:caseStudyId/cycle-time` - Get cycle time data
- `GET /api/metrics/:caseStudyId/lead-time` - Get lead time data
- `GET /api/metrics/:caseStudyId/velocity` - Get sprint velocity
- `GET /api/metrics/:caseStudyId/exports?format=csv` - Export data as CSV

## Rules Configuration

- `GET /api/rules` - Fetch complexity and discipline rules
- `PUT /api/rules` - Update rules
- `GET /api/rules/complexity` - Fetch complexity config
- `PUT /api/rules/complexity` - Update complexity config
- `GET /api/rules/discipline` - Fetch discipline rules
- `PUT /api/rules/discipline` - Update discipline rules

## Health

- `GET /api/health` - Health check endpoint
- `GET /api/health/data-quality` - Data quality report
