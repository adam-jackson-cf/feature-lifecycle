import Link from 'next/link';
import { AggregatePhaseView } from '@/components/dashboard/AggregatePhaseView';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';

export default function AggregatePage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Project Overview</h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Aggregated metrics across all completed case studies
            </p>
          </div>
          <Link href="/">
            <Button variant="outline">Back to Case Studies</Button>
          </Link>
        </div>

        <AggregatePhaseView />
      </main>
    </div>
  );
}
