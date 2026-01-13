# WEEK 13: ARCHETYPE CURVES — TECHNICAL REFERENCE

**Phase 3C | Week 13 | API & Formula Reference**

---

## 📋 TABLE OF CONTENTS

1. [API Reference](#api-reference)
2. [Archetype Profiles Table](#archetype-profiles-table)
3. [Curve Formulas](#curve-formulas)
4. [Signal Definitions](#signal-definitions)
5. [Configuration Options](#configuration-options)
6. [Output Data Structure](#output-data-structure)

---

## API REFERENCE

### Constructor

```javascript
new ArchetypeAscensionCurves_v1(config)
```

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `config.mythicEvolutionFX` | Object | ✅ | — | Reference to MythicEvolutionFX_v1 instance |
| `config.aiNodes` | Array | ✅ | — | Array of AI nodes to process |
| `config.personalitySignals` | Object | ❌ | null | Reference to NodePersonality system (optional) |
| `config.debugEnabled` | Boolean | ❌ | false | Enable 1% sampling console logs |
| `config.autoAssignArchetypes` | Boolean | ❌ | false | Auto-assign archetypes based on signals |

**Example:**

```javascript
const archetypeCurves = new ArchetypeAscensionCurves_v1({
  mythicEvolutionFX: this.mythicEvolutionFX,
  aiNodes: this.aiNodes.nodes,
  personalitySignals: this.nodePersonality,
  debugEnabled: process.env.DEBUG === 'true',
  autoAssignArchetypes: false,
});
```

---

### Methods

#### `update(deltaTime)`

Process all nodes and compute archetype evolution.

```javascript
archetypeCurves.update(0.016);  // 60 FPS
```

**Notes:**
- Called once per frame, after MythicEvolutionFX_v1.update()
- Writes to `node.userData.archetypeEvolution`
- O(n) complexity, <0.4ms per 200 nodes

---

#### `assignArchetype(node, archetypeId)`

Manually assign archetype to a node.

```javascript
archetypeCurves.assignArchetype(myNode, 'warlock');
```

**Valid Archetype IDs:**
- `'sage'` — Stability/Clarity
- `'warlock'` — Chaos/Entropy
- `'sentinel'` — Order/Stability
- `'empath'` — Harmony/Resonance
- `'invoker'` — Energy/Focus
- `'mythic'` — Transcendent

---

#### `getNodeState(node)`

Retrieve archetype evolution state for a node.

```javascript
const state = archetypeCurves.getNodeState(myNode);
```

**Returns:**

```javascript
{
  archetypeId: 'sage',
  archetypeName: 'Sage',
  ascensionModified: 0.67,
  ascensionMultiplier: 1.32,
  curveRaw: 0.70,
  curveSmoothed: 0.68,
  personalityInfluence: 0.85,
  tierBoost: 1.4,
  nextTierProgress: 0.12,
  lastUpdateTime: 1234.56,
}
```

**or `null` if node not initialized.**

---

#### `getArchetypes()`

List all available archetypes with metadata.

```javascript
const archetypes = archetypeCurves.getArchetypes();
```

**Returns:**

```javascript
[
  {
    id: 'sage',
    name: 'Sage',
    curveType: 'logistic',
    baseMultiplier: 1.0,
    peakMultiplier: 1.4,
  },
  // ... (6 total)
]
```

---

#### `getStats()`

Get aggregate statistics across all nodes.

```javascript
const stats = archetypeCurves.getStats();
```

**Returns:**

```javascript
{
  nodeCount: 42,
  avgAscension: 0.56,
  maxMultiplier: 2.18,
  archetypeCounts: {
    sage: 12,
    warlock: 3,
    sentinel: 15,
    empath: 8,
    invoker: 2,
    mythic: 2,
  }
}
```

---

#### `dispose()`

Clean up system (call on shutdown).

```javascript
archetypeCurves.dispose();
```

---

### Static Utilities (CurveUtils)

All curve functions accept `x` in [0, 1].

#### `CurveUtils.logistic(x, k=10, x0=0.5)`

Smooth S-curve logistic function.

```
Formula: 1 / (1 + e^(-k*(x-x0)))
  k = steepness (higher = steeper)
  x0 = center point (0.5 = centered)
  
Example: logistic(0.5) ≈ 0.50
         logistic(0.3) ≈ 0.18
         logistic(0.7) ≈ 0.82
```

**Used by:** Sage

---

#### `CurveUtils.exponential(x)`

Rapid acceleration from low to high.

```
Formula: (e^x - 1) / (e - 1)

Example: exponential(0.3) ≈ 0.08
         exponential(0.5) ≈ 0.31
         exponential(0.8) ≈ 0.87
```

**Used by:** Warlock

---

#### `CurveUtils.linear(x)`

Simple proportional mapping.

```
Formula: y = x (clamped to [0, 1])

Example: linear(0.5) = 0.5
         linear(0.8) = 0.8
```

**Used by:** Sentinel

---

#### `CurveUtils.sigmoid(x, k=12)`

Steep S-curve sigmoid function.

```
Formula: 1 / (1 + e^(-k*(x-0.5)))
  k = steepness (higher = steeper)
  
Example: sigmoid(0.3) ≈ 0.02
         sigmoid(0.5) ≈ 0.50
         sigmoid(0.7) ≈ 0.98
```

**Used by:** Empath

---

#### `CurveUtils.easeInOutCubic(x)`

Ease-in-out cubic interpolation (peaks mid-range).

```
Formula: 
  if x < 0.5: 4*x^3
  else: 1 - (-2*x+2)^3/2

Example: easeInOut(0.0) = 0.0
         easeInOut(0.5) = 1.0  ← peaks here
         easeInOut(1.0) = 0.0
```

**Used by:** Invoker

---

#### `CurveUtils.hybridExponentialLogistic(x)`

Exponential early phase, logistic late phase.

```
Formula:
  if x < 0.5: exp(x*2)/exp(1) * 0.5
  else: 0.5 + logistic(steep) * 0.5

Example: hybrid(0.2) ≈ 0.15
         hybrid(0.5) ≈ 0.50
         hybrid(0.8) ≈ 0.95
```

**Used by:** Mythic

---

#### `CurveUtils.clamp01(x)`

Clamp value to [0, 1].

```
Formula: max(0, min(1, x))

Example: clamp01(-0.5) = 0.0
         clamp01(0.5) = 0.5
         clamp01(1.5) = 1.0
```

---

## ARCHETYPE PROFILES TABLE

| Archetype | Curve | Base | Peak | Drivers | Corruption | Plateau | Hysteresis |
|-----------|-------|------|------|---------|------------|---------|------------|
| Sage | Logistic | 1.0 | 1.4 | clarity, harmony | -0.3 (resist) | 0.95 | 0.03 |
| Warlock | Exponential | 0.8 | 2.2 | entropy, chaos | +0.4 (amplify) | 0.88 | 0.04 |
| Sentinel | Linear | 0.9 | 1.2 | stability, order | -0.5 (resist) | 0.98 | 0.02 |
| Empath | Sigmoid | 1.05 | 1.6 | resonance, synergy, harmony | 0.0 (neutral) | 0.92 | 0.025 |
| Invoker | EaseInOut | 1.1 | 1.7 | energy, focus | 0.0 (neutral) | 0.85 | 0.035 |
| Mythic | Hybrid | 1.2 | 2.5 | all signals | 0.0 (neutral) | 0.80 | 0.05 |

### Multiplier Range Table

What multipliers can each archetype achieve?

| Archetype | At Tier 0 | At Tier 2 | At Tier 4 | Max Possible |
|-----------|-----------|-----------|-----------|--------------|
| Sage | 1.0–1.4 | 1.4–1.96 | 2.0–2.8 | 1.4 × 2.0 = 2.8 |
| Warlock | 0.8–2.2 | 1.12–3.08 | 1.6–4.4 | 2.2 × 2.0 = 4.4 |
| Sentinel | 0.9–1.2 | 1.26–1.68 | 1.8–2.4 | 1.2 × 2.0 = 2.4 |
| Empath | 1.05–1.6 | 1.47–2.24 | 2.1–3.2 | 1.6 × 2.0 = 3.2 |
| Invoker | 1.1–1.7 | 1.54–2.38 | 2.2–3.4 | 1.7 × 2.0 = 3.4 |
| Mythic | 1.2–2.5 | 1.68–3.5 | 2.4–5.0 | 2.5 × 2.0 = 5.0 |

---

## CURVE FORMULAS

### Detailed Formulas (Mathematical)

#### Logistic (Sage)

```
y = 1 / (1 + e^(-k*(x-x0)))

with k=10, x0=0.5:

  x=0.0: y ≈ 0.0067
  x=0.2: y ≈ 0.0180
  x=0.4: y ≈ 0.1192
  x=0.5: y ≈ 0.5000
  x=0.6: y ≈ 0.8808
  x=0.8: y ≈ 0.9820
  x=1.0: y ≈ 0.9933
```

**JavaScript:**

```javascript
function logistic(x, k = 10, x0 = 0.5) {
  return 1.0 / (1.0 + Math.exp(-k * (x - x0)));
}
```

---

#### Exponential (Warlock)

```
y = (e^x - 1) / (e - 1)

with e ≈ 2.71828:

  x=0.0: y = 0.0000
  x=0.2: y ≈ 0.0805
  x=0.4: y ≈ 0.1896
  x=0.5: y ≈ 0.3149
  x=0.8: y ≈ 0.8694
  x=1.0: y = 1.0000
```

**JavaScript:**

```javascript
function exponential(x) {
  const e = Math.E;
  return Math.max(0, Math.min(1, (Math.exp(x) - 1) / (e - 1)));
}
```

---

#### Sigmoid (Empath)

```
y = 1 / (1 + e^(-k*(x-0.5)))

with k=12 (steeper than logistic):

  x=0.0: y ≈ 0.000023
  x=0.3: y ≈ 0.0000454
  x=0.5: y ≈ 0.5000
  x=0.7: y ≈ 0.9999546
  x=1.0: y ≈ 0.999977
```

**JavaScript:**

```javascript
function sigmoid(x, k = 12) {
  return 1.0 / (1.0 + Math.exp(-k * (x - 0.5)));
}
```

---

#### Ease-In-Out Cubic (Invoker)

```
y = (x < 0.5) 
      ? 4*x^3
      : 1 - (-2*x+2)^3/2

Behavior:
  x=0.0: y = 0.0
  x=0.25: y ≈ 0.0625 (slow start)
  x=0.5: y = 1.0 (peak!)
  x=0.75: y ≈ 0.9375 (slow end)
  x=1.0: y = 0.0
```

**JavaScript:**

```javascript
function easeInOutCubic(x) {
  return x < 0.5
    ? 4 * x * x * x
    : 1 - Math.pow(-2 * x + 2, 3) / 2;
}
```

---

#### Hybrid Exponential + Logistic (Mythic)

```
y = (x < 0.5)
      ? (e^(x*2) - 1) / (e - 1) * 0.5
      : 0.5 + (1 / (1 + e^(-15*(x*2-0.5-1)))) * 0.5

Phases:
  0.0–0.5: Exponential acceleration
  0.5–1.0: Logistic plateau (steep)

Behavior:
  x=0.0: y = 0.0
  x=0.2: y ≈ 0.08
  x=0.5: y ≈ 0.50
  x=0.8: y ≈ 0.95
  x=1.0: y = 1.0
```

**JavaScript:**

```javascript
function hybridExponentialLogistic(x) {
  if (x < 0.5) {
    const e = Math.E;
    return (Math.exp(x * 2) - 1) / (e - 1) * 0.5;
  } else {
    const shifted = (x - 0.5) * 2;
    const logistic = 1.0 / (1.0 + Math.exp(-15 * (shifted - 0.5)));
    return 0.5 + logistic * 0.5;
  }
}
```

---

## SIGNAL DEFINITIONS

### Personality Signals (Read from node.userData)

| Signal | Range | Default | Meaning |
|--------|-------|---------|---------|
| `clarity` | [0, 1] | 0.5 | Logical clarity / focus |
| `harmony` | [0, 1] | 0.5 | Internal harmony / balance |
| `resonance` | [0, 1] | 0.5 | Resonance with peers |
| `synergy` | [0, 1] | 0.5 | Synergy with linked nodes |
| `energy` | [0, 1] | 0.5 | Energy level / vitality |
| `stability` | [0, 1] | 0.5 | Structural stability |
| `corruption` | [0, 1] | 0.0 | Corruption level |
| `entropy` | [0, 1] | 0.0 | Entropy / chaos |

### Mythic Evolution Signals (Read from node.userData.mythicEvolution)

| Signal | Range | Meaning |
|--------|-------|---------|
| `ascensionSmoothed` | [0, 1] | Base ascension (input to curves) |
| `tier` | [0, 4] | Evolution tier (0=Dormant to 4=Transcendent) |
| `tierName` | String | Tier name |

---

## CONFIGURATION OPTIONS

### Constructor Configuration

```javascript
{
  // REQUIRED
  mythicEvolutionFX,      // MythicEvolutionFX_v1 instance
  aiNodes,                // Array of nodes

  // OPTIONAL
  personalitySignals,     // NodePersonality system ref (for signal reading)
  debugEnabled,           // 1% sampling logs (default: false)
  autoAssignArchetypes,   // Auto-assign based on signals (default: false)
}
```

### Archetype Configuration (Internal)

Each archetype can be customized by modifying the `_initializeArchetypes()` method:

```javascript
new ArchetypeCurve('sage', 'Sage', {
  curveType,              // 'logistic' | 'exponential' | 'linear' | 'sigmoid' | 'hybrid'
  baseMultiplier,         // Minimum multiplier (typically 0.8–1.2)
  peakMultiplier,         // Maximum multiplier (typically 1.2–2.5)
  personalityDriver,      // Array of signal names
  corruptionSensitivity,  // -0.5 to +0.5 (negative = resist, positive = amplify)
  harmonyBias,            // 0.0–1.0 (influence of harmony signal)
  resonanceBias,          // 0.0–1.0 (influence of resonance signal)
  energyBias,             // 0.0–1.0 (influence of energy signal)
  plateauThreshold,       // 0.8–0.98 (where curve plateaus)
  hysteresisThreshold,    // 0.02–0.05 (dead zone for oscillation prevention)
})
```

---

## OUTPUT DATA STRUCTURE

### node.userData.archetypeEvolution

Complete data structure written to every node after update():

```javascript
{
  // Archetype Information
  archetypeId,              // String: 'sage', 'warlock', 'sentinel', 'empath', 'invoker', 'mythic'
  archetypeName,            // String: Human-readable name

  // Ascension Values (0–1)
  ascensionModified,        // Final ascension (primary output for weeks 14–16)
  ascensionMultiplier,      // Visual multiplier (1.0–5.0+)

  // Curve Intermediate Values
  curveRaw,                 // Raw curve evaluation (before smoothing)
  curveSmoothed,            // After hysteresis (after smoothing)

  // Personality Modulation
  personalityInfluence,     // 0–1: How much personality bent the curve

  // Tier Boosting
  tierBoost,                // 1.0–2.0+: Tier-specific multiplier

  // Progress Tracking
  nextTierProgress,         // 0–1: How close to next tier boundary
  lastUpdateTime,           // Timestamp of last update
}
```

### Example State Object

```javascript
{
  archetypeId: "empath",
  archetypeName: "Empath",
  ascensionModified: 0.742,
  ascensionMultiplier: 1.687,  // 1.05 + 0.742*(1.6-1.05) = 1.05 + 0.637 = 1.687
  curveRaw: 0.765,
  curveSmoothed: 0.742,
  personalityInfluence: 0.91,  // High harmony & resonance
  tierBoost: 1.4,              // Ascending tier (tier 2)
  nextTierProgress: 0.23,      // 23% to next boundary
  lastUpdateTime: 1234.567,
}
```

---

## QUICK LOOKUP TABLES

### Auto-Assignment Rules

```
Highest Signal → Assigned Archetype

clarity > 0.7          → Sage
entropy > 0.6          → Warlock
stability > 0.7        → Sentinel
resonance > 0.65       → Empath
energy > 0.65          → Invoker
tier >= 3              → Mythic (override)
(default)              → Sage
```

### Tier Boost Table

```
Tier Name      | Number | Boost
Dormant        | 0      | 1.0x
Awakened       | 1      | 1.2x
Ascending      | 2      | 1.4x
Mythic         | 3      | 1.7x
Transcendent   | 4      | 2.0x
```

### Corruption Sensitivity Table

```
Archetype  | Sensitivity | Effect
Sage       | -0.30       | -30% corruption impact
Warlock    | +0.40       | +40% corruption boost
Sentinel   | -0.50       | -50% corruption impact (strongest resist)
Empath     | 0.00        | No corruption effect
Invoker    | 0.00        | No corruption effect
Mythic     | 0.00        | No corruption effect
```

---

*Reference Version: 1.0 | Week 13 | Phase 3C*
