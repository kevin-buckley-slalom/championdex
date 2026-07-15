#!/usr/bin/env node

const https = require('https');
const { Dex } = require('@pkmn/dex');

const COSMETIC_DEX_NUMS = new Set([666, 869, 774, 585, 422, 423, 845, 172, 421, 801, 893, 931, 1012, 1013, 854, 855]);
const TYPE_VARIANT_DEX_NUMS = new Set([493, 773, 351]);

// Must mirror useFormVariants.ts exactly
const FORM_POKEAPI_IDS = new Map([
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

const FORM_SLUG_OVERRIDES = new Map([
  ['vivillonpokeball',      'poke-ball'],
  ['alcremierubycream',     'ruby-cream-strawberry-sweet'],
  ['alcremiematchacream',   'matcha-cream-strawberry-sweet'],
  ['alcremiemintcream',     'mint-cream-strawberry-sweet'],
  ['alcremielemoncream',    'lemon-cream-strawberry-sweet'],
  ['alcremierubyswirl',     'ruby-swirl-strawberry-sweet'],
  ['alcremiecaramelswirl',  'caramel-swirl-strawberry-sweet'],
  ['alcremierainbowswirl',  'rainbow-swirl-strawberry-sweet'],
]);

function httpsHead(url) {
  return new Promise((resolve) => {
    const req = https.request(url, { method: 'HEAD' }, (res) => resolve(res.statusCode));
    req.on('error', () => resolve('ERROR'));
    req.setTimeout(8000, () => { req.destroy(); resolve('TIMEOUT'); });
    req.end();
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const allForms = [];
  for (const species of Dex.species.all()) {
    const isCosmeticNum = COSMETIC_DEX_NUMS.has(species.num);
    const isTypeVarNum = TYPE_VARIANT_DEX_NUMS.has(species.num);
    if ((isCosmeticNum || isTypeVarNum) && species.forme && species.exists &&
        species.isNonstandard !== 'CAP' && species.isNonstandard !== 'Future') {
      const pokeApiId = FORM_POKEAPI_IDS.get(species.id);
      let url;
      if (pokeApiId !== undefined) {
        url = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${pokeApiId}.png`;
      } else {
        const slugOverride = FORM_SLUG_OVERRIDES.get(species.id);
        const formSlug = slugOverride ?? species.forme.toLowerCase().replace(/ /g, '-');
        url = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${species.num}-${formSlug}.png`;
      }
      allForms.push({ dexNum: species.num, id: species.id, forme: species.forme, url, category: isCosmeticNum ? 'COSMETIC' : 'TYPE_VARIANT' });
    }
  }

  process.stderr.write(`Checking ${allForms.length} forms...\n`);
  const results = [];
  for (let i = 0; i < allForms.length; i += 10) {
    const batch = allForms.slice(i, i + 10);
    const statuses = await Promise.all(batch.map(f => httpsHead(f.url)));
    batch.forEach((f, j) => results.push({ ...f, status: statuses[j] }));
    process.stderr.write(`${Math.min(i + 10, allForms.length)}/${allForms.length}\r`);
    if (i + 10 < allForms.length) await sleep(150);
  }
  process.stderr.write('\n');

  const missing = results.filter(r => r.status !== 200);
  for (const form of missing) {
    const alts = [
      { label: 'base-form', url: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${form.dexNum}.png` },
      { label: 'no-spaces', url: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${form.dexNum}-${form.forme.toLowerCase().replace(/ /g, '')}.png` },
      { label: 'underscores', url: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${form.dexNum}-${form.forme.toLowerCase().replace(/ /g, '_')}.png` },
      { label: 'species-id', url: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${form.id}.png` },
    ];
    for (const alt of alts) {
      alt.status = await httpsHead(alt.url);
      await sleep(80);
    }
    form.alts = alts;
  }

  const ok = results.filter(r => r.status === 200).length;
  console.log('\n========== SPRITE VALIDATION REPORT ==========');
  console.log(`Total forms checked : ${results.length}`);
  console.log(`OK (200)            : ${ok}`);
  console.log(`MISSING / ERROR     : ${missing.length}`);

  console.log('\n--- FULL TABLE ---');
  console.log('DEX  | Category     | ID                        | Forme              | Slug                | Status');
  console.log('-'.repeat(105));
  for (const r of results.sort((a, b) => a.dexNum - b.dexNum)) {
    const s = r.status === 200 ? '✅ 200' : `❌ ${r.status}`;
    console.log(`${String(r.dexNum).padEnd(4)} | ${r.category.padEnd(12)} | ${r.id.padEnd(25)} | ${r.forme.padEnd(18)} | ${r.url.padEnd(19)} | ${s}`);
  }

  if (missing.length > 0) {
    console.log('\n--- MISSING FORMS DETAIL ---');
    for (const f of missing) {
      console.log(`\n[#${f.dexNum}] ${f.id} — forme: "${f.forme}" — slug: "${f.formSlug}"`);
      console.log(`  Primary URL: ${f.url}`);
      let found = false;
      for (const alt of f.alts) {
        const mark = alt.status === 200 ? '✓ FOUND' : `✗ ${alt.status}`;
        console.log(`  ${mark.padEnd(10)} [${alt.label}] ${alt.url}`);
        if (alt.status === 200) found = true;
      }
      console.log(`  => ${found ? 'NAMING MISMATCH — alternative URL exists' : 'NO SPRITE AVAILABLE in repo'}`);
    }
  } else {
    console.log('\n✅ All forms have valid sprite URLs.');
  }
  console.log('\n========== END ==========');
}

main().catch(err => { console.error(err); process.exit(1); });
