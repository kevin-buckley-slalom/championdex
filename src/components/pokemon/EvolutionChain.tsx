import React from 'react';
import { View, StyleSheet, Text, Pressable, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/constants/colors';
import { spacing, fontSize, borderRadius } from '@/constants/spacing';
import { useEvolutionChain } from '@/hooks/queries/useEvolutionChain';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EvolutionNode, EvolutionStep } from '@/services/database/pokemonSpeciesRepository';

interface EvolutionChainProps {
  pokemonId: number;
  accentColor: string;
  onPokemonPress: (pokemonId: number) => void;
}

export const EvolutionChain: React.FC<EvolutionChainProps> = ({
  pokemonId,
  accentColor,
  onPokemonPress,
}) => {
  const { data: chain, isLoading } = useEvolutionChain(pokemonId);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!chain) {
    return null;
  }

  if (chain.evolvesTo.length === 0) {
    return (
      <Text style={styles.noEvolution}>Does not evolve</Text>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scrollView}
      contentContainerStyle={styles.scrollViewContent}
    >
      <View style={styles.chainContainer}>
        <PokemonCard
          pokemon={chain}
          onPress={() => onPokemonPress(chain.pokemonId)}
        />
        {chain.evolvesTo.length > 0 && (
          <HorizontalEvolutionStages
            steps={chain.evolvesTo}
            onPokemonPress={onPokemonPress}
          />
        )}
      </View>
    </ScrollView>
  );
};

interface HorizontalEvolutionStagesProps {
  steps: EvolutionStep[];
  onPokemonPress: (pokemonId: number) => void;
}

function formatMethod(method: string, conditionValue: string | null): string {
  if (method === 'level-up') return conditionValue ? `Lv. ${conditionValue}` : 'Level up';
  if (method === 'use-item') return conditionValue ? conditionValue : 'Item';
  if (method === 'trade') return 'Trade';
  if (method === 'shed') return 'Shed skin';
  if (conditionValue === 'friendship') return 'Friendship';
  if (method === 'spin') return 'Spin with Sweet';
  if (method === 'tower-of-darkness') return 'Tower of Darkness';
  if (method === 'tower-of-waters') return 'Tower of Waters';
  if (method === 'three-critical-hits') return '3 Critical Hits';
  if (method === 'take-damage') return 'Take 49+ Damage, Dusty Bowl Arch';
  // HARDCODED: PokeAPI returns trigger "other" + min_level for Tandemaus; 1% chance note is not data-driven
  if (method === 'other' && conditionValue) return `Lv. ${conditionValue} (1% three-member)`;
  if (method === 'agile-style-move') return conditionValue ? `Agile Style: ${conditionValue}` : 'Agile Style Move';
  // HARDCODED: PokeAPI only provides the move name for strong-style-move; Lv. 20 is not in the API response
  if (method === 'strong-style-move') return conditionValue ? `Lv. 20 w/ ${conditionValue}` : 'Strong Style Move';
  if (method === 'recoil-damage') return '294 Recoil Damage + Lv. Up';
  if (method === 'use-move') return conditionValue ? `Use ${conditionValue} ×20` : 'Use Move ×20';
  if (method === 'three-defeated-bisharp') return "Defeat 3 Leader's Crest Bisharp";
  if (method === 'gimmighoul-coins') return '999 Coins + Lv. Up';
  return conditionValue ?? 'Evolution';
}

/**
 * Renders evolution stages horizontally left-to-right.
 * Groups steps by condition and renders each group as a column.
 * For Eevee (8 branches): all branches appear in one column with their own arrows.
 * For linear chains: arrow → next stage → recurse.
 * For splits (Kirlia): arrow → column with [Gardevoir, Gallade].
 */
const HorizontalEvolutionStages: React.FC<HorizontalEvolutionStagesProps> = ({
  steps,
  onPokemonPress,
}) => {
  const groupedByCondition = steps.reduce(
    (acc, step) => {
      const key = `${step.method}|${step.conditionValue || ''}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(step);
      return acc;
    },
    {} as Record<string, EvolutionStep[]>
  );

  const conditionGroups = Object.entries(groupedByCondition);

  return (
    <>
      {conditionGroups.map(([conditionKey, stepsForCondition]) => {
        const firstStep = stepsForCondition[0];
        const conditionLabel = formatMethod(firstStep.method, firstStep.conditionValue);
        // Only show sub-evolutions for linear chains (single step, single evo per step)
        const isLinear = stepsForCondition.length === 1 && stepsForCondition[0].pokemon.evolvesTo.length > 0;

        return (
          <React.Fragment key={conditionKey}>
            <View style={styles.stageGroup}>
              {/* Arrow + condition label */}
              <EvolutionArrow condition={conditionLabel} />

              {/* Column of evolved pokemon */}
              <View style={styles.evolutionColumn}>
                {stepsForCondition.map((step, index) => (
                  <View
                    key={step.pokemon.pokemonId}
                    style={index < stepsForCondition.length - 1 ? styles.cardWithSpacing : undefined}
                  >
                    <PokemonCard
                      pokemon={step.pokemon}
                      onPress={() => onPokemonPress(step.pokemon.pokemonId)}
                    />
                  </View>
                ))}
              </View>
            </View>

            {/* Recurse at the ROW level, not inside the column */}
            {isLinear && (
              <HorizontalEvolutionStages
                steps={stepsForCondition[0].pokemon.evolvesTo}
                onPokemonPress={onPokemonPress}
              />
            )}
          </React.Fragment>
        );
      })}
    </>
  );
};

interface EvolutionArrowProps {
  condition: string;
}

const EvolutionArrow: React.FC<EvolutionArrowProps> = ({ condition }) => {
  return (
    <View style={styles.arrowBox}>
      {/* Condition label above the line */}
      <Text style={styles.conditionLabel}>{condition}</Text>

      {/* Visual flow line with arrowhead */}
      <View style={styles.flowLineContainer}>
        <View style={styles.flowLine} />
        <Text style={styles.arrowhead}>▶</Text>
      </View>
    </View>
  );
};

interface PokemonCardProps {
  pokemon: EvolutionNode;
  onPress: () => void;
}

const PokemonCard: React.FC<PokemonCardProps> = ({
  pokemon,
  onPress,
}) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.discContainer,
        pressed && styles.discPressed,
      ]}
    >
      {/* Floating disc background with glow ring */}
      <View style={styles.discPortrait}>
        {/* Glowing ring behind artwork */}
        <View style={styles.glowRing} />

        {/* Pokemon artwork */}
        <Image
          source={{
            uri: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${pokemon.pokeApiId}.png`,
          }}
          style={styles.artwork}
          contentFit="contain"
          cachePolicy="memory-disk"
        />
      </View>

      {/* Name below disc */}
      <Text style={styles.name}>{pokemon.displayName}</Text>

      {/* Dex number */}
      <Text style={styles.dexNumber}>#{pokemon.nationalDex.toString().padStart(3, '0')}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flexGrow: 0,
  },
  scrollViewContent: {
    paddingHorizontal: spacing.md,
  },
  chainContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stageGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  arrowBox: {
    width: 88,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  flowLineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flowLine: {
    width: 60,
    height: 2,
    backgroundColor: colors.border,
    opacity: 0.6,
  },
  arrowhead: {
    fontSize: 10,
    color: colors.textMuted,
    marginLeft: spacing.xs,
  },
  conditionLabel: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontStyle: 'italic',
    textAlign: 'center',
    maxWidth: 80,
    marginBottom: spacing.xs,
  },
  evolutionColumn: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  discContainer: {
    alignItems: 'center',
  },
  cardWithSpacing: {
    marginBottom: spacing.md,
  },
  discPressed: {
    opacity: 0.7,
  },
  discPortrait: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: spacing.xs,
  },
  glowRing: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.accent,
    opacity: 0.2,
  },
  artwork: {
    width: 64,
    height: 64,
    zIndex: 1,
  },
  name: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 80,
    marginBottom: spacing.xs,
  },
  dexNumber: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  noEvolution: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    fontStyle: 'italic',
  },
});
