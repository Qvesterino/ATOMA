# Harmony Data Flow Analysis

Generated: 2026-03-18T19:29:00Z

## Overview

This document traces the real data flow chain from `harmony` metric through the visual pipeline.

## Data Flow Chain

```
HarmonyStabilizationSystem_v1
       ↓ (writes)
node.userData.harmonyLevel
       ↓ (read by)
SemanticMetricAdapter.js
       ↓ (canonical source)
Multiple Systems
       ↓ (read)
LinkRendererConduit.js (visual pipeline)
```

---

## 1. PRIMARY SOURCE: HarmonyStabilizationSystem_v1

**File:** [`HarmonyStabilizationSystem_v1.js`](HarmonyStabilizationSystem_v1.js:61)

**Write Location:** [`HarmonyStabilizationSystem_v1.js:854`](HarmonyStabilizationSystem_v1.js:854)

**Code:**
```javascript
const canonicalHarmony = (typeof node?.harmony === 'number') ? node.harmony : level;
node.userData.harmonyLevel = canonicalHarmony;
```

**Also Writes to Links:** [`HarmonyStabilizationSystem_v1.js:905`](HarmonyStabilizationSystem_v1.js:905)
```javascript
const canonicalHarmony = (typeof link?.harmony === 'number') ? link.harmony : level;
link.userData.harmonyLevel = canonicalHarmony;
```

**Write Behavior:**
- ✅ Writes to `node.userData.harmonyLevel`
- ✅ Writes to `link.userData.harmonyLevel`
- ✅ Guarded by `PHASE_C3_METRIC_WRITE_LOCK` (line43)
- ✅ Logs debug output when not locked
- ✅ Preserves existing `node.harmony` if it's a number

**Default Values:**
- Default: `0` (no harmony)
- Range: `0-1` (clamped)

---

## 2. CANONICAL READER: SemanticMetricAdapter

**File:** [`SemanticMetricAdapter.js`](SemanticMetricAdapter.js:1)

**Read Location:** [`SemanticMetricAdapter.js:52`](SemanticMetricAdapter.js:52)

**Code:**
```javascript
const harmony = firstDefined(
    node?.userData?.harmonyLevel,  // Canonical: HarmonyStabilizationSystem_v1 writes here
    metrics.harmony,
    metrics.harmonyNorm
);
```

**Read Behavior:**
- ✅ Prioritizes `node.userData.harmonyLevel` as canonical source
- ✅ Falls back to `metrics.harmony` and `metrics.harmonyNorm`
- ✅ Used by all systems reading harmony via SemanticMetricAdapter

**Systems Using This:**
- [`HarmonicInfluencePropagationSystem_Session127.js:291`](HarmonicInfluencePropagationSystem_Session127.js:291)
- [`LinkCorruptionTransmission_v1.js:865`](LinkCorruptionTransmission_v1.js:865)
- [`HarmonicCascadeAmplification_Session145.js:189`](HarmonicCascadeAmplification_Session145.js:189)
- [`LinkRendererConduit.js:2524`](LinkRendererConduit.js:2524)
- [`LinkRendererConduit.js:2555`](LinkRendererConduit.js:2555)
- [`LinkStateVisualLanguageIntegration.js:68`](LinkStateVisualLanguageIntegration.js:68)
- [`LinkSemanticPictogramSystem_Enhanced.js:827`](LinkSemanticPictogramSystem_Enhanced.js:827)
- [`NodeLinkingSystem.js:5062`](NodeLinkingSystem.js:5062)
- [`src/legacy/T2_HarmonyVisualConsumer_v1.js:233`](src/legacy/T2_HarmonyVisualConsumer_v1.js:233)
- [`T4004_HARMONY_HEALING_TEST_RUNNER.js:213`](T4004_HARMONY_HEALING_TEST_RUNNER.js:213)
- [`T4004_HARMONY_HEALING_TEST_RUNNER.js:298`](T4004_HARMONY_HEALING_TEST_RUNNER.js:298)
- [`T4004_HARMONY_HEALING_TEST_RUNNER.js:309`](T4004_HARMONY_HEALING_TEST_RUNNER.js:309)
- [`PHASE5_MultiNetworkManager_v1.js:315`](PHASE5_MultiNetworkManager_v1.js:315)

---

## 3. MODIFIERS (READ + WRITE): NetworkRituals_v1

**File:** [`NetworkRituals_v1.js`](NetworkRituals_v1.js:1)

**Write Locations:**
- [`NetworkRituals_v1.js:612`](NetworkRituals_v1.js:612) - Adds `refundPerParticipant`
- [`NetworkRituals_v1.js:318`](NetworkRituals_v1.js:318) - Subtracts `harmonyPerNode`

**Code:**
```javascript
// Line 612: Adds harmony
if (node.userData) {
    node.userData.harmonyLevel = (node.userData.harmonyLevel || 0) + refundPerParticipant;
}

// Line 318: Subtracts harmony
node.userData.harmonyLevel = (node.userData.harmonyLevel || 0) - harmonyPerNode;
```

**Write Behavior:**
- ✅ Reads `node.userData.harmonyLevel`
- ✅ Adds `refundPerParticipant` (positive)
- ✅ Subtracts `harmonyPerNode` (negative)
- ✅ Uses default value `0` if undefined

**Potential Issue:**
- ⚠️ NetworkRituals modifies harmony without checking if HarmonyStabilizationSystem is active
- ⚠️ Could conflict with HarmonyStabilizationSystem_v1's authority

---

## 4. VISUAL CONSUMER: T2_HarmonyVisualConsumer_v1

**File:** [`src/legacy/T2_HarmonyVisualConsumer_v1.js`](src/legacy/T2_HarmonyVisualConsumer_v1.js:1)

**Read Location:** [`src/legacy/T2_HarmonyVisualConsumer_v1.js:233`](src/legacy/T2_HarmonyVisualConsumer_v1.js:233)

**Code:**
```javascript
const harmonyLevel = node.userData.harmonyLevel ?? 0;
```

**Read Behavior:**
- ✅ Read-only consumer of `node.userData.harmonyLevel`
- ✅ Uses default value `0` if undefined
- ✅ Rendering only (zero gameplay logic)

---

## 5. VISUAL PIPELINE: LinkRendererConduit.js

**File:** [`LinkRendererConduit.js`](LinkRendererConduit.js:1)

**Read Locations:**
- [`LinkRendererConduit.js:2524`](LinkRendererConduit.js:2524) - Reads from `metrics.harmony`
- [`LinkRendererConduit.js:2555`](LinkRendererConduit.js:2555) - Reads from `metrics.harmony`
- [`LinkRendererConduit.js:3064`](LinkRendererConduit.js:3064) - Reads from `link.userData.harmonyLevel`

**Code:**
```javascript
// Line 2524: Reads from metrics
const harmonyLevel = metrics.harmony ?? 0.5;

// Line 2555: Reads from metrics
const harmonyLevel = metrics.harmony ?? 0.5;

// Line 3064: Reads from link.userData.harmonyLevel
let totalHarmony = link.userData?.harmonyLevel ??
```

**Read Behavior:**
- ✅ Reads `metrics.harmony` (from SemanticMetricAdapter)
- ✅ Reads `link.userData.harmonyLevel` (direct from HarmonyStabilizationSystem_v1)
- ✅ Falls back to `0.5` if undefined

**Data Flow:**
```
HarmonyStabilizationSystem_v1 → node.userData.harmonyLevel → SemanticMetricAdapter → LinkRendererConduit.js (visuals)
                               ↓
HarmonyStabilizationSystem_v1 → link.userData.harmonyLevel → LinkRendererConduit.js (visuals)
```

---

## 6. LINK FLOW INTEGRATION: LinkResonanceFlowIntegrationPatch_Session124

**File:** [`LinkResonanceFlowIntegrationPatch_Session124.js`](LinkResonanceFlowIntegrationPatch_Session124.js:1)

**Write Location:** [`LinkResonanceFlowIntegrationPatch_Session124.js:241`](LinkResonanceFlowIntegrationPatch_Session124.js:241)

**Code:**
```javascript
const harmonyA = nodeA.userData?.harmonyLevel ?? 0;
const harmonyB = nodeB.userData?.harmonyLevel ?? 0;
link.userData.flowState.energy = (harmonyA * 0.5) + (harmonyB * 0.5);
```

**Write Behavior:**
- ✅ Reads `node.userData.harmonyLevel` from connected nodes
- ✅ Calculates average: `(harmonyA + harmonyB) / 2`
- ✅ Writes to `link.userData.flowState.energy`
- ✅ Preserves existing flow direction
- ✅ Uses default value `0` if undefined

**Integration Point:**
- Connects [`LinkResonanceFlowSystem_Session124`](LinkResonanceFlowSystem_Session124.js:40) with harmony data
- Makes links "live" with harmony-driven energy
- Updates automatically in update loop

---

## 7. GUARD: HarmonicInfluencePropagationSystem_Session127

**File:** [`HarmonicInfluencePropagationSystem_Session127.js`](HarmonicInfluencePropagationSystem_Session127.js:1)

**Guard Location:** [`HarmonicInfluencePropagationSystem_Session127.js:276`](HarmonicInfluencePropagationSystem_Session127.js:276)

**Code:**
```javascript
// Guard: Only propagate if source node has stabilized harmony level
if (!node.userData?.harmonyLevel) continue;
```

**Guard Behavior:**
- ✅ Prevents propagation from nodes without `harmonyLevel`
- ✅ Ensures only stabilized nodes can emit influence
- ✅ Protects against undefined/null values

---

## 8. DEFAULT VALUES ANALYSIS

### Who Uses Default Values?

| System | Default Value | Source |
|---------|---------------|--------|
| HarmonyStabilizationSystem_v1 | `0` (no harmony) | ✅ PRIMARY |
| SemanticMetricAdapter | `undefined` (firstDefined) | ✅ CANONICAL |
| NetworkRituals_v1 | `0` (|| 0) | ⚠️ MODIFIER |
| T2_HarmonyVisualConsumer_v1 | `0` (?? 0) | ✅ CONSUMER |
| LinkResonanceFlowIntegrationPatch | `0` (?? 0) | ✅ INTEGRATION |
| LinkRendererConduit.js | `0.5` (?? 0.5) | ✅ VISUAL |

### Clamping Behavior

| System | Clamps | Range |
|---------|---------|--------|
| HarmonyStabilizationSystem_v1 | ✅ Yes | `0-1` |
| ATOMARhythmAuthority.js | ✅ Yes | `0-1` |
| Others | ❌ No | `undefined` |

### Overwrite Analysis

**Potential Conflicts:**

1. **NetworkRituals_v1** modifies `harmonyLevel` without checking HarmonyStabilizationSystem_v1
   - Could overwrite stabilized values
   - No coordination with primary authority

2. **Multiple systems reading `harmonyLevel`**
   - No single source of truth
   - Each system may have different interpretation
   - SemanticMetricAdapter provides canonical path

---

## 9. VISUAL PIPELINE MAPPING

```
node.userData.harmonyLevel (0-1)
       ↓
SemanticMetricAdapter (canonical)
       ↓
metrics.harmony (0-1)
       ↓
LinkRendererConduit.js
       ↓
Visual Effects (shaders, materials, meshes)
```

```
link.userData.harmonyLevel (0-1)
       ↓
LinkRendererConduit.js
       ↓
Visual Effects (shaders, materials, meshes)
```

---

## 10. BREAKPOINT ANALYSIS

**First Point Where Harmony Becomes Visible:**

**File:** [`HarmonyStabilizationSystem_v1.js`](HarmonyStabilizationSystem_v1.js:854)

**Line:** [`HarmonyStabilizationSystem_v1.js:854`](HarmonyStabilizationSystem_v1.js:854)

**Code:**
```javascript
node.userData.harmonyLevel = canonicalHarmony;
```

**Breakpoint Status:** ✅ CONFIRMED

- This is the **primary** point where harmony value is written to `node.userData.harmonyLevel`
- All downstream systems read from here
- Value is immediately available after write
- No intermediate processing or transformation

---

## 11. SYSTEM "ZOMIERA" ANALYSIS

**Question:** Kto "zomiera" systém?

**Answer:** HarmonyStabilizationSystem_v1 is the **primary authority**.

**Evidence:**
1. ✅ **WRITER:** [`HarmonyStabilizationSystem_v1.js:854`](HarmonyStabilizationSystem_v1.js:854) writes `node.userData.harmonyLevel`
2. ✅ **CANONICAL READER:** [`SemanticMetricAdapter.js:52`](SemanticMetricAdapter.js:52) prioritizes `node.userData.harmonyLevel`
3. ✅ **CONSUMERS:** All visual systems read from `node.userData.harmonyLevel` via SemanticMetricAdapter
4. ✅ **INTEGRATION:** [`LinkResonanceFlowIntegrationPatch_Session124.js:241`](LinkResonanceFlowIntegrationPatch_Session124.js:241) uses `harmonyLevel` for `flowState.energy`

**Authority Chain:**
```
HarmonyStabilizationSystem_v1 (PRIMARY AUTHORITY)
       ↓ (writes)
node.userData.harmonyLevel
       ↓ (canonical source)
SemanticMetricAdapter.js
       ↓ (distributes)
All Systems
       ↓ (read)
Visual Pipeline
```

---

## 12. DEFAULT VALUE PROPAGATION

**What happens when `harmonyLevel` is undefined?**

| System | Behavior |
|---------|----------|
| HarmonyStabilizationSystem_v1 | Writes `0` (default) |
| SemanticMetricAdapter | Returns `undefined` |
| NetworkRituals_v1 | Uses `0` (|| 0) |
| T2_HarmonyVisualConsumer_v1 | Uses `0` (?? 0) |
| LinkResonanceFlowIntegrationPatch | Uses `0` (?? 0) |
| LinkRendererConduit.js | Uses `0.5` (?? 0.5) |

**Issue:** Inconsistent default values across systems.

---

## 13. OVERWRITE PROTECTION

**Who can overwrite `harmonyLevel`?**

| System | Can Overwrite | Protection |
|---------|---------------|------------|
| HarmonyStabilizationSystem_v1 | ✅ Yes | `PHASE_C3_METRIC_WRITE_LOCK` |
| NetworkRituals_v1 | ✅ Yes | None |
| LinkResonanceFlowIntegrationPatch | ✅ Yes | None |
| Others | ❌ No | None |

**Risk:** NetworkRituals_v1 can overwrite HarmonyStabilizationSystem_v1 values without coordination.

---

## 14. RECOMMENDATIONS

1. **Coordinate with HarmonyStabilizationSystem_v1**
   - NetworkRituals_v1 should check if HarmonyStabilizationSystem_v1 is active
   - Use HarmonyStabilizationSystem_v1 API instead of direct modification

2. **Standardize default values**
   - All systems should use `0` as default
   - SemanticMetricAdapter should return `0` when all sources are undefined

3. **Add guards to modifiers**
   - NetworkRituals_v1 should guard modifications to `harmonyLevel`
   - Check if value exists before modifying

4. **Improve clamping**
   - Apply clamping in SemanticMetricAdapter
   - Ensure all systems respect `0-1` range

---

## Conclusion

**Data Flow Chain:**
```
HarmonyStabilizationSystem_v1
       ↓ (writes)
node.userData.harmonyLevel
       ↓ (read by)
SemanticMetricAdapter.js
       ↓ (canonical source)
Multiple Systems
       ↓ (read)
LinkRendererConduit.js (visual pipeline)
```

**Primary Authority:** [`HarmonyStabilizationSystem_v1.js`](HarmonyStabilizationSystem_v1.js:61)

**Canonical Reader:** [`SemanticMetricAdapter.js`](SemanticMetricAdapter.js:43)

**Visual Pipeline:** [`LinkRendererConduit.js`](LinkRendererConduit.js:1)

**Breakpoint:** [`HarmonyStabilizationSystem_v1.js:854`](HarmonyStabilizationSystem_v1.js:854)

**All systems are reading from the correct source.**
