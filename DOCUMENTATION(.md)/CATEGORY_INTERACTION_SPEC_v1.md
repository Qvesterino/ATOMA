# 📘 ATOMA — CATEGORY INTERACTION SPEC v1

**Status:** ✅ APPROVED & LOCKED  
**Scope:** Core gameplay dynamics  
**Applies to:** All non-extreme nodes  
**Tier:** TIER 4 → TIER 5 boundary (validated baseline)  
**Locked Date:** Session [CURRENT]  
**Source of Truth:** THIS DOCUMENT  

---

## 1️⃣ PURPOSE

Define how node categories influence the behavior and interaction of core network metrics:

- **Corruption** - Information decay and cascade
- **Harmony** - Healing and stabilization
- **Synergy** - Defensive strength and coherence
- **Instability / Network Stress** - System pressure
- **Load Pressure** - Connection capacity constraints

**Guarantees:**
- ✅ Systemic clarity through predictable rules
- ✅ Emergent behavior remains controllable
- ✅ Stable long-term balancing
- ✅ No new mechanics — only rate modulation and interaction weighting

---

## 2️⃣ CORE PRINCIPLES (NON-NEGOTIABLE)

### P1 — Categories define TEMPO, not OUTCOMES

Categories affect **how fast** things happen, never **whether** they happen.

- Input nodes accelerate corruption (faster spread)
- Integration nodes accelerate harmony (faster healing)
- Storage nodes decelerate everything (inert stability)
- No category enables/disables any system entirely

**Implementation:** Multipliers applied to `deltaTime` calculations, never thresholds

### P2 — No BINARY INTERACTIONS

All interactions are **smooth and proportional**, never on/off.

- Harmony never fully nullifies corruption
  - Even at harmony = 1.0, corruption still flows at ~55% rate
- Corruption never fully blocks harmony
  - Even at corruption = 1.0, harmony continues (damped)
- Stress amplifies tendencies, does not flip states
  - High stress increases corruption pressure but doesn't guarantee cascade

**Implementation:** All multipliers range 0.4–1.5 (never 0.0 or 2.0+)

### P3 — LOAD IS THE ULTIMATE LIMITER

Regardless of category, node performance degrades under load.

- High load weakens harmony spread (50-60% reduction)
- High load amplifies corruption (40-50% acceleration)
- High load degrades synergy (35% reduction)
- **No category bypasses load pressure**

**Implementation:** Load multipliers applied universally, final multiplication

### P4 — EXTREME NODES ARE OUT OF SCOPE (v1)

Extreme nodes are visual and narrative modifiers only in v1.

- **Gameplay multipliers:** Reserved for v2+
- **Scope limit:** Category system only applies to input, process, integration, analytics, storage, control

---

## 3️⃣ CATEGORY DEFINITIONS (SYSTEM ROLE)

| Category | Systemic Role | Primary Function | Risk Profile |
|----------|---------------|------------------|--------------|
| **input** | Source of volatility, ingestion, entropy | Data entry, ingestion, external coupling | High volatility, entropy driver |
| **process** | Neutral transformer, baseline behavior | Computation, transformation, neutral relay | Balanced, predictable |
| **integration** | Cohesion engine, harmony hub | Synthesis, bridging, consensus building | Low corruption, high healing |
| **analytics** | Stability & observability anchor | Monitoring, measurement, clarity | Resistant to corruption, stabilizing |
| **storage** | Inert stabilizer, long-term persistence | State persistence, archive, foundation | Slow change, strong resistance |
| **control** | Regulator, flow dampener | Flow regulation, traffic control, gating | Corruption suppression, harmony moderation |

---

## 4️⃣ PROPAGATION RATE MULTIPLIERS (BASELINE)

### Corruption Propagation (by SOURCE category)

Controls how fast corruption spreads **from** a node.

| Category | Multiplier | Interpretation |
|----------|-----------|-----------------|
| **input** | 1.30 | Corruption spreads 30% faster |
| **process** | 1.00 | Baseline spread rate |
| **integration** | 0.80 | Corruption resisted, spreads 20% slower |
| **analytics** | 0.75 | Strong resistance, spreads 25% slower |
| **storage** | 0.60 | Very resistant, spreads 40% slower |
| **control** | 0.70 | Good resistance, spreads 30% slower |

**Formula Application:**
```javascript
const corruptionMultiplier = CORRUPTION_PROPAGATION_RATES[sourceCategory];
const adjustedSpreadRate = baseSpreadRate * corruptionMultiplier;
```

### Harmony Propagation (by SOURCE category)

Controls how fast harmony spreads **from** a node.

| Category | Multiplier | Interpretation |
|----------|-----------|-----------------|
| **input** | 0.80 | Harmony spreads 20% slower (disruption) |
| **process** | 1.00 | Baseline healing rate |
| **integration** | 1.35 | Harmony spreads 35% faster (hub effect) |
| **analytics** | 1.05 | Slight acceleration, spreads 5% faster |
| **storage** | 0.70 | Very slow, spreads 30% slower |
| **control** | 1.15 | Good spread, accelerated 15% |

**Formula Application:**
```javascript
const harmonyMultiplier = HARMONY_PROPAGATION_RATES[sourceCategory];
const adjustedHealingRate = baseHealingRate * harmonyMultiplier;
```

### Synergy Propagation (by SOURCE category)

Controls how fast synergy spreads **from** a node.

| Category | Multiplier | Interpretation |
|----------|-----------|-----------------|
| **input** | 1.10 | Synergy spreads 10% faster |
| **process** | 1.00 | Baseline synergy rate |
| **integration** | 1.20 | Strong coherence, spreads 20% faster |
| **analytics** | 0.95 | Slight damping, spreads 5% slower |
| **storage** | 0.80 | Weak spread, 20% slower |
| **control** | 1.05 | Moderate spread, 5% faster |

**Formula Application:**
```javascript
const synergyMultiplier = SYNERGY_PROPAGATION_RATES[sourceCategory];
const adjustedSynergyRate = baseSynergyRate * synergyMultiplier;
```

---

## 5️⃣ INTERACTION RULES (CROSS-METRIC)

### 5.1 Harmony → Corruption SUPPRESSION

Harmony reduces the **rate** of corruption growth, never erases it instantly.

**Formula:**
```javascript
corruptionRate *= (1 - harmony × 0.45)
```

**Interpretation:**
- Harmony = 0.0 → Corruption rate unchanged (100%)
- Harmony = 0.5 → Corruption rate reduced to 77.5%
- Harmony = 1.0 → Corruption rate reduced to 55%
- **Never fully blocked** — ensures tension even in healed zones

**Guarantee:** Even perfect harmony cannot stop corruption entirely

### 5.2 Corruption → Synergy DEGRADATION

Corruption reduces **effective** synergy, preventing runaway positive feedback.

**Formula:**
```javascript
effectiveSynergy = synergy × (1 - corruption × 0.60)
```

**Interpretation:**
- Corruption = 0.0 → Synergy fully effective (100%)
- Corruption = 0.5 → Synergy reduced to 70%
- Corruption = 1.0 → Synergy reduced to 40%
- **High synergy is fragile** in corrupted networks

**Guarantee:** Corruption weakens defensive capability proportionally

### 5.3 Instability / Stress → SYSTEM AMPLIFICATION

Network stress (instability) suppresses healing and accelerates decay.

**Formula:**
```javascript
harmonyRate     *= (1 - instability × 0.50)
corruptionRate  *= (1 + instability × 0.40)
```

**Interpretation (instability = 0.5):**
- Harmony rate reduced to 75% (slower healing)
- Corruption rate increased to 120% (faster decay)
- **Stress creates systemic pressure** that favors entropy

**Guarantee:** High instability makes systems harder to stabilize

---

## 6️⃣ LOAD PRESSURE RULES (GLOBAL CONSTRAINT)

Load pressure is the **universal limiter** that applies to all categories equally.

### Load Ratio Calculation
```javascript
loadRatio = currentLinks / maxLinks
```

### Load Effects on Rates
```javascript
harmonyRate   *= clamp(1 - loadRatio × 0.60, 0.4, 1.0)
corruptionRate *= (1 + loadRatio × 0.50)
synergyRate   *= clamp(1 - loadRatio × 0.35, 0.5, 1.0)
```

### Load Pressure Tables

| Load Ratio | Harmony Multiplier | Corruption Multiplier | Synergy Multiplier |
|------------|-------------------|----------------------|-------------------|
| 0.0 (light) | 1.00 | 1.00 | 1.00 |
| 0.25 | 0.85 | 1.13 | 0.91 |
| 0.50 | 0.70 | 1.25 | 0.82 |
| 0.75 | 0.55 | 1.38 | 0.74 |
| 1.00 (full) | 0.40 | 1.50 | 0.65 |

### Interpretation
- **Light load:** System can self-heal, harmony dominates
- **Heavy load:** Entropy dominates, harmony struggles
- **Full capacity:** Harmony nearly impossible, corruption accelerates
- **No category bypasses** load pressure; it's universally applied

**Guarantee:** Load is the ultimate system constraint

---

## 7️⃣ EMERGENT BEHAVIOR (EXPECTED)

### Input-Heavy Clusters
- **Corruption:** Spreads fast (1.3× baseline)
- **Harmony:** Spreads slow (0.8× baseline)
- **Synergy:** Spreads fast (1.1× baseline)
- **Result:** High volatility, entropy-dominated
- **Challenge:** Managing corruption aggressively early
- **Advantage:** Fast defensive response possible

### Integration Hubs
- **Corruption:** Spreads slow (0.8× baseline)
- **Harmony:** Spreads very fast (1.35× baseline)
- **Synergy:** Spreads fast (1.2× baseline)
- **Result:** Strong healing capability, oasis zone formation
- **Challenge:** None; nodes are natural stabilizers
- **Advantage:** Efficient corruption containment

### Storage-Heavy Cores
- **Corruption:** Spreads very slow (0.6× baseline)
- **Harmony:** Spreads slow (0.7× baseline)
- **Synergy:** Spreads slow (0.8× baseline)
- **Result:** Everything moves slowly, very stable but inert
- **Challenge:** Hard to heal (slow), hard to corrupt (slow)
- **Advantage:** Long-term persistence and reliability

### Control-Dense Networks
- **Corruption:** Spreads slower (0.7× baseline)
- **Harmony:** Spreads moderately fast (1.15× baseline)
- **Synergy:** Spreads moderately fast (1.05× baseline)
- **Result:** Stabilized flow, dampened extremes
- **Challenge:** Balancing regulation vs. responsiveness
- **Advantage:** Predictable, tunable behavior

### Analytics-Centric Networks
- **Corruption:** Spreads slower (0.75× baseline)
- **Harmony:** Spreads moderately fast (1.05× baseline)
- **Synergy:** Spreads slower (0.95× baseline)
- **Result:** Resistant to corruption, stabilizing influence
- **Challenge:** Cannot lead healing (slower than integration)
- **Advantage:** Observability prevents cascades

---

## 8️⃣ DESIGN GUARANTEES

### G1 — No Hidden Modifiers
All multipliers are explicit and documented in this spec.
No undocumented category bonuses or penalties exist.

### G2 — No Category Overrides Thresholds
Cascade thresholds (0.45, 0.65, 0.85 corruption) are **category-independent**.
Categories only affect **rate of approach** to thresholds, not the thresholds themselves.

### G3 — No Per-Archetype Exceptions (v1)
Archetype system operates **above** category system.
Category rules apply uniformly; archetype adds narrative/visual layer only.

### G4 — All Interactions Are Continuous and Smooth
No binary on/off behaviors.
All formulas use multipliers in range [0.4, 1.5].
Smooth interpolation between states guaranteed.

### G5 — Load Pressure Is Universal
No category can reduce, bypass, or reverse load pressure effects.
Load multipliers apply **after** category multipliers in calculation order.

---

## 9️⃣ IMPLEMENTATION REFERENCE

### Files Implementing This Spec

| Component | File | Lines | Status |
|-----------|------|-------|--------|
| **Category multipliers** | `/NodeDynamicMetrics.js` | 77–121 | ✅ Implemented |
| **Propagation rates** | `/LinkCorruptionTransmission_v1.js` | 305–526 | ✅ Implemented |
| **Load pressure** | `/NodeDynamicMetrics.js` | 150–158 | ✅ Implemented |
| **Interaction rules** | `/LinkCorruptionTransmission_v1.js` | 1820–1915 | ✅ Implemented |
| **Test validation** | `/T4004_HARMONY_HEALING_TEST_RUNNER.js` | 1–450 | ✅ Implemented |

### Verification Checklist

✅ Category multiplier tables defined  
✅ Propagation rate methods implemented  
✅ Load pressure calculations active  
✅ Harmony→Corruption suppression applied  
✅ Corruption→Synergy degradation applied  
✅ Instability amplification active  
✅ T4-004 harmony healing test validates behavior  

---

## 🔟 VERSIONING

### v1.0 (CURRENT — LOCKED)
✅ **Complete:**
- Category-aware propagation multipliers
- Harmony ↔ Corruption ↔ Synergy ↔ Stress ↔ Load fully defined
- Interaction rules all specified
- Load pressure as universal constraint
- Validated by T4-004 runtime testing

✅ **Scope:**
- Input, process, integration, analytics, storage, control categories
- Non-extreme nodes only
- Core gameplay metrics

### v2.0 (FUTURE — NOT v1)
🔒 **Out of scope (reserved):**
- Extreme node gameplay effects (visual/narrative only in v1)
- Emotional category multipliers
- Quantum category multipliers
- Long-term fatigue/entropy systems
- Per-archetype interaction modifiers
- Seasonal or cyclical dynamics

---

## 🔒 FINAL STATUS

### ✅ CATEGORY INTERACTION SPEC v1 — LOCKED

This document is the **single source of truth** for:

- **Balancing decisions** — All adjustments reference this spec
- **Debugging decisions** — All behavior can be verified against formulas
- **Future expansion decisions** — v2+ features require amendment to this spec

### Amendment Process

To modify this spec:
1. File issue with business justification
2. Propose specific formula changes
3. Test impact on all 6 categories
4. Update all implementation files
5. Re-run T4-004 validation
6. Document rationale

### Locking Ceremony

**Locked by:** Category Interaction Specification Working Group  
**Locked on:** [CURRENT SESSION]  
**Authority:** Tier 4→5 validation boundary  
**Supersedes:** All prior category/balancing documents  
**Superseded by:** Only official amendments with full process

---

## 📋 QUICK REFERENCE

### Category Propagation Multipliers (At-a-Glance)

```
CORRUPTION:  input(1.3) > process(1.0) > control(0.7) > integration(0.8) > analytics(0.75) > storage(0.6)
HARMONY:     integration(1.35) > control(1.15) > analytics(1.05) > process(1.0) > input(0.8) > storage(0.7)
SYNERGY:     integration(1.2) > input(1.1) > control(1.05) > process(1.0) > analytics(0.95) > storage(0.8)
```

### Key Formulas

```
Corruption suppressed by harmony:   corruptionRate *= (1 - harmony × 0.45)
Synergy degraded by corruption:     synergy *= (1 - corruption × 0.60)
Stress amplifies pressure:          corruptionRate *= (1 + instability × 0.40)
Load weakens healing:               harmonyRate *= clamp(1 - loadRatio × 0.60, 0.4, 1.0)
```

### Success Criteria (T4-004 Validation)

| Metric | Expected | Status |
|--------|----------|--------|
| Harmony spreads | Peak > 0.2 | ✅ |
| Corruption reduces | >10% total | ✅ |
| Oasis zones form | ≥1 zone | ✅ |
| Stress resilience | <20% drop | ✅ |
| No binary behavior | Proportional | ✅ |

---

**END OF SPECIFICATION**

*This document is permanently locked. All future development references this version. Amendments require formal process.*
