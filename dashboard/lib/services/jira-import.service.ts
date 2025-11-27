import { Buffer } from 'node:buffer';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { CaseStudyRepository } from '@/lib/repositories/case-study.repository';
import type { JiraTicketRepository } from '@/lib/repositories/jira-ticket.repository';
import type { LifecycleEventRepository } from '@/lib/repositories/lifecycle-event.repository';
import { NormalizedEventRepository } from '@/lib/repositories/normalized-event.repository';
import { type ComplexityConfig, ComplexityService } from '@/lib/services/complexity.service';
import { type DisciplineRulesConfig, DisciplineService } from '@/lib/services/discipline.service';
import type {
  EventType,
  JiraIssueFields,
  JiraIssueLite,
  JiraTicket,
  LifecycleEvent,
  NormalizedEvent,
} from '@/lib/types';
import { EventType as EventTypeEnum } from '@/lib/types';
import { calculateTimeDiff, extractTicketIds } from '@/lib/utils';
import type { JiraChangelogHistory, JiraIssue } from '@/tests/fixtures/jira/mock-issues';

export class JiraImportService {
  private complexityService = new ComplexityService();
  private disciplineService = new DisciplineService();
  private complexityConfig: ComplexityConfig | null = null;
  private disciplineConfig: DisciplineRulesConfig | null = null;

  constructor(
    private jiraTicketRepo: JiraTicketRepository,
    private lifecycleEventRepo: LifecycleEventRepository,
    private caseStudyRepo: CaseStudyRepository,
    private normalizedEventRepo: NormalizedEventRepository = new NormalizedEventRepository()
  ) {}

  /**
   * Fetch Jira issues for a project using Jira REST API (requires env vars)
   */
  async fetchProjectIssues(projectKey: string, maxResults = 200): Promise<JiraIssue[]> {
    const host = process.env.JIRA_HOST || 'https://issues.apache.org/jira';
    const email = process.env.JIRA_EMAIL;
    const token = process.env.JIRA_API_TOKEN;

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (email && token) {
      const auth = Buffer.from(`${email}:${token}`).toString('base64');
      headers.Authorization = `Basic ${auth}`;
    }

    const url = `${host}/rest/api/2/search?jql=project=${projectKey}&maxResults=${maxResults}`;
    const resp = await fetch(url, { headers });
    if (!resp.ok) {
      throw new Error(`Jira fetch failed: ${resp.status} ${resp.statusText}`);
    }
    const json = (await resp.json()) as { issues: JiraIssue[] };
    return json.issues || [];
  }

  /**
   * Fetch changelog for a Jira issue to get status change history
   */
  async fetchIssueChangelog(issueKey: string): Promise<JiraChangelogHistory[]> {
    if (process.env.NODE_ENV === 'test') {
      return [];
    }

    const host = process.env.JIRA_HOST || 'https://issues.apache.org/jira';
    const email = process.env.JIRA_EMAIL;
    const token = process.env.JIRA_API_TOKEN;

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (email && token) {
      const auth = Buffer.from(`${email}:${token}`).toString('base64');
      headers.Authorization = `Basic ${auth}`;
    }

    const url = `${host}/rest/api/2/issue/${issueKey}?expand=changelog`;
    const resp = await fetch(url, { headers });
    if (!resp.ok) {
      console.warn(`Failed to fetch changelog for ${issueKey}: ${resp.status}`);
      return [];
    }
    const json = (await resp.json()) as { changelog?: { histories: JiraChangelogHistory[] } };
    return json.changelog?.histories || [];
  }

  /**
   * Import Jira issues for a case study
   */
  async importIssues(caseStudyId: string, issues: JiraIssue[]): Promise<void> {
    // Update case study status to importing
    this.caseStudyRepo.update(caseStudyId, { status: 'importing' });

    try {
      const tickets: Omit<JiraTicket, 'id'>[] = [];
      const events: Omit<LifecycleEvent, 'id' | 'createdAt'>[] = [];

      for (const issue of issues) {
        const lite: JiraIssueLite = {
          id: issue.id,
          key: issue.key,
          fields: issue.fields as unknown as JiraIssueFields,
        };
        const discipline = this.getDiscipline(lite);
        const aiFlag = this.detectAIFlag(lite);
        const complexity = this.complexityService.calculateRCS(lite, this.getComplexityConfig());

        // Convert Jira issue to our ticket format
        const ticket = this.convertIssueToTicket(issue, caseStudyId, {
          discipline,
          aiFlag,
          complexityScore: complexity.score ?? 0,
          complexitySize: complexity.size ?? 'XS',
          complexityFactors: complexity.factors,
          oversizeFlag: complexity.oversize,
        });
        tickets.push(ticket);

        // Create ticket creation event
        events.push({
          caseStudyId,
          ticketKey: issue.key,
          eventType: EventTypeEnum.TICKET_CREATED,
          eventSource: 'jira',
          eventDate: new Date(issue.fields.created),
          actorName: issue.fields.reporter.displayName,
          actorId: issue.fields.reporter.accountId,
          discipline,
          complexitySize: complexity.size,
          details: {
            metadata: {
              summary: issue.fields.summary,
              issueType: issue.fields.issuetype.name,
              priority: issue.fields.priority.name,
            },
          },
        });

        // Add resolved event if ticket is resolved
        if (issue.fields.resolutiondate) {
          events.push({
            caseStudyId,
            ticketKey: issue.key,
            eventType: EventTypeEnum.RESOLVED,
            eventSource: 'jira',
            eventDate: new Date(issue.fields.resolutiondate),
            actorName: issue.fields.assignee?.displayName || 'Unknown',
            actorId: issue.fields.assignee?.accountId,
            discipline,
            complexitySize: complexity.size,
            details: {},
          });
        }
      }

      // Batch insert tickets and events
      this.jiraTicketRepo.createMany(tickets);
      this.lifecycleEventRepo.createMany(events);
      this.normalizedEventRepo.createMany(events.map((event) => this.toNormalizedEvent(event)));
      this.normalizedEventRepo.createMany(events.map((event) => this.toNormalizedEvent(event)));

      // Fetch and import changelogs for status change events
      for (const issue of issues) {
        try {
          const changelogHistories = await this.fetchIssueChangelog(issue.key);
          if (changelogHistories.length > 0) {
            await this.importChangelogs(caseStudyId, issue.key, changelogHistories);
          }
        } catch (error) {
          console.warn(`Failed to import changelog for ${issue.key}:`, error);
        }
      }

      // Calculate metrics (cycle time, lead time) after all data is imported
      await this.calculateMetrics(caseStudyId);

      // Calculate date range
      const dates = issues.map((i) => new Date(i.fields.created).getTime());
      const startDate = new Date(Math.min(...dates));
      const endDate = new Date(Math.max(...dates));

      // Get final event count after changelog import
      const finalEventCount = this.lifecycleEventRepo.findByCaseStudy(caseStudyId).length;

      // Update case study
      this.caseStudyRepo.update(caseStudyId, {
        status: 'completed',
        ticketCount: issues.length,
        eventCount: finalEventCount,
        startDate,
        endDate,
      });
    } catch (error) {
      // Update case study with error
      this.caseStudyRepo.update(caseStudyId, {
        status: 'error',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Import changelog for issues to create lifecycle events
   */
  async importChangelogs(
    caseStudyId: string,
    issueKey: string,
    histories: JiraChangelogHistory[]
  ): Promise<void> {
    const events: Omit<LifecycleEvent, 'id' | 'createdAt'>[] = [];

    for (const history of histories) {
      for (const item of history.items) {
        let eventType: EventType | null = null;
        const details: LifecycleEvent['details'] = {};

        if (item.field === 'status') {
          eventType = EventTypeEnum.STATUS_CHANGED;
          details.fromStatus = item.fromString || undefined;
          details.toStatus = item.toString || undefined;
        } else if (item.field === 'assignee') {
          eventType = EventTypeEnum.ASSIGNEE_CHANGED;
        }

        if (eventType) {
          events.push({
            caseStudyId,
            ticketKey: issueKey,
            eventType,
            eventSource: 'jira',
            eventDate: new Date(history.created),
            actorName: 'Jira User', // Would come from history author in real API
            details,
          });
        }
      }
    }

    if (events.length > 0) {
      this.lifecycleEventRepo.createMany(events);
      this.normalizedEventRepo.createMany(events.map((event) => this.toNormalizedEvent(event)));
      this.normalizedEventRepo.createMany(events.map((event) => this.toNormalizedEvent(event)));

      // Update event count in case study
      const caseStudy = this.caseStudyRepo.findById(caseStudyId);
      if (caseStudy) {
        this.caseStudyRepo.update(caseStudyId, {
          eventCount: caseStudy.eventCount + events.length,
        });
      }
    }
  }

  /**
   * Calculate metrics for tickets
   */
  async calculateMetrics(caseStudyId: string): Promise<void> {
    const tickets = this.jiraTicketRepo.findByCaseStudy(caseStudyId);

    for (const ticket of tickets) {
      const events = this.lifecycleEventRepo.findByTicket(ticket.jiraKey);

      // Calculate lead time (created to resolved or updated)
      const endDate = ticket.resolvedAt || ticket.updatedAt;
      if (endDate) {
        const leadTime = calculateTimeDiff(ticket.createdAt, endDate);
        ticket.leadTime = leadTime;
      }

      // Calculate cycle time (first commit to resolution, or in progress to done)
      // Try method 1: First commit to resolution (if resolved)
      if (ticket.resolvedAt) {
        const firstCommit = events.find(
          (e) => e.eventSource === 'github' && e.eventType === EventTypeEnum.COMMIT_CREATED
        );
        if (firstCommit) {
          const cycleTime = calculateTimeDiff(firstCommit.eventDate, ticket.resolvedAt);
          ticket.cycleTime = cycleTime;
        }
      }

      // Try method 2: Status change from In Progress to Done
      if (!ticket.cycleTime) {
        const inProgressEvent = events.find(
          (e) =>
            e.eventType === EventTypeEnum.STATUS_CHANGED &&
            (e.details.toStatus?.toLowerCase().includes('progress') ||
              e.details.toStatus === 'In Progress')
        );
        const doneEvent = events.find(
          (e) =>
            e.eventType === EventTypeEnum.STATUS_CHANGED &&
            (e.details.toStatus?.toLowerCase().includes('done') || e.details.toStatus === 'Done')
        );

        if (inProgressEvent && doneEvent) {
          const cycleTime = calculateTimeDiff(inProgressEvent.eventDate, doneEvent.eventDate);
          ticket.cycleTime = cycleTime;
        } else if (inProgressEvent && ticket.updatedAt) {
          // If in progress but not done, calculate from in progress to now
          const cycleTime = calculateTimeDiff(inProgressEvent.eventDate, ticket.updatedAt);
          ticket.cycleTime = cycleTime;
        }
      }

      // Update ticket with metrics
      this.jiraTicketRepo.update(ticket.id, {
        leadTime: ticket.leadTime,
        cycleTime: ticket.cycleTime,
      });
    }
  }

  private convertIssueToTicket(
    issue: JiraIssue,
    caseStudyId: string,
    extras: Partial<JiraTicket>
  ): Omit<JiraTicket, 'id'> {
    // Determine status category
    const statusCategory =
      issue.fields.status.statusCategory.key === 'done'
        ? 'Done'
        : issue.fields.status.statusCategory.key === 'new'
          ? 'To Do'
          : 'In Progress';
    const storyPointsRaw = issue.fields.customfield_10016;
    const storyPoints =
      typeof storyPointsRaw === 'number'
        ? storyPointsRaw
        : storyPointsRaw
          ? Number(storyPointsRaw)
          : undefined;

    return {
      caseStudyId,
      jiraId: issue.id,
      jiraKey: issue.key,
      summary: issue.fields.summary,
      description: issue.fields.description,
      issueType: issue.fields.issuetype.name,
      priority: issue.fields.priority.name,
      currentStatus: issue.fields.status.name,
      statusCategory: statusCategory as JiraTicket['statusCategory'],
      assigneeId: issue.fields.assignee?.accountId,
      assigneeName: issue.fields.assignee?.displayName,
      reporterId: issue.fields.reporter.accountId,
      reporterName: issue.fields.reporter.displayName,
      sprintId: issue.fields.customfield_10104,
      sprintName: issue.fields.customfield_10104,
      storyPoints,
      createdAt: new Date(issue.fields.created),
      updatedAt: new Date(issue.fields.updated),
      resolvedAt: issue.fields.resolutiondate ? new Date(issue.fields.resolutiondate) : undefined,
      rawJiraData: issue,
      ...extras,
    };
  }

  private getComplexityConfig(): ComplexityConfig {
    if (this.complexityConfig) return this.complexityConfig;
    const path = join(process.cwd(), 'config', 'complexity.config.json');
    this.complexityConfig = JSON.parse(readFileSync(path, 'utf-8')) as ComplexityConfig;
    return this.complexityConfig;
  }

  private getDisciplineConfig(): DisciplineRulesConfig {
    if (this.disciplineConfig) return this.disciplineConfig;
    const path = join(process.cwd(), 'config', 'discipline-rules.json');
    this.disciplineConfig = JSON.parse(readFileSync(path, 'utf-8')) as DisciplineRulesConfig;
    return this.disciplineConfig;
  }

  private getDiscipline(issue: JiraIssueLite): string {
    const config = this.getDisciplineConfig();
    const labels = issue.fields.labels || [];
    const components = (issue.fields.components || []).map((c) => c.name || '');
    return this.disciplineService.deriveFromArrays(labels, components, config);
  }

  private detectAIFlag(issue: JiraIssueLite): boolean {
    const labels = (issue.fields.labels || []).map((l) => l.toLowerCase());
    const text = `${issue.fields.summary} ${issue.fields.description || ''}`.toLowerCase();
    return (
      labels.some((l) => l.includes('ai')) ||
      /ai-coauthored|ai-assisted|copilot/.test(text) ||
      extractTicketIds(text).some((id) => id === 'AI')
    );
  }

  private toNormalizedEvent(
    event: Omit<LifecycleEvent, 'id' | 'createdAt'>
  ): Omit<NormalizedEvent, 'id' | 'createdAt'> {
    return {
      caseStudyId: event.caseStudyId,
      ticketKey: event.ticketKey,
      eventType: event.eventType,
      eventSource: event.eventSource,
      occurredAt: event.eventDate,
      actorName: event.actorName,
      actorId: event.actorId,
      discipline: event.discipline,
      complexitySize: event.complexitySize,
      details: event.details as Record<string, unknown>,
    };
  }
}
