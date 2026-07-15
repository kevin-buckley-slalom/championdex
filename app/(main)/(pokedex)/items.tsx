import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { spacing, fontSize, borderRadius } from '@/constants/spacing';
import { ItemCategory } from '@/types';
import { useItemsList } from '@/hooks/queries/useItemsList';
import { useDebounce } from '@/hooks/ui/useDebounce';
import { SearchHeader } from '@/components/lists/SearchHeader';
import { ItemsFilterSortSheet } from '@/components/lists/ItemsFilterSortSheet';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { SubTabBar } from '@/components/lists/SubTabBar';

export default function ItemsScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [selectedCategory, setSelectedCategory] = useState<ItemCategory | undefined>(undefined);
  const [sortBy, setSortBy] = useState<'name' | 'category'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);

  const { data, isLoading, error } = useItemsList({
    search: debouncedSearch,
    category: selectedCategory,
    sortBy,
    sortDirection,
  });

  const handleSearchChange = useCallback((text: string) => {
    setSearch(text);
  }, []);

  const handleCategoryToggle = useCallback((category: ItemCategory | undefined) => {
    setSelectedCategory(category);
  }, []);

  const handleTabPress = useCallback((tab: string) => {
    if (tab === 'pokemon') {
      router.navigate('/(main)/(pokedex)');
    } else if (tab === 'moves') {
      router.navigate('/(main)/(pokedex)/moves');
    } else if (tab === 'abilities') {
      router.navigate('/(main)/(pokedex)/abilities');
    }
  }, [router]);

  const handleFilterPress = useCallback(() => setFilterSheetVisible(true), []);

  const handleSortDirectionPress = useCallback(() => {
    setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
  }, []);

  const handleSortChange = useCallback((newSortBy: 'name' | 'category') => {
    if (newSortBy !== 'name' && sortBy === 'name') setSortDirection('desc');
    else if (newSortBy === 'name') setSortDirection('asc');
    setSortBy(newSortBy);
  }, [sortBy]);

  const handleItemPress = useCallback((itemId: number) => {
    router.push(`/(main)/(pokedex)/items/${itemId}`);
  }, [router]);

  const renderItemRow = useCallback(({ item }: any) => (
    <Pressable
      style={({ pressed }) => [styles.itemRow, pressed && styles.itemRowPressed]}
      onPress={() => handleItemPress(item.id)}
    >
      <View style={styles.itemContent}>
        <Text style={styles.itemName}>{item.displayName}</Text>
        <Text style={styles.itemDescription}>{item.shortDescription}</Text>
      </View>
      <View style={styles.categoryBadge}>
        <Text style={styles.categoryBadgeText}>
          {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
        </Text>
      </View>
    </Pressable>
  ), [handleItemPress]);

  const activeFilterCount = selectedCategory ? 1 : 0;

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <SearchHeader
        title="Items"
        value={search}
        onChangeText={handleSearchChange}
        placeholder="Search items..."
      />
      <SubTabBar
        activeTab="items"
        onTabPress={handleTabPress}
      />

      {/* Toolbar */}
      <View style={styles.toolbar}>
        <Pressable
          style={styles.filterButton}
          onPress={handleFilterPress}
          accessibilityRole="button"
          accessibilityLabel={`Filter and sort. ${activeFilterCount} filters active.`}
        >
          <Text style={styles.filterButtonText}>
            ⚙ Filter & Sort
            {activeFilterCount > 0 && ` (${activeFilterCount})`}
          </Text>
        </Pressable>

        <Pressable
          style={styles.directionButton}
          onPress={handleSortDirectionPress}
          accessibilityRole="button"
          accessibilityLabel={`Sort ${sortDirection === 'asc' ? 'ascending' : 'descending'}`}
        >
          <Text style={styles.directionButtonText}>
            {sortDirection === 'asc' ? '↑' : '↓'} {sortDirection === 'asc' ? 'Asc' : 'Desc'}
          </Text>
        </Pressable>
      </View>

      {error ? (
        <EmptyState message="Failed to load items" subMessage={error.message} />
      ) : (
        <FlashList
          data={data}
          renderItem={renderItemRow}
          keyExtractor={(item: any) => String(item.id)}
          {...{ estimatedItemSize: 88 } as any}
          keyboardDismissMode="interactive"
          ListEmptyComponent={
            isLoading
              ? <LoadingSpinner message="Loading items..." />
              : <EmptyState
                  message="No items found"
                  subMessage="Try adjusting your search or filters"
                />
          }
        />
      )}

      <ItemsFilterSortSheet
        isVisible={filterSheetVisible}
        onClose={() => setFilterSheetVisible(false)}
        sortBy={sortBy}
        onSortChange={handleSortChange}
        selectedCategory={selectedCategory}
        onCategoryToggle={handleCategoryToggle}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  toolbar: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterButton: {
    flex: 1,
    minHeight: 44,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius['2xl'],
    backgroundColor: colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButtonText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  directionButton: {
    minHeight: 44,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius['2xl'],
    backgroundColor: colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  directionButtonText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  itemRow: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemRowPressed: {
    opacity: 0.7,
  },
  itemContent: {
    flex: 1,
    marginRight: spacing.sm,
  },
  itemName: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  itemDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  categoryBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: 4,
  },
  categoryBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.accent,
  },
});
