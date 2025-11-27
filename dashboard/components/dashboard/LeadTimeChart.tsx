'use client';

import { useQuery } from '@tanstack/react-query';
import { Clock } from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface LeadTimeChartProps {
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
        Lead time: <span className="font-medium text-foreground">{data.days} days</span>
      </p>
    </div>
  );
}

export function LeadTimeChart({ caseStudyId }: LeadTimeChartProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['lead-time', caseStudyId],
    queryFn: async () => {
      const response = await fetch(`/api/metrics/${caseStudyId}/lead-time`);
      if (!response.ok) throw new Error('Failed to fetch lead time');
      return response.json();
    },
    enabled: !!caseStudyId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Lead Time Trends
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
            <Clock className="h-4 w-4 text-primary" />
            Lead Time Trends
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-destructive">
          Unable to load lead time data. Please try again.
        </CardContent>
      </Card>
    );
  }

  const tickets = data?.tickets || [];
  const chartData: ChartDatum[] = Array.isArray(tickets)
    ? tickets.map((item: { key: string; leadTime: number }) => ({
        ticket: item.key,
        days: Math.floor((item.leadTime || 0) / (1000 * 60 * 60 * 24)),
      }))
    : [];

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Lead Time Trends
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-sm text-muted-foreground">No lead time data available yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-4 w-4 text-primary" />
          Lead Time Trends
        </CardTitle>
        <p className="text-xs text-muted-foreground">Days from ticket creation to completion</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="leadTimeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6bcba2" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6bcba2" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e6ef" />
            <XAxis
              dataKey="ticket"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#e0e6ef' }}
            />
            <YAxis
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}d`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="days"
              stroke="#6bcba2"
              strokeWidth={2}
              fill="url(#leadTimeGradient)"
              dot={{ fill: '#6bcba2', strokeWidth: 0, r: 4 }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
