# STATICKÝ AUDIT – FAKE VISUAL SYSTEMS (30 Hz → 10 Hz kandidáti)

**Dátum:** 2026-03-25  
**Účel:** Identifikovať systémy bežiace na 30 Hz visual lane, ktoré NEKRESLIA nič, ale len počítajú dáta pre iné systémy.

---

## SUMMARY

**Nájdené systémy:** 9 z audítovaných súborov  
**Compute-only systémy:** 6 (kandidáti na presun do 10 Hz)  
**Skutočné vizuálne systémy:** 1  
**Utility/Setup:** 2

---

## 1. CONFIRMED COMPUTE-ONLY SYSTEMS

### 1.1 LinkSemanticMetricsBridge_v1.js
**Status:** ❌ NO VISUAL OUTPUT  
**Lane:** visual (30 Hz)  
**Kategória:** Bridge/Adapter

**Čo robí:**
- Prepojuje semantic systém s metrikami
- Zapisuje do `node.userData.metrics` (harmony, synergy, corruption, stability)
- Normalizuje hodnoty

**Pattern:**
- ❌ Žiadne `scene.add()`
- ❌ Žiadne THREE.mesh / THREE.geometry / THREE.material
- ✅ Zapisuje len do `node.userData.metrics`
- ✅ Slúži ako input pre iné systémy

**Kandidát na presun:** ✅ ÁNO → 10 Hz

---

### 1.2 CascadeEventBridge_v1.js
**Status:** ❌ NO VISUAL OUTPUT  
**Lane:** visual (30 Hz)  
**Kategória:** Bridge/Adapter

**Čo robí:**
- Prekladá eventy medzi Cascade Wave a inými systémami
- Distribuuje udalosti (cascade, resonance, wave)
- Spúšťa callbacky

**Pattern:**
- ❌ Žiadne vizuálne objekty
- ❌ Žiadne scene.add()
- ✅ Čisté event routing
- ✅ Spúšťa vizuálne efekty v iných systémoch

**Kandidát na presun:** ✅ ÁNO → 10 Hz (alebo nižšie, event-driven)

---

### 1.3 SynapticGatingAdapter_v1.js
**Status:** ❌ NO VISUAL OUTPUT  
**Lane:** visual (30 Hz)  
**Kategória:** State Computation

**Čo robí:**
- Počíta `gateStrength` pre každý node [-1.0, +1.0]
- Založené na harmony, corruption, instability
- Vráti amplification/dampening multipliers
- Poskytuje halo response parametre

**Pattern:**
- ❌ Žiadne vizuálne objekty
- ❌ Žiadne scene.add()
- ✅ Zapisuje do `node.userData.synapticGateStrength`
- ✅ Poskytuje modulation dáta pre vizuálne systémy
- ✅ Workload capping (maxNodesPerTick: 120)

**Kandidát na presun:** ✅ ÁNO → 10 Hz
- Gate computation môže bežať na nižšej frekvencii
- Vizualizácia používá výsledky s lagom je OK

---

### 1.4 SynapticFatigueAdapter_v1.js
**Status:** ❌ NO VISUAL OUTPUT  
**Lane:** visual (30 Hz)  
**Kategória:** State Tracking

**Čo robí:**
- Sleduje fatigue stav pre každý node [0.0, 1.0]
- Accumulates fatigue z gating aktivity
- Decay fatigue počas rest period
- Poskytuje visual modulation parametre

**Pattern:**
- ❌ Žiadne vizuálne objekty
- ❌ Žiadne scene.add()
- ✅ Zapisuje do `node.userData.synapticFatigue`, `synapticFatigueLevel`
- ✅ Workload capping (maxNodesPerTick: 120)
- ✅ Relief pulse je len koncept, nie vizuál

**Kandidát na presun:** ✅ ÁNO → 10 Hz
- Fatigue accumulation/decay môže byť menej frekventovaný
- Vizuálne systémy používajú výsledky s lagom je OK

---

### 1.5 SynapticSpecializationAdapter_v1.js
**Status:** ❌ NO VISUAL OUTPUT  
**Lane:** visual (30 Hz)  
**Kategória:** State Tracking/Learning

**Čo robí:**
- Sleduje `synapticBias` pre každý node [-1.0, +1.0]
- Učí sa z gating behavioru (excitatory/inhibitory/neutral)
- Poskytuje visual modulation parametre

**Pattern:**
- ❌ Žiadne vizuálne objekty
- ❌ Žiadne scene.add()
- ✅ Zapisuje do `node.userData.synapticBias`, `synapticSpecialization`
- ✅ Veľmi pomalé learning (learningRate: 0.05)
- ✅ Smooth decay toward neutral

**Kandidát na presun:** ✅ ÁNO → 10 Hz (alebo nižšie)
- Learning je aj tak veľmi pomalý
- Specialization sa mení postupne, lag je OK

---

### 1.6 HarmonyStabilizationIntegrationPatch_v1.js
**Status:** ⚠️ NOT A RUNTIME SYSTEM  
**Lane:** N/A (setup/patch)  
**Kategória:** Integration

**Čo robí:**
- Statické metódy pre patchovanie AINodes
- Setup harmony system
- Vytvára convenience methods

**Pattern:**
- ❌ Neregistrované v FrameScheduler
- ⚠️ Setup kód, nie runtime
- ✅ Statické helpery

**Kandidát na presun:** NIE (nie je runtime systém)

---

## 2. TRUE VISUAL SYSTEMS (KEEP AT 30 Hz)

### 2.1 LinkMicroImpulseAdapter_v1.js
**Status:** ✅ CREATES VISUALS  
**Lane:** visual (30 Hz)  
**Kategória:** Visual FX System

**Čo robí:**
- Event-driven micro-impulses na linkoch
- Spawns: THREE.Line, THREE.Points
- Používa cached geometries a materials
- Scene.add(visual) pre každý impulse

**Pattern:**
- ✅ ImpulseFactory s geometries a materials
- ✅ scene.add(visual) v spawn()
- ✅ ImpulseManager sleduje aktívne impulses
- ✅ Fade out a expiring v update()

**Kandidát na presun:** ❌ NIE → ZOSTAŤ na 30 Hz
- Skutočne vytvára vizuálne objekty
- Vyžaduje 30 Hz pre smooth fade out

---

## 3. UTILITY/SETUP FILES

### 3.1 SemanticMetricAdapter.js
**Status:** 📚 UTILITY LIBRARY  
**Lane:** N/A (utility)  
**Kategória:** Helper Functions

**Pattern:**
- Poskytuje utility functions
- Nie je scheduler systém
- Používané inými systémami

**Kandidát na presun:** NIE (nie je runtime systém)

---

### 3.2 T2_HarmonyVisualConsumer_v1.js
**Status:** 🗄️ ARCHIVED/LEGACY  
**Lane:** N/A (archived)  
**Kategória:** Deprecated System

**Pattern:**
- V `src/legacy/`
- Starý systém, nie je aktívny

**Kandidát na presun:** NIE (nie je aktívny)

---

## 4. PATTERNY PRE IDENTIFIKÁCIU

### 4.1 Spoločné znaky compute-only systémov:

1. **Žiadne vizuálne objekty:**
   - ❌ scene.add()
   - ❌ THREE.Mesh / THREE.Line / THREE.Points
   - ❌ THREE.Geometry / THREE.BufferGeometry
   - ❌ THREE.Material / THREE.ShaderMaterial

2. **Len zapisovanie do userData:**
   - ✅ node.userData.*
   - ✅ link.userData.*
   - ✅ Maps pre internal tracking

3. **Adapter/Bridge názvy:**
   - *Adapter_v1.js
   - *Bridge_v1.js
   - *Patch_v1.js

4. **Výstup pre iné systémy:**
   - Modulation parameters
   - State flags
   - Multipliers
   - Threshold values

---

## 5. DOPORUČENIE

### 5.1 Kandidáti na presun do 10 Hz:

1. **LinkSemanticMetricsBridge_v1.js** - 30 Hz → 10 Hz
2. **CascadeEventBridge_v1.js** - 30 Hz → 10 Hz (alebo event-driven)
3. **SynapticGatingAdapter_v1.js** - 30 Hz → 10 Hz
4. **SynapticFatigueAdapter_v1.js** - 30 Hz → 10 Hz
5. **SynapticSpecializationAdapter_v1.js** - 30 Hz → 5 Hz (learning je veľmi pomalé)

### 5.2 Očakávaný výkonový zisk:

- **Zníženie volaní:** ~6 systémov × 20 Hz redukcia = 120 volaní/sekundu
- **CPU time:** Menšie, ale systematické zlepšenie
- **Impact:** Minimalný pre vizuálny výstup (lag je prijatelný)

### 5.3 Riziká:

- **Synaptic gating vizualizácia:** Ak vizuálne systémy používajú gateStrength v real-time, môže byť viditeľný lag
- **Fatigue decay:** Môže byť menej responsive, ale to je pravdepodobne žiaduce
- **Specialization learning:** Nie je problém, learning je aj tak pomalý

---

## 6. IMPLEMENTAČNÝ PLÁN

### 6.1 Bezpečný prístup:

1. **Vytvoriť novú kategóriu v FrameScheduler:**
   - `'dataComputation'` lane na 10 Hz
   - Medzi `'simulation'` (10 Hz) a `'visual'` (30 Hz)

2. **Presunúť systémy:**
   - LinkSemanticMetricsBridge_v1 → dataComputation lane
   - CascadeEventBridge_v1 → dataComputation lane
   - SynapticGatingAdapter_v1 → dataComputation lane
   - SynapticFatigueAdapter_v1 → dataComputation lane
   - SynapticSpecializationAdapter_v1 → dataComputation lane

3. **Testovanie:**
   - Overiť, že vizuálne systémy stále fungujú
   - Skontrolovať, či nie sú viditeľné lags
   - Monitorovať performance

### 6.2 Alternatívny prístup (event-driven):

Pre CascadeEventBridge_v1:
- Zmeniť z 30 Hz loop na event-driven
- Len reagovať na udalosti, nepravidelne
- Maximálny performance gain

---

## 7. ZÁVER

**Nájdených:** 5 systémov, ktoré môžu byť presunuté do 10 Hz  
**Očakávaný benefit:** Systematické zníženie CPU workloadu bez viditeľného dopadu na vizuálnu kvalitu

**Dôležité:**
- Tieto systémy sú čisto compute-only
- Poskytujú dáta pre iné systémy
- Lag v výstupoch je prijateľný
- Presun je bezpečný

---

## 8. POUŽITIE

Tento audit môže byť použitý ako:
1. Plán pre optimalizáciu FrameScheduler
2. Dokumentácia pre budúci audit
3. Základ pre rozhodnutie o presune systémov

**Autor:** AI Auditor  
**Review:** Human (pending)
