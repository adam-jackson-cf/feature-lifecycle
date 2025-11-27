# Quick Start Guide - Testing the Dashboard

This guide will help you launch the project and populate it with test data from Apache Kafka's public Jira and GitHub repositories.

## Prerequisites

- Bun runtime installed ([bun.sh](https://bun.sh))
- Node.js 18+ (if not using Bun)

## Step 1: Install Dependencies

```bash
cd dashboard
bun install
```

## Step 2: Start the Development Server

```bash
bun run dev
```

The server will start at [http://localhost:3000](http://localhost:3000)

## Step 3: Import Test Data

### Option A: Using the Import Wizard (Recommended)

1. Navigate to [http://localhost:3000/import/new](http://localhost:3000/import/new)
2. Follow these steps:
   - **Step 1**: Select "Single Ticket" (fastest for testing)
   - **Step 2**: Enter:
     - Jira Project Key: `KAFKA`
     - Ticket Key: `KAFKA-19734` (or any valid KAFKA ticket)
   - **Step 3**: Enter:
     - GitHub Owner: `apache`
     - Repository Name: `kafka`
   - **Step 4**: Click "Start Import"
3. Wait for the import to complete (you'll see progress messages)
4. You'll be automatically redirected to the case study dashboard

### Option B: Using the API Directly

You can also use curl or any HTTP client to import data:

```bash
# 1. Create a case study
curl -X POST http://localhost:3000/api/case-studies \
  -H "Content-Type: application/json" \
  -d '{
    "name": "KAFKA Test Import",
    "type": "ticket",
    "jiraProjectKey": "KAFKA",
    "jiraTicketKey": "KAFKA-19734",
    "githubOwner": "apache",
    "githubRepo": "kafka"
  }'

# Note the caseStudyId from the response, then:

# 2. Import Jira ticket (replace CASE_STUDY_ID)
curl -X POST http://localhost:3000/api/import/jira/ticket \
  -H "Content-Type: application/json" \
  -d '{
    "caseStudyId": "CASE_STUDY_ID",
    "issue": {}
  }'

# 3. Import GitHub commits (replace CASE_STUDY_ID)
curl -X POST http://localhost:3000/api/import/github \
  -H "Content-Type: application/json" \
  -d '{
    "caseStudyId": "CASE_STUDY_ID",
    "perPage": 30,
    "maxCommits": 100
  }'
```

### New: Discipline/Effort Analytics
- Imports now also write normalized lifecycle events to power per-discipline effort metrics (lead/cycle medians, active vs queue hours, efficiency %, oversize rate, reopens).
- The dashboard’s Effort/Complexity panel shows a Discipline Effort table sourced from these normalized events.

## Step 4: View the Dashboard

1. After import completes, you'll be redirected to `/case-studies/[id]`
2. Or navigate to [http://localhost:3000](http://localhost:3000) to see all case studies
3. Click on a case study to view its dashboard with:
   - Metrics summary cards
   - Cycle time and lead time charts
   - Velocity charts
   - Status distribution
   - Timeline view

## Test Data Sources

The project uses **Apache Kafka** as the primary test data source:
- **Jira**: https://issues.apache.org/jira/projects/KAFKA (public, no auth required)
- **GitHub**: https://github.com/apache/kafka (public API, no auth required for read access)

### Recommended Test Tickets

- `KAFKA-19734` - Good example ticket
- `KAFKA-17541` - Another test ticket
- Or use "Project" import type to import multiple tickets from the KAFKA project

## Troubleshooting

### Database Issues

If you encounter database errors:
- The database is automatically created at `dashboard/data/lifecycle.db`
- Delete it to start fresh: `rm dashboard/data/lifecycle.db`

### Import Failures

- Check the browser console for errors
- Verify the Jira ticket key exists: https://issues.apache.org/jira/browse/KAFKA-19734
- For GitHub imports, ensure the repository is public

### Port Already in Use

If port 3000 is in use:
```bash
# Use a different port
PORT=3001 bun run dev
```

## Next Steps

- Explore the dashboard metrics and visualisations
- Try importing different ticket types (project, sprint, ticket)
- Check out the timeline view at `/case-studies/[id]/timeline`
- Review the rules configuration at `/rules`





