# VIZUALNE EFEKTY VFX

Kompletný katalóg viditeľných VFX efektov v ATOMA. Dokument dokumentov pre všetky vizuálne systémy, ktoré spracovávajú vizuálnu informáciu v hr.

---

## STRUKTÚRA

0. LINK VISUAL VFX
1. RESONANCE VFX
2. CASCADE VFX
3. WAVES
4. PARTICLES
5. SYNERGY VFX
6. HARMONY VFX
7. CORRUPTION VFX
8. RITUAL VFX
9. SYNERGY VFX ENGINE
10. ARCHETYPE VFX
11. COLONY VFX
12. DREAM EFFECTS

---

## 0 LINK VISUAL VFX

### 0.1 LinkRendererConduit.js

**Type**: 🎨 CORE LINK RENDERER

**Scene Additions**:
- Directional streaks (LinkPulseWaveInjector, LinkStreakColorDynamics, LinkDirectionalGradientPolish)
- Link bead system (LinkBeadSystem, LinkBeadTrailSystem, LinkEnergyRingSystem)
- Link strands (skin, LinkVisualLanguageIntegration, WaveTravelShaderPack)
- Link aura shader
- Link pulse effects (LinkPulseRing, LinkRingArcDischarge, LinkPulseDustEmitter)
- Link particles (LinkSparkSystem, LinkTrailParticleSystem, LinkCorruptionParticleSystem, LinkHealingParticleSystem)

**What it Does**:
- Serves as canonical link visualization system
- Renders link glow, segment effects, and event-driven pulses
- Provides baseline link visual layer used by multiple downstream systems

**Wiring**:
- Instantiated in NodeLinkingSystem.js
- Used by LinkMetricsToVisualBridge_v1.js, VisualEchoTrails_v1_Integration
- Tagged by ShaderVariantDetector.js as active link visual authority

**Trigger conditions**:
- Always active when NodeLinkingSystem is initialized
- Link visuals update from link state, synergy, corruption, flow metrics

**Notes**:
- Live core link renderer in current runtime
- Not a deprecated legacy renderer

---

### 0.2 AnimatedLinkFlow.js

**Type**: 🎨 OPTIONAL LINK FLOW LAYER

**Scene Additions**:
- Data packet meshes traveling along link curves
- Beam line geometry and trail meshes
- Secondary flow path curls and animated carrier streams

**What it Does**:
- Provides optional data-flow visualization for links
- Augments core link rendering with moving packets and beams
- Useful for debugging or high-fidelity flow presentation

**Wiring**:
- Imported and optionally instantiated in NodeLinkingSystem.js
- Controlled by globalThis.ATOMA_ENABLE_ANIMATED_LINK_FLOW !== false
- Console API: setupAnimatedLinkFlowConsoleAPI

**Trigger conditions**:
- Enabled only when feature flag is not explicitly disabled
- Flow visuals update each frame from link motion and network traffic

**Notes**:
- System appears partially dormant/optional but still integrated and callable
- Not current default core renderer unless flag permits

---

### 0.3 LinkBeadVisualEffects.js

**Type**: 🎨 BEAD EFFECT LAYER

**Scene Additions**:
- Optional bead trails using line geometry
- Pulsing glow modulation for bead meshes
- Rotation and environment-reaction effects on bead visuals

**What it Does**:
- Enhances link bead presentation with subtle trail and pulse effects
- Operates as supplement to primary link visual stack

**Wiring**:
- Imported by LinkBeadSystem
- Adds bead trail lines to parent bead meshes when enabled
- Uses THREE.Line geometry for trails and MeshBasicMaterial for pulses

**Trigger conditions**:
- Enabled only when bead effects configured on
- Trail geometry created if effectsConfig.trails.enabled is true

---

### 0.4 TopologyBiasVisualizationLayer.js

**Type**: 🎨 ACTIVE SCENE / TOPOLOGY LAYER

**Scene Additions**:
- Instanced bias vector meshes rendered as thin tapered line segments
- Flow field region visuals using low-resolution grid geometry
- Subtle spatial drift and contextual highlight geometry

**What it Does**:
- Visualizes long-term topology learning as preferred directional bias
- Makes network flow bias perceptible without adding noise
- Aligns nearby field vectors during active influence

**Wiring**:
- Instantiated in main.js via new TopologyBiasVisualizationLayer(...)
- Draws from HarmonicTopologyLearningSystem and world topology state
- Uses dedicated render layer and update timing outside core link geometry

**Trigger conditions**:
- Enabled by topology learning readiness
- Updates every 0.2s for vectors and 1.0s for coarse flow field cells
- Locally sharpens when influenced by active network movement

---

### 0.5 VisualUpgradeSuperpack.js

**Type**: 🎨 ACTIVE SCENE ENHANCEMENT PACK

**Scene Additions**:
- Volumetric light cones, atmospheric layers, holographic edge glow, distortion zones
- Cinematic color grading, bloom, chromatic shimmer, dream particle geometry
- Multiple mesh-based enhancement packs layered on existing scene

**What it Does**:
- Provides global visual polish across engine
- Adds non-destructive enhancement layers without altering gameplay logic
- Improves ambience, depth, and overall presentation quality

**Wiring**:
- Instantiated in main.js via new VisualUpgradeSuperpack(...)
- Updated through frame scheduler and applied via applyFullUpgrade()
- Uses THREE.Mesh and shader materials to augment scene presentation

**Trigger conditions**:
- Applied during visual superpack setup in main initialization
- Active whenever visual superpack instantiated

---

### 0.6 PHASE5_CascadeVisuals.js

**Type**: 🎨 CONSOLIDATED CASCADE VISUAL SYSTEM

**Scene Additions**:
- Expanding ring meshes for cascade propagation
- Bridge and inter-network visualization layers for cross-network cascades
- Pooling-enabled ring geometry with varying color and intensity

**What it Does**:
- Visualizes cascade propagation through networks using ring effects
- Exposes consolidated visual bridge for corruption and harmony cascades
- Supports multi-network cascade linking with graceful dependency fallback

**Wiring**:
- Consolidated from PHASE5_CascadeVisualizationBridge_v1.js, PHASE5_CascadePropagationVisuals_v1.js, PHASE5_InterNetworkVisualizationBridge_v1.js
- Subscribes to semantic cascade events and scene state
- Creates rings on cascade trigger and reuses pooled geometry

**Trigger conditions**:
- Triggered by cascade events, hop propagation, inter-network influence
- Respects activation thresholds and max active rings for performance

---

### 0.7 LinkResonanceFlowSystem_Session124.js

**Type**: 🎨 GEOMETRY/MESH EMITTER

**Scene Additions**:
- LinkResonancePulses_Session124 group containing:
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
- Driven through update(deltaTime, links, camera) each visual frame
- Reads: link.userData.metrics with fallbacks to link.userData.loadPressure, link.userData.flowState, endpoint node averages
- Uses: VisualTime for canonical visual clock and VisualHierarchyRegistry for renderOrder
- Updates: pulse mesh positions, appearance, lifetime, LOD suppression based on camera distance
- Trigger integration: EchoRippleIntegrationPatch_Session125.js can hook spawnRippleOnWaveBurst(link) and spawnRippleOnCascadeHop(node, intensity) onto wave and cascade events

**Trigger conditions**:
- Periodic pulse spawning via internal repeat timer (repeatPulseIntervalSeconds)
- Load pressure above loadPressureVisualStart enables visible flow
- Overload state when loadPressure > loadPressureOverloadThreshold
- Stability floor pulses when link stability high enough to guarantee deterministic bursts
- Capped by maxPulsesPerLink (default: 8) and maxTotalPulses (default: 1024)

**Submetrics Read**:
- link.userData.metrics.loadPressure
- link.userData.metrics.corruption
- link.userData.metrics.synergy
- link.userData.metrics.stability
- fallback values from link.source.userData.metrics and link.target.userData.metrics
- Node positions (source/target)

---

### 0.8 LinkSemanticPictogramSystem_WithFusion.js

**Type**: 🎨 GLYPH SYSTEM LAYER

**Scene Additions**:
- Link pictograms (signal / modulator / memory types)
- LinkSemanticPictogramSystem_Enhanced (core pictogram generation)
- GlyphFusionZoneManager (convergence detection)
- CompositeGlyphGenerator (generated composite geometry)
- NeuralConvergenceSingularity (visible runtime shell)
- ResonanceEchoTrailSystem (memory/afterimage trails)

**What it Does**:
- Creates glyphs that travel along links
- Decides glyph family, state, and spawn budget
- Detects convergences and starts fusion
- Builds composite glyphs when glyphs converge
- Provides resonance echo trails after composites active

**Wiring**:
- Wrapped by LinkSemanticPictogramSystem_Enhanced
- Fusion zone updates from pictogram convergence data
- Triggers ResonanceEchoTrailSystem events

**Trigger conditions**:
- Active link pictograms spawn based on link quality
- Convergence detection when glyphs within FUSION_RADIUS of node
- Fusion zones spawn composite glyphs after sufficient convergence
- Composite glyphs emit resonance echoes

**Submetrics Read**:
- link.userData.metrics (synergy, harmony, stability, corruption)
- link.userData.category
- link.userData.evolutionStage
- link.userData.personality
- Node positions (for convergence calculation)

---

## 1 RESONANCE VFX

### 1.1 LinkResonanceFlowSystem_Session124.js

**Type**: 🎨 GEOMETRY/MESH EMITTER

**Scene Additions**:
- LinkResonancePulses_Session124 group containing:
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
- Driven through update(deltaTime, links, camera) each visual frame
- Reads: link.userData.metrics with fallbacks to link.userData.loadPressure, link.userData.flowState, endpoint node averages
- Uses: VisualTime for canonical visual clock and VisualHierarchyRegistry for renderOrder
- Updates: pulse mesh positions, appearance, lifetime, LOD suppression based on camera distance
- Trigger integration: EchoRippleIntegrationPatch_Session125.js can hook spawnRippleOnWaveBurst(link) and spawnRippleOnCascadeHop(node, intensity) onto wave and cascade events

**Trigger conditions**:
- Periodic pulse spawning via internal repeat timer (repeatPulseIntervalSeconds)
- Load pressure above loadPressureVisualStart enables visible flow
- Overload state when loadPressure > loadPressureOverloadThreshold
- Stability floor pulses when link stability high enough to guarantee deterministic bursts
- Capped by maxPulsesPerLink (default: 8) and maxTotalPulses (default: 1024)

**Submetrics Read**:
- link.userData.metrics.loadPressure
- link.userData.metrics.corruption
- link.userData.metrics.synergy
- link.userData.metrics.stability
- fallback values from link.source.userData.metrics and link.target.userData.metrics
- Node positions (source/target)

---

### 1.2 n

**Type**: 🎨 GEOMETRY/MESH EMITTER

**Scene Additions**:
- ResonanceEchoTrailRoot group containing:
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
- Subscribes: semanticBus.on('wave.burst.lifecycle', handler) and semanticBus.on('wave.packet.spawn', handler)
- Uses: VisualTime canonical clock and optional frameScheduler?.shouldRunVisual?.() gating
- Resolves event payloads via _resolveBurstPayload(event) to extract center, intensity, event state
- Tracks: composite glyph history and spawns static echo instances from resolved burst centers
- Updates: echo opacity, lifetime, geometry, pool reuse
- Console API: window.game.echoStatus(), window.game.enableEchoTrails(), window.game.disableEchoTrails(), window.game.toggleEchoDebug()

**Trigger events**:
- wave.burst lifecycle for burst lifecycle completions
- wave.packet.spawn for packet spawn events
- Each resolved event may spawn new echo if contains valid center and intensity
- Echo metrics sourced from event state payload fields such as state.harmony, state.synergy, state.corruption, state.stability

**Submetrics Read**:
- composite.state.harmony
- composite.state.synergy
- composite.state.corruption
- composite.state.stability
- event.intensity (from wave burst events)
- Event center position

---

### 1.3c

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
- Reads: getLinkSynergy(link) from SemanticMetricAdapter.js
- Exposed API: registerLink(link), unregisterLink(link), and update(deltaTime, avgSynergy)
- Reads: node harmony, node synergy, linked node count, active link connectivity
- Updates: resonance particle positions, node shimmer, link glow modulation, particle trail emission each frame
- Console API: window.HarmonicResonanceCoupling_v1

**Trigger conditions**:
- Activated during per-frame update loop when connected nodes meet visual thresholds
- Requires: both linked nodes satisfying harmony > 0.50 and synergy > 0.50
- Optional bidirectional flow when config.bidirectional enabled
- Intensity and frequency scale up with network synergy

**Submetrics Read**:
- link.synergy (via getLinkSynergy())
- node.userData.metrics.harmony
- node.userData.metrics.synergy
- Linked node count
- Node positions

---

### 1.4 CascadeResonanceWaveVisualization_Session146.js

**Type**: 🎨 GEOMETRY/MESH EMITTER

**Scene Additions**:
- CascadeWaveGroup containing:
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
- Subscribes: semanticBus.on('cascade.start', onCascadeStart) and semanticBus.on('cascade.hop', onCascadeHop)
- Resolves event payloads from fields such as sourceNode, source, targetNode, target, ID variants
- Managed by: HarmonicCascadeAmplification_Session145
- Updates via: update(deltaTime) and internal activeWaves map state
- Console API: window.CASCADE_WAVE_STATS

**Trigger conditions**:
- cascade.start events instantiate latent wave activation paths
- cascade.hop events reinforce ongoing wave propagation
- Requires: source/target hub phase sync, minimum hub stability, low corruption below configured thresholds
- Wave influence applied as temporal modulation only, not visible geometry

**Submetrics Read**:
- hub.harmonicPhase
- pair.proximityStrength
- hub.userData.metrics.harmony
- hub.userData.metrics.synergy
- Hub positions
- Distance between hubs

---

### 1.5 T2_HarmonyVisualConsumer_v1.js

**Type**: 🎨 GEOMETRY/MESH EMITTER (Archived)

**Scene Additions**:
- High-harmony node auras (sphere/ring geometry)
- Oasis bloom zones around harmony clusters
- Healing pulse emitters from high-harmony nodes
- Legacy geometry created directly without canonical visual authority

**What it Does**:
- Renders visual harmony feedback from HarmonyStabilizationSystem_v1
- Creates cyan aura fields around nodes with strong harmony
- Spawns soft oasis zones for high harmony regions
- Emits healing pulses from nodes above harmony thresholds

**Wiring**:
- Read-only consumer of harmony runtime state
- Uses: VisualHierarchyRegistry for render order
- Attached via legacy scene geometry rather than VisualTemplateResolver
- Source file: src/legacy/T2_HarmonyVisualConsumer_v1.js

**Trigger conditions**:
- Node harmony exceeds harmonyFieldThreshold
- Healing pulses emit when harmony exceeds pulseThreshold

**Submetrics Read**:
- Harmony values from HarmonyStabilizationSystem_v1
- Node world positions
- Link/node connectivity for aura placement

---

### 1.6 ResonanceCascadeVisualization_Session117B.js

**Type**: 🎨 GEOMETRY/MESH EMITTER

**Scene Additions**:
- ResonanceCascadeVisualization_Session117B_Root group
- Shared SphereGeometry and TorusGeometry visual markers
- Cascade visual groups for radial and link-based propagation
- Optional node glow and link distortion meshes

**What it Does**:
- Visualizes link-born resonance blooms and load-pressure surges
- Spawns radial energy waves and link-propagation ripple visuals
- Illuminates affected nodes and distorts links under cascade stress
- Uses mesh groups and shaders for transient cascade geometry

**Wiring**:
- Subscribes to semantic events: link.created and global.loadPressure.high
- Reads: link birth data, load pressure spikes, cascade intensity
- Uses: Three.js Group, shared geometries, shader materials
- Registers scene root group and updates visual meshes each frame

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

### 2.1 SynergyCascadeVisualizer.js

**Type**: 🎨 GEOMETRY/MESH EMITTER

**Scene Additions**:
- Flow Particles: THREE.Mesh (SphereGeometry) - Directional particles along cascade paths
  - Pool size: 500 particles
  - Geometry: new THREE.SphereGeometry(0.06, 6, 6)
  - Material: MeshBasicMaterial with additive blending
  - Added to scene: this.scene.add(mesh)

- Ripple Effects: THREE.Line (BufferGeometry) - Expanding rings from cascade sources
  - Geometry: Dynamic BufferGeometry with 32 segments
  - Material: LineBasicMaterial with transparency
  - Added to scene: this.scene.add(rippleLine)

**Visual Types**:
1. Wave Front - Animated pulse along links
2. Cascade Glow - Progressive brightness intensification
3. Flow Particles - Directional particles following cascade paths
4. Burst Particles - Compact burst at cascade start/hop
5. Ripple Effect - Concentric rings expanding from cascade source
6. Harmonic Shimmer - Oscillating color bands along links

**Data Source**: Reads cascade.hop events from semanticBus

**Performance**:
- Particles: 500 max pool size
- Update frequency: Every frame (skippable via config)
- Typical runtime: <3ms per frame

---

### 2.2 CascadeParticleSystem_Session120.js

**Type**: 🎨 GPU PARTICLE SYSTEM

**Scene Additions**:
- GPU Particle System: THREE.Points - Semantic particle encoding
  - Pool size: 3000 particles
  - Geometry attributes: positions[3], colors[3], sizes[1], shapeIndices[1], angles[1]
  - CPU-driven motion with shader-driven shape selection
  - Texture atlas for shapes (arcs, forks, shards, blobs)

**Shape Encoding (Conflict Types)**:
- Phase Conflict (0) → Arcs/Crescents (Out of sync)
- Polarity Conflict (1) → Forked/Split (Opposing intent)
- Corruption Conflict (2) → Fractured Shards (Structural damage)
- Stability Conflict (3) → Irregular Blobs (Unreliable)

**Velocity Encoding**:
- Forward Flow → Dominant propagation
- Backflow → Resistance/Absorption
- Oscillatory → Stalemate/Negotiation

**Data Source**:
- Connected to cascade controller via HarmonicCascadeAmplification_Session145 and link lifecycle source
- Binds link lifecycle callbacks through attachLinkLifecycleSource(linkingSystem)
- Handles onLinkCreated, onLinkUpdated, and onLinkDestroyed/onLinkRemoved

**Performance**:
- Single GPU draw call
- Zero per-frame allocations
- Object pooling

---

### 2.3 CascadingRuptureSystem.js

**Type**: 🎨 GEOMETRY/MESH MODIFIER

**Purpose**: Visualizes rupture energy propagating across network regions

**What it Does**:
- Detects cascade opportunities based on corruption/stability
- Propagates rupture energy through network hops
- Triggers visual effects on links and nodes

**Visual Effects (Modifies Existing)**:
1. Tear - Phase destabilization along links
   - link.userData.visualTear - Phase destabilization
   - Modifies link material properties

2. Destabilize - Phase destabilization on nodes
   - node.userData.visualDestabilization - Stability disruption

3. Coherence Loss - Sudden coherence loss
   - link.userData.visualCoherenceLoss - Link dimming/flicker

**Visual Impact**: Modifies existing link/node materials, does not create new geometry

**Performance**:
- Max active cascades: 8
- Visual pool size: 32 pre-allocated effects

---

## 3 WAVES

### 3.1 StandingWaveVisualRenderer_Session131.js

**Type**: 🎨 GEOMETRY/MESH EMITTER

**Scene Additions**:
- StandingWaveRing group containing:
  - Ring geometry (Torus/Ring)
  - Multiple concentric rings for standing wave visualization
  - Shader material for animated wave patterns

**What it Does**:
- Visualizes standing waves between harmonic nodes
- Creates concentric ring patterns that pulse and interfere
- Renders wave interference patterns in real-time

**Wiring**:
- Reads: Node positions, harmonic states, wave field data
- Registers with: VisualHierarchyRegistry for render order
- Updates via: update(deltaTime, harmonicData)

**Emission Conditions**:
- Activated when harmonic nodes in resonance state
- Requires: Node harmony > threshold, proximity to other harmonic nodes
- Standing wave detection from StandingWaveOscillationTrapSystem

**Submetrics Read**:
- node.userData.metrics.harmony
- node.userData.metrics.synergy
- node.harmonicPhase
- waveField.amplitude
- waveField.phase
- waveField.standing
- Node position (for ring placement)

---

### 3.2 OscillationTrapVisualSystem_Session132.js

**Type**: 🎨 GEOMETRY/MESH EMITTER

**Scene Additions**:
- OscillationTrap visual group containing:
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
- Registers with: VisualHierarchyRegistry

**Emission Conditions**:
- Standing wave detected (constructive interference sustained > 1.0s)
- Wave amplitude > threshold
- Phase alignment between multiple wave sources
- Triggered by: wave.burst.lifecycle events

**Submetrics Read**:
- waveField.amplitude
- waveField.phase
- waveField.standing
- waveField.sourceCount
- Wave source positions
- Wave amplitude envelope

---

### 3.3 ResonanceRuptureVisualSystem_Session133.js

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
- Reads: StandingWaveOscillationTrapSystem, InfluenceReflectionBackPressureSystem, AINodes, linkingSystem
- Uses: VisualHierarchyRegistry for render order
- No gameplay logic changes; visual-only rupture feedback

**Trigger conditions**:
- High stress accumulation above stressRuptureThreshold
- Phase divergence beyond configured threshold
- High standing-wave amplitude and corruption/instability influence
- Rupture cooldowns prevent repeated visual spam

**Submetrics Read**:
- Trap stress/energy from standing-wave state
- Link corruption and instability values
- Node harmony and phase coherence
- Reflection/back-pressure metrics

---

### 3.4 HarmonicRecoveryVisualSystem_Session138.js

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
- Subscribes to semanticBus.subscribe('link.harmony.high') and semanticBus.subscribe('link.harmony.mid')
- Reads: rupture completion state, link harmony, node positions
- Uses: VisualTime and VisualHierarchyRegistry
- Integrates with outreach recovery visuals and healing particles

**Trigger conditions**:
- High harmony link events trigger coherence waves
- Mid-level harmony events trigger re-stitching visuals
- Recovery visuals gated by per-link cooldowns

**Submetrics Read**:
- Link harmony state
- Rupture event identifiers and healed zone state
- Node position and link endpoints
- Recovery duration and visual life progress

---

### 3.5 WaveInterferencePatternSystem_Session132.js

**Type**: 🎨 PURE RENDERING SYSTEM

**Purpose**:
- Detects and visualizes constructive/destructive interference patterns when reflected waves collide on same path or adjacent zones
- Creates dynamic visual patterns showing resonance amplification and cancellation zones
- Visual interference = readable conflict resolution

**Core Philosophy**:
- Waves are not isolated; they interact
- Collision creates regions of amplification and cancellation
- Interference patterns encode complex network dynamics
- Visual interference = readable conflict resolution

**Architecture**:
- Detects multi-wave collision scenarios (2+ reflection waves converging)
- Calculates phase relationships between colliding waves
- Computes constructive zones (amplification) and destructive zones (cancellation)
- Generates interference mesh overlays (bright/dark bands)
- Tracks beat frequencies from frequency differences
- Animates complex interference patterns
- Manages interference lifecycle (emergence, stability, resolution)

**Integration**:
- Works with InfluenceReflectionBackPressureSystem (reads reflections)
- Works with StandingWaveVisualRenderer (visual layer)
- Visual-only, no gameplay modifications

**Status**: Production (Session 132)

**Submetrics Read**:
- Reflection wave data from InfluenceReflectionBackPressureSystem
- Phase relationships between colliding waves
- Wave frequencies and amplitudes
- Proximity and alignment metrics

---

## 4 PARTICLES

### 4.1 CascadeParticleSystem_Session120.js

**Type**: 🎨 GPU PARTICLE SYSTEM

**What it does**:
Implements "Semantic Particle Encoding" where particle shape and motion carry specific meaning about conflict type and flow direction during cascade events. Uses GPU-driven particles with texture atlas for 4 distinct shapes (arcs, forks, shards, blobs) representing different conflict types.

**Role/Purpose**:
- Visualizes cascade conflicts with semantic meaning - phase conflicts show as crescent arcs, polarity conflicts as forked shapes, corruption as fractured shards, stability conflicts as irregular blobs
- Velocity encoding shows flow direction (forward, backflow, oscillatory)

**Connections**:
- Connected to: HarmonicCascadeAmplification_Session145 (cascade system)
- Linked to: ParticleStreamCascadeAccelerationIntegrationPatch (acceleration)
- Uses: VisualTime for canonical timing
- Reads from: Link userData properties (cascadeIntensity, cascadeConflictType, cascadeParticleEmissionBoost)

---

### 4.2 HealingParticleSystem_Session136.js

**Type**: 🎨 GPU PARTICLE SYSTEM

**What it does**:
GPU-driven particle system for visual enhancement of network repair. Renders particle trails for healing waves and sparkles emitted from fading resonance scars. Uses single draw call with circular buffer, zero per-frame allocation.

**Role/Purpose**:
- Provides visual feedback for healing mechanics - healing trails follow wave paths when healing waves propagate, scar sparkles emit from resonance scars as they dissipate
- State-responsive to Harmony/Corruption metrics

**Connections**:
- Connected to: ResonanceRuptureSystem (for scar tracking)
- Connected to: AudioSystem (triggerHealingTone)
- Public API: emitHealingTrail(), emitSplash() called by HarmonicHealingVisualSystem
- Modulated by: network state (harmony, corruption)

---

### 4.3 T2_CorruptionVisualIntegration_v1.js

**Type**: 🎨 PARTICLE SYSTEM

**Scene Additions**:
- T2_CorruptionParticlePool instanced tetrahedron meshes
- Cyan aura instances for corruption influence
- Aura mesh and particle root container
- Legacy instanced mesh particle pool with dynamic instance matrices

**What it Does**:
- Emits corruption feedback particles and link bursts
- Visualizes high-corruption nodes with chaos sparks and aura glows
- Uses link/node positions to place pooled particles and LOD-driven persistence
- Provides corruption-only visual layer without gameplay changes

**Wiring**:
- Subscribes to semantic bus node.corruption.high
- Reads: node ID, corruption intensity, source/target world positions
- Uses: linkingSystem for link resolution and optional aiNodes node lookup
- Outputs: instanced particle matrices and per-instance color state

**Trigger conditions**:
- node.corruption.high semantic events trigger corruption pulses
- Burst intensity scales with configured corruption severity
- Per-node and per-link LOD gating limits particle emission at distance

**Submetrics Read**:
- nodeId and corruption level
- link spatial midpoint for LOD
- node world positions and target anchors
- corruption intensity mapped to red/orange particle color

---

### 4.4 WaveParticleEmitter_v1.js

**Type**: 🎨 PARTICLE SYSTEM

**Scene Additions**:
- GPU-batched THREE.Points systems for constructive burst sparks
- Destructive chaos spark systems
- Standing wave ripple point systems
- Full family pools for three particle categories

**What it Does**:
- Emits wave-reactive particles for constructive, destructive, and standing-wave states
- Encodes network state in visual families: cyan-white synergy sparks, orange-red chaos, ripple rings
- Uses GPU batching and instanced point geometry for high-performance particle counts
- Keeps zero allocations after initialization via pooled particle data arrays

**Wiring**:
- Uses LinkPointFXBase and VisualHierarchyRegistry for render layer integration
- Subscribes to semantic bus and direct metric-tier listeners for amplitude and wave state
- Tracks node/link IDs, emission gate timers, amplitude EMA per node
- Drives particle families with real-time network wave metrics

**Trigger conditions**:
- Constructive bursts when amplitude exceeds constructiveThreshold
- Destructive chaos bursts when amplitude exceeds destructiveThreshold
- Standing wave ripples when amplitude crosses standingWaveThreshold
- Amplitude spikes and link mode state modulate emission intensity

**Submetrics Read**:
- wave amplitude and node metric tiers
- link mode emission state and node IDs
- amplitude EMA for spike detection
- node and link world positions for particle emission placement

---

### 4.5 ParticleTrailSystem_Session122.js

**Type**: 🎨 PARTICLE SYSTEM / MESH EMITTER

**Scene Additions**:
- ParticleTrails_Session122 THREE.Points trail mesh
- Trail buffer geometry attributes: position, color, size, age, length
- ShaderMaterial for trail fade and glow
- Trail particle pool and reusable trail data structures

**What it Does**:
- Renders motion trails for fast-moving forward-flow particles
- Encodes velocity as trail length and opacity
- Draws directional flow streaks using particle points and shader trails
- Maintains zero per-particle allocations through pooling

**Wiring**:
- Works with CascadeParticleSystem_Session120 and reads source particle pool
- Calls scene.add(this.trailMesh) during initialization
- Updates trails via update(deltaTime, source, activeParticleCount)
- Uses particle history and velocity to spawn new trail points

**Trigger conditions**:
- Forward flow particle emission from cascade system
- Particle speed above threshold and flowType = 'Forward'
- Trail spawn rate controlled by trailEmissionRate

**Submetrics Read**:
- particle velocity and flow direction
- trail length factor and age
- active particle count from source system
- particle color inheritance and fade state

---

### 4.6 LinkCorruptionParticleSystem.js

**Type**: 🎨 GPU PARTICLE SYSTEM

**What it does**:
Minimal GPU-driven corruption particles for links. Visual: fractured red shards that jitter, burst outward, and dissolve. Implementation: single THREE.Points pool, shader sprite shard mask (gl_PointCoord). No gameplay changes; visual-only.

**Role/Purpose**:
- Visualizes corruption progression along links
- Red fractured shards emit from corrupted links
- Jitter, burst outward, and dissolve with life fade
- Correlated with link.userData.corruption levels

**Performance**:
- Pool size: 480 particles
- Per-link cap: 20 particles
- GPU-driven, shader-based

**Connections**:
- Part of LinkRendererConduit particle ecosystem
- Read-only visual layer
- No gameplay mutations

**Submetrics Read**:
- link.userData.corruption
- link source/target positions
- corruption intensity for color mapping

---

### 4.7 LinkHealingParticleSystem.js

**Type**: 🎨 GPU PARTICLE SYSTEM

**What it does**:
Minimal GPU-friendly healing particle effect for links. Visual: tiny knot sprites (4-armed), harmony-green with cyan rim, plus Bloom Petal sprites (50/50 split), micro-orbit → stabilizing → snap-into-link. Implementation: single THREE.Points pool, ShaderMaterial using gl_PointCoord.

**Role/Purpose**:
- Visualizes healing progression along links
- Knot and petal particles spiral inward from nodes
- Flash when absorbed onto link
- State-responsive to Harmony/Corruption metrics

**Performance**:
- Pool size: 320 particles
- Per-link cap: 20 particles
- GPU-driven, shader-based

**Connections**:
- Part of LinkRendererConduit particle ecosystem
- Connected to AudioSystem (triggerHealingTone)
- No gameplay mutations

**Submetrics Read**:
- link.userData.harmony
- link source/target positions
- harmony/corruption for color and behavior modulation

---

### 4.8 LinkSparkSystem.js

**Type**: 🎨 PARTICLE SYSTEM

**What it does**:
Particle sparks emitting along link curves using parametric motion. Visual: small fire-like sparks that drift along link paths with radial offset, pulse size, fade life, and diminish toward endpoints. Implementation: THREE.Points with aVertexShader for curve tracking and uniforms for runtime control.

**Role/Purpose**:
- Adds ambient motion texture to links
- Sparks drift and pulse along link curves
- Scale and brightness modulated by link quality
- Optional per-link arrival callback (read-only impact hook)

**Performance**:
- Curve-based trajectory
- Shader-based spawning and life tracking
- No per-frame allocations

**Connections**:
- Part of LinkRendererConduit particle ecosystem
- Uses LinkPointFXBase for common textures and configuration

**Submetrics Read**:
- link.userData.synergy
- link source/target positions
- link userData.curve (quadratic Bezier)
- Link render layer policy

---

### 4.9 LinkTrailParticleSystem.js

**Type**: 🎨 PARTICLE SYSTEM

**What it does**:
Emits organic particle trails that flow along links using same noise function as link aura and node aura systems. Particles follow links from source → target, creating visual continuity of energy flow.

**Design Principles**:
- Same Simplex-like noise for trajectory calculation
- Pooled particles (no new allocations per frame)
- Directional flow from source → target
- Color & size tied to link state (harmony/corruption)
- Smooth fade-in/out (no pop)
- Synchronized animation timing with aura systems

**Performance**:
- Particle pool: reused meshes (not created/destroyed)
- Noise calculation: GPU-free (CPU, microseconds per particle)
- Memory: fixed allocation per link
- Update: <1ms for 100 particles

**Connections**:
- Uses same noise function as LinkAuraShader
- Part of unified energy aesthetic across auras and particles

**Submetrics Read**:
- link.userData.synergy
- link.userData.harmony
- link.userData.corruption
- link source/target positions

---

## 5 SYNERGY VFX

### 5.1 SynergyHighwayVisuals3D_1_0.js

**Type**: 🎨 GEOMETRY/MESH EMITTER

**Scene Additions**:
- 3D arc/ribbon highway meshes connecting category clusters
- TubeGeometry flow meshes with animated UV shader scrolling
- Optional bloom/glow halo layers for critical routes
- Debug anchors for category positions and highway endpoints

**What it Does**:
- Renders real-time synergy highways from aggregated route data
- Drives width, color, speed, bloom from link synergy metrics
- Updates highway geometry on data refresh and per-frame visual update loop

**Wiring**:
- Reads: linkingSystem.links, link.userData.synergy, link.userData.cascadeStrength
- Uses: CatmullRomCurve3, TubeGeometry, shader-based flow animation
- Integrates with: scene, renderer, optional historyTracker, category anchor computation

**Trigger conditions**:
- Highway data changes or explicit refreshFromHighways() calls
- Periodic rebuild/update cycles driven by route aggregation updates

**Submetrics Read**:
- link.userData.synergy
- link.userData.cascadeStrength
- trend/volatility from highway history
- category anchor positions derived from node categories

---

### 5.2 SynergyChainReaction_v1.js

**Type**: 🎨 EVENT-DRIVEN VISUAL LOGIC

**Scene Additions**:
- No direct geometry by default, but emits link/node reaction events
- Enables downstream shader/mesh systems to visualize chain reactions
- Supports event objects for link intensity, frequency, direction, hop index

**What it Does**:
- Propagates synergy chain reactions through connected nodes and links
- Detects high-synergy nodes and spreads secondary/tertiary visual reaction events
- Applies decay per hop and limits propagation depth for stability

**Wiring**:
- Uses internal node state via WeakMap and per-frame cadence gating
- Reads: node synergy, resonance similarity, personality compatibility, link visual metrics
- Outputs: reusable link/node event payloads for shader integration

**Trigger conditions**:
- Node synergy crossing primaryThreshold (default ~0.75)
- Each hop propagates only if intensity stays above minimum and resonance remains compatible
- Stops when intensity < 0.1 or hop count > 8

**Submetrics Read**:
- node synergy and resonance similarity
- link.userData.visualMetrics.synergyBonus
- node personality compatibility and chain state

---

## 6 HARMONY VFX

### 6.1 HarmonicNodeResonanceHalos.js

**Type**: 🎨 GEOMETRY/MESH EMITTER

**Scene Additions**:
- Soft resonance halo meshes attached to harmonic hub nodes
- Emissive materials with phase-synced breathing and pulse modulation
- Single cached halo mesh per node, no per-frame geometry allocation

**What it Does**:
- Visualizes harmonic hub authority, stability, and health through halos
- Activates when nodes have sufficient active links and synchronization strength
- Modulates halo distortion based on harmony, synergy, corruption, and recovery

**Wiring**:
- Reads: hub phase, active link count, synchronization strength, resilience state
- Subscribes to semantic/harmony events and updates cached halo materials
- Uses: cached geometry/material and deterministic phase computation

**Trigger conditions**:
- activeLinkCount >= 2 and hubSynchronizationStrength > 0
- Higher harmony levels increase clarity and smoothness
- Corruption/stress introduces wobble, distortion, flicker

**Submetrics Read**:
- harmony, synergy, corruption, stability, resilience
- hub phase frequency and alignment
- active link density around node

---

## 7 CORRUPTION VFX

### 7.1 CorruptionVisualFX_v1.js

**Type**: 🎨 GEOMETRY/MESH FX LAYER

**Scene Additions**:
- Dynamic color tinting and glow on corrupted nodes/links
- Shader UV distortion, warping, mesh jitter effects
- CorruptionVisualFX_Particles group for chaos particle emission
- Delegates particle handling to T2_CorruptionVisualIntegration_v1

**What it Does**:
- Visualizes corruption progression from subtle to extreme
- Applies visual distortion, glow flicker, and particle feedback
- Uses VisualTime for canonical timing and safe THREE.js fallback

**Wiring**:
- Initialized via new CorruptionVisualFX_v1(this.scene, this.aiNodes, false)
- Reads corruption from: nodeModel.userData.metrics.corruption, gameplay.corruptionLevel, userData.corruption
- Does not bind direct semantic listeners in current shell; particle pulses delegated to T2 integration
- triggerCorruptionPulse(nodeId) forwards to T2_CorruptionVisualIntegration_v1.triggerCorruptionPulse

**Trigger conditions**:
- corruption thresholds at ~0.25, 0.45, 0.65, 0.85
- CASCADE_CORRUPTION_THRESHOLD (0.35) enables stronger particle/chaos effects

**Submetrics Read**:
- node/link corruption values and flags
- high corruption state markers like corruptionHigh and isCorrupted
- cascade corruption state and per-node visual intensity

---

### 7.2 TIER4_CorruptionFeedbackVisuals_v1.js

**Type**: 🎨 GEOMETRY/MESH FX LAYER

**Purpose**:
- Visual feedback for player actions affecting corruption
- Display gameplay feedback when links are created/destroyed
- Corruption seed visualization on link creation
- Cascade warning indicators
- Harmony restoration VFX on link destruction
- Real-time corruption network health display

**What it Does**:
- Pure rendering layer — reads gameplay state, writes to THREE.js scene

**Submetrics Read**:
- Link creation/destruction events
- Node positions for spawn points
- Corruption intensity for seed visual intensity
- Cascade state for warning indicators

---

## 8 RITUAL VFX

### 8.1 Phase8RitualVisualOrchestration.js

**Type**: 🎨 VISUAL ORCHESTRATION LAYER

**Purpose**:
Purely visual ceremony layer for network rituals. Makes large-scale network actions feel intentional, meaningful, and alive.

**Design Constraints**:
- ✅ READ-ONLY consumption of Phase 8 ritual events
- ✅ NO gameplay logic modifications
- ✅ NO stat mutations
- ✅ NO new mechanics or conditions
- ✅ NO UI panels or text
- ✅ RESPECTS canonical visual templates (#1, #2, #3)
- ✅ All visuals fully reversible and transient
- ✅ Silent failure if events unavailable

**Semantic Foundation**:
- Ritual is NOT: spell, explosion, or cutscene
- Ritual IS: network synchronization, collective intention, emergent resonance

**Visual Orchestration Layers**:
1. PRELUDE (Network Attunement) — Signal coordinated state
2. ACTIVE (Coherent Resonance) — Show collective action
3. CREST (Peak/Resolution) — Make peak readable
4. RELEASE (Release/Resolution) — Communicate closure

**Integration Points**:
- NetworkRituals_v1.js: Ritual lifecycle events
- VisualTemplateRegistry.js: Canonical template authority
- VisualAutoWiringSystem.js: Controller management
- SynergyGlowController.js: Template #1 (cyan glow)
- HarmonyAuraController.js: Template #2 (aquamarine stability)
- StressTurbulenceController.js: Template #3 (red-orange chaos)

**Performance**:
- O(n) where n = affected renderables (links + nodes in ritual cluster)
- No per-frame allocations
- Efficient state tracking via Map

---

### 8.2 RitualVisualOrchestrator.js

**Type**: 🎨 VISUAL ORCHESTRATION LAYER

**Purpose**:
Orchestrate existing canonical visual templates during rituals. Conducts visual ensemble—does NOT rewrite the score.

**Authority**:
- Canonical Visual Triad (LOCKED): SynergyGlow, HarmonyAura, StressTurbulence
- VisualAutoWiringSystem (LOCKED): Controller management layer
- NetworkRituals_v1.js: Ritual state/lifecycle

**Design Principles**:
- ✅ READ-ONLY access to ritual state (type, stage, progress, duration)
- ✅ MODULATE ONLY derived visual signals (intensity, phase, envelope)
- ✅ PRESERVE semantics (colors, meanings, template identities)
- ✅ TRANSIENT effects (fully reversible, cleanup on ritual end)
- ✅ ZERO metric mutations (visuals only, no stat changes)
- ✅ SAFE optional chaining (no crashes on missing controllers)
- ✅ O(n) performance (n = affected renderables)

**Allowed Operations (Per Template)**:
- SYNERGY_GLOW (Cyan Structural Quality):
  - Intensity multiplier (≤ 1.5×)
  - Synchronized pulse phase across affected links
  - Smooth fade-in/out envelopes
  ❌ No color changes, no blinking
- HARMONY_AURA (Aquamarine Stability):
  - Synchronized breathing phase
  - Slight radius amplification (≤ 1.25×)
  - Temporal coherence across nodes
  ❌ No jitter, no urgency signaling
- STRESS_TURBULENCE (Red-Orange Chaos):
  - Temporal synchronization of turbulence
  - Controlled damping/amplification (≤ ±30%)
  - Global coherence (chaos becomes readable)
  ❌ No damage visuals, no threshold spikes

**Modifier Model**:
- All effects implemented as transient, reversible modifiers

**Lifecycle**:
1. Ritual Starts → Resolve affected renderables, apply modifiers
2. Active Update → Modulate phase/progress each frame
3. Ritual Ends → Remove all modifiers, restore baseline

---

## 9 SYNERGY VFX ENGINE

### 9.1 SynergyVFXEngine1_0.js

**Type**: 🎨 VISUAL ENGINE LAYER

**Purpose**:
Advanced visual effects system for link and node synergy visualization. Renders 5 distinct visual layers on top of existing Priority VFX without modification.

**Visual Layers**:
1. Synergy Core Tint — Per-link color blending by polarity
2. Synergy Orbit Halos — Per-node rings around high-synergy nodes
3. Synergy Threads — Inter-link filaments inside clusters
4. Synergy Burst Events — Ring pulses on synergy changes
5. Synergy Cluster Fields — Soft auras around node clusters

**Status**:
- Dormant legacy module in current workspace runtime path
- No active consumer found in codebase as of 2026-03-31
- Keep here as archive/compatibility until real consumer wired

**Features**:
- Real-time synergy data visualization (score, tier, trend, polarity)
- Smooth lerp transitions (0.1 factor)
- Memory-efficient object pooling
- Full backward compatibility
- Non-invasive (reads only, no modifications to priority VFX)

**Performance**:
- Per-link tint: <0.05ms
- Per-cluster orbit: <0.1ms
- Per-cluster threads: <0.2ms
- Total per frame: <2ms (even with 200+ links)

---

### 9.2 SynergyVFX1_0.js

**Type**: 🎨 SYNERGY VFX ENGINE

**Purpose**:
Clean, visual-only system that adds beautiful synergy-based VFX to links and nodes. No gameplay logic, no analytics, no AI scoring—purely visual.

**Four Visual Layers**:
- (A) Glow Pulse Layer - Pulsing glow around links based on synergyStrength
- (B) Chromatic Trails - Particles moving along link direction with color shifts
- (C) Outer Synergy Aura - Soft halos around nodes with high synergy
- (D) Synergy Burst - Temporary expanding rings triggered on demand

**Performance**:
- ~0.5-2ms per frame for 100+ links
- ~200 bytes per link + per-node halos

---

### 9.3 SynergyPulseVisuals_v1.js

**Type**: 🎨 PURE VISUAL EFFECT

**Purpose**:
Simple, non-intrusive world-space visual feedback for high synergy.

**Effect Formula**:
pulse = 1.0 + sin(time × 1.5) × 0.03 × synergy

**Guarantees**:
- No distortion, jitter, noise
- No camera effects
- No UI/HUD changes
- No postprocessing
- Pure smooth sinusoid
- Negligible performance impact
- Safe to leave enabled permanently

**Contracts**:
- Only modifies visual parameters (scale), never node state
- Reads avgSynergy from network-level metrics
- Reads canonical node synergy from SemanticMetricAdapter
- Never writes to node.userData.*
- Never affects game time or deltaTime

---

### 9.4 SynergyTravelingWaveFX_v1.js

**Type**: 🎨 GPU SHADER SYSTEM

**Purpose**:
GPU-driven traveling wave shader effects for synergy chain reactions. Visualizes cascade propagation as waves traveling from node → link → node with speed, intensity, and color driven by synergy depth and polarity.

**Core Features**:
- Traveling wave visualization along links
- Wave speed controlled by synergy depth (2–8 units/sec)
- Wave color driven by synergy polarity (positive/negative)
- Wavefront sharpness based on synergy quality
- Noise distortion for corrupted synergy
- Pulsating waves for resonance synergy
- Multi-hop cascade support
- Safe onBeforeCompile shader patching
- WeakMap material state tracking
- Zero memory leaks, graceful fallback
- Performance: <0.3ms per 500+ materials

**Shader Modes**:
1. Resonance Wave (smooth, pulsating)
2. Corrupted Wave (noisy, distorted)
3. Positive Wave (sharp, direct)
4. Negative Wave (inverted, diffuse)

**GPU Uniforms**:
- uTime, uWaveSpeed, uWaveIntensity, uWaveColor
- uCascadeDepth, uPropagationDirection
- uSynergyLevel, uChainEvent, uWaveSharpness
- uNoiseStrength, uPulsationFreq

---

### 9.5 SynergyCascadeFXBridge_v1.js

**Type**: 🎨 EVENT BRIDGE

**Purpose**:
Runtime bridge connecting Week 22 chain reaction events to Week 19-20 synergy shader systems. Converts cascade propagation data into GPU-friendly shader signals that trigger coordinated visual effects across nodes and links.

**Core Responsibilities**:
1. Listen for chain reaction events from SynergyChainReaction_v1
2. Convert cascade data → shader-friendly signals (wave, intensity, timing)
3. Route signals to target shader systems (resonance, bonus FX, auras, archetypes)
4. Trigger synchronized GPU visual reactions (pulses, waves, distortions, glows)
5. Maintain performance (<0.4ms per frame with WeakMap state tracking)

**Event Pipeline**:
SynergyChainReaction_v1.getActiveReactions() → Chain Reaction Events → SynergyCascadeFXBridge_v1.processEvents() → Cascade State Trees → Shader Signal Generation → Target Systems → GPU Visual Reactions

**Visual Effects Triggered**:
- Radial pulse emanating from cascade origin node
- Line-traveling wave along cascade paths (links)
- Brightness flash on cascade arrival
- Aura intensity spike (node halos glow)
- Resonance band visualization (multi-freq pulse)
- Cascade shockwave propagation (decay over hops)

**Performance**:
- Per-frame cost: <0.4ms (for 300+ nodes, 1000+ links)
- Memory: WeakMaps for automatic GC (zero leaks)
- No global allocations in update loop
- Frame impact: <1% at 60 FPS

**Shader Signal Format**:
```javascript
{
  cascadeWave: 0–1 (depth normalized)
  pulseStrength: 0–1 (intensity of current cascade step)
  cascadeTime: 0–1 (elapsed time in cascade)
  resonanceMix: 0–1 (blend between normal and cascade mode)
  bonusMix: 0–1 (synergy bonus FX intensity)
  flashBrightness: 0–1 (sudden brightness pulse on arrival)
  auraPulse: 0–1 (aura glow response to cascade)
}
```

---

### 9.6 SynergyBonusVisualization_v1.js

**Type**: 🎨 GPU SHADER SYSTEM

**Purpose**:
GPU-ready visualization system highlighting high-synergy links with special visual effects (brightness, pulsing, chroma waves, resonance ripples). Canonical input: link.userData.synergy.{score, synergyNorm}.

**Core Features**:
- 4 synergy bonus tiers (none → mythic resonance)
- Dynamic pulse strength (EMA smoothed, α=0.12)
- Chroma shift oscillation (EMA smoothed, α=0.10)
- Resonance ripples (EMA smoothed, α=0.08)
- Performance: 1500+ links in <1ms
- WeakMap caching for per-link state
- Optional chaining throughout
- Comprehensive error handling

**Synergy Tiers**:
0 = NONE (synergyNorm < 0.40)
1 = SOFT_BOOST (0.40–0.70)
2 = STRONG_PULSE (0.70–0.90)
3 = MYTHIC_RESONANCE (≥0.90)

**Shader Signal Format**:
```javascript
{
  cascadeWave: 0–1
  pulseStrength: 0–1
  cascadeTime: 0–1
  resonanceMix: 0–1
  bonusMix: 0–1
  flashBrightness: 0–1
  auraPulse: 0–1
}
```

---

### 9.7 SynergyBonusFXLayer_v1.js

**Type**: 🎨 GPU SHADER SYSTEM

**Purpose**:
GPU-based visual effects layer that renders synergy flares on high-synergy links. Reads canonical link.userData.synergy.{score, synergyNorm} via SemanticMetricAdapter and applies shader-based visual enhancements.

**Core Features**:
- 4 synergy tier visualization (NONE → MYTHIC_RESONANCE)
- GPU shader integration via onBeforeCompile
- Dynamic emissive boosting (10–90% intensity scaling)
- Multi-frequency pulsing (1–3 Hz range)
- Chromatic flare effects (color shift oscillation)
- Resonance ripples (subtle vertex distortion)
- EMA smoothing for all effects (α = 0.15, 0.10, 0.08)
- Per-link state tracking via WeakMap
- Performance: 1500+ links in <1ms
- Optional chaining throughout
- Comprehensive error handling

**Synergy Tiers & Visual Profiles**:
0 = NONE (no extra effects, baseline)
1 = SOFT_BOOST (subtle emissive +10–20%, gentle pulsing 0.5–1.0 Hz)
2 = STRONG_PULSE (noticeable emissive +30–50%, faster pulse 1.5–2.5 Hz)
3 = MYTHIC_RESONANCE (strong emissive +60–90%, multi-frequency pulse)

---

## 10 ARCHETYPE VFX

### 10.1 ArchetypeVisualDifferentiationSystem_v1.js

**Type**: 🎨 ARCHETYPE VISUAL SYSTEM

**Purpose**:
Applies distinct visual treatments to nodes based on their extreme archetype. Integrates seamlessly with existing visual bootstrap and personality systems.

**Features**:
- Per-archetype color shifts with HSL adjustments
- Customized animation parameters (rotation, pulse, float)
- Dynamic particle system modifications
- Archetype-specific glow characteristics
- Shader parameter customization
- Non-breaking integration with existing code
- Performance optimized with safe material handling

**Integration**:
- Uses ArchetypeVisualProfiles_v1.js for archetype definitions
- Uses ArchetypeVisualTransitionEngine_v2.js for smooth transitions
- Legacy aura overlays kill-switch: ENABLE_LEGACY_AURAS = false

---

## 11 COLONY VFX

### 11.1 ColonyVFXManager.js

**Type**: 🎨 SAFE LIVING CIVILIZATION VISUAL SYSTEM

**Purpose**:
Safe living civilization visual effects system. Creates growth shells, signal orbitals, conscious cores, status crowns - all completely separate from nodes.

**Design**:
- 100% non-destructive VFX overlays
- All meshes stored in scene but separate from nodes
- Can be removed without affecting core systems

**Scene Additions**:
- Growth shells
- Signal orbitals
- Conscious cores
- Status crowns

**Configuration**:
- Colors: HARMONY (cyan), STABILITY (sky blue), CORRUPTION (magenta), SYNERGY (gold), LOAD_PRESSURE (coral)
- Atmosphere, rings, mood profiles

---

## 12 DREAM EFFECTS

### 12.1 DreamDepthEffectManager.js

**Type**: 🎨 RICH OVERLAY SYSTEM

**Purpose**:
Rich ATOMA dream aperture overlay. Primary rich overlay path for ATOMA depth-of-field VFX. SafeDreamDepthPack remains low-cost fallback depth layer.

**Palette**:
- void deep: #05131A
- ATOMA cyan: #6DEAFF
- mint: #77F7DB
- ritual white: #F7FBFF
- violet: #D07BFF
- rose: #FF73CF

**Weather States**:
- calm, pressure, resonance, stormBias, ascensionHaze

**Features**:
- Safe: Pure VFX rendering through canvas overlays
- No camera mutations, no shader dependencies, no physics changes

---

## STRUCTURAL NOTE

The document is organized into 12 main categories:
- 0-7: Core VFX categories (Link, Resonance, Cascade, Waves, Particles, Synergy, Harmony, Corruption)
- 8: Ritual VFX (Phase8 + RitualVisualOrchestrator)
- 9: Synergy VFX Engine (7 subsystems)
- 10: Archetype VFX
- 11: Colony VFX
- 12: Dream Effects

This structure reflects the multi-layered nature of ATOMA's visual system, with clear separation between:
- Core rendering layers (link, particles, shaders)
- Semantic visualization (synergy, harmony, corruption)
- Event-driven visualizations (rituals, cascades, waves)
- System layers (VFX engine, archetype differentiation)
- Environmental overlays (colony VFX, dream effects)

---

**Last Updated:** 2026-04-10
**Author:** Bystrik Matajzik
**Phase:** EVOLUTION_V2
**Total VFX Systems:** ~60 (including all core systems, engine layers, and environmental effects)
