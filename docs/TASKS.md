# TASKS.md

**Version:** 0.2 | **Last Updated:** 2026-07-09 | **Status:** Active Development

---

## Changelog

| Date | Version | Change |
|------|---------|--------|
| 2026-07-09 | 0.1 | Initial task breakdown for ChampionDex MVP |
| 2026-07-09 | 0.2 | Updated status: Phase 0, Phase 1, and Phase 2 list screens complete. Phase 3 detail views next. |

---

## Overview

This document contains the comprehensive task list to implement ChampionDex MVP based on the DESIGN.md specification. Tasks are organized by phase, with dependencies identified and complexity estimated.

**Estimation Scale:**
- **S** (Small): 1–2 days
- **M** (Medium): 3–5 days
- **L** (Large): 1–2 weeks
- **XL** (Extra Large): 2–4 weeks

**Completion Formula:** Tasks are marked with `[ ]` (pending), `[✓]` (complete), `[⊗]` (blocked).

---

## Phase 0: Project Setup & Infrastructure

| Task ID | Title | Complexity | Depends On | Assignee | Status |
|---------|-------|------------|-----------|----------|--------|
| TASK-001 | Initialize React Native + Expo project | S | — | — | [✓] |
| TASK-002 | Set up TypeScript, ESLint, Prettier config | S | TASK-001 | — | [✓] |
| TASK-003 | Set up Jest testing framework + React Native Testing Library | M | TASK-001 | — | [✓] |
| TASK-004 | Configure GitHub Actions CI/CD pipeline | M | TASK-001 | — | [ ] |
| TASK-005 | Set up Figma design system (colors, typography, components) | M | — | Designer | [✓] |
| TASK-006 | Create project README with setup instructions | S | TASK-001 | — | [ ] |
| TASK-007 | Configure Expo Build service & create EAS config | M | TASK-001 | — | [✓] |

**Phase 0 Blockers:** None. Can run in parallel with Phase 1.

---

## Phase 1: Foundation — Data Layer & Navigation

### 1.1 Database Setup

| Task ID | Title | Complexity | Depends On | Status |
|---------|-------|------------|-----------|--------|
| TASK-101 | Create SQLite schema (pokemon, moves, abilities, items tables) | M | TASK-001 | [✓] |
| TASK-102 | Create SQLite junction tables (pokemon_moves, pokemon_abilities) | S | TASK-101 | [✓] |
| TASK-103 | Create teams & team_members tables schema | M | TASK-101 | [✓] |
| TASK-104 | Implement database initialization script (expo-sqlite) | M | TASK-101, TASK-102, TASK-103 | [✓] |
| TASK-105 | Write unit tests for database queries | M | TASK-104 | [ ] |

**Subtasks (TASK-101):**
```sql
-- pokemon table with indexes
-- moves, abilities, items tables
-- Foreign key constraints
-- Timestamp defaults
```

---

### 1.2 Bundled Data Integration (@pkmn/data & @pkmn/dex)

| Task ID | Title | Complexity | Depends On | Status |
|---------|-------|------------|-----------|--------|
| TASK-201 | Create bundled data seeder using @pkmn/dex | M | TASK-001, TASK-104 | [✓] |
| TASK-202 | Map @pkmn species/moves/abilities/items to SQLite schema; handle true form variants as separate entries | M | TASK-201 | [✓] |
| TASK-203 | Implement first-launch SQLite seeding from bundled @pkmn data | L | TASK-201, TASK-104, TASK-202 | [✓] |
| TASK-204 | Implement sprite/artwork URL loading from CDN at display time (no pre-caching) | M | TASK-203 | [ ] |
| TASK-205 | Add data version check to skip re-seeding on subsequent launches | M | TASK-201 | [✓] |
| TASK-206 | Write integration tests for bundled data seeding | M | TASK-203 | [ ] |

**Acceptance Criteria (TASK-203):**
- [ ] App seeds Pokemon data on first launch from bundled @pkmn/data (no network required)
- [ ] Data is parsed and inserted into SQLite
- [ ] All 1000+ Pokemon are loaded
- [ ] Seeding completes in <2 seconds
- [ ] Subsequent launches skip seeding (data version check) and load instantly

---

### 1.3 State Management & Contexts

| Task ID | Title | Complexity | Depends On | Status |
|---------|-------|------------|-----------|--------|
| TASK-301 | Create DataContext (Pokemon, Moves, Abilities, Items) | M | TASK-104, TASK-201 | [ ] |
| TASK-302 | Create TeamContext (Teams, current team, analysis) | M | TASK-104 | [ ] |
| TASK-303 | Create UIContext (theme, filters, sort preferences) | S | — | [ ] |
| TASK-304 | Implement useDataContext hooks (search, filter, sort) | L | TASK-301 | [ ] |
| TASK-305 | Implement useTeamContext hooks (create, save, load, delete) | L | TASK-302 | [ ] |
| TASK-306 | Write unit tests for context logic | M | TASK-301, TASK-302, TASK-303 | [ ] |

**Acceptance Criteria (TASK-304):**
- [ ] Search returns results in <100ms
- [ ] Filters can be combined (multiple types, generations)
- [ ] Sort options work (name, dex #, stat total)
- [ ] All operations are memoized to prevent unnecessary re-renders

---

### 1.4 Navigation Setup

| Task ID | Title | Complexity | Depends On | Status |
|---------|-------|------------|-----------|--------|
| TASK-401 | Install & configure React Navigation | S | TASK-001 | [✓] |
| TASK-402 | Create root navigator (Stack + Tab navigation) | M | TASK-401 | [✓] |
| TASK-403 | Create screen stubs for all major screens | S | TASK-402 | [✓] |
| TASK-404 | Implement deep linking configuration | M | TASK-402 | [ ] |
| TASK-405 | Test navigation flow (basic sanity checks) | S | TASK-402 | [✓] |

**Navigation Stubs to Create:**
- ReferenceGuideTab (with sub-tabs: Pokemon, Moves, Abilities, Items)
- TeamBuilderTab
- PokemonDetailScreen
- MoveDetailScreen
- AbilityDetailScreen
- ItemDetailScreen

### 1.5 Localization & Internationalization Setup

| Task ID | Title | Complexity | Depends On | Status |
|---------|-------|------------|-----------|--------|
| TASK-451 | Install i18next + react-i18next | S | TASK-001 | [✓] |
| TASK-452 | Create i18n config file (i18n.ts) | S | TASK-451 | [✓] |
| TASK-453 | Create translation keys structure (locales/en.json) | M | TASK-452 | [✓] |
| TASK-454 | Extract all hardcoded UI strings from screens into translation keys | L | TASK-453 | [ ] |
| TASK-455 | Update all components to use useTranslation() hook | L | TASK-454 | [ ] |
| TASK-456 | Write tests for i18n integration | M | TASK-455 | [ ] |

**Acceptance Criteria (TASK-454):**
- [ ] All UI strings (buttons, labels, descriptions, error messages) in translation keys
- [ ] No hardcoded English strings in component JSX
- [ ] Strings organized by feature (pokemon, team, common, etc.)

---

### 1.6 Pokemon Forms Data Handling

| Task ID | Title | Complexity | Depends On | Status |
|---------|-------|------------|-----------|--------|
| TASK-461 | Implement form_type column in pokemon table schema | S | TASK-101 | [✓] |
| TASK-462 | Map PokeAPI form data to separate Pokemon entries (Alolan, Galarian, Hisuian, Mega, etc.) | M | TASK-202, TASK-461 | [ ] |
| TASK-463 | Handle cosmetic variants (gender sprites) as single entry with UI toggle | M | TASK-462 | [ ] |
| TASK-464 | Test data sync: verify true forms are separate, cosmetic forms are grouped | M | TASK-463 | [ ] |

**Acceptance Criteria (TASK-462):**
- [ ] Alolan Raichu stored as separate Pokemon entry from base Raichu
- [ ] Galarian Weezing stored separately with own stats/types
- [ ] Mega Charizard X/Y each have own entries
- [ ] Gigantamax forms have own entries
- [ ] Each form searchable and navigable independently

**Acceptance Criteria (TASK-463):**
- [ ] Male/female sprites of same Pokemon grouped in one entry
- [ ] UI toggle switches between male/female variant
- [ ] Stats/moves identical (no data duplication)

---

## Phase 2: Reference Guide (Main Screen)

### 2.1 Pokemon List Screen

| Task ID | Title | Complexity | Depends On | Status |
|---------|-------|------------|-----------|--------|
| TASK-501 | Design PokemonList component (figma mockup) | M | TASK-005 | [✓] |
| TASK-502 | Implement PokemonList with FlashList & search bar | L | TASK-304, TASK-401 | [✓] |
| TASK-503 | Implement filter sheet (type/dual-type, generation) | M | TASK-502 | [✓] |
| TASK-504 | Implement sort options (name, dex, BST, all 6 stats, asc/desc) | S | TASK-502 | [✓] |
| TASK-505 | Implement Pokemon sprite display in list items | M | TASK-502, TASK-204 | [✓] |
| TASK-506 | Implement type badge display (color-coded, equal width, icons) | S | TASK-502 | [✓] |
| TASK-507 | Implement list item tap → navigate to detail | S | TASK-502, TASK-402 | [✓] |
| TASK-508 | Optimize FlashList for 1000+ items performance | M | TASK-502 | [✓] |
| TASK-509 | Add accessibility labels to list items | S | TASK-502 | [ ] |
| TASK-510 | Write component tests for PokemonList | M | TASK-502 | [ ] |

**Performance Target (TASK-508):**
- [ ] List renders 1000+ items in <500ms (P95)
- [ ] Scroll is smooth (60fps) on mid-range device
- [ ] Memory usage <100MB

---

### 2.2 Move/Ability/Item Lists

| Task ID | Title | Complexity | Depends On | Status |
|---------|-------|------------|-----------|--------|
| TASK-511 | Create MoveList screen (similar to PokemonList) | M | TASK-502 | [✓] |
| TASK-512 | Create AbilityList screen | M | TASK-502 | [✓] |
| TASK-513 | Create ItemList screen | M | TASK-502 | [✓] |
| TASK-514 | Implement tab switching (Pokemon ↔ Moves ↔ Abilities ↔ Items) | S | TASK-511, TASK-512, TASK-513 | [✓] |
| TASK-515 | Write tests for Move/Ability/Item lists | M | TASK-511, TASK-512, TASK-513 | [ ] |

---

## Phase 3: Detail Views

### 3.1 Pokemon Detail Screen

| Task ID | Title | Complexity | Depends On | Status |
|---------|-------|------------|-----------|--------|
| TASK-601 | Design PokemonDetail screen (figma mockup) | M | TASK-005 | [ ] |
| TASK-602 | Implement PokemonDetail basic layout | M | TASK-301, TASK-402 | [ ] |
| TASK-603 | Implement parallax scrolling for artwork | M | TASK-602 | [ ] |
| TASK-604 | Implement shiny sprite toggle | S | TASK-602 | [ ] |
| TASK-604a | Implement alternate form display (Alolan, Galarian, etc. as separate Pokemon links; cosmetic variants as UI toggle in detail) | M | TASK-602, TASK-463 | [ ] |
| TASK-605 | Implement stat hexagon chart component | L | TASK-602 | [ ] |
| TASK-606 | Display base stats in hexagon/radar chart | M | TASK-605 | [ ] |
| TASK-607 | Display abilities list (tappable) | M | TASK-602 | [ ] |
| TASK-608 | Display moveset (tappable to move detail) | M | TASK-602 | [ ] |
| TASK-609 | Implement "+Add to Team" button action | M | TASK-602, TASK-305 | [ ] |
| TASK-610 | Implement back navigation | S | TASK-402 | [ ] |
| TASK-611 | Add accessibility labels & screen reader support | S | TASK-602 | [ ] |
| TASK-612 | Write component tests for PokemonDetail | M | TASK-602 | [ ] |

**Acceptance Criteria (TASK-603):**
- [ ] Artwork parallax moves at 0.5x scroll velocity
- [ ] Animation is smooth (60fps)
- [ ] No jank when scrolling on mid-range device

**Acceptance Criteria (TASK-605):**
- [ ] Hexagon chart displays all 6 stats correctly
- [ ] Chart morphs smoothly when stats update (team builder)
- [ ] Chart is labeled and accessible to screen readers

---

### 3.2 Move/Ability/Item Detail Screens

| Task ID | Title | Complexity | Depends On | Status |
|---------|-------|------------|-----------|--------|
| TASK-613 | Implement MoveDetail screen | M | TASK-602 | [ ] |
| TASK-614 | Implement AbilityDetail screen | M | TASK-602 | [ ] |
| TASK-615 | Implement ItemDetail screen | M | TASK-602 | [ ] |
| TASK-616 | Add navigation links from detail screens to related entities | M | TASK-613, TASK-614, TASK-615 | [ ] |
| TASK-617 | Write tests for detail screens | M | TASK-613, TASK-614, TASK-615 | [ ] |

---

## Phase 4: Team Builder

### 4.1 Team Builder Core

| Task ID | Title | Complexity | Depends On | Status |
|---------|-------|------------|-----------|--------|
| TASK-701 | Design TeamBuilder screens (figma mockup) | M | TASK-005 | [ ] |
| TASK-702 | Implement TeamScreen (list of saved teams) | M | TASK-305, TASK-402 | [ ] |
| TASK-703 | Implement TeamDetailScreen (edit current team) | L | TASK-305, TASK-402 | [ ] |
| TASK-704 | Implement add Pokemon to slot functionality | M | TASK-703 | [ ] |
| TASK-705 | Implement remove Pokemon from slot | S | TASK-703 | [ ] |
| TASK-706 | Implement reorder/swap Pokemon in team | M | TASK-703 | [ ] |
| TASK-707 | Implement ability selection for Pokemon | M | TASK-703 | [ ] |
| TASK-708 | Implement held item selection | M | TASK-703 | [ ] |
| TASK-709 | Implement moveset selection (up to 4 moves) | M | TASK-703 | [ ] |
| TASK-710 | Write tests for team builder core | M | TASK-703 | [ ] |

**Acceptance Criteria (TASK-703):**
- [ ] All 6 team slots render
- [ ] Adding Pokemon works (search → select → add)
- [ ] Can remove Pokemon from slots
- [ ] Can reorder Pokemon
- [ ] UI updates instantly (state is responsive)

---

### 4.2 Stat Editor & Calculations

| Task ID | Title | Complexity | Depends On | Status |
|---------|-------|------------|-----------|--------|
| TASK-711 | Design Stat Editor screens (IV/EV sliders + level selector) | S | TASK-005 | [ ] |
| TASK-712 | Implement StatEditor component (6 sliders) | M | TASK-702 | [ ] |
| TASK-712a | Implement stat level selector (Level 50 vs Level 100 toggle) | S | TASK-712 | [ ] |
| TASK-713 | Implement stat calculation formula (IV + EV + base → final) with level parameter | M | TASK-712a | [ ] |
| TASK-714 | Display calculated stats in real-time as sliders/level change | S | TASK-712a, TASK-713 | [ ] |
| TASK-715 | Implement team member stat chart (hexagon) | M | TASK-712, TASK-605 | [ ] |
| TASK-716 | Write unit tests for stat calculations (both Level 50 and 100) | M | TASK-713 | [ ] |

**Acceptance Criteria (TASK-712a):**
- [ ] Level selector displays two options: Level 50, Level 100
- [ ] Selection persists per team member
- [ ] Stat calculations update when level changes
- [ ] Default: Level 50

**Acceptance Criteria (TASK-713):**
- [ ] Formula: (Base + IV + EV/4) * Level modifier (support both Lv50 and Lv100)
- [ ] IV range: 0–31, EV range: 0–252
- [ ] Result matches expected Pokemon stat tables for both levels
- [ ] Calculation <50ms even for all 6 stats

---

### 4.3 Team Analysis

| Task ID | Title | Complexity | Depends On | Status |
|---------|-------|------------|-----------|--------|
| TASK-717 | Design Team Analysis screen | S | TASK-005 | [ ] |
| TASK-718 | Implement type coverage analysis (moves vs types) | L | TASK-703 | [ ] |
| TASK-719 | Implement type weakness analysis (defensive) | L | TASK-703 | [ ] |
| TASK-720 | Display coverage/weakness summary visually | M | TASK-718, TASK-719 | [ ] |
| TASK-721 | Write tests for team analysis logic | M | TASK-718, TASK-719 | [ ] |

**Acceptance Criteria (TASK-718):**
- [ ] Analyzes all 4 moves for each team member
- [ ] Identifies types covered by team's moveset
- [ ] Lists types NOT covered (gaps)
- [ ] Analysis updates when team composition changes

**Acceptance Criteria (TASK-719):**
- [ ] Calculates type matchups defensively (Pokemon types vs common moves)
- [ ] Identifies types the team is weak to (4x, 2x)
- [ ] Identifies resistances (0.5x)

---

### 4.4 Team Persistence

| Task ID | Title | Complexity | Depends On | Status |
|---------|-------|------------|-----------|--------|
| TASK-722 | Implement save team to SQLite (teams + team_members tables) | M | TASK-305, TASK-703 | [ ] |
| TASK-723 | Implement load team from SQLite | M | TASK-722 | [ ] |
| TASK-724 | Implement edit (overwrite) existing team | S | TASK-722 | [ ] |
| TASK-725 | Implement delete team | S | TASK-722 | [ ] |
| TASK-726 | Implement team name editing | S | TASK-702 | [ ] |
| TASK-727 | Write tests for team persistence | M | TASK-722, TASK-723 | [ ] |

**Acceptance Criteria (TASK-722):**
- [ ] Teams persisted in SQLite
- [ ] Team members linked to teams via foreign key
- [ ] All team data (moves, items, abilities, IVs, EVs) saved
- [ ] Save completes in <500ms

---

## Phase 5: UI/UX & Design System

### 5.1 Design System Implementation

| Task ID | Title | Complexity | Depends On | Status |
|---------|-------|------------|-----------|--------|
| TASK-801 | Create theme/colors configuration file | S | TASK-005 | [ ] |
| TASK-802 | Implement type-based color theming | M | TASK-801, TASK-602 | [ ] |
| TASK-803 | Create reusable UI components (Button, Card, Badge, etc.) | M | TASK-801 | [ ] |
| TASK-804 | Implement dark mode globally (primary) | S | TASK-801 | [ ] |
| TASK-805 | Create typography/spacing system | S | TASK-801 | [ ] |
| TASK-806 | Document design system in README/STYLE_GUIDE.md | S | TASK-801 | [ ] |

---

### 5.2 Animations & Polish

| Task ID | Title | Complexity | Depends On | Status |
|---------|-------|------------|-----------|--------|
| TASK-807 | Install React Native Reanimated 2 & configure | M | TASK-001 | [ ] |
| TASK-808 | Implement parallax scrolling (detail views) | M | TASK-603, TASK-807 | [ ] |
| TASK-809 | Implement image transition animations (shiny toggle) | M | TASK-604, TASK-807 | [ ] |
| TASK-810 | Implement list item press animations (scale feedback) | S | TASK-502, TASK-807 | [ ] |
| TASK-811 | Implement stat chart morphing animations | M | TASK-715, TASK-807 | [ ] |
| TASK-812 | Implement navigation transition animations | S | TASK-402, TASK-807 | [ ] |
| TASK-813 | Performance test: ensure 60fps on mid-range device | L | TASK-807 | [ ] |

---

## Phase 6: Accessibility & Internationalization

### 6.1 Accessibility (WCAG 2.1 AA)

| Task ID | Title | Complexity | Depends On | Status |
|---------|-------|------------|-----------|--------|
| TASK-901 | Add accessibility labels to all interactive elements | L | All UI screens | [ ] |
| TASK-902 | Audit color contrast (target 4.5:1 for text) | M | TASK-802 | [ ] |
| TASK-903 | Ensure keyboard navigation works (tab order) | M | All screens | [ ] |
| TASK-904 | Test VoiceOver (iOS) on detail screens | M | TASK-901, TASK-602 | [ ] |
| TASK-905 | Test TalkBack (Android) on detail screens | M | TASK-901, TASK-602 | [ ] |
| TASK-906 | Implement focus visible indicators | S | All screens | [ ] |
| TASK-907 | Write accessibility tests (WCAG audit) | M | TASK-901 | [ ] |

---

## Phase 7: Testing & QA

### 7.1 Unit Testing

| Task ID | Title | Complexity | Depends On | Status |
|---------|-------|------------|-----------|--------|
| TASK-1001 | Write unit tests for search/filter/sort logic | M | TASK-304 | [ ] |
| TASK-1002 | Write unit tests for stat calculations | M | TASK-713 | [ ] |
| TASK-1003 | Write unit tests for team analysis logic | M | TASK-718, TASK-719 | [ ] |
| TASK-1004 | Write unit tests for database queries | M | TASK-105 | [ ] |
| TASK-1005 | Write unit tests for data normalization | M | TASK-202 | [ ] |

**Target Coverage:** >70% for critical paths

---

### 7.2 Integration Testing

| Task ID | Title | Complexity | Depends On | Status |
|---------|-------|------------|-----------|--------|
| TASK-1006 | Test initial data load (PokeAPI → SQLite → UI) | M | TASK-203, TASK-502 | [ ] |
| TASK-1007 | Test search → detail → team builder workflow | M | TASK-510, TASK-612 | [ ] |
| TASK-1008 | Test team creation → save → load → delete workflow | M | TASK-727 | [ ] |
| TASK-1009 | Test deep linking (pokemon://pokedex/25) | M | TASK-404 | [ ] |
| TASK-1010 | Test offline operation (disconnect internet, verify features work) | L | TASK-203 | [ ] |

---

### 7.3 Performance Testing

| Task ID | Title | Complexity | Depends On | Status |
|---------|-------|------------|-----------|--------|
| TASK-1011 | Performance profiling: list load time (<500ms) | L | TASK-508 | [ ] |
| TASK-1012 | Performance profiling: search latency (<100ms) | M | TASK-304 | [ ] |
| TASK-1013 | Performance profiling: detail screen load (<200ms) | M | TASK-602 | [ ] |
| TASK-1014 | Memory profiling: heap usage over time | L | TASK-502, TASK-703 | [ ] |
| TASK-1015 | Battery impact testing (no significant drain) | M | All phases | [ ] |

---

### 7.4 Device Testing

| Task ID | Title | Complexity | Depends On | Status |
|---------|-------|------------|-----------|--------|
| TASK-1016 | Test on iOS 13+ (iPhone 12/13/14 simulators) | L | All phases | [ ] |
| TASK-1017 | Test on Android 8.0+ (Pixel emulator, Samsung A12) | L | All phases | [ ] |
| TASK-1018 | Test on low-end device (2GB RAM equivalent) | M | TASK-508 | [ ] |
| TASK-1019 | Test landscape/portrait orientation | M | All screens | [ ] |
| TASK-1020 | Crash reporting integration test (mock crash, verify it's logged) | S | TASK-003 | [ ] |

---

## Phase 8: Deployment & Release

### 8.1 iOS App Store Preparation

| Task ID | Title | Complexity | Depends On | Status |
|---------|-------|------------|-----------|--------|
| TASK-1101 | Create iOS app in App Store Connect | S | TASK-007 | [ ] |
| TASK-1102 | Create app icon & launch screen | S | TASK-005 | [ ] |
| TASK-1103 | Create app screenshots for App Store | S | TASK-005 | [ ] |
| TASK-1104 | Write app description & privacy policy | S | — | [ ] |
| TASK-1105 | Build iOS app via Expo (development → production) | M | TASK-007 | [ ] |
| TASK-1106 | Upload build to TestFlight for internal testing | M | TASK-1105 | [ ] |
| TASK-1107 | Final QA on TestFlight build | L | TASK-1106 | [ ] |
| TASK-1108 | Submit to App Store review | S | TASK-1107 | [ ] |

---

### 8.2 Android Google Play Preparation

| Task ID | Title | Complexity | Depends On | Status |
|---------|-------|------------|-----------|--------|
| TASK-1109 | Create Android app in Google Play Console | S | TASK-007 | [ ] |
| TASK-1110 | Create app icon & feature graphic | S | TASK-005 | [ ] |
| TASK-1111 | Create app screenshots for Play Store | S | TASK-005 | [ ] |
| TASK-1112 | Write app description & privacy policy | S | — | [ ] |
| TASK-1113 | Build Android app via Expo (development → production) | M | TASK-007 | [ ] |
| TASK-1114 | Upload build to Google Play internal testing track | M | TASK-1113 | [ ] |
| TASK-1115 | Final QA on internal testing build | L | TASK-1114 | [ ] |
| TASK-1116 | Submit to Google Play review | S | TASK-1115 | [ ] |

---

### 8.3 Release Management

| Task ID | Title | Complexity | Depends On | Status |
|---------|-------|------------|-----------|--------|
| TASK-1117 | Create release notes (v1.0.0) | S | All phases | [ ] |
| TASK-1118 | Tag release in Git (v1.0.0) | S | All phases | [ ] |
| TASK-1119 | Create CHANGELOG.md | S | TASK-1117 | [ ] |
| TASK-1120 | Final regression testing (all major workflows) | L | All phases | [ ] |

---

## Phase 9: Post-Launch & Documentation

### 9.1 Documentation

| Task ID | Title | Complexity | Depends On | Status |
|---------|-------|------------|-----------|--------|
| TASK-1201 | Create contributing guide (CONTRIBUTING.md) | M | TASK-006 | [ ] |
| TASK-1202 | Create architecture documentation (docs/ARCHITECTURE.md) | M | Design doc | [ ] |
| TASK-1203 | Create component storybook or visual guide | M | TASK-803 | [ ] |
| TASK-1204 | Document database schema (docs/DATABASE.md) | S | TASK-104 | [ ] |
| TASK-1205 | Create troubleshooting guide (FAQ) | S | — | [ ] |

---

### 9.2 Monitoring & Analytics (Post-MVP)

| Task ID | Title | Complexity | Depends On | Status |
|---------|-------|------------|-----------|--------|
| TASK-1301 | Set up Sentry for crash reporting (post-launch only; MVP is local-only) | M | TASK-003 | [ ] |
| TASK-1301a | Add error telemetry integration (capture exceptions, send to Sentry) | M | TASK-1301 | [ ] |
| TASK-1302 | Set up analytics dashboard (if needed) | L | — | [ ] |
| TASK-1303 | Create support/feedback email channel | S | — | [ ] |

**Rationale (TASK-1301):** MVP prioritizes privacy and simplicity (local-only). Post-launch, Sentry enables anonymous crash monitoring and diagnostics without collecting user data.

---

## Task Dependencies Graph

```
PHASE 0: Setup
├─ TASK-001 (Project init)
├─ TASK-002 (TypeScript setup)
├─ TASK-003 (Jest setup)
├─ TASK-004 (CI/CD)
├─ TASK-005 (Figma design system)
├─ TASK-006 (README)
└─ TASK-007 (Expo build config)

PHASE 1: Foundation (Parallel branches)
├─ Database Branch: TASK-101 → 102 → 103 → 104 → 105
├─ API Branch: TASK-201 → 202 → 203 → 204 → 205 → 206
├─ State Branch: TASK-301 → 302 → 303 → 304 → 305 → 306
└─ Navigation Branch: TASK-401 → 402 → 403 → 404 → 405

PHASE 2: Reference Guide
├─ TASK-501 → 502 → 503 → 504 → 505 → 506 → 507 → 508 → 509 → 510
└─ TASK-511 → 512 → 513 → 514 → 515

PHASE 3: Detail Views
├─ TASK-601 → 602 → 603 → 604 → 605 → 606 → 607 → 608 → 609 → 610 → 611 → 612
└─ TASK-613 → 614 → 615 → 616 → 617

PHASE 4: Team Builder
├─ TASK-701 → 702 → 703 → 704 → 705 → 706 → 707 → 708 → 709 → 710
├─ TASK-711 → 712 → 713 → 714 → 715 → 716
├─ TASK-717 → 718 → 719 → 720 → 721
└─ TASK-722 → 723 → 724 → 725 → 726 → 727

PHASE 5: UI/UX
├─ TASK-801 → 802 → 803 → 804 → 805 → 806
└─ TASK-807 → 808 → 809 → 810 → 811 → 812 → 813

PHASE 6: Accessibility
└─ TASK-901 → 902 → 903 → 904 → 905 → 906 → 907

PHASE 7: Testing
├─ TASK-1001 → 1002 → 1003 → 1004 → 1005
├─ TASK-1006 → 1007 → 1008 → 1009 → 1010
├─ TASK-1011 → 1012 → 1013 → 1014 → 1015
└─ TASK-1016 → 1017 → 1018 → 1019 → 1020

PHASE 8: Deployment
├─ iOS: TASK-1101 → 1102 → 1103 → 1104 → 1105 → 1106 → 1107 → 1108
├─ Android: TASK-1109 → 1110 → 1111 → 1112 → 1113 → 1114 → 1115 → 1116
└─ Release: TASK-1117 → 1118 → 1119 → 1120

PHASE 9: Post-Launch
├─ TASK-1201 → 1202 → 1203 → 1204 → 1205
└─ TASK-1301 → 1302 → 1303
```

---

## Summary Estimates

### By Phase

| Phase | Tasks | Complexity | Timeline |
|-------|-------|-----------|----------|
| 0: Setup | 7 | M | 1 week |
| 1: Foundation | 23 | L | 3 weeks |
| 2: Reference Guide | 6 | M | 2 weeks |
| 3: Detail Views | 18 | L | 2.5 weeks |
| 4: Team Builder | 30 | L | 3.5 weeks |
| 5: UI/UX & Design | 13 | M | 2 weeks |
| 6: Accessibility | 7 | M | 1.5 weeks |
| 7: Testing | 20 | L | 2.5 weeks |
| 8: Deployment | 20 | M | 2 weeks |
| 9: Post-Launch | 9 | S–M | 1.5 weeks |
| **TOTAL** | **153** | — | **~21 weeks** |

### By Complexity

| Complexity | Count | Effort |
|-----------|-------|--------|
| S (Small) | 32 | ~32–64 dev-days |
| M (Medium) | 72 | ~216–360 dev-days |
| L (Large) | 28 | ~280–560 dev-days |
| XL (Extra Large) | 8 | ~160–320 dev-days |

**Total Effort Estimate (1 developer):** 16–20 weeks

**Team Recommendation:**
- **2 developers (parallel tracks):** 10–12 weeks
- **1 developer:** 16–20 weeks
- **3+ developers:** 8–10 weeks (with coordination overhead)

---

## Critical Path

The critical path for fastest delivery (assuming 2 developers in parallel):

1. **Developer 1 (Backend/Data):** TASK-001 → 101 → 104 → 201 → 203 → 301 → 304
2. **Developer 2 (Frontend/UI):** TASK-005 → 401 → 502 → 602 → 703
3. **Converge:** Phase 5 (UI/UX), Phase 7 (Testing), Phase 8 (Deployment)

**Recommended Milestones (best-practices-driven):**
- Week 2: Core data layer + navigation working
- Week 4: Reference guide feature-complete
- Week 6: Detail views + team builder complete
- Week 8: UI polish + animations complete
- Week 10: All testing passing
- Week 12: Ready for App Store/Play Store submission

**Note:** This timeline is driven by engineering best practices (testing, performance optimization, accessibility), not external pressure. Development should proceed at a sustainable pace with quality as the priority.

---

## Blockers & Risk Mitigations

### Known Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| PokeAPI changes or downtime | Low | Medium | Cache all data locally; fallback to offline |
| React Native performance issues on low-end devices | Medium | High | Early performance profiling (TASK-1011–1015); Reanimated optimization |
| App Store/Play Store review rejection | Low | High | Test guidelines early; get internal QA sign-off |
| Team availability | Medium | Medium | Clearly defined tasks; async collaboration |
| Scope creep (forms, variants, etc.) | Medium | Medium | Strict MVP scope; defer Phase 2 features |

### Mitigation Strategies

1. **Performance:** Run TASK-1011–1015 around Week 6 to identify issues early
2. **Store Submission:** Plan 2–3 weeks before target launch; account for review cycles
3. **Scope:** Track requirements against design; defer out-of-scope requests to Phase 2
4. **Team:** Regular syncs; clear ownership of task phases

---

## Next Steps

**Immediate priority — Phase 3 Detail Views:**
1. **TASK-602** — Implement PokemonDetail basic layout (`app/(main)/(pokedex)/[id].tsx` — currently a placeholder)
   - Hero section: official artwork via PokeAPI CDN, shiny toggle, type-color gradient header
   - Base stats section with visual bars for all 6 stats
   - Abilities section (tappable)
   - Moves table (filterable, tappable)
   - `game_exclusivity` badge if applicable
2. **TASK-204** — Wire sprite/artwork URLs from PokeAPI CDN (`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${nationalDex}.png`)
3. **TASK-613/614/615** — Move, Ability, Item detail screens
4. **TASK-510/515** — Tests for list screens (currently zero test coverage — significant gap)

**Design system:** DESIGN_SYSTEM.md v1.1 is up to date. Refer to it for all new component specs before implementing.

---

## Appendix: Task Template for Future Addition

When adding new tasks to backlog:

```
TASK-XXXX: [Task Title]
Complexity: [S|M|L|XL]
Depends On: [TASK-YYY, TASK-ZZZ]
Description: [1-2 sentences]
Acceptance Criteria:
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3
Estimate: [X dev-days]
```

---

## Final Notes

- This task list is **living**. Update as design evolves or new requirements emerge.
- Phases can be parallelized (e.g., Phase 2 & 3 can overlap with Phase 1).
- Aggressive timeline assumes experienced React Native developer(s).
- Post-launch roadmap (Phase 2+): cloud syncing, social features, tournaments, analytics.
