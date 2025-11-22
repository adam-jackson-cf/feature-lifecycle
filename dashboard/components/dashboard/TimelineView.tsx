'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTimeline } from '@/lib/hooks/useTimeline';

interface TimelineViewProps {
  caseStudyId: string;
}

// Add Badge import
import { Badge } from '@/components/ui/badge';

export function TimelineView({ caseStudyId }: TimelineViewProps) {
  const { data: timeline, isLoading } = useTimeline(caseStudyId);
  const [filterDiscipline, setFilterDiscipline] = useState<string>('all');
  const [filterComplexity, setFilterComplexity] = useState<string>('all');
  const [filterAI, setFilterAI] = useState<boolean | null>(null);

  if (isLoading) {
    return <div>Loading timeline...</div>;
  }

  // TODO: Integrate vis-timeline for visualization
  // For now, show a simple list
  const filteredTimeline = timeline?.filter((event) => {
    const eventDiscipline = (event as unknown as { discipline?: string }).discipline;
    const eventComplexity = (event as unknown as { complexitySize?: string }).complexitySize;

    if (filterDiscipline !== 'all' && eventDiscipline !== filterDiscipline) {
      return false;
    }
    if (filterComplexity !== 'all' && eventComplexity !== filterComplexity) {
      return false;
    }
    if (filterAI !== null) {
      const hasAI = (event.details.metadata as { aiFlag?: boolean })?.aiFlag;
      if (filterAI !== hasAI) return false;
    }
    return true;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lifecycle Timeline</CardTitle>
        <div className="flex gap-4 mt-4">
          <select
            value={filterDiscipline}
            onChange={(e) => setFilterDiscipline(e.target.value)}
            className="px-3 py-1 border rounded"
          >
            <option value="all">All Disciplines</option>
            <option value="backend">Backend</option>
            <option value="frontend">Frontend</option>
            <option value="mobile">Mobile</option>
          </select>
          <select
            value={filterComplexity}
            onChange={(e) => setFilterComplexity(e.target.value)}
            className="px-3 py-1 border rounded"
          >
            <option value="all">All Sizes</option>
            <option value="XS">XS</option>
            <option value="S">S</option>
            <option value="M">M</option>
            <option value="L">L</option>
            <option value="XL">XL</option>
          </select>
          <select
            value={filterAI === null ? 'all' : filterAI ? 'ai' : 'no-ai'}
            onChange={(e) => {
              const value = e.target.value;
              setFilterAI(value === 'all' ? null : value === 'ai');
            }}
            className="px-3 py-1 border rounded"
          >
            <option value="all">All</option>
            <option value="ai">AI-assisted</option>
            <option value="no-ai">Non-AI</option>
          </select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {filteredTimeline?.map((event) => (
            <div key={event.id} className="flex items-center gap-4 p-2 border rounded">
              <span className="text-sm text-zinc-500">{event.eventDate.toLocaleDateString()}</span>
              <Badge variant={event.eventSource === 'jira' ? 'default' : 'secondary'}>
                {event.eventSource.toUpperCase()}
              </Badge>
              <span className="font-medium">{event.ticketKey}</span>
              <span className="text-sm">{event.eventType.replace(/_/g, ' ')}</span>
            </div>
          ))}
        </div>
        {/* TODO: Add vis-timeline integration */}
      </CardContent>
    </Card>
  );
}
