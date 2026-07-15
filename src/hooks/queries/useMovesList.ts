import { useQuery } from '@tanstack/react-query';
import Fuse from 'fuse.js';
import { getAllMoves } from '@/services/database/movesRepository';
import { Move, MoveCategory } from '@/types';

interface UseMovesListOptions {
  search?: string;
  type?: string;
  category?: MoveCategory;
  sortBy?: 'name' | 'power' | 'pp';
  sortDirection?: 'asc' | 'desc';
}

interface UseMovesListResult {
  data: Move[];
  isLoading: boolean;
  error: Error | null;
}

export function useMovesList(options: UseMovesListOptions = {}): UseMovesListResult {
  const { search, type, category, sortBy = 'name', sortDirection = 'asc' } = options;

  const query = useQuery({
    queryKey: ['moves', 'list', search, type, category, sortBy, sortDirection],
    queryFn: async () => {
      const movesData = await getAllMoves();

      let filtered = movesData;

      // Filter by type
      if (type) {
        filtered = filtered.filter(m => m.type === type);
      }

      // Filter by category
      if (category) {
        filtered = filtered.filter(m => m.category === category);
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

      if (sortBy === 'name') {
        sorted.sort((a, b) => {
          const cmp = a.displayName.localeCompare(b.displayName);
          return sortDirection === 'asc' ? cmp : -cmp;
        });
      } else if (sortBy === 'power') {
        sorted.sort((a, b) => {
          const powerA = a.power ?? -1;
          const powerB = b.power ?? -1;
          return sortDirection === 'desc' ? powerB - powerA : powerA - powerB;
        });
      } else if (sortBy === 'pp') {
        sorted.sort((a, b) =>
          sortDirection === 'desc' ? b.pp - a.pp : a.pp - b.pp
        );
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
