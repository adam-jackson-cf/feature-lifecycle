import type Database from 'better-sqlite3';
import { getDatabase, parseDate, parseJson } from '@/lib/db';
import type { GitHubPullRequest, GitHubPullRequestRow } from '@/lib/types';
import { generateId, safeJsonStringify } from '@/lib/utils';

export class GithubPullRequestRepository {
  private db: Database.Database;

  constructor(database?: Database.Database) {
    this.db = database || getDatabase();
  }

  create(pr: Omit<GitHubPullRequest, 'id'>): GitHubPullRequest {
    const id = generateId();
    const stmt = this.db.prepare(`
      INSERT INTO github_pull_requests (
        id, case_study_id, ticket_keys, pr_number, title, description, state,
        author_name, created_at, updated_at, closed_at, merged_at, base_branch, head_branch,
        additions, deletions, commits_count, reviewers, approved_by, url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      pr.caseStudyId,
      safeJsonStringify(pr.ticketKeys),
      pr.prNumber,
      pr.title,
      pr.description || null,
      pr.state,
      pr.authorName,
      pr.createdAt.toISOString(),
      pr.updatedAt.toISOString(),
      pr.closedAt?.toISOString() || null,
      pr.mergedAt?.toISOString() || null,
      pr.baseBranch,
      pr.headBranch,
      pr.additions,
      pr.deletions,
      pr.commitsCount,
      pr.reviewers ? safeJsonStringify(pr.reviewers) : null,
      pr.approvedBy ? safeJsonStringify(pr.approvedBy) : null,
      pr.url
    );

    return { ...pr, id };
  }

  createMany(prs: Omit<GitHubPullRequest, 'id'>[]): GitHubPullRequest[] {
    const insertMany = this.db.transaction((batch: Omit<GitHubPullRequest, 'id'>[]) => {
      const created: GitHubPullRequest[] = [];
      for (const pr of batch) {
        created.push(this.create(pr));
      }
      return created;
    });

    return insertMany(prs);
  }

  countByCaseStudy(caseStudyId: string): number {
    const stmt = this.db.prepare(
      'SELECT COUNT(*) as count FROM github_pull_requests WHERE case_study_id = ?'
    );
    const row = stmt.get(caseStudyId) as { count: number };
    return row.count || 0;
  }

  findByCaseStudy(caseStudyId: string): GitHubPullRequest[] {
    const stmt = this.db.prepare(
      'SELECT * FROM github_pull_requests WHERE case_study_id = ? ORDER BY created_at DESC'
    );
    const rows = stmt.all(caseStudyId) as GitHubPullRequestRow[];
    return rows.map((row) => this.mapRowToPR(row));
  }

  private mapRowToPR(row: GitHubPullRequestRow): GitHubPullRequest {
    return {
      id: row.id,
      caseStudyId: row.case_study_id,
      ticketKeys: parseJson(row.ticket_keys) || [],
      prNumber: row.pr_number,
      title: row.title,
      description: row.description || undefined,
      state: row.state,
      authorName: row.author_name,
      createdAt: parseDate(row.created_at) || new Date(),
      updatedAt: parseDate(row.updated_at) || new Date(),
      closedAt: parseDate(row.closed_at),
      mergedAt: parseDate(row.merged_at),
      baseBranch: row.base_branch,
      headBranch: row.head_branch,
      additions: row.additions,
      deletions: row.deletions,
      commitsCount: row.commits_count,
      reviewers: parseJson(row.reviewers) || [],
      approvedBy: parseJson(row.approved_by) || [],
      url: row.url,
    };
  }
}
