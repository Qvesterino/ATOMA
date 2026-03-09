# AUDIT 5 — LINK METRIC MODEL

## EXECUTIVE SUMMARY

Link metrics are highly fragmented with **5 distinct synergy formats** and unclear authority boundaries.

**Key Issues:**
- Three parallel synergy metrics (`.synergy`, `.synergy2_1`, `.synergyBonus`)
- Confusion between `link.synergy` and `link.userData.synergy`
- Mixed visual/gameplay responsibilities
- Critical anti-pattern: visual feedback loop in `VisualTemplateReferenceImplementations.js`

---

## METRIC CLASSIFICATION

### 1. `link.synergy` (RAW NUMBER)

**Type:** GAMEPLAY (read-only legacy)  
**Format:** `number` (0-100 scale)  
**Authority:** Legacy system (writer unknown)  
**Status:** DEPRECATED - should not be used

**READ OPERATIONS:**
- `LinkCorruptionTransmission_v1.js` - Reads for corruption blocking
- `LinkCorruptionTransmission_v1.js` - Synergy feedback writes to this
- `LinkSemanticPictogramSystem.js` - Reads for pictograms
- `NodeLinkedAuraSystem_Session123.js` - Fallback read

**WRITE OPERATIONS:**
- `LinkCorruptionTransmission_v1.js` - Synergy feedback loop (Phase 4-lite)
- `VisualTemplateReferenceImplementations.js` - ❌ ANTI-PATTERN (visual mutation)

**Derived from:** Unknown (no canonical writer found)

**Issues:**
- ❌ No clear authority - writes from multiple systems
- ❌ Visual system writes to it (anti-pattern)
- ⚠️ Conflicts with `link.userData.synergy`

---

### 2. `link.userData.synergy` (RAW NUMBER)

**Type:** GAMEPLAY (read-only)  
**Format:** `number` (0-100 scale)  
**Authority:** None (legacy)  
**Status:** DEPRECATED - should not be used

**READ OPERATIONS:**
- `HarmonyStabilizationSystem_v1.js` - Harmony rate modifier
- `LinkCorruptionTransmission_v1.js` - Transmission rate calculation
- `LinkCorruptionTransmission_v1.js` - Old logic compatibility
- `LinkGlowSynergyEngine_v2.js` - Fallback read
- `LinkSemanticPictogramSystem.js` - Avg calculation
- `NodeLinkedAuraSystem_Session123.js` - Primary read
- `NodePersonality_VisualAdapter.js` - Fallback read
- `ResonanceFeedback_v1.js` - Reads (but uses .score property)

**WRITE OPERATIONS:**
- None found (read-only in codebase)

**Derived from:** Unknown (no canonical writer found)

**Issues:**
- ❌ No writer identified
- ⚠️ Conflicts with `link.synergy`
- ⚠️ Conflicts with `link.userData.synergy2_1`

---

### 3. `link.userData.synergy2_1` (OBJECT)

**Type:** DERIVED (semantic → visual bridge)  
**Format:** Object with `score` and `synergyNorm` properties  
**Authority:** `ComputeSynergyScore2_1` (not examined)  
**Status:** ACTIVE - used by visual systems

**Format:**
```javascript
link.userData.synergy2_1 = {
  score: 0.75,          // 0-1 normalized score
  synergyNorm: 0.75      // Alternative normalized form
}
```

**READ OPERATIONS:**
- `LinkGlowSynergyEngine_v2.js` - Primary source for visual glow
- `NodeLinkedAuraSystem_Session123.js` - Visual calculations
- `NodePersonality_VisualAdapter.js` - Personality adaptation
- `SynergyBonusVisualization_v1.js` - Source for tier calculation

**WRITE OPERATIONS:**
- Unknown (canonical writer not examined in this audit)

**Derived from:** Presumably `ComputeSynergyScore2_1` (per naming convention)

**Issues:**
- ⚠️ Writer authority not confirmed
- ✅ Clear object format with documentation
- ✅ Used consistently by visual systems

---

### 4. `link.userData.synergyBonus` (OBJECT)

**Type:** VISUAL (derived from synergy)  
**Format:** Object with tier, pulse, and visual parameters  
**Authority:** `SynergyBonusVisualization_v1.js`  
**Status:** ACTIVE - per-frame computation

**Format:**
```javascript
link.userData.synergyBonus = {
  tier: 0-3,                    // NONE, SOFT_BOOST, STRONG_PULSE, MYTHIC_RESONANCE
  tierName: string,              // Tier name
  pulseStrength: 0-1,           // EMA-smoothed pulse
  chromaShift: 0-1,            // EMA-smoothed color shift
  resonanceRipples: 0-1,        // EMA-smoothed ripple effect
  lastUpdate: timestamp
}
```

**READ OPERATIONS:**
- `SynergyBonusFXLayer_v1.js` - Shader effects layer
- `SynergyResonanceShaderPack_v1.js` - Multi-freq pulse effects
- `ResonanceFeedback_v1.js` - Coherence tracking
- `main.js` - Update orchestration

**WRITE OPERATIONS:**
- `SynergyBonusVisualization_v1.js` - Sole writer (per-frame compute)

**Derived from:** `link.userData.visualGlow.glowIntensity` (from LinkGlowSynergyEngine_v2)

**Issues:**
- ✅ Single authority writer
- ✅ Clear object format
- ✅ EMA smoothing for stability
- ⚠️ Depends on `visualGlow` which depends on `synergy2_1`

---

### 5. `link.userData.quality` (OBJECT)

**Type:** DERIVED (semantic metric)  
**Format:** Object with composite quality score and components  
**Authority:** `LinkQualityCalculator.js`  
**Status:** ACTIVE - per-frame computation

**Format:**
```javascript
link.userData.quality = {
  score: 0-100,                // Final weighted score
  level: string,                // "High", "Medium", "Low", "Critical"
  structural: 0-100,           // Structural component (30%)
  harmony: 0-100,              // Node harmony component (40%)
  load: 0-100,                 // Load stress component (15%)
  corruption: 0-100,           // Corruption component (15%)
  updatedAt: timestamp
}
```

**READ OPERATIONS:**
- `LinkMetricsToVisualBridge_v1.js` - Visual bridge
- `LinkResonanceFlowSystem_Session124.js` - Flow calculations
- `VisualMetricModel_v1.js` - Visual model integration
- `LinkCorruptionTransmission_v1.js` - Rebuild eligibility

**WRITE OPERATIONS:**
- `LinkQualityCalculator.js` - Sole writer (per-frame compute)

**Derived from:** Node metrics (harmony, load, corruption) + link properties

**Issues:**
- ✅ Single authority writer
- ✅ Clear composite formula
- ✅ Well-documented component weights
- ⚠️ No evidence of actual gameplay use

---

### 6. `link.userData.corruption` (RAW NUMBER)

**Type:** VISUAL/GAMEPLAY (corruption state)  
**Format:** `number` (0-1 scale)  
**Authority:** `LinkCorruptionTransmission_v1.js`  
**Status:** ACTIVE - gameplay system

**READ OPERATIONS:**
- `LinkCorruptionMorphingSystem.js` - Visual morphing
- `LinkMetricsToVisualBridge_v1.js` - Visual bridge
- `LinkResonanceFlowSystem_Session124.js` - Flow calculations

**WRITE OPERATIONS:**
- `LinkCorruptionTransmission_v1.js` - Main writer
- `EXAMPLES/LINK_MORPHING_EXAMPLES.js` - Example code (decrease)

**Derived from:** Node corruption average (computed in LinkCorruptionTransmission_v1)

**Issues:**
- ⚠️ Conflict with `link.userData.corruptionLevel`
- ⚠️ Purpose unclear - is this visual or gameplay?
- ⚠️ Written by example code

---

### 7. `link.userData.corruptionLevel` (RAW NUMBER)

**Type:** GAMEPLAY (corruption state)  
**Format:** `number` (0-1 scale)  
**Authority:** `LinkCorruptionTransmission_v1.js`  
**Status:** ACTIVE - canonical gameplay metric

**READ OPERATIONS:**
- `LinkCorruptionTransmission_v1.js` - Internal read for cascade logic
- `PHASE5_NetworkSynchronization_v1.js` - Network sync
- `T4004_HARMONY_HEALING_TEST_RUNNER.js` - Test runner
- `T2_CorruptionVisualIntegration_v1.js` - Visual integration

**WRITE OPERATIONS:**
- `LinkCorruptionTransmission_v1.js` - Main writer (per-frame)
- `EXAMPLES/LINK_CORRUPTION_TRANSMISSION_v1_EXAMPLES.js` - Example code
- `PHASE5_NetworkSynchronization_v1.js` - Clamping

**Derived from:** Node corruption + transmission rates (computed in LinkCorruptionTransmission_v1)

**Issues:**
- ⚠️ Conflict with `link.userData.corruption`
- ✅ Clear single authority writer
- ✅ Gameplay-critical metric

---

## DATA FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│                    NODE METRICS (source)                      │
│  node.userData.harmony, corruption, load, stability          │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │ ComputeSynergyScore2_1│ (NOT examined - assumed)
        └────────┬───────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────────────────────────┐
│  link.userData.synergy2_1 = { score, synergyNorm }         │
│  (DERIVED - semantic → visual bridge)                         │
└────────┬──────────────────────────────┬─────────────────────┘
         │                              │
         ▼                              ▼
┌──────────────────────┐    ┌─────────────────────────────┐
│ LinkGlowSynergy     │    │ NodeLinkedAuraSystem       │
│ Engine_v2           │    │ _Session123                │
└────────┬─────────────┘    └──────────┬──────────────────┘
         │                              │
         ▼                              │
┌───────────────────────────────────────────┴──────────────────┐
│  link.userData.visualGlow = { glowIntensity, synergyNorm... }  │
│  (DERIVED - visual)                                           │
└────────┬──────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│  SynergyBonusVisualization_v1                                 │
│  └─→ link.userData.synergyBonus = { tier, pulseStrength... }   │
└────────┬──────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│  Shader Systems: SynergyBonusFXLayer_v1,                     │
│  SynergyResonanceShaderPack_v1                               │
│  (VISUAL CONSUMERS - read-only)                              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  LinkQualityCalculator                                         │
│  └─→ link.userData.quality = { score, harmony, load... }      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  LinkCorruptionTransmission_v1                                 │
│  └─→ link.userData.corruptionLevel = 0-1                      │
│  └─→ link.userData.corruption = 0-1 (duplicate?)              │
└─────────────────────────────────────────────────────────────────┘
```

---

## CRITICAL ISSUES

### 1. SYNERGY FRAGMENTATION (HIGH)

**Problem:** Three parallel synergy metrics exist with unclear hierarchy:
- `link.synergy` (legacy number 0-100)
- `link.userData.synergy` (legacy number 0-100)
- `link.userData.synergy2_1` (object with score + synergyNorm)

**Impact:**
- Systems read different formats
- No canonical source of truth
- Inconsistent data across codebase

**Recommendation:**
1. Determine canonical synergy format
2. Deprecate legacy formats
3. Consolidate to single source

---

### 2. VISUAL FEEDBACK LOOP (CRITICAL)

**Location:** `VisualTemplateReferenceImplementations.js`

**Problem:**
```javascript
// ✗ WRONG: Stat mutation from visuals
link.userData.synergy = glow.intensity;

// ✗ WRONG: Feedback loop
if (glow.brightness > 0.8) { 
  link.userData.synergy += 0.01; 
}
```

**Impact:**
- Visual system mutates gameplay state
- Creates feedback loop
- Violates ATOMA separation principles

**Recommendation:**
1. Remove all writes to metrics from visual systems
2. Make visual systems strictly read-only
3. Use separate visual state if needed

---

### 3. CORRUPTION DUPLICATION (MEDIUM)

**Problem:** Two parallel corruption metrics:
- `link.userData.corruption` (number 0-1)
- `link.userData.corruptionLevel` (number 0-1)

**Impact:**
- Confusion about which to use
- Inconsistent data
- Redundant computation

**Recommendation:**
1. Determine canonical format
2. Consolidate to single metric
3. Update all readers

---

### 4. MISSING WRITER AUTHORITY (HIGH)

**Problem:** No canonical writers identified for:
- `link.synergy` (legacy)
- `link.userData.synergy` (legacy)
- `link.userData.synergy2_1` (not examined)

**Impact:**
- Unknown data origin
- Unclear update frequency
- Potential for inconsistent updates

**Recommendation:**
1. Audit writer systems for these metrics
2. Establish canonical authorities
3. Document update frequencies

---

## CATEGORY SUMMARY

### GAMEPLAY METRICS
- `link.userData.corruptionLevel` (canonical, single writer)
- `link.userData.quality` (derived, composite metric)

### VISUAL METRICS
- `link.userData.synergyBonus` (derived, per-frame)
- `link.userData.synergy2_1` (derived, visual bridge)
- `link.userData.visualGlow` (derived, transient)

### LEGACY/DEPRECATED
- `link.synergy` (no clear authority)
- `link.userData.synergy` (no clear authority)
- `link.userData.corruption` (duplicate of corruptionLevel)

### ANTI-PATTERNS
- VisualTemplateReferenceImplementations.js writes to metrics

---

## NEXT STEPS

### IMMEDIATE (CRITICAL)
1. Remove metric writes from `VisualTemplateReferenceImplementations.js`
2. Audit writer systems for `synergy` metrics
3. Determine canonical corruption format

### SHORT-TERM (HIGH PRIORITY)
1. Consolidate synergy to single format
2. Establish clear authority boundaries
3. Document all metric writers

### LONG-TERM (ARCHITECTURAL)
1. Implement Metric Authority pattern
2. Enforce read-only visual access
3. Create metric validation layer

---

## FILES REQUIRING ATTENTION

### ANTI-PATTERN (CRITICAL)
- `VisualTemplateReferenceImplementations.js` - Remove metric writes

### SYNERGY FRAGMENTATION (HIGH)
- ComputeSynergyScore2_1 (not examined) - Determine authority
- All synergy readers - Update to canonical format

### CORRUPTION DUPLICATION (MEDIUM)
- LinkCorruptionTransmission_v1.js - Choose single format
- All corruption readers - Update to canonical format

---

**Audit completed:** 2026-03-09  
**Status:** ACTION REQUIRED  
**Priority:** HIGH