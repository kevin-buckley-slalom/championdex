import * as SQLite from 'expo-sqlite';
import { seedDatabase } from './seedDatabase';
import { copyBundledDbIfNeeded } from './bundledDbService';

async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  // Each migration uses ALTER TABLE ... ADD COLUMN IF NOT EXISTS pattern.
  // SQLite doesn't support IF NOT EXISTS on ALTER TABLE, so we check the
  // column list first and skip if already present.
  const columns = await db.getAllAsync<{ name: string }>(
    `PRAGMA table_info(pokemon)`
  );
  const colNames = new Set(columns.map(c => c.name));

  if (!colNames.has('game_exclusivity')) {
    await db.execAsync(`ALTER TABLE pokemon ADD COLUMN game_exclusivity TEXT`);
  }

  if (!colNames.has('gender_rate')) {
    await db.execAsync(`ALTER TABLE pokemon ADD COLUMN gender_rate INTEGER DEFAULT -1`);
  }

  if (!colNames.has('species_classification')) {
    await db.execAsync(`ALTER TABLE pokemon ADD COLUMN species_classification TEXT`);
  }

  if (!colNames.has('pokeapi_id')) {
    await db.execAsync(`ALTER TABLE pokemon ADD COLUMN pokeapi_id INTEGER NOT NULL DEFAULT 0`);
  }

  if (!colNames.has('species_enriched')) {
    await db.execAsync(`ALTER TABLE pokemon ADD COLUMN species_enriched INTEGER NOT NULL DEFAULT 0`);
    await db.execAsync(`CREATE INDEX IF NOT EXISTS idx_pokemon_species_enriched ON pokemon(species_enriched)`);
  }

  // Backfill species_enriched for existing installs — runs once, gated by sync_metadata key.
  // The column addition and this backfill are intentionally separate: the column may have been
  // added on a prior launch (so the IF block above is skipped) but the backfill never ran.
  const enrichedBackfillDone = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM sync_metadata WHERE key = 'species_enriched_backfill_v1'`
  );
  if (!enrichedBackfillDone) {
    await db.execAsync(`
      UPDATE pokemon
      SET species_enriched = 1
      WHERE form_type = 'default'
        AND EXISTS (
          SELECT 1 FROM pokemon_flavor_text ft WHERE ft.pokemon_id = pokemon.id
        )
    `);
    await db.runAsync(
      `INSERT OR REPLACE INTO sync_metadata (key, value, updated_at) VALUES ('species_enriched_backfill_v1', 'done', datetime('now'))`
    );
  }

  // Migration: Switch from PokeAPI movesets to @pkmn/dex learnsets (runs once)
  // Wipes old PokeAPI-sourced moves and re-populates from dex in the seeding phase
  const movesDexMigrationDone = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM sync_metadata WHERE key = 'moves_dex_migration_v1'`
  );
  if (!movesDexMigrationDone) {
    // Remove the old network-based backfill key
    await db.runAsync(`DELETE FROM sync_metadata WHERE key = 'moves_backfill_v1'`);
    // Wipe stale PokeAPI-sourced move data
    await db.runAsync(`DELETE FROM pokemon_moves`);
    // Mark this migration as complete
    await db.runAsync(
      `INSERT OR REPLACE INTO sync_metadata (key, value, updated_at) VALUES ('moves_dex_migration_v1', 'done', datetime('now'))`
    );
  }

  // Create pokemon_evolutions table if it doesn't exist
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS pokemon_evolutions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pokemon_id INTEGER NOT NULL,
      evolves_to_id INTEGER NOT NULL,
      method TEXT NOT NULL,
      condition_value TEXT,
      FOREIGN KEY (pokemon_id) REFERENCES pokemon(id),
      FOREIGN KEY (evolves_to_id) REFERENCES pokemon(id),
      UNIQUE(pokemon_id, evolves_to_id)
    );
    CREATE INDEX IF NOT EXISTS idx_evolutions_pokemon ON pokemon_evolutions(pokemon_id);
  `);

  // Migration: add unique constraint to pokemon_evolutions if missing
  // SQLite can't ALTER a constraint, so we recreate the table if the constraint is absent
  const evoTableInfo = await db.getFirstAsync<{ sql: string }>(
    `SELECT sql FROM sqlite_master WHERE type='table' AND name='pokemon_evolutions'`
  );
  if (evoTableInfo && !evoTableInfo.sql.includes('UNIQUE')) {
    await db.execAsync(`
      CREATE TABLE pokemon_evolutions_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pokemon_id INTEGER NOT NULL,
        evolves_to_id INTEGER NOT NULL,
        method TEXT NOT NULL,
        condition_value TEXT,
        FOREIGN KEY (pokemon_id) REFERENCES pokemon(id),
        FOREIGN KEY (evolves_to_id) REFERENCES pokemon(id),
        UNIQUE(pokemon_id, evolves_to_id)
      );
      INSERT OR IGNORE INTO pokemon_evolutions_new (id, pokemon_id, evolves_to_id, method, condition_value)
        SELECT id, pokemon_id, evolves_to_id, method, condition_value FROM pokemon_evolutions;
      DROP TABLE pokemon_evolutions;
      ALTER TABLE pokemon_evolutions_new RENAME TO pokemon_evolutions;
      CREATE INDEX IF NOT EXISTS idx_evolutions_pokemon ON pokemon_evolutions(pokemon_id);
    `);
  }

  // Create pokemon_flavor_text table if it doesn't exist
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS pokemon_flavor_text (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pokemon_id INTEGER NOT NULL,
      game_version TEXT NOT NULL,
      flavor_text TEXT NOT NULL,
      FOREIGN KEY (pokemon_id) REFERENCES pokemon(id),
      UNIQUE(pokemon_id, game_version)
    );
    CREATE INDEX IF NOT EXISTS idx_flavor_text_pokemon ON pokemon_flavor_text(pokemon_id);
  `);

  // Create pokemon_encounter_locations table if it doesn't exist
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS pokemon_encounter_locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pokemon_id INTEGER NOT NULL REFERENCES pokemon(id),
      game_version TEXT NOT NULL,
      location_name TEXT NOT NULL,
      location_area_slug TEXT NOT NULL,
      encounter_method TEXT NOT NULL,
      encounter_chance INTEGER NOT NULL,
      min_level INTEGER,
      max_level INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_encounter_pokemon_game ON pokemon_encounter_locations(pokemon_id, game_version);
  `);

  // One-time cleanup: remove forms that were pruned from FORM_EXCLUSION_SET in DATA_VERSION 1.9.0
  // These are cosmetic/event-only forms that should not appear as separate DB entries.
  // Safe to run repeatedly — deletes nothing if rows don't exist.
  const PRUNED_FORM_NAMES = [
    // Regional bucket exclusions
    'Raticate-Alola-Totem', 'Marowak-Alola-Totem', 'Pikachu-Alola',
    // Totem forms
    'Gumshoos-Totem', 'Vikavolt-Totem', 'Ribombee-Totem', 'Araquanid-Totem',
    'Lurantis-Totem', 'Salazzle-Totem', 'Togedemaru-Totem', 'Kommo-o-Totem',
    'Mimikyu-Totem', 'Mimikyu-Busted-Totem',
    // Pikachu event/cap forms
    'Pikachu-Cosplay', 'Pikachu-Rock-Star', 'Pikachu-Belle', 'Pikachu-Pop-Star',
    'Pikachu-PhD', 'Pikachu-Libre', 'Pikachu-Original', 'Pikachu-Hoenn',
    'Pikachu-Sinnoh', 'Pikachu-Unova', 'Pikachu-Kalos', 'Pikachu-Partner',
    'Pikachu-World', 'Pikachu-Starter', 'Eevee-Starter',
    // Cosmetic alternates
    'Vivillon-Icy Snow', 'Vivillon-Polar', 'Vivillon-Tundra', 'Vivillon-Continental',
    'Vivillon-Garden', 'Vivillon-Elegant', 'Vivillon-Modern', 'Vivillon-Marine',
    'Vivillon-Archipelago', 'Vivillon-High Plains', 'Vivillon-Sandstorm',
    'Vivillon-River', 'Vivillon-Monsoon', 'Vivillon-Savanna', 'Vivillon-Sun',
    'Vivillon-Ocean', 'Vivillon-Jungle', 'Vivillon-Fancy', 'Vivillon-Pokeball',
    'Alcremie-Ruby-Cream', 'Alcremie-Matcha-Cream', 'Alcremie-Mint-Cream',
    'Alcremie-Lemon-Cream', 'Alcremie-Ruby-Swirl', 'Alcremie-Caramel-Swirl',
    'Alcremie-Rainbow-Swirl',
    'Minior-Orange', 'Minior-Yellow', 'Minior-Green', 'Minior-Blue',
    'Minior-Indigo', 'Minior-Violet', 'Minior-Meteor',
    'Deerling-Summer', 'Deerling-Autumn', 'Deerling-Winter',
    'Shellos-East', 'Gastrodon-East',
    'Cramorant-Gulping', 'Cramorant-Gorging',
    'Pichu-Spiky-eared', 'Cherrim-Sunshine', 'Magearna-Original', 'Zarude-Dada',
    'Squawkabilly-Blue', 'Squawkabilly-Yellow', 'Squawkabilly-White',
    'Poltchageist-Artisan', 'Sinistcha-Masterpiece', 'Sinistea-Antique', 'Polteageist-Antique',
    // Type-variant alternates
    'Arceus-Bug', 'Arceus-Dark', 'Arceus-Dragon', 'Arceus-Electric', 'Arceus-Fairy',
    'Arceus-Fighting', 'Arceus-Fire', 'Arceus-Flying', 'Arceus-Ghost', 'Arceus-Grass',
    'Arceus-Ground', 'Arceus-Ice', 'Arceus-Poison', 'Arceus-Psychic', 'Arceus-Rock',
    'Arceus-Steel', 'Arceus-Water',
    'Silvally-Bug', 'Silvally-Dark', 'Silvally-Dragon', 'Silvally-Electric', 'Silvally-Fairy',
    'Silvally-Fighting', 'Silvally-Fire', 'Silvally-Flying', 'Silvally-Ghost', 'Silvally-Grass',
    'Silvally-Ground', 'Silvally-Ice', 'Silvally-Poison', 'Silvally-Psychic', 'Silvally-Rock',
    'Silvally-Steel', 'Silvally-Water',
    'Genesect-Douse', 'Genesect-Shock', 'Genesect-Burn', 'Genesect-Chill',
    'Castform-Sunny', 'Castform-Rainy', 'Castform-Snowy',
  ];

  // Temporarily disable FK checks so we can delete pruned pokemon rows
  // without needing to manually clean up pokemon_evolutions/pokemon_abilities first.
  await db.runAsync(`PRAGMA foreign_keys = OFF`);
  try {
    const BATCH_SIZE = 90;
    for (let i = 0; i < PRUNED_FORM_NAMES.length; i += BATCH_SIZE) {
      const batch = PRUNED_FORM_NAMES.slice(i, i + BATCH_SIZE);
      const placeholders = batch.map(() => '?').join(', ');
      await db.runAsync(
        `DELETE FROM pokemon WHERE display_name IN (${placeholders})`,
        batch
      );
    }
  } finally {
    await db.runAsync(`PRAGMA foreign_keys = ON`);
  }
}

let db: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<void> | null = null;
let phase1Promise: Promise<void> | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('championdex.db');
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync('PRAGMA foreign_keys = ON;');
  return db;
}

/**
 * Phase A (blocking): Opens DB, creates base schema, checks seed version gate.
 * This must complete before the app renders — the query layer depends on tables existing.
 * Phase B (migrations + enrichment) runs fire-and-forget after this returns.
 */
export async function initializeDatabasePhase1(): Promise<void> {
  if (phase1Promise) return phase1Promise;
  phase1Promise = _initializeDatabasePhase1();
  try {
    await phase1Promise;
  } finally {
    phase1Promise = null;
  }
}

async function _initializeDatabasePhase1(): Promise<void> {
  const t0 = Date.now();
  await copyBundledDbIfNeeded();
  console.log(`[Database] [timing] copyBundledDbIfNeeded: ${Date.now() - t0}ms`);

  const t1 = Date.now();
  const database = await getDatabase();
  console.log(`[Database] [timing] getDatabase: ${Date.now() - t1}ms`);

  // Fast path: if data_version is already current, all tables and data exist — nothing to do.
  const t2 = Date.now();
  try {
    const result = await database.getFirstAsync<{ value: string }>(
      'SELECT value FROM sync_metadata WHERE key = ?',
      ['data_version']
    );
    console.log(`[Database] [timing] version check: ${Date.now() - t2}ms`);
    if (result?.value) {
      console.log(`[Database] [timing] Phase 1 total (fast path): ${Date.now() - t0}ms`);
      console.log('[Database] Base data already seeded, skipping schema creation');
      return;
    }
  } catch (error) {
    // sync_metadata doesn't exist yet — first run, fall through to schema creation
  }

  // First run only: create all tables
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS pokemon (
      id                INTEGER PRIMARY KEY,
      national_dex      INTEGER NOT NULL,
      pokeapi_id        INTEGER NOT NULL DEFAULT 0,
      name              TEXT NOT NULL UNIQUE,
      display_name      TEXT NOT NULL,
      form_type         TEXT NOT NULL DEFAULT 'default',
      form_name         TEXT,
      primary_type      TEXT NOT NULL,
      secondary_type    TEXT,
      hp                INTEGER NOT NULL DEFAULT 0,
      attack            INTEGER NOT NULL DEFAULT 0,
      defense           INTEGER NOT NULL DEFAULT 0,
      special_attack    INTEGER NOT NULL DEFAULT 0,
      special_defense   INTEGER NOT NULL DEFAULT 0,
      speed             INTEGER NOT NULL DEFAULT 0,
      height            REAL,
      weight            REAL,
      generation        INTEGER NOT NULL,
      is_legendary      INTEGER NOT NULL DEFAULT 0,
      is_mythical       INTEGER NOT NULL DEFAULT 0,
      sprite_url        TEXT,
      artwork_url       TEXT,
      shiny_url         TEXT,
      shiny_sprite_url  TEXT,
      cosmetic_variants TEXT DEFAULT '[]',
      game_exclusivity  TEXT,
      created_at        TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS abilities (
      id                INTEGER PRIMARY KEY,
      name              TEXT NOT NULL UNIQUE,
      display_name      TEXT NOT NULL,
      description       TEXT,
      short_description TEXT,
      generation        INTEGER NOT NULL,
      created_at        TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS moves (
      id                INTEGER PRIMARY KEY,
      name              TEXT NOT NULL UNIQUE,
      display_name      TEXT NOT NULL,
      type              TEXT NOT NULL,
      category          TEXT NOT NULL,
      power             INTEGER,
      accuracy          INTEGER,
      pp                INTEGER NOT NULL DEFAULT 0,
      priority          INTEGER NOT NULL DEFAULT 0,
      description       TEXT,
      short_description TEXT,
      generation        INTEGER NOT NULL,
      makes_contact     INTEGER NOT NULL DEFAULT 0,
      created_at        TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS items (
      id                INTEGER PRIMARY KEY,
      name              TEXT NOT NULL UNIQUE,
      display_name      TEXT NOT NULL,
      category          TEXT NOT NULL DEFAULT 'other',
      description       TEXT,
      short_description TEXT,
      sprite_url        TEXT,
      cost              INTEGER,
      created_at        TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS pokemon_abilities (
      pokemon_id  INTEGER NOT NULL REFERENCES pokemon(id) ON DELETE CASCADE,
      ability_id  INTEGER NOT NULL REFERENCES abilities(id) ON DELETE CASCADE,
      slot        INTEGER NOT NULL,
      is_hidden   INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (pokemon_id, ability_id)
    );

    CREATE TABLE IF NOT EXISTS pokemon_moves (
      pokemon_id    INTEGER NOT NULL REFERENCES pokemon(id) ON DELETE CASCADE,
      move_id       INTEGER NOT NULL REFERENCES moves(id) ON DELETE CASCADE,
      learn_method  TEXT NOT NULL,
      learn_level   INTEGER,
      PRIMARY KEY (pokemon_id, move_id, learn_method)
    );

    CREATE TABLE IF NOT EXISTS teams (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL DEFAULT 'My Team',
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS team_members (
      id              TEXT PRIMARY KEY,
      team_id         TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
      slot            INTEGER NOT NULL CHECK (slot BETWEEN 1 AND 6),
      pokemon_id      INTEGER NOT NULL REFERENCES pokemon(id),
      nickname        TEXT,
      ability_id      INTEGER REFERENCES abilities(id),
      held_item_id    INTEGER REFERENCES items(id),
      move_1_id       INTEGER REFERENCES moves(id),
      move_2_id       INTEGER REFERENCES moves(id),
      move_3_id       INTEGER REFERENCES moves(id),
      move_4_id       INTEGER REFERENCES moves(id),
      ev_hp           INTEGER NOT NULL DEFAULT 0,
      ev_attack       INTEGER NOT NULL DEFAULT 0,
      ev_defense      INTEGER NOT NULL DEFAULT 0,
      ev_sp_attack    INTEGER NOT NULL DEFAULT 0,
      ev_sp_defense   INTEGER NOT NULL DEFAULT 0,
      ev_speed        INTEGER NOT NULL DEFAULT 0,
      iv_hp           INTEGER NOT NULL DEFAULT 31,
      iv_attack       INTEGER NOT NULL DEFAULT 31,
      iv_defense      INTEGER NOT NULL DEFAULT 31,
      iv_sp_attack    INTEGER NOT NULL DEFAULT 31,
      iv_sp_defense   INTEGER NOT NULL DEFAULT 31,
      iv_speed        INTEGER NOT NULL DEFAULT 31,
      stat_level      INTEGER NOT NULL DEFAULT 50 CHECK (stat_level IN (50, 100)),
      nature          TEXT,
      UNIQUE (team_id, slot)
    );

    CREATE TABLE IF NOT EXISTS sync_metadata (
      key         TEXT PRIMARY KEY,
      value       TEXT NOT NULL,
      updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS pokemon_flavor_text (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pokemon_id INTEGER NOT NULL,
      game_version TEXT NOT NULL,
      flavor_text TEXT NOT NULL,
      FOREIGN KEY (pokemon_id) REFERENCES pokemon(id),
      UNIQUE(pokemon_id, game_version)
    );

    CREATE TABLE IF NOT EXISTS pokemon_evolutions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pokemon_id INTEGER NOT NULL,
      evolves_to_id INTEGER NOT NULL,
      method TEXT NOT NULL,
      condition_value TEXT,
      FOREIGN KEY (pokemon_id) REFERENCES pokemon(id),
      FOREIGN KEY (evolves_to_id) REFERENCES pokemon(id),
      UNIQUE(pokemon_id, evolves_to_id)
    );

    CREATE TABLE IF NOT EXISTS pokemon_encounter_locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pokemon_id INTEGER NOT NULL REFERENCES pokemon(id),
      game_version TEXT NOT NULL,
      location_name TEXT NOT NULL,
      location_area_slug TEXT NOT NULL,
      encounter_method TEXT NOT NULL,
      encounter_chance INTEGER NOT NULL,
      min_level INTEGER,
      max_level INTEGER
    );

    CREATE INDEX IF NOT EXISTS idx_pokemon_national_dex ON pokemon(national_dex);
    CREATE INDEX IF NOT EXISTS idx_pokemon_primary_type ON pokemon(primary_type);
    CREATE INDEX IF NOT EXISTS idx_pokemon_generation ON pokemon(generation);
    CREATE INDEX IF NOT EXISTS idx_pokemon_form_type ON pokemon(form_type);
    CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
    CREATE INDEX IF NOT EXISTS idx_encounter_pokemon_game ON pokemon_encounter_locations(pokemon_id, game_version);
  `);

  // First run: seed base data (blocking)
  console.log('[Database] Seeding base data...');
  const { seedDatabase } = require('./seedDatabase');
  await seedDatabase(database);
}

/**
 * Backwards compatibility: initializeDatabase now calls Phase 1 and Phase 2
 * (Phase 2 is fire-and-forget within seedDatabase)
 */
export async function initializeDatabase(): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = _initializeDatabase();
  try {
    await initPromise;
  } finally {
    initPromise = null;
  }
}

async function _initializeDatabase(): Promise<void> {
  // Phase 1: blocking schema + base seed
  await initializeDatabasePhase1();
  const database = await getDatabase();

  // Phase 2: migrations (fire-and-forget)
  // seedDatabase already kicks off enrichment internally via startPokeApiEnrichment
  _initializeDatabasePhase2(database).catch((error) => {
    console.warn('[Database] Phase 2 error:', error);
  });
}

async function _initializeDatabasePhase2(database: SQLite.SQLiteDatabase): Promise<void> {
  // Migrations — safe to run on existing databases (each is idempotent)
  await runMigrations(database);
}
