import { useQuery } from '@tanstack/react-query';
import { getDatabase } from '@/services/database/initializeDatabase';
import { RelatedForm } from '@/components/pokemon/RelatedFormsSection';

export function useRelatedForms(pokemonId: number) {
  const query = useQuery({
    queryKey: ['pokemon', 'related-forms', pokemonId],
    queryFn: async () => {
      const db = await getDatabase();

      // First, get the national_dex for the current pokemon
      const currentPokemon = await db.getFirstAsync<any>(
        `SELECT national_dex FROM pokemon WHERE id = ?`,
        [pokemonId]
      );

      if (!currentPokemon) {
        return [];
      }

      // Then get all pokemon with the same national_dex
      const results = await db.getAllAsync<any>(
        `SELECT id, name, display_name, form_type, primary_type, secondary_type, sprite_url, national_dex, pokeapi_id
         FROM pokemon
         WHERE national_dex = ?
         ORDER BY form_type ASC, id ASC`,
        [currentPokemon.national_dex]
      );

      const SPRITE_URL_OVERRIDES = new Map<number, string>([
        [527, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/412-sandy.png'],
        [528, 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/412-trash.png'],
      ]);

      return results.map((r): RelatedForm => {
        // Use sprite_url if available, otherwise construct from pokeapi_id (falls back to national_dex for base forms)
        const formId = r.pokeapi_id > 0 ? r.pokeapi_id : r.national_dex;
        const spriteUrl = SPRITE_URL_OVERRIDES.get(r.id) ??
          r.sprite_url ??
          `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${formId}.png`;

        return {
          id: r.id,
          name: r.display_name || r.name,
          formType: r.form_type,
          spriteUrl,
          typePrimary: r.primary_type,
          typeSecondary: r.secondary_type,
          isCurrent: r.id === pokemonId,
        };
      });
    },
    staleTime: Infinity,
    enabled: pokemonId > 0,
  });

  return { data: query.data ?? [], isLoading: query.isLoading, error: query.error };
}
