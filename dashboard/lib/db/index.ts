import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import Database from 'better-sqlite3';

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (db) {
    return db;
  }

  const dbPath = process.env.DATABASE_PATH || join(process.cwd(), 'data', 'lifecycle.db');

  // Ensure directory exists
  const dbDir = join(dbPath, '..');
  try {
    const { mkdirSync } = require('node:fs');
    mkdirSync(dbDir, { recursive: true });
  } catch {
    // Directory might already exist or we're in build mode
  }

  db = new Database(dbPath);

  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Enable WAL mode for better performance
  db.pragma('journal_mode = WAL');

  // Initialize schema if needed (lazy initialization)
  try {
    initializeDatabase();
  } catch (error) {
    // Log but don't throw - database might already be initialized
    console.warn('Database initialization warning:', error);
  }

  return db;
}

export function initializeDatabase(): void {
  const database = getDatabase();
  const schemaPath = join(__dirname, 'schema.sql');

  try {
    const schema = readFileSync(schemaPath, 'utf-8');
    // Execute schema
    database.exec(schema);
  } catch (error) {
    // If schema file doesn't exist or can't be read, try alternative path
    const altSchemaPath = join(process.cwd(), 'lib', 'db', 'schema.sql');
    try {
      const schema = readFileSync(altSchemaPath, 'utf-8');
      database.exec(schema);
    } catch (altError) {
      console.error('Failed to initialize database schema:', error);
      throw altError;
    }
  }

  // Run migrations
  runMigrations(database);
}

function runMigrations(database: Database.Database): void {
  const migrationsDir = join(__dirname, 'migrations');

  // Migration 001: complexity/discipline fields
  try {
    const file001 = readFileSync(
      join(migrationsDir, '001_add_complexity_discipline_ai.sql'),
      'utf-8'
    );
    const tableInfo = database.prepare('PRAGMA table_info(jira_tickets)').all() as Array<{
      name: string;
    }>;
    const hasComplexityScore = tableInfo.some((col) => col.name === 'complexity_score');
    if (!hasComplexityScore) {
      database.exec(file001);
    }
  } catch (error) {
    console.warn('Migration warning (001):', error);
  }

  // Migration 002: normalized events table
  try {
    const tableInfo = database.prepare('PRAGMA table_info(normalized_events)').all() as Array<{
      name: string;
    }>;
    const hasNormalized = tableInfo.length > 0;
    if (!hasNormalized) {
      const file002 = readFileSync(join(migrationsDir, '002_add_normalized_events.sql'), 'utf-8');
      database.exec(file002);
    }
  } catch (error) {
    console.warn('Migration warning (002):', error);
  }

  // Migration 003: override columns for manual corrections
  try {
    const tableInfo = database.prepare('PRAGMA table_info(jira_tickets)').all() as Array<{
      name: string;
    }>;
    const hasPhaseOverride = tableInfo.some((col) => col.name === 'phase_override');
    if (!hasPhaseOverride) {
      const file003 = readFileSync(join(migrationsDir, '003_add_override_columns.sql'), 'utf-8');
      // Execute each ALTER TABLE separately since SQLite doesn't support multiple in one statement
      const statements = file003
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      for (const statement of statements) {
        try {
          database.exec(statement);
        } catch (stmtError) {
          // Column might already exist from partial migration
          console.warn('Migration 003 statement warning:', stmtError);
        }
      }
    }
  } catch (error) {
    console.warn('Migration warning (003):', error);
  }
}

// Don't initialize on module load - let it be lazy
// Database will be initialized when first accessed via getDatabase()

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

// Helper function to convert database row dates to Date objects
export function parseDate(dateString: string | null): Date | undefined {
  if (!dateString) return undefined;
  return new Date(dateString);
}

// Helper function to parse JSON fields
export function parseJson<T>(jsonString: string | null): T | undefined {
  if (!jsonString) return undefined;
  try {
    return JSON.parse(jsonString) as T;
  } catch {
    return undefined;
  }
}
