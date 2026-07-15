# Phase 1.1: Detail Views — Executive Summary

**Version:** 0.1  
**Date:** 2026-07-10  
**Status:** Ready for Stakeholder Review & Team Kickoff

---

## The Next Phase

You have completed **Phase 1.0: List Screens** (Pokemon, Moves, Abilities, Items). The natural next phase is **Phase 1.1: Detail Views** — implementing rich, interactive detail screens for each entity type, plus cross-linking between them.

---

## Why This Phase, Why Now?

**List screens** let users *discover* entities (search, filter, browse).  
**Detail screens** let users *understand* them (stats, abilities, moveset, descriptions).  
**Cross-linking** makes navigation intuitive (tap a move from Pokemon detail → see move detail → tap an ability → see ability detail).

**Phase 1.1 logically precedes Team Builder** because:
- Team Builder needs accurate Pokemon detail data (abilities, movepool, forms)
- Detail screens form the backbone of cross-entity navigation
- Navigation architecture (stack routing) must be proven first

---

## Phase Scope

| Component | Description | Effort |
|-----------|-------------|--------|
| **Pokemon Detail** | Parallax artwork, stat chart, abilities, full moveset, form/shiny toggles | 40-50h |
| **Move Detail** | Type, power, accuracy, description, Pokemon list | 15-20h |
| **Ability Detail** | Description, Pokemon list with optional generation filter | 15-20h |
| **Item Detail** | Name, category, description | 8-10h |
| **Cross-Linking** | Tappable moves/abilities/items across screens | 10-15h |
| **Navigation** | Stack routing, scroll position restoration | 15-20h |
| **StatChart Component** | Reusable hexagon/radar chart for 6 stats | 15-20h |
| **Testing & QA** | Unit, component, integration, manual testing | 30-40h |
| **Accessibility** | VoiceOver/TalkBack support, WCAG AA compliance | 15-20h |
| **Documentation** | Architecture docs, templates, guides | 10-12h |

**Total: 175-225 hours** (4-6 weeks for 2-person team)

---

## Key Design Decisions (Locked In)

✅ **Type-Based Color Theming** — Detail screens accent color matches Pokemon type color

✅ **Custom SVG Stat Chart** — No external charting library; simpler, lighter, type-themed

✅ **Parallax Scrolling** — Reanimated 2 for smooth 60fps artwork parallax (0.5x velocity)

✅ **Cross-Entity Navigation** — Stack-based routing allows moving between Pokemon ↔ Moves ↔ Abilities ↔ Items

✅ **Form Variants as DB Entries** — Alolan Raichu, Mega Charizard X, etc. are separate Pokemon rows with own detail pages

✅ **Scroll Position Restoration** — List screens remember scroll position when returning from detail

---

## Requirements Mapped

| REQ ID | Requirement | Phase | Status |
|--------|-------------|-------|--------|
| REQ-013 | Pokemon detail page | 1.1 | In Scope |
| REQ-014 | Parallax scrolling | 1.1 | In Scope |
| REQ-015 | Stat chart (hexagon/radar) | 1.1 | In Scope |
| REQ-016 | Shiny sprite toggle | 1.1 | In Scope |
| REQ-017 | Form differences | 1.1 | In Scope |
| REQ-018 | Gender variants | 1.1 | In Scope |
| REQ-019 | Full moveset | 1.1 | In Scope |
| REQ-020 | Tap move → move detail | 1.1 | In Scope |
| REQ-021 | Move detail screen | 1.1 | In Scope |
| REQ-022 | Ability detail screen | 1.1 | In Scope |
| REQ-023 | Item detail screen | 1.1 | In Scope |
| REQ-024 | Deep links | 1.1 | In Scope (foundation for Phase 2) |
| REQ-025 | Back navigation | 1.1 | In Scope |

---

## Document Deliverables

Two comprehensive specification documents have been created:

### 1. **DETAIL_VIEWS_SPEC.md** (12 sections, 10 pages)
- Executive summary and requirements traceability
- Component & screen architecture (Pokemon, Move, Ability, Item detail screens)
- Stat chart component design (hexagon geometry, reusability)
- Parallax scrolling and shiny toggle specifications
- Form/variant handling and moveset search/sort
- Navigation architecture (stack structure, route params, deep linking foundation)
- Design system integration (type-based colors, dark mode, typography)
- Data access patterns (new hooks: usePokemonDetail, useMoveDetail, etc.)
- Animation specs (parallax, cross-fade, stat morphing)
- Error handling and edge cases
- Performance considerations (image optimization, query optimization)
- Accessibility specs (screen reader, keyboard nav, color contrast)
- Design trade-offs and open design questions
- Known decisions and rationale

### 2. **DETAIL_VIEWS_TASKS.md** (32 tasks, 15 pages)
Organized into 7 milestones:

**Milestone 1: Foundation & Navigation (Week 1)**
- TASK-001: Navigation stack architecture
- TASK-002: Placeholder detail screen components
- TASK-003: Data hooks (usePokemonDetail, etc.)
- TASK-004: Stat chart component (SVG hexagon)

**Milestone 2: Pokemon Detail Screen (Week 2-3)**
- TASK-005: Main layout & data display
- TASK-006: Parallax scrolling for artwork
- TASK-007: Shiny sprite toggle
- TASK-008: Stat chart integration
- TASK-009: Moveset section (search & sort)
- TASK-010: Moveset row navigation to MoveDetail
- TASK-012: Form variant selector
- TASK-013: Gender variant toggle

**Milestone 3: Abilities, Items & Cross-Linking (Week 3-4)**
- TASK-011: Move detail screen
- TASK-014: Ability detail screen
- TASK-015: Item detail screen
- TASK-016-017: Cross-linking (ability → Pokemon → move, etc.)

**Milestone 4: Scroll Position & Navigation Polish (Week 4)**
- TASK-019: Scroll position restoration on back nav
- TASK-020: Navigation stack stability testing

**Milestone 5: Accessibility & Polish (Week 4-5)**
- TASK-021: VoiceOver/TalkBack labels
- TASK-022: WCAG AA color contrast verification
- TASK-023: Keyboard navigation testing
- TASK-024: Performance & memory profiling

**Milestone 6: Testing & QA (Week 5)**
- TASK-025: Unit tests for data hooks
- TASK-026: Component tests for detail screens
- TASK-027: Integration tests (navigation flows)
- TASK-028: Manual QA testing (iOS + Android)
- TASK-029: Bug fixes & final polish

**Milestone 7: Documentation & Handoff (Week 5-6)**
- TASK-030: Architecture documentation
- TASK-031: Detail screen template
- TASK-032: README & docs index updates

Each task includes:
- Objective and acceptance criteria
- Scope and complexity (S/M/L)
- Dependencies
- Files to create/modify
- Subtasks (granular breakdown)
- Effort estimate (hours)
- Owner/assignee

---

## Team Assignments Recommendation

**2-Person Team (4-6 week sprint):**

| Role | Tasks | Hours/Week |
|------|-------|-----------|
| **Frontend Lead** | TASK-001, 002, 005-010, 012-013, 016-017, 019-021, 023, 030-032 | 25-30h/week |
| **Backend/QA** | TASK-003-004, 011, 014-015, 020, 022, 024-029 | 20-25h/week |

**Parallel Work:** Tasks can run concurrently once TASK-001, 003, 004 complete (Week 1 foundation).

---

## Key Decisions Awaiting Your Input

### Q1: Form Selector UI Pattern
**Options:**
- A) Horizontal scrollable carousel (like iOS tab bar)
- B) Dropdown picker (compact, familiar)
- C) Segmented control (limited to 4-5 forms)
- D) Tab-style buttons

**Recommendation:** (A) Carousel for visual appeal + (B) Picker as fallback for many forms.

**Decision Required Before:** Task-012 implementation

---

### Q2: Moveset Grouping by Learn Method
**Options:**
- A) Flat searchable list (all moves mixed)
- B) Grouped by learn method (Level Up, TM, Egg, Tutor sections)
- C) Separate screen for full moveset (detail shows only level-up moves)

**Recommendation:** (A) Flat list with search (simpler MVP; group filtering deferred to Phase 2).

**Decision Required Before:** Task-009 implementation

---

### Q3: Stat Chart in Team Builder
**Future Phase:** Team Builder will display per-team-member stat charts (morphing animations when IVs/EVs change).

**Design Now For:** Animated stat chart support (we're building the component static now, but design it to accept animation props for future use).

---

### Q4: Cross-Linking Scope (Optional)
**Out of Scope for MVP:**
- Item detail linking from moves/abilities (rare; defer to Phase 1.2)
- Advanced filtering (ability learned by generation X, etc.) in Pokemon lists (Phase 2)

**In Scope:**
- Tap ability in Pokemon detail → Ability detail → tap Pokemon → Pokemon detail (✅)
- Tap move in Pokemon detail → Move detail → tap Pokemon → Pokemon detail (✅)

---

## Success Metrics

By end of Phase 1.1, these must be true:

- ✅ All 4 detail screens functional and tested
- ✅ Parallax scrolling smooth at 60fps (both iOS and Android)
- ✅ Detail page load <200ms (REQ-057 performance target)
- ✅ Cross-linking works (no navigation dead-ends)
- ✅ Scroll position restored when returning to list
- ✅ All tests passing (unit, component, integration)
- ✅ VoiceOver/TalkBack support functional
- ✅ WCAG AA color contrast compliance
- ✅ QA sign-off on real devices (iPhone 12+, Pixel 4a+)
- ✅ No critical bugs
- ✅ Architecture documented for Team Builder phase

---

## What Comes After (Phase 1.2+)

- **Phase 1.2: Team Builder** (8-10 weeks) — 6-slot team editor, stat calculations, type coverage analysis
- **Phase 2: Polish & Optimization** — OTA updates, crash reporting, advanced filtering, light mode
- **Phase 3: Team Sharing & Social** — Export teams, share URLs, cloud sync

This phase is the **critical foundation** all future phases depend on.

---

## Risks & Mitigations

| Risk | Probability | Mitigation |
|------|-------------|-----------|
| Parallax jank on Android | Medium | POC in Week 1; test early; fallback to static if needed |
| Memory leaks in navigation | Medium | Task-020 (stress testing); profile with Flipper early |
| Stat chart SVG math errors | Low | Peer review; comprehensive tests; compare with reference image |
| Form variant DB inconsistency | Low | Data validation in TASK-003 (query testing); QA sign-off |
| Scroll position loss on navigation | Low | Task-019 uses proven React Navigation patterns; test thoroughly |
| Accessibility issues | Low | VoiceOver/TalkBack testing in Week 4-5; external audit if needed |

---

## Next Steps (Your Decision)

1. **Review these specs** — Read through DETAIL_VIEWS_SPEC.md and DETAIL_VIEWS_TASKS.md
2. **Confirm scope** — Are all requirements in scope, or should anything be deferred?
3. **Answer design questions** — Form selector UI, moveset grouping, etc.
4. **Assign team** — Who owns frontend, backend, QA?
5. **Schedule kickoff** — Week of [date] to start Week 1 tasks
6. **Stake in the ground** — Commit to phase completion date

---

## Questions for You

Before you sign off, please clarify:

1. **Timeline:** Do you have a target completion date? (4-6 weeks suggested)
2. **Team:** Who's building this? Same developers as list screens?
3. **Design:** Are design mockups ready, or do we need UX review first?
4. **Scope:** Any features you'd like to defer to Phase 1.2?
5. **Testing:** Are you expecting full device testing coverage, or emulator-only?

---

## Document Locations

- **Specification:** `/docs/DETAIL_VIEWS_SPEC.md`
- **Tasks:** `/docs/DETAIL_VIEWS_TASKS.md`
- **Related:** `/docs/REQUIREMENTS.md`, `/docs/DESIGN.md`, `/docs/LIST_SCREENS_ARCHITECTURE.md`

---

**Status:** ✅ Ready for team review and development kickoff.

Next approval gate: Product + Design review of scope and design mockups.
