# ChampionDex Documentation Index

**Last Updated:** 2026-07-10  
**Project Status:** Phase 1.0 Complete, Phase 1.1 Specified

---

## Getting Started

- **[README.md](../README.md)** — Project overview, quick start, tech stack summary
- **[PHASE_1.1_SUMMARY.md](PHASE_1.1_SUMMARY.md)** — Executive summary of next phase (start here!)

---

## Product & Requirements

- **[REQUIREMENTS.md](REQUIREMENTS.md)** — Complete functional & non-functional requirements (REQ-001 through NFR-029)
  - Reference guide, detail views, team builder, data & offline, UI/UX, performance, accessibility
  - User stories and acceptance criteria

- **[DESIGN.md](DESIGN.md)** — System architecture and design specification
  - Technology stack (React Native + Expo)
  - System architecture diagram
  - Data model and SQLite schema
  - UI/UX design system (dark mode, type-based colors, typography)
  - State management (Context API patterns)
  - API integration (PokeAPI)
  - Performance optimization strategies
  - Testing and deployment architecture

---

## Architecture & Implementation

### Phase 1.0: List Screens (COMPLETE)
- **[LIST_SCREENS_ARCHITECTURE.md](LIST_SCREENS_ARCHITECTURE.md)** — Canonical architecture for Pokemon/Moves/Abilities/Items list screens
  - 10 Invariant Requirements (locked in)
  - Search header as sibling pattern (fixes Android focus bug)
  - Split search state with debounce
  - FlashList optimization
  - Anti-patterns to avoid
  - Testing checklist

### Phase 1.1: Detail Views (SPECIFIED, READY FOR DEVELOPMENT)
- **[DETAIL_VIEWS_SPEC.md](DETAIL_VIEWS_SPEC.md)** — Complete specification for detail screens
  - Pokemon, Move, Ability, Item detail screen designs
  - Stat chart component (SVG hexagon)
  - Parallax scrolling and shiny toggle specs
  - Form variant handling
  - Navigation architecture (stack routing, deep links)
  - Cross-linking between entities
  - Data access patterns (new hooks)
  - Animation specs, error handling, performance, accessibility
  - Design decisions and trade-offs (13 sections)

- **[DETAIL_VIEWS_TASKS.md](DETAIL_VIEWS_TASKS.md)** — Implementation task breakdown (32 tasks, 7 milestones)
  - Effort: 175-225 hours (4-6 weeks, 2-person team)
  - Foundation (navigation, data hooks, stat chart)
  - Pokemon detail screen (parallax, shiny, moveset, forms)
  - Ability, Move, Item detail screens
  - Cross-linking and navigation polish
  - Accessibility and testing
  - Documentation and handoff
  - Each task includes: acceptance criteria, complexity, dependencies, subtasks, effort estimate

---

## Data Model & Database

**From DESIGN.md (Section 4):**
- Pokemon table (with form_type support for Alolan, Galarian, Mega variants)
- Moves table
- Abilities table
- Items table
- Junction tables: pokemon_moves, pokemon_abilities
- Teams & team_members tables (with UUIDs for future cloud sync)

**Key design patterns:**
- True form differences stored as separate Pokemon entries
- Cosmetic variants (gender) in one entry with toggle UI
- UUIDs in team tables for future cross-device sync
- Local SQLite; no backend required for MVP

---

## Component Library

**Common Components:**
- `SearchHeader` — Text input with debounce (React.memo wrapped)
- `SubTabBar` — Tab navigation between entity types
- `TypeBadge` — Color-coded type indicator
- `PokemonCard` — List row for Pokemon (canonical benchmark)
- `EmptyState` — Placeholder for no data
- `LoadingSpinner` — Loading indicator
- `StatChart` — Hexagon/radar stat visualization (new in Phase 1.1)

**Filter/Sort Sheets:**
- `FilterSortSheet` — Pokemon list (type grid, generation, sort options)
- `MovesFilterSortSheet` — Moves list (type, category, sort)
- `ItemsFilterSortSheet` — Items list (category, sort)

---

## Hooks & Data Access

**List Queries (Phase 1.0, Complete):**
- `usePokemonList` — search, types, sortBy, generation, typeFilterMode
- `useMovesList` — search, type, category, sortBy, sortDirection
- `useAbilitiesList` — search, sortDirection
- `useItemsList` — search, category, sortBy

**Detail Queries (Phase 1.1, New):**
- `usePokemonDetail` — Full Pokemon data with abilities, movepool, forms
- `useMoveDetail` — Move data + Pokemon list that learn it
- `useAbilityDetail` — Ability description + Pokemon list
- `useItemDetail` — Item data

**UI Hooks:**
- `useDebounce` — 300ms debounce with skip-first-render optimization
- `useScrollPositionRestore` — Save/restore list scroll position (Phase 1.1)

---

## Design System

**Colors (Dark Mode):**
- Background: `#0F0F0F`
- Surface: `#1A1A1A`
- Text Primary: `#FFFFFF`
- Text Secondary: `#999999`
- Border: `#333333`
- Type-based accents: 18 type colors (Fire #F08030, Water #6890F0, etc.)

**Typography:**
- H1 (Titles): 28sp, weight 700
- H2 (Sections): 20sp, weight 600
- Body: 16sp, weight 400
- Meta: 14sp, weight 400
- Caption: 12sp, weight 400

**Spacing, Icons, and Constants:** See `/src/constants/` directory

---

## Testing

**Current Status (Phase 1.0):**
- 15/15 tests passing (list screens)
- TypeScript: clean

**Testing Strategy (Phase 1.1):**
- Unit tests: Data hooks, stat chart math, filter/sort logic
- Component tests: Detail screens, parallax, shiny toggle
- Integration tests: Navigation flows, cross-linking
- Manual QA: iOS + Android real devices
- Accessibility tests: VoiceOver, TalkBack, WCAG AA

**Test Framework:** Jest + React Native Testing Library

---

## Performance Targets

From REQUIREMENTS.md (Section 3.3):
- **List load:** <500ms P95 (1000+ items)
- **Search latency:** <100ms P95
- **Detail load:** <200ms (REQ-057)
- **App startup:** <2s cold, <500ms warm
- **Memory:** <200MB peak with full dataset
- **Animations:** 60fps throughout (no jank)

---

## Deployment

**Build & Distribution:**
- Expo SDK 57 (managed build service)
- iOS: XCode + TestFlight → App Store
- Android: Android Studio + Google Play Console → Play Store
- OTA Updates: Expo Updates (deferred to Phase 2)

**CI/CD:** GitHub Actions (linting, typecheck, tests, builds)

---

## Navigation

**Current (Phase 1.0):**
- Root → Tab Navigator → List screens

**Phase 1.1 Addition:**
- Detail screens via Stack Navigator (layered above tabs)
- Route params for IDs and optional filters (form, etc.)
- Deep linking foundation (not fully implemented in MVP)

**Future (Phase 2+):**
- Deep link routing: `championdex://pokemon/25`, `championdex://move/25`, etc.
- Team Builder screen with complex internal navigation

---

## Decisions & Constraints

**Locked-In Decisions:**
- ✅ React Native + Expo (not Flutter)
- ✅ Dark mode by default (light mode deferred)
- ✅ Type-based color theming (accents match Pokemon type)
- ✅ SQLite for local persistence (not Firebase, not realm)
- ✅ PokeAPI as data source (community maintained, free)
- ✅ Custom SVG stat chart (no external lib dependencies)
- ✅ Reanimated 2 for animations (60fps parallax, shiny cross-fade)
- ✅ FlashList for long lists (optimized performance)
- ✅ i18n-compatible code patterns (English-only at launch)
- ✅ Scroll position restoration (UX expectation)

**Constraints:**
- ❌ No user authentication (fully anonymous)
- ❌ No remote telemetry in MVP (local-only)
- ❌ No push notifications (MVP scope)
- ❌ No light mode (Phase 2+)
- ❌ No advanced filtering by generation, dex range, etc. (Phase 2+)

---

## Open Questions & Design Decisions Pending

**From DETAIL_VIEWS_SPEC.md:**
1. Form selector UI pattern — Carousel, dropdown, segmented, or tabs? (Decide before TASK-012)
2. Moveset grouping — Flat list, grouped by learn method, or separate screen?
3. Stat chart alt text — How detailed for screen readers?
4. Cross-linked items — Should moves/abilities reference items that boost them?

---

## Quick Reference: File Locations

```
championdex/
├── app/
│   ├── _layout.tsx                      (Root navigation)
│   ├── (main)/
│   │   ├── _layout.tsx                  (Tab navigator)
│   │   └── (pokedex)/
│   │       ├── index.tsx                (Pokemon list - COMPLETE)
│   │       ├── moves.tsx                (Moves list - COMPLETE)
│   │       ├── abilities.tsx            (Abilities list - COMPLETE)
│   │       ├── items.tsx                (Items list - COMPLETE)
│   │       ├── pokemon/[id].tsx         (Pokemon detail - Phase 1.1)
│   │       ├── moves/[id].tsx           (Move detail - Phase 1.1)
│   │       ├── abilities/[id].tsx       (Ability detail - Phase 1.1)
│   │       └── items/[id].tsx           (Item detail - Phase 1.1)
│   └── (team)/
│       └── _layout.tsx                  (Team builder - Phase 1.2)
│
├── src/
│   ├── components/
│   │   ├── common/                      (TypeBadge, LoadingSpinner, etc.)
│   │   ├── lists/                       (SearchHeader, SubTabBar, etc.)
│   │   ├── pokemon/                     (PokemonCard)
│   │   └── detail/                      (New in Phase 1.1)
│   │
│   ├── hooks/
│   │   ├── queries/                     (usePokemonList, useMovesList, etc.)
│   │   └── ui/                          (useDebounce, useScrollPositionRestore)
│   │
│   ├── types/
│   │   ├── pokemon.ts, moves.ts, etc.
│   │   └── navigation.ts                (New in Phase 1.1)
│   │
│   ├── constants/
│   │   ├── colors.ts
│   │   ├── spacing.ts
│   │   └── routes.ts
│   │
│   ├── services/
│   │   └── database.ts                  (SQLite queries)
│   │
│   ├── store/
│   │   └── (Context providers - future)
│   │
│   ├── i18n/
│   │   └── index.ts                     (Translation keys)
│   │
│   └── utils/
│       ├── statChartMath.ts             (New in Phase 1.1)
│       └── (other utilities)
│
├── docs/
│   ├── REQUIREMENTS.md
│   ├── DESIGN.md
│   ├── LIST_SCREENS_ARCHITECTURE.md
│   ├── DETAIL_VIEWS_SPEC.md             (NEW)
│   ├── DETAIL_VIEWS_TASKS.md            (NEW)
│   ├── PHASE_1.1_SUMMARY.md             (NEW)
│   └── INDEX.md                         (This file)
│
└── README.md
```

---

## How to Use This Documentation

**For Project Managers:**
- Start with [PHASE_1.1_SUMMARY.md](PHASE_1.1_SUMMARY.md) — 2-page overview
- Then review [DETAIL_VIEWS_TASKS.md](DETAIL_VIEWS_TASKS.md) — Task breakdown and effort estimates

**For Developers:**
- Start with [LIST_SCREENS_ARCHITECTURE.md](LIST_SCREENS_ARCHITECTURE.md) — Proven patterns
- Then read [DETAIL_VIEWS_SPEC.md](DETAIL_VIEWS_SPEC.md) — Detailed design
- Reference [DETAIL_VIEWS_TASKS.md](DETAIL_VIEWS_TASKS.md) for task-by-task implementation

**For Designers:**
- Read [DESIGN.md](DESIGN.md) — Design system and layout specs
- Review mockup requirements in [DETAIL_VIEWS_SPEC.md](DETAIL_VIEWS_SPEC.md) Section 2

**For QA:**
- Check [LIST_SCREENS_ARCHITECTURE.md](LIST_SCREENS_ARCHITECTURE.md) Section "Testing Checklist" — Phase 1.0 patterns
- Review [DETAIL_VIEWS_TASKS.md](DETAIL_VIEWS_TASKS.md) Milestone 6 — Phase 1.1 testing tasks

**For Future Maintainers:**
- This index file and [DESIGN.md](DESIGN.md) are your best friends
- When adding features, check constraints and locked-in decisions above

---

## Version History

| Date | Version | Status | Key Changes |
|------|---------|--------|-------------|
| 2026-07-09 | 0.1 | Draft | REQUIREMENTS.md, DESIGN.md created |
| 2026-07-10 | 1.0 | Complete | LIST_SCREENS_ARCHITECTURE.md locked in |
| 2026-07-10 | 1.1 | Specified | DETAIL_VIEWS_SPEC.md, DETAIL_VIEWS_TASKS.md created (ready for dev) |

---

**Last Updated:** 2026-07-10  
**Next Phase Kickoff:** Ready when you approve Phase 1.1 scope & design mockups
