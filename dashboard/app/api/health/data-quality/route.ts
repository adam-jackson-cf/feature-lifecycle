import { type NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { CaseStudyRepository } from '@/lib/repositories/case-study.repository';
import { JiraTicketRepository } from '@/lib/repositories/jira-ticket.repository';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const caseStudyId = searchParams.get('caseStudyId');

    const _db = getDatabase();
    const jiraTicketRepo = new JiraTicketRepository();
    const caseStudyRepo = new CaseStudyRepository();

    if (caseStudyId) {
      // Data quality for specific case study
      const tickets = jiraTicketRepo.findByCaseStudy(caseStudyId);

      const missingStoryPoints = tickets.filter((t) => !t.storyPoints).length;
      const missingSprintIds = tickets.filter((t) => !t.sprintId).length;
      const missingLabels = tickets.filter(
        (t) => !(t.rawJiraData as { fields?: { labels?: unknown[] } })?.fields?.labels
      ).length;

      // Check for duplicate ticket keys
      const ticketKeys = tickets.map((t) => t.jiraKey);
      const duplicates = ticketKeys.filter((key, index) => ticketKeys.indexOf(key) !== index);

      return NextResponse.json({
        caseStudyId,
        missingFields: {
          storyPoints: missingStoryPoints,
          sprintIds: missingSprintIds,
          labels: missingLabels,
        },
        duplicates: {
          ticketKeys: [...new Set(duplicates)],
          count: duplicates.length,
        },
        rowCounts: {
          tickets: tickets.length,
        },
      });
    }

    // Overall data quality report
    const caseStudies = caseStudyRepo.findAll();
    const allTickets = caseStudies.flatMap((cs) => jiraTicketRepo.findByCaseStudy(cs.id));

    return NextResponse.json({
      overall: {
        caseStudies: caseStudies.length,
        totalTickets: allTickets.length,
        missingStoryPoints: allTickets.filter((t) => !t.storyPoints).length,
        missingSprintIds: allTickets.filter((t) => !t.sprintId).length,
      },
      byCaseStudy: caseStudies.map((cs) => {
        const tickets = jiraTicketRepo.findByCaseStudy(cs.id);
        return {
          id: cs.id,
          name: cs.name,
          ticketCount: tickets.length,
          missingStoryPoints: tickets.filter((t) => !t.storyPoints).length,
          missingSprintIds: tickets.filter((t) => !t.sprintId).length,
        };
      }),
    });
  } catch (error) {
    console.error('Error checking data quality:', error);
    return NextResponse.json({ error: 'Failed to check data quality' }, { status: 500 });
  }
}
