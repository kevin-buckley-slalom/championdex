export interface GenderRatio {
  male: number | null;
  female: number | null;
  genderless: boolean;
}

/**
 * Formats the gender rate from PokeAPI scale to percentage values.
 * PokeAPI scale: -1 = genderless, 0 = 100% male, 8 = 100% female
 *
 * @param genderRate Gender rate on PokeAPI scale (-1 to 8)
 * @returns Object with male%, female%, and genderless flag
 */
export function formatGenderRatio(genderRate: number): GenderRatio {
  if (genderRate === -1) {
    return { male: null, female: null, genderless: true };
  }

  const female = (genderRate / 8) * 100;
  const male = 100 - female;

  return { male, female, genderless: false };
}

/**
 * Formats gender ratio as a human-readable string.
 *
 * @param genderRate Gender rate on PokeAPI scale
 * @returns Formatted string, e.g. "50% male, 50% female" or "Genderless"
 */
export function formatGenderRatioString(genderRate: number): string {
  const ratio = formatGenderRatio(genderRate);

  if (ratio.genderless) {
    return 'Genderless';
  }

  if (ratio.male !== null && ratio.female !== null) {
    return `${ratio.male.toFixed(1)}% male, ${ratio.female.toFixed(1)}% female`;
  }

  return 'Unknown';
}

export function formatSlug(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Parses PokeAPI gender rate scale to percentage values.
 * PokeAPI scale: -1 = genderless, 0 = 100% male, 8 = 100% female
 *
 * @param genderRate Gender rate on PokeAPI scale (-1 to 8)
 * @returns Object with male%, female%, and genderless flag
 */
export function parseGenderRate(genderRate: number): {
  malePercent: number | null;
  femalePercent: number | null;
  isGenderless: boolean;
} {
  if (genderRate === -1) return { malePercent: null, femalePercent: null, isGenderless: true };
  if (genderRate === 0) return { malePercent: 100, femalePercent: 0, isGenderless: false };
  if (genderRate === 8) return { malePercent: 0, femalePercent: 100, isGenderless: false };
  const femalePercent = (genderRate / 8) * 100;
  return { malePercent: 100 - femalePercent, femalePercent, isGenderless: false };
}

/**
 * Formats height from meters to a readable string with both metric and imperial units.
 *
 * @param heightMeters Height in meters or null/undefined
 * @returns Formatted string, e.g. "1.7m / 5'7\""
 */
export function formatHeight(heightMeters: number | null | undefined): string {
  if (heightMeters === null || heightMeters === undefined) return '—';
  const totalInches = heightMeters * 39.3701;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return `${heightMeters.toFixed(1)}m / ${feet}'${inches}"`;
}

/**
 * Formats weight from kilograms to a readable string with both metric and imperial units.
 *
 * @param weightKg Weight in kilograms or null/undefined
 * @returns Formatted string, e.g. "6.5kg / 14.3lbs"
 */
export function formatWeight(weightKg: number | null | undefined): string {
  if (weightKg === null || weightKg === undefined) return '—';
  const lbs = (weightKg * 2.20462).toFixed(1);
  return `${weightKg.toFixed(1)}kg / ${lbs}lbs`;
}

export interface FormLabelResult {
  label: string | null;
  isPrimal: boolean;
  primalPrefix?: string;
  baseName?: string;
}

/**
 * Computes the form label to display below the Pokémon name based on form type and name.
 * Implements complex rules for default, regional, mega, gigantamax, cosmetic, and alternate forms.
 * Special handling for Primal forms and Ogerpon Tera forms.
 *
 * @param formType The form type (default, regional, mega, gigantamax, cosmetic, alternate)
 * @param formName The form name (e.g., "Female", "Primal", "Wellspring-Tera")
 * @param displayName The display name (e.g., "Alolan Vulpix", "Mega Charizard X")
 * @param pokemonName The pokemon slug/name (e.g., "vulpix", "ogerpon")
 * @returns Object with label (null if no label), isPrimal flag, and optional primal components
 */
export function computeFormLabel(
  formType: string,
  formName: string | null,
  displayName: string,
  pokemonName: string,
): FormLabelResult {
  // Default: show label only if DB has a form_name (e.g. Lycanroc Midday, Toxtricity Amped)
  if (formType === 'default') {
    if (formName) return { label: formName, isPrimal: false };
    return { label: null, isPrimal: false };
  }

  // Regional: form_name is already set in DB if needed
  if (formType === 'regional') {
    if (formName) return { label: formName, isPrimal: false };
    return { label: null, isPrimal: false };
  }

  if (formType === 'mega') {
    // Standard suffixes already in display_name — no label
    if (!formName || formName === 'Mega' || formName === 'Mega-X' || formName === 'Mega-Y' || formName === 'Mega-Z') {
      return { label: null, isPrimal: false };
    }
    if (formName === 'F') return { label: 'Female', isPrimal: false };
    if (formName === 'M') return { label: null, isPrimal: false };
    if (formName === 'Primal') return { label: null, isPrimal: false };
    return { label: formName, isPrimal: false };
  }

  if (formType === 'gigantamax') {
    if (!formName || formName === 'Gmax') return { label: null, isPrimal: false };
    return { label: formName, isPrimal: false };
  }

  // Cosmetic forms: show label only for Female; skip Nidoran♂/♀
  if (formType === 'cosmetic') {
    if (displayName.includes('♂') || displayName.includes('♀')) {
      return { label: null, isPrimal: false };
    }
    if (formName === 'F') {
      return { label: 'Female', isPrimal: false };
    }
    // Male or unknown: no label
    return { label: null, isPrimal: false };
  }

  // Alternate forms: form_name is already set correctly in DB
  if (formType === 'alternate') {
    if (!formName || formName === 'Primal') return { label: null, isPrimal: false };
    return { label: formName, isPrimal: false };
  }

  return { label: null, isPrimal: false };
}
