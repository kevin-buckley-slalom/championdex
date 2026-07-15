# Pokémon Detail Screen: Fluid Visual Language Redesign
**Date:** 2026-07-14  
**Audience:** React Native engineers (Expo SDK 57, Reanimated 3)  
**Status:** Concrete implementation spec with exact values  
**Goal:** Replace blocky, card-driven UX with a fluid, immersive experience where the page "feels alive"

---

## Executive Summary

The detail screen currently feels **cold and static**. Every section is an opaque, bordered card. The background ignores the Pokémon's type. Nothing animates beyond the hero. The redesign creates:

1. **Ambient type-colored environment** that wraps the entire page
2. **Parallax and scroll-driven animations** that create depth and motion
3. **Blended section flow** with transparency, overlays, and no hard borders
4. **Vibrant, tactile interactive elements** (glowing stat bars, animated type squares)
5. **Entrance animations** that reveal content as the user scrolls
6. **Cohesive design language** where sections feel like they're part of one organism, not disconnected parts

This spec gives exact values, colors, opacities, animation timings, and code patterns ready for immediate implementation.

---

## Part 1: Ambient Background System

### 1.1 Core Principle
The page background should **take on the Pokémon's primary type color as a very subtle gradient**. This creates an "immersive environment" effect—like stepping into a world infused with that type's essence.

### 1.2 Type-to-Ambient Color Mapping
Each type maps to:
- **Ambient hex color** (the type color, or a variant thereof)
- **Opacity** (applied as rgba)
- **Gradient direction** (top-to-bottom or radial)

**Exact Mapping (18 types):**

| Type | Hex | Opacity | Gradient |
|------|-----|---------|----------|
| normal | #A8A878 | 0.08 | top-to-bottom |
| fire | #F08030 | 0.12 | top-to-bottom |
| water | #6890F0 | 0.10 | radial (hero center) |
| electric | #F8D030 | 0.12 | top-to-bottom |
| grass | #78C850 | 0.10 | radial (hero center) |
| ice | #98D8D8 | 0.09 | top-to-bottom |
| fighting | #C03028 | 0.08 | top-to-bottom |
| poison | #A040A0 | 0.10 | top-to-bottom |
| ground | #E0C068 | 0.11 | top-to-bottom |
| flying | #A890F0 | 0.10 | top-to-bottom |
| psychic | #F85888 | 0.09 | radial (hero center) |
| bug | #A8B820 | 0.09 | top-to-bottom |
| rock | #B8A038 | 0.08 | top-to-bottom |
| ghost | #705898 | 0.12 | radial (hero center) |
| dragon | #7038F8 | 0.11 | radial (hero center) |
| dark | #705848 | 0.10 | top-to-bottom |
| steel | #B8B8D0 | 0.08 | top-to-bottom |
| fairy | #EE99AC | 0.10 | top-to-bottom |

### 1.3 Ambient Background Implementation

**In `app/(main)/(pokedex)/[id].tsx`, wrap the ScrollView:**

```typescript
// At top of component, after pokemon data loads:
const getAmbientBackground = (primaryType: string) => {
  const ambientMap: Record<string, { color: string; opacity: number; gradient: 'linear' | 'radial' }> = {
    normal: { color: '#A8A878', opacity: 0.08, gradient: 'linear' },
    fire: { color: '#F08030', opacity: 0.12, gradient: 'linear' },
    water: { color: '#6890F0', opacity: 0.10, gradient: 'radial' },
    electric: { color: '#F8D030', opacity: 0.12, gradient: 'linear' },
    grass: { color: '#78C850', opacity: 0.10, gradient: 'radial' },
    ice: { color: '#98D8D8', opacity: 0.09, gradient: 'linear' },
    fighting: { color: '#C03028', opacity: 0.08, gradient: 'linear' },
    poison: { color: '#A040A0', opacity: 0.10, gradient: 'linear' },
    ground: { color: '#E0C068', opacity: 0.11, gradient: 'linear' },
    flying: { color: '#A890F0', opacity: 0.10, gradient: 'linear' },
    psychic: { color: '#F85888', opacity: 0.09, gradient: 'radial' },
    bug: { color: '#A8B820', opacity: 0.09, gradient: 'linear' },
    rock: { color: '#B8A038', opacity: 0.08, gradient: 'linear' },
    ghost: { color: '#705898', opacity: 0.12, gradient: 'radial' },
    dragon: { color: '#7038F8', opacity: 0.11, gradient: 'radial' },
    dark: { color: '#705848', opacity: 0.10, gradient: 'linear' },
    steel: { color: '#B8B8D0', opacity: 0.08, gradient: 'linear' },
    fairy: { color: '#EE99AC', opacity: 0.10, gradient: 'linear' },
  };
  
  return ambientMap[primaryType.toLowerCase()] || { color: '#111010', opacity: 0, gradient: 'linear' as const };
};

const ambient = getAmbientBackground(pokemon.primaryType);

// Convert hex to rgba
const ambientRgba = (hex: string, opacity: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};
```

**Then wrap your ScrollView with LinearGradient:**

```typescript
<LinearGradient
  colors={ambient.gradient === 'radial'
    ? [colors.background, ambientRgba(ambient.color, ambient.opacity)]
    : [ambientRgba(ambient.color, ambient.opacity), colors.background]
  }
  start={ambient.gradient === 'radial' ? { x: 0.5, y: 0.2 } : { x: 0, y: 0 }}
  end={ambient.gradient === 'radial' ? { x: 0.5, y: 1 } : { x: 0, y: 1 }}
  style={styles.ambientGradient}
>
  <Animated.ScrollView
    // ... existing props
  >
    {/* content */}
  </Animated.ScrollView>
</LinearGradient>

// Add to StyleSheet:
ambientGradient: {
  flex: 1,
}
```

### 1.4 Why These Values?

- **Opacity 0.08-0.12** → Subtle enough to not overwhelm dark theme; visible but never dominating
- **Top-to-bottom gradient** (most types) → Natural flow, like viewing through tinted glass
- **Radial gradient** (water, grass, psychic, ghost, dragon) → Water/Grass/Psychic feel "emanating" from the Pokémon; Ghost/Dragon supernatural aura
- **Opacity varies by type** → Some types (Fire, Electric, Ground) naturally feel more vibrant; others (Normal, Rock, Steel) more muted

---

## Part 2: Hero Section Immersion & Parallax

### 2.1 Goals
- Make the artwork feel like it's "floating" above the page
- Create depth through parallax (different layers move at different rates)
- Smooth fade-in transition from hero to content below
- Shiny toggle floats as a pill, no hard background

### 2.2 Hero Height and Collapse Animation

**Current:** 340px → 100px on scroll  
**Keep this.** But enhance the parallax effect.

**Parallax velocities (exact values):**
- **Backdrop image:** 0.25× scroll speed (slowest, feels distant)
- **Artwork:** 0.5× scroll speed (medium, feels floating)
- **Gradient overlay:** Intensifies 0% → 70% opacity as hero collapses

**Implementation in PokemonHero.tsx (already mostly done, just confirm):**

```typescript
const HERO_HEIGHT = 340;
const MIN_HERO_HEIGHT = 100;
const BACKDROP_PARALLAX_FACTOR = 0.25; // ✓ Already correct
const ARTWORK_PARALLAX_FACTOR = 0.5;  // ✓ Already correct

// Hero container collapse animation (already in code)
const heroContainerStyle = useAnimatedStyle(() => {
  const height = interpolate(
    scrollAnimatedValue.value,
    [0, heroHeight],
    [heroHeight, minHeroHeight],
    Extrapolate.CLAMP,
  );
  return { height };
}, [heroHeight, minHeroHeight]);
```

### 2.3 Gradient Fade from Hero to Content Below

**New:** Add a smooth gradient transition from the hero's bottom to the ambient background, so the hero doesn't feel "cut off."

**In PokemonHero.tsx, add before closing `</Animated.View>`:**

```typescript
{/* Layer 6: Bottom Fade Gradient (smooths transition from hero to content) */}
<LinearGradient
  colors={[
    'rgba(0, 0, 0, 0)',        // transparent at hero top
    'rgba(0, 0, 0, 0.15)',     // very subtle darkening
    'rgba(0, 0, 0, 0.3)',      // transition zone
    colors.background,         // solid background at bottom
  ]}
  start={{ x: 0.5, y: 0 }}
  end={{ x: 0.5, y: 1 }}
  style={styles.heroFadeGradient}
/>

// Add to StyleSheet:
heroFadeGradient: {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  height: 80, // gradient spans 80px upward from bottom
},
```

### 2.4 Artwork "Floating" Effect

**Current:** Already has drop shadow. Enhance it.

**In PokemonHero.tsx artworkContainer styles:**

```typescript
artworkContainer: {
  // ... existing ...
  shadowColor: colors.background,
  shadowOffset: { width: 0, height: 8 },   // Shift shadow downward (was 0)
  shadowOpacity: 0.5,                       // Slightly increase (was 0.4)
  shadowRadius: 24,                         // Increase blur (was 20)
  elevation: 16,                            // Android (was 12)
}
```

This makes the artwork feel like it's "lifted" above the page.

### 2.5 Shiny Toggle as Floating Pill

**Current:** Rendered inside hero, positioned absolutely at bottom.  
**Change:** Keep the component styling (pill-like), but move outside hero to its own section below.

**In [id].tsx (if not already done):**

```typescript
<View style={styles.shinyToggleSection}>
  <ShinyToggle
    isShiny={isShiny}
    onToggle={setIsShiny}
    disabled={!pokemon.pokeApiId || !shinyReady}
  />
</View>

// Add to StyleSheet:
shinyToggleSection: {
  alignItems: 'center',
  paddingVertical: spacing.lg,
  backgroundColor: colors.background,  // Or use ambient if available
  borderBottomWidth: 1,
  borderBottomColor: 'rgba(255, 255, 255, 0.05)',  // Very subtle divider
}
```

---

## Part 3: Section Flow — No More Bordered Cards

### 3.1 Core Principle
Sections should flow together like a narrative, not stack like data sheets. Borders are removed. Separation comes from:
1. Typography scale and weight
2. Subtle dividers (1px transparent border or 4px gaps)
3. Background color changes (very subtle)
4. Vertical whitespace rhythm

### 3.2 Section Wrapper Pattern

**Instead of:**
```typescript
<View style={styles.section}>
  <Text style={styles.sectionTitle}>Abilities</Text>
  <View style={styles.abilitiesContainer}>
    {/* content */}
  </View>
</View>
```

**Use this (no bordered card):**

```typescript
<View style={styles.fluidSection}>
  <Text style={styles.sectionTitleFluid}>Abilities</Text>
  {/* content flows directly, no card wrapper */}
</View>

// StyleSheet:
fluidSection: {
  paddingHorizontal: spacing.lg,
  paddingVertical: spacing.lg,
  borderBottomWidth: 1,
  borderBottomColor: 'rgba(255, 255, 255, 0.04)',  // Nearly invisible divider
  gap: spacing.md,
},

sectionTitleFluid: {
  fontSize: fontSize.lg,
  fontWeight: '700',
  color: colors.text,
  marginBottom: spacing.sm,
  opacity: 0.95,  // Subtle, not stark
}
```

### 3.3 Section Header Redesign

**Make headers feel like they're introducing content, not labeling a table.**

**In all section components, use this pattern:**

```typescript
<Text style={styles.sectionTitle}>Base Stats</Text>
<Text style={styles.sectionSubtitle}>Tap to compare with other Pokémon</Text>
{/* content */}
```

**Or just a single elegant header without the clinical look:**

```typescript
// Instead of: fontSize.lg, fontWeight: '700'
sectionTitle: {
  fontSize: fontSize.xl,              // Slightly larger
  fontWeight: '700',
  color: colors.text,
  opacity: 0.95,
  marginBottom: spacing.lg,
  letterSpacing: 0.5,                 // Subtle letter spacing (iOS)
}
```

---

## Part 4: Stat Bars — Glow & Gradient Animation

### 4.1 Current State
Bars are solid colored rectangles that animate in. That's good; now make them feel vibrant.

### 4.2 Stat Bar Redesign

**In StatChart.tsx, replace the barFill style:**

```typescript
// BEFORE:
barFill: {
  height: '100%',
  borderRadius: borderRadius.sm,
}

// AFTER:
barFill: {
  height: '100%',
  borderRadius: borderRadius.sm,
  // Gradient fill: type color → darker shade
  // Plus inner glow for vibrancy
}
```

**Implementation:**

```typescript
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

// In StatBar component:
<View style={styles.barTrack}>
  <Animated.View
    style={[
      styles.barFill,
      { width: `${barWidth}%` },
      animatedBarStyle,
    ]}
  >
    {/* Gradient fill */}
    <LinearGradient
      colors={[accentColor, adjustBrightness(accentColor, -0.2)]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.barGradient}
    />
    
    {/* Glow layer (subtle highlight) */}
    <View style={styles.barGlowOverlay} />
  </Animated.View>
</View>

// Utility: Brighten/darken a hex color
function adjustBrightness(hex: string, percent: number): string {
  const r = Math.min(255, Math.max(0, parseInt(hex.slice(1, 3), 16) * (1 + percent)));
  const g = Math.min(255, Math.max(0, parseInt(hex.slice(3, 5), 16) * (1 + percent)));
  const b = Math.min(255, Math.max(0, parseInt(hex.slice(5, 7), 16) * (1 + percent)));
  return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
}

// StyleSheet additions:
barGradient: {
  flex: 1,
  borderRadius: borderRadius.sm,
},
barGlowOverlay: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  height: 6, // Top edge only
  backgroundColor: 'rgba(255, 255, 255, 0.15)',
  borderRadius: borderRadius.sm,
}
```

### 4.3 Entrance Animation: Staggered Bar Reveal

**Already implemented (bars animate in with delay).** But enhance by adding a fade-in + scale effect:

```typescript
const animatedBarStyle = useAnimatedStyle(() => ({
  width: animated
    ? `${interpolate(progress.value, [0, 1], [0, barWidth])}%`
    : `${barWidth}%`,
  opacity: animated
    ? interpolate(progress.value, [0, 1], [0, 1])  // NEW: Fade in
    : 1,
  transform: [
    {
      scaleY: animated
        ? interpolate(progress.value, [0, 1], [0.8, 1])  // NEW: Slight scale up
        : 1,
    }
  ]
}));
```

---

## Part 5: Type Effectiveness Table — Vibrant, Tactile Squares

### 5.1 Current State
Flat colored boxes with borders. Static, not interactive.

### 5.2 Type Square Redesign

**Each square should feel like a button with depth and vibrancy.**

**In TypeEffectivenessTable.tsx, replace TypeSquare component:**

```typescript
const TypeSquare: React.FC<TypeSquareProps> = ({ 
  typeName, 
  effectiveness, 
  isDefenseTab, 
  squareWidth,
  onPress,  // NEW: Add press handler
}) => {
  const typeColor = typeColors[typeName] || colors.textMuted;
  const pressAnim = useSharedValue(0);
  const [isPressed, setIsPressed] = useState(false);
  
  // NEW: Pressed state animation
  const handlePressIn = () => {
    setIsPressed(true);
    pressAnim.value = withTiming(1, { duration: 100 });
  };
  
  const handlePressOut = () => {
    setIsPressed(false);
    pressAnim.value = withTiming(0, { duration: 100 });
  };
  
  // NEW: Scale and glow on press
  const pressedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(pressAnim.value, [0, 1], [1, 0.95]),
      }
    ],
    opacity: interpolate(pressAnim.value, [0, 1], [1, 0.9]),
  }));
  
  // Determine effectiveness label and color
  let effectivenessLabel = '';
  let effectivenessColor: string = colors.text;
  
  if (effectiveness === 0.25) {
    effectivenessLabel = '¼';
    effectivenessColor = isDefenseTab ? '#4CAF50' : '#F44336';
  } else if (effectiveness === 0.5) {
    effectivenessLabel = '½';
    effectivenessColor = isDefenseTab ? '#4CAF50' : '#F44336';
  } else if (effectiveness === 2) {
    effectivenessLabel = '2×';
    effectivenessColor = isDefenseTab ? '#F44336' : '#4CAF50';
  } else if (effectiveness === 4) {
    effectivenessLabel = '4×';
    effectivenessColor = isDefenseTab ? '#F44336' : '#4CAF50';
  }
  
  const squareHeight = squareWidth * 1.8;
  const abbrev = TYPE_ABBREVIATIONS[typeName] || typeName.toUpperCase().slice(0, 3);
  
  // NEW: Calculate background with glow
  const backgroundColor = effectiveness === 0 
    ? 'transparent' 
    : `${typeColor}CC`;
  
  return (
    <Animated.View
      style={[
        styles.typeSquareWrapper,
        pressedStyle,
      ]}
    >
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => onPress?.(typeName)}
        style={[
          styles.typeSquare,
          {
            width: squareWidth,
            height: squareHeight,
            backgroundColor,
            borderColor: typeColor,
            // NEW: Add inner shadow for depth
            shadowColor: effectiveness === 0 ? 'transparent' : typeColor,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
          },
        ]}
      >
        {/* NEW: Gradient overlay for glow effect */}
        {effectiveness !== 0 && (
          <LinearGradient
            colors={[
              `${typeColor}33`,  // Type color at 20% opacity
              'transparent',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.5, y: 0.5 }}
            style={styles.typeSquareGlow}
          />
        )}
        
        <Text style={[
          styles.typeLabel, 
          { fontSize: Math.max(10, squareWidth * 0.35) }
        ]}>
          {abbrev}
        </Text>
        
        {effectivenessLabel && (
          <Text style={[
            styles.effectivenessLabel, 
            { 
              color: effectivenessColor, 
              fontSize: Math.max(8, squareWidth * 0.3) 
            }
          ]}>
            {effectivenessLabel}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );
};

// Add to StyleSheet:
typeSquareWrapper: {
  // For press animation
},
typeSquareGlow: {
  position: 'absolute',
  width: '100%',
  height: '100%',
  borderRadius: borderRadius.sm,
},
```

### 5.3 Tab Animation: Smooth Transition

**When switching tabs, squares should fade and slide in.**

**In TypeEffectivenessTable.tsx:**

```typescript
const tabOpacity = useSharedValue(1);
const tabSlideX = useSharedValue(0);

const handleTabPress = (index: number) => {
  if (index === activeTabIndex) return;
  
  // Fade out
  tabOpacity.value = withTiming(0, { duration: 150 });
  
  // Slide out (previous direction)
  tabSlideX.value = withTiming(index > activeTabIndex ? 20 : -20, { duration: 150 });
  
  // After fade, change tab
  setTimeout(() => {
    setActiveTabIndex(index);
    
    // Slide in (opposite direction)
    tabSlideX.value = withTiming(index > activeTabIndex ? -20 : 20, { duration: 0 });
    
    // Fade in
    tabOpacity.value = withTiming(1, { duration: 150 });
  }, 150);
};

const gridAnimStyle = useAnimatedStyle(() => ({
  opacity: tabOpacity.value,
  transform: [
    {
      translateX: tabSlideX.value,
    }
  ]
}));

// In render:
<Animated.View style={[styles.gridContainer, gridAnimStyle]}>
  <TypeGridRow ... />
  <TypeGridRow ... />
</Animated.View>
```

---

## Part 6: Evolution Chain — Organic Connection Lines

### 6.1 Current State
Horizontal cards with arrows between them.

### 6.2 Organic Evolution Connectors

**Instead of simple arrows, use curved gradient lines.**

**In EvolutionChain.tsx, update EvolutionArrow:**

```typescript
const EvolutionArrow: React.FC<EvolutionArrowProps> = ({ condition }) => {
  return (
    <View style={styles.arrowContainer}>
      {/* NEW: Curved connector line */}
      <Svg
        width={60}
        height={40}
        style={styles.connectorLine}
      >
        <Defs>
          <LinearGradient
            id="arrowGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <Stop offset="0%" stopColor="rgba(255, 255, 255, 0)" />
            <Stop offset="50%" stopColor="rgba(255, 255, 255, 0.3)" />
            <Stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
          </LinearGradient>
        </Defs>
        
        {/* Curved quadratic path (looks organic) */}
        <Path
          d="M 0 20 Q 30 5, 60 20"
          stroke="url(#arrowGradient)"
          strokeWidth="2"
          fill="none"
        />
        
        {/* Arrow head */}
        <Polygon
          points="60,20 55,17 57,20 55,23"
          fill="rgba(255, 255, 255, 0.4)"
        />
      </Svg>
      
      {/* Condition label */}
      <Text style={styles.conditionLabel}>{condition}</Text>
    </View>
  );
};

// StyleSheet:
connectorLine: {
  marginHorizontal: spacing.sm,
},
```

**If SVG is overkill, simpler fallback:**

```typescript
<View style={styles.arrowBox}>
  <View style={styles.arrowLine} />
  <Text style={styles.arrow}>▶</Text>
  <Text style={styles.conditionLabel}>{condition}</Text>
</View>

// StyleSheet:
arrowLine: {
  height: 1,
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
  marginHorizontal: spacing.sm,
}
```

### 6.3 Evolution Card Floating Disc

**Make each evolution card feel like a floating portrait.**

**In PokemonCard component:**

```typescript
<Pressable
  onPress={onPress}
  style={({ pressed }) => [
    styles.cardContainer,
    pressed && styles.cardPressed,
  ]}
>
  {/* NEW: Floating disc background */}
  <View style={styles.floatingDisc} />
  
  <Image
    source={{
      uri: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${pokemon.pokeApiId}.png`,
    }}
    style={styles.artwork}
    contentFit="contain"
    cachePolicy="memory-disk"
  />
  
  <Text style={styles.name}>{pokemon.displayName}</Text>
  <Text style={styles.dexNumber}>#{pokemon.nationalDex.toString().padStart(3, '0')}</Text>
</Pressable>

// StyleSheet additions:
floatingDisc: {
  position: 'absolute',
  width: 100,
  height: 100,
  borderRadius: 50,
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  top: -10,
  zIndex: 0,
}
```

---

## Part 7: Text-Heavy Sections (Abilities, Flavor, Moves) — Visual Breathing Room

### 7.1 Abilities Section

**Remove bordered ability rows. Use dividers and clean typography.**

```typescript
// BEFORE: Each ability in a card with border
<View style={styles.abilityRow}>
  <Text>{ability.displayName}</Text>
</View>

// AFTER: Clean rows with dividers, no cards
<Pressable
  style={({ pressed }) => [
    styles.abilityItem,
    pressed && styles.abilityItemPressed,
  ]}
>
  <View style={styles.abilityContent}>
    <Text style={styles.abilityName}>{ability.displayName}</Text>
    {ability.isHidden && (
      <View style={styles.hiddenBadge}>
        <Text style={styles.hiddenText}>✦ Hidden</Text>
      </View>
    )}
  </View>
  <Text style={styles.abilityChevron}>›</Text>
</Pressable>

// StyleSheet:
abilityItem: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingVertical: spacing.lg,
  borderBottomWidth: 1,
  borderBottomColor: 'rgba(255, 255, 255, 0.04)',
},
abilityItemPressed: {
  opacity: 0.7,
},
abilityContent: {
  flex: 1,
},
abilityName: {
  fontSize: fontSize.md,
  fontWeight: '600',
  color: colors.text,
  marginBottom: spacing.xs,
},
abilityChevron: {
  fontSize: fontSize.lg,
  color: colors.textMuted,
  opacity: 0.6,
}
```

### 7.2 Flavor Text Section

**Remove bordered cards. Use a subtle background tint instead.**

```typescript
// BEFORE:
<View style={styles.textCard}>
  <Text style={styles.flavorText}>{text}</Text>
</View>

// AFTER: Use transparent background tint
<View style={styles.flavorTextContainer}>
  <Text style={styles.flavorText}>{text}</Text>
</View>

// StyleSheet:
flavorTextContainer: {
  backgroundColor: 'rgba(255, 255, 255, 0.02)',
  borderRadius: borderRadius.lg,
  borderLeftWidth: 3,
  borderLeftColor: colors.primary,  // Accent line on left
  paddingHorizontal: spacing.lg,
  paddingVertical: spacing.lg,
  marginHorizontal: spacing.lg,
}
```

### 7.3 Moveset Section

**Rows should feel like they're part of a flowing list, not individual cards.**

```typescript
// BEFORE: Each move in a bordered card
<View style={styles.moveRow}>
  {/* move content */}
</View>

// AFTER: Subtle dividers, no cards
<Pressable
  style={({ pressed }) => [
    styles.moveRow,
    pressed && styles.moveRowPressed,
  ]}
>
  <View style={styles.moveTypeColumn}>
    <TypeBadge type={move.type} size="sm" />
  </View>
  <View style={styles.moveContent}>
    <Text style={styles.moveName}>{move.displayName}</Text>
    <View style={styles.moveMetaRow}>
      <Text style={styles.moveMeta}>{move.category}</Text>
      {move.power !== null && <Text style={styles.moveMeta}>Pow: {move.power}</Text>}
      {move.accuracy !== null && <Text style={styles.moveMeta}>Acc: {move.accuracy}</Text>}
      <Text style={styles.moveMeta}>PP: {move.pp}</Text>
    </View>
    <Text style={styles.learnMethod}>{formatLearnMethod(move.learnMethod, move.learnLevel)}</Text>
  </View>
</Pressable>

// StyleSheet:
moveRow: {
  flexDirection: 'row',
  paddingVertical: spacing.lg,
  borderBottomWidth: 1,
  borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  gap: spacing.md,
},
moveRowPressed: {
  opacity: 0.7,
},
moveContent: {
  flex: 1,
},
```

---

## Part 8: Scroll-Driven Animations (Reanimated)

### 8.1 Hero Collapse (Already Implemented)

The hero already collapses from 340px → 100px. Keep this. Values:

```typescript
heroContainerStyle = useAnimatedStyle(() => {
  const height = interpolate(
    scrollAnimatedValue.value,
    [0, 340],           // Scroll range
    [340, 100],         // Height range
    Extrapolate.CLAMP,
  );
  return { height };
});
```

### 8.2 Section Entrance Animations: Fade + Translate

**When a section scrolls into view, it should fade in and slide up slightly.**

**Create a utility hook for reuse:**

```typescript
// hooks/useScrollIntoView.ts
import { useAnimatedStyle, interpolate, Extrapolate, Animated } from 'react-native-reanimated';

interface UseScrollIntoViewProps {
  scrollOffset: Animated.SharedValue<number>;
  triggerPoint: number;     // Scroll Y position to trigger animation
  duration: number;         // Height of scroll range for animation
}

export function useScrollIntoView({
  scrollOffset,
  triggerPoint,
  duration = 200,
}: UseScrollIntoViewProps) {
  return useAnimatedStyle(() => {
    const progress = interpolate(
      scrollOffset.value,
      [triggerPoint - duration, triggerPoint],
      [0, 1],
      Extrapolate.CLAMP,
    );

    return {
      opacity: progress,
      transform: [
        {
          translateY: interpolate(progress, [0, 1], [40, 0]),
        },
      ],
    };
  });
}
```

**In detail screen sections, use this:**

```typescript
const statChartAnimStyle = useScrollIntoView({
  scrollOffset,
  triggerPoint: 300,   // Appears when user scrolls to 300px
  duration: 200,
});

<Animated.View style={statChartAnimStyle}>
  <StatChart ... />
</Animated.View>
```

### 8.3 Stat Bar Individual Stagger

**Bars already animate in with stagger. Confirm timing:**

```typescript
delay={100 + index * 50}  // 100ms for first bar, then 50ms each
```

This is good. Keep it.

### 8.4 Type Effectiveness Tab Transition (Already Covered in Part 5)

---

## Part 9: Design Tokens Summary

### Colors

```typescript
// Background
background: '#111010'
surface: '#1E1A1A'
surfaceElevated: '#2A2323'

// Text
text: '#F5EEEE'
textSecondary: '#B89E9E'
textMuted: '#9A7A7A'

// Brand
primary: '#DD3311'
accent: '#F0F0F0'

// Type colors (unchanged)
// See typeColors in colors.ts
```

### Spacing (unchanged)
```typescript
xs: 4
sm: 8
md: 12
lg: 16
xl: 24
2xl: 32
3xl: 48
4xl: 64
```

### Border Radius
```typescript
sm: 4
md: 8
lg: 12
xl: 16
2xl: 24
full: 9999
```

### Typography
```typescript
xs: 11
sm: 13
md: 15
lg: 17
xl: 20
2xl: 24
3xl: 30
4xl: 36
```

### Opacity Scale (New)
```typescript
verySubtle: 0.04      // Dividers
subtle: 0.08          // Disabled, dimmed
moderate: 0.15        // Hover, secondary layers
visible: 0.30         // Accents, badges
bright: 0.50+         // Full color
```

---

## Part 10: Animation Timing

### Entrance Animations
- **Duration:** 200-300ms
- **Easing:** Easing.out(Easing.cubic)
- **Stagger:** 50-100ms between items

### Transitions
- **Tab switch:** 150ms fade, 150ms slide
- **Pressed state:** 100ms scale/opacity
- **Hero collapse:** 60fps continuous (tied to scroll)

### Parallax
- **Backdrop:** 0.25× scroll velocity
- **Artwork:** 0.5× scroll velocity
- **Gradient overlay:** Opacity ramp 0 → 0.7

---

## Part 11: Implementation Checklist

### Phase 1: Ambient Background (1 day)
- [ ] Add getAmbientBackground() function to [id].tsx
- [ ] Wrap ScrollView in LinearGradient with ambient color
- [ ] Test on 5+ types (Fire, Water, Electric, Ghost, Normal)

### Phase 2: Hero Enhancement (1 day)
- [ ] Add hero fade gradient (bottom gradient layer)
- [ ] Increase artwork shadow depth
- [ ] Move shiny toggle outside hero
- [ ] Test parallax still works smoothly

### Phase 3: Section Flow (1-2 days)
- [ ] Remove bordered card wrappers from all sections
- [ ] Add subtle dividers (1px rgba border)
- [ ] Restyle section titles (letterSpacing, opacity)
- [ ] Update Abilities, Flavor Text, Moves sections
- [ ] Test section hierarchy on phone

### Phase 4: Stat Bars & Type Squares (1 day)
- [ ] Add gradient fill to stat bars
- [ ] Add glow overlay to stat bars
- [ ] Add fade + scale entrance animation
- [ ] Add glow and press animation to type squares
- [ ] Add tab transition animation

### Phase 5: Evolution Chain (1 day)
- [ ] Add curved gradient connector lines
- [ ] Add floating disc background to evolution cards
- [ ] Test on linear chain (Bulbasaur) and branching (Eevee)

### Phase 6: Scroll Entrance Animations (1 day)
- [ ] Create useScrollIntoView hook
- [ ] Apply to all major sections
- [ ] Stagger entrance timing per section
- [ ] Test on slow scroll and fast scroll

### Phase 7: Polish & QA (1-2 days)
- [ ] Verify 60fps on iOS and Android
- [ ] Test on screen sizes 320px, 375px, 430px
- [ ] Verify no layout shifts
- [ ] Regression test on list screens

---

## Part 12: Reference Code Snippets

### Ambient Background (Complete)
```typescript
// In app/(main)/(pokedex)/[id].tsx

import { LinearGradient } from 'expo-linear-gradient';

const getAmbientBackground = (primaryType: string) => {
  const ambientMap: Record<string, { color: string; opacity: number }> = {
    normal: { color: '#A8A878', opacity: 0.08 },
    fire: { color: '#F08030', opacity: 0.12 },
    water: { color: '#6890F0', opacity: 0.10 },
    electric: { color: '#F8D030', opacity: 0.12 },
    grass: { color: '#78C850', opacity: 0.10 },
    ice: { color: '#98D8D8', opacity: 0.09 },
    fighting: { color: '#C03028', opacity: 0.08 },
    poison: { color: '#A040A0', opacity: 0.10 },
    ground: { color: '#E0C068', opacity: 0.11 },
    flying: { color: '#A890F0', opacity: 0.10 },
    psychic: { color: '#F85888', opacity: 0.09 },
    bug: { color: '#A8B820', opacity: 0.09 },
    rock: { color: '#B8A038', opacity: 0.08 },
    ghost: { color: '#705898', opacity: 0.12 },
    dragon: { color: '#7038F8', opacity: 0.11 },
    dark: { color: '#705848', opacity: 0.10 },
    steel: { color: '#B8B8D0', opacity: 0.08 },
    fairy: { color: '#EE99AC', opacity: 0.10 },
  };
  return ambientMap[primaryType.toLowerCase()] || { color: '#111010', opacity: 0 };
};

const ambientRgba = (hex: string, opacity: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

// In render, wrap ScrollView:
const ambient = getAmbientBackground(pokemon.primaryType);

<LinearGradient
  colors={[
    ambientRgba(ambient.color, ambient.opacity),
    colors.background,
  ]}
  start={{ x: 0, y: 0 }}
  end={{ x: 0, y: 1 }}
  style={styles.ambientGradient}
>
  <Animated.ScrollView
    style={styles.content}
    contentContainerStyle={styles.contentContainer}
    scrollEventThrottle={16}
    onScroll={scrollHandler}
  >
    {/* content */}
  </Animated.ScrollView>
</LinearGradient>

// Add to StyleSheet:
ambientGradient: {
  flex: 1,
}
```

### Gradient Stat Bar (Complete)
```typescript
// In StatChart.tsx, replace StatBar render:

import { LinearGradient } from 'expo-linear-gradient';

// Utility function
const adjustBrightness = (hex: string, percent: number): string => {
  const r = Math.min(255, Math.max(0, parseInt(hex.slice(1, 3), 16) * (1 + percent)));
  const g = Math.min(255, Math.max(0, parseInt(hex.slice(3, 5), 16) * (1 + percent)));
  const b = Math.min(255, Math.max(0, parseInt(hex.slice(5, 7), 16) * (1 + percent)));
  return `#${Math.round(r).toString(16).padStart(2, '0')}${Math.round(g).toString(16).padStart(2, '0')}${Math.round(b).toString(16).padStart(2, '0')}`;
};

<View style={styles.barTrack}>
  <Animated.View
    style={[
      styles.barFill,
      animatedBarStyle,
      { 
        backgroundColor: 'transparent',
        overflow: 'hidden',
      },
    ]}
  >
    <LinearGradient
      colors={[accentColor, adjustBrightness(accentColor, -0.2)]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.barGradient}
    />
    
    {/* Glow overlay */}
    <View style={styles.barGlowOverlay} />
  </Animated.View>
</View>

// Add to StyleSheet:
barGradient: {
  flex: 1,
  borderRadius: borderRadius.sm,
},
barGlowOverlay: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  height: 6,
  backgroundColor: 'rgba(255, 255, 255, 0.15)',
  borderRadius: borderRadius.sm,
}
```

---

## Part 13: Success Criteria

After implementation, the detail screen should:

✓ Have a visible ambient color tint based on the Pokémon's primary type  
✓ Show parallax depth as the hero collapses (backdrop slower than artwork)  
✓ Fade smoothly from hero to content (no hard cutoff)  
✓ Display stat bars with gradient fill and subtle glow  
✓ Show stat bars animate in with stagger when section scrolls into view  
✓ Display type effectiveness squares with glow and press feedback  
✓ Tab animations feel smooth (fade + slide)  
✓ Evolution chain feels organic (curved connectors, floating discs)  
✓ Text sections (Abilities, Flavor, Moves) flow together, no hard borders  
✓ Section headers feel like part of a narrative, not table labels  
✓ Entrance animations fade sections in as they scroll into view  
✓ 60fps smooth on iOS and Android, no jank  
✓ No regression on list screens or other detail screens

---

**END OF SPECIFICATION**

**Next: Hand off to implementation agent with this spec and existing DETAIL_VIEWS_REDESIGN_SPEC.md for completeness.**
