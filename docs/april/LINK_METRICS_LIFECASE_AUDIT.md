# LINK METRICS LIFECYCLE AUDIT

**Date:** 2026-03-18  
**Task:** Track complete lifecycle of link metrics from computation to render  
**Goal:** Identify where signal degrades or breaks for link visuals

---

## EXECUTIVE SUMMARY

**KEY FINDINGS:**
- ✅ **Node metrics originate** from HarmonyStabilizationSystem_v1 (OK)
- ✅ **Link harmony written** to `link.userData.harmonyLevel` (OK)
- ⚠️ **Link synergy calculated** on-the-fly by SemanticMetricAdapter (SUSPECT - no persistent storage)
- ⚠️ **Link corruption calculated** on-the-fly by SemanticMetricAdapter (SUSPECT - no persistent storage)
- ✅ **Link flowState.energy written** by LinkResonanceFlowIntegrationPatch (OK)
- ✅ **Renderer reads metrics** via _readLinkMetrics() (OK)
- ✅ **Shader uniforms updated** every frame (OK)

**POTENTIAL BREAKPOINTS:**
1. **Synergy/Corruption not persisted** - Calculated each frame, potential performance overhead
2. **No dedicated link.metrics write** - Metrics scattered across userData properties
3. **SemanticMetricAdapter is computational bottleneck** - Every link update calls this

---

## COMPLETE DATA FLOW CHAIN

```
┌─────────────────────────────────────────────────────────────────┐
│ PHASE 1: NODE METRICS (PRIMARY SOURCE)                          │
└─────────────────────────────────────────────────────────────────┘

HarmonyStabilizationSystem_v1.js (line 854)
    ↓ WRITE
node.userData.harmonyLevel (0-1, clamped)
    ↓ READ BY
SemanticMetricAdapter.js (canonical reader)
    ↓ PROVIDES TO
CoreMetricsCalculator.js (updates every frame @ 30Hz)

STATUS: ✅ OK
- Source exists and is active
- Values are clamped to 0-1 range
- Called regularly (30Hz)

┌─────────────────────────────────────────────────────────────────┐
│ PHASE 2: LINK METRICS - HARMONY                                  │
└─────────────────────────────────────────────────────────────────┘

HarmonyStabilizationSystem_v1.js (line 905)
    ↓ WRITE
link.userData.harmonyLevel (0-1, clamped)
    ↓ READ BY (via _readLinkMetrics)
LinkRendererConduit._readLinkMetrics() (line ~2400)

STATUS: ✅ OK
- Source exists and is active
- Values are clamped to 0-1 range
- Read by renderer every frame

┌─────────────────────────────────────────────────────────────────┐
│ PHASE 3: LINK METRICS - FLOWSTATE.ENERGY                         │
└─────────────────────────────────────────────────────────────────┘

LinkResonanceFlowIntegrationPatch_Session124.js (line 241)
    ↓ CALCULATES FROM NODES
const harmonyA = nodeA.userData?.harmonyLevel ?? 0;
const harmonyB = nodeB.userData?.harmonyLevel ?? 0;
    ↓ WRITES
link.userData.flowState.energy = (harmonyA * 0.5) + (harmonyB * 0.5);
    ↓ READ BY (via _readLinkMetrics)
LinkRendererConduit._readLinkMetrics() (line ~2400)

STATUS: ✅ OK
- Calculated from node harmony levels
- Preserves flow direction
- Updated in update loop

┌─────────────────────────────────────────────────────────────────┐
│ PHASE 4: LINK METRICS - SYNERGY (CALCULATED)                     │
└─────────────────────────────────────────────────────────────────┘

SemanticMetricAdapter.js (getLinkSynergy function)
    ↓ CALCULATES ON-THE-FLY
function getLinkSynergy(link) {
    // Reads from multiple sources:
    // - link.synergy (if exists)
    // - link.userData.synergy (if exists)
    // - link.userData.metrics?.synergy (if exists)
    // - link.group.userData.conduitState.metrics?.synergy (if exists)
    // - Default: 0.5
    return synergy;
}
    ↓ READ BY
LinkRendererConduit._readLinkMetrics() (line ~2400)

STATUS: ⚠️ SUSPECT
- **NO PERSISTENT STORAGE** - Calculated every frame
- Performance overhead: Every link update calls this
- Default fallback: 0.5 (may mask missing data)
- Potential bottleneck in hot path

┌─────────────────────────────────────────────────────────────────┐
│ PHASE 5: LINK METRICS - CORRUPTION (CALCULATED)                  │
└─────────────────────────────────────────────────────────────────┘

SemanticMetricAdapter.js (getLinkCorruption function)
    ↓ CALCULATES ON-THE-FLY
function getLinkCorruption(link) {
    // Reads from multiple sources:
    // - link.userData.corruption
    // - link.userData.corruptionLevel
    // - link.corruption
    // - link.corruptionLevel
    // - node corruption (aggregated)
    // Default: 0.0
    return corruption;
}
    ↓ READ BY
LinkRendererConduit._readLinkMetrics() (line ~2400)

STATUS: ⚠️ SUSPECT
- **NO PERSISTENT STORAGE** - Calculated every frame
- Performance overhead: Every link update calls this
- Complex fallback chain (6 sources)
- Potential bottleneck in hot path

┌─────────────────────────────────────────────────────────────────┐
│ PHASE 6: METRICS AGGREGATION (_readLinkMetrics)                  │
└─────────────────────────────────────────────────────────────────┘

LinkRendererConduit._readLinkMetrics(link)
    ↓ READS FROM MULTIPLE SOURCES
{
    synergy: getLinkSynergy(link),           // ← SemanticMetricAdapter
    harmony: readMetric(...),               // ← 6 fallback sources
    corruption: readMetric(...),             // ← 9 fallback sources
    instability: readMetric(...),            // ← 7 fallback sources
    stability: readMetric(...),              // ← 8 fallback sources
    traffic: readMetric(...),                // ← 5 fallback sources
    loadPressure: readMetric(...),           // ← 6 fallback sources
    quality: readMetric(...),                // ← 5 fallback sources
}
    ↓ RETURNS
Canonical metrics object
    ↓ USED BY
LinkRendererConduit.update() (every frame)

STATUS: ✅ OK (but complex)
- Comprehensive fallback chains
- Defensive programming (null checks)
- Performance cost: 40+ property reads per link per frame

┌─────────────────────────────────────────────────────────────────┐
│ PHASE 7: RENDERER UPDATE (LinkRendererConduit.update)             │
└─────────────────────────────────────────────────────────────────┘

LinkRendererConduit.update(link, deltaTime, time, frameStateOverride)
    ↓ CALLS
_readLinkMetrics(link) → metrics object
    ↓ USES METRICS FOR
{
    // Aura skin uniforms
    material.uniforms.uHarmony.value = metrics.harmony;
    material.uniforms.uCorruption.value = metrics.corruption;
    material.uniforms.uSynergy.value = metrics.synergy;
    
    // Strand uniforms
    mat.uniforms.uNetworkStress.value = metrics.loadPressure;
    mat.uniforms.uLocalLoad.value = metrics.traffic;
    mat.uniforms.uCorruption.value = metrics.corruption;
    
    // VFX calculations
    computeLinkVfxInput(frameState) → uses metrics
}
    ↓ UPDATES
Shader uniforms (every frame @ 30Hz)

STATUS: ✅ OK
- Metrics read every frame
- Shader uniforms updated
- VFX driven by metrics

┌─────────────────────────────────────────────────────────────────┐
│ PHASE 8: SHADER UNIFORM INTEGRATION                              │
└─────────────────────────────────────────────────────────────────┘

LinkRendererMetricsIntegrationBridge (via LinkShaderMetricsIntegration)
    ↓ UPDATES (every frame @ 30Hz)
material.uniforms.energy.value
material.uniforms.intensity.value
material.uniforms.uLoad.value
material.uniforms.uStress.value
material.uniforms.uCorruption.value
material.uniforms.uColorA.value.lerp() (based on harmony)
    ↓ USED BY
MultiStrandConduitShader (renders links)

STATUS: ✅ OK
- All uniforms exist
- Updated every frame
- Integrated with FrameScheduler (30Hz)

---

## WRITE OPERATIONS TO LINK METRICS

### Direct Writes

| Metric | Location | File | Status |
|---------|----------|------|--------|
| `link.userData.harmonyLevel` | Line 905 | HarmonyStabilizationSystem_v1.js | ✅ OK |
| `link.userData.flowState.energy` | Line 241 | LinkResonanceFlowIntegrationPatch_Session124.js | ✅ OK |
| `link.userData.harmony` | Line 854 | HarmonyStabilizationSystem_v1.js (writes to node) | ⚠️ Indirect |

### Calculated (No Direct Write)

| Metric | Calculation | File | Status |
|---------|-------------|------|--------|
| `link.synergy` | On-the-fly | SemanticMetricAdapter.js | ⚠️ SUSPECT |
| `link.corruption` | On-the-fly | SemanticMetricAdapter.js | ⚠️ SUSPECT |

---

## READ OPERATIONS BY RENDERER

### LinkRendererConduit._readLinkMetrics()

Reads from these sources (in priority order):

1. **Harmony:**
   - `link.userData.harmony`
   - `link.userData.harmonyLevel`
   - `link.userData.metrics.harmony`
   - `link.metrics.harmony`
   - `link.group.userData.conduitState.metrics.harmony`
   - `link.harmonyLevel`
   - `link.harmony`

2. **Corruption:**
   - `link.userData.metrics.corruption`
   - `link.metrics.corruption`
   - `link.group.userData.conduitState.metrics.corruption`
   - `link.userData.corruption`
   - `link.userData.corruptionLevel`
   - `link.corruption`
   - `link.corruptionLevel`
   - Node corruption (aggregated)
   - `getLinkCorruption(link)`

3. **Synergy:**
   - `getLinkSynergy(link)` → SemanticMetricAdapter

4. **Stability/Instability:**
   - `link.userData.stability`
   - `link.userData.stabilityLevel`
   - `link.userData.metrics.stability`
   - `link.metrics.stability`
   - `link.group.userData.conduitState.metrics.stability`
   - `link.stability`
   - `link.stabilityLevel`
   - Node stability (aggregated)

5. **Traffic/LoadPressure:**
   - `link.traffic.load`
   - `link.userData.traffic.load`
   - `link.userData.traffic`
   - `link.userData.metrics.traffic`
   - `link.metrics.traffic`

6. **Quality:**
   - `link.userData.quality.score`
   - `link.userData.quality`
   - `link.userData.metrics.quality`
   - `link.metrics.quality`
   - `link.group.userData.conduitState.metrics.quality`
   - `link.quality`

**Total:** 40+ property reads per link per frame

---

## BREAKPOINT ANALYSIS

### ✅ WORKING PHASES

1. **Node metrics source** (HarmonyStabilizationSystem_v1)
   - Exists and active
   - Values are written correctly
   - Clamped to 0-1 range

2. **Link harmony write** (HarmonyStabilizationSystem_v1:905)
   - Exists and active
   - Values are written correctly
   - Clamped to 0-1 range

3. **Link flowState.energy write** (LinkResonanceFlowIntegrationPatch:241)
   - Exists and active
   - Calculated from node harmony levels
   - Updated in update loop

4. **Metrics read** (LinkRendererConduit._readLinkMetrics)
   - Comprehensive fallback chains
   - Defensive programming
   - Returns safe defaults

5. **Shader uniform updates** (LinkRendererConduit.update)
   - Metrics read every frame
   - Shader uniforms updated
   - Integrated with FrameScheduler

### ⚠️ SUSPECT PHASES

1. **Synergy calculation** (SemanticMetricAdapter)
   - **NO PERSISTENT STORAGE**
   - Calculated every frame for every link
   - Performance overhead in hot path
   - Default fallback: 0.5 (may mask missing data)

2. **Corruption calculation** (SemanticMetricAdapter)
   - **NO PERSISTENT STORAGE**
   - Calculated every frame for every link
   - Complex fallback chain (6 sources)
   - Performance overhead in hot path

3. **Metrics aggregation** (_readLinkMetrics)
   - 40+ property reads per link per frame
   - Complex fallback chains
   - Performance overhead

### ❌ BROKEN PHASES

**NONE IDENTIFIED**

All phases are functional. The system works, but has performance concerns.

---

## WHERE THE SIGNAL "DIES"

The signal does not "die" - it flows correctly. However, there are **performance bottlenecks**:

1. **SemanticMetricAdapter is called every frame** for every link
   - Calculates synergy on-the-fly
   - Calculates corruption on-the-fly
   - Complex fallback chains

2. **No persistent link.metrics storage**
   - Metrics scattered across userData properties
   - Synergy and corruption are not cached
   - Re-calculated every frame

3. **40+ property reads per link per frame**
   - _readLinkMetrics reads from 40+ sources
   - Each read has null checks and type checks
   - Cumulative performance impact

---

## RECOMMENDATIONS

### 1. Cache Synergy and Corruption

**Current:**
```javascript
const synergy = getLinkSynergy(link); // Calculated every frame
const corruption = readMetric(...); // Calculated every frame
```

**Proposed:**
```javascript
// Write once when metrics change
link.userData.metrics = {
    synergy: calculatedSynergy,
    corruption: calculatedCorruption,
    // ... other metrics
};
```

### 2. Create Link Metrics Authority

Create a dedicated system that:
- Calculates all link metrics once per frame
- Writes to `link.userData.metrics`
- Uses cached values in renderer

### 3. Reduce Property Reads

Optimize `_readLinkMetrics()` to:
- Read from canonical source first
- Use cached values
- Reduce fallback chains

---

## CONCLUSION

**System Status:** ✅ WORKING (with performance concerns)

**Data Flow:** ✅ COMPLETE
- Node metrics → Link metrics → Renderer → Shader uniforms

**Breakpoints:** ⚠️ PERFORMANCE (not functionality)
- Synergy/Corruption calculated every frame
- No persistent storage for link metrics
- 40+ property reads per link per frame

**Visuals:** ✅ RENDERING
- Shader uniforms updated every frame
- Metrics drive VFX correctly
- Visual pipeline is "live"

**Root Cause of Issues:** NOT BROKEN, JUST SLOW
- The system works correctly
- Performance optimization needed
- Metric caching would improve frame rate

---

## COMPLETE CHAIN STATUS

```
HarmonyStabilizationSystem_v1 → node.userData.harmonyLevel     ✅ OK
                               ↓
SemanticMetricAdapter → canonical reader                     ✅ OK
                               ↓
CoreMetricsCalculator → updates every frame                   ✅ OK
                               ↓
LinkRendererMetricsIntegration → shader uniforms              ✅ OK
                               ↓
LinkRendererConduit._readLinkMetrics → reads all sources      ✅ OK (complex)
                               ↓
LinkRendererConduit.update → VFX calculations                 ✅ OK
                               ↓
LinkShaderMetricsIntegration → uniform updates                 ✅ OK
                               ↓
MultiStrandConduitShader → renders links                     ✅ OK

Link harmony write → link.userData.harmonyLevel               ✅ OK
Link flowState.energy write → link.userData.flowState.energy   ✅ OK
Link synergy calculation → on-the-fly (SemanticMetricAdapter)  ⚠️ SUSPECT (perf)
Link corruption calculation → on-the-fly (SemanticMetricAdapter) ⚠️ SUSPECT (perf)
```

---

**Created:** 2026-03-18  
**Author:** ATOMA Architect  
**Status:** COMPLETE - Link metrics lifecycle tracked from computation to render