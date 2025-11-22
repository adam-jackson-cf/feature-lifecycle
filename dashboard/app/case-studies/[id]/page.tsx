import { DashboardView } from '@/components/dashboard/DashboardView';
import { Header } from '@/components/layout/Header';

export default function CaseStudyPage({ params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <DashboardView caseStudyId={params.id} />
      </main>
    </div>
  );
}
