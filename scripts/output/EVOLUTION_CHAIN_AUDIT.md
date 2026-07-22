# ChampionDex — Evolution Chain Audit

**Date:** 2026-07-21 | **Total flagged:** 438

---

## Section 1 — Default Forms (180 total)

These are default-form Pokémon flagged because they appear in no `pokemon_evolutions` row and are not exempted by `is_legendary`, `is_mythical`, or `KNOWN_SINGLE_STAGE` in the audit script.

### 1a — Legendary / Mythical (92 forms)

**Decision: ✅ Correct — no action needed.** These Pokémon have no evolution chains by design. Flagged only because `is_legendary` / `is_mythical` = 0 in the DB despite being legendary or mythical in the games.

| # | Display Name | Dex # | Game Classification |
|---|---|---|---|
| 1 | Articuno | #144 | Legendary |
| 2 | Zapdos | #145 | Legendary |
| 3 | Moltres | #146 | Legendary |
| 4 | Mewtwo | #150 | Legendary |
| 5 | Raikou | #243 | Legendary |
| 6 | Entei | #244 | Legendary |
| 7 | Suicune | #245 | Legendary |
| 8 | Lugia | #249 | Legendary |
| 9 | Ho-Oh | #250 | Legendary |
| 10 | Regirock | #377 | Legendary |
| 11 | Regice | #378 | Legendary |
| 12 | Registeel | #379 | Legendary |
| 13 | Latias | #380 | Legendary |
| 14 | Latios | #381 | Legendary |
| 15 | Kyogre | #382 | Legendary |
| 16 | Groudon | #383 | Legendary |
| 17 | Rayquaza | #384 | Legendary |
| 18 | Uxie | #480 | Legendary |
| 19 | Mesprit | #481 | Legendary |
| 20 | Azelf | #482 | Legendary |
| 21 | Dialga | #483 | Legendary |
| 22 | Palkia | #484 | Legendary |
| 23 | Heatran | #485 | Legendary |
| 24 | Regigigas | #486 | Legendary |
| 25 | Giratina | #487 | Legendary |
| 26 | Cresselia | #488 | Legendary |
| 27 | Cobalion | #638 | Legendary |
| 28 | Terrakion | #639 | Legendary |
| 29 | Virizion | #640 | Legendary |
| 30 | Tornadus | #641 | Legendary |
| 31 | Thundurus | #642 | Legendary |
| 32 | Reshiram | #643 | Legendary |
| 33 | Zekrom | #644 | Legendary |
| 34 | Landorus | #645 | Legendary |
| 35 | Kyurem | #646 | Legendary |
| 36 | Xerneas | #716 | Legendary |
| 37 | Yveltal | #717 | Legendary |
| 38 | Zygarde | #718 | Legendary |
| 39 | Tapu Koko | #785 | Legendary |
| 40 | Tapu Lele | #786 | Legendary |
| 41 | Tapu Bulu | #787 | Legendary |
| 42 | Tapu Fini | #788 | Legendary |
| 43 | Nihilego | #793 | Legendary |
| 44 | Buzzwole | #794 | Legendary |
| 45 | Pheromosa | #795 | Legendary |
| 46 | Xurkitree | #796 | Legendary |
| 47 | Celesteela | #797 | Legendary |
| 48 | Kartana | #798 | Legendary |
| 49 | Guzzlord | #799 | Legendary |
| 50 | Necrozma | #800 | Legendary |
| 51 | Stakataka | #805 | Legendary |
| 52 | Blacephalon | #806 | Legendary |
| 53 | Zacian | #888 | Legendary |
| 54 | Zamazenta | #889 | Legendary |
| 55 | Eternatus | #890 | Legendary |
| 56 | Regieleki | #894 | Legendary |
| 57 | Regidrago | #895 | Legendary |
| 58 | Glastrier | #896 | Legendary |
| 59 | Spectrier | #897 | Legendary |
| 60 | Calyrex | #898 | Legendary |
| 61 | Enamorus | #905 | Legendary |
| 62 | Great Tusk | #984 | Legendary |
| 63 | Scream Tail | #985 | Legendary |
| 64 | Brute Bonnet | #986 | Legendary |
| 65 | Flutter Mane | #987 | Legendary |
| 66 | Slither Wing | #988 | Legendary |
| 67 | Sandy Shocks | #989 | Legendary |
| 68 | Iron Treads | #990 | Legendary |
| 69 | Iron Bundle | #991 | Legendary |
| 70 | Iron Hands | #992 | Legendary |
| 71 | Iron Jugulis | #993 | Legendary |
| 72 | Iron Moth | #994 | Legendary |
| 73 | Iron Thorns | #995 | Legendary |
| 74 | Wo-Chien | #1001 | Legendary |
| 75 | Chien-Pao | #1002 | Legendary |
| 76 | Ting-Lu | #1003 | Legendary |
| 77 | Chi-Yu | #1004 | Legendary |
| 78 | Roaring Moon | #1005 | Legendary |
| 79 | Iron Valiant | #1006 | Legendary |
| 80 | Koraidon | #1007 | Legendary |
| 81 | Miraidon | #1008 | Legendary |
| 82 | Walking Wake | #1009 | Legendary |
| 83 | Iron Leaves | #1010 | Legendary |
| 84 | Okidogi | #1014 | Legendary |
| 85 | Munkidori | #1015 | Legendary |
| 86 | Fezandipiti | #1016 | Legendary |
| 87 | Ogerpon | #1017 | Legendary |
| 88 | Gouging Fire | #1020 | Legendary |
| 89 | Raging Bolt | #1021 | Legendary |
| 90 | Iron Boulder | #1022 | Legendary |
| 91 | Iron Crown | #1023 | Legendary |
| 92 | Terapagos | #1024 | Legendary |

**Count: 92**

### 1b-i — Single-stage Pokémon with a Mega evolution (13 forms)

These have no standard evolution chain but do have a Mega form in the DB. Flagged because their base default form has no `pokemon_evolutions` entry — the Mega form is in Section 3 as a separate row, also flagged.

**Decision: ⚠️ Pending** — depends on whether the Mega evolution should be represented as an evolution chain entry or treated purely as a form variant.

| # | Display Name | Dex # | Mega Form(s) in DB |
|---|---|---|---|
| 1 | Kangaskhan | #115 | Mega Kangaskhan |
| 2 | Pinsir | #127 | Mega Pinsir |
| 3 | Aerodactyl | #142 | Mega Aerodactyl |
| 4 | Heracross | #214 | Mega Heracross |
| 5 | Skarmory | #227 | Mega Skarmory |
| 6 | Sableye | #302 | Mega Sableye |
| 7 | Mawile | #303 | Mega Mawile |
| 8 | Absol | #359 | Mega Absol, Mega Absol Z |
| 9 | Audino | #531 | Mega Audino |
| 10 | Hawlucha | #701 | Mega Hawlucha |
| 11 | Drampa | #780 | Mega Drampa |
| 12 | Falinks | #870 | Mega Falinks |
| 13 | Tatsugiri | #978 | Mega Tatsugiri (×3) |

**Count: 13**

### 1b-ii — Single-stage non-legendary Pokémon with no evolution of any kind (75 forms)

**Decision: ✅ Correct — no action needed.**

| # | Display Name | Dex # |
|---|---|---|
| 1 | Tauros | #128 |
| 2 | Lapras | #131 |
| 3 | Ditto | #132 |
| 4 | Unown | #201 |
| 5 | Shuckle | #213 |
| 6 | Delibird | #225 |
| 7 | Smeargle | #235 |
| 8 | Miltank | #241 |
| 9 | Plusle | #311 |
| 10 | Minun | #312 |
| 11 | Volbeat | #313 |
| 12 | Illumise | #314 |
| 13 | Torkoal | #324 |
| 14 | Spinda | #327 |
| 15 | Zangoose | #335 |
| 16 | Seviper | #336 |
| 17 | Lunatone | #337 |
| 18 | Solrock | #338 |
| 19 | Castform | #351 |
| 20 | Kecleon | #352 |
| 21 | Tropius | #357 |
| 22 | Relicanth | #369 |
| 23 | Luvdisc | #370 |
| 24 | Pachirisu | #417 |
| 25 | Chatot | #441 |
| 26 | Spiritomb | #442 |
| 27 | Carnivine | #455 |
| 28 | Rotom | #479 |
| 29 | Throh | #538 |
| 30 | Sawk | #539 |
| 31 | Maractus | #556 |
| 32 | Sigilyph | #561 |
| 33 | Emolga | #587 |
| 34 | Alomomola | #594 |
| 35 | Cryogonal | #615 |
| 36 | Stunfisk | #618 |
| 37 | Druddigon | #621 |
| 38 | Bouffalant | #626 |
| 39 | Heatmor | #631 |
| 40 | Durant | #632 |
| 41 | Furfrou | #676 |
| 42 | Dedenne | #702 |
| 43 | Carbink | #703 |
| 44 | Klefki | #707 |
| 45 | Oricorio | #741 |
| 46 | Wishiwashi | #746 |
| 47 | Comfey | #764 |
| 48 | Oranguru | #765 |
| 49 | Passimian | #766 |
| 50 | Pyukumuku | #771 |
| 51 | Minior | #774 |
| 52 | Komala | #775 |
| 53 | Turtonator | #776 |
| 54 | Togedemaru | #777 |
| 55 | Mimikyu | #778 |
| 56 | Bruxish | #779 |
| 57 | Dhelmise | #781 |
| 58 | Cramorant | #845 |
| 59 | Pincurchin | #871 |
| 60 | Stonjourner | #874 |
| 61 | Eiscue | #875 |
| 62 | Indeedee | #876 |
| 63 | Morpeko | #877 |
| 64 | Dracozolt | #880 |
| 65 | Arctozolt | #881 |
| 66 | Dracovish | #882 |
| 67 | Arctovish | #883 |
| 68 | Squawkabilly | #931 |
| 69 | Klawf | #950 |
| 70 | Bombirdier | #962 |
| 71 | Cyclizar | #967 |
| 72 | Orthworm | #968 |
| 73 | Flamigo | #973 |
| 74 | Veluza | #976 |
| 75 | Dondozo | #977 |

**Count: 75**

**Section 1 total: 180**

---

## Section 2 — Regional Forms (58 total)

**Decision: ✅ Data confirmed correct. Pending implementation decision on which forms warrant evolution chain entries.**

| # | Display Name | Dex # | Evolves From | Evolves To | Notes |
|---|---|---|---|---|---|
| 1 | Alolan Rattata | #19 |  | Alolan Raticate #20 |  |
| 2 | Alolan Raticate | #20 | Alolan Rattata |  | Terminal |
| 3 | Alolan Raichu | #26 | Pikachu (default) |  | Terminal |
| 4 | Alolan Sandshrew | #27 |  | Alolan Sandslash #28 |  |
| 5 | Alolan Sandslash | #28 | Alolan Sandshrew |  | Terminal |
| 6 | Alolan Vulpix | #37 |  | Alolan Ninetales #38 |  |
| 7 | Alolan Ninetales | #38 | Alolan Vulpix |  | Terminal |
| 8 | Alolan Diglett | #50 |  | Alolan Dugtrio #51 |  |
| 9 | Alolan Dugtrio | #51 | Alolan Diglett |  | Terminal |
| 10 | Alolan Meowth | #52 |  | Alolan Persian #53 |  |
| 11 | Galarian Meowth | #52 |  | Perrserker #863 | Cross-species |
| 12 | Alolan Persian | #53 | Alolan Meowth |  | Terminal |
| 13 | Hisuian Growlithe | #58 |  | Hisuian Arcanine #59 |  |
| 14 | Hisuian Arcanine | #59 | Hisuian Growlithe |  | Terminal |
| 15 | Alolan Geodude | #74 |  | Alolan Graveler #75 |  |
| 16 | Alolan Graveler | #75 | Alolan Geodude | Alolan Golem #76 | Mid-stage |
| 17 | Alolan Golem | #76 | Alolan Graveler |  | Terminal |
| 18 | Galarian Ponyta | #77 |  | Galarian Rapidash #78 |  |
| 19 | Galarian Rapidash | #78 | Galarian Ponyta |  | Terminal |
| 20 | Galarian Slowpoke | #79 |  | Galarian Slowbro #80 / Galarian Slowking #199 | Branches |
| 21 | Galarian Slowbro | #80 | Galarian Slowpoke |  | Terminal |
| 22 | Galarian Farfetch’d | #83 |  | Sirfetch'd #865 | Cross-species |
| 23 | Alolan Grimer | #88 |  | Alolan Muk #89 |  |
| 24 | Alolan Muk | #89 | Alolan Grimer |  | Terminal |
| 25 | Hisuian Voltorb | #100 |  | Hisuian Electrode #101 |  |
| 26 | Hisuian Electrode | #101 | Hisuian Voltorb |  | Terminal |
| 27 | Alolan Exeggutor | #103 | Exeggcute (default) |  | Terminal |
| 28 | Alolan Marowak | #105 | Cubone (default) |  | Terminal |
| 29 | Galarian Weezing | #110 | Koffing (default) |  | Terminal |
| 30 | Galarian Mr. Mime | #122 | Mime Jr. (default) | Mr. Rime #866 | Cross-species; Mime Jr. branches to default Mr. Mime or Galarian Mr. Mime |
| 31 | Paldean Tauros | #128 |  |  | Single stage — Combat Breed |
| 32 | Paldean Tauros | #128 |  |  | Single stage — Blaze Breed |
| 33 | Paldean Tauros | #128 |  |  | Single stage — Aqua Breed |
| 34 | Galarian Articuno | #144 |  |  | Single stage — Legendary |
| 35 | Galarian Zapdos | #145 |  |  | Single stage — Legendary |
| 36 | Galarian Moltres | #146 |  |  | Single stage — Legendary |
| 37 | Hisuian Typhlosion | #157 | Quilava (default) |  | Terminal; pre-evolutions are default-form |
| 38 | Paldean Wooper | #194 |  | Clodsire #980 | Cross-species |
| 39 | Galarian Slowking | #199 | Galarian Slowpoke |  | Terminal (branch of Galarian Slowpoke line) |
| 40 | Hisuian Qwilfish | #211 |  | Overqwil #904 | Cross-species |
| 41 | Hisuian Sneasel | #215 |  | Sneasler #903 | Cross-species |
| 42 | Galarian Corsola | #222 |  | Cursola #864 | Cross-species |
| 43 | Galarian Zigzagoon | #263 |  | Galarian Linoone #264 |  |
| 44 | Galarian Linoone | #264 | Galarian Zigzagoon | Obstagoon #862 | Cross-species terminal |
| 45 | Hisuian Samurott | #503 | Dewott (default) |  | Terminal; pre-evolutions are default-form |
| 46 | Hisuian Lilligant | #549 | Petilil (default) |  | Terminal; pre-evolution is default-form |
| 47 | Galarian Darumaka | #554 |  | Galarian Darmanitan #555 |  |
| 48 | Galarian Darmanitan | #555 | Galarian Darumaka |  | Terminal — Standard form |
| 49 | Galarian Darmanitan | #555 | Galarian Darumaka |  | Terminal — Zen Mode (in-battle form of Galarian Darmanitan) |
| 50 | Galarian Yamask | #562 |  | Runerigus #867 | Cross-species |
| 51 | Hisuian Zorua | #570 |  | Hisuian Zoroark #571 |  |
| 52 | Hisuian Zoroark | #571 | Hisuian Zorua |  | Terminal |
| 53 | Galarian Stunfisk | #618 |  |  | Single stage |
| 54 | Hisuian Braviary | #628 | Rufflet (default) |  | Terminal; pre-evolution is default-form |
| 55 | Hisuian Sliggoo | #705 | Goomy (default) | Hisuian Goodra #706 |  |
| 56 | Hisuian Goodra | #706 | Hisuian Sliggoo |  | Terminal |
| 57 | Hisuian Avalugg | #713 | Bergmite (default) |  | Terminal; pre-evolution is default-form |
| 58 | Hisuian Decidueye | #724 | Dartrix (default) |  | Terminal; pre-evolutions are default-form |

**Section 2 total: 58**

---

## Section 3 — Mega Forms (92 total)

**Decision: ✅ Seeding gap — add evolution chain entries linking each Mega to its base form.**

Rules:
- Each Mega form gets a `pokemon_evolutions` row: base form → mega form, `method` = `mega-evolution`, `condition_value` = the required Mega Stone slug (e.g. `venusaurite`, `absolite`).
- Schema confirmed sufficient: existing `method TEXT` + `condition_value TEXT` columns can express this with no schema changes.
- The base form's detail view **omits** Mega evolution entries from its displayed evolution tree (UI filter, not a data omission).
- The Mega form's detail view shows a minimal chain: base form → mega form(s) only, with the Mega Stone labelled.
- Where a species has multiple Megas (e.g. Charizard X/Y, Absol/Absol Z, Garchomp/Garchomp Z, Lucario/Lucario Z, Mewtwo X/Y, Meowstic M/F, Magearna/Magearna-Original, Tatsugiri ×3), all variants appear as branches from the base.

⚠️ **Blocker to investigate:** Z-A Mega forms (Legends Z-A megas, national dex ~10278–10326) may not have Mega Stone data available in PokeAPI. Stone availability must be confirmed for every Z-A Mega before implementation. If stone data is unavailable for any Z-A Mega, `condition_value` = NULL is acceptable as a placeholder, but this must be an explicit decision, not an assumption.

| # | Display Name | Dex # |
|---|---|---|
| 1 | Mega Venusaur | #3 |
| 2 | Mega Charizard X | #6 |
| 3 | Mega Charizard Y | #6 |
| 4 | Mega Blastoise | #9 |
| 5 | Mega Beedrill | #15 |
| 6 | Mega Pidgeot | #18 |
| 7 | Mega Raichu X | #26 |
| 8 | Mega Raichu Y | #26 |
| 9 | Mega Clefable | #36 |
| 10 | Mega Alakazam | #65 |
| 11 | Mega Victreebel | #71 |
| 12 | Mega Slowbro | #80 |
| 13 | Mega Gengar | #94 |
| 14 | Mega Kangaskhan | #115 |
| 15 | Mega Starmie | #121 |
| 16 | Mega Pinsir | #127 |
| 17 | Mega Gyarados | #130 |
| 18 | Mega Aerodactyl | #142 |
| 19 | Mega Dragonite | #149 |
| 20 | Mega Mewtwo X | #150 |
| 21 | Mega Mewtwo Y | #150 |
| 22 | Mega Meganium | #154 |
| 23 | Mega Feraligatr | #160 |
| 24 | Mega Ampharos | #181 |
| 25 | Mega Steelix | #208 |
| 26 | Mega Scizor | #212 |
| 27 | Mega Heracross | #214 |
| 28 | Mega Skarmory | #227 |
| 29 | Mega Houndoom | #229 |
| 30 | Mega Tyranitar | #248 |
| 31 | Mega Sceptile | #254 |
| 32 | Mega Blaziken | #257 |
| 33 | Mega Swampert | #260 |
| 34 | Mega Gardevoir | #282 |
| 35 | Mega Sableye | #302 |
| 36 | Mega Mawile | #303 |
| 37 | Mega Aggron | #306 |
| 38 | Mega Medicham | #308 |
| 39 | Mega Manectric | #310 |
| 40 | Mega Sharpedo | #319 |
| 41 | Mega Camerupt | #323 |
| 42 | Mega Altaria | #334 |
| 43 | Mega Banette | #354 |
| 44 | Mega Chimecho | #358 |
| 45 | Mega Absol | #359 |
| 46 | Mega Absol Z | #359 |
| 47 | Mega Glalie | #362 |
| 48 | Mega Salamence | #373 |
| 49 | Mega Metagross | #376 |
| 50 | Mega Latias | #380 |
| 51 | Mega Latios | #381 |
| 52 | Mega Rayquaza | #384 |
| 53 | Mega Staraptor | #398 |
| 54 | Mega Lopunny | #428 |
| 55 | Mega Garchomp | #445 |
| 56 | Mega Garchomp Z | #445 |
| 57 | Mega Lucario | #448 |
| 58 | Mega Lucario Z | #448 |
| 59 | Mega Abomasnow | #460 |
| 60 | Mega Gallade | #475 |
| 61 | Mega Froslass | #478 |
| 62 | Mega Heatran | #485 |
| 63 | Mega Emboar | #500 |
| 64 | Mega Excadrill | #530 |
| 65 | Mega Audino | #531 |
| 66 | Mega Scolipede | #545 |
| 67 | Mega Scrafty | #560 |
| 68 | Mega Eelektross | #604 |
| 69 | Mega Chandelure | #609 |
| 70 | Mega Golurk | #623 |
| 71 | Mega Chesnaught | #652 |
| 72 | Mega Delphox | #655 |
| 73 | Mega Greninja | #658 |
| 74 | Mega Pyroar | #668 |
| 75 | Mega Floette | #670 |
| 76 | Mega Meowstic | #678 |
| 77 | Mega Meowstic | #678 |
| 78 | Mega Malamar | #687 |
| 79 | Mega Barbaracle | #689 |
| 80 | Mega Dragalge | #691 |
| 81 | Mega Hawlucha | #701 |
| 82 | Mega Zygarde | #718 |
| 83 | Mega Crabominable | #740 |
| 84 | Mega Golisopod | #768 |
| 85 | Mega Drampa | #780 |
| 86 | Mega Falinks | #870 |
| 87 | Mega Scovillain | #952 |
| 88 | Mega Glimmora | #970 |
| 89 | Mega Tatsugiri | #978 |
| 90 | Mega Tatsugiri | #978 |
| 91 | Mega Tatsugiri | #978 |
| 92 | Mega Baxcalibur | #998 |

**Section 3 total: 92**

---

## Section 4 — Alternate Forms (69 total)

| # | Display Name | Dex # | Internal Name | Decision | Evolution Entry Required |
|---|---|---|---|---|---|
| 1 | Primal Kyogre | #382 | kyogreprimal | ✅ Add evolution | Kyogre → Primal Kyogre, method=`primal-reversion`, condition=`blue-orb` |
| 2 | Primal Groudon | #383 | groudonprimal | ✅ Add evolution | Groudon → Primal Groudon, method=`primal-reversion`, condition=`red-orb` |
| 3 | Burmy (Sandy) | #412 | burmysandy | ✅ Legit alt form — no action | — |
| 4 | Burmy (Trash) | #412 | burmytrash | ✅ Legit alt form — no action | — |
| 5 | Wormadam (Sandy) | #413 | wormadamsandy | ✅ Legit alt form — no action | — |
| 6 | Wormadam (Trash) | #413 | wormadamtrash | ✅ Legit alt form — no action | — |
| 7 | Rotom (Heat) | #479 | rotomheat | ✅ Legit alt form — no action | — |
| 8 | Rotom (Wash) | #479 | rotomwash | ✅ Legit alt form — no action | — |
| 9 | Rotom (Frost) | #479 | rotomfrost | ✅ Legit alt form — no action | — |
| 10 | Rotom (Fan) | #479 | rotomfan | ✅ Legit alt form — no action | — |
| 11 | Rotom (Mow) | #479 | rotommow | ✅ Legit alt form — no action | — |
| 12 | Dialga (Origin) | #483 | dialgaorigin | ✅ Legit alt form — no action | — |
| 13 | Palkia (Origin) | #484 | palkiaorigin | ✅ Legit alt form — no action | — |
| 14 | Giratina (Origin) | #487 | giratinaorigin | ✅ Legit alt form — no action | — |
| 15 | Basculin (Blue-Striped) | #550 | basculinbluestriped | ✅ Legit alt form — no action | — |
| 16 | Basculin (White-Striped) | #550 | basculinwhitestriped | ✅ Legit alt form — no action | — |
| 17 | Darmanitan (Zen) | #555 | darmanitanzen | ✅ Legit alt form — no action | — |
| 18 | Tornadus (Therian) | #641 | tornadustherian | ✅ Legit alt form — no action | — |
| 19 | Thundurus (Therian) | #642 | thundurustherian | ✅ Legit alt form — no action | — |
| 20 | Landorus (Therian) | #645 | landorustherian | ✅ Legit alt form — no action | — |
| 21 | Kyurem (Black) | #646 | kyuremblack | ✅ Legit alt form — no action | — |
| 22 | Kyurem (White) | #646 | kyuremwhite | ✅ Legit alt form — no action | — |
| 23 | Greninja (Bond) | #658 | greninjabond | ✅ Legit alt form — no action | — |
| 24 | Greninja (Ash) | #658 | greninjaash | ✅ Legit alt form — no action | — |
| 25 | Floette (Eternal) | #670 | floetteeternal | ✅ Legit alt form — no action | — |
| 26 | Aegislash (Blade) | #681 | aegislashblade | ✅ Legit alt form — no action | — |
| 27 | Pumpkaboo (Small) | #710 | pumpkaboosmall | ✅ Legit alt form — no action | — |
| 28 | Pumpkaboo (Large) | #710 | pumpkaboolarge | ✅ Legit alt form — no action | — |
| 29 | Pumpkaboo (Super) | #710 | pumpkaboosuper | ✅ Legit alt form — no action | — |
| 30 | Gourgeist (Small) | #711 | gourgeistsmall | ✅ Legit alt form — no action | — |
| 31 | Gourgeist (Large) | #711 | gourgeistlarge | ✅ Legit alt form — no action | — |
| 32 | Gourgeist (Super) | #711 | gourgeistsuper | ✅ Legit alt form — no action | — |
| 33 | Zygarde (10%) | #718 | zygarde10 | ✅ Add evolution | Zygarde 10% → Zygarde Complete, method=`battle`, condition=`< 50% HP` |
| 34 | Zygarde (Complete) | #718 | zygardecomplete | ✅ Add evolution (source: both 10% and default 50%) | Zygarde 50% (default) → Zygarde Complete, method=`battle`, condition=`< 50% HP` |
| 35 | Oricorio (Pom-Pom) | #741 | oricoriopompom | ✅ Legit alt form — no action | — |
| 36 | Oricorio (Pa'u) | #741 | oricoriopau | ✅ Legit alt form — no action | — |
| 37 | Oricorio (Sensu) | #741 | oricoriosensu | ✅ Legit alt form — no action | — |
| 38 | Rockruff (Dusk) | #744 | rockruffdusk | ✅ Add evolution | Rockruff Dusk → Lycanroc Dusk, method=`level-up`, condition=`dusk` |
| 39 | Lycanroc (Midnight) | #745 | lycanrocmidnight | ✅ Add evolution (source: default Rockruff) | Rockruff (default) → Lycanroc Midnight, method=`level-up`, condition=`night` |
| 40 | Lycanroc (Dusk) | #745 | lycanrocdusk | ✅ Add evolution (target of Rockruff Dusk) | — (covered by row 38) |
| 41 | Wishiwashi (School) | #746 | wishiwashischool | ✅ Add evolution | Wishiwashi (default) → Wishiwashi School, method=`battle`, condition=`> 25% HP` |
| 42 | Mimikyu (Busted) | #778 | mimikyubusted | ✅ Add evolution | Mimikyu (default) → Mimikyu Busted, method=`battle`, condition=`Damage Taken` |
| 43 | Necrozma (Dusk-Mane) | #800 | necrozmaduskmane | ✅ Add evolution | Necrozma Dusk-Mane → Ultra Necrozma, method=`battle`, condition=`Ultra Burst` |
| 44 | Necrozma (Dawn-Wings) | #800 | necrozmadawnwings | ✅ Add evolution | Necrozma Dawn-Wings → Ultra Necrozma, method=`battle`, condition=`Ultra Burst` |
| 45 | Ultra Necrozma | #800 | necrozmaultra | ✅ Add evolution (target of rows 43 & 44) | — (covered by rows 43 & 44) |
| 46 | Toxtricity (Low-Key) | #849 | toxtricitylowkey | ✅ Legit alt form — no action | — |
| 47 | Eiscue (Noice) | #875 | eiscuenoice | ✅ Add evolution | Eiscue (default) → Eiscue Noice, method=`battle`, condition=`Physical Hit` |
| 48 | Morpeko (Hangry) | #877 | morpekohangry | ✅ Add evolution (bidirectional) | Morpeko (default) ↔ Morpeko Hangry, method=`battle`, condition=`Alternates` |
| 49 | Zacian (Crowned) | #888 | zaciancrowned | ✅ Add evolution | Zacian (default) → Zacian Crowned, method=`battle`, condition=`Rusty Sword` |
| 50 | Zamazenta (Crowned) | #889 | zamazentacrowned | ✅ Add evolution | Zamazenta (default) → Zamazenta Crowned, method=`battle`, condition=`Rusty Shield` |
| 51 | Eternamax Eternatus | #890 | eternatuseternamax | ✅ Legit alt form — no action | — |
| 52 | Urshifu (Rapid Strike) | #892 | urshifurapidstrike | ✅ Legit alt form — no action | — |
| 53 | Calyrex (Ice Rider) | #898 | calyrexice | ✅ Legit alt form — no action | — |
| 54 | Calyrex (Shadow Rider) | #898 | calyrexshadow | ✅ Legit alt form — no action | — |
| 55 | Bloodmoon Ursaluna | #901 | ursalunabloodmoon | ✅ Legit alt form — no action | — |
| 56 | Enamorus (Therian) | #905 | enamorustherian | ✅ Legit alt form — no action | — |
| 57 | Palafin (Hero) | #964 | palafinhero | ✅ Add evolution | Palafin (default) → Palafin Hero, method=`battle`, condition=`Swap Out/In` |
| 58 | Tatsugiri (Droopy) | #978 | tatsugiridroopy | ✅ Legit alt form — no action | — |
| 59 | Tatsugiri (Stretchy) | #978 | tatsugiristretchy | ✅ Legit alt form — no action | — |
| 60 | Gimmighoul (Roaming) | #999 | gimmighoulroaming | ✅ Legit alt form — no action | — |
| 61 | Ogerpon (Wellspring) | #1017 | ogerponwellspring | ✅ Add evolution | Ogerpon Wellspring → Ogerpon Wellspring Tera, method=`battle`, condition=`Terastallize` |
| 62 | Ogerpon (Hearthflame) | #1017 | ogerponhearthflame | ✅ Add evolution | Ogerpon Hearthflame → Ogerpon Hearthflame Tera, method=`battle`, condition=`Terastallize` |
| 63 | Ogerpon (Cornerstone) | #1017 | ogerponcornerstone | ✅ Add evolution | Ogerpon Cornerstone → Ogerpon Cornerstone Tera, method=`battle`, condition=`Terastallize` |
| 64 | Ogerpon (Teal Tera) | #1017 | ogerpontealtera | ✅ Add evolution (target of default Ogerpon) | Ogerpon (default/Teal) → Ogerpon Teal Tera, method=`battle`, condition=`Terastallize` |
| 65 | Ogerpon (Wellspring Tera) | #1017 | ogerponwellspringtera | ✅ Add evolution (target of row 61) | — (covered by row 61) |
| 66 | Ogerpon (Hearthflame Tera) | #1017 | ogerponhearthflametera | ✅ Add evolution (target of row 62) | — (covered by row 62) |
| 67 | Ogerpon (Cornerstone Tera) | #1017 | ogerponcornerstonetera | ✅ Add evolution (target of row 63) | — (covered by row 63) |
| 68 | Terapagos (Terastal) | #1024 | terapagosterastal | ✅ Legit alt form — no action | — |
| 69 | Terapagos (Stellar) | #1024 | terapagosstellar | ✅ Legit alt form — no action | — |

**Section 4 total: 69**

**Forms requiring new evolution entries: 1, 2, 33, 34, 38, 39, 41, 42, 43, 44, 47, 48, 49, 50, 57, 61, 62, 63, 64 (19 rows)**

---

## Section 5 — Gigantamax Forms (34 total)

**Decision: ✅ Seeding gap — add evolution chain entries linking each Gigantamax form to its base form. Same pattern as Section 3 Mega forms.**

Rules:
- Each Gigantamax form gets a `pokemon_evolutions` row: base form → G-Max form, `method` = `gigantamax`, `condition_value` = `gigantamax-factor`.
- Schema sufficient: no changes needed.
- The base form's detail view **omits** Gigantamax entries from its displayed evolution tree (UI filter, same as Mega).
- The Gigantamax form's detail view shows a minimal chain: base form → G-Max form only.
- **Toxtricity:** Amped (default, id=1074) → Gigantamax Amped (id=1076, pokeapi_id=10219); Low-Key (alternate, id=1075) → Gigantamax Low-Key (id=1077, pokeapi_id=10228). Each form maps to its own G-Max exclusively.
- **Urshifu:** Single-Strike (default, id=1133) → Gigantamax Single-Strike (id=1135, pokeapi_id=10226); Rapid-Strike (alternate, id=1134) → Gigantamax Rapid-Strike (id=1136, pokeapi_id=10227). Each form maps to its own G-Max exclusively.
- **Audit discrepancy:** The audit originally listed 33 forms but the DB contains 34 — **Gigantamax Melmetal (#809, id=1024)** was omitted from the audit list. It is included here and receives the same treatment.

| # | Display Name | Dex # | DB id | Base Form | Base id | Evolution Entry |
|---|---|---|---|---|---|---|
| 1 | Gigantamax Venusaur | #3 | 5 | Venusaur | 3 | 3→5, `gigantamax`, `gigantamax-factor` |
| 2 | Gigantamax Charizard | #6 | 11 | Charizard | 8 | 8→11, `gigantamax`, `gigantamax-factor` |
| 3 | Gigantamax Blastoise | #9 | 16 | Blastoise | 14 | 14→16, `gigantamax`, `gigantamax-factor` |
| 4 | Gigantamax Butterfree | #12 | 20 | Butterfree | 19 | 19→20, `gigantamax`, `gigantamax-factor` |
| 5 | Gigantamax Pikachu | #25 | 38 | Pikachu | 37 | 37→38, `gigantamax`, `gigantamax-factor` |
| 6 | Gigantamax Meowth | #52 | 78 | Meowth | 75 | 75→78, `gigantamax`, `gigantamax-factor` |
| 7 | Gigantamax Machamp | #68 | 99 | Machamp | 98 | 98→99, `gigantamax`, `gigantamax-factor` |
| 8 | Gigantamax Gengar | #94 | 139 | Gengar | 137 | 137→139, `gigantamax`, `gigantamax-factor` |
| 9 | Gigantamax Kingler | #99 | 145 | Kingler | 144 | 144→145, `gigantamax`, `gigantamax-factor` |
| 10 | Gigantamax Lapras | #131 | 191 | Lapras | 190 | 190→191, `gigantamax`, `gigantamax-factor` |
| 11 | Gigantamax Eevee | #133 | 194 | Eevee | 193 | 193→194, `gigantamax`, `gigantamax-factor` |
| 12 | Gigantamax Snorlax | #143 | 206 | Snorlax | 205 | 205→206, `gigantamax`, `gigantamax-factor` |
| 13 | Gigantamax Garbodor | #569 | 721 | Garbodor | 720 | 720→721, `gigantamax`, `gigantamax-factor` |
| 14 | Gigantamax Melmetal | #809 | 1024 | Melmetal | 1023 | 1023→1024, `gigantamax`, `gigantamax-factor` |
| 15 | Gigantamax Rillaboom | #812 | 1028 | Rillaboom | 1027 | 1027→1028, `gigantamax`, `gigantamax-factor` |
| 16 | Gigantamax Cinderace | #815 | 1032 | Cinderace | 1031 | 1031→1032, `gigantamax`, `gigantamax-factor` |
| 17 | Gigantamax Inteleon | #818 | 1036 | Inteleon | 1035 | 1035→1036, `gigantamax`, `gigantamax-factor` |
| 18 | Gigantamax Corviknight | #823 | 1042 | Corviknight | 1041 | 1041→1042, `gigantamax`, `gigantamax-factor` |
| 19 | Gigantamax Orbeetle | #826 | 1046 | Orbeetle | 1045 | 1045→1046, `gigantamax`, `gigantamax-factor` |
| 20 | Gigantamax Drednaw | #834 | 1055 | Drednaw | 1054 | 1054→1055, `gigantamax`, `gigantamax-factor` |
| 21 | Gigantamax Coalossal | #839 | 1061 | Coalossal | 1060 | 1060→1061, `gigantamax`, `gigantamax-factor` |
| 22 | Gigantamax Flapple | #841 | 1064 | Flapple | 1063 | 1063→1064, `gigantamax`, `gigantamax-factor` |
| 23 | Gigantamax Appletun | #842 | 1066 | Appletun | 1065 | 1065→1066, `gigantamax`, `gigantamax-factor` |
| 24 | Gigantamax Sandaconda | #844 | 1069 | Sandaconda | 1068 | 1068→1069, `gigantamax`, `gigantamax-factor` |
| 25 | Gigantamax Toxtricity (Amped) | #849 | 1076 | Toxtricity (Amped/default) | 1074 | 1074→1076, `gigantamax`, `gigantamax-factor` |
| 26 | Gigantamax Toxtricity (Low-Key) | #849 | 1077 | Toxtricity (Low-Key/alternate) | 1075 | 1075→1077, `gigantamax`, `gigantamax-factor` |
| 27 | Gigantamax Centiskorch | #851 | 1080 | Centiskorch | 1079 | 1079→1080, `gigantamax`, `gigantamax-factor` |
| 28 | Gigantamax Hatterene | #858 | 1088 | Hatterene | 1087 | 1087→1088, `gigantamax`, `gigantamax-factor` |
| 29 | Gigantamax Grimmsnarl | #861 | 1092 | Grimmsnarl | 1091 | 1091→1092, `gigantamax`, `gigantamax-factor` |
| 30 | Gigantamax Alcremie | #869 | 1101 | Alcremie | 1100 | 1100→1101, `gigantamax`, `gigantamax-factor` |
| 31 | Gigantamax Copperajah | #879 | 1116 | Copperajah | 1115 | 1115→1116, `gigantamax`, `gigantamax-factor` |
| 32 | Gigantamax Duraludon | #884 | 1122 | Duraludon | 1121 | 1121→1122, `gigantamax`, `gigantamax-factor` |
| 33 | Gigantamax Urshifu (Single-Strike) | #892 | 1135 | Urshifu (Single-Strike/default) | 1133 | 1133→1135, `gigantamax`, `gigantamax-factor` |
| 34 | Gigantamax Urshifu (Rapid-Strike) | #892 | 1136 | Urshifu (Rapid-Strike/alternate) | 1134 | 1134→1136, `gigantamax`, `gigantamax-factor` |

**Section 5 total: 34**

---

## Section 6 — Cosmetic Forms (6 total)

**Decisions per form below.**

### 6-1 — Nidoran ♀ (#29) and Nidoran ♂ (#32)

**Decision: ✅ Seeding gap — add missing root evolution entries.**

Both Nidorans have `form_type='cosmetic'` in the DB, which is incorrect — they are the default base forms of their respective lines. The evolution rows for Nidorina→Nidoqueen and Nidorino→Nidoking already exist. The missing rows are the **root** of each chain.

Required new entries:
- Nidoran ♀ (id=47) → Nidorina (id=48), `method='level-up'`, `condition_value='16'`
- Nidorina (id=48) → Nidoqueen (id=49) already exists via `use-item` — ✅ no change
- Nidoran ♂ (id=50) → Nidorino (id=51), `method='level-up'`, `condition_value='16'`
- Nidorino (id=51) → Nidoking (id=52) already exists via `use-item` — ✅ no change

⚠️ **Note:** The `form_type='cosmetic'` assignment for both Nidorans is a separate data error. The evolution chain seeding should proceed with their current IDs (47 and 50) regardless — fixing `form_type` is out of scope for this audit and must be a separate explicit decision.

### 6-2 — Meowstic (#678)

**Decision: ✅ Seeding gap — add evolution entry for female Meowstic. Branching pattern mirrors Kirlia→Gardevoir/Gallade.**

Espurr (id=851) already evolves to male Meowstic (id=852) via `level-up` at level 25. Female Meowstic (id=853, cosmetic form) has no evolution row pointing to it. The correct pattern is two branches from Espurr — one per gender — identical to how Kirlia branches to Gardevoir and Gallade.

Required new entry:
- Espurr (id=851) → Meowstic female (id=853), `method='level-up'`, `condition_value='25'`

(The existing Espurr→Meowstic male row is already correct — no change needed.)

### 6-3 — Indeedee (#876)

**Decision: ✅ No action — single-stage species, no evolution.**

Both male (id=1110) and female (id=1111) Indeedee are correctly terminal forms. No evolution rows needed.

### 6-4 — Basculegion (#902)

**Decision: ✅ Seeding gap — add evolution entry for female Basculegion. Branching pattern mirrors Kirlia→Gardevoir/Gallade.**

Basculin White-Striped (id=693) already evolves to male Basculegion (id=1149) via `other` (recoil damage). Female Basculegion (id=1150, cosmetic form) has no evolution row. The correct pattern is two branches from Basculin White-Striped — one per gender.

Required new entry:
- Basculin White-Striped (id=693) → Basculegion female (id=1150), `method='other'`, `condition_value=NULL`

(The existing Basculin White-Striped→Basculegion male row is already correct — no change needed.)

### 6-5 — Oinkologne (#916)

**Decision: ✅ Seeding gap — add evolution entry for female Oinkologne. Branching pattern mirrors Kirlia→Gardevoir/Gallade.**

Lechonk (id=1164) already evolves to male Oinkologne (id=1165) via `level-up`. Female Oinkologne (id=1166, cosmetic form) has no evolution row. The correct pattern is two branches from Lechonk — one per gender.

Required new entry:
- Lechonk (id=1164) → Oinkologne female (id=1166), `method='level-up'`, `condition_value='18'`

(The existing Lechonk→Oinkologne male row is already correct — no change needed.)

**Section 6 total: 6**

---

## Summary

| Section | Category | Count | Status |
|---|---|---|---|
| 1a | Legendary/Mythical defaults (flag unset in DB) | 92 | ✅ No action — correct by design |
| 1b-i | Single-stage defaults with a Mega form | 13 | ✅ Covered by Section 3 Mega decision |
| 1b-ii | Single-stage defaults with no evolution of any kind | 75 | ✅ No action — correct by design |
| 2 | Regional forms | 58 | ✅ Data confirmed correct — implementation decisions pending |
| 3 | Mega forms | 92 | ✅ Decision made — add `pokemon_evolutions` rows |
| 4 | Alternate forms | 69 | ✅ Decision made — 19 rows needed |
| 5 | Gigantamax forms | 34 (audit had 33; Gigantamax Melmetal added) | ✅ Decision made — add `pokemon_evolutions` rows |
| 6 | Cosmetic forms | 6 | ✅ Decision made — see per-form decisions above |
|  | **TOTAL** | **439** | **All sections reviewed** |
