import { NextResponse } from 'next/server';
import { z } from 'zod';
import { JiraTicketRepository } from '@/lib/repositories/jira-ticket.repository';

const paramsSchema = z.object({
  caseStudyId: z.string().uuid(),
});

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(
      headers
        .map((h) => {
          const val = row[h];
          if (val === null || val === undefined) return '';
          const str = String(val).replace(/"/g, '""');
          return `"${str}"`;
        })
        .join(',')
    );
  }
  return lines.join('\n');
}

export async function GET(req: Request, { params }: { params: Promise<{ caseStudyId: string }> }) {
  try {
    const { caseStudyId } = paramsSchema.parse(await params);
    const url = new URL(req.url);
    const format = url.searchParams.get('format') || 'csv';
    if (format !== 'csv') {
      return NextResponse.json({ error: 'Only csv export is supported' }, { status: 400 });
    }
    const jiraRepo = new JiraTicketRepository();
    const tickets = jiraRepo.findByCaseStudy(caseStudyId);

    const rows = tickets.map((t) => ({
      key: t.jiraKey,
      summary: t.summary,
      status: t.currentStatus,
      discipline: t.discipline || '',
      complexitySize: t.complexitySize || '',
      complexityScore: t.complexityScore ?? '',
      aiFlag: t.aiFlag ? 'yes' : 'no',
      leadTimeMs: t.leadTime ?? '',
      cycleTimeMs: t.cycleTime ?? '',
      storyPoints: t.storyPoints ?? '',
    }));

    const csv = toCsv(rows);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="case-study-export.csv"',
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error' }, { status: 400 });
    }
    console.error('export error', error);
    return NextResponse.json({ error: 'Failed to export metrics' }, { status: 500 });
  }
}
