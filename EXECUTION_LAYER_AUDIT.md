# EXECUTION LAYER AUDIT - READ ONLY
## Generated: 2025-02-26
## Scope: All systems with .update() calls

---

## FRAME SCHEDULER LAYERS

### LAYER: realtime (60 Hz)
**Purpose:** Critical systems - camera, input, core rendering
**Target Frequency:** 60 Hz
**Interval:** 1/60 seconds

| System ID | Update Call | Purpose |
|-----------|-------------|---------|
| `registry-warmup` | `EnhancedNodeModels.ensureRegistryReady?.()` | Registry preparation |
| `realtime.coreMetricsOverlay` | `runCoreMetricsOverlayTick(dt)` | Core metrics HUD update |
| `realtime.cameraController` | `runCameraControllerTick()` | Camera control update |
| `realtime.playerController` | `runPlayerControllerTick(dt)` | Player control update |
| `visualNetworkTimeElasticity.realtime` | `visualNetworkTimeElasticity.update(dt, time)` | Visual time elasticity |
| `synergyPulseVisuals.realtime` | `synergyPulseVisuals.update(dt, time)` | Synergy pulse visualization |
| `semantic.visual30Hz` | `runVisualSemanticTick(dt)` | Semantic visual update |
| `harmonicResonanceCoupling.realtime` | `harmonicResonanceCoupling.update(dt, avgSynergy)` | Harmonic resonance update |
| `harmonicHubAuraSystem.realtime` | `harmonicHubAuraSystem.update(dt, aiNodes.nodes)` | Harmonic hub aura update |
| `harmonicInfluencePropagation.realtime` | `harmonicInfluencePropagation.update(dt)` | Harmonic influence propagation |
| `harmonicCascadeAmplification.realtime` | `harmonicCascadeAmplification.update(dt)` | Harmonic cascade amplification |
| `cascadeVisualizer.realtime` | `cascadeVisualizer.update(dt)` | Cascade visualization |

---

### LAYER: visual (30 Hz)
**Purpose:** Visual effects, shaders, auras, link rendering
**Target Frequency:** 30 Hz
**Interval:** 1/30 seconds

| System ID | Update Call | Purpose |
|-----------|-------------|---------|
| `renderer.render` | `renderer.render()` | Core WebGL rendering |
| `visual.nodeAuraSystem` | `runNodeAuraSystemTick(dt)` | Node aura shader updates |
| `visual.synergyChainReaction` | `synergyChainReaction.update(dt, aiNodes.nodes)` | Synergy chain reaction |
| `node.linking.update` | `linkingSystem.update(dt, time)` | Link rendering and effects |
| `node.targeting` | `linkingSystem.processNodeTargeting()` | Node targeting logic |

---

### LAYER: simulation (10 Hz)
**Purpose:** AI, glyphs, metrics, slow simulation
**Target Frequency:** 10 Hz
**Interval:** 1/10 seconds

| System ID | Update Call | Purpose |
|-----------|-------------|---------|
| `activeWorld.update` | `activeWorld.update(dt, time)` | World simulation |
| `visualSuperpack.update` | `visualSuperpack?.update?.(dt)` | Visual superpack effects |
| `hazards.update` | `hazards.update(dt)` | Environmental hazards |
| `aiNodes.update` | `aiNodes.update(dt, time)` | AI node simulation |
| `metricsVisualFX.update` | `metricsVisualFX.update(dt, aiNodes.nodes)` | Metrics visualization effects |
| `linkPersonalityStateMachine.update` | `linkPersonalityStateMachine.update(dt, links)` | Link personality state machine |
| `synergyBonusVisualization.update` | `synergyBonusVisualization.update(dt, links)` | Synergy bonus visualization |
| `synergyBonusFXLayer.update` | `synergyBonusFXLayer.update(dt, links)` | Synergy bonus FX layer |
| `synergyResonanceShaderPack.update` | `synergyResonanceShaderPack.update(dt, links)` | Synergy resonance shaders |
| `resonanceFeedback.update` | `resonanceFeedback.update(dt, nodes, links)` | Resonance feedback |
| `synergyCascadeFXBridge.update` | `synergyCascadeFXBridge.update(dt, nodes, links)` | Synergy cascade FX bridge |
| `pulseWaveSystemBridge.update` | `pulseWaveSystemBridge.update(dt, ...)` | Pulse wave system bridge |
| `pulseBoundaryInteractionAdapter.update` | `pulseBoundaryInteractionAdapter.update(...)` | Pulse boundary interaction |
| `linkBoostSystem.update` | `linkBoostSystem.update(dt, links, cascade)` | Link boost system |
| `cascadeParticleColorTinting.update` | `cascadeParticleColorTinting?.update?.(dt, time)` | Cascade particle color tinting |
| `regionalEquilibrium.update` | `regionalEquilibrium.update(dt, time, ...)` | Regional equilibrium |
| `cascadingRuptures.update` | `cascadingRuptures.update(dt, time, ...)` | Cascading ruptures |
| `criticalNodeFailure.update` | `criticalNodeFailure.update(dt, time)` | Critical node failure |
| `linkSemanticPictograms.update` | `linkSemanticPictograms.update(dt, time, aiNodes)` | Link semantic pictograms |
| `harmonicResonance.update` | `harmonicResonance.update(dt, ...)` | Harmonic resonance |
| `resonanceEchoTrails.update` | `resonanceEchoTrails.update(dt, ...)` | Resonance echo trails |
| `harmonicTopology.update` | `harmonicTopology.update(dt, ...)` | Harmonic topology |
| `topologyViz.update` | `topologyViz.update(dt, networkState)` | Topology visualization |
| `proceduralGlyphGenerator.update` | `proceduralGlyphGenerator.update(dt)` | Procedural glyph generation |
| `harmonicCycleController.update` | `harmonicCycleController.update(dt, ...)` | Harmonic cycle controller |
| `glyphAnimationModulator.update` | `glyphAnimationModulator.update(dt, ...)` | Glyph animation modulation |
| `metricsRuntime_v1.update` | `metricsRuntime_v1.update(deltaTime)` | Metrics runtime |

---

### LAYER: background (2 Hz)
**Purpose:** Rare events, narrative, consciousness, slow updates
**Target Frequency:** 2 Hz
**Interval:** 1/2 seconds

| System ID | Update Call | Purpose |
|-----------|-------------|---------|
| `evolutionManager.update` | `evolutionManager.update(dt, aiNodes.nodes, linkingSystem)` | Node evolution |
| `slowSemantic.update` | `runSlowSemanticTick(dt)` | Slow semantic processing |
| `linkSemanticMetricsBridge.update` | `linkSemanticMetricsBridge.update(dt)` | Link semantic metrics |
| `linkMetricsSanityGuard.update` | `linkMetricsSanityGuard.update()` | Link metrics sanity guard |
| `semanticActivityFilter.update` | `semanticActivityFilter.update()` | Semantic activity filter |

---

## DIRECT UPDATE CALLS (non-scheduled)

### Inline Update Calls in animate() / runRenderTick()
| System | Update Call | Layer (inferred) |
|---------|-------------|-------------------|
| `ZoneAudioReactivity` | `zoneAudioReactivity.update(deltaTime)` | realtime |
| `SystemStateOverlay` | `systemStateOverlay.update(dt, nodes)` | visual |
| `CoreMetricsOverlay` | `coreMetricsOverlay.update(dt, nodeManager, ...)` | visual |
| `NodeInspectOverlay` | `nodeInspectOverlay.update(dt)` | visual |
| `SimulationEffectOrchestrator` | `simulationEffectOrchestrator.update(dt)` | simulation |
| `DreamDepthEffectManager` | `dreamDepthEffectManager.update(dt, time)` | visual |

### Link-Level Subsystems (updated via LinkRendererConduit)
| System | Update Call | Layer (inferred) |
|---------|-------------|-------------------|
| `LinkBeadVisualizer` | `beads.update(visualDelta, ...)` | visual |
| `LinkSparkSystem` | `sparks.update(visualTime, visualDelta, ...)` | visual |
| `LinkBeadTrailSystem` | `trails.update(visualTime, visualDelta, ...)` | visual |
| `LinkEnergyRingSystem` | `rings.update(visualTime)` | visual |
| `LinkPulseRing` | `pulseRing.update(mainCurve, ...)` | visual |
| `LinkEnergyWave` | `energyWave.update(strands, ...)` | visual |
| `LinkRingArcDischarges` | `arcDischarges.update(...)` | visual |
| `LinkVisualStateAdapter` | `visualStateAdapter.update(...)` | visual |
| `LinkDirectionalStreaks` | `directionalStreaks.update(...)` | visual |
| `LinkCorruptionSpreadAnimator` | `corruptionAnimator.update(link, visualDelta, ...)` | visual |
| `LinkCorruptionParticleSystem` | `corruptionParticles.updateLinkParticles(link, visualDelta)` | visual |
| `LinkTrailParticleSystem` | `trailParticles.update(visualDelta, visualTime)` | visual |
| `LinkHealingParticleSystem` | `healingParticles.update(visualDelta, visualTime)` | visual |
| `NodeInterferenceManager` | `nodeInterferenceManager.update(links, ...)` | visual |
| `NodeHarmonicManager` | `nodeHarmonicManager.update(links, ...)` | visual |
| `ImpactManagerCollection` | `updateImpacts(state, visualDelta)` | visual |

### Node-Level Subsystems (updated via node systems)
| System | Update Call | Layer (inferred) |
|---------|-------------|-------------------|
| `NodeAuraSystem` | `nodeAuraSystem.update(dt, nodes)` | visual (via scheduler) |
| `ArchetypeVisualDifferentiationSystem` | `archetypeVisualDifferentiation.update(dt, nodes)` | visual |
| `NodePersonalitySystem` | `nodePersonalitySystem.update(dt, nodes)` | simulation |

---

## SUMMARY STATISTICS

### By Layer:
| Layer | Count | Primary Systems |
|--------|--------|-----------------|
| realtime | 12 | Camera, Player, VisualTime, Harmonics, Cascades |
| visual | 5 (scheduled) + ~30 (subsystems) | Renderer, Link effects, Aura systems, HUD |
| simulation | 28 | AI, Metrics, Glyphs, Resonance, Topology |
| background | 5 | Evolution, Slow semantic, Metrics sanity |

### By Type:
| Type | Count |
|------|--------|
| Visual Effects | ~35 |
| AI / Simulation | 5 |
| Metrics | 10 |
| Link Rendering | 15 |
| Aura / Shaders | 8 |
| HUD / Overlay | 4 |
| Audio | 1 |

### Total Registered Systems:
- **FrameScheduler**: ~50 systems
- **Inline/Direct**: ~10 systems
- **Subsystems (link/node)**: ~20 systems
- **GRAND TOTAL**: ~80 update-able systems

---

## AUDIT NOTES

### Critical Observations:

1. **Link-Heavy Visual Layer**: LinkRendererConduit manages ~15 subsystems per link
   - Beads, sparks, trails, rings, pulses, waves, arcs, streaks, corruption, healing
   - All update at 30Hz (visual layer) via LinkRendererConduit.update()

2. **Harmonic Cascade System**: Has 6 separate registered systems
   - harmonicResonanceCoupling.realtime
   - harmonicHubAuraSystem.realtime
   - harmonicInfluencePropagation.realtime
   - harmonicCascadeAmplification.realtime
   - cascadeVisualizer.realtime
   - cascadeVisualizer.visual (via runRenderTick)

3. **Metrics Overhead**: Multiple metrics systems updating
   - metricsRuntime_v1 (simulation)
   - metricsVisualFX (simulation)
   - linkSemanticMetricsBridge (background)
   - linkMetricsSanityGuard (background)
   - coreMetricsOverlay (realtime)

4. **Semantic Systems**: Distributed across layers
   - Slow semantic: 10Hz (simulation)
   - Visual semantic: 30Hz (realtime via flag)
   - Link semantic: 2Hz (background)

5. **Audio System**: Only 1 system (ZoneAudioReactivity)
   - Updates inline, not via FrameScheduler

---

## AUDIT DATE: 2025-02-26
## METHOD: Static code analysis (READ ONLY)
## SOURCE: main.js, FrameScheduler.js, LinkRendererConduit.js, Node systems
