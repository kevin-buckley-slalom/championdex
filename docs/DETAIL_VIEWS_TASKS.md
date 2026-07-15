# Detail Views Implementation Tasks

**Version:** 0.1  
**Last Updated:** 2026-07-10  
**Status:** Ready for Development  
**Phase:** 1.1 (Post-List Screens)

---

## Changelog

| Date | Version | Change |
|------|---------|--------|
| 2026-07-10 | 0.1 | Initial task breakdown for detail views phase |

---

## Overview

This document breaks down the Detail Views specification into concrete, implementation-ready tasks. Tasks are organized into logical milestones to enable parallel work and incremental validation.

**Estimated Scope:** 8-10 weeks for a 2-person team (one frontend, one backend/DB focused)  
**Dependencies:** List screens (COMPLETE) + database schema (nearly complete)

---

## Milestone 1: Foundation & Navigation (Week 1)

### TASK-001: Set Up Navigation Stack Architecture

**Objective:** Wire React Navigation to support detail screens (stack nav layered above tabs).

**Acceptance Criteria:**
- [ ] Navigation structure updated to include PokemonDetailStack, MoveDetailStack, etc.
- [ ] Detail screens can be pushed/popped without breaking tab state
- [ ] Back button works correctly from detail → list screen
- [ ] Route parameters passed correctly (e.g., pokemonId, moveId)
- [ ] No console warnings about navigation state

**Scope:** Navigation setup only; no detail screen UI yet
**Complexity:** M
**Dependencies:** React Navigation already installed; must not break existing list screens
**Files to Create/Modify:**
- `app/_layout.tsx` (root navigation structure)
- `app/(main)/_layout.tsx` (tab + stack coordination)
- Potentially: `app/(main)/(pokedex)/_layout.tsx`

**Subtasks:**
- [ ] Sketch navigation tree (comment in code)
- [ ] Create stack navigators for each detail screen type
- [ ] Test navigation flow on iOS simulator
- [ ] Test navigation flow on Android emulator
- [ ] Verify back button works and doesn't break list screens

**Effort:** 3-4 hours
**Owner:** Frontend lead

---

### TASK-002: Create Placeholder Detail Screen Components

**Objective:** Scaffold Pokemon, Move, Ability, and Item detail screens with basic layout and data binding.

**Acceptance Criteria:**
- [ ] 4 new screen components exist (`PokemonDetail.tsx`, `MoveDetail.tsx`, `AbilityDetail.tsx`, `ItemDetail.tsx`)
- [ ] Each screen displays route params correctly (e.g., `route.params.pokemonId`)
- [ ] Each screen has a working back button
- [ ] Can navigate from list screens to detail screens
- [ ] Basic loading/error states in place (using EmptyState component)
- [ ] TypeScript types defined for all screen props and params

**Scope:** Scaffolding only; minimal UI
**Complexity:** M
**Files to Create:**
- `app/(main)/(pokedex)/pokemon/[id].tsx` or similar routing structure
- `app/(main)/(pokedex)/moves/[id].tsx`
- `app/(main)/(pokedex)/abilities/[id].tsx`
- `app/(main)/(pokedex)/items/[id].tsx`
- `src/types/navigation.ts` (define all navigation params)

**Subtasks:**
- [ ] Define TypeScript navigation param types
- [ ] Create Pokemon detail scaffold
- [ ] Create Move detail scaffold
- [ ] Create Ability detail scaffold
- [ ] Create Item detail scaffold
- [ ] Wire route params in each screen
- [ ] Add back button handlers
- [ ] Test navigation to all detail screens

**Effort:** 4-5 hours
**Owner:** Frontend lead

---

### TASK-003: Create Data Hooks (usePokemonDetail, useMoveDetail, etc.)

**Objective:** Implement hooks to fetch detail data from SQLite for each entity type.

**Acceptance Criteria:**
- [ ] 4 hooks created: `usePokemonDetail`, `useMoveDetail`, `useAbilityDetail`, `useItemDetail`
- [ ] Each hook accepts ID parameter and optional filters (e.g., form for Pokemon)
- [ ] Hooks return: `{ data, isLoading, error }`
- [ ] Data is fetched from SQLite (not PokeAPI; assume data already synced)
- [ ] Errors are caught and returned (not thrown)
- [ ] Results are cached in memory to avoid refetching on re-renders
- [ ] TypeScript types are exported (Pokemon, Move, Ability, Item)
- [ ] Hooks tested with unit tests (mock SQLite responses)

**Scope:** Data fetching layer only; no UI integration yet
**Complexity:** M
**Dependencies:** SQLite schema finalized; database populated with test data
**Files to Create:**
- `src/hooks/queries/usePokemonDetail.ts`
- `src/hooks/queries/useMoveDetail.ts`
- `src/hooks/queries/useAbilityDetail.ts`
- `src/hooks/queries/useItemDetail.ts`
- `src/hooks/queries/__tests__/usePokemonDetail.test.ts` (example test)

**Subtasks:**
- [ ] Design SQLite queries for each entity (see DETAIL_VIEWS_SPEC appendix)
- [ ] Implement usePokemonDetail hook
- [ ] Implement useMoveDetail hook
- [ ] Implement useAbilityDetail hook
- [ ] Implement useItemDetail hook
- [ ] Add caching layer (React Context or simple in-memory cache)
- [ ] Write unit tests for each hook
- [ ] Test with real database queries (integration test)

**Effort:** 6-8 hours
**Owner:** Backend/DB lead

---

### TASK-004: Create Stat Chart Component (SVG Hexagon)

**Objective:** Build reusable stat chart component that visualizes 6 Pokemon stats in hexagon/radar format.

**Acceptance Criteria:**
- [ ] StatChart component created and exported from `src/components/common/`
- [ ] Component accepts: `stats` object, `accentColor` string, optional `showLabels`, `animated`
- [ ] Renders SVG hexagon with 6 points (HP, Atk, Def, SpA, SpD, Spe)
- [ ] Stats normalized to 0-100 scale visually
- [ ] Type-based accent color applied to fill
- [ ] Labels display stat name + value (e.g., "HP 35")
- [ ] Responsive: scales appropriately on different screen sizes
- [ ] Dark mode compatible (fills, strokes, text colors work on dark backgrounds)
- [ ] Component tested on both iOS and Android
- [ ] Stories/snapshots in component test file

**Scope:** Component only; no animation yet (animations in future Team Builder phase)
**Complexity:** L (SVG math can be tricky; math needs validation)
**Files to Create:**
- `src/components/common/StatChart.tsx`
- `src/components/common/__tests__/StatChart.test.tsx`
- `src/utils/statChartMath.ts` (hexagon geometry calculations)

**Subtasks:**
- [ ] Research hexagon geometry (polar coordinates, point calculation)
- [ ] Implement stat normalization formula
- [ ] Draw SVG hexagon with 6 points
- [ ] Add grid lines for reference
- [ ] Add labels inside/outside hexagon
- [ ] Apply accent color and dark mode styles
- [ ] Test on multiple screen sizes (4.5", 5.5", 6.5")
- [ ] Verify color contrast (WCAG AA)
- [ ] Create Storybook story or snapshot tests

**Effort:** 8-10 hours
**Owner:** Frontend lead or UI specialist

---

## Milestone 2: Pokemon Detail Screen (Week 2-3)

### TASK-005: Build Pokemon Detail Screen Layout & Basic Data Display

**Objective:** Create the main Pokemon detail screen with header, info sections, abilities, and actions.

**Acceptance Criteria:**
- [ ] Screen renders with: back button, Pokemon name, dex number, type badges, height/weight
- [ ] Data loads from `usePokemonDetail` hook and displays correctly
- [ ] ScrollView works smoothly
- [ ] Loading state shows spinner
- [ ] Error state shows error message
- [ ] No jank or performance issues
- [ ] Layout responsive on multiple screen sizes
- [ ] Colors follow design system (dark mode, type-based accents)
- [ ] Typography follows design guidelines (hierarchy correct)
- [ ] All interactive elements have proper touch targets (≥44pt)

**Scope:** Main layout and data binding; excludes parallax, shiny toggle, moveset, forms
**Complexity:** M
**Dependencies:** TASK-003 (data hooks), design system colors finalized
**Files to Modify:**
- `app/(main)/(pokedex)/pokemon/[id].tsx` (main screen)
- May create sub-component if layout is complex

**Subtasks:**
- [ ] Create screen skeleton with back button and header
- [ ] Display Pokemon name, dex number, type badges
- [ ] Display height and weight
- [ ] Bind data from usePokemonDetail hook
- [ ] Create Abilities section (just display names)
- [ ] Add "Add to Team" and "View Type Matchups" buttons (non-functional for now)
- [ ] Test loading and error states
- [ ] Test on iOS simulator
- [ ] Test on Android emulator
- [ ] Performance profiling (no jank)

**Effort:** 6-8 hours
**Owner:** Frontend lead

---

### TASK-006: Implement Parallax Scrolling for Artwork

**Objective:** Add parallax effect to Pokemon artwork (scrolls at 0.5x velocity).

**Acceptance Criteria:**
- [ ] Artwork image moves at 0.5x scroll velocity as user scrolls
- [ ] Animation is smooth (60fps, no jank)
- [ ] Works correctly on both iOS and Android
- [ ] Image aspect ratio maintained
- [ ] Artwork is in correct container size (design-specified)
- [ ] Optional: Artwork fades as user scrolls past it
- [ ] Reanimated 2 used for implementation (already in stack)
- [ ] No performance degradation with parallax enabled

**Scope:** Parallax animation only; doesn't include shiny toggle (separate task)
**Complexity:** M
**Dependencies:** TASK-005 (Pokemon detail layout), Reanimated 2 verified working
**Files to Modify:**
- `app/(main)/(pokedex)/pokemon/[id].tsx`

**Subtasks:**
- [ ] Import Reanimated hooks (useSharedValue, useAnimatedStyle, useAnimatedScrollHandler)
- [ ] Set up ScrollView with animated scroll tracking
- [ ] Calculate parallax transform: `translateY = scrollOffset * -0.5`
- [ ] Apply transform to Animated.Image
- [ ] Test on iOS (parallax smooth at 60fps)
- [ ] Test on Android (parallax smooth at 60fps)
- [ ] Verify image doesn't jitter or flicker
- [ ] Optional: Add fade effect at bottom of artwork

**Effort:** 4-6 hours
**Owner:** Frontend lead (animation specialist)

---

### TASK-007: Implement Shiny Sprite Toggle with Cross-Fade

**Objective:** Add toggle to switch between normal and shiny sprite with smooth animation.

**Acceptance Criteria:**
- [ ] Button/toggle visible under artwork
- [ ] Tapping toggle switches sprite (normal ↔ shiny)
- [ ] Cross-fade animation plays (200ms)
- [ ] Both images pre-loaded on screen mount (no flicker)
- [ ] If shiny sprite unavailable, button is disabled (grayed out)
- [ ] Animation smooth at 60fps
- [ ] No performance impact
- [ ] Works on both iOS and Android
- [ ] Accessible: toggle has `accessibilityLabel` and `accessibilityState`

**Scope:** Shiny toggle UI and animation
**Complexity:** M
**Dependencies:** TASK-005 (Pokemon detail), TASK-006 optional (parallax)
**Files to Modify:**
- `app/(main)/(pokedex)/pokemon/[id].tsx`

**Subtasks:**
- [ ] Add state for `isShiny: boolean`
- [ ] Render two Image components (normal + shiny) with opacity control
- [ ] Pre-load both images on mount using Image.prefetch()
- [ ] Implement cross-fade toggle (200ms duration)
- [ ] Use Reanimated or React Native Animated for smooth transition
- [ ] Add button/toggle UI (radio or text toggle)
- [ ] Handle missing shiny sprite gracefully
- [ ] Test on iOS
- [ ] Test on Android
- [ ] Verify accessibility labels

**Effort:** 4-5 hours
**Owner:** Frontend lead

---

### TASK-008: Integrate Stat Chart Component into Pokemon Detail

**Objective:** Display stat chart in Pokemon detail screen using StatChart component.

**Acceptance Criteria:**
- [ ] StatChart component renders in detail screen
- [ ] Stats data loaded from Pokemon detail correctly
- [ ] Accent color matches Pokemon's primary type
- [ ] Chart displays all 6 stats (HP, Atk, Def, SpA, SpD, Spe)
- [ ] Labels show stat names and values (e.g., "HP 35")
- [ ] Chart responsive and centered
- [ ] No layout shifts or jank
- [ ] Dark mode colors correct
- [ ] Accessible: alt text describing stats for screen readers

**Scope:** Integration of StatChart; component tested separately in TASK-004
**Complexity:** S
**Dependencies:** TASK-004 (StatChart component), TASK-005 (Pokemon detail layout)
**Files to Modify:**
- `app/(main)/(pokedex)/pokemon/[id].tsx`

**Subtasks:**
- [ ] Import StatChart component
- [ ] Extract stats from Pokemon data
- [ ] Get accent color from type
- [ ] Render chart with correct props
- [ ] Verify chart layout in scrollable detail
- [ ] Test on both iOS and Android
- [ ] Add accessibility label

**Effort:** 2-3 hours
**Owner:** Frontend lead

---

### TASK-009: Build Moveset Section (Search & Sort)

**Objective:** Create searchable and sortable moveset section in Pokemon detail.

**Acceptance Criteria:**
- [ ] Moveset section displays all learnable moves for Pokemon
- [ ] Each move row shows: move name, type badge, category icon, power/accuracy/PP
- [ ] Search box filters moves by name (local, no backend call)
- [ ] Sort options: Name, Power, Accuracy, Category (buttons or dropdown)
- [ ] Search is debounced (300ms) to avoid jank
- [ ] Move rows are tappable (navigate to MoveDetail screen)
- [ ] Learn method displayed (Level Up, TM, Egg, etc.) — secondary info
- [ ] Learn level displayed if applicable (e.g., "Level 13")
- [ ] If moveset >100 moves, use FlashList (not FlatList) for performance
- [ ] Loading state shows spinner
- [ ] Empty state shows "No moves found" if search yields nothing

**Scope:** Moveset search/sort; doesn't include navigation to MoveDetail (separate task)
**Complexity:** M
**Dependencies:** TASK-005 (Pokemon detail), TASK-003 (data hooks)
**Files to Create/Modify:**
- `app/(main)/(pokedex)/pokemon/[id].tsx` (add moveset section)
- `src/hooks/ui/useDebounce.ts` (already exists; reuse)
- May create: `src/components/detail/MovesetSection.tsx` (extracted component if complex)

**Subtasks:**
- [ ] Extract moveset from Pokemon data
- [ ] Create search state (local)
- [ ] Implement debounce for search
- [ ] Create sort state
- [ ] Implement filter/sort logic
- [ ] Render moveset rows with correct layout
- [ ] Add type badges and category icons to move rows
- [ ] Display learn method and level
- [ ] Test search filtering
- [ ] Test sort options
- [ ] Test on devices with large movesets (100+ moves)
- [ ] Verify performance (no jank while scrolling)

**Effort:** 6-8 hours
**Owner:** Frontend lead

---

### TASK-010: Implement Moveset Row Navigation to MoveDetail

**Objective:** Make moveset rows tappable, navigating to move detail screen.

**Acceptance Criteria:**
- [ ] Tapping move row navigates to MoveDetail screen
- [ ] MoveDetail screen loads with correct move data
- [ ] Back button returns to Pokemon detail (at same scroll position)
- [ ] No data loss or state reset
- [ ] Accessible: move row has `accessibilityRole="button"`

**Scope:** Navigation integration; MoveDetail screen built separately (TASK-011)
**Complexity:** S
**Dependencies:** TASK-009 (moveset section), navigation architecture (TASK-001)
**Files to Modify:**
- `app/(main)/(pokedex)/pokemon/[id].tsx` (add onPress to move rows)

**Subtasks:**
- [ ] Extract move ID from move row
- [ ] Create navigation handler: `navigation.push('MoveDetail', { moveId })`
- [ ] Test navigation on iOS
- [ ] Test navigation on Android
- [ ] Test back button returns to Pokemon detail
- [ ] Verify scroll position handling

**Effort:** 2-3 hours
**Owner:** Frontend lead

---

### TASK-011: Build Move Detail Screen

**Objective:** Create move detail screen showing move name, type, category, stats, description, and Pokemon list.

**Acceptance Criteria:**
- [ ] Screen displays: move name, type badge, category icon
- [ ] Power, Accuracy, Priority clearly labeled
- [ ] PP (Power Points) displayed
- [ ] Full description/effect text shown
- [ ] List of Pokemon that learn this move below-the-fold (infinite scroll or paginated)
- [ ] Pokemon cards/rows are tappable (navigate to Pokemon detail)
- [ ] Back button works and returns to previous screen (Pokemon detail or Moves list)
- [ ] Loading and error states handled
- [ ] Dark mode colors correct
- [ ] No performance issues with large Pokemon lists (50+ Pokemon per move common)

**Scope:** Move detail screen only
**Complexity:** M
**Dependencies:** TASK-003 (useMoveDetail hook), navigation (TASK-001)
**Files to Create:**
- `app/(main)/(pokedex)/moves/[id].tsx` (or stack-based route)

**Subtasks:**
- [ ] Create screen skeleton with back button
- [ ] Display move name and stats
- [ ] Render type badge
- [ ] Render category icon
- [ ] Display power/accuracy/priority with labels
- [ ] Display PP
- [ ] Show full description
- [ ] Fetch and display Pokemon list
- [ ] Use FlashList for Pokemon list (optimize for large lists)
- [ ] Make Pokemon cards tappable
- [ ] Test navigation to Pokemon detail
- [ ] Test on iOS and Android

**Effort:** 5-7 hours
**Owner:** Frontend lead

---

### TASK-012: Add Form Variant Selector to Pokemon Detail

**Objective:** Allow users to switch between Pokemon forms (Alolan, Galarian, Mega, etc.).

**Acceptance Criteria:**
- [ ] Form selector appears only if Pokemon has alternate forms
- [ ] UI is clear (dropdown, picker, or carousel — design decision in SPEC)
- [ ] Selecting form updates screen with new form's data (dex #, types, stats, abilities, moveset)
- [ ] Route params update to reflect new form (for deep linking)
- [ ] Back button works correctly after form change
- [ ] Scroll position resets to top when form changes (UX expectation)
- [ ] Loading state shown during form switch
- [ ] All form data loads from database (no API calls)

**Scope:** Form selector UI and data refresh
**Complexity:** M
**Dependencies:** TASK-005 (Pokemon detail), TASK-003 (usePokemonDetail hook with form parameter)
**Files to Modify:**
- `app/(main)/(pokedex)/pokemon/[id].tsx`
- `src/hooks/queries/usePokemonDetail.ts` (ensure form parameter supported)

**Subtasks:**
- [ ] Query database for all forms of this Pokemon
- [ ] Create form selector UI (design mockup review needed)
- [ ] Implement form selection handler
- [ ] Update route params when form selected
- [ ] Re-fetch detail data with new form
- [ ] Ensure all sections update (types, abilities, stats, moveset)
- [ ] Test form switching on iOS
- [ ] Test form switching on Android
- [ ] Test with single-form Pokemon (selector hidden)
- [ ] Test with multi-form Pokemon (Rotom, Castform, etc.)

**Effort:** 4-6 hours
**Owner:** Frontend lead

---

### TASK-013: Add Gender Variant Toggle to Pokemon Detail (if applicable)

**Objective:** For Pokemon with cosmetic gender variants, add toggle to switch sprites.

**Acceptance Criteria:**
- [ ] Gender toggle appears only if Pokemon has gender sprite variants
- [ ] Tapping toggle switches male/female sprite
- [ ] Cross-fade animation similar to shiny toggle
- [ ] Both sprites pre-loaded (no flicker)
- [ ] Stats and moveset NOT affected by gender (cosmetic only)
- [ ] If gender variants not supported in data, toggle is hidden

**Scope:** Gender toggle UI and animation
**Complexity:** S
**Dependencies:** TASK-007 (shiny toggle pattern), data model confirms gender variants
**Files to Modify:**
- `app/(main)/(pokedex)/pokemon/[id].tsx`

**Subtasks:**
- [ ] Check if Pokemon has gender sprite variants
- [ ] Add gender state: `isMale: boolean`
- [ ] Render male/female sprite toggle
- [ ] Pre-load both sprites
- [ ] Implement cross-fade
- [ ] Test toggle animation
- [ ] Test with Pokemon that have gender variants (e.g., Pikachu)
- [ ] Test with Pokemon without gender variants (toggle hidden)

**Effort:** 2-3 hours
**Owner:** Frontend lead

---

## Milestone 3: Abilities, Items & Cross-Linking (Week 3-4)

### TASK-014: Build Ability Detail Screen

**Objective:** Create ability detail screen showing ability name, description, and Pokemon list.

**Acceptance Criteria:**
- [ ] Screen displays: ability name, description/effect
- [ ] List of Pokemon with this ability (scrollable, tappable)
- [ ] Optional: Filter by generation (UI dropdown or toggle buttons)
- [ ] Pokemon cards/rows tappable (navigate to Pokemon detail)
- [ ] Back button works
- [ ] Loading and error states handled
- [ ] Dark mode colors correct
- [ ] No performance issues with large Pokemon lists (100+ Pokemon common)
- [ ] Accessible: list items have proper roles and labels

**Scope:** Ability detail screen
**Complexity:** M
**Dependencies:** TASK-003 (useAbilityDetail hook), navigation (TASK-001)
**Files to Create:**
- `app/(main)/(pokedex)/abilities/[id].tsx`

**Subtasks:**
- [ ] Create screen skeleton
- [ ] Display ability name
- [ ] Display description
- [ ] Fetch and display Pokemon list
- [ ] Use FlashList for performance
- [ ] Make Pokemon tappable
- [ ] Implement optional generation filter
- [ ] Test filter interaction
- [ ] Test on iOS and Android

**Effort:** 5-7 hours
**Owner:** Frontend lead

---

### TASK-015: Build Item Detail Screen

**Objective:** Create item detail screen showing item name, category, and description.

**Acceptance Criteria:**
- [ ] Screen displays: item name, category icon, description
- [ ] Effect/usage details clearly explained
- [ ] Back button works
- [ ] Loading and error states handled
- [ ] Dark mode colors correct
- [ ] No layout issues or jank

**Scope:** Item detail screen (simpler than Move/Ability detail)
**Complexity:** S
**Dependencies:** TASK-003 (useItemDetail hook), navigation (TASK-001)
**Files to Create:**
- `app/(main)/(pokedex)/items/[id].tsx`

**Subtasks:**
- [ ] Create screen skeleton
- [ ] Display item name
- [ ] Display item category
- [ ] Display description/effect
- [ ] Test data loads correctly
- [ ] Test on iOS and Android

**Effort:** 2-3 hours
**Owner:** Frontend lead

---

### TASK-016: Implement Cross-Linking: Ability to Pokemon Detail

**Objective:** Make ability rows/cards in AbilityDetail screen tappable, navigating to Pokemon detail.

**Acceptance Criteria:**
- [ ] Tapping Pokemon card in ability detail → navigates to Pokemon detail
- [ ] Pokemon detail loads with correct data
- [ ] Back button returns to ability detail
- [ ] No data loss or state reset

**Scope:** Navigation integration
**Complexity:** S
**Dependencies:** TASK-014 (Ability detail), navigation (TASK-001)
**Files to Modify:**
- `app/(main)/(pokedex)/abilities/[id].tsx` (add onPress)

**Subtasks:**
- [ ] Add press handler to Pokemon cards
- [ ] Navigate to Pokemon detail with correct ID
- [ ] Test on iOS and Android

**Effort:** 1-2 hours
**Owner:** Frontend lead

---

### TASK-017: Implement Cross-Linking: Ability in Pokemon Detail to AbilityDetail

**Objective:** Make ability names/cards in Pokemon detail tappable, navigating to AbilityDetail.

**Acceptance Criteria:**
- [ ] Tapping ability in Pokemon detail → navigates to AbilityDetail screen
- [ ] Ability detail loads with correct data
- [ ] Back button returns to Pokemon detail (same scroll position if possible)

**Scope:** Navigation integration
**Complexity:** S
**Dependencies:** TASK-005 (Pokemon detail), TASK-014 (Ability detail)
**Files to Modify:**
- `app/(main)/(pokedex)/pokemon/[id].tsx` (add onPress to ability rows)

**Subtasks:**
- [ ] Add press handler to ability rows
- [ ] Navigate to AbilityDetail with ability ID
- [ ] Test on iOS and Android

**Effort:** 1-2 hours
**Owner:** Frontend lead

---

### TASK-018: Connect Item Detail from Move/Ability Detail (Future)

**Objective:** If moves/abilities hold items, make item references tappable (MVP may defer this).

**Acceptance Criteria (If In Scope):**
- [ ] Items referenced in move/ability descriptions are tappable
- [ ] Navigation to Item detail works
- [ ] Back button returns to origin screen

**Note:** This task may be deferred to Phase 1.2 if scope limited. Confirm with product.

**Scope:** Optional; depends on product decision
**Complexity:** S
**Dependencies:** TASK-011 (Move detail), TASK-014 (Ability detail), TASK-015 (Item detail)

**Effort:** 2-3 hours (if in scope)
**Owner:** Frontend lead

---

## Milestone 4: Scroll Position & Navigation Polish (Week 4)

### TASK-019: Implement Scroll Position Restoration on Back Navigation

**Objective:** When user taps back from detail screen, list screen restores previous scroll position.

**Acceptance Criteria:**
- [ ] Before navigating to detail, list screen scroll position is saved (index + offset)
- [ ] On return from detail, list auto-scrolls to previous position
- [ ] Works on both iOS and Android
- [ ] No jank or visual stuttering during scroll restoration
- [ ] Works with FlashList's scrollToIndex() method
- [ ] State persists across navigation but clears on app foreground/background cycle (optional)

**Scope:** Scroll position restoration
**Complexity:** M
**Dependencies:** Navigation setup (TASK-001), all list screens (already complete)
**Files to Create/Modify:**
- `src/hooks/ui/useScrollPositionRestore.ts` (custom hook)
- `app/(main)/(pokedex)/index.tsx` (Pokemon list integration)
- `app/(main)/(pokedex)/moves.tsx` (Moves list integration)
- `app/(main)/(pokedex)/abilities.tsx` (Abilities list integration)
- `app/(main)/(pokedex)/items.tsx` (Items list integration)

**Subtasks:**
- [ ] Create custom hook to manage scroll position state
- [ ] Store position when navigating away (`useFocusEffect`)
- [ ] Restore position when returning (`useFocusEffect`)
- [ ] Test with Pokemon list
- [ ] Test with Moves list
- [ ] Test with Abilities list
- [ ] Test with Items list
- [ ] Verify no jank on scroll restoration
- [ ] Test edge cases (list data changed, item removed, etc.)

**Effort:** 4-6 hours
**Owner:** Frontend lead

---

### TASK-020: Test Navigation Stack Stability

**Objective:** Verify navigation stack doesn't leak memory or lose state across multiple navigations.

**Acceptance Criteria:**
- [ ] Navigate between list screens, detail screens, back — multiple cycles (50+ cycles)
- [ ] No memory leaks detected (use React Native Debugger/Flipper profiler)
- [ ] No stale data displayed
- [ ] Back button works reliably every time
- [ ] App doesn't crash or hang

**Scope:** Testing and debugging
**Complexity:** M (depends on findings)
**Dependencies:** All previous tasks (complete detail screens + navigation)
**Testing:**
- [ ] Automated stress test (if possible; may be manual)
- [ ] Memory profiling with Flipper
- [ ] Crash logs reviewed
- [ ] Performance monitor checked for warnings

**Effort:** 3-4 hours
**Owner:** QA / Frontend lead

---

## Milestone 5: Accessibility & Polish (Week 4-5)

### TASK-021: Implement Accessibility Labels & Roles

**Objective:** Add VoiceOver/TalkBack support to all detail screens with proper labels and roles.

**Acceptance Criteria:**
- [ ] All tappable elements have `accessibilityRole="button"` or semantic equivalent
- [ ] All interactive elements have `accessibilityLabel` describing action
- [ ] Images have descriptive alt text (e.g., "Pikachu official artwork")
- [ ] Stat chart has alt text describing stats (not visual only)
- [ ] Move rows have labels (e.g., "Thunderbolt, Electric type, Physical, Power 90")
- [ ] Ability rows have labels
- [ ] Back button labeled "Go back"
- [ ] Search inputs have `accessibilityLabel`
- [ ] Sort controls have `accessibilityLabel`
- [ ] All labels are concise and clear (no redundancy with read-aloud role)
- [ ] Tested with VoiceOver on iOS
- [ ] Tested with TalkBack on Android

**Scope:** Accessibility improvements
**Complexity:** M
**Dependencies:** All detail screens complete (TASK-005, TASK-011, TASK-014, TASK-015)
**Files to Modify:**
- All detail screen components
- StatChart component
- Move/Ability row components

**Subtasks:**
- [ ] Add accessibility labels to Pokemon detail
- [ ] Add accessibility labels to Move detail
- [ ] Add accessibility labels to Ability detail
- [ ] Add accessibility labels to Item detail
- [ ] Test with VoiceOver (iOS)
- [ ] Test with TalkBack (Android)
- [ ] Verify all labels are correct and clear
- [ ] Verify tab order is logical

**Effort:** 4-5 hours
**Owner:** Frontend/Accessibility specialist

---

### TASK-022: Color Contrast Verification

**Objective:** Verify all text colors meet WCAG AA contrast ratios (4.5:1 minimum).

**Acceptance Criteria:**
- [ ] All text on backgrounds meets 4.5:1 contrast ratio
- [ ] Type-based accent colors verified against white text
- [ ] Secondary text color (#999999) verified against background (#0F0F0F)
- [ ] All interactive elements have sufficient contrast
- [ ] Tested with contrast checker tool (e.g., WCAG Contrast Checker)
- [ ] No violations found; all pass AA

**Scope:** Design system compliance testing
**Complexity:** S
**Dependencies:** Design system finalized (already done)
**Testing:**
- [ ] Use online contrast checker for each color pair
- [ ] Document results in accessibility audit

**Effort:** 2-3 hours
**Owner:** QA / Design lead

---

### TASK-023: Keyboard Navigation Testing

**Objective:** Verify all detail screens are keyboard-navigable (tab through elements).

**Acceptance Criteria:**
- [ ] All interactive elements reachable via Tab key
- [ ] Tab order is logical and predictable
- [ ] Back button is first or easily accessible
- [ ] Scrollable content accessible via keyboard
- [ ] Works on both iOS and Android (simulated keyboard)

**Scope:** Keyboard accessibility testing
**Complexity:** S
**Dependencies:** All detail screens
**Testing:**
- [ ] Manual testing with keyboard (iOS VoiceOver keyboard, Android Bluetooth keyboard)
- [ ] Verify tab order on each screen
- [ ] Test Enter/Space to activate buttons

**Effort:** 2-3 hours
**Owner:** QA

---

### TASK-024: Performance & Memory Profiling

**Objective:** Profile detail screens for memory leaks, slow renders, and jank.

**Acceptance Criteria:**
- [ ] Detail page loads in <200ms (REQ-057)
- [ ] No memory leaks detected over 100 navigations
- [ ] No jank during parallax scrolling (60fps maintained)
- [ ] Stat chart renders smooth
- [ ] Move lists >100 items scroll smoothly
- [ ] Memory footprint <50MB increase for detail screen
- [ ] All performance targets from REQUIREMENTS met

**Scope:** Performance testing and optimization
**Complexity:** M (depends on findings)
**Dependencies:** All detail screens
**Tools:**
- React Native Debugger / Flipper profiler
- Performance monitor (built-in)
- Chrome DevTools (if applicable)

**Subtasks:**
- [ ] Profile Pokemon detail load time
- [ ] Profile Move detail load time
- [ ] Profile memory over 100 navigations
- [ ] Check for memory leaks (garbage collection)
- [ ] Profile parallax scrolling FPS
- [ ] Profile move list scrolling with 100+ items
- [ ] Optimize if needed (memoization, query optimization, etc.)
- [ ] Document findings

**Effort:** 5-6 hours
**Owner:** Backend/Performance lead

---

## Milestone 6: Testing & QA (Week 5)

### TASK-025: Unit Tests for Detail Data Hooks

**Objective:** Write unit tests for all detail data hooks (usePokemonDetail, useMoveDetail, etc.).

**Acceptance Criteria:**
- [ ] Tests for usePokemonDetail: loads data, handles errors, caches results
- [ ] Tests for useMoveDetail: loads move data, fetches Pokemon list
- [ ] Tests for useAbilityDetail: loads ability data, fetches Pokemon list
- [ ] Tests for useItemDetail: loads item data
- [ ] Tests for stat chart math: normalization, hex point calculation
- [ ] All tests pass (100% pass rate)
- [ ] Coverage: >80% for data layer

**Scope:** Unit testing
**Complexity:** M
**Dependencies:** Data hooks (TASK-003)
**Files to Create:**
- `src/hooks/queries/__tests__/usePokemonDetail.test.ts`
- `src/hooks/queries/__tests__/useMoveDetail.test.ts`
- `src/hooks/queries/__tests__/useAbilityDetail.test.ts`
- `src/hooks/queries/__tests__/useItemDetail.test.ts`
- `src/utils/__tests__/statChartMath.test.ts`

**Subtasks:**
- [ ] Mock SQLite responses for each hook
- [ ] Test successful data load
- [ ] Test error handling
- [ ] Test caching behavior
- [ ] Write 3-5 tests per hook
- [ ] Verify all tests pass
- [ ] Measure coverage
- [ ] Document test patterns for future developers

**Effort:** 6-8 hours
**Owner:** Backend / QA lead

---

### TASK-026: Component Tests for Detail Screens

**Objective:** Write component tests for Pokemon, Move, Ability, Item detail screens.

**Acceptance Criteria:**
- [ ] Tests render each screen correctly with mock data
- [ ] Tests verify data display (name, type, stats, etc.)
- [ ] Tests verify navigation (back button, tappable elements)
- [ ] Tests verify loading/error states
- [ ] All tests pass (100% pass rate)
- [ ] Coverage: >70% for UI layer

**Scope:** Component testing
**Complexity:** M
**Dependencies:** All detail screens (TASK-005, TASK-011, TASK-014, TASK-015)
**Files to Create:**
- `app/(main)/(pokedex)/pokemon/__tests__/[id].test.tsx`
- `app/(main)/(pokedex)/moves/__tests__/[id].test.tsx`
- `app/(main)/(pokedex)/abilities/__tests__/[id].test.tsx`
- `app/(main)/(pokedex)/items/__tests__/[id].test.tsx`

**Subtasks:**
- [ ] Create render tests for each screen
- [ ] Test data binding and display
- [ ] Test loading state
- [ ] Test error state
- [ ] Test navigation handlers
- [ ] Verify all tests pass
- [ ] Measure coverage

**Effort:** 6-8 hours
**Owner:** QA lead

---

### TASK-027: Integration Tests (Navigation Flow)

**Objective:** Write integration tests for full navigation flows (list → detail → back).

**Acceptance Criteria:**
- [ ] Test: Pokemon List → Pokemon Detail → back to list
- [ ] Test: Pokemon Detail → Move Detail → back to Pokemon → back to list
- [ ] Test: Pokemon Detail → Ability Detail → Pokemon Detail → back to list
- [ ] Test: Moves List → Move Detail → Pokemon Detail → back to Move → back to list
- [ ] Test: form switching in Pokemon Detail
- [ ] Test: shiny toggle, ability toggle
- [ ] All tests pass
- [ ] Navigation state correct at each step

**Scope:** Integration testing
**Complexity:** M
**Dependencies:** All navigation and screens complete
**Tools:**
- Jest + React Native Testing Library (or Detox for e2e)

**Subtasks:**
- [ ] Design test scenarios
- [ ] Write Pokemon list → detail → back test
- [ ] Write cross-link navigation tests
- [ ] Write form switching test
- [ ] Write toggle tests
- [ ] Run full test suite
- [ ] Verify all pass

**Effort:** 6-8 hours
**Owner:** QA lead

---

### TASK-028: Manual QA Testing (iOS + Android)

**Objective:** Comprehensive manual testing on real devices (iPhone 12+, Pixel 4a+).

**Acceptance Criteria:**
- [ ] All screens render correctly on iOS
- [ ] All screens render correctly on Android
- [ ] Navigation works smoothly on iOS
- [ ] Navigation works smoothly on Android
- [ ] Parallax scrolling smooth at 60fps (both platforms)
- [ ] Shiny toggle cross-fade smooth (both platforms)
- [ ] Search/sort in movesets responsive
- [ ] No crashes or hangs observed
- [ ] All edge cases tested (missing data, network errors, etc.)
- [ ] QA sign-off: ✅ Ready for production

**Scope:** Manual testing
**Complexity:** M
**Testing Duration:** Full day on each platform
**Devices:**
- iOS: iPhone 12 (or equivalent, iOS 13+)
- Android: Pixel 4a (or equivalent, Android 8.0+)

**Subtasks:**
- [ ] Set up test environment on iOS device
- [ ] Set up test environment on Android device
- [ ] Create comprehensive test checklist
- [ ] Test all features on iOS (checklist)
- [ ] Test all features on Android (checklist)
- [ ] Test edge cases and error scenarios
- [ ] Log any bugs or issues
- [ ] Verify all bugs fixed before QA sign-off

**Effort:** 8-10 hours (1-1.5 days)
**Owner:** QA team

---

### TASK-029: Bug Fixes & Final Polish

**Objective:** Address any bugs or issues found during testing and finalize detail views.

**Acceptance Criteria:**
- [ ] All QA-reported bugs fixed
- [ ] No new crashes introduced
- [ ] Performance targets met
- [ ] All tests passing (unit, component, integration)
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] Ready for merge to main

**Scope:** Bug fixing and finalization
**Complexity:** Varies
**Dependencies:** QA testing (TASK-028)

**Subtasks:**
- [ ] Create bug tickets from QA findings
- [ ] Prioritize bugs (critical, high, medium)
- [ ] Fix critical/high bugs first
- [ ] Re-test fixes
- [ ] Peer code review
- [ ] Update docs if needed
- [ ] Final QA sign-off

**Effort:** 4-8 hours (depends on bug count)
**Owner:** Frontend/Backend leads

---

## Milestone 7: Documentation & Handoff (Week 5-6)

### TASK-030: Update Architecture Documentation

**Objective:** Document detail views architecture and patterns in codebase.

**Acceptance Criteria:**
- [ ] Create/update `docs/DETAIL_VIEWS_ARCHITECTURE.md` (similar to LIST_SCREENS_ARCHITECTURE.md)
- [ ] Document new navigation structure
- [ ] Document data flow (SQLite → hooks → screens)
- [ ] Document component hierarchy
- [ ] Document reusable patterns (StatChart, detail screen template)
- [ ] Include code examples for future developers
- [ ] All patterns locked in and ready for reference

**Scope:** Documentation
**Complexity:** S
**Files to Create:**
- `docs/DETAIL_VIEWS_ARCHITECTURE.md`

**Subtasks:**
- [ ] Write navigation architecture section
- [ ] Document data hooks and caching strategy
- [ ] Document StatChart math and usage
- [ ] Create component hierarchy diagram
- [ ] Write code examples
- [ ] Add troubleshooting section
- [ ] Peer review documentation

**Effort:** 3-4 hours
**Owner:** Frontend lead

---

### TASK-031: Create Reusable Detail Screen Template

**Objective:** Document and package a template for creating detail screens (for future entities).

**Acceptance Criteria:**
- [ ] Template code created: `src/templates/DetailScreenTemplate.tsx`
- [ ] Template includes: navigation setup, data loading, layout structure
- [ ] Instructions document: how to create new detail screen from template
- [ ] Team trained on using template
- [ ] Template tested with creating a sample detail screen

**Scope:** Template & documentation
**Complexity:** S
**Files to Create:**
- `src/templates/DetailScreenTemplate.tsx`
- `docs/HOW_TO_CREATE_DETAIL_SCREEN.md`

**Subtasks:**
- [ ] Create template component
- [ ] Add comments with usage instructions
- [ ] Write guide document
- [ ] Test creating sample detail screen from template
- [ ] Team walkthrough

**Effort:** 2-3 hours
**Owner:** Frontend lead

---

### TASK-032: Update Main README & Docs Index

**Objective:** Update README and docs index to reflect detail views phase completion.

**Acceptance Criteria:**
- [ ] README updated with feature list (detail views ✅)
- [ ] Docs index includes DETAIL_VIEWS_SPEC.md and DETAIL_VIEWS_ARCHITECTURE.md
- [ ] Architecture diagram updated if needed
- [ ] Progress tracker updated (Phase 1.1 complete)

**Scope:** Documentation housekeeping
**Complexity:** S
**Files to Modify:**
- `README.md`
- `docs/` index or main page

**Effort:** 1-2 hours
**Owner:** Frontend lead / Tech writer

---

## Task Summary by Complexity

### Small (S) - 2-3 hours each
- TASK-010, TASK-016, TASK-017, TASK-018, TASK-022, TASK-023, TASK-031, TASK-032

### Medium (M) - 4-8 hours each
- TASK-001, TASK-002, TASK-003, TASK-005, TASK-006, TASK-007, TASK-008, TASK-009, TASK-012, TASK-013, TASK-014, TASK-019, TASK-020, TASK-021, TASK-024, TASK-025, TASK-026, TASK-027, TASK-028, TASK-029, TASK-030

### Large (L) - 8-10 hours
- TASK-004, TASK-011, TASK-015

---

## Total Effort Estimate

| Role | Estimated Hours | Weeks (40h/week) |
|------|-----------------|------------------|
| Frontend Lead | 100-120 | 2.5-3 |
| Backend/DB Lead | 30-40 | 0.75-1 |
| QA Lead | 40-50 | 1-1.25 |
| UI/Accessibility Specialist | 10-15 | 0.25-0.4 |
| **Team Total** | **180-225** | **4.5-5.6 weeks** |

**Assumption:** 2-person team (frontend + backend/QA hybrid)

---

## Critical Path

Tasks that block others (must be done first):
1. TASK-001: Navigation setup (blocks all others)
2. TASK-003: Data hooks (blocks screens)
3. TASK-004: Stat chart component (blocks Pokemon detail)
4. TASK-005: Pokemon detail layout (blocks parallax, shiny, moveset)

These should be prioritized to unblock parallel work.

---

## Dependencies & Prerequisites

Before starting implementation:
- [ ] SQLite schema finalized and populated with PokeAPI data
- [ ] All list screens stable and tested (COMPLETE)
- [ ] React Navigation setup confirmed working
- [ ] Reanimated 2 tested on both iOS and Android
- [ ] Design mockups approved by product/design team
- [ ] Database queries validated and optimized
- [ ] i18n system ready for translation keys

---

## Success Criteria (Phase Complete)

- [ ] All 4 detail screens functional (Pokemon, Move, Ability, Item)
- [ ] Parallax scrolling smooth at 60fps (both platforms)
- [ ] Cross-linking between screens works (tappable abilities, moves, Pokemon)
- [ ] Back navigation and scroll position restoration working
- [ ] All tests passing (unit, component, integration)
- [ ] Manual QA sign-off on iOS and Android
- [ ] No critical bugs
- [ ] Performance targets met (REQ-057: <200ms detail load, 60fps scrolling)
- [ ] Accessibility compliant (WCAG AA)
- [ ] Documentation complete and team trained

---

## Rollback Plan

If issues arise:
- [ ] Navigation issues: Revert to simpler tab-only structure (no stack)
- [ ] Performance issues: Reduce detail data load (move movepool to separate screen)
- [ ] Parallax jank: Disable parallax, show static header
- [ ] Memory leaks: Investigate hook cleanup and navigation stack

---

**Document Status:** Ready for development kickoff.
**Next Step:** Schedule task refinement meeting with team; assign owners; set start date.
