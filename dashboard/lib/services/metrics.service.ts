import type { JiraTicketRepository } from '@/lib/repositories/jira-ticket.repository';
import type { LifecycleEventRepository } from '@/lib/repositories/lifecycle-event.repository';
import type { LifecycleEvent, MetricsSummary } from '@/lib/types';
import { calculateTimeDiff } from '@/lib/utils';

export class MetricsService {
  constructor(
    private jiraTicketRepo: JiraTicketRepository,
    private lifecycleEventRepo: LifecycleEventRepository
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
    const completedTickets = tickets.filter((t) => t.statusCategory === 'Done' && t.storyPoints);

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

    const completedTickets = tickets.filter((t) => t.statusCategory === 'Done');
    const avgMetrics = this.jiraTicketRepo.getAverageMetrics(caseStudyId);

    const commitEvents = events.filter(
      (e) => e.eventSource === 'github' && e.eventType === 'commit_created'
    );
    const prEvents = events.filter(
      (e) =>
        e.eventSource === 'github' && (e.eventType === 'pr_opened' || e.eventType === 'pr_merged')
    );

    const velocityPoints = completedTickets.reduce(
      (sum, ticket) => sum + (ticket.storyPoints || 0),
      0
    );

    return {
      totalTickets: tickets.length,
      completedTickets: completedTickets.length,
      avgCycleTime: avgMetrics.avgCycleTime || 0,
      avgLeadTime: avgMetrics.avgLeadTime || 0,
      totalCommits: commitEvents.length,
      totalPRs: prEvents.length,
      velocityPoints,
    };
  }

  /**
   * Get time-in-status rollups for a case study
   */
  async getTimeInStatus(caseStudyId: string): Promise<Map<string, number>> {
    // For now, return status distribution as a proxy for time-in-status
    // Full time-in-status calculation would require event-level analysis
    return this.jiraTicketRepo.countByStatus(caseStudyId);
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
      const statusEvents = ticketEvents.filter(
        (e) => e.eventType === 'status_changed' && e.eventSource === 'jira'
      );

      // Calculate time in "In Progress" vs "To Do" / "Done"
      for (let i = 0; i < statusEvents.length - 1; i++) {
        const currentEvent = statusEvents[i];
        const nextEvent = statusEvents[i + 1];
        const timeDiff = calculateTimeDiff(currentEvent.eventDate, nextEvent.eventDate);

        const toStatus = currentEvent.details.toStatus || '';
        if (
          toStatus.toLowerCase().includes('progress') ||
          toStatus.toLowerCase() === 'in progress'
        ) {
          totalActiveTime += timeDiff;
        } else {
          totalQueueTime += timeDiff;
        }
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
    bySize: Map<string, number>;
    byDiscipline: Map<string, number>;
    oversize: number;
  }> {
    const tickets = this.jiraTicketRepo.findByCaseStudy(caseStudyId);

    const bySize = new Map<string, number>();
    const byDiscipline = new Map<string, number>();
    let oversize = 0;

    for (const ticket of tickets) {
      // Group by complexity size (if available)
      const size = (ticket as unknown as { complexitySize?: string }).complexitySize || 'unknown';
      bySize.set(size, (bySize.get(size) || 0) + 1);

      // Group by discipline (if available)
      const discipline = (ticket as unknown as { discipline?: string }).discipline || 'unknown';
      byDiscipline.set(discipline, (byDiscipline.get(discipline) || 0) + 1);

      // Count oversize tickets (if available)
      const isOversize = (ticket as unknown as { oversizeFlag?: boolean }).oversizeFlag || false;
      if (isOversize) {
        oversize++;
      }
    }

    return {
      bySize,
      byDiscipline,
      oversize,
    };
  }
}
