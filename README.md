# ChampionDex

A cross-platform Pokemon companion app (iOS & Android) for quick reference, team building, and offline gameplay support.

## Overview

ChampionDex is a React Native + Expo app that provides:
- **Quick Reference:** Search Pokemon, moves, abilities, and items
- **Team Builder:** Create and manage custom teams with stat calculations
- **Offline-First:** All core data cached locally via SQLite
- **Type-Colored UI:** Dark mode with Pokemon type-based theming
- **60fps Animations:** Smooth parallax scrolling and interactions

## Documentation

### Architecture & Decisions
- **[TECHNICAL_ARCHITECTURE.md](docs/TECHNICAL_ARCHITECTURE.md)** — Complete tech stack, dependencies, data schemas, and system design
- **[LIST_SCREENS_ARCHITECTURE.md](docs/LIST_SCREENS_ARCHITECTURE.md)** — Canonical pattern for list screens (Pokemon, Moves, Abilities, Items) with 10 invariant requirements
- **[DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md)** — Design tokens, color palette, typography, spacing, and component specs

### Product & Requirements
- **[PRODUCT.md](docs/PRODUCT.md)** — Product vision, target users, core value propositions, and success metrics
- **[REQUIREMENTS.md](docs/REQUIREMENTS.md)** — Functional and non-functional requirements with acceptance criteria
- **[DESIGN.md](docs/DESIGN.md)** — System architecture, data model, UI/UX design, and animation specs

### Development
- **[ROADMAP.md](docs/ROADMAP.md)** — Phase-based roadmap and timeline
- **[HANDOFF.md](docs/HANDOFF.md)** — Developer onboarding guide
- **[TASKS.md](docs/TASKS.md)** — Implementation task list

## Quick Start

### Prerequisites
- Node 18+ (via nvm recommended)
- Expo CLI: `npm install -g expo-cli`
- iOS: Xcode (for simulator)
- Android: Android Studio

### Installation
```bash
npm install
npx expo start
```

### Run on iOS Simulator
```bash
# From Expo CLI
i
```

### Run on Android Emulator
```bash
# From Expo CLI
a
```

## Key Files

### Screens
- `/app/(main)/(pokedex)/index.tsx` — Pokemon list (Pokedex)
- `/app/(main)/(pokedex)/moves.tsx` — Moves reference
- `/app/(main)/(pokedex)/abilities.tsx` — Abilities reference
- `/app/(main)/(pokedex)/items.tsx` — Items reference

### Components
- `/src/components/lists/SearchHeader.tsx` — Search input with title
- `/src/components/lists/SubTabBar.tsx` — Tab navigation between entity types
- `/src/components/pokemon/PokemonCard.tsx` — Pokemon list item

### Hooks
- `/src/hooks/ui/useDebounce.ts` — Debounce hook for search queries
- `/src/hooks/queries/usePokemonList.ts` — Pokemon list query
- `/src/hooks/queries/useMovesList.ts` — Moves list query
- `/src/hooks/queries/useAbilitiesList.ts` — Abilities list query
- `/src/hooks/queries/useItemsList.ts` — Items list query

### Data & Constants
- `/src/constants/colors.ts` — Design system colors
- `/src/constants/spacing.ts` — Design system spacing
- `/src/services/database/` — SQLite repositories

## Architecture Highlights

### List Screens (Critical Pattern)
All list screens (Pokemon, Moves, Abilities, Items) follow a canonical architecture to prevent Android TextInput focus bugs:

1. **SearchHeader as sibling** — rendered outside FlashList (not in ListHeaderComponent)
2. **Split search state** — immediate `search` + debounced `debouncedSearch`
3. **useCallback on handlers** — prevents unnecessary component re-renders
4. **React.memo on SearchHeader** — preserves TextInput focus
5. **keyboardDismissMode="interactive"** — smooth keyboard handling

**See [LIST_SCREENS_ARCHITECTURE.md](docs/LIST_SCREENS_ARCHITECTURE.md) for complete specification and 10 invariant requirements.**

### Performance
- **FlashList** for 1000+ item lists (virtualization)
- **SQLite** for local data (offline, instant queries)
- **React.memo** + **useCallback** for preventing re-renders
- **expo-image** for smart image caching

### State Management
- **Zustand** — lightweight client state (UI, auth, temp team builder)
- **React Query** — server state (data queries, caching, invalidation)
- **AsyncStorage** — user teams (local persistence)

## Development Guidelines

### Adding a New Feature
1. Check existing patterns in [TECHNICAL_ARCHITECTURE.md](docs/TECHNICAL_ARCHITECTURE.md)
2. For list screens, follow [LIST_SCREENS_ARCHITECTURE.md](docs/LIST_SCREENS_ARCHITECTURE.md) checklist
3. Update design system if adding new components
4. Test on both iOS and Android

### Code Style
- TypeScript for type safety
- Components in `src/components/` with `.tsx` extension
- Hooks in `src/hooks/` with `.ts` extension
- Absolute imports via `@/` alias

### Testing
- Unit tests: `/tests/__tests__/unit/`
- Component tests: `/tests/__tests__/components/`
- E2E tests: `/tests/__tests__/e2e/`

Run tests:
```bash
npm test
```

## Known Issues / Deprecated Patterns

**DO NOT USE:**
- ❌ SearchHeader in FlashList's `ListHeaderComponent` (causes focus bug on Android)
- ❌ Query bound directly to immediate search state (causes query storms)
- ❌ Event handlers not wrapped in `useCallback`
- ❌ Early return on `isLoading` / `error` (unmounts list)

Use the canonical patterns from [LIST_SCREENS_ARCHITECTURE.md](docs/LIST_SCREENS_ARCHITECTURE.md) instead.

## Performance Targets

| Metric | Target |
|--------|--------|
| **App startup (cold)** | <3s |
| **App startup (warm)** | <500ms |
| **List scroll (1000 items)** | 60fps |
| **Search results appearance** | <100ms (after 300ms debounce) |
| **Team analysis calculation** | <50ms |
| **Memory footprint** | <200MB |

## Build & Deployment

### Development Build
```bash
eas build --platform ios --profile development
```

### Preview Build
```bash
eas build --platform ios --profile preview
eas build --platform android --profile preview
```

### Production Build & Submit
```bash
eas build --platform ios --profile production && eas submit --platform ios
eas build --platform android --profile production && eas submit --platform android
```

See [TECHNICAL_ARCHITECTURE.md](docs/TECHNICAL_ARCHITECTURE.md) section 8 for complete deployment details.

## Contributing

1. Create a feature branch
2. Follow the code style and patterns in this repository
3. Test on both iOS and Android
4. Submit a PR with reference to the relevant docs

## License

See [LICENSE](LICENSE)

## Support

For documentation questions, refer to the docs folder:
- **Architecture questions** → TECHNICAL_ARCHITECTURE.md, LIST_SCREENS_ARCHITECTURE.md
- **Design questions** → DESIGN_SYSTEM.md
- **Product questions** → PRODUCT.md, REQUIREMENTS.md

