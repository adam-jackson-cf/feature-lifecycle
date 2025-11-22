'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useCaseStudies } from '@/lib/hooks/useCaseStudies';
import { CaseStudyCard } from './CaseStudyCard';

export function CaseStudyList() {
  const { data: caseStudies, isLoading, error } = useCaseStudies();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-zinc-500">Loading case studies...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-red-500">Error loading case studies</p>
      </div>
    );
  }

  if (!caseStudies || caseStudies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-zinc-500 mb-4">No case studies yet</p>
        <Link href="/import/new">
          <Button>Create Your First Import</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {caseStudies.map((caseStudy) => (
        <CaseStudyCard key={caseStudy.id} caseStudy={caseStudy} />
      ))}
    </div>
  );
}
