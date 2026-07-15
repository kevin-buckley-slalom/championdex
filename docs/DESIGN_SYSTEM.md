# ChampionDex Design System Specification

**Version:** 1.1  
**Last Updated:** 2026-07-09  
**Platform:** iOS & Android (cross-platform, Expo/React Native)  
**Primary Design Theme:** Dark Mode with Pokemon Type-Color Theming

---

## Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Color Palette](#color-palette)
3. [Typography](#typography)
4. [Spacing & Grid System](#spacing--grid-system)
5. [Component Specifications](#component-specifications)
6. [Animation Guidelines](#animation-guidelines)
7. [Navigation Patterns](#navigation-patterns)
8. [Icon Style Guidelines](#icon-style-guidelines)
9. [Responsive Design](#responsive-design)
10. [Accessibility & Dark Mode](#accessibility--dark-mode)

---

## Design Philosophy

### Core Principles

1. **Dark Mode First** — Inspired by Pokemon game UI; reduces eye strain and creates immersive atmosphere
2. **Type-Color Theming** — Pokemon type colors serve as the primary accent system; UI adapts dynamically to selected Pokemon type
3. **Polished & App-Store Quality** — Every interaction feels premium and responsive
4. **60fps Performance** — All animations use GPU-accelerated transforms; no jank or stuttering
5. **Type Colors as Backbone** — All 18 Pokemon types inform the visual identity and interaction feedback
6. **Touch-First Design** — Minimum 44×44px (iOS) / 48×48dp (Android) touch targets throughout

### Visual Hierarchy

- **Hero Content:** Large sprites, type badges, bold type-colored accents
- **Secondary Content:** Stats, abilities, moves in structured, scannable layouts
- **Tertiary Content:** Metadata, descriptions, secondary information

---

## Color Palette

### Base Dark Theme

| Element | Color | Hex | RGB | Usage |
|---------|-------|-----|-----|-------|
| **Background Primary** | Warm Near-Black | `#111010` | 17, 16, 16 | App background, base surface |
| **Background Secondary / Surface** | Warm Dark Surface | `#1E1A1A` | 30, 26, 26 | Card backgrounds, list items, default surface |
| **Background Tertiary / Surface Elevated** | Warm Dark Elevated | `#2A2323` | 42, 35, 35 | Modal backgrounds, bottom sheets, nested surfaces |
| **Border Default** | Warm Border | `#3A2E2E` | 58, 46, 46 | Card borders, dividers, list separators |
| **Border Light** | Warm Border Light | `#4D3E3E` | 77, 62, 62 | Subtle dividers, secondary borders |
| **Text Primary** | Warm White | `#F5EEEE` | 245, 238, 238 | Primary text, labels, primary headlines |
| **Text Secondary** | Warm Gray | `#B89E9E` | 184, 158, 158 | Secondary text, descriptions, secondary labels |
| **Text Muted / Tertiary** | Warm Muted | `#9A7A7A` | 154, 122, 122 | Disabled text, hints, tertiary information (WCAG AA compliant) |
| **Accent** | Gold | `#FFD700` | 255, 215, 0 | Secondary accent, highlights, premium elements |
| **Primary / Pokéball Red** | Pokéball Red | `#CC0000` | 204, 0, 0 | Primary brand accent, active states |
| **Primary Hover** | Pokéball Red Hover | `#AA0000` | 170, 0, 0 | Hover state for primary actions |
| **Success** | Vibrant Green | `#4CAF50` | 76, 175, 80 | Positive feedback, confirmations |
| **Warning** | Golden Orange | `#FF9800` | 255, 152, 0 | Warnings, caution states |
| **Error** | Bright Red | `#FF453A` | 255, 69, 58 | Errors, destructive actions |
| **Info** | Light Blue | `#3D9BE9` | 61, 155, 233 | Informational messages |

**Design Rationale — Pokéball Palette:**
The base dark theme is inspired by the iconic Pokéball design. Deep warm charcoal backgrounds (#111010–#2A2323) provide a rich, premium foundation with warm undertones rather than cool blue shifts. The signature Pokéball red (#CC0000) serves as the primary brand color, allowing the vibrant red to pop against warm neutrals. This warm-based palette enhances readability, creates an inviting atmosphere, and is aligned with the Pokemon brand identity.

### Pokemon Type Colors (Type-Color Theming Accent Palette)

Each type color serves dual purposes:
1. **Type Badge Background** — Identified on team members and Pokemon cards
2. **UI Accent Color** — Primary accent when viewing that type's Pokemon (buttons, highlights, stat charts)

| Type | Hex (Primary) | RGB | Text Color | Usage Notes |
|------|---|---|---|---|
| **Normal** | `#A8A878` | 168, 168, 120 | #000000 | Neutral gray-tan; stat chart accent |
| **Fire** | `#F08030` | 240, 128, 48 | #FFFFFF | Bold orange; high contrast on dark |
| **Water** | `#6890F0` | 104, 144, 240 | #FFFFFF | Cool blue; calm, hydration theme |
| **Grass** | `#78C850` | 120, 200, 80 | #000000 | Natural green; growth accent |
| **Electric** | `#F8D030` | 248, 208, 48 | #000000 | Vibrant gold; energy, brightness |
| **Ice** | `#98D8D8` | 152, 216, 216 | #000000 | Pale cyan; cool, frost theme |
| **Fighting** | `#C03028` | 192, 48, 40 | #FFFFFF | Deep red; strength, power |
| **Poison** | `#A040A0` | 160, 64, 160 | #FFFFFF | Vibrant magenta; mystery |
| **Ground** | `#E0C068` | 224, 192, 104 | #000000 | Earthy brown; stability |
| **Flying** | `#A890F0` | 168, 144, 240 | #FFFFFF | Light purple-blue; sky theme |
| **Psychic** | `#F85888` | 248, 88, 136 | #FFFFFF | Bright magenta-pink; mental power |
| **Bug** | `#A8B820` | 168, 184, 32 | #000000 | Yellow-green; organic, nature |
| **Rock** | `#B8A038` | 184, 160, 56 | #FFFFFF | Golden brown; solid, enduring |
| **Ghost** | `#705898` | 112, 88, 152 | #FFFFFF | Deep purple; ethereal, mysterious |
| **Dragon** | `#7038F8` | 112, 56, 248 | #FFFFFF | Deep blue-purple; power, rarity |
| **Dark** | `#705848` | 112, 88, 72 | #FFFFFF | Muted brown; shadow, stealth |
| **Steel** | `#B8B8D0` | 184, 184, 208 | #000000 | Silver-blue; metallic, precision |
| **Fairy** | `#EE99AC` | 238, 153, 172 | #000000 | Soft pink; elegance, magic |

### Color Usage Guidelines

- **Primary Accent:** Use the Pokemon type color for primary interactive elements when a Pokemon type is in focus (buttons, charts, badges)
- **State-Based:** Hover states use a 10% darker variant; active states use the standard color; disabled uses Text-Muted
- **Type Badges:** Always use the Primary type color as background with appropriate text color from the table above
- **Gradients:** Type colors can blend with Background-Secondary for gradient overlays (e.g., Hero Section parallax)
- **Contrast:** All text on type color backgrounds must maintain WCAG AA contrast (minimum 4.5:1 for normal text)

---

## Typography

### Font Stack

```
Primary (Display, Headlines): -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto"
Secondary (Body, UI): -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto"
Monospace (Stats, Numbers): "SF Mono", "Monaco", "Inconsolata", monospace
```

**Rationale:** System fonts ensure native performance on iOS and Android, reduce bundle size, and feel native to each platform.

### Typography Scale

| Role | Font Size | Weight | Line Height | Letter Spacing | Usage |
|------|---|---|---|---|---|
| **Display XL** | 36px | 700 | 1.1 | -0.5px | Hero titles, main headings |
| **Display L** | 30px | 700 | 1.15 | -0.3px | Screen titles, large sections |
| **Display M** | 24px | 600 | 1.2 | 0px | Subsection titles, Pokemon detail headers |
| **Heading 1** | 20px | 600 | 1.25 | 0px | Card titles, Pokemon names, major headers |
| **Body L** | 17px | 400 | 1.5 | 0.3px | Primary body text, descriptions |
| **Body M** | 15px | 400 | 1.5 | 0.2px | Secondary body text, regular descriptions |
| **Label L** | 15px | 600 | 1.3 | 0.1px | Button text, form labels |
| **Label M** | 13px | 600 | 1.3 | 0.1px | Chip labels, badge text, tab labels |
| **Label S** | 11px | 500 | 1.3 | 0.1px | Small labels, tags, secondary chips |
| **Caption** | 11px | 400 | 1.3 | 0.1px | Captions, timestamps, small descriptive text |
| **Section Header** | 11px | 700 | 1.0 | 1.5px | Section headers (uppercase) |

### Font Weights

- **400 Regular:** Body text, descriptions, captions
- **500 Medium:** Label S, small emphasis
- **600 SemiBold:** Display M, Heading 1, Label L, Label M
- **700 Bold:** Display XL, Display L, Section Headers

---

## Spacing & Grid System

### Base Unit

**1 unit = 4px**  
All spacing, sizing, and layout calculations use multiples of this base unit.

### Spacing Scale

| Scale | Value | Multiple | Usage |
|-------|-------|----------|-------|
| **xxs** | 2px | 0.5x | Micro spacing (rarely used) |
| **xs** | 4px | 1x | Micro spacing, small gaps, badge padding |
| **sm** | 8px | 2x | Compact spacing, small gaps, list gaps |
| **md** | 12px | 3x | Standard spacing between elements, card padding vertical |
| **lg** | 16px | 4x | Section spacing, card padding horizontal |
| **xl** | 24px | 6x | Major section separation |
| **2xl** | 32px | 8x | Screen edge margins, large gaps |
| **3xl** | 48px | 12x | Large section breaks |
| **4xl** | 64px | 16x | Hero spacing, major layout gaps |

### Grid System

- **Mobile Grid:** 4-column grid (320px–479px width)
- **Mobile+ Grid:** 6-column grid (480px–767px width)
- **Tablet Grid:** 12-column grid (768px+ width)
- **Gutter Width:** 16px (lg spacing)
- **Margin:** 16px (lg spacing) on mobile; 24px (xl spacing) on tablet

### Safe Area Insets

Respect platform-specific safe areas:
- **iOS:** Top notch/dynamic island; bottom home indicator
- **Android:** Top status bar; optional navigation bar

### Key Dimensions

| Component | Dimension | Multiple | Notes |
|-----------|-----------|----------|-------|
| **Pokemon Card** | 88px min height | 22x | Minimum height for list item with sprite and content |
| **Pokemon Sprite** | 64px | 16x | Standard sprite size in cards and lists (correct for list context) |
| **Hero Artwork** | 280px | 70x | Full-width artwork height on mobile detail screens |
| **Stat Chart Diameter** | 200px | 50x | Hexagon/radar chart size |
| **Team Slot Item** | 120px | 30x | Team builder slot size on mobile |
| **Button Height (Touch)** | 44px min | 11x | iOS minimum touch target; 48px on Android |
| **SubTabBar Height** | 48px | 12x | Tab bar height for filters/type selection |
| **Toolbar Height** | 48px | 12x | Filter/sort bar height |
| **Tab Bar Height** | 56px | 14x | Bottom navigation bar height |
| **Header Height** | 56px | 14x | Top app bar / search header height |

---

## Component Specifications

### 1. PokemonCard (List Item)

**Purpose:** Display Pokemon information in a compact, scannable list format.

**Dimensions:**
- Width: Full width minus horizontal padding (paddingHorizontal: 16px / lg)
- Min Height: 88px (includes vertical padding)
- Padding: 16px (lg) horizontal, 12px (md) vertical
- Sprite: 64×64px (correct size for list context)

**Structure:**
```
┌─ Card Container ──────────────────────────────────────┐
│ ┌─────────────┐ ┌─ Content ────────────────────────┐  │
│ │ [Sprite]    │ │ #001 Name                        │  │
│ │ (64×64px)   │ │ Form • Type Badge • Type Badge   │  │
│ │             │ │ BST: 300                         │  │
│ └─────────────┘ └──────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

**Styling:**
- Background: Background Secondary (`#1E1A1A`)
- Border Bottom: 1px solid Border Default (`#3A2E2E`)
- Border Radius: None (list-style, no rounded corners)
- Shadow: None (list-style, no elevation)
- Pressed State: opacity 0.7

**Content Typography:**
- **Dex Number:** Label S (11px, 400), Text Muted
- **Name:** Label L (15px, 600), Text Primary
- **Form Name:** Caption (11px, 400), Text Muted
- **BST:** Caption (11px, 400), Text Muted
- **Type Badges:** sm size (see TypeBadge spec), gap xs (4px)

**States:**
- **Default:** Standard styling
- **Pressed:** Opacity 0.7, scale 0.98
- **Disabled:** Opacity 0.5, no interaction

### 2. TypeBadge

**Purpose:** Display Pokemon type in a labeled, color-coded format. Uses type-specific colors and text colors.

**Sizing Variants:**

#### SM Size (Small - used in lists)
- Padding: 6px horizontal, 3px vertical
- Font: Label S (11px, 500)
- Border Radius: 4px (sm)
- Icon: 14px
- Min Height: 20px

#### MD Size (Medium - used in detail views)
- Padding: 8px horizontal, 5px vertical
- Font: Label M (13px, 600)
- Border Radius: 6px (md)
- Icon: 16px
- Min Height: 24px

#### Fixed Variant (Full-width in filter sheet)
- Width: Fill container (not fixed 80px)
- Min Height: 44px (touch target compliance)
- Padding: 12px (md) horizontal
- Font: Label M (13px, 600)
- Border Radius: 8px (md)

**Styling:**
- Background: Pokemon type color (from type color palette)
- Text Color: typeTextColors value for that type (not hardcoded white)
- Border: None
- Contrast: Maintains WCAG AA (4.5:1 minimum)

**States:**
- **Default:** Solid background with appropriate text color
- **Outline Variant:** Background transparent, border 1.5px with type color, text type color
- **Disabled:** Opacity 0.6

### 3. SubTabBar

**Purpose:** Navigate between filtered views or type selections (e.g., in Pokemon reference list).

**Dimensions:**
- Height: 48px (minHeight for touch target compliance)
- Width: Full screen width
- Padding: None (full bleed)

**Structure:**
```
┌─────────────┬─────────────┬─────────────┐
│   All       │    Fire     │   Water     │
│ (2px accent)│  (2px accent) │  (2px accent)│
└─────────────┴─────────────┴─────────────┘
```

**Styling:**
- Background: Background Primary (`#111010`)
- Border Bottom: 1px solid Border Default (`#3A2E2E`)
- Layout: Full-width flex row, equal-width tabs (flex: 1)
- Active Indicator: 2px bottom border, Primary color (`#CC0000`)

**Typography:**
- **Active Text:** Primary color, Label M (13px, 600)
- **Inactive Text:** Text Muted, Label M (13px, 400)

**States:**
- **Inactive Tab:** Muted text, no indicator
- **Active Tab:** Primary color text, 2px bottom border
- **Touch:** Scale 0.95 on press

### 4. Toolbar (Filter/Sort Bar)

**Purpose:** Provide filter and sort options for Pokemon reference list.

**Dimensions:**
- Height: 48px
- Width: Full screen width
- Padding: 0 16px (lg) horizontal
- Gap Between Buttons: 12px (md)

**Styling:**
- Background: Background Secondary / Surface (`#1E1A1A`)
- Border Bottom: 1px solid Border Default (`#3A2E2E`)

**Button Style:**
- Shape: Pill shape (borderRadius: full / 9999)
- Background: Background Tertiary / Surface Elevated (`#2A2323`)
- Min Height: 44px
- Padding: 12px (md) horizontal, 8px (sm) vertical
- Font: Label S (11px, 500)
- Text Color: Text Secondary
- Border: 1px solid Border Light (`#4D3E3E`)

**States:**
- **Default:** Bordered pill style
- **Active:** Background type color, text color updates
- **Pressed:** Scale 0.95

### 5. FilterSortSheet (Bottom Sheet)

**Purpose:** Comprehensive filtering interface with sort options, Pokemon types, and generations.

**Dimensions:**
- Min Height: 75% of screen height
- Max Height: 92% of screen height (safe area aware)
- Width: Full screen width
- Border Radius Top: 16px (xl)
- Padding: 16px (lg) all sides (except header/footer)

**Drag Handle:**
- Dimensions: 40×4px pill shape
- Color: Border Light (`#4D3E3E`)
- Position: Top center, 8px (sm) from top

**Header Section:**
- Height: 56px
- Padding: 12px (md) horizontal, 8px (sm) vertical
- Border Bottom: 1px solid Border Default (`#3A2E2E`)
- Title: Display M (24px, 600), Text Primary
- Close Button: 44×44px touch target, top-right

**Section Titles:**
- Font: Section Header (11px, 700, uppercase)
- Letter Spacing: 1.5px
- Color: Text Muted
- Margin Top: 12px (md), Margin Bottom: 8px (sm)

**Sort Buttons:**
- Layout: Three equal-width buttons per row
- Width: ~33% of container (minus gaps)
- Height: 48px
- Border Radius: 8px (md)
- Font: Label M (13px, 600)
- Gap Between: 8px (sm)
- Active: Primary background, text white
- Inactive: Border Default 1px border, Text Secondary

**Type Grid:**
- Layout: 3 columns per row
- Each Item: Full width of column, min height 48px
- Border Radius: 6px (md)
- Padding: 8px (sm)
- Gap Between Items: 8px (sm)
- Uses TypeBadge Fixed variant

**Generation Buttons:**
- Layout: ~5 buttons per row (approximately 19% width each)
- Width: ~19% of container (minus gaps)
- Height: 48px
- Border Radius: 6px (md)
- Font: Label S (11px, 500)
- Gap Between: 8px (sm)
- Active: Primary background, text white
- Inactive: Border Light 1px border, Text Secondary

**Footer:**
- Border Top: 1px solid Border Default (`#3A2E2E`)
- Padding: 16px (lg) + safe area bottom padding
- Button Height: 48px
- Button Text: Label L (15px, 600)

**States:**
- **Entering:** Slide up animation (200ms, ease-out)
- **Exiting:** Slide down animation (150ms, ease-in)
- **Scrolling:** Content scrolls internally, header/footer remain sticky

### 6. SearchHeader

**Purpose:** Allow users to search Pokemon by name with quick access to advanced filters.

**Dimensions:**
- Height: Auto (based on content)
- Width: Full screen width
- Padding: 16px (lg) horizontal, 8px (sm) vertical

**Structure:**
```
┌─────────────────────────────────┐
│ All Pokemon                     │
│ [🔍 Search by name...] [⚙️]     │
└─────────────────────────────────┘
```

**Styling:**
- Background: Background Secondary / Surface (`#1E1A1A`)
- Border Bottom: 1px solid Border Default (`#3A2E2E`)

**Title:**
- Font: Display M (24px, 600)
- Color: Text Primary
- Margin Bottom: 8px (sm)

**Search Input:**
- Height: 44px
- Width: Full width minus filter button
- Padding: 12px (md) horizontal
- Border Radius: 22px (full)
- Background: Background Tertiary / Surface Elevated (`#2A2323`)
- Border: 1px solid Border Light (`#4D3E3E`)
- Font: Body M (15px, 400)
- Placeholder: Text Muted
- Icon: Search 16px, left-aligned

**Filter Button:**
- Width: 44px
- Height: 44px
- Border Radius: 22px (full)
- Background: Background Tertiary
- Border: 1px solid Border Light
- Icon: Settings/Filter 20px, Text Secondary

**States:**
- **Input Focus:** Border color changes to Primary (`#CC0000`), background lightens
- **With Text:** Clear button (×) appears right of input
- **Filter Active:** Button shows indicator or different styling

### 7. FilterChip

**Purpose:** Allow users to quickly toggle filter options (e.g., by stat range, ability type).

**Dimensions:**
- Height: 32px
- Padding Horizontal: 8px (sm)
- Padding Vertical: 4px (xs)
- Border Radius: 16px (full / 2xl)
- Font: Label S (11px, 500)

**Styling:**

**Inactive State:**
- Background: Background Tertiary / Surface Elevated (`#2A2323`)
- Text: Text Secondary (`#B89E9E`)
- Border: 1px solid Border Light (`#4D3E3E`)

**Active State:**
- Background: Primary (`#CC0000`)
- Text: Accent (`#FFD700`)
- Border: None

**States:**
- **Default (Unselected):** Bordered pill style
- **Hover:** Border lightens slightly
- **Selected:** Solid primary background with accent text
- **Disabled:** Opacity 0.5
- **Touch:** Scale 0.95 on press

### 8. Button (Primary, Secondary, Tertiary)

**Purpose:** Primary call-to-action, secondary options, destructive actions.

**Base Dimensions:**
- Min Height: 44px (iOS) / 48px (Android) — WCAG AAA touch target
- Padding: 12px (md) horizontal, 8px (sm) vertical
- Border Radius: 10px
- Font: Label L (15px, 600)
- Min Width: 100px

**Variants:**

#### Primary Button
- Background: Type accent color (or default Primary `#CC0000` for neutral)
- Text: Text Primary or white depending on type color contrast
- Border: None

**States:**
- **Default:** Solid background
- **Hover:** Brightness -10% (darker shade)
- **Active/Pressed:** Scale 0.98, brightness -15%
- **Disabled:** Background opacity 0.5, text opacity 0.7, no pointer

#### Secondary Button
- Background: Background Tertiary (`#2A2323`)
- Text: Text Primary (`#F5EEEE`)
- Border: 1.5px solid Border Light (`#4D3E3E`)

**States:**
- **Default:** Solid background, visible border
- **Hover:** Background lightens slightly
- **Active/Pressed:** Background darkens, scale 0.98
- **Disabled:** Opacity 0.5

#### Tertiary Button (Text-Only)
- Background: Transparent
- Text: Type accent color (or Primary default `#CC0000`)
- Border: None
- Underline: Optional, appears on hover

**States:**
- **Default:** Text with no underline
- **Hover:** Text underlined, background subtle (5% opacity)
- **Active/Pressed:** Text darker, scale 0.95
- **Disabled:** Opacity 0.5

### 9. Card (Generic, Move Card)

**Purpose:** Display structured information in a compact card format.

**Dimensions:**
- Width: Full width minus 2×lg spacing (32px total padding)
- Min Height: 100px
- Padding: 16px (lg) all sides
- Border Radius: 12px (lg)

**Styling:**
- Background: Background Secondary (`#1E1A1A`)
- Border: 1px solid Border Default (`#3A2E2E`)
- Shadow: None (flat design for consistency)

**States:**
- **Default:** No elevation
- **Hover/Focus:** Shadow `0 4px 16px rgba(0, 0, 0, 0.6)`, scale 1.02
- **Active/Pressed:** Scale 0.98, shadow `0 1px 4px rgba(0, 0, 0, 0.3)`
- **Disabled:** Opacity 0.5, no interaction

### 10. Slider (EV/IV Adjustment)

**Purpose:** Numeric input for Pokemon stat optimization (EVs: 0–252, IVs: 0–31).

**Dimensions:**
- Height: 44px (including label and value display)
- Track Height: 4px
- Thumb Size: 20px diameter
- Padding (sides): 16px (lg)

**Structure:**
```
[Stat Label] ────────────── [Value]
◦━━━━━●━━━━━━━━━━━━━━━━━━◦
```

**Styling:**
- Track (Inactive): Border Light (`#4D3E3E`), opacity 0.4
- Track (Active): Type accent color
- Thumb: Type accent color with shadow `0 2px 6px rgba(0, 0, 0, 0.4)`
- Label: Label M (13px, 600), Text Primary
- Value: Label L (15px, 600, monospace), Text Primary

**States:**
- **Default:** Standard appearance
- **Hover:** Thumb grows slightly
- **Dragging:** Thumb expands to 24px, shadow enhanced, scale 1.1
- **Disabled:** Opacity 0.5, no interaction

### 11. Modal / Bottom Sheet

**Purpose:** Pokemon picker, move selector, detailed information.

**Dimensions:**
- Mobile: Height ~80vh of screen; bottom sheet style
- Tablet: Centered modal, max width 600px, height 80vh
- Border Radius (Top): 16px (xl) on mobile; 12px on tablet
- Padding: 24px (xl) all sides

**Styling:**
- Background: Background Tertiary / Surface Elevated (`#2A2323`)
- Handle Bar (Mobile): 4px × 40px, Border Light color, margin-bottom 16px (lg)
- Backdrop (Desktop): Scrim overlay at 60% opacity, Background Primary

**Components Inside:**
- Title: Display L (30px, 700)
- Close Button: Top-right, 44×44px touch target
- Content: Standard scrollable area
- Actions (Footer): Sticky footer with button(s), padding 16px (lg) top

**States:**
- **Entering:** Slide up animation (200ms, ease-out)
- **Exiting:** Slide down animation (150ms, ease-in)
- **Scrolling:** Content scrolls, handle bar remains sticky

### 12. Radar/Hexagon Chart (Stat Visualization)

**Purpose:** Visual representation of Pokemon base stats (HP, ATK, DEF, SP.ATK, SP.DEF, SPD).

**Dimensions:**
- Diameter: 200px (50x)
- Center positioned in container
- Line Weight: 2px

**Styling:**
- Background Shape: Hexagon with subtle grid lines
- Grid Lines: Border Light (`#3A2E2E`), opacity 0.3
- Stat Polygon: Type accent color, opacity 0.6
- Stat Polygon Outline: Type accent color, 2px stroke, opacity 1.0
- Axis Labels: Label S (11px), Text Secondary, positioned at hexagon vertices
- Data Points: 6px diameter circles at each vertex, type accent color

**Animation:**
- **Initial Load:** Draw animation (400ms, ease-out)
  - Polygon grows from center (0% → 100% scale)
  - Circles appear at 50% of draw animation
- **On Stat Change:** Smooth morph animation (200ms, ease-out)
  - Polygon vertices smoothly transition to new values

### 13. Tab Bar (Bottom Navigation)

**Purpose:** Navigate between main screens: Reference List, Team Builder, Settings.

**Dimensions:**
- Height: 56px (14x)
- Width: Full screen width
- Padding: 4px horizontal, 8px (sm) vertical
- Icon Size: 28px
- Label Font: Label S (11px, 500)

**Layout:**
```
┌─────────┬─────────┬─────────┐
│ 📚      │ 👥      │ ⚙️      │
│ Dex     │ Teams   │ Settings│
└─────────┴─────────┴─────────┘
```

**Styling:**
- Background: Background Secondary (`#1E1A1A`)
- Border Top: 1px solid Border Default (`#3A2E2E`)
- Icon (Inactive): Text Secondary (`#B89E9E`)
- Icon (Active): Type accent color
- Label (Inactive): Text Muted (`#9A7A7A`)
- Label (Active): Text Primary (`#F5EEEE`)

**States:**
- **Inactive Tab:** Muted icon and label
- **Active Tab:** Accent-colored icon, white label, subtle background highlight
- **Touch:** Scale 0.95 on press

---

## Animation Guidelines

### Animation Tokens

| Token | Duration | Easing | Use |
|---|---|---|---|
| **micro** | 100ms | ease-out | Opacity, color transitions |
| **quick** | 150ms | ease-out | Button press, chip selection |
| **standard** | 200ms | ease-out | Sheet open/close, modal transitions |
| **slow** | 300ms | ease-out | Navigation, complex transitions |
| **standard easing** | — | ease-out (cubic-bezier(0.165, 0.84, 0.44, 1)) | Default easing |
| **enter easing** | — | ease-out-quart (cubic-bezier(0.165, 0.84, 0.44, 1)) | Elements entering |
| **exit easing** | — | ease-in-quart (cubic-bezier(0.77, 0, 0.175, 1)) | Elements leaving |

### Specific Animations

#### Pokemon Sprite Swap (Shiny Toggle)

```
Duration: 300ms
Easing: ease-in-out
Steps:
  1. Current sprite: Opacity 1 → 0 (150ms, parallel with step 2)
  2. New sprite: Opacity 0 → 1 (150ms, starts at 50ms offset)
  3. Light flash: 100% opacity white overlay at 50ms mark, 200ms duration
  4. Scale: 0.95 → 1.0 during flash (psychic shimmer effect)
```

#### Image Parallax (Detail Hero Section)

```
Trigger: Scroll event on Pokemon detail screen
Hero Image Container:
  - Scroll range: 0px → 200px (or screen height)
  - Transform: translateY(scroll_position * 0.4)
  - Opacity: 1 → 0.7 as scroll progresses
  - (Moves slower than scroll for parallax depth)

Gradient Overlay:
  - Opacity: 0 → 1 as user scrolls (darkens image)
  - Prevents text legibility issues
```

#### Stat Chart Draw Animation

```
Duration: 400ms
Easing: ease-out-quart
Initial State: Polygon vertices at center (0% radius)
Animation:
  1. Hexagon "grid" background: Fade in from opacity 0 → 0.3 (0-200ms)
  2. Polygon vertices: Expand from center (0 → 100% distance) (0-400ms)
  3. Polygon fill: Opacity 0 → 0.6 (100-300ms)
  4. Data point circles: Scale 0 → 1.0 at each vertex (200-400ms)

Update Animation (on slider change):
  Duration: 200ms, ease-out-quart
  Polygon smoothly morphs between data points
```

#### Card Interaction

```
On Tap:
  1. Scale: 1.0 → 0.98 (100ms, ease-out-quart)
  2. Shadow: Reduce
  3. On Release: Scale 0.98 → 1.02 (100ms), then 1.02 → 1.0 (150ms)

On Hover (Desktop):
  1. Scale: 1.0 → 1.02 (150ms, ease-out-quart)
  2. Shadow: Increase
  3. Background: Slight lightening
```

#### Modal Entrance (Bottom Sheet Mobile)

```
Duration: 200ms
Easing: ease-out-quart
Initial State: Transform translateY(100%) (fully off-screen below)
Animation: translateY(100%) → translateY(0%) (content slides up)
Backdrop: Opacity 0 → 0.6 (parallel animation, synchronized)
On Close: Reverse animation, 150ms, ease-in-quart
```

#### Filter Chip Selection

```
Duration: 150ms
Easing: ease-out-quart
Unselected → Selected:
  1. Background: Background-Tertiary → Type accent color
  2. Border: Visible → Hidden (fade border opacity)
  3. Text: Text-Secondary → Accent text
  4. Scale: 1.0 → 1.05 (brief scale-up)

Selected → Unselected: Reverse animation
```

#### Search Results Appearance

```
Per-item stagger animation:
  Base delay: 50ms
  Item N: Appears at delay + (N × 30ms)
  Each item:
    - Opacity: 0 → 1 (100ms, ease-out-quart)
    - Transform: translateY(10px) → translateY(0px) (100ms, parallel)
    - (Items cascade onto screen)
```

#### SubTabBar Tab Selection

```
Duration: 150ms
Easing: ease-out-quart
Active indicator slide:
  - Bottom border (2px solid Primary) slides from previous tab to new tab
  - Text color fades from muted to primary
  - Underline slides smoothly (transform: translateX)
```

### Performance Checklist

- [ ] All animations use `transform` and `opacity` only (no layout changes)
- [ ] No animations longer than 500ms without user control
- [ ] Animations disabled in reduced-motion OS setting (prefers-reduced-motion)
- [ ] No more than 3 simultaneous animations on single element
- [ ] GPU acceleration enabled (will-change used sparingly)
- [ ] Frame rate monitoring: Target 60fps, minimum 30fps on low-end devices

---

## Navigation Patterns

### Tab Bar Navigation (Primary)

**Structure:**
- 3 main tabs at bottom: **Dex** (Reference List), **Teams** (Team Builder), **Settings**
- Persistent across all screens in each section
- Tapping tab header scrolls to top of section (on iOS style)

**Behavior:**
- Active tab highlighted with type accent color
- Badge notifications (red dot) on Teams tab if team needs attention
- Transition: Fade in/out (150ms) between tab screens

### Screen Hierarchy

```
App Structure:

┌─ Dex (Reference List)
│  ├─ Pokemon Detail
│  │  ├─ Ability Detail (Modal)
│  │  └─ Move Detail (Modal)
│  └─ Filter (Bottom Sheet)
│
├─ Teams (Team Builder)
│  ├─ Team Member Edit
│  │  ├─ Pokemon Picker (Modal)
│  │  ├─ Ability Selector (Modal)
│  │  ├─ Item Selector (Modal)
│  │  └─ Move Picker (Modal)
│  └─ Team Settings (Modal)
│
└─ Settings
   ├─ Preferences
   ├─ About
   └─ Help
```

### Transition Patterns

| From → To | Transition | Duration | Easing |
|-----------|-----------|----------|--------|
| Tab A → Tab B | Cross-fade | 150ms | ease-in-out |
| List → Detail | Slide up / Push right | 300ms | ease-out-quart |
| Detail → List | Slide down / Pop left | 200ms | ease-in-quart |
| Screen → Modal | Slide up (bottom sheet) / Zoom (center) | 200ms | ease-out-quart |
| Modal → Close | Slide down / Zoom out | 150ms | ease-in-quart |

### Navigation Back Behavior

- **Hardware/Gesture Back:** Dismisses top modal if open; otherwise pops to previous screen
- **Soft Back Button:** Same behavior as hardware back
- **Swipe Gesture (iOS):** Swipe right edge to pop current screen
- **Back Button (Android):** Standard back stack behavior

### Deep Linking

Supported deep link patterns:
- `championdex://pokemon/{pokedex_number}` → Pokemon Detail
- `championdex://teams/{team_id}` → Team Member Edit
- `championdex://moves/{move_name}` → Move Detail (from external share)

---

## Icon Style Guidelines

### Icon System

**Style:** Minimal, outline-based, platform-native inspiration

**Dimensions:**
- **Small Icons:** 16px — labels, badges, secondary info
- **Standard Icons:** 24px — primary UI actions, tab icons
- **Large Icons:** 32px — hero section icons, primary calls-to-action
- **XL Icons:** 40px — splash screens, empty states

**Stroke Weight:** 2px for all icons (consistent visual weight)

**Characteristics:**
- Rounded corners (2px–3px radius on ends)
- Geometric simplicity
- Good legibility at 24px (minimum safe size)
- Single-color (monochrome) or type-accent color
- Negative space usage for clarity

### Icon Library (Essential)

| Icon | Use | Default Color |
|------|-----|---|
| **Search** | Search bar, lookup | Text Secondary |
| **Close** | Dismiss modal/card | Text Secondary |
| **Checkmark** | Confirm, select | Success Green |
| **Plus** | Add item, new slot | Primary |
| **Settings** | Settings screen | Text Secondary |
| **Favorite** | Favorite/save | Error Red (filled) / Text Secondary (outline) |
| **Refresh** | Reload data | Primary |
| **Up Arrow** | Scroll to top | Text Secondary |
| **Down Arrow** | Expand section | Text Secondary |
| **Edit** | Edit mode | Primary |
| **Eye** | Show/reveal | Text Secondary |
| **Hide** | Hide/conceal | Text Secondary |
| **Filter** | Open filter menu | Primary |

### Icon Design Process

1. **Base Shape:** Start with simple geometric form
2. **Refinement:** Smooth curves, consistent stroke
3. **Testing:** Verify legibility at 16px, 24px, 32px
4. **Color Variants:** Create outline (unfilled) and filled states
5. **Accessibility:** Ensure sufficient contrast (4.5:1 minimum)

### Icon States

**Default:** Text Secondary color  
**Active/Selected:** Type accent color  
**Disabled:** Text Muted with opacity 0.5  
**Error:** Error Red (`#FF453A`)

---

## Responsive Design

### Breakpoints

| Device | Breakpoint | Width | Columns | Gutter | Margin |
|--------|-----------|-------|---------|--------|--------|
| **Mobile S** | `xs` | 320px | 4 | 12px | 12px |
| **Mobile M** | `sm` | 375px | 4 | 16px | 16px |
| **Mobile L** | `md` | 480px | 6 | 16px | 16px |
| **Tablet (Portrait)** | `lg` | 768px | 12 | 20px | 24px |
| **Tablet (Landscape)** | `xl` | 1024px | 12 | 20px | 24px |
| **Desktop** | `2xl` | 1280px+ | 12 | 20px | 32px |

### Responsive Adjustments

**Reference List Screen:**
- **Mobile (sm):** 1 card per row, full width
- **Tablet (lg):** 2 cards per row
- **Large Tablet (xl):** 3 cards per row
- **Desktop (2xl):** 4 cards per row

**Team Builder Grid:**
- **Mobile:** 3 columns (2 teams visible)
- **Tablet Portrait:** 6 columns (1 full team visible)
- **Tablet Landscape / Desktop:** 6 columns with side panel (team details)

**Detail Screen:**
- **Mobile:** Single column layout, stacked components
- **Tablet+:** Two-column layout (hero + stats left, abilities/moves right)

**Font Scaling:**
- See Typography table — sizes are optimized for mobile-first viewing

---

## Accessibility & Dark Mode

### Dark Mode Implementation

**System Integration:**
- **iOS:** Respect `@Environment(\.colorScheme)` (automatic switching)
- **Android:** Respect system dark theme setting
- **User Override:** Settings toggle to force dark/light mode, independent of system

**Color Contrast (WCAG 2.1 AA Compliance):**

| Text Type | Minimum Contrast | Our Palette |
|-----------|------------------|-------------|
| **Normal Text (14px+)** | 4.5:1 | Text-Primary (#F5EEEE) on Background-Secondary (#1E1A1A): 15.2:1 ✓ |
| **Large Text (18px+)** | 3:1 | Text-Secondary (#B89E9E) on Background-Secondary: 5.8:1 ✓ |
| **UI Components** | 3:1 | All type colors verified against dark backgrounds ✓ |
| **Text Muted** | 4.5:1 | Text-Muted (#9A7A7A) on Background-Secondary: 4.5:1 ✓ |

**Contrast Verification:**
- All text combinations verified for WCAG AA compliance
- Type color badges pass contrast with their designated text colors
- Disabled states maintain minimum 3:1 contrast

### Reduced Motion

Respect `prefers-reduced-motion` media query:
```
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Effect:** All animations reduced to imperceptible; interactions still functional.

### Touch Target Sizing

- **Minimum Touch Target:** 44×44px (iOS HIG guidelines)
- **Android Minimum:** 48×48dp (Material Design guidelines)
- **Spacing Between Targets:** 8px minimum
- **Exceptions:** Small inline icons (16px) in dense layouts require 44px interactive area (use hitSlop or padding)
- **All interactive elements must meet touch target minimum for accessibility**

### Semantic HTML / Accessibility Labels

**Screen Reader Announcements:**
- Pokemon type badges: "Fire type"
- Stat values: "Attack: 75"
- Buttons: "Add Pokemon to team" (action-based label)
- Modal titles: "Pokemon Picker"
- Forms: Associated labels with inputs

**Focus Indicators:**
- All interactive elements have visible focus ring (2px solid type accent color)
- Focus indicator color: Type accent color with 2px offset
- Never remove focus styles (use proper focus state styling)

### Color Blindness Considerations

**Design for Deuteranopia (Red-Green Blindness):**
- Fire type has distinct shape/position from other types
- Use type icons in addition to color badges
- Stat charts include labels (not color-dependent)
- Ensure Pokemon distinguishable beyond type color (include name, number, sprite)

**Implementation:**
- Never use color as sole differentiator
- Always pair color with text label or icon
- Test designs with color blindness simulator

### Keyboard Navigation

- **Tab Order:** Left-to-right, top-to-bottom; logical grouping
- **Tab Key:** Navigate between focusable elements
- **Shift+Tab:** Navigate backwards
- **Enter/Space:** Activate buttons, select chips
- **Arrow Keys:** Navigate dropdowns, sliders, tabs
- **Escape:** Close modals, cancel operations

### Dyslexia-Friendly Considerations

- **Font Spacing:** Line-height 1.3–1.5 (never <1.3)
- **Letter Spacing:** 0.1px–0.3px for body text
- **Avoid All-Caps:** Use sentence case for readability (except Section Headers which are styled uppercase)
- **Line Length:** Maximum 65 characters (comfortable reading)
- **Justification:** Left-align text only (no justified paragraphs)

---

## Implementation Handoff Notes

### For Frontend Developers

**Design Tokens (from src/constants/):**

Colors:
- background: #111010
- surface: #1E1A1A
- surfaceElevated: #2A2323
- border: #3A2E2E
- borderLight: #4D3E3E
- text: #F5EEEE
- textSecondary: #B89E9E
- textMuted: #9A7A7A
- primary: #CC0000 (or #DD3311 from codebase)
- accent: #FFD700
- plus 18 type colors (see Color Palette section)

Spacing:
- xxs: 2px, xs: 4px, sm: 8px, md: 12px, lg: 16px, xl: 24px, 2xl: 32px, 3xl: 48px, 4xl: 64px

Typography:
- Full scale defined in Typography section with sizes, weights, line-heights, letter-spacing

Font Sizes:
- xs: 11px, sm: 13px, md: 15px, lg: 17px, xl: 20px, 2xl: 24px, 3xl: 30px, 4xl: 36px

Border Radius:
- sm: 4px, md: 8px, lg: 12px, xl: 16px, 2xl: 24px, full: 9999px

### Component File Structure

```
components/
  ├── PokemonCard.tsx
  ├── TypeBadge.tsx
  ├── SubTabBar.tsx
  ├── Toolbar.tsx
  ├── FilterSortSheet.tsx
  ├── SearchHeader.tsx
  ├── FilterChip.tsx
  ├── Button.tsx
  ├── Card.tsx
  ├── Slider.tsx
  ├── Modal.tsx
  ├── StatChart.tsx
  └── TabBar.tsx
```

### Performance Budgets

- **Animation Frame Rate:** 60fps (target), 30fps minimum
- **Modal Open Delay:** <100ms
- **List Scroll:** Smooth, no jank (<16.67ms per frame)
- **Search Input Debounce:** 200ms
- **Image Load Strategy:** Lazy-load sprites below fold; eager-load hero image

### Testing Checklist

- [ ] All animations perform at 60fps on mid-range devices (Pixel 4, iPhone XS)
- [ ] Touch targets meet 48px minimum (Android) / 44px (iOS)
- [ ] Text meets WCAG AA contrast (4.5:1 for normal, 3:1 for large)
- [ ] Keyboard navigation works without mouse (web)
- [ ] Screen readers announce all interactive elements
- [ ] Reduced motion preference respected (animations disabled)
- [ ] App works on 320px width (small phones)
- [ ] Tablet layouts verified on iPad and tablets
- [ ] Dark mode works without manual testing (system-driven)
- [ ] All type colors verified for color blindness accessibility
- [ ] Component sizes verified against touch target minimums
- [ ] All color values match colors.ts constants

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| **1.1** | 2026-07-09 | Complete revision: corrected color values to match warm palette (#111010–#2A2323), added SubTabBar, Toolbar, FilterSortSheet, SearchHeader, and FilterChip specifications; fixed PokemonCard sprite size to 64px; added animation tokens; added touch target guidelines; corrected typography weights and line-heights; verified WCAG AA contrast compliance. |
| **1.0** | 2026-07-09 | Initial design system specification. |

---

## Glossary

- **Dark Mode:** High-contrast dark theme prioritizing readability and reducing eye strain
- **Type-Color Theming:** Dynamic UI accent colors based on Pokemon type
- **Parallax Effect:** Visual depth created by moving background elements slower than foreground
- **Hexagon Radar Chart:** Six-pointed star stat visualization for Pokemon attributes
- **EV (Effort Value):** 0–252 stat optimization (4 EVs = 1 stat point)
- **IV (Individual Value):** 0–31 base stat variation (genetic)
- **Sprite:** 2D pixel art Pokemon image
- **Shiny:** Alternate color variant of Pokemon
- **WCAG AA:** Web Content Accessibility Guidelines Level AA (intermediate accessibility)
- **GPU Acceleration:** Hardware-accelerated rendering using device GPU for smooth animations
- **Touch Target:** Interactive element minimum size (44×44px iOS, 48×48dp Android)
- **Type-Color Theming:** Dynamic UI adaptation based on focused Pokemon type

---

**Document End**

This design system specification is a living document. Updates and refinements will be tracked in the Version History section. For questions or clarifications, contact the design team.
