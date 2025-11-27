import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { calculateEffortByDiscipline } from '@/lib/services/effort-calculator';
import type { JiraTicket, NormalizedEvent } from '@/lib/types';
import { EventType } from '@/lib/types';

const date = (iso: string) => new Date(iso);

const baseTicket = (overrides: Partial<JiraTicket>): JiraTicket => ({
  id: randomUUID(),
  caseStudyId: 'cs-1',
  jiraId: '1',
  jiraKey: 'T-1',
  summary: 'Ticket',
  issueType: 'Story',
  priority: 'Medium',
  currentStatus: 'To Do',
  statusCategory: 'To Do',
  createdAt: date('2024-01-01T09:00:00Z'),
  updatedAt: date('2024-01-01T09:00:00Z'),
  rawJiraData: {},
  ...overrides,
});

const event = (overrides: Partial<NormalizedEvent>): NormalizedEvent => ({
  id: randomUUID(),
  caseStudyId: 'cs-1',
  ticketKey: 'T-1',
  eventType: EventType.STATUS_CHANGED,
  eventSource: 'jira',
  occurredAt: date('2024-01-01T10:00:00Z'),
  actorName: 'User',
  createdAt: date('2024-01-01T10:00:00Z'),
  details: {},
  ...overrides,
});

describe('calculateEffortByDiscipline', () => {
  it('aggregates lead/cycle/flow/oversize/reopens per discipline', () => {
    const backendTicket1 = baseTicket({
      jiraKey: 'BE-1',
      discipline: 'backend',
      createdAt: date('2024-01-01T09:00:00Z'),
      resolvedAt: date('2024-01-03T09:00:00Z'),
      oversizeFlag: true,
    });

    const backendTicket2 = baseTicket({
      jiraKey: 'BE-2',
      discipline: 'backend',
      createdAt: date('2024-01-01T10:00:00Z'),
      resolvedAt: date('2024-01-03T10:00:00Z'),
      oversizeFlag: false,
    });

    const frontendTicket = baseTicket({
      jiraKey: 'FE-1',
      discipline: 'frontend',
      createdAt: date('2024-01-02T08:00:00Z'),
      resolvedAt: date('2024-01-03T08:00:00Z'),
      oversizeFlag: false,
    });

    const events: NormalizedEvent[] = [
      // Backend ticket 1: queue 24h, active 24h
      event({
        ticketKey: 'BE-1',
        occurredAt: date('2024-01-01T09:00:00Z'),
        eventType: EventType.TICKET_CREATED,
      }),
      event({
        ticketKey: 'BE-1',
        occurredAt: date('2024-01-02T09:00:00Z'),
        details: { toStatus: 'In Progress' },
      }),
      event({
        ticketKey: 'BE-1',
        occurredAt: date('2024-01-03T09:00:00Z'),
        details: { toStatus: 'Done' },
      }),
      event({
        ticketKey: 'BE-1',
        occurredAt: date('2024-01-03T09:00:00Z'),
        eventType: EventType.RESOLVED,
      }),

      // Backend ticket 2: queue 10h, active 38h, one reopen
      event({
        ticketKey: 'BE-2',
        occurredAt: date('2024-01-01T10:00:00Z'),
        eventType: EventType.TICKET_CREATED,
      }),
      event({
        ticketKey: 'BE-2',
        occurredAt: date('2024-01-01T12:00:00Z'),
        details: { toStatus: 'In Progress' },
      }),
      event({
        ticketKey: 'BE-2',
        occurredAt: date('2024-01-02T10:00:00Z'),
        details: { toStatus: 'Done' },
      }),
      event({
        ticketKey: 'BE-2',
        occurredAt: date('2024-01-02T18:00:00Z'),
        details: { toStatus: 'In Progress' },
      }),
      event({
        ticketKey: 'BE-2',
        occurredAt: date('2024-01-03T10:00:00Z'),
        details: { toStatus: 'Done' },
      }),
      event({
        ticketKey: 'BE-2',
        occurredAt: date('2024-01-03T10:00:00Z'),
        eventType: EventType.RESOLVED,
      }),

      // Frontend ticket: queue 16h, active 8h
      event({
        ticketKey: 'FE-1',
        occurredAt: date('2024-01-02T08:00:00Z'),
        eventType: EventType.TICKET_CREATED,
      }),
      event({
        ticketKey: 'FE-1',
        occurredAt: date('2024-01-02T16:00:00Z'),
        details: { toStatus: 'In Progress' },
      }),
      event({
        ticketKey: 'FE-1',
        occurredAt: date('2024-01-03T00:00:00Z'),
        details: { toStatus: 'Done' },
      }),
      event({
        ticketKey: 'FE-1',
        occurredAt: date('2024-01-03T08:00:00Z'),
        eventType: EventType.RESOLVED,
      }),
    ];

    const snapshots = calculateEffortByDiscipline(
      [backendTicket1, backendTicket2, frontendTicket],
      events
    );

    const backend = snapshots.find((s) => s.discipline === 'backend');
    const frontend = snapshots.find((s) => s.discipline === 'frontend');

    expect(backend).toBeDefined();
    expect(frontend).toBeDefined();

    expect(backend?.ticketCount).toBe(2);
    expect(backend?.leadTimeMedianHours).toBeCloseTo(48, 1);
    expect(backend?.cycleTimeMedianHours).toBeGreaterThan(30);
    expect(backend?.oversizeRate).toBeCloseTo(0.5, 2);
    expect(backend?.reopenCount).toBe(1);
    expect(backend?.efficiencyPercent).toBeGreaterThan(50);

    expect(frontend?.ticketCount).toBe(1);
    expect(frontend?.leadTimeMedianHours).toBeCloseTo(24, 1);
    expect(frontend?.efficiencyPercent).toBeLessThan(50);
    expect(frontend?.oversizeRate).toBe(0);
  });
});
