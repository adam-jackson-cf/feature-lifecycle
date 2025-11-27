// Canonical normalized lifecycle event used for effort analytics

import type { EventType } from './index';

export type NormalizedEventSource = 'jira' | 'github';

export interface NormalizedEvent {
  id: string;
  caseStudyId: string;
  ticketKey: string;
  eventType: EventType;
  eventSource: NormalizedEventSource;
  occurredAt: Date;
  actorName: string;
  actorId?: string;
  discipline?: string;
  complexitySize?: 'XS' | 'S' | 'M' | 'L' | 'XL';
  details?: Record<string, unknown>;
  createdAt: Date;

  // Override columns (manual corrections - NULL = use derived/original)
  phaseOverride?: string;
  disciplineOverride?: string;
  excludedFromMetrics?: boolean;
  overrideModifiedAt?: Date;
}

export interface NormalizedEventRow {
  id: string;
  case_study_id: string;
  ticket_key: string;
  event_type: string;
  event_source: string;
  occurred_at: string;
  actor_name: string;
  actor_id: string | null;
  discipline: string | null;
  complexity_size: string | null;
  details: string | null;
  created_at: string;
}
