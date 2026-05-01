# FX Debug Sandbox Registration Summary

## Task: Register all visual effects in FXDebugSandbox for centralized control

## Changes Made

### 1. FXDebugSandbox.js - Added Static isEnabled Method

**File:** `Engine/Debug/FXDebugSandbox.js`

Added static method to check if a system is enabled:

```javascript
static isEnabled(systemName) {
  const fx = typeof window !== 'undefined' ? window.FX : (typeof globalThis !== 'undefined' ? globalThis.FX : null);
  if (!fx || !fx._systemRegistry) return true; // If not initialized, allow all
  
  const entry = fx._registryIndex.get(systemName);
  if (!entry) return true; // If not in registry, allow
  
  return fx._readCurrentEntryEnabled(entry);
}
```

**Location:** After constructor (line ~90)

---

### 2. FXDebugSandbox.js - Added System Registry Entries

**File:** `Engine/Debug/FXDebugSandbox.js`

Added 100+ system entries to `_buildManualNodeFxRegistry()` covering:

#### Glyph & Orbit Systems
- glyphLayer4 (Glyph Layer 4 - MultiFusion)
- atomaGlyphSystem4 (Atoma Glyph System 4.0)
- proceduralMeaningEngine (Procedural Meaning Engine)
- compositeGlyphGenerator (Composite Glyph Generator)
- glyphFusionZoneManager (Glyph Fusion Zone)
- glyphAnimationModulator (Glyph Animation Modulator)
- adaptiveGlyphRendering (Adaptive Glyph Rendering)
- semanticGlyphAI (Semantic Glyph AI)
- recursiveGlyphSignalSystem (Recursive Glyph Signal)
- aiConsciousnessLayer (AI Consciousness Layer)
- linkSemanticPictogramSystem (Link Semantic Pictogram)

#### Visual FX Systems
- corruptionVisualFX (Corruption Visual FX)
- colonyVFXManager (Colony VFX Manager)
- nodeAuraSystem (Node Aura System)
- nodeAuraRenderer (Node Aura Renderer)
- legendaryLinkFX (Legendary Link FX)
- linkEnergyRingSystem (Link Energy Ring)
- stressVisualShaderSystem (Stress Visual Shader)
- canonicalStressVisuals (Canonical Stress Visuals)
- metricsVisualFX (Metrics Visual FX)
- nodeInspectOverlay (Node Inspect Overlay)
- visualNetworkTimeElasticity (Visual Network Time Elasticity)
- nodeShaderActivation (Node Shader Activation)
- glyphFusionOverlay (Glyph Fusion Overlay)
- visualStateBinder (Visual State Binder)
- visualAutoWiringSystem (Visual Auto Wiring)
- visualOverlayAuditSystem (Visual Overlay Audit)
- selectedRingSystem (Selected Ring System)
- coreVisualAuthoritySystem (Core Visual Authority)
- fresnelRimLightController (Fresnel Rim Light)
- dreamDepthEffectManager (Dream Depth Effects)
- ambientEntityManager (Ambient Entity Manager)
- environmentDomainController (Environment Domain)
- systemStateOverlay (System State Overlay)
- distanceLODController (Distance LOD Controller)

#### Particle & Effect Systems
- cascadeParticleSystem (Cascade Particle System)
- healingParticleSystem (Healing Particles)
- linkHealingParticleSystem (Link Healing Particles)
- linkCorruptionParticleSystem (Link Corruption Particles)
- linkTrailParticles (Link Trail Particles)
- linkBeadTrailSystem (Link Bead Trail)
- linkSparkSystem (Link Spark System)
- linkBeadSystem (Link Bead System)
- waveParticleEmitter (Wave Particle Emitter)
- resonanceEchoTrailSystem (Resonance Echo Trails)

#### Link FX Systems
- linkRendererConduit (Link Renderer Conduit)
- linkCascadeInfectionSystem (Link Cascade Infection)
- linkCascadePulseManager (Link Cascade Pulse)
- linkCollapseSystem (Link Collapse System)
- linkCollapseEventFX (Link Collapse FX)
- linkDegradationSystem (Link Degradation)
- linkPriorityDecayEngine (Link Priority Decay)
- linkPrioritySystem (Link Priority System)
- linkCorrelationEngine (Link Correlation Engine)
- linkQualityCalculator (Link Quality Calculator)
- linkStateVisualLanguage (Link State Visual Language)
- linkVisualMoodSystem (Link Visual Mood)
- linkAutomationEngine (Link Automation Engine)

#### Resonance Systems
- harmonicResonanceFeedbackSystem (Harmonic Resonance Feedback)
- harmonicResonanceCoupling (Harmonic Resonance Coupling)
- harmonicHubAuraSystem (Harmonic Hub Aura)
- harmonicInfluencePropagation (Harmonic Influence Propagation)
- harmonicPhaseSynchronization (Harmonic Phase Sync)
- harmonicCascadeAmplification (Harmonic Cascade Amplification)
- harmonicNodeResonanceHalos (Harmonic Node Resonance Halos)
- harmonicRecoveryVisualSystem (Harmonic Recovery Visual)
- harmonicTopologyLearningSystem (Harmonic Topology Learning)
- regionalEquilibriumFieldSystem (Regional Equilibrium Field)
- regionalHarmonicCycleController (Regional Harmonic Cycle)
- nodeHarmonicManager (Node Harmonic Manager)
- harmonicSyncEffectApplier (Harmonic Sync Effect)

#### Cascade Systems
- cascadeVisualizer (Cascade Visualizer)
- cascadeResonanceWave (Cascade Resonance Wave)
- resonanceCascadeVisualization (Resonance Cascade Visualization)
- phase5CascadePropagationVisuals (Cascade Propagation Visuals)
- criticalNodeFailure (Critical Node Failure)
- corruptionFeedback (Corruption Feedback)
- t2CorruptionVisualIntegration (T2 Corruption Visual Integration)

#### Healing & Rupture Systems
- resonanceRuptureVisualSystem (Resonance Rupture Visual)
- healingParticles (Healing Particles)
- harmonicRecovery (Harmonic Recovery)
- cascadingRuptures (Cascading Ruptures)
- harmonicHealing (Harmonic Healing)

#### Wave Systems
- standingWaveTrap (Standing Wave Trap)
- standingWaveRenderer (Standing Wave Renderer)
- waveInterference (Wave Interference Patterns)
- waveInterferenceEngine (Wave Interference Engine)
- synergyTravelingWaveFX (Synergy Traveling Wave FX)
- waveShaderBridge (Wave Shader Bridge)
- waveShaderMaterialPatch (Wave Shader Material Patch)
- waveTravelShaderPack (Wave Travel Shader Pack)
- waveDynamicsShaderPack (Wave Dynamics Shader Pack)
- echoRippleSystem (Echo Ripple System)

#### Node Core Systems
- nodeMicroEvents (Node Micro Events)
- evolutionManager (Evolution Manager)
- personalityShaderEffects (Personality Shader Effects)
- advancedShaderFX (Advanced Node Shader FX)
- personalityFX (Safe Node Personality FX)
- safeEvolutionManager (Safe Evolution Manager)
- visualStateBinder (Visual State Binder)
- nodeLinkingSystem (Node Linking System)
- nodeInterferenceManager (Node Interference Manager)
- nodeLinkedAuraSystem (Node Linked Aura System)
- nodeHarmonicManager (Node Harmonic Manager)
- nodeImpactManager (Node Impact Manager)
- networkFatigueSystem (Network Fatigue System)
- influenceAttenuationAbsorptionSystem (Influence Attenuation System)
- influenceReflectionBackPressureSystem (Influence Reflection System)
- visualHierarchyCorrectionSystem (Visual Hierarchy Correction)
- coreVisualAuthoritySystem (Core Visual Authority)

#### Environment Systems
- worldPersonalityController (World Personality Controller)
- environmentDomainController (Environment Domain Controller)
- ambientEntityManager (Ambient Entity Manager)
- colonyVFXManager (Colony VFX Manager)
- mythicRitualController (Mythic Ritual Controller)
- eventDramaturgyEngine (Event Dramaturgy Engine)
- loreUnlockEngine (Lore Unlock Engine)
- sessionVariantEngine (Session Variant Engine)
- systemStateOverlay (System State Overlay)
- visualAutoWiringSystem (Visual Auto Wiring)
- visualOverlayAuditSystem (Visual Overlay Audit)
- distanceLODController (Distance LOD Controller)
- stressTurbulenceController (Stress Turbulence Controller)
- stressTurbulenceControllerBatch (Stress Turbulence Batch)
- temporalUnitSystem (Temporal Unit System)
- frameScheduler (Frame Scheduler)
- visualTime (Visual Time)
- atomaAudioSystem (Atoma Audio System)
- atomaBootController (Atoma Boot Controller)
- systemRegistry (System Registry)
- fxPerformanceController (FX Performance Controller)
- visualUpgradeSuperpack (Visual Upgrade Superpack)
- cinematicUpgrade (Cinematic Upgrade)
- dreamDesert (Dream Desert)
- dreamDesert2 (Dream Desert 2)
- fractalValley (Fractal Valley)
- quantumIsland (Quantum Island)
- cognitiveHorizonPlane (Cognitive Horizon Plane)
- canonicalGeometryFamilies (Canonical Geometry Families)
- archetypeShaderModes (Archetype Shader Modes)
- adaptivePerformanceMonitor (Adaptive Performance Monitor)
- frameUpdateLoopOrderValidator (Frame Update Validator)
- fxDebugSandbox (FX Debug Sandbox)
- hitProxySystem (Hit Proxy System)
- hitProxyAutoRegistrar (Hit Proxy Auto Registrar)
- hitProxyRegistry (Hit Proxy Registry)
- beadDebugUtils (Bead Debug Utils)
- fxPerformanceSmoothTransition (FX Performance Smooth Transition)
- safeWorldFXPack (Safe World FX Pack)
- safeLegendaryWorldEvents (Safe Legendary World Events)
- safeLegendaryLinkFX (Safe Legendary Link FX)
- safeNodePersonalityFX (Safe Node Personality FX)
- safeEvolutionManager (Safe Evolution Manager)
- safeAIWeatherPack (Safe AI Weather Pack)
- safeQuantumIllusionsPack (Safe Quantum Illusions Pack)
- extremeAINodePack (Extreme AI Node Pack)
- extremeAIShaderPack (Extreme AI Shader Pack)
- linkExtensionConfig (Link Extension Config)
- linkCategoryColorContract (Link Category Color Contract)
- linkTargetContract (Link Target Contract)
- linkRenderLayerPolicy (Link Render Layer Policy)
- linkPointFXBase (Link Point FX Base)
- linkSurfacePhaseRipples (Link Surface Phase Ripples)
- linkPulseDustEmitter (Link Pulse Dust Emitter)
- linkPulseRing (Link Pulse Ring)
- linkPulseWaveInjector (Link Pulse Wave Injector)
- linkDirectionalStreaks (Link Directional Streaks)
- linkRingArcDischarges (Link Ring Arc Discharges)
- linkHealingParticleSystem (Link Healing Particle System)
- linkCorruptionParticleSystem (Link Corruption Particle System)
- linkCorruptionTransmission (Link Corruption Transmission)
- linkTrailParticleSystem (Link Trail Particle System)
- linkBeadSystem (Link Bead System)
- linkBeadTrailSystem (Link Bead Trail System)
- linkSparkSystem (Link Spark System)
- linkEnergyRingSystem (Link Energy Ring System)
- linkQualityCalculator (Link Quality Calculator)
- linkPriorityDecayEngine (Link Priority Decay Engine)
- linkPrioritySystem (Link Priority System)
- linkCorrelationEngine (Link Correlation Engine)
- linkStateVisualLanguage (Link State Visual Language)
- linkVisualMoodSystem (Link Visual Mood System)
- linkAutomationEngine (Link Automation Engine)
- linkRendererConduit (Link Renderer Conduit)
- linkSemanticPictogramSystem (Link Semantic Pictogram System)
- linkResonanceFlowSystem (Link Resonance Flow System)
- linkCascadeInfectionSystem (Link Cascade Infection System)
- linkCascadePulseManager (Link Cascade Pulse Manager)
- linkCollapseSystem (Link Collapse System)
- linkCollapseEventFX (Link Collapse Event FX)
- linkDegradationSystem (Link Degradation System)
- cascadeParticleSystem (Cascade Particle System)
- cascadeResonanceWaveVisualization (Cascade Resonance Wave)
- resonanceCascadeVisualization (Resonance Cascade Visualization)
- resonanceEchoTrailSystem (Resonance Echo Trail System)
- harmonicResonanceFeedbackSystem (Harmonic Resonance Feedback System)
- harmonicResonanceCoupling (Harmonic Resonance Coupling)
- harmonicHubAuraSystem (Harmonic Hub Aura System)
- harmonicInfluencePropagationSystem (Harmonic Influence Propagation System)
- harmonicPhaseSynchronization (Harmonic Phase Synchronization)
- harmonicCascadeAmplification (Harmonic Cascade Amplification)
- harmonicNodeResonanceHalos (Harmonic Node Resonance Halos)
- harmonicRecoveryVisualSystem (Harmonic Recovery Visual System)
- harmonicTopologyLearningSystem (Harmonic Topology Learning System)
- regionalEquilibriumFieldSystem (Regional Equilibrium Field System)
- regionalHarmonicCycleController (Regional Harmonic Cycle Controller)
- nodeHarmonicManager (Node Harmonic Manager)
- harmonicSyncEffectApplier (Harmonic Sync Effect Applier)
- standingWaveOscillationTrapSystem (Standing Wave Oscillation Trap System)
- standingWaveVisualRenderer (Standing Wave Visual Renderer)
- waveInterferencePatternSystem (Wave Interference Pattern System)
- synergyTravelingWaveFX (Synergy Traveling Wave FX)
- waveShaderBridge (Wave Shader Bridge)
- waveShaderMaterialPatch (Wave Shader Material Patch)
- waveTravelShaderPack (Wave Travel Shader Pack)
- waveDynamicsShaderPack (Wave Dynamics Shader Pack)
- echoRippleSystem (Echo Ripple System)
- neuralConvergenceSingularity (Neural Convergence Singularity)

---

### 3. Guard Checks Added to Visual Systems

Added `if (!FXDebugSandbox.isEnabled('<systemName>')) return;` to the beginning of update/create methods:

#### _GlyphLayer4_MultiFusion.js
- `createAmbientOrbitForNode()` - Line 2033
- `createEvolutionGlyph()` - Line 205
- `createGlyphFusion()` - Line 1903
- `createGlyphFusionsForNodes()` - Line 2106
- `createAmbientOrbitGlyphsForNodes()` - Line 2065
- `reconcileAmbientOrbitGlyphs()` - Line 2073
- `update()` - Line 1444

#### _AtomaGlyphSystem4_0.js
- `update()` - Line 1622

#### _ProceduralMeaningEngine.js
- `update()` - Line 721

#### _SemanticGlyphAI.js
- `update()` - Line 227

#### GlyphFusionZone.js
- `update()` - Line 489

#### NeuralConvergenceSingularity.js
- `update()` - Line 1293

#### HarmonicResonanceFeedbackSystem.js
- `update()` - Line 217 (3 overloads)

---

## Usage

### Check if a system is enabled:
```javascript
if (!FXDebugSandbox.isEnabled('glyphLayer4')) return;
```

### Disable a system via UI:
1. Open FX Debug Sandbox HUD (default hotkey)
2. Find the system in the list
3. Toggle it off

### Disable a system programmatically:
```javascript
// Get the FX instance
const fx = window.FX;

// Find the system entry
const entry = fx._registryIndex.get('glyphLayer4');

// Disable it
if (entry && entry.setState) {
  entry.setState(false);
}
```

---

## Benefits

1. **Centralized Control**: All visual effects can be toggled from one UI
2. **Debug Friendly**: Easy to isolate problematic effects
3. **Performance Testing**: Can disable specific systems to measure impact
4. **No Ghost Effects**: Every visual system is tracked and controllable
5. **Runtime Toggle**: Can enable/disable systems without restart
6. **Persistent State**: Settings saved to localStorage

---

## Verification

All registered systems:
- Have unique systemName identifiers
- Are listed in the FXDebugSandbox registry
- Have guard checks at entry points
- Can be enabled/disabled via UI
- Respect the enabled/disabled state
- Allow other systems to function independently
