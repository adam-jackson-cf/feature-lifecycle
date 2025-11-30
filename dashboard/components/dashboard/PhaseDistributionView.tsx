'use client';

import { useQuery } from '@tanstack/react-query';
import { BarChart3, Clock, Table2 } from 'lucide-react';
import { useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CHART_COLORS } from '@/lib/constants/chart-colors';
import type { PhaseDistribution } from '@/lib/types';
import { PhaseDistributionTable } from './PhaseDistributionTable';

interface PhaseDistributionViewProps {
  caseStudyId: string;
}

interface ChartDataItem {
  name: string;
  value: number;
  hours: number;
  tickets: number;
  color: string;
  [key: string]: unknown;
}

export function PhaseDistributionView({ caseStudyId }: PhaseDistributionViewProps) {
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');

  const { data, isLoading, error } = useQuery<PhaseDistribution>({
    queryKey: ['phase-distribution', caseStudyId],
    queryFn: async () => {
      const response = await fetch(`/api/metrics/${caseStudyId}/phase-distribution`);
      if (!response.ok) throw new Error('Failed to fetch phase distribution');
      return response.json();
    },
    enabled: !!caseStudyId,
  });

  if (isLoading) {
    return (
      <Card className="glass shadow-glass animate-fade-in-up">
        <CardHeader>
          <CardTitle className="font-display">Effort by Phase</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center">
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <span className="text-muted-foreground text-sm">Loading chart...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="glass shadow-glass">
        <CardHeader>
          <CardTitle className="font-display">Effort by Phase</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-destructive">
          Unable to load phase distribution.
        </CardContent>
      </Card>
    );
  }

  const chartData: ChartDataItem[] = data.phases.map((p, index) => ({
    name: p.label,
    value: p.percentage,
    hours: p.totalHours,
    tickets: p.ticketCount,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));

  const totalHours = chartData.reduce((sum, item) => sum + item.hours, 0);

  return (
    <Card className="glass shadow-glass animate-fade-in-up transition-premium hover:shadow-glass-hover">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base font-display">
              <div className="p-1.5 rounded-md bg-primary/10">
                <Clock className="h-4 w-4 text-primary" />
              </div>
              Effort by Phase
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Breakdown of effort across lifecycle phases
            </p>
          </div>
          <div className="flex gap-1 p-1 rounded-lg bg-muted/50">
            <Button
              variant={viewMode === 'chart' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('chart')}
              aria-label="Chart view"
              className="h-7 w-7 p-0"
            >
              <BarChart3 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              aria-label="Table view"
              className="h-7 w-7 p-0"
            >
              <Table2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {viewMode === 'chart' ? (
          data.phases.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No phase data available
            </p>
          ) : (
            <div className="flex items-center gap-6">
              <div className="flex-1 min-w-0 relative">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <defs>
                      {chartData.map((entry, index) => (
                        <linearGradient
                          key={`gradient-${index}`}
                          id={`gradient-${index}`}
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
                      animationBegin={0}
                      animationDuration={800}
                      animationEasing="ease-out"
                    >
                      {chartData.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={`url(#gradient-${index})`}
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
                      {totalHours.toFixed(0)}
                    </p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                      Total Hours
                    </p>
                  </div>
                </div>
              </div>
              {/* Legend */}
              <div className="w-[200px] shrink-0 grid grid-cols-2 gap-x-2 gap-y-1">
                {chartData.map((entry, index) => {
                  const percentage = entry.value.toFixed(0);
                  return (
                    <div
                      key={entry.name}
                      className="flex items-center gap-1.5 py-0.5 animate-fade-in-up"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <div
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: entry.color }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-medium leading-tight truncate">
                          {entry.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground tabular-nums leading-tight">
                          {entry.hours.toFixed(0)}h · {percentage}%
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )
        ) : (
          <PhaseDistributionTable data={data} />
        )}
      </CardContent>
    </Card>
  );
}
