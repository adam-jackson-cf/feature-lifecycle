import { describe, expect, it } from 'vitest';
import type { PhaseRulesConfig } from '@/lib/services/phase.service';
import { PhaseService } from '@/lib/services/phase.service';
import {
  calculatePhaseDistribution,
  getPhaseBreakdownSummary,
} from '@/lib/services/phase-calculator';
import type { JiraTicket, NormalizedEvent } from '@/lib/types';

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
  ],
  default: 'development',
  priority: ['labels', 'discipline'],
};

const date = (iso: string) => new Date(iso);

const createTicket = (overrides: Partial<JiraTicket>): JiraTicket => ({
  id: 'test-id',
  caseStudyId: 'cs-1',
  jiraId: '1',
  jiraKey: 'T-1',
  summary: 'Ticket',
  issueType: 'Story',
  priority: 'Medium',
  currentStatus: 'Done',
  statusCategory: 'Done',
  createdAt: date('2024-01-01T09:00:00Z'),
  updatedAt: date('2024-01-03T09:00:00Z'),
  resolvedAt: date('2024-01-03T09:00:00Z'),
  rawJiraData: { fields: { labels: [] } },
  leadTime: 48 * 60 * 60 * 1000, // 48 hours in ms
  ...overrides,
});

describe('calculatePhaseDistribution', () => {
  const phaseService = new PhaseService(testConfig);

  it('groups tickets by phase and calculates percentages', () => {
    const tickets = [
      createTicket({ id: '1', jiraKey: 'BE-1', discipline: 'backend' }),
      createTicket({ id: '2', jiraKey: 'BE-2', discipline: 'backend' }),
      createTicket({ id: '3', jiraKey: 'QA-1', discipline: 'qa' }),
    ];

    const result = calculatePhaseDistribution(tickets, [], phaseService);

    expect(result.totalTickets).toBe(3);
    expect(result.phases.length).toBeGreaterThan(0);

    const devPhase = result.phases.find((p) => p.phase === 'development');
    const testPhase = result.phases.find((p) => p.phase === 'testing');

    expect(devPhase?.ticketCount).toBe(2);
    expect(testPhase?.ticketCount).toBe(1);
    expect(devPhase?.percentage).toBeCloseTo(66.67, 0);
    expect(testPhase?.percentage).toBeCloseTo(33.33, 0);
  });

  it('uses label overrides over discipline', () => {
    const tickets = [
      createTicket({
        id: '1',
        jiraKey: 'DISC-1',
        discipline: 'backend',
        rawJiraData: { fields: { labels: ['research', 'spike'] } },
      }),
    ];

    const result = calculatePhaseDistribution(tickets, [], phaseService);

    const discoveryPhase = result.phases.find((p) => p.phase === 'discovery');
    expect(discoveryPhase?.ticketCount).toBe(1);
    expect(discoveryPhase?.percentage).toBe(100);
  });

  it('respects phase overrides', () => {
    const tickets = [
      createTicket({
        id: '1',
        jiraKey: 'T-1',
        discipline: 'backend',
        phaseOverride: 'measure',
      }),
    ];

    const result = calculatePhaseDistribution(tickets, [], phaseService);

    const measurePhase = result.phases.find((p) => p.phase === 'measure');
    expect(measurePhase?.ticketCount).toBe(1);
    expect(measurePhase?.percentage).toBe(100);
  });

  it('excludes tickets marked as excluded from metrics', () => {
    const tickets = [
      createTicket({ id: '1', jiraKey: 'T-1', discipline: 'backend' }),
      createTicket({ id: '2', jiraKey: 'T-2', discipline: 'backend', excludedFromMetrics: true }),
    ];

    const result = calculatePhaseDistribution(tickets, [], phaseService);

    expect(result.totalTickets).toBe(1);
  });

  it('calculates hours from lead time', () => {
    const tickets = [
      createTicket({
        id: '1',
        jiraKey: 'T-1',
        discipline: 'backend',
        leadTime: 24 * 60 * 60 * 1000, // 24 hours
      }),
      createTicket({
        id: '2',
        jiraKey: 'T-2',
        discipline: 'qa',
        leadTime: 8 * 60 * 60 * 1000, // 8 hours
      }),
    ];

    const result = calculatePhaseDistribution(tickets, [], phaseService);

    expect(result.totalHours).toBe(32); // 24 + 8
  });

  it('returns empty phases for empty input', () => {
    const result = calculatePhaseDistribution([], [], phaseService);

    expect(result.phases).toHaveLength(0);
    expect(result.totalTickets).toBe(0);
    expect(result.totalHours).toBe(0);
  });

  it('sorts phases by percentage descending', () => {
    const tickets = [
      createTicket({
        id: '1',
        jiraKey: 'T-1',
        discipline: 'backend',
        leadTime: 100 * 60 * 60 * 1000,
      }),
      createTicket({ id: '2', jiraKey: 'T-2', discipline: 'qa', leadTime: 50 * 60 * 60 * 1000 }),
      createTicket({
        id: '3',
        jiraKey: 'T-3',
        discipline: 'devops',
        leadTime: 25 * 60 * 60 * 1000,
      }),
    ];

    const result = calculatePhaseDistribution(tickets, [], phaseService);

    // Should be sorted: development (100h) > testing (50h) > deployment (25h)
    expect(result.phases[0].phase).toBe('development');
    expect(result.phases[1].phase).toBe('testing');
    expect(result.phases[2].phase).toBe('deployment');
  });
});

describe('getPhaseBreakdownSummary', () => {
  const phaseService = new PhaseService(testConfig);

  it('returns top phase info', () => {
    const tickets = [
      createTicket({ id: '1', jiraKey: 'T-1', discipline: 'backend' }),
      createTicket({ id: '2', jiraKey: 'T-2', discipline: 'qa' }),
    ];

    const distribution = calculatePhaseDistribution(tickets, [], phaseService);
    const summary = getPhaseBreakdownSummary(distribution);

    expect(summary.topPhase).toBe('Development');
    expect(summary.topPercentage).toBeGreaterThan(0);
  });

  it('returns N/A for empty distribution', () => {
    const distribution = calculatePhaseDistribution([], [], phaseService);
    const summary = getPhaseBreakdownSummary(distribution);

    expect(summary.topPhase).toBe('N/A');
    expect(summary.topPercentage).toBe(0);
  });
});
