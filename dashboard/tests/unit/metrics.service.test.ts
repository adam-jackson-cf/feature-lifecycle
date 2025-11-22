import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CaseStudyRepository } from '@/lib/repositories/case-study.repository';
import { JiraTicketRepository } from '@/lib/repositories/jira-ticket.repository';
import { LifecycleEventRepository } from '@/lib/repositories/lifecycle-event.repository';
import { JiraImportService } from '@/lib/services/jira-import.service';
import { MetricsService } from '@/lib/services/metrics.service';
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
});
