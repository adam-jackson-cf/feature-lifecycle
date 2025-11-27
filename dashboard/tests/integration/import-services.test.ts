/**
 * Fast Integration Test for Import Services using Fixture Data
 *
 * This test validates the complete import pipeline without network calls:
 * 1. Import mock Jira issues from fixtures
 * 2. Verify tickets are stored correctly in database
 * 3. Verify lifecycle events are created
 * 4. Verify metrics calculation works
 * 5. Verify complexity and discipline assignment
 */

import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { CaseStudyRepository } from '@/lib/repositories/case-study.repository';
import { GithubPullRequestRepository } from '@/lib/repositories/github-pull-request.repository';
import { JiraTicketRepository } from '@/lib/repositories/jira-ticket.repository';
import { LifecycleEventRepository } from '@/lib/repositories/lifecycle-event.repository';
import { NormalizedEventRepository } from '@/lib/repositories/normalized-event.repository';
import { ComplexityService } from '@/lib/services/complexity.service';
import { DisciplineService } from '@/lib/services/discipline.service';
import {
  JiraImportService,
  loadComplexityConfig,
  loadDisciplineConfig,
} from '@/lib/services/jira-import.service';
import { MetricsService } from '@/lib/services/metrics.service';
import { mockIssues } from '@/tests/fixtures/jira/mock-issues';

describe('Import Services Integration Test (Fixtures)', () => {
  let db: Database.Database;
  let jiraImportService: JiraImportService;
  let metricsService: MetricsService;
  let jiraTicketRepo: JiraTicketRepository;
  let lifecycleEventRepo: LifecycleEventRepository;
  let normalizedEventRepo: NormalizedEventRepository;
  let caseStudyRepo: CaseStudyRepository;
  let prRepo: GithubPullRequestRepository;
  let caseStudyId: string;

  beforeAll(() => {
    // Create in-memory database
    db = new Database(':memory:');
    db.pragma('foreign_keys = ON');

    // Initialize schema
    const schemaPath = path.join(__dirname, '../../lib/db/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    db.exec(schema);

    // Create repositories
    jiraTicketRepo = new JiraTicketRepository(db);
    lifecycleEventRepo = new LifecycleEventRepository(db);
    normalizedEventRepo = new NormalizedEventRepository(db);
    caseStudyRepo = new CaseStudyRepository(db);
    prRepo = new GithubPullRequestRepository(db);

    // Create services
    const complexityService = new ComplexityService();
    const disciplineService = new DisciplineService();
    const complexityConfig = loadComplexityConfig();
    const disciplineConfig = loadDisciplineConfig();

    jiraImportService = new JiraImportService(
      jiraTicketRepo,
      lifecycleEventRepo,
      caseStudyRepo,
      normalizedEventRepo,
      complexityService,
      disciplineService,
      complexityConfig,
      disciplineConfig
    );

    metricsService = new MetricsService(
      jiraTicketRepo,
      lifecycleEventRepo,
      normalizedEventRepo,
      prRepo
    );

    // Create case study
    const caseStudy = caseStudyRepo.create({
      name: 'Mock Kafka Integration Test',
      type: 'project',
      jiraProjectKey: 'KAFKA',
      githubOwner: 'apache',
      githubRepo: 'kafka',
      importedAt: new Date(),
      ticketCount: 0,
      eventCount: 0,
      startDate: new Date(),
      endDate: new Date(),
      status: 'importing',
    });
    caseStudyId = caseStudy.id;
  });

  afterAll(() => {
    db.close();
  });

  it('should import Jira issues from mock fixtures', async () => {
    // Import mock issues
    await jiraImportService.importIssues(caseStudyId, mockIssues);

    // Verify tickets were created
    const tickets = jiraTicketRepo.findByCaseStudy(caseStudyId);
    expect(tickets).toHaveLength(mockIssues.length);

    // Verify case study was updated
    const caseStudy = caseStudyRepo.findById(caseStudyId);
    expect(caseStudy?.status).toBe('completed');
    expect(caseStudy?.ticketCount).toBe(mockIssues.length);
  });

  it('should correctly store ticket data in database', async () => {
    const tickets = jiraTicketRepo.findByCaseStudy(caseStudyId);

    // Verify first ticket (KAFKA-19734)
    const ticket1 = tickets.find((t) => t.jiraKey === 'KAFKA-19734');
    expect(ticket1).toBeDefined();
    expect(ticket1?.summary).toBe('Updating the docs for KIP-1221');
    expect(ticket1?.issueType).toBe('Story');
    expect(ticket1?.priority).toBe('Medium');
    expect(ticket1?.currentStatus).toBe('Done');
    expect(ticket1?.statusCategory).toBe('Done');
    expect(ticket1?.storyPoints).toBe(5);
    expect(ticket1?.assigneeName).toBe('John Developer');
    expect(ticket1?.reporterName).toBe('Jane Reporter');
    expect(ticket1?.sprintName).toBe('2024-Q4-Sprint-3');

    // Verify in-progress ticket (KAFKA-19882)
    const ticket2 = tickets.find((t) => t.jiraKey === 'KAFKA-19882');
    expect(ticket2).toBeDefined();
    expect(ticket2?.currentStatus).toBe('In Progress');
    expect(ticket2?.statusCategory).toBe('In Progress');
    expect(ticket2?.resolvedAt).toBeUndefined();

    // Verify bug ticket (KAFKA-17853)
    const bugTicket = tickets.find((t) => t.jiraKey === 'KAFKA-17853');
    expect(bugTicket).toBeDefined();
    expect(bugTicket?.issueType).toBe('Bug');
    expect(bugTicket?.priority).toBe('High');
  });

  it('should create lifecycle events for tickets', async () => {
    const events = lifecycleEventRepo.findByCaseStudy(caseStudyId);

    // Should have at least ticket_created and resolved events
    expect(events.length).toBeGreaterThan(0);

    // Verify ticket_created events
    const createdEvents = events.filter((e) => e.eventType === 'ticket_created');
    expect(createdEvents).toHaveLength(mockIssues.length);

    // Verify event details for first ticket
    const ticket1Created = createdEvents.find((e) => e.ticketKey === 'KAFKA-19734');
    expect(ticket1Created).toBeDefined();
    expect(ticket1Created?.eventSource).toBe('jira');
    expect(ticket1Created?.actorName).toBe('Jane Reporter');
    expect(ticket1Created?.details.metadata).toBeDefined();
    expect(ticket1Created?.details.metadata?.summary).toBe('Updating the docs for KIP-1221');

    // Verify resolved events (only for completed tickets)
    const resolvedEvents = events.filter((e) => e.eventType === 'resolved');
    const resolvedIssues = mockIssues.filter((i) => i.fields.resolutiondate !== null);
    expect(resolvedEvents.length).toBe(resolvedIssues.length);

    // Verify no resolved event for in-progress ticket
    const inProgressResolved = resolvedEvents.find((e) => e.ticketKey === 'KAFKA-19882');
    expect(inProgressResolved).toBeUndefined();
  });

  it('should create normalized events', async () => {
    const normalizedEvents = normalizedEventRepo.findByCaseStudy(caseStudyId);

    // Should have normalized events for all lifecycle events
    expect(normalizedEvents.length).toBeGreaterThan(0);

    // Verify normalized event structure
    const event1 = normalizedEvents.find((e) => e.ticketKey === 'KAFKA-19734');
    expect(event1).toBeDefined();
    expect(event1?.eventType).toBeDefined();
    expect(event1?.eventSource).toBe('jira');
    expect(event1?.occurredAt).toBeInstanceOf(Date);
    expect(event1?.actorName).toBeDefined();
    expect(event1?.discipline).toBeDefined();
    expect(event1?.complexitySize).toBeDefined();
  });

  it('should assign complexity scores and sizes to tickets', async () => {
    const tickets = jiraTicketRepo.findByCaseStudy(caseStudyId);

    // All tickets should have complexity assigned
    for (const ticket of tickets) {
      expect(ticket.complexityScore).toBeDefined();
      expect(ticket.complexitySize).toBeDefined();
      expect(['XS', 'S', 'M', 'L', 'XL']).toContain(ticket.complexitySize);
    }

    // Verify ticket with higher story points has appropriate complexity
    const ticket1 = tickets.find((t) => t.jiraKey === 'KAFKA-19860'); // 8 story points
    expect(ticket1?.complexityScore).toBeGreaterThanOrEqual(0);
    expect(ticket1?.complexityFactors).toBeDefined();
  });

  it('should assign disciplines to tickets', async () => {
    const tickets = jiraTicketRepo.findByCaseStudy(caseStudyId);

    // All tickets should have discipline assigned
    for (const ticket of tickets) {
      expect(ticket.discipline).toBeDefined();
      expect(typeof ticket.discipline).toBe('string');
    }

    // Verify discipline distribution
    const disciplines = tickets.map((t) => t.discipline);
    const uniqueDisciplines = new Set(disciplines);
    expect(uniqueDisciplines.size).toBeGreaterThan(0);
  });

  it('should calculate lead time metrics', async () => {
    const tickets = jiraTicketRepo.findByCaseStudy(caseStudyId);

    // Resolved tickets should have lead time
    const resolvedTickets = tickets.filter((t) => t.statusCategory === 'Done');
    for (const ticket of resolvedTickets) {
      expect(ticket.leadTime).toBeDefined();
      expect(ticket.leadTime).toBeGreaterThan(0);
    }

    // Verify specific ticket
    const ticket1 = tickets.find((t) => t.jiraKey === 'KAFKA-19734');
    expect(ticket1?.leadTime).toBeDefined();
    expect(ticket1?.leadTime).toBeGreaterThan(0);
  });

  it('should calculate metrics summary', async () => {
    const summary = await metricsService.getMetricsSummary(caseStudyId);

    expect(summary.totalTickets).toBe(mockIssues.length);
    expect(summary.completedTickets).toBeGreaterThan(0);
    expect(summary.avgLeadTime).toBeGreaterThan(0);

    // Verify velocity calculation
    const completedWithPoints = mockIssues.filter(
      (i) => i.fields.status.statusCategory.key === 'done' && i.fields.customfield_10016
    );
    const expectedVelocity = completedWithPoints.reduce(
      (sum, i) => sum + (i.fields.customfield_10016 || 0),
      0
    );
    expect(summary.velocityPoints).toBe(expectedVelocity);

    // Verify discipline effort is calculated
    expect(summary.disciplineEffort).toBeDefined();
  });

  it('should calculate complexity breakdown', async () => {
    const breakdown = await metricsService.getComplexityBreakdown(caseStudyId);

    expect(breakdown.bySize).toBeDefined();
    expect(breakdown.byDiscipline).toBeDefined();

    // Should have tickets in various size buckets
    const totalBySize = Object.values(breakdown.bySize).reduce((sum, count) => {
      if (typeof count === 'number') {
        return sum + count;
      }
      return sum;
    }, 0);
    expect(totalBySize).toBeGreaterThan(0);

    // Should have tickets by discipline
    const totalByDiscipline = Object.values(breakdown.byDiscipline).reduce(
      (sum, count) => sum + count,
      0
    );
    expect(totalByDiscipline).toBe(mockIssues.length);
  });

  it('should calculate time-in-status metrics', async () => {
    const timeInStatus = await metricsService.getTimeInStatus(caseStudyId);

    expect(timeInStatus.size).toBeGreaterThan(0);

    // Verify we have time in at least some statuses
    let totalTime = 0;
    for (const time of timeInStatus.values()) {
      totalTime += time;
    }
    expect(totalTime).toBeGreaterThan(0);
  });

  it('should calculate flow efficiency', async () => {
    const efficiency = await metricsService.getFlowEfficiency(caseStudyId);

    expect(efficiency.activeTime).toBeGreaterThanOrEqual(0);
    expect(efficiency.queueTime).toBeGreaterThanOrEqual(0);
    expect(efficiency.efficiency).toBeGreaterThanOrEqual(0);
    expect(efficiency.efficiency).toBeLessThanOrEqual(100);
  });

  it('should calculate churn metrics', async () => {
    const churnMetrics = await metricsService.getChurnMetrics(caseStudyId);

    expect(churnMetrics.totalStatusChanges).toBeGreaterThanOrEqual(0);
    expect(churnMetrics.avgStatusChangesPerTicket).toBeGreaterThanOrEqual(0);
  });

  it('should handle tickets by status correctly', async () => {
    // Test finding tickets by status category
    const doneTickets = jiraTicketRepo.findByStatusCategory(caseStudyId, 'Done');
    const expectedDone = mockIssues.filter((i) => i.fields.status.statusCategory.key === 'done');
    expect(doneTickets).toHaveLength(expectedDone.length);

    const inProgressTickets = jiraTicketRepo.findByStatusCategory(caseStudyId, 'In Progress');
    const expectedInProgress = mockIssues.filter(
      (i) => i.fields.status.statusCategory.key === 'indeterminate'
    );
    expect(inProgressTickets).toHaveLength(expectedInProgress.length);
  });

  it('should handle tickets by sprint correctly', async () => {
    const sprint3Tickets = jiraTicketRepo.findBySprint(caseStudyId, '2024-Q4-Sprint-3');
    const expectedSprint3 = mockIssues.filter(
      (i) => i.fields.customfield_10104 === '2024-Q4-Sprint-3'
    );
    expect(sprint3Tickets).toHaveLength(expectedSprint3.length);

    // List all sprints
    const sprints = jiraTicketRepo.listSprints(caseStudyId);
    expect(sprints.length).toBeGreaterThan(0);

    // Verify sprint structure
    const sprint = sprints.find((s) => s.id === '2024-Q4-Sprint-3');
    expect(sprint).toBeDefined();
    expect(sprint?.ticketCount).toBe(expectedSprint3.length);
  });

  it('should calculate sprint velocity', async () => {
    const velocity = await metricsService.getSprintVelocity(caseStudyId, '2024-Q4-Sprint-3');

    // Calculate expected velocity
    const sprint3Issues = mockIssues.filter(
      (i) =>
        i.fields.customfield_10104 === '2024-Q4-Sprint-3' &&
        i.fields.status.statusCategory.key === 'done' &&
        i.fields.customfield_10016
    );
    const expectedVelocity = sprint3Issues.reduce(
      (sum, i) => sum + (i.fields.customfield_10016 || 0),
      0
    );

    expect(velocity).toBe(expectedVelocity);
  });

  it('should find tickets by key', async () => {
    const ticket = jiraTicketRepo.findByKey('KAFKA-19734');
    expect(ticket).toBeDefined();
    expect(ticket?.jiraKey).toBe('KAFKA-19734');
    expect(ticket?.summary).toBe('Updating the docs for KIP-1221');
  });

  it('should calculate average metrics', async () => {
    const avgMetrics = jiraTicketRepo.getAverageMetrics(caseStudyId);

    expect(avgMetrics.avgLeadTime).toBeGreaterThan(0);
    expect(avgMetrics.avgCycleTime).toBeGreaterThanOrEqual(0);
    expect(avgMetrics.avgStoryPoints).toBeGreaterThan(0);
  });

  it('should get timeline for case study', async () => {
    const timeline = await metricsService.getTimeline(caseStudyId);

    expect(timeline.length).toBeGreaterThan(0);

    // Verify timeline is sorted by date
    for (let i = 1; i < timeline.length; i++) {
      expect(timeline[i].eventDate.getTime()).toBeGreaterThanOrEqual(
        timeline[i - 1].eventDate.getTime()
      );
    }
  });

  it('should count events by type', async () => {
    const countsByType = lifecycleEventRepo.countByType(caseStudyId);

    expect(countsByType.get('ticket_created')).toBe(mockIssues.length);

    const resolvedCount = countsByType.get('resolved') || 0;
    const expectedResolved = mockIssues.filter((i) => i.fields.resolutiondate !== null).length;
    expect(resolvedCount).toBe(expectedResolved);
  });

  it('should count events by source', async () => {
    const countsBySource = lifecycleEventRepo.countBySource(caseStudyId);

    // All events in this test are from Jira
    expect(countsBySource.jira).toBeGreaterThan(0);
    expect(countsBySource.github).toBe(0);
  });

  it('should handle ticket updates', async () => {
    const ticket = jiraTicketRepo.findByKey('KAFKA-19734');
    expect(ticket).toBeDefined();

    if (ticket) {
      const updated = jiraTicketRepo.update(ticket.id, {
        currentStatus: 'Updated Status',
      });

      expect(updated).toBeDefined();
      expect(updated?.currentStatus).toBe('Updated Status');
      expect(updated?.jiraKey).toBe('KAFKA-19734'); // Unchanged
    }
  });

  it('should verify date range in case study', async () => {
    const caseStudy = caseStudyRepo.findById(caseStudyId);
    expect(caseStudy).toBeDefined();

    if (caseStudy) {
      expect(caseStudy.startDate).toBeInstanceOf(Date);
      expect(caseStudy.endDate).toBeInstanceOf(Date);
      expect(caseStudy.endDate.getTime()).toBeGreaterThanOrEqual(caseStudy.startDate.getTime());
    }
  });

  it('should correctly store raw Jira data', async () => {
    const ticket = jiraTicketRepo.findByKey('KAFKA-19734');
    expect(ticket).toBeDefined();
    expect(ticket?.rawJiraData).toBeDefined();

    // Verify raw data matches original
    const originalIssue = mockIssues.find((i) => i.key === 'KAFKA-19734');
    expect(ticket?.rawJiraData).toEqual(originalIssue);
  });
});
