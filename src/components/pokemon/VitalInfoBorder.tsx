/**
 * VitalInfoBorder Component
 *
 * Renders a continuous SVG open-bottom path frame for the Pokémon detail screen's vital info overlay.
 *
 * The path draws:
 * 1. Left vertical bar from hero top down to overlayTop (sharp right-angle turn)
 * 2. Horizontal line from left bar right to infoBlockRight (info box is visually open on the right)
 * 3. At the gap between info block and star, dip DOWN with DIAGONAL walls into a notch
 * 4. Cross the bottom of the gap with sharp corners, then exit UP with diagonal right wall to screen edge
 *
 * Key geometry:
 * - overlayTop = heroHeight - overlayHeight (main horizontal line runs here)
 * - gapBottom = overlayTop + overlayHeight (bottom depth of the gap notch)
 * - Left diagonal wall: gradual outward lean (leftSlopeOffset = 24)
 * - Right diagonal wall: sharper inward lean (rightSlopeOffset = 14)
 * - Gap bottom is a sharp horizontal segment connecting the two diagonal base points
 * - Info box and star box both sit UNDER the line; line only dips through the empty space between them
 *
 * No bottom closure — both boxes are open at the bottom.
 *
 * File: src/components/pokemon/VitalInfoBorder.tsx
 */

import React from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface VitalInfoBorderProps {
  /**
   * Right edge x-coordinate of the left info box (measured via onLayout)
   */
  infoBlockRight: number;

  /**
   * Left edge x-coordinate of the star box (measured via onLayout)
   */
  starBoxLeft: number;

  /**
   * Type-based color for the SVG stroke
   */
  typeColor: string;

  /**
   * Total height of the hero container
   */
  heroHeight: number;

  /**
   * Height of the overlay zone (typically 64px)
   */
  overlayHeight: number;

  /**
   * Screen width in pixels (for SVG viewport)
   */
  screenWidth: number;

  /**
   * Card surface color for the notch fill (e.g., 'rgb(20, 18, 18)')
   * Solid opaque color blended from dark background and ambient tint
   * Default: '#111010' (matches dark background)
   */
  cardSurfaceColor?: string;
}

/**
 * Renders a split component: a View for the left bar and an SVG for the bottom notch.
 * The View naturally resizes as the hero collapses (overflow:hidden on parent).
 * The SVG is positioned at bottom: 0, so it stays pinned as the hero collapses.
 */
export const VitalInfoBorder: React.FC<VitalInfoBorderProps> = ({
  infoBlockRight,
  starBoxLeft,
  typeColor,
  heroHeight,
  overlayHeight,
  screenWidth,
  cardSurfaceColor = '#111010',
}) => {
  // Position where overlay starts (from top of hero)
  const overlayTop = heroHeight - overlayHeight;

  // Bottom depth of the gap notch (within the 64px SVG zone, y ranges 0 to overlayHeight)
  const gapBottom = overlayHeight;

  // Left edge of SVG path — offset by 1px so 1.5px stroke doesn't clip left edge
  const x = 1;

  // Rounded corner radius (slightly smaller for diagonal transitions)
  const r = 6;

  // Diagonal wall slope offsets
  const leftSlopeOffset = 24;   // Left wall: gradual outward lean
  const rightSlopeOffset = 14;  // Right wall: sharper inward lean

  // Computed base points for diagonal walls at gap bottom
  const leftWallBottomX = infoBlockRight + leftSlopeOffset;
  const rightWallBottomX = starBoxLeft - rightSlopeOffset;

  // Construct the SVG path with y coordinates 0-based (0 = top of 64px notch zone)
  // The horizontal line is at y=0 (overlayTop in SVG space)
  const d = [
    `M ${x} 0`,                                                                    // Start at top-left
    // Smooth transition into left diagonal wall
    `L ${infoBlockRight - r} 0`,                                                  // Right to approach point
    `Q ${infoBlockRight} 0 ${infoBlockRight + r} ${r}`,                           // Corner: horizontal→diagonal
    // Left diagonal wall to gap bottom (sharp corner at bottom)
    `L ${leftWallBottomX} ${gapBottom}`,
    // Right across gap bottom (sharp corners)
    `L ${rightWallBottomX} ${gapBottom}`,
    // Right diagonal wall up (sharp corner at bottom, smooth at top)
    `L ${starBoxLeft - r} ${r}`,
    `Q ${starBoxLeft} 0 ${starBoxLeft + r} 0`,                                    // Corner: diagonal→horizontal
    // Continue right to screen edge
    `L ${screenWidth} 0`,
  ].join(' ');

  // Left notch fill path (traces diagonal wall interior on left side)
  const leftNotchPath = [
    `M 0 0`,
    `L ${infoBlockRight - r} 0`,
    `Q ${infoBlockRight} 0 ${infoBlockRight + r} ${r}`,
    `L ${leftWallBottomX} ${gapBottom}`,
    `L 0 ${gapBottom}`,
    'Z',
  ].join(' ');

  // Right notch fill path (traces diagonal wall interior on right side)
  const rightNotchPath = [
    `M ${rightWallBottomX} ${gapBottom}`,
    `L ${starBoxLeft - r} ${r}`,
    `Q ${starBoxLeft} 0 ${starBoxLeft + r} 0`,
    `L ${screenWidth} 0`,
    `L ${screenWidth} ${gapBottom}`,
    'Z',
  ].join(' ');

  return (
    <>
      {/* Left vertical bar — rendered as a View, naturally resizes as hero collapses */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 1,
          width: 1.5,
          bottom: overlayHeight,
          backgroundColor: typeColor,
        }}
        pointerEvents="none"
      />

      {/* Bottom notch SVG — pinned at bottom: 0, stays visible as hero collapses */}
      <Svg
        width={screenWidth}
        height={overlayHeight}
        style={{ position: 'absolute', bottom: 0, left: 0 }}
        pointerEvents="none"
      >
        {/* Fill left notch interior with solid card surface color */}
        <Path
          d={leftNotchPath}
          fill={cardSurfaceColor}
          stroke="none"
        />
        {/* Fill right notch interior with solid card surface color */}
        <Path
          d={rightNotchPath}
          fill={cardSurfaceColor}
          stroke="none"
        />
        {/* Main border stroke */}
        <Path
          d={d}
          stroke={typeColor}
          strokeWidth={1.5}
          fill="none"
        />
      </Svg>
    </>
  );
};
