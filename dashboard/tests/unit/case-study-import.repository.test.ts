import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CaseStudyRepository } from '@/lib/repositories/case-study.repository';
import { CaseStudyImportRepository } from '@/lib/repositories/case-study-import.repository';

describe('CaseStudyImportRepository', () => {
  let db: Database.Database;
  let importRepo: CaseStudyImportRepository;
  let caseStudyRepo: CaseStudyRepository;
  let caseStudyId: string;

  beforeEach(() => {
    // Create in-memory database for testing
    db = new Database(':memory:');

    // Initialize schema
    db.pragma('foreign_keys = ON');
    const schemaPath = path.join(__dirname, '../../lib/db/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    db.exec(schema);

    // Run migrations to ensure case_study_imports table exists
    const migrationsDir = path.join(__dirname, '../../lib/db/migrations');
    const migration004 = fs.readFileSync(
      path.join(migrationsDir, '004_case_study_imports.sql'),
      'utf-8'
    );
    db.exec(migration004);

    // Create repositories
    importRepo = new CaseStudyImportRepository(db);
    caseStudyRepo = new CaseStudyRepository(db);

    // Create a test case study
    const caseStudy = caseStudyRepo.create({
      name: 'Test Case Study',
      jiraProjectKey: 'KAFKA',
      githubOwner: 'apache',
      githubRepo: 'kafka',
      importedAt: new Date(),
      ticketCount: 0,
      eventCount: 0,
      startDate: new Date(),
      endDate: new Date(),
      status: 'importing',
    });
    caseStudyId = caseStudy.id;
  });

  afterEach(() => {
    db.close();
  });

  it('should create a case study import', () => {
    const importRecord = importRepo.create({
      caseStudyId,
      importType: 'project',
      jiraProjectKey: 'KAFKA',
      status: 'importing',
      ticketCount: 0,
      eventCount: 0,
    });

    expect(importRecord.id).toBeDefined();
    expect(importRecord.caseStudyId).toBe(caseStudyId);
    expect(importRecord.importType).toBe('project');
    expect(importRecord.status).toBe('importing');
    expect(importRecord.createdAt).toBeInstanceOf(Date);
    expect(importRecord.updatedAt).toBeInstanceOf(Date);
  });

  it('should find import by ID', () => {
    const created = importRepo.create({
      caseStudyId,
      importType: 'feature',
      jiraProjectKey: 'KAFKA',
      jiraLabel: 'checkout-flow',
      status: 'completed',
      ticketCount: 10,
      eventCount: 50,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
    });

    const found = importRepo.findById(created.id);
    expect(found).toBeDefined();
    expect(found?.id).toBe(created.id);
    expect(found?.importType).toBe('feature');
    expect(found?.jiraLabel).toBe('checkout-flow');
    expect(found?.ticketCount).toBe(10);
  });

  it('should find all imports for a case study', () => {
    // Create multiple imports
    const import1 = importRepo.create({
      caseStudyId,
      importType: 'project',
      jiraProjectKey: 'KAFKA',
      status: 'completed',
      ticketCount: 5,
      eventCount: 25,
    });

    const import2 = importRepo.create({
      caseStudyId,
      importType: 'feature',
      jiraProjectKey: 'KAFKA',
      jiraLabel: 'payment-gateway',
      status: 'completed',
      ticketCount: 3,
      eventCount: 15,
    });

    const imports = importRepo.findByCaseStudy(caseStudyId);
    expect(imports.length).toBe(2);
    expect(imports.map((i) => i.id)).toContain(import1.id);
    expect(imports.map((i) => i.id)).toContain(import2.id);
  });

  it('should find imports by type', () => {
    importRepo.create({
      caseStudyId,
      importType: 'project',
      jiraProjectKey: 'KAFKA',
      status: 'completed',
      ticketCount: 5,
      eventCount: 25,
    });

    const featureImport = importRepo.create({
      caseStudyId,
      importType: 'feature',
      jiraProjectKey: 'KAFKA',
      jiraLabel: 'checkout',
      status: 'completed',
      ticketCount: 3,
      eventCount: 15,
    });

    const featureImports = importRepo.findByType(caseStudyId, 'feature');
    expect(featureImports.length).toBe(1);
    expect(featureImports[0].id).toBe(featureImport.id);
  });

  it('should find imports by status', () => {
    const importing = importRepo.create({
      caseStudyId,
      importType: 'project',
      jiraProjectKey: 'KAFKA',
      status: 'importing',
      ticketCount: 0,
      eventCount: 0,
    });

    importRepo.create({
      caseStudyId,
      importType: 'feature',
      jiraProjectKey: 'KAFKA',
      jiraLabel: 'checkout',
      status: 'completed',
      ticketCount: 3,
      eventCount: 15,
    });

    const importingImports = importRepo.findByStatus(caseStudyId, 'importing');
    expect(importingImports.length).toBe(1);
    expect(importingImports[0].id).toBe(importing.id);
  });

  it('should update import', () => {
    const created = importRepo.create({
      caseStudyId,
      importType: 'project',
      jiraProjectKey: 'KAFKA',
      status: 'importing',
      ticketCount: 0,
      eventCount: 0,
    });

    const updated = importRepo.update(created.id, {
      status: 'completed',
      ticketCount: 10,
      eventCount: 50,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
    });

    expect(updated).toBeDefined();
    expect(updated?.status).toBe('completed');
    expect(updated?.ticketCount).toBe(10);
    expect(updated?.eventCount).toBe(50);
    // Updated timestamp should be >= created timestamp (may be equal if update happens quickly)
    expect(updated?.updatedAt.getTime()).toBeGreaterThanOrEqual(created.updatedAt.getTime());
  });

  it('should delete import', () => {
    const created = importRepo.create({
      caseStudyId,
      importType: 'project',
      jiraProjectKey: 'KAFKA',
      status: 'completed',
      ticketCount: 5,
      eventCount: 25,
    });

    const deleted = importRepo.delete(created.id);
    expect(deleted).toBe(true);

    const found = importRepo.findById(created.id);
    expect(found).toBeUndefined();
  });

  it('should support all import types', () => {
    const types: Array<'project' | 'sprint' | 'ticket' | 'feature'> = [
      'project',
      'sprint',
      'ticket',
      'feature',
    ];

    for (const type of types) {
      const importRecord = importRepo.create({
        caseStudyId,
        importType: type,
        jiraProjectKey: 'KAFKA',
        status: 'completed',
        ticketCount: 1,
        eventCount: 5,
      });

      expect(importRecord.importType).toBe(type);
    }

    const allImports = importRepo.findByCaseStudy(caseStudyId);
    expect(allImports.length).toBe(4);
  });
});
