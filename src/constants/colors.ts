export const colors = {
  // Base dark theme — warm charcoal, not blue-black
  background: '#111010',   // near-black with a warm undertone
  surface: '#1E1A1A',      // warm dark surface
  surfaceElevated: '#2A2323', // card / sheet level
  border: '#3A2E2E',       // warm dark border
  borderLight: '#4D3E3E',  // subtle dividers

  // Text — warm white, not cool blue-white
  text: '#F5EEEE',
  textSecondary: '#B89E9E',
  textMuted: '#9A7A7A',    // lightened to meet WCAG AA 4.5:1

  // Brand — Pokéball red (shifted orange-ward to disambiguate from Fighting type #C03028)
  primary: '#DD3311',       // Pokéball red, distinct from type colors
  primaryLight: '#F04422',  // hover / pressed lighter
  primaryDark: '#AA2200',   // deep red for gradients

  // Accent — Pokéball white highlight
  accent: '#F0F0F0',
  accentDim: '#C8C0C0',

  // Status
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#FF453A',
  info: '#3D9BE9',
} as const;

export const typeColors: Record<string, string> = {
  normal: '#A8A878',
  fire: '#F08030',
  water: '#6890F0',
  electric: '#F8D030',
  grass: '#78C850',
  ice: '#98D8D8',
  fighting: '#C03028',
  poison: '#A040A0',
  ground: '#E0C068',
  flying: '#A890F0',
  psychic: '#F85888',
  bug: '#A8B820',
  rock: '#B8A038',
  ghost: '#705898',
  dragon: '#7038F8',
  dark: '#705848',
  steel: '#B8B8D0',
  fairy: '#EE99AC',
};

export const typeTextColors: Record<string, string> = {
  normal: '#000000',
  fire: '#FFFFFF',
  water: '#FFFFFF',
  electric: '#000000',
  grass: '#000000',
  ice: '#000000',
  fighting: '#FFFFFF',
  poison: '#FFFFFF',
  ground: '#000000',
  flying: '#FFFFFF',
  psychic: '#FFFFFF',
  bug: '#000000',
  rock: '#FFFFFF',
  ghost: '#FFFFFF',
  dragon: '#FFFFFF',
  dark: '#FFFFFF',
  steel: '#000000',
  fairy: '#000000',
};
