#!/usr/bin/env node

/**
 * Verify bundled database integrity and schema.
 * Run: node scripts/verifyBundledDb.js
 * Exit code: 0 on success, 1 on failure
 */

'use strict';

const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, '../assets/db/championdex.db');
const EXPECTED_DATA_VERSION = '1.10.0';

function logCheck(passed, title, details = '') {
  const icon = passed ? '✓' : '✗';
  const status = passed ? 'PASS' : 'FAIL';
  console.log(`  ${icon} ${status}: ${title}${details ? ' — ' + details : ''}`);
  return passed;
}

async function main() {
  console.log('[VerifyBundledDb] Starting verification...\n');

  let allPassed = true;

  // ── Check: DB opens without error ─────────────────────────────────────────
  let db = null;
  try {
    db = new Database(DB_PATH, { readonly: true });
    console.log('1. Database File Check');
    logCheck(true, 'DB file opens successfully');
  } catch (error) {
    console.log('1. Database File Check');
    logCheck(false, 'DB file opens successfully', error.message);
    return process.exit(1);
  }

  try {
    // ── Check: integrity_check ────────────────────────────────────────────────
    console.log('\n2. Database Integrity Check');
    const integrityResult = db.pragma('integrity_check');
    const isHealthy = integrityResult[0]?.integrity_check === 'ok';
    logCheck(isHealthy, 'integrity_check returns ok', `result: ${integrityResult[0]?.integrity_check || 'unknown'}`);
    allPassed = allPassed && isHealthy;

    // ── Check: pokemon_moves has version_group column ───────────────────────
    console.log('\n3. Schema Verification');
    const tableInfo = db.pragma('table_info(pokemon_moves)');
    const hasVersionGroupColumn = tableInfo.some(col => col.name === 'version_group');
    logCheck(hasVersionGroupColumn, 'pokemon_moves table has version_group column');
    allPassed = allPassed && hasVersionGroupColumn;

    // ── Check: Row counts are in expected ranges ─────────────────────────────
    console.log('\n4. Row Counts');
    const pokemonCount = db.prepare('SELECT COUNT(*) as c FROM pokemon').get().c;
    const movesCount = db.prepare('SELECT COUNT(*) as c FROM pokemon_moves').get().c;
    const versionGroupDistinctCount = db.prepare("SELECT COUNT(DISTINCT version_group) as c FROM pokemon_moves WHERE version_group != ''").get().c;

    logCheck(pokemonCount === 1296, 'Pokemon count = 1296', `got ${pokemonCount}`);
    logCheck(movesCount >= 500000, 'Pokemon moves count >= 500000', `got ${movesCount}`);
    logCheck(versionGroupDistinctCount >= 25, 'Distinct version_groups >= 25', `got ${versionGroupDistinctCount}`);

    allPassed = allPassed && pokemonCount === 1296 && movesCount >= 500000 && versionGroupDistinctCount >= 25;

    // ── Check: data_version matches expected value ────────────────────────────
    console.log('\n5. Metadata Verification');
    const dataVersionRow = db.prepare("SELECT value FROM sync_metadata WHERE key='data_version'").get();
    const dataVersion = dataVersionRow?.value;
    const versionMatches = dataVersion === EXPECTED_DATA_VERSION;
    logCheck(versionMatches, `data_version = ${EXPECTED_DATA_VERSION}`, `got ${dataVersion || 'not found'}`);
    allPassed = allPassed && versionMatches;

    // ── Check: Pikachu (national_dex=25) has moves with non-empty version_group ─
    console.log('\n6. Data Consistency');
    const pikachuRow = db.prepare("SELECT id FROM pokemon WHERE national_dex = 25 AND form_type = 'default'").get();
    if (!pikachuRow) {
      logCheck(false, 'Pikachu (national_dex=25) exists in database');
      allPassed = false;
    } else {
      const pikachuId = pikachuRow.id;
      const movesWithVersionGroup = db.prepare(
        "SELECT COUNT(*) as c FROM pokemon_moves WHERE pokemon_id = ? AND version_group != ''"
      ).get(pikachuId).c;

      logCheck(movesWithVersionGroup > 0, 'Pikachu has moves with non-empty version_group', `got ${movesWithVersionGroup} moves`);
      allPassed = allPassed && movesWithVersionGroup > 0;
    }

    // ── Check: Other important metadata keys are marked done ──────────────────
    console.log('\n7. Enrichment Gate Keys');
    const requiredGates = [
      'moves_dex_v1',
      'moves_dex_migration_v1',
      'pokeapi_enrich_version',
      'encounters_backfill_v1',
      'za_forms_enrichment_v1',
    ];

    for (const gateKey of requiredGates) {
      const row = db.prepare('SELECT value FROM sync_metadata WHERE key = ?').get(gateKey);
      logCheck(row && row.value, `Gate key '${gateKey}' is set`, `value: ${row?.value || 'missing'}`);
      allPassed = allPassed && (row && row.value);
    }

    // ── Print summary ────────────────────────────────────────────────────────
    console.log('\n8. Database Statistics');
    const stats = {
      pokemon: pokemonCount,
      pokemon_moves: movesCount,
      version_group_distinct: versionGroupDistinctCount,
      abilities: db.prepare('SELECT COUNT(*) as c FROM abilities').get().c,
      moves: db.prepare('SELECT COUNT(*) as c FROM moves').get().c,
      items: db.prepare('SELECT COUNT(*) as c FROM items').get().c,
      pokemon_abilities: db.prepare('SELECT COUNT(*) as c FROM pokemon_abilities').get().c,
      flavor_text: db.prepare('SELECT COUNT(*) as c FROM pokemon_flavor_text').get().c,
      evolutions: db.prepare('SELECT COUNT(*) as c FROM pokemon_evolutions').get().c,
      encounters: db.prepare('SELECT COUNT(*) as c FROM pokemon_encounter_locations').get().c,
    };

    for (const [table, count] of Object.entries(stats)) {
      console.log(`  ${table}: ${count}`);
    }

  } finally {
    db.close();
  }

  // ── Exit with appropriate code ───────────────────────────────────────────
  console.log(`\n[VerifyBundledDb] Verification ${allPassed ? 'PASSED' : 'FAILED'}`);
  process.exit(allPassed ? 0 : 1);
}

main().catch(err => {
  console.error('[VerifyBundledDb] Fatal error:', err);
  process.exit(1);
});
