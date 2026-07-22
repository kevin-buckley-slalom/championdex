# Phase 5 — Remaining Data Gaps Spec

**Created:** 2026-07-21  
**DB version at analysis:** v1.26.0  
**Audit source:** `scripts/output/pokemon_data_audit.json` (generated 2026-07-21)  
**Status:** Phase 5 complete — DB v1.28.0 device-verified

This document is the source of truth for all data gaps that remain after the Phase 1–4 remediation sprint. It supersedes the deferred items listed in `IMPLEMENTATION_PLAN.md`. Check tasks off here as they are completed.

---

## How to read this document

Each section covers one field type. Within each section:
- **Already handled** rows are gaps the audit flags but that are resolved by existing UI logic — no data needed.
- **Actionable** rows require new DB data or script changes.
- A ☐ / ✅ checkbox tracks completion status.

Run `node scripts/auditPokemonData.js` after any batch of fixes to verify counts drop as expected.

---

## 1. Pokédex Entries

**Audit count:** 271 flagged  
**Actually actionable:** 140 forms  

### 1a. Already handled by UI (Task 3.3) — no action needed

| Form type | Count | UI behavior |
|---|---|---|
| Mega forms | 97 | Shows base form's flavor text |
| Gigantamax forms | 34 | Shows base form's flavor text |

### 1b. Require manual data sourcing — Bulbapedia

**Source:** Bulbapedia individual Pokémon articles (e.g. `https://bulbapedia.bulbagarden.net/wiki/Vulpix_(Pokémon)` — each article lists flavor text per game for each form).  
**Target table:** `pokemon_flavor_text(pokemon_id, version_id, flavor_text)`  
**Insert rule:** `INSERT OR IGNORE` — never overwrite existing rows.

#### Regional forms (58 forms) — Alolan ✅ | Galarian ✅ | Hisuian ✅ | Paldean ✅ | others N/A

| # | Display name | DB id | Status |
|---|---|---|---|
| 19 | Alolan Rattata | 30 | ✅ |
| 20 | Alolan Raticate | 32 | ✅ |
| 26 | Alolan Raichu | 40 | ✅ |
| 27 | Alolan Sandshrew | 44 | ✅ |
| 28 | Alolan Sandslash | 46 | ✅ |
| 37 | Alolan Vulpix | 57 | ✅ |
| 38 | Alolan Ninetales | 59 | ✅ |
| 50 | Alolan Diglett | 72 | ✅ |
| 51 | Alolan Dugtrio | 74 | ✅ |
| 52 | Alolan Meowth | 76 | ✅ |
| 52 | Galarian Meowth | 77 | ✅ |
| 53 | Alolan Persian | 80 | ✅ |
| 58 | Hisuian Growlithe | 86 | ☐ |
| 59 | Hisuian Arcanine | 88 | ☐ |
| 74 | Alolan Geodude | 107 | ✅ |
| 75 | Alolan Graveler | 109 | ✅ |
| 76 | Alolan Golem | 111 | ✅ |
| 77 | Galarian Ponyta | 113 | ✅ |
| 78 | Galarian Rapidash | 115 | ✅ |
| 79 | Galarian Slowpoke | 117 | ✅ |
| 80 | Galarian Slowbro | 120 | ✅ |
| 83 | Galarian Farfetch'd | 124 | ✅ |
| 88 | Alolan Grimer | 130 | ✅ |
| 89 | Alolan Muk | 132 | ✅ |
| 100 | Hisuian Voltorb | 147 | ✅ |
| 101 | Hisuian Electrode | 149 | ✅ |
| 103 | Alolan Exeggutor | 152 | ✅ |
| 105 | Alolan Marowak | 155 | ✅ |
| 110 | Galarian Weezing | 161 | ✅ |
| 122 | Galarian Mr. Mime | 176 | ✅ |
| 128 | Paldean Tauros (Combat) | 184 | ✅ |
| 128 | Paldean Tauros (Blaze) | 185 | ✅ |
| 128 | Paldean Tauros (Aqua) | 186 | ✅ |
| 144 | Galarian Articuno | 208 | ✅ |
| 145 | Galarian Zapdos | 210 | ✅ |
| 146 | Galarian Moltres | 212 | ✅ |
| 157 | Hisuian Typhlosion | 228 | ✅ |
| 194 | Paldean Wooper | 268 | ✅ |
| 199 | Galarian Slowking | 274 | ✅ |
| 211 | Hisuian Qwilfish | 288 | ✅ |
| 215 | Hisuian Sneasel | 295 | ✅ |
| 222 | Galarian Corsola | 303 | ✅ |
| 263 | Galarian Zigzagoon | 351 | ✅ |
| 264 | Galarian Linoone | 353 | ✅ |
| 503 | Hisuian Samurott | 642 | ✅ |
| 549 | Hisuian Lilligant | 692 | ✅ |
| 554 | Galarian Darumaka | 700 | ✅ |
| 555 | Galarian Darmanitan | 703 | ✅ |
| 555 | Galarian Darmanitan Zen | 704 | ✅ |
| 562 | Galarian Yamask | 713 | ✅ |
| 570 | Hisuian Zorua | 723 | ✅ |
| 571 | Hisuian Zoroark | 725 | ✅ |
| 618 | Galarian Stunfisk | 775 | ✅ |
| 628 | Hisuian Braviary | 787 | ✅ |
| 705 | Hisuian Sliggoo | 888 | ✅ |
| 706 | Hisuian Goodra | 890 | ✅ |
| 713 | Hisuian Avalugg | 904 | ✅ |
| 724 | Hisuian Decidueye | 921 | ✅ |

#### Alternate forms (76 forms) ✅ complete

| # | Display name | DB id | Notes | Status |
|---|---|---|---|---|
| 382 | Primal Kyogre | 490 | Unique Pokédex entries exist | ✅ |
| 383 | Primal Groudon | 492 | Unique Pokédex entries exist | ✅ |
| 386 | Deoxys Attack | 497 | | ✅ |
| 386 | Deoxys Defense | 498 | | ✅ |
| 386 | Deoxys Speed | 499 | | ✅ |
| 412 | Burmy Sandy | 527 | | ✅ |
| 412 | Burmy Trash | 528 | | ✅ |
| 413 | Wormadam Sandy | 530 | | ✅ |
| 413 | Wormadam Trash | 531 | | ✅ |
| 479 | Rotom Heat | 606 | | ✅ |
| 479 | Rotom Wash | 607 | | ✅ |
| 479 | Rotom Frost | 608 | | ✅ |
| 479 | Rotom Fan | 609 | | ✅ |
| 479 | Rotom Mow | 610 | | ✅ |
| 483 | Origin Dialga | 615 | | ✅ |
| 484 | Origin Palkia | 617 | | ✅ |
| 487 | Giratina Origin | 622 | | ✅ |
| 492 | Shaymin Sky | 629 | | ✅ |
| 550 | Basculin Blue-Striped | 694 | | ✅ |
| 550 | Basculin White-Striped | 695 | | ✅ |
| 555 | Darmanitan Zen | 702 | | ✅ |
| 641 | Tornadus Therian | 801 | | ✅ |
| 642 | Thundurus Therian | 803 | | ✅ |
| 645 | Landorus Therian | 807 | | ✅ |
| 646 | Kyurem Black | 809 | | ✅ |
| 646 | Kyurem White | 810 | | ✅ |
| 647 | Keldeo Resolute | 812 | | ✅ |
| 648 | Meloetta Pirouette | 814 | | ✅ |
| 658 | Ash-Greninja | 828 | Copied from base Greninja | ✅ |
| 658 | Greninja Bond | 827 | Copied from base Greninja | ✅ |
| 670 | Floette Eternal | 843 | AZ's Floette — unique lore | ✅ |
| 681 | Aegislash Blade | 859 | | ✅ |
| 710 | Pumpkaboo Small | 895 | | ✅ |
| 710 | Pumpkaboo Large | 896 | | ✅ |
| 710 | Pumpkaboo Super | 897 | | ✅ |
| 711 | Gourgeist Small | 899 | | ✅ |
| 711 | Gourgeist Large | 900 | | ✅ |
| 711 | Gourgeist Super | 901 | | ✅ |
| 718 | Zygarde 10% | 910 | | ✅ |
| 718 | Zygarde Complete | 911 | | ✅ |
| 720 | Hoopa Unbound | 916 | | ✅ |
| 741 | Oricorio Pom-Pom | 940 | | ✅ |
| 741 | Oricorio Pa'u | 941 | | ✅ |
| 741 | Oricorio Sensu | 942 | | ✅ |
| 744 | Rockruff Dusk | 946 | | ✅ |
| 745 | Lycanroc Midnight | 948 | | ✅ |
| 745 | Lycanroc Dusk | 949 | | ✅ |
| 746 | Wishiwashi School | 951 | | ✅ |
| 778 | Mimikyu Busted | 985 | | ✅ |
| 800 | Necrozma Dusk-Mane | 1009 | | ✅ |
| 800 | Necrozma Dawn-Wings | 1010 | | ✅ |
| 800 | Ultra Necrozma | 1011 | | ✅ |
| 849 | Toxtricity Low-Key | 1075 | | ✅ |
| 875 | Eiscue Noice | 1087 | | ✅ |
| 877 | Morpeko Hangry | 1090 | | ✅ |
| 888 | Zacian Crowned | 1127 | | ✅ |
| 889 | Zamazenta Crowned | 1129 | | ✅ |
| 890 | Eternamax Eternatus | 1131 | | ✅ |
| 892 | Urshifu Rapid-Strike | 1134 | | ✅ |
| 898 | Calyrex Ice Rider | 1143 | | ✅ |
| 898 | Calyrex Shadow Rider | 1144 | | ✅ |
| 901 | Bloodmoon Ursaluna | 1148 | | ✅ |
| 905 | Enamorus Therian | 1154 | | ✅ |
| 964 | Palafin Hero | 1216 | | ✅ |
| 978 | Tatsugiri Droopy | 1232 | | ✅ |
| 978 | Tatsugiri Stretchy | 1233 | | ✅ |
| 999 | Gimmighoul Roaming | 1259 | | ✅ |
| 1017 | Ogerpon Wellspring | 1278 | | ✅ |
| 1017 | Ogerpon Hearthflame | 1279 | | ✅ |
| 1017 | Ogerpon Cornerstone | 1280 | | ✅ |
| 1017 | Ogerpon Wellspring Tera | 1282 | | ✅ |
| 1017 | Ogerpon Hearthflame Tera | 1283 | | ✅ |
| 1017 | Ogerpon Cornerstone Tera | 1284 | | ✅ |
| 1017 | Ogerpon Teal Tera | 1281 | Copied from base Ogerpon | ✅ |
| 1024 | Terapagos Terastal | 1292 | | ✅ |
| 1024 | Terapagos Stellar | 1293 | | ✅ |

#### Cosmetic female forms (6 forms) ✅ complete

| # | Display name | DB id | Status |
|---|---|---|---|
| 29 | Nidoran ♀ | 47 | ✅ |
| 32 | Nidoran ♂ | 50 | ✅ |
| 678 | Meowstic (Female) | 853 | ✅ |
| 876 | Indeedee (Female) | 1111 | ✅ |
| 901 | Basculegion (Female) | 1150 | ✅ |
| 916 | Oinkologne (Female) | 1166 | ✅ |

**Note on Nidoran:** Nidoran ♀ and ♂ have their own individual species articles on Bulbapedia with flavor text. They are not truly "cosmetic" — they are separate species. The `form_type = 'cosmetic'` classification in the DB is for query fallback purposes; they still need unique flavor text.

---

## 2. Encounter Locations

**Audit count:** 371 flagged  
**Actually actionable:** 26 forms (the rest are handled by UI or blocked by PokeAPI gaps)

### 2a. Already handled — no action needed

| Category | Count | Resolution |
|---|---|---|
| Mega forms | 97 | Task 3.2 UI fallback — shows base form encounters |
| Gigantamax forms | 34 | Task 3.2 UI fallback |
| Alternate forms | 76 | Task 3.2 UI fallback |
| Cosmetic female forms | 6 | Task 3.2 UI fallback |
| Legendary/mythical defaults (no wild encounters by design) | 12 | Task 3.1 smart empty state |

### 2b. Blocked — waiting on PokeAPI

| Category | Count | Unblock trigger |
|---|---|---|
| Gen 9 default forms | 119 | Clear `encounters_backfill_v1` in sync_metadata when PokeAPI populates SV/LA data |
| Gen 9 + mythical overlap | 1 | Same |

### 2c. Actionable — regional forms with no encounter rows (26 forms) ☐

These were supposed to be covered by Phase 4 Task 4.1, but 26 regional forms still have no encounter rows. Most are Hisuian or Paldean — their PokeAPI encounter data may be empty (Legends: Arceus and Scarlet/Violet encounter data is sparse in PokeAPI) or the fetch may have missed them due to slug issues.

**Recommended next step:** Run a targeted PokeAPI probe for each of these 26 forms before assuming manual sourcing is needed. If PokeAPI returns empty arrays for Hisuian/Paldean forms, the smart empty state (Task 3.1) handles the UI correctly — no manual data needed.

| DB id | Display name | Likely reason for gap |
|---|---|---|
| 59 | Alolan Ninetales | PokeAPI may have data — check slug |
| 86 | Hisuian Growlithe | Legends: Arceus — PokeAPI likely empty |
| 88 | Hisuian Arcanine | Legends: Arceus — PokeAPI likely empty |
| 111 | Alolan Golem | PokeAPI may have data — check slug |
| 120 | Galarian Slowbro | PokeAPI may have data — check slug |
| 132 | Alolan Muk | PokeAPI may have data — check slug |
| 147 | Hisuian Voltorb | Legends: Arceus — PokeAPI likely empty |
| 149 | Hisuian Electrode | Legends: Arceus — PokeAPI likely empty |
| 184 | Paldean Tauros | Scarlet/Violet — PokeAPI likely empty |
| 185 | Paldean Tauros | Scarlet/Violet — PokeAPI likely empty |
| 186 | Paldean Tauros | Scarlet/Violet — PokeAPI likely empty |
| 228 | Hisuian Typhlosion | Legends: Arceus — PokeAPI likely empty |
| 268 | Paldean Wooper | Scarlet/Violet — PokeAPI likely empty |
| 274 | Galarian Slowking | PokeAPI may have data — check slug |
| 288 | Hisuian Qwilfish | Legends: Arceus — PokeAPI likely empty |
| 295 | Hisuian Sneasel | Legends: Arceus — PokeAPI likely empty |
| 642 | Hisuian Samurott | Legends: Arceus — PokeAPI likely empty |
| 692 | Hisuian Lilligant | Legends: Arceus — PokeAPI likely empty |
| 704 | Galarian Darmanitan | PokeAPI may have data — check slug |
| 723 | Hisuian Zorua | Legends: Arceus — PokeAPI likely empty |
| 725 | Hisuian Zoroark | Legends: Arceus — PokeAPI likely empty |
| 787 | Hisuian Braviary | Legends: Arceus — PokeAPI likely empty |
| 888 | Hisuian Sliggoo | Legends: Arceus — PokeAPI likely empty |
| 890 | Hisuian Goodra | Legends: Arceus — PokeAPI likely empty |
| 904 | Hisuian Avalugg | Legends: Arceus — PokeAPI likely empty |
| 921 | Hisuian Decidueye | Legends: Arceus — PokeAPI likely empty |

---

## 3. Moves

**Audit count:** 138 flagged  
**Actually actionable:** ~6 forms (possibly 0 after DB state verification)

### 3a. Already handled — no action needed

| Category | Count | Resolution |
|---|---|---|
| Mega forms | 97 | MovesetSection falls back to base form moves |
| Gigantamax forms | 34 | MovesetSection falls back to base form moves |

### 3b. Verify DB state — may already be fixed

The audit flags these as missing, but HANDOFF.md records them as fixed this session. **Run a targeted SQL check before treating as actionable.**

```sql
-- Female cosmetic forms — should all have moves
SELECT p.display_name, COUNT(pm.id) as move_count
FROM pokemon p
LEFT JOIN pokemon_moves pm ON pm.pokemon_id = p.id
WHERE p.id IN (47, 50, 853, 1089, 1150, 1166)
GROUP BY p.id;

-- Unown moves
SELECT COUNT(*) FROM pokemon_moves WHERE pokemon_id = (SELECT id FROM pokemon WHERE name = 'unown');
```

| Form | DB id | Expected move count | Status |
|---|---|---|---|
| Nidoran ♀ | 47 | >0 | ☐ verify |
| Nidoran ♂ | 50 | >0 | ☐ verify |
| Meowstic (Female) | 853 | >0 | ☐ verify |
| Indeedee (Female) | 1089 | >0 | ☐ verify |
| Basculegion (Female) | 1150 | >0 | ☐ verify |
| Oinkologne (Female) | 1166 | >0 | ☐ verify |
| Unown | (default id) | 22 | ☐ verify |

### 3c. Blocked — no data source available

| Form | Count | Notes |
|---|---|---|
| Z-A Mega forms with 0 moves | ~5 | PokeAPI has no move data; game not yet released. Re-check when PokeAPI updates. |

---

## 4. Evolution Chain

**Audit count:** 202 flagged  
**Actually actionable:** ~50 forms (the rest are audit false positives)

### 4a. Audit false positives — fix audit script, not data

**151 default-form single-stage Pokémon** are flagged because the audit script doesn't distinguish "no evolution exists" from "evolution data missing." These are all correctly represented — they are legitimately single-stage Pokémon with no evolutions.

**Action needed:** Fix `scripts/auditPokemonData.js` to exclude single-stage Pokémon from the evolution chain gap count. Use the same `knownNoEvolution` set pattern used for encounters in Task 1.1.

Sample of false positives: Tauros, Ditto, Articuno, Zapdos, Moltres, Unown, Shuckle, Delibird, Smeargle, Miltank, Raikou, Entei, Suicune, Lugia, Ho-Oh, Plusle, Minun, Torkoal, Spinda, Castform, Kecleon, Tropius, Relicanth, Luvdisc, all Gen 9 paradox/legendary mons, etc.

### 4b. Regional forms — full evolution chain audit (all 58 forms)

SQL query run 2026-07-21 against DB v1.27.0. Each form checked for incoming (`evolves_to_id`) and outgoing (`pokemon_id`) evolution rows.

**Key:**
- ✅ — evolution data present and correct
- 🔴 — missing rows, needs DB patch
- ⚪ — single-stage by design, no rows needed (audit false positive)
- ☐ — needs investigation before deciding

| DB id | Display name | Evolution status | Notes | Action |
|---|---|---|---|---|
| 30 | Alolan Rattata | ✅ | Outgoing → Alolan Raticate (level-up) | None |
| 32 | Alolan Raticate | ✅ | Incoming from Alolan Rattata | None |
| 40 | Alolan Raichu | ✅ | Incoming from Pichu/Pikachu chain (use-item) | None |
| 44 | Alolan Sandshrew | ✅ | Outgoing → Alolan Sandslash (use-item) | None |
| 46 | Alolan Sandslash | ✅ | Incoming from Alolan Sandshrew | None |
| 57 | Alolan Vulpix | ✅ | Outgoing → Alolan Ninetales (use-item) | None |
| 59 | Alolan Ninetales | ✅ | Incoming from Alolan Vulpix | None |
| 72 | Alolan Diglett | ✅ | Outgoing → Alolan Dugtrio (level-up) | None |
| 74 | Alolan Dugtrio | ✅ | Incoming from Alolan Diglett | None |
| 76 | Alolan Meowth | ✅ | Outgoing → Alolan Persian (level-up) | None |
| 77 | Galarian Meowth | ✅ | Outgoing → Perrserker id=1094 (level-up) | None |
| 80 | Alolan Persian | ✅ | Incoming from Alolan Meowth | None |
| 86 | Hisuian Growlithe | ✅ | Outgoing → Hisuian Arcanine (use-item) | None |
| 88 | Hisuian Arcanine | ✅ | Incoming from Hisuian Growlithe | None |
| 107 | Alolan Geodude | ✅ | Outgoing → Alolan Graveler (level-up) | None |
| 109 | Alolan Graveler | ✅ | Incoming + outgoing → Alolan Golem (trade) | None |
| 111 | Alolan Golem | ✅ | Incoming from Alolan Graveler | None |
| 113 | Galarian Ponyta | ✅ | Outgoing → Galarian Rapidash (use-item) | None |
| 115 | Galarian Rapidash | ✅ | Incoming from Galarian Ponyta | None |
| 117 | Galarian Slowpoke | ✅ | Outgoing → Galarian Slowbro (use-item) AND Galarian Slowking (use-item) | None |
| 120 | Galarian Slowbro | ✅ | Incoming from Galarian Slowpoke | None |
| 124 | Galarian Farfetch'd | ✅ | Outgoing → Sirfetch'd id=1096 (other) | None |
| 130 | Alolan Grimer | ✅ | Outgoing → Alolan Muk (level-up) | None |
| 132 | Alolan Muk | ✅ | Incoming from Alolan Grimer | None |
| 147 | Hisuian Voltorb | ✅ | Outgoing → Hisuian Electrode (level-up) | None |
| 149 | Hisuian Electrode | ✅ | Incoming from Hisuian Voltorb | None |
| 152 | Alolan Exeggutor | ✅ | Incoming from Exeggcute (level-up) — shares base chain | None |
| 155 | Alolan Marowak | ✅ | Incoming from Cubone (level-up) — shares base chain | None |
| 161 | Galarian Weezing | ✅ | Incoming from Koffing (level-up) — shares base chain | None |
| 176 | Galarian Mr. Mime | ✅ | Incoming from Mime Jr. + outgoing → Mr. Rime id=1097 (level-up) | None |
| 184 | Paldean Tauros (Combat) | ⚪ | Single-stage — no evolution exists | None |
| 185 | Paldean Tauros (Blaze) | ⚪ | Single-stage — no evolution exists | None |
| 186 | Paldean Tauros (Aqua) | ⚪ | Single-stage — no evolution exists | None |
| 208 | Galarian Articuno | ⚪ | Single-stage legendary | None |
| 210 | Galarian Zapdos | ⚪ | Single-stage legendary | None |
| 212 | Galarian Moltres | ⚪ | Single-stage legendary | None |
| 228 | Hisuian Typhlosion | ✅ | Incoming from Quilava/Cyndaquil chain (level-up) | None |
| 268 | Paldean Wooper | ✅ | Outgoing → Clodsire id=1238 (level-up) | None |
| 274 | Galarian Slowking | ✅ | Incoming from Galarian Slowpoke (use-item) | None |
| 288 | Hisuian Qwilfish | ✅ | Outgoing → Overqwil id=1152 (other) | None |
| 295 | Hisuian Sneasel | ✅ | Outgoing → Sneasler id=1151 (level-up) | None |
| 303 | Galarian Corsola | ✅ | Outgoing → Cursola id=1095 (level-up) | None |
| 351 | Galarian Zigzagoon | ✅ | Outgoing → Galarian Linoone (level-up) | None |
| 353 | Galarian Linoone | ✅ | Incoming + outgoing → Obstagoon id=1093 (level-up) | None |
| 642 | Hisuian Samurott | ✅ | Incoming from Dewott/Oshawott chain (level-up) | None |
| 692 | Hisuian Lilligant | ✅ | Incoming from Petilil (use-item) | None |
| 700 | Galarian Darumaka | ✅ | Outgoing → Galarian Darmanitan id=703 (use-item) | None |
| 703 | Galarian Darmanitan | ✅ | Incoming from Galarian Darumaka | None |
| 704 | Galarian Darmanitan Zen | 🔴 | Battle form of Galarian Darmanitan — no evolution rows at all | Need: Galarian Darmanitan (id=703) → Zen (id=704), method='battle', condition='Zen Mode' |
| 713 | Galarian Yamask | ✅ | Outgoing → Runerigus id=1098 (other) | None |
| 723 | Hisuian Zorua | ✅ | Outgoing → Hisuian Zoroark (level-up) | None |
| 725 | Hisuian Zoroark | ✅ | Incoming from Hisuian Zorua | None |
| 775 | Galarian Stunfisk | ⚪ | Single-stage — no evolution exists | None |
| 787 | Hisuian Braviary | ✅ | Incoming from Rufflet (level-up) — shares base chain | None |
| 888 | Hisuian Sliggoo | ✅ | Incoming from Goomy + outgoing → Hisuian Goodra (level-up) | None |
| 890 | Hisuian Goodra | ✅ | Incoming from Hisuian Sliggoo | None |
| 904 | Hisuian Avalugg | ✅ | Incoming from Bergmite (level-up) — shares base chain | None |
| 921 | Hisuian Decidueye | ✅ | Incoming from Dartrix/Rowlet chain (level-up) | None |

**Summary:** 52 of 58 regional forms have correct evolution data. 5 are single-stage with no evolutions (correct). Only 1 genuinely needs a DB fix:

| DB id | Fix needed |
|---|---|
| 704 | Galarian Darmanitan Zen: `INSERT OR IGNORE INTO pokemon_evolutions (pokemon_id, evolves_to_id, method, condition_value) VALUES (703, 704, 'battle', 'Zen Mode')` |

### 4c. Alternate forms — need evolution rows (42 forms) ☐

Many of these were addressed in Task 2.3 but still appear in the audit. **SQL verify before treating as gaps.** Known patterns:

**Likely audit false positives (single-stage forms with no evolution):**
- Rotom appliance forms (Heat/Wash/Frost/Fan/Mow) — no evolution
- Oricorio forms — no evolution
- Aegislash Blade — no evolution (battle form)
- Dialga Origin, Palkia Origin — single-stage legendary
- Giratina Origin — single-stage legendary
- Enamorus Therian — single-stage
- Tornadus/Thundurus/Landorus Therian — single-stage

**Forms that do need evolution rows (if not already in DB):**

| DB id | Display name | Required row | Status |
|---|---|---|---|
| 527, 528 | Burmy Sandy/Trash | Burmy (default) → Wormadam (sandy/trash), method='level-up', condition='20' | ☐ |
| 530, 531 | Wormadam Sandy/Trash | Covered by Burmy rows above | ☐ |
| 694 | Basculin Blue-Striped | No evolution (Blue-Striped does not evolve into Basculegion) — audit false positive | ☐ investigate |
| 702 | Darmanitan Zen | Battle form of default Darmanitan — no separate evolution row needed | ☐ investigate |
| 809, 810 | Kyurem Black/White | Kyurem (default) → Black/White, method='other', condition='DNA Splicers' | ☐ |
| 827, 828 | Greninja Bond/Ash | Froakie chain already exists; battle forms — audit false positive | ☐ investigate |
| 843 | Floette Eternal | AZ's Floette — single-stage, no evolution | ☐ investigate |
| 895-901 | Pumpkaboo sizes / Gourgeist sizes | Size variants: Small/Large/Super evolve from same-size Pumpkaboo; already covered or need rows | ☐ |
| 1131 | Eternamax Eternatus | Battle form — no evolution row needed | ☐ investigate |
| 1143, 1144 | Calyrex Ice/Shadow Rider | Calyrex + Glastrier/Spectrier fusion — method='other', condition='Reins of Unity' | ☐ |
| 1148 | Bloodmoon Ursaluna | Ursaring → Ursaluna (via item), then Ursaluna → Bloodmoon in LA — needs row | ☐ |
| 1154 | Enamorus Therian | Single-stage — audit false positive | ☐ investigate |
| 1232, 1233 | Tatsugiri Droopy/Stretchy | Single-stage — audit false positive | ☐ investigate |
| 1259 | Gimmighoul Roaming | Roaming → Gholdengo same as Chest form — needs row pointing to Gholdengo | ☐ |
| 1292, 1293 | Terapagos Terastal/Stellar | Battle form transformations — may or may not need rows | ☐ investigate |

---

## 5. Sprites

### 5a. Blocked — no source found

| Form | DB id | Issue |
|---|---|---|
| Burmy Sandy | 527 | No PokeAPI home sprites for Sandy/Trash forms exist. Currently shows Burmy Plant sprite as fallback. |
| Burmy Trash | 528 | Same. |

**Action needed:** Find an alternative sprite source (e.g. Bulbapedia, Smogon, or community-maintained sprite repos). Once a URL pattern is identified, update `useFormVariants.ts` FORM_POKEAPI_IDS / FORM_SLUG_OVERRIDES maps.

---

## 6. Audit Script Fixes Needed

These are script issues, not data gaps. Fix these so future audit runs give clean numbers.

| Issue | Count | Fix |
|---|---|---|
| Single-stage Pokémon flagged for missing evolution_chain | 151 | Add `knownNoEvolution` set to audit script using same pattern as `knownNoEncounterDex` (Task 1.1). Populate by querying DB for Pokémon with no `pokemon_evolutions` rows — these are legitimately single-stage. |
| Mega/Gigantamax flagged for moves/pokédex/encounters | 97+34+34 = 165 | Audit script should recognize that UI handles these via base-form fallback and not flag them as gaps. |

---

## Implementation Priority

Suggested order when work resumes:

1. **Audit script false positive fix** (Task 6) — Low effort, makes all future audit runs meaningful. Brief to node-specialist.
2. **Verify moves/evolution DB state** (Task 3b, 4c investigations) — SQL checks only, no code. Confirm what's actually missing before writing data.
3. **Regional encounter PokeAPI probe** (Task 2c) — Quick targeted fetch; most Hisuian/Paldean forms will return empty and need no manual work.
4. **Evolution chain DB patches for true gaps** (Task 4c confirmed gaps) — Hardcoded SQL via patchBundledDb.js.
5. **Pokédex entries — manual sourcing** (Tasks 1b) — 140 forms, Bulbapedia source. Largest effort; consider data researcher agent for systematic scrape.

---

## Open Questions

1. **Alternate form Pokédex priority:** Source all 76, or prioritize story-relevant forms first (Primals, Calyrex riders, Kyurem fusions, Deoxys, Eternamax)?
2. **Z-A mega moves:** Accept "no data" until PokeAPI updates, or attempt to source from game data leak/community wikis?

---

## 7. Legends Z-A Game Version — Manual Addition & Reconciliation Notes

**Date added:** 2026-07-21  
**Decision:** `legends-za` added as a valid `game_version` slug in our `pokemon_flavor_text` table and in the UI generation map, ahead of PokeAPI support.

### What was done

1. **`FlavorTextSection.tsx`** — Added `'legends-za': 'Generation IX'` to `GAME_GENERATION_MAP`. The `formatGameVersion()` function handles display automatically (slug → "Legends Za" title-case). No other UI changes needed.

2. **`pokemon_flavor_text` table** — The `game_version` column is a free-text slug with no FK constraint, so `'legends-za'` rows are valid immediately. First rows seeded: Alolan Marowak entry (`pokemon_id=155`), sourced from Bulbapedia.

3. **No `game_versions` lookup table** — The app does not maintain a separate `game_versions` table with integer ids. Version slugs are stored directly in `pokemon_flavor_text.game_version` as text. There is nothing to migrate or backfill.

### What PokeAPI will eventually provide

When PokeAPI adds Legends Z-A support, it will provide:
- A `/version/legends-za/` endpoint (or similar slug — may differ from ours)
- Flavor text entries via `/pokemon-species/{id}/` in the `flavor_text_entries` array, with `version.name` matching their slug

**Reconciliation steps when PokeAPI updates:**

1. **Verify our slug matches PokeAPI's slug.** Check `https://pokeapi.co/api/v2/version/?limit=100` for the new version entry. If their slug differs from `'legends-za'` (e.g. they use `'legends-z-a'`), update all existing rows:
   ```sql
   UPDATE pokemon_flavor_text SET game_version = 'legends-z-a' WHERE game_version = 'legends-za';
   ```
   And update `GAME_GENERATION_MAP` in `FlavorTextSection.tsx` to match.

2. **Check for duplicate or conflicting entries.** Our manually-seeded rows used `INSERT OR IGNORE`, so if PokeAPI provides the same entry with the same `pokemon_id` + `game_version`, the existing row is kept. If the text differs (PokeAPI sometimes uses slightly different translations), you must decide whether to update. Run:
   ```sql
   SELECT pokemon_id, game_version, flavor_text FROM pokemon_flavor_text WHERE game_version = 'legends-za' ORDER BY pokemon_id;
   ```
   Compare against the PokeAPI response for each pokemon_id.

3. **Seed remaining forms automatically.** Once PokeAPI has the data, the existing `enrichDatabaseAsync` enrichment pipeline can be extended to fetch Z-A flavor text for all forms. Clear the relevant `sync_metadata` gate to trigger a re-run. Do NOT re-seed rows that already exist (`INSERT OR IGNORE` is safe).

4. **Update `GAME_VERSION_ORDER`** in `EncounterLocationsSection.tsx` and `MovesetSection.tsx` if those sections also gain Z-A data.

### Pokémon currently with manually-seeded Legends Z-A entries

| pokemon_id | display_name | game_version | Source |
|---|---|---|---|
| 155 | Alolan Marowak | legends-za | Bulbapedia (2026-07-21) |
| 490 | Primal Kyogre | legends-za | Manually sourced |
| 492 | Primal Groudon | legends-za | Manually sourced |
| 853 | Meowstic Female | legends-za | Manually sourced |
| 1111 | Indeedee Female | legends-za | Manually sourced |

This table should be updated as more Z-A entries are added during the regional Pokédex entry sourcing passes.

---

## 8. Bug Fixes Completed (DB v1.28.0)

### Encounter location duplicates removed
- `pokemon_encounter_locations` had 3,852 duplicate rows (no UNIQUE constraint — INSERT OR IGNORE was ineffective against AUTOINCREMENT PK).
- Deduplicated via targeted DELETE keeping MIN(id) per logical row.
- Table rebuilt with `UNIQUE(pokemon_id, game_version, location_name, location_area_slug, encounter_method, encounter_chance, min_level, max_level)` constraint. Future patch script runs are now safe.

### Generation filter mapping fixed
- 11 game version slugs were missing from `GAME_GENERATION_MAP` in `EncounterLocationsSection.tsx`:
  - Crown Tundra DLC (`the-crown-tundra-sword/shield`) → now correctly mapped to Generation VIII
  - Isle of Armor DLC (`the-isle-of-armor-sword/shield`) → Generation VIII
  - Teal Mask DLC (`the-teal-mask-scarlet/violet`) → Generation IX
  - Indigo Disk DLC (`the-indigo-disk-scarlet/violet`) → Generation IX
  - Japan originals (`red-japan`, `blue-japan`, `green-japan`) → Generation I
  - Previously all appeared under "Other" filter header.

### Evolution condition_values filled
- 26 evolution rows with NULL or blank condition_value updated:
  - Location-based level-ups: Magneton→Magnezone, Nosepass→Probopass, Charjabug→Vikavolt, Crabrawler→Crabominable — set to "Magnetic Field" / "Mount Lanakila"
  - Item/condition level-ups: Eevee→Leafeon (use-item leaf-stone), Eevee→Glaceon (use-item ice-stone), Eevee→Sylveon (Fairy Move + Affection), Feebas→Milotic (Prism Scale / Beauty), Mantyke→Mantine (With Remoraid)
  - 1,000 Steps: Pawmo→Pawmot, Bramblin→Brambleghast, Rellor→Rabsca
  - Hisuian Sneasel→Sneasler: Lv. 20 (Day)
  - method corrections: Primeape→Annihilape (use-move rage-fist), Farfetch'd/Galarian→Sirfetch'd (three-critical-hits), Qwilfish/Hisuian→Overqwil (use-move barb-barrage), Stantler→Wyrdeer (use-move psyshield-bash), Yamask/Galarian→Runerigus (take-damage), Bisharp→Kingambit (three-defeated-bisharp), Milcery→Alcremie (spin), Gimmighoul→Gholdengo (gimmighoul-coins), Basculin→Basculegion both rows (recoil-damage)
