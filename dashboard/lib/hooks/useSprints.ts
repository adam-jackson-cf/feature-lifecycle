import { useQuery } from '@tanstack/react-query';
import type { SprintSummary } from '@/lib/types';

export function useSprints(caseStudyId: string) {
  return useQuery<SprintSummary[]>({
    queryKey: ['sprints', caseStudyId],
    queryFn: async () => {
      const response = await fetch(`/api/case-studies/${caseStudyId}/sprints`);
      if (!response.ok) {
        throw new Error('Failed to fetch sprints');
      }
      const json = await response.json();
      return (json.sprints as SprintSummary[]) || [];
    },
    enabled: !!caseStudyId,
  });
}
