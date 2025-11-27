import type Database from 'better-sqlite3';
import { getDatabase, parseDate, parseJson } from '@/lib/db';
import type { NormalizedEvent, NormalizedEventRow } from '@/lib/types';
import { generateId, safeJsonStringify } from '@/lib/utils';
import type { INormalizedEventRepository } from './interfaces';

export class NormalizedEventRepository implements INormalizedEventRepository {
  private db: Database.Database;

  constructor(database?: Database.Database) {
    this.db = database || getDatabase();
  }

  create(event: Omit<NormalizedEvent, 'id' | 'createdAt'>): NormalizedEvent {
    const id = generateId();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO normalized_events (
        id, case_study_id, ticket_key, event_type, event_source, occurred_at,
        actor_name, actor_id, discipline, complexity_size, details, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      event.caseStudyId,
      event.ticketKey,
      event.eventType,
      event.eventSource,
      event.occurredAt.toISOString(),
      event.actorName,
      event.actorId || null,
      event.discipline || null,
      event.complexitySize || null,
      safeJsonStringify(event.details || {}),
      now
    );

    return { ...event, id, createdAt: new Date(now) };
  }

  createMany(events: Omit<NormalizedEvent, 'id' | 'createdAt'>[]): NormalizedEvent[] {
    const insertMany = this.db.transaction((items: Omit<NormalizedEvent, 'id' | 'createdAt'>[]) =>
      items.map((ev) => this.create(ev))
    );
    return insertMany(events);
  }

  findByCaseStudy(caseStudyId: string): NormalizedEvent[] {
    const rows = this.db
      .prepare('SELECT * FROM normalized_events WHERE case_study_id = ? ORDER BY occurred_at ASC')
      .all(caseStudyId) as NormalizedEventRow[];
    return rows.map(this.mapRowToEvent);
  }

  findByTicket(ticketKey: string): NormalizedEvent[] {
    const rows = this.db
      .prepare('SELECT * FROM normalized_events WHERE ticket_key = ? ORDER BY occurred_at ASC')
      .all(ticketKey) as NormalizedEventRow[];
    return rows.map(this.mapRowToEvent);
  }

  deleteByCaseStudy(caseStudyId: string): number {
    const result = this.db
      .prepare('DELETE FROM normalized_events WHERE case_study_id = ?')
      .run(caseStudyId);
    return result.changes;
  }

  private mapRowToEvent(row: NormalizedEventRow): NormalizedEvent {
    return {
      id: row.id,
      caseStudyId: row.case_study_id,
      ticketKey: row.ticket_key,
      eventType: row.event_type as NormalizedEvent['eventType'],
      eventSource: row.event_source as NormalizedEvent['eventSource'],
      occurredAt: parseDate(row.occurred_at) || new Date(),
      actorName: row.actor_name,
      actorId: row.actor_id || undefined,
      discipline: row.discipline || undefined,
      complexitySize: (row.complexity_size as NormalizedEvent['complexitySize']) || undefined,
      details: parseJson<Record<string, unknown>>(row.details || '{}') || {},
      createdAt: parseDate(row.created_at) || new Date(),
    };
  }
}
