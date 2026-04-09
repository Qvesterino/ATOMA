# ATOMA METRICS PROPAGATION AUDIT

**Date**: 2026-03-18  
**Auditor**: Autonomous ATOMA Engineer  
**Scope**: How metrics flow from calculation to visuals

---

## EXECUTIVE SUMMARY

ATOMA metrics propagate through a **three-layer architecture**:

1. **Computation Layer**: `NodeMetricEngine.js` calculates canonical metrics (10 Hz)
2. **Transport Layer**: Semantic bus events and direct reads from `node.userData.metrics`
3. **Visual Layer**: Controllers and shaders consume metrics for visualization

### Key Findings

- ✅ **Clear propagation chain**: Metrics flow from computation → transport → visualization
- ✅ **Event-driven updates**: Semantic bus (`semanticBus`) provides real-time metric updates to visual systems
- ✅ **Canonical storage**: All metrics stored in `node.userData.metrics` (0-1 normalized)
- ✅ **Multiple visual consumers**: Node and link visuals consume metrics independently
- ⚠️ **Mixed transport methods**: Some systems use event bus, others use polling
- ⚠️ **Multiple visual layers**: Some visuals read canonical, some read derived

---

## 1. METRICS COMPUTATION (SOURCE)

### Canonical Calculator

**File**: `src/metrics/NodeMetricEngine.js`  
**Frequency**: 10 Hz (fixed 0.1s timestep)  
**Authority**: SINGLE WRITER (enforced by MetricAuthorityGuard)

```javascript
// Canonical storage location
node.userData.metrics = {
  synergy: 0.0,      // Derived metric
  harmony: 0.0,      // Interactive metric
  stability: 0.0,    // Interactive metric
  corruption: 0.0,  // Interactive metric
  loadPressure: 0.0  // Interactive metric
};
```

**Computation Functions**:
- `deriveSynergy()` - Derived from harmony, stability, corruption, load
- `applyCrossMetricInteractions()` - Updates harmony, stability, corruption, load

**Publication**:
- Writes to `node.userData.metrics`
- Publishes events via `semanticBus`:
  - `metric.node.updated` - When any node metric changes
  - `event:harmonyResonance` - When harmony state changes

---

## 2. TRANSPORT LAYER

### Event-Driven Transport (Primary)

**Event**: `metric.node.updated`  
**Emitter**: `NodeMetricEngine.js` (via `MetricsRuntime_v1.js`)  
**Subscribers**: Visual systems requiring real-time updates

**Payload Structure**:
```javascript
{
  nodeId: string|number,
  metric: 'synergy' | 'harmony' | 'stability' | 'corruption' | 'loadPressure',
  value: number (0-1 normalized)
}
```

**Subscribers Identified**:
1. `NodeDynamicMetrics.js` - VisualDerivedMetrics class
2. `HarmonicNodeResonanceHalos.js` - Harmony event subscription

### Direct Polling (Fallback)

**Location**: `node.userData.metrics`  
**Used by**: Systems that don't subscribe to events
**Frequency**: Per-frame or periodic updates

**Readers Identified**:
1. `HarmonicNodeResonanceHalos.js` - Falls back to `node.userData.metrics` when semanticBus unavailable
2. `NeonLinkVisuals.js` - Reads from link state cache (populated by link registration)
3. Various HUD systems - Read from `window.__ATOMA_LIVE_METRICS__`

### Network-Level Transport

**Location**: `window.__ATOMA_LIVE_METRICS__`  
**Emitter**: `NetworkMetricsAggregator.js`  
**Frequency**: 2 Hz (background aggregation)

**Published Metrics**:
```javascript
{
  networkSynergy: number,
  harmonyFlow: number,
  networkStress: number,  // inverted stability
  corruptionLevel: number,
  loadPressure: number
}
```

---

## 3. VISUAL LAYER

### 3.1 Node Visual Controllers

#### HarmonicNodeResonanceHalos.js

**Role**: Visualizes harmonic hub state with resonance halos  
**Transport**: Event-driven + polling fallback  
**Update Frequency**: Per-frame (delta time)

**Metrics Consumed**:
```javascript
{
  harmony: number,       // 0-1 → halo color (blue base)
  synergy: number,       // 0-1 → brightness boost
  corruption: number,    // 0-1 → red tint, distortion, wobble
  stability: number,     // 0-1 → breathing irregularity
  resilience: number     // 0-1 → stability damping, recovery speed
}
```

**Visual Outputs**:
- Material: `emissive` (color + intensity)
- Scale: Breathing animation (±3-6% oscillation)
- Geometry: Distortion from corruption
- Color: Interpolation between harmony/synergy/corrupted palettes

**Shader Uniforms**: None (uses standard MeshBasicMaterial properties)

**Propagation Chain**:
```
NodeMetricEngine.compute()
  ↓ (semanticBus: event:harmonyResonance)
HarmonicNodeResonanceHalos._harmonyResonanceHandler()
  ↓ (writes to this.harmonyByNode)
HarmonicNodeResonanceHalos.update()
  ↓ (reads harmonyByNode OR node.userData.metrics)
HarmonicNodeResonanceHalos.applyHaloVisuals()
  ↓ (writes to mesh.material.emissiveIntensity, scale)
Visual output
```

---

#### NodeDynamicMetrics.js (VisualDerivedMetrics)

**Role**: Derives visual metrics from canonical metrics  
**Transport**: Event-driven subscription + polling fallback  
**Update Frequency**: Per-frame (if `frameScheduler.shouldRunVisual()`)

**Metrics Consumed**:
```javascript
{
  synergy: number,       // 0-1 → 0-100 (visual)
  harmony: number,        // 0-1 → 0-100 (visual)
  stability: number,      // 0-1 → 0-100 (visual)
  corruption: number,     // 0-1 → 0-100 (visual)
  loadPressure: number    // 0-1 → 0-100 (visual)
}
```

**Visual Outputs**:
```javascript
node.userData.visualMetrics = {
  // Structural
  linkCount: number,
  incomingLinks: number,
  outgoingLinks: number,
  loadMax: number,
  loadRatio: number,

  // Visual metrics (0-100 scale)
  stability: number,    // 0-100
  harmony: number,      // 0-100
  synergy: number,      // 0-100
  corruption: number,   // 0-100
  loadPressure: number, // 0-100

  updatedAt: timestamp
};
```

**Propagation Chain**:
```
NodeMetricEngine.compute()
  ↓ (semanticBus: metric.node.updated)
VisualDerivedMetrics._metricSubscriptionDisposer
  ↓ (writes to this._nodeMetricCache)
VisualDerivedMetrics._updateNodeVisuals()
  ↓ (reads from _nodeMetricCache OR node.userData.metrics)
VisualDerivedMetrics._clamp100(value * 100)
  ↓ (writes to node.userData.visualMetrics)
Consumed by other visual systems
```

---

### 3.2 Link Visual Controllers

#### NeonLinkVisuals.js

**Role**: Visualizes links with shader-driven effects  
**Transport**: Link state registration + manual updates  
**Update Frequency**: Per-frame (60 Hz)

**Metrics Consumed**:
```javascript
{
  corruption: number,  // 0-1 → red color tint, instability
  synergy: number,     // 0-1 → flow particles, bonding effects
  harmony: number      // 0-1 → motion damping, stabilization
}
```

**Visual Outputs**:
- Material colors: `material.color`, `material.emissive`
- Shader uniforms: `uColor`, `uStress`, `uFlow`, `uOpacity`, `uWidth`
- Particles: Synergy flow particles (awakened/strong states)
- Geometry: Corruption-induced misalignment

**Propagation Chain**:
```
Link registration: neonLinkVisuals.registerLink(linkId, mesh)
  ↓ (creates state)
this.linkStates.set(linkId, {
  mesh,
  corruption: 0,
  synergy: 0,
  harmony: 0,
  ...
})

Manual update: neonLinkVisuals.updateLinkState(linkId, metrics)
  ↓ (writes to linkStates)
this.linkStates.get(linkId).corruption = metrics.corruption;
this.linkStates.get(linkId).synergy = metrics.synergy;
this.linkStates.get(linkId).harmony = metrics.harmony;

Per-frame: neonLinkVisuals.updateMetricLinks(deltaTime)
  ↓ (reads from linkStates)
for (const [linkId, state] of this.linkStates.entries()) {
  const { corruption, synergy, harmony } = state;
  const metricColor = this._computeMetricColor(corruption, synergy, harmony);
  const pulse = this._computeEmissivePulse(corruption, synergy, harmony);
  this._applyMetricMaterial(material, metricColor, pulse);
}

Shader uniforms: material.uniforms.uColor.value, uStress.value, etc.
```

---

## 4. SHADER UNIFORMS (FINAL DESTINATION)

### Link Shader Uniforms

**File**: `NeonLinkVisuals.js`  
**Shader**: `linkShader` (vertex + fragment)

| Uniform | Metric Source | Visual Effect |
|---------|--------------|----------------|
| `uColor` | corruption, synergy, harmony (RGB mapping) | Link color (R=corruption, G=harmony, B=synergy) |
| `uStress` | corruption, loadPressure, network stress | Fractures, kinks, micro dropout |
| `uFlow` | synergy state, traffic | Flow trace animation speed |
| `uOpacity` | corruption, degradation state | Overall visibility |
| `uWidth` | priority tier, load pressure | Line thickness |
| `uTime` | global time | All time-based animations |

**Color Mapping**:
```javascript
// NeonLinkVisuals.js: _computeMetricColor()
const r = Math.max(0, Math.min(1, corruption));   // Red = corruption
const g = Math.max(0, Math.min(1, harmony));      // Green = harmony
const b = Math.max(0, Math.min(1, synergy));      // Blue = synergy
```

**Pulsing**:
```javascript
// NeonLinkVisuals.js: _computeEmissivePulse()
const dominant = Math.max(corruption, synergy, harmony);
const pulseSpeed = 1.0 + dominant * 2.0;  // 1x to 3x speed
const emissiveIntensity = 0.3 + dominant * 0.7;  // 0.3 to 1.0
```

### Node Shader Uniforms

**Files**: Multiple visual controllers  
**Uniforms**: Vary by system

| System | Uniform | Metric | Effect |
|--------|---------|--------|--------|
| HarmonicNodeResonanceHalos | `emissiveIntensity` | harmony, synergy, corruption | Halo brightness |
| HarmonicNodeResonanceHalos | `emissive.r/g/b` | harmony, synergy, corruption | Halo color |
| StressVisualShaderSystem | `uStressIntensity` | stability, corruption | Turbulence intensity |
| StressVisualShaderSystem | `uStressPulsePhase` | stability, corruption | Pulse phase |
| StressVisualShaderSystem | `uStressPulseRate` | stability, corruption | Pulse speed |
| LinkCorruptionTransmission | `corruptionTint.r/g/b` | corruption | Red/orange glow |

---

## 5. METRIC CONSUMPTION MATRIX

### By System

| System | Synergy | Harmony | Stability | Corruption | LoadPressure | Transport Method |
|--------|---------|---------|-----------|-------------|--------------|------------------|
| HarmonicNodeResonanceHalos | ✅ | ✅ | ✅ | ✅ | ❌ | Event + polling |
| NodeDynamicMetrics | ✅ | ✅ | ✅ | ✅ | ✅ | Event + polling |
| NeonLinkVisuals | ✅ | ✅ | ❌ | ✅ | ❌ | Link state registration |
| StressVisualShaderSystem | ❌ | ❌ | ✅ | ✅ | ❌ | Unknown (likely polling) |
| LinkCorruptionTransmission | ❌ | ❌ | ❌ | ✅ | ❌ | Unknown (likely polling) |
| CoreMetricsCalculator | ✅ | ✅ | ✅ | ✅ | ✅ | Aggregation (2 Hz) |

### By Output Type

| Output | Metrics Used | Location |
|--------|--------------|----------|
| `node.userData.visualMetrics` | All | NodeDynamicMetrics |
| `material.emissiveIntensity` | harmony, synergy, corruption | HarmonicNodeResonanceHalos |
| `material.emissive.r/g/b` | harmony, synergy, corruption | HarmonicNodeResonanceHalos |
| `material.color.r/g/b` | harmony, synergy, corruption | NeonLinkVisuals |
| `material.uniforms.uColor` | harmony, synergy, corruption | NeonLinkVisuals |
| `material.uniforms.uStress` | corruption, loadPressure | NeonLinkVisuals |
| `material.uniforms.uFlow` | synergy, traffic | NeonLinkVisuals |
| `material.uniforms.corruptionTint` | corruption | LinkCorruptionTransmission |
| `window.__ATOMA_LIVE_METRICS__` | All (aggregated) | NetworkMetricsAggregator |

---

## 6. DATA FLOW DIAGRAMS

### Node Metrics Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      METRICS COMPUTATION                          │
│                  NodeMetricEngine.js (10 Hz)                     │
│  deriveSynergy() → applyCrossMetricInteractions() → ...         │
└────────────────────────────────────┬──────────────────────────────┘
                                     │
                                     ├─→ [write] node.userData.metrics (canonical)
                                     │
                                     └─→ [emit] semanticBus: metric.node.updated
                                                  │
                      ┌───────────────┼───────────────┐
                      │               │               │
                      ▼               ▼               ▼
         ┌────────────────────┐ ┌──────────┐ ┌──────────────────┐
         │ Event Subscription  │ │ Polling  │ │ Network Aggregation│
         │ VisualDerivedMetrics│ │ (fallback)│ │ NetworkMetrics... │
         └────────┬───────────┘ └─────┬────┘ └────────┬───────────┘
                  │                 │                │
                  ▼                 │                ▼
         ┌────────────────────┐     │     ┌─────────────────────┐
         │ _nodeMetricCache   │     │     │ __ATOMA_LIVE_METRICS │
         │ (event-driven)     │     │     │ (network-level)      │
         └────────┬───────────┘     │     └─────────────────────┘
                  │                 │                │
                  ▼                 ▼                │
         ┌────────────────────┐     │                │
         │ node.userData      │─────┘                │
         │ .visualMetrics    │                      │
         │ (0-100 scale)     │                      │
         └────────┬───────────┘                      │
                  │                                │
                  ▼                                ▼
         ┌────────────────────┐          ┌─────────────────────┐
         │ Visual Controllers │          │ HUD Systems          │
         │ (halos, auras, ...)│          │ (CoreMetricsHUD, ...)│
         └────────┬───────────┘          └─────────────────────┘
                  │
                  ▼
         ┌────────────────────┐
         │ Shader Uniforms   │
         │ emissive, color,  │
         │ scale, etc.       │
         └────────────────────┘
```

### Link Metrics Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      METRICS COMPUTATION                          │
│                  NodeMetricEngine.js (10 Hz)                     │
│  (node metrics → link aggregation)                               │
└────────────────────────────────────┬──────────────────────────────┘
                                     │
                                     ├─→ [compute] link corruption, synergy, harmony
                                     │
                                     ▼
                         ┌─────────────────────┐
                         │ Link State Tracking │
                         │ NeonLinkVisuals.js  │
                         │ registerLink()      │
                         └────────┬────────────┘
                                  │
                                  ├─→ [store] this.linkStates[linkId]
                                  │     { corruption, synergy, harmony, ... }
                                  │
                                  ▼
                         ┌─────────────────────┐
                         │ updateLinkState()   │
                         │ (manual trigger)    │
                         └────────┬────────────┘
                                  │
                                  ▼
                         ┌─────────────────────┐
                         │ updateMetricLinks() │
                         │ (per-frame 60 Hz)  │
                         └────────┬────────────┘
                                  │
                                  ▼
                         ┌─────────────────────┐
                         │ _computeMetricColor │
                         │ R=corruption       │
                         │ G=harmony          │
                         │ B=synergy          │
                         └────────┬────────────┘
                                  │
                                  ▼
                         ┌─────────────────────┐
                         │ _applyMetricMaterial│
                         │ material.color      │
                         │ material.emissive   │
                         └────────┬────────────┘
                                  │
                                  ▼
                         ┌─────────────────────┐
                         │ Shader Uniforms     │
                         │ uColor             │
                         │ uStress            │
                         │ uFlow              │
                         │ uOpacity           │
                         └─────────────────────┘
```

---

## 7. METRIC TRANSFORMATIONS

### Normalization Scales

| Scale | Range | Location | Usage |
|-------|-------|----------|-------|
| Canonical | 0.0 - 1.0 | `node.userData.metrics.*` | Computation, interactions |
| Visual | 0 - 100 | `node.userData.visualMetrics.*` | HUD display, some visuals |
| Network | 0.0 - 1.0 | `window.__ATOMA_LIVE_METRICS__.*` | Network-wide metrics |
| Legacy | 0 - 100 | Various | Deprecated systems |

### Color Mapping

**RGB Mapping (NeonLinkVisuals)**:
```javascript
color.r = corruption;  // Red = bad state
color.g = harmony;     // Green = stable
color.b = synergy;     // Blue = beneficial
```

**Hue Mapping (HarmonicNodeResonanceHalos)**:
```javascript
// Harmony: blue (0.6, 0.6, 1.0)
// Synergy: cyan (0.0, 1.0, 1.0)
// Corrupted: red (1.0, 0.2, 0.2)
// Stressed: orange (1.0, 0.6, 0.2)
```

### Intensity Mapping

**Emissive Intensity**:
```javascript
// HarmonicNodeResonanceHalos
intensity = baseIntensity * hubSyncStrength;
intensity *= (0.8 + synergy * 0.4);          // Synergy boost
intensity *= (1.0 - corruption * 0.3);       // Corruption penalty
intensity *= (1.0 - instability * 0.4);      // Instability penalty
```

**Pulse Speed**:
```javascript
// NeonLinkVisuals
pulseSpeed = 1.0 + dominant * 2.0;  // 1x to 3x based on dominant metric
```

---

## 8. SYSTEM INTEGRATION POINTS

### Initialization Order

1. **NodeMetricEngine** - Starts computing metrics (10 Hz)
2. **VisualDerivedMetrics** - Subscribes to metric events
3. **HarmonicNodeResonanceHalos** - Subscribes to harmony events
4. **NeonLinkVisuals** - Registers link states (manual)
5. **NetworkMetricsAggregator** - Starts aggregating (2 Hz)

### Update Loop Order

```
Frame Loop (60 Hz)
  ↓
MetricsRuntime.update(dt)
  ↓ (fixed timestep 0.1s)
NodeMetricEngine._step(0.1)
  ↓ (write to node.userData.metrics)
  ↓ (emit semanticBus events)
  ↓
VisualDerivedMetrics.update(dt)
  ↓ (read from _nodeMetricCache OR node.userData.metrics)
  ↓ (write to node.userData.visualMetrics)
  ↓
NeonLinkVisuals.update(dt)
  ↓ (updateMetricLinks)
  ↓ (update shader uniforms)
  ↓
HarmonicNodeResonanceHalos.update(dt)
  ↓ (applyHaloVisuals)
  ↓ (write to material properties)
```

---

## 9. ISSUES & RECOMMENDATIONS

### Issues Identified

#### 1. Mixed Transport Methods
**Problem**: Some visual systems use event subscriptions, others use polling.  
**Impact**: Inconsistent update timing, potential for stale data.  
**Severity**: Medium

**Recommendation**:
- Standardize on event-driven transport for real-time systems
- Use polling only for systems requiring aggregated data

#### 2. Link Metric Flow Unclear
**Problem**: Link metrics (corruption, synergy, harmony) are manually registered via `updateLinkState()`, but the source is unclear.  
**Impact**: Hard to trace how link metrics are computed.  
**Severity**: High

**Recommendation**:
- Audit link metric computation (likely in link system or derived from node metrics)
- Document link metric lifecycle

#### 3. Multiple Visual Layers
**Problem**: `node.userData.visualMetrics` vs direct shader uniform updates.  
**Impact**: Confusion about which systems should read from where.  
**Severity**: Low

**Recommendation**:
- Clarify separation: `visualMetrics` for UI/HUD, direct updates for real-time shaders
- Document which systems use which layer

#### 4. No Metric Value Validation
**Problem**: Visual systems don't validate metric ranges before using.  
**Impact**: Potential visual artifacts if metrics go out of range.  
**Severity**: Low

**Recommendation**:
- Add range clamping in visual controllers (already done in NodeDynamicMetrics)
- Add validation before setting shader uniforms

### Recommendations Summary

| Priority | Issue | Action |
|----------|-------|--------|
| High | Link metric flow unclear | Audit link metric computation |
| Medium | Mixed transport methods | Standardize on event-driven |
| Low | Multiple visual layers | Document usage patterns |
| Low | No metric validation | Add range checks |

---

## 10. APPENDIX: FILE REFERENCES

### Metric Computation

| File | Role | Frequency |
|------|------|-----------|
| `src/metrics/NodeMetricEngine.js` | Canonical calculator | 10 Hz |
| `MetricsRuntime_v1.js` | Orchestration | 10 Hz |
| `NetworkMetricsAggregator.js` | Network aggregation | 2 Hz |

### Visual Controllers (Node)

| File | Metrics Used | Output |
|------|--------------|--------|
| `HarmonicNodeResonanceHalos.js` | harmony, synergy, corruption, stability, resilience | Material emissive, scale |
| `NodeDynamicMetrics.js` | synergy, harmony, stability, corruption, loadPressure | visualMetrics (0-100) |
| `StressVisualShaderSystem.js` | stability, corruption | Shader uniforms |
| `CorruptionVisualFX_v1.js` | corruption | Visual effects |

### Visual Controllers (Link)

| File | Metrics Used | Output |
|------|--------------|--------|
| `NeonLinkVisuals.js` | corruption, synergy, harmony | Shader uniforms, particles |
| `LinkCorruptionTransmissionIntegrationPatch_v1.js` | corruption | corruptionTint uniform |
| `LinkShaderMetricsIntegration_v1.js` | stress, harmony | Shader uniforms |
| `LinkMetricsToVisualBridge_v1.js` | stress | Shader uniforms |

### Transport Layer

| File | Role | Event/Method |
|------|------|--------------|
| `globalThis.semanticBus` | Event bus | `metric.node.updated`, `event:harmonyResonance` |
| `node.userData.metrics` | Canonical storage | Direct read |
| `node.userData.visualMetrics` | Visual derived | Direct read |
| `window.__ATOMA_LIVE_METRICS__` | Network metrics | Direct read |

---

**Audit Complete**  
**Status**: Metrics propagation is well-structured with clear separation of concerns  
**Next Steps**: Audit link metric computation, standardize transport methods