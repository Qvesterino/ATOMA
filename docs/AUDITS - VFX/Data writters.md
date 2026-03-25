Spravil som runtime VFX audit pre `waveField`, `cascadeIntensity`, `flowState` a `metrics.*` na jadrovej ceste projektu. Beriem to ako audit živých runtime systémov napojených z `main.js`; legacy/example súbory som nepočítal do hlavného výsledku, pokiaľ nie sú priamo wired do runtime.

**`link.userData.cascadeIntensity`**
- WRITERS:
  - `D:\ATOMA_CLEAN\LinkSemanticMetricsBridge_v1.js` — `LinkSemanticMetricsBridge_v1.update()`  
    - scheduler: `semantic.slow10Hz` / `runSlowSemanticTick()`
  - `D:\ATOMA_CLEAN\LinkCascadeInfectionSystem.js` — `LinkCascadeInfectionSystem.update()`  
    - scheduler: `semantic.slow10Hz` / `runSlowSemanticTick()`
  - seed-only writes:
    - `D:\ATOMA_CLEAN\NodeLinkingSystem.js` — `createLink*()` init path
    - `D:\ATOMA_CLEAN\CascadeParticleSystem_Session120.js` — `_ensureCanonicalLinkDefaults()`
    - `D:\ATOMA_CLEAN\ResonanceRuptureVisualSystem_Session133.js` — `_ensureCanonicalLinkDefaults()`
- READERS:
  - `D:\ATOMA_CLEAN\CascadeParticleSystem_Session120.js` — `spawnCascadeParticles()`, `_spawnParticles()`
  - `D:\ATOMA_CLEAN\CascadeParticleColorTinting_Session119.js` — `update()`
  - `D:\ATOMA_CLEAN\CascadeParticleEmissionBoost_Session118.js` — `update()`
  - `D:\ATOMA_CLEAN\ParticleSemanticDensityAdapter_Session121.js` — adapter reads
  - `D:\ATOMA_CLEAN\ResonanceRuptureVisualSystem_Session133.js` — runtime reads
  - `D:\ATOMA_CLEAN\WaveParticleEmitter_v1.js` — `_resolveWaveSource()`, `_resolveLinkWaveField()`
- STATUS: `MULTIPLE WRITERS`

**`link.userData.flowState`**
- WRITERS:
  - `D:\ATOMA_CLEAN\CascadeEventBridge_v1.js` — `_handleNodeSynergyHigh()`, `_handleMetricCorruptionRise()`, `_handleLinkCollapsed()`, `_handleNodeHover()`, `_decayUpdate()`
    - scheduler: `visual.cascadeEventBridge` for `_decayUpdate()`
  - `D:\ATOMA_CLEAN\CascadeParticleSystem_Session120.js` — `_ensureCanonicalLinkDefaults()`
    - scheduler: `visual.cascadeParticleSystem`
  - `D:\ATOMA_CLEAN\NodeLinkingSystem.js` — `createLink*()` init path
  - `D:\ATOMA_CLEAN\LinkResonanceFlowIntegrationPatch_Session124.js` — init-only bridge that writes `flowState.energy`
    - not FrameScheduler-backed; by your rule this is a `DEAD WRITER` risk / seed-only writer
- READERS:
  - `D:\ATOMA_CLEAN\CascadeParticleSystem_Session120.js`
  - `D:\ATOMA_CLEAN\ParticleSemanticDensityAdapter_Session121.js`
  - `D:\ATOMA_CLEAN\WaveBurstRouter_v1.js`
  - `D:\ATOMA_CLEAN\WaveParticleEmitter_v1.js`
- STATUS: `MULTIPLE WRITERS`

**`node.userData.waveField`**
- WRITERS:
  - `D:\ATOMA_CLEAN\StandingWaveOscillationTrapSystem_Session130.js` — `update()`
    - scheduler: `simulation.waveStandingTraps`
  - `D:\ATOMA_CLEAN\CascadingHarmonicResonanceAmplification.js` — `update()`
    - scheduler: `simulation.harmonyCascade`
- READERS:
  - `D:\ATOMA_CLEAN\WaveParticleEmitter_v1.js` — `_processNodeWaveEvents()`
  - `D:\ATOMA_CLEAN\WaveShaderBridge_v1.js` — `_resolveWaveField()`
  - `D:\ATOMA_CLEAN\WaveTravelShaderPack_v1.js` — via shader bridge uniforms
- STATUS: `MULTIPLE WRITERS`

**`link.userData.waveField`**
- WRITERS:
  - `D:\ATOMA_CLEAN\LinkCascadeInfectionSystem.js` — `_writeFallbackWaveField()`
    - scheduler: `simulation.linkCascadeInfectionSystem`
- READERS:
  - `D:\ATOMA_CLEAN\WaveParticleEmitter_v1.js` — `_processLinkWaveEvents()`, `_resolveLinkWaveField()`
  - `D:\ATOMA_CLEAN\WaveShaderBridge_v1.js` — consumes wave snapshot fields downstream
- STATUS: `OK`

**`waveField.source`**
- WRITERS:
  - none found
- READERS:
  - `D:\ATOMA_CLEAN\WaveParticleEmitter_v1.js` — `_resolveWaveSource()`
- STATUS: `MISSING WRITER`
- EXTRA: `FALSE SAFE` because the reader infers cascade/source from other fields when `source` is absent.

**`waveField.sourceCount`**
- WRITERS:
  - `D:\ATOMA_CLEAN\CascadingHarmonicResonanceAmplification.js` — `update()`
- READERS:
  - `D:\ATOMA_CLEAN\WaveShaderBridge_v1.js`
  - `D:\ATOMA_CLEAN\WaveParticleEmitter_v1.js` indirectly through wave snapshots
- STATUS: `OK`

**`node.userData.metrics.synergy / harmony / stability / corruption / loadPressure`**
- WRITERS:
  - `D:\ATOMA_CLEAN\src\metrics\NodeMetricEngine.js` — `updateNodeMetrics()`, `applyMetricImpulse()`, `setMetric()`, `onNodeSpawn()`, `initNodeMetrics()`
    - scheduler: `simulation.metricsAggregator` via `MetricsRuntime_v1._step()`
  - `D:\ATOMA_CLEAN\MetricsRuntime_v1.js` — `_ensureNodeCanonicalFallbacks()` and `updateNodeMetrics()` orchestration
    - scheduler: `simulation.metricsAggregator`
  - `D:\ATOMA_CLEAN\AINodes.js` — post-spawn observer `metrics-and-init` calling `initNodeMetrics()` / `onNodeSpawn()`
  - `D:\ATOMA_CLEAN\SafeMetricsDNAIntegration1_0.js` — `attachMetrics()` at spawn
  - `D:\ATOMA_CLEAN\LinkCorruptionTransmission_v1.js` — `applyMetricImpulse()` path for corruption/harmony impacts
- READERS:
  - `D:\ATOMA_CLEAN\WaveBurstRouter_v1.js`
  - `D:\ATOMA_CLEAN\_AdaptiveGlyphRendering1_0.js`
  - `D:\ATOMA_CLEAN\_SemanticGlyphAI.js`
  - `D:\ATOMA_CLEAN\CascadingHarmonicResonanceAmplification.js`
  - `D:\ATOMA_CLEAN\WaveParticleEmitter_v1.js`
  - `D:\ATOMA_CLEAN\WaveShaderBridge_v1.js`
  - `D:\ATOMA_CLEAN\CorruptionVisualFX_v1.js`
  - `D:\ATOMA_CLEAN\CorruptionDrivenAuraDesaturationSystem.js`
  - `D:\ATOMA_CLEAN\CoreMetricsOverlay.js`
  - `D:\ATOMA_CLEAN\CoreMetricsHUD.js`
  - `D:\ATOMA_CLEAN\MultiStrandConduitShader.js`
- STATUS: `MULTIPLE WRITERS`

**`node.userData.metrics.activeLinkCount / fatigue / networkFatigue / hubId / clusterMembershipID`**
- WRITERS:
  - `D:\ATOMA_CLEAN\MetricsRuntime_v1.js` — `_canonicalWriteNetworkMetrics()`
    - scheduler: `simulation.metricsAggregator`
- READERS:
  - `D:\ATOMA_CLEAN\WaveParticleEmitter_v1.js` — `activeLinkCount`
  - `D:\ATOMA_CLEAN\CoreMetricsOverlay.js`
  - `D:\ATOMA_CLEAN\CoreMetricsHUD.js`
  - `D:\ATOMA_CLEAN\_AtomaUIUpdate3_0.js`
  - `D:\ATOMA_CLEAN\_AIEmotionalFeed3_1.js` and related metric readers
- STATUS: `OK`

**`metrics.load` / `metrics.loadRatio` / `metrics.networkLoad` aliases on node metrics**
- WRITERS:
  - none canonical on `node.userData.metrics`
- READERS:
  - `D:\ATOMA_CLEAN\WaveBurstRouter_v1.js`
  - `D:\ATOMA_CLEAN\MultiStrandConduitShader.js`
  - `D:\ATOMA_CLEAN\CoreMetricsOverlay.js`
  - `D:\ATOMA_CLEAN\CoreMetricsCalculator.js`
  - `D:\ATOMA_CLEAN\SemanticMetricAdapter.js`
- STATUS: `MISSING WRITER`
- EXTRA: `FALSE SAFE` because readers fall back to `loadPressure`, but the alias itself has no canonical live writer.

**`link.userData.metrics.corruption / integrity / corrupted / particleIntensity / particleUrgency / cascadeIntensity`**
- WRITERS:
  - `D:\ATOMA_CLEAN\MetricsRuntime_v1.js` — `_canonicalWriteLinkCorruptionMetrics()`
    - scheduler: `simulation.metricsAggregator`
  - `D:\ATOMA_CLEAN\LinkSemanticMetricsBridge_v1.js` — `update()`
    - scheduler: `semantic.slow10Hz`
- READERS:
  - `D:\ATOMA_CLEAN\CorruptionVisualFX_v1.js`
  - `D:\ATOMA_CLEAN\CorruptionDrivenAuraDesaturationSystem.js`
  - `D:\ATOMA_CLEAN\CascadeParticleEmissionBoost_Session118.js`
  - `D:\ATOMA_CLEAN\CascadeParticleColorTinting_Session119.js`
  - `D:\ATOMA_CLEAN\ParticleSemanticDensityAdapter_Session121.js`
  - `D:\ATOMA_CLEAN\WaveParticleEmitter_v1.js`
  - `D:\ATOMA_CLEAN\ResonanceRuptureVisualSystem_Session133.js`
- STATUS: `MULTIPLE WRITERS`

**Short conclusion**
- The main remaining `MISSING WRITER`/`FALSE SAFE` gap I found is `waveField.source` and the legacy `metrics.load` / `metrics.loadRatio` aliases.
- The important runtime VFX fields themselves (`cascadeIntensity`, `flowState`, `node.waveField`, canonical `metrics.*`) are written, but some of them are multiply-authored and some init-only seed writers are not frame-scheduled.

If chceš, ďalší krok spravím ako presný export:
1. `CSV/JSON` matrix `FIELD | WRITERS | READERS | STATUS`
2. alebo už iba zoznam `MISSING WRITER` a `DEAD WRITER` položiek na prioritnú opravu.