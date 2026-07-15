/**
 * Hook to pre-load all Pokémon type backdrop images
 *
 * Bundled images (via require()) are loaded using expo-asset's Asset.loadAsync(),
 * which correctly handles require() results (which return numbers, not URIs).
 * This ensures images are decoded and cached in the native layer, making them
 * instant when needed for detail screens.
 *
 * This hook should be called once at app startup (e.g., in the root layout)
 * and fires off pre-loading without blocking the UI.
 *
 * File: src/hooks/usePreloadBackdropImages.ts
 */

import { useEffect } from 'react';
import { Asset } from 'expo-asset';
import { TYPE_BACKDROP_ASSETS, SPECIAL_BACKDROP_ASSETS } from '@/constants/typeBackdrops';

/**
 * Pre-load all backdrop images asynchronously (fire-and-forget).
 * Does not block rendering — UI loads while images are decoded and cached in the background.
 */
export const usePreloadBackdropImages = () => {
  useEffect(() => {
    // Fire off pre-loading without awaiting
    preloadAllBackdropImages();
  }, []);
};

/**
 * Internal function to load all backdrop assets.
 * Runs asynchronously without blocking the main thread.
 *
 * Uses Asset.loadAsync() from expo-asset, which correctly handles require() results
 * (numbers representing bundled asset module IDs). This triggers native image decoding
 * and caching.
 */
async function preloadAllBackdropImages(): Promise<void> {
  try {
    // Collect all require() results from both type and special backdrops
    // require() returns a number (asset module ID) for bundled images
    const allBackdropAssets = [
      ...Object.values(TYPE_BACKDROP_ASSETS),
      ...Object.values(SPECIAL_BACKDROP_ASSETS),
    ];

    // Asset.loadAsync() accepts the require() results directly (numbers)
    // and handles the native decoding and caching
    await Asset.loadAsync(allBackdropAssets);

    console.log(
      `[BackdropPreload] Successfully pre-loaded ${allBackdropAssets.length} backdrop images`,
    );
  } catch (error) {
    // Non-critical error — app will still work, but images may load with slight delay
    console.warn('[BackdropPreload] Error pre-loading backdrop images:', error);
  }
}
