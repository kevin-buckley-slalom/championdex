# Phase 5 — Remaining Data Gaps Spec

**Created:** 2026-07-21  
**DB version at analysis:** v1.26.0  
**Last audit:** 2026-07-22 — DB v1.33.0 — `scripts/output/pokemon_data_audit.json`  
**Status:** All Phase 5 gaps resolved — DB v1.33.0 device-verified ✅

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
| 58 | Hisuian Growlithe | 86 | ✅ |
| 59 | Hisuian Arcanine | 88 | ✅ |
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

### 2b. Gen 9 default forms — manually source from Bulbapedia ✅ COMPLETE

PokeAPI returns empty arrays for all Gen 9 Pokémon. Manual sourcing required from Bulbapedia, same pattern as `scripts/output/regional_encounter_data.json`. Data goes into `scripts/patchBundledDb.js`.

**Source pattern:** `https://bulbapedia.bulbagarden.net/wiki/{Name}_(Pokémon)` → "Game locations" table → Scarlet/Violet rows.

**Insert pattern:** `INSERT OR IGNORE INTO pokemon_encounter_locations (pokemon_id, game_version, location_name, location_area_slug, encounter_method, encounter_chance, min_level, max_level)`  
`encounter_chance` is nullable. `location_area_slug` is a kebab-case slug derived from location name.

#### No encounter data needed — truly unobtainable in the wild (12 forms)

Only starters and their evolutions, plus pure-evolution forms with no catchable instance, are excluded. Everything else — raids, single fixed encounters, legendaries, paradox, event Tera Raids — all have encounter data and are included in the actionable list.

| DB id | Display name | Dex | Reason |
|---|---|---|---|
| 1155 | Sprigatito | 906 | Starter — gift only, no wild form |
| 1156 | Floragato | 907 | Starter evolution only |
| 1157 | Meowscarada | 908 | Starter evolution only |
| 1158 | Fuecoco | 909 | Starter — gift only, no wild form |
| 1159 | Crocalor | 910 | Starter evolution only |
| 1160 | Skeledirge | 911 | Starter evolution only |
| 1161 | Quaxly | 912 | Starter — gift only, no wild form |
| 1162 | Quaxwell | 913 | Starter evolution only |
| 1163 | Quaquaval | 914 | Starter evolution only |
| 1260 | Gholdengo | 1000 | Evolution only — Gimmighoul has encounters |
| 1285 | Archaludon | 1018 | Evolution only — evolve Duraludon with Metal Alloy |
| 1286 | Hydrapple | 1019 | Evolution only — Dipplin has encounters |

#### Need encounter data — source from Bulbapedia (100 forms) ✅ Complete — DB v1.33.0

Raids, fixed encounters, legendaries, paradox, and event Tera Raids all count. Source: `https://bulbapedia.bulbagarden.net/wiki/{Name}_(Pokémon)` → "Game locations" table.

| DB id | Display name | Dex | Game | Status |
|---|---|---|---|---|
| 1164 | Lechonk | 915 | SV | ✅ |
| 1165 | Oinkologne | 916 | SV | ✅ |
| 1167 | Tarountula | 917 | SV | ✅ |
| 1168 | Spidops | 918 | SV | ✅ |
| 1169 | Nymble | 919 | SV | ✅ |
| 1170 | Lokix | 920 | SV | ✅ |
| 1171 | Pawmi | 921 | SV | ✅ |
| 1172 | Pawmo | 922 | SV | ✅ |
| 1173 | Pawmot | 923 | SV | ✅ |
| 1174 | Tandemaus | 924 | SV | ✅ |
| 1175 | Maushold | 925 | SV | ✅ |
| 1176 | Fidough | 926 | SV | ✅ |
| 1177 | Dachsbun | 927 | SV | ✅ |
| 1178 | Smoliv | 928 | SV | ✅ |
| 1179 | Dolliv | 929 | SV | ✅ |
| 1180 | Arboliva | 930 | SV | ✅ |
| 1181 | Squawkabilly | 931 | SV | ✅ |
| 1182 | Nacli | 932 | SV | ✅ |
| 1183 | Naclstack | 933 | SV | ✅ |
| 1184 | Garganacl | 934 | SV | ✅ |
| 1185 | Charcadet | 935 | SV | ✅ |
| 1186 | Armarouge | 936 | Scarlet | ✅ |
| 1187 | Ceruledge | 937 | Violet | ✅ |
| 1188 | Tadbulb | 938 | SV | ✅ |
| 1189 | Bellibolt | 939 | SV | ✅ |
| 1190 | Wattrel | 940 | SV | ✅ |
| 1191 | Kilowattrel | 941 | SV | ✅ |
| 1192 | Maschiff | 942 | SV | ✅ |
| 1193 | Mabosstiff | 943 | SV | ✅ |
| 1194 | Shroodle | 944 | SV | ✅ |
| 1195 | Grafaiai | 945 | SV | ✅ |
| 1196 | Bramblin | 946 | SV | ✅ |
| 1197 | Brambleghast | 947 | SV | ✅ |
| 1198 | Toedscool | 948 | SV | ✅ |
| 1199 | Toedscruel | 949 | SV | ✅ |
| 1200 | Klawf | 950 | SV | ✅ |
| 1201 | Capsakid | 951 | SV | ✅ |
| 1202 | Scovillain | 952 | SV | ✅ |
| 1204 | Rellor | 953 | SV | ✅ |
| 1205 | Rabsca | 954 | SV | ✅ |
| 1206 | Flittle | 955 | SV | ✅ |
| 1207 | Espathra | 956 | SV | ✅ |
| 1208 | Tinkatink | 957 | SV | ✅ |
| 1209 | Tinkatuff | 958 | SV | ✅ |
| 1210 | Tinkaton | 959 | SV | ✅ |
| 1211 | Wiglett | 960 | SV | ✅ |
| 1212 | Wugtrio | 961 | SV | ✅ |
| 1213 | Bombirdier | 962 | SV | ✅ |
| 1214 | Finizen | 963 | SV | ✅ |
| 1215 | Palafin | 964 | SV | ✅ |
| 1217 | Varoom | 965 | SV | ✅ |
| 1218 | Revavroom | 966 | SV | ✅ |
| 1219 | Cyclizar | 967 | SV | ✅ |
| 1220 | Orthworm | 968 | SV | ✅ |
| 1221 | Glimmet | 969 | SV | ✅ |
| 1222 | Glimmora | 970 | SV | ✅ |
| 1224 | Greavard | 971 | SV | ✅ |
| 1225 | Houndstone | 972 | SV | ✅ |
| 1226 | Flamigo | 973 | SV | ✅ |
| 1227 | Cetoddle | 974 | SV | ✅ |
| 1228 | Cetitan | 975 | SV | ✅ |
| 1229 | Veluza | 976 | SV | ✅ |
| 1230 | Dondozo | 977 | SV | ✅ |
| 1231 | Tatsugiri | 978 | SV | ✅ |
| 1237 | Annihilape | 979 | SV | ✅ |
| 1238 | Clodsire | 980 | SV | ✅ |
| 1239 | Farigiraf | 981 | SV | ✅ |
| 1240 | Dudunsparce | 982 | SV | ✅ |
| 1241 | Kingambit | 983 | SV | ✅ |
| 1242 | Great Tusk | 984 | Scarlet | ✅ |
| 1243 | Scream Tail | 985 | Scarlet | ✅ |
| 1244 | Brute Bonnet | 986 | Scarlet | ✅ |
| 1245 | Flutter Mane | 987 | Scarlet | ✅ |
| 1246 | Slither Wing | 988 | Scarlet | ✅ |
| 1247 | Sandy Shocks | 989 | Scarlet | ✅ |
| 1248 | Iron Treads | 990 | Violet | ✅ |
| 1249 | Iron Bundle | 991 | Violet | ✅ |
| 1250 | Iron Hands | 992 | Violet | ✅ |
| 1251 | Iron Jugulis | 993 | Violet | ✅ |
| 1252 | Iron Moth | 994 | Violet | ✅ |
| 1253 | Iron Thorns | 995 | Violet | ✅ |
| 1254 | Frigibax | 996 | SV | ✅ |
| 1255 | Arctibax | 997 | SV | ✅ |
| 1256 | Baxcalibur | 998 | SV | ✅ |
| 1258 | Gimmighoul | 999 | SV | ✅ |
| 1261 | Wo-Chien | 1001 | SV | ✅ |
| 1262 | Chien-Pao | 1002 | SV | ✅ |
| 1263 | Ting-Lu | 1003 | SV | ✅ |
| 1264 | Chi-Yu | 1004 | SV | ✅ |
| 1265 | Roaring Moon | 1005 | Scarlet | ✅ |
| 1266 | Iron Valiant | 1006 | Violet | ✅ |
| 1267 | Koraidon | 1007 | Scarlet | ✅ |
| 1268 | Miraidon | 1008 | Violet | ✅ |
| 1269 | Walking Wake | 1009 | SV | ✅ |
| 1270 | Iron Leaves | 1010 | SV | ✅ |
| 1271 | Dipplin | 1011 | SV (Teal Mask) | ✅ |
| 1272 | Poltchageist | 1012 | SV (Teal Mask) | ✅ |
| 1273 | Sinistcha | 1013 | SV (Teal Mask) | ✅ |
| 1274 | Okidogi | 1014 | SV (Teal Mask) | ✅ |
| 1275 | Munkidori | 1015 | SV (Teal Mask) | ✅ |
| 1276 | Fezandipiti | 1016 | SV (Teal Mask) | ✅ |
| 1277 | Ogerpon | 1017 | SV (Teal Mask) | ✅ |
| 1287 | Gouging Fire | 1020 | SV (Indigo Disk) | ✅ |
| 1288 | Raging Bolt | 1021 | SV (Indigo Disk) | ✅ |
| 1289 | Iron Boulder | 1022 | SV (Indigo Disk) | ✅ |
| 1290 | Iron Crown | 1023 | SV (Indigo Disk) | ✅ |
| 1291 | Terapagos | 1024 | SV (Indigo Disk) | ✅ |
| 1294 | Pecharunt | 1025 | SV | ✅ |

**Total actionable: 100 forms — all ✅ complete**

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
| Z-A Mega forms with 0 moves in PokeAPI | 23 | See §3d below for full list. PokeAPI still at 0; UI falls back to base form moves (acceptable). |

### 3d. Champions moveset audit — Z-A mega base forms (2026-07-22)

**Context:** Pokémon Champions introduces a `champions` version group in PokeAPI. All Champions moveset data in our DB was sourced from PokeAPI during `generateBundledDb.js` — we have never manually sourced Champions data. The `learn_method` for Champions moves is `train` (not `machine`).

**How to query our DB for Champions coverage:**
```sql
SELECT p.display_name, COUNT(pm.move_id) as champions_moves
FROM pokemon p
LEFT JOIN pokemon_moves pm ON pm.pokemon_id = p.id AND pm.version_group = 'champions'
WHERE p.id IN (<list of base form ids>)
GROUP BY p.id
ORDER BY champions_moves ASC;
```

**How to check PokeAPI for Champions data:**
```bash
curl -s "https://pokeapi.co/api/v2/pokemon/{pokeapi_id}/" | node -e "
const d = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
const c = d.moves.filter(m => m.version_group_details.some(vg => vg.version_group.name === 'champions')).length;
console.log(d.name, 'champions moves:', c);"
```

**Audit scope (2026-07-22):** Checked all 44 unique base forms of the 49 Z-A megas (pokeapi_id ≥ 10278).

**Result — 26 base forms have Champions data in our DB (already complete):**
Clefable, Victreebel, Starmie, Dragonite, Meganium, Feraligatr, Skarmory, Froslass, Emboar, Excadrill, Chandelure, Chesnaught, Delphox, Greninja, Hawlucha, Drampa, Chimecho, Absol, Garchomp, Lucario, Golurk, Meowstic, Crabominable, Scovillain, Glimmora, Raichu

**Result — 18 base forms have 0 Champions moves in PokeAPI (blocked):**

| Base form | PokeAPI ID | Notes |
|---|---|---|
| Staraptor | 398 | Not in Champions |
| Heatran | 485 | Not in Champions |
| Darkrai | 491 | Not in Champions |
| Scolipede | 545 | Not in Champions |
| Scrafty | 560 | Not in Champions |
| Eelektross | 604 | Not in Champions |
| Pyroar | 668 | Not in Champions |
| Floette | 670 | Not in Champions |
| Malamar | 687 | Not in Champions |
| Barbaracle | 689 | Not in Champions |
| Dragalge | 691 | Not in Champions |
| Zygarde | 718 | Not in Champions |
| Golisopod | 768 | Not in Champions |
| Magearna | 801 | Not in Champions |
| Zeraora | 807 | Not in Champions |
| Falinks | 870 | Not in Champions |
| Tatsugiri | 978 | Not in Champions |
| Baxcalibur | 998 | Not in Champions |

These 18 Pokémon are either not featured in Champions mode or PokeAPI hasn't added their data yet. The corresponding megas show no Champions moveset tab in the app, which is correct — there is no data to show.

**Re-check trigger:** If PokeAPI adds Champions data for any of these, run `generateBundledDb.js` (or a targeted moves backfill) and bump `DATA_VERSION`.

### 3e. Future: full-roster Champions audit

A Champions coverage audit should eventually be run across **all 1,000+ default-form Pokémon** (not just Z-A mega base forms) to identify any that are in Champions mode but missing `version_group = 'champions'` rows in our DB. This would surface gaps introduced if PokeAPI has added Champions data since the DB was last generated.

**Query to find all Pokémon with 0 Champions moves (for triage):**
```sql
SELECT p.id, p.display_name, p.national_dex, p.pokeapi_id
FROM pokemon p
WHERE p.form_type = 'default'
  AND NOT EXISTS (
    SELECT 1 FROM pokemon_moves pm
    WHERE pm.pokemon_id = p.id AND pm.version_group = 'champions'
  )
ORDER BY p.national_dex;
```
Then probe PokeAPI for each result using the curl snippet in §3d. Any that return >0 champions moves are candidates for a targeted backfill.

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

### 4c. Alternate forms — need evolution rows ☐ PARTIALLY INVESTIGATED

Full SQL audit run 2026-07-22 against DB v1.30.0. 48 alternate forms have no evolution rows. Of these:

**False positives — no rows needed:**
- Basculin Blue-Striped — single-stage, does not evolve into Basculegion
- Floette Eternal — AZ's Floette, unobtainable; no evolution exists
- Tatsugiri Droopy/Stretchy — single-stage, Tatsugiri does not evolve
- Bloodmoon Ursaluna (id=1148) — standalone alternate form, does NOT evolve; regular Ursaluna (id=1147) evolves via peat-block from Ursaring (already in DB as id 297→1147)

**Additional form transformations needed in `FORM_TRANSFORMATIONS` block:**

Deoxys — all 4 forms fully interconnected (12 rows, each form → every other form), `use-item`, `Meteorite`:
- 496 Normal ↔ 497 Attack, 498 Defense, 499 Speed (3 outgoing each × 4 forms = 12 rows)

Rotom — base only → each appliance form (5 rows, one-directional), `use-item`, `Rotom Catalog`:
- 605 Rotom → 606 Heat, 607 Wash, 608 Frost, 609 Fan, 610 Mow

Dialga/Palkia/Giratina — base → Origin only (3 rows), `use-item`:
- 614 Dialga → 615 Dialga Origin: `Adamant Crystal`
- 616 Palkia → 617 Palkia Origin: `Lustrous Globe`
- 621 Giratina → 622 Giratina Origin: `Griseous Orb`

**Form transformations shown in evolution chain (via `FORM_TRANSFORMATIONS` block in patchBundledDb.js):**
These have incoming evolution rows and are shown directly in the chain UI (predecessor → this form only, not full base tree).
- Shaymin Land (628) → Shaymin Sky (629): `use-item`, `Gracidea`
- Tornadus Incarnate (800) → Therian (801): `use-item`, `Reveal Glass`
- Thundurus Incarnate (802) → Therian (803): `use-item`, `Reveal Glass`
- Landorus Incarnate (806) → Therian (807): `use-item`, `Reveal Glass`
- Enamorus Incarnate (1153) → Therian (1154): `use-item`, `Reveal Glass`
- Keldeo (811) → Resolute (812): `know-move`, `Secret Sword`
- Meloetta Aria (813) → Pirouette (814): `battle`, `Relic Song`
- Greninja Bond (827) → Ash-Greninja (828): `battle`, `Battle Bond KO`
- Aegislash Shield (858) → Blade (859): `battle`, `Attacking`
- Aegislash Blade (859) → Shield (858): `battle`, `King's Shield`
- Hoopa Confined (915) → Unbound (916): `use-item`, `Prison Bottle`
- Oricorio Baile (939) → Pom-Pom (940): `use-item`, `Yellow Nectar`
- Oricorio Baile (939) → Pa'u (941): `use-item`, `Pink Nectar`
- Oricorio Baile (939) → Sensu (942): `use-item`, `Purple Nectar`
- Oricorio Pom-Pom (940) → Baile (939): `use-item`, `Red Nectar`
- Oricorio Pom-Pom (940) → Pa'u (941): `use-item`, `Pink Nectar`
- Oricorio Pom-Pom (940) → Sensu (942): `use-item`, `Purple Nectar`
- Oricorio Pa'u (941) → Baile (939): `use-item`, `Red Nectar`
- Oricorio Pa'u (941) → Pom-Pom (940): `use-item`, `Yellow Nectar`
- Oricorio Pa'u (941) → Sensu (942): `use-item`, `Purple Nectar`
- Oricorio Sensu (942) → Baile (939): `use-item`, `Red Nectar`
- Oricorio Sensu (942) → Pom-Pom (940): `use-item`, `Yellow Nectar`
- Oricorio Sensu (942) → Pa'u (941): `use-item`, `Pink Nectar`
- Terapagos Normal (1291) → Terastal (1292): `battle`, null
- Terapagos Terastal (1292) → Stellar (1293): `battle`, `Terastallize`
- Eternatus (1130) → Eternamax Eternatus (1131): `gigantamax`, `gigantamax-factor`

**Rows needed in `ALTERNATE_EVOLUTIONS` block — awaiting patch:**

Already in DB (exist from base-form seeding, no action needed):
- 526 (Burmy Plant) → 529 (Wormadam Plant): `level-up`, `20` ✅
- 526 (Burmy Plant) → 532 (Mothim): `level-up`, `20` ✅
- 894 (Pumpkaboo Medium) → 898 (Gourgeist Medium): `trade`, null ✅
- 1258 (Gimmighoul Chest) → 1260 (Gholdengo): `gimmighoul-coins`, null ✅

Missing rows (12 rows across 6 species):

| pokemon_id | evolves_to_id | method | condition_value | Notes |
|---|---|---|---|---|
| 527 | 530 | `level-up` | `20` | Burmy Sandy → Wormadam Sandy (cloak-matched) |
| 527 | 532 | `level-up` | `20` | Burmy Sandy → Mothim (if male) |
| 528 | 531 | `level-up` | `20` | Burmy Trash → Wormadam Trash (cloak-matched) |
| 528 | 532 | `level-up` | `20` | Burmy Trash → Mothim (if male) |
| 808 | 809 | `other` | `DNA Splicers` | Kyurem → Black Kyurem |
| 808 | 810 | `other` | `DNA Splicers` | Kyurem → White Kyurem |
| 895 | 899 | `trade` | null | Pumpkaboo Small → Gourgeist Small (size-matched) |
| 896 | 900 | `trade` | null | Pumpkaboo Large → Gourgeist Large (size-matched) |
| 897 | 901 | `trade` | null | Pumpkaboo Super → Gourgeist Super (size-matched) |
| 1142 | 1143 | `other` | `Reins of Unity` | Calyrex → Ice Rider |
| 1142 | 1144 | `other` | `Reins of Unity` | Calyrex → Shadow Rider |
| 1259 | 1260 | `gimmighoul-coins` | null | Gimmighoul Roaming → Gholdengo |

All inserts use `INSERT OR IGNORE`. These go in the `ALTERNATE_EVOLUTIONS` array in `patchBundledDb.js`. The `FORM_TRANSFORMATIONS` rows are handled in a separate block in the same function.

---

## 5. Sprites

### 5a. ✅ Resolved — Burmy Sandy / Burmy Trash

| Form | DB id | Resolution |
|---|---|---|
| Burmy Sandy | 527 | Local assets: `assets/images/sprites/burmy-sandy.webp` (normal) + `burmy-sandy-shiny.webp` (shiny). Sourced from pokepc.net. |
| Burmy Trash | 528 | Local assets: `assets/images/sprites/burmy-trash.webp` (normal) + `burmy-trash-shiny.webp` (shiny). Sourced from pokepc.net. |

Overrides wired in:
- `artworkPrefetchService.ts` — `LOCAL_ARTWORK_OVERRIDES` + `LOCAL_SHINY_OVERRIDES` maps (keyed by DB id); `getHomeRenderUrl` / `getShinyHomeRenderUrl` return local assets for ids 527/528
- `EvolutionChain.tsx` — node images go through `getHomeRenderUrl`
- `useRelatedForms.ts` — `SPRITE_URL_OVERRIDES` map points to `412-sandy.png` / `412-trash.png` (PokeAPI pixel art, consistent with other related forms)
- `PokemonHero.tsx`, `PokemonCard.tsx`, `[id].tsx` — all artwork/shiny paths go through the service functions; `toImageSource` helper handles `string | number` source prop

---

## 6. Audit Script Fixes Needed

These are script issues, not data gaps. Fix these so future audit runs give clean numbers.

| Issue | Count | Fix | Status |
|---|---|---|---|
| Single-stage Pokémon flagged for missing evolution_chain | 151 | Added `knownNoEvolution` set — queries DB for Pokémon with no `pokemon_evolutions` rows | ✅ Fixed 2026-07-22 |
| Evolution-only regional forms flagged for missing encounter_locations | 5 | Added `knownNoEncounterRegional` set — queries DB for regional forms with no encounter rows | ✅ Fixed 2026-07-22 |
| Mega/Gigantamax flagged for moves/pokédex/encounters | 97+34+34 = 165 | Handled by `generateReason()` explanatory text — these are expected gaps; UI falls back to base form | ✅ Accepted as-is |

**Current audit output (DB v1.30.0, 2026-07-22):**
- `moves`: 131 forms (mega/gmax/alternate — expected, UI fallback handles)
- `pokedex_entries`: 131 forms (same)
- `encounter_locations`: 343 forms (mega/gmax/alternate/Gen9 — expected)
- `evolution_chain`: 0 ✅
- `regional` forms with issues: 0 ✅

---

## Implementation Priority

Work completed 2026-07-22:
- ✅ Regional encounter locations patched (29 rows, 21 forms, Bulbapedia-sourced) — DB v1.29.0
- ✅ Darmanitan Zen evolution rows (both standard and Galarian) — DB v1.30.0
- ✅ Audit script false positives eliminated (evolution_chain: 0, regional encounters: 0)
- ✅ `encounter_chance` column made nullable (schema + DB migration)
- ✅ Regional forms now query their own encounter data (EncounterLocationsSection fix)

Remaining work (priority order for next session):

1. **Alternate form evolution rows** (Task 4c) ✅ — all 12 rows confirmed in DB v1.32.0.
2. **Gen 9 default encounter locations** — manually source Scarlet/Violet wild encounter data for Gen 9 default-form Pokémon from Bulbapedia. Same approach as regional encounter sourcing. Data researcher agent + patchBundledDb.js insert.
3. **Burmy Sandy/Trash sprites** ✅ — local assets, device-verified 2026-07-22.
4. **Z-A mega move data** (~5 forms) — blocked until PokeAPI updates. No action.

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

---

## 6. Pre-Production Data Review

**Audit run:** 2026-07-22 | DB v1.33.0 | `node scripts/auditPokemonData.js`  
**Result:** 235 forms flagged, 1059 forms clean — **all 235 are expected and accounted for** (see analysis below).

### 6a. Audit summary

| Form type | Flagged | Total | Issue types |
|---|---|---|---|
| default | 24 | 1025 | encounter_locations only |
| alternate | 76 | 76 | encounter_locations only |
| cosmetic | 4 | 4 | encounter_locations only |
| mega | 97 | 97 | moves, pokedex_entries, encounter_locations |
| gigantamax | 34 | 34 | moves, pokedex_entries, encounter_locations |
| regional | 0 | 58 | — |

### 6b. Why each group is acceptable

**Mega (97) and Gigantamax (34) — moves / dex entries / encounters missing**

By design. The UI serves all three fields from the base form when no override exists. PokeAPI does not provide separate move pools, flavor text, or encounter locations for mega/GMax forms. The Z-A mega backfill (`za_forms_enrichment_v1`) populated Champions-mode moves for megas that have them; the rest inherit from base. No data action needed.

**Alternate forms (76) — encounter_locations missing**

All 76 alternate forms share their encounter locations with the base form in the UI (the `EncounterLocationsSection` queries the base `pokemon_id` for alternates). The audit flags absence of dedicated rows, but none are needed. Forms include: Ogerpon masks, Tatsugiri shapes, Palafin Hero, Gimmighoul Roaming, Terapagos Terastal/Stellar, and all in-battle-only transformations.

**Cosmetic forms (4) — encounter_locations missing**

Same pattern as alternates — encounter UI falls back to base form. The 4 cosmetic forms are the female-variant forms (Oinkologne Female, etc.) which are encountered identically to the base form.

**Default forms (24) — encounter_locations missing**

These are the only default-form flags and all are legitimate no-encounter Pokémon:

| DB id | Name | Reason |
|---|---|---|
| 1155–1163 | Sprigatito, Floragato, Meowscarada, Fuecoco, Crocalor, Skeledirge, Quaxly, Quaxwell, Quaquaval | Gen 9 starters — gift only, no wild encounters |
| 1260 | Gholdengo | Evolution only (999 Gimmighoul Coins) |
| 1285 | Archaludon | Evolution only (Duraludon + Metal Alloy) |
| 1286 | Hydrapple | Evolution only (Dipplin has encounters) |
| 624 | Phione | Event/mythical — never obtainable in the wild |
| 811 | Keldeo | Event/mythical |
| 813 | Meloetta | Event/mythical |
| 815 | Genesect | Event/mythical |
| 913 | Diancie | Event/mythical |
| 915 | Hoopa | Event/mythical |
| 917 | Volcanion | Event/mythical |
| 1015 | Marshadow | Event/mythical |
| 1020 | Zeraora | Event/mythical |
| 1022 | Meltan | Event/mythical (GO-only transfer) |
| 1023 | Melmetal | Event/mythical |
| 1137 | Zarude | Event/mythical |

All 12 event/mythical Pokémon are distribution-only and have never had wild encounter locations. The empty-state UI correctly shows "Not available in the wild" for these.

### 6c. Open items before production

The following are **not blockers** but should be re-evaluated before a production release:

1. **Z-A mega move data (§3d)** — 18 of 44 Z-A mega base forms have 0 Champions-mode moves in PokeAPI (PokeAPI has not yet populated Legends: Z-A data). UI falls back to base form moves, which is correct behavior. Re-check when PokeAPI adds Z-A Champions data; run the audit query in §3d to identify new rows and trigger a targeted backfill.

2. **Full-roster Champions audit (§3e)** — Only Z-A mega base forms have been audited for Champions coverage. A full sweep across all ~1,000 default-form Pokémon has not been done. If any non-Z-A Pokémon are in Champions mode (possible for returning Pokémon), they may be missing `version_group = 'champions'` rows. Run the query in §3e before release.

3. **Event/mythical encounter empty states** — Confirm the UI empty-state copy ("Not available in the wild" or equivalent) is appropriate for the 12 event/mythical Pokémon that have no encounter rows. These were never treated as data gaps — they were always no-encounter by design — but the user-facing message should be reviewed.

4. **Audit script evolution false positives (§4a)** — The audit script still flags ~151 single-stage Pokémon as missing evolution data. This inflates the "forms with issues" number in any future audit run. Low priority (the data is correct), but fixing the audit script before production will make future audit runs cleaner.
