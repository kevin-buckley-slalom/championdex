# REQUIREMENTS.md

**Version:** 0.1 | **Last Updated:** 2026-07-09 | **Status:** Draft

---

## Changelog

| Date | Version | Change |
|------|---------|--------|
| 2026-07-09 | 0.1 | Initial requirements specification for ChampionDex MVP |

---

## 1. Overview

This document specifies all functional and non-functional requirements for ChampionDex MVP (Phase 1). Each requirement is numbered (REQ-XXX) for traceability across design and task documents.

**Scope:** iOS + Android cross-platform app with reference guide, detail views, and team builder.

---

## 2. Functional Requirements

### 2.1 Reference Guide (Main Screen)

| Req ID | Requirement | Acceptance Criteria | Priority |
|--------|-------------|-------------------|----------|
| REQ-001 | Display searchable list of all Pokemon | App loads and displays ≥150 Pokemon in initial state; list is scrollable | P0 |
| REQ-002 | Search Pokemon by name (typeahead) | Typing "pika" returns "Pikachu", "Pickachu" etc. within <100ms; results update as user types | P0 |
| REQ-003 | Search Moves by name and attributes | Search "thunder" returns "Thunderbolt", "Thunder Wave", etc. with sub-100ms latency | P1 |
| REQ-004 | Search Abilities by name | Search "static" returns "Static" ability with related Pokemon; <100ms response | P1 |
| REQ-005 | Search Items by name | Search "pokéball" returns ball-type items; <100ms response | P1 |
| REQ-006 | Multi-filter chips on reference list | User can combine filters: Type=Fire, Generation≥5; list updates in real-time | P0 |
| REQ-007 | Sort reference list by multiple attributes | Sort by Name (A-Z), Stat (descending), National Dex # (ascending); persist sort preference | P1 |
| REQ-008 | Tab navigation between Pokemon/Moves/Abilities/Items | Four tabs at bottom or top; switching tabs is instant; tabs remember scroll position | P0 |
| REQ-009 | Display Pokemon sprite in list item | Each Pokemon shows official sprite image; images are 64x64px or scalable | P1 |
| REQ-010 | Display Pokemon type badges | Each Pokemon shows type(s) with color-coded badge(s); dark mode friendly | P0 |
| REQ-011 | Load and display 1000+ entries without lag | List renders in <500ms (P95) on mid-range device (Android with 2GB RAM equivalent) | P0 |
| REQ-012 | Tap list item to navigate to detail view | Tapping Pokemon/Move/Ability/Item navigates to detail page; smooth transition animation | P0 |

### 2.2 Detail Views

| Req ID | Requirement | Acceptance Criteria | Priority |
|--------|-------------|-------------------|----------|
| REQ-013 | Display Pokemon detail page with name, dex #, types | Page loads <200ms; shows official artwork, type badges, abilities, base stats | P0 |
| REQ-014 | Parallax scrolling on detail view | Artwork moves slower than content; parallax effect is smooth (60fps) | P1 |
| REQ-015 | Display base stats in hexagon/radar chart | All 6 stats (HP, Atk, Def, SpA, SpD, Spe) visible in visual chart; labels clear | P1 |
| REQ-016 | Toggle shiny sprite variant | Button or toggle switches between normal and shiny sprite; animation <200ms | P1 |
| REQ-017 | Display alternate Pokemon forms | True form differences (Alolan, Galarian, Hisuian, Mega, Gigantamax, regional variants) are separate Pokemon entries in database; each has own detail page with full data. Cosmetic variants (gender sprite differences with no stat/move impact) grouped in one entry with toggle UI. Both support visual depiction. | P1 |
| REQ-018 | Display gender variants (if applicable) | Cosmetic gender sprite differences grouped under single Pokemon entry; toggle switches male/female sprites visually (no stat/move changes) | P1 |
| REQ-019 | Show full moveset/movepool | List all learnable moves with type, power, accuracy; searchable/sortable by type | P1 |
| REQ-020 | Tap move to navigate to move detail | Move name is tappable; navigates to move detail page | P1 |
| REQ-021 | Display move detail: name, type, power, accuracy, description | Move page shows: name, type badge, power (if applicable), accuracy %, priority, full description | P1 |
| REQ-022 | Display ability detail: name, description, affected Pokemon | Ability page shows description, list of Pokemon with this ability (tappable) | P1 |
| REQ-023 | Display item detail: name, description, effect | Item page shows name, type icon, full description of effect/use | P1 |
| REQ-024 | Navigate between related details (Pokemon ↔ Move ↔ Ability ↔ Item) | Each detail page has deep links to related entities; navigation is frictionless | P1 |
| REQ-025 | Back navigation to previous screen | Tap back button or swipe gesture; returns to previous page and position | P0 |
| REQ-025a | Ambient backdrop particle effects on hero | Subtle looping particle animations layered behind Pokémon artwork; backdrop-specific per type (leaves/grass, embers/fire, sparks/electric, etc.); always behind artwork; user-disableable via `particlesEnabled` prop | P1 |

### 2.3 Team Builder

| Req ID | Requirement | Acceptance Criteria | Priority |
|--------|-------------|-------------------|----------|
| REQ-026 | Create new team from scratch | User can start team builder; empty slots for 6 Pokemon; team starts unnamed | P0 |
| REQ-027 | Add Pokemon to team slot | Tap slot → search Pokemon → select → added to team; can add duplicates | P0 |
| REQ-028 | Remove Pokemon from team slot | Swipe or tap X button on team member; slot becomes empty | P0 |
| REQ-029 | Reorder Pokemon in team | Drag-and-drop or swap controls to rearrange 6-slot team order | P1 |
| REQ-030 | Select ability for Pokemon instance | Dropdown showing available abilities; selection persists | P0 |
| REQ-031 | Select held item for Pokemon instance | Search/dropdown for items; can be empty (no item) | P1 |
| REQ-032 | Select moveset (up to 4 moves) | Add moves with multi-select from movepool; can swap/remove moves; exactly 4 moves required for analysis | P0 |
| REQ-033 | Display stat sliders for IVs/EVs | 6 sliders (HP, Atk, Def, SpA, SpD, Spe); range 0–31 (IV) or 0–252 (EV); real-time stat updates | P1 |
| REQ-034 | Display team member stat chart (hexagon/radar) | Visual chart of all 6 stats for selected team member; updates when stats/IVs/EVs change | P0 |
| REQ-035 | Calculate and display total stats for each Pokemon | Stats calculated with formula: (Base + IV + EV/4) * Level modifier; displayed numerically | P1 |
| REQ-035a | Stat Level selector | User can toggle between Level 50 and Level 100 for all stat calculations in Team Builder; selection persists per team | P1 |
| REQ-036 | Persist multiple saved teams | Save team with name; user can save ≥5 teams; list shows team names with preview | P0 |
| REQ-037 | Load saved team | Tap saved team → reload all 6 Pokemon, abilities, items, moves, IV/EV state | P0 |
| REQ-038 | Edit saved team | Load team, modify Pokemon/moves/stats, save changes; overwrite or new save | P1 |
| REQ-039 | Delete saved team | Tap team, confirm delete; team removed from list | P1 |
| REQ-040 | Display team type coverage | Analysis shows: types covered by team moves; types weak to; visual matrix or list | P1 |
| REQ-041 | Display team type weaknesses | Analysis shows: types the team is weak to (defensively); organized by number of weaknesses | P1 |
| REQ-042 | Analyze Pokemon type matchups | Shows what types each team member is strong against, weak to | P2 |

### 2.4 Data & Offline

| Req ID | Requirement | Acceptance Criteria | Priority |
|--------|-------------|-------------------|----------|
| REQ-043 | Load Pokemon data from PokeAPI on first run | App fetches all Pokemon, moves, abilities, items; data is parsed and stored locally | P0 |
| REQ-044 | Store data locally (SQLite or equivalent) | All fetched data persisted in local database; subsequent app launches use local data | P0 |
| REQ-045 | Fully offline operation for core features | After initial data load, all reference guide, detail, and team builder features work without internet | P0 |
| REQ-046 | Display offline indicator | UI shows WiFi or connectivity indicator; "Offline Mode" badge if disconnected | P2 |
| REQ-047 | Cache sprite/artwork images locally | Images bundled or cached after first download; reference guide doesn't need internet for images | P1 |

### 2.5 UI/UX & Theming

| Req ID | Requirement | Acceptance Criteria | Priority |
|--------|-------------|-------------------|----------|
| REQ-048 | Dark mode by default | App launches in dark mode; background is dark (near-black or dark gray); text is light | P0 |
| REQ-049 | Type-based color theming | Detail pages accent color matches Pokemon type (Fire = red, Water = blue, etc.); consistent palette | P0 |
| REQ-050 | Smooth 60fps animations | All transitions (navigation, image swaps, stat updates) render at 60fps; no jank | P0 |
| REQ-051 | Responsive layout for phone screens | App works on 4.5"–6.5" screens; text readable, touch targets ≥44pt | P0 |
| REQ-052 | Accessibility: readable text sizes | Body text minimum 14sp; headings 16+sp; sufficient color contrast (WCAG AA) | P0 |
| REQ-053 | Accessibility: keyboard navigation | All interactive elements reachable via keyboard/assistive tech; logical tab order | P1 |
| REQ-054 | Accessibility: screen reader support | Detail pages readable by VoiceOver/TalkBack; images have alt text; buttons labeled | P1 |

### 2.6 Localization

| Req ID | Requirement | Acceptance Criteria | Priority |
|--------|-------------|-------------------|----------|
| REQ-054a | i18n-compatible code patterns | All UI strings use translation key system (no hardcoded strings); English-only content at launch; infrastructure ready for future translations | P1 |

### 2.7 Performance

| Req ID | Requirement | Acceptance Criteria | Priority |
|--------|-------------|-------------------|----------|
| REQ-055 | Reference guide list loads in <500ms (P95) | On Android 8.0 emulator or equivalent device, list renders sub-500ms | P0 |
| REQ-056 | Search results return in <100ms (P95) | Typeahead search responds to character input within 100ms | P0 |
| REQ-057 | Detail page loads in <200ms | Tapping list item, detail page renders in <200ms on mid-range device | P0 |
| REQ-058 | Stat calculations update in real-time | Adjusting IV/EV slider updates displayed stats and chart instantly (<50ms); supports Level 50 and Level 100 calculations | P0 |

---

## 3. Non-Functional Requirements

### 3.1 Technical Stack

| Req ID | Requirement | Rationale |
|--------|-------------|-----------|
| NFR-001 | Cross-platform framework: React Native with Expo OR Flutter | Code reuse >80%; single codebase for iOS + Android; fast iteration |
| NFR-002 | iOS minimum version: iOS 13+ | Broad device coverage; modern APIs available |
| NFR-003 | Android minimum version: Android 8.0 (API 26) | Covers ~95% of active devices; modern UI capabilities |
| NFR-004 | Local database: SQLite or equivalent | Fast queries; no external dependencies; proven for mobile |
| NFR-005 | Data source: PokeAPI (public REST API) | Free tier sufficient for ~900 Pokemon + moves + abilities + items; community maintained |
| NFR-006 | Build & deployment: App Store (iOS) + Google Play Store (Android) | Standard distribution channels; required for production release |
| NFR-007 | Code version control: Git (GitHub or equivalent) | Standard; required for CI/CD and team collaboration |

### 3.2 Security & Privacy

| Req ID | Requirement | Acceptance Criteria |
|--------|-------------|-------------------|
| NFR-008 | No user authentication | App is fully anonymous; no login required; no user data collection |
| NFR-009 | MVP: No remote telemetry | MVP is local-only; no analytics, crash reporting, or user tracking |
| NFR-009a | Post-Launch: Crash Reporting | Post-launch: add Sentry (or equivalent) to error telemetry stack for crash monitoring and diagnostics |
| NFR-010 | Secure image storage | Images cached locally; no unencrypted sensitive data on device |
| NFR-011 | Code signing & secure build | App signed with developer certificate; build pipeline secure |

### 3.3 Performance Targets

| Req ID | Requirement | Target |
|--------|-------------|--------|
| NFR-012 | App startup time | Cold start: <2s; Warm start: <500ms |
| NFR-013 | Memory usage | Footprint: <150MB on first run; <200MB with full dataset loaded |
| NFR-014 | Battery impact | Minimal; no background tasks; polling only on manual refresh |
| NFR-015 | Network data transfer | Initial sync: <50MB (includes images); subsequent: 0 (offline) |

### 3.4 Quality & Reliability

| Req ID | Requirement | Target |
|--------|-------------|--------|
| NFR-016 | Crash-free session rate | ≥99.9% |
| NFR-017 | Unit test coverage | ≥70% for critical paths (stat calculations, filters, search) |
| NFR-018 | Integration test coverage | Core workflows (search → detail → team builder) automated |
| NFR-019 | Device coverage | Tested on: 2–3 iOS devices (iPhone 12/13/14 range); 2–3 Android devices (Pixel 4a, Samsung A12 equivalent) |

### 3.5 Accessibility

| Req ID | Requirement | Standard |
|--------|-------------|----------|
| NFR-020 | WCAG 2.1 Level AA compliance | Minimum for public app; color contrast 4.5:1 for text |
| NFR-021 | iOS: VoiceOver support | Detail pages fully screen-reader navigable |
| NFR-022 | Android: TalkBack support | Detail pages fully screen-reader navigable |

### 3.6 Scalability

| Req ID | Requirement | Target |
|--------|-------------|--------|
| NFR-023 | Support ≥1000 Pokemon entries | List renders without performance degradation |
| NFR-024 | Support ≥5000 moves | Move database loads and searches quickly |
| NFR-025 | Support multiple teams (user-generated) | ≥100 saved teams before performance impact |

### 3.7 Maintainability

| Req ID | Requirement | Approach |
|--------|-------------|----------|
| NFR-026 | Modular component architecture | Reusable UI components; clear separation of concerns |
| NFR-027 | Data abstraction layer | API calls isolated; easy to swap data source (PokeAPI → custom API) |
| NFR-028 | Documentation | Code comments, README, architecture docs; clear for future contributors |
| NFR-029 | Localization architecture | i18n-compatible patterns from day 1; all UI strings in translation key system (no hardcoding); English-only content at launch; ready for future language additions |

---

## 4. User Stories

### Story 1: Quick Pokemon Lookup During Gameplay
**As a** competitive Pokemon Champions player,  
**I want to** quickly search and view a Pokemon's stats and movepool,  
**So that** I can make informed decisions during gameplay without leaving the app.

**Acceptance Criteria:**
- Search "Charizard" returns Charizard in <100ms
- Tapping Charizard shows detail page with stats, moves, abilities in <200ms
- Can tap any move to see move details

### Story 2: Building a Balanced Team
**As a** team builder,  
**I want to** create a team of 6 Pokemon with custom movesets and items,  
**So that** I can experiment with team compositions and visualize type coverage.

**Acceptance Criteria:**
- Can add 6 different Pokemon to team builder
- Each Pokemon has selectable ability, item, moveset
- Team analysis shows type coverage and weaknesses
- Can save multiple teams and reload them

### Story 3: Learning Pokemon Types & Stats
**As a** new player,  
**I want to** explore Pokemon types, see their strengths/weaknesses visually,  
**So that** I can understand the game mechanics and build effective teams.

**Acceptance Criteria:**
- Type badges are color-coded and consistent
- Detail page shows type matchups visually
- Hexagon chart clearly displays stat distribution
- Dark mode is easy on the eyes

### Story 4: Playing Offline
**As a** player on a train with no WiFi,  
**I want to** access all Pokemon data and team builder features offline,  
**So that** I can plan teams and check references without internet.

**Acceptance Criteria:**
- After first data load, app works completely offline
- All Pokemon, moves, abilities, items are searchable offline
- Team builder fully functional offline
- Offline indicator shown when disconnected

---

## 5. Acceptance Criteria Summary

### MVP Launch Checklist

- [ ] **Reference Guide**
  - [ ] Search (Pokemon, moves, abilities, items) <100ms
  - [ ] Multi-filter and sort
  - [ ] Tab navigation between entities
  - [ ] List loads 1000+ entries in <500ms

- [ ] **Detail Views**
  - [ ] Pokemon detail: stats, abilities, moveset, type badges
  - [ ] Move detail: type, power, accuracy, description
  - [ ] Ability detail: description, related Pokemon
  - [ ] Item detail: description, effect
  - [ ] Parallax animations smooth (60fps)

- [ ] **Team Builder**
  - [ ] Add/remove/reorder Pokemon in 6-slot team
  - [ ] Select ability, item, 4-move moveset per Pokemon
  - [ ] IV/EV sliders for stat customization
  - [ ] Type coverage and weakness analysis
  - [ ] Save/load/edit/delete multiple teams

- [ ] **Data & Offline**
  - [ ] Initial data load from PokeAPI
  - [ ] Local SQLite storage
  - [ ] 100% offline operation after load
  - [ ] Image caching

- [ ] **UI/UX**
  - [ ] Dark mode by default
  - [ ] Type-based color theming
  - [ ] 60fps animations throughout
  - [ ] WCAG 2.1 AA accessibility

- [ ] **Performance**
  - [ ] Startup <2s cold, <500ms warm
  - [ ] Memory <200MB with full dataset
  - [ ] 99.9% crash-free rate
  - [ ] P95 targets met (500ms list, 100ms search, 200ms detail)

- [ ] **Deployment**
  - [ ] iOS app on App Store
  - [ ] Android app on Google Play
  - [ ] Code signed and versioned
  - [ ] Release notes documented

---

## 6. Open Questions & Assumptions

### Questions for Clarification
1. **Data Update Cadence:** How often should Pokemon data be refreshed? (e.g., with each new Pokemon game release, or quarterly)
2. **Analytics:** Is any analytics acceptable post-launch (e.g., app crash reporting, feature usage)?

### Assumptions
1. PokeAPI remains free and stable during MVP development and launch
2. Competitor apps (like Pokédex by Nintendo) are not available in all regions; gap exists for companion app
3. Initial target: English-language only; translations deferred to Phase 2; code uses i18n-compatible patterns from day 1
4. No backend server required for MVP (fully local + public API); UUIDs in schema enable future cloud sync
5. Target user has at least iOS 13 or Android 8.0
6. Stat calculations use user-selectable Level 50 or Level 100 (not fixed)
7. True Pokemon form differences (Alolan, Galarian, Hisuian, Mega, Gigantamax) are separate database entries; cosmetic variants (gender sprites) are grouped with toggle UI
8. Crash reporting via Sentry added post-launch; MVP is local-only

---

## 7. Traceability Matrix

| REQ ID | Component | Design Section | Task Phase |
|--------|-----------|-----------------|-----------|
| REQ-001 to REQ-012 | Reference Guide | 2.1 | Phase 1: Foundation |
| REQ-013 to REQ-025 | Detail Views | 2.2 | Phase 1: Foundation |
| REQ-026 to REQ-042 | Team Builder | 2.3 | Phase 1: Foundation |
| REQ-043 to REQ-047 | Data & Offline | 2.4 | Phase 1: Foundation |
| REQ-048 to REQ-054 | UI/UX & Theming | 2.5 | Phase 1: Foundation |
| REQ-055 to REQ-058 | Performance | 2.6 | Phase 1: Optimization |
| NFR-001 to NFR-027 | Non-Functional | 3.0 | Setup & Throughout |

---

## 8. Next Steps

1. **Design Phase:** Translate these requirements into high-fidelity design specs (DESIGN.md)
2. **Task Planning:** Break design into implementation tasks (TASKS.md)
3. **Stakeholder Review:** Present requirements to team and confirm scope before design/dev begins
4. **Architecture Review:** Tech lead reviews framework choice (React Native vs Flutter) before implementation
