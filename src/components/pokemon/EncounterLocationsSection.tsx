import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Modal,
  Animated,
  Dimensions,
  FlatList,
  ActivityIndicator,
} from 'react-native';
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

const GAME_GENERATION_MAP: Record<string, string> = {
  'scarlet': 'Generation IX', 'violet': 'Generation IX',
  'sword': 'Generation VIII', 'shield': 'Generation VIII',
  'brilliant-diamond': 'Generation VIII', 'shining-pearl': 'Generation VIII',
  'legends-arceus': 'Generation VIII',
  'sun': 'Generation VII', 'moon': 'Generation VII',
  'ultra-sun': 'Generation VII', 'ultra-moon': 'Generation VII',
  'lets-go-pikachu': 'Generation VII', 'lets-go-eevee': 'Generation VII',
  'x': 'Generation VI', 'y': 'Generation VI',
  'omega-ruby': 'Generation VI', 'alpha-sapphire': 'Generation VI',
  'black-2': 'Generation V', 'white-2': 'Generation V',
  'black': 'Generation V', 'white': 'Generation V',
  'heartgold': 'Generation IV', 'soulsilver': 'Generation IV',
  'diamond': 'Generation IV', 'pearl': 'Generation IV', 'platinum': 'Generation IV',
  'firered': 'Generation III', 'leafgreen': 'Generation III',
  'ruby': 'Generation III', 'sapphire': 'Generation III', 'emerald': 'Generation III',
  'colosseum': 'Generation III', 'xd': 'Generation III',
  'gold': 'Generation II', 'silver': 'Generation II', 'crystal': 'Generation II',
  'red': 'Generation I', 'blue': 'Generation I', 'yellow': 'Generation I',
};

const GENERATION_ORDER: Record<string, number> = {
  'Generation IX': 1,
  'Generation VIII': 2,
  'Generation VII': 3,
  'Generation VI': 4,
  'Generation V': 5,
  'Generation IV': 6,
  'Generation III': 7,
  'Generation II': 8,
  'Generation I': 9,
  'Other': 10,
};

const SHEET_HEIGHT = Dimensions.get('window').height * 0.7;

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
  const [modalVisible, setModalVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;

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

  const openModal = () => {
    setModalVisible(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeModal = () => {
    Animated.timing(slideAnim, {
      toValue: SHEET_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
    });
  };

  const handleVersionSelect = (version: string) => {
    setSelectedVersion(version);
    closeModal();
  };

  const groupedVersions = useMemo(() => {
    const groups: Record<string, string[]> = {};
    sortedVersions.forEach(version => {
      const gen = GAME_GENERATION_MAP[version] || 'Other';
      if (!groups[gen]) groups[gen] = [];
      groups[gen].push(version);
    });
    return groups;
  }, [sortedVersions]);

  const flatListData = useMemo(() => {
    const data: Array<{ type: 'header' | 'item'; generation?: string; version?: string }> = [];
    Object.keys(GENERATION_ORDER)
      .sort((a, b) => (GENERATION_ORDER[a] ?? 999) - (GENERATION_ORDER[b] ?? 999))
      .forEach(gen => {
        if (groupedVersions[gen]) {
          data.push({ type: 'header', generation: gen });
          groupedVersions[gen].forEach(version => {
            data.push({ type: 'item', version });
          });
        }
      });
    return data;
  }, [groupedVersions]);

  const renderModalItem = ({
    item,
  }: {
    item: { type: 'header' | 'item'; generation?: string; version?: string };
  }) => {
    if (item.type === 'header') {
      return (
        <View style={styles.generationHeader}>
          <Text style={styles.generationHeaderText}>{item.generation}</Text>
        </View>
      );
    }
    const version = item.version!;
    const isSelected = selectedVersion === version;
    return (
      <Pressable
        onPress={() => handleVersionSelect(version)}
        style={[
          styles.versionItem,
          isSelected && { backgroundColor: colors.surfaceElevated },
          !isSelected && styles.versionItemSeparator,
        ]}
      >
        <Text style={styles.versionItemText}>{formatVersionName(version)}</Text>
        {isSelected && <Text style={styles.versionItemCheckmark}>✓</Text>}
      </Pressable>
    );
  };

  if (versions.length === 0 && !isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionHeader}>LOCATION ENCOUNTERS</Text>
        <Text style={styles.noVersionsEmptyState}>
          {pokemonName} cannot be caught in the wild. It is obtained via event, gift, or trade.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionHeader}>LOCATION ENCOUNTERS</Text>

      <Pressable
        onPress={openModal}
        style={styles.versionSelector}
        android_ripple={{ color: 'transparent' }}
      >
        <Text style={styles.versionSelectorText}>
          {selectedVersion ? formatVersionName(selectedVersion) : 'Select Version'}
        </Text>
        <Text style={styles.versionSelectorChevron}>▾</Text>
      </Pressable>

      {isLoading && selectedVersion ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          style={styles.encounterScrollView}
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}
          contentContainerStyle={styles.encounterContentContainer}
        >
          {selectedVersion && encounters.length === 0 ? (
            <Text style={styles.noEncountersEmptyState}>
              {pokemonName} cannot be caught in the wild in {formatVersionName(selectedVersion)}.
            </Text>
          ) : (
            Object.entries(grouped).map(([locationName, rows]) => (
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
            ))
          )}
        </ScrollView>
      )}

      <Modal
        visible={modalVisible}
        animationType="none"
        transparent={true}
        onRequestClose={closeModal}
      >
        <Pressable style={styles.backdropOverlay} onPress={closeModal} />
        <Animated.View
          style={[
            styles.sheet,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetHeaderText}>Select Game Version</Text>
          </View>
          <FlatList
            data={flatListData}
            renderItem={renderModalItem}
            keyExtractor={(item, index) =>
              item.type === 'header' ? `header-${item.generation}` : `version-${item.version}-${index}`
            }
            scrollEnabled={true}
            nestedScrollEnabled={true}
          />
        </Animated.View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
  },
  sectionHeader: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: spacing.md,
    alignSelf: 'stretch',
  },
  versionSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    alignSelf: 'stretch',
    paddingVertical: spacing.md,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    marginBottom: spacing.md,
  },
  versionSelectorText: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.text,
  },
  versionSelectorChevron: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  loadingContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  encounterScrollView: {
    maxHeight: 280,
  },
  encounterContentContainer: {
    paddingBottom: spacing.md,
  },
  locationCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
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
  noVersionsEmptyState: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  noEncountersEmptyState: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  backdropOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '70%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
  },
  sheetHeader: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sheetHeaderText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  generationHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  generationHeaderText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '600',
  },
  versionItem: {
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  versionItemSeparator: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  versionItemText: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  versionItemCheckmark: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.primary,
  },
});
