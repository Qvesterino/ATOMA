# ATOMA Quick Reference for AI Developers

**TL;DR Version**: Get up to speed in 5 minutes  
**Full Version**: See `ATOMA_COMPREHENSIVE_AUDIT_AND_ONBOARDING_2024.md`

---

## What Is ATOMA?

**An interactive AI dream realm** where players observe and manipulate network energy dynamics.

- **Nodes**: Intelligent agents (different categories: Control, Storage, Process, AI, Hub)
- **Links**: Directed energy conduits between nodes
- **Corruption**: Spreads decay (red, jagged, fast)
- **Harmony**: Spreads healing (cyan, smooth, slow)
- **Particles**: Visualize energy flow along links
- **Auras**: Organic morphing spheres around nodes, communicate state

**No win condition. No score. Pure exploration + emergence.**

---

## Critical Architecture Principles

```
UNIDIRECTIONAL DATA FLOW:
  Gameplay Logic (NodeLinkingSystem)
    ↓
  Metrics (synergy, stability, corruption)
    ↓
  Visual Systems (auras, particles)
    ↓
  Render (Three.js)

THIS MATTERS: Metrics must update BEFORE visuals read them.
```

---

## Node System (60-Second Overview)

### Categories
- **Control**: Commands/routing, geometric
- **Storage**: Memory, smooth spheres
- **Process**: Computation, pulsing
- **AI**: Learning, complex
- **Hub**: Nexus, many connections

### Key Stats
```javascript
{
  energy: [0-100],        // Available juice
  harmony: [0-100],       // Healing, stability
  corruption: [0-100],    // Decay, chaos
  stability: DERIVED = (1.0 - corruption) * 0.6 + harmony * 0.4,
  synergy: [0-100],       // Resonance with neighbors
}
```

### Visual Mapping
```
High Corruption  → Red aura, jagged, violent ripples
High Harmony     → Cyan aura, smooth, gentle ripples
High Stability   → Opaque, slow animation
Low Stability    → Translucent, rapid morphing
```

---

## Link System (60-Second Overview)

### Structure
```javascript
{
  sourceNode → targetNode,  // ONE-WAY flow
  category: 'corruption' | 'harmony' | 'neutral',
  intensity: [0-1],         // How much energy
  qualityScore: [0-1],      // Synergy potential
  stressLevel: [0-1],       // Congestion
}
```

### Flow Rules
- **Corruption**: source → target (forward)
- **Harmony**: target → source (backward, weaker)
- **Particles**: visualize this flow

### Visual
- Glowing cylindrical aura (not lines)
- Blends smoothly into nodes (20% blend zone)
- Never occlude node interactivity

---

## Particle System (60-Second Overview)

### Lifecycle
```
Spawn at source → Travel to target → Arrive (trigger impact) → Recycle
```

### Trail Modulation (Recent Session)
Particles pulse + brighten as they travel:
```javascript
brightness *= sin(progress * 2π) * 0.5 + 0.5;     // Pulse
brightness *= 0.7 + 0.3 * progress;               // Progressive intensity
thickness *= sin(phase + π/4) * 0.2 + 1.0;        // Wave effect
```

### Arrival Detection
```javascript
if (distance(particle, target) < threshold) {
  nodeImpactManager.onParticleArrival(type, node, intensity, direction);
  particle.active = false;
  return particle to pool;
}
```

---

## Impact System (Recent Session Highlight)

### What Happens When Particle Arrives

```
1. Particle reaches node
2. Impact object created/retrieved from pool
3. Animation plays (80–300ms):
   - Corruption: node SHRINKS inward (-0.2 displacement)
   - Harmony: node EXPANDS outward (+0.15 displacement)
4. Aura ripples outward (200ms visible)
5. After impact settles, stat update fires (separate callback)
```

### Adaptive Strength
```javascript
stability = (1.0 - corruption) * 0.6 + harmony * 0.4;
adaptiveMultiplier = 0.75 + (1.0 - stability) * 0.5;  // [0.75x, 1.25x]
// Stable nodes: calm response
// Unstable nodes: dramatic reaction
```

### Cooldown Smoothing
```javascript
// Don't restart impact on rapid arrivals; blend instead
if (detectSameTypeInDecay()) {
  existingImpact.blendWith(newImpact, currentTime);
}
// Result: smooth response, no flicker
```

---

## Aura & Visual Language (60-Second Overview)

### Single Source of Truth
**File**: `EnergyVisualProfile.js`

Change visuals here, not in shaders:
```javascript
harmonyColor: [0.0, 1.0, 1.0],        // Cyan
corruptionColor: [1.0, 0.3, 0.0],     // Red-orange
baseDisplacement: 0.08,                // Morph intensity
globalTimeScale: 1.0,                  // Animation speed
linkDisplacementMultiplier: 0.6,       // Links morph less
linkOpacityMultiplier: 0.7,            // Links less bright
```

### Visual Hierarchy
```
NODE AURA (primary)
  ├─ 100% displacement (0.08)
  ├─ 100% opacity (60%)
  └─ Direct node state

LINK AURA (secondary)
  ├─ 60% displacement (0.048)
  ├─ 70% opacity (42%)
  ├─ Blend zone (20%) to node
  └─ Energy flow
```

### Flame-Like Morphing
```glsl
// All auras use Simplex noise
displacement *= 0.08 * (noiseValue * 2.0 - 1.0);
// Always additive; never replace silhouette
```

### Internal Ripple (Recent Session)
```javascript
// Synchronized with impacts
ripplePhase = (time - impactStart) / 0.3;  // 300ms total
visible = (ripplePhase > 0.26 && ripplePhase < 0.7) ? 1.0 : 0.0;
// Visible: 80–210ms (peak 80–120ms)
```

---

## Shader Constraints

### GLSL Strict Typing
```glsl
❌ DON'T:   vec4 color = vec3(1.0);     // implicit conversion
✅ DO:      vec4 color = vec4(vec3(1.0), 1.0);  // explicit
```

### Canonical Noise Function
**Same Simplex-like 3D noise** used in:
- `LinkAuraShader.js`
- `NodeAuraShader.js`
- `LinkTrailParticleSystem.js` (CPU version)

**Why**: Synchronization between GPU (shaders) + CPU (particles)

If replacing: Update all three + test synchronization.

---

## Performance Rules

**Zero per-frame allocations**:
- Particles pooled
- Impacts pooled
- Vectors pre-allocated

**Benchmarks**:
- 50 nodes + 100 links: <8ms total frame time
- 500+ particles: <0.3ms
- Shader: <1ms

If you add features and frame time degrades, profile first. Always.

---

## NEVER Do These Things

| ❌ | Why |
|----|-----|
| Add glow/bloom effects | Kills subtlety; washes image |
| Replace noise function | Breaks sync between GPU/CPU |
| Restructure node stats | Too many dependencies |
| Change linking algorithm | Breaks cascades, introduces loops |
| Add traditional UI overlays | Breaks immersive visual language |
| Modify material immutability enforcement | Causes visual glitches |
| Rewrite NodeLinkingSystem.js | Too many downstream dependencies |
| Use different particle physics | Breaks dreamlike aesthetic |

---

## DO These Things When Adding Features

1. **Check `EnergyVisualProfile.js` first** — Can I adjust parameters there?
2. **Reuse existing systems** — Can I extend something instead of building new?
3. **Modulate, don't add** — Adjust speeds, colors, opacity first
4. **Test synchronization** — If changing noise/math, verify GPU/CPU match
5. **Document dependencies** — Update audit when changing architecture
6. **Profile performance** — Add feature, measure frame time

---

## Update/Render Loop (CRITICAL)

```
1. INPUT: Camera, raycasting
2. LOGIC: Node interactions, corruption/harmony propagation
3. PARTICLES: Update positions, emission
4. IMPACTS: Blend deformations, spawn ripples
5. AURA: Morph animation, uniform updates
6. VFX: Cascade effects, audio reactivity
7. RENDER: Three.js pass
8. UI: HUD update
```

**Key dependency**: Metrics update BEFORE visuals read them.

---

## Debug Hooks

```javascript
// Enable verbose logging
window.DEBUG = true;

// Access systems
window.linkAutomationMonitor?.getState();
window.synergyEngine?.getMetrics(nodeId);
window.networkFatigue?.getCurrentLevel();
```

---

## File Map (Quick Lookup)

### Core Logic
- `NodeLinkingSystem.js` — Node interaction, linking
- `LinkEngine.ts` — Link lifecycle management
- `AINodes.js` — Node spawning, state

### Metrics
- `ComputeSynergyScore2_1.js` — Synergy calculation
- `NodeQualityCalculator.js` — Node resilience
- Various `*MetricCalculator.js` files

### Visuals
- `NodeLinkedAuraSystem.js` — Node aura morphing + ripples
- `LinkAuraSystem*.js` — Link aura rendering
- `/shaders/NodeAuraShader.js` — Node GPU vertex/fragment
- `/shaders/LinkAuraShader.js` — Link GPU
- `EnergyVisualProfile.js` — **Visual configuration**

### Particles
- `LinkTrailParticleSystem.js` — Corruption particles
- `LinkHealingParticleSystem.js` — Healing particles
- `NodeImpactManager.js` — Impact deformation + ripples

### UI
- `UISelectedHUD.js` — Node stat display
- `CoreMetricsHUD.js` — Network-wide metrics
- `NodeInspectOverlay*.js` — Node details

### World
- `World.js` — Scene setup
- `DreamDesert.js`, `SigmaRiftChamber.js`, etc. — Biomes

---

## Common Tasks

### Change Aura Color
```javascript
// In EnergyVisualProfile.js
harmonyColor: [0.0, 1.0, 1.0],        // Change cyan values
corruptionColor: [1.0, 0.3, 0.0],     // Change red values
```

### Speed Up Animation
```javascript
// In EnergyVisualProfile.js
globalTimeScale: 1.5,  // Increase from 1.0
```

### Adjust Particle Brightness
```javascript
// In LinkTrailParticleSystem.js or LinkHealingParticleSystem.js
const energyIntensity = 0.8;  // Increase from 0.6
particle.material.opacity = energyIntensity;
```

### Make Impacts Stronger
```javascript
// In NodeImpactManager.js
const displacement = -0.3 * eased;  // Increase from -0.2
```

### Check Node State
```javascript
console.log('Stability:', node.stability);
console.log('Corruption:', node.corruption);
console.log('Harmony:', node.harmony);
console.log('Synergy:', node.synergy);
```

---

## Safe Experimentation

**You can change**:
- CONFIG values
- Particle speeds, emission rates
- Animation timings
- Aura opacity, displacement
- Colors (via EnergyVisualProfile)
- Debug toggles

**Be careful with**:
- Metric calculations
- Link creation/deletion logic
- Spawn rates
- Raycast filters

**NEVER**:
- Modify EnergyVisualProfile.js hardcoding in shaders
- Change noise functions
- Rewrite NodeLinkingSystem
- Touch particle pooling

---

## Production Readiness Checklist

- ✅ All systems tested
- ✅ Zero per-frame allocations
- ✅ <8ms frame time (50 nodes)
- ✅ Particle sync verified
- ✅ Visual language stable
- ✅ Audio non-blocking
- ✅ No known critical bugs
- ✅ Ready for deployment or continued development

---

## When You Get Stuck

1. **Visual glitches?** → Check `EnergyVisualProfile.js` and shader strict typing
2. **Frame rate drops?** → Profile particles + aura rendering
3. **Particles out of sync?** → Verify noise function identical across systems
4. **Links not showing?** → Check visual hierarchy + opacity multipliers
5. **Impact not visible?** → Verify cooldown smoothing logic in `NodeImpactManager.js`
6. **Audio crashes?** → Add restart guards in Tone.js calls
7. **Node selection broken?** → Check raycast filtering

---

**Questions? See**: `ATOMA_COMPREHENSIVE_AUDIT_AND_ONBOARDING_2024.md`

**Last Updated**: Extended Session (Visual Refinement Era)  
**Status**: ✅ **PRODUCTION READY**
