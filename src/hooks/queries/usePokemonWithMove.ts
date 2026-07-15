import { useQuery } from '@tanstack/react-query';
import { getDatabase } from '@/services/database/initializeDatabase';
import { PokemonType } from '@/types';

export interface PokemonWithMoveData {
  id: number;
  name: string;
  nationalDexNumber: number;
  primaryType: PokemonType;
  secondaryType: PokemonType | null;
  pokeApiId: number;
  learnMethod: string;
  learnLevel: number | null;
}

interface UsePokemonWithMoveResult {
  pokemon: PokemonWithMoveData[];
  count: number;
  isLoading: boolean;
  error: Error | null;
}

export function usePokemonWithMove(moveId: number): UsePokemonWithMoveResult {
  const query = useQuery({
    queryKey: ['pokemon', 'with-move', moveId],
    queryFn: async () => {
      const db = await getDatabase();

      const results = await db.getAllAsync<any>(
        `SELECT
          p.id, p.name, p.national_dex, p.pokeapi_id, p.primary_type, p.secondary_type,
          pm.learn_method, pm.learn_level
        FROM pokemon_moves pm
        JOIN pokemon p ON pm.pokemon_id = p.id
        WHERE pm.move_id = ?
        ORDER BY p.national_dex ASC`,
        [moveId]
      );

      return results.map((row): PokemonWithMoveData => ({
        id: row.id,
        name: row.name,
        nationalDexNumber: row.national_dex,
        primaryType: row.primary_type as PokemonType,
        secondaryType: row.secondary_type as PokemonType | null,
        pokeApiId: row.pokeapi_id ?? row.national_dex,
        learnMethod: row.learn_method,
        learnLevel: row.learn_level,
      }));
    },
    staleTime: Infinity,
    enabled: moveId > 0,
  });

  return {
    pokemon: query.data ?? [],
    count: query.data?.length ?? 0,
    isLoading: query.isLoading,
    error: query.error,
  };
}
