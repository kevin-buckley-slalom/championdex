import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  ViewStyle,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { colors, typeColors } from '@/constants/colors';
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

interface PaginationDotProps {
  active: boolean;
  color: string;
}

const PaginationDot: React.FC<PaginationDotProps> = ({ active, color }) => (
  <View
    style={[
      styles.dot,
      {
        backgroundColor: active ? color : colors.borderLight,
      },
    ]}
  />
);

interface FormCardProps {
  form: RelatedForm;
  onPress: () => void;
  accentColor: string;
}

const FormCard: React.FC<FormCardProps> = ({ form, onPress, accentColor }) => {
  const accessibilityLabel = form.name;
  const accessibilityHint = form.isCurrent
    ? `Currently selected. Tap to view ${form.name} details.`
    : `Tap to view ${form.name} details.`;

  return (
    <Pressable
      onPress={onPress}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{
        selected: form.isCurrent,
        disabled: false,
      }}
      style={({ pressed }) => [
        styles.card,
        {
          borderColor: form.isCurrent ? accentColor : colors.border,
          borderWidth: form.isCurrent ? 2 : 1,
          opacity: pressed ? 0.7 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
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
            style={[styles.sprite, { backgroundColor: colors.borderLight }]}
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
        <TypeBadge type={form.typePrimary} size="sm" />
        {form.typeSecondary && (
          <TypeBadge type={form.typeSecondary} size="sm" />
        )}
      </View>

      {/* Active Indicator */}
      {form.isCurrent && (
        <View
          style={[styles.activeIndicator, { backgroundColor: accentColor }]}
          accessible={false}
        />
      )}
    </Pressable>
  );
};

export const RelatedFormsSection: React.FC<RelatedFormsSectionProps> = ({
  forms,
  onFormPress,
  currentPokemonName = 'Pokémon',
  activeFormId,
}) => {
  const [scrollOffset, setScrollOffset] = useState(0);
  const { width: screenWidth } = useWindowDimensions();

  // Return null if no forms
  if (!forms || forms.length === 0) {
    return null;
  }

  // Determine section title based on form count
  const sectionTitle = forms.length >= 6 ? 'FORMS & VARIANTS' : 'RELATED FORMS';

  // Get the accent color from the first form's primary type
  const accentColor = useMemo(() => {
    return typeColors[forms[0]?.typePrimary.toLowerCase()] || colors.primary;
  }, [forms]);

  // Calculate card dimensions based on screen width
  const cardWidth = 100;
  const cardGap = spacing.md;
  const totalCardWidth = cardWidth + cardGap;

  // Calculate pagination state
  const isLargeCollection = forms.length >= 4;
  const visibleCardsCount = Math.floor((screenWidth - 2 * spacing.lg) / totalCardWidth);
  const currentPageIndex = Math.round(scrollOffset / totalCardWidth);

  const handleFormPress = useCallback(
    (formId: number, formName: string) => {
      onFormPress(formId, formName);
    },
    [onFormPress],
  );

  const handleScroll = (event: any) => {
    const offset = event.nativeEvent.contentOffset.x;
    setScrollOffset(offset);
  };

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <Text style={styles.sectionTitle}>{sectionTitle}</Text>

      {/* Carousel */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        style={styles.carouselContainer}
        contentContainerStyle={styles.carouselContent}
        accessible={true}
        accessibilityRole="adjustable"
        accessibilityLabel={`${sectionTitle} carousel`}
        accessibilityHint="Swipe left or right to view more forms"
      >
        {forms.map((form) => (
          <FormCard
            key={form.id}
            form={form}
            onPress={() => handleFormPress(form.id, form.name)}
            accentColor={accentColor}
          />
        ))}
      </ScrollView>

      {/* Pagination Dots (show only for large collections) */}
      {isLargeCollection && forms.length > 1 && (
        <View style={styles.paginationContainer}>
          {forms.map((_, index) => (
            <PaginationDot
              key={`dot-${index}`}
              active={index === currentPageIndex}
              color={accentColor}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.lg,
  },
  sectionTitle: {
    paddingHorizontal: spacing.lg,
    fontSize: fontSize['2xl'],
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  carouselContainer: {
    height: 160,
  },
  carouselContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    paddingRight: spacing.lg,
  },
  card: {
    width: 100,
    height: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  spriteContainer: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  sprite: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.sm,
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
  activeIndicator: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
    marginTop: spacing.xs,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
