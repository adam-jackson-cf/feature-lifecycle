import type {
  CaseStudy,
  GitHubPullRequest,
  JiraTicket,
  LifecycleEvent,
  NormalizedEvent,
} from '@/lib/types';

/**
 * Interface for Case Study repository
 */
export interface ICaseStudyRepository {
  create(data: Omit<CaseStudy, 'id' | 'createdAt'>): CaseStudy;
  findById(id: string): CaseStudy | undefined;
  findAll(): CaseStudy[];
  findByStatus(status: CaseStudy['status']): CaseStudy[];
  findByType(type: CaseStudy['type']): CaseStudy[];
  update(id: string, updates: Partial<Omit<CaseStudy, 'id'>>): CaseStudy | undefined;
  delete(id: string): boolean;
  countByStatus(): Map<CaseStudy['status'], number>;
}

/**
 * Interface for Jira Ticket repository
 */
export interface IJiraTicketRepository {
  create(data: Omit<JiraTicket, 'id'>): JiraTicket;
  createMany(tickets: Omit<JiraTicket, 'id'>[]): JiraTicket[];
  findById(id: string): JiraTicket | undefined;
  findByKey(jiraKey: string): JiraTicket | undefined;
  findByCaseStudy(caseStudyId: string): JiraTicket[];
  findByStatus(caseStudyId: string, status: string): JiraTicket[];
  findByStatusCategory(caseStudyId: string, category: JiraTicket['statusCategory']): JiraTicket[];
  findBySprint(caseStudyId: string, sprintId: string): JiraTicket[];
  listSprints(caseStudyId: string): { id: string; name?: string; ticketCount: number }[];
  update(
    id: string,
    updates: Partial<Omit<JiraTicket, 'id' | 'caseStudyId' | 'jiraId' | 'jiraKey'>>
  ): JiraTicket | undefined;
  delete(id: string): boolean;
  countByStatus(caseStudyId: string): Map<string, number>;
  getAverageMetrics(caseStudyId: string): {
    avgLeadTime: number;
    avgCycleTime: number;
    avgStoryPoints: number;
  };
}

/**
 * Interface for Lifecycle Event repository
 */
export interface ILifecycleEventRepository {
  create(data: Omit<LifecycleEvent, 'id' | 'createdAt'>): LifecycleEvent;
  createMany(events: Omit<LifecycleEvent, 'id' | 'createdAt'>[]): LifecycleEvent[];
  findById(id: string): LifecycleEvent | undefined;
  findByCaseStudy(caseStudyId: string): LifecycleEvent[];
  findByTicket(ticketKey: string): LifecycleEvent[];
  findByType(caseStudyId: string, eventType: string): LifecycleEvent[];
  findBySource(caseStudyId: string, source: 'jira' | 'github'): LifecycleEvent[];
  findByDateRange(caseStudyId: string, startDate: Date, endDate: Date): LifecycleEvent[];
  getTicketTimeline(ticketKey: string): LifecycleEvent[];
  getTimelineByTickets(caseStudyId: string): Map<string, LifecycleEvent[]>;
  delete(id: string): boolean;
  deleteByCaseStudy(caseStudyId: string): number;
  countByType(caseStudyId: string): Map<string, number>;
  countBySource(caseStudyId: string): { jira: number; github: number };
}

/**
 * Interface for GitHub Pull Request repository
 */
export interface IGithubPullRequestRepository {
  create(pr: Omit<GitHubPullRequest, 'id'>): GitHubPullRequest;
  createMany(prs: Omit<GitHubPullRequest, 'id'>[]): GitHubPullRequest[];
  countByCaseStudy(caseStudyId: string): number;
  findByCaseStudy(caseStudyId: string): GitHubPullRequest[];
}

/**
 * Interface for Normalized Event repository
 */
export interface INormalizedEventRepository {
  create(event: Omit<NormalizedEvent, 'id' | 'createdAt'>): NormalizedEvent;
  createMany(events: Omit<NormalizedEvent, 'id' | 'createdAt'>[]): NormalizedEvent[];
  findByCaseStudy(caseStudyId: string): NormalizedEvent[];
  findByTicket(ticketKey: string): NormalizedEvent[];
  deleteByCaseStudy(caseStudyId: string): number;
}
