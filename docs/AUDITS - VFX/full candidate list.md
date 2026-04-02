Read-only audit performed. Below is the condensed VFX scan.

---

## 1) Full candidate list (code files)
Key VFX-looking modules by name (grouped):
- **Link-level:** LinkEnergyWave.js; LinkRingArcDischarges.js; LinkSparkSystem.js; LinkTrailParticleSystem.js; LinkHealingParticleSystem.js; LinkCorruptionParticleSystem.js; LinkBeadSystem.js; LinkBeadTrailSystem.js; LinkBeadVisualEffects.js; LinkSurfacePhaseRipples.js; LinkPulseRing.js; LinkPulseWaveInjector.js; LinkPulsePhaseSync.js; LinkCascadePulseManager.js; LinkResonanceFlowSystem_Session124.js; LinkResonanceFlowIntegrationPatch_Session124.js; LinkAuraSystem_v1.js; LinkEnergyRingSystem.js; LinkMicroImpulseAdapter_v1.js (`LEGACY/LinkMicroImpulseAdapter.js`); LinkPulseWaveInjector.js; LinkPulsePhaseSync.js; LinkCascadePulseManager.js.
- **Node/World auras & interference:** NodeLinkedAuraSystem.js; NodeLinkedAuraRenderer_Session146.js; NodeAuraSystem_v1.js; NodeAuraRefactor_ElegantRim.js; NodeCorruptionAuraDegradation.js; NodeAuraParticleImpactBridge.js; NodeInterferenceManager.js; NodeSynergyInterferenceController.js; MythicAuraIntegration_v1.js; HarmonyAuraShaderMaterial.js; HarmonicHubAuraSystem_Session126.js; HarmonicNodeResonanceHalos.js; HarmonicHubAuraIntegrationPatch_Session126.js.
- **Resonance / wave / cascade:** HarmonicResonanceFeedbackSystem.js; CompositeGlyphResonanceFeedback.js; ResonanceFeedback_v1.js; ResonanceEchoTrailSystem.js; ResonanceRuptureVisualSystem_Session133.js; ResonanceCascadeVisualization_Session117B.js; StandingWaveVisualRenderer_Session131.js; StandingWaveOscillationTrapSystem_Session130.js; WaveInterferenceEngine_v1.js; WaveInterferencePatternSystem_Session132.js; WaveParticleEmitter_v1.js; WaveShaderBridge_v1.js; WaveShaderMaterialPatch_v1.js; WaveTravelShaderPack_v1.js; WaveDynamicsShaderPack_v1.js; SynergyTravelingWaveFX_v1.js.
- **Particle / trail / cascade:** CascadeParticleSystem_Session120.js; CascadeParticleEmissionBoost_Session118.js; CascadeParticleColorTinting_Session119.js; ParticleStreamCascadeAcceleration.js (+Integration/Patch/Setup variants); ParticleTrailSystem_Session122.js (+IntegrationPatch); ParticleSemanticDensityAdapter_Session121.js; ParticleCascadeFlowDeflection.js; HealingParticleSystem_Session136.js; PulseBoundaryInteractionAdapter_v1.js; PulseIntersectionImpulseAdapter_v1.js; PulseWaveSystemBridge_v1.js; PreCascadeVisualHint_Session146.js; PHASE5_CascadePropagationVisuals_v1.js; PHASE5_CascadeVisualizationBridge_v1.js.
- **Shader/utility:** FresnelRimLightAuraShader.js; RiftEnergyShader.js; NeonPulseShader.js; LinkAuraShader.js; LinkAuraSystem_v1.js (shader bundle); SynergyResonanceShaderPack_v1.js; SynergyPulseVisuals_v1.js; SynergyCascadeFXBridge_v1.js; SynergyCascadeVisualizer.js.

---

## 2) Table (representative systems)

| File | System Name | Category | Uses THREE objs | Update loop | Scene mutation | Instantiated in runtime | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| LinkEnergyWave.js | LinkEnergyWave | wave/material mod | meshes/materials | yes (`update`) | no (modulates emissive) | via LinkRendererConduit | ACTIVE |
| LinkRingArcDischarges.js | LinkRingArcDischarges | arc/discharge particles | group/line meshes | yes (`update`) | scene/group add | via LinkRendererConduit | ACTIVE |
| LinkSparkSystem.js | LinkSparkSystem | particle system | Points/BufferGeo | yes | scene add | via LinkRendererConduit | ACTIVE |
| LinkTrailParticleSystem.js | LinkTrailParticleSystem | trail particles | Points | yes | scene add | via LinkRendererConduit | ACTIVE |
| LinkHealingParticleSystem.js | LinkHealingParticleSystem | particle healer | Points | yes | scene add | via LinkRendererConduit | ACTIVE |
| LinkCorruptionParticleSystem.js | LinkCorruptionParticleSystem | corruption particles | meshes/points | yes | scene add | via LinkRendererConduit | ACTIVE |
| LinkSurfacePhaseRipples.js | LinkSurfacePhaseRipples | ripple shader | likely mesh/ShaderMat | yes | scene add | no refs found | ORPHAN |
| LinkPulseWaveInjector.js | LinkPulseWaveInjector | pulse utility | unknown | likely | unknown | no refs found | ORPHAN |
| LinkPulsePhaseSync.js | LinkPulsePhaseSync | pulse sync util | no | maybe | no | no refs found | ORPHAN |
| LinkCascadePulseManager.js | LinkCascadePulseManager | pulse manager | maybe | yes | maybe | no refs found | ORPHAN |
| NodeLinkedAuraSystem.js | NodeLinkedAuraSystem | node aura | groups/meshes | yes | scene add | main.js | ACTIVE |
| NodeInterferenceManager.js | NodeInterferenceManager | interference adapter | materials | yes | no | main.js (semantic/linking) | ACTIVE |
| NodeAuraSystem_v1.js | NodeAuraSystem | aura visuals | meshes/materials | yes | scene add | main.js | ACTIVE |
| HarmonicResonanceFeedbackSystem.js | HarmonicResonanceFeedbackSystem | resonance field | Vector3, groups | yes | no scene add by default | main.js | ACTIVE |
| CompositeGlyphResonanceFeedback.js | CompositeGlyphResonanceFeedback | resonance/coherence | groups/meshes | yes | scene add (debug) | no runtime import found | ORPHAN/UTILITY |
| ResonanceEchoTrailSystem.js | ResonanceEchoTrailSystem | resonance trails | lines/points | yes | scene add | main.js | ACTIVE |
| ResonanceRuptureVisualSystem_Session133.js | ResonanceRuptureVisualSystem | rupture visual | meshes | yes | scene add | main.js | ACTIVE |
| StandingWaveVisualRenderer_Session131.js | StandingWaveVisualRenderer | standing wave renderer | meshes/lines | yes | scene add | main.js | ACTIVE |
| StandingWaveOscillationTrapSystem_Session130.js | StandingWaveOscillationTrapSystem | standing wave trap | meshes | yes | scene add/remove | main.js | ACTIVE |
| WaveInterferenceEngine_v1.js | WaveInterferenceEngine | interference engine | buffers/meshes | yes | scene add | main.js | ACTIVE |
| WaveParticleEmitter_v1.js | WaveParticleEmitter | particle emitter | Points | yes | scene add | main.js | ACTIVE |
| SynergyTravelingWaveFX_v1.js | SynergyTravelingWaveFX | wave fx | materials | yes | maybe | no refs found | ORPHAN |
| NodeCorruptionAuraDegradation.js | NodeCorruptionAuraDegradation | aura decay | materials | yes | no | no refs found | ORPHAN |
| NodeAuraParticleImpactBridge.js | NodeAuraParticleImpactBridge | impact particle bridge | particles | yes | scene add | no refs found | ORPHAN |

---

## 3) Orphan / low-visibility VFX systems (no instantiation found in main.js or LinkRendererConduit)
- LinkSurfacePhaseRipples.js  
- LinkPulseWaveInjector.js  
- LinkPulsePhaseSync.js  
- LinkCascadePulseManager.js  
- SynergyTravelingWaveFX_v1.js  
- NodeCorruptionAuraDegradation.js  
- NodeAuraRefactor_ElegantRim.js  
- NodeAuraParticleImpactBridge.js  
- CompositeGlyphResonanceFeedback.js (no import spotted; utility resonance)  

---

## 4) Recommended VFXRuntimeLoader adapter candidates (compute/visual, low risk to core link geom)
- **LinkSurfacePhaseRipples.js** – ripple shader on link surfaces; currently orphan; encapsulate per-link group inside `vfxRoot`.  
- **LinkPulseWaveInjector.js / LinkPulsePhaseSync.js / LinkCascadePulseManager.js** – pulse utilities; likely pure update without scene ownership; safe to sandbox.  
- **SynergyTravelingWaveFX_v1.js** – wave modulation pack; not referenced; could be toggled for harmonic experiments.  
- **NodeAuraRefactor_ElegantRim.js / NodeAuraParticleImpactBridge.js / NodeCorruptionAuraDegradation.js** – node-level aura variants; compute/material focus; good for sandbox.  
- **CompositeGlyphResonanceFeedback.js** – resonance coherence helper; compute-heavy, minimal scene writes; adapter could expose apply/visualize toggles.  

Notes:
- Active link systems (EnergyWave, ArcDischarges, Sparks, Trails, Healing, Corruption) are already driven by `LinkRendererConduit`; loader adapters should skip if conduit state already owns them.
- All ACTIVE systems mutate scene via `scene.add` or group parenting; loader wrappers must attach to `vfxRoot` to avoid direct scene writes.
- Shader-only materials (HarmonyAuraShaderMaterial, Fresnel*, RiftEnergyShader, NeonPulseShader) are utility providers; adapters can expose material factories without ticking.

If you want deeper pattern stats (scene.add/material mutations per file), I can run targeted greps on specific modules.
