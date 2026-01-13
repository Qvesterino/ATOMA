# ATOMA Canonical Visual Template Library

**Status**: 🟢 LOCKED & ENFORCED

**Authority**: Principal Visual Architecture

**Scope**: Three canonical visual templates for metric-driven effects

**Validity**: All future visual systems MUST conform to these templates

---

## Overview

This document defines the **only approved patterns** for how visual systems consume derived metric signals from ATOMA's core architecture.

Three canonical templates are defined:
1. **Synergy Glow Template** (structural quality communication)
2. **Harmony Aura Template** (stability/healing potential)
3. **Network Stress Turbulence Template** (environmental overload)

All visual systems must conform to these templates.

No visual system may deviate from these patterns without architectural review.

---

# TEMPLATE 1: SYNERGY GLOW (CANONICAL)

## Purpose
**Communicate structural quality and connection efficiency to the player.**

High synergy = efficient, well-matched links
Low synergy = struggling, mismatched connections
Synergy glow is calm, continuous, non-reactive.

## Metric Input Contract

### Input Signal (READ-ONLY DERIVED)
```javascript
// Source: MetricInterpretationLayer_v1
link.userData.visualSynergy  // Range: [0, 1]
                             // 0 = poor structure
                             // 1 = perfect structure
```

### Input Characteristics
- ✅ Smooth, normalized [0, 1]
- ✅ EMA pre-smoothed (α=0.2)
- ✅ Never spikes (only gradual transitions)
- ✅ Reflects topology quality, not events

### Forbidden Input Access
```javascript
// ✗ WRONG: Never read raw stat
link.userData.synergy  // NO: Use visualSynergy

// ✗ WRONG: Never read other visual signals
node.userData.visualCorruptionChaos  // NO: Synergy template doesn't mix signals

// ✗ WRONG: Never compute from raw stats
const syn = computeSynergyScore(links);  // NO: Use pre-computed signal
```

---

## Interpretation Rules

### Normalization
```javascript
// Input already normalized [0, 1] from interpretation layer
// Directly usable without further scaling

const synergyFactor = link.userData.visualSynergy;  // Already 0-1
```

### Smoothing / Easing
```javascript
// Synergy glow uses additional temporal smoothing
// To prevent rapid oscillations from jittery synergy calculations

const alpha = 0.15;  // Secondary smoothing (slightly faster than metrics layer)
this.glowIntensity += (targetIntensity - this.glowIntensity) * alpha * deltaTime * 60;
```

### Threshold vs Continuous
```javascript
// CONTINUOUS BEHAVIOR (no hard thresholds)
// Synergy glow is proportional across entire range

glowBrightness = synergyFactor * 2.0;  // Maps [0, 1] → [0, 2] brightness
glowOpacity = 0.3 + (synergyFactor * 0.7);  // Maps [0, 1] → [0.3, 1.0] opacity

// NOT THRESHOLD-BASED
// ✗ if (synergy > 0.7) { glow = intense; }  // WRONG: Creates pop/flicker
```

---

## Visual Semantics

### What The Glow Communicates
- ✅ Link is efficient/well-matched (high synergy)
- ✅ Link is struggling/mismatched (low synergy)
- ✅ Network topology is optimizing (smooth transitions)
- ✅ Player's link decisions are paying off (high glow = good choices)

### What It Must NEVER Communicate
```
❌ Link is broken/collapsed (that's integrity's job)
❌ Link is taking damage (that's corruption's job)
❌ Link needs healing (that's harmony's job)
❌ Network is overloaded (that's stress's job)
```

---

## Implementation Semantics

### Visual Style
- **Glow Quality**: Emissive, resonant, professional
- **Color Palette**: Cool whites, cyan-blue accents (efficiency signals)
- **Motion**: Slow, calm, breathing quality
- **Intensity Range**: [0%, 100%] of link brightness

### Glow Characteristics
```javascript
// Per-link glow properties
glowColor: THREE.Color(0x00FFFF);        // Cyan-blue (efficiency/harmony)
glowOpacity: 0.3 + (synergy * 0.7);      // [0.3, 1.0]
glowBrightness: synergy * 2.0;           // [0, 2] emissive multiplier
glowBlur: 0.5;                           // Soft feathering
glowPulseStrength: synergy * 0.1;        // Gentle 1.2 Hz breathing
```

### Glow Motion
```javascript
// Synergy glow breathes gently to indicate stability
breathePhase = (time * 1.2) % (2 * Math.PI);  // 1.2 Hz, slow
breatheAmplitude = 0.05;  // ±5% intensity modulation
pulseIntensity = glowIntensity * (1.0 + (sin(breathePhase) * breatheAmplitude));

// High synergy = steady, strong glow
// Low synergy = weak, shallow breathing
```

---

## Forbidden Behaviors

### ✗ Anti-patterns (Explicitly Forbidden)

```javascript
// WRONG: Event-driven spikes
if (linkCreated) {
  glow.brightness = 1.0;  // Spike effect
  // This violates continuous, calm semantics
}

// WRONG: Reading raw synergy
glow.opacity = link.userData.synergy * 0.5;  // NO: Use visualSynergy

// WRONG: Mixing with other metrics
glow.color = getMixedColor(synergy, corruption, stress);  // NO: Pure synergy only

// WRONG: Writing back to node
node.userData.synergyVisualIntensity = glow.intensity;  // NO: Read-only

// WRONG: Mutation of stat
link.userData.synergy = glow.brightness;  // ABSOLUTELY NO: Never write stats

// WRONG: Event-triggered behavior
if (synergy > threshold) {
  triggerParticleSpray();  // NO: Glow doesn't trigger gameplay events
}

// WRONG: Threshold-based pop
glowIntensity = synergy > 0.5 ? 1.0 : 0.3;  // NO: Causes visible popping

// WRONG: Non-linear saturation mapping
glowBrightness = pow(synergy, 3.0);  // NO: Use linear or smoothstep

// WRONG: Feedback to gameplay
if (glow.brightness > 0.8) {
  increasePlayerDamage();  // NO: Visuals never affect gameplay
}
```

---

## Reference Implementation

```javascript
/**
 * Synergy Glow Template (Canonical Reference)
 * 
 * Consumes: link.userData.visualSynergy (derived metric)
 * Produces: Visual glow effect on links
 * Pattern: Read-only, smooth, continuous
 */
class SynergyGlowEffect {
  constructor(link, material) {
    this.link = link;
    this.material = material;
    this.smoothedIntensity = 0;
    this.lastUpdateTime = 0;
  }
  
  update(deltaTime) {
    // 1. READ ONLY: Derived metric signal
    const synergySignal = this.link.userData.visualSynergy;  // ✓ Correct
    
    // 2. COMPUTE: Target values from signal
    const targetIntensity = 0.3 + (synergySignal * 0.7);  // [0.3, 1.0]
    const targetBrightness = synergySignal * 2.0;        // [0, 2]
    
    // 3. SMOOTH: Temporal smoothing for visual stability
    const alpha = 0.15;  // Secondary smoothing
    this.smoothedIntensity += (targetIntensity - this.smoothedIntensity) * alpha;
    
    // 4. APPLY: To shader uniforms (no game state mutation)
    this.material.uniforms.glowIntensity.value = this.smoothedIntensity;
    this.material.uniforms.glowBrightness.value = targetBrightness;
    
    // 5. BREATHING: Gentle temporal motion
    const breathePhase = (Date.now() * 0.001 * 1.2) % (2 * Math.PI);
    const breatheModulation = 1.0 + (Math.sin(breathePhase) * 0.05);
    this.material.uniforms.glowPulse.value = breatheModulation;
    
    // ✓ Never write to link.userData
    // ✓ Never read link.userData.synergy (raw stat)
    // ✓ Never trigger events
    // ✓ Never modify game logic
  }
}
```

---

# TEMPLATE 2: HARMONY AURA (CANONICAL)

## Purpose
**Communicate stability, healing potential, and protective presence.**

High harmony = strong protective field, high healing potential
Low harmony = depleted, fragile, minimal stabilization
Harmony aura is soft, calming, protective.

## Metric Input Contract

### Input Signal (READ-ONLY DERIVED)
```javascript
// Source: MetricInterpretationLayer_v1
node.userData.visualHarmonyAura  // Range: [0, 1]
                                 // 0 = exhausted
                                 // 1 = peak stability
```

### Input Characteristics
- ✅ Pre-smoothed with breathing oscillation (1.2 Hz)
- ✅ Normalized [0, 1]
- ✅ Reflects energetic stability, not damage
- ✅ Already includes subtle temporal animation

### Forbidden Input Access
```javascript
// ✗ WRONG: Never read raw harmony
node.userData.harmony  // NO: Use visualHarmonyAura

// ✗ WRONG: Never read corruption or stress
node.userData.visualCorruptionChaos  // NO: Aura is pure harmony
node.userData.visualNetworkStressDensity  // NO: Different semantic

// ✗ WRONG: Never compute healing effects
const healingRate = node.userData.harmony * 0.05;  // NO: Use visual signal
```

---

## Interpretation Rules

### Normalization
```javascript
// Input already normalized [0, 1] from interpretation layer
// Input includes breathing oscillation at 1.2 Hz
// Use directly without modification

const harmonySignal = node.userData.visualHarmonyAura;  // [0, 1]
```

### Smoothing / Easing
```javascript
// Harmony aura has INTRINSIC breathing (already in signal)
// Apply minimal additional smoothing (only for material transitions)

const alpha = 0.08;  // Very slow smoothing (preserve breathing)
this.auraOpacity += (targetOpacity - this.auraOpacity) * alpha * deltaTime * 60;
```

### Threshold vs Continuous
```javascript
// CONTINUOUS BEHAVIOR (smooth gradient)
// Harmony aura strength proportional to signal

auraOpacity = harmonySignal;           // Direct mapping [0, 1]
auraRadius = 1.0 + (harmonySignal * 0.5);  // Maps [1.0, 1.5]
auraGlow = 0.5 + (harmonySignal * 0.5);    // Maps [0.5, 1.0]

// NOT THRESHOLD-BASED
// ✗ if (harmony > 0.6) { aura = strong; }  // WRONG: Visible pop
```

---

## Visual Semantics

### What The Aura Communicates
- ✅ Node has healing/stabilization potential (high harmony)
- ✅ Node is depleted/fragile (low harmony)
- ✅ Protective field strength (aura size/opacity)
- ✅ Network is self-sustaining (stable breathing motion)

### What It Must NEVER Communicate
```
❌ Node is damaged/corrupted (that's corruption's job)
❌ Node is overloaded (that's stress's job)
❌ Node is isolated/weak (that's integrity's job)
❌ Node is performing healing action (that's gameplay, not visual)
```

---

## Implementation Semantics

### Visual Style
- **Aura Quality**: Soft, protective, calming
- **Color Palette**: Warm whites, golden-amber accents
- **Motion**: Slow breathing (1.2 Hz, intrinsic to signal)
- **Shape**: Spherical envelope, soft edges
- **Opacity**: Proportional to harmony (never opaque)

### Aura Characteristics
```javascript
// Per-node aura properties
auraColor: THREE.Color(0xFFEEAA);        // Warm golden-white
auraOpacity: harmonySignal;              // Direct [0, 1] mapping
auraRadius: 1.0 + (harmonySignal * 0.5); // [1.0, 1.5]
auraGlowStrength: 0.5 + (harmonySignal * 0.5);  // [0.5, 1.0]
auraSoftness: 1.5;  // Soft falloff (feathered edges)
```

### Aura Motion
```javascript
// Harmony aura breathing is INTRINSIC to the signal
// The interpretation layer already provides:
//   breathePhase = (time * 2π * 1.2) mod 2π
//   oscillation = sin(breathePhase)
//   signal = baseStrength + (oscillation * 0.1 * harmony)

// Apply the pre-computed breathing directly
auraOpacity = harmonySignal;  // Breathing already included

// Optional subtle material pulsing (separate from breathing)
materialPulse = 1.0 + (sin(breathePhase) * 0.02);  // ±2% modulation only
```

---

## Forbidden Behaviors

### ✗ Anti-patterns (Explicitly Forbidden)

```javascript
// WRONG: Reading raw harmony
aura.opacity = node.userData.harmony * 1.5;  // NO: Use visualHarmonyAura

// WRONG: Mixing harmony with corruption
if (harmony > 0.5 && corruption < 0.3) {
  aura.color = mixed;  // NO: Pure harmony signal only
}

// WRONG: Aura triggering healing
if (aura.opacity > 0.7) {
  healNearbyLinks();  // NO: Visuals never drive gameplay
}

// WRONG: Writing back to node
node.userData.harmonyVisualStrength = aura.opacity;  // NO: Read-only

// WRONG: Mutation of stat
node.userData.harmony = aura.strength;  // ABSOLUTELY NO

// WRONG: Event-driven changes
if (linkCreated) {
  aura.pulse();  // NO: Only continuous breathing
}

// WRONG: Multiple-signal mixing
aura.color = blendColors(harmony, synergy, integrity);  // NO: Pure harmony

// WRONG: Threshold-based appearance
aura.visible = harmony > 0.3;  // NO: Always visible, just scale strength

// WRONG: Feedback loop
if (aura.strong) {
  node.userData.harmony += 0.01;  // ABSOLUTELY NO: Never write stats
}
```

---

## Reference Implementation

```javascript
/**
 * Harmony Aura Template (Canonical Reference)
 * 
 * Consumes: node.userData.visualHarmonyAura (derived metric)
 * Produces: Visual aura/halo effect around nodes
 * Pattern: Read-only, breathing, protective
 */
class HarmonyAuraEffect {
  constructor(node, auraMesh, material) {
    this.node = node;
    this.auraMesh = auraMesh;
    this.material = material;
    this.smoothedOpacity = 0;
  }
  
  update(deltaTime) {
    // 1. READ ONLY: Derived metric signal (includes breathing)
    const harmonySignal = this.node.userData.visualHarmonyAura;  // ✓ [0, 1]
    
    // 2. COMPUTE: Target values from signal
    const targetOpacity = harmonySignal;           // Direct mapping
    const targetRadius = 1.0 + (harmonySignal * 0.5);  // [1.0, 1.5]
    const targetGlow = 0.5 + (harmonySignal * 0.5);    // [0.5, 1.0]
    
    // 3. SMOOTH: Minimal smoothing (preserve intrinsic breathing)
    const alpha = 0.08;
    this.smoothedOpacity += (targetOpacity - this.smoothedOpacity) * alpha;
    
    // 4. APPLY: To aura geometry and material
    this.auraMesh.scale.set(targetRadius, targetRadius, targetRadius);
    this.material.uniforms.auraOpacity.value = this.smoothedOpacity;
    this.material.uniforms.glowStrength.value = targetGlow;
    
    // ✓ Breathing oscillation already in signal
    // ✓ Never write to node.userData
    // ✓ Never read node.userData.harmony (raw stat)
    // ✓ Never trigger events or gameplay
  }
}
```

---

# TEMPLATE 3: NETWORK STRESS TURBULENCE (CANONICAL)

## Purpose
**Communicate environmental overload and topology tension.**

High stress = network struggling, turbulent, chaotic
Low stress = network calm, organized, flowing
Stress turbulence is dynamic, unsettling, warning.

## Metric Input Contract

### Input Signal (READ-ONLY DERIVED)
```javascript
// Source: MetricInterpretationLayer_v1 (global)
window.__ATOMA_METRICS.interpretation.network.stressVisualChaos  // Range: [0, 1]
                                                                 // 0 = calm
                                                                 // 1 = critical chaos
```

### Input Characteristics
- ✅ Non-linear (power curve mapped)
- ✅ Normalized [0, 1]
- ✅ Aggregated from all nodes
- ✅ Hysteresis applied (rises fast, decays slow)

### Forbidden Input Access
```javascript
// ✗ WRONG: Reading raw Network Stress
const stress = computeNetworkStress(nodes);  // NO: Use visual signal

// ✗ WRONG: Reading per-node corruption
nodes.forEach(n => {
  turbulence = n.userData.visualCorruptionChaos;  // NO: Network stress only
});

// ✗ WRONG: Reading individual pressure
const pressure = link.activeCount / link.node.loadCapacity;  // NO: Use aggregated stress

// ✗ WRONG: Computing from raw stats
const load = nodes.filter(n => n.overloaded).length / nodes.length;  // NO
```

---

## Interpretation Rules

### Normalization
```javascript
// Input is non-linearly mapped (power curve)
// Already normalized [0, 1]
// Use directly

const stressSignal = window.__ATOMA_METRICS.interpretation.network.stressVisualizationChaos;
```

### Smoothing / Easing
```javascript
// Stress turbulence uses HYSTERESIS (different from regular smoothing)
// Rises quickly (responsive to overload)
// Decays slowly (models computational inertia)

const riseRate = 0.5;    // Can spike 50% per second
const decayRate = 0.05;  // Recovers 5% per second

// Fast rise
newStress = min(1.0, oldStress + (targetStress - oldStress) * riseRate * deltaTime);

// Slow decay (only when loading reduces)
if (newStress < oldStress) {
  newStress = max(newStress, oldStress * (1.0 - decayRate * deltaTime));
}
```

### Threshold vs Continuous
```javascript
// CONTINUOUS BEHAVIOR with intensity bands
// Not strict thresholds, but perceptual zones

const chaos = stressSignal;

// Light turbulence [0, 0.3]
if (chaos < 0.3) {
  jitterAmount = chaos * 0.2;  // 0-6% position jitter
  particleDensity = chaos * 100;  // 0-30 particles
}

// Moderate turbulence [0.3, 0.7]
else if (chaos < 0.7) {
  jitterAmount = 0.06 + ((chaos - 0.3) * 0.3);  // 6-18%
  particleDensity = 100 + ((chaos - 0.3) * 500);  // 30-200 particles
}

// Extreme turbulence [0.7, 1.0]
else {
  jitterAmount = 0.18 + ((chaos - 0.7) * 0.4);  // 18-40%
  particleDensity = 200 + ((chaos - 0.7) * 800);  // 200-400 particles
}

// Smooth transitions (no visible pop)
```

---

## Visual Semantics

### What The Turbulence Communicates
- ✅ Network is overloaded/struggling (high chaos)
- ✅ Network is balanced/calm (low chaos)
- ✅ Topology is unstable (turbulent motion)
- ✅ System capacity is strained (visual tension)

### What It Must NEVER Communicate
```
❌ Links are broken/collapsed (that's integrity's job)
❌ Links are taking damage (that's corruption's job)
❌ Network needs healing (that's harmony's job)
❌ Synergy is poor (that's synergy's job)
```

---

## Implementation Semantics

### Visual Style
- **Motion Quality**: Chaotic, turbulent, unsettling
- **Color Palette**: Red-orange accents (tension, not damage)
- **Particles**: Sparks, distortion, jitter
- **Intensity**: Proportional to stress

### Turbulence Characteristics
```javascript
// Global turbulence properties
jitterAmount: stressSignal * 0.4;        // [0%, 40%] position jitter
particleDensity: stressSignal * 500;     // [0, 500] particles
vortexStrength: stressSignal * 0.8;      // [0, 0.8] vortex distortion
distortionAmount: stressSignal * 0.5;    // [0, 50%] UV distortion
motionSpeed: 1.0 + (stressSignal * 2.0); // [1.0x, 3.0x] motion speed
```

### Turbulence Motion
```javascript
// Stress turbulence is DYNAMIC and chaotic
// NOT synchronized with any frequency

for (const node of nodes) {
  // Position jitter
  const jitter = stressSignal * 0.4;
  node.position.x += randomInRange(-jitter, jitter);
  node.position.y += randomInRange(-jitter, jitter);
  node.position.z += randomInRange(-jitter, jitter);
  
  // Link distortion (sine waves with varying frequency)
  const distortionPhase = (time * (2.0 + stressSignal * 3.0)) % (2 * PI);
  link.distortion = sin(distortionPhase) * stressSignal * 0.5;
  
  // Particle emission (random bursts)
  const emissionRate = stressSignal * 100;  // Bursts per second
  if (random() < emissionRate * deltaTime) {
    emitChaosParticle();
  }
}
```

---

## Forbidden Behaviors

### ✗ Anti-patterns (Explicitly Forbidden)

```javascript
// WRONG: Reading per-node corruption for global turbulence
const chaos = mean(nodes.map(n => n.userData.visualCorruptionChaos));  // NO

// WRONG: Computing stress from raw stats
const overloadRatio = countOverloaded() / nodeCount;
turbulence.intensity = overloadRatio;  // NO: Use derived signal

// WRONG: Turbulence triggering damage/healing
if (stressSignal > 0.8) {
  damageAllLinks(0.1);  // NO: Stress never affects gameplay
}

// WRONG: Writing back to global
window.networkChaos = visualStress;  // NO: Read-only

// WRONG: Mutation of stats from turbulence
nodes.forEach(n => {
  n.userData.corruption += stressSignal * 0.01;  // ABSOLUTELY NO
});

// WRONG: Threshold pop behavior
turbulenceVisible = stressSignal > 0.5;  // NO: Gradual, not binary

// WRONG: Single-frequency motion
nodes.forEach(n => {
  n.position.y += sin(time * 1.0) * stressSignal;  // NO: Use chaotic variation
});

// WRONG: Color shifting to red (implies damage)
turbulenceColor = lerpColor(blue, red, stressSignal);  // NO: Use tension color

// WRONG: Disabling movement under stress
playerSpeed = 1.0 - (stressSignal * 0.5);  // NO: Visuals don't affect gameplay
```

---

## Reference Implementation

```javascript
/**
 * Network Stress Turbulence Template (Canonical Reference)
 * 
 * Consumes: window.__ATOMA_METRICS.interpretation.network.stressVisualizationChaos
 * Produces: Global environmental turbulence, particle effects, jitter
 * Pattern: Read-only, hysteretic, chaotic
 */
class NetworkStressTurbulenceEffect {
  constructor(scene, nodes, particleSystem) {
    this.scene = scene;
    this.nodes = nodes;
    this.particleSystem = particleSystem;
    this.smoothedChaos = 0;
    this.lastSignal = 0;
  }
  
  update(deltaTime) {
    // 1. READ ONLY: Global network stress signal
    const stressSignal = window.__ATOMA_METRICS?.interpretation?.network?.stressVisualizationChaos || 0;
    
    // 2. APPLY HYSTERESIS: Fast rise, slow decay
    const riseRate = 0.5;
    const decayRate = 0.05;
    
    if (stressSignal > this.smoothedChaos) {
      // Quick response to increasing load
      this.smoothedChaos = Math.min(1.0, this.smoothedChaos + (stressSignal - this.smoothedChaos) * riseRate * deltaTime);
    } else {
      // Slow recovery when load reduces
      this.smoothedChaos = Math.max(stressSignal, this.smoothedChaos * (1.0 - decayRate * deltaTime));
    }
    
    // 3. COMPUTE: Turbulence parameters
    const chaos = this.smoothedChaos;
    const jitterAmount = chaos * 0.4;
    const particleDensity = chaos * 500;
    const distortionAmount = chaos * 0.5;
    
    // 4. APPLY: Jitter to all nodes
    for (const node of this.nodes) {
      const posOffset = {
        x: this._randomInRange(-jitterAmount, jitterAmount),
        y: this._randomInRange(-jitterAmount, jitterAmount),
        z: this._randomInRange(-jitterAmount, jitterAmount)
      };
      node.jitterOffset = posOffset;
    }
    
    // 5. EMIT: Chaotic particles based on stress
    const emissionRate = particleDensity;
    if (Math.random() < emissionRate * deltaTime * 0.01) {
      this.particleSystem.emitChaosParticle(chaos);
    }
    
    // 6. UPDATE: Global distortion shader
    this.scene.userData.stressTurbulenceIntensity = distortionAmount;
    
    // ✓ Hysteresis models computational inertia
    // ✓ Never write to node.userData
    // ✓ Never read raw stats
    // ✓ Never trigger gameplay events
  }
  
  _randomInRange(min, max) {
    return min + Math.random() * (max - min);
  }
}
```

---

# GLOBAL TEMPLATE CONSTRAINTS

## ✅ REQUIRED FOR ALL TEMPLATES

### 1. Read-Only Data Access
```javascript
// ✓ MUST: Read from derived signals only
node.userData.visualSynergy
node.userData.visualHarmonyAura
window.__ATOMA_METRICS.interpretation.network.stressVisualizationChaos

// ✗ NEVER: Read raw stats
node.userData.synergy  // NO
node.userData.harmony  // NO
node.userData.corruption  // NO
node.userData.integrity  // NO
```

### 2. No Stat Mutation
```javascript
// ✗ ABSOLUTELY FORBIDDEN
node.userData.synergy = value;
link.userData.corruption = value;
node.userData.harmony = value;

// Visual systems can NEVER write to userData metric fields
```

### 3. No Feedback Loops
```javascript
// ✗ ABSOLUTELY FORBIDDEN
if (glowIntensity > 0.7) {
  node.userData.synergy += 0.01;  // NO: Feedback loop
}

if (auraStrength > 0.6) {
  healNearbyLinks();  // NO: Visuals drive gameplay
}
```

### 4. No Implicit Mutations
```javascript
// ✗ FORBIDDEN: Side-effect mutations
this.updateGlow();  // Even if this somewhere mutates state inside
node.userData.glowState = intensity;  // NO: New visual state storage
```

### 5. Isolated Signal Processing
```javascript
// ✓ CORRECT: Each template reads only its signal
synergyTemplate.update(link.userData.visualSynergy);     // Only synergy
harmonyTemplate.update(node.userData.visualHarmonyAura); // Only harmony
stressTemplate.update(networkStress);                    // Only stress

// ✗ WRONG: Mixing signals
visual.update(synergy, harmony, stress);  // NO: Cross-template mixing
```

---

## ❌ FORBIDDEN GLOBALLY

```
❌ No new visual templates without architectural review
❌ No stat mutation from visual systems (absolute)
❌ No feedback loops from visuals to gameplay
❌ No implicit state changes through visual updates
❌ No raw stat access (always use visual signals)
❌ No threshold-based pop behavior (use smooth transitions)
❌ No visual system event triggering gameplay logic
❌ No mixing signals between templates
❌ No storing derived signals in userData
❌ No single-frequency synchronized motion for stress/chaos effects
```

---

## ✅ REQUIRED GLOBALLY

```
✅ All templates consume derived signals only
✅ All templates are read-only
✅ All templates smooth transitions (no pops)
✅ All templates respect interpretation layer
✅ All templates are reversible/disposable
✅ All templates have clear forbidden behaviors documented
✅ All templates use continuous, not threshold-based, scaling
✅ All templates have < 2ms per-frame overhead
✅ All templates respect FX Performance mode
✅ All templates never write to userData metric fields
```

---

# TEMPLATE CONFORMANCE AUDIT

## How to Verify a Visual System Conforms

### Checklist for New Visual System
```javascript
// 1. Source all metrics
const synergySignal = link.userData.visualSynergy;
const harmonySignal = node.userData.visualHarmonyAura;
const stressSignal = window.__ATOMA_METRICS.interpretation.network.stressVisualizationChaos;

// 2. Check: NO raw stat access
// grep for: .userData.synergy (without "visual")
// grep for: .userData.harmony (without "visual")
// grep for: .userData.corruption (without "visual")
// All should return ZERO matches

// 3. Check: NO stat mutation
// grep for: userData\.synergy\s*=
// grep for: userData\.harmony\s*=
// All should return ZERO matches

// 4. Check: NO feedback loops
// Search for: if (glow|aura|chaos) { ... mutation or event trigger }
// All should return ZERO matches

// 5. Check: Smooth transitions
// grep for: if.*>.*threshold
// Compare with: += ... * deltaTime * smoothingFactor
// All threshold checks should be eliminated (or for UI only)

// 6. Verify: Continuous scaling
// Check: mapping functions use linear or smoothstep
// NOT: binary if-then, discrete levels
```

---

## Conformance Verification Tools

### Runtime Check
```javascript
// In console:
window.__ATOMA_METRIC_AUDIT.verifyExclusivity('synergy');   // Check authority
window.__ATOMA_INTERPRETATION.getDebugInfo();               // Check consumption
```

### Static Analysis
```bash
# Check for forbidden patterns
grep -r "userData\.synergy\s*=" *.js     # Should be ZERO
grep -r "userData\.harmony\s*=" *.js     # Should be ZERO
grep -r "\.corruption\s*=" *.js          # Should be ZERO (in visual files)
```

---

# CANONICAL TEMPLATE REFERENCE

| Template | Purpose | Input Signal | Color | Motion | Forbidden |
|----------|---------|--------------|-------|--------|-----------|
| **Synergy Glow** | Efficiency | visualSynergy | Cyan-blue | Breathing (1.2Hz) | Raw synergy, Events, Corruption mixing |
| **Harmony Aura** | Stability | visualHarmonyAura | Golden-white | Intrinsic breathing | Raw harmony, Triggering heals, Stress mixing |
| **Stress Turbulence** | Overload | stressVisualizationChaos | Red-orange tension | Chaotic jitter | Raw stress, Damage effects, Corruption mix |

---

# FINAL DECLARATIONS

## This Library Is Now CANONICAL

- ✅ These three templates are the ONLY approved patterns
- ✅ All future visual systems MUST conform
- ✅ No deviations permitted without architectural review
- ✅ Conformance is verifiable and enforceable

## Metric Authority Remains Intact

- ✅ Core stats unchanged
- ✅ Interpretation layer unchanged
- ✅ Authority contracts unchanged
- ✅ Enforcement monitoring active

## Future Visual System Requirements

Any new visual system must:
- [ ] State which template(s) it conforms to
- [ ] Document metric inputs (derived signals only)
- [ ] List forbidden behaviors explicitly
- [ ] Pass conformance audit
- [ ] Never deviate from template structure

---

**Status**: 🟢 LOCKED & ENFORCEABLE

**Authority**: Principal Visual Architecture

**Validity**: Permanent (no changes without new lock)

**Compliance**: Required for all visual systems

---

**This is the single source of truth for visual system metric consumption patterns.**

**All visual systems must follow these templates.**

**No exceptions.**
