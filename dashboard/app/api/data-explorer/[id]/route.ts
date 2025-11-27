import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { DataExplorerRepository } from '@/lib/repositories/data-explorer.repository';
import type { JiraTicket, LifecycleEvent } from '@/lib/types';
import type { NormalizedEvent } from '@/lib/types/normalized-event';

const paramsSchema = z.object({
  id: z.string().min(1),
});

const updateSchema = z.object({
  type: z.enum(['ticket', 'event', 'normalized_event']),
  updates: z.object({
    phaseOverride: z.string().nullable().optional(),
    disciplineOverride: z.string().nullable().optional(),
    complexityOverride: z.enum(['XS', 'S', 'M', 'L', 'XL']).nullable().optional(),
    excludedFromMetrics: z.boolean().optional(),
    customLabels: z.array(z.string()).optional(),
  }),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = paramsSchema.parse(await params);
    const body = await req.json();
    const { type, updates } = updateSchema.parse(body);

    const repo = new DataExplorerRepository();
    let result: JiraTicket | LifecycleEvent | NormalizedEvent | undefined;

    if (type === 'ticket') {
      result = repo.updateTicketOverrides(id, updates);
    } else if (type === 'event') {
      result = repo.updateEventOverrides(id, updates);
    } else if (type === 'normalized_event') {
      result = repo.updateNormalizedEventOverrides(id, updates);
    }

    if (!result) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    console.error('data-explorer single PATCH error', error);
    return NextResponse.json({ error: 'Failed to update record' }, { status: 500 });
  }
}
