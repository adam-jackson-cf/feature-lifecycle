import { ArrowRight, Calendar, FolderGit2, Ticket, Zap } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { CaseStudy } from '@/lib/types';

interface CaseStudyCardProps {
  caseStudy: CaseStudy;
}

export function CaseStudyCard({ caseStudy }: CaseStudyCardProps) {
  const statusConfig = {
    importing: {
      badge: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
      indicator: 'bg-amber-500',
      pulse: true,
    },
    completed: {
      badge: 'bg-primary/10 text-primary border-primary/20',
      indicator: 'bg-primary',
      pulse: false,
    },
    error: {
      badge: 'bg-destructive/10 text-destructive border-destructive/20',
      indicator: 'bg-destructive',
      pulse: false,
    },
  };

  const status = statusConfig[caseStudy.status];

  return (
    <Link href={`/case-studies/${caseStudy.id}`} className="group block">
      <Card className="relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-primary/30 group-hover:-translate-y-0.5">
        {/* Status indicator bar */}
        <div className={`absolute top-0 left-0 right-0 h-1 ${status.indicator}`} />

        <CardHeader className="pb-3 pt-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg leading-tight truncate group-hover:text-primary transition-colors">
                {caseStudy.name}
              </h3>
              <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
                <FolderGit2 className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">
                  {caseStudy.jiraProjectKey} • {caseStudy.githubOwner}/{caseStudy.githubRepo}
                </span>
              </div>
            </div>
            <Badge variant="outline" className={`flex-shrink-0 ${status.badge}`}>
              {status.pulse && (
                <span className="relative mr-1.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                </span>
              )}
              {caseStudy.status}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50">
              <Ticket className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-lg font-semibold leading-none">{caseStudy.ticketCount}</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
                  Tickets
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/50">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-lg font-semibold leading-none">{caseStudy.eventCount}</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5">
                  Events
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4 pt-3 border-t">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>Imported {new Date(caseStudy.importedAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
              View details
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
