import { describe, expect, it } from 'vitest';
import type { PhaseRulesConfig } from '@/lib/services/phase.service';
import { PhaseService } from '@/lib/services/phase.service';
import type { JiraTicket } from '@/lib/types';

const testConfig: PhaseRulesConfig = {
  disciplineMapping: {
    backend: 'development',
    frontend: 'development',
    qa: 'testing',
    devops: 'deployment',
  },
  labelOverrides: [
    { phase: 'discovery', patterns: ['research', 'spike'] },
    { phase: 'design', patterns: ['design', 'ux'] },
    { phase: 'testing', patterns: ['qa', 'test'] },
    { phase: 'deployment', patterns: ['release', 'deploy'] },
  ],
  default: 'development',
  priority: ['labels', 'discipline'],
};

const createTicket = (overrides: Partial<JiraTicket> = {}): JiraTicket => ({
  id: 'test-id',
  caseStudyId: 'cs-1',
  jiraId: '1',
  jiraKey: 'TEST-1',
  summary: 'Test ticket',
  issueType: 'Story',
  priority: 'Medium',
  currentStatus: 'Done',
  statusCategory: 'Done',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-02'),
  rawJiraData: { fields: { labels: [] } },
  ...overrides,
});

describe('PhaseService', () => {
  const service = new PhaseService(testConfig);

  describe('derivePhase', () => {
    it('derives phase from labels with priority', () => {
      const ticket = createTicket({
        discipline: 'backend',
        rawJiraData: { fields: { labels: ['research', 'spike'] } },
      });

      expect(service.derivePhase(ticket)).toBe('discovery');
    });

    it('falls back to discipline when no label match', () => {
      const ticket = createTicket({
        discipline: 'qa',
        rawJiraData: { fields: { labels: ['other'] } },
      });

      expect(service.derivePhase(ticket)).toBe('testing');
    });

    it('uses default when no match', () => {
      const ticket = createTicket({
        discipline: 'unknown',
        rawJiraData: { fields: { labels: [] } },
      });

      expect(service.derivePhase(ticket)).toBe('development');
    });

    it('respects phaseOverride over everything', () => {
      const ticket = createTicket({
        discipline: 'qa',
        phaseOverride: 'measure',
        rawJiraData: { fields: { labels: ['research'] } },
      });

      // Override should take precedence even with matching labels
      expect(service.derivePhase(ticket)).toBe('measure');
    });

    it('respects disciplineOverride over original discipline', () => {
      const ticket = createTicket({
        discipline: 'backend',
        disciplineOverride: 'devops',
        rawJiraData: { fields: { labels: [] } },
      });

      expect(service.derivePhase(ticket)).toBe('deployment');
    });
  });

  describe('deriveFromArrays', () => {
    it('matches labels first', () => {
      const result = service.deriveFromArrays(['ux', 'design'], 'backend');
      expect(result).toBe('design');
    });

    it('falls back to discipline', () => {
      const result = service.deriveFromArrays(['other'], 'devops');
      expect(result).toBe('deployment');
    });

    it('respects phaseOverride parameter', () => {
      const result = service.deriveFromArrays(['research'], 'backend', 'testing');
      expect(result).toBe('testing');
    });
  });

  describe('getEffectiveDiscipline', () => {
    it('returns override when set', () => {
      const ticket = createTicket({
        discipline: 'backend',
        disciplineOverride: 'frontend',
      });

      expect(service.getEffectiveDiscipline(ticket)).toBe('frontend');
    });

    it('returns original when no override', () => {
      const ticket = createTicket({
        discipline: 'backend',
      });

      expect(service.getEffectiveDiscipline(ticket)).toBe('backend');
    });
  });

  describe('getEffectiveComplexity', () => {
    it('returns override when set', () => {
      const ticket = createTicket({
        complexitySize: 'S',
        complexityOverride: 'XL',
      });

      expect(service.getEffectiveComplexity(ticket)).toBe('XL');
    });

    it('returns original when no override', () => {
      const ticket = createTicket({
        complexitySize: 'M',
      });

      expect(service.getEffectiveComplexity(ticket)).toBe('M');
    });
  });

  describe('isExcludedFromMetrics', () => {
    it('returns true when excluded', () => {
      const ticket = createTicket({
        excludedFromMetrics: true,
      });

      expect(service.isExcludedFromMetrics(ticket)).toBe(true);
    });

    it('returns false when not excluded', () => {
      const ticket = createTicket({
        excludedFromMetrics: false,
      });

      expect(service.isExcludedFromMetrics(ticket)).toBe(false);
    });

    it('returns false when undefined', () => {
      const ticket = createTicket({});

      expect(service.isExcludedFromMetrics(ticket)).toBe(false);
    });
  });

  describe('getAvailablePhases', () => {
    it('returns all phases except unknown', () => {
      const phases = service.getAvailablePhases();
      expect(phases).toHaveLength(7);
      expect(phases).toContain('discovery');
      expect(phases).toContain('development');
      expect(phases).not.toContain('unknown');
    });
  });
});
