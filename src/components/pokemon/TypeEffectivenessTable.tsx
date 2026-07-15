import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, useWindowDimensions, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import {
  calcDefenseEffectiveness,
  calcOffenseEffectiveness,
  TYPE_ORDER,
  type PokemonType,
} from '@/constants/typeEffectiveness';
import { colors, typeColors } from '@/constants/colors';
import { spacing, fontSize, borderRadius } from '@/constants/spacing';

interface TypeEffectivenessTableProps {
  primaryType: string;
  secondaryType: string | null;
}

// Type abbreviations for square labels
const TYPE_ABBREVIATIONS: Record<string, string> = {
  normal: 'NOR',
  fire: 'FIR',
  water: 'WAT',
  electric: 'ELE',
  grass: 'GRA',
  ice: 'ICE',
  fighting: 'FIG',
  poison: 'POI',
  ground: 'GRO',
  flying: 'FLY',
  psychic: 'PSY',
  bug: 'BUG',
  rock: 'ROC',
  ghost: 'GHO',
  dragon: 'DRA',
  dark: 'DAR',
  steel: 'STE',
  fairy: 'FAI',
};

// Type icons for tab indicators
const TYPE_ICONS: Record<string, any> = {
  bug: require('@assets/icons/types/bug.png'),
  dark: require('@assets/icons/types/dark.png'),
  dragon: require('@assets/icons/types/dragon.png'),
  electric: require('@assets/icons/types/electric.png'),
  fairy: require('@assets/icons/types/fairy.png'),
  fighting: require('@assets/icons/types/fighting.png'),
  fire: require('@assets/icons/types/fire.png'),
  flying: require('@assets/icons/types/flying.png'),
  ghost: require('@assets/icons/types/ghost.png'),
  grass: require('@assets/icons/types/grass.png'),
  ground: require('@assets/icons/types/ground.png'),
  ice: require('@assets/icons/types/ice.png'),
  normal: require('@assets/icons/types/normal.png'),
  poison: require('@assets/icons/types/poison.png'),
  psychic: require('@assets/icons/types/psychic.png'),
  rock: require('@assets/icons/types/rock.png'),
  steel: require('@assets/icons/types/steel.png'),
  water: require('@assets/icons/types/water.png'),
};

// Two rows of 9 types each
const FIRST_ROW = ['normal', 'fire', 'water', 'electric', 'grass', 'ice', 'fighting', 'poison', 'ground'];
const SECOND_ROW = ['flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'];

interface ValueBoxProps {
  effectiveness: number;
  isDefenseTab: boolean;
  squareWidth: number;
}

const ValueBox: React.FC<ValueBoxProps> = ({ effectiveness, isDefenseTab, squareWidth }) => {
  // Determine color role: "good" = green, "bad" = red, "immune" = muted
  const extremeGoodColor = '#07a70c';
  const goodColor = '#B2FF59';
  const extremeBadColor = '#f40d09';
  const badColor = '#FF6D00';

  // Defense: resist (<1x) = good, weak (>1x) = bad
  // Offense: not very effective (<1x) = bad, super effective (>1x) = good
  const isExtremeGood = isDefenseTab ? effectiveness < 0.5 : effectiveness > 2;
  const isExtremeBad = isDefenseTab ? effectiveness > 2 : effectiveness < 0.5;
  const isGood = isDefenseTab ? effectiveness < 1 && effectiveness > 0 : effectiveness > 1;
  const isBad  = isDefenseTab ? effectiveness > 1 : effectiveness < 1 && effectiveness > 0;
  const isImmune = effectiveness === 0;

  const roleColor = isExtremeGood ? extremeGoodColor : isExtremeBad ? extremeBadColor : isGood ? goodColor : isBad ? badColor : colors.textMuted;

  // Visual weight per tier: x4/¼ get opaque bg + white text; x2/½ get tinted bg + role text; 0 muted
  let label = '';
  let bgColor = 'transparent';
  let textColor: string = `${colors.text}CC`;
  let borderColor: string = colors.border;
  let fontWeight: '600' | '700' | '800' = '600';
  let fontSizeMultiplier = 0.42;

  if (effectiveness === 0.25) {
    label = '¼';
    bgColor = `${roleColor}40`;
    borderColor = `${roleColor}99`;
    fontWeight = '700';
    fontSizeMultiplier = 0.46;
  } else if (effectiveness === 0.5) {
    label = '½';
    bgColor = `${roleColor}40`;
    borderColor = `${roleColor}99`;
    fontWeight = '600';
    fontSizeMultiplier = 0.42;
  } else if (effectiveness === 2) {
    label = '2×';
    bgColor = `${roleColor}40`;
    borderColor = `${roleColor}99`;
    fontWeight = '700';
    fontSizeMultiplier = 0.40;
  } else if (effectiveness === 4) {
    label = '4×';
    bgColor = `${roleColor}40`;
    borderColor = `${roleColor}99`;
    fontWeight = '800';
    fontSizeMultiplier = 0.44;
  } else if (isImmune) {
    label = '0';
    bgColor = colors.surface;
    borderColor = `${colors.textSecondary}CC`;
    fontWeight = '700';
  }
  // effectiveness === 1: empty box, subtle border only

  return (
    <View
      style={[
        styles.valueBox,
        {
          width: squareWidth,
          height: squareWidth,
          backgroundColor: bgColor,
          borderColor,
        },
      ]}
    >
      {label !== '' && (
        <Text
          style={[
            styles.valueBoxText,
            {
              color: textColor,
              fontSize: Math.max(10, squareWidth * fontSizeMultiplier),
              fontWeight,
            },
          ]}
        >
          {label}
        </Text>
      )}
    </View>
  );
};

interface TypeSquareProps {
  typeName: string;
  squareWidth: number;
  tabChangeIndex: number;
  squareIndex: number;
}

const TypeSquare: React.FC<TypeSquareProps> = ({
  typeName,
  squareWidth,
  tabChangeIndex,
  squareIndex,
}) => {
  const typeColor = typeColors[typeName] || colors.textMuted;
  const pressAnim = useSharedValue(0);
  const scaleAnim = useSharedValue(0);

  const backgroundColor = `${typeColor}60`; // ~80% opacity — vivid but lets dark bg show through

  // Entrance animation - staggered scale from 0.7 to 1.0
  React.useEffect(() => {
    scaleAnim.value = withDelay(
      squareIndex * 20,
      withSpring(1, { damping: 15 })
    );
  }, [tabChangeIndex, squareIndex, scaleAnim]);

  // Pressed state animation
  const handlePressIn = () => {
    pressAnim.value = withTiming(1, { duration: 100 });
  };

  const handlePressOut = () => {
    pressAnim.value = withTiming(0, { duration: 100 });
  };

  // Scale and opacity on press
  const pressedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(pressAnim.value, [0, 1], [1, 0.95]),
      }
    ],
    opacity: interpolate(pressAnim.value, [0, 1], [1, 0.9]),
  }));

  // Entrance scale animation
  const entryStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(scaleAnim.value, [0, 1], [0.7, 1], Extrapolate.CLAMP),
      }
    ],
  }));

  const abbrev = TYPE_ABBREVIATIONS[typeName] || typeName.toUpperCase().slice(0, 3);
  // Warm near-white label, always readable on any type color
  const labelColor = 'rgba(255, 238, 238, 0.90)';
  // Border complements the typeColor itself, not the text
  const squareBorderColor = `${typeColor}99`; // 60% opacity of type color

  return (
    <Animated.View
      style={[
        entryStyle,
        pressedStyle,
      ]}
    >
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.typeSquare,
          {
            width: squareWidth,
            height: squareWidth,
            backgroundColor,
            borderColor: squareBorderColor
          },
        ]}
      >
        {/* Gradient glow overlay - lit from above */}
        <LinearGradient
          colors={[
            `${typeColor}77`,  // Type color at 20% opacity
            'transparent',
          ]}
          start={{ x: .22, y: 0 }}
          end={{ x: 0.25, y: .95 }}
          style={styles.typeSquareGlow}
        />

        <Text style={[styles.typeLabel, { fontSize: Math.max(10, squareWidth * 0.35), color: labelColor }]}>
          {abbrev}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

interface TypeGridRowProps {
  types: string[];
  effectiveness: Record<string, number>;
  isDefenseTab: boolean;
  squareWidth: number;
  tabChangeIndex: number;
  rowStartIndex: number;
}

const TypeGridRow: React.FC<TypeGridRowProps> = ({
  types,
  effectiveness,
  isDefenseTab,
  squareWidth,
  tabChangeIndex,
  rowStartIndex,
}) => {
  return (
    <View style={styles.typeBand}>
      {/* Row A: type squares */}
      <View style={styles.gridRow}>
        {types.map((typeName, index) => (
          <View key={typeName} style={styles.typeSquareWrapper}>
            <TypeSquare
              typeName={typeName}
              squareWidth={squareWidth}
              tabChangeIndex={tabChangeIndex}
              squareIndex={rowStartIndex + index}
            />
          </View>
        ))}
      </View>
      {/* Row B: value boxes */}
      <View style={styles.gridRow}>
        {types.map((typeName) => (
          <View key={typeName} style={styles.typeSquareWrapper}>
            <ValueBox
              effectiveness={effectiveness[typeName] ?? 1}
              isDefenseTab={isDefenseTab}
              squareWidth={squareWidth}
            />
          </View>
        ))}
      </View>
    </View>
  );
};

export const TypeEffectivenessTable: React.FC<TypeEffectivenessTableProps> = ({
  primaryType,
  secondaryType,
}) => {
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [tabChangeIndex, setTabChangeIndex] = useState(0);
  const { width: screenWidth } = useWindowDimensions();
  const tabOpacity = useSharedValue(1);
  const tabSlideX = useSharedValue(0);

  // Calculate responsive square width
  const availableWidth = screenWidth - spacing.lg * 2; // parent already adds 16px each side
  const squareWidth = Math.max(32, Math.min(38, (availableWidth - 4 * 8) / 9)); // 8 gaps of 4px each

  // Determine which types to display for tabs
  const displayTypes = [primaryType];
  if (secondaryType && secondaryType !== primaryType) {
    displayTypes.push(secondaryType);
  }

  // Get effectiveness data for current tab
  let effectivenessData: Record<string, number>;
  if (activeTabIndex === 0) {
    // Defense tab
    effectivenessData = calcDefenseEffectiveness(primaryType, secondaryType);
  } else {
    // Offense tab for the specific type
    const offenseType = displayTypes[activeTabIndex - 1] || primaryType;
    effectivenessData = calcOffenseEffectiveness(offenseType);
  }

  // NEW: Tab animation handler
  const handleTabPress = (index: number) => {
    if (index === activeTabIndex) return;

    // Fade out
    tabOpacity.value = withTiming(0, { duration: 150 });

    // Slide out (previous direction)
    tabSlideX.value = withTiming(index > activeTabIndex ? 20 : -20, { duration: 150 });

    // After fade, change tab
    setTimeout(() => {
      setActiveTabIndex(index);
      setTabChangeIndex(prev => prev + 1);

      // Slide in (opposite direction)
      tabSlideX.value = withTiming(index > activeTabIndex ? -20 : 20, { duration: 0 });

      // Fade in
      tabOpacity.value = withTiming(1, { duration: 150 });
      tabSlideX.value = withTiming(0, { duration: 150 });
    }, 150);
  };

  const gridAnimStyle = useAnimatedStyle(() => ({
    opacity: tabOpacity.value,
    transform: [
      {
        translateX: tabSlideX.value,
      }
    ],
  }));

  return (
    <View style={styles.container}>
      {/* Section Title - small-caps floating text, no card */}
      <Text style={styles.sectionTitle}>TYPE MATCHUPS</Text>

      {/* Tab Bar - floats with no container box */}
      <View style={styles.tabBar}>
        {/* Defense Tab */}
        <Pressable
          style={[
            styles.tab,
            {
              borderBottomWidth: activeTabIndex === 0 ? 2 : 0,
              borderBottomColor: activeTabIndex === 0 ? colors.primary : 'transparent',
            },
          ]}
          onPress={() => handleTabPress(0)}
        >
          <Text style={[styles.tabText, activeTabIndex === 0 && styles.tabTextActive]}>
            🛡 Defense
          </Text>
        </Pressable>

        {/* Type Offense Tabs */}
        {displayTypes.map((typeName, index) => {
          const tabIndex = index + 1;
          const typeColor = typeColors[typeName] || colors.textMuted;
          const isActive = activeTabIndex === tabIndex;

          return (
            <Pressable
              key={typeName}
              style={[
                styles.tab,
                {
                  borderBottomWidth: isActive ? 2 : 0,
                  borderBottomColor: isActive ? typeColor : 'transparent',
                },
              ]}
              onPress={() => handleTabPress(tabIndex)}
            >
              <View style={styles.tabContent}>
                {TYPE_ICONS[typeName] && (
                  <Image
                    source={TYPE_ICONS[typeName]}
                    style={styles.typeTabIcon}
                  />
                )}
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {typeName.charAt(0).toUpperCase() + typeName.slice(1)}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Type Grid with animation */}
      <Animated.View style={[styles.gridContainer, gridAnimStyle]}>
        <TypeGridRow
          types={FIRST_ROW}
          effectiveness={effectivenessData}
          isDefenseTab={activeTabIndex === 0}
          squareWidth={squareWidth}
          tabChangeIndex={tabChangeIndex}
          rowStartIndex={0}
        />
        <TypeGridRow
          types={SECOND_ROW}
          effectiveness={effectivenessData}
          isDefenseTab={activeTabIndex === 0}
          squareWidth={squareWidth}
          tabChangeIndex={tabChangeIndex}
          rowStartIndex={9}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: spacing.md,
    opacity: 1,
  },
  tabBar: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    marginBottom: spacing.sm,
    height: 40,
    paddingBottom: spacing.sm,
  },
  tab: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeTabIcon: {
    width: 16,
    height: 16,
    marginRight: spacing.xs,
  },
  tabText: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.textMuted,
  },
  tabTextActive: {
    fontWeight: '600',
    color: colors.text,
  },
  gridContainer: {
    paddingHorizontal: 0,
  },
  typeBand: {
    marginBottom: 6,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    gap: 4,
    marginBottom: 3,
  },
  typeSquareWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  typeSquare: {
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeSquareGlow: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.sm,
  },
  typeLabel: {
    fontWeight: '700',
  },
  valueBox: {
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  valueBoxText: {
    textAlign: 'center',
  },
});
