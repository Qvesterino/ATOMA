# ATOMA Metrics Rebalance — Final Analysis & Recommendations
**Date**: 2026-04-20
**Scope**: NodeMetricEngine + MetricTierClassifier + MetricsRuntime_v1 + NodeVisualRegistry
**Severity**: HIGH — core gameplay balance issue

---

## 0. What's Already Fixed ✅

### Synergy Derivation (Proposal A2 — APPLIED)
[`deriveSynergyTarget()`](src/metrics/NodeMetricEngine.js:393) now uses:
```
target = archetypeBase × 0.60 + derived × 0.40
```
This prevents synergy from collapsing to near-zero. Verified in code at line 414.

### Registry Seeds (REBALANCED)
[`NodeVisualRegistry.js`](NodeVisualRegistry.js:1) has unique fingerprints per category with hard cap 0.820.

---

## 1. REMAINING CRITICAL ISSUES

### Issue 1: Tier Thresholds Don't Match Metric Distributions

**Current state**: [`DEFAULT_METRIC_THRESHOLDS`](src/metrics/MetricTierClassifier.js:1) uses uniform `low=0.25, high=0.75` for ALL metrics.

**Actual steady-state metric ranges** (calculated with A2 synergy fix):

| Metric | Min (Error) | Typical Low | Typical Mid | Typical High | Max (Prime/Control) |
|--------|-------------|-------------|-------------|--------------|---------------------|
| synergy | 0.04 | 0.26 (Storage) | 0.35-0.43 | 0.51 (Integration) | — |
| harmony | 0.05 | 0.19 (Quantum) | 0.40-0.55 | 0.68 (Control) | 0.74 |
| stability | 0.14 | 0.32 (Analytics) | 0.42-0.58 | 0.73 (Control) | 0.82 |
| corruption | 0.01 | 0.03 (Prime) | 0.04-0.10 | 0.28 (Quantum) | 0.81 |
| loadPressure | 0.22 | 0.22 (Input) | 0.35-0.50 | 0.55 (Integration) | 0.66 |

**Problem**: With `high=0.75`:
- **Corruption**: Only Error nodes (0.72-0.81) ever reach "high" → corruption tier events are SILENT for 95% of nodes
- **LoadPressure**: Max is 0.66 → "high" tier is UNREACHABLE for ALL nodes
- **Synergy**: After A2 fix, max steady-state is ~0.51 → "high" tier UNREACHABLE
- **Harmony**: Only extreme Control/Prime reach 0.74 → barely touches "high"
- **Stability**: Only category that naturally spans all tiers ✅

**Impact**: Tier event system is effectively dead for 4 out of 5 metrics.

### Issue 2: Gameplay Triggers Are Unreachable

[`_emitGameplayTriggers()`](MetricsRuntime_v1.js:1489) thresholds vs actual network averages:

| Trigger | Threshold | Network Avg | Reachable? |
|---------|-----------|-------------|------------|
| `event:synergyCascade` | networkSynergy ≥ 0.82 | ~0.35 | ❌ NEVER |
| `event:harmonyResonance` | harmonyFlow ≥ 0.85 | ~0.48 | ❌ NEVER |
| `event:corruptionOutbreak` | corruptionLevel ≥ 0.60 | ~0.08 | ❌ NEVER (without Error nodes) |
| `event:loadCollapse` | load ≥ 0.80 AND stress ≥ 0.60 | ~0.40 / ~0.40 | ❌ NEVER |
| `event:instabilityTrap` | stress ≥ 0.75 | ~0.40 | ❌ NEVER |

**Impact**: All world events (SIGMA_INVASION, etc.) are dead systems.

### Issue 3: Quantum Runaway Corruption

For Quantum nodes (harmony ~0.20, stability ~0.17, corruption ~0.29, load ~0.55):

```
vulnerability = (1 - 0.17) × (0.5 + 0.55 × 0.7) = 0.74
corruptionVulnerabilityGain × vulnerability = 0.035 × 0.74 = 0.026/tick
corruptionHarmonySuppression × harmony × coherence = 0.045 × 0.20 × 0.10 = 0.001/tick
Net: +0.025/tick → after inertia: +0.004/tick → +0.04/sec
```

Quantum nodes reach max corruption in ~15-20 seconds with no external intervention. This may be intentional "glass cannon" design, but the rate is too aggressive — players can't react.

### Issue 4: Synergy Resonance/Burst Never Trigger

- `SYNERGY_RESONANCE.threshold = 0.75` → requires both linked nodes at synergy > 0.75 → UNREACHABLE
- `SYNERGY_BURST.threshold = 0.85` → UNREACHABLE
- `NODE_SEMANTIC_EVENT_THRESHOLDS.synergyBurst = 0.85` → UNREACHABLE

These are dead mechanics.

---

## 2. CONCRETE RECOMMENDATIONS

### R1: Differentiate Tier Thresholds Per Metric (P0 — CRITICAL)

**File**: [`src/metrics/MetricTierClassifier.js`](src/metrics/MetricTierClassifier.js:1)

**Current**:
```javascript
// ALL metrics: low=0.25, high=0.75
```

**Recommended**:
```javascript
const DEFAULT_METRIC_THRESHOLDS = Object.freeze({
  synergy:      Object.freeze({ low: 0.15, high: 0.45, lowExit: 0.22, highExit: 0.38 }),
  harmony:      Object.freeze({ low: 0.20, high: 0.60, lowExit: 0.27, highExit: 0.53 }),
  stability:    Object.freeze({ low: 0.25, high: 0.70, lowExit: 0.32, highExit: 0.63 }),
  corruption:   Object.freeze({ low: 0.08, high: 0.35, lowExit: 0.15, highExit: 0.28 }),
  loadPressure: Object.freeze({ low: 0.25, high: 0.55, lowExit: 0.32, highExit: 0.48 })
});
```

**Rationale per metric**:

| Metric | low | high | Why |
|--------|-----|------|-----|
| synergy | 0.15 | 0.45 | Steady-state range 0.04-0.51. "low" catches Error, "high" catches Integration/Process top |
| harmony | 0.20 | 0.60 | Range 0.05-0.74. "low" catches Error/Quantum, "high" catches Control/Prime/Mythic |
| stability | 0.25 | 0.70 | Range 0.14-0.82. Only metric that naturally spans wide. Slightly lower high |
| corruption | 0.08 | 0.35 | Range 0.01-0.81. "low" at 0.08 means normal nodes trigger when corruption rises slightly. "high" at 0.35 catches Quantum/spreading corruption |
| loadPressure | 0.25 | 0.55 | Range 0.22-0.66. "high" at 0.55 catches heavy-load nodes (Process, Integration, Quantum) |

**Expected tier distribution after fix**:

| Metric | % nodes "low" | % nodes "mid" | % nodes "high" |
|--------|---------------|----------------|-----------------|
| synergy | ~10% (Error) | ~70% | ~20% (Integration, high Process) |
| harmony | ~15% (Error, Quantum) | ~50% | ~35% (Control, Prime, Mythic) |
| stability | ~15% (Quantum, Error) | ~40% | ~45% (Storage, Control, Prime) |
| corruption | ~30% (clean nodes) | ~55% | ~15% (Quantum, Error, corrupted) |
| loadPressure | ~15% (Input, Storage) | ~55% | ~30% (Process, Integration, Quantum) |

This creates MEANINGFUL tier transitions for ALL metrics.

### R2: Lower Gameplay Trigger Thresholds (P0 — CRITICAL)

**File**: [`MetricsRuntime_v1.js`](MetricsRuntime_v1.js:1489)

**Current → Recommended**:
```javascript
// synergyCascade: 0.82 → 0.45
if (current.networkSynergy >= 0.45 && (last.networkSynergy ?? 0) < 0.45) {

// harmonyResonance: 0.85 → 0.55
if (current.harmonyFlow >= 0.55 && (last.harmonyFlow ?? 0) < 0.55) {

// corruptionOutbreak: 0.60 → 0.25
if (current.corruptionLevel >= 0.25 && (last.corruptionLevel ?? 0) < 0.25) {

// loadCollapse: 0.80/0.60 → 0.55/0.40
const loadCollapseNow = current.loadPressure >= 0.55 && current.networkStress >= 0.40;

// instabilityTrap: 0.75 → 0.50
if (current.networkStress >= 0.50 && (last.networkStress ?? 0) < 0.50) {
```

**Why these numbers**:
- Network synergy avg ~0.35. Threshold at 0.45 means: fires when network is well-connected with high-synergy archetypes (Integration, Process)
- Harmony avg ~0.48. Threshold at 0.55: fires when network harmony is above average
- Corruption avg ~0.08. Threshold at 0.25: fires when corruption spreads to significant portion of network (Error nodes, Quantum corruption spreading)
- Load/Stress at 0.55/0.40: fires under heavy load conditions

### R3: Lower Synergy Resonance & Burst Thresholds (P1)

**File**: [`src/metrics/NodeMetricEngine.js`](src/metrics/NodeMetricEngine.js:64)

**Current → Recommended**:
```javascript
const SYNERGY_RESONANCE = {
  threshold: 0.50,           // was 0.75
  harmonyGain: 0.003,        // was 0.002 (slightly stronger)
  stabilityGain: 0.0015,     // was 0.001
  maxHarmonyPerTick: 0.012,  // was 0.01
  maxStabilityPerTick: 0.006 // was 0.005
};

const SYNERGY_BURST = {
  threshold: 0.60,           // was 0.85
  cooldownTicks: 80,         // was 120 (8 sec instead of 12)
  selfHarmonyBoost: 0.025,   // was 0.02
  selfStabilityBoost: 0.012, // was 0.01
  neighborHarmonyBoost: 0.012 // was 0.01
};

const NODE_SEMANTIC_EVENT_THRESHOLDS = {
  synergyBurst: 0.60,        // was 0.85
  corruptionSpike: 0.50      // was 0.65 (lowered to match new corruption range)
};
```

**Why**: With synergy steady-state at 0.26-0.51, resonance at 0.50 triggers for well-connected Integration/Process nodes. Burst at 0.60 triggers for top-synergy clusters only.

### R4: Tune Cross-Metric Interaction Rates (P2)

**File**: [`src/metrics/NodeMetricEngine.js`](src/metrics/NodeMetricEngine.js:48)

**Current → Recommended**:
```javascript
const INTERACTION = {
  harmonyCoherenceGain: 0.025,           // unchanged
  harmonyCorruptionLoss: 0.055,          // was 0.060 (slightly reduced — harmony less punished)
  corruptionVulnerabilityGain: 0.022,    // was 0.035 ← KEY: reduces Quantum runaway
  corruptionHarmonySuppression: 0.055,   // was 0.045 (increased — harmony fights corruption harder)
  corruptionLoadGain: 0.015,             // was 0.020 (reduced — load less corruption)
  stabilityHarmonyGain: 0.020,           // was 0.015 (increased — harmony stabilizes more)
  stabilityCorruptionLoss: 0.035,        // was 0.040 (reduced — corruption less destabilizing)
  stabilityLoadLoss: 0.015               // was 0.020 (reduced — load less destabilizing)
};
```

**Key change**: `corruptionVulnerabilityGain` from 0.035 → 0.022.

**Quantum node recalculation** with new rates:
```
vulnerability gain: 0.022 × 0.74 = 0.016/tick
harmony suppression: 0.055 × 0.20 × 0.10 = 0.001/tick
load gain: 0.015 × 0.55 = 0.008/tick
natural decay: 0.29 × 0.04 = 0.012/tick

Net: -0.012 + 0.016 - 0.001 + 0.008 = +0.011/tick
After inertia: +0.011 × 0.15 = +0.0017/tick = +0.017/sec
```

From 0.29, reaching 0.80 now takes ~(0.51/0.017) ≈ 30 seconds (was ~15). Players have twice as long to react. Still corrupts, but gives gameplay window.

### R5: Semantic Event Threshold Adjustments (P2)

**File**: [`src/metrics/NodeMetricEngine.js`](src/metrics/NodeMetricEngine.js:145)

**Current → Recommended**:
```javascript
// In emitSemanticMetricEvent():
case 'harmony':
  if (before < 0.65 && after >= 0.65) eventName = 'metric:harmonyPeak'; // was 0.85
  break;
case 'loadPressure':
  if (before < 0.55 && after >= 0.55) eventName = 'metric:loadPressureHigh'; // was 0.75
  break;
```

### R6: Corruption Link Propagation (P3 — Optional)

**File**: [`src/metrics/NodeMetricEngine.js`](src/metrics/NodeMetricEngine.js:59)

```javascript
const LINK_EQUALIZE = {
  harmony: 0.02,
  stability: 0.015,
  corruption: 0.006  // NEW: slow corruption bleed through links
};
```

This makes corruption "infectious" at a slow rate, creating network tension. When a corrupted node is linked to a clean node, corruption slowly bleeds through. This creates meaningful gameplay decisions about linking.

**Implementation**: Add corruption equalization in the link loop at [`updateNodeMetrics()`](src/metrics/NodeMetricEngine.js:822) similar to harmony/stability equalization.

---

## 3. PRIORITY ORDER

| Priority | Recommendation | Impact | Risk | Files |
|----------|---------------|--------|------|-------|
| **P0** | R1: Differentiate tier thresholds | Unlocks tier events for ALL metrics | LOW — config only | `MetricTierClassifier.js` |
| **P0** | R2: Lower gameplay triggers | Unlocks ALL world events | LOW — config only | `MetricsRuntime_v1.js` |
| **P1** | R3: Lower resonance/burst | Unlocks synergy mechanics | LOW — config only | `NodeMetricEngine.js` |
| **P2** | R4: Tune interaction rates | Prevents Quantum runaway | MEDIUM — changes dynamics | `NodeMetricEngine.js` |
| **P2** | R5: Semantic thresholds | Unlocks node-level events | LOW — config only | `NodeMetricEngine.js` |
| **P3** | R6: Corruption propagation | Adds network tension | MEDIUM — new mechanic | `NodeMetricEngine.js` |

---

## 4. STEADY-STATE VERIFICATION

After all changes, expected network behavior:

### Normal Network (mixed archetypes, some links)
- networkSynergy: ~0.35 (fires synergyCascade at 0.45 when well-connected)
- harmonyFlow: ~0.48 (fires harmonyResonance at 0.55 when harmonious)
- corruptionLevel: ~0.08 (fires corruptionOutbreak at 0.25 when spreading)
- loadPressure: ~0.40 (fires loadCollapse at 0.55/0.40 under stress)
- networkStress: ~0.40 (fires instabilityTrap at 0.50 when unstable)

### Well-Connected Network (many links, high-synergy archetypes)
- networkSynergy: ~0.45-0.50 → synergyCascade FIRES ✅
- harmonyFlow: ~0.55-0.60 → harmonyResonance FIRES ✅
- Tier events: synergy.high, harmony.high, stability.high for connected nodes ✅

### Corrupted Network (Error nodes, Quantum corruption spreading)
- corruptionLevel: ~0.25-0.35 → corruptionOutbreak FIRES ✅
- Tier events: corruption.high for affected nodes ✅
- Corruption bleeds through links (R6) → network tension ✅

### Quantum Node Behavior
- Corruption rises at ~0.017/sec (was 0.04/sec)
- Reaches critical corruption in ~30 sec (was ~15 sec)
- Players have time to react: link to stabilizers, use healing systems
- Still a "glass cannon" archetype, but not instant self-destruction

---

## 5. SEED VALUES ASSESSMENT

The current registry seeds are well-designed. No changes needed.

| Category | Fingerprint | Verdict |
|----------|-------------|---------|
| Input | harmony > stability > synergy | ✅ Unique, balanced |
| Process | synergy > harmony > stability | ✅ Volatile transformer |
| Integration | synergy >> harmony > stability | ✅ Connects well, fragile |
| Analytics | synergy > harmony > stability | ✅ Insightful, unstable |
| Storage | stability >> harmony > synergy | ✅ Rock-solid, isolated |
| Control | stability > harmony > synergy | ✅ Firm authority |
| Quantum | synergy high, harmony/stability LOW, corruption HIGH | ✅ Glass cannon |
| Sigma | stability > harmony > synergy | ✅ Balanced excellence |
| Mythic | harmony > synergy > stability | ✅ Meaningful, shifting |
| Prime | stability > harmony > synergy | ✅ Pure, transcendent |
| Error | corruption >> all | ✅ Dangerous failure |
| Emotional | synergy > harmony > stability | ✅ Empathetic, volatile |

---

## 6. RISK ASSESSMENT

- **R1, R2**: Config-only changes. Metrics themselves don't change, just when events fire. Easily reversible.
- **R3**: Config-only. Synergy mechanics become active. May need tuning after playtesting.
- **R4**: Changes dynamics behavior. Quantum nodes survive longer. May require iteration.
- **R5**: Config-only. More node-level events fire. Low risk.
- **R6**: New mechanic. Should be tested separately. Can be disabled by setting corruption equalize to 0.

No core philosophy violations. No architectural boundary crossings. All changes are within existing authorities (`NodeMetricEngine`, `MetricTierClassifier`, `MetricsRuntime_v1`).

---

## 7. RECOMMENDED IMPLEMENTATION ORDER

1. **Apply R1** (tier thresholds) — 1 file, config change
2. **Apply R2** (gameplay triggers) — 1 file, config change
3. **Apply R3** (resonance/burst thresholds) — 1 file, config change
4. **Apply R5** (semantic thresholds) — 1 file, config change
5. **Test** — observe tier events, gameplay triggers, synergy mechanics
6. **Apply R4** (interaction rates) — 1 file, tune dynamics
7. **Test again** — observe Quantum behavior, network stability
8. **Apply R6** (corruption propagation) — optional, test separately
9. **Update** `docs/METRIC_CALCULATIONS.md` to reflect new constants
