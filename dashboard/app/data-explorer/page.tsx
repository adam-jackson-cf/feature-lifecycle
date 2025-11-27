'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { DataExplorerView } from '@/components/data-explorer/DataExplorerView';
import { Header } from '@/components/layout/Header';

export default function DataExplorerPage() {
  const searchParams = useSearchParams();
  const caseStudyId = searchParams.get('caseStudyId') || '';

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Data Explorer</h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            View, filter, and correct source data. Override phase, discipline, complexity, or
            exclude items from metrics.
          </p>
        </div>

        {caseStudyId ? (
          <DataExplorerView caseStudyId={caseStudyId} />
        ) : (
          <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
            <p>Select a case study to explore its data.</p>
            <p className="mt-2 text-sm">
              Navigate from a case study dashboard to access its data explorer.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
