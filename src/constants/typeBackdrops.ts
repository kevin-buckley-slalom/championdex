/**
 * Backdrop Image Asset Map for PokemonHero Component
 *
 * Each type has a corresponding anime-style environment backdrop image.
 * Special Pokémon can override type-based selection via pokemonId mapping.
 *
 * File: src/constants/typeBackdrops.ts
 */

export const TYPE_BACKDROP_ASSETS = {
  normal: require('@assets/images/backdrops/normal.png'),
  fire: require('@assets/images/backdrops/fire.png'),
  water: require('@assets/images/backdrops/water.png'),
  grass: require('@assets/images/backdrops/grass.png'),
  electric: require('@assets/images/backdrops/electric.png'),
  ice: require('@assets/images/backdrops/ice.png'),
  fighting: require('@assets/images/backdrops/fighting.png'),
  poison: require('@assets/images/backdrops/poison.png'),
  ground: require('@assets/images/backdrops/ground.png'),
  flying: require('@assets/images/backdrops/flying.png'),
  psychic: require('@assets/images/backdrops/psychic.png'),
  bug: require('@assets/images/backdrops/bug.png'),
  rock: require('@assets/images/backdrops/rock.png'),
  ghost: require('@assets/images/backdrops/ghost.png'),
  dragon: require('@assets/images/backdrops/dragon.png'),
  dark: require('@assets/images/backdrops/dark.png'),
  steel: require('@assets/images/backdrops/steel.png'),
  fairy: require('@assets/images/backdrops/fairy.png'),
} as const;

/**
 * Special-case backdrop images for specific Pokémon.
 * These override type-based selection.
 */
export const SPECIAL_BACKDROP_ASSETS = {
  mewtwo: require('@assets/images/backdrops/mewtwo.png'),
  rayquaza: require('@assets/images/backdrops/rayquaza.png'),
  burnt_tower: require('@assets/images/backdrops/burnt_tower.png'),
  sky_pillar: require('@assets/images/backdrops/sky_pillar.png'),
  stadium: require('@assets/images/backdrops/stadium.png'),
  tempest: require('@assets/images/backdrops/tempest.png'),
  underwater: require('@assets/images/backdrops/underwater.png'),
} as const;

/**
 * Helper function to resolve the appropriate backdrop image for a Pokémon.
 * Priority: Gigantamax → Special Pokémon ID → Type-based → Normal fallback
 *
 * @param typePrimary - The Pokémon's primary type (e.g., 'electric', 'fire')
 * @param pokemonId - The national dex number (optional, used for special cases)
 * @param formType - The Pokémon's form type (e.g., 'gigantamax')
 * @returns The require() result for the backdrop image
 */
export const getBackdropAsset = (
  typePrimary: string,
  pokemonId?: number,
  formType?: string,
): number => {
  // Gigantamax forms always use the stadium backdrop
  if (formType === 'gigantamax') {
    return SPECIAL_BACKDROP_ASSETS.stadium;
  }

  // Special Pokémon mappings
  const specialMapping: { [key: number]: keyof typeof SPECIAL_BACKDROP_ASSETS } = {
    150: 'mewtwo', // Mewtwo
    384: 'rayquaza', // Rayquaza
  };

  if (pokemonId && specialMapping[pokemonId]) {
    return SPECIAL_BACKDROP_ASSETS[specialMapping[pokemonId]];
  }

  // Type-based backdrop selection
  const typeKey = typePrimary.toLowerCase() as keyof typeof TYPE_BACKDROP_ASSETS;
  if (typeKey in TYPE_BACKDROP_ASSETS) {
    return TYPE_BACKDROP_ASSETS[typeKey];
  }

  // Fallback to normal type
  return TYPE_BACKDROP_ASSETS.normal;
};
