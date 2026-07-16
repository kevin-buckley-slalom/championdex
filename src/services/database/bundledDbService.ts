import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';

const BUNDLED_DB_VERSION = '1.10.0'; // must match DATA_VERSION in seedDatabase.ts

/**
 * On fresh install, copies the bundled pre-built DB into the app's document directory.
 * Returns true if the copy was performed, false if DB already exists.
 *
 * IMPORTANT: Only call this BEFORE openDatabaseAsync — the file must exist before expo-sqlite opens it.
 */
export async function copyBundledDbIfNeeded(): Promise<boolean> {
  // Use the deprecated documentDirectory for now as fallback for SDK 57 compatibility
  // When available, migrate to: const docDir = await FileSystem.Paths.document.getDirectoryAsync();
  let dbDir: string;
  try {
    const docPath = (FileSystem as any).documentDirectory;
    if (docPath) {
      dbDir = `${docPath}SQLite/`;
    } else {
      // Fallback: use a relative path approach
      return false;
    }
  } catch {
    return false;
  }

  const dbPath = `${dbDir}championdex.db`;

  // Check if DB already exists
  try {
    const info = await FileSystem.getInfoAsync(dbPath);
    if (info.exists) {
      return false; // existing install, let seedDatabase handle any version bumps
    }
  } catch {
    // File doesn't exist yet, continue
  }

  try {
    // Ensure SQLite directory exists
    await FileSystem.makeDirectoryAsync(dbDir, { intermediates: true });

    // Load and copy bundled DB
    const asset = Asset.fromModule(require('@assets/db/championdex.db'));
    await asset.downloadAsync();

    if (!asset.localUri) {
      throw new Error('Failed to load bundled database asset');
    }

    await FileSystem.copyAsync({ from: asset.localUri, to: dbPath });
    console.log('[Database] Copied bundled DB to', dbPath);
    return true;
  } catch (error) {
    console.warn('[Database] Failed to copy bundled DB, continuing with normal initialization:', error);
    return false;
  }
}
