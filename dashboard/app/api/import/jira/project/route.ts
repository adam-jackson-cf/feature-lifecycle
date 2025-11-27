import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { CaseStudyRepository } from '@/lib/repositories/case-study.repository';
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
  projectKey: z.string().optional(),
  issues: z.array(z.any()).optional(), // accepts raw Jira issues payload
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

    const issues =
      data.issues ||
      (data.projectKey ? await service.fetchProjectIssues(data.projectKey, 200) : []);

    if (!issues || issues.length === 0) {
      return NextResponse.json({ error: 'No issues provided or fetched' }, { status: 400 });
    }

    await service.importIssues(data.caseStudyId, issues);

    return NextResponse.json({ success: true, imported: issues.length });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Jira project import failed', error);
    return NextResponse.json({ error: 'Failed to import Jira data' }, { status: 500 });
  }
}
