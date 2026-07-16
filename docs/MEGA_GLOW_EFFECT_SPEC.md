# Mega Evolution Glow Effect Design Specification
## Shape-Conforming Aura Using `tintColor` Silhouettes

**Date:** 2026-07-16  
**Component:** `BackdropParticleLayer.tsx` enhancement (new 'mega' backdrop particle variant)  
**Target:** Expo SDK 57 / React Native / Reanimated 3  
**Related:** `PokemonHero.tsx` (Layer 3b insertion), `typeBackdrops.ts` (mega backdrop selection)

**Status:** Ready for implementation

---

## Overview

A multi-layered glow effect that sits **behind** the Pokémon artwork but **in front of** the backdrop image (Layer 3b in the z-stack). The effect uses shape-conforming silhouettes created by `expo-image`'s `tintColor` prop — NOT generic ellipses.

The effect has two main components:

1. **Inner dark shadow** — a semi-transparent black silhouette of the Pokémon itself, sitting directly behind the artwork to create contrast against the bright mega backdrop
2. **Outer rainbow aura** — 7 layered copies of the Pokémon artwork (one per ROYGBIV color), each with independent opacity pulsation to create a rainbow glow that radiates from the Pokémon's actual shape

Because `tintColor` preserves the artwork's alpha channel, the glow perfectly follows the Pokémon's silhouette — including tails, wings, ears, and other irregular outlines. The result is a shape-specific, immersive "mega energy" effect.

---

## Technical Constraints (MANDATORY)

- **Platform:** Expo SDK 57 / React Native only — no web CSS, no per-frame blur
- **Image API:** Must use `expo-image` with `tintColor` prop to create shape-conforming silhouettes
- **Animation engine:** Reanimated 3 ONLY (`useSharedValue`, `useAnimatedStyle`, `withTiming`, `withRepeat`, `withSequence`, `Easing`, `interpolateColor` if color-cycling is needed)
- **No per-frame JS callbacks** — all animation stays on the UI thread via worklets
- **Image-only composition** — the effect is built from `Image` components with `tintColor`, not SVG shapes
- **No blur filters** — React Native has no `box-shadow` or `filter: blur()`. Shape softness comes from opacity layering and pulsation rhythm, not blur.
- **Interaction:** `pointerEvents: 'none'` (effect layer never receives touches)
- **Memory:** Effect must work seamlessly in `BackdropParticleLayer` alongside 8 existing backdrop types (grass, fire, water, underwater, ice, electric, flying, bug)
- **Artwork URL must be passed:** `PokemonHero.tsx` must pass `currentArtworkUrl` to `BackdropParticleLayer` as a new prop so shadow/aura layers can reference the same image

---

## Layer Structure

### Hierarchy (z-order)

```
PokemonHero (z-base)
├── Layer 1: Backdrop image (parallax 0.25×)
├── Layer 2: Gradient overlay (radial, intensifies on scroll)
├── Layer 3: Vignette scrim (subtle darkening)
├── Layer 3b: MEGA GLOW EFFECT ← NEW
│   ├── Layer 3b-1: Dark shadow (Image with tintColor="rgba(0,0,0,X)")
│   ├── Layer 3b-2: Red aura (Image with tintColor="#FF0000")
│   ├── Layer 3b-3: Orange aura (Image with tintColor="#FF7F00")
│   ├── Layer 3b-4: Yellow aura (Image with tintColor="#FFFF00")
│   ├── Layer 3b-5: Green aura (Image with tintColor="#00FF00")
│   ├── Layer 3b-6: Blue aura (Image with tintColor="#0000FF")
│   ├── Layer 3b-7: Indigo aura (Image with tintColor="#4B0082")
│   └── Layer 3b-8: Violet aura (Image with tintColor="#9400D3")
├── Layer 4: Artwork (centered, parallax 0.5×, actual rendered color)
└── Layer 5+: Overlays (star button, VitalInfoBorder, etc.)
```

### Positioning

- **Container:** Absolute positioned, full hero width/height, `pointerEvents: none`
- **Shadow layer:** Centered, same size as artwork (`ARTWORK_SIZE` × `ARTWORK_SIZE`)
- **Aura layers:** Centered, each slightly larger via `scale` transform (`1.05` → `1.15` during pulsation)
- **All layers:** Same center point as artwork (hero center)
- **Animation:** Shared values drive opacity and scale only — NO positional translation

---

## Component Structure

The effect lives in `BackdropParticleLayer.tsx` as a **new backdrop particle config variant** (alongside grass, fire, water, etc.).

### Activation Gate

```typescript
// In BackdropParticleLayer.tsx, PARTICLE_CONFIGS
const PARTICLE_CONFIGS: Record<string, boolean> = {
  grass: true,
  fire: true,
  // ... existing types ...
  mega: true,  // ← ADD THIS LINE
};
```

### Props Update

Update `BackdropParticleLayerProps` to include the artwork URL:

```typescript
interface BackdropParticleLayerProps {
  backdropKey: string;       // e.g. 'mega' when formType === 'mega'
  heroHeight: number;        // e.g. 340 (hero vertical size)
  enabled?: boolean;         // default: true
  artworkUrl?: string | null; // ← NEW: artwork URL for shadow/aura layers
}
```

When calling from `PokemonHero.tsx`, pass `currentArtworkUrl`:

```typescript
<BackdropParticleLayer
  backdropKey={backdropKey}
  heroHeight={heroHeight}
  enabled={particlesEnabled}
  artworkUrl={currentArtworkUrl}  // ← NEW
/>
```

### Shared Value Declaration (Top Level)

Add nine new shared values **unconditionally** at the module top level in `BackdropParticleLayer`:

```typescript
// Mega effect animations (unconditional at top level — Rules of Hooks)
const megaShadowOpacity = useSharedValue(0.45);    // inner shadow opacity (semi-transparent black)

// Aura layer opacities (one per ROYGBIV color)
const megaAuraOpacities = [
  useSharedValue(0),  // Red
  useSharedValue(0),  // Orange
  useSharedValue(0),  // Yellow
  useSharedValue(0),  // Green
  useSharedValue(0),  // Blue
  useSharedValue(0),  // Indigo
  useSharedValue(0),  // Violet
];

// Aura layer scales (synchronized pulsation)
const megaAuraScales = [
  useSharedValue(1.05),  // Red
  useSharedValue(1.05),  // Orange
  useSharedValue(1.05),  // Yellow
  useSharedValue(1.05),  // Green
  useSharedValue(1.05),  // Blue
  useSharedValue(1.05),  // Indigo
  useSharedValue(1.05),  // Violet
];
```

---

## Inner Dark Shadow Layer

### Purpose

Provide high-contrast silhouette halo behind the artwork. The shadow creates visual separation between the Pokémon and the bright mega backdrop by rendering a semi-transparent black copy of the artwork directly behind it.

### Technique

A single `Image` component (from `expo-image`) with `tintColor` set to a dark, semi-transparent color. Because `tintColor` preserves the artwork's alpha channel, the result is a perfect dark silhouette that matches the Pokémon's exact shape — including irregular outlines, tails, wings, and ears.

### Properties

- **Source:** Same artwork URL as the main artwork layer (`artworkUrl`)
- **contentFit:** `"contain"` (match the main artwork rendering)
- **tintColor:** `"rgba(0, 0, 0, 0.45)"` — semi-transparent black
- **opacity:** Static at `1.0` (no animation; the shadow layer is always visible)
- **scale:** `1.0` (no scaling; sits exactly behind artwork)
- **size:** Same as artwork (`ARTWORK_SIZE` × `ARTWORK_SIZE`)
- **position:** Centered (`alignSelf: 'center'`, `position: 'absolute'`, `top: '50%'`, `marginTop: -ARTWORK_SIZE/2`)
- **cachePolicy:** `"memory-disk"` (leverages existing artwork cache)

### Visual Result

- A dark outline / shadow effect that follows the Pokémon's silhouette exactly
- NO blur or softness — purely opacity-based subtlety
- At 0.45 opacity, the shadow is visible but subtle; does not completely obscure the backdrop behind it
- The effect is "softer" than a harsh silhouette because the opacity is translucent

### Why No Blur?

React Native has no built-in blur on View components. While SVG `FeGaussianBlur` is available, adding complexity (SVG rendering + filters) for marginal visual gain is not worth the performance cost. Instead:
- The shadow layer relies on opacity transparency (0.45) to feel soft
- The pulsating aura layers (below) create additional visual softness through their cyclic opacity rhythm
- Together, these create a "glowing" feel without harsh edges

---

## Outer Rainbow Aura Layers

### Purpose

Seven stacked `Image` components, each tinted a different ROYGBIV color and independently animated, create a multi-layered rainbow glow that radiates from the Pokémon's shape. Together, they create a "mega energy" aura that pulsates to convey power.

### Why Seven Layers Instead of One?

- **Single gradient:** React Native's `tintColor` accepts only a flat color, not a gradient. A single-color image would be monochromatic.
- **Multiple layers:** By stacking 7 images (Red, Orange, Yellow, Green, Blue, Indigo, Violet), each with independent opacity animations offset in time, we approximate a rainbow effect. When the Red layer is bright, the others are dim; as Red fades, Orange rises, creating a ripple of color.
- **Shape-conforming:** Each layer uses the same artwork URL with a different `tintColor`, so all 7 layers follow the Pokémon's exact silhouette.

### Color Assignments (ROYGBIV)

```typescript
const AURA_COLORS = [
  '#FF0000', // Red
  '#FF7F00', // Orange
  '#FFFF00', // Yellow
  '#00FF00', // Green
  '#0000FF', // Blue
  '#4B0082', // Indigo
  '#9400D3', // Violet
];
```

### Per-Layer Properties

Each aura layer (7 total):
- **Source:** Same artwork URL as main artwork (`artworkUrl`)
- **contentFit:** `"contain"`
- **tintColor:** The assigned ROYGBIV color (flat, opaque)
- **size:** Same as artwork (`ARTWORK_SIZE` × `ARTWORK_SIZE`)
- **position:** Centered (same center point as shadow layer)
- **cachePolicy:** `"memory-disk"`
- **Opacity:** Animated independently with phase offset
- **Scale:** Pulsates from `1.05` (base) to `1.15` (peak), synchronized with opacity

### Scale Expansion Technique

Each aura layer scales outward via transform, creating a pulsating expansion effect:

```typescript
// Per layer: scale goes 1.05 → 1.15 → 1.05
transform: [{ scale: megaAuraScales[i].value }]
```

This makes the aura layer grow and shrink radially, expanding beyond the artwork during peak pulsation, then contracting back. The scale is applied to the `Image` inside an `Animated.View`, so the image scales from its center point (which matches the artwork center, thanks to centering).

### Animation Specification

**Opacity pulsation per layer:**
- Each layer has a **phase offset** so they don't all pulse simultaneously
- Phase offsets (delay before pulsation starts):
  - Red: 0ms
  - Orange: 150ms
  - Yellow: 300ms
  - Green: 450ms
  - Blue: 600ms
  - Indigo: 750ms
  - Violet: 900ms
- **Peak opacity per layer:** `0.40` (when visible)
- **Trough opacity:** `0.0` (completely invisible)
- **Fade-in duration:** 300ms (`Easing.out(Easing.quad)`)
- **Hold at peak:** 400ms
- **Fade-out duration:** 300ms (`Easing.in(Easing.quad)`)
- **Dark gap (invisible):** 500ms
- **Total cycle per layer:** 1500ms

**Scale pulsation (synchronized with opacity):**
- Scale from `1.05` → `1.15` during opacity ramp-up (300ms)
- Hold at `1.15` during peak opacity (400ms)
- Scale back to `1.05` during opacity ramp-down (300ms)
- Stay at `1.05` during dark gap (500ms)
- **Total cycle:** 1500ms (synchronized with opacity)
- **Easing:** `Easing.inOut(Easing.sin)` for smooth arc

### Why This Creates a Rainbow Effect

As each layer cycles through its animation independently, the peak-bright moments are staggered:
1. Red is brightest at 0ms
2. Orange peaks at 150ms (Red is fading)
3. Yellow peaks at 300ms (Red is dim, Orange is fading)
4. Green peaks at 450ms
5. Blue peaks at 600ms
6. Indigo peaks at 750ms
7. Violet peaks at 900ms
8. Then cycle repeats

From the viewer's perspective, a "ripple" of color sweeps through the aura as each layer fades in and out. Since all 7 layers are stacked and centered on the artwork, the cumulative effect reads as a vibrant, multi-colored glow that cycles through the rainbow spectrum.

---

## Animation Implementation

### Timing Constants (Top of BackdropParticleLayer.tsx)

```typescript
// Mega aura effect tuning constants
const MEGA_SHADOW_OPACITY = 0.45;        // semi-transparent black
const MEGA_AURA_OPACITY_PEAK = 0.40;     // peak opacity per color layer
const MEGA_AURA_SCALE_BASE = 1.05;       // baseline scale (5% larger)
const MEGA_AURA_SCALE_PEAK = 1.15;       // peak scale during pulsation (15% larger)

// Animation timing
const MEGA_AURA_FADE_IN = 300;           // ms
const MEGA_AURA_HOLD = 400;              // ms (hold at peak)
const MEGA_AURA_FADE_OUT = 300;          // ms
const MEGA_AURA_DARK_GAP = 500;          // ms (invisible pause)
const MEGA_AURA_CYCLE_DURATION = 1500;   // ms (total per layer)

// Phase offsets for ROYGBIV stagger (milliseconds)
const MEGA_AURA_PHASE_OFFSETS = [
  0,     // Red
  150,   // Orange
  300,   // Yellow
  450,   // Green
  600,   // Blue
  750,   // Indigo
  900,   // Violet
];
```

### Animated Styles (Unconditional at Module Top Level)

```typescript
const megaShadowStyle = useAnimatedStyle(() => ({
  opacity: megaShadowOpacity.value,
}));

// Create 7 animated styles, one per aura layer
const megaAuraStyles = megaAuraOpacities.map((opValue, idx) =>
  useAnimatedStyle(() => ({
    opacity: megaAuraOpacities[idx].value,
    transform: [{ scale: megaAuraScales[idx].value }],
  }))
);
```

### Setup in `useEffect`

When `backdropKey === 'mega'` and `enabled === true`:

```typescript
useEffect(() => {
  if (!isActive || backdropKey !== 'mega') return;

  // Animate each ROYGBIV layer
  const AURA_COLORS = [
    '#FF0000', '#FF7F00', '#FFFF00', '#00FF00', 
    '#0000FF', '#4B0082', '#9400D3'
  ];

  AURA_COLORS.forEach((color, idx) => {
    const phaseOffset = MEGA_AURA_PHASE_OFFSETS[idx];

    // Opacity animation for this layer
    megaAuraOpacities[idx].value = withDelay(
      phaseOffset,
      withRepeat(
        withSequence(
          withTiming(MEGA_AURA_OPACITY_PEAK, { 
            duration: MEGA_AURA_FADE_IN, 
            easing: Easing.out(Easing.quad) 
          }),
          withTiming(MEGA_AURA_OPACITY_PEAK, { 
            duration: MEGA_AURA_HOLD 
          }),
          withTiming(0, { 
            duration: MEGA_AURA_FADE_OUT, 
            easing: Easing.in(Easing.quad) 
          }),
          withTiming(0, { 
            duration: MEGA_AURA_DARK_GAP 
          }),
        ),
        -1,
        false,
      ),
    );

    // Scale animation for this layer (synchronized with opacity)
    megaAuraScales[idx].value = withDelay(
      phaseOffset,
      withRepeat(
        withSequence(
          // Ramp up during fade-in (300ms)
          withTiming(MEGA_AURA_SCALE_PEAK, { 
            duration: MEGA_AURA_FADE_IN, 
            easing: Easing.inOut(Easing.sin) 
          }),
          // Hold at peak (400ms)
          withTiming(MEGA_AURA_SCALE_PEAK, { 
            duration: MEGA_AURA_HOLD 
          }),
          // Scale back down during fade-out (300ms)
          withTiming(MEGA_AURA_SCALE_BASE, { 
            duration: MEGA_AURA_FADE_OUT, 
            easing: Easing.inOut(Easing.sin) 
          }),
          // Stay at base during dark gap (500ms)
          withTiming(MEGA_AURA_SCALE_BASE, { 
            duration: MEGA_AURA_DARK_GAP 
          }),
        ),
        -1,
        false,
      ),
    );
  });

  // Cleanup
  return () => {
    megaAuraOpacities.forEach(sv => cancelAnimation(sv));
    megaAuraScales.forEach(sv => cancelAnimation(sv));
  };
}, [isActive, backdropKey, enabled]);
```

---

## Render Implementation

Inside `BackdropParticleLayer.tsx`, add a new branch in the main render conditional:

```jsx
if (backdropKey === 'mega' && artworkUrl && isActive) {
  return (
    <View
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      pointerEvents="none"
    >
      {/* Shadow layer (dark silhouette) */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: ARTWORK_SIZE,
            height: ARTWORK_SIZE,
            alignSelf: 'center',
            top: '50%',
            marginTop: -ARTWORK_SIZE / 2,
            justifyContent: 'center',
            alignItems: 'center',
          },
          megaShadowStyle,
        ]}
        pointerEvents="none"
      >
        <Image
          source={{ uri: artworkUrl }}
          style={{ width: '100%', height: '100%' }}
          contentFit="contain"
          tintColor="rgba(0, 0, 0, 0.45)"
          cachePolicy="memory-disk"
        />
      </Animated.View>

      {/* Aura layers (ROYGBIV, one per color) */}
      {['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'].map((color, idx) => (
        <Animated.View
          key={`mega-aura-${color}`}
          style={[
            {
              position: 'absolute',
              width: ARTWORK_SIZE,
              height: ARTWORK_SIZE,
              alignSelf: 'center',
              top: '50%',
              marginTop: -ARTWORK_SIZE / 2,
              justifyContent: 'center',
              alignItems: 'center',
            },
            megaAuraStyles[idx],
          ]}
          pointerEvents="none"
        >
          <Image
            source={{ uri: artworkUrl }}
            style={{ width: '100%', height: '100%' }}
            contentFit="contain"
            tintColor={color}
            cachePolicy="memory-disk"
          />
        </Animated.View>
      ))}
    </View>
  );
}
```

### Key Points in Render

1. **All layers centered:** Same center point as artwork (hero center)
2. **All use `pointerEvents: 'none'`:** Effect never intercepts touches
3. **Same artwork URL:** Shadow + all 7 aura layers reference the same image source
4. **Different `tintColor` values:** Only the color changes; image source is identical
5. **Animated transform:** Only scale is animated; no positional translation
6. **Inside existing View:** Renders in Layer 3b (behind artwork, above backdrop)

---


---

## Performance Considerations

### Memory Profile

- **Image cache:** 1 entry per mega form (same artwork URI used 8 times: 1 shadow + 7 aura)
- **Shared values:** 16 total (1 shadow opacity + 7 aura opacities + 7 aura scales + 1 empty slot)
- **Animated styles:** 8 total (1 shadow + 7 aura)
- **Estimated heap:** <2MB per hero instance (negligible)

### CPU Impact

- **Per-frame cost:** <1ms per animation cycle (all on Reanimated UI thread)
- **Image rendering:** 8 `Image` components, but all reference the same cached artwork
- **tintColor operations:** GPU-accelerated (color multiply); no JS overhead
- **No shader recompilation:** tintColor changes don't require shader regeneration

### Why This Works at 60fps

1. `tintColor` is a single GPU operation (color multiply overlay)
2. All animations use Reanimated (UI thread, not JS)
3. Image cache is shared across all 8 layers
4. Scale transforms are GPU-accelerated (not layout recalculation)

---

## Critical Implementation Rules

### Rule 1: Declare Shared Values Unconditionally

All `useSharedValue()` calls MUST be at the component top level, outside any conditional logic:

```typescript
// CORRECT — at top level
const megaShadowOpacity = useSharedValue(0.45);
const megaAuraOpacities = [...].map(() => useSharedValue(0));
const megaAuraScales = [...].map(() => useSharedValue(1.05));

// Gate animations in useEffect, not shared value declaration
useEffect(() => {
  if (backdropKey !== 'mega') return;  // ← Gate here, not above
  // ... animation setup
}, [...]);
```

### Rule 2: Declare Animated Styles Unconditionally

All `useAnimatedStyle()` calls MUST be at the component top level:

```typescript
// CORRECT — at top level
const megaShadowStyle = useAnimatedStyle(() => ({
  opacity: megaShadowOpacity.value,
}));

const megaAuraStyles = megaAuraOpacities.map((_, idx) =>
  useAnimatedStyle(() => ({
    opacity: megaAuraOpacities[idx].value,
    transform: [{ scale: megaAuraScales[idx].value }],
  }))
);
```

### Rule 3: Use Image, Not SVG, for Shape Conformity

DO NOT use SVG circles or ellipses. The entire point is shape-conformity via `tintColor`:

```typescript
// CORRECT — use Image with tintColor
<Image
  source={{ uri: artworkUrl }}
  tintColor="rgba(0, 0, 0, 0.45)"
  contentFit="contain"
/>

// WRONG — using SVG circles loses shape-specific effect
<Svg><Ellipse cx={...} cy={...} rx={...} ry={...} /></Svg>
```

### Rule 4: Never Exceed 7 Aura Layers

The effect uses exactly 7 colors (ROYGBIV). Adding more layers adds complexity without visual benefit:

```typescript
// CORRECT
const AURA_COLORS = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'];

// WRONG — too many layers
const AURA_COLORS = [..., '#FF00FF', '#00FFFF', ...];
```

### Rule 5: Keep Phase Offsets Between 0–1500ms

The total cycle duration is 1500ms. Phase offsets should never exceed this:

```typescript
// CORRECT
const MEGA_AURA_PHASE_OFFSETS = [0, 150, 300, 450, 600, 750, 900];  // all < 1500ms

// WRONG
const MEGA_AURA_PHASE_OFFSETS = [0, 300, 600, 1200, 1500, 1800, 2100];  // exceeds 1500ms
```

### Rule 6: Use Opacity, Not Visibility, for Layering

Always animate `opacity`, never toggle `display` or `visibility`. This keeps animation smooth:

```typescript
// CORRECT
transform: [{ scale: megaAuraScales[idx].value }],
opacity: megaAuraOpacities[idx].value,

// WRONG
display: showAura ? 'flex' : 'none',  // causes jank
```

### Rule 7: pointerEvents Must Be 'none' on All Layers

The effect is purely visual; it must never intercept touches:

```typescript
// CORRECT — every View/Animated.View in the effect
<Animated.View pointerEvents="none" style={...}>
```

### Rule 8: Cache Artwork with memory-disk

Ensure the artwork is cached so all 8 Image components can reuse it:

```typescript
// CORRECT
<Image
  source={{ uri: artworkUrl }}
  cachePolicy="memory-disk"  // ← REQUIRED
  ...
/>
```

---

## Debugging Tips

### If Aura Layers Are Not Visible

1. **Check `artworkUrl` is passed:** Verify `PokemonHero.tsx` passes `currentArtworkUrl` to `BackdropParticleLayer`
2. **Check `backdropKey === 'mega'`:** Confirm the Pokémon has `formType === 'mega'` or is explicitly mapped to mega backdrop
3. **Check `isActive`:** Verify `enabled` prop is `true` and `PARTICLE_CONFIGS['mega']` is `true`
4. **Check `tintColor` value:** Verify the color strings are valid (e.g., `'#FF0000'`, not `'FF0000'`)
5. **Check z-order:** Confirm the View is rendered BEFORE the artwork Layer 4 (Layer 3b position)

### If Animation Is Stuttering

1. **Check shared value declarations:** Ensure all `useSharedValue()` calls are at top level, unconditional
2. **Check animated styles:** Ensure all `useAnimatedStyle()` calls are at top level
3. **Check animation function:** Verify no `runOnJS()` in the animation sequence
4. **Check phase offsets:** Ensure offsets are in range 0–900ms (less than 1500ms cycle)
5. **Logcat/Xcode:** Look for "Skipped frames" or "Dropped frames"; reduce phase offset stagger if too many

### If Colors Look Wrong

1. **Check hex values:** ROYGBIV colors must be exactly as specified (`#FF0000`, `#FF7F00`, etc.)
2. **Check opacity:** At 0.4 peak opacity, colors should be vibrant but translucent
3. **Check stacking:** When one layer is at 0.4 opacity, others should be dim or invisible (check timing)

### If Effect Is Positioned Wrong

1. **Check centering:** Artwork container center = effect container center
2. **Check margins:** `marginTop: -ARTWORK_SIZE / 2` must match artwork container
3. **Check scale origin:** React Native scales from center by default (correct here)

---

## Visual Quality Checklist (Device Testing)

Before final approval, verify on actual devices:

- [ ] Shadow layer visible directly behind artwork (dark outline, same shape)
- [ ] All 7 ROYGBIV colors visible in sequence (Red → Orange → Yellow → Green → Blue → Indigo → Violet)
- [ ] Pulsation smooth and continuous (no jank, no dropped frames)
- [ ] Scale expansion subtle but noticeable (1.05 → 1.15, not jarring)
- [ ] Aura starts dim, brightens to peak, fades to dark, repeats
- [ ] Each color peaks at its phase offset (150ms apart) — visible stagger pattern
- [ ] Effect does NOT obscure artwork (artwork remains sharp, opaque, in front)
- [ ] Effect does NOT intercept touches (button presses work normally)
- [ ] Effect maintains 60fps even during parallax scroll
- [ ] On mega Mewtwo: glow follows psychic silhouette perfectly
- [ ] On mega Charizard: glow follows dragon wings precisely
- [ ] On mega Rayquaza: glow encompasses full serpentine body shape
- [ ] No memory spikes when mega Pokémon appears
- [ ] No battery drain increase while effect is animating
- [ ] iOS and Android render identically (colors, timing, scale)

---

## Known Limitations & Trade-offs

**Limitation 1: No Blur Softness**
- The shadow and aura edges are sharp silhouettes, not blurred
- Softness comes from opacity layering (0.45 for shadow, 0.4 for aura) and pulsation rhythm
- This is a deliberate trade-off: blur would add 5–10ms overhead; opacity-based softness is free

**Limitation 2: Shape-Specific, Not Generic**
- The aura only looks right for the specific artwork URL
- If artwork changes (e.g., shiny toggle), the entire effect layers must reference the new URL
- Handled automatically by passing `currentArtworkUrl` prop

**Limitation 3: Static Color Assignment**
- Each layer is locked to one ROYGBIV color
- True rainbow gradient cycling (color wheel rotation) would require `interpolateColor` driving `tintColor`, which is complex
- Current approach (7 overlapping colors with staggered phase) is simpler and visually equivalent

**Limitation 4: No Per-Pokémon Customization**
- All mega Pokémon use the same 7-color sequence and timing
- Custom color schemes per mega form would require a mapping table (out of scope)
- Can be added later if design needs differentiation

---

## Migration Path (If Performance Issues Arise)

If testing reveals performance problems, fallback strategies:

### Strategy A: Reduce Aura Layer Count
- Use 3–4 colors instead of 7 (e.g., Red, Green, Blue only)
- Simplifies stacking and reduces Image render count
- Still reads as "rainbow energy" but less vibrant

### Strategy B: Disable Shadow Layer
- Render only the 7 aura layers (no shadow)
- Saves one Image render per frame
- Effect is less grounded but still visible

### Strategy C: Static Aura
- Remove all animations; render all 7 layers at constant opacity (0.2)
- Effect is static but still shape-specific and readable
- Frees up all Reanimated overhead

### Strategy D: Single Composite Layer
- Render one Image with tintColor cycling through ROYGBIV via `interpolateColor`
- Single Image, single scale animation
- Color appears to slowly shift through rainbow
- Simplest fallback; still shape-specific

---

## Implementation Checklist (For Developer)

- [ ] Add `artworkUrl` prop to `BackdropParticleLayerProps`
- [ ] Add `artworkUrl={currentArtworkUrl}` call in `PokemonHero.tsx`
- [ ] Add `mega: true` to `PARTICLE_CONFIGS`
- [ ] Declare 9 shared values at top level (1 shadow + 7 opacities + 7 scales, but scales can be array)
- [ ] Declare animated styles at top level
- [ ] Add `useEffect` branch for `backdropKey === 'mega'`
- [ ] Implement animation setup in `useEffect` (shadow + 7 aura layers)
- [ ] Add cleanup return in `useEffect` (cancelAnimation for all shared values)
- [ ] Implement render conditional for `backdropKey === 'mega'`
- [ ] Test on iOS 14+
- [ ] Test on Android 10+
- [ ] Verify 60fps during parallax scroll
- [ ] Verify no memory leaks (run for 5 minutes of active scrolling)
- [ ] Verify shiny toggle doesn't break animation
- [ ] Get visual approval from design

---

## Final Notes

- This spec is **developer-ready and highly prescriptive** to minimize ambiguity
- All numeric values (timings, opacities, scales, phase offsets) are recommendations — adjust ±10–15% if device testing or visual feedback suggests refinement
- The effect should feel **alive and energetic but not overwhelming** — if it reads too intense, reduce `MEGA_AURA_OPACITY_PEAK` to 0.30 and `MEGA_AURA_SCALE_PEAK` to 1.10
- Always test on both high-end (iPhone 15 Pro, Pixel 8) and mid-range (iPhone 12, Pixel 6a) devices to ensure performance across the spectrum
