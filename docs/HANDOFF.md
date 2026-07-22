# ChampionDex — Session Handoff Notes
**Updated:** 2026-07-22 | DB v1.28.0 committed. Phase 5 data gap remediation complete and device-verified. Remaining deferred items: Burmy Sandy/Trash sprites (no PokeAPI sprites exist — manual source needed), Z-A mega move data (~5 forms, blocked until PokeAPI updates), regional encounter locations for Hisuian/Paldean forms (PokeAPI returns empty — correct empty state shown).

---

## Project Overview
Cross-platform Pokémon companion app (Expo SDK 57 / React Native, iOS + Android).
- **Spec docs:** `docs/` folder — REQUIREMENTS.md, DESIGN.md, DESIGN_SYSTEM.md, TECHNICAL_ARCHITECTURE.md, ROADMAP.md, TASKS.md
- **Stack:** Expo Router v3, expo-sqlite, @tanstack/react-query, @shopify/flash-list, @pkmn/dex (bundled data), i18next

---

## Phase Status

### Phase 0 — Scaffolding ✅
### Phase 1 — Data Layer ✅ COMPLETE (seed stable, enrichment working, diagnostic logs removed)
### Phase 2 — Reference List Screens ✅ COMPLETE AND LOCKED — do not modify
### Phase 3 — Detail Views 🔄 ACTIVE (~95% complete — see detail below)

---

## ✅ Resolved: Seed UNIQUE constraint bug

Fixed — warm launches are clean. See Known Issues section at bottom for resolution details.

---

## ✅ CURRENT STATE — DEVICE-VERIFIED (as of 2026-07-20)

DB v1.18.0. 279 unit tests pass. All changes below confirmed on device.

### Changes since last device-verified state (v1.15.0 → v1.18.0):

1. **CREATE TABLE fix** (`initializeDatabase.ts`) — `gender_rate` and `species_classification` columns present in CREATE TABLE block (not just ALTER TABLE).

2. **Form display names fully corrected** (`generateBundledDb.js` + `pokemonUtils.ts` + `[id].tsx`):
   - `computeFormLabel` now returns `formName` for `default` form_type when set (Lycanroc → "Midday Form", Aegislash → "Shield Forme", Zygarde → "50%", etc.)
   - Regional: `"Alolan Vulpix"` with no form label; compound regionals (Galarian Darmanitan, Paldean Tauros) use `DISPLAY_NAME_OVERRIDES` for display_name, qualifier as form_name
   - Mega: `"Mega Charizard X"` with no form label; Mega-Z same pattern; "Female" label if form_name='F'
   - Gigantamax: `"Gigantamax Venusaur"` with no form label
   - Primal: `"Primal Kyogre"` with no form label (alternate form_type, form_name='Primal' suppressed in computeFormLabel)
   - Cosmetic F: display_name = base species, form label = "Female" (except Nidoran ♀/♂ which have symbols in display_name — no label)
   - Alternate: `"Calyrex"` + `"Ice Rider"`, `"Ogerpon"` + `"Cornerstone Mask"`, etc. (baseName as display_name)
   - Ogerpon form_names use spaces: `"Cornerstone Mask"` not `"Cornerstone-Mask"`; Oricorio-Pa'u override key fixed (apostrophe)
   - Maushold-Four and Dudunsparce-Three-Segment **excluded from DB** (added to FORM_EXCLUSION_SET)
   - classification row placed below form label, above type chips

3. **Android fresh install fix** — `withSQLiteFsync` config plugin at `plugins/withSQLiteFsync.ts` was created in a prior session but never registered in `app.json`. Added `"./plugins/withSQLiteFsync"` to the plugins array. Plugin patches `SQLiteModule.kt` at Android build time to call `fsync()` after `importDatabaseFromAssetAsync`'s file copy. **Requires a dev build** (`npx expo run:android`) — Expo Go is insufficient.

4. **Ogerpon PokeAPI IDs fixed** — All 8 Ogerpon forms previously had `pokeapi_id=1017` due to wrong PokeAPI slugs. `generatePokeApiSlug` now appends `-mask` for the three non-tera mask forms (`ogerpon-wellspring-mask` etc.). Tera forms use hardcoded overrides: wellspring=10273, hearthflame=10274, cornerstone=10275, teal-tera=1017.

5. **Slug validation tests added** — `src/utils/__tests__/generatePokeApiSlug.test.ts` (34 tests). These guard against future slug regressions before they reach the DB.

6. **Unit tests** — 279 tests total: `pokemonUtils.test.ts` (44) + `formData.test.ts` (107) + `generatePokeApiSlug.test.ts` (34) + existing (94).

7. **Bundled DB at v1.18.0** — `BUNDLED_DATA_VERSION` and `DATA_VERSION` bumped to force DB replacement on device.

**Device verification completed 2026-07-20:**
1. ✅ Android fresh install: loads without "database disk image is malformed"
2. ✅ All form label categories: default-with-label, regional, mega, compound regional, gigantamax, primal, cosmetic-F, Nidoran, alternate — all correct
3. ✅ Ogerpon: all 8 forms navigate to detail screen without crash
4. ✅ Classification displays below form label, above type chips

---

## Architecture: Data Loading (DATA_VERSION: '1.18.0')

### Bundled DB Strategy (improved 2026-07-17 with integrity verification)
- `assets/db/championdex.db` (~44 MB) — pre-built SQLite DB committed to git, contains all Pokémon with 5-column `pokemon_moves` schema + height data (decimeters)
- Fresh install: `importDatabaseFromAssetAsync` (expo-sqlite) copies DB on first launch (~2.8s one-time copy); no PokeAPI fetches on first run
- Warm launch: version check + **integrity verification** → if healthy, returns immediately (~50ms); if corrupt, force-overwrites
- Artwork/encounters enrichment runs fire-and-forget in Phase 2 (background, non-blocking)
- List uses `useInfiniteQuery` with page size 50 — first 50 rows render immediately
- Phase 1 (`initializeDatabasePhase1`) blocks render; Phase 2 (`initializeDatabase`) is fire-and-forget after setIsReady
- Height data: fetched from PokeAPI `/pokemon/{pokeapi_id}/` for all forms during DB generation, stored in decimeters; `unitConversions.ts` converts to ft/in and m for display — **verified working on device in bundled DB v1.13.0**
- **To rebuild bundled DB:** `node scripts/generateBundledDb.js` → commit `assets/db/championdex.db` → bump `DATA_VERSION`
- **IMPORTANT — Code Preservation Rule:** Never delete or revert code in `generateBundledDb.js` that you did not write. This script has accumulated sections added by different tasks (height fetch, form exclusion, move pool updates, etc.). All sections are load-bearing. If reverting a recent change, preserve sections from earlier work.

### Database Initialization Flow (with version-based overwrite)

```
app/_layout.tsx → initializeDatabase()  [blocks render, single promise guard prevents double-run]
  → copyBundledDbIfNeeded()              [import if missing]
  → getDatabase()                        ← openDatabaseAsync('championdex.db')
  → Version check: SELECT data_version FROM sync_metadata
      ← Compare on-device version with BUNDLED_DATA_VERSION ('1.15.0')
      ← If mismatch OR DB corrupt/malformed → replaceDb():
          ├─ Close cached connection (db = null)
          ├─ deleteDatabaseAsync('championdex.db') — removes main + WAL/SHM atomically
          ├─ importDatabaseFromAssetAsync with forceOverwrite: true
          └─ Set forceNewConnection = true to bypass openDatabaseAsync cache on next getDatabase()
      ← If match → proceed immediately (warm launch fast path ~50ms)
  → SELECT data_version FROM sync_metadata (second call via getDatabase())
      if present → return                 ← base data seeded
      if missing → CREATE TABLE IF NOT EXISTS × 12 + seedDatabase(db)  ← fresh install only
  → runMigrations()                      ← schema migrations + one-time pruning
  → startPokeApiEnrichment(db, dex)      ← fire-and-forget enrichment streams
→ setIsReady(true) → app renders
→ startArtworkPrefetch()                 ← fire-and-forget artwork prefetch
```

**Key Fix (2026-07-17):** Database initialization consolidated from Phase 1/2 split to single `initializeDatabase()` function with one promise guard preventing double-run. Initialization now blocks render (guaranteed DB ready before app displays). The orphan index crash was caused by partial imports where the sentinel was written before verifying the DB was healthy. Now:
- Pre-import integrity check detects and recovers from corrupt DB (same version, corrupt file)
- Post-import verification ensures the import succeeded before writing sentinel
- Orphan index errors are caught early and trigger automatic recovery

**Version constants:**
- `DATA_VERSION = '1.28.0'` — Phase 5 complete; all regional/alternate/female form Pokédex entries seeded; evolution condition_values filled; encounter duplicate constraint added
- `BUNDLED_DATA_VERSION = '1.28.0'` — tracks bundled DB installation; triggers version-check overwrite on mismatch
- `ENRICH_VERSION = '1.2.0'` — independent; only bump if PokeAPI data needs re-fetch

**Critical constraint:** ALL network calls must happen BEFORE `withTransactionAsync`.

---

## Form Exclusion Architecture

`FORM_EXCLUSION_SET` in `seedDatabase.ts` — keyed by `species.name` (exact case from @pkmn/dex).
`POKEAPI_SLUG_EXCLUSION_SET` — separate set for PokeAPI slug network call skipping.

Forms excluded from DB (will be shown in UI from @pkmn/dex at display time — future phase):
- **Cosmetic alternates:** Vivillon patterns (19), Alcremie flavors (7), Minior colors (7), Deerling seasonal (3), Shellos-East, Gastrodon-East, Cramorant-Gulping/Gorging, Pichu-Spiky-eared, Cherrim-Sunshine, Magearna-Original, Zarude-Dada, Squawkabilly colors (3), Poltchageist-Artisan, Sinistcha-Masterpiece, Sinistea-Antique, Polteageist-Antique
- **Type variants:** Arceus×17, Silvally×17, Genesect×4, Castform×3
- **Fully removed:** Totem forms (10), Pikachu event/cap forms (14), Pikachu-Alola, Raticate/Marowak Alola-Totems, Eevee-Starter, Pikachu-Starter

New UI sections spec'd in `docs/DETAIL_VIEWS_SPEC.md` section 2.10:
- `CosmeticAlternatesSection` — sprite grid, no navigation, sourced from @pkmn/dex
- `TypeVariantsSection` — sprite + type chip, sourced from @pkmn/dex

---

## ✅ RESOLVED — Hero Section Redesign Complete (2026-07-14)

### What's Implemented
1. **VitalInfoOverlay** (52px tall overlay at hero bottom):
   - Left box: dex number only (`#001` format), fontSize 28, fontWeight 800, vertically centered
   - Right box: 44×44 transparent placeholder for star button
   - Layout: `flexDirection: row, justifyContent: space-between, alignItems: center`

2. **VitalInfoBorder** (SVG + View border frame):
   - Left vertical bar: plain View, `position: absolute, top: 0, left: 1, width: 1.5, bottom: overlayHeight`, backgroundColor typeColor
   - Bottom SVG: pinned at `bottom: 0`, draws horizontal line with curved transitions into diagonal walls
   - Notch geometry: leftSlopeOffset=24, rightSlopeOffset=14, cornerRadius r=6
   - Two closed fill paths using cardSurfaceColor (opaque solid matching hero fade final color)
   - Main stroke: typeColor, strokeWidth 1.5

3. **RoundedStar** (custom 5-point star SVG):
   - 36px glyph with rounded tips via quadratic bezier curves
   - outerR=size/2*0.88, innerR=size/2*0.38, cy shifted down by size*0.05
   - Rounding: r=outerR*0.12 at tips, ri=innerR*0.25 at valleys
   - Gold `#FFD700` filled when shiny, `rgba(255,255,255,0.7)` outlined when normal

4. **Star Button** (floating toggle at hero bottom-right):
   - Position: `absolute, bottom: 0, right: spacing.md (16px), width: 44, height: 52, alignItems/justifyContent: center`
   - Wrapped in Animated.View with scale pop animation (1→1.4→1.0, 200ms total)
   - Particle burst on shiny ON: 6 gold stars at 60° intervals, burst 140px outward (500ms)
   - Disabled when no shiny variant or shinyReady=false

5. **Shiny Transition** (white flash silhouette 260ms):
   - Flash fade in 80ms to opacity 1, image swaps at peak white, flash fades out 180ms
   - Smooth psychic shimmer effect without jarring cuts

6. **Hero Fade Gradient** (LinearGradient at hero bottom):
   - Colors: `[rgba(0,0,0,0), rgba(0,0,0,0.08), rgba(0,0,0,0.3), rgba(17,16,16,0.85), cardSurfaceColor, cardSurfaceColor]`
   - Locations: `[0, 0.25, 0.5, 0.72, 0.85, 1.0]`
   - Final stop uses cardSurfaceColor (computed per-type in [id].tsx)

7. **cardSurfaceColor Computation** (ambient blending):
   - Radial types (water, grass, psychic, ghost, dragon): `#111010` (pure background)
   - Linear types: `blendWithBackground(ambient.color, ambient.opacity)` (tinted solid color)

8. **Gigantamax Backdrop Priority**:
   - `getBackdropAsset(type, pokemonId, formType)` now accepts formType
   - Gigantamax returns `stadium` backdrop regardless of type

### Validated On-Device (2026-07-14)
- Star button pops on press (1.0→1.4→1.0 smooth animation)
- White flash on shiny toggle (80ms → 180ms fade) with image swap at midpoint
- Particle burst: 6 stars radiate outward when toggling TO shiny
- Parallax smooth 60fps on iOS iPhone 12+
- VitalInfoOverlay measures correctly for border SVG geometry
- VitalInfoBorder renders notch with correct diagonal slopes and corner radii
- Hero collapses from 340px to 100px with artwork fade 1.0→0.6
- Backdrop parallax 0.25x, artwork parallax 0.5x, gradient overlay intensifies 0→0.7

### Files Changed
- `src/components/pokemon/PokemonHero.tsx` — complete rewrite with VitalInfoOverlay/Border integration
- `src/components/pokemon/VitalInfoOverlay.tsx` — new overlay component
- `src/components/pokemon/VitalInfoBorder.tsx` — new SVG border frame
- `app/(main)/(pokedex)/[id].tsx` — cardSurfaceColor computation, PokemonHero props

---

## ✅ RESOLVED — Info Section and Abilities Section Complete (2026-07-14)

### InfoStrip Component (Rebuilt)
- **Single row of 4 columns**: HEIGHT, WEIGHT, GEN, GENDER
- **Column flex ratios**: HEIGHT=flex:2, WEIGHT=flex:2, GEN=flex:1, GENDER=flex:3, gap:16
- **Column structure** (top-to-bottom per column):
  - Label: 10px muted uppercase, opacity 0.6, letterSpacing 2
  - Primary value: 18px bold white
  - Secondary value: 11px muted
- **HEIGHT/WEIGHT**: Imperial on top (primary), metric below (secondary)
- **GEN**: Roman numeral as primary, empty secondary placeholder
- **GENDER**: 
  - Bar: 6px height, borderRadius 3, `marginTop: 12` (vertical centering with primary values)
  - Male (left): #6890F0 blue, proportional flex
  - Female (right): #FF6FA0 pink, proportional flex
  - Percentages below bar (left/right aligned)
  - Genderless variant: neutral gray bar
- **Legendary/Mythical badge** (conditional, row above): centered, gold/magenta star/glyph + text, uppercase
- File: `src/components/pokemon/InfoStrip.tsx`

### AbilitiesSection Component (New)
- **Two-column layout**: ABILITIES (regular) | HIDDEN (hidden abilities)
- **Column visibility**: HIDDEN column only renders if hidden abilities exist
- **Each row**:
  - 2px accent bar (18px tall, centered, typeColor)
  - Ability name (18px bold)
  - Chevron › (21px, marginLeft:24)
  - Name width locked to longest name in column via `onLayout` measurement
- **Tappable rows**: navigate to ability detail (onAbilityPress callback)
- File: `src/components/pokemon/AbilitiesSection.tsx`

### StatChart Component (Updated)
- **No internal horizontal padding** (removed paddingHorizontal)
- **Label styling**:
  - "BASE STATS" header: fontSize.xs (11px), fontWeight 600, textMuted, uppercase, letterSpacing 1.5
  - Stat labels: fontSize 11px, fontWeight 600, opacity 0.7, uppercase, letterSpacing 1
  - DEFENSE label: left-aligned (textAlign: 'left')
  - All other labels: right-aligned within fixed DEFENSE label width
  - Fixed width measured from DEFENSE label via onLayout
- **Bar gradient**: slice of gradient clipped to `barTrackWidth` (not `containerWidth` — accounts for label + value columns); colors `['#A71D1D','#FF7D2A','#FFC629','#90D440','#4CAF50','#00BCD4']` at locations `[0, 0.167, 0.306, 0.472, 0.667, 1.0]` — stops anchored to stat thresholds <30 / ≥30 / ≥55 / ≥85 / ≥120
- **Numeric stat value**: width 30px, fontSize 15, fontWeight 700, textAlign right, fontFamily Menlo, accentColor
- **Animations**: bar width/opacity interpolate from 0 per-row (60ms stagger)
- File: `src/components/pokemon/StatChart.tsx`

### Detail Screen Layout (Complete, [id].tsx)
- Hero section (PokemonHero with parallax, star button integrated)
- Name + Classification row (inline, name 36px bold, classification italic right-aligned)
- Type badges (width="fixed", size="md", 110px each)
- **InfoStrip** — 4-column single-row layout (height/weight/gen/gender), optional legendary/mythical badge
- **AbilitiesSection** — two-column abilities/hidden, tappable → ability detail
- Base Stats chart (animated gradient bar, stagger entrance 60ms per row)
- Type Effectiveness table (tabbed defense/offense, 4-tier severity colors, stagger animation)
- Evolution chain (tree layout, linear chains as single row, branching chains as stacked rows with connectors)
- Related forms, Cosmetic alternates, Type variants (3-column grids, tappable → form detail)
- Pokédex entries (FlavorTextSection, bottom-sheet modal per game version)
- Location encounters (EncounterLocationsSection, bottom-sheet modal per game version, newest-first)
- **Moveset section** (collapsible learn-method groups, game version selector, search with clear button)

---

## ✅ RESOLVED — Enrichment re-fetch loop + pipeline performance (2026-07-13)

### What was fixed
1. **ENRICH_VERSION gate** — `ENRICH_VERSION` constant now matches `'1.2.0'` written in device DBs. Gate passes immediately on warm launch.
2. **No-evolution cache miss (P0)** — Added `species_enriched INTEGER` column to `pokemon` table. `prefetchPokeApiSpeciesData` now skips a species on Tier 1 (`species_enriched = 1`) before falling back to flavor text + evolution count checks. 575 terminal species no longer trigger false cache misses. Backfill via `runMigrations` + `species_enriched_backfill_v1` sync_metadata key.
3. **Sequential 50ms sleep (P1)** — All five prefetch/backfill functions now process in concurrent batches of 10 via `Promise.all`. 50ms rate-limit sleep fires once per batch, only when the batch made at least one network request. First-run enrichment reduced from ~5–6 min to ~60–90s.

### Validated on device (cold launch steady state)
```
[Database] Data already seeded
[Database] PokeAPI enrichment already complete
```
No batch logs, no network activity. Species counts confirmed: 1025 enriched, 2 network fetches on the healing pass (previously missing species), 0 on all subsequent launches.

### sync_metadata keys written by this work
- `species_enriched_backfill_v1` = 'done' — one-time backfill of species_enriched column
- `p1_validation_run` = 'done' — artefact of validation testing, safe to ignore

---

## Phase 3 Status (Detail Views)

### DONE ✅
- Navigation: Expo Router stack inside `(pokedex)/_layout.tsx` — all 4 detail screens stack-pushable from list screens
- **Pokemon Detail** `app/(main)/(pokedex)/[id].tsx` — parallax hero (PokemonHero), shiny toggle (ShinyToggle), type badges, dex/classification/height/weight, abilities section (tappable), StatChart (animated bar chart), EvolutionChain (tree layout, all 16 triggers), RelatedFormsSection (3-col grid), CosmeticAlternatesSection (3-col grid), TypeVariantsSection (3-col grid), FlavorTextSection (bottom sheet modal), EncounterLocationsSection (bottom sheet modal, 280dp scrollable list)
- **Move Detail** `app/(main)/(pokedex)/moves/[id].tsx` — name, type badge, category icon, power/accuracy/PP/priority grid, description
- **Ability Detail** `app/(main)/(pokedex)/abilities/[id].tsx` — name, generation badge, hidden ability indicator, description
- **Item Detail** `app/(main)/(pokedex)/items/[id].tsx` — name, sprite, category, cost, description (**complete**)
- Hooks: `usePokemonDetail`, `useMoveDetail`, `useAbilityDetail`, `useItemDetail`, `usePokemonAbilities`, `usePokemonSpeciesData`, `useRelatedForms`, `useEvolutionChain`
- Components: `PokemonHero`, `ShinyToggle`, `StatChart`, `TypeEffectivenessTable`, `RelatedFormsSection`, `FlavorTextSection`, `EvolutionChain`, `BackdropParticleLayer`

### STILL TODO ❌ (in priority order)
1. **Info Section Design** (Height, Weight, Generation, Gender Ratio, Legendary/Mythical status) ✅ COMPLETE
   - `InfoStrip` component already implemented in `src/components/pokemon/InfoStrip.tsx`
   - Design spec: `docs/INFO_SECTION_DESIGN_SPEC.md` (comprehensive reference for implementation validation, accessibility, edge cases, QA checklist)
   - Component provides: transparent background, vertical rows, fixed-width right-aligned labels, bold values, gender pill bar (male/female proportion), conditional legendary/mythical status row
   - Currently in use: `app/(main)/(pokedex)/[id].tsx` lines 287–295
   - Visual treatment: muted uppercase labels, white bold values, gender pill (blue male / pink female), gold legendary / magenta mythical status badges
   - Accessibility: screen reader narration for gender ratio, WCAG AA contrast compliance, semantic structure

1. **Classification display** (REQ-028) ✅ ALREADY DONE — `[id].tsx` line 188 already renders italic textMuted classification below name

2. **Moveset Section** (REQ-019) ✅ COMPLETE — search with clear button (✕), game version selector (bottom-border button, slide-up modal with generations grouped newest-first), 5 collapsible learn-method groups (Level Up, TM & HM, Egg Moves, Tutor, Special) each showing move count, all sections start expanded, level-up moves show `"Lv. X"` badge (gold accent color), machine moves show `learn_label` badge in blue (e.g. `"TM068"`, `"TR000"`, `"HM003"`), move rows with type badge + category icon + power/accuracy/PP, tappable → MoveDetail

3. **Pokemon list on Move Detail** (REQ-020) ✅ DONE — `usePokemonWithMove` hook + FlashList with sprites, type badges, learn method; tappable rows → Pokemon detail

4. **Pokemon list on Ability Detail** (REQ-022) ✅ DONE — `usePokemonWithAbility` hook + FlashList with sprites, type badges, hidden ability badge, generation filter chips

5. **CosmeticAlternatesSection** (REQ-026, spec 2.10) ✅ COMPLETE
   - `src/components/pokemon/CosmeticAlternatesSection.tsx` — 3-column explicit-width grid (cardWidth computed from screenWidth - 14 accentBarWrapper offset - section padding - card margins), section title "OTHER FORMS" (canonical header style), transparent sprite containers (no grey box)
   - `src/hooks/queries/useFormVariants.ts` — queries @pkmn/dex for excluded forms; FORM_POKEAPI_IDS map + FORM_SLUG_OVERRIDES map for correct sprite URLs
   - Validated: 89/89 excluded forms have verified HTTP 200 sprite URLs (script: `node scripts/validateSpriteUrls.js`)
   - Query cache key: `['pokemon', 'form-variants', 'v5', nationalDex]`

6. **TypeVariantsSection** (REQ-027, spec 2.10) ✅ COMPLETE
   - `src/components/pokemon/TypeVariantsSection.tsx` — same 3-column explicit-width grid, section title "TYPE FORMS" (canonical header style), TypeBadge `size="sm" fixed` per form, name label removed (type chip is sufficient)
   - Same hook (`useFormVariants`) and same sprite resolution logic

7. **Location Encounters** (REQ-029, spec 2.11) ✅ COMPLETE
   - `pokemon_encounter_locations` table in schema + migration guard for existing installs
   - `runEncountersBackfill(db)` — 4th concurrent enrichment stream, gated on `encounters_backfill_v1` sync_metadata key
   - `src/hooks/queries/useEncounterLocations.ts` — `useEncounterLocations(pokemonId, gameVersion)` + `useEncounterGameVersions(pokemonId)`
   - `src/components/pokemon/EncounterLocationsSection.tsx` — bottom-border version selector row + slide-up bottom sheet modal (same pattern as FlavorTextSection), versions grouped by generation newest-first, encounter list in 280dp max-height ScrollView, location cards (semi-transparent bg, no left accent border), ActivityIndicator loading state
   - Query cache keys: `['pokemon', 'encounters', 'v1', pokemonId, gameVersion]` and `['pokemon', 'encounter-versions', 'v1', pokemonId]`
   - Known data gap: PokeAPI has no encounter data for most Gen 9 paradox Pokémon (e.g. Iron Boulder) and no Legends Z-A data — see PokeAPI data gap notes below

8. **TypeEffectivenessTable** (W-005) ✅ COMPLETE (2026-07-15)
   - `src/components/pokemon/TypeEffectivenessTable.tsx` — tabbed defense/offense chart, placed after StatChart before Evolution
   - `src/constants/typeEffectiveness.ts` — `TYPE_EFFECTIVENESS_CHART` (18×18 offensive matrix, Gen 9), `calcDefenseEffectiveness`, `calcOffenseEffectiveness`; five data errors corrected (steel/normal, steel/poison, bug/normal, bug/poison, ghost/fighting all fixed to reflect offensive direction only)
   - **Layout**: two bands of 9 types each (alphabetical); each band = Row A (type squares) + Row B (value boxes); 4px gap between rows, 6px between bands
   - **Type squares**: `${typeColor}60` bg, `${typeColor}99` border, warm near-white label `rgba(255,238,238,0.90)`, 16×16 type icon in tab, stagger entrance animation (0.7→1.0 spring, 20ms per square), press scale animation
   - **Value boxes**: same dimensions as type squares; four severity tiers — moderate (½/2×): `${roleColor}40` bg + `${roleColor}99` border; extreme (¼/4×): same opacity, distinct color; immune (0): `colors.surface` bg + `${colors.textSecondary}CC` border; neutral (1×): transparent bg + `colors.border` outline only
   - **Color tiers**: extremeGood `#07a70c`, good `#B2FF59`, bad `#FF6D00`, extremeBad `#f40d09`; all value text `${colors.text}CC`
   - **Tab bar**: three equal-width `flex:1` tabs; active = 2px bottom border (defense: `colors.primary`, offense: type color); inactive = no border; no shadows; fontSize.md (15px); type icon (16×16) left of type name on offense tabs
   - **Animations**: tab switch = fade out 150ms + slide 20px, then fade in; grid entrance staggered per square on tab change

9. **Legends Z-A Mega Forms** — ✅ COMPLETE (2026-07-14)
   - `FUTURE_FORM_ALLOWLIST` constant added to `seedDatabase.ts` with all 49 Z-A forms
   - `excluded` check updated in all 6 locations to respect the allowlist
   - `DATA_VERSION` bumped `'1.9.0'` → `'1.10.0'`; triggers re-seed on existing devices
   - `runZAFormsEnrichmentBackfill` added as 5th concurrent stream in `startPokeApiEnrichment`, gated by `za_forms_enrichment_v1` sync_metadata key
   - Device confirmed: Hawlucha-Mega in Pokémon list, in RelatedFormsSection on Hawlucha, detail screen correct; warm launch shows `[Database] Z-A forms enrichment already complete`

10. **Backdrop Particle System** (REQ-025a) 🔄 IN PROGRESS
    - `src/components/pokemon/BackdropParticleLayer.tsx` — ambient looping particle layer; sits between vignette scrim and artwork (Layer 3b)
    - `src/constants/typeBackdrops.ts` — exports `getBackdropKey()` (same priority logic as `getBackdropAsset` but returns string key); lookup tables hoisted to module-level constants
    - `PokemonHero` accepts `particlesEnabled?: boolean` (default `true`) — set `false` to disable all particles instantly
    - `PARTICLE_CONFIGS` map in `BackdropParticleLayer.tsx` gates which backdrop keys have particles — add a key to enable a new type
    - All animations use Reanimated 3 (`useSharedValue`/`useAnimatedStyle`/`useAnimatedProps`). All shared values declared unconditionally at top level (fixed pool of 6 slots). `AnimatedPath = createAnimatedComponent(Path)` declared at module level.
    - **Grass ✅ COMPLETE** — 5 leaves, 5–7.4s fall, sinusoidal sway ±20–40px, fade in/out 800ms, peak opacity 0.65, evenly spread across full hero width
    - **Fire ✅ COMPLETE** — 6 ember sparks, `rgba(255,140,20,0.65)`, upward drift with sinusoidal sway, fade in/out 800ms
    - **Water ✅ COMPLETE** — 6 rising bubbles, `rgba(80,160,220,0.60)`, upward drift, gentle sway
    - **Underwater ✅ COMPLETE** — variant of water with slower, larger bubbles
    - **Ice ✅ COMPLETE** — 5 snowflakes, downward drift, slow rotation, fade in/out
    - **Electric ✅ COMPLETE** — 3 randomised lightning bolts, 4-layer volumetric render (atmospheric glow + outer shell + mid-band + hot core), per-bolt `useAnimatedReaction` + `runOnJS` path cycling, `boltDebounce0/1/2` shared values, `FLASH_IN=40ms, FLASH_DROP=240ms, DECAY=1400ms, PEAK_OP=0.65, DIM_OP=0.20`, gaps 3200/5500/4200ms, bolt height 0.8× heroHeight
    - **Flying ✅ COMPLETE** — 4 wind streaks, two-layer SVG (8px halo σ=6 + 2px core σ=3), sine-wave path (60 pts, amplitude 7/10/13/16px, frequency 1.5), right-to-left travel via `strokeDashoffset` animation, `AnimatedPath` + `useAnimatedProps`
    - **Bug ✅ COMPLETE** — 6 spores, `rgba(168,140,100,0.72)`, 8×8dp circles, large-amplitude incommensurate x/y oscillation (swayHalfPeriod 5500–8800ms, ratio 1.47), dark gap `duration×0.9` gives teleport appearance, distinct starting origins spread across hero
    - **Mega ✅ COMPLETE (with known perf work pending)** — SVG `<Mask>` + `<Image href>` silhouette masking; 6 static ROYGBIV `LinearGradient` layers at 0°/60°/120°/180°/240°/300° angles, each masked to Pokémon silhouette (1.08× scale); `FeGaussianBlur stdDeviation=64` inside `<Mask>` for diffuse feathered edges; per-layer `useAnimatedStyle` opacity cycling at incommensurate durations (4200–7300ms), staggered delays; peak opacity 0.92, fade-out 25% of cycle (fast), loop gap-free; dark navy base shadow (tintColor `#1a1a2e`, 1.01× scale); tight black contrast mask above aura (tintColor `rgba(0,0,0,0.85)`, 1.015× scale); whole container fades in on mount over 800ms via `megaGradRot` shared value (repurposed as fade-in driver); SVG canvas 2.0× artwork size (560dp) for blur room. Spec: `docs/MEGA_AURA_GRADIENT_SPEC.md`
    - **Mega — shiny toggle hitch FIXED (2026-07-20)** — `glowArtworkUrl` (stable non-shiny URL) threaded from `[id].tsx` → `PokemonHero` → `BackdropParticleLayer` → `MegaParticles`. `MegaParticles` wrapped in `React.memo` with custom comparator `(prev, next) => prev.artworkUrl === next.artworkUrl && prev.heroHeight === next.heroHeight`. The 6 SVG mask layers never re-render on shiny toggle. `currentArtworkUrl` (which switches on shiny toggle) still drives the hero image correctly.
    - **Mega — initial mount spike FIXED (2026-07-21)** — **Progressive rendering implemented.** `visibleLayerCount` state (0→6) replaces the previous `imageReady && renderMegaLayer(N)` pattern. When `imageReady` fires: layer 0 mounts immediately, layers 1–5 mount at +100ms intervals via `setTimeout`s (with cleanup on unmount). `megaGradRot` animation runs in its own `useEffect([])` on mount. Aura opacity animations gated on `visibleLayerCount === 6` — no animation runs for an unmounted layer. Each layer costs ~130ms reconciliation; spread across 500ms total vs. the previous ~800ms single spike. The 400ms `fadeInOpacity` fade-in covers all mounts invisibly. `particlesReady` timeout reduced to 500ms (device-verified 2026-07-21).
    - **Fairy ✅ COMPLETE** — 5 radial-gradient soft-glow circles (pure white center → transparent pink edge); dedicated early-return render with `startX`/`startY` as base position; teleport to random hero position on each cycle via `useAnimatedReaction` + `runOnJS` (`fairyTeleport0–4` callbacks, fire when `op` crosses below 0.02); clean 600ms fade-in / 600ms fade-out, no pulse; incommensurate cycle durations 2200–3400ms, stagger 450ms; peak opacity 1.0; 13dp SVG canvas with `RadialGradient`
    - **Pending**: psychic, ghost, dark, dragon, steel, poison, normal, ground (rock/fighting skipped)
    - Design spec (UI designer) in `docs/CUSTOM_BACKDROPS.md` § Backdrop Particle Effects
    - To disable during development: `particlesEnabled={false}` on `<PokemonHero>` in `app/(main)/(pokedex)/[id].tsx`
    - **Critical implementation rules** (learned from crashes):
      - `generateRandomLightningPath` must stay as `useCallback(..., [])` — plain function causes infinite re-render
      - Debounce flags must be `useSharedValue(false)`, not JS refs — JS refs can't be read on UI thread
      - Callbacks called via `runOnJS` from reactions must be stable `useCallback` wrappers
      - `runOnJS` must always wrap JS function calls inside `useAnimatedReaction`
      - **ALL `useSharedValue` calls must be declared unconditionally at the top level of their component** — never inside `.map()`, loops, conditionals, or callbacks. Hooks in loops violate React Rules of Hooks and cause `Cannot read property 'value' of undefined` crashes. Use explicit individual declarations: `const ty0 = useSharedValue(0); const ty1 = useSharedValue(0); ...`
      - **Use sub-component pattern to conditionally mount hook-heavy components** — if a set of hooks should only run sometimes, put them in a child component and conditionally mount the child, not the hooks
      - **Each particle type is its own sub-component** (`GrassParticles`, `FireParticles`, etc.) mounted via a `switch` in the outer `BackdropParticleLayer` — only the active type's hooks run

9. **Visual quality, responsiveness & validation** (REQ-032, spec 2.14)
   - Type badge contrast audit; layout at 320–430px; full functional + accessibility checklist
   - Form-switch animation: ~~OBSOLETE~~ — `router.push()` is accepted behavior; OS stack transition is sufficient (2026-07-20)

### DEFERRED (Team Builder phase)
- REQ-030: Team membership badge overlay on hero (spec 2.12)
- REQ-031: Battle Teams section at bottom of detail screen (spec 2.13)

### App Requires Dev Build (Not Expo Go)

As of 2026-07-17, ChampionDex uses a custom Expo config plugin (`plugins/withSQLiteFsync.ts`) to patch expo-sqlite's Android native module. This plugin calls `FileDescriptor.sync()` after `File.copyTo()` during DB import, fixing the "disk image is malformed" error on version replacement. 

**Development setup required:**
- `npx expo run:android` or `npx expo run:ios` (dev builds)
- Expo Go is no longer sufficient
- JDK 17 required: `brew install openjdk@17` on macOS
- Android SDK and emulator via Android Studio
- The plugin is registered in `app.json` and runs automatically on dev builds

### DB Patching Protocol (current)

`scripts/patchBundledDb.js` is the established tool for all data fixes. It contains all Phase 2–5 patches and is safe to re-run (all inserts use INSERT OR IGNORE or INSERT OR REPLACE where appropriate; encounter inserts have a UNIQUE constraint). For schema changes only: use `generateBundledDb.js` (full rebuild, ~5 min) — always ask user before running.

### KNOWN DEVIATIONS from spec
- **StatChart**: implemented as animated bar chart, not hexagon/radar SVG. Spec updated in section 10.1.

### UI POLISH DECISIONS (2026-07-17) — design language rules, do not revert
- **Canonical section header**: `fontSize: fontSize.md, fontWeight: '600', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: spacing.md` — applies to ALL sections (BASE STATS, EVOLUTION, POKÉDEX ENTRIES, LOCATION ENCOUNTERS, RELATED FORMS, OTHER FORMS, TYPE FORMS). Never use `fontSize['2xl']` or `colors.text` for section headers.
- **Section headers are owned by the component** — never add a `sectionTitle` wrapper in `[id].tsx` for components that render their own header (FlavorTextSection, EncounterLocationsSection, EvolutionChain). Doing so produces duplicate headers.
- **Game version / version selector pattern**: bottom-border-only `Pressable` row (no background box) showing `"{name} ▾"`, opens a slide-up bottom sheet `Modal` with `animationType="none"` + `Animated.Value` driving sheet slide only (backdrop is static). Versions grouped by generation newest-first. Established in FlavorTextSection, replicated in EncounterLocationsSection.
- **Sprite containers**: no grey/solid background fill — sprites float transparently on card backgrounds.
- **Form grids**: all three form sections (RelatedForms, CosmeticAlternates, TypeVariants) use 3-column explicit-width grids. `cardWidth = (screenWidth - 14 - 2 * spacing.lg - 3 * spacing.xs * 2) / 3` — the `14` is `accentBarWrapper`'s `paddingLeft` that applies to all below-hero content. Never use `flexBasis` percentages for grid cards.
- **RelatedFormsSection**: filters out `isCurrent === true` form (no point navigating to where you already are). Returns null if no remaining forms.
- **TypeVariantsSection**: name label removed — type chip (`size="sm" fixed`) conveys the type; text label is redundant.
- **EvolutionChain**: section header uses `alignSelf: 'stretch'` to left-align within the centered container. Mixed-branch chains (e.g. Applin: 2 leaves + 1 sub-chain) render all direct children in one row as `PokemonNode` only (no `ChainNode` recursion in the row), then sub-chains render below their slot via scoped `BranchConnector`.
- **Left accent border** (3px, accentColor): reserved for prose/flavor content (FlavorTextSection card). Data rows (encounter location cards) use no left accent border.
- **accentBarWrapper offset**: `paddingLeft: 14` in `[id].tsx` `styles.accentBarWrapper` — any component computing widths from `screenWidth` must subtract this 14px.

### REQ-029 work completed this session (2026-07-14)
- `pokemon_encounter_locations` table added to `_initializeDatabase` schema block + `runMigrations` guard (both use `CREATE TABLE IF NOT EXISTS`, idempotent)
- `runEncountersBackfill(db)` added to `seedDatabase.ts` — fetches `/pokemon/{pokeapi_id}/encounters` for all default-form Pokémon; aggregates max chance per (location, method, version) combination; writes rows with `INSERT OR IGNORE`; gated via `encounters_backfill_v1` sync_metadata key
- `GAME_VERSION_ORDER` map covers all PokeAPI version slugs including DLC (`the-isle-of-armor-*`, `the-crown-tundra-*`, `the-teal-mask-*`, `the-indigo-disk-*`, `lets-go-pikachu/eevee`, `colosseum`, `xd`, regional Japan versions, `legends-za`) — verified against live PokeAPI `/version?limit=100` response
- Default version selection resets on `pokemonId` change (two separate `useEffect`s); tiebreaker `localeCompare` for equal-score versions
- `formatVersionName` converts slugs to title-case display names; `formatEncounterMethod` maps raw PokeAPI method slugs to readable strings
- Sections must NOT add horizontal padding — parent `contentContainer` already has `paddingHorizontal: spacing.lg`

### REQ-026/027 work completed this session (2026-07-14)
- Carousel replaced with responsive 3-column grid using `flexBasis: '30%'` + `margin: spacing.xs` (flexbox gap shorthand unreliable in RN — use margin-on-card approach)
- Sprite URL approach: two-tier lookup — `FORM_POKEAPI_IDS` map (species.id → PokeAPI form ID, uses `other/home/{id}.png`) then `FORM_SLUG_OVERRIDES` map (species.id → correct slug), then default `{dexNum}-{formSlug}.png`
- React Query `staleTime: Infinity` + `refetchOnMount: false` means cache key MUST be bumped (e.g. v5→v6) whenever URL logic changes, otherwise old URLs are served forever
- Validation script `scripts/validateSpriteUrls.js` mirrors hook URL logic exactly and confirms 89/89 HTTP 200 — run this after any future sprite URL changes
- Double-padding trap: parent `contentContainer` has `paddingHorizontal: spacing.lg`; sections must NOT add their own horizontal padding or column calculations will be 32px too wide

### Pipeline work completed this session (2026-07-13)
Full spec in `docs/ENRICHMENT_PIPELINE_SPEC.md`. Summary:
- **P0** — `species_enriched` column added; 575 no-evolution species no longer cause false cache misses
- **P1** — All 5 prefetch/backfill functions now run in concurrent batches of 10; 50ms sleep fires per-batch on network only; first-run enrichment ~60–90s (was 5–6 min)
- **P2** — Deferred; see spec for rationale
- **P3** — `inlineRequires: true` added to `metro.config.js`; Hermes already on by default in Expo SDK 57
- **P4** — All 3 enrichment streams concurrent from launch; shared 10-slot semaphore in `src/services/database/enrichmentSemaphore.ts`

### PokeAPI Research Findings (confirmed 2026-07-14)

**API:** PokeAPI v2.9.0, in-place updates only, no v3. GitHub merges deploy same-day.

**Gen 9 encounters:** ALL Gen 9 Pokémon return `[]` from `/pokemon/{id}/encounters` — confirmed for Lechonk (common early-game), Sprigatito (starter), and Iron Boulder (paradox). Universal gap, not per-Pokémon. Our empty state is correct. Re-fetch trigger: clear `encounters_backfill_v1` when PokeAPI populates it.

**Legends Z-A forms:** 49 new mega forms exist in BOTH `@pkmn/dex` (as `isNonstandard: 'Future'`) AND PokeAPI (IDs 10278–10326). All have full stats, types, home render sprites (HTTP 200 confirmed), and move data (except 3 `-Mega-Z` forms which have 0 moves — likely a PokeAPI data lag). These are blocked from our DB only by the `'Future'` nonstandard filter in `seedDatabase.ts`. Plan to add them is documented in the STILL TODO section above.

### PokeAPI Data Gap (confirmed 2026-07-14)

Known incomplete data in the live PokeAPI (https://pokeapi.co/api/v2/):
- **Gen 9 encounter data:** Paradox Pokémon (Iron Boulder, Great Tusk, etc.) return empty arrays from `/pokemon/{id}/encounters`. PokeAPI has not yet populated encounter locations for most Scarlet/Violet Pokémon. The `the-teal-mask-*` and `the-indigo-disk-*` version slugs exist in the version list but encounter data is sparse.
- **Legends Z-A:** The `legends-za` version slug exists in the API but no Pokémon encounter data or new forms (including new mega evolutions introduced in that game) are present yet.
- **Impact on the app:** The EncounterLocationsSection will show an empty state ("cannot be caught in the wild") for affected Pokémon. This is correct behaviour given the data — it reflects PokeAPI's state, not a bug in our code. No action needed until PokeAPI populates this data.
- **When PokeAPI updates:** Clear `encounters_backfill_v1` from `sync_metadata` to trigger a re-fetch. Do NOT bump `ENRICH_VERSION`.

A data researcher investigation is in progress this session to confirm the exact state of the API and whether the GitHub repo has unpublished data.

### Enrichment behaviour (current steady state)
`ENRICH_VERSION = '1.2.0'`, `DATA_VERSION = '1.15.0'`, `BUNDLED_DATA_VERSION = '1.15.0'`. All enrichment data is fully populated. Warm launches produce exactly:
```
[Database] Base data already seeded, skipping schema creation
[Database] Starting enrichment streams concurrently...
[Database] PokeAPI enrichment already complete
[Database] Classification backfill already complete
[Database] Moves backfill already complete
[Database] Encounters backfill already complete
[Database] Z-A forms enrichment already complete
```
All five streams (`enrichDatabaseAsync`, `runClassificationBackfill`, `runMovesBackfill`, `runEncountersBackfill`, `runZAFormsEnrichmentBackfill`) launch concurrently from `startPokeApiEnrichment` and gate out immediately via their respective `sync_metadata` keys. If the gate ever misses (e.g. DB cleared), the pipeline runs in concurrent batches of 10 with a shared 10-slot semaphore (`src/services/database/enrichmentSemaphore.ts`) and completes in ~60–90s, not 5–6 min.

**Version mismatch scenario:** If an existing device has `DATA_VERSION = '1.11.0'` but bundled is `1.12.0`, the version check detects the mismatch and triggers `replaceDb()`: closes the cached connection, deletes main + WAL/SHM atomically, re-imports bundled asset with `forceOverwrite: true`, then opens with `useNewConnection: true` to bypass Android connection cache. The new DB opens, runs `runMigrations` (idempotent), enrichment gates pass (already complete in bundled), and warm launch completes normally.

## Known Issues (all resolved)

### Issue 1 — UNIQUE constraint on pokemon.name ✅ FIXED
### Issue 2 — Evolution chain and flavor text ✅ VERIFIED
Device logs confirmed: Bulbasaur flavor_text rows: 28, evolution chain correct.
### Issue 3 — Diagnostic logs ✅ REMOVED
Bulbasaur diagnostic lines removed from `seedDatabase.ts`.

---

## Validation Scripts (MANDATORY — run before reporting any seed change as complete)
```
node scripts/validateSeedData.js          ← flavor text + evolution chain coverage (20 Pokémon sample)
node scripts/validateEvolutionDisplay.js  ← all 16 evolution triggers map to correct display labels
node scripts/auditAlternateForms.js       ← alternate form PokeAPI slug correctness
node scripts/findMisclassifiedForms.js    ← forms classified as 'default' that should be 'alternate'
```
**The overseer runs these scripts directly via Bash. The user is not QA. Workflow before any handoff: (1) specialist writes fix, (2) overseer runs all four scripts and checks output, (3) voltagent-qa-sec:code-reviewer reviews the code, (4) only then hand off to user for device confirmation. "Looks correct" is not evidence — script output is.**

## DB Patching Protocol (replaces full generateBundledDb.js rebuild for data-gap tasks)

For all data-gap remediation tasks (Phase 2–4), use `scripts/patchBundledDb.js` to modify `assets/db/championdex.db` **in place** rather than running the full 5-minute generate script. The generate script is reserved for schema changes and fresh builds only.

**Workflow for each patch task:**
1. Run `node scripts/patchBundledDb.js` (applies only the pending additive inserts)
2. Bump `DATA_VERSION` in `src/services/database/seedDatabase.ts` and `BUNDLED_DATA_VERSION` in `src/services/database/initializeDatabase.ts`
3. Run SQL acceptance criteria and `node scripts/auditPokemonData.js` — report results
4. **Do NOT commit `assets/db/championdex.db` to git until the user explicitly approves the data**
5. User confirms data on device → user gives explicit approval → then commit the DB

**git status note:** After patching, `assets/db/championdex.db` will appear as modified in `git status`. This is expected and correct — it stays unstaged until user approval. Never stage or commit it proactively.

---

## Key File Locations
```
docs/
  DATA_GAP_REMEDIATION_SPEC.md        — v1.9 — full audit findings, gap classifications, implementation briefs
  IMPLEMENTATION_PLAN.md              — current — Phases 1–4 + all follow-up bugs complete; Phase 5 deferred

scripts/
  auditPokemonData.js                 — runs against assets/db/championdex.db; outputs scripts/output/pokemon_data_audit.json
  output/pokemon_data_audit.json      — last audit run: 592/1294 forms with issues (2026-07-21)
```

### Data Gap Remediation Status (2026-07-22)

Phase 5 complete. All Pokédex entries, evolution chains, and encounter data gaps addressed. See `docs/PHASE_5_DATA_GAP_SPEC.md` for full detail. DB v1.28.0 device-verified.


**Current status (2026-07-22):**
- Phase 5 data gap remediation complete and device-verified
- `assets/db/championdex.db` at v1.28.0 — **awaiting commit approval**
- `DATA_VERSION` and `BUNDLED_DATA_VERSION` at `'1.28.0'`

**What was completed in Phase 5 (DB v1.27.x → v1.28.0):**
- Pokédex entries: all 58 regional forms ✅, all 76 alternate forms ✅, all 6 cosmetic female forms ✅ (female-specific text for Meowstic, Indeedee, Basculegion, Oinkologne)
- Evolution chain display: regional forms now included in chain (form_type filter expanded to include 'regional')
- Evolution chain layout: symmetric branch sub-chains render side-by-side (Goomy/Wurmple); Eevee's 8 evolutions render as 2 rows of 4
- Evolution data fixes: Galarian Meowth→Perrserker and Galarian Mr. Mime→Mr. Rime chain pollution removed; condition_values for Galarian Mr. Mime (Lv. 42) and Mime Jr. (mimic) corrected
- Evolution condition_values: 26 rows filled (magnetic-field level-ups, item evolutions, 1000-steps, use-move method corrections)
- Encounter location duplicates: 3,852 duplicate rows removed; UNIQUE constraint added to pokemon_encounter_locations table
- Generation filter: 11 missing game version slugs added to GAME_GENERATION_MAP (Crown Tundra, Isle of Armor DLC → Gen VIII; Teal Mask, Indigo Disk DLC → Gen IX; Japan originals → Gen I) — "Other" bucket now unreachable

**Remaining deferred items:**
- Burmy Sandy/Trash sprites — no PokeAPI home sprites exist; shows Plant-form fallback
- Z-A mega move data — ~5 forms blocked until PokeAPI updates
- Regional encounter locations — Hisuian/Paldean forms return empty from PokeAPI; correct empty state shown
- Evolution chain: Galarian Darmanitan Zen mode battle-form row still needs insertion (pokemon_evolutions id=703→704)
- Audit script false positive fix — single-stage Pokémon still flagged by auditPokemonData.js

---

```
app/
  _layout.tsx                         — root layout, QueryClient, DB init, backdrop preload, prefetch trigger

src/
  services/database/
    initializeDatabase.ts             — schema + migrations; BUNDLED_DATA_VERSION 1.28.0
    seedDatabase.ts                   — DATA_VERSION 1.28.0 / ENRICH_VERSION 1.2.0; 2-phase seed
  components/pokemon/
    PokemonHero.tsx                   — parallax hero, shiny toggle, VitalInfoBorder, particle burst
    InfoStrip.tsx                     — 4-column info row (height/weight/gen/gender), legendary/mythical badge
    AbilitiesSection.tsx              — two-column abilities/hidden, onLayout chevron alignment
    StatChart.tsx                     — animated gradient bar chart, DEFENSE-anchored labels
    TypeEffectivenessTable.tsx        — tabbed defense/offense chart, 4-tier severity colors, stagger animation
    EvolutionChain.tsx                — evolution chain renderer; formatMethod handles all 16 triggers
    FlavorTextSection.tsx             — game version chip selector + flavor text card
    EncounterLocationsSection.tsx     — game version chips (newest-first) + location list; GAME_GENERATION_MAP covers all PokeAPI slugs incl. DLC and Japan versions; UNIQUE constraint on pokemon_encounter_locations prevents duplicate rows
    RelatedFormsSection.tsx / CosmeticAlternatesSection.tsx / TypeVariantsSection.tsx
  components/pokemon/
    BackdropParticleLayer.tsx         — ambient particle layer; PARTICLE_CONFIGS map gates per-backdrop; grass complete, others pending
  constants/
    typeBackdrops.ts                  — backdrop asset map + getBackdropKey(); SPECIFIC_ASSIGNMENTS, UNDERWATER_SET, SECONDARY_TYPE_SET at module level
    typeEffectiveness.ts              — Gen 9 offensive matrix (18×18), calcDefenseEffectiveness, calcOffenseEffectiveness
  hooks/queries/
    useEncounterLocations.ts          — useEncounterLocations(pokemonId, gameVersion) + useEncounterGameVersions(pokemonId)
  services/prefetch/
    artworkPrefetchService.ts         — bulk artwork prefetch; fire-and-forget; checkpoint resume

assets/
  images/backdrops/                   — 25 type + special backdrop PNGs (moved from existing-assets/ 2026-07-15)
  icons/types/                        — 18 type icon PNGs

docs/
  HANDOFF.md                          — this file
  DETAIL_VIEWS_REDESIGN_SPEC.md       — authoritative Phase 3 spec (W-001 through W-019, TypeEffectivenessTable final spec in Section 3)
  DETAIL_VIEWS_SPEC.md                — earlier Phase 3 spec incl. CosmeticAlternatesSection + TypeVariantsSection (section 2.10)
  DETAIL_SCREEN_QA_SPEC.md            — QA checklist for detail screen
  INFO_SECTION_DESIGN_SPEC.md         — InfoStrip production reference
  forms_audit.txt                     — full enumeration of all non-default forms from @pkmn/dex (generated)
```

---

## ✅ RESOLVED — Fresh-install DB crash (2026-07-16)

`pokemon_flavor_text` and `pokemon_evolutions` were only created in `runMigrations`, not in the main schema block. On a fresh device, `runMigrations` ran a backfill that queried `pokemon_flavor_text` before the table existed, crashing with `no such table`. Fixed by adding both tables (with `CREATE TABLE IF NOT EXISTS`) to the main `_initializeDatabase` schema block. Existing installs unaffected — `runMigrations` versions are still `IF NOT EXISTS`.

**Rule:** Any table that can be queried during `runMigrations` must also exist in the main schema block.

---

## ✅ RESOLVED — EvolutionChain Redesign (2026-07-17)

### What's Implemented
- **Layout**: Tree layout replaces horizontal ScrollView. Linear chains render as a single row (disc + arrow + disc…). Branching chains render branch children in rows below.
- **Responsive sizing**: `useWindowDimensions()` — `availableWidth = windowWidth - 64`. `discSize` computed from available width, `branchDiscSize = discSize * 0.82`.
- **Platform ellipse**: True SVG `<Ellipse>` (not a View) with independent `rx`/`ry` — gives genuine oval floor-shadow appearance. Positioned `bottom: -3` under each disc.
- **Connector lines**: SVG T-bar — stem from parent → horizontal bar → spurs to children. Built by `buildBranchConnectorPath(containerWidth, branchCount, svgHeight, stemX, childCenterOverride?)`.
- **Stacked layout (confirmed user design decision — do NOT revert)**: When any branch has further evolutions (e.g. Wurmple → Silcoon/Cascoon), each branch gets its own full-width row. `anyBranchHasChildren` flag drives this. Multi-branch with no further evolutions uses a single row (up to 4 children).
- **Slot-based child positioning**: Each child in a row gets `width = containerWidth / n`, so disc center is always at `slotWidth * i + slotWidth / 2` — predictable by SVG math, no `justifyContent`/gap unpredictability.
- **Kirlia/trailing-branch support**: `parentCenterX` computed from linear row geometry passed to `BranchConnector`, so stem originates from the correct disc.
- **Wurmple stacked connector fix**: `buildBranchConnectorPath` draws a horizontal jog from `stemX` to `leftmostX` whenever `leftmostX !== stemX || branchCount > 1`, eliminating the disconnected-segment gap in stacked single-child rows.
- **`collectLinearChain`**: Recursively flattens linear chains. Each entry carries `{ pokemon, step }` where `step` is the incoming evolution step (for displaying the trigger label).

### Files Changed
- `src/components/pokemon/EvolutionChain.tsx` — complete rewrite
- `app/(main)/(pokedex)/[id].tsx` — removed duplicate `<Text>Evolution</Text>` label (component renders its own header internally)

---

## ✅ RESOLVED — Pokéball Artwork Fallback (2026-07-17)

When `artworkUrl` is null or the artwork image fails to load (`onError` event), `PokemonHero.tsx` renders an inline SVG Pokéball placeholder instead of nothing. Asset saved at `assets/images/pokeball-placeholder.svg` (CC0 public domain, by Ana., OpenClipart). Fallback handles both missing data and broken image URLs gracefully.

---

## ✅ RESOLVED — Type Badge Text Color Contrast (2026-07-17)

`src/constants/colors.ts` updated with `typeTextColors` map. 13 light-background types now use warm `#1A1815` instead of pure black. 5 dark-background types (fighting, poison, ghost, dragon, dark) use `#FFFFFF`. All combinations pass WCAG AA 4.5:1 contrast ratio.

---

## ✅ RESOLVED — Detail View Navigation Performance (2026-07-17)

### Problem
Noticeable lag (~1s) when navigating to Pokémon detail views. Mega evolution views had additional jank. Multiple hitches visible during stat bar animations.

### Root Causes Found
1. **Prefetch racing navigation**: `Image.prefetch()` was called in a `.then()` after `router.push()` — the prefetch raced the transition instead of preceding it.
2. **`requestIdleCallback` firing during transition**: The original `belowFoldReady` gate used `requestIdleCallback`, which can fire during the ~300ms navigation transition if the JS thread gets briefly idle — causing work to compete with the transition animation.
3. **Above-fold content gated unnecessarily**: StatChart, TypeEffectivenessTable, AbilitiesSection, and InfoStrip were all gated behind `belowFoldReady`, causing visible pop-in of content that should be instant.
4. **MegaParticles cold-decode**: `react-native-svg`'s `<SvgImage>` doesn't use expo-image's cache — on first visit, 6 SVGs each independently decoded the artwork URL.
5. **MegaParticles mount spike**: Mounting 6 complex SVG nodes (each with Defs + SvgImage + FeGaussianBlur + Mask + Rect) caused a React reconciliation spike that dropped frames during stat bar animations.

### What Was Fixed

**`app/(main)/(pokedex)/index.tsx` — prefetch before push:**
- `handlePokemonPress` now `await`s `queryClient.prefetchQuery()`, then `await`s `Image.prefetch()` before calling `router.push()`
- A 250ms `Promise.race` timeout ensures navigation fires within 250ms even on slow/cold loads

**`app/(main)/(pokedex)/[id].tsx` — deferral strategy:**
- `setTimeout` gates deferral (replaces `requestIdleCallback` which could fire during transition)
- `belowFoldReady` at 650ms — gates truly below-fold sections (related forms, cosmetic/type variants, flavor text, encounters, moveset) and shiny prefetch check
- `usePokemonAbilities` and `usePokemonSpeciesData` fire immediately (no gate) — needed for above-fold content (abilities tapping, gender ratio, classification)
- StatChart, TypeEffectivenessTable render immediately from `pokemon.baseStats`/`pokemon.primaryType` (already in hand, no async query)
- `particlesReady` at 1100ms — after all stat bar animations complete (~800ms finish + 300ms margin) to prevent reconciliation jank during particle mount

**`src/components/pokemon/StatChart.tsx` — animation deferral:**
- Stat bar animation `useEffect` wraps the `withDelay()+withTiming()` schedule in `setTimeout(fn, 100)` so animations start 100ms after mount rather than in the same render cycle as the below-fold reconciliation pass

**`src/components/pokemon/BackdropParticleLayer.tsx` — MegaParticles:**
- Added `Image.prefetch(artworkUrl)` on mount — ensures artwork is in native disk cache before any SVG renders
- All 6 SVG layers gated on `imageReady` (prefetch resolved) rather than mounting immediately
- Added `fadeInOpacity` shared value — aura fades in over 400ms when `imageReady` flips, preventing pop-in
- `FeGaussianBlur stdDeviation` reduced from 128 → 32 (16× cheaper GPU work, visually equivalent)

### Known Limitation (updated 2026-07-21)
MegaParticles appear ~900ms after navigation (500ms `particlesReady` gate + 400ms fade-in). Progressive rendering (2026-07-21) eliminated the ~800ms reconciliation spike; `particlesReady` reduced from 1100ms → 500ms, device-verified. Per-frame staggering (16ms) was tried previously and made things worse; the 100ms interval is the validated approach. Parallax fix also applied (2026-07-21): `BackdropParticleLayer` now wrapped in the artwork's `artworkAnimatedStyle` so the Mega aura tracks the Pokémon during scroll instead of diverging.

### What Was Investigated and Ruled Out
- Staggering queries to avoid SQLite thread contention — ruled out; expo-sqlite queries run on native background thread, staggering only delays data arrival
- Per-frame SVG mount staggering (16ms intervals) — implemented and reverted; made things noticeably worse
- Replacing SVG mask approach with a simpler oval glow — explicitly rejected by user; visual must be preserved

---

## What NOT to Do (Learned the Hard Way)
- **Do NOT put network calls inside `withTransactionAsync`**
- **Do NOT declare seed changes complete without running the validation scripts**
- **Do NOT declare anything complete without first running the validation scripts and showing the output, then having the user confirm it works in the running app**
- **Do NOT say "the logic looks correct" — that is not evidence. Run the tests.**
- **Do NOT call `parseEvolutionChain` multiple times on the same chain**
- **Do NOT use `useFocusEffect` on the Pokédex list screen** — causes constant refetches
- **Do NOT use `resizeMode` prop on expo-image** — use `contentFit`
- **Do NOT use `Animated` from `react-native`** — use Reanimated
- **Do NOT modify the four list screens** unless explicitly asked
- **Do NOT use `national_dex` to construct URLs for alternate forms** — use `pokeapi_id`
- **Do NOT store sprite/artwork URLs in the database** — construct at display time
- **Do NOT edit code files directly as the overseer** — non-trivial changes go to specialist agents

---

## Design Tokens
```
background:      #111010    surface:         #1E1A1A    surfaceElevated: #2A2323
border:          #3A2E2E    borderLight:     #4A3E3E
text:            #F5EEEE    textSecondary:   #B89E9E    textMuted:       #9A7A7A
primary:         #DD3311    accent:          #FFD700
```

## React Query Config
```typescript
staleTime: Infinity, refetchOnWindowFocus: false, refetchOnMount: false, refetchOnReconnect: false
```

## Path Aliases
- `@/` → `src/` (NOT project root)
- `@assets/` → `assets/`
- `@app/` → `app/`

## Sprite / Artwork URLs
```
Artwork: https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${pokeApiId}.png
Shiny:   https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/shiny/${pokeApiId}.png
```
