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

### 0.9 LinkDirectionalGradientPolish.js

**Type**: 🎨 LINK VISUAL POLISH

**Scene Additions**:
- Gradient colors along link curves
- Directional color transitions
- Smooth gradient interpolation

**What it Does**:
- Applies color gradients along link direction
- Creates smooth visual flow from source to target
- Enhances directional clarity
- Improves visual quality of links

**Wiring**:
- Reads: Link direction, node colors, metrics
- Applies: Gradient to link material
- Integration: Part of LinkRendererConduit

---

### 0.10 LinkDirectionalStreaks.js

**Type**: 🎨 LINK DIRECTION VISUALS

**Purpose**:
Creates directional streak effects on links showing energy flow direction.

**What it Does**:
- Renders streak patterns along link curves
- Animate streaks from source to target
- Modulates streak intensity based on flow
- Provides clear directional indication

**Integration**:
- Reads: Link direction, flow metrics
- Uses: Shader-based streak rendering
- Performance: GPU-driven, minimal CPU cost

---

### 0.11 LinkStreakColorDynamics_Session115.js

**Type**: 🎨 LINK STREAK DYNAMICS

**Purpose**:
Dynamic color management for link streak effects.

**What it Does**:
- Animates streak colors over time
- Modulates color based on link state
- Creates color flow along streaks
- Provides dynamic streak visualization

**Integration**:
- Reads: Link metrics, time
- Updates: Streak material colors
- Performance: Shader-based color modulation

---

### 0.12 LinkRingArcDischarges.js

**Type**: 🎨 LINK ENERGY EFFECTS

**Purpose**:
Creates arc discharge effects on link rings.

**What it Does**:
- Generates electrical arc visuals
- Triggers discharges on high energy events
- Animates arc paths along rings
- Provides dynamic energy visual

**Integration**:
- Reads: Link energy, cascade events
- Triggers: On cascade, resonance, high synergy
- Visual: Electric arc geometry with glow

---

### 0.13 LinkSurfacePhaseRipples.js

**Type**: 🎨 LINK SURFACE EFFECTS

**Purpose**:
Creates phase-based ripple effects on link surfaces.

**What it Does**:
- Animates ripple patterns on link geometry
- Synchronizes ripples with harmonic phase
- Creates wave propagation visual on link surface
- Enhances visual complexity

**Integration**:
- Reads: Harmonic phase, link metrics
- Uses: Shader-based ripple animation
- Submetrics: Phase, amplitude, frequency

---

### 0.14 LinkEventVisualCoordinator_v1.js

**Type**: 🎨 LINK EVENT COORDINATION

**Purpose**:
Coordinates visual events on links.

**What it Does**:
- Manages event-based link visuals
- Coordinates multiple event effects
- Prioritizes conflicting events
- Provides unified event visual response

**Integration**:
- Reads: Link events, metrics
- Triggers: Event-based visual effects
- Performance: Event filtering and batching

---

### 0.15 LinkCategoryColorContract.js

**Type**: 🎨 LINK COLOR SYSTEM

**Purpose**:
Defines color contracts for link categories.

**What it Does**:
- Specifies color schemes per category
- Enforces color consistency
- Provides category color queries
- Maintains color taxonomy

**Integration**:
- Used by: Link visual systems
- Provides: Color definitions, color queries

---

### 0.16 LinkQualityCalculator.js

**Type**: 🎨 LINK QUALITY SYSTEM

**Purpose**:
Calculates link quality metrics for visual mapping.

**What it Does**:
- Computes overall link quality score
- Factors in multiple metrics (synergy, harmony, stability)
- Provides quality-based visual mapping
- Normalizes quality for visual use

**Integration**:
- Reads: Link metrics
- Outputs: Quality score (0-1)
- Used by: Visual mapping systems

---

### 0.17 LinkQualityPredictor1_0.js

**Type**: 🎨 LINK QUALITY PREDICTION

**Purpose**:
Predicts future link quality for proactive visual changes.

**What it Does**:
- Predicts quality trend
- Anticipates quality changes
- Provides predictive visual cues
- Enables proactive visual response

**Integration**:
- Reads: Historical quality data
- Uses: Trend analysis, prediction models
- Outputs: Predicted quality, confidence

---

### 0.18 LinkDecayEffectApplier.js

**Type**: 🎨 LINK DECAY VISUALS

**Purpose**:
Applies visual decay effects to deteriorating links.

**What it Does**:
- Shows link degradation over time
- Applies decay color/opacity
- Creates decay animation
- Provides visual feedback on link health

**Integration**:
- Reads: Link age, quality
- Applies: Decay effects to material
- Visual: Fading, desaturation, breakdown

---

### 0.19 LinkDegradationSystem.js

**Type**: 🎨 LINK DEGRADATION SYSTEM

**Purpose**:
Manages link degradation lifecycle.

**What it Does**:
- Tracks link degradation state
- Triggers degradation events
- Manages degradation visual stages
- Provides degradation feedback

**Stages**:
- Healthy → Warning → Critical → Failed
- Visual progression per stage
- Event triggers per stage

---

### 0.20 LinkCollapseSystem.js

**Type**: 🎨 LINK COLLAPSE VISUALS

**Purpose**:
Visualizes link collapse events.

**What it Does**:
- Shows collapse animation
- Triggers collapse visual effects
- Creates debris/fragment effects
- Provides dramatic visual feedback

**Integration**:
- Reads: Collapse events, link state
- Triggers: Collapse animation, particle burst
- Visual: Shatter, fade, debris

---

### 0.21 LinkEmissionPulsingSystem.js

**Type**: 🎨 LINK EMISSION VISUALS

**Purpose**:
Creates emission pulsing effects on links.

**What it Does**:
- Pulses link emission intensity
- Synchronizes with network rhythm
- Creates rhythmic visual patterns
- Provides emission-based feedback

**Integration**:
- Reads: Network rhythm, link state
- Modulates: Emission intensity, pulse rate
- Visual: Pulsing glow, rhythmic brightness

---

### 0.22 LinkBeadTrailSystem.js

**Type**: 🎨 BEAD TRAIL VISUALS

**Purpose**:
Creates trail effects for link beads.

**What it Does**:
- Generates trail behind moving beads
- Animates trail fade-out
- Creates motion blur effect
- Enhances bead movement visual

**Integration**:
- Reads: Bead position, velocity
- Uses: Trail geometry, fade shader
- Performance: Line-based trails, efficient

---

### 0.23 LinkPointFXBase.js

**Type**: 🎨 POINT FX BASE CLASS

**Purpose**:
Base class for point-based FX systems.

**What it Does**:
- Provides common point FX functionality
- Manages particle pools
- Handles point rendering
- Provides shared utilities

**Subclasses**:
- LinkSparkSystem
- LinkHealingParticleSystem
- LinkCorruptionParticleSystem

---

### 0.24 LinkVisualStateAdapter.js

**Type**: 🎨 LINK STATE ADAPTER

**Purpose**:
Adapts link state to visual parameters.

**What it Does**:
- Maps link state to visual params
- Normalizes state for visual use
- Provides state-based visual queries
- Handles state transitions

**Integration**:
- Reads: Link userData, metrics
- Outputs: Visual parameters (color, intensity, speed)
- Used by: All link visual systems

---

### 0.25 LinkRenderLayerPolicy.js

**Type**: 🎨 RENDER LAYER POLICY

**Purpose**:
Defines render layer policy for link visuals.

**What it Does**:
- Assigns links to render layers
- Manages layer ordering
- Provides layer queries
- Enforces layer policy

**Integration**:
- Used by: VisualHierarchyRegistry
- Defines: Link render priorities

---

### 0.26 LinkSemanticMetricsBridge_v1.js

**Type**: 🎨 SEMANTIC METRICS BRIDGE

**Purpose**:
Bridges semantic metrics to visual systems.

**What it Does**:
- Converts semantic metrics to visual params
- Provides semantic-based visual queries
- Manages semantic-visual mapping
- Handles semantic state changes

**Integration**:
- Reads: Semantic metrics from SemanticMetricAdapter
- Outputs: Visual parameters
- Used by: Link visual systems

---

### 0.27 LinkShaderMetricsIntegration_v1.js

**Type**: 🎨 SHADER METRICS INTEGRATION

**Purpose**:
Integrates metrics into link shader uniforms.

**What it Does**:
- Updates shader uniforms with metrics
- Manages uniform lifecycle
- Optimizes uniform updates
- Handles shader-metric binding

**Integration**:
- Reads: Link metrics
- Updates: Shader uniforms
- Performance: Batched uniform updates

---

### 0.28 LinkThicknessMetricsIntegrationPatch_v1.js

**Type**: 🎨 THICKNESS METRICS INTEGRATION

**Purpose**:
Integrates metrics into link thickness.

**What it Does**:
- Maps metrics to thickness
- Animates thickness changes
- Provides metric-based thickness
- Handles thickness transitions

**Integration**:
- Reads: Link metrics (synergy, harmony, corruption)
- Updates: Link geometry thickness
- Visual: Dynamic line width

---

### 0.29 LinkThicknessScaling_v1.js

**Type**: 🎨 LINK THICKNESS SCALING

**Purpose**:
Scales link thickness based on various factors.

**What it Does**:
- Computes target thickness
- Animates thickness changes
- Applies scaling factors
- Handles thickness limits

**Scaling Factors**:
- Synergy level
- Load pressure
- Cascade intensity
- User preference

---

### 0.30 LinkStateVisualLanguageIntegration.js

**Type**: 🎨 VISUAL LANGUAGE INTEGRATION

**Purpose**:
Integrates visual language encoding into link shaders.

**What it Does**:
- Encodes link state in visual patterns
- Applies visual language to shaders
- Provides state-based visual encoding
- Maintains visual language consistency

**Integration**:
- Reads: Link state, visual language definitions
- Applies: Shader modifications
- Used by: LinkRendererConduit

---

### 0.31 LinkCascadePulseManager.js

**Type**: 🎨 CASCADE PULSE MANAGEMENT

**Purpose**:
Manages cascade pulses on links.

**What it Does**:
- Spawns cascade pulses
- Tracks pulse propagation
- Manages pulse lifecycle
- Coordinates pulse visuals

**Integration**:
- Reads: Cascade events, link state
- Triggers: Cascade pulse visuals
- Feeds: Pulse visual systems

---

### 0.32 LinkCascadeInfectionSystem.js

**Type**: 🎨 CASCADE INFECTION VISUALS

**Purpose**:
Visualizes cascade infection spreading along links.

**What it Does**:
- Shows infection propagation
- Animates infection spread
- Creates infection visual indicators
- Provides infection feedback

**Integration**:
- Reads: Cascade infection state
- Applies: Infection visual effects
- Visual: Propagation animation, color shift

---

### 0.33 LinkPersonalityStateMachine_v1.js

**Type**: 🎨 LINK PERSONALITY SYSTEM

**Purpose**:
Manages personality state for links.

**What it Does**:
- Tracks link personality state
- Handles personality transitions
- Provides personality-based queries
- Drives personality visuals

**Personality States**:
- Aggressive, Passive, Balanced, Chaotic
- State transitions based on metrics
- Visual encoding per state

---

### 0.34 LinkCorruptionTransmission_v1.js

**Type**: 🎨 CORRUPTION TRANSMISSION VISUALS

**Purpose**:
Visualizes corruption transmission along links.

**What it Does**:
- Shows corruption flow between nodes
- Animates transmission progress
- Creates corruption visual indicators
- Provides transmission feedback

**Integration**:
- Reads: Corruption levels, link state
- Applies: Transmission visual effects
- Visual: Flow animation, color shift

---

### 0.35 LinkCorruptionSpreadAnimator.js

**Type**: 🎨 CORRUPTION SPREAD ANIMATION

**Purpose**:
Animates corruption spread across links.

**What it Does**:
- Interpolates corruption spread
- Creates smooth spread animation
- Provides spread progress visual
- Handles spread completion

**Integration**:
- Reads: Spread progress, corruption levels
- Updates: Visual spread state
- Visual: Progressive color/opacity change

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

### 1.7 HarmonicResonanceFeedbackSystem.js

**Type**: 🎨 RESONANCE FEEDBACK VISUALS

**Purpose**:
Provides visual feedback for harmonic resonance events.

**What it Does**:
- Shows resonance active state
- Animates resonance intensity
- Creates resonance visual indicators
- Provides resonance feedback

**Integration**:
- Reads: Resonance state, intensity
- Triggers: Resonance visual effects
- Visual: Glow, pulse, color shift

---

### 1.8 CompositeGlyphResonanceFeedback.js

**Type**: 🎨 GLYPH RESONANCE FEEDBACK

**Purpose**:
Provides resonance feedback through composite glyphs.

**What it Does**:
- Shows resonance in glyph behavior
- Modifies glyph appearance on resonance
- Creates glyph-based resonance indicators
- Provides glyph-level feedback

**Integration**:
- Reads: Composite glyph state, resonance
- Updates: Glyph visual properties
- Visual: Glow, color, animation change

---

### 1.9 LinkResonanceFlowIntegrationPatch_Session124.js

**Type**: 🎨 RESONANCE INTEGRATION PATCH

**Purpose**:
Integrates resonance flow system with other visual systems.

**What it Does**:
- Connects resonance flow to other systems
- Manages integration state
- Handles integration conflicts
- Provides unified resonance visuals

**Integration**:
- Connects: LinkResonanceFlowSystem to visual systems
- Manages: Integration lifecycle

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

### 2.4 CascadeWaveParticles.js

**Type**: 🎨 CASCADE WAVE PARTICLES

**Purpose**:
Wave-based particle effects for cascade events.

**What it Does**:
- Creates wave-front particles
- Animates particle wave propagation
- Shows cascade wave fronts
- Provides wave-based cascade visualization

**Integration**:
- Reads: Cascade wave data
- Spawns: Wave-front particles
- Visual: Particle wave front

---

### 2.5 CascadeBurstVisual_Session147.js

**Type**: 🎨 CASCADE BURST VISUALS

**Purpose**:
Visual effects for cascade burst events.

**What it Does**:
- Shows cascade burst explosions
- Creates burst particle effects
- Animates burst expansion
- Provides dramatic burst feedback

**Integration**:
- Reads: Cascade burst events
- Triggers: Burst animation, particles
- Visual: Explosion, flash, particle burst

---

### 2.6 ParticleCascadeFlowDeflection.js

**Type**: 🎨 PARTICLE FLOW DEFLECTION

**Purpose**:
Deflects particle flow during cascade events.

**What it Does**:
- Deflects particles based on cascade
- Creates flow diversion effects
- Shows cascade influence on flow
- Provides deflection visualization

**Integration**:
- Reads: Cascade state, particle flow
- Modifies: Particle trajectories
- Visual: Flow bending, deflection curves

---

### 2.7 ParticleStreamCascadeAcceleration.js

**Type**: 🎨 CASCADE ACCELERATION

**Purpose**:
Accelerates particle streams during cascade events.

**What it Does**:
- Increases particle speed during cascade
- Creates acceleration visual effects
- Shows cascade energy boost
- Provides acceleration feedback

**Integration**:
- Reads: Cascade intensity, particle streams
- Modifies: Particle velocities
- Visual: Speed increase, motion blur

---

### 2.8 ParticleStreamCascadeAccelerationIntegrationSetup.js

**Type**: 🎨 ACCELERATION INTEGRATION SETUP

**Purpose**:
Sets up cascade acceleration integration.

**What it Does**:
- Initializes acceleration integration
- Connects acceleration to systems
- Manages setup lifecycle
- Provides integration entry point

---

### 2.9 ParticleStreamCascadeAccelerationIntegrationPatch.js

**Type**: 🎨 ACCELERATION INTEGRATION PATCH

**Purpose**:
Patches cascade acceleration into particle systems.

**What it Does**:
- Applies acceleration patches
- Manages patch lifecycle
- Handles patch conflicts
- Provides unified acceleration behavior

---

### 2.10 HarmonicCascadeAmplification_Session145.js

**Type**: 🎨 HARMONIC CASCADE AMPLIFICATION

**Purpose**:
Amplifies harmonic cascade effects.

**What it Does**:
- Increases cascade intensity
- Amplifies harmonic resonance
- Creates amplification visuals
- Provides amplification feedback

**Integration**:
- Reads: Cascade state, harmonic data
- Modifies: Cascade intensity, visual scale
- Visual: Brightness increase, scale boost

---

### 2.11 CascadeEventBridge_v1.js

**Type**: 🎨 CASCADE EVENT BRIDGE

**Purpose**:
Bridges cascade events to visual systems.

**What it Does**:
- Converts cascade events to visual signals
- Routes events to appropriate systems
- Manages event delivery
- Provides unified event interface

**Integration**:
- Reads: Cascade events
- Outputs: Visual event signals
- Feeds: Cascade visual systems

---

### 2.12 CascadeToWaveBridge_v1.js

**Type**: 🎨 CASCADE-WAVE BRIDGE

**Purpose**:
Bridges cascade events to wave systems.

**What it Does**:
- Converts cascade data to wave format
- Triggers wave generation from cascade
- Manages cascade-wave conversion
- Provides cascade-driven waves

**Integration**:
- Reads: Cascade events
- Outputs: Wave burst events
- Feeds: Wave systems

---

### 2.13 CascadeSystemConsoleAPI.js

**Type**: 🎨 CASCADE CONSOLE API

**Purpose**:
Provides console API for cascade system debugging and control.

**What it Does**:
- Exposes cascade state to console
- Provides cascade control functions
- Enables cascade debugging
- Offers cascade statistics

**API Functions**:
- getCascadeStats()
- triggerCascade(node, intensity)
- setCascadeDebug(enabled)
- getCascadeHistory()

---

### 2.14 CascadingHarmonicResonanceAmplification.js

**Type**: 🎨 HARMONIC AMPLIFICATION

**Purpose**:
Amplifies harmonic resonance during cascades.

**What it Does**:
- Increases resonance intensity
- Amplifies harmonic effects
- Creates resonance amplification visuals
- Provides amplification feedback

**Integration**:
- Reads: Cascade state, harmonic resonance
- Modifies: Resonance intensity, visual scale
- Visual: Glow increase, pulse boost

---

### 2.15 PreCascadeVisualHint_Session146.js

**Type**: 🎨 PRE-CASCADE VISUAL HINTS

**Purpose**:
Provides visual warnings before cascade events.

**What it Does**:
- Shows pre-cascade warning indicators
- Animates warning intensity
- Creates anticipatory visuals
- Provides early cascade warning

**Integration**:
- Reads: Pre-cascade state, prediction data
- Triggers: Warning visual effects
- Visual: Warning color, pulsing, glow

---

### 2.16 PHASE5_CorruptionBridge_v1.js

**Type**: 🎨 CORRUPTION BRIDGE

**Purpose**:
Bridges corruption events to visual systems.

**What it Does**:
- Converts corruption events to visual signals
- Routes corruption events to visual systems
- Manages corruption event delivery
- Provides unified corruption visual interface

**Integration**:
- Reads: Corruption events, levels
- Outputs: Corruption visual signals
- Feeds: Corruption visual systems

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

### 3.3 StandingWaveOscillationTrapSystem_Session130.js

**Type**: 🎨 WAVE PHYSICS SYSTEM

**Scene Additions**:
- Trap detection data structures (no direct geometry)
- Trap state tracking and lifecycle management
- Provides data for OscillationTrapVisualSystem

**What it Does**:
- Detects standing wave formation in harmonic field
- Identifies oscillation trap regions where energy accumulates
- Tracks trap lifecycle (formation, stability, collapse)
- Provides physics data to visual systems

**Wiring**:
- Reads: Harmonic field data, wave interference patterns
- Outputs: Trap detection events, trap state data
- Feeds: OscillationTrapVisualSystem, ResonanceRuptureVisualSystem

**Trigger Conditions**:
- Constructive interference sustained > threshold time
- Phase lock between multiple wave sources
- Energy concentration in spatial region

**Submetrics Read**:
- Harmonic field amplitude and phase
- Wave source positions and frequencies
- Interference pattern metrics
- Energy density in spatial regions

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

### 3.6 WaveInterferenceEngine_v1.js

**Type**: 🎨 WAVE PHYSICS ENGINE

**Scene Additions**:
- Interference calculation engine (no direct geometry)
- Wave superposition state tracking
- Interference field data structures

**What it Does**:
- Computes wave superposition and interference patterns
- Tracks constructive and destructive interference zones
- Provides interference data to visual systems
- Calculates beat frequencies from wave interactions

**Wiring**:
- Reads: Wave source data, reflection data from back-pressure system
- Outputs: Interference field data, zone classifications
- Feeds: WaveInterferencePatternSystem, StandingWaveVisualRenderer

**Trigger Conditions**:
- Multiple waves in same spatial region
- Reflected waves collide with incident waves
- Frequency differences create beat patterns

**Submetrics Read**:
- Wave source positions and frequencies
- Reflection wave vectors and amplitudes
- Phase relationships
- Spatial overlap calculations

---

### 3.7 WaveBurstRouter_v1.js

**Type**: 🎨 EVENT ROUTING SYSTEM

**Purpose**:
Routes wave burst events to appropriate visual systems based on wave type, intensity, and spatial context.

**What it Does**:
- Classifies wave bursts by type (constructive, destructive, standing)
- Routes events to appropriate visual handlers
- Filters and prioritizes burst events based on intensity
- Manages event delivery to particle systems and renderers

**Integration**:
- Subscribes to semantic bus wave events
- Routes to: WaveParticleEmitter, StandingWaveVisualRenderer, ResonanceEchoTrailSystem
- Performance: O(n) where n = burst events per frame

---

### 3.8 HarmonicPhaseSynchronization_Session146.js

**Type**: 🎨 HARMONIC PHASE SYSTEM

**Purpose**:
Synchronizes harmonic phases across the network to create coherent resonance patterns.

**What it Does**:
- Tracks phase of harmonic nodes across network
- Identifies phase-locked node groups
- Drives phase synchronization visualization
- Enables coordinated harmonic events

**Wiring**:
- Reads: HarmonicHub state, node phase data
- Outputs: Phase synchronization events, lock status
- Feeds: HarmonicNodeResonanceHalos, CascadeResonanceWaveVisualization

**Trigger Conditions**:
- Nodes within phase alignment threshold
- Sufficient harmonic connectivity between nodes
- Stable phase relationship maintained over time

**Submetrics Read**:
- Node harmonic phases
- Hub synchronization strength
- Phase coherence metrics
- Link harmonic connectivity

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

### 4.10 ParticleEmissionScaler.js

**Type**: 🎨 PARTICLE EMISSION CONTROL

**Purpose**:
Scales particle emission rates dynamically.

**What it Does**:
- Adjusts emission rate based on conditions
- Provides performance-based scaling
- Manages emission budgets
- Enables adaptive particle density

**Scaling Factors**:
- Performance level
- Distance from camera
- System importance
- User settings

---

### 4.11 ParticleEmissionRateScaling.js

**Type**: 🎨 EMISSION RATE SCALING

**Purpose**:
Scales particle emission rates based on metrics.

**What it Does**:
- Maps metrics to emission rates
- Provides dynamic rate adjustment
- Handles rate transitions
- Maintains rate consistency

**Integration**:
- Reads: System metrics, performance
- Outputs: Emission rate multipliers
- Used by: Particle systems

---

### 4.12 ParticleEmissionIntegrationPatch.js

**Type**: 🎨 EMISSION INTEGRATION PATCH

**Purpose**:
Integrates emission scaling into particle systems.

**What it Does**:
- Patches emission rate into systems
- Manages integration state
- Handles integration conflicts
- Provides unified emission control

---

### 4.13 StressBasedParticleScaler_v1.js

**Type**: 🎨 STRESS-BASED SCALING

**Purpose**:
Scales particle emission based on stress levels.

**What it Does**:
- Maps stress to particle density
- Increases particles during high stress
- Reduces particles during low stress
- Provides stress-based visual feedback

**Integration**:
- Reads: Stress metrics
- Outputs: Particle emission multipliers
- Visual: More particles = higher stress

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

## 6.2 HarmonicInfluencePropagationSystem_Session127.js

**Type**: 🎨 INFLUENCE PROPAGATION VISUALS

**Purpose**:
Visualizes harmonic influence propagation through network.

**What it Does**:
- Shows influence spreading from hubs
- Animates influence propagation
- Creates influence visual indicators
- Provides propagation feedback

**Integration**:
- Reads: Influence data, propagation state
- Renders: Influence wave fronts
- Visual: Expanding influence zones

---

### 6.3 HarmonicInfluencePropagationIntegrationPatch_Session127.js

**Type**: 🎨 INFLUENCE INTEGRATION PATCH

**Purpose**:
Integrates influence propagation with visual systems.

**What it Does**:
- Connects influence to visual systems
- Manages integration state
- Handles integration conflicts
- Provides unified influence visuals

---

### 6.4 HarmonicHealingVisualSystem_Session134.js

**Type**: 🎨 HEALING VISUALS

**Purpose**:
Visualizes harmonic healing effects.

**What it Does**:
- Shows healing wave propagation
- Animates healing effects
- Creates healing visual indicators
- Provides healing feedback

**Integration**:
- Reads: Healing events, harmonic state
- Triggers: Healing wave, particle effects
- Visual: Green/cyan healing waves, sparkles

---

### 6.5 HarmonicHubAuraSystem_Session126.js

**Type**: 🎨 HUB AURA VISUALS

**Purpose**:
Creates aura effects around harmonic hubs.

**What it Does**:
- Generates hub aura geometry
- Animates aura intensity
- Shows hub harmonic strength
- Provides hub status visualization

**Integration**:
- Reads: Hub harmonic data
- Renders: Aura geometry with shader
- Visual: Glowing aura around hubs

---

### 6.6 HarmonicSyncEffectApplier.js

**Type**: 🎨 SYNC EFFECT APPLIER

**Purpose**:
Applies harmonic synchronization visual effects.

**What it Does**:
- Applies sync effects to nodes
- Animates synchronization visuals
- Shows sync state
- Provides sync feedback

**Integration**:
- Reads: Sync state, harmonic data
- Applies: Sync visual effects
- Visual: Pulsing sync indicators

---

### 6.7 NodeHarmonicManager.js

**Type**: 🎨 NODE HARMONIC MANAGER

**Purpose**:
Manages harmonic state for nodes.

**What it Does**:
- Tracks node harmonic state
- Manages harmonic lifecycle
- Provides harmonic queries
- Drives harmonic visuals

**Integration**:
- Reads: Node metrics, harmonic events
- Outputs: Harmonic state
- Used by: Harmonic visual systems

---

### 6.8 NodeHarmonicSyncController.js

**Type**: 🎨 NODE SYNC CONTROLLER

**Purpose**:
Controls harmonic synchronization for nodes.

**What it Does**:
- Manages node sync state
- Controls sync transitions
- Provides sync queries
- Drives sync visuals

**Integration**:
- Reads: Node harmonic data, sync state
- Outputs: Sync control signals
- Used by: Harmonic visual systems

---

### 6.9 HarmonyStabilizationIntegrationPatch_v1.js

**Type**: 🎨 STABILIZATION INTEGRATION PATCH

**Purpose**:
Integrates stabilization with visual systems.

**What it Does**:
- Connects stabilization to visuals
- Manages integration state
- Handles integration conflicts
- Provides unified stabilization visuals

---

## 7.3 CorruptionVisualIntegrationPatch_v1.js

**Type**: 🎨 CORRUPTION INTEGRATION PATCH

**Purpose**:
Integrates corruption visuals with other systems.

**What it Does**:
- Connects corruption to visual systems
- Manages integration state
- Handles integration conflicts
- Provides unified corruption visuals

---

### 7.4 CorruptionDesaturationIntegrationPatch.js

**Type**: 🎨 DESATURATION INTEGRATION PATCH

**Purpose**:
Integrates corruption desaturation effects.

**What it Does**:
- Patches desaturation into visual systems
- Manages desaturation state
- Handles desaturation conflicts
- Provides unified desaturation behavior

---

### 7.5 CorruptionDrivenAuraDesaturationSystem.js

**Type**: 🎨 DESATURATION SYSTEM

**Purpose**:
Desaturates auras based on corruption level.

**What it Does**:
- Reduces aura saturation with corruption
- Creates desaturation transition
- Shows corruption through color loss
- Provides desaturation feedback

**Integration**:
- Reads: Corruption level, aura state
- Modifies: Aura color saturation
- Visual: Fading to gray/monochrome

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

### 9.8 SynergyColorTransition.js

**Type**: 🎨 COLOR TRANSITION SYSTEM

**Purpose**:
Handles smooth color transitions for synergy visuals.

**What it Does**:
- Interpolates color changes
- Manages transition timing
- Provides smooth color shifts
- Handles transition conflicts

**Integration**:
- Reads: Synergy state, target colors
- Outputs: Current interpolated color
- Used by: Synergy visual systems

---

### 9.9 SynergyGlowIntegrationGuide.js

**Type**: 🎨 GLOW INTEGRATION GUIDE

**Purpose**:
Guide for integrating synergy glow effects.

**What it Does**:
- Provides integration instructions
- Documents glow system usage
- Offers integration examples
- Maintains integration best practices

---

## 10.2 ArchetypeVisualProfiles_v1.js

**Type**: 🎨 ARCHETYPE PROFILES

**Purpose**:
Defines visual profiles for archetypes.

**What it Does**:
- Provides archetype visual definitions
- Specifies color schemes per archetype
- Defines animation parameters
- Maintains archetype visual consistency

**Profile Contents**:
- Color palettes (HSL adjustments)
- Animation parameters (rotation, pulse, float)
- Particle system modifications
- Glow characteristics
- Shader parameters

---

### 10.3 ArchetypeVisualTransitionEngine_v2.js

**Type**: 🎨 TRANSITION ENGINE

**Purpose**:
Handles smooth transitions between archetype visuals.

**What it Does**:
- Interpolates archetype visual changes
- Manages transition timing
- Provides smooth visual transitions
- Handles transition conflicts

**Integration**:
- Reads: Source and target archetypes
- Interpolates: Visual parameters
- Performance: Smooth lerp transitions

---

### 10.4 ArchetypeVisualIntegrationPatch_v1.js

**Type**: 🎨 INTEGRATION PATCH

**Purpose**:
Integrates archetype visuals with node systems.

**What it Does**:
- Patches archetype visuals into nodes
- Manages integration state
- Handles integration conflicts
- Provides unified archetype behavior

---

### 10.5 ArchetypeShaderModes_v1.js

**Type**: 🎨 SHADER MODE DEFINITIONS

**Purpose**:
Defines shader modes for archetypes.

**What it Does**:
- Specifies shader parameters per archetype
- Provides shader mode queries
- Manages shader mode transitions
- Maintains shader consistency

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

## 12.2 SafeDreamDepthPack.js

**Type**: 🎨 LOW-COST DEPTH EFFECTS

**Purpose**:
Low-cost fallback depth layer for ATOMA. Use when DreamDepthEffectManager is too expensive.

**Features**:
- Minimal performance impact
- Simple depth of field
- Basic vignette
- Subtle dream atmosphere

**Fallback Role**:
- Activated when performance budget tight
- Maintains dream aesthetic with low cost
- Smooth transition from/to rich pack

---

### 12.3 DreamDesert.js

**Type**: 🎨 ENVIRONMENT BACKGROUND

**Purpose**:
Desert environment background for ATOMA dream state.

**What it Does**:
- Creates desert landscape
- Provides atmospheric depth
- Adds environment texture
- Enhances dream atmosphere

**Visual Style**:
- Sandy/earthy colors
- Dunes and ridges
- Hazy atmosphere
- Dream-like distortion

---

### 12.4 DreamDesert2.js

**Type**: 🎨 ENVIRONMENT BACKGROUND V2

**Purpose**:
Enhanced desert environment background.

**What it Does**:
- Improved desert landscape
- Better atmospheric effects
- Enhanced environment texture
- Richer dream atmosphere

**Improvements over V1**:
- More detail in terrain
- Better lighting
- Improved atmosphere
- Enhanced visual quality

---

### 12.5 FractalValley.js

**Type**: 🎨 ENVIRONMENT BACKGROUND

**Purpose**:
Fractal valley environment background.

**What it Does**:
- Creates fractal valley landscape
- Provides complex geometry
- Adds mathematical beauty
- Enhances visual interest

**Visual Style**:
- Fractal-based geometry
- Mathematical patterns
- Complex terrain
- Intricate details

---

### 12.6 QuantumIsland.js

**Type**: 🎨 ENVIRONMENT BACKGROUND

**Purpose**:
Quantum island environment background.

**What it Does**:
- Creates quantum-themed island
- Provides sci-fi atmosphere
- Adds quantum visual motifs
- Enhances futuristic feel

**Visual Style**:
- Quantum patterns
- Sci-fi aesthetics
- Floating structures
- Quantum effects

---

### 12.7 SigmaRiftChamber.js

**Type**: 🎨 ENVIRONMENT BACKGROUND

**Purpose**:
Sigma rift chamber environment background.

**What it Does**:
- Creates rift chamber environment
- Provides dramatic atmosphere
- Adds rift visual motifs
- Enhances tension

**Visual Style**:
- Rift geometry
- Dramatic lighting
- Tension-inducing effects
- Powerful atmosphere

---

### 12.8 MemoryLane.js

**Type**: 🎨 ENVIRONMENT EFFECT

**Purpose**:
Memory lane visual effect for ATOMA.

**What it Does**:
- Creates memory lane visualization
- Shows past states/paths
- Provides temporal context
- Enhances narrative

**Visual Style**:
- Path-like structure
- Ghostly trails
- Temporal echoes
- Memory fragments

---

### 12.9 CinematicUpgrade.js

**Type**: 🎨 CINEMATIC EFFECTS

**Purpose**:
Cinematic visual upgrades for ATOMA.

**What it Does**:
- Adds cinematic effects
- Enhances visual drama
- Improves presentation quality
- Provides film-like aesthetics

**Effects**:
- Enhanced lighting
- Better color grading
- Improved camera effects
- Cinematic transitions

---

## 13 HARMONIC HUB CONTROLLERS

### 13.1 HarmonicHubCollapseController.js

**Type**: 🎨 HUB STATE VISUALS

**Purpose**:
Visualizes harmonic hub collapse events when synchronization breaks down.

**What it Does**:
- Triggers collapse visual effects on hub failure
- Coordinates node and link response visuals
- Manages collapse animation sequences
- Provides visual feedback for hub lifecycle end

**Wiring**:
- Reads: Hub stability, synchronization strength
- Triggers: Collapse animations, visual decay
- Integrates with: HarmonicNodeResonanceHalos, CascadingRuptureSystem

**Trigger Conditions**:
- Hub synchronization falls below threshold
- Active link count drops below minimum
- Hub stability critical

**Submetrics Read**:
- Hub synchronization strength
- Active link count
- Node harmonic stability
- Collapse trigger events

---

### 13.2 HarmonicHubRecoveryController.js

**Type**: 🎨 HUB STATE VISUALS

**Purpose**:
Visualizes harmonic hub recovery and re-synchronization processes.

**What it Does**:
- Orchestrates recovery visual sequences
- Coordinates healing effects on hub nodes
- Manages re-synchronization animation
- Provides positive feedback for hub restoration

**Wiring**:
- Reads: Recovery state, synchronization progress
- Triggers: Recovery animations, healing effects
- Integrates with: HarmonicHealingVisualSystem, HarmonicRecoveryVisualSystem

**Trigger Conditions**:
- Hub enters recovery state
- Synchronization strength increases
- Healing thresholds reached

**Submetrics Read**:
- Recovery progress
- Synchronization restoration level
- Hub node harmony
- Healing event data

---

### 13.3 HarmonicHubResilienceController.js

**Type**: 🎨 HUB STATE VISUALS

**Purpose**:
Visualizes harmonic hub resilience and adaptive response to stress.

**What it Does**:
- Shows hub resilience through visual stability
- Modulates visuals based on stress/recovery balance
- Displays adaptive response animations
- Indicates hub health and capacity

**Wiring**:
- Reads: Resilience metrics, stress levels, recovery state
- Modulates: Visual intensity, color, animation speed
- Integrates with: HarmonicNodeResonanceHalos, StressVisualShaders

**Trigger Conditions**:
- Hub under stress but maintaining function
- Resilience response activated
- Recovery/collapse balance changes

**Submetrics Read**:
- Hub resilience score
- Stress level metrics
- Recovery rate
- Adaptive response triggers

---

## 14 PULSE WAVE SYSTEMS

### 14.1 PulseWaveSystemBridge_v1.js

**Type**: 🎨 EVENT BRIDGE

**Purpose**:
Bridges pulse events to wave visual systems, converting pulse data into wave-compatible format.

**What it Does**:
- Converts pulse events to wave burst format
- Routes pulse data to wave renderers
- Synchronizes pulse timing with wave systems
- Manages pulse-to-wave lifecycle

**Integration**:
- Reads: Link pulse events, LinkResonanceFlowSystem
- Outputs: Wave burst events for WaveBurstRouter
- Feeds: WaveParticleEmitter, StandingWaveVisualRenderer

**Trigger Conditions**:
- Pulse spawning from LinkResonanceFlowSystem
- Pulse collision/intersection events
- Pulse boundary interactions

**Submetrics Read**:
- Pulse position, intensity, direction
- Link curve data
- Pulse timing data

---

### 14.2 PulseIntersectionImpulseAdapter_v1.js

**Type**: 🎨 INTERSECTION VISUALS

**Purpose**:
Creates visual effects when pulses intersect or collide on links.

**What it Does**:
- Detects pulse intersection events
- Generates intersection impulse visuals
- Modulates visual intensity based on pulse energy
- Creates constructive/destructive interference effects at intersection

**Integration**:
- Reads: Pulse positions, collision events
- Triggers: Intersection flash, particle burst, wave distortion
- Performance: O(n²) intersection detection, optimized with spatial partitioning

**Trigger Conditions**:
- Two or more pulses in proximity
- Pulse paths intersect or converge
- Sufficient combined pulse energy

**Submetrics Read**:
- Pulse positions and velocities
- Pulse intensity and energy
- Intersection point calculation

---

### 14.3 PulseBoundaryInteractionAdapter_v1.js

**Type**: 🎨 BOUNDARY VISUALS

**Purpose**:
Creates visual effects when pulses reach link boundaries (node endpoints).

**What it Does**:
- Detects pulse arrival at nodes
- Generates absorption/rebound visuals
- Shows energy transfer to target nodes
- Creates boundary flash and ripple effects

**Integration**:
- Reads: Pulse positions, link endpoints
- Triggers: Node absorption flash, ripple emission, energy transfer
- Feeds: NodeImpactManager, ResonanceEchoTrailSystem

**Trigger Conditions**:
- Pulse reaches link endpoint
- Pulse absorbed by node
- Pulse rebounds (boundary reflection)

**Submetrics Read**:
- Pulse position and progress
- Link endpoint coordinates
- Target node state

---

## 15 VISUAL AUTHORITY SYSTEMS

### 15.1 VisualAuthority.js

**Type**: 🎨 CORE AUTHORITY SYSTEM

**Purpose**:
Defines canonical authority for visual systems in ATOMA. Establishes which systems have authority over which visual aspects.

**What it Does**:
- Declares visual authority domains (links, nodes, auras, particles, etc.)
- Prevents conflicts between competing visual systems
- Provides authority checking and validation
- Manages authority flag distribution

**Integration**:
- Used by: All visual systems for authority registration
- Checked by: ShaderVariantDetector, VisualAutoWiringSystem
- Performance: O(1) authority lookups via Map

---

### 15.2 VisualAuthorityFlag.js

**Type**: 🎨 AUTHORITY FLAGS

**Purpose**:
Defines flag constants for visual authority claims and system capabilities.

**Authority Flags**:
- LINK_VISUAL_AUTHORITY: Core link rendering
- NODE_VISUAL_AUTHORITY: Core node rendering
- AURA_VISUAL_AUTHORITY: Aura effect authority
- PARTICLE_VISUAL_AUTHORITY: Particle system authority
- SHADER_AUTHORITY: Shader modification authority

---

### 15.3 CoreVisualAuthoritySystem.js

**Type**: 🎨 AUTHORITY ORCHESTRATION

**Purpose**:
Central system managing visual authority claims, conflicts, and resolution.

**What it Does**:
- Registers authority claims from visual systems
- Detects and resolves authority conflicts
- Provides authority status queries
- Manages authority transfer and delegation

**Integration**:
- Called by: Visual systems during initialization
- Provides: Authority validation, conflict resolution
- Logs: Authority conflicts and resolutions

---

### 15.4 NodeVisualAuthorityRuntime.js

**Type**: 🎨 NODE AUTHORITY RUNTIME

**Purpose**:
Runtime authority system specifically for node visual management.

**What it Does**:
- Manages node visual authority at runtime
- Tracks which system controls each node's visuals
- Handles dynamic authority changes
- Provides node-level authority queries

**Integration**:
- Used by: NodeVisualRegistry, NodeVisualStateBinder
- Reads: Node visual state, authority claims
- Updates: Authority assignments on node creation/destruction

---

### 15.5 NodeVisualReadinessGate_v1.js

**Type**: 🎨 READINESS GATE

**Purpose**:
Ensures node visuals are ready before activating visual systems.

**What it Does**:
- Checks node visual readiness (materials, geometry, shaders)
- Gates visual system activation until nodes ready
- Provides readiness callbacks
- Manages readiness state for all nodes

**Integration**:
- Used by: VisualAutoWiringSystem, Shader systems
- Prevents: Visual system activation on unready nodes
- Performance: O(1) readiness checks

---

### 15.6 VisualTemplateRegistry.js

**Type**: 🎨 TEMPLATE REGISTRY

**Purpose**:
Registry for canonical visual templates (SynergyGlow, HarmonyAura, StressTurbulence).

**What it Does**:
- Registers visual template definitions
- Provides template access to visual systems
- Manages template lifecycle
- Enforces template constraints

**Integration**:
- Used by: VisualTemplateResolver, VisualAutoWiringSystem
- Provides: Template definitions, parameters, constraints
- Templates: #1 SynergyGlow, #2 HarmonyAura, #3 StressTurbulence

---

### 15.7 VisualTemplateResolver.js

**Type**: 🎨 TEMPLATE RESOLVER

**Purpose**:
Resolves and applies visual templates to renderables based on state and context.

**What it Does**:
- Resolves appropriate template for each renderable
- Applies template parameters to materials/shaders
- Manages template transitions
- Handles template overrides

**Integration**:
- Reads: Renderable state, metrics
- Uses: VisualTemplateRegistry for templates
- Outputs: Applied template parameters

---

### 15.8 VisualAutoWiringSystem.js

**Type**: 🎨 AUTO-WIRING SYSTEM

**Purpose**:
Automatically wires visual controllers to renderables based on authority and templates.

**What it Does**:
- Auto-discovers renderables needing visual controllers
- Wires appropriate controllers based on authority
- Applies templates automatically
- Manages controller lifecycle

**Integration**:
- Reads: VisualAuthority, VisualTemplateRegistry
- Wires: SynergyGlowController, HarmonyAuraController, StressTurbulenceController
- Performance: O(n) where n = renderables

---

## 16 ADDITIONAL LINK VFX

### 16.1 NeonLinkVisuals.js

**Type**: 🎨 LINK STYLE VARIANT

**Purpose**:
Alternative neon-style link visual effects.

**What it Does**:
- Applies neon color profiles to links
- Adds glow and bloom effects
- Creates high-contrast link visuals
- Provides alternative aesthetic option

**Visual Style**:
- Bright, saturated neon colors
- Strong glow/bloom effects
- Sharp, clean line geometry
- High visibility

---

### 16.2 DynamicLinkColorSystem.js

**Type**: 🎨 LINK COLOR SYSTEM

**Purpose**:
Dynamic color assignment to links based on multiple factors.

**What it Does**:
- Calculates link colors based on metrics
- Applies color transitions smoothly
- Supports multiple color modes
- Provides color-based visual feedback

**Color Modes**:
- Metric-based (synergy, harmony, corruption)
- Category-based (node categories)
- State-based (cascade, resonance, stress)
- Custom user-defined

---

### 16.3 LinkDirectionalStreaks.js

**Type**: 🎨 LINK DIRECTION VISUALS

**Purpose**:
Creates directional streak effects on links showing energy flow direction.

**What it Does**:
- Renders streak patterns along link curves
- Animate streaks from source to target
- Modulates streak intensity based on flow
- Provides clear directional indication

**Integration**:
- Reads: Link direction, flow metrics
- Uses: Shader-based streak rendering
- Performance: GPU-driven, minimal CPU cost

---

### 16.4 LinkSurfacePhaseRipples.js

**Type**: 🎨 LINK SURFACE EFFECTS

**Purpose**:
Creates phase-based ripple effects on link surfaces.

**What it Does**:
- Animates ripple patterns on link geometry
- Synchronizes ripples with harmonic phase
- Creates wave propagation visual on link surface
- Enhances visual complexity

**Integration**:
- Reads: Harmonic phase, link metrics
- Uses: Shader-based ripple animation
- Submetrics: Phase, amplitude, frequency

---

### 16.5 LinkRingArcDischarges.js

**Type**: 🎨 LINK ENERGY EFFECTS

**Purpose**:
Creates arc discharge effects on link rings.

**What it Does**:
- Generates electrical arc visuals
- Triggers discharges on high energy events
- Animates arc paths along rings
- Provides dynamic energy visual

**Integration**:
- Reads: Link energy, cascade events
- Triggers: On cascade, resonance, high synergy
- Visual: Electric arc geometry with glow

---

## 24 NODE VISUAL SYSTEMS CORE

### 24.1 _NodeVisuals4_0.js

**Type**: 🎨 MAIN NODE VISUALS V4

**Purpose**:
Main node visual system for ATOMA v4.

**What it Does**:
- Core node rendering
- Node lifecycle management
- Node visual state
- Node event handling

**Features**:
- Modern node rendering
- Efficient visual updates
- Event-driven changes
- Optimized performance

---

### 24.2 _NodeVisualBootstrap3_0.js

**Type**: 🎨 NODE VISUAL BOOTSTRAP

**Purpose**:
Bootstrap system for node visuals.

**What it Does**:
- Initializes node visuals
- Sets up visual components
- Manages bootstrap lifecycle
- Provides visual foundation

---

### 24.3 NodeShaderActivation_v1.js

**Type**: 🎨 NODE SHADER ACTIVATION

**Purpose**:
Activates and manages node shaders.

**What it Does**:
- Activates node shaders
- Manages shader lifecycle
- Handles shader transitions
- Provides shader queries

---

### 24.4 Atoma_nodes/StorageNodesVisual_Session116.js

**Type**: 🎨 STORAGE NODE VISUALS

**Purpose**:
Visual system for storage nodes.

**What it Does**:
- Renders storage nodes
- Shows storage capacity
- Visualizes storage state
- Provides storage feedback

---

### 24.5 NodeCoreOpaqueEnforcer_Session113.js

**Type**: 🎨 NODE CORE VISUALS

**Purpose**:
Enforces opaque rendering for node cores.

**What it Does**:
- Ensures core opacity
- Manages core rendering
- Handles core visual state
- Provides core visibility

---

### 24.6 NodeDepthAndHoloPreservationFix.js

**Type**: 🎨 NODE VISUAL FIX

**Purpose**:
Fix for node depth and hologram preservation.

**What it Does**:
- Preserves depth information
- Maintains hologram effects
- Fixes visual artifacts
- Ensures correct rendering

---

### 24.7 NodeVisualIntegrityFix.js

**Type**: 🎨 NODE INTEGRITY FIX

**Purpose**:
Fixes node visual integrity issues.

**What it Does**:
- Repairs visual glitches
- Ensures visual consistency
- Fixes state corruption
- Maintains visual quality

---

## 18 AUDIO-REACTIVE VFX

### 18.1 HarmonicAudioReactivitySystem_Session135.js

**Type**: 🎨 CROSS-MODAL VFX

**Purpose**:
Creates visual effects synchronized with audio signals from harmonic events.

**What it Does**:
- Listens to audio system for harmonic tones
- Triggers visual effects on audio events
- Synchronizes visual pulse with audio rhythm
- Creates cross-modal feedback (audio + visual)

**Integration**:
- Reads: Audio events, harmonic state
- Triggers: Visual pulse, ripple, glow
- Feeds: AudioSystem for tone triggers

**Visual Effects**:
- Pulse on tone start
- Ripple on sustained tone
- Glow modulation with amplitude
- Color shift with pitch

---

## 23 GLYPH SYSTEMS

### 23.1 MegaGlyphSystem.js

**Type**: 🎨 LARGE GLYPH SYSTEM

**Purpose**:
Creates and manages large-scale glyph visualizations.

**What it Does**:
- Generates large glyph geometry
- Manages glyph lifecycle
- Provides glyph visual effects
- Handles glyph interactions

**Integration**:
- Uses: Procedural generation
- Renders: Large glyph meshes
- Visual: Complex glyph structures

---

### 23.2 MegaGlyphConduit.js

**Type**: 🎨 GLYPH CONDUIT

**Purpose**:
Conduit system for large glyphs.

**What it Does**:
- Manages glyph data flow
- Connects glyphs to systems
- Handles glyph events
- Provides glyph coordination

---

### 23.3 GlyphFusionZone.js

**Type**: 🎨 GLYPH FUSION ZONE

**Purpose**:
Manages glyph fusion zones.

**What it Does**:
- Detects glyph convergence
- Manages fusion zones
- Triggers fusion events
- Coordinates fusion visuals

**Integration**:
- Reads: Glyph positions, states
- Detects: Convergence zones
- Triggers: Fusion events

---

### 23.4 GlyphAnimationModulator.js

**Type**: 🎨 GLYPH ANIMATION MODULATOR

**Purpose**:
Modulates glyph animation parameters.

**What it Does**:
- Adjusts animation speed
- Modulates animation intensity
- Handles animation transitions
- Provides animation feedback

---

### 23.5 _AtomaGlyphSystem4_0.js

**Type**: 🎨 MAIN GLYPH SYSTEM V4

**Purpose**:
Main glyph system for ATOMA v4.

**What it Does**:
- Core glyph generation
- Glyph lifecycle management
- Glyph visual rendering
- Glyph event handling

**Features**:
- Procedural glyph generation
- Multi-glyph support
- Efficient rendering
- Event-driven updates

---

### 23.6 _GlyphFusionOverlay4_1.js

**Type**: 🎨 GLYPH FUSION OVERLAY

**Purpose**:
Overlay for glyph fusion effects.

**What it Does**:
- Shows fusion overlay visuals
- Animates fusion effects
- Provides fusion feedback
- Manages overlay lifecycle

---

### 23.7 _GlyphLayer4_MultiFusion.js

**Type**: 🎨 MULTI-FUSION GLYPH LAYER

**Purpose**:
Handles multi-glyph fusion scenarios.

**What it Does**:
- Manages multiple glyph fusion
- Coordinates fusion events
- Provides multi-fusion visuals
- Handles fusion conflicts

---

### 23.8 _GlyphPurityMode5_1.js

**Type**: 🎨 GLYPH PURITY MODE

**Purpose**:
Purity mode for glyph visualization.

**What it Does**:
- Provides pure glyph visuals
- Reduces visual noise
- Focuses on glyph clarity
- Enhances glyph readability

---

### 23.9 _AdaptiveGlyphRendering1_0.js

**Type**: 🎨 ADAPTIVE GLYPH RENDERING

**Purpose**:
Adaptive rendering system for glyphs.

**What it Does**:
- Adapts glyph quality to performance
- Manages LOD for glyphs
- Optimizes glyph rendering
- Maintains visual quality

**Adaptive Features**:
- Performance-based quality
- Distance-based LOD
- Dynamic complexity adjustment
- Smooth quality transitions

---

### 23.10 _LinkedGlyphMessaging3_0.js

**Type**: 🎨 LINKED GLYPH MESSAGING

**Purpose**:
Messaging system for linked glyphs.

**What it Does**:
- Manages glyph communication
- Handles glyph messages
- Coordinates glyph interactions
- Provides messaging feedback

---

### 23.11 _LinkedGlyphSynchronization1_0.js

**Type**: 🎨 LINKED GLYPH SYNC

**Purpose**:
Synchronizes linked glyphs.

**What it Does**:
- Syncs glyph animation
- Coordinates glyph timing
- Manages sync state
- Provides sync feedback

---

### 23.12 _RecursiveGlyphSignalSystem.js

**Type**: 🎨 RECURSIVE GLYPH SIGNALS

**Purpose**:
Recursive signal system for glyphs.

**What it Does**:
- Manages recursive glyph signals
- Handles signal propagation
- Coordinates recursive events
- Provides signal feedback

---

### 23.13 _RecursiveGlyphMessaging4_0.js

**Type**: 🎨 RECURSIVE GLYPH MESSAGING

**Purpose**:
Recursive messaging for glyphs.

**What it Does**:
- Manages recursive messaging
- Handles message propagation
- Coordinates recursive events
- Provides messaging feedback

---

### 23.14 _SemanticGlyphAI.js

**Type**: 🎨 AI-DRIVEN GLYPHS

**Purpose**:
AI-driven semantic glyph generation.

**What it Does**:
- Uses AI for glyph generation
- Provides semantic glyph meaning
- Adapts glyphs to context
- Creates intelligent glyph behavior

---

### 23.15 _MythicSeedGlyph.js

**Type**: 🎨 MYTHIC SEED GLYPHS

**Purpose**:
Mythic seed glyph system.

**What it Does**:
- Generates mythic glyphs
- Provides seed-based generation
- Creates unique glyph patterns
- Offers mythic visual effects

---

## 28 ADDITIONAL VFX SYSTEMS

### 28.1 VisualNetworkTimeElasticity_v1.js

**Type**: 🎨 TIME ELASTICITY VFX

**Purpose**:
Time-based visual elasticity effects.

**What it Does**:
- Creates time-based visual distortion
- Modulates visual speed based on state
- Provides temporal visual effects
- Shows network time elasticity

---

### 28.2 SimulationEffectOrchestrator.js

**Type**: 🎨 EFFECT ORCHESTRATION

**Purpose**:
Orchestrates simulation-based visual effects.

**What it Does**:
- Coordinates simulation effects
- Manages effect timing
- Provides orchestration control
- Handles effect sequencing

---

### 28.3 SimulationEffectPool.js

**Type**: 🎨 EFFECT POOLING

**Purpose**:
Pooled effect objects for simulation effects.

**What it Does**:
- Manages effect object pool
- Reuses effects for performance
- Provides efficient effect creation
- Handles pool lifecycle

---

### 28.4 TemporalEventEffects.js

**Type**: 🎨 TEMPORAL EFFECTS

**Purpose**:
Time-based event visual effects.

**What it Does**:
- Creates temporal visual effects
- Manages time-based animations
- Provides temporal feedback
- Shows event timing

---

### 28.5 InterferenceEffectApplier.js

**Type**: 🎨 INTERFERENCE EFFECTS

**Purpose**:
Applies interference-based visual effects.

**What it Does**:
- Creates interference patterns
- Shows wave interference
- Provides interference feedback
- Visualizes conflict resolution

---

### 28.6 RegionalEquilibriumFieldSystem.js

**Type**: 🎨 REGIONAL FIELD SYSTEM

**Purpose**:
Regional equilibrium field visualization.

**What it Does**:
- Shows regional equilibrium
- Visualizes field states
- Provides regional feedback
- Displays balance metrics

---

### 28.7 RegionalHarmonicCycleController.js

**Type**: 🎨 REGIONAL CYCLE CONTROL

**Purpose**:
Controls regional harmonic cycles.

**What it Does**:
- Manages regional cycles
- Controls cycle timing
- Provides cycle feedback
- Visualizes cycle state

---

### 28.8 RegionalHarmonyZones.js

**Type**: 🎨 REGIONAL ZONE SYSTEM

**Purpose**:
Regional harmony zone visualization.

**What it Does**:
- Shows harmony zones
- Visualizes regional harmony
- Provides zone feedback
- Displays harmony levels

---

### 28.9 VisualInteractionIsolationPatch_v2_CRITICAL_FIX.js

**Type**: 🎨 CRITICAL FIX

**Purpose**:
Critical fix for visual interaction isolation.

**What it Does**:
- Fixes interaction isolation issues
- Prevents visual conflicts
- Ensures correct interaction
- Maintains system stability

---

### 28.10 NodeLinkedAuraSystem.js

**Type**: 🎨 LINKED AURA SYSTEM

**Purpose**:
Linked aura system between nodes.

**What it Does**:
- Creates linked auras
- Shows connection strength
- Provides link feedback
- Visualizes node relationships

---

### 28.11 LinkedAuraHarmonyBands.js

**Type**: 🎨 HARMONY BAND SYSTEM

**Purpose**:
Harmony bands in linked auras.

**What it Does**:
- Shows harmony bands
- Visualizes harmony levels
- Provides band feedback
- Displays harmony gradients

---

### 28.12 FireLikeAuraConfig.js

**Type**: 🎨 AURA CONFIGURATION

**Purpose**:
Fire-like aura configuration.

**What it Does**:
- Configures fire-like auras
- Provides fire parameters
- Offers flame effects
- Creates burning visuals

---

### 28.13 FresnelAuraIntegrationPatch.js

**Type**: 🎨 FRESNEL INTEGRATION PATCH

**Purpose**:
Integrates Fresnel effects into auras.

**What it Does**:
- Patches Fresnel into auras
- Manages Fresnel state
- Provides Fresnel effects
- Enhances aura visuals

---

### 28.14 HarmonyAuraController.js

**Type**: 🎨 HARMONY AURA CONTROL

**Purpose**:
Controls harmony aura effects.

**What it Does**:
- Manages harmony auras
- Controls aura intensity
- Provides harmony feedback
- Visualizes harmony state

---

### 28.15 PersonalityRuntime_v1.js

**Type**: 🎨 PERSONALITY RUNTIME

**Purpose**:
Runtime system for personality visualization.

**What it Does**:
- Manages personality state
- Controls personality visuals
- Provides personality feedback
- Visualizes personality traits

---

### 28.16 PersonalitySignalSmoother_v1.js

**Type**: 🎨 SIGNAL SMOOTHING

**Purpose**:
Smooths personality-based visual signals.

**What it Does**:
- Smooths personality signals
- Reduces visual jitter
- Provides stable visuals
- Maintains personality clarity

---

### 28.17 PersonalityMaterialProfileRegistry_v1.js

**Type**: 🎨 MATERIAL PROFILE REGISTRY

**Purpose**:
Registry for personality material profiles.

**What it Does**:
- Stores material profiles
- Provides profile queries
- Manages profile lifecycle
- Maintains profile consistency

---

### 28.18 _SafeNodePersonalityFX.js

**Type**: 🎨 SAFE PERSONALITY FX

**Purpose**:
Safe personality-based visual effects.

**What it Does**:
- Provides personality visuals
- Maintains system safety
- Offers personality feedback
- Visualizes personality traits

---

### 28.19 _ExtremeAIShaderPack.js

**Type**: 🎨 EXTREME AI SHADERS

**Purpose**:
Extreme AI-style shader effects.

**What it Does**:
- Creates AI-themed visuals
- Provides extreme effects
- Shows AI influence
- Offers AI aesthetics

---

### 28.20 NeuralConvergenceSingularity.js

**Type**: 🎨 CONVERGENCE VISUALS

**Purpose**:
Visualizes neural convergence singularity.

**What it Does**:
- Shows convergence point
- Creates singularity effect
- Provides convergence feedback
- Visualizes neural focus

---

### 28.21 VisualMetricModel_v1.js

**Type**: 🎨 METRIC VISUAL MODEL

**Purpose**:
Visual model for metric-based effects.

**What it Does**:
- Maps metrics to visuals
- Provides visual mapping
- Handles metric changes
- Maintains visual consistency

---

### 28.22 MetricInterpretationLayer_v1.js

**Type**: 🎨 METRIC INTERPRETATION

**Purpose**:
Interprets metrics for visual use.

**What it Does**:
- Interprets metric values
- Maps to visual parameters
- Provides interpretation
- Handles metric transitions

---

### 28.23 SemanticMetricAdapter.js

**Type**: 🎨 SEMANTIC METRIC ADAPTER

**Purpose**:
Adapts semantic metrics for visual systems.

**What it Does**:
- Adapts semantic metrics
- Provides visual queries
- Handles semantic changes
- Maintains semantic consistency

---

### 28.24 VisualEchoTrails_v1_Integration.js

**Type**: 🎨 ECHO TRAILS INTEGRATION

**Purpose**:
Integrates echo trail effects.

**What it Does**:
- Integrates echo trails
- Manages trail lifecycle
- Provides trail feedback
- Visualizes echoes

---

### 28.25 EchoRippleIntegrationPatch_Session125.js

**Type**: 🎨 ECHO RIPPLE INTEGRATION PATCH

**Purpose**:
Integrates echo ripple effects.

**What it Does**:
- Patches echo ripple into systems
- Manages ripple state
- Provides ripple feedback
- Visualizes echo ripples

---

### 28.26 LinkMicroImpulseIntegrationSetup.js

**Type**: 🎨 MICRO IMPULSE SETUP

**Purpose**:
Sets up micro impulse integration.

**What it Does**:
- Initializes micro impulses
- Connects impulse to systems
- Manages impulse lifecycle
- Provides impulse integration

---

### 28.27 Phase8VisualBridge.js

**Type**: 🎨 PHASE 8 VISUAL BRIDGE

**Purpose**:
Bridges Phase 8 events to visual systems.

**What it Does**:
- Converts Phase 8 events to visuals
- Routes events to visual systems
- Manages bridge state
- Provides Phase 8 visualization

---

### 28.28 NetworkRituals_v1.js

**Type**: 🎨 NETWORK RITUALS SYSTEM

**Purpose**:
System for network ritual events.

**What it Does**:
- Manages ritual lifecycle
- Triggers ritual events
- Provides ritual state
- Coordinates ritual systems

---

### 28.29 _MythicRitualController.js

**Type**: 🎨 MYTHIC RITUAL CONTROL

**Purpose**:
Controller for mythic rituals.

**What it Does**:
- Controls mythic rituals
- Manages ritual state
- Provides ritual feedback
- Visualizes mythic events

---

### 28.30 SafeLegendaryLinkFX.js

**Type**: 🎨 LEGENDARY LINK FX

**Purpose**:
Legendary visual effects for links.

**What it Does**:
- Creates legendary effects
- Shows link importance
- Provides legendary feedback
- Visualizes mythic status

---

## 26 POST-PROCESSING SYSTEMS

### 26.1 PostProcessing.js

**Type**: 🎨 POST-PROCESSING PIPELINE

**Purpose**:
Central post-processing pipeline for ATOMA.

**What it Does**:
- Manages post-processing passes
- Applies visual effects
- Handles render targets
- Provides post-processing control

**Effects**:
- Bloom pass (glow)
- Chromatic aberration
- Vignette
- Film grain
- Haze/fog
- Exposure adjustment

**Integration**:
- Uses: THREE.js EffectComposer
- Passes: Multiple post-processing passes
- Performance: Optimized pass ordering

---

## 25 SHADER SYSTEMS

### 25.1 ATOMAShaderBase.js

**Type**: 🎨 SHADER BASE CLASS

**Purpose**:
Base class for ATOMA shaders.

**What it Does**:
- Provides common shader functionality
- Defines shader interface
- Manages shader lifecycle
- Offers shader utilities

---

### 25.2 UtilityShaders.js

**Type**: 🎨 UTILITY SHADERS

**Purpose**:
Shared utility shader functions.

**What it Does**:
- Provides common shader functions
- Offers utility macros
- Defines helper uniforms
- Maintains shader consistency

---

### 25.3 NeonPulseShader.js

**Type**: 🎨 PULSE SHADER

**Purpose**:
Pulsing neon glow shader effects.

**What it Does**:
- Creates neon glow
- Animates pulse effects
- Provides color modulation
- Offers intensity control

---

### 25.4 NeonEdgeGlowShader.js

**Type**: 🎨 EDGE GLOW SHADER

**Purpose**:
Edge-based glow shader effects.

**What it Does**:
- Detects edges in geometry
- Applies glow to edges
- Provides edge highlighting
- Offers edge control

---

### 25.5 RiftEnergyShader.js

**Type**: 🎨 RIFT ENERGY SHADER

**Purpose**:
Rift/tear energy visualizations.

**What it Does**:
- Creates rift energy effects
- Shows tear visualization
- Provides energy distortion
- Offers rift animation

---

### 25.6 StressVisualShaders.js

**Type**: 🎨 STRESS SHADERS

**Purpose**:
Stress and turbulence shader effects.

**What it Does**:
- Visualizes stress levels
- Shows turbulence effects
- Provides stress-based distortion
- Offers stress animation

---

### 25.7 AITechDistortionShader.js

**Type**: 🎨 AI DISTORTION SHADER

**Purpose**:
AI/tech distortion effects.

**What it Does**:
- Creates tech-style distortion
- Shows AI influence
- Provides digital artifacts
- Offers glitch effects

---

### 25.8 NodeSegmentedOrbitRings.js

**Type**: 🎨 ORBIT RING SHADER

**Purpose**:
Segmented orbital rings around nodes.

**What it Does**:
- Creates segmented ring geometry
- Animates ring rotation
- Provides orbit visualization
- Offers ring customization

---

### 25.9 LinkStateVisualLanguage.js

**Type**: 🎨 LINK STATE SHADER

**Purpose**:
Link state visual encoding.

**What it Does**:
- Encodes state in visual patterns
- Provides state-based coloring
- Shows state transitions
- Offers state visualization

---

### 25.10 FresnelRimLightAuraShader.js

**Type**: 🎨 FRESNEL AURA SHADER

**Purpose**:
Fresnel-based rim lighting for auras.

**What it Does**:
- Applies Fresnel effect
- Creates rim lighting
- Provides aura glow
- Offers Fresnel control

---

### 25.11 HarmonyAuraShaderMaterial.js

**Type**: 🎨 HARMONY AURA SHADER

**Purpose**:
Harmony-specific aura materials.

**What it Does**:
- Creates harmony-based aura
- Shows harmonic state
- Provides harmony coloring
- Offers aura customization

---

### 25.12 StressTurbulenceShaderMaterial.js

**Type**: 🎨 STRESS TURBULENCE SHADER

**Purpose**:
Stress turbulence materials.

**What it Does**:
- Creates turbulence effects
- Shows stress levels
- Provides stress distortion
- Offers turbulence control

---

### 25.13 CoreHologramShader.js

**Type**: 🎨 HOLOGRAM SHADER

**Purpose**:
Holographic rendering effects.

**What it Does**:
- Creates hologram effect
- Provides hologram distortion
- Shows hologram scanning
- Offers hologram customization

---

## STRUCTURAL NOTE

The document is organized into 22 main categories:
- 0-7: Core VFX categories (Link, Resonance, Cascade, Waves, Particles, Synergy, Harmony, Corruption)
- 8: Ritual VFX (Phase8 + RitualVisualOrchestrator)
- 9: Synergy VFX Engine (7 subsystems)
- 10: Archetype VFX
- 11: Colony VFX
- 12: Dream Effects
- 13: Harmonic Hub Controllers (3 systems)
- 14: Pulse Wave Systems (3 systems)
- 15: Visual Authority Systems (8 systems)
- 16: Additional Link VFX (5 systems)
- 17: Node Visual Systems (5 systems)
- 18: Audio-Reactive VFX (1 system)
- 19: Procedural Glyph Systems (2 systems)
- 20: Environmental VFX (6 systems)
- 21: Visual Performance Systems (4 systems)
- 22: Shader Bridge Systems (9 systems)

This structure reflects the multi-layered nature of ATOMA's visual system, with clear separation between:
- Core rendering layers (link, particles, shaders)
- Semantic visualization (synergy, harmony, corruption)
- Event-driven visualizations (rituals, cascades, waves)
- System layers (VFX engine, archetype differentiation)
- Environmental overlays (colony VFX, dream effects)
- Performance and orchestration (FX runtime, performance control)
- Shader infrastructure (bridges, packs, patches)
- Authority and management (visual authority, templates, auto-wiring)

---

**Last Updated:** 2026-04-13
**Author:** Bystrik Matajzik
**Phase:** EVOLUTION_V2
**Total VFX Systems:** ~110 (including all core systems, engine layers, environmental effects, authority systems, and shader infrastructure)
