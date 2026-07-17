import { importDatabaseFromAssetAsync } from 'expo-sqlite';

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
