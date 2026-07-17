import React, { useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Easing,
  withDelay,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typeColors } from '@/constants/colors';
import { spacing, fontSize, borderRadius } from '@/constants/spacing';

export type StatType = 'hp' | 'attack' | 'defense' | 'spAttack' | 'spDefense' | 'speed';

export interface StatChartProps {
  stats: {
    hp: number;
    attack: number;
    defense: number;
    spAttack: number;
    spDefense: number;
    speed: number;
  };
  accentColor?: string;
  maxStatValue?: number;
  animated?: boolean;
  onStatTap?: (statName: StatType) => void;
  showValues?: boolean;
  valueFormat?: 'raw' | 'percentage';
  height?: number;
  primaryType?: string;
}

interface StatRow {
  name: StatType;
  label: string;
  value: number;
}

const STAT_ROWS: Array<{ name: StatType; label: string }> = [
  { name: 'hp', label: 'HP' },
  { name: 'attack', label: 'ATTACK' },
  { name: 'defense', label: 'DEFENSE' },
  { name: 'spAttack', label: 'SP. ATK' },
  { name: 'spDefense', label: 'SP. DEF' },
  { name: 'speed', label: 'SPEED' },
];


const StatBar: React.FC<{
  stat: StatRow;
  maxStatValue: number;
  accentColor: string;
  animated: boolean;
  delay: number;
  showValues: boolean;
  valueFormat: 'raw' | 'percentage';
  onPress?: () => void;
  containerWidth: number;
  defLabelWidth: number;
  onDefLabelLayout?: (w: number) => void;
}> = ({
  stat,
  maxStatValue,
  accentColor,
  animated,
  delay,
  showValues,
  valueFormat,
  onPress,
  containerWidth,
  defLabelWidth,
  onDefLabelLayout,
}) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (animated) {
      const timeoutId = setTimeout(() => {
        progress.value = withDelay(
          delay,
          withTiming(1, {
            duration: 400,
            easing: Easing.out(Easing.cubic),
          })
        );
      }, 100);
      return () => clearTimeout(timeoutId);
    } else {
      progress.value = 1;
    }
  }, [animated, delay, progress]);

  const barWidth = (stat.value / maxStatValue) * 100;
  const percentage = Math.round((stat.value / maxStatValue) * 100);

  const animatedBarStyle = useAnimatedStyle(() => ({
    width: animated
      ? `${interpolate(progress.value, [0, 1], [0, barWidth])}%`
      : `${barWidth}%`,
    opacity: animated
      ? interpolate(progress.value, [0, 1], [0, 1])
      : 1,
    transform: [
      {
        scaleY: animated
          ? interpolate(progress.value, [0, 1], [0.8, 1])
          : 1,
      }
    ]
  }));

  const displayValue = valueFormat === 'percentage' ? `${percentage}%` : `${stat.value}`;
  const accessibilityLabel = `${stat.label}: ${stat.value}`;
  const accessibilityHint = `${percentage}% of maximum base stat`;

  return (
    <Pressable
      onPress={onPress}
      accessible={true}
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{
        min: 0,
        max: maxStatValue,
        now: stat.value,
        text: `${stat.value} (${percentage}% of maximum)`,
      }}
      style={styles.row}
    >
      <Text
        style={[styles.label, { width: defLabelWidth > 0 ? defLabelWidth : undefined }, stat.name === 'defense' ? { textAlign: 'left' } : {}]}
        onLayout={stat.name === 'defense' ? (e) => { const w = e?.nativeEvent?.layout?.width; if (w && onDefLabelLayout) onDefLabelLayout(w); } : undefined}
      >
        {stat.label}
      </Text>

      <View style={[styles.barContainer, { flex: 1 }]}>
        {/* Bar track */}
        <View style={styles.barTrack}>
          {/* Animated clip container — width animates from 0 to barWidth% */}
          <Animated.View style={[styles.barFill, animatedBarStyle]}>
            {/* Full-width gradient rendered inside the clip — uses containerWidth to appear as a slice */}
            <LinearGradient
              colors={['#8B2A2A', '#B85C1A', '#C8A020', '#96E040', '#00FF7F', '#00FFFF']}
              locations={[0, 0.118, 0.235, 0.353, 0.471, 0.784]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.barGradient, { width: containerWidth }]}
            />
            <View style={styles.barGlowOverlay} />
          </Animated.View>
        </View>
      </View>

      {showValues && <Text style={[styles.value, { color: accentColor }]}>{displayValue}</Text>}
    </Pressable>
  );
};

export const StatChart: React.FC<StatChartProps> = ({
  stats,
  accentColor = colors.primary,
  maxStatValue = 180,
  animated = true,
  onStatTap,
  showValues = true,
  valueFormat = 'raw',
  height,
  primaryType,
}) => {
  const { width: screenWidth } = useWindowDimensions();
  const [defLabelWidth, setDefLabelWidth] = React.useState(0);

  const statRows: StatRow[] = useMemo(
    () => [
      { name: 'hp', label: 'HP', value: stats.hp },
      { name: 'attack', label: 'ATTACK', value: stats.attack },
      { name: 'defense', label: 'DEFENSE', value: stats.defense },
      { name: 'spAttack', label: 'SP. ATK', value: stats.spAttack },
      { name: 'spDefense', label: 'SP. DEF', value: stats.spDefense },
      { name: 'speed', label: 'SPEED', value: stats.speed },
    ],
    [stats],
  );

  const bst = useMemo(
    () => statRows.reduce((sum, stat) => sum + stat.value, 0),
    [statRows],
  );

  const handleStatTap = useCallback(
    (statName: StatType) => {
      if (onStatTap) {
        onStatTap(statName);
      }
    },
    [onStatTap],
  );

  const containerWidth = screenWidth - 2 * spacing.lg;

  return (
    <View style={[styles.container, height ? { height } : {}]}>
      <Text style={styles.sectionTitle}>BASE STATS</Text>

      {statRows.map((stat, index) => (
        <StatBar
          key={stat.name}
          stat={stat}
          maxStatValue={maxStatValue}
          accentColor={accentColor}
          animated={animated}
          delay={index * 60}
          showValues={showValues}
          valueFormat={valueFormat}
          onPress={() => handleStatTap(stat.name)}
          containerWidth={containerWidth}
          defLabelWidth={defLabelWidth}
          onDefLabelLayout={setDefLabelWidth}
        />
      ))}

      <View style={styles.totalContainer}>
        <Text
          style={styles.totalLabel}
          accessible={true}
          accessibilityLabel={`Base Stat Total (BST): ${bst}`}
        >
          BASE STAT TOTAL (BST):
        </Text>
        <Text style={[styles.totalValue, { color: accentColor }]}>{bst}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.lg,
    gap: spacing.sm,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    textAlign: 'right',
    textTransform: 'uppercase',
    letterSpacing: 1,
    opacity: 0.7,
  },
  barContainer: {
    justifyContent: 'center',
    position: 'relative',
  },
  barTrack: {
    height: 8,
    backgroundColor: `${colors.surface}99`,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  barGradient: {
    height: '100%',
    borderRadius: 4,
  },
  barGlowOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 4,
  },
  value: {
    width: 30,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'right',
    fontFamily: 'Menlo',
  },
  totalContainer: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  totalValue: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Menlo',
  },
});
