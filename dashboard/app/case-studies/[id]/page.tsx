import { DashboardView } from '@/components/dashboard/DashboardView';
import { Header } from '@/components/layout/Header';

export default async function CaseStudyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <DashboardView caseStudyId={id} />
      </main>
    </div>
  );
}
