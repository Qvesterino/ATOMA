# Prehľad Harmony VFX Efektov v ATOMA

Podľa analýzy kódovej základne sú harmonické VFX efekty organizované do niekoľkých prepojených systémov. Tu je kompletný prehľad:

---

## Hlavné Harmony VFX Systémy

### 1. **HarmonyAuraController.js**
- **Popis:** Riadi harmóniu aura efektov pre jednotlivé uzly (opacity, radius, breathing)
- **Trigger Event:** `event:harmonyResonance` (čítanie)
- **Wiring:** 
  - Inicializovaný v `main.js` pre uzly
  - Používa `node.userData.harmonyAuraStrength` (0..1)
  - Aktualizuje shader uniforms: `uAuraOpacity`, `uAuraStrength`, `uAuraRadius`, `uAuraPulse`

---

### 2. **HarmonicHubAuraSystem_Session126.js**
- **Popis:** Vytvára zdieľané rezonančné polia medzi blízkymi harmónickými hubmi (uzly s 2+ linkmi a harmony > corruption)
- **Trigger Event:** 
  - Číta: `event:harmonyResonance`
  - Emituje: `harmonic.cascade.start`
- **Wiring:**
  - `setupHarmonicHubAuraSystem()` v `main.js`
  - Update loop: `visual.harmonicHubAuraSystem` (FrameScheduler)
  - Metóda: `this.harmonicHubAuraSystemTick(deltaTime)`
  - Používa: `nodeAuraSystem`, `linkResonanceSystem`

---

### 3. **HarmonicNodeResonanceHalos.js**
- **Popis:** Soft, volumetrické halos okolo harmónických hubov, pulzujúce synchronizovane
- **Trigger Event:** 
  - Číta: `event:harmonyResonance`
  - Čítanie event-driven cez semanticBus
- **Wiring:**
  - `setupHarmonicNodeResonanceHalos()` v `main.js`
  - Update loop: `visual.harmonicNodeResonanceHalos`
  - Metóda: `this.harmonicNodeHalosTick(deltaTime)`
  - Používa: `hubSystemData` (z HarmonicHubAuraSystem), `harmonicManagerData` (z NodeHarmonicManager)

---

### 4. **HarmonicResonanceCoupling_v1.js**
- **Popis:** Synergy-driven vizuálne prepájanie prepojených uzlov (rezonančné častice, shimmer, link glow)
- **Trigger Event:** Automatický, závislý od synergy medzi uzlami
- **Wiring:**
  - `setupHarmonicResonanceCoupling()` v `main.js`
  - Update loop: `visual.harmonicResonanceCoupling`
  - Metóda: `this.harmonicResonanceCouplingTick(deltaTime)`
  - Register: `registerLink(link)` pri vytvorení linku

---

### 5. **CascadingHarmonicResonanceAmplification.js**
- **Popis:** Kaskádová amplifikácia rezonancie cez topologické vrstvy siete (hub → susedi → sekundárne huby)
- **Trigger Event:** 
  - Emituje: `cascade.triggered` (pri prekročení secondary-hub threshold 0.7)
- **Wiring:**
  - `setupHarmonicCascadeAmplification()` v `main.js`
  - Update loop: `simulation.harmonicCascadeAmplification`
  - Používa: `aiNodes`, `harmonicHubAuraSystem`, `harmonicResonanceCoupling`
  - Zapisuje do: `node.userData.cascadeStrength`, `node.userData.waveField`

---

### 6. **HarmonicPhaseSynchronization_Session146.js**
- **Popis:** Synchronizácia fáz medzi blízkymi hubmi pre koherentné vizuálne efekty
- **Trigger Event:** Automatický, založený na blízkosti hubov (proximity pairs)
- **Wiring:**
  - `setupHarmonicPhaseSynchronization()` v `main.js`
  - Update loop: `visual.harmonicPhaseSynchronization`
  - Používa: `harmonicCascadeAmplification.getProximityPairs()`, `harmonicHubAuraSystem.hubs`
  - Aktualizuje: `hub.harmonicPhase` (0 až 2π)

---

### 7. **HarmonicInfluencePropagationSystem_Session127.js**
- **Popis:** Vizualizuje tok harmónie z hubov cez sieť
- **Trigger Event:** Automatický, založený na hub detekcii
- **Wiring:**
  - `setupHarmonicInfluencePropagation()` v `main.js`
  - Update loop: `visual.harmonicInfluencePropagation`
  - Používa: `harmonicHubAuraSystem`, `nodeAuraSystem`

---

### 8. **HarmonicRecoveryVisualSystem_Session138.js**
- **Popis:** Vizuálne zotavenie siete po rupture (Golden Waves)
- **Trigger Event:** Rupture completion
- **Wiring:**
  - `setupHarmonicRecovery()` v `main.js`
  - Používa: `resonanceRupture`, `healingParticles`

---

### 9. **HarmonicHealingVisualSystem_Session134.js**
- **Popis:** Golden Wave vizuálne efekty pre healing
- **Trigger Event:** Healing pulse events
- **Wiring:**
  - `setupHarmonicHealingSystem()` v `main.js`

---

### 10. **HarmonicAudioReactivitySystem_Session135.js**
- **Popis:** Audio reaktivita pre harmóniu
- **Trigger Event:** Audio events
- **Wiring:**
  - `setupHarmonicHealingSystem()` v `main.js`

---

### 11. **HarmonicResonanceFeedbackSystem.js**
- **Popis:** Reznančné polia emitované kompozitnými glypmi ovplyvňujúce linky
- **Trigger Event:** Composite glyph movement
- **Wiring:**
  - `setupHarmonicResonanceFeedback()` v `main.js`
  - Update loop: `visual.harmonicResonanceFeedback` (30 Hz)

---

### 12. **VisualEchoTrails_v1_Shader.js**
- **Popis:** Harmonické afterimages ako temporálna pamäť pohybu glyphov
- **Trigger Event:** Glyph movement
- **Wiring:**
  - `setupVisualEchoTrails()` v `main.js`

---

### 13. **HarmonicTopologyLearningSystem.js**
- **Popis:** Vizualizácia dlhodobého učenia siete cez topológiu
- **Trigger Event:** Network topology changes
- **Wiring:**
  - `setupHarmonicTopologyLearning()` v `main.js`

---

### 14. **ProceduralHarmonicGlyphGenerator.js**
- **Popis:** Generovanie emergentného vizuálneho jazyka z topológie
- **Trigger Event:** Topology history
- **Wiring:**
  - `setupProceduralHarmonicGlyphs()` v `main.js`

---

### 15. **RegionalHarmonicCycleController.js**
- **Popis:** Správa harmonických aktivitných cyklov pre regióny
- **Trigger Event:** Regional phase cycles
- **Wiring:**
  - `setupRegionalHarmonicCycles()` v `main.js`

---

### 16. **LinkResonanceFlowSystem_Session124.js**
- **Popis:** Rezančný tok v linkoch
- **Trigger Event:** Link resonance events
- **Wiring:**
  - `setupLinkResonanceFlowSystem()` v `main.js`

---

### 17. **PreCascadeVisualHint_Session146.js**
- **Popis:** Subtílne vizuálne náznaky pred kaskádou
- **Trigger Event:** Phase synchronization prepínače
- **Wiring:**
  - `setupPreCascadeVisualHint()` v `main.js`

---

## Súhrn Trigger Eventov

| Event | Zdroj | Cieľ |
|-------|-------|------|
| `event:harmonyResonance` | CoreMetricsCalculator | HarmonicHubAuraSystem, HarmonicNodeResonanceHalos |
| `harmonic.cascade.start` | HarmonicHubAuraSystem | Cascade systémy |
| `cascade.triggered` | CascadingHarmonicResonanceAmplification | Wave/particle systémy |
| Synergy threshold | Link metrics | HarmonicResonanceCoupling |
| Hub proximity (2+ links) | Node topology | HarmonicHubAuraSystem, HarmonicNodeResonanceHalos |
| Rupture completion | ResonanceRuptureSystem | HarmonicRecoveryVisualSystem |

---

## Wiring Flowchart

```
CoreMetricsCalculator
    ↓ (event:harmonyResonance)
    ├→ HarmonicHubAuraSystem → (harmonic.cascade.start)
    │   ↓
    │   └→ CascadingHarmonicResonanceAmplification → (cascade.triggered)
    │       ↓
    │       └→ Wave/Particle Systems
    │
    └→ HarmonicNodeResonanceHalos (event-driven)

NodeLinkingSystem
    ↓
    ├→ HarmonicResonanceCoupling (synergy-based)
    │
    └→ LinkResonanceFlowSystem

HarmonicHubAuraSystem
    ↓
    ├→ HarmonicPhaseSynchronization
    └→ HarmonicInfluencePropagation

HarmonicTopologyLearningSystem
    ↓
    ├→ ProceduralHarmonicGlyphGenerator
    └→ RegionalHarmonicCycleController
```