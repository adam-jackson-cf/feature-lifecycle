import type { DisciplineEffortMetric, JiraTicket, NormalizedEvent } from '@/lib/types';
import { average, groupBy, median } from '@/lib/utils';

const HOURS_IN_MS = 1000 * 60 * 60;

const isActiveStatus = (status?: string): boolean =>
  Boolean(status?.toLowerCase().includes('progress'));

const toHours = (ms: number): number => Math.max(0, ms) / HOURS_IN_MS;

interface TicketWindow {
  leadMs?: number;
  cycleMs?: number;
  activeMs: number;
  queueMs: number;
  reopens: number;
  oversize: boolean;
}

const computeTicketWindow = (ticket: JiraTicket, events: NormalizedEvent[]): TicketWindow => {
  const ticketEvents = [...events].sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());

  const createdAt =
    ticketEvents.find((e) => e.eventType === 'ticket_created')?.occurredAt || ticket.createdAt;
  const resolvedAt =
    ticketEvents.find((e) => e.eventType === 'resolved')?.occurredAt || ticket.resolvedAt;

  let leadMs: number | undefined;
  if (createdAt && resolvedAt) {
    leadMs = resolvedAt.getTime() - createdAt.getTime();
  }

  const firstActive = ticketEvents.find(
    (e) => e.eventType === 'status_changed' && isActiveStatus(e.details?.toStatus as string)
  )?.occurredAt;

  const doneEvent = ticketEvents.find(
    (e) =>
      e.eventType === 'status_changed' &&
      (e.details?.toStatus as string | undefined)?.toLowerCase().includes('done')
  )?.occurredAt;

  let cycleMs: number | undefined;
  if (firstActive && (resolvedAt || doneEvent)) {
    const end = resolvedAt ?? doneEvent;
    if (end) {
      cycleMs = end.getTime() - firstActive.getTime();
    }
  }

  let activeMs = 0;
  let queueMs = 0;
  let currentStatus: string | undefined;
  let lastTime = createdAt || ticketEvents[0]?.occurredAt;

  for (const event of ticketEvents) {
    if (event.eventType !== 'status_changed') continue;
    if (lastTime) {
      const delta = event.occurredAt.getTime() - lastTime.getTime();
      if (isActiveStatus(currentStatus)) {
        activeMs += delta;
      } else {
        queueMs += delta;
      }
    }
    currentStatus = (event.details?.toStatus as string | undefined) || currentStatus;
    lastTime = event.occurredAt;
  }

  if (lastTime && resolvedAt) {
    const delta = resolvedAt.getTime() - lastTime.getTime();
    if (isActiveStatus(currentStatus)) {
      activeMs += delta;
    } else {
      queueMs += delta;
    }
  }

  let reopens = 0;
  let seenDone = false;
  for (const event of ticketEvents) {
    if (event.eventType !== 'status_changed') continue;
    const toStatus = (event.details?.toStatus as string | undefined) || '';
    if (toStatus.toLowerCase().includes('done')) {
      seenDone = true;
      continue;
    }
    if (
      seenDone &&
      (toStatus.toLowerCase().includes('progress') || toStatus.toLowerCase().includes('to do'))
    ) {
      reopens += 1;
      seenDone = false;
    }
  }

  return {
    leadMs,
    cycleMs,
    activeMs,
    queueMs,
    reopens,
    oversize: Boolean(ticket.oversizeFlag),
  };
};

export const calculateEffortByDiscipline = (
  tickets: JiraTicket[],
  events: NormalizedEvent[]
): DisciplineEffortMetric[] => {
  const ticketsByDiscipline = groupBy(tickets, (ticket) => ticket.discipline || 'unknown');
  const results: DisciplineEffortMetric[] = [];

  for (const [discipline, disciplineTickets] of ticketsByDiscipline.entries()) {
    const ticketWindows: TicketWindow[] = disciplineTickets.map((ticket) =>
      computeTicketWindow(
        ticket,
        events.filter((e) => e.ticketKey === ticket.jiraKey)
      )
    );

    const leadHours = ticketWindows
      .map((t) => (t.leadMs === undefined ? undefined : toHours(t.leadMs)))
      .filter((v): v is number => v !== undefined);
    const cycleHours = ticketWindows
      .map((t) => (t.cycleMs === undefined ? undefined : toHours(t.cycleMs)))
      .filter((v): v is number => v !== undefined);

    const activeHours = ticketWindows.map((t) => toHours(t.activeMs));
    const queueHours = ticketWindows.map((t) => toHours(t.queueMs));

    const totalActive = average(activeHours) * disciplineTickets.length;
    const totalQueue = average(queueHours) * disciplineTickets.length;

    const efficiencyPercent =
      totalActive + totalQueue > 0 ? (totalActive / (totalActive + totalQueue)) * 100 : 0;

    const oversizeCount = ticketWindows.filter((t) => t.oversize).length;
    const reopenCount = ticketWindows.reduce((sum, t) => sum + t.reopens, 0);

    results.push({
      discipline,
      ticketCount: disciplineTickets.length,
      leadTimeMedianHours: Math.round(median(leadHours) * 100) / 100,
      cycleTimeMedianHours: Math.round(median(cycleHours) * 100) / 100,
      activeHours: Math.round(totalActive * 100) / 100,
      queueHours: Math.round(totalQueue * 100) / 100,
      efficiencyPercent: Math.round(efficiencyPercent * 100) / 100,
      oversizeRate: disciplineTickets.length > 0 ? oversizeCount / disciplineTickets.length : 0,
      reopenCount,
    });
  }

  return results.sort((a, b) => a.discipline.localeCompare(b.discipline));
};
