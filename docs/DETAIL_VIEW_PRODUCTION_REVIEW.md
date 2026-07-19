# Pokémon Detail Screen — Production Readiness Review
**Date**: 2026-07-17  
**Reviewers**: UI Designer · React Native Expert · QA  
**Status**: ~85–92% ready · 3 P0 blockers · 4 P1 issues before release

---

## Executive Summary

The detail screen is feature-complete and stable on the happy path. Hero parallax, particle effects, stat chart, type effectiveness, evolution chain, encounters, and moveset all work. Three hard blockers remain for production release: form-switch animation, type badge contrast audit, and artwork fallback. Beyond those, accessibility coverage is incomplete and a full layout validation at extreme screen sizes has not been run.

---

## P0 — Production Blockers

### 1. Form-Switch Animation Missing
**Reviewer**: QA  
When the user taps a related form card, the transition is a hard navigation cut. Spec requires a 150ms fade + scale out on current content, 150ms fade in of new form's artwork, stats, and type badges.  
**Spec ref**: DETAIL_VIEWS_SPEC §2.14 "Form Toggle Transitions"  
**Effort**: 2–4 hours

### 2. Type Badge Contrast Audit Not Done
**Reviewers**: QA + UI Designer  
All 18 type badge colors must pass WCAG AA (4.5:1 contrast ratio) against white text. No audit has been run; some type colors (e.g. Normal, Ice, Flying) are known low-contrast risks on light backgrounds.  
**Spec ref**: DETAIL_SCREEN_QA_SPEC §2.14 "Type Badges", Issue #5  
**Effort**: 1–2 hours

### 3. Artwork Fallback Not Verified
**Reviewer**: QA  
HANDOFF.md specifies a Pokéball placeholder when `pokeapi_id` is missing or artwork URL is broken, but no fallback is visible in `PokemonHero.tsx`. If the URL is null or returns 404, the Image renders nothing with no user feedback.  
**Spec ref**: DETAIL_VIEWS_SPEC §7.1 "Missing Data"  
**Effort**: 1–2 hours

---

## P1 — High Priority

### 4. Height Data Not Verified (Issue #6)
**Reviewer**: QA  
Height was previously blank for all Pokémon (known issue). Confirm the field is populated on device. If still blank, InfoStrip shows incomplete data.  
**Effort**: 15-min check; 1 hour if fix needed

### 5. Layout Validation at Extreme Screen Widths
**Reviewer**: QA  
No manual test has been run at 320px (iPhone SE) or 430px (iPhone 14 Pro Max). Stat chart fixed-width labels (64px), type grid square sizing, and long Pokémon names (Flabébé, Mr. Mime) are all untested at these bounds.  
**Spec ref**: DETAIL_SCREEN_QA_SPEC §3.2 "Critical Screen Size Test Scenarios" (19 test cases)  
**Effort**: 2–3 hours

### 6. Error UI Missing for Failed Queries
**Reviewer**: QA + React Native Expert  
If `usePokemonDetail` fails (corrupt DB, missing row), the screen renders blank with no message or retry. Same for `useEncounterLocations` errors. No `ErrorBoundary` wraps the detail screen.  
**Spec ref**: DETAIL_VIEWS_SPEC §7.2 "Network Errors"  
**Effort**: 1–2 hours

### 7. Accessibility — VoiceOver/TalkBack Not Completed
**Reviewers**: React Native Expert + QA  
Multiple components have no `accessibilityRole` or `accessibilityLabel`. Specific gaps:
- `MoveRow` — tappable but no `accessibilityRole="button"` or label
- `TypeSquare` — no label explaining what the type square means
- `EvolutionChain` PokemonNode — no label with Pokémon name/dex context
- `AbilitiesSection` — doesn't distinguish hidden ability in accessibility label
- Modal version selectors (FlavorText, Encounters, Moveset) — no `accessibilityRole="option"` on list items  

**Spec ref**: DETAIL_VIEWS_SPEC §9 "Accessibility"  
**Effort**: 3–4 hours

---

## P2 — Medium Priority

### 8. StatChart Bar Coloring Non-Compliant
**Reviewer**: UI Designer  
All bars render a uniform horizontal gradient (red→cyan) regardless of stat value. Spec requires value-based solid colors: ≥120 cyan, ≥90 green, ≥60 yellow, ≥30 orange, <30 red. A Pokémon with HP 35 should show a red bar, not a full gradient. This defeats the purpose of the visual — users cannot quickly assess stat strength.  
**File**: `StatChart.tsx` (line 153–158 gradient implementation)  
**Effort**: 1–2 hours

### 9. StatChart Bar Height Too Small
**Reviewer**: UI Designer  
Bars are 8px tall. Spec requires 24px. The bars look thin and weak; visual hierarchy is undermined.  
**File**: `StatChart.tsx`  
**Effort**: 30 minutes

### 10. TypeVariantsSection — Variant Name Not Displayed
**Reviewer**: React Native Expert  
`VariantCard` has an `accessibilityHint` referencing `variant.name` but no `<Text>` node renders the name visually. Users see sprite + type badges with no name label. Only accessibility hint carries the name.  
**File**: `TypeVariantsSection.tsx` (line 34–78)  
**Effort**: 30 minutes

### 11. EncounterLocations Query Enabled Without Version Guard
**Reviewer**: React Native Expert  
When `pokemonId` changes, `setSelectedVersion(null)` fires immediately. The second `useEffect` sets a new version once versions load — but if versions haven't loaded yet, `useEncounterLocations` is called with `null` as version. Missing `enabled: !!selectedVersion` guard on the query.  
**File**: `EncounterLocationsSection.tsx`  
**Effort**: 30 minutes

### 12. Parallel useEffect Timeouts Not Cleaned Up on Unmount
**Reviewer**: React Native Expert  
`belowFoldReady` (650ms) and `particlesReady` (1100ms) timeouts in `[id].tsx` have no cleanup if user navigates away before they fire. Causes state-update-on-unmounted-component warnings on fast navigation.  
**File**: `[id].tsx` (line 110–117)  
**Effort**: 15 minutes

### 13. TypeEffectivenessTable timeout not cleaned up on unmount
**Reviewer**: React Native Expert  
`handleTabPress` uses `setTimeout(350)` to change tab state. If component unmounts during that 350ms, a warning fires.  
**File**: `TypeEffectivenessTable.tsx` (line 348–369)  
**Effort**: 15 minutes

### 14. Missing Pressed Feedback on TypeVariants and CosmeticAlternates Cards
**Reviewer**: React Native Expert  
`RelatedFormsSection` cards have scale + opacity pressed feedback. `TypeVariantsSection` and `CosmeticAlternatesSection` cards do not — inconsistent interaction model across the three "forms" sections.  
**Files**: `TypeVariantsSection.tsx`, `CosmeticAlternatesSection.tsx`  
**Effort**: 30 minutes

### 15. RelatedFormsSection Missing Navigation Affordance (Chevron)
**Reviewer**: UI Designer  
Spec called for a small chevron (›) in the top-right corner of each form card to indicate tappability. Absent. Users rely solely on press animation to discover these cards are navigable.  
**File**: `RelatedFormsSection.tsx`  
**Effort**: 30 minutes

### 16. StatChart Section Title Formatting
**Reviewer**: UI Designer  
Section title uses `fontSize.md` (13px, 500 weight). Spec requires 11px, 600 weight, uppercase, letter-spacing 1.5px to match other section headers across the detail view.  
**File**: `StatChart.tsx`  
**Effort**: 15 minutes

---

## P3 — Polish / Low Priority

### 17. Particle System 44% Incomplete
**Reviewer**: QA  
8 of 18 backdrop particle types remain unimplemented: Psychic, Ghost, Dark, Dragon, Steel, Poison, Normal, Ground. Rock and Fighting were explicitly skipped. These types show no ambient particle effect on their detail screens.  
**Effort**: 8–12 hours total (was the original session priority before moveset work)

### 18. StatBar Not Memoized
**Reviewer**: React Native Expert  
`StatBar` components re-render when `defLabelWidth` is measured via `onLayout`, even though sibling bars don't change. Wrapping in `React.memo` would prevent unnecessary re-renders.  
**File**: `StatChart.tsx`  
**Effort**: 30 minutes

### 19. StatChart Bar Width Unclamped
**Reviewer**: React Native Expert  
`barWidth = (stat.value / maxStatValue) * 100` is used directly as a percentage without clamping to [0, 100]. If a stat value somehow exceeds `maxStatValue`, the bar overflows its container.  
**File**: `StatChart.tsx`  
**Effort**: 5 minutes

### 20. EvolutionChain Components Not Memoized
**Reviewer**: React Native Expert  
`ChainNode` and `BranchConnector` are not wrapped in `React.memo`. Full tree re-renders when parent re-renders. For deep chains this is unnecessary work.  
**File**: `EvolutionChain.tsx`  
**Effort**: 30 minutes

### 21. TypeEffectivenessTable Label — "TYPE MATCHUPS" vs Spec
**Reviewer**: UI Designer  
Component uses "TYPE MATCHUPS" as the section title. Spec says "TYPE EFFECTIVENESS". Minor but inconsistent with spec terminology.  
**File**: `TypeEffectivenessTable.tsx`  
**Effort**: 5 minutes

### 22. MoveRow hitSlop Missing
**Reviewer**: React Native Expert  
`MoveRow` has no `hitSlop`. Touch target height depends on dynamic badge layout and could fall below 44px on some devices.  
**File**: `MovesetSection.tsx`  
**Effort**: 15 minutes

### 23. Deep Linking Not Implemented
**Reviewer**: QA  
`championdex://pokemon/25` style deep links are not wired up. Explicitly deferred to post-launch per spec §3.1.  
**Effort**: 3–4 hours (when needed)

### 24. Scroll Position Not Restored on Back Navigation
**Reviewer**: QA  
When returning from detail to list, scroll position resets to top. Spec §3.3 says "restore scroll position or scroll to tapped item".  
**Effort**: 2–3 hours (post-launch acceptable)

---

## Validated & Passing

| Area | Status |
|------|--------|
| Hero parallax (0.5x artwork, 0.25x backdrop) | ✅ |
| Shiny toggle with cross-fade + white flash | ✅ |
| Particle system (10 of 18 types) | ✅ partial |
| Type effectiveness table (tabs, grid, colors) | ✅ |
| Evolution chain (linear + branching) | ✅ |
| Related forms section | ✅ |
| Cosmetic alternates section | ✅ |
| Type variants section (display only) | ✅ (name missing — see #10) |
| Flavor text with version selector | ✅ |
| Encounter locations with version filter | ✅ |
| Moveset — version selector, collapsible groups | ✅ |
| Moveset — TM/HM/TR labels | ✅ |
| Moveset — search + clear button | ✅ |
| Abilities section | ✅ |
| Below-fold deferral (650ms) | ✅ |
| DB version-based overwrite on update | ✅ |
| Empty states (no evolution, no encounters, no moves) | ✅ |
| Genderless / female-only Pokémon | ✅ |
| Pokémon with 100+ moves (Mew) | ✅ |
| Pokémon with branching evolution (Eevee) | ✅ |

---

## Recommended Work Order

**Sprint 1 — Blockers (2 days)**
1. Form-switch animation (#1)
2. Artwork fallback (#3)
3. Type badge contrast audit (#2)
4. Height data on-device check (#4)
5. Timeout cleanup on unmount (#12, #13)
6. EncounterLocations enabled guard (#11)

**Sprint 2 — Accessibility + Layout (2 days)**
7. MoveRow, TypeSquare, PokemonNode accessibility labels (#7)
8. TypeVariantsSection variant name text (#10)
9. Screen size validation 320px/430px (#5)
10. Error UI / ErrorBoundary (#6)

**Sprint 3 — Visual Polish (1 day)**
11. StatChart bar coloring (#8)
12. StatChart bar height (#9)
13. StatChart title formatting (#16)
14. TypeVariants + CosmeticAlternates pressed feedback (#14)
15. RelatedForms chevron affordance (#15)
16. Remaining quick fixes (#19, #21, #22)

**Sprint 4 — Particle Completion (2 days)**
17. Remaining 8 backdrop particle types (#17)

**Post-Launch**
- Deep linking (#23)
- Scroll position restoration (#24)
- Memoization cleanup (#18, #20)
