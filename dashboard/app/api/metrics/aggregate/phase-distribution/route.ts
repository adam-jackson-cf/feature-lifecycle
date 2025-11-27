import { NextResponse } from 'next/server';
import phaseRulesConfig from '@/config/phase-rules.json';
import { CaseStudyRepository } from '@/lib/repositories/case-study.repository';
import { JiraTicketRepository } from '@/lib/repositories/jira-ticket.repository';
import { NormalizedEventRepository } from '@/lib/repositories/normalized-event.repository';
import type { PhaseRulesConfig } from '@/lib/services/phase.service';
import { PhaseService } from '@/lib/services/phase.service';
import { calculateAggregatePhaseDistribution } from '@/lib/services/phase-calculator';

export async function GET() {
  try {
    const caseStudyRepo = new CaseStudyRepository();
    const jiraRepo = new JiraTicketRepository();
    const normalizedRepo = new NormalizedEventRepository();
    const phaseService = new PhaseService(phaseRulesConfig as PhaseRulesConfig);

    // Get all completed case studies
    const caseStudies = caseStudyRepo.findByStatus('completed');

    // Aggregate tickets and events from all case studies
    const allTickets = caseStudies.flatMap((cs) => jiraRepo.findByCaseStudy(cs.id));
    const allEvents = caseStudies.flatMap((cs) => normalizedRepo.findByCaseStudy(cs.id));

    const distribution = calculateAggregatePhaseDistribution(allTickets, allEvents, phaseService);

    return NextResponse.json({
      ...distribution,
      caseStudyCount: caseStudies.length,
    });
  } catch (error) {
    console.error('aggregate phase-distribution error', error);
    return NextResponse.json(
      { error: 'Failed to fetch aggregate phase distribution' },
      { status: 500 }
    );
  }
}
