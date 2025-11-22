import { useQuery } from '@tanstack/react-query';
import type { CaseStudy } from '@/lib/types';

export function useCaseStudies() {
  return useQuery<CaseStudy[]>({
    queryKey: ['case-studies'],
    queryFn: async () => {
      const response = await fetch('/api/case-studies');
      if (!response.ok) {
        throw new Error('Failed to fetch case studies');
      }
      return response.json();
    },
  });
}
