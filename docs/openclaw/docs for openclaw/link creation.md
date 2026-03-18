# ATOMA LINK CREATION PIPELINE AUDIT

## CALL CHAIN: LINK CREATION LIFECYCLE

### 1. ENTRY POINTS
```
User Action (click-to-link, auto-link, undo/redo)
  ↓
NodeLinkingSystem.createLink(sourceNode, targetNode)
  ↓
LinkRendererConduit.createLinkVisuals(link)
  ↓
Per-frame updates: LinkRendererConduit.update(link, deltaTime, time)
```

### 2. LINK STRUCTURE COMPONENTS

**Link Object (data layer):**
- `id` - Unique identifier (`link-${counter}`)
- `source` / `target` - Node references
- `sourceNodeId` / `targetNodeId` - Stable IDs
- `traffic` - {load, throughput, priority, bottleneck}
- `animation` - {pulsePhase, glowIntensity, ...}
- `userData.metrics` - {synergy, harmony, corruption, instability, stability}

**Visual Group (THREE.Group):**
Contains all visual components via `userData.conduitState`:

1. **Strands (The Braid)** - 3-5 helical strands
   - TubeGeometry per strand
   - ShaderMaterial: `linkStateVertexShaderSimple` + `linkStateFragmentShaderSimple`
   - Uniforms: uNetworkStress, uLocalLoad, uCorruption, uTime, uSegmentCount, uBaseColor, uWaveDirection, uWaveLength, uWavePhaseOffset
   - Helical path generated from Bézier curve with twist phase

2. **Aura Skin (Ghostly Envelope)**
   - TubeGeometry with LinkAuraShader
   - Uniforms: uHarmony, uCorruption, uSynergy, uDesaturation, uLinkBirthIntensity, uLinkRemovalIntensity
   - Surface-displaced transparent envelope

3. **Beads (Energy Orbs)**
   - LinkBeadVisualizer - spheres traveling along curve
   - Sizes: small/medium/large based on metrics
   - Trigger node impacts on arrival

4. **Sparks (Electric Discharges)**
   - LinkSparkSystem - spark particles along link
   - Synergy/traffic-driven intensity

5. **Pulse Ring (Traveling Energy)**
   - LinkPulseRing - animated ring traveling link
   - Trail meshes for visual trails
   - Linked to ArcDischarges for electric effects

6. **Energy Wave (Unified Wave)**
   - LinkEnergyWave - emissive wave through strands
   - Modulated by synergy/traffic

7. **Directional Streaks (Synergy Flow)**
   - LinkDirectionalStreaks - directional energy pulses
   - Injected from nodes via pulseInjector
   - Phase-synced across harmonic hubs

8. **Arc Discharges (Ring Triggers)**
   - LinkRingArcDischarges - electric arcs from pulse ring
   - Triggered at ring progression points

9. **Trail Particles (Organic Trails)**
   - LinkTrailParticleSystem - shared particle pool (300 max)
   - Sources: corruption, healing, spark
   - LinkTrailEmitter per link
   - Arrival callbacks → ImpactManager

10. **Healing Particles (Reverse Flow)**
    - LinkHealingParticleSystem - reverse flow (target → source)
    - Activated when harmony > corruption
    - LinkHealingEmitter per link
    - Arrival callbacks → ImpactManager

11. **Corruption VFX**
    - LinkCorruptionSpreadAnimator - morphing strands
    - LinkCorruptionParticleSystem - corruption particles
    - LinkCorruptionMorphingSystem - geometric deformation
    - TIER4_CorruptionFeedbackVisuals - high-corruption feedback

12. **Visual State Adapter**
    - LinkVisualStateAdapter - harmony/corruption/instability bridge
    - Applies visual modifications based on metrics

13. **Pictograms**
    - LinkSemanticPictogramSystem_Enhanced - visual icons
    - Global pool attached to conduit root

14. **Dock Systems**
    - SourceInjectionSystem - vortex injection at source
    - DockRingSystem - ring assembly at target
    - DockSpraySystem - particle burst at dock point

## SUBSYSTEM ATTACHMENT POINTS

### 1. **Metric Systems**
- **SemanticMetricAdapter**: `getLinkSynergy(link)`, `getLinkCorruption(link)`
- **_readLinkMetrics()**: Reads from `link.userData.metrics`, `node.userData.metrics`, cache
- **Metric subscription**: Listens to `semanticBus` `'metric.node.updated'` events
- **Cache**: `_nodeMetricCache` Map for node metrics

### 2. **Node Managers**
- **NodeInterferenceManager**: `registerLinkWithNodes()`, `update(links, harmony, corruption, instability)`
- **NodeHarmonicManager**: `registerLinkWithNodes()`, `update(links, harmony, corruption, instability, deltaTime)`
- **registerHarmonicHub()**: Called when node becomes harmonic hub
- **Pulse injection**: `emitNodePulse(sourceNode, connectedLinks, time)` → `directionalStreaks.pulseInjector.injectNodePulse()`

### 3. **Event Systems**
- **LinkStateVisualLanguageIntegration**: Visual language for link states
- **TIER4_CorruptionFeedbackVisuals**: Display corruption seed/cascade/harmony pulses
- **Corruption triggers** (10 Hz): Threshold-based visual feedback

### 4. **Wave Systems**
- **WaveTravelShaderPack_v1**: Traveling wave shader pack
- **WaveShaderBridge**: `registerLinkDirection(linkId, direction)`, `registerLinkMaterial()`
- **_attachWaveDirectionUniform()**: Attaches wave uniforms to strand/skin materials
- **Uniforms**: uWaveDirection, uWaveLength, uWavePhaseOffset

### 5. **Visual Authority**
- **TransparentStateAuthority**: Apply visual transparency states
- **VisualHierarchyRegistry**: `getRenderOrder('LINK_SKIN', 'LINK_CORE', 'LINK_STRANDS', 'LINK_IMPACTS')`
- **freezeMaterialFlags()**: Locks transparent, depthWrite, depthTest, side, alphaTest
- **LinkRenderLayerPolicy**: `applyLinkRenderLayer(mesh, layer)`

### 6. **Impact Systems**
- **ImpactManagerCollection**: `triggerImpact(nodeId, type, time, intensity, duration, incomingDir)`
- **triggerNodeImpact()**: Creates visual geometry based on node category
- **Particle arrival callbacks**: TrailParticles/HealingParticles → ImpactManager

### 7. **Update Loop Integration**
- **FrameScheduler-driven** (optional): `conduitManagedByFrameScheduler` flag
- **updateAll()**: Global update with LOD (heavy link selection)
- **Cadence buckets**: 30 Hz (heavy tick), 10 Hz (geometry tick)
- **updateCascadePropagation()**: Updates cascade network after all links

## BOOTSTRAP PHASES (Per Link)

Links initialize through 9 bootstrap phases (one per frame):

1. **Phase 1**: Strand geometry + shader (3-5 strands)
2. **Phase 2**: PulseRing + ring trails
3. **Phase 3**: EnergyWave + pulseDustEmitter
4. **Phase 4**: DirectionalStreaks initialization
5. **Phase 5**: ArcDischarges
6. **Phase 6**: Beads + EnergyRingSystem
7. **Phase 7**: Bead trails
8. **Phase 8**: Sparks
9. **Phase 9**: Corruption/healing emitters + visual state adapter

## METRIC FLOW

```
Link.userData.metrics (canonical)
  ↓
_readLinkMetrics(link) → aggregates from:
  - link.userData.metrics
  - link.userData.harmony/corruption/stability/synergy
  - node.userData.metrics (source + target)
  - conduitState.metrics (cached)
  - _nodeMetricCache (subscription-based)
  ↓
computeLinkVfxInput(frameState) → normalized VFX inputs:
  - baseIntensity (0.25-1.0)
  - beadsIntensity (0.20-1.0)
  - sparksIntensity (0.30-1.0)
  - widthMul (0.9-1.3)
  - speedMul (0.8-1.4)
  - colorBias (0-1.0)
  ↓
Subsystems receive VFX inputs and animate accordingly
```

## DISPOSAL PATH

```
NodeLinkingSystem.removeLink(link)
  ↓
LinkRendererConduit.disposeLinkVisuals(linkGroup, link)
  ↓
Spawn dissolve effect (if enabled)
Unregister from: NodeInterferenceManager, NodeHarmonicManager
Dispose: corruptionAnimator, trailEmitters, healingEmitters
Dispose: strands, skinMesh, beads, sparks, trails, rings
Dispose: pulseRing, pulseDust, energyWave, arcDischarges
Dispose: visualStateAdapter, dock systems, impacts
Remove from scene graph
Dispose geometries and materials
```

## KEY FILES

- `NodeLinkingSystem.js` - Main createLink/removeLink
- `LinkRendererConduit.js` - Visual creation and update loop
- `LinkAuraShader.js` - Aura skin shader
- `LinkBeadSystem.js` - Bead visualizer
- `LinkSparkSystem.js` - Spark system
- `LinkPulseRing.js` - Traveling pulse ring
- `LinkDirectionalStreaks.js` - Synergy flow
- `LinkTrailParticleSystem.js` - Trail particles (corruption/healing/spark)
- `LinkHealingParticleSystem.js` - Healing particles
- `LinkCorruptionSpreadAnimator.js` - Corruption animation
- `LinkVisualStateAdapter.js` - Metric-to-visual bridge
- `NodeInterferenceManager.js` - Node interference
- `NodeHarmonicManager.js` - Harmonic sync