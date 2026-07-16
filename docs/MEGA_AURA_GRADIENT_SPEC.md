# Mega Evolution Aura — Final Implementation Spec

## Core Concept

A silhouette-conforming rainbow aura that radiates FROM the Pokémon outward, with all ROYGBIV colors spatially present simultaneously. The effect feels like a solar corona — ambient, tumultuous, shimmering — not a hypnotic sequential pulse.

**Key principle:** Each aura layer is a full ROYGBIV gradient (top-left ≠ bottom-right color). As 6 differently-angled gradient layers fade in and out at incommensurate rates, the color positions appear to shift and shimmer across the silhouette without any rotation of the Pokémon itself.

---

## Layer Stack (Z-order, bottom to top)

1. **Backdrop image** — static mega symbol backdrop
2. **Dark navy base shadow** — tinted silhouette, 1.01× scale, `tintColor="#1a1a2e"`, opacity 0.7
3. **6 rainbow aura layers** — SVG-masked gradient layers, staggered opacity animation
4. **Tight black contrast mask** — tinted silhouette, 1.015× scale, `tintColor="rgba(0,0,0,0.85)"`, static
5. **Artwork** — original Pokémon image (rendered by PokemonHero, not this layer)

---

## Rainbow Aura Layers

### SVG Structure
- **Canvas size:** `ARTWORK_SIZE * 2.0` = 560dp — large canvas gives blur room to spread
- **Centered** absolutely over artwork: `left = (screenWidth - SVG_SIZE) / 2`, `top: '50%'`, `marginTop: -SVG_SIZE/2`
- **6 separate `<Svg>` elements**, each in its own `<Animated.View>` — NOT one shared SVG
  - Reason: animating View opacity is pure GPU compositing; animating SVG Rect props forces SVG re-render every frame (causes jank)

### Per-layer SVG contents
Each SVG contains:
- One `<SvgLinearGradient>` with unique angle
- One `<Filter>` with `<FeGaussianBlur stdDeviation="64">` inside the `<Mask>` — blurs the mask source for feathered/diffuse edges
- One `<Mask>` referencing `artworkUrl` at 1.08× scale via `<SvgImage>` with the blur filter applied
- One static `<Rect>` filling the canvas with the gradient, clipped to the mask

### Gradient angles (x1/y1 → x2/y2)
```
Layer 0:  0°   x1="0" y1="0.5" x2="1" y2="0.5"  (left → right)
Layer 1:  60°  x1="0" y1="1"   x2="1" y2="0"     (bottom-left → top-right)
Layer 2:  120° x1="0" y1="0"   x2="1" y2="1"     (top-left → bottom-right)
Layer 3:  180° x1="1" y1="0.5" x2="0" y2="0.5"   (right → left)
Layer 4:  240° x1="1" y1="0"   x2="0" y2="1"     (top-right → bottom-left)
Layer 5:  300° x1="1" y1="1"   x2="0" y2="0"     (bottom-right → top-left)
```

### ROYGBIV gradient stops (all layers identical)
```
0%    #FF0000  stopOpacity 0       (transparent leading edge)
10%   #FF0000  stopOpacity 0.85
14.3% #FF7F00  stopOpacity 1
28.6% #FFFF00  stopOpacity 1
42.9% #00FF00  stopOpacity 1
57.1% #0000FF  stopOpacity 1
71.4% #4B0082  stopOpacity 1
85.7% #9400D3  stopOpacity 0.85
90%   #FF0000  stopOpacity 0.85
100%  #FF0000  stopOpacity 0       (transparent trailing edge)
```

### Mask blur filter
```xml
<Filter id="mgMaskBlurN" x="-60%" y="-60%" width="220%" height="220%">
  <FeGaussianBlur stdDeviation="64" />
</Filter>
```
Applied to the `<SvgImage>` inside `<Mask>` — blurs the alpha channel of the mask itself, so the gradient fades out softly beyond the silhouette rather than cutting off sharply.

---

## Animation

### Layer opacity cycling
- **Shared values:** `megaAOp0`–`megaAOp5` (existing, repurposed)
- **Animated styles:** `megaAStyle0`–`megaAStyle5` → `{ opacity: megaAOpN.value }` on each `<Animated.View>`
- **Pattern per layer:** 3-step `withSequence` — fast fade-in (35%), brief hold (10%), fast fade-out (25%) — then gap (30%) before next cycle repeat
- **Peak opacity:** 0.92 (bright, punchy)
- **Floor:** 0.0 (fully transparent between pulses)
- **Easing:** `Easing.inOut(Easing.sin)` on fade-in and fade-out

| Layer | Cycle duration | Start delay |
|-------|---------------|-------------|
| 0     | 5000ms        | 0ms         |
| 1     | 6500ms        | 800ms       |
| 2     | 4200ms        | 1600ms      |
| 3     | 7300ms        | 400ms       |
| 4     | 5800ms        | 1200ms      |
| 5     | 6100ms        | 2000ms      |

### Container mount fade-in
- **Shared value:** `megaGradRot` (repurposed — not used for rotation)
- **Animated style:** `megaGradRotStyle` → `{ opacity: megaGradRot.value }`
- **On mount:** `megaGradRot.value = withTiming(1, { duration: 800, easing: Easing.inOut(Easing.sin) })`
- **On cleanup:** `cancelAnimation(megaGradRot); megaGradRot.value = 0`
- **Purpose:** Prevents flash-in on first navigation — SVG mask images load async, so the container is invisible until they're ready

---

## Static Contrast Layers

### Dark navy base shadow (below aura)
```
width/height: ARTWORK_SIZE * 1.01
tintColor: "#1a1a2e"
opacity: 0.7
position: absolute, alignSelf: center, top: '50%', marginTop: -(ARTWORK_SIZE*1.01)/2
```

### Tight black contrast mask (above aura)
```
width/height: ARTWORK_SIZE * 1.015
tintColor: "rgba(0,0,0,0.85)"
opacity: 1 (implicit)
position: absolute, alignSelf: center, top: '50%', marginTop: -(ARTWORK_SIZE*1.015)/2
```
Creates a very tight dark rim separating the Pokémon from the rainbow aura.

---

## Implementation Notes

### Why 6 separate SVGs instead of 1
Animating `opacity` on an `Animated.View` wrapping a static `<Svg>` = GPU layer compositing only. The SVG renders once. Animating `animatedProps` on a `<Rect>` inside a shared SVG = SVG re-render every frame, including re-evaluating the expensive `FeGaussianBlur` filter = jank.

### Why blur inside the Mask, not on the Rect
Blurring the output of the Rect blurs the already-sharp silhouette cutout — the hard edge is preserved. Blurring the `<SvgImage>` inside the `<Mask>` softens the alpha channel of the mask itself, so the gradient fades out gradually at the silhouette boundary.

### SVG ID uniqueness
Each of the 6 SVGs uses its own suffixed IDs: `mgMask0`/`mgGrad0_g`/`mgMaskBlur0` through `mgMask5`/`mgGrad5_g`/`mgMaskBlur5`. SVG `id` attributes must be unique per document — since all 6 render simultaneously in the same RN view hierarchy, they cannot share IDs.

### Rules of Hooks compliance
- All `useSharedValue` and `useAnimatedStyle` calls are unconditional at component top level
- `megaAOp6` and `megaASc0`–`megaASc6` remain declared but unused (required by Rules of Hooks — cannot conditionally remove them)
- No new `useAnimatedProps` calls (the `AnimatedRect` approach was removed)

---

## File
`src/components/pokemon/BackdropParticleLayer.tsx` — mega render block at `if (backdropKey === 'mega' && artworkUrl)`
