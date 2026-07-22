import { useQuery } from '@tanstack/react-query';
import { getDatabase } from '@/services/database/initializeDatabase';

export interface EncounterLocation {
  locationName: string;
  locationAreaSlug: string;
  encounterMethod: string;
  encounterChance: number;
  minLevel: number | null;
  maxLevel: number | null;
}

export function useEncounterLocations(pokemonId: number, gameVersion: string | null) {
  return useQuery({
    queryKey: ['pokemon', 'encounters', 'v1', pokemonId, gameVersion],
    queryFn: async (): Promise<EncounterLocation[]> => {
      if (!pokemonId || !gameVersion) return [];
      const db = await getDatabase();
      const rows = await db.getAllAsync<{
        location_name: string;
        location_area_slug: string;
        encounter_method: string;
        encounter_chance: number;
        min_level: number | null;
        max_level: number | null;
      }>(
        `SELECT location_name, location_area_slug, encounter_method, encounter_chance, min_level, max_level
         FROM pokemon_encounter_locations
         WHERE pokemon_id = ? AND game_version = ?
         ORDER BY encounter_chance DESC`,
        [pokemonId, gameVersion]
      );
      return rows.map(r => ({
        locationName: r.location_name,
        locationAreaSlug: r.location_area_slug,
        encounterMethod: r.encounter_method,
        encounterChance: r.encounter_chance,
        minLevel: r.min_level,
        maxLevel: r.max_level,
      }));
    },
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    enabled: !!pokemonId && !!gameVersion,
  });
}

export function useEncounterGameVersions(pokemonId: number) {
  return useQuery({
    queryKey: ['pokemon', 'encounter-versions', 'v1', pokemonId],
    queryFn: async (): Promise<string[]> => {
      if (!pokemonId) return [];
      const db = await getDatabase();
      const rows = await db.getAllAsync<{ game_version: string }>(
        `SELECT DISTINCT game_version FROM pokemon_encounter_locations
         WHERE pokemon_id = ? AND encounter_chance > 0
         ORDER BY game_version`,
        [pokemonId]
      );
      return rows.map(r => r.game_version);
    },
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    enabled: !!pokemonId,
  });
}

export function useDefaultFormId(nationalDex: number, formType: string) {
  return useQuery({
    queryKey: ['pokemon', 'default-form-id', nationalDex],
    queryFn: async (): Promise<number | null> => {
      const db = await getDatabase();
      const row = await db.getFirstAsync<{ id: number }>(
        `SELECT id FROM pokemon WHERE national_dex = ? AND form_type = 'default' ORDER BY id LIMIT 1`,
        [nationalDex]
      );
      return row?.id ?? null;
    },
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    enabled: formType !== 'default' && nationalDex > 0,
  });
}
