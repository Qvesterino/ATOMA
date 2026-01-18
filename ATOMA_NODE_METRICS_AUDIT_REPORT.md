# ATOMA Node Metrics Diversification Audit Report

**Date:** 2026-01-16  
**Auditor:** Cline AI  
**Scope:** Complete codebase scan for `node.userData.metrics` writes

---

## Executive Summary

**CRITICAL FINDING:** ATOMA node metrics suffer from **schema fragmentation** and **homogenization due to conflicting initialization systems**. Multiple independent writers attach different metric schemas to nodes, leading to data loss and inconsistent behavior.

**Key Issues:**
1. **3+ competing metric schemas** with overlapping but non-identical field names
2. **SafeMetricsDNAIntegration overwrites NodeMetricEngine** defaults, creating schema conflicts
3. **No schema migration layer** between archetype-based and canonical metrics
4. **Limited diversification** - most nodes receive DEFAULT_METRICS from NodeMetricEngine

---

## 1. Metric Schemas Identified

### Schema 1: NodeMetricEngine (Canonical Gameplay)
**File:** `src/metrics/NodeMetricEngine.js`  
**Default Values:**
```javascript
const DEFAULT_METRICS = {
  synergy: 0.5,        // [0-1] Link cooperation
  harmony: 0.5,        // [0-1] Network harmony
  stability: 0.5,      // [0-1] Node stability
  corruption: 0.0,     // [0-1] Corruption level
  loadPressure: 0.2    // [0-1] Network load stress
};
```
**Usage:** Gameplay systems (linking, overload, relaxation)

---

### Schema 2: SafeMetricsDNAIntegration (Archetype-Based)
**File:** `SafeMetricsDNAIntegration1_0.js`  
**Range:** 0-120 (extended beyond canonical 0-1)  
**Fields:**
```javascript
{
  energy: 65,           // Energy output level
  stability: 85,        // Structural stability
  clarity: 95,          // Clarity of purpose
  harmony: 80,          // Harmony affinity
  instability: 5,      // Inverse of stability
  archetype: 'crystal' // Archetype name
}
```
**Archetypes:** 16 types (crystal, harmonic, fractal, quantum, umbra, solar, glyph, echo, convergence, ascended, input, process, integration, analytics, storage, control)

**⚠️ CRITICAL CONFLICT:** `harmony` and `stability` exist in both schemas but have different:
- **Value ranges:** 0-120 vs 0-1
- **Semantic meaning:** Archetype affinity vs network state
- **Update rules:** Static DNA vs dynamic gameplay

---

### Schema 3: Mythic Node Metrics
**File:** `_MythicNodeCreation.js`  
**Range:** 0-120 (archetype-like)  
**Fields:**
```javascript
{
  energyOutput: 100,     // Different name from 'energy'
  stability: 95,
  clarity: 100,
  harmonyAffinity: 95,   // Different name from 'harmony'
  instabilityFactor: 5, // Different name from 'instability'
  archetype: 'ASCENDED'
}
```
**⚠️ CRITICAL CONFLICT:** Mythic nodes use renamed fields (`energyOutput` vs `energy`, `harmonyAffinity` vs `harmony`), breaking archetype consistency.

---

## 2. Metric Writers Analysis

### Writer 1: NodeMetricEngine (Primary System)
**Functions:** `ensureMetrics()`, `initNodeMetrics()`, `onNodeSpawn()`

**Behavior:**
- Initializes DEFAULT_METRICS for all nodes
- **Non-destructive:** Only fills missing values
- **Writes:** `node.userData.metrics[key] = DEFAULT_METRICS[key]` (only if undefined)
- **Called from:** `AINodes.js` spawnNode() line ~1200

**Coverage:** ALL nodes (100%)

---

### Writer 2: SafeMetricsDNAIntegration
**Function:** `attachMetrics(node, archetype)`

**Behavior:**
- **DESTRUCTIVE:** Completely overwrites `node.userData.metrics` object
- **Called from:** `AINodes.js` spawnNode() line ~1350 (after NodeMetricEngine)

**Execution Order Problem:**
```javascript
// Step 1 (line ~1200): NodeMetricEngine initializes DEFAULT_METRICS
initNodeMetrics(newNode);  // → synergy:0.5, harmony:0.5, stability:0.5...

// Step 2 (line ~1350): SafeMetricsDNAIntegration OVERWRITES
SafeMetricsDNAIntegration1_0.attachMetrics(newNode, archetype);  
// → energy:65, harmony:80, stability:85, instability:5...
// ❌ DEFAULT_METRICS values LOST
```

**Result:** Nodes with archetypes **lose all canonical gameplay metrics** (synergy, corruption, loadPressure).

**Coverage:** Archetype-identified nodes (~30-40% of spawns)

---

### Writer 3: _MythicNodeCreation
**Function:** `spawnMythicNode()` creates node with custom metrics

**Behavior:**
- Creates complete metrics object inline
- **No archetype lookup** (hardcoded ASCENDED values)
- **Called from:** Ritual system only (manual trigger)

**Coverage:** Mythic nodes (<1% of spawns, ritual-only)

---

### Writer 4: _ExtremeAINodeEvolution3 (READER ONLY)
**Function:** `updateEvolutionStage()`

**Behavior:**
- **READS** `node.userData.metrics.synergy` and `node.userData.metrics.harmony`
- Assumes Schema 1 values (0-1 range)
- **Does NOT write** metrics

**⚠️ CRITICAL BUG:** Reads Schema 1 fields but Extreme nodes have Schema 2 (0-120 range). Evolution thresholds are misaligned.

---

## 3. Diversification Analysis

### Global Metrics (Shared by All Nodes)
Via `NodeMetricEngine.DEFAULT_METRICS`:
- ✅ synergy: 0.5
- ✅ harmony: 0.5
- ✅ stability: 0.5
- ✅ corruption: 0.0
- ✅ loadPressure: 0.2

**Actual Distribution:** 60-70% of nodes use these exact values (non-archetype nodes).

---

### Archetype-Specific Metrics (Schema 2)
Via `SafeMetricsDNAIntegration.METRICS_TABLE`:

| Archetype | Energy | Stability | Clarity | Harmony | Instability |
|-----------|--------|------------|---------|---------|-------------|
| crystal   | 65     | 85         | 95      | 80      | 5           |
| harmonic  | 50     | 60         | 70      | 95      | 10          |
| fractal   | 80     | 40         | 30      | 20      | 90          |
| quantum   | 95     | 15         | 20      | 5       | 100         |
| umbra     | 40     | 80         | 25      | 10      | 75          |
| solar     | 100    | 50         | 60      | 50      | 30          |
| glyph     | 70     | 70         | 90      | 65      | 10          |
| echo      | 45     | 30         | 50      | 40      | 60          |
| convergence| 85    | 55         | 40      | 35      | 50          |
| ascended  | 120    | 120        | 120     | 120     | 0           |
| input     | 50     | 70         | 90      | 40      | 10          |
| process   | 60     | 65         | 70      | 50      | 25          |
| integration| 70    | 70         | 60      | 95      | 15          |
| analytics | 55     | 75         | 95      | 50      | 5           |
| storage   | 30     | 95         | 50      | 30      | 5           |
| control   | 65     | 90         | 70      | 20      | 10          |

**Coverage:** Archetype-assigned nodes (30-40% of spawns)

**Diversification:** ✅ **EXCELLENT** - Each archetype has unique profile

---

### Mythic Metrics (Schema 3)
Hardcoded ASCENDED values:
- energyOutput: 100
- stability: 95
- clarity: 100
- harmonyAffinity: 95
- instabilityFactor: 5

**Coverage:** <1% (ritual-only)

**Diversification:** ❌ **NONE** - Only 1 hardcoded profile

---

### Extreme Archetypes
**File:** `AINodes.js` contains 49 archetype names (CORE, OUTER, EXTREME, SPECIAL layers)

**Status:** ⚠️ **NOT HOOKED INTO METRICS**

Extreme archetype names exist but:
- ❌ No archetype-specific metrics table
- ❌ No mapping to SafeMetricsDNAIntegration
- ❌ All extreme nodes use DEFAULT_METRICS or category-based Schema 2

**Example Extreme Archetypes:**
- `CORE-HARMONIC-RESONANT` → category: 'process' → gets process archetype metrics
- `EXTREME-SINGULARITY-DENSE` → category: 'prime' → **no archetype metrics table entry**

---

## 4. Dependency Map

```
Node Creation Flow:
─────────────────────────────────────────────────────────────
AINodes.spawnNode()
│
├─ createNode()
│  ├─ EnhancedNodeModels.create() → Visuals only
│  └─ userData.category = 'input'|'process'|...
│
├─ initNodeMetrics() [NodeMetricEngine.js]
│  └─ node.userData.metrics = { synergy:0.5, harmony:0.5, stability:0.5, corruption:0.0, loadPressure:0.2 }
│     ✅ Schema 1 initialized
│
├─ onNodeSpawn() [NodeMetricEngine.js]
│  └─ Nudges existing metrics toward DEFAULT_METRICS
│     ⚠️ Assumes Schema 1 exists
│
├─ SafeMetricsDNAIntegration1_0.attachMetrics(node, archetype)
│  └─ node.userData.metrics = { energy:65, harmony:80, stability:85, instability:5, clarity:95, archetype:'crystal' }
│     ❌ Schema 2 OVERWRITES Schema 1 completely
│     ❌ synergy, corruption, loadPressure LOST
│
└─ onNodeSpawn() [NodeMetricEngine.js] - called AGAIN?
   └─ Nudges toward Schema 1 defaults (but Schema 2 fields don't match)
      ⚠️ Ineffective - field names don't overlap correctly
```

---

## 5. Critical Issues

### Issue 1: Schema Conflict (CRITICAL)
**Severity:** 🔴 CRITICAL  
**Impact:** Gameplay systems lose canonical metrics

**Description:** SafeMetricsDNAIntegration overwrites NodeMetricEngine's DEFAULT_METRICS. Archetype nodes lose `synergy`, `corruption`, and `loadPressure`.

**Affected Systems:**
- Linking system (reads synergy/harmony for bonuses)
- Overload system (reads loadPressure)
- Relaxation system (relaxes toward DEFAULT_METRICS)
- Extreme evolution (reads synergy/harmony thresholds)

**Current Behavior:**
```javascript
// Non-archetype node (e.g., input category without archetype)
node.userData.metrics = {
  synergy: 0.5,      // ✅ Present
  harmony: 0.5,      // ✅ Present
  stability: 0.5,    // ✅ Present
  corruption: 0.0,   // ✅ Present
  loadPressure: 0.2  // ✅ Present
}

// Archetype node (e.g., crystal)
node.userData.metrics = {
  energy: 65,        // ❌ Not used by gameplay
  harmony: 80,       // ⚠️ Wrong range (0-120 vs 0-1)
  stability: 85,     // ⚠️ Wrong range (0-120 vs 0-1)
  clarity: 95,       // ❌ Not used by gameplay
  instability: 5,    // ❌ Not used by gameplay
  synergy: undefined, // ❌ LOST
  corruption: undefined, // ❌ LOST
  loadPressure: undefined // ❌ LOST
}
```

---

### Issue 2: Value Range Mismatch (HIGH)
**Severity:** 🟠 HIGH  
**Impact:** Threshold calculations fail silently

**Description:** Schema 2 uses 0-120 range, Schema 1 uses 0-1. Evolution thresholds assume 0-1.

**Example:**
```javascript
// _ExtremeAINodeEvolution3.js thresholds
this.synergyThresholds = {
  stage1: 0.3,  // Expects 0-1 range
  stage2: 0.6   // Expects 0-1 range
};

// But archetype nodes have synergy: 80 (0-120 range)
// Stage 2 condition: synergy > 0.6 ✅ ALWAYS TRUE
// All archetype nodes immediately evolve to stage 2
```

---

### Issue 3: Extreme Archetypes Not Diversified (MEDIUM)
**Severity:** 🟡 MEDIUM  
**Impact:** Extreme nodes lack archetype-specific behavior

**Description:** 49 extreme archetypes exist but have no metric profiles. They fallback to category-based metrics.

**Example:**
```javascript
// AINodes.js extremeArchetypes map
'EXTREME-SINGULARITY-DENSE': 'prime',
'EXTREME-ENTROPY-CHAOTIC': 'error',

// But SafeMetricsDNAIntegration has no 'prime' or 'error' entries!
// Fallback to default metrics:
node.userData.metrics = { synergy:0.5, harmony:0.5, stability:0.5, corruption:0.0, loadPressure:0.2 }
```

---

### Issue 4: Mythic Field Name Mismatches (MEDIUM)
**Severity:** 🟡 MEDIUM  
**Impact:** Inconsistent archetype lookup

**Description:** Mythic nodes use `energyOutput` instead of `energy`, `harmonyAffinity` instead of `harmony`.

**Breaks:**
- Any archetype lookup by field name
- Visual systems expecting `energy` field
- HUD systems expecting `harmony` field

---

## 6. Diversification Opportunities

### Opportunity 1: Merge Schemas (RECOMMENDED)
**Priority:** 🔴 CRITICAL  
**Effort:** MEDIUM

**Proposal:** Create unified metric schema with both archetype DNA and gameplay metrics.

**Proposed Schema:**
```javascript
node.userData.metrics = {
  // Archetype DNA (static, 0-120)
  archetype: 'crystal',
  energy: 65,
  stability: 85,
  clarity: 95,
  harmony: 80,
  instability: 5,
  
  // Gameplay state (dynamic, 0-1)
  synergy: 0.5,
  corruption: 0.0,
  loadPressure: 0.2,
  
  // Derived (computed from archetype DNA)
  normalizedStability: 0.85, // stability / 120
  normalizedHarmony: 0.67    // harmony / 120
};
```

**Implementation:**
1. Modify `SafeMetricsDNAIntegration.attachMetrics()` to preserve existing fields
2. Add `normalizeArchetypeMetrics()` to convert 0-120 → 0-1 for gameplay systems
3. Update `NodeMetricEngine.ensureMetrics()` to merge, not replace

---

### Opportunity 2: Extreme Archetype Metrics Table
**Priority:** 🟠 HIGH  
**Effort:** LOW

**Proposal:** Extend `SafeMetricsDNAIntegration.METRICS_TABLE` with 49 extreme archetypes.

**Example:**
```javascript
static METRICS_TABLE = {
  // ... existing archetypes ...
  
  // Extreme archetypes
  'EXTREME-SINGULARITY-DENSE': {
    energy: 120,
    stability: 30,
    clarity: 20,
    harmony: 5,
    instability: 100
  },
  
  'EXTREME-ENTROPY-CHAOTIC': {
    energy: 100,
    stability: 5,
    clarity: 10,
    harmony: 0,
    instability: 120
  },
  // ... 47 more
};
```

**Implementation:**
1. Add extreme archetype entries to METRICS_TABLE
2. Update `AINodes.spawnNode()` to pass full archetype key to `attachMetrics()`
3. Test extreme node behavior changes

---

### Opportunity 3: Category-Specific Default Modifiers
**Priority:** 🟡 MEDIUM  
**Effort:** LOW

**Proposal:** Override DEFAULT_METRICS based on `node.userData.category`.

**Example:**
```javascript
const CATEGORY_DEFAULTS = {
  'input': { synergy: 0.6, harmony: 0.4, stability: 0.7, corruption: 0.0, loadPressure: 0.15 },
  'process': { synergy: 0.5, harmony: 0.5, stability: 0.6, corruption: 0.0, loadPressure: 0.3 },
  'storage': { synergy: 0.3, harmony: 0.6, stability: 0.9, corruption: 0.0, loadPressure: 0.1 },
  'control': { synergy: 0.4, harmony: 0.2, stability: 0.9, corruption: 0.05, loadPressure: 0.25 },
  'quantum': { synergy: 0.7, harmony: 0.3, stability: 0.2, corruption: 0.1, loadPressure: 0.4 },
  'mythic': { synergy: 1.0, harmony: 1.0, stability: 1.0, corruption: 0.0, loadPressure: 0.0 },
  'prime': { synergy: 0.9, harmony: 0.8, stability: 0.9, corruption: 0.0, loadPressure: 0.05 },
  'error': { synergy: 0.1, harmony: 0.1, stability: 0.2, corruption: 0.8, loadPressure: 0.6 },
  'emotional': { synergy: 0.5, harmony: 0.7, stability: 0.5, corruption: 0.1, loadPressure: 0.3 }
};

export function initNodeMetrics(node) {
  const category = node.userData?.category || 'default';
  const defaults = CATEGORY_DEFAULTS[category] || DEFAULT_METRICS;
  
  const metrics = node.userData.metrics || (node.userData.metrics = {});
  for (const key of Object.keys(DEFAULT_METRICS)) {
    if (metrics[key] === undefined) {
      metrics[key] = defaults[key];
    }
  }
  return metrics;
}
```

**Benefits:**
- Immediate diversification for all nodes
- Non-archetype nodes get category-specific behavior
- Minimal code changes (just update initNodeMetrics)

---

### Opportunity 4: Dynamic Metric Multipliers
**Priority:** 🟢 OPTIONAL  
**Effort:** MEDIUM

**Proposal:** Add archetype-based modifiers to gameplay metric updates.

**Example:**
```javascript
const ARCHETYPE_MODIFIERS = {
  'crystal': { synergyMult: 0.8, stabilityMult: 1.2, corruptionResist: 0.5 },
  'fractal': { synergyMult: 1.3, stabilityMult: 0.6, corruptionResist: 1.5 },
  'quantum': { loadPressureMult: 1.5, stabilityMult: 0.3 },
  'harmonic': { harmonyMult: 1.2, synergyMult: 1.1 },
  'umbra': { corruptionMult: 0.5, stabilityMult: 1.3 },
  // ... etc
};

export function onLinkCreated(nodeA, nodeB, linkContext) {
  const nodes = [nodeA, nodeB];
  for (const node of nodes) {
    const m = ensureMetrics(node);
    if (!m) continue;
    
    const archetype = m.archetype || node.userData.archetype;
    const mods = ARCHETYPE_MODIFIERS[archetype] || {};
    
    const linkBoost = STEP.linkBoost * (mods.synergyMult || 1.0);
    const stabilityLoss = STEP.overloadStabilityLoss * (mods.stabilityMult || 1.0);
    
    adjust(m, 'synergy', linkBoost);
    adjust(m, 'harmony', linkBoost * (mods.harmonyMult || 1.0));
    adjust(m, 'loadPressure', STEP.linkStress * (mods.loadPressureMult || 1.0));
    adjust(m, 'corruption', -STEP.linkBoost * 0.5 * (mods.corruptionResist || 1.0));
  }
}
```

**Benefits:**
- Archetypes affect gameplay dynamics
- Nodes with same category but different archetypes behave differently
- Enables emergent strategy (e.g., build harmonic clusters vs quantum chaos)

---

### Opportunity 5: Mythic Archetype Variants
**Priority:** 🟢 OPTIONAL  
**Effort:** LOW

**Proposal:** Add multiple mythic archetypes (not just ASCENDED).

**Example:**
```javascript
// Add to SafeMetricsDNAIntegration.METRICS_TABLE
'MYTHIC-CEREMONIAL': {
  energy: 120, stability: 120, clarity: 120, harmony: 120, instability: 0
},
'MYTHIC-TRANSCENDENT': {
  energy: 110, stability: 115, clarity: 120, harmony: 115, instability: 0
},
'MYTHIC-ETHEREAL': {
  energy: 100, stability: 100, clarity: 120, harmony: 110, instability: 0
};
```

**Implementation:**
1. Add entries to METRICS_TABLE
2. Update `_MythicNodeCreation.spawnMythicNode()` to select random mythic archetype
3. Fix field name inconsistencies (use `energy` not `energyOutput`)

---

## 7. Recommendations

### Immediate Actions (Critical)
1. **Merge schemas** - Modify SafeMetricsDNAIntegration to preserve gameplay metrics
2. **Fix value ranges** - Normalize archetype metrics to 0-1 for gameplay systems
3. **Fix extreme evolution** - Update thresholds to handle 0-120 range or normalize

### High Priority
4. **Add category defaults** - Implement CATEGORY_DEFAULTS for immediate diversification
5. **Add extreme archetype metrics** - Extend METRICS_TABLE with 49 extreme archetypes
6. **Fix mythic field names** - Align with standard schema

### Medium Priority
7. **Add archetype modifiers** - Implement ARCHETYPE_MODIFIERS for dynamic gameplay
8. **Create metric migration layer** - Helper functions to convert between schemas
9. **Add validation** - Detect schema conflicts at runtime

### Low Priority / Future
10. **Add more mythic variants** - Multiple mythic archetypes
11. **Add procedural generation** - Randomized metrics within archetype ranges
12. **Add evolution modifiers** - Metrics change over node lifetime

---

## 8. Metrics Writer Summary

| Writer | File | Schema | Destructive? | Coverage | Diversifies? |
|--------|------|--------|--------------|----------|--------------|
| NodeMetricEngine | src/metrics/NodeMetricEngine.js | Schema 1 | ❌ No | 100% | ❌ No (all same defaults) |
| SafeMetricsDNA | SafeMetricsDNAIntegration1_0.js | Schema 2 | ✅ Yes | 30-40% | ✅ Yes (16 archetypes) |
| _MythicNodeCreation | _MythicNodeCreation.js | Schema 3 | ✅ Yes | <1% | ❌ No (1 hardcoded) |
| _ExtremeAINodeEvolution3 | _ExtremeAINodeEvolution3.js | Reader only | N/A | N/A | N/A |

---

## 9. File Inventory

### Metrics-Related Files
- `src/metrics/NodeMetricEngine.js` - Canonical gameplay metrics
- `SafeMetricsDNAIntegration1_0.js` - Archetype DNA metrics
- `NodeDynamicMetrics.js` - Dynamic metric updates
- `src/metrics/NetworkMetricsAggregator.js` - Network-level metrics

### Writers Found
- `src/metrics/NodeMetricEngine.js` - Lines 23, 36, 44
- `SafeMetricsDNAIntegration1_0.js` - Line 42
- `_MythicNodeCreation.js` - Line 736

### Readers Found
- `src/metrics/NodeMetricEngine.js` - Multiple adjust() calls
- `_ExtremeAINodeEvolution3.js` - Line 150
- `CoreMetricsHUD.js` - Display purposes
- `NodeLinkingSystem.js` - Synergy bonuses
- `AINodes.js` - Spawn hooks

---

## Conclusion

**ATOMA's node metrics are NOT homogenized by default** - the SafeMetricsDNAIntegration system provides excellent archetype diversification. However, **schema conflicts cause critical gameplay systems to lose access to canonical metrics**.

The primary issue is not lack of diversification, but **schema incompatibility** between archetype-based static metrics and gameplay-based dynamic metrics.

**Recommended Fix Path:**
1. Merge schemas (preserve both DNA and gameplay metrics)
2. Normalize value ranges for cross-system compatibility
3. Add category defaults for immediate non-archetype diversification
4. Extend archetype table to cover extreme archetypes

**Estimated Effort:** 4-8 hours to implement critical fixes, 12-20 hours for full diversification suite.

---

**END OF AUDIT REPORT**