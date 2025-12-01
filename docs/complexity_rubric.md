# Complexity Rubric - RCS (Relative Complexity Score)

## Overview

The Relative Complexity Score (RCS) is a deterministic model for calculating perceived complexity of engineering tasks. It uses a weighted sum of five dimensions to produce a final complexity score, which is then mapped to size buckets.

## Dimensions

The RCS model evaluates complexity across five dimensions:

1. **B (Business Logic)** - Complexity of business rules and logic
2. **T (Technical)** - Technical implementation complexity
3. **S (System)** - System-level changes and integrations
4. **A (Architecture)** - Architectural impact and changes
5. **U (User Experience)** - UX/UI complexity and user journey impact

Each dimension is scored from **0-5**, where:
- 0 = No complexity
- 1-2 = Low complexity
- 3 = Medium complexity
- 4 = High complexity
- 5 = Very high complexity

## Scoring Calculation

The final RCS is calculated as:

```
RCS = (B × wB) + (T × wT) + (S × wS) + (A × wA) + (U × wU)
```

Where `wB`, `wT`, `wS`, `wA`, `wU` are the weights for each dimension (default: 1.0 each).

## Size Buckets

The RCS score is mapped to size buckets:

| Size | Score Range | Description |
|------|-------------|-------------|
| XS   | 0-5         | Extra Small |
| S    | 6-10        | Small       |
| M    | 11-15       | Medium      |
| L    | 16-22       | Large       |
| XL   | 23-50       | Extra Large |

## Oversize Flag

Tickets exceeding the XL threshold (default: >22) are flagged as **oversize**. This indicates tickets that may need to be broken down into smaller pieces.

## Configuration

The complexity model is configured in `config/complexity.config.json`:

```json
{
  "dimensions": {
    "business": { "weight": 1.0 },
    "technical": { "weight": 1.0 },
    "system": { "weight": 1.0 },
    "architecture": { "weight": 1.0 },
    "userExperience": { "weight": 1.0 }
  },
  "sizeBuckets": {
    "XS": { "min": 0, "max": 5 },
    "S": { "min": 6, "max": 10 },
    "M": { "min": 11, "max": 15 },
    "L": { "min": 16, "max": 22 },
    "XL": { "min": 23, "max": 50 }
  },
  "oversize": {
    "threshold": "XL"
  },
  "clamping": {
    "enabled": true,
    "min": 0,
    "max": 50
  }
}
```

## Editing the Configuration

1. Navigate to `/rules` in the dashboard
2. Select the "Complexity Rules" tab
3. Edit the JSON configuration
4. Click "Save Changes"

Alternatively, edit `config/complexity.config.json` directly and restart the application.

## Metric Clamping

All metrics are clamped to the 0-50 range to prevent outliers from skewing analysis. This ensures consistent comparison across tickets and case studies.

## Usage in Metrics

Complexity scores are used throughout the dashboard:
- **Effort Complexity View**: Breakdown by complexity size and discipline
- **Timeline Filters**: Filter events by complexity size
- **Export Data**: Include complexity scores in CSV/Parquet exports
- **AI Comparison**: Compare AI vs non-AI tickets by complexity bucket

## Examples

### Example 1: Simple Bug Fix
- Business: 1 (minimal business logic)
- Technical: 2 (straightforward fix)
- System: 0 (no system changes)
- Architecture: 0 (no architectural impact)
- UX: 0 (no UX changes)
- **RCS**: 3 → **Size**: XS

### Example 2: New Feature
- Business: 4 (complex business rules)
- Technical: 3 (moderate technical complexity)
- System: 2 (some system integration)
- Architecture: 2 (minor architectural changes)
- UX: 3 (new user flows)
- **RCS**: 14 → **Size**: M

### Example 3: Major Refactor
- Business: 3 (business logic changes)
- Technical: 5 (significant technical work)
- System: 4 (major system changes)
- Architecture: 5 (architectural refactor)
- UX: 2 (some UX impact)
- **RCS**: 19 → **Size**: L

