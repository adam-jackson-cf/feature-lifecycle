import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { CaseStudyRepository } from '@/lib/repositories/case-study.repository';
import { CaseStudyImportRepository } from '@/lib/repositories/case-study-import.repository';
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

const importSchema = z.object({
  caseStudyId: z.string().uuid(),
  projectKey: z.string(),
  label: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = importSchema.parse(body);

    const caseStudyRepo = new CaseStudyRepository();
    const caseStudy = caseStudyRepo.findById(data.caseStudyId);
    if (!caseStudy) {
      return NextResponse.json({ error: 'Case study not found' }, { status: 404 });
    }

    // Create import record
    const importRepo = new CaseStudyImportRepository();
    const importRecord = importRepo.create({
      caseStudyId: data.caseStudyId,
      importType: 'feature',
      jiraProjectKey: data.projectKey,
      jiraLabel: data.label,
      status: 'importing',
      ticketCount: 0,
      eventCount: 0,
    });

    const jiraRepo = new JiraTicketRepository();
    const lifecycleRepo = new LifecycleEventRepository();
    const normalizedEventRepo = new NormalizedEventRepository();
    const complexityService = new ComplexityService();
    const disciplineService = new DisciplineService();
    const complexityConfig = loadComplexityConfig();
    const disciplineConfig = loadDisciplineConfig();

    const service = new JiraImportService(
      jiraRepo,
      lifecycleRepo,
      caseStudyRepo,
      normalizedEventRepo,
      complexityService,
      disciplineService,
      complexityConfig,
      disciplineConfig
    );

    // Fetch issues by label
    const issues = await service.fetchIssuesByLabel(data.projectKey, data.label, 200);

    if (!issues || issues.length === 0) {
      importRepo.update(importRecord.id, {
        status: 'error',
        errorMessage: 'No issues found with the specified label',
      });
      return NextResponse.json(
        { error: 'No issues found with the specified label' },
        { status: 400 }
      );
    }

    // Import the issues
    await service.importIssues(data.caseStudyId, issues);

    // Update import record
    const dates = issues.map((i) => new Date(i.fields.created).getTime());
    const startDate = dates.length > 0 ? new Date(Math.min(...dates)) : undefined;
    const endDate = dates.length > 0 ? new Date(Math.max(...dates)) : undefined;

    importRepo.update(importRecord.id, {
      status: 'completed',
      ticketCount: issues.length,
      startDate,
      endDate,
    });

    return NextResponse.json({ success: true, imported: issues.length });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Jira feature import failed', error);
    return NextResponse.json({ error: 'Failed to import Jira data' }, { status: 500 });
  }
}
