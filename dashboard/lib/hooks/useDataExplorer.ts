import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { JiraTicket, LifecycleEvent, NormalizedEvent } from '@/lib/types';

export type DataExplorerItemType = 'ticket' | 'event' | 'normalized_event';

export interface DataExplorerFilters {
  caseStudyId: string;
  type?: DataExplorerItemType;
  search?: string;
  phase?: string;
  discipline?: string;
  complexity?: string;
  status?: string;
  excludedOnly?: boolean;
  hasOverrides?: boolean;
  limit?: number;
  offset?: number;
}

export interface DataExplorerResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface OverrideUpdate {
  phaseOverride?: string | null;
  disciplineOverride?: string | null;
  complexityOverride?: string | null;
  excludedFromMetrics?: boolean;
  customLabels?: string[];
}

function buildQueryString(filters: DataExplorerFilters): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  });
  return params.toString();
}

export function useDataExplorer<T = JiraTicket | LifecycleEvent | NormalizedEvent>(
  filters: DataExplorerFilters
) {
  return useQuery<DataExplorerResult<T>>({
    queryKey: ['data-explorer', filters],
    queryFn: async () => {
      const queryString = buildQueryString(filters);
      const response = await fetch(`/api/data-explorer?${queryString}`);
      if (!response.ok) {
        throw new Error('Failed to fetch data explorer results');
      }
      return response.json();
    },
    enabled: !!filters.caseStudyId,
  });
}

export function useDataExplorerUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      type,
      updates,
    }: {
      id: string;
      type: DataExplorerItemType;
      updates: OverrideUpdate;
    }) => {
      const response = await fetch(`/api/data-explorer/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, updates }),
      });
      if (!response.ok) {
        throw new Error('Failed to update record');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-explorer'] });
      queryClient.invalidateQueries({ queryKey: ['phase-distribution'] });
      queryClient.invalidateQueries({ queryKey: ['aggregate-phase-distribution'] });
    },
  });
}

export function useDataExplorerBulkUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      type,
      ids,
      updates,
    }: {
      type: DataExplorerItemType;
      ids: string[];
      updates: OverrideUpdate;
    }) => {
      const response = await fetch('/api/data-explorer/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, ids, updates }),
      });
      if (!response.ok) {
        throw new Error('Failed to bulk update records');
      }
      return response.json() as Promise<{ updatedCount: number }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['data-explorer'] });
      queryClient.invalidateQueries({ queryKey: ['phase-distribution'] });
      queryClient.invalidateQueries({ queryKey: ['aggregate-phase-distribution'] });
    },
  });
}
