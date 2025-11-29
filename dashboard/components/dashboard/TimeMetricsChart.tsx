'use client';

import { useQuery } from '@tanstack/react-query';
import { BarChart3, Clock, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TimeMetricsChartProps {
  caseStudyId: string;
}

interface TicketData {
  key: string;
  cycleTime: number;
  leadTime: number;
}

interface ChartDatum {
  ticket: string;
  cycleTime: number;
  leadTime: number;
}

const CYCLE_COLOR = '#6bcba2';
const LEAD_COLOR = '#6c63ff';
const BORDER_COLOR = '#e0e6ef';
const MUTED_COLOR = '#edf1f7';

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartDatum; dataKey: string; value: number; color: string }>;
}) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="rounded-lg border bg-card px-3 py-2 shadow-lg">
      <p className="text-sm font-semibold">{data.ticket}</p>
      <div className="mt-1 space-y-0.5">
        <p className="text-xs text-muted-foreground">
          Cycle:{' '}
          <span className="font-medium" style={{ color: CYCLE_COLOR }}>
            {data.cycleTime}d
          </span>
        </p>
        <p className="text-xs text-muted-foreground">
          Lead:{' '}
          <span className="font-medium" style={{ color: LEAD_COLOR }}>
            {data.leadTime}d
          </span>
        </p>
      </div>
    </div>
  );
}

export function TimeMetricsChart({ caseStudyId }: TimeMetricsChartProps) {
  const [viewMode, setViewMode] = useState<'bar' | 'trend'>('bar');

  const { data: cycleData, isLoading: cycleLoading } = useQuery({
    queryKey: ['cycle-time', caseStudyId],
    queryFn: async () => {
      const response = await fetch(`/api/metrics/${caseStudyId}/cycle-time`);
      if (!response.ok) throw new Error('Failed to fetch cycle time');
      return response.json();
    },
    enabled: !!caseStudyId,
  });

  const { data: leadData, isLoading: leadLoading } = useQuery({
    queryKey: ['lead-time', caseStudyId],
    queryFn: async () => {
      const response = await fetch(`/api/metrics/${caseStudyId}/lead-time`);
      if (!response.ok) throw new Error('Failed to fetch lead time');
      return response.json();
    },
    enabled: !!caseStudyId,
  });

  const isLoading = cycleLoading || leadLoading;

  // Merge data from both endpoints
  const chartData: ChartDatum[] = (() => {
    const cycleTickets = cycleData?.tickets || [];
    const leadTickets = leadData?.tickets || [];

    const ticketMap = new Map<string, ChartDatum>();

    cycleTickets.forEach((item: TicketData) => {
      ticketMap.set(item.key, {
        ticket: item.key,
        cycleTime: Math.floor((item.cycleTime || 0) / (1000 * 60 * 60 * 24)),
        leadTime: 0,
      });
    });

    leadTickets.forEach((item: TicketData) => {
      const existing = ticketMap.get(item.key);
      if (existing) {
        existing.leadTime = Math.floor((item.leadTime || 0) / (1000 * 60 * 60 * 24));
      } else {
        ticketMap.set(item.key, {
          ticket: item.key,
          cycleTime: 0,
          leadTime: Math.floor((item.leadTime || 0) / (1000 * 60 * 60 * 24)),
        });
      }
    });

    return Array.from(ticketMap.values());
  })();

  // Calculate averages for legend
  const avgCycleTime =
    chartData.length > 0
      ? (chartData.reduce((sum, d) => sum + d.cycleTime, 0) / chartData.length).toFixed(1)
      : '0';
  const avgLeadTime =
    chartData.length > 0
      ? (chartData.reduce((sum, d) => sum + d.leadTime, 0) / chartData.length).toFixed(1)
      : '0';

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Time to completion (days)
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading chart...</div>
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Time to completion (days)
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-sm text-muted-foreground">No time metrics data available yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4 text-primary" />
              Time to completion (days)
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Days from start to completion</p>
          </div>
          <div className="flex gap-1">
            <Button
              variant={viewMode === 'bar' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('bar')}
              aria-label="Bar chart view"
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'trend' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('trend')}
              aria-label="Trend view"
            >
              <TrendingUp className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <div className="flex-1">
            <ResponsiveContainer width="100%" height={220}>
              {viewMode === 'bar' ? (
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={BORDER_COLOR} />
                  <XAxis
                    dataKey="ticket"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: BORDER_COLOR }}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}d`}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: MUTED_COLOR }} />
                  <Bar dataKey="cycleTime" fill={CYCLE_COLOR} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="leadTime" fill={LEAD_COLOR} radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : (
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="cycleGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CYCLE_COLOR} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={CYCLE_COLOR} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="leadGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={LEAD_COLOR} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={LEAD_COLOR} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={BORDER_COLOR} />
                  <XAxis
                    dataKey="ticket"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: BORDER_COLOR }}
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
                    dataKey="cycleTime"
                    stroke={CYCLE_COLOR}
                    strokeWidth={2}
                    fill="url(#cycleGradient)"
                    dot={{ fill: CYCLE_COLOR, strokeWidth: 0, r: 3 }}
                    activeDot={{ r: 5, strokeWidth: 0 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="leadTime"
                    stroke={LEAD_COLOR}
                    strokeWidth={2}
                    fill="url(#leadGradient)"
                    dot={{ fill: LEAD_COLOR, strokeWidth: 0, r: 3 }}
                    activeDot={{ r: 5, strokeWidth: 0 }}
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 min-w-[120px]">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: CYCLE_COLOR }} />
              <div className="flex-1">
                <p className="text-sm font-medium leading-none">Cycle Time</p>
                <p className="text-xs text-muted-foreground mt-0.5">avg {avgCycleTime}d</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: LEAD_COLOR }} />
              <div className="flex-1">
                <p className="text-sm font-medium leading-none">Lead Time</p>
                <p className="text-xs text-muted-foreground mt-0.5">avg {avgLeadTime}d</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
