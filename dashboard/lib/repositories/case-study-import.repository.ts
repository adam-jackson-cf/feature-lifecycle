import type Database from 'better-sqlite3';
import { getDatabase, parseDate } from '@/lib/db';
import type { CaseStudyImport, CaseStudyImportRow } from '@/lib/types';
import { generateId } from '@/lib/utils';

export class CaseStudyImportRepository {
  private db: Database.Database;

  constructor(database?: Database.Database) {
    this.db = database || getDatabase();
  }

  /**
   * Create a new case study import
   */
  create(data: Omit<CaseStudyImport, 'id' | 'createdAt' | 'updatedAt'>): CaseStudyImport {
    const id = generateId();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO case_study_imports (
        id, case_study_id, import_type, jira_project_key, jira_project_id,
        jira_sprint_id, jira_ticket_key, jira_label, status, ticket_count,
        event_count, start_date, end_date, error_message, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      data.caseStudyId,
      data.importType,
      data.jiraProjectKey,
      data.jiraProjectId || null,
      data.jiraSprintId || null,
      data.jiraTicketKey || null,
      data.jiraLabel || null,
      data.status,
      data.ticketCount,
      data.eventCount,
      data.startDate?.toISOString() || null,
      data.endDate?.toISOString() || null,
      data.errorMessage || null,
      now,
      now
    );

    return {
      ...data,
      id,
      createdAt: new Date(now),
      updatedAt: new Date(now),
    };
  }

  /**
   * Find import by ID
   */
  findById(id: string): CaseStudyImport | undefined {
    const stmt = this.db.prepare('SELECT * FROM case_study_imports WHERE id = ?');
    const row = stmt.get(id) as CaseStudyImportRow | undefined;

    return row ? this.mapRowToImport(row) : undefined;
  }

  /**
   * Find all imports for a case study
   */
  findByCaseStudy(caseStudyId: string): CaseStudyImport[] {
    const stmt = this.db.prepare(
      'SELECT * FROM case_study_imports WHERE case_study_id = ? ORDER BY created_at DESC'
    );
    const rows = stmt.all(caseStudyId) as CaseStudyImportRow[];

    return rows.map((row) => this.mapRowToImport(row));
  }

  /**
   * Find imports by type
   */
  findByType(caseStudyId: string, importType: CaseStudyImport['importType']): CaseStudyImport[] {
    const stmt = this.db.prepare(
      'SELECT * FROM case_study_imports WHERE case_study_id = ? AND import_type = ? ORDER BY created_at DESC'
    );
    const rows = stmt.all(caseStudyId, importType) as CaseStudyImportRow[];

    return rows.map((row) => this.mapRowToImport(row));
  }

  /**
   * Find imports by status
   */
  findByStatus(caseStudyId: string, status: CaseStudyImport['status']): CaseStudyImport[] {
    const stmt = this.db.prepare(
      'SELECT * FROM case_study_imports WHERE case_study_id = ? AND status = ? ORDER BY created_at DESC'
    );
    const rows = stmt.all(caseStudyId, status) as CaseStudyImportRow[];

    return rows.map((row) => this.mapRowToImport(row));
  }

  /**
   * Update import
   */
  update(
    id: string,
    updates: Partial<Omit<CaseStudyImport, 'id' | 'createdAt' | 'updatedAt'>>
  ): CaseStudyImport | undefined {
    const existing = this.findById(id);
    if (!existing) return undefined;

    const fields: string[] = [];
    const values: unknown[] = [];

    if (updates.status !== undefined) {
      fields.push('status = ?');
      values.push(updates.status);
    }
    if (updates.ticketCount !== undefined) {
      fields.push('ticket_count = ?');
      values.push(updates.ticketCount);
    }
    if (updates.eventCount !== undefined) {
      fields.push('event_count = ?');
      values.push(updates.eventCount);
    }
    if (updates.startDate !== undefined) {
      fields.push('start_date = ?');
      values.push(updates.startDate.toISOString());
    }
    if (updates.endDate !== undefined) {
      fields.push('end_date = ?');
      values.push(updates.endDate.toISOString());
    }
    if (updates.errorMessage !== undefined) {
      fields.push('error_message = ?');
      values.push(updates.errorMessage);
    }

    if (fields.length === 0) return existing;

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    const stmt = this.db.prepare(`UPDATE case_study_imports SET ${fields.join(', ')} WHERE id = ?`);
    stmt.run(...values);

    return this.findById(id);
  }

  /**
   * Delete import
   */
  delete(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM case_study_imports WHERE id = ?');
    const result = stmt.run(id);

    return result.changes > 0;
  }

  /**
   * Map database row to CaseStudyImport entity
   */
  private mapRowToImport(row: CaseStudyImportRow): CaseStudyImport {
    return {
      id: row.id,
      caseStudyId: row.case_study_id,
      importType: row.import_type as CaseStudyImport['importType'],
      jiraProjectKey: row.jira_project_key,
      jiraProjectId: row.jira_project_id || undefined,
      jiraSprintId: row.jira_sprint_id || undefined,
      jiraTicketKey: row.jira_ticket_key || undefined,
      jiraLabel: row.jira_label || undefined,
      status: row.status as CaseStudyImport['status'],
      ticketCount: row.ticket_count,
      eventCount: row.event_count,
      startDate: parseDate(row.start_date) || undefined,
      endDate: parseDate(row.end_date) || undefined,
      errorMessage: row.error_message || undefined,
      createdAt: parseDate(row.created_at) || new Date(),
      updatedAt: parseDate(row.updated_at) || new Date(),
    };
  }
}
