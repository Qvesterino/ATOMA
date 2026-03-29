# RESONANCE SYSTEM AUDIT REPORT

Generated: 2026-03-29
Auditor: Cline

## SUMMARY

This audit identifies and analyzes all resonance-related systems in the ATOMA codebase. Resonance systems are categorized into:
- **Geometry/Mesh Emitters**: Systems that add visible geometry to the scene
- **Data/Shader Modifiers**: Systems that only modify state, uniforms, or animations

---

## COMPLETE RESONANCE SYSTEMS INVENTORY

### 1. LinkResonanceFlowSystem_Session124.js

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
- Capped by `maxPulsesPerLink` (default: 8) and `maxTotalPulses` (default: 1024)

**Submetrics Read**:
- `link.userData.metrics.loadPressure`
- `link.userData.metrics.corruption`
- `link.userData.metrics.synergy`
- `link.userData.metrics.stability`
- Link length
- Node positions (source/target)

---

### 2. ResonanceEchoTrailSystem.js

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
- Subscribes: `semanticBus.on('wave.burst.lifecycle')`, `wave.packet.spawn`
- Uses: `VisualTime` for canonical time source
- Tracks: Composite glyph position history
- Updates: Echo opacity, lifetime
- Console API: `window.game.echoStatus()`, `window.game.enableEchoTrails()`, `window.game.disableEchoTrails()`, `window.game.toggleEchoDebug()`

**Emission Conditions**:
- Composite glyph moving (position change > 0.01)
- Composite glyph dissolving/separating
- Active resonance fields
- Spawn chance based on harmony, synergy, stability metrics
- Spawns at intervals (0.2s between echoes, configurable via `ECHO_SPAWN_INTERVAL`)
- Capped at `MAX_ECHOES_PER_ZONE` (default: 8 per active composite)

**Submetrics Read**:
- `composite.state.harmony`
- `composite.state.synergy`
- `composite.state.corruption`
- `composite.state.stability`
- `event.intensity` (from wave burst events)
- Event center position

---

### 3. HarmonicResonanceCoupling_v1.js

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

### 4. CascadeResonanceWaveVisualization_Session146.js

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

### 5. CompositeGlyphResonanceFeedback.js

**Type**: ⚠️ DATA/ANIMATION MODIFIER (No Geometry)

**Scene Additions**: None (modulates existing glyph animations)

**What it Does**:
- Visual-only feedback adapter that makes composite glyph resonance perceptible
- Subtle spatial and temporal cues without introducing new motion
- Resonance boundary softening (motion feels smoother at edge of influence)
- Optional glyph animation phase alignment

**Wiring**:
- Registers: Composite glyphs via `registerCompositeGlyph()`
- Updates: `ResonanceInfluenceZone` instances
- Applies: Spatial compression and phase influence to nearby elements
- No visual additions - only modulation of existing behavior

**Emission Conditions**:
- Composite glyph registered and active
- Glyph is fused or in decay phase
- Nearby animated elements present

**Submetrics Read**:
- Composite glyph state (fused/decaying)
- Glyph position and mesh
- Nearby element positions
- Phase information from glyphs

---

### 6. CascadingHarmonicResonanceAmplification.js

**Type**: ⚠️ DATA PROCESSOR (No Visual Output)

**Scene Additions**: None (computes cascade data only)

**What it Does**:
- Amplifies harmonic state across network topology layers
- Computes resonance energy per hub: `harmony × (0.5 + synergy × 0.2 × resilience)`
- Propagates resonance outward from strong hubs
- Assigns cascade layer data to nodes

**Wiring**:
- Reads: Node metrics (harmony, synergy, resilience)
- Updates: `node.userData._cascadeStrength`, `node.userData._cascadeAmplitude`, `node.userData._cascadePhase`
- Marked as cascade owner via `node.userData._cascadeOwner = 'CascadingHarmonicResonanceAmplification'`
- Console API: `window.CascadeAPI`

**Emission Conditions**:
- Hub resonance energy > 0.4
- System enabled
- Network topology available

**Submetrics Read**:
- `node.userData.metrics.harmony`
- `node.userData.metrics.synergy`
- `node.userData.metrics.resilience`
- Network topology (edges, layers)

---

### 7. HarmonicResonanceFeedbackSystem.js

**Type**: ⚠️ DATA/INFLUENCE MODIFIER (No Geometry)

**Scene Additions**: None (debug spheres only when enabled)

**What it Does**:
- Converts synergy data into network-level feedback
- Computes local resonance for each node & link
- Aggregates resonance into global "network mood"
- Feeds back into per-node personality signals
- Optional debug visualization of resonance fields

**Wiring**:
- Reads: `node.userData.personalityVisual`, `node.userData.synergy`, `node.userData.dynamicMetrics`
- Reads: `link.userData.synergy`
- Writes: `node.userData.resonanceFeedback`, `link.userData.resonanceFeedback`
- Updates: Global `networkMood` state
- Console API: `window.game.resonanceStatus()`, `window.game.enableResonance()`, `window.game.disableResonance()`, `window.game.toggleResonanceDebug()`

**Emission Conditions**:
- System enabled
- Fusion zone manager active
- Composite glyphs active (for resonance field activation)

**Submetrics Read**:
- `node.userData.personalityVisual.resonanceBoost`
- `node.userData.synergy.score`
- `node.userData.synergy.synergyNorm`
- `node.userData.dynamicMetrics.clarity`
- `link.userData.synergy.score`
- `link.userData.synergy.synergyNorm`

---

### 8. SynergyResonanceShaderPack_v1.js

**Type**: ⚠️ SHADER MODIFIER (No Geometry)

**Scene Additions**: None (shader code patcher)

**What it Does**:
- GPU-accelerated shader FX pack providing enhanced synergy visuals
- Multi-frequency pulse resonance (0.5–3.5 Hz layered waves)
- Chromatic ripple distortion (RGB channel separation)
- Patches material.onBeforeCompile to inject resonance effects

**Wiring**:
- Reads: Link visual profiles (synergyTier, chromaShift, resonanceRipples, pulseStrength)
- Patches: Material shader code
- Updates: Uniforms (`uSynergyTier`, `uResonanceLevel`, `uCoherenceLevel`)
- No scene additions - pure shader modification

**Emission Conditions**:
- Material registered via `patchMaterial()`
- Link visual profile available
- System enabled

**Submetrics Read**:
- `visualProfile.synergyTier`
- `visualProfile.chromaShift`
- `visualProfile.resonanceRipples`
- `visualProfile.pulseStrength`
- Canonical link metrics (harmony, synergy, corruption)

---

### 9. ResonanceFeedback_v1.js

**Type**: ⚠️ DATA CALCULATOR (No Visual Output)

**Scene Additions**: None (computes resonance metrics only)

**What it Does**:
- Calculates local resonance for each node
- Computes node state (localResonance, harmonyShift, reactivePulse)
- Computes link state (harmony, entropy, coherence, pulseStrength)
- EMA-smooths values for stability
- Aggregates into global network mood

**Wiring**:
- Reads: `node.userData.personalityVisual`, `node.userData.synergy`, `node.userData.dynamicMetrics`
- Reads: `link.userData.synergy`, `link.userData.resonanceFeedback`
- Writes: `node.userData.resonanceFeedback`, `link.userData.resonanceFeedback`
- Updates: `networkMood` (harmony, entropy, load, mood)

**Emission Conditions**:
- Node registered via `registerNode()`
- Link registered via `registerLink()`
- System update called

**Submetrics Read**:
- `node.userData.personalityVisual.resonanceBoost`
- `node.userData.personalityVisual.clarity`
- `node.userData.synergy.score`
- `node.userData.synergy.synergyNorm`
- `node.userData.dynamicMetrics.ascensionLevel`
- `link.userData.synergy.score`
- `link.userData.synergy.synergyNorm`

---

## CATEGORIZED SUMMARY

### 🎨 Geometry/Mesh Emitters (4 systems)

| System | Geometry Type | Pool Size | LOD Support | Transient |
|--------|---------------|-----------|-------------|-----------|
| **LinkResonanceFlowSystem_Session124** | Pulse rigs (sphere + sheath + trail + overload) | Object pool (maxTotalPulses: 1024) | Yes | No |
| **ResonanceEchoTrailSystem** | Echo silhouettes (circles, 8 segments) | Pool (30) | No | Yes (fade out) |
| **HarmonicResonanceCoupling_v1** | Transient particles | Dynamic | No | Yes |
| **CascadeResonanceWaveVisualization_Session146** | Wave propagation, coupling lines | No pool | No | No |

### ⚠️ Data/Shader Modifiers Only (5 systems)

| System | Type | Output |
|--------|------|--------|
| **CompositeGlyphResonanceFeedback** | Animation modulation | Phase alignment, spatial compression |
| **CascadingHarmonicResonanceAmplification** | Data processor | Cascade layer data (strength, amplitude, phase) |
| **HarmonicResonanceFeedbackSystem** | Influence modifier | Resonance field influence on nearby elements |
| **SynergyResonanceShaderPack_v1** | Shader patcher | Material shader modification (uniforms) |
| **ResonanceFeedback_v1** | Data calculator | Node/link resonance metrics, network mood |

---

## GEOMETRY DETAIL TABLE

### Real Scene Geometry Additions

| System | Geometry Added | Visual Impact | Performance Notes |
|--------|---------------|----------------|-------------------|
| **LinkResonanceFlowSystem** | Sphere, Octahedron, Cylinder per pulse (4 parts) | High - visible energy flow | Object pooled, LOD suppressed at distance |
| **ResonanceEchoTrail** | CircleGeometry (8 segments) per echo | Low - subtle silhouettes | Pooled (30 max), spawn interval 0.2s |
| **HarmonicResonanceCoupling** | Transient particles (no persistent geometry) | Medium - particle flows | Transient, no persistent memory |
| **CascadeResonanceWave** | Wave rings, coupling lines | Medium - ghost-level cues | No pool, low frequency |

### Non-Visual Systems

| System | Output | Notes |
|--------|--------|-------|
| **CompositeGlyphResonanceFeedback** | Animation parameters | Modulates existing glyph behavior |
| **CascadingHarmonicResonanceAmplification** | Data (cascadeStrength, cascadeAmplitude, cascadePhase) | Consumed by other visual systems |
| **HarmonicResonanceFeedbackSystem** | Influence on nearby elements | Rotation bias, phase alignment |
| **SynergyResonanceShaderPack_v1** | Shader uniform injection | Patches existing materials |
| **ResonanceFeedback_v1** | Metrics calculation | Feeds into network mood |

---

## SUBMETRICS CONSOLIDATION

### Canonical Metrics Read Across All Resonance Systems

| Metric | Systems Using It | Purpose |
|--------|-------------------|---------|
| **harmony** | LinkResonanceFlow, ResonanceEchoTrail, HarmonicResonanceCoupling, CascadeResonanceWave, CompositeGlyphResonanceFeedback, ResonanceFeedback | Pulse spawn rate, echo lifetime, resonance qualification, wave visualization, phase alignment, local resonance calculation |
| **synergy** | LinkResonanceFlow, ResonanceEchoTrail, HarmonicResonanceCoupling, CascadeResonanceWave, ResonanceFeedback | Pulse speed, echo spawn chance, resonance qualification, proximity strength, link-based resonance |
| **corruption** | LinkResonanceFlow, ResonanceEchoTrail, HarmonicResonanceCoupling, ResonanceFeedback | Color shift, opacity dampening, lifetime reduction, resonance calculation |
| **loadPressure** | LinkResonanceFlow | Pulse spawn rate, speed, intensity, overload state |
| **stability** | LinkResonanceFlow, ResonanceEchoTrail, ResonanceFeedback | Pulse lifetime, echo spawn reduction, stability gating |
| **resilience** | CascadingHarmonicResonanceAmplification | Resonance energy calculation |
| **clarity** | ResonanceFeedback | Resonance boost calculation |
| **ascensionLevel** | ResonanceFeedback | Ascension multiplier for resonance |
| **harmonicPhase** | CascadeResonanceWave | Phase synchronization data |

---

## WIRING DIAGRAM SUMMARY

```
SemanticBus Events (wave.burst.lifecycle, wave.packet.spawn)
    ↓
ResonanceEchoTrailSystem (echo trail spawning)

Link Metrics (harmony, synergy, corruption, loadPressure, stability)
    ↓
LinkResonanceFlowSystem (pulse spawning)
    ↓
Pulse Mesh Pool (sphere, sheath, trail, overload)

Node Metrics (harmony, synergy, linkedNodes)
    ↓
HarmonicResonanceCoupling (resonance particles)

Hub Metrics (harmony, synergy, harmonicPhase)
    ↓
CascadeResonanceWaveVisualization (wave propagation)

CascadingHarmonicResonanceAmplification
    └── Outputs: cascadeStrength, cascadeAmplitude, cascadePhase
    └── Read by: CascadeResonanceWave, visual systems

Composite Glyph State (harmony, synergy, corruption, stability)
    ↓
CompositeGlyphResonanceFeedback (phase alignment, spatial compression)

Node/Link Metrics (personalityVisual, synergy, dynamicMetrics)
    ↓
ResonanceFeedback_v1 (local resonance calculation)
    ↓
Network Mood (harmony, entropy, load, mood)

Link Visual Profiles
    ↓
SynergyResonanceShaderPack_v1 (shader patching)
    ↓
Material Uniforms (uSynergyTier, uResonanceLevel, uCoherenceLevel)
```

---

## RECOMMENDATIONS

1. **LinkResonanceFlowSystem_Session124** is the most visually impactful resonance effect - object pooling is already implemented for performance
2. **ResonanceEchoTrailSystem** uses efficient pooling (30 max) and spawn throttling (0.2s interval) - good performance profile
3. **HarmonicResonanceCoupling_v1** uses transient particles without persistent geometry - minimal memory footprint
4. **CascadeResonanceWaveVisualization_Session146** has no object pool - consider adding if wave frequency increases
5. Multiple systems read the same canonical metrics - consider a unified metrics read cache for performance
6. **CompositeGlyphResonanceFeedback** and **HarmonicResonanceFeedbackSystem** both apply influence to nearby elements - could be unified
7. **CascadingHarmonicResonanceAmplification** is a data-only system that feeds into visual systems - good separation of concerns
8. **SynergyResonanceShaderPack_v1** patches shaders - ensure materials are not double-patched

---

## PERFORMANCE NOTES

### Geometry Emitter Systems
- **LinkResonanceFlowSystem**: Object pooled, LOD supported at distance > 60, max 1024 total pulses
- **ResonanceEchoTrailSystem**: Object pooled (30 max), spawn interval 0.2s, lifetime 0.8-2.8s
- **HarmonicResonanceCoupling_v1**: Transient particles, no persistent geometry
- **CascadeResonanceWaveVisualization**: No pooling, low frequency emission

### Data Processing Systems
- All data processing systems are CPU-only with minimal allocation
- EMA smoothing used for stability (ResonanceFeedback_v1, LinkResonanceFlowSystem)
- Time-sliced updates (CompositeGlyphResonanceFeedback: 0.2s interval)

---

## END OF REPORT