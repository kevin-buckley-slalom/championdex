import { useQuery } from '@tanstack/react-query';
import { getAbilityById } from '@/services/database/abilitiesRepository';
import { Ability } from '@/types';

interface UseAbilityDetailResult {
  data: Ability | null;
  isLoading: boolean;
  error: Error | null;
}

export function useAbilityDetail(id: number): UseAbilityDetailResult {
  const query = useQuery({
    queryKey: ['ability', 'detail', id],
    queryFn: async () => {
      return await getAbilityById(id);
    },
    staleTime: Infinity,
    enabled: id > 0, // Only run query if id is valid
  });

  return {
    data: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
  };
}
