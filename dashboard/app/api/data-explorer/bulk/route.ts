import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { DataExplorerRepository } from '@/lib/repositories/data-explorer.repository';

const bulkUpdateSchema = z.object({
  type: z.enum(['ticket', 'event', 'normalized_event']),
  ids: z.array(z.string().min(1)).min(1).max(500),
  updates: z.object({
    phaseOverride: z.string().nullable().optional(),
    disciplineOverride: z.string().nullable().optional(),
    complexityOverride: z.enum(['XS', 'S', 'M', 'L', 'XL']).nullable().optional(),
    excludedFromMetrics: z.boolean().optional(),
    customLabels: z.array(z.string()).optional(),
  }),
});

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, ids, updates } = bulkUpdateSchema.parse(body);

    const repo = new DataExplorerRepository();
    let updatedCount = 0;

    if (type === 'ticket') {
      updatedCount = repo.bulkUpdateTickets(ids, updates);
    } else if (type === 'event') {
      updatedCount = repo.bulkUpdateEvents(ids, updates);
    } else if (type === 'normalized_event') {
      updatedCount = repo.bulkUpdateNormalizedEvents(ids, updates);
    }

    return NextResponse.json({ updatedCount });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    console.error('data-explorer bulk PATCH error', error);
    return NextResponse.json({ error: 'Failed to update records' }, { status: 500 });
  }
}
