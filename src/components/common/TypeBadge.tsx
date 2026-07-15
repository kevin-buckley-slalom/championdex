import React from 'react';
import { Image, Text, View, StyleSheet } from 'react-native';
import { colors, typeColors, typeTextColors } from '@/constants/colors';
import { spacing, fontSize, borderRadius } from '@/constants/spacing';

const TYPE_ICONS: Record<string, any> = {
  bug: require('../../../assets/icons/types/bug.png'),
  dark: require('../../../assets/icons/types/dark.png'),
  dragon: require('../../../assets/icons/types/dragon.png'),
  electric: require('../../../assets/icons/types/electric.png'),
  fairy: require('../../../assets/icons/types/fairy.png'),
  fighting: require('../../../assets/icons/types/fighting.png'),
  fire: require('../../../assets/icons/types/fire.png'),
  flying: require('../../../assets/icons/types/flying.png'),
  ghost: require('../../../assets/icons/types/ghost.png'),
  grass: require('../../../assets/icons/types/grass.png'),
  ground: require('../../../assets/icons/types/ground.png'),
  ice: require('../../../assets/icons/types/ice.png'),
  normal: require('../../../assets/icons/types/normal.png'),
  poison: require('../../../assets/icons/types/poison.png'),
  psychic: require('../../../assets/icons/types/psychic.png'),
  rock: require('../../../assets/icons/types/rock.png'),
  steel: require('../../../assets/icons/types/steel.png'),
  water: require('../../../assets/icons/types/water.png'),
};

export interface TypeBadgeProps {
  type: string;
  size?: 'sm' | 'md';
  fixed?: boolean;
  width?: 'auto' | 'compact' | 'fixed';
}

export const TypeBadge: React.FC<TypeBadgeProps> = ({ type, size = 'md', fixed = false, width = 'auto' }) => {
  const typeKey = type.toLowerCase();
  const backgroundColor = typeColors[typeKey] || colors.textMuted;
  const textColor = typeTextColors[typeKey] || colors.text;
  const typeIcon = TYPE_ICONS[typeKey];

  const showIcon = size === 'md' || fixed;
  const iconSize = size === 'sm' ? 14 : 16;
  const styles = size === 'sm' ? stylesSm : stylesMd;

  // Compute width constraint based on width prop
  let widthStyle: Record<string, number> | undefined;
  if (width === 'compact') {
    widthStyle = size === 'sm' ? { width: 70 } : { width: 80 };
  } else if (width === 'fixed') {
    widthStyle = size === 'sm' ? { width: 88 } : { width: 110 };
  }
  // width === 'auto' leaves widthStyle undefined (no constraint)

  return (
    <View style={[styles.badge, { backgroundColor }, fixed && styles.fixed, widthStyle]}>
      {showIcon && typeIcon && (
        <Image
          source={typeIcon}
          style={{ width: iconSize, height: iconSize, marginRight: 4 }}
        />
      )}
      <Text style={[styles.text, { color: textColor }]}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Text>
    </View>
  );
};

const stylesSm = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  fixed: {
    width: '100%',
    flex: 1,
  },
  text: {
    fontSize: fontSize.xs,
    fontWeight: '500',
  },
});

const stylesMd = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: borderRadius.sm + 2,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  fixed: {
    width: '100%',
    flex: 1,
  },
  text: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
});
