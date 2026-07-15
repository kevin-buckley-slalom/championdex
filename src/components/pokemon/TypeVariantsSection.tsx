import React from 'react';
import {
  View,
  Text,
  StyleSheet,
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
}

const VariantCard: React.FC<VariantCardProps> = ({ variant }) => {
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
      style={styles.card}
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
              { width: SPRITE_SIZE, height: SPRITE_SIZE, backgroundColor: colors.borderLight },
            ]}
            accessible={false}
          />
        )}
      </View>

      <View style={styles.typesContainer}>
        <TypeBadge type={variant.typePrimary} size="sm" />
        {variant.typeSecondary && (
          <TypeBadge type={variant.typeSecondary} size="sm" />
        )}
      </View>

      <Text
        style={styles.variantName}
        numberOfLines={1}
        accessible={false}
      >
        {variant.name}
      </Text>
    </View>
  );
};

export const TypeVariantsSection: React.FC<TypeVariantsSectionProps> = ({
  variants,
}) => {
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
          <VariantCard key={variant.id} variant={variant} />
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
