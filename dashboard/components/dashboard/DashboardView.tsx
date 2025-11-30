'use client';

import { Download } from 'lucide-react';
import Link from 'next/link';
import { DataExplorerView } from '@/components/data-explorer/DataExplorerView';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCaseStudy } from '@/lib/hooks/useCaseStudy';
import { useMetrics } from '@/lib/hooks/useMetrics';
import { DataQualityTab } from './DataQualityTab';
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
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span className="text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  if (caseStudyLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span className="text-muted-foreground">Loading case study...</span>
        </div>
      </div>
    );
  }

  if (!caseStudy) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-lg font-medium text-foreground">Case study not found</p>
          <p className="text-sm text-muted-foreground mt-1">
            The requested case study could not be loaded.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between animate-fade-in-up">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Link href="/" className="hover:text-foreground transition-colors">
              Case Studies
            </Link>
            <span>/</span>
            <span className="text-foreground">{caseStudy.jiraProjectKey}</span>
          </div>
          <h1 className="text-3xl font-bold font-display tracking-tight text-foreground">
            {caseStudy.name}
          </h1>
          <p className="text-muted-foreground mt-2 flex items-center gap-2 text-sm">
            <span className="px-2 py-0.5 rounded-md bg-muted font-mono text-xs">
              {caseStudy.jiraProjectKey}
            </span>
            <span className="text-border">•</span>
            <span className="font-mono text-xs">
              {caseStudy.githubOwner}/{caseStudy.githubRepo}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm" className="gap-2">
            <a
              href={`/api/metrics/${caseStudyId}/exports?format=csv`}
              aria-label="Export dashboard data as CSV"
              download
            >
              <Download className="h-4 w-4" />
              Export CSV
            </a>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="glass-subtle shadow-glass p-1 h-auto">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-2"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="flow"
            className="data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-2"
          >
            Flow
          </TabsTrigger>
          <TabsTrigger
            value="data-explorer"
            className="data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-2"
          >
            Data Explorer
          </TabsTrigger>
          <TabsTrigger
            value="data-quality"
            className="data-[state=active]:bg-background data-[state=active]:shadow-sm px-4 py-2"
          >
            Data Quality
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Metrics Loading/Error States */}
          {metricsLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                <span className="text-muted-foreground">Loading metrics...</span>
              </div>
            </div>
          )}

          {metricsError && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center animate-fade-in-up">
              <p className="text-sm text-destructive font-medium">
                Failed to load metrics. Please retry or check your connection.
              </p>
            </div>
          )}

          {/* Metrics Cards */}
          {metrics && <MetricsCards metrics={metrics} />}

          {/* Bento Grid - Charts */}
          <div className="grid gap-4 md:grid-cols-2">
            <PhaseDistributionView caseStudyId={caseStudyId} />
            <StatusDistribution caseStudyId={caseStudyId} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <EffortComplexityView caseStudyId={caseStudyId} />
            <DisciplineDistributionChart caseStudyId={caseStudyId} />
          </div>

          {/* Full Width Charts */}
          <TimeMetricsChart caseStudyId={caseStudyId} />
        </TabsContent>

        <TabsContent value="flow" className="mt-6">
          <TimelineView caseStudyId={caseStudyId} />
        </TabsContent>

        <TabsContent value="data-explorer" className="mt-6">
          <DataExplorerView caseStudyId={caseStudyId} />
        </TabsContent>

        <TabsContent value="data-quality" className="mt-6">
          <DataQualityTab caseStudyId={caseStudyId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
