import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/constants/colors';
import { spacing, fontSize } from '@/constants/spacing';

export interface SortOption {
  label: string;
  value: string;
}

export interface SortPickerProps {
  options: SortOption[];
  selected: string;
  onSelect: (value: string) => void;
}

export const SortPicker: React.FC<SortPickerProps> = ({ options, selected, onSelect }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Sort:</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
      >
        {options.map((option) => {
          const isSelected = option.value === selected;
          const textColor = isSelected ? colors.primary : colors.textMuted;
          const fontWeight = isSelected ? '600' : '400';

          return (
            <Pressable key={option.value} onPress={() => onSelect(option.value)}>
              <Text style={[styles.optionText, { color: textColor, fontWeight }]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs,
  },
  label: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginRight: spacing.xs,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    gap: spacing.sm,
  },
  optionText: {
    fontSize: fontSize.xs,
  },
});
