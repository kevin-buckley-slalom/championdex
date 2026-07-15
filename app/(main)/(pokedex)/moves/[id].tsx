import React, { useCallback } from 'react';
import { View, StyleSheet, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { colors } from '@/constants/colors';
import { spacing, fontSize, borderRadius } from '@/constants/spacing';
import { useMoveDetail, usePokemonWithMove } from '@/hooks/queries';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { TypeBadge } from '@/components/common/TypeBadge';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';

const CATEGORY_ICONS: Record<string, any> = {
  physical: require('../../../../assets/icons/moves/physical.png'),
  special: require('../../../../assets/icons/moves/special.png'),
  status: require('../../../../assets/icons/moves/status.png'),
  both: require('../../../../assets/icons/moves/both.png'),
};

function formatLearnMethod(method: string, level: number | null): string {
  const methodMap: Record<string, string> = {
    'level-up': level !== null ? `Lv. ${level}` : 'Level-Up',
    'tm': 'TM',
    'egg': 'Egg',
    'tutor': 'Tutor',
  };
  return methodMap[method.toLowerCase()] || method;
}

export default function MoveDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const moveId = parseInt(id ?? '0', 10);

  const { data: move, isLoading, error } = useMoveDetail(moveId);
  const { pokemon: pokemonList, count, isLoading: pokemonLoading } = usePokemonWithMove(moveId);

  const handleBackPress = useCallback(() => {
    router.back();
  }, [router]);

  const handlePokemonPress = useCallback((pokemonId: number) => {
    router.push(`/${pokemonId}`);
  }, [router]);

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <View style={styles.header}>
          <Pressable onPress={handleBackPress} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </Pressable>
          <Text style={styles.title}>Move</Text>
        </View>
        <EmptyState
          message="Failed to load move"
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
          <Text style={styles.title}>Move</Text>
        </View>
        <LoadingSpinner message="Loading move..." />
      </SafeAreaView>
    );
  }

  if (!move) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <View style={styles.header}>
          <Pressable onPress={handleBackPress} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </Pressable>
          <Text style={styles.title}>Move</Text>
        </View>
        <EmptyState
          message="Move not found"
          subMessage="Try searching again"
        />
      </SafeAreaView>
    );
  }

  const categoryIcon = CATEGORY_ICONS[move.category.toLowerCase()];

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <View style={styles.header}>
        <Pressable onPress={handleBackPress} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          {move.displayName}
        </Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Move Name and Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{move.displayName}</Text>
          <View style={styles.typeAndCategoryRow}>
            <View style={styles.typeBadgeWrapper}>
              <TypeBadge type={move.type} size="md" />
            </View>
            {categoryIcon && (
              <Image
                source={categoryIcon}
                style={styles.categoryIcon}
                contentFit="contain"
              />
            )}
          </View>
        </View>

        {/* Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Power</Text>
              <Text style={styles.statValue}>
                {move.power !== null ? String(move.power) : '—'}
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Accuracy</Text>
              <Text style={styles.statValue}>
                {move.accuracy !== null ? `${move.accuracy}%` : '—'}
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>PP</Text>
              <Text style={styles.statValue}>{move.pp}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Priority</Text>
              <Text style={styles.statValue}>{move.priority >= 0 ? '+' : ''}{move.priority}</Text>
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{move.description}</Text>
        </View>

        {/* Pokemon that learn this move */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Learned by Pokémon {count > 0 ? `(${count})` : ''}
          </Text>

          {pokemonLoading && !pokemonList.length ? (
            <LoadingSpinner message="Loading Pokémon..." />
          ) : pokemonList.length === 0 ? (
            <Text style={styles.emptyStateText}>No Pokémon learn this move</Text>
          ) : (
            <View style={styles.pokemonListContainer}>
              <FlashList
                data={pokemonList}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => handlePokemonPress(item.id)}
                    style={({ pressed }) => [
                      styles.pokemonRow,
                      pressed && styles.pokemonRowPressed,
                    ]}
                  >
                    <Image
                      source={{
                        uri: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${item.pokeApiId}.png`,
                      }}
                      style={styles.pokemonSprite}
                      contentFit="contain"
                    />

                    <View style={styles.pokemonInfo}>
                      <Text style={styles.pokemonName}>
                        #{String(item.nationalDexNumber).padStart(3, '0')} {item.name}
                      </Text>
                      <View style={styles.typeBadgesRow}>
                        <TypeBadge type={item.primaryType} size="sm" />
                        {item.secondaryType && (
                          <TypeBadge type={item.secondaryType} size="sm" />
                        )}
                      </View>
                    </View>

                    <View style={styles.learnMethodContainer}>
                      <Text style={styles.learnMethodText}>
                        {formatLearnMethod(item.learnMethod, item.learnLevel)}
                      </Text>
                    </View>
                  </Pressable>
                )}
                keyExtractor={(item) => `${item.id}`}
                scrollEnabled={false}
              />
            </View>
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
  typeAndCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  typeBadgeWrapper: {
    minWidth: 100,
  },
  categoryIcon: {
    width: 65,
    height: 28,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: 100,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
  },
  description: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  placeholder: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  pokemonListContainer: {
    height: 400,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pokemonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  pokemonRowPressed: {
    backgroundColor: colors.surfaceElevated,
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
  typeBadgesRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  learnMethodContainer: {
    marginLeft: spacing.md,
  },
  learnMethodText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  emptyStateText: {
    fontSize: fontSize.md,
    color: colors.textMuted,
    fontStyle: 'italic',
    padding: spacing.lg,
    textAlign: 'center',
  },
});
