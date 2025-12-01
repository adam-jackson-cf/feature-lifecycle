# Data Explorer UX Review

**Date:** 2025-11-30  
**User Journey:** Journey 4 - Data Explorer Filtering  
**Objective:** Identify and override data issues that impact understanding of effort spend across a case study

## Executive Summary

The Data Explorer provides a functional foundation for identifying and correcting data issues, but several critical gaps prevent users from efficiently achieving their goal of understanding effort spend. While the interface supports filtering, searching, and bulk overrides, it lacks clear visual indicators for data quality issues, direct effort metrics, and contextual guidance on how overrides impact effort calculations.

---

## 1. Current UI State

### Screenshot Reference
- **Location:** `file:///var/folders/kf/dsjg8xr116l6q_pr732h999w0000gn/T/cursor/screenshots/data-explorer-tab.png`
- **Status:** Data Explorer tab is accessible and functional (after fixing the RangeError bug)

### Key UI Elements Observed

**Header Controls:**
- Data type selector (Tickets/Events/Normalized Events)
- Search input with debounce (300ms)
- Phase filter dropdown
- Discipline filter dropdown
- "Excluded" toggle button (active/inactive state)
- "Overrides" toggle button (active/inactive state)
- Clear filters button (conditional)

**Data Table:**
- Columns: Key, Summary, Status, Phase, Discipline, Complexity, Excluded
- Row selection checkboxes
- Pagination controls (Previous/Next with count display)
- Visual distinction for overridden values (gradient badges vs secondary badges)

**Bulk Actions Toolbar:**
- Appears when rows are selected
- Actions: Set Phase, Set Discipline, Set Complexity, Exclude, Include
- Each action uses popover dialogs with selectors

---

## 2. Goals to Existing Flows Mapping

### Intended User Flow (from user-journeys.md)

```javascript
1. Navigate to case study dashboard → Open Data Explorer tab
2. Verify data type selector defaults to "Tickets"
3. Verify table columns (Key, Summary, Status)
4. Use search input (debounced 400-500ms)
5. Apply phase filter (e.g., "Development")
6. Select rows → Bulk actions toolbar appears
7. Test pagination
```

### Current Implementation Status

**✅ Working:**
- Tab navigation and data type selector
- Search with 300ms debounce (slightly faster than spec)
- Phase and Discipline filters
- Row selection and bulk actions toolbar
- Pagination with count display
- Visual indicators for overridden values (gradient badges)

**⚠️ Partially Working:**
- Overrides filter button exists but functionality unclear from UI alone
- Excluded filter works but impact on effort calculations not explained

**❌ Missing/Blocked:**
- API bug (RangeError) mentioned in user-journeys.md - needs verification if fixed
- No direct display of effort metrics (hours, story points) in table
- No visual highlighting of data quality issues (e.g., "unknown" discipline)

---

## 3. Comprehension & Guidance Evaluation

### What Users Can Understand

**Clear:**
- Table structure is standard and familiar
- Column headers are self-explanatory (Key, Summary, Status, Phase, Discipline, Complexity)
- Override indicators (gradient badges) visually distinguish manual overrides from auto-assigned values
- Bulk actions toolbar appears contextually when rows are selected

**Unclear:**
- **"Auto" Phase Badge:** Users may not understand what "Auto" means or how it was determined
- **"unknown" Discipline:** No visual warning or explanation that this is a data quality issue
- **Excluded Toggle:** Purpose and impact on effort calculations not explained
- **Overrides Toggle:** What qualifies as an "override" and why filter by them?
- **Effort Impact:** No indication of how changing phase/discipline affects effort spend metrics

### Missing Guidance

1. **No Tooltips or Help Text:**
   - Phase column: What does "Auto" mean? How is it calculated?
   - Discipline column: Why is "unknown" a problem? How to fix?
   - Excluded toggle: What gets excluded and why?
   - Overrides toggle: What are overrides and when to use this filter?

2. **No Data Quality Indicators:**
   - "unknown" disciplines should be visually flagged (e.g., warning icon, yellow background)
   - Missing complexity values not highlighted
   - No summary of data quality issues at the top of the table

3. **No Effort Context:**
   - Table doesn't show effort metrics (hours, story points) that would help users understand impact
   - No preview of how changes will affect effort calculations
   - No link to see effort breakdown by discipline/phase

4. **No Onboarding:**
   - First-time users have no guidance on how to use the Data Explorer
   - No explanation of the relationship between data quality and effort metrics

---

## 4. Actionability Gaps

### Critical Blockers

**1. API Error (Potentially Fixed)**
- **Issue:** RangeError: "Too few parameter values were provided" at `data-explorer.repository.ts:60`
- **Impact:** Prevents data from loading
- **Status:** Needs verification - code review shows proper parameter handling, may be resolved
- **Location:** `dashboard/lib/repositories/data-explorer.repository.ts:60` (in `findTickets` method)

**2. No Direct Effort Metrics Display**
- **Issue:** Table shows tickets but not their contribution to effort calculations
- **Impact:** Users can't see which tickets have the most impact on effort spend
- **Gap:** Missing columns for:
  - Story points
  - Estimated/actual hours (if available)
  - Effort contribution percentage
  - Time in each phase

**3. No Visual Issue Highlighting**
- **Issue:** Data quality problems (e.g., "unknown" discipline) blend in with normal data
- **Impact:** Users must manually scan to find issues
- **Gap:** No:
  - Warning badges/icons for problematic values
  - Color coding for data quality issues
  - Summary count of issues at top of table

### UX Discoverability Issues

**4. Override Mechanism Not Obvious**
- **Issue:** Users can see overrides exist (gradient badges) but may not know how to create them
- **Impact:** Users might not realize bulk actions are the way to override
- **Gap:** No:
  - Inline edit buttons per row
  - Clear call-to-action for creating overrides
  - Explanation of when to override vs. fix source data

**5. Filter Purpose Unclear**
- **Issue:** "Excluded" and "Overrides" toggle buttons don't explain their purpose
- **Impact:** Users may not understand when to use these filters
- **Gap:** Missing:
  - Tooltips explaining what each filter does
  - Count badges showing how many items match
  - Preview of what will be shown

**6. Bulk Actions Require Multiple Clicks**
- **Issue:** Each bulk action (Set Phase, Set Discipline, etc.) requires:
  1. Select rows
  2. Click action button
  3. Open popover
  4. Select value
  5. Click Apply
- **Impact:** Slower workflow for common corrections
- **Gap:** No:
  - Quick actions for common fixes (e.g., "Set all unknown to Backend")
  - Keyboard shortcuts
  - Batch operations (set phase AND discipline in one action)

### Missing Contextual Information

**7. No Impact Preview**
- **Issue:** Users can't see how their changes will affect effort metrics before applying
- **Impact:** Users may make changes that don't achieve their goal
- **Gap:** No:
  - Preview panel showing before/after effort breakdown
  - Warning when excluding high-impact tickets
  - Summary of changes before confirmation

**8. No Link to Effort Visualization**
- **Issue:** Data Explorer is disconnected from effort charts on Overview tab
- **Impact:** Users can't see how their corrections affect the big picture
- **Gap:** No:
  - Link to relevant charts
  - Contextual help explaining effort calculation
  - Real-time preview of metric changes

---

## 5. Recommendations

### High Priority (Critical for User Goal)

**1. Fix API Error (If Still Present)**
- Verify RangeError is resolved
- Add error boundary with helpful message
- Test with edge cases (empty filters, large datasets)

**2. Add Effort Metrics to Table**
- Add optional columns: Story Points, Hours (if available), Effort %
- Make columns toggleable via column visibility menu
- Sort by effort contribution by default

**3. Visual Data Quality Indicators**
- Add warning icon/badge for "unknown" disciplines
- Highlight missing or problematic values with yellow/orange background
- Add summary banner: "X tickets with data quality issues"

**4. Contextual Help & Tooltips**
- Add tooltips to:
  - Phase "Auto" badge: "Automatically assigned based on status transitions"
  - Discipline "unknown": "Discipline not detected. Use bulk actions to assign."
  - Excluded toggle: "Show only tickets excluded from effort calculations"
  - Overrides toggle: "Show only tickets with manual overrides"
- Add help icon linking to documentation

### Medium Priority (Improves Efficiency)

**5. Streamline Bulk Actions**
- Add "Quick Fix" menu for common corrections:
  - "Set all unknown disciplines to [Discipline]"
  - "Exclude all tickets in [Phase]"
- Allow multi-field updates in single action
- Add keyboard shortcuts (Cmd/Ctrl+K for bulk actions)

**6. Inline Editing**
- Add edit icon to each row
- Click opens inline form or dialog
- Faster than bulk actions for single-ticket fixes

**7. Impact Preview**
- Show preview panel when bulk actions are selected
- Display: "This will affect X tickets and Y hours of effort"
- Show before/after breakdown for affected metrics

**8. Link to Effort Context**
- Add "View in Overview" link that filters Overview charts to selected tickets
- Add "See effort breakdown" button that opens modal with discipline/phase breakdown
- Show real-time metric updates after overrides

### Low Priority (Nice to Have)

**9. Onboarding Tour**
- First-time user tutorial explaining:
  - What Data Explorer is for
  - How to identify data issues
  - How to create overrides
  - How overrides affect metrics

**10. Advanced Filtering**
- Save filter presets (e.g., "Unknown Disciplines", "High Effort Tickets")
- Filter by effort range (story points, hours)
- Filter by date ranges

**11. Export Filtered Data**
- "Export current view" button that exports only visible/filtered tickets
- Include override information in export

---

## Implementation Priority Matrix

| Recommendation | Impact | Effort | Priority |
|----------------|--------|--------|----------|
| Fix API Error | Critical | Low | P0 |
| Add Effort Metrics | High | Medium | P0 |
| Visual Quality Indicators | High | Low | P0 |
| Contextual Help | Medium | Low | P1 |
| Streamline Bulk Actions | Medium | Medium | P1 |
| Inline Editing | Medium | High | P2 |
| Impact Preview | High | High | P2 |
| Link to Effort Context | Medium | Medium | P2 |
| Onboarding Tour | Low | High | P3 |
| Advanced Filtering | Low | Medium | P3 |
| Export Filtered Data | Low | Low | P3 |

---

## Conclusion

The Data Explorer provides the necessary functionality for identifying and overriding data issues, but significant UX improvements are needed to help users efficiently achieve their goal of understanding effort spend. The most critical gaps are:

1. **Lack of effort context** - Users can't see how data issues impact effort calculations
2. **Poor discoverability** - Data quality issues aren't visually highlighted
3. **Missing guidance** - No explanation of what overrides do or how to use them effectively

Addressing the high-priority recommendations will transform the Data Explorer from a functional tool into an effective solution for data quality management and effort analysis.

