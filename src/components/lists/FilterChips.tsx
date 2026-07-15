import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/constants/colors';
import { spacing, fontSize, borderRadius } from '@/constants/spacing';

export interface FilterOption {
  label: string;
  value: string;
  color?: string;
}

export interface FilterChipsProps {
  filters: FilterOption[];
  selected: string[];
  onToggle: (value: string) => void;
}

export const FilterChips: React.FC<FilterChipsProps> = ({ filters, selected, onToggle }) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {filters.map((filter) => {
        const isSelected = selected.includes(filter.value);
        const backgroundColor = isSelected
          ? filter.color || colors.primary
          : colors.surfaceElevated;
        const textColor = isSelected ? colors.accent : colors.textSecondary;
        const borderWidth = isSelected ? 0 : 1;

        return (
          <Pressable
            key={filter.value}
            style={[
              styles.chip,
              {
                backgroundColor,
                borderWidth,
              },
            ]}
            onPress={() => onToggle(filter.value)}
          >
            <Text style={[styles.chipText, { color: textColor }]}>{filter.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  contentContainer: {
    gap: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,
    borderRadius: borderRadius['2xl'],
    borderColor: colors.borderLight,
  },
  chipText: {
    fontSize: fontSize.xs,
    fontWeight: '500',
  },
});
