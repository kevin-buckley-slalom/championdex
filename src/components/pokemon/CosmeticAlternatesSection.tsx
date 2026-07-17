import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
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
  cardWidth: number;
}

const AlternateCard: React.FC<AlternateCardProps> = ({ alternate, cardWidth }) => {
  const accessibilityLabel = alternate.name;
  const accessibilityHint = `Cosmetic form: ${alternate.name}`;
  const SPRITE_SIZE = 64;

  return (
    <View
      accessible={true}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      style={[styles.card, { width: cardWidth }]}
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
              { width: SPRITE_SIZE, height: SPRITE_SIZE },
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
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = (screenWidth - 14 - 2 * spacing.lg - 3 * spacing.xs * 2) / 3;

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
          <AlternateCard key={alternate.id} alternate={alternate} cardWidth={cardWidth} />
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
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  card: {
    margin: spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    padding: spacing.sm,
    alignItems: 'center',
  },
  spriteContainer: {
    borderRadius: borderRadius.sm,
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
