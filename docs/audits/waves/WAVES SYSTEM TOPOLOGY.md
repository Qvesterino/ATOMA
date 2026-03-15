**WAVE GENERATORS**
- `WaveInterferenceEngine_v1` ([D:\ATOMA_CLEAN\WaveInterferenceEngine_v1.js](D:\ATOMA_CLEAN\WaveInterferenceEngine_v1.js)): hlavný generátor wave burst snapshotov (`requestBurstIntent`).
- `WaveBurstRouter_v1` ([D:\ATOMA_CLEAN\WaveBurstRouter_v1.js](D:\ATOMA_CLEAN\WaveBurstRouter_v1.js)): event-driven trigger vrstva; mapuje SemanticBus eventy na burst intenty.
- `StandingWaveOscillationTrapSystem_Session130` ([D:\ATOMA_CLEAN\StandingWaveOscillationTrapSystem_Session130.js](D:\ATOMA_CLEAN\StandingWaveOscillationTrapSystem_Session130.js)): generuje standing-wave trap stavy z reflection/influence podmienok.
- `LinkPulseWaveInjector` cez `LinkDirectionalStreaks` ([D:\ATOMA_CLEAN\LinkPulseWaveInjector.js](D:\ATOMA_CLEAN\LinkPulseWaveInjector.js), [D:\ATOMA_CLEAN\LinkDirectionalStreaks.js](D:\ATOMA_CLEAN\LinkDirectionalStreaks.js)): generuje pulse-wave efekty na linkoch v conduit vetve.

**WAVE PROPAGATION**
- `CascadingHarmonicResonanceAmplification` ([D:\ATOMA_CLEAN\CascadingHarmonicResonanceAmplification.js](D:\ATOMA_CLEAN\CascadingHarmonicResonanceAmplification.js)): BFS propagation (`_propagateCascadeFromHub`), exportuje `node.userData.cascadeStrength/Amplitude/Phase`.
- `HarmonicInfluencePropagationSystem_Session127` ([D:\ATOMA_CLEAN\HarmonicInfluencePropagationSystem_Session127.js](D:\ATOMA_CLEAN\HarmonicInfluencePropagationSystem_Session127.js)): hub pulse propagation cez nodes/links.
- `LinkResonanceFlowSystem_Session124` ([D:\ATOMA_CLEAN\LinkResonanceFlowSystem_Session124.js](D:\ATOMA_CLEAN\LinkResonanceFlowSystem_Session124.js)): directional resonance flow po linkoch.
- `PHASE5_CascadeVisualizationBridge` + `PHASE5_CascadePropagationVisuals` ([D:\ATOMA_CLEAN\PHASE5_CascadeVisualizationBridge_v1.js](D:\ATOMA_CLEAN\PHASE5_CascadeVisualizationBridge_v1.js), [D:\ATOMA_CLEAN\PHASE5_CascadePropagationVisuals_v1.js](D:\ATOMA_CLEAN\PHASE5_CascadePropagationVisuals_v1.js)): event->cascade ring propagation pre vizuál.
- `ParticleStreamCascadeAcceleration` + `ParticleCascadeFlowDeflection` ([D:\ATOMA_CLEAN\ParticleStreamCascadeAcceleration.js](D:\ATOMA_CLEAN\ParticleStreamCascadeAcceleration.js), [D:\ATOMA_CLEAN\ParticleCascadeFlowDeflection.js](D:\ATOMA_CLEAN\ParticleCascadeFlowDeflection.js)): propagácia cascade v particle dynamike.

**RESONANCE SYSTEMS**
- `HarmonicResonanceCoupling_v1` ([D:\ATOMA_CLEAN\HarmonicResonanceCoupling_v1.js](D:\ATOMA_CLEAN\HarmonicResonanceCoupling_v1.js))
- `HarmonicHubAuraSystem_Session126` ([D:\ATOMA_CLEAN\HarmonicHubAuraSystem_Session126.js](D:\ATOMA_CLEAN\HarmonicHubAuraSystem_Session126.js))
- `HarmonicPhaseSynchronization_Session146` ([D:\ATOMA_CLEAN\HarmonicPhaseSynchronization_Session146.js](D:\ATOMA_CLEAN\HarmonicPhaseSynchronization_Session146.js))
- `HarmonicNodeResonanceHalos` ([D:\ATOMA_CLEAN\HarmonicNodeResonanceHalos.js](D:\ATOMA_CLEAN\HarmonicNodeResonanceHalos.js))
- `HarmonicResonanceFeedbackSystem` + `ResonanceFeedback_v1` + `ResonanceEchoTrailSystem` ([D:\ATOMA_CLEAN\HarmonicResonanceFeedbackSystem.js](D:\ATOMA_CLEAN\HarmonicResonanceFeedbackSystem.js), [D:\ATOMA_CLEAN\ResonanceFeedback_v1.js](D:\ATOMA_CLEAN\ResonanceFeedback_v1.js), [D:\ATOMA_CLEAN\ResonanceEchoTrailSystem.js](D:\ATOMA_CLEAN\ResonanceEchoTrailSystem.js))
- `HarmonicCascadeAmplification_Session145` je inicializovaný ako skeleton, ale update vetva je v runtime vypnutá (`enabled: false`) ([D:\ATOMA_CLEAN\HarmonicCascadeAmplification_Session145.js](D:\ATOMA_CLEAN\HarmonicCascadeAmplification_Session145.js)).

**VISUAL SYSTEMS**
- Shader vrstva: `WaveShaderBridge_v1` (aktívna uniform/shader injection), `WaveTravelShaderPack_v1`, `WaveDynamicsShaderPack_v1` ([D:\ATOMA_CLEAN\WaveShaderBridge_v1.js](D:\ATOMA_CLEAN\WaveShaderBridge_v1.js), [D:\ATOMA_CLEAN\WaveTravelShaderPack_v1.js](D:\ATOMA_CLEAN\WaveTravelShaderPack_v1.js), [D:\ATOMA_CLEAN\WaveDynamicsShaderPack_v1.js](D:\ATOMA_CLEAN\WaveDynamicsShaderPack_v1.js)).
- Particle/FX vrstva: `WaveParticleEmitter_v1`, `CascadeParticleSystem_Session120`, `CascadeParticleEmissionBoost_Session118`, `CascadeParticleColorTinting_Session119` ([D:\ATOMA_CLEAN\WaveParticleEmitter_v1.js](D:\ATOMA_CLEAN\WaveParticleEmitter_v1.js), [D:\ATOMA_CLEAN\CascadeParticleSystem_Session120.js](D:\ATOMA_CLEAN\CascadeParticleSystem_Session120.js)).
- Interference/rupture/recovery vizuály: `WaveInterferencePatternSystem_Session132`, `StandingWaveVisualRenderer_Session131`, `ResonanceRuptureVisualSystem_Session133`, `HarmonicRecoveryVisualSystem_Session138` ([D:\ATOMA_CLEAN\WaveInterferencePatternSystem_Session132.js](D:\ATOMA_CLEAN\WaveInterferencePatternSystem_Session132.js), [D:\ATOMA_CLEAN\StandingWaveVisualRenderer_Session131.js](D:\ATOMA_CLEAN\StandingWaveVisualRenderer_Session131.js)).
- Cascade vizuály: `PreCascadeVisualHint_Session146`, `CascadeResonanceWaveVisualization_Session146`, `ResonanceCascadeVisualization_Session117B`, `PHASE5_CascadePropagationVisuals_v1` ([D:\ATOMA_CLEAN\PreCascadeVisualHint_Session146.js](D:\ATOMA_CLEAN\PreCascadeVisualHint_Session146.js)).

**ORPHAN SYSTEMS**
- Jasne dormant/integration-only (bez runtime wiring v `main.js`):  
  `HarmonicHubAuraIntegrationPatch_Session126`, `HarmonicInfluencePropagationIntegrationPatch_Session127`, `LinkResonanceFlowIntegrationPatch_Session124`, `HubInfluencePropagation` ([D:\ATOMA_CLEAN\HarmonicHubAuraIntegrationPatch_Session126.js](D:\ATOMA_CLEAN\HarmonicHubAuraIntegrationPatch_Session126.js), [D:\ATOMA_CLEAN\HubInfluencePropagation.js](D:\ATOMA_CLEAN\HubInfluencePropagation.js)).
- Čiastočne wired, ale prakticky dormant vetva:  
  `NodeInterferenceManager` + `NodeSynergyInterferenceController` sú vytvorené v `LinkRendererConduit`, ale `updateNodeInterference()` sa nikde nevolá ([D:\ATOMA_CLEAN\NodeInterferenceManager.js](D:\ATOMA_CLEAN\NodeInterferenceManager.js), [D:\ATOMA_CLEAN\LinkRendererConduit.js](D:\ATOMA_CLEAN\LinkRendererConduit.js)).
- Redundant v aktívnom wave shader stacku:  
  `WaveShaderMaterialPatch_v1` duplikuje shader injection, ktorú už robí `WaveShaderBridge_v1` ([D:\ATOMA_CLEAN\WaveShaderMaterialPatch_v1.js](D:\ATOMA_CLEAN\WaveShaderMaterialPatch_v1.js)).

**Dependency Chain (runtime)**
1. `SemanticBus events` -> `WaveBurstRouter_v1` -> `WaveInterferenceEngine_v1`  
2. `WaveInterferenceEngine_v1.getNode/LinkWaveField()` -> `WaveShaderBridge_v1` + `WaveParticleEmitter_v1` + `PulseWaveSystemBridge_v1`  
3. `HarmonicHubAuraSystem` -> `HarmonicInfluencePropagation` -> `StandingWaveTrap` -> `WaveInterferencePattern` -> `ResonanceRupture` -> `HarmonicRecovery`  
4. `CascadingHarmonicResonanceAmplification` -> `node.userData.cascade*` -> particle/cascade viz systémy (`ParticleStreamCascadeAcceleration`, `ParticleCascadeFlowDeflection`, `CascadeParticle*`, `PHASE5_Cascade*`)

Audit bol read-only, bez úprav kódu.