import { NextResponse } from 'next/server';
import { z } from 'zod';
import { JiraTicketRepository } from '@/lib/repositories/jira-ticket.repository';
import { LifecycleEventRepository } from '@/lib/repositories/lifecycle-event.repository';
import { MetricsService } from '@/lib/services/metrics.service';

const paramsSchema = z.object({
  caseStudyId: z.string().uuid(),
});

export async function GET(_req: Request, { params }: { params: Promise<{ caseStudyId: string }> }) {
  try {
    const { caseStudyId } = paramsSchema.parse(await params);
    const jiraRepo = new JiraTicketRepository();
    const eventRepo = new LifecycleEventRepository();
    const service = new MetricsService(jiraRepo, eventRepo);

    const summary = await service.getMetricsSummary(caseStudyId);
    const flow = await service.getFlowEfficiency(caseStudyId);
    const complexity = await service.getComplexityBreakdown(caseStudyId);

    return NextResponse.json({ ...summary, flow, complexity });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error' }, { status: 400 });
    }
    console.error('summary error', error);
    return NextResponse.json({ error: 'Failed to fetch summary' }, { status: 500 });
  }
}
