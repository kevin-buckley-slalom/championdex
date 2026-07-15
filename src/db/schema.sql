-- ChampionDex SQLite Schema
-- form_type: 'default' | 'regional' | 'mega' | 'gigantamax' | 'cosmetic'
-- True form variants (regional, mega, gigantamax) are stored as separate rows.
-- Cosmetic-only variants (gender sprites) are stored as JSON in cosmetic_variants.

CREATE TABLE IF NOT EXISTS pokemon (
  id                INTEGER PRIMARY KEY,
  national_dex      INTEGER NOT NULL,
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

-- Junction: Pokemon <-> Abilities
CREATE TABLE IF NOT EXISTS pokemon_abilities (
  pokemon_id  INTEGER NOT NULL REFERENCES pokemon(id) ON DELETE CASCADE,
  ability_id  INTEGER NOT NULL REFERENCES abilities(id) ON DELETE CASCADE,
  slot        INTEGER NOT NULL,
  is_hidden   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (pokemon_id, ability_id)
);

-- Junction: Pokemon <-> Moves
CREATE TABLE IF NOT EXISTS pokemon_moves (
  pokemon_id    INTEGER NOT NULL REFERENCES pokemon(id) ON DELETE CASCADE,
  move_id       INTEGER NOT NULL REFERENCES moves(id) ON DELETE CASCADE,
  learn_method  TEXT NOT NULL,
  learn_level   INTEGER,
  PRIMARY KEY (pokemon_id, move_id, learn_method)
);

-- Teams — UUID primary keys for future cloud sync readiness
CREATE TABLE IF NOT EXISTS teams (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL DEFAULT 'My Team',
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Team members — UUID primary keys
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

-- Sync metadata
CREATE TABLE IF NOT EXISTS sync_metadata (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- FTS5 virtual table for full-text search
CREATE VIRTUAL TABLE IF NOT EXISTS pokemon_fts USING fts5(
  name, display_name, primary_type, secondary_type,
  content='pokemon', content_rowid='id'
);

CREATE VIRTUAL TABLE IF NOT EXISTS moves_fts USING fts5(
  name, display_name, type,
  content='moves', content_rowid='id'
);

CREATE VIRTUAL TABLE IF NOT EXISTS abilities_fts USING fts5(
  name, display_name, description,
  content='abilities', content_rowid='id'
);

CREATE VIRTUAL TABLE IF NOT EXISTS items_fts USING fts5(
  name, display_name, description,
  content='items', content_rowid='id'
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_pokemon_national_dex ON pokemon(national_dex);
CREATE INDEX IF NOT EXISTS idx_pokemon_primary_type ON pokemon(primary_type);
CREATE INDEX IF NOT EXISTS idx_pokemon_generation ON pokemon(generation);
CREATE INDEX IF NOT EXISTS idx_pokemon_form_type ON pokemon(form_type);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
