# Production-Grade List Screen Architecture Specification
## ChampionDex / Pokédex Multi-Tab Search System

**Document Status:** DRAFT FOR EXPERT REVIEW  
**Date:** 2026-07-10  
**Audience:** React Native / Expo 57.0.4 expert architect  
**Problem Statement:** TextInput blur on list updates; inconsistent search debouncing across screens; risky conditional unmounting of list components  

---

## EXECUTIVE SUMMARY

This specification proposes a redesigned architecture for the four main list screens (Pokémon, Moves, Abilities, Items) in ChampionDex. The core issue is that typing in the search TextInput causes keyboard blur when the list updates—a symptom of component remounting or improper state synchronization. Additionally, two screens (Abilities, Items) lack search debouncing, causing excessive query executions on every keystroke.

**Proposed Solution:**
- Extract TextInput to a fixed, non-list-aware component outside ListHeaderComponent
- Standardize 300ms debouncing across all screens
- Replace early-exit conditional rendering with always-mounted FlashList using ListEmptyComponent
- Implement query key separation to prevent false cache invalidation
- Establish clear state ownership and flow patterns to ensure stability across navigation

**Key Decisions Requiring Expert Validation:**
1. TextInput placement strategy (fixed vs. scrolling)
2. keyboardDismissMode behavior on Android vs. iOS
3. Conditional rendering pattern (early exit vs. inline)
4. Query caching strategy with `staleTime: Infinity`
5. Navigator screen unmounting behavior and its impact on state preservation

---

## PART 1: CURRENT STATE & ROOT CAUSES

### 1.1 Problem Manifestation

**Observed Behavior:**
- User types in search TextInput (e.g., "charmander")
- After 300ms (or immediately on Abilities/Items), query executes
- List updates with new data
- **TextInput loses focus and keyboard dismisses**
- User must tap the input again to continue typing

**On Which Screens:**
- **Pokémon:** Inconsistent blur (happens occasionally)
- **Moves:** Inconsistent blur (less frequent)
- **Abilities:** Frequent blur (no debounce, every keystroke)
- **Items:** Frequent blur (no debounce, every keystroke)

### 1.2 Root Cause Analysis

**The TextInput is rendered inside `ListHeaderComponent`:**

```typescript
// Current pattern (PROBLEMATIC)
<FlashList
  ListHeaderComponent={
    <View>
      <SearchHeader
        value={search}
        onChangeText={setSearch}
        {...props}
      />
      <SubTabBar {...props} />
      <Toolbar {...props} />
    </View>
  }
  renderItem={renderItem}
  {...flashListProps}
/>
```

**Why this causes blur on list update:**

1. When `setSearch(newText)` fires, parent component state updates
2. Parent re-renders, including `ListHeaderComponent` function call
3. `ListHeaderComponent` is remounted by FlashList (it's a new object reference each render)
4. React unmounts the old TextInput and mounts a new one
5. The new TextInput is not focused, so keyboard dismisses
6. **Compounded when:** Query fires → list updates → FlashList detects data change → triggers virtual scroll recalculation → Header re-renders again

**The Debouncing Gap:**

- **Pokémon & Moves:** Have `useDebounce` → query doesn't fire immediately → fewer re-renders
- **Abilities & Items:** No debounce → query fires on EVERY keystroke → many parent re-renders in quick succession → TextInput blurs on almost every keystroke

### 1.3 Why Early-Exit Conditional Rendering Compounds This

```typescript
// Current pattern (SECONDARY ISSUE)
if (isLoading) {
  return <SafeAreaView><LoadingSpinner/></SafeAreaView>;
}

if (error) {
  return <SafeAreaView><EmptyState/></SafeAreaView>;
}

return <SafeAreaView><FlashList/></SafeAreaView>;
```

**Problems:**
- When `isLoading` changes from true → false, the entire component tree unmounts and remounts
- TextInput state is lost
- Scroll position resets
- If query debounce delay aligns with user typing, they see loading state flash, triggering unmount

**Better Pattern (used in Moves screen):**
```typescript
{error ? (
  <EmptyState/>
) : (
  <FlashList
    ListEmptyComponent={
      isLoading ? <LoadingSpinner/> : <EmptyState/>
    }
  />
)}
```

This keeps FlashList mounted, only swaps the component shown inside it.

---

## PART 2: PROPOSED ARCHITECTURE

### 2.1 High-Level Design Principles

1. **TextInput must NEVER remount** from query results or search state changes
2. **Search state updates and query executions must be decoupled** via debouncing
3. **List must stay mounted** during loading/error transitions; only component shown inside it changes
4. **Consistent patterns** across all four screens
5. **Clear state ownership:** Parent owns search value; TextInput is controlled
6. **Navigator behavior respected:** Screens can unmount when user navigates away, but not from internal state changes

### 2.2 Component Hierarchy (Detailed)

```
┌─────────────────────────────────────────────────────────────┐
│ ROOT LAYOUT (app/_layout.tsx)                               │
│  QueryClientProvider                                         │
│  GestureHandlerRootView                                      │
│   Stack screenOptions={{headerShown: false}}                │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────────────┐
│ MAIN TAB LAYOUT (app/(main)/_layout.tsx)                    │
│  Tabs (3: Pokédex, Teams, Settings)                         │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────┴────────────────────────────────────────┐
│ POKEDEX STACK LAYOUT (app/(main)/(pokedex)/_layout.tsx)    │
│  Stack screenOptions={{contentStyle, headerStyle}}          │
│   Keeps screens mounted when navigating between tabs         │
└────────────┬────────────────────────────────────────────────┘
             │
    ┌────────┴──────────┬──────────────┬──────────────┐
    │                   │              │              │
    ▼                   ▼              ▼              ▼
┌─────────────┐  ┌──────────────┐ ┌──────────┐ ┌──────────┐
│ POKEMON     │  │ MOVES        │ │ABILITIES │ │ ITEMS    │
│ index.tsx   │  │ moves.tsx    │ │abilities.│ │ items.ts │
│             │  │              │ │tsx       │ │x         │
│             │  │              │ │          │ │          │
└─────────────┘  └──────────────┘ └──────────┘ └──────────┘
    │                │              │              │
    │                │              │              │
    ▼                ▼              ▼              ▼
 LAYOUT_V2       LAYOUT_V2      LAYOUT_V2      LAYOUT_V2
```

### 2.3 SCREEN LAYOUT PATTERN (All Screens)

```
┌──────────────────────────────────────────────────────────┐
│ SafeAreaView (edges: ['left', 'right'])                 │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ SEARCH SECTION (NEVER UNMOUNTS) [LAYOUT_V2]        │ │
│  │  - SearchHeader (receives search, setSearch)       │ │
│  │    → TextInput (controlled, responds to parent)    │ │
│  │  - Rendered OUTSIDE FlashList                      │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ SUB-TAB SECTION (SCROLLS WITH LIST) [LIST_HEADER]  │ │
│  │  - SubTabBar (memoized if props stable)            │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ TOOLBAR SECTION (SCROLLS WITH LIST) [LIST_HEADER]  │ │
│  │  - Filter & Sort buttons                           │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ FLASHLIST (always mounted)                         │ │
│  │  - ListHeaderComponent: Only SubTabBar + Toolbar   │ │
│  │  - renderItem: Row component (stable)              │ │
│  │  - ListEmptyComponent: Loading/Empty/Error states  │ │
│  │  - keyboardDismissMode: "interactive"              │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ FILTER/SORT SHEET (Modal, outside SafeAreaView)   │ │
│  │  - Controlled visibility from parent state         │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**CRITICAL DECISION POINT:**
- Is SearchHeader (TextInput) rendered **INSIDE SafeAreaView but OUTSIDE FlashList** (recommended)?
- Or **INSIDE ListHeaderComponent** (current, problematic)?

**Recommendation:** OUTSIDE FlashList, but INSIDE SafeAreaView
- Ensures TextInput never remounts from FlashList re-renders
- Keyboard stays visible while typing
- TextInput can be easily cleared programmatically
- Trade-off: Must manually handle edge spacing; less trivial layout

---

## PART 3: STATE OWNERSHIP & FLOW

### 3.1 Search State Flow (Detailed Diagram)

```
┌─────────────────────────────────────────────────────────────────┐
│ SCREEN COMPONENT (e.g., PokedexScreen)                          │
│                                                                  │
│  const [search, setSearch] = useState('');                      │
│  const debouncedSearch = useDebounce(search, 300);              │
│                                                                  │
│  const {data, isLoading, error} = useQuery({                    │
│    queryKey: ['pokemon', 'list', debouncedSearch, ...],         │
│    queryFn: () => queryFn(debouncedSearch, ...)                │
│  });                                                             │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Event: User types 'char' into TextInput                 │   │
│  │ ▼                                                         │   │
│  │ onChangeText={setSearch} fires                           │   │
│  │ search = 'char'                                          │   │
│  │ Component re-renders                                     │   │
│  │ ▼                                                         │   │
│  │ useDebounce sees new search value                        │   │
│  │ Timer starts (300ms)                                     │   │
│  │ debouncedSearch UNCHANGED = '' (still)                   │   │
│  │ No query key change, no re-render                        │   │
│  │ ▼                                                         │   │
│  │ (User continues typing during 300ms delay)              │   │
│  │ setSearch fires again: 'char' → 'chara'                 │   │
│  │ Old timer cleared, new timer starts                      │   │
│  │ debouncedSearch still UNCHANGED                          │   │
│  │ ▼                                                         │   │
│  │ (300ms passes from last keystroke)                       │   │
│  │ Timer completes                                          │   │
│  │ debouncedSearch = 'chara'                                │   │
│  │ Query key changes, TanStack Query fires queryFn          │   │
│  │ ▼                                                         │   │
│  │ queryFn returns filtered/sorted data                     │   │
│  │ Component re-renders with new data                       │   │
│  │ ListHeaderComponent DOES NOT change                      │   │
│  │ FlashList re-renders with new items only                │   │
│  │ SearchHeader re-renders but TextInput focus PRESERVED    │   │
│  │ ▼                                                         │   │
│  │ User continues typing: 'chara' → 'charma' → 'charmand'  │   │
│  │ New debounce cycle starts                                │   │
│  │ ▼                                                         │   │
│  │ Final query fires with 'charmander'                      │   │
│  │ List updates smoothly                                    │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 State Variables per Screen (FINAL PATTERN)

#### POKÉMON SCREEN
```typescript
// Search & Filter State (owned by PokedexScreen)
const [search, setSearch] = useState('');
const debouncedSearch = useDebounce(search, 300);
const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
const [selectedGeneration, setSelectedGeneration] = useState<number | undefined>();
const [typeFilterMode, setTypeFilterMode] = useState<'or' | 'and'>('or');

// UI State (owned by PokedexScreen)
const [sortBy, setSortBy] = useState<PokemonSortBy>('dex');
const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
const [filterSheetVisible, setFilterSheetVisible] = useState(false);

// Query (driven by debouncedSearch, NOT search)
const { data, isLoading, error } = usePokemonList({
  search: debouncedSearch,          // ← DEBOUNCED
  types: selectedTypes,
  sortBy,
  sortDirection,
  generation: selectedGeneration,
  typeFilterMode,
});
```

#### MOVES SCREEN
```typescript
const [search, setSearch] = useState('');
const debouncedSearch = useDebounce(search, 300);      // ← ADD IF MISSING
const [selectedType, setSelectedType] = useState<string | undefined>();
const [selectedCategory, setSelectedCategory] = useState<MoveCategory | undefined>();
const [sortBy, setSortBy] = useState<'name' | 'power' | 'pp'>('name');
const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
const [filterSheetVisible, setFilterSheetVisible] = useState(false);

const { data, isLoading, error } = useMovesList({
  search: debouncedSearch,          // ← DEBOUNCED
  type: selectedType,
  category: selectedCategory,
  sortBy,
  sortDirection,
});
```

#### ABILITIES SCREEN
```typescript
const [search, setSearch] = useState('');
const debouncedSearch = useDebounce(search, 300);      // ← ADD (CURRENTLY MISSING)
const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

const { data, isLoading, error } = useAbilitiesList({
  search: debouncedSearch,          // ← CHANGE from search to debouncedSearch
  sortDirection,
});
```

#### ITEMS SCREEN
```typescript
const [search, setSearch] = useState('');
const debouncedSearch = useDebounce(search, 300);      // ← ADD (CURRENTLY MISSING)
const [selectedCategory, setSelectedCategory] = useState<ItemCategory | undefined>();
const [sortBy, setSortBy] = useState<'name' | 'category'>('name');
const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
const [filterSheetVisible, setFilterSheetVisible] = useState(false);

const { data, isLoading, error } = useItemsList({
  search: debouncedSearch,          // ← CHANGE from search to debouncedSearch
  category: selectedCategory,
  sortBy,
  sortDirection,
});
```

### 3.3 Key Principle: Query Key Isolation

**Problem:** If query key includes `search` (raw value), query fires on every keystroke even with debouncing.

**Solution:** Query key MUST include only `debouncedSearch`, not `search`.

```typescript
// ✗ WRONG (query fires on every keystroke)
const { data } = useQuery({
  queryKey: ['pokemon', search, types, ...],  // search changes fast
  queryFn: async () => { /* ... */ }
});

// ✓ CORRECT (query fires only after 300ms debounce)
const { data } = useQuery({
  queryKey: ['pokemon', debouncedSearch, types, ...],  // debouncedSearch changes slowly
  queryFn: async () => { /* ... */ }
});
```

---

## PART 4: COMPONENT STRUCTURE (DETAILED)

### 4.1 POKÉMON SCREEN - LAYOUT_V2 (Reference Implementation)

```typescript
export default function PokedexScreen() {
  const router = useRouter();
  
  // ═══════════════════════════════════════════════════════════════
  // STATE OWNERSHIP
  // ═══════════════════════════════════════════════════════════════
  
  // Search state (raw input value)
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  
  // Filter state
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedGeneration, setSelectedGeneration] = useState<number | undefined>();
  const [typeFilterMode, setTypeFilterMode] = useState<'or' | 'and'>('or');
  
  // UI state
  const [sortBy, setSortBy] = useState<PokemonSortBy>('dex');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  
  // ═══════════════════════════════════════════════════════════════
  // QUERY (depends on debouncedSearch, NOT search)
  // ═══════════════════════════════════════════════════════════════
  
  const { data, isLoading, error } = usePokemonList({
    search: debouncedSearch,
    types: selectedTypes as PokemonType[],
    sortBy,
    sortDirection,
    generation: selectedGeneration,
    typeFilterMode,
  });
  
  // ═══════════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════
  
  const handleSearchChange = useCallback((text: string) => {
    setSearch(text);  // Update raw search (triggers debounce)
  }, []);
  
  const handleTypeToggle = useCallback((type: string) => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  }, []);
  
  const handlePokemonPress = useCallback((pokemonId: number) => {
    router.push(`/(main)/(pokedex)/${pokemonId}`);
  }, [router]);
  
  const handleClearSearch = useCallback(() => {
    setSearch('');
  }, []);
  
  const handleTabPress = useCallback((tab: string) => {
    router.navigate(tab as any);
  }, [router]);
  
  // ═══════════════════════════════════════════════════════════════
  // RENDER FUNCTIONS (memoized)
  // ═══════════════════════════════════════════════════════════════
  
  const renderPokemonCard = useCallback(
    ({ item }: { item: Pokemon }) => (
      <PokemonCard
        pokemon={item}
        onPress={() => handlePokemonPress(item.id)}
        sortBy={sortBy}
      />
    ),
    [handlePokemonPress, sortBy]
  );
  
  const renderHeader = useMemo(
    () => (
      <View>
        <SubTabBar activeTab="pokemon" onTabPress={handleTabPress} />
        
        <View style={styles.toolbar}>
          <Pressable
            style={styles.filterButton}
            onPress={() => setFilterSheetVisible(true)}
          >
            <Text style={styles.filterButtonText}>
              Filter & Sort {activeFilterCount > 0 && `(${activeFilterCount})`}
            </Text>
          </Pressable>
          
          <Pressable
            style={styles.directionButton}
            onPress={() => setSortDirection(d => d === 'asc' ? 'desc' : 'asc')}
          >
            <Text style={styles.directionButtonText}>
              {sortDirection === 'asc' ? '↑' : '↓'}
            </Text>
          </Pressable>
        </View>
      </View>
    ),
    [activeFilterCount, handleTabPress, sortDirection]
  );
  
  // ═══════════════════════════════════════════════════════════════
  // RENDER: MAIN LAYOUT
  // ═══════════════════════════════════════════════════════════════
  
  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      {/* 
        SEARCH SECTION: OUTSIDE FLASHLIST
        ✓ Never remounts from data updates
        ✓ TextInput focus preserved during query execution
        ✓ Controlled by parent state
      */}
      <SearchHeader
        title="Pokédex"
        value={search}
        onChangeText={handleSearchChange}
        placeholder="Search Pokémon..."
      />
      
      {/* 
        LIST SECTION: ALWAYS MOUNTED
        ✓ Conditional rendering INSIDE via ListEmptyComponent
        ✓ No early-exit unmounting
        ✓ Scroll position preserved across loading states
      */}
      <FlashList
        data={data ?? []}
        renderItem={renderPokemonCard}
        keyExtractor={(item: Pokemon) => String(item.id)}
        estimatedItemSize={84}
        keyboardDismissMode="interactive"
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          error ? (
            <EmptyState
              message="Failed to load Pokédex"
              subMessage={error.message}
            />
          ) : isLoading ? (
            <LoadingSpinner message="Loading Pokédex..." />
          ) : (
            <EmptyState
              message="No Pokémon found"
              subMessage="Try adjusting your filters or search"
            />
          )
        }
        scrollEnabled={true}
      />
      
      {/* MODALS: Outside main layout */}
      <FilterSortSheet
        visible={filterSheetVisible}
        onClose={() => setFilterSheetVisible(false)}
        onApply={(filters) => {
          // Handle filters
        }}
      />
    </SafeAreaView>
  );
}
```

**Key Changes from Current Implementation:**
1. ✓ `SearchHeader` moved OUTSIDE `FlashList`
2. ✓ All handlers wrapped with `useCallback` for stability
3. ✓ `renderPokemonCard` wrapped with `useCallback` (not inline)
4. `renderHeader` wrapped with `useMemo` (prevents header remount)
5. ✓ Conditional rendering moved inside `ListEmptyComponent`
6. ✓ Query uses `debouncedSearch`, not `search`
7. ✓ `data ?? []` to handle undefined safely

---

### 4.2 MOVES SCREEN - LAYOUT_V2 (Similar to Pokémon)

**Key Differences from Pokémon:**
1. Moves currently has `useCallback` for many handlers → keep this pattern
2. `MovesListHeader` component is memoized → can be extracted as separate component in LAYOUT_V2
3. Currently uses debouncing → verify it's using `debouncedSearch` in query key

**Changes Required:**
1. Verify query key includes `debouncedSearch`, not `search`
2. Extract `SearchHeader` OUTSIDE `FlashList`
3. Move `MovesListHeader` memoization logic to ensure it receives stable props
4. Replace early-exit pattern with `ListEmptyComponent`

---

### 4.3 ABILITIES SCREEN - LAYOUT_V2

**Current Issues:**
- No debouncing on search
- Early-exit conditional rendering on `isLoading` and `error`

**Changes Required:**
1. ✓ ADD: `const debouncedSearch = useDebounce(search, 300);`
2. ✓ CHANGE: `useAbilitiesList({ search: debouncedSearch, ... })` instead of raw `search`
3. ✓ CHANGE: Move `SearchHeader` OUTSIDE `FlashList`
4. ✓ CHANGE: Replace early-exit rendering with `ListEmptyComponent`

---

### 4.4 ITEMS SCREEN - LAYOUT_V2

**Current Issues:**
- No debouncing on search
- Early-exit conditional rendering

**Changes Required:**
1. ✓ ADD: `const debouncedSearch = useDebounce(search, 300);`
2. ✓ CHANGE: `useItemsList({ search: debouncedSearch, ... })` instead of raw `search`
3. ✓ CHANGE: Move `SearchHeader` OUTSIDE `FlashList`
4. ✓ CHANGE: Replace early-exit rendering with `ListEmptyComponent`

---

## PART 5: NAVIGATOR STRUCTURE & SCREEN MOUNTING

### 5.1 Navigator Hierarchy (Unchanged)

```
Root (Stack)
  └─ (main) (Tabs)
     ├─ (pokedex) (Stack)
     │  ├─ index.tsx (Pokémon)
     │  ├─ moves.tsx (Moves)
     │  ├─ abilities.tsx (Abilities)
     │  ├─ items.tsx (Items)
     │  └─ [id].tsx (Detail page)
     ├─ (team) (Stack)
     │ └─ ...
     └─ (settings) (Stack)
        └─ ...
```

### 5.2 Screen Mounting Behavior

**CRITICAL:** Expo Router keeps Stack screens mounted when navigating between them.

**Implications for Search State:**

```
User Path 1: Pokemon → Moves → Pokemon
│
├─ Pokemon screen mounts, creates search state
├─ User types "char", debouncedSearch → query executes
├─ User navigates to Moves (Pokemon screen STAYS MOUNTED in background)
├─ User navigates back to Pokemon
└─ Pokemon screen is STILL MOUNTED, search state preserved ✓

User Path 2: Pokemon → Pokedex Tab → Pokedex Tab (refocus)
│
├─ Pokemon screen mounts
├─ User navigates away from Pokedex tab (to Teams)
├─ Pokedex stack may be suspended or unmounted
├─ User navigates back to Pokedex tab
└─ Unclear whether Pokemon state is preserved (NEEDS EXPERT VALIDATION)
```

**DECISION POINT FOR EXPERT:**
- Should filter state (selectedTypes, selectedGeneration, etc.) persist when user navigates to another tab and returns?
- Current code has removed `useFocusEffect` that was resetting state—this suggests persistence is desired
- If persistence is desired, NO additional changes needed
- If fresh state on tab return is desired, may need to add `useFocusEffect` or other lifecycle hook

---

## PART 6: QUERY CLIENT CONFIGURATION

### 6.1 Current Configuration (app/_layout.tsx)

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,           // Data never marked stale automatically
      gcTime: 1000 * 60 * 30,       // Cache cleared after 30 min of no subscribers
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    },
  },
});
```

### 6.2 Analysis

**Good:**
- `staleTime: Infinity` prevents unnecessary background refetches
- `gcTime: 30m` allows cache to survive screen unmounting
- `refetchOn*: false` prevents unwanted background queries

**Potential Issues:**
- With `staleTime: Infinity`, if query result changes externally (e.g., server update), app won't refresh
- No recovery mechanism if query data becomes stale
- May need to add `queryFn`-level caching if result computation is expensive

**DECISION POINT:**
- Is current configuration acceptable, or should `staleTime` be finite (e.g., 5 minutes)?
- Are there scenarios where external data changes and app should refresh?

**Recommendation:** Keep `staleTime: Infinity` for now; add manual refetch buttons if needed later.

---

## PART 7: TEXTINPUT & KEYBOARD BEHAVIOR

### 7.1 keyboardDismissMode Analysis

**Current State:**
```
Pokemon:   keyboardDismissMode="interactive"
Moves:     keyboardDismissMode="interactive"
Abilities: keyboardDismissMode="on-drag"
Items:     keyboardDismissMode="on-drag"
```

**Behavior Differences:**
- `"interactive"`: Keyboard dismisses on pan gesture (drag to scroll)
- `"on-drag"`: Keyboard dismisses immediately on any drag

**EXPERT DECISION REQUIRED:**
1. Should all screens use `"interactive"` for consistency?
2. On Android, does `"interactive"` feel responsive enough?
3. Should keyboard stay visible during typing and list scrolls?

**Recommendation:** Standardize to `"interactive"` across all screens for consistent UX.

### 7.2 TextInput Focus Management

**With New Architecture:**
- TextInput is mounted once (outside FlashList)
- Focus is preserved across list updates
- User can type continuously without blur

**Potential Issues:**
- If SearchHeader component is memoized with strict props, it might not re-render with new search value
- Must ensure `value={search}` prop changes trigger re-render

**Solution in Place:**
```typescript
<SearchHeader
  title="Pokédex"
  value={search}          // ← Changes on every keystroke
  onChangeText={setSearch}
  placeholder="Search Pokémon..."
/>
```

Since `value` changes frequently, SearchHeader will re-render. React.memo will NOT prevent this (prop changed). ✓

---

## PART 8: QUERY HOOKS IMPLEMENTATION

### 8.1 Hook Signature Requirements

**Each hook must accept `search` parameter (debounced):**

```typescript
// usePokemonList (CORRECT)
function usePokemonList(options: {
  search: string;         // ← MUST use this, not raw search
  types: PokemonType[];
  sortBy: PokemonSortBy;
  sortDirection: 'asc' | 'desc';
  generation?: number;
  typeFilterMode: 'or' | 'and';
}): UseQueryResult<Pokemon[]> {
  return useQuery({
    queryKey: [
      'pokemon',
      'list',
      options.search,          // ← Debounced search
      options.types.join(','),
      options.sortDirection,
      options.sortBy,
      options.generation,
      options.typeFilterMode,
    ],
    queryFn: async () => {
      // Fetch all Pokemon
      // Filter by generation
      // Filter by types (OR/AND logic)
      // Apply fuzzy search using Fuse.js
      // Sort
      // Return results
    },
  });
}
```

### 8.2 Query Execution Timeline

**With Debouncing:**
```
t=0ms:   User types "c"
         → setSearch('c')
         → search state updates
         → useDebounce starts 300ms timer
         → debouncedSearch unchanged, query key unchanged
         → No query executed

t=100ms: User types "h"
         → setSearch('ch')
         → Old debounce timer cleared, new timer starts
         → debouncedSearch unchanged
         → No query executed

t=300ms: Timer expires
         → debouncedSearch = 'ch'
         → Query key changes
         → usePokemonList queryFn executes
         → Results arrive

t=350ms: User types "a"
         → setSearch('cha')
         → New debounce timer starts
         → debouncedSearch unchanged
         → No query executed

t=650ms: Timer expires
         → debouncedSearch = 'cha'
         → Query executes again
```

**Without Debouncing (current Abilities/Items):**
```
t=0ms:   User types "c"
         → setSearch('c')
         → search state updates
         → Query key includes search = 'c'
         → Query executes immediately ✗

t=100ms: User types "h"
         → setSearch('ch')
         → Query key changes
         → Query executes immediately ✗

t=200ms: User types "a"
         → setSearch('cha')
         → Query key changes
         → Query executes immediately ✗
```

**Impact on TextInput Blur:**
- With debouncing: 1 query execution per 3 keystrokes → 1 list update → 1 parent re-render → TextInput focus preserved
- Without debouncing: 3 query executions per 3 keystrokes → 3 list updates → many parent re-renders → TextInput blurs on each update

---

## PART 9: CONDITIONAL RENDERING PATTERN

### 9.1 Current Problematic Pattern (Pokemon/Abilities/Items)

```typescript
if (isLoading) {
  return <SafeAreaView><LoadingSpinner/></SafeAreaView>;
}

if (error) {
  return <SafeAreaView><EmptyState/></SafeAreaView>;
}

return <SafeAreaView><FlashList/></SafeAreaView>;
```

**Problems:**
- Returns different component based on state
- React unmounts entire tree when transitioning between branches
- TextInput, scroll position, list render state all lost
- Jarring visual transition

### 9.2 Recommended Pattern (Moves has this)

```typescript
return (
  <SafeAreaView style={styles.container}>
    <SearchHeader {...props} />
    
    <FlashList
      data={data ?? []}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      ListEmptyComponent={
        error ? (
          <EmptyState message="Error" subMessage={error.message} />
        ) : isLoading ? (
          <LoadingSpinner message="Loading..." />
        ) : (
          <EmptyState message="No results" />
        )
      }
      {...flashListProps}
    />
  </SafeAreaView>
);
```

**Benefits:**
- FlashList always mounted
- ListEmptyComponent conditionally renders based on state
- Smooth transitions, no unmounting
- TextInput focus preserved

---

## PART 10: IMPLEMENTATION CHECKLIST

### Phase 1: Refactor Search State & Debouncing (All Screens)

- [ ] **Pokémon Screen**
  - [ ] Verify `useDebounce` is imported
  - [ ] Verify query uses `debouncedSearch` in key
  - [ ] Extract `SearchHeader` outside `FlashList`
  - [ ] Add `useCallback` to all handlers
  - [ ] Replace early-exit rendering with `ListEmptyComponent`

- [ ] **Moves Screen**
  - [ ] Verify `useDebounce` is imported
  - [ ] Verify query uses `debouncedSearch` in key
  - [ ] Extract `SearchHeader` outside `FlashList`
  - [ ] Keep existing `useCallback` handlers
  - [ ] Replace early-exit rendering with `ListEmptyComponent`

- [ ] **Abilities Screen** ⚠️ HIGH PRIORITY
  - [ ] Import `useDebounce`
  - [ ] Add: `const debouncedSearch = useDebounce(search, 300);`
  - [ ] Change query: `search: debouncedSearch` (not `search`)
  - [ ] Extract `SearchHeader` outside `FlashList`
  - [ ] Replace early-exit rendering with `ListEmptyComponent`
  - [ ] Add `useCallback` to handlers

- [ ] **Items Screen** ⚠️ HIGH PRIORITY
  - [ ] Import `useDebounce`
  - [ ] Add: `const debouncedSearch = useDebounce(search, 300);`
  - [ ] Change query: `search: debouncedSearch` (not `search`)
  - [ ] Extract `SearchHeader` outside `FlashList`
  - [ ] Replace early-exit rendering with `ListEmptyComponent`
  - [ ] Add `useCallback` to handlers

### Phase 2: Standardize keyboardDismissMode

- [ ] Change Abilities & Items from `"on-drag"` to `"interactive"`
- [ ] Verify behavior on Android device

### Phase 3: Test & Validate

- [ ] Test typing in search without blur (all screens)
- [ ] Test filter/sort changes without blur
- [ ] Test navigation between tabs (state persistence)
- [ ] Test error states (ErrorState component shows correctly)
- [ ] Test loading states (LoadingSpinner shows without unmounting list)
- [ ] Test empty states (EmptyState shows when no results)
- [ ] Test on Android primary, iOS secondary
- [ ] Test keyboard behavior on both platforms

---

## PART 11: EXPERT VALIDATION CHECKLIST

**These decisions require Expo/React Native expert sign-off before implementation:**

### Navigation & Screen Lifecycle
- [ ] **Q1:** When user navigates from Pokédex tab to Teams tab and back, should search state persist?
  - **Current:** Yes (no `useFocusEffect` reset)
  - **Expert Input:** Is this the desired behavior?
  
- [ ] **Q2:** Does Expo Router 57.0.4 keep Stack screens mounted when navigating between them in a Tabs layout?
  - **Current Assumption:** Yes, screens stay mounted
  - **Expert Input:** Confirm or correct

### TextInput & Keyboard Behavior
- [ ] **Q3:** Is extracting SearchHeader outside ListHeaderComponent the right approach?
  - **Alternative:** Keep SearchHeader in ListHeaderComponent but memoize differently
  - **Expert Input:** Which is more stable on React Native?

- [ ] **Q4:** Should `keyboardDismissMode` be `"interactive"` or `"on-drag"` on Android?
  - **Current:** Mixed ("interactive" on Pokemon/Moves, "on-drag" on Abilities/Items)
  - **Expert Input:** What's the recommended Android behavior?

- [ ] **Q5:** With `keyboardDismissMode="interactive"`, should the list scroll up when keyboard appears?
  - **Current:** Unknown
  - **Expert Input:** Is this expected behavior?

### State Management & Query Caching
- [ ] **Q6:** Is `staleTime: Infinity` appropriate for this app?
  - **Current:** Yes
  - **Expert Input:** Any concerns with never auto-refreshing cache?

- [ ] **Q7:** Should `SearchHeader` be memoized with `React.memo`?
  - **Current:** Yes, it is
  - **Expert Input:** Will this prevent re-renders when `value` prop changes?

### React 19 Compatibility
- [ ] **Q8:** Are there React 19 beta features we should use here?
  - **Current:** Using standard React 18 patterns
  - **Expert Input:** Any React 19-specific optimizations?

- [ ] **Q9:** Is `useCallback` still necessary in React 19?
  - **Current:** Yes, using it for all handlers
  - **Expert Input:** Should we reduce usage or expand it?

### Layout & SafeAreaView
- [ ] **Q10:** With SearchHeader outside FlashList, should it be inside or outside SafeAreaView?
  - **Current:** Recommendation is inside SafeAreaView but outside FlashList
  - **Expert Input:** Is this correct?

### Conditional Rendering
- [ ] **Q11:** Is the `ListEmptyComponent` pattern reliable for all loading/error states?
  - **Current:** Recommendation is yes
  - **Expert Input:** Any edge cases to watch for?

### Performance
- [ ] **Q12:** With ~1000 Pokemon items, should we implement pagination or server-side search?
  - **Current:** Client-side search + fuzzy filter
  - **Expert Input:** Is this approach acceptable, or should we optimize further?

---

## PART 12: ARCHITECTURAL DECISIONS SUMMARY

| Decision | Recommendation | Rationale | Requires Validation |
|----------|----------------|-----------|---------------------|
| **TextInput Location** | Outside FlashList, inside SafeAreaView | Prevents remount on list update | ✓ YES |
| **Search Debouncing** | 300ms universally | Prevents excessive query execution | ✓ YES (current inconsistent) |
| **Debounce on Abilities** | Add `useDebounce` | No debouncing currently causes blur | ✓ YES |
| **Debounce on Items** | Add `useDebounce` | No debouncing currently causes blur | ✓ YES |
| **Conditional Rendering** | Always-mounted FlashList + ListEmptyComponent | Smoother transitions, preserved scroll/focus | ✓ YES (not universal yet) |
| **Early-Exit Pattern** | Remove from all screens | Causes tree unmounting | ✓ YES |
| **keyboardDismissMode** | Standardize to "interactive" | Consistent UX | ✓ YES |
| **Query Key Structure** | Include `debouncedSearch` not `search` | Prevents cascading re-queries | ✓ NO (clear benefit) |
| **useCallback Usage** | Standardize across screens | Stable function references | ✓ YES (consistency) |
| **SearchHeader Memoization** | Keep `React.memo` | Prevents unnecessary re-renders | ✓ NO (clear benefit) |
| **Query Client staleTime** | Keep `Infinity` | Prevents auto-refresh interruptions | ✓ YES (business logic) |
| **Screen State Persistence** | Persist when navigating away/back | Current code removed useFocusEffect | ✓ YES (UX design) |

---

## PART 13: IMPLEMENTATION PRIORITY

### Tier 1 (CRITICAL - Fix Immediate Blur Issues)
1. Add `useDebounce` to Abilities screen
2. Add `useDebounce` to Items screen
3. Move `SearchHeader` outside `FlashList` on all screens
4. Replace early-exit conditional rendering with `ListEmptyComponent`

### Tier 2 (IMPORTANT - Consistency & Stability)
1. Add `useCallback` to all handlers consistently
2. Standardize `keyboardDismissMode` to `"interactive"`
3. Verify query hooks use `debouncedSearch` in query key

### Tier 3 (NICE-TO-HAVE - Polish)
1. Extract shared search header logic to reusable component
2. Create shared toolbar layout component
3. Add manual refetch buttons if needed
4. Optimize filter sheet rendering

---

## PART 14: RISK ASSESSMENT

### High Risk (Must Validate Before Implementation)
1. **Moving SearchHeader outside FlashList**: Changes fundamental layout structure
   - **Risk:** Layout spacing breaks, TextInput positioning issues
   - **Mitigation:** Test on both Android and iOS before committing
   
2. **Removing early-exit renders**: Changes how loading/error states display
   - **Risk:** Edge cases in state transitions cause blank screens
   - **Mitigation:** Implement ListEmptyComponent carefully, test all state paths

3. **Standardizing keyboardDismissMode**: May affect Android UX
   - **Risk:** Keyboard behavior feels off on Android
   - **Mitigation:** Test on real Android device, gather user feedback

### Medium Risk
1. **Adding useDebounce universally**: Slight latency in search response
   - **Risk:** Users expect instant search feedback
   - **Mitigation:** 300ms delay is imperceptible; if feedback needed, reduce to 200ms

2. **Removing useFocusEffect**: State persistence may not be desired
   - **Risk:** Users expect fresh state on tab return
   - **Mitigation:** Expert decision on desired behavior before implementation

### Low Risk
1. **Adding useCallback**: No behavioral changes, only performance
   - **Risk:** Negligible
   
2. **Query key changes**: Purely internal, no UI changes
   - **Risk:** If query hook isn't updated, will have no effect

---

## APPENDIX A: CODE EXAMPLES

### Example: Pokémon Screen (LAYOUT_V2 Complete)

See Section 4.1 above for full implementation.

### Example: Search Flow with Debounce

```typescript
// BEFORE (problematic)
const [search, setSearch] = useState('');
const { data } = usePokemonList({ search });  // ✗ Query fires on every keystroke

// AFTER (fixed)
const [search, setSearch] = useState('');
const debouncedSearch = useDebounce(search, 300);
const { data } = usePokemonList({ search: debouncedSearch });  // ✓ Query fires after 300ms of inactivity
```

### Example: Conditional Rendering

```typescript
// BEFORE (problematic)
if (isLoading) return <SafeAreaView><LoadingSpinner/></SafeAreaView>;
if (error) return <SafeAreaView><EmptyState/></SafeAreaView>;
return <SafeAreaView><FlashList/></SafeAreaView>;

// AFTER (recommended)
return (
  <SafeAreaView>
    <FlashList
      ListEmptyComponent={
        error ? <EmptyState/> : isLoading ? <LoadingSpinner/> : <EmptyState/>
      }
    />
  </SafeAreaView>
);
```

---

## APPENDIX B: GLOSSARY

- **Debounce:** Delay query execution until user stops typing for Xms
- **Query Key:** TanStack Query cache key; when it changes, a new query executes
- **ListHeaderComponent:** FlashList prop for rendering sticky header above list
- **ListEmptyComponent:** FlashList prop for rendering when data array is empty
- **Early-Exit Render:** Returning different component branches based on state (causes unmounting)
- **Screen Mounting:** React Native navigator keeping screen in memory when navigating away
- **keyboardDismissMode:** How FlashList handles keyboard dismissal during scroll
- **staleTime:** How long TanStack Query considers cached data valid
- **gcTime:** How long TanStack Query keeps unused cached data before garbage collection

---

## DOCUMENT HISTORY

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-07-10 | Claude | Initial audit-based spec document |

---

**END OF SPECIFICATION**

*This document is ready for expert review and validation before implementation begins.*
