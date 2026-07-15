import { getDatabase } from './initializeDatabase';
import { Move, MoveCategory, PokemonType } from '@/types';

export async function getAllMoves(): Promise<Move[]> {
  const db = await getDatabase();

  const results = await db.getAllAsync<any>(
    `SELECT * FROM moves ORDER BY id ASC`
  );

  return results.map(dbRowToMove);
}

export async function getMoveById(id: number): Promise<Move | null> {
  const db = await getDatabase();

  const result = await db.getFirstAsync<any>(
    `SELECT * FROM moves WHERE id = ?`,
    [id]
  );

  return result ? dbRowToMove(result) : null;
}

export async function getMoveByName(name: string): Promise<Move | null> {
  const db = await getDatabase();

  const result = await db.getFirstAsync<any>(
    `SELECT * FROM moves WHERE name = ? OR display_name = ?`,
    [name, name]
  );

  return result ? dbRowToMove(result) : null;
}

export async function searchMoves(query: string): Promise<Move[]> {
  const db = await getDatabase();

  const searchPattern = `%${query.toLowerCase()}%`;

  const results = await db.getAllAsync<any>(
    `SELECT * FROM moves
     WHERE LOWER(name) LIKE ? OR LOWER(display_name) LIKE ?
     ORDER BY id ASC`,
    [searchPattern, searchPattern]
  );

  return results.map(dbRowToMove);
}

export async function getMovesByType(type: PokemonType): Promise<Move[]> {
  const db = await getDatabase();

  const results = await db.getAllAsync<any>(
    `SELECT * FROM moves WHERE type = ? ORDER BY id ASC`,
    [type]
  );

  return results.map(dbRowToMove);
}

export async function getMovesByCategory(category: MoveCategory): Promise<Move[]> {
  const db = await getDatabase();

  const results = await db.getAllAsync<any>(
    `SELECT * FROM moves WHERE category = ? ORDER BY id ASC`,
    [category]
  );

  return results.map(dbRowToMove);
}

export async function getMovesByGeneration(generation: number): Promise<Move[]> {
  const db = await getDatabase();

  const results = await db.getAllAsync<any>(
    `SELECT * FROM moves WHERE generation <= ? ORDER BY id ASC`,
    [generation]
  );

  return results.map(dbRowToMove);
}

function dbRowToMove(row: any): Move {
  return {
    id: row.id,
    name: row.name,
    displayName: row.display_name,
    type: row.type as PokemonType,
    category: row.category as MoveCategory,
    power: row.power,
    accuracy: row.accuracy,
    pp: row.pp,
    priority: row.priority,
    description: row.description,
    shortDescription: row.short_description,
    generation: row.generation,
    makesContact: row.makes_contact === 1,
  };
}
