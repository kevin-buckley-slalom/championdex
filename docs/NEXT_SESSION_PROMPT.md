# Next Session Prompt — ChampionDex
**Updated:** 2026-07-15

Read `docs/HANDOFF.md` in full before doing anything else.

---

## Project

Expo SDK 57 / React Native dark-theme Pokémon companion app. Working directory:
`/Users/kevin.buckley/Library/CloudStorage/OneDrive-Slalom/Documents/Projects/championdex`

Phase 3 (Detail Views) is ~95% complete. Active work: **backdrop particle effects** (REQ-025a) — grass is done, remaining backdrops are next. The other open Phase 3 item is REQ-032 visual quality pass. See `docs/HANDOFF.md` Phase 3 status and `docs/CUSTOM_BACKDROPS.md` particle section for full context.

---

## Ways of working — non-negotiable

**Delegation:** You are the overseer. You do not write application code. All code changes go to specialist agents:
- `voltagent-lang:expo-react-native-expert` — all Expo/React Native code
- `voltagent-core-dev:ui-designer` — visual design decisions before implementation; always consult before briefing the developer on visual work
- Never skip the design step for visual work; never overwrite a specialist's output without resuming that agent

**Brief precisely:** When briefing a developer, include: exact file path, exact lines to change, exact reason why, and what NOT to touch. Read the relevant source files yourself before writing any brief — never brief from memory or assumption.

**Trivial style-only edits** (single property, no structural impact) may be made directly without delegating.

**Quality bar — mandatory before any handoff:**
- `npx tsc --noEmit` — zero errors
- Sprite/data changes: run `node scripts/validateSpriteUrls.js` and confirm 89/89 HTTP 200
- Seed/enrichment changes: run all four scripts in `scripts/` and show output
- UI changes: user tests on device — never declare UI complete without their confirmation

**Docs:** When any feature completes, update BOTH `docs/HANDOFF.md` AND the relevant spec doc before moving on. Stale specs cause future agents to build the wrong things.

**Never declare done without user confirmation** of the running app.

**Communication:** Short and direct. No trailing summaries of what you just did. State what you found, what you changed, what needs testing. One sentence per update while working.

**Layout:** For multi-column flex layouts, use explicit flex ratios + `gap` — never `justifyContent: 'space-between'` to create spacing. Do not add `paddingHorizontal` inside section components — the parent `contentContainer` already provides `paddingHorizontal: spacing.lg` (16px).

**Animations:** Always use Reanimated — never `Animated` from react-native.

**Images:** Never use `resizeMode` on expo-image — use `contentFit`.

**Don't touch ambient gradient y-values** in `app/(main)/(pokedex)/[id].tsx` — manually fixed and correct.

**Don't modify the four list screens** unless explicitly asked — Phase 2 is locked.

---

## Completed sections — do not redesign

- **Hero** — parallax, VitalInfoBorder notch, RoundedStar, heroFadeGradient, cardSurfaceColor blending, Gigantamax stadium backdrop, shiny toggle with particle burst
- **BackdropParticleLayer** — ambient particle system behind artwork; grass complete (5 leaves, 5–7.4s, sway, fade); other backdrops pending; `particlesEnabled` prop on PokemonHero disables all instantly; `PARTICLE_CONFIGS` in `BackdropParticleLayer.tsx` gates per-type
- **InfoStrip** — 4-column row (HEIGHT/WEIGHT/GEN/GENDER), flex 2:2:1:3, gap 16, imperial primary, metric secondary, gender bar, legendary/mythical badge
- **AbilitiesSection** — two columns (ABILITIES/HIDDEN), accent bar rows, chevron aligned via onLayout
- **StatChart** — DEFENSE-width-anchored labels, gradient slice bars, no internal horizontal padding
- **TypeEffectivenessTable** — tabbed defense/offense, 2-band × 9-type grid, 4-tier severity color system, stagger animations, corrected Gen 9 offensive matrix

---

## Current state

**Warm launch console (steady state):**
```
[Database] Data already seeded
[Database] Starting enrichment streams concurrently...
[Database] PokeAPI enrichment already complete
[Database] Classification backfill already complete
[Database] Moves backfill already complete
[Database] Encounters backfill already complete
[Database] Z-A forms enrichment already complete
```

**sync_metadata keys:**
- `data_version = '1.10.0'`
- `pokeapi_enrich_version = '1.2.0'` — do NOT bump unless re-fetching flavor text for all 1025 Pokémon
- `classification_backfill_v1`, `moves_backfill_v1`, `encounters_backfill_v1`, `species_enriched_backfill_v1`, `za_forms_enrichment_v1` — all `'done'`

**Sections not yet reviewed:** Evolution chain, Moves/Moveset, Pokédex Entries, Location Encounters, Related Forms — leave for user-directed work.

---

## Key facts

**Design tokens:**
```
background:      #111010    surface:         #1E1A1A    surfaceElevated: #2A2323
border:          #3A2E2E    borderLight:     #4D3E3E
text:            #F5EEEE    textSecondary:   #B89E9E    textMuted:       #9A7A7A
primary:         #DD3311    accent:          #FFD700
```

**React Query:** `staleTime: Infinity, refetchOnMount: false, refetchOnWindowFocus: false, refetchOnReconnect: false`
— Any hook whose cache key, URL logic, or data shape changes must have its query key version bumped or stale data will be served forever.

**Path aliases:** `@/` → `src/`, `@assets/` → `assets/`, `@app/` → `app/`

**Sprite / artwork URLs:**
```
Artwork: https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${pokeApiId}.png
Shiny:   https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/shiny/${pokeApiId}.png
```

**Do NOT:**
- Put network calls inside `withTransactionAsync`
- Declare seed changes complete without running all 4 validation scripts
- Use `national_dex` to construct URLs for alternate forms — use `pokeapi_id`
- Store sprite/artwork URLs in the database — construct at display time
- Bump `ENRICH_VERSION` for anything other than needing to re-fetch flavor text + evolutions for all 1025 Pokémon
- Use flexbox `gap` shorthand on View (unreliable in RN — use margin on children or explicit `gap` via StyleSheet only)
