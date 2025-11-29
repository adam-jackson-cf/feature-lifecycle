'use client';

import {
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Circle,
  Diamond,
  Filter,
  GitMerge,
  SortDesc,
  Square,
  Star,
  Triangle,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTimeline } from '@/lib/hooks/useTimeline';
import type { LifecycleEvent } from '@/lib/types';

interface TimelineViewProps {
  caseStudyId: string;
}

// State configuration using CSS variables
// Supports both SCREAMING_CASE and lowercase variants
const STATE_CONFIG: Record<
  string,
  { icon: typeof Diamond; colorVar: string; label: string; order: number }
> = {
  // Uppercase variants
  TICKET_CREATED: {
    icon: Diamond,
    colorVar: 'var(--state-created)',
    label: 'Created',
    order: 1,
  },
  STATUS_CHANGED: {
    icon: Circle,
    colorVar: 'var(--state-in-progress)',
    label: 'In Progress',
    order: 2,
  },
  PR_OPENED: {
    icon: Square,
    colorVar: 'var(--state-review)',
    label: 'In Review',
    order: 3,
  },
  PR_REVIEWED: {
    icon: Square,
    colorVar: 'var(--state-review)',
    label: 'Reviewed',
    order: 3,
  },
  PR_APPROVED: {
    icon: Triangle,
    colorVar: 'var(--state-approved)',
    label: 'Approved',
    order: 4,
  },
  PR_MERGED: {
    icon: GitMerge,
    colorVar: 'var(--state-merged)',
    label: 'Merged',
    order: 5,
  },
  RESOLVED: { icon: Star, colorVar: 'var(--state-done)', label: 'Done', order: 6 },
  DEPLOYED_TO_BRANCH: {
    icon: Star,
    colorVar: 'var(--state-done)',
    label: 'Deployed',
    order: 6,
  },
  // Lowercase variants (from normalized events)
  'ticket created': {
    icon: Diamond,
    colorVar: 'var(--state-created)',
    label: 'Created',
    order: 1,
  },
  'status changed': {
    icon: Circle,
    colorVar: 'var(--state-in-progress)',
    label: 'In Progress',
    order: 2,
  },
  'assignee changed': {
    icon: Circle,
    colorVar: 'var(--state-in-progress)',
    label: 'Assigned',
    order: 2,
  },
  'commit created': {
    icon: Square,
    colorVar: 'var(--state-review)',
    label: 'Committed',
    order: 3,
  },
  'pr opened': {
    icon: Square,
    colorVar: 'var(--state-review)',
    label: 'In Review',
    order: 3,
  },
  'pr reviewed': {
    icon: Square,
    colorVar: 'var(--state-review)',
    label: 'Reviewed',
    order: 3,
  },
  'pr approved': {
    icon: Triangle,
    colorVar: 'var(--state-approved)',
    label: 'Approved',
    order: 4,
  },
  'pr merged': {
    icon: GitMerge,
    colorVar: 'var(--state-merged)',
    label: 'Merged',
    order: 5,
  },
  resolved: { icon: Star, colorVar: 'var(--state-done)', label: 'Done', order: 6 },
  deployed: {
    icon: Star,
    colorVar: 'var(--state-done)',
    label: 'Deployed',
    order: 6,
  },
};

const STUCK_THRESHOLD_DAYS = 2;

type SortOption = 'days-desc' | 'days-asc' | 'key-asc';
type FilterOption = 'all' | string;

interface TicketSummary {
  ticketKey: string;
  discipline?: string;
  currentState: string;
  currentStateDate: Date;
  daysInState: number;
  isStuck: boolean;
  events: LifecycleEvent[];
}

interface StateFlowCount {
  state: string;
  count: number;
  stuckCount: number;
  avgDays: number;
}

function getStateConfig(eventType: string) {
  // Try direct lookup first
  if (STATE_CONFIG[eventType]) {
    return STATE_CONFIG[eventType];
  }
  // Try lowercase
  const lower = eventType.toLowerCase();
  if (STATE_CONFIG[lower]) {
    return STATE_CONFIG[lower];
  }
  // Try uppercase with underscores
  const upper = eventType.toUpperCase().replace(/ /g, '_');
  if (STATE_CONFIG[upper]) {
    return STATE_CONFIG[upper];
  }
  // Fallback
  return {
    icon: Circle,
    colorVar: 'var(--muted-foreground)',
    label: eventType.replace(/_/g, ' '),
    order: 99,
  };
}

function StateIcon({ eventType, size = 16 }: { eventType: string; size?: number }) {
  const config = getStateConfig(eventType);
  const IconComponent = config.icon;
  return <IconComponent size={size} style={{ color: config.colorVar }} />;
}

function formatRelativeDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Pipeline Node Component
function PipelineNode({
  state,
  count,
  stuckCount,
  avgDays,
  isLast,
}: {
  state: string;
  count: number;
  stuckCount: number;
  avgDays: number;
  isLast: boolean;
}) {
  const config = getStateConfig(state);
  const IconComponent = config.icon;

  return (
    <div className="flex items-center">
      <div className="flex flex-col items-center">
        <div
          className="w-16 h-16 rounded-xl border-2 flex flex-col items-center justify-center bg-card shadow-sm transition-transform hover:scale-105"
          style={{ borderColor: config.colorVar }}
        >
          <IconComponent size={18} style={{ color: config.colorVar }} />
          <span className="text-lg font-bold mt-0.5">{count}</span>
        </div>
        <span className="text-xs font-medium mt-2 text-center max-w-[70px] truncate">
          {config.label}
        </span>
        {stuckCount > 0 && (
          <span className="text-xs text-warning flex items-center gap-0.5 mt-0.5">
            <AlertTriangle size={10} />
            {stuckCount}
          </span>
        )}
        <span className="text-xs text-muted-foreground">avg {avgDays.toFixed(1)}d</span>
      </div>
      {!isLast && <ArrowRight className="mx-2 text-muted-foreground/50" size={20} />}
    </div>
  );
}

// Expanded Ticket Timeline
function TicketTimeline({ events }: { events: LifecycleEvent[] }) {
  return (
    <div className="relative pl-4 border-l-2 border-muted ml-2 space-y-3 py-2">
      {events.map((event, idx) => {
        const eventDate =
          event.eventDate instanceof Date ? event.eventDate : new Date(event.eventDate);
        const prevEvent = events[idx + 1];
        const prevDate = prevEvent
          ? prevEvent.eventDate instanceof Date
            ? prevEvent.eventDate
            : new Date(prevEvent.eventDate)
          : null;
        const duration = prevDate
          ? ((eventDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)).toFixed(1)
          : null;

        const config = getStateConfig(event.eventType);

        return (
          <div key={event.id} className="relative">
            {/* Timeline dot */}
            <div
              className="absolute -left-[21px] w-3 h-3 rounded-full border-2 bg-card"
              style={{ borderColor: config.colorVar }}
            />
            <div className="flex items-center gap-3">
              <StateIcon eventType={event.eventType} size={14} />
              <span className="text-sm font-medium">{config.label}</span>
              <span className="text-xs text-muted-foreground ml-auto">
                {formatRelativeDate(eventDate)}
              </span>
            </div>
            {duration && (
              <div className="mt-1 ml-5">
                <Badge variant="outline" className="text-xs font-normal">
                  +{duration}d
                </Badge>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function TimelineView({ caseStudyId }: TimelineViewProps) {
  const { data: timeline, isLoading } = useTimeline(caseStudyId);
  const [expandedTickets, setExpandedTickets] = useState<Set<string>>(new Set());
  const [filterState, setFilterState] = useState<FilterOption>('all');
  const [sortOption, setSortOption] = useState<SortOption>('days-desc');

  // Process timeline data into ticket summaries
  const ticketSummaries = useMemo((): TicketSummary[] => {
    if (!timeline || timeline.length === 0) return [];

    const ticketMap = new Map<string, LifecycleEvent[]>();

    for (const event of timeline) {
      const existing = ticketMap.get(event.ticketKey) || [];
      existing.push(event);
      ticketMap.set(event.ticketKey, existing);
    }

    const now = new Date();
    const summaries: TicketSummary[] = [];

    for (const [ticketKey, events] of ticketMap) {
      const sortedEvents = [...events].sort((a, b) => {
        const dateA = a.eventDate instanceof Date ? a.eventDate : new Date(a.eventDate);
        const dateB = b.eventDate instanceof Date ? b.eventDate : new Date(b.eventDate);
        return dateB.getTime() - dateA.getTime();
      });

      const latestEvent = sortedEvents[0];
      const latestDate =
        latestEvent.eventDate instanceof Date
          ? latestEvent.eventDate
          : new Date(latestEvent.eventDate);

      const daysInState = (now.getTime() - latestDate.getTime()) / (1000 * 60 * 60 * 24);
      const isCompleted = ['RESOLVED', 'PR_MERGED', 'DEPLOYED_TO_BRANCH'].includes(
        latestEvent.eventType
      );
      const isStuck = !isCompleted && daysInState > STUCK_THRESHOLD_DAYS;

      summaries.push({
        ticketKey,
        discipline: (latestEvent as unknown as { discipline?: string }).discipline,
        currentState: latestEvent.eventType,
        currentStateDate: latestDate,
        daysInState,
        isStuck,
        events: sortedEvents,
      });
    }

    return summaries;
  }, [timeline]);

  // Calculate state flow counts for pipeline
  const stateFlowCounts = useMemo((): StateFlowCount[] => {
    const stateMap = new Map<string, { count: number; stuckCount: number; totalDays: number }>();

    for (const summary of ticketSummaries) {
      const existing = stateMap.get(summary.currentState) || {
        count: 0,
        stuckCount: 0,
        totalDays: 0,
      };
      existing.count += 1;
      if (summary.isStuck) existing.stuckCount += 1;
      existing.totalDays += summary.daysInState;
      stateMap.set(summary.currentState, existing);
    }

    return Array.from(stateMap.entries())
      .map(([state, data]) => ({
        state,
        count: data.count,
        stuckCount: data.stuckCount,
        avgDays: data.count > 0 ? data.totalDays / data.count : 0,
      }))
      .sort((a, b) => {
        const orderA = getStateConfig(a.state).order;
        const orderB = getStateConfig(b.state).order;
        return orderA - orderB;
      });
  }, [ticketSummaries]);

  // Filter and sort tickets
  const filteredSortedTickets = useMemo(() => {
    let filtered = ticketSummaries;

    // Apply filter
    if (filterState !== 'all') {
      filtered = filtered.filter((t) => t.currentState === filterState);
    }

    // Apply sort
    return [...filtered].sort((a, b) => {
      switch (sortOption) {
        case 'days-desc':
          return b.daysInState - a.daysInState;
        case 'days-asc':
          return a.daysInState - b.daysInState;
        case 'key-asc':
          return a.ticketKey.localeCompare(b.ticketKey);
        default:
          return 0;
      }
    });
  }, [ticketSummaries, filterState, sortOption]);

  const stuckTickets = ticketSummaries.filter((t) => t.isStuck);
  const totalStuck = stuckTickets.length;

  const toggleTicket = (ticketKey: string) => {
    setExpandedTickets((prev) => {
      const next = new Set(prev);
      if (next.has(ticketKey)) {
        next.delete(ticketKey);
      } else {
        next.add(ticketKey);
      }
      return next;
    });
  };

  const expandAllStuck = () => {
    setExpandedTickets(new Set(stuckTickets.map((t) => t.ticketKey)));
  };

  // Unique states for filter dropdown
  const uniqueStates = useMemo(() => {
    const states = new Set(ticketSummaries.map((t) => t.currentState));
    return Array.from(states).sort((a, b) => {
      return getStateConfig(a).order - getStateConfig(b).order;
    });
  }, [ticketSummaries]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Ticket Flow Analysis</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading timeline...</div>
        </CardContent>
      </Card>
    );
  }

  if (!timeline || timeline.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Ticket Flow Analysis</CardTitle>
        </CardHeader>
        <CardContent className="h-[200px] flex items-center justify-center">
          <p className="text-sm text-muted-foreground">
            No timeline events found for this case study.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                Ticket Flow Analysis
                {totalStuck > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {totalStuck} stuck
                  </Badge>
                )}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                {ticketSummaries.length} tickets in flow
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={filterState} onValueChange={(v) => setFilterState(v as FilterOption)}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <Filter className="h-3 w-3 mr-1" />
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                {uniqueStates.map((state) => (
                  <SelectItem key={state} value={state}>
                    {getStateConfig(state).label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SortDesc className="h-3 w-3 mr-1" />
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="days-desc">Days (High→Low)</SelectItem>
                <SelectItem value="days-asc">Days (Low→High)</SelectItem>
                <SelectItem value="key-asc">Ticket Key (A→Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Bottleneck Alert */}
        {totalStuck > 0 && (
          <div className="rounded-lg border border-warning/30 bg-warning-muted p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <div>
                  <p className="text-sm font-medium">
                    {totalStuck} ticket{totalStuck > 1 ? 's' : ''} stuck for &gt;{' '}
                    {STUCK_THRESHOLD_DAYS} days
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Consider reviewing blocked tickets to improve flow
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={expandAllStuck}>
                Expand All
              </Button>
            </div>
          </div>
        )}

        {/* Horizontal Pipeline */}
        <div className="overflow-x-auto pb-2">
          <div className="flex items-start justify-center gap-0 min-w-max px-4 py-2">
            {stateFlowCounts.map((flow, index) => (
              <PipelineNode
                key={flow.state}
                state={flow.state}
                count={flow.count}
                stuckCount={flow.stuckCount}
                avgDays={flow.avgDays}
                isLast={index === stateFlowCounts.length - 1}
              />
            ))}
          </div>
        </div>

        {/* Ticket List */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Tickets ({filteredSortedTickets.length})
          </p>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {filteredSortedTickets.slice(0, 20).map((ticket) => {
              const isExpanded = expandedTickets.has(ticket.ticketKey);
              const config = getStateConfig(ticket.currentState);

              return (
                <div
                  key={ticket.ticketKey}
                  className={`border rounded-lg transition-colors ${
                    ticket.isStuck ? 'border-warning/30 bg-warning-muted/30' : ''
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleTicket(ticket.ticketKey)}
                    className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors rounded-lg"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    )}
                    <span className="font-medium text-sm">{ticket.ticketKey}</span>
                    <Badge
                      variant="outline"
                      className="text-xs"
                      style={{ borderColor: config.colorVar, color: config.colorVar }}
                    >
                      {config.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {ticket.daysInState.toFixed(1)}d
                    </span>
                    {ticket.isStuck && <AlertTriangle className="h-4 w-4 text-warning" />}
                    {ticket.discipline && (
                      <Badge variant="secondary" className="ml-auto text-xs capitalize">
                        {ticket.discipline}
                      </Badge>
                    )}
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 border-t">
                      <TicketTimeline events={ticket.events} />
                    </div>
                  )}
                </div>
              );
            })}
            {filteredSortedTickets.length > 20 && (
              <p className="text-xs text-center text-muted-foreground py-2">
                Showing 20 of {filteredSortedTickets.length} tickets
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
