import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Text, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { spacing, fontSize, borderRadius } from '@/constants/spacing';
import { useAbilitiesList } from '@/hooks/queries/useAbilitiesList';
import { useDebounce } from '@/hooks/ui/useDebounce';
import { SearchHeader } from '@/components/lists/SearchHeader';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { SubTabBar } from '@/components/lists/SubTabBar';

export default function AbilitiesScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const { data, isLoading, error } = useAbilitiesList({
    search: debouncedSearch,
    sortDirection,
  });

  const handleSearchChange = useCallback((text: string) => {
    setSearch(text);
  }, []);

  const handleTabPress = useCallback((tab: string) => {
    if (tab === 'pokemon') {
      router.navigate('/(main)/(pokedex)');
    } else if (tab === 'moves') {
      router.navigate('/(main)/(pokedex)/moves');
    } else if (tab === 'items') {
      router.navigate('/(main)/(pokedex)/items');
    }
  }, [router]);

  const handleSortDirectionPress = useCallback(() => {
    setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
  }, []);

  const handleAbilityPress = useCallback((abilityId: number) => {
    router.push(`/(main)/(pokedex)/abilities/${abilityId}`);
  }, [router]);

  const renderAbilityRow = useCallback(({ item }: any) => (
    <Pressable
      style={({ pressed }) => [styles.abilityRow, pressed && styles.abilityRowPressed]}
      onPress={() => handleAbilityPress(item.id)}
    >
      <Text style={styles.abilityName}>{item.displayName}</Text>
      <Text style={styles.abilityDescription}>{item.shortDescription}</Text>
    </Pressable>
  ), [handleAbilityPress]);

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <SearchHeader
        title="Abilities"
        value={search}
        onChangeText={handleSearchChange}
        placeholder="Search abilities..."
      />
      <SubTabBar
        activeTab="abilities"
        onTabPress={handleTabPress}
      />

      {/* Toolbar */}
      <View style={styles.toolbar}>
        <Pressable
          style={styles.directionButton}
          onPress={handleSortDirectionPress}
          accessibilityLabel={`Sort ${sortDirection === 'asc' ? 'ascending' : 'descending'}`}
          accessibilityRole="button"
        >
          <Text style={styles.directionButtonText}>
            {sortDirection === 'asc' ? '↑' : '↓'} {sortDirection === 'asc' ? 'Asc' : 'Desc'}
          </Text>
        </Pressable>
      </View>

      {error ? (
        <EmptyState message="Failed to load abilities" subMessage={error.message} />
      ) : (
        <FlashList
          data={data}
          renderItem={renderAbilityRow}
          keyExtractor={(item: any) => String(item.id)}
          {...{ estimatedItemSize: 72 } as any}
          keyboardDismissMode="interactive"
          ListEmptyComponent={
            isLoading
              ? <LoadingSpinner message="Loading abilities..." />
              : <EmptyState
                  message="No abilities found"
                  subMessage="Try adjusting your search"
                />
          }
        />
      )}
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
    justifyContent: 'flex-end',
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
  abilityRow: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  abilityRowPressed: {
    opacity: 0.7,
  },
  abilityName: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  abilityDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 16,
  },
});
