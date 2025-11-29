'use client';

import { useQuery } from '@tanstack/react-query';
import { BarChart3, Table2 } from 'lucide-react';
import { useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CHART_COLORS } from '@/lib/constants/chart-colors';
import type { PhaseDistribution } from '@/lib/types';
import { PhaseDistributionTable } from './PhaseDistributionTable';

interface PhaseDistributionViewProps {
  caseStudyId: string;
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
      <Card>
        <CardHeader>
          <CardTitle>Effort by Phase</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center">
            <span className="text-muted-foreground">Loading...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Effort by Phase</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-destructive">
          Unable to load phase distribution.
        </CardContent>
      </Card>
    );
  }

  const chartData = data.phases.map((p, index) => ({
    name: p.label,
    value: p.percentage,
    hours: p.totalHours,
    tickets: p.ticketCount,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));

  const totalValue = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Effort by Phase</CardTitle>
            <p className="text-xs text-muted-foreground">
              Breakdown of effort across lifecycle phases
            </p>
          </div>
          <div className="flex gap-1">
            <Button
              variant={viewMode === 'chart' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('chart')}
              aria-label="Chart view"
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              aria-label="Table view"
            >
              <Table2 className="h-4 w-4" />
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
                      {chartData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(
                        value: number,
                        _name: string,
                        props: { payload?: { hours: number; tickets: number } }
                      ) => [
                        `${value.toFixed(1)}% (${props.payload?.hours.toFixed(1)}h, ${props.payload?.tickets} tickets)`,
                        'Effort',
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3 min-w-[140px]">
                {chartData.map((entry) => {
                  const percentage =
                    totalValue > 0 ? ((entry.value / totalValue) * 100).toFixed(0) : 0;
                  return (
                    <div key={entry.name} className="flex items-center gap-3">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: entry.color }}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium leading-none">{entry.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {entry.hours.toFixed(1)}h ({percentage}%)
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
