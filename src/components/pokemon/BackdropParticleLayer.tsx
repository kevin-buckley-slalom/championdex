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

// ========== ELECTRIC PARTICLES SUB-COMPONENT ==========
const ElectricParticles: React.FC<{ heroHeight: number }> = ({ heroHeight }) => {
  const { width: screenWidth } = useWindowDimensions();
  const ty0 = useSharedValue(0), tx0 = useSharedValue(0), op0 = useSharedValue(0), ro0 = useSharedValue(0), sc0 = useSharedValue(1);
  const ty1 = useSharedValue(0), tx1 = useSharedValue(0), op1 = useSharedValue(0), ro1 = useSharedValue(0), sc1 = useSharedValue(1);
  const ty2 = useSharedValue(0), tx2 = useSharedValue(0), op2 = useSharedValue(0), ro2 = useSharedValue(0), sc2 = useSharedValue(1);

  const pathIndices = useRef<number[]>([0, 0, 0]);
  const boltDebounce0 = useSharedValue(false);
  const boltDebounce1 = useSharedValue(false);
  const boltDebounce2 = useSharedValue(false);

  const generateRandomLightningPath = useCallback((w: number, boltHeight: number): string => {
    const NUM_SEGMENTS = 7;
    const points: { x: number; y: number }[] = [];
    points.push({ x: w * 0.5, y: 0 });
    const yRaw: number[] = [];
    for (let i = 0; i < NUM_SEGMENTS; i++) yRaw.push(Math.random());
    const ySum = yRaw.reduce((a, b) => a + b, 0);
    const yNormalized = yRaw.map(v => (v / ySum) * boltHeight);
    let cumulativeY = 0, prevXFrac = 0.5;
    for (let i = 0; i < NUM_SEGMENTS; i++) {
      cumulativeY += yNormalized[i];
      let xFrac: number;
      if (Math.random() < 0.25) {
        xFrac = Math.max(0.0, Math.min(1.0, prevXFrac + (Math.random() - 0.5) * 0.3));
      } else {
        const isLeft = i % 2 === 0;
        xFrac = isLeft ? Math.random() * 0.18 + 0.01 : Math.random() * 0.18 + 0.82;
      }
      points.push({ x: w * xFrac, y: cumulativeY });
      prevXFrac = xFrac;
    }
    const finalXFrac = Math.random() * 0.8 + 0.1;
    points.push({ x: w * finalXFrac, y: boltHeight });
    return points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');
  }, []);

  const lightningBoltData = useMemo(() => {
    const w = 24, boltHeight = Math.round(heroHeight * 0.80), PATHS_PER_BOLT = 12;
    return [
      { xPositions: [0.08, 0.22, 0.14, 0.28, 0.10, 0.25], gapDuration: 1200, staggerDelay: 0, paths: Array.from({ length: PATHS_PER_BOLT }, () => generateRandomLightningPath(w, boltHeight)) },
      { xPositions: [0.45, 0.58, 0.50, 0.62, 0.47, 0.55], gapDuration: 3300, staggerDelay: 2200, paths: Array.from({ length: PATHS_PER_BOLT }, () => generateRandomLightningPath(w, boltHeight)) },
      { xPositions: [0.78, 0.88, 0.82, 0.92, 0.75, 0.85], gapDuration: 2000, staggerDelay: 1100, paths: Array.from({ length: PATHS_PER_BOLT }, () => generateRandomLightningPath(w, boltHeight)) },
    ];
  }, [heroHeight, generateRandomLightningPath]);

  const sharedValues = useMemo(() => [
    { ty: ty0, tx: tx0, op: op0, ro: ro0, sc: sc0 },
    { ty: ty1, tx: tx1, op: op1, ro: ro1, sc: sc1 },
    { ty: ty2, tx: tx2, op: op2, ro: ro2, sc: sc2 },
  ], [ty0, tx0, op0, ro0, sc0, ty1, tx1, op1, ro1, sc1, ty2, tx2, op2, ro2, sc2]);

  useEffect(() => {
    pathIndices.current = [0, 0, 0];
    boltDebounce0.value = false;
    boltDebounce1.value = false;
    boltDebounce2.value = false;
  }, []);

  useEffect(() => {
    lightningBoltData.forEach((boltConfig, boltIdx) => {
      const sv = sharedValues[boltIdx];
      const { xPositions, gapDuration, staggerDelay } = boltConfig;
      const FLASH_IN = 40, FLASH_DROP = 480, DECAY = 700, PEAK_OP = 0.55, DIM_OP = 0.20;
      const totalPerPosition = FLASH_IN + FLASH_DROP + DECAY + gapDuration;
      const txSteps: any[] = [], opSteps: any[] = [];
      xPositions.forEach((xFrac) => {
        const posX = screenWidth * xFrac;
        txSteps.push(withTiming(posX, { duration: 0 }), withTiming(posX, { duration: totalPerPosition }));
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

    return () => {
      sharedValues.forEach((sv) => { cancelAnimation(sv.ty); cancelAnimation(sv.tx); cancelAnimation(sv.op); });
    };
  }, [lightningBoltData, sharedValues, screenWidth]);

  const incrementPathIndex = useCallback((boltIdx: number) => {
    pathIndices.current[boltIdx] = (pathIndices.current[boltIdx] + 1) % 12;
  }, []);

  const incrementPathIndex0 = useCallback(() => incrementPathIndex(0), [incrementPathIndex]);
  const incrementPathIndex1 = useCallback(() => incrementPathIndex(1), [incrementPathIndex]);
  const incrementPathIndex2 = useCallback(() => incrementPathIndex(2), [incrementPathIndex]);

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

  const style0 = useAnimatedStyle(() => ({ opacity: op0.value, transform: [{ translateX: tx0.value }, { translateY: ty0.value }] }));
  const style1 = useAnimatedStyle(() => ({ opacity: op1.value, transform: [{ translateX: tx1.value }, { translateY: ty1.value }] }));
  const style2 = useAnimatedStyle(() => ({ opacity: op2.value, transform: [{ translateX: tx2.value }, { translateY: ty2.value }] }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {[0, 1, 2].map((idx) => {
        const boltHeight = Math.round(heroHeight * 0.8), w = 24, boltConfig = lightningBoltData[idx];
        const currentPath = boltConfig?.paths?.[pathIndices.current[idx] % (boltConfig?.paths?.length || 1)] || '';
        const animStyle = [style0, style1, style2][idx];
        return (
          <Animated.View key={idx} style={[{ position: 'absolute', left: 0, top: 0, width: w, height: boltHeight }, animStyle]}>
            <Svg width={w} height={boltHeight}>
              <Defs>
                <Filter id={`glow-${idx}`}>
                  <FeGaussianBlur in="SourceGraphic" stdDeviation="2.5" />
                </Filter>
              </Defs>
              <Path d={currentPath} stroke="rgba(255, 220, 0, 0.25)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" filter={`url(#glow-${idx})`} />
              <Path d={currentPath} stroke="rgba(180, 130, 0, 0.35)" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <Path d={currentPath} stroke="rgba(255, 225, 0, 0.45)" strokeWidth="4.0" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <Path d={currentPath} stroke="rgba(255, 252, 200, 0.90)" strokeWidth="2.0" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </Svg>
          </Animated.View>
        );
      })}
    </View>
  );
};

// ========== FLYING PARTICLES SUB-COMPONENT ==========
const FlyingParticles: React.FC<{ heroHeight: number }> = ({ heroHeight }) => {
  const { width: screenWidth } = useWindowDimensions();
  const ty0 = useSharedValue(0), tx0 = useSharedValue(0), op0 = useSharedValue(0), ro0 = useSharedValue(0), sc0 = useSharedValue(1);
  const ty1 = useSharedValue(0), tx1 = useSharedValue(0), op1 = useSharedValue(0), ro1 = useSharedValue(0), sc1 = useSharedValue(1);
  const ty2 = useSharedValue(0), tx2 = useSharedValue(0), op2 = useSharedValue(0), ro2 = useSharedValue(0), sc2 = useSharedValue(1);
  const ty3 = useSharedValue(0), tx3 = useSharedValue(0), op3 = useSharedValue(0), ro3 = useSharedValue(0), sc3 = useSharedValue(1);

  const dash0 = useSharedValue(0), dash1 = useSharedValue(0), dash2 = useSharedValue(0), dash3 = useSharedValue(0);

  const flyingParticleData = useMemo(() => [
    { startX: -120, startY: heroHeight * 0.08, duration: 4000, staggerDelay: 0, particleWidth: 110 },
    { startX: -120, startY: heroHeight * 0.24, duration: 4800, staggerDelay: 1200, particleWidth: 85 },
    { startX: -120, startY: heroHeight * 0.55, duration: 4200, staggerDelay: 2400, particleWidth: 100 },
    { startX: -120, startY: heroHeight * 0.78, duration: 4600, staggerDelay: 3600, particleWidth: 90 },
  ], [heroHeight]);

  const sharedValues = useMemo(() => [
    { ty: ty0, tx: tx0, op: op0, ro: ro0, sc: sc0 },
    { ty: ty1, tx: tx1, op: op1, ro: ro1, sc: sc1 },
    { ty: ty2, tx: tx2, op: op2, ro: ro2, sc: sc2 },
    { ty: ty3, tx: tx3, op: op3, ro: ro3, sc: sc3 },
  ], [ty0, tx0, op0, ro0, sc0, ty1, tx1, op1, ro1, sc1, ty2, tx2, op2, ro2, sc2, ty3, tx3, op3, ro3, sc3]);

  const dashProps0 = useAnimatedProps(() => ({ strokeDashoffset: dash0.value } as any));
  const dashProps1 = useAnimatedProps(() => ({ strokeDashoffset: dash1.value } as any));
  const dashProps2 = useAnimatedProps(() => ({ strokeDashoffset: dash2.value } as any));
  const dashProps3 = useAnimatedProps(() => ({ strokeDashoffset: dash3.value } as any));

  useEffect(() => {
    flyingParticleData.forEach((particle, i) => {
      const sv = sharedValues[i];
      const { startY, duration, staggerDelay } = particle;
      const dashSv = [dash0, dash1, dash2, dash3][i];
      if (!dashSv) return;

      sv.ty.value = startY;
      sv.tx.value = 0;
      sv.op.value = 0;

      const totalPathLength = screenWidth + 240, streakLength = 100, endDashOffset = totalPathLength + streakLength;
      dashSv.value = 0;
      dashSv.value = withDelay(staggerDelay, withRepeat(withTiming(endDashOffset, { duration, easing: Easing.linear }), -1, false));

      const holdDuration = duration - 1200;
      sv.op.value = withDelay(staggerDelay, withRepeat(
        withSequence(
          withTiming(0.70, { duration: 600, easing: Easing.out(Easing.quad) }),
          withTiming(0.70, { duration: holdDuration }),
          withTiming(0, { duration: 600, easing: Easing.in(Easing.quad) }),
        ),
        -1, false,
      ));

      sv.ro.value = 0;
      sv.sc.value = 1;
    });

    return () => {
      sharedValues.forEach((sv) => { cancelAnimation(sv.ty); cancelAnimation(sv.op); });
      [dash0, dash1, dash2, dash3].forEach((d) => cancelAnimation(d));
    };
  }, [flyingParticleData, sharedValues, screenWidth]);

  const opacityStyle0 = useAnimatedStyle(() => ({ opacity: op0.value }));
  const opacityStyle1 = useAnimatedStyle(() => ({ opacity: op1.value }));
  const opacityStyle2 = useAnimatedStyle(() => ({ opacity: op2.value }));
  const opacityStyle3 = useAnimatedStyle(() => ({ opacity: op3.value }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {[0, 1, 2, 3].map((idx) => {
        const particle = flyingParticleData[idx];
        const steps = 60, amplitude = 7 + idx * 3, frequency = 1.5, arcDir = idx % 2 === 0 ? 1 : -1;
        const containerHeight = amplitude * 2 + 20, svgWidth = screenWidth + 240;
        const points = Array.from({ length: steps + 1 }, (_, i) => {
          const x = (i / steps) * svgWidth - 120;
          const y = containerHeight / 2 + arcDir * amplitude * Math.sin((i / steps) * Math.PI * 2 * frequency);
          return `${x},${y}`;
        });
        const pathD = `M ${points.join(' L ')}`;
        const dashProps = [dashProps0, dashProps1, dashProps2, dashProps3][idx];
        const opacityStyle = [opacityStyle0, opacityStyle1, opacityStyle2, opacityStyle3][idx];
        const totalPathLength = screenWidth + 240, streakLength = 100;
        return (
          <View key={idx} pointerEvents="none" style={{ position: 'absolute', left: -120, top: particle.startY - containerHeight / 2, width: svgWidth, height: containerHeight }}>
            <Animated.View style={[opacityStyle]} pointerEvents="none">
              <Svg width={svgWidth} height={containerHeight}>
                <Defs>
                  <Filter id={`wind-blur-${idx}`}>
                    <FeGaussianBlur in="SourceGraphic" stdDeviation="3" />
                  </Filter>
                  <Filter id={`wind-blur-soft-${idx}`}>
                    <FeGaussianBlur in="SourceGraphic" stdDeviation="6" />
                  </Filter>
                </Defs>
                <AnimatedPath d={pathD} stroke="rgba(200, 225, 250, 0.25)" strokeWidth="8" strokeLinecap="round" fill="none" strokeDasharray={[streakLength, totalPathLength + streakLength]} animatedProps={dashProps} filter={`url(#wind-blur-soft-${idx})`} />
                <AnimatedPath d={pathD} stroke="rgba(200, 225, 250, 0.70)" strokeWidth="2" strokeLinecap="round" fill="none" strokeDasharray={[streakLength, totalPathLength + streakLength]} animatedProps={dashProps} filter={`url(#wind-blur-${idx})`} />
              </Svg>
            </Animated.View>
          </View>
        );
      })}
    </View>
  );
};

// ========== BUG PARTICLES SUB-COMPONENT ==========
const BugParticles: React.FC<{ heroHeight: number }> = ({ heroHeight }) => {
  const { width: screenWidth } = useWindowDimensions();
  const sharedVals = Array(24).fill(0).map(() => useSharedValue(0));
  const [ty0, tx0, op0, ro0, sc0, ty1, tx1, op1, ro1, sc1, ty2, tx2, op2, ro2, sc2, ty3, tx3, op3, ro3, sc3, ty4, tx4, op4, ro4] = sharedVals;
  const [sc4, ty5, tx5, op5, ro5, sc5] = [useSharedValue(1), useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(1)];

  const bugParticleData = useMemo(() => [
    { startX: screenWidth * 0.20, startY: heroHeight * 0.15, duration: 4800, staggerDelay: 0, driftAmp: screenWidth * 0.42, driftDir: 1, swayHalfPeriod: 5500 },
    { startX: screenWidth * 0.78, startY: heroHeight * 0.55, duration: 6200, staggerDelay: 1100, driftAmp: screenWidth * 0.38, driftDir: -1, swayHalfPeriod: 7200 },
    { startX: screenWidth * 0.45, startY: heroHeight * 0.72, duration: 5500, staggerDelay: 2800, driftAmp: screenWidth * 0.44, driftDir: 1, swayHalfPeriod: 6300 },
    { startX: screenWidth * 0.85, startY: heroHeight * 0.24, duration: 7800, staggerDelay: 700, driftAmp: screenWidth * 0.40, driftDir: -1, swayHalfPeriod: 8800 },
    { startX: screenWidth * 0.12, startY: heroHeight * 0.60, duration: 5000, staggerDelay: 3500, driftAmp: screenWidth * 0.36, driftDir: 1, swayHalfPeriod: 6900 },
    { startX: screenWidth * 0.60, startY: heroHeight * 0.40, duration: 6800, staggerDelay: 1900, driftAmp: screenWidth * 0.46, driftDir: -1, swayHalfPeriod: 8100 },
  ], [screenWidth, heroHeight]);

  const sharedValues = useMemo(() => [
    { ty: ty0, tx: tx0, op: op0 }, { ty: ty1, tx: tx1, op: op1 }, { ty: ty2, tx: tx2, op: op2 },
    { ty: ty3, tx: tx3, op: op3 }, { ty: ty4, tx: tx4, op: op4 }, { ty: ty5, tx: tx5, op: op5 },
  ], [ty0, tx0, op0, ty1, tx1, op1, ty2, tx2, op2, ty3, tx3, op3, ty4, tx4, op4, ty5, tx5, op5]);

  useEffect(() => {
    bugParticleData.forEach((d, i) => {
      const sv = sharedValues[i];
      const { startX, startY, duration, staggerDelay, driftAmp, driftDir, swayHalfPeriod } = d;
      const startYVal = startY ?? heroHeight * 0.35;
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
          withTiming(0, { duration: duration * 0.9 }),
        ),
        -1, false,
      ));
    });

    return () => {
      sharedValues.forEach((sv) => { cancelAnimation(sv.ty); cancelAnimation(sv.tx); cancelAnimation(sv.op); });
    };
  }, [bugParticleData, sharedValues, heroHeight]);

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
        <Animated.View key={idx} style={[{ position: 'absolute', left: 0, top: -10, width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(168, 140, 100, 0.72)' }, style]} />
      ))}
    </View>
  );
};

// ========== FAIRY PARTICLES SUB-COMPONENT ==========
const FairyParticles: React.FC<{ heroHeight: number }> = ({ heroHeight }) => {
  const { width: screenWidth } = useWindowDimensions();
  const ty0 = useSharedValue(0), tx0 = useSharedValue(0), op0 = useSharedValue(0), ro0 = useSharedValue(0), sc0 = useSharedValue(1);
  const ty1 = useSharedValue(0), tx1 = useSharedValue(0), op1 = useSharedValue(0), ro1 = useSharedValue(0), sc1 = useSharedValue(1);
  const ty2 = useSharedValue(0), tx2 = useSharedValue(0), op2 = useSharedValue(0), ro2 = useSharedValue(0), sc2 = useSharedValue(1);
  const ty3 = useSharedValue(0), tx3 = useSharedValue(0), op3 = useSharedValue(0), ro3 = useSharedValue(0), sc3 = useSharedValue(1);
  const ty4 = useSharedValue(0), tx4 = useSharedValue(0), op4 = useSharedValue(0), ro4 = useSharedValue(0), sc4 = useSharedValue(1);

  const fairyParticleData = useMemo(() => [0, 1, 2, 3, 4].map((i) => ({
    startX: screenWidth * (0.10 + i * 0.20),
    startY: heroHeight * (0.15 + (i % 3) * 0.25),
    duration: 2200 + i * 300,
    staggerDelay: i * 450,
    driftAmp: 0,
    driftDir: 1,
    swayHalfPeriod: 3500,
  })), [screenWidth, heroHeight]);

  const sharedValues = useMemo(() => [
    { ty: ty0, tx: tx0, op: op0, ro: ro0, sc: sc0 },
    { ty: ty1, tx: tx1, op: op1, ro: ro1, sc: sc1 },
    { ty: ty2, tx: tx2, op: op2, ro: ro2, sc: sc2 },
    { ty: ty3, tx: tx3, op: op3, ro: ro3, sc: sc3 },
    { ty: ty4, tx: tx4, op: op4, ro: ro4, sc: sc4 },
  ], [ty0, tx0, op0, ro0, sc0, ty1, tx1, op1, ro1, sc1, ty2, tx2, op2, ro2, sc2, ty3, tx3, op3, ro3, sc3, ty4, tx4, op4, ro4, sc4]);

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

  useEffect(() => {
    fairyParticleData.forEach((d, i) => {
      const sv = sharedValues[i];
      sv.ro.value = 0;
      sv.sc.value = 1;
      sv.tx.value = 0;
      sv.ty.value = 0;
      sv.op.value = 0;
      sv.op.value = withDelay(d.staggerDelay, withRepeat(
        withSequence(
          withTiming(1.0, { duration: 600, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.0, { duration: 600, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.0, { duration: d.duration - 1200 }),
        ),
        -1, false,
      ));
    });

    return () => {
      sharedValues.forEach((sv) => {
        cancelAnimation(sv.op);
      });
    };
  }, [fairyParticleData, sharedValues]);

  useAnimatedReaction(() => op0.value, (v, prev) => {
    if (v < 0.02 && (prev ?? 1) >= 0.02) runOnJS(fairyTeleport0)();
  }, []);

  useAnimatedReaction(() => op1.value, (v, prev) => {
    if (v < 0.02 && (prev ?? 1) >= 0.02) runOnJS(fairyTeleport1)();
  }, []);

  useAnimatedReaction(() => op2.value, (v, prev) => {
    if (v < 0.02 && (prev ?? 1) >= 0.02) runOnJS(fairyTeleport2)();
  }, []);

  useAnimatedReaction(() => op3.value, (v, prev) => {
    if (v < 0.02 && (prev ?? 1) >= 0.02) runOnJS(fairyTeleport3)();
  }, []);

  useAnimatedReaction(() => op4.value, (v, prev) => {
    if (v < 0.02 && (prev ?? 1) >= 0.02) runOnJS(fairyTeleport4)();
  }, []);

  const styles = [
    useAnimatedStyle(() => ({ opacity: op0.value, transform: [{ translateX: tx0.value }, { translateY: ty0.value }, { scale: sc0.value }] })),
    useAnimatedStyle(() => ({ opacity: op1.value, transform: [{ translateX: tx1.value }, { translateY: ty1.value }, { scale: sc1.value }] })),
    useAnimatedStyle(() => ({ opacity: op2.value, transform: [{ translateX: tx2.value }, { translateY: ty2.value }, { scale: sc2.value }] })),
    useAnimatedStyle(() => ({ opacity: op3.value, transform: [{ translateX: tx3.value }, { translateY: ty3.value }, { scale: sc3.value }] })),
    useAnimatedStyle(() => ({ opacity: op4.value, transform: [{ translateX: tx4.value }, { translateY: ty4.value }, { scale: sc4.value }] })),
  ];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {fairyParticleData.map((d, i) => {
        const animStyle = styles[i];
        const size = 13, cx = size / 2, cy = size / 2;
        return (
          <Animated.View key={`fairy-${i}`} style={[{ position: 'absolute', left: d.startX - size / 2, top: (d.startY ?? 0) - size / 2, width: size, height: size }, animStyle]} pointerEvents="none">
            <Svg width={size} height={size}>
              <Defs>
                <RadialGradient id={`fairyGlow${i}`} cx="50%" cy="50%" r="50%">
                  <Stop offset="0%" stopColor="rgba(255,255,255,1)" stopOpacity="1" />
                  <Stop offset="40%" stopColor="rgba(255,210,235,1)" stopOpacity="0.8" />
                  <Stop offset="100%" stopColor="rgba(255,180,220,0)" stopOpacity="0" />
                </RadialGradient>
              </Defs>
              <Circle cx={cx} cy={cy} r={cx} fill={`url(#fairyGlow${i})`} />
            </Svg>
          </Animated.View>
        );
      })}
    </View>
  );
};

// ========== MEGA PARTICLES SUB-COMPONENT ==========
const MegaParticles: React.FC<{ heroHeight: number; artworkUrl?: string | null }> = ({ heroHeight, artworkUrl }) => {
  const { width: screenWidth } = useWindowDimensions();
  const megaGradRot = useSharedValue(0);
  const megaAOp0 = useSharedValue(0), megaAOp1 = useSharedValue(0), megaAOp2 = useSharedValue(0);
  const megaAOp3 = useSharedValue(0), megaAOp4 = useSharedValue(0), megaAOp5 = useSharedValue(0);

  useEffect(() => {
    megaGradRot.value = 0;
    megaGradRot.value = withTiming(1, { duration: 800, easing: Easing.inOut(Easing.sin) });

    megaAOp0.value = withDelay(0, withRepeat(withSequence(
      withTiming(0.92, { duration: 5000 * 0.35, easing: Easing.inOut(Easing.sin) }),
      withTiming(0.92, { duration: 5000 * 0.10 }),
      withTiming(0.0, { duration: 5000 * 0.25, easing: Easing.inOut(Easing.sin) }),
    ), -1, false));

    megaAOp1.value = withDelay(800, withRepeat(withSequence(
      withTiming(0.92, { duration: 6500 * 0.35, easing: Easing.inOut(Easing.sin) }),
      withTiming(0.92, { duration: 6500 * 0.10 }),
      withTiming(0.0, { duration: 6500 * 0.25, easing: Easing.inOut(Easing.sin) }),
    ), -1, false));

    megaAOp2.value = withDelay(1600, withRepeat(withSequence(
      withTiming(0.92, { duration: 4200 * 0.35, easing: Easing.inOut(Easing.sin) }),
      withTiming(0.92, { duration: 4200 * 0.10 }),
      withTiming(0.0, { duration: 4200 * 0.25, easing: Easing.inOut(Easing.sin) }),
    ), -1, false));

    megaAOp3.value = withDelay(400, withRepeat(withSequence(
      withTiming(0.92, { duration: 7300 * 0.35, easing: Easing.inOut(Easing.sin) }),
      withTiming(0.92, { duration: 7300 * 0.10 }),
      withTiming(0.0, { duration: 7300 * 0.25, easing: Easing.inOut(Easing.sin) }),
    ), -1, false));

    megaAOp4.value = withDelay(1200, withRepeat(withSequence(
      withTiming(0.92, { duration: 5800 * 0.35, easing: Easing.inOut(Easing.sin) }),
      withTiming(0.92, { duration: 5800 * 0.10 }),
      withTiming(0.0, { duration: 5800 * 0.25, easing: Easing.inOut(Easing.sin) }),
    ), -1, false));

    megaAOp5.value = withDelay(2000, withRepeat(withSequence(
      withTiming(0.92, { duration: 6100 * 0.35, easing: Easing.inOut(Easing.sin) }),
      withTiming(0.92, { duration: 6100 * 0.10 }),
      withTiming(0.0, { duration: 6100 * 0.25, easing: Easing.inOut(Easing.sin) }),
    ), -1, false));

    return () => {
      [megaGradRot, megaAOp0, megaAOp1, megaAOp2, megaAOp3, megaAOp4, megaAOp5].forEach((v) => cancelAnimation(v));
      megaGradRot.value = 0;
    };
  }, []);

  const megaGradRotStyle = useAnimatedStyle(() => ({ opacity: megaGradRot.value }));
  const megaAStyle0 = useAnimatedStyle(() => ({ opacity: megaAOp0.value }));
  const megaAStyle1 = useAnimatedStyle(() => ({ opacity: megaAOp1.value }));
  const megaAStyle2 = useAnimatedStyle(() => ({ opacity: megaAOp2.value }));
  const megaAStyle3 = useAnimatedStyle(() => ({ opacity: megaAOp3.value }));
  const megaAStyle4 = useAnimatedStyle(() => ({ opacity: megaAOp4.value }));
  const megaAStyle5 = useAnimatedStyle(() => ({ opacity: megaAOp5.value }));

  if (!artworkUrl) return null;

  const SVG_SIZE = ARTWORK_SIZE * 2.0, cx = SVG_SIZE / 2, cy = SVG_SIZE / 2, svgLeft = (screenWidth - SVG_SIZE) / 2;
  const svgPositionStyle = { position: 'absolute' as const, left: svgLeft, top: '50%' as const, marginTop: -SVG_SIZE / 2 };
  const shadowStyle = { position: 'absolute' as const, width: ARTWORK_SIZE * 1.01, height: ARTWORK_SIZE * 1.01, alignSelf: 'center' as const, top: '50%' as const, marginTop: -(ARTWORK_SIZE * 1.01) / 2, opacity: 0.7 };

  const renderMegaLayer = (layerIdx: number, x1: string, y1: string, x2: string, y2: string, animatedStyle: any) => {
    const maskId = `mgMask${layerIdx}`, gradIdFull = `mgGrad${layerIdx}_g`, filterId = `mgMaskBlur${layerIdx}`;
    return (
      <Animated.View key={`mega-aura-${layerIdx}`} style={[svgPositionStyle, animatedStyle]} pointerEvents="none">
        <Svg width={SVG_SIZE} height={SVG_SIZE}>
          <Defs>
            <SvgLinearGradient id={gradIdFull} x1={x1} y1={y1} x2={x2} y2={y2}>
              <Stop offset="0%" stopColor="#FF0000" stopOpacity="0" />
              <Stop offset="10%" stopColor="#FF0000" stopOpacity="0.85" />
              <Stop offset="14.3%" stopColor="#FF7F00" stopOpacity="1" />
              <Stop offset="28.6%" stopColor="#FFFF00" stopOpacity="1" />
              <Stop offset="42.9%" stopColor="#00FF00" stopOpacity="1" />
              <Stop offset="57.1%" stopColor="#0000FF" stopOpacity="1" />
              <Stop offset="71.4%" stopColor="#4B0082" stopOpacity="1" />
              <Stop offset="85.7%" stopColor="#9400D3" stopOpacity="0.85" />
              <Stop offset="90%" stopColor="#FF0000" stopOpacity="0.85" />
              <Stop offset="100%" stopColor="#FF0000" stopOpacity="0" />
            </SvgLinearGradient>
            <Filter id={filterId} x="-60%" y="-60%" width="220%" height="220%">
              <FeGaussianBlur stdDeviation="128" />
            </Filter>
            <Mask id={maskId}>
              <SvgImage href={artworkUrl} x={cx - (ARTWORK_SIZE * 1.08) / 2} y={cy - (ARTWORK_SIZE * 1.08) / 2} width={ARTWORK_SIZE * 1.08} height={ARTWORK_SIZE * 1.08} preserveAspectRatio="xMidYMid meet" filter={`url(#${filterId})`} />
            </Mask>
          </Defs>
          <Rect x={0} y={0} width={SVG_SIZE} height={SVG_SIZE} fill={`url(#${gradIdFull})`} mask={`url(#${maskId})`} opacity={1} />
        </Svg>
      </Animated.View>
    );
  };

  return (
    <Animated.View style={[StyleSheet.absoluteFill, megaGradRotStyle]} pointerEvents="none">
      <View style={shadowStyle} pointerEvents="none">
        <Image source={{ uri: artworkUrl }} style={{ flex: 1, width: '100%', height: '100%' }} contentFit="contain" tintColor="#1a1a2e" cachePolicy="memory-disk" />
      </View>
      {renderMegaLayer(0, '0', '0.5', '1', '0.5', megaAStyle0)}
      {renderMegaLayer(1, '0', '1', '1', '0', megaAStyle1)}
      {renderMegaLayer(2, '0', '0', '1', '1', megaAStyle2)}
      {renderMegaLayer(3, '1', '0.5', '0', '0.5', megaAStyle3)}
      {renderMegaLayer(4, '1', '0', '0', '1', megaAStyle4)}
      {renderMegaLayer(5, '1', '1', '0', '0', megaAStyle5)}
      <View style={{ position: 'absolute', width: ARTWORK_SIZE * 1.015, height: ARTWORK_SIZE * 1.015, alignSelf: 'center', top: '50%', marginTop: -(ARTWORK_SIZE * 1.015) / 2 }} pointerEvents="none">
        <Image source={{ uri: artworkUrl }} style={{ flex: 1, width: '100%', height: '100%' }} contentFit="contain" tintColor="rgba(0,0,0,0.85)" cachePolicy="memory-disk" />
      </View>
    </Animated.View>
  );
};
