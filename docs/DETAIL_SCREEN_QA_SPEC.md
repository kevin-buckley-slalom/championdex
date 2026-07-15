# Pokémon Detail Screen Redesign — QA Specification

**Version:** 1.0  
**Date:** 2026-07-14  
**Scope:** Comprehensive test specification for Pokémon detail screen redesign covering 18 user feedback issues.

---

## 1. REGRESSION RISK ANALYSIS

This section maps each proposed change to other parts of the app that depend on affected components. Regression testing must validate these dependencies before feature completion.

### 1.1 TypeBadge / TypeChip Component Changes (Issue #5, #12, #17)

**Issue:** Inconsistent type chip widths; need fixed-width TypeBadge with type symbol support; new TypeEffectiveness table needs consistent type rendering.

**Current State:**
- `TypeBadge.tsx` has `fixed` prop but it's not consistently used
- `size` variants: `'sm'` and `'md'` with different padding/font sizes
- Used in: RelatedFormsSection, list screens, moveset rows, abilities, evolution chains

**Cross-Component Dependencies:**

| Component | Impact | Risk Level |
|-----------|--------|-----------|
| **PokemonListScreen** | Type chips in list rows — must maintain current row height | HIGH |
| **MoveListScreen** | Type badges in move rows — card layout may shift if width changes | HIGH |
| **AbilityListScreen** | Type display in ability cards — potential row overflow | MEDIUM |
| **RelatedFormsSection** | Type display in form cards — card width calculation already fixed at 100px | MEDIUM |
| **EvolutionChain** | Type display in evolution thumbnails — text overflow risk if width increases | MEDIUM |
| **FilterChips** | Unrelated; uses different component | LOW |

**Test Strategy:**
- Measure fixed width before/after implementation on all 18 types
- Confirm longest type names (e.g., "Psychic", "Electric") don't wrap or crop
- Verify row/card heights don't change in dependent screens
- Test on 320px and 430px widths

---

### 1.2 Gender Display Overhaul (Issue #4)

**Issue:** Gender shows 100% male / 0% female for ALL Pokémon including exclusively female forms. Replace text with gender icons.

**Current State:**
- `formatGenderRatioString()` generates text like "87.5% male, 12.5% female"
- Used only in detail screen `genderRatio` text field
- Database stores `gender_rate` (-1 to 8 scale per PokeAPI)
- Affects form-specific data — same national dex may have different gender_rate per form

**Cross-Component Dependencies:**

| Component | Impact | Risk Level |
|-----------|--------|-----------|
| **Detail Screen gender display** | Direct user of `formatGenderRatioString()` — needs new icon-based component | HIGH |
| **Other screens** | Gender data NOT displayed elsewhere in app | NONE |
| **Database** | No schema change; gender_rate column already exists | LOW |
| **Navigation** | No impact | NONE |

**Test Strategy:**
- Verify gender_rate is correctly fetched per Pokémon form (not cached incorrectly)
- Test all 8 gender_rate values: -1 (genderless), 0–7 (varying ratios), 8 (100% female)
- Create gender icon component in isolation before integration
- Confirm icons render at correct size on 320px and 430px

---

### 1.3 Base Stat Graph Color Coding (Issue #10)

**Issue:** Stat bar colors should be value-based (cyan ≥120, green ≥90, yellow ≥60, orange ≥30, red <30), not type-color. Labels abbreviated (ATK, DEF, SPD). Title: "Base Stat Total" not "Total Base Stat (BST)".

**Current State:**
- `StatChart.tsx` accepts `accentColor` prop (type-based)
- All bars use same color; detail screen passes type color
- Labels are full names: "ATTACK", "DEFENSE", "SP. ATK", "SP. DEF", "SPEED", "HP"
- Title is "TOTAL BASE STAT (BST):"

**Cross-Component Dependencies:**

| Component | Impact | Risk Level |
|-----------|--------|-----------|
| **Detail Screen** | Primary consumer of StatChart — visual change only | HIGH |
| **Ability Detail Screen** | May show stats if ability affects them (check if implemented) | LOW |
| **Team Building (future)** | May use stat comparison — color scheme consistency important | MEDIUM |
| **Export/Share (future)** | If stat graphs exported, color scheme affects UI consistency | LOW |

**Test Strategy:**
- Isolate StatChart component; test with various stat values
- Confirm color thresholds apply correctly (test boundary values: 29, 30, 59, 60, 89, 90, 119, 120)
- Verify label abbreviations don't obscure meaning
- Test animation timing with new colors
- Confirm stat values display correctly on narrow screens

---

### 1.4 Evolution Chain Layout (Issue #11)

**Issue:** Evolution tree should be left-to-right horizontal, not top-to-bottom vertical.

**Current State:**
- `EvolutionChain.tsx` renders vertically with arrows (▼) between stages
- Supports branching (Eevee) and linear chains
- Used only in detail screen

**Cross-Component Dependencies:**

| Component | Impact | Risk Level |
|-----------|--------|-----------|
| **Detail Screen** | Direct user; scrollable view accommodates layout | MEDIUM |
| **Navigation** | No impact | NONE |
| **Other features** | Not used elsewhere | NONE |

**Test Strategy:**
- Test linear chains: Squirtle → Wartortle → Blastoise
- Test branching: Eevee (8 evolutions)
- Test complex splits: Kirlia → Gardevoir (stone) or Gallade (stone + male)
- Test baby pre-evos: Pichu → Pikachu → Raichu
- Test Pokémon with no evolution: Charizard
- Confirm horizontal scroll doesn't conflict with page scroll
- Test at 320px (may force wrapping or truncation)

---

### 1.5 Related Forms Redesign (Issue #12, #13)

**Issue:** Use grid not carousel; exclude current form; type chips fixed width + type symbol; visually indicate navigable (not static); clarify these are visual-only forms.

**Current State:**
- `RelatedFormsSection.tsx` is a horizontal carousel with pagination dots
- Includes current form (has border highlight)
- Title: "RELATED FORMS" or "FORMS & VARIANTS" (≥6 forms)

**Cross-Component Dependencies:**

| Component | Impact | Risk Level |
|-----------|--------|-----------|
| **Detail Screen** | Direct user; only place forms section appears | HIGH |
| **Navigation** | Opens form via router.push() — no change | NONE |
| **TypeVariantsSection** | Similar component but for type variants (different intent) | LOW |
| **CosmeticAlternatesSection** | Similar component for cosmetic variants (different intent) | LOW |

**Test Strategy:**
- Rotom (6 forms): confirm all render in grid without pagination
- Charizard (2 forms: regular + Gigantamax in some games): confirm grid layout
- Alcremie (63 forms): confirm grid handles large collections
- Pikachu (regional variants: Alola, Galar, Hisui): confirm caption clarity
- Test carousel → grid transition doesn't break navigation
- Verify current form is correctly excluded
- Confirm grid wraps appropriately at 320px and 430px

---

### 1.6 Type Effectiveness Table (NEW FEATURE #17)

**Issue:** New component positioned below stat chart. Up to 3 tabs (Defense + one per type). 18 type squares each (9×2 grid per tab). Effectiveness values below each square (1/4, 1/2, 0, 1, 2, 4). Color-coded: Defense (green <1, red >1, gray 0); Offense (red <1, green >1, gray 0).

**Cross-Component Dependencies:**

| Component | Impact | Risk Level |
|-----------|--------|-----------|
| **Detail Screen scroll** | New section added below stat chart — scrollable view accommodates | MEDIUM |
| **TypeBadge component** | Type squares in effectiveness table must use consistent styling | HIGH |
| **Data layer** | Requires type matchup data (immunities, resistances, weaknesses) — check if seeded | HIGH |
| **Navigation** | Tapping type square may navigate to type guide (TBD) | LOW |

**Test Strategy:**
- Monotype Pokémon: confirm 1 offense tab + defense tab (2 total)
- Dual-type Pokémon: confirm 2 offense tabs + defense tab (3 total)
- Genderless/form variations: confirm type data correct
- Test type matchup accuracy:
  - Water/Ground (Swampy): should show correct dual-type defense
  - Fire-type offense tab: verify correct matchups
- Test effectiveness value display: 1/4, 1/2, 0, 1, 2, 4 all present and accurate
- Confirm color coding correct for each tab type
- Test tab switching on 320px (may require horizontal scroll)
- Verify zero effectiveness shown as empty outline, not colored square

---

### 1.7 Hero Section & Shiny Toggle (Issue #2, #9)

**Issue:** Shiny toggle must not obscure bottom of image. Legendary/mythical overlay overlaps abilities — move to transparent stylized header at top-center of hero.

**Current State:**
- `PokemonHero` component (not shown in provided code)
- Shiny toggle position blocks image
- Legendary/mythical overlay at bottom blocks abilities section

**Cross-Component Dependencies:**

| Component | Impact | Risk Level |
|-----------|--------|-----------|
| **Detail Screen layout** | Depends on hero height — may shift abilities section | MEDIUM |
| **Abilities section** | Positioned below hero; overlap risk if overlay not repositioned | HIGH |
| **Parallax scroll handler** | Uses scrollOffset for header animation — timing may need adjustment | MEDIUM |

**Test Strategy:**
- Verify shiny toggle renders at top-right without blocking artwork
- Confirm legend/mythical indicator at top-center of hero
- Test with tall Pokémon sprites: Garchomp, Onix, Eternatus
- Test with small Pokémon sprites: Caterpie, Jigglypuff
- Confirm abilities section not overlapped at any scroll position
- Test parallax animation still smooth

---

### 1.8 Upper Info Section Redesign (Issue #3)

**Issue:** Dex ID, name, classification, gender, types all stacked vertically, too small, not stylistic. Increase font sizes (especially name), better use of space.

**Current State:**
- Inline styles with small font sizes
- Sequential layout: dex number, name, classification, gender ratio
- Type badges in separate section below

**Cross-Component Dependencies:**

| Component | Impact | Risk Level |
|-----------|--------|-----------|
| **Detail Screen** | Direct user; layout change may affect scroll offset calculations | MEDIUM |
| **Back button positioning** | In header; no impact | NONE |
| **Name used in header** | `headerTitleOpacity` animation may need timing adjustment | LOW |

**Test Strategy:**
- Confirm name font size legible on 320px (test with long names: "Wormadam-Sandy")
- Test dex number display accuracy
- Test classification rendering on narrow screens
- Confirm gender display integrates cleanly with new layout
- Test at both 320px and 430px widths

---

### 1.9 Double Back Button (Issue #1)

**Issue:** Appbar shows back button + "[id]", plus a second "back" button above the hero. Remove hero back button; update "[id]" to Pokémon's name.

**Current State:**
- Header has back button + animated title
- Hero section has its own back button (visual review needed)
- Title shows `{pokemon.displayName}` already

**Cross-Component Dependencies:**

| Component | Impact | Risk Level |
|-----------|--------|-----------|
| **Navigation** | Back button must correctly pop stack — verify no breakage | MEDIUM |
| **Header animation** | Title opacity animation unaffected | NONE |

**Test Strategy:**
- Verify only one back button present in header
- Test back navigation: detail → list screen
- Test back navigation: detail → search → detail
- Confirm title shows name correctly

---

### 1.10 Height Data (Issue #6)

**Issue:** Height is blank for all Pokémon. Verify height data in database.

**Current State:**
- Display uses `pokemon.height` value
- Conversion functions: `toMetricHeight()`, `toImperialHeight()`
- Database likely has height column but may be NULL

**Cross-Component Dependencies:**

| Component | Impact | Risk Level |
|-----------|--------|-----------|
| **Database seed** | Data pipeline issue — not a component issue | HIGH |
| **Other screens** | Height not displayed elsewhere | NONE |

**Test Strategy:**
- Check database directly: `SELECT national_dex, height, weight FROM pokemon LIMIT 10`
- Verify conversion functions return correct format (e.g., "0.3m (1'0\")")
- Test with Pokémon known heights: Wailord (14.5m), Caterpie (0.3m)
- Confirm height displays when data present

---

### 1.11 Height/Weight/Generation De-emphasis (Issue #7)

**Issue:** Height/weight/generation boxes too prominent — de-emphasize in favor of gameplay-impactful info.

**Current State:**
- `infoGrid` displays 3 cards: height, weight, generation + legend/mythical badges
- Cards have background, border, equal visual weight

**Cross-Component Dependencies:**

| Component | Impact | Risk Level |
|-----------|--------|-----------|
| **Detail Screen** | Visual styling change only | LOW |
| **Data display** | Data still available; just visually de-emphasized | NONE |

**Test Strategy:**
- Confirm cards styled with reduced visual weight (e.g., lighter background, smaller font)
- Verify information still accessible
- Test at both screen widths

---

### 1.12 Ability Tiles Chevrons (Issue #8)

**Issue:** Ability tiles need chevrons to indicate they are navigable.

**Current State:**
- Abilities rendered as pressable rows with name + "Hidden" badge
- No chevron indicator
- Navigate to ability detail via `router.push(/abilities/{id})`

**Cross-Component Dependencies:**

| Component | Impact | Risk Level |
|-----------|--------|-----------|
| **Ability Detail Screen** | Destination of navigation — ensure route works | LOW |
| **Other components using abilities** | None identified | NONE |

**Test Strategy:**
- Confirm chevron present on each ability tile
- Test navigation to ability detail screen
- Confirm chevron color consistent with design system

---

### 1.13 Pokedex Entries UI (Issue #14)

**Issue:** Chip selection unintuitive on narrow mobile, order not latest-first. Redesign with modern UI filtering.

**Current State:**
- `FlavorTextSection` component (not provided)
- Uses chip selection for game/version filtering
- Order unclear

**Cross-Component Dependencies:**

| Component | Impact | Risk Level |
|-----------|--------|-----------|
| **FlavorTextSection** | Owns filter UI — internal change only | MEDIUM |
| **Detail Screen** | Layout must accommodate new filter UI | LOW |
| **Data layer** | Flavor text data order — must sort by game generation/version | MEDIUM |

**Test Strategy:**
- Test with Pokémon having 20+ Pokedex entries (Pikachu, Charizard)
- Confirm latest-first ordering
- Test filter UI on 320px and 430px
- Test chip selection state persistence

---

### 1.14 Location Encounters UI (Issue #15)

**Issue:** Same filtering UI problem as Pokedex entries — use consistent UI element.

**Current State:**
- `EncounterLocationsSection` component (not provided)
- Filtering UI must match Pokedex entries redesign

**Cross-Component Dependencies:**

| Component | Impact | Risk Level |
|-----------|--------|-----------|
| **EncounterLocationsSection** | Owns filter UI — internal change only | MEDIUM |
| **FlavorTextSection** | Must use same UI pattern for consistency | HIGH |
| **Detail Screen** | Layout must accommodate new filter UI | LOW |

**Test Strategy:**
- Test with Pokémon having encounters in 20+ locations
- Confirm filter UI matches Pokedex entries pattern
- Test on 320px and 430px
- Test filter state persistence

---

### 1.15 Moveset Section Enhancement (Issue #16)

**Issue:** Extend existing move list component from main list page. Add learn methodology. Add game/generation filter using same consistent toggle UI as Pokedex entries and Encounters.

**Current State:**
- Moveset section has inline search and sort controls
- Shows moves with type badge, category, power, accuracy, PP, learn method
- No game version filtering

**Cross-Component Dependencies:**

| Component | Impact | Risk Level |
|-----------|--------|-----------|
| **MoveListScreen** | Source component to extend — must not break list screen layout | HIGH |
| **Move row layout** | Already used in list screen — reuse component to ensure consistency | HIGH |
| **Game version filter UI** | Must match Pokedex + Encounters pattern | HIGH |
| **Learn method display** | Already implemented (`formatLearnMethod()`); verify works with all methods | MEDIUM |

**Test Strategy:**
- Test move list component works in isolation
- Test with Pokémon having 0 moves (new forms like Pecharunt in some versions)
- Test with Pokémon having 100+ moves (test filtering/sorting performance)
- Test learn method display for all method types: level-up, TM, egg, tutor, move-tutor
- Test game version filter with Pokémon appearing in 30+ games (Pikachu)
- Test search functionality on moves
- Test sort by power/accuracy/category on narrow screens
- Confirm UI pattern consistency with Pokedex + Encounters

---

### 1.16 Font Size Consistency (Issue — general)

**Issue:** Font sizes inconsistent — fix after layout redesign.

**Current State:**
- Various fontSize values scattered throughout styles
- No design system spec for typography

**Cross-Component Dependencies:**

| Component | Impact | Risk Level |
|-----------|--------|-----------|
| **All detail screen sections** | Font sizing review affects readability | MEDIUM |
| **Design system** | Opportunity to establish typography baseline | LOW |

**Test Strategy:**
- Document current font sizes by element type
- Confirm new sizes follow design system hierarchy
- Test readability on 320px and 430px

---

### 1.17 Overall Design Quality (Issue — general)

**Issue:** Too generic and blocky. Needs modern feel, seamless transitions, artistic flow, fun to look at while easily consumed.

**Cross-Component Dependencies:**

| Component | Impact | Risk Level |
|-----------|--------|-----------|
| **All visual elements** | Styling and animation review affects entire screen | MEDIUM |
| **Performance** | Animations must not cause jank on low-end devices | HIGH |
| **Design system** | Visual language consistency across app | MEDIUM |

**Test Strategy:**
- Visual design review on physical device (not just simulator)
- Animation performance test on low-end device (iPhone SE or equivalent)
- Confirm no layout thrashing from animations
- Test transition smoothness between sections on slow scroll

---

## 2. CRITICAL TEST CASES

### 2.1 Gender Display Test Cases

**Objective:** Validate gender display works correctly for all gender_rate values and handles form-specific gender data.

| Test ID | Pokémon | Form | Gender Rate | Expected Display | Risk |
|---------|---------|------|-------------|------------------|------|
| GEN-001 | Bulbasaur | Base | 1 | ~87.5% M, ~12.5% F | LOW |
| GEN-002 | Charmander | Base | 1 | ~87.5% M, ~12.5% F | LOW |
| GEN-003 | Squirtle | Base | 1 | ~87.5% M, ~12.5% F | LOW |
| GEN-004 | Pikachu (female) | Base | 1 | Icon: 87.5% M, 12.5% F | MEDIUM |
| GEN-005 | Nidoran♀ | Base | 8 | Icon: 100% F | MEDIUM |
| GEN-006 | Nidoran♂ | Base | 0 | Icon: 100% M | MEDIUM |
| GEN-007 | Clefable | Base | 7 | Icon: 25% M, 75% F | MEDIUM |
| GEN-008 | Jynx | Base | 8 | Icon: 100% F | MEDIUM |
| GEN-009 | Chansey | Base | 8 | Icon: 100% F | MEDIUM |
| GEN-010 | Meowth | Base | 1 | Icon: 87.5% M, 12.5% F | LOW |
| GEN-011 | Slowbro | Base | 1 | Icon: 87.5% M, 12.5% F | LOW |
| GEN-012 | Seel | Base | 1 | Icon: 87.5% M, 12.5% F | LOW |
| GEN-013 | Shellder | Base | 1 | Icon: 87.5% M, 12.5% F | LOW |
| GEN-014 | Grimer | Base | 1 | Icon: 87.5% M, 12.5% F | LOW |
| GEN-015 | Tangela | Base | 1 | Icon: 87.5% M, 12.5% F | LOW |
| GEN-016 | Kangaskhan | Base | 8 | Icon: 100% F | MEDIUM |
| GEN-017 | Horsea | Base | 1 | Icon: 87.5% M, 12.5% F | LOW |
| GEN-018 | Goldeen | Base | 1 | Icon: 87.5% M, 12.5% F | LOW |
| GEN-019 | Staryu | Base | -1 | "Genderless" icon | MEDIUM |
| GEN-020 | Magnemite | Base | -1 | "Genderless" icon | MEDIUM |
| GEN-021 | Dhelmise | Base | -1 | "Genderless" icon | MEDIUM |
| GEN-022 | Alcremie | Base | 1 | Icon: 87.5% M, 12.5% F (fixed, not 100% M bug) | HIGH |
| GEN-023 | Alcremie | Gmax | 1 | Icon: 87.5% M, 12.5% F (matches base) | HIGH |

**Assertions:**
- Gender icons render without text
- Icon colors consistent (blue = male, pink = female, gray = genderless)
- Form-specific gender_rate is fetched correctly (not inherited from base form)
- Edge case: verify all-female forms show 100% F icon (not 100% M bug)
- Edge case: verify genderless Pokémon show genderless icon (not 50/50)

---

### 2.2 Type Effectiveness Table Test Cases

**Objective:** Validate type matchup accuracy, tab switching, color coding, and effectiveness value display.

#### 2.2.1 Monotype Pokémon

| Test ID | Pokémon | Type | Expected Tabs | Notes |
|---------|---------|------|---|---|
| TYPE-001 | Pikachu | Electric | Defense + Electric offense (2 tabs) | Offense tab shows Pikachu's attacking effectiveness |
| TYPE-002 | Charizard | Fire-Flying | Defense + Fire offense + Flying offense (3 tabs) | Dual-type |
| TYPE-003 | Ditto | Normal | Defense + Normal offense (2 tabs) | Single type |
| TYPE-004 | Magnemite | Electric-Steel | Defense + Electric + Steel (3 tabs) | Dual-type with immunities |

#### 2.2.2 Effectiveness Value Accuracy

| Test ID | Pokémon Type | Match-up | Expected Value | Expected Color (Defense) | Notes |
|---------|---|---|---|---|---|
| ETYPE-001 | Water | vs Fire | 2 (resist) | Green | 0.5x damage taken |
| ETYPE-002 | Water | vs Electric | 0.5 (weak) | Red | 2x damage taken |
| ETYPE-003 | Water | vs Water | 0.5 (resist) | Green | 0.5x damage taken |
| ETYPE-004 | Steel | vs Normal | 0.5 (resist) | Green | 0.5x damage taken |
| ETYPE-005 | Steel | vs Fire | 2 (weak) | Red | 2x damage taken |
| ETYPE-006 | Ghost | vs Poison | 0 (immune) | Gray | 0x damage taken |
| ETYPE-007 | Flying | vs Ground | 0 (immune) | Gray | 0x damage taken |
| ETYPE-008 | Normal | vs Fighting | 2 (weak) | Red | 2x damage taken |
| ETYPE-009 | Psychic | vs Ghost | 2 (weak) | Red | 2x damage taken |
| ETYPE-010 | Fire-Flying | vs Rock | 4 (double weak) | Red (darkened) | 4x damage taken |

#### 2.2.3 Dual-Type Immunities & Weaknesses

| Test ID | Pokémon | Types | Special Case | Expected Behavior |
|---------|---------|-------|---|---|
| DT-001 | Sableye | Dark-Ghost | 0 weaknesses in Gen 5+ | Defense tab shows only resistances/immunities |
| DT-002 | Paras | Bug-Grass | 4x weak to Fire/Flying/Ice/Rock | All 4 display with darkened red |
| DT-003 | Water-Flying | Water-Flying | Immune to Electric (unique combo) | Ghost/Electric/Ground not in weakness section |
| DT-004 | Ghost-Dark | Ghost-Dark | Immune to Normal, Fighting, Poison | Three immunity squares shown in gray |

#### 2.2.4 Effectiveness Color Coding

| Test ID | Tab Type | Weak (<1) | Resist (≤1) | Immune (0) | Super-effective (>1) | Not-effective (<1) |
|---------|---|---|---|---|---|---|
| COLOR-001 | Defense | Red | Green | Gray | N/A | N/A |
| COLOR-002 | Offense | Red | Red | Gray | Green | Red |
| COLOR-003 | Dual Offense | Red | Red | Gray | Green | Red |

---

### 2.3 Evolution Chain Layout Test Cases

**Objective:** Validate horizontal left-to-right layout, branching support, and scrolling behavior.

| Test ID | Pokémon | Chain Characteristics | Expected Layout | Risk |
|---------|---------|---|---|---|
| EVO-001 | Bulbasaur | Linear: Bulba → Ivysaur → Venusaur | Left-to-right horizontal | LOW |
| EVO-002 | Eevee | Branching: Eevee → 8 evolutions | Horizontal with branching (2-4 rows below Eevee) | HIGH |
| EVO-003 | Pichu | Baby pre-evo: Pichu → Pikachu → Raichu | Left-to-right with Pichu above | MEDIUM |
| EVO-004 | Kirlia | Split: Kirlia → Gardevoir (stone) or Gallade (stone + male) | Horizontal branching with conditions shown | HIGH |
| EVO-005 | Wurmple | Branching: Wurmple → Silcoon or Cascoon | Horizontal split | MEDIUM |
| EVO-006 | Charizard | No evolution (final form) | "Does not evolve" text | LOW |
| EVO-007 | Farfetch'd | No evolution (classic) | "Does not evolve" text | LOW |
| EVO-008 | Wailord | Large horizontal chain: Azurill → Marill → Azumarill → Wailord | Left-to-right; may require scroll at 320px | MEDIUM |

**Assertions:**
- Chain renders fully horizontally, not vertically
- Branching evolutions show multiple paths clearly
- Conditions (level, item, trade, etc.) display below arrows
- Navigation to evolution works via tap
- Horizontal scroll doesn't interfere with page scroll
- No text overlap at 320px

---

### 2.4 Related Forms Test Cases

**Objective:** Validate grid layout, form exclusion, type chip consistency, and navigability indication.

| Test ID | Pokémon | Form Count | Expected Layout | Risk |
|---------|---------|---|---|---|
| FORM-001 | Charizard | 2 | Grid 2-col | LOW |
| FORM-002 | Rotom | 6 | Grid 2-col (3 rows) | MEDIUM |
| FORM-003 | Alcremie | 63 | Grid multi-page or scrollable | HIGH |
| FORM-004 | Alolan Raichu | 1 (only Alolan form shown, base excluded as "current") | Grid 1 item | MEDIUM |
| FORM-005 | Wormadam | 3 (Sandy, Trash, Plant) | Grid 2-col | LOW |
| FORM-006 | Cherrim | 2 (Overcast, Sunshine) | Grid 2-col | LOW |
| FORM-007 | Castform | 4 (Rainy, Snowy, Sunny, Normal) | Grid 2-col (2 rows) | MEDIUM |

**Assertions:**
- Current form is excluded from list
- Each form card shows: sprite, name, types (fixed-width chips), navigable indicator (chevron or similar)
- Grid wraps appropriately at 320px and 430px
- Form name clearly indicates it's visual-only ("Alolan", "Galar", etc.)
- Tap navigates to form detail screen
- Type chips don't wrap or crop

---

### 2.5 Type Chip Fixed-Width Test Cases

**Objective:** Validate all 18 types render at consistent width without wrapping.

| Test ID | Types to Test | Expected Width | Notes |
|---------|---|---|---|
| CHIP-001 | Normal, Fire, Water | Baseline | Shortest names |
| CHIP-002 | Grass, Ice, Flying, Dark | Medium | Medium names |
| CHIP-003 | Psychic, Electric, Fighting | Longer names | Should not wrap |
| CHIP-004 | Dragon, Ground, Poison, Ghost | Variable | Real-world test |
| CHIP-ALL | All 18 types in one row | Consistent width | Visual inspection |

**Specific Type Names to Test (by length):**
- 3-4 chars: Bug, Dark, Fire, Grass, Ice, Rock, Steel, Water
- 5-7 chars: Dragon, Flying, Normal, Poison, Psychic
- 8 chars: Electric, Fighting, Fairy, Ground, Ghost
- 11 chars: Psychic (max)

**Test Procedure:**
1. Render TypeBadge with `fixed={true}` for each type
2. Measure width of each; confirm identical
3. Measure text overflow; confirm zero wrapping
4. Test in RelatedFormsSection, moveset rows, ability section

---

### 2.6 Moveset Test Cases

**Objective:** Validate move list component reuse, filtering, sorting, and learn method display.

| Test ID | Pokémon | Move Count | Expected Behavior | Risk |
|---------|---------|---|---|---|
| MOVE-001 | Pikachu | ~50 | List renders with search, sort, game filter | MEDIUM |
| MOVE-002 | Mew | 160+ | Performance: smooth scroll, filter responsive | HIGH |
| MOVE-003 | New Z-A form | 0 | "No moves" state | MEDIUM |
| MOVE-004 | Bulbasaur | 50+ | All learn methods display: Level-up, TM, Egg, Tutor | MEDIUM |
| MOVE-005 | Any Pokémon | 20+ versions | Game version filter shows all available games | HIGH |

**Learn Method Test Cases:**
| Test ID | Learn Method | Example Pokémon | Expected Display |
|---------|---|---|---|
| LM-001 | Level-up Lv. 5 | Bulbasaur | "Lv. 5" |
| LM-002 | TM | Pikachu | "TM" |
| LM-003 | Egg move | Pikachu | "Egg" |
| LM-004 | Move tutor | Blastoise (if in game) | "Tutor" |
| LM-005 | Machine (TM/HM) | Charizard | "TM" or "HM" |

**Game Version Filter Test Cases:**
| Test ID | Pokémon | Game Count | Expected Filter UI |
|---------|---------|---|---|
| GF-001 | Pikachu | 30+ | Dropdown or chip selection; "All" option |
| GF-002 | Regional form | 5-10 | Excludes games where form doesn't exist |
| GF-003 | New Pokémon | 1-2 | Single game only |

---

### 2.7 Pokedex Entries Test Cases

**Objective:** Validate filtering UI, latest-first ordering, and responsiveness on narrow screens.

| Test ID | Pokémon | Entry Count | Filter Behavior | Notes |
|---------|---------|---|---|---|
| PDE-001 | Pikachu | 20+ | Filter by game/generation; latest first | HIGH |
| PDE-002 | Regional variant | 5-15 | Filter reflects only available versions | MEDIUM |
| PDE-003 | New Pokémon | 1-2 | No filter needed; single entry | LOW |

**Assertions:**
- Filter UI on 320px is intuitive (not chip overflow)
- Latest game version entry shows first
- Chronological ordering: Gen 1 → Gen 2 → ... → Gen 9
- Filter state persists during scroll
- Chip selection toggleable

---

### 2.8 Location Encounters Test Cases

**Objective:** Validate filtering UI consistency with Pokedex entries, location rendering, and encounter method display.

| Test ID | Pokémon | Encounter Count | Expected Behavior | Risk |
|---------|---------|---|---|---|
| LOC-001 | Bulbasaur | 20+ locations | Filter by game; show all locations for selected game | HIGH |
| LOC-002 | Legendary | 1-3 locations | Single/few locations; filter shows availability by game | MEDIUM |
| LOC-003 | Rare encounter | 1 location, special condition | Display condition (e.g., "After story", "50% encounter rate") | MEDIUM |

**Assertions:**
- Location names display clearly
- Encounter rates/methods shown (e.g., 5%, Tall grass, Water, Underground)
- Filter UI matches Pokedex entries design
- No location duplicates across games

---

## 3. SCREEN SIZE MATRIX

### 3.1 Device Specifications

| Device | Width (dp) | Height (dp) | Safe Area | Test Priority |
|--------|---|---|---|---|
| iPhone SE | 320 | 568 | T:20, B:0, L/R:0 | HIGH (worst-case) |
| iPhone 12/13 | 390 | 844 | T:47, B:34 | HIGH |
| iPhone 14 Pro | 430 | 932 | T:59, B:34 | MEDIUM |

### 3.2 Critical Screen Size Test Scenarios

**Test 320px (iPhone SE):**

| Test ID | Pokémon | Section | Expected Behavior | Risk |
|---------|---------|---|---|---|
| S320-001 | Bulbasaur | Header + Name | Name fits; no truncation | MEDIUM |
| S320-002 | Wormadam-Sandy | Header + Name | Long name (19 chars) doesn't wrap or clip | HIGH |
| S320-003 | Bulbasaur | Type chips | Water type chip doesn't wrap; 2 chips don't overflow | LOW |
| S320-004 | Charizard | Type chips + info | Fire-Flying types + height/weight boxes layout without collapse | MEDIUM |
| S320-005 | Eevee | Evolution chain | Chain wraps or scrolls horizontally; no vertical overlap | HIGH |
| S320-006 | Alcremie | Related forms | Grid reflows to 1 column; all forms visible with scroll | HIGH |
| S320-007 | Pikachu | Moveset filter | Search + sort + game filter don't stack off-screen | HIGH |
| S320-008 | Any | Pokedex entries | Filter UI fits without horizontal overflow | MEDIUM |
| S320-009 | Any | Type effectiveness | Tabs fit; may require horizontal scroll within tab content | MEDIUM |

**Test 430px (iPhone 14 Pro):**

| Test ID | Pokémon | Section | Expected Behavior | Risk |
|---------|---------|---|---|---|
| S430-001 | Bulbasaur | Header + Name | Name fits with breathing room | LOW |
| S430-002 | Wormadam-Sandy | Header + Name | Long name fits without truncation | LOW |
| S430-003 | Alcremie | Related forms | Grid 2-3 columns; all forms visible without excessive scroll | MEDIUM |
| S430-004 | Eevee | Evolution chain | Full chain visible without horizontal scroll | LOW |
| S430-005 | Any | Type effectiveness | All type squares visible; may require horizontal scroll only if needed | LOW |

---

## 4. EDGE CASES FOR TYPE EFFECTIVENESS TABLE

### 4.1 Zero Immunities (Pure Dual-Type)

**Pokémon:** Garchomp (Ground-Dragon)

**Expected Display:**
- Defense tab: 0 immunity squares, 4 resistance squares (Water, Grass, Poison, Dragon), 2 weakness squares (Ice, Dragon)
- Note: Garchomp's ability (Rough Skin) doesn't affect type matchup table; table shows inherent typing only

**Test Assertions:**
- No empty immunity row if no immunities
- Immune row omitted or marked "None"

---

### 4.2 Multiple Immunities

**Pokémon:** Ghost-Dark type (Sableye, Spiritomb)

**Expected Display:**
- Defense tab: 2 immunity squares (Normal, Fighting), 2 resistance squares (Poison, Ghost), 0 weaknesses
- Immunity squares shown in gray outline with "0" label

**Test Assertions:**
- All immunity squares render correctly
- Colors consistent across multiple immunities
- No color conflict between immunity and effectiveness rows

---

### 4.3 Double Weaknesses (4x)

**Pokémon:** Paras (Bug-Grass), Steenee (Grass), Aurorus (Rock-Ice)

**Expected Display (Paras):**
- Defense tab: 4x weakness to Fire, Flying, Ice, Rock (maybe darkened red to indicate 4x)
- Weakness row shows: Fire (4x), Flying (4x), Ice (4x), Rock (4x), Poison (2x)

**Test Assertions:**
- 4x weakness visually distinct from 2x weakness
- All 4x weakness types present
- No accidental 2x mis-labeled as 4x

---

### 4.4 Monotype Offense Tab vs Dual-Type

**Test Cases:**

| Test ID | Pokémon | Type(s) | Expected Tabs | Assertion |
|---------|---------|---|---|---|
| OFF-001 | Pikachu | Electric | 2 tabs (Defense + Electric offense) | Single offense tab |
| OFF-002 | Charizard | Fire-Flying | 3 tabs (Defense + Fire offense + Flying offense) | Two offense tabs, one per type |
| OFF-003 | Ditto | Normal | 2 tabs (Defense + Normal offense) | Single offense tab |

**Assertions:**
- Monotype: 2 tabs total
- Dual-type: 3 tabs total
- Each offense tab shows that type's attacking matchups (not defensive)

---

### 4.5 Offense Tab Color Reversal

**Pokémon:** Pikachu (Electric)

**Expected Display (Electric Offense Tab):**
- Electric's super-effective against Water, Flying: shown in GREEN
- Electric's not-effective against Grass, Electric, Dragon: shown in RED
- Electric immune to nothing: no gray squares

**Test Assertions:**
- Color reversal correct (opposite of Defense tab)
- Immunities (if any) still gray
- No confusion with Defense tab colors

---

### 4.6 Type Matchup Accuracy (Full Validation)

**Critical Test:** Verify all 18×18 matchups accurate in both offense and defense contexts.

**Spot Checks:**
| From Type | To Type | Effectiveness | Expected | Test Priority |
|-----------|---------|---|---|---|
| Water | Fire | 2 | Green (Defense), Red (Offense tab if Water) | HIGH |
| Electric | Water | 2 | Green (Defense), Red (Offense) | HIGH |
| Fire | Grass | 2 | Green (Defense), Red (Offense) | HIGH |
| Psychic | Ghost | 2 (weak) | Red (Defense), Green (Ghost Offense) | HIGH |
| Steel | Normal | 0.5 | Green (Defense) | HIGH |
| Ghost | Normal | 0 | Gray immunity (Defense) | HIGH |

---

## 5. COMPONENT ISOLATION TESTING

### 5.1 Can Be Tested in Isolation

These components can be unit tested without full detail screen integration:

| Component | Test Approach | Dependencies | Risk |
|-----------|---|---|---|
| **GenderDisplay (new)** | Unit test with mock gender_rate values | Icon asset library | LOW |
| **TypeBadge (fixed width)** | Unit test with all 18 types; snapshot test | Type colors, icons | LOW |
| **StatChart (color-coded bars)** | Unit test with boundary values (29, 30, 60, 90, 120) | Type colors | MEDIUM |
| **TypeEffectivenessTable (new)** | Unit test with pre-computed matchup data | Type matchup service, TypeBadge component | HIGH |
| **FormCard (in grid)** | Unit test with mock form data; grid layout | Navigation, image service | MEDIUM |
| **MoveRow (reused)** | Unit test with mock move data | Type service, navigation | LOW |
| **FilterChips** | Unit test with mock options; interaction test | None | LOW |

### 5.2 Requires Full Integration

These must be tested with full detail screen + data layer:

| Component | Reason | Dependencies |
|-----------|--------|---|
| **EvolutionChain (horizontal layout)** | Scroll behavior, spacing, tap navigation | useEvolutionChain hook, router |
| **RelatedFormsSection (grid layout)** | Form data correctly excluded, navigation works | useFormVariants hook, router, database |
| **Detail screen header animations** | Parallax scroll offset synchronization | scrollOffset state, animated scroll handler |
| **Pokedex entries filtering** | Data ordering, filter state persistence | usePokemonSpeciesData hook, flavor text data |
| **Location encounters filtering** | Location data accuracy, filter state | useLocationEncounters hook (if exists) |
| **Moveset game version filtering** | Game availability per move, data ordering | useMovesetForPokemon hook, game data |

---

## 6. ACCEPTANCE CRITERIA

### Issue #1: Double Back Button

**AC 1.1:** Only ONE back button is visible in the header app bar.

**AC 1.2:** Header title displays Pokémon name (e.g., "Bulbasaur"), not "[id]".

**AC 1.3:** Pressing back button navigates to previous screen (list or search) without error.

---

### Issue #2: Shiny Toggle Obstruction

**AC 2.1:** Shiny toggle button is positioned at top-right of hero section, NOT at bottom.

**AC 2.2:** Shiny toggle does not visually overlap with Pokémon artwork (clear margin visible).

**AC 2.3:** Tapping shiny toggle swaps between normal and shiny artwork without layout shift.

---

### Issue #3: Upper Info Section Styling

**AC 3.1:** Pokémon name font size is ≥24sp (noticeably larger than current).

**AC 3.2:** Dex ID, classification, gender all render clearly without truncation on 320px.

**AC 3.3:** Section uses horizontal/grid layout to improve space utilization (not purely vertical stack).

---

### Issue #4: Gender Display

**AC 4.1:** Gender data displays using gender icons (not text percentages).

**AC 4.2:** Gender icons accurately represent gender_rate value: male, female, or genderless.

**AC 4.3:** Form-specific gender_rate is fetched and displayed (not inherited from base form).

**AC 4.4:** Exclusively female Pokémon (gender_rate=8) show 100% female icon, not 100% male.

---

### Issue #5: Type Chip Widths

**AC 5.1:** All 18 type chips render at identical fixed width.

**AC 5.2:** Longest type name ("Psychic", 8 chars) fits within fixed width without wrapping.

**AC 5.3:** Type chips render consistently across all sections: types row, related forms, moveset, abilities.

---

### Issue #6: Height Data

**AC 6.1:** Height value is populated for all Pokémon (not blank).

**AC 6.2:** Height displays in both metric (m) and imperial (ft'in") formats.

**AC 6.3:** Example: Wailord shows "14.5m (47'7")", Caterpie shows "0.3m (1'0"")

---

### Issue #7: Height/Weight/Generation De-emphasis

**AC 7.1:** Height/weight/generation cards use lighter visual styling than gameplay-relevant sections (abilities, stats, moves).

**AC 7.2:** Information is still accessible but not primary focus of user attention.

---

### Issue #8: Ability Tile Chevrons

**AC 8.1:** Each ability tile displays a chevron (>) indicator on right side.

**AC 8.2:** Chevron color matches design system accent color.

**AC 8.3:** Tapping ability tile navigates to ability detail screen.

---

### Issue #9: Legendary/Mythical Overlay Position

**AC 9.1:** Legendary/Mythical indicator is positioned at top-center of hero image (not overlapping abilities below).

**AC 9.2:** Indicator uses transparent stylized design (not opaque overlay).

**AC 9.3:** Abilities section is not visually obscured by indicator at any scroll position.

---

### Issue #10: Base Stat Graph Colors

**AC 10.1:** Stat bars use value-based coloring: cyan (≥120), green (≥90), yellow (≥60), orange (≥30), red (<30).

**AC 10.2:** Stat labels are abbreviated: HP, ATK, DEF, SP.ATK, SP.DEF, SPD (not full names).

**AC 10.3:** Total label reads "Base Stat Total:" (not "TOTAL BASE STAT (BST):").

**AC 10.4:** Color scheme does NOT change based on Pokémon type.

---

### Issue #11: Evolution Chain Layout

**AC 11.1:** Evolution chain renders horizontally (left-to-right), not vertically (top-to-bottom).

**AC 11.2:** Branching evolutions (e.g., Eevee's 8 paths) render with clear visual hierarchy.

**AC 11.3:** Evolution conditions (Lv. 16, Trade, Stone, etc.) display below arrows between stages.

**AC 11.4:** Horizontal scroll does not interfere with page scroll on detail screen.

---

### Issue #12: Related Forms Grid Layout

**AC 12.1:** Related forms render in a grid (not carousel).

**AC 12.2:** Current form is excluded from the grid.

**AC 12.3:** Type chips in form cards use fixed width (consistent with TypeChip redesign).

**AC 12.4:** Each form card displays a chevron or similar indicator showing it is navigable.

**AC 12.5:** Grid wraps appropriately at 320px and 430px (no horizontal overflow).

---

### Issue #13: Related Forms Clarity

**AC 13.1:** Section label clearly indicates forms are visual-only (e.g., "Regional Forms" or "Cosmetic Variants").

**AC 13.2:** Form name includes regional prefix (e.g., "Alolan Raichu", "Galarian Rapidash").

---

### Issue #14: Pokedex Entries UI

**AC 14.1:** Filter UI is intuitive on 320px (no chip overflow or truncation).

**AC 14.2:** Pokedex entries are ordered latest-first (newest game generation first).

**AC 14.3:** Filter UI follows modern design patterns consistent with Encounters and Moveset sections.

---

### Issue #15: Location Encounters UI

**AC 15.1:** Location encounters filter UI is identical in design to Pokedex entries filter.

**AC 15.2:** Filter displays all available game versions for selected Pokémon.

**AC 15.3:** Encounters update when filter selection changes.

---

### Issue #16: Moveset Component Reuse & Filtering

**AC 16.1:** Move list component is reused from main move list screen (no duplicate code).

**AC 16.2:** Learn methodology column displays: Lv. 5, TM, Egg, Tutor, etc. for all moves.

**AC 16.3:** Game/generation filter is present and uses same UI pattern as Pokedex entries filter.

**AC 16.4:** Filter updates move list without page navigation.

**AC 16.5:** Pokémon with 100+ moves: search, sort, filter all responsive (no lag).

---

### Issue #17: Type Effectiveness Table

**AC 17.1:** Type effectiveness section renders below base stat chart.

**AC 17.2:** Monotype Pokémon show 2 tabs: Defense + [Type] Offense.

**AC 17.3:** Dual-type Pokémon show 3 tabs: Defense + [Type1] Offense + [Type2] Offense.

**AC 17.4:** Each tab displays 18 type squares (9 per row, 2 rows).

**AC 17.5:** Each type square displays effectiveness value: 1/4, 1/2, 0, 1, 2, 4 below square.

**AC 17.6:** Zero effectiveness squares show as empty outline (not colored).

**AC 17.7:** Defense tab colors: green for <1 (resist), red for >1 (weak), gray for 0 (immune).

**AC 17.8:** Offense tab colors: red for <1 (not effective), green for >1 (super effective), gray for 0 (immune).

**AC 17.9:** Tab switching is smooth and doesn't cause layout shift.

**AC 17.10:** All type matchups are accurate per game generation rules.

---

### Issue #18: Overall Design Quality

**AC 18.1:** Visual design uses modern aesthetics (no generic/blocky appearance).

**AC 18.2:** Transitions and animations are smooth (no jank on iPhone SE).

**AC 18.3:** Layout has artistic flow with consistent spacing and visual hierarchy.

**AC 18.4:** Font sizes follow design system hierarchy (scannable, not uniformly small).

---

## 7. TEST EXECUTION STRATEGY

### Phase 1: Component Isolation (Days 1-2)

1. **GenderDisplay Component**
   - Unit tests for all gender_rate values (-1, 0-8)
   - Icon rendering tests
   - Integration test with detail screen

2. **TypeBadge Fixed Width**
   - Unit test with all 18 types
   - Snapshot test for width consistency
   - Cross-component rendering test

3. **StatChart Color-Coding**
   - Unit test boundary values
   - Animation performance test
   - Visual regression test

4. **TypeEffectivenessTable**
   - Unit test matchup data accuracy
   - Tab switching test
   - Color coding validation

### Phase 2: Component Integration (Days 3-4)

1. **EvolutionChain Horizontal Layout**
   - Linear chain test (Bulbasaur line)
   - Branching test (Eevee)
   - Scroll behavior test

2. **RelatedFormsSection Grid Layout**
   - Form exclusion test
   - Grid wrapping test (320px/430px)
   - Navigation test

3. **Hero Section Re-layout**
   - Shiny toggle position test
   - Legendary/mythical overlay position test
   - Image visibility test

### Phase 3: Detail Screen Full Integration (Days 5-6)

1. **Header & Navigation**
   - Back button uniqueness test
   - Title animation test
   - Navigation integrity test

2. **Upper Info Section**
   - Font sizing test
   - Layout spacing test
   - Data accuracy test (height, gender, types)

3. **Filtering & Sorting**
   - Pokedex entries filter test
   - Location encounters filter test
   - Moveset filter & sort test

### Phase 4: Device & Edge Case Testing (Days 7-8)

1. **Screen Size Matrix**
   - 320px device test (iPhone SE)
   - 430px device test (iPhone 14 Pro)
   - Layout regression test

2. **Edge Cases**
   - Pokémon with 0 moves
   - Pokémon with 100+ moves
   - Pokémon with 60+ forms
   - Forms with different gender_rate
   - Dual-types with multiple immunities

### Phase 5: Performance & Quality (Day 9)

1. **Performance Testing**
   - Scroll smoothness on low-end device
   - Animation jank detection
   - Memory usage check

2. **Visual Design Review**
   - Design system consistency
   - Spacing and alignment check
   - Typography hierarchy validation

---

## 8. REGRESSION TEST CHECKLIST

Before marking detail screen redesign as complete:

- [ ] TypeBadge fixed width doesn't break Pokemon list screen row height
- [ ] MoveListScreen type badges render correctly (no layout shift)
- [ ] AbilityListScreen abilities display without truncation
- [ ] RelatedFormsSection carousel → grid migration preserves navigation
- [ ] StatChart with new colors still animates smoothly
- [ ] EvolutionChain horizontal layout doesn't cause scroll conflicts
- [ ] Header back button styling consistent with navigation pattern
- [ ] All Pokémon form gender_rate data fetched correctly (not stale)
- [ ] Height data populated in database (not null/blank)
- [ ] Pokedex entries filter logic preserves latest-first ordering
- [ ] Location encounters filter updates correctly without re-fetching
- [ ] Moveset game version filter includes all applicable games
- [ ] No horizontal overflow on 320px for any section
- [ ] No layout thrashing during scroll on any device
- [ ] Visual design follows design system (colors, typography, spacing)

---

## 9. KNOWN ISSUES & DEFERRED DECISIONS

### Deferred from Redesign Scope

1. **Tappable Descriptions** (Issue noted in memory as "deferred")
   - Flavor text entries may become tappable in future phase
   - Current scope: display-only with filter UI

2. **Type Guide Navigation** (Proposed but not confirmed)
   - Type effectiveness table squares may link to type guide detail screen
   - Current scope: informational display only

3. **Share/Export Feature** (Out of scope)
   - Detail screen data export to image not included in redesign
   - Color scheme changes may affect future share UI

### Known Data Issues

1. **Height Data Blank**
   - Database seed may not have populated height column
   - Test requirement: verify height data present before QA sign-off

2. **Gender Rate Form Inheritance**
   - Verify form-specific gender_rate is distinct from base form
   - Some forms may inherit base gender_rate; test for accuracy

3. **Move Count Edge Case**
   - New Pokémon forms (Z-A) may have no moves initially
   - Test: Pokémon with 0 moves handles gracefully ("No moves" state)

---

## Appendix A: Test Pokémon Reference

**Quick Reference for Test Selection**

| Category | Pokémon | Why | Dex # |
|----------|---------|-----|---|
| **Gender** | Nidoran♀ | 100% female | 29 |
| **Gender** | Nidoran♂ | 100% male | 32 |
| **Gender** | Staryu | Genderless | 120 |
| **Gender** | Alcremie | Test bug fix (was showing wrong gender) | 869 |
| **Evolution** | Bulbasaur | Linear chain | 1 |
| **Evolution** | Eevee | Branching (8 paths) | 133 |
| **Evolution** | Pichu | Baby pre-evo | 172 |
| **Evolution** | Charizard | Final form (no evo) | 6 |
| **Forms** | Rotom | 6 forms | 479 |
| **Forms** | Alcremie | 63 forms | 869 |
| **Forms** | Wormadam | 3 forms | 413 |
| **Types** | Charizard | Dual-type (Fire-Flying) | 6 |
| **Types** | Pikachu | Monotype (Electric) | 25 |
| **Types** | Paras | Dual-type (Bug-Grass), 4x weak | 46 |
| **Moves** | Pikachu | 50+ moves, 20+ games | 25 |
| **Moves** | Mew | 160+ moves | 151 |
| **Moves** | Z-A form | 0 moves (edge case) | TBD |
| **Height** | Wailord | Tallest (14.5m) | 321 |
| **Height** | Caterpie | Shortest (0.3m) | 10 |

---

**End of QA Specification**
