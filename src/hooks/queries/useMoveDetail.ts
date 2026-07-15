import { useQuery } from '@tanstack/react-query';
import { getMoveById } from '@/services/database/movesRepository';
import { Move } from '@/types';

interface UseMoveDetailResult {
  data: Move | null;
  isLoading: boolean;
  error: Error | null;
}

export function useMoveDetail(id: number): UseMoveDetailResult {
  const query = useQuery({
    queryKey: ['move', 'detail', id],
    queryFn: async () => {
      return await getMoveById(id);
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
