# Visual Language Redesign: Implementation Roadmap

**Owner:** Implementation team  
**Deliverable:** docs/VISUAL_LANGUAGE_REDESIGN.md (complete spec)  
**Estimate:** 8 days (can parallelize to 5-6 with multiple engineers)  
**Risk Level:** Medium (visual/animation work; low risk for regressions if isolated to detail screen)

---

## Phase 1: Ambient Background (Day 1)
**Scope:** Type-tinted gradient background for entire detail screen  
**Impact:** High visual impact, zero functional risk

### Tasks
- [ ] Add `getAmbientBackground()` function to `app/(main)/(pokedex)/[id].tsx`
- [ ] Add `ambientRgba()` hex-to-rgba converter
- [ ] Wrap ScrollView in `LinearGradient` with type-tinted colors
- [ ] Test on Fire, Water, Electric, Ghost, Normal types (5 test cases)
- [ ] Verify gradient is visible but not overwhelming (opacity correct per spec)

### Code Location
- File: `app/(main)/(pokedex)/[id].tsx`
- Reference: VISUAL_LANGUAGE_REDESIGN.md Part 1 + Part 12 (Ambient Background code snippet)

### Acceptance Criteria
- [ ] Fire-type Pokémon (Charizard) shows warm orange tint
- [ ] Water-type (Blastoise) shows cool blue tint
- [ ] Opacity not so strong it washes out text (all text remains readable)
- [ ] No gradient jank on scroll
- [ ] Works on iOS and Android

---

## Phase 2: Hero Enhancement (Day 1)
**Scope:** Parallax fade gradient, artwork shadow, shiny toggle relocation  
**Impact:** Immersive feel, smoother hero-to-content transition

### Tasks
- [ ] Add bottom fade gradient to PokemonHero (80px gradient from transparent to solid)
- [ ] Increase artwork shadow depth (8pt down, 24pt blur, 0.5 opacity)
- [ ] Move ShinyToggle outside hero (render below as separate section)
- [ ] Update PokemonHero prop `showShinyToggle={false}` for detail screen usage
- [ ] Test parallax still works smoothly (0.25× and 0.5× velocities)

### Code Locations
- File 1: `src/components/pokemon/PokemonHero.tsx` (add fade gradient, enhance shadow, add showShinyToggle prop)
- File 2: `app/(main)/(pokedex)/[id].tsx` (render shiny toggle separately, add styles)
- Reference: VISUAL_LANGUAGE_REDESIGN.md Part 2 (Hero Section + Part 12 for exact implementation)

### Acceptance Criteria
- [ ] Hero bottom is no longer a hard cutoff; fades smoothly to background
- [ ] Artwork appears to float above page (shadow is visible)
- [ ] Shiny toggle is visible below hero, not overlapped
- [ ] Hero collapse animation still smooth (340px → 100px)
- [ ] No layout shift when toggle moves

---

## Phase 3: Section Flow — Remove Borders (Days 2-3)
**Scope:** Replace all bordered card wrappers with subtle dividers  
**Impact:** Visual continuity, sections feel connected

### Files to Update
1. `app/(main)/(pokedex)/[id].tsx`
   - [ ] Remove `section` StyleSheet (bordered cards)
   - [ ] Update all `<View style={styles.section}>` to use `fluidSection` style
   - [ ] Add subtle divider instead of border

2. `src/components/pokemon/AbilitiesSection.tsx` (if exists, or inline in [id].tsx)
   - [ ] Replace `abilityRow` bordered cards with `abilityItem` (divider-based rows)
   - [ ] Add chevron indicator (›) for navigability
   - [ ] Test Hidden ability badge styling

3. `src/components/pokemon/FlavorTextSection.tsx`
   - [ ] Replace `textCard` bordered container with `flavorTextContainer` (subtle background tint + left border)
   - [ ] Keep pill-tab chips for version selector

4. Move rows (in [id].tsx Moveset section)
   - [ ] Replace `moveRow` bordered cards with divider-based rows
   - [ ] Maintain type badge and move metadata

5. Update section headers
   - [ ] Add letterSpacing (iOS), reduce opacity slightly (0.95)
   - [ ] Ensure headers feel like narrative introductions, not table headers

### StyleSheet Pattern (All Sections)
```typescript
// OLD (bordered card):
section: {
  paddingHorizontal: spacing.lg,
  marginBottom: spacing.lg,
  backgroundColor: colors.surface,
  borderRadius: borderRadius.lg,
  borderWidth: 1,
  borderColor: colors.border,
  padding: spacing.lg,
}

// NEW (divider-based):
fluidSection: {
  paddingHorizontal: spacing.lg,
  paddingVertical: spacing.lg,
  borderBottomWidth: 1,
  borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  gap: spacing.md,
}
```

### Acceptance Criteria
- [ ] No section has a visible bordered card
- [ ] All sections separated by subtle 1px divider (0.04 opacity)
- [ ] Section headers visible and readable
- [ ] Text sections (Abilities, Flavor, Moves) flow naturally
- [ ] No layout shifts or spacing inconsistencies
- [ ] Interactive elements (ability rows, move rows) still feel tappable

---

## Phase 4: Stat Bars & Type Squares with Animations (Day 1)
**Scope:** Gradient fills, glow effects, entrance animations, press feedback  
**Impact:** Vibrant, tactile feel; "alive" page

### Task 4A: Stat Bar Gradient + Glow
**File:** `src/components/pokemon/StatChart.tsx`

- [ ] Add `adjustBrightness()` utility function
- [ ] Update `barFill` to render LinearGradient (type color → darker)
- [ ] Add `barGlowOverlay` (6px height, white 0.15 opacity at top)
- [ ] Test gradient renders correctly on all bar widths
- [ ] Verify glow is subtle, not distracting

### Task 4B: Stat Bar Entrance Animation
**File:** `src/components/pokemon/StatChart.tsx`

- [ ] Add fade-in animation to bars (opacity 0 → 1)
- [ ] Add scale-up animation (scaleY 0.8 → 1)
- [ ] Timing: 200ms total, stagger 50ms per bar
- [ ] Easing: Easing.out(Easing.cubic)

### Task 4C: Type Effectiveness Squares Glow & Press
**File:** `src/components/pokemon/TypeEffectivenessTable.tsx`

- [ ] Add LinearGradient glow overlay to each type square (type color at 20% opacity)
- [ ] Add press animation handler (handlePressIn, handlePressOut)
- [ ] Press animation: scale 1 → 0.95, opacity 1 → 0.9, duration 100ms
- [ ] Add inner shadow for depth (shadowOpacity 0.3)
- [ ] Test on all 18 types

### Task 4D: Type Tab Transition Animation
**File:** `src/components/pokemon/TypeEffectivenessTable.tsx`

- [ ] Add state for tab transition animation
- [ ] Fade out current grid: 150ms opacity 1 → 0
- [ ] Slide out: 150ms translateX (direction based on tab index)
- [ ] At 150ms mark, update activeTabIndex
- [ ] Slide in: 0ms instant, then 150ms animate slideX to 0
- [ ] Fade in: 150ms opacity 0 → 1
- [ ] Result: Smooth tab transition (0.3s total)

### Code Reference
VISUAL_LANGUAGE_REDESIGN.md Part 4 (Stat Bars) + Part 5 (Type Squares) + Part 12 (code snippets)

### Acceptance Criteria
- [ ] Stat bars have visible gradient fill (lighter at left, darker at right)
- [ ] Glow overlay visible as subtle highlight on bar top
- [ ] Bars fade in + scale up together when section scrolls into view
- [ ] Type squares have inner glow effect
- [ ] Type squares scale down + fade on press
- [ ] Type tab transitions are smooth (fade + slide)
- [ ] No jank during transitions
- [ ] 60fps on iOS and Android

---

## Phase 5: Evolution Chain Organic Connectors (Day 1)
**Scope:** Curved gradient connector lines, floating disc backgrounds  
**Impact:** Organic, flowing connection between evolutions

### Task 5A: Curved Connector Lines
**File:** `src/components/pokemon/EvolutionChain.tsx`

- [ ] Replace `EvolutionArrow` with curved gradient connectors
- [ ] Option 1 (preferred): Use SVG with quadratic path + gradient
- [ ] Option 2 (fallback): Use View with arrowLine divider
- [ ] Condition label positioned below/in line with arrow
- [ ] Test on linear chains (Bulbasaur → Ivysaur → Venusaur)

### Task 5B: Floating Disc Background
**File:** `src/components/pokemon/EvolutionChain.tsx`

- [ ] Add floating disc (rounded background) behind each evolution card
- [ ] Disc: 100×100px, borderRadius 50%, backgroundColor 'rgba(255, 255, 255, 0.05)', positioned behind artwork
- [ ] Test on all chain types (linear, branching Eevee, conditional Pancham)

### Code Reference
VISUAL_LANGUAGE_REDESIGN.md Part 6 (Evolution Chain)

### Acceptance Criteria
- [ ] Connector lines are curved, not straight arrows
- [ ] Condition labels readable and well-positioned
- [ ] Evolution cards have visible floating disc background
- [ ] Layout doesn't break on small screens (320px)
- [ ] Branching (Eevee) renders correctly with multiple vertical sub-chains
- [ ] Linear chains render left-to-right with proper spacing

---

## Phase 6: Scroll Entrance Animations (Day 1)
**Scope:** Sections fade in + translate up as they scroll into view  
**Impact:** Dynamic, responsive page; sections reveal progressively

### Task 6A: Create useScrollIntoView Hook
**File:** `hooks/useScrollIntoView.ts` (NEW)

- [ ] Accept scrollOffset (Animated.SharedValue), triggerPoint, duration
- [ ] Return useAnimatedStyle with opacity + translateY
- [ ] Opacity: 0 → 1 over duration
- [ ] TranslateY: 40px → 0px (slide up)
- [ ] Extrapolate.CLAMP to prevent over-animation

### Task 6B: Apply to Major Sections
**File:** `app/(main)/(pokedex)/[id].tsx`

Sections to animate:
- [ ] StatChart (trigger: ~300px)
- [ ] TypeEffectivenessTable (trigger: ~500px)
- [ ] Abilities (trigger: ~700px)
- [ ] EvolutionChain (trigger: ~900px)
- [ ] RelatedForms (trigger: ~1100px)
- [ ] FlavorTextSection (trigger: ~1300px)
- [ ] EncounterLocationsSection (trigger: ~1500px)
- [ ] Moveset (trigger: ~1700px)

### Implementation Pattern
```typescript
const sectionAnimStyle = useScrollIntoView({
  scrollOffset,
  triggerPoint: 300,
  duration: 200,
});

<Animated.View style={sectionAnimStyle}>
  <StatChart ... />
</Animated.View>
```

### Code Reference
VISUAL_LANGUAGE_REDESIGN.md Part 8.2 (Scroll Entrance Animations)

### Acceptance Criteria
- [ ] All major sections fade in as they scroll into view
- [ ] Entrance animation duration 200-300ms (smooth, not jarring)
- [ ] No animation jank or frame drops
- [ ] Trigger points properly calibrated (sections appear at expected scroll depth)
- [ ] Animation doesn't replay on scroll back up (Extrapolate.CLAMP prevents this)
- [ ] 60fps on iOS and Android

---

## Phase 7: Polish & QA (Days 1-2)
**Scope:** Performance verification, regression testing, final polish  
**Impact:** Production-ready implementation

### Task 7A: Performance Verification
- [ ] Profile detail screen on iOS (iPhone 14+) at 60fps
- [ ] Profile detail screen on Android (Pixel 7+) at 60fps
- [ ] Measure scroll performance with all animations active
- [ ] Profile memory usage (Reanimated worklet threads)
- [ ] Check for animation jank during parallax + entrance reveals + tab transitions

### Task 7B: Regression Testing
- [ ] **List screens:** Verify no changes to Pokémon list, move list, ability list, location list
- [ ] **Detail screen on other Pokémon types:** Fire, Water, Electric, Grass, Psychic, Dragon, Ghost, Dark (test all ambient colors)
- [ ] **Edge cases:** 
  - Eevee (8 evolutions, branching)
  - Rotom (5 forms)
  - Mew (no evolution)
  - Wailord (large sprite)
  - Tiny Pokémon (Joltik)
- [ ] **Screen sizes:** 320px (iPhone SE), 375px (iPhone 8), 430px (iPhone 14 Pro Max), tablet if applicable

### Task 7C: Visual Verification
- [ ] Ambient color visible for all types (Fire, Water, Electric, Grass, Ice, Fighting, Poison, Ground, Flying, Psychic, Bug, Rock, Ghost, Dragon, Dark, Steel, Fairy, Normal)
- [ ] Hero parallax smooth (backdrop slower than artwork)
- [ ] Hero bottom fade gradient looks natural
- [ ] Stat bars have gradient + glow (not flat)
- [ ] Stat bars entrance animation is smooth
- [ ] Type squares glow + press feedback works
- [ ] Type tab transitions smooth
- [ ] Evolution chain connectors are curved and organic
- [ ] Evolution cards have floating discs
- [ ] Section flow feels natural (no hard borders)
- [ ] Entrance animations on all sections
- [ ] No text overflow or layout shifts

### Task 7D: Director Review
- [ ] Share detail screen screen recording (15-20 seconds: hero collapse, stat bars entrance, type tab switch, scroll to bottom)
- [ ] Director confirms: "Page feels alive, not static"
- [ ] Director confirms: "Visual flow between sections"
- [ ] Director confirms: "No more blocky cards"
- [ ] Gather feedback, make minor adjustments

### Acceptance Criteria
- [ ] All animations smooth at 60fps
- [ ] No regressions on other screens
- [ ] All 18 type colors have appropriate ambient backgrounds
- [ ] Director approval on visual language

---

## Parallel Work Opportunities (Compress Timeline)

If you have 2+ engineers:

**Track 1 (Engineer A):**
- Phase 1: Ambient background
- Phase 2: Hero enhancement
- Phase 3: Section flow (remove borders)

**Track 2 (Engineer B):**
- Phase 4A: Stat bar gradient + glow
- Phase 4B: Stat bar entrance animation
- Phase 4C: Type square glow + press

**Track 3 (Engineer C):**
- Phase 4D: Type tab transition
- Phase 5: Evolution chain connectors + floating discs

**Track 4 (Engineer D):**
- Phase 6: useScrollIntoView hook + apply to all sections
- Phase 7: QA + performance profiling

**Compressed Timeline:** 5-6 days with parallel work

---

## Testing Checklist

### Visual Spot Checks
- [ ] Ambient background visible for Fire, Water, Electric, Grass, Psychic, Ghost, Normal
- [ ] Hero parallax works (backdrop moves slower than artwork)
- [ ] Hero fade gradient smooth
- [ ] Stat bars have gradient fill + glow
- [ ] Type squares glow and respond to press
- [ ] Evolution chain connectors curved
- [ ] All sections have subtle dividers, no bordered cards
- [ ] Section headers don't look like table headers
- [ ] Entrance animations fade + translate smoothly

### Performance Checks
- [ ] 60fps scroll on iOS (iPhone 14+)
- [ ] 60fps scroll on Android (Pixel 7+)
- [ ] No memory leaks (Reanimated worklet cleanup)
- [ ] Parallax doesn't cause frame drops

### Regression Checks
- [ ] List screens unchanged
- [ ] Other detail screens (if any) still work
- [ ] Edge case Pokémon (Eevee, Rotom, Mew) render correctly
- [ ] No text overflow on 320px screens

### Director Feedback Checks
- [ ] "Page feels alive" ✓
- [ ] "Visual flow between components" ✓
- [ ] "No more blocky cards" ✓
- [ ] "Elements blend together seamlessly" ✓

---

## Rollback Plan

If issues arise:

1. **Major regression:** Revert to previous commit
2. **Minor bugs:** Hot-fix in place (don't revert entire phase)
3. **Performance jank:** Profile with Reanimated DevTools; reduce animation complexity or offload to worklet

---

## Success Definition

After completion:
- ✓ All code from VISUAL_LANGUAGE_REDESIGN.md implemented with exact values
- ✓ Detail screen feels immersive, not blocky
- ✓ Director feedback: "This feels alive"
- ✓ 60fps on iOS and Android
- ✓ No regressions
- ✓ QA approval

---

**Handoff:** Implementation team receives this roadmap + VISUAL_LANGUAGE_REDESIGN.md (complete spec with code snippets)
