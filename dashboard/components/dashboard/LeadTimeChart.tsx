'use client';

import { useQuery } from '@tanstack/react-query';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface LeadTimeChartProps {
  caseStudyId: string;
}

export function LeadTimeChart({ caseStudyId }: LeadTimeChartProps) {
  const { data, isLoading } = useQuery({
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
          <CardTitle>Lead Time Trends</CardTitle>
        </CardHeader>
        <CardContent>Loading...</CardContent>
      </Card>
    );
  }

  const chartData = data
    ? data.map((item: { ticketKey: string; leadTime: number }) => ({
        ticket: item.ticketKey,
        days: Math.floor(item.leadTime / (1000 * 60 * 60 * 24)),
      }))
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lead Time Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="ticket" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="days" stroke="#82ca9d" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
