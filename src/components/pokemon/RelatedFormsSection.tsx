import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { colors } from '@/constants/colors';
import { spacing, fontSize, borderRadius } from '@/constants/spacing';
import { TypeBadge } from '@/components/common/TypeBadge';

export interface RelatedForm {
  id: number;
  name: string;
  formType: 'base' | 'alolan' | 'galar' | 'hisui' | 'mega_x' | 'mega_y' | 'gmax' | string;
  spriteUrl: string | null;
  typePrimary: string;
  typeSecondary?: string | null;
  isCurrent: boolean;
}

export interface RelatedFormsSectionProps {
  forms: RelatedForm[];
  onFormPress: (formId: number, formName: string) => void;
  currentPokemonName?: string;
  activeFormId?: number;
}

interface FormCardProps {
  form: RelatedForm;
  onPress: () => void;
  cardWidth: number;
}

const FormCard: React.FC<FormCardProps> = ({ form, onPress, cardWidth }) => {
  const accessibilityLabel = form.name;
  const accessibilityHint = `Tap to view ${form.name} details.`;

  return (
    <Pressable
      onPress={onPress}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{
        disabled: false,
      }}
      style={({ pressed }) => [
        styles.card,
        { width: cardWidth },
        {
          opacity: pressed ? 0.7 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
      ]}
    >
      {/* Sprite Container */}
      <View style={styles.spriteContainer}>
        {form.spriteUrl ? (
          <ExpoImage
            source={{ uri: form.spriteUrl }}
            style={styles.sprite}
            contentFit="contain"
            cachePolicy="memory-disk"
            accessible={false}
          />
        ) : (
          <View
            style={styles.sprite}
            accessible={false}
          />
        )}
      </View>

      {/* Form Name */}
      <Text
        style={styles.formName}
        numberOfLines={1}
        accessible={false}
      >
        {form.name}
      </Text>

      {/* Type Badges */}
      <View style={styles.typesContainer}>
        <TypeBadge type={form.typePrimary} size="sm" fixed />
        {form.typeSecondary && (
          <TypeBadge type={form.typeSecondary} size="sm" fixed />
        )}
      </View>
    </Pressable>
  );
};

export const RelatedFormsSection: React.FC<RelatedFormsSectionProps> = ({
  forms,
  onFormPress,
  currentPokemonName = 'Pokémon',
  activeFormId,
}) => {
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = (screenWidth - 14 - 2 * spacing.lg - 3 * spacing.xs * 2) / 3;

  // Filter out the current form
  const filteredForms = useMemo(() => {
    return forms.filter((form) => !form.isCurrent);
  }, [forms]);

  // Return null if no forms remain after filtering
  if (!filteredForms || filteredForms.length === 0) {
    return null;
  }

  const handleFormPress = useCallback(
    (formId: number, formName: string) => {
      onFormPress(formId, formName);
    },
    [onFormPress],
  );

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <Text style={styles.sectionTitle}>RELATED FORMS</Text>

      {/* Grid */}
      <View
        style={styles.grid}
        accessible={true}
        accessibilityRole="list"
        accessibilityLabel="Related forms"
      >
        {filteredForms.map((form) => (
          <FormCard
            key={form.id}
            form={form}
            onPress={() => handleFormPress(form.id, form.name)}
            cardWidth={cardWidth}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
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
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  sprite: {
    width: 64,
    height: 64,
  },
  formName: {
    fontSize: fontSize.xs,
    fontWeight: '500',
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  typesContainer: {
    width: '100%',
    gap: spacing.xs,
    alignItems: 'center',
  },
});
