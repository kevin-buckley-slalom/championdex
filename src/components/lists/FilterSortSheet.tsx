import React, { useState, useEffect } from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typeColors } from '@/constants/colors';
import { spacing, fontSize, borderRadius } from '@/constants/spacing';
import { PokemonType } from '@/types';
import { TypeBadge } from '@/components/common/TypeBadge';
import { PokemonSortBy } from '@/hooks/queries/usePokemonList';

export interface FilterSortSheetProps {
  isVisible: boolean;
  onClose: () => void;
  sortBy: PokemonSortBy;
  onSortChange: (sortBy: PokemonSortBy) => void;
  selectedTypes: string[];
  onTypeToggle: (type: string) => void;
  selectedGeneration: number | undefined;
  onGenerationChange: (generation: number | undefined) => void;
  typeFilterMode: 'or' | 'and';
  onTypeFilterModeChange: (mode: 'or' | 'and') => void;
}

const SORT_OPTIONS: { label: string; value: PokemonSortBy }[] = [
  { label: 'Dex #', value: 'dex' },
  { label: 'Name', value: 'name' },
  { label: 'BST', value: 'total' },
  { label: 'HP', value: 'hp' },
  { label: 'Attack', value: 'attack' },
  { label: 'Defense', value: 'defense' },
  { label: 'Sp. Atk', value: 'specialAttack' },
  { label: 'Sp. Def', value: 'specialDefense' },
  { label: 'Speed', value: 'speed' },
];

const POKEMON_TYPES: PokemonType[] = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice',
  'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
  'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy',
];

const GENERATIONS = Array.from({ length: 9 }, (_, i) => i + 1);

const screenWidth = Dimensions.get('window').width;

export const FilterSortSheet: React.FC<FilterSortSheetProps> = ({
  isVisible,
  onClose,
  sortBy,
  onSortChange,
  selectedTypes,
  onTypeToggle,
  selectedGeneration,
  onGenerationChange,
  typeFilterMode,
  onTypeFilterModeChange,
}) => {
  const insets = useSafeAreaInsets();
  const [draftSortBy, setDraftSortBy] = useState<PokemonSortBy>(sortBy);
  const [draftTypes, setDraftTypes] = useState<string[]>(selectedTypes);
  const [draftGeneration, setDraftGeneration] = useState<number | undefined>(selectedGeneration);
  const [draftTypeFilterMode, setDraftTypeFilterMode] = useState<'or' | 'and'>(typeFilterMode);

  useEffect(() => {
    if (isVisible) {
      setDraftSortBy(sortBy);
      setDraftTypes(selectedTypes);
      setDraftGeneration(selectedGeneration);
      setDraftTypeFilterMode(typeFilterMode);
    }
  }, [isVisible, typeFilterMode]);

  const handleDone = () => {
    onSortChange(draftSortBy);
    const typesToAdd = draftTypes.filter(t => !selectedTypes.includes(t));
    const typesToRemove = selectedTypes.filter(t => !draftTypes.includes(t));
    typesToAdd.forEach(type => onTypeToggle(type));
    typesToRemove.forEach(type => onTypeToggle(type));
    onGenerationChange(draftGeneration);
    onTypeFilterModeChange(draftTypeFilterMode);
    onClose();
  };

  const handleClearFilters = () => {
    setDraftTypes([]);
    setDraftGeneration(undefined);
    setDraftTypeFilterMode('or');
  };

  const activeFilterCount = draftTypes.length + (draftGeneration ? 1 : 0) + (draftTypeFilterMode === 'and' ? 1 : 0);

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close filter sheet" />

        <View style={styles.sheet}>
          {/* Drag Handle */}
          <View style={styles.dragHandleContainer} accessible={false}>
            <View style={styles.dragHandle} />
          </View>

          <View style={styles.header}>
            <Text style={styles.title}>Filter & Sort</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Sort Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sort by</Text>
              <View style={styles.sortRow}>
                {SORT_OPTIONS.map((option) => {
                  const isSelected = draftSortBy === option.value;
                  const backgroundColor = isSelected
                    ? colors.primary
                    : colors.surfaceElevated;
                  const textColor = isSelected ? colors.accent : colors.textSecondary;

                  return (
                    <Pressable
                      key={option.value}
                      style={[styles.sortButton, { backgroundColor }]}
                      onPress={() => setDraftSortBy(option.value)}
                      accessibilityRole="button"
                      accessibilityLabel={`Sort by ${option.label}`}
                      accessibilityState={{ selected: isSelected }}
                    >
                      <Text style={[styles.sortButtonText, { color: textColor }]}>
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Type Filter Section */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Type</Text>
                <View style={styles.modeToggle}>
                  <Pressable
                    style={[styles.modeButton, draftTypeFilterMode === 'or' && styles.modeButtonActive]}
                    onPress={() => setDraftTypeFilterMode('or')}
                    accessibilityRole="button"
                    accessibilityLabel="Match any selected type"
                    accessibilityState={{ selected: draftTypeFilterMode === 'or' }}
                  >
                    <Text style={[styles.modeButtonText, draftTypeFilterMode === 'or' && styles.modeButtonTextActive]}>Any Type</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.modeButton, draftTypeFilterMode === 'and' && styles.modeButtonActive]}
                    onPress={() => {
                      setDraftTypeFilterMode('and');
                      setDraftTypes(prev => prev.slice(-2));
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Match both selected types"
                    accessibilityState={{ selected: draftTypeFilterMode === 'and' }}
                  >
                    <Text style={[styles.modeButtonText, draftTypeFilterMode === 'and' && styles.modeButtonTextActive]}>Dual-Type</Text>
                  </Pressable>
                </View>
              </View>
              <View style={styles.typeGrid}>
                {POKEMON_TYPES.map((type) => {
                  const isSelected = draftTypes.includes(type);
                  return (
                    <Pressable
                      key={type}
                      hitSlop={8}
                      style={[styles.typeGridItem, isSelected && styles.typeGridItemSelected]}
                      onPress={() => {
                        setDraftTypes(prev => {
                          if (prev.includes(type)) return prev.filter(t => t !== type);
                          if (draftTypeFilterMode === 'and' && prev.length >= 2) return [...prev.slice(1), type];
                          return [...prev, type];
                        });
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`${type.charAt(0).toUpperCase() + type.slice(1)} type`}
                      accessibilityState={{ selected: isSelected }}
                    >
                      <TypeBadge type={type} size="md" fixed />
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Generation Filter Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Generation</Text>
              <View style={styles.generationRow}>
                {GENERATIONS.map((gen) => {
                  const isSelected = draftGeneration === gen;
                  const backgroundColor = isSelected
                    ? colors.primary
                    : colors.surfaceElevated;
                  const textColor = isSelected ? colors.accent : colors.textSecondary;

                  return (
                    <Pressable
                      key={gen}
                      style={[styles.genButton, { backgroundColor }]}
                      onPress={() =>
                        setDraftGeneration(isSelected ? undefined : gen)
                      }
                      accessibilityRole="button"
                      accessibilityLabel={`Generation ${gen}`}
                      accessibilityState={{ selected: isSelected }}
                    >
                      <Text style={[styles.genButtonText, { color: textColor }]}>
                        Gen {gen}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={[styles.footer, { paddingBottom: Math.max(spacing.md, insets.bottom) }]}>
            {activeFilterCount > 0 && (
              <Pressable
                style={styles.clearButton}
                onPress={handleClearFilters}
              >
                <Text style={styles.clearButtonText}>Clear Filters</Text>
              </Pressable>
            )}
            <Pressable
              style={styles.doneButton}
              onPress={handleDone}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '92%',
    minHeight: '75%',
    flexDirection: 'column',
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: borderRadius.full,
    backgroundColor: colors.borderLight,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  closeButton: {
    padding: spacing.xs,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: fontSize.lg,
    color: colors.textMuted,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  modeToggle: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  modeButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius['2xl'],
    backgroundColor: colors.surfaceElevated,
    minHeight: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeButtonActive: {
    backgroundColor: colors.primary,
  },
  modeButtonText: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  modeButtonTextActive: {
    color: colors.accent,
  },
  sortRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  sortButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 44,
    minWidth: 72,
  },
  sortButtonText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  typeGridItem: {
    width: '30%',
    height: 36,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  typeGridItemSelected: {
    borderColor: colors.accent,
  },
  generationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  genButton: {
    width: '19%',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 44,
  },
  genButtonText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  clearButton: {
    flex: 1,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 44,
  },
  clearButtonText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  doneButton: {
    flex: 1,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 44,
  },
  doneButtonText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.accent,
  },
});
