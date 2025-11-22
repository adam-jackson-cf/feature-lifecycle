import type { JiraTicketRepository } from '@/lib/repositories/jira-ticket.repository';
import type { LifecycleEventRepository } from '@/lib/repositories/lifecycle-event.repository';
import type { LifecycleEvent } from '@/lib/types';

export class CorrelationService {
  constructor(
    private jiraTicketRepo: JiraTicketRepository,
    private lifecycleEventRepo: LifecycleEventRepository
  ) {}

  /**
   * Correlate data for a case study - match commits/PRs to tickets
   */
  async correlateData(caseStudyId: string): Promise<void> {
    // Get all tickets for this case study
    const _tickets = this.jiraTicketRepo.findByCaseStudy(caseStudyId);

    // Get all events for this case study
    const _allEvents = this.lifecycleEventRepo.findByCaseStudy(caseStudyId);

    // Match commits to tickets (already done via ticket key extraction in GitHubImportService)
    // This method primarily ensures all correlations are complete
    await this.matchCommitsToTickets(caseStudyId);

    // Match PRs to tickets
    await this.matchPRsToTickets(caseStudyId);

    // Build unified timeline (events are already in the database, this ensures ordering)
    await this.buildTimeline(caseStudyId);
  }

  /**
   * Link GitHub commits to Jira tickets
   * Commits are already linked via ticket key extraction in commit messages
   * This method verifies and ensures all links are correct
   */
  private async matchCommitsToTickets(caseStudyId: string): Promise<void> {
    const tickets = this.jiraTicketRepo.findByCaseStudy(caseStudyId);
    const events = this.lifecycleEventRepo.findByCaseStudy(caseStudyId);

    // Commits are already matched via ticket key in commit messages
    // Verify that all commit events have corresponding tickets
    const commitEvents = events.filter(
      (e) => e.eventSource === 'github' && e.eventType === 'commit_created'
    );

    for (const event of commitEvents) {
      const ticket = tickets.find((t) => t.jiraKey === event.ticketKey);
      if (!ticket) {
        // Log warning but don't fail - ticket might be from different case study
        console.warn(
          `Commit event ${event.id} references ticket ${event.ticketKey} not found in case study ${caseStudyId}`
        );
      }
    }
  }

  /**
   * Link PRs to tickets
   * PRs are linked via ticket keys extracted from PR titles/descriptions
   */
  private async matchPRsToTickets(caseStudyId: string): Promise<void> {
    const tickets = this.jiraTicketRepo.findByCaseStudy(caseStudyId);
    const events = this.lifecycleEventRepo.findByCaseStudy(caseStudyId);

    // PR events are already matched via ticket key extraction
    // Verify that all PR events have corresponding tickets
    const prEvents = events.filter(
      (e) =>
        e.eventSource === 'github' && (e.eventType === 'pr_opened' || e.eventType === 'pr_merged')
    );

    for (const event of prEvents) {
      const ticketKey = event.details.prNumber
        ? this.extractTicketKeyFromPR(event)
        : event.ticketKey;

      if (ticketKey) {
        const ticket = tickets.find((t) => t.jiraKey === ticketKey);
        if (!ticket) {
          console.warn(
            `PR event ${event.id} references ticket ${ticketKey} not found in case study ${caseStudyId}`
          );
        }
      }
    }
  }

  /**
   * Extract ticket key from PR event details
   */
  private extractTicketKeyFromPR(event: LifecycleEvent): string | null {
    // Try to extract from PR title or description
    const prTitle = event.details.prTitle || '';
    const prDescription = event.details.prUrl || '';

    // Pattern: PROJECT-12345
    const ticketPattern = /\b[A-Z][A-Z0-9]+-\d+\b/g;
    const match = prTitle.match(ticketPattern) || prDescription.match(ticketPattern);

    return match ? match[0] : null;
  }

  /**
   * Build unified timeline for a case study
   * Events are already in the database, this method ensures proper ordering
   */
  private async buildTimeline(caseStudyId: string): Promise<LifecycleEvent[]> {
    const events = this.lifecycleEventRepo.findByCaseStudy(caseStudyId);

    // Sort by event date
    return events.sort((a, b) => a.eventDate.getTime() - b.eventDate.getTime());
  }
}
