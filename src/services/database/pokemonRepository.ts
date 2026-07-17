import { getDatabase } from './initializeDatabase';
import { Pokemon, PokemonListItem, PokemonType } from '@/types';

export async function getAllPokemon(): Promise<Pokemon[]> {
  const db = await getDatabase();

  const results = await db.getAllAsync<any>(
    `SELECT * FROM pokemon ORDER BY national_dex ASC`
  );

  return results.map(dbRowToPokemon);
}

export interface PaginationOptions {
  limit: number;
  offset: number;
  search?: string;
  types?: PokemonType[];
  generation?: number;
  sortBy?: 'dex' | 'name' | 'total' | 'hp' | 'attack' | 'defense' | 'specialAttack' | 'specialDefense' | 'speed';
  sortDirection?: 'asc' | 'desc';
  typeFilterMode?: 'or' | 'and';
}

export async function getPokemonPage(options: PaginationOptions): Promise<PokemonListItem[]> {
  const db = await getDatabase();
  const {
    limit,
    offset,
    search,
    types,
    generation,
    sortBy = 'dex',
    sortDirection = 'asc',
    typeFilterMode = 'or',
  } = options;

  // Build WHERE clause based on filters
  const whereClauses: string[] = [];
  const params: any[] = [];

  if (generation !== undefined) {
    whereClauses.push('generation = ?');
    params.push(generation);
  }

  if (types && types.length > 0) {
    const normalizedTypes = types.map(t => t.toLowerCase());
    if (typeFilterMode === 'and' && normalizedTypes.length === 2) {
      whereClauses.push('(LOWER(primary_type) = ? AND LOWER(secondary_type) = ?) OR (LOWER(primary_type) = ? AND LOWER(secondary_type) = ?)');
      params.push(normalizedTypes[0], normalizedTypes[1], normalizedTypes[1], normalizedTypes[0]);
    } else {
      const typePlaceholders = normalizedTypes.map(() => '?').join(',');
      whereClauses.push(`(LOWER(primary_type) IN (${typePlaceholders}) OR LOWER(secondary_type) IN (${typePlaceholders}))`);
      params.push(...normalizedTypes, ...normalizedTypes);
    }
  }

  if (search && search.trim()) {
    const searchPattern = `%${search.toLowerCase()}%`;
    whereClauses.push('(LOWER(name) LIKE ? OR LOWER(display_name) LIKE ?)');
    params.push(searchPattern, searchPattern);
  }

  const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // Build ORDER BY clause
  let orderByClause = 'ORDER BY national_dex ASC';
  if (sortBy === 'name') {
    orderByClause = 'ORDER BY display_name ASC';
  } else if (sortBy === 'total') {
    orderByClause = `ORDER BY (hp + attack + defense + special_attack + special_defense + speed) ${sortDirection === 'desc' ? 'DESC' : 'ASC'}`;
  } else if (['hp', 'attack', 'defense', 'specialAttack', 'specialDefense', 'speed'].includes(sortBy)) {
    const columnMap: Record<string, string> = {
      hp: 'hp',
      attack: 'attack',
      defense: 'defense',
      specialAttack: 'special_attack',
      specialDefense: 'special_defense',
      speed: 'speed',
    };
    orderByClause = `ORDER BY ${columnMap[sortBy]} ${sortDirection === 'desc' ? 'DESC' : 'ASC'}`;
  } else if (sortDirection === 'desc') {
    orderByClause = 'ORDER BY national_dex DESC';
  }

  params.push(limit, offset);

  const results = await db.getAllAsync<any>(
    `SELECT id, national_dex, pokeapi_id, name, display_name, form_type, form_name, primary_type, secondary_type, sprite_url, generation, hp, attack, defense, special_attack, special_defense, speed
     FROM pokemon
     ${whereClause}
     ${orderByClause}
     LIMIT ? OFFSET ?`,
    params
  );

  return results.map(dbRowToPokemonListItem);
}

export async function getPokemonById(id: number): Promise<Pokemon | null> {
  const db = await getDatabase();

  const result = await db.getFirstAsync<any>(
    `SELECT * FROM pokemon WHERE id = ?`,
    [id]
  );

  return result ? dbRowToPokemon(result) : null;
}

export async function getPokemonByNationalDex(nationalDex: number): Promise<Pokemon | null> {
  const db = await getDatabase();

  const result = await db.getFirstAsync<any>(
    `SELECT * FROM pokemon WHERE national_dex = ? AND form_type = 'default' ORDER BY id LIMIT 1`,
    [nationalDex]
  );

  return result ? dbRowToPokemon(result) : null;
}

export async function searchPokemon(query: string): Promise<PokemonListItem[]> {
  const db = await getDatabase();

  const searchPattern = `%${query.toLowerCase()}%`;

  const results = await db.getAllAsync<any>(
    `SELECT id, national_dex, pokeapi_id, name, display_name, form_type, form_name, primary_type, secondary_type, sprite_url, generation, hp, attack, defense, special_attack, special_defense, speed
     FROM pokemon
     WHERE LOWER(name) LIKE ? OR LOWER(display_name) LIKE ?
     ORDER BY national_dex ASC`,
    [searchPattern, searchPattern]
  );

  return results.map(dbRowToPokemonListItem);
}

export async function getPokemonByType(type: PokemonType): Promise<PokemonListItem[]> {
  const db = await getDatabase();

  const results = await db.getAllAsync<any>(
    `SELECT id, national_dex, pokeapi_id, name, display_name, form_type, form_name, primary_type, secondary_type, sprite_url, generation, hp, attack, defense, special_attack, special_defense, speed
     FROM pokemon
     WHERE primary_type = ? OR secondary_type = ?
     ORDER BY national_dex ASC`,
    [type, type]
  );

  return results.map(dbRowToPokemonListItem);
}

export async function getPokemonByGeneration(generation: number): Promise<PokemonListItem[]> {
  const db = await getDatabase();

  const results = await db.getAllAsync<any>(
    `SELECT id, national_dex, pokeapi_id, name, display_name, form_type, form_name, primary_type, secondary_type, sprite_url, generation, hp, attack, defense, special_attack, special_defense, speed
     FROM pokemon
     WHERE generation = ?
     ORDER BY national_dex ASC`,
    [generation]
  );

  return results.map(dbRowToPokemonListItem);
}

export async function getPokemonAbilities(pokemonId: number): Promise<number[]> {
  const db = await getDatabase();

  const results = await db.getAllAsync<{ ability_id: number }>(
    `SELECT ability_id FROM pokemon_abilities WHERE pokemon_id = ? ORDER BY slot ASC`,
    [pokemonId]
  );

  return results.map(r => r.ability_id);
}

export async function getPokemonMoves(pokemonId: number): Promise<number[]> {
  const db = await getDatabase();

  const results = await db.getAllAsync<{ move_id: number }>(
    `SELECT DISTINCT move_id FROM pokemon_moves WHERE pokemon_id = ?`,
    [pokemonId]
  );

  return results.map(r => r.move_id);
}

export async function getPokemonAbilitiesWithHidden(pokemonId: number): Promise<Array<{ id: number; name: string; displayName: string; isHidden: boolean }>> {
  const db = await getDatabase();
  const results = await db.getAllAsync<any>(
    `SELECT a.id, a.name, a.display_name, pa.is_hidden
     FROM abilities a
     INNER JOIN pokemon_abilities pa ON a.id = pa.ability_id
     WHERE pa.pokemon_id = ?
     ORDER BY pa.slot ASC`,
    [pokemonId]
  );
  return results.map(r => ({
    id: r.id,
    name: r.name,
    displayName: r.display_name,
    isHidden: r.is_hidden === 1,
  }));
}

export async function getPokemonMoveset(pokemonId: number): Promise<Array<{
  id: number;
  name: string;
  displayName: string;
  type: string;
  category: string;
  power: number | null;
  accuracy: number | null;
  pp: number;
  learnMethod: string;
  learnLevel: number | null;
  versionGroup: string;
}>> {
  const db = await getDatabase();
  const results = await db.getAllAsync<any>(
    `SELECT
       m.id, m.name, m.display_name, m.type, m.category, m.power, m.accuracy, m.pp,
       pm.learn_method, pm.learn_level, pm.version_group
     FROM pokemon_moves pm
     JOIN moves m ON pm.move_id = m.id
     WHERE pm.pokemon_id = ?
     ORDER BY pm.learn_method, pm.learn_level ASC NULLS LAST, m.display_name ASC`,
    [pokemonId]
  );
  return results.map(r => ({
    id: r.id,
    name: r.name,
    displayName: r.display_name,
    type: r.type,
    category: r.category,
    power: r.power,
    accuracy: r.accuracy,
    pp: r.pp,
    learnMethod: r.learn_method,
    learnLevel: r.learn_level,
    versionGroup: r.version_group,
  }));
}

export async function getPokemonMovesetVersions(pokemonId: number): Promise<string[]> {
  const db = await getDatabase();
  const results = await db.getAllAsync<{ version_group: string }>(
    `SELECT DISTINCT version_group FROM pokemon_moves WHERE pokemon_id = ? AND version_group != '' ORDER BY version_group ASC`,
    [pokemonId]
  );
  return results.map(r => r.version_group);
}

export async function getPokemonWithAbility(abilityId: number): Promise<Array<{
  id: number;
  name: string;
  displayName: string;
  nationalDex: number;
  pokeApiId: number;
  primaryType: PokemonType;
  secondaryType: PokemonType | null;
  generation: number;
  isHidden: boolean;
}>> {
  const db = await getDatabase();
  const results = await db.getAllAsync<any>(
    `SELECT
      p.id, p.name, p.display_name, p.national_dex, p.pokeapi_id,
      p.primary_type, p.secondary_type, p.generation, pa.is_hidden
     FROM pokemon_abilities pa
     JOIN pokemon p ON pa.pokemon_id = p.id
     WHERE pa.ability_id = ?
     ORDER BY p.national_dex ASC`,
    [abilityId]
  );

  return results.map(r => ({
    id: r.id,
    name: r.name,
    displayName: r.display_name,
    nationalDex: r.national_dex,
    pokeApiId: r.pokeapi_id ?? r.national_dex,
    primaryType: r.primary_type as PokemonType,
    secondaryType: r.secondary_type as PokemonType | null,
    generation: r.generation,
    isHidden: r.is_hidden === 1,
  }));
}

function dbRowToPokemon(row: any): Pokemon {
  return {
    id: row.id,
    nationalDex: row.national_dex,
    pokeApiId: row.pokeapi_id ?? row.national_dex,
    name: row.name,
    displayName: row.display_name,
    formType: row.form_type,
    formName: row.form_name,
    primaryType: row.primary_type as PokemonType,
    secondaryType: row.secondary_type as PokemonType | null,
    baseStats: {
      hp: row.hp,
      attack: row.attack,
      defense: row.defense,
      specialAttack: row.special_attack,
      specialDefense: row.special_defense,
      speed: row.speed,
    },
    height: row.height,
    weight: row.weight,
    generation: row.generation,
    isLegendary: row.is_legendary === 1,
    isMythical: row.is_mythical === 1,
    spriteUrl: row.sprite_url,
    artworkUrl: row.artwork_url,
    shinyUrl: row.shiny_url,
    shinySpriteUrl: row.shiny_sprite_url,
    cosmeticVariants: row.cosmetic_variants ? JSON.parse(row.cosmetic_variants) : [],
    abilityIds: [], // Will be populated separately if needed
    hiddenAbilityId: null, // Will be populated separately if needed
    gameExclusivity: row.game_exclusivity ?? null,
  };
}

function dbRowToPokemonListItem(row: any): PokemonListItem {
  return {
    id: row.id,
    nationalDex: row.national_dex,
    pokeApiId: row.pokeapi_id ?? row.national_dex,
    name: row.name,
    displayName: row.display_name,
    formType: row.form_type,
    formName: row.form_name,
    primaryType: row.primary_type as PokemonType,
    secondaryType: row.secondary_type as PokemonType | null,
    spriteUrl: row.sprite_url,
    generation: row.generation,
    gameExclusivity: row.game_exclusivity ?? null,
    baseStats: {
      hp: row.hp,
      attack: row.attack,
      defense: row.defense,
      specialAttack: row.special_attack,
      specialDefense: row.special_defense,
      speed: row.speed,
    },
  };
}
