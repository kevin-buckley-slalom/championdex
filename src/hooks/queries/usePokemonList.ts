import { useInfiniteQuery } from '@tanstack/react-query';
import { getPokemonPage } from '@/services/database/pokemonRepository';
import { PokemonListItem, PokemonType } from '@/types';

export type PokemonSortBy = 'dex' | 'name' | 'total' | 'hp' | 'attack' | 'defense' | 'specialAttack' | 'specialDefense' | 'speed';

interface UsePokemonListOptions {
  search?: string;
  types?: PokemonType[];
  generation?: number;
  sortBy?: PokemonSortBy;
  sortDirection?: 'asc' | 'desc';
  typeFilterMode?: 'or' | 'and';
  pageSize?: number;
}

interface UsePokemonListResult {
  data: PokemonListItem[];
  isLoading: boolean;
  error: Error | null;
  fetchNextPage: () => Promise<any>;
  hasNextPage: boolean | undefined;
  isFetchingNextPage: boolean;
}

const DEFAULT_PAGE_SIZE = 50;

export function usePokemonList(options: UsePokemonListOptions = {}): UsePokemonListResult {
  const {
    search,
    types,
    generation,
    sortBy = 'dex',
    sortDirection = 'asc',
    typeFilterMode = 'or',
    pageSize = DEFAULT_PAGE_SIZE,
  } = options;

  const query = useInfiniteQuery({
    queryKey: [
      'pokemon',
      'list',
      search,
      types?.join(',') ?? '',
      typeFilterMode ?? 'or',
      generation,
      sortBy,
      sortDirection,
    ],
    queryFn: async ({ pageParam = 0 }) => {
      const offset = pageParam * pageSize;
      return getPokemonPage({
        limit: pageSize,
        offset,
        search,
        types: types as PokemonType[] | undefined,
        generation,
        sortBy,
        sortDirection,
        typeFilterMode,
      });
    },
    getNextPageParam: (lastPage, allPages) => {
      // If the last page had fewer items than the page size, we've reached the end
      if (lastPage.length < pageSize) {
        return undefined;
      }
      return allPages.length;
    },
    initialPageParam: 0,
    staleTime: Infinity,
  });

  // Flatten all pages into a single array
  const flattenedData = query.data?.pages.flatMap(page => page) ?? [];

  return {
    data: flattenedData,
    isLoading: query.isLoading,
    error: query.error,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
  };
}
