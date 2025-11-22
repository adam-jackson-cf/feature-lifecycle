import { useQuery } from '@tanstack/react-query';
import type { LifecycleEvent } from '@/lib/types';

export function useTimeline(caseStudyId: string) {
  return useQuery<LifecycleEvent[]>({
    queryKey: ['timeline', caseStudyId],
    queryFn: async () => {
      const response = await fetch(`/api/metrics/${caseStudyId}/timeline`);
      if (!response.ok) {
        throw new Error('Failed to fetch timeline');
      }
      return response.json();
    },
    enabled: !!caseStudyId,
  });
}
