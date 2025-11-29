'use client';

import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Circle,
  Diamond,
  GitMerge,
  Square,
  Star,
  Triangle,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTimeline } from '@/lib/hooks/useTimeline';
import type { LifecycleEvent } from '@/lib/types';

interface TimelineViewProps {
  caseStudyId: string;
}

// State configuration with colors and symbols
const STATE_CONFIG: Record<string, { icon: typeof Diamond; color: string; label: string }> = {
  TICKET_CREATED: { icon: Diamond, color: '#8B5CF6', label: 'Created' },
  STATUS_CHANGED: { icon: Circle, color: '#3B82F6', label: 'In Progress' },
  PR_OPENED: { icon: Square, color: '#EC4899', label: 'In Review' },
  PR_REVIEWED: { icon: Square, color: '#F59E0B', label: 'Review' },
  PR_APPROVED: { icon: Triangle, color: '#10B981', label: 'Approved' },
  PR_MERGED: { icon: GitMerge, color: '#6366F1', label: 'Merged' },
  RESOLVED: { icon: Star, color: '#22C55E', label: 'Done' },
  DEPLOYED_TO_BRANCH: { icon: Star, color: '#22C55E', label: 'Deployed' },
};

const STUCK_THRESHOLD_DAYS = 2;

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
  return (
    STATE_CONFIG[eventType] || {
      icon: Circle,
      color: '#9CA3AF',
      label: eventType.replace(/_/g, ' '),
    }
  );
}

function StateIcon({ eventType, size = 16 }: { eventType: string; size?: number }) {
  const config = getStateConfig(eventType);
  const IconComponent = config.icon;
  return <IconComponent size={size} style={{ color: config.color }} />;
}

export function TimelineView({ caseStudyId }: TimelineViewProps) {
  const { data: timeline, isLoading } = useTimeline(caseStudyId);
  const [expandedTickets, setExpandedTickets] = useState<Set<string>>(new Set());

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

    return summaries.sort((a, b) => {
      if (a.isStuck && !b.isStuck) return -1;
      if (!a.isStuck && b.isStuck) return 1;
      return b.daysInState - a.daysInState;
    });
  }, [timeline]);

  // Calculate state flow counts
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

    return Array.from(stateMap.entries()).map(([state, data]) => ({
      state,
      count: data.count,
      stuckCount: data.stuckCount,
      avgDays: data.count > 0 ? data.totalDays / data.count : 0,
    }));
  }, [ticketSummaries]);

  const stuckTickets = ticketSummaries.filter((t) => t.isStuck);

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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ticket Flow Analysis</CardTitle>
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
        <CardHeader>
          <CardTitle>Ticket Flow Analysis</CardTitle>
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
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">Ticket Flow Analysis</CardTitle>
        <p className="text-xs text-muted-foreground">
          Current state distribution and bottleneck identification
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* State Flow Summary */}
        <div className="flex flex-wrap items-center justify-center gap-4 p-4 bg-muted/30 rounded-lg">
          {stateFlowCounts.map((flow, index) => {
            const config = getStateConfig(flow.state);
            const IconComponent = config.icon;
            return (
              <div key={flow.state} className="flex items-center gap-2">
                {index > 0 && <div className="w-8 h-px bg-border" />}
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <IconComponent size={16} style={{ color: config.color }} />
                    <span className="text-xs font-medium">{config.label}</span>
                  </div>
                  <p className="text-lg font-bold">{flow.count}</p>
                  {flow.stuckCount > 0 && (
                    <p className="text-xs text-amber-600 flex items-center justify-center gap-1">
                      <AlertTriangle size={10} />
                      {flow.stuckCount} stuck
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">avg {flow.avgDays.toFixed(1)}d</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottleneck Tickets */}
        {stuckTickets.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <h3 className="font-semibold text-sm">
                Bottleneck Tickets ({stuckTickets.length} stuck &gt; {STUCK_THRESHOLD_DAYS} days)
              </h3>
            </div>
            <div className="space-y-2">
              {stuckTickets.slice(0, 10).map((ticket) => {
                const isExpanded = expandedTickets.has(ticket.ticketKey);
                const config = getStateConfig(ticket.currentState);

                return (
                  <div key={ticket.ticketKey} className="border rounded-lg">
                    <button
                      type="button"
                      onClick={() => toggleTicket(ticket.ticketKey)}
                      className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="font-medium">{ticket.ticketKey}</span>
                      <span className="text-sm text-muted-foreground">
                        {config.label} for {ticket.daysInState.toFixed(1)}d
                      </span>
                      <StateIcon eventType={ticket.currentState} />
                      {ticket.discipline && (
                        <Badge variant="outline" className="ml-auto capitalize">
                          {ticket.discipline}
                        </Badge>
                      )}
                    </button>

                    {isExpanded && (
                      <div className="px-3 pb-3 border-t">
                        <div className="pt-3 pl-6 space-y-2">
                          {ticket.events.map((event, idx) => {
                            const eventDate =
                              event.eventDate instanceof Date
                                ? event.eventDate
                                : new Date(event.eventDate);
                            const prevEvent = ticket.events[idx + 1];
                            const prevDate =
                              prevEvent?.eventDate instanceof Date
                                ? prevEvent.eventDate
                                : prevEvent
                                  ? new Date(prevEvent.eventDate)
                                  : null;
                            const duration = prevDate
                              ? (
                                  (eventDate.getTime() - prevDate.getTime()) /
                                  (1000 * 60 * 60 * 24)
                                ).toFixed(1)
                              : null;

                            return (
                              <div key={event.id} className="flex items-center gap-3 text-sm">
                                <StateIcon eventType={event.eventType} size={14} />
                                <span className="text-muted-foreground w-20">
                                  {eventDate.toLocaleDateString()}
                                </span>
                                <span>{getStateConfig(event.eventType).label}</span>
                                {duration && (
                                  <span className="text-xs text-muted-foreground">
                                    (+{duration}d)
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* State Legend */}
        <div className="flex flex-wrap gap-4 pt-2 border-t">
          {Object.entries(STATE_CONFIG)
            .slice(0, 6)
            .map(([key, config]) => {
              const IconComponent = config.icon;
              return (
                <div key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <IconComponent size={12} style={{ color: config.color }} />
                  <span>{config.label}</span>
                </div>
              );
            })}
        </div>
      </CardContent>
    </Card>
  );
}
