# Feature Lifecycle Dashboard

A dashboard application that tracks the complete development lifecycle of features from Jira ticket creation through GitHub PR merge and release deployment.

## Features

- **Import Data**: Import from Jira projects, sprints, individual tickets, or tickets by label
- **GitHub Correlation**: Automatically link commits and PRs to Jira tickets
- **Timeline View**: Interactive timeline showing complete feature lifecycle events
- **Metrics Dashboard**: Cycle time, lead time, sprint velocity, and effort analytics
- **Complexity Scoring**: Configurable complexity rubric for ticket sizing
- **Data Export**: Export metrics data as CSV

## Prerequisites

- [Bun](https://bun.sh) runtime installed

## Quick Start

```bash
cd dashboard
bun install
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

## Importing Data

### Using the Import Wizard

1. Navigate to [http://localhost:3000/import/new](http://localhost:3000/import/new)
2. Select an import type:
   - **Single Ticket** - Import one Jira ticket (fastest for testing)
   - **Project** - Import all tickets from a Jira project
   - **Sprint** - Import tickets from a specific sprint
   - **Feature** - Import tickets by Jira label
3. Enter Jira details (e.g., Project Key: `KAFKA`)
4. Enter GitHub details (e.g., Owner: `apache`, Repo: `kafka`)
5. Click **Start Import**

You can add multiple imports to the same case study to aggregate data from different sources.

### Test Data

The application works with Apache Kafka's public APIs for testing:
- **Jira**: https://issues.apache.org/jira/projects/KAFKA (public, no auth required)
- **GitHub**: https://github.com/apache/kafka (public, no auth required)

Recommended test tickets: `KAFKA-19734`, `KAFKA-17541`

## Pages

| Route | Description |
|-------|-------------|
| `/` | Home page with case study list |
| `/case-studies/[id]` | Case study dashboard with metrics and charts |
| `/case-studies/[id]/timeline` | Full timeline view |
| `/import/new` | Import wizard |
| `/rules` | Rules configuration editor |

## Dashboard Tabs

- **Overview** - Metrics cards and distribution charts
- **Flow** - Ticket flow analysis and bottleneck detection
- **Data Explorer** - Browse and filter raw ticket/event data
- **Data Quality** - Data completeness and quality assessment

## Troubleshooting

### Database Issues

The database is automatically created at `dashboard/data/lifecycle.db`. To start fresh:

```bash
rm dashboard/data/lifecycle.db
bun run dev  # Database will be recreated
```

### Port Already in Use

```bash
PORT=3001 bun run dev
```
