import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { spacing, fontSize, borderRadius } from '@/constants/spacing';
import { colors } from '@/constants/colors';
import { useEncounterLocations, useEncounterGameVersions } from '@/hooks/queries/useEncounterLocations';

// Canonical game release order — newest first for default selection
const GAME_VERSION_ORDER: Record<string, number> = {
  // Gen 1
  'red': 10, 'blue': 10, 'yellow': 15,
  'red-japan': 10, 'blue-japan': 10, 'green-japan': 10,
  // Gen 2
  'gold': 20, 'silver': 20, 'crystal': 25,
  // Gen 3
  'ruby': 30, 'sapphire': 30, 'firered': 35, 'leafgreen': 35, 'emerald': 37,
  'colosseum': 33, 'xd': 34,
  // Gen 4
  'diamond': 40, 'pearl': 40, 'platinum': 45, 'heartgold': 47, 'soulsilver': 47,
  // Gen 5
  'black': 50, 'white': 50, 'black-2': 55, 'white-2': 55,
  // Gen 6
  'x': 60, 'y': 60, 'omega-ruby': 65, 'alpha-sapphire': 65,
  // Gen 7
  'sun': 70, 'moon': 70, 'ultra-sun': 75, 'ultra-moon': 75,
  'lets-go-pikachu': 78, 'lets-go-eevee': 78,
  // Gen 8
  'sword': 80, 'shield': 80,
  'the-isle-of-armor-sword': 82, 'the-isle-of-armor-shield': 82,
  'the-crown-tundra-sword': 84, 'the-crown-tundra-shield': 84,
  'brilliant-diamond': 86, 'shining-pearl': 86,
  'legends-arceus': 88,
  // Gen 9
  'scarlet': 90, 'violet': 90,
  'the-teal-mask-scarlet': 92, 'the-teal-mask-violet': 92,
  'the-indigo-disk-scarlet': 94, 'the-indigo-disk-violet': 94,
  // Future/other
  'legends-za': 98, 'mega-dimension': 96, 'champions': 96,
};

function sortVersions(versions: string[]): string[] {
  return [...versions].sort((a, b) => {
    const diff = (GAME_VERSION_ORDER[b] ?? 0) - (GAME_VERSION_ORDER[a] ?? 0);
    if (diff !== 0) return diff;
    return a.localeCompare(b); // stable tiebreaker for unknown/equal-score versions
  });
}

function formatVersionName(slug: string): string {
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

interface Props {
  pokemonId: number;
  pokemonName: string;
}

export function EncounterLocationsSection({ pokemonId, pokemonName }: Props) {
  const { data: versions = [] } = useEncounterGameVersions(pokemonId);
  const sortedVersions = sortVersions(versions);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);

  // Reset selection when the pokemon changes
  useEffect(() => {
    setSelectedVersion(null);
  }, [pokemonId]);

  // Set default to newest version once versions load (or after reset)
  useEffect(() => {
    if (sortedVersions.length > 0 && (!selectedVersion || !sortedVersions.includes(selectedVersion))) {
      setSelectedVersion(sortedVersions[0]);
    }
  }, [sortedVersions.length, pokemonId]);

  const { data: encounters = [], isLoading } = useEncounterLocations(pokemonId, selectedVersion);

  const grouped = encounters.reduce<Record<string, typeof encounters>>((acc, enc) => {
    if (!acc[enc.locationName]) acc[enc.locationName] = [];
    acc[enc.locationName].push(enc);
    return acc;
  }, {});

  if (versions.length === 0 && !isLoading) {
    return (
      <View>
        <Text style={styles.emptyState}>
          {pokemonName} cannot be caught in the wild. It is obtained via event, gift, or trade.
        </Text>
      </View>
    );
  }

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
      >
        {sortedVersions.map(version => (
          <Pressable
            key={version}
            onPress={() => setSelectedVersion(version)}
            style={[styles.chip, selectedVersion === version && styles.chipActive]}
          >
            <Text style={[styles.chipText, selectedVersion === version && styles.chipTextActive]}>
              {formatVersionName(version)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {selectedVersion && encounters.length === 0 && !isLoading && (
        <Text style={styles.emptyState}>
          {pokemonName} cannot be caught in the wild in {formatVersionName(selectedVersion)}.
        </Text>
      )}

      {Object.entries(grouped).map(([locationName, rows]) => (
        <View key={locationName} style={styles.locationCard}>
          <Text style={styles.locationName}>{locationName}</Text>
          {rows.map((enc, idx) => (
            <Text key={idx} style={styles.encounterRow}>
              {enc.encounterMethod} · {enc.encounterChance}%
              {enc.minLevel !== null && enc.maxLevel !== null
                ? ` · Lv. ${enc.minLevel}–${enc.maxLevel}`
                : enc.minLevel !== null
                ? ` · Lv. ${enc.minLevel}+`
                : ''}
            </Text>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  chipRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginRight: spacing.sm,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.text,
  },
  chipTextActive: {
    color: colors.accent,
    fontWeight: '600',
  },
  locationCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    marginHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  locationName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  encounterRow: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  emptyState: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginHorizontal: spacing.md,
  },
});
