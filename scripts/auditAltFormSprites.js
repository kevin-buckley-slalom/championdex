'use strict';
const Database = require('better-sqlite3');
const path = require('path');
const https = require('https');

const DB_PATH = path.join(__dirname, '..', 'assets', 'db', 'championdex.db');

function httpsGet(url) {
  return new Promise((resolve) => {
    const req = https.request(url, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => resolve({ status: res.statusCode, body }));
    });
    req.on('error', () => resolve({ status: 0, body: '' }));
    req.end();
  });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// Returns the national dex number that PokeAPI associates with a given pokemon id.
// Uses the pokemon endpoint's species URL to get the national dex id.
const pokeApiCache = new Map();
async function getPokeApiNationalDex(pokeApiId) {
  if (pokeApiCache.has(pokeApiId)) return pokeApiCache.get(pokeApiId);
  const { status, body } = await httpsGet(`https://pokeapi.co/api/v2/pokemon/${pokeApiId}/`);
  if (status !== 200) { pokeApiCache.set(pokeApiId, null); return null; }
  try {
    const j = JSON.parse(body);
    // species url is like .../pokemon-species/83/ — extract dex number
    const speciesUrl = j.species && j.species.url;
    const match = speciesUrl && speciesUrl.match(/\/(\d+)\/?$/);
    const dex = match ? parseInt(match[1], 10) : null;
    pokeApiCache.set(pokeApiId, dex);
    return dex;
  } catch (e) {
    pokeApiCache.set(pokeApiId, null);
    return null;
  }
}

async function main() {
  const db = new Database(DB_PATH, { readonly: true });

  const forms = db.prepare(`
    SELECT id, name, display_name, form_type, national_dex, pokeapi_id
    FROM pokemon
    WHERE form_type IN ('regional', 'alternate', 'mega', 'gigantamax', 'cosmetic')
    ORDER BY national_dex, id
  `).all();

  console.log(`Auditing ${forms.length} non-default forms (species cross-check via PokeAPI)...\n`);

  const wrong = [];
  const ok = [];
  let i = 0;

  for (const form of forms) {
    i++;

    // Fetch the national dex number PokeAPI associates with this pokeapi_id
    const apiDex = await getPokeApiNationalDex(form.pokeapi_id);

    if (apiDex === null) {
      wrong.push({ ...form, api_dex: 'N/A', reason: `PokeAPI returned no data for pokeapi_id=${form.pokeapi_id}` });
      process.stdout.write(`[${i}/${forms.length}] ❌ id=${form.id} ${form.name} — PokeAPI 404 for pokeapi_id=${form.pokeapi_id}\n`);
    } else if (apiDex !== form.national_dex) {
      wrong.push({ ...form, api_dex: apiDex, reason: `pokeapi_id=${form.pokeapi_id} belongs to species dex#${apiDex}, expected dex#${form.national_dex}` });
      process.stdout.write(`[${i}/${forms.length}] ❌ id=${form.id} ${form.name} — pokeapi_id=${form.pokeapi_id} is species #${apiDex}, expected #${form.national_dex}\n`);
    } else {
      ok.push(form);
      process.stdout.write(`[${i}/${forms.length}] ✅ id=${form.id} ${form.name} (pokeapi_id=${form.pokeapi_id} → dex#${apiDex})\n`);
    }

    // Throttle: 1 req per ~120ms, pause after every 10
    if (i % 10 === 0) await sleep(300);
    else await sleep(80);
  }

  db.close();

  console.log(`\n=== SUMMARY ===`);
  console.log(`OK: ${ok.length}`);
  console.log(`FLAGGED: ${wrong.length}\n`);

  if (wrong.length > 0) {
    console.log('Flagged forms (species mismatch or missing PokeAPI entry):');
    console.table(wrong.map(f => ({
      db_id: f.id,
      name: f.name,
      form_type: f.form_type,
      national_dex: f.national_dex,
      pokeapi_id: f.pokeapi_id,
      api_species_dex: f.api_dex,
      reason: f.reason,
    })));
  }
}

main().catch(err => { console.error(err); process.exit(1); });
