import { NextResponse } from 'next/server';
import { z } from 'zod';
import { JiraTicketRepository } from '@/lib/repositories/jira-ticket.repository';

const paramsSchema = z.object({
  caseStudyId: z.string().uuid(),
});

export async function GET(_req: Request, { params }: { params: Promise<{ caseStudyId: string }> }) {
  try {
    const { caseStudyId } = paramsSchema.parse(await params);
    const jiraRepo = new JiraTicketRepository();
    const tickets = jiraRepo.findByCaseStudy(caseStudyId);
    const data = tickets.map((t) => ({
      key: t.jiraKey,
      cycleTime: t.cycleTime || 0,
      complexitySize: t.complexitySize,
      discipline: t.discipline,
      aiFlag: t.aiFlag,
    }));
    return NextResponse.json({ tickets: data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error' }, { status: 400 });
    }
    console.error('cycle-time error', error);
    return NextResponse.json({ error: 'Failed to fetch cycle time' }, { status: 500 });
  }
}
