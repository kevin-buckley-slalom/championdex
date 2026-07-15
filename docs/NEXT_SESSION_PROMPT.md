# Next Session Prompt — ChampionDex

Read `docs/HANDOFF.md` in full before doing anything else.

---

## Working contract — non-negotiable

**Delegation:** You are the overseer/PM. You do not write application code. All code changes go to specialist agents (`voltagent-lang:expo-react-native-expert` for RN/Expo work) with a precise brief that includes exact file paths, exact lines to change, and exact reason why. Before briefing any agent, read the relevant source files yourself so your brief is grounded in current code state, not memory or assumption.

**Validation:** "Looks correct" is never acceptable evidence. Every claim must be proven:
- TypeScript: `npx tsc --noEmit` — zero errors required before any work is reported complete
- Sprite/data changes: run `node scripts/validateSpriteUrls.js` and confirm 89/89 HTTP 200
- Seed/enrichment changes: run all four scripts in `scripts/` and show output
- UI changes: require device confirmation from me before closing the task — I test, you don't declare victory

**No assumptions about device state:** The device DB may differ from code. When behaviour is unexpected, add diagnostic logs and read them before forming a theory.

**Cache awareness:** React Query is configured with `staleTime: Infinity, refetchOnMount: false`. Any hook whose URL logic or data shape changes needs its query key version bumped or the old cached result will be served forever.

**Documentation:** When any feature is marked complete, update BOTH `docs/HANDOFF.md` AND the relevant spec doc (e.g. `docs/DETAIL_VIEWS_SPEC.md`) before moving on. Stale specs cause future agents to build the wrong things.

**Communication:** Short and direct. No summaries of what you just did. State what you found, what you changed, and what needs testing. One sentence per update while working.

---

## Current state (as of 2026-07-14)

Phase 3 (Detail Views) is ~90% complete. REQ-029 (Location Encounters) completed and validated last session.

**Next task: Add Legends Z-A mega forms to the database and lists.**

---

## Task: Legends Z-A Mega Forms

### Background

49 new mega evolution forms from Pokémon Legends: Z-A exist in **both** `@pkmn/dex` and PokeAPI (IDs 10278–10326), but are currently excluded from our database. They are blocked by a single filter line in `seedDatabase.ts` that drops all `isNonstandard === 'Future'` species. These forms should appear in the Pokémon list screens and in RelatedFormsSection on detail screens, exactly as existing megas (Venusaur-Mega, etc.) do today.

All 49 forms have confirmed HTTP 200 home render sprites at `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/{pokeApiId}.png`.

### Root cause

In `src/services/database/seedDatabase.ts`, the `excluded` check appears in 4 functions:
```typescript
const excluded = species.isNonstandard === 'CAP' || species.isNonstandard === 'Future' || species.isNonstandard === 'Custom';
```
All 49 Z-A forms have `isNonstandard: 'Future'` in `@pkmn/dex`. This filter runs in:
1. `seedPokemonBaseData` — blocks them from being seeded
2. `writePokeApiEnrichment` — blocks flavor text / evolution enrichment
3. `prefetchPokeApiIds` — blocks PokeAPI ID lookup for alternate forms
4. `prefetchPokeApiSpeciesData` — blocks species data fetch

### Before delegating

Read `src/services/database/seedDatabase.ts` in full to confirm:
- The exact line numbers of each `excluded` check
- The current value of `DATA_VERSION`
- The current list of `sync_metadata` keys written by `startPokeApiEnrichment` streams

Then brief `voltagent-lang:expo-react-native-expert` to make these changes to `seedDatabase.ts`:

**1. Add `FUTURE_FORM_ALLOWLIST` constant** near `FORM_EXCLUSION_SET`:
```typescript
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
```

**2. Update the `excluded` check in all 4 functions:**
```typescript
const excluded = (species.isNonstandard === 'CAP' || species.isNonstandard === 'Future' || species.isNonstandard === 'Custom')
  && !FUTURE_FORM_ALLOWLIST.has(species.name);
```

**3. Bump `DATA_VERSION`** to the next minor version (check current value in file first — was `'1.9.0'` at last read, so bump to `'1.10.0'`). This forces a re-seed on existing devices to insert the new rows.

**4. Add `runZAFormsEnrichmentBackfill` function** gated by `za_forms_enrichment_v1` sync_metadata key. Pattern after `runMovesBackfill`. Should:
- Skip if `za_forms_enrichment_v1 = 'done'`
- Query `SELECT id, pokeapi_id FROM pokemon WHERE name IN (... all 49 names ...)` to get DB IDs after seed
- For each, fetch `/api/v2/pokemon/{pokeapi_id}/` from PokeAPI to get move data
- Write moves via `INSERT OR IGNORE INTO pokemon_moves` — validate each move ID exists in `moves` table first (same pattern as `runMovesBackfill`)
- Set `za_forms_enrichment_v1 = 'done'` when complete
- Wire as a 5th concurrent stream in `startPokeApiEnrichment`
- All network fetches via `withSemaphore` from `@/services/database/enrichmentSemaphore`, batches of 10 with 50ms sleep per batch that had network activity

**Why a targeted backfill rather than clearing existing enrichment gates:**
`pokeapi_enrich_version` and `moves_backfill_v1` are already done for 1025 Pokémon — clearing them would re-fetch everything. The targeted backfill for exactly these 49 forms is safe, fast (~5 network requests), and precise.

### Validation checklist (overseer runs these, not the user)

1. `npx tsc --noEmit` — zero errors
2. `node scripts/validateSeedData.js`
3. `node scripts/validateEvolutionDisplay.js`
4. `node scripts/auditAlternateForms.js`
5. `node scripts/findMisclassifiedForms.js`
6. Manually verify `determineFormType` returns `'mega'` for the new forms — the function uses `name.includes('-mega')`, which should cover all new entries. Check `Absol-Mega-Z`, `Garchomp-Mega-Z`, `Lucario-Mega-Z` explicitly — the `-z` suffix means the name contains `-mega-z`, which still includes `-mega`, so should be fine.

Then hand off to user for device confirmation:
- Hawlucha-Mega appears in the Pokémon list screen
- Hawlucha-Mega appears in RelatedFormsSection on Hawlucha's detail screen
- Hawlucha-Mega detail screen shows correct type (Fighting/Flying) and artwork

### After Z-A forms validated

Update `docs/HANDOFF.md` and `docs/DETAIL_VIEWS_SPEC.md`, then proceed to REQ-032.

---

## After Z-A forms: REQ-032 Visual Quality

See `docs/DETAIL_VIEWS_SPEC.md` section 2.14 for the full checklist. This is the final item before Phase 3 is marked complete.

---

## Key facts

**Enrichment steady state (warm launch console output):**
```
[Database] Starting enrichment streams concurrently...
[Database] PokeAPI enrichment already complete
[Database] Classification backfill already complete
[Database] Moves backfill already complete
[Database] Encounters backfill already complete
```
After Z-A work, a 5th line should appear: `[Database] Z-A forms enrichment already complete`

**sync_metadata keys in use:**
- `data_version` — base seed version (bump to `'1.10.0'` for Z-A work)
- `pokeapi_enrich_version = '1.2.0'` — flavor text + evolutions — do NOT bump
- `classification_backfill_v1 = 'done'`
- `moves_backfill_v1 = 'done'`
- `encounters_backfill_v1 = 'done'`
- `species_enriched_backfill_v1 = 'done'`

**Design tokens:**
```
background: #111010  surface: #1E1A1A  surfaceElevated: #2A2323
border: #3A2E2E      borderLight: #4D3E3E
text: #F5EEEE        textSecondary: #B89E9E  textMuted: #9A7A7A
primary: #CC0000     accent: #FFD700
```

**React Query:** `staleTime: Infinity, refetchOnMount: false, refetchOnWindowFocus: false, refetchOnReconnect: false`

**Path aliases:** `@/` → `src/`, `@assets/` → `assets/`, `@app/` → `app/`

**Sprite / artwork URLs:**
```
Artwork: https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${pokeApiId}.png
Shiny:   https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/shiny/${pokeApiId}.png
```

**Do NOT:**
- Put network calls inside `withTransactionAsync`
- Declare seed changes complete without running all 4 validation scripts
- Use `Animated` from react-native (use Reanimated)
- Use `resizeMode` on expo-image (use `contentFit`)
- Use `useFocusEffect` on list screens
- Store sprite URLs in the DB
- Use flexbox `gap` shorthand on View (unreliable in RN — use margin on children)
- Edit code files directly as overseer — all changes go to specialist agents
- Bump `ENRICH_VERSION` for anything other than needing to re-fetch flavor text + evolutions for all 1025 Pokémon
