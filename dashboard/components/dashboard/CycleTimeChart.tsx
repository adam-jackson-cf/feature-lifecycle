'use client';

import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CycleTimeChartProps {
  caseStudyId: string;
}

export function CycleTimeChart({ caseStudyId }: CycleTimeChartProps) {
  const { data, isLoading } = useQuery({
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
          <CardTitle>Cycle Time Distribution</CardTitle>
        </CardHeader>
        <CardContent>Loading...</CardContent>
      </Card>
    );
  }

  // Transform data for chart
  const chartData = data
    ? data.map((item: { ticketKey: string; cycleTime: number }) => ({
        ticket: item.ticketKey,
        days: Math.floor(item.cycleTime / (1000 * 60 * 60 * 24)),
      }))
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cycle Time Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="ticket" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="days" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
