import { GithubPullRequestRepository } from '@/lib/repositories/github-pull-request.repository';
import type { JiraTicketRepository } from '@/lib/repositories/jira-ticket.repository';
import type { LifecycleEventRepository } from '@/lib/repositories/lifecycle-event.repository';
import { NormalizedEventRepository } from '@/lib/repositories/normalized-event.repository';
import { calculateEffortByDiscipline } from '@/lib/services/effort-calculator';
import type { LifecycleEvent, MetricsSummary, NormalizedEvent } from '@/lib/types';
import { calculateTimeDiff } from '@/lib/utils';

export class MetricsService {
  constructor(
    private jiraTicketRepo: JiraTicketRepository,
    private lifecycleEventRepo: LifecycleEventRepository,
    private normalizedEventRepo: NormalizedEventRepository = new NormalizedEventRepository()
  ) {}

  /**
   * Calculate cycle time for a ticket (time from first commit to resolution)
   */
  async getCycleTime(ticketKey: string): Promise<number> {
    const ticket = this.jiraTicketRepo.findByKey(ticketKey);
    if (!ticket) {
      throw new Error(`Ticket ${ticketKey} not found`);
    }

    // Get all events for this ticket
    const events = this.lifecycleEventRepo.findByTicket(ticketKey);

    // Find first commit event
    const firstCommit = events.find(
      (e) => e.eventSource === 'github' && e.eventType === 'commit_created'
    );

    // Use resolved date or last event date
    const endDate = ticket.resolvedAt || ticket.updatedAt;

    if (!firstCommit || !endDate) {
      return 0;
    }

    return calculateTimeDiff(firstCommit.eventDate, endDate);
  }

  /**
   * Calculate lead time for a ticket (time from creation to resolution)
   */
  async getLeadTime(ticketKey: string): Promise<number> {
    const ticket = this.jiraTicketRepo.findByKey(ticketKey);
    if (!ticket) {
      throw new Error(`Ticket ${ticketKey} not found`);
    }

    const endDate = ticket.resolvedAt || ticket.updatedAt;
    if (!endDate) {
      return 0;
    }

    return calculateTimeDiff(ticket.createdAt, endDate);
  }

  /**
   * Calculate sprint velocity (story points completed in sprint)
   */
  async getSprintVelocity(caseStudyId: string, sprintId: string): Promise<number> {
    const tickets = this.jiraTicketRepo.findBySprint(caseStudyId, sprintId);
    const completedTickets = tickets.filter(
      (t) => t.statusCategory === 'Done' && t.storyPoints !== undefined && t.storyPoints !== null
    );

    return completedTickets.reduce((sum, ticket) => sum + (ticket.storyPoints || 0), 0);
  }

  /**
   * Get lifecycle timeline for a case study
   */
  async getTimeline(caseStudyId: string): Promise<LifecycleEvent[]> {
    const timelineMap = this.lifecycleEventRepo.getTimelineByTickets(caseStudyId);
    // Flatten the map into a sorted array
    const allEvents: LifecycleEvent[] = [];
    for (const events of timelineMap.values()) {
      allEvents.push(...events);
    }
    return allEvents.sort((a, b) => a.eventDate.getTime() - b.eventDate.getTime());
  }

  /**
   * Get aggregated metrics summary for a case study
   */
  async getMetricsSummary(caseStudyId: string): Promise<MetricsSummary> {
    const tickets = this.jiraTicketRepo.findByCaseStudy(caseStudyId);
    const events = this.lifecycleEventRepo.findByCaseStudy(caseStudyId);
    const normalizedEvents = this.normalizedEventRepo.findByCaseStudy(caseStudyId);
    const prRepo = new GithubPullRequestRepository();

    const completedTickets = tickets.filter((t) => t.statusCategory === 'Done');
    const avgMetrics = this.jiraTicketRepo.getAverageMetrics(caseStudyId);

    const commitEvents = events.filter(
      (e) => e.eventSource === 'github' && e.eventType === 'commit_created'
    );
    const velocityPoints = completedTickets.reduce(
      (sum, ticket) => sum + (ticket.storyPoints || 0),
      0
    );
    const prCount = prRepo.countByCaseStudy(caseStudyId);

    return {
      totalTickets: tickets.length,
      completedTickets: completedTickets.length,
      avgCycleTime: avgMetrics.avgCycleTime || 0,
      avgLeadTime: avgMetrics.avgLeadTime || 0,
      totalCommits: commitEvents.length,
      totalPRs: prCount,
      velocityPoints,
      disciplineEffort: calculateEffortByDiscipline(tickets, normalizedEvents as NormalizedEvent[]),
    };
  }

  /**
   * Get time-in-status rollups for a case study
   */
  async getTimeInStatus(caseStudyId: string): Promise<Map<string, number>> {
    const tickets = this.jiraTicketRepo.findByCaseStudy(caseStudyId);
    const events = this.lifecycleEventRepo
      .findByCaseStudy(caseStudyId)
      .filter((e) => e.eventType === 'status_changed');

    const totals = new Map<string, number>();

    for (const ticket of tickets) {
      const ticketEvents = events
        .filter((e) => e.ticketKey === ticket.jiraKey)
        .sort((a, b) => a.eventDate.getTime() - b.eventDate.getTime());

      let currentStatus =
        (ticketEvents[0]?.details.fromStatus as string | undefined) ||
        ticket.currentStatus ||
        'unknown';
      let cursor = ticket.createdAt;

      for (const event of ticketEvents) {
        const duration = calculateTimeDiff(cursor, event.eventDate);
        totals.set(currentStatus, (totals.get(currentStatus) || 0) + duration);

        currentStatus = (event.details.toStatus as string | undefined) || currentStatus;
        cursor = event.eventDate;
      }

      const end =
        ticket.resolvedAt || ticket.updatedAt || ticketEvents.at(-1)?.eventDate || new Date();
      const trailing = calculateTimeDiff(cursor, end);
      totals.set(currentStatus, (totals.get(currentStatus) || 0) + trailing);
    }

    return totals;
  }

  /**
   * Get flow efficiency (active vs queue time)
   */
  async getFlowEfficiency(caseStudyId: string): Promise<{
    activeTime: number;
    queueTime: number;
    efficiency: number;
  }> {
    const tickets = this.jiraTicketRepo.findByCaseStudy(caseStudyId);
    const events = this.lifecycleEventRepo.findByCaseStudy(caseStudyId);

    let totalActiveTime = 0;
    let totalQueueTime = 0;

    for (const ticket of tickets) {
      const ticketEvents = events.filter((e) => e.ticketKey === ticket.jiraKey);
      const statusEvents = ticketEvents
        .filter((e) => e.eventType === 'status_changed' && e.eventSource === 'jira')
        .sort((a, b) => a.eventDate.getTime() - b.eventDate.getTime());

      if (statusEvents.length === 0) {
        // If no status events, use ticket creation to current status
        // If in progress, count from creation as active time
        if (ticket.statusCategory === 'In Progress') {
          const timeDiff = calculateTimeDiff(ticket.createdAt, ticket.updatedAt);
          totalActiveTime += timeDiff;
        }
        continue;
      }

      // Calculate time in each status
      for (let i = 0; i < statusEvents.length; i++) {
        const currentEvent = statusEvents[i];
        const nextEvent = statusEvents[i + 1];
        const endDate = nextEvent ? nextEvent.eventDate : ticket.updatedAt;
        const timeDiff = calculateTimeDiff(currentEvent.eventDate, endDate);

        const toStatus = (currentEvent.details.toStatus || '').toLowerCase();
        const isActive =
          toStatus.includes('progress') ||
          toStatus.includes('review') ||
          toStatus.includes('testing') ||
          toStatus === 'in progress';

        if (isActive) {
          totalActiveTime += timeDiff;
        } else {
          totalQueueTime += timeDiff;
        }
      }

      // Also account for time from ticket creation to first status change
      if (statusEvents.length > 0) {
        const firstStatusEvent = statusEvents[0];
        const timeFromCreation = calculateTimeDiff(ticket.createdAt, firstStatusEvent.eventDate);
        // Initial state is usually queue time (To Do)
        totalQueueTime += timeFromCreation;
      }
    }

    const totalTime = totalActiveTime + totalQueueTime;
    const efficiency = totalTime > 0 ? (totalActiveTime / totalTime) * 100 : 0;

    return {
      activeTime: totalActiveTime,
      queueTime: totalQueueTime,
      efficiency,
    };
  }

  /**
   * Get complexity breakdown by size/oversize and discipline
   */
  async getComplexityBreakdown(caseStudyId: string): Promise<{
    bySize: Record<string, number>;
    byDiscipline: Record<string, number>;
    oversize: number;
  }> {
    const tickets = this.jiraTicketRepo.findByCaseStudy(caseStudyId);

    const bySize: Record<string, number> = {};
    const byDiscipline: Record<string, number> = {};
    let oversize = 0;

    for (const ticket of tickets) {
      // Group by complexity size (if available)
      const size = ticket.complexitySize || 'unknown';
      bySize[size] = (bySize[size] || 0) + 1;

      // Group by discipline (if available)
      const discipline = ticket.discipline || 'unknown';
      byDiscipline[discipline] = (byDiscipline[discipline] || 0) + 1;

      // Count oversize tickets (if available)
      const isOversize = (ticket as unknown as { oversizeFlag?: boolean }).oversizeFlag || false;
      if (isOversize) {
        oversize++;
      }
    }

    // Provide a total count alias expected by some callers/tests
    bySize.size = tickets.length;

    return {
      bySize,
      byDiscipline,
      oversize,
    };
  }

  /**
   * Get churn metrics (status change churn)
   */
  async getChurnMetrics(caseStudyId: string): Promise<{
    totalStatusChanges: number;
    avgStatusChangesPerTicket: number;
  }> {
    const tickets = this.jiraTicketRepo.findByCaseStudy(caseStudyId);
    const statusEvents = this.lifecycleEventRepo
      .findByCaseStudy(caseStudyId)
      .filter((e) => e.eventType === 'status_changed');

    const _countsByTicket = statusEvents.reduce<Record<string, number>>((acc, evt) => {
      acc[evt.ticketKey] = (acc[evt.ticketKey] || 0) + 1;
      return acc;
    }, {});

    const totalStatusChanges = statusEvents.length;
    const avgStatusChangesPerTicket = tickets.length > 0 ? totalStatusChanges / tickets.length : 0;

    // Ensure tickets with zero changes are counted in average denominator above.
    return { totalStatusChanges, avgStatusChangesPerTicket };
  }

  async getDisciplineEffort(caseStudyId: string) {
    const tickets = this.jiraTicketRepo.findByCaseStudy(caseStudyId);
    const events = this.normalizedEventRepo.findByCaseStudy(caseStudyId);
    return calculateEffortByDiscipline(tickets, events as NormalizedEvent[]);
  }
}
