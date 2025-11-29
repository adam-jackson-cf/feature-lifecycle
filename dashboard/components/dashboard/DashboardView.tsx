'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useCaseStudy } from '@/lib/hooks/useCaseStudy';
import { useMetrics } from '@/lib/hooks/useMetrics';
import { DataQualityView } from './DataQualityView';
import { DisciplineDistributionChart } from './DisciplineDistributionChart';
import { EffortComplexityView } from './EffortComplexityView';
import { MetricsCards } from './MetricsCards';
import { PhaseDistributionView } from './PhaseDistributionView';
import { StatusDistribution } from './StatusDistribution';
import { TimelineView } from './TimelineView';
import { TimeMetricsChart } from './TimeMetricsChart';

interface DashboardViewProps {
  caseStudyId: string;
}

export function DashboardView({ caseStudyId }: DashboardViewProps) {
  const { data: caseStudy, isLoading: caseStudyLoading } = useCaseStudy(caseStudyId || '');
  const {
    data: metrics,
    isLoading: metricsLoading,
    error: metricsError,
  } = useMetrics(caseStudyId || '');

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
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{caseStudy.name}</h1>
          <p className="text-muted-foreground mt-2">
            {caseStudy.jiraProjectKey} • {caseStudy.githubOwner}/{caseStudy.githubRepo}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <a
              href={`/api/metrics/${caseStudyId}/exports?format=csv`}
              aria-label="Export dashboard data as CSV"
              download
            >
              Export CSV
            </a>
          </Button>
          <Link href={`/data-explorer?caseStudyId=${caseStudyId}`}>
            <Button variant="outline">Data Explorer</Button>
          </Link>
          <Link href={`/case-studies/${caseStudyId}/timeline`}>
            <Button variant="secondary">View Full Timeline</Button>
          </Link>
        </div>
      </div>

      {metricsLoading && <div className="text-muted-foreground">Loading metrics...</div>}
      {metricsError && (
        <div className="rounded-lg border border-dashed bg-card/60 p-4 text-sm text-destructive">
          Failed to load metrics. Please retry or check your connection.
        </div>
      )}
      {metrics && <MetricsCards metrics={metrics} />}

      <div className="grid gap-4 md:grid-cols-2">
        <PhaseDistributionView caseStudyId={caseStudyId} />
        <StatusDistribution caseStudyId={caseStudyId} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <EffortComplexityView caseStudyId={caseStudyId} />
        <DisciplineDistributionChart caseStudyId={caseStudyId} />
      </div>

      <TimeMetricsChart caseStudyId={caseStudyId} />

      <DataQualityView caseStudyId={caseStudyId} />

      <TimelineView caseStudyId={caseStudyId} />
    </div>
  );
}
