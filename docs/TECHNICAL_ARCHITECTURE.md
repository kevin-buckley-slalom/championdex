# ChampionDex Technical Architecture

**Version:** 1.0  
**Last Updated:** July 2026  
**Status:** Architecture Specification

---

## Executive Summary

ChampionDex is a cross-platform Pokemon companion app requiring high-performance list rendering, smooth animations, offline-first data architecture, and native mobile polish. This document specifies the technical foundation for iOS and Android delivery.

**Recommended Stack:**
- **Framework:** Expo (React Native 0.76+, SDK 52+)
- **Data Layer:** SQLite (expo-sqlite) + AsyncStorage (team data)
- **State Management:** Zustand + React Query (TanStack Query)
- **Navigation:** Expo Router v3 (file-based)
- **Animations:** React Native Reanimated 3 + React Native Skia
- **Performance:** FlashList + Hermes engine
- **Images:** expo-image with blurhash
- **Build/Deploy:** EAS Build + EAS Submit

---

## 1. Framework Recommendation: Expo vs Flutter

### Decision: Expo (React Native)

#### Justification for This Project

| Criteria | Expo | Flutter | Winner |
|----------|------|---------|--------|
| **Animation Capability** | Reanimated 3 (60+ FPS), Skia, native access via JSI | Flutter built-in (excellent) | Tie—both excellent |
| **Offline Data (SQLite)** | expo-sqlite, community support | Excellent native support | Flutter slight edge |
| **JavaScript Ecosystem** | npm packages, React ecosystem | Dart ecosystem smaller | Expo |
| **Development Speed** | Hot reload, CNG (Continuous Native Generation), no build waiting | Fast, single SDK | Expo |
| **List Performance (1000+ items)** | FlashList (optimized for RN) | Excellent defaults | Tie |
| **Team Builder Complexity** | React state patterns familiar to most | Dart/Flutter learning curve | Expo |
| **Community/Libraries** | Massive (React + React Native combined) | Growing, solid | Expo |
| **CI/CD Maturity** | EAS Build/Submit battle-tested | Firebase App Distribution | Expo |
| **iOS/Android Parity** | 95%+ code share, careful platform handling | ~98% code share | Flutter slight edge |

**Critical Factors Favoring Expo:**
1. **Rapid iteration:** CNG eliminates native build complexity; prebuild strategy enables instant testing
2. **React ecosystem:** Hundreds of battle-tested packages, team familiarity
3. **Parallax + image animations:** Reanimated 3 + Skia excel at complex view choreography
4. **Offline-first complexity:** AsyncStorage + SQLite patterns are mature in React Native
5. **Performance:** FlashList is specifically optimized for Pokemon-scale lists (1000+)

**Trade-off Accepted:** Flutter has slightly better default performance and type safety; Expo requires more care with memoization and optimization (mitigated via patterns).

---

## 2. Full Project Folder Structure

```
championdex/
├── app/                                    # Expo Router file-based routing
│   ├── _layout.tsx                        # Root layout with auth flow
│   ├── (auth)/                            # Auth tab group
│   │   ├── login.tsx
│   │   └── _layout.tsx
│   ├── (main)/                            # Main app tab group
│   │   ├── _layout.tsx                    # Tab navigation (Pokedex, Team, Settings)
│   │   ├── (pokedex)/
│   │   │   ├── _layout.tsx
│   │   │   ├── index.tsx                  # Pokedex home (list/search)
│   │   │   ├── [id].tsx                   # Pokemon detail (parallax, carousel)
│   │   │   ├── abilities.tsx              # Abilities reference
│   │   │   ├── [abilityId].tsx            # Ability detail
│   │   │   ├── moves.tsx                  # Moves reference
│   │   │   ├── [moveId].tsx               # Move detail
│   │   │   ├── items.tsx                  # Items reference
│   │   │   └── [itemId].tsx               # Item detail
│   │   ├── (team)/
│   │   │   ├── _layout.tsx
│   │   │   ├── index.tsx                  # Team list / editor
│   │   │   └── [teamId].tsx               # Team detail + builder UI
│   │   └── (settings)/
│   │       ├── _layout.tsx
│   │       ├── index.tsx                  # Settings screen
│   │       ├── about.tsx
│   │       └── data-management.tsx
│   └── +not-found.tsx
│
├── src/
│   ├── components/                        # Reusable component library
│   │   ├── common/
│   │   │   ├── SafeAreaView.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   └── TabBar.tsx
│   │   ├── pokemon/
│   │   │   ├── PokemonCard.tsx            # List item card
│   │   │   ├── PokemonParallaxHeader.tsx  # Detail screen header with parallax
│   │   │   ├── ImageCarousel.tsx          # Sprite/artwork cycling
│   │   │   ├── StatBarChart.tsx           # SVG stat visualization
│   │   │   └── RelatedPokemon.tsx
│   │   ├── team/
│   │   │   ├── TeamCard.tsx
│   │   │   ├── PokemonSlotEditor.tsx      # Per-Pokemon team builder UI
│   │   │   ├── StatSliders.tsx
│   │   │   └── MovesetSelector.tsx
│   │   ├── lists/
│   │   │   ├── PokemonList.tsx            # Virtualized list wrapper
│   │   │   ├── SearchHeader.tsx
│   │   │   └── FilterChips.tsx
│   │   └── modals/
│   │       ├── MovePickerModal.tsx
│   │       └── AbilityPickerModal.tsx
│   │
│   ├── hooks/
│   │   ├── queries/
│   │   │   ├── usePokemonList.ts          # React Query hooks
│   │   │   ├── usePokemonDetail.ts
│   │   │   ├── useMovesList.ts
│   │   │   ├── useAbilitiesList.ts
│   │   │   └── useItemsList.ts
│   │   ├── mutations/
│   │   │   ├── useCreateTeam.ts
│   │   │   ├── useUpdateTeam.ts
│   │   │   └── useDeleteTeam.ts
│   │   ├── storage/
│   │   │   ├── useTeamStorage.ts
│   │   │   ├── useLocalDatabase.ts
│   │   │   └── useSyncManager.ts
│   │   └── ui/
│   │       ├── useAnimatedScroll.ts       # Parallax scroll hook
│   │       ├── useImageCarousel.ts
│   │       └── useResponsiveLayout.ts
│   │
│   ├── store/
│   │   ├── authStore.ts                   # Zustand auth + session
│   │   ├── uiStore.ts                     # Zustand UI (theme, layout, search state)
│   │   └── teamBuilderStore.ts            # Zustand team builder temp state
│   │
│   ├── services/
│   │   ├── database/
│   │   │   ├── initializeDatabase.ts      # SQLite setup
│   │   │   ├── pokemonRepository.ts       # SQLite queries
│   │   │   ├── movesRepository.ts
│   │   │   ├── abilitiesRepository.ts
│   │   │   └── itemsRepository.ts
│   │   ├── api/
│   │   │   ├── pokeApiClient.ts           # Axios/fetch with retry
│   │   │   └── interceptors.ts
│   │   ├── sync/
│   │   │   ├── syncManager.ts             # Background sync for initial data load
│   │   │   └── updateChecker.ts
│   │   └── auth/
│   │       ├── authService.ts
│   │       └── secureStorage.ts           # expo-secure-store
│   │
│   ├── types/
│   │   ├── pokemon.ts
│   │   ├── moves.ts
│   │   ├── abilities.ts
│   │   ├── items.ts
│   │   ├── team.ts
│   │   └── index.ts
│   │
│   ├── utils/
│   │   ├── search.ts                      # Fuse.js for client search
│   │   ├── filtering.ts
│   │   ├── formatting.ts
│   │   ├── analytics.ts
│   │   └── errorHandling.ts
│   │
│   ├── constants/
│   │   ├── colors.ts
│   │   ├── spacing.ts
│   │   ├── routes.ts
│   │   └── env.ts
│   │
│   └── db/
│       ├── schema.sql                     # SQLite schema
│       └── migrations.ts                  # Migration runner
│
├── __tests__/                             # Jest + React Native Testing Library
│   ├── unit/
│   │   ├── search.test.ts
│   │   └── filtering.test.ts
│   ├── components/
│   │   ├── PokemonCard.test.tsx
│   │   └── StatBarChart.test.tsx
│   ├── integration/
│   │   ├── teamBuilder.test.tsx
│   │   └── offlineSync.test.ts
│   └── e2e/                               # Maestro or Detox scenarios
│       └── pokedex.flow.yaml
│
├── assets/
│   ├── images/
│   │   ├── logo.png
│   │   ├── placeholder.png
│   │   └── icons/
│   ├── fonts/
│   └── animations/                        # Lottie JSON files (optional)
│
├── app.config.ts                          # Expo config (env, plugins, icons)
├── eas.json                               # EAS Build/Submit config
├── package.json
├── tsconfig.json
├── babel.config.js
├── metro.config.js
├── jest.config.js
├── .env.example
└── README.md
```

---

## 3. Core Dependencies & Justifications

### package.json (Curated Dependencies)

```json
{
  "name": "championdex",
  "version": "0.1.0",
  "expo": "^52.0.0",
  "react": "^18.3.0",
  "react-native": "^0.76.0",
  "typescript": "^5.5.0",

  "dependencies": {
    "expo": "^52.0.0",
    "expo-router": "^3.7.0",
    "expo-sqlite": "^14.0.0",
    "expo-file-system": "^17.0.0",
    "expo-image": "^1.15.0",
    "expo-linear-gradient": "^14.0.0",
    "expo-haptics": "^13.0.0",
    "expo-local-authentication": "^14.0.0",
    "expo-secure-store": "^13.0.0",
    "expo-notifications": "^0.30.0",

    "react-native": "^0.76.0",
    "react-native-reanimated": "^3.14.0",
    "react-native-gesture-handler": "^2.20.0",
    "react-native-skia": "^1.5.0",
    "react-native-svg": "^15.5.0",
    "react-native-safe-area-context": "^4.12.0",

    "@react-native-community/datetimepicker": "^8.2.0",

    "@tanstack/react-query": "^5.60.0",
    "@tanstack/react-query-devtools": "^5.60.0",

    "zustand": "^4.5.5",
    "zustand-middleware-immer": "^2.0.0",

    "fuse.js": "^7.0.0",
    "dayjs": "^1.11.13",
    "lottie-react-native": "^6.10.0",
    "axios": "^1.7.7",
    "uuid": "^9.0.1"
  },

  "devDependencies": {
    "@babel/core": "^7.25.0",
    "@testing-library/react": "^14.1.2",
    "@testing-library/react-native": "^12.4.0",
    "@types/jest": "^29.5.13",
    "@types/react": "^18.3.0",
    "@types/react-native": "^0.76.0",
    "@typescript-eslint/eslint-plugin": "^7.14.0",
    "@typescript-eslint/parser": "^7.14.0",

    "eslint": "^8.57.0",
    "eslint-config-expo": "^8.0.0",
    "eslint-config-prettier": "^9.1.0",
    "prettier": "^3.3.0",

    "jest": "^29.7.0",
    "jest-expo": "^51.0.0",
    "typescript": "^5.5.0",

    "detox": "^20.20.0",
    "detox-cli": "^20.20.0"
  }
}
```

### Dependency Justifications

| Package | Version | Purpose | Justification |
|---------|---------|---------|---------------|
| **expo-router** | 3.7.0+ | File-based navigation | Type-safe routing, automatic deep linking |
| **expo-sqlite** | 14.0.0+ | Offline data layer | 1000+ Pokemon queries, full-text search, offline-ready |
| **react-native-reanimated** | 3.14.0+ | Smooth animations | Parallax scroll, carousel, 60 FPS guaranteed |
| **react-native-skia** | 1.5.0+ | Custom graphics | Stat radar charts, performant SVG rendering |
| **@tanstack/react-query** | 5.60.0+ | Server state | Cache invalidation, background refetch, optimistic updates |
| **zustand** | 4.5.5+ | Client state | Lightweight (auth, UI state, temp team builder) |
| **fuse.js** | 7.0.0+ | Client search | Fast fuzzy search on 1000+ items without network |
| **expo-image** | 1.15.0+ | Image loading | Blurhash support, automatic caching, format optimization |
| **expo-notifications** | 0.30.0+ | Push notifications | iOS/Android notification unified handling |
| **react-native-gesture-handler** | 2.20.0+ | Touch gestures | Swipe, pan, long-press interactions |
| **axios** | 1.7.7+ | HTTP client | Retry logic, interceptors, timeout handling (for future live API calls; not data sync) |
| **@pkmn/data** | Latest | Bundled Pokemon data | Complete, authoritative Pokemon species/moves/abilities/items data; replaces PokeAPI sync |
| **@pkmn/dex** | Latest | Pokedex abstraction | Type-safe access to bundled Pokemon data; filters, queries without network dependency |
| **i18next** / **react-i18next** OR **expo-localization** | Latest | i18n & localization | Translation key system (English-only at launch); ready for future language support |
| **sentry-expo** (post-launch) | Latest | Error telemetry | Crash reporting and diagnostic data (added after MVP release) |
| **uuid** | 9.0.1+ | ID generation | UUID generation for teams, team members (enables future cloud sync) |

---

## 4. Data Architecture

### 4.1 SQLite Schema (Offline Reference Data)

```sql
-- Pokemon table
CREATE TABLE pokemon (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  national_id INTEGER NOT NULL,
  form_type TEXT DEFAULT 'base', -- 'base', 'alolan', 'galarian', 'hisuian', 'mega', 'gigantamax', etc.
  height REAL,
  weight REAL,
  base_experience INTEGER,
  artwork_url TEXT,
  thumbnail_url TEXT,
  official_artwork_url TEXT,
  shiny_artwork_url TEXT,
  species_id INTEGER,
  is_legendary BOOLEAN DEFAULT 0,
  is_mythical BOOLEAN DEFAULT 0,
  generation INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(national_id, form_type) -- True form differences are separate entries
);

-- Note: True form differences (Alolan, Galarian, Hisuian, Mega, Gigantamax, regional variants)
-- are stored as separate Pokemon entries with distinct stats/types/abilities.
-- Cosmetic variants (gender-only differences) are grouped in single entry with UI toggle.

-- Pokemon stats
CREATE TABLE pokemon_stats (
  id INTEGER PRIMARY KEY,
  pokemon_id INTEGER NOT NULL,
  stat_name TEXT NOT NULL,
  base_value INTEGER NOT NULL,
  FOREIGN KEY(pokemon_id) REFERENCES pokemon(id),
  UNIQUE(pokemon_id, stat_name)
);

-- Pokemon types (1-2 per Pokemon)
CREATE TABLE pokemon_types (
  id INTEGER PRIMARY KEY,
  pokemon_id INTEGER NOT NULL,
  type_name TEXT NOT NULL,
  type_order INTEGER,
  FOREIGN KEY(pokemon_id) REFERENCES pokemon(id)
);

-- Pokemon abilities
CREATE TABLE pokemon_abilities (
  id INTEGER PRIMARY KEY,
  pokemon_id INTEGER NOT NULL,
  ability_id INTEGER NOT NULL,
  is_hidden BOOLEAN DEFAULT 0,
  ability_order INTEGER,
  FOREIGN KEY(pokemon_id) REFERENCES pokemon(id),
  FOREIGN KEY(ability_id) REFERENCES abilities(id)
);

-- Abilities reference
CREATE TABLE abilities (
  id INTEGER PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  generation INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Moves reference
CREATE TABLE moves (
  id INTEGER PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  power INTEGER,
  accuracy INTEGER,
  pp INTEGER,
  type TEXT,
  category TEXT,
  description TEXT,
  priority INTEGER DEFAULT 0,
  generation INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pokemon moves (learnset)
CREATE TABLE pokemon_moves (
  id INTEGER PRIMARY KEY,
  pokemon_id INTEGER NOT NULL,
  move_id INTEGER NOT NULL,
  learn_method TEXT,
  learn_level INTEGER,
  FOREIGN KEY(pokemon_id) REFERENCES pokemon(id),
  FOREIGN KEY(move_id) REFERENCES moves(id)
);

-- Items reference
CREATE TABLE items (
  id INTEGER PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  category TEXT,
  description TEXT,
  sprite_url TEXT,
  effect TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Full-text search indexes
CREATE VIRTUAL TABLE pokemon_fts USING fts5(
  name,
  type_name,
  content=pokemon,
  content_rowid=id
);

CREATE VIRTUAL TABLE moves_fts USING fts5(
  name,
  type,
  category,
  content=moves,
  content_rowid=id
);

CREATE VIRTUAL TABLE abilities_fts USING fts5(
  name,
  description,
  content=abilities,
  content_rowid=id
);
```

### 4.2 AsyncStorage Schema (Team & User Data)

**Key Structure (user-specific data persisted in AsyncStorage):**

```typescript
// @team:UUID (e.g., @team:550e8400-e29b-41d4-a716-446655440000)
{
  id: "550e8400-e29b-41d4-a716-446655440000", // UUID for cloud sync readiness
  name: "Competitive 2v2",
  description: "VGC-style team",
  createdAt: "2026-07-01T10:00:00Z",
  updatedAt: "2026-07-09T15:30:00Z",
  slots: [
    {
      id: "550e8400-e29b-41d4-a716-446655440001", // UUID for team member (cloud sync)
      position: 0,
      pokemonId: 25,
      nickname: "Sparky",
      ability: "Static",
      heldItem: "Light Ball",
      moves: [1, 2, 3, 4],  // move IDs
      stats: {
        hp: 35,
        attack: 55,
        defense: 40,
        spAtk: 50,
        spDef: 50,
        speed: 90
      },
      nature: "Timid",
      evs: { hp: 0, attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 252 },
      ivs: { hp: 31, attack: 0, defense: 31, spAtk: 31, spDef: 31, speed: 31 },
      statLevel: 50 // User-selectable: 50 or 100 for stat calculations
    },
    // ... 5 more slots (null if empty)
  ]
}

// @userPreferences
{
  theme: "dark" | "light" | "system",
  language: "en",
  notificationsEnabled: true,
  lastSyncTimestamp: 1720521000000
}
```

**Note:** All IDs are UUIDs (not auto-increment integers) to prepare for future cloud sync in Phase 2+. MVP is local-only, but schema is designed for multi-device sync capabilities.

### 4.3 State Management Patterns

**Zustand Stores:**

```typescript
// auth.store.ts
create((set) => ({
  user: null,
  isAuthenticated: false,
  login: (credentials) => { /* ... */ },
  logout: () => { /* ... */ }
}))

// ui.store.ts
create((set) => ({
  theme: 'dark',
  searchQuery: '',
  activeTab: 'pokedex',
  setSearchQuery: (q) => set({ searchQuery: q }),
  setTheme: (t) => set({ theme: t })
}))

// teamBuilder.store.ts
create((set) => ({
  draftTeam: null,
  editingSlotIndex: null,
  updateSlot: (index, slotData) => { /* ... */ },
  reset: () => set({ draftTeam: null })
}))
```

**React Query Keys:**

```typescript
export const pokemonKeys = {
  all: ['pokemon'],
  list: () => [...pokemonKeys.all, 'list'],
  listFiltered: (filters) => [...pokemonKeys.list(), filters],
  detail: (id) => [...pokemonKeys.all, 'detail', id],
  stats: (id) => [...pokemonKeys.detail(id), 'stats']
}

export const movesKeys = {
  all: ['moves'],
  list: (filter?) => [...movesKeys.all, 'list', filter],
  detail: (id) => [...movesKeys.all, 'detail', id]
}
```

---

## 5. Navigation Tree & Structure

### 5.1 Navigation Hierarchy

```
App
├── (auth)
│   ├── login
│   └── onboarding
├── (main)
│   ├── (pokedex) [Tab 1]
│   │   ├── index (list, search, filter)
│   │   ├── [id] (detail screen)
│   │   ├── abilities (reference list)
│   │   ├── [abilityId] (ability detail)
│   │   ├── moves (reference list)
│   │   ├── [moveId] (move detail)
│   │   ├── items (reference list)
│   │   └── [itemId] (item detail)
│   ├── (team) [Tab 2]
│   │   ├── index (team list)
│   │   └── [teamId] (team builder/detail)
│   ├── (settings) [Tab 3]
│   │   ├── index
│   │   ├── about
│   │   └── data-management
│   └── [not-found]
└── +not-found (global fallback)
```

### 5.2 Deep Linking Routes

```typescript
// app.config.ts - linking configuration
linking: {
  prefixes: ['championdex://', 'https://championdex.app'],
  config: {
    screens: {
      '(main)/(pokedex)/[id]': 'pokemon/:id',
      '(main)/(team)/[teamId]': 'team/:teamId',
      '(main)/(pokedex)/abilities/[abilityId]': 'ability/:abilityId',
      '(main)/(pokedex)/moves/[moveId]': 'move/:moveId',
      NotFound: '*'
    }
  }
}
```

---

## 6. Core Architectural Patterns

### 6.1 Repository Pattern (Data Access Layer)

```typescript
// services/database/pokemonRepository.ts
export const pokemonRepository = {
  async getPokemonList(limit: number, offset: number) {
    const db = await getDatabase()
    return db.allAsync(
      `SELECT id, name, national_id, thumbnail_url FROM pokemon 
       LIMIT ? OFFSET ?`,
      [limit, offset]
    )
  },

  async searchPokemon(query: string) {
    const db = await getDatabase()
    return db.allAsync(
      `SELECT p.id, p.name, p.thumbnail_url FROM pokemon p
       JOIN pokemon_fts fts ON p.id = fts.rowid
       WHERE pokemon_fts MATCH ?`,
      [query]
    )
  },

  async getPokemonDetail(id: number) {
    const db = await getDatabase()
    return db.getAsync(
      `SELECT * FROM pokemon WHERE id = ?`,
      [id]
    )
  },

  async getPokemonStats(id: number) {
    const db = await getDatabase()
    return db.allAsync(
      `SELECT stat_name, base_value FROM pokemon_stats WHERE pokemon_id = ?`,
      [id]
    )
  }
}
```

### 6.2 Query Hooks (React Query Integration)

```typescript
// hooks/queries/usePokemonList.ts
export function usePokemonList(limit = 50, offset = 0) {
  return useQuery({
    queryKey: pokemonKeys.list(),
    queryFn: () => pokemonRepository.getPokemonList(limit, offset),
    staleTime: 1000 * 60 * 60, // 1 hour
    gcTime: 1000 * 60 * 60 * 24, // 24 hour cache
  })
}

export function usePokemonSearch(query: string) {
  return useQuery({
    queryKey: pokemonKeys.listFiltered({ query }),
    queryFn: () => query ? pokemonRepository.searchPokemon(query) : [],
    staleTime: Infinity,
    enabled: query.length > 0
  })
}

export function usePokemonDetail(id: number) {
  return useQuery({
    queryKey: pokemonKeys.detail(id),
    queryFn: () => pokemonRepository.getPokemonDetail(id),
    staleTime: 1000 * 60 * 60
  })
}
```

### 6.3 Custom Hooks (UI & Animations)

```typescript
// hooks/ui/useAnimatedScroll.ts
export function useAnimatedScroll() {
  const scrollY = useSharedValue(0)

  const handleScroll = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [0, PARALLAX_HEIGHT],
      [1, 0.3],
      Extrapolate.CLAMP
    ),
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [0, PARALLAX_HEIGHT],
          [0, -PARALLAX_HEIGHT * 0.5],
          Extrapolate.CLAMP
        )
      }
    ]
  }))

  return { scrollY, handleScroll }
}

// hooks/storage/useTeamStorage.ts
export function useTeamStorage() {
  const [teams, setTeams] = useState<Team[]>([])

  const saveTeam = useCallback(async (team: Team) => {
    await AsyncStorage.setItem(`@team:${team.id}`, JSON.stringify(team))
    setTeams(prev => [...prev.filter(t => t.id !== team.id), team])
  }, [])

  const deleteTeam = useCallback(async (teamId: string) => {
    await AsyncStorage.removeItem(`@team:${teamId}`)
    setTeams(prev => prev.filter(t => t.id !== teamId))
  }, [])

  const loadTeams = useCallback(async () => {
    const keys = await AsyncStorage.getAllKeys()
    const teamKeys = keys.filter(k => k.startsWith('@team:'))
    const loaded = await Promise.all(
      teamKeys.map(k => AsyncStorage.getItem(k).then(JSON.parse))
    )
    setTeams(loaded)
  }, [])

  useEffect(() => {
    loadTeams()
  }, [loadTeams])

  return { teams, saveTeam, deleteTeam }
}
```

### 6.4 Compound Component Pattern (Complex UI)

```typescript
// components/team/PokemonSlotEditor.tsx
export const PokemonSlotEditor = ({ slot, onUpdate }: Props) => (
  <View>
    <PokemonSlotEditor.Header />
    <PokemonSlotEditor.AbilityPicker />
    <PokemonSlotEditor.ItemPicker />
    <PokemonSlotEditor.MovePicker />
    <PokemonSlotEditor.StatSliders />
  </View>
)

PokemonSlotEditor.Header = ({ slot }) => (
  <View>
    <Text>{slot.nickname}</Text>
  </View>
)

PokemonSlotEditor.AbilityPicker = () => { /* ... */ }
PokemonSlotEditor.ItemPicker = () => { /* ... */ }
PokemonSlotEditor.MovePicker = () => { /* ... */ }
PokemonSlotEditor.StatSliders = () => { /* ... */ }
```

---

## 7. Performance Architecture

### 7.1 List Virtualization Strategy

**Replace FlatList with FlashList for 1000+ item lists:**

```typescript
// components/lists/PokemonList.tsx
import { FlashList } from '@shopify/flash-list'

export function PokemonList({ data, onSelectPokemon }: Props) {
  return (
    <FlashList
      data={data}
      renderItem={({ item }) => (
        <PokemonCard
          pokemon={item}
          onPress={() => onSelectPokemon(item.id)}
        />
      )}
      estimatedItemSize={120}
      numColumns={2}
      onEndReachedThreshold={0.5}
      onEndReached={() => loadMore()}
      getItemType={(item) => item.isHeader ? 'header' : 'pokemon'}
    />
  )
}
```

### 7.2 Image Optimization Strategy

```typescript
// Using expo-image for smart caching
import { Image } from 'expo-image'

export function PokemonArtwork({ pokemon }: Props) {
  return (
    <Image
      source={{
        uri: pokemon.officialArtworkUrl,
        blurhash: pokemon.artworkBlurhash  // Generate during data sync
      }}
      contentFit="contain"
      cachePolicy="memory-disk"
      placeholder={pokemon.artworkBlurhash}
      style={{ width: 200, height: 200 }}
    />
  )
}
```

### 7.3 Search Optimization

**Client-side Fuse.js for instant search without network:**

```typescript
// utils/search.ts
import Fuse from 'fuse.js'

let searchIndex: Fuse<Pokemon> | null = null

export async function initializeSearchIndex(allPokemon: Pokemon[]) {
  searchIndex = new Fuse(allPokemon, {
    keys: ['name', 'type_name', 'abilities'],
    threshold: 0.4,
    includeScore: true
  })
}

export function searchPokemon(query: string) {
  return searchIndex?.search(query).map(r => r.item) || []
}
```

### 7.4 Memory Management

- **Image pooling:** Use expo-image caching instead of manual management
- **List item memoization:** `React.memo()` for PokemonCard, StatBarChart
- **Reanimated SharedValues:** Only for animation state, not render data
- **Database pagination:** Load 50 items at a time, not all 1000+

---

## 8. Build & Deployment Strategy (EAS)

### 8.1 EAS Configuration (eas.json)

```json
{
  "cli": {
    "version": ">= 5.9.1"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "android": {
        "buildType": "apk"
      },
      "ios": {
        "simulator": true
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./service-account-key.json",
        "track": "production"
      },
      "ios": {
        "appleId": "developer@championdex.app",
        "ascAppId": "1234567890",
        "appleTeamId": "TEAM1234AB"
      }
    }
  },
  "updates": {
    "url": "https://u.expo.dev/[project-id]"
  }
}
```

### 8.2 app.config.ts Structure

```typescript
import { ExpoConfig, ConfigContext } from 'expo/config'

export default ({ config }: ConfigContext): ExpoConfig => ({
  name: 'ChampionDex',
  slug: 'championdex',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/images/logo.png',
  
  splash: {
    image: './assets/images/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#1F2937'
  },

  assetBundlePatterns: ['**/*'],

  ios: {
    supportsTabletMode: true,
    bundleIdentifier: 'com.championdex.app',
    config: {
      usesNonExemptEncryption: false
    }
  },

  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundImage: './assets/images/adaptive-icon-background.png'
    },
    package: 'com.championdex.app',
    targetSdkVersion: 34
  },

  plugins: [
    'expo-router',
    [
      'expo-sqlite',
      {
        enableMigrations: true
      }
    ],
    [
      'expo-notifications',
      {
        icon: './assets/images/notification-icon.png',
        color: '#EF4444'
      }
    ]
  ],

  extra: {
    eas: {
      projectId: process.env.EAS_PROJECT_ID
    },
    pokeApiBaseUrl: process.env.POKE_API_URL || 'https://pokeapi.co/api/v2'
  },

  updates: {
    url: `https://u.expo.dev/${process.env.EAS_PROJECT_ID}`,
    fallbackToCacheTimeout: 30000,
    checkAutomatically: 'ON_LOAD'
  },

  runtimeVersion: {
    policy: 'appVersion'
  }
})
```

### 8.3 Build Workflow

```bash
# Development (local testing)
eas build --platform ios --profile development

# Preview (TestFlight / Google Play internal)
eas build --platform ios --profile preview
eas build --platform android --profile preview

# Production
eas build --platform ios --profile production && eas submit --platform ios
eas build --platform android --profile production && eas submit --platform android
```

---

## 9. Testing Strategy

### 9.1 Jest Unit Tests

**File:** `__tests__/unit/search.test.ts`

```typescript
import { initializeSearchIndex, searchPokemon } from '@/utils/search'

describe('Pokemon Search', () => {
  beforeAll(async () => {
    await initializeSearchIndex(mockPokemonData)
  })

  it('should find Pokemon by exact name', () => {
    const results = searchPokemon('pikachu')
    expect(results).toHaveLength(1)
    expect(results[0].name).toBe('Pikachu')
  })

  it('should fuzzy match partial names', () => {
    const results = searchPokemon('pika')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].name).toBe('Pikachu')
  })

  it('should search by type', () => {
    const results = searchPokemon('electric')
    expect(results.some(p => p.types.includes('electric'))).toBe(true)
  })
})
```

### 9.2 Component Tests (React Native Testing Library)

**File:** `__tests__/components/PokemonCard.test.tsx`

```typescript
import { render, screen } from '@testing-library/react-native'
import { PokemonCard } from '@/components/pokemon/PokemonCard'

describe('PokemonCard', () => {
  it('renders Pokemon name and image', () => {
    render(<PokemonCard pokemon={mockPokemon} onPress={jest.fn()} />)
    expect(screen.getByText('Pikachu')).toBeOnTheScreen()
  })

  it('calls onPress when tapped', () => {
    const onPress = jest.fn()
    const { getByTestId } = render(
      <PokemonCard pokemon={mockPokemon} onPress={onPress} />
    )
    fireEvent.press(getByTestId('pokemon-card-button'))
    expect(onPress).toHaveBeenCalled()
  })
})
```

### 9.3 E2E Tests (Maestro)

**File:** `__tests__/e2e/pokedex.flow.yaml`

```yaml
appId: com.championdex.app
---
- launchApp
- tapOn:
    id: search-input
- inputText: "pikachu"
- assertVisible:
    text: "Pikachu"
- tapOn:
    text: "Pikachu"
- assertVisible:
    id: pokemon-detail-header
- scroll:
    direction: down
    duration: 2
- assertVisible:
    text: "Abilities"
```

### 9.4 Test Coverage Goals

- **Unit tests:** 80% (utilities, repositories, hooks)
- **Component tests:** 70% (cards, lists, modals)
- **Integration tests:** 60% (team builder flow, search + filter)
- **E2E tests:** Critical user journeys (Pokedex search, team creation)

---

## 10. Data Sync & Offline Strategy

### 10.1 Initial Data Population

**Approach:** Bundled static data approach using @pkmn/data and @pkmn/dex packages

**Data Flow:**
1. @pkmn/data provides authoritative Pokemon species, moves, abilities, and items data bundled at build time (~9MB)
2. On first app launch, seedDatabase.ts reads @pkmn/dex API and populates SQLite tables
3. Subsequent app launches check data version; if unchanged, skip re-seeding
4. All queries post-launch read from SQLite (fast, offline-capable)

**Benefits:**
- No first-launch network dependency
- Eliminates PokeAPI sync complexity and potential downtime
- Data is authoritative and version-locked to build
- Seeding completes in under 2 seconds
- App size increases by ~9MB but trades off for guaranteed offline functionality

```typescript
// services/database/seedDatabase.ts
import { SQLiteDatabase } from 'expo-sqlite'
import { Generations } from '@pkmn/data'
import * as FileSystem from 'expo-file-system'

const DATA_VERSION = 1 // Increment when @pkmn/data updates

export async function seedDatabase(db: SQLiteDatabase): Promise<void> {
  // Check if data is already seeded and up to date
  const versionRow = await db.getAsync<{ value: string }>(
    `SELECT value FROM metadata WHERE key = 'data_version'`
  ).catch(() => null)

  if (versionRow?.value === DATA_VERSION.toString()) {
    console.log('Data already seeded, skipping')
    return
  }

  // Seed from @pkmn/dex (bundled data)
  console.log('Seeding Pokemon data from bundled @pkmn/data...')
  
  await db.execAsync('BEGIN TRANSACTION')
  
  try {
    // Import and iterate over all generations
    const gen = Generations.get(9) // Current generation
    
    for (const species of gen.species) {
      await db.runAsync(
        `INSERT OR REPLACE INTO pokemon (id, name, national_id, form_type, generation)
         VALUES (?, ?, ?, ?, ?)`,
        [species.id, species.name, species.num, 'base', 9]
      )
    }
    
    // Similar loops for moves, abilities, items using @pkmn/dex APIs
    for (const move of gen.moves) {
      await db.runAsync(
        `INSERT OR REPLACE INTO moves (id, name, type, category, power, accuracy, pp)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [move.id, move.name, move.type, move.category, move.power, move.accuracy, move.pp]
      )
    }
    
    // Store data version
    await db.runAsync(
      `INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)`,
      ['data_version', DATA_VERSION.toString()]
    )
    
    await db.execAsync('COMMIT')
    console.log('Data seeding complete in <2s')
  } catch (error) {
    await db.execAsync('ROLLBACK')
    throw error
  }
}
```

### 10.2 Team Data Sync

- **User action:** Save team → SQLite teams table + AsyncStorage (for quick in-app access)
- **No network dependency** — teams always work locally
- **Data is immediately available** — no waiting for sync or network requests
- **Future:** Add cloud sync with conflict resolution for multi-device support

---

## 11. Security & Sensitive Data

### 11.1 Secure Storage (Secrets)

```typescript
// services/auth/secureStorage.ts
import * as SecureStore from 'expo-secure-store'

export const secureStorage = {
  async saveAuthToken(token: string) {
    await SecureStore.setItemAsync('auth_token', token)
  },

  async getAuthToken(): Promise<string | null> {
    return await SecureStore.getItemAsync('auth_token')
  },

  async clearAuthToken() {
    await SecureStore.deleteItemAsync('auth_token')
  }
}
```

### 11.2 API Interceptor (Token Refresh)

```typescript
// services/api/interceptors.ts
import axios from 'axios'

const apiClient = axios.create({
  baseURL: process.env.POKE_API_BASE_URL,
  timeout: 10000
})

apiClient.interceptors.request.use(async (config) => {
  const token = await secureStorage.getAuthToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      // Token expired — refresh and retry
      await refreshToken()
      return apiClient(error.config)
    }
    return Promise.reject(error)
  }
)

export default apiClient
```

---

## 12. Monitoring & Error Handling

### 12.1 Error Boundary

```typescript
// components/common/ErrorBoundary.tsx
import React from 'react'
import { View, Text } from 'react-native'

export class ErrorBoundary extends React.Component<Props, State> {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logErrorToService(error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Button title="Try Again" onPress={() => this.setState({ hasError: false })} />
        </View>
      )
    }
    return this.props.children
  }
}
```

### 12.2 Crash Reporting (Sentry) - POST-LAUNCH

**MVP Status:** Local-only, no telemetry.

**Post-Launch (Phase 2+):** Add Sentry (or equivalent error telemetry service) for crash reporting and diagnostics.

```typescript
// utils/errorHandling.ts (post-launch integration)
import * as Sentry from "sentry-expo"

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: __DEV__ ? "development" : "production",
})

export function captureException(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, { extra: context })
}
```

**Rationale:** MVP prioritizes privacy and simplicity (local-only). Post-launch, Sentry enables monitoring for crash patterns, performance issues, and diagnostic insights without collecting user data.

---

## 12.3 Localization (i18n) Architecture

**MVP Status:** English-only content; infrastructure ready for translations.

**Implementation:** Use `i18next` + `react-i18next` (or `expo-localization` for simpler use case).

```typescript
// src/localization/i18n.ts
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'

i18n
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en } },
    lng: 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false }
  })

export default i18n
```

```typescript
// Example usage in components
import { useTranslation } from 'react-i18next'

export function PokemonDetail() {
  const { t } = useTranslation()
  return (
    <Text>{t('pokemon.details.baseStats')}</Text>
    <Text>{t('pokemon.types.fire')}</Text>
  )
}
```

**Key Principles:**
- All UI strings in translation keys (never hardcoded strings in components)
- English translations in `src/localization/locales/en.json`
- Ready to add new languages by creating `locales/xx.json` files
- No external translation service needed for MVP (internal team manages English strings)

**Future:** Phase 2+ can integrate translation management tools (Crowdin, Lokalise) for community translations.

---

## 13. Asset & Animation Strategy

### 13.1 Pokemon Image Assets

- **Source:** Official Pokemon artwork from PokeAPI (sprite URLs included in reference data)
- **Caching:** expo-image handles disk caching automatically
- **Blurhash:** Pre-computed during data sync for instant preview
- **Variants:** Regular, shiny, alternate forms as additional URLs

### 13.2 Animations

**Parallax Scroll (Detail Screen):**
```typescript
// Use Reanimated 3 with animated styles
const animatedHeaderStyle = useAnimatedStyle(() => ({
  opacity: interpolate(scrollY.value, [0, 200], [1, 0.3])
}))
```

**Image Carousel:**
```typescript
// Swipe through sprites with shared transition
<PanGestureHandler onGestureEvent={gestureHandler}>
  <Animated.View style={[animatedStyle]}>
    <Image source={currentSprite} />
  </Animated.View>
</PanGestureHandler>
```

**Stat Chart Animation:**
```typescript
// Use react-native-skia for SVG radar chart with spring animation
<Canvas>
  <Group>
    <Path path={radarPath} strokeWidth={2} color="white" />
    {/* Animated stat values */}
  </Group>
</Canvas>
```

---

## 14. Development Environment Setup

### 14.1 Required Tools

```bash
# Node 18+ (via nvm recommended)
node --version  # v18.17.0+

# Expo CLI (global)
npm install -g expo-cli

# EAS CLI (for builds/deployments)
npm install -g eas-cli

# Xcode (iOS) — via App Store
# Android Studio (Android) — download from Google

# Mobile simulators
# - iOS: xcrun simctl list
# - Android: android emulator @Pixel_6_API_34
```

### 14.2 Environment Variables (.env)

```bash
# .env.example
EXPO_PUBLIC_POKE_API_URL=https://pokeapi.co/api/v2
SENTRY_DSN=https://key@sentry.io/project-id
EAS_PROJECT_ID=your-project-id-from-expo
```

### 14.3 Development Startup

```bash
# Install dependencies
npm install

# Start development server
npx expo start

# Run on iOS simulator
i

# Run on Android emulator
a

# Clear cache if needed
npx expo start --clear
```

---

## 15. Timeline & Milestones

### Phase 1: Foundation (Weeks 1-2)
- Project setup (Expo, TypeScript, EAS config)
- SQLite schema and initial data population
- Zustand stores (auth, UI, team builder)
- Basic navigation structure

### Phase 2: Pokedex (Weeks 3-4)
- PokemonList with FlashList + search (Fuse.js)
- Pokemon detail screen with parallax scrolling
- Image carousel with swipe gestures
- Filter/sort chips

### Phase 3: References (Weeks 5)
- Abilities/Moves/Items list screens
- Detail pages for each reference type
- Related entity navigation

### Phase 4: Team Builder (Weeks 6-7)
- Team creation/editing UI
- Stat sliders and ability/moveset pickers
- Team persistence (AsyncStorage)
- Team list and management

### Phase 5: Polish & Testing (Weeks 8-9)
- Animations refinement
- Performance optimization
- Jest + React Native Testing Library coverage
- E2E testing with Maestro

### Phase 6: Deployment (Weeks 10)
- EAS Build setup and testing
- TestFlight + Google Play internal testing
- Store metadata and screenshots
- Production release

---

## 16. Success Criteria

- **Performance:** 60 FPS list scrolling on both platforms with 1000+ items
- **Offline:** Full app functionality without network (after first launch)
- **First-Launch Seeding:** SQLite seeded from bundled @pkmn/data in under 2 seconds (no network required)
- **Launch Time:** App cold start under 3 seconds (including data seeding on first launch only)
- **Test Coverage:** 75%+ coverage (unit + component + E2E)
- **Bundle Size:** APK <80MB (+9MB for bundled data), IPA <120MB (+9MB for bundled data)
- **Accessibility:** VoiceOver/TalkBack support on all screens
- **Store Ready:** Pass App Store and Play Store review on first submission

---

## 17. List Screens Architecture (July 2026 Rebuild)

**Important:** Refer to **`LIST_SCREENS_ARCHITECTURE.md`** for the canonical pattern for all list screens (Pokemon, Moves, Abilities, Items).

The four list screens were rebuilt in July 2026 to fix an Android TextInput focus/keyboard blur bug. The rebuild locked in a canonical architecture with 10 invariant requirements that must always hold.

**Key Points:**
1. **SearchHeader is a sibling to FlashList** — NOT in ListHeaderComponent (fixes focus bug)
2. **Split search state** — immediate `search` + debounced `debouncedSearch` (via `useDebounce`)
3. **useCallback on all handlers** — prevents SearchHeader re-renders
4. **React.memo on SearchHeader** — preserves TextInput focus
5. **keyboardDismissMode="interactive"** on all FlashList instances
6. **No early-exit returns** — show loading/error via ListEmptyComponent
7. **useDebounce skips initial render** — prevents empty search on app start
8. **All row components are stable** — do not modify without careful testing
9. **Abilities and Items have debounce** — previously missing, now added
10. **FilterSortSheet uses StyleSheet.absoluteFill** — not absoluteFillObject

**DEPRECATED PATTERNS (no longer used):**
- ❌ SearchHeader in ListHeaderComponent (caused focus bug)
- ❌ Query bound directly to immediate search state (caused query storms)
- ❌ Event handlers not wrapped in useCallback (caused unnecessary re-renders)
- ❌ Early return on isLoading/error (unmounts list, loses scroll position)

See `LIST_SCREENS_ARCHITECTURE.md` for complete specification, rationale, anti-patterns, and testing checklist.

---

## Conclusion

ChampionDex is architected on **Expo + React Native** for maximum development velocity and cross-platform consistency, with **SQLite** for offline-first Pokemon reference data, **React Query** for smart caching, **Zustand** for lightweight state, and **Reanimated 3** for 60 FPS animations. The stack prioritizes performance on large lists (1000+ items), smooth gesture-driven interactions, and reliable offline functionality while maintaining a small bundle size and rapid iteration cycles.

Key differentiators:
1. **SQLite for reference data** — eliminates network dependency for core app
2. **Client-side search (Fuse.js)** — instant results without server round-trips
3. **FlashList + expo-image** — proven patterns for high-performance scrolling
4. **EAS Build/Submit** — automated store deployments without native build knowledge
5. **Expo Router v3** — type-safe file-based navigation with deep linking built-in
6. **Canonical list screen architecture** — locked-in patterns for search, filters, and keyboard handling (see LIST_SCREENS_ARCHITECTURE.md)

The architecture is production-ready and scalable for post-launch features (cloud sync, competitive ladder, trading, etc.).
