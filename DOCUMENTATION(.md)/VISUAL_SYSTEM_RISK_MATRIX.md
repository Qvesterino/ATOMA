# VISUAL SYSTEM RISK MATRIX - Phase 3 Integration Assessment

**Date:** Session 41  
**Audit Type:** Risk Classification for Phase 3b Refactor  
**Methodology:** Metric dependency analysis + backward compatibility check

---

## RISK SCORING METHODOLOGY

**Risk Score Calculation:**
```
Risk = (Metric_Age × 0.3) + (Integration_Gaps × 0.3) + (Dependency_Count × 0.2) + (Conflict_Severity × 0.2)

Where:
  Metric_Age: 0 (new, Phase 3) to 10 (legacy, pre-audit)
  Integration_Gaps: 0 (fully integrated) to 10 (isolated)
  Dependency_Count: 0 (none) to 10 (many)
  Conflict_Severity: 0 (none) to 10 (critical)

Final Score: 0–10, where:
  0–2 = LOW RISK (safe)
  3–4 = MEDIUM RISK (manageable)
  5–7 = HIGH RISK (refactor needed)
  8–10 = CRITICAL RISK (urgent)
```

---

## SYNERGY & LINK SYSTEMS

### ComputeSynergyScore2_0.js

**Metrics Used:**
- Input: link (reads from 5 different systems)
- Output: synergyScore (0–1), tier (string), components (breakdown)

**Integration Status:**
- ❌ NOT integrated with LinkQualityCalculator
- ❌ Duplicate computation (parallel to LinkQuality)
- ⚠️ Reads from LinkCorrelationEngine, PriorityDecayEngine (legacy sources)
- ❌ No dependency on Phase 3 metrics

**Risk Assessment:**

| Factor | Score | Notes |
|--------|-------|-------|
| Metric Age | 10/10 | Completely legacy formula |
| Integration Gaps | 9/10 | Zero integration with new metrics |
| Dependency Count | 8/10 | Depends on 5 external systems |
| Conflict Severity | 8/10 | Produces values that conflict with LinkQuality |
| **TOTAL RISK** | **8.4/10** | **CRITICAL** |

**Action Items:**
- [ ] Wrap with LinkQualityCalculator adapter
- [ ] Maintain backward compatibility layer
- [ ] Plan deprecation timeline
- [ ] Update all consumers to use LinkQuality

**Refactor Priority:** IMMEDIATE (Week 1)

**Migration Plan:**
```javascript
// OLD: Uses ComputeSynergyScore2_0
const synergyData = computeSynergyScore(link, systems);

// NEW: Use LinkQualityCalculator
function getLegacySynergyData(link) {
  const quality = link.userData?.quality?.score ?? 50;
  const qualityNorm = quality / 100;
  
  // Map new score to old tier system
  let tier = 'low';
  if (quality >= 85) tier = 'critical';
  else if (quality >= 65) tier = 'high';
  else if (quality >= 40) tier = 'medium';
  
  // Provide backward-compatible output
  return {
    score: qualityNorm,  // 0–1
    tier: tier,
    components: {
      type: 0.35 * qualityNorm,
      priority: 0.25 * qualityNorm,
      traffic: 0.20 * qualityNorm,
      decay: 0.10 * qualityNorm,
      topology: 0.10 * qualityNorm
    }
  };
}
```

---

### SynergyVFX1_0.js

**Metrics Used:**
- Input: link.synergyStrength (implicit from link object)
- Output: Glow pulses, trails, auras, bursts (visual only)

**Integration Status:**
- ⚠️ Reads implicit synergyStrength (no explicit source)
- ⚠️ No integration with LinkQualityCalculator
- ✅ Visual-only (no game logic impact)
- ⚠️ Will render incorrectly if synergyStrength not present

**Risk Assessment:**

| Factor | Score | Notes |
|--------|-------|-------|
| Metric Age | 8/10 | Uses legacy implicit metric |
| Integration Gaps | 7/10 | No explicit metric source |
| Dependency Count | 4/10 | Self-contained VFX system |
| Conflict Severity | 5/10 | Wrong values → wrong visual intensity |
| **TOTAL RISK** | **6.0/10** | **HIGH** |

**Action Items:**
- [ ] Add explicit LinkQualityCalculator input
- [ ] Map 0–100 score to 0–1 range for VFX
- [ ] Update glow intensity mapping
- [ ] Test with various quality scores

**Refactor Priority:** Week 2

**Migration Plan:**
```javascript
// Get synergy metric from new source
const linkQuality = link.userData?.quality?.score ?? 50;
const synergyStrength = linkQuality / 100;  // Map to 0–1

// Update glow intensity based on new range
this.linkData.get(linkId).glowIntensity = lerp(
  this.config.glowPulseMin,
  this.config.glowPulseMax,
  synergyStrength  // Now correctly 0–1
);
```

---

### LinkGlowSynergyEngine1_0.js

**Metrics Used:**
- Input: link.synergyScore (with complex fallback chain)
- Output: Link glow color, intensity, pulse speed

**Integration Status:**
- ❌ Uses fallback chain including traffic.load (incompatible)
- ❌ No integration with LinkQualityCalculator
- ⚠️ 5-level fallback logic (fragile)
- ❌ Smoothing not considering metric staleness

**Risk Assessment:**

| Factor | Score | Notes |
|--------|-------|-------|
| Metric Age | 9/10 | Completely legacy fallback chain |
| Integration Gaps | 9/10 | Zero integration with new metrics |
| Dependency Count | 7/10 | Multiple fallback sources |
| Conflict Severity | 7/10 | Fallback chain produces wrong values |
| **TOTAL RISK** | **8.0/10** | **CRITICAL** |

**Action Items:**
- [ ] Remove fallback chain
- [ ] Use only LinkQualityCalculator as source
- [ ] Simplify getSynergyScore function
- [ ] Add null-safety for missing quality data

**Refactor Priority:** IMMEDIATE (Week 1)

**Migration Plan:**
```javascript
// OLD: Complex fallback chain
function getSynergyScore(link) {
  if (typeof link.synergyScore === 'number') return link.synergyScore;
  if (link.linkData?.synergyScore) return link.linkData.synergyScore;
  if (link.synergy?.score) return link.synergy.score;
  if (link.traffic?.load) return link.traffic.load;  // WRONG SCALE!
  return 0.5;
}

// NEW: Single, correct source
function getSynergyScore(link) {
  const quality = link.userData?.quality?.score ?? 50;
  return quality / 100;  // Always 0–1
}
```

---

### SynergyHighways1_0.js & 2_0.js

**Metrics Used:**
- Input: link.synergyStrength (threshold 0.7)
- Output: Highway visibility, thickness, animation

**Integration Status:**
- ⚠️ Reads implicit synergyStrength
- ⚠️ No integration with LinkQualityCalculator
- ✅ Visual-only (no game logic)
- ⚠️ Hardcoded threshold won't match new quality ranges

**Risk Assessment:**

| Factor | Score | Notes |
|--------|-------|-------|
| Metric Age | 7/10 | Legacy implicit metric |
| Integration Gaps | 7/10 | No explicit metric source |
| Dependency Count | 3/10 | Self-contained |
| Conflict Severity | 5/10 | Threshold mismatch (0.7 on 0–1 vs 70 on 0–100) |
| **TOTAL RISK** | **5.5/10** | **HIGH** |

**Action Items:**
- [ ] Map new LinkQuality to visibility threshold
- [ ] Convert threshold from 0.7 (old scale) to 70 (new scale)
- [ ] Test visual appearance with new values
- [ ] Consider dynamic threshold based on average link quality

**Refactor Priority:** Week 2

**Migration Plan:**
```javascript
// Update visibility check
const linkQuality = link.userData?.quality?.score ?? 50;

// OLD: if (link.synergyStrength > 0.7)
// NEW: Map 0–100 to 0–1, then compare to 0.7
const shouldShowHighway = linkQuality > 70;  // 70 is threshold on 0–100 scale

// Update thickness mapping
this.updateHighwayThickness(linkId, linkQuality / 100);
```

---

## NODE QUALITY SYSTEMS

### NodeDynamicMetrics.js ✅

**Metrics Produced:**
- 11 metrics per node (stability, harmony, clarity, energy, etc.)

**Integration Status:**
- ✅ Phase 3 new system
- ✅ Solid, production-ready implementation
- ✅ Clean API, well-documented
- ✅ Used by LinkQualityCalculator

**Risk Assessment:**

| Factor | Score | Notes |
|--------|-------|-------|
| Metric Age | 0/10 | Brand new, Phase 3 |
| Integration Gaps | 1/10 | Minimal integration needed |
| Dependency Count | 2/10 | Only depends on AINodes + LinkingSystem |
| Conflict Severity | 0/10 | No conflicts (new system) |
| **TOTAL RISK** | **0.75/10** | **LOW** ✅ |

**Status:** READY FOR PRODUCTION
**Action:** No changes needed, use as source of truth

---

### NodeQualityCalculator.js ✅

**Metrics Produced:**
- Unified node quality score (0–100)
- Quality level (Prime, Stable, Weak, Critical)

**Integration Status:**
- ✅ Phase 3 new system
- ✅ Depends on NodeDynamicMetrics (correct)
- ✅ No conflicts with existing systems
- ✅ Ready for immediate use in VFX

**Risk Assessment:**

| Factor | Score | Notes |
|--------|-------|-------|
| Metric Age | 0/10 | Brand new, Phase 3 |
| Integration Gaps | 1/10 | Minimal, depends on NodeDynamics |
| Dependency Count | 1/10 | Clean single source |
| Conflict Severity | 0/10 | No conflicts |
| **TOTAL RISK** | **0.5/10** | **LOW** ✅ |

**Status:** READY FOR PRODUCTION
**Action:** Integrate into all node-quality-related VFX

---

### LinkQualityCalculator.js ✅

**Metrics Produced:**
- Unified link quality score (0–100)
- Quality level (High, Medium, Low, Critical)

**Integration Status:**
- ✅ Phase 3 new system
- ✅ Depends on NodeDynamicMetrics (correct)
- ✅ Designed as synergy replacement
- ✅ No conflicts

**Risk Assessment:**

| Factor | Score | Notes |
|--------|-------|-------|
| Metric Age | 0/10 | Brand new, Phase 3 |
| Integration Gaps | 1/10 | Already integrated with NodeDynamics |
| Dependency Count | 1/10 | Single source (NodeDynamics) |
| Conflict Severity | 0/10 | No conflicts (new system) |
| **TOTAL RISK** | **0.5/10** | **LOW** ✅ |

**Status:** READY FOR PRODUCTION
**Action:** Use as authoritative link quality source

---

### CoreMetricsCalculator.js

**Metrics Produced:**
- network-level aggregates (synergy, harmony, instability, corruption, load)

**Integration Status:**
- ❌ Not using NodeDynamicMetrics
- ❌ Not using LinkQualityCalculator
- ❌ Computes own legacy formulas
- ⚠️ Low frequency (2x/sec) but redundant

**Risk Assessment:**

| Factor | Score | Notes |
|--------|-------|-------|
| Metric Age | 9/10 | Legacy calculations |
| Integration Gaps | 8/10 | Zero integration with Phase 3 |
| Dependency Count | 6/10 | Depends on 5+ legacy systems |
| Conflict Severity | 8/10 | Produces conflicting network-level metrics |
| **TOTAL RISK** | **7.75/10** | **HIGH** |

**Action Items:**
- [ ] Refactor to read from NodeDynamicMetrics
- [ ] Remove legacy calculation logic
- [ ] Compute aggregates only
- [ ] Maintain backward-compatible output format

**Refactor Priority:** Week 2

**Migration Plan:**
```javascript
// OLD: Compute stability from node data
this.metrics.stability = nodeStabilityFormula(nodes);

// NEW: Aggregate from NodeDynamicMetrics
this.metrics.stability = average(
  aiNodes.nodes.map(n => n.userData?.metrics?.stability ?? 50)
);

// Same for all other metrics
this.metrics.harmony = average(...harmony values...);
this.metrics.instability = average(...instability values...);
// etc.
```

---

### EvolutionRegistry.js

**Metrics Used:**
- Input: node.userData.evolutionStage (stage-based, not metric-driven)
- Output: Visual VFX overlays (stage 0–4)

**Integration Status:**
- ✅ Self-contained, no conflicts
- ⚠️ Could be enhanced with quality metrics
- ✅ Doesn't depend on legacy metrics
- ✅ Visual-only system

**Risk Assessment:**

| Factor | Score | Notes |
|--------|-------|-------|
| Metric Age | 3/10 | Stage-based, not metric-driven |
| Integration Gaps | 4/10 | Could integrate with quality for enhancement |
| Dependency Count | 2/10 | Minimal dependencies |
| Conflict Severity | 1/10 | No conflicts |
| **TOTAL RISK** | **2.5/10** | **LOW** |

**Status:** Safe, but opportunities for enhancement
**Action:** Optional integration with NodeQualityCalculator in Phase 3c

---

### NodePersonality2_0.js

**Metrics Used:**
- Input: Node archetype (static)
- Output: temperament modifiers (-1 to +1) for stability, harmony, clarity, etc.

**Integration Status:**
- ⚠️ Uses different scale (-1 to +1) than Phase 3 metrics (0–100)
- ⚠️ Not integrated with NodeDynamicMetrics
- ✅ Semantic system (not conflicting, just isolated)
- ⚠️ Needs integration strategy

**Risk Assessment:**

| Factor | Score | Notes |
|--------|-------|-------|
| Metric Age | 6/10 | Pre-Phase 3, isolated scale |
| Integration Gaps | 6/10 | Not integrated with NodeDynamics |
| Dependency Count | 3/10 | Self-contained personality system |
| Conflict Severity | 4/10 | Scale mismatch but no hard conflict |
| **TOTAL RISK** | **4.75/10** | **MEDIUM** |

**Action Items:**
- [ ] Design personality modifier application logic
- [ ] Map -1 to +1 to ±delta for 0–100 metrics
- [ ] Test interaction between base metrics and personality
- [ ] Document modifier hierarchy

**Refactor Priority:** Week 3 (Phase 3b enhancement)

**Integration Strategy:**
```javascript
// Personality modifiers applied as delta
function getAdjustedMetric(baseMetric, personalityModifier, scale = 10) {
  // Scale factor: how many points personality affects the metric
  // For 0–100 metrics, scale=10 means ±1.0 personality = ±10 points
  const delta = personalityModifier * scale;
  const adjusted = baseMetric + delta;
  return Math.max(0, Math.min(100, adjusted));  // Clamp to valid range
}

// Usage
const personalityHarmony = node.userData.personality?.temperament?.harmony ?? 0;
const baseHarmony = node.userData.metrics.harmony;
const adjustedHarmony = getAdjustedMetric(baseHarmony, personalityHarmony);
```

---

## VISUAL DISPLAY SYSTEMS

### CoreMetricsHUD.js

**Metrics Displayed:**
- synergy, harmony, instability, corruption, networkLoad (all 0–100)

**Integration Status:**
- ⚠️ Reads from CoreMetricsCalculator (which needs update)
- ⚠️ Doesn't display NodeQualityCalculator stats
- ✅ Visual display only (no game logic)
- ⚠️ Incomplete (missing individual node quality)

**Risk Assessment:**

| Factor | Score | Notes |
|--------|-------|-------|
| Metric Age | 7/10 | Reads from legacy calculator |
| Integration Gaps | 6/10 | Missing new metrics display |
| Dependency Count | 2/10 | Depends on CoreMetricsCalculator |
| Conflict Severity | 3/10 | Display is correct for current metrics |
| **TOTAL RISK** | **4.5/10** | **MEDIUM** |

**Action Items:**
- [ ] Add NodeQualityCalculator stats display
- [ ] Show average node quality score
- [ ] Show distribution (Prime/Stable/Weak/Critical counts)
- [ ] Optional: show quality trend

**Refactor Priority:** Week 3

---

### MetricReactiveWorldEvents.js

**Metrics Used:**
- Input: synergy, harmony, instability, corruption, load from CoreMetricsCalculator
- Output: Environmental visual effects (distortions, pulses, waves)

**Integration Status:**
- ❌ Uses CoreMetricsCalculator (which will be refactored)
- ⚠️ Trigger thresholds based on old metric distributions
- ✅ Visual-only effects (no game impact)
- ⚠️ May need threshold adjustment for new metrics

**Risk Assessment:**

| Factor | Score | Notes |
|--------|-------|-------|
| Metric Age | 7/10 | Reads from legacy calculator |
| Integration Gaps | 5/10 | Depends on calculator refactor |
| Dependency Count | 3/10 | Reads 5 metrics from CoreMetricsCalc |
| Conflict Severity | 3/10 | Thresholds may need adjustment |
| **TOTAL RISK** | **4.5/10** | **MEDIUM** |

**Action Items:**
- [ ] Wait for CoreMetricsCalculator refactor
- [ ] Verify trigger thresholds still work with aggregated metrics
- [ ] Test visual effect timing and intensity
- [ ] Adjust thresholds if needed (new metrics might be more stable)

**Refactor Priority:** Week 3 (after CoreMetricsCalculator)

---

### CoreMetricsOverlay.js

**Metrics Used:**
- Input: CoreMetricsCalculator, TemporalUnitSystem
- Output: HUD overlay + visual temporal effects

**Integration Status:**
- ⚠️ Reads from CoreMetricsCalculator (legacy)
- ✅ Temporal effects independent
- ✅ Display-only system
- ⚠️ Will update when CoreMetricsCalculator refactored

**Risk Assessment:**

| Factor | Score | Notes |
|--------|-------|-------|
| Metric Age | 6/10 | Legacy metric reading |
| Integration Gaps | 3/10 | Minimal integration needed |
| Dependency Count | 2/10 | Depends on CoreMetricsCalc |
| Conflict Severity | 2/10 | Display-only, no conflicts |
| **TOTAL RISK** | **3.25/10** | **LOW-MEDIUM** |

**Action:** Will update automatically with CoreMetricsCalculator refactor

---

## LINK AUTOMATION SYSTEMS

### LinkAutomationEngine1_0.js

**Metrics Used:**
- Input: link priority, ComputeSynergyScore2_0 output
- Output: Auto-create/remove link decisions

**Integration Status:**
- ⚠️ Uses ComputeSynergyScore2_0 (legacy)
- ⚠️ Partial integration with new LinkQuality
- ❌ Needs migration to LinkQualityCalculator
- ⚠️ Game logic impact (links created/destroyed)

**Risk Assessment:**

| Factor | Score | Notes |
|--------|-------|-------|
| Metric Age | 7/10 | Uses legacy synergy scoring |
| Integration Gaps | 7/10 | Partial integration with new metrics |
| Dependency Count | 4/10 | Depends on link priority + synergy |
| Conflict Severity | 6/10 | Wrong metric source → wrong link decisions |
| **TOTAL RISK** | **6.0/10** | **HIGH** |

**Action Items:**
- [ ] Replace ComputeSynergyScore2_0 calls with LinkQualityCalculator
- [ ] Adjust thresholds for new 0–100 scale
- [ ] Test link creation/removal behavior
- [ ] Monitor network stability after refactor

**Refactor Priority:** Week 2

**Migration Plan:**
```javascript
// OLD: Uses legacy synergy scoring
const synergyData = computeSynergyScore(link, systems);
if (synergyData.score > 0.7) {
  // Create/maintain link
}

// NEW: Use LinkQualityCalculator
const linkQuality = link.userData?.quality?.score ?? 50;
if (linkQuality > 70) {  // Same threshold, new scale
  // Create/maintain link
}
```

---

## TEMPORAL SYSTEMS

### TemporalUnitSystem.js ✅

**Metrics Produced:**
- Cycle/Epoch/Aeon indices, event flags

**Status:** Metric-independent, no conflicts
**Risk:** 0/10 LOW ✅

---

### TemporalEventEffects.js ✅

**Metrics Used:**
- Input: Temporal transitions (metric-independent)
- Status:** Metric-independent, no conflicts
**Risk:** 0/10 LOW ✅

---

## MISCELLANEOUS SYSTEMS

### EnergyOrb.js ✅

**Status:** Standalone collectible, no metric conflicts
**Risk:** 1/10 LOW ✅

---

### EnhancedNodeModels.js

**Status:** Visual enhancement, likely compatible
**Risk:** 2/10 LOW

---

## SUMMARY RISK TABLE

| System | Risk Score | Category | Priority | Owner |
|--------|-----------|----------|----------|-------|
| ComputeSynergyScore2_0 | 8.4 | CRITICAL | Week 1 | Lucy |
| LinkGlowSynergyEngine | 8.0 | CRITICAL | Week 1 | Lucy |
| CoreMetricsCalculator | 7.75 | HIGH | Week 2 | Lucy |
| SynergyVFX1_0 | 6.0 | HIGH | Week 2 | Lucy |
| LinkAutomationEngine | 6.0 | HIGH | Week 2 | Lucy |
| SynergyHighways | 5.5 | HIGH | Week 2 | Lucy |
| NodePersonality2_0 | 4.75 | MEDIUM | Week 3 | Lucy |
| CoreMetricsHUD | 4.5 | MEDIUM | Week 3 | Lucy |
| MetricReactiveWorldEvents | 4.5 | MEDIUM | Week 3 | Lucy |
| CoreMetricsOverlay | 3.25 | MEDIUM | Week 3 | Lucy |
| **Phase 3 New Systems** | **0–0.75** | **LOW** | Ready | ✅ |
| TemporalSystems | 0–1 | LOW | None | ✅ |
| EnergyOrb | 1 | LOW | None | ✅ |

---

## CRITICAL PATH REFACTOR TIMELINE

### **Week 1 (CRITICAL)**
- [ ] ComputeSynergyScore2_0 → LinkQualityCalculator wrapper
- [ ] LinkGlowSynergyEngine → use LinkQualityCalculator
- [ ] Update all consumers of these systems
- [ ] Test link glow visuals with new metrics

### **Week 2 (HIGH)**
- [ ] CoreMetricsCalculator → read from NodeDynamics
- [ ] SynergyVFX1_0 → LinkQualityCalculator input
- [ ] LinkAutomationEngine → LinkQualityCalculator decision logic
- [ ] SynergyHighways → new quality thresholds

### **Week 3 (MEDIUM)**
- [ ] CoreMetricsHUD → add NodeQuality display
- [ ] MetricReactiveWorldEvents → verify with new sources
- [ ] CoreMetricsOverlay → update data sources
- [ ] NodePersonality2_0 → design integration with NodeDynamics

---

## SIGN-OFF

**Audit Complete:** ✅ READ-ONLY ANALYSIS  
**Refactor Ready:** ✅ CRITICAL PATH IDENTIFIED  
**High Risk Modules:** 6 identified, clear migration paths  
**Low Risk Modules:** 3 ready for production  
**Estimated Effort:** 3–4 weeks full refactor + testing

**Next Phase:** Phase 3b VFX Metrics Refactor (planning)

---

**End of Risk Matrix**
