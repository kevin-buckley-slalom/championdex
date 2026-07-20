/**
 * PokemonHero Component
 *
 * Displays a parallax-enabled hero section for Pokémon detail screens.
 * Features:
 * - Type-based anime backdrop with parallax scrolling (0.25x velocity)
 * - Official artwork centered with parallax (0.5x velocity)
 * - Radial gradient overlay that intensifies during scroll
 * - Soft drop shadow and vignette scrim for artwork legibility
 * - Segmented control toggle for Normal/Shiny variants
 * - Hero container collapses from 340px → 100px as user scrolls
 * - Artwork opacity fades from 1.0 → 0.6 during collapse
 * - Smooth cross-fade animation (200ms) on shiny toggle
 *
 * Performance: 60fps on iOS and Android, GPU-accelerated transforms only
 *
 * File: src/components/pokemon/PokemonHero.tsx
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Text, Pressable, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolate,
  withTiming,
  withSequence,
  withDelay,
  useAnimatedReaction,
  Easing,
  type SharedValue,
} from 'react-native-reanimated';

import { colors } from '@/constants/colors';
import { spacing, fontSize, borderRadius } from '@/constants/spacing';
import { getBackdropAsset, getBackdropKey } from '@/constants/typeBackdrops';
import { getHeroGradient } from '@/constants/heroGradients';
import { VitalInfoOverlay } from './VitalInfoOverlay';
import { VitalInfoBorder } from './VitalInfoBorder';
import { BackdropParticleLayer } from './BackdropParticleLayer';

// Placeholder artwork used while real URLs load or are unavailable.
// Replace with real PokeAPI artwork URLs once data seeding is complete.
const PLACEHOLDER_ARTWORK = require('@assets/placeholders/pokemon/placeholder_venusaur.png');
const PLACEHOLDER_ARTWORK_SHINY = require('@assets/placeholders/pokemon/placeholder_venusaur_shiny.png');

const HERO_HEIGHT = 340;
const MIN_HERO_HEIGHT = 100;
const BACKDROP_PARALLAX_FACTOR = -0.25;
const ARTWORK_PARALLAX_FACTOR = 0.5;
const ARTWORK_SIZE = 280;
const SHADOW_RADIUS = 20;

// Star button animation constants
const STAR_BUTTON_SIZE = 44;

/**
 * RoundedStar Component
 * Renders a 5-point star with rounded tips using SVG paths
 */
interface RoundedStarProps {
  size: number;
  filled: boolean;
  color: string;
  glowColor?: string;
}

const RoundedStar: React.FC<RoundedStarProps> = ({ size, filled, color, glowColor }) => {
  // 5-point star with rounded tips using cubic bezier curves
  // Outer radius = size/2, inner radius = size/2 * 0.42
  const cx = size / 2;
  const cy = size / 2 + size * 0.05;  // shift down ~5% to visually center the asymmetric star
  const outerR = size / 2 * 0.88;
  const innerR = size / 2 * 0.38;
  const numPoints = 5;
  const points: { x: number; y: number }[] = [];

  for (let i = 0; i < numPoints * 2; i++) {
    const angle = (i * Math.PI) / numPoints - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    points.push({
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    });
  }

  // Build path with quadratic curves at each point for rounded tips
  const r = outerR * 0.12; // rounding radius at outer tips
  const ri = innerR * 0.25; // rounding radius at inner valleys

  let d = '';
  for (let i = 0; i < points.length; i++) {
    const prev = points[(i - 1 + points.length) % points.length];
    const curr = points[i];
    const next = points[(i + 1) % points.length];

    const rounding = i % 2 === 0 ? r : ri;

    // Vector from prev to curr (normalized, scaled by rounding)
    const dx1 = curr.x - prev.x;
    const dy1 = curr.y - prev.y;
    const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
    const ax = curr.x - (dx1 / len1) * rounding;
    const ay = curr.y - (dy1 / len1) * rounding;

    // Vector from curr to next (normalized, scaled by rounding)
    const dx2 = next.x - curr.x;
    const dy2 = next.y - curr.y;
    const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
    const bx = curr.x + (dx2 / len2) * rounding;
    const by = curr.y + (dy2 / len2) * rounding;

    if (i === 0) {
      d += `M ${ax} ${ay}`;
    } else {
      d += ` L ${ax} ${ay}`;
    }
    d += ` Q ${curr.x} ${curr.y} ${bx} ${by}`;
  }
  d += ' Z';

  return (
    <Svg width={size} height={size}>
      <Path
        d={d}
        fill={filled ? color : 'none'}
        stroke={color}
        strokeWidth={filled ? 0 : 1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  );
};
const STAR_GLYPH_SIZE = 36;
const PARTICLE_COUNT = 6;
const PARTICLE_ANGLES = [0, 60, 120, 180, 240, 300]; // degrees
const PARTICLE_FONT_SIZE = Math.round(ARTWORK_SIZE * 0.15); // ~15% of artwork = ~42px at 280
const PARTICLE_DISTANCE = Math.round(ARTWORK_SIZE * 0.5); // ~50% of artwork = ~140px at 280
const PARTICLE_BURST_DURATION = 500;
const STAR_POP_DURATION = 200;

/**
 * StarBurstParticles Sub-Component
 *
 * Owns all particle burst animation state and rendering.
 * Only mounts when shinyReady is true (i.e., when user can toggle shiny).
 * This defers the allocation of 24 useSharedValue calls (6 particles × 4 values)
 * until after first paint, keeping PokemonHero's initial mount lean.
 *
 * All hooks are unconditional at this component's top level.
 */
interface StarBurstParticlesProps {
  onBurstStart: (callback: () => void) => void;
}

const StarBurstParticles: React.FC<StarBurstParticlesProps> = ({ onBurstStart }) => {
  // 6 particles — each has translateX, translateY, opacity, rotate
  const particles: ParticleAnimatedValue[] = PARTICLE_ANGLES.map(() => ({
    translateX: useSharedValue(0),
    translateY: useSharedValue(0),
    opacity: useSharedValue(0),
    rotate: useSharedValue(0),
  }));

  const particleAnimatedStyles = particles.map((p) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useAnimatedStyle(() => ({
      transform: [
        { translateX: p.translateX.value },
        { translateY: p.translateY.value },
        { rotate: `${p.rotate.value}deg` },
      ],
      opacity: p.opacity.value,
    }))
  );

  // Provide burst trigger function to parent
  useEffect(() => {
    onBurstStart(() => {
      PARTICLE_ANGLES.forEach((angleDeg, i) => {
        const angle = (angleDeg * Math.PI) / 180;
        const dx = Math.cos(angle) * PARTICLE_DISTANCE;
        const dy = Math.sin(angle) * PARTICLE_DISTANCE;
        const delay = i * 40;

        particles[i].translateX.value = 0;
        particles[i].translateY.value = 0;
        particles[i].opacity.value = 0;
        particles[i].rotate.value = 0;

        particles[i].translateX.value = withDelay(delay, withTiming(dx, { duration: PARTICLE_BURST_DURATION, easing: Easing.out(Easing.poly(6)) }));
        particles[i].translateY.value = withDelay(delay, withTiming(dy, { duration: PARTICLE_BURST_DURATION, easing: Easing.out(Easing.poly(6)) }));
        particles[i].opacity.value = withDelay(delay, withSequence(
          withTiming(1, { duration: PARTICLE_BURST_DURATION * 0.2 }),
          withTiming(0, { duration: PARTICLE_BURST_DURATION * 0.6 }),
        ));
        particles[i].rotate.value = withDelay(delay, withTiming(450, { duration: PARTICLE_BURST_DURATION, easing: Easing.out(Easing.poly(6)) }));
      });
    });
  }, [onBurstStart, particles]);

  return (
    <View style={styles.particleLayer} pointerEvents="none">
      {particles.map((_, i) => (
        <Animated.Text
          key={i}
          style={[styles.particle, particleAnimatedStyles[i], { fontSize: PARTICLE_FONT_SIZE }]}
        >
          ★
        </Animated.Text>
      ))}
    </View>
  );
};

interface ParticleAnimatedValue {
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  opacity: SharedValue<number>;
  rotate: SharedValue<number>;
}

export interface PokemonHeroProps {
  /**
   * Pokémon national dex number (e.g., 25 for Pikachu)
   */
  pokemonId: number;

  /**
   * Official artwork URL (high-res PNG, transparent background)
   */
  artworkUrl: string | null;

  /**
   * Official shiny artwork URL (alternative variant)
   * If undefined or null, "Shiny" toggle is disabled
   */
  shinyArtworkUrl?: string | null;

  /**
   * Stable non-shiny artwork URL used for particle glow masks.
   * Kept separate from currentArtworkUrl so glow layers never re-render on shiny toggle.
   */
  glowArtworkUrl?: string | null;

  /**
   * Pokémon name for display and accessibility
   */
  pokemonName: string;

  /**
   * Primary type identifier (e.g., 'electric', 'fire', 'water')
   * Used to determine hero gradient and backdrop selection
   */
  primaryType: string;

  /**
   * National dex number (redundant with pokemonId, but kept for clarity)
   */
  nationalDex: number;

  /**
   * Shared animated value for scroll offset (from parent ScrollView)
   * Used for parallax transform and opacity calculations
   */
  scrollAnimatedValue: SharedValue<number>;

  /**
   * Callback when user toggles between Normal/Shiny
   * Useful for analytics tracking
   */
  onShinyToggle?: (isShiny: boolean) => void;

  /**
   * Callback when scroll progress updates
   * Progress: 0 = hero fully visible, 1 = hero fully collapsed
   */
  onScrollProgress?: (progress: SharedValue<number>) => void;

  /**
   * Initial state: true for shiny, false for normal
   * Default: false
   */
  initiallyShiny?: boolean;

  /**
   * Hero container height at rest (default: 340px)
   */
  heroHeight?: number;

  /**
   * Minimum hero height when fully collapsed (default: 100px)
   */
  minHeroHeight?: number;

  /**
   * Artwork max width/height (default: 280px)
   */
  artworkSize?: number;

  /**
   * If false, disable parallax effect (static hero)
   * Default: true
   */
  parallaxEnabled?: boolean;

  /**
   * If true, show gradient overlay that darkens over scroll
   * Default: true
   */
  showGradientOverlay?: boolean;

  /**
   * Custom parallax velocity ratio for artwork (0–1, default: 0.5)
   */
  parallaxFactor?: number;

  /**
   * If true, shiny artwork is ready to display (prefetched or cached)
   * If false, shiny toggle is disabled until prefetch completes
   * Default: false
   */
  shinyReady?: boolean;

  /**
   * If false, do NOT render the ShinyToggle inside the hero
   * Used when toggle is rendered elsewhere (e.g., below hero in [id].tsx)
   * Default: true
   *
   * Note: Currently unused as we always render the floating star button
   */
  showShinyToggle?: boolean;

  /**
   * Secondary type identifier, or null if single-type
   * Passed to VitalInfoOverlay
   */
  secondaryType?: string | null;

  /**
   * Accent color for the left bar and type-themed borders
   * Typically from typeColors map
   */
  accentColor: string;

  /**
   * Card surface color for the notch fill (e.g., 'rgb(20, 18, 18)')
   * Solid opaque color blended from dark background and ambient tint
   * Default: '#111010' (matches dark background)
   */
  cardSurfaceColor?: string;

  /**
   * Pokémon form type identifier (e.g., 'gigantamax', 'normal')
   * Used to determine backdrop selection for special forms
   */
  formType?: string;

  /**
   * Database name field, lowercase slug (e.g. 'sneasel-hisui')
   * Used for Pokemon-specific backdrop overrides
   */
  pokemonSlug?: string;

  /**
   * If false, disable all ambient particles instantly
   * Default: true
   */
  particlesEnabled?: boolean;
}

/**
 * PokemonHero Component
 * Renders a parallax-scrolling hero section with type-based backdrop, artwork, and shiny toggle.
 */
export const PokemonHero: React.FC<PokemonHeroProps> = ({
  pokemonId,
  artworkUrl,
  shinyArtworkUrl,
  glowArtworkUrl = null,
  pokemonName,
  primaryType,
  nationalDex,
  scrollAnimatedValue,
  onShinyToggle,
  onScrollProgress,
  initiallyShiny = false,
  heroHeight = HERO_HEIGHT,
  minHeroHeight = MIN_HERO_HEIGHT,
  artworkSize = ARTWORK_SIZE,
  parallaxEnabled = true,
  showGradientOverlay = true,
  parallaxFactor = ARTWORK_PARALLAX_FACTOR,
  shinyReady = false,
  showShinyToggle = true,
  secondaryType = null,
  accentColor,
  cardSurfaceColor = '#111010',
  formType = undefined,
  pokemonSlug = undefined,
  particlesEnabled = true,
}) => {
  const { width: screenWidth } = useWindowDimensions();
  const [isShiny, setIsShiny] = useState(initiallyShiny);
  const [infoBlockRight, setInfoBlockRight] = useState(0);
  const [starBoxLeft, setStarBoxLeft] = useState(0);
  const [starBoxRight, setStarBoxRight] = useState(0);
  const whiteFlashOpacity = useSharedValue(0);

  // Star button animation
  const starScale = useSharedValue(1);

  // Ref to hold the burst trigger function from StarBurstParticles sub-component
  const burstTriggerRef = React.useRef<(() => void) | null>(null);

  // Current artwork URL based on shiny state
  const currentArtworkUrl = useMemo(
    () => (isShiny && shinyArtworkUrl ? shinyArtworkUrl : artworkUrl),
    [isShiny, shinyArtworkUrl, artworkUrl],
  );

  // Get type-based backdrop and gradient
  const backdropSource = useMemo(
    () => getBackdropAsset(primaryType, pokemonId, formType, pokemonSlug, secondaryType),
    [primaryType, pokemonId, formType, pokemonSlug, secondaryType],
  );

  const backdropKey = useMemo(
    () => getBackdropKey(primaryType, pokemonId, formType, pokemonSlug, secondaryType),
    [primaryType, pokemonId, formType, pokemonSlug, secondaryType],
  );

  const heroGradient = useMemo(() => getHeroGradient(primaryType), [primaryType]);

  /**
   * Handle shiny toggle with white flash silhouette effect (260ms total)
   */
  const handleShinyToggle = useCallback(
    async (nextIsShiny: boolean) => {
      if (nextIsShiny === isShiny) return;

      // Check if shiny variant exists
      if (nextIsShiny && !shinyArtworkUrl) return;

      // Flash to white (80ms)
      whiteFlashOpacity.value = withTiming(1, { duration: 80 });

      // Swap image at peak white
      await new Promise((resolve) => setTimeout(resolve, 80));
      setIsShiny(nextIsShiny);
      onShinyToggle?.(nextIsShiny);

      // Fade white overlay out (180ms)
      whiteFlashOpacity.value = withTiming(0, { duration: 180 });
    },
    [isShiny, shinyArtworkUrl, onShinyToggle, whiteFlashOpacity],
  );

  const handleStarPress = useCallback(() => {
    const nextIsShiny = !isShiny;

    // Pop animation on the star
    starScale.value = withSequence(
      withTiming(1.4, { duration: 100, easing: Easing.out(Easing.quad) }),
      withTiming(1.0, { duration: 100, easing: Easing.in(Easing.quad) })
    );

    // Particle burst only when turning ON (trigger from StarBurstParticles sub-component)
    if (nextIsShiny && burstTriggerRef.current) {
      burstTriggerRef.current();
    }

    handleShinyToggle(nextIsShiny);
  }, [isShiny, starScale, handleShinyToggle]);

  /**
   * Backdrop parallax transform (0.25x velocity, slowest movement)
   */
  const backdropAnimatedStyle = useAnimatedStyle(() => {
    const translateY = parallaxEnabled
      ? scrollAnimatedValue.value * BACKDROP_PARALLAX_FACTOR * -1
      : 0;

    return {
      transform: [{ translateY }],
    };
  }, [parallaxEnabled]);

  /**
   * Backdrop opacity fade (0.6 → 0 as user scrolls)
   */
  const backdropOpacityStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollAnimatedValue.value,
      [0, heroHeight],
      [0.6, 0],
      Extrapolate.CLAMP,
    );

    return { opacity };
  }, [heroHeight]);

  /**
   * Artwork parallax transform (0.5x velocity, medium movement)
   */
  const artworkAnimatedStyle = useAnimatedStyle(() => {
    const translateY = parallaxEnabled
      ? scrollAnimatedValue.value * parallaxFactor * -1
      : 0;

    return {
      transform: [{ translateY }],
    };
  }, [parallaxEnabled, parallaxFactor]);

  /**
   * Artwork opacity fade (1.0 → 0.6 as user scrolls)
   */
  const artworkOpacityStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollAnimatedValue.value,
      [0, heroHeight],
      [1, 0.6],
      Extrapolate.CLAMP,
    );

    return { opacity };
  }, [heroHeight]);

  /**
   * White flash overlay for shiny transition
   */
  const whiteFlashStyle = useAnimatedStyle(() => ({
    opacity: whiteFlashOpacity.value,
  }));

  /**
   * Gradient overlay opacity intensifies (0 → 0.7 as user scrolls)
   */
  const gradientOverlayStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollAnimatedValue.value,
      [0, heroHeight],
      [0, 0.7],
      Extrapolate.CLAMP,
    );

    return { opacity };
  }, [heroHeight]);

  /**
   * Hero container height collapse (340 → 100 as user scrolls)
   */
  const heroContainerStyle = useAnimatedStyle(() => {
    const height = interpolate(
      scrollAnimatedValue.value,
      [0, heroHeight],
      [heroHeight, minHeroHeight],
      Extrapolate.CLAMP,
    );

    return { height };
  }, [heroHeight, minHeroHeight]);

  /**
   * Shiny toggle opacity (fades as hero collapses)
   */
  const toggleOpacityStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollAnimatedValue.value,
      [0, heroHeight / 2],
      [1, 0.3],
      Extrapolate.CLAMP,
    );

    return { opacity };
  }, [heroHeight]);

  const starAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: starScale.value }],
  }));

  /**
   * Notify parent of scroll progress if callback provided
   */
  useAnimatedReaction(
    () => scrollAnimatedValue.value,
    (offset) => {
      if (onScrollProgress) {
        onScrollProgress(scrollAnimatedValue);
      }
    },
    [onScrollProgress, scrollAnimatedValue],
  );

  const isShinyDisabled = !shinyArtworkUrl || !shinyReady;

  return (
    <Animated.View
      style={[styles.heroContainer, heroContainerStyle]}
      accessible={false}
    >
      {/* Layer 1: Backdrop Image (0.25x parallax, fades out as user scrolls) */}
      <Animated.View
        style={[
          styles.backdropWrapper,
          backdropAnimatedStyle,
          backdropOpacityStyle,
        ]}
      >
        <Image
          source={backdropSource}
          style={styles.backdropImage}
          contentFit="cover"
          cachePolicy="memory-disk"
          priority="high"
          accessibilityLabel={`${pokemonName} type environment backdrop`}
        />
      </Animated.View>

      {/* Layer 2: Gradient Overlay (dark radial gradient, intensifies during scroll) */}
      {showGradientOverlay && (
        <Animated.View style={[styles.gradientOverlay, gradientOverlayStyle]}>
          <LinearGradient
            colors={[heroGradient.centerColor, heroGradient.edgeColor]}
            start={{ x: 0.5, y: 0.5 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientFill}
          />
        </Animated.View>
      )}

      {/* Layer 3: Vignette Scrim (subtle radial darkness behind artwork) */}
      <View style={styles.vignetteScrim} />

      {/* Layer 3b: Environmental Particle Layer (behind artwork, above backdrop) */}
      <BackdropParticleLayer
        backdropKey={backdropKey}
        heroHeight={heroHeight}
        enabled={particlesEnabled}
        artworkUrl={currentArtworkUrl}
        glowArtworkUrl={glowArtworkUrl}
      />

      {/* Layer 4: Artwork Container (0.5x parallax, fades as user scrolls) */}
      <Animated.View
        style={[
          styles.artworkContainer,
          artworkAnimatedStyle,
          artworkOpacityStyle,
        ]}
        accessible={true}
        accessibilityLabel={`${pokemonName} artwork`}
        accessibilityRole="image"
      >
        <Image
          source={currentArtworkUrl ? { uri: currentArtworkUrl } : (isShiny ? PLACEHOLDER_ARTWORK_SHINY : PLACEHOLDER_ARTWORK)}
          placeholder={isShiny ? PLACEHOLDER_ARTWORK_SHINY : PLACEHOLDER_ARTWORK}
          style={styles.artwork}
          contentFit="contain"
          cachePolicy="memory-disk"
          priority="high"
        />
        {/* White silhouette overlay — tintColor preserves alpha, only colours non-transparent pixels */}
        <Animated.View
          style={[StyleSheet.absoluteFill, whiteFlashStyle]}
          pointerEvents="none"
        >
          <Image
            source={currentArtworkUrl ? { uri: currentArtworkUrl } : (isShiny ? PLACEHOLDER_ARTWORK_SHINY : PLACEHOLDER_ARTWORK)}
            style={styles.artwork}
            contentFit="contain"
            tintColor="white"
            cachePolicy="memory-disk"
            priority="high"
          />
        </Animated.View>
      </Animated.View>

      {/* Layer 4b: Particle burst layer — only mounted when shinyReady (defers 24 useSharedValue calls) */}
      {shinyReady && (
        <StarBurstParticles
          onBurstStart={(trigger) => {
            burstTriggerRef.current = trigger;
          }}
        />
      )}

      {/* Layer 5: Floating star shiny toggle (repositioned to fit in right box) */}
      <View style={styles.starButtonWrapper}>
        {/* The star button itself */}
        <Pressable
          onPress={handleStarPress}
          hitSlop={12}
          disabled={isShinyDisabled}
          accessibilityLabel={isShiny ? 'Switch to normal form' : 'Switch to shiny form'}
          accessibilityRole="button"
        >
          <Animated.View style={starAnimatedStyle}>
            <RoundedStar
              size={STAR_GLYPH_SIZE}
              filled={isShiny}
              color={isShiny ? '#FFD700' : 'rgba(255,255,255,0.7)'}
              glowColor={isShiny ? '#FFD700' : undefined}
            />
          </Animated.View>
        </Pressable>
      </View>

      {/* Layer 6: Bottom Fade Gradient (smooths transition from hero to content below) */}
      <LinearGradient
        colors={[
          'rgba(0, 0, 0, 0)',
          'rgba(0, 0, 0, 0)',
          'rgba(0, 0, 0, 0.35)',
          'rgba(0, 0, 0, 0.55)',
          cardSurfaceColor,
        ]}
        locations={[0, 0.45, 0.7, 0.88, 1.0]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.heroFadeGradient}
      />

      {/* Layer 6b: SVG Border (continuous open-bottom path frame) */}
      {infoBlockRight > 0 && starBoxLeft > 0 && starBoxRight > 0 && (
        <VitalInfoBorder
          infoBlockRight={infoBlockRight}
          starBoxLeft={starBoxLeft}
          typeColor={accentColor}
          heroHeight={heroHeight}
          overlayHeight={52}
          screenWidth={screenWidth}
          cardSurfaceColor={cardSurfaceColor}
        />
      )}

      {/* Layer 7: VitalInfoOverlay (dex number only — SVG draws borders) */}
      <VitalInfoOverlay
        nationalDex={nationalDex}
        typeColor={accentColor}
        onLeftBoxLayout={setInfoBlockRight}
        onRightBoxLayout={(left) => {
          setStarBoxLeft(left);
          setStarBoxRight(left + 44); // Star box is 44px wide
        }}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  heroContainer: {
    width: '100%',
    height: HERO_HEIGHT,
    overflow: 'hidden',
    position: 'relative',
  },

  backdropWrapper: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },

  backdropImage: {
    width: '100%',
    height: '100%',
    // Crop to show upper 60% (sky/atmospheric portion)
    // Achieved via positioning — image shows top portion naturally
  },

  gradientOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
  },

  gradientFill: {
    flex: 1,
  },

  vignetteScrim: {
    position: 'absolute',
    width: 400,
    height: 400,
    alignSelf: 'center',
    top: '50%',
    marginTop: -200,
    borderRadius: 200,
    // Radial gradient effect: transparent center, darkened edges
    // Implemented via shadow/gradient overlay from expo-linear-gradient
  },

  artworkContainer: {
    position: 'absolute',
    width: ARTWORK_SIZE,
    height: ARTWORK_SIZE,
    alignSelf: 'center',
    top: '50%',
    marginTop: -ARTWORK_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    // Soft drop shadow (20px blur, 40% opacity, no offset)
    shadowColor: colors.background,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: SHADOW_RADIUS,
    elevation: 12, // Android shadow equivalent
  },

  artwork: {
    width: '100%',
    height: '100%',
  },

  artworkPlaceholder: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },

  particleLayer: {
    position: 'absolute',
    width: ARTWORK_SIZE,
    height: ARTWORK_SIZE,
    alignSelf: 'center',
    top: '50%',
    marginTop: -ARTWORK_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  starButtonWrapper: {
    position: 'absolute',
    bottom: -4,
    right: 11,
    width: STAR_BUTTON_SIZE,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  particle: {
    position: 'absolute',
    color: '#FFD700',
  },

  heroFadeGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 25, // gradient spans 160px upward from bottom
  },
});
