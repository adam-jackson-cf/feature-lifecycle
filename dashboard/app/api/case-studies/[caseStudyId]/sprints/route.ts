import { NextResponse } from 'next/server';
import { z } from 'zod';
import { JiraTicketRepository } from '@/lib/repositories/jira-ticket.repository';

const paramsSchema = z.object({
  caseStudyId: z.string().uuid(),
});

export async function GET(_req: Request, { params }: { params: Promise<{ caseStudyId: string }> }) {
  try {
    const { caseStudyId } = paramsSchema.parse(await params);
    const repo = new JiraTicketRepository();
    const sprints = repo.listSprints(caseStudyId);
    return NextResponse.json({ sprints });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error' }, { status: 400 });
    }
    console.error('sprint list error', error);
    return NextResponse.json({ error: 'Failed to fetch sprints' }, { status: 500 });
  }
}
