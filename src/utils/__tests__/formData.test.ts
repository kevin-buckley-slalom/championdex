/**
 * DB form data validation — asserts every form from the user-approved spec
 * has the correct display_name and form_name in the bundled DB.
 *
 * Run: npx jest formData
 */

import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.resolve(process.cwd(), 'assets/db/championdex.db');

interface PokemonRow {
  name: string;
  display_name: string;
  form_type: string;
  form_name: string | null;
}

function getForm(db: Database.Database, name: string): PokemonRow | undefined {
  return db.prepare('SELECT name, display_name, form_type, form_name FROM pokemon WHERE name = ?').get(name) as PokemonRow | undefined;
}

describe('Form display_name and form_name DB validation', () => {
  let db: Database.Database;

  beforeAll(() => {
    db = new Database(DB_PATH, { readonly: true });
  });

  afterAll(() => {
    db.close();
  });

  const cases: [string, string, string, string | null][] = [
    // [db_name, expected_display_name, expected_form_type, expected_form_name]

    // Zygarde
    ['zygarde',         'Zygarde',  'default',   '50%'],
    ['zygarde10',       'Zygarde',  'alternate',  '10%'],
    ['zygardecomplete', 'Zygarde',  'alternate',  'Complete'],

    // Greninja
    ['greninjaash',  'Greninja', 'alternate', 'Ash-Greninja'],
    ['greninjabond', 'Greninja', 'alternate', 'Bond-Greninja'],

    // Deoxys
    ['deoxysattack',  'Deoxys', 'alternate', 'Attack'],
    ['deoxysdefense', 'Deoxys', 'alternate', 'Defense'],
    ['deoxysspeed',   'Deoxys', 'alternate', 'Speed'],

    // Kyurem
    ['kyuremblack', 'Kyurem', 'alternate', 'Black'],
    ['kyuremwhite', 'Kyurem', 'alternate', 'White'],

    // Aegislash
    ['aegislash',      'Aegislash', 'default',   'Shield Forme'],
    ['aegislashblade', 'Aegislash', 'alternate',  'Blade Forme'],

    // Bloodmoon Ursaluna
    ['ursalunabloodmoon', 'Bloodmoon Ursaluna', 'alternate', null],

    // Basculin
    ['basculinbluestriped',  'Basculin', 'alternate', 'Blue-Striped'],
    ['basculinwhitestriped', 'Basculin', 'alternate', 'White-Striped'],

    // Mimikyu
    ['mimikyubusted', 'Mimikyu', 'alternate', 'Busted'],

    // Ogerpon
    ['ogerpon',               'Ogerpon', 'default',   'Teal Mask'],
    ['ogerpontealtera',       'Ogerpon', 'alternate',  'Teal Mask Tera'],
    ['ogerponcornerstone',    'Ogerpon', 'alternate',  'Cornerstone Mask'],
    ['ogerponcornerstonetera','Ogerpon', 'alternate',  'Cornerstone Mask Tera'],
    ['ogerponhearthflame',    'Ogerpon', 'alternate',  'Hearthflame Mask'],
    ['ogerponhearthflametera','Ogerpon', 'alternate',  'Hearthflame Mask Tera'],
    ['ogerponwellspring',     'Ogerpon', 'alternate',  'Wellspring Mask'],
    ['ogerponwellspringtera', 'Ogerpon', 'alternate',  'Wellspring Mask Tera'],

    // Zacian / Zamazenta
    ['zaciancrowned',    'Zacian',    'alternate', 'Crowned Sword'],
    ['zamazentacrowned', 'Zamazenta', 'alternate', 'Crowned Shield'],

    // Necrozma
    ['necrozmadawnwings', 'Necrozma', 'alternate', 'Dawn-Wings'],
    ['necrozmaduskmane',  'Necrozma', 'alternate', 'Dusk-Mane'],
    ['necrozmaultra',     'Ultra Necrozma', 'alternate', null],

    // Tatsugiri
    ['tatsugiridroopy',   'Tatsugiri', 'alternate', 'Droopy Form'],
    ['tatsugiristretchy', 'Tatsugiri', 'alternate', 'Stretchy Form'],

    // Rockruff / Lycanroc
    ['rockruffdusk',  'Rockruff', 'alternate', 'Dusk'],
    ['lycanroc',      'Lycanroc', 'default',   'Midday Form'],
    ['lycanrocmidnight', 'Lycanroc', 'alternate', 'Midnight Form'],
    ['lycanrocdusk',     'Lycanroc', 'alternate', 'Dusk Form'],

    // Floette
    ['floetteeternal', 'Floette', 'alternate', 'Eternal'],

    // Eternamax Eternatus
    ['eternatuseternamax', 'Eternamax Eternatus', 'alternate', null],

    // Rotom
    ['rotomfan',   'Rotom', 'alternate', 'Fan'],
    ['rotomfrost', 'Rotom', 'alternate', 'Frost'],
    ['rotomheat',  'Rotom', 'alternate', 'Heat'],
    ['rotommow',   'Rotom', 'alternate', 'Mow'],
    ['rotomwash',  'Rotom', 'alternate', 'Wash'],

    // Maushold — Four should NOT exist (excluded)
    // (tested separately below)

    // Morpeko
    ['morpekohangry', 'Morpeko', 'alternate', 'Hangry Mode'],

    // Palafin
    ['palafin',     'Palafin', 'default',   'Zero Form'],
    ['palafinhero', 'Palafin', 'alternate',  'Hero Form'],

    // Calyrex
    ['calyrexice',    'Calyrex', 'alternate', 'Ice Rider'],
    ['calyrexshadow', 'Calyrex', 'alternate', 'Shadow Rider'],

    // Pumpkaboo
    ['pumpkaboo',      'Pumpkaboo', 'default',   'Medium Size'],
    ['pumpkaboosmall', 'Pumpkaboo', 'alternate',  'Small Size'],
    ['pumpkaboolarge', 'Pumpkaboo', 'alternate',  'Large Size'],
    ['pumpkaboosuper', 'Pumpkaboo', 'alternate',  'Super Size'],

    // Gourgeist
    ['gourgeist',      'Gourgeist', 'default',   'Medium Size'],
    ['gourgeistsmall', 'Gourgeist', 'alternate',  'Small Size'],
    ['gourgeistlarge', 'Gourgeist', 'alternate',  'Large Size'],
    ['gourgeistsuper', 'Gourgeist', 'alternate',  'Super Size'],

    // Toxtricity
    ['toxtricity',     'Toxtricity', 'default',   'Amped Form'],
    ['toxtricitylowkey', 'Toxtricity', 'alternate', 'Low-Key Form'],

    // Eiscue
    ['eiscue',      'Eiscue', 'default',   'Ice Face'],
    ['eiscuenoice', 'Eiscue', 'alternate',  'Noice Face'],

    // Dialga / Palkia / Giratina
    ['dialgaorigin',   'Dialga',   'alternate', 'Origin Forme'],
    ['palkiaorigin',   'Palkia',   'alternate', 'Origin Forme'],
    ['giratinaorigin', 'Giratina', 'alternate', 'Origin Forme'],

    // Oricorio
    ['oricorio',      'Oricorio', 'default',   'Baile Style'],
    ['oricoriopau',   'Oricorio', 'alternate',  "Pa'u Style"],
    ['oricoriopompom','Oricorio', 'alternate',  'Pom-Pom Style'],
    ['oricoriosensu', 'Oricorio', 'alternate',  'Sensu Style'],

    // Meloetta
    ['meloetta',          'Meloetta', 'default',   'Aria Forme'],
    ['meloettapirouette', 'Meloetta', 'alternate',  'Pirouette Forme'],

    // Primal
    ['kyogreprimal',  'Primal Kyogre',  'alternate', 'Primal'],
    ['groudonprimal', 'Primal Groudon', 'alternate', 'Primal'],

    // Urshifu
    ['urshifu',            'Urshifu', 'default',   'Single-Strike'],
    ['urshifurapidstrike', 'Urshifu', 'alternate',  'Rapid-Strike'],

    // Keldeo / Gimmighoul
    ['keldeoresolute',   'Keldeo',     'alternate', 'Resolute'],
    ['gimmighoulroaming','Gimmighoul', 'alternate', 'Roaming'],

    // Burmy / Wormadam
    ['burmy',       'Burmy', 'default',   'Plant Cloak'],
    ['burmysandy',  'Burmy', 'alternate',  'Sandy Cloak'],
    ['burmytrash',  'Burmy', 'alternate',  'Trash Cloak'],
    ['wormadam',      'Wormadam', 'default',   'Plant Cloak'],
    ['wormadamsandy', 'Wormadam', 'alternate',  'Sandy Cloak'],
    ['wormadamtrash', 'Wormadam', 'alternate',  'Trash Cloak'],

    // Wishiwashi / Shaymin
    ['wishiwashi',       'Wishiwashi', 'default',   'Solo Form'],
    ['wishiwashischool', 'Wishiwashi', 'alternate',  'School Form'],
    ['shaymin',    'Shaymin', 'default',   'Land Forme'],
    ['shayminsky', 'Shaymin', 'alternate',  'Sky Forme'],

    // Terapagos
    ['terapagosterastal', 'Terapagos', 'alternate', 'Terastal Form'],
    ['terapagosstellar',  'Terapagos', 'alternate', 'Stellar Form'],

    // Forces of Nature
    ['landorus',         'Landorus',  'default',   'Incarnate'],
    ['landorustherian',  'Landorus',  'alternate',  'Therian'],
    ['thundurus',        'Thundurus', 'default',   'Incarnate'],
    ['thundurustherian', 'Thundurus', 'alternate',  'Therian'],
    ['tornadus',         'Tornadus',  'default',   'Incarnate'],
    ['tornadustherian',  'Tornadus',  'alternate',  'Therian'],
    ['enamorus',         'Enamorus',  'default',   'Incarnate'],
    ['enamorustherian',  'Enamorus',  'alternate',  'Therian'],

    // Hoopa
    ['hoopa',        'Hoopa', 'default',   'Confined'],
    ['hoopaunbound', 'Hoopa', 'alternate',  'Unbound'],

    // Darmanitan
    ['darmanitan',    'Darmanitan',         'default',   'Standard Mode'],
    ['darmanitanzen', 'Darmanitan',         'alternate',  'Zen Mode'],
    ['darmanitangalar',    'Galarian Darmanitan', 'regional', null],
    ['darmanitangalarzen', 'Galarian Darmanitan', 'regional', 'Zen Mode'],

    // Paldean Tauros
    ['taurospaldeacombat', 'Paldean Tauros', 'regional', 'Combat Breed'],
    ['taurospaldeablaze',  'Paldean Tauros', 'regional', 'Blaze Breed'],
    ['taurospaldeaaqua',   'Paldean Tauros', 'regional', 'Aqua Breed'],

    // Nidoran
    ['nidoranf', 'Nidoran ♀', 'cosmetic', null],
    ['nidoranm', 'Nidoran ♂', 'cosmetic', null],
  ];

  test.each(cases)('%s → display_name="%s" form_type=%s form_name=%s', (dbName, expectedDisplay, expectedType, expectedFormName) => {
    const row = getForm(db, dbName);
    expect(row).toBeDefined();
    expect(row!.display_name).toBe(expectedDisplay);
    expect(row!.form_type).toBe(expectedType);
    expect(row!.form_name ?? null).toBe(expectedFormName);
  });

  it('Maushold-Four is excluded from the DB', () => {
    const row = getForm(db, 'mausholdfour');
    expect(row).toBeUndefined();
  });

  it('Dudunsparce-Three-Segment is excluded from the DB', () => {
    const row = getForm(db, 'dudunsparcethreesegment');
    expect(row).toBeUndefined();
  });
});
