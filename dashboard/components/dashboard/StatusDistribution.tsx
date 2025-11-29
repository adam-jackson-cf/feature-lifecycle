'use client';

import { useQuery } from '@tanstack/react-query';
import { PieChart as PieChartIcon } from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CHART_COLORS } from '@/lib/constants/chart-colors';

interface StatusDistributionProps {
  caseStudyId: string;
}

interface StatusDatum {
  id: string;
  name: string;
  value: number;
  [key: string]: unknown;
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: StatusDatum; value: number }>;
}) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="rounded-lg border bg-card px-3 py-2 shadow-lg">
      <p className="text-sm font-semibold">{data.name}</p>
      <p className="text-xs text-muted-foreground">
        Count: <span className="font-medium text-foreground">{data.value}</span>
      </p>
    </div>
  );
}

export function StatusDistribution({ caseStudyId }: StatusDistributionProps) {
  const { data, isLoading, error } = useQuery<StatusDatum[]>({
    queryKey: ['status-distribution', caseStudyId],
    queryFn: async (): Promise<StatusDatum[]> => {
      const response = await fetch(`/api/metrics/${caseStudyId}/status-distribution`);
      if (!response.ok) throw new Error('Failed to fetch status distribution');
      const json = await response.json();
      return (json.data as StatusDatum[]) || [];
    },
    enabled: !!caseStudyId,
  });

  const chartData = data || [];
  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="h-4 w-4 text-primary" />
            Status Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading chart...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="h-4 w-4 text-primary" />
            Status Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-destructive">
          Unable to load status distribution. Please try again.
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="h-4 w-4 text-primary" />
            Status Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-sm text-muted-foreground">No status data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <PieChartIcon className="h-4 w-4 text-primary" />
          Status Distribution
        </CardTitle>
        <p className="text-xs text-muted-foreground">Breakdown of ticket statuses</p>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <div className="flex-1">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={entry.id} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 min-w-[140px]">
            {chartData.map((entry, index) => {
              const percentage = total > 0 ? ((entry.value / total) * 100).toFixed(0) : 0;
              return (
                <div key={entry.id} className="flex items-center gap-3">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium leading-none">{entry.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {entry.value} ({percentage}%)
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
