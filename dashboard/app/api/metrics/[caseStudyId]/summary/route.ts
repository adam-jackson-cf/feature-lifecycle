import { NextResponse } from 'next/server';
import { z } from 'zod';
import phaseRulesConfig from '@/config/phase-rules.json';
import { GithubPullRequestRepository } from '@/lib/repositories/github-pull-request.repository';
import { JiraTicketRepository } from '@/lib/repositories/jira-ticket.repository';
import { LifecycleEventRepository } from '@/lib/repositories/lifecycle-event.repository';
import { NormalizedEventRepository } from '@/lib/repositories/normalized-event.repository';
import { MetricsService } from '@/lib/services/metrics.service';
import type { PhaseRulesConfig } from '@/lib/services/phase.service';
import { PhaseService } from '@/lib/services/phase.service';
import { calculatePhaseDistribution } from '@/lib/services/phase-calculator';

const paramsSchema = z.object({
  caseStudyId: z.string().uuid(),
});

export async function GET(_req: Request, { params }: { params: Promise<{ caseStudyId: string }> }) {
  try {
    const { caseStudyId } = paramsSchema.parse(await params);
    const jiraRepo = new JiraTicketRepository();
    const eventRepo = new LifecycleEventRepository();
    const normalizedRepo = new NormalizedEventRepository();
    const prRepo = new GithubPullRequestRepository();
    const service = new MetricsService(jiraRepo, eventRepo, normalizedRepo, prRepo);

    const summary = await service.getMetricsSummary(caseStudyId);
    const flow = await service.getFlowEfficiency(caseStudyId);
    const complexity = await service.getComplexityBreakdown(caseStudyId);
    const disciplineEffort = await service.getDisciplineEffort(caseStudyId);

    // Calculate phase distribution
    const phaseService = new PhaseService(phaseRulesConfig as PhaseRulesConfig);
    const tickets = jiraRepo.findByCaseStudy(caseStudyId);
    const normalizedEvents = normalizedRepo.findByCaseStudy(caseStudyId);
    const phaseDistribution = calculatePhaseDistribution(tickets, normalizedEvents, phaseService);

    return NextResponse.json({ ...summary, flow, complexity, disciplineEffort, phaseDistribution });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error' }, { status: 400 });
    }
    console.error('summary error', error);
    return NextResponse.json({ error: 'Failed to fetch summary' }, { status: 500 });
  }
}
