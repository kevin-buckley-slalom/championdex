import { useQuery } from '@tanstack/react-query';
import { getEvolutionChain, EvolutionNode } from '@/services/database/pokemonSpeciesRepository';

export function useEvolutionChain(pokemonId: number) {
  return useQuery({
    queryKey: ['pokemon', 'evolution-chain', 'v2', pokemonId],
    queryFn: () => getEvolutionChain(pokemonId),
    staleTime: Infinity,
    enabled: pokemonId > 0,
  });
}
