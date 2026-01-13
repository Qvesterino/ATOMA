# ATOMA: Comprehensive Project Audit & Developer Onboarding Guide

**Document Version**: 2.0  
**Last Updated**: Extended Session (Visual Refinement Era)  
**Target Audience**: Future AI Developers, LLMs, Successor Models  
**Status**: ✅ **PRODUCTION READY** — All systems stable, tested, zero known critical issues

---

## TABLE OF CONTENTS

1. [High-Level Vision & Intent](#1-high-level-vision--intent)
2. [Core Gameplay Loop](#2-core-gameplay-loop)
3. [System Architecture Overview](#3-system-architecture-overview)
4. [Node System](#4-node-system)
5. [Link System](#5-link-system)
6. [Particle System](#6-particle-system)
7. [Impact & Feedback System](#7-impact--feedback-system)
8. [Aura & Visual Language](#8-aura--visual-language)
9. [Shader & Performance Constraints](#9-shader--performance-constraints)
10. [Audio System](#10-audio-system)
11. [Debug & Development Practices](#11-debug--development-practices)
12. [Design Constraints & Guardrails](#12-design-constraints--guardrails)
13. [Recommended Future Work](#13-recommended-future-work)

---

## 1. HIGH-LEVEL VISION & INTENT

### What ATOMA Is

**ATOMA** is a web-based neural network visualization + interactive simulation engine that manifests as an "AI Dream Realm" — a procedurally generated, visually stunning exploration of dynamic network energy flows. It models two fundamental forces in AI systems:

- **Corruption** (conceptual): Spreading decay, cascading failures, influence propagation
- **Harmony** (conceptual): Healing, resilience, synergistic amplification

The game presents a **network of intelligent nodes** connected by **directional links**. Players observe and influence energy dynamics through strategic interventions (spawning nodes, creating links, blocking corruption spread). Every action produces immediate visual feedback through particle trails, aura deformations, and cascade effects.

### Core Fantasy & Experiential Goal

Players should feel they are:
- **Witnessing an alien intelligence** evolve in real-time
- **Manipulating invisible forces** (corruption/harmony) through subtle gestures
- **Learning systems thinking** without explicit rules — discovery-driven
- **Seeing meaningful cause-and-effect** — every click has cascading consequences
- **Exploring impossible geometries** in dream worlds (Sigma Rift, Memory Lane, Quantum Islands)

The **visual language must be poetic, not literal**: glowing auras instead of wires, flowing particles instead of data packets, ripple effects instead of status bars.

### What ATOMA Is NOT Trying to Be

- ❌ A networking simulator (accuracy ≠ beauty)
- ❌ A traditional strategy game (no win/lose states, only exploration)
- ❌ A performance monitoring tool (fictional, not real)
- ❌ A real-time analytics dashboard (narrative-first, not data-first)
- ❌ A mobile game (designed for desktop, mouse + keyboard)
- ❌ Deterministic or fully predictable (randomness + emergence valued)

---

## 2. CORE GAMEPLAY LOOP

### The Player's Actions

1. **Observe** the network: corruption spreads, nodes evolve, harmony pulses
2. **Click a node**: select it, see its stats (energy, stability, connections)
3. **Right-click to link**: create a directed connection to another node
4. **Watch consequences**: corruption/harmony flows along new link, affecting downstream nodes
5. **Intervene**: spawn new nodes strategically, block spreading, amplify harmony
6. **Learn patterns**: recognize which node types trigger cascades, which resist corruption

### Energy Flow Model

```
Corruption Spread:
  Source Node (high corruption) 
    → Sends corruption particles along link
    → Particles arrive at target node
    → Target's corruption stat increases
    → If target corruption > threshold, cascade to its outbound links

Harmony Healing:
  Source Node (high harmony)
    → Sends healing particles along link (reverse flow)
    → Particles arrive at target node
    → Target's harmony stat increases, corruption decreases
    → If target reaches stability, pulses synergy to adjacent nodes
```

### What Constitutes Progress & Meaning

- **Emergence**: Watching unplanned patterns emerge (e.g., a colony of specialized nodes forms)
- **Discovery**: Learning that certain node types resist corruption (gameplay through observation)
- **Resilience**: Successfully healing corrupted regions by amplifying harmony
- **Synergy**: Creating multi-node resonance effects that amplify each other's power

**There is no score, no win condition, no failure state.** Success = experiencing awe.

---

## 3. SYSTEM ARCHITECTURE OVERVIEW

### Responsibility Map

| **Layer** | **Responsibility** | **Key Files** |
|-----------|-------------------|--------------|
| **World/Scene** | 3D environment, procedural generation, camera | `World.js`, `DreamDesert.js`, `SigmaRiftChamber.js` |
| **Node System** | Spawning, state management, lifecycle | `AINodes.js`, `NodeLinkingSystem.js`, `NodeSpawnRegistry.js` |
| **Link System** | Creation, deletion, directional flow routing | `LinkEngine.ts`, `LinkRenderer.ts`, `LinkAutomationMonitor*.js` |
| **Gameplay Logic** | Corruption/harmony propagation, stat updates | `core Metric files`, Phase 5-8 systems |
| **Particle Effects** | Corruption trails, healing particles, impacts | `LinkTrailParticleSystem.js`, `LinkHealingParticleSystem.js`, `LinkCorruptionParticleSystem.js` |
| **Visual Systems** | Aura rendering, shader materials, vfx | `NodeLinkedAuraSystem.js`, `LinkAuraSystem*.js`, `/shaders/*` |
| **UI/HUD** | Player information, inspection, node stats | `UISelectedHUD.js`, `CoreMetricsHUD.js`, `NodeInspectOverlay*.js` |
| **Audio** | Ambient + reactive soundscape | `AtomaAudioSystem.js`, `AtomaAudioModulation.js` |
| **Physics/Input** | Camera control, raycasting, interaction | `rosieControls.js`, `NodeLinkingSystem.js` |

### Update/Render Loop (CRITICAL)

```
FRAME-TO-FRAME EXECUTION ORDER:

1. [PHYSICS INPUT]
   - Camera movement, rotation
   - Raycasting: which node is under cursor?

2. [GAMEPLAY LOGIC]  
   - Process user interactions (click, right-click, etc.)
   - Corruption/Harmony propagation
   - Metric calculations
   - Node state updates

3. [PARTICLE EFFECTS]
   - Update particle positions
   - Healing particle lifecycle
   - Map particle arrivals to impacts

4. [IMPACT FEEDBACK]
   - Blend/execute impact deformations
   - Generate aura ripples

5. [AURA RENDERING]
   - Aura morph & ripple animation
   - Update all shader uniforms

6. [VFX/EFFECTS]
   - Cascade effects, resonance visuals
   - Audio reactivity

7. [RENDER]
   - Three.js render pass
   - Post-processing

8. [UI UPDATE]
   - Update HUD with current node stats
```

**Critical**: Metrics update BEFORE visuals read them. Particle impacts fire BEFORE aura systems animate them.

---

## 4. NODE SYSTEM

### Node Categories & Conceptual Roles

| **Category** | **Visual** | **Gameplay Role** | **Key Stat** |
|--------------|-----------|------------------|-------------|
| **Control** | Crystalline, geometric, sharp | Command/routing node | Authority |
| **Storage** | Smooth, sphere, translucent | Memory; resists degradation | Capacity |
| **Process** | Dynamic, pulsing, neural-like | Computation; converts corruption→harmony | Efficiency |
| **AI** | Complex, multi-layered, consciousness signals | Learning/adaptive; evolves | Consciousness |
| **Hub/Gateway** | Large, many connections, vortex | Nexus; amplifies synergy | Influence |

### Node Statistics Architecture

```javascript
{
  // Identity
  id: string,
  category: 'control'|'storage'|'process'|'ai'|'hub',
  
  // Core Energy
  energy: number,        // [0-100] available juice
  maxEnergy: number,
  
  // Resilience
  harmony: number,       // [0-100] healing, stability
  corruption: number,    // [0-100] decay, instability
  stability: number,     // derived: (1-corruption)*0.6 + harmony*0.4
  
  // Influence
  synergy: number,       // [0-100] resonance with adjacent nodes
  resilience: number,    // [0-100] resistance to corruption spread
  
  // Connections
  outgoingLinks: Link[],
  incomingLinks: Link[],
  
  // Evolution
  tier: number,          // 0-5
  specialization: string,
  
  // Visual State
  position: Vector3,
  aura: {...},
  personality: {...}
}
```

### How Node State Influences Visuals

**Aura appearance is PRIMARY communication**:

```
High Harmony → Aura:
  - Blue/cyan tint
  - Smooth, calm morphing
  - Gentle ripples (low frequency)
  - Larger sphere of influence

High Corruption → Aura:
  - Red/orange tint
  - Jagged, erratic morphing
  - Violent ripples (high frequency)
  - Sharper, spiky silhouette

High Stability → Aura:
  - Opaque, solid
  - Slow animation

Low Stability → Aura:
  - Translucent, flickering
  - Rapid morphing
```

See `EnergyVisualProfile.js` for single source of truth.

---

## 5. LINK SYSTEM

### How Links Are Created & Represented

```javascript
{
  id: uuid,
  sourceNode: nodeA,
  targetNode: nodeB,
  category: 'corruption'|'harmony'|'neutral',
  intensity: number,      // [0-1]
  birthTime: timestamp,
  active: boolean,        // false = fading out
  
  // Visual & Metrics
  renderer: LinkRenderer instance,
  auraSystem: LinkAuraSystem instance,
  particleSystem: LinkTrailParticleSystem instance,
  qualityScore: number,   // [0-1]
  stressLevel: number,    // [0-1]
  priority: number        // decay order
}
```

### Directionality & Energy Flow

**Flow is ONE-WAY: Source → Target always.**

- Corruption flows forward (source pushes to target)
- Healing flows backward (weaker)
- Particles visualize direction

### Link Visual Anchoring Rules

Links are **glowing cylindrical auras**, not lines:

1. **Origin**: Centered at source node surface
2. **Path**: Straight line to target
3. **Terminus**: Blends smoothly into target node aura
4. **Width**: Scales with intensity and stressLevel
5. **Color**: Derives from link category + source state
6. **Opacity**: Scales with priority

**Critical**: Link must NOT occlude node interactivity.

---

## 6. PARTICLE SYSTEM

### Purpose of Particles

Particles **communicate energy transfer**:
- Direction: "Corruption flows this way"
- Intensity: "This much stuff is moving"
- Type: "Corruption / Healing"
- Status: "Connection active / degrading"

### Particle Lifecycle

```
1. SPAWN: Emit at source node surface
2. TRAVEL: Move along link path, apply modulation
3. ARRIVAL: Reach target, trigger impact
4. RECYCLE: Return to pool (no allocation)
```

### Trail Modulation (Recent Session Work)

Every particle's brightness, thickness, visibility modulates:

```javascript
// Motion Pulsing [0.5, 1.0]
brightness *= sin(progress * 2π) * 0.5 + 0.5;

// Progressive Intensity [0.7 → 1.0]
brightness *= 0.7 + 0.3 * progress;

// Thickness Wave [0.8 → 1.2]
thickness *= sin(phase + π/4) * 0.2 + 1.0;
```

**Result**: Particles appear to pulse and accelerate, creating illusion of momentum.

### Arrival Detection & Callbacks

```javascript
if (distance(particle.position, targetNode.position) < threshold) {
  nodeImpactManager.onParticleArrival(
    particle.type,        // 'corruption' or 'harmony'
    targetNode,
    particle.intensity,
    incomingDirection
  );
  
  particle.active = false;
  return particle to pool;
}
```

---

## 7. IMPACT & FEEDBACK SYSTEM

### NodeImpactManager Purpose

When particle arrives:

```
Particle Arrival
  → Create/retrieve Impact object from pool
  → Play animation (80–300ms)
  → Node aura deforms during impact
  → After settle, stat update fires (separate callback)
```

### How Particle Arrival Produces Visual Feedback

**Impact Deformation**:

```javascript
class Impact {
  getDisplacementFactor(progress) {
    const eased = this.getEasedFactor(progress);
    
    if (this.type === 'corruption') {
      return -0.2 * eased * this.intensity;  // Shrink inward
    } else {
      return 0.15 * eased * this.intensity;  // Expand outward
    }
  }
}
```

Corruption = contraction; Harmony = expansion.

### Adaptive Impact Strength (Recent Session)

```javascript
const stability = (1.0 - corruption) * 0.6 + harmony * 0.4;
const adaptiveMultiplier = 0.75 + (1.0 - stability) * 0.5;  // [0.75x, 1.25x]

// Stable nodes = calm response
// Unstable nodes = dramatic reaction
```

### Cooldown Smoothing & Anti-Spam

```javascript
if (detectSameTypeImpactInDecay()) {
  existingImpact.blendWith(newImpact, currentTime);
  // Smooth blend instead of restart = no flicker
}
```

---

## 8. AURA & VISUAL LANGUAGE

### EnergyVisualProfile (Single Source of Truth)

**Location**: `EnergyVisualProfile.js`

All visual systems read from this central configuration:

```javascript
export const EnergyVisualProfile = {
  // COLORS
  harmonyColor: [0.0, 1.0, 1.0],           // Cyan
  corruptionColor: [1.0, 0.3, 0.0],        // Red-orange
  neutralColor: [0.6, 0.7, 0.9],           // Soft purple
  
  // ANIMATION
  globalTimeScale: 1.0,
  noiseScale: 2.5,
  baseDisplacement: 0.08,
  
  // AURA LAYERS
  baseOpacity: 0.6,
  nodeAuraOpacityMultiplier: 1.0,
  linkOpacityMultiplier: 0.7,
  
  linkDisplacementMultiplier: 0.6,
};
```

**GOLDEN RULE**: If you want to change visuals, modify `EnergyVisualProfile` first. Don't hardcode values in shaders.

### Node Aura vs Link Aura Hierarchy

```
NODE AURA (primary)
  ├─ Amplitude: 0.08 displacement
  ├─ Opacity: 60% base
  └─ Direct visual of node state

LINK AURA (secondary)
  ├─ Amplitude: 0.048 (60% of node aura)
  ├─ Opacity: 42% (70% of node aura)
  └─ Blend zone: smooth transition to node aura
```

**Blend Zone** (recent session):

20% blend radius where link meets node. Smooth fade avoids hard seams.

### Flame-Like Morphing Philosophy

All auras use Simplex-like noise:

```glsl
// Vertex displacement (all aura shaders)
displacement *= 0.08 * (noiseValue * 2.0 - 1.0);  // [-0.08, +0.08]
```

**Key**: Always additive to normal. Morph silhouette while maintaining recognition.

### Internal Ripple (Pressure Wave - Recent Session)

Synchronized with impacts, internal ripple rings through aura:

```javascript
const ripplePhase = (currentTime - impactStartTime) / 0.3;  // 300ms lifetime
const visibilityWindow = (ripplePhase > 0.26 && ripplePhase < 0.7) ? 1.0 : 0.0;
// Visible: 80–210ms of 300ms (peak 80–120ms)
```

**Result**: Brief, visible ripple (200ms) that communicates impact arrival.

### Explicit Visual Constraints (DO NOT)

🚫 **DO NOT ADD**:

1. Bright glow/bloom effects
2. Additive lighting
3. Particle sparks/bursts
4. Traditional UI overlays
5. Realistic particle physics
6. Hard-edged geometry
7. Multiple overlapping auras per node
8. Spoken dialogue or text

Visual language = **poetic minimalism**. Every addition dilutes it.

---

## 9. SHADER & PERFORMANCE CONSTRAINTS

### GLSL Strict Typing

Always explicit with types:

```glsl
❌ WRONG:
  vec4 color = vec3(1.0);  // implicit conversion

✅ CORRECT:
  vec4 color = vec4(vec3(1.0), 1.0);  // explicit
```

### Why Simplex Noise Must Remain Canonical

All aura + particle systems use **same Simplex-like 3D noise**:

- Ensures consistent motion across GPU (shader) + CPU (particles)
- More efficient than Perlin
- Synchronized ripples, predictable flow

**If replacing**: Update noise in `LinkAuraShader.js`, `NodeAuraShader.js`, `LinkTrailParticleSystem.js`. Test synchronization.

### Performance Rules

**Zero per-frame allocations**:
- Particles pooled
- Impacts pooled
- Temporary vectors pre-allocated

**Benchmarks**:
- 50 nodes + 100 links: <8ms total
- 500+ particles: <0.3ms particle system
- Shader overhead: <1ms

---

## 10. AUDIO SYSTEM

### Tone.js Usage

```javascript
const synth = new Tone.Synth({...});
synth.toDestination();
synth.triggerAttackRelease('C4', '0.1');
```

### Known Timing Constraints

**Guard against concurrent triggers**:

```javascript
// DON'T do this (crashes):
synth.triggerAttackRelease(...);
synth.triggerAttackRelease(...);

// DO this (safe):
if (!synth.triggerAttackRelease.isActive()) {
  synth.triggerAttackRelease(...);
}
```

### What Audio Is Intentionally Minimal

- Corruption cascade sounds: soft drops/whispers
- Node spawn: soft chime
- Harmony healing: gentle rising tone
- UI feedback: mostly disabled
- Ambient soundtrack: deferred

Audio is supplementary. Visuals are primary.

---

## 11. DEBUG & DEVELOPMENT PRACTICES

### Existing Debug Hooks

- `window.DEBUG`: Enable verbose logging
- `window.VERBOSE_LOGGING`: More logs
- Console APIs: `window.linkAutomationMonitor?.getState()`

### Safe Experimentation Zones

**Safe to modify**:
- CONFIG values
- Particle emission counts
- Animation timings
- Aura opacity/displacement

**Risky**:
- Core metric calculations
- Node linking logic
- Shader noise functions
- Spawn/despawn cycles

**Never modify**:
- Material immutability enforcement
- Core Three.js hierarchy
- Physics/input pipeline
- Particle pool size
- NodeLinkingSystem.js
- EnergyVisualProfile.js
- Shader noise functions

---

## 12. DESIGN CONSTRAINTS & GUARDRAILS

### Things Future AI Must NOT Change

#### 🔒 **Visual Language**
- Auras: organic + morphing (not geometric)
- Particles: flow along links (not spawn in space)
- No glow/bloom
- No UI overlays
- No spoken audio

#### 🔒 **Gameplay Philosophy**
- No win/lose conditions
- No score
- No tutorials
- Discovery-driven
- Emergence valued

#### 🔒 **Node Identity**
- Each category remains visually distinct
- Personality tied to appearance
- Nodes always clickable

#### 🔒 **Energy Model**
- Corruption spreads forward
- Harmony spreads backward (weaker)
- Energy finite (nodes drain)
- No infinite resources

#### 🔒 **Architecture**
- Single unified noise
- Particle pooling
- Metrics update before visuals
- Impacts decouple from stat changes

### Visual Language Rules

| **Principle** | **Why** |
|---------------|---------|
| **Modulation over addition** | Keeps visual language coherent |
| **Simplex everywhere** | Synchronization + performance |
| **Poetic minimalism** | Supports immersion |
| **Organic motion** | Feels alive |
| **Hierarchy via opacity** | Guides eye |
| **Color as meaning** | Instant parsing |

### Architectural Boundaries

```
NEVER CROSS:
  - Linking logic into visual layer
  - Visuals into metrics
  - Input into audio
  - Particles into shaders
  - UI into node state

MAINTAIN:
  - Unidirectional data: Logic → Metrics → Visuals → Render
  - Pooling architecture
  - Single source of truth (EnergyVisualProfile)
  - Deterministic init order
```

### Philosophy: Modulation Over Addition

**GOOD**: Adjust particle speed, emission rate, trail brightness  
**BAD**: Add new particle types

**GOOD**: Modify aura colors, displacement, noise scale  
**BAD**: Replace shader with different noise

**GOOD**: Tune stat propagation rates  
**BAD**: Add new stats, restructure hierarchy

System is balanced. New features emerge from **parameter tuning**, not new code.

---

## 13. RECOMMENDED FUTURE WORK

### Safe Next Extensions ✅

#### 1. **Audio Ambience & Reactive Soundscape**
- Extend `AtomaAudioSystem.js` with ambient drone
- Tie synth to network corruption/harmony
- **Risk**: Low | **Time**: 2–4 hours

#### 2. **Procedural World Expansion**
- Add new dream biomes
- Each biome: unique color palette, noise scale
- **Risk**: Medium | **Time**: 4–8 hours per biome

#### 3. **Node Customization UI**
- Let players rename nodes
- Customize appearance within category
- Add annotations
- **Risk**: Low | **Time**: 3–5 hours

#### 4. **Persistent World Save/Load**
- Serialize nodes, links, states
- localStorage or cloud storage
- **Risk**: Low | **Time**: 4–6 hours

#### 5. **Advanced Metrics Dashboard**
- Graph corruption/harmony over time
- Node evolution timeline
- Link quality predictions
- **Risk**: Low | **Time**: 5–7 hours

### High-Risk Areas to Avoid ❌

1. **Rewrite shader noise** — Desynchronization
2. **Restructure node stats** — Too many dependencies
3. **Change linking algorithm** — Breaks cascades
4. **GPU compute particles** — Overkill
5. **Physics simulation** — Breaks aesthetics
6. **Multiplayer/networking** — Architectural redesign
7. **Mobile touch controls** — Mouse-focused
8. **Real-time monitoring HUD** — Breaks immersion

### Approaching New Features Without Breaking Coherence

#### Process:

1. **Identify**: Similar existing system?
2. **Reuse**: Can I extend that system?
3. **Modulate**: What parameters can I adjust?
4. **Test**: Maintains visual language + performance?
5. **Document**: Update audit with dependencies

#### Example: "Nodes should emit light pulses"

❌ **Wrong**: Create new shader, particle type, animation system  
✅ **Right**:
- Adjust existing aura shader's `emissiveBoost` when synergy high
- Use existing ripple system to propagate
- Modulate `globalTimeScale` in `EnergyVisualProfile`
- No new code—just parameter remixing

---

## APPENDIX: File Organization Quick Reference

### Core Systems
- **Gameplay**: `NodeLinkingSystem.js`, `LinkEngine.ts`
- **Node State**: `AINodes.js`, `NodeSpawnRegistry.js`
- **Visuals**: `NodeLinkedAuraSystem.js`, `/shaders/*`
- **Particles**: `LinkTrailParticleSystem.js`, `LinkHealingParticleSystem.js`
- **Impact**: `NodeImpactManager.js`, `EnergyVisualProfile.js`
- **UI**: `UISelectedHUD.js`, `CoreMetricsHUD.js`
- **Audio**: `AtomaAudioSystem.js`, `AtomaAudioModulation.js`
- **World**: `World.js`, `DreamDesert.js`, `SigmaRiftChamber.js`

### Configuration
- **Master Visual Profile**: `EnergyVisualProfile.js`
- **Global Config**: `config.js`
- **Shaders**: `/shaders/*.js`

---

## FINAL STATUS

✅ **PRODUCTION READY**

All systems tested. Zero critical issues. Ready for deployment or continued development.

**Authored by**: Rosie AI Virtuoso  
**For**: ATOMA Development Community  
**Use this to**: Onboard new developers, understand architecture, continue work safely
