import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Modal,
  Pressable,
  Text,
  StyleSheet,
  FlatList,
  Animated,
  Dimensions,
} from 'react-native';
import { colors } from '@/constants/colors';
import { spacing, fontSize, borderRadius } from '@/constants/spacing';
import { PokemonFlavorText } from '@/services/database/pokemonSpeciesRepository';

interface FlavorTextSectionProps {
  flavorTexts: PokemonFlavorText[];
  accentColor: string;
}

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

function formatGameVersion(gameVersion: string): string {
  if (gameVersion === 'default') return 'Pokédex Entry';
  return gameVersion
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function getGenerationLabel(gameVersionSlug: string): string {
  return GAME_GENERATION_MAP[gameVersionSlug] ?? 'Other';
}

type ModalItem =
  | { type: 'header'; label: string }
  | { type: 'item'; entry: PokemonFlavorText; index: number };

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
  const [modalVisible, setModalVisible] = useState(false);

  const SHEET_HEIGHT = Dimensions.get('window').height * 0.7;
  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  useEffect(() => {
    if (modalVisible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [modalVisible, slideAnim]);

  function closeModal() {
    Animated.timing(slideAnim, {
      toValue: SHEET_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setModalVisible(false));
  }

  // Build modal data: group by generation, newest first
  const modalData = useMemo(() => {
    const grouped: Record<string, PokemonFlavorText[]> = {};

    uniqueVersions.forEach((entry, idx) => {
      const generation = getGenerationLabel(entry.gameVersion);
      if (!grouped[generation]) {
        grouped[generation] = [];
      }
      grouped[generation].push(entry);
    });

    // Sort generations newest to oldest
    const generationOrder = [
      'Generation IX', 'Generation VIII', 'Generation VII', 'Generation VI',
      'Generation V', 'Generation IV', 'Generation III', 'Generation II',
      'Generation I', 'Other',
    ];

    const result: ModalItem[] = [];
    for (const generation of generationOrder) {
      if (grouped[generation]) {
        result.push({ type: 'header', label: generation });
        grouped[generation].forEach((entry) => {
          const index = uniqueVersions.findIndex((v) => v.gameVersion === entry.gameVersion);
          result.push({ type: 'item', entry, index });
        });
      }
    }
    return result;
  }, [uniqueVersions]);

  if (uniqueVersions.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionHeader}>POKÉDEX ENTRIES</Text>
        <Text style={styles.emptyMessage}>No Pokédex entries available</Text>
      </View>
    );
  }

  const selectedEntry = uniqueVersions[selectedIndex];

  if (uniqueVersions.length === 1) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionHeader}>POKÉDEX ENTRIES</Text>
        <View style={[styles.flavorCard, { borderLeftColor: accentColor }]}>
          <Text style={styles.flavorText}>{selectedEntry.flavorText}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionHeader}>POKÉDEX ENTRIES</Text>

      <Pressable
        onPress={() => setModalVisible(true)}
        style={({ pressed }) => [
          styles.versionSelectorButton,
          pressed && { opacity: 0.7 },
        ]}
      >
        <Text style={styles.versionSelectorText}>
          {formatGameVersion(selectedEntry.gameVersion)}
        </Text>
        <Text style={styles.chevron}>▾</Text>
      </Pressable>

      <View style={[styles.flavorCard, { borderLeftColor: accentColor }]}>
        <Text style={styles.flavorText}>{selectedEntry.flavorText}</Text>
      </View>

      <Modal
        visible={modalVisible}
        animationType="none"
        transparent={true}
        onRequestClose={closeModal}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={closeModal}
        >
          <Animated.View style={[styles.modalSheet, { transform: [{ translateY: slideAnim }] }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalHeaderText}>Select Game Version</Text>
            </View>

            <FlatList
              data={modalData}
              keyExtractor={(item, idx) => {
                if (item.type === 'header') return `header-${item.label}`;
                return `item-${item.entry.gameVersion}-${idx}`;
              }}
              renderItem={({ item, index: itemIndex }) => {
                if (item.type === 'header') {
                  return (
                    <View style={styles.generationHeader}>
                      <Text style={styles.generationHeaderText}>{item.label}</Text>
                    </View>
                  );
                }

                const isSelected = selectedIndex === item.index;
                const isLastItem = itemIndex === modalData.length - 1;

                return (
                  <View>
                    <Pressable
                      onPress={() => {
                        setSelectedIndex(item.index);
                        closeModal();
                      }}
                      style={[
                        styles.versionListItem,
                        isSelected && styles.versionListItemSelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.versionListItemText,
                          isSelected && styles.versionListItemTextSelected,
                        ]}
                      >
                        {formatGameVersion(item.entry.gameVersion)}
                      </Text>
                      {isSelected && <Text style={styles.checkmark}>✓</Text>}
                    </Pressable>
                    {!isLastItem && <View style={styles.separator} />}
                  </View>
                );
              }}
            />
          </Animated.View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  sectionHeader: {
    alignSelf: 'stretch',
    fontSize: 15,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: spacing.md,
  },
  versionSelectorButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    alignSelf: 'stretch',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  versionSelectorText: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.text,
  },
  chevron: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  flavorCard: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: borderRadius.md,
    borderLeftWidth: 3,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    alignSelf: 'stretch',
  },
  flavorText: {
    fontSize: fontSize.md,
    lineHeight: fontSize.md * 1.6,
    color: colors.text,
    fontStyle: 'italic',
    letterSpacing: 0.3,
  },
  emptyMessage: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '70%',
  },
  modalHeader: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalHeaderText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  generationHeader: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  generationHeaderText: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '600',
  },
  versionListItem: {
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  versionListItemSelected: {
    backgroundColor: colors.surfaceElevated,
  },
  versionListItemText: {
    fontSize: fontSize.md,
    color: colors.text,
  },
  versionListItemTextSelected: {
    fontWeight: '500',
  },
  checkmark: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.primary,
  },
  separator: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    opacity: 0.4,
  },
});
