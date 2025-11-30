'use client';

import { useQuery } from '@tanstack/react-query';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { PhaseDistribution } from '@/lib/types';
import { PhaseDistributionTable } from './PhaseDistributionTable';

interface AggregatePhaseData extends PhaseDistribution {
  caseStudyCount: number;
}

export function AggregatePhaseView() {
  const { data, isLoading, error } = useQuery<AggregatePhaseData>({
    queryKey: ['aggregate-phase-distribution'],
    queryFn: async () => {
      const response = await fetch('/api/metrics/aggregate/phase-distribution');
      if (!response.ok) throw new Error('Failed to fetch aggregate phase distribution');
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Project-Wide Effort Distribution</CardTitle>
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
          <CardTitle>Project-Wide Effort Distribution</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-destructive">
          Unable to load aggregate phase distribution.
        </CardContent>
      </Card>
    );
  }

  if (data.phases.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Project-Wide Effort Distribution</CardTitle>
          <CardDescription>Aggregated across {data.caseStudyCount} case studies</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="py-8 text-center text-sm text-muted-foreground">
            No phase data available. Import some case studies to see the distribution.
          </p>
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
        <CardTitle>Project-Wide Effort by Lifecycle Phase</CardTitle>
        <CardDescription>
          Aggregated across {data.caseStudyCount} case{' '}
          {data.caseStudyCount === 1 ? 'study' : 'studies'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
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
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <PhaseDistributionTable data={data} />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-4 border-t pt-4 text-sm">
          <div>
            <p className="text-muted-foreground">Total Hours</p>
            <p className="text-xl font-semibold">{data.totalHours.toFixed(1)}h</p>
          </div>
          <div>
            <p className="text-muted-foreground">Total Tickets</p>
            <p className="text-xl font-semibold">{data.totalTickets}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Case Studies</p>
            <p className="text-xl font-semibold">{data.caseStudyCount}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
