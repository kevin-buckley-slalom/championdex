import { importDatabaseFromAssetAsync } from 'expo-sqlite';

/**
 * On fresh install, copies the bundled pre-built DB into the SQLite directory
 * using expo-sqlite's native asset import mechanism.
 *
 * Uses forceOverwrite: false so existing installs are untouched.
 * Must be called BEFORE openDatabaseAsync.
 *
 * This leverages importDatabaseFromAssetAsync which:
 * 1. Detects if the DB file already exists in the SQLite directory
 * 2. If not present, copies the bundled asset to the correct location
 * 3. Returns immediately on subsequent launches (no-op)
 *
 * This is the official, production-safe way to handle bundled databases.
 */
export async function copyBundledDbIfNeeded(): Promise<void> {
  try {
    await importDatabaseFromAssetAsync(
      'championdex.db',
      {
        assetId: require('../../../assets/db/championdex.db'),
        forceOverwrite: false,
      },
      undefined
    );
    console.log('[Database] Bundled DB imported successfully (or already exists)');
  } catch (error) {
    console.error('[Database] Failed to import bundled DB:', error);
    throw error;
  }
}
