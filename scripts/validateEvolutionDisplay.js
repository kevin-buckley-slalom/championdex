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

// Mirror of formatMethod in src/components/pokemon/EvolutionChain.tsx — keep in sync
function formatMethod(method, conditionValue) {
  if (method === 'level-up') return conditionValue ? `Lv. ${conditionValue}` : 'Level up';
  if (method === 'use-item') return conditionValue ? conditionValue : 'Item';
  if (method === 'trade') return 'Trade';
  if (method === 'shed') return 'Shed skin';
  if (conditionValue === 'friendship') return 'Friendship';
  if (method === 'spin') return 'Spin with Sweet';
  if (method === 'tower-of-darkness') return 'Tower of Darkness';
  if (method === 'tower-of-waters') return 'Tower of Waters';
  if (method === 'three-critical-hits') return '3 Critical Hits';
  if (method === 'take-damage') return 'Take 49+ Damage, Dusty Bowl Arch';
  // HARDCODED: PokeAPI returns trigger "other" + min_level for Tandemaus; 1% chance note is not data-driven
  if (method === 'other' && conditionValue) return `Lv. ${conditionValue} (1% three-member)`;
  if (method === 'agile-style-move') return conditionValue ? `Agile Style: ${conditionValue}` : 'Agile Style Move';
  // HARDCODED: PokeAPI only provides the move name for strong-style-move; Lv. 20 is not in the API response
  if (method === 'strong-style-move') return conditionValue ? `Lv. 20 w/ ${conditionValue}` : 'Strong Style Move';
  if (method === 'recoil-damage') return '294 Recoil Damage + Lv. Up';
  if (method === 'use-move') return conditionValue ? `Use ${conditionValue} ×20` : 'Use Move ×20';
  if (method === 'three-defeated-bisharp') return "Defeat 3 Leader's Crest Bisharp";
  if (method === 'gimmighoul-coins') return '999 Coins + Lv. Up';
  return conditionValue ?? 'Evolution';
}

async function validateEvolutionDisplay() {
  console.log('=== Evolution Display Validation ===\n');

  let errors = 0;
  let warnings = 0;

  try {
    let allTriggers = [];
    let page = 1;

    console.log('📥 Fetching evolution triggers from PokeAPI...\n');

    while (true) {
      const data = await httpsGet(`https://pokeapi.co/api/v2/evolution-trigger/?offset=${(page - 1) * 20}&limit=20`);
      if (data.results && data.results.length > 0) {
        allTriggers = allTriggers.concat(data.results);
        if (!data.next) break;
        page++;
        await sleep(100);
      } else {
        break;
      }
    }

    console.log(`Found ${allTriggers.length} evolution triggers\n`);

    const results = [];

    for (let i = 0; i < allTriggers.length; i++) {
      if (i > 0) await sleep(100);

      const trigger = allTriggers[i];
      let sampleChain = null;
      let sampleStep = null;

      const triggerData = await httpsGet(trigger.url);

      if (triggerData.pokemon_species && triggerData.pokemon_species.length > 0) {
        for (const species of triggerData.pokemon_species) {
          const speciesData = await httpsGet(species.url);
          if (speciesData.evolution_chain?.url) {
            const chainId = speciesData.evolution_chain.url.match(/\/evolution-chain\/(\d+)\//)?.[1];
            if (chainId) {
              const chainData = await httpsGet(`https://pokeapi.co/api/v2/evolution-chain/${chainId}/`);
              const steps = findStepsWithTrigger(chainData.chain, trigger.name);
              if (steps.length > 0) {
                sampleStep = steps[0];
                break;
              }
            }
          }
          await sleep(50);
        }
      }

      if (sampleStep) {
        const conditionValue = deriveConditionValue(sampleStep);
        const displayLabel = formatMethod(sampleStep.trigger, conditionValue);
        const isHandled = [
          'level-up', 'use-item', 'trade', 'shed', 'spin',
          'tower-of-darkness', 'tower-of-waters', 'three-critical-hits',
          'take-damage', 'other', 'agile-style-move', 'strong-style-move',
          'recoil-damage', 'use-move', 'three-defeated-bisharp', 'gimmighoul-coins',
        ].includes(sampleStep.trigger) || conditionValue === 'friendship';

        if (!isHandled) {
          console.log(`⚠ ${trigger.name.padEnd(25)} + ${String(conditionValue).padEnd(20)} → "${displayLabel}" — unhandled method`);
          warnings++;
        } else {
          console.log(`✓ ${trigger.name.padEnd(25)} + ${String(conditionValue).padEnd(20)} → "${displayLabel}"`);
        }

        results.push({
          trigger: trigger.name,
          conditionValue,
          displayLabel,
          isHandled,
        });
      } else {
        console.log(`⚠ ${trigger.name.padEnd(25)} — no sample chain found`);
        warnings++;
      }
    }

    console.log(`\nERRORS: ${errors}  WARNINGS: ${warnings}\n`);
    return { errors, warnings };
  } catch (error) {
    console.error('❌ Error during validation:', error);
    return { errors: 1, warnings: 0 };
  }
}

function findStepsWithTrigger(chain, triggerName) {
  const steps = [];

  if (!chain.species?.name) return steps;

  if (chain.evolves_to && chain.evolves_to.length > 0) {
    for (const evo of chain.evolves_to) {
      const details = evo.evolution_details?.[0];
      if (details?.trigger?.name === triggerName) {
        steps.push({
          from: chain.species.name,
          to: evo.species?.name || 'Unknown',
          trigger: triggerName,
          details,
        });
      }

      steps.push(...findStepsWithTrigger(evo, triggerName));
    }
  }

  return steps;
}

function deriveConditionValue(step) {
  const details = step.details;

  if (details.min_level) {
    return String(details.min_level);
  } else if (details.item?.name) {
    return details.item.name;
  } else if (details.held_item?.name) {
    return details.held_item.name;
  } else if (details.known_move?.name) {
    return details.known_move.name;
  } else if (details.min_happiness) {
    return 'friendship';
  } else if (details.time_of_day === 'day') {
    return 'day';
  } else if (details.time_of_day === 'night') {
    return 'night';
  } else if (details.used_move?.name) {
    return details.used_move.name;
  }

  return null;
}

async function main() {
  try {
    console.log('🔍 Validating evolution display logic against PokeAPI...\n');

    const results = await validateEvolutionDisplay();

    if (results.errors > 0) {
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
