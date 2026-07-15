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
import { colors } from '@/constants/colors';
import { spacing, fontSize, borderRadius } from '@/constants/spacing';
import { ItemCategory } from '@/types';

export interface ItemsFilterSortSheetProps {
  isVisible: boolean;
  onClose: () => void;
  sortBy: 'name' | 'category';
  onSortChange: (sortBy: 'name' | 'category') => void;
  selectedCategory: ItemCategory | undefined;
  onCategoryToggle: (category: ItemCategory | undefined) => void;
}

const SORT_OPTIONS: { label: string; value: 'name' | 'category' }[] = [
  { label: 'Name', value: 'name' },
  { label: 'Category', value: 'category' },
];

const ITEM_CATEGORIES: { label: string; value: ItemCategory }[] = [
  { label: 'Held', value: 'held' },
  { label: 'Berry', value: 'berry' },
  { label: 'Medicine', value: 'medicine' },
  { label: 'Poké Ball', value: 'pokeball' },
  { label: 'Battle', value: 'battle' },
  { label: 'Key', value: 'key' },
];

export const ItemsFilterSortSheet: React.FC<ItemsFilterSortSheetProps> = ({
  isVisible,
  onClose,
  sortBy,
  onSortChange,
  selectedCategory,
  onCategoryToggle,
}) => {
  const insets = useSafeAreaInsets();
  const [draftSortBy, setDraftSortBy] = useState(sortBy);
  const [draftCategory, setDraftCategory] = useState(selectedCategory);

  useEffect(() => {
    if (isVisible) {
      setDraftSortBy(sortBy);
      setDraftCategory(selectedCategory);
    }
  }, [isVisible, sortBy, selectedCategory]);

  const handleDone = () => {
    onSortChange(draftSortBy);
    onCategoryToggle(draftCategory);
    onClose();
  };

  const handleClearFilters = () => {
    setDraftCategory(undefined);
  };

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

            {/* Category Filter Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Category</Text>
              <View style={styles.categoryRow}>
                {ITEM_CATEGORIES.map((cat) => {
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
                      accessibilityLabel={`Filter by ${cat.label}`}
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
            {draftCategory && (
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
