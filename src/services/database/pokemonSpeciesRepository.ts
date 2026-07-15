import { getDatabase } from './initializeDatabase';

export interface PokemonEvolution {
  id: number;
  pokemonId: number;
  evolvesToId: number;
  method: string;
  conditionValue: string | null;
}

export interface EvolutionNode {
  pokemonId: number;
  nationalDex: number;
  displayName: string;
  primaryType: string;
  pokeApiId: number;
  evolvesTo: EvolutionStep[];
}

export interface EvolutionStep {
  method: string;
  conditionValue: string | null;
  pokemon: EvolutionNode;
}

export interface PokemonFlavorText {
  id: number;
  pokemonId: number;
  gameVersion: string;
  flavorText: string;
}

export interface PokemonSpeciesData {
  genderRate: number;
  classification: string | null;
  flavorTexts: PokemonFlavorText[];
  evolutions: PokemonEvolution[];
}

export async function getPokemonSpeciesData(pokemonId: number): Promise<PokemonSpeciesData | null> {
  const db = await getDatabase();

  // Get base species data from pokemon table
  const pokemon = await db.getFirstAsync<{
    gender_rate: number;
    species_classification: string | null;
  }>(
    `SELECT gender_rate, species_classification FROM pokemon WHERE id = ?`,
    [pokemonId]
  );

  if (!pokemon) {
    return null;
  }

  // Get flavor texts
  const flavorTexts = await db.getAllAsync<any>(
    `SELECT id, pokemon_id, game_version, flavor_text FROM pokemon_flavor_text WHERE pokemon_id = ? ORDER BY game_version`,
    [pokemonId]
  );

  // Get evolutions
  const evolutions = await db.getAllAsync<any>(
    `SELECT id, pokemon_id, evolves_to_id, method, condition_value FROM pokemon_evolutions WHERE pokemon_id = ?`,
    [pokemonId]
  );

  return {
    genderRate: pokemon.gender_rate,
    classification: pokemon.species_classification,
    flavorTexts: flavorTexts.map(row => dbRowToFlavorText(row)),
    evolutions: evolutions.map(row => dbRowToEvolution(row)),
  };
}

export async function getPokemonEvolutions(pokemonId: number): Promise<PokemonEvolution[]> {
  const db = await getDatabase();

  const results = await db.getAllAsync<any>(
    `SELECT id, pokemon_id, evolves_to_id, method, condition_value FROM pokemon_evolutions WHERE pokemon_id = ?`,
    [pokemonId]
  );

  return results.map(row => dbRowToEvolution(row));
}

export async function getPokemonFlavorTexts(pokemonId: number): Promise<PokemonFlavorText[]> {
  const db = await getDatabase();

  const results = await db.getAllAsync<any>(
    `SELECT id, pokemon_id, game_version, flavor_text FROM pokemon_flavor_text WHERE pokemon_id = ? ORDER BY game_version`,
    [pokemonId]
  );

  return results.map(row => dbRowToFlavorText(row));
}

export async function getPokemonGenderRate(pokemonId: number): Promise<number | null> {
  const db = await getDatabase();

  const result = await db.getFirstAsync<{ gender_rate: number }>(
    `SELECT gender_rate FROM pokemon WHERE id = ?`,
    [pokemonId]
  );

  return result?.gender_rate ?? null;
}

export async function getPokemonClassification(pokemonId: number): Promise<string | null> {
  const db = await getDatabase();

  const result = await db.getFirstAsync<{ species_classification: string | null }>(
    `SELECT species_classification FROM pokemon WHERE id = ?`,
    [pokemonId]
  );

  return result?.species_classification ?? null;
}

function dbRowToFlavorText(row: any): PokemonFlavorText {
  return {
    id: row.id,
    pokemonId: row.pokemon_id,
    gameVersion: row.game_version,
    flavorText: row.flavor_text,
  };
}

function dbRowToEvolution(row: any): PokemonEvolution {
  return {
    id: row.id,
    pokemonId: row.pokemon_id,
    evolvesToId: row.evolves_to_id,
    method: row.method,
    conditionValue: row.condition_value,
  };
}

export async function getEvolutionChain(pokemonId: number): Promise<EvolutionNode | null> {
  const db = await getDatabase();

  const getRootPokemon = async (id: number, depth: number = 0): Promise<number> => {
    if (depth > 4) return id;

    const predecessor = await db.getFirstAsync<{ pokemon_id: number }>(
      `SELECT pokemon_id FROM pokemon_evolutions
       WHERE evolves_to_id = ? AND pokemon_id IN (
         SELECT id FROM pokemon WHERE form_type = 'default'
       )
       LIMIT 1`,
      [id]
    );

    if (!predecessor) return id;
    return getRootPokemon(predecessor.pokemon_id, depth + 1);
  };

  const buildEvolutionTree = async (id: number, depth: number = 0): Promise<EvolutionNode | null> => {
    if (depth > 4) return null;

    const pokemon = await db.getFirstAsync<any>(
      `SELECT id, national_dex, display_name, primary_type, pokeapi_id FROM pokemon
       WHERE id = ? AND form_type = 'default'`,
      [id]
    );

    if (!pokemon) return null;

    const evolutions = await db.getAllAsync<any>(
      `SELECT pe.method, pe.condition_value, pe.evolves_to_id, p.id, p.national_dex, p.display_name, p.primary_type, p.pokeapi_id
       FROM pokemon_evolutions pe
       JOIN pokemon p ON p.id = pe.evolves_to_id AND p.form_type = 'default'
       WHERE pe.pokemon_id = ?`,
      [id]
    );

    const evolvesTo: EvolutionStep[] = [];

    for (const evo of evolutions) {
      const nextNode = await buildEvolutionTree(evo.evolves_to_id, depth + 1);
      if (nextNode) {
        evolvesTo.push({
          method: evo.method,
          conditionValue: evo.condition_value,
          pokemon: nextNode,
        });
      }
    }

    return {
      pokemonId: pokemon.id,
      nationalDex: pokemon.national_dex,
      displayName: pokemon.display_name,
      primaryType: pokemon.primary_type,
      pokeApiId: pokemon.pokeapi_id,
      evolvesTo,
    };
  };

  const rootId = await getRootPokemon(pokemonId);
  return buildEvolutionTree(rootId);
}
