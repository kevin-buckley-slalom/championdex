# Data Gap Remediation — Implementation Plan

**Status:** Pre-implementation — awaiting approval  
**Spec:** `DATA_GAP_REMEDIATION_SPEC.md` v1.9  
**Date:** 2026-07-21

Each phase groups related work. Within each phase, tasks are ordered by dependency. Every task has explicit pass/fail acceptance criteria that can be verified without visual inspection where possible, plus a device test for UI tasks.

**DB patching protocol (Phase 2–4):** Use `node scripts/patchBundledDb.js` to modify `assets/db/championdex.db` in place. Do NOT run the full `generateBundledDb.js` for data-gap tasks — that is reserved for schema changes and fresh builds only. After patching, bump `DATA_VERSION` + `BUNDLED_DATA_VERSION`, run SQL acceptance criteria and audit script, then wait for explicit user approval before committing `assets/db/championdex.db` to git.

---

## Phase 1 — Audit Script & Infrastructure
*No DB changes. No device testing needed. Unblocks clean audit runs for all subsequent phases.*

### Task 1.1 — Fix false positives in audit script ✅ COMPLETE
**Spec:** Section 5.1  
**File:** `scripts/auditPokemonData.js`  
**Change:** Added `knownNoEncounterDex` set in constructor, populated by querying the DB for default-form Gen 1–8 non-legendary/non-mythical Pokémon with zero encounter rows. In `auditForm()` step 8, these are excluded from the gap count. In `generateReason()`, they return a descriptive non-actionable reason.

**Result:**
- `encounter_locations` gap count: **453 → 403** (50 false positives suppressed)
- 50 suppressed forms: starters and final evolutions, fossil Pokémon (Rampardos, Bastiodon, Archeops), evolution-only forms, Legends Arceus exclusives
- All 403 remaining gaps are legitimate: 58 regional + 76 alternate + 34 gigantamax + 97 mega + 6 cosmetic + 120 Gen 9 + 12 mythical defaults
- Script completes without error

**Acceptance criteria:**
- [x] `node scripts/auditPokemonData.js` completes without error
- [x] Encounter gap count reduced from 453 to 403
- [x] No previously-clean Pokemon are newly flagged

---

## Phase 2 — DB-only seeding (no PokeAPI, no UI changes)
*All tasks in this phase modify only `generateBundledDb.js` with hardcoded or local-library data. Fast to run; no API rate limits.*

### Task 2.1 — Seed 92 Mega Stone items
**Spec:** Section 6.7  
**File:** `scripts/generateBundledDb.js`  
**Change:** Add supplemental `INSERT OR IGNORE` block after `insertItems()` for all 92 mega stones sourced from `Dex.items.all()` where `item.megaStone` is defined and `item.isNonstandard !== 'CAP'`. Category = `'mega-stone'`.

**Acceptance criteria (SQL):**
- [ ] `SELECT COUNT(*) FROM items WHERE category = 'mega-stone'` → **92**
- [ ] `SELECT id, name FROM items WHERE name = 'venusaurite'` → returns 1 row (classic stone present)
- [ ] `SELECT id, name FROM items WHERE name = 'meganiumite'` → returns 1 row (Z-A stone present)
- [ ] `SELECT COUNT(*) FROM items WHERE category = 'mega-stone' AND name LIKE '%ite%'` → 92 (all are -ite stones)
- [ ] Total items count increases by exactly 92 from pre-task baseline

---

### Task 2.2 — Seed 8 missing abilities + 8 missing ability records
**Spec:** Section 6.1  
**File:** `scripts/generateBundledDb.js`  
**Change:** After `insertAbilities()`, add hardcoded `INSERT OR IGNORE` for 8 ability records: Tablets of Ruin (id 286), Beads of Ruin (id 287), Piercing Drill (311), Dragonize (312), Eelevate (313), Mega Sol (315), Fire Mane (316), Spicy Spray (318). Then the existing `abilityNameToId` map rebuild and `pokemon_abilities` link step will find them on the next run.

**Acceptance criteria (SQL):**
- [ ] `SELECT COUNT(*) FROM abilities WHERE id IN (286,287,311,312,313,315,316,318)` → **8**
- [ ] `SELECT COUNT(*) FROM pokemon_abilities WHERE pokemon_id IN (1261,1264,224,232,670,759,840,1203)` → **8** (one ability row per pokemon)
- [ ] `SELECT p.name, a.display_name FROM pokemon p JOIN pokemon_abilities pa ON pa.pokemon_id = p.id JOIN abilities a ON a.id = pa.ability_id WHERE p.name = 'wochien'` → returns `Tablets of Ruin`
- [ ] `SELECT p.name, a.display_name FROM pokemon p JOIN pokemon_abilities pa ON pa.pokemon_id = p.id JOIN abilities a ON a.id = pa.ability_id WHERE p.name = 'chiyu'` → returns `Beads of Ruin`
- [ ] Audit script abilities gap count drops from 8 to **0**

**Device test:**
- [ ] Navigate to Wo-Chien detail screen → Abilities section shows "Tablets of Ruin"
- [ ] Navigate to Mega Excadrill detail screen → Abilities section shows "Piercing Drill"

---

### Task 2.3 — Seed evolution chain entries for form variants (~220 rows)
**Spec:** Section 6.5  
**File:** `scripts/generateBundledDb.js`  
**Change:** Add `seedEvolutionChainGaps(db)` function with five sub-steps:
- **6.5-A:** 92 Mega evolution rows (all with correct stone slugs; Mega Rayquaza = NULL)
- **6.5-B:** 34 Gigantamax rows
- **6.5-C:** 19 selected Alternate form rows (IDs resolved from DB at run time)
- **6.5-D:** ~58 Regional form rows (chain shapes per audit; IDs resolved from DB)
- **6.5-E:** 5 Cosmetic form rows (Nidoran ♀, Nidoran ♂, Espurr female branch, Basculin White-Striped, Lechonk)

**Acceptance criteria (SQL):**
- [ ] Total new rows: `SELECT COUNT(*) FROM pokemon_evolutions WHERE method = 'mega-evolution'` → **92**
- [ ] `SELECT COUNT(*) FROM pokemon_evolutions WHERE method = 'gigantamax'` → **34**
- [ ] Spot check — Mega Venusaur: `SELECT condition_value FROM pokemon_evolutions WHERE pokemon_id = 3 AND evolves_to_id = 4` → `venusaurite`
- [ ] Spot check — Mega Meganium: `SELECT condition_value FROM pokemon_evolutions WHERE evolves_to_id = 224` → `meganiumite`
- [ ] Spot check — Mega Rayquaza: `SELECT condition_value FROM pokemon_evolutions WHERE evolves_to_id = 494` → `NULL`
- [ ] Spot check — GMax Charizard: `SELECT condition_value FROM pokemon_evolutions WHERE method = 'gigantamax' AND pokemon_id = 8` → `gigantamax-factor`
- [ ] Spot check — Alolan Vulpix: `SELECT COUNT(*) FROM pokemon_evolutions WHERE pokemon_id = 57` → **1** (evolves to Alolan Ninetales)
- [ ] Spot check — Nidoran ♀: `SELECT evolves_to_id FROM pokemon_evolutions WHERE pokemon_id = 47` → resolves to Nidorina's DB id
- [ ] Audit script evolution_chain gap count drops to **0** for all seeded forms
- [ ] No duplicate rows: `SELECT pokemon_id, evolves_to_id, COUNT(*) FROM pokemon_evolutions GROUP BY pokemon_id, evolves_to_id HAVING COUNT(*) > 1` → **0 rows**

**Device test:**
- [ ] Navigate to Charizard detail → Evolution chain shows Mega Charizard X and Mega Charizard Y as branches, each labelled with their stone
- [ ] Navigate to Mega Venusaur detail → Evolution chain shows Venusaur → Mega Venusaur labelled "venusaurite"
- [ ] Navigate to Alolan Vulpix detail → Evolution chain shows Alolan Ninetales
- [ ] Navigate to Nidoran ♀ detail → Evolution chain shows Nidorina branch

---

## Phase 3 — UI fixes (no DB changes)
*All tasks are query-layer or component-only changes. Can be done in any order within the phase; no DB rebuild needed.*

### Task 3.1 — Smart encounter empty-state messages
**Spec:** Section 6.6-A  
**Files:** new `src/utils/pokemonObtainMethod.ts`, `src/components/pokemon/EncounterLocationsSection.tsx`, `app/(main)/(pokedex)/[id].tsx`  
**Change:** Add `getObtainMethod(nationalDex, isMythical, generation)` utility returning one of `'evolution-only'` | `'fossil'` | `'mythical'` | `'gen9-unknown'` | `'no-data'`. Wire into `EncounterLocationsSection` to show the appropriate message when `versions.length === 0`.

Messages:
- evolution-only → *"{name} is obtained by evolving {base}. It cannot be caught in the wild."*
- fossil → *"{name} is obtained by reviving a fossil. It cannot be caught in the wild."*
- mythical → *"{name} is a Mythical Pokémon. It is obtained via special event or distribution."*
- gen9-unknown → *"Wild encounter data for {name} is not yet available."*
- no-data → *"{name} cannot be caught in the wild. It is obtained via event, gift, or trade."* (current message — kept as fallback)

**Acceptance criteria:**
- [ ] `FOSSIL_POKEMON` set covers exactly Rampardos (#409), Bastiodon (#411), Archeops (#567) — verify in code
- [ ] Navigate to Venusaur detail → encounter section shows evolution-only message (not the blanket "event, gift, or trade")
- [ ] Navigate to Arcanine detail → encounter section shows evolution-only message (Arcanine does not evolve further but is obtained by evolving Growlithe)

*Wait — Arcanine is obtained by using a Fire Stone on Growlithe, not evolution from wild. Let me clarify:* the evolution-only set covers Pokemon that appear in the DB with zero encounters because they only appear via evolution, not wild. Venusaur is the right test case here.

- [ ] Navigate to Kabuto/Omanyte detail → encounter section shows fossil message
- [ ] Navigate to Mew detail → encounter section shows mythical/event message
- [ ] Navigate to Sprigatito detail (Gen 9) → encounter section shows "encounter data not yet available" message
- [ ] Navigate to Charizard detail → encounter section still shows game version selector and encounter data (no regression)
- [ ] No existing Pokemon with encounter data show a blank section or wrong message

---

### Task 3.2 — Non-default forms reuse base encounter data
**Spec:** Section 6.6-B  
**Files:** `src/hooks/queries/useEncounterLocations.ts`, `src/components/pokemon/EncounterLocationsSection.tsx`, `app/(main)/(pokedex)/[id].tsx`  
**Change:** Add `useDefaultFormId(nationalDex, formType)` hook. When `formType !== 'default'`, resolve `SELECT id FROM pokemon WHERE national_dex = ? AND form_type = 'default' ORDER BY id LIMIT 1` and pass that ID to the encounter hooks. `staleTime: Infinity`.

**Acceptance criteria:**
- [ ] Navigate to Mega Charizard X detail → encounter section shows the same game versions and locations as regular Charizard
- [ ] Navigate to Gigantamax Pikachu detail → encounter section shows same data as regular Pikachu
- [ ] Navigate to Alolan Vulpix detail → encounter section shows empty-state (Alolan Vulpix has no encounter data — correctly shows smart message from Task 3.1, not the old wrong message)
- [ ] Navigate to regular Charizard detail → no regression; encounter data unchanged
- [ ] `useDefaultFormId` hook SQL verified: `staleTime: Infinity` confirmed in code review (no re-fetches on navigate)

---

### Task 3.3 — Pokédex entries: battle-only forms use base form text
**Spec:** Section 6.2  
**File:** `src/services/database/pokemonSpeciesRepository.ts`  
**Change:** In `getPokemonSpeciesData(pokemonId)`, detect if the form is `form_type IN ('mega', 'gigantamax')` OR `name IN ('mimikyubusted', 'eiscuenoice', 'morpekohangry')`. If so, resolve the default form's ID via `SELECT id FROM pokemon WHERE national_dex = ? AND form_type = 'default' ORDER BY id LIMIT 1` and use that for both `pokemon_flavor_text` and `pokemon_evolutions` queries.

**Acceptance criteria:**
- [ ] Navigate to Mega Venusaur detail → Pokédex entries section shows Venusaur's flavor text
- [ ] Navigate to Gigantamax Charizard detail → Pokédex entries section shows Charizard's flavor text
- [ ] Navigate to Mimikyu Busted detail → Pokédex entries section shows Mimikyu's flavor text
- [ ] Navigate to regular Venusaur detail → flavor text unchanged (no regression)
- [ ] Navigate to Alolan Vulpix detail → flavor text section shows empty state (not Vulpix's fire-type text — Alolan Vulpix is NOT a battle-only form)

---

### Task 3.4 — FlavorTextSection empty state
**Spec:** Section 6.6-C  
**File:** `src/components/pokemon/FlavorTextSection.tsx`  
**Change:** When `flavorTexts.length === 0` and loading is complete, render: *"Pokédex entries for {name} are not yet available."* Styled as `fontSize.md`, `colors.textMuted`, `fontStyle: 'italic'`, `textAlign: 'center'`. Must not render during loading.

**Acceptance criteria:**
- [ ] Navigate to Alolan Vulpix detail → Pokédex section shows "Pokédex entries for Alolan Vulpix are not yet available."
- [ ] Navigate to Primal Kyogre detail → Pokédex section shows empty state message
- [ ] Navigate to regular Vulpix detail → Pokédex section shows flavor text entries (no regression)
- [ ] Navigate to Mega Venusaur detail (after Task 3.3) → Pokédex section shows Venusaur's text, NOT the empty state
- [ ] No loading flash: empty state does not appear momentarily before text loads on a Pokemon that has entries

---

## Phase 4 — PokeAPI seeding (network-dependent)
*These tasks make PokeAPI calls during `generateBundledDb.js`. Run once, commit the resulting DB. Do not re-run unnecessarily.*

### Task 4.1 — Seed encounter locations for 58 regional forms
**Spec:** Section 6.4  
**File:** `scripts/generateBundledDb.js`  
**Change:** Add `fetchRegionalEncounters(db)` step targeting `form_type = 'regional'`. Fetch `/pokemon/{pokeapi_id}/encounters` for each. Use same max-chance-per-location/method/version aggregation as existing encounter seeding. `INSERT OR IGNORE`.

**Acceptance criteria (SQL):**
- [ ] `SELECT COUNT(DISTINCT pokemon_id) FROM pokemon_encounter_locations WHERE pokemon_id IN (SELECT id FROM pokemon WHERE form_type = 'regional')` → greater than 0 (at minimum Alolan forms have data)
- [ ] Spot check — Alolan Vulpix (DB id 57): `SELECT COUNT(*) FROM pokemon_encounter_locations WHERE pokemon_id = 57` → greater than 0
- [ ] Spot check — Galarian Zapdos (DB id 210): `SELECT COUNT(*) FROM pokemon_encounter_locations WHERE pokemon_id = 210` → **0** (Galarian birds have no wild encounters; empty state from Task 3.1/3.2 handles this correctly)
- [ ] No existing encounter rows for default forms were modified: total default form encounter rows unchanged from pre-task baseline

**Device test:**
- [ ] Navigate to Alolan Vulpix detail → encounter section shows game version selector with data
- [ ] Navigate to Galarian Zapdos detail → encounter section shows appropriate empty-state message (mythical/legendary — no wild encounters)

---

### Task 4.2 — Seed moves for 134 regional and alternate forms
**Spec:** Section 6.3  
**File:** `scripts/generateBundledDb.js`  
**Change:** Add `seedNonDefaultMovesets(db)` with four sub-steps in order:
1. **6.3-C SQL copies (5 pairs):** Burmy Sandy/Trash (from Burmy 526), Rockruff Dusk (from Rockruff 945), Necrozma Dusk Mane/Dawn Wings (from Necrozma 1008)
2. **6.3-A + 6.3-B PokeAPI fetches (125 forms):** all regional/alternate except the 9 copy/tera forms; DB IDs 124 and 827 use hardcoded slugs (`farfetchd-galar`, `greninja-battle-bond`)
3. **6.3-D SQL tera copies (4 pairs):** Ogerpon tera forms from corresponding mask forms (must run after step 2)

**Acceptance criteria (SQL):**
- [ ] `SELECT COUNT(DISTINCT pokemon_id) FROM pokemon_moves WHERE pokemon_id IN (SELECT id FROM pokemon WHERE form_type = 'regional')` → **58**
- [ ] `SELECT COUNT(DISTINCT pokemon_id) FROM pokemon_moves WHERE pokemon_id IN (SELECT id FROM pokemon WHERE form_type = 'alternate')` → **76**
- [ ] Spot check — Alolan Vulpix (DB id 57): `SELECT COUNT(*) FROM pokemon_moves WHERE pokemon_id = 57` → greater than 0
- [ ] Spot check — Galarian Farfetch'd (DB id 124): `SELECT COUNT(*) FROM pokemon_moves WHERE pokemon_id = 124` → **62**
- [ ] Spot check — Greninja Bond (DB id 827): `SELECT COUNT(*) FROM pokemon_moves WHERE pokemon_id = 827` → **101**
- [ ] Spot check — Necrozma Dusk Mane (DB id 1009): `SELECT COUNT(*) FROM pokemon_moves WHERE pokemon_id = 1009` = `SELECT COUNT(*) FROM pokemon_moves WHERE pokemon_id = 1008` (same count as base Necrozma — SQL copy)
- [ ] Spot check — Ogerpon Wellspring Tera (DB id 1282): `SELECT COUNT(*) FROM pokemon_moves WHERE pokemon_id = 1282` = `SELECT COUNT(*) FROM pokemon_moves WHERE pokemon_id = 1278` (same count as Ogerpon Wellspring)
- [ ] No existing default-form move rows modified: `SELECT COUNT(*) FROM pokemon_moves WHERE pokemon_id IN (SELECT id FROM pokemon WHERE form_type = 'default')` unchanged from pre-task baseline
- [ ] Audit script moves gap drops to **0** for regional and alternate form types

**Device test:**
- [ ] Navigate to Alolan Vulpix detail → Moves section populated with move list
- [ ] Navigate to Galarian Farfetch'd detail → Moves section populated
- [ ] Navigate to Necrozma Dusk Mane detail → Moves section populated
- [ ] Navigate to regular Pikachu detail → Moves section unchanged (no regression)

---

## Phase 5 — Deferred (manual sourcing — not in scope for this implementation sprint)

### Task 5.1 — Pokédex entries for ~137 forms
**Spec:** Section 4.7  
**Status:** Deferred. Requires manual sourcing session from Bulbapedia for 58 regional + ~73 alternate + 4 cosmetic gender variants + 2 Nidoran forms.  
**Pre-condition:** Task 3.4 must be complete so these forms show the empty state rather than nothing.

### Task 5.2 — Move data for ~5 Z-A megas with no PokeAPI data
**Spec:** Section 4.4  
**Status:** Deferred. Source not yet decided.

---

## Summary checklist

| Phase | Task | Type | Spec | Status |
|-------|------|------|------|--------|
| 1 | 1.1 Fix audit script false positives | Script | 5.1 | ✅ Complete |
| 2 | 2.1 Seed 92 Mega Stone items | DB | 6.7 | ✅ Complete |
| 2 | 2.2 Seed 8 missing abilities | DB | 6.1 | ✅ Complete |
| 2 | 2.3 Seed ~220 evolution chain rows | DB | 6.5 | ✅ Complete |
| 3 | 3.1 Smart encounter empty-state messages | UI | 6.6-A | ✅ Complete |
| 3 | 3.2 Non-default forms reuse base encounter data | UI | 6.6-B | ✅ Complete |
| 3 | 3.3 Battle-only forms use base Pokédex text | UI | 6.2 | ✅ Complete |
| 3 | 3.4 FlavorTextSection empty state | UI | 6.6-C | ✅ Complete |
| 4 | 4.1 Seed encounter locations for 58 regional forms | DB+API | 6.4 | ✅ Complete |
| 4 | 4.2 Seed moves for 134 regional/alternate forms | DB+API | 6.3 | ✅ Complete |
| — | Bug A: Mega/Gigantamax empty Moves section | UI | — | ✅ Complete |
| — | Bug B: 7 forms with wrong pokeapi_id (sprites) | DB patch | — | ✅ Complete |
| — | Bug C: Nidoran-F/M wrong form_type + missing data | DB+API | — | ✅ Complete |
| — | Bug D: 4 female cosmetic forms missing moves | DB+API | — | ✅ Complete |
| — | Bug E: Unown letter forms missing from Other Forms section | UI | — | ✅ Complete |
| — | Bug F: Past moves filtered from moves table (Hidden Power etc.) | DB rebuild | — | ✅ Complete — 207 Past moves added (876 total) |
| — | Bug G: Burmy Sandy/Trash sprites (no PokeAPI form sprites exist) | Manual | — | 🔴 Deferred — source needed |
| — | Bug H: Female cosmetic forms evolution chain (cosmetic/alternate exclusion) | UI | — | ✅ Complete |
| — | Bug I: Basculegion wrong pre-evolution (red-stripe → white-stripe) | DB patch | — | ✅ Complete |
| 5 | 5.1 Manual Pokédex entries (~137 forms) | Manual | 4.7 | 🔴 Deferred |
| 5 | 5.2 Z-A mega move data (~5 forms) | Manual | 4.4 | 🔴 Deferred |
