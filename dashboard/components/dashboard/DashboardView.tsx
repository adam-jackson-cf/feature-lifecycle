'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useCaseStudy } from '@/lib/hooks/useCaseStudy';
import { useMetrics } from '@/lib/hooks/useMetrics';
import { CycleTimeChart } from './CycleTimeChart';
import { EffortComplexityView } from './EffortComplexityView';
import { LeadTimeChart } from './LeadTimeChart';
import { MetricsCards } from './MetricsCards';
import { StatusDistribution } from './StatusDistribution';
import { TimelineView } from './TimelineView';
import { VelocityChart } from './VelocityChart';

interface DashboardViewProps {
  caseStudyId: string;
}

export function DashboardView({ caseStudyId }: DashboardViewProps) {
  const { data: caseStudy, isLoading: caseStudyLoading } = useCaseStudy(caseStudyId || '');
  const { data: metrics, isLoading: metricsLoading } = useMetrics(caseStudyId || '');

  if (!caseStudyId) {
    return <div>Loading...</div>;
  }

  if (caseStudyLoading) {
    return <div>Loading case study...</div>;
  }

  if (!caseStudy) {
    return <div>Case study not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{caseStudy.name}</h1>
          <p className="text-muted-foreground mt-2">
            {caseStudy.jiraProjectKey} • {caseStudy.githubOwner}/{caseStudy.githubRepo}
          </p>
        </div>
        <Link href={`/case-studies/${caseStudyId}/timeline`}>
          <Button variant="outline">View Full Timeline</Button>
        </Link>
      </div>

      {metricsLoading ? (
        <div>Loading metrics...</div>
      ) : metrics ? (
        <MetricsCards metrics={metrics} />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <CycleTimeChart caseStudyId={caseStudyId} />
        <LeadTimeChart caseStudyId={caseStudyId} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <StatusDistribution caseStudyId={caseStudyId} />
        <VelocityChart caseStudyId={caseStudyId} />
      </div>

      <EffortComplexityView caseStudyId={caseStudyId} />

      <TimelineView caseStudyId={caseStudyId} />
    </div>
  );
}
