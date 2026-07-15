# Pokemon Detail Info Section — Design Specification

**Version:** 1.0  
**Date:** 2026-07-14  
**Status:** Production Ready  
**Audience:** React Native developers (implementation reference)  
**Component:** `InfoStrip` (validated design, optimized for scalability)

---

## Executive Summary

The info section sits between the type badges and abilities section on the Pokemon detail screen. It displays 4–5 data points: **Height, Weight, Generation, Gender Ratio, and optional Legendary/Mythical status**.

This specification validates the existing `InfoStrip` component design as production-ready, clarifies visual semantics, and provides pixel-perfect implementation specs for scaling, localization, and edge cases.

**Design Philosophy:**
- **Transparent background** (no card surface) — blends seamlessly with dark screen
- **Vertical stack layout** — compact, scannable, native-feeling
- **Visual emphasis on data** — uppercase labels are muted, values are bold and prominent
- **Gender ratio as visual element** — horizontal pill bar with male/female color coding, not text
- **Legendary/Mythical as status badge** — special colors when present, not cluttered
- **Accent color integration** — subtle type-based theming via borders/accents (future expansion)

---

## 1. Layout Structure (CURRENT IMPLEMENTATION)

### 1.1 Overall Container

**Current Design (2026-07-14):**
The InfoStrip now displays as a **single horizontal row of 4 columns** (not vertical rows as originally specified).

```
┌─────────────────────────────────────────────────────┐
│ (Optional: Legendary/Mythical badge row above)      │
├─────────────────────────────────────────────────────┤
│  HEIGHT        WEIGHT        GEN    GENDER          │
│  1'4"          6.9 kg        I      [██--] 75% M    │
│  0.4 m         —             —      25% F           │
└─────────────────────────────────────────────────────┘
```

**Container Dimensions & Spacing:**
- `paddingHorizontal: spacing.lg` (16px)
- `paddingVertical: spacing.md` (12px)
- Main row: `flexDirection: 'row', gap: 16, alignItems: 'flex-start'`
- `backgroundColor: transparent`
- No borders, no surface fill
- Full width of screen

**Legendary/Mythical Badge (Conditional):**
- Renders above main row if `isLegendary` or `isMythical` is true
- Centered with star/glyph icon
- Gold text for Legendary, magenta for Mythical
- Bottom divider with subtle opacity

**Column Structure:**
- HEIGHT: `flex: 2` (proportional width)
- WEIGHT: `flex: 2` (proportional width)
- GEN: `flex: 1` (proportional width)
- GENDER: `flex: 3` (proportional width, accommodates gender bar and percentages)

---

## 2. Column Structure (Current Implementation)

Each column in the single-row layout follows this pattern:

### 2.1 Column Component Hierarchy

```
View (column container, flex: proportional)
├─ alignItems: 'flex-start'
│
├─ Text (label)
│  └─ fontSize: 10px, fontWeight: 600, opacity: 0.6
│  └─ textTransform: 'uppercase', letterSpacing: 2
│  └─ marginBottom: 4px (xs spacing)
│
├─ Text (primary value)
│  └─ fontSize: 18px, fontWeight: 700
│  └─ color: white
│  └─ marginBottom: 2px
│
└─ Text (secondary value) [optional]
   └─ fontSize: 11px, fontWeight: 400
   └─ color: textMuted
```

### 2.2 Label Styling

**Typography:**
- Font size: 10px
- Font weight: 600 (SemiBold)
- Color: `colors.textMuted` (rgba(255, 255, 255, 0.45))
- Text transform: uppercase
- Letter spacing: 2px
- Opacity: 0.6 (muted)

**Alignment:**
- `textAlign: 'left'` (left-aligned within column)
- No fixed width (natural width per label text)
- Wrapping not expected; short labels only

### 2.3 Primary Value Styling

**Typography:**
- Font size: 18px
- Font weight: 700 (Bold)
- Color: `#F5EEEE` (text primary / warm white)

**Container:**
- `marginBottom: 2px` (compact spacing)

### 2.4 Secondary Value Styling

**Typography:**
- Font size: 11px
- Font weight: 400 (Regular)
- Color: `colors.textMuted`

**Container:**
- `marginBottom: 0px` (no bottom spacing)

---

## 3. Specific Column Types (Current Implementation)

### 3.1 HEIGHT Column

**Column Flex:** `flex: 2` (proportional width, 2 units)

**Data:** Decimal meters (e.g., 0.4)

**Display Format:**
- Primary (top): Imperial feet and inches (e.g., `1'4"`)
- Secondary (bottom): Metric meters (e.g., `0.4 m`)
- Fallback: If height is null, display `"—"` for both

**Typography:**
- Label: 10px, fontWeight 600, uppercase, opacity 0.6
- Primary: 18px, fontWeight 700, white
- Secondary: 11px, fontWeight 400, textMuted

**Example:**
```
HEIGHT
1'4"
0.4 m
```

---

### 3.2 WEIGHT Column

**Column Flex:** `flex: 2` (proportional width, 2 units)

**Data:** Decimal kilograms (e.g., 6.9)

**Display Format:**
- Primary (top): Imperial pounds (calculated)
- Secondary (bottom): Metric kilograms (e.g., `6.9 kg`)
- Fallback: If weight is null, display `"—"` for both

**Typography:**
- Label: 10px, fontWeight 600, uppercase, opacity 0.6
- Primary: 18px, fontWeight 700, white
- Secondary: 11px, fontWeight 400, textMuted

**Example:**
```
WEIGHT
15.2 lbs
6.9 kg
```

---

### 3.3 GEN Column

**Column Flex:** `flex: 1` (proportional width, 1 unit)

**Data:** Generation number (1–9) → Roman numeral

**Display Format:**
- Primary (top): Roman numeral (I, II, III, IV, V, VI, VII, VIII, IX)
- Secondary (bottom): Empty placeholder (space only)
- Fallback: If generation >= 10, use numeric: "X", "XI", etc.

**Typography:**
- Label: 10px, fontWeight 600, uppercase, opacity 0.6
- Primary: 18px, fontWeight 700, white
- Secondary: Empty or space

**Example:**
```
GEN
I
(empty)
```

---

### 3.4 GENDER Column (Special: Visual Element)

**Column Flex:** `flex: 3` (proportional width, 3 units, widest column)

**Data:** `genderRate` (0–8, or -1 for genderless)

**Display Format:**
- Label: "GENDER" (uppercase)
- Visual pill bar: Proportional blue/pink segments
- Percentage labels: Male and female percentages below bar

**Gender Rate Mapping:**
```
genderRate = -1     → Genderless (100% neutral)
genderRate = 0      → 100% male, 0% female
genderRate = 1      → 87.5% male, 12.5% female
genderRate = 2      → 75% male, 25% female
genderRate = 3      → 62.5% male, 37.5% female
genderRate = 4      → 50% male, 50% female
genderRate = 5      → 37.5% male, 62.5% female
genderRate = 6      → 25% male, 75% female
genderRate = 7      → 12.5% male, 87.5% female
genderRate = 8      → 0% male, 100% female
```

**Pill Bar Styling:**
```
Container:
  height: 6px
  width: 100% (fills column)
  borderRadius: 3px
  overflow: 'hidden'
  alignSelf: 'stretch'
  marginTop: 12px (vertical centering with primary values)

Segment (male):
  flex: malePercent
  height: 100%
  backgroundColor: #6890F0 (water blue)

Segment (female):
  flex: femalePercent
  height: 100%
  backgroundColor: #FF6FA0 (pink)

Genderless variant:
  height: 6px
  borderRadius: 3px
  backgroundColor: rgba(255, 255, 255, 0.2) (neutral gray)
```

**Percentage Display (Below Bar):**
- Left: `♂ {malePercent}%`
- Right: `♀ {femalePercent}%`
- Font size: 11px, fontWeight 400, textMuted
- Layout: `flexDirection: row, justifyContent: space-between`

**Example Output:**
```
GENDER
[████████████----]
♂ 75%    ♀ 25%

GENDER
[─────────────────]
Genderless
```

**Accessibility:**
- Voice-over narration: "Gender ratio: 75 percent male, 25 percent female"
- Alternative text for genderless: "This Pokémon is genderless"
- `accessibilityLabel` on pill bar describes ratio

**Interaction Note:**
- Pill bar is not interactive; visual element only

---

### 3.5 STATUS Row (Conditional: Legendary/Mythical)

**Location:** Above main 4-column row (conditional render)

**Data:** Boolean flags `isLegendary` or `isMythical`

**Display Logic:**
```
if (isLegendary) {
  show "★ LEGENDARY"  → golden/yellow color
} else if (isMythical) {
  show "✦ MYTHICAL"   → purple/magenta color
} else {
  don't render row
}
```

**Typography:**
- Font size: 11px
- Font weight: 700
- Letter spacing: 2px
- Text transform: uppercase
- Color (Legendary): `rgba(255, 215, 0, 0.9)` (gold)
- Color (Mythical): `rgba(192, 0, 255, 0.9)` (magenta)

**Layout:**
- Centered text alignment
- `paddingBottom: spacing.sm` (8px)
- Bottom divider: 1px border, rgba(255, 255, 255, 0.06)

**Example:**
```
★ LEGENDARY
─────────────
```

---

## 4. Typography & Color Reference

### 4.1 Typography Scale (Info Section)

| Element | Font Size | Weight | Color | Letter Spacing | Transform |
|---------|-----------|--------|-------|-----------------|-----------|
| Section title "INFO" | 11px | 700 | `rgba(255,255,255,0.45)` muted | 2px | uppercase |
| Row labels (HEIGHT, WEIGHT, etc.) | 11px | 600 | `rgba(255,255,255,0.45)` muted | 1px | uppercase |
| Row values (0.7 m, 6.9 kg, I, etc.) | 15px | 700 | `#F5EEEE` white | 0px | none |
| Gender pill bar (visual) | — | — | `#6890F0` (male), `#FF6FA0` (female) | — | — |
| Status value (Legendary) | 15px | 700 | `rgba(255,215,0,0.9)` gold | 0px | none |
| Status value (Mythical) | 15px | 700 | `rgba(192,0,255,0.9)` magenta | 0px | none |

### 4.2 Color Tokens

```typescript
// From design system
colors.text = '#F5EEEE'           // Primary text
colors.textMuted = 'rgba(255, 255, 255, 0.45)'  // Muted labels
colors.background = '#111010'     // Dark background

// Type-specific colors (for future accent theming)
typeColors.water = '#6890F0'      // Male pill segment
typeColors.fire = '#FF6FA0'       // Female pill segment (approximation; true pink #FF6FA0)

// Status colors
colors.legendary = 'rgba(255, 215, 0, 0.9)'    // Gold
colors.mythical = 'rgba(192, 0, 255, 0.9)'     // Magenta
```

---

## 5. Spacing Breakdown

### 5.1 Vertical Spacing (Measurements in px)

```
┌───────────────────────────────────────────────┐
│ (16px top padding)                            │ paddingVertical
├───────────────────────────────────────────────┤
│ INFO                                          │ section title
│ (12px gap to first row)                       │ marginBottom on title
├───────────────────────────────────────────────┤
│   HEIGHT        0.7 m                         │ row (8px vert padding)
│   (4px gap)                                   │ gap: xs
│   WEIGHT        6.9 kg                        │ row (8px vert padding)
│   (4px gap)                                   │ gap: xs
│   GENERATION    I                             │ row (8px vert padding)
│   (4px gap)                                   │ gap: xs
│   GENDER        [─────■─]                     │ row (8px vert padding)
│   (4px gap)                                   │ gap: xs
│   STATUS        Legendary                     │ row (8px vert padding, if rendered)
│                                               │
├───────────────────────────────────────────────┤
│ (16px bottom padding)                         │ paddingVertical
└───────────────────────────────────────────────┘
```

**Container:**
- `paddingHorizontal: 16px` (lg)
- `paddingVertical: 16px` (lg)

**Within container:**
- `gap: 4px` (xs) between all rows
- Section title: `marginBottom: 12px` (md)

**Per row:**
- `paddingVertical: 8px` (sm)
- `gap: 12px` (md) between label and value

### 5.2 Horizontal Spacing

```
[left margin 16px] [label 90px] [gap 12px] [value flex] [right margin 16px]
```

**Label:**
- Fixed width: 90px
- Right-aligned within that 90px space
- Preserves alignment across all rows

**Value:**
- `flex: 1` (fills remaining space)
- Left-aligned within flex space
- No maximum width constraint (wrapping allowed if text exceeds screen width)

---

## 6. Responsive Behavior

### 6.1 Breakpoints & Adjustments

| Breakpoint | Screen Width | Adjustments |
|-----------|--------------|------------|
| Mobile | 320–479px | Standard layout; label width 90px maintained |
| Mobile+ | 480–767px | No changes; same compact layout |
| Tablet | 768px+ | Option to increase label width to 110px if localized labels are longer; test before deploying |

### 6.2 Rotation Handling (Mobile)

- Portrait (320px wide): Standard vertical stack, all rows visible
- Landscape (667px wide): Same layout; info section may scroll up as user scrolls detail content down (expected behavior)

### 6.3 Localization Impact

**Current labels (English):**
- HEIGHT (6 chars)
- WEIGHT (6 chars)
- GENERATION (10 chars)
- GENDER (6 chars)
- STATUS (6 chars)

**90px label container:** At font size 11px with tight letter-spacing, supports ~12–14 characters comfortably.

**Localization considerations:**
- German "HÖHE" (4 chars) ✓ fits
- French "HAUTEUR" (7 chars) ✓ fits
- Spanish "ALTURA" (6 chars) ✓ fits
- Japanese labels (if implemented) will likely be shorter due to character efficiency ✓ fits
- Test with longest expected labels before deploying; adjust to 110px if needed

---

## 7. Edge Cases & Fallbacks

### 7.1 Missing Data

| Field | Condition | Display |
|-------|-----------|---------|
| Height | null or 0 | "Unknown" |
| Weight | null or 0 | "Unknown" |
| Generation | Invalid range | Numeric fallback (e.g., "10" for Gen X) |
| Gender Rate | -1 (genderless) | Gray pill, muted opacity |
| Gender Rate | undefined | Gray pill, muted opacity (treat as genderless) |
| Status | Neither legendary nor mythical | Row not rendered (flex space taken by other rows) |

### 7.2 Overflow Behavior

**Label Text:**
- Fixed width; no overflow expected with uppercase English labels
- If localized labels overflow 90px:
  - Reduce font size to 10px (not recommended; hurts readability)
  - Increase label width to 110px (recommended)
  - Abbreviate labels (e.g., "GEN" instead of "GENERATION")
  - Test before deployment

**Value Text:**
- Can wrap if necessary (rare; generation always fits, height/weight always short)
- Gender pill is fixed 80px width; no overflow
- Status text (Legendary/Mythical) is short; no overflow expected

### 7.3 Extreme Values

| Field | Extreme Value | Expected Display |
|-------|---------------|------------------|
| Height | 14.5 m (Eternatus max) | "14.5 m" ✓ fits easily |
| Weight | 9999.9 kg (hypothetical) | "9999.9 kg" ✓ fits in 1 line (worst case: 10 chars) |
| Generation | 1–9 (current max) | Single Roman numeral ✓ always 1 char |
| Gender | -1 (genderless) | Gray pill ✓ visually distinct |

---

## 8. Animation & Interaction

### 8.1 Static Component

- **No animations** on this component itself
- Gender pill is static (not interactive)
- Values do not animate when data changes

### 8.2 Interaction Handling

- **Non-interactive** — No tap handlers, no navigation
- **Accessibility focus** — Entire section is a single logical grouping for screen readers
- Future: Could add tappable legend/mythical badge to deep-link to related Pokemon (deferred to future phase)

### 8.3 Parent Scroll Context

- Info section is part of ScrollView content
- Parallax animations are handled by parent `PokemonHero` component
- This section scrolls normally (no parallax offset)

---

## 9. Accessibility Specifications

### 9.1 Semantic Structure

```html
<View accessibilityRole="group" accessibilityLabel="Pokémon Information">
  <Text accessibilityRole="header">Info</Text>
  
  <View accessibilityRole="text">
    <Text>Height: 0.7 meters</Text>
  </View>
  
  <View accessibilityRole="text">
    <Text>Weight: 6.9 kilograms</Text>
  </View>
  
  <View accessibilityRole="text">
    <Text>Generation: I</Text>
  </View>
  
  <View accessibilityRole="image" accessibilityLabel="Gender ratio: 75% male, 25% female">
    <!-- pill bar visual -->
  </View>
  
  <View accessibilityRole="text" accessibilityLabel="Legendary Status">
    <Text>Legendary</Text>
  </View>
</View>
```

### 9.2 Screen Reader Narration

| Element | VoiceOver Narration |
|---------|-------------------|
| Section header | "Info, section header" |
| Height | "Height, 0.7 meters" |
| Weight | "Weight, 6.9 kilograms" |
| Generation | "Generation, Roman numeral I" (or "Generation, one") |
| Gender pill (50/50) | "Gender ratio. 50% male, 50% female. Horizontal slider" |
| Gender pill (genderless) | "Gender ratio. Genderless. No gender distinction." |
| Status | "Legendary status. Legendary" or "Mythical status. Mythical" |

### 9.3 Implementation Notes

- Use `accessibilityLabel` for gender pill to vocalize ratio
- Use `accessibilityHint` on status row to explain significance if needed
- Ensure contrast ratios are met:
  - Labels (muted): `rgba(255,255,255,0.45)` on `#111010` → ~4.5:1 ✓ WCAG AA
  - Values (white): `#F5EEEE` on `#111010` → ~15:1 ✓ WCAG AAA
  - Gold (Legendary): `rgba(255,215,0,0.9)` on `#111010` → ~8:1 ✓ WCAG AA
  - Magenta (Mythical): `rgba(192,0,255,0.9)` on `#111010` → ~6:1 ✓ WCAG AA

### 9.4 Keyboard Navigation

- Section is not keyboard-interactive (non-editable content)
- Skip with Tab navigation or include in logical reading order
- Future: If interactive elements added (e.g., tap to view related Pokemon), ensure focus states are visible (minimum 2px outline)

---

## 10. Visual Connection to Adjacent Sections

### 10.1 Above: Type Badges

```
┌──────────────────────┐
│ [Grass] [Poison]     │  TypeBadge component
└──────────────────────┘
            ↓ (4px gap)
┌──────────────────────┐
│ INFO                 │  InfoStrip component ← this section
│ HEIGHT  0.7 m        │
│ ...                  │
└──────────────────────┘
```

**Spacing Between Type Badges and Info Section:**
- No explicit border or divider
- Natural visual separation via transparency and spacing
- 4px implicit gap (part of container structure)

### 10.2 Below: Abilities Section

```
┌──────────────────────┐
│ GENDER    [─────■─]  │  InfoStrip component ← this section
└──────────────────────┘
            ↓ (no gap; continuous)
┌──────────────────────┐
│ Abilities            │  Section title for abilities
│ [Overgrow]           │
│ [Chlorophyll]        │
└──────────────────────┘
```

**Spacing Between Info Section and Abilities:**
- **No gap** between bottom of InfoStrip and top of Abilities section
- Abilities section has its own top margin/padding
- Continuous visual flow; no explicit divider

### 10.3 Accent Bar (Left Border)

**Future Enhancement (not in initial spec):**
- Optional thin vertical line on the left edge of InfoStrip matching type color
- Would run from top of name/classification down through abilities section
- Provides subtle visual connection and type-based theming
- Currently deferred; can be added in design polish pass

---

## 11. Component Implementation Reference

### 11.1 Current Implementation (`InfoStrip.tsx`)

**File:** `/src/components/pokemon/InfoStrip.tsx` (246 lines, updated 2026-07-14)

**Props:**
```typescript
interface InfoStripProps {
  height: number | null;
  weight: number | null;
  generation: number;
  genderRate: number | undefined;
  isLegendary?: boolean;
  isMythical?: boolean;
  accentColor: string;  // Currently unused; reserved for future accent bar
}
```

**Component Structure:**
1. Optional Legendary/Mythical badge row (top)
   - Centered star/glyph + uppercase text
   - Gold or magenta color
   - Bottom divider
2. Main 4-column row: HEIGHT | WEIGHT | GEN | GENDER
   - flexDirection: row, gap: 16
   - Each column contains label + primary value + optional secondary value
   - Gender column includes pill bar visualization

**Key Implementation Details:**
- Utility functions:
  - `parseGenderRate(genderRate)` — Returns { malePercent, femalePercent, isGenderless }
  - `getRomanNumeral(gen)` — Converts generation (1–9) to Roman numerals
  - `toMetricHeight()`, `toImperialHeight()`, `toMetricWeight()`, `toImperialWeight()` — Unit conversions
- Gender bar: 6px height, proportional flex segments, 12px top margin for vertical centering
- All values use `—` (em-dash) as null/missing fallback
- Transparent background; no surface card styling

**Styling Approach:**
- Uses `StyleSheet.create()` for all styles
- All padding/gap values reference `spacing` constants
- All font sizes reference `fontSize` constants
- Colors from `colors` object (textMuted, text)
- Gender colors: hardcoded #6890F0 (male), #FF6FA0 (female), rgba(255,255,255,0.2) (genderless)
- Status colors: hardcoded gold and magenta rgba values

**Key Features Validated:**
- ✓ Single-row 4-column layout fits 320px screens
- ✓ Gender ratio visualized as proportional bar (not text)
- ✓ Imperial primary, metric secondary for height/weight
- ✓ Legendary/Mythical badge conditional render
- ✓ All label/value spacing and typography per spec
- ✓ Genderless handled as special case (gray bar, no percentages)

**Files Supporting Info Section:**
- `/src/components/pokemon/InfoStrip.tsx` — Main component
- `/src/utils/unitConversions.ts` — Height/weight format utilities
- `/src/constants/colors.ts` — Color tokens
- `/src/constants/spacing.ts` — Spacing scale

### 11.2 Usage in Detail Screen

**File:** `/app/(main)/(pokedex)/[id].tsx` (lines 288–296)

```typescript
<InfoStrip
  height={pokemon.height}
  weight={pokemon.weight}
  generation={pokemon.generation}
  genderRate={speciesData?.genderRate}
  isLegendary={pokemon.isLegendary}
  isMythical={pokemon.isMythical}
  accentColor={typeColors[pokemon.primaryType.toLowerCase()] ?? colors.primary}
/>
```

**Data Requirements:**
- `pokemon.height` (numeric, in meters, or null)
- `pokemon.weight` (numeric, in kg, or null)
- `pokemon.generation` (1–9)
- `speciesData?.genderRate` (-1, 0–8, or undefined)
- `pokemon.isLegendary` (boolean)
- `pokemon.isMythical` (boolean)

---

## 12. Design Tokens Summary

### 12.1 Spacing Scale

```typescript
const spacing = {
  xs: 4,      // row gap
  sm: 8,      // row padding-vertical
  md: 12,     // label-value gap, title margin-bottom
  lg: 16,     // container padding horizontal/vertical
};
```

### 12.2 Font Sizes

```typescript
const fontSize = {
  xs: 11,     // section title, labels
  sm: 13,     // unused in this component
  md: 15,     // row values
  lg: 17,     // unused in this component
  xl: 20,     // unused in this component
};
```

### 12.3 Color Palette

```typescript
const colors = {
  text: '#F5EEEE',                      // white values
  textMuted: 'rgba(255,255,255,0.45)',  // labels
  background: '#111010',                // dark background
};

const genderColors = {
  male: '#6890F0',      // water blue
  female: '#FF6FA0',    // pink
  genderless: 'rgba(255,255,255,0.45)', // muted
};

const statusColors = {
  legendary: 'rgba(255,215,0,0.9)',     // gold
  mythical: 'rgba(192,0,255,0.9)',      // magenta
};
```

---

## 13. QA Checklist

### 13.1 Visual Quality

- [ ] Section title "INFO" is uppercase, muted, 2px letter-spacing
- [ ] All labels are 90px wide, right-aligned, uppercase, 1px letter-spacing
- [ ] All values are bold (700 weight), bright white, sized 15px
- [ ] Gender pill is exactly 6px tall, 80px wide, with correct color segments
- [ ] Genderless variant shows gray pill with reduced opacity
- [ ] Legendary status shows in gold color
- [ ] Mythical status shows in magenta color
- [ ] No background fill visible behind any row
- [ ] Rows are evenly spaced (4px gap between each)

### 13.2 Data Accuracy

- [ ] Height displays with 1 decimal place + "m" (e.g., "0.7 m")
- [ ] Weight displays with 1 decimal place + "kg" (e.g., "6.9 kg")
- [ ] Unknown values display as "Unknown" (not blank, null, or N/A)
- [ ] Generation displays as correct Roman numeral (I–IX)
- [ ] Gender ratio calculations are accurate (male % + female % = 100%)
- [ ] Genderless Pokemon show gray pill, not empty
- [ ] Legendary/Mythical row only renders when flag is true
- [ ] Gender row always renders (even for genderless)

### 13.3 Responsiveness

- [ ] Layout fits on 320px wide screens (mobile)
- [ ] Layout fits on 767px wide screens (mobile+)
- [ ] Layout fits on 768px+ wide screens (tablet) without wrapping
- [ ] Label width remains stable (90px) across all breakpoints
- [ ] No horizontal scrolling required
- [ ] Text does not overflow value column

### 13.4 Localization

- [ ] English labels fit within 90px width
- [ ] Test with longest expected localized labels
- [ ] Plural forms handled (e.g., "1 meter" vs "2 meters" — currently always plural)
- [ ] Roman numerals work for all generations (I–IX)
- [ ] Gender colors are culturally appropriate (blue/pink acceptable globally or needs override)

### 13.5 Accessibility

- [ ] Gender pill has appropriate `accessibilityLabel` describing ratio
- [ ] Screen reader announces "Height: 0.7 meters" etc.
- [ ] All text meets WCAG AA contrast ratio (4.5:1 minimum)
- [ ] Focus states are visible if component becomes interactive (future)
- [ ] No color-only distinction for information (gender pill uses both position and color)

### 13.6 Edge Cases

- [ ] Tall Pokemon (14.5m+) display correctly
- [ ] Heavy Pokemon (9999kg hypothetically) display correctly
- [ ] Genderless Pokemon display gray pill
- [ ] Missing `genderRate` treated as genderless
- [ ] Missing `generation` shows graceful fallback
- [ ] Both legendary AND mythical flags true (if possible) — status row shows "Legendary" (mythical takes precedence in code; verify behavior)

### 13.7 Performance

- [ ] Component renders in <16ms (60fps target)
- [ ] No re-renders on parent scroll (scrolling is handled by parent parallax, not this component)
- [ ] Pill bar calculation (flex proportions) is efficient
- [ ] No memory leaks from formatters or utilities

---

## 14. Future Enhancements (Out of Scope)

1. **Accent bar (left border)** — Thin vertical line matching type color
2. **Tap-to-view** on Legendary/Mythical badge — Navigate to list of all legendary Pokemon
3. **Imperial units toggle** — Height in feet/inches, weight in pounds (user preference)
4. **Confidence indicator on gender** — If gender data is incomplete, show asterisk or note
5. **Hover states** (if desktop web support added) — Subtle background tint on row hover
6. **Animation on stat change** — If component updates in team builder context, subtle slide animation

---

## 15. Design Rationale & Philosophy

### 15.1 Why Vertical Stack?

- **Scannable:** Each data point on its own line, easy to read at a glance
- **Native feel:** Matches standard mobile UI patterns (settings screens, system info)
- **Scalable:** Easy to add or remove rows (status row already demonstrates this)
- **Responsive:** No complex grid layouts; works at any width

### 15.2 Why Fixed Label Width?

- **Alignment:** Values line up visually, creating pleasing rhythm
- **Predictable:** No layout shift when switching between Pokemon with different label lengths (if labels vary by language)
- **Professional:** Resembles form layouts in enterprise apps

### 15.3 Why Gender Pill Bar?

- **Visual:** Instantly communicates distribution (human brain processes proportional areas quickly)
- **Non-invasive:** Takes minimal space compared to text description
- **Accessible:** Still readable for colorblind users (male/female positioning provides cue)
- **Elegant:** Feels more sophisticated than "75% male / 25% female" text

### 15.4 Why Separate Status Row?

- **Special:** Legendary/Mythical are rare/notable; deserve emphasis
- **Optional:** Some Pokemon have no status; row only renders when applicable
- **Color-coded:** Distinct colors (gold/magenta) make them immediately identifiable
- **Non-cluttering:** Not mixed with standard measurements; feels premium

### 15.5 Why Transparent Background?

- **Cohesion:** Blends with dark screen; no visual boundary
- **Modern:** Matches contemporary design trends (no card surfaces everywhere)
- **Hierarchy:** Hero section (with backdrop) is prominent; info section is secondary
- **Flexible:** Allows type-color accent bar (future) to feel integrated without a container

---

## 16. Handoff Notes for Developers

### 16.1 Component Structure

```typescript
export const InfoStrip: React.FC<InfoStripProps> = ({
  height,
  weight,
  generation,
  genderRate,
  isLegendary,
  isMythical,
  accentColor,
}) => {
  // Parse gender rate → { malePercent, femalePercent, isGenderless }
  // Format height/weight using utility functions
  // Convert generation to Roman numeral
  
  // Render structure:
  // View (container)
  //   Text (section title "INFO")
  //   View (height row)
  //   View (weight row)
  //   View (generation row)
  //   View (gender row with pill bar)
  //   View (status row, if isLegendary || isMythical)
};
```

### 16.2 Styling Approach

- Use `StyleSheet.create()` for all styles
- Define color tokens as hex strings or rgba
- Use spacing constants for all padding/gap values
- Test on both iOS and Android for spacing consistency

### 16.3 Testing Strategy

1. **Snapshot test:** Verify rendered structure doesn't change
2. **Visual regression:** Screenshot on iOS and Android devices
3. **Data permutation test:** Test all gender rate values (-1, 0, 1–8)
4. **Legendary/Mythical combinations:** Test both true/false/both states
5. **Localization test:** Render with longest expected labels
6. **Accessibility audit:** Screen reader narration, contrast ratios, touch targets

### 16.4 Known Constraints

- Label width is fixed at 90px; may need adjustment for very long localized labels
- Gender rate values are fixed range 0–8 per PokeAPI spec
- Roman numerals only support generations 1–9; fallback needed for future
- No wrapping or truncation of labels expected; long labels should be avoided

---

## 17. Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-07-14 | UI Designer | Initial spec; validates existing `InfoStrip` component, provides detailed implementation reference and QA checklist |

---

**END OF SPECIFICATION**

This design spec is production-ready and approved for implementation. The `InfoStrip` component is already implemented correctly; this document serves as the authoritative reference for visual accuracy, accessibility compliance, and future maintenance.
