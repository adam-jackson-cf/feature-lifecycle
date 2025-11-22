import { describe, expect, it } from 'vitest';
import complexityConfig from '@/config/complexity.config.json';
import { type ComplexityConfig, ComplexityService } from '@/lib/services/complexity.service';
import type { JiraIssue } from '@/tests/fixtures/jira/mock-issues';

const service = new ComplexityService();

const baseIssue = {
  id: '1',
  key: 'ABC-1',
  fields: {
    summary: 'Add endpoint for user export',
    description: 'Given user data, add endpoint and migration',
    labels: ['api', 'export'],
    components: [{ name: 'backend' }],
    status: { name: 'To Do', statusCategory: { key: 'new' } },
    issuetype: { name: 'Task' },
    priority: { name: 'Major' },
    reporter: { displayName: 'Rep', accountId: '1' },
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
} as unknown as JiraIssue;

describe('ComplexityService', () => {
  it('calculates deterministic score and size', () => {
    const result = service.calculateRCS(
      baseIssue as unknown as JiraIssue,
      complexityConfig as unknown as ComplexityConfig
    );
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(['XS', 'S', 'M', 'L', 'XL']).toContain(result.size);
  });

  it('clamps metrics and respects oversize threshold', () => {
    const highIssue = {
      ...baseIssue,
      fields: {
        ...baseIssue.fields,
        description: 'new module create table migration add endpoint',
      },
    } as JiraIssue;
    const result = service.calculateRCS(
      highIssue as unknown as JiraIssue,
      complexityConfig as unknown as ComplexityConfig
    );
    expect(result.factors.B).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(complexityConfig.clamping.max);
    if (result.size === complexityConfig.oversize.threshold) {
      expect(result.oversize).toBe(true);
    }
  });
});
