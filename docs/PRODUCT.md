# PRODUCT.md

**Version:** 0.1 | **Last Updated:** 2026-07-09 | **Status:** Draft

---

## Changelog

| Date | Version | Change |
|------|---------|--------|
| 2026-07-09 | 0.1 | Initial product specification for ChampionDex |

---

## 1. Product Overview

### What is ChampionDex?

ChampionDex is a cross-platform mobile companion app (iOS & Android) designed for players of the Pokemon Champions mobile game. It serves as a quick-reference guide and team-building tool, enabling players to:
- Instantly look up Pokemon, moves, abilities, and items during gameplay
- Build and analyze teams with visual stat representations and type coverage analysis
- Access comprehensive game data offline, eliminating friction during mobile play
- Experiment with team compositions and strategies before committing to in-game teams

### Problem Solved

Pokemon Champions players currently face friction when:
- Checking Pokemon stats, movesets, or ability interactions mid-gameplay
- Needing to alt-tab or context-switch to external web resources (interrupts flow)
- Team building without visibility into stat distributions or type weaknesses
- Playing in areas with unreliable connectivity (no offline fallback)

ChampionDex eliminates these pain points by providing a purpose-built, performant companion that keeps players in the game experience.

---

## 2. Target Users

### Primary Persona: Competitive/Serious Player
- **Demographics:** Ages 15–45, desktop/console gamers with mobile as secondary platform
- **Behavior:** Uses guides, optimizes teams, engages with min-maxing and meta discussions
- **Need:** Fast reference tool; detailed stat and type analysis; saved teams for strategy testing
- **Frequency:** Daily to 3x/week, sustained play sessions

### Secondary Persona: Casual Player
- **Demographics:** Ages 8–25, mobile-first gamers
- **Behavior:** Plays for enjoyment, less focused on optimization, occasional team experimentation
- **Need:** Easy-to-understand interface, quick lookups, fun team building
- **Frequency:** Plays weekly, shorter sessions

### Tertiary Persona: New/Returning Player
- **Demographics:** Anyone new to Pokemon Champions or returning after a break
- **Behavior:** Needs contextual help, learns through exploration
- **Need:** Accessible UI, clear explanations, visual learning (sprites, type indicators)
- **Frequency:** Variable, heavier during onboarding phase

---

## 3. Core Value Propositions

1. **Speed & Accessibility**
   - Instant search and lookup (sub-100ms even with 1000+ entries)
   - No external browser required; stays in the mobile app experience
   - Typeahead search + multi-filter chips for power users

2. **Offline-First**
   - Core reference data (Pokemon, moves, abilities, items) cached locally
   - Team building works fully offline
   - Syncs on reconnection (future phase)

3. **Team Building at Scale**
   - Visual team composition tool (up to 6 Pokemon)
   - Stat charts (hexagon/radar display)
   - Type coverage analysis (shows what types are weak against, covered by team)
   - Multiple saved teams with versioning

4. **Beautiful Design & Polish**
   - Dark mode primary (aligned with Pokemon game aesthetics)
   - Type-based color theming (visual reinforcement of Pokemon types)
   - 60fps animations (parallax scrolling, image transitions)
   - App-store quality UI (Figma-designed, production asset workflow)

5. **Zero Friction**
   - Installed once, no login required (anonymous local-first)
   - Deep linking to specific Pokemon/move details
   - Shareable team codes (future phase: share team via link)

---

## 4. Key Product Goals & Success Metrics

### Phase 1 (MVP) Goals
- Launch iOS + Android with core reference guide and team builder
- Achieve 60fps performance on mid-range devices
- Support 100% offline mode for all core features
- Establish design system and foundation for future features

### Phase 2+ Roadmap (Not in Scope for MVP)
- Cloud team syncing across devices
- Social features (team sharing, community tier lists)
- In-app notifications (Pokemon balance updates)
- Competitive meta analysis and suggestions
- Integration with Pokemon Champions API for live tournament data

### Success Metrics

| Metric | Target | Rationale |
|--------|--------|-----------|
| **App Store Rating** | 4.5+ stars | Quality bar; indicates UX maturity |
| **Performance (P95 list load)** | <500ms | Core UX; acceptable on mid-range devices |
| **Offline availability** | 100% for reference data | Core value prop |
| **User retention (30-day)** | 40%+ | Engaged player base; sustained usage |
| **Crash-free sessions** | 99.9%+ | Stability foundation |
| **Search P95 latency** | <100ms | Speed perceived as instant |

---

## 5. Core Concepts & Terminology

| Term | Definition | In Scope |
|------|-----------|----------|
| **Pokemon** | Individual creature entity with stats, abilities, movepool, sprite assets | Yes |
| **Move** | Attackable action; has type, power, accuracy, priority, description | Yes |
| **Ability** | Passive trait affecting battle behavior; Pokemon has 1 active ability | Yes |
| **Item** | Held item affecting battle stats or effects; Pokemon instance holds 1 item | Yes |
| **Team** | Ordered collection of up to 6 Pokemon instances; user-saved | Yes |
| **Pokemon Instance** | Individual team member with ability selection, stats (IVs/EVs), item, moveset | Yes |
| **IV/EV** | Individual Values / Effort Values; stat modifiers visible via sliders in team builder | Yes |
| **Type** | Pokemon type classification (Fire, Water, Grass, etc.); drives color theming | Yes |
| **Shiny Toggle** | Alternate sprite variant (gold/silver Pokemon); UI toggle in detail view | Yes |
| **Form/Variant** | Alternate Pokemon form (e.g., regional variants); selectable in detail/team views | Yes |
| **Type Coverage** | Collective move type distribution of a team; analysis shows gaps | Yes |
| **Team Analysis** | Computed insights: weaknesses, resistances, coverage gaps | Yes |
| **Synced Teams** | Teams persisted to cloud (future phase — not MVP) | No |

---

## 6. Data Model (High-Level)

### Pokemon Entity
- **ID, National Dex #**
- **Name, Sprite, Official Artwork**
- **Type(s)** (1–2 types)
- **Base Stats** (HP, Atk, Def, SpA, SpD, Spe)
- **Ability Pool** (up to 3: normal, normal, hidden)
- **Movepool** (all learnable moves)
- **Forms/Variants** (alternate sprites, stats)
- **Shiny Sprites** (alternate color palette)

### Move Entity
- **ID, Name, Description**
- **Type**
- **Power, Accuracy, Priority**
- **Effect/Category** (Physical, Special, Status)

### Ability Entity
- **ID, Name, Description**
- **Battle Effect**
- **Type Affinity** (if any)

### Item Entity
- **ID, Name, Description**
- **Stat Bonus** (if any)
- **Effect/Usage**

### Team Entity (Local Storage)
- **Team ID, Name, Timestamp**
- **Ordered Array of Pokemon Instances:**
  - Pokemon ID + Form
  - Ability ID (selected)
  - Item ID (held)
  - Moveset (4 move IDs)
  - IV/EV Sliders (6 stats each)
  - Shiny Toggle

---

## 7. Out of Scope (MVP)

- **Cloud sync / login** (local-only teams for MVP)
- **Social features** (team sharing, comments, discussions)
- **Meta/tournament integration** (live APIs, rankings)
- **Live game connectivity** (no auto-sync with Pokemon Champions game state)
- **Multiplayer/battle simulation** (calculator only, not interactive battles)
- **In-app purchases** (free app, no monetization)
- **Push notifications**
- **AR/camera features**
- **Backend services** (all data is local, preloaded, or fetched from public PokeAPI)

---

## 8. Design Principles

1. **Speed First** — Every screen must load and respond instantly; list of 1000+ entries renders in <500ms
2. **Dark by Default** — Dark mode is primary theme; light mode optional
3. **Type-Driven Theming** — Colors adapt based on Pokemon type; visual reinforcement
4. **Offline as First-Class** — No mandatory login; all core data works offline
5. **Exploration-Friendly** — Deep linking, navigation hints, related entity taps
6. **Polish Over Features** — Smooth 60fps animations, visual feedback, no jank
7. **Accessibility** — WCAG 2.1 AA standard; readable text, touch targets 44pt+

---

## 9. Success Criteria for MVP

- [ ] iOS app published to App Store
- [ ] Android app published to Google Play Store
- [ ] All core reference data (Pokemon, moves, abilities, items) searchable
- [ ] Detail pages render with parallax and smooth image transitions
- [ ] Team builder fully functional with stat charts and type coverage analysis
- [ ] Multiple teams can be saved and loaded
- [ ] App works fully offline after initial data load
- [ ] Performance: list view loads <500ms (P95), search returns results <100ms (P95)
- [ ] Design system documented; type-based color theming implemented
- [ ] Test coverage: unit tests for stat calculations, type coverage analysis, search logic
- [ ] Crash-free rate ≥99.9%

---

## 10. Appendix: Related Documents

- **REQUIREMENTS.md** — Detailed functional & non-functional requirements, acceptance criteria
- **DESIGN.md** — System architecture, component breakdown, data flows, tech stack recommendation
- **TASKS.md** — Implementation task list across phases, dependencies, effort estimates
- **structure.md** — Project file organization and key files (generated next)
- **tech.md** — Technology stack, build tooling, deployment pipeline (generated next)
