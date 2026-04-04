## 1 RESONANCE VFX

```
1 RESONANCE VFX
  1.1 LinkResonanceFlowSystem_Session124.js
  1.2 ResonanceEchoTrailSystem.js
  1.3 HarmonicResonanceCoupling_v1.js
  1.4 CascadeResonanceWaveVisualization_Session146.js
  1.5 T2_HarmonyVisualConsumer_v1.js (archived)
  1.6 ResonanceCascadeVisualization_Session117B.js

2 CASCADE VFX
  2.1 SynergyCascadeVisualizer.js
  2.2 CascadeParticleSystem_Session120.js
  2.3 CascadingRuptureSystem.js

3 WAVES
  3.1 StandingWaveVisualRenderer_Session131.js
  3.2 OscillationTrapVisualSystem_Session132.js
  3.3 ResonanceRuptureVisualSystem_Session133.js
  3.4 HarmonicRecoveryVisualSystem_Session138.js

4 PARTICLES
  4.1 CascadeParticleSystem_Session120.js
  4.2 HealingParticleSystem_Session136.js
  4.3 T2_CorruptionVisualIntegration_v1.js
  4.4 WaveParticleEmitter_v1.js
  4.5 ParticleTrailSystem_Session122.js



5 SYNERGY VFX
  5.1 SynergyHighwayVisuals3D_1_0.js
  5.2 SynergyChainReaction_v1.js

6 HARMONY VFX
  6.1 HarmonicNodeResonanceHalos.js

7 CORRUPTION VFX
  7.1 CorruptionVisualFX_v1.js
```
0 LINK VISUAL VFX
  0.1 LinkRendererConduit.js
    / DirectionalStreaks - LinkPulseWaveInjector + LinkStreakColorDynamics + LinkDirectionalGradientPolish
    /--- LinkBeadSystem - LinkBeadTrailSystem - LinkEnergyRingSystem
    /---- Strands (skin) - LinkVisualLanguageIntegration - WaveTravelShaderPack
    /----- LinkAuraShader
    /------ LinkPulseRing - LinkRingArcDischarge - LinkPulseDustEmitter
    /------- PARTICLES (LinkSparkSystem + LinkTrailParticleSystem + LinkCorruptionParticleSystem + LinkHealingParticleSystem + LinkCorruptionSpreadAnimator)
    /-------- LinkResonanceFlowSystem_Session124.js
    /--------- LinkSemanticPictogramSystem_WithFusion


### 1.1. LinkResonanceFlowSystem_Session124.js

**Type**: 🎨 GEOMETRY/MESH EMITTER

**Scene Additions**:
- `LinkResonancePulses_Session124` group containing:
  - Pulse mesh rigs (Sphere + Octahedron + Cylinder combinations)
  - Pulse sheath geometry
  - Pulse trail geometry
  - Overload indicators (rotating geometry)
- Object pool for efficient mesh reuse (pre-allocated up to maxTotalPulses)

**What it Does**:
- Creates pulsing directional energy flows along links
- Pulses travel from source to destination node
- Pulse speed modulated by loadPressure and activity
- Multi-pulse support (multiple energy packets per link)
- Bidirectional flow capability

**Wiring**:
- Driven through `update(deltaTime, links, camera)` each visual frame
- Reads: `link.userData.metrics` with fallbacks to `link.userData.loadPressure`, `link.userData.flowState`, and endpoint node averages
- Uses: `VisualTime` for canonical visual clock and `VisualHierarchyRegistry` for renderOrder
- Updates: pulse mesh positions, appearance, lifetime, and LOD suppression based on camera distance
- Trigger integration: `EchoRippleIntegrationPatch_Session125.js` can hook `spawnRippleOnWaveBurst(link)` and `spawnRippleOnCascadeHop(node, intensity)` onto wave and cascade events

**Trigger conditions**:
- Periodic pulse spawning via internal repeat timer (`repeatPulseIntervalSeconds`)
- Load pressure above `loadPressureVisualStart` enables visible flow
- Overload state when loadPressure > `loadPressureOverloadThreshold`
- Stability floor pulses when link stability is high enough to guarantee deterministic bursts
- Capped by `maxPulsesPerLink` (default: 8) and `maxTotalPulses` (default: 1024)

**Submetrics Read**:
- `link.userData.metrics.loadPressure`
- `link.userData.metrics.corruption`
- `link.userData.metrics.synergy`
- `link.userData.metrics.stability`
- fallback values from `link.source.userData.metrics` and `link.target.userData.metrics`
- Node positions (source/target)

---

### 1.2. ResonanceEchoTrailSystem.js

**Type**: 🎨 GEOMETRY/MESH EMITTER

**Scene Additions**:
- `ResonanceEchoTrailRoot` group containing:
  - Echo pool of circular geometry (CircleGeometry, 8 segments)
  - Up to 30 echo instances (silhouette imprints)
  - Debug visualization (optional, spheres and ring loops)
- Object pool for efficient echo reuse

**What it Does**:
- Creates harmonic afterimages following composite glyph movement
- Echoes are stationary memory imprints that fade quietly
- Temporal persistence of meaning, not motion blur
- Spawns when composite glyphs move or dissolve

**Wiring**:
- Subscribes: `semanticBus.on('wave.burst.lifecycle', handler)` and `semanticBus.on('wave.packet.spawn', handler)`
- Uses: `VisualTime` canonical clock and optional `frameScheduler?.shouldRunVisual?.()` gating
- Resolves event payloads via `_resolveBurstPayload(event)` to extract center, intensity, and event state
- Tracks: composite glyph history and spawns static echo instances from resolved burst centers
- Updates: echo opacity, lifetime, geometry, and pool reuse
- Console API: `window.game.echoStatus()`, `window.game.enableEchoTrails()`, `window.game.disableEchoTrails()`, `window.game.toggleEchoDebug()`

**Trigger events**:
- `wave.burst.lifecycle` for burst lifecycle completions
- `wave.packet.spawn` for packet spawn events
- Each resolved event may spawn a new echo if it contains a valid center and intensity
- Echo metrics are sourced from event state payload fields such as `state.harmony`, `state.synergy`, `state.corruption`, and `state.stability`

**Submetrics Read**:
- `composite.state.harmony`
- `composite.state.synergy`
- `composite.state.corruption`
- `composite.state.stability`
- `event.intensity` (from wave burst events)
- Event center position

---

### 1.3. HarmonicResonanceCoupling_v1.js

**Type**: 🎨 GEOMETRY/MESH EMITTER (Transient Particles)

**Scene Additions**:
- Resonance particles (energy packets flowing between nodes)
- Particle trail geometry (transient, no persistent meshes)
- No persistent scene additions - particles are transient visual effects

**What it Does**:
- Creates pulsing directional energy flows along links
- Visual resonance particles flow between nodes
- Node auras shimmer in sync (phase coupling)
- Link becomes visual conduit for harmonic energy

**Wiring**:
- Reads: `getLinkSynergy(link)` from `SemanticMetricAdapter.js`
- Exposed API: `registerLink(link)`, `unregisterLink(link)`, and `update(deltaTime, avgSynergy)`
- Reads: node harmony, node synergy, linked node count, and active link connectivity
- Updates: resonance particle positions, node shimmer, link glow modulation, and particle trail emission each frame
- Console API: `window.HarmonicResonanceCoupling_v1`

**Trigger conditions**:
- Activated during the per-frame update loop when connected nodes meet visual thresholds
- Requires: both linked nodes satisfying harmony > 0.50 and synergy > 0.50
- Optional bidirectional flow when `config.bidirectional` is enabled
- Intensity and frequency scale up with network synergy

**Submetrics Read**:
- `link.synergy` (via `getLinkSynergy()`)
- `node.userData.metrics.harmony`
- `node.userData.metrics.synergy`
- Linked node count
- Node positions

---

### 1.4. CascadeResonanceWaveVisualization_Session146.js

**Type**: 🎨 GEOMETRY/MESH EMITTER

**Scene Additions**:
- `CascadeWaveGroup` containing:
  - Wave propagation visualization (ring/radial geometry)
  - Resonance coupling lines between hubs
  - Subtle energy flow indicators
  - Ghost-level wave suggestion geometry
- Creates "pressure" effect along links (metadata-based, not visible geometry)

**What it Does**:
- Visualizes resonance waves between harmonic hubs
- Shows energy pathways and interference patterns
- Provides subtle visual cues without gameplay impact
- Ghost-level temporal modulation without visible motion

**Wiring**:
- Subscribes: `semanticBus.on('cascade.start', onCascadeStart)` and `semanticBus.on('cascade.hop', onCascadeHop)`
- Resolves event payloads from fields such as `sourceNode`, `source`, `targetNode`, `target`, and ID variants
- Managed by: `HarmonicCascadeAmplification_Session145`
- Updates via: `update(deltaTime)` and internal `activeWaves` map state
- Console API: `window.CASCADE_WAVE_STATS`

**Trigger conditions**:
- `cascade.start` events instantiate latent wave activation paths
- `cascade.hop` events reinforce ongoing wave propagation
- Requires: source/target hub phase sync, minimum hub stability, and low corruption below configured thresholds
- Wave influence is applied as temporal modulation only, not as visible geometry

**Submetrics Read**:
- `hub.harmonicPhase`
- `pair.proximityStrength`
- `hub.userData.metrics.harmony`
- `hub.userData.metrics.synergy`
- Hub positions
- Distance between hubs

---

### 1.5. T2_HarmonyVisualConsumer_v1.js

**Type**: 🎨 GEOMETRY/MESH EMITTER (Archived)

**Scene Additions**:
- High-harmony node auras (sphere/ring geometry)
- Oasis bloom zones around harmony clusters
- Healing pulse emitters from high-harmony nodes
- Legacy geometry created directly without canonical visual authority

**What it Does**:
- Renders visual harmony feedback from `HarmonyStabilizationSystem_v1`
- Creates cyan aura fields around nodes with strong harmony
- Spawns soft oasis zones for high harmony regions
- Emits healing pulses from nodes above harmony thresholds

**Wiring**:
- Read-only consumer of harmony runtime state
- Uses: `VisualHierarchyRegistry` for render order
- Attached via legacy scene geometry rather than `VisualTemplateResolver`
- Source file: `src/legacy/T2_HarmonyVisualConsumer_v1.js`

**Trigger conditions**:
- Node harmony exceeds `harmonyFieldThreshold`
- Healing pulses emit when harmony exceeds `pulseThreshold`

**Submetrics Read**:
- Harmony values from `HarmonyStabilizationSystem_v1`
- Node world positions
- Link/node connectivity for aura placement

---

### 1.6. ResonanceCascadeVisualization_Session117B.js

**Type**: 🎨 GEOMETRY/MESH EMITTER

**Scene Additions**:
- `ResonanceCascadeVisualization_Session117B_Root` group
- Shared `SphereGeometry` and `TorusGeometry` visual markers
- Cascade visual groups for radial and link-based propagation
- Optional node glow and link distortion meshes

**What it Does**:
- Visualizes link-born resonance blooms and load-pressure surges
- Spawns radial energy waves and link-propagation ripple visuals
- Illuminates affected nodes and distorts links under cascade stress
- Uses mesh groups and shaders for transient cascade geometry

**Wiring**:
- Subscribes to semantic events: `link.created` and `global.loadPressure.high`
- Reads: link birth data, load pressure spikes, cascade intensity
- Uses: Three.js `Group`, shared geometries, and shader materials
- Registers a scene root group and updates visual meshes each frame

**Trigger conditions**:
- New link creation events
- Global load pressure high events
- Load-pressure cascades and link birth cascades

**Submetrics Read**:
- link load pressure and cascade intensity
- affected node illumination weights
- link born cascade event payloads
- propagation mode / radial vs link-based visual state

---

## 2 CASCADE VFX

### 2.1. SYNERGY CASCADE VISUALIZER
**File:** `SynergyCascadeVisualizer.js`

**Adds Real Geometry:** ✅ YES

**Visual Elements Created:**
- **Flow Particles:** `THREE.Mesh` (SphereGeometry) - Directional particles along cascade paths
  - Pool size: 500 particles
  - Geometry: `new THREE.SphereGeometry(0.06, 6, 6)`
  - Material: `MeshBasicMaterial` with additive blending
  - Added to scene: `this.scene.add(mesh)`

- **Ripple Effects:** `THREE.Line` (BufferGeometry) - Expanding rings from cascade sources
  - Geometry: Dynamic `BufferGeometry` with 32 segments
  - Material: `LineBasicMaterial` with transparency
  - Added to scene: `this.scene.add(rippleLine)`

**Visual Types:**
1. Wave Front - Animated pulse along links
2. Cascade Glow - Progressive brightness intensification
3. Flow Particles - Directional particles following cascade paths
4. Burst Particles - Compact burst at cascade start/hop
5. Ripple Effect - Concentric rings expanding from cascade source
6. Harmonic Shimmer - Oscillating color bands along links

**Data Source:** Reads `cascade.hop` events from semanticBus

**Performance:**
- Particles: 500 max pool size
- Update frequency: Every frame (skippable via config)
- Typical runtime: <3ms per frame

---

### 2.2. CASCADE PARTICLE SYSTEM (Session 120)
**File:** `CascadeParticleSystem_Session120.js`

**Adds Real Geometry:** ✅ YES

**Visual Elements Created:**
- **GPU Particle System:** `THREE.Points` - Semantic particle encoding
  - Pool size: 3000 particles
  - Geometry attributes: `positions[3]`, `colors[3]`, `sizes[1]`, `shapeIndices[1]`, `angles[1]`
  - CPU-driven motion with shader-driven shape selection
  - Texture atlas for shapes (arcs, forks, shards, blobs)

**Shape Encoding (Conflict Types):**
- Phase Conflict (0) → Arcs/Crescents (Out of sync)
- Polarity Conflict (1) → Forked/Split (Opposing intent)
- Corruption Conflict (2) → Fractured Shards (Structural damage)
- Stability Conflict (3) → Irregular Blobs (Unreliable)

**Velocity Encoding:**
- Forward Flow → Dominant propagation
- Backflow → Resistance/Absorption
- Oscillatory → Stalemate/Negotiation

**Data Source:** Connected to cascade controller via `HarmonicCascadeAmplification_Session145` and link lifecycle source
- Binds link lifecycle callbacks through `attachLinkLifecycleSource(linkingSystem)`
- Handles `onLinkCreated`, `onLinkUpdated`, and `onLinkDestroyed` / `onLinkRemoved`

**Performance:**
- Single GPU draw call
- Zero per-frame allocations
- Object pooling

---

### 2.3. CASCADING RUPTURE SYSTEM
**File:** `CascadingRuptureSystem.js`

**Adds Real Geometry:** ⚠️ MODIFIES EXISTING

**Purpose:** Visualizes rupture energy propagating across network regions

**What It Does:**
- Detects cascade opportunities based on corruption/stability
- Propagates rupture energy through network hops
- Triggers visual effects on links and nodes

**Visual Effects (Modifies Existing):**
1. **Tear** - Phase destabilization along links
   - `link.userData.visualTear` - Phase destabilization
   - Modifies link material properties
   
2. **Destabilize** - Phase destabilization on nodes
   - `node.userData.visualDestabilization` - Stability disruption
   
3. **Coherence Loss** - Sudden coherence loss
   - `link.userData.visualCoherenceLoss` - Link dimming/flicker

**Visual Impact:** Modifies existing link/node materials, does not create new geometry

**Performance:**
- Max active cascades: 8
- Visual pool size: 32 pre-allocated effects

---

## 3 WAVES

### 3.1. StandingWaveVisualRenderer_Session131.js

**Type**: 🎨 GEOMETRY/MESH EMITTER

**Scene Additions**:
- `StandingWaveRing` group containing:
  - Ring geometry (Torus/Ring)
  - Multiple concentric rings for standing wave visualization
  - Shader material for animated wave patterns

**What it Does**:
- Visualizes standing waves between harmonic nodes
- Creates concentric ring patterns that pulse and interfere
- Renders wave interference patterns in real-time

**Wiring**:
- Reads: Node positions, harmonic states, wave field data
- Registers with: `VisualHierarchyRegistry` for render order
- Updates via: `update(deltaTime, harmonicData)`

**Emission Conditions**:
- Activated when harmonic nodes are in resonance state
- Requires: Node harmony > threshold, proximity to other harmonic nodes
- Standing wave detection from `StandingWaveOscillationTrapSystem`

**Submetrics Read**:
- `node.userData.metrics.harmony`
- `node.userData.metrics.synergy`
- `node.harmonicPhase`
- `waveField.amplitude`
- `waveField.phase`
- `waveField.standing`
- Node position (for ring placement)

---

### 3.2.  OscillationTrapVisualSystem_Session132.js

**Type**: 🎨 GEOMETRY/MESH EMITTER

**Scene Additions**:
- `OscillationTrap` visual group containing:
  - Energy containment fields (sphere geometry)
  - Oscillation indicators (ring/pulse geometry)
  - Trap boundary visualization

**What it Does**:
- Detects and visualizes standing wave oscillation traps
- Creates energy containment fields where waves interfere constructively
- Shows harmonic energy trapped in standing wave patterns

**Wiring**:
- Reads: Wave interference patterns from wave engine
- Triggers: Standing wave visual renderer
- Registers with: `VisualHierarchyRegistry`

**Emission Conditions**:
- Standing wave detected (constructive interference sustained > 1.0s)
- Wave amplitude > threshold
- Phase alignment between multiple wave sources
- Triggered by: `wave.burst.lifecycle` events

**Submetrics Read**:
- `waveField.amplitude`
- `waveField.phase`
- `waveField.standing`
- `waveField.sourceCount`
- Wave source positions
- Wave amplitude envelope

---

### 3.3. ResonanceRuptureVisualSystem_Session133.js

**Type**: 🎨 GEOMETRY/MESH EMITTER

**Scene Additions**:
- Stress indicator meshes and banding along links
- Rupture burst meshes and propagation pulses
- Resonance scar overlays on ruptured links
- Node halo destabilization effects

**What it Does**:
- Visualizes standing wave collapse and rupture events
- Builds pre-rupture stress indicators from standing-wave state
- Triggers directional rupture propagation along network paths
- Leaves behind fading resonance scars after rupture

**Wiring**:
- Reads: `StandingWaveOscillationTrapSystem`, `InfluenceReflectionBackPressureSystem`, `AINodes`, and `linkingSystem`
- Uses: `VisualHierarchyRegistry` for render order
- No gameplay logic changes; visual-only rupture feedback

**Trigger conditions**:
- High stress accumulation above `stressRuptureThreshold`
- Phase divergence beyond configured threshold
- High standing-wave amplitude and corruption/instability influence
- Rupture cooldowns prevent repeated visual spam

**Submetrics Read**:
- Trap stress/energy from standing-wave state
- Link corruption and instability values
- Node harmony and phase coherence
- Reflection/back-pressure metrics

---

### 3.4. HarmonicRecoveryVisualSystem_Session138.js

**Type**: 🎨 GEOMETRY/MESH EMITTER

**Scene Additions**:
- Coherence wave meshes for recovered zones
- Link re-stitching visuals on healed links
- Node recovery halos with soft fade
- Shader-based recovery ring materials

**What it Does**:
- Represents network repair after rupture events
- Spawns slow recovery waves and inner node halos
- Orchestrates re-alignment visuals based on harmony state
- Read-only adapter for healing visual feedback

**Wiring**:
- Subscribes to `semanticBus.subscribe('link.harmony.high')` and `semanticBus.subscribe('link.harmony.mid')`
- Reads: rupture completion state, link harmony, node positions
- Uses: `VisualTime` and `VisualHierarchyRegistry`
- Integrates with outreach recovery visuals and healing particles

**Trigger conditions**:
- High harmony link events trigger coherence waves
- Mid-level harmony events trigger re-stitching visuals
- Recovery visuals are gated by per-link cooldowns

**Submetrics Read**:
- Link harmony state
- Rupture event identifiers and healed zone state
- Node position and link endpoints
- Recovery duration and visual life progress

---

## 4 PARTICLES

### 4.1. CascadeParticleSystem_Session120.js

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

### 4.2. HealingParticleSystem_Session136.js

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

### 4.3. T2_CorruptionVisualIntegration_v1.js

**Type**: 🎨 PARTICLE SYSTEM

**Scene Additions**:
- `T2_CorruptionParticlePool` instanced tetrahedron meshes
- Cyan aura instances for corruption influence
- Aura mesh and particle root container
- Legacy instanced mesh particle pool with dynamic instance matrices

**What it Does**:
- Emits corruption feedback particles and link bursts
- Visualizes high-corruption nodes with chaos sparks and aura glows
- Uses link/node positions to place pooled particles and LOD-driven persistence
- Provides corruption-only visual layer without gameplay changes

**Wiring**:
- Subscribes to semantic bus `node.corruption.high`
- Reads: node ID, corruption intensity, source/target world positions
- Uses: `linkingSystem` for link resolution and optional `aiNodes` node lookup
- Outputs: instanced particle matrices and per-instance color state

**Trigger conditions**:
- `node.corruption.high` semantic events trigger corruption pulses
- Burst intensity scales with configured corruption severity
- Per-node and per-link LOD gating limits particle emission at distance

**Submetrics Read**:
- `nodeId` and corruption level
- link spatial midpoint for LOD
- node world positions and target anchors
- corruption intensity mapped to red/orange particle color

---

### 4.4. WaveParticleEmitter_v1.js

**Type**: 🎨 PARTICLE SYSTEM

**Scene Additions**:
- GPU-batched `THREE.Points` systems for constructive burst sparks
- Destructive chaos spark systems
- Standing wave ripple point systems
- Full family pools for three particle categories

**What it Does**:
- Emits wave-reactive particles for constructive, destructive, and standing-wave states
- Encodes network state in visual families: cyan-white synergy sparks, orange-red chaos, and ripple rings
- Uses GPU batching and instanced point geometry for high-performance particle counts
- Keeps zero allocations after initialization via pooled particle data arrays

**Wiring**:
- Uses `LinkPointFXBase` and `VisualHierarchyRegistry` for render layer integration
- Subscribes to semantic bus and direct metric-tier listeners for amplitude and wave state
- Tracks node/link IDs, emission gate timers, and amplitude EMA per node
- Drives particle families with real-time network wave metrics

**Trigger conditions**:
- Constructive bursts when amplitude exceeds `constructiveThreshold`
- Destructive chaos bursts when amplitude exceeds `destructiveThreshold`
- Standing wave ripples when amplitude crosses `standingWaveThreshold`
- Amplitude spikes and link mode state modulate emission intensity

**Submetrics Read**:
- wave amplitude and node metric tiers
- link mode emission state and node IDs
- amplitude EMA for spike detection
- node and link world positions for particle emission placement

---

### 4.5. ParticleTrailSystem_Session122.js

**Type**: 🎨 PARTICLE SYSTEM / MESH EMITTER

**Scene Additions**:
- `ParticleTrails_Session122` `THREE.Points` trail mesh
- Trail buffer geometry attributes: position, color, size, age, length
- ShaderMaterial for trail fade and glow
- Trail particle pool and reusable trail data structures

**What it Does**:
- Renders motion trails for fast-moving forward-flow particles
- Encodes velocity as trail length and opacity
- Draws directional flow streaks using particle points and shader trails
- Maintains zero per-particle allocations through pooling

**Wiring**:
- Works with `CascadeParticleSystem_Session120` and reads source particle pool
- Calls `scene.add(this.trailMesh)` during initialization
- Updates trails via `update(deltaTime, source, activeParticleCount)`
- Uses particle history and velocity to spawn new trail points

**Trigger conditions**:
- Forward flow particle emission from cascade system
- Particle speed above threshold and `flowType = 'Forward'`
- Trail spawn rate controlled by `trailEmissionRate`

**Submetrics Read**:
- particle velocity and flow direction
- trail length factor and age
- active particle count from source system
- particle color inheritance and fade state

---

## 5 SYNERGY VFX

### 5.1. SynergyHighwayVisuals3D_1_0.js
**Type:** 🎨 GEOMETRY/MESH EMITTER

**Scene Additions:**
- 3D arc/ribbon highway meshes connecting category clusters
- `TubeGeometry` flow meshes with animated UV shader scrolling
- Optional bloom/glow halo layers for critical routes
- Debug anchors for category positions and highway endpoints

**What it Does:**
- Renders real-time synergy highways from aggregated route data
- Drives width, color, speed, and bloom from link synergy metrics
- Updates highway geometry on data refresh and in the per-frame visual update loop

**Wiring:**
- Reads: `linkingSystem.links`, `link.userData.synergy`, `link.userData.cascadeStrength`
- Uses: `CatmullRomCurve3`, `TubeGeometry`, and shader-based flow animation
- Integrates with: `scene`, `renderer`, optional `historyTracker`, and category anchor computation

**Trigger conditions:**
- Highway data changes or explicit `refreshFromHighways()` calls
- Periodic rebuild/update cycles driven by route aggregation updates

**Submetrics Read:**
- `link.userData.synergy`
- `link.userData.cascadeStrength`
- trend/volatility from highway history
- category anchor positions derived from node categories

---

### 5.2. SynergyChainReaction_v1.js
**Type:** 🎨 EVENT-DRIVEN VISUAL LOGIC

**Scene Additions:**
- No direct geometry by default, but emits link/node reaction events
- Enables downstream shader/mesh systems to visualize chain reactions
- Supports event objects for link intensity, frequency, direction, and hop index

**What it Does:**
- Propagates synergy chain reactions through connected nodes and links
- Detects high-synergy nodes and spreads secondary/tertiary visual reaction events
- Applies decay per hop and limits propagation depth for stability

**Wiring:**
- Uses internal node state via `WeakMap` and per-frame cadence gating
- Reads: node synergy, resonance similarity, personality compatibility, link visual metrics
- Outputs: reusable link/node event payloads for shader integration

**Trigger conditions:**
- Node synergy crossing `primaryThreshold` (default ~0.75)
- Each hop propagates only if intensity stays above minimum and resonance remains compatible
- Stops when intensity < 0.1 or hop count > 8

**Submetrics Read:**
- node synergy and resonance similarity
- `link.userData.visualMetrics.synergyBonus`
- node personality compatibility and chain state

---

## 6 HARMONY VFX

### 6.1. HarmonicNodeResonanceHalos.js
**Type:** 🎨 GEOMETRY/MESH EMITTER

**Scene Additions:**
- Soft resonance halo meshes attached to harmonic hub nodes
- Emissive materials with phase-synced breathing and pulse modulation
- Single cached halo mesh per node, no per-frame geometry allocation

**What it Does:**
- Visualizes harmonic hub authority, stability, and health through halos
- Activates when nodes have sufficient active links and synchronization strength
- Modulates halo distortion based on harmony, synergy, corruption, and recovery

**Wiring:**
- Reads: hub phase, active link count, synchronization strength, resilience state
- Subscribes to semantic/harmony events and updates cached halo materials
- Uses: cached geometry/material and deterministic phase computation

**Trigger conditions:**
- `activeLinkCount >= 2` and `hubSynchronizationStrength > 0`
- Higher harmony levels increase clarity and smoothness
- Corruption/stress introduces wobble, distortion, and flicker

**Submetrics Read:**
- harmony, synergy, corruption, stability, resilience
- hub phase frequency and alignment
- active link density around the node

---

## 7 CORRUPTION VFX

### 7.1. CorruptionVisualFX_v1.js
**Type:** 🎨 GEOMETRY/MESH FX LAYER

**Scene Additions:**
- Dynamic color tinting and glow on corrupted nodes/links
- Shader UV distortion, warping, and mesh jitter effects
- `CorruptionVisualFX_Particles` group for chaos particle emission
- Delegates particle handling to `T2_CorruptionVisualIntegration_v1`

**What it Does:**
- Visualizes corruption progression from subtle to extreme
- Applies visual distortion, glow flicker, and particle feedback
- Uses `VisualTime` for canonical timing and safe THREE.js fallback

**Wiring:**
- Initialized via `new CorruptionVisualFX_v1(this.scene, this.aiNodes, false)`
- Reads corruption from: `nodeModel.userData.metrics.corruption`, `gameplay.corruptionLevel`, `userData.corruption`
- Does not bind direct semantic listeners in current shell; particle pulses are delegated to T2 integration
- `triggerCorruptionPulse(nodeId)` forwards to `T2_CorruptionVisualIntegration_v1.triggerCorruptionPulse`

**Trigger conditions:**
- corruption thresholds at ~0.25, 0.45, 0.65, 0.85
- `CASCADE_CORRUPTION_THRESHOLD` (0.35) enables stronger particle/chaos effects

**Submetrics Read:**
- node/link corruption values and flags
- high corruption state markers like `corruptionHigh` and `isCorrupted`
- cascade corruption state and per-node visual intensity

---

## 8 LINK / SCENE VISUAL LAYER FX

### 8.1. NeonLinkVisuals.js
**Type:** 🎨 ACTIVE LINK RENDERER

**Scene Additions:**
- Neon line meshes, glow rings, and data flow particles for links
- Shared material and particle pools for efficient link rendering
- Active render controller for core link visuals in the engine

**What it Does:**
- Serves as the canonical link visualization system, not a legacy fallback
- Renders link glow, segment effects, and event-driven pulses
- Provides the baseline link visual layer used by multiple downstream systems

**Wiring:**
- Instantiated in `NodeLinkingSystem.js`
- Used by `LinkMetricsToVisualBridge_v1.js`, `VisualEchoTrails_v1_Integration.js`, and engine debug tooling
- Tagged by `Engine/Debug/ShaderVariantDetector.js` as the active link visual authority

**Trigger conditions:**
- Always active when `NodeLinkingSystem` is initialized
- Link visuals update from link state, synergy, corruption, and flow metrics
- Can be augmented by optional overlays such as `AnimatedLinkFlow` and `VisualUpgradeSuperpack`

**Notes:**
- This is the live core link renderer in the current runtime
- It is not a deprecated legacy renderer

---

### 8.2. AnimatedLinkFlow.js
**Type:** 🎨 OPTIONAL / FEATURE-FLAGGED LINK FLOW LAYER

**Scene Additions:**
- Data packet meshes traveling along link curves
- Beam line geometry and trail meshes
- Secondary flow path curls and animated carrier streams

**What it Does:**
- Provides an optional data-flow visualization for links
- Augments core link rendering with moving packets and beams
- Useful for debugging or high-fidelity flow presentation

**Wiring:**
- Imported and optionally instantiated in `NodeLinkingSystem.js`
- Controlled by `globalThis?.ATOMA_ENABLE_ANIMATED_LINK_FLOW !== false`
- Console API installed through `setupAnimatedLinkFlowConsoleAPI`

**Trigger conditions:**
- Enabled only when the feature flag is not explicitly disabled
- Flow visuals update each frame from link motion and network traffic

**Notes:**
- This system appears partially dormant/optional, but it is still integrated and callable
- It is not currently the default core renderer unless the flag permits it

---

### 8.3. LinkBeadVisualEffects.js
**Type:** 🎨 BEAD EFFECT LAYER

**Scene Additions:**
- Optional bead trails using line geometry
- Pulsing glow modulation for bead meshes
- Rotation and environment-reaction effects on bead visuals

**What it Does:**
- Enhances link bead presentation with subtle trail and pulse effects
- Operates as a supplement to the primary link visual stack

**Wiring:**
- Imported by `LinkBeadSystem`
- Adds bead trail lines to parent bead meshes when enabled
- Uses `THREE.Line` geometry for trails and `MeshBasicMaterial` for pulses

**Trigger conditions:**
- Enabled only when bead effects are configured on
- Trail geometry is created if `effectsConfig.trails.enabled` is true

---

### 8.4. TopologyBiasVisualizationLayer.js
**Type:** 🎨 ACTIVE SCENE / TOPOLOGY LAYER

**Scene Additions:**
- Instanced bias vector meshes rendered as thin tapered line segments
- Flow field region visuals using low-resolution grid geometry
- Subtle spatial drift and contextual highlight geometry

**What it Does:**
- Visualizes long-term topology learning as preferred directional bias
- Makes network flow bias perceptible without adding noise
- Aligns nearby field vectors during active influence

**Wiring:**
- Instantiated in `main.js` via `new TopologyBiasVisualizationLayer(...)`
- Draws from `HarmonicTopologyLearningSystem` and world topology state
- Uses a dedicated render layer and update timing outside core link geometry

**Trigger conditions:**
- Enabled by topology learning readiness
- Updates every 0.2s for vectors and 1.0s for coarse flow field cells
- Locally sharpens when influenced by active network movement

---

### 8.5. VisualUpgradeSuperpack.js
**Type:** 🎨 ACTIVE SCENE ENHANCEMENT PACK

**Scene Additions:**
- Volumetric light cones, atmospheric layers, holographic edge glow, and distortion zones
- Cinematic color grading, bloom, chromatic shimmer, and dream particle geometry
- Multiple mesh-based enhancement packs layered on top of the existing scene

**What it Does:**
- Provides global visual polish across the engine
- Adds non-destructive enhancement layers without altering gameplay logic
- Improves ambience, depth, and overall presentation quality

**Wiring:**
- Instantiated in `main.js` via `new VisualUpgradeSuperpack(...)`
- Updated through the frame scheduler and applied via `applyFullUpgrade()`
- Uses `THREE.Mesh` and shader materials to augment scene presentation

**Trigger conditions:**
- Applied during visual superpack setup in main initialization
- Active whenever the visual superpack is instantiated

---

### 8.6. PHASE5_CascadeVisuals.js
**Type:** 🎨 CONSOLIDATED CASCADE VISUAL SYSTEM

**Scene Additions:**
- Expanding ring meshes for cascade propagation
- Bridge and inter-network visualization layers for cross-network cascades
- Pooling-enabled ring geometry with varying color and intensity

**What it Does:**
- Visualizes cascade propagation through networks using ring effects
- Exposes a consolidated visual bridge for corruption and harmony cascades
- Supports multi-network cascade linking with graceful dependency fallback

**Wiring:**
- Consolidated from `PHASE5_CascadeVisualizationBridge_v1.js`, `PHASE5_CascadePropagationVisuals_v1.js`, and `PHASE5_InterNetworkVisualizationBridge_v1.js`
- Subscribes to semantic cascade events and scene state
- Creates rings on cascade trigger and reuses pooled geometry

**Trigger conditions:**
- Triggered by cascade events, hop propagation, and inter-network influence
- Respects activation thresholds and max active rings for performance
