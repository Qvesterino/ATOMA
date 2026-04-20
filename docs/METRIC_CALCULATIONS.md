# Metric Calculations

**Location**: [`src/metrics/NodeMetricEngine.js`](src/metrics/NodeMetricEngine.js)
**Tick Rate**: 10 Hz (every 0.1s)
**Smoothing**: Exponential smoothing with `DYNAMICS_INERTIA = 0.85`
**Rebalance**: v2 per `plans/METRICS_REBALANCE_V2_FINAL.md`

---

## Synergy

**Type**: Derived (read-only, computed from other metrics)

### Formula

```
derived = harmony × stability × (1 - corruption × 0.85) × (1 - loadPressure × 0.65)
archetypeBase = archetypeMetrics.synergy  // from NodeVisualRegistry
target = archetypeBase × 0.60 + derived × 0.40
```

### Smoothing

```
nextSynergy = currentSynergy + (target - currentSynergy) × 0.25 × dtScale
```

### Constants

| Constant | Value |
|----------|-------|
| `SYNERGY_DERIVATION.smoothing` | 0.25 |
| `SYNERGY_DERIVATION.corruptionDamping` | 0.85 |
| `SYNERGY_DERIVATION.loadDamping` | 0.65 |

---

## Harmony

**Type**: Dynamic (evolves via cross-metric interactions)

### Cross-Metric Interactions

```
vulnerability = (1 - stability) × (0.5 + loadPressure × 0.7)
coherence = stability × (1 - loadPressure × 0.6)

# Relaxation toward archetype base
harmony += (archetypeBase - harmony) × 0.05 × dtScale

# Coherence gain (positive feedback)
harmony += 0.025 × coherence × dtScale

# Corruption loss (negative feedback)
harmony -= 0.055 × corruption × vulnerability × dtScale
```

### Inertia Damping

```
nextHarmony = harmony × 0.85 + calculatedHarmony × 0.15
```

### Constants

| Constant | Value | Was |
|----------|-------|-----|
| `RELAXATION.harmony` | 0.05 | unchanged |
| `INTERACTION.harmonyCoherenceGain` | 0.025 | unchanged |
| `INTERACTION.harmonyCorruptionLoss` | 0.055 | was 0.060 |
| `DYNAMICS_INERTIA` | 0.85 | unchanged |

---

## Stability

**Type**: Dynamic (evolves via cross-metric interactions)

### Cross-Metric Interactions

```
# Relaxation toward archetype base
stability += (archetypeBase - stability) × 0.04 × dtScale

# Harmony gain (positive feedback)
stability += 0.020 × harmony × dtScale

# Corruption loss (negative feedback)
stability -= 0.035 × corruption × dtScale

# Load loss (negative feedback)
stability -= 0.015 × loadPressure × dtScale
```

### Inertia Damping

```
nextStability = stability × 0.85 + calculatedStability × 0.15
```

### Constants

| Constant | Value | Was |
|----------|-------|-----|
| `RELAXATION.stability` | 0.04 | unchanged |
| `INTERACTION.stabilityHarmonyGain` | 0.020 | was 0.015 |
| `INTERACTION.stabilityCorruptionLoss` | 0.035 | was 0.040 |
| `INTERACTION.stabilityLoadLoss` | 0.015 | was 0.020 |
| `DYNAMICS_INERTIA` | 0.85 | unchanged |

---

## Corruption

**Type**: Dynamic (evolves via cross-metric interactions)

### Cross-Metric Interactions

```
vulnerability = (1 - stability) × (0.5 + loadPressure × 0.7)
coherence = stability × (1 - loadPressure × 0.6)

# Natural decay
corruption -= corruption × 0.04 × dtScale

# Relaxation toward archetype base (if archetype has corruption)
if (archetypeBase > 0):
  corruption += (archetypeBase - corruption) × 0.03 × dtScale

# Vulnerability gain (positive feedback)
corruption += 0.022 × vulnerability × dtScale

# Harmony suppression (negative feedback)
corruption -= 0.055 × harmony × coherence × dtScale

# Load gain (positive feedback)
corruption += 0.015 × loadPressure × dtScale
```

### Inertia Damping

```
nextCorruption = corruption × 0.85 + calculatedCorruption × 0.15
```

### Constants

| Constant | Value | Was |
|----------|-------|-----|
| `RELAXATION.corruption` | 0.03 | unchanged |
| `INTERACTION.corruptionVulnerabilityGain` | 0.022 | was 0.035 |
| `INTERACTION.corruptionHarmonySuppression` | 0.055 | was 0.045 |
| `INTERACTION.corruptionLoadGain` | 0.015 | was 0.020 |
| `DYNAMICS_INERTIA` | 0.85 | unchanged |

---

## LoadPressure

**Type**: Dynamic (evolves via cross-metric interactions)

### Cross-Metric Interactions

```
# Relaxation toward archetype base
loadPressure += (archetypeBase - loadPressure) × 0.07 × dtScale
```

### Inertia Damping

```
nextLoadPressure = loadPressure × 0.85 + calculatedLoadPressure × 0.15
```

### Constants

| Constant | Value |
|----------|-------|
| `RELAXATION.loadPressure` | 0.07 |
| `DYNAMICS_INERTIA` | 0.85 |

---

## Link Equalization

When nodes are linked, their `harmony`, `stability`, and `corruption` slowly converge:

```
linkStrength = link.userData.synergy.score  // 0-1

# Harmony equalization (bidirectional)
dHarmony = (nodeB.harmony - nodeA.harmony) × 0.02 × linkStrength × dtScale
nodeA.harmony += dHarmony
nodeB.harmony -= dHarmony

# Stability equalization (bidirectional)
dStability = (nodeB.stability - nodeA.stability) × 0.015 × linkStrength × dtScale
nodeA.stability += dStability
nodeB.stability -= dStability

# Corruption equalization (asymmetric — infection direction only)
# Only the LESS corrupted node gains corruption (higher → lower)
dCorruption = (nodeB.corruption - nodeA.corruption) × 0.004 × linkStrength × dtScale
if dCorruption > 0: nodeA.corruption += dCorruption  # B infects A
if dCorruption < 0: nodeB.corruption -= dCorruption  # A infects B
```

**Note**: Corruption equalization is a baseline mechanic that complements
`LinkCorruptionTransmission_v1` (which handles complex 5-phase propagation
with harmony blocking, healing cascades, and resonance amplification).

### Constants

| Constant | Value | Notes |
|----------|-------|-------|
| `LINK_EQUALIZE.harmony` | 0.02 | Bidirectional convergence |
| `LINK_EQUALIZE.stability` | 0.015 | Bidirectional convergence |
| `LINK_EQUALIZE.corruption` | 0.004 | Asymmetric infection only |

---

## Synergy Resonance & Burst

### Resonance (linked nodes with high synergy)

When both linked nodes have synergy > threshold, they gain small harmony/stability boosts:

```
if (synergyA > 0.50 && synergyB > 0.50):
  harmonyGain = 0.003 × linkStrength  (capped at 0.012/tick/node)
  stabilityGain = 0.0015 × linkStrength  (capped at 0.006/tick/node)
```

| Constant | Value | Was |
|----------|-------|-----|
| `SYNERGY_RESONANCE.threshold` | 0.50 | was 0.75 |
| `SYNERGY_RESONANCE.harmonyGain` | 0.003 | was 0.002 |
| `SYNERGY_RESONANCE.stabilityGain` | 0.0015 | was 0.001 |
| `SYNERGY_RESONANCE.maxHarmonyPerTick` | 0.012 | was 0.010 |
| `SYNERGY_RESONANCE.maxStabilityPerTick` | 0.006 | was 0.005 |

### Burst (single node with very high synergy)

When a node's synergy exceeds burst threshold:

```
selfHarmonyBoost: 0.025
selfStabilityBoost: 0.012
neighborHarmonyBoost: 0.012
cooldown: 80 ticks (8 seconds)
```

| Constant | Value | Was |
|----------|-------|-----|
| `SYNERGY_BURST.threshold` | 0.60 | was 0.85 |
| `SYNERGY_BURST.cooldownTicks` | 80 | was 120 |
| `SYNERGY_BURST.selfHarmonyBoost` | 0.025 | was 0.020 |
| `SYNERGY_BURST.selfStabilityBoost` | 0.012 | was 0.010 |
| `SYNERGY_BURST.neighborHarmonyBoost` | 0.012 | was 0.010 |

---

## Tier Thresholds (per metric)

**File**: [`src/metrics/MetricTierClassifier.js`](src/metrics/MetricTierClassifier.js)

Thresholds are differentiated per metric to match actual steady-state distributions:

| Metric | low | high | lowExit | highExit |
|--------|-----|------|---------|----------|
| synergy | 0.15 | 0.45 | 0.22 | 0.38 |
| harmony | 0.20 | 0.60 | 0.27 | 0.53 |
| stability | 0.25 | 0.70 | 0.32 | 0.63 |
| corruption | 0.08 | 0.35 | 0.15 | 0.28 |
| loadPressure | 0.25 | 0.55 | 0.32 | 0.48 |

---

## Gameplay Triggers (network-level)

**File**: [`MetricsRuntime_v1.js`](MetricsRuntime_v1.js)

| Trigger | Threshold | Was |
|---------|-----------|-----|
| `event:synergyCascade` | networkSynergy ≥ 0.45 | was 0.82 |
| `event:harmonyResonance` | harmonyFlow ≥ 0.55 | was 0.85 |
| `event:corruptionOutbreak` | corruptionLevel ≥ 0.25 | was 0.60 |
| `event:loadCollapse` | load ≥ 0.55 AND stress ≥ 0.40 | was 0.80/0.60 |
| `event:instabilityTrap` | stress ≥ 0.50 | was 0.75 |

---

## Semantic Event Thresholds (node-level)

| Event | Threshold | Was |
|-------|-----------|-----|
| `metric:harmonyPeak` | harmony ≥ 0.65 | was 0.85 |
| `metric:loadPressureHigh` | loadPressure ≥ 0.55 | was 0.75 |
| `metric:synergyBurst` | synergy > 0.60 | was 0.85 |
| `metric:corruptionSpike` | corruption > 0.50 | was 0.65 |

---

## Summary Flow

```
For each tick (10Hz):
  1. Apply cross-metric interactions (harmony, stability, corruption, loadPressure)
  2. Apply inertia damping (0.85)
  3. Equalize metrics through links (harmony, stability only)
  4. Derive synergy from current metrics (60% archetype + 40% derived)
  5. Apply archetype clamp (prevent metrics from drifting too far from archetype)
  6. Apply synergy resonance (if both linked nodes > 0.50 synergy)
  7. Apply synergy burst (if node > 0.60 synergy, 8s cooldown)
  8. Emit tier events, semantic events, threshold events
```
