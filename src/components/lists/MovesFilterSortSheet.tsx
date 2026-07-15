import React, { useState, useEffect } from 'react';
import {
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
import { PokemonType, MoveCategory } from '@/types';
import { TypeBadge } from '@/components/common/TypeBadge';

export interface MovesFilterSortSheetProps {
  isVisible: boolean;
  onClose: () => void;
  sortBy: 'name' | 'power' | 'pp';
  onSortChange: (sortBy: 'name' | 'power' | 'pp') => void;
  selectedType: string | undefined;
  onTypeToggle: (type: string | undefined) => void;
  selectedCategory: MoveCategory | undefined;
  onCategoryToggle: (category: MoveCategory | undefined) => void;
}

const SORT_OPTIONS: { label: string; value: 'name' | 'power' | 'pp' }[] = [
  { label: 'Name', value: 'name' },
  { label: 'Power', value: 'power' },
  { label: 'PP', value: 'pp' },
];

const POKEMON_TYPES: PokemonType[] = [
  'normal', 'fire', 'water', 'electric', 'grass', 'ice',
  'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
  'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy',
];

const CATEGORIES: { label: string; value: MoveCategory }[] = [
  { label: 'Physical', value: 'physical' },
  { label: 'Special', value: 'special' },
  { label: 'Status', value: 'status' },
];

export const CATEGORY_COLORS: Record<MoveCategory, string> = {
  physical: '#C03028',
  special: '#6890F0',
  status: '#A8A878',
};

export const MovesFilterSortSheet: React.FC<MovesFilterSortSheetProps> = ({
  isVisible,
  onClose,
  sortBy,
  onSortChange,
  selectedType,
  onTypeToggle,
  selectedCategory,
  onCategoryToggle,
}) => {
  const insets = useSafeAreaInsets();
  const [draftSortBy, setDraftSortBy] = useState(sortBy);
  const [draftType, setDraftType] = useState(selectedType);
  const [draftCategory, setDraftCategory] = useState(selectedCategory);

  useEffect(() => {
    if (isVisible) {
      setDraftSortBy(sortBy);
      setDraftType(selectedType);
      setDraftCategory(selectedCategory);
    }
  }, [isVisible, sortBy, selectedType, selectedCategory]);

  const handleDone = () => {
    onSortChange(draftSortBy);
    onTypeToggle(draftType);
    onCategoryToggle(draftCategory);
    onClose();
  };

  const handleClearFilters = () => {
    setDraftType(undefined);
    setDraftCategory(undefined);
  };

  const activeFilterCount = (draftType ? 1 : 0) + (draftCategory ? 1 : 0);

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
            <Pressable
              onPress={onClose}
              style={styles.closeButton}
              accessibilityLabel="Close"
              accessibilityRole="button"
            >
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
              <Text style={styles.sectionTitle}>Type</Text>
              <View style={styles.typeGrid}>
                {POKEMON_TYPES.map((type) => {
                  const isSelected = draftType === type;
                  return (
                    <Pressable
                      key={type}
                      hitSlop={8}
                      style={[styles.typeGridItem, isSelected && styles.typeGridItemSelected]}
                      onPress={() => {
                        setDraftType(isSelected ? undefined : type);
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

            {/* Category Filter Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Category</Text>
              <View style={styles.categoryRow}>
                {CATEGORIES.map((cat) => {
                  const isSelected = draftCategory === cat.value;
                  const backgroundColor = isSelected
                    ? colors.primary
                    : colors.surfaceElevated;
                  const textColor = isSelected ? colors.accent : colors.textSecondary;

                  return (
                    <Pressable
                      key={cat.value}
                      style={[styles.categoryButton, { backgroundColor }]}
                      onPress={() => {
                        setDraftCategory(isSelected ? undefined : cat.value);
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`Filter by ${cat.label} moves`}
                      accessibilityState={{ selected: isSelected }}
                    >
                      <Text style={[styles.categoryButtonText, { color: textColor }]}>
                        {cat.label}
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
                accessibilityRole="button"
                accessibilityLabel="Clear all filters"
              >
                <Text style={styles.clearButtonText}>Clear Filters</Text>
              </Pressable>
            )}
            <Pressable
              style={styles.doneButton}
              onPress={handleDone}
              accessibilityRole="button"
              accessibilityLabel="Apply filters and sorting"
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
  sectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.textMuted,
    marginBottom: spacing.sm,
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
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryButton: {
    flex: 1,
    minWidth: '30%',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 44,
  },
  categoryButtonText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    textAlign: 'center',
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
