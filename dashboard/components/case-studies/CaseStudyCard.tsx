import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { CaseStudy } from '@/lib/types';

interface CaseStudyCardProps {
  caseStudy: CaseStudy;
}

export function CaseStudyCard({ caseStudy }: CaseStudyCardProps) {
  const statusColors = {
    importing: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };

  return (
    <Link href={`/case-studies/${caseStudy.id}`}>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{caseStudy.name}</CardTitle>
              <CardDescription>
                {caseStudy.jiraProjectKey} • {caseStudy.githubOwner}/{caseStudy.githubRepo}
              </CardDescription>
            </div>
            <Badge className={statusColors[caseStudy.status]}>{caseStudy.status}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-zinc-500 dark:text-zinc-400">Tickets</p>
              <p className="font-semibold">{caseStudy.ticketCount}</p>
            </div>
            <div>
              <p className="text-zinc-500 dark:text-zinc-400">Events</p>
              <p className="font-semibold">{caseStudy.eventCount}</p>
            </div>
            <div>
              <p className="text-zinc-500 dark:text-zinc-400">Type</p>
              <p className="font-semibold capitalize">{caseStudy.type}</p>
            </div>
            <div>
              <p className="text-zinc-500 dark:text-zinc-400">Imported</p>
              <p className="font-semibold">{new Date(caseStudy.importedAt).toLocaleDateString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
