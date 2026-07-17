#!/usr/bin/env node

/**
 * Test that the app's database code works with the bundled DB.
 * This simulates what the app does during initialization and query execution.
 * Run: node scripts/testAppDatabaseIntegration.js
 * Exit code: 0 on success, 1 on failure
 */

'use strict';

const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = path.join(__dirname, '../assets/db/championdex.db');
const EXPECTED_DATA_VERSION = '1.10.0';

function test(title, fn) {
  try {
    const result = fn();
    console.log(`  ✓ ${title}`);
    return true;
  } catch (error) {
    console.log(`  ✗ ${title}: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('[TestAppDatabaseIntegration] Starting...\n');

  let allPassed = true;

  // Open DB
  let db = null;
  try {
    db = new Database(DB_PATH, { readonly: true });
  } catch (error) {
    console.log(`✗ FATAL: Could not open database: ${error.message}`);
    return process.exit(1);
  }

  try {
    // ── Test 1: Database integrity and metadata ───────────────────────────────
    console.log('1. Database Metadata');
    allPassed = test('DB opens without errors', () => {
      db.prepare('SELECT 1').get();
      return true;
    }) && allPassed;

    allPassed = test('integrity_check passes', () => {
      const result = db.pragma('integrity_check');
      if (result[0]?.integrity_check !== 'ok') {
        throw new Error(`integrity_check failed: ${result[0]?.integrity_check}`);
      }
      return true;
    }) && allPassed;

    allPassed = test('data_version is correctly set to 1.10.0', () => {
      const row = db.prepare("SELECT value FROM sync_metadata WHERE key='data_version'").get();
      if (row?.value !== EXPECTED_DATA_VERSION) {
        throw new Error(`Expected ${EXPECTED_DATA_VERSION}, got ${row?.value}`);
      }
      return true;
    }) && allPassed;

    // ── Test 2: Simulate app's getPokemonMoveset query ───────────────────────
    console.log('\n2. App Query: getPokemonMoveset');
    allPassed = test('Query works for Pikachu', () => {
      // First get Pikachu's ID
      const pikachuRow = db.prepare("SELECT id FROM pokemon WHERE national_dex = 25 AND form_type = 'default'").get();
      if (!pikachuRow) throw new Error('Pikachu not found');

      // Query moveset (matches app code in pokemonRepository.ts)
      const results = db.prepare(`
        SELECT
          m.id, m.name, m.display_name, m.type, m.category, m.power, m.accuracy, m.pp,
          pm.learn_method, pm.learn_level, pm.version_group
        FROM pokemon_moves pm
        JOIN moves m ON pm.move_id = m.id
        WHERE pm.pokemon_id = ?
        ORDER BY pm.learn_method, pm.learn_level ASC, m.display_name ASC
      `).all(pikachuRow.id);

      if (!Array.isArray(results) || results.length === 0) {
        throw new Error('No movesets found for Pikachu');
      }

      // Verify move structure matches DB columns
      for (const move of results) {
        if (!move.id || !move.name || !move.display_name || typeof move.version_group === 'undefined') {
          throw new Error(`Move ${move.name} missing required fields`);
        }
      }

      return true;
    }) && allPassed;

    allPassed = test('version_group field is properly populated', () => {
      const pikachuRow = db.prepare("SELECT id FROM pokemon WHERE national_dex = 25 AND form_type = 'default'").get();
      const result = db.prepare(`
        SELECT COUNT(*) as c FROM pokemon_moves
        WHERE pokemon_id = ? AND version_group IS NOT NULL
      `).get(pikachuRow.id);

      if (result.c === 0) {
        throw new Error('No moves have version_group populated');
      }
      return true;
    }) && allPassed;

    // ── Test 3: Simulate app's getPokemonMovesetVersions query ──────────────────
    console.log('\n3. App Query: getPokemonMovesetVersions');
    allPassed = test('Query returns distinct version_groups', () => {
      const pikachuRow = db.prepare("SELECT id FROM pokemon WHERE national_dex = 25 AND form_type = 'default'").get();
      const results = db.prepare(`
        SELECT DISTINCT version_group FROM pokemon_moves
        WHERE pokemon_id = ? AND version_group != ''
        ORDER BY version_group ASC
      `).all(pikachuRow.id);

      if (!Array.isArray(results) || results.length === 0) {
        throw new Error('No version_groups found for Pikachu');
      }

      return true;
    }) && allPassed;

    // ── Test 4: Verify pokemon table structure ────────────────────────────────
    console.log('\n4. Pokemon Table Structure');
    allPassed = test('All required columns exist', () => {
      const columns = db.pragma('table_info(pokemon)');
      const requiredColumns = [
        'id', 'national_dex', 'pokeapi_id', 'name', 'display_name', 'form_type',
        'primary_type', 'secondary_type', 'hp', 'attack', 'defense',
        'special_attack', 'special_defense', 'speed'
      ];

      const columnNames = new Set(columns.map(c => c.name));
      for (const col of requiredColumns) {
        if (!columnNames.has(col)) {
          throw new Error(`Missing column: ${col}`);
        }
      }
      return true;
    }) && allPassed;

    // ── Test 5: Verify moves table structure ──────────────────────────────────
    console.log('\n5. Moves Table Structure');
    allPassed = test('All required columns exist', () => {
      const columns = db.pragma('table_info(moves)');
      const requiredColumns = [
        'id', 'name', 'display_name', 'type', 'category', 'power', 'accuracy', 'pp'
      ];

      const columnNames = new Set(columns.map(c => c.name));
      for (const col of requiredColumns) {
        if (!columnNames.has(col)) {
          throw new Error(`Missing column: ${col}`);
        }
      }
      return true;
    }) && allPassed;

    // ── Test 6: Verify pokemon_moves table structure ─────────────────────────
    console.log('\n6. Pokemon Moves Table Structure');
    allPassed = test('All required columns exist', () => {
      const columns = db.pragma('table_info(pokemon_moves)');
      const requiredColumns = ['pokemon_id', 'move_id', 'learn_method', 'learn_level', 'version_group'];

      const columnNames = new Set(columns.map(c => c.name));
      for (const col of requiredColumns) {
        if (!columnNames.has(col)) {
          throw new Error(`Missing column: ${col}`);
        }
      }
      return true;
    }) && allPassed;

    allPassed = test('Primary key allows version_group', () => {
      // The schema should allow different moves for the same pokemon+method with different version_groups
      const pikachuRow = db.prepare("SELECT id FROM pokemon WHERE national_dex = 25 AND form_type = 'default'").get();
      const duplicateMethods = db.prepare(`
        SELECT move_id, learn_method, COUNT(*) as cnt FROM pokemon_moves
        WHERE pokemon_id = ?
        GROUP BY move_id, learn_method
        HAVING cnt > 1
      `).all(pikachuRow.id);

      if (duplicateMethods.length === 0) {
        throw new Error('Expected moves with same move_id+learn_method but different version_groups');
      }
      return true;
    }) && allPassed;

    // ── Test 7: Simulate app's getPokemonById query ───────────────────────────
    console.log('\n7. App Query: getPokemonById');
    allPassed = test('Query returns complete pokemon data', () => {
      const result = db.prepare("SELECT * FROM pokemon WHERE national_dex = 25 AND form_type = 'default'").get();
      if (!result) throw new Error('Pikachu not found');
      if (!result.id || !result.name || !result.display_name) {
        throw new Error('Pikachu missing required fields');
      }
      return true;
    }) && allPassed;

    // ── Test 8: Verify sync_metadata keys are properly set ───────────────────
    console.log('\n8. Enrichment Gates');
    const requiredGates = [
      ['moves_dex_v1', 'done'],
      ['moves_dex_migration_v1', 'done'],
      ['encounters_backfill_v1', 'done'],
      ['za_forms_enrichment_v1', 'done'],
      ['pokeapi_enrich_version', '1.2.0'],
    ];

    for (const [key, expectedValue] of requiredGates) {
      allPassed = test(`Gate key '${key}' is set to '${expectedValue}'`, () => {
        const row = db.prepare('SELECT value FROM sync_metadata WHERE key = ?').get(key);
        if (!row || row.value !== expectedValue) {
          throw new Error(`Expected '${expectedValue}', got '${row?.value || 'not found'}'`);
        }
        return true;
      }) && allPassed;
    }

    // ── Test 9: Row count sanity checks ──────────────────────────────────────
    console.log('\n9. Data Sanity Checks');
    allPassed = test('Pokemon count is 1296', () => {
      const result = db.prepare('SELECT COUNT(*) as c FROM pokemon').get();
      if (result.c !== 1296) throw new Error(`Expected 1296, got ${result.c}`);
      return true;
    }) && allPassed;

    allPassed = test('Pokemon moves count is 500000+', () => {
      const result = db.prepare('SELECT COUNT(*) as c FROM pokemon_moves').get();
      if (result.c < 500000) throw new Error(`Expected 500000+, got ${result.c}`);
      return true;
    }) && allPassed;

    allPassed = test('Abilities count is reasonable', () => {
      const result = db.prepare('SELECT COUNT(*) as c FROM abilities').get();
      if (result.c < 300) throw new Error(`Expected 300+, got ${result.c}`);
      return true;
    }) && allPassed;

    allPassed = test('Moves count is reasonable', () => {
      const result = db.prepare('SELECT COUNT(*) as c FROM moves').get();
      if (result.c < 600) throw new Error(`Expected 600+, got ${result.c}`);
      return true;
    }) && allPassed;

  } finally {
    db.close();
  }

  console.log(`\n[TestAppDatabaseIntegration] ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
  process.exit(allPassed ? 0 : 1);
}

main().catch(err => {
  console.error('[TestAppDatabaseIntegration] Fatal error:', err);
  process.exit(1);
});
