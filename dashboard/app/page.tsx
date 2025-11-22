import Link from 'next/link';
import { CaseStudyList } from '@/components/case-studies/CaseStudyList';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Case Studies</h1>
            <p className="text-zinc-600 dark:text-zinc-400 mt-2">
              Track the complete development lifecycle of your features
            </p>
          </div>
          <Link href="/import/new">
            <Button>New Import</Button>
          </Link>
        </div>
        <CaseStudyList />
      </main>
    </div>
  );
}
