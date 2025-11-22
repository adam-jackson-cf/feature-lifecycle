import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { CaseStudyRepository } from '@/lib/repositories/case-study.repository';

const caseStudyRepository = new CaseStudyRepository();

const createCaseStudySchema = z.object({
  name: z.string().min(1),
  type: z.enum(['project', 'sprint', 'ticket']),
  jiraProjectKey: z.string().min(1),
  jiraProjectId: z.string().optional(),
  jiraSprintId: z.string().optional(),
  jiraTicketKey: z.string().optional(),
  githubOwner: z.string().min(1),
  githubRepo: z.string().min(1),
});

export async function GET() {
  try {
    const caseStudies = caseStudyRepository.findAll();
    return NextResponse.json(caseStudies);
  } catch (error) {
    console.error('Error fetching case studies:', error);
    return NextResponse.json({ error: 'Failed to fetch case studies' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createCaseStudySchema.parse(body);

    const caseStudy = caseStudyRepository.create({
      ...validatedData,
      importedAt: new Date(),
      ticketCount: 0,
      eventCount: 0,
      startDate: new Date(),
      endDate: new Date(),
      status: 'importing',
    });

    return NextResponse.json(caseStudy, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating case study:', error);
    return NextResponse.json({ error: 'Failed to create case study' }, { status: 500 });
  }
}
