import { getDatabase } from './initializeDatabase';
import { Ability } from '@/types';

export async function getAllAbilities(): Promise<Ability[]> {
  const db = await getDatabase();

  const results = await db.getAllAsync<any>(
    `SELECT * FROM abilities ORDER BY id ASC`
  );

  return results.map(dbRowToAbility);
}

export async function getAbilityById(id: number): Promise<Ability | null> {
  const db = await getDatabase();

  const result = await db.getFirstAsync<any>(
    `SELECT * FROM abilities WHERE id = ?`,
    [id]
  );

  return result ? dbRowToAbility(result) : null;
}

export async function getAbilityByName(name: string): Promise<Ability | null> {
  const db = await getDatabase();

  const result = await db.getFirstAsync<any>(
    `SELECT * FROM abilities WHERE name = ? OR display_name = ?`,
    [name, name]
  );

  return result ? dbRowToAbility(result) : null;
}

export async function searchAbilities(query: string): Promise<Ability[]> {
  const db = await getDatabase();

  const searchPattern = `%${query.toLowerCase()}%`;

  const results = await db.getAllAsync<any>(
    `SELECT * FROM abilities
     WHERE LOWER(name) LIKE ? OR LOWER(display_name) LIKE ?
     ORDER BY id ASC`,
    [searchPattern, searchPattern]
  );

  return results.map(dbRowToAbility);
}

export async function getAbilitiesByGeneration(generation: number): Promise<Ability[]> {
  const db = await getDatabase();

  const results = await db.getAllAsync<any>(
    `SELECT * FROM abilities WHERE generation <= ? ORDER BY id ASC`,
    [generation]
  );

  return results.map(dbRowToAbility);
}

export async function getPokemonAbilities(pokemonId: number): Promise<Ability[]> {
  const db = await getDatabase();

  const results = await db.getAllAsync<any>(
    `SELECT a.* FROM abilities a
     INNER JOIN pokemon_abilities pa ON a.id = pa.ability_id
     WHERE pa.pokemon_id = ?
     ORDER BY pa.slot ASC`,
    [pokemonId]
  );

  return results.map(dbRowToAbility);
}

function dbRowToAbility(row: any): Ability {
  return {
    id: row.id,
    name: row.name,
    displayName: row.display_name,
    description: row.description,
    shortDescription: row.short_description,
    generation: row.generation,
    isHidden: false, // This would need to be tracked separately if needed
  };
}
