import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import { CaseStudyRepository } from '@/lib/repositories/case-study.repository';

export async function GET() {
  try {
    const db = getDatabase();

    // Check database connection
    const dbStatus = db.open ? 'connected' : 'disconnected';

    // Get case studies for last import/export timestamps
    const caseStudyRepo = new CaseStudyRepository();
    const caseStudies = caseStudyRepo.findAll();

    const healthData = {
      database: {
        status: dbStatus,
        path: process.env.DATABASE_PATH || 'data/lifecycle.db',
      },
      caseStudies: caseStudies.map((cs) => ({
        id: cs.id,
        name: cs.name,
        lastImport: cs.importedAt.toISOString(),
        status: cs.status,
        ticketCount: cs.ticketCount,
        eventCount: cs.eventCount,
        dataFreshness: {
          daysSinceImport: Math.floor(
            (Date.now() - cs.importedAt.getTime()) / (1000 * 60 * 60 * 24)
          ),
        },
      })),
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(healthData);
  } catch (error) {
    console.error('Error checking health:', error);
    return NextResponse.json(
      {
        database: { status: 'error' },
        error: 'Health check failed',
      },
      { status: 500 }
    );
  }
}
