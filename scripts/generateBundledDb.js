#!/usr/bin/env node

/**
 * Generate a pre-built SQLite database bundled with the ChampionDex app.
 * Run: node scripts/generateBundledDb.js
 * Output: assets/db/championdex.db
 * Takes ~2-3 minutes on first run (PokeAPI fetches), then done.
 * Commit the resulting .db file to git.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, '../assets/db/championdex.db');
const DATA_VERSION = '1.12.0';
const ENRICH_VERSION = '1.2.0';

// ── Semaphore (10 concurrent PokeAPI requests) ─────────────────────────────
let available = 10;
const queue = [];
function acquireSemaphore() {
  if (available > 0) { available--; return Promise.resolve(); }
  return new Promise(resolve => queue.push(resolve));
}
function releaseSemaphore() {
  if (queue.length > 0) { queue.shift()(); } else { available++; }
}
async function withSemaphore(fn) {
  await acquireSemaphore();
  try { return await fn(); } finally { releaseSemaphore(); }
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── PokeAPI helpers ────────────────────────────────────────────────────────
async function pokeApiFetch(url) {
  const res = await withSemaphore(() => fetch(url));
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

// ── Slug generation (matches seedDatabase.ts generatePokeApiSlug) ──────────
function generatePokeApiSlug(speciesName, forme = '') {
  let slug = speciesName.toLowerCase()
    .replace(/ /g, '-')
    .replace(/[''.]/g, '');

  if (forme === 'F') slug = slug.replace(/-f$/, '-female');
  else if (forme === 'M') slug = slug.replace(/-m$/, '-male');

  const totemMatch = slug.match(/^(.+?)-(alola|galar|hisui|paldea)-totem$/);
  if (totemMatch) slug = `${totemMatch[1]}-totem-${totemMatch[2]}`;

  if (slug.match(/^tauros-paldea-(combat|blaze|aqua)$/)) slug = `${slug}-breed`;
  if (slug === 'darmanitan-galar') slug = 'darmanitan-galar-standard';
  if (slug === 'toxtricity-gmax') slug = 'toxtricity-amped-gmax';
  if (slug === 'urshifu-gmax') slug = 'urshifu-single-strike-gmax';
  if (slug === 'zygarde-10%') slug = 'zygarde-10';

  return slug;
}

// ── Form type determination (matches seedDatabase.ts determineFormType) ────
function determineFormType(species) {
  const name = species.name.toLowerCase();
  if (name.includes('-alola') || name.includes('-galar') || name.includes('-hisui') || name.includes('-paldea')) return 'regional';
  if (name.includes('-mega')) return 'mega';
  if (name.includes('-gmax')) return 'gigantamax';
  if (name.endsWith('-f') || name.endsWith('-m')) return 'cosmetic';
  if (species.forme) return 'alternate';
  return 'default';
}

// ── Evolution chain parser (matches seedDatabase.ts parseEvolutionChain) ───
function parseEvolutionChain(chain, evolutions) {
  if (!chain.evolves_to) return;
  for (const evolution of chain.evolves_to) {
    const fromNumMatch = chain.species?.url?.match(/\/pokemon-species\/(\d+)\//);
    const toNumMatch = evolution.species?.url?.match(/\/pokemon-species\/(\d+)\//);
    if (!fromNumMatch || !toNumMatch) continue;

    const fromNum = parseInt(fromNumMatch[1], 10);
    const toNum = parseInt(toNumMatch[1], 10);
    const details = evolution.evolution_details?.[0];
    if (!details) continue;

    const trigger = details.trigger?.name;
    let method = 'other';
    if (trigger === 'level-up') method = 'level-up';
    else if (trigger === 'use-item') method = 'use-item';
    else if (trigger === 'trade') method = 'trade';
    else if (trigger === 'shed') method = 'shed';

    let conditionValue = null;
    if (details.min_level) conditionValue = String(details.min_level);
    else if (details.item?.name) conditionValue = details.item.name;
    else if (details.held_item?.name) conditionValue = details.held_item.name;
    else if (details.known_move?.name) conditionValue = details.known_move.name;
    else if (details.min_happiness) conditionValue = 'friendship';
    else if (details.time_of_day === 'day') conditionValue = 'day';
    else if (details.time_of_day === 'night') conditionValue = 'night';

    if (!evolutions.has(fromNum)) evolutions.set(fromNum, []);
    evolutions.get(fromNum).push({ evolvesToNum: toNum, method, conditionValue });

    parseEvolutionChain(evolution, evolutions);
  }
}

// ── Constants (must match seedDatabase.ts exactly) ─────────────────────────
const FUTURE_FORM_ALLOWLIST = new Set([
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

const FORM_EXCLUSION_SET = new Set([
  'Raticate-Alola-Totem', 'Marowak-Alola-Totem', 'Pikachu-Alola',
  'Gumshoos-Totem', 'Vikavolt-Totem', 'Ribombee-Totem', 'Araquanid-Totem',
  'Lurantis-Totem', 'Salazzle-Totem', 'Togedemaru-Totem', 'Kommo-o-Totem',
  'Mimikyu-Totem', 'Mimikyu-Busted-Totem',
  'Pikachu-Cosplay', 'Pikachu-Rock-Star', 'Pikachu-Belle', 'Pikachu-Pop-Star',
  'Pikachu-PhD', 'Pikachu-Libre', 'Pikachu-Original', 'Pikachu-Hoenn',
  'Pikachu-Sinnoh', 'Pikachu-Unova', 'Pikachu-Kalos', 'Pikachu-Partner',
  'Pikachu-World', 'Pikachu-Starter', 'Eevee-Starter',
  'Vivillon-Icy Snow', 'Vivillon-Polar', 'Vivillon-Tundra', 'Vivillon-Continental',
  'Vivillon-Garden', 'Vivillon-Elegant', 'Vivillon-Modern', 'Vivillon-Marine',
  'Vivillon-Archipelago', 'Vivillon-High Plains', 'Vivillon-Sandstorm',
  'Vivillon-River', 'Vivillon-Monsoon', 'Vivillon-Savanna', 'Vivillon-Sun',
  'Vivillon-Ocean', 'Vivillon-Jungle', 'Vivillon-Fancy', 'Vivillon-Pokeball',
  'Alcremie-Ruby-Cream', 'Alcremie-Matcha-Cream', 'Alcremie-Mint-Cream',
  'Alcremie-Lemon-Cream', 'Alcremie-Ruby-Swirl', 'Alcremie-Caramel-Swirl',
  'Alcremie-Rainbow-Swirl', 'Minior-Orange', 'Minior-Yellow', 'Minior-Green',
  'Minior-Blue', 'Minior-Indigo', 'Minior-Violet', 'Minior-Meteor',
  'Deerling-Summer', 'Deerling-Autumn', 'Deerling-Winter',
  'Shellos-East', 'Gastrodon-East', 'Cramorant-Gulping', 'Cramorant-Gorging',
  'Pichu-Spiky-eared', 'Cherrim-Sunshine', 'Magearna-Original', 'Zarude-Dada',
  'Squawkabilly-Blue', 'Squawkabilly-Yellow', 'Squawkabilly-White',
  'Poltchageist-Artisan', 'Sinistcha-Masterpiece', 'Sinistea-Antique', 'Polteageist-Antique',
  'Arceus-Bug', 'Arceus-Dark', 'Arceus-Dragon', 'Arceus-Electric', 'Arceus-Fairy',
  'Arceus-Fighting', 'Arceus-Fire', 'Arceus-Flying', 'Arceus-Ghost', 'Arceus-Grass',
  'Arceus-Ground', 'Arceus-Ice', 'Arceus-Poison', 'Arceus-Psychic', 'Arceus-Rock',
  'Arceus-Steel', 'Arceus-Water', 'Silvally-Bug', 'Silvally-Dark', 'Silvally-Dragon',
  'Silvally-Electric', 'Silvally-Fairy', 'Silvally-Fighting', 'Silvally-Fire', 'Silvally-Flying',
  'Silvally-Ghost', 'Silvally-Grass', 'Silvally-Ground', 'Silvally-Ice', 'Silvally-Poison',
  'Silvally-Psychic', 'Silvally-Rock', 'Silvally-Steel', 'Silvally-Water',
  'Genesect-Douse', 'Genesect-Shock', 'Genesect-Burn', 'Genesect-Chill',
  'Castform-Sunny', 'Castform-Rainy', 'Castform-Snowy',
]);

// Slugs that PokeAPI doesn't have valid form endpoints for
const POKEAPI_SLUG_EXCLUSION_SET = new Set([
  'nidoran-f', 'nidoran-m', 'mr-mime', 'mr-rime', 'mime-jr',
  'type-null', 'jangmo-o', 'hakamo-o', 'kommo-o', 'tapu-koko',
  'tapu-lele', 'tapu-bulu', 'tapu-fini', 'wo-chien', 'chien-pao',
  'ting-lu', 'chi-yu', 'great-tusk', 'scream-tail', 'brute-bonnet',
  'flutter-mane', 'slither-wing', 'sandy-shocks', 'iron-treads',
  'iron-bundle', 'iron-hands', 'iron-jugulis', 'iron-moth',
  'iron-thorns', 'roaring-moon', 'iron-valiant', 'koraidon',
  'miraidon', 'walking-wake', 'iron-leaves', 'gouging-fire',
  'raging-bolt', 'iron-boulder', 'iron-crown',
]);

async function main() {
  console.log('[GenerateBundledDb] Starting...');

  const dbDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
  if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH);

  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // ── Schema ───────────────────────────────────────────────────────────────
  console.log('[GenerateBundledDb] Creating schema...');
  db.exec(`
    CREATE TABLE pokemon (
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
      gender_rate       INTEGER DEFAULT -1,
      species_classification TEXT,
      species_enriched  INTEGER NOT NULL DEFAULT 0,
      created_at        TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE abilities (
      id                INTEGER PRIMARY KEY,
      name              TEXT NOT NULL UNIQUE,
      display_name      TEXT NOT NULL,
      description       TEXT,
      short_description TEXT,
      generation        INTEGER NOT NULL,
      created_at        TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE moves (
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
    CREATE TABLE items (
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
    CREATE TABLE pokemon_abilities (
      pokemon_id  INTEGER NOT NULL REFERENCES pokemon(id) ON DELETE CASCADE,
      ability_id  INTEGER NOT NULL REFERENCES abilities(id) ON DELETE CASCADE,
      slot        INTEGER NOT NULL,
      is_hidden   INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (pokemon_id, ability_id)
    );
    CREATE TABLE pokemon_moves (
      pokemon_id    INTEGER NOT NULL REFERENCES pokemon(id) ON DELETE CASCADE,
      move_id       INTEGER NOT NULL REFERENCES moves(id) ON DELETE CASCADE,
      learn_method  TEXT NOT NULL,
      learn_level   INTEGER,
      learn_label   TEXT,
      version_group TEXT NOT NULL DEFAULT '',
      PRIMARY KEY (pokemon_id, move_id, learn_method, version_group)
    );
    CREATE TABLE teams (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL DEFAULT 'My Team',
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE team_members (
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
    CREATE TABLE sync_metadata (
      key         TEXT PRIMARY KEY,
      value       TEXT NOT NULL,
      updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE pokemon_flavor_text (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pokemon_id INTEGER NOT NULL,
      game_version TEXT NOT NULL,
      flavor_text TEXT NOT NULL,
      FOREIGN KEY (pokemon_id) REFERENCES pokemon(id),
      UNIQUE(pokemon_id, game_version)
    );
    CREATE TABLE pokemon_evolutions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pokemon_id INTEGER NOT NULL,
      evolves_to_id INTEGER NOT NULL,
      method TEXT NOT NULL,
      condition_value TEXT,
      FOREIGN KEY (pokemon_id) REFERENCES pokemon(id),
      FOREIGN KEY (evolves_to_id) REFERENCES pokemon(id),
      UNIQUE(pokemon_id, evolves_to_id)
    );
    CREATE TABLE pokemon_encounter_locations (
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
    CREATE INDEX idx_pokemon_national_dex ON pokemon(national_dex);
    CREATE INDEX idx_pokemon_primary_type ON pokemon(primary_type);
    CREATE INDEX idx_pokemon_generation ON pokemon(generation);
    CREATE INDEX idx_pokemon_form_type ON pokemon(form_type);
    CREATE INDEX idx_pokemon_species_enriched ON pokemon(species_enriched);
    CREATE INDEX idx_team_members_team_id ON team_members(team_id);
    CREATE INDEX idx_encounter_pokemon_game ON pokemon_encounter_locations(pokemon_id, game_version);
    CREATE INDEX idx_flavor_text_pokemon ON pokemon_flavor_text(pokemon_id);
    CREATE INDEX idx_evolutions_pokemon ON pokemon_evolutions(pokemon_id);
  `);

  // ── Load dex ─────────────────────────────────────────────────────────────
  console.log('[GenerateBundledDb] Loading @pkmn/dex...');
  const { Dex } = require('@pkmn/dex');

  // ── Abilities ─────────────────────────────────────────────────────────────
  console.log('[GenerateBundledDb] Seeding abilities...');
  const abilityStmt = db.prepare(`
    INSERT INTO abilities (id, name, display_name, description, short_description, generation)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET name=excluded.name, display_name=excluded.display_name,
      description=excluded.description, short_description=excluded.short_description, generation=excluded.generation
  `);
  const insertAbilities = db.transaction(() => {
    for (const a of Dex.abilities.all()) {
      if (a.isNonstandard || a.num <= 0) continue;
      abilityStmt.run(a.num, a.id, a.name, a.desc || '', a.shortDesc || '', a.gen);
    }
  });
  insertAbilities();

  // ── Items ─────────────────────────────────────────────────────────────────
  console.log('[GenerateBundledDb] Seeding items...');
  const itemStmt = db.prepare(`
    INSERT INTO items (id, name, display_name, category, description, short_description, cost)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET name=excluded.name, display_name=excluded.display_name
  `);
  const insertItems = db.transaction(() => {
    for (const item of Dex.items.all()) {
      if (item.isNonstandard || item.num <= 0) continue;
      itemStmt.run(item.num, item.id, item.name, 'other', item.desc || '', item.shortDesc || '', null);
    }
  });
  insertItems();

  // ── Moves ─────────────────────────────────────────────────────────────────
  console.log('[GenerateBundledDb] Seeding moves...');
  const moveStmt = db.prepare(`
    INSERT INTO moves (id, name, display_name, type, category, power, accuracy, pp, priority,
      description, short_description, generation, makes_contact)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET name=excluded.name, display_name=excluded.display_name
  `);
  const insertMoves = db.transaction(() => {
    for (const move of Dex.moves.all()) {
      if (move.isNonstandard || move.num <= 0) continue;
      const accuracy = move.accuracy === true ? 100 : (typeof move.accuracy === 'number' ? move.accuracy : null);
      const power = move.basePower > 0 ? move.basePower : null;
      moveStmt.run(move.num, move.id, move.name, move.type, move.category, power, accuracy,
        move.pp, move.priority || 0, move.desc || '', move.shortDesc || '', move.gen,
        move.flags?.contact ? 1 : 0);
    }
  });
  insertMoves();

  // ── Build species list (filtered, same as app) ───────────────────────────
  const allSpecies = Dex.species.all();
  const processedNames = new Set();
  const includedSpecies = []; // all forms we insert into pokemon table
  const defaultFormSpecies = []; // default forms only (for PokeAPI enrichment)

  for (const species of allSpecies) {
    const excluded = (species.isNonstandard === 'CAP' || species.isNonstandard === 'Future' || species.isNonstandard === 'Custom')
      && !FUTURE_FORM_ALLOWLIST.has(species.name);
    if (!species.exists || excluded || processedNames.has(species.name)) continue;
    if (FORM_EXCLUSION_SET.has(species.name)) continue;
    processedNames.add(species.name);
    includedSpecies.push(species);
    if (species.num > 0 && !species.forme) defaultFormSpecies.push(species);
  }

  // ── Fetch PokeAPI IDs for non-default forms ───────────────────────────────
  console.log('[GenerateBundledDb] Fetching PokeAPI IDs for alternate forms...');
  const pokeApiIdCache = new Map(); // species.id -> pokeapi_id
  const alternateForms = includedSpecies.filter(s => determineFormType(s) !== 'default');
  const altFormsToFetch = alternateForms.filter(s => {
    const slug = generatePokeApiSlug(s.name, s.forme);
    return !POKEAPI_SLUG_EXCLUSION_SET.has(slug);
  });

  let altFetched = 0;
  const BATCH = 10;
  for (let i = 0; i < altFormsToFetch.length; i += BATCH) {
    const batch = altFormsToFetch.slice(i, i + BATCH);
    let hadFetch = false;
    await Promise.all(batch.map(async species => {
      const slug = generatePokeApiSlug(species.name, species.forme);
      try {
        const data = await pokeApiFetch(`https://pokeapi.co/api/v2/pokemon/${slug}`);
        if (typeof data.id === 'number') {
          pokeApiIdCache.set(species.id, data.id);
          altFetched++;
          hadFetch = true;
        }
      } catch (e) {
        // fall back to national dex number
      }
    }));
    if (hadFetch) await sleep(50);
    const batchNum = Math.floor(i / BATCH) + 1;
    const totalBatches = Math.ceil(altFormsToFetch.length / BATCH);
    if (batchNum % 10 === 0 || batchNum === totalBatches) {
      console.log(`  [PokeAPI IDs] batch ${batchNum}/${totalBatches} (${altFetched} fetched)`);
    }
  }

  // ── Seed pokemon base data ────────────────────────────────────────────────
  console.log('[GenerateBundledDb] Seeding pokemon base data...');
  const pokemonStmt = db.prepare(`
    INSERT INTO pokemon (id, national_dex, pokeapi_id, name, display_name, form_type, form_name,
      primary_type, secondary_type, hp, attack, defense, special_attack, special_defense, speed,
      height, weight, generation, is_legendary, is_mythical, sprite_url, artwork_url, shiny_url,
      shiny_sprite_url, cosmetic_variants, game_exclusivity, gender_rate, species_classification)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const abilityLinkStmt = db.prepare(`
    INSERT OR IGNORE INTO pokemon_abilities (pokemon_id, ability_id, slot, is_hidden) VALUES (?, ?, ?, ?)
  `);

  // Build ability name -> id map
  const abilityNameToId = new Map();
  for (const row of db.prepare('SELECT id, display_name FROM abilities').all()) {
    abilityNameToId.set(row.display_name, row.id);
  }

  const insertPokemon = db.transaction(() => {
    let nextId = 1;
    for (const species of includedSpecies) {
      const formType = determineFormType(species);
      const genderRate = species.genderRatio?.female !== undefined
        ? Math.round((species.genderRatio.female / 100) * 8)
        : (species.gender === null ? -1 : 0);
      let pokeApiId = species.num;
      if (formType !== 'default') pokeApiId = pokeApiIdCache.get(species.id) ?? species.num;

      pokemonStmt.run(
        nextId, species.num, pokeApiId, species.id, species.name, formType,
        species.forme || null, species.types[0], species.types[1] || null,
        species.baseStats.hp, species.baseStats.atk, species.baseStats.def,
        species.baseStats.spa, species.baseStats.spd, species.baseStats.spe,
        species.heightm ?? null, species.weightkg, species.gen,
        species.tags?.includes('Legendary') ? 1 : 0,
        species.tags?.includes('Mythical') ? 1 : 0,
        null, null, null, null, '[]',
        species.isNonstandard === 'Past' ? 'past-gen' : species.isNonstandard === 'LGPE' ? 'lgpe' : null,
        genderRate, species.category || null
      );

      // Abilities
      if (species.abilities) {
        let slot = 1;
        for (const key of ['0', '1']) {
          const aName = species.abilities[key];
          if (aName) {
            const aid = abilityNameToId.get(aName);
            if (aid) abilityLinkStmt.run(nextId, aid, slot++, 0);
          }
        }
        if (species.abilities.H) {
          const aid = abilityNameToId.get(species.abilities.H);
          if (aid) abilityLinkStmt.run(nextId, aid, slot, 1);
        }
      }
      nextId++;
    }
  });
  insertPokemon();
  console.log(`  Inserted ${db.prepare('SELECT COUNT(*) as c FROM pokemon').get().c} pokemon`);

  // Build name->id map for use in enrichment steps
  const nameToDbId = new Map();
  for (const row of db.prepare('SELECT id, name FROM pokemon').all()) {
    nameToDbId.set(row.name, row.id);
  }
  const nationalDexToDbId = new Map();
  for (const row of db.prepare('SELECT id, national_dex FROM pokemon WHERE form_type = ?').all('default')) {
    nationalDexToDbId.set(row.national_dex, row.id);
  }

  // ── Fetch flavor text + evolutions from PokeAPI ───────────────────────────
  console.log(`[GenerateBundledDb] Fetching flavor text + evolutions for ${defaultFormSpecies.length} species...`);
  const flavorTexts = new Map();   // nationalDex -> [{gameVersion, flavorText}]
  const evolutions = new Map();    // nationalDex -> [{evolvesToNum, method, conditionValue}]
  const evoChainCache = new Map();

  let speciesFetched = 0;
  for (let i = 0; i < defaultFormSpecies.length; i += BATCH) {
    const batch = defaultFormSpecies.slice(i, i + BATCH);
    let hadFetch = false;
    await Promise.all(batch.map(async species => {
      try {
        const data = await pokeApiFetch(`https://pokeapi.co/api/v2/pokemon-species/${species.num}/`);
        hadFetch = true;
        speciesFetched++;

        // Flavor text (English only, deduplicated by game version)
        const ftList = [];
        for (const entry of (data.flavor_text_entries || [])) {
          if (entry.language?.name === 'en') {
            const text = (entry.flavor_text || '').replace(/\f/g, ' ').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
            if (text) ftList.push({ gameVersion: entry.version?.name || 'unknown', flavorText: text });
          }
        }
        if (ftList.length > 0) flavorTexts.set(species.num, ftList);

        // Evolution chain
        if (data.evolution_chain?.url) {
          const chainIdMatch = data.evolution_chain.url.match(/\/evolution-chain\/(\d+)\//);
          if (chainIdMatch) {
            const chainId = parseInt(chainIdMatch[1], 10);
            if (!evoChainCache.has(chainId)) {
              evoChainCache.set(chainId, null);
              try {
                const chainData = await pokeApiFetch(`https://pokeapi.co/api/v2/evolution-chain/${chainId}/`);
                evoChainCache.set(chainId, chainData);
                if (chainData?.chain) parseEvolutionChain(chainData.chain, evolutions);
              } catch (e) {
                console.warn(`  [warn] Evolution chain ${chainId} fetch failed: ${e.message}`);
              }
            }
          }
        }
      } catch (e) {
        console.warn(`  [warn] Species ${species.num} fetch failed: ${e.message}`);
      }
    }));
    if (hadFetch) await sleep(50);
    const batchNum = Math.floor(i / BATCH) + 1;
    const totalBatches = Math.ceil(defaultFormSpecies.length / BATCH);
    if (batchNum % 10 === 0 || batchNum === totalBatches) {
      console.log(`  [Species] batch ${batchNum}/${totalBatches} (${speciesFetched} fetched)`);
    }
  }

  // Write flavor text + evolutions in a transaction
  console.log('[GenerateBundledDb] Writing flavor text and evolutions...');
  const ftStmt = db.prepare(`INSERT OR IGNORE INTO pokemon_flavor_text (pokemon_id, game_version, flavor_text) VALUES (?, ?, ?)`);
  const evoStmt = db.prepare(`INSERT OR IGNORE INTO pokemon_evolutions (pokemon_id, evolves_to_id, method, condition_value) VALUES (?, ?, ?, ?)`);
  const writeEnrichment = db.transaction(() => {
    for (const [nationalDex, texts] of flavorTexts) {
      const pokemonId = nationalDexToDbId.get(nationalDex);
      if (!pokemonId) continue;
      for (const { gameVersion, flavorText } of texts) {
        ftStmt.run(pokemonId, gameVersion, flavorText);
      }
    }
    for (const [fromNdex, evoList] of evolutions) {
      const fromId = nationalDexToDbId.get(fromNdex);
      if (!fromId) continue;
      for (const { evolvesToNum, method, conditionValue } of evoList) {
        const toId = nationalDexToDbId.get(evolvesToNum);
        if (!toId) continue;
        evoStmt.run(fromId, toId, method, conditionValue);
      }
    }
    // Mark all default-form species as enriched
    db.prepare(`UPDATE pokemon SET species_enriched = 1 WHERE form_type = 'default'`).run();
  });
  writeEnrichment();

  // ── Fetch encounter locations ─────────────────────────────────────────────
  console.log(`[GenerateBundledDb] Fetching encounter locations for ${defaultFormSpecies.length} species...`);
  const encounterRows = []; // collected before writing
  let encountersFetched = 0;

  for (let i = 0; i < defaultFormSpecies.length; i += BATCH) {
    const batch = defaultFormSpecies.slice(i, i + BATCH);
    let hadFetch = false;
    await Promise.all(batch.map(async species => {
      const pokemonId = nationalDexToDbId.get(species.num);
      if (!pokemonId) return;
      try {
        const data = await pokeApiFetch(`https://pokeapi.co/api/v2/pokemon/${species.num}/encounters`);
        if (!Array.isArray(data) || data.length === 0) return;
        hadFetch = true;
        encountersFetched++;

        // Aggregate: max chance per (location, method, version)
        const aggregated = new Map();
        for (const locationEntry of data) {
          const locationName = locationEntry.location_area?.name || '';
          for (const vd of (locationEntry.version_details || [])) {
            const gameVersion = vd.version?.name || '';
            for (const ed of (vd.encounter_details || [])) {
              const method = ed.method?.name || '';
              const key = `${locationName}|${method}|${gameVersion}`;
              const existing = aggregated.get(key);
              if (!existing || ed.chance > existing.encounterChance) {
                aggregated.set(key, {
                  pokemonId, gameVersion, locationName,
                  locationAreaSlug: locationName,
                  encounterMethod: method,
                  encounterChance: ed.chance,
                  minLevel: ed.min_level ?? null,
                  maxLevel: ed.max_level ?? null,
                });
              }
            }
          }
        }
        for (const row of aggregated.values()) encounterRows.push(row);
      } catch (e) {
        // Many Pokémon have no encounter data — silent skip
      }
    }));
    if (hadFetch) await sleep(50);
    const batchNum = Math.floor(i / BATCH) + 1;
    const totalBatches = Math.ceil(defaultFormSpecies.length / BATCH);
    if (batchNum % 10 === 0 || batchNum === totalBatches) {
      console.log(`  [Encounters] batch ${batchNum}/${totalBatches} (${encountersFetched} with data)`);
    }
  }

  console.log(`[GenerateBundledDb] Writing ${encounterRows.length} encounter rows...`);
  const encStmt = db.prepare(`
    INSERT OR IGNORE INTO pokemon_encounter_locations
      (pokemon_id, game_version, location_name, location_area_slug, encounter_method, encounter_chance, min_level, max_level)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const writeEncounters = db.transaction(() => {
    for (const r of encounterRows) {
      encStmt.run(r.pokemonId, r.gameVersion, r.locationName, r.locationAreaSlug,
        r.encounterMethod, r.encounterChance, r.minLevel, r.maxLevel);
    }
  });
  writeEncounters();

  // ── Fetch machines (TM/HM/TR) from PokeAPI ───────────────────────────────
  console.log('[GenerateBundledDb] Fetching machines from PokeAPI...');
  const machineLookup = new Map(); // key: "${moveId}:${versionGroup}" -> tmNumber (integer)
  let machinesFetched = 0;

  try {
    let machineUrl = 'https://pokeapi.co/api/v2/machine?limit=2000';
    let pageNum = 1;
    while (machineUrl) {
      const machineListData = await pokeApiFetch(machineUrl);
      machineUrl = machineListData.next || null;

      if (!Array.isArray(machineListData.results)) break;

      const machineUrls = machineListData.results.map(r => r.url);
      const MACHINE_BATCH = 10;

      for (let i = 0; i < machineUrls.length; i += MACHINE_BATCH) {
        const batch = machineUrls.slice(i, i + MACHINE_BATCH);
        let hadFetch = false;
        await Promise.all(batch.map(async machineUrl => {
          try {
            const machineData = await pokeApiFetch(machineUrl);
            hadFetch = true;
            machinesFetched++;

            if (machineData.item?.name && machineData.move?.url && machineData.version_group?.name) {
              // Extract move ID from URL
              const moveIdMatch = machineData.move.url.match(/\/move\/(\d+)\//);
              if (!moveIdMatch) return;
              const moveId = parseInt(moveIdMatch[1], 10);

              // Extract prefix (tm, hm, tr) and number, then format as label (e.g. "tm027" -> "TM027", "hm03" -> "HM003")
              const itemNameLower = machineData.item.name.toLowerCase();
              const numberMatch = itemNameLower.match(/^(tm|hm|tr)(\d+)$/);
              if (!numberMatch) return;
              const prefix = numberMatch[1].toUpperCase(); // "TM", "HM", "TR"
              const num = parseInt(numberMatch[2], 10);
              const label = `${prefix}${String(num).padStart(3, '0')}`; // "TM027", "TR000", "HM003"

              const versionGroup = machineData.version_group.name;
              const key = `${moveId}:${versionGroup}`;
              machineLookup.set(key, label);
            }
          } catch (e) {
            // Silent skip on fetch failure
          }
        }));
        if (hadFetch) await sleep(50);
        const batchNum = Math.floor(i / MACHINE_BATCH) + 1;
        const totalBatches = Math.ceil(machineUrls.length / MACHINE_BATCH);
        if (batchNum % 10 === 0 || batchNum === totalBatches) {
          console.log(`  [Machines page ${pageNum}] batch ${batchNum}/${totalBatches} (${machinesFetched} fetched)`);
        }
      }
    }
  } catch (e) {
    console.warn(`  [warn] Machine list fetch failed: ${e.message}`);
  }
  console.log(`  [Machines] Total: ${machineLookup.size} machine entries`);

  // ── Movesets from PokeAPI with version_group support ──────────────────────
  console.log(`[GenerateBundledDb] Fetching movesets from PokeAPI for ${defaultFormSpecies.length} species...`);

  // Build move ID set for validation
  const validMoveIds = new Set();
  for (const row of db.prepare('SELECT id FROM moves').all()) {
    validMoveIds.add(row.id);
  }

  const moveRows = []; // collected before writing
  let movesetsFetched = 0;

  for (let i = 0; i < defaultFormSpecies.length; i += BATCH) {
    const batch = defaultFormSpecies.slice(i, i + BATCH);
    let hadFetch = false;
    await Promise.all(batch.map(async species => {
      const pokemonId = nationalDexToDbId.get(species.num);
      if (!pokemonId) return;
      try {
        const data = await pokeApiFetch(`https://pokeapi.co/api/v2/pokemon/${species.num}/`);
        if (!data.moves || !Array.isArray(data.moves) || data.moves.length === 0) return;
        hadFetch = true;

        const seenMoves = new Set();
        for (const moveEntry of data.moves) {
          if (!moveEntry.move?.url) continue;
          const moveIdMatch = moveEntry.move.url.match(/\/move\/(\d+)\//);
          if (!moveIdMatch) continue;
          const moveId = parseInt(moveIdMatch[1], 10);
          if (!validMoveIds.has(moveId)) continue;

          if (!moveEntry.version_group_details || !Array.isArray(moveEntry.version_group_details)) continue;

          for (const detail of moveEntry.version_group_details) {
            const learnMethod = detail.move_learn_method?.name ?? 'other';
            const versionGroup = detail.version_group?.name ?? '';
            let learnLevel = null;
            let learnLabel = null;
            if (learnMethod === 'level-up' && detail.level_learned_at > 0) {
              learnLevel = detail.level_learned_at;
            } else if (learnMethod === 'machine') {
              learnLabel = machineLookup.get(`${moveId}:${versionGroup}`) ?? null;
            }

            const key = `${moveId}:${learnMethod}:${versionGroup}`;
            if (seenMoves.has(key)) continue;
            seenMoves.add(key);

            moveRows.push({ pokemonId, moveId, learnMethod, learnLevel, learnLabel, versionGroup });
          }
        }
        movesetsFetched++;
      } catch (e) {
        // Many species have no move data — silent skip
      }
    }));
    if (hadFetch) await sleep(50);
    const batchNum = Math.floor(i / BATCH) + 1;
    const totalBatches = Math.ceil(defaultFormSpecies.length / BATCH);
    if (batchNum % 10 === 0 || batchNum === totalBatches) {
      console.log(`  [Movesets] batch ${batchNum}/${totalBatches} (${movesetsFetched} with data)`);
    }
  }

  console.log(`[GenerateBundledDb] Writing ${moveRows.length} moveset rows...`);
  const moveInsertStmt = db.prepare(`INSERT OR IGNORE INTO pokemon_moves (pokemon_id, move_id, learn_method, learn_level, learn_label, version_group) VALUES (?, ?, ?, ?, ?, ?)`);
  const writeMovesets = db.transaction(() => {
    for (const r of moveRows) {
      moveInsertStmt.run(r.pokemonId, r.moveId, r.learnMethod, r.learnLevel, r.learnLabel, r.versionGroup);
    }
  });
  writeMovesets();

  // ── Write all sync_metadata gates ────────────────────────────────────────
  console.log('[GenerateBundledDb] Writing sync_metadata...');
  const metaStmt = db.prepare(`INSERT OR REPLACE INTO sync_metadata (key, value, updated_at) VALUES (?, ?, datetime('now'))`);
  const writeMeta = db.transaction(() => {
    metaStmt.run('data_version', DATA_VERSION);
    metaStmt.run('pokeapi_enrich_version', ENRICH_VERSION);
    metaStmt.run('moves_dex_v1', 'done');
    metaStmt.run('moves_dex_migration_v1', 'done');
    metaStmt.run('classification_backfill_v1', 'done');
    metaStmt.run('species_enriched_backfill_v1', 'done');
    metaStmt.run('encounters_backfill_v1', 'done');
    metaStmt.run('za_forms_enrichment_v1', 'done');
    // Prevent artwork prefetch from re-running on a copied DB
    metaStmt.run('artwork_prefetch_completed', 'false');
  });
  writeMeta();

  // ── Final row counts ──────────────────────────────────────────────────────
  const counts = {
    pokemon: db.prepare('SELECT COUNT(*) as c FROM pokemon').get().c,
    abilities: db.prepare('SELECT COUNT(*) as c FROM abilities').get().c,
    moves: db.prepare('SELECT COUNT(*) as c FROM moves').get().c,
    items: db.prepare('SELECT COUNT(*) as c FROM items').get().c,
    pokemon_moves: db.prepare('SELECT COUNT(*) as c FROM pokemon_moves').get().c,
    pokemon_abilities: db.prepare('SELECT COUNT(*) as c FROM pokemon_abilities').get().c,
    flavor_text: db.prepare('SELECT COUNT(*) as c FROM pokemon_flavor_text').get().c,
    evolutions: db.prepare('SELECT COUNT(*) as c FROM pokemon_evolutions').get().c,
    encounters: db.prepare('SELECT COUNT(*) as c FROM pokemon_encounter_locations').get().c,
  };

  // Checkpoint WAL and switch back to DELETE mode for a clean bundled database
  db.pragma('wal_checkpoint(TRUNCATE)');
  db.pragma('journal_mode = DELETE');

  db.close();

  const sizeKb = Math.round(fs.statSync(DB_PATH).size / 1024);
  console.log('\n[GenerateBundledDb] ✓ Done!');
  console.log(`  Output: ${DB_PATH} (${sizeKb} KB)`);
  console.log('  Row counts:');
  for (const [table, count] of Object.entries(counts)) {
    console.log(`    ${table}: ${count}`);
  }
  console.log('\nCommit assets/db/championdex.db to git.');
}

main().catch(err => {
  console.error('[GenerateBundledDb] Fatal error:', err);
  process.exit(1);
});
