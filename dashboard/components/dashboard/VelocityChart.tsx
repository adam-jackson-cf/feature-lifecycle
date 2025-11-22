'use client';

import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface VelocityChartProps {
  caseStudyId: string;
}

export function VelocityChart({ caseStudyId }: VelocityChartProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['velocity', caseStudyId],
    queryFn: async () => {
      const response = await fetch(`/api/metrics/${caseStudyId}/velocity`);
      if (!response.ok) throw new Error('Failed to fetch velocity');
      return response.json();
    },
    enabled: !!caseStudyId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sprint Velocity</CardTitle>
        </CardHeader>
        <CardContent>Loading...</CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sprint Velocity</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-destructive">
          Unable to load velocity. Select a sprint or try again.
        </CardContent>
      </Card>
    );
  }

  const chartData = data || [];

  if (!Array.isArray(chartData) || chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sprint Velocity</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          No sprint velocity available yet. Choose a sprint or add story points to your tickets.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sprint Velocity</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="sprintId" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="velocity" fill="#ffc658" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
