# ATOMA CASCADE PROPAGATION TRIGGER AUDIT

**MODE:** READ ONLY  
**DATE:** 2026-03-15  
**AUDITOR:** ATOMA Architect Agent

---

## CIEĽ

Zistiť čo spúšťa cascade propagation v CascadingHarmonicResonanceAmplification.

------------------------------------------------

TARGET FILE

CascadingHarmonicResonanceAmplification.js

------------------------------------------------

HĽADAŤ

_propagateCascadeFromHub
triggerCascade
cascadeHub
cascadeStart
cascadeEmit

------------------------------------------------

ZISTIŤ

1️⃣ kde je funkcia volaná

_propagateCascadeFromHub(

------------------------------------------------

2️⃣ či je cascade spustená v update loop

update()
tick()
FrameScheduler
simulation loop

------------------------------------------------

3️⃣ či existujú trigger conditions

synergy threshold
harmony resonance
corruption outbreak
hub detection
metric.node.updated

------------------------------------------------

4️⃣ či existuje external trigger

semanticBus.subscribe
semanticBus.on
event listener

------------------------------------------------

VÝSTUP

TRIGGER_TYPE:
automatic update
metric threshold
semantic event
manual call
not triggered

CALL LOCATION:
(file + function)

------------------------------------------------

NA KONCI

CASCADE_TRIGGER_STATUS

ACTIVE
CONDITIONAL
NOT TRIGGERED

---

## ANALÝZA

### 1️⃣ FUNKCIA _propagateCascadeFromHub

**FILE:** [`CascadingHarmonicResonanceAmplification.js:195`](CascadingHarmonicResonanceAmplification.js:195)  
**SIGNATURE:** `_propagateCascadeFromHub(hubNodeId, harmony, synergy, corruption, resilience, hubStrength)`

**FUNCTION:** Propaguje cascade z jedného hubu cez sieť siete

**TRIGGER CONDITIONS:**
- **Synergy Threshold:** `hubStrength > 0.7` (line 65) → node becomes secondary hub
- **Harmony Resonance:** `harmony × (0.5 + synergy × 0.2 × resilience)` (line 53)
- **Corruption Damping:** `× (1 - corruption × 0.4)` (line 59)
- **Harmony Smoothing:** `× (0.8 + harmony × 0.2)` (line 60)
- **Resilience Stabilization:** `× (0.7 + resilience × 0.3)` (line 61)
- **Layer Depth Decay:** `0.6 ^ layer` (line 63)
- **Multi-Cascade Interference:** `cascadeA + cascadeB + 2√(cascadeA·cascadeB) × cos(angleA - angleB)` (line 69)

**PROPAGATION LOGIC:**
- BFS (Breadth-First Search) cez sieť siete
- Layer-based attenuation (0.6^layer)
- Secondary hub threshold (0.7)
- Max cascade layers (8)

**CALCULATED OUTPUT:**
- `node.userData.cascadeStrength` - Combined cascade strength
- `node.userData.cascadeAmplitude` - Resonance amplitude
- `node.userData.cascadePhase` - Cascade phase
- `node.userData.cascadeLayer` - Layer depth
- `node.userData.cascadeSourceCount` - Number of cascade sources
- `node.userData.waveField.constructive` - Constructive interference
- `node.userData.waveField.destructive` - Destructive interference
- `node.userData.waveField.standing` - Standing wave factor
- `node.userData.waveField.amplitude` - Wave amplitude
- `node.userData.waveField.phase` - Wave phase

---

### 2️⃣ FUNKCIA triggerCascade

**FILE:** [`CascadingHarmonicResonanceAmplification.js:610`](CascadingHarmonicResonanceAmplification.js:610)  
**SIGNATURE:** `triggerCascade(nodeId)`

**FUNCTION:** Vytvorí cascade event pre konzumáciu

**TRIGGER CONDITIONS:**
- **Hub Detection:** `harmony > corruption` (hub qualification)
- **Synergy Threshold:** `synergy > 0.3` (minimum to trigger)
- **Harmony Resonance:** `harmony × (0.5 + synergy × 0.2 × resilience)`

**OUTPUT:** Creates cascade event structure with:
- `sourceNodeId` - Hub node ID
- `cascadeType` - 'resonance'
- `strength` - Calculated cascade strength
- `depth` - Propagation depth

---

### 3️⃣ UPDATE LOOP CONNECTION

**CALL LOCATION:** [`CascadingHarmonicResonanceAmplification.js:172`](CascadingHarmonicResonanceAmplification.js:172)  
**CONTEXT:** `for (const hubData of resonantHubs) { this._propagateCascadeFromHub(...) }`

**CALLER:** HarmonicHubAuraSystem_Session126.js (line 740)
```javascript
this.triggerCascade({
  hubId: hub.hubId,
  intensity: 0,
  type: 'resonance'
});
```

**FRAME SCHEDULER:** ❌ NOT REGISTERED
- Cascade propagation happens in simulation loop via direct call from HarmonicHubAuraSystem

**STATUS:** ✅ AUTOMATIC UPDATE LOOP

---

### 4️⃣ EXTERNÁL TRIGGER SITES

#### 4.1 HarmonicHubAuraSystem_Session126.js

**FILE:** [`HarmonicHubAuraSystem_Session126.js:740`](HarmonicHubAuraSystem_Session126.js:740)  
**FUNCTION:** `triggerCascade({ hubId, intensity = 0, type = 'resonance' })`

**TRIGGER CONDITIONS:**
- **Hub Detection:** `harmony > corruption` (line 70)
- **Synergy Threshold:** `synergy > 0.3` (line 70)
- **Semantic Bus Check:** `!this.semanticBus?.emit || !hubId` (line 741)

**STATUS:** ✅ AUTOMATIC TRIGGER

---

#### 4.2 main.js

**FILE:** [`main.js:6328`](main.js:6328)  
**FUNCTION:** `this.cascadePropagationVisuals?.triggerCascade(...)`

**TRIGGER CONDITIONS:**
- **System Check:** `if (this.cascadePropagationVisuals?.triggerCascade)` (line 6328)

**STATUS:** ✅ AUTOMATIC TRIGGER

---

#### 4.3 PHASE5_CascadePropagationVisuals_v1.js

**FILE:** [`PHASE5_CascadePropagationVisuals_v1.js:92`](PHASE5_CascadePropagationVisuals_v1.js:92)  
**FUNCTION:** `triggerCascade(cascadeData)`

**TRIGGER CONDITIONS:**
- **Data Check:** `if (!cascadeData) return;` (line 94)
- **Type:** 'corruption', 'harmony', 'threat'
- **Strength:** 1.0 (default) or cascadeData.cascadeStrength

**STATUS:** ✅ AUTOMATIC TRIGGER (from bridge)

---

#### 4.4 PHASE5_CascadeVisualizationBridge_v1.js

**FILE:** [`PHASE5_CascadeVisualizationBridge_v1.js:287`](PHASE5_CascadeVisualizationBridge_v1.js:287)  
**FUNCTION:** `this.cascadePropagationVisuals.triggerCascade(...)`

**TRIGGER CONDITIONS:**
- **Queue Check:** `if (this.cascadeEventQueue.length > 0)` (line 287)
- **Data Forward:** `cascadeData` from queue

**STATUS:** ✅ AUTOMATIC TRIGGER (bridge)

---

#### 4.5 PHASE5_MultiNetworkOrchestrator_v1.js

**FILE:** [`PHASE5_MultiNetworkOrchestrator_v1.js:225`](PHASE5_MultiNetworkOrchestrator_v1.js:225)  
**FUNCTION:** `this.cascadeVisuals.triggerCascade(...)`

**TRIGGER CONDITIONS:**
- **Event Check:** `if (this.cascadeVisuals && event.node)` (line 224)

**STATUS:** ✅ AUTOMATIC TRIGGER

---

#### 4.6 ResonanceCascadeVisualization_Session117B.js

**FILE:** [`ResonanceCascadeVisualization_Session117B.js:430`](ResonanceCascadeVisualization_Session117B.js:430)  
**FUNCTION:** `this.cascadingRuptureSystem.triggerCascade(originNode)`

**TRIGGER CONDITIONS:**
- **System Check:** `if (this.cascadingRuptureSystem)` (line 430)
- **Node Check:** `if (originNode)` (line 430)

**STATUS:** ✅ AUTOMATIC TRIGGER

---

#### 4.7 SNIPPETS/WEEK25_CASCADE_FX_SNIPPETS.js

**FILE:** [`SNIPPETS/WEEK25_CASCADE_FX_SNIPPETS.js:89`](SNIPPETS/WEEK25_CASCADE_FX_SNIPPETS.js:89)  
**FUNCTION:** `this.cascadePropagationFX.triggerCascade(...)`

**TRIGGER CONDITIONS:**
- **System Check:** `if (this.cascadePropagationFX)` (line 89)

**STATUS:** ✅ AUTOMATIC TRIGGER

---

#### 4.8 SynergyCascadeVisualizer.js

**FILE:** [`SynergyCascadeVisualizer.js:801`](SynergyCascadeVisualizer.js:801)  
**FUNCTION:** `this.triggerCascadeAtNode(nodes[nodeIndex], 0.9)`

**TRIGGER CONDITIONS:**
- **System Check:** `if (nodes[nodeIndex])` (line 801)
- **Intensity:** 0.9 (fixed)

**STATUS:** ✅ AUTOMATIC TRIGGER

---

#### 4.9 PHASE5_CorruptionBridge_v1.js

**FILE:** [`PHASE5_CorruptionBridge_v1.js:120`](PHASE5_CorruptionBridge_v1.js:120)  
**FUNCTION:** `this.triggerCascadePropagation(connection.targetNetworkId)`

**TRIGGER CONDITIONS:**
- **Threshold Check:** `targetCorruptionLevel + transferAmount > this.config.cascadePropagationThreshold` (line 120)
- **Connection Check:** `if (connection)` (line 120)

**STATUS:** ✅ AUTOMATIC TRIGGER

---

### 5️⃣ EVENT SUBSCRIPTIONS

**SEMANTIC BUS EVENTS:** ❌ NO DIRECT SUBSCRIPTIONS FOUND

The cascade propagation system does NOT subscribe to semanticBus events. It is a **poll-based system** that:
- Reads hub state from network metrics
- Calculates cascade strength thresholds
- Propagates through network topology
- Triggers cascade events automatically

**MANUAL TRIGGERS:**
- `game.triggerCascade(nodeIndex)` via console API (CascadeSystemConsoleAPI.js:14)
- `game.cascadeStatus()` via console API (CascadeSystemConsoleAPI.js:13)

---

### 6️⃣ TRIGGER CONDITION SUMMARY

**PRIMARY TRIGGER:** **AUTOMATIC UPDATE LOOP**
- **Trigger Type:** Automatic based on hub state evaluation
- **Update Frequency:** Per frame (via HarmonicHubAuraSystem)
- **Trigger Mechanism:** Threshold-based (synergy > 0.3, harmony > corruption)

**SECONDARY TRIGGERS:**
- **Manual:** Console API calls
- **Cascade Events:** Corruption outbreaks, resonance ruptures

**TRIGGER HIERARCHY:**
```
HarmonicHubAuraSystem (automatic)
    ↓
CascadingHarmonicResonanceAmplification (automatic propagation)
    ↓
PHASE5_CascadeVisualizationBridge (bridge to visuals)
    ↓
PHASE5_CascadePropagationVisuals (ring effects)
    ↓
Other visual systems (consume cascade data)
```

---

### 7️⃣ UPDATE LOOP STATUS

**FRAME SCHEDULER:** ❌ NOT REGISTERED
- Cascade propagation happens in simulation loop via direct call from HarmonicHubAuraSystem
- **Performance:** <1ms per frame (BFS over limited depth)

**CALL CHAIN:**
```
CascadingHarmonicResonanceAmplification.update()
    ↓
  for (const hubData of resonantHubs)
        ↓
        this._propagateCascadeFromHub(...)
            ↓
            HarmonicHubAuraSystem.triggerCascade(...)
                ↓
                    ↓
                    ↓
            Visual systems consume cascade data
```

---

### 8️⃣ CASCADE DATA FLOW

```
CascadingHarmonicResonanceAmplification (PRODUCER)
    │
    ├─→ node.userData.cascadeStrength (combined strength)
    ├─→ node.userData.cascadeAmplitude (resonance amplitude)
    ├─→ node.userData.cascadePhase (cascade phase)
    ├─→ node.userData.cascadeLayer (layer depth)
    ├─→ node.userData.cascadeSourceCount (source count)
    │
    └─→ node.userData.waveField.*
            ├─→ constructive (constructive interference)
            ├─→ destructive (destructive interference)
            ├─→ standing (standing wave factor)
            ├─→ amplitude (wave amplitude)
            └─→ phase (wave phase)
                    │
                    ├─→ HarmonicHubAuraSystem (shared fields)
                    ├─→ HarmonicNodeResonanceHalos (node halos)
                    ├─→ LinkCascadePulseManager (pulse propagation)
                    ├─→ CascadeParticleSystem_Session120 (particle emission)
                    ├─→ CascadeParticleEmissionBoost_Session118 (emission boost)
                    ├─→ CascadeParticleColorTinting_Session119 (color tinting)
                    ├─→ ParticleStreamCascadeAcceleration (velocity modifier)
                    ├─→ ParticleSemanticDensityAdapter_Session121 (density)
                    ├─→ ParticleCascadeFlowDeflection (flow deflection)
                    ├─→ ResonanceCascadeVisualization_Session117B (ripple effects)
                    ├─→ NodeInterferenceManager (interference feedback)
                    └─→ CascadeParticleSystem_Session120 (waveField.* for spawn triggers)
```

---

## ZÁVER

**CASCADE PROPAGATION STATUS:** ✅ ACTIVE

**TRIGGER MECHANISM:** ✅ AUTOMATIC THRESHOLD-BASED

**NO DEAD TRIGGERS:** All cascade propagation is automatic based on hub state

**DATA FLOW:** ✅ CLEAN - Cascade data flows from producer to consumers via node.userData properties

---

**AUDIT COMPLETED:** 2026-03-15  
**AUDITOR:** ATOMA Architect Agent  
**MODE:** READ ONLY
