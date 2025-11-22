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
          <CardTitle>Lead Time Trends</CardTitle>
        </CardHeader>
        <CardContent>Loading...</CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Lead Time Trends</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-destructive">
          Unable to load lead time data. Please try again.
        </CardContent>
      </Card>
    );
  }

  // Transform data for chart - API returns { tickets: [...] }
  const tickets = data?.tickets || [];
  const chartData = Array.isArray(tickets)
    ? tickets.map((item: { key: string; leadTime: number }) => ({
        ticket: item.key,
        days: Math.floor((item.leadTime || 0) / (1000 * 60 * 60 * 24)),
      }))
    : [];

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Lead Time Trends</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          No lead time data available yet.
        </CardContent>
      </Card>
    );
  }

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
