/**
 * BackdropParticleLayer Component
 *
 * Renders subtle ambient particle animations layered behind the Pokémon artwork.
 * Currently only 'grass' backdrop has particle effects (falling leaves).
 * Add entries to PARTICLE_CONFIGS to enable particles for additional backdrops.
 *
 * Z-order: above backdrop image, below Pokémon artwork.
 * Never intercepts touches (pointerEvents: 'none').
 *
 * File: src/components/pokemon/BackdropParticleLayer.tsx
 */

import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { View, useWindowDimensions, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
  Easing,
  useAnimatedReaction,
  runOnJS,
  useAnimatedProps,
  createAnimatedComponent,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop, Line, Path, Filter, FeGaussianBlur, LinearGradient as SvgLinearGradient, Mask, Rect, Image as SvgImage } from 'react-native-svg';

// Create animated Path component at module level for strokeDashoffset animation
const AnimatedPath = createAnimatedComponent(Path);


interface BackdropParticleLayerProps {
  backdropKey: string;
  heroHeight: number;
  enabled?: boolean;
  artworkUrl?: string | null;
}

const PARTICLE_COUNT = 6; // 5 grass or (3 embers + 3 ash) for fire

// Add backdropKeys here to enable particles for additional backdrops.
const PARTICLE_CONFIGS: Record<string, boolean> = {
  grass: true,
  fire: true,
  underwater: true,
  water: true,
  ice: true,
  electric: true,
  flying: true,
  bug: true,
  fairy: true,
  mega: true,
};

interface ParticleData {
  startX: number;
  startY?: number; // optional for grass, fire, ice, electric; required for underwater, water, bug
  duration: number;
  staggerDelay: number;
  driftAmp: number;
  driftDir: number;
  swayHalfPeriod: number;
}

interface ParticleAppearance {
  width: number;
  height: number;
  borderRadius: number;
  backgroundColor: string;
}

// Mega aura — solar shimmer timing
// Three rings run on incommensurate cycles so phase relationships drift continuously
const MEGA_RING1_CYCLE = 5000;  // ms — inner ring cycle
const MEGA_RING2_CYCLE = 6700;  // ms — mid ring cycle (no clean ratio with ring 1)
const MEGA_RING3_CYCLE = 7300;  // ms — outer ring cycle (prime-ish, drifts from both)
const MEGA_SCALE_CYCLE = 3700;  // ms — scale decoupled from opacity

// Asymmetric opacity curve: fast ignite → slow linger → quick fall
// Splits the cycle as: 16% rise | 64% slow decay | 20% quick fall
const MEGA_OPACITY_PEAK = 0.45;
const MEGA_OPACITY_FLOOR = 0.08;  // lingers here before final fall

// Scale range — subtle
const MEGA_SCALE_BASE = 1.02;
const MEGA_SCALE_PEAK = 1.10;

// Phase offsets (ms) — warm block clusters early, cool block clusters later
// All 7 colors share the same opacity/scale curve shape; only phase offset differs
// Ring 1 (inner, 'a' styles): warm R/O/Y cluster 0–900ms, gap, cool B/I/V cluster 2800–3600ms
const MEGA_PHASE_R1 = [0, 400, 900, 1800, 2800, 3200, 3600];   // R O Y G B I V
// Ring 2 (mid, 'b' styles): shifted +1200ms relative to ring 1, on 6700ms cycle
const MEGA_PHASE_R2 = [1200, 1600, 2100, 3000, 4000, 4400, 4800];
// Ring 3 (outer, 'c' styles): shifted +800ms relative to ring 1, on 7300ms cycle
const MEGA_PHASE_R3 = [800, 1200, 1700, 2600, 3600, 4000, 4400];

const AURA_COLORS = [
  '#FF0000', // Red
  '#FF7F00', // Orange
  '#FFFF00', // Yellow
  '#00FF00', // Green
  '#0000FF', // Blue
  '#4B0082', // Indigo
  '#9400D3', // Violet
];

const ARTWORK_SIZE = 280;

export const BackdropParticleLayer: React.FC<BackdropParticleLayerProps> = ({
  backdropKey,
  heroHeight,
  enabled = true,
  artworkUrl = null,
}) => {
  const { width: screenWidth } = useWindowDimensions();

  // Mega effect animations (unconditional at top level — Rules of Hooks)
  // Aura layer opacities (one per ROYGBIV color) — kept for Rules of Hooks but not animated
  const megaAOp0 = useSharedValue(0);
  const megaAOp1 = useSharedValue(0);
  const megaAOp2 = useSharedValue(0);
  const megaAOp3 = useSharedValue(0);
  const megaAOp4 = useSharedValue(0);
  const megaAOp5 = useSharedValue(0);
  const megaAOp6 = useSharedValue(0);

  // Aura layer scales (synchronized pulsation) — kept for Rules of Hooks but not animated
  const megaASc0 = useSharedValue(1.05);
  const megaASc1 = useSharedValue(1.05);
  const megaASc2 = useSharedValue(1.05);
  const megaASc3 = useSharedValue(1.05);
  const megaASc4 = useSharedValue(1.05);
  const megaASc5 = useSharedValue(1.05);
  const megaASc6 = useSharedValue(1.05);

  // Mega rainbow gradient rotation (new architecture)
  const megaGradRot = useSharedValue(0);

  // All shared values declared unconditionally at top level — Rules of Hooks
  const ty0 = useSharedValue(0);
  const tx0 = useSharedValue(0);
  const op0 = useSharedValue(0);
  const ro0 = useSharedValue(0);

  const ty1 = useSharedValue(0);
  const tx1 = useSharedValue(0);
  const op1 = useSharedValue(0);
  const ro1 = useSharedValue(0);

  const ty2 = useSharedValue(0);
  const tx2 = useSharedValue(0);
  const op2 = useSharedValue(0);
  const ro2 = useSharedValue(0);

  const ty3 = useSharedValue(0);
  const tx3 = useSharedValue(0);
  const op3 = useSharedValue(0);
  const ro3 = useSharedValue(0);

  const ty4 = useSharedValue(0);
  const tx4 = useSharedValue(0);
  const op4 = useSharedValue(0);
  const ro4 = useSharedValue(0);

  const ty5 = useSharedValue(0);
  const tx5 = useSharedValue(0);
  const op5 = useSharedValue(0);
  const ro5 = useSharedValue(0);

  // Scale shared values for water sparkles (unconditional at top level)
  const sc0 = useSharedValue(1);
  const sc1 = useSharedValue(1);
  const sc2 = useSharedValue(1);
  const sc3 = useSharedValue(1);
  const sc4 = useSharedValue(1);
  const sc5 = useSharedValue(1);

  // Dash offset shared values for flying wind streaks (unconditional at top level)
  const dash0 = useSharedValue(0);
  const dash1 = useSharedValue(0);
  const dash2 = useSharedValue(0);
  const dash3 = useSharedValue(0);

  const particleData = useMemo<ParticleData[]>(() => {
    if (backdropKey !== 'grass') return [];
    const data: ParticleData[] = [];
    for (let i = 0; i < 5; i++) {
      data.push({
        startX: screenWidth * (0.05 + (i / 4) * 0.9),
        duration: 5000 + i * 600,   // 5000, 5600, 6200, 6800, 7400ms
        staggerDelay: i * 2500,
        driftAmp: 12 + i * 3,       // 12, 15, 18, 21, 24px — gentle visible drift
        driftDir: i % 2 === 0 ? 1 : -1,
        // half-period snapped so N full swings (2*half) fit exactly in fall duration
        swayHalfPeriod: Math.round((5000 + i * 600) / (2 * Math.round((5000 + i * 600) / 3000))),
      });
    }
    return data;
  }, [screenWidth, backdropKey]);

  // Fire particle data (embers + ash)
  const fireParticleData = useMemo<ParticleData[]>(() => {
    if (backdropKey !== 'fire') return [];
    const data: ParticleData[] = [];

    // Embers (indices 0–2, rising) — even slots: 0, 2, 4 out of 5
    for (let i = 0; i < 3; i++) {
      data.push({
        startX: screenWidth * (0.05 + ((i * 2) / 5) * 0.9),
        duration: 3500 + i * 500,   // 3500, 4000, 4500ms
        staggerDelay: i * 2000,
        driftAmp: 15 + i * 5,       // 15, 20, 25px
        driftDir: i % 2 === 0 ? 1 : -1,
        swayHalfPeriod: Math.round((3500 + i * 500) / (2 * Math.round((3500 + i * 500) / 3000))),
      });
    }

    // Ash flakes (indices 3–5, falling) — odd slots: 1, 3, 5 out of 5
    for (let i = 0; i < 3; i++) {
      data.push({
        startX: screenWidth * (0.05 + ((i * 2 + 1) / 5) * 0.9),
        duration: 6500 + i * 700,   // 6500, 7200, 7900ms
        staggerDelay: 3000 + i * 2500,
        driftAmp: 10 + i * 4,       // 10, 14, 18px
        driftDir: i % 2 === 0 ? 1 : -1,
        swayHalfPeriod: Math.round((6500 + i * 700) / (2 * Math.round((6500 + i * 700) / 3000))),
      });
    }
    return data;
  }, [screenWidth, backdropKey]);

  // Underwater particle data (rising bubbles)
  const underwaterParticleData = useMemo<ParticleData[]>(() => {
    if (backdropKey !== 'underwater') return [];
    const data: ParticleData[] = [];
    for (let i = 0; i < 6; i++) {
      data.push({
        startX: screenWidth * (0.05 + (i / 5) * 0.9),
        duration: 4000 + i * 600,   // 4000, 4600, 5200, 5800, 6400, 7000ms
        staggerDelay: i * 1800,
        driftAmp: 10 + i * 4,       // 10, 14, 18, 22, 26, 30px
        driftDir: i % 2 === 0 ? 1 : -1,
        swayHalfPeriod: Math.round((4000 + i * 600) / (2 * Math.round((4000 + i * 600) / 3000))),
      });
    }
    return data;
  }, [screenWidth, backdropKey]);

  // Water particle data (sunlight sparkles)
  // Each particle cycles through a pre-seeded list of positions in the water zone.
  // Positions are in the lower-right triangle: x > 0.45, y > 0.35, biased toward lower-right.
  const waterParticleData = useMemo<(ParticleData & { positions: { x: number; y: number }[] })[]>(() => {
    if (backdropKey !== 'water') return [];
    // 16 positions within the lower-right water triangle.
    // Top of pool nudged left (x 0.40–0.65) and lower in frame (y >= 0.48).
    // Lower positions spread further right (x up to 0.95).
    // Water slopes diagonally: enters frame at ~(left, 35%) and fills to bottom-right.
    // Left-side positions sit higher (y 0.35–0.45), right-side lower (y 0.50–0.64).
    // Spread across full width — artwork has transparent bg so some will show through.
    const pool = [
      { x: 0.22, y: 0.36 }, { x: 0.65, y: 0.50 }, { x: 0.88, y: 0.56 }, { x: 0.50, y: 0.48 },
      { x: 0.38, y: 0.42 }, { x: 0.78, y: 0.54 }, { x: 0.95, y: 0.60 }, { x: 0.60, y: 0.52 },
      { x: 0.28, y: 0.40 }, { x: 0.70, y: 0.56 }, { x: 0.85, y: 0.62 }, { x: 0.55, y: 0.46 },
      { x: 0.45, y: 0.44 }, { x: 0.82, y: 0.58 }, { x: 0.93, y: 0.64 }, { x: 0.72, y: 0.52 },
    ];
    // Each particle gets a different slice of the pool so they don't flash the same spots
    const staggerDelays = [0, 800, 1600, 400];
    const data: (ParticleData & { positions: { x: number; y: number }[] })[] = [];
    for (let i = 0; i < 4; i++) {
      // Rotate pool by 4 positions per particle for variety
      const positions = [...pool.slice(i * 4), ...pool.slice(0, i * 4)];
      data.push({
        startX: screenWidth * positions[0].x,
        startY: heroHeight * positions[0].y,
        positions,
        duration: 800,   // single flash cycle: 200ms in + 400ms hold + 200ms out
        staggerDelay: staggerDelays[i],
        driftAmp: 0,
        driftDir: 1,
        swayHalfPeriod: 1000,
      });
    }
    return data;
  }, [screenWidth, heroHeight, backdropKey]);

  // Ice particle data (falling snowflakes)
  const iceParticleData = useMemo<ParticleData[]>(() => {
    if (backdropKey !== 'ice') return [];
    const data: ParticleData[] = [];
    for (let i = 0; i < 6; i++) {
      const duration = 5500 + i * 400;   // 5500, 5900, 6300, 6700, 7100, 7500ms
      data.push({
        startX: screenWidth * (0.05 + (i / 5) * 0.9),
        duration,
        staggerDelay: i * 1500,
        driftAmp: 8 + i * 2,       // 8, 10, 12, 14, 16, 18px
        driftDir: i % 2 === 0 ? 1 : -1,
        // snap to even divisor of duration targeting ~3800ms
        swayHalfPeriod: Math.round(duration / (2 * Math.round(duration / 3800))),
      });
    }
    return data;
  }, [screenWidth, backdropKey]);

  // Flying particle data (horizontal wind streaks)
  const flyingParticleData = useMemo<{ startX: number; startY: number; duration: number; staggerDelay: number; particleWidth: number }[]>(() => {
    if (backdropKey !== 'flying') return [];
    return [
      { startX: -120, startY: heroHeight * 0.08, duration: 4000, staggerDelay: 0,    particleWidth: 110 },
      { startX: -120, startY: heroHeight * 0.24, duration: 4800, staggerDelay: 1200, particleWidth: 85  },
      { startX: -120, startY: heroHeight * 0.55, duration: 4200, staggerDelay: 2400, particleWidth: 100 },
      { startX: -120, startY: heroHeight * 0.78, duration: 4600, staggerDelay: 3600, particleWidth: 90  },
    ];
  }, [backdropKey, heroHeight]);

  // Bug particle data (6 spores at fixed positions, each with unique duration and stagger)
  const bugParticleData = useMemo<ParticleData[]>(() => {
    if (backdropKey !== 'bug') return [];
    return [
      { startX: screenWidth * 0.20, startY: heroHeight * 0.15, duration: 4800, staggerDelay: 0,    driftAmp: screenWidth * 0.42, driftDir:  1, swayHalfPeriod: 5500 },
      { startX: screenWidth * 0.78, startY: heroHeight * 0.55, duration: 6200, staggerDelay: 1100, driftAmp: screenWidth * 0.38, driftDir: -1, swayHalfPeriod: 7200 },
      { startX: screenWidth * 0.45, startY: heroHeight * 0.72, duration: 5500, staggerDelay: 2800, driftAmp: screenWidth * 0.44, driftDir:  1, swayHalfPeriod: 6300 },
      { startX: screenWidth * 0.85, startY: heroHeight * 0.24, duration: 7800, staggerDelay: 700,  driftAmp: screenWidth * 0.40, driftDir: -1, swayHalfPeriod: 8800 },
      { startX: screenWidth * 0.12, startY: heroHeight * 0.60, duration: 5000, staggerDelay: 3500, driftAmp: screenWidth * 0.36, driftDir:  1, swayHalfPeriod: 6900 },
      { startX: screenWidth * 0.60, startY: heroHeight * 0.40, duration: 6800, staggerDelay: 1900, driftAmp: screenWidth * 0.46, driftDir: -1, swayHalfPeriod: 8100 },
    ];
  }, [screenWidth, backdropKey, heroHeight]);

  // Fairy particle data (5 floating sparkle stars with upward drift and twinkle)
  const fairyParticleData = useMemo<ParticleData[]>(() => {
    if (backdropKey !== 'fairy') return [];
    // 5 particles; startX/startY are initial positions only — they teleport on each cycle
    return [0, 1, 2, 3, 4].map((i) => ({
      startX: screenWidth * (0.10 + i * 0.20),
      startY: heroHeight * (0.15 + (i % 3) * 0.25),
      duration: 2200 + i * 300,   // 2200, 2500, 2800, 3100, 3400ms
      staggerDelay: i * 450,
      driftAmp: 0,
      driftDir: 1,
      swayHalfPeriod: 3500,
    }));
  }, [backdropKey, screenWidth, heroHeight]);

  // Refs to track current teleport positions for fairy sparkles (JS-side only)
  const fairyPosRef = useRef<{ x: number; y: number }[]>([
    { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 },
  ]);

  // Helper to generate a single random zigzag path for a lightning bolt
  const generateRandomLightningPath = useCallback((w: number, boltHeight: number): string => {
    const NUM_SEGMENTS = 7;
    const points: { x: number; y: number }[] = [];

    // Start point: center top
    points.push({ x: w * 0.5, y: 0 });

    // Generate 7 intermediate points with alternating left/right zones
    const yRaw: number[] = [];
    for (let i = 0; i < NUM_SEGMENTS; i++) {
      yRaw.push(Math.random());
    }
    const ySum = yRaw.reduce((a, b) => a + b, 0);
    const yNormalized = yRaw.map(v => (v / ySum) * boltHeight);

    let cumulativeY = 0;
    let prevXFrac = 0.5;  // Seed with starting M point (center)
    for (let i = 0; i < NUM_SEGMENTS; i++) {
      cumulativeY += yNormalized[i];
      let xFrac: number;

      // 25% continuity bias: constrain to prevXFrac ± 0.15
      if (Math.random() < 0.25) {
        xFrac = Math.max(0.0, Math.min(1.0, prevXFrac + (Math.random() - 0.5) * 0.3));
      } else {
        // 40% full left/right zone logic
        const isLeft = i % 2 === 0;
        xFrac = isLeft
          ? Math.random() * 0.18 + 0.01  // 0.01–0.19 for left
          : Math.random() * 0.18 + 0.82; // 0.82–1.00 for right
      }

      points.push({ x: w * xFrac, y: cumulativeY });
      prevXFrac = xFrac;
    }

    // Final point: random bottom x, full height y
    const finalXFrac = Math.random() * 0.8 + 0.1; // 0.1–0.9
    points.push({ x: w * finalXFrac, y: boltHeight });

    // Build SVG path string
    return points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');
  }, []);

  // Lightning bolt data with pre-generated random paths
  const lightningBoltData = useMemo<{ xPositions: number[]; gapDuration: number; staggerDelay: number; paths: string[] }[]>(() => {
    if (backdropKey !== 'electric') return [];
    const w = 24;
    const boltHeight = Math.round(heroHeight * 0.80);
    const PATHS_PER_BOLT = 12;

    // Each bolt stays in its own horizontal zone to avoid clustering:
    // Bolt 0: left zone (0.08–0.40), Bolt 1: centre zone (0.38–0.68), Bolt 2: right zone (0.62–0.92)
    // Adjacent positions within each bolt are spaced ≥0.12 apart
    return [
      {
        xPositions: [0.08, 0.22, 0.14, 0.28, 0.10, 0.25],
        gapDuration: 1200,
        staggerDelay: 0,
        paths: Array.from({ length: PATHS_PER_BOLT }, () => generateRandomLightningPath(w, boltHeight)),
      },
      {
        xPositions: [0.45, 0.58, 0.50, 0.62, 0.47, 0.55],
        gapDuration: 3300,
        staggerDelay: 2200,
        paths: Array.from({ length: PATHS_PER_BOLT }, () => generateRandomLightningPath(w, boltHeight)),
      },
      {
        xPositions: [0.78, 0.88, 0.82, 0.92, 0.75, 0.85],
        gapDuration: 2000,
        staggerDelay: 1100,
        paths: Array.from({ length: PATHS_PER_BOLT }, () => generateRandomLightningPath(w, boltHeight)),
      },
    ];
  }, [backdropKey, heroHeight]);

  // Particle appearance (static styling)
  const particleAppearance = useMemo<ParticleAppearance[]>(() => {
    if (backdropKey === 'grass') {
      return Array(5).fill({
        width: 10,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(134, 190, 80, 0.65)',
      });
    }
    if (backdropKey === 'fire') {
      // Embers (0–2)
      const embers = Array(3).fill({
        width: 5,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: 'rgba(255, 110, 20, 0.7)',
      });
      // Ash flakes (3–5)
      const ash = Array(3).fill({
        width: 7,
        height: 4,
        borderRadius: 1,
        backgroundColor: 'rgba(155, 135, 115, 0.55)',
      });
      return [...embers, ...ash];
    }
    if (backdropKey === 'underwater') {
      return Array(6).fill({
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(160, 220, 255, 0.5)',
      });
    }
    if (backdropKey === 'water') {
      return Array(4).fill({
        width: 20,
        height: 20,
        borderRadius: 0,
        backgroundColor: 'transparent',
      });
    }
    if (backdropKey === 'ice') {
      return Array(6).fill({
        width: 14,
        height: 14,
        borderRadius: 0,
        backgroundColor: 'transparent',
      });
    }
    if (backdropKey === 'electric') {
      return Array(3).fill({
        width: 24,
        height: Math.round(heroHeight * 0.85),
        borderRadius: 0,
        backgroundColor: 'transparent',
      });
    }
    if (backdropKey === 'flying') {
      return Array(4).fill({
        width: 0,
        height: 0,
        borderRadius: 0,
        backgroundColor: 'transparent',
      });
    }
    if (backdropKey === 'bug') {
      return Array(6).fill({
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(168, 140, 100, 0.72)',
      });
    }
    if (backdropKey === 'fairy') {
      return Array(5).fill({
        width: 10,
        height: 10,
        borderRadius: 0,
        backgroundColor: 'transparent',
      });
    }
    return [];
  }, [backdropKey, heroHeight]);

  const sharedValues = useMemo(() => [
    { ty: ty0, tx: tx0, op: op0, ro: ro0, sc: sc0 },
    { ty: ty1, tx: tx1, op: op1, ro: ro1, sc: sc1 },
    { ty: ty2, tx: tx2, op: op2, ro: ro2, sc: sc2 },
    { ty: ty3, tx: tx3, op: op3, ro: ro3, sc: sc3 },
    { ty: ty4, tx: tx4, op: op4, ro: ro4, sc: sc4 },
    { ty: ty5, tx: tx5, op: op5, ro: ro5, sc: sc5 },
  ], [ty0, tx0, op0, ro0, sc0, ty1, tx1, op1, ro1, sc1, ty2, tx2, op2, ro2, sc2, ty3, tx3, op3, ro3, sc3, ty4, tx4, op4, ro4, sc4, ty5, tx5, op5, ro5, sc5]);

  // Animated props for flying dash offsets (unconditional at top level)
  const dashProps0 = useAnimatedProps(() => ({ strokeDashoffset: dash0.value } as any));
  const dashProps1 = useAnimatedProps(() => ({ strokeDashoffset: dash1.value } as any));
  const dashProps2 = useAnimatedProps(() => ({ strokeDashoffset: dash2.value } as any));
  const dashProps3 = useAnimatedProps(() => ({ strokeDashoffset: dash3.value } as any));

  const isActive = enabled && !!PARTICLE_CONFIGS[backdropKey];

  // Debounce refs to ensure we only increment once per flash (lightning bolts: indices 0–2)

  // Path indices for lightning bolts: one per bolt
  const pathIndices = useRef<number[]>([0, 0, 0]);

  // Stable callback to increment path index — must be wrapped in runOnJS when called from UI thread
  const incrementPathIndex = useCallback((boltIdx: number) => {
    pathIndices.current[boltIdx] = (pathIndices.current[boltIdx] + 1) % 12;
  }, []);

  useEffect(() => {
    if (!isActive) return;
    // Reset debounce refs when restarting (lightning bolts: 0–2)
    boltDebounce0.value = false;
    boltDebounce1.value = false;
    boltDebounce2.value = false;
    pathIndices.current = [0, 0, 0];
  }, [isActive]);

  useEffect(() => {
    if (!isActive) return;

    if (backdropKey === 'grass') {
      // Grass: 5 particles falling downward
      particleData.forEach((d, i) => {
        const sv = sharedValues[i];
        const { duration, staggerDelay, startX, driftAmp, driftDir, swayHalfPeriod } = d;

        sv.ty.value = withDelay(staggerDelay, withRepeat(
          withTiming(heroHeight * 0.65, { duration, easing: Easing.linear }),
          -1, false,
        ));

        sv.tx.value = startX;
        sv.tx.value = startX - driftAmp * driftDir;
        sv.tx.value = withDelay(staggerDelay, withRepeat(
          withTiming(startX + driftAmp * driftDir, { duration: swayHalfPeriod, easing: Easing.inOut(Easing.sin) }),
          -1, true,
        ));

        sv.op.value = withDelay(staggerDelay, withRepeat(
          withSequence(
            withTiming(0.65, { duration: 800, easing: Easing.out(Easing.quad) }),
            withTiming(0.65, { duration: duration - 1600 }),
            withTiming(0, { duration: 800, easing: Easing.in(Easing.quad) }),
          ),
          -1, false,
        ));

        sv.ro.value = withDelay(staggerDelay, withRepeat(
          withTiming(180, { duration, easing: Easing.linear }),
          -1, false,
        ));
      });
    } else if (backdropKey === 'fire') {
      // Fire: 6 particles (3 embers rising + 3 ash falling)
      fireParticleData.forEach((d, i) => {
        const sv = sharedValues[i];
        const { duration, staggerDelay, startX, driftAmp, driftDir, swayHalfPeriod } = d;
        const isEmber = i < 3;

        // Embers: ty from heroHeight*0.65 → 0 (rising)
        // Ash: ty from 0 → heroHeight*0.65 (falling)
        const startY = isEmber ? heroHeight * 0.65 : 0;
        const endY = isEmber ? 0 : heroHeight * 0.65;

        sv.ty.value = startY;
        sv.ty.value = withDelay(staggerDelay, withRepeat(
          withTiming(endY, { duration, easing: Easing.linear }),
          -1, false,
        ));

        sv.tx.value = startX;
        sv.tx.value = startX - driftAmp * driftDir;
        sv.tx.value = withDelay(staggerDelay, withRepeat(
          withTiming(startX + driftAmp * driftDir, { duration: swayHalfPeriod, easing: Easing.inOut(Easing.sin) }),
          -1, true,
        ));

        if (isEmber) {
          // Ember opacity: fade in 600ms → hold → fade out 600ms, peak 0.7
          sv.op.value = withDelay(staggerDelay, withRepeat(
            withSequence(
              withTiming(0.7, { duration: 600, easing: Easing.out(Easing.quad) }),
              withTiming(0.7, { duration: duration - 1200 }),
              withTiming(0, { duration: 600, easing: Easing.in(Easing.quad) }),
            ),
            -1, false,
          ));

          // Ember rotation: 0 → 360deg
          sv.ro.value = withDelay(staggerDelay, withRepeat(
            withTiming(360, { duration, easing: Easing.linear }),
            -1, false,
          ));
        } else {
          // Ash opacity: fade in 800ms → hold → fade out 800ms, peak 0.55
          sv.op.value = withDelay(staggerDelay, withRepeat(
            withSequence(
              withTiming(0.55, { duration: 800, easing: Easing.out(Easing.quad) }),
              withTiming(0.55, { duration: duration - 1600 }),
              withTiming(0, { duration: 800, easing: Easing.in(Easing.quad) }),
            ),
            -1, false,
          ));

          // Ash rotation: 0 → 180deg
          sv.ro.value = withDelay(staggerDelay, withRepeat(
            withTiming(180, { duration, easing: Easing.linear }),
            -1, false,
          ));
        }
      });
    } else if (backdropKey === 'underwater') {
      // Underwater: 6 bubbles rising upward
      underwaterParticleData.forEach((d, i) => {
        const sv = sharedValues[i];
        const { duration, staggerDelay, startX, driftAmp, driftDir, swayHalfPeriod } = d;

        // Bubbles: ty from heroHeight*0.65 → 0 (rising)
        sv.ty.value = heroHeight * 0.65;
        sv.ty.value = withDelay(staggerDelay, withRepeat(
          withTiming(0, { duration, easing: Easing.linear }),
          -1, false,
        ));

        sv.tx.value = startX;
        sv.tx.value = startX - driftAmp * driftDir;
        sv.tx.value = withDelay(staggerDelay, withRepeat(
          withTiming(startX + driftAmp * driftDir, { duration: swayHalfPeriod, easing: Easing.inOut(Easing.sin) }),
          -1, true,
        ));

        // Bubble opacity: fade in 700ms → hold → fade out 700ms, peak 0.5
        sv.op.value = withDelay(staggerDelay, withRepeat(
          withSequence(
            withTiming(0.5, { duration: 700, easing: Easing.out(Easing.quad) }),
            withTiming(0.5, { duration: duration - 1400 }),
            withTiming(0, { duration: 700, easing: Easing.in(Easing.quad) }),
          ),
          -1, false,
        ));

        // No rotation for bubbles
        sv.ro.value = 0;

        // Reset scale for underwater
        sv.sc.value = 1;
      });
    } else if (backdropKey === 'water') {
      // Water: 4 sparkles that teleport to a new position each flash cycle.
      // While opacity is 0 (between flashes), tx/ty snap instantly to the next position.
      waterParticleData.forEach((d, i) => {
        const sv = sharedValues[i];
        const { staggerDelay, positions } = d;
        const FADE_IN = 400;
        const HOLD = 150;   // brief peak — most time spent ramping
        const FADE_OUT = 400;
        const GAP = 1800;   // long dark pause between flashes

        // Build a long sequence cycling through all 16 positions
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const txSteps: any[] = [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tySteps: any[] = [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const opSteps: any[] = [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const scSteps: any[] = [];

        positions.forEach((pos) => {
          const px = screenWidth * pos.x;
          const py = heroHeight * pos.y;

          // Teleport instantly while still invisible
          txSteps.push(withTiming(px, { duration: 0 }));
          tySteps.push(withTiming(py, { duration: 0 }));

          // Hold position through flash
          txSteps.push(withTiming(px, { duration: FADE_IN + HOLD + FADE_OUT + GAP }));
          tySteps.push(withTiming(py, { duration: FADE_IN + HOLD + FADE_OUT + GAP }));

          // Smooth bell-curve opacity — long ramp, brief peak, long ramp down
          opSteps.push(
            withTiming(0.23, { duration: FADE_IN, easing: Easing.inOut(Easing.sin) }),
            withTiming(0.23, { duration: HOLD }),
            withTiming(0, { duration: FADE_OUT, easing: Easing.inOut(Easing.sin) }),
            withTiming(0, { duration: GAP }),
          );

          // Scale matches opacity curve
          scSteps.push(
            withTiming(1.0, { duration: FADE_IN, easing: Easing.inOut(Easing.sin) }),
            withTiming(1.0, { duration: HOLD }),
            withTiming(0.3, { duration: FADE_OUT + GAP, easing: Easing.inOut(Easing.sin) }),
          );
        });

        sv.ty.value = heroHeight * positions[0].y;
        sv.tx.value = screenWidth * positions[0].x;
        sv.op.value = 0;
        sv.ro.value = 0;
        sv.sc.value = 0.5;

        sv.tx.value = withDelay(staggerDelay, withRepeat(withSequence(...txSteps), -1, false));
        sv.ty.value = withDelay(staggerDelay, withRepeat(withSequence(...tySteps), -1, false));
        sv.op.value = withDelay(staggerDelay, withRepeat(withSequence(...opSteps), -1, false));
        sv.sc.value = withDelay(staggerDelay, withRepeat(withSequence(...scSteps), -1, false));
      });
    } else if (backdropKey === 'ice') {
      // Ice: 6 snowflakes falling downward
      iceParticleData.forEach((d, i) => {
        const sv = sharedValues[i];
        const { duration, staggerDelay, startX, driftAmp, driftDir, swayHalfPeriod } = d;

        // Snowflakes: ty from 0 → heroHeight*0.65 (falling)
        sv.ty.value = 0;
        sv.ty.value = withDelay(staggerDelay, withRepeat(
          withTiming(heroHeight * 0.65, { duration, easing: Easing.linear }),
          -1, false,
        ));

        sv.tx.value = startX;
        sv.tx.value = startX - driftAmp * driftDir;
        sv.tx.value = withDelay(staggerDelay, withRepeat(
          withTiming(startX + driftAmp * driftDir, { duration: swayHalfPeriod, easing: Easing.inOut(Easing.sin) }),
          -1, true,
        ));

        // Snowflake opacity: fade in 800ms → hold → fade out 800ms, peak 0.65
        sv.op.value = withDelay(staggerDelay, withRepeat(
          withSequence(
            withTiming(0.65, { duration: 800, easing: Easing.out(Easing.quad) }),
            withTiming(0.65, { duration: duration - 1600 }),
            withTiming(0, { duration: 800, easing: Easing.in(Easing.quad) }),
          ),
          -1, false,
        ));

        // Snowflake rotation: 0 → 360deg
        sv.ro.value = withDelay(staggerDelay, withRepeat(
          withTiming(360, { duration, easing: Easing.linear }),
          -1, false,
        ));

        // Reset scale for ice
        sv.sc.value = 1;
      });
    } else if (backdropKey === 'electric') {
      // Electric: 2 lightning bolts striking vertically, cycling through x-positions
      lightningBoltData.forEach((boltConfig, boltIdx) => {
        const sv = sharedValues[boltIdx];
        const { xPositions, gapDuration, staggerDelay } = boltConfig;
        const FLASH_IN = 40;       // fast snap to peak
        const FLASH_DROP = 480;    // quick drop from peak to dim
        const DECAY = 700;        // exponential tail: dim → zero
        const PEAK_OP = 0.55;
        const DIM_OP = 0.20;
        const totalPerPosition = FLASH_IN + FLASH_DROP + DECAY + gapDuration;
        const fullSequenceDuration = totalPerPosition * xPositions.length;

        // Build tx sequence: teleport to position, hold there through full cycle
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const txSteps: any[] = [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const opSteps: any[] = [];

        xPositions.forEach((xFrac) => {
          const posX = screenWidth * xFrac;

          // Teleport instantly to this x-position
          txSteps.push(withTiming(posX, { duration: 0 }));
          // Hold position throughout the full cycle (flash + gap)
          txSteps.push(withTiming(posX, { duration: totalPerPosition }));

          // Flash opacity sequence: peak → quick drop → dim linger → fade out → dark gap
          opSteps.push(
            withTiming(PEAK_OP, { duration: FLASH_IN, easing: Easing.out(Easing.quad) }),
            withTiming(DIM_OP, { duration: FLASH_DROP, easing: Easing.in(Easing.quad) }),
            withTiming(0, { duration: DECAY, easing: Easing.out(Easing.exp) }),
            withTiming(0, { duration: gapDuration }),
          );
        });

        sv.ty.value = 0;
        sv.tx.value = screenWidth * xPositions[0];
        sv.op.value = 0;
        sv.ro.value = 0;
        sv.sc.value = 1;

        sv.tx.value = withDelay(staggerDelay, withRepeat(withSequence(...txSteps), -1, false));
        sv.op.value = withDelay(staggerDelay, withRepeat(withSequence(...opSteps), -1, false));
      });
    } else if (backdropKey === 'flying') {
      // Flying: 4 horizontal wind streaks following sine wave curves
      // Use strokeDasharray + strokeDashoffset animation (no tx translation)
      flyingParticleData.forEach((particle, i) => {
        const sv = sharedValues[i];
        const { startX, startY, duration, staggerDelay } = particle;

        // Get the dash shared value for this particle
        const dashSv = [dash0, dash1, dash2, dash3][i];
        if (!dashSv) return;

        // Seed initial positions — SVG is positioned at startY, no tx translation
        sv.ty.value = startY;
        sv.tx.value = 0;
        sv.op.value = 0;

        // Animate dash offset: crawls from 0 to -(totalPathLength + streakLength)
        // totalPathLength ≈ screenWidth + 240, streakLength = 100
        const totalPathLength = screenWidth + 240;
        const streakLength = 100;
        const endDashOffset = totalPathLength + streakLength;

        dashSv.value = 0;
        dashSv.value = withDelay(staggerDelay, withRepeat(
          withTiming(endDashOffset, { duration, easing: Easing.linear }),
          -1, false,
        ));

        // Animate op: bell curve — fade in 600ms, hold middle, fade out 600ms
        const holdDuration = duration - 1200;
        sv.op.value = withDelay(staggerDelay, withRepeat(
          withSequence(
            withTiming(0.70, { duration: 600, easing: Easing.out(Easing.quad) }),
            withTiming(0.70, { duration: holdDuration }),
            withTiming(0, { duration: 600, easing: Easing.in(Easing.quad) }),
          ),
          -1, false,
        ));

        // Reset ro, sc for flying
        sv.ro.value = 0;
        sv.sc.value = 1;
      });
    } else if (backdropKey === 'bug') {
      // Bug: 6 spores at fixed positions, each with independent fade cycle
      bugParticleData.forEach((d, i) => {
        const sv = sharedValues[i];
        const { startX, startY, duration, staggerDelay, driftAmp, driftDir, swayHalfPeriod } = d;
        const startYVal = startY ?? heroHeight * 0.35;
        // Y period is intentionally incommensurate with X period so position when visible varies
        const tyPeriod = Math.round(swayHalfPeriod * 1.47);
        const tyAmp = heroHeight * 0.30 * (driftDir === 1 ? 1 : -1);

        sv.tx.value = startX - driftAmp * driftDir;
        sv.tx.value = withRepeat(
          withTiming(startX + driftAmp * driftDir, { duration: swayHalfPeriod, easing: Easing.inOut(Easing.sin) }),
          -1, true,
        );

        sv.ty.value = startYVal;
        sv.ty.value = withRepeat(
          withTiming(startYVal + tyAmp, { duration: tyPeriod, easing: Easing.inOut(Easing.sin) }),
          -1, true,
        );

        sv.op.value = 0;
        sv.op.value = withDelay(staggerDelay, withRepeat(
          withSequence(
            withTiming(0.72, { duration: 1200, easing: Easing.out(Easing.quad) }),
            withTiming(0.72, { duration: duration - 2400 }),
            withTiming(0, { duration: 1200, easing: Easing.in(Easing.quad) }),
            withTiming(0, { duration: duration * 0.9 }), // dark gap — ~0.9× visible time
          ),
          -1, false,
        ));

        sv.ro.value = 0;
      });
    } else if (backdropKey === 'fairy') {
      // Fairy: sparkles twinkle at random positions
      // Position is held in tx/ty as offset from startX/startY anchor
      // Teleport fires via runOnJS when op crosses back to 0 (dark gap start)
      fairyParticleData.forEach((d, i) => {
        const sv = sharedValues[i];
        sv.ro.value = 0;
        sv.sc.value = 1;
        sv.tx.value = 0;
        sv.ty.value = 0;

        sv.op.value = 0;
        sv.op.value = withDelay(
          d.staggerDelay,
          withRepeat(
            withSequence(
              withTiming(1.0, { duration: 600, easing: Easing.inOut(Easing.sin) }),
              withTiming(0.0, { duration: 600, easing: Easing.inOut(Easing.sin) }),
              withTiming(0.0, { duration: d.duration - 1200 }),
            ),
            -1, false
          )
        );
      });
    } else if (backdropKey === 'mega') {
      // Mega: 6 angled gradient layers, each with independent opacity cycling
      // Fade the whole container in on mount so mask images load before becoming visible
      megaGradRot.value = 0;
      megaGradRot.value = withTiming(1, { duration: 800, easing: Easing.inOut(Easing.sin) });

      // Static silhouette masked layer — no rotation, shimmer through opacity blending

      // Layer 0: 0° angle (left → right)
      megaAOp0.value = withDelay(0, withRepeat(
        withSequence(
          withTiming(0.92, { duration: 5000 * 0.35, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.92, { duration: 5000 * 0.10 }),
          withTiming(0.0,  { duration: 5000 * 0.25, easing: Easing.inOut(Easing.sin) }),
        ),
        -1, false
      ));

      // Layer 1: 60° angle (bottom-left → top-right)
      megaAOp1.value = withDelay(800, withRepeat(
        withSequence(
          withTiming(0.92, { duration: 6500 * 0.35, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.92, { duration: 6500 * 0.10 }),
          withTiming(0.0,  { duration: 6500 * 0.25, easing: Easing.inOut(Easing.sin) }),
        ),
        -1, false
      ));

      // Layer 2: 120° angle (top-left → bottom-right)
      megaAOp2.value = withDelay(1600, withRepeat(
        withSequence(
          withTiming(0.92, { duration: 4200 * 0.35, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.92, { duration: 4200 * 0.10 }),
          withTiming(0.0,  { duration: 4200 * 0.25, easing: Easing.inOut(Easing.sin) }),
        ),
        -1, false
      ));

      // Layer 3: 180° angle (right → left)
      megaAOp3.value = withDelay(400, withRepeat(
        withSequence(
          withTiming(0.92, { duration: 7300 * 0.35, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.92, { duration: 7300 * 0.10 }),
          withTiming(0.0,  { duration: 7300 * 0.25, easing: Easing.inOut(Easing.sin) }),
        ),
        -1, false
      ));

      // Layer 4: 240° angle (top-right → bottom-left)
      megaAOp4.value = withDelay(1200, withRepeat(
        withSequence(
          withTiming(0.92, { duration: 5800 * 0.35, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.92, { duration: 5800 * 0.10 }),
          withTiming(0.0,  { duration: 5800 * 0.25, easing: Easing.inOut(Easing.sin) }),
        ),
        -1, false
      ));

      // Layer 5: 300° angle (bottom-right → top-left)
      megaAOp5.value = withDelay(2000, withRepeat(
        withSequence(
          withTiming(0.92, { duration: 6100 * 0.35, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.92, { duration: 6100 * 0.10 }),
          withTiming(0.0,  { duration: 6100 * 0.25, easing: Easing.inOut(Easing.sin) }),
        ),
        -1, false
      ));
    }

    return () => {
      sharedValues.forEach((sv) => {
        cancelAnimation(sv.ty);
        cancelAnimation(sv.tx);
        cancelAnimation(sv.op);
        cancelAnimation(sv.ro);
        cancelAnimation(sv.sc);
      });
      // Cleanup mega shared values (6 gradient layer opacities)
      if (backdropKey === 'mega') {
        cancelAnimation(megaAOp0);
        cancelAnimation(megaAOp1);
        cancelAnimation(megaAOp2);
        cancelAnimation(megaAOp3);
        cancelAnimation(megaAOp4);
        cancelAnimation(megaAOp5);
        cancelAnimation(megaGradRot);
        megaGradRot.value = 0;
      }
    };
  }, [isActive, backdropKey, heroHeight, particleData, fireParticleData, underwaterParticleData, waterParticleData, iceParticleData, lightningBoltData, flyingParticleData, bugParticleData, fairyParticleData, sharedValues, screenWidth]);

  // Shared value debounce flags for lightning bolt path cycling (UI-thread safe)
  const boltDebounce0 = useSharedValue(false);
  const boltDebounce1 = useSharedValue(false);
  const boltDebounce2 = useSharedValue(false);

  const incrementPathIndex0 = useCallback(() => incrementPathIndex(0), [incrementPathIndex]);
  const incrementPathIndex1 = useCallback(() => incrementPathIndex(1), [incrementPathIndex]);
  const incrementPathIndex2 = useCallback(() => incrementPathIndex(2), [incrementPathIndex]);

  // useAnimatedReaction for each lightning bolt (unconditional at top level)
  useAnimatedReaction(
    () => op0.value,
    (opValue) => {
      if (opValue > 0.05 && !boltDebounce0.value) {
        boltDebounce0.value = true;
        runOnJS(incrementPathIndex0)();
      } else if (opValue < 0.02) {
        boltDebounce0.value = false;
      }
    },
    [],
  );

  useAnimatedReaction(
    () => op1.value,
    (opValue) => {
      if (opValue > 0.05 && !boltDebounce1.value) {
        boltDebounce1.value = true;
        runOnJS(incrementPathIndex1)();
      } else if (opValue < 0.02) {
        boltDebounce1.value = false;
      }
    },
    [],
  );

  useAnimatedReaction(
    () => op2.value,
    (opValue) => {
      if (opValue > 0.05 && !boltDebounce2.value) {
        boltDebounce2.value = true;
        runOnJS(incrementPathIndex2)();
      } else if (opValue < 0.02) {
        boltDebounce2.value = false;
      }
    },
    [],
  );


  // Fairy teleport callbacks — snap tx/ty to a new random position while op is 0
  const fairyTeleport0 = useCallback(() => {
    ty0.value = heroHeight * (0.10 + Math.random() * 0.70) - (fairyParticleData[0]?.startY ?? 0);
    tx0.value = screenWidth * (0.05 + Math.random() * 0.90) - (fairyParticleData[0]?.startX ?? 0);
  }, [heroHeight, screenWidth, fairyParticleData, ty0, tx0]);
  const fairyTeleport1 = useCallback(() => {
    ty1.value = heroHeight * (0.10 + Math.random() * 0.70) - (fairyParticleData[1]?.startY ?? 0);
    tx1.value = screenWidth * (0.05 + Math.random() * 0.90) - (fairyParticleData[1]?.startX ?? 0);
  }, [heroHeight, screenWidth, fairyParticleData, ty1, tx1]);
  const fairyTeleport2 = useCallback(() => {
    ty2.value = heroHeight * (0.10 + Math.random() * 0.70) - (fairyParticleData[2]?.startY ?? 0);
    tx2.value = screenWidth * (0.05 + Math.random() * 0.90) - (fairyParticleData[2]?.startX ?? 0);
  }, [heroHeight, screenWidth, fairyParticleData, ty2, tx2]);
  const fairyTeleport3 = useCallback(() => {
    ty3.value = heroHeight * (0.10 + Math.random() * 0.70) - (fairyParticleData[3]?.startY ?? 0);
    tx3.value = screenWidth * (0.05 + Math.random() * 0.90) - (fairyParticleData[3]?.startX ?? 0);
  }, [heroHeight, screenWidth, fairyParticleData, ty3, tx3]);
  const fairyTeleport4 = useCallback(() => {
    ty4.value = heroHeight * (0.10 + Math.random() * 0.70) - (fairyParticleData[4]?.startY ?? 0);
    tx4.value = screenWidth * (0.05 + Math.random() * 0.90) - (fairyParticleData[4]?.startX ?? 0);
  }, [heroHeight, screenWidth, fairyParticleData, ty4, tx4]);

  // Trigger teleport when each fairy sparkle fades out (op crosses below 0.02)
  useAnimatedReaction(() => op0.value, (v, prev) => {
    if (backdropKey === 'fairy' && v < 0.02 && (prev ?? 1) >= 0.02) runOnJS(fairyTeleport0)();
  }, [backdropKey]);
  useAnimatedReaction(() => op1.value, (v, prev) => {
    if (backdropKey === 'fairy' && v < 0.02 && (prev ?? 1) >= 0.02) runOnJS(fairyTeleport1)();
  }, [backdropKey]);
  useAnimatedReaction(() => op2.value, (v, prev) => {
    if (backdropKey === 'fairy' && v < 0.02 && (prev ?? 1) >= 0.02) runOnJS(fairyTeleport2)();
  }, [backdropKey]);
  useAnimatedReaction(() => op3.value, (v, prev) => {
    if (backdropKey === 'fairy' && v < 0.02 && (prev ?? 1) >= 0.02) runOnJS(fairyTeleport3)();
  }, [backdropKey]);
  useAnimatedReaction(() => op4.value, (v, prev) => {
    if (backdropKey === 'fairy' && v < 0.02 && (prev ?? 1) >= 0.02) runOnJS(fairyTeleport4)();
  }, [backdropKey]);

  // Animated styles declared unconditionally — only transform + opacity, position is static
  const style0 = useAnimatedStyle(() => ({
    opacity: op0.value,
    transform: [{ translateX: tx0.value }, { translateY: ty0.value }, { rotate: `${ro0.value}deg` }, { scale: sc0.value }],
  }));
  const style1 = useAnimatedStyle(() => ({
    opacity: op1.value,
    transform: [{ translateX: tx1.value }, { translateY: ty1.value }, { rotate: `${ro1.value}deg` }, { scale: sc1.value }],
  }));
  const style2 = useAnimatedStyle(() => ({
    opacity: op2.value,
    transform: [{ translateX: tx2.value }, { translateY: ty2.value }, { rotate: `${ro2.value}deg` }, { scale: sc2.value }],
  }));
  const style3 = useAnimatedStyle(() => ({
    opacity: op3.value,
    transform: [{ translateX: tx3.value }, { translateY: ty3.value }, { rotate: `${ro3.value}deg` }, { scale: sc3.value }],
  }));
  const style4 = useAnimatedStyle(() => ({
    opacity: op4.value,
    transform: [{ translateX: tx4.value }, { translateY: ty4.value }, { rotate: `${ro4.value}deg` }, { scale: sc4.value }],
  }));
  const style5 = useAnimatedStyle(() => ({
    opacity: op5.value,
    transform: [{ translateX: tx5.value }, { translateY: ty5.value }, { rotate: `${ro5.value}deg` }, { scale: sc5.value }],
  }));

  // Opacity-only styles for flying streaks (unconditional, for use in render)
  const flyingOpacityStyle0 = useAnimatedStyle(() => ({ opacity: op0.value }));
  const flyingOpacityStyle1 = useAnimatedStyle(() => ({ opacity: op1.value }));
  const flyingOpacityStyle2 = useAnimatedStyle(() => ({ opacity: op2.value }));
  const flyingOpacityStyle3 = useAnimatedStyle(() => ({ opacity: op3.value }));

  // Mega gradient rotation style (new architecture)
  const megaGradRotStyle = useAnimatedStyle(() => ({
    opacity: megaGradRot.value,
  }));

  // Mega gradient layer opacity styles (opacity-only for GPU compositing on Animated.View)
  const megaAStyle0 = useAnimatedStyle(() => ({
    opacity: megaAOp0.value,
  }));
  const megaAStyle1 = useAnimatedStyle(() => ({
    opacity: megaAOp1.value,
  }));
  const megaAStyle2 = useAnimatedStyle(() => ({
    opacity: megaAOp2.value,
  }));
  const megaAStyle3 = useAnimatedStyle(() => ({
    opacity: megaAOp3.value,
  }));
  const megaAStyle4 = useAnimatedStyle(() => ({
    opacity: megaAOp4.value,
  }));
  const megaAStyle5 = useAnimatedStyle(() => ({
    opacity: megaAOp5.value,
  }));

  // Static appearance styles (position, size, color) — one per particle
  const staticStyle = (idx: number) => {
    const app = particleAppearance[idx];
    if (!app) return {} as const;
    return {
      position: 'absolute' as const,
      left: 0,
      top: -10,
      width: app.width,
      height: app.height,
      borderRadius: app.borderRadius,
      backgroundColor: app.backgroundColor,
    };
  };

  // Early return AFTER all hooks
  if (!isActive) return null;

  // Render fairy sparkle motes — dedicated return so startX/startY are used as base positions
  if (backdropKey === 'fairy') {
    const fairyStyles = [style0, style1, style2, style3, style4];
    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {fairyParticleData.map((d, i) => {
          const animStyle = fairyStyles[i];
          const size = 13;
          const cx = size / 2;
          const cy = size / 2;
          return (
            <Animated.View
              key={`fairy-${i}`}
              style={[
                {
                  position: 'absolute',
                  left: d.startX - size / 2,
                  top: (d.startY ?? 0) - size / 2,
                  width: size,
                  height: size,
                },
                animStyle,
              ]}
              pointerEvents="none"
            >
              <Svg width={size} height={size}>
                <Defs>
                  <RadialGradient id={`fairyGlow${i}`} cx="50%" cy="50%" r="50%">
                    <Stop offset="0%"   stopColor="rgba(255,255,255,1)"   stopOpacity="1" />
                    <Stop offset="40%"  stopColor="rgba(255,210,235,1)"   stopOpacity="0.8" />
                    <Stop offset="100%" stopColor="rgba(255,180,220,0)"   stopOpacity="0" />
                  </RadialGradient>
                </Defs>
                <Circle cx={cx} cy={cy} r={cx} fill={`url(#fairyGlow${i})`} />
              </Svg>
            </Animated.View>
          );
        })}
      </View>
    );
  }

  // Render mega glow effect (new architecture: 6 separate SVGs with static content, opacity animated on View)
  if (backdropKey === 'mega' && artworkUrl) {
    const SVG_SIZE = ARTWORK_SIZE * 2.0; // 560px — room for wide blur bleed
    const cx = SVG_SIZE / 2;
    const cy = SVG_SIZE / 2;
    const svgLeft = (screenWidth - SVG_SIZE) / 2;

    const svgPositionStyle = {
      position: 'absolute' as const,
      left: svgLeft,
      top: '50%' as const,
      marginTop: -SVG_SIZE / 2,
    };

    // Dark shadow layer
    const shadowStyle = {
      position: 'absolute' as const,
      width: ARTWORK_SIZE * 1.01,
      height: ARTWORK_SIZE * 1.01,
      alignSelf: 'center' as const,
      top: '50%' as const,
      marginTop: -(ARTWORK_SIZE * 1.01) / 2,
      opacity: 0.7,
    };

    // Helper to render a single static SVG layer with one gradient and static Rect
    const renderMegaLayer = (layerIdx: number, gradientId: string, x1: string, y1: string, x2: string, y2: string, animatedStyle: any) => {
      const maskId = `mgMask${layerIdx}`;
      const gradIdFull = `mgGrad${layerIdx}_g`;
      const filterId = `mgMaskBlur${layerIdx}`;

      return (
        <Animated.View
          key={`mega-aura-${layerIdx}`}
          style={[svgPositionStyle, animatedStyle]}
          pointerEvents="none"
        >
          <Svg width={SVG_SIZE} height={SVG_SIZE}>
            <Defs>
              <SvgLinearGradient id={gradIdFull} x1={x1} y1={y1} x2={x2} y2={y2}>
                <Stop offset="0%"    stopColor="#FF0000" stopOpacity="0" />
                <Stop offset="10%"   stopColor="#FF0000" stopOpacity="0.85" />
                <Stop offset="14.3%" stopColor="#FF7F00" stopOpacity="1" />
                <Stop offset="28.6%" stopColor="#FFFF00" stopOpacity="1" />
                <Stop offset="42.9%" stopColor="#00FF00" stopOpacity="1" />
                <Stop offset="57.1%" stopColor="#0000FF" stopOpacity="1" />
                <Stop offset="71.4%" stopColor="#4B0082" stopOpacity="1" />
                <Stop offset="85.7%" stopColor="#9400D3" stopOpacity="0.85" />
                <Stop offset="90%"   stopColor="#FF0000" stopOpacity="0.85" />
                <Stop offset="100%"  stopColor="#FF0000" stopOpacity="0" />
              </SvgLinearGradient>

              <Filter id={filterId} x="-60%" y="-60%" width="220%" height="220%">
                <FeGaussianBlur stdDeviation="128" />
              </Filter>

              <Mask id={maskId}>
                <SvgImage
                  href={artworkUrl}
                  x={cx - (ARTWORK_SIZE * 1.08) / 2}
                  y={cy - (ARTWORK_SIZE * 1.08) / 2}
                  width={ARTWORK_SIZE * 1.08}
                  height={ARTWORK_SIZE * 1.08}
                  preserveAspectRatio="xMidYMid meet"
                  filter={`url(#${filterId})`}
                />
              </Mask>
            </Defs>

            <Rect
              x={0}
              y={0}
              width={SVG_SIZE}
              height={SVG_SIZE}
              fill={`url(#${gradIdFull})`}
              mask={`url(#${maskId})`}
              opacity={1}
            />
          </Svg>
        </Animated.View>
      );
    };

    return (
      <Animated.View style={[StyleSheet.absoluteFill, megaGradRotStyle]} pointerEvents="none">
        {/* Dark shadow layer (bottom) */}
        <View style={shadowStyle} pointerEvents="none">
          <Image
            source={{ uri: artworkUrl }}
            style={{ flex: 1, width: '100%', height: '100%' }}
            contentFit="contain"
            tintColor="#1a1a2e"
            cachePolicy="memory-disk"
          />
        </View>

        {/* 6 rainbow gradient layers — each is a static SVG in an Animated.View with opacity animation */}
        {renderMegaLayer(0, 'mgGrad0', '0', '0.5', '1', '0.5', megaAStyle0)}
        {renderMegaLayer(1, 'mgGrad1', '0', '1', '1', '0', megaAStyle1)}
        {renderMegaLayer(2, 'mgGrad2', '0', '0', '1', '1', megaAStyle2)}
        {renderMegaLayer(3, 'mgGrad3', '1', '0.5', '0', '0.5', megaAStyle3)}
        {renderMegaLayer(4, 'mgGrad4', '1', '0', '0', '1', megaAStyle4)}
        {renderMegaLayer(5, 'mgGrad5', '1', '1', '0', '0', megaAStyle5)}

        {/* Tight contrast shadow — sits above rainbow layers, below artwork */}
        <View
          style={{
            position: 'absolute',
            width: ARTWORK_SIZE * 1.015,
            height: ARTWORK_SIZE * 1.015,
            alignSelf: 'center',
            top: '50%',
            marginTop: -(ARTWORK_SIZE * 1.015) / 2,
          }}
          pointerEvents="none"
        >
          <Image
            source={{ uri: artworkUrl }}
            style={{ flex: 1, width: '100%', height: '100%' }}
            contentFit="contain"
            tintColor="rgba(0,0,0,0.85)"
            cachePolicy="memory-disk"
          />
        </View>
      </Animated.View>
    );
  }

  const styles = [style0, style1, style2, style3, style4, style5];

  return (
    <View
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      pointerEvents="none"
    >
      {styles.map((animStyle, idx) => {
        const app = particleAppearance[idx];
        if (!app) return null;
        const isLightningBolt = backdropKey === 'electric' && idx < 3;
        const isWaterSparkle = backdropKey === 'water' && idx < 4;
        const isSnowflake = backdropKey === 'ice' && idx < 6;
        const isFlyingStreak = backdropKey === 'flying' && idx < 4;
        if (isFlyingStreak) {
          const particle = flyingParticleData[idx];
          if (!particle) return null;

          // Generate sine wave path for wind streak
          const steps = 60;
          const amplitude = 7 + idx * 3; // 7, 10, 13, 16px
          const frequency = 1.5; // number of full waves across screen
          const arcDir = idx % 2 === 0 ? 1 : -1;
          const containerHeight = amplitude * 2 + 20;
          const svgWidth = screenWidth + 240;

          const points = Array.from({ length: steps + 1 }, (_, i) => {
            const x = (i / steps) * svgWidth - 120;
            const y = containerHeight / 2 + arcDir * amplitude * Math.sin((i / steps) * Math.PI * 2 * frequency);
            return `${x},${y}`;
          });
          const pathD = `M ${points.join(' L ')}`;

          // Get the appropriate dash props and opacity style for this particle
          const dashProps = [dashProps0, dashProps1, dashProps2, dashProps3][idx];
          const opacityStyle = [flyingOpacityStyle0, flyingOpacityStyle1, flyingOpacityStyle2, flyingOpacityStyle3][idx];

          const totalPathLength = screenWidth + 240;
          const streakLength = 100;

          return (
            <View
              key={idx}
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: -120,
                top: particle.startY - containerHeight / 2,
                width: svgWidth,
                height: containerHeight,
              }}
            >
              <Animated.View
                style={[opacityStyle]}
                pointerEvents="none"
              >
                <Svg width={svgWidth} height={containerHeight}>
                  <Defs>
                    <Filter id={`wind-blur-${idx}`}>
                      <FeGaussianBlur in="SourceGraphic" stdDeviation="3" />
                    </Filter>
                    <Filter id={`wind-blur-soft-${idx}`}>
                      <FeGaussianBlur in="SourceGraphic" stdDeviation="6" />
                    </Filter>
                  </Defs>
                  {/* Soft wide halo */}
                  <AnimatedPath
                    d={pathD}
                    stroke="rgba(200, 225, 250, 0.25)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    fill="none"
                    strokeDasharray={[streakLength, totalPathLength + streakLength]}
                    animatedProps={dashProps}
                    filter={`url(#wind-blur-soft-${idx})`}
                  />
                  {/* Sharp core */}
                  <AnimatedPath
                    d={pathD}
                    stroke="rgba(200, 225, 250, 0.70)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    fill="none"
                    strokeDasharray={[streakLength, totalPathLength + streakLength]}
                    animatedProps={dashProps}
                    filter={`url(#wind-blur-${idx})`}
                  />
                </Svg>
              </Animated.View>
            </View>
          );
        }
        if (isLightningBolt) {
          const boltHeight = Math.round(heroHeight * 0.8);
          const w = 24;
          const boltConfig = lightningBoltData[idx];

          // Get current path for this bolt from the path pool
          const currentPath = boltConfig?.paths?.[pathIndices.current[idx] % (boltConfig?.paths?.length || 1)] || '';

          return (
            <Animated.View
              key={idx}
              style={[{ position: 'absolute', left: 0, top: 0, width: w, height: boltHeight }, animStyle]}
            >
              <Svg width={w} height={boltHeight}>
                <Defs>
                  <Filter id={`glow-${idx}`}>
                    <FeGaussianBlur in="SourceGraphic" stdDeviation="2.5" />
                  </Filter>
                </Defs>
                {/* Atmospheric glow — keep existing, no change */}
                <Path
                  d={currentPath}
                  stroke="rgba(255, 220, 0, 0.25)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  filter={`url(#glow-${idx})`}
                />
                {/* Layer 1: Outer golden shell */}
                <Path
                  d={currentPath}
                  stroke="rgba(180, 130, 0, 0.35)"
                  strokeWidth="6.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
                {/* Layer 2: Bright yellow mid-band */}
                <Path
                  d={currentPath}
                  stroke="rgba(255, 225, 0, 0.45)"
                  strokeWidth="4.0"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
                {/* Layer 3: Hot white-yellow core */}
                <Path
                  d={currentPath}
                  stroke="rgba(255, 252, 200, 0.90)"
                  strokeWidth="2.0"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </Svg>
            </Animated.View>
          );
        }
        if (isWaterSparkle) {
          const size = 20;
          return (
            <Animated.View
              key={idx}
              style={[{ position: 'absolute', left: 0, top: -size / 2, width: size, height: size }, animStyle]}
            >
              <Svg width={size} height={size}>
                <Defs>
                  <RadialGradient id={`sparkle${idx}`} cx="50%" cy="50%" r="50%">
                    <Stop offset="0%" stopColor="#FFFFD0" stopOpacity="1" />
                    <Stop offset="60%" stopColor="#FFFFD0" stopOpacity="0.3" />
                    <Stop offset="100%" stopColor="#FFFFD0" stopOpacity="0" />
                  </RadialGradient>
                </Defs>
                <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#sparkle${idx})`} />
              </Svg>
            </Animated.View>
          );
        }
        if (isSnowflake) {
          const size = 14;
          const c = size / 2;
          const r = size / 2 - 1;
          const d = r * Math.SQRT1_2; // r / sqrt(2) for 45° arms
          const stroke = "rgba(200, 235, 255, 0.55)";
          const sw = "1.1";
          return (
            <Animated.View
              key={idx}
              style={[{ position: 'absolute', left: 0, top: -size / 2, width: size, height: size }, animStyle]}
            >
              <Svg width={size} height={size}>
                <Line x1={c - r} y1={c} x2={c + r} y2={c} stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
                <Line x1={c} y1={c - r} x2={c} y2={c + r} stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
                <Line x1={c - d} y1={c - d} x2={c + d} y2={c + d} stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
                <Line x1={c + d} y1={c - d} x2={c - d} y2={c + d} stroke={stroke} strokeWidth={sw} strokeLinecap="round" />
              </Svg>
            </Animated.View>
          );
        }
        const isFairyStar = backdropKey === 'fairy' && idx < 5;
        if (isFairyStar) {
          const size = 10;
          const cx = size / 2;
          const cy = size / 2;
          const r = 1.2;
          const armLen = size / 2 - r - 0.5;
          return (
            <Animated.View
              key={`fairy-${idx}`}
              style={[
                {
                  position: 'absolute',
                  left: 0,
                  top: -size / 2,
                  width: size,
                  height: size,
                },
                animStyle,
              ]}
              pointerEvents="none"
            >
              <Svg width={size} height={size}>
                <Circle cx={cx} cy={cy} r={r} fill="rgba(210,140,185,1)" />
                <Circle cx={cx} cy={cy - armLen} r={r} fill="rgba(210,140,185,1)" />
                <Circle cx={cx + armLen} cy={cy} r={r} fill="rgba(210,140,185,1)" />
                <Circle cx={cx} cy={cy + armLen} r={r} fill="rgba(210,140,185,1)" />
                <Circle cx={cx - armLen} cy={cy} r={r} fill="rgba(210,140,185,1)" />
                <Line x1={cx} y1={cy} x2={cx} y2={cy - armLen} stroke="rgba(210,140,185,0.6)" strokeWidth="0.5" />
                <Line x1={cx} y1={cy} x2={cx + armLen} y2={cy} stroke="rgba(210,140,185,0.6)" strokeWidth="0.5" />
                <Line x1={cx} y1={cy} x2={cx} y2={cy + armLen} stroke="rgba(210,140,185,0.6)" strokeWidth="0.5" />
                <Line x1={cx} y1={cy} x2={cx - armLen} y2={cy} stroke="rgba(210,140,185,0.6)" strokeWidth="0.5" />
              </Svg>
            </Animated.View>
          );
        }
        return (
          <Animated.View
            key={idx}
            style={[staticStyle(idx), animStyle]}
          />
        );
      })}
    </View>
  );
};
