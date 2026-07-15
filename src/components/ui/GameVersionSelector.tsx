import React, { useRef, useCallback } from 'react';
import { ScrollView, Pressable, Text, StyleSheet, View } from 'react-native';
import { colors } from '@/constants/colors';
import { spacing, fontSize, borderRadius } from '@/constants/spacing';

export interface GameVersionOption {
  id: string;
  label: string;
}

interface GameVersionSelectorProps {
  options: GameVersionOption[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export const GameVersionSelector: React.FC<GameVersionSelectorProps> = ({
  options,
  selectedId,
  onSelect,
}) => {
  const scrollRef = useRef<ScrollView>(null);

  if (!options.length) return null;

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {options.map((option) => {
        const isActive = option.id === selectedId;
        return (
          <Pressable
            key={option.id}
            onPress={() => onSelect(option.id)}
            style={[styles.pill, isActive ? styles.pillActive : styles.pillInactive]}
          >
            <Text
              style={[styles.pillText, isActive ? styles.pillTextActive : styles.pillTextInactive]}
              numberOfLines={1}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
  },
  pill: {
    minWidth: 70,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: 20,
    marginRight: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillActive: {
    backgroundColor: colors.primary,
  },
  pillInactive: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  pillTextActive: {
    color: colors.accent,
  },
  pillTextInactive: {
    color: colors.textMuted,
  },
});
