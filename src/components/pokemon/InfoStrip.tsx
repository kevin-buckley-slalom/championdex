import React, { useState } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { Svg, Polygon } from 'react-native-svg';
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
  const [genderBarWidth, setGenderBarWidth] = useState<number>(0);

  const metricHeight = toMetricHeight(height) ?? '—';
  const imperialHeight = toImperialHeight(height) ?? '—';
  const metricWeight = toMetricWeight(weight) ?? '—';
  const imperialWeight = toImperialWeight(weight) ?? '—';

  const genderPercentageText = isGenderless
    ? 'Genderless'
    : `♂ ${Math.round(malePercent)}%  ♀ ${Math.round(femalePercent)}%`;

  const renderGenderBar = () => {
    if (isGenderless) {
      return <View style={[styles.genderBar, styles.genderBarNeutral]} />;
    }

    // Edge cases: 100% male or 100% female (no diagonal needed)
    if (malePercent === 100) {
      return (
        <View style={{ width: '100%', height: '100%', backgroundColor: '#6890F0' }} />
      );
    }

    if (femalePercent === 100) {
      return (
        <View style={{ width: '100%', height: '100%', backgroundColor: '#D47A8A' }} />
      );
    }

    // Standard case: diagonal divider with SVG
    if (genderBarWidth === 0) {
      // Placeholder until layout is measured
      return <View style={styles.genderBar} />;
    }

    const barHeight = 6;
    const diagonalOffset = barHeight;
    const splitX = (genderBarWidth * malePercent) / 100;

    return (
      <Svg width={genderBarWidth} height={barHeight} style={styles.genderSvg}>
        {/* Male polygon (blue) */}
        <Polygon
          points={`0,0 ${splitX + diagonalOffset},0 ${splitX},${barHeight} 0,${barHeight}`}
          fill="#6890F0"
        />
        {/* Female polygon (rose) */}
        <Polygon
          points={`${splitX + diagonalOffset},0 ${genderBarWidth},0 ${genderBarWidth},${barHeight} ${splitX},${barHeight}`}
          fill="#D47A8A"
        />
      </Svg>
    );
  };

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
          <View style={styles.primarySlot}>
            <Text style={styles.dimensionPrimary}>{imperialHeight}</Text>
          </View>
          <Text style={styles.dimensionSecondary}>{metricHeight}</Text>
        </View>

        <View style={styles.dimensionColumn}>
          <Text style={styles.dimensionLabel}>WEIGHT</Text>
          <View style={styles.primarySlot}>
            <Text style={styles.dimensionPrimary}>{imperialWeight}</Text>
          </View>
          <Text style={styles.dimensionSecondary}>{metricWeight}</Text>
        </View>

        <View style={styles.dimensionGenColumn}>
          <Text style={styles.dimensionLabel}>GEN</Text>
          <View style={styles.primarySlot}>
            <Text style={styles.dimensionPrimary}>{genRoman}</Text>
          </View>
          <Text style={styles.dimensionSecondary}> </Text>
        </View>

        <View style={styles.dimensionGenderColumn}>
          <Text style={styles.dimensionLabel}>GENDER</Text>
          {isGenderless ? (
            <>
              <View style={styles.primarySlot}>
                <View style={[styles.genderBar, styles.genderBarNeutral]} />
              </View>
              <Text style={styles.dimensionSecondary}>Genderless</Text>
            </>
          ) : (
            <>
              <View style={styles.primarySlot}>
                <View
                  style={styles.genderBar}
                  onLayout={(event) => {
                    const { width } = event.nativeEvent.layout;
                    setGenderBarWidth(width);
                  }}
                >
                  {renderGenderBar()}
                </View>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
                <Text style={styles.dimensionSecondary}>♂ {Math.round(malePercent)}%</Text>
                <Text style={styles.dimensionSecondary}>♀ {Math.round(femalePercent)}%</Text>
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
    alignItems: 'stretch',
    gap: 16,
  },

  dimensionColumn: {
    flex: 2,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },

  dimensionGenColumn: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },

  dimensionGenderColumn: {
    flex: 3,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
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
  },

  dimensionSecondary: {
    fontSize: 11,
    fontWeight: '400',
    color: colors.textMuted,
  },

  primarySlot: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
  },

  genderBar: {
    alignSelf: 'stretch',
    width: '100%',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },

  genderBarNeutral: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },

  genderSvg: {
    width: '100%',
    height: '100%',
  },

});
