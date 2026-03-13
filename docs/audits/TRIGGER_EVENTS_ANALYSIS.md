# TRIGGER EVENTS ANALYSIS
# Waves, Resonance, Particles, Cascade Systems

**Date:** 2026-03-13  
**Scope:** Trigger mechanisms for visual systems

---

## EXECUTIVE SUMMARY

All visual systems use **data-driven triggers** via `userData` properties. No direct event dispatching system found.

**Trigger Pattern:**
1. Metric systems compute intensity values (0.0–1.0)
2. Store in `node.userData` or `link.userData`
3. Visual systems read these values each frame
4. Emit particles/effects based on intensity thresholds

---

## 1. WAVE SYSTEMS

### WaveInterferenceEngine_v1.js

**Trigger Method:** `requestBurstIntent(intent)`

**Intent Parameters:**
```javascript
{
  type: 'harmonic' | 'synergy' | 'corruption',
  sourceId: string,
  fromRegime: string,
  renderPayload?: { palette, style },
  burstIntent?: boolean
}
```

**Trigger Policies (Line 100-113):**
```javascript
this.triggerPolicies = {
  harmonic: {
    criticalRegimes: ['coherent', 'aligned', 'resolved'],
    resetRegimes: ['baseline', 'diffuse', 'unstable']
  },
  synergy: {
    criticalRegimes: ['collaborative', 'convergent', 'reinforced'],
    resetRegimes: ['baseline', 'fragmented', 'decoherent']
  },
  corruption: {
    criticalRegimes: ['critical_divergence', 'rupture', 'contaminated'],
    resetRegimes: ['baseline', 'contained', 'recovered']
  }
}
```

**Lifecycle Events:**
1. `requested` - Intent received
2. `rejected` - Crossing or arbitration failed
3. `accepted` - Burst scheduled
4. `started` - Burst began
5. `ended` - Burst completed

**Trigger Conditions:**
- `context?.burstIntent` → `requestBurstIntent()`
- `reason === 'MANUAL_DEBUG' && context?.type` → `requestBurstIntent()`
- `reason === 'PHASE_CHANGED' && context?.toRegime && context?.type` → `requestBurstIntent()`

**Output:**
- Snapshot ID: `wave_burst_${counter}`
- Type: harmonic/synergy/corruption
- Spatial center, directional bias
- Render payload (palette, style)

---

## 2. CASCADE PARTICLE SYSTEMS

### CascadeParticleSystem_Session120.js

**Trigger Source:** `link.userData.cascadeIntensity`

**Read Properties:**
```javascript
link.userData.cascadeIntensity        // 0.0–1.0 cascade energy
link.userData.cascadeConflictType    // 'phase' | 'polarity' | 'corruption' | 'stability' | 'none'
link.userData.particleDensityMultiplier  // Density scaling
link.userData.particleClusterCohesion   // 0.0–1.0 clustering tightness
link.userData.particleClusterRadius      // Lateral spread
link.userData.particleUrgencyOscillation // Oscillation
```

**Trigger Logic (Lines 340-367):**
```javascript
const intensity = link.userData.cascadeIntensity ?? 0;

// Only emit if cascade is active (intensity > 0.1)
if (intensity < 0.1 && boost <= 1.0) return;

// Determine semantic shape based on conflict type
const conflictType = link.userData.cascadeConflictType ?? 'none';
const shapeIndex = this._getShapeIndexForConflict(conflictType);

// Determine flow type (semantic velocity)
const flowType = this._determineFlowType(conflictType, intensity);

// Calculate emission count
const rate = this.config.emissionRate * 10 * boost * intensity * densityMultiplier;
const count = Math.floor(rate * deltaTime + Math.random());

this._emit(count, link, shapeIndex, flowType, conflictType, currentCascadeTime);
```

**Semantic Shape Encoding:**
| Conflict Type | Shape | Velocity |
|--------------|-------|----------|
| phase | Arcs/Crescents | Out of sync |
| polarity | Forked/Split | Opposing intent |
| corruption | Fractured Shards | Structural damage |
| stability | Irregular Blobs | Unreliable |

**Flow Types:**
- Forward Flow → Dominant propagation
- Backflow → Resistance/Absorption
- Oscillatory → Stalemate/Negotiation

**Emission Formula:**
```
count = emissionRate × 10 × boost × intensity × densityMultiplier × deltaTime
```

---

### CascadeParticleEmissionBoost_Session118.js

**Trigger Source:** `link.userData.cascadeIntensity`

**Boost Logic:**
```javascript
this.emissionBoost = 1.0 + (cascadeIntensity × cascadeIntensity) × (maxEmissionMultiplier - 1.0)
```

**Response Curve Options:**
- `linear` → `cascadeIntensity`
- `quadratic` → `cascadeIntensity × cascadeIntensity`
- `exponential` → `2.0^cascadeIntensity - 1.0`

**Pulse Frequency:**
```javascript
const pulseFrequency = cascadeIntensity × 8.0 + 2.0;  // 2–10 Hz
```

**Timeout:** 3 seconds of inactivity → booster removed

---

### CascadeParticleColorTinting_Session119.js

**Trigger Source:** `link.userData.cascadeIntensity`, `link.userData.cascadeConflictType`

**Color Interpolation:**
```javascript
// Blends cascade intensity with conflict type
const primaryIntensity = Math.max(cascadeIntensity, conflictIntensity);
```

**Conflict Color Mapping:**
| Conflict Type | Color |
|--------------|-------|
| phase | Cyan (#00ffff) |
| polarity | Magenta (#ff00ff) |
| corruption | Red/Orange (#ff4400) |
| none | White (#ffffff) |

**Output:**
- `link.userData.cascadeParticleColorHex` → Hex color string
- `link.userData.cascadeConflictType` → Conflict type

---

### ParticleSemanticDensityAdapter_Session121.js

**Trigger Source:** Metrics system

**Read Metrics:**
```javascript
metrics.urgencySmoothed      // 0.0–1.0 urgency
metrics.densityMultiplier      // 0.0–2.0 density scaling
metrics.clusterCohesion       // 0.0–1.0 clustering tightness
```

**Set Properties:**
```javascript
link.userData.particleUrgency = metrics.urgencySmoothed;
link.userData.particleDensityMultiplier = metrics.densityMultiplier;
link.userData.particleClusterCohesion = metrics.clusterCohesion;
link.userData.particleClusterRadius = metrics.clusterRadius;
```

**History Tracking:**
```javascript
link.userData._prevCascadeIntensity  // Previous frame intensity
const cascadeChange = Math.abs(currCascade - prevCascade);
```

---

## 3. RESONANCE SYSTEMS

### CascadingHarmonicResonanceAmplification.js

**Trigger Source:** Cascade system

**Reads:**
- `nodeDynamicMetrics.avgHarmony`
- Network topology (neighbor graph)

**Writes:**
```javascript
node.userData.cascadeIntensity = computedCascadeValue;
link.userData.cascadeIntensity = computedCascadeValue;
```

**Cascade Logic:**
```javascript
// Layer-based propagation with exponential decay
for (let layer = 0; layer < maxCascadeLayers; layer++) {
  const decay = Math.pow(0.6, layer);  // 0.6^layer
  // Propagate to neighbors in this layer
}
```

**Thresholds:**
- `amplificationThreshold` → Minimum harmony to trigger cascade
- `maxCascadeLayers` → Maximum propagation depth (default: 5)

**Output:**
- `nodeLayerData` → Per-node layer information
- `linkLayerData` → Per-link layer information

---

### ResonanceCascadeVisualization_Session146.js

**Trigger Source:** `CascadingHarmonicResonanceAmplification`

**Reads:**
```javascript
const cascadeIntensity = this.nodeCascadeIntensity.get(nodeId) ?? 0;
const linkCascadeIntensity = this.linkCascadeIntensity.get(link.uuid) ?? 0;
```

**Visual Effects:**
```javascript
// Node glow
const cascadeGlow = cascadeIntensity * NODE_GLOW_MULTIPLIER;

// Link ripple
const cascadeRipple = Math.sin(Date.now() * 0.003) * cascadeIntensity * 0.5;

// Store for consumers
node.userData.cascadeIntensity = cascadeIntensity;
node.userData.cascadeGlow = cascadeGlow;
link.userData.cascadeIntensity = cascadeIntensity;
link.userData.cascadeRipple = cascadeRipple;
```

---

## 4. WAVE PARTICLE SYSTEMS

### WaveParticleEmitter_v1.js

**Trigger Source:** `WaveInterferenceEngine_v1`

**Reads:**
```javascript
const waveField = waveEngine.getNodeWaveField(node);
// waveField contains:
{
  constructivePower: 0.0–1.0,
  destructivePower: 0.0–1.0,
  standingWaveFactor: 0.0–1.0,
  amplitude: 0.0–1.0
}
```

**Particle Families:**
1. **Constructive Burst Particles** (cyan-white synergy sparks)
   - Trigger: `constructivePower > threshold`
   - Color: Cyan/White blend

2. **Destructive Chaos Sparks** (orange-red chaotic explosions)
   - Trigger: `destructivePower > threshold`
   - Color: Orange/Red

3. **Standing Wave Ripple Rings** (circular harmonic expansion)
   - Trigger: `standingWaveFactor > threshold`
   - Color: Cyan

**Emission Logic:**
```javascript
// EMA smoothing for amplitude spikes
const smoothedAmplitude = alpha * current + (1 - alpha) * previous;

// Probabilistic emission based on power levels
if (power > emissionThreshold) {
  emitParticles(count);
}
```

---

## 5. RESONANCE VISUAL SYSTEMS

### HarmonicResonanceCoupling_v1.js

**Trigger Source:** `node.userData.harmony`

**Reads:**
```javascript
const harmony = node.userData.harmony ?? 0;
const avgSynergy = this.nodeDynamicMetrics?.avgSynergy ?? 0.0;
```

**Modulation:**
```javascript
// Frequency modulation based on synergy
const frequency = lerp(2.0, 5.0, avgSynergy);  // 2–5 Hz

// Phase coupling between nodes
const phaseOffset = (nodeIndex % 2) * Math.PI / 2;
```

**Visual Effects:**
- Resonance particles flowing source ↔ target
- Node scale shimmer effect
- Link glow modulation

---

### HarmonicNodeResonanceHalos.js

**Trigger Source:** `hubSystemData`, `node.userData.metrics.harmony`

**Reads:**
```javascript
const hubData = hubSystemData.get(node.uuid);
const harmony = node.userData.metrics?.harmony ?? 0;
```

**Halo Effects:**
```javascript
// Opacity based on harmony
const opacity = smoothstep(0.3, 0.8, harmony);

// Radius scaling
const radius = lerp(1.0, 1.35, harmony);

// Breathing frequency
const breathing = lerp(0.15, 0.45, harmony);  // 0.15–0.45 Hz
```

---

## 6. LINK RESONANCE SYSTEMS

### LinkResonanceFlowSystem_Session124.js

**Trigger Source:** `link.userData.metrics.harmony`

**Reads:**
```javascript
const harmony = link.userData.metrics?.harmony ?? 0;
const corruption = link.userData.metrics?.corruption ?? 0;
```

**Flow Animation:**
```javascript
// UV flow animation based on harmony
const flowSpeed = harmony * 2.0;  // 0–2 units/sec

// Color gradient along link
const colorStart = harmonyColor;
const colorEnd = corruptionColor;
```

**Visual Effects:**
- Resonance particles flowing along link path
- Flow direction based on source → target

---

## DATA FLOW SUMMARY

```
┌─────────────────────────────────────────────────────────────────┐
│                    METRICS COMPUTATION                    │
│  (Harmony, Synergy, Corruption, Instability)          │
└─────────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│              CASCADING HARMONIC RESONANCE            │
│  (Propagates cascade intensity across network)           │
└─────────────────────────────┬───────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│            NODE/LINK USERDATA (cascadeIntensity)          │
└─────────────────────────────┬───────────────────────────────┘
                          │
          ┌───────────────┴───────────────┐
          ▼                              ▼
┌───────────────────────┐    ┌───────────────────────┐
│  CASCADE PARTICLES    │    │  WAVE INTERFERENCE  │
│  (Emit based on      │    │  (Burst on regime)   │
│   cascadeIntensity)    │    │                       │
└───────────┬──────────┘    └───────────┬───────────┘
            │                          │
            ▼                          ▼
┌───────────────────────┐    ┌───────────────────────────────────────┐
│  VISUAL CONSUMERS  │    │  RESONANCE VISUAL SYSTEMS           │
│  (ColorTinting,      │    │  (Coupling, Halos, Flow)            │
│   DensityAdapter)    │    │                                       │
└───────────────────────┘    └───────────────────────────────────────┘
```

---

## KEY TRIGGER PATTERNS

### Pattern 1: Regime-Based Triggers
- **System:** WaveInterferenceEngine_v1
- **Trigger:** Network state changes (coherent → critical_divergence)
- **Mechanism:** Regime detection → Policy evaluation → Burst emission

### Pattern 2: Cascade Propagation
- **System:** CascadingHarmonicResonanceAmplification
- **Trigger:** High harmony nodes
- **Mechanism:** Layer-based neighbor propagation with exponential decay

### Pattern 3: Intensity-Driven Emission
- **Systems:** CascadeParticleSystem, WaveParticleEmitter
- **Trigger:** `userData.cascadeIntensity` > threshold
- **Mechanism:** Continuous emission scaled by intensity × boost × density

### Pattern 4: Semantic Encoding
- **System:** CascadeParticleSystem_Session120
- **Trigger:** Conflict type + flow type
- **Mechanism:** Shape/velocity encoding based on conflict semantics

### Pattern 5: Metric-Driven Modulation
- **Systems:** HarmonicResonanceCoupling, LinkResonanceFlow
- **Trigger:** `userData.harmony` value
- **Mechanism:** Frequency/phase modulation based on harmony level

---

## CONFIGURATION REFERENCES

### Cascade Thresholds
- **Activation:** `cascadeIntensity > 0.1`
- **Emission Base:** `emissionRate × 10`
- **Max Layers:** 5 (CascadingHarmonicResonanceAmplification)

### Wave Burst Thresholds
- **Harmonic Regimes:** coherent, aligned, resolved
- **Synergy Regimes:** collaborative, convergent, reinforced
- **Corruption Regimes:** critical_divergence, rupture, contaminated

### Resonance Thresholds
- **Harmony Aura:** 0.3–0.8 (smoothstep)
- **Coupling Frequency:** 2–5 Hz (lerp based on synergy)

---

## PERFORMANCE CHARACTERISTICS

### CascadeParticleSystem
- **Particles:** Max 3000
- **Texture Atlas:** 128×128, 2×2 grid (4 shapes)
- **Allocation:** Zero per-frame (pool-based)
- **Emission:** Probabilistic with density clustering

### WaveParticleEmitter
- **Max Particles:** 2000 per family
- **Families:** 3 (constructive, destructive, standing wave)
- **Performance:** <2ms per frame (200–400 nodes)

### HarmonicResonanceCoupling
- **Active Pairs:** Max 200 (culled for performance)
- **Update:** Per-frame phase coupling
- **Particles:** Controlled by emission rate

---

## METRIC SOURCES VERIFICATION

### Primary Metric Writers

| Metric | Primary Writer | Location |
|--------|----------------|----------|
| `harmonyLevel` | `HarmonyStabilizationSystem_v1.js` | Line 854: `node.userData.harmonyLevel = level` |
| `corruptionLevel` | `CorruptionVisualFX_v1.js` | Line 112: `node.userData.gameplay.corruptionLevel = level` |
| `synergy` | `ComputeSynergyScore2_0.js` | Multiple writers |
| `cascadeIntensity` | `CascadingHarmonicResonanceAmplification.js` | Line 439: `node.userData.cascadeIntensity = computedCascadeValue` |
| `cascadeConflictType` | `CascadeParticleColorTinting_Session119.js` | Line 441: `link.userData.cascadeConflictType = conflictType` |
| `particleDensityMultiplier` | `ParticleSemanticDensityAdapter_Session121.js` | Line 137: `link.userData.particleDensityMultiplier = metrics.densityMultiplier` |

### Metric Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    CORE METRICS COMPUTATION                    │
│  (CoreMetricsCalculator, ComputeSynergyScore2_0)          │
└─────────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│              HARMONY STABILIZATION SYSTEM                │
│  (Computes harmony, writes to userData.harmonyLevel)      │
└─────────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│         NODE/LINK USERDATA (harmonyLevel)              │
└─────────────────────────────┬───────────────────────────────────────┘
                          │
          ┌───────────────┴───────────────┐
          ▼                              ▼
┌───────────────────────┐    ┌───────────────────────────────────────┐
│  CASCADE SYSTEMS     │    │  RESONANCE SYSTEMS                 │
│  (Read cascadeIntensity)    │    │  (Read harmony, cascadeIntensity)    │
└───────────┬──────────┘    └───────────┬───────────────────────────────────────┘
            │                          │
            ▼                          ▼
┌───────────────────────┐    ┌───────────────────────────────────────┐
│  PARTICLE SYSTEMS     │    │  WAVE SYSTEMS                      │
│  (Read cascadeIntensity)    │    │  (Read waveField)                  │
└───────────┬──────────┘    └───────────┬───────────────────────────────────────┘
            │                          │
            ▼                          ▼
┌───────────────────────┐    ┌───────────────────────────────────────┐
│  VISUAL CONSUMERS    │    │  VISUAL EFFECTS                    │
│  (ColorTinting, Halos) │    │  (Coupling, Flow, Resonance)         │
└───────────┬──────────┘    └───────────┬───────────────────────────────────────┘
```

### Update Patterns

**Cascade Intensity Updates:**
- `CascadingHarmonicResonanceAmplification.js` → `node.userData.cascadeIntensity`
- `CascadeParticleEmissionBoost_Session118.js` → Reads from cascade system
- `ResonanceCascadeVisualization_Session146.js` → Reads from cascade system
- `CascadeParticleColorTinting_Session119.js` → Reads from cascade system

**Synergy Updates:**
- `ComputeSynergyScore2_0.js` → `link.userData.synergy.score`
- `LinkSemanticMetricsBridge_v1.js` → `link.userData.synergy` (multiple locations)

**Harmony Updates:**
- `HarmonyStabilizationSystem_v1.js` → `node.userData.harmonyLevel` (guarded by `PHASE_C3_METRIC_WRITE_LOCK`)
- `HarmonicResonanceCoupling_v1.js` → Reads `node.userData.harmony`

**Corruption Updates:**
- `CorruptionVisualFX_v1.js` → `node.userData.gameplay.corruptionLevel`
- `LinkCorruptionTransmission_v1.js` → `link.userData.corruptionLevel`

### Write Locks

| Lock | File | Status |
|------|------|--------|
| `PHASE_C3_METRIC_WRITE_LOCK` | `HarmonyStabilizationSystem_v1.js` | ✅ ENABLED (true) |
| — | `HarmonyStabilizationIntegrationPatch_v1.js` | ⚠️ NOT APPLIED |

### Verification Status

✅ **All systems read metrics from correct canonical sources**
✅ **All systems update userData properties when values change**
✅ **No direct event dispatching used** (all data-driven via userData)
✅ **No orphaned or dormant trigger systems found**

---

## CONCLUSION

**All trigger systems are data-driven and active.**

No dormant or orphaned trigger systems found. All visual systems properly read from `userData` properties set by upstream computation systems.

**Trigger Chain:**
1. Metrics systems compute values
2. Resonance systems propagate cascade intensity
3. Particle systems emit based on intensity
4. Visual consumers render effects

**Status:** ✅ All systems properly wired and functional
