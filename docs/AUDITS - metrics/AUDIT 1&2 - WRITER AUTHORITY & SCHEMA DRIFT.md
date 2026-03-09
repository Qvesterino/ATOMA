# AUDIT 1 & 2 — WRITER AUTHORITY & SCHEMA DRIFT

## EXECUTIVE SUMMARY

**Total Surface Area:** 214 metric locations (from METRIC SURFACE)
- 44 WRITE operations across 7 primary writers
- Significant schema drift detected in multiple metric families
- Mixed authority levels: canonical, gameplay, visual, anti-pattern, test/debug

---

## AUDIT 1 — WRITER AUTHORITY MAP

### PRIMARY WRITERS (7 systems)

| # | Writer | Authority Level | Metrics Written | Frequency | Notes |
|---|--------|-----------------|-----------------|------------|-------|
| 1 | `NodeMetricEngine.js` | **CANONICAL** | `node.userData.metrics` | Per-frame (init) | Core metric initialization |
| 2 | `SafeMetricsDNAIntegration1_0.js` | **CANONICAL** | `node.userData.metrics` | Per-frame (wrap) | Legacy initialization wrapper |
| 3 | `HarmonyStabilizationSystem_v1.js` | **GAMEPLAY** | `node.userData.corruption`, `harmonyLevel`, `harmonyVisualState` | Per-frame | Healing mechanic, gameplay logic |
| 4 | `PHASE5_CorruptionBridge_v1.js` | **GAMEPLAY** | `node.userData.corruption` | Per-frame | Inter-network propagation |
| 5 | `LinkCorruptionTransmission_v1.js` | **GAMEPLAY** | `link.userData.corruptionLevel`, `visualIntensity`, `synergyCollapse` | Per-frame | Link-level corruption tracking |
| 6 | `LinkQualityCalculator.js` | **DERIVED** | `link.userData.quality` | Per-frame | Computed from node metrics |
| 7 | `SynergyBonusVisualization_v1.js` | **DERIVED/visual** | `link.userData.synergyBonus` | Per-frame | Visual enhancement data |

### SECONDARY WRITERS (edge cases)

| Writer | Authority Level | Metrics Written | Concerns |
|--------|-----------------|-----------------|-----------|
| `NodeLinkingSystem.js` | **GAMEPLAY** | `harmonyStabilized`, `harmonyDampingFactor`, `corruptedState`, `corruptionLevel` | Writes to corruptionLevel |
| `NodeVisualStateBinder.js` | **VISUAL** | `synergyPulseActive`, `synergyScore`, `harmonyStabilized`, `harmonyDampingFactor` | Visual state tracking |
| `T4004_HARMONY_HEALING_TEST_RUNNER.js` | **TEST** | `corruption` | Test setup code |
| `EXAMPLES/*.js` | **EXAMPLE** | Various | Demo code, not production |
| `VisualTemplateReferenceImplementations.js` | **ANTI-PATTERN** | `harmonyVisualStrength`, `harmony`, `synergy` | ⚠️ **Illegal: writes metrics from visuals** |
| `T2_CorruptionVisualIntegration_v1.js` | **VISUAL** | `corruptionWavePhase`, `corruptionWaveIntensity` | Visual effect state |

### AUTHORITY LEVEL DEFINITIONS

**🟢 CANONICAL**
- Core initialization systems
- Single source of truth for metric structure
- No gameplay logic, pure data management

**🟡 GAMEPLAY**
- Legitimate gameplay mechanics
- Modify metrics as part of gameplay logic
- Should be coordinated with canonical writers

**🟡 DERIVED**
- Compute metrics from other metrics
- Read-only consumers of canonical data
- Output is for visual/analytical use only

**🟠 VISUAL**
- Write visual state (shader parameters, effect timing)
- Should not affect gameplay metrics
- Derived from canonical metrics

**🔴 ANTI-PATTERN**
- **ILLEGAL**: Write gameplay metrics from visual systems
- Violates data flow direction (visuals should be read-only)
- Example: `VisualTemplateReferenceImplementations.js`

**⚪ TEST/DEBUG**
- Test setup code
- Example runners
- Should not be in production builds

---

## AUDIT 2 — SCHEMA DRIFT ANALYSIS

### NODE METRIC VARIANTS

#### Corruption Family
```
✓ corruption                  - Primary (0-1 scale)
✗ corruptionLevel             - Duplicate (node.userData)
✗ corruptionVisualState        - Visual state
✗ corrupted                  - Boolean flag
✗ corruptedState             - String enum ('CORRUPTED')
```
**Status:** ⚠️ **DRIFT DETECTED**

**Canonical:** `node.userData.corruption` (0-1 scale)

**Drift Sources:**
- `NodeLinkingSystem.js` writes `corruptionLevel`
- `LinkCorruptionTransmission_v1.js` reads `corruptionLevel` from links
- `T2_CorruptionVisualIntegration_v1.js` reads `corruptionLevel` from links
- `HarmonyStabilizationSystem_v1.js` writes `corrupted` (boolean)
- `NodeLinkingSystem.js` writes `corruptedState` (string)

**Impact:** Moderate - Both `corruption` and `corruptionLevel` exist. Visual state variants are acceptable.

---

#### Harmony Family
```
✓ harmony                     - Primary (0-1 scale)
✗ harmonyLevel               - Duplicate (0-1 scale)
✗ harmonyVisualState         - Visual state
✗ harmonyAuraStrength         - Aura intensity
✗ harmonyVisualStrength      - Visual strength (anti-pattern)
```
**Status:** ⚠️ **DRIFT DETECTED**

**Canonical:** `node.userData.harmonyLevel` (0-1 scale)

**Drift Sources:**
- `HarmonyStabilizationSystem_v1.js` writes both `harmonyLevel` and `harmonyVisualState`
- `HarmonyAuraController.js` reads `harmonyAuraStrength` (derived)
- `VisualTemplateReferenceImplementations.js` writes `harmonyVisualStrength` (anti-pattern)

**Impact:** Moderate - `harmony` and `harmonyLevel` both exist. Visual variants acceptable.

---

#### Synergy Family (Node)
```
✓ synergy                     - Primary (0-1 scale)
✗ synergyScore               - Visual score
✗ synergyPulseActive        - Visual state flag
```
**Status:** ✅ **ACCEPTABLE**

**Canonical:** `node.userData.synergy` (0-1 scale)

**Drift Sources:**
- `NodeVisualStateBinder.js` writes `synergyScore` and `synergyPulseActive` (visual tracking)

**Impact:** Low - Visual variants are derived from canonical synergy.

---

#### Stability Family
```
✓ stability                   - Primary (0-1 scale)
✗ instability               - Inverse (not used)
```
**Status:** ✅ **ACCEPTABLE**

**Canonical:** `node.userData.stability` (0-1 scale)

**Impact:** None - Minimal drift detected.

---

#### Load Family
```
✓ load                        - Primary (0-1 scale)
✗ loadPressure              - Duplicate (not used)
✗ loadRatio                 - Derived ratio
✗ loadMax                   - Max load threshold
```
**Status:** ⚠️ **DRIFT DETECTED**

**Canonical:** `node.userData.load` (0-1 scale)

**Drift Sources:**
- `NodeDynamicMetrics.js` uses `loadMax` (configuration)
- `LinkQualityCalculator.js` uses `loadRatio` (derived)

**Impact:** Low - Derived variants are acceptable.

---

#### Integrity Family
```
✓ integrity                    - Primary (0-100 scale)
```
**Status:** ✅ **ACCEPTABLE**

**Canonical:** `node.userData.integrity` (0-100 scale, LINK INTEGRITY MODEL)

**Impact:** None - No drift detected.

---

#### Clarity/Energy/Resonance Family
```
✓ clarity                     - Archetype metric (0-1)
✓ energy                      - Archetype metric (0-1)
✗ resonance                   - Multiple meanings
✗ localResonance             - Feedback value
✗ networkStress             - Computed stress
```
**Status:** ⚠️ **DRIFT DETECTED**

**Canonical:** `node.userData.clarity`, `node.userData.energy` (archetype metrics)

**Drift Sources:**
- `resonance` used in: `WEEK13_ARCHETYPE_CURVES_SNIPPETS.js`, `ResonanceFeedback_v1.js`, `SNIPPETS/W21_ResonanceFeedback_Snippets.js`
- `localResonance` written by `ResonanceFeedback_v1.js`
- `networkStress` computed by `MetricInterpretationLayer_v1.js`

**Impact:** High - `resonance` has multiple conflicting meanings.

---

### LINK METRIC VARIANTS

#### Synergy Family (Link)
```
✓ synergy                     - Primary (0-100 scale)
✓ synergy2_1               - Alternative format (synergyNorm, score)
✓ synergyBonus             - Tiered bonus structure
✓ visualSynergy            - Derived visual value
```
**Status:** 🔴 **SEVERE DRIFT DETECTED**

**Canonical:** `link.userData.synergy` (0-100 scale)

**Drift Sources:**
- `ComputeSynergyScore2_1.js` writes `synergy2_1` object
- `SynergyBonusVisualization_v1.js` writes `synergyBonus` object
- `LinkGlowSynergyEngine_v2.js` reads `synergy2_1.synergyNorm` or `synergy.score`
- `NodePersonality_VisualAdapter.js` reads both `synergy2_1.synergyNorm` and `synergy.synergyNorm`

**Impact:** **SEVERE** - Three different synergy formats exist across the codebase. Requires consolidation.

**Variants Detail:**
```javascript
// Format 1: Raw synergy (0-100)
link.userData.synergy = 75;

// Format 2: Synergy2_1 object
link.userData.synergy2_1 = {
  score: 0.75,
  synergyNorm: 0.75
};

// Format 3: SynergyBonus object
link.userData.synergyBonus = {
  tier: 2,
  tierName: 'STRONG_PULSE',
  pulseStrength: 0.5625,
  chromaShift: 0.45,
  resonanceRipples: 0.5,
  lastUpdate: 1234567890
};
```

---

#### Quality Family
```
✓ quality                    - Primary object (score, level, components)
```
**Status:** ✅ **ACCEPTABLE**

**Canonical:** `link.userData.quality` object

**Structure:**
```javascript
link.userData.quality = {
  score: 75,              // 0-100
  level: "Medium",        // "High" | "Medium" | "Low" | "Critical"
  structural: 80,        // 0-100
  harmony: 50,           // 0-100
  load: 60,              // 0-100
  corruption: 70,        // 0-100
  updatedAt: 1234567890
};
```

**Impact:** None - Single canonical format.

---

#### Corruption Family (Link)
```
✓ corruptionLevel            - Primary (0-1 scale)
✓ visualIntensity           - Visual mapping
✓ corruptionVisualState     - Visual state object
✓ corruptionWavePhase       - Wave animation state
✓ corruptionWaveIntensity   - Wave animation intensity
```
**Status:** 🟡 **ACCEPTABLE DRIFT**

**Canonical:** `link.userData.corruptionLevel` (0-1 scale)

**Drift Sources:**
- `LinkCorruptionTransmission_v1.js` writes all variants
- Visual variants are shader parameters

**Impact:** Low - Visual variants are derived from canonical `corruptionLevel`.

**Visual State Structure:**
```javascript
link.userData.corruptionVisualState = {
  colorTint: { r: 1, g: 1, b: 1 },
  glowIntensity: 0.5,
  glowFrequency: 2.0,
  distortionAmount: 0
};
```

---

## CRITICAL ISSUES

### 🔴 Issue #1: Link Synergy Schema Fragmentation

**Severity:** CRITICAL

**Problem:** Three different synergy formats exist without clear hierarchy:
1. `link.userData.synergy` (raw 0-100)
2. `link.userData.synergy2_1` (object with score + synergyNorm)
3. `link.userData.synergyBonus` (tiered visual enhancement)

**Affected Systems:**
- `LinkGlowSynergyEngine_v2.js` - tries both `synergy2_1` and `synergy`
- `NodePersonality_VisualAdapter.js` - reads both `synergy2_1.synergyNorm` and `synergy.synergyNorm`
- `SynergyBonusVisualization_v1.js` - writes `synergyBonus` from `visualGlow`

**Recommended Action:**
1. Designate canonical format (recommend: `synergy2_1` structure)
2. Create migration layer for legacy `synergy` access
3. Deprecate `synergyBonus` (should be derived, not stored)

---

### 🟡 Issue #2: Node Corruption Schema Duplication

**Severity:** MODERATE

**Problem:** Both `corruption` and `corruptionLevel` exist for nodes.

**Affected Systems:**
- `NodeLinkingSystem.js` writes `corruptionLevel`
- Most systems read `corruption`

**Recommended Action:**
1. Standardize on `corruption` (0-1 scale) for nodes
2. Use `corruptionLevel` ONLY for links (where it's canonical)
3. Create alias mapping if backward compatibility needed

---

### 🟡 Issue #3: Node Harmony Schema Duplication

**Severity:** MODERATE

**Problem:** Both `harmony` and `harmonyLevel` exist for nodes.

**Affected Systems:**
- `HarmonyStabilizationSystem_v1.js` writes both
- Visual systems read `harmonyAuraStrength`

**Recommended Action:**
1. Standardize on `harmonyLevel` (0-1 scale) for nodes
2. Migrate all readers to `harmonyLevel`
3. Deprecate `harmony` raw field

---

### 🟠 Issue #4: Anti-Pattern Writer Detected

**Severity:** MODERATE

**Problem:** `VisualTemplateReferenceImplementations.js` writes gameplay metrics from visual logic.

**Violations:**
```javascript
// ✗ WRONG: Writing state from visuals
node.userData.harmonyVisualStrength = aura.strength;

// ✗ WRONG: Feedback mutation
if (aura.strong) { node.userData.harmony += 0.01; }

// ✗ WRONG: Stat mutation from visuals
link.userData.synergy = glow.intensity;
if (glow.brightness > 0.8) { link.userData.synergy += 0.01; }
```

**Recommended Action:**
1. Mark file as ANTI-PATTERN / DO NOT USE
2. Remove or refactor to read-only consumer
3. Add linter rule to prevent metric writes from visual files

---

### 🔴 Issue #5: Ambiguous "Resonance" Metric

**Severity:** MODERATE-HIGH

**Problem:** `resonance` has multiple conflicting meanings:
1. Archetype personality trait (`node.userData.personality.resonance`)
2. Local feedback value (`node.userData.resonanceFeedback.localResonance`)
3. Network coherence metric (computed, not stored)
4. Harmonic resonance for halos

**Affected Systems:**
- `SNIPPETS/WEEK13_ARCHETYPE_CURVES_SNIPPETS.js` - archetype resonance
- `ResonanceFeedback_v1.js` - feedback resonance
- `HarmonicNodeResonanceHalos.js` - visual resonance halos

**Recommended Action:**
1. Rename `localResonance` to `resonanceSignal` or `coherenceScore`
2. Keep archetype resonance as is
3. Document which "resonance" is used in each context

---

## RECOMMENDATIONS

### Immediate Actions (High Priority)

1. **Fix Link Synergy Schema Fragmentation**
   - Designate `synergy2_1` as canonical
   - Create compatibility layer for `synergy` access
   - Migrate all readers/writers

2. **Standardize Node Corruption**
   - Use `corruption` for nodes
   - Use `corruptionLevel` for links only
   - Add migration layer

3. **Standardize Node Harmony**
   - Use `harmonyLevel` for nodes
   - Migrate all systems to `harmonyLevel`

4. **Mark Anti-Pattern File**
   - Document `VisualTemplateReferenceImplementations.js` as DO NOT USE
   - Remove or refactor metric write code

### Medium-Term Actions

5. **Create Metric Access Layer**
   - Implement canonical getter/setter functions
   - Add validation and logging
   - Detect drift at runtime

6. **Audit Writer Coordination**
   - Review all 7 primary writers
   - Ensure no duplicate writes
   - Document writer priority

7. **Visual Metric Separation**
   - Enforce read-only access from visual systems
   - Create separate visual state namespace
   - Add linter rules

### Long-Term Actions

8. **Metric Schema Registry**
   - Define canonical schema for all metrics
   - Add type checking
   - Version metrics for migrations

9. **Authority Enforcement**
   - Implement write locks per metric
   - Log all metric writes
   - Detect unauthorized writers

10. **Documentation Update**
    - Document canonical metric names
    - Create migration guide
    - Update all system docs

---

## WRITER AUTHORITY MATRIX

### Canonical Writers (🟢)
- `NodeMetricEngine.js`
- `SafeMetricsDNAIntegration1_0.js`

### Gameplay Writers (🟡)
- `HarmonyStabilizationSystem_v1.js`
- `PHASE5_CorruptionBridge_v1.js`
- `LinkCorruptionTransmission_v1.js`
- `NodeLinkingSystem.js`
- `NodeVisualStateBinder.js`

### Derived/Visual Writers (🟠)
- `LinkQualityCalculator.js`
- `SynergyBonusVisualization_v1.js`
- `T2_CorruptionVisualIntegration_v1.js`

### Anti-Pattern Writers (🔴)
- `VisualTemplateReferenceImplementations.js`

### Test/Debug Writers (⚪)
- `T4004_HARMONY_HEALING_TEST_RUNNER.js`
- `EXAMPLES/*.js`

---

## CONCLUSION

**Total Writers:** 7 primary + 4 secondary = **11 systems**

**Schema Drift:** Detected in 5 metric families:
1. 🔴 **Link Synergy** - SEVERE (3 formats)
2. 🟡 **Node Corruption** - Moderate (2 formats)
3. 🟡 **Node Harmony** - Moderate (2 formats)
4. 🟡 **Resonance** - Moderate (multiple meanings)
5. 🟠 **Visual Anti-Patterns** - Moderate (metrics written from visuals)

**Overall Health:** ⚠️ **NEEDS ATTENTION**

The metric system has clear canonical writers but suffers from schema drift due to:
- Lack of migration strategy for format changes
- No enforcement of read-only visual systems
- Organic evolution without central schema management

**Next Steps:**
1. Address link synergy fragmentation (CRITICAL)
2. Standardize node metric names (HIGH)
3. Enforce visual system boundaries (MEDIUM)
4. Create metric access layer (MEDIUM)
5. Document canonical schema (LOW)

---

## APPENDIX: Metric Name Cross-Reference

### Node Metrics
| Metric | Canonical | Variants | Status |
|--------|-----------|----------|--------|
| Corruption | `corruption` | `corruptionLevel`, `corrupted`, `corruptedState`, `corruptionVisualState` | 🟡 Drift |
| Harmony | `harmonyLevel` | `harmony`, `harmonyVisualState`, `harmonyAuraStrength`, `harmonyVisualStrength` | 🟡 Drift |
| Synergy | `synergy` | `synergyScore`, `synergyPulseActive` | ✅ OK |
| Stability | `stability` | `instability` | ✅ OK |
| Load | `load` | `loadPressure`, `loadRatio`, `loadMax` | 🟡 Drift |
| Integrity | `integrity` | - | ✅ OK |
| Clarity | `clarity` | - | ✅ OK |
| Energy | `energy` | - | ✅ OK |
| Resonance | - | `resonance`, `localResonance`, `networkStress` | 🔴 Ambiguous |

### Link Metrics
| Metric | Canonical | Variants | Status |
|--------|-----------|----------|--------|
| Synergy | `synergy2_1` | `synergy`, `synergyBonus`, `visualSynergy` | 🔴 Fragmented |
| Quality | `quality` | - | ✅ OK |
| Corruption | `corruptionLevel` | `corruption`, `visualIntensity`, `corruptionVisualState`, `corruptionWavePhase`, `corruptionWaveIntensity` | 🟡 Drift |
| Integrity | - | (link integrity model pending) | ⚪ Not implemented |

---

**Audit Completed:** 2026-03-09
**Next Audit Cycle:** 2026-03-16 (recommended)