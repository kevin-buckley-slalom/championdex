import { useQuery } from '@tanstack/react-query';
import Fuse from 'fuse.js';
import { getAllItems } from '@/services/database/itemsRepository';
import { Item, ItemCategory } from '@/types';

interface UseItemsListOptions {
  search?: string;
  category?: ItemCategory;
  sortBy?: 'name' | 'category';
  sortDirection?: 'asc' | 'desc';
}

interface UseItemsListResult {
  data: Item[];
  isLoading: boolean;
  error: Error | null;
}

export function useItemsList(options: UseItemsListOptions = {}): UseItemsListResult {
  const { search, category, sortBy = 'name', sortDirection = 'asc' } = options;

  const query = useQuery({
    queryKey: ['items', 'list', search, category, sortBy, sortDirection],
    queryFn: async () => {
      const itemsData = await getAllItems();

      let filtered = itemsData;

      // Filter by category
      if (category) {
        filtered = filtered.filter(i => i.category === category);
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
        sorted.sort((a, b) => a.displayName.localeCompare(b.displayName));
      } else if (sortBy === 'category') {
        sorted.sort((a, b) => a.category.localeCompare(b.category));
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
