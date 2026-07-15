import React, { useState, useMemo } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  Text,
  StyleSheet,
} from 'react-native';
import { colors } from '@/constants/colors';
import { spacing, fontSize, borderRadius } from '@/constants/spacing';
import { PokemonFlavorText } from '@/services/database/pokemonSpeciesRepository';

interface FlavorTextSectionProps {
  flavorTexts: PokemonFlavorText[];
  accentColor: string;
}

export function FlavorTextSection({
  flavorTexts,
  accentColor,
}: FlavorTextSectionProps) {
  // De-duplicate by gameVersion, keeping first occurrence
  const uniqueVersions = useMemo(() => {
    const seenVersions = new Set<string>();
    return flavorTexts.filter((entry) => {
      if (seenVersions.has(entry.gameVersion)) {
        return false;
      }
      seenVersions.add(entry.gameVersion);
      return true;
    });
  }, [flavorTexts]);

  const defaultIndex = uniqueVersions.length > 1 ? uniqueVersions.length - 1 : 0;
  const [selectedIndex, setSelectedIndex] = useState(defaultIndex);

  if (uniqueVersions.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyMessage}>No Pokédex entries available</Text>
      </View>
    );
  }

  const selectedEntry = uniqueVersions[selectedIndex];

  function formatGameVersion(gameVersion: string): string {
    if (gameVersion === 'default') return 'Pokédex Entry';
    return gameVersion
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  if (uniqueVersions.length === 1) {
    return (
      <View style={styles.container}>
        <View style={styles.textCard}>
          <Text style={styles.flavorText}>{selectedEntry.flavorText}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsContainer}
      >
        {uniqueVersions.map((entry, index) => (
          <Pressable
            key={`${entry.gameVersion}-${index}`}
            onPress={() => setSelectedIndex(index)}
            style={[
              styles.chip,
              selectedIndex === index && [
                styles.chipSelected,
                { backgroundColor: accentColor },
              ],
            ]}
          >
            <Text
              style={[
                styles.chipText,
                selectedIndex === index && styles.chipTextSelected,
              ]}
            >
              {formatGameVersion(entry.gameVersion)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.textCard}>
        <Text style={styles.flavorText}>{selectedEntry.flavorText}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  chipsContainer: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  chipSelected: {
    borderColor: 'transparent',
  },
  chipText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  chipTextSelected: {
    color: colors.background,
  },
  textCard: {
    marginHorizontal: spacing.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: borderRadius.lg,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  flavorText: {
    fontSize: fontSize.md,
    lineHeight: fontSize.md * 1.6,
    color: colors.text,
    fontWeight: '400',
  },
  emptyMessage: {
    marginHorizontal: spacing.lg,
    fontSize: fontSize.md,
    color: colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
