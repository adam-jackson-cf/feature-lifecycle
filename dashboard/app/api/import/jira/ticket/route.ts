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
  issue: z.any(),
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

    await service.importIssues(data.caseStudyId, [data.issue]);

    return NextResponse.json({ success: true, imported: 1 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Jira ticket import failed', error);
    return NextResponse.json({ error: 'Failed to import Jira ticket' }, { status: 500 });
  }
}
