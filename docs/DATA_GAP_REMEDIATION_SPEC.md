# Pokemon Data Gap Remediation Spec

**Version:** 1.9  
**Status:** Awaiting approval — do not implement  
**Date:** 2026-07-21  
**Audit source:** `scripts/output/pokemon_data_audit.json`

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.9 | 2026-07-21 | Section 6.7 added: 92 Mega Stone items missing from items table (47 classic Past + 45 Z-A Future); all filtered by isNonstandard; full slug/num table provided; implementation mirrors Section 6.1 pattern; Step 8 added to Section 7 |
| 1.8 | 2026-07-21 | Section 6.5-A corrected: all Z-A mega stones populated from @pkmn/dex requiredItem field (raichunitex, clefablite, feraligite, etc.); removed incorrect NULL assertion; only Mega Rayquaza remains NULL (Dragon Ascent, no stone) |
| 1.7 | 2026-07-21 | Moves audit corrected with full quantitative analysis; Section 6.3 rewritten with four verified sub-categories: 6.3-A PokeAPI by ID (123 forms, full tables), 6.3-B PokeAPI by slug (2 forms: Farfetch'd Galar + Greninja Bond — verified via direct API fetch), 6.3-C base-form copy (5 forms: Burmy variants, Rockruff Dusk, Necrozma fusions — PokeAPI 404 confirmed), 6.3-D tera-form copy (4 Ogerpon tera forms — PokeAPI 404 confirmed) |
| 1.6 | 2026-07-21 | Moves audit complete; Section 6.3 rewritten with three sub-categories: 6.3-A PokeAPI fetch (128 forms incl. Necrozma fusions by slug), 6.3-B base-form copy (4 forms: Burmy variants, Greninja Bond, Rockruff Dusk), 6.3-C tera-form copy (4 Ogerpon tera forms); exact DB IDs and implementation order specified |
| 1.5 | 2026-07-21 | Abilities audit complete; Section 6.1 rewritten with two distinct root causes (Z-A mega abilities filtered by isNonstandard; Tablets/Beads of Ruin lost to @pkmn/dex num collision); exact DB IDs and implementation approach corrected; no PokeAPI calls needed |
| 1.4 | 2026-07-21 | Pokédex entries audit complete; Section 3 Pokédex table replaced with sub-category breakdown; Section 4.7 added (deferred manual sourcing for ~137 forms); Section 6.2 replaced (query-layer fix for 134 battle-only forms); Section 6.6-C added (FlavorTextSection empty state); Section 7 implementation table updated with Steps 5–11 |
| 1.3 | 2026-07-21 | Encounter locations audit complete; Section 3 encounter table updated with exact counts and per-category decisions; Section 4.1 count corrected to 120; Section 6.4 updated (58 forms, Hisuian parity confirmed); Section 6.6 added (smart empty-state messages + non-default form data reuse); Section 7 updated |
| 1.2 | 2026-07-21 | Evolution chain audit complete (all 439 forms reviewed, decisions recorded); Section 4.6 resolved; Section 6.5 added with full implementation brief for evolution chain seeding; Section 7 updated; Section 9 Q1 closed |
| 1.1 | 2026-07-21 | Architectural correction (all fixes in generateBundledDb.js not seedDatabase.ts); regional flavor text → Option B; alternate forms included in moves backfill; evolution chain gap reclassified as needs-investigation; Z-A megas deferred; open questions updated |
| 1.0 | 2026-07-21 | Initial spec from audit findings |

---

## Section 1 — Audit Overview

The data audit examined 1,294 Pokemon forms across the bundled SQLite database (`assets/db/championdex.db`), identifying 592 forms with one or more missing data categories and 702 forms with complete data.

---

## Section 2 — Architectural Approach

All data fixes in this spec must be implemented in `scripts/generateBundledDb.js` — the build-time script that generates the pre-packaged SQLite database committed to the repo as `assets/db/championdex.db`. The bundled DB ships with the app and is copied to the device on first install; it must contain all data already populated.

This is a deliberate architectural constraint:
- All Pokemon data is static (no runtime changes)
- The bundled DB is built once and distributed — on-device enrichment from PokeAPI adds latency and connectivity dependency for data that never changes
- Images (artwork URLs, sprites) are the only exception — they are too large to store in the DB and must remain network-fetched

**Consequence for this spec**: Every fix previously described as a `seedDatabase.ts` backfill function (run on-device) must instead be implemented as an addition to `generateBundledDb.js` (run at build time). The on-device `seedDatabase.ts` enrichment pipeline is NOT the implementation target for any fix in this spec.

After implementing any fix in `generateBundledDb.js`:
1. Run `node scripts/generateBundledDb.js` to rebuild the bundled DB
2. Bump `DATA_VERSION` and `BUNDLED_DATA_VERSION` in `src/services/database/seedDatabase.ts`
3. Run `node scripts/auditPokemonData.js` to verify counts

---

### Breakdown by Form Type

| Form Type | Total | With Issues | % With Issues |
|-----------|-------|-------------|---------------|
| alternate | 76 | 76 | 100% |
| cosmetic | 6 | 6 | 100% |
| default | 1023 | 321 | 31.4% |
| gigantamax | 34 | 34 | 100% |
| mega | 97 | 97 | 100% |
| regional | 58 | 58 | 100% |

### Issues by Category

| Category | Affected Forms |
|----------|----------------|
| abilities | 8 |
| moves | 272 |
| pokedex_entries | 271 |
| encounter_locations | 453 |
| evolution_chain | 438 |

---

## Section 3 — Gap Classification

Each gap has been classified into one of four categories. The classification determines action.

| Classification | Definition | Action |
|---|---|---|
| **Expected / By Design** | Correct behaviour; audit may flag incorrectly but data is not missing | Document reason; no fix needed |
| **False Positive** | Audit script mislabels valid empty data (e.g. gift-only Pokemon with no wild encounters) | Update audit script; no DB changes |
| **Seeding Gap** | Data exists in a source (PokeAPI, @pkmn/dex) but is not loaded into the DB | Implement targeted addition in `generateBundledDb.js` |
| **Source Unavailable** | Data does not exist in any accessible source (PokeAPI, Bulbapedia, etc.) | None; defer or request manual sourcing approval |

### Breakdown by Gap Category

#### Evolution chain (439 forms)

Following a dedicated audit session (2026-07-21), all 439 flagged forms have been reviewed individually. See `scripts/output/EVOLUTION_CHAIN_AUDIT.md` for the full per-form decision log.

| Form Type | Count | Classification | Action |
|-----------|-------|-----------------|--------|
| legendary/mythical defaults | 92 | Expected / By Design | None |
| single-stage defaults (no evolution) | 75 | Expected / By Design | None |
| single-stage defaults with Mega only | 13 | Seeding Gap | Covered by Mega rows below |
| regional | 58 | Seeding Gap | Section 6.5 (regional sub-section) |
| mega | 92 | Seeding Gap | Section 6.5 |
| alternate (selected forms) | 19 | Seeding Gap | Section 6.5 |
| alternate (no evolution relevance) | 50 | Expected / By Design | None |
| gigantamax | 34 | Seeding Gap | Section 6.5 |
| cosmetic (selected forms) | 5 | Seeding Gap | Section 6.5 |
| cosmetic (Indeedee — single-stage) | 1 | Expected / By Design | None |

**Classification summary:** PokeAPI does not model form-variant evolution chains. These must be seeded manually from game knowledge. All decisions were reviewed and approved by the user — see Section 6.5 for the complete data tables and implementation rules.

#### Encounter locations (453 forms)

Full investigation completed 2026-07-21. Exact counts from live DB.

| Sub-category | Count | Classification | Action |
|---|---|---|---|
| Default — Gen 9 (906+) | 120 | Source Unavailable | None until PokeAPI updates |
| Default — Gen 1–8, evolution-only | 47 | False Positive (correctly empty) | Smart empty-state message in UI |
| Default — Gen 1–8, fossil-revival | 3 | False Positive (correctly empty) | Smart empty-state message in UI |
| Default — Gen 1–8, mythical/event/gift | 12 | False Positive (correctly empty) | Smart empty-state message in UI |
| Regional forms | 58 | Seeding Gap | Section 6.4 — fetch from PokeAPI |
| Mega forms | 97 | No new rows — reuse base form data at query time | Section 6.6 |
| Gigantamax forms | 34 | No new rows — reuse base form data at query time | Section 6.6 |
| Alternate forms | 76 | No new rows — reuse base form data at query time | Section 6.6 |
| Cosmetic forms | 6 | No new rows — reuse base form data at query time | Section 6.6 |

**Key decisions:**
- PokeAPI returns `[]` correctly for the 62 Gen 1–8 defaults — no data is missing from the DB. These are false positives in the audit.
- The current blanket empty-state message ("cannot be caught in the wild — obtained via event, gift, or trade") is **incorrect** for evolution-only and fossil Pokémon. The UI must show an accurate obtain-method message per Pokémon. This is a UI-only fix — no DB changes. See Section 6.6.
- Regional forms: Hisuian forms are treated identically to Alolan/Galarian forms. Fetch whatever PokeAPI returns for all 58.
- Non-default forms (mega, gigantamax, alternate, cosmetic): these share their base form's encounter locations by game mechanics. No new DB rows. The encounter hook resolves the default form's DB id at query time and uses that instead. See Section 6.6.

#### Pokédex entries (271 forms)

Full investigation completed 2026-07-21. PokeAPI v2 exposes **no form-specific flavor text** at any endpoint — all non-default form IDs return 404 on `/pokemon-species/{id}/` and fall back to the base species, whose flavor text describes only the base form. Confirmed by fetching every English entry for Vulpix (#37): all 22 entries describe the fire-type; none mention Alola or ice.

| Sub-category | Count | Classification | Action |
|---|---|---|---|
| Mega forms | 97 | Query-layer fix — reuse base form text | Section 6.2 (revised) |
| Gigantamax forms | 34 | Query-layer fix — reuse base form text | Section 6.2 (revised) |
| Battle-only alternates (Mimikyu Busted, Eiscue Noice, Morpeko Hangry) | 3 | Query-layer fix — reuse base form text | Section 6.2 (revised) |
| Regional forms | 58 | Source Unavailable — genuine data gap | Section 4.7 — deferred |
| Alternate forms with own in-game entries (~70 forms) | ~70 | Source Unavailable — genuine data gap | Section 4.7 — deferred |
| Cosmetic gender variants (Meowstic ♀, Indeedee ♀, Basculegion ♀, Oinkologne ♀) | 4 | Source Unavailable — genuine data gap | Section 4.7 — deferred |
| Nidoran ♀ / Nidoran ♂ | 2 | Source Unavailable — genuine data gap | Section 4.7 — deferred |

**Key decisions:**
- Battle-only forms (megas, gigantamax, Mimikyu Busted, Eiscue Noice, Morpeko Hangry) have no independent Pokédex entries in any game. Showing the base form's text is correct. Query-layer fix only — no DB changes.
- Regional forms and most alternate/cosmetic forms have genuine unique in-game Pokédex entries that PokeAPI does not expose. Base form text must NOT be shown as a fallback. These forms will show an empty/unavailable state until manual data is sourced.
- All ~134 forms requiring manual sourcing are deferred together — one manual data session covers all of them. See Section 4.7.

#### Moves (272 forms)

| Form Type | Count | Classification |
|-----------|-------|-----------------|
| alternate | 76 | Seeding Gap |
| regional | 58 | Seeding Gap |

**Total: 134 forms** — all have zero rows in `pokemon_moves`. Full per-form breakdown with sub-categories (PokeAPI by ID, by slug, base-form copy, tera copy) in Section 6.3.

**Reason:** `generateBundledDb.js` seeds moves for default forms only. Regional and alternate forms are inserted into the `pokemon` table but never given `pokemon_moves` rows.

#### Abilities (8 forms)

| Form Type | Count | Classification |
|-----------|-------|-----------------|
| mega | 6 | Seeding Gap |
| default | 2 | Seeding Gap |

**Reason:** `seedPokemonBaseData()` filters to default forms only. These 8 forms (6 Z-A megas: Meganium-Mega, Feraligatr-Mega, Excadrill-Mega, Eelektross-Mega, Pyroar-Mega, Scovillain-Mega, plus Wo-Chien and Chi-Yu) exist in `pokemon` but have no rows in `pokemon_abilities`. PokeAPI has ability data for all 8.

---

## Section 4 — Gaps That Will Not Be Fixed

### 4.1 — Gen 9 encounter data (120 default forms)

**Root cause:** PokeAPI v2 has not populated encounter data for Gen 9 Pokémon. All 120 Pokémon with `national_dex >= 906` return `[]` from `/pokemon/{id}/encounters`. This is a PokeAPI data gap, not a database gap.

**Action:** None until PokeAPI updates. To retry: clear `encounters_backfill_v1` key in `sync_metadata` table after PokeAPI updates. Do not bump `ENRICH_VERSION`.

---

### 4.2 — Classic Mega move pools (97 megas)

**Root cause:** By Pokemon game mechanics, Mega evolutions inherit the move pool of their base form. They do not have independent move lists. This is correct behaviour.

**Action:** None.

---

### 4.3 — Gigantamax move pools (34 forms)

**Root cause:** By Pokemon game mechanics, G-Max forms share the base form's moves. They do not have independent move pools.

**Action:** None.

---

### 4.4 — ~5 Z-A megas with no move data in PokeAPI

**Status:** Deferred — source not yet decided. Do not implement. No action pending user decision on manual sourcing.

---

### 4.5 — Cosmetic form moves, flavor text, and encounters

**Root cause:** Cosmetic forms are appearance-only with no gameplay differences. They are not expected to have independent data — they share everything with the base form by design.

**Action:** None.

---

### 4.7 — Pokédex entries for regional forms, most alternate forms, and cosmetic gender variants (~137 forms)

**Root cause:** PokeAPI v2 exposes no form-specific flavor text. All non-default form IDs return 404 on `/pokemon-species/{id}/`. The base species flavor text describes only the standard form — Vulpix's entries all describe the fire-type; none mention Alola or ice. This was confirmed by fetching all 22 English entries for Vulpix (#37) directly from the API.

**Affected forms (~137 total):**

| Sub-category | Count | Examples |
|---|---|---|
| Regional forms | 58 | Alolan Vulpix, Galarian Slowpoke, Hisuian Growlithe, Paldean Wooper, all Galarian/Hisuian lines |
| Alternate forms with own in-game entries | ~73 | Primal Kyogre/Groudon, Deoxys forms, Shaymin Sky, Hoopa Unbound, Zygarde 10%/Complete, Lycanroc Midnight/Dusk, Oricorio forms, Necrozma fusions, Calyrex fusions, Terapagos forms, Ogerpon masks, Rotom appliances, Dialga/Palkia Origin, all Force of Nature Therians, Urshifu Rapid-Strike, Palafin Hero, and others |
| Cosmetic gender variants | 4 | Meowstic ♀, Indeedee ♀, Basculegion ♀, Oinkologne ♀ |
| Nidoran ♀ / ♂ | 2 | Separate species with their own Pokédex entries |

**Action:** Deferred. All ~137 forms require manual data sourcing from Bulbapedia or game data dumps. This work is deferred to a dedicated manual sourcing session that covers all forms at once, rather than piecemeal. Until sourced, these forms display an appropriate empty state in the FlavorTextSection (see Section 6.6-C).

**Do not implement a base-form fallback for these forms.** Showing Vulpix's fire-type flavor text on Alolan Vulpix's detail screen is factually wrong.

---

### 4.6 — Evolution chain entries for non-default forms — ✅ RESOLVED

All 439 flagged forms reviewed and classified in a dedicated audit session (2026-07-21). Full per-form decisions recorded in `scripts/output/EVOLUTION_CHAIN_AUDIT.md`. Implementation spec in Section 6.5.

---

## Section 5 — False Positives in Audit Script

### 5.1 — Default forms with no wild encounter data (~150 forms)

**Root cause:** PokeAPI correctly returns `[]` for Pokemon that are gift-only, event-only, or starter Pokemon (e.g., Venusaur, Blastoise, Charizard). The audit script currently flags these as "Unknown — needs investigation" rather than recognising the empty response as valid.

**Fix:** Update `scripts/auditPokemonData.js` to add a new reason string: `"PokeAPI returns no encounter data — likely gift/event/starter Pokemon"`. This change is script-only with zero database impact.

**Verification:** Re-run audit and confirm the 150 forms are no longer flagged.

---

## Section 6 — Seeding Gaps (Fixable)

### 6.1 — Missing abilities: two distinct root causes

**Scope:** 8 Pokémon with zero rows in `pokemon_abilities`

| DB ID | National Dex | Name | Form Type | PokeAPI ID | Root Cause |
|-------|-------------|------|-----------|------------|------------|
| 224 | 154 | meganiummega | mega | 10282 | Z-A mega ability filtered out |
| 232 | 160 | feraligatrmega | mega | 10283 | Z-A mega ability filtered out |
| 670 | 530 | excadrillmega | mega | 10287 | Z-A mega ability filtered out |
| 759 | 604 | eelektrossmega | mega | 10290 | Z-A mega ability filtered out |
| 840 | 668 | pyroarmega | mega | 10295 | Z-A mega ability filtered out |
| 1203 | 952 | scovillainmega | mega | 10320 | Z-A mega ability filtered out |
| 1261 | 1001 | wochien | default | 1001 | Num collision in @pkmn/dex |
| 1264 | 1004 | chiyu | default | 1004 | Num collision in @pkmn/dex |

**Root cause A — Z-A mega abilities (`isNonstandard: 'Future'`):**

The ability seeding loop in `generateBundledDb.js` filters `if (a.isNonstandard || a.num <= 0) continue`. All 6 Z-A mega abilities (Mega Sol, Dragonize, Piercing Drill, Eelevate, Fire Mane, Spicy Spray) are tagged `isNonstandard: 'Future'` in `@pkmn/dex` and are silently dropped. Their records are never written to the `abilities` table, so the downstream `abilityNameToId.get()` lookup in the Pokémon seeding loop returns `undefined` and no `pokemon_abilities` row is created.

**Root cause B — Wo-Chien and Chi-Yu (`@pkmn/dex` num collision):**

`@pkmn/dex` returns `num: 284` for three abilities: Vessel of Ruin, Tablets of Ruin, and Beads of Ruin. The `abilities` seeding uses `ON CONFLICT(id) DO UPDATE`, so only the last one written to ID 284 survives. The correct PokeAPI IDs are: Tablets of Ruin = 286, Beads of Ruin = 287. Both are lost in the collision and never seeded. Because `abilityNameToId` is built from the `abilities` table after seeding, the lookups for Wo-Chien and Chi-Yu return `undefined`.

**Ability records to add (all sourced from `@pkmn/dex`, correct IDs from PokeAPI):**

| Ability Name | @pkmn/dex id | Correct DB ID | Notes |
|-------------|-------------|---------------|-------|
| Piercing Drill | piercingdrill | 311 | Z-A mega (Excadrill) |
| Dragonize | dragonize | 312 | Z-A mega (Feraligatr) |
| Eelevate | eelevate | 313 | Z-A mega (Eelektross) |
| Mega Sol | megasol | 315 | Z-A mega (Meganium) |
| Fire Mane | firemane | 316 | Z-A mega (Pyroar) |
| Spicy Spray | spicyspray | 318 | Z-A mega (Scovillain) |
| Tablets of Ruin | tabletsofruin | 286 | Wo-Chien (correct ID, not 284) |
| Beads of Ruin | beadsofruin | 287 | Chi-Yu (correct ID, not 284) |

**Implementation approach:**

Two changes in `generateBundledDb.js`, both in the abilities seeding transaction:

1. **After `insertAbilities()`, before building `abilityNameToId`** — add a hardcoded insert block for the 8 missing ability records using `INSERT OR IGNORE`. Use the exact DB IDs from the table above. Source `desc`/`shortDesc`/`gen` values from `Dex.abilities.get(name)`. This covers both root cause A (explicitly inserting despite the `isNonstandard` filter) and root cause B (inserting Tablets and Beads with the correct IDs 286/287, not 284).

2. The existing `abilityNameToId` map rebuild and Pokémon link step require **no changes** — once the ability records exist in the `abilities` table, the existing lookup and `INSERT OR IGNORE INTO pokemon_abilities` will find them on the next `generateBundledDb.js` run.

**Files to change:** `scripts/generateBundledDb.js` only (additive insert block; no changes to existing seeding logic)

**Constraints:**
- INSERT OR IGNORE only — never modify existing ability rows
- Do not change the existing `isNonstandard` filter; add the 8 records as an explicit supplement after the loop
- No PokeAPI calls — all data available from `@pkmn/dex`
- No modifications to any other file

**Verification:** After rebuilding the bundled DB and bumping `DATA_VERSION`, re-run `node scripts/auditPokemonData.js`. The abilities count in the gap report should drop from 8 to 0. Confirm `SELECT COUNT(*) FROM abilities WHERE id IN (286,287,311,312,313,315,316,318)` returns 8.

---

### 6.2 — Pokédex entries: query-layer fix for battle-only forms

**Scope:** 134 forms — 97 mega + 34 gigantamax + 3 battle-only alternates (Mimikyu Busted, Eiscue Noice, Morpeko Hangry).

These forms have no independent Pokédex entries in any game — they are in-battle transformations of the base Pokémon. Showing the base form's flavor text is correct. The remaining ~137 non-default forms (regional, most alternates, cosmetic gender variants, Nidoran ♀/♂) have genuine unique in-game entries that PokeAPI does not expose — those are deferred to Section 4.7.

**Root cause:** `getPokemonSpeciesData()` in `pokemonSpeciesRepository.ts` queries `pokemon_flavor_text WHERE pokemon_id = ?` using the current form's DB `id`. Battle-only forms have no rows under their own ID. The base form's rows are in the DB but are never reached.

**Data source:** Already in the DB on the base form. No PokeAPI calls, no DB changes.

**Implementation approach:**

Query-layer fix in `src/services/database/pokemonSpeciesRepository.ts`. In `getPokemonSpeciesData(pokemonId)`, before querying flavor text:

1. Fetch `form_type` and `name` and `national_dex` for the given `pokemonId`.
2. If `form_type IN ('mega', 'gigantamax')` OR `name IN ('mimikyubusted', 'eiscuenoice', 'morpekohangry')`:
   - Resolve: `SELECT id FROM pokemon WHERE national_dex = ? AND form_type = 'default' ORDER BY id LIMIT 1`
   - Use that resolved ID for both the `pokemon_flavor_text` query and the `pokemon_evolutions` query.
3. All other forms: use `pokemonId` unchanged (existing behaviour preserved).

**Files to change:** `src/services/database/pokemonSpeciesRepository.ts` only.

**Constraints:**
- No DB changes
- No `generateBundledDb.js` changes
- Do not apply base-form fallback to regional forms, other alternate forms, or cosmetic gender variants — those are deferred (Section 4.7) and must show an empty/unavailable state, not incorrect base-form text

---

### 6.3 — Moves for regional and alternate forms

**Scope:** 134 forms total — 58 regional + 76 alternate — all currently have zero rows in `pokemon_moves`.

**Root cause:** `generateBundledDb.js` seeds moves for default forms only. Regional and alternate forms are inserted into `pokemon` but never given `pokemon_moves` rows.

**Sub-category summary:**

| Category | Count | Approach |
|----------|-------|----------|
| 6.3-A: PokeAPI fetch by `pokeapi_id` | 123 | Standard fetch `GET /pokemon/{pokeapi_id}/` |
| 6.3-B: PokeAPI fetch by slug | 2 | `pokeapi_id` in DB is wrong/shared; must use hardcoded slug |
| 6.3-C: Copy from base form | 5 | PokeAPI has no separate entry; identical move pool |
| 6.3-D: Copy from corresponding non-tera form | 4 | Battle-only tera forms; PokeAPI returns 404 |
| **Total** | **134** | |

---

**6.3-A — PokeAPI fetch by `pokeapi_id` (123 forms):**

All 57 regional forms except Galarian Farfetch'd, plus 66 alternate forms. All have distinct `pokeapi_id` values; fetch `GET /pokemon/{pokeapi_id}/` → `moves` array.

*57 regional forms (6.3-A):*

| DB ID | National Dex | Name | PokeAPI ID |
|-------|-------------|------|------------|
| 30 | 19 | rattataalola | 10091 |
| 32 | 20 | raticatealola | 10092 |
| 40 | 26 | raichualola | 10100 |
| 44 | 27 | sandshrewalola | 10101 |
| 46 | 28 | sandslashalola | 10102 |
| 57 | 37 | vulpixalola | 10103 |
| 59 | 38 | ninetalesalola | 10104 |
| 72 | 50 | diglettalola | 10105 |
| 74 | 51 | dugtrioalola | 10106 |
| 76 | 52 | meowthalola | 10107 |
| 77 | 52 | meowthgalar | 10161 |
| 80 | 53 | persianalola | 10108 |
| 86 | 58 | growlithehisui | 10229 |
| 88 | 59 | arcaninehisui | 10230 |
| 107 | 74 | geodudealola | 10109 |
| 109 | 75 | graveleralola | 10110 |
| 111 | 76 | golemalola | 10111 |
| 113 | 77 | ponytagalar | 10162 |
| 115 | 78 | rapidashgalar | 10163 |
| 117 | 79 | slowpokegalar | 10164 |
| 120 | 80 | slowbrogalar | 10165 |
| 130 | 88 | grimeralola | 10112 |
| 132 | 89 | mukalola | 10113 |
| 147 | 100 | voltorbhisui | 10231 |
| 149 | 101 | electrodehisui | 10232 |
| 152 | 103 | exeggutoralola | 10114 |
| 155 | 105 | marowakalola | 10115 |
| 161 | 110 | weezinggalar | 10167 |
| 176 | 122 | mrmimegalar | 10168 |
| 184 | 128 | taurospaldeacombat | 10250 |
| 185 | 128 | taurospaldeablaze | 10251 |
| 186 | 128 | taurospaldeaaqua | 10252 |
| 208 | 144 | articunogalar | 10169 |
| 210 | 145 | zapdosgalar | 10170 |
| 212 | 146 | moltresgalar | 10171 |
| 228 | 157 | typhlosionhisui | 10233 |
| 268 | 194 | wooperpaldea | 10253 |
| 274 | 199 | slowkinggalar | 10172 |
| 288 | 211 | qwilfishhisui | 10234 |
| 295 | 215 | sneaselhisui | 10235 |
| 303 | 222 | corsolagalar | 10173 |
| 351 | 263 | zigzagoongalar | 10174 |
| 353 | 264 | linoonegalar | 10175 |
| 642 | 503 | samurotthisui | 10236 |
| 692 | 549 | lilliganthisui | 10237 |
| 700 | 554 | darumakagalar | 10176 |
| 703 | 555 | darmanitangalar | 10177 |
| 704 | 555 | darmanitangalarzen | 10178 |
| 713 | 562 | yamaskgalar | 10179 |
| 723 | 570 | zoruahisui | 10238 |
| 725 | 571 | zoroarkhisui | 10239 |
| 775 | 618 | stunfiskgalar | 10180 |
| 787 | 628 | braviaryhisui | 10240 |
| 888 | 705 | sliggoohisui | 10241 |
| 890 | 706 | goodrahisui | 10242 |
| 904 | 713 | avalugghisui | 10243 |
| 921 | 724 | decidueyehisui | 10244 |

*66 alternate forms (6.3-A):*

| DB ID | National Dex | Name | PokeAPI ID |
|-------|-------------|------|------------|
| 490 | 382 | kyogreprimal | 10077 |
| 492 | 383 | groudonprimal | 10078 |
| 497 | 386 | deoxysattack | 10001 |
| 498 | 386 | deoxysdefense | 10002 |
| 499 | 386 | deoxysspeed | 10003 |
| 530 | 413 | wormadamsandy | 10004 |
| 531 | 413 | wormadamtrash | 10005 |
| 606 | 479 | rotomheat | 10008 |
| 607 | 479 | rotomwash | 10009 |
| 608 | 479 | rotomfrost | 10010 |
| 609 | 479 | rotomfan | 10011 |
| 610 | 479 | rotommow | 10012 |
| 615 | 483 | dialgaorigin | 10245 |
| 617 | 484 | palkiaorigin | 10246 |
| 622 | 487 | giratinaorigin | 10007 |
| 629 | 492 | shayminsky | 10006 |
| 694 | 550 | basculinbluestriped | 10016 |
| 695 | 550 | basculinwhitestriped | 10247 |
| 702 | 555 | darmanitanzen | 10017 |
| 801 | 641 | tornadustherian | 10019 |
| 803 | 642 | thundurustherian | 10020 |
| 807 | 645 | landorustherian | 10021 |
| 809 | 646 | kyuremblack | 10022 |
| 810 | 646 | kyuremwhite | 10023 |
| 812 | 647 | keldeoresolute | 10024 |
| 814 | 648 | meloettapirouette | 10018 |
| 828 | 658 | greninjaash | 10117 |
| 843 | 670 | floetteeternal | 10061 |
| 859 | 681 | aegislashblade | 10026 |
| 895 | 710 | pumpkaboosmall | 10027 |
| 896 | 710 | pumpkaboolarge | 10028 |
| 897 | 710 | pumpkaboosuper | 10029 |
| 899 | 711 | gourgeistsmall | 10030 |
| 900 | 711 | gourgeistlarge | 10031 |
| 901 | 711 | gourgeistsuper | 10032 |
| 910 | 718 | zygarde10 | 10181 |
| 911 | 718 | zygardecomplete | 10120 |
| 916 | 720 | hoopaunbound | 10086 |
| 940 | 741 | oricoriopompom | 10123 |
| 941 | 741 | oricoriopau | 10124 |
| 942 | 741 | oricoriosensu | 10125 |
| 948 | 745 | lycanrocmidnight | 10126 |
| 949 | 745 | lycanrocdusk | 10152 |
| 951 | 746 | wishiwashischool | 10127 |
| 985 | 778 | mimikyubusted | 10143 |
| 1011 | 800 | necrozmaultra | 10157 |
| 1075 | 849 | toxtricitylowkey | 10184 |
| 1109 | 875 | eiscuenoice | 10185 |
| 1113 | 877 | morpekohangry | 10187 |
| 1127 | 888 | zaciancrowned | 10188 |
| 1129 | 889 | zamazentacrowned | 10189 |
| 1131 | 890 | eternatuseternamax | 10190 |
| 1134 | 892 | urshifurapidstrike | 10191 |
| 1143 | 898 | calyrexice | 10193 |
| 1144 | 898 | calyrexshadow | 10194 |
| 1148 | 901 | ursalunabloodmoon | 10272 |
| 1154 | 905 | enamorustherian | 10249 |
| 1216 | 964 | palafinhero | 10256 |
| 1232 | 978 | tatsugiridroopy | 10258 |
| 1233 | 978 | tatsugiristretchy | 10259 |
| 1259 | 999 | gimmighoulroaming | 10263 |
| 1278 | 1017 | ogerponwellspring | 10273 |
| 1279 | 1017 | ogerponhearthflame | 10274 |
| 1280 | 1017 | ogerponcornerstone | 10275 |
| 1292 | 1024 | terapagosterastal | 10276 |
| 1293 | 1024 | terapagosstellar | 10277 |

Note: Mimikyu Busted, Eiscue Noice, and Morpeko Hangry are battle-only for flavor text purposes (Section 6.2) but PokeAPI does return distinct move data for them — they are included in 6.3-A.

---

**6.3-B — PokeAPI fetch by slug (2 forms):**

These forms have a `pokeapi_id` in the DB that matches their default form, but PokeAPI has a separate entry reachable by name slug. Verified by direct API fetch: both return distinct move lists.

| DB ID | National Dex | Name | DB `pokeapi_id` | PokeAPI slug to use |
|-------|-------------|------|----------------|---------------------|
| 124 | 83 | farfetchdgalar | 83 (shared with default) | `farfetchd-galar` |
| 827 | 658 | greninjabond | 658 (shared with default) | `greninja-battle-bond` |

Implementation: use `GET /pokemon/{slug}/` for these two forms. Do not use their numeric `pokeapi_id`.

---

**6.3-C — Copy from base/default form (5 forms):**

These forms share a `pokeapi_id` with their default form AND PokeAPI has no separate entry for them (verified: `necrozma-dusk-mane` and `necrozma-dawn-wings` return 404). Their move pools are identical to the base form. Copy base form rows in SQL — no PokeAPI fetch needed.

| DB ID | National Dex | Name | Source DB ID | Source name |
|-------|-------------|------|-------------|-------------|
| 527 | 412 | burmysandy | 526 | burmy |
| 528 | 412 | burmytrash | 526 | burmy |
| 946 | 744 | rockruffdusk | 945 | rockruff |
| 1009 | 800 | necrozmaduskmane | 1008 | necrozma |
| 1010 | 800 | necrozmadawnwings | 1008 | necrozma |

SQL pattern: `INSERT OR IGNORE INTO pokemon_moves SELECT {dest_id}, move_id, learn_method, level_learned, game_version FROM pokemon_moves WHERE pokemon_id = {source_id}`

---

**6.3-D — Copy from corresponding non-tera mask form (4 forms):**

Ogerpon's tera forms are in-battle-only transformations. PokeAPI has no separate entries for them (slug and ID both 404 for tera variants). Copy moves from the corresponding mask form after 6.3-A completes.

| DB ID | Name | Source DB ID | Source name |
|-------|------|-------------|-------------|
| 1281 | ogerpontealtera | 1277 | ogerpon (default) |
| 1282 | ogerponwellspringtera | 1278 | ogerponwellspring |
| 1283 | ogerponhearthflametera | 1279 | ogerponhearthflame |
| 1284 | ogerponcornerstonetera | 1280 | ogerponcornerstone |

SQL pattern: same `INSERT OR IGNORE ... SELECT` as 6.3-C.

---

**Implementation approach:**

Add a `seedNonDefaultMovesets(db)` step in `generateBundledDb.js` after the existing moveset seeding. Execute in this order:

1. **6.3-C copies** (5 pairs) — run first; no dependencies.
2. **6.3-A + 6.3-B PokeAPI fetches** (125 forms) — iterate `form_type IN ('regional','alternate')` excluding the 11 forms in 6.3-C and 6.3-D. For the 2 slug-fetch forms (DB IDs 124 and 827), use a hardcoded slug map instead of `pokeapi_id`. Same rate-limiting and `INSERT OR IGNORE` pattern as existing moveset seeding.
3. **6.3-D tera copies** (4 pairs) — run last, after 6.3-A so source mask form rows exist.

**Files to change:** `scripts/generateBundledDb.js` only (additive)

**Constraints:**
- `INSERT OR IGNORE` only — never modify existing `pokemon_moves` rows
- No modification to existing loading paths or default-form seeding
- No existing data may be deleted or altered
- 6.3-D copies must run after 6.3-A/B fetches

**Note:** Highest-effort fix by volume — 125 PokeAPI fetches × ~60–150 moves each. Use the existing rate-limiting pattern. Wrap per-form DB writes in a transaction per form.

**Verification:** After rebuild and `DATA_VERSION` bump, re-run `node scripts/auditPokemonData.js`. Move gaps should drop to 0 for all regional and alternate forms. Spot checks:
- `SELECT COUNT(*) FROM pokemon_moves WHERE pokemon_id = 1009` — should equal `SELECT COUNT(*) FROM pokemon_moves WHERE pokemon_id = 1008` (Necrozma copy)
- `SELECT COUNT(*) FROM pokemon_moves WHERE pokemon_id = 124` — should be 62 (confirmed from PokeAPI)
- `SELECT COUNT(*) FROM pokemon_moves WHERE pokemon_id = 827` — should be 101 (confirmed from PokeAPI)

---

### 6.4 — Encounter locations for regional forms

**Scope:** 58 regional forms (exact count confirmed from live DB). Includes all Alolan, Galarian, Hisuian, and Paldean regional forms. Hisuian forms are treated identically to all others — fetch whatever PokeAPI returns for each.

**Root cause:** The bundled DB seeding (in `generateBundledDb.js`) filters to default forms only. Regional forms are never fetched.

**Data source:** PokeAPI `/pokemon/{pokeapi_id}/encounters` endpoint. All 58 regional forms have `pokeapi_id > 0`. Some (e.g. Galarian Legendaries, Paldean Tauros) may return `[]` — that is correct and will result in the smart empty-state message being shown (see Section 6.6).

**Implementation approach:**

Add a `fetchRegionalEncounters(db)` step in `generateBundledDb.js` after the existing encounter fetching. Targets `form_type = 'regional'`. Uses same aggregation logic (max chance per location/method/version) as existing encounter fetching in the script.

**Files to change:** `scripts/generateBundledDb.js` (additive only)

**Constraints:**
- `INSERT OR IGNORE` only — do not touch existing encounter rows
- No modification to existing loading paths
- No existing data may be deleted or altered

**Verification:** After rebuilding the bundled DB and bumping `DATA_VERSION`, re-run `node scripts/auditPokemonData.js`. Encounter count should decrease for regional form_type for the forms that have PokeAPI data (e.g. Alolan forms). Forms returning `[]` from PokeAPI will remain at zero encounter rows — the Section 6.6 UI fix handles their empty state.

---

### 6.5 — Evolution chain entries for form variants

**Scope:** 220 new `pokemon_evolutions` rows across five sub-categories: Mega forms (92), Gigantamax forms (34), selected Alternate forms (19 rows), Regional forms (~58 rows across varying chain shapes), and selected Cosmetic forms (5 rows).

**Root cause:** PokeAPI's evolution chain endpoint only models base-species-to-base-species evolution. Form variants (Mega, Gigantamax, etc.) are never included. This data must be seeded from game knowledge, using the DB IDs confirmed during the audit.

**Data source:** Game knowledge (verified against Bulbapedia) + DB `pokemon.id` values confirmed by direct DB query during audit. All `pokemon_id` / `evolves_to_id` values in the tables below are confirmed accurate against the live DB.

**Files to change:** `scripts/generateBundledDb.js` (additive only — a new `seedEvolutionChainGaps(db)` function called after all existing Pokemon seeding steps)

**Constraints:**
- `INSERT OR IGNORE` only — never UPDATE or DELETE existing evolution rows
- No modification to existing loading paths or existing data
- All rows must use the exact DB `id` values from the tables below — do not derive from `national_dex` or re-query at runtime

---

#### 6.5-A — Mega Evolution entries (92 rows)

**Rules:**
- `method = 'mega-evolution'`
- `condition_value` = the Mega Stone item slug (lowercase, no spaces, e.g. `venusaurite`, `charizardite-x`)
- Every mega evolution has a Mega Stone — Z-A megas included. Stone slugs sourced from `@pkmn/dex` `requiredItem` field. All Z-A mega stones are `isNonstandard: 'Future'` in `@pkmn/dex` so they are not in the `items` table — this is fine, `condition_value` is a free-text column with no foreign key constraint
- The sole exception is Mega Rayquaza, which requires Dragon Ascent move (no stone) → `condition_value = NULL`
- Multi-Mega species (Charizard X/Y, Mewtwo X/Y, etc.) each get their own row from the same base
- UI display rule: Base form detail view filters out Mega rows from the displayed chain; Mega form detail view shows minimal chain (base → mega only)

| mega_id | Mega Name | base_id | condition_value |
|---------|-----------|---------|-----------------|
| 4 | Mega Venusaur | 3 | `venusaurite` |
| 9 | Mega Charizard X | 8 | `charizardite-x` |
| 10 | Mega Charizard Y | 8 | `charizardite-y` |
| 15 | Mega Blastoise | 14 | `blastoisinite` |
| 24 | Mega Beedrill | 23 | `beedrillite` |
| 28 | Mega Pidgeot | 27 | `pidgeotite` |
| 41 | Mega Raichu X | 39 | `raichunitex` |
| 42 | Mega Raichu Y | 39 | `raichunitey` |
| 55 | Mega Clefable | 54 | `clefablite` |
| 95 | Mega Alakazam | 94 | `alakazite` |
| 103 | Mega Victreebel | 102 | `victreebelite` |
| 119 | Mega Slowbro | 118 | `slowbronite` |
| 138 | Mega Gengar | 137 | `gengarite` |
| 167 | Mega Kangaskhan | 166 | `kangaskhanite` |
| 174 | Mega Starmie | 173 | `starminite` |
| 182 | Mega Pinsir | 181 | `pinsirite` |
| 189 | Mega Gyarados | 188 | `gyaradosite` |
| 204 | Mega Aerodactyl | 203 | `aerodactylite` |
| 216 | Mega Dragonite | 215 | `dragoninite` |
| 218 | Mega Mewtwo X | 217 | `mewtwonite-x` |
| 219 | Mega Mewtwo Y | 217 | `mewtwonite-y` |
| 224 | Mega Meganium | 223 | `meganiumite` |
| 232 | Mega Feraligatr | 231 | `feraligite` |
| 254 | Mega Ampharos | 253 | `ampharosite` |
| 284 | Mega Steelix | 283 | `steelixite` |
| 290 | Mega Scizor | 289 | `scizorite` |
| 293 | Mega Heracross | 292 | `heracronite` |
| 309 | Mega Skarmory | 308 | `skarmorite` |
| 312 | Mega Houndoom | 311 | `houndoominite` |
| 332 | Mega Tyranitar | 331 | `tyranitarite` |
| 339 | Mega Sceptile | 338 | `sceptilite` |
| 343 | Mega Blaziken | 342 | `blazikenite` |
| 347 | Mega Swampert | 346 | `swampertite` |
| 372 | Mega Gardevoir | 371 | `gardevoirite` |
| 393 | Mega Sableye | 392 | `sablenite` |
| 395 | Mega Mawile | 394 | `mawilite` |
| 399 | Mega Aggron | 398 | `aggronite` |
| 402 | Mega Medicham | 401 | `medichamite` |
| 405 | Mega Manectric | 404 | `manectite` |
| 415 | Mega Sharpedo | 414 | `sharpedonite` |
| 420 | Mega Camerupt | 419 | `cameruptite` |
| 432 | Mega Altaria | 431 | `altarianite` |
| 453 | Mega Banette | 452 | `banettite` |
| 458 | Mega Chimecho | 457 | `chimechite` |
| 460 | Mega Absol | 459 | `absolite` |
| 461 | Mega Absol Z | 459 | `absolitez` |
| 465 | Mega Glalie | 464 | `glalitite` |
| 477 | Mega Salamence | 476 | `salamencite` |
| 481 | Mega Metagross | 480 | `metagrossite` |
| 486 | Mega Latias | 485 | `latiasite` |
| 488 | Mega Latios | 487 | `latiosite` |
| 494 | Mega Rayquaza | 493 | NULL *(no stone — requires Dragon Ascent)* |
| 512 | Mega Staraptor | 511 | `staraptite` |
| 547 | Mega Lopunny | 546 | `lopunnite` |
| 565 | Mega Garchomp | 564 | `garchompite` |
| 566 | Mega Garchomp Z | 564 | `garchompitez` |
| 570 | Mega Lucario | 569 | `lucarionite` |
| 571 | Mega Lucario Z | 569 | `lucarionitez` |
| 584 | Mega Abomasnow | 583 | `abomasite` |
| 600 | Mega Gallade | 599 | `galladite` |
| 604 | Mega Froslass | 603 | `froslassite` |
| 619 | Mega Heatran | 618 | `heatranite` |
| 627 | Mega Darkrai | 626 | `darkranite` |
| 638 | Mega Emboar | 637 | `emboarite` |
| 670 | Mega Excadrill | 669 | `excadrite` |
| 672 | Mega Audino | 671 | `audinite` |
| 687 | Mega Scolipede | 686 | `scolipite` |
| 710 | Mega Scrafty | 709 | `scraftinite` |
| 759 | Mega Eelektross | 758 | `eelektrossite` |
| 765 | Mega Chandelure | 764 | `chandelurite` |
| 781 | Mega Golurk | 780 | `golurkite` |
| 819 | Mega Chesnaught | 818 | `chesnaughtite` |
| 823 | Mega Delphox | 822 | `delphoxite` |
| 829 | Mega Greninja | 826 | `greninjite` |
| 840 | Mega Pyroar | 839 | `pyroarite` |
| 844 | Mega Floette | 842 | `floettite` |
| 854 | Mega Meowstic (M) | 852 | `meowsticite` |
| 855 | Mega Meowstic (F) | 852 | `meowsticite` |
| 866 | Mega Malamar | 865 | `malamarite` |
| 869 | Mega Barbaracle | 868 | `barbaracite` |
| 872 | Mega Dragalge | 871 | `dragalgite` |
| 883 | Mega Hawlucha | 882 | `hawluchanite` |
| 912 | Mega Zygarde | 909 | `zygardite` |
| 914 | Mega Diancie | 913 | `diancite` |
| 938 | Mega Crabominable | 937 | `crabominite` |
| 974 | Mega Golisopod | 973 | `golisopite` |
| 988 | Mega Drampa | 987 | `drampanite` |
| 1013 | Mega Magearna | 1012 | `magearnite` |
| 1014 | Mega Magearna (alt) | 1012 | `magearnite` |
| 1021 | Mega Zeraora | 1020 | `zeraorite` |
| 1103 | Mega Falinks | 1102 | `falinksite` |
| 1203 | Mega Scovillain | 1202 | `scovillainite` |
| 1223 | Mega Glimmora | 1222 | `glimmoranite` |
| 1234 | Mega Tatsugiri (Curly) | 1231 | `tatsugirinite` |
| 1235 | Mega Tatsugiri (Droopy) | 1231 | `tatsugirinite` |
| 1236 | Mega Tatsugiri (Stretchy) | 1231 | `tatsugirinite` |
| 1257 | Mega Baxcalibur | 1256 | `baxcalibrite` |

**Total: 92 rows**

---

#### 6.5-B — Gigantamax Evolution entries (34 rows)

**Rules:**
- `method = 'gigantamax'`
- `condition_value = 'gigantamax-factor'` for all rows
- Toxtricity and Urshifu each have two alternate forms; each maps exclusively to its own G-Max (not branching from default)
- UI display rule: same as Mega — base detail view filters out G-Max rows; G-Max detail shows minimal chain

| gmax_id | G-Max Name | base_id | Notes |
|---------|-----------|---------|-------|
| 5 | Gigantamax Venusaur | 3 | |
| 11 | Gigantamax Charizard | 8 | |
| 16 | Gigantamax Blastoise | 14 | |
| 20 | Gigantamax Butterfree | 19 | |
| 38 | Gigantamax Pikachu | 37 | |
| 78 | Gigantamax Meowth | 75 | |
| 99 | Gigantamax Machamp | 98 | |
| 139 | Gigantamax Gengar | 137 | |
| 145 | Gigantamax Kingler | 144 | |
| 191 | Gigantamax Lapras | 190 | |
| 194 | Gigantamax Eevee | 193 | |
| 206 | Gigantamax Snorlax | 205 | |
| 721 | Gigantamax Garbodor | 720 | |
| 1024 | Gigantamax Melmetal | 1023 | Omitted from original audit list; confirmed in DB |
| 1028 | Gigantamax Rillaboom | 1027 | |
| 1032 | Gigantamax Cinderace | 1031 | |
| 1036 | Gigantamax Inteleon | 1035 | |
| 1042 | Gigantamax Corviknight | 1041 | |
| 1046 | Gigantamax Orbeetle | 1045 | |
| 1055 | Gigantamax Drednaw | 1054 | |
| 1061 | Gigantamax Coalossal | 1060 | |
| 1064 | Gigantamax Flapple | 1063 | |
| 1066 | Gigantamax Appletun | 1065 | |
| 1069 | Gigantamax Sandaconda | 1068 | |
| 1076 | Gigantamax Toxtricity (Amped) | 1074 | Amped default → Amped G-Max only |
| 1077 | Gigantamax Toxtricity (Low-Key) | 1075 | Low-Key alternate → Low-Key G-Max only |
| 1080 | Gigantamax Centiskorch | 1079 | |
| 1088 | Gigantamax Hatterene | 1087 | |
| 1092 | Gigantamax Grimmsnarl | 1091 | |
| 1101 | Gigantamax Alcremie | 1100 | |
| 1116 | Gigantamax Copperajah | 1115 | |
| 1122 | Gigantamax Duraludon | 1121 | |
| 1135 | Gigantamax Urshifu (Single-Strike) | 1133 | Single-Strike default → Single-Strike G-Max only |
| 1136 | Gigantamax Urshifu (Rapid-Strike) | 1134 | Rapid-Strike alternate → Rapid-Strike G-Max only |

**Total: 34 rows**

---

#### 6.5-C — Alternate Form Evolution entries (19 rows)

Selected alternate forms that represent genuine in-game transformations. All other alternate forms were confirmed as form-only variants with no evolution entry needed. All decisions approved by user — see `scripts/output/EVOLUTION_CHAIN_AUDIT.md` Section 4.

**Implementation note:** Exact `pokemon.id` values must be resolved from the DB at implementation time. The implementer must run:
```sql
SELECT id, display_name, form_type, national_dex FROM pokemon
WHERE national_dex IN (382,383,718,744,745,746,778,800,875,877,888,889,964,1017)
ORDER BY national_dex, id;
```
and map by display name to the rows below.

| From Display Name | To Display Name | method | condition_value |
|-------------------|-----------------|--------|-----------------|
| Kyogre (default) | Primal Kyogre | `primal-reversion` | `blue-orb` |
| Groudon (default) | Primal Groudon | `primal-reversion` | `red-orb` |
| Zygarde (10%) | Zygarde Complete | `battle` | `< 50% HP` |
| Zygarde (default/50%) | Zygarde Complete | `battle` | `< 50% HP` |
| Rockruff (Dusk) | Lycanroc (Dusk) | `level-up` | `dusk` |
| Rockruff (default) | Lycanroc (Midnight) | `level-up` | `night` |
| Wishiwashi (default) | Wishiwashi (School) | `battle` | `> 25% HP` |
| Mimikyu (default) | Mimikyu (Busted) | `battle` | `Damage Taken` |
| Necrozma (Dusk-Mane) | Ultra Necrozma | `battle` | `Ultra Burst` |
| Necrozma (Dawn-Wings) | Ultra Necrozma | `battle` | `Ultra Burst` |
| Eiscue (default) | Eiscue (Noice) | `battle` | `Physical Hit` |
| Morpeko (default) | Morpeko (Hangry) | `battle` | `Alternates` |
| Morpeko (Hangry) | Morpeko (default) | `battle` | `Alternates` |
| Zacian (default) | Zacian (Crowned) | `battle` | `Rusty Sword` |
| Zamazenta (default) | Zamazenta (Crowned) | `battle` | `Rusty Shield` |
| Palafin (default) | Palafin (Hero) | `battle` | `Swap Out/In` |
| Ogerpon (default/Teal) | Ogerpon (Teal Tera) | `battle` | `Terastallize` |
| Ogerpon (Wellspring) | Ogerpon (Wellspring Tera) | `battle` | `Terastallize` |
| Ogerpon (Hearthflame) | Ogerpon (Hearthflame Tera) | `battle` | `Terastallize` |
| Ogerpon (Cornerstone) | Ogerpon (Cornerstone Tera) | `battle` | `Terastallize` |

**Total: 20 rows** (19 from audit Section 4 decisions + Ogerpon Cornerstone confirmed; exact IDs resolved at implementation time from the query above)

---

#### 6.5-D — Regional Form Evolution entries (~58 rows)

Regional forms have their own independent evolution chains in the games. All chain structure was confirmed in the audit (Section 2 of `EVOLUTION_CHAIN_AUDIT.md`). The implementer must derive exact `pokemon.id` values from the DB at implementation time.

**Implementation approach:** Rather than hardcoding 58 IDs here, the implementer should:
1. Run `SELECT id, display_name, form_type, national_dex FROM pokemon WHERE form_type = 'regional' ORDER BY national_dex, id;` to get all regional form IDs
2. For each regional form, look up its chain structure in `scripts/output/EVOLUTION_CHAIN_AUDIT.md` Section 2
3. Insert the evolution rows per the chain structure recorded in that document

**Key chain shapes to implement (all confirmed in audit Section 2):**

| Chain | Members | Notes |
|-------|---------|-------|
| Alolan Rattata line | Alolan Rattata → Alolan Raticate | Straight chain |
| Alolan Sandshrew line | Alolan Sandshrew → Alolan Sandslash | Straight chain |
| Alolan Vulpix line | Alolan Vulpix → Alolan Ninetales | Straight chain |
| Alolan Diglett line | Alolan Diglett → Alolan Dugtrio | Straight chain |
| Alolan Meowth line | Alolan Meowth → Alolan Persian | Straight chain |
| Galarian Meowth cross-species | Galarian Meowth → Perrserker (#863) | Cross-species; evolves_to is a different national_dex |
| Hisuian Growlithe line | Hisuian Growlithe → Hisuian Arcanine | Straight chain |
| Alolan Geodude line | Alolan Geodude → Alolan Graveler → Alolan Golem | 3-stage chain |
| Galarian Ponyta line | Galarian Ponyta → Galarian Rapidash | Straight chain |
| Galarian Slowpoke branch | Galarian Slowpoke → Galarian Slowbro; Galarian Slowpoke → Galarian Slowking | Branching chain |
| Galarian Farfetch'd cross | Galarian Farfetch'd → Sirfetch'd (#865) | Cross-species |
| Alolan Grimer line | Alolan Grimer → Alolan Muk | Straight chain |
| Hisuian Voltorb line | Hisuian Voltorb → Hisuian Electrode | Straight chain |
| Alolan Exeggutor | Exeggcute (default) → Alolan Exeggutor | Cross-form; from = default form |
| Alolan Marowak | Cubone (default) → Alolan Marowak | Cross-form; from = default form |
| Galarian Weezing | Koffing (default) → Galarian Weezing | Cross-form; from = default form |
| Galarian Mr. Mime branch | Mime Jr. (default) → Galarian Mr. Mime → Mr. Rime (#866) | Cross-form branch; 3-stage |
| Hisuian Typhlosion | Quilava (default) → Hisuian Typhlosion | Cross-form terminal; pre-evolutions are default |
| Paldean Wooper cross | Paldean Wooper → Clodsire (#980) | Cross-species |
| Hisuian Qwilfish cross | Hisuian Qwilfish → Overqwil (#904) | Cross-species |
| Hisuian Sneasel cross | Hisuian Sneasel → Sneasler (#903) | Cross-species |
| Galarian Corsola cross | Galarian Corsola → Cursola (#864) | Cross-species |
| Galarian Zigzagoon line | Galarian Zigzagoon → Galarian Linoone → Obstagoon (#862) | Cross-species terminal |
| Hisuian Samurott | Dewott (default) → Hisuian Samurott | Cross-form terminal |
| Hisuian Lilligant | Petilil (default) → Hisuian Lilligant | Cross-form terminal |
| Galarian Darumaka line | Galarian Darumaka → Galarian Darmanitan (Standard) | Straight chain; Zen Mode is in-battle form only — no evolution entry |
| Galarian Yamask cross | Galarian Yamask → Runerigus (#867) | Cross-species |
| Hisuian Zorua line | Hisuian Zorua → Hisuian Zoroark | Straight chain |
| Hisuian Braviary | Rufflet (default) → Hisuian Braviary | Cross-form terminal |
| Hisuian Sliggoo line | Goomy (default) → Hisuian Sliggoo → Hisuian Goodra | Cross-form; 3-stage |
| Hisuian Avalugg | Bergmite (default) → Hisuian Avalugg | Cross-form terminal |
| Hisuian Decidueye | Dartrix (default) → Hisuian Decidueye | Cross-form terminal |
| Alolan Raichu | Pikachu (default) → Alolan Raichu | Cross-form terminal |
| Galarian Slowking | Galarian Slowpoke → Galarian Slowking | Already covered in Galarian Slowpoke branch above |

**Total: ~58 rows** (exact count from DB query at implementation time)

---

#### 6.5-E — Cosmetic Form Evolution entries (5 rows)

| pokemon_id | From Display Name | evolves_to_id | To Display Name | method | condition_value |
|-----------|-------------------|--------------|-----------------|--------|-----------------|
| 47 | Nidoran ♀ | 48 | Nidorina | `level-up` | `16` |
| 50 | Nidoran ♂ | 51 | Nidorino | `level-up` | `16` |
| 851 | Espurr | 853 | Meowstic (Female) | `level-up` | `25` |
| 693 | Basculin (White-Striped) | 1150 | Basculegion (Female) | `other` | NULL |
| 1164 | Lechonk | 1166 | Oinkologne (Female) | `level-up` | `18` |

**Total: 5 rows**

**Note on Meowstic, Basculegion, Oinkologne:** The existing male-default evolution rows are already correct and must not be touched. These 5 rows add the female branch only, mirroring the Kirlia→Gardevoir/Gallade branching pattern (two rows from the same `pokemon_id`, one per gender branch).

**Note on Nidoran:** Both Nidorans are the root of their respective 3-stage lines. Nidorina→Nidoqueen and Nidorino→Nidoking rows already exist and must not be touched.

---

#### 6.5 — Implementation summary

The implementer must write a single `seedEvolutionChainGaps(db)` function in `scripts/generateBundledDb.js` covering all five sub-sections. Structure:

```
seedEvolutionChainGaps(db)
  └─ INSERT OR IGNORE INTO pokemon_evolutions (pokemon_id, evolves_to_id, method, condition_value)
     all rows from 6.5-A through 6.5-E
```

For 6.5-C (Alternate) and 6.5-D (Regional), exact `pokemon.id` values must be looked up from the DB at implementation time using the queries specified. All 6.5-A, 6.5-B, and 6.5-E ID values are pre-confirmed and can be hardcoded directly.

---

### 6.6 — Encounter section: smart empty-state messages + non-default form data reuse

This section covers two related UI-layer fixes. Neither requires new DB rows.

---

#### 6.6-A — Smart empty-state messages for Pokémon with no encounter data

**Problem:** The current blanket empty-state message is:

> "{name} cannot be caught in the wild. It is obtained via event, gift, or trade."

This is factually wrong for the majority of affected Pokémon. Venusaur is not obtained via event — it evolves from Ivysaur. Rampardos is not a gift — it is revived from a fossil.

**Solution:** Add an `obtainMethod` prop to `EncounterLocationsSection` (and a corresponding `obtainMethod` field on the Pokémon object passed from `[id].tsx`) that selects the correct empty-state message. No DB schema changes needed — this is derived from data already in the `pokemon` table (`is_legendary`, `is_mythical`, `form_type`, `national_dex`) combined with a hardcoded obtain-method map.

**Obtain-method categories and messages:**

| Category | Empty-state message | Pokémon in this category (Gen 1–8 defaults with no encounter data) |
|----------|--------------------|--------------------------------------------------------------------|
| `evolution-only` | "{name} cannot be caught in the wild. It can only be obtained via evolution." | Venusaur, Blastoise, Meganium, Typhlosion, Feraligatr, Ampharos, Porygon2, Torterra, Infernape, Empoleon, Staraptor, Wormadam, Mothim, Porygon-Z, Probopass, Servine, Pignite, Dewott, Simisage, Simisear, Simipour, Spewpa, Florges, Dartrix, Decidueye, Torracat, Incineroar, Brionne, Primarina, Crabominable, Silvally, Cosmoem, Naganadel, Thwackey, Rillaboom, Raboot, Cinderace, Drizzile, Inteleon, Urshifu, Wyrdeer, Kleavor, Ursaluna, Basculegion, Sneasler, Overqwil, Enamorus |
| `fossil` | "{name} cannot be caught in the wild. It can only be obtained by restoring a fossil." | Rampardos, Bastiodon, Archeops |
| `mythical` | "{name} cannot be caught in the wild. It can only be obtained via a Mystery Gift event." | Phione, Keldeo, Meloetta, Genesect, Diancie, Hoopa, Volcanion, Marshadow, Zeraora, Meltan, Melmetal, Zarude |
| `gen9-unknown` | "{name} encounter data is not yet available." | All 120 Gen 9 defaults (national_dex >= 906) |
| `no-data` | "{name} cannot be caught in the wild." | Fallback for any case not matched above — deliberately vague, avoids false claims |

**Implementation approach:**

1. **`src/utils/pokemonUtils.ts` (or a new `obtainMethodUtils.ts`)** — add a `getObtainMethod(nationalDex, isMythical, generation)` function that returns one of the category strings above. The logic is:
   - If `generation >= 9`: return `'gen9-unknown'`
   - If `nationalDex` is in the hardcoded `FOSSIL_POKEMON` set: return `'fossil'`
   - If `isMythical === true`: return `'mythical'`
   - Otherwise: return `'evolution-only'`
   - Fallback: `'no-data'`

   The hardcoded sets needed:
   ```
   FOSSIL_POKEMON = new Set([409, 411, 567])  // Rampardos, Bastiodon, Archeops
   // (other fossil pokemon already have wild encounter data and won't hit this path)
   ```

2. **`src/components/pokemon/EncounterLocationsSection.tsx`** — add an `obtainMethod?: string` prop. When `versions.length === 0 && !isLoading`, use `obtainMethod` to select the correct message string from a lookup map. Falls back to the `'no-data'` message if prop is absent or unrecognised.

3. **`app/(main)/(pokedex)/[id].tsx`** — compute `obtainMethod` from `pokemon` object and pass to `EncounterLocationsSection`:
   ```tsx
   obtainMethod={getObtainMethod(pokemon.nationalDex, pokemon.isMythical, pokemon.generation)}
   ```

**Note:** `is_legendary` Pokémon that have encounter data (Articuno, Zapdos, etc.) will never hit the empty-state path — they have rows in the DB. The `obtainMethod` prop is only rendered when `versions.length === 0`. Legendaries without encounter data fall through to `'evolution-only'` or `'no-data'` — both are acceptable since the specific message is only shown when the legend has no encounter rows. If more precision is needed for legendaries (e.g. "obtained via in-game event"), a separate category can be added in a follow-up.

**Files to change:** `src/utils/pokemonUtils.ts` (or new util file), `src/components/pokemon/EncounterLocationsSection.tsx`, `app/(main)/(pokedex)/[id].tsx`

**Constraints:**
- No DB changes
- No schema changes
- `obtainMethod` prop is optional — component must degrade gracefully if not passed

---

#### 6.6-B — Non-default forms reuse base form's encounter data

**Problem:** Mega, Gigantamax, Alternate, and Cosmetic forms have zero encounter rows in `pokemon_encounter_locations`. Their detail screens currently show the empty-state message. By game mechanics, these forms share their base form's encounter locations — a player encounters Charizard, not Mega Charizard.

**Solution:** When the encounter hook is called for a non-default form, resolve the default form's DB `id` for the same `national_dex` and query encounter rows using that ID instead. No new DB rows required.

**Implementation approach:**

The `useEncounterGameVersions` and `useEncounterLocations` hooks in `src/hooks/queries/useEncounterLocations.ts` both receive a `pokemonId` (DB `id`). Add an intermediate resolution step:

1. Pass two props to `EncounterLocationsSection` from `[id].tsx`:
   - `pokemonId` — already present (the DB `id` of the current form, used as the route param)
   - `formType` — `pokemon.formType` (e.g. `'mega'`, `'gigantamax'`, `'default'`, etc.)
   - `nationalDex` — `pokemon.nationalDex`

2. Inside `EncounterLocationsSection`, add a `useDefaultFormId` sub-query: when `formType !== 'default'`, query the DB for the `id` of the same `national_dex` with `form_type = 'default'`. Use that resolved ID for both encounter hooks. When `formType === 'default'`, use `pokemonId` directly (no change to current behaviour).

   ```sql
   SELECT id FROM pokemon WHERE national_dex = ? AND form_type = 'default' ORDER BY id LIMIT 1
   ```

3. The `obtainMethod` logic from 6.6-A applies to the base form — a non-default form with no encounter rows for its base will also show the smart empty-state message.

**Query cache key:** The encounter hooks already use `pokemonId` as part of their cache key. When the resolved ID is the default form's ID, the cache is shared with the default form's detail screen — no duplicate fetches.

**Files to change:** `src/hooks/queries/useEncounterLocations.ts` (add `useDefaultFormId` hook), `src/components/pokemon/EncounterLocationsSection.tsx` (wire the resolution), `app/(main)/(pokedex)/[id].tsx` (pass `formType` and `nationalDex` props)

**Constraints:**
- No DB changes
- The base-form ID resolution query must be `staleTime: Infinity` to avoid re-fetching on every render
- Do not modify the encounter hooks' SQL — only the ID passed in changes

---

#### 6.6-C — FlavorTextSection empty state for forms with unavailable entries

**Problem:** After Section 6.2 is implemented, battle-only forms will correctly show base-form flavor text. But ~137 forms (regional, most alternates, cosmetic gender variants, Nidoran ♀/♂) will still return zero flavor text rows. The `FlavorTextSection` component currently has no empty state — it either renders version buttons or renders nothing. These forms need an appropriate message rather than a blank section.

**Solution:** Add an empty state to `FlavorTextSection` that renders when `flavorTexts.length === 0`. The message should acknowledge the form specifically:

> "Pokédex entries for {name} are not yet available."

This is intentionally neutral — it does not claim the form has no entries (it does in the games), just that they haven't been added yet.

**Implementation approach:**

`FlavorTextSection` receives flavor texts as a prop or via a hook. When the array is empty after loading is complete, render the empty-state message in the same style as the encounter empty state (`fontSize.md`, `colors.textMuted`, `fontStyle: 'italic'`, `textAlign: 'center'`).

**Files to change:** `src/components/pokemon/FlavorTextSection.tsx` only.

**Constraints:**
- No DB changes
- Only render the empty state when loading is complete and the array is confirmed empty — not during loading

---

### 6.7 — Mega Stone items missing from `items` table

**Scope:** 92 Mega Stone items — 47 classic (Gen 6/7, `isNonstandard: 'Past'`) and 45 Z-A (`isNonstandard: 'Future'`). None are currently in the `items` table.

**Root cause:** The items seeding loop in `generateBundledDb.js` filters `if (item.isNonstandard || item.num <= 0) continue`. All mega stones are tagged `isNonstandard` and are silently dropped. This is the same filter that drops the Z-A mega abilities (Section 6.1).

**Data source:** `@pkmn/dex` `Dex.items.all()` — all 92 stones have `exists: true`, correct `num`, `id` (slug), `name`, `desc`, `shortDesc`, and `gen`. No PokeAPI calls needed.

**Complete list of 92 stones (slug | num):**

*Classic Gen 6/7 stones (isNonstandard: Past):*

| slug | num | Display Name |
|------|-----|--------------|
| `venusaurite` | 659 | Venusaurite |
| `charizarditex` | 660 | Charizardite X |
| `charizarditey` | 678 | Charizardite Y |
| `blastoisinite` | 661 | Blastoisinite |
| `beedrillite` | 770 | Beedrillite |
| `pidgeotite` | 762 | Pidgeotite |
| `alakazite` | 679 | Alakazite |
| `slowbronite` | 760 | Slowbronite |
| `gengarite` | 656 | Gengarite |
| `kangaskhanite` | 675 | Kangaskhanite |
| `pinsirite` | 671 | Pinsirite |
| `gyaradosite` | 676 | Gyaradosite |
| `aerodactylite` | 672 | Aerodactylite |
| `mewtwonitex` | 662 | Mewtwonite X |
| `mewtwonitey` | 663 | Mewtwonite Y |
| `ampharosite` | 658 | Ampharosite |
| `steelixite` | 761 | Steelixite |
| `scizorite` | 670 | Scizorite |
| `heracronite` | 680 | Heracronite |
| `houndoominite` | 666 | Houndoominite |
| `tyranitarite` | 669 | Tyranitarite |
| `sceptilite` | 753 | Sceptilite |
| `blazikenite` | 664 | Blazikenite |
| `swampertite` | 752 | Swampertite |
| `gardevoirite` | 657 | Gardevoirite |
| `sablenite` | 754 | Sablenite |
| `mawilite` | 681 | Mawilite |
| `aggronite` | 667 | Aggronite |
| `medichamite` | 665 | Medichamite |
| `manectite` | 682 | Manectite |
| `sharpedonite` | 759 | Sharpedonite |
| `cameruptite` | 767 | Cameruptite |
| `altarianite` | 755 | Altarianite |
| `banettite` | 668 | Banettite |
| `absolite` | 677 | Absolite |
| `glalitite` | 763 | Glalitite |
| `salamencite` | 769 | Salamencite |
| `metagrossite` | 758 | Metagrossite |
| `latiasite` | 684 | Latiasite |
| `latiosite` | 685 | Latiosite |
| `lopunnite` | 768 | Lopunnite |
| `garchompite` | 683 | Garchompite |
| `lucarionite` | 673 | Lucarionite |
| `abomasite` | 674 | Abomasite |
| `galladite` | 756 | Galladite |
| `audinite` | 757 | Audinite |
| `diancite` | 764 | Diancite |

*Z-A mega stones (isNonstandard: Future):*

| slug | num | Display Name |
|------|-----|--------------|
| `raichunitex` | 2635 | Raichunite X |
| `raichunitey` | 2636 | Raichunite Y |
| `clefablite` | 2559 | Clefablite |
| `victreebelite` | 2560 | Victreebelite |
| `starminite` | 2561 | Starminite |
| `dragoninite` | 2562 | Dragoninite |
| `meganiumite` | 2563 | Meganiumite |
| `feraligite` | 2564 | Feraligite |
| `skarmorite` | 2565 | Skarmorite |
| `froslassite` | 2566 | Froslassite |
| `heatranite` | 2567 | Heatranite |
| `darkranite` | 2568 | Darkranite |
| `emboarite` | 2569 | Emboarite |
| `excadrite` | 2570 | Excadrite |
| `scolipite` | 2571 | Scolipite |
| `scraftinite` | 2572 | Scraftinite |
| `eelektrossite` | 2573 | Eelektrossite |
| `chandelurite` | 2574 | Chandelurite |
| `chesnaughtite` | 2575 | Chesnaughtite |
| `delphoxite` | 2576 | Delphoxite |
| `greninjite` | 2577 | Greninjite |
| `pyroarite` | 2578 | Pyroarite |
| `floettite` | 2579 | Floettite |
| `malamarite` | 2580 | Malamarite |
| `barbaracite` | 2581 | Barbaracite |
| `dragalgite` | 2582 | Dragalgite |
| `hawluchanite` | 2583 | Hawluchanite |
| `zygardite` | 2584 | Zygardite |
| `zeraorite` | 2586 | Zeraorite |
| `falinksite` | 2587 | Falinksite |
| `chimechite` | 2637 | Chimechite |
| `absolitez` | 2638 | Absolite Z |
| `staraptite` | 2639 | Staraptite |
| `garchompitez` | 2640 | Garchompite Z |
| `lucarionitez` | 2641 | Lucarionite Z |
| `golurkite` | 2642 | Golurkite |
| `meowsticite` | 2643 | Meowsticite |
| `crabominite` | 2644 | Crabominite |
| `golisopite` | 2645 | Golisopite |
| `magearnite` | 2646 | Magearnite |
| `scovillainite` | 2647 | Scovillainite |
| `baxcalibrite` | 2648 | Baxcalibrite |
| `tatsugirinite` | 2649 | Tatsugirinite |
| `glimmoranite` | 2650 | Glimmoranite |
| `drampanite` | 2585 | Drampanite |

**Implementation approach:**

In `generateBundledDb.js`, after the existing `insertItems()` transaction, add a supplemental `INSERT OR IGNORE` block that iterates all items where `item.megaStone` is defined and `item.isNonstandard !== 'CAP'`. Source all field values from `Dex.items.get(slug)`: use `item.num` as `id`, `item.id` as `name`, `item.name` as `display_name`, `'mega-stone'` as `category`, `item.desc` as `description`, `item.shortDesc` as `short_description`, `null` as `cost`.

Do not change the existing `isNonstandard` filter — add the 92 records as an explicit supplement after the loop, same pattern as Section 6.1 abilities.

**Files to change:** `scripts/generateBundledDb.js` only (additive)

**Constraints:**
- `INSERT OR IGNORE` only — never modify existing item rows
- Do not change the existing items seeding filter
- No PokeAPI calls — all data from `@pkmn/dex`
- Category value: `'mega-stone'` (consistent with the `category` column's use as a display/filter hint)

**Verification:** After rebuild and `DATA_VERSION` bump: `SELECT COUNT(*) FROM items WHERE category = 'mega-stone'` should return 92.

---

## Section 7 — Implementation Order

Recommended sequence when approval is given:

| Step | Task | Section | Effort | Implementation Target | Notes |
|------|------|---------|--------|------------------------|-------|
| 1 | Fix false positives in audit script | 5.1 | Low | `scripts/auditPokemonData.js` | Script-only; enables cleaner audit runs |
| 2 | Seed evolution chain entries for form variants | 6.5 | Medium | `scripts/generateBundledDb.js` | ~220 rows; no PokeAPI calls; 6.5-A/B/E IDs hardcoded, 6.5-C/D IDs from DB query |
| 3 | Smart encounter empty-state messages | 6.6-A | Low | `src/utils/`, `EncounterLocationsSection.tsx`, `[id].tsx` | UI-only; no DB changes; accurate per-Pokémon obtain-method messages |
| 4 | Non-default forms reuse base encounter data | 6.6-B | Low | `useEncounterLocations.ts`, `EncounterLocationsSection.tsx`, `[id].tsx` | UI-only; no DB changes; resolves base form ID at query time |
| 5 | Pokédex entries: battle-only forms use base text | 6.2 | Low | `pokemonSpeciesRepository.ts` | UI-only; no DB changes; mega/gmax/3 battle alternates resolve base form ID |
| 6 | FlavorTextSection empty state for unavailable entries | 6.6-C | Low | `FlavorTextSection.tsx` | UI-only; neutral message for ~137 deferred forms |
| 7 | Seed encounter locations for regional forms | 6.4 | Medium | `scripts/generateBundledDb.js` | 58 forms; moderate PokeAPI volume; Hisuian treated same as Alolan/Galarian |
| 8 | Seed 92 Mega Stone items | 6.7 | Low | `scripts/generateBundledDb.js` | 47 classic + 45 Z-A; all from @pkmn/dex; no PokeAPI calls |
| 9 | Seed abilities for 8 non-default forms | 6.1 | Low | `scripts/generateBundledDb.js` | 8 forms; best run after 6.7 since same isNonstandard filter pattern |
| 10 | Seed moves for regional/alternate forms | 6.3 | High | `scripts/generateBundledDb.js` | 125 PokeAPI fetches + 9 SQL copies; largest volume |
| 11 | Manual Pokédex entries for ~137 forms | 4.7 | Manual | Pending | Deferred — all regional, most alternate, cosmetic gender variants, Nidorans |
| 12 | Z-A mega move gaps | 4.4 | Manual | Pending | Deferred — source TBD |

---

## Section 8 — Verification Protocol

After implementation of each step:

1. Run `node scripts/generateBundledDb.js` to rebuild the bundled DB.
2. Commit `assets/db/championdex.db`.
3. Bump `DATA_VERSION` and `BUNDLED_DATA_VERSION` in `src/services/database/seedDatabase.ts`.
4. Run audit and record new gap counts:
   ```bash
   node scripts/auditPokemonData.js
   ```
5. Device verification: Test at least one affected form on a real or simulated device:
   - Navigate to the form's detail screen
   - Confirm the previously missing data is now present
   - Take a screenshot for the changelog
6. Update the changelog in this document with:
   - Step number
   - What was changed
   - New gap counts per category
   - Device test screenshot or result

---

## Section 9 — Resolved Decisions & Remaining Open Questions

### Resolved

| # | Question | Decision |
|---|----------|----------|
| 1 | Z-A mega move gaps (~5 forms) | Deferred — source TBD |
| 2 | Regional form flavor text | Fetch distinct regional species text from PokeAPI (Option B) |
| 3 | Evolution chain gaps for all 439 non-default forms | Full audit complete — all forms reviewed; seeding gaps identified and spec'd in Section 6.5 |
| 4 | Alternate form moves scope | Include alternate forms alongside regional forms in the same step |

### Remaining Open Questions

No open questions — all items resolved as of 2026-07-21.

---

## Section 10 — Additional Notes for Implementation Team

- All fixes are implemented as additions to `scripts/generateBundledDb.js` — the build-time script that generates the pre-packaged SQLite database.
- After each fix is implemented, run `node scripts/generateBundledDb.js` to rebuild the bundled DB, then commit `assets/db/championdex.db`.
- Bump `DATA_VERSION` and `BUNDLED_DATA_VERSION` in `src/services/database/seedDatabase.ts` after each bundled DB rebuild.
- No code may modify or delete existing data — only INSERT OR IGNORE.
- Concurrent fetch operations must respect PokeAPI rate limits (recommend batch-of-10 pattern with 100ms delay between batches already established in the script).
- After all steps are complete, run a final full audit: `node scripts/auditPokemonData.js` and confirm gap counts match expected zero or "expected by design" categories.
- Notify team and update HANDOFF.md when implementation is complete.
