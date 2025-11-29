'use client';

import { Layers } from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CHART_COLORS } from '@/lib/constants/chart-colors';
import { useMetrics } from '@/lib/hooks/useMetrics';

interface EffortComplexityViewProps {
  caseStudyId: string;
}

interface SizeDatum {
  name: string;
  value: number;
  [key: string]: unknown;
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: SizeDatum; value: number }>;
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

export function EffortComplexityView({ caseStudyId }: EffortComplexityViewProps) {
  const { data, isLoading } = useMetrics(caseStudyId);
  const complexityData = data?.complexity;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            Effort by Complexity
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[220px] flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading chart...</div>
        </CardContent>
      </Card>
    );
  }

  if (!complexityData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            Effort by Complexity
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[220px] flex items-center justify-center">
          <p className="text-sm text-muted-foreground">No complexity data available</p>
        </CardContent>
      </Card>
    );
  }

  const sizeOrder = ['XS', 'S', 'M', 'L', 'XL'];
  const chartData: SizeDatum[] = sizeOrder
    .map((size) => ({
      name: size,
      value: (complexityData.bySize as Record<string, number>)[size] || 0,
    }))
    .filter((item) => item.value > 0);

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Layers className="h-4 w-4 text-primary" />
          Effort by Complexity
        </CardTitle>
        <p className="text-xs text-muted-foreground">Ticket distribution by size</p>
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
                  {chartData.map((entry) => {
                    const colorIndex = sizeOrder.indexOf(entry.name);
                    return (
                      <Cell key={entry.name} fill={CHART_COLORS[colorIndex] || CHART_COLORS[0]} />
                    );
                  })}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 min-w-[140px]">
            {chartData.map((entry) => {
              const colorIndex = sizeOrder.indexOf(entry.name);
              const percentage = total > 0 ? ((entry.value / total) * 100).toFixed(0) : 0;
              return (
                <div key={entry.name} className="flex items-center gap-3">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: CHART_COLORS[colorIndex] || CHART_COLORS[0] }}
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
        {complexityData.oversize > 0 && (
          <p className="text-sm text-destructive mt-4 text-center">
            {complexityData.oversize} oversize ticket(s) detected
          </p>
        )}
      </CardContent>
    </Card>
  );
}
