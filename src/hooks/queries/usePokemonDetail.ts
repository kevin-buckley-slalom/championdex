import { useQuery } from '@tanstack/react-query';
import { getPokemonById } from '@/services/database/pokemonRepository';
import { Pokemon } from '@/types';

interface UsePokemonDetailResult {
  data: Pokemon | null;
  isLoading: boolean;
  error: Error | null;
}

export function usePokemonDetail(id: number): UsePokemonDetailResult {
  const query = useQuery({
    queryKey: ['pokemon', 'detail', id],
    queryFn: async () => {
      return await getPokemonById(id);
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
