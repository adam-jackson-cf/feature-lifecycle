import { NextResponse } from 'next/server';
import { z } from 'zod';
import phaseRulesConfig from '@/config/phase-rules.json';
import { JiraTicketRepository } from '@/lib/repositories/jira-ticket.repository';
import { NormalizedEventRepository } from '@/lib/repositories/normalized-event.repository';
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
    const normalizedRepo = new NormalizedEventRepository();
    const phaseService = new PhaseService(phaseRulesConfig as PhaseRulesConfig);

    const tickets = jiraRepo.findByCaseStudy(caseStudyId);
    const events = normalizedRepo.findByCaseStudy(caseStudyId);

    const distribution = calculatePhaseDistribution(tickets, events, phaseService);

    return NextResponse.json(distribution);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error' }, { status: 400 });
    }
    console.error('phase-distribution error', error);
    return NextResponse.json({ error: 'Failed to fetch phase distribution' }, { status: 500 });
  }
}
