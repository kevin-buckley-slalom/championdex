# ChampionDex — Session Handoff Notes
**Updated:** 2026-07-15 | TypeEffectivenessTable complete (W-005). Next work: REQ-032 visual quality (final Phase 3 item).

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

## Architecture: Seed Flow (DATA_VERSION: '1.9.0')

```
app/_layout.tsx → initializeDatabase()
  → runMigrations() — schema + one-time pruning migration (FK checks disabled during prune)
  → seedDatabase(db)
      Phase 1 (blocking, ~1-2s):
        prefetchPokeApiIds(db, dex)     ← uses DB cache; ~0 network after first run
        withTransactionAsync:
          seedAbilities / seedItems / seedMoves  ← ON CONFLICT(id) DO UPDATE
          seedPokemonBaseData(db, dex, cache)    ← ON CONFLICT(id) DO UPDATE ← BUG HERE
          write data_version = '1.9.0'
        return  ← app renders
        startPokeApiEnrichment(db, dex)  ← fire-and-forget

      Phase 2 (background, fire-and-forget):
        enrichDatabaseAsync(db, dex)
          checks pokeapi_enrich_version = '1.0.0' → skip if done
          prefetchPokeApiSpeciesData(db, dex)  ← DB-cached; only fetches missing species
          withTransactionAsync:
            writePokeApiEnrichment()  ← flavor text + evolutions, INSERT OR IGNORE
            write pokeapi_enrich_version = '1.0.0'
```

**Version constants:**
- `DATA_VERSION = '1.10.0'` — bumped for Z-A mega forms (49 new rows)
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
- **Bar gradient**: full-width slice from container, gradient colors `['#8B2A2A','#B85C1A','#C8A020','#96E040','#00FF7F','#00FFFF']` at locations `[0, 0.118, 0.235, 0.353, 0.471, 0.784]`
- **Numeric stat value**: width 30px, fontSize 15, fontWeight 700, textAlign right, fontFamily Menlo, accentColor
- **Animations**: bar width/opacity interpolate from 0 per-row (60ms stagger)
- File: `src/components/pokemon/StatChart.tsx`

### Detail Screen Layout (Updated, [id].tsx)
- Hero section (PokemonHero with parallax, star button integrated)
- Name + Classification row (inline, name 36px bold, classification italic right-aligned)
- Type badges (width="fixed", size="md", 110px each)
- **InfoStrip** (new single-row layout)
- **AbilitiesSection** (new two-column abilities/hidden)
- Base Stats chart (above evolution per spec reorder)
- Evolution chain (pending review for horizontal layout; currently existing implementation)
- Related forms, Cosmetic alternates, Type variants (grid layouts, existing)
- Pokédex entries (FlavorTextSection)
- Location encounters (EncounterLocationsSection)
- Moveset with search/sort (FlatList)

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
- **Pokemon Detail** `app/(main)/(pokedex)/[id].tsx` — parallax hero (PokemonHero), shiny toggle (ShinyToggle), type badges, dex/classification/height/weight, abilities section (tappable), StatChart (animated bar chart), EvolutionChain (all 16 triggers), RelatedFormsSection (carousel), FlavorTextSection (game version chips)
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

2. **Moveset Section** (REQ-019) ✅ DONE — `useMovesetForPokemon` hook, search + sort controls (Name/Power/Accuracy/Category), type badge, power/accuracy/PP, learn method; tappable → MoveDetail

3. **Pokemon list on Move Detail** (REQ-020) ✅ DONE — `usePokemonWithMove` hook + FlashList with sprites, type badges, learn method; tappable rows → Pokemon detail

4. **Pokemon list on Ability Detail** (REQ-022) ✅ DONE — `usePokemonWithAbility` hook + FlashList with sprites, type badges, hidden ability badge, generation filter chips

5. **CosmeticAlternatesSection** (REQ-026, spec 2.10) ✅ COMPLETE
   - `src/components/pokemon/CosmeticAlternatesSection.tsx` — responsive 3-column grid (flexBasis 30%, margin spacing.xs), section title "OTHER FORMS"
   - `src/hooks/queries/useFormVariants.ts` — queries @pkmn/dex for excluded forms; FORM_POKEAPI_IDS map + FORM_SLUG_OVERRIDES map for correct sprite URLs
   - Validated: 89/89 excluded forms have verified HTTP 200 sprite URLs (script: `node scripts/validateSpriteUrls.js`)
   - Query cache key: `['pokemon', 'form-variants', 'v5', nationalDex]`

6. **TypeVariantsSection** (REQ-027, spec 2.10) ✅ COMPLETE
   - `src/components/pokemon/TypeVariantsSection.tsx` — same 3-column grid, section title "TYPE FORMS", TypeBadge per form
   - Same hook (`useFormVariants`) and same sprite resolution logic

7. **Location Encounters** (REQ-029, spec 2.11) ✅ COMPLETE
   - `pokemon_encounter_locations` table in schema + migration guard for existing installs
   - `runEncountersBackfill(db)` — 4th concurrent enrichment stream, gated on `encounters_backfill_v1` sync_metadata key
   - `src/hooks/queries/useEncounterLocations.ts` — `useEncounterLocations(pokemonId, gameVersion)` + `useEncounterGameVersions(pokemonId)`
   - `src/components/pokemon/EncounterLocationsSection.tsx` — horizontal game version chip selector (newest-first using full `GAME_VERSION_ORDER` map covering all PokeAPI slugs including DLC), location list grouped by location, method + max chance + level range
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
    - **Mega ✅ COMPLETE** — SVG `<Mask>` + `<Image href>` silhouette masking; 6 static ROYGBIV `LinearGradient` layers at 0°/60°/120°/180°/240°/300° angles, each masked to Pokémon silhouette (1.08× scale); `FeGaussianBlur stdDeviation=64` inside `<Mask>` for diffuse feathered edges; per-layer `useAnimatedStyle` opacity cycling at incommensurate durations (4200–7300ms), staggered delays; peak opacity 0.92, fade-out 25% of cycle (fast), loop gap-free; dark navy base shadow (tintColor `#1a1a2e`, 1.01× scale); tight black contrast mask above aura (tintColor `rgba(0,0,0,0.85)`, 1.015× scale); whole container fades in on mount over 800ms via `megaGradRot` shared value (repurposed as fade-in driver); SVG canvas 2.0× artwork size (560dp) for blur room. Spec: `docs/MEGA_AURA_GRADIENT_SPEC.md`
    - **Pending**: psychic, ghost, dark, dragon, fairy, steel, poison, normal, ground (rock/fighting skipped)
    - Design spec (UI designer) in `docs/CUSTOM_BACKDROPS.md` § Backdrop Particle Effects
    - To disable during development: `particlesEnabled={false}` on `<PokemonHero>` in `app/(main)/(pokedex)/[id].tsx`
    - **Critical implementation rules** (learned from crashes):
      - `generateRandomLightningPath` must stay as `useCallback(..., [])` — plain function causes infinite re-render
      - Debounce flags must be `useSharedValue(false)`, not JS refs — JS refs can't be read on UI thread
      - Callbacks called via `runOnJS` from reactions must be stable `useCallback` wrappers
      - `runOnJS` must always wrap JS function calls inside `useAnimatedReaction`

9. **Visual quality, responsiveness & validation** (REQ-032, spec 2.14)
   - Form-switch animation (fade + scale on artwork/stats/badges); type badge contrast audit; layout at 320–430px; full functional + accessibility checklist

### DEFERRED (Team Builder phase)
- REQ-030: Team membership badge overlay on hero (spec 2.12)
- REQ-031: Battle Teams section at bottom of detail screen (spec 2.13)

### KNOWN DEVIATIONS from spec
- **StatChart**: implemented as animated bar chart, not hexagon/radar SVG. Spec updated in section 10.1.

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
`ENRICH_VERSION = '1.2.0'`, `DATA_VERSION = '1.10.0'`. All enrichment data is fully populated. Warm launches produce exactly:
```
[Database] Starting enrichment streams concurrently...
[Database] PokeAPI enrichment already complete
[Database] Classification backfill already complete
[Database] Moves backfill already complete
[Database] Encounters backfill already complete
[Database] Z-A forms enrichment already complete
```
All five streams (`enrichDatabaseAsync`, `runClassificationBackfill`, `runMovesBackfill`, `runEncountersBackfill`, `runZAFormsEnrichmentBackfill`) launch concurrently from `startPokeApiEnrichment` and gate out immediately via their respective `sync_metadata` keys. If the gate ever misses (e.g. DB cleared), the pipeline runs in concurrent batches of 10 with a shared 10-slot semaphore (`src/services/database/enrichmentSemaphore.ts`) and completes in ~60–90s, not 5–6 min.

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

---

## Key File Locations
```
app/
  _layout.tsx                         — root layout, QueryClient, DB init, backdrop preload, prefetch trigger

src/
  services/database/
    initializeDatabase.ts             — schema + migrations + one-time pruning migration
    seedDatabase.ts                   — DATA_VERSION 1.10.0 / ENRICH_VERSION 1.2.0; 2-phase seed
  components/pokemon/
    PokemonHero.tsx                   — parallax hero, shiny toggle, VitalInfoBorder, particle burst
    InfoStrip.tsx                     — 4-column info row (height/weight/gen/gender), legendary/mythical badge
    AbilitiesSection.tsx              — two-column abilities/hidden, onLayout chevron alignment
    StatChart.tsx                     — animated gradient bar chart, DEFENSE-anchored labels
    TypeEffectivenessTable.tsx        — tabbed defense/offense chart, 4-tier severity colors, stagger animation
    EvolutionChain.tsx                — evolution chain renderer; formatMethod handles all 16 triggers
    FlavorTextSection.tsx             — game version chip selector + flavor text card
    EncounterLocationsSection.tsx     — game version chips (newest-first) + location list; GAME_VERSION_ORDER covers all PokeAPI slugs
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
