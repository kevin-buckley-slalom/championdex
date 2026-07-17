# MovesetSection Design Specification

**Date:** 2026-07-17  
**Status:** Visual Design Spec — Ready for Implementation  
**Component:** `MovesetSection` (Pokemon detail screen, below-fold section)

---

## Overview

The `MovesetSection` displays all moves a Pokémon can learn, organized by learn method (level-up, TM/HM, egg, tutor, other). The section includes game version selection, move search, grouping by learn method, and tappable rows that navigate to move detail screens.

**Key constraint:** Section lives inside the `accentBarWrapper` with `paddingLeft: 14` applied at the parent level. All width calculations must subtract 14px from `screenWidth`.

---

## 1. Section-Level Layout & Spacing

### Container Structure (top to bottom)

```
┌─────────────────────────────────────────────┐
│ MOVESET (42)                    [header]    │
├─────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────┐ │
│ │ Search moves...                         │ │  [search input]
│ └─────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│ Generation IX ▾                             │  [version selector]
├─────────────────────────────────────────────┤
│ LEVEL UP                                    │  [group header 1]
├─────────────────────────────────────────────┤
│ [Lv. 1] Move Name     [type] [cat]  P A PP  │  [move row]
│ [Lv. 5] Move Name     [type] [cat]  P A PP  │  [move row]
├─────────────────────────────────────────────┤
│ TM & HM                                     │  [group header 2]
├─────────────────────────────────────────────┤
│ Move Name             [type] [cat]  P A PP  │  [move row]
│ Move Name             [type] [cat]  P A PP  │  [move row]
└─────────────────────────────────────────────┘
```

### Global Spacing Values (pixel values, never relative)

- **Container gap:** All top-level elements within section use `gap: spacing.md (12px)` except where noted
- **Section paddingHorizontal:** Inherited from parent `styles.section` = `spacing.lg (16px)` — do NOT add horizontal padding inside component
- **Effective available width:** `screenWidth - 14 (accentBarWrapper) - 16 (left padding) - 16 (right padding) = screenWidth - 46`

### Section Header (Non-negotiable Format)

**Style class:** Canonical section header (matches ALL sections)

```
fontSize:        fontSize.xs (11px)
fontWeight:      '600'
color:           colors.textMuted (#9A7A7A)
textTransform:   'uppercase'
letterSpacing:   1.5
marginBottom:    spacing.md (12px)
```

**Content:** `"MOVESET"` + move count in secondary color

```jsx
<Text style={styles.sectionHeader}>
  MOVESET <Text style={styles.moveCount}>({totalCount})</Text>
</Text>
```

Where `styles.moveCount`:
```
color:           colors.textSecondary (#B89E9E)
fontSize:        fontSize.xs (11px)
fontWeight:      '600'
```

---

## 2. Game Version Selector

### Visual Treatment (Exact Match: FlavorTextSection Pattern)

**Button appearance (bottom-border only, no background box):**

```
Pressable Row:
  - flexDirection:     'row'
  - justifyContent:    'space-between'
  - alignItems:        'center'
  - alignSelf:         'stretch'
  - paddingVertical:   spacing.md (12px)
  - paddingHorizontal: 0 (no horizontal padding — inherited padding from parent)
  - borderBottomWidth: 1
  - borderBottomColor: colors.border (#3A2E2E)
  - backgroundColor:   transparent (no fill)

On press: opacity: 0.7 (pressed state)
```

**Text content:** `"{gameVersionDisplayName} ▾"`

```
Text (version name):
  - fontSize:     fontSize.md (15px)
  - fontWeight:   '500'
  - color:        colors.text (#F5EEEE)

Text (chevron):
  - fontSize:     fontSize.sm (13px)
  - color:        colors.textSecondary (#B89E9E)
  - marginLeft:   spacing.sm (8px)
```

**Version display formatting:**

- Input: PokeAPI version slug (e.g. "scarlet", "sword", "red")
- Output: Title-case readable name (e.g. "Scarlet", "Sword", "Red")
- Function: Capitalize first letter of each word-segment split by "-"

### Bottom Sheet Modal (Exact Match: FlavorTextSection Pattern)

**Modal container:**

```
Modal:
  - visible:       modalVisible
  - animationType: 'none' (NO animation — Animated.Value drives the sheet only)
  - transparent:   true
  - onRequestClose: closeModal() callback

Backdrop (static Pressable):
  - flex:             1
  - backgroundColor:  'rgba(0,0,0,0.6)' (semi-transparent dark overlay)
  - justifyContent:   'flex-end'
  - onPress:          closeModal()

Animated sheet:
  - backgroundColor:     colors.surface (#1E1A1A)
  - borderTopLeftRadius:  borderRadius.xl (16px)
  - borderTopRightRadius: borderRadius.xl (16px)
  - maxHeight:           '70%' of screen height
  - transform:           [{ translateY: slideAnim }]
    (Animated.Value drives slide from sheet height → 0 on open, 0 → sheet height on close)
    - Slide in: Animated.timing(slideAnim, { toValue: 0, duration: 300 })
    - Slide out: Animated.timing(slideAnim, { toValue: SHEET_HEIGHT, duration: 250 })
```

**Modal header (inside sheet, above FlatList):**

```
View:
  - paddingHorizontal: spacing.lg (16px)
  - paddingVertical:   spacing.lg (16px)
  - borderBottomWidth: 1
  - borderBottomColor: colors.border (#3A2E2E)

Text (title):
  - fontSize:    fontSize.lg (17px)
  - fontWeight:  '600'
  - color:       colors.text (#F5EEEE)
  - content:     "Select Game Version"
```

**Version list inside modal (FlatList or .map()):**

- Grouped by generation (newest first: Gen IX, VIII, VII, VI, V, IV, III, II, I, Other)
- Each generation is a section header
- Versions within each generation are tappable rows

**Generation header (inside modal):**

```
View:
  - borderTopWidth:     1
  - borderTopColor:     colors.border (#3A2E2E)
  - paddingHorizontal:  spacing.lg (16px)
  - paddingTop:         spacing.md (12px)
  - paddingBottom:      spacing.xs (4px)

Text:
  - fontSize:        fontSize.xs (11px)
  - color:           colors.textMuted (#9A7A7A)
  - textTransform:   'uppercase'
  - letterSpacing:   1
  - fontWeight:      '600'
  - content:         e.g. "GENERATION IX"
```

**Version list item (tappable row inside modal):**

```
Pressable:
  - paddingVertical:   14px (fixed, not spacing.md)
  - paddingHorizontal: spacing.lg (16px)
  - flexDirection:     'row'
  - alignItems:        'center'
  - justifyContent:    'space-between'

Text (version name):
  - fontSize:    fontSize.md (15px)
  - color:       colors.text (#F5EEEE)

Text (checkmark):
  - fontSize:    fontSize.md (15px)
  - fontWeight:  '700'
  - color:       colors.primary (#DD3311)
  - content:     '✓'

On selected: backgroundColor = colors.surfaceElevated (#2A2323)

Separator (between rows):
  - borderBottomWidth: 1
  - borderBottomColor: colors.border (#3A2E2E)
  - opacity:          0.4
```

---

## 3. Search Input

### Visual Style

```
TextInput:
  - backgroundColor:        colors.surfaceElevated (#2A2323)
  - borderRadius:           borderRadius.xl (16px) for pill-shaped
  - paddingHorizontal:      spacing.lg (16px)
  - paddingVertical:        spacing.md (12px)
  - fontSize:               fontSize.md (15px)
  - color:                  colors.text (#F5EEEE)
  - borderWidth:            1
  - borderColor:            colors.border (#3A2E2E)
  - placeholderTextColor:   colors.textMuted (#9A7A7A)
  - placeholder:            "Search moves..."
  - marginBottom:           spacing.md (12px)
```

### Placement

- Appears immediately after the section header (before version selector)
- Full width, inheriting parent horizontal padding

---

## 4. Learn Method Group Headers

### Visual Style (NEW — subordinate to canonical section header)

```
View (group header container):
  - paddingVertical:   spacing.xs (4px)
  - paddingHorizontal: 0 (no additional padding)
  - marginTop:         spacing.md (12px) (above first group only; subsequent groups get marginTop: spacing.lg (16px))
  - borderBottomWidth: 1
  - borderBottomColor: colors.border (#3A2E2E)

Text:
  - fontSize:        fontSize.xs (11px)
  - fontWeight:      '600'
  - color:           colors.textMuted (#9A7A7A)
  - textTransform:   'uppercase'
  - letterSpacing:   1.5
```

### Content Labels (in exact order, only if group has moves)

1. `"LEVEL UP"` (moves with `learnMethod === 'level-up'`)
2. `"TM & HM"` (moves with `learnMethod === 'tm'` OR `learnMethod === 'hm'`)
3. `"EGG MOVES"` (moves with `learnMethod === 'egg'`)
4. `"TUTOR"` (moves with `learnMethod === 'tutor'` OR `learnMethod === 'move-tutor'`)
5. `"OTHER"` (all remaining learn methods)

**Visibility rule:** Hide group header AND group entirely if zero moves for selected game version.

---

## 5. Move Row Extended Layout

### Replication of Moves List Screen Row + Level Badge

**Row container (exact replication of Moves list screen):**

```
Pressable:
  - flexDirection:      'row'
  - alignItems:         'center'
  - backgroundColor:    colors.surface (#1E1A1A)
  - paddingHorizontal:  spacing.lg (16px)
  - paddingVertical:    spacing.md (12px)
  - borderBottomWidth:  1
  - borderBottomColor:  colors.border (#3A2E2E)
  - justifyContent:     'space-between'

On press: opacity = 0.7 (pressed state)
```

### Row Content (left to right, exactly as Moves list screen)

#### 5.1 Left Column (flex: 1)

```
View (leftColumn):
  - flex:          1
  - flexDirection: 'column'
  - gap:           spacing.xs (4px)
```

**Row 1: Move Name (or Lv Badge + Move Name for level-up moves)**

For **level-up moves ONLY:**

```
View (inline row with badge):
  - flexDirection: 'row'
  - alignItems:    'center'
  - gap:           spacing.xs (4px)

Lv Badge:
  - fontSize:           fontSize.xs (11px)
  - fontWeight:         '700'
  - color:              colors.accent (#FFD700) — YES, MUST USE ACCENT COLOR
  - backgroundColor:    'rgba(255,215,0,0.12)' (semi-transparent gold fill)
  - paddingHorizontal:  6px
  - paddingVertical:    2px
  - borderRadius:       borderRadius.sm (4px)
  - content:            "Lv. {level}" or "Lv. —" if level is null

Move Name Text (flex: 1):
  - fontSize:    fontSize.lg (17px)
  - fontWeight:  '600'
  - color:       colors.text (#F5EEEE)
  - numberOfLines: 1
```

For **TM/HM, egg, tutor, other moves:**

```
Text (move name only, no badge):
  - fontSize:    fontSize.lg (17px)
  - fontWeight:  '600'
  - color:       colors.text (#F5EEEE)
  - numberOfLines: 1
```

**Row 2: Stats Row (Type Badge → Category Icon → Stat Blocks)**

```
View (statsRow):
  - flexDirection: 'row'
  - alignItems:    'center'
  - gap:           spacing.sm (8px)
```

**Type Badge (exact replication):**

```
View (typeBadgeWrapper):
  - width:  75px (fixed)
  - height: 28px (fixed)

Child: TypeBadge
  - type:  move.type
  - size:  'sm'
  - fixed: true
```

**Category Icon (exact replication):**

```
Image:
  - width:     65px
  - height:    28px
  - contentFit: 'fill'
  - source:    require('../../../assets/icons/moves/{category}.png')
    where category is 'physical', 'special', 'status', or 'both'
```

**Stat Blocks (Power / Accuracy / PP) — exact replication:**

```
View (statBlocks):
  - flexDirection: 'column'
  - marginLeft:    spacing.md (12px)

Stat Header Row:
  - flexDirection:      'row'
  - gap:                spacing.md (12px)
  - borderBottomWidth:  1
  - borderBottomColor:  colors.border (#3A2E2E)
  - paddingBottom:      1px
  - marginBottom:       2px

  Header text labels:
    - fontSize:     fontSize.sm (13px)
    - color:        colors.textMuted (#9A7A7A)
    - width:        32px (all headers)
    - textAlign:    'center'
    - content:      "Pwr" | "Acc" | "PP"
    - Special case for "Acc": paddingLeft: 4px, width: 38px (wider for % sign)
    - Special case for "PP": paddingLeft: 13px

Stat Value Row:
  - flexDirection: 'row'
  - gap:           spacing.md (12px)

  Value text:
    - fontSize:     fontSize.sm (13px)
    - fontWeight:   '600'
    - color:        colors.text (#F5EEEE)
    - width:        32px (all values)
    - textAlign:    'center'
    - content:      power || "—" | accuracy + "%" || "—" | pp
    - Special case for "Acc%": paddingLeft: 4px, width: 38px
```

#### 5.2 Chevron (right column)

```
Text (chevron):
  - fontSize:   fontSize.xl (20px)
  - color:      colors.textMuted (#9A7A7A)
  - marginLeft: spacing.sm (8px)
  - content:    '›'
```

### Row Height Calculation

Each row has:
- paddingVertical: spacing.md (12px) top + bottom = 24px
- Move name text: ~20px (single line, fontSize 17)
- Stats row: ~28px (type badge + category icon = 28px fixed height, or stat blocks ≈ 28px)
- Total per move: ~72–76px

Estimated FlatList item size: **76px** (for renderer optimization)

---

## 6. Row Interaction

### Tap Target

Entire row is a Pressable with `onPress` callback:

```javascript
const handleMovePress = (moveId: number) => {
  router.push(`/(main)/(pokedex)/moves/${moveId}`);
};
```

### Pressed State

```
opacity: 0.7
```

No additional visual feedback (shadow, color change, etc.) — opacity alone is sufficient.

---

## 7. Empty & Loading States

### Empty Search Results

If search returns zero moves:

```
Text (emptyState):
  - fontSize:   fontSize.md (15px)
  - color:      colors.textMuted (#9A7A7A)
  - fontStyle:  'italic'
  - textAlign:  'center'
  - marginTop:  spacing.lg (16px)
  - marginBottom: spacing.lg (16px)
  - content:    "No moves found"
```

### Loading State

If `useMovesetForPokemon` is loading:

```
ActivityIndicator:
  - size:       'large'
  - color:      typeColor (or colors.textSecondary as fallback)
  - marginTop:  spacing.lg (16px)
```

### No Moves for Selected Version

If all groups have zero moves for the selected version:

```
View (empty state container):
  - marginTop:  spacing.lg (16px)

Text:
  - fontSize:   fontSize.md (15px)
  - color:      colors.textMuted (#9A7A7A)
  - fontStyle:  'italic'
  - textAlign:  'center'
  - content:    "{Pokemon name} cannot learn any moves in this version"
```

---

## 8. Edge Cases & Validation Rules

### Edge Case 1: Pokémon with No Moves in Any Version

**Scenario:** A Pokémon legitimately has zero moves (e.g., hypothetical egg-only form).

**Behavior:** Display empty state: "No moves available"

**Implementation:** Check `moves.length === 0` after filtering for selected version.

### Edge Case 2: Move with Null Level (Level-Up)

**Scenario:** A level-up move has `learnLevel === null`.

**Behavior:** Display `"Lv. —"` badge (em-dash, not hyphen).

**Implementation:** `learnLevel !== null ? learnLevel : '—'`

### Edge Case 3: Move with Null Power or Accuracy

**Scenario:** Status moves have `power === null` and/or `accuracy === null`.

**Behavior:** Display `"—"` (em-dash) in the stat block.

**Implementation:** Already handled in Moves list screen: `power !== null ? String(power) : '—'`

### Edge Case 4: Very Long Move List (100+ moves)

**Scenario:** Mew or other move-pool-rich Pokémon has >100 learnable moves.

**Behavior:** FlatList with `scrollEnabled={false}` — outer ScrollView handles scrolling. No virtualization needed (below-fold content deferred anyway).

**Implementation:** Render all moves via `.map()` or FlatList, outer ScrollView handles scroll position.

### Edge Case 5: Missing Category Icon

**Scenario:** Category icon file is missing or offline.

**Behavior:** Show Image component with empty fallback; log error to console.

**Implementation:** `Image` component has built-in error handling; display nothing or placeholder.

### Edge Case 6: Selected Version Not in Moveset Data

**Scenario:** User selects a version, but no moves exist for that version (e.g., Gen 9 Pokémon selected Gen 1 Red version).

**Behavior:** Show empty state, version selector still works. Re-selecting a version with moves displays them.

**Implementation:** Filter `moves` array by selected `gameVersion`; if empty, show empty state.

---

## 9. Accessibility Requirements

### Screen Reader Annotations

**Move row:** Each row should be announced as:
- Move name
- Type
- Learn method (e.g., "Level 5", "TM", "Egg")
- Power, accuracy, PP (if available)

```jsx
// Example:
accessibilityLabel={`${move.displayName}, ${move.type} type, ${formatLearnMethod(move.learnMethod, move.learnLevel)}, Power ${move.power ?? 'N/A'}, Accuracy ${move.accuracy ?? 'N/A'}%, PP ${move.pp}`}
accessibilityRole="button"
accessibilityHint="Double tap to view move details"
```

### Contrast Compliance

- Section header: `colors.textMuted` (#9A7A7A) on `colors.background` (#111010) — WCAG AA 4.5:1 ✅
- Move name: `colors.text` (#F5EEEE) on `colors.surface` (#1E1A1A) — WCAG AAA 15.8:1 ✅
- Level badge: `colors.accent` (#FFD700) on `rgba(255,215,0,0.12)` bg — **manually verify** (gold-on-subtle-gold may be borderline)

### Touch Target Sizing

- Move row: 76px tall (meets 44px minimum accessibility target) ✅
- Pressable areas: 44px minimum recommended

---

## 10. Styling Summary Table

| Element | Font Size | Font Weight | Color | Background | Border | Padding |
|---------|-----------|-------------|-------|------------|--------|---------|
| Section Header | 11 (xs) | 600 | textMuted | N/A | N/A | marginBottom: 12 |
| Move Count | 11 (xs) | 600 | textSecondary | N/A | N/A | N/A |
| Search Input | 15 (md) | normal | text | surfaceElevated | border, 1px | 16h / 12v |
| Version Selector | 15 (md) | 500 | text | transparent | bottom-border | 12v |
| Group Header | 11 (xs) | 600 | textMuted | N/A | bottom-border | 4v |
| Move Name | 17 (lg) | 600 | text | N/A | N/A | N/A |
| Lv Badge | 11 (xs) | 700 | accent | rgba(255,215,0,0.12) | N/A | 6h / 2v |
| Type Badge | — | — | N/A | type-specific | N/A | 75w × 28h |
| Stat Label | 13 (sm) | normal | textMuted | N/A | N/A | N/A |
| Stat Value | 13 (sm) | 600 | text | N/A | N/A | N/A |
| Chevron | 20 (xl) | normal | textSecondary | N/A | N/A | marginLeft: 8 |
| Move Row BG | — | — | N/A | surface | bottom-border | 16h / 12v |

---

## 11. Data Flow & Dependencies

### Required Hooks

1. **`useMovesetForPokemon(pokemonId, searchQuery, sortBy)`**
   - Returns: `{ moves: Move[], isLoading: bool, error: Error | null }`
   - Move type: `{ id, displayName, type, category, power, accuracy, pp, learnMethod, learnLevel, gameVersion }`
   - Cache key: `['pokemon', 'moveset', pokemonId, searchQuery, sortBy]`

### State Management

```typescript
// Inside MovesetSection component:
const [selectedGameVersion, setSelectedGameVersion] = useState<string>(/* default version */);
const [moveSearchQuery, setMoveSearchQuery] = useState('');
const [sortBy, setSortBy] = useState<'name' | 'power' | 'accuracy'>('name');
const [modalVisible, setModalVisible] = useState(false);
const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;
```

### Filtering Logic

```typescript
// Group moves by learn method for selected version
const groupedMoves = useMemo(() => {
  const filtered = moves.filter(m => m.gameVersion === selectedGameVersion);
  return {
    levelUp: filtered.filter(m => m.learnMethod === 'level-up').sort((a, b) => (a.learnLevel ?? Infinity) - (b.learnLevel ?? Infinity)),
    tmHm: filtered.filter(m => m.learnMethod === 'tm' || m.learnMethod === 'hm'),
    egg: filtered.filter(m => m.learnMethod === 'egg'),
    tutor: filtered.filter(m => m.learnMethod === 'tutor' || m.learnMethod === 'move-tutor'),
    other: filtered.filter(m => !['level-up', 'tm', 'hm', 'egg', 'tutor', 'move-tutor'].includes(m.learnMethod.toLowerCase())),
  };
}, [moves, selectedGameVersion]);
```

---

## 12. Responsive Behavior

### Minimum Screen Width

- Target minimum: 320px (iPhone SE)
- Effective available width: `320 - 46 = 274px`

**Layout stability at 320px:**
- Type badge (75px) + Category icon (65px) + Stat blocks (~100px) = ~240px ✅
- Leaves ~34px for gaps and margins — tight but acceptable

### Scaling at Wider Widths (iPad, landscape)

- All elements scale proportionally (flex-based layout)
- `flex: 1` on leftColumn expands as row width increases
- Type badge and category icon are fixed width (no scaling)
- Stat blocks maintain fixed label/value widths

### Font Scaling

- iOS: `allowFontScaling={true}` by default
- Override at component level if accessibility issues arise
- `maxFontSizeMultiplier={1.2}` for move names (prevent runaway scaling)

---

## 13. Performance Considerations

### FlatList vs. Map

**Use case:** Non-scrollable list inside scrolling parent.

**Decision:** Use `.map()` instead of `FlatList` because:
- `scrollEnabled={false}` on FlatList disables virtualization (no performance benefit)
- `.map()` simpler, fewer props, clearer React reconciliation
- Move list typically <100 items (below typical virtualization threshold)

### Memoization

```typescript
// Memoize grouped/filtered moves to prevent re-renders on unrelated state changes
const groupedMoves = useMemo(() => { /* grouping logic */ }, [moves, selectedGameVersion]);

// Memoize row renderer if using FlatList
const renderMoveRow = useCallback(({ item }) => { /* render logic */ }, [selectedGameVersion]);
```

### Animation Performance

- Bottom sheet slide uses `useNativeDriver: true` on Animated.timing
- No heavy transforms or shadows on individual move rows
- Opacity change on press (cheap operation) rather than scale or color

---

## 14. Implementation Checklist

- [ ] **Section header**: Canonical format + move count
- [ ] **Search input**: Full-width, bordered, searchable
- [ ] **Game version selector**: Bottom-border Pressable, opens bottom sheet modal
- [ ] **Modal sheet**: Animated slide-up, versions grouped by generation newest-first
- [ ] **Learn method group headers**: Subordinate style (smaller, muted, underline)
- [ ] **Move rows**: Lv badge for level-up only, exact Moves list screen layout replication
- [ ] **Move name inline with Lv badge**: flexDirection row, gap between badge and name
- [ ] **Type badge, Category icon, Stat blocks**: Exact same dimensions/spacing as Moves screen
- [ ] **Empty states**: Search, no moves, no version data
- [ ] **Loading state**: ActivityIndicator while fetching
- [ ] **Row interactions**: Navigate to move detail on press
- [ ] **Accessibility**: Screen reader labels, contrast compliance, touch targets
- [ ] **Responsive layout**: Test at 320px, 414px, tablet sizes
- [ ] **Dark mode compatibility**: All colors from design tokens, no hardcoded values
- [ ] **Keyboard support**: Search input focus state, dismiss keyboard on scroll
- [ ] **Performance**: Memoization, no unnecessary re-renders, animation performance

---

## 15. Notes for Developer

### Critical Implementation Details

1. **Level badge color is ACCENT, not primary:** The spec calls for `colors.accent (#FFD700)`, not `colors.primary`. This is intentional — accent is the gold highlight color used throughout the design system.

2. **Version selector is bottom-border ONLY:** No background fill, no rounded corners, no shadow. Exact replication of FlavorTextSection pattern.

3. **Modal animation is slide-only:** `animationType="none"` means NO fade-in of the modal itself. The sheet's `Animated.View` slides from bottom up only. Backdrop is static.

4. **Group headers are NOT section-level:** They are subordinate to the main section header. Smaller font (11px, not 15px), muted color, underline border.

5. **accentBarWrapper offset applies globally:** Any width calculation must account for the 14px left padding on the parent wrapper. When computing `cardWidth`, the formula is: `(screenWidth - 14 - 2 * spacing.lg - gaps) / columns`.

6. **Search input styling is surfaceElevated background:** NOT surface. The border radius is `borderRadius.xl (16px)` for a pill-shaped input.

7. **Stat blocks must preserve exact spacing from Moves screen:** The gap between "Pwr|Acc|PP" header and values is 2px (margin-bottom on header, margin-top on values implicitly). The "Acc" column is 38px wide, not 32px, to accommodate the "%" sign.

### Testing Guidance

**On-device validation checklist:**

1. Navigate to a Pokémon with >50 moves (e.g., Mew, Alakazam, Machamp)
2. Verify section header renders correctly with move count
3. Tap version selector → modal opens and slides up smoothly
4. Verify versions are grouped by generation (newest first)
5. Select a different version → move list updates immediately
6. Verify level-up moves show Lv badge inline with move name
7. Verify TM moves do NOT show Lv badge
8. Verify all stat blocks (Power, Accuracy, PP) align correctly
9. Tap a move row → navigates to move detail screen (opacity press feedback)
10. Search for a move by name → list filters in real-time
11. Search for non-existent move → empty state appears
12. Test on narrow screen (320px) → type badge + category icon + stat blocks still visible, no overflow
13. Test at iPad landscape → layout extends smoothly, no jank
14. Close modal by tapping backdrop → sheet slides down smoothly
15. Close modal by tapping outside (backdrop) → selectedVersion remains unchanged

### Common Pitfalls to Avoid

- **Do NOT use `flex` on the type badge or category icon** — they are fixed-width.
- **Do NOT add horizontal padding inside the component** — inherit from parent `styles.section`.
- **Do NOT forget the 14px accentBarWrapper offset** when computing available width.
- **Do NOT change the accent color to primary** — the Lv badge uses gold (`colors.accent`), not red.
- **Do NOT use FlatList with `scrollEnabled={true}`** — it competes with parent ScrollView. Use `scrollEnabled={false}` or `.map()`.
- **Do NOT forget `useNativeDriver: true`** on Animated.timing — improves modal animation performance.
- **Do NOT hardcode version names** — use a formatter function to convert PokeAPI slugs to display names.

---

## Appendix: Design Token Reference

```javascript
// Colors
colors.background      #111010   (primary dark bg)
colors.surface         #1E1A1A   (row/card bg)
colors.surfaceElevated #2A2323   (input/modal bg)
colors.border          #3A2E2E   (borders, dividers)
colors.text            #F5EEEE   (primary text)
colors.textSecondary   #B89E9E   (secondary text)
colors.textMuted       #9A7A7A   (muted text, labels)
colors.accent          #FFD700   (gold highlight)
colors.primary         #DD3311   (red, not used here)

// Spacing (pixels, never relative)
spacing.xs             4px
spacing.sm             8px
spacing.md             12px
spacing.lg             16px
spacing.xl             24px

// Font Size (pixels)
fontSize.xs            11px
fontSize.sm            13px
fontSize.md            15px
fontSize.lg            17px
fontSize.xl            20px

// Border Radius (pixels)
borderRadius.sm        4px
borderRadius.md        8px
borderRadius.lg        12px
borderRadius.xl        16px
borderRadius['2xl']    24px
```

---

**End of Specification**
