import { TimelineView } from '@/components/dashboard/TimelineView';
import { Header } from '@/components/layout/Header';

export default async function TimelinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <TimelineView caseStudyId={id} />
      </main>
    </div>
  );
}
