import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { CaseStudyRepository } from '@/lib/repositories/case-study.repository';
import { JiraTicketRepository } from '@/lib/repositories/jira-ticket.repository';
import { LifecycleEventRepository } from '@/lib/repositories/lifecycle-event.repository';
import { NormalizedEventRepository } from '@/lib/repositories/normalized-event.repository';
import { CorrelationService } from '@/lib/services/correlation.service';
import { GitHubImportService } from '@/lib/services/github-import.service';

const importGitHubSchema = z.object({
  caseStudyId: z.string().uuid(),
  since: z.string().datetime().optional(),
  until: z.string().datetime().optional(),
  perPage: z.number().int().min(1).max(100).optional(),
  maxCommits: z.number().int().min(1).max(1000).optional(),
  maxPulls: z.number().int().min(1).max(500).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = importGitHubSchema.parse(body);

    // Get case study
    const caseStudyRepo = new CaseStudyRepository();
    const caseStudy = caseStudyRepo.findById(validatedData.caseStudyId);

    if (!caseStudy) {
      return NextResponse.json({ error: 'Case study not found' }, { status: 404 });
    }

    // Initialize services
    const lifecycleEventRepo = new LifecycleEventRepository();
    const githubImportService = new GitHubImportService(
      lifecycleEventRepo,
      caseStudyRepo,
      undefined, // use default PR repo
      new NormalizedEventRepository()
    );

    // Import commits
    const eventsImported = await githubImportService.importCommits(
      validatedData.caseStudyId,
      caseStudy.githubOwner,
      caseStudy.githubRepo,
      {
        since: validatedData.since ? new Date(validatedData.since) : undefined,
        until: validatedData.until ? new Date(validatedData.until) : undefined,
        perPage: validatedData.perPage,
        maxCommits: validatedData.maxCommits,
      }
    );

    const prResult = await githubImportService.importPullRequests(
      validatedData.caseStudyId,
      caseStudy.githubOwner,
      caseStudy.githubRepo,
      {
        since: validatedData.since ? new Date(validatedData.since) : undefined,
        perPage: validatedData.perPage,
        maxPulls: validatedData.maxPulls,
      }
    );

    // Auto-trigger correlation
    const jiraTicketRepo = new JiraTicketRepository();
    const correlationService = new CorrelationService(jiraTicketRepo, lifecycleEventRepo);
    await correlationService.correlateData(validatedData.caseStudyId);

    // Update case study status
    caseStudyRepo.update(validatedData.caseStudyId, {
      status: 'completed',
    });

    return NextResponse.json({
      success: true,
      eventsImported: eventsImported + prResult.prEvents,
      commitsImported: eventsImported,
      prsImported: prResult.prsImported,
      message: 'GitHub import completed',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error importing GitHub data:', error);
    return NextResponse.json({ error: 'Failed to import GitHub data' }, { status: 500 });
  }
}
