import { useQuery } from '@tanstack/react-query';
import {
  getPokemonSpeciesData,
  PokemonSpeciesData,
} from '@/services/database/pokemonSpeciesRepository';

interface UsePokemonSpeciesDataResult {
  data: PokemonSpeciesData | null;
  isLoading: boolean;
  error: Error | null;
}

export function usePokemonSpeciesData(id: number): UsePokemonSpeciesDataResult {
  const query = useQuery({
    queryKey: ['pokemon', 'species', id],
    queryFn: async () => {
      return await getPokemonSpeciesData(id);
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
