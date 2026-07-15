/**
 * VitalInfoOverlay Component
 *
 * Renders two bordered boxes that float over the hero's bottom fade zone:
 * - Left box: Pokémon dex number, name, form name, and type badges
 * - Right box: Container for the shiny star button (visual border only, logic in parent)
 *
 * File: src/components/pokemon/VitalInfoOverlay.tsx
 */

import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { colors } from '@/constants/colors';
import { spacing, fontSize } from '@/constants/spacing';

export interface VitalInfoOverlayProps {
  /**
   * National dex number (e.g., 25 for Pikachu)
   */
  nationalDex: number;

  /**
   * Hex color for the type-based border (from typeColors map)
   */
  typeColor: string;

  /**
   * Callback when left box layout is measured.
   * Called with the right edge x-coordinate (x + width) of the left box.
   */
  onLeftBoxLayout?: (right: number) => void;

  /**
   * Callback when right (star) box layout is measured.
   * Called with the left edge x-coordinate of the right box.
   */
  onRightBoxLayout?: (left: number) => void;
}

/**
 * VitalInfoOverlay Component
 * Renders the left info box and right star button container over the hero fade
 */
export const VitalInfoOverlay: React.FC<VitalInfoOverlayProps> = ({
  nationalDex,
  typeColor,
  onLeftBoxLayout,
  onRightBoxLayout,
}) => {
  return (
    <View style={styles.overlayContainer} pointerEvents="box-none">
      {/* Left box: dex number only */}
      <View
        style={styles.leftBox}
        onLayout={(e) => {
          const { x, width } = e.nativeEvent.layout;
          onLeftBoxLayout?.(x + width);
        }}
      >
        <Text style={styles.dexNumber}>
          #{String(nationalDex).padStart(3, '0')}
        </Text>
      </View>

      {/* Right box: container for shiny star button (border only, logic in parent) */}
      <View
        style={styles.rightBox}
        onLayout={(e) => {
          onRightBoxLayout?.(e.nativeEvent.layout.x);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 52,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    pointerEvents: 'box-none',
  },

  leftBox: {
    backgroundColor: 'transparent',
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignSelf: 'center',
    marginRight: spacing.md,
  },

  dexNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 1,
  },

  rightBox: {
    backgroundColor: 'transparent',
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
