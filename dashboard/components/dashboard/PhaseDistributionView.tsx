'use client';

import { useQuery } from '@tanstack/react-query';
import { BarChart3, Table2 } from 'lucide-react';
import { useState } from 'react';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
          <CardTitle>Effort by Lifecycle Phase</CardTitle>
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
          <CardTitle>Effort by Lifecycle Phase</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-destructive">
          Unable to load phase distribution.
        </CardContent>
      </Card>
    );
  }

  const chartData = data.phases.map((p) => ({
    name: p.label,
    value: p.percentage,
    hours: p.totalHours,
    tickets: p.ticketCount,
    color: p.color,
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Effort by Lifecycle Phase</CardTitle>
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
          <>
            {data.phases.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No phase data available
              </p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value.toFixed(0)}%`}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
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
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>

                <div className="mt-4 grid grid-cols-2 gap-4 border-t pt-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total Hours</p>
                    <p className="text-xl font-semibold">{data.totalHours.toFixed(1)}h</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Tickets</p>
                    <p className="text-xl font-semibold">{data.totalTickets}</p>
                  </div>
                </div>
              </>
            )}
          </>
        ) : (
          <PhaseDistributionTable data={data} />
        )}
      </CardContent>
    </Card>
  );
}
