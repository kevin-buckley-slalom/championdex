'use strict';
const Database = require('better-sqlite3');
const path = require('path');
const { Dex } = require('@pkmn/dex');

const DB_PATH = path.join(__dirname, '../assets/db/championdex.db');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function patchAbilities(db) {
  const MISSING_ABILITIES = [
    { id: 311, slug: 'piercingdrill' },
    { id: 312, slug: 'dragonize' },
    { id: 313, slug: 'eelevate' },
    { id: 315, slug: 'megasol' },
    { id: 316, slug: 'firemane' },
    { id: 318, slug: 'spicyspray' },
    { id: 286, slug: 'tabletsofruin' },
    { id: 287, slug: 'beadsofruin' },
  ];

  // Step 1: Insert ability records
  let abilitiesInserted = 0;
  const insertAbility = db.prepare(`
    INSERT OR IGNORE INTO abilities
    (id, name, display_name, description, short_description, generation)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const entry of MISSING_ABILITIES) {
    const a = Dex.abilities.get(entry.slug);
    if (a) {
      const result = insertAbility.run(
        entry.id,
        a.id,
        a.name,
        a.desc || '',
        a.shortDesc || '',
        a.gen
      );
      if (result.changes > 0) {
        abilitiesInserted += result.changes;
      }
    }
  }

  // Step 2: Build ability name-to-ID map and link to pokemon
  const abilityMap = new Map();
  const abilityRows = db.prepare('SELECT id, display_name FROM abilities').all();
  for (const row of abilityRows) {
    abilityMap.set(row.display_name, row.id);
  }

  // Pokemon-ability links: [pokemon_db_id, pokemon_name, ability_slug, slot, is_hidden]
  const POKEMON_ABILITY_LINKS = [
    [224, 'meganiummega', 'megasol', 1, 0],
    [232, 'feraligatrmega', 'dragonize', 1, 0],
    [670, 'excadrillmega', 'piercingdrill', 1, 0],
    [759, 'eelektrossmega', 'eelevate', 1, 0],
    [840, 'pyroarmega', 'firemane', 1, 0],
    [1203, 'scovillainmega', 'spicyspray', 1, 0],
    [1261, 'wochien', 'tabletsofruin', 1, 0],
    [1264, 'chiyu', 'beadsofruin', 1, 0],
  ];

  let pokemonAbilitiesInserted = 0;
  const insertPokemonAbility = db.prepare(`
    INSERT OR IGNORE INTO pokemon_abilities
    (pokemon_id, ability_id, slot, is_hidden)
    VALUES (?, ?, ?, ?)
  `);

  for (const [pokemonId, pokemonName, abilitySlug, slot, isHidden] of POKEMON_ABILITY_LINKS) {
    const a = Dex.abilities.get(abilitySlug);
    if (a) {
      const abilityId = abilityMap.get(a.name);
      if (abilityId !== undefined) {
        const result = insertPokemonAbility.run(pokemonId, abilityId, slot, isHidden);
        if (result.changes > 0) {
          pokemonAbilitiesInserted += result.changes;
        }
      }
    }
  }

  console.log(`[PatchDb] Abilities: inserted ${abilitiesInserted} ability records, ${pokemonAbilitiesInserted} pokemon_ability links`);
}

function patchEvolutionChains(db) {
  const MEGA_EVOLUTIONS = [
    [3, 4, 'venusaurite'],
    [8, 9, 'charizardite-x'],
    [8, 10, 'charizardite-y'],
    [14, 15, 'blastoisinite'],
    [23, 24, 'beedrillite'],
    [27, 28, 'pidgeotite'],
    [39, 41, 'raichunitex'],
    [39, 42, 'raichunitey'],
    [54, 55, 'clefablite'],
    [94, 95, 'alakazite'],
    [102, 103, 'victreebelite'],
    [118, 119, 'slowbronite'],
    [137, 138, 'gengarite'],
    [166, 167, 'kangaskhanite'],
    [173, 174, 'starminite'],
    [181, 182, 'pinsirite'],
    [188, 189, 'gyaradosite'],
    [203, 204, 'aerodactylite'],
    [215, 216, 'dragoninite'],
    [217, 218, 'mewtwonite-x'],
    [217, 219, 'mewtwonite-y'],
    [223, 224, 'meganiumite'],
    [231, 232, 'feraligite'],
    [253, 254, 'ampharosite'],
    [283, 284, 'steelixite'],
    [289, 290, 'scizorite'],
    [292, 293, 'heracronite'],
    [308, 309, 'skarmorite'],
    [311, 312, 'houndoominite'],
    [331, 332, 'tyranitarite'],
    [338, 339, 'sceptilite'],
    [342, 343, 'blazikenite'],
    [346, 347, 'swampertite'],
    [371, 372, 'gardevoirite'],
    [392, 393, 'sablenite'],
    [394, 395, 'mawilite'],
    [398, 399, 'aggronite'],
    [401, 402, 'medichamite'],
    [404, 405, 'manectite'],
    [414, 415, 'sharpedonite'],
    [419, 420, 'cameruptite'],
    [431, 432, 'altarianite'],
    [452, 453, 'banettite'],
    [457, 458, 'chimechite'],
    [459, 460, 'absolite'],
    [459, 461, 'absolitez'],
    [464, 465, 'glalitite'],
    [476, 477, 'salamencite'],
    [480, 481, 'metagrossite'],
    [485, 486, 'latiasite'],
    [487, 488, 'latiosite'],
    [493, 494, null],
    [511, 512, 'staraptite'],
    [546, 547, 'lopunnite'],
    [564, 565, 'garchompite'],
    [564, 566, 'garchompitez'],
    [569, 570, 'lucarionite'],
    [569, 571, 'lucarionitez'],
    [583, 584, 'abomasite'],
    [599, 600, 'galladite'],
    [603, 604, 'froslassite'],
    [618, 619, 'heatranite'],
    [626, 627, 'darkranite'],
    [637, 638, 'emboarite'],
    [669, 670, 'excadrite'],
    [671, 672, 'audinite'],
    [686, 687, 'scolipite'],
    [709, 710, 'scraftinite'],
    [758, 759, 'eelektrossite'],
    [764, 765, 'chandelurite'],
    [780, 781, 'golurkite'],
    [818, 819, 'chesnaughtite'],
    [822, 823, 'delphoxite'],
    [826, 829, 'greninjite'],
    [839, 840, 'pyroarite'],
    [842, 844, 'floettite'],
    [852, 854, 'meowsticite'],
    [852, 855, 'meowsticite'],
    [865, 866, 'malamarite'],
    [868, 869, 'barbaracite'],
    [871, 872, 'dragalgite'],
    [882, 883, 'hawluchanite'],
    [909, 912, 'zygardite'],
    [913, 914, 'diancite'],
    [937, 938, 'crabominite'],
    [973, 974, 'golisopite'],
    [987, 988, 'drampanite'],
    [1012, 1013, 'magearnite'],
    [1012, 1014, 'magearnite'],
    [1020, 1021, 'zeraorite'],
    [1102, 1103, 'falinksite'],
    [1202, 1203, 'scovillainite'],
    [1222, 1223, 'glimmoranite'],
    [1231, 1234, 'tatsugirinite'],
    [1231, 1235, 'tatsugirinite'],
    [1231, 1236, 'tatsugirinite'],
    [1256, 1257, 'baxcalibrite'],
  ];

  const GIGANTAMAX_EVOLUTIONS = [
    [3, 5],
    [8, 11],
    [14, 16],
    [19, 20],
    [37, 38],
    [75, 78],
    [98, 99],
    [137, 139],
    [144, 145],
    [190, 191],
    [193, 194],
    [205, 206],
    [720, 721],
    [1023, 1024],
    [1027, 1028],
    [1031, 1032],
    [1035, 1036],
    [1041, 1042],
    [1045, 1046],
    [1054, 1055],
    [1060, 1061],
    [1063, 1064],
    [1065, 1066],
    [1068, 1069],
    [1074, 1076],
    [1075, 1077],
    [1079, 1080],
    [1087, 1088],
    [1091, 1092],
    [1100, 1101],
    [1115, 1116],
    [1121, 1122],
    [1133, 1135],
    [1134, 1136],
  ];

  const ALTERNATE_EVOLUTIONS = [
    [489, 490, 'primal-reversion', 'blue-orb'],
    [491, 492, 'primal-reversion', 'red-orb'],
    [910, 911, 'battle', '< 50% HP'],
    [909, 911, 'battle', '< 50% HP'],
    [946, 949, 'level-up', 'dusk'],
    [945, 948, 'level-up', 'night'],
    [950, 951, 'battle', '> 25% HP'],
    [984, 985, 'battle', 'Damage Taken'],
    [1009, 1011, 'battle', 'Ultra Burst'],
    [1010, 1011, 'battle', 'Ultra Burst'],
    [1108, 1109, 'battle', 'Physical Hit'],
    [1112, 1113, 'battle', 'Alternates'],
    [1113, 1112, 'battle', 'Alternates'],
    [1126, 1127, 'battle', 'Rusty Sword'],
    [1128, 1129, 'battle', 'Rusty Shield'],
    [1215, 1216, 'battle', 'Swap Out/In'],
    [1277, 1281, 'battle', 'Terastallize'],
    [1278, 1282, 'battle', 'Terastallize'],
    [1279, 1283, 'battle', 'Terastallize'],
    [1280, 1284, 'battle', 'Terastallize'],
  ];

  const REGIONAL_EVOLUTIONS = [
    [30, 32, 'level-up', '20'],
    [44, 46, 'use-item', 'ice-stone'],
    [57, 59, 'use-item', 'ice-stone'],
    [72, 74, 'level-up', '26'],
    [76, 80, 'level-up', '28'],
    [107, 109, 'level-up', '25'],
    [109, 111, 'trade', null],
    [130, 132, 'level-up', '38'],
    [77, 1094, 'level-up', '28'],
    [113, 115, 'use-item', 'shiny-stone'],
    [117, 120, 'use-item', 'galarica-cuff'],
    [117, 274, 'use-item', 'galarica-wreath'],
    [124, 1096, 'other', null],
    [161, null, null, null],
    [176, 1097, 'level-up', null],
    [351, 353, 'level-up', '20'],
    [353, 1093, 'level-up', '35'],
    [700, 703, 'use-item', 'ice-stone'],
    [713, 1098, 'other', null],
    [86, 88, 'use-item', 'fire-stone'],
    [147, 149, 'level-up', '30'],
    [288, 1152, 'other', null],
    [295, 1151, 'level-up', null],
    [303, 1095, 'level-up', '38'],
    [723, 725, 'level-up', '30'],
    [787, null, null, null],
    [888, 890, 'level-up', '50'],
    [904, null, null, null],
    [37, 40, 'use-item', 'thunder-stone'],
    [150, 152, 'level-up', '28'],
    [153, 155, 'level-up', '28'],
    [159, 161, 'level-up', '35'],
    [558, 176, 'level-up', null],
    [226, 228, 'level-up', '36'],
    [640, 642, 'level-up', '36'],
    [690, 692, 'use-item', 'sun-stone'],
    [785, 787, 'level-up', '54'],
    [886, 888, 'level-up', '40'],
    [902, 904, 'level-up', '28'],
    [919, 921, 'level-up', '36'],
    [268, 1238, 'level-up', '20'],
  ];

  const COSMETIC_EVOLUTIONS = [
    [47, 48, 'level-up', '16'],
    [50, 51, 'level-up', '16'],
    [851, 853, 'level-up', '25'],
    [695, 1150, 'other', null],
    [1164, 1166, 'level-up', '18'],
  ];

  const insertEvolution = db.prepare(`
    INSERT OR IGNORE INTO pokemon_evolutions
    (pokemon_id, evolves_to_id, method, condition_value)
    VALUES (?, ?, ?, ?)
  `);

  let megaCount = 0;
  let gmaxCount = 0;
  let alternateCount = 0;
  let regionalCount = 0;
  let cosmeticCount = 0;

  // Insert mega evolutions
  for (const [baseId, megaId, stoneSlug] of MEGA_EVOLUTIONS) {
    const result = insertEvolution.run(baseId, megaId, 'mega-evolution', stoneSlug);
    if (result.changes > 0) megaCount += result.changes;
  }

  // Insert gigantamax evolutions
  for (const [baseId, gmaxId] of GIGANTAMAX_EVOLUTIONS) {
    const result = insertEvolution.run(baseId, gmaxId, 'gigantamax', 'gigantamax-factor');
    if (result.changes > 0) gmaxCount += result.changes;
  }

  // Insert alternate form evolutions
  for (const [baseId, altId, method, condition] of ALTERNATE_EVOLUTIONS) {
    const result = insertEvolution.run(baseId, altId, method, condition);
    if (result.changes > 0) alternateCount += result.changes;
  }

  // Insert regional form evolutions (skip null evolves_to_id)
  for (const [baseId, evolvesToId, method, condition] of REGIONAL_EVOLUTIONS) {
    if (evolvesToId === null) continue;
    const result = insertEvolution.run(baseId, evolvesToId, method, condition);
    if (result.changes > 0) regionalCount += result.changes;
  }

  // Insert cosmetic form evolutions
  for (const [baseId, formId, method, condition] of COSMETIC_EVOLUTIONS) {
    const result = insertEvolution.run(baseId, formId, method, condition);
    if (result.changes > 0) cosmeticCount += result.changes;
  }

  const totalEvolutions = megaCount + gmaxCount + alternateCount + regionalCount + cosmeticCount;
  console.log(`[PatchDb] Evolution chains: inserted ${megaCount} mega + ${gmaxCount} gigantamax + ${alternateCount} alternate + ${regionalCount} regional + ${cosmeticCount} cosmetic rows (${totalEvolutions} total new rows)`);
}

async function fetchRegionalEncounters(db) {
  const BATCH = 10;

  const REGIONAL_FORMS = [
    { id: 30, pokeapi_id: 10091 },
    { id: 32, pokeapi_id: 10092 },
    { id: 40, pokeapi_id: 10100 },
    { id: 44, pokeapi_id: 10101 },
    { id: 46, pokeapi_id: 10102 },
    { id: 57, pokeapi_id: 10103 },
    { id: 59, pokeapi_id: 10104 },
    { id: 72, pokeapi_id: 10105 },
    { id: 74, pokeapi_id: 10106 },
    { id: 76, pokeapi_id: 10107 },
    { id: 77, pokeapi_id: 10161 },
    { id: 80, pokeapi_id: 10108 },
    { id: 86, pokeapi_id: 10229 },
    { id: 88, pokeapi_id: 10230 },
    { id: 107, pokeapi_id: 10109 },
    { id: 109, pokeapi_id: 10110 },
    { id: 111, pokeapi_id: 10111 },
    { id: 113, pokeapi_id: 10162 },
    { id: 115, pokeapi_id: 10163 },
    { id: 117, pokeapi_id: 10164 },
    { id: 120, pokeapi_id: 10165 },
    { id: 124, pokeapi_id: 10161 },
    { id: 130, pokeapi_id: 10112 },
    { id: 132, pokeapi_id: 10113 },
    { id: 147, pokeapi_id: 10231 },
    { id: 149, pokeapi_id: 10232 },
    { id: 152, pokeapi_id: 10114 },
    { id: 155, pokeapi_id: 10115 },
    { id: 161, pokeapi_id: 10167 },
    { id: 176, pokeapi_id: 10168 },
    { id: 184, pokeapi_id: 10250 },
    { id: 185, pokeapi_id: 10251 },
    { id: 186, pokeapi_id: 10252 },
    { id: 208, pokeapi_id: 10169 },
    { id: 210, pokeapi_id: 10170 },
    { id: 212, pokeapi_id: 10171 },
    { id: 228, pokeapi_id: 10233 },
    { id: 268, pokeapi_id: 10253 },
    { id: 274, pokeapi_id: 10172 },
    { id: 288, pokeapi_id: 10234 },
    { id: 295, pokeapi_id: 10235 },
    { id: 303, pokeapi_id: 10173 },
    { id: 351, pokeapi_id: 10174 },
    { id: 353, pokeapi_id: 10175 },
    { id: 642, pokeapi_id: 10236 },
    { id: 692, pokeapi_id: 10237 },
    { id: 700, pokeapi_id: 10176 },
    { id: 703, pokeapi_id: 10177 },
    { id: 704, pokeapi_id: 10178 },
    { id: 713, pokeapi_id: 10179 },
    { id: 723, pokeapi_id: 10238 },
    { id: 725, pokeapi_id: 10239 },
    { id: 775, pokeapi_id: 10180 },
    { id: 787, pokeapi_id: 10240 },
    { id: 888, pokeapi_id: 10241 },
    { id: 890, pokeapi_id: 10242 },
    { id: 904, pokeapi_id: 10243 },
    { id: 921, pokeapi_id: 10244 },
  ];

  const SLUG_OVERRIDES = new Map([
    [124, 'farfetchd-galar'],
  ]);

  const encounterRows = [];
  let fetched = 0;

  for (let i = 0; i < REGIONAL_FORMS.length; i += BATCH) {
    const batch = REGIONAL_FORMS.slice(i, i + BATCH);
    let hadFetch = false;
    await Promise.all(batch.map(async ({ id, pokeapi_id }) => {
      const slug = SLUG_OVERRIDES.get(id) ?? pokeapi_id;
      try {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${slug}/encounters`);
        if (!res.ok) return;
        const data = await res.json();
        if (!Array.isArray(data) || data.length === 0) return;
        hadFetch = true;
        fetched++;

        const aggregated = new Map();
        for (const locationEntry of data) {
          const locationName = locationEntry.location_area?.name || '';
          for (const vd of (locationEntry.version_details || [])) {
            const gameVersion = vd.version?.name || '';
            for (const ed of (vd.encounter_details || [])) {
              const method = ed.method?.name || '';
              const key = `${locationName}|${method}|${gameVersion}`;
              const existing = aggregated.get(key);
              if (!existing || ed.chance > existing.encounterChance) {
                aggregated.set(key, {
                  pokemonId: id, gameVersion, locationName,
                  locationAreaSlug: locationName,
                  encounterMethod: method,
                  encounterChance: ed.chance,
                  minLevel: ed.min_level ?? null,
                  maxLevel: ed.max_level ?? null,
                });
              }
            }
          }
        }
        for (const row of aggregated.values()) encounterRows.push(row);
      } catch (e) {
      }
    }));
    if (hadFetch) await sleep(50);
    const batchNum = Math.floor(i / BATCH) + 1;
    const totalBatches = Math.ceil(REGIONAL_FORMS.length / BATCH);
    console.log(`[PatchDb] Regional encounters: batch ${batchNum}/${totalBatches} (${fetched} with data so far)`);
  }

  console.log(`[PatchDb] Writing ${encounterRows.length} regional encounter rows...`);
  const encStmt = db.prepare(`
    INSERT OR IGNORE INTO pokemon_encounter_locations
      (pokemon_id, game_version, location_name, location_area_slug, encounter_method, encounter_chance, min_level, max_level)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const writeEncounters = db.transaction(() => {
    for (const r of encounterRows) {
      encStmt.run(r.pokemonId, r.gameVersion, r.locationName, r.locationAreaSlug,
        r.encounterMethod, r.encounterChance, r.minLevel, r.maxLevel);
    }
  });
  writeEncounters();
  console.log(`[PatchDb] Regional encounters: done (${fetched} forms had data, ${encounterRows.length} rows written)`);
}

async function seedNonDefaultMovesets(db) {
  const BATCH = 10;

  const SQL_COPIES = [
    [527, 526],
    [528, 526],
    [946, 945],
    [1009, 1008],
    [1010, 1008],
  ];

  let sqlCopyCount = 0;
  const copyMovesStmt = db.prepare(`
    INSERT OR IGNORE INTO pokemon_moves (pokemon_id, move_id, learn_method, learn_level, learn_label, version_group)
    SELECT ?, move_id, learn_method, learn_level, learn_label, version_group
    FROM pokemon_moves WHERE pokemon_id = ?
  `);
  const copySqlMoves = db.transaction(() => {
    for (const [destId, sourceId] of SQL_COPIES) {
      const result = copyMovesStmt.run(destId, sourceId);
      sqlCopyCount += result.changes;
    }
  });
  copySqlMoves();
  console.log(`[PatchDb] Movesets 6.3-C SQL copies: ${sqlCopyCount} rows inserted`);

  const SKIP_IDS = new Set([527, 528, 946, 1009, 1010, 1281, 1282, 1283, 1284]);

  const SLUG_OVERRIDES = new Map([
    [124, 'farfetchd-galar'],
    [827, 'greninja-battle-bond'],
  ]);

  const validMoveIds = new Set();
  for (const row of db.prepare('SELECT id FROM moves').all()) {
    validMoveIds.add(row.id);
  }

  const nonDefaultForms = db.prepare(`
    SELECT id, pokeapi_id FROM pokemon
    WHERE form_type IN ('regional', 'alternate')
  `).all().filter(r => !SKIP_IDS.has(r.id));

  const moveRows = [];
  let fetchedCount = 0;

  for (let i = 0; i < nonDefaultForms.length; i += BATCH) {
    const batch = nonDefaultForms.slice(i, i + BATCH);
    let hadFetch = false;
    await Promise.all(batch.map(async ({ id, pokeapi_id }) => {
      const slug = SLUG_OVERRIDES.get(id) ?? pokeapi_id;
      try {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${slug}/`);
        if (!res.ok) return;
        const data = await res.json();
        if (!data.moves || !Array.isArray(data.moves) || data.moves.length === 0) return;
        hadFetch = true;
        fetchedCount++;

        const seenMoves = new Set();
        for (const moveEntry of data.moves) {
          if (!moveEntry.move?.url) continue;
          const moveIdMatch = moveEntry.move.url.match(/\/move\/(\d+)\//);
          if (!moveIdMatch) continue;
          const moveId = parseInt(moveIdMatch[1], 10);
          if (!validMoveIds.has(moveId)) continue;

          if (!moveEntry.version_group_details || !Array.isArray(moveEntry.version_group_details)) continue;

          for (const detail of moveEntry.version_group_details) {
            const learnMethod = detail.move_learn_method?.name ?? 'other';
            const versionGroup = detail.version_group?.name ?? '';
            let learnLevel = null;
            if (learnMethod === 'level-up' && detail.level_learned_at > 0) {
              learnLevel = detail.level_learned_at;
            }

            const key = `${moveId}:${learnMethod}:${versionGroup}`;
            if (seenMoves.has(key)) continue;
            seenMoves.add(key);

            moveRows.push({ pokemonId: id, moveId, learnMethod, learnLevel, learnLabel: null, versionGroup });
          }
        }
      } catch (e) {
      }
    }));
    if (hadFetch) await sleep(50);
    const batchNum = Math.floor(i / BATCH) + 1;
    const totalBatches = Math.ceil(nonDefaultForms.length / BATCH);
    if (batchNum % 5 === 0 || batchNum === totalBatches) {
      console.log(`[PatchDb] Movesets 6.3-A/B: batch ${batchNum}/${totalBatches} (${fetchedCount} with data)`);
    }
  }

  console.log(`[PatchDb] Writing ${moveRows.length} non-default moveset rows...`);
  const moveInsertStmt = db.prepare(`
    INSERT OR IGNORE INTO pokemon_moves (pokemon_id, move_id, learn_method, learn_level, learn_label, version_group)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const writeMovesets = db.transaction(() => {
    for (const r of moveRows) {
      moveInsertStmt.run(r.pokemonId, r.moveId, r.learnMethod, r.learnLevel, r.learnLabel, r.versionGroup);
    }
  });
  writeMovesets();
  console.log(`[PatchDb] Movesets 6.3-A/B: ${fetchedCount} forms fetched, ${moveRows.length} rows written`);

  const TERA_COPIES = [
    [1281, 1277],
    [1282, 1278],
    [1283, 1279],
    [1284, 1280],
  ];

  let teraCopyCount = 0;
  const copyTeraMovesStmt = db.prepare(`
    INSERT OR IGNORE INTO pokemon_moves (pokemon_id, move_id, learn_method, learn_level, learn_label, version_group)
    SELECT ?, move_id, learn_method, learn_level, learn_label, version_group
    FROM pokemon_moves WHERE pokemon_id = ?
  `);
  const copyTeraMoves = db.transaction(() => {
    for (const [destId, sourceId] of TERA_COPIES) {
      const result = copyTeraMovesStmt.run(destId, sourceId);
      teraCopyCount += result.changes;
    }
  });
  copyTeraMoves();
  console.log(`[PatchDb] Movesets 6.3-D tera copies: ${teraCopyCount} rows inserted`);
}

function fixAltFormPokeApiIds(db) {
  // Correct seeding bugs: these forms had pokeapi_id = national_dex (base form ID)
  // instead of their correct alternate-form PokeAPI IDs. Targeted UPDATE only —
  // justified exception to INSERT OR IGNORE because existing rows contain wrong values.
  const FIXES = [
    { id: 124,  pokeapi_id: 10166 }, // farfetchdgalar
    { id: 527,  pokeapi_id: 412   }, // burmysandy — no separate PokeAPI home sprite; reuse plant-form
    { id: 528,  pokeapi_id: 412   }, // burmytrash — no separate PokeAPI home sprite; reuse plant-form
    { id: 827,  pokeapi_id: 10116 }, // greninjabond (battle-bond)
    { id: 946,  pokeapi_id: 10151 }, // rockruffdusk (own-tempo)
    { id: 1009, pokeapi_id: 10155 }, // necrozmaduskmane
    { id: 1010, pokeapi_id: 10156 }, // necrozmadawnwings
  ];

  const update = db.prepare('UPDATE pokemon SET pokeapi_id = ? WHERE id = ?');
  let count = 0;
  for (const { id, pokeapi_id } of FIXES) {
    const changes = update.run(pokeapi_id, id).changes;
    if (changes > 0) {
      console.log(`[fixAltFormPokeApiIds] Updated id=${id} pokeapi_id -> ${pokeapi_id}`);
      count++;
    } else {
      console.warn(`[fixAltFormPokeApiIds] No row found for id=${id}`);
    }
  }
  console.log(`[fixAltFormPokeApiIds] ${count} rows updated`);
}

function fixNidoranFormType(db) {
  const update = db.prepare("UPDATE pokemon SET form_type = 'default' WHERE id IN (47, 50) AND form_type = 'cosmetic'");
  const changes = update.run().changes;
  console.log(`[fixNidoranFormType] ${changes} rows updated`);
}

async function seedFemaleCosmeticMovesets(db) {
  const FEMALE_FORMS = [
    { id: 853,  slug: 'meowstic-female'    },
    { id: 1111, slug: 'indeedee-female'    },
    { id: 1150, slug: 'basculegion-female' },
    { id: 1166, slug: 'oinkologne-female'  },
  ];

  const validMoveIds = new Set();
  for (const row of db.prepare('SELECT id FROM moves').all()) validMoveIds.add(row.id);

  const moveInsertStmt = db.prepare(`
    INSERT OR IGNORE INTO pokemon_moves (pokemon_id, move_id, learn_method, learn_level, learn_label, version_group)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const { id, slug } of FEMALE_FORMS) {
    try {
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${slug}/`);
      if (!res.ok) { console.warn(`[seedFemaleCosmeticMovesets] ${slug} returned ${res.status}`); continue; }
      const data = await res.json();

      const rows = [];
      const seen = new Set();
      for (const moveEntry of data.moves ?? []) {
        const moveIdMatch = moveEntry.move?.url?.match(/\/move\/(\d+)\//);
        if (!moveIdMatch) continue;
        const moveId = parseInt(moveIdMatch[1], 10);
        if (!validMoveIds.has(moveId)) continue;
        for (const detail of moveEntry.version_group_details ?? []) {
          const learnMethod = detail.move_learn_method?.name ?? 'other';
          const versionGroup = detail.version_group?.name ?? '';
          let learnLevel = null;
          if (learnMethod === 'level-up' && detail.level_learned_at > 0) learnLevel = detail.level_learned_at;
          const key = `${moveId}:${learnMethod}:${versionGroup}`;
          if (seen.has(key)) continue;
          seen.add(key);
          rows.push([id, moveId, learnMethod, learnLevel, null, versionGroup]);
        }
      }

      const write = db.transaction(() => { for (const r of rows) moveInsertStmt.run(...r); });
      write();
      console.log(`[seedFemaleCosmeticMovesets] ${slug}: ${rows.length} rows inserted`);
    } catch (e) {
      console.error(`[seedFemaleCosmeticMovesets] ${slug} error:`, e.message);
    }
    await sleep(100);
  }
}

async function seedUnownMoves(db) {
  const validMoveIds = new Set();
  for (const row of db.prepare('SELECT id FROM moves').all()) validMoveIds.add(row.id);

  const moveInsertStmt = db.prepare(`
    INSERT OR IGNORE INTO pokemon_moves (pokemon_id, move_id, learn_method, learn_level, learn_label, version_group)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const res = await fetch('https://pokeapi.co/api/v2/pokemon/201/');
  if (!res.ok) { console.warn(`[seedUnownMoves] PokeAPI returned ${res.status}`); return; }
  const data = await res.json();

  const rows = [];
  const seen = new Set();
  for (const moveEntry of data.moves ?? []) {
    const moveIdMatch = moveEntry.move?.url?.match(/\/move\/(\d+)\//);
    if (!moveIdMatch) continue;
    const moveId = parseInt(moveIdMatch[1], 10);
    if (!validMoveIds.has(moveId)) continue;
    for (const detail of moveEntry.version_group_details ?? []) {
      const learnMethod = detail.move_learn_method?.name ?? 'other';
      const versionGroup = detail.version_group?.name ?? '';
      let learnLevel = null;
      if (learnMethod === 'level-up' && detail.level_learned_at > 0) learnLevel = detail.level_learned_at;
      const key = `${moveId}:${learnMethod}:${versionGroup}`;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push([276, moveId, learnMethod, learnLevel, null, versionGroup]);
    }
  }

  const write = db.transaction(() => { for (const r of rows) moveInsertStmt.run(...r); });
  write();
  console.log(`[seedUnownMoves] ${rows.length} rows inserted`);
}

async function seedNidoranData(db) {
  const NIDORAN = [
    { id: 47, pokeApiId: 29, name: 'nidoranf' },
    { id: 50, pokeApiId: 32, name: 'nidoranm' },
  ];

  const validMoveIds = new Set();
  for (const row of db.prepare('SELECT id FROM moves').all()) validMoveIds.add(row.id);

  const moveInsert = db.prepare(`INSERT OR IGNORE INTO pokemon_moves (pokemon_id, move_id, learn_method, learn_level, learn_label, version_group) VALUES (?, ?, ?, ?, ?, ?)`);
  const flavorInsert = db.prepare(`INSERT OR IGNORE INTO pokemon_flavor_text (pokemon_id, game_version, flavor_text) VALUES (?, ?, ?)`);
  const encounterInsert = db.prepare(`INSERT OR IGNORE INTO pokemon_encounter_locations (pokemon_id, game_version, location_name, location_area_slug, encounter_method, encounter_chance, min_level, max_level) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);

  for (const { id, pokeApiId, name } of NIDORAN) {
    // Moves
    const moveRes = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokeApiId}/`);
    if (moveRes.ok) {
      const data = await moveRes.json();
      const rows = [];
      const seen = new Set();
      for (const moveEntry of data.moves ?? []) {
        const match = moveEntry.move?.url?.match(/\/move\/(\d+)\//);
        if (!match) continue;
        const moveId = parseInt(match[1], 10);
        if (!validMoveIds.has(moveId)) continue;
        for (const detail of moveEntry.version_group_details ?? []) {
          const learnMethod = detail.move_learn_method?.name ?? 'other';
          const versionGroup = detail.version_group?.name ?? '';
          let learnLevel = null;
          if (learnMethod === 'level-up' && detail.level_learned_at > 0) learnLevel = detail.level_learned_at;
          const key = `${moveId}:${learnMethod}:${versionGroup}`;
          if (seen.has(key)) continue;
          seen.add(key);
          rows.push([id, moveId, learnMethod, learnLevel, null, versionGroup]);
        }
      }
      db.transaction(() => { for (const r of rows) moveInsert.run(...r); })();
      console.log(`[seedNidoranData] ${name} moves: ${rows.length} rows inserted`);
    }
    await sleep(100);

    // Flavor text
    const speciesRes = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokeApiId}/`);
    if (speciesRes.ok) {
      const speciesData = await speciesRes.json();
      const rows = speciesData.flavor_text_entries
        .filter(e => e.language.name === 'en')
        .map(e => [id, e.version.name, e.flavor_text.replace(/[\n\f\r]/g, ' ').replace(/\s+/g, ' ').trim()]);
      db.transaction(() => { for (const r of rows) flavorInsert.run(...r); })();
      console.log(`[seedNidoranData] ${name} flavor text: ${rows.length} rows inserted`);
    }
    await sleep(100);

    // Encounters
    const encRes = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokeApiId}/encounters`);
    if (encRes.ok) {
      const encData = await encRes.json();
      const aggregate = new Map();
      for (const locationEntry of encData) {
        for (const versionDetail of locationEntry.version_details ?? []) {
          for (const encounterDetail of versionDetail.encounter_details ?? []) {
            const key = `${versionDetail.version.name}:${locationEntry.location_area.name}:${encounterDetail.method.name}`;
            if (!aggregate.has(key)) {
              aggregate.set(key, { gameVersion: versionDetail.version.name, locationName: locationEntry.location_area.name, locationAreaSlug: locationEntry.location_area.name, encounterMethod: encounterDetail.method.name, chance: 0, minLevel: 999, maxLevel: 0 });
            }
            const agg = aggregate.get(key);
            agg.chance += encounterDetail.chance;
            agg.minLevel = Math.min(agg.minLevel, encounterDetail.min_level);
            agg.maxLevel = Math.max(agg.maxLevel, encounterDetail.max_level);
          }
        }
      }
      const rows = [...aggregate.values()].map(a => [id, a.gameVersion, a.locationName, a.locationAreaSlug, a.encounterMethod, a.chance, a.minLevel === 999 ? null : a.minLevel, a.maxLevel === 0 ? null : a.maxLevel]);
      db.transaction(() => { for (const r of rows) encounterInsert.run(...r); })();
      console.log(`[seedNidoranData] ${name} encounters: ${rows.length} rows inserted`);
    }
    await sleep(100);
  }
}

function fixBasculegionEvolution(db) {
  // Remove wrong seeding: red-stripe Basculin (default) should not evolve into Basculegion
  const del = db.prepare('DELETE FROM pokemon_evolutions WHERE pokemon_id = 693 AND evolves_to_id = 1149');
  const deleted = del.run().changes;

  // Insert correct row: white-stripe Basculin (id=695) → Basculegion male (id=1149)
  const insert = db.prepare(`
    INSERT OR IGNORE INTO pokemon_evolutions (pokemon_id, evolves_to_id, method, condition_value)
    VALUES (695, 1149, 'other', NULL)
  `);
  const inserted = insert.run().changes;

  console.log(`[fixBasculegionEvolution] deleted ${deleted} wrong row(s), inserted ${inserted} correct row(s)`);
}

function patchGalarianFlavorText(db) {
  const fs = require('fs');
  const jsonPath = path.join(__dirname, 'output', 'galarian_pokedex_entries.json');

  let entries = [];
  try {
    const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
    entries = JSON.parse(jsonContent);
  } catch (err) {
    console.error(`[patchGalarianFlavorText] Error reading ${jsonPath}:`, err.message);
    return;
  }

  const insertFlavorText = db.prepare(`
    INSERT OR IGNORE INTO pokemon_flavor_text (pokemon_id, game_version, flavor_text)
    VALUES (?, ?, ?)
  `);

  const write = db.transaction(() => {
    for (const entry of entries) {
      insertFlavorText.run(entry.pokemon_id, entry.game_version, entry.flavor_text);
    }
  });

  write();
  console.log(`[patchGalarianFlavorText] ${entries.length} Galarian flavor text rows inserted`);
}

function patchHisuianFlavorText(db) {
  const fs = require('fs');
  const jsonPath = path.join(__dirname, 'output', 'hisuian_pokedex_entries.json');

  let entries = [];
  try {
    const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
    entries = JSON.parse(jsonContent);
  } catch (err) {
    console.error(`[patchHisuianFlavorText] Error reading ${jsonPath}:`, err.message);
    return;
  }

  const insertFlavorText = db.prepare(`
    INSERT OR IGNORE INTO pokemon_flavor_text (pokemon_id, game_version, flavor_text)
    VALUES (?, ?, ?)
  `);

  const write = db.transaction(() => {
    for (const entry of entries) {
      insertFlavorText.run(entry.pokemon_id, entry.game_version, entry.flavor_text);
    }
  });

  write();
  console.log(`[patchHisuianFlavorText] ${entries.length} Hisuian flavor text rows inserted`);
}

function patchPaldeanFlavorText(db) {
  const fs = require('fs');
  const jsonPath = path.join(__dirname, 'output', 'paldean_pokedex_entries.json');

  let entries = [];
  try {
    const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
    entries = JSON.parse(jsonContent);
  } catch (err) {
    console.error(`[patchPaldeanFlavorText] Error reading ${jsonPath}:`, err.message);
    return;
  }

  const insertFlavorText = db.prepare(`
    INSERT OR IGNORE INTO pokemon_flavor_text (pokemon_id, game_version, flavor_text)
    VALUES (?, ?, ?)
  `);

  const write = db.transaction(() => {
    for (const entry of entries) {
      insertFlavorText.run(entry.pokemon_id, entry.game_version, entry.flavor_text);
    }
  });

  write();
  console.log(`[patchPaldeanFlavorText] ${entries.length} Paldean flavor text rows inserted`);
}

function patchAlternateFormFlavorText(db) {
  const fs = require('fs');
  const jsonPath = path.join(__dirname, 'output', 'alternate_form_pokedex_entries.json');

  let entries = [];
  try {
    const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
    entries = JSON.parse(jsonContent);
  } catch (err) {
    console.error(`[patchAlternateFormFlavorText] Error reading ${jsonPath}:`, err.message);
    return;
  }

  const insertFlavorText = db.prepare(`
    INSERT OR IGNORE INTO pokemon_flavor_text (pokemon_id, game_version, flavor_text)
    VALUES (?, ?, ?)
  `);

  const write = db.transaction(() => {
    for (const entry of entries) {
      insertFlavorText.run(entry.pokemon_id, entry.game_version, entry.flavor_text);
    }
  });

  write();
  console.log(`[patchAlternateFormFlavorText] ${entries.length} alternate form flavor text rows inserted`);
}

function migrateEncounterLocationsAddUniqueConstraint(db) {
  // Check if UNIQUE constraint already exists
  const schemaRow = db.prepare(`
    SELECT sql FROM sqlite_master
    WHERE type='table' AND name='pokemon_encounter_locations'
  `).get();

  if (!schemaRow) {
    console.log('[migrateEncounterLocationsAddUniqueConstraint] Table not found');
    return;
  }

  const createTableSQL = schemaRow.sql || '';
  if (createTableSQL.includes('UNIQUE')) {
    console.log('[migrateEncounterLocationsAddUniqueConstraint] UNIQUE constraint already exists, skipping migration');
    return;
  }

  console.log('[migrateEncounterLocationsAddUniqueConstraint] Starting table rebuild with UNIQUE constraint...');

  // Wrap the rebuild in a transaction
  const migration = db.transaction(() => {
    // Step 1a: Drop existing index before renaming
    db.prepare('DROP INDEX IF EXISTS idx_encounter_pokemon_game').run();

    // Step 2: Rename old table
    db.prepare('ALTER TABLE pokemon_encounter_locations RENAME TO pokemon_encounter_locations_old').run();

    // Step 3: Create new table with UNIQUE constraint
    db.prepare(`
      CREATE TABLE pokemon_encounter_locations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pokemon_id INTEGER NOT NULL REFERENCES pokemon(id),
        game_version TEXT NOT NULL,
        location_name TEXT NOT NULL,
        location_area_slug TEXT NOT NULL,
        encounter_method TEXT NOT NULL,
        encounter_chance INTEGER NOT NULL,
        min_level INTEGER,
        max_level INTEGER,
        UNIQUE(pokemon_id, game_version, location_name, location_area_slug, encounter_method, encounter_chance, min_level, max_level)
      )
    `).run();

    // Step 4: Recreate index
    db.prepare(`
      CREATE INDEX idx_encounter_pokemon_game ON pokemon_encounter_locations(pokemon_id, game_version)
    `).run();

    // Step 5: Copy all data from old table
    db.prepare(`
      INSERT INTO pokemon_encounter_locations (id, pokemon_id, game_version, location_name, location_area_slug, encounter_method, encounter_chance, min_level, max_level)
      SELECT id, pokemon_id, game_version, location_name, location_area_slug, encounter_method, encounter_chance, min_level, max_level
      FROM pokemon_encounter_locations_old
    `).run();

    // Step 6: Drop old table
    db.prepare('DROP TABLE pokemon_encounter_locations_old').run();
  });

  migration();

  const countAfter = db.prepare('SELECT COUNT(*) as c FROM pokemon_encounter_locations').get().c;
  console.log(`[migrateEncounterLocationsAddUniqueConstraint] Migration complete, ${countAfter} rows migrated`);
}

function deduplicateEncounterLocations(db) {
  const countBefore = db.prepare('SELECT COUNT(*) as c FROM pokemon_encounter_locations').get().c;

  const deleteStmt = db.prepare(`
    DELETE FROM pokemon_encounter_locations
    WHERE id NOT IN (
      SELECT MIN(id)
      FROM pokemon_encounter_locations
      GROUP BY pokemon_id, game_version, location_name, location_area_slug, encounter_method, encounter_chance, min_level, max_level
    )
  `);

  const result = deleteStmt.run();
  const deleted = result.changes;
  const countAfter = db.prepare('SELECT COUNT(*) as c FROM pokemon_encounter_locations').get().c;

  console.log(`[deduplicateEncounterLocations] Deleted ${deleted} duplicate rows (before: ${countBefore}, after: ${countAfter})`);
}

function patchFemaleFormFlavorText(db) {
  const fs = require('fs');
  const jsonPath = path.join(__dirname, 'output', 'female_form_pokedex_entries.json');

  let entries = [];
  try {
    const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
    entries = JSON.parse(jsonContent);
  } catch (err) {
    console.error(`[patchFemaleFormFlavorText] Error reading ${jsonPath}:`, err.message);
    return;
  }

  const insertFlavorText = db.prepare(`
    INSERT OR REPLACE INTO pokemon_flavor_text (pokemon_id, game_version, flavor_text)
    VALUES (?, ?, ?)
  `);

  const write = db.transaction(() => {
    for (const entry of entries) {
      insertFlavorText.run(entry.pokemon_id, entry.game_version, entry.flavor_text);
    }
  });

  write();
  console.log(`[patchFemaleFormFlavorText] ${entries.length} female form flavor text rows upserted`);
}

function patchCosmeticFormFlavorText(db) {
  // Copy flavor text from base/mask forms to cosmetic/tera forms that share the same lore
  const FLAVOR_TEXT_COPIES = [
    // Ogerpon Tera forms (copy from their respective mask base forms)
    { targetId: 1282, sourceId: 1278, description: 'Wellspring Tera <- Wellspring Mask' },
    { targetId: 1283, sourceId: 1279, description: 'Hearthflame Tera <- Hearthflame Mask' },
    { targetId: 1284, sourceId: 1280, description: 'Cornerstone Tera <- Cornerstone Mask' },
    // Cosmetic female forms (copy from their base/male default form)
    { targetId: 853,  sourceId: 852,  description: 'Meowstic Female <- Meowstic' },
    { targetId: 1111, sourceId: 1110, description: 'Indeedee Female <- Indeedee' },
    { targetId: 1150, sourceId: 1149, description: 'Basculegion Female <- Basculegion' },
    { targetId: 1166, sourceId: 1165, description: 'Oinkologne Female <- Oinkologne' },
  ];

  const copyFlavorTextStmt = db.prepare(`
    INSERT OR IGNORE INTO pokemon_flavor_text (pokemon_id, game_version, flavor_text)
    SELECT ?, game_version, flavor_text
    FROM pokemon_flavor_text
    WHERE pokemon_id = ?
  `);

  const copy = db.transaction(() => {
    for (const { targetId, sourceId, description } of FLAVOR_TEXT_COPIES) {
      const result = copyFlavorTextStmt.run(targetId, sourceId);
      console.log(`[patchCosmeticFormFlavorText] ${description}: ${result.changes} rows inserted`);
    }
  });

  copy();
}

function patchEvolutionConditionValues(db) {
  // Fill in missing condition_values and fix methods on evolution rows.
  // formatMethod in EvolutionChain.tsx determines display text based on method + condition_value.

  const updates = db.transaction(() => {
    let totalUpdated = 0;

    // Location-based level-ups: set method + condition_value
    const LOCATION_LEVEL_UPS = [
      { id: 60, method: 'level-up', condition_value: 'Magnetic Field' }, // Magneton → Magnezone
      { id: 189, method: 'level-up', condition_value: 'Magnetic Field' }, // Nosepass → Probopass
      { id: 382, method: 'level-up', condition_value: 'Magnetic Field' }, // Charjabug → Vikavolt
      { id: 377, method: 'level-up', condition_value: 'Mount Lanakila' }, // Crabrawler → Crabominable
    ];

    const locationLevelUpStmt = db.prepare('UPDATE pokemon_evolutions SET method = ?, condition_value = ? WHERE id = ?');
    for (const { id, method, condition_value } of LOCATION_LEVEL_UPS) {
      const result = locationLevelUpStmt.run(method, condition_value, id);
      totalUpdated += result.changes;
    }

    // Level-up with item/condition
    const ITEM_CONDITION_UPS = [
      { id: 99, method: 'use-item', condition_value: 'leaf-stone' }, // Eevee → Leafeon
      { id: 100, method: 'use-item', condition_value: 'ice-stone' }, // Eevee → Glaceon
      { id: 101, method: 'level-up', condition_value: 'Fairy Move + Affection' }, // Eevee → Sylveon
      { id: 209, method: 'level-up', condition_value: 'Prism Scale / Beauty' }, // Feebas → Milotic
      { id: 154, method: 'level-up', condition_value: 'With Remoraid' }, // Mantyke → Mantine
    ];

    const itemConditionStmt = db.prepare('UPDATE pokemon_evolutions SET method = ?, condition_value = ? WHERE id = ?');
    for (const { id, method, condition_value } of ITEM_CONDITION_UPS) {
      const result = itemConditionStmt.run(method, condition_value, id);
      totalUpdated += result.changes;
    }

    // Level-up 1000 steps (Let's Go mechanic)
    const STEPS_UPS = [
      { id: 452, method: 'level-up', condition_value: '1,000 Steps' }, // Pawmo → Pawmot
      { id: 463, method: 'level-up', condition_value: '1,000 Steps' }, // Bramblin → Brambleghast
      { id: 469, method: 'level-up', condition_value: '1,000 Steps' }, // Rellor → Rabsca
    ];

    const stepsStmt = db.prepare('UPDATE pokemon_evolutions SET method = ?, condition_value = ? WHERE id = ?');
    for (const { id, method, condition_value } of STEPS_UPS) {
      const result = stepsStmt.run(method, condition_value, id);
      totalUpdated += result.changes;
    }

    // Hisuian Sneasel → Sneasler — level-up at day
    const dayStmt = db.prepare("UPDATE pokemon_evolutions SET method = 'level-up', condition_value = 'Lv. 20 (Day)' WHERE id = 654");
    totalUpdated += dayStmt.run().changes;

    // Other method rows: check current method and update if still 'other'
    const OTHER_METHOD_UPS = [
      { id: 42, method: 'use-move', condition_value: 'rage-fist' }, // Primeape → Annihilape
      { id: 56, method: 'three-critical-hits', condition_value: null }, // Farfetch'd → Sirfetch'd
      { id: 645, method: 'three-critical-hits', condition_value: null }, // Galarian Farfetch'd → Sirfetch'd
      { id: 149, method: 'use-move', condition_value: 'barb-barrage' }, // Qwilfish → Overqwil
      { id: 653, method: 'use-move', condition_value: 'barb-barrage' }, // Hisuian Qwilfish → Overqwil
      { id: 155, method: 'use-move', condition_value: 'psyshield-bash' }, // Stantler → Wyrdeer
      { id: 674, method: 'recoil-damage', condition_value: null }, // Basculin → Basculegion
      { id: 870, method: 'recoil-damage', condition_value: null }, // Basculin → Basculegion (alternate)
      { id: 299, method: 'take-damage', condition_value: null }, // Yamask → Runerigus
      { id: 650, method: 'take-damage', condition_value: null }, // Galarian Yamask → Runerigus
      { id: 333, method: 'three-defeated-bisharp', condition_value: null }, // Bisharp → Kingambit
      { id: 435, method: 'spin', condition_value: null }, // Milcery → Alcremie
      { id: 478, method: 'gimmighoul-coins', condition_value: null }, // Gimmighoul → Gholdengo
    ];

    const otherMethodStmt = db.prepare('UPDATE pokemon_evolutions SET method = ?, condition_value = ? WHERE id = ? AND method = ?');
    for (const { id, method, condition_value } of OTHER_METHOD_UPS) {
      const result = otherMethodStmt.run(method, condition_value, id, 'other');
      totalUpdated += result.changes;
    }

    return totalUpdated;
  });

  const totalRows = updates();
  console.log(`[patchEvolutionConditionValues] Updated ${totalRows} evolution rows with corrected methods and condition_values`);
}

function printRowCounts(db) {
  const tables = ['abilities', 'pokemon_abilities', 'pokemon_evolutions'];
  console.log('\n[PatchDb] Row counts:');
  for (const t of tables) {
    const c = db.prepare(`SELECT COUNT(*) as c FROM ${t}`).get().c;
    console.log(`  ${t}: ${c}`);
  }
  const mega = db.prepare("SELECT COUNT(*) as c FROM pokemon_evolutions WHERE method='mega-evolution'").get().c;
  const gmax = db.prepare("SELECT COUNT(*) as c FROM pokemon_evolutions WHERE method='gigantamax'").get().c;
  console.log(`  evolutions (mega-evolution): ${mega}`);
  console.log(`  evolutions (gigantamax): ${gmax}`);
  const encRegional = db.prepare("SELECT COUNT(DISTINCT pokemon_id) as c FROM pokemon_encounter_locations WHERE pokemon_id IN (SELECT id FROM pokemon WHERE form_type='regional')").get().c;
  const movesRegional = db.prepare("SELECT COUNT(DISTINCT pokemon_id) as c FROM pokemon_moves WHERE pokemon_id IN (SELECT id FROM pokemon WHERE form_type='regional')").get().c;
  const movesAlternate = db.prepare("SELECT COUNT(DISTINCT pokemon_id) as c FROM pokemon_moves WHERE pokemon_id IN (SELECT id FROM pokemon WHERE form_type='alternate')").get().c;
  console.log(`  encounter_locations (regional forms with data): ${encRegional}`);
  console.log(`  pokemon_moves (regional forms with data): ${movesRegional}`);
  console.log(`  pokemon_moves (alternate forms with data): ${movesAlternate}`);
}

async function main() {
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  patchAbilities(db);
  patchEvolutionChains(db);
  await fetchRegionalEncounters(db);
  await seedNonDefaultMovesets(db);
  fixAltFormPokeApiIds(db);
  fixNidoranFormType(db);
  await seedFemaleCosmeticMovesets(db);
  await seedUnownMoves(db);
  await seedNidoranData(db);
  fixBasculegionEvolution(db);
  patchGalarianFlavorText(db);
  patchHisuianFlavorText(db);
  patchPaldeanFlavorText(db);
  patchAlternateFormFlavorText(db);
  patchCosmeticFormFlavorText(db);
  patchFemaleFormFlavorText(db);
  patchEvolutionConditionValues(db);
  deduplicateEncounterLocations(db);
  migrateEncounterLocationsAddUniqueConstraint(db);

  printRowCounts(db);
  db.pragma('wal_checkpoint(TRUNCATE)');
  db.pragma('journal_mode = DELETE');
  db.close();
  console.log('\n[PatchDb] ✓ Done. Do not commit assets/db/championdex.db until user approves on device.');
}

main();
