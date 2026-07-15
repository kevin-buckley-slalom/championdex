import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { colors } from '@/constants/colors';
import { spacing, fontSize, borderRadius } from '@/constants/spacing';

export interface CosmeticAlternatesSectionProps {
  alternates: Array<{
    id: string;
    name: string;
    spriteUrl: string;
  }>;
}

interface AlternateCardProps {
  alternate: {
    id: string;
    name: string;
    spriteUrl: string;
  };
}

const AlternateCard: React.FC<AlternateCardProps> = ({ alternate }) => {
  const accessibilityLabel = alternate.name;
  const accessibilityHint = `Cosmetic form: ${alternate.name}`;
  const SPRITE_SIZE = 64;

  return (
    <View
      accessible={true}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      style={styles.card}
    >
      <View style={[styles.spriteContainer, { width: SPRITE_SIZE, height: SPRITE_SIZE }]}>
        {alternate.spriteUrl ? (
          <ExpoImage
            source={{ uri: alternate.spriteUrl }}
            style={[styles.sprite, { width: SPRITE_SIZE, height: SPRITE_SIZE }]}
            contentFit="contain"
            cachePolicy="memory-disk"
            accessible={false}
          />
        ) : (
          <View
            style={[
              styles.sprite,
              { width: SPRITE_SIZE, height: SPRITE_SIZE, backgroundColor: colors.borderLight },
            ]}
            accessible={false}
          />
        )}
      </View>

      <Text
        style={styles.alternateName}
        numberOfLines={1}
        accessible={false}
      >
        {alternate.name}
      </Text>
    </View>
  );
};

export const CosmeticAlternatesSection: React.FC<CosmeticAlternatesSectionProps> = ({
  alternates,
}) => {
  if (!alternates || alternates.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>OTHER FORMS</Text>

      <View
        style={styles.grid}
        accessible={true}
        accessibilityRole="list"
        accessibilityLabel="Other forms"
      >
        {alternates.map((alternate) => (
          <AlternateCard key={alternate.id} alternate={alternate} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  card: {
    flex: 1,
    flexBasis: '30%',
    margin: spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  spriteContainer: {
    borderRadius: borderRadius.sm,
    backgroundColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  sprite: {
    borderRadius: borderRadius.sm,
  },
  alternateName: {
    fontSize: fontSize.xs,
    fontWeight: '500',
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
