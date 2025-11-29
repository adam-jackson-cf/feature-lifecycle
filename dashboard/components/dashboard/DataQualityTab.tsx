'use client';

import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Info,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DataQualityTabProps {
  caseStudyId: string;
}

type Severity = 'critical' | 'warning' | 'info' | 'good';

interface FieldCompleteness {
  complete: number;
  missing: number;
  total: number;
  percentage: number;
}

interface EffortBlocker {
  count: number;
  impact: string;
  severity: Severity;
}

interface TicketSummary {
  jiraKey: string;
  summary: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface DataQualityResponse {
  caseStudyId: string;
  missingFields: {
    storyPoints: number;
    sprintIds: number;
    labels: number;
  };
  duplicates: {
    ticketKeys: string[];
    count: number;
  };
  rowCounts: {
    tickets: number;
  };
  fieldCompleteness: {
    storyPoints: FieldCompleteness;
    sprintIds: FieldCompleteness;
    labels: FieldCompleteness;
  };
  effortBlockers: {
    closedWithoutStoryPoints: EffortBlocker;
    unassignedToSprint: EffortBlocker;
    missingDisciplineLabels: EffortBlocker;
  };
  affectedTickets?: {
    missingStoryPoints: TicketSummary[];
    missingSprintIds: TicketSummary[];
    missingLabels: TicketSummary[];
    duplicates: TicketSummary[];
    closedWithoutStoryPoints: TicketSummary[];
  };
}

function getSeverityStyles(severity: Severity) {
  const styles = {
    critical: {
      bg: 'bg-destructive/10',
      border: 'border-destructive/20',
      text: 'text-destructive',
      progressBg: 'bg-destructive',
      icon: AlertCircle,
    },
    warning: {
      bg: 'bg-warning-muted',
      border: 'border-warning/20',
      text: 'text-warning-foreground',
      progressBg: 'bg-warning',
      icon: AlertTriangle,
    },
    info: {
      bg: 'bg-info-muted',
      border: 'border-info/20',
      text: 'text-info-foreground',
      progressBg: 'bg-info',
      icon: Info,
    },
    good: {
      bg: 'bg-success-muted',
      border: 'border-success/20',
      text: 'text-success-foreground',
      progressBg: 'bg-success',
      icon: CheckCircle2,
    },
  };
  return styles[severity];
}

function getPercentageSeverity(percentage: number): Severity {
  if (percentage >= 95) return 'good';
  if (percentage >= 80) return 'warning';
  return 'critical';
}

function QualityScoreHeader({
  score,
  totalTickets,
  issueCount,
}: {
  score: number;
  totalTickets: number;
  issueCount: number;
}) {
  let variant: 'default' | 'secondary' | 'destructive' = 'default';
  if (score < 80) variant = 'destructive';
  else if (score < 95) variant = 'secondary';

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Data Quality Score</p>
              <p className="text-4xl font-bold">{score}%</p>
            </div>
          </div>
          <div className="flex gap-8">
            <div className="text-center">
              <p className="text-2xl font-semibold">{totalTickets}</p>
              <p className="text-sm text-muted-foreground">Total Tickets</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold">{issueCount}</p>
              <p className="text-sm text-muted-foreground">Issues Found</p>
            </div>
            <div className="text-center">
              <Badge variant={variant} className="text-lg px-3 py-1">
                {score >= 95 ? 'Excellent' : score >= 80 ? 'Good' : 'Needs Attention'}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FieldCompletenessCard({
  completeness,
}: {
  completeness: DataQualityResponse['fieldCompleteness'];
}) {
  const fields = [
    {
      key: 'storyPoints',
      label: 'Story Points',
      description: 'Required for effort & velocity calculations',
    },
    {
      key: 'sprintIds',
      label: 'Sprint IDs',
      description: 'Required for sprint tracking & velocity',
    },
    { key: 'labels', label: 'Labels', description: 'Used for discipline categorization' },
  ] as const;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Field Completeness</CardTitle>
        <p className="text-xs text-muted-foreground">
          Percentage of tickets with complete data for each field
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.map((field) => {
          const data = completeness[field.key];
          const severity = getPercentageSeverity(data.percentage);
          const styles = getSeverityStyles(severity);

          return (
            <div key={field.key} className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{field.label}</p>
                  <p className="text-xs text-muted-foreground">{field.description}</p>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-semibold ${styles.text}`}>{data.percentage}%</span>
                  <p className="text-xs text-muted-foreground">
                    {data.complete}/{data.total} tickets
                  </p>
                </div>
              </div>
              <div className="h-2 w-full rounded-full bg-muted">
                <div
                  className={`h-2 rounded-full transition-all ${styles.progressBg}`}
                  style={{ width: `${data.percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function EffortBlockersCard({
  blockers,
  caseStudyId,
}: {
  blockers: DataQualityResponse['effortBlockers'];
  caseStudyId: string;
}) {
  const blockerList = [
    {
      key: 'closedWithoutStoryPoints',
      label: 'Closed tickets without story points',
      data: blockers.closedWithoutStoryPoints,
      filterParam: 'filter=missingStoryPoints',
    },
    {
      key: 'unassignedToSprint',
      label: 'Tickets not assigned to sprints',
      data: blockers.unassignedToSprint,
      filterParam: 'filter=missingSprintId',
    },
    {
      key: 'missingDisciplineLabels',
      label: 'Missing discipline labels',
      data: blockers.missingDisciplineLabels,
      filterParam: 'filter=missingLabels',
    },
  ] as const;

  const hasBlockers = blockerList.some((b) => b.data.count > 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <AlertTriangle className="h-4 w-4 text-warning" />
          Effort Analysis Blockers
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Issues that prevent accurate effort spend calculations
        </p>
      </CardHeader>
      <CardContent>
        {!hasBlockers ? (
          <div className="rounded-lg border border-success/20 bg-success-muted p-4 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <div>
              <p className="text-sm font-medium text-success-foreground">
                No effort blockers detected
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                All tickets have sufficient data for accurate effort analysis.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {blockerList.map((blocker) => {
              if (blocker.data.count === 0) return null;
              const styles = getSeverityStyles(blocker.data.severity as Severity);
              const Icon = styles.icon;

              return (
                <div
                  key={blocker.key}
                  className={`rounded-lg border ${styles.border} ${styles.bg} p-4`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={`h-5 w-5 mt-0.5 ${styles.text}`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">{blocker.label}</p>
                        <span className={`text-sm font-semibold ${styles.text}`}>
                          {blocker.data.count} tickets
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{blocker.data.impact}</p>
                      <Link
                        href={`/data-explorer?caseStudyId=${caseStudyId}&${blocker.filterParam}`}
                        className="inline-flex items-center gap-1 text-xs text-accent hover:underline mt-2"
                      >
                        View affected tickets
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DrillDownSection({
  title,
  tickets,
  caseStudyId,
  filterParam,
  totalCount,
}: {
  title: string;
  tickets: TicketSummary[];
  caseStudyId: string;
  filterParam: string;
  totalCount: number;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (totalCount === 0) return null;

  return (
    <div className="border rounded-lg">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="font-medium text-sm">{title}</span>
        </div>
        <Badge variant="secondary">{totalCount} tickets</Badge>
      </button>
      {isExpanded && (
        <div className="border-t">
          <div className="max-h-[300px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted/80 backdrop-blur">
                <tr>
                  <th className="text-left p-3 font-medium">Key</th>
                  <th className="text-left p-3 font-medium">Summary</th>
                  <th className="text-left p-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.jiraKey} className="border-t hover:bg-muted/30">
                    <td className="p-3 font-mono text-xs">{ticket.jiraKey}</td>
                    <td className="p-3 truncate max-w-[300px]" title={ticket.summary}>
                      {ticket.summary}
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className="text-xs">
                        {ticket.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalCount > 50 && (
            <div className="border-t p-3 bg-muted/30">
              <Link
                href={`/data-explorer?caseStudyId=${caseStudyId}&${filterParam}`}
                className="inline-flex items-center gap-1 text-sm text-accent hover:underline"
              >
                View all {totalCount} tickets in Data Explorer
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function DataQualityTab({ caseStudyId }: DataQualityTabProps) {
  const { data, isLoading, error } = useQuery<DataQualityResponse>({
    queryKey: ['data-quality-expanded', caseStudyId],
    queryFn: async () => {
      const response = await fetch(
        `/api/health/data-quality?caseStudyId=${caseStudyId}&includeTickets=true`
      );
      if (!response.ok) throw new Error('Failed to load data quality');
      return response.json();
    },
    enabled: !!caseStudyId,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="h-24 animate-pulse rounded-lg bg-muted" />
          </CardContent>
        </Card>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardContent className="pt-6">
              <div className="h-48 animate-pulse rounded-lg bg-muted" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="h-48 animate-pulse rounded-lg bg-muted" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
            Unable to load data quality metrics. Please retry.
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate overall quality score
  const totalIssues =
    data.missingFields.storyPoints +
    data.missingFields.sprintIds +
    data.missingFields.labels +
    data.duplicates.count;
  const maxPossibleIssues = data.rowCounts.tickets * 4; // 4 types of issues
  const qualityScore =
    maxPossibleIssues > 0
      ? Math.round(((maxPossibleIssues - totalIssues) / maxPossibleIssues) * 100)
      : 100;

  const drillDownSections = [
    {
      title: 'Missing Story Points',
      tickets: data.affectedTickets?.missingStoryPoints || [],
      filterParam: 'filter=missingStoryPoints',
      totalCount: data.missingFields.storyPoints,
    },
    {
      title: 'Missing Sprint IDs',
      tickets: data.affectedTickets?.missingSprintIds || [],
      filterParam: 'filter=missingSprintId',
      totalCount: data.missingFields.sprintIds,
    },
    {
      title: 'Missing Labels',
      tickets: data.affectedTickets?.missingLabels || [],
      filterParam: 'filter=missingLabels',
      totalCount: data.missingFields.labels,
    },
    {
      title: 'Duplicate Ticket Keys',
      tickets: data.affectedTickets?.duplicates || [],
      filterParam: '',
      totalCount: data.duplicates.count,
    },
  ];

  const hasIssues = drillDownSections.some((s) => s.totalCount > 0);

  return (
    <div className="space-y-6">
      <QualityScoreHeader
        score={qualityScore}
        totalTickets={data.rowCounts.tickets}
        issueCount={totalIssues}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <FieldCompletenessCard completeness={data.fieldCompleteness} />
        <EffortBlockersCard blockers={data.effortBlockers} caseStudyId={caseStudyId} />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Affected Tickets</CardTitle>
          <p className="text-xs text-muted-foreground">
            Expand each section to view tickets with data quality issues
          </p>
        </CardHeader>
        <CardContent>
          {!hasIssues ? (
            <div className="rounded-lg border border-success/20 bg-success-muted p-4 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <div>
                <p className="text-sm font-medium text-success-foreground">
                  No data quality issues found
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  All tickets have complete data.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {drillDownSections.map((section) => (
                <DrillDownSection
                  key={section.title}
                  title={section.title}
                  tickets={section.tickets}
                  caseStudyId={caseStudyId}
                  filterParam={section.filterParam}
                  totalCount={section.totalCount}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
