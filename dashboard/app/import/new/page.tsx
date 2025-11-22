import { ImportWizard } from '@/components/import/ImportWizard';
import { Header } from '@/components/layout/Header';

export default function ImportPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">New Import</h1>
        <ImportWizard />
      </main>
    </div>
  );
}
