'use client';

import { Users } from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CHART_COLORS } from '@/lib/constants/chart-colors';
import { useMetrics } from '@/lib/hooks/useMetrics';

interface DisciplineDistributionChartProps {
  caseStudyId: string;
}

interface DisciplineDatum {
  name: string;
  value: number;
  [key: string]: unknown;
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: DisciplineDatum; value: number }>;
}) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="rounded-lg border bg-card px-3 py-2 shadow-lg">
      <p className="text-sm font-semibold capitalize">{data.name}</p>
      <p className="text-xs text-muted-foreground">
        Count: <span className="font-medium text-foreground">{data.value}</span>
      </p>
    </div>
  );
}

export function DisciplineDistributionChart({ caseStudyId }: DisciplineDistributionChartProps) {
  const { data, isLoading } = useMetrics(caseStudyId);
  const complexityData = data?.complexity;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Discipline Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[220px] flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading chart...</div>
        </CardContent>
      </Card>
    );
  }

  if (!complexityData?.byDiscipline) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Discipline Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[220px] flex items-center justify-center">
          <p className="text-sm text-muted-foreground">No discipline data available</p>
        </CardContent>
      </Card>
    );
  }

  const chartData: DisciplineDatum[] = Object.entries(complexityData.byDiscipline)
    .map(([discipline, count]) => ({
      name: discipline,
      value: count as number,
    }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Discipline Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[220px] flex items-center justify-center">
          <p className="text-sm text-muted-foreground">No discipline data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-4 w-4 text-primary" />
          Discipline Distribution
        </CardTitle>
        <p className="text-xs text-muted-foreground">Tickets by engineering discipline</p>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <div className="flex-1 min-w-0">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="w-[160px] shrink-0 space-y-2 max-h-[240px] overflow-y-auto">
            {chartData.map((entry, index) => {
              const percentage = total > 0 ? ((entry.value / total) * 100).toFixed(0) : 0;
              return (
                <div key={entry.name} className="flex items-center gap-3">
                  <div
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-none capitalize truncate">
                      {entry.name}
                    </p>
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
