import { type NextRequest, NextResponse } from 'next/server';
import { CaseStudyRepository } from '@/lib/repositories/case-study.repository';

const caseStudyRepository = new CaseStudyRepository();

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ caseStudyId: string }> }
) {
  try {
    const { caseStudyId } = await params;
    const caseStudy = caseStudyRepository.findById(caseStudyId);

    if (!caseStudy) {
      return NextResponse.json({ error: 'Case study not found' }, { status: 404 });
    }

    return NextResponse.json(caseStudy);
  } catch (error) {
    console.error('Error fetching case study:', error);
    return NextResponse.json({ error: 'Failed to fetch case study' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ caseStudyId: string }> }
) {
  try {
    const { caseStudyId } = await params;
    const deleted = caseStudyRepository.delete(caseStudyId);

    if (!deleted) {
      return NextResponse.json({ error: 'Case study not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting case study:', error);
    return NextResponse.json({ error: 'Failed to delete case study' }, { status: 500 });
  }
}
