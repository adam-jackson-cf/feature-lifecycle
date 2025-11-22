import { Header } from '@/components/layout/Header';
import { RulesEditor } from '@/components/rules/RulesEditor';

export default function RulesPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Rules Configuration</h1>
        <RulesEditor />
      </main>
    </div>
  );
}
