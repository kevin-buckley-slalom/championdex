import { useQuery } from '@tanstack/react-query';
import Fuse from 'fuse.js';
import { getAllAbilities } from '@/services/database/abilitiesRepository';
import { Ability } from '@/types';

interface UseAbilitiesListOptions {
  search?: string;
  sortDirection?: 'asc' | 'desc';
}

interface UseAbilitiesListResult {
  data: Ability[];
  isLoading: boolean;
  error: Error | null;
}

export function useAbilitiesList(options: UseAbilitiesListOptions = {}): UseAbilitiesListResult {
  const { search, sortDirection = 'asc' } = options;

  const query = useQuery({
    queryKey: ['abilities', 'list', search, sortDirection],
    queryFn: async () => {
      const abilitiesData = await getAllAbilities();

      let filtered = abilitiesData;

      // Apply fuzzy search
      if (search && search.trim()) {
        const fuse = new Fuse(filtered, {
          keys: ['name', 'displayName'],
          threshold: 0.3,
          includeScore: false,
        });
        filtered = fuse.search(search).map(result => result.item);
      }

      // Sort by name (always)
      const sorted = [...filtered];
      sorted.sort((a, b) => a.displayName.localeCompare(b.displayName));

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
