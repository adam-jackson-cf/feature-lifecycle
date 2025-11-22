import { describe, expect, it } from 'vitest';
import type { DisciplineRulesConfig } from '@/lib/services/discipline.service';
import { DisciplineService } from '@/lib/services/discipline.service';

const rules: DisciplineRulesConfig = {
  default: 'backend',
  priority: ['labels', 'components'],
  rules: [
    { discipline: 'frontend', patterns: { labels: ['ui', 'ux'], components: ['ui'] } },
    { discipline: 'data', patterns: { labels: ['data'], components: ['analytics'] } },
  ],
};

describe('DisciplineService', () => {
  const service = new DisciplineService();

  it('matches discipline from labels', () => {
    const result = service.deriveFromArrays(['UI-update'], [], rules);
    expect(result).toBe('frontend');
  });

  it('falls back to default when no match', () => {
    const result = service.deriveFromArrays(['misc'], ['platform'], rules);
    expect(result).toBe('backend');
  });
});
