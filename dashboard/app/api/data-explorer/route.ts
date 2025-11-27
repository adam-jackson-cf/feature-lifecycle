import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  type DataExplorerItemType,
  DataExplorerRepository,
} from '@/lib/repositories/data-explorer.repository';

const querySchema = z.object({
  caseStudyId: z.string().min(1),
  type: z.enum(['ticket', 'event', 'normalized_event']).optional(),
  search: z.string().optional(),
  phase: z.string().optional(),
  discipline: z.string().optional(),
  complexity: z.string().optional(),
  status: z.string().optional(),
  excludedOnly: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
  hasOverrides: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 50)),
  offset: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 0)),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const params = Object.fromEntries(searchParams.entries());
    const filters = querySchema.parse(params);

    const repo = new DataExplorerRepository();
    const type: DataExplorerItemType = filters.type || 'ticket';

    const filterOptions = {
      caseStudyId: filters.caseStudyId,
      type,
      search: filters.search,
      phase: filters.phase,
      discipline: filters.discipline,
      complexity: filters.complexity,
      status: filters.status,
      excludedOnly: filters.excludedOnly,
      hasOverrides: filters.hasOverrides,
    };

    if (type === 'ticket') {
      const result = repo.findTickets(filterOptions, filters.limit, filters.offset);
      return NextResponse.json(result);
    }

    if (type === 'event') {
      const result = repo.findEvents(filterOptions, filters.limit, filters.offset);
      return NextResponse.json(result);
    }

    if (type === 'normalized_event') {
      const result = repo.findNormalizedEvents(filterOptions, filters.limit, filters.offset);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    console.error('data-explorer GET error', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
