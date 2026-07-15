import { useQuery } from '@tanstack/react-query';
import Fuse from 'fuse.js';
import { getAllPokemon } from '@/services/database/pokemonRepository';
import { PokemonListItem, PokemonType } from '@/types';

export type PokemonSortBy = 'dex' | 'name' | 'total' | 'hp' | 'attack' | 'defense' | 'specialAttack' | 'specialDefense' | 'speed';

interface UsePokemonListOptions {
  search?: string;
  types?: PokemonType[];
  generation?: number;
  sortBy?: PokemonSortBy;
  sortDirection?: 'asc' | 'desc';
  typeFilterMode?: 'or' | 'and';
}

interface UsePokemonListResult {
  data: PokemonListItem[];
  isLoading: boolean;
  error: Error | null;
}

export function usePokemonList(options: UsePokemonListOptions = {}): UsePokemonListResult {
  const { search, types, generation, sortBy = 'dex', sortDirection = 'asc', typeFilterMode = 'or' } = options;

  const query = useQuery({
    queryKey: ['pokemon', 'list', search, types?.join(',') ?? '', typeFilterMode ?? 'or', generation, sortBy, sortDirection],
    queryFn: async () => {
      const pokemonData = await getAllPokemon();

      let filtered = pokemonData;

      // Filter by generation
      if (generation !== undefined) {
        filtered = filtered.filter(p => p.generation === generation);
      }

      if (types && types.length > 0) {
        const normalizedTypes = types.map(t => t.toLowerCase());
        if (typeFilterMode === 'and' && normalizedTypes.length === 2) {
          filtered = filtered.filter(p => {
            const primary = p.primaryType.toLowerCase();
            const secondary = p.secondaryType?.toLowerCase() ?? '';
            return (
              (normalizedTypes.includes(primary) && normalizedTypes.includes(secondary))
            );
          });
        } else {
          filtered = filtered.filter(
            p =>
              normalizedTypes.includes(p.primaryType.toLowerCase()) ||
              (p.secondaryType && normalizedTypes.includes(p.secondaryType.toLowerCase()))
          );
        }
      }

      // Apply fuzzy search
      if (search && search.trim()) {
        const fuse = new Fuse(filtered, {
          keys: ['name', 'displayName'],
          threshold: 0.3,
          includeScore: false,
        });
        filtered = fuse.search(search).map(result => result.item);
      }

      // Sort results
      const sorted = [...filtered];

      const statKey: Record<string, (p: PokemonListItem) => number> = {
        total: p => p.baseStats.hp + p.baseStats.attack + p.baseStats.defense + p.baseStats.specialAttack + p.baseStats.specialDefense + p.baseStats.speed,
        hp: p => p.baseStats.hp,
        attack: p => p.baseStats.attack,
        defense: p => p.baseStats.defense,
        specialAttack: p => p.baseStats.specialAttack,
        specialDefense: p => p.baseStats.specialDefense,
        speed: p => p.baseStats.speed,
      };

      if (sortBy === 'name') {
        sorted.sort((a, b) => a.displayName.localeCompare(b.displayName));
      } else if (statKey[sortBy]) {
        const getValue = statKey[sortBy];
        sorted.sort((a, b) => getValue(a) - getValue(b));
      } else {
        sorted.sort((a, b) => a.nationalDex - b.nationalDex);
      }

      // Apply sort direction
      if (sortDirection === 'desc') {
        sorted.reverse();
      }

      return sorted;
    },
    staleTime: Infinity,
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}
