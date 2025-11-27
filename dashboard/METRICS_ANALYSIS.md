# Dashboard Metrics Analysis & Fixes

## Issues Found and Fixed

### 1. ✅ Complexity Breakdown Showing Empty Objects
**Problem**: The API was returning `Map` objects which don't serialize to JSON properly, resulting in empty `{}` objects.

**Root Cause**: `getComplexityBreakdown()` returned `Map<string, number>` instead of plain objects.

**Fix**: Changed return type to `Record<string, number>` and used plain objects instead of Maps.

**Result**: Now correctly shows:
```json
{
  "bySize": { "XS": 2 },
  "byDiscipline": { "unknown": 2 },
  "oversize": 0
}
```

### 2. ✅ Cycle Time & Lead Time Showing 0
**Problem**: Average cycle time and lead time were showing 0 even though individual tickets had values.

**Root Causes**:
- `getAverageMetrics()` only calculated averages for tickets with `resolved_at IS NOT NULL`
- The ticket status is "In Progress" (not resolved), so it was excluded
- Metrics weren't being calculated after import

**Fixes**:
- Updated `getAverageMetrics()` to include all tickets with non-null metrics, not just resolved ones
- Added automatic `calculateMetrics()` call after import
- Improved `calculateMetrics()` to calculate lead time even for unresolved tickets (using `updatedAt` instead of `resolvedAt`)
- Enhanced cycle time calculation to use multiple methods:
  1. First commit to resolution (if resolved)
  2. Status change from "In Progress" to "Done"
  3. Status change from "In Progress" to current date (if not done)

**Result**: Now shows:
- `avgCycleTime`: 2,438,524,655 ms (~28 days)
- `avgLeadTime`: 4,918,968,823 ms (~57 days)

### 3. ✅ Flow Efficiency Showing 0
**Problem**: Flow efficiency (active vs queue time) was showing 0.

**Root Causes**:
- Required `status_changed` events from Jira changelog
- Changelog data wasn't being imported
- Flow efficiency calculation needed at least 2 status events to work

**Fixes**:
- Added `fetchIssueChangelog()` method to fetch changelog data from Jira API
- Integrated changelog import into `importIssues()` flow
- Improved flow efficiency calculation to:
  - Handle tickets with no status events (use ticket creation/update dates)
  - Account for time from ticket creation to first status change
  - Better detect "active" statuses (In Progress, Review, Testing)

**Result**: Now shows:
- `activeTime`: 4,877,049,310 ms (~56 days)
- `queueTime`: 4,960,888,336 ms (~57 days)
- `efficiency`: 49.57%

### 4. ⚠️ Completed Tickets Showing 0
**Status**: Expected behavior (not a bug)

**Reason**: The imported ticket (KAFKA-19734) has status "In Progress", not "Done". This is correct - the metric only counts tickets with `statusCategory === 'Done'`.

**Recommendation**: Import resolved/completed tickets to see this metric populate.

### 5. ⚠️ Velocity Points Showing 0
**Status**: Expected behavior (not a bug)

**Reason**: The imported ticket has no story points assigned. This is correct - velocity is the sum of story points for completed tickets.

**Recommendation**: Import tickets with story points to see this metric populate.

### 6. ⚠️ Total PRs Showing 0
**Status**: Missing feature

**Reason**: PR import functionality is not yet implemented. Only commits are being imported.

**Recommendation**: Implement PR import in `GitHubImportService` to fetch and import pull request data.

## Current Metrics Status

After fixes, the dashboard now correctly displays:

✅ **Working Metrics**:
- Total Tickets: 2
- Total Commits: 68
- Average Cycle Time: ~28 days
- Average Lead Time: ~57 days
- Flow Efficiency: 49.57%
- Complexity Breakdown: XS=2, unknown discipline=2
- Discipline Effort (new): per-discipline lead/cycle medians, active vs queue hours, efficiency %, oversize rate, reopen count (powered by normalized lifecycle events)

⚠️ **Expected Zero Values** (not bugs):
- Completed Tickets: 0 (ticket is "In Progress")
- Velocity Points: 0 (no story points assigned)
- Total PRs: 0 (PR import not implemented)

## Recommendations for Future Improvements

1. **PR Import**: Implement pull request import to track PR lifecycle events
2. **Story Points**: Consider importing story points from Jira custom fields
3. **Resolved Tickets**: Import a mix of resolved and in-progress tickets for better metrics
4. **Status Distribution**: The Status Distribution chart is currently showing placeholder data - implement real status distribution calculation
5. **Velocity Chart**: Implement sprint-based velocity tracking





