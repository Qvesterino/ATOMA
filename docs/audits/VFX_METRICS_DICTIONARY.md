# VFX Metrics Dictionary

This document is a working glossary for ATOMA VFX data flow.
It separates:
- canonical state fields
- semantic events
- wave/trap snapshots
- local derived modifiers

Rule of thumb:
- `metrics.*` = canonical state
- `cascade.*` = semantic event
- `waveField.*` = solver snapshot / renderer input
- `flowState.*` = transitional link state
- `trap.*` = standing-wave internal state
- `*Boost`, `*Factor`, `*Index`, `*Dominance` = local derived modifiers, not canonical state

Status legend:
- `OK` = one intended writer path or one canonical authority with a clean mirror
- `MULTIPLE WRITERS` = more than one runtime authority writes the same meaning
- `MISSING WRITER` = readers exist but no live writer was found
- `DEAD WRITER` = writer exists only as seed/helper or is not scheduler-backed
- `FALSE SAFE` = reader has a fallback, but the field still lacks a canonical writer
- `INTERNAL ONLY` = field is valid only inside a closed subsystem
- `LOCAL DERIVED` = computed presentation value, not canonical state

## 1) Canonical State Fields

| Field | Meaning | WRITER | READER | STATUS | Notes |
|---|---|---|---|---|---|
| `node.userData.metrics.synergy` | Network compatibility / interconnection strength | `D:\ATOMA_CLEAN\src\metrics\NodeMetricEngine.js:updateNodeMetrics()` via `D:\ATOMA_CLEAN\MetricsRuntime_v1.js:_step()` (`simulation.metricsAggregator`)<br>`D:\ATOMA_CLEAN\MetricsRuntime_v1.js:_ensureNodeCanonicalFallbacks()` | `D:\ATOMA_CLEAN\WaveBurstRouter_v1.js`<br>`D:\ATOMA_CLEAN\WaveParticleEmitter_v1.js`<br>`D:\ATOMA_CLEAN\_AdaptiveGlyphRendering1_0.js`<br>`D:\ATOMA_CLEAN\CompositeGlyphResonanceFeedback.js`<br>`D:\ATOMA_CLEAN\_SemanticGlyphAI.js` | `MULTIPLE WRITERS` | Canonical node metric, plus fallback mirror path. |
| `node.userData.metrics.harmony` | Harmonic alignment / compatibility | `D:\ATOMA_CLEAN\src\metrics\NodeMetricEngine.js:updateNodeMetrics()` via `D:\ATOMA_CLEAN\MetricsRuntime_v1.js:_step()` (`simulation.metricsAggregator`)<br>`D:\ATOMA_CLEAN\MetricsRuntime_v1.js:_ensureNodeCanonicalFallbacks()` | `D:\ATOMA_CLEAN\WaveBurstRouter_v1.js`<br>`D:\ATOMA_CLEAN\WaveParticleEmitter_v1.js`<br>`D:\ATOMA_CLEAN\_AdaptiveGlyphRendering1_0.js`<br>`D:\ATOMA_CLEAN\CompositeGlyphResonanceFeedback.js`<br>`D:\ATOMA_CLEAN\_SemanticGlyphAI.js` | `MULTIPLE WRITERS` | Canonical node metric, plus fallback mirror path. |
| `node.userData.metrics.stability` | Stability / resistance to stress | `D:\ATOMA_CLEAN\src\metrics\NodeMetricEngine.js:updateNodeMetrics()` via `D:\ATOMA_CLEAN\MetricsRuntime_v1.js:_step()` (`simulation.metricsAggregator`)<br>`D:\ATOMA_CLEAN\MetricsRuntime_v1.js:_ensureNodeCanonicalFallbacks()` | `D:\ATOMA_CLEAN\WaveBurstRouter_v1.js`<br>`D:\ATOMA_CLEAN\StandingWaveOscillationTrapSystem_Session130.js`<br>`D:\ATOMA_CLEAN\_AdaptiveGlyphRendering1_0.js`<br>`D:\ATOMA_CLEAN\_AINarrativePatterns6_0.js` | `MULTIPLE WRITERS` | Canonical node metric, plus fallback mirror path. |
| `node.userData.metrics.corruption` | Corruption / degradation / void influence | `D:\ATOMA_CLEAN\src\metrics\NodeMetricEngine.js:updateNodeMetrics()` via `D:\ATOMA_CLEAN\MetricsRuntime_v1.js:_step()` (`simulation.metricsAggregator`)<br>`D:\ATOMA_CLEAN\MetricsRuntime_v1.js:_ensureNodeCanonicalFallbacks()`<br>`D:\ATOMA_CLEAN\LinkCorruptionTransmission_v1.js` | `D:\ATOMA_CLEAN\WaveBurstRouter_v1.js`<br>`D:\ATOMA_CLEAN\WaveParticleEmitter_v1.js`<br>`D:\ATOMA_CLEAN\CorruptionVisualFX_v1.js`<br>`D:\ATOMA_CLEAN\CorruptionDrivenAuraDesaturationSystem.js`<br>`D:\ATOMA_CLEAN\_AdaptiveGlyphRendering1_0.js` | `MULTIPLE WRITERS` | Canonical node metric, plus corruption bridge writes. |
| `node.userData.metrics.loadPressure` | Network stress / load | `D:\ATOMA_CLEAN\src\metrics\NodeMetricEngine.js:updateNodeMetrics()` via `D:\ATOMA_CLEAN\MetricsRuntime_v1.js:_step()` (`simulation.metricsAggregator`)<br>`D:\ATOMA_CLEAN\MetricsRuntime_v1.js:_ensureNodeCanonicalFallbacks()` | `D:\ATOMA_CLEAN\WaveBurstRouter_v1.js`<br>`D:\ATOMA_CLEAN\WaveParticleEmitter_v1.js`<br>`D:\ATOMA_CLEAN\LinkRendererConduit.js`<br>`D:\ATOMA_CLEAN\MultiStrandConduitShader.js`<br>`D:\ATOMA_CLEAN\CoreMetricsOverlay.js` | `MULTIPLE WRITERS` | Canonical load metric. |
| `node.userData.metrics.load` | Legacy alias for load pressure | `D:\ATOMA_CLEAN\MetricsRuntime_v1.js:_ensureNodeCanonicalFallbacks()`<br>`D:\ATOMA_CLEAN\src\metrics\NodeMetricEngine.js:setMetric()` / `applyMetricImpulse()` / `updateNodeMetrics()` mirror `loadPressure` | `D:\ATOMA_CLEAN\WaveBurstRouter_v1.js`<br>`D:\ATOMA_CLEAN\MultiStrandConduitShader.js`<br>`D:\ATOMA_CLEAN\CoreMetricsOverlay.js`<br>`D:\ATOMA_CLEAN\SemanticMetricAdapter.js`<br>`D:\ATOMA_CLEAN\_AIEmotionalFeed3_1.js` | `OK` | Alias mirror of `loadPressure`; intentionally duplicated for compatibility. |
| `node.userData.metrics.loadRatio` | Legacy alias for load pressure | `D:\ATOMA_CLEAN\MetricsRuntime_v1.js:_ensureNodeCanonicalFallbacks()`<br>`D:\ATOMA_CLEAN\src\metrics\NodeMetricEngine.js:setMetric()` / `applyMetricImpulse()` / `updateNodeMetrics()` mirror `loadPressure` | `D:\ATOMA_CLEAN\WaveBurstRouter_v1.js`<br>`D:\ATOMA_CLEAN\MultiStrandConduitShader.js`<br>`D:\ATOMA_CLEAN\CoreMetricsOverlay.js`<br>`D:\ATOMA_CLEAN\SemanticMetricAdapter.js`<br>`D:\ATOMA_CLEAN\_AIEmotionalFeed3_1.js` | `OK` | Alias mirror of `loadPressure`; intentionally duplicated for compatibility. |
| `node.userData.instability` | Derived instability (`1 - stability`) | `D:\ATOMA_CLEAN\MetricsRuntime_v1.js:_ensureNodeCanonicalFallbacks()` | `D:\ATOMA_CLEAN\WaveBurstRouter_v1.js`<br>`D:\ATOMA_CLEAN\_AINarrativePatterns6_0.js`<br>`D:\ATOMA_CLEAN\_AdaptiveGlyphRendering1_0.js` | `OK` | Derived alias, not canonical. |
| `node.userData.resonance` | Standing-wave resonance snapshot | `D:\ATOMA_CLEAN\StandingWaveOscillationTrapSystem_Session130.js:_writeWaveResonanceCanonical()` | `D:\ATOMA_CLEAN\StandingWaveVisualRenderer_Session131.js`<br>`D:\ATOMA_CLEAN\ResonanceRuptureVisualSystem_Session133.js`<br>`D:\ATOMA_CLEAN\SNIPPETS\WEEK13_ARCHETYPE_CURVES_SNIPPETS.js` | `INTERNAL ONLY` | Live only while the standing-wave trap system is active. |
| `link.userData.cascadeIntensity` | Cascade energy / propagation strength | `D:\ATOMA_CLEAN\LinkSemanticMetricsBridge_v1.js:update()` (`semantic.slow10Hz`)<br>`D:\ATOMA_CLEAN\LinkCascadeInfectionSystem.js:update()` (`semantic.slow10Hz`)<br>`D:\ATOMA_CLEAN\CascadeEventBridge_v1.js:_decayUpdate()` | `D:\ATOMA_CLEAN\CascadeParticleSystem_Session120.js`<br>`D:\ATOMA_CLEAN\CascadeParticleColorTinting_Session119.js`<br>`D:\ATOMA_CLEAN\CascadeParticleEmissionBoost_Session118.js`<br>`D:\ATOMA_CLEAN\ParticleSemanticDensityAdapter_Session121.js`<br>`D:\ATOMA_CLEAN\ResonanceRuptureVisualSystem_Session133.js`<br>`D:\ATOMA_CLEAN\WaveParticleEmitter_v1.js` | `MULTIPLE WRITERS` | Canonical link cascade state, but authored by several runtime bridges. |
| `link.userData.cascadeConflictType` | Cascade semantic type | `D:\ATOMA_CLEAN\CascadeEventBridge_v1.js:_decayUpdate()`<br>`D:\ATOMA_CLEAN\NodeLinkingSystem.js` init seeds | `D:\ATOMA_CLEAN\CascadeParticleSystem_Session120.js`<br>`D:\ATOMA_CLEAN\CascadeParticleColorTinting_Session119.js`<br>`D:\ATOMA_CLEAN\ResonanceRuptureVisualSystem_Session133.js` | `MULTIPLE WRITERS` | Semantic label, not a scalar metric. |
| `link.userData.conflictIntensity` | Effective conflict strength | `D:\ATOMA_CLEAN\CascadeEventBridge_v1.js:_decayUpdate()` | `D:\ATOMA_CLEAN\ResonanceRuptureVisualSystem_Session133.js`<br>`D:\ATOMA_CLEAN\CascadeParticleSystem_Session120.js` | `OK` | Derived from the flow state. |
| `link.userData.synergyCollapse` | Whether the link is in collapse mode | `D:\ATOMA_CLEAN\CascadeEventBridge_v1.js:_decayUpdate()` | `D:\ATOMA_CLEAN\ResonanceRuptureVisualSystem_Session133.js` | `OK` | Boolean state only. |
| `link.userData.synergyCascadeTime` | Collapse start timestamp | `D:\ATOMA_CLEAN\CascadeEventBridge_v1.js:_decayUpdate()` | `D:\ATOMA_CLEAN\ResonanceRuptureVisualSystem_Session133.js` | `OK` | Timestamp state only. |

## 2) Cascade / Flow State Fields

| Field | Meaning | WRITER | READER | STATUS | Notes |
|---|---|---|---|---|---|
| `link.userData.flowState.intensity` | Transitional cascade / flow intensity on a link | `D:\ATOMA_CLEAN\CascadeEventBridge_v1.js:_handleNodeSynergyHigh()`<br>`D:\ATOMA_CLEAN\CascadeEventBridge_v1.js:_handleMetricCorruptionRise()`<br>`D:\ATOMA_CLEAN\CascadeEventBridge_v1.js:_handleLinkCollapsed()`<br>`D:\ATOMA_CLEAN\CascadeEventBridge_v1.js:_handleNodeHover()`<br>`D:\ATOMA_CLEAN\CascadeEventBridge_v1.js:_decayUpdate()`<br>`D:\ATOMA_CLEAN\NodeLinkingSystem.js` init seeds | `D:\ATOMA_CLEAN\CascadeParticleSystem_Session120.js`<br>`D:\ATOMA_CLEAN\ParticleSemanticDensityAdapter_Session121.js`<br>`D:\ATOMA_CLEAN\WaveBurstRouter_v1.js`<br>`D:\ATOMA_CLEAN\WaveParticleEmitter_v1.js` | `MULTIPLE WRITERS` | Transitional state, not canonical metric. |
| `link.userData.flowState.energy` | Harmonic energy / read-only harmonic snapshot | `D:\ATOMA_CLEAN\CascadeEventBridge_v1.js:_decayUpdate()`<br>`D:\ATOMA_CLEAN\NodeLinkingSystem.js` init seeds | `D:\ATOMA_CLEAN\WaveBurstRouter_v1.js`<br>`D:\ATOMA_CLEAN\WaveParticleEmitter_v1.js`<br>`D:\ATOMA_CLEAN\LinkResonanceFlowIntegrationPatch_Session124.js` (read-only snapshot only) | `MULTIPLE WRITERS` | Treat as snapshot, not authority. |
| `link.userData.flowState.type` | Semantic conflict type for the link | `D:\ATOMA_CLEAN\CascadeEventBridge_v1.js:_handleNodeSynergyHigh()`<br>`D:\ATOMA_CLEAN\CascadeEventBridge_v1.js:_handleMetricCorruptionRise()`<br>`D:\ATOMA_CLEAN\CascadeEventBridge_v1.js:_handleLinkCollapsed()`<br>`D:\ATOMA_CLEAN\CascadeEventBridge_v1.js:_handleNodeHover()`<br>`D:\ATOMA_CLEAN\NodeLinkingSystem.js` init seeds | `D:\ATOMA_CLEAN\CascadeParticleSystem_Session120.js`<br>`D:\ATOMA_CLEAN\WaveBurstRouter_v1.js`<br>`D:\ATOMA_CLEAN\WaveParticleEmitter_v1.js` | `MULTIPLE WRITERS` | String label only. |
| `link.userData.flowState.direction` | Flow direction / backflow flag | `D:\ATOMA_CLEAN\CascadeEventBridge_v1.js:_handleLinkCollapsed()`<br>`D:\ATOMA_CLEAN\NodeLinkingSystem.js` init seeds | `D:\ATOMA_CLEAN\CascadeParticleSystem_Session120.js`<br>`D:\ATOMA_CLEAN\WaveParticleEmitter_v1.js` | `OK` | Directional state only. |
| `link.userData.flowState.lastUpdateTime` | Last update timestamp | `D:\ATOMA_CLEAN\NodeLinkingSystem.js` init seeds<br>`D:\ATOMA_CLEAN\CascadeEventBridge_v1.js:_decayUpdate()` for active flow updates | `D:\ATOMA_CLEAN\LinkResonanceFlowIntegrationPatch_Session124.js` (read-only helper snapshot) | `DEAD WRITER` | Exists mostly as seed/helper metadata, not as an owned runtime authority. |

## 3) Wave Snapshot Fields

| Field | Meaning | WRITER | READER | STATUS | Notes |
|---|---|---|---|---|---|
| `node.userData.waveField` | Node wave snapshot for renderer / particles | `D:\ATOMA_CLEAN\StandingWaveOscillationTrapSystem_Session130.js:_writeWaveResonanceCanonical()` (`simulation.waveStandingTraps`)<br>`D:\ATOMA_CLEAN\CascadingHarmonicResonanceAmplification.js:update()` (`simulation.harmonyCascade`) | `D:\ATOMA_CLEAN\WaveParticleEmitter_v1.js`<br>`D:\ATOMA_CLEAN\WaveShaderBridge_v1.js`<br>`D:\ATOMA_CLEAN\WaveTravelShaderPack_v1.js` | `MULTIPLE WRITERS` | Snapshot, not canonical state. |
| `link.userData.waveField` | Link wave fallback snapshot | `D:\ATOMA_CLEAN\LinkCascadeInfectionSystem.js:_writeFallbackWaveField()`<br>`D:\ATOMA_CLEAN\CascadeToWaveBridge_v1.js:_writeFallbackWaveField()` | `D:\ATOMA_CLEAN\WaveParticleEmitter_v1.js`<br>`D:\ATOMA_CLEAN\WaveShaderBridge_v1.js` | `MULTIPLE WRITERS` | Fallback snapshot for links. |
| `waveField.amplitude` | Wave amplitude / total envelope | `D:\ATOMA_CLEAN\StandingWaveOscillationTrapSystem_Session130.js:_writeWaveResonanceCanonical()`<br>`D:\ATOMA_CLEAN\CascadingHarmonicResonanceAmplification.js:update()`<br>`D:\ATOMA_CLEAN\LinkCascadeInfectionSystem.js:_writeFallbackWaveField()` | `D:\ATOMA_CLEAN\WaveParticleEmitter_v1.js`<br>`D:\ATOMA_CLEAN\WaveShaderBridge_v1.js` | `MULTIPLE WRITERS` | Primary visual amplitude input. |
| `waveField.constructive` / `constructivePower` | Constructive interference strength | `D:\ATOMA_CLEAN\StandingWaveOscillationTrapSystem_Session130.js:_writeWaveResonanceCanonical()`<br>`D:\ATOMA_CLEAN\CascadingHarmonicResonanceAmplification.js:update()`<br>`D:\ATOMA_CLEAN\LinkCascadeInfectionSystem.js:_writeFallbackWaveField()`<br>`D:\ATOMA_CLEAN\WaveInterferenceEngine_v1.js:_buildSnapshot()` / `getLinkWaveField()` | `D:\ATOMA_CLEAN\WaveParticleEmitter_v1.js`<br>`D:\ATOMA_CLEAN\WaveShaderBridge_v1.js` | `MULTIPLE WRITERS` | Alias pair for the same concept. |
| `waveField.destructive` / `destructivePower` | Destructive interference strength | `D:\ATOMA_CLEAN\StandingWaveOscillationTrapSystem_Session130.js:_writeWaveResonanceCanonical()`<br>`D:\ATOMA_CLEAN\CascadingHarmonicResonanceAmplification.js:update()`<br>`D:\ATOMA_CLEAN\LinkCascadeInfectionSystem.js:_writeFallbackWaveField()`<br>`D:\ATOMA_CLEAN\WaveInterferenceEngine_v1.js:_buildSnapshot()` / `getLinkWaveField()` | `D:\ATOMA_CLEAN\WaveParticleEmitter_v1.js`<br>`D:\ATOMA_CLEAN\WaveShaderBridge_v1.js` | `MULTIPLE WRITERS` | Alias pair for the same concept. |
| `waveField.standing` / `standingWaveFactor` | Standing-wave component | `D:\ATOMA_CLEAN\StandingWaveOscillationTrapSystem_Session130.js:_writeWaveResonanceCanonical()`<br>`D:\ATOMA_CLEAN\CascadingHarmonicResonanceAmplification.js:update()`<br>`D:\ATOMA_CLEAN\LinkCascadeInfectionSystem.js:_writeFallbackWaveField()`<br>`D:\ATOMA_CLEAN\WaveInterferenceEngine_v1.js:_buildSnapshot()` / `getLinkWaveField()` | `D:\ATOMA_CLEAN\WaveParticleEmitter_v1.js`<br>`D:\ATOMA_CLEAN\WaveShaderBridge_v1.js` | `MULTIPLE WRITERS` | Alias pair for the same concept. |
| `waveField.phase` / `travelPhase` | Wave phase / progression | `D:\ATOMA_CLEAN\StandingWaveOscillationTrapSystem_Session130.js:_writeWaveResonanceCanonical()`<br>`D:\ATOMA_CLEAN\CascadingHarmonicResonanceAmplification.js:update()`<br>`D:\ATOMA_CLEAN\LinkCascadeInfectionSystem.js:_writeFallbackWaveField()`<br>`D:\ATOMA_CLEAN\WaveInterferenceEngine_v1.js:_buildSnapshot()` / `getLinkWaveField()` | `D:\ATOMA_CLEAN\WaveParticleEmitter_v1.js`<br>`D:\ATOMA_CLEAN\WaveShaderBridge_v1.js`<br>`D:\ATOMA_CLEAN\WaveTravelShaderPack_v1.js` | `MULTIPLE WRITERS` | Phase data only. |
| `waveField.source` | Source tag for the wave snapshot | `D:\ATOMA_CLEAN\LinkCascadeInfectionSystem.js:_writeFallbackWaveField()`<br>`D:\ATOMA_CLEAN\CascadingHarmonicResonanceAmplification.js:update()`<br>`D:\ATOMA_CLEAN\StandingWaveOscillationTrapSystem_Session130.js:_writeWaveResonanceCanonical()`<br>`D:\ATOMA_CLEAN\CascadeToWaveBridge_v1.js:_writeFallbackWaveField()` | `D:\ATOMA_CLEAN\WaveParticleEmitter_v1.js`<br>`D:\ATOMA_CLEAN\WaveShaderBridge_v1.js` | `MULTIPLE WRITERS` | Important for cascade vs standing inference. |
| `waveField.sourceCount` | Number of contributing sources | `D:\ATOMA_CLEAN\CascadingHarmonicResonanceAmplification.js:update()`<br>`D:\ATOMA_CLEAN\WaveInterferenceEngine_v1.js:_buildSnapshot()` / `getLinkWaveField()` | `D:\ATOMA_CLEAN\WaveShaderBridge_v1.js` | `MULTIPLE WRITERS` | Counts sources, not intensity. |
| `waveField.totalAmplitude` | Aggregated amplitude snapshot | `D:\ATOMA_CLEAN\WaveInterferenceEngine_v1.js:_buildSnapshot()` / `getLinkWaveField()` | `D:\ATOMA_CLEAN\WaveShaderBridge_v1.js` | `OK` | Snapshot field returned by the engine. |
| `waveField.interferenceIndex` | Combined interference score | `D:\ATOMA_CLEAN\WaveInterferenceEngine_v1.js:_buildSnapshot()` / `getLinkWaveField()` | `D:\ATOMA_CLEAN\WaveShaderBridge_v1.js` | `OK` | Derived snapshot field. |

## 4) Trap / Standing-Wave Fields

| Field | Meaning | WRITER | READER | STATUS | Notes |
|---|---|---|---|---|---|
| `trap.amplitude` | Standing-wave trap amplitude | `D:\ATOMA_CLEAN\StandingWaveOscillationTrapSystem_Session130.js` | `D:\ATOMA_CLEAN\StandingWaveVisualRenderer_Session131.js`<br>`D:\ATOMA_CLEAN\ResonanceRuptureVisualSystem_Session133.js` | `OK` | Internal trap state. |
| `trap.phase` | Standing-wave trap phase | `D:\ATOMA_CLEAN\StandingWaveOscillationTrapSystem_Session130.js` | `D:\ATOMA_CLEAN\StandingWaveVisualRenderer_Session131.js`<br>`D:\ATOMA_CLEAN\ResonanceRuptureVisualSystem_Session133.js` | `OK` | Internal trap state. |
| `trap.frequency` | Standing-wave oscillation frequency | `D:\ATOMA_CLEAN\StandingWaveOscillationTrapSystem_Session130.js` | standing-wave visual / rupture code | `OK` | Internal trap state. |
| `trap.active` | Whether the trap is live | `D:\ATOMA_CLEAN\StandingWaveOscillationTrapSystem_Session130.js` | `D:\ATOMA_CLEAN\StandingWaveVisualRenderer_Session131.js`<br>`D:\ATOMA_CLEAN\ResonanceRuptureVisualSystem_Session133.js` | `OK` | Internal trap state. |

## 5) Semantic Events

| Event | Meaning | WRITER | READER | STATUS | Notes |
|---|---|---|---|---|---|
| `cascade.start` | First entry into active cascade lifecycle | `D:\ATOMA_CLEAN\LinkSemanticMetricsBridge_v1.js:update()`<br>`D:\ATOMA_CLEAN\CascadeEventBridge_v1.js:_emitCascadeStart()`<br>`D:\ATOMA_CLEAN\SynergyCascadeFXBridge_v1.js` | `D:\ATOMA_CLEAN\ResonanceCascadeVisualization_Session117B.js`<br>`D:\ATOMA_CLEAN\SynergyCascadeVisualizer.js`<br>`D:\ATOMA_CLEAN\WaveBurstRouter_v1.js` | `MULTIPLE WRITERS` | Event, not state. |
| `cascade.hop` | Cascade propagation hop / transfer | `D:\ATOMA_CLEAN\LinkSemanticMetricsBridge_v1.js:update()`<br>`D:\ATOMA_CLEAN\LinkCascadeInfectionSystem.js:update()`<br>`D:\ATOMA_CLEAN\CascadeEventBridge_v1.js:_emitCascadeHop()`<br>`D:\ATOMA_CLEAN\CascadeParticleSystem_Session120.js` | `D:\ATOMA_CLEAN\ResonanceCascadeVisualization_Session117B.js`<br>`D:\ATOMA_CLEAN\SynergyCascadeVisualizer.js`<br>`D:\ATOMA_CLEAN\WaveBurstRouter_v1.js`<br>`D:\ATOMA_CLEAN\ResonanceRuptureVisualSystem_Session133.js` | `MULTIPLE WRITERS` | Main propagation signal. |
| `cascade.end` | Cascade lifecycle ended | `D:\ATOMA_CLEAN\LinkSemanticMetricsBridge_v1.js:update()`<br>`D:\ATOMA_CLEAN\CascadeEventBridge_v1.js:_emitCascadeEnd()`<br>`D:\ATOMA_CLEAN\SynergyCascadeFXBridge_v1.js` | `D:\ATOMA_CLEAN\ResonanceCascadeVisualization_Session117B.js`<br>`D:\ATOMA_CLEAN\SynergyCascadeVisualizer.js` | `MULTIPLE WRITERS` | Event, not state. |
| `metric:corruptionRise` | Corruption crossed a rise threshold | `D:\ATOMA_CLEAN\src\metrics\NodeMetricEngine.js:emitSemanticMetricEvent()` | `D:\ATOMA_CLEAN\CascadeEventBridge_v1.js`<br>`D:\ATOMA_CLEAN\ResonanceRuptureVisualSystem_Session133.js` | `OK` | Threshold event. |
| `metric:harmonyPeak` | Harmony crossed the peak threshold | `D:\ATOMA_CLEAN\src\metrics\NodeMetricEngine.js:emitSemanticMetricEvent()` | harmony visuals / HUD | `OK` | Threshold event. |
| `metric:stabilityDrop` | Stability dropped enough to matter | `D:\ATOMA_CLEAN\src\metrics\NodeMetricEngine.js:emitSemanticMetricEvent()` | stress / rupture visuals | `OK` | Threshold event. |
| `metric:loadPressureHigh` | Load pressure crossed the high threshold | `D:\ATOMA_CLEAN\src\metrics\NodeMetricEngine.js:emitSemanticMetricEvent()` | `D:\ATOMA_CLEAN\WaveBurstRouter_v1.js`<br>`D:\ATOMA_CLEAN\WaveParticleEmitter_v1.js` | `OK` | Threshold event. |
| `metric.synergy.burst` | Synergy burst event | `D:\ATOMA_CLEAN\src\metrics\NodeMetricEngine.js:emitNodeThresholdEvents()` | resonance / glyph systems | `OK` | Node event. |
| `metric.corruption.spike` | Corruption spike event | `D:\ATOMA_CLEAN\src\metrics\NodeMetricEngine.js:emitNodeThresholdEvents()` | `D:\ATOMA_CLEAN\CascadeEventBridge_v1.js`<br>`D:\ATOMA_CLEAN\ResonanceRuptureVisualSystem_Session133.js` | `OK` | Node event. |

## 6) Local Derived Modifiers

These are not canonical fields. They are local presentation or routing modifiers.

| Modifier | Meaning | WRITER | READER | STATUS | Notes |
|---|---|---|---|---|---|
| `synergyCoherence` | Coherence score derived from harmony/corruption balance | `D:\ATOMA_CLEAN\CompositeGlyphResonanceFeedback.js`<br>`D:\ATOMA_CLEAN\HarmonicInfluencePropagationSystem_Session127.js` | glyph / resonance consumers | `LOCAL DERIVED` | Keep local; do not promote to canonical state. |
| `harmonyDominance` | Local harmony dominance measure | `D:\ATOMA_CLEAN\_GlyphLayer4_MultiFusion.js` | glyph / fusion consumers | `LOCAL DERIVED` | Rename with domain prefix if reused elsewhere. |
| `synergyBoost` | Multiplicative uplift derived from synergy / coherence | `D:\ATOMA_CLEAN\CompositeGlyphResonanceFeedback.js`<br>`D:\ATOMA_CLEAN\HubInfluencePropagation.js`<br>`D:\ATOMA_CLEAN\HarmonicHubAuraSystem_Session126.js` | glyph, resonance, aura systems | `LOCAL DERIVED` | Local multiplier only. |
| `stabilityFactor` | Dampening / resilience factor | `D:\ATOMA_CLEAN\CompositeGlyphResonanceFeedback.js`<br>`D:\ATOMA_CLEAN\HarmonicHubResilienceController.js`<br>`D:\ATOMA_CLEAN\_LinkedGlyphMessaging3_0.js` | glyph / resonance / link messaging systems | `LOCAL DERIVED` | High duplication risk; rename per domain. |
| `stabilityIndex` | Stability summary index | `D:\ATOMA_CLEAN\_GlyphLayer4_MultiFusion.js` | glyph / fusion consumers | `LOCAL DERIVED` | Keep as derived presentation value. |
| `CorruptionModulation` | Corruption gain/loss modulator | `D:\ATOMA_CLEAN\AtomaAudioModulation.js` | audio / visual helpers | `LOCAL DERIVED` | Keep local and explicit. |
| `corruptionRise` | Name used both as event label and semantic delta | `D:\ATOMA_CLEAN\src\metrics\NodeMetricEngine.js:emitSemanticMetricEvent()` | metric event consumers | `LOCAL DERIVED` | Prefer event name only. |

## 7) Lean Normalization Rules

1. Keep `metrics.*` canonical and minimal.
2. Keep `cascade.*` as event names only.
3. Keep `waveField.*` as renderer-ready snapshots only.
4. Keep `flowState.*` as transitional link state only.
5. If a derived modifier is reused in more than one system, give it a domain prefix.
6. If two names mean the same thing, keep one canonical name and make the others explicit aliases.

## 8) Recommended Ownership

| Domain | Recommended owner |
|---|---|
| Node canonical metrics | `D:\ATOMA_CLEAN\src\metrics\NodeMetricEngine.js` + `D:\ATOMA_CLEAN\MetricsRuntime_v1.js` |
| Link cascade intensity | `D:\ATOMA_CLEAN\LinkSemanticMetricsBridge_v1.js` + `D:\ATOMA_CLEAN\LinkCascadeInfectionSystem.js` |
| Cascade lifecycle events | `D:\ATOMA_CLEAN\CascadeEventBridge_v1.js` / `D:\ATOMA_CLEAN\LinkSemanticMetricsBridge_v1.js` |
| Node wave snapshots | `D:\ATOMA_CLEAN\StandingWaveOscillationTrapSystem_Session130.js` + `D:\ATOMA_CLEAN\CascadingHarmonicResonanceAmplification.js` |
| Link wave snapshots | `D:\ATOMA_CLEAN\LinkCascadeInfectionSystem.js` fallback |
| Wave rendering input | `D:\ATOMA_CLEAN\WaveInterferenceEngine_v1.js` + `D:\ATOMA_CLEAN\WaveShaderBridge_v1.js` |

## 9) Real Visual Attachment Systems

Criteria for inclusion:
- owns or instantiates visible geometry (`Mesh`, `Points`, `Line`, `Group`)
- attaches into the scene graph via `scene.add()`, root attach, or `nodeObject.add()`
- is a real visual consumer, not only a metric bridge or shader uniform writer

| Category | System | Attach point | Visible primitive | Verdict | Notes |
|---|---|---|---|---|---|
| Cascade | `CascadeParticleSystem_Session120.js` | `scene.add(this.mesh)` | `Points` cloud | `ACTIVE` | Primary cascade particle field. |
| Cascade | `SynergyCascadeVisualizer.js` | `scene.add(rippleLine / mesh)` | `Line` + `Mesh` | `ACTIVE` | Cascade propagation visual layer. |
| Wave | `WaveParticleEmitter_v1.js` | `scene.add(points)` | `Points` cloud x3 | `ACTIVE` | Real particle emitter; not shader-only. |
| Wave | `WaveInterferencePatternSystem_Session132.js` | `scene.add(mesh)` | `Mesh` zones | `ACTIVE` | Constructs interference volumes. |
| Resonance | `StandingWaveVisualRenderer_Session131.js` | `resolvedRoot.add(this.root)` | `Group` + antinode / trap meshes | `ACTIVE` | Visual renderer for trap output. |
| Resonance | `ResonanceRuptureVisualSystem_Session133.js` | `scene.add(mesh)` | `Mesh` scars / rupture bursts | `ACTIVE` | Real rupture geometry and pulses. |
| Resonance | `HarmonicRecoveryVisualSystem_Session138.js` | `scene.add(mesh)` | `Mesh` waves / halos | `ACTIVE` | Recovery visuals with real geometry. |
| Resonance | `HarmonicResonanceFeedbackSystem.js` | `scene.add(container)` | `Group` + debug field meshes | `ACTIVE` | Feedback field owns visible meshes. |
| Resonance | `ResonanceEchoTrailSystem.js` | `_attachRoot.add(this.root)` | `Group` + echo meshes / lines | `ACTIVE` | Echo trail geometry is scene-attached. |
| Resonance | `HarmonicHubAuraSystem_Session126.js` | `_attachRoot.add(this.fieldGroup)` | `Group` + aura meshes | `ACTIVE` | Hub aura is real scene geometry. |
| Resonance | `HarmonicInfluencePropagationSystem_Session127.js` | `_attachRoot.add(this.root)` | `Group` + aura / flow meshes | `ACTIVE` | Propagation geometry is owned here. |
| Resonance | `HarmonicNodeResonanceHalos.js` | `nodeObject.add(haloMesh)` | node-attached halo mesh | `ACTIVE` | Attached to node graph, not global scene. |
| Particle | `ParticleTrailSystem_Session122.js` | `scene.add(this.trailMesh)` | `Points` trail cloud | `ACTIVE` | Trail geometry for cascade particles. |
| Particle | `HealingParticleSystem_Session136.js` | `scene.add(this.mesh)` | `Points` cloud | `ACTIVE` | Healing particles with shader-driven attributes. |
| Particle | `LinkHealingParticleSystem.js` | `scene.add(this.points)` | `Points` cloud | `ACTIVE` | Link healing emitter. |
| Particle | `LinkCorruptionParticleSystem.js` | `scene.add(this.points)` | `Points` cloud | `ACTIVE` | Corruption particle emitter. |
| Particle | `LinkTrailParticleSystem.js` | `scene.add(this.poolGroup)` | `Group` + pooled meshes | `ACTIVE` | Real pooled trail geometry. |

## 10) Excluded From Real-Attach Audit

These files are related to the requested families, but they do not own real visible geometry in the runtime path:

| System | Reason excluded | Notes |
|---|---|---|
| `CascadeResonanceWaveVisualization_Session146.js` | Explicitly documents `NO new geometry or mesh objects` | It modulates existing hub/link visuals only. |
| `StandingWaveOscillationTrapSystem_Session130.js` | Trap-state generator only | The visible geometry is owned by `StandingWaveVisualRenderer_Session131.js`. |
| `CascadeParticleEmissionBoost_Session118.js` | Emission-rate helper only | No scene graph ownership. |
| `CascadeParticleColorTinting_Session119.js` | Color metadata helper only | Writes tint state, not geometry. |
| `ParticleTrailIntegrationPatch_Session122.js` | Integration glue only | Delegates to `ParticleTrailSystem_Session122.js`. |
| `WaveShaderBridge_v1.js` | Shader-uniform bridge only | Modifies materials, not meshes. |
| `WaveTravelShaderPack_v1.js` | Shader pack only | No scene-attached geometry. |
| `WaveDynamicsShaderPack_v1.js` | Shader pack only | No scene-attached geometry. |
| `WaveInterferenceEngine_v1.js` | Snapshot / solver only | Computes wave data, but does not attach visible meshes. |
