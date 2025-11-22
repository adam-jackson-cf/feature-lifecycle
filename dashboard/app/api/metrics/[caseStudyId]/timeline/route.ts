import { NextResponse } from 'next/server';
import { z } from 'zod';
import { LifecycleEventRepository } from '@/lib/repositories/lifecycle-event.repository';

const paramsSchema = z.object({
  caseStudyId: z.string().uuid(),
});

export async function GET(_req: Request, { params }: { params: Promise<{ caseStudyId: string }> }) {
  try {
    const { caseStudyId } = paramsSchema.parse(await params);
    const repo = new LifecycleEventRepository();
    const events = repo
      .findByCaseStudy(caseStudyId)
      .sort((a, b) => a.eventDate.getTime() - b.eventDate.getTime());
    return NextResponse.json(events);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error' }, { status: 400 });
    }
    console.error('timeline error', error);
    return NextResponse.json({ error: 'Failed to fetch timeline' }, { status: 500 });
  }
}
