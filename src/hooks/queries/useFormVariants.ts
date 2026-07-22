import { useQuery } from '@tanstack/react-query';

interface CosmeticAlternate {
  id: string;
  name: string;
  spriteUrl: string | number;
}

interface TypeVariant {
  id: string;
  name: string;
  spriteUrl: string | number;
  typePrimary: string;
  typeSecondary?: string;
}

interface FormVariants {
  cosmeticAlternates: CosmeticAlternate[];
  typeVariants: TypeVariant[];
}

export function useFormVariants(nationalDex: number): {
  cosmeticAlternates: CosmeticAlternate[];
  typeVariants: TypeVariant[];
  isLoading: boolean;
} {
  const query = useQuery({
    queryKey: ['pokemon', 'form-variants', 'v6', nationalDex],
    queryFn: (): FormVariants => {
      const { Dex } = require('@pkmn/dex');

      const FORM_POKEAPI_IDS = new Map<string, number>([
        ['castformsunny',         10013],
        ['castformrainy',         10014],
        ['castformsnowy',         10015],
        ['miniororange',          10137],
        ['minioryellow',          10138],
        ['miniorgreen',           10139],
        ['miniorblue',            10140],
        ['miniorindigo',          10141],
        ['miniorviolet',          10142],
        ['miniormeteor',          774],
        ['magearnaoriginal',      10147],
        ['cramorantgulping',      10182],
        ['cramorantgorging',      10183],
        ['zarudedada',            10192],
        ['squawkabillyblue',      10260],
        ['squawkabillyyellow',    10261],
        ['squawkabillywhite',     10262],
        ['alcremiegmax',          10223],
        ['sinisteaantique',       854],
        ['polteageistantique',    855],
        ['poltchageistartisan',   1012],
        ['sinistchamasterpiece',  1013],
      ]);

      const FORM_SLUG_OVERRIDES = new Map<string, string>([
        ['vivillonpokeball', 'poke-ball'],
        ['alcremierubycream',     'ruby-cream-strawberry-sweet'],
        ['alcremiematchacream',   'matcha-cream-strawberry-sweet'],
        ['alcremiemintcream',     'mint-cream-strawberry-sweet'],
        ['alcremielemoncream',    'lemon-cream-strawberry-sweet'],
        ['alcremierubyswirl',     'ruby-swirl-strawberry-sweet'],
        ['alcremiecaramelswirl',  'caramel-swirl-strawberry-sweet'],
        ['alcremierainbowswirl',  'rainbow-swirl-strawberry-sweet'],
      ]);

      const FORM_LOCAL_ASSETS = new Map<string, any>([
        ['burmysandy', require('@assets/images/sprites/burmy-sandy.webp')],
        ['burmytrash', require('@assets/images/sprites/burmy-trash.webp')],
      ]);

      // Cosmetic alternates: species that are in FORM_EXCLUSION_SET
      // (excluded from DB) and are cosmetic-only (same types as base)
      const COSMETIC_DEX_NUMS = new Set([
        // Vivillon patterns
        666,
        // Alcremie flavors
        869,
        // Minior colors
        774,
        // Deerling seasonal
        585,
        // Shellos/Gastrodon East
        422, 423,
        // Cramorant in-battle
        845,
        // Others with 1 alternate each
        172,  // Pichu-Spiky-eared
        421,  // Cherrim-Sunshine
        801,  // Magearna-Original
        893,  // Zarude-Dada
        931,  // Squawkabilly colors
        1012, // Poltchageist-Artisan
        1013, // Sinistcha-Masterpiece
        854,  // Sinistea-Antique
        855,  // Polteageist-Antique
        // Unown letter forms
        201,
      ]);

      // Type variant dex nums: forms that change the Pokemon's type
      const TYPE_VARIANT_DEX_NUMS = new Set([
        493,  // Arceus
        773,  // Silvally
        351,  // Castform
        // Genesect (649) excluded per spec
      ]);

      const isCosmeticForNum = COSMETIC_DEX_NUMS.has(nationalDex);
      const isTypeVariantForNum = TYPE_VARIANT_DEX_NUMS.has(nationalDex);

      if (!isCosmeticForNum && !isTypeVariantForNum) {
        return { cosmeticAlternates: [], typeVariants: [] };
      }

      const allSpecies = Dex.species.all();
      const cosmeticAlternates: CosmeticAlternate[] = [];
      const typeVariants: TypeVariant[] = [];

      for (const species of allSpecies) {
        // Only look at forme variants of the same national dex number
        if (species.num !== nationalDex || !species.forme) continue;
        // Skip non-standard entries
        if (species.isNonstandard === 'CAP' || species.isNonstandard === 'Future' || species.isNonstandard === 'Custom') continue;
        if (!species.exists) continue;

        const localAsset = FORM_LOCAL_ASSETS.get(species.id);
        const pokeApiId = FORM_POKEAPI_IDS.get(species.id);
        let spriteUrl: string | number;
        if (localAsset !== undefined) {
          spriteUrl = localAsset;
        } else if (pokeApiId !== undefined) {
          spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${pokeApiId}.png`;
        } else {
          const slugOverride = FORM_SLUG_OVERRIDES.get(species.id);
          const formSlug = slugOverride ?? species.forme.toLowerCase().replace(/ /g, '-');
          spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${species.num}-${formSlug}.png`;
        }

        if (isCosmeticForNum) {
          cosmeticAlternates.push({
            id: species.id,
            name: species.forme,
            spriteUrl,
          });
        } else if (isTypeVariantForNum) {
          typeVariants.push({
            id: species.id,
            name: species.forme,
            spriteUrl,
            typePrimary: species.types[0]?.toLowerCase() ?? 'normal',
            typeSecondary: species.types[1]?.toLowerCase(),
          });
        }
      }

      if (nationalDex === 201) {
        const UNOWN_FORMS = [
          'A','B','C','D','E','F','G','H','I','J','K','L','M',
          'N','O','P','Q','R','S','T','U','V','W','X','Y','Z',
          '!','?',
        ];
        const UNOWN_SLUGS: Record<string, string> = { '!': 'exclamation', '?': 'question' };
        for (const letter of UNOWN_FORMS) {
          const slug = UNOWN_SLUGS[letter] ?? letter.toLowerCase();
          cosmeticAlternates.push({
            id: `unown${letter.toLowerCase() === '!' ? 'exclamation' : letter.toLowerCase() === '?' ? 'question' : letter.toLowerCase()}`,
            name: letter,
            spriteUrl: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/201-${slug}.png`,
          });
        }
      }

      return { cosmeticAlternates, typeVariants };
    },
    staleTime: Infinity,
    enabled: nationalDex > 0,
  });

  return {
    cosmeticAlternates: query.data?.cosmeticAlternates ?? [],
    typeVariants: query.data?.typeVariants ?? [],
    isLoading: query.isLoading,
  };
}
