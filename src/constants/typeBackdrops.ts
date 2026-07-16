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
  route: require('@assets/images/backdrops/route.png'),
  safari: require('@assets/images/backdrops/safari.png'),
  digital: require('@assets/images/backdrops/digital.png'),
  jungle: require('@assets/images/backdrops/jungle.png'),
  night_wilderness: require('@assets/images/backdrops/night_wilderness.png'),
  substation: require('@assets/images/backdrops/substation.png'),
  dragon2: require('@assets/images/backdrops/dragon2.png'),
  mega: require('@assets/images/backdrops/mega.png'),
} as const;

/**
 * Pokemon-specific backdrop assignments (highest priority, overrides all other rules)
 * Keys are species.id from @pkmn/dex (hyphens stripped, all lowercase)
 */
export const SPECIFIC_ASSIGNMENTS: Record<string, string> = {
  'raticate': 'route',
  'girafarig': 'safari',
  'farigiraf': 'safari',
  'oranguru': 'jungle',
  'zoruahisui': 'ice',
  'zoroarkhisui': 'ice',
  'slowpokegalar': 'water',
  'magnemite': 'substation',
  'magneton': 'substation',
  'magnezone': 'substation',
  'seel': 'ice',
  'dewgong': 'ice',
  'cloyster': 'ice',
  'exeggutoralola': 'water',
  'marowakalola': 'night_wilderness',
  'tauros': 'safari',
  'taurospaldeacombat': 'safari',
  'porygon': 'digital',
  'porygon2': 'digital',
  'porygonz': 'digital',
  'zapdosgalar': 'safari',
  'moltresgalar': 'night_wilderness',
  'stantler': 'route',
  'raikou': 'burnt_tower',
  'entei': 'burnt_tower',
  'suicune': 'burnt_tower',
  'lugia': 'tempest',
  'hooh': 'burnt_tower',
  'zigzagoon': 'route',
  'linoone': 'route',
  'slakoth': 'route',
  'vigoroth': 'route',
  'slaking': 'route',
  'exploud': 'route',
  'zangoose': 'route',
  'tropius': 'water',
  'latias': 'flying',
  'latios': 'flying',
  'kyogre': 'tempest',
  'kyogreprimal': 'tempest',   // Kyogre-Primal
  'groudon': 'fire',
  'groudonprimal': 'fire',     // Groudon-Primal
  'dialga': 'sky_pillar',
  'dialgaorigin': 'sky_pillar',
  'palkia': 'sky_pillar',
  'palkiaorigin': 'sky_pillar',
  'giratina': 'sky_pillar',
  'giratinaorigin': 'sky_pillar',
  'regigigas': 'dragon2',
  'bouffalant': 'safari',
  'rufflet': 'dragon2',
  'braviaryhisui': 'flying',
  'vullaby': 'safari',
  'mandibuzz': 'safari',
  'hydreigon': 'dragon2',
  'gumshoos': 'route',
  'crabrawler': 'water',
  'sandygast': 'water',
  'palossand': 'water',
  'komala': 'jungle',
  'rookidee': 'normal',
  'corvisquire': 'route',
  'wooloo': 'route',
  'dubwool': 'route',
  'zacian': 'dragon2',
  'zaciancrowned': 'dragon2',
  'zamazenta': 'dragon2',
  'zamazentacrowned': 'dragon2',
  'lechonk': 'route',
  'oinkologne': 'route',
  'oinkolognef': 'route',
  'bramblin': 'ground',
  'brambleghast': 'ground',
  'rellor': 'ground',
  'orthworm': 'ground',
  'glimmet': 'dragon',
  'glimmora': 'dragon',
  'dunsparce': 'route',
  'dudunsparce': 'route',
  'gholdengo': 'normal',
  'terapagos': 'dragon',
  'terapagosterastal': 'dragon',
  'terapagosstellar': 'dragon',
  'pikipek': 'water',
  'trumbeak': 'water',
  'toucannon': 'water',
  'doduo': 'safari',
  'dodrio': 'safari',
  'chatot': 'normal',
  // Normal/Flying evo-line rubric: 1st evo = normal, middle = route, final = flying
  'pidgey': 'normal',
  'pidgeotto': 'route',
  'pidgeot': 'flying',
  'spearow': 'normal',
  'fearow': 'flying',
  'hoothoot': 'normal',
  'noctowl': 'night_wilderness',
  'taillow': 'normal',
  'swellow': 'flying',
  'starly': 'normal',
  'staravia': 'route',
  'staraptor': 'flying',
  'pidove': 'normal',
  'tranquill': 'route',
  'unfezant': 'flying',
  'fletchling': 'normal',
  'fletchinder': 'route',
};

/**
 * Underwater Pokémon list for backdrop override
 * Keys are species.id from @pkmn/dex (hyphens stripped, all lowercase)
 */
export const UNDERWATER_SET = new Set([
  'tentacool','tentacruel','shellder','horsea','seadra','goldeen','seaking',
  'magikarp','gyarados','omanyte','omastar','kabuto','kabutops','chinchou','lanturn',
  'qwilfish','qwilfishhisui','corsola','corsolagalar','remoraid','octillery',
  'mantine','kingdra','carvanha','sharpedo','wailmer','wailord','barboach','whiscash',
  'feebas','clamperl','huntail','gorebyss','relicanth','luvdisc','finneon','lumineon',
  'mantyke','basculin','basculinbluestriped','basculinwhitestriped',
  'frillish','jellicent','alomomola','skrelp','dragalge','clauncher','clawitzer',
  'wishiwashi','wishiwashischool','bruxish','arrokuda','barraskewda','cursola',
  'arctovish','basculegion','basculegionf','overqwil','finizen','palafin',
  'palafinhero','veluza','dondozo',
]);

/**
 * Secondary-type override list for backdrop selection
 * Keys are species.id from @pkmn/dex (hyphens stripped, all lowercase)
 */
export const SECONDARY_TYPE_SET = new Set([
  'sneasel','sneaselhisui','sneasler','weavile',
  'rotom','rotomheat','rotomwash','rotomfrost','rotomfan','rotommow',
  'reshiram','zekrom','honedge','doublade','aegislash','aegislashblade',
  'binacle','barbaracle','amaura','aurorus','dedenne',
  'sliggoohisui','goodrahisui','klefki','noibat','noivern','yveltal',
  'crabominable','mareanie','toxapex','salandit','salazzle','wimpod','golisopod',
  'celesteela','magearna','marshadow','cramorant','morpekohangry',
  'arctozolt','zarude','calyrex','calyrexice','calyrexshadow',
  'rabsca','tinkatuff','tinkaton','flamigo','tatsugiri','tatsugiridroopy','tatsugiristretchy',
  'annihilape','ironhands','frigibax','arctibax','baxcalibur',
  'wochien','chienpao','tinglu','chiyu','koraidon','miraidon',
  'poltchageist','sinistcha','voltorbhisui','electrodehisui',
  'taurospaldeablaze','taurospaldeaaqua',
  'lapras','celebi','jirachi','deino','zweilous',
  'ogerponwellspring','ogerponhearthflame','ogerponcornerstone',
]);

/**
 * Helper function to resolve a backdrop key string to the right asset
 */
const resolveKeyToAsset = (key: string): number => {
  if (key in SPECIAL_BACKDROP_ASSETS) {
    return SPECIAL_BACKDROP_ASSETS[key as keyof typeof SPECIAL_BACKDROP_ASSETS];
  }
  const typeKey = key as keyof typeof TYPE_BACKDROP_ASSETS;
  if (typeKey in TYPE_BACKDROP_ASSETS) {
    return TYPE_BACKDROP_ASSETS[typeKey];
  }
  return TYPE_BACKDROP_ASSETS.normal;
};

/**
 * Helper function to resolve a backdrop key string (returns the key itself)
 */
const resolveKeyToString = (key: string): string => {
  if (key in SPECIAL_BACKDROP_ASSETS || key in TYPE_BACKDROP_ASSETS) {
    return key;
  }
  return 'normal';
};

/**
 * Helper function to resolve the appropriate backdrop image for a Pokémon.
 * Priority: Gigantamax → Mega → Specific assignments → Underwater → Secondary type overrides →
 *           Normal-type secondary → Legacy special mappings (Mewtwo, Rayquaza) → Type-based → Normal fallback
 *
 * @param typePrimary - The Pokémon's primary type (e.g., 'electric', 'fire')
 * @param pokemonId - The national dex number (optional, used for special cases)
 * @param formType - The Pokémon's form type (e.g., 'gigantamax', 'mega')
 * @param pokemonSlug - The DB name field, lowercase slug (e.g. 'sneasel-hisui')
 * @param typeSecondary - The Pokémon's secondary type (optional, used for overrides)
 * @returns The require() result for the backdrop image
 */
export const getBackdropAsset = (
  typePrimary: string,
  pokemonId?: number,
  formType?: string,
  pokemonSlug?: string,
  typeSecondary?: string | null,
): number => {
  // 1. Gigantamax → stadium
  if (formType === 'gigantamax') {
    return SPECIAL_BACKDROP_ASSETS.stadium;
  }

  // 2. Mega forms → mega
  if (formType === 'mega') {
    return SPECIAL_BACKDROP_ASSETS.mega;
  }

  const slug = pokemonSlug ?? '';

  // 3. Pokemon-specific assignments (highest priority, overrides all other rules)
  if (slug && slug in SPECIFIC_ASSIGNMENTS) {
    return resolveKeyToAsset(SPECIFIC_ASSIGNMENTS[slug]);
  }

  // 4. Underwater list
  if (slug && UNDERWATER_SET.has(slug)) {
    return SPECIAL_BACKDROP_ASSETS.underwater;
  }

  // 5. Secondary-type override list
  if (slug && SECONDARY_TYPE_SET.has(slug) && typeSecondary) {
    const secKey = typeSecondary.toLowerCase() as keyof typeof TYPE_BACKDROP_ASSETS;
    if (secKey in TYPE_BACKDROP_ASSETS) {
      return TYPE_BACKDROP_ASSETS[secKey];
    }
  }

  // 6. Normal-type primary exception: use secondary if it exists, EXCEPT Stufful
  if (
    typePrimary.toLowerCase() === 'normal' &&
    typeSecondary &&
    slug !== 'stufful'
  ) {
    const secKey = typeSecondary.toLowerCase() as keyof typeof TYPE_BACKDROP_ASSETS;
    if (secKey in TYPE_BACKDROP_ASSETS) {
      return TYPE_BACKDROP_ASSETS[secKey];
    }
  }

  // 7. Legacy special mappings (Mewtwo, Rayquaza)
  const legacySpecial: Record<number, keyof typeof SPECIAL_BACKDROP_ASSETS> = {
    150: 'mewtwo',
    384: 'rayquaza',
  };
  if (pokemonId && legacySpecial[pokemonId]) {
    return SPECIAL_BACKDROP_ASSETS[legacySpecial[pokemonId]];
  }

  // 8. Type-based
  const typeKey = typePrimary.toLowerCase() as keyof typeof TYPE_BACKDROP_ASSETS;
  if (typeKey in TYPE_BACKDROP_ASSETS) {
    return TYPE_BACKDROP_ASSETS[typeKey];
  }

  return TYPE_BACKDROP_ASSETS.normal;
};

/**
 * Resolve the appropriate backdrop key for a Pokémon.
 * Same priority logic as getBackdropAsset but returns the string key instead of the require() asset.
 * Used by particle layer to determine which backdrops have particle animations.
 *
 * @param typePrimary - The Pokémon's primary type (e.g., 'electric', 'fire')
 * @param pokemonId - The national dex number (optional, used for special cases)
 * @param formType - The Pokémon's form type (e.g., 'gigantamax', 'mega')
 * @param pokemonSlug - The DB name field, lowercase slug (e.g. 'sneasel-hisui')
 * @param typeSecondary - The Pokémon's secondary type (optional, used for overrides)
 * @returns The string key for the backdrop (e.g. 'grass', 'fire', 'underwater', 'mega', 'stadium', 'mewtwo', etc.)
 */
export const getBackdropKey = (
  typePrimary: string,
  pokemonId?: number,
  formType?: string,
  pokemonSlug?: string,
  typeSecondary?: string | null,
): string => {
  // 1. Gigantamax → stadium
  if (formType === 'gigantamax') {
    return 'stadium';
  }

  // 2. Mega forms → mega
  if (formType === 'mega') {
    return 'mega';
  }

  const slug = pokemonSlug ?? '';

  // 3. Pokemon-specific assignments (highest priority, overrides all other rules)
  if (slug && slug in SPECIFIC_ASSIGNMENTS) {
    return resolveKeyToString(SPECIFIC_ASSIGNMENTS[slug]);
  }

  // 4. Underwater list
  if (slug && UNDERWATER_SET.has(slug)) {
    return 'underwater';
  }

  // 5. Secondary-type override list
  if (slug && SECONDARY_TYPE_SET.has(slug) && typeSecondary) {
    const secKey = typeSecondary.toLowerCase() as keyof typeof TYPE_BACKDROP_ASSETS;
    if (secKey in TYPE_BACKDROP_ASSETS) {
      return secKey;
    }
  }

  // 6. Normal-type primary exception: use secondary if it exists, EXCEPT Stufful
  if (
    typePrimary.toLowerCase() === 'normal' &&
    typeSecondary &&
    slug !== 'stufful'
  ) {
    const secKey = typeSecondary.toLowerCase() as keyof typeof TYPE_BACKDROP_ASSETS;
    if (secKey in TYPE_BACKDROP_ASSETS) {
      return secKey;
    }
  }

  // 7. Legacy special mappings (Mewtwo, Rayquaza)
  const legacySpecial: Record<number, 'mewtwo' | 'rayquaza'> = {
    150: 'mewtwo',
    384: 'rayquaza',
  };
  if (pokemonId && legacySpecial[pokemonId]) {
    return legacySpecial[pokemonId];
  }

  // 8. Type-based
  const typeKey = typePrimary.toLowerCase() as keyof typeof TYPE_BACKDROP_ASSETS;
  if (typeKey in TYPE_BACKDROP_ASSETS) {
    return typeKey;
  }

  return 'normal';
};
