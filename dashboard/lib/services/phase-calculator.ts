import type {
  JiraTicket,
  LifecyclePhase,
  NormalizedEvent,
  PhaseDistribution,
  PhaseEffortMetric,
} from '@/lib/types';
import { LIFECYCLE_PHASE_COLORS, LIFECYCLE_PHASE_LABELS } from '@/lib/types';
import { groupBy } from '@/lib/utils';
import type { PhaseService } from './phase.service';

const HOURS_IN_MS = 1000 * 60 * 60;

const toHours = (ms: number): number => Math.max(0, ms) / HOURS_IN_MS;

interface TicketPhaseData {
  phase: LifecyclePhase;
  hours: number;
  ticketKey: string;
}

/**
 * Compute hours for a ticket based on lead time or events
 */
const computeTicketHours = (ticket: JiraTicket, events: NormalizedEvent[]): number => {
  // Use lead time if available
  if (ticket.leadTime) {
    return toHours(ticket.leadTime);
  }

  // Fall back to calculating from events
  const ticketEvents = [...events].sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());

  const createdAt =
    ticketEvents.find((e) => e.eventType === 'ticket_created')?.occurredAt || ticket.createdAt;
  const resolvedAt =
    ticketEvents.find((e) => e.eventType === 'resolved')?.occurredAt || ticket.resolvedAt;

  if (createdAt && resolvedAt) {
    return toHours(resolvedAt.getTime() - createdAt.getTime());
  }

  // If no resolution, use time from creation to now or last event
  if (createdAt) {
    const lastEvent = ticketEvents[ticketEvents.length - 1];
    const endTime = lastEvent?.occurredAt || new Date();
    return toHours(endTime.getTime() - createdAt.getTime());
  }

  return 0;
};

/**
 * Calculate phase distribution for a set of tickets
 */
export const calculatePhaseDistribution = (
  tickets: JiraTicket[],
  events: NormalizedEvent[],
  phaseService: PhaseService
): PhaseDistribution => {
  // Filter out excluded tickets
  const includedTickets = tickets.filter((t) => !phaseService.isExcludedFromMetrics(t));

  // Group events by ticket for efficient lookup
  const eventsByTicket = groupBy(events, (e) => e.ticketKey);

  // Compute phase and hours for each ticket
  const ticketPhaseData: TicketPhaseData[] = includedTickets.map((ticket) => ({
    phase: phaseService.derivePhase(ticket),
    hours: computeTicketHours(ticket, eventsByTicket.get(ticket.jiraKey) || []),
    ticketKey: ticket.jiraKey,
  }));

  // Group by phase
  const byPhase = groupBy(ticketPhaseData, (t) => t.phase);

  // Calculate totals
  const totalHours = ticketPhaseData.reduce((sum, t) => sum + t.hours, 0);

  // Build phase metrics in a consistent order
  const phaseOrder: LifecyclePhase[] = [
    'discovery',
    'definition',
    'design',
    'development',
    'testing',
    'deployment',
    'measure',
    'unknown',
  ];

  const phases: PhaseEffortMetric[] = [];

  for (const phase of phaseOrder) {
    const phaseTickets = byPhase.get(phase) || [];
    if (phaseTickets.length === 0) continue;

    const phaseHours = phaseTickets.reduce((sum, t) => sum + t.hours, 0);

    phases.push({
      phase,
      label: LIFECYCLE_PHASE_LABELS[phase],
      ticketCount: phaseTickets.length,
      totalHours: Math.round(phaseHours * 100) / 100,
      percentage: totalHours > 0 ? Math.round((phaseHours / totalHours) * 10000) / 100 : 0,
      color: LIFECYCLE_PHASE_COLORS[phase],
    });
  }

  // Sort by percentage descending for display
  phases.sort((a, b) => b.percentage - a.percentage);

  return {
    phases,
    totalHours: Math.round(totalHours * 100) / 100,
    totalTickets: includedTickets.length,
  };
};

/**
 * Calculate aggregate phase distribution across multiple case studies
 * This is useful for showing project-wide distribution
 */
export const calculateAggregatePhaseDistribution = (
  allTickets: JiraTicket[],
  allEvents: NormalizedEvent[],
  phaseService: PhaseService
): PhaseDistribution => {
  return calculatePhaseDistribution(allTickets, allEvents, phaseService);
};

/**
 * Get phase breakdown summary (for quick display)
 */
export const getPhaseBreakdownSummary = (
  distribution: PhaseDistribution
): { topPhase: string; topPercentage: number } => {
  if (distribution.phases.length === 0) {
    return { topPhase: 'N/A', topPercentage: 0 };
  }

  const topPhase = distribution.phases[0];
  return {
    topPhase: topPhase.label,
    topPercentage: topPhase.percentage,
  };
};
