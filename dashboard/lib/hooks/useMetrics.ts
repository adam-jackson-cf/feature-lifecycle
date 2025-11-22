import { useQuery } from '@tanstack/react-query';
import type { MetricsSummary } from '@/lib/types';

export function useMetrics(caseStudyId: string) {
  return useQuery<MetricsSummary>({
    queryKey: ['metrics', caseStudyId],
    queryFn: async () => {
      const response = await fetch(`/api/metrics/${caseStudyId}/summary`);
      if (!response.ok) {
        throw new Error('Failed to fetch metrics');
      }
      return response.json();
    },
    enabled: !!caseStudyId,
  });
}
