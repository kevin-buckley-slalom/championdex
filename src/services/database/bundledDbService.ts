import { importDatabaseFromAssetAsync, deleteDatabaseAsync } from 'expo-sqlite';

export async function copyBundledDbIfNeeded(): Promise<void> {
  try {
    // Use forceOverwrite: false to preserve user data (teams) on existing installations.
    // Only import if the file doesn't exist yet.
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

export async function overwriteBundledDb(): Promise<void> {
  try {
    // deleteDatabaseAsync removes the main file AND all WAL/SHM files atomically.
    // This prevents stale WAL replay corruption after the re-import.
    await deleteDatabaseAsync('championdex.db');
    console.log('[Database] Deleted corrupted database files');
  } catch (error) {
    // File may not exist on first run — safe to ignore, but log it
    console.log('[Database] No existing database to delete:', error instanceof Error ? error.message : String(error));
  }

  try {
    // Force overwrite to ensure a fresh, valid import from the bundled asset.
    // This is critical on Android where partial imports can leave corrupted files.
    // The combination of deleteDatabaseAsync + forceOverwrite: true ensures atomicity.
    await importDatabaseFromAssetAsync(
      'championdex.db',
      {
        assetId: require('../../../assets/db/championdex.db'),
        forceOverwrite: true,
      },
      undefined
    );
    console.log('[Database] Bundled DB replaced successfully');
  } catch (error) {
    console.error('[Database] Failed to replace bundled DB:', error);
    throw error;
  }
}
