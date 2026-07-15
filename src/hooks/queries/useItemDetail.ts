import { useQuery } from '@tanstack/react-query';
import { getItemById } from '@/services/database/itemsRepository';
import { Item } from '@/types';

interface UseItemDetailResult {
  data: Item | null;
  isLoading: boolean;
  error: Error | null;
}

export function useItemDetail(id: number): UseItemDetailResult {
  const query = useQuery({
    queryKey: ['item', 'detail', id],
    queryFn: async () => {
      return await getItemById(id);
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
