import { NextResponse } from 'next/server';
import { z } from 'zod';
import { GithubPullRequestRepository } from '@/lib/repositories/github-pull-request.repository';
import { JiraTicketRepository } from '@/lib/repositories/jira-ticket.repository';
import { LifecycleEventRepository } from '@/lib/repositories/lifecycle-event.repository';
import { NormalizedEventRepository } from '@/lib/repositories/normalized-event.repository';
import { MetricsService } from '@/lib/services/metrics.service';

const paramsSchema = z.object({
  caseStudyId: z.string().uuid(),
});

export async function GET(req: Request, { params }: { params: Promise<{ caseStudyId: string }> }) {
  try {
    const { caseStudyId } = paramsSchema.parse(await params);
    const url = new URL(req.url);
    const sprintId = url.searchParams.get('sprintId');
    if (!sprintId) {
      return NextResponse.json({ error: 'sprintId is required' }, { status: 400 });
    }

    const service = new MetricsService(
      new JiraTicketRepository(),
      new LifecycleEventRepository(),
      new NormalizedEventRepository(),
      new GithubPullRequestRepository()
    );
    const velocity = await service.getSprintVelocity(caseStudyId, sprintId);
    return NextResponse.json({ sprintId, velocity });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error' }, { status: 400 });
    }
    console.error('velocity error', error);
    return NextResponse.json({ error: 'Failed to fetch velocity' }, { status: 500 });
  }
}
