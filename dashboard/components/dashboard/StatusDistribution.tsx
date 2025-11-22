'use client';

import { useQuery } from '@tanstack/react-query';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StatusDistributionProps {
  caseStudyId: string;
}

interface StatusDatum {
  id: string;
  name: string;
  value: number;
}

type PieDatum = StatusDatum & Record<string, unknown>;

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export function StatusDistribution({ caseStudyId }: StatusDistributionProps) {
  const { data, isLoading } = useQuery<StatusDatum[]>({
    queryKey: ['status-distribution', caseStudyId],
    queryFn: async (): Promise<StatusDatum[]> => {
      const response = await fetch(`/api/metrics/${caseStudyId}/status-distribution`);
      if (!response.ok) throw new Error('Failed to fetch status distribution');
      const json = await response.json();
      return (json.data as StatusDatum[]) || [];
    },
    enabled: !!caseStudyId,
  });

  const chartData = (data || []) as PieDatum[];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>Loading...</CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No status data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry: StatusDatum, index: number) => (
                <Cell key={entry.id} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
