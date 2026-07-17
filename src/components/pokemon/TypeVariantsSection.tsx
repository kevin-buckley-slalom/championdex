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
import { TypeBadge } from '@/components/common/TypeBadge';

export interface TypeVariantsSectionProps {
  variants: Array<{
    id: string;
    name: string;
    spriteUrl: string;
    typePrimary: string;
    typeSecondary?: string;
  }>;
}

interface VariantCardProps {
  variant: {
    id: string;
    name: string;
    spriteUrl: string;
    typePrimary: string;
    typeSecondary?: string;
  };
  cardWidth: number;
}

const VariantCard: React.FC<VariantCardProps> = ({ variant, cardWidth }) => {
  const accessibilityLabel = variant.name;
  const typeInfo = variant.typeSecondary
    ? `${variant.typePrimary} and ${variant.typeSecondary}`
    : variant.typePrimary;
  const accessibilityHint = `Type form: ${variant.name}, type: ${typeInfo}`;
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
        {variant.spriteUrl ? (
          <ExpoImage
            source={{ uri: variant.spriteUrl }}
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

      <View style={styles.typesContainer}>
        <TypeBadge type={variant.typePrimary} size="sm" fixed />
        {variant.typeSecondary && (
          <TypeBadge type={variant.typeSecondary} size="sm" fixed />
        )}
      </View>

    </View>
  );
};

export const TypeVariantsSection: React.FC<TypeVariantsSectionProps> = ({
  variants,
}) => {
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = (screenWidth - 14 - 2 * spacing.lg - 3 * spacing.xs * 2) / 3;

  if (!variants || variants.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>TYPE FORMS</Text>

      <View
        style={styles.grid}
        accessible={true}
        accessibilityRole="list"
        accessibilityLabel="Type forms"
      >
        {variants.map((variant) => (
          <VariantCard key={variant.id} variant={variant} cardWidth={cardWidth} />
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
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
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
  typesContainer: {
    width: '100%',
    gap: spacing.xs,
    alignItems: 'center',
  },
  variantName: {
    fontSize: fontSize.xs,
    fontWeight: '500',
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
