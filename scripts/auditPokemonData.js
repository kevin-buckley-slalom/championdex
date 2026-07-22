#!/usr/bin/env node

/**
 * Pokemon Data Completeness Audit
 *
 * Produces a comprehensive audit of every Pokemon form in the database,
 * identifying missing data fields and inferring reasons based on form type
 * and other characteristics.
 *
 * Usage: node scripts/auditPokemonData.js
 * Output:
 *   - stdout: Text summary and statistics
 *   - scripts/output/pokemon_data_audit.json: Detailed JSON report
 */

'use strict';

const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

// ============================================================================
// CONSTANTS AND SETUP
// ============================================================================

const DB_PATH = path.join(__dirname, '../assets/db/championdex.db');
const OUTPUT_DIR = path.join(__dirname, 'output');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'pokemon_data_audit.json');

// Single-stage Pokemon that shouldn't have evolution data
// (Only include truly obvious single-stage; don't try to enumerate all)
const KNOWN_SINGLE_STAGE = new Set([
  1, // Bulbasaur (wait, this evolves)
  4, // Charmander (this evolves)
  7, // Squirtle (this evolves)
]);

// ============================================================================
// MAIN AUDIT CLASS
// ============================================================================

class PokemonDataAuditor {
  constructor(dbPath) {
    this.db = new Database(dbPath, { readonly: true });
    this.forms = [];
    this.issuesByCategory = {
      stats: 0,
      height_weight: 0,
      species_classification: 0,
      gender_rate: 0,
      abilities: 0,
      moves: 0,
      pokedex_entries: 0,
      encounter_locations: 0,
      evolution_chain: 0,
      pokeapi_id: 0,
    };

    // Build set of default-form Gen 1–8 non-legendary/non-mythical Pokemon with zero encounters
    // These are known-clean entries: evolution-only, fossil-revival, starters, gifts.
    this.knownNoEncounterDex = new Set(
      this.db.prepare(`
        SELECT national_dex FROM pokemon
        WHERE form_type = 'default'
          AND generation < 9
          AND is_legendary = 0
          AND is_mythical = 0
          AND NOT EXISTS (
            SELECT 1 FROM pokemon_encounter_locations el
            WHERE el.pokemon_id = pokemon.id
          )
      `).all().map(r => r.national_dex)
    );
  }

  /**
   * Load all Pokemon forms from the database
   */
  loadAllForms() {
    const query = `
      SELECT
        id, national_dex, pokeapi_id, name, display_name,
        form_type, form_name,
        primary_type, secondary_type,
        hp, attack, defense, special_attack, special_defense, speed,
        height, weight,
        generation,
        is_legendary, is_mythical,
        gender_rate,
        species_classification
      FROM pokemon
      ORDER BY national_dex ASC, id ASC
    `;
    return this.db.prepare(query).all();
  }

  /**
   * Check if a pokemon has abilities
   */
  hasPokemonAbilities(pokemonId) {
    const result = this.db.prepare(
      'SELECT COUNT(*) as c FROM pokemon_abilities WHERE pokemon_id = ?'
    ).get(pokemonId);
    return result.c > 0;
  }

  /**
   * Check if a pokemon has moves
   */
  hasPokemonMoves(pokemonId) {
    const result = this.db.prepare(
      'SELECT COUNT(*) as c FROM pokemon_moves WHERE pokemon_id = ?'
    ).get(pokemonId);
    return result.c > 0;
  }

  /**
   * Check if a pokemon has pokedex entries
   */
  hasPokemonFlavorText(pokemonId) {
    const result = this.db.prepare(
      'SELECT COUNT(*) as c FROM pokemon_flavor_text WHERE pokemon_id = ?'
    ).get(pokemonId);
    return result.c > 0;
  }

  /**
   * Check if a pokemon has encounter locations
   */
  hasPokemonEncounters(pokemonId) {
    const result = this.db.prepare(
      'SELECT COUNT(*) as c FROM pokemon_encounter_locations WHERE pokemon_id = ?'
    ).get(pokemonId);
    return result.c > 0;
  }

  /**
   * Check if a pokemon appears in evolution chain
   */
  appearsInEvolutionChain(pokemonId) {
    const result = this.db.prepare(
      'SELECT COUNT(*) as c FROM pokemon_evolutions WHERE pokemon_id = ? OR evolves_to_id = ?'
    ).get(pokemonId, pokemonId);
    return result.c > 0;
  }

  /**
   * Generate reason(s) for a missing field based on form type and context
   *
   * NOTE: is_legendary on alternate/regional forms may not be set correctly in the DB,
   * as it's inherited from the species row, not set per-form. For example, Kyogre-Primal
   * may show is_legendary=0 even though Kyogre is legendary.
   */
  generateReason(pokemon, fieldName) {
    const reasons = [];
    const formType = pokemon.form_type;
    const generation = pokemon.generation;
    const isLegendaryOrMythical = pokemon.is_legendary === 1 || pokemon.is_mythical === 1;
    const hasPokeApiId = pokemon.pokeapi_id !== 0;
    const pokemonName = pokemon.name.toLowerCase();

    // Rule: Mega evolutions - moves
    if (fieldName === 'moves' && formType === 'mega') {
      reasons.push('Mega evolutions share move pool with base form; PokeAPI does not provide separate move data for megas');
    }

    // Rule: Mega evolutions - pokedex_entries and encounter_locations
    if (fieldName === 'pokedex_entries' && formType === 'mega') {
      reasons.push('Mega evolutions inherit species data from base form; PokeAPI does not provide separate flavor text or encounter data for megas');
    }
    if (fieldName === 'encounter_locations' && formType === 'mega') {
      reasons.push('Mega evolutions inherit species data from base form; PokeAPI does not provide separate flavor text or encounter data for megas');
    }

    // Rule: Gigantamax forms - moves
    if (fieldName === 'moves' && formType === 'gigantamax') {
      reasons.push('Gigantamax forms share move pool with base form');
    }

    // Rule: Gigantamax forms - pokedex_entries and encounter_locations
    if (fieldName === 'pokedex_entries' && formType === 'gigantamax') {
      reasons.push('Gigantamax forms share species data with base; no separate PokeAPI species entry');
    }
    if (fieldName === 'encounter_locations' && formType === 'gigantamax') {
      reasons.push('Gigantamax forms share species data with base; no separate PokeAPI species entry');
    }

    // Rule: Regional forms - moves
    if (fieldName === 'moves' && formType === 'regional') {
      reasons.push('Regional form — move data may need enrichment');
    }

    // Rule: Regional forms - pokedex_entries and encounter_locations
    if (fieldName === 'pokedex_entries' && formType === 'regional') {
      reasons.push('Regional form — may have separate PokeAPI species entry; data may need enrichment');
    }
    if (fieldName === 'encounter_locations' && formType === 'regional') {
      reasons.push('Regional form — may have separate PokeAPI species entry; data may need enrichment');
    }

    // Rule: Alternate forms - moves
    if (fieldName === 'moves' && formType === 'alternate') {
      reasons.push('Alternate form — move data may not be seeded separately');
    }

    // Rule: Alternate forms - pokedex_entries and encounter_locations
    if (fieldName === 'pokedex_entries' && formType === 'alternate') {
      reasons.push('Alternate form — PokeAPI species data is on base form; this form may lack independent entries');
    }
    if (fieldName === 'encounter_locations' && formType === 'alternate') {
      reasons.push('Alternate form — PokeAPI species data is on base form; this form may lack independent entries');
    }

    // Rule: Cosmetic forms - all fields
    if (formType === 'cosmetic' && fieldName !== 'evolution_chain') {
      if (fieldName === 'moves') {
        reasons.push('Cosmetic form — no independent move data expected');
      } else {
        reasons.push('Cosmetic form — no independent data expected');
      }
    }

    // Rule: Gen 9+ missing encounters
    if (fieldName === 'encounter_locations' && generation >= 9) {
      reasons.push('Gen 9 encounter data not yet in PokeAPI');
    }

    // Rule: Legendaries/mythicals with missing encounters
    if (fieldName === 'encounter_locations' && isLegendaryOrMythical) {
      reasons.push('Legendaries/mythicals typically have no wild encounter data');
    }

    // Rule: Known-clean default forms Gen 1–8 with no encounters
    if (fieldName === 'encounter_locations' && pokemon.form_type === 'default'
        && pokemon.generation < 9 && !isLegendaryOrMythical
        && this.knownNoEncounterDex.has(pokemon.national_dex)) {
      reasons.push('No wild encounter data — obtained via evolution, fossil revival, or as a starter/gift Pokémon');
    }

    // Rule: pokeapi_id = 0
    if (fieldName === 'pokeapi_id' && pokemon.pokeapi_id === 0) {
      reasons.push('pokeapi_id is 0 — PokeAPI data was never fetched for this form');
    }

    // Rule: Missing abilities and non-default forms
    if (fieldName === 'abilities' && ['mega', 'gigantamax', 'alternate', 'regional'].includes(formType)) {
      reasons.push('Non-default form — abilities may not be seeded separately; check enrichment pipeline');
    }

    // Rule: Missing evolution chain for non-default forms
    if (fieldName === 'evolution_chain' && ['mega', 'gigantamax', 'alternate', 'regional', 'cosmetic'].includes(formType)) {
      reasons.push('Non-default forms do not have independent evolution chain entries; evolution is tracked on the base form');
    }

    // Rule: Missing moves for Z-A megas (without hyphen in name)
    // Check for form_type === 'mega' AND name includes 'mega' to catch all megas regardless of hyphen
    if (fieldName === 'moves' && formType === 'mega' && pokemonName.includes('mega')) {
      reasons.push('Z-A mega forms receive moves via za_forms_enrichment_v1 backfill; may not have run yet or PokeAPI has no move data');
    }

    // Default reason
    if (reasons.length === 0) {
      reasons.push('Unknown — needs investigation');
    }

    return reasons;
  }

  /**
   * Audit a single pokemon form
   */
  auditForm(pokemon) {
    const missing = [];

    // 1. Check stats (any stat is 0)
    if (pokemon.hp === 0 || pokemon.attack === 0 || pokemon.defense === 0 ||
        pokemon.special_attack === 0 || pokemon.special_defense === 0 || pokemon.speed === 0) {
      missing.push({
        field: 'stats',
        reason: this.generateReason(pokemon, 'stats').join('; '),
      });
      this.issuesByCategory.stats++;
    }

    // 2. Check height/weight
    if (pokemon.height === null || pokemon.weight === null) {
      missing.push({
        field: 'height_weight',
        reason: this.generateReason(pokemon, 'height_weight').join('; '),
      });
      this.issuesByCategory.height_weight++;
    }

    // 3. Check species classification
    if (!pokemon.species_classification || pokemon.species_classification.trim() === '') {
      missing.push({
        field: 'species_classification',
        reason: this.generateReason(pokemon, 'species_classification').join('; '),
      });
      this.issuesByCategory.species_classification++;
    }

    // 4. Check gender rate (null is missing; -1 is valid "genderless")
    if (pokemon.gender_rate === null) {
      missing.push({
        field: 'gender_rate',
        reason: this.generateReason(pokemon, 'gender_rate').join('; '),
      });
      this.issuesByCategory.gender_rate++;
    }

    // 5. Check abilities
    if (!this.hasPokemonAbilities(pokemon.id)) {
      missing.push({
        field: 'abilities',
        reason: this.generateReason(pokemon, 'abilities').join('; '),
      });
      this.issuesByCategory.abilities++;
    }

    // 6. Check moves
    if (!this.hasPokemonMoves(pokemon.id)) {
      missing.push({
        field: 'moves',
        reason: this.generateReason(pokemon, 'moves').join('; '),
      });
      this.issuesByCategory.moves++;
    }

    // 7. Check pokedex entries (flavor text)
    if (!this.hasPokemonFlavorText(pokemon.id)) {
      missing.push({
        field: 'pokedex_entries',
        reason: this.generateReason(pokemon, 'pokedex_entries').join('; '),
      });
      this.issuesByCategory.pokedex_entries++;
    }

    // 8. Check encounter locations
    if (!this.hasPokemonEncounters(pokemon.id)) {
      // Skip if this is a known-clean default form (evolution-only, fossil, starter, etc.)
      const isKnownClean = pokemon.form_type === 'default'
        && pokemon.generation < 9
        && pokemon.is_legendary === 0
        && pokemon.is_mythical === 0
        && this.knownNoEncounterDex.has(pokemon.national_dex);

      if (!isKnownClean) {
        missing.push({
          field: 'encounter_locations',
          reason: this.generateReason(pokemon, 'encounter_locations').join('; '),
        });
        this.issuesByCategory.encounter_locations++;
      }
    }

    // 9. Check evolution chain
    if (!this.appearsInEvolutionChain(pokemon.id) &&
        pokemon.is_legendary === 0 && pokemon.is_mythical === 0 &&
        !KNOWN_SINGLE_STAGE.has(pokemon.national_dex)) {
      missing.push({
        field: 'evolution_chain',
        reason: this.generateReason(pokemon, 'evolution_chain').join('; '),
      });
      this.issuesByCategory.evolution_chain++;
    }

    // 10. Check pokeapi_id
    if (pokemon.pokeapi_id === 0) {
      missing.push({
        field: 'pokeapi_id',
        reason: this.generateReason(pokemon, 'pokeapi_id').join('; '),
      });
      this.issuesByCategory.pokeapi_id++;
    }

    return missing;
  }

  /**
   * Run the full audit
   */
  run() {
    console.log('[PokemonDataAuditor] Starting audit...\n');

    const allForms = this.loadAllForms();
    console.log(`[PokemonDataAuditor] Loaded ${allForms.length} forms from database.\n`);

    const formsWithIssues = [];

    for (const form of allForms) {
      const missing = this.auditForm(form);

      if (missing.length > 0) {
        formsWithIssues.push({
          id: form.id,
          national_dex: form.national_dex,
          name: form.name,
          display_name: form.display_name,
          form_type: form.form_type,
          generation: form.generation,
          is_legendary: form.is_legendary,
          is_mythical: form.is_mythical,
          missing,
        });
      }
    }

    // Sort by national_dex ASC, then id ASC
    formsWithIssues.sort((a, b) => {
      if (a.national_dex !== b.national_dex) {
        return a.national_dex - b.national_dex;
      }
      return a.id - b.id;
    });

    // Count forms by form_type with issues
    const formTypeStats = {};
    for (const form of allForms) {
      const formType = form.form_type;
      if (!formTypeStats[formType]) {
        formTypeStats[formType] = { total: 0, withIssues: 0 };
      }
      formTypeStats[formType].total++;
    }

    for (const form of formsWithIssues) {
      formTypeStats[form.form_type].withIssues++;
    }

    // Find all forms with pokeapi_id = 0
    const formsWithoutPokeApiId = formsWithIssues.filter(f =>
      f.missing.some(m => m.field === 'pokeapi_id')
    );

    return {
      timestamp: new Date().toISOString(),
      dbPath: DB_PATH,
      totalForms: allForms.length,
      formsWithIssues: formsWithIssues.length,
      formsClean: allForms.length - formsWithIssues.length,
      issuesByCategory: this.issuesByCategory,
      formTypeStats,
      formsWithoutPokeApiId: formsWithoutPokeApiId.map(f => ({
        id: f.id,
        national_dex: f.national_dex,
        name: f.name,
        display_name: f.display_name,
      })),
      forms: formsWithIssues,
    };
  }

  close() {
    this.db.close();
  }
}

// ============================================================================
// OUTPUT FUNCTIONS
// ============================================================================

function formatStdoutSummary(auditResult) {
  const lines = [];

  lines.push('\n' + '='.repeat(80));
  lines.push('POKEMON DATA COMPLETENESS AUDIT');
  lines.push('='.repeat(80));
  lines.push('');

  lines.push(`Generated: ${auditResult.timestamp}`);
  lines.push(`Database: ${auditResult.dbPath}`);
  lines.push('');

  lines.push(`Total forms in database: ${auditResult.totalForms}`);
  lines.push(`Forms with data issues: ${auditResult.formsWithIssues}`);
  lines.push(`Forms with complete data: ${auditResult.formsClean}`);
  lines.push('');

  lines.push('ISSUES BY CATEGORY:');
  lines.push('-'.repeat(50));
  for (const [category, count] of Object.entries(auditResult.issuesByCategory)) {
    if (count > 0) {
      lines.push(`  ${category.padEnd(30)}: ${count} forms affected`);
    }
  }
  lines.push('');

  lines.push('FORMS WITH ISSUES BY TYPE:');
  lines.push('-'.repeat(50));
  const typeStats = auditResult.formTypeStats;
  for (const formType of Object.keys(typeStats).sort()) {
    const { total, withIssues } = typeStats[formType];
    const pct = total > 0 ? ((withIssues / total) * 100).toFixed(1) : '0.0';
    lines.push(
      `  ${formType.padEnd(20)}: ${withIssues.toString().padStart(4)} / ${total.toString().padStart(4)} ` +
      `(${pct.padStart(5)}% have issues)`
    );
  }
  lines.push('');

  if (auditResult.formsWithoutPokeApiId.length > 0) {
    lines.push('FORMS WITH pokeapi_id = 0:');
    lines.push('-'.repeat(50));
    for (const form of auditResult.formsWithoutPokeApiId.slice(0, 20)) {
      lines.push(
        `  ${form.national_dex.toString().padStart(3)}: ` +
        `${form.display_name.padEnd(40)} (${form.name})`
      );
    }
    if (auditResult.formsWithoutPokeApiId.length > 20) {
      lines.push(`  ... and ${auditResult.formsWithoutPokeApiId.length - 20} more`);
    }
    lines.push('');
  }

  lines.push('='.repeat(80));

  return lines.join('\n');
}

function writeJsonReport(auditResult, outputFile) {
  const jsonData = {
    generated: auditResult.timestamp,
    db_path: auditResult.dbPath,
    total_forms: auditResult.totalForms,
    forms_with_issues: auditResult.formsWithIssues,
    forms_clean: auditResult.formsClean,
    issues_by_category: auditResult.issuesByCategory,
    forms: auditResult.forms,
  };

  fs.writeFileSync(outputFile, JSON.stringify(jsonData, null, 2));
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  try {
    // Create output directory
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Run audit
    const auditor = new PokemonDataAuditor(DB_PATH);
    const result = auditor.run();
    auditor.close();

    // Write JSON report
    writeJsonReport(result, OUTPUT_FILE);
    console.log(`[Output] JSON report written to: ${OUTPUT_FILE}\n`);

    // Print stdout summary
    const summary = formatStdoutSummary(result);
    console.log(summary);

    console.log(`\n✓ Audit complete!\n`);
    process.exit(0);
  } catch (error) {
    console.error('✗ Audit failed:', error);
    process.exit(1);
  }
}

main();
