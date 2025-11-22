'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSprints } from '@/lib/hooks/useSprints';

interface VelocityChartProps {
  caseStudyId: string;
}

export function VelocityChart({ caseStudyId }: VelocityChartProps) {
  const { data: sprints, isLoading: sprintsLoading, error: sprintsError } = useSprints(caseStudyId);
  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedSprintId && sprints && sprints.length > 0) {
      setSelectedSprintId(sprints[0].id);
    }
  }, [selectedSprintId, sprints]);

  const {
    data,
    isLoading: velocityLoading,
    error: velocityError,
  } = useQuery({
    queryKey: ['velocity', caseStudyId, selectedSprintId],
    queryFn: async () => {
      const response = await fetch(
        `/api/metrics/${caseStudyId}/velocity?sprintId=${selectedSprintId}`
      );
      if (!response.ok) throw new Error('Failed to fetch velocity');
      return response.json() as Promise<{ sprintId: string; velocity: number }>;
    },
    enabled: !!caseStudyId && !!selectedSprintId,
  });

  const isLoading = sprintsLoading || velocityLoading;
  const error = sprintsError || velocityError;

  const selectedSprintName = useMemo(
    () => sprints?.find((s) => s.id === selectedSprintId)?.name || selectedSprintId || '',
    [selectedSprintId, sprints]
  );

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

  if (!sprints || sprints.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sprint Velocity</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          No sprints found. Import tickets with sprint assignments to see velocity.
        </CardContent>
      </Card>
    );
  }

  const chartData =
    data && selectedSprintId
      ? [
          {
            sprintId: selectedSprintName || selectedSprintId,
            velocity: data.velocity || 0,
          },
        ]
      : [];

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sprint Velocity</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Select a sprint to view velocity. Story points are required for this chart.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sprint Velocity</CardTitle>
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm text-muted-foreground" htmlFor="sprint-select">
            Sprint
          </label>
          <select
            id="sprint-select"
            value={selectedSprintId ?? ''}
            onChange={(e) => setSelectedSprintId(e.target.value)}
            className="rounded-md border border-input bg-card px-3 py-2 text-sm shadow-xs"
          >
            {sprints.map((sprint) => (
              <option key={sprint.id} value={sprint.id}>
                {sprint.name} ({sprint.ticketCount})
              </option>
            ))}
          </select>
        </div>
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
