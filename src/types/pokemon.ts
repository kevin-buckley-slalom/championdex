export type PokemonType =
  | 'normal' | 'fire' | 'water' | 'electric' | 'grass' | 'ice'
  | 'fighting' | 'poison' | 'ground' | 'flying' | 'psychic' | 'bug'
  | 'rock' | 'ghost' | 'dragon' | 'dark' | 'steel' | 'fairy';

export type FormType = 'default' | 'regional' | 'mega' | 'gigantamax' | 'cosmetic' | 'alternate';
export type GameExclusivity = 'past-gen' | 'lgpe' | null;

export interface PokemonStats {
  hp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
}

export interface Pokemon {
  id: number;
  nationalDex: number;
  pokeApiId: number;
  name: string;
  displayName: string;
  formType: FormType;
  formName: string | null;
  primaryType: PokemonType;
  secondaryType: PokemonType | null;
  baseStats: PokemonStats;
  height: number;
  weight: number;
  generation: number;
  isLegendary: boolean;
  isMythical: boolean;
  spriteUrl: string | null;
  artworkUrl: string | null;
  shinyUrl: string | null;
  shinySpriteUrl: string | null;
  cosmeticVariants: CosmeticVariant[];
  gameExclusivity: GameExclusivity;
  abilityIds: number[];
  hiddenAbilityId: number | null;
}

export interface CosmeticVariant {
  name: string;
  spriteUrl: string | null;
  shinySpriteUrl: string | null;
}

export interface PokemonListItem {
  id: number;
  nationalDex: number;
  pokeApiId: number;
  name: string;
  displayName: string;
  formType: FormType;
  formName: string | null;
  primaryType: PokemonType;
  secondaryType: PokemonType | null;
  spriteUrl: string | null;
  generation: number;
  gameExclusivity: GameExclusivity;
  baseStats: PokemonStats;
}
