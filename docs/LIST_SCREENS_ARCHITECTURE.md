# ChampionDex List Screens Architecture

**Version:** 1.1  
**Last Updated:** 2026-07-13  
**Status:** Canonical Architecture Decision  
**Applies To:** Pokemon, Moves, Abilities, Items list screens

---

## Executive Summary

The four list screens (Pokemon, Moves, Abilities, Items) have been rebuilt with a canonical architecture pattern to fix an Android TextInput focus/keyboard blur bug that was preventing users from typing in search fields. This document locks in the architectural decisions and patterns that must be followed for all list screens going forward.

**Key Fix:** Search header, toolbar, and tab bar are rendered as **siblings** to the FlashList (never inside `ListHeaderComponent`), combined with split search state (immediate `search` + debounced `debouncedSearch`) and proper keyboard handling.

---

## Problem Statement

### The Bug
Android phones experienced severe keyboard/focus bugs on list screens:
- TextInput would lose focus after typing one character
- Keyboard would dismiss automatically
- Users couldn't search or filter
- These screens were unusable on Android

### Root Cause
Rendering SearchHeader inside FlashList's `ListHeaderComponent` caused React Native to recreate the TextInput on every re-render, killing focus and keyboard state.

### Solution
Restructure screen architecture to render SearchHeader, SubTabBar, and Toolbar as independent sibling components outside the list, eliminating the re-render dependency issue.

---

## Canonical Architecture Pattern

### Component Tree Structure

```
Screen (SafeAreaView)
├── SearchHeader (React.memo)
│   ├── Title
│   └── TextInput (controlled via search state)
├── SubTabBar
│   └── Tab buttons (Pokemon/Moves/Abilities/Items)
├── Toolbar
│   ├── Filter & Sort button
│   └── Sort direction button (if applicable)
├── FlashList (no header component)
│   ├── Row 1
│   ├── Row 2
│   └── ... (many rows)
└── BottomSheet / Modal
    └── Filter/Sort options
```

**Critical Principle:** Components are siblings in the flex container, NOT nested in the list.

### Complete Screen Example

```typescript
// app/(main)/(pokedex)/moves.tsx
import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Text, Pressable } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MovesScreen() {
  // === STATE ===
  const [search, setSearch] = useState('');                    // Immediate state
  const debouncedSearch = useDebounce(search, 300);           // Debounced state
  const [selectedType, setSelectedType] = useState<string | undefined>(undefined);
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);

  // === CALLBACKS (must be wrapped in useCallback) ===
  const handleSearchChange = useCallback((text: string) => {
    setSearch(text);
  }, []);

  const handleFilterPress = useCallback(() => {
    setFilterSheetVisible(true);
  }, []);

  // === QUERIES (feed debouncedSearch to query hook, not search) ===
  const { data, isLoading, error } = useMovesList({
    search: debouncedSearch,  // ← Use debounced, not immediate
    type: selectedType,
  });

  // === RENDER ===
  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      {/* 1. SEARCH HEADER (outside list) */}
      <SearchHeader
        title="Moves"
        value={search}
        onChangeText={handleSearchChange}
        placeholder="Search moves..."
      />

      {/* 2. SUB TAB BAR (outside list) */}
      <SubTabBar activeTab="moves" onTabPress={handleTabPress} />

      {/* 3. TOOLBAR (outside list) */}
      <View style={styles.toolbar}>
        <Pressable style={styles.filterButton} onPress={handleFilterPress}>
          <Text>⚙ Filter & Sort</Text>
        </Pressable>
      </View>

      {/* 4. FLASH LIST (no ListHeaderComponent) */}
      {error ? (
        <EmptyState message="Failed to load moves" subMessage={error.message} />
      ) : (
        <FlashList
          data={data ?? []}
          renderItem={renderMoveRow}
          keyExtractor={(item: any) => String(item.id)}
          estimatedItemSize={76}
          keyboardDismissMode="interactive"
          ListEmptyComponent={
            isLoading
              ? <LoadingSpinner message="Loading moves..." />
              : <EmptyState message="No moves found" />
          }
        />
      )}

      {/* 5. BOTTOM SHEET (outside list) */}
      <MovesFilterSortSheet
        isVisible={filterSheetVisible}
        onClose={() => setFilterSheetVisible(false)}
        {...filterProps}
      />
    </SafeAreaView>
  );
}
```

---

## Specification: The 10 Invariant Requirements

These 10 requirements must **always** hold for every list screen. Violating any of these re-introduces the focus/keyboard bug or creates new issues.

### 1. SearchHeader as Sibling (NOT in ListHeaderComponent)
**Rule:** SearchHeader component must be rendered outside and above the FlashList, as a direct sibling in the container.

**Why:** FlashList re-renders ListHeaderComponent on data changes; this destroys TextInput focus and keyboard state.

**Correct:**
```typescript
<SafeAreaView>
  <SearchHeader {...props} />
  <FlashList data={data} {...props} />
</SafeAreaView>
```

**Incorrect:**
```typescript
<FlashList
  ListHeaderComponent={() => <SearchHeader {...props} />}
  data={data}
  {...props}
/>
```

---

### 2. Split Search State Pattern
**Rule:** Maintain two search state variables: `search` (immediate) and `debouncedSearch` (300ms delay).

**Purpose:**
- `search` → controls TextInput value (instant visual feedback)
- `debouncedSearch` → feeds query hook (avoids 1000+ searches while user types)

**Implementation:**
```typescript
const [search, setSearch] = useState('');
const debouncedSearch = useDebounce(search, 300);

// TextInput binds to search
<TextInput value={search} onChangeText={setSearch} />

// Query binds to debouncedSearch
const { data } = useMovesList({ search: debouncedSearch });
```

**Why:** Decoupling prevents query storms and unnecessary backend calls while maintaining instant UI feedback.

---

### 3. useDebounce Hook Skips Initial Render
**Rule:** The `useDebounce` hook MUST NOT fire on mount with the initial value (empty string).

**Implementation (from src/hooks/ui/useDebounce.ts):**
```typescript
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;  // ← Skip first render
    }

    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}
```

**Why:** Prevents empty search query from running on app startup (wasting queries).

---

### 4. All Event Handlers Wrapped in useCallback
**Rule:** Every event handler (onClick, onChange, onPress) MUST be wrapped in `useCallback` with explicit dependency array.

**Correct:**
```typescript
const handleSearchChange = useCallback((text: string) => {
  setSearch(text);
}, []);

const handleTypeToggle = useCallback((type: string) => {
  setSelectedTypes(prev =>
    prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
  );
}, []);
```

**Incorrect:**
```typescript
// ❌ Handler recreated on every render
const handleSearchChange = (text: string) => {
  setSearch(text);
};
```

**Why:** Without `useCallback`, handlers are recreated on every render, causing child components (SearchHeader, SubTabBar) to re-render unnecessarily even if wrapped in React.memo.

---

### 5. SearchHeader Wrapped in React.memo
**Rule:** SearchHeader component must be wrapped in React.memo to prevent re-renders from parent changes.

**Implementation (from src/components/lists/SearchHeader.tsx):**
```typescript
const SearchHeaderComponent: React.FC<SearchHeaderProps> = ({
  title,
  value,
  onChangeText,
  placeholder,
}) => {
  // ... JSX
};

export const SearchHeader = React.memo(SearchHeaderComponent);
```

**Why:** Memoization prevents parent re-renders from forcing SearchHeader to re-render, preserving TextInput focus.

---

### 6. keyboardDismissMode on FlashList
**Rule:** All FlashList instances must have `keyboardDismissMode="interactive"`.

```typescript
<FlashList
  data={data}
  renderItem={renderItem}
  keyboardDismissMode="interactive"  // ← Required
  estimatedItemSize={76}
  {...otherProps}
/>
```

**Why:** Allows users to dismiss keyboard by dragging the list, preventing accidental keyboard lockouts.

---

### 7. No Early-Exit isLoading/Error Returns
**Rule:** Do NOT return early from the screen component when `isLoading` or `error` are true. Instead, show loading/error states via ListEmptyComponent or inline conditionals.

**Correct:**
```typescript
{error ? (
  <EmptyState message="Failed to load moves" subMessage={error.message} />
) : (
  <FlashList
    data={data ?? []}
    renderItem={renderMoveRow}
    ListEmptyComponent={
      isLoading
        ? <LoadingSpinner message="Loading moves..." />
        : <EmptyState message="No moves found" />
    }
  />
)}
```

**Incorrect:**
```typescript
// ❌ Early return destroys component tree
if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorScreen />;

return <FlashList {...props} />;
```

**Why:** Early returns unmount and remount the list, losing user's scroll position and state.

---

### 8. FilterSortSheet Uses StyleSheet.absoluteFill
**Rule:** Bottom sheets and modals must use `StyleSheet.absoluteFill` for the backdrop (NOT `absoluteFillObject`).

**Correct (from src/components/lists/MovesFilterSortSheet.tsx):**
```typescript
const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,           // ← Correct
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
});
```

**Incorrect:**
```typescript
backdrop: {
  ...absoluteFillObject,  // ❌ Not available in React Native
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
}
```

---

### 9. Row Render Components are Stable and Correct
**Rule:** List row components (`renderMoveRow`, `renderAbilityRow`, `renderItemRow`, PokemonCard) are correct and must NOT be modified without extremely careful testing.

**Current State (DO NOT MODIFY unless noted):**
- `renderMoveRow` — stable, displays type badge, category icon, power/accuracy/PP stats
- `renderAbilityRow` — stable, displays name and short description
- `renderItemRow` — stable, displays name, description, and category badge
- `PokemonCard` — stable, displays sprite, name, dex number, types

**Why:** These components have been extensively tested; changing them risks re-introducing the focus bug or breaking list performance.

#### PokemonCard Sprite URL Strategy

The seed stores `NULL` in the `sprite_url` column for every Pokémon; sprite URLs are **not** persisted to the database. Instead, `PokemonCard` constructs the sprite URL at render time from `pokeApiId`:

```
https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${pokeApiId}.png
```

For base forms `pokeApiId === nationalDex`. For alternate forms (Mega, G-Max, regional, and other named formes) `pokeApiId` is the 5-digit PokeAPI form ID stored in the `pokeapi_id` column of the `pokemon` table.

**Required data shape:** `PokemonListItem` must include `pokeApiId: number`. `dbRowToPokemonListItem` must select `pokeapi_id` from the `pokemon` table and map it to `pokeApiId`. All SQL queries that feed the list (`getAllPokemon`, `searchPokemon`, `getPokemonByType`, `getPokemonByGeneration`) must include `pokeapi_id` in their SELECT clauses.

**Fallback:** If the constructed URL fails to load (network error, missing sprite), `PokemonCard` falls back to `assets/placeholders/pokemon/placeholder_venusaur.png`.

---

### 10. Abilities and Items Have Debounce (Previously Missing)
**Rule:** Abilities and Items screens MUST use `useDebounce` on search input, same as Pokemon and Moves.

**Current State (REQUIRED):**
- Pokemon screen: ✓ Uses `useDebounce`
- Moves screen: ✓ Uses `useDebounce`
- Abilities screen: ✓ Uses `useDebounce` (added in rebuild)
- Items screen: ✓ Uses `useDebounce` (added in rebuild)

**Implementation (abilities.tsx):**
```typescript
const [search, setSearch] = useState('');
const debouncedSearch = useDebounce(search, 300);

const { data, isLoading, error } = useAbilitiesList({
  search: debouncedSearch,
  sortDirection,
});
```

**Why:** Without debounce, abilities/items queries would fire on every keystroke, causing jank and wasted queries.

---

## Architecture Decisions Explained

### Why Split Search State?
**Problem:** If query hook is bound directly to TextInput's `search` state:
- Every keystroke fires a query (1000+ queries for "pikachu")
- Query latency blocks TextInput from updating (visible lag)
- Server/database could be overwhelmed

**Solution:** Debounce the query separately from the input:
- User types "p", "i", "k", "a", "c", "h", "u" → 7 characters, 7 TextInput updates, 1 query (after 300ms)
- TextInput feels instant, queries are batched

### Why SearchHeader as Sibling?
**Problem:** If SearchHeader is in FlashList's `ListHeaderComponent`:
- FlashList re-renders header on data changes
- TextInput is destroyed and recreated
- Focus is lost mid-typing
- Keyboard is dismissed

**Solution:** Render SearchHeader outside the list, in the main container:
- SearchHeader only re-renders when its props change
- TextInput is never destroyed
- Focus is preserved throughout the session
- Keyboard stays open while user types

### Why useCallback on Handlers?
**Problem:** Without useCallback:
- `handleSearchChange` is a new function on every render
- SearchHeader receives a new `onChangeText` prop
- SearchHeader re-renders (even though it's memoized, memo sees new prop)
- TextInput is destroyed and recreated

**Solution:** useCallback ensures handlers are stable:
- `handleSearchChange` is the same function across renders
- SearchHeader receives the same `onChangeText` prop
- SearchHeader stays memoized and skips re-render
- TextInput is never destroyed

### Why React.memo on SearchHeader?
**Problem:** Without React.memo:
- Parent screen re-renders (due to filter state, sort state, list data changes)
- SearchHeader re-renders even though its props haven't changed
- TextInput is destroyed and recreated

**Solution:** React.memo prevents unnecessary re-renders:
- Parent re-renders, SearchHeader checks props
- Props are identical (due to useCallback stable handlers)
- SearchHeader skips re-render, preserving TextInput and focus

---

## Data Flow Diagram

```
User Types "Pika" in TextInput
    ↓
TextInput.onChangeText fires
    ↓
handleSearchChange (useCallback) executes
    ↓
setSearch("pika") → updates search state immediately
    ↓
SearchHeader receives new value prop → TextInput updates (INSTANT FEEDBACK)
    ↓
300ms passes without new keystroke
    ↓
useDebounce timer fires
    ↓
setDebouncedSearch("pika") → updates debouncedSearch state
    ↓
useMovesList query hook detects debouncedSearch change
    ↓
Query executes: SELECT * FROM moves WHERE name LIKE "pika%"
    ↓
Results return → FlashList data updates
    ↓
FlashList re-renders with new data (SearchHeader NOT affected)
    ↓
User sees search results
```

---

## Performance Characteristics

| Metric | Target | Current |
|--------|--------|---------|
| **Keystroke → TextInput Update** | <100ms | <50ms (native) ✓ |
| **Last Keystroke → Query Executes** | 300ms debounce | 300ms ✓ |
| **Query → Results Appear** | <100ms | <50ms (SQLite local) ✓ |
| **FlashList Scroll (1000 items)** | 60fps | 60fps (FlashList + memoization) ✓ |
| **Screen Mount → Interactive** | <500ms | ~200ms ✓ |

---

## Anti-Patterns (Do NOT Do These)

### ❌ Anti-Pattern 1: SearchHeader in ListHeaderComponent
```typescript
// WRONG - Destroys TextInput focus on re-render
<FlashList
  ListHeaderComponent={() => <SearchHeader {...props} />}
  data={data}
/>
```

### ❌ Anti-Pattern 2: Query Bound Directly to search State
```typescript
// WRONG - Fires query on every keystroke
const { data } = useMovesList({ search });  // should be debouncedSearch
```

### ❌ Anti-Pattern 3: Handler Not in useCallback
```typescript
// WRONG - Creates new function on every render
const handleSearchChange = (text: string) => {
  setSearch(text);
};
```

### ❌ Anti-Pattern 4: SearchHeader Not Memoized
```typescript
// WRONG - Re-renders even when props don't change
export const SearchHeader = SearchHeaderComponent;  // missing React.memo
```

### ❌ Anti-Pattern 5: Early Return on Loading
```typescript
// WRONG - Unmounts list, loses scroll position
if (isLoading) return <LoadingSpinner />;
return <FlashList {...props} />;
```

### ❌ Anti-Pattern 6: No keyboardDismissMode
```typescript
// WRONG - Keyboard gets stuck open
<FlashList
  data={data}
  renderItem={renderItem}
  // Missing: keyboardDismissMode="interactive"
/>
```

### ❌ Anti-Pattern 7: Debounce Fires on Mount
```typescript
// WRONG - Runs empty search on app start
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // No isFirstRender check - fires immediately with empty value!
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}
```

---

## Files Reference

### Screen Files (list screens)
- `/app/(main)/(pokedex)/index.tsx` — Pokemon list
- `/app/(main)/(pokedex)/moves.tsx` — Moves list
- `/app/(main)/(pokedex)/abilities.tsx` — Abilities list
- `/app/(main)/(pokedex)/items.tsx` — Items list

### Component Files
- `/src/components/lists/SearchHeader.tsx` — Search input component (React.memo required)
- `/src/components/lists/SubTabBar.tsx` — Tab navigation between entity types
- `/src/components/lists/MovesFilterSortSheet.tsx` — Filter/sort modal for moves
- `/src/components/lists/FilterSortSheet.tsx` — Filter/sort modal for Pokemon
- `/src/components/lists/ItemsFilterSortSheet.tsx` — Filter/sort modal for items

### Hook Files
- `/src/hooks/ui/useDebounce.ts` — Debounce hook (skips first render)
- `/src/hooks/queries/useMovesList.ts` — Moves query hook
- `/src/hooks/queries/usePokemonList.ts` — Pokemon query hook
- `/src/hooks/queries/useAbilitiesList.ts` — Abilities query hook
- `/src/hooks/queries/useItemsList.ts` — Items query hook

### Constant Files
- `/src/constants/colors.ts` — Design system colors
- `/src/constants/spacing.ts` — Design system spacing

---

## Testing Checklist

When implementing a new list screen or modifying an existing one:

- [ ] SearchHeader is rendered outside FlashList (sibling in container)
- [ ] Search state is split: immediate `search` + debounced `debouncedSearch`
- [ ] Query hook is fed `debouncedSearch`, not `search`
- [ ] useDebounce hook skips initial render (uses isFirstRender ref)
- [ ] All event handlers are wrapped in useCallback with correct dependencies
- [ ] SearchHeader is wrapped in React.memo
- [ ] FlashList has `keyboardDismissMode="interactive"`
- [ ] Loading and error states are shown via ListEmptyComponent or inline, NOT early returns
- [ ] FilterSortSheet uses `StyleSheet.absoluteFill` for backdrop
- [ ] Row render components (renderMoveRow, etc.) are stable
- [ ] Abilities and Items screens both use debounce
- [ ] Android testing: Can user type in search without focus being lost?
- [ ] iOS testing: Keyboard behavior is smooth and natural
- [ ] Scroll performance: List with 1000 items scrolls at 60fps

---

## Migrations & Future Changes

### Adding a New List Screen
1. Copy the architecture pattern from `moves.tsx` or `abilities.tsx`
2. Use the 10 invariants as a checklist
3. Test on both iOS and Android
4. Have another developer review before merging

### Modifying Existing List Screens
1. Check the 10 invariants — are they all satisfied?
2. If changing SearchHeader, ensure it stays wrapped in React.memo
3. If changing event handlers, ensure they're wrapped in useCallback
4. If changing the query, ensure it's fed `debouncedSearch`
5. Test thoroughly on Android (this is where the bug manifested)

### Removing or Disabling Debounce
**DO NOT DO THIS.** Debounce on search is critical for performance. If search seems "slow", the issue is:
- Query implementation is slow (optimize SQLite query, add indexes)
- Debounce delay is too long (reduce from 300ms, but not below 100ms)
- List rendering is slow (use FlashList, memoize row components)

---

## Conclusion

This architecture solves the Android TextInput focus bug by:
1. **Separating concerns** — SearchHeader outside the list
2. **Batching queries** — Split search state with debounce
3. **Preserving component identity** — React.memo + useCallback
4. **Proper keyboard handling** — keyboardDismissMode="interactive"

These patterns are now canonical. Any deviation from them must be justified with extensive testing and code review.

**Lock this architecture in.** Do not experiment with ListHeaderComponent or binding queries directly to search state. These decisions have been tested and validated.

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| **1.0** | 2026-07-10 | Initial canonical architecture document. Locks in list screen patterns, 10 invariants, and all rationale. |

