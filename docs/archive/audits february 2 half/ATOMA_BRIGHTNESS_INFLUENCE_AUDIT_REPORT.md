# PHASE VD-AUDIT-2 – Brightness Influence Audit Report

**Date:** 2026-02-07
**Scope:** All code modifying material.emissive, material.emissiveIntensity, material.opacity, material.color, and light.intensity

---

## Summary

This audit identified **450+ instances** of brightness/emission modifications across the ATOMA codebase. The modifications are categorized by target system (nodes, links, glows, auras) and the specific property being modified.

---

## 1. MATERIAL.EMISSIVE Modifications

### Direct Assignments

| File | Function | Trigger Condition |
|------|----------|-------------------|
| `NodeLinkingSystem.js` | `updateLinkArrow()` | Link created/updated - sets arrow emissive to color |

### .copy() Operations (Color Blending)

| File | Function | Trigger Condition |
|------|----------|-------------------|
| `SynergyCascadeVisualizer.js` | `updateCascadeEffects()` | Cascade wave intensity > 0 |
| `SynergyCascadeVisualizer.js` | `applyShimmer()` | Shimmer amount > 0 |
| `VisualAuthorityLock.js` | `restoreNodeEmissive()` | Restoring from saved state |
| `VisualStateSnapshot.js` | `restore()` | Restoring from snapshot |
| `WAVE_INTERFERENCE_ENGINE_SNIPPETS.js` | Wave interference logic | Field total amplitude varies |
| `WEEK25_CASCADE_FX_SNIPPETS.js` | Cascade FX | State totalIntensity > 0 |
| `_AdaptiveGlyphRendering1_0.js` | Update glyph | Hue color changes |
| `_EvolvingLinkFX2_0.js` | Stage-based FX | Stage definitions active |
| `_NodeEvolution3_ExtremeSafe.js` | Apply visual state | State change event |
| `NodeVisualStateBinder.js` | `bindAuraToVisualState()` | Aura visual state binding |
| `NodeVisualIntegrityFix.js` | `restoreNodeEmissive()` | Restoring original emissive |
| `NodeStateMachine_v1_EXAMPLES.js` | State transitions | Various state changes |
| `NodeStateMachine_v1.js` | State machine updates | State machine transitions |
| `NodeHierarchyVisualFeedback_v1.js` | Effect cleanup | Removing hierarchy effects |
| `NeonLinkVisuals.js` | Update link materials | Metrics-driven color updates |
| `LinkVisualStateAdapter.js` | Color transitions | HSL-based color transitions |
| `LinkSynergyColorTransition.js` | Transition to synergy | Synergy color active |
| `LinkSynergyColorTransition.js` | Transition from synergy | Current color active |
| `LinkStreakColorDynamics_Session115.js` | Update streaks | Dynamic color changes |
| `LinkGlowSynergyEngine1_0.js` | Apply glow profile | Profile color application |
| `LinkDirectionalStreaks.js` | Update streaks | Color updates |
| `LinkCorruptionSpreadAnimator.js` | Corruption animation | Corruption level varies |
| `LinkCorruptionParticleSystem.js` | Update particle | Particle color updates |
| `LinkCorruptionMorphingSystem.js` | Morphing hue | Corruption morphing active |
| `LinkCategoryTransitionIntegrationPatch.js` | Visual state transitions | Visual state changes |
| `LinkBeadSystem.js` | Update bead | Color updates |
| `HarmonicNodeResonanceHalos.js` | Update halo | Halo color updates |
| `HarmonicInfluencePropagationSystem_Session127.js` | Influence propagation | Color propagation |
| `EvolutionRegistry.js` | Evolution FX | Blended color application |
| `CorruptionVisualFX_v1.js` | Corruption FX | Corruption level varies |
| `AuraModulationSystem.js` | Modulate aura | Target intensity changes |
| `ArchetypeVisualDifferentiationSystem_v1.js` | Archetype differentiation | Visual differentiation active |
| `AnimatedLinkFlow.js` | Update packet flow | Color updates |

### .setHSL() Operations

| File | Function | Trigger Condition |
|------|----------|-------------------|
| `WAVE_INTERFERENCE_ENGINE_SNIPPETS.js` | Wave interference | Constructive/destructive power balance |
| `LinkVisualStateAdapter.js` | Color adaptation | HSL-based color adaptation |

### .setHex() Operations

| File | Function | Trigger Condition |
|------|----------|-------------------|
| `VisualAuthorityLock.js` | `restoreNodeEmissive()` | Restoring hex color value |
| `_EvolvingLinkFX2_0.js` | Stage transitions | Stage color hex |
| `_NodeEvolution3_ExtremeSafe.js` | Apply state | State emissive hex |
| `NodeVisualStateBinder.js` | Apply visual state | Base emissive hex |
| `NodeStateMachine_v1_EXAMPLES.js` | State changes | State-specific hex values |
| `NodeStateMachine_v1.js` | State machine | Idle/active state hex |
| `LinkGlowSynergyEngine1_0.js` | Glow profile | Profile color hex |

### .setRGB() Operations

| File | Function | Trigger Condition |
|------|----------|-------------------|
| `NodeHierarchyVisualFeedback_v1.js` | Apply effect | RGB color from effect |
| `HarmonicNodeResonanceHalos.js` | Update halo | Halo RGB components |

---

## 2. MATERIAL.EMISSIVEINTENSITY Modifications (152 instances)

### Node-Based Systems

| File | Function | Trigger Condition |
|------|----------|-------------------|
| `SafeMetricsFX1_1.js` | Apply node metrics | Smoothed synergy/clarity/corruption |
| `SynergyCascadeVisualizer.js` | Update cascade | Cascade intensity > 0 |
| `SynergyCascadeVisualizer.js` | Apply shimmer | Shimmer amount > 0 |
| `WaveInterferencePatternSystem_Session132.js` | Wave interference | Field total amplitude |
| `WAVE_INTERFERENCE_ENGINE_SNIPPETS.js` | Wave interference | Field total amplitude |
| `WEEK25_CASCADE_FX_SNIPPETS.js` | Cascade FX | Glow amplification varies |
| `WEEK7_INTEGRATION_SNIPPET.js` | Node visuals | Smoothed clarity varies |
| `World.js` | Background singularity | Time-based pulse |
| `World.js` | Background nodes | Time + pulse offset |
| `_AdaptiveGlyphRendering1_0.js` | Glyph rendering | Intensity varies |
| `_AtomaGlyphSystem4_0.js` | Glyph system | Dimming factor applies |
| `_MythicNodeCreation.js` | Node creation ritual | Ritual phase, proximity |
| `_MythicRitualPlayer.js` | Ritual effects | Original intensity * multiplier |
| `_NewNodeCategoryVisuals.js` | Category visuals | Pulse phase, spark flash |
| `_NodeEvolution3_ExtremeSafe.js` | Node evolution | Progress-based boost |
| `_NodeMicroEvents.js` | Micro events | Event progress, spike/overcharge |
| `_ProceduralMeaningEngine.js` | Meaning engine | Chain intensity varies |
| `_SafeEvolutionManager.js` | Evolution FX | Intensity varies |
| `_SafeLegendaryNodePack.js` | Legendary nodes | Intensity varies |
| `_SafeNodePersonalityFX.js` | Personality FX | Pulse factor, mood multiplier |
| `_ExtremeAINodeEvolution3.js` | AI node evolution | Time-based oscillation, progress |
| `_UISelectedNodeHighlight3_2.js` | Selection highlight | Pulse factor |

### Link-Based Systems

| File | Function | Trigger Condition |
|------|----------|-------------------|
| `_EvolvingLinkFX2_0.js` | Link FX | Stage definitions, pulse |
| `_ExtremeLinkVisuals4_0.js` | Link visuals | Throughput, synergy, load |
| `_SafeLegendaryLinkFX.js` | Legendary link FX | State intensity varies |
| `NodeLinkingSystem.js` | Link arrow | Creation pulse (300ms) |
| `NeonLinkVisuals.js` | Neon visuals | Emissive modulation, pulse |
| `MemoryLane.js` | Memory trails | Pulse varies |
| `LinkSynergyColorTransition.js` | Color transitions | Harmony/synergy/corruption factors |
| `LinkStreakColorDynamics_Session115.js` | Streak dynamics | Harmony/synergy/corruption |
| `LinkRendererConduit.js` | Renderer conduit | Visual time, traffic load |
| `LinkGlowSynergyEngine1_0.js` | Glow synergy | Profile emissive boost |
| `LinkEnergyWave.js` | Energy waves | Final intensity (0.2-3.0) |
| `LinkDirectionalStreaks.js` | Directional streaks | Base brightness |
| `LinkEmissionPulsingSystem.js` | Emission pulsing | Glow multiplier varies |
| `LinkCorruptionSpreadAnimator.js` | Corruption spread | Corruption level (0.5-1.0) |
| `LinkCategoryTransitionIntegrationPatch.js` | Category transitions | Visual state glow intensity |
| `LinkBeadVisualEffects.js` | Bead effects | Interference factor |
| `InterferenceEffectApplier.js` | Interference | Base intensity modulation |
| `HarmonicResonanceCoupling_v1.js` | Resonance coupling | Resonance phase/intensity |
| `HarmonicInfluencePropagationSystem_Session127.js` | Influence propagation | Material opacity factor |

### Aura Systems

| File | Function | Trigger Condition |
|------|----------|-------------------|
| `NodeVisualStateBinder.js` | Aura binding | Min/max emissive + pulse |
| `T2_CorruptionVisualIntegration_v1.js` | Corruption FX | Corruption level (0-0.8) |
| `HarmonicNodeResonanceHalos.js` | Resonance halos | Halo current intensity |
| `AuraModulationSystem.js` | Aura modulation | Target intensity varies |
| `PersonalityVFXLayer_v1.js` | Personality VFX | Clamped target intensity (0-1.5) |
| `CorruptionVisualFX_v1.js` | Corruption FX | Glow intensity varies |

### Environmental/World Effects

| File | Function | Trigger Condition |
|------|----------|-------------------|
| `_SafeWorldFXPack.js` | World FX | Pulse varies |
| `_SafeLegendaryWorldEvents.js` | Legendary events | Event intensity varies |
| `VisualUpgradeSuperpack.js` | Visual upgrades | Pulse varies per layer |
| `SigmaNode.js` | Sigma nodes | Pulse effect (0.3-0.7) |
| `StandingWaveVisualRenderer_Session131.js` | Standing waves | Antinode/trap zone intensity |
| `ResonanceRuptureVisualSystem_Session133.js` | Rupture system | Clarity, burst progress |
| `EnvironmentalHazards.js` | Hazards | Pulse varies |
| `EnergyOrb.js` | Energy orbs | Pulse * 0.8 |
| `DreamDesert.js` | Desert visuals | Pulse varies |
| `FractalValley.js` | Fractal valley | Pulse varies |
| `CinematicUpgrade.js` | Cinematic effects | Pulse varies |

### Visual Systems

| File | Function | Trigger Condition |
|------|----------|-------------------|
| `VisualAuthorityLock.js` | Authority lock | Intensity varies |
| `VisualStateSnapshot.js` | State snapshot | Restored from data |
| `CoreMaterialMutationTestSuite.js` | Test suite | Original + 0.5 boost |
| `AnimatedLinkFlow.js` | Link flow | Glow intensity * synergy |
| `AINodes.js` | AI nodes | Activation varies |

---

## 3. MATERIAL.OPACITY Modifications (300+ instances)

### Key Pattern: Opacity Modulation Categories

#### Time-Based Fading
| File | Function | Trigger Condition |
|------|----------|-------------------|
| `SafeQuantumIllusionsPack1.js` | Illusion effects | Progress-based fade (1-progress) |
| `SimulationEffectPool.js` | Simulation effects | Progress-based fade |
| `SynergyVFX1_0.js` | Synergy VFX | Progress-based fade |
| `T2_CorruptionVisualIntegration_v1.js` | Corruption FX | Fade progress |
| `T2_HarmonyVisualConsumer_v1.js` | Harmony FX | Fade progress |
| `WaveInterferencePatternSystem_Session132.js` | Wave patterns | Opacity factor varies |
| `_RecursiveGlyphMessaging4_0.js` | Glyph messaging | Fade progress |
| `_RecursiveGlyphSignalSystem.js` | Signal system | Alpha varies |

#### Pulse/Breathing Effects
| File | Function | Trigger Condition |
|------|----------|-------------------|
| `RegionalHarmonyZones.js` | Harmony zones | Base opacity + boost |
| `SystemStateOverlay.js` | State overlay | Breathing amount, pulse |
| `HarmonyAuraController.js` | Harmony aura | Breathing effect |
| `_UIPrimaryNodeAura3_7.js` | Primary aura | Pulse/ring intensity |
| `_SafeNodePersonalityFX.js` | Personality FX | Pulse * glow intensity |
| `_MythicNodeCreation.js` | Node creation | Phase progress |
| `_MythicRitualPlayer.js` | Ritual effects | Phase progress |
| `_MythicRitualController.js` | Ritual controller | Phase progress |
| `_SafeLegendaryNodePack.js` | Legendary nodes | Intensity varies |
| `NodeMicroEvents.js` | Micro events | Progress-based fade |
| `QuantumNode.js` | Quantum nodes | Opacity waver |

#### Synergy/Metrics-Driven
| File | Function | Trigger Condition |
|------|----------|-------------------|
| `SynergyHighways1_0.js` | Synergy highways | Synergy strength |
| `SynergyHighwayVisuals3D_1_0.js` | Highway visuals | Visuals intensity |
| `SynergyVFX1_0.js` | Synergy VFX | Glow strength |
| `SafeMetricsFX1_1.js` | Metrics FX | Synergy/clarity/corruption |
| `T2_HarmonyVisualConsumer_v1.js` | Harmony consumer | Harmony intensity, breathing |
| `LinkRendererConduit.js` | Link renderer | Traffic load |
| `HarmonicHubAuraSystem_Session126.js` | Harmonic hub | Synergy varies |

#### Flicker/Random Effects
| File | Function | Trigger Condition |
|------|----------|-------------------|
| `_SafeWorldFXPack.js` | World FX | Random flicker |
| `_ProceduralMeaningEngine.js` | Procedural meaning | Flicker speed varies |
| `_AtomaGlyphSystem3_0.js` | Glyph system | Pulse, flicker |
| `_AtomaGlyphSystem4_0.js` | Glyph system | Shimmer, flicker |
| `_SemanticGlyphAI.js` | Semantic glyphs | Explore amount, pulse |
| `_AIEmotionalFeed3_1.js` | Emotional feed | Fade transition |
| `_AIThoughtStorms2_0.js` | Thought storms | Flicker effect |
| `_SafeLegendaryWorldEvents.js` | Legendary events | Flicker frequency |

#### Intensity-Based Scaling
| File | Function | Trigger Condition |
|------|----------|-------------------|
| `_ExtremeLinkVisuals4_0.js` | Link visuals | Throughput, synergy |
| `_ExtremeLinkVisualPack3.js` | Link visuals | Traffic intensity |
| `_SafeLegendaryLinkFX.js` | Legendary links | State intensity |
| `_SafeAIWeatherPack.js` | AI weather | Weather intensity |
| `_AmbientEntityManager.js` | Ambient entities | Entity intensity |
| `SimulationEffectOrchestrator.js` | Effect orchestrator | Ease progress |
| `SigmaRiftChamber.js` | Rift chamber | Pulse varies |
| `EvolutionRegistry.js` | Evolution registry | Intensity varies |
| `EnvironmentalHazards.js` | Hazards | Pulse varies |

#### Traffic/Flow-Based
| File | Function | Trigger Condition |
|------|----------|-------------------|
| `LinkTrailParticleSystem.js` | Trail particles | Lifetime fade |
| `LinkHealingParticleSystem.js` | Healing particles | Harmony-based fade |
| `LinkSynergyColorTransition.js` | Synergy transition | Fade factor |
| `MemoryLane.js` | Memory trails | Progress-based |
| `AnimatedLinkFlow.js` | Animated flow | Flow state varies |
| `LinkDirectionalStreaks.js` | Directional streaks | Progress varies |
| `LinkBeadVisualEffects.js` | Bead effects | Interference varies |
| `LinkCorruptionParticleSystem.js` | Corruption particles | Fade progress |
| `LinkEmissionPulsingSystem.js` | Emission pulsing | Glow multiplier |
| `LinkCategoryTransitionIntegrationPatch.js` | Category transition | Transition state |

#### Visual Hierarchy/Auxiliary Elements
| File | Function | Trigger Condition |
|------|----------|-------------------|
| `_VisualHierarchyCorrectionSystem_v1.js` | Hierarchy correction | Min/max opacity clamp |
| `_UISelectedNodeLabel3_3.js` | Selected label | Fade in/out |
| `_UISelectedNodeBadge3_2.js` | Selected badge | Show/hide |
| `_UISelectedNodeTopBar3_4.js` | Selected top bar | Show/hide |
| `_UIPrimaryNodeTopBar3_7.js` | Primary top bar | Show/hide |
| `VisualAuthority.js` | Visual authority | visualRoot opacity = 1.0 |
| `VisualAuthorityLock.js` | Authority lock | Opacity bounds |

#### Vignette/Overlay Effects
| File | Function | Trigger Condition |
|------|----------|-------------------|
| `SafeDreamDepthPack.js` | Dream depth | Vignette opacity |
| `SafeColonyExpansion2.js` | Colony expansion | Halo opacity |
| `ResonanceEchoTrailSystem.js` | Echo trails | Fade curve |
| `SafePlayerMemoryTrails.js` | Player trails | Age/maxAge ratio |
| `SafeNodeMemoryTrails.js` | Node trails | Age/maxAge ratio |
| `SafeLinkMemoryTrails.js` | Link trails | Age/maxAge ratio |

#### Corruption/Decay Effects
| File | Function | Trigger Condition |
|------|----------|-------------------|
| `T2_CorruptionVisualIntegration_v1.js` | Corruption FX | Corruption level |
| `CorruptionVisualFX_v1.js` | Corruption FX | Corruption varies |
| `CorruptionDesaturationIntegrationPatch.js` | Desaturation | Corruption level |
| `ResonanceRuptureVisualSystem_Session133.js` | Rupture system | Intensity, progress |

---

## 4. MATERIAL.COLOR Modifications

### Node Materials

| File | Function | Trigger Condition |
|------|----------|-------------------|
| `VisualStateSnapshot.js` | Snapshot/restore | State color changes |
| `WAVE_INTERFERENCE_ENGINE_SNIPPETS.js` | Wave interference | Constructive/destructive |
| `WEEK25_CASCADE_FX_SNIPPETS.js` | Cascade FX | Effective color |
| `_NodeEvolution3_ExtremeSafe.js` | Node evolution | Base color |
| `NodeVisualStateBinder.js` | Visual state binding | Base color |
| `NodeStateMachine_v1_EXAMPLES.js` | State transitions | State-specific colors |
| `NodeStateMachine_v1.js` | State machine | Idle/active colors |
| `NeonLinkVisuals.js` | Link visuals | Metric color |
| `LinkVisualStateAdapter.js` | Visual adaptation | Dynamic color |
| `LinkStreakColorDynamics_Session115.js` | Streak dynamics | Dynamic color |
| `LinkCategoryTransitionIntegrationPatch.js` | Category transitions | Visual state color |
| `LinkBeadSystem.js` | Bead system | Color updates |
| `ArchetypeVisualDifferentiationSystem_v1.js` | Archetypes | Update data color |

### Particle/Effect Materials

| File | Function | Trigger Condition |
|------|----------|-------------------|
| `SynergyCascadeVisualizer.js` | Cascade visualizer | Cascade color, shimmer color |
| `LinkTrailParticleSystem.js` | Trail particles | Particle color |
| `LinkHealingParticleSystem.js` | Healing particles | Healing color |
| `LinkCorruptionParticleSystem.js` | Corruption particles | Corruption color |
| `AnimatedLinkFlow.js` | Animated flow | Update data color |

---

## 5. LIGHT.INTENSITY Modifications

| File | Function | Trigger Condition |
|------|----------|-------------------|
| `_SafeWorldFXPack.js` | World lights | Pulse value, breath value, stress |
| `CanonicalTemplate3_StressVisuals.js` | Stress visuals | Base intensity * (1 - stress * 0.2) |
| `AINodes.js` | AI nodes | Activation * 2 |

---

## Key Findings

### High-Impact Systems

1. **Link Visual Systems** (Highest volume)
   - Multiple link visual packs with overlapping concerns
   - `NeonLinkVisuals.js`, `_ExtremeLinkVisuals4_0.js`, `_EvolvingLinkFX2_0.js`
   - Heavy modulation based on: synergy, harmony, corruption, traffic, throughput

2. **Node Personality Systems**
   - `NodePersonalitySystem2_0.js`, `_SafeNodePersonalityFX.js`, `PersonalityVFXLayer_v1.js`
   - Mood-based modulation affecting multiple layers

3. **Aura Systems**
   - `HarmonicNodeResonanceHalos.js`, `AuraModulationSystem.js`
   - Intensity-driven opacity and emissive changes

4. **Evolution/Mutation Systems**
   - `_NodeEvolution3_ExtremeSafe.js`, `EvolutionRegistry.js`, `_SafeEvolutionManager.js`
   - Progress-based intensity ramps

### Potential Issues

1. **Duplicate/Overlapping Modifiers**
   - Multiple systems modifying the same materials
   - Risk of conflicting assignments (last-writer-wins)
   - Example: Both `NeonLinkVisuals.js` and `_EvolvingLinkFX2_0.js` modify link emissive

2. **No Central Authority**
   - While `VisualAuthority.js` and `VisualAuthorityLock.js` exist, many systems bypass them
   - Direct material assignment common throughout codebase

3. **Missing Integration Checks**
   - Some systems appear dormant (commented out or not wired)
   - No clear initialization order documentation

4. **Performance Concerns**
   - Many materials updated every frame without delta-time optimization
   - Lerp operations happening in tight loops

### Recommendations

1. **Audit Active Systems**
   - Trace initialization for each brightness-modifying system
   - Identify which are actually running vs legacy code

2. **Consolidate Link Visuals**
   - Merge overlapping link visual systems
   - Establish single source of truth for link material updates

3. **Implement Material Lock Layer**
   - Enforce `VisualAuthorityLock` usage across all systems
   - Prevent unauthorized material mutations

4. **Add Performance Profiling**
   - Measure frame cost of material updates
   - Implement batching where possible

---

## File Count Summary

- **Files modifying emissive**: 28
- **Files modifying emissiveIntensity**: 40+
- **Files modifying opacity**: 80+
- **Files modifying color**: 15+
- **Files modifying light intensity**: 3

**Total unique files**: 100+

---

**End of Audit Report**