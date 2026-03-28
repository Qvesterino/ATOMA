# ATOMA HARMONY/HARMONIC SYSTEMS AUDIT

## KLASIFIKÁCIA SÚBOROV

### ✅ AKTÍVNE SYSTÉMY (PRODUCTION)

**COMPUTE LAYER (Data Processing):**
1. **HarmonyStabilizationSystem_v1.js** - COMPUTE
   - Primary harmony engine
   - Computes node/link harmony levels
   - Canonical writer: `node.userData.{harmonicPhase, harmonicHub, harmonicResilience, harmonicCollapse, harmonicRecovery, isHarmonyAnchor}`
   - Canonical writer: `link.userData.{harmonicPhase, harmonicHub, ...}`
   - Canonical writer: `haloAmplitude, haloFrequency, pulsePhase, pulseCoherence, pulseStreak`
   - Reduces corruption, creates anchor states
   - OUTPUT: node.userData.metrics.harmony, link.userData.harmonyLevel
   - NAPJENÝ: ✅ Runtime pipeline

2. **NodeHarmonicManager.js** - BRIDGE/COMPUTE
   - Manages sync/collapse/recovery/resilience controllers per node
   - Reads node.userData.metrics, writes to node.harmonicControllers
   - OUTPUT: node.harmonicControllers.* controllers
   - INPUT: harmony, corruption, instability from metrics
   - NAPJENÝ: ✅ Runtime pipeline

**VISUAL LAYER (Rendering):**
3. **HarmonicInfluencePropagationSystem_Session127.js** - VISUAL
   - Adapter-only (reads hub state)
   - INPUT: getNodeCanonicalMetrics(node) → harmony, corruption, stability
   - OUTPUT: scene meshes (aura spheres, flow cylinders)
   - NAPJENÝ: ✅ FrameScheduler visual (30Hz)

4. **HarmonicHubAuraSystem_Session126.js** - VISUAL
   - Creates shared resonance fields between hubs
   - INPUT: node.userData.metrics.harmony/corruption
   - OUTPUT: scene meshes (volumetric icosahedron fields)
   - NAPJENý: ✅ FrameScheduler visual (30Hz)

5. **HarmonicNodeResonanceHalos.js** - VISUAL
   - Node-level halos for harmonic hubs
   - INPUT: node.userData.haloAmplitude, pulsePhase, pulseCoherence (from HarmonyStabilizationSystem)
   - OUTPUT: scene meshes (halo rings)
   - NAPJENÝ: ✅ FrameScheduler visual (30Hz)

6. **HarmonicResonanceFeedbackSystem.js** - VISUAL/BRIDGE
   - Resonance fields from composite glyphs
   - INPUT: fusionZoneManager.compositeGlyphs → harmonyBalance, synergy
   - OUTPUT: link.userData.phase (modifies link oscillations)
   - NAPJENÝ: ✅ FrameScheduler visual (30Hz)

**BRIDGE LAYER (Data Flow):**
7. **HarmonicSyncEffectApplier.js** - BRIDGE
   - Applies harmonic sync to link visuals
   - INPUT: NodeHarmonicManager controllers
   - OUTPUT: link.group.userData.conduitState modifications
   - NAPJENÝ: ✅ Called by NodeHarmonicManager

### 🔴 SESSION FILES (Experimental/Temporary)

1. **HarmonicRecoveryVisualSystem_Session138.js** - VISUAL
2. **HarmonicPhaseSynchronization_Session146.js** - VISUAL
3. **HarmonicCascadeAmplification_Session145.js** - VISUAL
4. **HarmonicAudioReactivitySystem_Session135.js** - VISUAL
5. **HarmonicHealingVisualSystem_Session134.js** - VISUAL

**STATUS:** These are session-specific experiments. Not integrated into main runtime.

### 🔧 INTEGRATION PATCHES

1. **HarmonicHubAuraIntegrationPatch_Session126.js** - BRIDGE
2. **HarmonicInfluencePropagationIntegrationPatch_Session127.js** - BRIDGE
3. **HarmonyStabilizationIntegrationPatch_v1.js** - BRIDGE

**STATUS:** Bridge adapters to wire session systems to main runtime.

### 🎮 CONTROLLERS (Subsystems of NodeHarmonicManager)

1. **NodeHarmonicSyncController.js** - COMPUTE
2. **HarmonicHubCollapseController.js** - COMPUTE
3. **HarmonicHubRecoveryController.js** - COMPUTE
4. **HarmonicHubResilienceController.js** - COMPUTE

**STATUS:** ✅ Active, managed by NodeHarmonicManager

### 🌊 RESONANCE SYSTEMS (Related but not harmonic)

1. **ResonanceEchoTrailSystem.js** - VISUAL
2. **LinkResonanceFlowSystem_Session124.js** - VISUAL
3. **ResonanceRuptureVisualSystem_Session133.js** - VISUAL
4. **CascadeResonanceWaveVisualization_Session146.js** - VISUAL

**STATUS:** Separate cascade/resonance systems, not harmony-specific.

### 🐛 DEBUG/TEST FILES

1. **T4004_HARMONY_HEALING_TEST_RUNNER.js** - DEBUG
2. **HarmonicHubDebugger.js** - DEBUG

**STATUS:** Test infrastructure, not production.

### 📄 DOCUMENTATION

1. **HARMONY_DATA_FLOW_ANALYSIS.md**
2. **HARMONY_INJECTION_REPORT.md**
3. **HARMONY_SYSTEM_ACTIVATION_AUDIT.md**
4. **docs/MAPY/DATAFLOW harmonic propagation.md**

---

## DATA FLOW MAPA

### PREHĽADNÁ SCHÉMA

```mermaid
flowchart LR
   MR[MetricsRuntime / NodeMetricEngine] --> NM[node.userData.metrics\n harmony / synergy / stability / corruption]

   NM --> LCT[LinkCorruptionTransmission_v1]
   LCT --> HS[HarmonyStabilizationSystem_v1]
   HS --> NHM[NodeHarmonicManager]

   HS -->|canonical writes| NUD[node.userData\n harmonicPhase / harmonicHub / harmonicRecovery]
   HS -->|canonical writes| LUD[link.userData\n harmonicPhase / harmonicHub / harmonyLevel]
   HS -->|canonical writes| HPM[node halo / pulse metrics]

   NUD --> HNRS[HarmonicNodeResonanceHalos]
   NUD --> HIP[HarmonicInfluencePropagationSystem]
   NUD --> HHA[HarmonicHubAuraSystem]
   HPM --> HNRS
   HNRS --> V1[THREE.Mesh / halo visuals]
   HIP --> V2[THREE.Mesh / flow visuals]
   HHA --> V3[THREE.Mesh / hub field visuals]

   SW[StandingWaveTrap + Reflection state] --> RRV[ResonanceRuptureVisualSystem_Session133]
   RRV -->|cascade.triggered / hop / completed| CER[CascadingRuptureSystem]
   CER --> CP[CascadeParticleSystem / cascade visuals]
   RRV --> RS[resonanceScars]
   RS --> HRV[HarmonicRecoveryVisualSystem_Session138]
   HRV --> HP[HealingParticleSystem_Session136]
   HP --> HHV[HarmonicHealingVisualSystem_Session134]
   HHV -->|emitHealingTrail()| HP
   HHV -->|optional gameplay write| CORR[node.corruption / link.stability]

   T4[T4004_HARMONY_HEALING_TEST_RUNNER] -. seed / validate / report .-> HS
   T4 -. seed corruption / harmony source .-> NM
   T4 -. console diagnostics .-> CER

   classDef core fill:#18324a,stroke:#7cc7ff,color:#ffffff;
   classDef visual fill:#24361f,stroke:#9fe870,color:#ffffff;
   classDef rupture fill:#4a1f26,stroke:#ff8a7a,color:#ffffff;
   classDef debug fill:#4a3a1f,stroke:#ffd37a,color:#ffffff;

   class MR,NM,LCT,HS,NHM,NUD,LUD,HPM core;
   class HNRS,HIP,HHA,V1,V2,V3,CP,HRV,HP,HHV visual;
   class SW,RRV,CER,RS,CORR rupture;
   class T4 debug;
```

### PRIMARY DATA PATH:
```
MetricsRuntime / NodeMetricEngine
    ↓
node.userData.metrics.{harmony, synergy, stability, corruption}
    ↓
HarmonyStabilizationSystem_v1
    ↓ (canonical writes)
node.userData.{harmonicPhase, harmonicHub, harmonicResilience, ...}
link.userData.{harmonicPhase, harmonicHub, ...}
node.userData.{haloAmplitude, haloFrequency, pulsePhase, ...}
    ↓
NodeHarmonicManager (reads metrics, updates controllers)
    ↓
HarmonicNodeResonanceHalos (reads halo/pulse metrics)
    ↓
THREE.Mesh visual output
```

### SECONDARY PATH (Hubs):
```
HarmonicHubAuraSystem_Session126
    ↓ (reads node.userData.metrics.harmony)
HarmonicInfluencePropagationSystem_Session127
    ↓ (reads hub state)
THREE.Mesh visual output (shared fields, flows)
```

### TERTIARY PATH (Composite Glyphs):
```
FusionZoneManager.compositeGlyphs
    ↓
HarmonicResonanceFeedbackSystem
    ↓ (modifies link.userData.phase)
Link visual modifications
```

---

## PROBLÉMY A REDUNDANCIE

### ⚠️ TOP 5 PODOZRIEVÉ SYSTÉMY

1. **HarmonyStabilizationSystem_v1.js** - DVOJITÁ ODPORVEDNOSŤ
   - PROBLÉM: Má vlastný tracking `this.nodeHarmony` a zároveň píše do `node.userData`
   - KONFLIKT: Viacero readerov sa môže pozrieť na rôzne zdroje
   - RIEŠENIE: Odstrániť interný tracking, použiť len canonical writes

2. **Session files (134-146)** - NEINTEGRované EXPERIMENTY
   - PROBLÉM: 5 session visual systems nie sú napojené na runtime
   - ZBYTOČNOSŤ: Vytvorené pre špecifické sessiony, nikdy neaktivované
   - RIEŠENIE: Archivovať alebo odstrániť ak nie sú súčasťou evolúcie

3. **NodeHarmonicManager vs HarmonicHubAuraSystem** - DUPLIKITA DETEKCIE
   - PROBLÉM: Oba systémy detegujú "harmonic hubs" (node s 2+ links a harmony > corruption)
   - KONFLIKT: Rozdielne definície hub qualification
   - RIEŠENIE: Centralizovať hub detection v jednom systéme

4. **HarmonicNodeResonanceHalos - viacero INPUT ZDROJOV**
   - PROBLÉM: Číta z viacerých zdrojov (hubSystemData, harmonicManagerData, node.userData, node.harmonicControllers)
   - RIZIKO: Nesúladné dáta ak zdroje nezhodujú
   - RIEŠENIE: Definovať jediný canonical source pre halo metrics

5. **Integration patches** - BRIDGE OVERHEAD
   - PROBLÉM: Session-specific bridge files pre každý session systém
   - ZBYTOČNOSŤ: Session systémy nie sú v main runtime
   - RIEŠENIE: Odstrániť patches ak session systémy nie sú aktívne

---

## DEAD/UNUSED FILES TO REMOVE

### 🔴 Odstrániť (Session-specific, not integrated):
- HarmonicRecoveryVisualSystem_Session138.js
- HarmonicPhaseSynchronization_Session146.js
- HarmonicCascadeAmplification_Session145.js
- HarmonicAudioReactivitySystem_Session135.js
- HarmonicHealingVisualSystem_Session134.js

### 🔴 Odstrániť (Corresponding integration patches):
- HarmonicHubAuraIntegrationPatch_Session126.js
- HarmonicInfluencePropagationIntegrationPatch_Session127.js
- HarmonyStabilizationIntegrationPatch_v1.js

### 🔴 Odstrániť (Debug/Test infrastructure):
- T4004_HARMONY_HEALING_TEST_RUNNER.js
- HarmonicHubDebugger.js

---

## ŠTATISTIKY

**Aktívne systémy (Production):** 7
**Session systémy (Experiments):** 5
**Integration patches:** 3
**Debug/Test files:** 2
**TOTAL:** 17 files

**Data flow integrity:** ⚠️ MIERNE OHROZENÁ
- Canonical writers definované (✅)
- Viaceré čítanie z rôznych zdrojov (⚠️)
- Session systémy bez integrácie (⚠️)

**Napojenie na FrameScheduler:** ✅ OK
- HarmonicInfluencePropagationSystem_Session127 ✅
- HarmonicHubAuraSystem_Session126 ✅
- HarmonicNodeResonanceHalos ✅
- HarmonicResonanceFeedbackSystem ✅

---

## ZÁVER

### Čo FUNGUJE:
- Harmonic data flow je definovaný (HarmonyStabilizationSystem v1)
- Visual systémy sú napojené a aktívne
- FrameScheduler integrácia je správna

### Čo TREBA FIXNUŤ:
1. Odstrániť session systémy (5 files) a ich patches (3 files)
2. Centralizovať hub detection (odstrániť duplicitu medzi NodeHarmonicManager a HarmonicHubAuraSystem)
3. Definovať single source of truth pre halo metrics
4. Odstrániť interný tracking v HarmonyStabilizationSystem (použiť len userData)

### RECOMMENDÁCIA:
Session systémy sú historické experimenty. Ak nie sú súčasťou EVOLUTION_V2 plánu, odstrániť ich na zníženie kognitívnej záťaže a maintenance overhead.