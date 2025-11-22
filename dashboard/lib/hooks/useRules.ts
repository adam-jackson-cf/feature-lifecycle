import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export interface RulesData {
  complexity: unknown;
  discipline: unknown;
}

export function useRules() {
  const queryClient = useQueryClient();

  const query = useQuery<RulesData>({
    queryKey: ['rules'],
    queryFn: async () => {
      const response = await fetch('/api/rules');
      if (!response.ok) {
        throw new Error('Failed to fetch rules');
      }
      return response.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<RulesData>) => {
      const response = await fetch('/api/rules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error('Failed to update rules');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rules'] });
    },
  });

  return {
    ...query,
    update: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  };
}
