'use client';

import { useQuery } from '@tanstack/react-query';
import { PieChart as PieChartIcon } from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CHART_COLORS } from '@/lib/constants/chart-colors';

interface StatusDistributionProps {
  caseStudyId: string;
}

interface StatusDatum {
  id: string;
  name: string;
  value: number;
  color: string;
  [key: string]: unknown;
}

export function StatusDistribution({ caseStudyId }: StatusDistributionProps) {
  const { data, isLoading, error } = useQuery<StatusDatum[]>({
    queryKey: ['status-distribution', caseStudyId],
    queryFn: async (): Promise<StatusDatum[]> => {
      const response = await fetch(`/api/metrics/${caseStudyId}/status-distribution`);
      if (!response.ok) throw new Error('Failed to fetch status distribution');
      const json = await response.json();
      return ((json.data as StatusDatum[]) || []).map((item, index) => ({
        ...item,
        color: CHART_COLORS[index % CHART_COLORS.length],
      }));
    },
    enabled: !!caseStudyId,
  });

  const chartData = data || [];
  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  if (isLoading) {
    return (
      <Card className="glass shadow-glass animate-fade-in-up stagger-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <div className="p-1.5 rounded-md bg-primary/10">
              <PieChartIcon className="h-4 w-4 text-primary" />
            </div>
            Status Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <span className="text-muted-foreground text-sm">Loading chart...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="glass shadow-glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <div className="p-1.5 rounded-md bg-primary/10">
              <PieChartIcon className="h-4 w-4 text-primary" />
            </div>
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
      <Card className="glass shadow-glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <div className="p-1.5 rounded-md bg-primary/10">
              <PieChartIcon className="h-4 w-4 text-primary" />
            </div>
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
    <Card className="glass shadow-glass animate-fade-in-up stagger-2 transition-premium hover:shadow-glass-hover">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-display">
          <div className="p-1.5 rounded-md bg-primary/10">
            <PieChartIcon className="h-4 w-4 text-primary" />
          </div>
          Status Distribution
        </CardTitle>
        <p className="text-xs text-muted-foreground">Breakdown of ticket statuses</p>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <div className="flex-1 min-w-0 relative">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <defs>
                  {chartData.map((entry, index) => (
                    <linearGradient
                      key={`status-gradient-${index}`}
                      id={`status-gradient-${index}`}
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="1"
                    >
                      <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                      <stop offset="100%" stopColor={entry.color} stopOpacity={0.7} />
                    </linearGradient>
                  ))}
                </defs>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={105}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                  animationBegin={100}
                  animationDuration={800}
                  animationEasing="ease-out"
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={entry.id}
                      fill={`url(#status-gradient-${index})`}
                      className="transition-all duration-200 hover:opacity-80"
                      style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <p className="text-2xl font-bold font-display tabular-nums text-foreground">
                  {total}
                </p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Total</p>
              </div>
            </div>
          </div>
          {/* Legend */}
          <div className="w-[200px] shrink-0 grid grid-cols-2 gap-x-2 gap-y-1">
            {chartData.map((entry, index) => {
              const percentage = total > 0 ? ((entry.value / total) * 100).toFixed(0) : 0;
              return (
                <div
                  key={entry.id}
                  className="flex items-center gap-1.5 py-0.5 animate-fade-in-up"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <div
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: entry.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium leading-tight truncate">{entry.name}</p>
                    <p className="text-[10px] text-muted-foreground tabular-nums leading-tight">
                      {entry.value} · {percentage}%
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
