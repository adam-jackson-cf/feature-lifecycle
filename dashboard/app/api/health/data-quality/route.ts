import { type NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { CaseStudyRepository } from '@/lib/repositories/case-study.repository';
import { JiraTicketRepository } from '@/lib/repositories/jira-ticket.repository';

interface TicketSummary {
  jiraKey: string;
  summary: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const caseStudyId = searchParams.get('caseStudyId');
    const includeTickets = searchParams.get('includeTickets') === 'true';

    const _db = getDatabase();
    const jiraTicketRepo = new JiraTicketRepository();
    const caseStudyRepo = new CaseStudyRepository();

    if (caseStudyId) {
      // Data quality for specific case study
      const tickets = jiraTicketRepo.findByCaseStudy(caseStudyId);

      // Filter tickets by issue type
      const ticketsWithMissingStoryPoints = tickets.filter((t) => !t.storyPoints);
      const ticketsWithMissingSprintIds = tickets.filter((t) => !t.sprintId);
      const ticketsWithMissingLabels = tickets.filter(
        (t) => !(t.rawJiraData as { fields?: { labels?: unknown[] } })?.fields?.labels?.length
      );

      // Check for duplicate ticket keys
      const ticketKeys = tickets.map((t) => t.jiraKey);
      const duplicateKeys = ticketKeys.filter((key, index) => ticketKeys.indexOf(key) !== index);
      const uniqueDuplicateKeys = [...new Set(duplicateKeys)];
      const ticketsWithDuplicates = tickets.filter((t) => uniqueDuplicateKeys.includes(t.jiraKey));

      // Field completeness breakdown
      const totalTickets = tickets.length;
      const fieldCompleteness = {
        storyPoints: {
          complete: totalTickets - ticketsWithMissingStoryPoints.length,
          missing: ticketsWithMissingStoryPoints.length,
          total: totalTickets,
          percentage:
            totalTickets > 0
              ? Math.round(
                  ((totalTickets - ticketsWithMissingStoryPoints.length) / totalTickets) * 100
                )
              : 100,
        },
        sprintIds: {
          complete: totalTickets - ticketsWithMissingSprintIds.length,
          missing: ticketsWithMissingSprintIds.length,
          total: totalTickets,
          percentage:
            totalTickets > 0
              ? Math.round(
                  ((totalTickets - ticketsWithMissingSprintIds.length) / totalTickets) * 100
                )
              : 100,
        },
        labels: {
          complete: totalTickets - ticketsWithMissingLabels.length,
          missing: ticketsWithMissingLabels.length,
          total: totalTickets,
          percentage:
            totalTickets > 0
              ? Math.round(((totalTickets - ticketsWithMissingLabels.length) / totalTickets) * 100)
              : 100,
        },
      };

      // Effort blockers - issues that directly affect effort calculations
      const closedStatuses = ['done', 'closed', 'resolved', 'complete'];
      const closedTicketsWithMissingPoints = ticketsWithMissingStoryPoints.filter((t) =>
        closedStatuses.includes(t.currentStatus.toLowerCase())
      );

      const effortBlockers = {
        closedWithoutStoryPoints: {
          count: closedTicketsWithMissingPoints.length,
          impact: 'Cannot calculate accurate velocity or effort distribution',
          severity: closedTicketsWithMissingPoints.length > 0 ? 'critical' : 'good',
        },
        unassignedToSprint: {
          count: ticketsWithMissingSprintIds.length,
          impact: 'Cannot track sprint velocity or timeline',
          severity:
            ticketsWithMissingSprintIds.length / totalTickets > 0.1
              ? 'warning'
              : ticketsWithMissingSprintIds.length > 0
                ? 'info'
                : 'good',
        },
        missingDisciplineLabels: {
          count: ticketsWithMissingLabels.length,
          impact: 'Cannot calculate discipline distribution accurately',
          severity:
            ticketsWithMissingLabels.length / totalTickets > 0.1
              ? 'warning'
              : ticketsWithMissingLabels.length > 0
                ? 'info'
                : 'good',
        },
      };

      // Helper to format ticket summary
      const formatTicket = (t: (typeof tickets)[0]): TicketSummary => ({
        jiraKey: t.jiraKey,
        summary: t.summary || 'No summary',
        status: t.currentStatus,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      });

      // Include affected tickets if requested (limited to 50 per category)
      const affectedTickets = includeTickets
        ? {
            missingStoryPoints: ticketsWithMissingStoryPoints.slice(0, 50).map(formatTicket),
            missingSprintIds: ticketsWithMissingSprintIds.slice(0, 50).map(formatTicket),
            missingLabels: ticketsWithMissingLabels.slice(0, 50).map(formatTicket),
            duplicates: ticketsWithDuplicates.slice(0, 50).map(formatTicket),
            closedWithoutStoryPoints: closedTicketsWithMissingPoints.slice(0, 50).map(formatTicket),
          }
        : undefined;

      return NextResponse.json({
        caseStudyId,
        missingFields: {
          storyPoints: ticketsWithMissingStoryPoints.length,
          sprintIds: ticketsWithMissingSprintIds.length,
          labels: ticketsWithMissingLabels.length,
        },
        duplicates: {
          ticketKeys: uniqueDuplicateKeys,
          count: duplicateKeys.length,
        },
        rowCounts: {
          tickets: totalTickets,
        },
        fieldCompleteness,
        effortBlockers,
        affectedTickets,
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
