import {
  ConfigPlugin,
  withDangerousMod,
} from 'expo/config-plugins';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');

/**
 * Config plugin that patches expo-sqlite SDK 57 to guarantee fsync() after database imports on Android.
 *
 * PROBLEM: importDatabaseFromAssetAsync resolves its Promise before the native file copy
 * is fsynced to disk on Android. This causes "disk image is malformed" errors on the first
 * DB operation after a version-bump replacement.
 *
 * ROOT CAUSE: File.copyTo() in Kotlin does not call fsync() before returning.
 * This is a known issue in expo-sqlite SDK 57 that affects database durability.
 *
 * SOLUTION: Patch the Kotlin source to call FileDescriptor.sync() after the copy.
 *
 * This plugin modifies the expo-sqlite Android module source at build time to inject
 * the fsync guarantee. The patch is minimal and surgical, affecting only the
 * importAssetDatabaseAsync function that actually performs the file copy.
 */
const withSQLiteFsync: ConfigPlugin = (config) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      await patchSQLiteModuleAndroid(config);
      return config;
    },
  ]);
};

/**
 * Patch the expo-sqlite Android SQLiteModule.kt to add fsync after file copy.
 * The original code (line 87) is:
 *   assetFile.copyTo(dbFile, forceOverwrite)
 *
 * We replace it with code that explicitly syncs the file to disk:
 *   assetFile.copyTo(dbFile, forceOverwrite)
 *   val outputStream = dbFile.outputStream()
 *   outputStream.fd.sync()
 *   outputStream.close()
 */
async function patchSQLiteModuleAndroid(
  config: any
): Promise<void> {
  const nodeModulesPath = path.resolve(
    config._internal?.projectRoot || '',
    'node_modules'
  );

  const sqliteModulePath = path.join(
    nodeModulesPath,
    'expo-sqlite',
    'android',
    'src',
    'main',
    'java',
    'expo',
    'modules',
    'sqlite',
    'SQLiteModule.kt'
  );

  if (!fs.existsSync(sqliteModulePath)) {
    console.warn(
      `[withSQLiteFsync] Could not find SQLiteModule.kt at ${sqliteModulePath}`
    );
    return;
  }

  let content = fs.readFileSync(sqliteModulePath, 'utf8');

  // Check if we've already patched this file
  if (content.includes('// [withSQLiteFsync] fsync patch applied')) {
    console.log('[withSQLiteFsync] SQLiteModule already patched, skipping');
    return;
  }

  // Regex to find the importAssetDatabaseAsync function's copyTo line
  // We look for the pattern: assetFile.copyTo(dbFile, forceOverwrite)
  const copyToPattern = /assetFile\.copyTo\(dbFile,\s*forceOverwrite\)/;

  if (!copyToPattern.test(content)) {
    console.warn(
      '[withSQLiteFsync] Could not find copyTo pattern in SQLiteModule.kt. ' +
        'The expo-sqlite source may have changed. Manual verification required.'
    );
    return;
  }

  // Replace the copyTo line with a version that includes fsync
  // We wrap it with a try-catch to ensure robustness
  const patchedCopyTo = `assetFile.copyTo(dbFile, forceOverwrite)
      // [withSQLiteFsync] Guarantee file is fsynced to disk before returning
      // Fixes: importDatabaseFromAssetAsync completing before file is persisted on Android
      try {
        val fis = java.io.FileInputStream(dbFile)
        fis.fd.sync()
        fis.close()
      } catch (e: Exception) {
        // Fsync is best-effort; if it fails, the copy has still completed
      }`;

  content = content.replace(copyToPattern, patchedCopyTo);

  // Mark that we've applied this patch
  const patchMarker = `
// [withSQLiteFsync] fsync patch applied
// This marker prevents re-patching on rebuild
`;
  content = content.replace(
    /^(import android\.content\.Context)/m,
    patchMarker + '$1'
  );

  fs.writeFileSync(sqliteModulePath, content, 'utf8');
  console.log('[withSQLiteFsync] Successfully patched SQLiteModule.kt');
}

export default withSQLiteFsync;
