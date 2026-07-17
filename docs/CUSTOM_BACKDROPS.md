# Backdrop Reassignment
In order to better personalize each of the pokemon's backdrops, I want to override the type-based backdrop for specific usecases, as outlined below:

# Secondary-Type Backdrops
The following list of pokemon should use their secondary typing to determine their backdrop instead of their primary typing:
- Sneasel
- Sneasel-Hisui
- Sneasler
- Weavile
- All Rotom Forms
- Reshiram
- Zekrom
- Honedge
- Doublade
- Aegislash
- Binacle
- Barbaracle
- Amaura
- Aurorus
- Dedenne
- Sliggoo-Hisui
- Goodra-Hisui
- Klefki
- Noibat
- Noivern
- Yveltal
- Crabominable
- Mareanie
- Toxapex
- Salandit
- Salazzle
- Wimpod
- Golisopod
- Celesteela
- Magearna
- Marshadow
- Cramorant
- Morpeko-Hangry
- Arctozolt
- Zarude
- Calyrex Ice/Shadow riders
- Rabsca
- Tinkatuff
- Tinkaton
- Flamigo
- Tatsugiri
- Annihilape
- Iron Hands
- Frigibax
- Arctibax
- Baxcalibur
- Wo-Chien
- Chien-Pao
- Ting-Lu
- Chi-Yu
- Koraidon
- Miraidon
- Poltchageist
- Sinistcha
- Voltorb-Hisui
- Electrode-Hisui
- Tauros-Paldea-Blaze
- Tauros-Paldea-Aqua
- Lapras
- Celebi
- Jirachi
- Deino
- Zweilous
- Ogerpon Wellspring/Hearthflame/Cornerstone

# Normal-Type Pokemon Exceptions
For all dual-type pokemon whose primary type is Normal, use the secondary typing instead, with one exception:
- Stufful

# Normal-Flying Type Pokemon
For specifically Normal/Flying type pokemon where Normal is the primary type, use the following rubric:
- If the pokmeon is the first stage in an evolutionary line, keep the normal backdrop
- If the pokemon is the middle stage of a 3-stage evolutionary line, use the new 'route' backdrop
- If the pokemon is the final evolution in an evolutionary line, use the flying backdrop

# Underwater Pokemon
The following pokemon should all use the underwater backdrop:
- Tentacool
- Tentacruel
- Shellder
- Horsea
- Seadra
- Goldeen
- Seaking
- Magikarp
- Gyarados
- Omanyte
- Omastar
- Kabuto
- Kabutops
- Chinchou
- Lanturn
- Qwilfish
- Qwilfish-Hisui
- Corsola
- Corsola-Galar
- Remoraid
- Octillery
- Mantine
- Kingdra
- Carvanha
- Sharpedo
- Wailmer
- Wailord
- Barboach
- Whiscash
- Feebas
- Clamperl
- Huntail
- Gorebyss
- Relicanth
- Luvdisc
- Finneon
- Lumineon
- Mantyke
- Basculin all forms
- Frillish
- Jellicent
- Alomomola
- Skrelp
- Dragalge
- Clauncher
- Clawitzer
- Wishiwashi all forms
- Bruxish
- Arrokuda
- Barraskewda
- Cursola
- Arctovish
- Basculegion male/female
- Overqwil
- Finizen
- Palafin-Zero
- Veluza
- Dondozo

# Pokemon-Specific Assignments
Some pokemon require unique overrides, so if listed below, these supercede previous logic
- Raticate: route
- Girafarig: safari
- Farigiraf: safari
- Oranguru: jungle
- Zorua-Hisui: ice
- Zoroark-Hisui: ice
- Slowpoke-Galar: water
- Magnemite: substation
- Magneton: substation
- Magnezone: substation
- Seel: ice
- Dewgong: ice
- Cloyster: ice
- Exeggutor-Alola: water
- Marowak-Alola: night_wilderness
- Tauros: safari
- Tauros-Paldea-Combat: safari
- Porygon: digital
- Porygon-2: digital *(DB slug: porygon2)*
- Porygon-Z: digital
- Zapdos-Galar: safari
- Moltres-Galar: night_wilderness
- Stantler: route
- Raikou: burnt_tower
- Entei: burnt_tower
- Suicune: burnt_tower
- Lugia: tempest
- Ho-oh: burnt_tower
- Zigzagoon: route
- Linoone: route
- Slakoth: route
- Vigoroth: route
- Slaking: route
- Exploud: route
- Zangoose: route
- Tropius: water
- Latias: flying
- Latios: flying
- Kyogre: tempest
- Kyogre-Primal: tempest
- Groudon: fire
- Groudon-Primal: fire
- Dialga: sky_pillar
- Dialga-origin: sky_pillar
- Palkia: sky_pillar
- Palkia-origin: sky_pillar
- Giratina: sky_pillar
- Giratina-origin: sky_pillar
- Regigigas: dragon2
- Bouffalant: safari
- Rufflet: dragon2
- Braviary-Hisui: flying
- Vullaby: safari
- Mandibuzz: safari
- Hydreigon: dragon2
- Gumshoos: route
- Crabrawler: water
- Sandygast: water
- Palossand: water
- Komala: jungle
- Rookidee: normal
- Corvisquire: route
- Wooloo: route
- Dubwool: route
- Zacian: dragon2
- Zacian-Crowned: dragon2
- Zamazenta: dragon2
- Zamazenta-Crowned: dragon2
- Lechonk: route
- Oinkologne male/female: route
- Bramblin: ground
- Brambleghast: ground
- Rellor: ground
- Orthworm: ground
- Glimmet: dragon
- Glimmora: dragon
- Dunsparce: route
- Dudunsparce: route
- Gholdengo: normal
- Terapagos all forms: dragon
- Pikipek: water
- Trumbeak: water
- Toucannon: water
- Noctowl: night_wilderness
- Doduo: safari
- Dodrio: safari
- Chatot: normal

# Mega Evolutions
All mega evolutions should use the 'mega' backdrop

---

# Backdrop Particle Effects

Ambient looping particles layered behind Pokémon artwork. Always behind the artwork (Layer 3b in PokemonHero). Particles live in the upper 65% of the hero. Implementation: `src/components/pokemon/BackdropParticleLayer.tsx` — add a key to `PARTICLE_CONFIGS` to activate a backdrop.

**Global design constraints (UI designer spec):**
- 3–6 particles visible at any moment — sparse, never saturated
- 4–8s to traverse the hero — dreamy, not lively
- Peak opacity 0.6–0.75 — always translucent
- Fade in/out 800ms at entry/exit
- Always behind artwork, always `pointerEvents: none`
- Colors: muted/desaturated relative to the type color

## ✅ Grass — COMPLETE
- 5 leaves, `10×6dp`, `borderRadius: 3`, `rgba(134, 190, 80, 0.65)`
- Fall duration: 5000–7400ms (index × 600ms spread)
- Stagger: index × 1400ms
- Horizontal drift: ±20–40px sinusoidal sway
- Rotation: 0°→180° per cycle, linear
- Spread: evenly across 5%–95% of screen width

## ✅ Fire — COMPLETE
- 6 ember sparks, `rgba(255,140,20,0.65)`, small circles
- Upward drift with sinusoidal horizontal sway
- Fade in/out 800ms, peak opacity 0.65

## ✅ Water — COMPLETE
- 6 rising bubbles, `rgba(80,160,220,0.60)`
- Upward drift, gentle sway, fade in/out

## ✅ Underwater — COMPLETE
- Variant of water: slower, larger bubbles

## ✅ Ice — COMPLETE
- 5 snowflakes, downward drift, slow rotation, fade in/out

## ✅ Electric — COMPLETE
- 3 randomised lightning bolts; paths regenerate each cycle via `generateRandomLightningPath` (`useCallback(..., [])`)
- 4-layer volumetric render per bolt: atmospheric glow `rgba(255,220,0,0.25)` 8px blur → outer shell `rgba(180,130,0,0.35)` 6.5px → mid-band `rgba(255,225,0,0.45)` 4px → hot core `rgba(255,252,200,0.90)` 2px
- Flash curve: FLASH_IN=40ms, FLASH_DROP=240ms, DECAY=1400ms, PEAK_OP=0.65, DIM_OP=0.20
- Gap durations: bolt0=3200ms, bolt1=5500ms, bolt2=4200ms
- Bolt height: 0.8× heroHeight; x-zones strictly separated (left / centre / right thirds)
- Zigzag x-zones: left `0.01–0.19`, right `0.82–1.00`, continuity bias 25%
- Debounce via `boltDebounce0/1/2` (`useSharedValue(false)`) — NOT JS refs

## ✅ Flying — COMPLETE
- 4 wind streaks travelling right-to-left (into the wind, matching Pokémon facing direction)
- Two-layer SVG per streak: soft halo (8px stroke, σ=6) + sharp core (2px stroke, σ=3)
- Sine-wave path: 60 points, amplitude 7/10/13/16px per streak, frequency 1.5
- Travel animation: `strokeDashoffset` on `AnimatedPath` (`createAnimatedComponent(Path)`)
- Opacity: fade in/out with short hold, sparse visibility

## ✅ Bug — COMPLETE
- 6 spores, `rgba(168,140,100,0.72)`, `8×8dp`, `borderRadius: 4`
- Starting origins spread across hero (not co-located): x at 12–85%, y at 15–75%
- Incommensurate x/y oscillation: swayHalfPeriod 5500–8800ms, y period = swayHalfPeriod × 1.47
- Large oscillation amplitude ≈38–46% of screen width; positions appear random at each fade-in
- Dark gap: `duration × 0.9` between cycles — creates teleport-between-locations illusion
- Fade in 1200ms → hold → fade out 1200ms

## ✅ Mega — COMPLETE
- 6 SVG-masked ROYGBIV gradient layers at 0°/60°/120°/180°/240°/300° angles
- Each layer: `<SvgImage>` inside `<Mask>` with `FeGaussianBlur stdDeviation=32` for feathered edges
- Layer opacity cycles independently at incommensurate durations (4200–7300ms), staggered delays
- Peak opacity 0.92, fully transparent between pulses, fast fade-out (25% of cycle)
- Dark navy base shadow (1.01×, `#1a1a2e`) + tight black contrast mask above aura (1.015×, `rgba(0,0,0,0.85)`)
- On mount: `Image.prefetch(artworkUrl)` fires once; all 6 SVG layers hidden behind `imageReady` state until prefetch resolves — prevents 6× independent cold-decode of the artwork via react-native-svg
- `fadeInOpacity` shared value animates 0→1 over 400ms when `imageReady` flips — prevents pop-in when layers appear
- `megaGradRot` drives initial container fade-in (0→1 over 800ms on first mount)
- SVG canvas 2.0× artwork (560dp); all 6 SVGs separate Animated.View wrappers for GPU-composited opacity
- Mounts at 1100ms after navigation (gated by `particlesReady` in detail screen) to avoid reconciliation spike during stat bar animations; fully visible ~1500ms after navigation
- Full spec: `docs/MEGA_AURA_GRADIENT_SPEC.md`

## ⏳ Pending Backdrops

| Backdrop | Particle concept | Motion direction |
|---|---|---|
| psychic | Slow-orbiting light orbs | Gentle circular float |
| ghost | Wispy motes / fog fragments | Slow horizontal drift, fade in/out |
| dark | Shadow wisps | Slow horizontal drift, very low opacity |
| dragon | Swirling energy orbs | Slow upward spiral |
| steel | Metallic glint flecks | Slow fall, brief flash opacity |
| poison | Spore motes / small bubbles | Upward drift, very subtle |
| normal | Faint dust motes | Very slow fall, barely visible |
| ground | Golden dust particles | Slow upward drift, low opacity |
| rock | — | Skip — falling debris feels aggressive |
| fighting | — | Skip — no natural particle match |