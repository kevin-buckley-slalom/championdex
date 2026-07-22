import React from 'react';
import { View, StyleSheet, Text, Pressable, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import Svg, { Ellipse, Path } from 'react-native-svg';
import { colors } from '@/constants/colors';
import { spacing, fontSize } from '@/constants/spacing';
import { useEvolutionChain } from '@/hooks/queries/useEvolutionChain';
import { formatSlug } from '@/utils/pokemonUtils';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EvolutionNode, EvolutionStep } from '@/services/database/pokemonSpeciesRepository';
import { getHomeRenderUrl } from '@/services/prefetch/artworkPrefetchService';

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
      <View style={styles.container}>
        <Text style={styles.sectionHeader}>EVOLUTION</Text>
        <Text style={styles.noEvolution}>Does not evolve</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionHeader}>EVOLUTION</Text>
      <EvolutionChainRenderer
        rootNode={chain}
        currentPokemonId={pokemonId}
        accentColor={accentColor}
        onPokemonPress={onPokemonPress}
      />
    </View>
  );
};

interface EvolutionChainRendererProps {
  rootNode: EvolutionNode;
  currentPokemonId: number;
  accentColor: string;
  onPokemonPress: (pokemonId: number) => void;
}

const EvolutionChainRenderer: React.FC<EvolutionChainRendererProps> = ({
  rootNode,
  currentPokemonId,
  accentColor,
  onPokemonPress,
}) => {
  const windowWidth = useWindowDimensions().width;
  const availableWidth = windowWidth - 64;

  // Compute sizes
  const arrowWidth = Math.max(60, Math.min(Math.round(availableWidth * 0.2), 96));
  const discSize = Math.max(52, Math.min(Math.round((availableWidth - 2 * arrowWidth) / 3), 88));
  const branchDiscSize = Math.round(discSize * 0.82);

  return (
    <View style={styles.chainRenderer}>
      <ChainNode
        node={rootNode}
        currentPokemonId={currentPokemonId}
        accentColor={accentColor}
        discSize={discSize}
        branchDiscSize={branchDiscSize}
        arrowWidth={arrowWidth}
        containerWidth={availableWidth}
        onPokemonPress={onPokemonPress}
      />
    </View>
  );
};

interface ChainNodeProps {
  node: EvolutionNode;
  currentPokemonId: number;
  accentColor: string;
  discSize: number;
  branchDiscSize: number;
  arrowWidth: number;
  containerWidth: number;
  branchDepth?: number;
  onPokemonPress: (pokemonId: number) => void;
}

const ChainNode = React.memo<ChainNodeProps>(({
  node,
  currentPokemonId,
  accentColor,
  discSize,
  branchDiscSize,
  arrowWidth,
  containerWidth,
  branchDepth = 0,
  onPokemonPress,
}) => {
  if (node.evolvesTo.length === 0) {
    // Leaf node
    return (
      <PokemonNode
        pokemon={node}
        currentPokemonId={currentPokemonId}
        accentColor={accentColor}
        discSize={discSize}
        onPress={() => onPokemonPress(node.pokemonId)}
      />
    );
  }

  // Check if linear (single evolution)
  const isLinear = node.evolvesTo.length === 1;

  if (isLinear) {
    // Flatten linear chain into a single row
    const linearChain = collectLinearChain(node);
    const lastNode = linearChain[linearChain.length - 1].pokemon;
    const hasTrailingBranch = lastNode.evolvesTo.length > 1;

    return (
      <View style={hasTrailingBranch ? styles.branchContainer : undefined}>
        <View style={styles.linearRow}>
          {linearChain.map((item, index) => (
            <React.Fragment key={item.pokemon.pokemonId}>
              {index > 0 && (
                <Arrow
                  condition={item.step ? formatMethod(item.step.method, item.step.conditionValue) : ''}
                  arrowWidth={arrowWidth}
                  discSize={discSize}
                />
              )}
              <PokemonNode
                pokemon={item.pokemon}
                currentPokemonId={currentPokemonId}
                accentColor={accentColor}
                discSize={discSize}
                onPress={() => onPokemonPress(item.pokemon.pokemonId)}
              />
            </React.Fragment>
          ))}
        </View>
        {hasTrailingBranch && (() => {
          // Compute x-center of the last node in the linear row relative to containerWidth
          const linearRowWidth = linearChain.length * discSize + (linearChain.length - 1) * arrowWidth;
          const linearRowStartX = (containerWidth - linearRowWidth) / 2;
          const lastNodeCenterX = linearRowStartX
            + (linearChain.length - 1) * (discSize + arrowWidth)
            + discSize / 2;

          return (
            <BranchConnector
              branches={lastNode.evolvesTo}
              currentPokemonId={currentPokemonId}
              accentColor={accentColor}
              branchDiscSize={branchDiscSize}
              arrowWidth={arrowWidth}
              containerWidth={containerWidth}
              parentCenterX={lastNodeCenterX}
              branchDepth={branchDepth}
              onPokemonPress={onPokemonPress}
            />
          );
        })()}
      </View>
    );
  }

  // Branch point
  return (
    <View style={styles.branchContainer}>
      <View style={styles.parentRow}>
        <PokemonNode
          pokemon={node}
          currentPokemonId={currentPokemonId}
          accentColor={accentColor}
          discSize={discSize}
          onPress={() => onPokemonPress(node.pokemonId)}
        />
      </View>

      <BranchConnector
        branches={node.evolvesTo}
        currentPokemonId={currentPokemonId}
        accentColor={accentColor}
        branchDiscSize={branchDiscSize}
        arrowWidth={arrowWidth}
        containerWidth={containerWidth}
        branchDepth={branchDepth}
        maxPerRow={node.evolvesTo.length === 5 ? 5 : 4}
        onPokemonPress={onPokemonPress}
      />
    </View>
  );
});

interface BranchConnectorProps {
  branches: EvolutionStep[];
  currentPokemonId: number;
  accentColor: string;
  branchDiscSize: number;
  arrowWidth: number;
  containerWidth: number;
  parentCenterX?: number;
  branchDepth?: number;
  maxPerRow?: number;
  onPokemonPress: (pokemonId: number) => void;
}

const BranchConnector = React.memo<BranchConnectorProps>(({
  branches,
  currentPokemonId,
  accentColor,
  branchDiscSize,
  arrowWidth,
  containerWidth,
  parentCenterX,
  branchDepth = 0,
  maxPerRow = 4,
  onPokemonPress,
}) => {
  const CONNECTOR_HEIGHT = 24;
  const MAX_PER_ROW = maxPerRow;

  // Keep branchCount and slotWidth for sub-chain rendering (lines ~286+)
  const branchCount = branches.length;
  const slotWidth = containerWidth / branchCount;

  // Chunk branches into rows of max 4
  const rows: EvolutionStep[][] = [];
  for (let i = 0; i < branches.length; i += MAX_PER_ROW) {
    rows.push(branches.slice(i, i + MAX_PER_ROW));
  }

  const strokeWidth = branchDepth > 0 ? 1 : 1.5;
  const strokeOpacity = branchDepth > 0 ? 0.35 : 0.5;

  return (
    <View style={styles.branchConnectorContainer}>
      {/* Render each row of branches (max 4 per row) */}
      {rows.map((row, rowIndex) => {
        const rowSlotWidth = containerWidth / row.length;
        const isFirstRow = rowIndex === 0;
        const connectorPath = buildBranchConnectorPath(
          containerWidth,
          row.length,
          CONNECTOR_HEIGHT,
          parentCenterX ?? containerWidth / 2
        );

        return (
          <View key={`row-${rowIndex}`}>
            {/* SVG connector lines from parent to this row */}
            <Svg width={containerWidth} height={CONNECTOR_HEIGHT}>
              <Path
                d={connectorPath}
                stroke="#4D3E3E"
                strokeWidth={strokeWidth}
                strokeOpacity={strokeOpacity}
                fill="none"
              />
            </Svg>

            {/* Row of children (max 4 per row) */}
            <View style={styles.branchRow}>
              {row.map((step) => (
                <View
                  key={step.pokemon.pokemonId}
                  style={[styles.branchChildWrapper, { width: rowSlotWidth }]}
                >
                  <Text style={styles.branchConditionLabel}>
                    {formatMethod(step.method, step.conditionValue)}
                  </Text>
                  <PokemonNode
                    pokemon={step.pokemon}
                    currentPokemonId={currentPokemonId}
                    accentColor={accentColor}
                    discSize={branchDiscSize}
                    onPress={() => onPokemonPress(step.pokemon.pokemonId)}
                  />
                </View>
              ))}
            </View>
          </View>
        );
      })}

      {/* For each non-leaf branch, render its sub-chain below its slot */}
      {(() => {
        // Compute which branches have children
        const nonLeafBranches = branches.filter(step => step.pokemon.evolvesTo.length > 0);
        const allBranchesHaveChildren = nonLeafBranches.length === branches.length && branches.length > 1;

        if (allBranchesHaveChildren) {
          // Symmetric case: render all sub-chains in a single row
          return (
            <View style={{ flexDirection: 'row', width: containerWidth }}>
              {branches.map((step, slotIndex) => (
                <View
                  key={`subchain-${step.pokemon.pokemonId}`}
                  style={{ width: slotWidth }}
                >
                  <BranchConnector
                    branches={step.pokemon.evolvesTo}
                    currentPokemonId={currentPokemonId}
                    accentColor={accentColor}
                    branchDiscSize={branchDiscSize}
                    arrowWidth={arrowWidth}
                    containerWidth={slotWidth}
                    parentCenterX={slotWidth / 2}
                    branchDepth={branchDepth + 1}
                    onPokemonPress={onPokemonPress}
                  />
                </View>
              ))}
            </View>
          );
        }

        // Asymmetric case: keep current stacked behavior
        return branches.map((step, slotIndex) => {
          if (step.pokemon.evolvesTo.length === 0) return null;

          // Offset the sub-chain to align under the correct slot
          const slotOffsetX = slotIndex * slotWidth;

          return (
            <View
              key={`subchain-${step.pokemon.pokemonId}`}
              style={{ width: containerWidth, alignItems: 'flex-start' }}
            >
              <View style={{ marginLeft: slotOffsetX, width: slotWidth }}>
                <BranchConnector
                  branches={step.pokemon.evolvesTo}
                  currentPokemonId={currentPokemonId}
                  accentColor={accentColor}
                  branchDiscSize={branchDiscSize}
                  arrowWidth={arrowWidth}
                  containerWidth={slotWidth}
                  parentCenterX={slotWidth / 2}
                  branchDepth={branchDepth + 1}
                  onPokemonPress={onPokemonPress}
                />
              </View>
            </View>
          );
        });
      })()}
    </View>
  );
});

interface PokemonNodeProps {
  pokemon: EvolutionNode;
  currentPokemonId: number;
  accentColor: string;
  discSize: number;
  onPress: () => void;
}

const PokemonNode: React.FC<PokemonNodeProps> = ({
  pokemon,
  currentPokemonId,
  accentColor,
  discSize,
  onPress,
}) => {
  const isCurrentPokemon = pokemon.pokemonId === currentPokemonId;
  const platformEllipseColor = accentColor + (isCurrentPokemon ? '66' : '40');
  const nameColor = isCurrentPokemon ? colors.text : colors.textSecondary;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.pokemonNodePressable,
        pressed && { opacity: 0.75 },
      ]}
    >
      <View style={[styles.discFrame, { width: discSize, height: discSize }]}>
        {/* Platform ellipse — true SVG ellipse, not a View (View borderRadius produces a stadium/pill) */}
        <Svg
          width={discSize * 1.15}
          height={20}
          style={styles.platformEllipse}
        >
          <Ellipse
            cx={(discSize * 1.15) / 2}
            cy={10}
            rx={(discSize * 1.15) / 2}
            ry={10}
            fill={platformEllipseColor}
          />
        </Svg>

        {/* Artwork */}
        <Image
          source={(() => {
            const src = getHomeRenderUrl(pokemon.pokeApiId, pokemon.pokemonId);
            return typeof src === 'number' ? src : { uri: src };
          })()}
          style={[styles.artwork, { width: discSize, height: discSize }]}
          contentFit="contain"
          cachePolicy="memory-disk"
        />
      </View>

      {/* Name */}
      <Text
        style={[styles.pokemonName, { color: nameColor, maxWidth: discSize + 8 }]}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {pokemon.displayName}
      </Text>

      {/* Dex number */}
      <Text style={styles.dexNumber}>
        #{pokemon.nationalDex.toString().padStart(3, '0')}
      </Text>
    </Pressable>
  );
};

interface ArrowProps {
  condition: string;
  arrowWidth: number;
  discSize: number;
}

const Arrow: React.FC<ArrowProps> = ({ condition, arrowWidth, discSize }) => {
  return (
    <View style={[styles.arrowContainer, { width: arrowWidth, height: discSize }]}>
      <Text
        style={[
          styles.arrowConditionLabel,
          { maxWidth: arrowWidth - 4 },
        ]}
        numberOfLines={2}
      >
        {condition}
      </Text>
      <View style={styles.arrowLineContainer}>
        <View
          style={[
            styles.arrowFlowLine,
            { width: arrowWidth * 0.65 },
          ]}
        />
        <Text style={styles.arrowhead}>▶</Text>
      </View>
    </View>
  );
};

/**
 * Collects all Pokémon in a linear chain (where each evolution has only one subsequent evolution)
 * into a flat array for single-row rendering.
 */
function collectLinearChain(
  node: EvolutionNode,
  incomingStep: EvolutionStep | null = null,
  accumulated: Array<{ pokemon: EvolutionNode; step: EvolutionStep | null }> = []
): Array<{ pokemon: EvolutionNode; step: EvolutionStep | null }> {
  accumulated.push({ pokemon: node, step: incomingStep });

  if (node.evolvesTo.length === 1) {
    const nextStep = node.evolvesTo[0];
    return collectLinearChain(nextStep.pokemon, nextStep, accumulated);
  }

  return accumulated;
}

function buildBranchConnectorPath(
  containerWidth: number,
  branchCount: number,
  svgHeight: number,
  stemX: number,
  childCenterOverride?: number  // used in stacked layout to point at the actual first disc
): string {
  const slotWidth = containerWidth / branchCount;
  const childCenters = childCenterOverride !== undefined
    ? [childCenterOverride]
    : Array.from({ length: branchCount }, (_, i) =>
        slotWidth * i + slotWidth / 2
      );

  const stemEndY = svgHeight * 0.45;
  const leftmostX = childCenters[0];
  const rightmostX = childCenters[childCenters.length - 1];

  let path = `M ${stemX} 0 L ${stemX} ${stemEndY} `;

  // Connect stem end to leftmost child (covers: multi-branch horizontal bar,
  // AND single-branch stacked case where child disc is offset from stem)
  if (leftmostX !== stemX || branchCount > 1) {
    path += `M ${stemX} ${stemEndY} L ${leftmostX} ${stemEndY} `;
  }
  if (branchCount > 1) {
    path += `M ${leftmostX} ${stemEndY} L ${rightmostX} ${stemEndY} `;
  }

  childCenters.forEach((cx) => {
    path += `M ${cx} ${stemEndY} L ${cx} ${svgHeight} `;
  });

  return path.trim();
}

function formatMethod(method: string, conditionValue: string | null): string {
  if (method === 'level-up') return conditionValue ? `Lv. ${conditionValue}` : 'Level up';
  if (method === 'use-item') return conditionValue ? formatSlug(conditionValue) : 'Item';
  if (method === 'trade') return 'Trade';
  if (method === 'shed') return 'Shed skin';
  if (conditionValue === 'friendship') return 'Friendship';
  if (method === 'spin') return 'Spin with Sweet';
  if (method === 'tower-of-darkness') return 'Tower of Darkness';
  if (method === 'tower-of-waters') return 'Tower of Waters';
  if (method === 'three-critical-hits') return '3 Critical Hits';
  if (method === 'take-damage') return 'Take 49+ Damage, Dusty Bowl Arch';
  if (method === 'other' && conditionValue) return conditionValue;
  if (method === 'battle') return conditionValue ?? 'Battle';
  if (method === 'agile-style-move') return conditionValue ? `Agile Style: ${formatSlug(conditionValue)}` : 'Agile Style Move';
  if (method === 'strong-style-move') return conditionValue ? `Lv. 20 w/ ${conditionValue}` : 'Strong Style Move';
  if (method === 'recoil-damage') return '294 Recoil Damage + Lv. Up';
  if (method === 'use-move') return conditionValue ? `Use ${formatSlug(conditionValue)} ×20` : 'Use Move ×20';
  if (method === 'three-defeated-bisharp') return "Defeat 3 Leader's Crest Bisharp";
  if (method === 'gimmighoul-coins') return '999 Coins + Lv. Up';
  if (method === 'know-move') return conditionValue ? `Know ${formatSlug(conditionValue)}` : 'Know Move';
  if (method === 'primal-reversion') return conditionValue ? formatSlug(conditionValue) : 'Primal Reversion';
  return conditionValue ? formatSlug(conditionValue) : 'Evolution';
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  sectionHeader: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: spacing.md,
    alignSelf: 'stretch',
  },
  chainRenderer: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  linearRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  branchContainer: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  parentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  branchConnectorContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: 0,
  },
  branchRow: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  branchChildWrapper: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  branchConditionLabel: {
    fontSize: fontSize.xs,
    fontStyle: 'italic',
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  arrowContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowConditionLabel: {
    fontSize: fontSize.xs,
    fontStyle: 'italic',
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  arrowLineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  arrowFlowLine: {
    height: 1.5,
    backgroundColor: colors.border,
    opacity: 0.7,
  },
  arrowhead: {
    fontSize: 9,
    color: colors.textMuted,
    marginLeft: spacing.xs,
  },
  pokemonNodePressable: {
    alignItems: 'center',
  },
  discFrame: {
    position: 'relative',
    marginBottom: spacing.sm,
  },
  platformEllipse: {
    position: 'absolute',
    bottom: -3,
    alignSelf: 'center',
    zIndex: 0,
  },
  artwork: {
    zIndex: 1,
  },
  pokemonName: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  dexNumber: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: 'center',
  },
  noEvolution: {
    fontSize: fontSize.sm,
    fontStyle: 'italic',
    color: colors.textMuted,
    textAlign: 'center',
  },
});
