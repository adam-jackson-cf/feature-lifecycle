import { Octokit } from 'octokit';
import type { CaseStudyRepository } from '@/lib/repositories/case-study.repository';
import { GithubPullRequestRepository } from '@/lib/repositories/github-pull-request.repository';
import type { LifecycleEventRepository } from '@/lib/repositories/lifecycle-event.repository';
import { NormalizedEventRepository } from '@/lib/repositories/normalized-event.repository';
import type { LifecycleEvent, NormalizedEvent } from '@/lib/types';
import { EventType as EventTypeEnum, type GitHubPullRequest } from '@/lib/types';
import { extractTicketIds } from '@/lib/utils';

export interface GitHubCommitData {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
  };
  author: {
    login: string;
  } | null;
  html_url: string;
  stats?: {
    additions: number;
    deletions: number;
    total: number;
  };
  files?: {
    filename: string;
    additions: number;
    deletions: number;
    changes: number;
  }[];
}

export class GitHubImportService {
  private octokit: Octokit;

  constructor(
    private lifecycleEventRepo: LifecycleEventRepository,
    private caseStudyRepo: CaseStudyRepository,
    private prRepo = new GithubPullRequestRepository(),
    private normalizedEventRepo: NormalizedEventRepository = new NormalizedEventRepository(),
    githubToken?: string
  ) {
    this.octokit = new Octokit({ auth: githubToken });
  }

  /**
   * Import commits for a case study from a GitHub repository
   */
  async importCommits(
    caseStudyId: string,
    owner: string,
    repo: string,
    options: {
      since?: Date;
      until?: Date;
      perPage?: number;
      maxCommits?: number;
    } = {}
  ): Promise<number> {
    const { since, until, perPage = 100, maxCommits = 500 } = options;

    const events: Omit<LifecycleEvent, 'id' | 'createdAt'>[] = [];
    let page = 1;
    let totalCommits = 0;

    try {
      while (totalCommits < maxCommits) {
        const params: {
          owner: string;
          repo: string;
          per_page: number;
          page: number;
          since?: string;
          until?: string;
        } = {
          owner,
          repo,
          per_page: perPage,
          page,
        };

        if (since) params.since = since.toISOString();
        if (until) params.until = until.toISOString();

        const response = await this.octokit.rest.repos.listCommits(params);

        if (response.data.length === 0) break;

        for (const commit of response.data) {
          // Extract ticket IDs from commit message
          const ticketIds = extractTicketIds(commit.commit.message);

          if (ticketIds.length > 0) {
            const commitData = commit as unknown as GitHubCommitData;

            // Create an event for each ticket ID mentioned in the commit
            for (const ticketKey of ticketIds) {
              events.push({
                caseStudyId,
                ticketKey,
                eventType: EventTypeEnum.COMMIT_CREATED,
                eventSource: 'github',
                eventDate: new Date(commitData.commit.author.date),
                actorName: commitData.commit.author.name,
                actorId: commitData.author?.login,
                details: {
                  commitSha: commitData.sha,
                  commitMessage: commitData.commit.message,
                  commitUrl: commitData.html_url,
                  metadata: {
                    email: commitData.commit.author.email,
                  },
                },
              });
            }

            totalCommits++;
            if (totalCommits >= maxCommits) break;
          }
        }

        page++;
      }

      // Batch insert events
      if (events.length > 0) {
        this.lifecycleEventRepo.createMany(events);
        this.normalizedEventRepo.createMany(events.map((event) => this.toNormalizedEvent(event)));

        // Update case study event count
        const caseStudy = this.caseStudyRepo.findById(caseStudyId);
        if (caseStudy) {
          this.caseStudyRepo.update(caseStudyId, {
            eventCount: caseStudy.eventCount + events.length,
          });
        }
      }

      return events.length;
    } catch (error) {
      const caseStudy = this.caseStudyRepo.findById(caseStudyId);
      if (caseStudy) {
        this.caseStudyRepo.update(caseStudyId, {
          status: 'error',
          errorMessage: `GitHub import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
      throw error;
    }
  }

  /**
   * Import pull requests and create lifecycle events for linked tickets
   */
  async importPullRequests(
    caseStudyId: string,
    owner: string,
    repo: string,
    options: {
      state?: 'open' | 'closed' | 'all';
      perPage?: number;
      maxPulls?: number;
      since?: Date;
    } = {}
  ): Promise<{ prsImported: number; prEvents: number }> {
    const { state = 'all', perPage = 50, maxPulls = 200, since } = options;
    const prRecords: Omit<GitHubPullRequest, 'id'>[] = [];
    const events: Omit<LifecycleEvent, 'id' | 'createdAt'>[] = [];

    let page = 1;
    let imported = 0;

    try {
      while (imported < maxPulls) {
        const response = await this.octokit.rest.pulls.list({
          owner,
          repo,
          state,
          per_page: perPage,
          page,
          sort: 'updated',
          direction: 'desc',
        });

        if (response.data.length === 0) break;

        for (const pr of response.data) {
          if (since && new Date(pr.updated_at) < since) {
            continue;
          }

          const ticketKeys = extractTicketIds(
            `${pr.title} ${pr.body || ''} ${pr.head?.ref || ''} ${pr.base?.ref || ''}`
          );
          const prState: GitHubPullRequest['state'] =
            pr.merged_at !== null ? 'merged' : pr.state === 'closed' ? 'closed' : 'open';
          const prStats = pr as unknown as {
            additions?: number;
            deletions?: number;
            commits?: number;
            merged_by?: { login?: string; id?: number };
          };

          prRecords.push({
            caseStudyId,
            ticketKeys,
            prNumber: pr.number,
            title: pr.title,
            description: pr.body || undefined,
            state: prState,
            authorName: pr.user?.login || pr.user?.name || 'Unknown',
            createdAt: new Date(pr.created_at),
            updatedAt: new Date(pr.updated_at),
            closedAt: pr.closed_at ? new Date(pr.closed_at) : undefined,
            mergedAt: pr.merged_at ? new Date(pr.merged_at) : undefined,
            baseBranch: pr.base.ref,
            headBranch: pr.head.ref,
            additions: prStats.additions ?? 0,
            deletions: prStats.deletions ?? 0,
            commitsCount: prStats.commits ?? 0,
            reviewers: (pr.requested_reviewers || []).map((r) => r.login),
            approvedBy: [],
            url: pr.html_url,
          });

          // Create lifecycle events only when we have ticket linkage
          for (const ticketKey of ticketKeys) {
            events.push({
              caseStudyId,
              ticketKey,
              eventType: EventTypeEnum.PR_OPENED,
              eventSource: 'github',
              eventDate: new Date(pr.created_at),
              actorName: pr.user?.login || 'Unknown',
              actorId: pr.user?.id ? String(pr.user.id) : undefined,
              details: {
                prNumber: pr.number,
                prTitle: pr.title,
                prUrl: pr.html_url,
              },
            });

            if (pr.merged_at) {
              events.push({
                caseStudyId,
                ticketKey,
                eventType: EventTypeEnum.PR_MERGED,
                eventSource: 'github',
                eventDate: new Date(pr.merged_at),
                actorName: prStats.merged_by?.login || pr.user?.login || 'Unknown',
                actorId: prStats.merged_by?.id ? String(prStats.merged_by.id) : undefined,
                details: {
                  prNumber: pr.number,
                  prTitle: pr.title,
                  prUrl: pr.html_url,
                },
              });
            }
          }

          imported++;
          if (imported >= maxPulls) break;
        }

        page++;
      }

      if (prRecords.length > 0) {
        this.prRepo.createMany(prRecords);
      }

      if (events.length > 0) {
        this.lifecycleEventRepo.createMany(events);
        const caseStudy = this.caseStudyRepo.findById(caseStudyId);
        if (caseStudy) {
          this.caseStudyRepo.update(caseStudyId, {
            eventCount: caseStudy.eventCount + events.length,
          });
        }
      }

      return { prsImported: prRecords.length, prEvents: events.length };
    } catch (error) {
      const caseStudy = this.caseStudyRepo.findById(caseStudyId);
      if (caseStudy) {
        this.caseStudyRepo.update(caseStudyId, {
          status: 'error',
          errorMessage: `GitHub PR import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
      throw error;
    }
  }

  /**
   * Import a specific commit with full details
   */
  async importCommitDetails(
    _caseStudyId: string,
    owner: string,
    repo: string,
    sha: string
  ): Promise<GitHubCommitData> {
    const response = await this.octokit.rest.repos.getCommit({
      owner,
      repo,
      ref: sha,
    });

    return response.data as unknown as GitHubCommitData;
  }

  private toNormalizedEvent(
    event: Omit<LifecycleEvent, 'id' | 'createdAt'>
  ): Omit<NormalizedEvent, 'id' | 'createdAt'> {
    return {
      caseStudyId: event.caseStudyId,
      ticketKey: event.ticketKey,
      eventType: event.eventType,
      eventSource: event.eventSource,
      occurredAt: event.eventDate,
      actorName: event.actorName,
      actorId: event.actorId,
      discipline: event.discipline,
      complexitySize: event.complexitySize,
      details: event.details as Record<string, unknown>,
    };
  }
}
