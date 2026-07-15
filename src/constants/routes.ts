export const ROUTES = {
  POKEDEX: '/(main)/(pokedex)',
  POKEMON_DETAIL: '/(main)/(pokedex)/[id]',
  ABILITIES: '/(main)/(pokedex)/abilities',
  ABILITY_DETAIL: '/(main)/(pokedex)/abilities/[abilityId]',
  MOVES: '/(main)/(pokedex)/moves',
  MOVE_DETAIL: '/(main)/(pokedex)/moves/[moveId]',
  ITEMS: '/(main)/(pokedex)/items',
  ITEM_DETAIL: '/(main)/(pokedex)/items/[itemId]',
  TEAMS: '/(main)/(team)',
  TEAM_DETAIL: '/(main)/(team)/[teamId]',
  SETTINGS: '/(main)/(settings)',
} as const;
