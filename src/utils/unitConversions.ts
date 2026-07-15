/**
 * Converts height from decimeters to imperial format (feet'inches").
 * Game data stores height in decimeters (dm).
 *
 * @param heightDm Height in decimeters
 * @returns Formatted string, e.g. "6'7\"" or null if invalid
 */
export function toImperialHeight(heightDm: number | null): string | null {
  if (heightDm === null || heightDm === undefined || heightDm < 0) {
    return null;
  }

  // Convert dm to inches: dm * 10 cm / 2.54 cm per inch
  const totalInches = (heightDm * 10) / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);

  return `${feet}'${inches}"`;
}

/**
 * Converts height from decimeters to metric format (meters).
 * Game data stores height in decimeters (dm).
 *
 * @param heightDm Height in decimeters
 * @returns Formatted string, e.g. "2.0 m" or null if invalid
 */
export function toMetricHeight(heightDm: number | null): string | null {
  if (heightDm === null || heightDm === undefined || heightDm < 0) {
    return null;
  }

  const meters = heightDm / 10;
  return `${meters.toFixed(1)} m`;
}

/**
 * Converts weight from hectograms to imperial format (lbs).
 * Game data stores weight in hectograms (hg).
 *
 * @param weightHg Weight in hectograms
 * @returns Formatted string, e.g. "150.0 lbs" or null if invalid
 */
export function toImperialWeight(weightHg: number | null): string | null {
  if (weightHg === null || weightHg === undefined || weightHg < 0) {
    return null;
  }

  // 1 hg = 0.22046 lbs
  const lbs = weightHg * 0.22046;
  return `${lbs.toFixed(1)} lbs`;
}

/**
 * Converts weight from hectograms to metric format (kg).
 * Game data stores weight in hectograms (hg).
 *
 * @param weightHg Weight in hectograms
 * @returns Formatted string, e.g. "68.0 kg" or null if invalid
 */
export function toMetricWeight(weightHg: number | null): string | null {
  if (weightHg === null || weightHg === undefined || weightHg < 0) {
    return null;
  }

  const kg = weightHg / 10;
  return `${kg.toFixed(1)} kg`;
}

/**
 * Converts raw height value to a value suitable for display in a user's preferred unit system.
 * Returns both imperial and metric formatted strings.
 *
 * @param heightDm Height in decimeters
 * @returns Object with imperial and metric formatted strings
 */
export function formatHeight(heightDm: number | null): { imperial: string | null; metric: string | null } {
  return {
    imperial: toImperialHeight(heightDm),
    metric: toMetricHeight(heightDm),
  };
}

/**
 * Converts raw weight value to a value suitable for display in a user's preferred unit system.
 * Returns both imperial and metric formatted strings.
 *
 * @param weightHg Weight in hectograms
 * @returns Object with imperial and metric formatted strings
 */
export function formatWeight(weightHg: number | null): { imperial: string | null; metric: string | null } {
  return {
    imperial: toImperialWeight(weightHg),
    metric: toMetricWeight(weightHg),
  };
}
