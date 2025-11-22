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

  try {
    const files = readFileSync(
      join(migrationsDir, '001_add_complexity_discipline_ai.sql'),
      'utf-8'
    );
    // Check if migration has already been applied by checking if columns exist
    const tableInfo = database.prepare('PRAGMA table_info(jira_tickets)').all() as Array<{
      name: string;
    }>;
    const hasComplexityScore = tableInfo.some((col) => col.name === 'complexity_score');

    if (!hasComplexityScore) {
      database.exec(files);
    }
  } catch (error) {
    // Migration file doesn't exist or already applied - that's okay
    console.warn('Migration warning:', error);
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
