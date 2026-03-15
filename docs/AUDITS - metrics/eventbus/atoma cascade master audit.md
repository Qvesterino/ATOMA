# ATOMA CASCADE MASTER AUDIT
## READ-ONLY STATIC + RUNTIME INTEGRATION ANALYSIS

---

## EXECUTIVE SUMMARY

ATOMA has **ONE active cascade propagation engine** with multiple visual consumer systems. The architecture is split between two paradigms:

1. **HARMONIC CASCADE** (Session 145-146) - Active, harmonic hub-based propagation with phase synchronization
2. **SYNERGY CASCADE** (Week 22-23) - Dormant/partial, synergy-based propagation with particle effects

**KEY FINDINGS:**
- ✅ Single source of truth for cascade data (CascadingHarmonicResonanceAmplification)
- ✅ Clean separation between propagation engine and visual consumers
- ⚠️ Two different cascade systems exist (harmonic vs synergy) creating potential confusion
- ⚠️ Some visual systems not properly wired to runtime updates
- ⚠️ Multiple propagation engines with different topologies (risk of divergence)

---

## CASCADE WRITERS

### ACTIVE WRITER

**CascadingHarmonicResonanceAmplification.js**
- **FILE:** `CascadingHarmonicResonanceAmplification.js`
- **FUNCTION:** `update(deltaTime)` + `_storeComputedCascadeData()`
- **DATA WRITTEN:**
  - `node._cascadeStrength` (0-1)
  - `node._cascadeLayer` (0-5)
  - `node._cascadeAmplitude` (0-1)
  - `node._cascadePhase` (0-2π)
  - `node._cascadeSourceCount` (number of cascade sources)
  - `node.userData.cascadeStrength` (canonical export)
  - `node.userData.cascadeAmplitude` (canonical export)
  - `node.userData.cascadePhase` (canonical export)
  - `node.userData.waveField` (constructive, destructive, standing, amplitude, phase, sourceCount)
- **UPDATE LOOP:** Called via FrameScheduler layer 'simulation.harmonyCascade'
- **CALL CHAIN:** main.js → FrameScheduler → harmonyCascade.update()
- **FRAME SCHEDULER REGISTRATION:** ✅ YES - 'simulation.harmonyCascade'

---

## CASCADE READERS

### VISUAL READERS

**1. CascadeResonanceWaveVisualization_Session146.js**
- **DATA READ:** cascadeStrength (via getCascadeStrength())
- **PURPOSE:** Visual (ghost-level wave propagation between synchronized hubs)

**2. ParticleStreamCascadeAcceleration.js**
- **DATA READ:** node._cascadeStrength, node._cascadeLayer, node._cascadeAmplitude
- **PURPOSE:** Particle physics acceleration modulation

**3. ParticleCascadeFlowDeflection.js**
- **DATA READ:** node._cascadeStrength, node._cascadeLayer
- **PURPOSE:** Particle flow direction deflection

**4. EXAMPLES/CASCADING_RESONANCE_EXAMPLES.js**
- **DATA READ:** node._cascadeStrength, node._cascadeAmplitude, node._cascadePhase, node._cascadeLayer, node._cascadeSourceCount
- **PURPOSE:** Documentation/examples (not runtime)

### INTERNAL READERS

**5. CascadingHarmonicResonanceAmplification.js**
- **DATA READ:** Internal nodeLayerData, nodeCascadeSources
- **PURPOSE:** Propagation calculation, secondary hub detection

---

## CASCADE PROPAGATION ENGINE

### ACTIVE PROPAGATION SYSTEM

**CascadingHarmonicResonanceAmplification**
- **ALGORITHM:** BFS (Breadth-First Search)
- **TOPOLOGY SOURCE:** network.links → neighborGraph (cached)
- **MAX DEPTH:** 5 layers (configurable: maxCascadeLayers)
- **DECAY MODEL:** Exponential decay - layerDecayFactor^layer (default 0.6^layer)
- **AMPLIFICATION FACTORS:**
  - Synergy: ×(1 + synergy × 0.3)
  - Corruption: ×(1 - corruption × 0.4)
  - Harmony: ×(0.8 + harmony × 0.2)
  - Resilience: ×(0.7 + resilience × 0.3)
- **SECONDARY HUB CONDITIONS:**
  - Threshold: 0.7 cascade strength
  - Secondary hubs re-emit with 0.7× strength
  - Cooldown: 0.5 seconds

### DORMANT PROPAGATION SYSTEM

**SynergyCascadeVisualizer**
- **ALGORITHM:** BFS with propagation fronts
- **MAX DEPTH:** 5 hops (configurable)
- **DECAY MODEL:** 0.75^hop
- **STATUS:** Instantiated but NOT updated in FrameScheduler
- **ISSUE:** No update loop registered

---

## CASCADE VISUAL SYSTEMS

### ACTIVE VISUALS

**1. PHASE5_CascadePropagationVisuals_v1.js**
- **INITIALIZATION:** main.js → setupPhase5CascadePropagationVisuals()
- **UPDATE LOOP:** FrameScheduler 'visual.cascadePropagation' + 'visual.phase5CascadeEventCheck'
- **DATA SOURCE:** LinkCorruptionTransmission.getCascadeHistory()
- **ACTIVATION CONDITION:** cascadeStrength > 0.3
- **TYPE:** Expanding ring visualization (pure visual)

**2. CascadeResonanceWaveVisualization_Session146.js**
- **INITIALIZATION:** main.js → setupCascadeResonanceWaveVisualization()
- **UPDATE LOOP:** Unknown (no explicit FrameScheduler registration found)
- **DATA SOURCE:** HarmonicCascadeAmplification.getSession145() (proximity + phase sync)
- **ACTIVATION CONDITION:** Phase sync strength > 0.1, cascade strength > 0.35
- **TYPE:** Temporal modulation (extremely subtle ghost waves)

**3. SynergyCascadeVisualizer**
- **INITIALIZATION:** main.js → new SynergyCascadeVisualizer()
- **UPDATE LOOP:** ❌ NOT REGISTERED in FrameScheduler
- **DATA SOURCE:** Synergy detection (threshold 0.7)
- **ACTIVATION CONDITION:** N/A (system dormant)
- **TYPE:** Multi-hop propagation with particles

### DORMANT VISUALS

**4. ResonanceCascadeVisualization_Session117B.js**
- **INITIALIZATION:** main.js → setupResonanceCascadeVisualization()
- **UPDATE LOOP:** ❌ NOT REGISTERED in FrameScheduler
- **STATUS:** Listens to semanticBus events but system appears inactive
- **TYPE:** Radial/link-based cascade waves

**5. CascadeParticleEmissionBoost_Session118.js**
- **INITIALIZATION:** main.js → setupCascadeParticleEmissionBoost()
- **UPDATE LOOP:** ❌ NOT REGISTERED in FrameScheduler
- **TYPE:** Link-based particle emission boost

**6. CascadeParticleColorTinting_Session119.js**
- **INITIALIZATION:** main.js → setupCascadeParticleColorTinting()
- **UPDATE LOOP:** ❌ NOT REGISTERED in FrameScheduler
- **TYPE:** Link color tinting based on cascade

**7. CascadeParticleSystem_Session120.js**
- **INITIALIZATION:** main.js → setupCascadeParticleSystem()
- **UPDATE LOOP:** ❌ NOT REGISTERED in FrameScheduler
- **TYPE:** Cascade particle system

---

## EVENT BUS INTEGRATION

### CASCADE EVENTS EMITTED

**harmonic.cascade.start**
- **EMITTER:** HarmonicHubAuraSystem_Session126.js
- **PAYLOAD:** { hubId, ... }
- **STATUS:** Active when harmonic cascade triggers

### CASCADE EVENTS CONSUMED

**1. WaveBurstRouter_v1.js**
- **LISTENS TO:** 'cascade.triggered', 'harmonic.cascade.start'
- **PURPOSE:** Trigger wave bursts on cascade events
- **PRIORITY:** NORMAL

**2. ResonanceCascadeVisualization_Session117B.js**
- **LISTENS TO:** 'cascade.triggered', 'harmonic.cascade.start'
- **PURPOSE:** Visualize cascade propagation
- **STATUS:** System appears dormant (no FrameScheduler registration)

### OTHER CASCADE-RELATED EVENTS

- No other cascade-specific events found in semantic bus
- Most cascade data flows through direct method calls, not events

---

## RUNTIME INTEGRATION CHECK (main.js)

### FRAME SCHEDULER REGISTRATIONS

**CASCADE PROPAGATION (HARMONIC)**
```javascript
this.frameScheduler.register('simulation', (dt) => {
  this.harmonyCascade.update(dt);
}, 'simulation.harmonyCascade');
```
- ✅ ACTIVE - Layer: 'simulation'
- ✅ Updates every frame

**CASCADE PROPAGATION (HARMONIC AMPLIFICATION)**
```javascript
this.frameScheduler.register('realtime', () => {
  if (this.harmonicCascadeAmplification?.config?.enabled) {
    this.harmonicCascadeAmplificationTick(this._pendingHarmonicCascadeDt);
  }
}, 'harmonicCascadeAmplification.realtime');
```
- ❌ DISABLED - config.enabled = false by default
- ⚠️ Proximity detection runs, but cascade amplification disabled

**CASCADE VISUALS (PHASE5)**
```javascript
this.frameScheduler.register('visual', (dt) => 
  this.cascadePropagationVisuals?.update?.(dt), 
  'visual.cascadePropagation'
);

this.frameScheduler.register('visual', () => 
  this.cascadePropagationVisuals?.checkCascadeEvents?.(), 
  'visual.phase5CascadeEventCheck'
);
```
- ✅ ACTIVE - Layer: 'visual'
- ✅ Updates every frame

**CASCADE VISUALS (BRIDGE)**
```javascript
this.frameScheduler.register('visual', (dt) => 
  this.phase5CascadeVisualizationBridge?.update?.(dt), 
  'visual.phase5CascadeVisualizationBridge'
);
```
- ✅ ACTIVE - Layer: 'visual'
- ✅ Updates every frame

**CASCADE VISUALIZER (SYNERGY)**
```javascript
this.frameScheduler.register('visual', () => {
  if (!this._runCascadeVisualizerPending) {
    this.cascadeVisualizerTick(this._pendingCascadeVisualizerDt);
  }
}, 'cascadeVisualizer.realtime');
```
- ⚠️ DEFERRED - Uses pending tick mechanism
- ⚠️ System instantiated but update flow unclear

---

## PROPAGATION GRAPH ANALYSIS

### HARMONIC CASCADE (Active)

**TOPOLOGY TYPE:** Undirected neighbor graph
- Built from `network.links`
- Cached in `neighborGraph` (Map<nodeId, Set<neighborId>>)

**PROPAGATION ALGORITHM:** BFS (Breadth-First Search)
- Queue-based layer-by-layer traversal
- Visited set prevents cycles
- Layer depth tracking

**MAX DEPTH:** 5 layers
- Configurable: `maxCascadeLayers`
- Asymptotic minimum at layer 4+

**DECAY MODEL:** Exponential
- Formula: `strength × 0.6^layer`
- Layer 0: 100%
- Layer 1: 60%
- Layer 2: 36%
- Layer 3: 21.6%
- Layer 4: 13%

**SECONDARY HUB MECHANIC:**
- Threshold: cascadeStrength > 0.7
- Re-emits at 0.7× strength
- Creates multi-source interference patterns

**INTERFERENCE MODEL:** Constructive/Destructive
- Multiple cascades to same node interfere
- Phase alignment determines constructive vs destructive
- Formula: `cascadeA + cascadeB + 2√(cascadeA·cascadeB) × cos(angleA - angleB)`

---

## DEAD OR DORMANT SYSTEMS

### CRITERIA FOR DORMANCY
- Never imported: ❌
- Never instantiated: ❌
- Never updated (no FrameScheduler registration): ⚠️
- Feature flag disabled: ⚠️

### DORMANT CASCADE SYSTEMS

**1. SynergyCascadeVisualizer**
- **STATUS:** Instantiated but NOT updated
- **FRAME SCHEDULER:** ❌ Not registered
- **UPDATE METHOD:** update() exists but never called
- **LIKELY REASON:** Superseded by harmonic cascade system

**2. ResonanceCascadeVisualization_Session117B**
- **STATUS:** Instantiated, listens to events, NOT updated
- **FRAME SCHEDULER:** ❌ Not registered
- **EVENT LISTENER:** ✅ Listens to 'cascade.triggered', 'harmonic.cascade.start'
- **LIKELY REASON:** Legacy system from Session 117

**3. CascadeParticleEmissionBoost_Session118**
- **STATUS:** Instantiated, NOT updated
- **FRAME SCHEDULER:** ❌ Not registered
- **LIKELY REASON:** Partially integrated particle system

**4. CascadeParticleColorTinting_Session119**
- **STATUS:** Instantiated, NOT updated
- **FRAME SCHEDULER:** ❌ Not registered
- **LIKELY REASON:** Partially integrated visual system

**5. CascadeParticleSystem_Session120**
- **STATUS:** Instantiated, NOT updated
- **FRAME SCHEDULER:** ❌ Not registered
- **LIKELY REASON:** Partially integrated particle system

**6. CascadingRuptureSystem.js**
- **STATUS:** File exists, NOT imported in main.js
- **FRAME SCHEDULER:** ❌ Not registered
- **LIKELY REASON:** Experimental/legacy

**7. HubInfluencePropagation.js**
- **STATUS:** File exists, NOT imported in main.js
- **FRAME SCHEDULER:** ❌ Not registered
- **LIKELY REASON:** Experimental/legacy

**8. HarmonicInfluencePropagationSystem_Session127.js**
- **STATUS:** File exists, NOT imported in main.js
- **FRAME SCHEDULER:** ❌ Not registered
- **LIKELY REASON:** Experimental/legacy

### DISABLED (BUT ARCHITECTED)

**9. HarmonicCascadeAmplification_Session145**
- **STATUS:** ✅ Instantiated, ✅ Registered in FrameScheduler
- **FEATURE FLAG:** ❌ `config.enabled = false`
- **ACTIVE COMPONENT:** Proximity detection (always on)
- **INACTIVE COMPONENT:** Cascade amplification (disabled)
- **LIKELY REASON:** Proximity foundation ready for future activation

---

## FINAL CASCADE ARCHITECTURE MAP

```
┌─────────────────────────────────────────────────────────────────┐
│                    ATOMA CASCADE ARCHITECTURE                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  CASCADE DATA MODEL (node properties)                           │
├─────────────────────────────────────────────────────────────────┤
│  node._cascadeStrength     → Primary cascade intensity (0-1)    │
│  node._cascadeLayer        → Propagation depth (0-5)           │
│  node._cascadeAmplitude    → Resonance amplitude (0-1)          │
│  node._cascadePhase       → Wave phase (0-2π)                 │
│  node._cascadeSourceCount → Number of cascade sources          │
│                                                                 │
│  node.userData.cascadeStrength  → Canonical export             │
│  node.userData.cascadeAmplitude → Canonical export             │
│  node.userData.cascadePhase    → Canonical export             │
│  node.userData.waveField        → Wave integration (7 fields)  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  CASCADE ENGINE (Active)                                        │
├─────────────────────────────────────────────────────────────────┤
│  CascadingHarmonicResonanceAmplification                        │
│  ├─ Algorithm: BFS propagation through neighbor graph         │
│  ├─ Max depth: 5 layers                                        │
│  ├─ Decay: 0.6^layer                                           │
│  ├─ Secondary hubs: threshold 0.7, re-emit at 0.7×             │
│  ├─ Interference: Multi-cascade constructive/destructive      │
│  └─ FrameScheduler: 'simulation.harmonyCascade'                │
│                                                                 │
│  Trigger Conditions:                                             │
│  ├─ Harmony > 0.4                                              │
│  ├─ Hub strength > 0.3                                          │
│  └─ Resonance energy = harmony × (0.5 + synergy × 0.2 × resilience) │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  CASCADE PROPAGATION ENGINE (Dormant)                           │
├─────────────────────────────────────────────────────────────────┤
│  SynergyCascadeVisualizer                                       │
│  ├─ Algorithm: BFS with propagation fronts                    │
│  ├─ Max depth: 5 hops                                          │
│  ├─ Decay: 0.75^hop                                            │
│  ├─ Trigger: Synergy > 0.7                                     │
│  └─ STATUS: NOT updated (no FrameScheduler registration)      │
│                                                                 │
│  HarmonicCascadeAmplification_Session145                        │
│  ├─ Active: Proximity detection (always on)                   │
│  ├─ Disabled: Cascade amplification (config.enabled = false)  │
│  └─ FrameScheduler: 'harmonicCascadeAmplification.realtime'    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  CASCADE VISUALS (Active)                                       │
├─────────────────────────────────────────────────────────────────┤
│  PHASE5_CascadePropagationVisuals_v1                           │
│  ├─ Type: Expanding ring visualization                         │
│  ├─ Data source: LinkCorruptionTransmission.getCascadeHistory()│
│  ├─ Activation: cascadeStrength > 0.3                           │
│  ├─ FrameScheduler: 'visual.cascadePropagation'               │
│  └─ Event check: 'visual.phase5CascadeEventCheck'              │
│                                                                 │
│  CascadeResonanceWaveVisualization_Session146                    │
│  ├─ Type: Ghost-level temporal modulation                       │
│  ├─ Data source: HarmonicCascadeAmplification.getSession145()  │
│  ├─ Activation: Phase sync > 0.1, cascade > 0.35               │
│  ├─ Influence: 3-8% of baseline (extremely subtle)            │
│  └─ FrameScheduler: Unknown (not explicitly registered)        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  CASCADE VISUALS (Dormant)                                     │
├─────────────────────────────────────────────────────────────────┤
│  SynergyCascadeVisualizer          - Not updated               │
│  ResonanceCascadeVisualization_117B - Not updated             │
│  CascadeParticleEmissionBoost_118   - Not updated              │
│  CascadeParticleColorTinting_119   - Not updated              │
│  CascadeParticleSystem_120         - Not updated              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  CASCADE EVENT SYSTEM                                          │
├─────────────────────────────────────────────────────────────────┤
│  EMITTED:                                                        │
│  └─ harmonic.cascade.start (HarmonicHubAuraSystem_Session126) │
│                                                                 │
│  CONSUMED:                                                       │
│  ├─ WaveBurstRouter_v1 (triggers wave bursts)                 │
│  └─ ResonanceCascadeVisualization_Session117B (dormant)        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  CASCADE TRIGGERS                                               │
├─────────────────────────────────────────────────────────────────┤
│  Corruption transmission    → PHASE5_CascadePropagationVisuals  │
│  Harmonic hubs            → CascadingHarmonicResonanceAmplification│
│  Synergy spikes           → SynergyCascadeVisualizer (dormant)  │
│  Secondary hub crossing   → Wave burst intent (via waveEngine)  │
└─────────────────────────────────────────────────────────────────┘
```

---

## RISK ASSESSMENT

### CRITICAL RISKS

**1. Multiple Cascade Systems (ARCHITECTURAL RISK)**
- **ISSUE:** Two different cascade engines (harmonic vs synergy) exist simultaneously
- **IMPACT:** Potential for conflicting cascade strength calculations
- **STATUS:** SynergyCascadeVisualizer is dormant, but if activated, would conflict
- **MITIGATION:** Decide on single cascade engine; remove or clearly partition dormant systems

**2. Visual Systems Not Updated (RUNTIME RISK)**
- **ISSUE:** 6 cascade visual systems instantiated but never updated
- **IMPACT:** Wasted memory, potential confusion, incomplete visual integration
- **AFFECTED:** SynergyCascadeVisualizer, ResonanceCascadeVisualization_Session117B, 
  CascadeParticleEmissionBoost_Session118, CascadeParticleColorTinting_Session119, 
  CascadeParticleSystem_Session120
- **MITIGATION:** Remove dormant systems or properly wire them to FrameScheduler

**3. CascadeResonanceWaveVisualization Update Loop Unclear (INTEGRATION RISK)**
- **ISSUE:** No explicit FrameScheduler registration found for cascade wave viz
- **STATUS:** System instantiated but update method unclear
- **IMPACT:** Ghost wave visualization may not be running despite being instantiated
- **MITIGATION:** Verify update flow or explicitly register in FrameScheduler

### MEDIUM RISKS

**4. Feature Flag Confusion (MAINTENANCE RISK)**
- **ISSUE:** HarmonicCascadeAmplification_Session145 has `config.enabled = false` but 
  proximity detection always runs
- **IMPACT:** Unclear what "enabled" means for this system
- **MITIGATION:** Clarify feature flag semantics in documentation

**5. Event Bus vs Direct Method Calls (ARCHITECTURAL RISK)**
- **ISSUE:** Cascade events exist but most cascade data flows through direct method calls
- **IMPACT:** Inconsistent data flow patterns
- **MITIGATION:** Standardize on one approach (prefer direct calls for performance)

### LOW RISKS

**6. Duplicate Cascade Strength Sources (DATA RISK)**
- **ISSUE:** node._cascadeStrength and node.userData.cascadeStrength both written
- **IMPACT:** Potential for inconsistency if not kept in sync
- **MITIGATION:** Establish single source of truth pattern

**7. Multiple Propagation Topologies (COMPLEXITY RISK)**
- **ISSUE:** BFS used in both systems but with different parameters
- **IMPACT:** Harder to understand propagation behavior
- **MITIGATION:** Document propagation parameters clearly

---

## RECOMMENDATIONS

1. **CONSOLIDATE CASCADE ENGINES**
   - Choose one cascade engine (recommend harmonic cascade)
   - Remove or clearly archive dormant synergy cascade
   - Establish single source of truth for cascade data

2. **CLEANUP DORMANT VISUALS**
   - Remove 6 dormant cascade visual systems or properly wire them
   - Update FrameScheduler registrations
   - Clear import statements for unused systems

3. **CLARIFY CASCADE WAVE UPDATE FLOW**
   - Verify CascadeResonanceWaveVisualization_Session146 update loop
   - Register explicitly in FrameScheduler or document why not needed

4. **STANDARDIZE CASCADE DATA ACCESS**
   - Establish single source of truth (recommend node.userData.*)
   - Migrate internal _cascade* properties to canonical userData
   - Update all readers to use canonical API

5. **DOCUMENT CASCADE ARCHITECTURE**
   - Create CASCADE_ARCHITECTURE.md
   - Document propagation parameters, triggers, and visual systems
   - Clarify event bus vs direct call patterns

---

## AUDIT COMPLETION

✅ Cascade writers identified (1 active)
✅ Cascade readers identified (4 active, 1 internal)
✅ Runtime integration verified (main.js + FrameScheduler)
✅ Event bus integration mapped (1 emit, 2 listen)
✅ Visual systems audited (2 active, 6 dormant)
✅ Propagation graph analyzed (BFS, 5 layers, exponential decay)
✅ Dormant systems identified (8 total)
✅ Architecture map created
✅ Risk assessment completed

**AUDIT STATUS:** COMPLETE
**DATE:** 2025-03-15
**SCOPE:** Full cascade propagation architecture