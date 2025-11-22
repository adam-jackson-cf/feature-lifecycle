'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DataQualityViewProps {
  caseStudyId: string;
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
        <CardHeader>
          <CardTitle>Data Quality</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">Checking data quality…</CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Data Quality</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-destructive">
          Unable to load data quality. Please retry.
        </CardContent>
      </Card>
    );
  }

  const missing = data?.missingFields || {};
  const duplicates = data?.duplicates || { ticketKeys: [], count: 0 };
  const hasIssues =
    missing.storyPoints > 0 ||
    missing.sprintIds > 0 ||
    missing.labels > 0 ||
    (duplicates.ticketKeys?.length || 0) > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Quality</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasIssues ? (
          <div className="rounded-lg border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-800">
            ✅ No data quality issues detected for this case study.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg border bg-card px-4 py-3">
              <p className="text-sm font-semibold">Missing fields</p>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                <li>Story points missing: {missing.storyPoints ?? 0}</li>
                <li>Sprint IDs missing: {missing.sprintIds ?? 0}</li>
                <li>Labels missing: {missing.labels ?? 0}</li>
              </ul>
            </div>
            <div className="rounded-lg border bg-card px-4 py-3">
              <p className="text-sm font-semibold">Duplicates</p>
              <p className="text-sm text-muted-foreground">
                Ticket key duplicates: {duplicates.count || 0}
              </p>
              {duplicates.ticketKeys && duplicates.ticketKeys.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {duplicates.ticketKeys.map((key: string) => (
                    <span
                      key={key}
                      className="rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground"
                    >
                      {key}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        {data?.rowCounts ? (
          <div className="rounded-lg border bg-muted px-4 py-3 text-sm">
            <p className="font-medium text-foreground">Row counts</p>
            <p className="text-muted-foreground">Tickets: {data.rowCounts.tickets}</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
