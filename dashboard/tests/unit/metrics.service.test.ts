import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CaseStudyRepository } from '@/lib/repositories/case-study.repository';
import { JiraTicketRepository } from '@/lib/repositories/jira-ticket.repository';
import { LifecycleEventRepository } from '@/lib/repositories/lifecycle-event.repository';
import { JiraImportService } from '@/lib/services/jira-import.service';
import { MetricsService } from '@/lib/services/metrics.service';
import { EventType } from '@/lib/types';
import { mockIssues } from '@/tests/fixtures/jira/mock-issues';

describe('MetricsService', () => {
  let db: Database.Database;
  let jiraRepo: JiraTicketRepository;
  let lifecycleRepo: LifecycleEventRepository;
  let caseStudyRepo: CaseStudyRepository;
  let jiraImport: JiraImportService;
  let metrics: MetricsService;
  let caseStudyId: string;

  beforeEach(() => {
    db = new Database(':memory:');
    db.pragma('foreign_keys = ON');
    const schemaPath = path.join(__dirname, '../../lib/db/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    db.exec(schema);

    jiraRepo = new JiraTicketRepository(db);
    lifecycleRepo = new LifecycleEventRepository(db);
    caseStudyRepo = new CaseStudyRepository(db);
    jiraImport = new JiraImportService(jiraRepo, lifecycleRepo, caseStudyRepo);
    metrics = new MetricsService(jiraRepo, lifecycleRepo);

    const cs = caseStudyRepo.create({
      name: 'Metrics CS',
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
    caseStudyId = cs.id;
  });

  afterEach(() => {
    db.close();
  });

  it('returns summary with complexity breakdown', async () => {
    await jiraImport.importIssues(caseStudyId, mockIssues.slice(0, 2));
    await jiraImport.calculateMetrics(caseStudyId);

    const summary = await metrics.getMetricsSummary(caseStudyId);
    const breakdown = await metrics.getComplexityBreakdown(caseStudyId);

    expect(summary.totalTickets).toBeGreaterThan(0);
    expect(breakdown.bySize.size).toBeGreaterThan(0);
  });

  it('calculates time-in-status per status bucket', async () => {
    const createdAt = new Date('2024-01-01T00:00:00Z');
    const inProgressAt = new Date('2024-01-03T00:00:00Z');
    const doneAt = new Date('2024-01-05T00:00:00Z');

    // Insert ticket directly
    const ticket = jiraRepo.create({
      caseStudyId,
      jiraId: '1',
      jiraKey: 'TEST-1',
      summary: 'Test ticket',
      description: '',
      issueType: 'Story',
      priority: 'Major',
      currentStatus: 'Done',
      statusCategory: 'Done',
      createdAt,
      updatedAt: doneAt,
      resolvedAt: doneAt,
      rawJiraData: {},
    });

    // Status change events
    lifecycleRepo.create({
      caseStudyId,
      ticketKey: ticket.jiraKey,
      eventType: EventType.STATUS_CHANGED,
      eventSource: 'jira',
      eventDate: inProgressAt,
      actorName: 'system',
      details: { fromStatus: 'To Do', toStatus: 'In Progress' },
    });

    lifecycleRepo.create({
      caseStudyId,
      ticketKey: ticket.jiraKey,
      eventType: EventType.STATUS_CHANGED,
      eventSource: 'jira',
      eventDate: doneAt,
      actorName: 'system',
      details: { fromStatus: 'In Progress', toStatus: 'Done' },
    });

    const timeInStatus = await metrics.getTimeInStatus(caseStudyId);
    const toDoMs = timeInStatus.get('To Do') || 0;
    const inProgressMs = timeInStatus.get('In Progress') || 0;

    expect(Math.round(toDoMs / (1000 * 60 * 60 * 24))).toBe(2); // 2 days
    expect(Math.round(inProgressMs / (1000 * 60 * 60 * 24))).toBe(2); // 2 days
    expect(timeInStatus.get('Done')).toBeGreaterThanOrEqual(0);
  });

  it('computes churn metrics (status change count)', async () => {
    const now = new Date('2024-01-01T00:00:00Z');

    const ticket = jiraRepo.create({
      caseStudyId,
      jiraId: '2',
      jiraKey: 'TEST-2',
      summary: 'Churn ticket',
      description: '',
      issueType: 'Task',
      priority: 'Major',
      currentStatus: 'In Progress',
      statusCategory: 'In Progress',
      createdAt: now,
      updatedAt: now,
      rawJiraData: {},
    });

    lifecycleRepo.create({
      caseStudyId,
      ticketKey: ticket.jiraKey,
      eventType: EventType.STATUS_CHANGED,
      eventSource: 'jira',
      eventDate: new Date('2024-01-02T00:00:00Z'),
      actorName: 'system',
      details: { fromStatus: 'To Do', toStatus: 'In Progress' },
    });

    lifecycleRepo.create({
      caseStudyId,
      ticketKey: ticket.jiraKey,
      eventType: EventType.STATUS_CHANGED,
      eventSource: 'jira',
      eventDate: new Date('2024-01-03T00:00:00Z'),
      actorName: 'system',
      details: { fromStatus: 'In Progress', toStatus: 'To Do' },
    });

    const churn = await metrics.getChurnMetrics(caseStudyId);
    expect(churn.totalStatusChanges).toBe(2);
    expect(churn.avgStatusChangesPerTicket).toBeCloseTo(2, 5);
  });
});
