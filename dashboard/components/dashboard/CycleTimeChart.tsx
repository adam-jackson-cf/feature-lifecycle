'use client';

import { useQuery } from '@tanstack/react-query';
import { Timer } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CycleTimeChartProps {
  caseStudyId: string;
}

interface ChartDatum {
  ticket: string;
  days: number;
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartDatum }>;
}) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="rounded-lg border bg-card px-3 py-2 shadow-lg">
      <p className="text-sm font-semibold">{data.ticket}</p>
      <p className="text-xs text-muted-foreground">
        Cycle time: <span className="font-medium text-foreground">{data.days} days</span>
      </p>
    </div>
  );
}

export function CycleTimeChart({ caseStudyId }: CycleTimeChartProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['cycle-time', caseStudyId],
    queryFn: async () => {
      const response = await fetch(`/api/metrics/${caseStudyId}/cycle-time`);
      if (!response.ok) throw new Error('Failed to fetch cycle time');
      return response.json();
    },
    enabled: !!caseStudyId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="h-4 w-4 text-primary" />
            Cycle Time Distribution
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
            <Timer className="h-4 w-4 text-primary" />
            Cycle Time Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-destructive">
          Unable to load cycle time data. Please try again.
        </CardContent>
      </Card>
    );
  }

  const tickets = data?.tickets || [];
  const chartData: ChartDatum[] = Array.isArray(tickets)
    ? tickets.map((item: { key: string; cycleTime: number }) => ({
        ticket: item.key,
        days: Math.floor((item.cycleTime || 0) / (1000 * 60 * 60 * 24)),
      }))
    : [];

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="h-4 w-4 text-primary" />
            Cycle Time Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-sm text-muted-foreground">No cycle time data available yet.</p>
        </CardContent>
      </Card>
    );
  }

  const maxDays = Math.max(...chartData.map((d) => d.days));

  // Theme colors - using hex values that match CSS variables
  const primaryColor = '#6bcba2';
  const accentColor = '#6c63ff';
  const borderColor = '#e0e6ef';
  const mutedColor = '#edf1f7';

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Timer className="h-4 w-4 text-primary" />
          Cycle Time Distribution
        </CardTitle>
        <p className="text-xs text-muted-foreground">Days from first commit to completion</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={borderColor} />
            <XAxis
              dataKey="ticket"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: borderColor }}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}d`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: mutedColor }} />
            <Bar dataKey="days" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${entry.ticket}-${index}`}
                  fill={entry.days === maxDays ? accentColor : primaryColor}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
