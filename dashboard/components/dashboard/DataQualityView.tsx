'use client';

import { useQuery } from '@tanstack/react-query';
import { AlertCircle, AlertTriangle, CheckCircle2, ExternalLink, Info } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DataQualityViewProps {
  caseStudyId: string;
}

type Severity = 'critical' | 'warning' | 'info' | 'good';

interface QualityIssue {
  id: string;
  label: string;
  count: number;
  total: number;
  percentage: number;
  severity: Severity;
  guidance: string;
  filterParam?: string;
}

function getSeverity(percentage: number): Severity {
  if (percentage === 0) return 'good';
  if (percentage > 10) return 'critical';
  if (percentage >= 1) return 'warning';
  return 'info';
}

function getSeverityStyles(severity: Severity) {
  const styles = {
    critical: {
      bg: 'bg-destructive/10',
      border: 'border-destructive/20',
      text: 'text-destructive',
      icon: AlertCircle,
    },
    warning: {
      bg: 'bg-warning-muted',
      border: 'border-warning/20',
      text: 'text-warning-foreground',
      icon: AlertTriangle,
    },
    info: {
      bg: 'bg-info-muted',
      border: 'border-info/20',
      text: 'text-info-foreground',
      icon: Info,
    },
    good: {
      bg: 'bg-success-muted',
      border: 'border-success/20',
      text: 'text-success-foreground',
      icon: CheckCircle2,
    },
  };
  return styles[severity];
}

function QualityScoreBadge({ score }: { score: number }) {
  let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'default';
  if (score < 80) variant = 'destructive';
  else if (score < 95) variant = 'secondary';

  return (
    <Badge variant={variant} className="text-sm font-semibold px-3 py-1">
      {score}% Quality
    </Badge>
  );
}

function IssueCard({ issue, caseStudyId }: { issue: QualityIssue; caseStudyId: string }) {
  const styles = getSeverityStyles(issue.severity);
  const Icon = styles.icon;

  if (issue.severity === 'good') return null;

  return (
    <div className={`rounded-lg border ${styles.border} ${styles.bg} p-4 transition-colors`}>
      <div className="flex items-start gap-3">
        <Icon className={`h-5 w-5 mt-0.5 ${styles.text}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium text-sm">{issue.label}</p>
            <span className={`text-sm font-semibold ${styles.text}`}>
              {issue.count}/{issue.total}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {issue.percentage.toFixed(1)}% of tickets affected
          </p>
          <p className="text-xs text-muted-foreground mt-2">{issue.guidance}</p>
          {issue.filterParam && issue.count > 0 && (
            <Link
              href={`/data-explorer?caseStudyId=${caseStudyId}&${issue.filterParam}`}
              className="inline-flex items-center gap-1 text-xs text-accent hover:underline mt-2"
            >
              View affected tickets
              <ExternalLink className="h-3 w-3" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export function DataQualityView({ caseStudyId }: DataQualityViewProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['data-quality', caseStudyId],
    queryFn: async () => {
      const response = await fetch(`/api/health/data-quality?caseStudyId=${caseStudyId}`);
      if (!response.ok) throw new Error('Failed to load data quality');
      return response.json();
    },
    enabled: !!caseStudyId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Data Quality</CardTitle>
            <div className="h-6 w-24 animate-pulse rounded-full bg-muted" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-20 animate-pulse rounded-lg bg-muted" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Data Quality</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
            Unable to load data quality metrics. Please retry.
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalTickets = data?.rowCounts?.tickets || 0;
  const missing = data?.missingFields || {};
  const duplicates = data?.duplicates || { ticketKeys: [], count: 0 };

  // Build issues list
  const issues: QualityIssue[] = [
    {
      id: 'story-points',
      label: 'Missing story points',
      count: missing.storyPoints || 0,
      total: totalTickets,
      percentage: totalTickets > 0 ? ((missing.storyPoints || 0) / totalTickets) * 100 : 0,
      severity: getSeverity(
        totalTickets > 0 ? ((missing.storyPoints || 0) / totalTickets) * 100 : 0
      ),
      guidance: 'Story points help estimate effort and calculate velocity.',
      filterParam: 'filter=missingStoryPoints',
    },
    {
      id: 'sprint-ids',
      label: 'Missing sprint IDs',
      count: missing.sprintIds || 0,
      total: totalTickets,
      percentage: totalTickets > 0 ? ((missing.sprintIds || 0) / totalTickets) * 100 : 0,
      severity: getSeverity(totalTickets > 0 ? ((missing.sprintIds || 0) / totalTickets) * 100 : 0),
      guidance: 'Sprint IDs are needed to track velocity per sprint.',
      filterParam: 'filter=missingSprintId',
    },
    {
      id: 'labels',
      label: 'Missing labels',
      count: missing.labels || 0,
      total: totalTickets,
      percentage: totalTickets > 0 ? ((missing.labels || 0) / totalTickets) * 100 : 0,
      severity: getSeverity(totalTickets > 0 ? ((missing.labels || 0) / totalTickets) * 100 : 0),
      guidance: 'Labels help categorize tickets by discipline and type.',
      filterParam: 'filter=missingLabels',
    },
    {
      id: 'duplicates',
      label: 'Duplicate ticket keys',
      count: duplicates.count || 0,
      total: totalTickets,
      percentage: totalTickets > 0 ? ((duplicates.count || 0) / totalTickets) * 100 : 0,
      severity: getSeverity(totalTickets > 0 ? ((duplicates.count || 0) / totalTickets) * 100 : 0),
      guidance: 'Duplicates may cause inaccurate metrics and double-counting.',
    },
  ];

  // Calculate overall quality score
  const totalIssues = issues.reduce((sum, issue) => sum + issue.count, 0);
  const maxPossibleIssues = totalTickets * issues.length;
  const qualityScore =
    maxPossibleIssues > 0
      ? Math.round(((maxPossibleIssues - totalIssues) / maxPossibleIssues) * 100)
      : 100;

  const activeIssues = issues.filter((i) => i.severity !== 'good');
  const hasIssues = activeIssues.length > 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Data Quality</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {hasIssues
                ? `${activeIssues.length} issue${activeIssues.length > 1 ? 's' : ''} detected across ${totalTickets} tickets`
                : `All ${totalTickets} tickets pass quality checks`}
            </p>
          </div>
          <QualityScoreBadge score={qualityScore} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {!hasIssues ? (
          <div className="rounded-lg border border-success/20 bg-success-muted p-4 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <div>
              <p className="text-sm font-medium text-success-foreground">
                No data quality issues detected
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                All tickets have complete data for accurate metrics.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {activeIssues.map((issue) => (
              <IssueCard key={issue.id} issue={issue} caseStudyId={caseStudyId} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
