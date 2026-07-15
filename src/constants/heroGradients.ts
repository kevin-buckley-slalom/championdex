/**
 * Hero Gradient Configuration for Dark Mode Pokémon Hero Component
 *
 * Provides type-specific radial gradients for the hero section backdrop.
 * Gradient transitions from a lightened type color (center) to the dark surface color (edges).
 *
 * File: src/constants/heroGradients.ts
 */

import { typeColors, colors } from './colors';

export interface HeroGradientConfig {
  type: string;
  centerColor: string;
  edgeColor: string;
}

/**
 * Pre-calculated hero gradients for all 18 Pokémon types.
 * Format: { centerColor (10% opacity lightened type color), edgeColor (surface dark color) }
 *
 * Calculation:
 * 1. Take base type color from typeColors
 * 2. Lighten by ~30% (move toward white)
 * 3. Apply 10% opacity (0x1A = 26 in hex = ~10%)
 * 4. Pair with surface color (#1E1A1A) at full opacity
 *
 * This creates a subtle type-tinted gradient that doesn't overwhelm the artwork.
 */
export const HERO_GRADIENTS: Record<string, HeroGradientConfig> = {
  normal: {
    type: 'normal',
    centerColor: '#D6D6B81A', // Lightened #A8A878 at 10% opacity
    edgeColor: colors.surface,
  },
  fire: {
    type: 'fire',
    centerColor: '#F4A85014', // Lightened #F08030 at 10% opacity
    edgeColor: colors.surface,
  },
  water: {
    type: 'water',
    centerColor: '#9CB5F511', // Lightened #6890F0 at 10% opacity
    edgeColor: colors.surface,
  },
  grass: {
    type: 'grass',
    centerColor: '#A8D87514', // Lightened #78C850 at 10% opacity
    edgeColor: colors.surface,
  },
  electric: {
    type: 'electric',
    centerColor: '#FCDE7011', // Lightened #F8D030 at 10% opacity
    edgeColor: colors.surface,
  },
  ice: {
    type: 'ice',
    centerColor: '#CBECEC11', // Lightened #98D8D8 at 10% opacity
    edgeColor: colors.surface,
  },
  fighting: {
    type: 'fighting',
    centerColor: '#DC8A8011', // Lightened #C03028 at 10% opacity
    edgeColor: colors.surface,
  },
  poison: {
    type: 'poison',
    centerColor: '#D2A0D211', // Lightened #A040A0 at 10% opacity
    edgeColor: colors.surface,
  },
  ground: {
    type: 'ground',
    centerColor: '#F0E0B811', // Lightened #E0C068 at 10% opacity
    edgeColor: colors.surface,
  },
  flying: {
    type: 'flying',
    centerColor: '#D4B5F511', // Lightened #A890F0 at 10% opacity
    edgeColor: colors.surface,
  },
  psychic: {
    type: 'psychic',
    centerColor: '#FB8FAD11', // Lightened #F85888 at 10% opacity
    edgeColor: colors.surface,
  },
  bug: {
    type: 'bug',
    centerColor: '#D6DC8011', // Lightened #A8B820 at 10% opacity
    edgeColor: colors.surface,
  },
  rock: {
    type: 'rock',
    centerColor: '#DCD08811', // Lightened #B8A038 at 10% opacity
    edgeColor: colors.surface,
  },
  ghost: {
    type: 'ghost',
    centerColor: '#B8A0C811', // Lightened #705898 at 10% opacity
    edgeColor: colors.surface,
  },
  dragon: {
    type: 'dragon',
    centerColor: '#B898FC11', // Lightened #7038F8 at 10% opacity
    edgeColor: colors.surface,
  },
  dark: {
    type: 'dark',
    centerColor: '#B8A89811', // Lightened #705848 at 10% opacity
    edgeColor: colors.surface,
  },
  steel: {
    type: 'steel',
    centerColor: '#DCD8E811', // Lightened #B8B8D0 at 10% opacity
    edgeColor: colors.surface,
  },
  fairy: {
    type: 'fairy',
    centerColor: '#F6CCDD11', // Lightened #EE99AC at 10% opacity
    edgeColor: colors.surface,
  },
};

/**
 * Get the hero gradient configuration for a given Pokémon type.
 * Falls back to normal type if type is not recognized.
 *
 * @param typePrimary - The Pokémon's primary type (e.g., 'electric', 'fire')
 * @returns HeroGradientConfig with centerColor and edgeColor
 */
export const getHeroGradient = (typePrimary: string): HeroGradientConfig => {
  const typeKey = typePrimary.toLowerCase();
  return HERO_GRADIENTS[typeKey] || HERO_GRADIENTS.normal;
};
