# Pokemon Detail Screen: Hero Parallax Header Specification

**Version:** 1.0  
**Date:** 2026-07-10  
**Status:** Final Design Specification  
**Audience:** UI Designers, Frontend Developers  
**Context:** Pokémon detail screen opening experience with parallax scrolling hero artwork

---

## Executive Summary

This document specifies the hero parallax header for the Pokémon detail screen—the primary visual entry point users encounter when viewing any Pokémon's information. The hero section establishes visual tone for the entire detail experience through:

1. **Large, prominently displayed Home render artwork (3D-style)** with transparent background overlaid on a type-based gradient
2. **Smooth parallax scrolling effect** (0.5x velocity) that creates depth as content scrolls
3. **Shiny variant toggle** with subtle cross-fade animation (200ms)
4. **Type-based color theming** that adapts the background gradient and accent elements to match the Pokémon's primary type
5. **Smooth collapse & sticky header** as the user scrolls past the hero zone
6. **Elegant transition** from hero into the content sections below (dex number, stats, abilities, moveset, etc.)

The design draws inspiration from modern reference apps (Pokémon HOME, Pokémon GO, Spotify artist pages, Apple App Store) while maintaining consistency with ChampionDex's dark mode aesthetic and type-driven design system.

---

## 1. Hero Design Concept

<!-- REVISED: Added backdrop image layers; updated from gradient-only to combined backdrop + gradient + overlay approach -->

### 1.1 Visual Architecture

The hero section consists of **four visual layers** (from back to front):

1. **Type-Based Anime Backdrop Image** — Full-bleed, 1024px high-res anime-style environment (cropped to upper/sky portion, 60% opacity)
2. **Gradient Overlay** — Semi-transparent radial gradient using type color for darkening/tinting (blends into surface color)
3. **Artwork Container** — Large, centered official PNG artwork (transparent background, 280–320px) with soft radial vignette behind it
4. **Shiny Toggle Overlay** — Small button group positioned bottom of hero

```
┌─────────────────────────────────────────────────┐
│                                                 │
│     ╭─────────────────────────────────────╮     │
│     │ [Anime Backdrop Image, cropped]     │     │
│     │ [+ Gradient Overlay, 60% opacity]   │     │
│     │   ╭───────────────────────────────╮ │     │
│     │   │  [Radial Vignette Scrim]      │ │     │
│     │   │   [  Official Artwork PNG  ]  │ │     │
│     │   │     (transparent background) │ │     │
│     │   │                               │ │     │
│     │   ╰───────────────────────────────╯ │     │
│     │   ┌─ Shiny Toggle ─────────────────│ │     │
│     │   │ ○ Normal  ● Shiny             │ │     │
│     │   └──────────────────────────────┘ │     │
│     │                                     │     │
│     ╰─────────────────────────────────────╯     │
│                                                 │
└─────────────────────────────────────────────────┘
← Hero Zone (full-width, parallax container) →
```

### 1.2 Recommended Dimensions

**Hero Container:**
- Width: Full screen (account for safe area on notched devices)
- Height at rest: 340px (on mobile) — balanced between dramatic and functional
- Min height: 280px (to remain visually prominent as scrolling collapses it)
- Background: Type-based gradient (see color spec below)

**Artwork Display:**
- Width: 280px (scales responsively on tablet to 320px+)
- Height: 280px (square aspect ratio, maintains Pokémon clarity)
- Position: Centered horizontally, vertically centered within available space
- Background: Transparent (artwork has transparent PNG background)
- Source: PokeAPI Home renders (`/sprites/pokemon/other/home/${dex}.png`) — 3D-style renders at ~680×680px
- Fallback: If image missing, show Pokéball icon placeholder or gray box

**Shiny Toggle (Hero Footer):**
- Height: 48px (touch target minimum)
- Position: 16px from bottom of hero, horizontally centered
- Style: Segmented control or radio button group (iOS-style appearance)
- Options: "Normal" | "Shiny"
- Disabled state: If no shiny variant exists in database, disable "Shiny" option

### 1.3 Backdrop Image & Gradient Specification

<!-- REVISED: Updated to include backdrop image layer; gradient now serves as overlay for darkening/tinting -->

**Backdrop Image Layer:**

High-resolution anime-style environment images are layered as the base. These are loaded based on Pokémon's primary type (e.g., `electric.png` for Electric-type).

- **Resolution:** 1024×1024px originals; downscaled to 512×512px for mobile use
- **Display Method:** Full-bleed image container, cropped to show upper 60% (sky/atmospheric portion where key effects are)
- **Opacity:** 60% (allows gradient overlay and later artwork to read clearly)
- **Positioning:** Center-top crop to emphasize atmospheric elements (lightning bolts, glowing vortex, etc.)

**Gradient Overlay:**

A semi-transparent radial gradient overlay sits atop the backdrop, providing both darkening and type-color tinting.

```typescript
// Color calculation logic:
// Assume typePrimary = 'electric', typeColor = '#F8D030'

const HeroBackdropSpec = {
  // Backdrop image: require() path (see Section 1.5 for asset map)
  backdropImage: require('..../electric.png'),
  backdropOpacity: 0.6,  // 60% opacity
  backdropCropTop: '60%', // Show upper 60%, hide lower detail
  
  // Gradient overlay for darkening/tinting
  gradientCenterColor: lighten(typeColor, 0.2) + '0D',  // 5% opacity, tint
  gradientEdgeColor: '#1E1A1A',  // Surface background, full opacity
  gradientBlendMode: 'multiply',  // Preserves backdrop texture
};
```

**Type Color Reference (from DESIGN_SYSTEM.md):**

| Type | Hex | Gradient Center (Lightened) | Notes |
|------|-----|----------|---|
| Electric | `#F8D030` | `#FCDE7011` | Golden yellow, bright center |
| Fire | `#F08030` | `#F4A85014` | Orange-red, warm center |
| Water | `#6890F0` | `#9CB5F511` | Cool blue, hydration feel |
| Grass | `#78C850` | `#A8D87514` | Natural green, growth accent |
| Psychic | `#F85888` | `#FB8FAD11` | Magenta-pink, mystical center |
| Flying | `#A890F0` | `#CEABF411` | Light purple, sky theme |
| (etc. for all 18 types) | ... | ... | See DESIGN_SYSTEM.md for full list |

**Implementation:**
```typescript
// In TypeColorConfig or design tokens:
TYPE_HERO_GRADIENTS = {
  electric: {
    from: '#1E1A1A',
    to: '#FCDE7011',  // Lightened Electric with transparency
    stops: ['0%', '100%']
  },
  fire: {
    from: '#1E1A1A',
    to: '#F4A85014',
  },
  // ... etc
}
```

**Fallback for Dual-Type Pokémon:**
- Use primary type backdrop image (e.g., Charizard Fire/Flying uses `fire.png`)
- If artwork legibility suffers, apply a slightly darker overlay (65% instead of 60%)
- Secondary type appears in type badges below hero

**Fallback for Unknown Type:**
- Use `normal.png` backdrop image
- Fallback gradient: `#1E1A1A` → `#333333`

**Fallback for Missing Backdrop (Network/Asset Error):**
- Fall back to gradient-only approach (no backdrop image)
- Continue rendering gradient overlay + artwork
- Show placeholder or retry mechanism (see edge cases)

### 1.4 Dark Mode Considerations

The hero design is dark mode primary by default:

- **Background:** Starts from `#1E1A1A` (Surface color from design system)
- **Text Overlay:** All text remains white/light for contrast
- **Type Gradient:** Colored transparency (10% opacity) prevents overwhelming the artwork
- **Contrast:** Type color in gradient does not obscure artwork legibility

**No Light Mode Required (for MVP):** ChampionDex is dark-mode-first. If light mode is added later, the gradient logic reverses:
- Light mode: Lighter surface color, reduced type color saturation

---

## 2. Parallax Scrolling Effect

<!-- REVISED: Added backdrop parallax layer; artwork and backdrop now have different scroll rates for depth effect -->

### 2.1 Parallax Behavior Specification

**Multi-Layer Parallax:**

As the user scrolls down the detail screen, both the backdrop image and artwork move at different rates, creating a multi-layer depth effect:
- **Backdrop:** 0.25x velocity (slowest, furthest back)
- **Artwork:** 0.5x velocity (intermediate)
- **Gradient overlay:** Stays with hero container (no parallax)

This creates a traditional parallax depth effect where foreground elements move faster than background.

**Hero Image Parallax:**

```
Scroll Timeline:
┌─ Scroll Position: 0px (Hero at rest)
│ Artwork translateY: 0px
│ Opacity: 1.0
│ Hero height: 340px (full)
│
├─ Scroll Position: 100px (User scrolls down)
│ Artwork translateY: -50px (half scroll distance)
│ Opacity: 0.95
│ Hero height: 290px (collapsed)
│
├─ Scroll Position: 200px (User scrolls more)
│ Artwork translateY: -100px (half scroll distance)
│ Opacity: 0.85
│ Hero height: 240px (further collapsed)
│
└─ Scroll Position: 340px+ (Hero fully scrolled away)
  Artwork translateY: -170px (max)
  Opacity: 0.6
  Hero height: ~100px (minimal)
  Content below begins to fill viewport
```

**Formula:**
```typescript
const heroScrollRange = 340;      // Hero container initial height
const backdropParallax = 0.25;    // Backdrop moves at 25% scroll velocity
const artworkParallax = 0.5;      // Artwork moves at 50% scroll velocity
const opacityFactor = 0.003;      // Opacity decreases as scroll increases

scrollHandler = (scrollOffset) => {
  // Backdrop parallax: moves slower than artwork (depth effect)
  const backdropTranslateY = scrollOffset * backdropParallax * -1;
  
  // Artwork parallax: moves slower than scroll
  const artworkTranslateY = scrollOffset * artworkParallax * -1;
  
  // Hero container height: collapses linearly
  const heroHeight = Math.max(
    100,  // Minimum height (prevents complete collapse)
    340 - scrollOffset
  );
  
  // Artwork opacity: fades slightly as user scrolls
  const opacity = Math.max(0.6, 1 - (scrollOffset * opacityFactor));
  
  return {
    backdropTranslateY,   // NEW: backdrop parallax
    artworkTranslateY,
    heroHeight,
    opacity,
  };
};
```

**Animation Performance:**
- **FPS Target:** 60fps (60 frames per second) during scroll
- **Tech:** React Native Reanimated 2 with `useAnimatedScrollHandler` + `useAnimatedStyle`
- **GPU Acceleration:** Use `transform: translateY()` only (no layout recalculations)
- **Throttle:** Scroll events throttled to 16ms intervals (60fps) to prevent jank

### 2.2 Backdrop Visibility & Fade

<!-- REVISED: Backdrop now fades as user scrolls, creating intentional exit effect -->

As the user scrolls, the backdrop image gradually fades out, creating an intentional visual transition from hero to content. This ensures the backdrop is a key part of hero identity but doesn't clutter the collapsed header.

```
Backdrop opacity timeline:
─ Scroll: 0px → Backdrop opacity: 60% (fully visible)
─ Scroll: 170px → Backdrop opacity: 30% (fading)
─ Scroll: 340px+ → Backdrop opacity: 0% (fully faded)
```

**Implementation:**
```typescript
const backdropOpacity = interpolate(
  scrollOffset,
  [0, 340],
  [0.6, 0],  // Fade from 60% to 0%
  Extrapolate.CLAMP
);
```

### 2.3 Gradient Overlay Intensification

A semi-transparent dark overlay intensifies as user scrolls, improving text legibility and maintaining artwork focus.

```
Overlay opacity timeline:
─ Scroll: 0px → Overlay opacity: 0% (no overlay, backdrop prominent)
─ Scroll: 170px → Overlay opacity: 40% (balanced, fading backdrop)
─ Scroll: 340px+ → Overlay opacity: 70% (gradient-only appearance, no backdrop)
```

**Implementation:**
```typescript
const overlayOpacity = interpolate(
  scrollOffset,
  [0, 340],
  [0, 0.7],
  Extrapolate.CLAMP
);
```

This overlay uses a semi-transparent dark radial gradient (`rgba(0,0,0,0.1)` → `rgba(0,0,0,0.7)`) that maintains artwork visibility while transitioning from a rich backdrop environment to a clean gradient-based design as hero collapses.

---

## 3. Artwork Legibility & Backdrop Treatment

<!-- NEW SECTION: Addressing rich backdrop with detailed artwork -->

### 3.1 Ensuring Pokémon Artwork Reads Clearly

The backdrop images are rich, detailed, and colorful — they must not compete with the Pokémon artwork. Several techniques ensure legibility:

**Radial Vignette Scrim (Behind Artwork):**

A soft, radial vignette sits directly behind the artwork, creating a subtle "spotlight" effect:
- **Shape:** Radial gradient, ellipse at center
- **Inner Color:** `rgba(0, 0, 0, 0.0)` (transparent in center)
- **Outer Color:** `rgba(0, 0, 0, 0.3)` (subtle darkening at edges)
- **Blur Radius:** 40px soft edge (very subtle)
- **Size:** 400×400px ellipse (larger than artwork 280px to create soft falloff)
- **Effect:** Creates a subtle darkening behind artwork edges without visible hard line

**Artwork Soft Shadow:**

Add a soft drop shadow to the artwork itself:
- **Blur Radius:** 20px
- **Color:** `rgba(0, 0, 0, 0.4)`
- **Offset:** No offset (directly below)
- **Spread:** 8px
- **Effect:** Separates artwork from backdrop, adds visual depth

**Backdrop Desaturation (Optional, Per-Type):**

If a specific type backdrop tests poorly with legibility, apply a subtle desaturation:
- **Amount:** 10-15% desaturation (barely noticeable)
- **Affected Types:** Normal, Grass, Psychic (lighter, more colorful backdrops)
- **Implementation:** CSS `filter: saturate(0.85)` on backdrop layer

**Overlay Intensity Per Type:**

The gradient overlay intensity can be adjusted per type for optimal contrast:
- **Bright Types (Electric, Psychic, Fairy):** Start with 5% gradient opacity (lighter tint)
- **Dark Types (Dark, Ghost, Rock):** Start with 3% gradient opacity (subtle tint)
- **Balanced Types (Fire, Water, Grass):** Start with 5% gradient opacity (standard)

### 3.2 Test Matrix for Artwork Legibility

For each type, test artwork readability against the backdrop:

| Type | Backdrop Brightness | Vignette Needed? | Desaturate? | Notes |
|------|-----|---|---|---|
| Electric | High | Yes (subtle) | Optional (10%) | Bright yellow/purple sky, may need mild desaturation |
| Fire | Medium-High | Yes (subtle) | No | Warm, mid-tone backdrop reads well |
| Water | Medium | Yes (standard) | No | Cool blue, good contrast naturally |
| Grass | High | Yes (subtle) | Optional (10%) | Green is close to type color, slight desaturation helps |
| Psychic | High | Yes (bold) | Yes (15%) | Vibrant pink/purple, needs stronger vignette |
| Normal | Medium | Yes (standard) | Optional (10%) | Ensure normal.png has enough visual interest (see 3.3) |
| Ghost | Low | Yes (minimal) | No | Dark backdrop already provides contrast |
| Dark | Low | Yes (minimal) | No | Very dark, artwork pops naturally |

---

## 4. Shiny Toggle & VitalInfo Overlay

### 4.1 Star Button (Floating Shiny Toggle)

**Location:** Bottom-right of hero section, floats at `right: spacing.md (16px), bottom: 0, width: 44, height: 52`

**Button Style:** Custom SVG star glyph with 5 points and rounded tips
- **Size:** 36px × 36px star glyph
- **Colors:**
  - Normal state: `rgba(255, 255, 255, 0.7)` (semi-transparent white, outlined only)
  - Shiny state: `#FFD700` (gold, filled solid)
- **Animation on press:** Scale pop 1.0 → 1.4 → 1.0 over 200ms (100ms out + 100ms in)
- **Particle burst:** 6 gold stars (★) at 60° intervals when toggling TO shiny; burst 140px outward over 500ms

**Disabled state:** Toggle disabled until shinyArtworkUrl exists AND shinyReady is true

**Star Glyph Technical Details:**
- Outer radius: size/2 * 0.88
- Inner radius: size/2 * 0.38
- Outer tip rounding: r = outerR * 0.12 via quadratic bezier curves
- Inner valley rounding: ri = innerR * 0.25 via quadratic bezier curves
- cy shifted down by size * 0.05 to visually center the asymmetric 5-point star

### 4.2 VitalInfoOverlay Component

**Purpose:** Renders two bordered zones at the bottom of the hero section during parallax collapse:
- **Left box:** Dex number only (`#001` format), fontSize 28, fontWeight 800, vertically centered
- **Right box:** 44×44px transparent placeholder for star button positioning

**Styling:**
- Container height: 52px (fixed overlay height)
- Left box: `paddingHorizontal: 10, marginRight: spacing.md`, vertically centered
- Right box: width 44, height 44, centered alignment (transparent fill)
- Dex number: `letterSpacing: 1`, `color: colors.text`

**Layout Flow:**
- `flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'`
- Left box grows/shrinks; right box fixed 44×44
- Both boxes measured via onLayout callbacks to compute VitalInfoBorder geometry

### 4.3 Shiny Toggle Animation (260ms Total)

**White Flash Silhouette Effect:**

When user presses the star button to toggle shiny:

1. **Simultaneous Actions:**
   - Star scale animation: 1.0 → 1.4 → 1.0 (pop effect, 200ms)
   - White flash: opacity 0.0 → 1.0 (80ms), held, then 1.0 → 0.0 (180ms)
   - Particle burst: 6 gold stars if toggling TO shiny (500ms burst)

2. **Flash Sequence (260ms):**
   - 0–80ms: Image fade out, white flash fades in to full opacity
   - 80ms: Image swaps to shiny variant
   - 80–260ms: White flash fades out over 180ms (creates shimmer effect)

3. **Implementation:**
```typescript
const handleShinyToggle = async (nextIsShiny: boolean) => {
  // Flash to white (80ms)
  whiteFlashOpacity.value = withTiming(1, { duration: 80 });
  
  // Swap image at peak white
  await new Promise((resolve) => setTimeout(resolve, 80));
  setIsShiny(nextIsShiny);
  
  // Fade white overlay out (180ms)
  whiteFlashOpacity.value = withTiming(0, { duration: 180 });
};
```

**Pre-loading:**
- Normal artwork: bulk prefetched on app startup via `artworkPrefetchService.ts` (batches of 10)
- Shiny artwork: lazily prefetched when detail screen opens; cache checked first via `isImageCached()`
- Both images cached to disk via `expo-image` (cachePolicy: "memory-disk")

### 4.4 Edge Cases

**If Shiny Variant Doesn't Exist:**
- Star button disabled (no visual feedback on press)
- `shinyArtworkUrl` is null or undefined

**If Network Fails to Load Shiny:**
- Star button remains disabled
- `shinyReady` stays false

**If Shiny Image Not Yet Cached (offline mode):**
- Star button disabled until cache check completes
- `PokemonHero` receives `shinyReady: boolean` prop (default false)
- Detail screen sets `shinyReady=true` after prefetch completes

**If Both Normal & Shiny Missing:**
- Shows placeholder artwork (`PLACEHOLDER_ARTWORK` or `PLACEHOLDER_ARTWORK_SHINY`)
- Star button disabled

### 4.5 VitalInfoBorder Component

**Purpose:** Renders the decorative border frame around the VitalInfoOverlay as the hero collapses. Split into two sub-components:

1. **Left vertical bar** — a plain `View` with:
   - `position: absolute, top: 0, left: 1, width: 1.5, bottom: overlayHeight`
   - `backgroundColor: typeColor`
   - Naturally resizes as hero collapses due to hero's overflow: hidden

2. **Bottom SVG notch** — an SVG path rendering:
   - Horizontal line at y=0 (top of overlay zone)
   - Curved transitions into diagonal walls on left and right (rounded corners r=6)
   - Dips DOWN into a gap notch between left (info box) and right (star box)
   - Diagonal wall slopes: `leftSlopeOffset=24` (gradual lean), `rightSlopeOffset=14` (sharper lean)
   - Gap bottom is sharp horizontal segment
   - Two closed fill paths using `cardSurfaceColor` (solid opaque, matches hero fade gradient final color)
   - Main stroke: typeColor, strokeWidth 1.5

**Geometry:**
- overlayTop = heroHeight - overlayHeight (where horizontal line runs)
- gapBottom = overlayHeight (depth of notch within SVG viewport)
- SVG positioned at `bottom: 0`, stays pinned as hero collapses

**Layout in PokemonHero:**
- VitalInfoBorder rendered after VitalInfoOverlay's onLayout callbacks fire
- Only rendered when all three measurements available: `infoBlockRight > 0 && starBoxLeft > 0 && starBoxRight > 0`

---

## 5. Sticky Header Behavior

### 5.1 Header Implementation

The detail screen uses Expo Router's native Stack header with dynamic title set via `navigation.setOptions()`. No custom header rendering needed.

**Header States:**

```
State 1: Hero at Rest (Scroll: 0px)
┌──────────────────────────────────────┐
│ < Back  [Pokémon Name]               │ ← Native back button, title displayed
└──────────────────────────────────────┘
┌──────────────────────────────────────┐
│  [Hero Section at Full Height]       │
└──────────────────────────────────────┘

State 2: Hero Collapsing (Scroll: 100px–170px)
┌──────────────────────────────────────┐
│ < Back  [Pokémon Name]               │ ← Header remains visible
└──────────────────────────────────────┘
┌──────────────────────────────────────┐
│  [Hero Section Partially Visible]    │
└──────────────────────────────────────┘

State 3: Hero Scrolled Away (Scroll: 340px+)
┌──────────────────────────────────────┐
│ < Back  [Pokémon Name]               │ ← Header fully visible
└──────────────────────────────────────┘
┌──────────────────────────────────────┐
│  [Content Section Now Visible]       │
└──────────────────────────────────────┘
```

### 5.2 Header Animation (Optional Enhancement)

Optional header bar opacity animation during scroll (currently simple static display):

**Title Visibility:**
- Scroll 0–50px: Title opacity 0.3 (faint)
- Scroll 50–200px: Title opacity interpolates 0.3 → 1.0
- Scroll 200px+: Title opacity 1.0 (fully visible)

**Implementation in [id].tsx:**
```typescript
const headerTitleOpacity = useAnimatedStyle(() => {
  const opacity = interpolate(
    scrollOffset.value,
    [0, 50, 200],
    [0.3, 0.6, 1.0],
    Extrapolate.CLAMP,
  );
  return { opacity };
});
```

Note: This is computed in [id].tsx but header animation not yet connected to Stack header via `navigation.setOptions()`.

### 5.3 Implementation Notes

**Using React Navigation's HeaderShown:**
```typescript
// In detail screen params:
const headerOpacity = useAnimatedStyle(() => ({
  opacity: interpolate(scrollOffset.value, [0, 200], [0.3, 1.0]),
  backgroundColor: interpolate(scrollOffset.value, [0, 200], [0.3, 1.0]),
}));

// Update header style reactively during scroll
useAnimatedReaction(
  () => scrollOffset.value,
  (offset) => {
    runOnJS(updateHeaderStyle)({
      opacity: interpolate(offset, [0, 200], [0.3, 1.0]),
    });
  }
);
```

---

## 6. Transition to Content

### 6.1 Content Flow Below Hero

The content sections flow naturally below the hero with smooth visual transitions:

```
┌──────────────────────────────────┐
│   HERO SECTION (340px)           │ ← Parallax artwork, shiny toggle
│                                  │
├──────────────────────────────────┤ ← Subtle divider or color shift
│ #025 Electric                    │
│ Pikachu                          │
│ Mutt | Emotes                    │
│ 0.4m, 6kg                        │ ← Dex info section
│                                  │
├──────────────────────────────────┤
│ Abilities                        │
│ [Static] [Lightning Rod]         │ ← Ability badges (tappable)
│                                  │
├──────────────────────────────────┤
│ Base Stats                       │
│ HP      ███░░░░░░ 35            │ ← Stat chart (horizontal bars)
│ Attack  ███░░░░░░ 55            │
│ ...                             │
│                                  │
├──────────────────────────────────┤
│ Moveset (searchable)            │
│ [Search...]                     │
│ [Thunderbolt] [Thunder Wave]    │ ← Tappable move rows
│ ...                             │
│                                  │
└──────────────────────────────────┘
```

### 6.2 Hero Fade Gradient

**Bottom Fade Gradient Layer** (LinearGradient positioned at hero bottom):

The hero section includes a smooth fade gradient at its bottom that transitions from transparent to the final card surface color:

```typescript
<LinearGradient
  colors={[
    'rgba(0, 0, 0, 0)',      // Transparent at top
    'rgba(0, 0, 0, 0)',      // Still transparent
    'rgba(0, 0, 0, 0.35)',   // Beginning to darken
    'rgba(0, 0, 0, 0.55)',   // More opaque
    cardSurfaceColor,        // Solid final color matching content below
  ]}
  locations={[0, 0.45, 0.7, 0.88, 1.0]}
  start={{ x: 0.5, y: 0 }}
  end={{ x: 0.5, y: 1 }}
  style={{ height: 160 }} // Gradient spans 160px upward from bottom
/>
```

**Purpose:**
- Creates smooth visual transition from parallax hero to content below
- `cardSurfaceColor` computed per-type: radial types use `#111010`, linear types blend ambient color with background
- Ensures content title is readable as it emerges below hero

### 6.3 Content Below Hero

**Name and Classification Row** (immediately after hero):
- Rendered in detail screen `[id].tsx` below `PokemonHero` component
- `nameClassificationRow`: flexDirection row, alignItems baseline
- pokemonName: `fontSize: 36, fontWeight: '800'`
- classification (if available): `fontSize: fontSize.md, italic, textAlign: right, flex: 1`

**Type Badges** (below name row):
- TypeBadge components with `size="md", width="fixed"` (110px per badge)
- Gap: `spacing.sm` between badges

---

## 7. ASCII Mockups

### 7.1 Hero at Rest (Initial State)

```
┌─────────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Hero Section (340px height)                         │ │
│ │ Background: Type-based gradient (radial)            │ │
│ │                                                     │ │
│ │         ╔═══════════════════════════════╗           │ │
│ │         ║   PIKACHU Official Artwork    ║           │ │
│ │         ║   (280x280px PNG, centered)   ║           │ │
│ │         ║   Transparent background      ║           │ │
│ │         ║                               ║           │ │
│ │         ║   [Official Pokemon image]    ║           │ │
│ │         ║                               ║           │ │
│ │         ╚═══════════════════════════════╝           │ │
│ │                                                     │ │
│ │         ┌───────────────────────────────┐           │ │
│ │         │ ●Normal    ○ Shiny             │           │ │
│ │         └───────────────────────────────┘           │ │
│ │         (Segmented control, bottom-right)          │ │
│ └─────────────────────────────────────────────────────┘ │
│  ← Full Width (safe area aware)                        │
└─────────────────────────────────────────────────────────┘
```

### 7.2 Hero Mid-Scroll (Collapsed to 50%)

```
┌─────────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Hero Section (170px height, collapsed 50%)          │ │
│ │ Background: Same type gradient, opacity fading      │ │
│ │                                                     │ │
│ │         ╔═════════════════════════════╗             │ │
│ │         ║   PIKACHU (Parallax -50px)  ║             │ │
│ │         ║   Artwork partially visible ║             │ │
│ │         ║   Opacity: 0.92             ║             │ │
│ │         ║   [Offset upward]           ║             │ │
│ │         ╚═════════════════════════════╝             │ │
│ │                                                     │ │
│ │    Shiny toggle opacity fades (50%)                │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ #025 Electric (Content header emerging)            │ │
│ │ Pikachu                                             │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 7.3 Hero Collapsed (Scrolled Away)

```
┌─────────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Hero Section (100px height, minimal visible)       │ │
│ │ Background: Type gradient nearly opaque              │ │
│ │                                                     │ │
│ │    ╔═══════════════════════════╗ ← Small glimpse   │ │
│ │    ║ PIKACHU (Parallax -170px) ║   of artwork      │ │
│ │    ║ Opacity: 0.6              ║   (10% visible)   │ │
│ │    ╚═══════════════════════════╝                   │ │
│ │                                                     │ │
│ │  Shiny toggle: Hidden or minimal                   │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │ ← Primary content now visible
│ │ #025 Electric | Mouse Pokémon                       │ │
│ │ Pikachu                                             │ │
│ │ Height: 0.4m  Weight: 6kg                          │ │
│ │                                                     │ │
│ │ Abilities                                           │ │
│ │ [Static] [Lightning Rod]                            │ │
│ │                                                     │ │
│ │ Base Stats                                          │ │
│ │ HP     ███░░░░░░░ 35 (19%)                         │ │
│ │ Attack ████░░░░░░░ 55 (31%)                        │ │
│ │ Def    ███░░░░░░░░ 40 (22%)                        │ │
│ │                                                     │ │
│ │ Moveset                                            │ │
│ │ [Thunderbolt] [Thunder Wave] [Volt Tackle]        │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 8. TypeScript Component Interface

### 8.1 PokemonHero Component Props

```typescript
/**
 * PokemonHero Component
 * 
 * Displays a parallax-enabled hero section for Pokémon detail screens.
 * Handles artwork display, shiny toggle, parallax scrolling, and sticky header integration.
 */

interface PokemonHeroProps {
  /**
   * Pokémon national dex number (e.g., 25 for Pikachu)
   */
  pokemonId: number;

  /**
   * Home render artwork URL (high-res 3D-style PNG, transparent background)
   * Expected: PokeAPI Home render from /sprites/pokemon/other/home/${dex}.png
   */
  officialArtworkUrl: string;

  /**
   * Official shiny artwork URL (alternative variant)
   * If undefined, "Shiny" toggle is disabled
   */
  shinyArtworkUrl?: string;

  /**
   * Whether the shiny artwork is available in cache (or on network).
   * Toggle is disabled when false — prevents broken image in offline mode.
   * Default: false (detail screen sets this after checking cache on mount)
   */
  shinyReady?: boolean;

  /**
   * Pokémon name for display and accessibility
   */
  pokemonName: string;

  /**
   * Primary type identifier (e.g., 'electric', 'fire', 'water')
   * Used to determine hero gradient color
   */
  typePrimary: 'electric' | 'fire' | 'water' | 'grass' | /* ... all 18 types */;

  /**
   * Secondary type (optional, for context)
   * Not used in hero, but passed for complete Pokémon context
   */
  typeSecondary?: string;

  /**
   * Shared animated value for scroll offset (from ScrollView)
   * Used for parallax transform and opacity calculations
   */
  scrollAnimatedValue: Animated.SharedValue<number>;

  /**
   * Callback when user toggles between Normal/Shiny
   * Useful for analytics tracking
   */
  onShinyToggle?: (isShiny: boolean) => void;

  /**
   * Initial state: true for shiny, false for normal
   * Default: false
   */
  initiallyShiny?: boolean;

  /**
   * Hero container height at rest
   * Default: 340 (px)
   */
  heroHeight?: number;

  /**
   * Minimum hero height when fully collapsed
   * Default: 100 (px)
   */
  minHeroHeight?: number;

  /**
   * Artwork max width/height
   * Default: 280 (px)
   */
  artworkSize?: number;

  /**
   * If false, disable parallax effect (static hero)
   * Useful for low-end devices or testing
   * Default: true
   */
  parallaxEnabled?: boolean;

  /**
   * If true, show gradient overlay that darkens over scroll
   * Default: true
   */
  showGradientOverlay?: boolean;

  /**
   * Custom parallax velocity ratio (0–1)
   * 0 = no movement, 0.5 = half scroll speed, 1 = normal speed
   * Default: 0.5
   */
  parallaxFactor?: number;

  /**
   * Callback for header state changes (used to update sticky header)
   * Called with { opacity, backgroundColor, shadowOpacity } as scroll updates
   */
  onHeaderStateChange?: (headerState: HeaderAnimatedState) => void;

  /**
   * If true, artwork should fade as user scrolls
   * Default: true
   */
  shouldFadeArtwork?: boolean;
}

interface HeaderAnimatedState {
  /**
   * Opacity for sticky header bar (0–1)
   */
  opacity: Animated.Animated;

  /**
   * Background color opacity for header (0–1)
   */
  backgroundOpacity: Animated.Animated;

  /**
   * Title/heading opacity in header (0–1)
   */
  titleOpacity: Animated.Animated;

  /**
   * Shadow opacity for subtle elevation (0–0.3)
   */
  shadowOpacity: Animated.Animated;
}
```

### 8.2 Component Usage Example

```typescript
import { PokemonHero } from '@/components/pokemon/PokemonHero';

function PokemonDetailScreen({ pokemonId }: { pokemonId: number }) {
  const [isShiny, setIsShiny] = useState(false);
  const scrollAnimatedValue = useSharedValue(0);
  const headerState = useSharedValue<HeaderAnimatedState>({...});

  const pokemon = usePokemonDetail(pokemonId);

  const handleScrollAnimated = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollAnimatedValue.value = event.contentOffset.y;
    },
  });

  const handleShinyToggle = (newShiny: boolean) => {
    setIsShiny(newShiny);
    // Track toggle for analytics
  };

  if (!pokemon) return <LoadingSpinner />;

  return (
    <ScrollView onScroll={handleScrollAnimated} scrollEventThrottle={16}>
      <PokemonHero
        pokemonId={pokemon.id}
        pokemonName={pokemon.name}
        officialArtworkUrl={pokemon.official_artwork_url}
        shinyArtworkUrl={pokemon.official_artwork_shiny_url}
        typePrimary={pokemon.type_primary}
        typeSecondary={pokemon.type_secondary}
        scrollAnimatedValue={scrollAnimatedValue}
        onShinyToggle={handleShinyToggle}
        initiallyShiny={isShiny}
        heroHeight={340}
        minHeroHeight={100}
        parallaxFactor={0.5}
        onHeaderStateChange={(state) => {
          // Update sticky header opacity/style
          updateStickyHeader(state);
        }}
      />

      {/* Rest of detail content below */}
      <PokemonInfoSection pokemon={pokemon} />
      <AbilitiesSection pokemon={pokemon} />
      <StatChartSection pokemon={pokemon} />
      <MovesetSection pokemon={pokemon} />
    </ScrollView>
  );
}
```

---

## 9. Reanimated 2 Implementation Sketch

<!-- REVISED: Updated to include backdrop parallax animation -->

### 9.1 Core Animation Handlers

**Scroll Handler with Multi-Layer Parallax:**

<!-- REVISED: Added backdrop parallax animation -->

```typescript
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';

const scrollOffset = useSharedValue(0);
const heroHeight = 340;
const backdropParallax = 0.25;  // Backdrop moves slower (background)
const artworkParallax = 0.5;    // Artwork moves at medium speed (midground)

// Animated scroll handler
const scrollHandler = useAnimatedScrollHandler({
  onScroll: (event) => {
    scrollOffset.value = event.contentOffset.y;
  },
});

// BACKDROP parallax transform (slowest, furthest back)
const backdropAnimatedStyle = useAnimatedStyle(() => {
  const translateY = scrollOffset.value * backdropParallax * -1;

  return {
    transform: [{ translateY }],
  };
});

// BACKDROP opacity fade (fades out as user scrolls)
const backdropOpacityStyle = useAnimatedStyle(() => {
  const opacity = interpolate(
    scrollOffset.value,
    [0, heroHeight],
    [0.6, 0],  // Fade from 60% to 0%
    Extrapolate.CLAMP
  );

  return {
    opacity,
  };
});

// ARTWORK parallax transform (faster than backdrop, slower than scroll)
const artworkAnimatedStyle = useAnimatedStyle(() => {
  const translateY = scrollOffset.value * artworkParallax * -1;

  return {
    transform: [{ translateY }],
  };
});

// ARTWORK opacity fade
const artworkOpacityStyle = useAnimatedStyle(() => {
  const opacity = interpolate(
    scrollOffset.value,
    [0, heroHeight],
    [1, 0.6],
    Extrapolate.CLAMP
  );

  return {
    opacity,
  };
});

// GRADIENT overlay opacity (intensifies as backdrop fades)
const gradientOverlayStyle = useAnimatedStyle(() => {
  const opacity = interpolate(
    scrollOffset.value,
    [0, heroHeight],
    [0, 0.7],  // Fade from 0% to 70%
    Extrapolate.CLAMP
  );

  return {
    opacity,
  };
});

// Hero container height collapse
const heroContainerStyle = useAnimatedStyle(() => {
  const height = interpolate(
    scrollOffset.value,
    [0, heroHeight],
    [heroHeight, 100], // Collapse from 340 to 100
    Extrapolate.CLAMP
  );

  return {
    height,
  };
});
```

### 9.2 Sticky Header State Animation

**Header Opacity & Background:**

```typescript
// Sticky header opacity (appears as hero collapses)
const stickyHeaderStyle = useAnimatedStyle(() => {
  const opacity = interpolate(
    scrollOffset.value,
    [0, 50, 200],
    [0.3, 0.5, 1.0],
    Extrapolate.CLAMP
  );

  const backgroundOpacity = interpolate(
    scrollOffset.value,
    [0, 50, 200],
    [0.3, 0.6, 1.0],
    Extrapolate.CLAMP
  );

  const shadowOpacity = interpolate(
    scrollOffset.value,
    [0, 50, 200],
    [0, 0.1, 0.3],
    Extrapolate.CLAMP
  );

  return {
    opacity,
    backgroundColor: `rgba(26, 26, 26, ${backgroundOpacity})`,
    shadowOpacity,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  };
});

// Header title opacity (fades in as user scrolls)
const headerTitleStyle = useAnimatedStyle(() => {
  const opacity = interpolate(
    scrollOffset.value,
    [0, 50],
    [0.5, 1.0],
    Extrapolate.CLAMP
  );

  return {
    opacity,
  };
});
```

### 9.3 Star Button & Particle Burst Animation

**Star Pop and Particle Burst Implementation:**

```typescript
const starScale = useSharedValue(1);
const particles: ParticleAnimatedValue[] = PARTICLE_ANGLES.map(() => ({
  translateX: useSharedValue(0),
  translateY: useSharedValue(0),
  opacity: useSharedValue(0),
}));

const handleStarPress = useCallback(() => {
  const nextIsShiny = !isShiny;

  // Pop animation on the star
  starScale.value = withSequence(
    withTiming(1.4, { duration: 100, easing: Easing.out(Easing.quad) }),
    withTiming(1.0, { duration: 100, easing: Easing.in(Easing.quad) })
  );

  // Particle burst only when turning ON
  if (nextIsShiny) {
    PARTICLE_ANGLES.forEach((angleDeg, i) => {
      const angle = (angleDeg * Math.PI) / 180;
      const dx = Math.cos(angle) * PARTICLE_DISTANCE;
      const dy = Math.sin(angle) * PARTICLE_DISTANCE;
      const delay = i * 40;

      particles[i].translateX.value = withDelay(
        delay,
        withTiming(dx, { duration: PARTICLE_BURST_DURATION })
      );
      particles[i].translateY.value = withDelay(
        delay,
        withTiming(dy, { duration: PARTICLE_BURST_DURATION })
      );
      particles[i].opacity.value = withDelay(
        delay,
        withTiming(0, { duration: PARTICLE_BURST_DURATION })
      );
    });
  }

  handleShinyToggle(nextIsShiny);
}, [isShiny, starScale, particles, handleShinyToggle]);

const starAnimatedStyle = useAnimatedStyle(() => ({
  transform: [{ scale: starScale.value }],
}));

const particleAnimatedStyles = particles.map((p) =>
  useAnimatedStyle(() => ({
    transform: [
      { translateX: p.translateX.value },
      { translateY: p.translateY.value },
    ],
    opacity: p.opacity.value,
  }))
);
```

**Constants:**
- `STAR_BUTTON_SIZE = 44`
- `STAR_GLYPH_SIZE = 36`
- `PARTICLE_COUNT = 6`
- `PARTICLE_ANGLES = [0, 60, 120, 180, 240, 300]` (degrees)
- `PARTICLE_FONT_SIZE = Math.round(ARTWORK_SIZE * 0.15)` (~42px)
- `PARTICLE_DISTANCE = Math.round(ARTWORK_SIZE * 0.5)` (~140px)
- `PARTICLE_BURST_DURATION = 500`
- `STAR_POP_DURATION = 200`

### 9.4 Scroll View Setup with Backdrop

<!-- REVISED: Added backdrop image layer to component structure -->

**Complete ScrollView Configuration with Hero Backdrop:**

```typescript
import { ScrollView, View, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { getBackdropAsset } from '@/constants/backdropAssets';

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);
const AnimatedImage = Animated.createAnimatedComponent(Image);
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export function PokemonDetailScreen() {
  const scrollOffset = useSharedValue(0);
  const pokemon = usePokemonDetail(pokemonId);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollOffset.value = event.contentOffset.y;
    },
  });

  const backdropSource = useMemo(
    () => getBackdropAsset(pokemon.type_primary, pokemon.id),
    [pokemon.type_primary, pokemon.id]
  );

  // Get hero gradient colors based on type
  const heroGradient = getHeroGradient(pokemon.type_primary);

  return (
    <AnimatedScrollView
      scrollEventThrottle={16}
      onScroll={scrollHandler}
      contentContainerStyle={{ paddingBottom: 24 }}
    >
      {/* Hero Container with Backdrop + Gradient + Artwork */}
      <Animated.View
        style={[
          styles.heroContainer,
          heroContainerStyle,
        ]}
      >
        {/* Layer 1: Backdrop Image (furthest back) */}
        {backdropSource && (
          <AnimatedImage
            source={backdropSource}
            style={[
              styles.backdropImage,
              backdropAnimatedStyle,
              backdropOpacityStyle,
            ]}
          />
        )}

        {/* Layer 2: Gradient Overlay (darkens + tints backdrop) */}
        <AnimatedLinearGradient
          colors={[heroGradient.centerColor, heroGradient.edgeColor]}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.gradientOverlay,
            gradientOverlayStyle,
          ]}
        />

        {/* Layer 3: Vignette Scrim (behind artwork, for legibility) */}
        <View style={styles.vignetteScrim} />

        {/* Layer 4: Artwork Container with Parallax */}
        <Animated.View
          style={[
            styles.artworkContainer,
            artworkAnimatedStyle,
            artworkOpacityStyle,
          ]}
        >
          <Animated.Image
            source={{ uri: pokemon.official_artwork_url }}
            style={styles.artwork}
          />
        </Animated.View>

        {/* Layer 5: Shiny Toggle (top-level, stays fixed) */}
        <View style={styles.shinyToggleContainer}>
          <ShinyToggle
            isShiny={isShiny}
            onChange={handleShinyToggle}
            disabled={!pokemon.official_artwork_shiny_url}
          />
        </View>
      </Animated.View>

      {/* Content sections below hero */}
      <View style={{ marginTop: 24 }}>
        <PokemonInfoSection pokemon={pokemon} />
        <AbilitiesSection pokemon={pokemon} />
        <StatChartSection pokemon={pokemon} />
        <MovesetSection pokemon={pokemon} />
      </View>
    </AnimatedScrollView>
  );
}

const styles = StyleSheet.create({
  heroContainer: {
    position: 'relative',
    width: '100%',
    height: 340,
    overflow: 'hidden',
  },
  backdropImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    // Crop to show upper 60% (sky/atmospheric portion)
    top: '-20%',
  },
  gradientOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  vignetteScrim: {
    position: 'absolute',
    width: 400,
    height: 400,
    alignSelf: 'center',
    top: '50%',
    marginTop: -200,
    borderRadius: 200,
    // Radial gradient (center transparent, edges darkened)
    backgroundColor: 'transparent',
    backgroundImage: 'radial-gradient(ellipse at center, transparent 0%, rgba(0,0,0,0.3) 100%)',
  },
  artworkContainer: {
    position: 'absolute',
    width: 280,
    height: 280,
    alignSelf: 'center',
    top: '50%',
    marginTop: -140,
  },
  artwork: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  shinyToggleContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
});
```

### 9.5 Performance Optimization & Backdrop Image Handling

**Backdrop Image Performance:**

1. **Bundle vs. Runtime Loading:**
   - **Recommended:** Bundle backdrop images in `assets/images/backdrops/` (checked into git)
   - **Why:** Eliminates network request on detail screen load, ensures instant availability
   - **Alternative (if bundle size critical):** Load from local file system asynchronously, but pre-cache on app startup
   
2. **Image Resolution & Scaling:**
   - **Original:** 1024×1024px (suitable for preload caching)
   - **Display Size:** Scale to 512×512px or 256×256px for mobile (use `Image.resolveAssetSource()` or native rescaling)
   - **Recommendation:** Use 512×512px as sweet spot — detailed enough, not excessive memory
   - **Approach:** Use React Native's `Image` component with native caching, or Expo `Image` with `blurhash` placeholder

3. **Parallax Backdrop Layer Only Transforms:**
   - Backdrop image should **not** re-render on scroll, only apply `translateY` transform
   - Use `useAnimatedStyle()` to apply transform, avoid re-rendering image itself

4. **Memory Management:**
   - Pre-load both normal and shiny artwork images on screen mount (existing behavior)
   - **Pre-load backdrop image separately** — load on PokemonHero mount, cache aggressively
   - Consider using `react-native-fast-image` for better caching and memory control
   - On screen unmount, release cached backdrop image (to free memory for next Pokémon)

5. **No JS Thread Blocking:**
   - Use Reanimated's native thread for scroll animations
   - All calculations happen on native thread, not JS thread
   - No `runOnJS()` during scroll (only for non-scroll updates)

6. **GPU-Friendly Transforms:**
   - Only use `transform` property changes (translate, scale, rotate) for parallax
   - Backdrop image only gets `translateY` applied — no size/layout changes
   - Artwork also only gets `translateY` applied
   - Never animate layout properties

7. **Memoization:**
   - Wrap PokemonHero component in `React.memo()` to prevent unnecessary re-renders
   - Use `useCallback()` for event handlers

8. **Throttle Scroll Events:**
   - `scrollEventThrottle={16}` ensures 60fps (not 120fps updates)

---

## 10. Backdrop Asset Map & Type Mapping

<!-- NEW SECTION: Ready-to-use backdrop asset mapping for developers -->

### 10.1 Backdrop Image Asset Map

**TypeScript Constant for Developer Use:**

```typescript
// File: src/constants/backdropAssets.ts

/**
 * Map of Pokémon type to backdrop image asset.
 * Each image is ~1024px square, stored in `assets/images/backdrops/`.
 * Use with `require()` to bundle assets.
 */
export const TYPE_BACKDROP_ASSETS = {
  normal: require('@/assets/images/backdrops/normal.png'),
  fire: require('@/assets/images/backdrops/fire.png'),
  water: require('@/assets/images/backdrops/water.png'),
  grass: require('@/assets/images/backdrops/grass.png'),
  electric: require('@/assets/images/backdrops/electric.png'),
  ice: require('@/assets/images/backdrops/ice.png'),
  fighting: require('@/assets/images/backdrops/fighting.png'),
  poison: require('@/assets/images/backdrops/poison.png'),
  ground: require('@/assets/images/backdrops/ground.png'),
  flying: require('@/assets/images/backdrops/flying.png'),
  psychic: require('@/assets/images/backdrops/psychic.png'),
  bug: require('@/assets/images/backdrops/bug.png'),
  rock: require('@/assets/images/backdrops/rock.png'),
  ghost: require('@/assets/images/backdrops/ghost.png'),
  dragon: require('@/assets/images/backdrops/dragon.png'),
  dark: require('@/assets/images/backdrops/dark.png'),
  steel: require('@/assets/images/backdrops/steel.png'),
  fairy: require('@/assets/images/backdrops/fairy.png'),
} as const;

/**
 * Special-case backdrop images (not type-mapped, use for legendary/special Pokémon).
 * Example: Mewtwo could use mewtwo.png for a unique hero experience.
 */
export const SPECIAL_BACKDROP_ASSETS = {
  mewtwo: require('@/assets/images/backdrops/mewtwo.png'),
  rayquaza: require('@/assets/images/backdrops/rayquaza.png'),
  burnt_tower: require('@/assets/images/backdrops/burnt_tower.png'),
  sky_pillar: require('@/assets/images/backdrops/sky_pillar.png'),
  stadium: require('@/assets/images/backdrops/stadium.png'),
  tempest: require('@/assets/images/backdrops/tempest.png'),
  underwater: require('@/assets/images/backdrops/underwater.png'),
} as const;

/**
 * Helper function to get backdrop for a Pokémon.
 * Prioritizes special case, falls back to type-based, then normal as default.
 */
export const getBackdropAsset = (
  type: string,
  pokemonId?: number
): ReturnType<typeof require> | null => {
  // Check for special Pokémon first
  const specialMapping: { [key: number]: keyof typeof SPECIAL_BACKDROP_ASSETS } = {
    150: 'mewtwo',      // Mewtwo
    384: 'rayquaza',    // Rayquaza
  };

  if (pokemonId && specialMapping[pokemonId]) {
    return SPECIAL_BACKDROP_ASSETS[specialMapping[pokemonId]];
  }

  // Fall back to type-based backdrop
  const typeKey = type.toLowerCase() as keyof typeof TYPE_BACKDROP_ASSETS;
  return TYPE_BACKDROP_ASSETS[typeKey] || TYPE_BACKDROP_ASSETS.normal;
};
```

### 10.2 Backdrop Asset Characteristics

**File Sizes (Reference):**
- Electric: 1.7 MB
- Fire: 1.8 MB
- Water: 2.0 MB
- Grass: 1.9 MB
- Psychic: 1.8 MB
- Normal: 1.6 MB
- Ghost: 1.5 MB
- Dark: 1.3 MB
- Dragon: 1.8 MB
- Flying: 1.7 MB
- Fighting: 1.5 MB
- Ground: 1.8 MB
- Ice: 1.7 MB
- Poison: 1.6 MB
- Rock: 2.0 MB
- Steel: 1.9 MB
- Bug: 1.9 MB
- Fairy: 1.8 MB

**Total Type Backdrops:** ~32 MB bundled (acceptable for mobile app, can be lazy-loaded or bundled with asset pack)

**Bundle Strategy Recommendation:**
1. **Small bundle approach:** Include only top 5 types (normal, fire, water, grass, electric) in main bundle (~8.5 MB)
2. **Load-on-demand:** Other type backdrops loaded asynchronously (not blocking app startup)
3. **Cache aggressively:** Once loaded, cache indefinitely (until app update)

### 10.3 Usage in PokemonHero Component

```typescript
import { TYPE_BACKDROP_ASSETS, getBackdropAsset } from '@/constants/backdropAssets';

interface PokemonHeroProps {
  // ... existing props ...
  typePrimary: string;
  pokemonId?: number;
}

function PokemonHero({ typePrimary, pokemonId, ...props }: PokemonHeroProps) {
  const backdropSource = useMemo(
    () => getBackdropAsset(typePrimary, pokemonId),
    [typePrimary, pokemonId]
  );

  return (
    <View style={styles.heroContainer}>
      {/* Backdrop Image Layer */}
      {backdropSource && (
        <Animated.Image
          source={backdropSource}
          style={[
            styles.backdrop,
            backdropAnimatedStyle, // Apply parallax transform
            { opacity: backdropOpacity }, // Apply scroll-based opacity fade
          ]}
        />
      )}

      {/* Gradient Overlay Layer */}
      <Animated.View
        style={[
          styles.gradientOverlay,
          gradientOverlayAnimatedStyle,
        ]}
      />

      {/* Rest of component (artwork, toggle, etc.) */}
      {/* ... */}
    </View>
  );
}

const styles = StyleSheet.create({
  heroContainer: {
    position: 'relative',
    width: '100%',
    height: 340,
    overflow: 'hidden',
  },
  backdrop: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    // Cropped to show upper 60%
    top: '-20%',
    bottom: '20%',
  },
  gradientOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  // ... rest of styles
});
```

---

## 11. Dual-Type & Normal-Type Considerations

<!-- NEW SECTION: Addressing special cases for type-based backdrops -->

### 11.1 Dual-Type Pokémon Strategy

**Decision:** Use primary type backdrop only, with possible overlay intensity adjustment.

**Rationale:**
- Keeps design simple and predictable (Charizard Fire/Flying always uses `fire.png`)
- Secondary type already indicated in type badges below hero
- Dual-type backdrops would be expensive (18×18 = 324 combinations)
- Users intuitively expect primary type to drive visual theme

**Implementation:**
```typescript
// Always use typePrimary for backdrop lookup
const backdropAsset = getBackdropAsset(typePrimary, pokemonId);

// If artwork legibility test fails for that Pokémon type,
// increase overlay intensity slightly:
const isHighLegibilityRisk = ['psychic', 'grass', 'normal'].includes(typePrimary);
const overlayStartOpacity = isHighLegibilityRisk ? 0.08 : 0.05;
```

### 11.2 Normal-Type Backdrop Treatment

**Challenge:** Normal-type is most common; backdrop must feel interesting, not generic.

**Solution:**
- **Backdrop Design:** `normal.png` features a natural landscape with varied terrain (meadow, sky, horizon)
- **Visual Richness:** Includes depth — foreground vegetation, middle-ground terrain, distant sky
- **Color Palette:** Warm earth tones with bright sky (natural lighting, interesting but not overwhelming)
- **Not Boring:** Should rival Fire/Water/Electric in visual appeal (testing needed)

**Legibility:** Normal-type may benefit from standard vignette + desaturation (10%) if artwork reads poorly initially.

**Testing Checklist:**
- [ ] Normal-type Pokémon (e.g., Pidgeot, Snorlax, Farfetch'd) artwork reads clearly against backdrop
- [ ] Normal-type doesn't feel "worse" than Fire/Water/Grass visually
- [ ] Vignette scrim isn't too aggressive (should feel natural)
- [ ] Gradient overlay at 5% opacity feels balanced

---

## 12. Color & Gradient Specification for Dark Mode

### 12.1 Type Color Gradient Mapping

**How to calculate hero gradient:**

```typescript
// Import from design system
import { TYPE_COLORS } from '@/constants/colors';

interface HeroGradientConfig {
  type: string;
  centerColor: string;
  edgeColor: string;
  overlayOpacity: number;
}

const getHeroGradient = (typePrimary: string): HeroGradientConfig => {
  const baseTypeColor = TYPE_COLORS[typePrimary] || TYPE_COLORS.normal;

  // Lighten type color by 30% and set to 10% opacity
  const lightenedColor = lightenHex(baseTypeColor, 0.3);
  const centerColor = `${lightenedColor}1A`; // 1A hex = 10% opacity

  return {
    type: typePrimary,
    centerColor, // Lightened type color, 10% opacity
    edgeColor: '#1E1A1A', // Surface from design system
    overlayOpacity: 0.8, // Final state overlay
  };
};

// Utility function: Lighten a hex color by percentage
const lightenHex = (hex: string, percent: number): string => {
  const rgb = hexToRgb(hex);
  const lightened = {
    r: Math.min(255, Math.round(rgb.r + (255 - rgb.r) * percent)),
    g: Math.min(255, Math.round(rgb.g + (255 - rgb.g) * percent)),
    b: Math.min(255, Math.round(rgb.b + (255 - rgb.b) * percent)),
  };
  return rgbToHex(lightened);
};
```

**All 18 Type Gradients (Pre-calculated):**

| Type | Base Color | Gradient Center (Lightened) | Gradient Edge |
|------|-----------|-------|------|
| Electric | #F8D030 | #FCDE7011 | #1E1A1A |
| Fire | #F08030 | #F4A85014 | #1E1A1A |
| Water | #6890F0 | #9CB5F511 | #1E1A1A |
| Grass | #78C850 | #A8D87514 | #1E1A1A |
| Ice | #98D8D8 | #CBECEC11 | #1E1A1A |
| Fighting | #C03028 | #DC8A8011 | #1E1A1A |
| Poison | #A040A0 | #D2A0D211 | #1E1A1A |
| Ground | #E0C068 | #F0E0B811 | #1E1A1A |
| Flying | #A890F0 | #D4B5F511 | #1E1A1A |
| Psychic | #F85888 | #FB8FAD11 | #1E1A1A |
| Bug | #A8B820 | #D6DC8011 | #1E1A1A |
| Rock | #B8A038 | #DCD08811 | #1E1A1A |
| Ghost | #705898 | #B8A0C811 | #1E1A1A |
| Dragon | #7038F8 | #B898FC11 | #1E1A1A |
| Dark | #705848 | #B8A89811 | #1E1A1A |
| Steel | #B8B8D0 | #DCD8E811 | #1E1A1A |
| Fairy | #EE99AC | #F6CCDD11 | #1E1A1A |
| Normal | #A8A878 | #D6D6B811 | #1E1A1A |

### 12.2 CSS Gradient Syntax

**React Native Approach (Linear Gradient Library):**

ChampionDex uses `react-native-linear-gradient` or native iOS/Android gradients.

```typescript
import LinearGradient from 'react-native-linear-gradient';

<LinearGradient
  colors={[heroGradient.centerColor, heroGradient.edgeColor]}
  start={{ x: 0.5, y: 0.5 }} // Center radial
  end={{ x: 1, y: 1 }}
  style={{ ...heroContainerStyle }}
>
  {/* Artwork + Shiny toggle */}
</LinearGradient>
```

**Web Equivalent (if considering Expo Web):**

```css
background: radial-gradient(
  ellipse at center,
  #FCDE7011 0%,
  #1E1A1A 100%
);
```

### 12.3 Overlay Gradient (Darkening Effect)

**As user scrolls, overlay becomes more opaque:**

```typescript
const overlayGradient = useAnimatedStyle(() => {
  const opacity = interpolate(
    scrollOffset.value,
    [0, heroHeight],
    [0, 0.8],
    Extrapolate.CLAMP
  );

  return {
    backgroundColor: `rgba(0, 0, 0, ${opacity})`,
  };
});
```

This overlay is semi-transparent black that fades in, darkening the artwork as the user scrolls. Improves readability of text that appears over the hero as it collapses.

---

## 13. Transition Spec: Hero to Content

### 13.1 Content Sections Order

Below the hero (in scroll order):

1. **Pokemon Info Section** (fixed height ~80px)
   - Dex number (#025)
   - Name (Pikachu)
   - Type badges (Electric, etc.)
   - Classification (Mouse Pokémon)
   - Height / Weight

2. **Abilities Section** (variable height, typically ~80px)
   - Ability badges with descriptions
   - Hidden ability indicator

3. **Base Stats Section** (fixed height ~240px)
   - Horizontal bar chart
   - BST total

4. **Related Forms Section** (if applicable, variable height)
   - Horizontal carousel of form cards

5. **Moveset Section** (large, scrollable internally)
   - Search bar
   - Move rows with type badges, power, accuracy

### 13.2 Visual Transition Details

**At Scroll Position 0–100px:**
- Hero visible (340px → 240px)
- Content header (Pokemon info) partially visible at bottom
- Artwork fully visible

**At Scroll Position 100–200px:**
- Hero further collapsed (240px → 140px)
- Content header becomes primary focal point
- Artwork opacity decreases (1.0 → 0.75)
- Sticky header opacity increases (0.3 → 1.0)

**At Scroll Position 200px+:**
- Hero minimal (140px → 100px)
- Artwork nearly invisible (0.75 → 0.6)
- Content section dominates viewport
- Sticky header fully opaque

### 13.3 No Gap or Separation

**Key Design Decision:** Hero and content should feel connected, not separated.

**How to achieve:**
1. Hero gradient background smoothly transitions to solid surface background
2. No margin or padding between hero and content sections
3. Pokemon info section begins immediately after hero collapse zone
4. Type color accent from hero carries into content (type badges use same color)

```
Hero (gradient background)
↓
Pokemon Info (surface background, type accent text)
↓
Abilities (surface background)
↓
Stats (surface background)
```

---

## 14. Implementation Checklist

### Phase 1: Component Structure
- [ ] Create `src/components/pokemon/PokemonHero.tsx` component file
- [ ] Define `PokemonHeroProps` TypeScript interface
- [ ] Create basic component structure (render artwork, toggle, placeholder)
- [ ] Integrate with existing color constants (`TYPE_COLORS`)

### Phase 2: Parallax Animation
- [ ] Set up Reanimated 2 scroll handler
- [ ] Implement parallax transform (0.5x velocity)
- [ ] Implement hero height collapse (340px → 100px)
- [ ] Test on iOS (iPhone 12+) and Android (Pixel 5+) for 60fps performance
- [ ] Optimize: Profile with React Native Debugger, ensure no JS thread blocking

### Phase 3: Shiny Toggle
- [ ] Create segmented control component
- [ ] Pre-load both normal and shiny images on mount
- [ ] Implement cross-fade animation (200ms)
- [ ] Handle missing shiny variant (disable button gracefully)
- [ ] Add analytics tracking for toggle events

### Phase 4: Header Integration
- [ ] Implement sticky header opacity animation
- [ ] Bind header state to scroll offset
- [ ] Update header background color / shadow during scroll
- [ ] Display Pokémon name in header once hero collapses

### Phase 5: Content Transition
- [ ] Position content sections below hero (no gaps)
- [ ] Ensure type color accent carries through
- [ ] Test smooth transition from hero to content sections
- [ ] Verify text legibility as artwork fades

### Phase 6: Accessibility
- [ ] Add `accessibilityLabel` for artwork ("Official artwork for Pikachu")
- [ ] Add `accessibilityLabel` for shiny toggle
- [ ] Add `accessibilityHint` for interactive elements
- [ ] Test with VoiceOver (iOS) and TalkBack (Android)
- [ ] Verify keyboard navigation (tab order)

### Phase 7: Testing & Polish
- [ ] Test parallax performance on low-end devices (iPhone SE, Pixel 3a)
- [ ] Verify animation smoothness at varying scroll speeds
- [ ] Test with network disabled (images cached)
- [ ] Test edge cases: missing artwork, missing shiny, dual-type Pokémon
- [ ] Performance budget check: Hero section < 2.5KB JS, < 1.5s render time

### Phase 8: Documentation & Handoff
- [ ] Document type color gradient calculations
- [ ] Provide copy-paste code snippets for implementation
- [ ] Create Figma design file showing all states
- [ ] Record demo video of parallax effect
- [ ] Update DESIGN_SYSTEM.md with hero animation tokens

---

## 15. Known Limitations & Future Enhancements

### Current Limitations

1. **Artwork availability in offline mode:** Home render images are fetched from PokeAPI CDN at runtime. Normal artwork for all Pokémon is bulk-prefetched to disk on first launch (batches of 10, resumes on restart). Shiny artwork is lazily prefetched when a detail screen is opened. The shiny toggle is disabled until the shiny image is confirmed in the `expo-image` disk cache — users offline before any prefetch cannot toggle to shiny for uncached Pokémon. See `src/services/prefetch/artworkPrefetchService.ts` for implementation.

2. **Static Gradient:** Hero gradient is radial ellipse, not fully customizable per type
   - Future: Could use SVG masks or custom shapes per type
   
3. **Artwork Fallback:** Simple placeholder if image fails to load
   - Future: Skeleton loader or graceful degradation with sprite image

4. **Fixed Parallax Factor:** 0.5x hardcoded for all devices
   - Future: Could adapt based on device performance (0.3x on low-end, 0.6x on high-end)

5. **No Gesture Support:** Parallax is scroll-only, not touch-draggable
   - Future: Pan gesture support for hero manipulation

### Post-MVP Enhancements

1. **Hero Blur Effect:** Gaussian blur on background as overlay intensifies
   - Requires `react-native-blur` or Skia integration

2. **Dynamic Particle Effects:** Type-themed particles (electric sparks, water droplets) in hero
   - Performance impact — test on low-end devices first

3. **Artwork Source Toggle:** Allow users to switch the hero artwork between Home renders (default, 3D-style) and official-artwork (Ken Sugimori flat style). Both are sourced from PokeAPI CDN. The toggle could live in Settings (global preference) or on the detail screen itself. Deferred from MVP — build after core detail views are stable.

4. **Form Indicator Badge:** Small badge showing current form (e.g., "Alolan" for Alolan Raichu)
   - Add to hero bottom or sticky header

5. **Haptic Feedback:** Subtle haptic pulse on shiny toggle (iOS Haptic Engine)
   - Uses `react-native-haptic-feedback`

---

## 16. Responsive Design Considerations

### Mobile (320px–479px)
- Hero height: 340px (full-width)
- Artwork size: 280px
- Shiny toggle: 120px fixed width, positioned bottom-right
- No adjustments needed — design is mobile-first

### Tablet Portrait (480px–767px)
- Hero height: 360px (slightly more prominent)
- Artwork size: 300px
- Shiny toggle: Expanded to 140px, more breathing room

### Tablet Landscape (768px+)
- Hero height: 400px (more dramatic on wider screens)
- Artwork size: 320px
- Optional: Two-column layout with hero on left, content preview on right

**Key:** Never exceed 400px hero height even on desktop (maintain visual hierarchy for content below)

---

## 17. Accessibility Audit Checklist

### Visual Accessibility
- [ ] Artwork contrast: Readable on dark background (type gradient doesn't obscure)
- [ ] Type colors in badges: Meet 4.5:1 contrast with text
- [ ] Shiny toggle: Clearly distinguishable active/inactive states
- [ ] Header opacity: Text always readable (minimum 0.3 opacity even at scroll start)

### Screen Reader Support
- [ ] Hero artwork: `accessibilityLabel="Official artwork for Pikachu"`
- [ ] Shiny toggle: `accessibilityLabel="Toggle shiny sprite variant"`
- [ ] Shiny toggle states: `accessibilityState={{ selected: isShiny }}`
- [ ] Type badges: Each announced as "[Type] type" (e.g., "Electric type")

### Motor Accessibility
- [ ] Shiny toggle: 48×36px minimum touch target (meets WCAG AAA)
- [ ] No hover-only content (mobile-friendly)
- [ ] No time-based interactions requiring quick response

### Color Blindness
- [ ] Type colors tested with Deuteranopia simulator (red-green blindness)
- [ ] Type badges always paired with text label (not color-only)
- [ ] Gradient readability not dependent on hue alone

### Cognitive Accessibility
- [ ] Clear visual hierarchy: Artwork prominent, toggle clear
- [ ] Consistent button behavior: Toggle always toggles
- [ ] Obvious affordances: Segmented control looks clickable

---

## 18. Migration Path from Current Scaffolding

### Current State
- Detail screen has placeholder layout
- No parallax scrolling
- No hero section with artwork
- Shiny toggle not yet implemented

### Migration Steps

1. **Create PokemonHero Component (standalone)**
   - Can be tested in isolation
   - No dependencies on page layout

2. **Integrate Hero into Detail Screen**
   - Place at top of ScrollView
   - Wrap ScrollView with Animated component

3. **Add Parallax Scroll Handler**
   - Connect scrollAnimatedValue to animations
   - Test parallax effect works

4. **Add Shiny Toggle & Animation**
   - State management for isShiny
   - Image pre-loading

5. **Connect Header Animation**
   - Update sticky header opacity/style based on scroll
   - Ensure smooth transitions

6. **Content Sections Flow**
   - Keep existing content sections
   - No refactoring needed, just verify layout

7. **Polish & Performance**
   - Profile animations
   - Optimize image loading
   - Test on multiple devices

### Zero-Breaking-Changes Approach
- Existing components (abilities, stats, moveset) remain unchanged
- Hero is additive (inserted at top)
- No refactoring of routing or data structures required

---

## 19. References & Inspiration

### Modern Apps Analyzed
- **Pokémon HOME:** Horizontal bars for stats, smooth detail transitions
- **Pokémon GO:** Type-colored hero sections, parallax scrolling effects
- **Spotify Artist Pages:** Parallax artwork, sticky header with title fade-in
- **Apple App Store:** Hero image collapse, smooth content flow
- **Google Play Store:** Type-based accent colors, gradient backgrounds

### Design System References
- ChampionDex DESIGN_SYSTEM.md (color palette, typography, spacing)
- DETAIL_VIEWS_UI_DESIGN.md (stat chart, related forms)
- DETAIL_VIEWS_SPEC.md (overall detail screen architecture)

### Technical References
- React Native Reanimated 2 Docs: https://docs.swmansion.com/react-native-reanimated/
- Expo SDK 57 Docs: https://docs.expo.dev/versions/v57.0.0/
- PokeAPI Artwork URLs: https://pokeapi.co/

---

## 20. Sign-Off & Version Control

**Version:** 1.2 (Artwork Source Update)  
**Date:** 2026-07-13  
**Status:** Ready for Implementation  
**Design Lead:** UI Designer  
**Approved by:** [Product Manager / Tech Lead signature]

**Revision Notes (v1.1 → v1.2):**
- Changed default hero artwork source from official-artwork to PokeAPI Home renders (3D-style, ~680×680px transparent PNGs)
- Updated Artwork Display section to specify Home render URLs
- Updated PokemonHeroProps `officialArtworkUrl` description to reflect Home render source
- Added "Artwork Source Toggle" as post-MVP enhancement for future implementation (defer from MVP)
- Maintained all previously-approved elements: dimensions, shiny toggle, sticky header, Reanimated 2 patterns, backdrop integration

**Previous Revision Notes (v1.0 → v1.1):**
- Added four-layer visual architecture with anime-style backdrop images
- Incorporated backdrop parallax (0.25x velocity) for multi-layer depth effect
- Added artwork legibility techniques: radial vignette scrim, soft shadow, optional desaturation
- Introduced backdrop asset map with ready-to-use TypeScript constants
- Addressed dual-type and Normal-type special cases
- Added detailed performance guidelines for backdrop image handling (bundling, resolution, caching)
- Updated scroll animations to include backdrop fade-out as hero collapses

**Document Location:** `/docs/HERO_PARALLAX_SPEC.md`

**Related Documents:**
- `/docs/DESIGN_SYSTEM.md` — Design tokens and component library
- `/docs/DETAIL_VIEWS_SPEC.md` — Overall detail screen architecture
- `/docs/DETAIL_VIEWS_UI_DESIGN.md` — Stat chart and related forms

---

**End of Document**

This specification is complete and ready for frontend developer implementation. All design decisions, animations, accessibility requirements, and implementation patterns are documented. For questions or clarifications, refer to the sections above or contact the design team.
