import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { colors, typeColors } from '@/constants/colors';
import { spacing, fontSize, borderRadius } from '@/constants/spacing';
import { PokemonType } from '@/types';
import { usePokemonList, PokemonSortBy } from '@/hooks/queries/usePokemonList';
import { useDebounce } from '@/hooks/ui/useDebounce';
import { SearchHeader } from '@/components/lists/SearchHeader';
import { PokemonCard } from '@/components/pokemon/PokemonCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { SubTabBar } from '@/components/lists/SubTabBar';
import { FilterSortSheet } from '@/components/lists/FilterSortSheet';
import { getPokemonById } from '@/services/database/pokemonRepository';
import { Image } from 'expo-image';
import { getHomeRenderUrl } from '@/services/prefetch/artworkPrefetchService';

export default function PokedexScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<PokemonSortBy>('dex');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedGeneration, setSelectedGeneration] = useState<number | undefined>(undefined);
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const [typeFilterMode, setTypeFilterMode] = useState<'or' | 'and'>('or');

  // Note: Removed useFocusEffect that was resetting state on every focus
  // This was causing constant query key changes and refetches
  // Users expect filter state to persist when returning to the screen

  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } = usePokemonList({
    search: debouncedSearch,
    types: selectedTypes as PokemonType[],
    sortBy,
    sortDirection,
    generation: selectedGeneration,
    typeFilterMode,
    pageSize: 50,
  });

  const handleSearchChange = useCallback((text: string) => {
    setSearch(text);
  }, []);

  const handleTypeToggle = useCallback((type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  }, []);

  const handlePokemonPress = useCallback((pokemonId: number) => {
    let navigationPending = true;

    const performNavigation = () => {
      if (navigationPending) {
        navigationPending = false;
        router.push(`/(main)/(pokedex)/${pokemonId}`);
      }
    };

    const prefetchAndNavigate = async () => {
      try {
        await queryClient.prefetchQuery({
          queryKey: ['pokemon', 'detail', pokemonId],
          queryFn: () => getPokemonById(pokemonId),
          staleTime: Infinity,
        });

        const cached = queryClient.getQueryData<{ pokeApiId?: number }>(['pokemon', 'detail', pokemonId]);
        if (cached?.pokeApiId) {
          const artworkUrl = getHomeRenderUrl(cached.pokeApiId);
          await Image.prefetch(artworkUrl);
        }
      } catch (error) {
        console.warn('[Pokedex] Prefetch error:', error);
      } finally {
        performNavigation();
      }
    };

    setTimeout(() => performNavigation(), 250);
    prefetchAndNavigate();
  }, [router, queryClient]);

  const renderPokemonCard = useCallback(({ item }: any) => (
    <PokemonCard pokemon={item} onPress={() => handlePokemonPress(item.id)} sortBy={sortBy} />
  ), [handlePokemonPress, sortBy]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleTabPress = useCallback((tab: string) => {
    if (tab === 'moves') {
      router.navigate('/(main)/(pokedex)/moves');
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

  const handleSortChange = useCallback((newSortBy: PokemonSortBy) => {
    const isNumeric = (s: PokemonSortBy) => s !== 'dex' && s !== 'name';
    if (isNumeric(newSortBy) && !isNumeric(sortBy)) setSortDirection('desc');
    else if (!isNumeric(newSortBy)) setSortDirection('asc');
    setSortBy(newSortBy);
  }, [sortBy]);

  const handleGenerationChange = useCallback((gen: number | undefined) => {
    setSelectedGeneration(gen === undefined ? undefined : gen);
  }, []);

  const handleTypeFilterModeChange = useCallback((mode: 'or' | 'and') => {
    setTypeFilterMode(mode);
  }, []);

  const activeFilterCount = selectedTypes.length + (selectedGeneration ? 1 : 0) + (typeFilterMode === 'and' ? 1 : 0);

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <SearchHeader
        title="Pokédex"
        value={search}
        onChangeText={handleSearchChange}
        placeholder="Search Pokémon..."
      />
      <SubTabBar
        activeTab="pokemon"
        onTabPress={handleTabPress}
      />

      {/* Toolbar */}
      <View style={styles.toolbar}>
        <Pressable
          style={styles.filterButton}
          onPress={handleFilterPress}
        >
          <Text style={styles.filterButtonText}>
            ⚙ Filter & Sort
            {activeFilterCount > 0 && ` (${activeFilterCount})`}
          </Text>
        </Pressable>

        <Pressable
          style={styles.directionButton}
          onPress={handleSortDirectionPress}
        >
          <Text style={styles.directionButtonText}>
            {sortDirection === 'asc' ? '↑' : '↓'} {sortDirection === 'asc' ? 'Asc' : 'Desc'}
          </Text>
        </Pressable>
      </View>

      {error ? (
        <EmptyState message="Failed to load Pokédex" subMessage={error.message} />
      ) : (
        <FlashList
          data={data}
          renderItem={renderPokemonCard}
          keyExtractor={(item: any) => String(item.id)}
          {...{ estimatedItemSize: 84 } as any}
          keyboardDismissMode="interactive"
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            isLoading
              ? <LoadingSpinner message="Loading Pokédex..." />
              : <EmptyState
                  message="No Pokémon found"
                  subMessage="Try adjusting your search or filters"
                />
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={{ paddingVertical: spacing.lg, alignItems: 'center' }}>
                <LoadingSpinner message="Loading more..." />
              </View>
            ) : null
          }
        />
      )}

      <FilterSortSheet
        isVisible={filterSheetVisible}
        onClose={() => setFilterSheetVisible(false)}
        sortBy={sortBy}
        onSortChange={handleSortChange}
        selectedTypes={selectedTypes}
        onTypeToggle={handleTypeToggle}
        selectedGeneration={selectedGeneration}
        onGenerationChange={handleGenerationChange}
        typeFilterMode={typeFilterMode}
        onTypeFilterModeChange={handleTypeFilterModeChange}
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
});
