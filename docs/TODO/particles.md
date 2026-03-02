# ATOMA PARTICLE SYSTEMS AUDIT

Complete inventory of all particle systems in the codebase with their purpose and connections.

---

## 1. CascadeParticleSystem_Session120.js

**What it does:**
Implements "Semantic Particle Encoding" where particle shape and motion carry specific meaning about conflict type and flow direction during cascade events. Uses GPU-driven particles with texture atlas for 4 distinct shapes (arcs, forks, shards, blobs) representing different conflict types.

**Role/Purpose:**
Visualizes cascade conflicts with semantic meaning - phase conflicts show as crescent arcs, polarity conflicts as forked shapes, corruption as fractured shards, and stability conflicts as irregular blobs. Velocity encoding shows flow direction (forward, backflow, oscillatory).

**Connections:**
- Connected to: `HarmonicCascadeAmplification_Session145` (cascade system)
- Linked to: `ParticleStreamCascadeAccelerationIntegrationPatch` (acceleration)
- Uses: `VisualTime` for canonical timing
- Reads from: Link `userData` properties (cascadeIntensity, cascadeConflictType, cascadeParticleEmissionBoost)

---

## 2. CascadeResonanceWaveVisualization_Session146.js

**What it does:**
Creates a ghost-level resonance wave visualization that propagates between phase-synchronized harmonic hubs. Pure temporal modulation system - no visible objects, particles, or energy transfer. Uses virtual wave phases to suggest latent cascade potential.

**Role/Purpose:**
Represents the network "testing" resonance paths without committing to actual cascade mechanics. Players sense latent directional tension through extremely subtle temporal modulation of existing animation parameters (5-8% influence). Auto-decays when synchronization weakens.

**Connections:**
- Connected to: `HarmonicCascadeAmplification_Session145` (cascade system)
- Connected to: `HarmonicHubAuraSystem` (hub aura modification)
- Connected to: `LinkResonanceSystem` (link metadata storage)
- Modifies: `_wavePhaseCompression` and `_waveNoiseReduction` on hub auras and links

---

## 3. HealingParticleSystem_Session136.js

**What it does:**
GPU-driven particle system for visual enhancement of network repair. Renders particle trails for healing waves and sparkles emitted from fading resonance scars. Uses single draw call with circular buffer, zero per-frame allocation.

**Role/Purpose:**
Provides visual feedback for healing mechanics - healing trails follow wave paths when healing waves propagate, scar sparkles emit from resonance scars as they dissipate. State-responsive to Harmony/Corruption metrics.

**Connections:**
- Connected to: `ResonanceRuptureSystem` (for scar tracking)
- Connected to: `AudioSystem` (triggerHealingTone)
- Public API: `emitHealingTrail()`, `emitSplash()` called by `HarmonicHealingVisualSystem`
- Modulated by: network state (harmony, corruption)

---

## 4. LinkTrailParticleSystem.js

**What it does:**
Emits organic particle trails that flow along links using the SAME noise function as link and node aura systems for visual consistency. Particles follow links from source to target with smooth fade-in/out. Includes energy intensity and thickness modulation for trail readability.

**Role/Purpose:**
Creates continuous energy flow visualization along links. Particles pulse in brightness as they move, indicating flow direction and energy transfer. Motion-synchronized pulsing creates subtle "pressure" indication without adding new glow effects.

**Connections:**
- Uses: `VisualHierarchyRegistry` for render order
- Shared noise function with: `LinkAuraSystem_v1.js` shader
- Callback: `onParticleArrival` for impact detection
- Color modulated by: link state (harmony/corruption)
- Emitters managed per link: `LinkTrailEmitter` class

---

## 5. LinkSparkSystem.js

**What it does:**
GPU-driven spark particle system representing micro-friction and tension on links. Particles spawn from rope surface and drift outward with slight upward float. Quadratic bezier curve following with vertex shader animation.

**Role/Purpose:**
Tertiary visual layer (very subtle) that shows link stress/activity. Spawns only during high activity (Synergy/Traffic). Represents the "friction" of energy flowing through the network connection.

**Connections:**
- Uses: `VisualHierarchyRegistry` for render order
- Per-link instance: Each link can have its own `LinkSparkSystem`
- Fed by: Link stats {synergy, traffic, load, intensity}
- Color derived from: Base link color (desaturated, brightened)

---

## 6. ParticleStreamCascadeAccelerationIntegrationPatch.js

**What it does:**
Integration patch that modifies particle velocity calculations from `WaveParticleEmitter_v1` to reflect cascade layer depth. Intercepts particle emission and applies cascade acceleration multipliers to velocity vectors.

**Role/Purpose:**
Bridges cascade acceleration mechanics with wave particle emission. Makes particles respond to cascade depth by accelerating their velocity, shortening lifetime (faster = shorter life), and applying directional deflection toward cascade flow.

**Connections:**
- Patches: `WaveParticleEmitter_v1` (constructive, destructive, ripple methods)
- Queries: `CascadeAccelerationSystem` (acceleration multiplier/vector)
- Queries: `NodeDynamicMetrics` (node metrics)
- Optionally queries: `FlowDeflectionSystem` (deflection vectors)
- Modifies: Particle velocity, lifetime, and intensity attributes

---

## SUMMARY BY CATEGORY

**Cascade/Conflict Visualization:**
- CascadeParticleSystem_Session120.js
- CascadeResonanceWaveVisualization_Session146.js

**Link Energy Flow:**
- LinkTrailParticleSystem.js
- LinkSparkSystem.js

**Healing/Repair:**
- HealingParticleSystem_Session136.js

**Integration/Patching:**
- ParticleStreamCascadeAccelerationIntegrationPatch.js

**Total: 6 particle system files identified**