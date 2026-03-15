# ATOMA CASCADE METRICS INTEGRATION AUDIT

**MODE:** READ ONLY  
**DATE:** 2026-03-15  
**AUDITOR:** ATOMA Architect Agent

---

## CIEĽ

Zistiť či cascade hodnoty sú súčasťou ATOMA metrics pipeline
a či by mali byť integrované ako first-class metrics.

------------------------------------------------

## 1️⃣ CASCADE VALUES SEARCH

### 1.1 CASCADE VALUES IN CODEBASE

**SEARCH RESULTS:** 80 occurrences found

**PRIMARY CASCADE VALUES:**
- `cascadeStrength` - Combined cascade strength [0-1]
- `cascadeAmplitude` - Resonance amplitude [0-1]
- `cascadePhase` - Cascade phase [0-2π]
- `cascadeLayer` - Layer depth [0-N]
- `cascadeSourceCount` - Number of cascade sources [0-N]

**SECONDARY CASCADE VALUES:**
- `cascadeType` - 'corruption', 'harmony', 'threat'
- `cascadeDepth` - Propagation depth
- `cascadeArrivalTime` - When cascade arrives

---

### 1.2 CASCADE DATA STORAGE

**FILE:** [`CascadingHarmonicResonanceAmplification.js:504-517`](CascadingHarmonicResonanceAmplification.js:504-517)

**STORAGE LOCATIONS:**

```javascript
// Internal cache (private)
node._cascadeLayer = layerData.layer || 0;
node._cascadeStrength = layerData.cascadeStrength || 0;
node._cascadeAmplitude = layerData.resonanceAmplitude || 0;
node._cascadePhase = layerData.cascadePhase || 0;
node._cascadeSourceCount = layerData.sourceCount || 0;

// Public userData (for visual systems)
node.userData.cascadeStrength = node._cascadeStrength;
node.userData.cascadeAmplitude = node._cascadeAmplitude;
node.userData.cascadePhase = node._cascadePhase;
```

**WAVE FIELD DATA:**
```javascript
node.userData.waveField.constructive = clamp(...);
node.userData.waveField.destructive = clamp(...);
node.userData.waveField.standing = clamp(...);
node.userData.waveField.amplitude = clamp(...);
node.userData.waveField.phase = toPhase0ToTwoPi(...);
```

---

## 2️⃣ METRICS PIPELINE CHECK

### 2.1 CANONICAL METRICS STRUCTURE

**FILE:** [`docs/contracts/MetricsAuthority.contract.md:10-18`](docs/contracts/MetricsAuthority.contract.md:10-18)

**REQUIRED KEYS (all float 0.0..1.0):**
- `node.userData.metrics.stability`
- `node.userData.metrics.corruption`
- `node.userData.metrics.loadPressure`
- `node.userData.metrics.harmony`
- `node.userData.metrics.synergy`

**CURRENT METRICS PIPELINE:**
```
NODE METRICS (10Hz fixed-step)
├─ node.userData.metrics.synergy      [0-1]
├─ node.userData.metrics.harmony       [0-1]
├─ node.userData.metrics.stability     [0-1]
├─ node.userData.metrics.corruption     [0-1]
└─ node.userData.metrics.loadPressure   [0-1]
```

---

### 2.2 CASCADE VALUES IN METRICS PIPELINE

**SEARCH RESULT:** ❌ NO CASCADE VALUES FOUND IN `node.userData.metrics.*`

**VERIFICATION:**
- Searched for: `node.userData.metrics.cascade*`
- Found: 0 occurrences
- **CONCLUSION:** Cascade values are NOT part of canonical metrics pipeline

---

## 3️⃣ CASCADE METRIC USAGE ANALYSIS

### 3.1 CONSUMER SYSTEMS (80 occurrences)

**PRIMARY CONSUMERS:**

1. **HarmonicHubAuraSystem_Session126.js** (line 268)
   - Reads: `hub.userData.cascadeStrength`
   - Uses: Field radius calculation

2. **HarmonicNodeResonanceHalos.js**
   - Reads: `node._cascadeStrength`, `node._cascadeAmplitude`, `node._cascadePhase`
   - Uses: Node halo intensity and phase

3. **LinkCascadePulseManager.js** (line 102, 230, 345)
   - Reads: `cascadeStrength`, `cascadePhase`, `cascadeArrivalTime`
   - Uses: Pulse propagation and timing

4. **CascadeParticleSystem_Session120.js**
   - Reads: `node.userData.cascadeStrength`, `node.userData.cascadeLayer`
   - Uses: Particle emission triggers

5. **CascadeParticleEmissionBoost_Session118.js**
   - Reads: `node.userData.cascadeStrength`
   - Uses: Emission boost multiplier

6. **CascadeParticleColorTinting_Session119.js**
   - Reads: `node.userData.cascadeStrength`
   - Uses: Color tinting intensity

7. **ParticleStreamCascadeAcceleration.js** (line 214-216)
   - Reads: `node._cascadeStrength`, `node._cascadeLayer`, `node._cascadeAmplitude`
   - Uses: Particle velocity acceleration

8. **ParticleSemanticDensityAdapter_Session121.js**
   - Reads: `node.userData.cascadeStrength`
   - Uses: Density adaptation

9. **ParticleCascadeFlowDeflection.js** (line 165-167)
   - Reads: `sourceNode._cascadeStrength`, `sourceNode._cascadeLayer`, `sourceNode._cascadeAmplitude`
   - Uses: Flow deflection calculation

10. **ResonanceCascadeVisualization_Session117B.js**
    - Reads: `cascadeStrength`
    - Uses: Ripple visualization

11. **CascadeResonanceWaveVisualization_Session146.js** (line 202, 237-268)
    - Reads: `pairCascadeStrength`, `cascadeStrength`
    - Uses: Wave visualization

12. **LinkCorruptionTransmission_v1.js** (line 2108, 2673-2887)
    - Reads: `cascadeStrength`
    - Uses: Threat cascade propagation

13. **EXAMPLES/CASCADING_RESONANCE_EXAMPLES.js** (lines 30, 35, 68, 73, 104, 147, 187, 248, 322, 343, 351, 378)
    - Reads: `node._cascadeStrength`, `node._cascadeAmplitude`, `node._cascadePhase`, `node._cascadeLayer`
    - Uses: Integration examples for visual systems

---

### 3.2 CASCADE VALUE SEMANTICS

**cascadeStrength [0-1]:**
- Combined cascade strength from all cascade sources
- Used for: Aura intensity, pulse rate, link glow, particle emission
- Computed: Multi-cascade interference (line 69 in CascadingHarmonicResonanceAmplification.js)

**cascadeAmplitude [0-1]:**
- Resonance amplitude at this layer
- Used for: Peak effect intensity, wave amplitude, particle velocity
- Computed: Maximum of all cascade strengths (line 297 in CascadingHarmonicResonanceAmplification.js)

**cascadePhase [0-2π]:**
- Cascade propagation phase
- Used for: Phase synchronization, pulse timing, shader uniforms
- Computed: Weighted average of cascade phases (line 303 in CascadingHarmonicResonanceAmplification.js)

**cascadeLayer [0-N]:**
- Layer depth in cascade propagation
- Used for: Depth-based attenuation, secondary hub detection
- Computed: Logarithmic scale based on combined strength (line 310 in CascadingHarmonicResonanceAmplification.js)

---

## 4️⃣ INTEGRATION REQUIREMENTS

### 4.1 SHOULD CASCADE BE A FIRST CLASS METRIC?

**ARGUMENTS FOR INTEGRATION:**

✅ **High Usage:** 13 visual systems consume cascade data
✅ **Semantic Meaning:** Cascade represents network-wide resonance propagation
✅ **Derived from Canonical Metrics:** Cascade is computed from harmony, synergy, corruption, resilience
✅ **Network-Wide Impact:** Cascade affects visual systems globally
✅ **Persistent State:** Cascade values are computed each frame (10 Hz)
✅ **Contract Compliance:** Cascade would fit metrics authority structure

**ARGUMENTS AGAINST INTEGRATION:**

❌ **Not a Node Property:** Cascade is a network-level propagation phenomenon
❌ **Transient:** Cascade values decay and disappear when propagation stops
❌ **Computationally Expensive:** Cascade propagation uses BFS over network topology
❌ **Already Isolated:** Cascade system has its own authority and update loop

---

### 4.2 INTEGRATION PROPOSAL

**OPTION 1: FULL INTEGRATION (FIRST CLASS METRIC)**

**Add to Canonical Metrics:**
```javascript
node.userData.metrics.cascadeStrength = node._cascadeStrength;
node.userData.metrics.cascadeAmplitude = node._cascadeAmplitude;
node.userData.metrics.cascadePhase = node._cascadePhase;
```

**Pros:**
- Cascade becomes part of metrics authority contract
- Unified metric access pattern
- Easier to track cascade in global aggregation
- Consistent with other metrics

**Cons:**
- Cascade is not a node-level property
- Violates metric contract (cascade is transient, not persistent)
- Increases metric authority complexity
- May confuse metric semantics

---

**OPTION 2: PARTIAL INTEGRATION (DERIVED METRIC)**

**Add as Derived Metric:**
```javascript
// In MetricsRuntime_v1._step()
if (node._cascadeStrength !== undefined) {
  node.userData.metrics.cascadeStrength = node._cascadeStrength;
  node.userData.metrics.cascadeAmplitude = node._cascadeAmplitude;
  node.userData.metrics.cascadePhase = node._cascadePhase;
}
```

**Pros:**
- Cascade is treated as derived metric (like synergy)
- Maintains cascade system authority
- Allows global aggregation
- Minimal contract violation

**Cons:**
- Still not a true node property
- Derived from external system (CascadingHarmonicResonanceAmplification)
- Requires cross-system coordination

---

**OPTION 3: NO INTEGRATION (KEEP ISOLATED)**

**Maintain Current Structure:**
```javascript
// Keep cascade values in userData only
node.userData.cascadeStrength = node._cascadeStrength;
node.userData.cascadeAmplitude = node._cascadeAmplitude;
node.userData.cascadePhase = node._cascadePhase;
```

**Pros:**
- Maintains cascade system authority
- Clear separation of concerns
- No contract violation
- Cascade remains network-level phenomenon

**Cons:**
- Cascade not part of metrics pipeline
- No global aggregation
- Inconsistent access pattern

---

## 5️⃣ RECOMMENDATION

### 5.1 PROPOSED SOLUTION: PARTIAL INTEGRATION

**RATIONALE:**

1. **Cascade is a Derived Phenomenon:**
   - Cascade is computed from harmony, synergy, corruption, resilience
   - It's not an independent node property
   - Similar to synergy (derived metric)

2. **High Visual Impact:**
   - 13 visual systems consume cascade data
   - Cascade affects global visual state
   - Should be trackable in metrics pipeline

3. **Minimal Contract Violation:**
   - Treat cascade as derived metric
   - Maintain cascade system authority
   - Allow global aggregation

4. **Backward Compatibility:**
   - Keep existing userData.cascade* for visual systems
   - Add metrics.cascade* for aggregation
   - No breaking changes

---

### 5.2 IMPLEMENTATION PLAN

**STEP 1: Update Metrics Authority Contract**

Add to [`docs/contracts/MetricsAuthority.contract.md`](docs/contracts/MetricsAuthority.contract.md):

```markdown
### Derived layer

- `synergy`
- `cascadeStrength`
- `cascadeAmplitude`
- `cascadePhase`

`synergy` and `cascade*` are strictly derived from base metrics.
They are not independent canonical writer targets.

Required rules:

`synergy = f(harmony, stability, corruption, loadPressure)`
`cascadeStrength = f(harmony, synergy, corruption, resilience, topology)`
`cascadeAmplitude = f(cascadeStrength, layer)`
`cascadePhase = f(cascadeStrength, layer, propagation)`

No direct manual writes to `node.userData.metrics.synergy` or
`node.userData.metrics.cascade*` outside authorized derivation step.
```

---

**STEP 2: Update CascadingHarmonicResonanceAmplification**

Modify [`CascadingHarmonicResonanceAmplification.js:514-517`](CascadingHarmonicResonanceAmplification.js:514-517):

```javascript
// Public userData (for visual systems)
node.userData.cascadeStrength = node._cascadeStrength;
node.userData.cascadeAmplitude = node._cascadeAmplitude;
node.userData.cascadePhase = node._cascadePhase;

// NEW: Add to metrics pipeline (derived metric)
if (!node.userData.metrics) {
  node.userData.metrics = {};
}
node.userData.metrics.cascadeStrength = node._cascadeStrength;
node.userData.metrics.cascadeAmplitude = node._cascadeAmplitude;
node.userData.metrics.cascadePhase = node._cascadePhase;
```

---

**STEP 3: Update MetricsRuntime_v1**

Add cascade metrics to global aggregation in [`MetricsRuntime_v1._publishLiveMetrics()`](MetricsRuntime_v1.js):

```javascript
// Add cascade metrics to global aggregation
const cascadeStrengthSum = this._aggregateMetric('cascadeStrength');
const cascadeAmplitudeSum = this._aggregateMetric('cascadeAmplitude');

window.world.metrics.global.cascadeStrength = cascadeStrengthSum;
window.world.metrics.global.cascadeAmplitude = cascadeAmplitudeSum;
```

---

**STEP 4: Update Visual Systems (Optional)**

Visual systems can read cascade from either location:
- `node.userData.cascadeStrength` (existing)
- `node.userData.metrics.cascadeStrength` (new)

No breaking changes required.

---

### 5.3 MIGRATION PATH

**PHASE 1: Contract Update** (READ ONLY)
- Update MetricsAuthority contract
- Document cascade as derived metric
- No code changes

**PHASE 2: Integration** (SAFE PATCH)
- Add cascade to node.userData.metrics
- Update MetricsRuntime_v1 aggregation
- Maintain backward compatibility

**PHASE 3: Verification** (READ ONLY)
- Verify cascade values in metrics pipeline
- Confirm global aggregation
- Check visual system compatibility

---

## 6️⃣ CASCADE METRIC STATUS

**CURRENT STATUS:** ❌ ISOLATED SYSTEM

**INTEGRATION LEVEL:** ❌ NO INTEGRATION

**METRICS PIPELINE:** ❌ CASCADE NOT PART OF METRICS AUTHORITY

**CONSUMER SYSTEMS:** ✅ 13 ACTIVE CONSUMERS

**RECOMMENDATION:** ⚠️ PARTIAL INTEGRATION (DERIVED METRIC)

---

## 7️⃣ SUMMARY

**FINDINGS:**

1. ✅ Cascade values are actively used by 13 visual systems
2. ✅ Cascade is computed from canonical metrics (harmony, synergy, corruption, resilience)
3. ❌ Cascade values are NOT part of node.userData.metrics.*
4. ❌ Cascade is NOT integrated into metrics authority contract
5. ❌ Cascade has NO global aggregation

**RECOMMENDATION:**

**PARTIAL INTEGRATION** - Treat cascade as derived metric

**RATIONALE:**
- Cascade is a derived phenomenon (computed from base metrics)
- High visual impact (13 consumer systems)
- Minimal contract violation (derived metric pattern)
- Backward compatible (keep existing userData.cascade*)

**NEXT STEPS:**

1. Update MetricsAuthority contract (READ ONLY)
2. Add cascade to node.userData.metrics (SAFE PATCH)
3. Update MetricsRuntime_v1 aggregation (SAFE PATCH)
4. Verify integration (READ ONLY)

---

**AUDIT COMPLETED:** 2026-03-15  
**AUDITOR:** ATOMA Architect Agent  
**MODE:** READ ONLY
