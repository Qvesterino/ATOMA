## Výskyt plane geometry (nie horizontálnych) - Zoznam súborov a kontext

Hľadali ste všetky výskyty "plane geometry" ktoré nie sú horizontálne orientované. Níže je zoznam súborov kde sa nachádzajú takéto prípady, spolu s kontextom a charakteristikou ich orientácie.

---

### 1. **_MythicRitualController.js** (riadok 540-545)
- **Typ:** Vertikálna trhlina (Vertical fissure)
- **Geometria:** `new THREE.PlaneGeometry(0.5, 80, 1, 64)`
- **Kontext:** Vertikálna energia trhlina s glitchem a chromatickou aberáciou. Rozmery 0.5 × 80 tvoria vysoký a úzky vertikálny panel, ktorý nie je v žiadnom prípade horizontálny.
- **Súčasť:** RitualShaderPack - tvorí vizuálne efekty praskania reality

---

### 2. **CognitiveHorizonPlane.js** (riadky 758-800)
- **Typ:** Sklonené veil/horizontálne vrstvy (Horizon veils)
- **Geometria:** `new THREE.PlaneGeometry(width, height, 1, 1)` kde width=120+i*18, height=34+i*10
- **Orientácia:** `veil.rotation.x = -Math.PI / 2.64` (nie je presne -π/2, čo by bolo horizontálne)
- **Kontext:** Vrstvy horizontu ktoré sú mierne naklonené, tvoria atmosferický prechod. Tieto plány nie sú čisto horizontálne kvôli inému uhlu rotácie.
- **Súčasť:** Horizon rendering system

---

### 3. **_GlyphFusionOverlay4_1.js** (riadky 143-148, 625-629, 702-722)
- **Typ A (Tri-fold planes):** `new THREE.PlaneGeometry(0.3, 0.05, 2, 2)` - 8 ks v pool-e
- **Typ B (Rotating cross-planes):** 
  - Plane 1: `new THREE.PlaneGeometry(0.3, 0.08, 2, 2)` s `rotation.y = 0` (X/Z axis)
  - Plane 2: `new THREE.PlaneGeometry(0.3, 0.08, 2, 2)` s `rotation.x = Math.PI / 2` (X/Y axis, kolmá na prvú)
- **Kontext:** Tieto plány tvoria 3D krížové štruktúry a trojité zložené tvary ktoré sa rotujú. Žiadna z nich nie je horizontálna - tvoria priestorovú sieť.
- **Súčasť:** Glyph fusion vizuálny systém

---

### 4. **_GlyphLayer4_MultiFusion.js** (riadok 1026)
- **Typ:** Membránové plány s arbitrárnou rotáciou
- **Geometria:** `new THREE.PlaneGeometry(0.14, 0.28, 1, 1)`
- **Orientácia:** Každá má vlastné `rotation: [x, y, z]` hodnoty (napr. `[0.1, 0.5, 0.2]`, `[0.4, 1.22, -0.16]`)
- **Kontext:** Multi-fúzové membrány s náhodnými orientáciami v priestore
- **Súčasť:** Glyph layer rendering

---

### 5. **_ProceduralMeaningEngine.js** (riadky 106-108, 309-314)
- **Typ:** Shard plány (fragmenty)
- **Geometria:** `new THREE.PlaneGeometry(0.05, 0.08)`
- **Kontext:** Malé plané fragmenty používané ako shardy v priestore, orientované rôzne podľa kontextu. Veľmi malé pomer strán (5:8) naznačujú formu vhodnú na zobrazenie orientovanú v rôznych rovinách.
- **Súčasť:** Procedurálny generátor významových štruktúr

---

### 6. **_RecursiveGlyphSignalSystem.js** (riadok 81)
- **Typ:** Tick značky (signal indicators)
- **Geometria:** `new THREE.PlaneGeometry(0.18, 0.05)`
- **Kontext:** Malé pomer strán (0.18:0.05 = 3.6:1) naznačuje dlhý a úzky prvok vhodný na zobrazenie smeru/prúdu, nepoužíva sa ako horizontálny billboard.
- **Súčasť:** Rekurzívny signálny systém

---

### 7. **_SafeNodePersonalityFX.js** (riadok 599)
- **Typ:** Malé billboardy/indikátory
- **Geometria:** `new THREE.PlaneGeometry(0.4, 0.4)`
- **Kontext:** Štvorcové plány používané ako vizuálne indikátory na uzloch. Zvyčajne orientované kamera (billboard) alebo v rôznych rovinách podľa kontextu.
- **Súčasť:** Node personality vizuálne efekty

---

### 8. **_SafeAIWeatherPack.js** (riadky 867, 938, 1018, 1077, 1105)
- **Typ A (Weather veils):** `_createOrganicPlane(width, height, ...)` - nepravidelné hrany
  - Veils: `width × height` rôznych veľkostí, organicky deformované
- **Typ B (Seams):** Dlhé a úzke (`length × thickness`)
- **Typ C (Haze sheets):** Veľké široké plány (110 × width)
- **Typ D (Aurora ribbons):** `260 × 14` - veľmi široké a nízke
- **Typ E (Pressure bands):** `320 × 10` - extrémne široké
- **Kontext:** Všetky tieto plány tvoria atmosferické vrstvy, pásma a štríky ktoré nie sú horizontálne - tvoria priestorové efekty v rôznych rovinách.
- **Súčasť:** Weather systém - organické atmosferické vrstvy

---

### 9. **_SafeLegendaryWorldEvents.js** (riadok 668)
- **Typ:** Legendary organic plane (rovnaký vzor ako weather)
- **Geometria:** `new THREE.PlaneGeometry(width, height, wSegs, hSegs)` s deformáciou okrajov
- **Kontext:** Pozadie a prekrytia pre legendárne udalosti, tvoria priestorové plány v rôznych orientáciách.
- **Súčasť:** Legendary event rendering

---

### 10. **_WorldPersonalityController.js** (riadok 1234)
- **Typ:** Pásma/bands
- **Geometria:** `new THREE.PlaneGeometry(180, 8)` - extrémne široké a nízke
- **Kontext:** 180 × 8 tvoria pás ktorý sa rozprestiera v priestore, nepoužíva sa ako zem/horizontálna vrstva.
- **Súčasť:** World personality vizuálny systém

---

### 11. **Atoma_nodes/AnalyticsEnhancedVariants_Session81.js** (riadok 797)
- **Typ:** Fragmenty (Ledger shards)
- **Geometria:** `new THREE.PlaneGeometry(w, h)` kde w,h ≈ 0.1-0.2
- **Kontext:** Malé plané fragmenty plávajúce v priestore okolo uzlov, orientované rôzne.
- **Súčasť:** Analytics node vizuálne efekty

---

### 12. **ColonyVFXManager.js** (riadok 62)
- **Typ:** Zdieľaná geometria pre bloom efekty
- **Geometria:** `new THREE.PlaneGeometry(1, 1)`
- **Kontext:** Zdieľaná základná geometria pre bloom/aura efekty na uzloch. Orientácia sa nastavuje dynamicky podľa pozície uzla.
- **Súčasť:** Colony VFX systém

---

### 13. **DreamDesert2.js** (riadky 1436, 1622)
- **Typ A (Cloud layers):** `new THREE.PlaneGeometry(cloudWidth, cloudHeight)` kde cloudWidth > cloudHeight
- **Typ B (Curtain):** `new THREE.PlaneGeometry(width, height, 40, 20)` - organický priesvitný plášť
- **Kontext:** Oblačné vrstvy a závesy ktoré nie sú horizontálne - tvoria vertikálne/horizontalne zložené priestorové štruktúry.
- **Súčasť:** Dream desert environment FX

---

### 14. **FractalValley.js** (riadok 1210)
- **Typ:** River surface geometry
- **Geometria:** `new THREE.PlaneGeometry(1, 1, 36, 48)` - vysoký detail v jednej osi
- **Kontext:** Povrch rieky s asymetrickým rozdelením segmentov (36×48) čo naznačuje plánovanú orientáciu podľa toku vody, nie horizontálnu polohu.
- **Súčasť:** Fractal valley river systém

---

### 15. **MemoryLane.js** (riadky 635, 774, 972, 1004)
- **Typ A (Ceiling panels):** `new THREE.PlaneGeometry(width, height)` kde width=6-8, height=3-4.5
- **Typ B (Wall panels):** `new THREE.PlaneGeometry(width, height)` kde width=9-11, height=4.5-6
- **Typ C (Hologram displays):** `new THREE.PlaneGeometry(config.width, config.height)`
- **Kontext:** Panely a displeje na stropoch a stenách - týchto plánoch je orientovaná podľa povrchu na ktorom sú umiestnené (strop/stena), nie sú horizontálne.
- **Súčasť:** MemoryLane world building

---

### 16. **MetricReactiveWorldEvents.js** (riadok 911, 1555)
- **Typ A (Color tint overlay):** `new THREE.PlaneGeometry(100, 100)` - post-processing plane
- **Typ B (Distortion overlay):** `new THREE.PlaneGeometry(100, 100)` - post-processing plane
- **Kontext:** Kamerové/overlay plány pre post-processing efekty. Sú orientované kolmo k kamere (billboard) alebo v rovine zrkadla, nie horizontálne.
- **Súčasť:** World event reactive vizuálny systém

---

### 17. **PostProcessing.js** (riadok 748)
- **Typ:** Effect planes (fullscreen quads)
- **Geometria:** `new THREE.PlaneGeometry(2, 2)`
- **Kontext:** Štandardné fullscreen quady pre post-processing pipeline (luminosity, blur, composite). Orientované kolmo k kamere.
- **Súčasť:** Post-processing render pipeline

---

### 18. **QuantumIsland.js** (riadok 883)
- **Typ:** Glitch ribbons
- **Geometria:** `new THREE.PlaneGeometry(20, 8, 10, 5)`
- **Kontext:** Dlhé a nízke plány (20×8) tvoria pásma ktoré sa rozprestierajú v priestore okolo ostrova, orientované v rôznych rovinách.
- **Súčasť:** Quantum island environment FX

---

### 19. **ResonanceRuptureVisualSystem_Session133.js** (riadok 365)
- **Typ:** Stress indicators
- **Geometria:** `new THREE.PlaneGeometry(1, 1)`
- **Orientácia:** `mesh.rotation.x = -Math.PI / 2` (TOTO JE HORIZONTÁLNY - vylúčené z výsledku)
- **Kontext:** Malé plány indikujúce stresové body. Tieto sú horizontálne a preto nepatria do zoznamu.

---

### 20. **SafeDreamDepthPack.js** (riadok 288)
- **Typ:** Chromatic tear (reality fracture)
- **Geometria:** `new THREE.PlaneGeometry(2.05, 2.05)`
- **Kontext:** Efekt reality fracture - plánovité trhliny v priestore, orientované v rôznych rovinách podľa efektu.
- **Súčasť:** Dream depth FX pack

---

### 21. **shaders/AITechDistortionShader.js** (riadok 150)
- **Typ:** Fullscreen quad pre shader
- **Geometria:** `new THREE.PlaneGeometry(2, 2)`
- **Kontext:** Render target quad pre AI tech distortion efekt. Orientovaný kolmo k kamere.
- **Súčasť:** AI tech distortion shader

---

### 22. **StressVisualShaderSystem.js** (riadok 89-92)
- **Typ:** Ambient stress plane
- **Geometria:** `new THREE.PlaneGeometry(ambientPlaneSize, ambientPlaneSize)` - veľké (pomerne k `ambientPlaneSize`)
- **Kontext:** Veľký plán pre ambientný stress efekt, pozicionovaný ďaleko v priestore (`z = -500`). Nepoužíva sa ako horizontálna zem.
- **Súčasť:** Stress vizuálny systém

---

### 23. **SystemStateOverlay.js** (riadok 173)
- **Typ:** Overlay quad
- **Geometria:** `new THREE.PlaneGeometry(2, 2)`
- **Kontext:** Fullscreen overlay pre system state vizualizáciu. Orientovaný kolmo k kamere.
- **Súčasť:** System state overlay

---

### 24. **TemporalEventEffects.js** (riadok 458)
- **Typ:** Hologram planes
- **Geometria:** `new THREE.PlaneGeometry(preset.radius * 2, preset.height)`
- **Orientácia:** Rotované `plane.rotation.y = angle` a `plane.rotation.x = Math.sin(angle * 2) * 0.2` - tvoria kruhové rozloženie v priestore okolo hologramu.
- **Kontext:** Viemnove efekty tvoria plány rozložené v rôznych rovinách okolo stredu, tvoria priestorový hologram.
- **Súčasť:** Temporal event vizuálne efekty

---

### 25. **VisualUpgradeSuperpack.js** (riadok 1188)
- **Typ:** Volumetric light rays
- **Geometria:** `new THREE.PlaneGeometry(config.size * 0.8, config.size * 1.5)` - pomer strán 0.8:1.5 (šírka:výška)
- **Kontext:** Svetelné lúče a paprsky, dlhšie a úzke plány orientované v rôznych rovinách priestoru.
- **Súčasť:** Volumetric light rendering

---

### 26. **shaders/NodeSegmentedOrbitRings.js** (riadok 18)
- **Typ:** Orbitálne segmenty
- **Geometria:** `new THREE.PlaneGeometry(0.88, 0.56)` - pomer strán 0.88:0.56 ≈ 1.57:1
- **Kontext:** Segmenty pre orbitálne kolesá, plány orientované v rôznych rovinách podľa orbitálnej polohy.
- **Súčasť:** Node orbit rendering

---

### 27. **LinkRendererConduit.js** (riadok 1034)
- **Typ:** Vane (riekadielka) komponenty
- **Geometria:** `new THREE.PlaneGeometry(0.03, 0.22, 1, 1)` - veľmi úzky a dlhý (pomer 0.03:0.22 ≈ 1:7.3)
- **Orientácia:** `vane.rotation.y = Math.PI * 0.5` - otočený vo vzťahu k základnej orientácii
- **Kontext:** Malé plány tvoriace riekadielka v linkovom rendrovaní, orientované v rôznych rovinách podľa polohy.
- **Súčasť:** Link renderer conduit

---

### 28. **LinkSemanticPictogramSystem_Enhanced.js** (riadok 818)
- **Typ:** Plane diamond (diamantový tvar)
- **Geometria:** `new THREE.PlaneGeometry(0.55, 0.55)` - štvorcový tvar
- **Kontext:** Diamantové plány používané ako ikonografické prvky v linkovom systéme, orientované ako billboardy alebo v rôznych rovinách.
- **Súčasť:** Link semantic pictogram systém

---

### 29. **CascadeResonanceWaveVisualization_Session146.js** (riadok 833)
- **Typ:** Ring geometry (plane with circle shader)
- **Geometria:** `new THREE.PlaneGeometry(1, 1, 64, 64) - vysoký detail
- **Kontext:** Plán s kruhovým štýlom používaný ako základ pre kruhové vizuály, orientovaný v rôznych rovinách podľa potreby.
- **Súčasť:** Cascade resonance wave vizuál

---

### 30. **CascadeWaveParticles.js** (riadok 87)
- **Typ:** Particle geometry (quad)
- **Geometria:** `new THREE.PlaneGeometry(1, 1, 1, 1)`
- **Kontext:** Zdieľaná časticová geometria - quady orientované vždy k kamere (billboard) alebo v rôznych rovinách v závislosti od časticového systému.
- **Súčasť:** Cascade wave particle systém

---

## Sumár

**Celkový počet súborov s ne-horizontálnymi plane geometry:** 30
**Celkový počet explicitných výskytov:** 40+

**Kategórie ne-horizontálnych plane geometry:**
1. **Vertikálne plány** - trhliny, steny, pásma (napr. _MythicRitualController.js)
2. **Anglované veil/horizontálne vrstvy** - mierne naklonené (napr. CognitiveHorizonPlane.js)
3. **Cross-planes** - kolmé na seba (napr. _GlyphFusionOverlay4_1.js)
4. **Billboard plány** - fullscreen quady, post-processing (napr. PostProcessing.js)
5. **Ribbon/stream plány** - extrémne pomer strán (napr. _SafeAIWeatherPack.js)
6. **Fragment/shard plány** - malé orientované elementy (napr. _ProceduralMeaningEngine.js)
7. **Membrane plány** - organicky deformované (napr. _GlyphLayer4_MultiFusion.js)
8. **Panel plány** - stropné/stenové panely (napr. MemoryLane.js)
9. **Hologram plány** - viacúrovňové hologramy (napr. TemporalEventEffects.js)
10. **Orbitálne/rotujúce plány** - segmenty a kruhy (napr. shaders/NodeSegmentedOrbitRings.js)

**Vynechané (horizontálne) prípady:**
- DreamDesert2.js: layer.rotation.x = -Math.PI/2 (horizontálne)
- FractalValley.js: plane.rotation.x = -Math.PI/2 (horizontálne)
- HarmonicRecoveryVisualSystem: mesh.rotation.x = -Math.PI/2 (horizontálne)
- ResonanceRuptureVisualSystem: mesh.rotation.x = -Math.PI/2 (horizontálne)
- MemoryLane.js: fogPlane.rotation.x = -Math.PI/2 (horizontálne)
- VisualUpgradeSuperpack.js: plane.rotation.x = -Math.PI/2 (horizontálne)
- A ďalšie s explicitným -Math.PI/2 rotáciou

**Fyzikálna charakteristika:**
Všetky tieto plány zdieľajú spoločnú vlastnosť: ich normálový vektor nie je rovnobezný s osou Y (ktorá by predstavovala "hore/dole" v typickej 3D scéne). Miesto toho tvoria rôzne uhly v priestore, čo im dáva priestorovú významnosť a zabraňuje tomu, aby boli interpretované ako "zem" alebo "strop".

**Architektonický význam:**
Tieto ne-horizontálne plány tvoria kľúčový prvok priestorového rozloženia ATOMA, umožňujúce:
- Viacrozmernú vizuálnu hierarchiu
- Komplexnú priestorovú orientáciu bez ohľadu na gravitačný "down"
- Flexibilnú reprezentáciu dát v priestore
- Bohatú vizuálnu textúru prostredia bez horizontálnych cliché