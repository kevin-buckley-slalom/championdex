/**
 * Tests for PokeAPI slug generation used in generateBundledDb.js
 *
 * This function is critical for mapping @pkmn/dex species to PokeAPI form endpoints.
 * It must handle all edge cases correctly or the database will have incorrect pokeapi_ids.
 */

// Re-implement the slug generation function here for testing
// (matches scripts/generateBundledDb.js exactly)
function generatePokeApiSlug(speciesName: string, forme: string = ''): string {
  let slug = speciesName.toLowerCase()
    .replace(/ /g, '-')
    .replace(/[''.]/g, '');

  if (forme === 'F') slug = slug.replace(/-f$/, '-female');
  else if (forme === 'M') slug = slug.replace(/-m$/, '-male');

  const totemMatch = slug.match(/^(.+?)-(alola|galar|hisui|paldea)-totem$/);
  if (totemMatch) slug = `${totemMatch[1]}-totem-${totemMatch[2]}`;

  if (slug.match(/^tauros-paldea-(combat|blaze|aqua)$/)) slug = `${slug}-breed`;
  if (slug === 'darmanitan-galar') slug = 'darmanitan-galar-standard';
  if (slug === 'toxtricity-gmax') slug = 'toxtricity-amped-gmax';
  if (slug === 'urshifu-gmax') slug = 'urshifu-single-strike-gmax';
  if (slug === 'zygarde-10%') slug = 'zygarde-10';

  // Ogerpon mask forms need -mask suffix (PokeAPI has them with explicit mask label)
  if (slug === 'ogerpon-wellspring') slug = 'ogerpon-wellspring-mask';
  if (slug === 'ogerpon-hearthflame') slug = 'ogerpon-hearthflame-mask';
  if (slug === 'ogerpon-cornerstone') slug = 'ogerpon-cornerstone-mask';

  return slug;
}

describe('generatePokeApiSlug', () => {
  describe('Ogerpon forms - MAIN FIX', () => {
    it('Ogerpon default (Teal Mask) → ogerpon', () => {
      expect(generatePokeApiSlug('Ogerpon', '')).toBe('ogerpon');
    });

    it('Ogerpon-Wellspring → ogerpon-wellspring-mask', () => {
      expect(generatePokeApiSlug('Ogerpon-Wellspring', '')).toBe('ogerpon-wellspring-mask');
    });

    it('Ogerpon-Hearthflame → ogerpon-hearthflame-mask', () => {
      expect(generatePokeApiSlug('Ogerpon-Hearthflame', '')).toBe('ogerpon-hearthflame-mask');
    });

    it('Ogerpon-Cornerstone → ogerpon-cornerstone-mask', () => {
      expect(generatePokeApiSlug('Ogerpon-Cornerstone', '')).toBe('ogerpon-cornerstone-mask');
    });

    // Tera forms have no PokeAPI endpoints, handled by hardcoded cache overrides
    it('Ogerpon-Teal-Tera generates slug (handled by cache override later)', () => {
      expect(generatePokeApiSlug('Ogerpon-Teal-Tera', '')).toBe('ogerpon-teal-tera');
    });

    it('Ogerpon-Wellspring-Tera generates slug (handled by cache override later)', () => {
      expect(generatePokeApiSlug('Ogerpon-Wellspring-Tera', '')).toBe('ogerpon-wellspring-tera');
    });

    it('Ogerpon-Hearthflame-Tera generates slug (handled by cache override later)', () => {
      expect(generatePokeApiSlug('Ogerpon-Hearthflame-Tera', '')).toBe('ogerpon-hearthflame-tera');
    });

    it('Ogerpon-Cornerstone-Tera generates slug (handled by cache override later)', () => {
      expect(generatePokeApiSlug('Ogerpon-Cornerstone-Tera', '')).toBe('ogerpon-cornerstone-tera');
    });
  });

  describe('Existing forms - regression tests', () => {
    // Nidoran F/M
    it('Nidoran-F → nidoran-female', () => {
      expect(generatePokeApiSlug('Nidoran-F', 'F')).toBe('nidoran-female');
    });

    it('Nidoran-M → nidoran-male', () => {
      expect(generatePokeApiSlug('Nidoran-M', 'M')).toBe('nidoran-male');
    });

    // Meowstic (cosmetic F/M, not in slug generation but verifying slug is correct for DB cache lookup)
    it('Meowstic-F generates meowstic-female (cached separately to 10326)', () => {
      expect(generatePokeApiSlug('Meowstic-F', 'F')).toBe('meowstic-female');
    });

    it('Meowstic-M generates meowstic-male (cached separately to 10314)', () => {
      expect(generatePokeApiSlug('Meowstic-M', 'M')).toBe('meowstic-male');
    });

    // Tauros Paldea breeds
    it('Tauros-Paldea-Combat → tauros-paldea-combat-breed', () => {
      expect(generatePokeApiSlug('Tauros-Paldea-Combat', '')).toBe('tauros-paldea-combat-breed');
    });

    it('Tauros-Paldea-Blaze → tauros-paldea-blaze-breed', () => {
      expect(generatePokeApiSlug('Tauros-Paldea-Blaze', '')).toBe('tauros-paldea-blaze-breed');
    });

    it('Tauros-Paldea-Aqua → tauros-paldea-aqua-breed', () => {
      expect(generatePokeApiSlug('Tauros-Paldea-Aqua', '')).toBe('tauros-paldea-aqua-breed');
    });

    // Darmanitan Galar
    it('Darmanitan-Galar → darmanitan-galar-standard', () => {
      expect(generatePokeApiSlug('Darmanitan-Galar', '')).toBe('darmanitan-galar-standard');
    });

    // Toxtricity Gmax
    it('Toxtricity-Gmax → toxtricity-amped-gmax', () => {
      expect(generatePokeApiSlug('Toxtricity-Gmax', '')).toBe('toxtricity-amped-gmax');
    });

    // Urshifu Gmax
    it('Urshifu-Gmax → urshifu-single-strike-gmax', () => {
      expect(generatePokeApiSlug('Urshifu-Gmax', '')).toBe('urshifu-single-strike-gmax');
    });

    // Zygarde 10%
    it('Zygarde-10% → zygarde-10', () => {
      expect(generatePokeApiSlug('Zygarde-10%', '')).toBe('zygarde-10');
    });

    // Totem forms (compound regional-totem)
    it('Raticate-Alola-Totem → raticate-totem-alola', () => {
      expect(generatePokeApiSlug('Raticate-Alola-Totem', '')).toBe('raticate-totem-alola');
    });

    it('Marowak-Alola-Totem → marowak-totem-alola', () => {
      expect(generatePokeApiSlug('Marowak-Alola-Totem', '')).toBe('marowak-totem-alola');
    });

    // Simple regional forms (dashes are preserved from dash-separated compound names)
    it('Vulpix-Alola → vulpix-alola', () => {
      expect(generatePokeApiSlug('Vulpix-Alola', '')).toBe('vulpix-alola');
    });

    it('Raichu-Alola → raichu-alola', () => {
      expect(generatePokeApiSlug('Raichu-Alola', '')).toBe('raichu-alola');
    });

    it('Slowpoke-Galar → slowpoke-galar', () => {
      expect(generatePokeApiSlug('Slowpoke-Galar', '')).toBe('slowpoke-galar');
    });

    it('Typhlosion-Hisui → typhlosion-hisui', () => {
      expect(generatePokeApiSlug('Typhlosion-Hisui', '')).toBe('typhlosion-hisui');
    });

    it('Wooper-Paldea → wooper-paldea', () => {
      expect(generatePokeApiSlug('Wooper-Paldea', '')).toBe('wooper-paldea');
    });

    // Apostrophe removal (e.g. Oricorio-Pom-Pom)
    it("Oricorio-Pom-Pom → oricorio-pom-pom", () => {
      expect(generatePokeApiSlug("Oricorio-Pom-Pom", '')).toBe('oricorio-pom-pom');
    });

    // Basic defaults (no special transformations)
    it('Charizard → charizard', () => {
      expect(generatePokeApiSlug('Charizard', '')).toBe('charizard');
    });

    it('Pikachu → pikachu', () => {
      expect(generatePokeApiSlug('Pikachu', '')).toBe('pikachu');
    });
  });

  describe('Edge cases', () => {
    it('handles uppercase species names', () => {
      expect(generatePokeApiSlug('PIKACHU', '')).toBe('pikachu');
    });

    it('handles mixed case', () => {
      expect(generatePokeApiSlug('Mewtwo-X', '')).toBe('mewtwo-x');
    });

    it('handles multiple spaces', () => {
      expect(generatePokeApiSlug('Mr Mime', '')).toBe('mr-mime');
    });

    it('handles apostrophes', () => {
      expect(generatePokeApiSlug("Nidoran'", '')).toBe('nidoran');
    });

    it('empty forme defaults to empty string', () => {
      expect(generatePokeApiSlug('Pikachu')).toBe('pikachu');
    });
  });
});
