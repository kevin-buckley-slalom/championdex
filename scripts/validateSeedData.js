#!/usr/bin/env node

const https = require('https');

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on('error', reject);
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function validateFlavorText() {
  const samplePokemon = [
    { num: 1, name: 'Bulbasaur' },
    { num: 4, name: 'Charmander' },
    { num: 7, name: 'Squirtle' },
    { num: 25, name: 'Pikachu' },
    { num: 133, name: 'Eevee' },
    { num: 150, name: 'Mewtwo' },
    { num: 151, name: 'Mew' },
    { num: 152, name: 'Chikorita' },
    { num: 158, name: 'Totodile' },
    { num: 249, name: 'Lugia' },
    { num: 252, name: 'Treecko' },
    { num: 258, name: 'Mudkip' },
    { num: 280, name: 'Ralts' },
    { num: 445, name: 'Garchomp' },
    { num: 448, name: 'Lucario' },
    { num: 491, name: 'Darkrai' },
    { num: 495, name: 'Snivy' },
    { num: 643, name: 'Reshiram' },
    { num: 658, name: 'Greninja' },
    { num: 778, name: 'Mimikyu' },
  ];

  console.log('=== Flavor Text Validation ===\n');

  const results = [];
  let errors = 0;
  let warnings = 0;

  for (let i = 0; i < samplePokemon.length; i++) {
    if (i > 0) await sleep(100);

    const pokemon = samplePokemon[i];
    try {
      const data = await httpsGet(`https://pokeapi.co/api/v2/pokemon-species/${pokemon.num}/`);
      const englishEntries = (data.flavor_text_entries || []).filter((e) => e.language?.name === 'en');
      const firstEntry = englishEntries.length > 0 ? englishEntries[0].flavor_text?.replace(/\s+/g, ' ').substring(0, 60) : '';

      if (englishEntries.length === 0) {
        console.log(`✗ ${pokemon.name.padEnd(15)} (#${String(pokemon.num).padStart(3, '0')}): 0 English entries — ERROR`);
        errors++;
      } else {
        console.log(`✓ ${pokemon.name.padEnd(15)} (#${String(pokemon.num).padStart(3, '0')}): ${englishEntries.length} English entries — "${firstEntry}..."`);
      }

      results.push({
        name: pokemon.name,
        num: pokemon.num,
        count: englishEntries.length,
        sample: firstEntry,
      });
    } catch (error) {
      console.log(`✗ ${pokemon.name.padEnd(15)} (#${String(pokemon.num).padStart(3, '0')}): ERROR — ${error.message}`);
      errors++;
    }
  }

  console.log(`\nERRORS: ${errors}  WARNINGS: ${warnings}\n`);
  return { errors, warnings };
}

async function validateEvolutionChains() {
  const sampleChains = [1, 2, 3, 10, 66, 67, 140, 196, 230, 351, 400, 401, 406, 459, 476];

  console.log('=== Evolution Chain Validation ===\n');

  let errors = 0;
  let warnings = 0;
  const results = [];

  for (let i = 0; i < sampleChains.length; i++) {
    if (i > 0) await sleep(100);

    const chainId = sampleChains[i];
    try {
      const data = await httpsGet(`https://pokeapi.co/api/v2/evolution-chain/${chainId}/`);
      const steps = parseEvolutionSteps(data.chain, []);

      for (const step of steps) {
        if (!step.trigger) {
          console.log(`✗ Chain ${chainId}: ${step.from} → ${step.to} — NO TRIGGER — ERROR`);
          errors++;
        } else if (
          step.trigger === 'level-up' &&
          step.minLevel === null &&
          step.minHappiness === null &&
          step.timeOfDay === null
        ) {
          console.log(`⚠ Chain ${chainId}: ${step.from} → ${step.to} (level-up, no condition) — WARNING`);
          warnings++;
        } else {
          const condition = step.minLevel
            ? `Lv.${step.minLevel}`
            : step.item
            ? step.item
            : step.minHappiness
            ? 'friendship'
            : step.timeOfDay || '';
          console.log(`✓ Chain ${chainId}: ${step.from} → ${step.to} (${step.trigger}, ${condition})`);
        }
      }

      results.push({ chainId, stepCount: steps.length });
    } catch (error) {
      console.log(`✗ Chain ${chainId}: ERROR — ${error.message}`);
      errors++;
    }
  }

  console.log(`\nERRORS: ${errors}  WARNINGS: ${warnings}\n`);
  return { errors, warnings };
}

function parseEvolutionSteps(chain, steps) {
  if (!chain.species?.name) return steps;

  const from = chain.species.name;

  if (chain.evolves_to && chain.evolves_to.length > 0) {
    for (const evo of chain.evolves_to) {
      const to = evo.species?.name || 'Unknown';
      const details = evo.evolution_details?.[0];

      steps.push({
        from,
        to,
        trigger: details?.trigger?.name || null,
        minLevel: details?.min_level || null,
        item: details?.item?.name || details?.held_item?.name || null,
        knownMove: details?.known_move?.name || null,
        minHappiness: details?.min_happiness || null,
        timeOfDay: details?.time_of_day || null,
      });

      parseEvolutionSteps(evo, steps);
    }
  }

  return steps;
}

async function main() {
  try {
    console.log('🔍 Validating seed data against PokeAPI...\n');

    const flavorResults = await validateFlavorText();
    const evolutionResults = await validateEvolutionChains();

    const totalErrors = flavorResults.errors + evolutionResults.errors;
    const totalWarnings = flavorResults.warnings + evolutionResults.warnings;

    console.log(`📊 TOTAL: ${totalErrors} ERRORS, ${totalWarnings} WARNINGS\n`);

    if (totalErrors > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  }
}

main();
