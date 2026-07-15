import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { getPokemonMoveset } from '@/services/database/pokemonRepository';

export type SortOption = 'name' | 'power' | 'accuracy' | 'category';

interface Move {
  id: number;
  name: string;
  displayName: string;
  type: string;
  category: string;
  power: number | null;
  accuracy: number | null;
  pp: number;
  learnMethod: string;
  learnLevel: number | null;
}

interface UseMovesetForPokemonResult {
  moves: Move[];
  isLoading: boolean;
  error: Error | null;
}

export function useMovesetForPokemon(
  pokemonId: number,
  searchQuery?: string,
  sortBy?: SortOption
): UseMovesetForPokemonResult {
  const query = useQuery({
    queryKey: ['pokemon', 'moveset', pokemonId],
    queryFn: async () => {
      return await getPokemonMoveset(pokemonId);
    },
    staleTime: Infinity,
    enabled: pokemonId > 0,
  });

  // Apply local filtering and sorting
  const filteredAndSorted = useMemo(() => {
    if (!query.data) return [];

    let result = [...query.data];

    // Apply search filter
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(move =>
        move.displayName.toLowerCase().includes(query) ||
        move.name.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    if (sortBy) {
      switch (sortBy) {
        case 'power':
          result.sort((a, b) => {
            const powerA = a.power ?? 0;
            const powerB = b.power ?? 0;
            return powerB - powerA;
          });
          break;
        case 'accuracy':
          result.sort((a, b) => {
            const accA = a.accuracy ?? 0;
            const accB = b.accuracy ?? 0;
            return accB - accA;
          });
          break;
        case 'category':
          result.sort((a, b) => a.category.localeCompare(b.category));
          break;
        case 'name':
        default:
          result.sort((a, b) => a.displayName.localeCompare(b.displayName));
          break;
      }
    }

    return result;
  }, [query.data, searchQuery, sortBy]);

  return {
    moves: filteredAndSorted,
    isLoading: query.isLoading,
    error: query.error,
  };
}
