# Data Research: Pokémon Detail Screen Fields

**Version:** 1.0 | **Date:** 2026-07-10 | **Author:** Data Researcher Agent

---

## Summary Table

| Field | @pkmn/dex | PokeAPI | Schema Change | Storage | Recommendation | Priority |
|-------|-----------|---------|---------------|---------|----------------|----------|
| Evolution chain/tree | YES | YES `/evolution-chain/{id}` | NEW TABLE | ~50 KB | Include now | HIGH |
| Gender ratio | PARTIAL | YES `/pokemon-species/{id}` | ADD COLUMN | ~2 KB | Include now | HIGH |
| Classification / species | UNKNOWN | YES `/pokemon-species/{id}` | ADD COLUMN | ~30 KB | Include now | MEDIUM |
| Imperial height/weight | N/A | N/A | NONE | 0 | Client-side math | LOW |
| Abilities + hidden flag | YES | YES | ✅ ALREADY EXISTS | 0 | Already complete | DONE |
| Location encounter data | NO | YES `/pokemon/{id}/encounters` | NEW TABLE | 12–18 MB | Defer — fetch on demand | MEDIUM |
| Flavor text / Pokédex entries | NO | YES `/pokemon-species/{id}` | NEW TABLE | ~1.5 MB | Include now (EN only) | HIGH |

---

## 1. Evolution Chain / Tree

**Sources:**
- `@pkmn/dex`: YES — `dex.species.get('bulbasaur').prevo` and `.evos` provide the evolution chain and trigger conditions
- PokeAPI: `GET /api/v2/evolution-chain/{id}` — full nested chain with `evolution_details` (trigger, level, item, move, happiness, beauty, affection, etc.)

**Current schema:** Not stored.

**Schema change needed:**
```sql
CREATE TABLE pokemon_evolutions (
  id INTEGER PRIMARY KEY,
  pokemon_id INTEGER NOT NULL,         -- the pokemon that evolves
  evolves_to_id INTEGER NOT NULL,      -- the pokemon it evolves into
  method TEXT NOT NULL,                -- 'level_up', 'use_item', 'trade', 'friendship', etc.
  condition_value TEXT,                -- e.g. level number, item name
  FOREIGN KEY (pokemon_id) REFERENCES pokemon(id),
  FOREIGN KEY (evolves_to_id) REFERENCES pokemon(id)
);
```

**Data volume:** ~900 evolution relationships × ~50 bytes = ~50 KB. Negligible.

**Recommendation:** Include now. Use `@pkmn/dex` as primary source (fast, local), fall back to PokeAPI for edge cases. Seed during initial data load.

---

## 2. Gender Ratio

**Sources:**
- `@pkmn/dex`: Partial — accessible via numeric code
- PokeAPI: `GET /api/v2/pokemon-species/{id}` → `gender_rate` field
  - Scale: -1 (genderless) to 8 (all female). 0 = 100% male, 4 = 50/50, 8 = 100% female
  - Conversion: male% = `(8 - gender_rate) / 8 * 100`
  - Example: Bulbasaur `gender_rate: 1` → 87.5% male / 12.5% female

**Current schema:** Not stored.

**Schema change:** Add column to `pokemon` table:
```sql
ALTER TABLE pokemon ADD COLUMN gender_rate INTEGER DEFAULT -1;
-- -1 = genderless, 0–8 = PokeAPI gender_rate scale
```

**Data volume:** 1 integer per Pokémon = ~4 KB for all 1,025. Negligible.

**Recommendation:** Include now. Already available in the `pokemon-species` endpoint that will be needed for classification and flavor text — one extra column at no additional API cost.

---

## 3. Classification / Species Descriptor

**Sources:**
- `@pkmn/dex`: Not confirmed in documentation.
- PokeAPI: `GET /api/v2/pokemon-species/{id}` → `genera` array
  - Each entry: `{ genus: "Seed Pokémon", language: { name: "en" } }`
  - Filter by `language.name === "en"` for English-only

**Current schema:** Not stored.

**Schema change:** Add column to `pokemon` table:
```sql
ALTER TABLE pokemon ADD COLUMN species_classification TEXT;
-- e.g. "Seed Pokémon", "Mouse Pokémon"
```

**Data volume:** ~20–40 chars per Pokémon × 1,025 = ~30 KB. Negligible.

**Recommendation:** Include now. Same API call as gender ratio (both come from `/pokemon-species/{id}`), so zero additional network cost.

---

## 4. Imperial Height / Weight

**Sources:** Neither `@pkmn/dex` nor PokeAPI provide imperial units. Both store metric only.

**Current schema:** Already stores `height` (decimetres) and `weight` (hectograms).

**Conversion (pure client-side math):**
```typescript
// Height: dm → feet and inches
const totalInches = (heightDm * 10) / 2.54;
const feet = Math.floor(totalInches / 12);
const inches = Math.round(totalInches % 12);
// e.g. 4 dm → 1'4"

// Weight: hg → lbs
const lbs = (weightHg * 0.22046).toFixed(1);
// e.g. 69 hg → 15.2 lbs
```

**Schema change:** None.

**Recommendation:** Implement as a `src/utils/unitConversions.ts` utility. No data work required.

---

## 5. Abilities with Hidden Ability Flag

**Sources:**
- `@pkmn/dex`: YES — slot and is_hidden available
- PokeAPI: YES — `/pokemon/{id}` returns `abilities` array with `is_hidden` and `slot`

**Current schema:** ✅ Already correct.

```sql
CREATE TABLE pokemon_abilities (
  pokemon_id INTEGER NOT NULL,
  ability_id INTEGER NOT NULL,
  slot INTEGER,        -- 1, 2 = normal; 3 = hidden
  is_hidden INTEGER DEFAULT 0,
  PRIMARY KEY (pokemon_id, ability_id)
);
```

Query pattern for detail screen:
```sql
SELECT a.id, a.name, a.description, pa.slot, pa.is_hidden
FROM pokemon_abilities pa
JOIN abilities a ON pa.ability_id = a.id
WHERE pa.pokemon_id = ?
ORDER BY pa.slot ASC;
```

**Recommendation:** No work needed. Already complete.

---

## 6. Location Encounter Data

**Sources:**
- `@pkmn/dex`: NO — Showdown does not track encounter locations.
- PokeAPI: YES — `GET /api/v2/pokemon/{id}/encounters`
  - Returns array of location areas with version_details (game, method, levels, chance)
  - Average response: 8–12 KB per Pokémon
  - Median entries: 15–20 location × version combinations per Pokémon

**Data volume estimate:**
- Conservative: 1,025 Pokémon × 10 KB avg = **~10 MB**
- Realistic: 1,025 × 15 KB avg = **~15 MB**
- Schema rows: ~15,000–20,000 records

**Schema change if stored locally:**
```sql
CREATE TABLE pokemon_encounters (
  id INTEGER PRIMARY KEY,
  pokemon_id INTEGER NOT NULL,
  location_name TEXT NOT NULL,
  game_version TEXT NOT NULL,
  encounter_method TEXT,
  min_level INTEGER,
  max_level INTEGER,
  encounter_chance INTEGER,
  FOREIGN KEY (pokemon_id) REFERENCES pokemon(id)
);
```

**Recommendation:** **Defer — fetch on demand.** 12–18 MB is a meaningful addition to local storage for data that most users will only check for 1–2 games at most. Better approach: fetch from PokeAPI when the user opens a Pokémon detail, cache the result in-memory or in AsyncStorage for the session. If the user is offline, show "Location data unavailable offline."

Alternative: Seed encounters only for the current generation (Scarlet/Violet) — ~2–3 MB instead of 18 MB.

---

## 7. Flavor Text / Pokédex Entries

**Sources:**
- `@pkmn/dex`: NO — not available.
- PokeAPI: `GET /api/v2/pokemon-species/{id}` → `flavor_text_entries` array
  - 50–70 entries per Pokémon (all languages, all game versions)
  - English only: ~8–12 entries per Pokémon (one per game generation)
  - Average entry: ~100–150 characters
  - Note: Raw text contains `\f` (form feed) and `\n` characters — must strip/normalize on seed

**Data volume (English only):**
- 1,025 Pokémon × 10 entries avg × 120 chars avg = ~1.2 MB text
- With metadata overhead: **~1.5 MB SQLite storage**
- Rows: ~10,000–12,000

**Schema change:**
```sql
CREATE TABLE pokemon_flavor_text (
  id INTEGER PRIMARY KEY,
  pokemon_id INTEGER NOT NULL,
  game_version TEXT NOT NULL,   -- e.g. 'scarlet', 'sword', 'sun'
  flavor_text TEXT NOT NULL,
  FOREIGN KEY (pokemon_id) REFERENCES pokemon(id),
  UNIQUE (pokemon_id, game_version)
);

CREATE INDEX idx_flavor_text_pokemon ON pokemon_flavor_text(pokemon_id);
```

**Seeding notes:**
- Filter `flavor_text_entries` where `language.name === "en"`
- Strip `\f` and normalize `\n` → single space
- Store one row per game version per Pokémon
- UI: show latest version by default with game selector to browse older entries

**Recommendation:** Include now (English only). ~1.5 MB is entirely acceptable for mobile SQLite. Flavor text is a primary content element users expect in a Pokédex. Same API call as gender ratio and classification.

---

## Implementation Plan

### Phase A — Schema changes (add columns + new tables)
1. `ALTER TABLE pokemon ADD COLUMN gender_rate INTEGER DEFAULT -1`
2. `ALTER TABLE pokemon ADD COLUMN species_classification TEXT`
3. `CREATE TABLE pokemon_evolutions (...)`
4. `CREATE TABLE pokemon_flavor_text (...)`

### Phase B — Seed data (extend existing seedDatabase logic)
1. `/pokemon-species/{id}` → populate `gender_rate`, `species_classification`, `flavor_text` (English, all versions)
2. `@pkmn/dex` `.prevo`/`.evos` → populate `pokemon_evolutions`
3. Ability slot/hidden: already seeded (verify)

### Phase C — Client utilities
1. `src/utils/unitConversions.ts` — `toImperialHeight(dm)`, `toImperialWeight(hg)`

### Phase D — Encounter data (deferred)
1. Fetch on demand from PokeAPI in `usePokemonEncounters(id)` hook
2. Cache per session in React Query

---

## Notes

- Gender ratio, classification, and flavor text all come from the same PokeAPI endpoint (`/pokemon-species/{id}`) — seed them in a single pass to minimize API calls during initial data load.
- The `/pokemon-species` endpoint is separate from `/pokemon` — the existing seed script likely does not call it. A new seeding step is needed.
- Total additional storage for all "include now" fields: evolution (~50 KB) + gender/classification (~32 KB) + flavor text (~1.5 MB) = **~1.6 MB** — well within budget.
