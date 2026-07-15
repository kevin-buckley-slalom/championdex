import { getDatabase } from './initializeDatabase';
import { Item, ItemCategory } from '@/types';

export async function getAllItems(): Promise<Item[]> {
  const db = await getDatabase();

  const results = await db.getAllAsync<any>(
    `SELECT * FROM items ORDER BY id ASC`
  );

  return results.map(dbRowToItem);
}

export async function getItemById(id: number): Promise<Item | null> {
  const db = await getDatabase();

  const result = await db.getFirstAsync<any>(
    `SELECT * FROM items WHERE id = ?`,
    [id]
  );

  return result ? dbRowToItem(result) : null;
}

export async function getItemByName(name: string): Promise<Item | null> {
  const db = await getDatabase();

  const result = await db.getFirstAsync<any>(
    `SELECT * FROM items WHERE name = ? OR display_name = ?`,
    [name, name]
  );

  return result ? dbRowToItem(result) : null;
}

export async function searchItems(query: string): Promise<Item[]> {
  const db = await getDatabase();

  const searchPattern = `%${query.toLowerCase()}%`;

  const results = await db.getAllAsync<any>(
    `SELECT * FROM items
     WHERE LOWER(name) LIKE ? OR LOWER(display_name) LIKE ?
     ORDER BY id ASC`,
    [searchPattern, searchPattern]
  );

  return results.map(dbRowToItem);
}

export async function getItemsByCategory(category: ItemCategory): Promise<Item[]> {
  const db = await getDatabase();

  const results = await db.getAllAsync<any>(
    `SELECT * FROM items WHERE category = ? ORDER BY id ASC`,
    [category]
  );

  return results.map(dbRowToItem);
}

export async function getHeldItems(): Promise<Item[]> {
  const db = await getDatabase();

  const results = await db.getAllAsync<any>(
    `SELECT * FROM items WHERE category = 'held' ORDER BY id ASC`
  );

  return results.map(dbRowToItem);
}

function dbRowToItem(row: any): Item {
  return {
    id: row.id,
    name: row.name,
    displayName: row.display_name,
    category: row.category as ItemCategory,
    description: row.description,
    shortDescription: row.short_description,
    spriteUrl: row.sprite_url,
    cost: row.cost,
  };
}
