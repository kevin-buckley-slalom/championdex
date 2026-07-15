import React, { useCallback, useMemo, useState } from 'react';
import { View, StyleSheet, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable } from 'react-native';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';
import { colors } from '@/constants/colors';
import { spacing, fontSize, borderRadius } from '@/constants/spacing';
import { useAbilityDetail } from '@/hooks/queries/useAbilityDetail';
import { usePokemonWithAbility } from '@/hooks/queries/usePokemonWithAbility';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { TypeBadge } from '@/components/common/TypeBadge';

export default function AbilityDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const abilityId = parseInt(id ?? '0', 10);

  const { data: ability, isLoading, error } = useAbilityDetail(abilityId);
  const { pokemon: pokemonList, isLoading: pokemonLoading, error: pokemonError } = usePokemonWithAbility(abilityId);
  const [selectedGeneration, setSelectedGeneration] = useState<number | null>(null);

  const handleBackPress = useCallback(() => {
    router.back();
  }, [router]);

  const handlePokemonPress = useCallback((pokemonId: number) => {
    router.push(`/(main)/(pokedex)/${pokemonId}`);
  }, [router]);

  // Get unique generations from the Pokémon list
  const availableGenerations = useMemo(() => {
    const gens = new Set(pokemonList.map(p => p.generation));
    return Array.from(gens).sort((a, b) => a - b);
  }, [pokemonList]);

  // Filter Pokémon by selected generation
  const filteredPokemon = useMemo(() => {
    if (selectedGeneration === null) {
      return pokemonList;
    }
    return pokemonList.filter(p => p.generation === selectedGeneration);
  }, [pokemonList, selectedGeneration]);

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <View style={styles.header}>
          <Pressable onPress={handleBackPress} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </Pressable>
          <Text style={styles.title}>Ability</Text>
        </View>
        <EmptyState
          message="Failed to load ability"
          subMessage={error?.message}
        />
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <View style={styles.header}>
          <Pressable onPress={handleBackPress} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </Pressable>
          <Text style={styles.title}>Ability</Text>
        </View>
        <LoadingSpinner message="Loading ability..." />
      </SafeAreaView>
    );
  }

  if (!ability) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <View style={styles.header}>
          <Pressable onPress={handleBackPress} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </Pressable>
          <Text style={styles.title}>Ability</Text>
        </View>
        <EmptyState
          message="Ability not found"
          subMessage="Try searching again"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <View style={styles.header}>
        <Pressable onPress={handleBackPress} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          {ability.displayName}
        </Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Ability Name */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{ability.displayName}</Text>
          <View style={styles.infoRow}>
            <View style={styles.infoBadge}>
              <Text style={styles.infoBadgeLabel}>Generation</Text>
              <Text style={styles.infoBadgeValue}>{ability.generation}</Text>
            </View>
            {ability.isHidden && (
              <View style={styles.infoBadge}>
                <Text style={styles.infoBadgeLabel}>Hidden Ability</Text>
              </View>
            )}
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Effect</Text>
          <Text style={styles.description}>{ability.description}</Text>
        </View>

        {/* Pokémon with this ability */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Pokémon with this Ability ({filteredPokemon.length})
          </Text>

          {pokemonLoading ? (
            <LoadingSpinner message="Loading Pokémon..." />
          ) : pokemonError ? (
            <EmptyState
              message="Failed to load Pokémon"
              subMessage={pokemonError?.message}
            />
          ) : pokemonList.length === 0 ? (
            <EmptyState message="No Pokémon have this ability" />
          ) : (
            <>
              {/* Generation Filter Chips */}
              {availableGenerations.length > 1 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.generationChipsContainer}
                  contentContainerStyle={styles.generationChipsContent}
                >
                  <Pressable
                    onPress={() => setSelectedGeneration(null)}
                    style={[
                      styles.generationChip,
                      selectedGeneration === null && styles.generationChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.generationChipText,
                        selectedGeneration === null && styles.generationChipTextActive,
                      ]}
                    >
                      All
                    </Text>
                  </Pressable>

                  {availableGenerations.map(gen => (
                    <Pressable
                      key={`gen-${gen}`}
                      onPress={() => setSelectedGeneration(gen)}
                      style={[
                        styles.generationChip,
                        selectedGeneration === gen && styles.generationChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.generationChipText,
                          selectedGeneration === gen && styles.generationChipTextActive,
                        ]}
                      >
                        Gen {gen}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              )}

              {/* Pokémon List */}
              {filteredPokemon.length === 0 ? (
                <EmptyState message={`No Pokémon in Gen ${selectedGeneration} have this ability`} />
              ) : (
                <View style={styles.pokemonListContainer}>
                  <FlashList
                    data={filteredPokemon}
                    renderItem={({ item }: any) => (
                      <Pressable
                        onPress={() => handlePokemonPress(item.id)}
                        style={styles.pokemonRow}
                      >
                        {/* Sprite */}
                        <Image
                          source={{
                            uri: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${item.pokeApiId}.png`,
                          }}
                          style={styles.pokemonSprite}
                          contentFit="contain"
                        />

                        {/* Name and Dex Number */}
                        <View style={styles.pokemonInfo}>
                          <Text style={styles.pokemonName}>
                            #{item.nationalDex.toString().padStart(3, '0')} {item.displayName}
                          </Text>

                          {/* Type Badges */}
                          <View style={styles.typesRow}>
                            <TypeBadge type={item.primaryType} size="sm" />
                            {item.secondaryType && (
                              <TypeBadge type={item.secondaryType} size="sm" />
                            )}
                            {item.isHidden && (
                              <View style={styles.hiddenBadge}>
                                <Text style={styles.hiddenBadgeText}>Hidden</Text>
                              </View>
                            )}
                          </View>
                        </View>
                      </Pressable>
                    )}
                    keyExtractor={(item: any) => `pokemon-${item.id}`}
                    {...{ estimatedItemSize: 80 } as any}
                    scrollEnabled={false}
                  />
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  backButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginRight: spacing.sm,
  },
  backButtonText: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  title: {
    flex: 1,
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.text,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: spacing.lg,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    gap: spacing.md,
    flexWrap: 'wrap',
  },
  infoBadge: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoBadgeLabel: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  infoBadgeValue: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  description: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  generationChipsContainer: {
    marginBottom: spacing.md,
  },
  generationChipsContent: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  generationChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  generationChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  generationChipText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
  },
  generationChipTextActive: {
    color: colors.accent,
  },
  pokemonListContainer: {
    height: 400, // Fixed height for FlashList
    marginHorizontal: -spacing.lg,
    marginBottom: -spacing.lg,
  },
  pokemonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pokemonSprite: {
    width: 40,
    height: 40,
    marginRight: spacing.md,
  },
  pokemonInfo: {
    flex: 1,
  },
  pokemonName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  typesRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  hiddenBadge: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  hiddenBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: '500',
    color: colors.textMuted,
  },
});
