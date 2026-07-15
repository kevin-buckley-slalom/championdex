import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';
import { fontSize } from '@/constants/spacing';
import { parseGenderRate } from '@/utils/pokemonUtils';

interface GenderDisplayProps {
  genderRate: number;
  size?: 'sm' | 'md';
}

export const GenderDisplay: React.FC<GenderDisplayProps> = ({
  genderRate,
  size = 'md',
}) => {
  const { malePercent, femalePercent, isGenderless } = parseGenderRate(genderRate);
  const iconSize = size === 'sm' ? fontSize.sm : fontSize.md;
  const textSize = size === 'sm' ? fontSize.xs : fontSize.sm;

  if (isGenderless) {
    return (
      <View style={styles.row}>
        <Text style={[styles.icon, { fontSize: iconSize, color: colors.textMuted }]}>⊘</Text>
      </View>
    );
  }

  // Handle pure male/female cases (100% one gender)
  if (malePercent === 100 && femalePercent === 0) {
    return (
      <View style={styles.row}>
        <Text style={[styles.icon, { fontSize: iconSize, color: '#2196F3' }]}>♂</Text>
      </View>
    );
  }

  if (femalePercent === 100 && malePercent === 0) {
    return (
      <View style={styles.row}>
        <Text style={[styles.icon, { fontSize: iconSize, color: '#E91E63' }]}>♀</Text>
      </View>
    );
  }

  // Handle mixed gender cases (show both with percentages)
  if (malePercent !== null && femalePercent !== null) {
    return (
      <View style={styles.row}>
        <Text style={[styles.icon, { fontSize: iconSize, color: '#2196F3' }]}>♂</Text>
        <Text style={[styles.label, { fontSize: textSize }]}>
          {Number.isInteger(malePercent) ? malePercent : malePercent.toFixed(1)}%
        </Text>
        <Text style={[styles.separator, { fontSize: textSize }]}> · </Text>
        <Text style={[styles.icon, { fontSize: iconSize, color: '#E91E63' }]}>♀</Text>
        <Text style={[styles.label, { fontSize: textSize }]}>
          {Number.isInteger(femalePercent) ? femalePercent : femalePercent.toFixed(1)}%
        </Text>
      </View>
    );
  }

  // Fallback (should not reach if parseGenderRate works correctly)
  return (
    <View style={styles.row}>
      <Text style={[styles.icon, { fontSize: iconSize, color: colors.textMuted }]}>—</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontWeight: '700',
  },
  label: {
    color: colors.text,
    fontWeight: '500',
    marginLeft: 2,
  },
  separator: {
    color: colors.textMuted,
  },
});
