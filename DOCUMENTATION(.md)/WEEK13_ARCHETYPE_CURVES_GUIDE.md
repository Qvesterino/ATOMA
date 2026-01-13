# WEEK 13: ARCHETYPE ASCENSION CURVES — COMPLETE GUIDE

**Phase 3C | Week 13 | Logic Layer**

---

## 📋 TABLE OF CONTENTS

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [The 6 Archetypes](#the-6-archetypes)
4. [Curve Mathematics](#curve-mathematics)
5. [Integration Flow](#integration-flow)
6. [Usage Patterns](#usage-patterns)
7. [Performance](#performance)
8. [Future Hooks (Weeks 14–16)](#future-hooks-weeks-1416)

---

## OVERVIEW

### What is Week 13?

Week 13 introduces **personality-driven ascension curves** — a pure logic layer that:

- Reads base ascension scores from **MythicEvolutionFX_v1**
- Applies 6 different non-linear curve profiles based on archetype
- Modulates curves using personality signals (clarity, harmony, energy, etc.)
- Outputs visual multiplier signals for weeks 14–16 FX systems
- **Does NOT modify any existing files** — 100% additive

### Why Archetypes?

Different AI personalities should evolve differently:

- **Sage** nodes ascend steadily, resistant to corruption
- **Warlock** nodes spike dramatically with chaos
- **Sentinel** nodes plateau early, very stable
- **Empath** nodes respond to synergy/resonance
- **Invoker** nodes peak at mid-ascension
- **Mythic** nodes transcend all rules with highest multipliers

Week 13 makes this personality-driven evolution explicit and formulaic.

### Visual Result (Week 13 Output)

```
node.userData.archetypeEvolution = {
  archetypeId: "sage",           // Which archetype?
  archetypeName: "Sage",         // Human name
  ascensionModified: 0.67,       // Curve-mapped 0–1
  ascensionMultiplier: 1.32,     // Applied to FX intensity (1.0–2.5)
  curveRaw: 0.70,                // Pre-smoothing
  curveSmoothed: 0.68,           // With hysteresis
  personalityInfluence: 0.85,    // How personality bent the curve
  tierBoost: 1.4,                // Tier-specific multiplier
  nextTierProgress: 0.12,        // Progress to next boundary
}
```

These values will be consumed by Week 14–16 systems for visual effects.

---

## ARCHITECTURE

### Three-Layer Stack

```
Week 13: Archetype Curves (THIS WEEK)
   ↓ Reads ascensionSmoothed
Week 11: Mythic Evolution (data provider)
   ↓
Week 9–10: Node/Link Auras (will consume Week 13 data in Week 14)
```

### Data Flow (Single Update Cycle)

```
1. MythicEvolutionFX_v1.update()
   → node.userData.mythicEvolution.ascensionSmoothed = 0.45

2. ArchetypeAscensionCurves_v1.update()
   → Read ascensionSmoothed (0.45)
   → Get archetype ("sage")
   → Apply curve: logistic(0.45) = 0.52
   → Compute personality influence: 0.88 (high clarity)
   → Apply bias: 0.52 * (0.5 + 0.88) = 0.72
   → Apply hysteresis: smooth(0.72) ≈ 0.70
   → Compute multiplier: 1.0 + 0.70 * (1.4 - 1.0) = 1.28
   → Write to node.userData.archetypeEvolution
   
3. Week 14–16 FX systems
   → Read archetypeEvolution.ascensionMultiplier
   → Apply to aura intensity, glow, color tint, etc.
```

### Core Components

#### 1. **ArchetypeCurve** (Descriptor Class)

Defines a single archetype profile:

```javascript
new ArchetypeCurve('sage', 'Sage', {
  curveType: 'logistic',           // Curve shape
  baseMultiplier: 1.0,             // Min multiplier
  peakMultiplier: 1.4,             // Max multiplier at full ascension
  personalityDriver: ['clarity', 'harmony'],  // Which signals drive this
  corruptionSensitivity: -0.3,     // -0.3 = resist corruption 30%
  harmonyBias: 0.25,               // 25% of influence from harmony signal
  hysteresisThreshold: 0.03,       // 3% dead zone
});
```

#### 2. **CurveUtils** (Evaluation Functions)

Pure functions for curve math:

- `logistic(x, k, x0)` — Smooth S-curve
- `exponential(x)` — Rapid acceleration
- `linear(x)` — Proportional
- `sigmoid(x, k)` — Steep S-curve
- `easeInOutCubic(x)` — Ease-in-out
- `hybridExponentialLogistic(x)` — Exponential early, logistic late
- `clamp01(x)` — Clamp to 0–1

#### 3. **ArchetypeAscensionCurves_v1** (Main System)

Orchestrator class that:

- Initializes 6 archetypes
- Updates all nodes per frame
- Computes curves, personality influence, and smoothing
- Provides manual archetype assignment
- Supports auto-assignment (optional)

---

## THE 6 ARCHETYPES

### 1. SAGE — Stability & Clarity

**Philosophy:** Steady, wise, resistant to chaos.

**Curve:** Logistic (smooth S-curve)  
**Base Multiplier:** 1.0 → Peak: 1.4  
**Drivers:** clarity, harmony  
**Corruption Sensitivity:** -0.3 (resist 30%)  
**Plateau Threshold:** 0.95

**Behavior:**
- Smooth, gradual ascension
- Slows down near peak (logistic)
- Very resistant to corruption effects
- Benefits from harmony signals

**Visual Hint Color:** #0088ff (cyan-blue)

```
Ascension  Multiplier
1.0        1.4  ╱─────
0.8        1.32 ╱
0.6        1.20 │
0.4        1.08 ╱
0.2        1.02 ╱
0.0        1.0  ╱
```

---

### 2. WARLOCK — Chaos & Entropy

**Philosophy:** Chaotic, dangerous, unpredictable spikes.

**Curve:** Exponential (rapid acceleration)  
**Base Multiplier:** 0.8 → Peak: 2.2 (highest)  
**Drivers:** entropy, chaos  
**Corruption Sensitivity:** +0.4 (amplify 40%)  
**Plateau Threshold:** 0.88

**Behavior:**
- Small initial ascension
- MASSIVE spike at higher ascension values
- Thrives on corruption (multiplier increases)
- Lowest baseline (0.8), highest peak (2.2)
- Dangerous in high-chaos environments

**Visual Hint Color:** #ff00ff (magenta)

```
Ascension  Multiplier
1.0        2.2  ╱╱╱
0.8        1.8  ╱╱
0.6        1.3  ╱
0.4        0.95 ╱
0.2        0.82 ╱
0.0        0.8  ╱
```

---

### 3. SENTINEL — Order & Stability

**Philosophy:** Stoic, unchanging, resistant to evolution.

**Curve:** Linear (proportional)  
**Base Multiplier:** 0.9 → Peak: 1.2 (lowest)  
**Drivers:** stability, order  
**Corruption Sensitivity:** -0.5 (resist 50%, strongest)  
**Plateau Threshold:** 0.98 (latest)

**Behavior:**
- Linear, predictable ascension
- Plateaus VERY late (0.98)
- Lowest peak (1.2) — hard to ascend far
- Extreme corruption resistance
- Most stable, least flashy

**Visual Hint Color:** #cccccc (silver-gray)

```
Ascension  Multiplier
1.0        1.2  ╱─
0.8        1.16 ╱
0.6        1.12 │
0.4        1.08 ╱
0.2        1.04 ╱
0.0        0.9  ╱
```

---

### 4. EMPATH — Harmony & Resonance

**Philosophy:** Connected, responsive, synergy-driven.

**Curve:** Sigmoid (steep S-curve)  
**Base Multiplier:** 1.05 → Peak: 1.6  
**Drivers:** resonance, synergy, harmony  
**Resonance Bias:** 0.35 (high sensitivity)  
**Harmony Bias:** 0.20  
**Plateau Threshold:** 0.92

**Behavior:**
- Steep sigmoid — slow early, rapid mid, slow late
- Highly responsive to synergy/resonance signals
- Benefits from connected networks
- Mid-range multiplier (1.6)
- "Empathic" to surrounding node states

**Visual Hint Color:** #00ff00 (lime-green)

```
Ascension  Multiplier
1.0        1.6  ────╱
0.8        1.54 ────╱
0.6        1.30 ╱╱╱
0.4        1.06 ╱
0.2        1.05 ╱
0.0        1.05 ─
```

---

### 5. INVOKER — Energy & Focus

**Philosophy:** Dynamic, peaks mid-ascension, LFO-ready.

**Curve:** Ease-in-out cubic (peaks at 0.5)  
**Base Multiplier:** 1.1 → Peak: 1.7  
**Drivers:** energy, focus  
**Energy Bias:** 0.40 (high energy sensitivity)  
**Plateau Threshold:** 0.85 (earliest)

**Behavior:**
- Starts slow, accelerates mid-ascension (cubic)
- Decelerates toward plateau (ease-out)
- Peaks earlier than others (0.85)
- Good for LFO tie-in (future visual effects)
- High mid-range multiplier (1.7)

**Visual Hint Color:** #ffff00 (yellow)

```
Ascension  Multiplier
1.0        1.55 ──╱─
0.8        1.62 ╱╱
0.6        1.70 ╱ ← peak
0.4        1.40 ╱
0.2        1.15 ╱
0.0        1.1  ╱
```

---

### 6. MYTHIC — Transcendent Evolution

**Philosophy:** Transcends all rules, highest multipliers.

**Curve:** Hybrid exponential+logistic  
**Base Multiplier:** 1.2 → Peak: 2.5 (absolute max)  
**Drivers:** all (responds to all signals)  
**Resonance Bias:** 0.25, Energy Bias: 0.20, Harmony Bias: 0.15  
**Plateau Threshold:** 0.80 (earliest)

**Behavior:**
- Exponential phase (0.0–0.5): rapid acceleration
- Logistic phase (0.5–1.0): steep but controlled ascension
- Responds to ALL personality signals equally
- HIGHEST multiplier (2.5) and baseline (1.2)
- Transcends corruption/stability concerns
- Reserved for tier ≥ 3 (Mythic/Transcendent nodes)

**Visual Hint Color:** #ffff00 (yellow — transcendent)

```
Ascension  Multiplier
1.0        2.5  ╱╱═
0.8        2.3  ╱╱
0.6        1.95 ╱╱╱
0.4        1.60 ╱╱
0.2        1.35 ╱
0.0        1.2  ╱
```

---

## CURVE MATHEMATICS

### Step-by-Step Computation

For each node, Week 13 computes ascension as:

```
1. Base Ascension (from Week 11)
   baseAsc = node.userData.mythicEvolution.ascensionSmoothed

2. Apply Archetype Curve
   curveRaw = evaluate_curve(baseAsc, archetype.curveType)
   
   Examples:
   - Sage logistic(0.50) ≈ 0.50 (smooth)
   - Warlock exponential(0.50) ≈ 0.31 (slow at start)
   - Warlock exponential(0.80) ≈ 0.87 (spike at high!)
   - Sentinel linear(0.50) = 0.50 (proportional)
   - Empath sigmoid(0.50) ≈ 0.50 (threshold)
   - Invoker easeInOut(0.50) = 1.0 (peak!)
   - Mythic hybrid(0.50) ≈ 0.50 (exponential phase)

3. Compute Personality Influence (0–1)
   influence = average(
     clarity * (if 'clarity' in drivers),
     harmony * (if 'harmony' in drivers),
     resonance * (if 'resonance' in drivers),
     energy * (if 'energy' in drivers),
     ... (other signals)
   )
   
   Modify by corruption:
   influence *= (1.0 + corruptionSensitivity * corruption)
   
   Clamp to [0, 1]

4. Apply Personality Bias to Curve
   curveWithPersonality = curveRaw * (0.5 + influence)
   
   Logic: influence in [0, 1] → multiplier in [0.5x, 1.5x]
   - Low personality: curve * 0.5 (dampened)
   - High personality: curve * 1.5 (amplified)

5. Apply Hysteresis (prevent oscillation)
   if |curveWithPersonality - lastValue| < hysteresisThreshold:
     curveSmoothed = lastValue
   else:
     curveSmoothed = lastValue * 0.85 + curveWithPersonality * 0.15
     
   EMA factor (α = 0.15) ensures smooth frame-to-frame transitions

6. Compute Tier Boost (1.0–2.0+)
   tierBoosts = [1.0, 1.2, 1.4, 1.7, 2.0]
   tierBoost = tierBoosts[min(tier, 4)]
   
   Dormant (0) → 1.0x
   Awakened (1) → 1.2x
   Ascending (2) → 1.4x
   Mythic (3) → 1.7x
   Transcendent (4) → 2.0x

7. Compute Final Multiplier (1.0–2.5+)
   ascensionMultiplier = baseMultiplier + 
     (curveSmoothed * (peakMultiplier - baseMultiplier))
   
   finalMultiplier = ascensionMultiplier * tierBoost
   
   Example (Sage):
   - baseMultiplier = 1.0
   - peakMultiplier = 1.4
   - curveSmoothed = 0.70
   - tierBoost = 1.4 (Ascending)
   - ascensionMultiplier = 1.0 + 0.70 * (1.4 - 1.0) = 1.28
   - finalMultiplier = 1.28 * 1.4 = 1.79 ✓

8. Final Ascension (0–1)
   ascensionModified = clamp01(curveSmoothed)
   
   This is the final output written to node.userData.archetypeEvolution
```

### Formula Summary

```
personalityInfluence = weighted_avg(driverSignals) * (1 + corruptionSensitivity * corruption)

curveRaw = eval_curve(baseAscension, curveType)

curveSmoothed = hysteresis(curveRaw * (0.5 + personalityInfluence))

tierBoost = [1.0, 1.2, 1.4, 1.7, 2.0][tier]

ascensionMultiplier = baseMultiplier + curveSmoothed * (peakMultiplier - baseMultiplier)

finalMultiplier = ascensionMultiplier * tierBoost

ascensionModified = clamp01(curveSmoothed)
```

---

## INTEGRATION FLOW

### Step 1: Constructor (Game Init)

```javascript
// main.js or game.js

import { ArchetypeAscensionCurves_v1 } from './ArchetypeAscensionCurves_v1.js';

// In constructor:
this.archetypeCurves = new ArchetypeAscensionCurves_v1({
  mythicEvolutionFX: this.mythicEvolutionFX,  // Required
  aiNodes: this.aiNodes.nodes,                // Required
  personalitySignals: this.nodePersonality,   // Optional, for signal reading
  debugEnabled: false,                        // Disabled in production
  autoAssignArchetypes: false,                // Manual assignment by default
});
```

### Step 2: Update Loop (Per Frame)

```javascript
// main.js game loop

// After MythicEvolutionFX_v1.update():
this.mythicEvolutionFX.update(deltaTime);

// Before any FX systems that consume archetype data:
this.archetypeCurves.update(deltaTime);

// Week 14+ systems can now read:
// node.userData.archetypeEvolution.ascensionMultiplier
```

### Step 3: Manual Archetype Assignment (Optional)

```javascript
// Assign specific archetype to node
this.archetypeCurves.assignArchetype(myNode, 'warlock');

// Auto-assign based on personality (if enabled in constructor)
// (Automatically happens in update() if autoAssignArchetypes: true)
```

### Step 4: Query State (for Debugging)

```javascript
// Get archetype evolution for a node
const state = this.archetypeCurves.getNodeState(myNode);
console.log(state);
// {
//   archetypeId: "sage",
//   archetypeName: "Sage",
//   ascensionModified: 0.67,
//   ascensionMultiplier: 1.32,
//   ...
// }

// Get aggregate stats
const stats = this.archetypeCurves.getStats();
console.log(stats);
// {
//   nodeCount: 42,
//   avgAscension: 0.56,
//   maxMultiplier: 2.18,
//   archetypeCounts: { sage: 12, warlock: 3, sentinel: 15, ... }
// }

// List all archetypes
const archetypes = this.archetypeCurves.getArchetypes();
```

### Step 5: Cleanup (Game Shutdown)

```javascript
// main.js shutdown
this.archetypeCurves.dispose();
```

---

## USAGE PATTERNS

### Pattern 1: Default (Manual Assignment)

```javascript
// On node creation:
node.userData.archetypeId = 'sage';  // Manual

// Week 13 will use this assignment
this.archetypeCurves.update(deltaTime);

// Query result:
const ae = node.userData.archetypeEvolution;
console.log(`${ae.archetypeName}: ${ae.ascensionModified.toFixed(3)}`);
```

### Pattern 2: Auto-Assignment (Based on Personality)

```javascript
// Constructor:
this.archetypeCurves = new ArchetypeAscensionCurves_v1({
  // ...
  autoAssignArchetypes: true,  // Enable!
});

// Week 13 will automatically assign based on highest signal:
// - If clarity > 0.7 → sage
// - If entropy > 0.6 → warlock
// - If stability > 0.7 → sentinel
// - If resonance > 0.65 → empath
// - If energy > 0.65 → invoker
// - If tier >= 3 → mythic
```

### Pattern 3: Dynamic Reassignment

```javascript
// Detect state change (e.g., corruption spike)
if (node.userData.corruption > 0.8) {
  this.archetypeCurves.assignArchetype(node, 'warlock');
  console.log(`${node.id} transformed to Warlock!`);
}
```

### Pattern 4: Query for Visual Effects (Week 14+)

```javascript
// In aura/shader integration (future):

function updateNodeGlow(node) {
  const ae = node.userData.archetypeEvolution;
  if (!ae) return;

  const glowIntensity = 0.5 + ae.ascensionMultiplier * 0.5;
  const baseColor = node.userData.color;
  
  // Tint toward archetype color based on ascension
  const tintAmount = ae.ascensionModified * 0.2;
  // (to be implemented in Week 14)
}
```

---

## PERFORMANCE

### Metrics

- **Per-node cost:** ~0.002ms (logistic curve + EMA smoothing)
- **Per-frame cost (200 nodes):** ~0.4ms
- **Per-frame cost (500 nodes):** ~1.0ms
- **Memory overhead:** ~150 bytes per node (WeakMap)

### Optimization Notes

1. **Lightweight math:** All curves are O(1) — no loops
2. **WeakMap for state:** Automatic garbage collection, no memory leaks
3. **Defensive reading:** All signals have fallback values (0.5 default)
4. **EMA smoothing:** Single alpha factor (0.15), no expensive operations
5. **Hysteresis:** Prevents oscillation without complex state machines

### Profiling Advice

```javascript
// Enable debug mode to see timings (1% sampling)
this.archetypeCurves = new ArchetypeAscensionCurves_v1({
  // ...
  debugEnabled: true,
});

// Console output (1% of frames):
// [Sage] node=sage_42, ascMod=0.671, mult=1.321
// [Warlock] node=wl_15, ascMod=0.902, mult=2.198
```

---

## FUTURE HOOKS (WEEKS 14–16)

### Week 14: Archetype-Driven Visual Effects

**Goal:** Use `archetypeEvolution.ascensionMultiplier` to enhance aura intensity.

**Expected Integration:**

```javascript
// In MythicAuraIntegration_v1 (modified in Week 14):
const ae = node.userData.archetypeEvolution;
if (ae) {
  // Boost aura intensity based on archetype multiplier
  const boostedIntensity = baseIntensity * ae.ascensionMultiplier;
  // Apply to NodeAuraSystem_v1 uniforms
}
```

**Visual Impact:**
- Sage nodes: steady, consistent glow
- Warlock nodes: dramatic spikes at high ascension
- Sentinel nodes: subtle, muted effects
- Empath nodes: responsive to network state
- Invoker nodes: pulsing, LFO-ready for animation
- Mythic nodes: transcendent, maximum intensity

### Week 15: Archetype-Based Color Palettes

**Goal:** Customize node/link colors per archetype tier progression.

**Expected Integration:**

```javascript
// Custom color palettes
const archetypeColors = {
  sage: ['#ccccff', '#8888ff', '#0088ff'],  // Blues
  warlock: ['#ff88cc', '#ff00ff', '#cc00ff'],  // Magentas
  sentinel: ['#cccccc', '#aaaaaa', '#888888'],  // Grays
  empath: ['#ccffcc', '#88ff00', '#00ff00'],  // Greens
  invoker: ['#ffffcc', '#ffff00', '#ffcc00'],  // Yellows
  mythic: ['#ffccff', '#ffff00', '#ffffff'],  // Transcendent
};

// Use nextTierProgress for smooth transitions
const colorIndex = Math.floor(ae.nextTierProgress * 2);
const targetColor = archetypeColors[ae.archetypeId][colorIndex];
```

### Week 16: Narrative Integration

**Goal:** Trigger archetype-specific story events on tier progression.

**Expected Integration:**

```javascript
// Mythic ritual triggers on Mythic tier (tier >= 3)
if (ae.tier >= 3 && node.userData.lastMythicEventTime < currentTime - 5) {
  this.narrativeEngine.triggerEvent({
    type: 'archetype_ascension',
    archetype: ae.archetypeId,
    tier: mythicState.tier,
    narrative: `${ae.archetypeName} ascends!`,
  });
  node.userData.lastMythicEventTime = currentTime;
}
```

---

## SUMMARY

**Week 13 delivers:**

✅ 6 personality-driven ascension curve profiles  
✅ Pure logic layer with no file modifications  
✅ Personality-influenced curve modulation  
✅ Smooth EMA + hysteresis smoothing  
✅ Tier-based multiplier boosts  
✅ Optional auto-assignment for convenience  
✅ <0.4ms performance budget  
✅ Clean integration API for Weeks 14–16  

**Next:** Week 14 will use `archetypeEvolution.ascensionMultiplier` to visually enhance auras and glow effects per archetype.

---

*Document Version: 1.0 | Week 13 | Phase 3C*
