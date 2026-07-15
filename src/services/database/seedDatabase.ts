import * as SQLite from 'expo-sqlite';
import { FormType, Pokemon, Move, Ability, Item } from '@/types';
import { withSemaphore } from './enrichmentSemaphore';

// Tracks @pkmn/dex base data (stats, abilities, moves, items). Bump when bundled data changes.
const DATA_VERSION = '1.10.0';
// Tracks PokeAPI enrichment (flavor text, evolution chains). Independent of DATA_VERSION.
// Only bump this if PokeAPI data itself needs to be re-fetched (e.g. a known bad fetch pass).
// Under normal circumstances this should almost never change — the data is permanent.
const ENRICH_VERSION = '1.2.0';

export async function seedDatabase(db: SQLite.SQLiteDatabase): Promise<void> {
  // Load dex first, so we can check versions and conditionally run phases
  const dexModule = require('@pkmn/dex');
  const dex = dexModule.Dex;

  // Check if Phase 1 (base data) is already seeded
  try {
    const result = await db.getFirstAsync<{ value: string }>(
      'SELECT value FROM sync_metadata WHERE key = ?',
      ['data_version']
    );

    if (result?.value === DATA_VERSION) {
      console.log('[Database] Data already seeded');
      // Still kick off enrichment in background if needed
      startPokeApiEnrichment(db, dex);
      return;
    }
  } catch (error) {
    // Table might not exist yet, continue with seeding
  }

  console.log('[Database] Starting data seeding (Phase 1: base data)...');

  try {
    // Clear stale prefetch completion flags when DATA_VERSION changes.
    // This is done BEFORE the transaction to avoid lock conflicts.
    // These flags don't need to be atomic with pokemon data operations.
    // (e.g., if pokeapi_id calculation or form detection was fixed)
    try {
      await db.runAsync(`DELETE FROM sync_metadata WHERE key = ?`, ['alt_form_prefetch_completed']);
      await db.runAsync(`DELETE FROM sync_metadata WHERE key = ?`, ['artwork_prefetch_completed']);
      await db.runAsync(`DELETE FROM sync_metadata WHERE key = ?`, ['artwork_prefetch_progress']);
      // NOTE: pokeapi_enrich_version is intentionally NOT cleared here.
      // PokeAPI flavor text and evolution data are independent of @pkmn/dex version bumps.
      // Enrichment only re-runs if its own version key is missing or mismatched.
    } catch (error) {
      // Flags may not exist on first run, silently continue
      console.debug('[Database] Could not clear prefetch flags (may not exist yet):', error);
    }

    // Phase 1: Prefetch PokeAPI IDs (uses DB cache, so it's fast after first run)
    const pokeApiIdCache = await prefetchPokeApiIds(db, dex);

    // Phase 1: Seed base data (abilities, items, moves, pokemon base stats)
    await db.withTransactionAsync(async () => {
      // Upsert all data using INSERT OR REPLACE / INSERT OR IGNORE semantics.
      // Never DELETE — this approach preserves stale data which is acceptable in practice.
      // All tables use upsert to ensure new versions overwrite old data while preserving
      // anything that wasn't touched by this version bump.

      await seedAbilities(db, dex);
      await seedItems(db, dex);
      await seedMoves(db, dex);
      // Phase 1: Only seed pokemon base data (no flavor text or evolutions)
      await seedPokemonBaseData(db, dex, pokeApiIdCache);

      // Update sync metadata: Phase 1 complete
      await db.runAsync(
        `INSERT OR REPLACE INTO sync_metadata (key, value, updated_at)
         VALUES (?, ?, datetime('now'))`,
        ['data_version', DATA_VERSION]
      );
    });

    console.log('[Database] Phase 1 (base data seeding) completed successfully');

    // Phase 2: Start PokeAPI enrichment in background (fire-and-forget)
    startPokeApiEnrichment(db, dex);
  } catch (error) {
    console.error('[Database] Error during seeding:', error);
    throw error;
  }
}

/**
 * Fire-and-forget wrapper for PokeAPI enrichment (Phase 2).
 * Starts all three enrichment streams concurrently without blocking the caller.
 * Uses a shared semaphore to limit concurrent PokeAPI requests to 10.
 */
function startPokeApiEnrichment(db: SQLite.SQLiteDatabase, dex: any): void {
  console.log('[Database] Starting enrichment streams concurrently...');
  enrichDatabaseAsync(db, dex).catch(err => {
    console.warn('[Database] PokeAPI enrichment stream failed:', err);
  });
  runClassificationBackfill(db, dex).catch(err => {
    console.warn('[Database] Classification backfill stream failed:', err);
  });
  runMovesBackfill(db, dex).catch(err => {
    console.warn('[Database] Moves backfill stream failed:', err);
  });
  runEncountersBackfill(db).catch(err => {
    console.warn('[Database] Encounters backfill stream failed:', err);
  });
  runZAFormsEnrichmentBackfill(db).catch(err => {
    console.warn('[Database] Z-A forms enrichment stream failed:', err);
  });
}

/**
 * Fetch pokemon movesets from PokeAPI and build a cache map.
 * Returns a map of pokemon DB ID -> array of move data.
 * All network fetches happen before returning — never fetch inside a transaction.
 */
async function prefetchPokemonMoveset(
  db: SQLite.SQLiteDatabase,
  dex: any,
  pokeApiIdCache: Map<string, number>
): Promise<Map<number, Array<{ moveId: number; learnMethod: string; learnLevel: number | null }>>> {
  console.log('[Database] Fetching pokemon movesets from PokeAPI...');

  const movesetCache = new Map<number, Array<{ moveId: number; learnMethod: string; learnLevel: number | null }>>();

  const speciesData = dex.species.all();
  const processedSpecies = new Set<string>();
  const defaultFormSpecies = [];

  for (const species of speciesData) {
    const excluded = (species.isNonstandard === 'CAP' || species.isNonstandard === 'Future' || species.isNonstandard === 'Custom')
      && !FUTURE_FORM_ALLOWLIST.has(species.name);
    if (!species.exists || excluded || processedSpecies.has(species.name)) {
      continue;
    }
    processedSpecies.add(species.name);

    if (species.num > 0 && !species.forme) {
      defaultFormSpecies.push(species);
    }
  }

  const total = defaultFormSpecies.length;
  let networkFetches = 0;
  let cacheHits = 0;

  // Build a map of species name -> DB ID for quick lookup
  const nameToIdMap = new Map<string, number>();
  try {
    const existingRows = await db.getAllAsync<{ name: string; id: number }>(
      'SELECT name, id FROM pokemon'
    );
    for (const row of existingRows) {
      nameToIdMap.set(row.name, row.id);
    }
  } catch (error) {
    console.warn('[Database] Could not load pokemon ID map for moveset prefetch:', error);
    // Bug 2 fix: Return early with empty map if pokemon table load fails
    console.log('[Database] Prefetched 0 pokemon movesets (pokemon table unavailable)');
    return movesetCache;
  }

  const BATCH_SIZE = 10;
  for (let i = 0; i < defaultFormSpecies.length; i += BATCH_SIZE) {
    const batch = defaultFormSpecies.slice(i, i + BATCH_SIZE);
    let batchHadNetworkFetch = false;

    await Promise.all(batch.map(async (species) => {
      // Get the DB ID for this pokemon
      const pokemonDbId = nameToIdMap.get(species.id);
      if (!pokemonDbId) {
        console.warn(`[Database] Could not find DB ID for pokemon ${species.id}`);
        return;
      }

      // Check if movesets already exist in the database for this pokemon
      try {
        const existingMovesets = await db.getFirstAsync<{ count: number }>(
          `SELECT COUNT(*) as count FROM pokemon_moves WHERE pokemon_id = ?`,
          [pokemonDbId]
        );

        if (existingMovesets && existingMovesets.count > 0) {
          // Load existing movesets from DB into the cache
          const movesetRows = await db.getAllAsync<{ move_id: number; learn_method: string; learn_level: number | null }>(
            `SELECT move_id, learn_method, learn_level FROM pokemon_moves WHERE pokemon_id = ?`,
            [pokemonDbId]
          );

          if (movesetRows && movesetRows.length > 0) {
            movesetCache.set(pokemonDbId, movesetRows.map(r => ({
              moveId: r.move_id,
              learnMethod: r.learn_method,
              learnLevel: r.learn_level
            })));
            cacheHits++;
            return;
          }
        }
      } catch (error) {
        // Table may not exist yet on first run, continue with network fetch
      }

      // Fetch from PokeAPI using pokeapi_id
      let pokeApiId = species.num;
      try {
        const pokemonRow = await db.getFirstAsync<{ pokeapi_id: number }>(
          `SELECT pokeapi_id FROM pokemon WHERE id = ?`,
          [pokemonDbId]
        );
        if (pokemonRow && pokemonRow.pokeapi_id > 0) {
          pokeApiId = pokemonRow.pokeapi_id;
        }
      } catch (error) {
        // Fall back to national dex
      }

      try {
        const response = await withSemaphore(() => fetch(`https://pokeapi.co/api/v2/pokemon/${pokeApiId}/`));
        if (!response.ok) {
          console.warn(`[Database] Failed to fetch pokemon ${species.id} (PokeAPI ID ${pokeApiId}): ${response.status}`);
          return;
        }

        const data = await response.json();

        const moveset = [];
        const seenMoves = new Set<string>();

        if (data.moves && Array.isArray(data.moves)) {
          for (const moveEntry of data.moves) {
            if (!moveEntry.move?.url) continue;

            // Extract move ID from URL (e.g., /move/84/ → 84)
            const moveIdMatch = moveEntry.move.url.match(/\/move\/(\d+)\//);
            if (!moveIdMatch) continue;

            const moveId = parseInt(moveIdMatch[1], 10);

            if (!moveEntry.version_group_details || moveEntry.version_group_details.length === 0) {
              continue;
            }

            // Process first version group detail to get learn method and level
            const detail = moveEntry.version_group_details[0];
            const learnMethod = detail.move_learn_method?.name ?? 'other';

            // Skip duplicates: only one row per (pokemon_id, move_id, learn_method)
            const key = `${moveId}:${learnMethod}`;
            if (seenMoves.has(key)) {
              continue;
            }
            seenMoves.add(key);

            const learnLevel = (learnMethod === 'level-up' && detail.level_learned_at > 0)
              ? detail.level_learned_at
              : null;

            moveset.push({
              moveId,
              learnMethod,
              learnLevel
            });
          }
        }

        if (moveset.length > 0) {
          movesetCache.set(pokemonDbId, moveset);
        }

        networkFetches++;
        batchHadNetworkFetch = true;
      } catch (error) {
        console.warn(`[Database] Error fetching moveset for ${species.id}:`, error);
      }
    }));

    // Rate limit: only sleep if this batch made at least one network request
    if (batchHadNetworkFetch) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Progress log every 10 batches
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(defaultFormSpecies.length / BATCH_SIZE);
    if (batchNum % 10 === 0 || batchNum === totalBatches) {
      console.log(`[Database] prefetchPokemonMoveset batch ${batchNum}/${totalBatches} (${cacheHits} cached, ${networkFetches} fetched)`);
    }
  }

  console.log(`[Database] Prefetched ${movesetCache.size} pokemon movesets (${cacheHits} from DB, ${networkFetches} from network)`);
  return movesetCache;
}

/**
 * Phase 2: PokeAPI enrichment (async, not awaited by caller).
 * Fetches flavor text and evolution chains from PokeAPI.
 * Runs in the background and can be interrupted safely.
 */
async function enrichDatabaseAsync(db: SQLite.SQLiteDatabase, dex: any): Promise<void> {
  try {
    // Check if enrichment is already complete
    const enrichResult = await db.getFirstAsync<{ value: string }>(
      'SELECT value FROM sync_metadata WHERE key = ?',
      ['pokeapi_enrich_version']
    );

    if (enrichResult?.value === ENRICH_VERSION) {
      console.log('[Database] PokeAPI enrichment already complete');
      return;
    }

    console.log('[Database] Starting Phase 2 (PokeAPI enrichment)...');

    // Build pokeapi_id cache for lookups
    const pokeApiIdCache = await prefetchPokeApiIds(db, dex);

    // Fetch all species data (flavor text + evolution chains + classifications) with DB caching
    const speciesDataCache = await prefetchPokeApiSpeciesData(db, dex);

    // Fetch all pokemon movesets with DB caching (before transaction)
    const movesetCache = await prefetchPokemonMoveset(db, dex, pokeApiIdCache);

    // Prepare all statements OUTSIDE the transaction (Bug 1 fix)
    const stmts = await prepareEnrichmentStatements(db);

    try {
      // Open a separate transaction for writing enrichment data
      await db.withTransactionAsync(async () => {
        await writePokeApiEnrichment(db, dex, speciesDataCache, movesetCache, stmts);

        // Update sync metadata: enrichment complete
        await db.runAsync(
          `INSERT OR REPLACE INTO sync_metadata (key, value, updated_at)
           VALUES (?, ?, datetime('now'))`,
          ['pokeapi_enrich_version', ENRICH_VERSION]
        );
      });
    } finally {
      // Finalize all statements OUTSIDE the transaction
      await finalizeEnrichmentStatements(stmts);
    }

    console.log('[Database] PokeAPI enrichment complete');
  } catch (error) {
    console.error('[Database] Error during PokeAPI enrichment:', error);
    throw error;
  }
}

/**
 * Prepare enrichment statements outside the transaction (Bug 1 fix).
 * Must be called before opening the transaction.
 */
async function prepareEnrichmentStatements(db: SQLite.SQLiteDatabase): Promise<{
  flavorTextStmt: SQLite.SQLiteStatement;
  evolutionStmt: SQLite.SQLiteStatement;
  movesetStmt: SQLite.SQLiteStatement;
}> {
  const flavorTextStmt = await db.prepareAsync(
    `INSERT OR IGNORE INTO pokemon_flavor_text (pokemon_id, game_version, flavor_text)
     VALUES (?, ?, ?)`
  );

  const evolutionStmt = await db.prepareAsync(
    `INSERT OR IGNORE INTO pokemon_evolutions (pokemon_id, evolves_to_id, method, condition_value)
     VALUES (?, ?, ?, ?)`
  );

  const movesetStmt = await db.prepareAsync(
    `INSERT OR IGNORE INTO pokemon_moves (pokemon_id, move_id, learn_method, learn_level)
     VALUES (?, ?, ?, ?)`
  );

  return { flavorTextStmt, evolutionStmt, movesetStmt };
}

/**
 * Finalize enrichment statements outside the transaction (Bug 1 fix).
 * Must be called after the transaction completes.
 */
async function finalizeEnrichmentStatements(stmts: {
  flavorTextStmt: SQLite.SQLiteStatement;
  evolutionStmt: SQLite.SQLiteStatement;
  movesetStmt: SQLite.SQLiteStatement;
}): Promise<void> {
  await stmts.flavorTextStmt.finalizeAsync();
  await stmts.evolutionStmt.finalizeAsync();
  await stmts.movesetStmt.finalizeAsync();
}

/**
 * Write flavor text and evolution data to the database.
 * This is called during Phase 2 enrichment in a separate transaction.
 * Statements must be pre-prepared (Bug 1 fix).
 */
async function writePokeApiEnrichment(
  db: SQLite.SQLiteDatabase,
  dex: any,
  speciesDataCache: { flavorTexts: Map<number, Array<{ gameVersion: string; flavorText: string }>>; evolutions: Map<number, Array<{ evolvesToNum: number; method: string; conditionValue: string | null }>> },
  movesetCache?: Map<number, Array<{ moveId: number; learnMethod: string; learnLevel: number | null }>>,
  stmts?: {
    flavorTextStmt: SQLite.SQLiteStatement;
    evolutionStmt: SQLite.SQLiteStatement;
    movesetStmt: SQLite.SQLiteStatement;
  }
): Promise<void> {
  if (!stmts) {
    throw new Error('[Database] writePokeApiEnrichment requires pre-prepared statements');
  }

  const nameToIdMap = new Map<string, number>();
  let maxExistingId = 0;
  try {
    const existingRows = await db.getAllAsync<{ name: string; id: number }>(
      'SELECT name, id FROM pokemon'
    );
    for (const row of existingRows) {
      nameToIdMap.set(row.name, row.id);
      if (row.id > maxExistingId) maxExistingId = row.id;
    }
  } catch (error) {
    // Table may not exist yet on first run, continue with counter
  }

  const flavorTextStmt = stmts.flavorTextStmt;
  const evolutionStmt = stmts.evolutionStmt;
  const movesetStmt = stmts.movesetStmt;

  // Build a map of species ID -> pokemon DB ID for evolution linking
  const speciesNumToDefaultDbId = new Map<number, number>();
  const speciesNameToDbId = new Map<string, number>();

  const speciesData = dex.species.all();
  const processedSpecies = new Set<string>();
  let nextNewId = maxExistingId + 1;

  // First pass: build the ID maps and map alternate forms to their DB IDs
  for (const species of speciesData) {
    const excluded = (species.isNonstandard === 'CAP' || species.isNonstandard === 'Future' || species.isNonstandard === 'Custom')
      && !FUTURE_FORM_ALLOWLIST.has(species.name);
    if (!species.exists || excluded || processedSpecies.has(species.name)) {
      continue;
    }
    if (FORM_EXCLUSION_SET.has(species.name)) {
      continue;
    }
    processedSpecies.add(species.name);

    let insertId: number;
    if (nameToIdMap.has(species.id)) {
      insertId = nameToIdMap.get(species.id)!;
    } else {
      insertId = nextNewId++;
      nameToIdMap.set(species.id, insertId);
    }

    // Map species name to DB ID for evolution tracking
    speciesNameToDbId.set(species.id, insertId);

    // Map default forms to their DB IDs
    if (!species.forme) {
      speciesNumToDefaultDbId.set(species.num, insertId);
    }
  }

  // Second pass: write flavor text and evolutions
  processedSpecies.clear();

  for (const species of speciesData) {
    const excluded = (species.isNonstandard === 'CAP' || species.isNonstandard === 'Future' || species.isNonstandard === 'Custom')
      && !FUTURE_FORM_ALLOWLIST.has(species.name);
    if (!species.exists || excluded || processedSpecies.has(species.name)) {
      continue;
    }
    if (FORM_EXCLUSION_SET.has(species.name)) {
      continue;
    }
    processedSpecies.add(species.name);

    const pokemonId = nameToIdMap.get(species.id)!;

    // Write flavor text for default forms only
    if (!species.forme) {
      const texts = speciesDataCache.flavorTexts.get(species.num) ?? [];
      for (const ft of texts) {
        await flavorTextStmt.executeAsync([pokemonId, ft.gameVersion, ft.flavorText]);
      }
    }

    // Write evolutions for default forms only
    if (!species.forme) {
      const evos = speciesDataCache.evolutions.get(species.num) ?? [];
      for (const evo of evos) {
        const targetDbId = speciesNumToDefaultDbId.get(evo.evolvesToNum);
        if (targetDbId) {
          await evolutionStmt.executeAsync([pokemonId, targetDbId, evo.method, evo.conditionValue]);
        }
      }
    } else {
      // Alternate forms can still have evolutions to alternate forms
      if (species.evos && species.evos.length > 0) {
        for (const evoName of species.evos) {
          const evolvedDbId = speciesNameToDbId.get(evoName.toLowerCase());
          if (evolvedDbId) {
            await evolutionStmt.executeAsync([pokemonId, evolvedDbId, 'other', null]);
          }
        }
      }
    }
  }

  // Write movesets if provided
  if (movesetCache) {
    // Build a set of valid move IDs for FK validation
    const validMoveIds = new Set<number>();
    try {
      const moveRows = await db.getAllAsync<{ id: number }>(`SELECT id FROM moves`);
      for (const row of moveRows) {
        validMoveIds.add(row.id);
      }
    } catch (error) {
      console.warn('[Database] Could not validate move IDs:', error);
    }

    for (const [pokemonId, moveset] of movesetCache) {
      for (const move of moveset) {
        // Only insert if move exists in the moves table
        if (validMoveIds.has(move.moveId)) {
          await movesetStmt.executeAsync([
            pokemonId,
            move.moveId,
            move.learnMethod,
            move.learnLevel
          ]);
        }
      }
    }
  }

  // Statements are finalized outside the transaction (Bug 1 fix)
}

async function seedAbilities(db: SQLite.SQLiteDatabase, dex: any): Promise<void> {
  console.log('[Database] Seeding abilities...');

  const abilityData = dex.abilities.all();
  const abilities = [];
  for (const ability of abilityData) {
    // Skip non-standard or invalid abilities
    if (ability.isNonstandard || ability.num <= 0) {
      continue;
    }

    abilities.push({
      id: ability.num,
      name: ability.id,
      displayName: ability.name,
      description: ability.desc || '',
      shortDescription: ability.shortDesc || '',
      generation: ability.gen,
    });
  }

  // Batch insert abilities with ON CONFLICT DO UPDATE to upsert (avoids FK cascade delete)
  const stmt = await db.prepareAsync(
    `INSERT INTO abilities
     (id, name, display_name, description, short_description, generation)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       display_name = excluded.display_name,
       description = excluded.description,
       short_description = excluded.short_description,
       generation = excluded.generation`
  );

  for (const ability of abilities) {
    await stmt.executeAsync([
      ability.id,
      ability.name,
      ability.displayName,
      ability.description,
      ability.shortDescription,
      ability.generation,
    ]);
  }

  await stmt.finalizeAsync();
  console.log(`[Database] Seeded ${abilities.length} abilities`);
}

async function seedItems(db: SQLite.SQLiteDatabase, dex: any): Promise<void> {
  console.log('[Database] Seeding items...');

  const itemData = dex.items.all();
  const items = [];
  for (const item of itemData) {
    // Skip non-standard or invalid items
    if (item.isNonstandard || item.num <= 0) {
      continue;
    }

    const category = mapItemCategory(item.id, item);
    items.push({
      id: item.num,
      name: item.id,
      displayName: item.name,
      category,
      description: item.desc || '',
      shortDescription: item.shortDesc || '',
      spriteUrl: null, // Sprites would need to be mapped separately
      cost: null,
    });
  }

  const stmt = await db.prepareAsync(
    `INSERT INTO items
     (id, name, display_name, category, description, short_description, sprite_url, cost)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       display_name = excluded.display_name,
       category = excluded.category,
       description = excluded.description,
       short_description = excluded.short_description,
       sprite_url = excluded.sprite_url,
       cost = excluded.cost`
  );

  for (const item of items) {
    await stmt.executeAsync([
      item.id,
      item.name,
      item.displayName,
      item.category,
      item.description,
      item.shortDescription,
      item.spriteUrl,
      item.cost,
    ]);
  }

  await stmt.finalizeAsync();
  console.log(`[Database] Seeded ${items.length} items`);
}

async function seedMoves(db: SQLite.SQLiteDatabase, dex: any): Promise<void> {
  console.log('[Database] Seeding moves...');

  const moveData = dex.moves.all();
  const moves = [];
  for (const move of moveData) {
    // Skip non-standard or invalid moves
    if (move.isNonstandard || move.num <= 0) {
      continue;
    }

    // Handle accuracy which can be boolean (true) or number
    let accuracy: number | null = null;
    if (move.accuracy === true) {
      accuracy = 100;
    } else if (typeof move.accuracy === 'number') {
      accuracy = move.accuracy;
    }

    // Handle basePower which might be 0 or null
    const power = move.basePower > 0 ? move.basePower : null;

    moves.push({
      id: move.num,
      name: move.id,
      displayName: move.name,
      type: move.type,
      category: move.category,
      power,
      accuracy,
      pp: move.pp,
      priority: move.priority || 0,
      description: move.desc || '',
      shortDescription: move.shortDesc || '',
      generation: move.gen,
      makesContact: move.flags?.contact ? 1 : 0,
    });
  }

  const stmt = await db.prepareAsync(
    `INSERT INTO moves
     (id, name, display_name, type, category, power, accuracy, pp, priority, description, short_description, generation, makes_contact)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       display_name = excluded.display_name,
       type = excluded.type,
       category = excluded.category,
       power = excluded.power,
       accuracy = excluded.accuracy,
       pp = excluded.pp,
       priority = excluded.priority,
       description = excluded.description,
       short_description = excluded.short_description,
       generation = excluded.generation,
       makes_contact = excluded.makes_contact`
  );

  for (const move of moves) {
    await stmt.executeAsync([
      move.id,
      move.name,
      move.displayName,
      move.type,
      move.category,
      move.power,
      move.accuracy,
      move.pp,
      move.priority,
      move.description,
      move.shortDescription,
      move.generation,
      move.makesContact,
    ]);
  }

  await stmt.finalizeAsync();
  console.log(`[Database] Seeded ${moves.length} moves`);
}

/**
 * Forms that don't exist in PokeAPI.
 * When encountered, skip PokeAPI fetch and use national_dex instead.
 */
const POKEAPI_SLUG_EXCLUSION_SET = new Set<string>([
  'pikachu-alola', // Not a separate PokeAPI entry
  'marowak-alola-totem', // Totem forms not in PokeAPI
  'marowak-totem-alola', // Totem forms not in PokeAPI
]);

/**
 * Legends Z-A mega evolution forms that should be allowlisted.
 * These 49 forms are marked as `isNonstandard: 'Future'` in @pkmn/dex but should be included in the database.
 */
const FUTURE_FORM_ALLOWLIST = new Set<string>([
  'Clefable-Mega', 'Victreebel-Mega', 'Starmie-Mega', 'Dragonite-Mega',
  'Meganium-Mega', 'Feraligatr-Mega', 'Skarmory-Mega', 'Chimecho-Mega',
  'Absol-Mega-Z', 'Staraptor-Mega', 'Garchomp-Mega-Z', 'Lucario-Mega-Z',
  'Froslass-Mega', 'Heatran-Mega', 'Darkrai-Mega', 'Emboar-Mega',
  'Excadrill-Mega', 'Scolipede-Mega', 'Scrafty-Mega', 'Eelektross-Mega',
  'Chandelure-Mega', 'Golurk-Mega', 'Chesnaught-Mega', 'Delphox-Mega',
  'Greninja-Mega', 'Pyroar-Mega', 'Floette-Mega', 'Meowstic-M-Mega',
  'Meowstic-F-Mega', 'Malamar-Mega', 'Barbaracle-Mega', 'Dragalge-Mega',
  'Hawlucha-Mega', 'Zygarde-Mega', 'Crabominable-Mega', 'Golisopod-Mega',
  'Drampa-Mega', 'Magearna-Mega', 'Magearna-Original-Mega', 'Zeraora-Mega',
  'Falinks-Mega', 'Scovillain-Mega', 'Glimmora-Mega',
  'Tatsugiri-Curly-Mega', 'Tatsugiri-Droopy-Mega', 'Tatsugiri-Stretchy-Mega',
  'Baxcalibur-Mega', 'Raichu-Mega-X', 'Raichu-Mega-Y',
]);

/**
 * Forms that should NOT be stored as separate DB rows (using species.name for matching).
 *
 * These are split into two categories, both of which will be sourced from @pkmn/dex at display time in a future phase:
 *
 * Cosmetic alternates (variants that differ only in appearance, no gameplay changes):
 * Vivillon patterns (Icy Snow, Polar, Tundra, Continental, Garden, Elegant, Modern, Marine, Archipelago,
 * High Plains, Sandstorm, River, Monsoon, Savanna, Sun, Ocean, Jungle, Fancy, Pokeball),
 * Alcremie cream/swirl variants, Minior colors, seasonal forms (Deerling, Shellos, Cramorant, Pichu, Cherrim),
 * Magearna-Original, Zarude-Dada, Squawkabilly colors, Poltchageist-Artisan, Sinistcha-Masterpiece,
 * Sinistea-Antique, Polteageist-Antique.
 *
 * Type-variant alternates (Arceus and Silvally with different types, Genesect drives, Castform weather forms):
 * These serve no gameplay purpose beyond theming and are less commonly needed in primary database operations.
 */
const FORM_EXCLUSION_SET = new Set<string>([
  // Regional bucket
  'Raticate-Alola-Totem',
  'Marowak-Alola-Totem',
  'Pikachu-Alola',

  // Totem forms
  'Gumshoos-Totem',
  'Vikavolt-Totem',
  'Ribombee-Totem',
  'Araquanid-Totem',
  'Lurantis-Totem',
  'Salazzle-Totem',
  'Togedemaru-Totem',
  'Kommo-o-Totem',
  'Mimikyu-Totem',
  'Mimikyu-Busted-Totem',

  // Pikachu event/cap forms
  'Pikachu-Cosplay',
  'Pikachu-Rock-Star',
  'Pikachu-Belle',
  'Pikachu-Pop-Star',
  'Pikachu-PhD',
  'Pikachu-Libre',
  'Pikachu-Original',
  'Pikachu-Hoenn',
  'Pikachu-Sinnoh',
  'Pikachu-Unova',
  'Pikachu-Kalos',
  'Pikachu-Partner',
  'Pikachu-World',
  'Pikachu-Starter',

  // Other removals
  'Eevee-Starter',

  // Cosmetic alternates (appearance only, no gameplay changes)
  'Vivillon-Icy Snow',
  'Vivillon-Polar',
  'Vivillon-Tundra',
  'Vivillon-Continental',
  'Vivillon-Garden',
  'Vivillon-Elegant',
  'Vivillon-Modern',
  'Vivillon-Marine',
  'Vivillon-Archipelago',
  'Vivillon-High Plains',
  'Vivillon-Sandstorm',
  'Vivillon-River',
  'Vivillon-Monsoon',
  'Vivillon-Savanna',
  'Vivillon-Sun',
  'Vivillon-Ocean',
  'Vivillon-Jungle',
  'Vivillon-Fancy',
  'Vivillon-Pokeball',
  'Alcremie-Ruby-Cream',
  'Alcremie-Matcha-Cream',
  'Alcremie-Mint-Cream',
  'Alcremie-Lemon-Cream',
  'Alcremie-Ruby-Swirl',
  'Alcremie-Caramel-Swirl',
  'Alcremie-Rainbow-Swirl',
  'Minior-Orange',
  'Minior-Yellow',
  'Minior-Green',
  'Minior-Blue',
  'Minior-Indigo',
  'Minior-Violet',
  'Minior-Meteor',
  'Deerling-Summer',
  'Deerling-Autumn',
  'Deerling-Winter',
  'Shellos-East',
  'Gastrodon-East',
  'Cramorant-Gulping',
  'Cramorant-Gorging',
  'Pichu-Spiky-eared',
  'Cherrim-Sunshine',
  'Magearna-Original',
  'Zarude-Dada',
  'Squawkabilly-Blue',
  'Squawkabilly-Yellow',
  'Squawkabilly-White',
  'Poltchageist-Artisan',
  'Sinistcha-Masterpiece',
  'Sinistea-Antique',
  'Polteageist-Antique',

  // Type-variant alternates (Arceus and Silvally with different types, Genesect drives, Castform weather forms)
  'Arceus-Bug',
  'Arceus-Dark',
  'Arceus-Dragon',
  'Arceus-Electric',
  'Arceus-Fairy',
  'Arceus-Fighting',
  'Arceus-Fire',
  'Arceus-Flying',
  'Arceus-Ghost',
  'Arceus-Grass',
  'Arceus-Ground',
  'Arceus-Ice',
  'Arceus-Poison',
  'Arceus-Psychic',
  'Arceus-Rock',
  'Arceus-Steel',
  'Arceus-Water',
  'Silvally-Bug',
  'Silvally-Dark',
  'Silvally-Dragon',
  'Silvally-Electric',
  'Silvally-Fairy',
  'Silvally-Fighting',
  'Silvally-Fire',
  'Silvally-Flying',
  'Silvally-Ghost',
  'Silvally-Grass',
  'Silvally-Ground',
  'Silvally-Ice',
  'Silvally-Poison',
  'Silvally-Psychic',
  'Silvally-Rock',
  'Silvally-Steel',
  'Silvally-Water',
  'Genesect-Douse',
  'Genesect-Shock',
  'Genesect-Burn',
  'Genesect-Chill',
  'Castform-Sunny',
  'Castform-Rainy',
  'Castform-Snowy',
]);

/**
 * Generate a PokeAPI-compatible slug from a species name.
 * Handles special characters, female/male forms, and totem forms.
 * @param speciesName The species name from @pkmn/dex (e.g. "Farfetch'd-Galar", "Meowstic-F")
 * @param forme The forme value from @pkmn/dex (e.g. "F", "M", "Mega", or "")
 */
function generatePokeApiSlug(speciesName: string, forme: string = ''): string {
  let slug = speciesName.toLowerCase();

  // Replace spaces with hyphens
  slug = slug.replace(/ /g, '-');

  // Strip special characters (apostrophes — both straight ' U+0027 and curly ' U+2019, and periods)
  slug = slug.replace(/['’.]/g, '');

  // Handle female/male form suffix conversion ONLY for gender formes.
  // PokeAPI uses -female/-male for gender-specific formes (like Meowstic-F → meowstic-female),
  // but some species like Nidoran-F are standalone with -f/-m in their actual slug.
  // Only replace if forme explicitly indicates it's a gender forme.
  if (forme === 'F') {
    slug = slug.replace(/-f$/, '-female');
  } else if (forme === 'M') {
    slug = slug.replace(/-m$/, '-male');
  }

  // Reorder totem forms: {name}-{region}-totem → {name}-totem-{region}
  // e.g., raticate-alola-totem → raticate-totem-alola
  const totemMatch = slug.match(/^(.+?)-(alola|galar|hisui|paldea)-totem$/);
  if (totemMatch) {
    const [, baseName, region] = totemMatch;
    slug = `${baseName}-totem-${region}`;
  }

  // Special case: Tauros Paldean forms need "-breed" suffix
  // e.g., tauros-paldea-combat → tauros-paldea-combat-breed
  if (slug.match(/^tauros-paldea-(combat|blaze|aqua)$/)) {
    slug = `${slug}-breed`;
  }

  // Special case: Darmanitan-Galar needs "-standard" suffix
  // e.g., darmanitan-galar → darmanitan-galar-standard
  if (slug === 'darmanitan-galar') {
    slug = 'darmanitan-galar-standard';
  }

  // Special case: Toxtricity-Gmax is the Gmax of the amped form (base Toxtricity)
  // e.g., toxtricity-gmax → toxtricity-amped-gmax (ID 10219)
  if (slug === 'toxtricity-gmax') {
    slug = 'toxtricity-amped-gmax';
  }

  // Special case: Urshifu-Gmax is the Gmax of the single-strike form (base Urshifu)
  // e.g., urshifu-gmax → urshifu-single-strike-gmax (ID 10226)
  if (slug === 'urshifu-gmax') {
    slug = 'urshifu-single-strike-gmax';
  }

  // Special case: Zygarde-10% needs the percent stripped from the slug
  if (slug === 'zygarde-10%') {
    slug = 'zygarde-10';
  }

  return slug;
}

/**
 * Backfill classifications for pokemon with missing species_classification.
 * Runs as fire-and-forget after enrichDatabaseAsync completes.
 */
async function runClassificationBackfill(db: SQLite.SQLiteDatabase, dex: any): Promise<void> {
  try {
    // Check if backfill is already complete
    const backfillResult = await db.getFirstAsync<{ value: string }>(
      'SELECT value FROM sync_metadata WHERE key = ?',
      ['classification_backfill_v1']
    );

    if (backfillResult?.value === 'done') {
      console.log('[Database] Classification backfill already complete');
      return;
    }

    console.log('[Database] Starting classification backfill...');

    // Find all default-form pokemon with missing classifications
    const pokemonToUpdate = await db.getAllAsync<{ id: number; national_dex: number }>(
      `SELECT id, national_dex FROM pokemon WHERE form_type = 'default' AND species_classification IS NULL`
    );

    console.log(`[Database] Found ${pokemonToUpdate.length} pokemon needing classification backfill`);

    let updated = 0;

    const BATCH_SIZE = 10;
    for (let i = 0; i < pokemonToUpdate.length; i += BATCH_SIZE) {
      const batch = pokemonToUpdate.slice(i, i + BATCH_SIZE);
      let batchHadNetworkFetch = false;

      await Promise.all(batch.map(async (item) => {
        const { id, national_dex } = item;

        try {
          const response = await withSemaphore(() => fetch(`https://pokeapi.co/api/v2/pokemon-species/${national_dex}/`));
          if (!response.ok) {
            console.warn(`[Database] Failed to fetch species ${national_dex}: ${response.status}`);
            return;
          }

          const data = await response.json();
          const genus = data.genera?.find((g: any) => g.language?.name === 'en')?.genus ?? null;

          if (genus) {
            await db.runAsync(
              `UPDATE pokemon SET species_classification = ? WHERE id = ? AND species_classification IS NULL`,
              [genus, id]
            );
            updated++;
          }

          batchHadNetworkFetch = true;
        } catch (error) {
          console.warn(`[Database] Error fetching classification for species ${national_dex}:`, error);
        }
      }));

      // Rate limit: only sleep if this batch made at least one network request
      if (batchHadNetworkFetch) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Progress log every 10 batches
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(pokemonToUpdate.length / BATCH_SIZE);
      if (batchNum % 10 === 0 || batchNum === totalBatches) {
        console.log(`[Database] runClassificationBackfill batch ${batchNum}/${totalBatches} (${updated} updated)`);
      }
    }

    // Mark backfill as complete
    await db.runAsync(
      `INSERT OR REPLACE INTO sync_metadata (key, value, updated_at)
       VALUES (?, ?, datetime('now'))`,
      ['classification_backfill_v1', 'done']
    );

    console.log(`[Database] Classification backfill complete (updated ${updated} pokemon)`);
  } catch (error) {
    console.warn('[Database] Error during classification backfill:', error);
  }
}

/**
 * Backfill moves for pokemon with missing movesets.
 * Runs as fire-and-forget after enrichDatabaseAsync completes.
 */
async function runMovesBackfill(db: SQLite.SQLiteDatabase, dex: any): Promise<void> {
  try {
    // Check if backfill is already complete
    const backfillResult = await db.getFirstAsync<{ value: string }>(
      'SELECT value FROM sync_metadata WHERE key = ?',
      ['moves_backfill_v1']
    );

    if (backfillResult?.value === 'done') {
      console.log('[Database] Moves backfill already complete');
      return;
    }

    console.log('[Database] Starting moves backfill...');

    // Find all default-form pokemon with missing movesets
    const pokemonToUpdate = await db.getAllAsync<{ id: number; pokeapi_id: number }>(
      `SELECT p.id, p.pokeapi_id FROM pokemon p WHERE p.form_type = 'default' AND NOT EXISTS (SELECT 1 FROM pokemon_moves pm WHERE pm.pokemon_id = p.id)`
    );

    console.log(`[Database] Found ${pokemonToUpdate.length} pokemon needing moves backfill`);

    // Build a map of move name -> move id
    const moveNameToId = new Map<string, number>();
    try {
      const moveRows = await db.getAllAsync<{ name: string; id: number }>(`SELECT name, id FROM moves`);
      for (const row of moveRows) {
        moveNameToId.set(row.name, row.id);
      }
    } catch (error) {
      console.warn('[Database] Could not load move name map:', error);
      return;
    }

    let updated = 0;

    const BATCH_SIZE = 10;
    for (let i = 0; i < pokemonToUpdate.length; i += BATCH_SIZE) {
      const batch = pokemonToUpdate.slice(i, i + BATCH_SIZE);
      let batchHadNetworkFetch = false;

      await Promise.all(batch.map(async (item) => {
        const { id, pokeapi_id } = item;

        try {
          const response = await withSemaphore(() => fetch(`https://pokeapi.co/api/v2/pokemon/${pokeapi_id}/`));
          if (!response.ok) {
            console.warn(`[Database] Failed to fetch pokemon ${pokeapi_id}: ${response.status}`);
            return;
          }

          const data = await response.json();
          const seenMoves = new Set<string>();
          let moveCount = 0;

          if (data.moves && Array.isArray(data.moves)) {
            for (const moveEntry of data.moves) {
              if (!moveEntry.move?.name) continue;

              const moveName = moveEntry.move.name;
              const moveId = moveNameToId.get(moveName);

              if (!moveId) {
                // Move not found in DB
                continue;
              }

              if (!moveEntry.version_group_details || moveEntry.version_group_details.length === 0) {
                continue;
              }

              const detail = moveEntry.version_group_details[0];
              const learnMethod = detail.move_learn_method?.name ?? 'other';

              // Skip duplicates
              const key = `${moveId}:${learnMethod}`;
              if (seenMoves.has(key)) {
                continue;
              }
              seenMoves.add(key);

              const learnLevel = (learnMethod === 'level-up' && detail.level_learned_at > 0)
                ? detail.level_learned_at
                : null;

              await db.runAsync(
                `INSERT OR IGNORE INTO pokemon_moves (pokemon_id, move_id, learn_method, learn_level)
                 VALUES (?, ?, ?, ?)`,
                [id, moveId, learnMethod, learnLevel]
              );
              moveCount++;
            }
          }

          if (moveCount > 0) {
            updated++;
          }

          batchHadNetworkFetch = true;
        } catch (error) {
          console.warn(`[Database] Error fetching moves for pokemon ${pokeapi_id}:`, error);
        }
      }));

      // Rate limit: only sleep if this batch made at least one network request
      if (batchHadNetworkFetch) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Progress log every 10 batches
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(pokemonToUpdate.length / BATCH_SIZE);
      if (batchNum % 10 === 0 || batchNum === totalBatches) {
        console.log(`[Database] runMovesBackfill batch ${batchNum}/${totalBatches} (${updated} updated)`);
      }
    }

    // Mark backfill as complete
    await db.runAsync(
      `INSERT OR REPLACE INTO sync_metadata (key, value, updated_at)
       VALUES (?, ?, datetime('now'))`,
      ['moves_backfill_v1', 'done']
    );

    console.log(`[Database] Moves backfill complete (updated ${updated} pokemon)`);
  } catch (error) {
    console.warn('[Database] Error during moves backfill:', error);
  }
}

interface PokeApiEncounterEntry {
  location_area: { name: string };
  version_details: Array<{
    version: { name: string };
    encounter_details: Array<{
      method: { name: string };
      chance: number;
      min_level: number;
      max_level: number;
    }>;
  }>;
}

function formatEncounterMethod(slug: string): string {
  const METHOD_MAP: Record<string, string> = {
    'walk': 'Walking',
    'surf': 'Surfing',
    'old-rod': 'Fishing (Old Rod)',
    'good-rod': 'Fishing (Good Rod)',
    'super-rod': 'Fishing (Super Rod)',
    'rock-smash': 'Rock Smash',
    'headbutt': 'Headbutt',
    'headbutt-normal': 'Headbutt',
    'headbutt-special': 'Headbutt',
    'dark-grass': 'Dark Grass',
    'cave': 'Cave',
    'gift': 'Gift',
    'gift-egg': 'Gift Egg',
    'only-one': 'One-time',
    'pokeflute': 'PokéFlute',
    'squirt-bottle': 'Squirt Bottle',
    'wailmer-pail': 'Wailmer Pail',
    'seaweed': 'Seaweed',
    'special': 'Special',
  };
  return METHOD_MAP[slug] ?? slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

const LOCATION_NAME_OVERRIDES: Record<string, string> = {
  'pallet-town-area': 'Pallet Town',
  'viridian-city-area': 'Viridian City',
  'cerulean-city-area': 'Cerulean City',
};

function slugToDisplayName(slug: string): string {
  if (LOCATION_NAME_OVERRIDES[slug]) return LOCATION_NAME_OVERRIDES[slug];
  let name = slug.replace(/-area-(one|two|three|four|five|six|seven|eight|nine|ten)$/i, (_, n) => ` (Area ${n.charAt(0).toUpperCase() + n.slice(1)})`);
  name = name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  return name;
}

/**
 * Backfill encounter locations for pokemon from PokeAPI.
 * Runs as fire-and-forget after other enrichment streams.
 */
async function runEncountersBackfill(db: SQLite.SQLiteDatabase): Promise<void> {
  try {
    const done = await db.getFirstAsync<{ value: string }>(
      `SELECT value FROM sync_metadata WHERE key = ?`, ['encounters_backfill_v1']
    );
    if (done?.value === 'done') {
      console.log('[Database] Encounters backfill already complete');
      return;
    }

    console.log('[Database] Starting encounters backfill...');

    const pokemonToFetch = await db.getAllAsync<{ id: number; pokeapi_id: number }>(
      `SELECT id, pokeapi_id FROM pokemon WHERE form_type = 'default' AND pokeapi_id > 0`
    );

    console.log(`[Database] Fetching encounters for ${pokemonToFetch.length} pokemon`);

    const BATCH_SIZE = 10;
    let fetched = 0;

    for (let i = 0; i < pokemonToFetch.length; i += BATCH_SIZE) {
      const batch = pokemonToFetch.slice(i, i + BATCH_SIZE);
      let batchHadNetworkFetch = false;

      const allRows: Array<{
        pokemonId: number;
        gameVersion: string;
        locationName: string;
        locationAreaSlug: string;
        encounterMethod: string;
        encounterChance: number;
        minLevel: number | null;
        maxLevel: number | null;
      }> = [];

      await Promise.all(batch.map(async ({ id, pokeapi_id }) => {
        try {
          const existing = await db.getFirstAsync<{ count: number }>(
            `SELECT COUNT(*) as count FROM pokemon_encounter_locations WHERE pokemon_id = ?`, [id]
          );
          if (existing && existing.count > 0) return;
        } catch {
          // Table may not exist on first run
        }

        try {
          const response = await withSemaphore(() =>
            fetch(`https://pokeapi.co/api/v2/pokemon/${pokeapi_id}/encounters`)
          );
          if (!response.ok) return;

          const data: PokeApiEncounterEntry[] = await response.json();

          for (const locationEntry of data) {
            const slug = locationEntry.location_area.name;
            const locationName = slugToDisplayName(slug);

            for (const versionDetail of locationEntry.version_details) {
              const gameVersion = versionDetail.version.name;

              const methodChanceMap = new Map<string, { maxChance: number; minLevel: number | null; maxLevel: number | null }>();

              for (const detail of versionDetail.encounter_details) {
                const method = formatEncounterMethod(detail.method.name);
                const chance = detail.chance;
                const minLv = detail.min_level ?? null;
                const maxLv = detail.max_level ?? null;

                const existing = methodChanceMap.get(method);
                if (!existing || chance > existing.maxChance) {
                  methodChanceMap.set(method, { maxChance: chance, minLevel: minLv, maxLevel: maxLv });
                }
              }

              for (const [method, { maxChance, minLevel, maxLevel }] of methodChanceMap) {
                if (maxChance > 0) {
                  allRows.push({
                    pokemonId: id,
                    gameVersion,
                    locationName,
                    locationAreaSlug: slug,
                    encounterMethod: method,
                    encounterChance: maxChance,
                    minLevel,
                    maxLevel,
                  });
                }
              }
            }
          }

          fetched++;
          batchHadNetworkFetch = true;
        } catch (error) {
          console.warn(`[Database] Error fetching encounters for pokemon ${pokeapi_id}:`, error);
        }
      }));

      if (allRows.length > 0) {
        for (const row of allRows) {
          await db.runAsync(
            `INSERT OR IGNORE INTO pokemon_encounter_locations
             (pokemon_id, game_version, location_name, location_area_slug, encounter_method, encounter_chance, min_level, max_level)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [row.pokemonId, row.gameVersion, row.locationName, row.locationAreaSlug,
             row.encounterMethod, row.encounterChance, row.minLevel, row.maxLevel]
          );
        }
      }

      if (batchHadNetworkFetch) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(pokemonToFetch.length / BATCH_SIZE);
      if (batchNum % 10 === 0 || batchNum === totalBatches) {
        console.log(`[Database] runEncountersBackfill batch ${batchNum}/${totalBatches} (${fetched} fetched)`);
      }
    }

    await db.runAsync(
      `INSERT OR REPLACE INTO sync_metadata (key, value, updated_at) VALUES (?, ?, datetime('now'))`,
      ['encounters_backfill_v1', 'done']
    );

    console.log(`[Database] Encounters backfill complete (${fetched} pokemon fetched)`);
  } catch (error) {
    console.warn('[Database] Error during encounters backfill:', error);
  }
}

/**
 * Backfill moves for the 49 Legends Z-A mega forms.
 * Runs as a targeted fire-and-forget stream; gated by za_forms_enrichment_v1.
 */
async function runZAFormsEnrichmentBackfill(db: SQLite.SQLiteDatabase): Promise<void> {
  try {
    const done = await db.getFirstAsync<{ value: string }>(
      `SELECT value FROM sync_metadata WHERE key = ?`, ['za_forms_enrichment_v1']
    );
    if (done?.value === 'done') {
      console.log('[Database] Z-A forms enrichment already complete');
      return;
    }

    console.log('[Database] Starting Z-A forms enrichment backfill...');

    const ZA_FORM_NAMES = [
      'clefable-mega', 'victreebel-mega', 'starmie-mega', 'dragonite-mega',
      'meganium-mega', 'feraligatr-mega', 'skarmory-mega', 'chimecho-mega',
      'absol-mega-z', 'staraptor-mega', 'garchomp-mega-z', 'lucario-mega-z',
      'froslass-mega', 'heatran-mega', 'darkrai-mega', 'emboar-mega',
      'excadrill-mega', 'scolipede-mega', 'scrafty-mega', 'eelektross-mega',
      'chandelure-mega', 'golurk-mega', 'chesnaught-mega', 'delphox-mega',
      'greninja-mega', 'pyroar-mega', 'floette-mega', 'meowstic-m-mega',
      'meowstic-f-mega', 'malamar-mega', 'barbaracle-mega', 'dragalge-mega',
      'hawlucha-mega', 'zygarde-mega', 'crabominable-mega', 'golisopod-mega',
      'drampa-mega', 'magearna-mega', 'magearna-original-mega', 'zeraora-mega',
      'falinks-mega', 'scovillain-mega', 'glimmora-mega',
      'tatsugiri-curly-mega', 'tatsugiri-droopy-mega', 'tatsugiri-stretchy-mega',
      'baxcalibur-mega', 'raichu-mega-x', 'raichu-mega-y',
    ];

    const placeholders = ZA_FORM_NAMES.map(() => '?').join(', ');
    const pokemonToFetch = await db.getAllAsync<{ id: number; pokeapi_id: number }>(
      `SELECT id, pokeapi_id FROM pokemon WHERE name IN (${placeholders}) AND pokeapi_id > 0`,
      ZA_FORM_NAMES
    );

    console.log(`[Database] Found ${pokemonToFetch.length} Z-A forms in DB`);

    const validMoveIds = new Set<number>();
    try {
      const moveRows = await db.getAllAsync<{ id: number }>(`SELECT id FROM moves`);
      for (const row of moveRows) {
        validMoveIds.add(row.id);
      }
    } catch (error) {
      console.warn('[Database] Could not validate move IDs for Z-A backfill:', error);
      return;
    }

    let updated = 0;
    const BATCH_SIZE = 10;

    for (let i = 0; i < pokemonToFetch.length; i += BATCH_SIZE) {
      const batch = pokemonToFetch.slice(i, i + BATCH_SIZE);
      let batchHadNetworkFetch = false;

      await Promise.all(batch.map(async ({ id, pokeapi_id }) => {
        try {
          const response = await withSemaphore(() => fetch(`https://pokeapi.co/api/v2/pokemon/${pokeapi_id}/`));
          if (!response.ok) {
            console.warn(`[Database] Failed to fetch Z-A form ${pokeapi_id}: ${response.status}`);
            return;
          }

          const data = await response.json();
          const seenMoves = new Set<string>();
          let moveCount = 0;

          if (data.moves && Array.isArray(data.moves)) {
            for (const moveEntry of data.moves) {
              if (!moveEntry.move?.url) continue;

              const moveIdMatch = moveEntry.move.url.match(/\/move\/(\d+)\//);
              if (!moveIdMatch) continue;

              const moveId = parseInt(moveIdMatch[1], 10);
              if (!validMoveIds.has(moveId)) continue;

              if (!moveEntry.version_group_details || moveEntry.version_group_details.length === 0) continue;

              const detail = moveEntry.version_group_details[0];
              const learnMethod = detail.move_learn_method?.name ?? 'other';

              const key = `${moveId}:${learnMethod}`;
              if (seenMoves.has(key)) continue;
              seenMoves.add(key);

              const learnLevel = (learnMethod === 'level-up' && detail.level_learned_at > 0)
                ? detail.level_learned_at
                : null;

              await db.runAsync(
                `INSERT OR IGNORE INTO pokemon_moves (pokemon_id, move_id, learn_method, learn_level) VALUES (?, ?, ?, ?)`,
                [id, moveId, learnMethod, learnLevel]
              );
              moveCount++;
            }
          }

          if (moveCount > 0) updated++;
          batchHadNetworkFetch = true;
        } catch (error) {
          console.warn(`[Database] Error fetching Z-A form ${pokeapi_id}:`, error);
        }
      }));

      if (batchHadNetworkFetch) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    await db.runAsync(
      `INSERT OR REPLACE INTO sync_metadata (key, value, updated_at) VALUES (?, ?, datetime('now'))`,
      ['za_forms_enrichment_v1', 'done']
    );

    console.log(`[Database] Z-A forms enrichment complete (${updated} forms with moves)`);
  } catch (error) {
    console.warn('[Database] Error during Z-A forms enrichment backfill:', error);
  }
}

async function prefetchPokeApiIds(db: SQLite.SQLiteDatabase, dex: any): Promise<Map<string, number>> {
  console.log('[Database] Prefetching PokeAPI IDs for alternate forms...');
  const pokeApiIdCache = new Map<string, number>();

  const speciesData = dex.species.all();
  const processedSpecies = new Set<string>();
  let networkFetches = 0;
  let cacheHits = 0;

  // Build items array first (same filtering logic as the existing loop)
  const items = [];
  for (const species of speciesData) {
    const excluded = (species.isNonstandard === 'CAP' || species.isNonstandard === 'Future' || species.isNonstandard === 'Custom')
      && !FUTURE_FORM_ALLOWLIST.has(species.name);
    if (!species.exists || excluded || processedSpecies.has(species.name)) {
      continue;
    }
    processedSpecies.add(species.name);

    // Skip forms that are excluded from the database entirely
    if (FORM_EXCLUSION_SET.has(species.name)) {
      continue;
    }

    const formType = determineFormType(species);

    if (formType !== 'default') {
      const pokeApiSlug = generatePokeApiSlug(species.name, species.forme);

      if (!POKEAPI_SLUG_EXCLUSION_SET.has(pokeApiSlug)) {
        items.push(species);
      }
    }
  }

  // Batch process items
  const BATCH_SIZE = 10;
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    let batchHadNetworkFetch = false;

    await Promise.all(batch.map(async (species) => {
      // Check if this form already exists in the database with a valid pokeapi_id
      try {
        const existing = await db.getFirstAsync<{ pokeapi_id: number }>(
          `SELECT pokeapi_id FROM pokemon WHERE name = ? LIMIT 1`,
          [species.id]
        );

        if (existing && existing.pokeapi_id > 0) {
          pokeApiIdCache.set(species.id, existing.pokeapi_id);
          cacheHits++;
          return;
        }
      } catch (error) {
        // Table may not exist yet on first run, continue with network fetch
      }

      // Not in cache, fetch from PokeAPI
      const pokeApiSlug = generatePokeApiSlug(species.name, species.forme);
      const pokeApiId = await fetchPokeApiId(pokeApiSlug, species.num);
      pokeApiIdCache.set(species.id, pokeApiId);
      networkFetches++;
      batchHadNetworkFetch = true;
    }));

    // Rate limit: only sleep if this batch made at least one network request
    if (batchHadNetworkFetch) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Progress log every 10 batches
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(items.length / BATCH_SIZE);
    if (batchNum % 10 === 0 || batchNum === totalBatches) {
      console.log(`[Database] prefetchPokeApiIds batch ${batchNum}/${totalBatches} (${cacheHits} cached, ${networkFetches} fetched)`);
    }
  }

  console.log(`[Database] Prefetched ${pokeApiIdCache.size} PokeAPI IDs (${cacheHits} from DB, ${networkFetches} from network)`);
  return pokeApiIdCache;
}

async function prefetchPokeApiSpeciesData(
  db: SQLite.SQLiteDatabase,
  dex: any
): Promise<{ flavorTexts: Map<number, Array<{ gameVersion: string; flavorText: string }>>; evolutions: Map<number, Array<{ evolvesToNum: number; method: string; conditionValue: string | null }>> }> {
  console.log('[Database] Fetching PokeAPI species data (flavor text and evolutions)...');

  const flavorTexts = new Map<number, Array<{ gameVersion: string; flavorText: string }>>();
  const evolutions = new Map<number, Array<{ evolvesToNum: number; method: string; conditionValue: string | null }>>();
  const evolutionChainCache = new Map<number, any>();

  const speciesData = dex.species.all();
  const processedSpecies = new Set<string>();
  const speciesArray = [];

  for (const species of speciesData) {
    const excluded = (species.isNonstandard === 'CAP' || species.isNonstandard === 'Future' || species.isNonstandard === 'Custom')
      && !FUTURE_FORM_ALLOWLIST.has(species.name);
    if (!species.exists || excluded || processedSpecies.has(species.name)) {
      continue;
    }
    processedSpecies.add(species.name);

    if (species.num > 0 && !species.forme) {
      speciesArray.push(species);
    }
  }

  const total = speciesArray.length;
  let networkFetches = 0;
  let cacheHits = 0;

  const BATCH_SIZE = 10;
  for (let i = 0; i < speciesArray.length; i += BATCH_SIZE) {
    const batch = speciesArray.slice(i, i + BATCH_SIZE);
    let batchHadNetworkFetch = false;

    await Promise.all(batch.map(async (species) => {
      // Tier 1: Check species_enriched column first
      let isEnriched = false;
      try {
        const enrichedRow = await db.getFirstAsync<{ species_enriched: number }>(
          `SELECT species_enriched FROM pokemon WHERE national_dex = ? AND form_type = 'default'`,
          [species.num]
        );
        if (enrichedRow?.species_enriched === 1) {
          isEnriched = true;
          cacheHits++;
        }
      } catch (error) {
        // column may not exist on first run
      }

      if (isEnriched) {
        return;
      }

      // Tier 2 (legacy fallback): Check flavor text and evolution rows
      // This handles species enriched before the species_enriched column existed
      let hasExistingFlavorText = false;
      try {
        const existingFlavorText = await db.getFirstAsync<{ count: number }>(
          `SELECT COUNT(*) as count FROM pokemon_flavor_text ft
           JOIN pokemon p ON p.id = ft.pokemon_id
           WHERE p.national_dex = ? AND p.form_type = 'default'`,
          [species.num]
        );

        if (existingFlavorText && existingFlavorText.count > 0) {
          // Load existing flavor text from DB into the cache
          const flavorTextRows = await db.getAllAsync<{ game_version: string; flavor_text: string }>(
            `SELECT ft.game_version, ft.flavor_text FROM pokemon_flavor_text ft
             JOIN pokemon p ON p.id = ft.pokemon_id
             WHERE p.national_dex = ? AND p.form_type = 'default'`,
            [species.num]
          );

          if (flavorTextRows && flavorTextRows.length > 0) {
            flavorTexts.set(species.num, flavorTextRows.map(r => ({
              gameVersion: r.game_version,
              flavorText: r.flavor_text
            })));
            hasExistingFlavorText = true;
            cacheHits++;
          }
        }
      } catch (error) {
        // Table may not exist yet on first run, continue with network fetch
      }

      // Check if evolutions already exist in the database for this species
      let hasExistingEvolutions = false;
      try {
        const existingEvolutions = await db.getFirstAsync<{ count: number }>(
          `SELECT COUNT(*) as count FROM pokemon_evolutions pe
           JOIN pokemon p_source ON p_source.id = pe.pokemon_id
           WHERE p_source.national_dex = ? AND p_source.form_type = 'default'`,
          [species.num]
        );

        if (existingEvolutions && existingEvolutions.count > 0) {
          // Note: Evolution data will be loaded during seedPokemon from DB with INSERT OR IGNORE
          hasExistingEvolutions = true;
          // We still need to load it into the evolutions map for the seeding logic.
          // Join to the target pokemon to get its national_dex (not DB id).
          const evolutionRows = await db.getAllAsync<{ national_dex: number; method: string; condition_value: string | null }>(
            `SELECT p_target.national_dex, pe.method, pe.condition_value
             FROM pokemon_evolutions pe
             JOIN pokemon p_source ON p_source.id = pe.pokemon_id
             JOIN pokemon p_target ON p_target.id = pe.evolves_to_id
             WHERE p_source.national_dex = ? AND p_source.form_type = 'default'`,
            [species.num]
          );

          if (evolutionRows && evolutionRows.length > 0) {
            evolutions.set(species.num, evolutionRows.map(r => ({
              evolvesToNum: r.national_dex,
              method: r.method,
              conditionValue: r.condition_value
            })));
            hasExistingEvolutions = true;
            cacheHits++;
          }
        }
      } catch (error) {
        // Table may not exist yet on first run, continue with network fetch
      }

      // Skip network fetch if flavor text and evolutions are both cached (legacy fallback)
      if (hasExistingFlavorText && hasExistingEvolutions) {
        return;
      }

      try {
        const response = await withSemaphore(() => fetch(`https://pokeapi.co/api/v2/pokemon-species/${species.num}/`));
        if (!response.ok) {
          console.warn(`[Database] Failed to fetch species ${species.num}: ${response.status}`);
          return;
        }

        const data = await response.json();

        // Only fetch flavor text if not already cached
        if (!hasExistingFlavorText) {
          const flavorTextList = [];
          if (data.flavor_text_entries && Array.isArray(data.flavor_text_entries)) {
            for (const entry of data.flavor_text_entries) {
              if (entry.language?.name === 'en') {
                let text = entry.flavor_text || '';
                text = text.replace(/\f/g, ' ').replace(/\n/g, ' ');
                text = text.replace(/\s+/g, ' ').trim();

                if (text) {
                  flavorTextList.push({
                    gameVersion: entry.version?.name || 'unknown',
                    flavorText: text
                  });
                }
              }
            }
          }

          if (flavorTextList.length > 0) {
            flavorTexts.set(species.num, flavorTextList);
          }
        }

        // Only fetch evolution chain if not already cached
        if (!hasExistingEvolutions && data.evolution_chain?.url) {
          const chainIdMatch = data.evolution_chain.url.match(/\/evolution-chain\/(\d+)\//);
          if (chainIdMatch) {
            const chainId = parseInt(chainIdMatch[1], 10);

            // Guard: check if chain exists, if not set placeholder before fetching
            if (!evolutionChainCache.has(chainId)) {
              evolutionChainCache.set(chainId, null);
              const chainResponse = await withSemaphore(() => fetch(`https://pokeapi.co/api/v2/evolution-chain/${chainId}/`));
              if (!chainResponse.ok) {
                console.warn(`[Database] Failed to fetch evolution chain ${chainId}: ${chainResponse.status}`);
              } else {
                const chainData = await chainResponse.json();
                evolutionChainCache.set(chainId, chainData);
                if (chainData?.chain) {
                  parseEvolutionChain(chainData.chain, evolutions);
                }
              }
            }
          }
        }

        networkFetches++;
        batchHadNetworkFetch = true;

        // Mark species as enriched regardless of whether it has evolutions
        try {
          await db.runAsync(
            `UPDATE pokemon SET species_enriched = 1 WHERE national_dex = ? AND form_type = 'default'`,
            [species.num]
          );
        } catch (err) {
          // non-fatal
        }
      } catch (error) {
        console.warn(`[Database] Error fetching species ${species.num}:`, error);
      }
    }));

    // Rate limit: only sleep if this batch made at least one network request
    if (batchHadNetworkFetch) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Progress log every 10 batches
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(speciesArray.length / BATCH_SIZE);
    if (batchNum % 10 === 0 || batchNum === totalBatches) {
      console.log(`[Database] prefetchPokeApiSpeciesData batch ${batchNum}/${totalBatches} (${cacheHits} cached, ${networkFetches} fetched)`);
    }
  }

  console.log(`[Database] prefetchPokeApiSpeciesData: ${networkFetches} network fetches, ${cacheHits} cache hits`);
  return { flavorTexts, evolutions };
}

function parseEvolutionChain(
  chain: any,
  evolutions: Map<number, Array<{ evolvesToNum: number; method: string; conditionValue: string | null }>>
): void {
  if (!chain.evolves_to) return;

  for (const evolution of chain.evolves_to) {
    const fromNumMatch = chain.species?.url?.match(/\/pokemon-species\/(\d+)\//);
    const toNumMatch = evolution.species?.url?.match(/\/pokemon-species\/(\d+)\//);

    if (!fromNumMatch || !toNumMatch) continue;

    const fromNum = parseInt(fromNumMatch[1], 10);
    const toNum = parseInt(toNumMatch[1], 10);
    const details = evolution.evolution_details?.[0];

    if (!details) continue;

    let method = 'other';
    const trigger = details.trigger?.name;

    if (trigger === 'level-up') {
      method = 'level-up';
    } else if (trigger === 'use-item') {
      method = 'use-item';
    } else if (trigger === 'trade') {
      method = 'trade';
    } else if (trigger === 'shed') {
      method = 'shed';
    }

    let conditionValue: string | null = null;

    if (details.min_level) {
      conditionValue = String(details.min_level);
    } else if (details.item?.name) {
      conditionValue = details.item.name;
    } else if (details.held_item?.name) {
      conditionValue = details.held_item.name;
    } else if (details.known_move?.name) {
      conditionValue = details.known_move.name;
    } else if (details.min_happiness) {
      conditionValue = 'friendship';
    } else if (details.time_of_day === 'day') {
      conditionValue = 'day';
    } else if (details.time_of_day === 'night') {
      conditionValue = 'night';
    }

    if (!evolutions.has(fromNum)) {
      evolutions.set(fromNum, []);
    }
    evolutions.get(fromNum)!.push({
      evolvesToNum: toNum,
      method,
      conditionValue
    });

    parseEvolutionChain(evolution, evolutions);
  }
}

/**
 * Phase 1: Seed pokemon base data (stats, types, abilities).
 * Flavor text and evolutions are handled in Phase 2 enrichment.
 */
async function seedPokemonBaseData(
  db: SQLite.SQLiteDatabase,
  dex: any,
  pokeApiIdCache: Map<string, number>
): Promise<void> {
  console.log('[Database] Seeding pokemon base data...');

  const nameToIdMap = new Map<string, number>();
  let maxExistingId = 0;
  try {
    const existingRows = await db.getAllAsync<{ name: string; id: number }>(
      'SELECT name, id FROM pokemon'
    );
    for (const row of existingRows) {
      nameToIdMap.set(row.name, row.id);
      if (row.id > maxExistingId) maxExistingId = row.id;
    }
  } catch (error) {
    // Table may not exist yet on first run, continue with counter
  }

  const pokemonStmt = await db.prepareAsync(
    `INSERT INTO pokemon
     (id, national_dex, pokeapi_id, name, display_name, form_type, form_name, primary_type, secondary_type,
      hp, attack, defense, special_attack, special_defense, speed,
      height, weight, generation, is_legendary, is_mythical,
      sprite_url, artwork_url, shiny_url, shiny_sprite_url, cosmetic_variants, game_exclusivity, gender_rate, species_classification)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       national_dex = excluded.national_dex,
       pokeapi_id = excluded.pokeapi_id,
       name = excluded.name,
       display_name = excluded.display_name,
       form_type = excluded.form_type,
       form_name = excluded.form_name,
       primary_type = excluded.primary_type,
       secondary_type = excluded.secondary_type,
       hp = excluded.hp,
       attack = excluded.attack,
       defense = excluded.defense,
       special_attack = excluded.special_attack,
       special_defense = excluded.special_defense,
       speed = excluded.speed,
       height = excluded.height,
       weight = excluded.weight,
       generation = excluded.generation,
       is_legendary = excluded.is_legendary,
       is_mythical = excluded.is_mythical,
       game_exclusivity = excluded.game_exclusivity,
       gender_rate = excluded.gender_rate`
  );

  const abilityStmt = await db.prepareAsync(
    `INSERT INTO pokemon_abilities (pokemon_id, ability_id, slot, is_hidden)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(pokemon_id, ability_id) DO UPDATE SET
       slot = excluded.slot,
       is_hidden = excluded.is_hidden`
  );

  let nextNewId = maxExistingId + 1;
  let seededCount = 0;
  const processedSpecies = new Set<string>();

  const speciesData = dex.species.all();
  for (const species of speciesData) {
    const excluded = (species.isNonstandard === 'CAP' || species.isNonstandard === 'Future' || species.isNonstandard === 'Custom')
      && !FUTURE_FORM_ALLOWLIST.has(species.name);
    if (!species.exists || excluded || processedSpecies.has(species.name)) {
      continue;
    }
    if (FORM_EXCLUSION_SET.has(species.name)) {
      continue;
    }
    processedSpecies.add(species.name);

    let insertId: number;
    if (nameToIdMap.has(species.id)) {
      insertId = nameToIdMap.get(species.id)!;
    } else {
      insertId = nextNewId++;
      nameToIdMap.set(species.id, insertId);
    }

    // Determine form type
    const formType = determineFormType(species);
    const formName = species.forme ? species.forme : null;

    // Extract gender rate and classification from dex
    const genderRate = species.genderRatio?.female !== undefined
      ? Math.round((species.genderRatio.female / 100) * 8)
      : (species.gender === null ? -1 : 0);
    const speciesClassification = species.category || null;

    // Derive pokeapi_id:
    // For base forms (formType === 'default'), use national_dex
    // For alternate forms, look up from prefetched cache
    let pokeApiId = species.num;
    if (formType !== 'default') {
      pokeApiId = pokeApiIdCache.get(species.id) ?? species.num;
    }

    // Insert pokemon
    await pokemonStmt.executeAsync([
      insertId,
      species.num,
      pokeApiId,
      species.id,
      species.name,
      formType,
      formName,
      species.types[0],
      species.types[1] || null,
      species.baseStats.hp,
      species.baseStats.atk,
      species.baseStats.def,
      species.baseStats.spa,
      species.baseStats.spd,
      species.baseStats.spe,
      species.heightm ?? null, // height in meters
      species.weightkg,
      species.gen,
      species.tags?.includes('Legendary') ? 1 : 0,
      species.tags?.includes('Mythical') ? 1 : 0,
      null, // sprite_url
      null, // artwork_url
      null, // shiny_url
      null, // shiny_sprite_url
      '[]', // cosmetic_variants
      species.isNonstandard === 'Past' ? 'past-gen' :
      species.isNonstandard === 'LGPE' ? 'lgpe' : null,
      genderRate,
      speciesClassification
    ]);

    seededCount++;

    // Insert abilities
    if (species.abilities) {
      let slot = 1;
      if (species.abilities['0']) {
        const abilityId = await getAbilityId(db, species.abilities['0']);
        if (abilityId) {
          await abilityStmt.executeAsync([insertId, abilityId, slot++, 0]);
        }
      }
      if (species.abilities['1']) {
        const abilityId = await getAbilityId(db, species.abilities['1']);
        if (abilityId) {
          await abilityStmt.executeAsync([insertId, abilityId, slot++, 0]);
        }
      }
      if (species.abilities.H) {
        const abilityId = await getAbilityId(db, species.abilities.H);
        if (abilityId) {
          await abilityStmt.executeAsync([insertId, abilityId, slot, 1]);
        }
      }
    }
  }

  await pokemonStmt.finalizeAsync();
  await abilityStmt.finalizeAsync();
  console.log(`[Database] Seeded ${seededCount} pokemon base data with abilities`);
}

async function getAbilityId(db: SQLite.SQLiteDatabase, abilityName: string): Promise<number | null> {
  try {
    const result = await db.getFirstAsync<{ id: number }>(
      'SELECT id FROM abilities WHERE display_name = ?',
      [abilityName]
    );
    return result?.id || null;
  } catch {
    return null;
  }
}

/**
 * Fetch the PokeAPI ID for an alternate form from PokeAPI
 * Falls back to nationalDex if fetch fails
 */
async function fetchPokeApiId(speciesId: string, nationalDex: number): Promise<number> {
  try {
    const response = await withSemaphore(() => fetch(`https://pokeapi.co/api/v2/pokemon/${speciesId}`));
    if (!response.ok) {
      console.debug(`[Database] Failed to fetch PokeAPI ID for ${speciesId}: ${response.status}`);
      return nationalDex;
    }
    const data = await response.json();
    const pokeApiId = data?.id;
    if (typeof pokeApiId === 'number') {
      console.debug(`[Database] PokeAPI ID for ${speciesId}: ${pokeApiId}`);
      return pokeApiId;
    }
    return nationalDex;
  } catch (error) {
    console.debug(`[Database] Failed to fetch PokeAPI ID for ${speciesId}:`, error);
    return nationalDex;
  }
}

function determineFormType(species: any): FormType {
  // Use species.name instead of species.id because @pkmn/dex returns IDs without hyphens.
  // For example: species.id = 'venusaurmega', but species.name = 'Venusaur-Mega'
  const name = species.name.toLowerCase();

  // Check for regional forms
  if (name.includes('-alola') || name.includes('-galar') || name.includes('-hisui') || name.includes('-paldea')) {
    return 'regional';
  }

  // Check for mega
  if (name.includes('-mega')) {
    return 'mega';
  }

  // Check for gigantamax
  if (name.includes('-gmax')) {
    return 'gigantamax';
  }

  // Check for cosmetic variants (gender differences)
  if (name.endsWith('-f') || name.endsWith('-m')) {
    return 'cosmetic';
  }

  // If the species has a named forme that didn't match any of the above patterns,
  // it's still an alternate form — fetch its PokeAPI ID.
  if (species.forme) {
    return 'alternate';
  }

  return 'default';
}

function mapItemCategory(itemId: string, item: any): string {
  const id = itemId.toLowerCase();

  if (item.isPokeball) return 'pokeball';
  if (item.isBerry) return 'berry';
  if (id.includes('medicine') || id.includes('antidote') || id.includes('full') || id.includes('super') || id.includes('hyper')) return 'medicine';
  if (id.includes('hold') || id.includes('assault') || id.includes('choic') || id.includes('scarf') || id.includes('band')) return 'held';
  if (id.includes('orb') || id.includes('primal')) return 'held';
  if (id.includes('tm') || id.includes('hm') || id.includes('tutor')) return 'battle';
  if (id.includes('key') || id.includes('badge') || id.includes('pass') || id.includes('ticket') || id.includes('pokedex')) return 'key';

  return 'other';
}

