export type ObtainMethod = 'evolution-only' | 'fossil' | 'mythical' | 'gen9-unknown' | 'no-data';

const FOSSIL_POKEMON = new Set([409, 411, 567]); // Rampardos, Bastiodon, Archeops

export function getObtainMethod(
  nationalDex: number,
  isMythical: boolean,
  generation: number
): ObtainMethod {
  if (generation >= 9) return 'gen9-unknown';
  if (FOSSIL_POKEMON.has(nationalDex)) return 'fossil';
  if (isMythical) return 'mythical';
  return 'evolution-only';
}
