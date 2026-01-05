# ATOMA CORE METRIC ARCHITECTURE — LOCKED & ENFORCEABLE

**Status**: FINAL ARCHITECTURAL LOCK — No further metric definitions permitted

**Date**: This Session

**Authority**: Principal Systems Architecture

**Scope**: 5 core stats, authority contracts, interpretation layer, Phase 9 design

---

## 🔴 CRITICAL NOTICE

This document defines PERMANENT game architecture.

No new stats may be added without explicit architectural review.

No metric may be redefined after this lock.

All future systems must read from this contract.

---

# PART I: CORE METRIC DEFINITIONS (LOCKED)

## 1️⃣ SYNERGY

### Semantic Definition
**Synergy represents structural efficiency and compatibility of network topology.**

- High synergy: well-matched node connections, efficient information flow, compatible archetypes
- Low synergy: mismatched nodes, wasted bandwidth, poor topology fit
- Synergy is NOT correlation or link quality (see Integrity)
- Synergy is NOT damage or entropy (see Corruption)

### Quantitative Range
- Range: [0.0, 1.0]
- 0.0 = completely incompatible topology
- 0.5 = neutral/balanced network
- 1.0 = perfectly optimized structure

### Authority
| Role | Permission | Details |
|------|-----------|---------|
| **SynergyEngine** | ✅ WRITE | Only system that mutates synergy |
| Corruption System | 🔵 READ | Uses synergy to modulate corruption rates |
| Harmony System | 🔵 READ | Uses synergy for regeneration efficiency |
| Rituals | 🔵 READ | Uses synergy to assess cluster viability |
| Interpretation Layer | 🔵 READ | Converts to visual signal |
| Visual Systems | 🔵 READ ONLY | Never write |

### Laws
```
❌ Visual systems may NOT mutate synergy
❌ Rituals may NOT mutate synergy
❌ Harmony may NOT mutate synergy
❌ Integrity calculations may NOT mutate synergy
✅ SynergyEngine only authority for mutations
```

### Inputs to SynergyEngine
- Link quality calculations
- Archetype compatibility
- Topological density
- Historical link stability

### Example Mutation
```javascript
// ✓ CORRECT
synergy = computeSynergyFromTopology(links, archetypes);
node.userData.synergy = synergy;

// ✗ WRONG
node.userData.synergy *= 0.9;  // NO: Outside SynergyEngine
node.userData.synergy += harmonyBonus;  // NO: Outside SynergyEngine
```

---

## 2️⃣ HARMONY

### Semantic Definition
**Harmony represents energetic stability and restorative potential of the network.**

- High harmony: stable, self-healing, regenerative potential
- Low harmony: depleted, fragile, limited healing capacity
- Harmony is NOT the absence of corruption (orthogonal dimensions)
- Harmony is NOT network stress or overload

### Quantitative Range
- Range: [0.0, 1.0]
- 0.0 = exhausted, no healing capacity
- 0.5 = moderate regeneration
- 1.0 = peak stability and restoration

### Authority
| Role | Permission | Details |
|------|-----------|---------|
| **HarmonySystem** | ✅ WRITE | Only authority for harmony mutations |
| Healing Logic | 🔵 READ | Determines healing rate |
| Corruption System | 🔵 READ | Modulates corruption accumulation |
| Rituals | 🔵 READ | Uses harmony for ritual costs |
| Interpretation Layer | 🔵 READ | Converts to visual signal |
| Visual Systems | 🔵 READ ONLY | Never write |

### Laws
```
❌ Healing logic may NOT directly mutate harmony
❌ Rituals may NOT directly mutate harmony
❌ Visual effects may NOT mutate harmony
✅ HarmonySystem has sole authority
✅ Harmony can REDUCE corruption (not negate it)
❌ Harmony can NEVER implicitly resurrect collapsed links
❌ Harmony can NEVER bypass integrity thresholds
```

### Example: Harmony-Assisted Healing
```javascript
// ✓ CORRECT: Healing respects integrity thresholds
harmonyFactor = node.userData.harmony;
baseHealingRate = 0.05;  // 5% per tick
actualHealing = baseHealingRate * harmonyFactor;

// Apply healing, but respect integrity minimum
link.userData.corruption = max(0, link.userData.corruption - actualHealing);

// Only rebuild links with integrity > threshold
if (link.userData.integrity > 0.3) {
  // Rebuild eligible
} else {
  // Integrity too low: harmony does NOT bypass this
}

// ✗ WRONG: Bypassing integrity rules
if (harmony > 0.7) {
  link.userData.collapsed = false;  // NO: Integrity must allow rebuild
}
```

---

## 3️⃣ CORRUPTION

### Semantic Definition
**Corruption represents entropy and destructive pressure on the network.**

- Corruption is NOT stress (separate dimension)
- Corruption is NOT load (separate dimension)
- Corruption is actual damage/entropy accumulation
- Corruption can be reduced by harmony/healing but not eliminated without action

### Quantitative Range
- Range: [0.0, 1.0]
- 0.0 = pristine, no entropy
- 0.5 = moderate damage
- 1.0 = maximum degradation (combined with low integrity → collapse)

### Authority
| Role | Permission | Details |
|------|-----------|---------|
| **CorruptionSystem** | ✅ WRITE | Only authority for corruption mutations |
| Integrity System | 🔵 READ | Combines with integrity to determine collapse |
| Healing System | 🔵 READ | Determines how much corruption to remove |
| Network Stress Calc | 🔵 READ | Contributes to stress calculation |
| Interpretation Layer | 🔵 READ | Converts to visual chaos signal |
| Visual Systems | 🔵 READ ONLY | Never write |

### Laws
```
❌ Visual effects may NOT mutate corruption
❌ Rituals may NOT directly mutate corruption
✅ Only CorruptionSystem mutates
✅ Healing system may REDUCE corruption via request to CorruptionSystem
✅ Corruption influences stress, not vice versa
```

### Collapse Rule (Non-Negotiable)
```javascript
// Links collapse when corruption + low integrity combine
collapseLikelihood = corruption * (1 - integrity);

// A link collapses when:
// High corruption (>0.7) AND low integrity (<0.3)
// OR explicit integrity degradation to 0

// Healing can reduce corruption but cannot prevent integrity-based collapse
```

### Example: Corruption Propagation
```javascript
// ✓ CORRECT: CorruptionSystem writes
updateCorruption(link, deltaTime) {
  // Inherent degradation
  baseDecay = 0.01 * deltaTime;
  
  // Stress-driven acceleration
  stressMultiplier = 1.0 + (networkStress * 2.0);
  
  corruption = link.userData.corruption + (baseDecay * stressMultiplier);
  corruption = clamp(corruption, 0, 1);
  
  link.userData.corruption = corruption;  // ✓ CorruptionSystem authority
}

// ✗ WRONG: Outside authority
link.userData.corruption *= 0.5;  // NO: Not CorruptionSystem
visualSystem.userData.corruption = 1.0;  // NO: Visual systems read-only
ritual.userData.corruption -= harmonyFactor;  // NO: Rituals read-only
```

---

## 4️⃣ INTEGRITY

### Semantic Definition
**Integrity represents existence and structural viability of links and nodes.**

- Governs collapse (integrity threshold = collapse event)
- Governs rebuild eligibility (must exceed threshold to rebuild)
- Integrity is binary in consequence but continuous in value
- Below threshold = cannot support link
- Above threshold = viable

### Quantitative Range
- Range: [0.0, 1.0]
- 0.0 = completely compromised (collapsed)
- 0.3 = minimum rebuild threshold
- 0.7 = normal operating range
- 1.0 = perfect structural integrity

### Authority
| Role | Permission | Details |
|------|-----------|---------|
| **IntegritySystem** | ✅ WRITE | Only authority for integrity mutations |
| Stress Calculator | 🔵 READ | Contributes to network stress |
| Corruption System | 🔵 READ | Combines with corruption for collapse |
| Rituals | 🔵 READ | Evaluates rebuild eligibility |
| Interpretation Layer | 🔵 READ | Converts to visual danger signal |
| Visual Systems | 🔵 READ ONLY | Never write |

### Laws
```
❌ No system may implicitly resurrect integrity
❌ Rebuild must be explicit and costly
❌ Healing may NOT write integrity directly
✅ Only IntegritySystem mutates
✅ Rituals can TRIGGER rebuilds (not write integrity)
✅ Collapse is PERMANENT until explicit rebuild
```

### Collapse Conditions (Irreversible)
```javascript
// Link collapses when ANY condition met:
if (integrity < 0.0) {
  link.collapsed = true;  // Explicit collapse
} else if (integrity < 0.3 && corruption > 0.7) {
  link.collapsed = true;  // Entropy cascade
} else {
  link.collapsed = false;  // Viable
}

// To rebuild: must explicitly trigger rebuild ritual
// Cost: significant harmony/synergy investment
// Prerequisite: integrity > 0.3
```

### Example: Integrity Degradation
```javascript
// ✓ CORRECT: IntegritySystem authority
degradeIntegrity(link, stressFactor, deltaTime) {
  // Stress accelerates degradation
  degradationRate = 0.02 * stressFactor;
  
  integrity = link.userData.integrity - (degradationRate * deltaTime);
  link.userData.integrity = clamp(integrity, 0, 1);  // ✓ Authority
  
  // Check collapse condition
  if (integrity < 0.3 && corruption > 0.7) {
    triggerCollapse(link);
  }
}

// ✗ WRONG
link.userData.integrity = 0.5;  // NO: Not IntegritySystem
healSystem.repairLink(link);  // NO: Healing doesn't mutate integrity
```

---

## 5️⃣ NETWORK STRESS (CRITICAL AUTHORITY)

### Semantic Definition (DEFINITIVE)
**Network Stress represents global and local computational/topological overload.**

Network Stress is NOT:
- ❌ Corruption (damage/entropy)
- ❌ Load (node capacity)
- ❌ Pressure (load ratio)
- ❌ Integrity (viability)

Network Stress IS:
- ✅ Emergent from topology density
- ✅ Aggregated from local overload
- ✅ Time-dependent with hysteresis
- ✅ COMPUTED (never directly set)

### Quantitative Range
- Range: [0.0, 1.0]
- 0.0 = perfectly balanced topology
- 0.5 = elevated stress, degradation starting
- 1.0 = critical overload, cascading failures

### Authority
| Role | Permission | Details |
|------|-----------|---------|
| **StressCalculator** | ✅ WRITE | Only authority for stress mutations |
| Barriers System | 🔵 READ | Gating/prevention logic |
| Rituals | 🔵 READ | Scaling difficulty |
| Corruption System | 🔵 READ | Accelerates corruption rate |
| Interpretation Layer | 🔵 READ | Converts to visual chaos intensity |
| Visual Systems | 🔵 READ ONLY | Never write |

### Laws (ABSOLUTE)
```
❌ Network Stress is NEVER manually mutated
❌ Network Stress is NEVER stored in wrong place
❌ Network Stress is NEVER confused with Load or Pressure
✅ ONLY StressCalculator has write authority
✅ ONLY computed from topology inputs
✅ Computation must include hysteresis (fast rise, slow decay)
```

### Inputs to StressCalculator
```javascript
const stressInputs = {
  // Topology density (local)
  activeLinkCount: links.length,           // Per-node and network-wide
  clusterDensity: computeClusteringCoeff(), // How tightly interconnected
  
  // Load conditions
  overloadedNodeCount: countNodesOverCapacity(),
  pressureHotspots: findHighPressureZones(),
  
  // Integrity threats
  lowIntegrityLinkCount: countLow(<0.3),
  collapsedLinkCount: countCollapsed(),
  
  // Dynamics
  topologyChurnRate: recentLinkChangeRate(),
  linkFailureFrequency: failuresInTimeWindow()
};
```

### Hysteresis Model (REQUIRED)
```javascript
// Fast rise: stress responds immediately to load
riseRate = 0.5;  // Can increase 50% per second
stressNew = min(1.0, stress + (delta * riseRate));

// Slow decay: stress persists (represents inertia)
decayRate = 0.05;  // Decays 5% per second when no load
stressNew = max(stressNew, stress * (1 - decayRate));

// Result: Stress spikes quickly, lingers, recovers slowly
// This models thermal/computational momentum
```

### Example: Stress Computation
```javascript
// ✓ CORRECT: StressCalculator authority
computeNetworkStress(nodes, links) {
  // Gather inputs
  const activeLinkCount = links.filter(l => !l.collapsed).length;
  const avgClusterDensity = computeAverageClusteringCoeff(nodes, links);
  const overloadCount = nodes.filter(n => n.activeLinks > n.loadCapacity).length;
  const lowIntegrityCount = links.filter(l => l.userData.integrity < 0.3).length;
  
  // Compute raw stress (0-1)
  const densityStress = min(1.0, activeLinkCount / (nodes.length * 4));
  const overloadStress = overloadCount / nodes.length;
  const integrityStress = lowIntegrityCount / links.length;
  
  const rawStress = (densityStress * 0.4) + (overloadStress * 0.4) + (integrityStress * 0.2);
  
  // Apply hysteresis
  const riseRate = 0.5;
  const newStress = min(1.0, this.lastStress + (rawStress - this.lastStress) * riseRate);
  const decayedStress = newStress * 0.95;  // Slow decay
  
  const finalStress = max(decayedStress, min(1.0, newStress));
  this.lastStress = finalStress;
  
  return finalStress;  // ✓ Computed, not set
}

// WRITE to global stress (StressCalculator authority)
globalNetworkStress = computeNetworkStress(nodes, links);

// ✗ WRONG
networkStress = 0.5;  // NO: Never directly set
networkStress *= 0.9;  // NO: Never mutated outside calculator
```

---

# PART II: LOAD & PRESSURE DECISION (FINAL)

## ⚙️ LOAD (NODE ARCHETYPE PROPERTY)

### Definition
**Load is per-node connection capacity based on archetype/class.**

### Quantitative Range
- Per-node property
- Range: [1, 16] connections (typical)
- Varies by archetype (Neural, Dense, Relay, etc.)
- Static or very slow-changing

### Authority
| Role | Permission |
|------|-----------|
| Node initialization | ✅ SET (once) |
| Archetype system | ✅ DEFINE |
| Stress calculator | 🔵 READ |
| Barriers | 🔵 READ |
| Interpretation layer | 🔵 READ |

### Storage
```javascript
node.userData.loadCapacity = 4;  // Static per archetype
```

### Usage
```javascript
// Used to evaluate overload
isPressured = node.activeLinks > node.userData.loadCapacity;
pressureRatio = node.activeLinks / node.userData.loadCapacity;

// Contributes to Network Stress calculation
overloadFactor = countPressuredNodes() / totalNodes;
```

---

## 🔌 PRESSURE (DERIVED ONLY — NOT A STAT)

### Definition
**Pressure is a derived signal representing load-to-capacity ratio.**

Pressure is NOT stored.
Pressure is NOT a stat.
Pressure is COMPUTED on demand.

### Formula
```javascript
pressurePerNode = activeLinks / loadCapacity;
pressureRange = [0, inf];  // Can exceed 1.0 when overloaded
```

### Where Pressure Is Used
```javascript
// 1. Network Stress contribution (input)
pressureContribution = averagePressure * 0.3;  // Part of stress formula

// 2. Corruption acceleration (input)
corruptionMultiplier = 1.0 + (pressure * 2.0);  // Overload speeds corruption

// 3. Barrier eligibility (input)
canBarrier = pressure > 0.8;  // Only apply barrier if overloaded
```

### What Pressure Is NOT Used For
```javascript
❌ Stored in userData
❌ Visualized directly
❌ Written by any system
❌ Treated as persistent stat
```

### Example: Correct Pressure Usage
```javascript
// ✓ CORRECT: Computed on demand
for (const node of nodes) {
  const pressure = node.activeLinks / node.userData.loadCapacity;
  stressFromPressure += pressure * 0.1;  // Contributes to stress
}

// ✗ WRONG: Treating pressure as stat
node.userData.pressure = pressure;  // NO: Never store
globalPressure = sum(pressures) / nodeCount;  // NO: Derived, not stored
barrier.triggerAt(node.userData.pressure);  // NO: Compute on demand
```

---

# PART III: STAT AUTHORITY CONTRACT (ENFORCEABLE)

## 📋 AUTHORITY TABLE (SINGLE SOURCE OF TRUTH)

| Stat | Write Authority | Mutation Allowed | Read Consumers | Forbidden |
|------|-----------------|-----------------|---|---|
| **Synergy** | SynergyEngine | ✅ Yes (algorithm) | Corruption, Harmony, Rituals, Visuals | Visual write, Ritual write, Implicit mutation |
| **Harmony** | HarmonySystem | ✅ Yes (algorithm) | Healing, Corruption, Rituals, Visuals | Healing direct write, Ritual direct write |
| **Corruption** | CorruptionSystem | ✅ Yes (algorithm) | Integrity, Healing, StressCalc, Visuals | Visual write, Ritual write, Healing direct write |
| **Integrity** | IntegritySystem | ✅ Yes (algorithm) | StressCalc, Rituals, Visuals | Implicit resurrection, Healing direct write, Visual write |
| **Network Stress** | StressCalculator | ✅ Yes (computed) | Barriers, Rituals, Visuals | Manual mutation, Direct assignment, Visual write |

## 🔒 GLOBAL AUTHORITY RULES (NON-NEGOTIABLE)

### Rule 1: Single Writer Per Stat
```
Each stat has exactly one system with write authority.
No stat may be written by multiple systems.
No exceptions, no workarounds.
```

### Rule 2: Visual Systems Are Read-Only
```
Visual systems may READ any core stat.
Visual systems may NOT WRITE any core stat.
Visual systems may NOT mutate derived values into stat storage.
Visual systems may only consume interpretation layer signals.
```

### Rule 3: Rituals Are Read-Only
```
Rituals may READ core stats for decision-making.
Rituals may NOT WRITE core stats.
Rituals may orchestrate ACTIONS (rebuilds, cascades).
Rituals may NOT directly mutate game state.
```

### Rule 4: No Derived Values Overwrite Core Stats
```
Interpretation layer produces *_Visual signals.
These signals are SEPARATE from core stats.
No visual interpretation may write back to userData.corruption, etc.
```

### Rule 5: No Implicit Mutations
```
Every stat mutation must be explicit code in the write authority.
No stat may change as side effect of other operations.
No stat may be implicitly modified through calculation chains.
```

---

## 🔐 ENFORCEMENT MECHANISM

### Compile-Time Audit (Per-System)
```javascript
// In each system file, declare write authority
export const StatWriteAuthority = {
  synergy: 'SynergyEngine',
  harmony: 'HarmonySystem',
  corruption: 'CorruptionSystem',
  integrity: 'IntegritySystem',
  networkStress: 'StressCalculator'
};

// Audit tool checks no unauthorized writes
const unauthorizedWrites = grep(/node\.userData\.(synergy|harmony|corruption|integrity|networkStress)\s*=/)
  .filter(file => !isInAuthorizedSystem(file));
```

### Runtime Validation
```javascript
// CoreMetricAuthority: Monitor and enforce at runtime
class CoreMetricAuthority {
  constructor() {
    this.writeCount = {};
    this.writeLocations = {};
  }
  
  validateWrite(metric, writer, value) {
    const authorized = {
      synergy: 'SynergyEngine',
      harmony: 'HarmonySystem',
      corruption: 'CorruptionSystem',
      integrity: 'IntegritySystem',
      networkStress: 'StressCalculator'
    };
    
    if (authorized[metric] !== writer) {
      console.error(`[AUTHORITY VIOLATION] ${metric} written by ${writer} (authorized: ${authorized[metric]})`);
      throw new Error(`Unauthorized stat write: ${metric}`);
    }
    
    this.writeCount[metric] = (this.writeCount[metric] || 0) + 1;
    this.writeLocations[metric] = new Error().stack;
  }
}
```

---

# PART IV: METRIC INTERPRETATION LAYER (BINDING SPEC)

## Purpose
Convert authoritative game stats into stable, perceptually meaningful visual signals.

## Principle
Interpretation layer does NOT modify gameplay.
Interpretation layer produces READ-ONLY derived signals.
Visual systems consume derived signals, never raw stats.

## Core Signal Mapping

### Synergy → synergyVisual (0–1)
```
Input: node.userData.synergy ∈ [0, 1]

Transformation:
1. Normalize: v_norm = synergy
2. Smooth: v_smooth = EMA(v_norm, α=0.2)
3. Interpret: v_visual = smoothstep(0.2, 0.8, v_smooth)
4. Clamp: synergyVisual = clamp(v_visual, 0, 1)

Output: node.userData.visualSynergy ∈ [0, 1]
Meaning: Resonance glow intensity, bond strength feedback
```

### Harmony → harmonyAuraStrength (0–1)
```
Input: node.userData.harmony ∈ [0, 1]

Transformation:
1. Breathing frequency: f = 1.2 Hz
2. Phase: φ = (time * 2π * f) mod 2π
3. Oscillation: osc = sin(φ)
4. Aura base: base = harmony * 1.0
5. Breathing: aura = 0.3 + (base * 0.7) + (osc * 0.1 * harmony)
6. Smooth: v_smooth = EMA(aura, α=0.2)

Output: node.userData.visualHarmonyAura ∈ [0, 1]
Meaning: Aura opacity, pulsing intensity
```

### Corruption → corruptionChaosIntensity (0–1)
```
Input: node.userData.corruption ∈ [0, 1]

Transformation:
1. Band mapping:
   - [0.0, 0.2]: minimal chaos (linear 0→0.1)
   - [0.2, 0.5]: moderate chaos (linear 0.1→0.4)
   - [0.5, 0.8]: severe chaos (linear 0.4→0.8)
   - [0.8, 1.0]: maximum chaos (linear 0.8→1.0)
2. Smooth: v_smooth = EMA(band_map, α=0.2)

Output: node.userData.visualCorruptionChaos ∈ [0, 1]
Meaning: Distortion amount, artifact density, visual noise
```

### Integrity → integrityHealthIndicator (0–1, INVERSE)
```
Input: node.userData.integrity ∈ [0, 1]

Transformation:
1. Invert: v_danger = 1.0 - integrity
2. Band mapping (danger zones):
   - [0.0, 0.3]: safe (green, 1.0→0.0)
   - [0.3, 0.6]: caution (yellow, 0.0→0.5)
   - [0.6, 1.0]: danger (red, 0.5→1.0)
3. Smooth: v_smooth = EMA(band_map, α=0.2)

Output: node.userData.visualIntegrityDanger ∈ [0, 1]
Meaning: Health bar color (0=safe, 1=critical), warning intensity
```

### NetworkStress → stressVisualChaos (0–1, NON-LINEAR)
```
Input: networkStress ∈ [0, 1]

Transformation:
1. Power curve: v_chaos = pow(networkStress, 1.4)
2. Smooth: v_smooth = EMA(v_chaos, α=0.15)  // Slower smoothing for world mood
3. Artifact density: density = v_smooth * 1.0

Output: window.__ATOMA_METRICS.stressVisualization ∈ [0, 1]
Meaning: Environmental chaos, jitter amount, particle density, world instability
```

### Composite: nodeVitalityScore (0–1)
```
Input: corruption, integrity, harmony, synergy ∈ [0, 1]

Transformation:
vitality = 0.5 +
  (-0.3 * corruption) +
  (0.4 * integrity) +
  (0.2 * harmony) +
  (0.1 * synergy)

vitality = clamp(vitality, 0, 1)

Output: node.userData.visualVitality ∈ [0, 1]
Meaning: Overall node health, color scheme (red/yellow/green)
```

### Composite: networkMood (−1 to +1)
```
Input: All nodes' metrics

Transformation:
avgCorruption = mean(corruption across nodes)
avgHealth = mean(vitality across nodes)

mood = (avgHealth * 2 - 1) - (avgCorruption * 0.5)
mood = clamp(mood, -1, 1)

Output: window.__ATOMA_METRICS.networkMood ∈ [-1, +1]
Meaning: World mood (critical→thriving), ambient music intensity, environment tone
```

---

## Visual Signal Output Contract

### What Exists
```javascript
// Per-node signals (written to node.userData)
node.userData.visualSynergy              ∈ [0, 1]
node.userData.visualHarmonyAura          ∈ [0, 1]
node.userData.visualCorruptionChaos      ∈ [0, 1]
node.userData.visualIntegrityDanger      ∈ [0, 1]
node.userData.visualVitality             ∈ [0, 1]

// Network-level signals (global)
window.__ATOMA_METRICS.stressVisualization ∈ [0, 1]
window.__ATOMA_METRICS.networkMood       ∈ [-1, +1]
```

### What Visual Systems Read
```javascript
// ✓ CORRECT: Consume visual signals
const glowIntensity = node.userData.visualSynergy;
const auraOpacity = node.userData.visualHarmonyAura;
const distortionAmount = node.userData.visualCorruptionChaos;

// ✗ WRONG: Never read raw stats for visual scaling
const glowIntensity = node.userData.synergy;  // NO: Use visual signal
const distortion = node.userData.corruption * 2.0;  // NO: Use visual signal
```

---

# PART V: STRESS ANCHORS (PHASE 9 DESIGN)

## Concept (NON-BREAKING STABILIZATION)

**Stress Anchors are emergent cooperative zones that REDUCE stress propagation without modifying any core stats.**

Anchors are:
- ✅ Passive (no player interaction)
- ✅ Read-only (never write stats)
- ✅ Emergence-based (arise from local conditions)
- ✅ Self-healing (dissolve naturally)

Anchors are NOT:
- ❌ Objects or entities
- ❌ New stats
- ❌ Direct heals or buffs
- ❌ Exceptions to collapse rules

---

## Activation Conditions (Trigger When ALL Met)

An anchor zone emerges in a local cluster when:

```javascript
// Condition 1: Cluster stability (integrity-based)
avgIntegrity = mean(nodes in cluster).integrity;
const hasHighIntegrity = avgIntegrity > 0.7;

// Condition 2: Moderate harmony (energy available)
avgHarmony = mean(nodes in cluster).harmony;
const hasModerateHarmony = avgHarmony > 0.5;

// Condition 3: Low local pressure (capacity available)
avgPressure = mean(node.activeLinks / node.loadCapacity);
const hasLowPressure = avgPressure < 0.7;

// Condition 4: Stable topology (no recent churn)
topologyChangeRate = countTopologyChangesInTimeWindow(300ms) / timeWindow;
const isStable = topologyChangeRate < 0.05;

// Anchor activates when ALL conditions true
if (hasHighIntegrity && hasModerateHarmony && hasLowPressure && isStable) {
  activateAnchor(cluster);
}
```

---

## Effects (STRICTLY LIMITED)

### What Anchors Can Affect
```javascript
// Reduce local stress contribution
stressFromCluster *= 0.7;  // 30% local stress reduction

// Slow stress propagation (increase decay near anchor)
stressDecayRate *= 1.5;  // Faster stress dissipation locally

// Increase local overload tolerance
effectiveLoadCapacity *= 1.1;  // 10% load capacity boost locally
```

### What Anchors CANNOT Affect
```
❌ Cannot heal corruption
❌ Cannot modify integrity
❌ Cannot mutate harmony or synergy
❌ Cannot implicitly resurrect collapsed links
❌ Cannot bypass collapse conditions
❌ Cannot write to any core stat
```

---

## Cooperative Nature (Multi-Node Requirement)

### Solo Node (NO ANCHOR)
```javascript
if (nodes in cluster.length === 1) {
  // Single node cannot form anchor
  // Must have group for cooperation benefit
}
```

### Two Nodes (WEAK ANCHOR)
```javascript
if (nodes in cluster.length === 2) {
  // Minimal anchor effect
  stressReduction = 0.05;  // 5% only
}
```

### Three+ Nodes (FULL ANCHOR)
```javascript
if (nodes in cluster.length >= 3) {
  // Full effect available
  stressReduction = 0.30;  // 30% reduction
}
```

---

## Visualization (DERIVED ONLY)

Anchor presence is visualized ONLY through interpretation layer, never through new effects:

```javascript
// Visual manifestations of anchors (interpretation layer computed)
smootherLinkMotion = interpretationLayer.computeSmoothness(networkStress, anchorPresence);
reducedChaosDensity = visualCorruptionChaos * (1.0 - anchorStabilization);
calmNetworkFlow = smoothLinearMotion;  // vs. jittery motion under stress

// ALL visual changes derived from stress reduction
// No new particle systems, shaders, or visual objects
```

---

## Natural Dissolution

Anchors dissolve when ANY condition degrades:

```javascript
// Per-frame check
if (!isAnchorMaintained()) {
  decayAnchor(cluster);
  
  // Anchor effect fades over 5 seconds
  anchorStrength *= 0.95;  // Per-frame decay
  
  // Full dissolution when strength ≈ 0
}
```

---

## Phase 9 Integration (Deferred)

Stress Anchors are DESIGN ONLY for Phase 9.

No code implementation at this time.

Design locked for future implementation.

---

# PART VI: HARD CONSTRAINTS (ABSOLUTE)

## ❌ Forbidden Forever

```
❌ No new stats after this lock
❌ No stat redefinition after this lock
❌ No legacy metric resurrection
❌ No visual systems writing logic (read-only only)
❌ No bypassing integrity rules
❌ No implicit stat mutations
❌ No manual Network Stress assignment
❌ No confusing Load/Pressure with stats
```

## ✅ Required Forever

```
✅ SynergyEngine has sole Synergy authority
✅ HarmonySystem has sole Harmony authority
✅ CorruptionSystem has sole Corruption authority
✅ IntegritySystem has sole Integrity authority
✅ StressCalculator has sole Network Stress authority
✅ Interpretation layer is the ONLY source of visual signals
✅ All visual systems are read-only
✅ All rituals are read-only
```

---

# FINAL ACCEPTANCE CRITERIA ✅

This architectural lock is COMPLETE when ALL criteria verified:

## Semantic Clarity
- ✅ All 5 core stats have unambiguous definitions
- ✅ No two stats have overlapping meanings
- ✅ Every stat has single authority (verified in contract table)
- ✅ Load and Pressure are correctly distinguished

## Authority Enforcement
- ✅ Authority table published and locked
- ✅ Write-authority verified per stat
- ✅ Visual systems confirmed read-only
- ✅ Rituals confirmed read-only
- ✅ No implicit mutations possible

## Interpretation Clarity
- ✅ Each core stat has visual signal mapping
- ✅ Visual signals derived, never raw stats
- ✅ All signals normalized to appropriate ranges
- ✅ Smoothing behavior specified
- ✅ No feedback loops possible

## Phase 9 Design
- ✅ Stress Anchors designed without new stats
- ✅ Anchors confirmed read-only
- ✅ Anchor effects limited to stress propagation
- ✅ Design locked for implementation

## Documentation
- ✅ All definitions documented
- ✅ All authority contracts documented
- ✅ All visual mappings documented
- ✅ All hard constraints documented
- ✅ Single source of truth established

---

# ENFORCEMENT PROCESS

## At Code Review Time
```
For ANY change that touches core metrics:
1. Verify stat is being written by sole authority
2. Verify no unauthorized stat reads in visual systems
3. Verify no new stats introduced
4. Verify interpretation layer signals used, not raw stats
5. Flag any rule violations
```

## At Runtime
```
Deploy CoreMetricAuthority monitor:
- Track all stat writes
- Identify unauthorized writers
- Log authority violations
- Alert on new stats
- Enforce immutability
```

## At Documentation Time
```
Maintain this lock document:
- No stat redefinitions permitted
- No new stats added without architectural review
- All changes reference this lock
- All decisions traceable to authority contract
```

---

# CONTACTS & APPROVALS

| Role | Status | Authority |
|------|--------|-----------|
| **Metric Definitions** | ✅ LOCKED | Core Architecture |
| **Authority Contract** | ✅ LOCKED | Systems Design |
| **Interpretation Layer** | ✅ LOCKED | Visual Architecture |
| **Phase 9 Design** | ✅ LOCKED | Advanced Systems |
| **Enforcement** | ✅ ACTIVE | Runtime Monitor |

---

# VERSION CONTROL

| Version | Date | Change | Authority |
|---------|------|--------|-----------|
| 1.0 | This Session | Initial Lock | Principal Architecture |

**No further versions permitted without new architectural lock.**

---

**DOCUMENT STATUS: LOCKED ✅**

**This is the single source of truth for all game metrics.**

**All future systems must comply with this contract.**

**No exceptions, no workarounds, no informal deviations.**
