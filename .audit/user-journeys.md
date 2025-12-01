# Feature Lifecycle Dashboard - User Journeys for E2E Testing

This document defines automated browser test steps for each user journey in the Feature Lifecycle Dashboard application.

## Audit Summary

**Date:** 2025-11-29

### Issues Found

| Severity | Route | Issue |
|----------|-------|-------|
| **Critical** | `/data-explorer` | API returns 500 error - `RangeError: Too few parameter values were provided` at `data-explorer.repository.ts:60` |
| **Minor** | `/aggregate` | Donut chart not visibly rendering (SVG exists but chart not displayed) |
| **Minor** | Dashboard | "Discovery & Resea..." text truncated in Effort by Phase legend |

### Working Features

- Home page case study cards with status badges
- Case Study Dashboard with all metric charts (donut charts, bar charts)
- Tab switching (Overview/Flow/Data Explorer/Data Quality) - Radix tabs on dashboard
- Timeline View (Flow tab) with Ticket Flow Analysis, expandable tickets
- Import Wizard 4-step flow with forward/back navigation
- Header navigation (Case Studies, New Import)
- Pagination and filter UI elements render correctly

---

## User Journey 1: View Case Study Dashboard

**Description:** User navigates from home to view detailed metrics for a case study.

### Steps

```javascript
// Step 1: Navigate to home page
await page.goto('http://localhost:3000');
await expect(page.locator('h1')).toContainText('Case Studies');

// Step 2: Verify case study cards are displayed
await expect(page.locator('[data-testid="case-study-card"]')).toHaveCount({ minimum: 1 });

// Step 3: Click on first case study card
await page.locator('[data-testid="case-study-card"]').first().click();

// Step 4: Verify dashboard loads with case study title
await expect(page.url()).toContain('/case-studies/');
await expect(page.locator('h1')).toBeVisible();

// Step 5: Verify metric cards are displayed
await expect(page.locator('[data-testid="metrics-cards"]')).toBeVisible();
await expect(page.getByText('Cycle')).toBeVisible();
await expect(page.getByText('Lead')).toBeVisible();
await expect(page.getByText('Tickets')).toBeVisible();

// Step 6: Verify charts render
await expect(page.getByText('Effort by Phase')).toBeVisible();
await expect(page.getByText('Status Distribution')).toBeVisible();

// Step 7: Scroll down to see more charts
await page.evaluate(() => window.scrollTo(0, 800));
await expect(page.getByText('Effort by Complexity')).toBeVisible();
await expect(page.getByText('Discipline Distribution')).toBeVisible();

// Step 8: Verify tabs are available
await expect(page.getByRole('tab', { name: 'Overview' })).toBeVisible();
await expect(page.getByRole('tab', { name: 'Flow' })).toBeVisible();
await expect(page.getByRole('tab', { name: 'Data Explorer' })).toBeVisible();
await expect(page.getByRole('tab', { name: 'Data Quality' })).toBeVisible();
```

### Expected Results
- Dashboard displays case study name and project info
- All 6 metric cards show values
- Effort by Phase, Status Distribution, Effort by Complexity, Discipline Distribution charts render
- Time to completion chart displays
- Four tabs available: Overview, Flow, Data Explorer, Data Quality

---

## User Journey 2: Navigate Header Links

**Description:** User navigates between main routes using header navigation.

**Note:** Header navigation only includes "Case Studies" and "New Import". Flow and Data Explorer are accessed via tabs on the dashboard page, not header links.

### Steps

```javascript
// Step 1: Start at home
await page.goto('http://localhost:3000');
await expect(page.getByText('Case Studies').first()).toBeVisible();

// Step 2: Click New Import link
await page.getByRole('link', { name: 'New Import' }).click();
await expect(page.url()).toContain('/import/new');
await expect(page.getByText('Import Wizard')).toBeVisible();

// Step 3: Click Case Studies to return home
await page.getByRole('link', { name: 'Case Studies' }).click();
await expect(page.url()).toBe('http://localhost:3000/');
```

### Expected Results
- Header links navigate to correct routes (Case Studies, New Import)
- Each page displays appropriate heading/content

---

## User Journey 3: View Timeline and Expand Tickets

**Description:** User views timeline (Flow tab) for a case study and expands ticket details.

**Note:** Flow is accessed via a Radix tab on the dashboard page, not a separate route or button.

### Steps

```javascript
// Step 1: Navigate to case study dashboard
await page.goto('http://localhost:3000/case-studies/{caseStudyId}');

// Step 2: Click Flow tab
await page.getByRole('tab', { name: 'Flow' }).click();

// Step 3: Verify Ticket Flow Analysis displays
await expect(page.getByText('Ticket Flow Analysis')).toBeVisible();
await expect(page.getByText('tickets in flow')).toBeVisible();

// Step 4: Verify flow state nodes display
await expect(page.getByText('Created')).toBeVisible();
await expect(page.getByText('In Progress')).toBeVisible();

// Step 5: Click Expand All button
await page.getByRole('button', { name: 'Expand All' }).click();

// Step 6: Verify ticket events expand
await page.waitForTimeout(500);
const expandedContent = page.locator('[data-testid="timeline-event"]');
await expect(expandedContent).toHaveCount({ minimum: 1 });

// Step 7: Click help icon to see tooltip
await page.locator('[data-testid="help-icon"]').click();
await expect(page.getByText('Understanding Ticket Flow')).toBeVisible();
```

### Expected Results
- Flow tab displays ticket flow analysis
- Expand All reveals ticket event history
- Events show status transitions with dates and time deltas


---

## User Journey 4: Data Explorer Filtering

**Description:** User filters and searches data in the Data Explorer.

**Note:** Currently blocked by API bug - `RangeError: Too few parameter values were provided`

### Steps (for when bug is fixed)

```javascript
// Step 1: Navigate to case study dashboard and open Data Explorer tab
await page.goto('http://localhost:3000/case-studies/{caseStudyId}');
await page.getByRole('tab', { name: 'Data Explorer' }).click();

// Step 2: Verify data type selector
await expect(page.getByRole('combobox').first()).toHaveText('Tickets');

// Step 3: Verify table columns
await expect(page.getByRole('columnheader', { name: 'Key' })).toBeVisible();
await expect(page.getByRole('columnheader', { name: 'Summary' })).toBeVisible();
await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible();

// Step 4: Test search input
await page.getByPlaceholder('Search by key or summary').fill('ECOM-0001');
await page.waitForTimeout(500); // debounce

// Step 5: Test phase filter
await page.locator('[data-testid="phase-filter"]').click();
await page.getByText('Development').click();

// Step 6: Test row selection
await page.locator('input[type="checkbox"]').first().click();

// Step 7: Verify bulk actions toolbar appears
await expect(page.getByText('Set Phase')).toBeVisible();
await expect(page.getByText('Set Discipline')).toBeVisible();

// Step 8: Test pagination
await expect(page.getByText(/Showing \d+ to \d+/)).toBeVisible();
await page.getByRole('button', { name: 'Next' }).click();
```

### Expected Results
- Table displays tickets with all columns
- Search filters results after debounce
- Phase/Discipline filters work
- Row selection enables bulk actions
- Pagination navigates through results

---

## User Journey 5: Import Wizard Flow

**Description:** User walks through the import wizard to set up a new case study.

### Steps

```javascript
// Step 1: Navigate to Import Wizard
await page.goto('http://localhost:3000/import/new');
await expect(page.getByText('Import Wizard')).toBeVisible();

// Step 2: Verify Step 1 - Select Import Type
await expect(page.getByText('Select Import Type')).toBeVisible();
await expect(page.getByText('Project')).toBeVisible();
await expect(page.getByText('Sprint')).toBeVisible();
await expect(page.getByText('Single Ticket')).toBeVisible();

// Step 3: Select Project import type
await page.getByText('Project').click();

// Step 4: Verify Step 2 - Jira Configuration
await expect(page.getByLabel('Jira Project Key')).toBeVisible();
await page.getByLabel('Jira Project Key').fill('KAFKA');

// Step 5: Click Next
await page.getByRole('button', { name: 'Next' }).click();

// Step 6: Verify Step 3 - GitHub Configuration
await expect(page.getByLabel('GitHub Owner')).toBeVisible();
await expect(page.getByLabel('Repository Name')).toBeVisible();
await page.getByLabel('GitHub Owner').fill('apache');
await page.getByLabel('Repository Name').fill('kafka');

// Step 7: Click Next
await page.getByRole('button', { name: 'Next' }).click();

// Step 8: Verify Step 4 - Review & Confirm
await expect(page.getByText('Review & Confirm')).toBeVisible();
await expect(page.getByText('Type: project')).toBeVisible();
await expect(page.getByText('Jira Project: KAFKA')).toBeVisible();
await expect(page.getByText('GitHub: apache/kafka')).toBeVisible();

// Step 9: Test Back navigation
await page.getByRole('button', { name: 'Back' }).click();
await expect(page.getByLabel('GitHub Owner')).toBeVisible();

// Step 10: Navigate forward and start import (UI only test - don't actually import)
await page.getByRole('button', { name: 'Next' }).click();
await expect(page.getByRole('button', { name: 'Start Import' })).toBeVisible();
```

### Expected Results
- All 4 wizard steps accessible
- Back/Next navigation works
- Form values display in review step
- Start Import button available

---

## User Journey 6: Export CSV

**Description:** User exports case study data as CSV.

### Steps

```javascript
// Step 1: Navigate to case study dashboard
await page.goto('http://localhost:3000/case-studies/{caseStudyId}');

// Step 2: Click Export CSV button
const [download] = await Promise.all([
  page.waitForEvent('download'),
  page.getByRole('button', { name: 'Export CSV' }).click(),
]);

// Step 3: Verify download
expect(download.suggestedFilename()).toContain('.csv');
```

### Expected Results
- CSV file downloads with case study data

---

## User Journey 7: Navigate to Data Explorer from Dashboard

**Description:** User accesses Data Explorer via tab on the dashboard page for the current case study.

**Note:** Data Explorer is a Radix tab on the dashboard page, not a separate route or header link.

### Steps

```javascript
// Step 1: Navigate to case study dashboard
await page.goto('http://localhost:3000/case-studies/{caseStudyId}');

// Step 2: Click Data Explorer tab
await page.getByRole('tab', { name: 'Data Explorer' }).click();

// Step 3: Verify Data Explorer content displays
await expect(page.getByText('Data Explorer')).toBeVisible();
await expect(page.getByRole('combobox', { name: /Ticket/i })).toBeVisible();
```

### Expected Results
- Data Explorer tab displays with case study data
- Filter controls and table are visible

---

## Test Data Requirements

For e2e tests to run successfully, the database should have:

1. At least 2 completed case studies with:
   - 10+ tickets each
   - Lifecycle events (status changes, commits, PRs)
   - Mix of phases and disciplines

2. Test case study IDs should be configured as environment variables or fixtures

---

## Browser Testing Configuration

Recommended Playwright configuration:

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'cd dashboard && make dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120000,
  },
});
```
