/**
 * BackdropParticleLayer Component
 *
 * Renders subtle ambient particle animations layered behind the Pokémon artwork.
 * Refactored to split particle type animations into separate sub-components.
 *
 * Z-order: above backdrop image, below Pokémon artwork.
 * Never intercepts touches (pointerEvents: 'none').
 */

import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { View, useWindowDimensions, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
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

const AnimatedPath = createAnimatedComponent(Path);

interface BackdropParticleLayerProps {
  backdropKey: string;
  heroHeight: number;
  enabled?: boolean;
  artworkUrl?: string | null;
}

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
  startY?: number;
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

const ARTWORK_SIZE = 280;
const MEGA_PHASE_R1 = [0, 400, 900, 1800, 2800, 3200, 3600];
const MEGA_PHASE_R2 = [1200, 1600, 2100, 3000, 4000, 4400, 4800];
const MEGA_PHASE_R3 = [800, 1200, 1700, 2600, 3600, 4000, 4400];

// ========== OUTER COMPONENT — ROUTES TO SUB-COMPONENTS ==========
export const BackdropParticleLayer: React.FC<BackdropParticleLayerProps> = ({
  backdropKey,
  heroHeight,
  enabled = true,
  artworkUrl = null,
}) => {
  if (!enabled || !PARTICLE_CONFIGS[backdropKey]) return null;

  switch (backdropKey) {
    case 'grass':
      return <GrassParticles heroHeight={heroHeight} />;
    case 'fire':
      return <FireParticles heroHeight={heroHeight} />;
    case 'water':
      return <WaterParticles heroHeight={heroHeight} />;
    case 'underwater':
      return <UnderwaterParticles heroHeight={heroHeight} />;
    case 'ice':
      return <IceParticles heroHeight={heroHeight} />;
    case 'electric':
      return <ElectricParticles heroHeight={heroHeight} />;
    case 'flying':
      return <FlyingParticles heroHeight={heroHeight} />;
    case 'bug':
      return <BugParticles heroHeight={heroHeight} />;
    case 'fairy':
      return <FairyParticles heroHeight={heroHeight} />;
    case 'mega':
      return <MegaParticles heroHeight={heroHeight} artworkUrl={artworkUrl} />;
    default:
      return null;
  }
};

// ========== GRASS PARTICLES SUB-COMPONENT ==========
const GrassParticles: React.FC<{ heroHeight: number }> = ({ heroHeight }) => {
  const { width: screenWidth } = useWindowDimensions();
  const ty0 = useSharedValue(0), tx0 = useSharedValue(0), op0 = useSharedValue(0), ro0 = useSharedValue(0), sc0 = useSharedValue(1);
  const ty1 = useSharedValue(0), tx1 = useSharedValue(0), op1 = useSharedValue(0), ro1 = useSharedValue(0), sc1 = useSharedValue(1);
  const ty2 = useSharedValue(0), tx2 = useSharedValue(0), op2 = useSharedValue(0), ro2 = useSharedValue(0), sc2 = useSharedValue(1);
  const ty3 = useSharedValue(0), tx3 = useSharedValue(0), op3 = useSharedValue(0), ro3 = useSharedValue(0), sc3 = useSharedValue(1);
  const ty4 = useSharedValue(0), tx4 = useSharedValue(0), op4 = useSharedValue(0), ro4 = useSharedValue(0), sc4 = useSharedValue(1);
  const ty5 = useSharedValue(0), tx5 = useSharedValue(0), op5 = useSharedValue(0), ro5 = useSharedValue(0), sc5 = useSharedValue(1);

  const particleData = useMemo<ParticleData[]>(() => {
    const data: ParticleData[] = [];
    for (let i = 0; i < 5; i++) {
      data.push({
        startX: screenWidth * (0.05 + (i / 4) * 0.9),
        duration: 5000 + i * 600,
        staggerDelay: i * 2500,
        driftAmp: 12 + i * 3,
        driftDir: i % 2 === 0 ? 1 : -1,
        swayHalfPeriod: Math.round((5000 + i * 600) / (2 * Math.round((5000 + i * 600) / 3000))),
      });
    }
    return data;
  }, [screenWidth]);

  const sharedValues = useMemo(() => [
    { ty: ty0, tx: tx0, op: op0, ro: ro0, sc: sc0 },
    { ty: ty1, tx: tx1, op: op1, ro: ro1, sc: sc1 },
    { ty: ty2, tx: tx2, op: op2, ro: ro2, sc: sc2 },
    { ty: ty3, tx: tx3, op: op3, ro: ro3, sc: sc3 },
    { ty: ty4, tx: tx4, op: op4, ro: ro4, sc: sc4 },
  ], [ty0, tx0, op0, ro0, sc0, ty1, tx1, op1, ro1, sc1, ty2, tx2, op2, ro2, sc2, ty3, tx3, op3, ro3, sc3, ty4, tx4, op4, ro4, sc4]);

  useEffect(() => {
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

    return () => {
      sharedValues.forEach((sv) => {
        cancelAnimation(sv.ty);
        cancelAnimation(sv.tx);
        cancelAnimation(sv.op);
        cancelAnimation(sv.ro);
      });
    };
  }, [particleData, sharedValues, heroHeight]);

  const styles = [
    useAnimatedStyle(() => ({ opacity: op0.value, transform: [{ translateX: tx0.value }, { translateY: ty0.value }, { rotate: `${ro0.value}deg` }, { scale: sc0.value }] })),
    useAnimatedStyle(() => ({ opacity: op1.value, transform: [{ translateX: tx1.value }, { translateY: ty1.value }, { rotate: `${ro1.value}deg` }, { scale: sc1.value }] })),
    useAnimatedStyle(() => ({ opacity: op2.value, transform: [{ translateX: tx2.value }, { translateY: ty2.value }, { rotate: `${ro2.value}deg` }, { scale: sc2.value }] })),
    useAnimatedStyle(() => ({ opacity: op3.value, transform: [{ translateX: tx3.value }, { translateY: ty3.value }, { rotate: `${ro3.value}deg` }, { scale: sc3.value }] })),
    useAnimatedStyle(() => ({ opacity: op4.value, transform: [{ translateX: tx4.value }, { translateY: ty4.value }, { rotate: `${ro4.value}deg` }, { scale: sc4.value }] })),
  ];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {styles.map((style, idx) => (
        <Animated.View
          key={idx}
          style={[
            {
              position: 'absolute',
              left: 0,
              top: -10,
              width: 10,
              height: 6,
              borderRadius: 3,
              backgroundColor: 'rgba(134, 190, 80, 0.65)',
            },
            style,
          ]}
        />
      ))}
    </View>
  );
};

// ========== FIRE PARTICLES SUB-COMPONENT ==========
const FireParticles: React.FC<{ heroHeight: number }> = ({ heroHeight }) => {
  const { width: screenWidth } = useWindowDimensions();
  const sharedVals = [
    useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(0),
    useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(0),
    useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(0),
    useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(0),
  ];
  const [ty0, tx0, op0, ro0, sc0, ty1, tx1, op1, ro1, sc1, ty2, tx2, op2, ro2, sc2, ty3, tx3, op3, ro3, sc3, ty4, tx4, op4, ro4, sc4] = sharedVals;
  const [ty5, tx5, op5, ro5, sc5] = [useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(1)];

  const fireParticleData = useMemo<ParticleData[]>(() => {
    const data: ParticleData[] = [];
    for (let i = 0; i < 3; i++) {
      data.push({
        startX: screenWidth * (0.05 + ((i * 2) / 5) * 0.9),
        duration: 3500 + i * 500,
        staggerDelay: i * 2000,
        driftAmp: 15 + i * 5,
        driftDir: i % 2 === 0 ? 1 : -1,
        swayHalfPeriod: Math.round((3500 + i * 500) / (2 * Math.round((3500 + i * 500) / 3000))),
      });
    }
    for (let i = 0; i < 3; i++) {
      data.push({
        startX: screenWidth * (0.05 + ((i * 2 + 1) / 5) * 0.9),
        duration: 6500 + i * 700,
        staggerDelay: 3000 + i * 2500,
        driftAmp: 10 + i * 4,
        driftDir: i % 2 === 0 ? 1 : -1,
        swayHalfPeriod: Math.round((6500 + i * 700) / (2 * Math.round((6500 + i * 700) / 3000))),
      });
    }
    return data;
  }, [screenWidth]);

  const sharedValues = useMemo(() => [
    { ty: ty0, tx: tx0, op: op0, ro: ro0, sc: sc0 },
    { ty: ty1, tx: tx1, op: op1, ro: ro1, sc: sc1 },
    { ty: ty2, tx: tx2, op: op2, ro: ro2, sc: sc2 },
    { ty: ty3, tx: tx3, op: op3, ro: ro3, sc: sc3 },
    { ty: ty4, tx: tx4, op: op4, ro: ro4, sc: sc4 },
    { ty: ty5, tx: tx5, op: op5, ro: ro5, sc: sc5 },
  ], [ty0, tx0, op0, ro0, sc0, ty1, tx1, op1, ro1, sc1, ty2, tx2, op2, ro2, sc2, ty3, tx3, op3, ro3, sc3, ty4, tx4, op4, ro4, sc4, ty5, tx5, op5, ro5, sc5]);

  useEffect(() => {
    fireParticleData.forEach((d, i) => {
      const sv = sharedValues[i];
      const { duration, staggerDelay, startX, driftAmp, driftDir, swayHalfPeriod } = d;
      const isEmber = i < 3;
      const startY = isEmber ? heroHeight * 0.65 : 0;
      const endY = isEmber ? 0 : heroHeight * 0.65;

      sv.ty.value = startY;
      sv.ty.value = withDelay(staggerDelay, withRepeat(withTiming(endY, { duration, easing: Easing.linear }), -1, false));

      sv.tx.value = startX;
      sv.tx.value = startX - driftAmp * driftDir;
      sv.tx.value = withDelay(staggerDelay, withRepeat(withTiming(startX + driftAmp * driftDir, { duration: swayHalfPeriod, easing: Easing.inOut(Easing.sin) }), -1, true));

      if (isEmber) {
        sv.op.value = withDelay(staggerDelay, withRepeat(withSequence(
          withTiming(0.7, { duration: 600, easing: Easing.out(Easing.quad) }),
          withTiming(0.7, { duration: duration - 1200 }),
          withTiming(0, { duration: 600, easing: Easing.in(Easing.quad) }),
        ), -1, false));
        sv.ro.value = withDelay(staggerDelay, withRepeat(withTiming(360, { duration, easing: Easing.linear }), -1, false));
      } else {
        sv.op.value = withDelay(staggerDelay, withRepeat(withSequence(
          withTiming(0.55, { duration: 800, easing: Easing.out(Easing.quad) }),
          withTiming(0.55, { duration: duration - 1600 }),
          withTiming(0, { duration: 800, easing: Easing.in(Easing.quad) }),
        ), -1, false));
        sv.ro.value = withDelay(staggerDelay, withRepeat(withTiming(180, { duration, easing: Easing.linear }), -1, false));
      }
    });

    return () => {
      sharedValues.forEach((sv) => {
        cancelAnimation(sv.ty); cancelAnimation(sv.tx); cancelAnimation(sv.op); cancelAnimation(sv.ro);
      });
    };
  }, [fireParticleData, sharedValues, heroHeight]);

  const styles = [
    useAnimatedStyle(() => ({ opacity: op0.value, transform: [{ translateX: tx0.value }, { translateY: ty0.value }, { rotate: `${ro0.value}deg` }, { scale: sc0.value }] })),
    useAnimatedStyle(() => ({ opacity: op1.value, transform: [{ translateX: tx1.value }, { translateY: ty1.value }, { rotate: `${ro1.value}deg` }, { scale: sc1.value }] })),
    useAnimatedStyle(() => ({ opacity: op2.value, transform: [{ translateX: tx2.value }, { translateY: ty2.value }, { rotate: `${ro2.value}deg` }, { scale: sc2.value }] })),
    useAnimatedStyle(() => ({ opacity: op3.value, transform: [{ translateX: tx3.value }, { translateY: ty3.value }, { rotate: `${ro3.value}deg` }, { scale: sc3.value }] })),
    useAnimatedStyle(() => ({ opacity: op4.value, transform: [{ translateX: tx4.value }, { translateY: ty4.value }, { rotate: `${ro4.value}deg` }, { scale: sc4.value }] })),
    useAnimatedStyle(() => ({ opacity: op5.value, transform: [{ translateX: tx5.value }, { translateY: ty5.value }, { rotate: `${ro5.value}deg` }, { scale: sc5.value }] })),
  ];

  const appearances = [
    { w: 5, h: 5, r: 2.5, c: 'rgba(255, 110, 20, 0.7)' },
    { w: 5, h: 5, r: 2.5, c: 'rgba(255, 110, 20, 0.7)' },
    { w: 5, h: 5, r: 2.5, c: 'rgba(255, 110, 20, 0.7)' },
    { w: 7, h: 4, r: 1, c: 'rgba(155, 135, 115, 0.55)' },
    { w: 7, h: 4, r: 1, c: 'rgba(155, 135, 115, 0.55)' },
    { w: 7, h: 4, r: 1, c: 'rgba(155, 135, 115, 0.55)' },
  ];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {styles.map((style, idx) => (
        <Animated.View key={idx} style={[{ position: 'absolute', left: 0, top: -10, width: appearances[idx]!.w, height: appearances[idx]!.h, borderRadius: appearances[idx]!.r, backgroundColor: appearances[idx]!.c }, style]} />
      ))}
    </View>
  );
};

// ========== WATER PARTICLES SUB-COMPONENT ==========
const WaterParticles: React.FC<{ heroHeight: number }> = ({ heroHeight }) => {
  const { width: screenWidth } = useWindowDimensions();
  const sharedVals = Array(24).fill(0).map(() => useSharedValue(0));
  const [ty0, tx0, op0, ro0, sc0, ty1, tx1, op1, ro1, sc1, ty2, tx2, op2, ro2, sc2, ty3, tx3, op3, ro3, sc3] = sharedVals;

  const waterParticleData = useMemo(() => {
    const pool = [
      { x: 0.22, y: 0.36 }, { x: 0.65, y: 0.50 }, { x: 0.88, y: 0.56 }, { x: 0.50, y: 0.48 },
      { x: 0.38, y: 0.42 }, { x: 0.78, y: 0.54 }, { x: 0.95, y: 0.60 }, { x: 0.60, y: 0.52 },
      { x: 0.28, y: 0.40 }, { x: 0.70, y: 0.56 }, { x: 0.85, y: 0.62 }, { x: 0.55, y: 0.46 },
      { x: 0.45, y: 0.44 }, { x: 0.82, y: 0.58 }, { x: 0.93, y: 0.64 }, { x: 0.72, y: 0.52 },
    ];
    const staggerDelays = [0, 800, 1600, 400];
    const data = [];
    for (let i = 0; i < 4; i++) {
      const positions = [...pool.slice(i * 4), ...pool.slice(0, i * 4)];
      data.push({ positions, staggerDelay: staggerDelays[i] });
    }
    return data;
  }, []);

  const sharedValues = useMemo(() => [
    { ty: ty0, tx: tx0, op: op0, ro: ro0, sc: sc0 },
    { ty: ty1, tx: tx1, op: op1, ro: ro1, sc: sc1 },
    { ty: ty2, tx: tx2, op: op2, ro: ro2, sc: sc2 },
    { ty: ty3, tx: tx3, op: op3, ro: ro3, sc: sc3 },
  ], [ty0, tx0, op0, ro0, sc0, ty1, tx1, op1, ro1, sc1, ty2, tx2, op2, ro2, sc2, ty3, tx3, op3, ro3, sc3]);

  useEffect(() => {
    waterParticleData.forEach((d, i) => {
      const sv = sharedValues[i];
      const { positions, staggerDelay } = d;
      const FADE_IN = 400, HOLD = 150, FADE_OUT = 400, GAP = 1800;
      const txSteps: any[] = [], tySteps: any[] = [], opSteps: any[] = [], scSteps: any[] = [];

      positions.forEach((pos) => {
        const px = screenWidth * pos.x, py = heroHeight * pos.y;
        txSteps.push(withTiming(px, { duration: 0 }), withTiming(px, { duration: FADE_IN + HOLD + FADE_OUT + GAP }));
        tySteps.push(withTiming(py, { duration: 0 }), withTiming(py, { duration: FADE_IN + HOLD + FADE_OUT + GAP }));
        opSteps.push(
          withTiming(0.23, { duration: FADE_IN, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.23, { duration: HOLD }),
          withTiming(0, { duration: FADE_OUT, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: GAP }),
        );
        scSteps.push(
          withTiming(1.0, { duration: FADE_IN, easing: Easing.inOut(Easing.sin) }),
          withTiming(1.0, { duration: HOLD }),
          withTiming(0.3, { duration: FADE_OUT + GAP, easing: Easing.inOut(Easing.sin) }),
        );
      });

      sv.ty.value = heroHeight * positions[0]!.y;
      sv.tx.value = screenWidth * positions[0]!.x;
      sv.op.value = 0;
      sv.ro.value = 0;
      sv.sc.value = 0.5;

      sv.tx.value = withDelay(staggerDelay, withRepeat(withSequence(...txSteps), -1, false));
      sv.ty.value = withDelay(staggerDelay, withRepeat(withSequence(...tySteps), -1, false));
      sv.op.value = withDelay(staggerDelay, withRepeat(withSequence(...opSteps), -1, false));
      sv.sc.value = withDelay(staggerDelay, withRepeat(withSequence(...scSteps), -1, false));
    });

    return () => {
      sharedValues.forEach((sv) => {
        cancelAnimation(sv.ty); cancelAnimation(sv.tx); cancelAnimation(sv.op); cancelAnimation(sv.sc);
      });
    };
  }, [waterParticleData, sharedValues, heroHeight, screenWidth]);

  const styles = [
    useAnimatedStyle(() => ({ opacity: op0.value, transform: [{ translateX: tx0.value }, { translateY: ty0.value }, { scale: sc0.value }] })),
    useAnimatedStyle(() => ({ opacity: op1.value, transform: [{ translateX: tx1.value }, { translateY: ty1.value }, { scale: sc1.value }] })),
    useAnimatedStyle(() => ({ opacity: op2.value, transform: [{ translateX: tx2.value }, { translateY: ty2.value }, { scale: sc2.value }] })),
    useAnimatedStyle(() => ({ opacity: op3.value, transform: [{ translateX: tx3.value }, { translateY: ty3.value }, { scale: sc3.value }] })),
  ];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {styles.map((style, idx) => (
        <Animated.View key={idx} style={[{ position: 'absolute', left: 0, top: -10, width: 20, height: 20 }, style]}>
          <Svg width={20} height={20}>
            <Defs>
              <RadialGradient id={`sparkle${idx}`} cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor="#FFFFD0" stopOpacity="1" />
                <Stop offset="60%" stopColor="#FFFFD0" stopOpacity="0.3" />
                <Stop offset="100%" stopColor="#FFFFD0" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Circle cx={10} cy={10} r={10} fill={`url(#sparkle${idx})`} />
          </Svg>
        </Animated.View>
      ))}
    </View>
  );
};

// Placeholder sub-components for other types (underwater, ice, electric, flying, bug, fairy, mega)
const UnderwaterParticles: React.FC<{ heroHeight: number }> = ({ heroHeight }) => {
  const { width: screenWidth } = useWindowDimensions();
  const sharedVals = Array(24).fill(0).map(() => useSharedValue(0));
  const [ty0, tx0, op0, ro0, sc0, ty1, tx1, op1, ro1, sc1, ty2, tx2, op2, ro2, sc2, ty3, tx3, op3, ro3, sc3, ty4, tx4, op4, ro4, sc4] = sharedVals;
  const ty5 = useSharedValue(0), tx5 = useSharedValue(0), op5 = useSharedValue(0), ro5 = useSharedValue(0), sc5 = useSharedValue(1);

  const bubbleData = useMemo(() => {
    const data = [];
    for (let i = 0; i < 6; i++) {
      data.push({
        startX: screenWidth * (0.05 + (i / 5) * 0.9),
        duration: 4000 + i * 600,
        staggerDelay: i * 1800,
        driftAmp: 10 + i * 4,
        driftDir: i % 2 === 0 ? 1 : -1,
        swayHalfPeriod: Math.round((4000 + i * 600) / (2 * Math.round((4000 + i * 600) / 3000))),
      });
    }
    return data;
  }, [screenWidth]);

  const sharedValues = useMemo(() => [
    { ty: ty0, tx: tx0, op: op0, ro: ro0 }, { ty: ty1, tx: tx1, op: op1, ro: ro1 }, { ty: ty2, tx: tx2, op: op2, ro: ro2 },
    { ty: ty3, tx: tx3, op: op3, ro: ro3 }, { ty: ty4, tx: tx4, op: op4, ro: ro4 }, { ty: ty5, tx: tx5, op: op5, ro: ro5 },
  ], [ty0, tx0, op0, ro0, ty1, tx1, op1, ro1, ty2, tx2, op2, ro2, ty3, tx3, op3, ro3, ty4, tx4, op4, ro4, ty5, tx5, op5, ro5]);

  useEffect(() => {
    bubbleData.forEach((d, i) => {
      const sv = sharedValues[i];
      const { duration, staggerDelay, startX, driftAmp, driftDir, swayHalfPeriod } = d;

      sv.ty.value = heroHeight * 0.65;
      sv.ty.value = withDelay(staggerDelay, withRepeat(withTiming(0, { duration, easing: Easing.linear }), -1, false));

      sv.tx.value = startX;
      sv.tx.value = startX - driftAmp * driftDir;
      sv.tx.value = withDelay(staggerDelay, withRepeat(withTiming(startX + driftAmp * driftDir, { duration: swayHalfPeriod, easing: Easing.inOut(Easing.sin) }), -1, true));

      sv.op.value = withDelay(staggerDelay, withRepeat(
        withSequence(
          withTiming(0.5, { duration: 700, easing: Easing.out(Easing.quad) }),
          withTiming(0.5, { duration: duration - 1400 }),
          withTiming(0, { duration: 700, easing: Easing.in(Easing.quad) }),
        ),
        -1, false,
      ));

      sv.ro.value = 0;
    });

    return () => {
      sharedValues.forEach((sv) => {
        cancelAnimation(sv.ty); cancelAnimation(sv.tx); cancelAnimation(sv.op);
      });
    };
  }, [bubbleData, sharedValues, heroHeight]);

  const styles = [
    useAnimatedStyle(() => ({ opacity: op0.value, transform: [{ translateX: tx0.value }, { translateY: ty0.value }] })),
    useAnimatedStyle(() => ({ opacity: op1.value, transform: [{ translateX: tx1.value }, { translateY: ty1.value }] })),
    useAnimatedStyle(() => ({ opacity: op2.value, transform: [{ translateX: tx2.value }, { translateY: ty2.value }] })),
    useAnimatedStyle(() => ({ opacity: op3.value, transform: [{ translateX: tx3.value }, { translateY: ty3.value }] })),
    useAnimatedStyle(() => ({ opacity: op4.value, transform: [{ translateX: tx4.value }, { translateY: ty4.value }] })),
    useAnimatedStyle(() => ({ opacity: op5.value, transform: [{ translateX: tx5.value }, { translateY: ty5.value }] })),
  ];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {styles.map((style, idx) => (
        <Animated.View key={idx} style={[{ position: 'absolute', left: 0, top: -10, width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(160, 220, 255, 0.5)' }, style]} />
      ))}
    </View>
  );
};

const IceParticles: React.FC<{ heroHeight: number }> = ({ heroHeight }) => {
  const { width: screenWidth } = useWindowDimensions();
  const sharedVals = Array(24).fill(0).map(() => useSharedValue(0));
  const [ty0, tx0, op0, ro0, sc0, ty1, tx1, op1, ro1, sc1, ty2, tx2, op2, ro2, sc2, ty3, tx3, op3, ro3, sc3, ty4, tx4, op4, ro4, sc4] = sharedVals;
  const ty5 = useSharedValue(0), tx5 = useSharedValue(0), op5 = useSharedValue(0), ro5 = useSharedValue(0), sc5 = useSharedValue(1);

  const snowData = useMemo(() => {
    const data = [];
    for (let i = 0; i < 6; i++) {
      const duration = 5500 + i * 400;
      data.push({
        startX: screenWidth * (0.05 + (i / 5) * 0.9),
        duration,
        staggerDelay: i * 1500,
        driftAmp: 8 + i * 2,
        driftDir: i % 2 === 0 ? 1 : -1,
        swayHalfPeriod: Math.round(duration / (2 * Math.round(duration / 3800))),
      });
    }
    return data;
  }, [screenWidth]);

  const sharedValues = useMemo(() => [
    { ty: ty0, tx: tx0, op: op0, ro: ro0 }, { ty: ty1, tx: tx1, op: op1, ro: ro1 }, { ty: ty2, tx: tx2, op: op2, ro: ro2 },
    { ty: ty3, tx: tx3, op: op3, ro: ro3 }, { ty: ty4, tx: tx4, op: op4, ro: ro4 }, { ty: ty5, tx: tx5, op: op5, ro: ro5 },
  ], [ty0, tx0, op0, ro0, ty1, tx1, op1, ro1, ty2, tx2, op2, ro2, ty3, tx3, op3, ro3, ty4, tx4, op4, ro4, ty5, tx5, op5, ro5]);

  useEffect(() => {
    snowData.forEach((d, i) => {
      const sv = sharedValues[i];
      const { duration, staggerDelay, startX, driftAmp, driftDir, swayHalfPeriod } = d;

      sv.ty.value = 0;
      sv.ty.value = withDelay(staggerDelay, withRepeat(withTiming(heroHeight * 0.65, { duration, easing: Easing.linear }), -1, false));

      sv.tx.value = startX;
      sv.tx.value = startX - driftAmp * driftDir;
      sv.tx.value = withDelay(staggerDelay, withRepeat(withTiming(startX + driftAmp * driftDir, { duration: swayHalfPeriod, easing: Easing.inOut(Easing.sin) }), -1, true));

      sv.op.value = withDelay(staggerDelay, withRepeat(
        withSequence(
          withTiming(0.65, { duration: 800, easing: Easing.out(Easing.quad) }),
          withTiming(0.65, { duration: duration - 1600 }),
          withTiming(0, { duration: 800, easing: Easing.in(Easing.quad) }),
        ),
        -1, false,
      ));

      sv.ro.value = withDelay(staggerDelay, withRepeat(withTiming(360, { duration, easing: Easing.linear }), -1, false));
    });

    return () => {
      sharedValues.forEach((sv) => {
        cancelAnimation(sv.ty); cancelAnimation(sv.tx); cancelAnimation(sv.op); cancelAnimation(sv.ro);
      });
    };
  }, [snowData, sharedValues, heroHeight]);

  const styles = [
    useAnimatedStyle(() => ({ opacity: op0.value, transform: [{ translateX: tx0.value }, { translateY: ty0.value }, { rotate: `${ro0.value}deg` }] })),
    useAnimatedStyle(() => ({ opacity: op1.value, transform: [{ translateX: tx1.value }, { translateY: ty1.value }, { rotate: `${ro1.value}deg` }] })),
    useAnimatedStyle(() => ({ opacity: op2.value, transform: [{ translateX: tx2.value }, { translateY: ty2.value }, { rotate: `${ro2.value}deg` }] })),
    useAnimatedStyle(() => ({ opacity: op3.value, transform: [{ translateX: tx3.value }, { translateY: ty3.value }, { rotate: `${ro3.value}deg` }] })),
    useAnimatedStyle(() => ({ opacity: op4.value, transform: [{ translateX: tx4.value }, { translateY: ty4.value }, { rotate: `${ro4.value}deg` }] })),
    useAnimatedStyle(() => ({ opacity: op5.value, transform: [{ translateX: tx5.value }, { translateY: ty5.value }, { rotate: `${ro5.value}deg` }] })),
  ];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {styles.map((style, idx) => {
        const size = 14, c = size / 2, r = size / 2 - 1, d = r * Math.SQRT1_2;
        return (
          <Animated.View key={idx} style={[{ position: 'absolute', left: 0, top: -size / 2, width: size, height: size }, style]}>
            <Svg width={size} height={size}>
              <Line x1={c - r} y1={c} x2={c + r} y2={c} stroke="rgba(200, 235, 255, 0.55)" strokeWidth="1.1" strokeLinecap="round" />
              <Line x1={c} y1={c - r} x2={c} y2={c + r} stroke="rgba(200, 235, 255, 0.55)" strokeWidth="1.1" strokeLinecap="round" />
              <Line x1={c - d} y1={c - d} x2={c + d} y2={c + d} stroke="rgba(200, 235, 255, 0.55)" strokeWidth="1.1" strokeLinecap="round" />
              <Line x1={c + d} y1={c - d} x2={c - d} y2={c + d} stroke="rgba(200, 235, 255, 0.55)" strokeWidth="1.1" strokeLinecap="round" />
            </Svg>
          </Animated.View>
        );
      })}
    </View>
  );
};

const ElectricParticles: React.FC<{ heroHeight: number }> = () => null;
const FlyingParticles: React.FC<{ heroHeight: number }> = () => null;
const BugParticles: React.FC<{ heroHeight: number }> = () => null;
const FairyParticles: React.FC<{ heroHeight: number }> = () => null;
const MegaParticles: React.FC<{ heroHeight: number; artworkUrl?: string | null }> = () => null;
