# ATOMA Metrics Rebalance Analysis
**Date**: 2026-04-20
**Scope**: NodeVisualRegistry seeds + NodeMetricEngine runtime logic
**Severity**: HIGH — core gameplay balance issue

---

## 1. CRITICAL FINDING: Synergy Derivation Crushes Registry Seeds

### The Problem

[`deriveSynergyTarget()`](src/metrics/NodeMetricEngine.js:393) uses the formula:

```
synergy = harmony² × stability × (1 - corruption × 0.85) × (1 - load × 0.65) + resonance
```

The `harmony²` term makes synergy collapse for any node with harmony < 0.7.

### Numerical Proof

| Archetype | Registry Synergy | Harmony² × Stability × ... | Derived Synergy | Drop |
|-----------|-----------------|----------------------------|-----------------|------|
| Input 101 | 0.383 | 0.213 × 0.424 × 0.969 × 0.858 | **~0.075** | **-80%** |
| Process 207 | 0.625 | 0.255 × 0.466 × 0.884 × 0.692 | **~0.073** | **-88%** |
| Integration 316 | 0.750 | 0.347 × 0.469 × 0.928 × 0.596 | **~0.090** | **-88%** |
| Control 601 | 0.393 | 0.341 × 0.675 × 0.985 × 0.793 | **~0.180** | **-54%** |
| Storage 501 | 0.285 | 0.175 × 0.624 × 0.981 × 0.858 | **~0.092** | **-68%** |
| Quantum 701 | 0.584 | 0.038 × 0.143 × 0.758 × 0.663 | **~0.003** | **-99.5%** |
| Error 1101 | 0.063 | 0.003 × 0.148 × 0.385 × 0.666 | **~0.000** | **-100%** |

**Result**: Within 10-15 ticks (1-1.5 seconds), ALL node synergies collapse to near-zero. The registry seeds become meaningless.

### Consequence Chain

1. Synergy collapses → `SYNERGY_RESONANCE` (threshold 0.75) **never triggers**
2. `SYNERGY_BURST` (threshold 0.85) **never triggers**
3. Network synergy average drops to ~0.05-0.10
4. `event:synergyCascade` (threshold 0.82) **never fires**
5. Synergy-related VFX and gameplay are **dead systems**

---

## 2. SECONDARY FINDINGS

### 2.1 Uniform Tier Thresholds Don't Match Metric Distributions

[`DEFAULT_METRIC_THRESHOLDS`](src/metrics/MetricTierClassifier.js:1) uses `low=0.25, high=0.75` for ALL metrics.

But actual metric distributions per archetype:
- **Corruption**: ranges 0.014–0.81 → most nodes sit at 0.02–0.15, **never reach "high" tier**
- **LoadPressure**: ranges 0.22–0.66 → most nodes sit in **permanent "mid" tier**
- **Stability**: ranges 0.14–0.82 → **only category that naturally spans all tiers**
- **Harmony**: ranges 0.05–0.74 → rarely hits "high" tier

**Result**: Tier events are dominated by stability transitions. Corruption/load tier events are nearly silent.

### 2.2 Gameplay Triggers Are Unreachable

[`_emitGameplayTriggers()`](MetricsRuntime_v1.js:1490) thresholds:

| Trigger | Threshold | Reachable? |
|---------|-----------|------------|
| `event:synergyCascade` | networkSynergy ≥ 0.82 | ❌ No (avg ~0.05) |
| `event:harmonyResonance` | harmonyFlow ≥ 0.85 | ❌ Only Prime/Control extreme |
| `event:corruptionOutbreak` | corruptionLevel ≥ 0.60 | ⚠️ Only Error nodes |
| `event:loadCollapse` | load ≥ 0.80 AND stress ≥ 0.60 | ❌ Nearly impossible |
| `event:instabilityTrap` | stress ≥ 0.75 | ⚠️ Rare |

### 2.3 Cross-Metric Feedback May Cause Runaway Corruption on Quantum Nodes

For Quantum nodes (low stability ~0.17, low harmony ~0.23, high load ~0.55):
- `vulnerability = (1 - 0.17) × (0.5 + 0.55 × 0.7) = 0.83 × 0.885 = 0.74`
- `corruptionVulnerabilityGain × vulnerability = 0.035 × 0.74 = 0.026/tick`
- `corruptionHarmonySuppression × harmony × coherence = 0.045 × 0.23 × (0.17 × 0.67) = 0.001/tick`
- Net corruption gain: **+0.025/tick → +0.25/second**

This means Quantum nodes gain corruption at 0.25/sec, reaching max corruption in ~3 seconds with no external intervention.

### 2.4 Link Equalization Gaps

[`LINK_EQUALIZE`](src/metrics/NodeMetricEngine.js:59) only equalizes `harmony` and `stability` through links. Corruption and loadPressure don't propagate through links. This means:
- A corrupted node doesn't "infect" neighbors through links
- Load pressure doesn't distribute across connected nodes
- Only positive metrics spread, negative ones stay isolated

This may be intentional design, but it makes the network feel less "alive".

---

## 3. REBALANCE PROPOSALS

### Proposal A: Fix Synergy Derivation (CRITICAL — must fix)

**Option A1: Replace harmony² with harmony (simplest)**

```javascript
// BEFORE
const harmonyField = harmony * harmony;

// AFTER
const harmonyField = harmony;
```

Impact on derived synergies:

| Archetype | Current Derived | With harmony¹ | Registry Seed |
|-----------|----------------|---------------|---------------|
| Input 101 | 0.075 | **0.163** | 0.383 |
| Process 207 | 0.073 | **0.157** | 0.625 |
| Integration 316 | 0.090 | **0.258** | 0.750 |
| Control 601 | 0.180 | **0.354** | 0.393 |
| Quantum 701 | 0.003 | **0.017** | 0.584 |

Better, but still doesn't match registry. Synergy is still much lower than seeds for most archetypes.

**Option A2: Add archetype base weight (recommended)**

```javascript
function deriveSynergyTarget(metrics, archetypeMetrics) {
  const harmony = clamp01(metrics.harmony ?? 0);
  const stability = clamp01(metrics.stability ?? 0);
  const corruption = clamp01(metrics.corruption ?? 0);
  const loadPressure = clamp01(metrics.loadPressure ?? 0);

  // Derived component (how well metrics support synergy right now)
  const harmonyField = harmony;
  const stabilityField = stability;
  const corruptionField = 1 - corruption * 0.85;
  const loadField = 1 - loadPressure * 0.65;

  const derived = harmonyField * stabilityField * corruptionField * loadField;

  // Resonance bonus (unchanged)
  const resonance =
    Math.max(0, harmony - 0.75) *
    Math.max(0, stability - 0.65) *
    0.35;

  // Blend: 60% archetype DNA + 40% runtime derived
  const archetypeBase = archetypeMetrics?.synergy ?? derived;
  const target = archetypeBase * 0.60 + clamp01(derived + resonance) * 0.40;

  return clamp01(target);
}
```

This preserves the archetype's inherent synergy potential while allowing runtime dynamics to modulate it.

**Option A3: Remove harmony² and reduce damping factors**

```javascript
const harmonyField = harmony;  // was harmony * harmony
const corruptionField = 1 - corruption * 0.50;  // was 0.85
const loadField = 1 - loadPressure * 0.40;  // was 0.65
```

This makes synergy less sensitive to corruption and load, keeping it higher overall.

### Proposal B: Differentiate Tier Thresholds Per Metric

```javascript
const DEFAULT_METRIC_THRESHOLDS = Object.freeze({
  synergy:      { low: 0.20, high: 0.60, lowExit: 0.27, highExit: 0.53 },
  harmony:      { low: 0.25, high: 0.70, lowExit: 0.32, highExit: 0.63 },
  stability:    { low: 0.25, high: 0.75, lowExit: 0.32, highExit: 0.68 },  // unchanged
  corruption:   { low: 0.15, high: 0.50, lowExit: 0.22, highExit: 0.43 },
  loadPressure: { low: 0.30, high: 0.65, lowExit: 0.37, highExit: 0.58 }
});
```

Rationale:
- **Corruption** lower thresholds: most nodes sit at 0.02-0.15, so "low" at 0.15 creates meaningful tier events
- **LoadPressure** adjusted: most nodes sit at 0.22-0.55, so "high" at 0.65 creates meaningful events
- **Synergy** lower thresholds: if derivation is fixed, synergy will sit at 0.15-0.40 range
- **Harmony** slightly lower high: most nodes sit at 0.35-0.70

### Proposal C: Lower Synergy Burst Threshold

```javascript
const SYNERGY_BURST = {
  threshold: 0.65,        // was 0.85
  cooldownTicks: 60,      // was 120 (6 seconds instead of 12)
  selfHarmonyBoost: 0.03, // was 0.02
  selfStabilityBoost: 0.015, // was 0.01
  neighborHarmonyBoost: 0.015  // was 0.01
};
```

### Proposal D: Lower Gameplay Trigger Thresholds

```javascript
// _emitGameplayTriggers adjustments
if (current.networkSynergy >= 0.55 && ...)   // was 0.82 → synergyCascade
if (current.harmonyFlow >= 0.65 && ...)      // was 0.85 → harmonyResonance
if (current.corruptionLevel >= 0.35 && ...)  // was 0.60 → corruptionOutbreak
const loadCollapseNow = current.loadPressure >= 0.65 && current.networkStress >= 0.45;  // was 0.80/0.60
if (current.networkStress >= 0.55 && ...)    // was 0.75 → instabilityTrap
```

### Proposal E: Tune Cross-Metric Interaction Rates

```javascript
const INTERACTION = {
  harmonyCoherenceGain: 0.020,           // was 0.025
  harmonyCorruptionLoss: 0.050,          // was 0.06
  corruptionVulnerabilityGain: 0.020,    // was 0.035 ← KEY: reduces runaway
  corruptionHarmonySuppression: 0.050,   // was 0.045
  corruptionLoadGain: 0.015,             // was 0.02
  stabilityHarmonyGain: 0.020,           // was 0.015
  stabilityCorruptionLoss: 0.035,        // was 0.04
  stabilityLoadLoss: 0.015               // was 0.02
};
```

Key change: `corruptionVulnerabilityGain` from 0.035 → 0.020 prevents Quantum runaway.

### Proposal F: Add Corruption Link Propagation (optional)

```javascript
const LINK_EQUALIZE = {
  harmony: 0.02,
  stability: 0.015,
  corruption: 0.008  // NEW: slow corruption bleed through links
};
```

This makes corruption "infectious" at a slow rate, creating gameplay tension.

---

## 4. PRIORITY ORDER

| Priority | Proposal | Impact | Risk |
|----------|----------|--------|------|
| **P0** | A: Fix synergy derivation | Fixes dead gameplay systems | Medium — changes core formula |
| **P1** | B: Differentiate tier thresholds | Unlocks tier events for all metrics | Low — config change only |
| **P1** | D: Lower gameplay triggers | Unlocks world events | Low — config change only |
| **P2** | C: Lower synergy burst | Unlocks burst mechanic | Low — config change only |
| **P2** | E: Tune interaction rates | Prevents Quantum runaway | Medium — changes dynamics |
| **P3** | F: Corruption link propagation | Adds network tension | Medium — new mechanic |

---

## 5. RECOMMENDED APPROACH

1. **Start with Proposal A2** (archetype-weighted synergy derivation) — this is the root cause
2. **Apply Proposal B** (differentiated tier thresholds) — unlocks event system
3. **Apply Proposal D** (lower gameplay triggers) — unlocks world events
4. **Test** — observe synergy values, tier events, and gameplay trigger frequency
5. **Then tune** Proposals C, E, F based on observed behavior

---

## 6. RISK ASSESSMENT

- **Proposal A**: Changes the fundamental synergy formula. All downstream systems (VFX, triggers, HUD) will show different values. This is intentional — the current values are broken.
- **Proposal B**: Only affects tier classification. Metrics themselves don't change, just when events fire.
- **Proposals C, D**: Only affect thresholds. Easily reversible.
- **Proposal E**: Changes dynamics behavior. May require iteration.
- **Proposal F**: Adds new mechanic. Should be tested separately.

No core philosophy violations. No architectural boundary crossings. All changes are within the existing `NodeMetricEngine` authority.
