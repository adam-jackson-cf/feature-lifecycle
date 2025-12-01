# Testing

Vitest test suites for unit and integration testing.

## Framework

Vitest with happy-dom environment

## Running Tests

```bash
bun run test:unit        # Unit tests (offline, mock data)
bun run test:integration # Integration tests (requires network)
bun run test:run         # All tests
```

## Creating New Tests

Tests go in `unit/` or `integration/`:

```typescript
// unit/example.service.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ExampleService } from '@/lib/services/example.service';

describe('ExampleService', () => {
  beforeEach(() => {
    // Setup in-memory SQLite or mocks
  });

  it('should handle the happy path', () => {
    // Arrange, Act, Assert
  });

  it('should handle null/undefined edge cases', () => {
    // Edge case coverage
  });
});
```

## Test Data

Uses Apache Kafka as primary test data source (public Jira/GitHub APIs)

## Integration Tests

Integration tests in `integration/` use REAL data from public APIs (Apache Kafka Jira/GitHub).

### Test Flow

1. Fetch real Jira issues from Apache Jira (KAFKA-17541, KAFKA-19734)
2. Import Jira data and create lifecycle events
3. Fetch real GitHub commits from apache/kafka repository
4. Extract KAFKA-XXXXX ticket references from commit messages
5. Correlate Jira tickets with GitHub commits
6. Build timeline and calculate metrics

### Notes

- Requires network access to public APIs
- Subject to rate limits (GitHub: 60 req/hour unauthenticated)
- May fail in sandboxed/offline environments
