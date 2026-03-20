# DATA FLOW AUDIT: CASCADE / WAVE / RESONANCE SYSTEMS
**Date:** 2026-03-20
**Status:** CRITICAL ISSUES FOUND

---

## EXECUTIVE SUMMARY

Three major broken data pipelines identified that prevent cascade/wave/resonance systems from functioning correctly:

1. **Missing WaveInterferenceEngine intent requests** - No system generates proper burst intents
2. **Broken regime data flow** - Cascade systems emit events without regime information
3. **Duplicate/overlapping data writers** - Multiple systems write to same userData fields

**Result:** Wave shaders receive zeros, cascade particles may not spawn, resonance effects are invisible.

---

## PIPELINE ANALYSIS

### 1. METRICS GENERATION ✓
**System:** `CoreMetricsCalculator.js`

**Output:** `node.userData.metrics.*`
- `metrics.synergy` ✓
- `metrics.corruption` ✓
- `metrics.stability` ✓
- `metrics.loadPressure` ✓

**Status:** WORKING - Single source of truth for node metrics

---

### 2. CASCADE INTENT GENERATION ⚠️

#### 2.1 CascadingHarmonicResonanceAmplification.js ✓
**Reads:** `node.userData.metrics.{harmony, synergy, corruption, resilience}`

**Writes:**
```javascript
node.userData.cascadeStrength = computedValue
node.userData.metrics.cascadeStrength = computedValue
node.userData.cascadeAmplitude = computedValue
node.userData.cascadePhase = computedValue
node.userData.metrics.cascadeStrength = computedValue
node.userData.metrics.cascadeAmplitude = computedValue
node.userData.metrics.cascadePhase = computedValue
```

**Emits:**
```javascript
semanticBus.emit('cascade.triggered', {
  sourceNode: node.id,
  strength: node._cascadeStrength,
  position: { x, y, z }
})
```

**Also writes waveField:**
```javascript
node.userData.waveField = {
  constructive: ...,
  destructive: ...,
  standing: ...,
  amplitude: ...,
  phase: ...,
  sourceCount: ...
}
```

**Status:** WORKING - Primary writer for cascadeStrength

---

#### 2.2 CascadeEventBridge_v1.js ✓
**Reads:** `node.userData.metrics.cascadeStrength` (from CascadingHarmonicResonanceAmplification)

**Writes:** `link.userData.flowState.*`
```javascript
link.userData.flowState = {
  intensity: ...,
  type: 'specialization_drift' | 'corruption' | 'destructive' | 'oscillatory_balance',
  energy: ...,
  direction: ...
}
```

**Emits:** `cascade.hop` event (consumed by CascadeParticleSystem)

**Status:** WORKING - Reads cascadeStrength, writes link flowState

**PROBLEM:** In `_requestCascadeWaveBurst()`, emits `cascade.hop` instead of calling `waveEngine.requestBurstIntent()`

---

### 3. CASCADE PARTICLE SYSTEM ✓
**System:** `CascadeParticleSystem_Session120.js`

**Reads:** `link.userData.flowState.intensity`

**Emits:** `cascade.hop` events (throttled)

**Status:** WORKING - Particles spawn from cascade intensity

---

### 4. WAVE INTERFERENCE ENGINE ❌ CRITICAL

**System:** `WaveInterferenceEngine_v1.js`

**Input Contract:** `requestBurstIntent(intent)` requires:
```javascript
{
  type: 'harmonic' | 'synergy' | 'corruption' | 'stability',
  sourceId: string,
  fromRegime: string,  // ⚠️ MANDATORY
  toRegime: string,    // ⚠️ MANDATORY
  center: THREE.Vector3,
  energy: number
}
```

**Output:** `getActiveSnapshot()` → snapshot with wave field data
```javascript
{
  type: string,
  sourceId: string,
  spatial: { center: {x,y,z}, radius: number },
  timeline: { startAt, peakAt, endAt },
  ...
}
```

**PROBLEM 1:** **NO ONE CALLS `requestBurstIntent()`** ❌

**Sources examined:**
- ✗ CascadingHarmonicResonanceAmplification → emits `cascade.triggered` (wrong format)
- ✗ CascadeEventBridge → emits `cascade.hop` (wrong format, no regime info)
- ✗ CascadeParticleSystem → emits `cascade.hop` (wrong format)

**PROBLEM 2:** **No regime data in cascade events** ❌

The intent requires `fromRegime` and `toRegime` (mandatory fields), but cascade systems don't provide this information.

**Result:** WaveInterferenceEngine never receives burst requests → snapshot always null → shaders get zeros.

---

### 5. WAVE SHADER BRIDGE ✓
**System:** `WaveShaderBridge_v1.js`

**Reads:** `waveEngine.getActiveSnapshot()`

**Writes:** Shader uniforms:
```javascript
uWaveAmplitude.value = ...
uWaveConstructive.value = ...
uWaveDestructive.value = ...
uWaveStanding.value = ...
uWavePhase.value = ...
uWaveIntensity.value = ...
```

**Status:** WORKING - But receives null/empty snapshot because engine never gets intents

**Result:** Uniforms stay at 0 because snapshot is null.

---

## BROKEN DATA PIPELINES

### PIPELINE 1: Cascade → Wave Interference ❌ BROKEN

**Expected flow:**
```
CascadingHarmonicResonanceAmplification
  → emits cascade.triggered
  → ??? (missing layer)
  → WaveInterferenceEngine.requestBurstIntent(intent)
  → getActiveSnapshot()
  → WaveShaderBridge.update()
  → Shader uniforms
```

**Actual flow:**
```
CascadingHarmonicResonanceAmplification
  → emits cascade.triggered (wrong format, no regime data)
  → ✗ DEAD END - no one consumes this event properly
  → WaveInterferenceEngine never receives intent
  → getActiveSnapshot() returns null
  → Shader uniforms = 0
```

**Where it breaks:** Missing bridge system to convert `cascade.triggered` events into proper `requestBurstIntent()` calls with regime data.

---

### PIPELINE 2: CascadeEventBridge → Wave Engine ❌ BROKEN

**Expected flow:**
```
CascadeEventBridge detects high intensity
  → waveEngine.requestBurstIntent(intent)
  → generates wave burst
```

**Actual flow:**
```
CascadeEventBridge detects high intensity
  → emits cascade.hop (wrong format, no regime data)
  → CascadeParticleSystem consumes for particles
  → ✗ WaveInterferenceEngine never called
```

**Where it breaks:** `_requestCascadeWaveBurst()` emits wrong event type.

---

### PIPELINE 3: Regime Data Flow ❌ BROKEN

**Expected:**
- Node regime transitions tracked somewhere
- Regime state available to cascade systems
- `fromRegime` and `toRegime` included in burst intents

**Actual:**
- No regime tracking system found
- Cascade systems don't know about regimes
- WaveInterferenceEngine requires regimes but never receives them

**Where it breaks:** Missing regime tracking system.

---

## ZERO-INPUT SYSTEMS

### WaveInterferenceEngine_v1.js ❌

**Receives:** No direct intent requests

**Status:** Engine is dead - never activated, snapshot always null

**Impact:** All downstream systems (WaveShaderBridge, shaders) receive zeros

---

### WaveShaderBridge_v1.js ⚠️

**Receives:** `getActiveSnapshot()` → always null

**Status:** Functional but receives no data

**Impact:** Shader uniforms stay at 0, no wave visual effects

---

## MISSING WRITERS

### 1. WaveInterferenceEngine Intent Requests ❌

**Expected writer:** System that calls `waveEngine.requestBurstIntent()`

**Actual status:** NO WRITER FOUND

**Candidate systems (not working):**
- CascadingHarmonicResonanceAmplification (emits wrong event)
- CascadeEventBridge (emits wrong event)
- CascadeParticleSystem (doesn't call engine)

**Required fix:** Create bridge system or modify existing systems to:
1. Track regime transitions
2. Generate proper burst intents with `fromRegime/toRegime`
3. Call `waveEngine.requestBurstIntent(intent)`

---

### 2. Regime State Tracking ❌

**Expected writer:** System that tracks node/link regime state

**Actual status:** NO REGIME TRACKING FOUND

**Required fields needed:**
```javascript
node.userData.regime = 'baseline' | 'coherent' | 'aligned' | 'unstable' | ...
node.userData.regimeHistory = [{ regime, timestamp }, ...]
```

---

### 3. Node Link System Integration ⚠️

**Expected writer:** Integration between NodeLinkingSystem and cascade systems

**Actual status:** CascadeEventBridge manually finds links via nodeId

**Issue:** Fragile coupling - assumes link structure, no official API

---

## DUPLICATE/OVERLAPPING WRITERS

### 1. cascadeStrength field

**Writers:**
1. CascadingHarmonicResonanceAmplification ✓ (has owner check)
2. CascadeEventBridge (reads but doesn't write)

**Status:** SAFE - only one writer with owner check

---

### 2. waveField field

**Writers:**
1. CascadingHarmonicResonanceAmplification ✓ (writes to nodes)
2. NodeInterferenceManager ✓ (writes interference to nodes)
3. WaveInterferenceEngine (doesn't write userData, returns field)

**Status:** SAFE - different writers for different aspects

---

### 3. flowState field

**Writers:**
1. CascadeEventBridge ✓ (single writer for links)

**Status:** SAFE - single source of truth

---

## THRESHOLD ANALYSIS

### Cascade Activation Thresholds

**CascadingHarmonicResonanceAmplification:**
- Resonance energy > 0.4 to be considered hub
- Hub strength > 0.3 to cascade
- Secondary hub threshold: 0.7

**CascadeEventBridge:**
- cascadeWaveThreshold: 0.6 (to generate wave bursts)
- Cooldown: 800ms between wave requests

**CascadeParticleSystem:**
- intensity < 0.1 → no particle emission (unless boost > 1.0)

**Finding:** Multiple systems have similar but different thresholds. No central threshold configuration.

**Risk:** Inconsistent cascade behavior, cascades may activate in some systems but not others.

---

## EVENT MAPPING GAPS

### cascade.triggered event

**Emitted by:** CascadingHarmonicResonanceAmplification

**Consumed by:** NO ONE FOUND ❌

**Contains:** `{ sourceNode, strength, position }`

**Missing:** `fromRegime`, `toRegime`, `type` (required by WaveInterferenceEngine)

---

### cascade.hop event

**Emitted by:**
- CascadeParticleSystem (throttled, 300ms cooldown)
- CascadeEventBridge (on high intensity, 800ms cooldown)

**Consumed by:**
- CascadeParticleSystem (for particles) ✓

**Missing:** WaveInterferenceEngine ❌

**Contains:** `{ link, linkId, position, intensity, conflictType }`

**Missing:** `fromRegime`, `toRegime` (required by WaveInterferenceEngine)

---

### wave.packet.spawn event

**Emitted by:** WaveInterferenceEngine (when burst accepted)

**Consumed by:** NOT TRACED in this audit

---

## INTEGRATION STATUS

### WaveInterferenceEngine Integration

**Constructor expects:**
```javascript
{
  eventBus: semanticBus,
  linkSystem: linkingSystem,
  reflectionSystem: influenceReflection
}
```

**Actual wiring:** NOT VERIFIED - needs manual inspection of main.js

**Potential issue:** If not properly initialized, engine won't receive intents even if generated.

---

## RECOMMENDED FIXES

### PRIORITY 1: FIX WAVE INTENT PIPELINE

**Option A: Create Intent Bridge System**
```javascript
class WaveIntentBridge {
  constructor(cascadeSystem, waveEngine, regimeTracker) {
    this.cascadeSystem = cascadeSystem;
    this.waveEngine = waveEngine;
    this.regimeTracker = regimeTracker;
    
    semanticBus.on('cascade.triggered', (event) => {
      const intent = {
        type: this.mapCascadeToWaveType(event),
        sourceId: event.sourceNode,
        fromRegime: regimeTracker.getPreviousRegime(event.sourceNode),
        toRegime: regimeTracker.getCurrentRegime(event.sourceNode),
        center: event.position,
        energy: event.strength
      };
      this.waveEngine.requestBurstIntent(intent);
    });
  }
  
  mapCascadeToWaveType(event) {
    // Map cascade.triggered to harmonic/synergy/corruption/stability
    if (event.conflictType === 'corruption') return 'corruption';
    if (event.conflictType === 'destructive') return 'corruption';
    return 'harmonic';
  }
}
```

**Option B: Modify CascadeEventBridge**
```javascript
_requestCascadeWaveBurst(link, flowState) {
  // Change from emitting cascade.hop to calling requestBurstIntent
  if (!this.waveEngine?.requestBurstIntent) return;
  
  const regime = this.regimeTracker?.getRegime(link) || { from: 'baseline', to: 'active' };
  
  this.waveEngine.requestBurstIntent({
    type: this._mapConflictTypeToBurstType(flowState.type),
    sourceId: link.id,
    fromRegime: regime.from,
    toRegime: regime.to,
    center: midpoint,
    energy: flowState.intensity
  });
}
```

---

### PRIORITY 2: IMPLEMENT REGIME TRACKING

**Create RegimeTracker system:**
```javascript
class RegimeTracker {
  constructor() {
    this.nodeRegimes = new Map(); // nodeId → { current, history: [] }
    this.regimeThresholds = {
      coherent: { harmony: 0.8, corruption: 0.1 },
      unstable: { stability: 0.3 },
      ...
    };
  }
  
  update(nodes) {
    for (const node of nodes) {
      const metrics = node.userData.metrics || {};
      const newRegime = this._detectRegime(metrics);
      const current = this.nodeRegimes.get(node.id)?.current;
      
      if (newRegime !== current) {
        this.nodeRegimes.set(node.id, {
          current: newRegime,
          history: [...history.slice(-10), { regime: newRegime, time: now }]
        });
        
        // Emit regime transition event
        semanticBus.emit('regime.transition', {
          nodeId: node.id,
          from: current || 'baseline',
          to: newRegime
        });
      }
    }
  }
  
  getCurrentRegime(nodeId) {
    return this.nodeRegimes.get(nodeId)?.current || 'baseline';
  }
  
  getPreviousRegime(nodeId) {
    const history = this.nodeRegimes.get(nodeId)?.history;
    return history?.length > 1 ? history[history.length - 2].regime : 'baseline';
  }
}
```

---

### PRIORITY 3: UNIFY THRESHOLDS

**Create centralized config:**
```javascript
const CASCADE_CONFIG = {
  thresholds: {
    hubResonance: 0.4,
    hubStrength: 0.3,
    secondaryHub: 0.7,
    waveBurst: 0.6,
    particleEmission: 0.1
  },
  cooldowns: {
    waveBurstMs: 800,
    cascadeHopMs: 300
  }
};
```

---

## VERIFICATION STEPS

### After implementing fixes:

1. **Verify intent generation:**
   ```javascript
   // Add logging to WaveInterferenceEngine
   requestBurstIntent(intent) {
     console.log('[WaveEngine] Intent received:', intent.type, intent.sourceId);
     // ... existing code
   }
   ```

2. **Verify snapshot data:**
   ```javascript
   // Check snapshot is not null
   const snapshot = waveEngine.getActiveSnapshot();
   console.log('[Audit] Snapshot:', snapshot ? 'ACTIVE' : 'NULL');
   if (snapshot) {
     console.log('[Audit] Type:', snapshot.type, 'Source:', snapshot.sourceId);
   }
   ```

3. **Verify shader uniforms:**
   ```javascript
   // Check uniform values
   console.log('[Audit] uWaveAmplitude:', material.uniforms.uWaveAmplitude.value);
   console.log('[Audit] uWaveConstructive:', material.uniforms.uWaveConstructive.value);
   ```

4. **Verify regime tracking:**
   ```javascript
   const regime = regimeTracker.getCurrentRegime(nodeId);
   console.log('[Audit] Node regime:', regime);
   ```

---

## SUMMARY TABLE

| Component | Status | Issue | Impact |
|-----------|--------|-------|--------|
| CoreMetricsCalculator | ✅ Working | - | - |
| CascadingHarmonicResonanceAmplification | ✅ Working | Emits wrong event format | Wave engine not triggered |
| CascadeEventBridge | ⚠️ Partial | Emits wrong event format | Wave engine not triggered |
| CascadeParticleSystem | ✅ Working | - | - |
| WaveInterferenceEngine | ❌ Broken | No intent requests | Snapshot always null |
| WaveShaderBridge | ⚠️ No data | Receives null snapshot | Shader uniforms = 0 |
| Regime Tracking | ❌ Missing | Not implemented | Cannot generate proper intents |

---

## CONCLUSION

**Root cause:** Architectural gap between cascade systems and WaveInterferenceEngine. Cascade systems emit events in a format that doesn't match the WaveInterferenceEngine's intent contract, and there's no regime tracking system to provide the required `fromRegime`/`toRegime` data.

**Critical path to fix:**
1. Implement RegimeTracker
2. Create WaveIntentBridge or modify CascadeEventBridge to generate proper burst intents
3. Verify WaveInterferenceEngine receives intents
4. Verify snapshots are generated
5. Verify shader uniforms receive non-zero values

**Estimated effort:** 2-4 hours to implement and test.

---

**Audit completed by:** Autonomous ATOMA Engineer
**Date:** 2026-03-20