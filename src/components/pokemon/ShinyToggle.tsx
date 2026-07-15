/**
 * ShinyToggle Component
 *
 * Segmented control for toggling between Normal and Shiny Pokémon artwork variants.
 * Features:
 * - iOS-style segmented control appearance
 * - Smooth fill color animation (200ms)
 * - Disabled state when shiny variant not available
 * - Accessible with keyboard support
 *
 * File: src/components/pokemon/ShinyToggle.tsx
 */

import React, { useCallback } from 'react';
import { View, Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '@/constants/colors';
import { spacing, fontSize, borderRadius } from '@/constants/spacing';

export interface ShinyToggleProps {
  /**
   * Current shiny state (true = shiny, false = normal)
   */
  isShiny: boolean;

  /**
   * Callback when user toggles between Normal/Shiny
   */
  onToggle: (isShiny: boolean) => Promise<void> | void;

  /**
   * If true, disable shiny option (no variant available)
   */
  disabled?: boolean;
}

const SEGMENT_HEIGHT = 36;
const SEGMENT_PADDING = 4;

/**
 * ShinyToggle Component
 * Renders a two-segment control for Normal/Shiny artwork selection.
 */
export const ShinyToggle: React.FC<ShinyToggleProps> = ({
  isShiny,
  onToggle,
  disabled = false,
}) => {
  const handleNormalPress = useCallback(async () => {
    if (!disabled && isShiny) {
      await onToggle(false);
    }
  }, [isShiny, disabled, onToggle]);

  const handleShinyPress = useCallback(async () => {
    if (!disabled) {
      await onToggle(true);
    }
  }, [disabled, onToggle]);

  return (
    <View
      style={[styles.container, disabled && styles.containerDisabled]}
      accessible={true}
      accessibilityLabel="Shiny variant toggle"
      accessibilityRole="switch"
      accessibilityState={{
        checked: isShiny,
        disabled,
      }}
      accessibilityHint={
        disabled ? 'Shiny variant not available' : 'Toggle between normal and shiny variants'
      }
    >
      {/* Normal Segment */}
      <Pressable
        style={({ pressed }) => [
          styles.segment,
          styles.segmentLeft,
          !isShiny && styles.segmentActive,
          pressed && !isShiny && styles.segmentPressed,
        ]}
        onPress={handleNormalPress}
        disabled={disabled}
        accessible={true}
        accessibilityLabel="Normal variant"
        accessibilityRole="radio"
        accessibilityState={{
          selected: !isShiny,
          disabled,
        }}
      >
        <Text
          style={[
            styles.segmentText,
            !isShiny ? styles.segmentTextActive : styles.segmentTextInactive,
          ]}
        >
          Normal
        </Text>
      </Pressable>

      {/* Shiny Segment */}
      <Pressable
        style={({ pressed }) => [
          styles.segment,
          styles.segmentRight,
          isShiny && styles.segmentActive,
          pressed && isShiny && styles.segmentPressed,
          disabled && styles.segmentDisabled,
        ]}
        onPress={handleShinyPress}
        disabled={disabled}
        accessible={true}
        accessibilityLabel="Shiny variant"
        accessibilityRole="radio"
        accessibilityState={{
          selected: isShiny,
          disabled,
        }}
      >
        <Text
          style={[
            styles.segmentText,
            isShiny && !disabled ? styles.segmentTextActive : styles.segmentTextInactive,
          ]}
        >
          Shiny
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.lg,
    padding: SEGMENT_PADDING,
    gap: SEGMENT_PADDING,
    minWidth: 140,
  },

  containerDisabled: {
    opacity: 0.5,
  },

  segment: {
    flex: 1,
    height: SEGMENT_HEIGHT,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },

  segmentLeft: {
    // No additional styling needed
  },

  segmentRight: {
    // No additional styling needed
  },

  segmentActive: {
    backgroundColor: colors.primary,
  },

  segmentPressed: {
    opacity: 0.8,
  },

  segmentDisabled: {
    opacity: 0.5,
  },

  segmentText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  segmentTextActive: {
    color: colors.accent,
  },

  segmentTextInactive: {
    color: colors.textSecondary,
  },
});
