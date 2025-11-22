import { useQuery } from '@tanstack/react-query';
import type { CaseStudy } from '@/lib/types';

export function useCaseStudy(id: string) {
  return useQuery<CaseStudy>({
    queryKey: ['case-study', id],
    queryFn: async () => {
      const response = await fetch(`/api/case-studies/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch case study');
      }
      return response.json();
    },
    enabled: !!id,
  });
}
