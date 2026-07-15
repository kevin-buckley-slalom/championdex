import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { spacing, fontSize, borderRadius } from '@/constants/spacing';
import { MoveCategory } from '@/types';
import { useMovesList } from '@/hooks/queries/useMovesList';
import { useDebounce } from '@/hooks/ui/useDebounce';
import { SearchHeader } from '@/components/lists/SearchHeader';
import { MovesFilterSortSheet } from '@/components/lists/MovesFilterSortSheet';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { SubTabBar } from '@/components/lists/SubTabBar';
import { TypeBadge } from '@/components/common/TypeBadge';

const CATEGORY_ICONS: Record<string, any> = {
  physical: require('../../../assets/icons/moves/physical.png'),
  special: require('../../../assets/icons/moves/special.png'),
  status: require('../../../assets/icons/moves/status.png'),
  both: require('../../../assets/icons/moves/both.png'),
};

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
  moveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  leftColumn: {
    flex: 1,
    flexDirection: 'column',
    gap: spacing.xs,
  },
  moveName: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
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
  statBlock: {
    alignItems: 'center',
  },
  statBlockLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    width: 32,
    textAlign: 'center',
  },
  statBlockLabelPP: {
    paddingLeft: 13
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
  typeBadgeWrapper: {
    width: 75,
    height: 28,
  },
  categoryIcon: {
    width: 65,
    height: 28,
  },
  pressed: {
    opacity: 0.7,
  },
  chevron: {
    fontSize: fontSize.xl,
    color: colors.textMuted,
    marginLeft: spacing.sm,
  },
});

export default function MovesScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [selectedType, setSelectedType] = useState<string | undefined>(undefined);
  const [selectedCategory, setSelectedCategory] = useState<MoveCategory | undefined>(undefined);
  const [sortBy, setSortBy] = useState<'name' | 'power' | 'pp'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);

  const handleSearchChange = useCallback((text: string) => {
    setSearch(text);
  }, []);

  const { data, isLoading, error } = useMovesList({
    search: debouncedSearch,
    type: selectedType,
    category: selectedCategory,
    sortBy,
    sortDirection,
  });

  const handleTypeToggle = useCallback((type: string | undefined) => {
    setSelectedType(type);
  }, []);

  const handleCategoryToggle = useCallback((category: MoveCategory | undefined) => {
    setSelectedCategory(category);
  }, []);

  const handleTabPress = useCallback((tab: string) => {
    if (tab === 'pokemon') {
      router.navigate('/(main)/(pokedex)');
    } else if (tab === 'abilities') {
      router.navigate('/(main)/(pokedex)/abilities');
    } else if (tab === 'items') {
      router.navigate('/(main)/(pokedex)/items');
    }
  }, [router]);

  const handleFilterPress = useCallback(() => setFilterSheetVisible(true), []);

  const handleSortDirectionPress = useCallback(() => {
    setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
  }, []);

  const handleSortChange = useCallback((newSortBy: 'name' | 'power' | 'pp') => {
    if (newSortBy !== 'name' && sortBy === 'name') setSortDirection('desc');
    else if (newSortBy === 'name') setSortDirection('asc');
    setSortBy(newSortBy);
  }, [sortBy]);

  const handleMovePress = useCallback((moveId: number) => {
    router.push(`/(main)/(pokedex)/moves/${moveId}`);
  }, [router]);

  const renderMoveRow = useCallback(({ item }: { item: any }) => {
    const categoryIcon = CATEGORY_ICONS[item.category.toLowerCase()];

    return (
      <Pressable
        style={({ pressed }) => [styles.moveRow, pressed && styles.pressed]}
        onPress={() => handleMovePress(item.id)}
      >
        <View style={styles.leftColumn}>
          {/* Row 1: Move name */}
          <Text style={styles.moveName} numberOfLines={1}>
            {item.displayName}
          </Text>

          {/* Row 2: Type badge → Category icon → Pwr → Acc → PP */}
          <View style={styles.statsRow}>
            <View style={styles.typeBadgeWrapper}>
              <TypeBadge type={item.type} size="sm" fixed />
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
                <Text style={styles.statBlockValue}>{item.power !== null ? String(item.power) : '—'}</Text>
                <Text style={[styles.statBlockValue, styles.statBlockValueAcc]}>{item.accuracy !== null ? `${item.accuracy}%` : '—'}</Text>
                <Text style={styles.statBlockValue}>{String(item.pp)}</Text>
              </View>
            </View>
          </View>
        </View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>
    );
  }, []);

  const activeFilterCount = (selectedType ? 1 : 0) + (selectedCategory ? 1 : 0);

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <SearchHeader
        title="Moves"
        value={search}
        onChangeText={handleSearchChange}
        placeholder="Search moves..."
      />
      <SubTabBar activeTab="moves" onTabPress={handleTabPress} />
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
        <EmptyState message="Failed to load moves" subMessage={error.message} />
      ) : (
        <FlashList
          data={data ?? []}
          renderItem={renderMoveRow}
          keyExtractor={(item: any) => String(item.id)}
          {...{ estimatedItemSize: 76 } as any}
          keyboardDismissMode="interactive"
          ListEmptyComponent={
            isLoading
              ? <LoadingSpinner message="Loading moves..." />
              : <EmptyState message="No moves found" subMessage="Try adjusting your search or filters" />
          }
        />
      )}

      <MovesFilterSortSheet
        isVisible={filterSheetVisible}
        onClose={() => setFilterSheetVisible(false)}
        sortBy={sortBy}
        onSortChange={handleSortChange}
        selectedType={selectedType}
        onTypeToggle={handleTypeToggle}
        selectedCategory={selectedCategory}
        onCategoryToggle={handleCategoryToggle}
      />
    </SafeAreaView>
  );
}
