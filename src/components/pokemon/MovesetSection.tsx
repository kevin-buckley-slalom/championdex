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
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { spacing, fontSize, borderRadius } from '@/constants/spacing';
import { useMovesetForPokemon, useMovesetVersions, Move } from '@/hooks/queries/useMovesetForPokemon';
import { TypeBadge } from '@/components/common/TypeBadge';

const CATEGORY_ICONS: Record<string, any> = {
  physical: require('@assets/icons/moves/physical.png'),
  special: require('@assets/icons/moves/special.png'),
  status: require('@assets/icons/moves/status.png'),
  both: require('@assets/icons/moves/both.png'),
};

// Canonical game release order — highest generation first for default selection
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

interface MovesetSectionProps {
  pokemonId: number;
  pokemonName: string;
}

function formatVersionGroupName(slug: string): string {
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function sortVersionsByGeneration(versions: string[]): string[] {
  return [...versions].sort((a, b) => {
    const scoreB = GAME_VERSION_ORDER[b] ?? 0;
    const scoreA = GAME_VERSION_ORDER[a] ?? 0;
    if (scoreB !== scoreA) return scoreB - scoreA;
    return a.localeCompare(b); // stable tiebreaker
  });
}

type GroupedMoves = {
  levelUp: Move[];
  tmHm: Move[];
  egg: Move[];
  tutor: Move[];
  other: Move[];
};

export function MovesetSection({ pokemonId, pokemonName }: MovesetSectionProps) {
  const router = useRouter();
  const { versions } = useMovesetVersions(pokemonId);
  const { moves, isLoading } = useMovesetForPokemon(pokemonId);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVersion, setSelectedVersion] = useState<string>('');
  const [modalVisible, setModalVisible] = useState(false);

  const SHEET_HEIGHT = Dimensions.get('window').height * 0.7;
  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  // Auto-select most recent version when versions arrive
  useEffect(() => {
    if (versions.length > 0 && !selectedVersion) {
      const sortedVersions = sortVersionsByGeneration(versions);
      setSelectedVersion(sortedVersions[0]);
    }
  }, [versions, selectedVersion]);

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

  // Group and filter moves by selected version and search query
  const groupedMoves = useMemo(() => {
    let filtered = moves.filter(m => m.versionGroup === selectedVersion);

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(m => m.displayName.toLowerCase().includes(q));
    }

    const result: GroupedMoves = {
      levelUp: [],
      tmHm: [],
      egg: [],
      tutor: [],
      other: [],
    };

    for (const move of filtered) {
      const method = move.learnMethod.toLowerCase();
      if (method === 'level-up') {
        result.levelUp.push(move);
      } else if (method === 'tm' || method === 'hm') {
        result.tmHm.push(move);
      } else if (method === 'egg') {
        result.egg.push(move);
      } else if (method === 'tutor' || method === 'move-tutor') {
        result.tutor.push(move);
      } else {
        result.other.push(move);
      }
    }

    // Sort each group
    result.levelUp.sort((a, b) => (a.learnLevel ?? Infinity) - (b.learnLevel ?? Infinity));
    result.tmHm.sort((a, b) => a.displayName.localeCompare(b.displayName));
    result.egg.sort((a, b) => a.displayName.localeCompare(b.displayName));
    result.tutor.sort((a, b) => a.displayName.localeCompare(b.displayName));
    result.other.sort((a, b) => a.displayName.localeCompare(b.displayName));

    return result;
  }, [moves, selectedVersion, searchQuery]);

  const totalCount = groupedMoves.levelUp.length +
    groupedMoves.tmHm.length +
    groupedMoves.egg.length +
    groupedMoves.tutor.length +
    groupedMoves.other.length;

  const sortedVersions = sortVersionsByGeneration(versions);

  if (versions.length === 0 && !isLoading) {
    return (
      <View>
        <Text style={styles.sectionHeader}>
          MOVESET <Text style={styles.moveCount}>(0)</Text>
        </Text>
        <Text style={styles.noDataEmptyState}>
          Move data not available for this Pokémon
        </Text>
      </View>
    );
  }

  return (
    <View>
      <Text style={styles.sectionHeader}>
        MOVESET <Text style={styles.moveCount}>({totalCount})</Text>
      </Text>

      {/* Search Input */}
      <TextInput
        style={styles.searchInput}
        placeholder="Search moves..."
        placeholderTextColor={colors.textMuted}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {/* Game Version Selector */}
      {versions.length > 1 && (
        <Pressable
          onPress={() => setModalVisible(true)}
          style={({ pressed }) => [
            styles.versionSelector,
            pressed && { opacity: 0.7 },
          ]}
        >
          <Text style={styles.versionSelectorText}>
            {selectedVersion ? formatVersionGroupName(selectedVersion) : 'Select Version'} ▾
          </Text>
        </Pressable>
      )}

      {/* Loading State */}
      {isLoading ? (
        <ActivityIndicator size="large" color={colors.textSecondary} style={{ marginTop: spacing.lg }} />
      ) : totalCount === 0 ? (
        <Text style={styles.noMovesEmptyState}>No moves found</Text>
      ) : (
        <>
          {/* Level Up Moves */}
          {groupedMoves.levelUp.length > 0 && (
            <View>
              <Text style={styles.groupHeader}>LEVEL UP</Text>
              {groupedMoves.levelUp.map((move) => (
                <MoveRow key={`${move.id}-level-${move.learnLevel}`} move={move} showLevelBadge />
              ))}
            </View>
          )}

          {/* TM & HM Moves */}
          {groupedMoves.tmHm.length > 0 && (
            <View>
              <Text style={[styles.groupHeader, { marginTop: spacing.lg }]}>TM & HM</Text>
              {groupedMoves.tmHm.map((move) => (
                <MoveRow key={`${move.id}-tm`} move={move} />
              ))}
            </View>
          )}

          {/* Egg Moves */}
          {groupedMoves.egg.length > 0 && (
            <View>
              <Text style={[styles.groupHeader, { marginTop: spacing.lg }]}>EGG MOVES</Text>
              {groupedMoves.egg.map((move) => (
                <MoveRow key={`${move.id}-egg`} move={move} />
              ))}
            </View>
          )}

          {/* Tutor Moves */}
          {groupedMoves.tutor.length > 0 && (
            <View>
              <Text style={[styles.groupHeader, { marginTop: spacing.lg }]}>TUTOR</Text>
              {groupedMoves.tutor.map((move) => (
                <MoveRow key={`${move.id}-tutor`} move={move} />
              ))}
            </View>
          )}

          {/* Other Moves */}
          {groupedMoves.other.length > 0 && (
            <View>
              <Text style={[styles.groupHeader, { marginTop: spacing.lg }]}>OTHER</Text>
              {groupedMoves.other.map((move) => (
                <MoveRow key={`${move.id}-other`} move={move} />
              ))}
            </View>
          )}
        </>
      )}

      {/* Version Selector Modal */}
      {versions.length > 1 && (
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
                data={sortedVersions}
                keyExtractor={(version) => version}
                renderItem={({ item: version, index: idx }) => {
                  const isSelected = selectedVersion === version;
                  const isLastItem = idx === sortedVersions.length - 1;

                  return (
                    <View>
                      <Pressable
                        onPress={() => {
                          setSelectedVersion(version);
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
                          {formatVersionGroupName(version)}
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
      )}
    </View>
  );
}

interface MoveRowProps {
  move: Move;
  showLevelBadge?: boolean;
}

function MoveRow({ move, showLevelBadge = false }: MoveRowProps) {
  const router = useRouter();
  const categoryIcon = CATEGORY_ICONS[move.category.toLowerCase()];

  return (
    <Pressable
      style={({ pressed }) => [
        styles.moveRow,
        pressed && styles.moveRowPressed,
      ]}
      onPress={() => router.push(`/(main)/(pokedex)/moves/${move.id}`)}
    >
      <View style={styles.leftColumn}>
        {/* Row 1: Level badge + Move name */}
        <View style={styles.nameRow}>
          {showLevelBadge && (
            <Text style={styles.levelBadge}>Lv. {move.learnLevel !== null ? move.learnLevel : '—'}</Text>
          )}
          <Text style={styles.moveName} numberOfLines={1}>
            {move.displayName}
          </Text>
        </View>

        {/* Row 2: Type badge → Category icon → Stats */}
        <View style={styles.statsRow}>
          <View style={styles.typeBadgeWrapper}>
            <TypeBadge type={move.type} size="sm" fixed />
          </View>

          {categoryIcon && (
            <Image
              source={categoryIcon}
              style={styles.categoryIcon}
              contentFit="fill"
            />
          )}

          <View style={styles.statBlocks}>
            <View style={styles.statHeaderRow}>
              <Text style={styles.statBlockLabel}>Pwr</Text>
              <Text style={styles.statBlockLabel}>Acc</Text>
              <Text style={[styles.statBlockLabel, styles.statBlockLabelPP]}>PP</Text>
            </View>
            <View style={styles.statValueRow}>
              <Text style={styles.statBlockValue}>{move.power !== null ? String(move.power) : '—'}</Text>
              <Text style={[styles.statBlockValue, styles.statBlockValueAcc]}>{move.accuracy !== null ? `${move.accuracy}%` : '—'}</Text>
              <Text style={styles.statBlockValue}>{String(move.pp)}</Text>
            </View>
          </View>
        </View>
      </View>

      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: spacing.md,
  },
  moveCount: {
    fontWeight: '600',
    color: colors.textSecondary,
  },
  searchInput: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius['2xl'],
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    marginBottom: spacing.md,
  },
  versionSelector: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.md,
  },
  versionSelectorText: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.text,
  },
  groupHeader: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.md,
  },
  moveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  moveRowPressed: {
    opacity: 0.7,
  },
  leftColumn: {
    flex: 1,
    flexDirection: 'column',
    gap: spacing.xs,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  levelBadge: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.accent,
    backgroundColor: 'rgba(255,215,0,0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  moveName: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  typeBadgeWrapper: {
    width: 75,
    height: 28,
  },
  categoryIcon: {
    width: 65,
    height: 28,
  },
  statBlocks: {
    flexDirection: 'column',
    marginLeft: spacing.md,
  },
  statHeaderRow: {
    flexDirection: 'row',
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 1,
    marginBottom: 2,
  },
  statValueRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statBlockLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    width: 32,
    textAlign: 'center',
  },
  statBlockLabelPP: {
    paddingLeft: 13,
  },
  statBlockValue: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
    width: 32,
    textAlign: 'center',
  },
  statBlockValueAcc: {
    paddingLeft: 4,
    width: 38,
  },
  chevron: {
    fontSize: fontSize.xl,
    color: colors.textMuted,
    marginLeft: spacing.sm,
  },
  noMovesEmptyState: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  noDataEmptyState: {
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
