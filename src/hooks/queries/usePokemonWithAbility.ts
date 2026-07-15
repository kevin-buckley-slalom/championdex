import { useQuery } from '@tanstack/react-query';
import { getPokemonWithAbility } from '@/services/database/pokemonRepository';

interface PokemonWithAbility {
  id: number;
  name: string;
  displayName: string;
  nationalDex: number;
  pokeApiId: number;
  primaryType: string;
  secondaryType: string | null;
  generation: number;
  isHidden: boolean;
}

interface UsePokemonWithAbilityResult {
  pokemon: PokemonWithAbility[];
  count: number;
  isLoading: boolean;
  error: Error | null;
}

export function usePokemonWithAbility(abilityId: number): UsePokemonWithAbilityResult {
  const query = useQuery({
    queryKey: ['pokemon', 'ability', abilityId],
    queryFn: async () => {
      return await getPokemonWithAbility(abilityId);
    },
    staleTime: Infinity,
    enabled: abilityId > 0,
  });

  return {
    pokemon: query.data ?? [],
    count: query.data?.length ?? 0,
    isLoading: query.isLoading,
    error: query.error,
  };
}
