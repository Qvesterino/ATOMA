# AUDIT: Efekty spawnované na pozícii 0,0,0 (stred mapy)

**Dátum:** 2026-04-12
**Cieľ:** Zistiť ktoré efekty sa aktívne spawnujú na strednej pozícii mapy (0,0,0)

---

## SÚHRN

- **Celkovo nájdených pozícií (0,0,0):** 28
- **Aktívne spustiteľné efekty na (0,0,0):** 5
- **Fallback/default inicializácie:** 16
- **Blokované/sprievodné objekty:** 7

---

## 1. AKTÍVNE SPAWNOVANÉ EFEKTY NA (0,0,0)

### 1.1 DreamDesert - Glow efekt pre krystály
**Súbor:** `DreamDesert.js:1082`
```javascript
glow.position.set(0, 0, 0);
```
- **Typ:** Glow efekt pre krystálové formácie
- **Kontext:** Vytvára sa v `createCrystallineFormations()`
- **Aktívny spawn:** ÁNO - spúšťa sa pri načítaní DreamDesert mapy
- **Dopad:** Vizuálny glow efekt na strednej pozícii

### 1.2 DreamDesert2 - Svetelný cieľ
**Súbor:** `DreamDesert2.js:1580, 3022`
```javascript
this.sunLight.target.position.set(0, 0, 0);
```
- **Typ:** DirectionalLight target
- **Kontext:** Nastavenie cieľa svetla na stred mapy
- **Aktívny spawn:** ÁNO - svetelný cieľ je fixne na (0,0,0)
- **Dopad:** Osvetlenie zamerané na stred mapy

### 1.3 QuantumIsland - Singularity particle systém
**Súbor:** `QuantumIsland.js:272`
```javascript
points.position.set(0, 0, 0);
```
- **Typ:** Particle systém pre singularity efekt
- **Kontext:** Vytvára sa v `createSingularityParticles()`
- **Aktívny spawn:** ÁNO - particle systém na strednej pozícii
- **Dopad:** Vizuálny efekt singularity na strednom bode ostrova

### 1.4 _SafeLegendaryWorldEvents - Core efekt
**Súbor:** `_SafeLegendaryWorldEvents.js:858`
```javascript
core.position.set(0, 0, 0);
```
- **Typ:** Core efekt pre legendary world events
- **Kontext:** Spúšťa sa pri legendary eventoch
- **Aktívny spawn:** ÁNO - pri aktivácii legendary event
- **Dopad:** Vizuálny efekt v strede mapy počas eventov

### 1.5 EvolutionRegistry - Evolučné efekty
**Súbor:** `EvolutionRegistry.js:383, 453, 617`
```javascript
overlays.glowMesh.position.set(0, 0, 0);  // line 383
ring.position.set(0, 0, 0);                // line 453
burst.position.set(0, 0, 0);                // line 617
```
- **Typ:** Evolučné vizuálne efekty (glow, ring, burst)
- **Kontext:** Spúšťa sa pri evolúcii uzlov
- **Aktívny spawn:** ÁNO - pri evolúcii
- **Dopad:** Vizuálne efekty na strednej pozícii počas evolúcií

---

## 2. FALLBACK/DEFAULT INICIALIZÁCIE (nie aktívne spawny)

Tieto pozície sú použité ako:
- Default hodnoty pre funkčné parametre
- Fallback pozície pri neúspešnom získaní skutočnej pozície
- Inicializačné hodnoty pre dummy objekty

### 2.1 VFX systémy
- `HealingParticleSystem_Session136.js:395` - Debug kocka (len pre debug)
- `T2_CorruptionVisualIntegration_v1.js:121` - Skrytá pozícia častíc (interná)
- `CascadeParticleSystem_Session120.js:1284` - Fallback pozícia pre trail častice
- `SynergyVFX1_0.js:177` - Počiatočná rýchlosť častíc (neje pozícia)

### 2.2 Wave systémy
- `WaveDynamicsShaderPack_v1.js:420` - Wave center uniform (shader parameter)
- `WaveShaderBridge_v1.js:622` - Wave center shader uniform
- `ResonanceCascadeVisualization_Session117B.js:494` - Fallback pozícia

### 2.3 Movement bounds (nie efekty)
- `World.js:195` - Stred mapy pre movement bounds
- `DreamDesert2.js:244` - Stred mapy pre bounds
- `SigmaRiftChamber.js:877` - Stred komory
- `QuantumIsland.js:184` - Stred ostrova
- `FractalValley.js:338` - Stred údolia

### 2.4 Inicializačné dummy objekty
- `NodeHoverRingSystem.js:134` - Instanced mesh pre hover ring
- `_NodeVisuals4_0.js:301` - Overlay group pozícia
- `shaders/NodeSegmentedOrbitRings.js:276` - Instanced mesh init
- `HarmonicTopologyLearningSystem.js:114,124,228` - Vektorové inicializácie

### 2.5 Fallback pre spawn
- `SafeQuantumIllusionsPack1.js:1181,1286` - Fallback pozícia keď camera.position nie je dostupná

### 2.6 Debug a vývojové nástroje
- `NodeEditor.js:103,155` - Default pozície pre debug marker a node

---

## 3. BLOKOVANÉ/SPRÍVODNÉ OBJEKTY

### 3.1 CorruptionVisualFX - Blokovanie origin spawnu
**Súbor:** `CorruptionVisualFX_v1.js:701-703`
```javascript
// BLOKOVANIE origin spawn na (0,0,0) - guard proti spawnom na stred
```
- **Typ:** Guard/Blokovanie
- **Kontext:** Aktívne bráni spawnom na pozíciu (0,0,0)
- **Stav:** BLOKOVANÉ - nie je to efekt ale ochrana

### 3.2 CascadingRuptureSystem - Reset pozície
**Súbor:** `CascadingRuptureSystem.js:94`
```javascript
this.position.set(0, 0, 0);
```
- **Typ:** Reset pozície systému
- **Kontext:** Interný reset, nie vizuálny efekt na mape

### 3.3 SafeQuantumIllusionsPack1 - Silueta efekt
**Súbor:** `SafeQuantumIllusionsPack1.js:1337`
```javascript
silhouette.position.set(0, 0, 0);
```
- **Typ:** Silueta efekt
- **Kontext:** Inicializačná pozícia, presúva sa podľa logiky

### 3.4 AINodes - Point light
**Súbor:** `AINodes.js:2338`
```javascript
light.position.set(0, 0, 0);
```
- **Typ:** Point light pre aktivované uzly
- **Kontext:** Inicializačná pozícia, light sa presúva na pozíciu uzla

### 3.5 NodeLinkingSystem - Node pozícia
**Súbor:** `NodeLinkingSystem.js:8796`
```javascript
node.position.set(0, 0, 0);
```
- **Typ:** Reset pozície uzla
- **Kontext:** Interná operácia, nie efekt na mape

---

## 4. ROZDELENIE PODĽA MAP

### 4.1 DreamDesert
- Glow efekt pre krystály na (0,0,0)
- **Dopad:** Stredný vizuálny anchor

### 4.2 DreamDesert2
- SunLight target na (0,0,0)
- Stred mapy pre movement bounds
- **Dopad:** Osvetlenie orientované na stred

### 4.3 QuantumIsland
- Singularity particle systém na (0,0,0)
- Stred ostrova pre bounds
- **Dopad:** Centrálny vizuálny efekt

### 4.4 SigmaRiftChamber
- Stred komory pre bounds
- **Dopad:** Žiadny vizuálny efekt, len bounds

### 4.5 FractalValley
- Stred údolia pre bounds
- **Dopad:** Žiadny vizuálny efekt, len bounds

### 4.6 World (default)
- Stred mapy pre movement bounds
- **Dopad:** Žiadny vizuálny efekt, len bounds

---

## 5. POZNÁMKY

### 5.1 Bezpečnostné opatrenia
- `CorruptionVisualFX_v1.js` obsahuje aktívny guard proti spawnom na (0,0,0)
- To naznačuje že spawn na strednej pozícii môže byť problematický

### 5.2 Dizajnové rozhodnutia
- Väčšina map má stred (0,0,0) definovaný pre movement bounds
- Niektoré mapy používajú (0,0,0) ako vizuálny anchor pre centrálny efekt
- DreamDesert2 má svetlo zamerané na stred

### 5.3 Výkonnostné dopady
- Aktívne efekty na (0,0,0) môžu vytvárať vizuálny rušivý element v strede mapy
- Singularity particle systém v QuantumIsland je zámerne stredový efekt

---

## 6. RECOMMENDÁCIE

1. **Audit stredových efektov:** Zvážiť či všetky 5 aktívnych efektov na (0,0,0) sú zámerne
2. **Konzistencia:** Niektoré mapy majú stredový efekt, iné nie - zvážiť jednotný prístup
3. **Performance:** Ak stredové efekty spôsobujú problémy, možno ich presunúť alebo odstrániť
4. **Documentation:** Documentovať zámer použitia stredovej pozície v každej mape

---

**Kľúčové zistenie:** Iba 5 efektov sa aktívne spúšťa na pozícii (0,0,0) počas behu hry. Väčšina výskytov (16) sú fallback/default inicializácie, nie skutočné spawnované efekty.
