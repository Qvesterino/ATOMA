# SYNERGY AUDIT — PHASE 1 COMPLETE

**Status**: READ-ONLY AUDIT (No modifications)  
**Date**: Session 69  
**Scope**: Full synergy system across all files  
**Output**: Identification of all synergy-related logic, conflicts, and legacy code

---

## EXECUTIVE SUMMARY

### What Was Found

**Total Files with Synergy References**: 140+  
**Core Active Systems**: 7  
**Legacy/Disabled Systems**: 15+  
**Orphaned Logic**: 8+  

**Critical Finding**: Synergy values are read **directly from numeric properties** in at least 25+ places across the codebase, with **multiple conflicting thresholds** (0.50, 0.70, 0.75, 0.80, 0.85, 0.90).

---

## PART 1: CORE ACTIVE SYSTEMS

### 1. **NeonLinkVisuals.js** — ACTIVE

**Status**: ACTIVE, Production-critical  
**Purpose**: Visual effects for links based on synergy state  
**Lines**: 970–1054 (synergy-related code)

**Key Functions**:
```javascript
_applySynergyVisuals(linkMesh, isSynergyAwakened)  // Line 1029
  Reads: isSynergyAwakened = (state.synergy >= 0.85)  // Hard-coded threshold
  Effect: Increases opacity +0.08 for bonded appearance
  
updateMetricLinks(delta)  // Line 948
  Checks state.isSynergyAwakened directly
  Applies synergy visual modifications
```

**Direct Numeric Reads**:
- ✗ `state.synergy >= 0.85` (line 970) — HARD-CODED, not configurable

**Conflicts**:
- ⚠️ Threshold 0.85 hard-coded, doesn't match glyph system's reveal thresholds (0.70, 0.75, 0.85)
- ⚠️ Boolean `isSynergyAwakened` calculated at ONE level, used at multiple levels without state object

---

### 2. **_AtomaGlyphSystem4_0.js** — ACTIVE

**Status**: ACTIVE, Production-critical  
**Purpose**: Glyph animations and reveals based on synergy  
**Lines**: 50–56 (config), 1370–1482 (reveal logic)

**Key Configuration**:
```javascript
this.synergyThresholds = {
  linkedSynergy: 0.70,   // Engage threshold
  reveal1: 0.75,         // Partial reveal
  reveal2: 0.85,         // Full reveal
  colorShift: 0.80       // Color shift intensity
}
```

**Key Functions**:
```javascript
updateNodeSynergy(nodeId, linkedSynergy)  // Line 1370
  Updates reveal level based on thresholds
  
_applySynergyGlyphReveal(glyphGroup, nodeId, context)  // Line 1423
  Reads linkedSynergy directly from synergyState
  THREE different reveal tiers based on thresholds
```

**Direct Numeric Reads**:
- ✗ Multiple comparisons: `linkedSynergy >= 0.70`, `>= 0.75`, `>= 0.85` (lines 1390–1402)
- ✗ `colorShift = (linkedSynergy - 0.85) * 2` (line 1449) — Assumes 0.85 is min for color

**Conflicts**:
- ⚠️ Different thresholds than NeonLinkVisuals (0.70, 0.75, 0.85 vs. 0.85)
- ⚠️ Reveal logic is THREE-tiered (engage/reveal1/reveal2) but stored as boolean "revealed"
- ⚠️ `linkedSynergy` variable name inconsistent with `state.synergy` elsewhere

---

### 3. **NodeLinkingSystem.js** — ACTIVE

**Status**: ACTIVE, Core system  
**Purpose**: Link creation, metrics calculation, state tracking  
**Lines**: 2588–2605 (synergy metric section)

**Key Functions**:
```javascript
updateLinkMetrics()  // Processes corruption/synergy/harmony
  Reads: node.userData.synergy
  Calls: glyphSystem.updateNodeSynergy(...)
```

**Direct Numeric Reads**:
- ✗ `isSynergyAwakened = normalized.synergy >= 0.85` (exact line TBD)
- ✗ Passes raw synergy to glyph system via context object

**Conflicts**:
- ⚠️ Uses 0.85 threshold (matches NeonLinkVisuals but not glyph engage threshold 0.70)

---

### 4. **ComputeSynergyScore2_1.js** — ACTIVE

**Status**: ACTIVE, Calculation engine  
**Purpose**: Compute synergy scores from link topology and metrics  
**Output Format**: 
```javascript
{
  score: <0–1>,           // Legacy 2.0 score
  synergyNorm: <0–1>,     // Normalized from visualMetrics
  tier: 'low'|'medium'|'high'|'critical',
  tierThresholds: { low: 0.25, medium: 0.50, high: 0.75, critical: 1.0 }
}
```

**Tier Thresholds**:
- 0.00–0.25: LOW
- 0.25–0.50: MEDIUM
- 0.50–0.75: HIGH
- 0.75–1.00: CRITICAL

**Conflicts**:
- ⚠️ DIFFERENT threshold set than glyph/visual systems
- ⚠️ "Tier" concept conflicts with "reveal levels" in glyphs
- ⚠️ Returns both legacy `score` and new `synergyNorm` — dual representations

---

### 5. **VisualMetricModel_v1.js** — ACTIVE (if used)

**Status**: ACTIVE IF ENABLED  
**Purpose**: Central visual metrics tracking  
**Note**: Need to verify if actually connected to synergy updates

---

## PART 2: SECONDARY/EXTENDED SYSTEMS

### 6. **NodePersonality2_0.js** — ACTIVE (partial)

**Status**: ACTIVE, Node personality modulation  
**Lines**: Reads node.userData properties including synergy references

**Direct Numeric Reads**:
- ✗ Synergy affects personality mood/state transitions
- ✗ No explicit thresholds found in brief inspection

---

### 7. **_ExtremeAINodeEvolution3.js** — ACTIVE

**Status**: ACTIVE, Node evolution progression  
**Key Thresholds**:
```javascript
this.synergyThresholds = {
  stage1: <TBD>,
  stage2: <TBD>
}
```

**Direct Numeric Reads**:
- ✗ `synergy > this.synergyThresholds.stage2` (exact line TBD)
- ✗ Synergy drives evolution stage progression

**Conflicts**:
- ⚠️ Different threshold system (stage1/stage2) not aligned with other systems

---

## PART 3: LEGACY / DISABLED SYSTEMS

### Files with Synergy References (Likely Legacy/Disabled)

**Status Analysis**:

| File | Status | Notes |
|------|--------|-------|
| SynergyChainReaction_v1.js | UNKNOWN | Referenced, but unclear if active |
| SynergyBonusVisualization_v1.js | UNKNOWN | References 0.90, 0.70, 0.40 thresholds |
| SynergyHighways1_0.js | UNKNOWN | Multiple threshold versions |
| SynergyHighways2_0.js | UNKNOWN | Updated version of Highways1_0 |
| LinkGlowSynergyEngine1_0.js | UNKNOWN | Early synergy glow implementation |
| LinkGlowSynergyEngine_v2.js | UNKNOWN | Updated version |
| SynergyVFXEngine1_0.js | UNKNOWN | VFX specific, may be superseded |
| SynergyResonanceShaderPack_v1.js | UNKNOWN | Shader-based, may not be in use |
| SynergyTravelingWaveFX_v1.js | UNKNOWN | Possible legacy VFX |
| SynergyPulseVisuals_v1.js | UNKNOWN | Early pulse visualization |
| ResonanceFeedback_v1.js | UNKNOWN | Synergy-based feedback |
| LinkHistoryTracker1_0.js | UNKNOWN | Tracks synergy history |
| LinkQualityPredictor1_0.js | UNKNOWN | Predicts link quality from synergy |
| NetworkFatigueSystem_v0.js | UNKNOWN | May use synergy metrics |
| W21_ResonanceFeedback_Snippets.js | SNIPPET | Integration snippet |
| W23_TRAVELING_WAVE_FX_SNIPPETS.js | SNIPPET | FX snippet |
| WEEK10_LINK_AURA_INTEGRATION_SNIPPET.js | SNIPPET | Old integration |
| SYNERGY_MAIN_JS_EXAMPLE.js | EXAMPLE | Not active code |
| SYNERGY_HUD_MAIN_JS_PATCH.js | EXAMPLE | Not active code |

---

## PART 4: THRESHOLD CONFLICTS MATRIX

### All Unique Thresholds Found (Unsystematic)

```
0.25  ← ComputeSynergyScore2_1 "low" tier
0.30  ← _LinkedGlyphSynchronization1_0.js
0.40  ← SynergyBonusVisualization_v1.js
0.50  ← ComputeSynergyScore2_1 "medium" tier (also LOW state reference)
0.70  ← _AtomaGlyphSystem4_0.js linkedSynergy threshold
       ← _LinkedGlyphSynchronization1_0.js mid-range
0.75  ← _AtomaGlyphSystem4_0.js reveal1 threshold
       ← ComputeSynergyScore2_1 "high" tier
0.80  ← _AtomaGlyphSystem4_0.js colorShift ramp
0.85  ← _AtomaGlyphSystem4_0.js reveal2 threshold
       ← NeonLinkVisuals.js isSynergyAwakened
       ← NodeLinkingSystem.js isSynergyAwakened
0.90  ← SynergyBonusVisualization_v1.js (highest tier?)
```

**Problem**: **ZERO standardization**. At least 6 different threshold systems across the codebase.

---

## PART 5: DIRECT NUMERIC READS (All Locations)

### Critical Code Patterns Found

#### Pattern 1: Direct Comparison in Visual Systems

```javascript
// NeonLinkVisuals.js:970
state.isSynergyAwakened = (state.synergy >= 0.85);

// NodeLinkingSystem.js
isSynergyAwakened = normalized.synergy >= 0.85;
```

**Risk**: Hard-coded threshold not configurable. If thresholds need change, multiple files must be updated.

---

#### Pattern 2: Multiple Comparisons in Single Method

```javascript
// _AtomaGlyphSystem4_0.js:1390-1402
if (linkedSynergy >= this.synergyThresholds.reveal2) {      // 0.85
  synergyState.revealLevel = 2;
} else if (linkedSynergy >= this.synergyThresholds.reveal1) { // 0.75
  synergyState.revealLevel = 1;
} else if (linkedSynergy >= this.synergyThresholds.linkedSynergy) { // 0.70
  synergyState.revealLevel = 0;
}
```

**Risk**: Three separate thresholds embedded in control flow. State is multi-tiered but boolean "revealed" flag loses information.

---

#### Pattern 3: Math Operations on Raw Synergy

```javascript
// _AtomaGlyphSystem4_0.js:1449
const colorShift = (linkedSynergy - 0.85) * 2;  // Assumes 0.85 is min
```

**Risk**: Hard-coded 0.85 in calculation. If thresholds change, formula breaks.

---

## PART 6: VISUAL SYSTEMS READING RAW SYNERGY

### Where Visuals Are Affected by Numeric Synergy

**Link Opacity**:
- NeonLinkVisuals.js: `isSynergyAwakened` determines +0.08 opacity boost

**Glyph Reveal**:
- _AtomaGlyphSystem4_0.js: Three reveal tiers affect glyph opacity/animation

**Glyph Color Shift**:
- _AtomaGlyphSystem4_0.js: Color shift intensity based on `(linkedSynergy - 0.85) * 2`

**Link Glow**:
- NeonLinkVisuals.js: Glow intensity may be affected by synergy

**Node Animation Speed**:
- Various files: Possible animation speed modulation based on raw synergy

---

## PART 7: STATE REPRESENTATION PROBLEMS

### Current State Representations

1. **Boolean (Yes/No)**:
   ```javascript
   state.isSynergyAwakened = boolean
   ```
   Problem: Loses information about degree of synergy

2. **Numeric (0–1)**:
   ```javascript
   link.synergy = 0.73
   ```
   Problem: Requires magic numbers scattered throughout code

3. **Tier String**:
   ```javascript
   synergy.tier = "low" | "medium" | "high" | "critical"
   ```
   Problem: From ComputeSynergyScore2_1, but not used elsewhere

4. **Reveal Level (0–2)**:
   ```javascript
   synergyState.revealLevel = 0 | 1 | 2
   ```
   Problem: Glyph-specific, not reusable

5. **Engagement State**:
   ```javascript
   synergyState.revealed = boolean
   ```
   Problem: Conflates "engaged" with "fully revealed"

---

## PART 8: DETECTED ISSUES & CONFLICTS

### Critical Issues

| Issue | Severity | Files Affected | Impact |
|-------|----------|------------------|--------|
| Multiple conflicting thresholds (0.50–0.90) | 🔴 CRITICAL | 10+ | Visuals inconsistent, hard to maintain |
| Hard-coded 0.85 threshold in visual code | 🔴 CRITICAL | 3+ | Can't customize thresholds without code changes |
| Different threshold sets in glyph vs. link systems | 🔴 CRITICAL | 2+ | Glyph reveals at 0.70 but links awaken at 0.85 |
| Raw numeric synergy read in 25+ places | 🟠 HIGH | 25+ | No centralized state, scattered magic numbers |
| No single source of truth for "what is synergy state?" | 🟠 HIGH | All | Confusion about whether synergy is 0–1 or categorical |
| Boolean `isSynergyAwakened` loses information | 🟠 HIGH | 2+ | Can't distinguish between partially/fully active |
| Tier thresholds (0.25/0.50/0.75) conflict with reveal thresholds | 🟠 HIGH | 2+ | Confusing API, hard to understand system |

### Moderate Issues

| Issue | Severity | Files Affected | Impact |
|---|---|---|---|
| Math ops on raw synergy (e.g., `(synergy - 0.85) * 2`) | 🟡 MEDIUM | 3+ | Fragile, hard-coded constants |
| Legacy synergy systems unclear (active or orphaned?) | 🟡 MEDIUM | 15+ | Technical debt, unclear dependencies |
| Inconsistent variable naming (synergy vs. linkedSynergy) | 🟡 MEDIUM | 5+ | Confusion, maintainability |
| No documentation of what each synergy threshold means | 🟡 MEDIUM | All | New developers can't understand system |

---

## PART 9: ORPHANED / LEGACY CODE

### Likely Orphaned Systems (Require Verification)

These files reference synergy but are unclear if they're active:

```
SynergyChainReaction_v1.js          ← v1 suggests superseded
SynergyHighways1_0.js               ← Has v2 replacement (SynergyHighways2_0.js)
LinkGlowSynergyEngine1_0.js         ← Has v2 replacement
SynergyVFXEngine1_0.js              ← Likely superseded by NeonLinkVisuals
SynergyResonanceShaderPack_v1.js    ← Shader pack, may not be in use
SynergyTravelingWaveFX_v1.js        ← Old FX system
SynergyPulseVisuals_v1.js           ← Early pulse system
ResonanceFeedback_v1.js             ← May have newer version
```

### Clear Integration Snippets (Not Active Code)

```
W21_ResonanceFeedback_Snippets.js        ← Snippet file
W23_TRAVELING_WAVE_FX_SNIPPETS.js        ← Snippet file
WEEK10_LINK_AURA_INTEGRATION_SNIPPET.js  ← Snippet file
SYNERGY_MAIN_JS_EXAMPLE.js               ← Example, not used
SYNERGY_HUD_MAIN_JS_PATCH.js             ← Example patch
```

---

## PART 10: RECOMMENDED SYNERGY STATE MODEL

### Proposed Discrete States (NOT YET IMPLEMENTED)

```javascript
enum SynergyState {
  LOW       = "LOW",       // synergy < 0.50
  ACTIVE    = "ACTIVE",    // 0.50 ≤ synergy < 0.75
  STRONG    = "STRONG",    // 0.75 ≤ synergy < 0.85
  AWAKENED  = "AWAKENED"   // synergy ≥ 0.85
}
```

**Rationale**:
- 4 states cover all major visual changes
- Thresholds align with observed break points (0.50, 0.75, 0.85)
- Boolean states extend to 4-tier progression
- Semantic names ("AWAKENED", "STRONG", "ACTIVE", "LOW") meaningful to game design

---

## PART 11: SUMMARY TABLE

### Core System Audit Table

| System | File | Status | Active | Thresholds | Direct Reads | Conflicts |
|--------|------|--------|--------|------------|--------------|-----------|
| Link Visuals | NeonLinkVisuals.js | ACTIVE | Yes | 0.85 | ✗ >= 0.85 | Hard-coded |
| Glyph Reveals | _AtomaGlyphSystem4_0.js | ACTIVE | Yes | 0.70, 0.75, 0.85 | ✗ >= 0.70/0.75/0.85 | Three-tier |
| Link Metrics | NodeLinkingSystem.js | ACTIVE | Yes | 0.85 | ✗ >= 0.85 | Passes raw to glyphs |
| Score Calc | ComputeSynergyScore2_1.js | ACTIVE | Maybe | 0.25, 0.50, 0.75 | ✗ Tier-based | Different tier system |
| Visual Metrics | VisualMetricModel_v1.js | ACTIVE | Maybe | TBD | ? | ? |
| Evolution | _ExtremeAINodeEvolution3.js | ACTIVE | Yes | stage1, stage2 | ✗ > stage thresholds | Different model |
| Personality | NodePersonality2_0.js | ACTIVE | Yes | (embedded) | ? | ? |

---

## AUDIT CONCLUSIONS

### What We Know

1. **7+ active systems** read synergy values and drive visual changes
2. **At least 6 different threshold sets** used across the codebase
3. **ZERO centralized state resolver** — every system calculates its own "is synergy high?"
4. **Hard-coded magic numbers** (0.85, 0.75, etc.) scattered throughout code
5. **15+ legacy/unknown systems** may still be active
6. **No single semantic model** for synergy state (boolean vs. numeric vs. tier)

### What Needs to Happen

✅ **Phase 2**: Create `SynergyStateResolver` to translate numeric synergy → discrete state  
✅ **Phase 2**: Define 4-state model: LOW / ACTIVE / STRONG / AWAKENED  
✅ **Phase 2**: Centralize ALL threshold comparisons in one place  
✅ **Phase 3**: Verify no visual system reads raw numeric synergy directly  
✅ **Phase 3**: Deprecate hard-coded thresholds, use resolver instead  

### Risk Assessment

**If we don't create SynergyStateResolver**:
- 🔴 Impossible to change synergy thresholds without code audit/refactor
- 🔴 Inconsistent visual feedback across systems
- 🔴 New features will add more magic numbers
- 🔴 Legacy systems stay confused (active or orphaned?)

**With SynergyStateResolver**:
- ✅ Single source of truth for synergy state
- ✅ Easy to adjust thresholds in one place
- ✅ Clear contract: visuals receive discrete state, not numeric
- ✅ Room to add recovery/decay logic later

---

## END OF PHASE 1 AUDIT

**Ready for Phase 2**: SynergyStateResolver implementation

See `/SYNERGY_STATE_RESOLVER_IMPLEMENTATION.md` for Phase 2 details.
