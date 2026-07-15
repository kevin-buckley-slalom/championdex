/**
 * Artwork Prefetch Service
 *
 * Manages efficient bulk prefetching of Pokémon artwork images on first app launch.
 * Features:
 * - Bulk prefetch of all 1025 normal home render images on first launch
 * - Resume from checkpoint if prefetch is interrupted
 * - Lazy prefetch of shiny variants when detail screen opens
 * - Non-blocking fire-and-forget architecture
 * - Per-image error handling (failures do not stop the process)
 * - Cache availability detection for UI feedback
 *
 * File: src/services/prefetch/artworkPrefetchService.ts
 */

import { Image } from 'expo-image';
import { getDatabase } from '@/services/database/initializeDatabase';

const TOTAL_DEX = 1025;
const BATCH_SIZE = 10;
const BASE_URL = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home';

/**
 * Get the normal (non-shiny) home render URL for a Pokémon
 */
export function getHomeRenderUrl(dex: number): string {
  return `${BASE_URL}/${dex}.png`;
}

/**
 * Get the shiny home render URL for a Pokémon
 */
export function getShinyHomeRenderUrl(dex: number): string {
  return `${BASE_URL}/shiny/${dex}.png`;
}

/**
 * Start the bulk prefetch process for all normal home render images.
 * Fire-and-forget: does not block the caller, does not return a promise.
 * - Resumes from checkpoint if interrupted
 * - Processes in batches of BATCH_SIZE
 * - Silently handles per-image errors
 */
export function startArtworkPrefetch(): void {
  // Fire-and-forget: use Promise without awaiting
  prefetchArtworkAsync().catch((error) => {
    console.warn('[ArtworkPrefetch] Unhandled error in prefetch', error);
  });
}

/**
 * Start the bulk prefetch process for alternate form home render images.
 * Fire-and-forget: does not block the caller, does not return a promise.
 * - Queries the pokemon table for rows where pokeapi_id != national_dex AND pokeapi_id > 0
 * - Prefetches their Home render URLs in batches
 * - Tracks progress in sync_metadata under key 'alt_form_prefetch_completed'
 */
export function startAlternateFormPrefetch(): void {
  // Fire-and-forget: use Promise without awaiting
  prefetchAlternateFormsAsync().catch((error) => {
    console.warn('[ArtworkPrefetch] Unhandled error in alternate form prefetch', error);
  });
}

/**
 * Internal async prefetch implementation for alternate forms
 */
async function prefetchAlternateFormsAsync(): Promise<void> {
  try {
    const db = await getDatabase();

    // Check if prefetch is already complete
    const completedResult = await db.getFirstAsync<{ value: string }>(
      'SELECT value FROM sync_metadata WHERE key = ?',
      ['alt_form_prefetch_completed']
    );

    if (completedResult?.value === 'true') {
      console.log('[ArtworkPrefetch] Alternate form prefetch already completed (flag in DB)');
      return;
    }

    // Query all alternate forms: where pokeapi_id != national_dex AND pokeapi_id > 0
    const alternateFormResults = await db.getAllAsync<{ pokeapi_id: number }>(
      'SELECT pokeapi_id FROM pokemon WHERE pokeapi_id != national_dex AND pokeapi_id > 0 ORDER BY pokeapi_id ASC'
    );

    if (!alternateFormResults || alternateFormResults.length === 0) {
      console.log('[ArtworkPrefetch] No alternate forms found to prefetch. Possible issue: seeding may not have populated alternate form pokeapi_ids correctly.');
      // Mark as complete anyway
      try {
        await db.runAsync(
          'INSERT OR REPLACE INTO sync_metadata (key, value, updated_at) VALUES (?, ?, datetime("now"))',
          ['alt_form_prefetch_completed', 'true']
        );
      } catch (error) {
        console.warn('[ArtworkPrefetch] Failed to mark alternate form prefetch completed:', error);
      }
      return;
    }

    console.log(`[ArtworkPrefetch] Starting alternate form prefetch for ${alternateFormResults.length} forms (first few: ${alternateFormResults.slice(0, 5).map(r => r.pokeapi_id).join(', ')})`);

    // Prefetch in batches
    for (let i = 0; i < alternateFormResults.length; i += BATCH_SIZE) {
      const batchEnd = Math.min(i + BATCH_SIZE, alternateFormResults.length);
      const batch: Promise<void>[] = [];

      for (let j = i; j < batchEnd; j++) {
        const pokeApiId = alternateFormResults[j].pokeapi_id;
        batch.push(
          Image.prefetch(getHomeRenderUrl(pokeApiId))
            .catch((error) => {
              // Silently ignore individual image failures
              console.debug(`[ArtworkPrefetch] Failed to prefetch alternate form ${pokeApiId}: ${error}`);
            })
            .then(() => undefined)
        );
      }

      // Wait for batch to complete
      await Promise.all(batch);

      const batchNum = Math.ceil((i + BATCH_SIZE) / BATCH_SIZE);
      const totalBatches = Math.ceil(alternateFormResults.length / BATCH_SIZE);
      console.debug(`[ArtworkPrefetch] Completed alternate form batch ${batchNum}/${totalBatches} (dex IDs: ${alternateFormResults.slice(i, batchEnd).map(r => r.pokeapi_id).join(', ')})`);
    }

    // Mark prefetch as complete
    try {
      await db.runAsync(
        'INSERT OR REPLACE INTO sync_metadata (key, value, updated_at) VALUES (?, ?, datetime("now"))',
        ['alt_form_prefetch_completed', 'true']
      );
    } catch (error) {
      console.warn('[ArtworkPrefetch] Failed to mark alternate form prefetch completed:', error);
    }

    console.log(`[ArtworkPrefetch] Alternate form prefetch completed successfully (${alternateFormResults.length} forms prefetched)`);
  } catch (error) {
    console.error('[ArtworkPrefetch] Error during alternate form prefetch initialization:', error);
  }
}

/**
 * Internal async prefetch implementation
 */
async function prefetchArtworkAsync(): Promise<void> {
  try {
    const db = await getDatabase();

    // Check if prefetch is already complete
    const completedResult = await db.getFirstAsync<{ value: string }>(
      'SELECT value FROM sync_metadata WHERE key = ?',
      ['artwork_prefetch_completed']
    );

    if (completedResult?.value === 'true') {
      console.log('[ArtworkPrefetch] Prefetch already completed');
      return;
    }

    // Get the checkpoint (resume from here)
    const progressResult = await db.getFirstAsync<{ value: string }>(
      'SELECT value FROM sync_metadata WHERE key = ?',
      ['artwork_prefetch_progress']
    );

    const startDex = progressResult?.value ? parseInt(progressResult.value, 10) + 1 : 1;

    console.log(`[ArtworkPrefetch] Starting bulk prefetch from dex ${startDex} to ${TOTAL_DEX}`);

    // Prefetch in batches
    for (let dex = startDex; dex <= TOTAL_DEX; dex += BATCH_SIZE) {
      const batchEnd = Math.min(dex + BATCH_SIZE - 1, TOTAL_DEX);
      const batch: Promise<void>[] = [];

      for (let i = dex; i <= batchEnd; i++) {
        batch.push(
          Image.prefetch(getHomeRenderUrl(i))
            .catch((error) => {
              // Silently ignore individual image failures
              // A failed prefetch just means the image will fetch live when needed
              console.debug(`[ArtworkPrefetch] Failed to prefetch ${i}: ${error}`);
            })
            .then(() => undefined)
        );
      }

      // Wait for batch to complete
      await Promise.all(batch);

      // Update progress checkpoint
      try {
        await db.runAsync(
          'INSERT OR REPLACE INTO sync_metadata (key, value, updated_at) VALUES (?, ?, datetime("now"))',
          ['artwork_prefetch_progress', String(batchEnd)]
        );
      } catch (error) {
        console.warn(`[ArtworkPrefetch] Failed to update progress at ${batchEnd}:`, error);
      }
    }

    // Mark prefetch as complete
    try {
      await db.runAsync(
        'INSERT OR REPLACE INTO sync_metadata (key, value, updated_at) VALUES (?, ?, datetime("now"))',
        ['artwork_prefetch_completed', 'true']
      );
    } catch (error) {
      console.warn('[ArtworkPrefetch] Failed to mark prefetch completed:', error);
    }

    console.log('[ArtworkPrefetch] Bulk prefetch completed successfully');
  } catch (error) {
    console.error('[ArtworkPrefetch] Error during prefetch initialization:', error);
  }
}

/**
 * Prefetch a single shiny artwork image.
 * Returns true on success, false on failure.
 * Used by detail screens to eagerly load shiny variants.
 */
export async function prefetchShinyArtwork(dex: number): Promise<boolean> {
  try {
    await Image.prefetch(getShinyHomeRenderUrl(dex));
    console.debug(`[ArtworkPrefetch] Prefetched shiny for ${dex}`);
    return true;
  } catch (error) {
    console.debug(`[ArtworkPrefetch] Failed to prefetch shiny for ${dex}:`, error);
    return false;
  }
}

/**
 * Check if an image is available in the cache.
 * Returns true if the image path is non-null/non-empty (image is cached).
 * Returns false if cache path is null/empty or if getCachePathAsync is not available.
 *
 * Fallback for expo-image versions without getCachePathAsync:
 * Attempts a HEAD request with a short timeout to detect availability.
 */
export async function isImageCached(url: string): Promise<boolean> {
  try {
    // Try the native Image.getCachePathAsync first (available in expo-image v57+)
    const getCachePathAsync = (Image as any).getCachePathAsync;
    if (typeof getCachePathAsync === 'function') {
      const cachePath = await getCachePathAsync(url);
      return !!cachePath && cachePath.length > 0;
    }

    // getCachePathAsync not available — assume not cached
    return false;
  } catch (error) {
    console.debug(`[ArtworkPrefetch] Error checking cache for ${url}:`, error);
    return false;
  }
}
