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

  const pokemon = await db.getFirstAsync<{
    gender_rate: number;
    species_classification: string | null;
    form_type: string;
    name: string;
    national_dex: number;
  }>(
    `SELECT gender_rate, species_classification, form_type, name, national_dex FROM pokemon WHERE id = ?`,
    [pokemonId]
  );

  if (!pokemon) {
    return null;
  }

  const BATTLE_ONLY_NAMES = new Set(['mimikyubusted', 'eiscuenoice', 'morpekohangry']);
  const isBattleOnly =
    pokemon.form_type === 'mega' ||
    pokemon.form_type === 'gigantamax' ||
    BATTLE_ONLY_NAMES.has(pokemon.name);

  let queryId = pokemonId;
  if (isBattleOnly) {
    const defaultForm = await db.getFirstAsync<{ id: number }>(
      `SELECT id FROM pokemon WHERE national_dex = ? AND form_type = 'default' ORDER BY id LIMIT 1`,
      [pokemon.national_dex]
    );
    if (defaultForm) {
      queryId = defaultForm.id;
    }
  }

  const flavorTexts = await db.getAllAsync<any>(
    `SELECT id, pokemon_id, game_version, flavor_text FROM pokemon_flavor_text WHERE pokemon_id = ? ORDER BY game_version`,
    [queryId]
  );

  const evolutions = await db.getAllAsync<any>(
    `SELECT id, pokemon_id, evolves_to_id, method, condition_value FROM pokemon_evolutions WHERE pokemon_id = ?`,
    [queryId]
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
         SELECT id FROM pokemon WHERE form_type IN ('default', 'cosmetic', 'alternate', 'regional')
       )
       LIMIT 1`,
      [id]
    );

    if (!predecessor) return id;
    return getRootPokemon(predecessor.pokemon_id, depth + 1);
  };

  const visited = new Set<number>();

  const buildEvolutionTree = async (id: number, depth: number = 0, maxDepth: number = 4): Promise<EvolutionNode | null> => {
    if (depth > maxDepth) return null;
    if (visited.has(id)) return null;
    visited.add(id);

    const pokemon = await db.getFirstAsync<any>(
      `SELECT id, national_dex, display_name, primary_type, pokeapi_id FROM pokemon
       WHERE id = ?`,
      [id]
    );

    if (!pokemon) return null;

    const evolutions = await db.getAllAsync<any>(
      `SELECT pe.method, pe.condition_value, pe.evolves_to_id, p.id, p.national_dex, p.display_name, p.primary_type, p.pokeapi_id
       FROM pokemon_evolutions pe
       JOIN pokemon p ON p.id = pe.evolves_to_id
       WHERE pe.pokemon_id = ?`,
      [id]
    );

    const evolvesTo: EvolutionStep[] = [];

    for (const evo of evolutions) {
      if (visited.has(evo.evolves_to_id)) continue;
      const nextNode = await buildEvolutionTree(evo.evolves_to_id, depth + 1, maxDepth);
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

  // Get form_type of the current Pokémon
  const pokemon = await db.getFirstAsync<{ form_type: string }>(
    `SELECT form_type FROM pokemon WHERE id = ?`,
    [pokemonId]
  );

  let rootId = pokemonId;
  let cyclicWeb = false;

  if (pokemon) {
    const formType = pokemon.form_type;

    if (formType === 'mega' || formType === 'gigantamax') {
      const predecessor = await db.getFirstAsync<{ pokemon_id: number }>(
        `SELECT pokemon_id FROM pokemon_evolutions
         WHERE evolves_to_id = ? AND pokemon_id IN (
           SELECT id FROM pokemon WHERE form_type IN ('default', 'cosmetic', 'alternate', 'regional')
         )
         LIMIT 1`,
        [pokemonId]
      );
      rootId = predecessor ? predecessor.pokemon_id : pokemonId;
    } else if (formType === 'alternate') {
      const incomingEvolution = await db.getFirstAsync<{ pokemon_id: number }>(
        `SELECT pokemon_id FROM pokemon_evolutions
         WHERE evolves_to_id = ? LIMIT 1`,
        [pokemonId]
      );
      if (incomingEvolution) {
        const backEdge = await db.getFirstAsync<{ id: number }>(
          `SELECT id FROM pokemon_evolutions
           WHERE pokemon_id = ? AND evolves_to_id = ? LIMIT 1`,
          [pokemonId, incomingEvolution.pokemon_id]
        );
        if (backEdge) {
          // Cyclic web (Oricorio, Deoxys) — root at current form, children are leaves only
          rootId = pokemonId;
          cyclicWeb = true;
        } else {
          // Linear alternate (Aegislash Blade, Terapagos Stellar) — walk to true root
          rootId = await getRootPokemon(pokemonId);
        }
      } else {
        rootId = await getRootPokemon(pokemonId);
      }
    } else {
      // For default/cosmetic/regional, check if any outgoing evolution points back to us (cyclic web)
      const outgoingCycleCheck = await db.getFirstAsync<{ id: number }>(
        `SELECT pe1.id FROM pokemon_evolutions pe1
         JOIN pokemon_evolutions pe2 ON pe2.pokemon_id = pe1.evolves_to_id AND pe2.evolves_to_id = ?
         WHERE pe1.pokemon_id = ? LIMIT 1`,
        [pokemonId, pokemonId]
      );
      if (outgoingCycleCheck) {
        rootId = pokemonId;
        cyclicWeb = true;
      } else {
        rootId = await getRootPokemon(pokemonId);
      }
    }
  }

  return buildEvolutionTree(rootId, 0, cyclicWeb ? 1 : 4);
}
