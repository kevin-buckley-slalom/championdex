#!/usr/bin/env node
/**
 * Find Misclassified Forms Script
 * Identifies all @pkmn/dex species where species.forme is truthy
 * BUT determineFormType() incorrectly returns 'default'
 */

const https = require('https');
const { Dex } = require('@pkmn/dex');

function generatePokeApiSlug(speciesName, forme = '') {
  let slug = speciesName.toLowerCase().replace(/ /g, '-').replace(/[''.]/g, '');
  if (forme === 'F') slug = slug.replace(/-f$/, '-female');
  else if (forme === 'M') slug = slug.replace(/-m$/, '-male');
  const totemMatch = slug.match(/^(.+?)-(alola|galar|hisui|paldea)-totem$/);
  if (totemMatch) slug = `${totemMatch[1]}-totem-${totemMatch[2]}`;
  if (slug.match(/^tauros-paldea-(combat|blaze|aqua)$/)) slug = `${slug}-breed`;
  if (slug === 'darmanitan-galar') slug = 'darmanitan-galar-standard';
  if (slug === 'toxtricity-gmax') slug = 'toxtricity-amped-gmax';
  if (slug === 'urshifu-gmax') slug = 'urshifu-single-strike-gmax';
  return slug;
}

function determineFormType(species) {
  const name = species.name.toLowerCase();
  if (name.includes('-alola') || name.includes('-galar') || name.includes('-hisui') || name.includes('-paldea')) return 'regional';
  if (name.includes('-mega')) return 'mega';
  if (name.includes('-gmax')) return 'gigantamax';
  if (name.endsWith('-f') || name.endsWith('-m')) return 'cosmetic';
  return 'default';
}

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        try { resolve({ statusCode: res.statusCode, body: JSON.parse(data) }); }
        catch (e) { resolve({ statusCode: res.statusCode, body: null }); }
      });
    }).on('error', reject);
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function audit() {
  const speciesData = Dex.species.all();
  const misclassified = [];

  for (const species of speciesData) {
    if (!species.exists || ['CAP', 'Future', 'Custom'].includes(species.isNonstandard)) continue;
    if (species.forme && determineFormType(species) === 'default') {
      misclassified.push({
        name: species.name,
        national_dex: species.num,
        forme: species.forme,
        slug: generatePokeApiSlug(species.name, species.forme),
        pokeapi_id: null,
        status: 'PENDING',
      });
    }
  }

  console.log(`Found ${misclassified.length} misclassified forms:\n`);

  for (let i = 0; i < misclassified.length; i++) {
    const entry = misclassified[i];
    if (i > 0) await sleep(250);
    try {
      const result = await httpsGet(`https://pokeapi.co/api/v2/pokemon/${entry.slug}`);
      if (result.statusCode === 200 && result.body) {
        entry.pokeapi_id = result.body.id;
        entry.status = 'OK';
      } else {
        entry.status = `HTTP_${result.statusCode}`;
      }
    } catch (err) {
      entry.status = `ERROR: ${err.message}`;
    }
  }

  console.log('NAME                             | NAT_DEX | FORME              | SLUG                          | CORRECT_ID | STATUS');
  console.log('-'.repeat(120));
  for (const e of misclassified) {
    console.log(
      e.name.padEnd(32) + ' | ' +
      String(e.national_dex).padEnd(7) + ' | ' +
      (e.forme || '-').padEnd(18) + ' | ' +
      e.slug.padEnd(29) + ' | ' +
      (e.pokeapi_id != null ? String(e.pokeapi_id) : 'N/A').padEnd(10) + ' | ' +
      e.status
    );
  }

  console.log('\nJSON:');
  console.log(JSON.stringify(misclassified));
}

audit().catch(err => { console.error('Error:', err); process.exit(1); });
