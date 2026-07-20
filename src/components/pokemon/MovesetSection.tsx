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
  Easing,
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
  'red-blue': 10, 'yellow': 15, 'red-green-japan': 10, 'blue-japan': 12,
  // Gen 2
  'gold-silver': 20, 'crystal': 25,
  // Gen 3
  'ruby-sapphire': 30, 'firered-leafgreen': 35, 'emerald': 37,
  'colosseum': 33, 'xd': 34,
  // Gen 4
  'diamond-pearl': 40, 'platinum': 45, 'heartgold-soulsilver': 47,
  // Gen 5
  'black-white': 50, 'black-2-white-2': 55,
  // Gen 6
  'x-y': 60, 'omega-ruby-alpha-sapphire': 65,
  // Gen 7
  'sun-moon': 70, 'ultra-sun-ultra-moon': 75, 'lets-go-pikachu-lets-go-eevee': 78,
  // Gen 8
  'sword-shield': 80,
  'the-isle-of-armor': 82, 'the-crown-tundra': 84,
  'brilliant-diamond-shining-pearl': 86, 'legends-arceus': 88,
  // Gen 9
  'scarlet-violet': 90, 'the-teal-mask': 92, 'the-indigo-disk': 94,
  // Future
  'champions': 96,
};

const GAME_GENERATION_MAP: Record<string, string> = {
  // Gen 9
  'scarlet-violet': 'Generation IX',
  'the-teal-mask': 'Generation IX',
  'the-indigo-disk': 'Generation IX',
  // Gen 8
  'sword-shield': 'Generation VIII',
  'the-isle-of-armor': 'Generation VIII',
  'the-crown-tundra': 'Generation VIII',
  'brilliant-diamond-shining-pearl': 'Generation VIII',
  'legends-arceus': 'Generation VIII',
  // Gen 7
  'sun-moon': 'Generation VII',
  'ultra-sun-ultra-moon': 'Generation VII',
  'lets-go-pikachu-lets-go-eevee': 'Generation VII',
  // Gen 6
  'x-y': 'Generation VI',
  'omega-ruby-alpha-sapphire': 'Generation VI',
  // Gen 5
  'black-white': 'Generation V',
  'black-2-white-2': 'Generation V',
  // Gen 4
  'diamond-pearl': 'Generation IV',
  'platinum': 'Generation IV',
  'heartgold-soulsilver': 'Generation IV',
  // Gen 3
  'ruby-sapphire': 'Generation III',
  'emerald': 'Generation III',
  'firered-leafgreen': 'Generation III',
  'colosseum': 'Generation III',
  'xd': 'Generation III',
  // Gen 2
  'gold-silver': 'Generation II',
  'crystal': 'Generation II',
  // Gen 1
  'red-blue': 'Generation I',
  'yellow': 'Generation I',
  'red-green-japan': 'Generation I',
  'blue-japan': 'Generation I',
  // Future
  'champions': 'Future',
};

const GENERATION_ORDER: Record<string, number> = {
  'Future': 0,
  'Generation IX': 1, 'Generation VIII': 2, 'Generation VII': 3,
  'Generation VI': 4, 'Generation V': 5, 'Generation IV': 6,
  'Generation III': 7, 'Generation II': 8, 'Generation I': 9,
};

interface MovesetSectionProps {
  pokemonId: number;
  pokemonName: string;
}

function formatVersionGroupName(slug: string): string {
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

interface CollapsibleSectionProps {
  title: string;
  moveCount: number;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  isFirst?: boolean;
}

function CollapsibleSection({
  title,
  moveCount,
  expanded,
  onToggle,
  children,
  isFirst = false,
}: CollapsibleSectionProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const measured = useRef(false);
  const animatedHeight = useRef(new Animated.Value(0)).current;
  const chevronAnim = useRef(new Animated.Value(1)).current;
  const countOpacity = useRef(new Animated.Value(0)).current;
  const measuredHeight = useRef(0);

  const toggleSection = () => {
    if (!measured.current) return;
    setIsAnimating(true);
    const newExpanded = !expanded;

    Animated.parallel([
      Animated.timing(chevronAnim, {
        toValue: newExpanded ? 1 : 0,
        duration: 150,
        useNativeDriver: false,
      }),
      Animated.timing(animatedHeight, {
        toValue: newExpanded ? measuredHeight.current : 0,
        duration: 200,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }),
      Animated.timing(countOpacity, {
        toValue: newExpanded ? 0 : 1,
        duration: 150,
        useNativeDriver: false,
      }),
    ]).start(() => {
      setIsAnimating(false);
      onToggle();
    });
  };

  const chevronRotation = chevronAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  const handleContentLayout = (e: any) => {
    const h = e.nativeEvent.layout.height;
    if (h <= 0) return;
    if (!measured.current) {
      measuredHeight.current = h;
      animatedHeight.setValue(h);
      measured.current = true;
    } else if (!isAnimating && expanded) {
      // Content height changed (e.g. search filter changed) — update tracked height and animated value
      measuredHeight.current = h;
      animatedHeight.setValue(h);
    }
  };

  // Before measuring: render without height constraint so content is visible and measurable.
  // After measuring: animatedHeight controls height for collapse/expand.
  // Using a ref for measured means no re-render fires when measurement completes.
  const contentStyle = measured.current
    ? [styles.collapsibleContentContainer, { height: animatedHeight }]
    : [styles.collapsibleContentContainer];

  return (
    <View style={[styles.collapsibleSectionContainer, !isFirst && { marginTop: spacing.lg }]}>
      <Pressable
        disabled={isAnimating}
        onPress={toggleSection}
        style={({ pressed }) => [
          styles.collapsibleHeader,
          pressed && !isAnimating && { opacity: 0.7 },
        ]}
      >
        <View style={styles.collapsibleHeaderLeft}>
          <Animated.Text
            style={[
              styles.chevronIcon,
              { transform: [{ rotate: chevronRotation }] },
            ]}
          >
            ›
          </Animated.Text>
          <Text style={styles.groupHeader}>{title}</Text>
        </View>
        <Animated.Text style={[styles.collapsedMoveCount, { opacity: countOpacity }]}>
          {moveCount === 1 ? '1 move' : `${moveCount} moves`}
        </Animated.Text>
      </Pressable>

      <Animated.View style={contentStyle}>
        <View onLayout={handleContentLayout} style={{ width: '100%' }}>
          {children}
        </View>
      </Animated.View>
    </View>
  );
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
  special: Move[];
};

type SectionExpandedState = {
  levelUp: boolean;
  tmHm: boolean;
  egg: boolean;
  tutor: boolean;
  special: boolean;
};

export function MovesetSection({ pokemonId, pokemonName }: MovesetSectionProps) {
  const router = useRouter();
  const { versions } = useMovesetVersions(pokemonId);
  const { moves, isLoading } = useMovesetForPokemon(pokemonId);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVersion, setSelectedVersion] = useState<string>('');
  const [modalVisible, setModalVisible] = useState(false);
  const [sectionExpanded, setSectionExpanded] = useState<SectionExpandedState>({
    levelUp: true,
    tmHm: true,
    egg: true,
    tutor: true,
    special: true,
  });

  const SHEET_HEIGHT = Dimensions.get('window').height * 0.7;
  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  // Reset selection when pokemon changes
  useEffect(() => {
    setSelectedVersion('');
  }, [pokemonId]);

  // Set default to newest available version once versions load (or after reset)
  useEffect(() => {
    if (versions.length > 0 && (!selectedVersion || !versions.includes(selectedVersion))) {
      const sortedVersions = sortVersionsByGeneration(versions);
      setSelectedVersion(sortedVersions[0]);
    }
  }, [versions.length, pokemonId]);

  // Modal animation
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
      special: [],
    };

    for (const move of filtered) {
      const method = move.learnMethod.toLowerCase();
      if (method === 'level-up') {
        result.levelUp.push(move);
      } else if (method === 'machine') {
        result.tmHm.push(move);
      } else if (method === 'egg' || method === 'light-ball-egg') {
        result.egg.push(move);
      } else if (method === 'tutor' || method === 'move-tutor') {
        result.tutor.push(move);
      } else {
        // train (Pokéathlon), xd-purification, form-change, zygarde-cube, stadium-surfing-pikachu
        result.special.push(move);
      }
    }

    // Sort each group
    result.levelUp.sort((a, b) => {
      if (a.learnLevel === null && b.learnLevel === null) return a.displayName.localeCompare(b.displayName);
      if (a.learnLevel === null) return -1;
      if (b.learnLevel === null) return 1;
      return a.learnLevel - b.learnLevel;
    });
    result.tmHm.sort((a, b) => a.displayName.localeCompare(b.displayName));
    result.egg.sort((a, b) => a.displayName.localeCompare(b.displayName));
    result.tutor.sort((a, b) => a.displayName.localeCompare(b.displayName));
    result.special.sort((a, b) => a.displayName.localeCompare(b.displayName));

    return result;
  }, [moves, selectedVersion, searchQuery]);

  const totalCount = groupedMoves.levelUp.length +
    groupedMoves.tmHm.length +
    groupedMoves.egg.length +
    groupedMoves.tutor.length +
    groupedMoves.special.length;

  const sortedVersions = sortVersionsByGeneration(versions);

  const flatListData = useMemo(() => {
    const groups: Record<string, string[]> = {};
    sortedVersions.forEach(version => {
      const gen = GAME_GENERATION_MAP[version] || 'Other';
      if (!groups[gen]) groups[gen] = [];
      groups[gen].push(version);
    });
    const data: Array<{ type: 'header' | 'item'; generation?: string; version?: string }> = [];
    Object.keys(GENERATION_ORDER)
      .sort((a, b) => (GENERATION_ORDER[a] ?? 999) - (GENERATION_ORDER[b] ?? 999))
      .forEach(gen => {
        if (groups[gen]) {
          data.push({ type: 'header', generation: gen });
          groups[gen].forEach(version => data.push({ type: 'item', version }));
        }
      });
    return data;
  }, [sortedVersions]);

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
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search moves..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <Pressable
            onPress={() => setSearchQuery('')}
            style={styles.searchClearButton}
            hitSlop={8}
          >
            <Text style={styles.searchClearIcon}>✕</Text>
          </Pressable>
        )}
      </View>

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
            <CollapsibleSection
              title="LEVEL UP"
              moveCount={groupedMoves.levelUp.length}
              expanded={sectionExpanded.levelUp}
              onToggle={() => setSectionExpanded(prev => ({ ...prev, levelUp: !prev.levelUp }))}
              isFirst={true}
            >
              {groupedMoves.levelUp.map((move) => (
                <MoveRow key={`${move.id}-level-${move.learnLevel}`} move={move} showLevelBadge />
              ))}
            </CollapsibleSection>
          )}

          {/* TM & HM Moves */}
          {groupedMoves.tmHm.length > 0 && (
            <CollapsibleSection
              title="TM & HM"
              moveCount={groupedMoves.tmHm.length}
              expanded={sectionExpanded.tmHm}
              onToggle={() => setSectionExpanded(prev => ({ ...prev, tmHm: !prev.tmHm }))}
            >
              {groupedMoves.tmHm.map((move) => (
                <MoveRow key={`${move.id}-tm`} move={move} showTmBadge />
              ))}
            </CollapsibleSection>
          )}

          {/* Egg Moves */}
          {groupedMoves.egg.length > 0 && (
            <CollapsibleSection
              title="EGG MOVES"
              moveCount={groupedMoves.egg.length}
              expanded={sectionExpanded.egg}
              onToggle={() => setSectionExpanded(prev => ({ ...prev, egg: !prev.egg }))}
            >
              {groupedMoves.egg.map((move) => (
                <MoveRow key={`${move.id}-egg`} move={move} />
              ))}
            </CollapsibleSection>
          )}

          {/* Tutor Moves */}
          {groupedMoves.tutor.length > 0 && (
            <CollapsibleSection
              title="TUTOR"
              moveCount={groupedMoves.tutor.length}
              expanded={sectionExpanded.tutor}
              onToggle={() => setSectionExpanded(prev => ({ ...prev, tutor: !prev.tutor }))}
            >
              {groupedMoves.tutor.map((move) => (
                <MoveRow key={`${move.id}-tutor`} move={move} />
              ))}
            </CollapsibleSection>
          )}

          {/* Special / Event Moves */}
          {groupedMoves.special.length > 0 && (
            <CollapsibleSection
              title="SPECIAL"
              moveCount={groupedMoves.special.length}
              expanded={sectionExpanded.special}
              onToggle={() => setSectionExpanded(prev => ({ ...prev, special: !prev.special }))}
            >
              {groupedMoves.special.map((move) => (
                <MoveRow key={`${move.id}-special`} move={move} />
              ))}
            </CollapsibleSection>
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
                data={flatListData}
                keyExtractor={(item, index) =>
                  item.type === 'header' ? `header-${item.generation}` : `version-${item.version}-${index}`
                }
                renderItem={({ item }) => {
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
                      onPress={() => { setSelectedVersion(version); closeModal(); }}
                      style={[styles.versionListItem, isSelected && styles.versionListItemSelected]}
                    >
                      <Text style={[styles.versionListItemText, isSelected && styles.versionListItemTextSelected]}>
                        {formatVersionGroupName(version)}
                      </Text>
                      {isSelected && <Text style={styles.checkmark}>✓</Text>}
                    </Pressable>
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
  showTmBadge?: boolean;
}

function MoveRow({ move, showLevelBadge = false, showTmBadge = false }: MoveRowProps) {
  const router = useRouter();
  const categoryIcon = CATEGORY_ICONS[move.category.toLowerCase()];

  return (
    <Pressable
      style={({ pressed }) => [
        styles.moveRow,
        pressed && styles.moveRowPressed,
      ]}
      onPress={() => router.push(`/(main)/(pokedex)/moves/${move.id}`)}
      hitSlop={8}
    >
      <View style={styles.leftColumn}>
        {/* Row 1: Level badge + TM badge + Move name */}
        <View style={styles.nameRow}>
          {showLevelBadge && (
            <Text style={styles.levelBadge}>Lv. {move.learnLevel !== null ? move.learnLevel : '—'}</Text>
          )}
          {showTmBadge && move.learnLabel !== null && (
            <Text style={styles.tmBadge}>{move.learnLabel}</Text>
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
    fontSize: fontSize.md,
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
  searchContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  searchInput: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius['2xl'],
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingRight: spacing.xl,
    fontSize: fontSize.md,
    color: colors.text,
  },
  searchClearButton: {
    position: 'absolute',
    right: spacing.md,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchClearIcon: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
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
  },
  collapsibleSectionContainer: {
    width: '100%',
  },
  collapsibleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.md,
  },
  collapsibleHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  chevronIcon: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginRight: spacing.sm,
    fontWeight: '600',
  },
  collapsedMoveCount: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  collapsibleContentContainer: {
    overflow: 'hidden',
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
  tmBadge: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: '#FFFFFF',
    backgroundColor: '#1565C0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  moveName: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    marginLeft: spacing.xs,
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
});
