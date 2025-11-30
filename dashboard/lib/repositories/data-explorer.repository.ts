import type Database from 'better-sqlite3';
import { getDatabase } from '@/lib/db';
import type { EventType, JiraTicket, LifecycleEvent } from '@/lib/types';
import type { NormalizedEvent } from '@/lib/types/normalized-event';

export type DataExplorerItemType = 'ticket' | 'event' | 'normalized_event';

export interface DataExplorerFilters {
  caseStudyId: string;
  type?: DataExplorerItemType;
  search?: string;
  phase?: string;
  discipline?: string;
  complexity?: string;
  status?: string;
  excludedOnly?: boolean;
  hasOverrides?: boolean;
}

export interface DataExplorerResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface OverrideUpdate {
  phaseOverride?: string | null;
  disciplineOverride?: string | null;
  complexityOverride?: string | null;
  excludedFromMetrics?: boolean;
  customLabels?: string[];
}

export class DataExplorerRepository {
  private db: Database.Database;

  constructor(database?: Database.Database) {
    this.db = database || getDatabase();
  }

  findTickets(
    filters: DataExplorerFilters,
    limit = 50,
    offset = 0
  ): DataExplorerResult<JiraTicket> {
    const { whereClause, params } = this.buildTicketWhereClause(filters);

    const countStmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM jira_tickets ${whereClause}
    `);
    const countResult = countStmt.get(params) as { count: number };

    // Build complete params object with limit and offset
    const queryParams: Record<string, unknown> = { ...params };
    queryParams.limit = limit;
    queryParams.offset = offset;
    const dataStmt = this.db.prepare(`
      SELECT * FROM jira_tickets
      ${whereClause}
      ORDER BY updated_at DESC
      LIMIT @limit OFFSET @offset
    `);
    const rows = dataStmt.all(queryParams) as JiraTicketRow[];

    return {
      data: rows.map((row) => this.mapRowToTicket(row)),
      total: countResult.count,
      limit,
      offset,
    };
  }

  findEvents(
    filters: DataExplorerFilters,
    limit = 50,
    offset = 0
  ): DataExplorerResult<LifecycleEvent> {
    const { whereClause, params } = this.buildEventWhereClause(filters);

    const countStmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM lifecycle_events ${whereClause}
    `);
    const countResult = countStmt.get(params) as { count: number };

    // Build complete params object with limit and offset
    const queryParams: Record<string, unknown> = { ...params };
    queryParams.limit = limit;
    queryParams.offset = offset;
    const dataStmt = this.db.prepare(`
      SELECT * FROM lifecycle_events
      ${whereClause}
      ORDER BY event_date DESC
      LIMIT @limit OFFSET @offset
    `);
    const rows = dataStmt.all(queryParams) as LifecycleEventRow[];

    return {
      data: rows.map((row) => this.mapRowToEvent(row)),
      total: countResult.count,
      limit,
      offset,
    };
  }

  findNormalizedEvents(
    filters: DataExplorerFilters,
    limit = 50,
    offset = 0
  ): DataExplorerResult<NormalizedEvent> {
    const { whereClause, params } = this.buildNormalizedEventWhereClause(filters);

    const countStmt = this.db.prepare(`
      SELECT COUNT(*) as count FROM normalized_events ${whereClause}
    `);
    const countResult = countStmt.get(params) as { count: number };

    // Build complete params object with limit and offset
    const queryParams: Record<string, unknown> = { ...params };
    queryParams.limit = limit;
    queryParams.offset = offset;
    const dataStmt = this.db.prepare(`
      SELECT * FROM normalized_events
      ${whereClause}
      ORDER BY occurred_at DESC
      LIMIT @limit OFFSET @offset
    `);
    const rows = dataStmt.all(queryParams) as NormalizedEventRow[];

    return {
      data: rows.map((row) => this.mapRowToNormalizedEvent(row)),
      total: countResult.count,
      limit,
      offset,
    };
  }

  updateTicketOverrides(id: string, updates: OverrideUpdate): JiraTicket | undefined {
    const setClauses: string[] = [];
    const params: Record<string, unknown> = { id };

    if (updates.phaseOverride !== undefined) {
      setClauses.push('phase_override = @phaseOverride');
      params.phaseOverride = updates.phaseOverride;
    }
    if (updates.disciplineOverride !== undefined) {
      setClauses.push('discipline_override = @disciplineOverride');
      params.disciplineOverride = updates.disciplineOverride;
    }
    if (updates.complexityOverride !== undefined) {
      setClauses.push('complexity_override = @complexityOverride');
      params.complexityOverride = updates.complexityOverride;
    }
    if (updates.excludedFromMetrics !== undefined) {
      setClauses.push('excluded_from_metrics = @excludedFromMetrics');
      params.excludedFromMetrics = updates.excludedFromMetrics ? 1 : 0;
    }
    if (updates.customLabels !== undefined) {
      setClauses.push('custom_labels = @customLabels');
      params.customLabels = JSON.stringify(updates.customLabels);
    }

    if (setClauses.length === 0) return this.getTicketById(id);

    setClauses.push('override_modified_at = @modifiedAt');
    params.modifiedAt = new Date().toISOString();

    const stmt = this.db.prepare(`
      UPDATE jira_tickets
      SET ${setClauses.join(', ')}
      WHERE id = @id
    `);
    stmt.run(params);

    return this.getTicketById(id);
  }

  updateEventOverrides(id: string, updates: OverrideUpdate): LifecycleEvent | undefined {
    const setClauses: string[] = [];
    const params: Record<string, unknown> = { id };

    if (updates.phaseOverride !== undefined) {
      setClauses.push('phase_override = @phaseOverride');
      params.phaseOverride = updates.phaseOverride;
    }
    if (updates.disciplineOverride !== undefined) {
      setClauses.push('discipline_override = @disciplineOverride');
      params.disciplineOverride = updates.disciplineOverride;
    }
    if (updates.excludedFromMetrics !== undefined) {
      setClauses.push('excluded_from_metrics = @excludedFromMetrics');
      params.excludedFromMetrics = updates.excludedFromMetrics ? 1 : 0;
    }

    if (setClauses.length === 0) return this.getEventById(id);

    setClauses.push('override_modified_at = @modifiedAt');
    params.modifiedAt = new Date().toISOString();

    const stmt = this.db.prepare(`
      UPDATE lifecycle_events
      SET ${setClauses.join(', ')}
      WHERE id = @id
    `);
    stmt.run(params);

    return this.getEventById(id);
  }

  updateNormalizedEventOverrides(id: string, updates: OverrideUpdate): NormalizedEvent | undefined {
    const setClauses: string[] = [];
    const params: Record<string, unknown> = { id };

    if (updates.phaseOverride !== undefined) {
      setClauses.push('phase_override = @phaseOverride');
      params.phaseOverride = updates.phaseOverride;
    }
    if (updates.disciplineOverride !== undefined) {
      setClauses.push('discipline_override = @disciplineOverride');
      params.disciplineOverride = updates.disciplineOverride;
    }
    if (updates.excludedFromMetrics !== undefined) {
      setClauses.push('excluded_from_metrics = @excludedFromMetrics');
      params.excludedFromMetrics = updates.excludedFromMetrics ? 1 : 0;
    }

    if (setClauses.length === 0) return this.getNormalizedEventById(id);

    setClauses.push('override_modified_at = @modifiedAt');
    params.modifiedAt = new Date().toISOString();

    const stmt = this.db.prepare(`
      UPDATE normalized_events
      SET ${setClauses.join(', ')}
      WHERE id = @id
    `);
    stmt.run(params);

    return this.getNormalizedEventById(id);
  }

  bulkUpdateTickets(ids: string[], updates: OverrideUpdate): number {
    const setClauses: string[] = [];
    const params: Record<string, unknown> = {};

    if (updates.phaseOverride !== undefined) {
      setClauses.push('phase_override = @phaseOverride');
      params.phaseOverride = updates.phaseOverride;
    }
    if (updates.disciplineOverride !== undefined) {
      setClauses.push('discipline_override = @disciplineOverride');
      params.disciplineOverride = updates.disciplineOverride;
    }
    if (updates.complexityOverride !== undefined) {
      setClauses.push('complexity_override = @complexityOverride');
      params.complexityOverride = updates.complexityOverride;
    }
    if (updates.excludedFromMetrics !== undefined) {
      setClauses.push('excluded_from_metrics = @excludedFromMetrics');
      params.excludedFromMetrics = updates.excludedFromMetrics ? 1 : 0;
    }
    if (updates.customLabels !== undefined) {
      setClauses.push('custom_labels = @customLabels');
      params.customLabels = JSON.stringify(updates.customLabels);
    }

    if (setClauses.length === 0) return 0;

    setClauses.push('override_modified_at = @modifiedAt');
    params.modifiedAt = new Date().toISOString();

    const placeholders = ids.map((_, i) => `@id${i}`).join(', ');
    ids.forEach((id, i) => {
      params[`id${i}`] = id;
    });

    const stmt = this.db.prepare(`
      UPDATE jira_tickets
      SET ${setClauses.join(', ')}
      WHERE id IN (${placeholders})
    `);
    const result = stmt.run(params);
    return result.changes;
  }

  bulkUpdateEvents(ids: string[], updates: OverrideUpdate): number {
    const setClauses: string[] = [];
    const params: Record<string, unknown> = {};

    if (updates.phaseOverride !== undefined) {
      setClauses.push('phase_override = @phaseOverride');
      params.phaseOverride = updates.phaseOverride;
    }
    if (updates.disciplineOverride !== undefined) {
      setClauses.push('discipline_override = @disciplineOverride');
      params.disciplineOverride = updates.disciplineOverride;
    }
    if (updates.excludedFromMetrics !== undefined) {
      setClauses.push('excluded_from_metrics = @excludedFromMetrics');
      params.excludedFromMetrics = updates.excludedFromMetrics ? 1 : 0;
    }

    if (setClauses.length === 0) return 0;

    setClauses.push('override_modified_at = @modifiedAt');
    params.modifiedAt = new Date().toISOString();

    const placeholders = ids.map((_, i) => `@id${i}`).join(', ');
    ids.forEach((id, i) => {
      params[`id${i}`] = id;
    });

    const stmt = this.db.prepare(`
      UPDATE lifecycle_events
      SET ${setClauses.join(', ')}
      WHERE id IN (${placeholders})
    `);
    const result = stmt.run(params);
    return result.changes;
  }

  bulkUpdateNormalizedEvents(ids: string[], updates: OverrideUpdate): number {
    const setClauses: string[] = [];
    const params: Record<string, unknown> = {};

    if (updates.phaseOverride !== undefined) {
      setClauses.push('phase_override = @phaseOverride');
      params.phaseOverride = updates.phaseOverride;
    }
    if (updates.disciplineOverride !== undefined) {
      setClauses.push('discipline_override = @disciplineOverride');
      params.disciplineOverride = updates.disciplineOverride;
    }
    if (updates.excludedFromMetrics !== undefined) {
      setClauses.push('excluded_from_metrics = @excludedFromMetrics');
      params.excludedFromMetrics = updates.excludedFromMetrics ? 1 : 0;
    }

    if (setClauses.length === 0) return 0;

    setClauses.push('override_modified_at = @modifiedAt');
    params.modifiedAt = new Date().toISOString();

    const placeholders = ids.map((_, i) => `@id${i}`).join(', ');
    ids.forEach((id, i) => {
      params[`id${i}`] = id;
    });

    const stmt = this.db.prepare(`
      UPDATE normalized_events
      SET ${setClauses.join(', ')}
      WHERE id IN (${placeholders})
    `);
    const result = stmt.run(params);
    return result.changes;
  }

  private getTicketById(id: string): JiraTicket | undefined {
    const stmt = this.db.prepare('SELECT * FROM jira_tickets WHERE id = ?');
    const row = stmt.get(id) as JiraTicketRow | undefined;
    return row ? this.mapRowToTicket(row) : undefined;
  }

  private getEventById(id: string): LifecycleEvent | undefined {
    const stmt = this.db.prepare('SELECT * FROM lifecycle_events WHERE id = ?');
    const row = stmt.get(id) as LifecycleEventRow | undefined;
    return row ? this.mapRowToEvent(row) : undefined;
  }

  private getNormalizedEventById(id: string): NormalizedEvent | undefined {
    const stmt = this.db.prepare('SELECT * FROM normalized_events WHERE id = ?');
    const row = stmt.get(id) as NormalizedEventRow | undefined;
    return row ? this.mapRowToNormalizedEvent(row) : undefined;
  }

  private buildTicketWhereClause(filters: DataExplorerFilters): {
    whereClause: string;
    params: Record<string, unknown>;
  } {
    const conditions: string[] = ['case_study_id = @caseStudyId'];
    const params: Record<string, unknown> = { caseStudyId: filters.caseStudyId };

    if (filters.search) {
      conditions.push('(jira_key LIKE @search OR summary LIKE @search)');
      params.search = `%${filters.search}%`;
    }
    if (filters.phase) {
      conditions.push('phase_override = @phase');
      params.phase = filters.phase;
    }
    if (filters.discipline) {
      conditions.push(
        '(discipline_override = @discipline OR (discipline_override IS NULL AND discipline = @discipline))'
      );
      params.discipline = filters.discipline;
    }
    if (filters.complexity) {
      conditions.push(
        '(complexity_override = @complexity OR (complexity_override IS NULL AND complexity_size = @complexity))'
      );
      params.complexity = filters.complexity;
    }
    if (filters.status) {
      conditions.push('current_status = @status');
      params.status = filters.status;
    }
    if (filters.excludedOnly) {
      conditions.push('excluded_from_metrics = 1');
    }
    if (filters.hasOverrides) {
      conditions.push(
        '(phase_override IS NOT NULL OR discipline_override IS NOT NULL OR complexity_override IS NOT NULL OR excluded_from_metrics = 1)'
      );
    }

    return {
      whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
      params,
    };
  }

  private buildEventWhereClause(filters: DataExplorerFilters): {
    whereClause: string;
    params: Record<string, unknown>;
  } {
    const conditions: string[] = ['case_study_id = @caseStudyId'];
    const params: Record<string, unknown> = { caseStudyId: filters.caseStudyId };

    if (filters.search) {
      conditions.push('(ticket_key LIKE @search OR event_type LIKE @search)');
      params.search = `%${filters.search}%`;
    }
    if (filters.phase) {
      conditions.push('phase_override = @phase');
      params.phase = filters.phase;
    }
    if (filters.discipline) {
      conditions.push(
        '(discipline_override = @discipline OR (discipline_override IS NULL AND discipline = @discipline))'
      );
      params.discipline = filters.discipline;
    }
    if (filters.excludedOnly) {
      conditions.push('excluded_from_metrics = 1');
    }
    if (filters.hasOverrides) {
      conditions.push(
        '(phase_override IS NOT NULL OR discipline_override IS NOT NULL OR excluded_from_metrics = 1)'
      );
    }

    return {
      whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
      params,
    };
  }

  private buildNormalizedEventWhereClause(filters: DataExplorerFilters): {
    whereClause: string;
    params: Record<string, unknown>;
  } {
    const conditions: string[] = ['case_study_id = @caseStudyId'];
    const params: Record<string, unknown> = { caseStudyId: filters.caseStudyId };

    if (filters.search) {
      conditions.push('(ticket_key LIKE @search OR event_type LIKE @search)');
      params.search = `%${filters.search}%`;
    }
    if (filters.phase) {
      conditions.push('phase_override = @phase');
      params.phase = filters.phase;
    }
    if (filters.discipline) {
      conditions.push(
        '(discipline_override = @discipline OR (discipline_override IS NULL AND discipline = @discipline))'
      );
      params.discipline = filters.discipline;
    }
    if (filters.excludedOnly) {
      conditions.push('excluded_from_metrics = 1');
    }
    if (filters.hasOverrides) {
      conditions.push(
        '(phase_override IS NOT NULL OR discipline_override IS NOT NULL OR excluded_from_metrics = 1)'
      );
    }

    return {
      whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
      params,
    };
  }

  private mapRowToTicket(row: JiraTicketRow): JiraTicket {
    return {
      id: row.id,
      caseStudyId: row.case_study_id,
      jiraId: row.jira_id,
      jiraKey: row.jira_key,
      summary: row.summary,
      description: row.description || undefined,
      issueType: row.issue_type,
      priority: row.priority || 'Unknown',
      currentStatus: row.current_status,
      statusCategory: row.status_category as 'To Do' | 'In Progress' | 'Done',
      assigneeId: row.assignee_id || undefined,
      assigneeName: row.assignee_name || undefined,
      reporterId: row.reporter_id || undefined,
      reporterName: row.reporter_name || undefined,
      sprintId: row.sprint_id || undefined,
      sprintName: row.sprint_name || undefined,
      storyPoints: row.story_points || undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      resolvedAt: row.resolved_at ? new Date(row.resolved_at) : undefined,
      dueDate: row.due_date ? new Date(row.due_date) : undefined,
      leadTime: row.lead_time || undefined,
      cycleTime: row.cycle_time || undefined,
      complexityScore: row.complexity_score || undefined,
      complexitySize: row.complexity_size as 'XS' | 'S' | 'M' | 'L' | 'XL' | undefined,
      complexityFactors: row.complexity_factors ? JSON.parse(row.complexity_factors) : undefined,
      discipline: row.discipline || undefined,
      aiFlag: row.ai_flag === 1,
      rawJiraData: JSON.parse(row.raw_jira_data),
      phaseOverride: row.phase_override || undefined,
      disciplineOverride: row.discipline_override || undefined,
      complexityOverride: row.complexity_override as 'XS' | 'S' | 'M' | 'L' | 'XL' | undefined,
      excludedFromMetrics: row.excluded_from_metrics === 1,
      customLabels: row.custom_labels ? JSON.parse(row.custom_labels) : undefined,
      overrideModifiedAt: row.override_modified_at ? new Date(row.override_modified_at) : undefined,
    };
  }

  private mapRowToEvent(row: LifecycleEventRow): LifecycleEvent {
    return {
      id: row.id,
      caseStudyId: row.case_study_id,
      ticketKey: row.ticket_key,
      eventType: row.event_type as EventType,
      eventSource: row.event_source as 'jira' | 'github',
      eventDate: new Date(row.event_date),
      actorName: row.actor_name || '',
      actorId: row.actor_id || undefined,
      details: JSON.parse(row.details),
      discipline: row.discipline || undefined,
      complexitySize: row.complexity_size as 'XS' | 'S' | 'M' | 'L' | 'XL' | undefined,
      createdAt: new Date(row.created_at),
      phaseOverride: row.phase_override || undefined,
      disciplineOverride: row.discipline_override || undefined,
      excludedFromMetrics: row.excluded_from_metrics === 1,
      overrideModifiedAt: row.override_modified_at ? new Date(row.override_modified_at) : undefined,
    };
  }

  private mapRowToNormalizedEvent(row: NormalizedEventRow): NormalizedEvent {
    return {
      id: row.id,
      caseStudyId: row.case_study_id,
      ticketKey: row.ticket_key,
      eventType: row.event_type as EventType,
      eventSource: row.event_source as 'jira' | 'github',
      occurredAt: new Date(row.occurred_at),
      actorName: row.actor_name || '',
      actorId: row.actor_id || undefined,
      discipline: row.discipline || undefined,
      complexitySize: row.complexity_size as 'XS' | 'S' | 'M' | 'L' | 'XL' | undefined,
      details: row.details ? JSON.parse(row.details) : undefined,
      createdAt: new Date(row.created_at),
      phaseOverride: row.phase_override || undefined,
      disciplineOverride: row.discipline_override || undefined,
      excludedFromMetrics: row.excluded_from_metrics === 1,
      overrideModifiedAt: row.override_modified_at ? new Date(row.override_modified_at) : undefined,
    };
  }
}

interface JiraTicketRow {
  id: string;
  case_study_id: string;
  jira_id: string;
  jira_key: string;
  summary: string;
  description: string | null;
  issue_type: string;
  priority: string | null;
  current_status: string;
  status_category: string;
  assignee_id: string | null;
  assignee_name: string | null;
  reporter_id: string | null;
  reporter_name: string | null;
  sprint_id: string | null;
  sprint_name: string | null;
  story_points: number | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  due_date: string | null;
  lead_time: number | null;
  cycle_time: number | null;
  complexity_score: number | null;
  complexity_size: string | null;
  complexity_factors: string | null;
  discipline: string | null;
  ai_flag: number;
  raw_jira_data: string;
  phase_override: string | null;
  discipline_override: string | null;
  complexity_override: string | null;
  excluded_from_metrics: number;
  custom_labels: string | null;
  override_modified_at: string | null;
}

interface LifecycleEventRow {
  id: string;
  case_study_id: string;
  ticket_key: string;
  event_type: string;
  event_source: string;
  event_date: string;
  actor_name: string;
  actor_id: string | null;
  details: string;
  discipline: string | null;
  complexity_size: string | null;
  created_at: string;
  phase_override: string | null;
  discipline_override: string | null;
  excluded_from_metrics: number;
  override_modified_at: string | null;
}

interface NormalizedEventRow {
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
  phase_override: string | null;
  discipline_override: string | null;
  excluded_from_metrics: number;
  override_modified_at: string | null;
}
