import { useQuery } from '@tanstack/react-query';
import { getPokemonAbilitiesWithHidden } from '@/services/database/pokemonRepository';

export function usePokemonAbilities(pokemonId: number) {
  const query = useQuery({
    queryKey: ['pokemon', 'abilities', pokemonId],
    queryFn: () => getPokemonAbilitiesWithHidden(pokemonId),
    staleTime: Infinity,
    enabled: pokemonId > 0,
  });
  return { data: query.data ?? [], isLoading: query.isLoading, error: query.error };
}
