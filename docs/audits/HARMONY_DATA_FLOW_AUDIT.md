# ATOMA AUDIT — Harmony Data Flow Map

**Date:** 2026-03-09  
**Goal:** Understand why harmony VFX changes are not visible despite active harmony systems

---

## EXECUTIVE SUMMARY

**CRITICAL FINDING:** Harmony data flows correctly through the computation pipeline, but there are **multiple shadow metrics** and a **metric write lock** that prevents harmony values from reaching visual systems. The primary issue is that `HarmonyStabilizationSystem_v1` writes to internal Maps (`nodeHarmony`, `linkHarmony`) but conditionally writes to `node/link.userData.harmonyLevel` via `PHASE_C3_METRIC_WRITE_LOCK`, which is currently **enabled (true)**.

**Key Issues:**
1. Primary harmony storage in internal Maps is never read by visual systems
2. Visual systems read `userData.harmonyLevel` which remains at default values
3. Multiple shadow metric variables cause confusion
4. LinkHealingParticleSystem expects harmony data it never receives
5. HarmonicSyncEffectApplier operates in isolation from the main harmony system

---

## STEP 1 — HARMONY STORAGE LOCATIONS

### Node Harmony Variables

| Variable | Location | Type | Status |
|----------|----------|------|--------|
| `nodeHarmony` (Map) | HarmonyStabilizationSystem_v1 | Internal Map | **PRIMARY** |
| `node.userData.harmonyLevel` | Multiple | 0-1 number | **SHADOW** |
| `node.userData.harmonyVisualState` | HarmonyStabilizationSystem_v1 | Object | **SHADOW** |
| `node.userData.harmonyThresholds` | HarmonyStabilizationSystem_v1 | Set | **SHADOW** |
| `node.userData.isHarmonyAnchor` | HarmonyStabilizationSystem_v1 | Boolean | **SHADOW** |
| `node.userData.harmonyStabilized` | NodeLinkingSystem | Boolean | **SHADOW** |
| `node.userData.harmonyDampingFactor` | NodeLinkingSystem | Number (0.2) | **SHADOW** |
| `node.userData.harmonyAuraStrength` | HarmonyAuraController | 0-1 number | **SHADOW** |
| `node.userData.harmony` | Multiple files | 0-1 number | **SHADOW** (legacy) |
| `node.userData.metrics.harmony` | Various files | Object property | **SHADOW** (deprecated) |

### Link Harmony Variables

| Variable | Location | Type | Status |
|----------|----------|------|--------|
| `linkHarmony` (Map) | HarmonyStabilizationSystem_v1 | Internal Map | **PRIMARY** |
| `link.userData.harmonyLevel` | HarmonyStabilizationSystem_v1 | 0-1 number | **SHADOW** |
| `link.userData.harmonyVisualState` | HarmonyStabilizationSystem_v1 | Object | **SHADOW** |
| `link.harmonyLevel` | LinkRendererConduit (_readLinkMetrics) | 0-1 number | **SHADOW** |
| `link.harmony` | Multiple files | 0-1 number | **SHADOW** (legacy) |
| `link.userData.harmony` | Multiple files | 0-1 number | **SHADOW** (legacy) |

---

## STEP 2 — HARMONY WRITERS

### Primary Writer: HarmonyStabilizationSystem_v1.js

**Internal Map Updates (always active):**

```javascript
// Line ~342: Node harmony update
harmonyData.level = Math.max(0, Math.min(1.0, harmonyData.level + harmonyIncrease - harmonyDecay));

// Line ~398: Link harmony update  
harmonyData.level = Math.min(1.0, harmonyData.level + harmonyIncrease);
```

**Conditional userData Writes (BLOCKED by PHASE_C3_METRIC_WRITE_LOCK):**

```javascript
// Line 511: Node userData write (guarded)
if (!PHASE_C3_METRIC_WRITE_LOCK) {
  node.userData.harmonyLevel = level;
}

// Line 527: Link userData write (guarded)
if (!PHASE_C3_METRIC_WRITE_LOCK) {
  link.userData.harmonyLevel = level;
}
```

**Line 17:** `const PHASE_C3_METRIC_WRITE_LOCK = true;`

### Secondary Writers

| File | Variable | Write Type | Notes |
|------|----------|------------|-------|
| LinkCorruptionTransmission_v1.js | `node.userData.harmonyLevel` | Math.max(0, current - cost) | Resource expenditure |
| NetworkRituals_v1.js | `node.userData.harmonyLevel` | -= harmonyCost | Ritual participation |
| NodeVisualStateBinder.js | `node.userData.harmonyStabilized` | true/false | Motion damping flag |
| NodeLinkingSystem.js | `node.userData.harmonyStabilized` | true/false | Link creation/removal |
| NodeLinkingSystem.js | `node.userData.harmonyDampingFactor` | 0.2 or 0 | Motion damping value |
| MetricCompatibilityLayer.js | `node.userData.metrics.harmony` | Assignment | Initialization |

---

## STEP 3 — HARMONY READERS

### Visual System Readers

| File | Variable | Read Target | Status |
|------|----------|-------------|--------|
| LinkRendererConduit.js | `metrics.harmony` | `_readLinkMetrics()` | **READS SHADOW** |
| LinkRendererConduit.js | `linkHarmony` (Map) | ❌ Never reads | **MISSING** |
| LinkRendererConduit.js | `nodeHarmony` (Map) | ❌ Never reads | **MISSING** |
| NodeHarmonicSyncController.js | `harmony` (parameter) | update() method | **DISCONNECTED** |
| HarmonicSyncEffectApplier.js | `syncStrength` | Effect application | **DISCONNECTED** |
| LinkHealingParticleSystem.js | (assumed) | Expected to read harmony | **NEVER RECEIVES** |
| T2_HarmonyVisualConsumer_v1.js | `node.userData.harmonyLevel` | Visual consumption | **READS SHADOW** |
| HarmonicNodeResonanceHalos.js | `node.userData.harmony` | Visual effects | **READS SHADOW** |

### System Readers

| File | Variable | Read Target | Status |
|------|----------|-------------|--------|
| HarmonyStabilizationSystem_v1.js | `this.nodeHarmony` | Internal Map | ✅ CORRECT |
| HarmonyStabilizationSystem_v1.js | `this.linkHarmony` | Internal Map | ✅ CORRECT |
| LinkCorruptionTransmission_v1.js | `node.userData.harmonyLevel` | Resource check | **READS SHADOW** |
| MegaGlyphSystem.js | `node.userData.harmony` | Glyph rendering | **READS SHADOW** |
| _AtomaGlyphSystem4_0.js | `node.userData.harmony` | Glyph rendering | **READS SHADOW** |
| _AdaptiveGlyphRendering1_0.js | `node.userData.harmony` | Adaptive rendering | **READS SHADOW** |
| MetricInterpretationLayer_v1.js | `node.userData.harmony` | Metric interpretation | **READS SHADOW** |

---

## STEP 4 — HARMONY PIPELINE TRACE

### Current (Broken) Pipeline

```
[GAMEPLAY EVENTS]
    ↓
HarmonyStabilizationSystem_v1
    updateNodeHarmony()
    ↓
this.nodeHarmony Map (INTERNAL)
    { level: 0.85, velocity: 0.02, ... }
    ↓
this.linkHarmony Map (INTERNAL)
    { level: 0.72, velocity: 0.01, ... }
    ↓
❌ PIPELINE BREAK: PHASE_C3_METRIC_WRITE_LOCK = true
    ↓
❌ node.userData.harmonyLevel = undefined (never written)
❌ link.userData.harmonyLevel = undefined (never written)
    ↓
LinkRendererConduit._readLinkMetrics()
    ↓
metrics.harmony = link.harmonyLevel ?? link.harmony ?? 1.0
    ↓
metrics.harmony = 1.0 (DEFAULT - WRONG)
    ↓
[VISUAL SYSTEMS]
    ↓
❌ NO VISUAL CHANGES
```

### Intended (Working) Pipeline

```
[GAMEPLAY EVENTS]
    ↓
HarmonyStabilizationSystem_v1
    updateNodeHarmony()
    ↓
this.nodeHarmony Map (INTERNAL)
    { level: 0.85, velocity: 0.02, ... }
    ↓
this.linkHarmony Map (INTERNAL)
    { level: 0.72, velocity: 0.01, ... }
    ↓
✅ PHASE_C3_METRIC_WRITE_LOCK = false
    ↓
✅ node.userData.harmonyLevel = 0.85
✅ link.userData.harmonyLevel = 0.72
    ↓
LinkRendererConduit._readLinkMetrics()
    ↓
metrics.harmony = 0.72 (CORRECT)
    ↓
LinkRendererConduit.update()
    ↓
[VISUAL SYSTEMS RECEIVE HARMONY]
    ├─ LinkHealingParticleSystem → emits healing particles
    ├─ LinkRendererConduit → applies harmony to shaders
    ├─ HarmonicSyncEffectApplier → applies sync effects
    └─ NodeHarmonicManager → coordinates hub sync
    ↓
✅ VISUAL CHANGES VISIBLE
```

---

## STEP 5 — VISUAL INTEGRATION VERIFICATION

### System-by-System Analysis

#### LinkHealingParticleSystem.js

**Status:** ❌ IGNORES HARMONY (NEVER RECEIVES)

**Expected Behavior:** Emit healing particles flowing backward (target → source) when harmony > corruption

**Actual Behavior:** 
- Emitters are initialized in `LinkRendererConduit.createLinkVisuals()`
- Emitter.update() is called if `metrics.harmony > metrics.corruption`
- But `metrics.harmony` is always 1.0 (default) due to pipeline break
- Therefore, `linkHarmony > linkCorruption` is always true (1.0 > 0.2)
- Healing particles emit continuously based on false data

**Harmony Flow:**
```
HarmonyStabilizationSystem_v1 (internal Map)
    ↓ ❌ BLOCKED
LinkRendererConduit (metrics.harmony = 1.0 default)
    ↓
LinkHealingParticleSystem (receives wrong data)
```

#### LinkRendererConduit.js

**Status:** ❌ IGNORES HARMONY (READS SHADOW)

**Expected Behavior:** Apply harmony to link shader uniforms and particle systems

**Actual Behavior:**
- Reads `metrics.harmony` from `_readLinkMetrics()`
- `metrics.harmony = link.harmonyLevel ?? link.harmony ?? 1.0`
- Both `harmonyLevel` and `harmony` are undefined (never written)
- Falls back to default 1.0
- Shader uniforms receive wrong values
- Visual effects based on harmony use wrong data

**Harmony Flow:**
```
HarmonyStabilizationSystem_v1 (internal Map)
    ↓ ❌ BLOCKED
LinkRendererConduit (metrics.harmony = 1.0 default)
    ↓
Shader uniforms (uHarmony = 1.0 wrong)
```

#### NodeHarmonicManager.js

**Status:** ❌ IGNORES HARMONY (DISCONNECTED)

**Expected Behavior:** Coordinate harmonic hub synchronization based on harmony levels

**Actual Behavior:**
- `update(links, harmony = 1.0, corruption = 0.0, instability = 0.0)`
- Default parameters always used (harmony = 1.0)
- No connection to `HarmonyStabilizationSystem_v1.nodeHarmony`
- Operates in isolation from main harmony system
- Hub synchronization uses wrong baseline

**Harmony Flow:**
```
HarmonyStabilizationSystem_v1 (internal Map)
    ↓ ❌ DISCONNECTED
NodeHarmonicManager (harmony = 1.0 default)
    ↓
NodeHarmonicSyncController (wrong baseline)
```

#### HarmonicSyncEffectApplier.js

**Status:** ❌ IGNORES HARMONY (DISCONNECTED)

**Expected Behavior:** Apply harmonic sync effects based on hub feedback

**Actual Behavior:**
- Applies effects to: EnergyWave, PulseRing, ArcDischarges, Strands
- Receives `syncFeedback` from NodeHarmonicSyncController
- No direct connection to `HarmonyStabilizationSystem_v1`
- Sync strength based on wrong harmony baseline

**Harmony Flow:**
```
HarmonyStabilizationSystem_v1 (internal Map)
    ↓ ❌ DISCONNECTED
NodeHarmonicSyncController (wrong baseline)
    ↓
HarmonicSyncEffectApplier (applies wrong sync)
```

---

## STEP 6 — SHADOW METRICS DETECTION

### Multiple Harmony Variables (Chaos)

**Node Harmony (8+ variables):**
1. `this.nodeHarmony` (Map) - **PRIMARY SOURCE**
2. `node.userData.harmonyLevel` - **INTENDED TARGET**
3. `node.userData.harmonyVisualState` - Visual parameters
4. `node.userData.harmony` - Legacy shadow
5. `node.userData.metrics.harmony` - Deprecated shadow
6. `node.userData.isHarmonyAnchor` - Boolean flag
7. `node.userData.harmonyStabilized` - Motion damping flag
8. `node.userData.harmonyAuraStrength` - Derived visual strength

**Link Harmony (5+ variables):**
1. `this.linkHarmony` (Map) - **PRIMARY SOURCE**
2. `link.userData.harmonyLevel` - **INTENDED TARGET**
3. `link.harmonyLevel` - Alternative shadow
4. `link.harmony` - Legacy shadow
5. `link.userData.harmony` - Alternative shadow

### Shadow Metric Usage

| System | Reads | Should Read | Problem |
|--------|-------|--------------|---------|
| LinkRendererConduit | `link.harmonyLevel` | `linkHarmony.get(link.id).level` | Wrong source |
| T2_HarmonyVisualConsumer | `node.userData.harmonyLevel` | `nodeHarmony.get(node.id).level` | Wrong source |
| HarmonicNodeResonanceHalos | `node.userData.harmony` | `nodeHarmony.get(node.id).level` | Wrong source + wrong variable |
| MegaGlyphSystem | `node.userData.harmony` | `nodeHarmony.get(node.id).level` | Wrong source + wrong variable |
| _AtomaGlyphSystem4_0 | `node.userData.harmony` | `nodeHarmony.get(node.id).level` | Wrong source + wrong variable |

---

## STEP 7 — PIPELINE BREAKS DETECTED

### Break #1: PHASE_C3_METRIC_WRITE_LOCK

**Location:** HarmonyStabilizationSystem_v1.js, Line 17

```javascript
const PHASE_C3_METRIC_WRITE_LOCK = true;
```

**Impact:** BLOCKS ALL WRITES TO `node/link.userData.harmonyLevel`

**Consequence:** Visual systems read default values instead of actual harmony

**Fix:** Change to `false` or remove the lock

---

### Break #2: NodeHarmonicManager Disconnection

**Location:** NodeHarmonicManager.js, update() method

```javascript
update(links, harmony = 1.0, corruption = 0.0, instability = 0.0)
```

**Problem:** Uses default parameters, never reads from HarmonyStabilizationSystem_v1

**Impact:** Harmonic hub synchronization operates on wrong baseline

**Fix:** Connect to HarmonyStabilizationSystem_v1 internal Maps

---

### Break #3: LinkRendererConduit Reads Wrong Source

**Location:** LinkRendererConduit.js, _readLinkMetrics() method

```javascript
_readLinkMetrics(link) {
  return {
    harmony: link.harmonyLevel ?? link.harmony ?? 1.0,  // ❌ Wrong
    // ...
  };
}
```

**Problem:** Reads shadow metrics instead of internal Map

**Impact:** All visual systems receive wrong harmony values

**Fix:** Read from HarmonyStabilizationSystem_v1.linkHarmony Map

---

### Break #4: LinkHealingParticleSystem Never Receives Data

**Location:** LinkRendererConduit.js, healing particle update

```javascript
if (this.healingParticles && this.healingEmitters && link.id && this.modules.healingFX) {
  const emitter = this.healingEmitters.get(link.id);
  if (emitter) {
    const linkHarmony = metrics.harmony ?? 0.5;  // ❌ Always 1.0
    // ...
  }
}
```

**Problem:** Emitters receive wrong harmony data from _readLinkMetrics()

**Impact:** Healing particles emit based on false data

**Fix:** Fix Break #3 (upstream issue)

---

## STEP 8 — HARMONY DATA FLOW MAP

### Current (Broken) Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                      HARMONY COMPUTATION                           │
│  HarmonyStabilizationSystem_v1.updateNodeHarmony()              │
│  HarmonyStabilizationSystem_v1.updateLinkHarmony()                │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ↓
┌─────────────────────────────────────────────────────────────────────┐
│              INTERNAL STORAGE (PRIMARY SOURCE)                     │
│  this.nodeHarmony: Map<nodeId, {level, velocity, ...}>          │
│  this.linkHarmony: Map<linkId, {level, velocity, ...}>           │
│                                                                  │
│  Example: { level: 0.85, velocity: 0.02, isAnchor: false }      │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ↓
┌─────────────────────────────────────────────────────────────────────┐
│                   ❌ PIPELINE BLOCK ❌                            │
│  PHASE_C3_METRIC_WRITE_LOCK = true                              │
│                                                                  │
│  if (!PHASE_C3_METRIC_WRITE_LOCK) {                              │
│    node.userData.harmonyLevel = level;  // ← NEVER EXECUTED       │
│    link.userData.harmonyLevel = level;  // ← NEVER EXECUTED       │
│  }                                                               │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ↓ (data never flows here)
┌─────────────────────────────────────────────────────────────────────┐
│              SHADOW STORAGE (WRITTEN BY OTHERS)                  │
│  node.userData.harmonyLevel = undefined                          │
│  link.userData.harmonyLevel = undefined                          │
│  node.userData.harmony = undefined (legacy)                       │
│  link.userData.harmony = undefined (legacy)                       │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ↓
┌─────────────────────────────────────────────────────────────────────┐
│              VISUAL SYSTEM READ WRONG DATA                         │
│  LinkRendererConduit._readLinkMetrics():                         │
│    harmony: link.harmonyLevel ?? link.harmony ?? 1.0             │
│    → Returns: 1.0 (DEFAULT)                                     │
│                                                                  │
│  NodeHarmonicManager.update():                                    │
│    harmony = 1.0 (DEFAULT PARAMETER)                             │
│                                                                  │
│  T2_HarmonyVisualConsumer:                                      │
│    node.userData.harmonyLevel ?? 0 (UNDEFINED)                    │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ↓
┌─────────────────────────────────────────────────────────────────────┐
│              VISUAL SYSTEMS RECEIVE WRONG VALUES                  │
│                                                                  │
│  ❌ LinkHealingParticleSystem: harmony = 1.0 (should be 0.72)   │
│  ❌ LinkRendererConduit shaders: uHarmony = 1.0 (wrong)          │
│  ❌ NodeHarmonicManager: harmony = 1.0 (wrong baseline)          │
│  ❌ HarmonicSyncEffectApplier: syncStrength based on wrong data   │
│  ❌ All harmony-based visuals: Using default 1.0 instead of       │
│     actual computed values (0.0-1.0)                             │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ↓
┌─────────────────────────────────────────────────────────────────────┐
│              ❌ NO VISIBLE CHANGES ❌                            │
│                                                                  │
│  Harmony is computed correctly internally, but visual systems     │
│  never see the actual values. They operate on defaults.           │
│                                                                  │
│  Result: Harmony VFX changes are invisible even though the       │
│         harmony system is active and computing correctly.           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## STEP 9 — ISSUES REPORT

### Critical Issues

#### 1. PHASE_C3_METRIC_WRITE_LOCK Blocks All Visual Updates

**Severity:** CRITICAL  
**Location:** HarmonyStabilizationSystem_v1.js, Line 17  
**Impact:** Visual systems never receive actual harmony values

**Description:**
The `PHASE_C3_METRIC_WRITE_LOCK` flag prevents `HarmonyStabilizationSystem_v1` from writing computed harmony values to `node.userData.harmonyLevel` and `link.userData.harmonyLevel`. This is the root cause of invisible harmony VFX.

**Current State:**
```javascript
const PHASE_C3_METRIC_WRITE_LOCK = true;

// These lines NEVER execute:
if (!PHASE_C3_METRIC_WRITE_LOCK) {
  node.userData.harmonyLevel = level;  // Blocked
  link.userData.harmonyLevel = level;  // Blocked
}
```

**Recommended Fix:**
```javascript
const PHASE_C3_METRIC_WRITE_LOCK = false;  // Enable data flow
```

**OR** (if lock is needed for architectural reasons):
Provide a public API for visual systems to read from internal Maps:
```javascript
HarmonyStabilizationSystem_v1.prototype.getNodeHarmonyLevel(node) {
  const data = this.nodeHarmony.get(node.id);
  return data ? data.level : 0;
}

HarmonyStabilizationSystem_v1.prototype.getLinkHarmonyLevel(link) {
  const data = this.linkHarmony.get(link.id);
  return data ? data.level : 0;
}
```

---

#### 2. Visual Systems Read Wrong Data Source

**Severity:** CRITICAL  
**Location:** LinkRendererConduit.js, _readLinkMetrics()  
**Impact:** All visual systems operate on default values

**Description:**
`LinkRendererConduit._readLinkMetrics()` reads shadow metrics (`link.harmonyLevel`, `link.harmony`) instead of the authoritative source (`HarmonyStabilizationSystem_v1.linkHarmony`).

**Current Code:**
```javascript
_readLinkMetrics(link) {
  return {
    harmony: link.harmonyLevel ?? link.harmony ?? 1.0,  // ❌ Wrong source
    corruption: link.corruptionLevel ?? link.corruption ?? 0.0,
    // ...
  };
}
```

**Recommended Fix:**
```javascript
_readLinkMetrics(link) {
  // Read from authoritative source
  const harmonySystem = window.game?.harmonyStabilizationSystem;
  let harmonyLevel = 0.5;  // Sensible default
  
  if (harmonySystem) {
    const linkData = harmonySystem.linkHarmony.get(link.id);
    if (linkData) {
      harmonyLevel = linkData.level;
    }
  }
  
  // Fallback to shadow metrics only if authoritative source unavailable
  if (harmonyLevel === 0.5) {
    harmonyLevel = link.harmonyLevel ?? link.harmony ?? 0.5;
  }
  
  return {
    harmony: harmonyLevel,
    corruption: link.corruptionLevel ?? link.corruption ?? 0.0,
    // ...
  };
}
```

---

#### 3. NodeHarmonicManager Disconnected from Harmony System

**Severity:** HIGH  
**Location:** NodeHarmonicManager.js, update() method  
**Impact:** Harmonic hub synchronization uses wrong baseline

**Description:**
`NodeHarmonicManager.update()` uses default parameters (`harmony = 1.0`) and never reads from `HarmonyStabilizationSystem_v1`. This causes harmonic hub synchronization to operate on incorrect baseline values.

**Current Code:**
```javascript
update(links, harmony = 1.0, corruption = 0.0, instability = 0.0) {
  if (!this.config.enabled) return;
  
  // Uses default harmony = 1.0 (wrong baseline)
  this.nodeControllers.forEach(controller => {
    controller.update(harmony, corruption, instability);
  });
  
  this.applySyncToLinks(links);
}
```

**Recommended Fix:**
Pass actual harmony values from `HarmonyStabilizationSystem_v1`:
```javascript
// In main game loop:
const harmonySystem = window.game?.harmonyStabilizationSystem;
const averageHarmony = harmonySystem ? 
  harmonySystem.getNetworkHarmonyLevel() : 1.0;
const averageCorruption = harmonySystem ?
  harmonySystem.getNetworkCorruptionLevel() : 0.0;
const averageInstability = harmonySystem ?
  harmonySystem.getNetworkInstabilityLevel() : 0.0;

linkRendererConduit.nodeHarmonicManager.update(
  links,
  averageHarmony,
  averageCorruption,
  averageInstability
);
```

Add helper methods to `HarmonyStabilizationSystem_v1`:
```javascript
getNetworkHarmonyLevel() {
  if (this.nodeHarmony.size === 0) return 0.5;
  let total = 0;
  this.nodeHarmony.forEach(data => total += data.level);
  return total / this.nodeHarmony.size;
}

getNetworkCorruptionLevel() {
  const allNodes = this.getAllNodes();
  if (allNodes.length === 0) return 0.0;
  let total = 0;
  allNodes.forEach(node => {
    total += node.userData?.corruption ?? 0;
  });
  return total / allNodes.length;
}

getNetworkInstabilityLevel() {
  const allNodes = this.getAllNodes();
  if (allNodes.length === 0) return 0.0;
  let total = 0;
  allNodes.forEach(node => {
    total += node.userData?.instability ?? 0;
  });
  return total / allNodes.length;
}
```

---

### Medium Issues

#### 4. Multiple Shadow Metrics Cause Confusion

**Severity:** MEDIUM  
**Impact:** Code maintenance difficulty, potential bugs

**Description:**
Harmony is stored in 8+ different variables across nodes and 5+ variables across links. This creates confusion about which variable is the authoritative source.

**Affected Variables:**
- `node.userData.harmonyLevel` (intended target)
- `node.userData.harmony` (legacy shadow)
- `node.userData.metrics.harmony` (deprecated)
- `link.userData.harmonyLevel` (intended target)
- `link.harmonyLevel` (alternative shadow)
- `link.harmony` (legacy shadow)

**Recommended Fix:**
1. Establish canonical authority:
   - Source: `HarmonyStabilizationSystem_v1.nodeHarmony` (Map)
   - Target: `node.userData.harmonyLevel` (for visual systems)
2. Deprecate all other variables
3. Add code comments to authoritative sources
4. Consider implementing a Metrics Authority Pattern

---

#### 5. LinkHealingParticleSystem Operates on False Data

**Severity:** MEDIUM  
**Location:** LinkRendererConduit.js, healing particle update  
**Impact:** Healing particles emit based on wrong harmony values

**Description:**
Healing particles are emitted when `linkHarmony > linkCorruption`. Due to the pipeline break, `linkHarmony` is always 1.0 (default), causing particles to emit continuously regardless of actual harmony state.

**Current Behavior:**
```javascript
const linkHarmony = metrics.harmony ?? 0.5;  // Always 1.0
const linkCorruption = metrics.corruption ?? 0.2;

if (linkHarmony > linkCorruption) {  // Always true (1.0 > 0.2)
  emitter.update(...);  // Emits continuously
}
```

**Impact:**
- Healing particles emit continuously
- Visual feedback doesn't match actual harmony state
- Player sees healing effects when corruption should be dominant

**Recommended Fix:**
Fix upstream issues (#1 and #2) to provide correct harmony data.

---

#### 6. HarmonicSyncEffectApplier Operates in Isolation

**Severity:** MEDIUM  
**Location:** HarmonicSyncEffectApplier.js  
**Impact:** Sync effects based on wrong harmony baseline

**Description:**
`HarmonicSyncEffectApplier` receives sync feedback from `NodeHarmonicSyncController`, which operates on wrong harmony baseline due to disconnection from `HarmonyStabilizationSystem_v1`.

**Impact:**
- Frequency synchronization uses wrong values
- Phase alignment based on incorrect data
- Visual sync effects don't reflect actual harmony state

**Recommended Fix:**
Fix upstream issue (#3) to connect `NodeHarmonicManager` to `HarmonyStabilizationSystem_v1`.

---

### Low Issues

#### 7. Legacy Variables Still Used

**Severity:** LOW  
**Impact:** Code clarity, maintenance

**Description:**
Legacy harmony variables (`node.userData.harmony`, `link.userData.harmony`) are still read by some systems, creating confusion about which variable to use.

**Affected Systems:**
- HarmonicNodeResonanceHalos.js
- MegaGlyphSystem.js
- _AtomaGlyphSystem4_0.js
- _AdaptiveGlyphRendering1_0.js

**Recommended Fix:**
Update all systems to read from canonical source (`node.userData.harmonyLevel` or `HarmonyStabilizationSystem_v1.nodeHarmony`).

---

#### 8. Missing Integration Between Systems

**Severity:** LOW  
**Impact:** System coherence

**Description:**
`HarmonyStabilizationSystem_v1` and `NodeHarmonicManager` operate independently without any coordination or data exchange.

**Recommended Fix:**
Establish clear integration points:
1. `HarmonyStabilizationSystem_v1` should provide network-level metrics
2. `NodeHarmonicManager` should consume those metrics
3. Both systems should share the same harmony source

---

## SUMMARY OF ROOT CAUSES

### Why Harmony VFX Changes Are Not Visible

1. **PRIMARY CAUSE:** `PHASE_C3_METRIC_WRITE_LOCK = true` blocks data flow from internal Maps to userData
2. **SECONDARY CAUSE:** Visual systems read shadow metrics instead of authoritative source
3. **TERTIARY CAUSE:** `NodeHarmonicManager` disconnected from `HarmonyStabilizationSystem_v1`
4. **CONTRIBUTING FACTORS:** Multiple shadow variables create confusion and incorrect reads

### Data Flow State

- **Computation:** ✅ Working correctly (internal Maps contain correct values)
- **Propagation:** ❌ Blocked (write lock prevents userData updates)
- **Consumption:** ❌ Wrong source (visual systems read shadows)
- **Visualization:** ❌ Invisible (wrong data produces wrong or no effects)

---

## RECOMMENDED FIX PRIORITY

### Immediate (Critical Path)

1. **Set `PHASE_C3_METRIC_WRITE_LOCK = false`** in HarmonyStabilizationSystem_v1.js
   - This alone may fix most issues
   - Quick to test and verify

2. **Update `LinkRendererConduit._readLinkMetrics()`** to read from authoritative source
   - Ensures visual systems get correct data
   - Provides fallback if lock is needed

3. **Connect `NodeHarmonicManager` to `HarmonyStabilizationSystem_v1`**
   - Fixes harmonic hub synchronization baseline
   - Requires adding network-level metric methods

### Short-term (Within Sprint)

4. **Deprecate legacy variables** and update all readers
   - Reduces confusion and shadow metric issues
   - Improves code maintainability

5. **Add documentation** to authoritative data sources
   - Clear comments indicating which variable is the source of truth
   - Migration guide for developers

### Long-term (Technical Debt)

6. **Implement Metrics Authority Pattern**
   - Centralize metric access through APIs
   - Prevent direct access to internal Maps
   - Enforce single source of truth

7. **Audit all metrics** (not just harmony) for similar issues
   - Corruption may have same problems
   - Synergy and stability may need review

---

## VERIFICATION STEPS

After implementing fixes, verify:

1. **Harmony Computation:**
   - `HarmonyStabilizationSystem_v1.nodeHarmony.get(nodeId).level` contains correct values
   - `HarmonyStabilizationSystem_v1.linkHarmony.get(linkId).level` contains correct values

2. **Data Propagation:**
   - `node.userData.harmonyLevel` matches internal Map value
   - `link.userData.harmonyLevel` matches internal Map value

3. **Visual Consumption:**
   - `LinkRendererConduit._readLinkMetrics(link).harmony` returns correct value
   - Link shader uniform `uHarmony` contains correct value

4. **Visual Output:**
   - Healing particles emit only when harmony > corruption
   - Harmony-based shader effects visible and correct
   - Harmonic hub synchronization operates on correct baseline

5. **System Integration:**
   - `NodeHarmonicManager.update()` receives actual network harmony
   - Harmonic sync effects reflect actual harmony state

---

## CONCLUSION

The harmony metric computation system is working correctly internally, but data flow to visual systems is broken by a combination of:

1. A metric write lock that prevents propagation to userData
2. Visual systems reading shadow metrics instead of authoritative source
3. Disconnection between harmony computation and harmonic synchronization systems

**Fixing the write lock alone should resolve most visibility issues.** The additional fixes will ensure system coherence and prevent future regressions.

The root architectural issue is the lack of clear authority over metric data. Multiple systems read and write to various "shadow" variables, creating confusion and incorrect behavior. Establishing a canonical source and enforcing single-writer/single-reader patterns will prevent similar issues in the future.

---

**Audit Complete.**