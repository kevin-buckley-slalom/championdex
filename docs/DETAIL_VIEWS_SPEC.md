# Detail Views Specification

**Version:** 0.7  
**Last Updated:** 2026-07-14  
**Status:** In Progress (~95% complete)  
**Phase:** 1.1 (Post-List Screens)

---

## Changelog

| Date | Version | Change |
|------|---------|--------|
| 2026-07-20 | 0.8 | Form label display architecture documented (section 2.1a); DB v1.18.0; Android fresh install fix; Ogerpon IDs corrected; 279 tests |
| 2026-07-14 | 0.7 | Z-A mega forms (49 forms) marked complete — FUTURE_FORM_ALLOWLIST, DATA_VERSION 1.10.0, za_forms_enrichment_v1 backfill; section 14 updated; requirements traceability updated |
| 2026-07-14 | 0.6 | REQ-029 marked complete; HANDOFF and section 14 updated; PokeAPI data gap noted |
| 2026-07-14 | 0.5 | Corrected stale state: REQ-026/027 marked complete; section 2.11 enrichment instruction updated to sync_metadata key pattern (not ENRICH_VERSION bump); hook signature corrected; layout updated (grid not carousel); design token values corrected; section ordering updated; section 14 rewritten to reflect only REQ-029 + REQ-032 remaining |
| 2026-07-13 | 0.4 | Added REQ-028 (classification), REQ-029 (encounter locations + schema), REQ-030/031 (team badge + teams section, future), REQ-032 (visual quality/responsiveness/accessibility checklist); updated section 2.1 layout; added sections 2.11–2.14 |
| 2026-07-13 | 0.3 | Updated status to reflect current implementation state; updated requirements traceability table; updated Next Steps to match what's actually remaining |
| 2026-07-13 | 0.2 | Added section 2.10 for Cosmetic Alternates & Type Variants components; included Pokemon trigger lists, data sourcing from @pkmn/dex, UI layouts, and implementation notes; flagged Genesect and G-Max considerations for future phases |
| 2026-07-10 | 0.1 | Initial detail views specification |

---

## Executive Summary

Detail Views is the natural next phase after the list screens (Pokemon, Moves, Abilities, Items). This phase implements richly detailed, interactive screens for each entity type (REQ-013 to REQ-025), establishing the foundation for deep linking and cross-entity navigation that Team Builder will later depend on.

**Why This Phase Comes Next:**
- List screens enable users to discover entities; detail screens let users understand them
- Team Builder requires accurate Pokemon detail data (abilities, movepool, forms) — this phase builds that foundation
- Detail views form the backbone of cross-linking (Pokemon → Moves → Abilities → Items)
- Navigation architecture (stack + tabs) must be proven before adding complex team-builder routing

**Phase Scope:**
- Pokemon Detail screen with parallax art, stat chart, abilities, full moveset, form/shiny toggles
- Move Detail screen with type/power/accuracy/priority, description, back-link to origin Pokemon
- Ability Detail screen with description and list of Pokemon with that ability (tappable)
- Item Detail screen with name, type icon, effect description
- Navigation wiring (detail screens are stack-pushed from list screens)
- Cross-linking between all detail screens (tappable moves, abilities, items)

---

## 1. Requirements Traceability

| REQ ID | Requirement | Status | Design Section |
|--------|-------------|--------|-----------------|
| REQ-013 | Pokemon detail page | ✅ Done (moveset, classification, all core sections complete) | 2.1 |
| REQ-014 | Parallax scrolling on detail view | ✅ Done (PokemonHero, 0.5x artwork, 0.25x backdrop) | 2.4 |
| REQ-015 | Base stats chart | ✅ Done (bar chart — see deviation note in 10.1) | 2.2 |
| REQ-016 | Toggle shiny sprite variant | ✅ Done (ShinyToggle, 200ms cross-fade) | 2.3 |
| REQ-017 | True form differences (regional variants, megas) | ✅ Done (RelatedFormsSection carousel) | 2.5 |
| REQ-018 | Cosmetic gender variants toggle | ✅ Done (ShinyToggle handles both gender + shiny) | 2.3 |
| REQ-019 | Full moveset/movepool searchable/sortable | ✅ Done — `useMovesetForPokemon` hook, search + sort controls, tappable rows | 2.6 |
| REQ-020 | Tap move → navigate to move detail | ✅ Done — Pokemon-with-move list + tappable rows implemented | 3.1 |
| REQ-021 | Move detail screen | ✅ Done (Pokemon list now complete) | 2.7 |
| REQ-022 | Ability detail screen | ✅ Done (Pokemon list + generation filter chips complete) | 2.8 |
| REQ-023 | Item detail screen | ✅ Done | 2.9 |
| REQ-024 | Deep links between related details | ⏸️ Deferred (future phase) | 3.1 |
| REQ-025 | Back navigation | ✅ Done (React Navigation built-in header) | 3.1 |
| REQ-026 | Cosmetic alternates display (sprite variants, no stat changes) | ✅ Done — `CosmeticAlternatesSection`, responsive 3-column grid, 89/89 sprite URLs validated | 2.10 |
| REQ-027 | Type variants display (forms changing type via item/memory) | ✅ Done — `TypeVariantsSection`, same grid layout, TypeBadge per variant | 2.10 |
| REQ-028 | Pokémon classification display (e.g. "Seed Pokémon") | ✅ Done (`[id].tsx` line 188, italic textMuted below name) | 2.1 |
| REQ-029 | Location encounters with game selector | ✅ Done — `EncounterLocationsSection`, full `GAME_VERSION_ORDER` map, `encounters_backfill_v1` gate | 2.11 |
| REQ-030 | Team membership badge on hero (future) | ⏸️ Deferred — Team Builder phase | 2.12 |
| REQ-031 | Battle teams section on detail screen (future) | ⏸️ Deferred — Team Builder phase | 2.13 |
| REQ-032 | Visual quality, responsiveness, and component validation | ❌ TODO — full checklist in 2.14 | 2.14 |

---

## 2. Component & Screen Architecture

### 2.1 Pokemon Detail Screen (`app/(main)/(pokedex)/[id].tsx` or via stack)

**Key Features:**
- Parallax scrolling header with official artwork + shiny toggle
- Team membership badge overlay on hero (future — Team Builder phase)
- Dex number, name, classification, type badges, physical stats (height, weight)
- Abilities section (tappable to view detail)
- Base stats chart
- Evolution chain
- Related forms carousel (true form differences)
- Pokédex entries (flavor text with game version selector)
- Cosmetic alternates section (sprite-only variants, if applicable)
- Type variants section (type-changing forms, if applicable)
- Location encounters (game-selectable, if applicable)
- Move pool section (searchable/sortable, all learnable moves)
- Battle teams section — list of teams this Pokémon belongs to (future — Team Builder phase)

**Layout:**
```
┌──────────────────────────────┐
│ < Pikachu                    │  Back button + name in header
├──────────────────────────────┤
│  [Parallax Backdrop]         │  Type-based backdrop, 0.25x parallax
│  [Parallax Artwork]          │  Artwork, 0.5x parallax
│  [●Shiny] [Normal]           │  Shiny toggle, cross-fade 200ms
│  [★] (top-right corner)      │  Team badge overlay (FUTURE: shown if in ≥1 team)
├──────────────────────────────┤
│ Seed Pokémon                 │  Classification (e.g. "Seed Pokémon")
│ #001  [Grass] [Poison]       │  Dex number + type badges
│ 0.7m / 2ft 4in  6.9kg/15lbs │  Height + weight (metric + imperial)
│ Gen I · Legendary (if appl.) │  Generation badge + legendary/mythical indicator
├──────────────────────────────┤
│ Abilities                    │
│ [Overgrow]  [Chlorophyll ●]  │  Tappable; ● = hidden ability
├──────────────────────────────┤
│ Base Stats  BST: 318         │  Animated bar chart + total
│ HP    45  ████               │
│ ATK   49  ████               │
│ DEF   49  ████               │
│ SP.ATK 65 █████              │
│ SP.DEF 65 █████              │
│ SPD   45  ████               │
├──────────────────────────────┤
│ Evolution                    │  Full chain with trigger labels
│ Bulbasaur → Ivysaur (Lv.16) │
│ → Venusaur (Lv.32)          │
├──────────────────────────────┤
│ Forms        [Alolan][Galar] │  Related forms carousel (if applicable)
├──────────────────────────────┤
│ Pokédex Entries              │  Flavor text + game version chips
│ [Red][Blue][Yellow]...       │
├──────────────────────────────┤
│ Other Forms  (cosmetic)      │  CosmeticAlternatesSection (if applicable)
│ [sprite][sprite][sprite]  → │
├──────────────────────────────┤
│ Type Forms   (type variants) │  TypeVariantsSection (if applicable)
│ [sprite+badge][sprite+badge] │
├──────────────────────────────┤
│ Locations    [Scarlet ▼]     │  Game selector defaulting to most recent
│ Route 1 · Walking · 10%      │  Encounter method + chance per location
│ (none in this game)          │  Graceful empty state
├──────────────────────────────┤
│ Moveset [Search] [Sort ▼]   │  Searchable/sortable
│ [Thunderbolt] Elec Phys 90  │  Tappable rows → MoveDetail
│ ...                          │
├──────────────────────────────┤
│ Battle Teams  (FUTURE)       │  Teams containing this Pokémon
│ "Competitive Squad"          │  Tappable → team detail (Team Builder phase)
│ "Rain Team"                  │
└──────────────────────────────┘
```

### 2.1a Form Label Display Architecture

Form labels appear as a secondary row **below** the Pokémon name, **above** the classification, **above** type chips. Implemented in `[id].tsx`; logic in `computeFormLabel` (`src/utils/pokemonUtils.ts`).

**Rules by `form_type`:**

| form_type | form_name value | Displayed label |
|-----------|----------------|-----------------|
| `default` | set (e.g. `"Midday Form"`) | show form_name |
| `default` | null | no label |
| `regional` | null | no label (region baked into display_name: "Alolan Vulpix") |
| `regional` | set (compound: e.g. `"Combat Breed"`) | show form_name |
| `mega` | `Mega` / `Mega-X` / `Mega-Y` / `Mega-Z` / `M` / `Primal` | no label |
| `mega` | `F` | "Female" |
| `mega` | other | show form_name |
| `gigantamax` | `Gmax` | no label |
| `gigantamax` | other | show form_name (e.g. "Low Key" for Toxtricity) |
| `cosmetic` | `F` + display_name has no ♀/♂ | "Female" |
| `cosmetic` | any (display_name has ♀/♂) | no label |
| `alternate` | null or `Primal` | no label |
| `alternate` | other | show form_name (e.g. "Ice Rider", "Cornerstone Mask") |

**Primal forms:** `form_type = 'alternate'`, `form_name = 'Primal'`. Label suppressed — "Primal" is already in `display_name` ("Primal Kyogre"). Same treatment for Mega — "Mega" is in display_name.

**Nidoran:** `display_name = "Nidoran ♀"` / `"Nidoran ♂"`. The ♀/♂ check in `computeFormLabel` suppresses the form label so the symbol isn't shown twice.

**Typography:**
- Form label: `fontSize: 17, fontWeight: '600'`
- Classification: `fontSize: 13, fontWeight: '400', fontStyle: 'italic', color: textMuted`
- Classification always below form label

**Key `form_name` DB values for default forms (v1.18.0):**
Lycanroc → `"Midday Form"`, Aegislash → `"Shield Forme"`, Zygarde → `"50%"`, Ogerpon → `"Teal Mask"`, Eiscue → `"Ice Face"`, Palafin → `"Zero Form"`, Hoopa → `"Confined"`, Urshifu → `"Single-Strike"`, Wishiwashi → `"Solo Form"`, Shaymin → `"Land Forme"`, Oricorio → `"Baile Style"`, Meloetta → `"Aria Forme"`, Darmanitan → `"Standard Mode"`, Landorus/Thundurus/Tornadus/Enamorus → `"Incarnate"`, Pumpkaboo/Gourgeist → `"Medium Size"`, Toxtricity → `"Amped Form"`, Burmy/Wormadam → `"Plant Cloak"`

**Data Requirements:**
- Official artwork URL (high-res image)
- Sprite URLs (normal + shiny), constructed at display time from `pokeapi_id`
- Dex number, name, classification (`species_classification` — already seeded from `@pkmn/dex`)
- Types (primary + secondary)
- Height, weight
- Base stats (HP, Atk, Def, SpA, SpD, Spe)
- Abilities (normal slots + hidden, from `pokemon_abilities` junction)
- Evolution chain (from `pokemon_evolutions`)
- Flavor text (from `pokemon_flavor_text`)
- Related forms (from `pokemon` table, same `national_dex_number`)
- Cosmetic alternates + type variants (from `@pkmn/dex` at display time)
- Encounter locations by game version (from `pokemon_encounters` — **not yet implemented**, see section 2.11)
- Full movepool with learn method (level-up, TM, egg, tutor, etc.) — **not yet implemented**
- Team memberships (from `team_members` junction — **future: Team Builder phase**)

**Navigation:**
- **Incoming:** From PokemonList via pressing a row item
- **Outgoing:**
  - Tap ability → AbilityDetail screen
  - Tap move → MoveDetail screen
  - Tap evolution thumbnail → PokemonDetail for that Pokémon
  - Tap related form → PokemonDetail for that form
  - Tap battle team → Team detail screen (future)
  - Back button → PokemonList (preserve scroll position if possible)

---

### 2.2 Stat Chart Component (Hexagon/Radar)

**Purpose:** Visualize all 6 base stats in a hexagon/radar chart (all visible simultaneously).

**Approach:**
We recommend **custom SVG implementation** over external libraries (simpler, fewer dependencies, easier to customize for dark mode theming). Alternatively, **React Native Skia** or **Reanimated** could be used for animations.

**Specification:**
- 6 points representing: HP, Attack, Defense, Sp.Atk, Sp.Def, Speed (in order around hexagon)
- Each stat normalized to 0-100 scale for visual consistency (max base stat in game is ~180, so scale: `(value / 180) * 100`)
- Fill color: Type-based accent color (e.g., Electric type = yellow)
- Border color: Primary text color (#FFFFFF)
- Grid background: Subtle radial lines for scale reference
- Labels: Stat name + raw value (e.g., "HP 35") inside or outside hexagon
- Animation: When stats change (in team builder context), morphs smoothly over 300ms

**Reusability:**
- Component should accept:
  - `stats: { hp: number; attack: number; defense: number; spAttack: number; spDefense: number; speed: number }`
  - `accentColor: string` (type-based)
  - `showLabels?: boolean` (true for detail, false for compact team view)
  - `animated?: boolean` (true for morphing, false for static)

---

### 2.3 Shiny Sprite Toggle

**Feature:** User can toggle between normal and shiny sprite via button or radio toggle.

**Implementation:**
- State: `isShiny: boolean` (local screen state)
- Button/Toggle location: Under the main parallax artwork
- Animation: Cross-fade 200ms on toggle using React Native Animated or Reanimated
- Images: Pre-load both normal and shiny sprites on screen mount to avoid flickering
- Fallback: If shiny sprite unavailable, disable button (show grayed-out state)

---

### 2.4 Parallax Scrolling Header

**Feature:** Official artwork moves at 0.5x scroll velocity as user scrolls down the content.

**Implementation Approach:**
- Use React Native Reanimated 2 for smooth 60fps animation (already in tech stack)
- Bind image transform to ScrollView's scroll offset:
  ```
  imageTranslateY = scrollOffset * -0.5
  ```
- Preserve artwork aspect ratio within a fixed container (e.g., 300x300 px)
- Fade out artwork as user scrolls past it (optional polish)

**Code Pattern (pseudo):**
```typescript
const scrollOffset = useSharedValue(0);
const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ translateY: scrollOffset.value * -0.5 }],
}));

return (
  <ScrollView
    onScroll={useAnimatedScrollHandler({
      onScroll: (event) => {
        scrollOffset.value = event.contentOffset.y;
      },
    })}
  >
    <Animated.Image style={animatedStyle} source={artwork} />
    {/* rest of content */}
  </ScrollView>
);
```

---

### 2.5 Form/Variant Handling

**Requirement (REQ-017):**
- True form differences (Alolan Raichu, Mega Charizard X, Galarian Slowking, etc.) = separate Pokemon entries in DB
- Each form has own detail page with unique stats, types, abilities, moveset
- User navigates between forms via form selector (picker/carousel)

**Database Design:**
- Pokemon table already supports this via `form_type` + `national_dex_number` composite key
- Each form is a distinct row with full data

**UI Implementation:**
- Form selector appears only if Pokemon has alternate forms
- Displays as a horizontal ScrollView of form names or a dropdown picker
- Tapping a form reloads the entire detail screen with new form's data
- Navigation flow:
  1. Pikachu (base form) detail screen
  2. User selects "Alolan" form
  3. Screen re-renders with Alolan Raichu data (new dex #, stats, types, abilities)

**Important:** Form navigation should update the route/params so back button or deep link works correctly.

---

### 2.6 Moveset Section

**Features:**
- Display all learnable moves for this Pokemon
- Show learn method (Level Up, TM, Egg, Tutor, etc.) and learn level (if applicable)
- Searchable by move name (TextInput in section header)
- Sortable by: Name, Power, Accuracy, Category
- Display: Move row with type badge, category icon, power/accuracy/PP
- Tappable: Tap any move → navigate to MoveDetail screen

**Layout:**
```
Moveset (Browse all) [Search icon]
[Search... ]
Sort: [Name ▼]

[Thunderbolt] Electric | Physical | Pow: 90 | Acc: 100 | PP: 15
[Thunder Wave] Electric | Status | — | 75 | 30
[Volt Tackle] Electric | Physical | Pow: 120 | Acc: 100 | PP: 15
[Iron Tail] Steel | Physical | Pow: 100 | Acc: 75 | PP: 15
```

**Search/Sort State:**
- Local to this section (not affecting global list screen state)
- State persists while on detail screen (resets when navigating away)

---

### 2.7 Move Detail Screen (`app/(main)/(pokedex)/moves/[id].tsx` or stack param)

**Key Features:**
- Move name, type badge, category icon (physical/special/status)
- Power, Accuracy, Priority (all labeled clearly)
- Power Impact (e.g., "High Power" for 100+, "Medium" for 50-99, "Low" for <50)
- Full description/effect text
- List of Pokemon that learn this move (below-the-fold, tappable)
- Back button

**Layout:**
```
┌──────────────────────────────┐
│ < Thunderbolt               │
├──────────────────────────────┤
│ [Electric] [Physical]       │
│ Power: 90 | Accuracy: 100   │
│ Priority: 0 | PP: 15        │
├──────────────────────────────┤
│ Description                 │
│ A strong electric blast.    │
│ May paralyze the target.    │
├──────────────────────────────┤
│ Learned by Pokemon (32)     │
│ [Pikachu] [Raichu]          │
│ [Magnemite] [Zapdos]        │
│ [Jolteon] [Ampharos]        │
│ ...                         │
│ (infinite scroll, tappable) │
└──────────────────────────────┘
```

**Data Requirements:**
- Move name, type, category
- Power (nullable), Accuracy (nullable), Priority, PP
- Description
- List of Pokemon with this move (as tappable cards or rows)

**Navigation:**
- Back button → return to previous screen (Pokemon Detail or Moves List)
- Tap Pokemon card → navigate to that Pokemon Detail screen

---

### 2.8 Ability Detail Screen (`app/(main)/(pokedex)/abilities/[id].tsx`)

**Key Features:**
- Ability name, description/effect
- List of all Pokemon with this ability (scrollable, tappable)
- Filter by generation (optional: "Gen I", "Gen II", etc.)
- Back button

**Layout:**
```
┌──────────────────────────────┐
│ < Static                     │
├──────────────────────────────┤
│ Description                 │
│ May paralyze on contact.    │
├──────────────────────────────┤
│ Pokemon with Static (42)    │
│ Filters: [All] [Gen I] [Gen II] │
├──────────────────────────────┤
│ [Pikachu] [Raichu]          │
│ [Magnemite] [Magneton]      │
│ [Jolteon] [Electabuzz]      │
│ ...                         │
│ (infinite scroll, tappable) │
└──────────────────────────────┘
```

**Data Requirements:**
- Ability name, description
- List of Pokemon with this ability
- Generation info (for filtering)

**Navigation:**
- Back button → Abilities List or detail origin
- Tap Pokemon card → Pokemon Detail screen

---

### 2.9 Item Detail Screen (`app/(main)/(pokedex)/items/[id].tsx`)

**Key Features:**
- Item name, category icon, description
- Item category (Consumable, Held Item, Key Item, Machine, Berry, etc.)
- Effect description and usage context
- Back button

**Layout:**
```
┌──────────────────────────────┐
│ < Assault Vest              │
├──────────────────────────────┤
│ [Consumable] [Icon]         │
├──────────────────────────────┤
│ Effect                      │
│ Raises holder's Sp.Def by   │
│ 1.1x. User cannot use       │
│ status moves.               │
├──────────────────────────────┤
│ In-Battle Effect            │
│ Used by: Blissey, Espeon... │
└──────────────────────────────┘
```

**Data Requirements:**
- Item name, category, description
- Effect details

**Navigation:**
- Back button → Items List or detail origin
- (Items don't typically deep-link to other entities in MVP)

---

### 2.11 Location Encounters Section

**Status: ✅ IMPLEMENTED — `EncounterLocationsSection`, `useEncounterLocations`, `pokemon_encounter_locations` table, `runEncountersBackfill` (encounters_backfill_v1 gate)**

**Known data gap:** PokeAPI v2.9.0 has no encounter data for any Gen 9 (Scarlet/Violet) Pokémon — all return empty arrays. Gen 8 (Sword/Shield including DLC) is the most recent generation with substantive encounter coverage. The app correctly shows the empty state for affected Pokémon. When PokeAPI populates this data, clear `encounters_backfill_v1` from `sync_metadata` to re-fetch.

**Purpose:** Show where a Pokémon can be caught in each game, with encounter method and encounter rate.

**Data Source:** PokeAPI endpoint `GET /api/v2/pokemon/{pokeapi_id}/encounters`
- Returns an array of location area encounters, each with:
  - `location_area.name` — slug (e.g. `paldea-south-province-area-one-land`)
  - `version_details[]` — per-game data:
    - `version.name` — game slug (e.g. `scarlet`)
    - `encounter_details[].method.name` — how encountered (e.g. `walk`, `surf`, `fishing-good-rod`)
    - `encounter_details[].chance` — encounter rate (integer, e.g. `10` = 10%)
    - `encounter_details[].max_level` / `min_level`

**Required Schema Changes:**
```sql
CREATE TABLE IF NOT EXISTS pokemon_encounter_locations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pokemon_id INTEGER NOT NULL REFERENCES pokemon(id),
  game_version TEXT NOT NULL,        -- e.g. 'scarlet', 'violet', 'sword'
  location_name TEXT NOT NULL,       -- human-readable, derived from slug
  location_area_slug TEXT NOT NULL,  -- raw PokeAPI slug for deduplication
  encounter_method TEXT NOT NULL,    -- e.g. 'Walking', 'Surfing', 'Fishing'
  encounter_chance INTEGER NOT NULL, -- 0–100 integer
  min_level INTEGER,
  max_level INTEGER
);
CREATE INDEX idx_encounter_pokemon_game ON pokemon_encounter_locations(pokemon_id, game_version);
```

**Required New Enrichment Step:**
- Add as a 4th concurrent stream in `startPokeApiEnrichment()` alongside `enrichDatabaseAsync`, `runClassificationBackfill`, and `runMovesBackfill`
- Gate via a dedicated `sync_metadata` key: `encounters_backfill_v1 = 'done'` — same pattern as `classification_backfill_v1` and `moves_backfill_v1`. Do NOT use `ENRICH_VERSION` (currently `'1.2.0'`; a lower version bump would never fire on existing devices)
- Network constraint: fetch BEFORE `withTransactionAsync`
- Slug → display name conversion: replace hyphens with spaces, title-case (e.g. `south-province-area-one` → `South Province (Area One)`); maintain a hardcoded lookup table for known irregular names

**UI Specification:**

Game selector:
- Horizontal chip row, defaulting to the most recent game the Pokémon appears in
- Only show games where `encounter_chance > 0` for this Pokémon
- If Pokémon has no encounters in any game (legendaries, starters, gift Pokémon): show "Not available in the wild" message

Location list:
- Group by `location_name`; within each location, show encounter method + chance + level range
- Format: `Route 1 · Walking · 10% · Lv. 2–5`
- Order: by encounter chance descending

Empty state: "Bulbasaur cannot be caught in the wild in [Game]. It is obtained via [starter/gift/trade — if known]."

**New Hook Required:** `useEncounterLocations(pokemonId: number, gameVersion: string)`

**Note:** Encounter data is the most variable data per Pokémon (legendaries have 0 entries, common Pokémon may have 30+). Handle gracefully; this enrichment step should not block the UI.

---

### 2.12 Team Membership Badge (Hero Overlay)

**Status: ⏸️ FUTURE — Team Builder phase. Spec here for design continuity.**

**Purpose:** When a Pokémon is on one or more of the user's battle teams, display a small badge in the top-right corner of the parallax hero to signal its team membership at a glance.

**UI Specification:**
- **Position:** Top-right corner of the hero artwork area, 12px from edges
- **Appearance:** Small circular badge (28×28px), background `colors.primary` (`#CC0000`), white star icon (★) or a Poké Ball icon
- **Count indicator:** If Pokémon is on >1 team, show a small count bubble (`+2`) adjacent to the badge
- **Animation:** Fade in when hero loads and team data resolves (200ms); not present if on 0 teams
- **Accessibility:** `accessibilityLabel="On [N] battle team(s)"`, `accessibilityRole="image"`
- **Tap behavior:** Tapping the badge scrolls the screen to the Battle Teams section below

**Data Source:** `team_members` junction table (already exists in schema); query `WHERE pokemon_id = ?`

**Implementation Note:** The badge component should be a no-op (renders null) when Team Builder is not yet active. Gate on a feature flag or simply check if any teams exist for this Pokémon.

---

### 2.13 Battle Teams Section

**Status: ⏸️ FUTURE — Team Builder phase. Spec here for layout continuity.**

**Purpose:** Show which of the user's battle teams this Pokémon belongs to, directly on the detail screen, so the user can see its role at a glance and navigate to the team.

**UI Specification:**
- **Position:** Bottom of detail screen, after Moveset section
- **Section title:** "Battle Teams"
- **Empty state:** Hidden entirely (do not render section if Pokémon is on 0 teams)
- **Team row:** Team name + number of Pokémon on team + "Slot X" indicator
  - Format: `"Competitive Squad  · 6 Pokémon  · Slot 2"`
  - Tappable → navigates to that team's detail screen (Team Builder phase)
  - Right chevron icon (›)
- **Max rows shown:** 3; "See all [N] teams" link if more

**Layout:**
```
Battle Teams
"Competitive Squad"    6 Pokémon · Slot 2  ›
"Rain Team"            4 Pokémon · Slot 1  ›
```

**Data Source:** `teams` + `team_members` tables (already in schema).

---

### 2.14 Visual Quality, Responsiveness & Accessibility Requirements

**Purpose:** The current detail view implementation is a functional scaffold. These requirements define the standard it must meet before the phase is considered complete.

#### Visual Quality

**Hero Section:**
- Type-based backdrop must use a rich gradient (not a flat color): radial or linear gradient from type color at ~40% opacity fading to `colors.background`
- Artwork must render at full fidelity (no pixelation); use `contentFit="contain"` on expo-image with a minimum container of 280×280px
- Shiny toggle must be visually distinct and polished — not a plain text segmented control; use a pill/toggle with icon (✦ for shiny) and a subtle glow effect on the active state

**Type Badges:**
- Must be pill-shaped with the correct type color background and sufficient padding (horizontal 12px, vertical 5px minimum)
- Font must be bold, white, and pass WCAG AA contrast against the type background color — audit all 18 types

**Stats Chart:**
- Bar fill must use the Pokémon's primary type color (or a variant of it), not a uniform grey
- BST (Base Stat Total) displayed clearly below the chart
- Each bar must have a label (`HP`, `ATK`, etc.) and the raw number right-aligned

**Section Dividers:**
- Visual separation between sections should use subtle dividers (`colors.border`, 1px) or vertical whitespace — not both; pick one system and apply consistently

**Typography:**
- Pokémon name in the header: bold, large (≥24sp), truncated with ellipsis on long names
- Classification ("Seed Pokémon") displayed in `colors.textSecondary`, italic or subdued weight, directly below or adjacent to the name

#### Responsiveness

**Target screen widths:** 320px (iPhone SE) through 430px (iPhone 15 Pro Max) and equivalent Android sizes. The app does not currently target tablet, but layout must not break on screens wider than 430px.

**Rules:**
- No hardcoded pixel widths on full-width elements — use `flex: 1` or percentage widths
- Type badge rows must wrap if two badges + classification exceed one line (use `flexWrap: 'wrap'`)
- Related forms carousel must clip gracefully at screen edge with a peek of the next card
- Stat bars must stretch to fill available width minus consistent padding

#### Animations & Form Toggle Transitions

**Accepted behavior (2026-07-20):** Tapping a related form card uses `router.push()` — standard Expo Router stack navigation with the OS default transition. This is intentional: form navigation is navigation, not an in-screen state swap. No fade+scale animation on the outgoing screen is required. The OS transition provides sufficient visual continuity.

- **Shiny toggle:** 200ms cross-fade as specified — ensure this works correctly when form also changes.
- **Stat bar fill:** When first entering the screen, bars animate from 0 to their target value over 400ms (staggered by 50ms per row). Already implemented in StatChart; validate it fires on every navigation to the screen, not just the first mount.

#### Component Validation Checklist

Every component in the Pokemon detail screen must be validated against all of the following before the phase is marked complete:

**Functional correctness:**
- [ ] Renders correct data for a standard Pokémon (Bulbasaur)
- [ ] Renders correct data for a dual-type Pokémon (Charizard — Fire/Flying)
- [ ] Renders correct data for a single-ability Pokémon (Ditto — only Limber)
- [ ] Renders correct data for a Pokémon with hidden ability (Bulbasaur — Chlorophyll)
- [ ] Renders correctly for a Pokémon with branching evolution (Eevee — 8 branches)
- [ ] Renders correctly for a Pokémon with no evolution (Kangaskhan)
- [ ] Renders correctly for a Pokémon with no related forms (Pikachu base form)
- [ ] Renders correctly for a Pokémon with many related forms (Rotom — 6 forms)
- [ ] RelatedFormsSection carousel: tapping a form navigates correctly
- [ ] ShinyToggle: disabled state when shiny sprite not yet prefetched
- [ ] FlavorTextSection: handles Pokémon with only 1 game version entry
- [ ] StatChart: renders correctly when any stat is 1 (Shedinja HP = 1)

**Edge cases:**
- [ ] Very long Pokémon name (e.g. "Flabébé", "Mr. Mime", "Tapu Koko") — truncation or wrap
- [ ] No flavor text available — graceful empty state
- [ ] `species_classification` is null — graceful fallback (hide classification row)
- [ ] No encounter data for this game version — "Not available in the wild" message
- [ ] `pokeapi_id` missing — artwork placeholder shown, no crash

**Accessibility:**
- [ ] All tappable elements have `accessibilityRole` and `accessibilityLabel`
- [ ] Stat chart announces stats to screen reader (aria description with all 6 values)
- [ ] Shiny toggle announces state change ("Now showing shiny artwork")
- [ ] Form carousel items are announced with form name and type
- [ ] Back button is accessible and labeled "Go back to Pokédex"
- [ ] Flavor text game chips are announced with game name
- [ ] Color is never the sole indicator of meaning (type badges must have text label, not just color)

**Visual quality (manual review):**
- [ ] No layout overflow or clipping on iPhone SE (320px wide)
- [ ] No layout overflow or clipping on iPhone 15 Pro Max (430px wide)
- [ ] Type badge contrast passes WCAG AA for all 18 types
- [ ] All text readable in dark mode (no light text on light background)
- [ ] Hero artwork not pixelated or distorted
- [ ] Stat bar animation fires on every screen visit (not just first mount)
- [ ] Form transition animation plays correctly when switching forms

### 3.1 Route Structure

**Current Navigation:**
- Root: `_layout.tsx`
- Main tabs: `(main)/_layout.tsx` → [PokedexTab, TeamBuilderTab]
- PokedexTab: `(pokedex)/_layout.tsx` → [PokemonList, MovesList, AbilitiesList, ItemsList]

**New Detail Routes (Stack-based):**
Add a Stack Navigator within or above the tabs to handle detail screens:

**Option A: Stack per Entity (Recommended for MVP)**
```
NavigationContainer
├── RootStack
│   ├── MainTabs (existing)
│   │   ├── PokedexTab
│   │   │   ├── Pokemon List
│   │   │   ├── Moves List
│   │   │   ├── Abilities List
│   │   │   └── Items List
│   │   └── TeamBuilderTab
│   │       └── Team Screen
│   ├── PokemonDetailStack (modal or push)
│   │   ├── Pokemon Detail
│   │   ├── Move Detail
│   │   ├── Ability Detail
│   │   └── Item Detail
│   ├── MoveDetailStack
│   │   └── Move Detail (direct entry or via Pokemon)
│   ├── AbilityDetailStack
│   │   └── Ability Detail (direct entry or via Pokemon/Move)
│   └── ItemDetailStack
│       └── Item Detail (direct entry or via Pokemon/Move)
```

**Option B: Unified Detail Stack (Alternative)**
All detail screens in a single stack that can push/replace each other for cross-linking.

**Recommendation:** Use **Option A** for clarity. Each list screen has an associated detail stack that's pushed when user taps a row item. This prevents over-complication and makes back navigation intuitive.

**Deep Linking (Future):**
- `championdex://pokemon/25` → Pikachu Detail
- `championdex://move/25` → Thunderbolt Detail
- `championdex://ability/9` → Static Detail
- `championdex://item/12` → Assault Vest Detail

---

### 3.2 Navigation Parameters

**Pokemon Detail Route:**
```typescript
navigation.navigate('PokemonDetail', {
  pokemonId: 25,
  form?: 'alolan', // optional, for form variants
})
```

**Move Detail Route:**
```typescript
navigation.navigate('MoveDetail', {
  moveId: 25,
  origin?: 'pokemon', // optional: where user came from
})
```

**Ability Detail Route:**
```typescript
navigation.navigate('AbilityDetail', {
  abilityId: 9,
})
```

**Item Detail Route:**
```typescript
navigation.navigate('ItemDetail', {
  itemId: 12,
})
```

---

### 3.3 Back Navigation & Scroll Position

**Challenge:** Users expect back button to return to their previous position in a list (e.g., scrolled to row 100).

**Solution for MVP:**
- Store scroll position in React Context or AsyncStorage when navigating to detail
- On back navigation, restore scroll position if available
- Fallback: Scroll to item that was tapped (using FlatList's `scrollToIndex()`)

**Implementation (pseudo):**
```typescript
// In PokemonList screen, before navigation:
const handlePokemonPress = useCallback((pokemon: Pokemon, index: number) => {
  // Store scroll position
  saveListScrollPosition('pokemon', index);
  
  // Navigate to detail
  navigation.push('PokemonDetail', { pokemonId: pokemon.id });
}, []);

// On PokemonDetail back button:
const handleBack = useCallback(() => {
  const savedIndex = getListScrollPosition('pokemon');
  // Navigate back (React Navigation may auto-handle)
  navigation.goBack();
  // Caller (PokemonList) restores position on focus
}, []);
```

**React Navigation provides `useFocusEffect` for on-screen-focus triggers — use this to restore scroll position.**

---

## 4. Design System Integration

### 4.1 Type-Based Color Theming

**Pattern:** Each Pokemon detail screen accent color matches its primary type.

**Color Palette (18 Types):**
From `/src/constants/colors.ts`:
```typescript
TYPE_COLORS: {
  fire: '#F08030',
  water: '#6890F0',
  grass: '#78C850',
  electric: '#F8D030',
  ice: '#98D8D8',
  fighting: '#A05038',
  poison: '#A040A0',
  ground: '#E0C068',
  flying: '#A890F0',
  psychic: '#F85888',
  bug: '#A8B820',
  rock: '#B8A038',
  ghost: '#705898',
  dragon: '#7038F8',
  dark: '#705848',
  steel: '#B8B8D0',
  fairy: '#EE99AC',
  normal: '#A8A878',
}
```

**Application:**
- Pokemon Detail: Header background or accent bar uses primary type color
- Stat chart fill: Primary type color
- Buttons: Accent color for "Add to Team" CTA

**Fallback:** If dual-type Pokemon, use primary type. If unknown, use neutral gray (#999999).

---

### 4.2 Dark Mode Theming

**Base Colors (actual values from `src/constants/colors.ts`):**
- Background: `#111010`
- Surface: `#1E1A1A`
- Surface Elevated: `#2A2323`
- Border: `#3A2E2E`
- Border Light: `#4D3E3E`
- Text Primary: `#F5EEEE`
- Text Secondary: `#B89E9E`
- Text Muted: `#9A7A7A`
- Primary: `#CC0000`
- Accent: `#FFD700`

**Detail Screens:**
- Header: Surface color with type-based accent bar/underline
- Stat chart: Type-based fill on dark background
- Move rows: Surface cards with borders

---

### 4.3 Typography

**Hierarchy:**
- **Title (Pokemon name):** 28sp, weight 700 (H1 from system)
- **Section header (Abilities, Moveset):** 20sp, weight 600 (H2)
- **Body (Descriptions):** 16sp, weight 400
- **Meta (Dex #, types):** 14sp, weight 400 (secondary text color)
- **Labels (Power, Accuracy):** 12sp, weight 400

---

## 5. Data Access Patterns

### 5.1 New Hooks Required

**`usePokemonDetail(pokemonId: number, form?: string)`**
- Fetches single Pokemon with full detail data
- Returns: `{ pokemon, isLoading, error }`
- Data: stats, abilities, movepool, artwork URLs, forms, variants
- Caches result for quick re-renders

**`useMoveDetail(moveId: number)`**
- Fetches single move with description
- Returns: `{ move, isLoading, error }`
- Data: name, type, power, accuracy, priority, PP, description, Pokemon list

**`useAbilityDetail(abilityId: number)`**
- Fetches ability with Pokemon list
- Returns: `{ ability, pokemonList, isLoading, error }`

**`useItemDetail(itemId: number)`**
- Fetches item with category and description
- Returns: `{ item, isLoading, error }`

**`useMovesetForPokemon(pokemonId: number, searchQuery?: string, sortBy?: 'name'|'power'|'accuracy'|'category')`**
- Returns filtered/sorted moveset for a Pokemon
- Local filtering (moveset already loaded in Pokemon detail)

### 5.2 Database Queries

**Get Pokemon Detail (including moves & abilities):**
```sql
SELECT p.*, 
       GROUP_CONCAT(m.name) as moves,
       GROUP_CONCAT(a.name) as abilities
FROM pokemon p
LEFT JOIN pokemon_moves pm ON p.id = pm.pokemon_id
LEFT JOIN moves m ON pm.move_id = m.id
LEFT JOIN pokemon_abilities pa ON p.id = pa.pokemon_id
LEFT JOIN abilities a ON pa.ability_id = a.id
WHERE p.id = ? AND p.form_type = ?
GROUP BY p.id;
```

**Get Move Detail (including Pokemon list):**
```sql
SELECT m.*,
       GROUP_CONCAT(p.name) as pokemon_names
FROM moves m
LEFT JOIN pokemon_moves pm ON m.id = pm.move_id
LEFT JOIN pokemon p ON pm.pokemon_id = p.id
WHERE m.id = ?
GROUP BY m.id;
```

---

## 6. Animation Specifications

### 6.1 Parallax Scrolling

- **Velocity Ratio:** 0.5x (artwork moves half as fast as scroll)
- **Duration:** Continuous during scroll
- **FPS Target:** 60fps via Reanimated 2
- **Easing:** Linear (no easing, tied directly to scroll offset)

### 6.2 Shiny Toggle Cross-Fade

- **Duration:** 200ms
- **Easing:** Cubic bezier or ease-in-out
- **Pre-load:** Both images loaded before toggle available
- **Fallback:** If shiny unavailable, show disabled state

### 6.3 Stat Chart Morphing (Team Builder Context)

- **Duration:** 300ms
- **Easing:** Spring physics (slight overshoot for satisfying feel)
- **Trigger:** When IV/EV sliders update team member stats
- **Scope:** Out of MVP (Team Builder phase), but design for it now

### 6.4 Screen Transitions

- **Navigation push:** Slide from right (iOS), Fade (Android default)
- **Navigation pop (back):** Slide to right (iOS), Fade (Android default)
- **Detail modal (if used):** Slide up from bottom (optional polish)

---

## 7. Error Handling & Edge Cases

### 7.1 Missing Data

**Scenario:** Pokemon detail loads but artwork URL is broken or missing.
- **Handle:** Show placeholder image (Pokeball icon or gray box)
- **Log:** Error to console (Sentry post-launch)

**Scenario:** Move has no description.
- **Handle:** Show "No description available"

**Scenario:** Ability is learned by 0 Pokemon.
- **Handle:** Show "This ability is not found on any Pokémon" (rare, but handle gracefully)

### 7.2 Network Errors

**Scenario:** User navigates to detail screen without internet after initial data load (offline app).
- **Handle:** Data should load from SQLite (no network call needed)
- **If data missing:** Show error state with "Data not found" message

### 7.3 Form Variants Not Found

**Scenario:** User taps form variant that doesn't have data in DB.
- **Handle:** Disable button or show error toast
- **Fallback:** Stay on current form

---

## 8. Performance Considerations

### 8.1 Image Optimization

- **Artwork (parallax):** 256x256 px, ~30-50KB PNG
- **Sprites (normal + shiny):** 64x64 px, ~10KB each
- **Lazy load:** Pre-fetch both normal and shiny on screen mount
- **Memory:** Unload detail screen images when popped from navigation stack

### 8.2 Moveset Rendering

- **Moveset with 100+ moves:** Use FlashList for long move lists (if detail screen shows all moves)
- **Search/filter:** Local filtering only (no DB calls), debounce at 300ms

### 8.3 Stat Chart Performance

- **Rendering:** SVG is lightweight; no performance concerns for single chart
- **Morphing animation:** Use Reanimated shared values for smooth 60fps transitions

---

## 9. Accessibility Considerations

### 9.1 Screen Reader Support

**Pokemon Detail:**
- Back button labeled: "Go back"
- Parallax image: `accessibilityLabel="Official artwork for Pikachu"`
- Shiny toggle: `accessibilityLabel="Toggle shiny sprite variant"`
- Type badges: Each type read as semantic tag (e.g., "Electric type")
- Stat chart: Alternative text describing stats (e.g., "Pikachu stats: HP 35, Attack 55, Defense 40, Special Attack 50, Special Defense 50, Speed 90")
- Ability rows: Tappable with `accessibilityRole="button"`, `accessibilityLabel="Static ability, tap to see details"`
- Move rows: Tappable with `accessibilityRole="button"`, `accessibilityLabel="Thunderbolt move, power 90, accuracy 100%"`

**Move Detail:**
- Category icon: `accessibilityLabel="Physical move"`
- Stats row: "Power 90, Accuracy 100%, Priority 0"
- Pokemon list: "Learned by 32 Pokémon: Pikachu, Raichu, ..." (abbreviated)

### 9.2 Keyboard Navigation

- All tappable elements (abilities, moves, back button) must be reachable via keyboard tab order
- Tab order: back → type badges → abilities → stat chart → moves list → bottom actions
- Fallback: Long-press or context menu not required (standard back button sufficient)

### 9.3 Color Contrast

- Type-based accent colors must maintain 4.5:1 contrast ratio with text on them
- Review all type colors against dark backgrounds to ensure WCAG AA compliance

---

## 10. Known Design Decisions & Trade-Offs

### 10.1 Stat Chart Implementation

**Original Spec:** Custom SVG hexagon/radar chart

**Actual Implementation:** Animated horizontal **bar chart** (`src/components/pokemon/StatChart.tsx`)

**Why It Deviated:** Bar chart is simpler to implement correctly, performs well, and communicates stat values more clearly to users than a radar chart. Each stat has an animated bar filling to its relative value, with the raw number shown.

**Props implemented:**
```typescript
stats: { hp, attack, defense, spAttack, spDefense, speed }
accentColor?: string
maxStatValue?: number  // default 180
animated?: boolean
showValues?: boolean
valueFormat?: 'raw' | 'percentage'
onStatTap?: (statName: string) => void
```

**Bar gradient (finalised 2026-07-20):** Tier-anchored gradient, stops positioned at stat/180 thresholds:
- Colors: `['#A71D1D', '#FF7D2A', '#FFC629', '#90D440', '#4CAF50', '#00BCD4']`
- Locations: `[0, 0.167, 0.306, 0.472, 0.667, 1.0]` — thresholds: <30 red / ≥30 orange / ≥55 yellow / ≥85 lime / ≥120 green / outliers cyan
- Gradient width: `barTrackWidth` (screen width minus label column, value column, and gaps) — not `containerWidth`

**Future:** Stat morphing animation (team builder context, spec 6.3) not yet implemented — planned for Team Builder phase.

**Alternative Considered:** SVG hexagon or `react-native-skia` — reserve for future if a radar view is needed alongside the bar chart.

### 10.2 Movepool Rendering

**Decision:** Inline searchable/sortable list (FlashList if >100 moves, otherwise simple FlatList)

**Rationale:**
- Most Pokemon have <50 moves; simple ScrollView sufficient
- Search/sort local only (no backend calls)
- Tappable move rows create direct link to MoveDetail

**Future Enhancement:** If movepool gets complex (filtering by learn method, generation, etc.), consider moving to sub-screen.

### 10.3 Form Navigation

**Decision:** Form selector triggers full detail screen refresh (params change)

**Rationale:**
- Ensures all derived data is fresh (abilities, stats, movepool differ by form)
- Simpler than trying to partially update
- User-friendly: feels like navigating to a new screen (which it is)

**Performance:** Negligible impact since all data pre-loaded in SQLite

### 10.4 Back Button Placement

**Decision:** Use React Navigation's built-in back button (header)

**Rationale:**
- Consistent with platform conventions (iOS left chevron, Android up arrow)
- React Navigation handles backstack automatically
- Scroll position restoration via Context/AsyncStorage on focus

---

## 11. Testing Strategy

### 11.1 Component Tests

- [ ] PokemonDetail: Data loads, renders layout correctly
- [ ] PokemonDetail: Shiny toggle works, cross-fade animates
- [ ] PokemonDetail: Form selector updates correctly
- [ ] StatChart: Renders hexagon correctly with all 6 stats
- [ ] StatChart: Labels and colors display correctly
- [ ] MoveDetail: Move data loads and displays
- [ ] AbilityDetail: Ability data loads, Pokemon list renders
- [ ] ItemDetail: Item data loads and displays

### 11.2 Navigation Tests

- [ ] Tap Pokemon row → PokemonDetail loads with correct data
- [ ] Tap move in moveset → MoveDetail loads
- [ ] Tap ability in ability section → AbilityDetail loads
- [ ] Back button returns to previous screen
- [ ] Scroll position restored on back (or at least jumps to item)
- [ ] Form selector changes route/params correctly
- [ ] Deep link to Pokemon detail works (future)

### 11.3 Performance Tests

- [ ] PokemonDetail page loads in <200ms (requirement REQ-057)
- [ ] Parallax scrolling maintains 60fps
- [ ] Shiny toggle animation is smooth (<200ms)
- [ ] Large moveset (100+ moves) scrolls smoothly
- [ ] StatChart morphing animation is smooth (300ms)

### 11.4 Accessibility Tests

- [ ] VoiceOver (iOS): All sections readable, buttons labeled
- [ ] TalkBack (Android): All sections readable, buttons labeled
- [ ] Keyboard navigation: All interactive elements reachable
- [ ] Color contrast: All text readable (WCAG AA)

---

## 12. Open Design Questions

### Q1: Form Selector UI Pattern
**Question:** Should form selector be a horizontal scroll carousel, dropdown picker, or segmented control?
**Decision Required:** Design mockup review
**Implication:** Affects layout and UX flow for multi-form Pokemon like Rotom, Castform, Wormadam

### Q2: Moveset Grouping by Learn Method
**Question:** Should moveset be organized by learn method (Level Up, TM, Egg, Tutor) or flat searchable list?
**Decision Required:** Product feedback
**Implication:** Organizational clarity vs. simplicity

### Q3: Stat Chart Alternative Text
**Question:** How detailed should screen reader alt text be for stat chart? Full array of values or summary?
**Decision Required:** Accessibility audit
**Implication:** User experience for visually impaired players

### Q4: Cross-Linked Entities
**Question:** Should move detail show which abilities interact with this move (e.g., "Sheer Force boosts moves with secondary effects")? Or item detail show which moves benefit from it?
**Decision Required:** Feature scope discussion
**Implication:** Data model expansion, complex querying

---

## 13. Dependencies & Prerequisites

### Data Prerequisites
- [ ] SQLite schema fully migrated (pokemon, moves, abilities, items, and junction tables)
- [ ] PokeAPI data synced and tested (moves have descriptions, abilities linked)
- [ ] Image URLs validated and accessible
- [ ] Form variants properly keyed in database

### Technical Prerequisites
- [ ] React Navigation setup confirmed (stack + tabs working)
- [ ] Reanimated 2 working and tested on both iOS and Android
- [ ] SVG rendering working (react-native-svg or custom)
- [ ] Database queries optimized and indexed
- [ ] i18n system ready (translation keys defined but English-only content)

### Testing Prerequisites
- [ ] Test devices: iPhone 12+, Android Pixel 4a+
- [ ] Accessibility testing tools (VoiceOver, TalkBack, WCAG checker)
- [ ] Performance profiler (React Native Debugger, Flipper)

---

## 2.10 Cosmetic Alternates & Type Variants Sections

**Purpose:** Display form variants that are NOT stored as separate database entries. These variants share stats, types, and abilities but differ visually (cosmetic) or in type only (type variants). Sourced from `@pkmn/dex` at display time instead of from the SQLite database.

### Component: CosmeticAlternatesSection

**What It Displays:**
Sprite-only variants with no functional differences (same stats, types, abilities). User can see all variants exist but navigation to a separate detail screen is not available.

**Pokémon That Trigger This Section:**
- **Vivillon:** 19 wing patterns (Icy Snow, Polar, Tundra, Continental, Elegant, Meadow, Modern, Marine, Archipelago, High Plains, Sandstorm, River, Monsoon, Savanna, Sun, Ocean, Jungle, Fancy, Poke Ball)
- **Alcremie:** 7 cream/swirl flavors (Ruby Cream, Matcha Cream, Mint Cream, Lemon Cream, Salted Cream, Ruined, Strawberry Swirl)
- **Minior:** 7 core colors (Red, Orange, Yellow, Green, Blue, Indigo, Violet) — Note: Minior-Meteor has slightly different BST (335 vs 500), but design decision treats it as cosmetic for MVP consistency
- **Deerling:** 3 seasonal forms (Summer, Autumn, Winter) — Spring is base form
- **Shellos/Gastrodon:** East Sea variant (West Sea is base)
- **Cramorant:** Gulping/Gorging in-battle forms
- **Pichu-Spiky-eared**, **Cherrim-Sunshine**, **Magearna-Original**, **Zarude-Dada** (1 alternate each)
- **Squawkabilly:** Blue, Yellow, White (Green is base)
- **Poltchageist-Artisan**, **Sinistcha-Masterpiece**, **Sinistea-Antique**, **Polteageist-Antique** (1 alternate each)

**Data Source:**
- Query `@pkmn/dex` using `Dex.species.all()`, filtered by same `national_dex` number, excluding DB entries
- Sprite URLs constructed from `pokeApiId`: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${pokeApiId}.png`

**Layout:**
```
┌─────────────────────────────────────────┐
│ Other Forms                             │
├─────────────────────────────────────────┤
│ [Sprite] [Sprite] [Sprite] [Sprite]  → │
│ Icy Snow   Polar   Tundra   Continental │
└─────────────────────────────────────────┘
```

**UI Specification (implemented — deviates from original carousel design):**
- **Container:** Responsive 3-column flexbox grid (`flexBasis: '30%'`, `margin: spacing.xs` on each card). Does NOT use a horizontal ScrollView carousel — flexbox grid was chosen for better readability and easier maintenance.
- **Section Title:** "OTHER FORMS", Text Primary, marginBottom: spacing.md
- **Card Item:**
  - `flexBasis: '30%'`, margin: `spacing.xs`
  - Sprite: 64×64px, centered
  - Label: Caption, Text Secondary, centered below sprite
  - Border Radius: `borderRadius.md`
  - Background: `colors.surface` (`#1E1A1A`)
  - Border: 1px solid `colors.border` (`#3A2E2E`)
- **Double-padding trap:** Parent `contentContainer` already has `paddingHorizontal: spacing.lg`. Sections must NOT add their own horizontal padding or grid column widths will be 32px too wide.
- **Sprite URLs:** Two-tier lookup — `FORM_POKEAPI_IDS` map (species.id → PokeAPI form ID, uses `other/home/{id}.png`) then `FORM_SLUG_OVERRIDES` map, then default `{dexNum}-{formSlug}.png`. All 89 excluded form sprites validated HTTP 200 via `scripts/validateSpriteUrls.js`.
- **Cache key:** `['pokemon', 'form-variants', 'v5', nationalDex]` — bump version if URL logic changes.

**Interaction:**
- Tapping a thumbnail does NOT navigate to a new detail screen.

**Visibility Rule:**
- Only render if `cosmeticAlternates.length > 0`
- Section positioned after Evolution Chain, before TypeVariantsSection

---

### Component: TypeVariantsSection

**What It Displays:**
Forms that change only the Pokémon's type (via held item/memory), displayed with a type chip and unique sprite. Functionally distinct but visually grouped.

**Pokémon That Trigger This Section:**
- **Arceus:** 17 plate types (each grants a different type; base is Normal without held plate)
  - Types: Bug, Dark, Dragon, Electric, Fairy, Fighting, Fire, Flying, Ghost, Grass, Ground, Ice, Poison, Psychic, Rock, Steel, Water
- **Silvally:** 17 RKS System memories (functionally identical to Arceus; base is Normal without memory)
  - Types: Bug, Dark, Dragon, Electric, Fairy, Fighting, Fire, Flying, Ghost, Grass, Ground, Ice, Poison, Psychic, Rock, Steel, Water
- **Castform:** 3 weather forms
  - Sunny Form: Grass/Fire (base is Normal)
  - Rainy Form: Water
  - Snowy Form: Ice
- **Genesect:** 4 drives (Burn, Chill, Douse, Shock)
  - **OPEN QUESTION:** Genesect's type does NOT change (Bug/Steel for all forms); only the move Techno Blast changes type. This section may not apply, but drives are cosmetically distinct. For MVP, exclude Genesect; revisit post-launch if cross-linking moves to item-held effects is desired.

**Data Source:**
- Same as cosmetic alternates: `@pkmn/dex`, filtered by national dex number
- For each variant, extract `type_primary` and optionally `type_secondary`
- Sprite URLs: Same PokeAPI pattern

**Layout:**
```
┌─────────────────────────────────────────┐
│ Type Forms                              │
├─────────────────────────────────────────┤
│ [Sprite] [Sprite] [Sprite]  ...      → │
│ [Water]  [Grass]  [Psychic]            │
│ Aqua     Meadow   Mind Plate           │
└─────────────────────────────────────────┘
```

**UI Specification (implemented — same grid pattern as CosmeticAlternatesSection):**
- **Container:** Responsive 3-column flexbox grid, same layout as CosmeticAlternatesSection
- **Section Title:** "TYPE FORMS"
- **Card Item:** Same dimensions/styling as cosmetic alternates, with TypeBadge(s) rendered below sprite
  - Primary type always shown; secondary type shown if present
  - Use TypeBadge component (`size="sm"`)
- **Double-padding trap:** Same constraint — no additional horizontal padding on section

**Interaction:**
- Tapping a variant does NOT navigate to a detail screen.

**Visibility Rule:**
- Only render if `typeVariants.length > 0`
- Section positioned after CosmeticAlternatesSection, before RelatedFormsSection

---

### Data Access Pattern

**New Hook: `useFormVariants(nationalDex: number)`** — takes one argument, not two

```typescript
// Returns both cosmetic and type variants from @pkmn/dex
// src/hooks/queries/useFormVariants.ts — IMPLEMENTED
interface FormVariants {
  cosmeticAlternates: {
    id: string;
    name: string;
    spriteUrl: string;
    pokeApiId: number;
  }[];
  typeVariants: {
    id: string;
    name: string; // Form name (e.g., "Water Plate", "Sunny")
    spriteUrl: string;
    pokeApiId: number;
    types: { primary: string; secondary?: string };
  }[];
}

// Hook usage:
const { cosmeticAlternates, typeVariants } = useFormVariants(pokemon.nationalDex);
```

**Implementation Notes:**
- Query `@pkmn/dex` library, NOT SQLite
- Filter by exact `national_dex` match
- Exclude any entries already stored in the Pokemon DB table (to avoid duplication)
- Cache results with a 5-minute TTL (form data is static)
- Handle missing sprite URLs gracefully (show placeholder)

---

### Section Ordering on Detail Screen

**Actual implemented order (as of 2026-07-14):**

1. Hero (Parallax Artwork + Shiny Toggle)
2. Dex Number / Name / Classification / Types
3. Height, Weight, Generation
4. Abilities Section
5. Base Stats Chart
6. Evolution Chain
7. **Cosmetic Alternates Section** (`CosmeticAlternatesSection` — responsive 3-column grid, if applicable)
8. **Type Variants Section** (`TypeVariantsSection` — same grid, TypeBadge per variant, if applicable)
9. Related Forms Section (`RelatedFormsSection` — true form differences from DB, if applicable)
10. Flavor Text Section (`FlavorTextSection`)
11. Location Encounters Section (placeholder — REQ-029, not yet implemented)
12. Moveset Section

---

### 10.5 CosmeticAlternatesSection / TypeVariantsSection: Grid Not Carousel

**Original Spec:** Horizontal ScrollView carousel for both sections.

**Actual Implementation:** Responsive 3-column flexbox grid (`flexBasis: '30%'`, `margin: spacing.xs` on each card).

**Why It Deviated:** Grid is more readable at a glance, avoids horizontal scroll discovery problems, and handles variable counts (1–19 items) more cleanly than a carousel. Flexbox gap shorthand is unreliable in React Native — margin-on-card approach used instead.

**Sprite URL validation:** `scripts/validateSpriteUrls.js` mirrors the hook's URL resolution logic. Run after any sprite URL changes. 89/89 confirmed HTTP 200 as of 2026-07-14.

---

### Known Design Decision: G-Max Moves

**Note:** G-Max moves (from Gigantamax forms) are a separate system beyond this MVP. The moveset section currently displays standard moves only. When Gigantamax forms are added to the detail screen in a future phase, G-Max moves will require a dedicated moveset display or indicator. Current placeholder: "G-Max moveset display (TBD in future phase)".

---

### Known Design Decision: Genesect Drives

**Note:** Genesect's form variants (4 drives) change the move Techno Blast's type, but Genesect itself remains Bug/Steel. For MVP clarity, Genesect is excluded from the Type Variants section. Future phases may revisit this if move-item cross-linking is implemented. If included later, document that Genesect's type does NOT change despite drive selection.

---

## 14. Remaining Work (as of 2026-07-14)

**Legends Z-A Mega Forms (49 forms) — ✅ COMPLETE**
- `FUTURE_FORM_ALLOWLIST` in `seedDatabase.ts` bypasses `isNonstandard: 'Future'` for exactly these 49 forms
- `DATA_VERSION` bumped to `'1.10.0'`; `za_forms_enrichment_v1` backfill stream added as 5th concurrent stream
- Device confirmed: Hawlucha-Mega in list + RelatedFormsSection + detail screen; all 4 validation scripts pass

Remaining work in priority order:

1. **Visual quality, responsiveness & component validation** (REQ-032, spec 2.14) — ❌ NOT STARTED
   - Full checklist in section 2.14 — covers functional correctness, edge cases, accessibility, and visual quality
   - Enhanced form-switch animation (fade + scale on artwork/stats/badges)
   - Type badge contrast audit across all 18 types
   - Layout validation at 320px and 430px screen widths

**Deferred (Team Builder phase):**
- REQ-030: Team membership badge overlay on hero (spec 2.12)
- REQ-031: Battle Teams section at bottom of detail screen (spec 2.13)

---

## Appendix A: SQL Query Reference

### Get Pokemon Detail (with all relationships)
```sql
SELECT 
  p.id,
  p.national_dex_number,
  p.name,
  p.form_type,
  p.official_artwork_url,
  p.sprite_url,
  p.type_primary,
  p.type_secondary,
  p.hp,
  p.attack,
  p.defense,
  p.sp_attack,
  p.sp_defense,
  p.speed,
  p.ability_normal,
  p.ability_hidden,
  p.generation,
  GROUP_CONCAT(DISTINCT a.name || '|' || a.id || '|' || pa.is_hidden) as abilities,
  GROUP_CONCAT(DISTINCT m.name || '|' || m.id || '|' || pm.learn_method || '|' || pm.learn_level) as movepool
FROM pokemon p
LEFT JOIN pokemon_abilities pa ON p.id = pa.pokemon_id
LEFT JOIN abilities a ON pa.ability_id = a.id
LEFT JOIN pokemon_moves pm ON p.id = pm.pokemon_id
LEFT JOIN moves m ON pm.move_id = m.id
WHERE p.id = ? AND (p.form_type = ? OR ? = '')
GROUP BY p.id;
```

### Get All Forms for a Pokemon (by national dex number)
```sql
SELECT id, name, form_type, national_dex_number
FROM pokemon
WHERE national_dex_number = ?
ORDER BY form_type ASC;
```

### Get Move with Pokemon Learning It
```sql
SELECT 
  m.id,
  m.name,
  m.type,
  m.category,
  m.power,
  m.accuracy,
  m.priority,
  m.description,
  COUNT(DISTINCT pm.pokemon_id) as pokemon_count
FROM moves m
LEFT JOIN pokemon_moves pm ON m.id = pm.move_id
WHERE m.id = ?
GROUP BY m.id;
```

---

**Document Status:** In progress — 5 remaining items, see section 14.
**Implementation:** ~65% complete. Navigation, hero, stats, evolution, forms, flavor text all done. Moveset section, Pokemon cross-link lists, and cosmetic/type variant sections are the remaining work.
