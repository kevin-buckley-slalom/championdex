import React from 'react';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/constants/colors';
import { spacing, fontSize } from '@/constants/spacing';
import { TypeBadge } from '@/components/common/TypeBadge';
import { PokemonListItem } from '@/types';
import { PokemonSortBy } from '@/hooks/queries/usePokemonList';

const STAT_LABEL: Partial<Record<PokemonSortBy, string>> = {
  total: 'BST',
  hp: 'HP',
  attack: 'Atk',
  defense: 'Def',
  specialAttack: 'SpA',
  specialDefense: 'SpD',
  speed: 'Spe',
};

export interface PokemonCardProps {
  pokemon: PokemonListItem;
  onPress: () => void;
  sortBy?: PokemonSortBy;
}

export const PokemonCard: React.FC<PokemonCardProps> = ({ pokemon, onPress, sortBy = 'total' }) => {
  const dexNumber = `#${String(pokemon.nationalDex).padStart(4, '0')}`;
  const baseName = pokemon.formName ? pokemon.displayName.split('-')[0] : pokemon.displayName;

  const statValue: Record<string, number> = {
    total: pokemon.baseStats.hp + pokemon.baseStats.attack + pokemon.baseStats.defense + pokemon.baseStats.specialAttack + pokemon.baseStats.specialDefense + pokemon.baseStats.speed,
    hp: pokemon.baseStats.hp,
    attack: pokemon.baseStats.attack,
    defense: pokemon.baseStats.defense,
    specialAttack: pokemon.baseStats.specialAttack,
    specialDefense: pokemon.baseStats.specialDefense,
    speed: pokemon.baseStats.speed,
  };

  const bst = pokemon.baseStats.hp + pokemon.baseStats.attack + pokemon.baseStats.defense + pokemon.baseStats.specialAttack + pokemon.baseStats.specialDefense + pokemon.baseStats.speed;

  const displayStatKey = STAT_LABEL[sortBy] ? sortBy : 'total';
  const statLabel = STAT_LABEL[displayStatKey] ?? 'BST';
  const statNum = statValue[displayStatKey];

  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.pressed]} onPress={onPress}>
      <Image
        source={{ uri: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${pokemon.pokeApiId}.png` }}
        placeholder={require('../../../assets/placeholder-pokemon.png')}
        style={styles.sprite}
        contentFit="contain"
      />
      <View style={styles.content}>
        <View style={styles.nameRow}>
          <Text style={styles.dexNumber}>{dexNumber}</Text>
          <Text style={styles.name} numberOfLines={1}>
            {baseName}
            {pokemon.formName && (
              <Text style={styles.formNameInline}> · {pokemon.formName}</Text>
            )}
          </Text>
        </View>
        <View style={styles.typeRow}>
          <View style={styles.typeBadgeWrapper}>
            <TypeBadge type={pokemon.primaryType} size="sm" fixed />
          </View>
          {pokemon.secondaryType && (
            <View style={styles.typeBadgeWrapper}>
              <TypeBadge type={pokemon.secondaryType} size="sm" fixed />
            </View>
          )}
        </View>
      </View>
      <View style={styles.rightCol}>
        <Text style={styles.bst}>{statLabel}{'\n'}{statNum}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pressed: {
    opacity: 0.7,
  },
  sprite: {
    width: 64,
    height: 64,
    marginRight: spacing.lg,
  },
  content: {
    flex: 1,
  },
  nameRow: {
    marginBottom: spacing.xs,
  },
  dexNumber: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginBottom: 2,
  },
  name: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
  },
  formNameInline: {
    fontSize: fontSize.sm,
    fontWeight: '400',
    color: colors.textMuted,
  },
  typeRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  typeBadgeWrapper: {
    width: 80,
  },
  rightCol: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.md,
    minWidth: 44,
  },
  bst: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 17,
  },
  chevron: {
    fontSize: fontSize.xl,
    color: colors.textMuted,
    marginLeft: spacing.sm,
  },
});
