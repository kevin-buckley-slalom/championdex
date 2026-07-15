# ChampionDex Enrichment Pipeline Specification

**Document Status:** SPECIFICATION (Ready for Implementation)  
**Date:** 2026-07-13  
**Audience:** Backend/Infrastructure Engineer, React Native Engineer  
**Problem Statement:** Five critical performance and correctness issues in the PokeAPI enrichment pipeline

---

## EXECUTIVE SUMMARY

The ChampionDex app's PokeAPI enrichment pipeline has five identified problems that impact startup performance, enrichment duration, and user experience. This specification defines the correct target behavior for each fix, data model changes required, and measurable acceptance criteria.

| Priority | Problem | Current Impact | Target Improvement |
|----------|---------|-----------------|-------------------|
| **P0** | No-evolution cache miss | 575 unnecessary network fetches (~63s wasted) | Zero wasted fetches on re-runs |
| **P1** | Sequential 50ms sleep, single-threaded | ~141s idle time on first run (~2.4 min) | 10× speedup via batching & conditional sleep |
| **P2** | No enrichment progress indication | 8–10 min with zero user feedback | Real-time inline progress indicators |
| **P3** | Bundle parse time | ~9s cold launch latency | <3s via Hermes + inline requires |
| **P4** | Backfills run after enrichment | 8–10 min total until classification/moves data | 60–120s via concurrent fire-and-forget + semaphore |

---

## PART 1: CURRENT STATE

### P0 — No-evolution Cache Miss

**Root Cause:**  
`prefetchPokeApiSpeciesData` checks `COUNT(*) FROM pokemon_evolutions WHERE national_dex = ?` to determine if a species' evolution data is cached. For species with no evolutions and no pre-evolutions (575 of 1,025), this count is always 0. These species are treated as "not fetched" and result in unnecessary network calls on every enrichment re-run.

**Symptom:**  
On second launch after enrichment completes, 575 PokeAPI requests are made unnecessarily, wasting ~63 seconds even though data is already complete.

**Why It Matters:**  
Every enrichment re-run (or user tap to manually re-enrich) pays this cost. Combined with P1, this is the largest time sink in the pipeline.

---

### P1 — Sequential 50ms Sleep + Single-Threaded Fetches

**Root Cause:**  
1. Every PokeAPI request is followed by `await new Promise(resolve => setTimeout(resolve, 50))`, even when data came from DB cache
2. All requests execute sequentially with no concurrency

**Symptom:**  
On first-run enrichment of ~2,821 requests:
- 50ms sleep on every request = 141 seconds of idle time alone
- Sequential execution = no overlap possible
- Total wall-clock time: 5–6 minutes for a ~60–90s of actual work

**Why It Matters:**  
Sleep floor is 90× longer than target (50ms × 2,821 requests = 141s vs. 60–90s target). This is the single largest contributor to enrichment latency.

---

### P2 — No Progress Indication During Enrichment

**Root Cause:**  
Classification and moveset fields are gated on `sync_metadata` flags (e.g., `classification_backfill_v1`) but there is no UI component to check these flags in real-time and display progress.

**Symptom:**  
On a fresh install, the Pokemon detail screen shows empty/null classification and moveset fields for 8–10 minutes with no loading indicator. Users have no feedback and may think the app is broken.

**Why It Matters:**  
User experience is degraded by lack of feedback. Fields appear broken instead of loading.

---

### P3 — Bundle Parse Time (~9s)

**Root Cause:**  
Metro JS bundle parsing is blocking the first render. Hermes bytecode precompilation may not be enabled, and root-level imports may include modules not needed for the initial screen.

**Symptom:**  
Cold launch (tap app icon) takes ~9 seconds before any UI renders. This is 90× the 100ms RAIL standard for first frame.

**Why It Matters:**  
First impression is critical. 9s cold launch will frustrate users and cause app abandonment.

---

### P4 — Backfills Run After Enrichment

**Root Cause:**  
`enrichDatabaseAsync` runs to completion (~5–6 min on first run), then `runClassificationBackfill` and `runMovesBackfill` start. They are not concurrent.

**Symptom:**  
Classification and moveset data don't appear until ~8–10 min post-install. Even though they could be fetching in parallel from minute 1, they wait for enrichment to complete first.

**Why It Matters:**  
Time to populated UI is doubled. User sees empty/placeholder fields longer than necessary.

---

## PART 2: TARGET STATE SPECIFICATIONS

### P0 — No-evolution Cache Miss: Add `species_enriched` Column

**Specification:**

Add a new `species_enriched` INTEGER column to the `pokemon` table:
- **Type:** INTEGER (0 or 1, NOT NULL, default 0)
- **Purpose:** Track whether a species has been fetched from PokeAPI, independent of whether evolutions exist
- **Migration:** Use existing `runMigrations` pattern in `initializeDatabase.ts`

**Cache-Skip Logic in `prefetchPokeApiSpeciesData`:**

When checking if a species is cached, use this decision tree:

```
if (species_enriched === 1) {
  // Fetched before, confirmed to have evolutions or not. Use cache.
  SKIP network fetch
} else if (flavor_text COUNT > 0 AND evolution COUNT > 0) {
  // Legacy: species was fetched in an older enrichment run
  // (has flavor text AND has evolutions, so enrichment ran before)
  SKIP network fetch
} else {
  // Never fetched, or partially enriched. Fetch from PokeAPI.
  FETCH from PokeAPI
}
```

**Write Path:**

After every successful `prefetchPokeApiSpeciesData` PokeAPI fetch (whether or not evolutions exist), execute:

```sql
UPDATE pokemon
SET species_enriched = 1
WHERE national_dex = ?
```

This must happen inside the enrichment transaction, immediately after the species data is written.

**Validation:**

On second launch after enrichment completes:
- Query: `SELECT COUNT(*) FROM pokemon WHERE species_enriched = 1` must return 1025
- Log must show `[Database] prefetchPokeApiSpeciesData: 0 network fetches, 1025 cache hits`
- Measurable: No outbound PokeAPI requests for species data on re-enrichment

---

### P1 — Conditional Sleep + Concurrent Batching

**Specification:**

#### 1.1 Move 50ms Sleep to Network-Only

The sleep must fire ONLY when a real network request was made, not on cache hits:

```typescript
// BEFORE (sleeps even on cache hits)
const data = await db.queryOne(...);
if (!data) {
  const result = await fetch(...); // network
}
await new Promise(resolve => setTimeout(resolve, 50)); // always

// AFTER (sleeps only on network)
const data = await db.queryOne(...);
if (!data) {
  const result = await fetch(...); // network
  await new Promise(resolve => setTimeout(resolve, 50)); // only on fetch
} // no sleep on cache hit
```

#### 1.2 Implement Concurrent Batch Processing

Process items in batches of 10 with `Promise.all`, applying a single 50ms delay between batches (not per-item):

```typescript
async function batchFetch<T>(
  items: T[],
  fetchFn: (item: T) => Promise<any>,
  batchSize: number = 10,
  batchDelay: number = 50
): Promise<void> {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    
    await Promise.all(
      batch.map(item =>
        (async () => {
          const cached = await checkCache(item);
          if (!cached) {
            await fetchFn(item);
            // 50ms sleep happens here, inside the promise
            await new Promise(resolve => setTimeout(resolve, 50));
          }
        })()
      )
    );
    
    // Stagger batches: wait 50ms before starting next batch
    if (i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
}
```

**Key Detail:** The 50ms delay between batches ensures the PokeAPI rate limit (10 requests/sec) is respected. A batch of 10 requests in parallel, followed by 50ms pause, follows the limit.

#### 1.3 Apply Pattern Consistently Across Five Functions

1. `prefetchPokeApiIds` — Batch all calls; move sleep to network-only
2. `prefetchPokeApiSpeciesData` — Batch all calls; move sleep to network-only; keep evolution chain fetch de-duplication
3. `prefetchPokemonMoveset` — Batch all calls; move sleep to network-only
4. `runClassificationBackfill` — Batch all calls; move sleep to network-only
5. `runMovesBackfill` — Batch all calls; move sleep to network-only

**Evolution Chain Handling:**  
Within `prefetchPokeApiSpeciesData`, evolution chains are already de-duped by chain ID (fetched once per unique chain). Keep this de-duplication. The batching applies to the per-species fetch; evolution chains are fetched separately within the same concurrency window (still subject to the 50ms per batch).

**Expected Outcome:**
- First-run enrichment duration: 60–90 seconds (down from 5–6 min)
- Sleep time: ~50ms × 100 batches = ~5s (down from 141s)
- Log output: `[Database] species batch 10/103 complete` every 50ms

---

### P2 — Real-Time Enrichment Progress Indication ⏸ DEFERRED

**Decision (2026-07-13):** Deferred indefinitely. Rationale:
- On any device that has already completed enrichment, this UI never renders — zero benefit to existing users.
- On fresh install, users are unlikely to navigate to a detail screen within the 10–30s window before data arrives with concurrent streams (P4).
- Classification absence collapses silently (no visible layout gap). Moveset already has a "No moves found" empty state covering the gap.
- Engineering cost is moderate (polling hook, Reanimated skeleton animation, conditional rendering in detail screen). Payoff is low until public beta produces real first-install feedback.
- Revisit if first-install telemetry or user complaints surface post-launch.

**Spec retained below for future implementation:**

**Specification:**

#### 2.1 Add `useEnrichmentStatus` Hook

Create a new hook `src/hooks/useEnrichmentStatus.ts`:

```typescript
import { useQuery } from '@tanstack/react-query';
import { getSyncMetadata } from '@/db/enrichment'; // existing function

type EnrichmentStatus = {
  enrichmentComplete: boolean;
  classificationComplete: boolean;
  movesComplete: boolean;
};

export function useEnrichmentStatus() {
  return useQuery<EnrichmentStatus>({
    queryKey: ['enrichmentStatus'],
    queryFn: async (): Promise<EnrichmentStatus> => {
      const metadata = await getSyncMetadata();
      return {
        enrichmentComplete: !!metadata.pokeapi_enrich_version,
        classificationComplete: !!metadata.classification_backfill_v1,
        movesComplete: !!metadata.moves_backfill_v1,
      };
    },
    refetchInterval: 5000, // Poll every 5s while any flag is false
    refetchIntervalPause: false, // Keep polling in background
    enabled: true,
    staleTime: 0, // Consider data stale immediately to force re-queries
  });
}
```

**Polling Behavior:**
- `refetchInterval: 5000` means the query refetches every 5 seconds
- The query client will automatically stop polling once all three flags are `true` (optional: add manual stop logic if needed)
- Use `useEffect` to manually disable refetching once all are complete:

```typescript
const { data, refetch } = useEnrichmentStatus();

useEffect(() => {
  if (data?.enrichmentComplete && data?.classificationComplete && data?.movesComplete) {
    // All complete, stop polling
    // Cleanup happens when component unmounts
  }
}, [data?.enrichmentComplete, data?.classificationComplete, data?.movesComplete]);
```

#### 2.2 Pokemon Detail Screen Indicators

On the Pokemon detail screen (e.g., `app/(main)/(pokedex)/[id].tsx`):

**Classification Field:**
```typescript
const { data: enrichmentStatus } = useEnrichmentStatus();

if (!enrichmentStatus?.classificationComplete && !pokemon.classification) {
  return (
    <View style={styles.classificationSkeleton}>
      <SkeletonLoader
        width="100%"
        height={60}
        variant="shimmer"
      />
    </View>
  );
}

return <ClassificationDisplay pokemon={pokemon} />;
```

**Moveset Section:**
```typescript
if (!enrichmentStatus?.movesComplete && !pokemon.moves?.length) {
  return (
    <View style={styles.movesSkeleton}>
      <Text style={styles.placeholderText}>Moveset loading…</Text>
      <SkeletonLoader
        width="100%"
        height={40}
        count={3}
        variant="shimmer"
      />
    </View>
  );
}

return <MovesetDisplay pokemon={pokemon} />;
```

#### 2.3 Skeleton/Placeholder Design

- **Style:** Use `colors.surfaceElevated` (or `colors.surfaceSecondary`) with 40% opacity
- **Animation:** Pulse using Reanimated (not `Animated` from react-native)
- **Reanimated Implementation:**

```typescript
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

function SkeletonLoader({ width, height, variant = 'shimmer' }) {
  const opacity = useSharedValue(0.4);

  React.useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.8, { duration: 1000 }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Reanimated.View
      style={[
        { width, height, backgroundColor: 'colors.surfaceElevated' },
        animatedStyle,
      ]}
    />
  );
}
```

**What NOT to Render:**
- ❌ No modal overlay
- ❌ No app-wide loading banner
- ❌ No navigation blocker
- ✓ ONLY inline skeleton placeholders in the specific fields

#### 2.4 Query Configuration

Add `enrichmentStatus` to the global React Query config in `app/_layout.tsx`:

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0, // Force fresh check on every refetch
      gcTime: 1000 * 60 * 5, // Keep for 5 min
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnMount: 'stale',
    },
  },
});
```

For the enrichmentStatus query specifically, enable aggressive polling (5s interval) to catch completion quickly.

**Validation:**

On a fresh device:
1. Tap app, navigate to Bulbasaur detail screen at T+0s (enrichment just started)
2. Verify classification and moveset fields show skeleton loaders
3. Wait 2–5 minutes (enrichment running)
4. Verify skeletons are replaced with actual data WITHOUT screen refresh or navigation
5. Verify no modal or banner is visible
6. Log: `[Query] enrichmentStatus refetch: classification=false, moves=false` (at 5s intervals until complete)

---

### P3 — Bundle Parse Time Optimization

**Specification:**

#### 3.1 Verify Hermes Configuration

In `app.json`, confirm `jsEngine` is set to `"hermes"`:

```json
{
  "plugins": [
    [
      "expo-build-properties",
      {
        "ios": {
          "jsEngine": "hermes"
        },
        "android": {
          "jsEngine": "hermes"
        }
      }
    ]
  ]
}
```

If not present, add this configuration. Hermes pre-compiles JS to bytecode, reducing parse time from ~9s to ~2–3s.

#### 3.2 Enable Inline Requires in Metro Config

In `metro.config.js`, add/enable `inlineRequires`:

```javascript
const config = {
  project: {
    ios: {},
    android: {},
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true, // ← ENABLE THIS
      },
    }),
  },
};
```

`inlineRequires: true` defers module evaluation until first use, reducing initial bundle evaluation overhead.

#### 3.3 Audit Root Import Chain

Review `app/_layout.tsx` and `app/(main)/_layout.tsx` for large modules imported at the top level that aren't needed for the splash/loading screen:

**Current Load:**
- Root layout likely imports all navigation stacks
- Tab layout imports all tab screens
- Each screen may import heavy components

**Required Action:**
1. Identify modules imported at the root that are NOT shown in the first 2 seconds:
   - ❌ Detail screen components (never shown on first launch)
   - ❌ Team builder screens (not shown unless user navigates to Teams tab)
   - ❌ Heavy animation libraries if not used on splash
   
2. Move these to lazy imports:

```typescript
// BEFORE (blocks first render)
import PokemonDetailScreen from './[id]';

// AFTER (loads on first navigation to detail)
const PokemonDetailScreen = lazy(() => import('./[id]'));
```

3. Check transitive imports—ensure imported modules don't import others that block startup

#### 3.4 What NOT to Do

- ❌ Do NOT restructure the app routing (e.g., split into multiple bundles)
- ❌ Do NOT remove necessary imports for the loading screen
- ❌ Do NOT use `require()` instead of `import` (less optimizable)

**Investigation Approach:**
1. Build with `eas build --platform android --profile preview`
2. Measure bundle parse time using Metro CLI output: `Metro build took Xs`
3. Use React Native DevTools profiler to identify slowest imports
4. Apply lazy imports incrementally and re-measure

**Target:**
- Reduce cold parse time from ~9s to <3s
- Measured on a Pixel 4a or equivalent mid-range Android device

---

### P4 — Concurrent Enrichment Streams with Shared Rate Limit

**Specification:**

#### 4.1 Extract Classification Backfill from Enrichment Pipeline

**Current Flow:**
```
startPokeApiEnrichment()
  └─ enrichDatabaseAsync() → completes in 5–6 min
      └─ runClassificationBackfill() → starts after enrichment
      └─ runMovesBackfill() → starts after enrichment
```

**Target Flow:**
```
startPokeApiEnrichment()
  ├─ enrichDatabaseAsync() [fire and forget]
  ├─ runClassificationBackfill() [fire and forget]
  └─ runMovesBackfill() [fire and forget]
  (all three run concurrently from minute 1)
```

#### 4.2 Remove Calls from Inside `enrichDatabaseAsync`

In the enrichment function, **remove these lines:**

```typescript
// REMOVE from enrichDatabaseAsync:
await runClassificationBackfill(); // ← DELETE
await runMovesBackfill(); // ← DELETE
```

These become fire-and-forget calls from the caller instead.

#### 4.3 Implement Shared Concurrency Semaphore

Create a module-level semaphore to limit concurrent PokeAPI requests across all three streams to 10 max:

**File: `src/db/enrichmentSemaphore.ts`**

```typescript
type Semaphore = {
  count: number;
  queue: Array<() => void>;
};

const semaphore: Semaphore = {
  count: 10, // Max concurrent requests
  queue: [],
};

export async function acquireSemaphore(): Promise<void> {
  if (semaphore.count > 0) {
    semaphore.count--;
    return;
  }

  return new Promise(resolve => {
    semaphore.queue.push(() => {
      semaphore.count--;
      resolve();
    });
  });
}

export function releaseSemaphore(): void {
  if (semaphore.queue.length > 0) {
    const next = semaphore.queue.shift();
    if (next) next();
  } else {
    semaphore.count++;
  }
}

export async function withSemaphore<T>(
  fn: () => Promise<T>
): Promise<T> {
  await acquireSemaphore();
  try {
    return await fn();
  } finally {
    releaseSemaphore();
  }
}
```

#### 4.4 Integrate Semaphore into Fetch Functions

Wrap every PokeAPI network call with the semaphore:

```typescript
// In prefetchPokeApiSpeciesData, prefetchPokemonMoveset, etc:
const species = await withSemaphore(() =>
  fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`)
);

// Same in runClassificationBackfill and runMovesBackfill
const classification = await withSemaphore(() =>
  fetch(`https://pokeapi.co/api/v2/...`)
);
```

This ensures that across all three concurrent streams (enrichment, classification, moves), no more than 10 requests are in-flight at any time.

#### 4.5 Update Caller in `seedDatabase`

In `seedDatabase.ts` or wherever `startPokeApiEnrichment` is called, fire all three concurrently:

```typescript
// BEFORE
await startPokeApiEnrichment();

// AFTER
Promise.all([
  enrichDatabaseAsync(),
  runClassificationBackfill(),
  runMovesBackfill(),
]).catch(error => {
  console.error('[Enrichment] One or more streams failed:', error);
  // Each stream has its own error handling; this is informational
});
```

Note: Do NOT await this Promise.all—let it run in the background. The app should be usable while enrichment is happening.

#### 4.6 Existing Gates Remain Unchanged

Each backfill already checks its own `sync_metadata` key:
- `classification_backfill_v1` gates classification
- `moves_backfill_v1` gates moveset

These gates are unchanged. If a flag is already present (from a prior enrichment), the backfill skips its work. The concurrency change does not affect the gate logic.

**Validation:**

On a fresh install at T+90s:
1. Verify enrichment is still running (e.g., logs show batches being processed)
2. Navigate to Bulbasaur detail screen
3. Verify classification data is populated (even though enrichment hasn't finished)
4. Verify moveset data is populated
5. Verify no more than 10 concurrent PokeAPI requests in logs at any point
6. Log: `[Enrichment] streams running concurrently: enrichment, classification, moves`

---

## PART 3: DATA MODEL CHANGES

### Schema Migration for P0

**SQL:**
```sql
ALTER TABLE pokemon ADD COLUMN species_enriched INTEGER NOT NULL DEFAULT 0;
CREATE INDEX idx_pokemon_species_enriched ON pokemon(species_enriched);
```

**Integration:**

In `src/db/initializeDatabase.ts`, inside the `runMigrations()` function, add:

```typescript
async function runMigrations(db: SQLiteDatabase) {
  const colNames = await getTableColumnNames(db, 'pokemon');
  
  if (!colNames.includes('species_enriched')) {
    await db.execAsync(`
      ALTER TABLE pokemon ADD COLUMN species_enriched INTEGER NOT NULL DEFAULT 0;
      CREATE INDEX idx_pokemon_species_enriched ON pokemon(species_enriched);
    `);
    console.log('[Database] Added species_enriched column');
  }
  
  // ... other migrations
}
```

Use the existing pattern already in place for other schema additions. This ensures the migration runs once on app update without manual intervention.

---

## PART 4: VALIDATION CRITERIA

Each fix has measurable acceptance criteria that can be verified with logs and queries, not subjective "looks right" checks.

### P0 Validation

**Criterion:** On second launch after enrichment completes, zero network fetches for species data.

**Verification:**
1. First launch: Full enrichment runs (~1–2 min with concurrent batching)
2. Force-quit app
3. Second launch: Trigger enrichment again (or manually call `enrichDatabaseAsync` in dev mode)
4. Check database: `SELECT COUNT(*) FROM pokemon WHERE species_enriched = 1` → must return **1025**
5. Check logs: Must show `[Database] prefetchPokeApiSpeciesData: 0 network fetches, 1025 cache hits`
6. Network tab: Zero outbound requests to `pokeapi.co/api/v2/pokemon-species`
7. **Pass:** All three checks succeed

---

### P1 Validation

**Criterion:** First-run enrichment completes in under 120 seconds total wall-clock time.

**Verification:**
1. Fresh install on a test device
2. Start enrichment (measure wall-clock time)
3. Check logs for batch progress: `[Database] species batch 10/103 complete` approximately every 50ms
4. Verify individual species fetches show no sleep on cache hits: No `[Enrichment] sleep 50ms` log for cached items
5. Verify concurrent requests: Peak concurrent PokeAPI requests should be ~10 at a time, not 1
6. Final log: `[Database] enrichDatabaseAsync completed in Xs` where X < 120
7. **Pass:** Completed in <120s AND batch logs visible AND no sleep on cache hits

---

### P2 Validation

**Criterion:** On a fresh install, Pokemon detail screen shows skeleton placeholders while enrichment is running.

**Verification:**
1. Fresh install on test device
2. In dev mode, add this to `sync_metadata` initialization to simulate incomplete enrichment:
   - Delete/clear `classification_backfill_v1` and `moves_backfill_v1` flags
3. Restart app
4. Immediately navigate to Bulbasaur detail screen (T+5s, enrichment still running)
5. Verify:
   - Classification field shows skeleton loader (animated opacity pulse)
   - Moveset section shows "Moveset loading…" placeholder + skeleton rows
   - No modal, no banner, no navigation blocker
6. Wait for enrichment to complete (~1–2 min)
7. Verify skeletons disappear and real data appears WITHOUT:
   - Screen refresh
   - Navigation change
   - User action
8. Check logs: `[Query] enrichmentStatus refetch` every 5s until all flags complete
9. **Pass:** Skeletons render during enrichment, disappear automatically when complete

---

### P3 Validation

**Criterion:** Cold launch time (tap app icon to first frame render) is under 3 seconds on mid-range Android.

**Verification:**
1. Device: Pixel 4a or equivalent
2. Uninstall app completely
3. Measure cold launch time:
   ```bash
   adb shell am start -W com.pokemonchampion/.MainActivity | grep TotalTime
   ```
   Expected output: TotalTime < 3000ms (3 seconds)
4. Alternative: Metro build logs:
   ```
   Metro: Bundling complete in 1200ms
   ```
5. Check for bundle parse time in React Native DevTools profiler
6. Verify no long-running imports block initial render
7. **Pass:** TotalTime < 3000ms

---

### P4 Validation

**Criterion:** Classification and moveset data appear within 60–120 seconds on first install.

**Verification:**
1. Fresh install
2. At T+90s (enrichment still running), navigate to Bulbasaur detail screen
3. Verify classification field is populated (e.g., "Grass Pokémon")
4. Verify moveset has data (at least 1 move listed)
5. Check logs: `[Enrichment] streams running: enrichment + classification + moves`
6. Verify no more than 10 concurrent PokeAPI requests in network logs
7. Cross-check: `SELECT COUNT(*) FROM pokemon_classifications WHERE pokemon_id = 1` → must be >0
8. **Pass:** Data present at T+90s AND concurrent streams visible AND semaphore respected

---

## PART 5: CONSTRAINTS & WHAT NOT TO DO

Learn from prior debugging iterations. These constraints prevent regressions:

### Data Integrity Constraints
- ❌ Do NOT bump `ENRICH_VERSION` to trigger re-enrichment. Data is already written; use `species_enriched` flag instead.
- ❌ Do NOT wipe any enrichment data from the database (pokemon_evolutions, pokemon_classifications, pokemon_moves, etc).
- ❌ Do NOT use `TRUNCATE` or `DELETE` on enrichment tables during normal operation.

### Transaction & Network Constraints
- ❌ Do NOT put network calls inside `withTransactionAsync` blocks. Transactions will timeout waiting for network I/O.
- ❌ Do NOT exceed 10 concurrent PokeAPI requests at any time across all three streams combined. Semaphore is mandatory.
- ❌ Do NOT remove the 50ms rate-limit sleep entirely. PokeAPI enforces rate limits (10 req/sec).

### UI/Animation Constraints
- ❌ Do NOT use `Animated` from react-native for skeleton loaders. Use Reanimated instead (already in dependencies).
- ❌ Do NOT use `useFocusEffect` on list screens. It causes state resets and unwanted re-renders.
- ❌ Do NOT render a global loading banner or modal for enrichment status. Inline placeholders only.

### Architecture Constraints
- ❌ Do NOT redesign the two-phase seed architecture (Phase 1: bundled data, Phase 2: network fetches).
- ❌ Do NOT split the PokeAPI enrichment into a background service or separate thread. Keep it in-process during app startup.
- ❌ Do NOT add new enrichment fields without updating the corresponding `*_backfill` logic and `sync_metadata` gates.

### Logging & Observability
- ❌ Do NOT add `console.log` for every network request. Use structured logging with a namespace (e.g., `[Database]`, `[Enrichment]`).
- ❌ Do NOT log sensitive data (API responses in full). Log only metrics and flow indicators.

---

## PART 6: IMPLEMENTATION ROADMAP

### Phase 1: P0 — Cache Miss Fix (Prerequisite for all others)

1. Add `species_enriched` column migration
2. Update cache-skip logic in `prefetchPokeApiSpeciesData`
3. Add write logic to set `species_enriched = 1` after fetch
4. Test: Verify second-run enrichment fetches 0 species

**Dependencies:** None
**Blocking:** All other fixes benefit from this but can proceed in parallel

### Phase 2: P1 — Batching & Conditional Sleep

1. Implement `batchFetch` utility function
2. Update `prefetchPokeApiIds` to use batching
3. Update `prefetchPokeApiSpeciesData` to use batching
4. Update `prefetchPokemonMoveset` to use batching
5. Move 50ms sleep to network-only (inside fetch, not after cache hit)
6. Test: Verify first-run completes in <120s

**Dependencies:** P0 recommended (not blocking)
**Blocking:** P2 (progress indication benefits from faster enrichment)

### Phase 3: P4 — Concurrent Streams with Semaphore

1. Implement semaphore module
2. Remove calls to `runClassificationBackfill` and `runMovesBackfill` from inside `enrichDatabaseAsync`
3. Add fire-and-forget calls in caller (`seedDatabase` or init function)
4. Wrap all PokeAPI network calls with semaphore
5. Test: Verify classification/moves data at T+90s

**Dependencies:** P0 and P1 recommended (not blocking)
**Blocking:** P2 (needs concurrent classification/moves)

### Phase 4: P2 — Progress Indication

1. Create `useEnrichmentStatus` hook
2. Add skeleton/placeholder components with Reanimated
3. Integrate into Pokemon detail screen (classification + moveset fields)
4. Test: Verify skeletons appear and disappear automatically

**Dependencies:** P4 (needs concurrent backfills)
**Requires for full effect:** P1 (faster enrichment, clearer progress)

### Phase 5: P3 — Bundle Parse Optimization

1. Verify Hermes is enabled in `app.json`
2. Enable `inlineRequires: true` in `metro.config.js`
3. Audit root import chain and move heavy modules to lazy imports
4. Measure cold launch time
5. Iterate on lazy imports until <3s target is met

**Dependencies:** None (independent fix)
**Blocking:** Nothing (pure optimization)

---

## PART 7: ROLLOUT STRATEGY

### Development Phase
- [ ] Implement P0 (prerequisite, unblocks testing)
- [ ] Implement P1 (improves measurable startup time)
- [ ] Implement P4 (enables P2)
- [ ] Implement P2 (improves UX feedback)
- [ ] Implement P3 (pure optimization, can run in parallel)

### Testing Phase
- [ ] Integration test: First-run enrichment on clean device (measure wall-clock time)
- [ ] Regression test: Second-run enrichment (zero network fetches for species)
- [ ] UX test: Detail screen shows skeletons and data without navigation
- [ ] Performance test: Cold launch time on Pixel 4a equivalent
- [ ] Rate-limit test: Monitor peak concurrent requests (must be ≤10)

### Deployment
- [ ] Build with EAS (`eas build --platform android --profile preview`)
- [ ] Test on real device (Pixel 4a, iPhone 12 equivalent)
- [ ] Monitor logs in production for enrichment metrics
- [ ] Confirm all five validation criteria are met

---

## PART 8: ROLLBACK STRATEGY

If any fix causes regression:

| Fix | Rollback Action | Risk Level |
|-----|-----------------|-----------|
| **P0** | Revert `species_enriched` column usage; fall back to legacy cache logic | Low—logic is additive, no breaking changes |
| **P1** | Revert batching to sequential; restore unconditional 50ms sleep | Low—reverts to current behavior |
| **P2** | Remove skeleton loaders; revert to empty fields | Low—UI-only change |
| **P3** | Disable `inlineRequires` in metro.config.js; revert lazy imports | Low—configuration change only |
| **P4** | Restore sequential backfill calls inside enrichment; remove semaphore | Low—reverts to current behavior |

All fixes are non-breaking and can be rolled back independently by reverting commits.

---

## DOCUMENT HISTORY

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-07-13 | Initial specification for all five fixes |

---

**END OF SPECIFICATION**

*This document is complete and ready for implementation. All five fixes are specified with enough detail for an engineer to implement without ambiguity. Validation criteria are measurable and verifiable through logs and queries.*
