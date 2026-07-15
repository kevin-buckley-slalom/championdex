# DESIGN.md

**Version:** 0.1 | **Last Updated:** 2026-07-09 | **Status:** Draft

---

## Changelog

| Date | Version | Change |
|------|---------|--------|
| 2026-07-09 | 0.1 | Initial system design for ChampionDex MVP |

---

## 1. Executive Summary

ChampionDex is a high-performance, offline-first cross-platform mobile app (iOS + Android) built with **React Native + Expo** (recommended over Flutter for faster iteration and Expo ecosystem benefits). The app serves Pokemon Champions players as a quick-reference guide and team-building tool.

**Key Design Decisions:**
- **Framework:** React Native + Expo (single codebase, 80%+ code reuse, native performance)
- **Storage:** SQLite (local persistence), PokeAPI (initial data source)
- **State Management:** React Context + hooks (lightweight, sufficient for MVP scope)
- **UI Design:** Type-based color theming, dark mode primary, 60fps animations with React Native Reanimated 2
- **Architecture:** Modular component structure with clear data/UI separation

---

## 2. Technology Stack

### 2.1 Core Stack

| Layer | Technology | Version | Rationale |
|-------|-----------|---------|-----------|
| **Framework** | React Native | 0.72+ | Cross-platform; Expo support; 80%+ code reuse |
| **Build/Deploy** | Expo | 49+ | Managed build service; OTA updates; App Store/Play Store publishing |
| **Language** | TypeScript | 5.0+ | Type safety; better IDE support; catches errors early |
| **State** | React Context + useReducer | Built-in | Lightweight; sufficient for MVP; no external dependencies |
| **UI Components** | React Native Built-in + Custom | - | Native performance; custom components for complex layouts |
| **Animations** | React Native Reanimated 2 | 3.0+ | 60fps animations; native thread execution; parallax support |
| **Local Storage** | SQLite | expo-sqlite | Relational queries; offline persistence; fast reads |
| **HTTP Client** | Axios | 1.4+ | Promise-based; PokeAPI integration; request/response interceptors |
| **Navigation** | React Navigation | 6.x | Industry standard; deep linking; stack/tab navigation |
| **UI Kit** | Custom components + expo-linear-gradient | - | Dark mode design system; type-based theming |
| **Testing** | Jest + React Native Testing Library | Latest | Unit & component tests; reasonable coverage |
| **Linting** | ESLint + Prettier | Latest | Code consistency; auto-formatting |

### 2.2 Development Environment

| Tool | Purpose |
|------|---------|
| **Expo CLI** | Local dev, testing, publishing |
| **XCode** (macOS only) | iOS testing on simulator/device |
| **Android Studio** | Android testing on emulator/device |
| **VS Code / WebStorm** | IDE |
| **Postman** | API testing (PokeAPI) |
| **Figma** | Design mockups & design system |

### 2.3 Deployment

| Platform | Approach |
|----------|----------|
| **iOS App Store** | Expo managed build service → TestFlight → App Store release |
| **Google Play Store** | Expo managed build service → Google Play Console → Play Store release |
| **OTA Updates** | Expo Updates (future phase): deploy app logic changes without store resubmission |

---

## 3. System Architecture

### 3.1 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Mobile App (React Native)                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Navigation Layer (React Navigation)          │   │
│  │  - Stack Navigator (detail views)                         │   │
│  │  - Bottom Tab Navigator (ref guide / team builder)        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           ↓                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           Presentation Layer (Screens & Components)       │   │
│  │  ┌─────────────────┬─────────────────┬─────────────────┐  │   │
│  │  │ Reference Guide │ Detail Views    │ Team Builder    │  │   │
│  │  │ - PokemonList   │ - PokemonDetail │ - TeamScreen    │  │   │
│  │  │ - MoveList      │ - MoveDetail    │ - PokemonSlot   │  │   │
│  │  │ - AbilityList   │ - AbilityDetail │ - StatEditor    │  │   │
│  │  │ - ItemList      │ - ItemDetail    │ - AnalysisView  │  │   │
│  │  └─────────────────┴─────────────────┴─────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           ↓                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         State Management (React Context)                  │   │
│  │  - DataContext (Pokemon, Moves, Abilities, Items)         │   │
│  │  - TeamContext (Saved teams, current team)                │   │
│  │  - UIContext (theme, filters, sort preferences)           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           ↓                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         Data Access Layer (Hooks & Services)             │   │
│  │  - usePokemonData (search, filter, sort)                  │   │
│  │  - useTeamManager (save/load/edit teams)                  │   │
│  │  - useStatCalculator (IV/EV formulas)                     │   │
│  │  - usePokemonAPI (PokeAPI client)                         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           ↓                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         Persistence Layer (SQLite)                        │   │
│  │  - Local database file                                    │   │
│  │  - Tables: pokemon, moves, abilities, items, teams        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                           ↓
    ┌─────────────────────────────────────────────────────────┐
    │    External Data Source (PokeAPI - Initial Load Only)   │
    │    - https://pokeapi.co/api/v2/pokemon?limit=1000       │
    └─────────────────────────────────────────────────────────┘
```

### 3.2 Data Flow Diagram

```
User Action (e.g., Search "Pikachu")
    ↓
Navigation/Screen Component (PokemonList)
    ↓
Dispatch Action to DataContext
    ↓
usePokemonData Hook (filters & sorts locally)
    ↓
SQLite Query (SELECTs matching records)
    ↓
Results Array → DataContext State
    ↓
Component Re-renders with FlatList
    ↓
UI displays search results
```

### 3.3 Component Hierarchy

```
App (Root)
├── NavigationContainer
│   ├── Stack Navigator
│   │   ├── TabNavigator (Main Tabs)
│   │   │   ├── ReferenceGuideTab
│   │   │   │   ├── PokemonList (search, filter, sort)
│   │   │   │   ├── MoveList
│   │   │   │   ├── AbilityList
│   │   │   │   └── ItemList
│   │   │   └── TeamBuilderTab
│   │   │       ├── TeamScreen (list of saved teams)
│   │   │       ├── TeamDetailScreen (edit current team)
│   │   │       ├── StatEditor (IV/EV sliders)
│   │   │       └── TeamAnalysisScreen
│   │   ├── PokemonDetailScreen
│   │   ├── MoveDetailScreen
│   │   ├── AbilityDetailScreen
│   │   └── ItemDetailScreen
│   └── Providers
│       ├── DataProvider (PokeAPI data context)
│       ├── TeamProvider (team data context)
│       └── UIProvider (theme, filters, sort)
```

---

## 4. Data Model & Schema

### 4.1 SQLite Schema

#### pokemon table
```sql
CREATE TABLE pokemon (
  id INTEGER PRIMARY KEY,
  national_dex_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  form_type TEXT DEFAULT 'base', -- 'base', 'alolan', 'galarian', 'hisuian', 'mega', 'gigantamax', etc.
  official_artwork_url TEXT,
  sprite_url TEXT,
  type_primary TEXT NOT NULL,
  type_secondary TEXT,
  hp INTEGER,
  attack INTEGER,
  defense INTEGER,
  sp_attack INTEGER,
  sp_defense INTEGER,
  speed INTEGER,
  ability_normal TEXT,
  ability_hidden TEXT,
  generation INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(national_dex_number, form_type) -- True form differences are separate entries
);

CREATE INDEX idx_pokemon_name ON pokemon(name);
CREATE INDEX idx_pokemon_type ON pokemon(type_primary);
CREATE INDEX idx_pokemon_form ON pokemon(form_type);
```

**Note:** True form differences (Alolan Raichu vs base Raichu, Mega Charizard X vs base Charizard, etc.) are stored as separate Pokemon entries with their own `national_dex_number` + `form_type` combination. This allows each form to have distinct stats, types, and abilities. Cosmetic variants (gender-only sprite differences with identical stats/moves) are stored as a single entry with alternate image URLs handled via UI toggle.

#### moves table
```sql
CREATE TABLE moves (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  category TEXT NOT NULL, -- 'physical', 'special', 'status'
  power INTEGER,
  accuracy INTEGER,
  priority INTEGER DEFAULT 0,
  description TEXT,
  generation INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_moves_name ON moves(name);
CREATE INDEX idx_moves_type ON moves(type);
```

#### abilities table
```sql
CREATE TABLE abilities (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  generation INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_abilities_name ON abilities(name);
```

#### items table
```sql
CREATE TABLE items (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_items_name ON items(name);
```

#### pokemon_moves (junction table)
```sql
CREATE TABLE pokemon_moves (
  pokemon_id INTEGER NOT NULL,
  move_id INTEGER NOT NULL,
  learn_method TEXT, -- 'level_up', 'tm', 'egg', etc.
  learn_level INTEGER,
  PRIMARY KEY (pokemon_id, move_id),
  FOREIGN KEY (pokemon_id) REFERENCES pokemon(id),
  FOREIGN KEY (move_id) REFERENCES moves(id)
);

CREATE INDEX idx_pokemon_moves_pokemon ON pokemon_moves(pokemon_id);
```

#### pokemon_abilities (junction table)
```sql
CREATE TABLE pokemon_abilities (
  pokemon_id INTEGER NOT NULL,
  ability_id INTEGER NOT NULL,
  slot INTEGER, -- 1, 2, or 3 (hidden)
  is_hidden INTEGER DEFAULT 0,
  PRIMARY KEY (pokemon_id, ability_id),
  FOREIGN KEY (pokemon_id) REFERENCES pokemon(id),
  FOREIGN KEY (ability_id) REFERENCES abilities(id)
);
```

#### teams table
```sql
CREATE TABLE teams (
  id TEXT PRIMARY KEY, -- UUID
  name TEXT NOT NULL,
  user_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_teams_created ON teams(created_at DESC);
```

#### team_members table
```sql
CREATE TABLE team_members (
  id TEXT PRIMARY KEY, -- UUID (for future cloud sync / cross-device sync)
  team_id TEXT NOT NULL,
  slot INTEGER NOT NULL, -- 1-6
  pokemon_id INTEGER NOT NULL,
  is_shiny INTEGER DEFAULT 0,
  ability_id INTEGER,
  item_id INTEGER,
  move_1_id INTEGER,
  move_2_id INTEGER,
  move_3_id INTEGER,
  move_4_id INTEGER,
  iv_hp INTEGER DEFAULT 31,
  iv_attack INTEGER DEFAULT 31,
  iv_defense INTEGER DEFAULT 31,
  iv_sp_attack INTEGER DEFAULT 31,
  iv_sp_defense INTEGER DEFAULT 31,
  iv_speed INTEGER DEFAULT 31,
  ev_hp INTEGER DEFAULT 0,
  ev_attack INTEGER DEFAULT 0,
  ev_defense INTEGER DEFAULT 0,
  ev_sp_attack INTEGER DEFAULT 0,
  ev_sp_defense INTEGER DEFAULT 0,
  ev_speed INTEGER DEFAULT 0,
  stat_level INTEGER DEFAULT 50, -- Level 50 or Level 100 for stat calculations
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id),
  FOREIGN KEY (pokemon_id) REFERENCES pokemon(id),
  FOREIGN KEY (ability_id) REFERENCES abilities(id),
  FOREIGN KEY (item_id) REFERENCES items(id)
);

CREATE INDEX idx_team_members_team ON team_members(team_id);
```

**Note:** UUIDs are primary keys to enable future cloud sync and cross-device team synchronization in Phase 2+. MVP uses local SQLite storage only. `stat_level` column allows per-team-member level selection (50 or 100) for stat calculations.

### 4.2 In-Memory Data Structures

#### PokemonData (TypeScript interface)
```typescript
interface Pokemon {
  id: number;
  nationalDexNumber: number;
  name: string;
  officialArtworkUrl: string;
  spriteUrl: string;
  types: Type[];
  baseStats: {
    hp: number;
    attack: number;
    defense: number;
    spAtk: number;
    spDef: number;
    speed: number;
  };
  abilities: Ability[];
  movepool: Move[];
}

interface Type {
  name: string;
  color: string; // hex code for type-based theming
}

interface Ability {
  id: number;
  name: string;
  description: string;
}

interface Move {
  id: number;
  name: string;
  type: string;
  category: 'physical' | 'special' | 'status';
  power?: number;
  accuracy?: number;
  priority: number;
  description: string;
}

interface Item {
  id: number;
  name: string;
  description: string;
}
```

#### Team Data (TypeScript interface)
```typescript
interface Team {
  id: string;
  name: string;
  members: TeamMember[];
  createdAt: Date;
  updatedAt: Date;
}

interface TeamMember {
  slot: 1 | 2 | 3 | 4 | 5 | 6;
  pokemon: Pokemon;
  ability: Ability;
  item?: Item;
  moveset: [Move, Move, Move, Move];
  stats: {
    iv: StatValues;
    ev: StatValues;
    calculated: StatValues;
  };
  isShiny: boolean;
}

interface StatValues {
  hp: number;
  attack: number;
  defense: number;
  spAtk: number;
  spDef: number;
  speed: number;
}
```

---

## 5. UI/UX Design

### 5.1 Design System & Theming

#### Color Palette (Type-Based)

| Type | Primary Color | Secondary | Text on Color |
|------|--------------|-----------|---------------|
| Fire | #F08030 | #FF6F1F | #FFF |
| Water | #6890F0 | #4090FF | #FFF |
| Grass | #78C850 | #5EBF3A | #FFF |
| Electric | #F8D030 | #FFE11D | #000 |
| Psychic | #F85888 | #FF5499 | #FFF |
| Dragon | #7038F8 | #8B5FE8 | #FFF |
| Dark | #705848 | #5F4C3F | #FFF |
| Fairy | #EE99AC | #FFB3D9 | #FFF |
| ... | (complete 18 types) | | |

#### Base Theme (Dark Mode)

| Element | Color | Usage |
|---------|-------|-------|
| Background | #0F0F0F | Screen background |
| Surface | #1A1A1A | Card surfaces, tabs |
| Text Primary | #FFFFFF | Body text, headings |
| Text Secondary | #999999 | Descriptions, labels |
| Accent | Type-specific | Buttons, highlights |
| Border | #333333 | Card borders, dividers |

#### Typography

| Element | Font | Size | Weight | Usage |
|---------|------|------|--------|-------|
| H1 (Screen Title) | System Font | 28sp | 700 | Screen headers |
| H2 (Section) | System Font | 20sp | 600 | Section titles |
| Body (Primary) | System Font | 16sp | 400 | Main text |
| Body (Secondary) | System Font | 14sp | 400 | Descriptions |
| Caption | System Font | 12sp | 400 | Labels, meta |
| Button | System Font | 16sp | 600 | Button text |

### 5.2 Screen Layouts

#### 1. Reference Guide (PokemonList Screen)

```
┌──────────────────────────────────────┐
│  ChampionDex                    [ ≡ ] │  (Header with menu)
├──────────────────────────────────────┤
│ [ Search... ]                    [ ✕ ]│  (Search bar)
│                                       │
│ [Fire] [Water] [Grass] [Electric]   │  (Filter chips)
│ Sort by: [ Name ▼ ]                 │
├──────────────────────────────────────┤
│ ┌────────────────────────────────┐  │
│ │ [Sprite] Pikachu        ⚡     │  │  (List item)
│ │         Dex #025         Level │  │
│ └────────────────────────────────┘  │
│ ┌────────────────────────────────┐  │
│ │ [Sprite] Raichu         ⚡     │  │
│ │         Dex #026         Level │  │
│ └────────────────────────────────┘  │
│ ... (scrollable)                     │
├──────────────────────────────────────┤
│ [ Pokemon ] [ Moves ] [ Abil. ] [ Items ] │  (Tab bar)
└──────────────────────────────────────┘
```

#### 2. Pokemon Detail Screen

```
┌──────────────────────────────────────┐
│ < Pikachu           [Share] [Menu]  │  (Header with back)
├──────────────────────────────────────┤
│ ┌────────────────────────────────┐  │
│ │                                 │  │  (Parallax artwork)
│ │         [Pikachu Image]          │  │  (with shiny toggle)
│ │         [●Shiny] [Normal]        │  │
│ └────────────────────────────────┘  │
├──────────────────────────────────────┤
│ Dex #025 | ⚡ Electric             │  (Type badges)
│ Ht: 0.4m | Wt: 6kg                 │
├──────────────────────────────────────┤
│ Abilities                           │
│ [Static (1)] [Lightning Rod (2)]    │  (Selectable in team)
├──────────────────────────────────────┤
│ Base Stats      ┌─────────────┐     │
│ HP     35   ███ │  ╱─────╲    │     │  (Hexagon chart)
│ Atk    55   ████│╱         ╲  │     │
│ Def    40   ███ │          │ │     │
│ SpA    50   ████│ STATS    │ │     │
│ SpD    50   ████│          │ │     │
│ Spe    90   █████│╲         ╱  │     │
│            │ └─────┘    │     │
├──────────────────────────────────────┤
│ Moveset (Browse all moves)          │
│ [Thunderbolt] [Thunder Wave]        │
│ [Volt Tackle] [Iron Tail]           │  (Tappable)
│ ...                                 │
├──────────────────────────────────────┤
│ [+ Add to Team] [View Type Matchups] │  (Actions)
└──────────────────────────────────────┘
```

#### 3. Team Builder (TeamDetailScreen)

```
┌──────────────────────────────────────┐
│ < Team: "Physical Wall"     [Save]  │
├──────────────────────────────────────┤
│ Team Name: [Physical Wall       ]   │
├──────────────────────────────────────┤
│ [Slot 1]  Blissey                    │
│ ├─ Ability: [Serene Grace ▼]        │
│ ├─ Item: [Assault Vest ▼]           │
│ ├─ Moves: [Recover] [Soft-Boiled]   │
│ │         [Refresh] [Thunder Wave]  │  (Tappable to edit)
│ ├─ IVs: [●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●]
│ │        HP ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 31
│ │        Atk ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 0
│ │        Def ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ 31
│ │        ... (6 stats total)
│ └─ Stats: HP 1234 | Atk 56 | Def 156 | SpA 120 | SpD 176 | Spe 95
│
│ [Slot 2]  Garchomp
│ ... (similar)
│
│ [Slot 3]  Gyarados
│ [Slot 4]  Heatran
│ [Slot 5]  [+ Add Pokemon]
│ [Slot 6]  [+ Add Pokemon]
│
├──────────────────────────────────────┤
│ Team Analysis                       │
│ Type Coverage: ✓✓✓ Good           │
│ Weaknesses: [4x] Fire, [2x] Water  │  (Type matchup summary)
│ Resistances: [0.5x] Normal, Bug... │
└──────────────────────────────────────┘
```

### 5.3 Animation Specifications

#### Parallax Scrolling (Detail View)
- Artwork moves at 0.5x scroll velocity
- Creates sense of depth as user scrolls content
- 60fps maintained via React Native Reanimated 2

#### Image Transitions (Shiny Toggle)
- Cross-fade: 200ms cubic-bezier easing
- Images pre-loaded in background
- No jank during transition

#### List Item Tap Animation
- Scale: 1.0 → 0.98 on press, back to 1.0 on release
- Duration: 150ms
- Provides tactile feedback

#### Stat Slider Updates
- Hexagon chart morphs smoothly
- Numeric values fade/update instantly
- Chart animation: 300ms spring physics

---

## 6. API Integration

### 6.1 PokeAPI Integration (Initial Data Load)

#### Endpoints Used
- `GET /pokemon?limit=1000` — Fetch all Pokemon
- `GET /pokemon/{id}/` — Fetch Pokemon details (moves, abilities)
- `GET /move/{id}/` — Fetch move details
- `GET /ability/{id}/` — Fetch ability details
- `GET /item/{id}/` — Fetch item details

#### Data Sync Flow
```
App Start
  ↓
Check SQLite (data exists?)
  ├─ YES: Skip API calls, load from DB
  ├─ NO: 
  │   ├─ Fetch /pokemon?limit=1000 (batch calls for move/ability details)
  │   ├─ Parse response, normalize data
  │   ├─ Insert into SQLite tables
  │   ├─ Cache images locally
  │   └─ Show "Data loaded" toast
  │
  ↓
App Ready
```

#### Image Caching
- Download images from PokeAPI CDN on initial load
- Store in app's document directory
- Use local file:// URLs instead of HTTP
- Fallback to PokeAPI URL if local not found

### 6.2 Error Handling (API)
- Network timeout (>10s): Show offline badge, use stale data
- Parse error: Log to console, skip record, continue
- Storage quota exceeded: Show alert, clear old cache if needed

---

## 7. State Management Details

### 7.1 DataContext (PokeAPI Data)

```typescript
type DataContextType = {
  pokemon: Pokemon[];
  moves: Move[];
  abilities: Ability[];
  items: Item[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchInitialData: () => Promise<void>;
  searchPokemon: (query: string) => Promise<Pokemon[]>;
  filterPokemon: (filters: FilterOptions) => Pokemon[];
  sortPokemon: (sortBy: SortOption) => Pokemon[];
  getPokemonDetail: (id: number) => Pokemon | null;
  getMoveDetail: (id: number) => Move | null;
};
```

### 7.2 TeamContext (User-Saved Teams)

```typescript
type TeamContextType = {
  teams: Team[];
  currentTeam: Team | null;
  
  // Actions
  createTeam: (name: string) => Promise<string>;
  loadTeam: (teamId: string) => Promise<void>;
  saveTeam: (team: Team) => Promise<void>;
  deleteTeam: (teamId: string) => Promise<void>;
  addPokemonToSlot: (pokemon: Pokemon, slot: number) => void;
  removePokemonFromSlot: (slot: number) => void;
  updateMember: (slot: number, updates: Partial<TeamMember>) => void;
  analyzeTeam: () => TeamAnalysis;
};

type TeamAnalysis = {
  typeCoverage: string[]; // types covered
  typeWeaknesses: { type: string; count: number }[];
  typeResistances: { type: string; count: number }[];
};
```

### 7.3 UIContext (Preferences & Theme)

```typescript
type UIContextType = {
  theme: 'dark'; // light mode deferred to Phase 2
  currentFilters: FilterOptions;
  currentSort: SortOption;
  
  // Actions
  setFilters: (filters: FilterOptions) => void;
  setSort: (sortBy: SortOption) => void;
  clearFilters: () => void;
};

type FilterOptions = {
  types?: string[];
  generation?: number;
  hasItem?: boolean;
  // etc.
};

type SortOption = 'name' | 'dex' | 'stat_total' | 'speed';
```

---

## 8. Performance Optimization Strategies

### 8.1 Rendering Optimization
- **FlatList/SectionList:** Use for long lists (1000+ items)
  - `initialNumToRender: 20`
  - `maxToRenderPerBatch: 10`
  - `updateCellsBatchingPeriod: 50`
  - `removeClippedSubviews: true`
- **Memoization:** useMemo for filtered/sorted lists; React.memo for list items
- **Key prop:** Use stable keys (ID) for FlatList items

### 8.2 Memory Management
- Lazy load images using `Image.prefetch()` for upcoming list items
- Unload images from memory when scrolled off-screen
- Cap team analysis to 6 Pokemon (fixed size)

### 8.3 Database Query Optimization
- Indexed columns: `name`, `type_primary`, `pokemon_id`
- Use SQLite LIMIT clause for pagination (if needed)
- Cache frequently-used queries in-memory

### 8.4 Asset Size Optimization
- Compress PNG sprites to <10KB each
- Lazy-load artwork (high-res) only on detail screen
- Sprite images: 64x64, artwork: 256x256

### 8.5 Navigation Performance
- Pre-compute detail screen data before navigation
- Use `react-navigation` performance best practices
- Avoid heavy computations in screen render()

---

## 9. Security Considerations

### 9.1 Data Security
- No sensitive user data collected (anonymous app)
- SQLite database stored in app sandbox (no encryption needed for MVP)
- No API keys hardcoded (PokeAPI is public)

### 9.2 Network Security
- HTTPS only for PokeAPI calls
- Certificate pinning (future hardening)
- No user data sent over network

### 9.3 Code Obfuscation
- React Native code obfuscation via Expo build (optional)
- Dependencies scanned for vulnerabilities (npm audit)

---

## 10. Accessibility (WCAG 2.1 AA)

### 10.1 Implementation
- **Color Contrast:** Text ≥4.5:1 on backgrounds
- **Touch Targets:** Buttons ≥44x44pt (React Native default)
- **Screen Reader Labels:** All images have `accessibilityLabel`
- **Keyboard Navigation:** All interactive elements tab-accessible
- **Text Size:** Min 14sp body, scalable with system settings

### 10.2 Components
- Custom `AccessibleButton` wrapper with labels
- Detail views: semantic heading hierarchy (h1, h2, h3)
- Forms: associated labels for all inputs
- Charts: Alternative text describing hexagon stats

---

## 11. Testing Strategy

### 11.1 Unit Tests
- Stat calculation logic (IVs, EVs, base stats → final stats)
- Type effectiveness calculations
- Filter/sort functions
- Search tokenization

### 11.2 Component Tests
- PokemonList: rendering, filtering, sorting, search
- DetailScreen: data display, parallax scroll
- StatEditor: slider updates, chart morphing
- TeamBuilder: add/remove/reorder, analysis

### 11.3 Integration Tests
- Data load flow (PokeAPI → SQLite → UI)
- Team creation, save, load, delete
- Deep link navigation (pokemon://pokedex/25 → Pikachu detail)

### 11.4 Performance Tests
- List render time: <500ms for 1000 items
- Search latency: <100ms
- Stat calculation: <50ms
- Memory profiling: <200MB peak

---

## 12. Deployment Architecture

### 12.1 Build Pipeline (Expo)

```
Git Push (main branch)
  ↓
GitHub Actions / CI
  ├─ Lint & typecheck (ESLint, TypeScript)
  ├─ Unit tests (Jest)
  ├─ Build APK (Android) + IPA (iOS) via Expo
  ↓
Artifacts
  ├─ android-release.apk
  ├─ iOS-release.ipa
  ↓
Manual Review & Testing
  ↓
Upload to Stores
  ├─ Apple App Store (TestFlight → Release)
  ├─ Google Play Store (Internal Testing → Beta → Release)
```

### 12.2 Release Versioning
- Semantic versioning: `MAJOR.MINOR.PATCH` (e.g., 1.0.0, 1.1.0, 1.0.1)
- Increment MINOR for new features, PATCH for bug fixes
- Tag releases in Git: `v1.0.0`

---

## 13. Traceability to Requirements

| Requirement ID | Design Section | Implementation Notes |
|----------------|-----------------|----------------------|
| REQ-001 to REQ-012 | 5.2, 7 (PokemonList) | FlatList + search hook + filters |
| REQ-013 to REQ-025 | 5.2, 4.2 (Detail screens) | Type-specific theming, parallax via Reanimated |
| REQ-026 to REQ-042 | 5.2, 7 (TeamBuilder) | Context state, stat calculations |
| REQ-043 to REQ-047 | 6.1, 4.1 (Data integration) | PokeAPI sync, SQLite persistence |
| REQ-048 to REQ-054 | 5.1, 10 (Design system) | Dark mode, type colors, accessibility |
| REQ-055 to REQ-058 | 8 (Performance) | FlatList optimization, indexing, memoization |
| NFR-001 to NFR-027 | 2, 3, 8, 9, 11 (Tech stack, testing, security) | React Native + Expo, Jest, HTTPS |

---

## 14. Next Steps (Before Implementation)

1. **Design Mockups:** Create Figma designs for all screens (reference guide, detail, team builder)
2. **PokeAPI Validation:** Test data fetch, confirm all required fields available
3. **Tech Stack Confirmation:** Final decision between React Native vs Flutter (recommend React Native)
4. **TypeScript Interfaces:** Finalize all data structures before coding begins
5. **Database Schema Validation:** Run schema script against test SQLite instance
6. **Stakeholder Sign-Off:** Present design to team, confirm architecture before development starts
7. **Setup CI/CD:** Configure GitHub Actions for automated builds & tests
8. **Accessibility Audit:** Plan VoiceOver/TalkBack testing workflow

---

## 15. Appendix: Framework Recommendation

### React Native + Expo vs Flutter

#### React Native + Expo: RECOMMENDED

**Pros:**
- Faster iteration (Expo OTA updates, managed build)
- Larger ecosystem + community
- Easier to find developers
- JavaScript/TypeScript familiar to web devs
- Expo simplifies iOS/Android publishing
- Hot reload for faster development

**Cons:**
- Slightly lower native performance than Flutter (acceptable for this app)
- Larger bundle size (~40-50MB vs Flutter ~20MB)

#### Flutter

**Pros:**
- Superior native performance
- Smaller app bundle size
- Single language (Dart)
- Strong type system

**Cons:**
- Smaller ecosystem
- Harder to find developers
- Learning curve for non-Dart developers
- Less mature for complex animations (relative to React Native Reanimated 2)

### Decision: **React Native + Expo** for ChampionDex MVP
- Faster time-to-market
- Team already familiar with JavaScript/React
- Expo ecosystem covers all MVP needs (builds, OTA, publishing)
- Performance sufficient for reference app (not a real-time game)
