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
    const statusMap = jiraRepo.countByStatus(caseStudyId);

    // Convert Map to array of objects for chart
    const data = Array.from(statusMap.entries()).map(([name, value]) => ({
      name,
      value,
      id: name.toLowerCase().replace(/\s+/g, '-'),
    }));

    return NextResponse.json({ data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error' }, { status: 400 });
    }
    console.error('status-distribution error', error);
    return NextResponse.json({ error: 'Failed to fetch status distribution' }, { status: 500 });
  }
}
