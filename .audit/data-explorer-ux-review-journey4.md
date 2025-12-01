# Data Explorer UX Review - User Journey 4

**Date:** 2025-11-30  
**User Journey:** Journey 4 - Data Explorer Filtering  
**Objective:** Identify and override data issues that prevent correctly attributing tickets throughout the system

## 1. Journey Context

### User Journey 4 Intent

From [`user-journeys.md`](/Users/adamjackson/LocalDev/feature-lifecycle/user-journeys.md), User Journey 4 describes a workflow where users:

1. Navigate to a case study dashboard
2. Open the Data Explorer tab
3. Filter and search through tickets/events
4. Select rows to perform bulk actions
5. Override phase, discipline, complexity, or exclude items from metrics

**Core Objective:** The user's primary goal is to **identify and override data issues that prevent correctly attributing tickets throughout the system**. This means:

- Finding tickets with missing or incorrect phase/discipline/complexity assignments
- Understanding which tickets are affecting effort calculations incorrectly
- Taking corrective action through overrides or exclusions
- Ensuring the system can accurately track effort spend across disciplines and phases

**Current Status:** The journey notes a critical API bug (`RangeError: Too few parameter values were provided`) that was blocking functionality. This review assumes the bug has been addressed and evaluates the UX from a functional perspective.

---

## 2. Current UI State

### Screenshot Reference

**Screenshot Location:** `/var/folders/kf/dsjg8xr116l6q_pr732h999w0000gn/T/cursor/screenshots/data-explorer.png`

### Observed UI Elements

**Page Header:**
- Title: "Data Explorer"
- Description: "View, filter, and correct source data. Override phase, discipline, complexity, or exclude items from metrics."
- Navigation: Header with "Case Studies" and "New Import" links

**Filter Controls (within Card):**
- **Data Type Selector:** Dropdown showing "Tickets" (options: Tickets, Events, Normalized Events)
- **Search Input:** Placeholder "Search by key or summary..." with magnifying glass icon
- **Phase Filter:** Dropdown with "All Phases" option
- **Discipline Filter:** Dropdown with "All Disciplines" option
- **Filter Buttons:**
  - "Excluded" button (appears active with darker background)
  - "Overrides" button (inactive state)
- **Clear Filters:** X button (conditional, appears when filters are active)

**Data Table:**
- **Columns Visible:**
  - Checkbox column (for row selection)
  - **Key:** Green monospace text (e.g., "ECOM-0059", "ECOM-0060")
  - **Summary:** Truncated text descriptions
  - **Status:** Badge pills (e.g., "To Do", "In Progress")
  - **Phase:** Badge showing "Auto" for all visible rows
  - **Discipline:** Badge pills (e.g., "frontend", "devops", "backend", **"unknown"**)
  - **Complexity:** Column header "C" visible (content cut off in screenshot)
  - **Excluded:** Empty or "Excluded" badge
- **Row Selection:** Checkboxes on each row, master checkbox in header
- **Visual Indicators:**
  - Overridden values use gradient badges (primary/accent colors)
  - Auto-assigned values use secondary badges
  - "unknown" discipline appears as plain badge (no warning indicator)

**Bulk Actions Toolbar:**
- Appears when rows are selected
- Actions available: "Set Phase", "Set Discipline", "Set Complexity", "Exclude", "Include"
- Each action uses popover dialogs with dropdown selectors

**Pagination:**
- Shows "Showing X to Y of Z results"
- Previous/Next buttons

### Notable Observations from Screenshot

1. **Data Quality Issues Visible:**
   - Two tickets (ECOM-0057, ECOM-0054) show "unknown" as discipline
   - No visual warning or highlighting for these problematic values
   - "Auto" phase appears consistently, but no explanation of what this means

2. **Filter State:**
   - "Excluded" filter is active (darker background)
   - This suggests the user is viewing excluded tickets, but the purpose isn't immediately clear

3. **Table Layout:**
   - Complexity column is partially cut off (only "C" header visible)
   - Summary column uses line-clamp-2, potentially truncating important information

4. **No Error States Visible:**
   - No API error messages shown
   - Table appears to be loading/displaying data successfully

---

## 3. Alignment with User Goals

### How the Current UX Helps Users

**✅ Identification Capabilities:**
- **Search Functionality:** Users can search by ticket key or summary to find specific tickets
- **Filtering:** Phase and Discipline filters allow users to narrow down to specific categories
- **Visual Distinction:** Overridden values use gradient badges, making manual corrections visible
- **Bulk Selection:** Checkboxes enable selecting multiple tickets for batch corrections

**✅ Correction Capabilities:**
- **Bulk Actions Toolbar:** Provides Set Phase, Set Discipline, Set Complexity, Exclude/Include actions
- **Override System:** Supports manual overrides for phase, discipline, and complexity
- **Exclusion Toggle:** Allows excluding tickets from metrics calculations
- **Clear Override Option:** Bulk actions include "Clear Override" to revert to auto-assigned values

**✅ Data Exploration:**
- **Multiple Data Types:** Can switch between Tickets, Events, and Normalized Events
- **Pagination:** Handles large datasets with pagination controls
- **Status Visibility:** Current status of each ticket is clearly displayed

### Implementation Details Supporting Goals

From [`dashboard/components/data-explorer/DataExplorerView.tsx`](/Users/adamjackson/LocalDev/feature-lifecycle/dashboard/components/data-explorer/DataExplorerView.tsx):

1. **Search with Debounce (300ms):** Prevents excessive API calls while typing
2. **Filter State Management:** Tracks multiple filter types (phase, discipline, excluded, overrides)
3. **Row Selection State:** Maintains selection across pagination
4. **Bulk Update Hook:** `useDataExplorerBulkUpdate` handles batch operations
5. **Query Invalidation:** Automatically refreshes related queries after updates

From [`dashboard/components/data-explorer/BulkActionsToolbar.tsx`](/Users/adamjackson/LocalDev/feature-lifecycle/dashboard/components/data-explorer/BulkActionsToolbar.tsx):

1. **Popover-Based Actions:** Each bulk action opens a popover with a selector
2. **Clear Override Support:** Each action includes "Clear Override" option
3. **Loading States:** Shows spinner during bulk operations
4. **Immediate Feedback:** Updates UI after successful mutations

---

## 4. Gaps and Pain Points

### Critical UX Gaps

**1. No Visual Highlighting of Data Quality Issues**

**Evidence from Screenshot:**
- Tickets with "unknown" discipline appear as plain badges, indistinguishable from valid disciplines
- No warning icons, color coding, or visual indicators that "unknown" is a problem

**Impact:**
- Users must manually scan the entire table to find problematic tickets
- Easy to miss data quality issues, especially in large datasets
- No immediate visual feedback about which tickets need attention

**Gap:** Missing:
- Warning badges/icons for problematic values ("unknown", missing complexity)
- Color coding (yellow/orange) for data quality issues
- Summary banner showing count of issues (e.g., "5 tickets with unknown discipline")

**2. Lack of Contextual Guidance**

**Evidence from Screenshot:**
- "Auto" phase badge has no tooltip or explanation
- "unknown" discipline has no indication of why it's problematic or how to fix it
- Filter buttons ("Excluded", "Overrides") have no tooltips explaining their purpose

**Impact:**
- Users may not understand what "Auto" means or how it was determined
- Users may not realize "unknown" is a data quality issue that needs fixing
- Users may not know when to use the "Excluded" or "Overrides" filters

**Gap:** Missing:
- Tooltips on column headers and badges explaining terminology
- Help text explaining what each filter does
- Inline guidance on how to fix common issues
- Link to documentation or help section

**3. No Effort Context or Impact Visibility**

**Evidence from Implementation:**
- Table columns show: Key, Summary, Status, Phase, Discipline, Complexity, Excluded
- No columns for: Story Points, Hours, Effort Contribution, Time in Phase

**Impact:**
- Users cannot see which tickets have the most impact on effort calculations
- Users cannot prioritize which tickets to fix based on effort contribution
- Users cannot understand how their corrections will affect overall metrics
- No connection between data quality issues and effort spend analysis

**Gap:** Missing:
- Optional columns for effort metrics (story points, hours if available)
- Sortable by effort contribution
- Preview of how changes will affect effort breakdown
- Link to effort visualization showing impact

**4. Override Mechanism Not Discoverable**

**Evidence from Screenshot:**
- Bulk actions toolbar only appears after selecting rows
- No indication that row selection enables override capabilities
- No inline edit buttons or quick actions per row

**Impact:**
- Users may not realize they can create overrides through bulk actions
- Single-ticket corrections require selecting one row, opening popover, selecting value, clicking Apply (4 steps)
- No clear call-to-action for creating overrides

**Gap:** Missing:
- Inline edit buttons on each row
- Quick action menu (right-click or button) for individual tickets
- Visual indicator that values can be edited
- Tutorial or onboarding for first-time users

**5. Filter Purpose Unclear**

**Evidence from Screenshot:**
- "Excluded" button is active but no explanation of what it shows
- "Overrides" button exists but purpose is unclear
- No count badges showing how many items match each filter

**Impact:**
- Users may not understand when to use these filters
- Users may not realize they can filter to see only problematic tickets
- No way to quickly see how many tickets have overrides or are excluded

**Gap:** Missing:
- Tooltips explaining each filter's purpose
- Count badges (e.g., "Excluded (5)")
- Preview text showing what will be displayed
- Suggested filter presets (e.g., "Unknown Disciplines", "High Effort Tickets")

**6. No Impact Preview Before Changes**

**Evidence from Implementation:**
- Bulk actions apply immediately after clicking "Apply"
- No confirmation dialog or preview panel
- No indication of how many tickets will be affected or what the impact will be

**Impact:**
- Users may make changes without understanding the consequences
- No way to preview how changes will affect effort calculations
- Risk of accidentally excluding high-impact tickets

**Gap:** Missing:
- Preview panel showing affected tickets and impact
- Before/after comparison of effort breakdown
- Warning when excluding tickets with high effort contribution
- Confirmation dialog for bulk operations

**7. Disconnected from Effort Visualization**

**Evidence from Architecture:**
- Data Explorer is a separate tab from Overview (which shows effort charts)
- No direct link between data corrections and effort visualization
- Changes to overrides don't show real-time updates in effort charts

**Impact:**
- Users cannot see how their corrections affect the big picture
- Users must switch tabs to see effort breakdown
- No contextual help explaining how data quality affects effort calculations

**Gap:** Missing:
- Link to relevant charts filtered to selected tickets
- Real-time preview of metric changes after overrides
- Contextual help explaining effort calculation
- Integration with Overview tab to show impact

### Technical/Data Gaps

**8. API Error Handling (Potentially Resolved)**

**Evidence from user-journeys.md:**
- Note mentions `RangeError: Too few parameter values were provided` at `data-explorer.repository.ts:60`

**Current Implementation Review:**
- [`dashboard/lib/repositories/data-explorer.repository.ts`](/Users/adamjackson/LocalDev/feature-lifecycle/dashboard/lib/repositories/data-explorer.repository.ts) shows proper parameter handling in `buildTicketWhereClause`
- Parameters are properly constructed and passed to SQLite queries
- Error may have been resolved, but needs verification

**Gap:** Missing:
- Error boundary with helpful error messages
- Graceful degradation when API fails
- Retry mechanism for failed requests

**9. Missing Data Quality Summary**

**Evidence from Codebase:**
- [`dashboard/app/api/health/data-quality/route.ts`](/Users/adamjackson/LocalDev/feature-lifecycle/dashboard/app/api/health/data-quality/route.ts) exists and provides data quality metrics
- This endpoint is not integrated into Data Explorer UI

**Gap:** Missing:
- Summary banner showing data quality issues count
- Quick links to filter by issue type (missing story points, unknown disciplines, etc.)
- Integration with health check API

---

## 5. Recommendations & Actions

### High Priority (Critical for User Goal Achievement)

**1. Add Visual Data Quality Indicators**

**Actions:**
- Add warning icon/badge (⚠️) next to "unknown" discipline values
- Use yellow/orange background color for problematic cells
- Add summary banner at top of table: "X tickets with data quality issues"
- Highlight missing complexity values with visual indicator

**Implementation:**
- Modify `DataExplorerView.tsx` column definitions to add conditional styling
- Create `DataQualityBadge` component for warning states
- Add summary calculation in `useDataExplorer` hook

**2. Add Contextual Help & Tooltips**

**Actions:**
- Add tooltips to:
  - Phase "Auto" badge: "Automatically assigned based on status transitions. Click to override."
  - Discipline "unknown": "Discipline not detected. Use bulk actions to assign."
  - Excluded toggle: "Show only tickets excluded from effort calculations"
  - Overrides toggle: "Show only tickets with manual overrides"
- Add help icon (?) linking to documentation
- Add inline help text below table explaining common workflows

**Implementation:**
- Use shadcn/ui `Tooltip` component
- Create help content component
- Add help icon to header with popover content

**3. Add Effort Metrics to Table**

**Actions:**
- Add optional columns: Story Points, Hours (if available), Effort %
- Make columns toggleable via column visibility menu
- Sort by effort contribution by default (or provide option)
- Show effort contribution percentage for each ticket

**Implementation:**
- Extend `JiraTicket` type to include calculated effort metrics
- Add column visibility toggle using TanStack Table features
- Create `EffortMetricsColumn` component
- Update API to include effort calculations in response

**4. Streamline Override Workflow**

**Actions:**
- Add inline edit button (pencil icon) to each row
- Click opens inline form or dialog for quick single-ticket edits
- Add "Quick Fix" menu for common corrections:
  - "Set all unknown disciplines to [Discipline]"
  - "Exclude all tickets in [Phase]"
- Allow multi-field updates in single bulk action

**Implementation:**
- Create `InlineEditDialog` component
- Add edit button to table rows
- Extend `BulkActionsToolbar` with quick fix presets
- Update bulk update API to support multi-field updates

### Medium Priority (Improves Efficiency)

**5. Add Impact Preview**

**Actions:**
- Show preview panel when bulk actions are selected
- Display: "This will affect X tickets and Y hours of effort"
- Show before/after breakdown for affected metrics
- Add warning when excluding high-impact tickets

**Implementation:**
- Create `ImpactPreviewPanel` component
- Calculate impact using effort calculator service
- Show preview before applying bulk actions
- Add confirmation step for high-impact changes

**6. Link to Effort Context**

**Actions:**
- Add "View in Overview" link that filters Overview charts to selected tickets
- Add "See effort breakdown" button opening modal with discipline/phase breakdown
- Show real-time metric updates after overrides (via query invalidation)

**Implementation:**
- Create shared state or URL params for cross-tab filtering
- Add navigation helper to Overview tab with filters
- Create `EffortBreakdownModal` component
- Ensure query invalidation updates all relevant charts

**7. Enhance Filter Discoverability**

**Actions:**
- Add count badges to filter buttons (e.g., "Excluded (5)")
- Add tooltips explaining each filter's purpose
- Create filter presets: "Unknown Disciplines", "High Effort Tickets", "Missing Complexity"
- Add filter suggestions based on data quality issues

**Implementation:**
- Calculate filter counts in `useDataExplorer` hook
- Add badge component to filter buttons
- Create `FilterPresets` component
- Integrate with data quality API for suggestions

### Low Priority (Nice to Have)

**8. Onboarding Tour**

**Actions:**
- First-time user tutorial explaining:
  - What Data Explorer is for
  - How to identify data issues
  - How to create overrides
  - How overrides affect metrics

**Implementation:**
- Use library like `react-joyride` or `intro.js`
- Create tour steps configuration
- Store tour completion in localStorage

**9. Advanced Filtering**

**Actions:**
- Save filter presets (e.g., "Unknown Disciplines", "High Effort Tickets")
- Filter by effort range (story points, hours)
- Filter by date ranges
- Export filtered data

**Implementation:**
- Add filter preset storage (localStorage or API)
- Extend filter schema to support ranges
- Add date range picker component
- Add export functionality for filtered results

**10. Error Handling Improvements**

**Actions:**
- Add error boundary with helpful error messages
- Graceful degradation when API fails
- Retry mechanism for failed requests
- Offline indicator

**Implementation:**
- Use React Error Boundary
- Add retry logic to TanStack Query
- Create error state UI component
- Add network status detection

---

## Implementation Priority Matrix

| Recommendation | Impact | Effort | Priority | Dependencies |
|----------------|--------|--------|----------|--------------|
| Visual Data Quality Indicators | High | Low | P0 | None |
| Contextual Help & Tooltips | High | Low | P0 | None |
| Add Effort Metrics | High | Medium | P0 | Effort calculator service |
| Streamline Override Workflow | High | Medium | P0 | None |
| Impact Preview | High | High | P1 | Effort calculator service |
| Link to Effort Context | Medium | Medium | P1 | Shared state/URL params |
| Enhance Filter Discoverability | Medium | Low | P1 | Data quality API |
| Onboarding Tour | Low | High | P2 | None |
| Advanced Filtering | Low | Medium | P2 | Filter preset storage |
| Error Handling Improvements | Medium | Low | P2 | Error boundary component |

---

## Conclusion

The Data Explorer provides a **functional foundation** for identifying and overriding data issues, but several **critical UX gaps** prevent users from efficiently achieving their goal of correctly attributing tickets throughout the system.

### Key Findings

**Strengths:**
- Core functionality works (filtering, searching, bulk actions)
- Override system is technically sound
- Visual distinction between overridden and auto-assigned values

**Critical Gaps:**
1. **No visual highlighting** of data quality issues (e.g., "unknown" discipline)
2. **Lack of contextual guidance** explaining terminology and workflows
3. **No effort context** showing which tickets impact calculations most
4. **Override mechanism not discoverable** without selecting rows first
5. **No impact preview** before making changes
6. **Disconnected from effort visualization** on Overview tab

### Recommended Next Steps

1. **Immediate (P0):** Add visual data quality indicators and contextual help
2. **Short-term (P0-P1):** Add effort metrics to table and streamline override workflow
3. **Medium-term (P1-P2):** Add impact preview and link to effort context
4. **Long-term (P2+):** Onboarding tour and advanced filtering

Addressing the high-priority recommendations will transform the Data Explorer from a functional tool into an **effective solution** for data quality management and effort attribution, directly supporting the user's goal of correctly attributing tickets throughout the system.

