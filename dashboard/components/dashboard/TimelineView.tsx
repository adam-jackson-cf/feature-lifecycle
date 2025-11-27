'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { DataSet } from 'vis-data/peer';
import { Timeline } from 'vis-timeline/standalone';
import 'vis-timeline/styles/vis-timeline-graph2d.min.css';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTimeline } from '@/lib/hooks/useTimeline';

interface TimelineViewProps {
  caseStudyId: string;
}

export function TimelineView({ caseStudyId }: TimelineViewProps) {
  const { data: timeline, isLoading } = useTimeline(caseStudyId);
  const [filterDiscipline, setFilterDiscipline] = useState<string>('all');
  const [filterComplexity, setFilterComplexity] = useState<string>('all');
  const [filterAI, setFilterAI] = useState<boolean | null>(null);
  const timelineContainerRef = useRef<HTMLDivElement | null>(null);
  const timelineInstance = useRef<Timeline | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`timelineFilters:${caseStudyId}`);
      if (stored) {
        const parsed = JSON.parse(stored) as {
          discipline?: string;
          complexity?: string;
          ai?: boolean | null;
        };
        setFilterDiscipline(parsed.discipline || 'all');
        setFilterComplexity(parsed.complexity || 'all');
        setFilterAI(parsed.ai ?? null);
      }
    } catch {
      // ignore corrupted storage
    }
  }, [caseStudyId]);

  useEffect(() => {
    const payload = {
      discipline: filterDiscipline,
      complexity: filterComplexity,
      ai: filterAI,
    };
    localStorage.setItem(`timelineFilters:${caseStudyId}`, JSON.stringify(payload));
  }, [caseStudyId, filterAI, filterComplexity, filterDiscipline]);

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

  const timelineItems = useMemo(() => {
    return (
      filteredTimeline?.map((event) => {
        const eventDate =
          event.eventDate instanceof Date ? event.eventDate : new Date(event.eventDate);
        return {
          id: event.id,
          group: event.ticketKey,
          content: `<div class="text-xs font-semibold">${event.eventType.replace(/_/g, ' ')}</div>`,
          start: eventDate,
          title: `${event.ticketKey} • ${event.eventType}`,
        };
      }) || []
    );
  }, [filteredTimeline]);

  const timelineGroups = useMemo(() => {
    const keys = filteredTimeline
      ? Array.from(new Set(filteredTimeline.map((e) => e.ticketKey)))
      : [];
    return keys.map((key) => ({ id: key, content: key }));
  }, [filteredTimeline]);

  useEffect(() => {
    if (!timelineContainerRef.current || timelineItems.length === 0) return;

    const items = new DataSet(timelineItems);
    const groups = new DataSet(timelineGroups);

    if (!timelineInstance.current) {
      timelineInstance.current = new Timeline(timelineContainerRef.current, items, groups, {
        stack: true,
        stackSubgroups: true,
        orientation: 'top',
        showCurrentTime: true,
        zoomKey: 'ctrlKey',
        margin: { item: { horizontal: 12, vertical: 8 }, axis: 18 },
        verticalScroll: true,
        maxHeight: '600px',
        groupHeightMode: 'auto',
      });
    } else {
      timelineInstance.current.setItems(items);
      timelineInstance.current.setGroups(groups);
    }

    return () => {
      timelineInstance.current?.destroy();
      timelineInstance.current = null;
    };
  }, [timelineItems, timelineGroups]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lifecycle Timeline</CardTitle>
        <div className="mt-4 flex flex-wrap gap-3">
          <select
            value={filterDiscipline}
            onChange={(e) => setFilterDiscipline(e.target.value)}
            className="rounded-md border border-input bg-card px-3 py-2 text-sm"
          >
            <option value="all">All Disciplines</option>
            <option value="backend">Backend</option>
            <option value="frontend">Frontend</option>
            <option value="mobile">Mobile</option>
          </select>
          <select
            value={filterComplexity}
            onChange={(e) => setFilterComplexity(e.target.value)}
            className="rounded-md border border-input bg-card px-3 py-2 text-sm"
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
            className="rounded-md border border-input bg-card px-3 py-2 text-sm"
          >
            <option value="all">All</option>
            <option value="ai">AI-assisted</option>
            <option value="no-ai">Non-AI</option>
          </select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading timeline…</div>
        ) : !timeline || timeline.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No timeline events found for this case study.
          </div>
        ) : filteredTimeline && filteredTimeline.length > 0 ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <section
                ref={timelineContainerRef}
                className="min-h-[500px] w-full rounded-lg border bg-card"
                aria-label="Interactive timeline"
              ></section>
              <p className="text-xs text-muted-foreground text-center">
                Tip: hold Ctrl/Cmd while scrolling to zoom. Drag to pan.
              </p>
            </div>
            <div className="space-y-2">
              {filteredTimeline.map((event) => {
                const eventDate =
                  event.eventDate instanceof Date ? event.eventDate : new Date(event.eventDate);
                return (
                  <div
                    key={event.id}
                    className="grid grid-cols-[auto_auto_1fr_1fr] items-center gap-3 rounded-lg border p-3"
                  >
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      {eventDate.toLocaleDateString()}
                    </span>
                    <Badge variant={event.eventSource === 'jira' ? 'default' : 'secondary'}>
                      {event.eventSource.toUpperCase()}
                    </Badge>
                    <span className="font-medium whitespace-nowrap">{event.ticketKey}</span>
                    <span className="text-sm text-muted-foreground">
                      {event.eventType.replace(/_/g, ' ')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No events match the selected filters.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
