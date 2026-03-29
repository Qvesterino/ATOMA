# WAVES SYSTEM AUDIT REPORT

Generated: 2026-03-29
Auditor: Cline

## SUMMARY

This audit identifies and analyzes all wave-related systems in the ATOMA codebase. Wave systems are categorized into:
- **Geometry/Mesh Emitters**: Systems that add visible geometry to the scene
- **Uniform/Color Modifiers**: Systems that only modify shader uniforms or colors

Contract note:
- The live shared wave snapshot has been reduced to the compact shape:
  - `waveField.amplitude`
  - `waveField.phase`
  - `waveField.standing`
  - `waveField.sourceCount`
- Older alias-heavy names in this report are historical inventory only unless a later section explicitly labels them as deprecated.

---

## COMPLETE WAVES SYSTEMS INVENTORY

### 1. WaveShaderBridge_v1.js

**Type**: ⚠️ UNIFORM/COLOR MODIFIER ONLY

**Scene Additions**: None (no geometry, no meshes)

**What it Does**:
- GPU shader uniform bridge for wave interference visualization
- Patches material.onBeforeCompile to inject wave uniforms
- Provides 8 wave-aware uniforms for shaders

**Wiring**:
- Reads: `WaveInterferenceEngine_v1.getActiveSnapshot()`
- Injects: `uWaveAmplitude`, `uWaveConstructive`, `uWaveDestructive`, `uWaveInterference`, `uWaveStanding`, `uWavePhase`, `uWaveSourceCount`, `uWaveIntensity` into registered materials
- Updates via: `update(deltaTime, {nodes, links})`

**Emission Conditions**:
- Active when materials are registered via `registerNodeMaterial()` or `registerLinkMaterial()`
- Uniforms updated at 30Hz (visual update interval)
- EMA smoothing applied (alpha ~0.18 for ~0.4-0.5s response)

**Submetrics Read**:
- `waveField.amplitude`
- `waveField.phase`
- `waveField.standing`
- `waveField.sourceCount` (normalized by maxSources)

---

### 2. WaveDynamicsShaderPack_v1.js

**Type**: ⚠️ UNIFORM/COLOR MODIFIER ONLY

**Scene Additions**: None (shader code library, no runtime geometry)

**What it Does**:
- Shader code library for wave dynamics effects
- Provides travel, breathing, ripple, and diffusion wave patterns
- Static shader functions, not a runtime system

**Wiring**:
- Used as a shader code reference (not wired at runtime)
- Shader functions consumed by other systems' shader code

**Emission Conditions**: N/A (static library)

**Submetrics Read**: N/A (static shader functions)

---

### 3. StandingWaveVisualRenderer_Session131.js

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

### 4. StandingWaveOscillationTrapSystem_Session130.js

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

### 5. CascadeResonanceWaveVisualization_Session146.js

**Type**: 🎨 GEOMETRY/MESH EMITTER

**Scene Additions**:
- `CascadeWaveGroup` containing:
  - Wave propagation visualization (ring/radial geometry)
  - Resonance coupling lines between hubs
  - Subtle energy flow indicators
  - Ghost-level wave suggestion geometry

**What it Does**:
- Visualizes resonance waves between harmonic hubs
- Shows energy pathways and interference patterns
- Provides subtle visual cues without gameplay impact

**Wiring**:
- Reads: Harmonic hub positions, phase synchronization data
- Managed by: `HarmonicCascadeAmplification_Session145`
- Updates via: `update(deltaTime)`
- Console API: `window.CASCADE_WAVE_STATS`

**Emission Conditions**:
- Proximal harmonic hubs detected (by HubProximityDetector)
- Cascade system enabled (`this.config.enabled`)
- Phase synchronization active
- Harmony threshold met

**Submetrics Read**:
- `hub.harmonicPhase`
- `pair.proximityStrength`
- `hub.userData.metrics.harmony`
- `hub.userData.metrics.synergy`
- Hub positions
- Distance between hubs

---

### 6. CascadeToWaveBridge_v1.js

**Type**: ⚠️ EVENT BRIDGE (No Visual Output)

**Scene Additions**: None (event forwarding only)

**What it Does**:
- Event-driven bridge from cascade propagation to wave burst intent
- Listens to `cascade.hop` events and forwards burst intents to wave engine
- No renderer, no scheduler, no visual logic

**Wiring**:
- Subscribes: `semanticBus.on('cascade.hop')`
- Calls: `waveInterferenceEngine.requestBurstIntent()`
- Fallback: Writes to `link.userData.waveField` when wave engine unavailable

**Emission Conditions**:
- Cascade hop event fired (`cascade.hop`)
- Cascade intensity > 0
- Wave engine available (or fallback to direct write)

**Submetrics Read**:
- `event.intensity`
- `event.linkId`
- `event.fromId`, `event.toId`
- `link.source`, `link.target` positions
- Link metrics (harmony, synergy, corruption)

---

### 7. HarmonicPhaseSynchronization_Session146.js

**Type**: ⚠️ DATA PROCESSOR (No Visual Output)

**Scene Additions**: None (computes phases only)

**What it Does**:
- Implements temporal alignment between proximal harmonic hubs
- Gradually aligns harmonic phases toward shared midpoint
- Elastic convergence (smooth, never hard-locked)
- Reversible when hubs separate

**Wiring**:
- Reads: Proximity pairs from `HarmonicCascadeAmplification_Session145`
- Updates: `hub.harmonicPhase` for visual systems
- Called by: `HarmonicCascadeAmplification_Session145.update()`
- Console API: `window.PHASE_SYNC_STATS`

**Emission Conditions**:
- Proximal hubs detected (proximityStrength > 0)
- System enabled (`this.config.enabled`)
- Multiple hubs in proximity

**Submetrics Read**:
- `pair.proximityStrength`
- `hub.harmonicPhase` (reads and writes)
- `pair.hubAId`, `pair.hubBId`
- Phase delta between hub pairs

---

### 8. HarmonicCascadeAmplification_Session145.js

**Type**: ⚠️ COORDINATOR (No Direct Visual Output)

**Scene Additions**: None (orchestrates subsystems)

**What it Does**:
- Detects nearby harmonic hubs and amplifies their resonance effects
- Current status: Proximity detection active, cascades disabled
- Coordinates: Phase synchronization, pre-cascade hints, cascade waves
- Provides debugging API for proximity inspection

**Wiring**:
- Uses: `HubProximityDetector` for proximity detection
- Initializes: `HarmonicPhaseSynchronization_Session146`
- Initializes: `PreCascadeVisualHint_Session146`
- Initializes: `CascadeResonanceWaveVisualization_Session146`
- Console API: `window.CASCADE_STATS`, `window.CASCADE_CONFIG`

**Emission Conditions**:
- Proximity detection always active
- Phase sync enabled when `config.enabled = true`
- Cascade effects disabled (safe skeleton mode)

**Submetrics Read**:
- `hub.userData.metrics.harmony`
- `pair.proximityStrength`
- `pair.combinedHarmony`
- Hub positions
- Distance between hubs

---

### 9. HarmonicResonanceCoupling_v1.js

**Type**: 🎨 GEOMETRY/MESH EMITTER (Particles)

**Scene Additions**:
- Resonance particles (energy packets flowing between nodes)
- Particle trail geometry (Line/Cylinder based)
- No persistent meshes - particles are transient

**What it Does**:
- Creates pulsing directional energy flows along links
- Visual resonance particles flow between nodes
- Node auras shimmer in sync (phase coupling)
- Link becomes visual conduit for harmonic energy

**Wiring**:
- Reads: `getLinkSynergy(link)` from SemanticMetricAdapter
- Reads: Node harmony, synergy, linked node count
- Updates: Particle positions, intensities
- Spawns: Resonance particles on qualified links
- Console API: `window.HarmonicResonanceCoupling_v1`

**Emission Conditions**:
- Per-node harmony > 0.50
- Per-node synergy > 0.50
- Linked nodes >= 2
- Active link with both nodes qualifying

**Submetrics Read**:
- `link.synergy` (via `getLinkSynergy()`)
- `node.userData.metrics.harmony`
- `node.userData.metrics.synergy`
- Linked node count
- Node positions

---

### 10. LinkResonanceFlowSystem_Session124.js

**Type**: 🎨 GEOMETRY/MESH EMITTER (Pulse Meshes)

**Scene Additions**:
- `LinkResonancePulses_Session124` group containing:
  - Pulse mesh rigs (Sphere + Octahedron + Cylinder combinations)
  - Pulse sheath geometry
  - Pulse trail geometry
  - Overload indicators (rotating geometry)
- Object pool for efficient mesh reuse

**What it Does**:
- Creates pulsing directional energy flows along links
- Pulses travel from source to destination node
- Pulse speed modulated by loadPressure and activity
- Multi-pulse support (multiple energy packets per link)
- Bidirectional flow capability

**Wiring**:
- Reads: Link metrics from `link.userData.metrics`
- Uses: `VisualTime` for canonical time source
- Registers with: `VisualHierarchyRegistry`
- Updates: Pulse positions, sizes, colors, opacities
- LOD suppression based on camera distance
- Console API: Available via system stats

**Emission Conditions**:
- Link loadPressure > 0.08
- Spawn rate scales with loadPressure
- Overload boost when loadPressure > 0.65
- Capped by `maxPulsesPerLink` and `maxTotalPulses`

**Submetrics Read**:
- `link.userData.metrics.loadPressure`
- `link.userData.metrics.corruption`
- `link.userData.metrics.synergy`
- `link.userData.metrics.stability`
- Link length
- Node positions (source/target)

---

### 11. ResonanceEchoTrailSystem.js

**Type**: 🎨 GEOMETRY/MESH EMITTER (Echo Silhouettes)

**Scene Additions**:
- `ResonanceEchoTrailRoot` group containing:
  - Echo pool of circular geometry (CircleGeometry)
  - Up to 30 echo instances (silhouette imprints)
  - Debug visualization (optional)
- Object pool for efficient echo reuse

**What it Does**:
- Creates harmonic afterimages following composite glyph movement
- Echoes are stationary memory imprints that fade quietly
- Temporal persistence of meaning, not motion blur
- Spawns when composite glyphs move or dissolve

**Wiring**:
- Subscribes: `semanticBus.on('wave.burst.lifecycle')`, `wave.packet.spawn`
- Uses: `VisualTime` for canonical time source
- Tracks: Composite glyph position history
- Updates: Echo opacity, lifetime
- Console API: `window.game.echoStatus()`

**Emission Conditions**:
- Composite glyph moving (position change > 0.01)
- Composite glyph dissolving/separating
- Active resonance fields
- Spawn chance based on harmony, synergy, stability metrics
- Spawns at intervals (0.2s between echoes)

**Submetrics Read**:
- `composite.state.harmony`
- `composite.state.synergy`
- `composite.state.corruption`
- `composite.state.stability`
- `event.intensity` (from wave burst events)
- Event center position

---

## CATEGORIZED SUMMARY

### 🎨 Geometry/Mesh Emitters (5 systems)

| System | Geometry Type | Pool Size | LOD Support |
|--------|---------------|-----------|-------------|
| **StandingWaveVisualRenderer_Session131** | Rings, concentric geometry | No pool | No |
| **StandingWaveOscillationTrapSystem_Session130** | Energy fields, oscillation indicators | No pool | No |
| **CascadeResonanceWaveVisualization_Session146** | Wave propagation, coupling lines | No pool | No |
| **HarmonicResonanceCoupling_v1** | Transient particles | Dynamic | No |
| **LinkResonanceFlowSystem_Session124** | Pulse rigs (sphere + sheath + trail) | Object pool | Yes |
| **ResonanceEchoTrailSystem** | Echo silhouettes (circles) | Pool (30) | No |

### ⚠️ Uniform/Color Modifiers Only (2 systems)

| System | Uniforms Injected | Update Rate |
|--------|-------------------|-------------|
| **WaveShaderBridge_v1** | 8 wave uniforms (amplitude, constructive, destructive, interference, standing, phase, sourceCount, intensity) | 30Hz |
| **WaveDynamicsShaderPack_v1** | Shader code library (static) | N/A |

### 🔗 Event/Data Bridges (4 systems)

| System | Role | Visual Output |
|--------|------|---------------|
| **CascadeToWaveBridge_v1** | Event forwarding (cascade → wave) | None |
| **HarmonicPhaseSynchronization_Session146** | Phase computation | None |
| **HarmonicCascadeAmplification_Session145** | Coordinator (proximity, phase sync, visual hints) | None |
| **ResonanceEchoTrailSystem** | Echo management (also emits geometry) | Yes |

---

## WIRING DIAGRAM SUMMARY

```
SemanticBus Events
    ↓
CascadeToWaveBridge_v1 (cascade.hop → wave burst intent)
    ↓
WaveInterferenceEngine (wave burst processing)
    ↓
WaveShaderBridge_v1 (uniform injection)
    ↓
Node/Link Materials (visual rendering)

HarmonicCascadeAmplification_Session145
    ├── HubProximityDetector (proximity detection)
    ├── HarmonicPhaseSynchronization_Session146 (phase sync)
    ├── PreCascadeVisualHint_Session146 (visual hints)
    └── CascadeResonanceWaveVisualization_Session146 (wave viz)

LinkResonanceFlowSystem_Session124
    └── Reads: link.userData.metrics (loadPressure, corruption, synergy, stability)

HarmonicResonanceCoupling_v1
    └── Reads: link.synergy, node harmony/synergy

ResonanceEchoTrailSystem
    └── Subscribes: wave.burst.lifecycle, wave.packet.spawn
```

---

## SUBMETRICS CONSOLIDATION

### Canonical Metrics Read Across All Wave Systems

| Metric | Systems Using It | Purpose |
|--------|-------------------|---------|
| **harmony** | WaveShaderBridge, CascadeResonanceWaveViz, HarmonicResonanceCoupling, HarmonicCascadeAmp, ResonanceEchoTrail | Phase extension, visual intensity, emission chance |
| **synergy** | HarmonicResonanceCoupling, HarmonicCascadeAmp, LinkResonanceFlow, ResonanceEchoTrail | Resonance qualification, pulse speed, spawn rate |
| **corruption** | CascadeToWaveBridge, LinkResonanceFlow, ResonanceEchoTrail | Dampening, color shift, lifetime reduction |
| **loadPressure** | LinkResonanceFlow, CascadeToWaveBridge | Pulse spawn rate, speed, intensity |
| **stability** | LinkResonanceFlow, ResonanceEchoTrail | Emission chance, lifetime modulation |
| **phase** | WaveShaderBridge, HarmonicPhaseSync, StandingWaveOscillationTrap | Wave animation, synchronization |
| **amplitude** | WaveShaderBridge, CascadeToWaveBridge, StandingWaveOscillationTrap | Wave intensity, visual scale |
| **standing** | WaveShaderBridge, StandingWaveOscillationTrap | Standing wave detection |
| **sourceCount** | WaveShaderBridge | Wave source normalization |

Deprecated aliases previously seen in this audit:

- `totalAmplitude`
- `constructivePower`
- `destructivePower`
- `interferenceIndex`
- `standingWaveFactor`
- `travelPhase`
- `constructive`
- `destructive`
- `destructiveInterference`
- `harmonicLevel`

---

## RECOMMENDATIONS

1. **WaveShaderBridge_v1** is the central authority for wave uniform injection - all wave metrics flow through it
2. **LinkResonanceFlowSystem_Session124** is the most visually impactful wave effect - consider optimizing its mesh pool
3. **HarmonicCascadeAmplification_Session145** is in safe skeleton mode - cascade amplification logic is disabled
4. Multiple systems read the same canonical metrics - consider a unified metrics read cache for performance
5. **ResonanceEchoTrailSystem** and **HarmonicResonanceCoupling_v1** both use particle pools - could be unified

---

## END OF REPORT
