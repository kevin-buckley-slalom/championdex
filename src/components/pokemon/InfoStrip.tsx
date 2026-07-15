import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import {
  toMetricHeight,
  toImperialHeight,
  toMetricWeight,
  toImperialWeight,
} from '@/utils/unitConversions';

interface InfoStripProps {
  height: number | null;
  weight: number | null;
  generation: number;
  genderRate: number | undefined;
  isLegendary?: boolean;
  isMythical?: boolean;
  accentColor: string;
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'] as const;

const getRomanNumeral = (gen: number): string => {
  return ROMAN[gen - 1] ?? String(gen);
};

/**
 * Parses gender rate and returns { malePercent, femalePercent, isGenderless }
 */
const parseGenderRate = (genderRate: number | undefined) => {
  if (genderRate === undefined || genderRate === -1) {
    return { malePercent: 0, femalePercent: 0, isGenderless: true };
  }
  if (genderRate === 0) {
    return { malePercent: 100, femalePercent: 0, isGenderless: false };
  }
  if (genderRate === 8) {
    return { malePercent: 0, femalePercent: 100, isGenderless: false };
  }
  const femalePercent = (genderRate / 8) * 100;
  return { malePercent: 100 - femalePercent, femalePercent, isGenderless: false };
};

/**
 * InfoStrip: Metadata display with new layout
 *
 * Design (top-to-bottom):
 * 1. Legendary/Mythical badge (conditional) — full-width centered with star glyph
 * 2. Height + Weight — two centered columns, imperial large above metric
 * 3. Generation + Gender — single compact row with GEN label/value and gender display
 */
export const InfoStrip: React.FC<InfoStripProps> = ({
  height,
  weight,
  generation,
  genderRate,
  isLegendary,
  isMythical,
  accentColor,
}) => {
  const { malePercent, femalePercent, isGenderless } = parseGenderRate(genderRate);
  const genRoman = getRomanNumeral(generation);

  const metricHeight = toMetricHeight(height) ?? '—';
  const imperialHeight = toImperialHeight(height) ?? '—';
  const metricWeight = toMetricWeight(weight) ?? '—';
  const imperialWeight = toImperialWeight(weight) ?? '—';

  const genderPercentageText = isGenderless
    ? 'Genderless'
    : `♂ ${Math.round(malePercent)}%  ♀ ${Math.round(femalePercent)}%`;

  return (
    <View style={styles.container}>
      {/* 1. Legendary/Mythical badge (conditional) */}
      {(isLegendary || isMythical) && (
        <View>
          <View style={styles.badge}>
            <Text
              style={[
                styles.badgeText,
                {
                  color: isLegendary
                    ? 'rgba(255, 215, 0, 0.9)'
                    : 'rgba(192, 0, 255, 0.9)',
                },
              ]}
            >
              {isLegendary ? '★' : '✦'} {isLegendary ? 'LEGENDARY' : 'MYTHICAL'}
            </Text>
          </View>
          <View style={styles.badgeDivider} />
        </View>
      )}

      {/* Single row: HEIGHT · WEIGHT · GEN · GENDER */}
      <View style={styles.allColumnsRow}>
        <View style={styles.dimensionColumn}>
          <Text style={styles.dimensionLabel}>HEIGHT</Text>
          <Text style={styles.dimensionPrimary}>{imperialHeight}</Text>
          <Text style={styles.dimensionSecondary}>{metricHeight}</Text>
        </View>

        <View style={styles.dimensionColumn}>
          <Text style={styles.dimensionLabel}>WEIGHT</Text>
          <Text style={styles.dimensionPrimary}>{imperialWeight}</Text>
          <Text style={styles.dimensionSecondary}>{metricWeight}</Text>
        </View>

        <View style={styles.dimensionGenColumn}>
          <Text style={styles.dimensionLabel}>GEN</Text>
          <Text style={styles.dimensionPrimary}>{genRoman}</Text>
          <Text style={styles.dimensionSecondary}> </Text>
        </View>

        <View style={styles.dimensionGenderColumn}>
          <Text style={styles.dimensionLabel}>GENDER</Text>
          {isGenderless ? (
            <>
              <View style={[styles.genderBar, styles.genderBarNeutral]} />
              <Text style={styles.genderCaption}>Genderless</Text>
            </>
          ) : (
            <>
              <View style={styles.genderBar}>
                <View
                  style={[
                    styles.genderSegment,
                    { flex: malePercent, backgroundColor: '#6890F0' },
                  ]}
                />
                <View
                  style={[
                    styles.genderSegment,
                    { flex: femalePercent, backgroundColor: '#FF6FA0' },
                  ]}
                />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
                <Text style={styles.genderCaption}>♂ {Math.round(malePercent)}%</Text>
                <Text style={styles.genderCaption}>♀ {Math.round(femalePercent)}%</Text>
              </View>
            </>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: 'transparent',
  },

  /* Badge Section */
  badge: {
    alignItems: 'center',
    paddingBottom: spacing.sm,
  },

  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },

  badgeDivider: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: spacing.md,
  },

  /* All four columns in one row */
  allColumnsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },

  dimensionColumn: {
    flex: 2,
    alignItems: 'flex-start',
  },

  dimensionGenColumn: {
    flex: 1,
    alignItems: 'flex-start'
  },

  dimensionGenderColumn: {
    flex: 3,
    alignItems: 'flex-start'
  },

  dimensionLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 2,
    textTransform: 'uppercase',
    opacity: 0.6,
    marginBottom: spacing.xs,
  },

  dimensionPrimary: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },

  dimensionSecondary: {
    fontSize: 11,
    fontWeight: '400',
    color: colors.textMuted,
  },

  genderBar: {
    alignSelf: 'stretch',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    flexDirection: 'row',
    marginTop: 12,
    marginBottom: 4,
  },

  genderBarNeutral: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },

  genderSegment: {
    height: '100%',
  },

  genderCaption: {
    fontSize: 11,
    fontWeight: '400',
    color: colors.textMuted,
    opacity: 0.7,
  },

});
