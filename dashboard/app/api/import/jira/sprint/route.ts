import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { CaseStudyRepository } from '@/lib/repositories/case-study.repository';
import { JiraTicketRepository } from '@/lib/repositories/jira-ticket.repository';
import { LifecycleEventRepository } from '@/lib/repositories/lifecycle-event.repository';
import { JiraImportService } from '@/lib/services/jira-import.service';

const importSchema = z.object({
  caseStudyId: z.string().uuid(),
  issues: z.array(z.any()),
  sprintId: z.string().optional(),
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
    const service = new JiraImportService(jiraRepo, lifecycleRepo, caseStudyRepo);

    await service.importIssues(data.caseStudyId, data.issues);

    return NextResponse.json({ success: true, imported: data.issues.length });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Jira sprint import failed', error);
    return NextResponse.json({ error: 'Failed to import Jira data' }, { status: 500 });
  }
}
