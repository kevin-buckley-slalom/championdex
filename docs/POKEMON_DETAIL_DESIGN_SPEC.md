# Pokémon Detail Screen: Visual Design Specification

## Overview

This specification defines the production-grade visual design for the Pokémon detail screen, moving from a generic blocky layout to a premium, modern experience that leverages dark-theme game companion aesthetics and Pokémon visual language.

**Core Design Philosophy:**
- Premium dark mode with warm charcoal undertones (not cool blue-black)
- Type-driven visual hierarchy using Pokémon's established color system
- Artistic flow with seamless section transitions
- Modern micro-interactions and elevation hierarchy
- Content density balanced with breathing room

**Design Tokens (authoritative from codebase):**
```
Colors:
  background: #111010 (warm black)
  surface: #1E1A1A (warm dark surface)
  surfaceElevated: #2A2323 (card/sheet level)
  border: #3A2E2E (warm dark border)
  borderLight: #4D3E3E (subtle dividers)
  text: #F5EEEE (warm white)
  textSecondary: #B89E9E (secondary text)
  textMuted: #9A7A7A (tertiary text)
  primary: #DD3311 (Pokéball red)
  accent: #F0F0F0 (Pokéball white)

Spacing:
  xs: 4px, sm: 8px, md: 12px, lg: 16px, xl: 24px, 2xl: 32px, 3xl: 48px, 4xl: 64px

Typography:
  xs: 11sp, sm: 13sp, md: 15sp, lg: 17sp, xl: 20sp, 2xl: 24sp, 3xl: 30sp, 4xl: 36sp

Border Radius:
  sm: 4px, md: 8px, lg: 12px, xl: 16px, 2xl: 24px, full: 9999px
```

---

## 1. HERO SECTION

### 1.1 Hero Container Layout

**Height Profile:**
- Full height at rest: 360px
- Collapsed height (scroll): 110px
- Parallax transition: smooth interpolation over scroll distance

**Layer Structure (bottom to top):**

1. **Backdrop Layer (Base)**
   - Type-based animated backdrop (mountain, ocean, sky, etc.)
   - Parallax factor: 0.25x (slowest movement)
   - Fade: 0.6 opacity → 0 opacity (as user scrolls)
   - Aspect ratio: cover the hero container
   - Subtle grain texture overlay (20% opacity) for visual interest

2. **Gradient Overlay Layer**
   - Type-based radial gradient (replaces flat gradient)
   - NOT LinearGradient across entire view; instead: radial from center outward
   - Center color: type's primary color at 15% opacity
   - Mid color: type's primary color at 8% opacity
   - Edge color: #000000 at 40% opacity
   - Intensifies during scroll: 0 → 0.7 opacity (at collapsed state)
   - Creates depth while protecting artwork legibility

3. **Vignette Scrim Layer**
   - Radial gradient from transparent center to dark edges
   - Position: centered behind artwork
   - Radius: 220px (at hero max height)
   - Color: black (center transparent, edges #000000 at 60% opacity)
   - Purpose: frame artwork, increase visual separation

4. **Artwork Container**
   - Size: 300px × 300px (max height)
   - Parallax factor: 0.5x (medium movement)
   - Opacity fade: 1.0 → 0.6 (as user scrolls)
   - Centered horizontally and vertically in hero container
   - Artwork: 280px × 280px (10px padding for space)
   - Soft drop shadow: offset (0, 8px), blur 24px, color #000000 at 35% opacity
   - Accessibility: labeled as Pokémon artwork image

5. **Shiny Toggle Placement** ⭐ **FIXED — no longer blocks artwork**
   - Position: INSIDE hero, bottom-right corner
   - Offset from edges: 16px right, 12px from bottom
   - Z-index: above artwork layer
   - Size: compact segmented control (80px wide, 32px tall)
   - Opacity fade: 1.0 → 0.3 (as hero collapses)
   - Background: dark overlay (colors.surface at 85% opacity)
   - Interaction: tap to toggle between Normal/Shiny with 200ms cross-fade animation

6. **Legendary/Mythical Badge** ⭐ **NEW PLACEMENT**
   - Position: TOP-CENTER of hero, transparent stylized header
   - Size: 28px × 28px icon + optional text label
   - Placement: 12px from top, horizontally centered
   - Background: transparent with semi-transparent colored circle behind icon
   - Color: type-based (use primary type color at 20% opacity)
   - Icon style: Pokéathlon crown (filled star for Mythical, outlined star for Legendary)
   - Text option: "Legendary" / "Mythical" displayed below icon (optional, can be hidden on narrow screens)
   - Accessibility: labeled appropriately

### 1.2 Type-Based Radial Gradient Definition

The radial gradient is the hero's signature visual treatment. It creates depth and type association without being garish.

**Gradient Implementation (using Expo LinearGradient with radial positioning):**

```
For each type, define:
  gradientDef = {
    type: 'radial',
    centerX: 0.5,
    centerY: 0.6, // slightly lower to match artwork position
    radiusX: 1.2,
    radiusY: 1.2,
    colors: [
      // Center (most transparent)
      `${typeColor}26`, // 15% opacity
      // Mid
      `${typeColor}14`, // 8% opacity
      // Edge (darkest)
      '#00000066', // black at 40% opacity
    ],
    stops: [0, 0.5, 1],
  }
```

**Example for Electric type:**
- Center: #F8D03026 (yellow-gold at 15%)
- Mid: #F8D03014 (yellow-gold at 8%)
- Edge: #00000066 (black at 40%)

This creates a subtle glow that hints at the type without overwhelming the artwork.

### 1.3 Hero Scroll Behavior

```
Scroll offset: 0 → 300px
Hero height: 360px → 110px
Artwork opacity: 1.0 → 0.6
Artwork size: 300px → 180px (with falloff)
Backdrop opacity: 0.6 → 0
Gradient opacity: 0 → 0.7
Toggle opacity: 1.0 → 0.3
Vignette radius: 220px → 80px (follows artwork)
```

**Parallax Animation Curve:**
- Use Reanimated `withTiming` with Easing.out(Easing.cubic)
- Parallax calculations use `interpolate(scrollValue, [0, heroHeight], [startValue, endValue], Extrapolate.CLAMP)`

---

## 2. UPPER INFO SECTION

### 2.1 Section Container

**Layout:**
- Height: 140px (auto-fit to content)
- Padding: 16px (left/right), 20px (top), 16px (bottom)
- Background: colors.background (no elevated surface)
- Border-bottom: 1px solid colors.borderLight (subtle divider)
- No card elevation—this flows directly from hero

### 2.2 Layout Design — Asymmetric 2-Column with Hierarchy

**Visual Hierarchy:**

```
Row 1: [Pokémon Name (LARGE)]           [#001 Type1 Type2]
       [Classification | Gender Icons]   [Type icons 32px]
```

**Left Column (Primary Info):**

**Row 1A — Pokémon Name**
- Font: 36sp (fontSize['4xl'])
- Weight: 700 (bold)
- Color: colors.text (#F5EEEE)
- Line height: 1.2
- Margin-bottom: 4px
- All caps: NO (use proper casing, e.g., "Pikachu", "Gigantamax Pikachu")
- Example: "Pikachu"

**Row 1B — Classification + Gender**
- Font: 13sp (fontSize.sm)
- Weight: 500
- Color: colors.textSecondary
- Flex direction: row with gap 8px
- Format: "[Classification] • [Gender]"
- Gender: USE ICONS ONLY (not words)
  - Male: ♂ symbol (colors.info #3D9BE9, 14sp)
  - Female: ♀ symbol (colors.error #FF453A, 14sp)
  - Genderless: ⊘ symbol (colors.textMuted, 14sp)
- Example: "Mouse Pokémon • ♂"

**Right Column (Type & Dex ID):**

**Row 1A — Dex Number + Types (ABOVE type badges)**
- Font: 11sp (fontSize.xs)
- Weight: 600
- Color: colors.textMuted
- Format: "#[ID] • [Type1]/[Type2]"
- Example: "#025 • Electric/Water"

**Row 1B — Type Badges**
- See Section 7 (TYPE CHIP COMPONENT) for full spec
- Size: "default" (medium) — 56px wide × 28px tall (per type)
- Layout: flex row with gap 6px
- 2 types max; if dual-typed, both badges visible

### 2.3 Example Layout (Pikachu)

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│ Pikachu                               #025 • Electric │
│ Mouse Pokémon • ♂                    [Electric Badge] │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### 2.4 Responsive Considerations

- On screens <320px width: stack name on its own row, dex/types below
- Never truncate name; if needed, reduce font to 32sp (fontSize['3xl']) minimum
- Gender icons always visible (not hidden on narrow screens)

---

## 3. STAT CHART REDESIGN

### 3.1 Container & Background Treatment

**Container:**
- Margin: 16px (left/right), 24px (top/bottom)
- Padding: 16px
- Background: colors.surfaceElevated (#2A2323)
- Border-radius: 12px (borderRadius.lg)
- Border: 1px solid colors.border (#3A2E2E) — subtle frame
- Elevation: iOS shadow (blur 8px, opacity 0.2), Android elevation 2

**Visual Grouping:**
- The background container groups all stats visually, creating a premium "card within card" effect
- Subtle top border accent: 2px solid type's primary color at top edge (optional, adds visual interest)

### 3.2 Section Header

**Header (above stat rows):**
- Font: 15sp (fontSize.md)
- Weight: 600
- Color: colors.text
- Text: "BASE STATS"
- Margin-bottom: 12px
- Padding-bottom: 8px
- Border-bottom: 1px solid colors.borderLight (divider)

### 3.3 Stat Row Layout

**Each stat row (6 total):**
- Height: 32px
- Padding: 8px (vertical), 0px (horizontal)
- Gap between rows: 8px
- Flex layout: row with gap 12px, align-items center

**Label (Left):**
- Width: 64px (fixed)
- Font: 11sp (fontSize.xs)
- Weight: 600
- Color: colors.textSecondary
- Text-align: right
- Abbreviations (ALWAYS):
  - HP → "HP"
  - ATTACK → "ATK"
  - DEFENSE → "DEF"
  - SP. ATTACK → "SP.A" (or "SPATK")
  - SP. DEFENSE → "SP.D" (or "SPDEF")
  - SPEED → "SPD"

**Bar Track (Middle, flex: 1):**
- Height: 24px
- Background: colors.borderLight (#4D3E3E)
- Border-radius: 4px (borderRadius.sm)
- Overflow: hidden

**Stat Bar Fill (inside track):**
- Height: 24px
- Border-radius: 4px
- Animation: slides in from left over 200ms (staggered: 100ms + index × 50ms)
- **Stat Value-Based Coloring (critical):**
  ```
  Value >= 120: cyan (#00BCD4)
  Value >= 90:  green (#4CAF50)
  Value >= 60:  yellow (#FFD700)
  Value >= 30:  orange (#FF9800)
  Value < 30:   red (#FF453A)
  ```
  - These colors are based on **stat value**, NOT Pokémon type
  - Provides instant visual feedback on power level

**Value Display (Right):**
- Width: 48px (fixed, right-aligned)
- Font: 13sp (fontSize.sm)
- Weight: 700
- Color: colors.textMuted
- Font-family: monospace (Menlo or equivalent)
- Text-align: right
- Format: "[raw number]" (e.g., "145")
- Baseline alignment with bar

### 3.4 Total Base Stat (BST) Row

**Separator (before total):**
- Margin-top: 12px
- Border-top: 1px solid colors.borderLight
- Padding-top: 8px

**Total Row:**
- Flex layout: row, space-between
- Label: "BASE STAT TOTAL"
- Font: 13sp (fontSize.sm)
- Weight: 600
- Color: colors.textSecondary
- Value: [BST number]
- Font: 15sp (fontSize.md)
- Weight: 700
- Color: colors.text
- Font-family: monospace

### 3.5 Example Visual

```
┌────────────────────────────────────────────────────┐
│ ─ (2px type-color top border)                      │
│ BASE STATS                                         │
│ ─────────────────────────────────────────────────  │
│                                                    │
│  HP  [████████████░░░░░░░░]              139       │
│  ATK [████████░░░░░░░░░░░░]              115       │
│  DEF [██████░░░░░░░░░░░░░░░]              95       │
│  SP.A[██████░░░░░░░░░░░░░░░]              95       │
│  SP.D[████████░░░░░░░░░░░░]              115       │
│  SPD [██████░░░░░░░░░░░░░░░]              95       │
│                                                    │
│ BASE STAT TOTAL                                654 │
│                                                    │
└────────────────────────────────────────────────────┘
```

**Color Key:**
- HP (139): green (#4CAF50) — value >= 90
- ATK (115): green (#4CAF50) — value >= 90
- DEF (95): green (#4CAF50) — value >= 90
- SP.A (95): green (#4CAF50) — value >= 90
- SP.D (115): green (#4CAF50) — value >= 90
- SPD (95): green (#4CAF50) — value >= 90

---

## 4. TYPE EFFECTIVENESS TABLE (NEW COMPONENT)

### 4.1 Positioning & Container

**Position:** Immediately below Stat Chart
- Margin-top: 24px
- Margin-left/right: 16px
- Margin-bottom: 24px
- Padding: 16px
- Background: colors.surfaceElevated (#2A2323)
- Border-radius: 12px
- Border: 1px solid colors.border
- Elevation: same as Stat Chart (iOS shadow blur 8px 0.2 opacity, Android elevation 2)

### 4.2 Tab System

**Tabs (top of component):**
- Count: Up to 3 tabs
  1. "DEFENSE" (always present)
  2. "[Type1]" (if Pokémon has Type1, e.g., "FIRE")
  3. "[Type2]" (if Pokémon has Type2, e.g., "FLYING") — only if dual-typed

- Tab height: 40px
- Tab width: flex, equal distribution
- Flex layout: row, space-between
- Border-bottom: 1px solid colors.borderLight (separates tabs from content)

**Tab Label:**
- Font: 13sp (fontSize.sm)
- Weight: 600
- Color: colors.textMuted (inactive), colors.text (active)
- All caps: YES
- Underline indicator: 3px solid type's primary color (active tab only)

**Tab Content Padding-top:** 12px

### 4.3 Type Effectiveness Grid

**Grid Structure (per tab):**
- 2 main rows, each with 2 sub-rows = 9 type squares per main row (18 types total)
- Layout: CSS Grid or manual flex layout
- Main row separation: 4px gap
- Sub-row separation: 4px gap

**Grid Visual:**
```
[Type1] [Type2] [Type3] [Type4] [Type5] [Type6] [Type7] [Type8] [Type9]
[Type10][Type11][Type12][Type13][Type14][Type15][Type16][Type17][Type18]
```

**Type Square:**
- Size: 32px × 32px
- Background: type's primary color (#F08030 for Fire, #6890F0 for Water, etc.)
- Border-radius: 4px
- Flex layout: column, center, justify-content space-between
- Padding: 2px (top/bottom)

**Type Icon (inside square):**
- Size: 20px × 20px
- Center horizontally, top 2px
- Simple text symbol or icon font (Pokémon type icons from @pokeapi or custom SVG)

**Effectiveness Value (below icon):**
- Font: 9sp (custom, smaller than fontSize.xs)
- Weight: 700
- Color: see effectiveness color scheme below
- Text-align: center
- Format: "0.5", "2", "4", "1/4", etc. (use fractional notation)

### 4.4 Effectiveness Color Scheme

**Effectiveness Values:**
- 1/4, 0.25, ×0.25 → green (#4CAF50)
- 1/2, 0.5, ×0.5 → yellow (#FFD700)
- 1, ×1 (normal) → gray (#9A7A7A, muted)
- 2, ×2 → orange (#FF9800)
- 4, ×4, ×2 (double super-effective) → red (#FF453A)
- 0 (no effect) → gray (#9A7A7A, muted, empty outline only)

**DEFENSE Tab Coloring:**
- Effectiveness < 1 (resists): green (#4CAF50)
- Effectiveness > 1 (weak to): red (#FF453A)
- Effectiveness = 0 (immune): gray (#9A7A7A, outlined square only)
- Effectiveness = 1 (neutral): understated gray (#9A7A7A)

**OFFENSE Tabs (Type1, Type2) Coloring (reversed):**
- Effectiveness < 1 (weak to): red (#FF453A)
- Effectiveness > 1 (super-effective against): green (#4CAF50)
- Effectiveness = 0: gray (#9A7A7A)
- Effectiveness = 1: understated gray (#9A7A7A)

**Special Case — Zero Immunity:**
- Effectiveness 0: type square has empty/transparent fill, border-only treatment
- Border: 1px solid colors.border (#3A2E2E)
- Text "0" still visible below

### 4.5 Example: Pikachu (Electric/Water) — DEFENSE Tab

```
┌─────────────────────────────────────────────────────────────────┐
│ [DEFENSE] [ELECTRIC] [WATER]                                    │
│ ─────────────────────────────────────────────────────────────── │
│                                                                 │
│ Normal  Fire   Water   Grass  Electric  Ice    Fighting  Poison  Ground
│  1.0    1.0    1.0     1.0    0.5        1.0   1.0       1.0     1.0
│
│ Flying  Psychic Bug    Rock   Ghost     Dragon Dark     Steel    Fairy
│  1.0    1.0     1.0    1.0    1.0       1.0    1.0      1.0      1.0
│
```

(Note: All "1.0" are understated gray. Water-type Electric weakness would show "2" in orange for Water type on WATER tab offensive analysis.)

---

## 5. EVOLUTION CHAIN

### 5.1 Container & Layout

**Position:** Below Type Effectiveness Table
- Margin-top: 24px
- Margin-left/right: 16px
- Margin-bottom: 24px
- Padding: 16px
- Background: colors.surfaceElevated (#2A2323)
- Border-radius: 12px
- Border: 1px solid colors.border
- Elevation: same as above

### 5.2 Horizontal Left-to-Right Design

**Design Challenge:** Linear evolutions (A → B → C) are simple; branching (Eevee's 8 evolutions) require special handling.

**Solution: Horizontal Scroll with Branching Support**

**Layout Approach:**
- Primary flow: left-to-right horizontal scroll
- Linear chains: single row (Bulbasaur → Ivysaur → Venusaur)
- Branching chains: multi-row flex column inside horizontal scroll
  - Example: Eevee starting point, then 8 evolution options stacked in 2 columns (4 rows of 2)
  - Vertical alignment: center-matched to starting sprite

**Container Dimensions:**
- Height: 200px (expands for multi-row chains)
- Horizontal scroll enabled
- Content: left-aligned with 16px padding start/end

### 5.3 Evolution Step Component

**Step (card per evolution stage):**
- Size: 100px × 140px
- Layout: column, center-aligned
- Margin: 12px (right, between steps)

**Sprite Area:**
- Size: 80px × 80px
- Background: colors.surface (slight elevation)
- Border-radius: 8px
- Sprite centered, contain aspect ratio

**Arrow/Connector (between steps):**
- Position: absolute, right of sprite area
- Size: 32px × 2px
- Color: colors.borderLight
- Rotation: 0° (horizontal)
- Only shown for linear chains (not for branching options)

**Evolution Condition Label (below sprite):**
- Font: 9sp
- Weight: 500
- Color: colors.textMuted
- Text-align: center
- Format: "Level 36", "Trade", "Stone (Fire)", "High Friendship (Night)"
- Max lines: 2
- Example: "Friendship\n+ Night"

**Pokémon Name (bottom):**
- Font: 11sp (fontSize.xs)
- Weight: 600
- Color: colors.text
- Text-align: center

### 5.4 Branching Evolution (Eevee Example)

```
[Eevee]
   ↓
[Vaporeon] [Jolteon]  [Flareon]   [Espeon]
[Water Stone] [Thunder Stone] [Fire Stone] [Friendship+Day]

[Umbreon]  [Leafeon]  [Glaceon]  [Sylveon]
[Friendship+Night] [Moss Stone] [Ice Stone] [Fairy Move]
```

**Technical Implementation:**
- Determine evolution chain structure from API data
- If linear (1 evolves to 1): single row, arrows visible
- If branching (1 evolves to N): layout as grid inside flex column
  - Row count: ceil(branchCount / 2)
  - Column count: min(branchCount, 2)
- Use `ScrollView` with horizontal scroll enabled

### 5.5 Non-Evolvable Pokémon

- If no evolutions: render a single card with "Pokémon name" and "Does not evolve" label
- Or omit this section entirely (return null in component)

---

## 6. RELATED FORMS SECTION

### 6.1 Section Header & Container

**Position:** Below Evolution Chain
- Margin-top: 24px
- Margin-left/right: 16px
- Margin-bottom: 24px
- No background container (grid layout on background)

**Section Title:**
- Font: 17sp (fontSize.lg)
- Weight: 600
- Color: colors.text
- Text: "REGIONAL VARIANTS" (if only regional forms) OR "ALTERNATE FORMS" (if any form)
- Margin-bottom: 12px
- Padding-left: 0 (aligns with section edges)

### 6.2 Grid Layout (Replaces Carousel)

**Grid Structure:**
- Columns: 3 per row on mobile (>=320px), 4 on tablet (>=600px)
- Gap: 12px (both horizontal and vertical)
- Padding: 0 (edges handled by margin)

**Card Dimensions:**
- Width: (screenWidth - 32) / 3 (on mobile)
- Height: width × 1.3 (taller than wide to accommodate type badges below)
- Aspect ratio: roughly 1:1.3

### 6.3 Form Card Design

**Container:**
- Background: colors.surface (#1E1A1A)
- Border: 1px solid colors.border (#3A2E2E)
- Current form: 2px border, colors.primary (highlight)
- Border-radius: 8px (borderRadius.md)
- Padding: 8px
- Elevation: iOS shadow (blur 4px, 0.15 opacity), Android elevation 1

**Pressable State:**
- Pressed opacity: 0.7
- Scale: 0.98x (slight shrink on tap)
- All changes animated with `withTiming` 100ms

**Internal Layout (column, centered):**

**1. Sprite Container**
- Size: 64px × 64px
- Background: colors.borderLight (#4D3E3E)
- Border-radius: 4px
- Centered horizontally, top-aligned
- Sprite image: 64px × 64px, contain fit

**2. Form Name Label**
- Font: 11sp (fontSize.xs)
- Weight: 500
- Color: colors.textSecondary
- Text-align: center
- Margin-top: 4px
- Single line, no wrap

**3. Type Badges (see Section 7)**
- Size: "compact" — 48px × 24px per badge
- Layout: flex row, centered, gap 4px
- Wrapping: max 2 badges; if 2 won't fit, show only primary type
- Margin-top: 6px

**4. Navigation Affordance (corner indicator)**
- Position: top-right corner of card
- Size: 20px × 20px
- Icon: right-facing chevron (›) or forward arrow (→)
- Color: colors.primary (accent color)
- Font: 16sp, weight 700
- Opacity: 0.6 (subtle, not overwhelming)

### 6.4 Current Form Indicator

**Visual distinction for current form:**
- Border: 2px solid colors.primary (#DD3311)
- Background: slightly elevated, colors.surfaceElevated (#2A2323)
- Overlay: optional semi-transparent accent circle in top-left corner (6px diameter, colors.primary at 20% opacity)

### 6.5 Empty State

If no alternate forms exist:
- Render single card with current Pokémon form
- Label: "Only Form"
- No chevron/navigation affordance (disabled state)

### 6.6 Example: Pikachu Variants

```
┌─────────────────────────────────────────┐
│ REGIONAL VARIANTS                       │
│                                         │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│ │ [sprite] │ │ [sprite] │ │ [sprite] │ │
│ │ Alolan   │ │ Galar    │ │ Dynamax  │ │
│ │ [Elec]   │ │ [Stl/Fai]│ │ [Elec]   │ │
│ │          › │          › │          › │
│ └──────────┘ └──────────┘ └──────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

---

## 7. TYPE CHIP / TYPE BADGE COMPONENT

### 7.1 Reusable TypeChip Component Spec

**Purpose:** Single source of truth for type display across entire app.

**Props:**
```typescript
interface TypeChipProps {
  type: string; // e.g., 'fire', 'water', 'electric'
  size?: 'compact' | 'default' | 'large';
  showIcon?: boolean;
  showText?: boolean;
  interactive?: boolean;
  onPress?: () => void;
}
```

### 7.2 Size Variants

All variants use the same background color, icon, and text style — only dimensions change.

#### Compact Size (Related Forms, in-card use)
- Width: 48px (fixed)
- Height: 24px
- Padding: 4px (left/right), 2px (top/bottom)
- Font: 9sp (custom, smaller)
- Icon size: 14px
- Layout: row, center, gap 3px
- Border-radius: 4px

#### Default Size (List screens, main usage)
- Width: 56px (fixed)
- Height: 28px
- Padding: 6px (left/right), 4px (top/bottom)
- Font: 11sp (fontSize.xs)
- Icon size: 16px
- Layout: row, center, gap 4px
- Border-radius: 6px

#### Large Size (Hero/Header, future use)
- Width: 72px (fixed)
- Height: 32px
- Padding: 8px (left/right), 6px (top/bottom)
- Font: 13sp (fontSize.sm)
- Icon size: 18px
- Layout: row, center, gap 5px
- Border-radius: 8px

### 7.3 Internal Layout

**Structure (row, centered):**
```
[Icon] [Text]
```

**Icon (left):**
- Size: variant-specific (see above)
- Type-specific icon/symbol (Pokéball with type color, or type glyph)
- Background: transparent
- Margin-right: gap (built-in via gap property)

**Text (right):**
- Font: variant-specific weight 600
- Color: typeTextColors[type] (white or black based on type background contrast)
- Text-align: center
- Truncate: no (fixed width accommodates all type names)

### 7.4 Type Background Colors

All 18 types use their primary color from typeColors constant:
```
normal: #A8A878
fire: #F08030
water: #6890F0
electric: #F8D030
grass: #78C850
ice: #98D8D8
fighting: #C03028
poison: #A040A0
ground: #E0C068
flying: #A890F0
psychic: #F85888
bug: #A8B820
rock: #B8A038
ghost: #705898
dragon: #7038F8
dark: #705848
steel: #B8B8D0
fairy: #EE99AC
```

### 7.5 Fixed-Width Solution

**Challenge:** Type names vary in length (e.g., "Bug" vs "Psychic").

**Solution:** Fixed width per size variant accommodates longest type name.

**Calculation:**
- Compact: 48px accommodates "Psychic" (9 chars at 9sp)
- Default: 56px accommodates "Psychic" (9 chars at 11sp)
- Large: 72px with room for future expansion

**Overflow Handling:**
- No text wrapping
- No truncation (fixed width prevents overflow)
- If extremely narrow context (<48px), use icon-only variant (no text)

### 7.6 Interactive Variant

**If `interactive={true}`:**
- Pressable wrapper
- Pressed state: opacity 0.7, scale 0.95x
- Cursor: pointer
- onPress callback

**If `interactive={false}` (default):**
- Static display only
- No press response
- Accessibility role: "image" (read as "Fire type", "Water type", etc.)

### 7.7 Accessibility

**Accessibility Label (for all variants):**
```
`${type} type` (e.g., "fire type")
```

**Accessibility Role:**
- If interactive: button
- If static: image

---

## 8. OVERALL DESIGN LANGUAGE & POLISH

### 8.1 Section Dividers & Spacing

**Between Sections:**
- Margin-top/bottom: 24px (2xl token)
- No explicit divider line (use whitespace)
- Subtle visual distinction: each elevated section has background colors.surfaceElevated

**Within Sections (sub-dividers):**
- Use colors.borderLight (#4D3E3E) at 1px opacity
- Only use between logical sub-groups (e.g., stat rows from BST total)

**Breathing Room:**
- Minimum padding inside containers: 12px
- Maximum width for content: full screen (responsive)
- Left/right margin on all top-level sections: 16px

### 8.2 Card Elevation Treatment

**Three-Level Elevation Hierarchy:**

1. **Surface Level (base content)**
   - Background: colors.surface (#1E1A1A)
   - Border: 1px solid colors.border
   - Shadow: none (resting)

2. **Elevated (cards, containers)**
   - Background: colors.surfaceElevated (#2A2323)
   - Border: 1px solid colors.border
   - Shadow iOS: blur 8px, opacity 0.2, offset (0, 2)
   - Shadow Android: elevation 2
   - Used for: Stat Chart, Type Effectiveness Table, Evolution Chain

3. **Interactive (pressed/hover state)**
   - Scale: 0.98x
   - Opacity: 0.7 (pressed)
   - Shadow intensity: increase to iOS blur 12px, opacity 0.3

### 8.3 Type-Driven Color Accents

**Accent Positioning:**
- Top border on Stat Chart container: 2px solid primary type color (optional but recommended)
- Section headers can use subtle type-color tint (10% opacity background behind text)
- Hero backdrop and gradient: type-based (see Hero section)

**Example (Electric Pokémon):**
- Hero radial gradient: yellow-gold tints (#F8D030 at 15%, 8%)
- Stat Chart top border: #F8D030 at 2px
- Type badges: standard Electric color
- Section headers: no tint (keep neutral)

### 8.4 Micro-Interactions & Transitions

**Animations:**
- Stat bar entry: 200ms staggered (`withTiming`, Easing.out(Easing.cubic))
- Shiny toggle cross-fade: 200ms (100ms fade-out, image swap, 100ms fade-in)
- Card press: 100ms scale + opacity `withTiming`
- Scroll parallax: continuous, no easing (track scroll input)

**No Janky Transitions:**
- Use Reanimated for all complex animations
- GPU-accelerated transforms only (scale, translate, rotate)
- Avoid layout thrashing; pre-measure dimensions

### 8.5 Visual Polish Details

**Subtle Texture:**
- Optional 1-2% grain overlay on hero backdrop (20% opacity, subtle noise)
- Adds depth without being distracting

**Vignette Framing:**
- Hero vignette scrim: radial gradient, darkens edges around artwork
- Creates focus on Pokémon sprite without garish effects

**Emphasis Through Scale:**
- Pokémon name: large (36sp)
- Section titles: medium (17sp)
- Labels: small (11-13sp)
- Tertiary info: 9sp

**Color Hierarchy:**
- Primary text (name, values): colors.text (#F5EEEE) — maximum contrast
- Secondary text (labels, classifications): colors.textSecondary (#B89E9E) — mid contrast
- Tertiary text (hints, conditions): colors.textMuted (#9A7A7A) — low contrast

### 8.6 Dark Mode Consistency

**Warm Undertone Design:**
- All grays have warm undertones, not cool blue
- Charcoal background: #111010 (not #000000 or #0F0F0F)
- Surfaces: #1E1A1A (not pure black)
- Borders: #3A2E2E (not pure gray)

**Purpose:**
- Reduces eye strain in dim environments
- Matches Pokémon game aesthetic (not cold/clinical)
- Premium gaming feel

### 8.7 Section Flow & Transitions

**Screen Reading Order (top to bottom):**
1. Hero (parallax-enabled)
2. Upper Info (name, classification, types)
3. Stat Chart (base stats with value-based coloring)
4. Type Effectiveness Table (defense + offense tabs)
5. Evolution Chain (horizontal scroll)
6. Related Forms (grid)
7. [Future sections: Abilities, Moves, Encounters, Pokedex entries]

**Visual Continuity:**
- Each section has consistent left/right margin (16px)
- Elevated containers (Stat Chart, Effectiveness, Evolution) all use same background/border/shadow treatment
- Color theme consistent throughout (warm darks, type-driven accents)

---

## 9. RESPONSIVE & ACCESSIBILITY

### 9.1 Mobile-First Breakpoints

**Mobile (<480px):**
- Single-column layouts
- 3-column form grid
- Horizontal scroll for evolution chains
- Compact type chips

**Tablet (≥600px):**
- 4-column form grid
- Wider evolution chain (more cards visible without scroll)
- Larger padding/margins for breathing room
- Stat chart may expand width

### 9.2 Accessibility Standards

**Colors:**
- All text: WCAG AA contrast ratio (4.5:1 minimum)
- Secondary text colors verified to meet standard

**Semantics:**
- Stat bars: accessibility role "progressbar", value attributes set correctly
- Type chips: role "image", labeled appropriately
- Form cards: role "button", labeled with form name
- Section headers: role "heading"

**Touch Targets:**
- Minimum 44px × 44px for interactive elements
- Stat bars: full row is tappable (44px height achieved via padding + bar height)
- Form cards: 100+px wide (ample touch target)

---

## 10. IMPLEMENTATION CHECKLIST

### 10.1 Components to Create/Modify

- [ ] **PokemonHero.tsx** — Update shiny toggle position, add legendary badge, refine gradients
- [ ] **StatChart.tsx** — Add background container, value-based coloring, update labels/abbreviations
- [ ] **TypeEffectivenessTable.tsx** (NEW) — Tab system, effectiveness grid, dual-tab support
- [ ] **EvolutionChain.tsx** (NEW) — Horizontal scroll, branching support, evolution conditions
- [ ] **RelatedFormsGrid.tsx** — Replace carousel with grid, add navigation affordances
- [ ] **TypeChip.tsx** (Refactor) — Create reusable component with size variants, fixed widths

### 10.2 Design Token Additions (if needed)

- [ ] Add effectiveness colors to colors.ts (cyan, green, yellow, orange, red)
- [ ] Add fontSize 9sp variant (custom addition for Type Effectiveness values)
- [ ] Optional: Add type-specific gradient definitions to heroGradients.ts

### 10.3 Testing Checklist

- [ ] Stat bars animate smoothly, colors display correctly per value range
- [ ] Shiny toggle doesn't obscure artwork at any scroll position
- [ ] Legendary/Mythical badge displays correctly at hero top
- [ ] Type Effectiveness tabs switch without layout shift
- [ ] Evolution chains render correctly for linear and branching cases
- [ ] Form grid displays 3 columns on mobile, 4 on tablet
- [ ] TypeChip fixed widths accommodate all 18 types without wrapping
- [ ] All text meets WCAG AA contrast ratio
- [ ] Touch targets all meet 44px × 44px minimum

---

## 11. COLOR REFERENCE

### 11.1 Effectiveness Coloring (Quick Reference)

```
DEFENSE Tab (Pokémon resisting/weak to attacks):
  < 1 (resists): #4CAF50 (green)
  = 1 (neutral): #9A7A7A (gray)
  > 1 (weak):    #FF453A (red)
  = 0 (immune):  #9A7A7A (gray, outline only)

OFFENSE Tabs (Pokémon's attacks are effective):
  < 1 (weak):    #FF453A (red)
  = 1 (neutral): #9A7A7A (gray)
  > 1 (super-eff): #4CAF50 (green)
  = 0 (no effect): #9A7A7A (gray, outline only)

Stat Value-Based (Stat Chart bars):
  >= 120: #00BCD4 (cyan)
  >= 90:  #4CAF50 (green)
  >= 60:  #FFD700 (yellow)
  >= 30:  #FF9800 (orange)
  < 30:   #FF453A (red)
```

### 11.2 All 18 Type Colors

```
normal:    #A8A878  fighting: #C03028  flying:   #A890F0
fire:      #F08030  poison:   #A040A0  ground:   #E0C068
grass:     #78C850  bug:      #A8B820  rock:     #B8A038
ghost:     #705898  dragon:   #7038F8  dark:     #705848
steel:     #B8B8D0  fairy:    #EE99AC  water:    #6890F0
electric:  #F8D030  ice:      #98D8D8  psychic:  #F85888
```

---

## 12. DESIGN HAND-OFF NOTES

### 12.1 For Developers

- Use this spec as the source of truth for all measurements, colors, and interactions
- Defer style constants to codebase (colors.ts, spacing.ts, fontSize.ts)
- Test on multiple device sizes; use responsive breakpoints provided
- Ensure animations use Reanimated, not react-native Animated
- Profile performance on real devices; 60fps minimum on iOS and Android

### 12.2 For Designers / QA

- Verify stat bar colors update correctly for different Pokémon (test 30, 60, 90, 120+ values)
- Verify shiny toggle never overlaps artwork at any scroll offset
- Verify type effectiveness grid displays all 18 types with correct coloring
- Verify evolution chains with linear and branching topologies
- Verify touch targets meet 44px minimum on all interactive elements
- Verify text contrast meets WCAG AA (4.5:1 minimum)

### 12.3 Future Enhancements

- Animated stat bar entry with wave effect (instead of staggered slide)
- Type effectiveness table with swipeable tabs (horizontal scroll tabs)
- 3D artwork viewer (rotate Pokémon sprite on tap)
- Shiny color-shift indicator (subtle background color change on hero)
- Regional form indicators (badge showing "Alolan", "Galar", etc.)

---

## END OF SPECIFICATION

**Version:** 1.0
**Date:** 2026-07-14
**Status:** Ready for Implementation
