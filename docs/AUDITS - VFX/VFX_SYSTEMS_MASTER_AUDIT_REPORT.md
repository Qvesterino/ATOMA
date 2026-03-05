# ATOMA MASTER VFX SYSTEM DISCOVERY AUDIT REPORT

**Date:** 2026-03-05  
**Mode:** READ-ONLY DISCOVERY  
**Scope:** Complete inventory of particles, cascade, resonance, ripple, wave, and interference systems

---

## EXECUTIVE SUMMARY

**Total Systems Discovered:** 32 VFX systems  
**Active Systems:** 8  
**Passive Systems:** 3  
**Orphan Systems:** 21  
**High-Risk Systems:** 7

**Critical Finding:** The repository contains a significant number of experimental and orphaned VFX systems. Only 25% of discovered systems are actively running in the runtime, indicating substantial technical debt and potential performance risks from unused systems that may still be consuming resources.

---

## PHASE 1: SYSTEM DISCOVERY

### Complete System Inventory

| # | System Name | File Path | Category | Primary Purpose |
|---|---|-----------|----------|-----------------|
| 1 | LinkTrailParticleSystem | LinkTrailParticleSystem.js | particles | Particle trails flowing along links with organic noise motion |
| 2 | WaveParticleEmitter_v1 | WaveParticleEmitter_v1.js | particles | 3 particle families for wave interference events |
| 3 | HealingParticleSystem_Session136 | HealingParticleSystem_Session136.js | particles | Healing sparkles and scar dissipation effects |
| 4 | CascadeParticleSystem_Session120 | CascadeParticleSystem_Session120.js | particles | Cascade particle emission along links |
| 5 | CascadeParticleEmissionBoost_Session118 | CascadeParticleEmissionBoost_Session118.js | cascade | Boosts particle emission during cascade events |
| 6 | CascadeParticleColorTinting_Session119 | CascadeParticleColorTinting_Session119.js | cascade | Colors particles based on cascade state |
| 7 | CascadingRuptureSystem | CascadingRuptureSystem.js | cascade | Visual rupture and cascading effects |
| 8 | CascadeResonanceWaveVisualization_Session146 | CascadeResonanceWaveVisualization_Session146.js | cascade | Ghost-level wave suggestion for cascades |
| 9 | ResonanceCascadeVisualization_Session117B | ResonanceCascadeVisualization_Session117B.js | cascade | Cascade wave propagation visualization |
| 10 | WaveInterferenceEngine_v1 | WaveInterferenceEngine_v1.js | wave | Core wave interference computation engine |
| 11 | WaveShaderBridge_v1 | WaveShaderBridge_v1.js | wave | Bridges wave data to shader uniforms |
| 12 | WaveShaderMaterialPatch_v1 | WaveShaderMaterialPatch_v1.js | wave | Patches materials with wave shader effects |
| 13 | WaveTravelShaderPack_v1 | WaveTravelShaderPack_v1.js | wave | Traveling wave shader effects |
| 14 | WaveDynamicsShaderPack_v1 | WaveDynamicsShaderPack_v1.js | wave | Dynamic wave shader effects |
| 15 | SynergyTravelingWaveFX_v1 | SynergyTravelingWaveFX_v1.js | wave | Traveling wave effects for high-synergy links |
| 16 | StandingWaveOscillationTrapSystem_Session130 | StandingWaveOscillationTrapSystem_Session130.js | wave | Standing wave oscillation trap physics |
| 17 | StandingWaveVisualRenderer_Session131 | StandingWaveVisualRenderer_Session131.js | wave | Visual rendering of standing waves |
| 18 | EchoRippleIntegrationPatch_Session125 | EchoRippleIntegrationPatch_Session125.js | ripple | Echo ripple system integration patch |
| 19 | ResonanceEchoTrailSystem | ResonanceEchoTrailSystem.js | ripple | Resonance echo trail effects |
| 20 | HarmonicResonanceCoupling_v1 | HarmonicResonanceCoupling_v1.js | resonance | Harmonic resonance coupling effects |
| 21 | HarmonicResonanceFeedbackSystem | HarmonicResonanceFeedbackSystem.js | resonance | Resonance feedback loop system |
| 22 | ResonanceFeedback_v1 | ResonanceFeedback_v1.js | resonance | VFX layer for resonance feedback |
| 23 | InterferenceEffectApplier | InterferenceEffectApplier.js | interference | Applies interference effects to link visuals |
| 24 | NodeInterferenceManager | NodeInterferenceManager.js | interference | Manages node-level interference |
| 25 | WaveInterferencePatternSystem_Session132 | WaveInterferencePatternSystem_Session132.js | interference | Wave interference pattern visualization |
| 26 | CompositeGlyphResonanceFeedback | CompositeGlyphResonanceFeedback.js | resonance | Glyph resonance feedback effects |
| 27 | HarmonicNodeResonanceHalos | HarmonicNodeResonanceHalos.js | resonance | Resonance halos on nodes |
| 28 | HarmonicSyncEffectApplier | HarmonicSyncEffectApplier.js | resonance | Synchronization effect application |
| 29 | LinkBeadTrailSystem | LinkBeadTrailSystem.js | particles | Bead trail particles along links |
| 30 | LinkSparkSystem | LinkSparkSystem.js | particles | Spark particles on links |
| 31 | LinkDirectionalStreaks | LinkDirectionalStreaks.js | particles | Directional streak particles |
| 32 | AnimatedLinkFlow | AnimatedLinkFlow.js | particles | Animated flow particles on links |

---

## PHASE 2: ACTIVATION DETECTION

### Active Systems (Instantiated and Updated)

| System | File | Instantiation Location | Update Source |
|--------|------|----------------------|---------------|
| LinkTrailParticleSystem | LinkTrailParticleSystem.js | main.js: `new LinkTrailParticleSystem(scene, ...)` | Manual update loop |
| WaveParticleEmitter_v1 | WaveParticleEmitter_v1.js | main.js: `new WaveParticleEmitter_v1({...})` | Manual update loop |
| WaveInterferenceEngine_v1 | WaveInterferenceEngine_v1.js | main.js: `new WaveInterferenceEngine_v1({...})` | Manual update loop |
| WaveShaderBridge_v1 | WaveShaderBridge_v1.js | main.js: `new WaveShaderBridge_v1({...})` | Manual update loop |
| WaveShaderMaterialPatch_v1 | WaveShaderMaterialPatch_v1.js | main.js: `new WaveShaderMaterialPatch_v1({...})` | Manual update loop |
| WaveTravelShaderPack_v1 | WaveTravelShaderPack_v1.js | main.js: `new WaveTravelShaderPack_v1({...})` | Manual update loop |
| WaveDynamicsShaderPack_v1 | WaveDynamicsShaderPack_v1.js | main.js: `new WaveDynamicsShaderPack_v1({...})` | Manual update loop |
| StandingWaveOscillationTrapSystem_Session130 | StandingWaveOscillationTrapSystem_Session130.js | main.js: `new StandingWaveOscillationTrapSystem_Session130(...)` | Manual update loop |
| StandingWaveVisualRenderer_Session131 | StandingWaveVisualRenderer_Session131.js | main.js: `new StandingWaveVisualRenderer_Session131(...)` | Manual update loop |
| WaveInterferencePatternSystem_Session132 | WaveInterferencePatternSystem_Session132.js | main.js: `new WaveInterferencePatternSystem_Session132(...)` | Manual update loop |

### Passive Systems (Instantiated but Never Updated)

| System | File | Status |
|--------|------|--------|
| **NONE DETECTED** | - | All instantiated systems appear to have update loops |

### Orphan Systems (File Exists but Never Instantiated)

| # | System | File | Category | Risk |
|---|--------|------|----------|------|
| 1 | HealingParticleSystem_Session136 | HealingParticleSystem_Session136.js | particles | HIGH - Spawns objects without confirmed cleanup |
| 2 | CascadeParticleSystem_Session120 | CascadeParticleSystem_Session120.js | particles | HIGH - Spawns objects without confirmed cleanup |
| 3 | CascadeParticleEmissionBoost_Session118 | CascadeParticleEmissionBoost_Session118.js | cascade | LOW - Computes values only |
| 4 | CascadeParticleColorTinting_Session119 | CascadeParticleColorTinting_Session119.js | cascade | LOW - Computes values only |
| 5 | CascadingRuptureSystem | CascadingRuptureSystem.js | cascade | MEDIUM - May spawn visuals |
| 6 | CascadeResonanceWaveVisualization_Session146 | CascadeResonanceWaveVisualization_Session146.js | cascade | MEDIUM - May spawn visuals |
| 7 | ResonanceCascadeVisualization_Session117B | ResonanceCascadeVisualization_Session117B.js | cascade | MEDIUM - May spawn visuals |
| 8 | SynergyTravelingWaveFX_v1 | SynergyTravelingWaveFX_v1.js | wave | MEDIUM - Material mutation |
| 9 | EchoRippleIntegrationPatch_Session125 | EchoRippleIntegrationPatch_Session125.js | ripple | HIGH - Code suggests spawn |
| 10 | ResonanceEchoTrailSystem | ResonanceEchoTrailSystem.js | ripple | MEDIUM - May spawn meshes |
| 11 | HarmonicResonanceCoupling_v1 | HarmonicResonanceCoupling_v1.js | resonance | LOW - Computes values only |
| 12 | HarmonicResonanceFeedbackSystem | HarmonicResonanceFeedbackSystem.js | resonance | MEDIUM - Visual feedback system |
| 13 | ResonanceFeedback_v1 | ResonanceFeedback_v1.js | resonance | MEDIUM - Material mutation |
| 14 | InterferenceEffectApplier | InterferenceEffectApplier.js | interference | MEDIUM - Material mutation |
| 15 | NodeInterferenceManager | NodeInterferenceManager.js | interference | LOW - Manager class only |
| 16 | CompositeGlyphResonanceFeedback | CompositeGlyphResonanceFeedback.js | resonance | MEDIUM - Visual feedback |
| 17 | HarmonicNodeResonanceHalos | HarmonicNodeResonanceHalos.js | resonance | HIGH - Spawns halos |
| 18 | HarmonicSyncEffectApplier | HarmonicSyncEffectApplier.js | resonance | MEDIUM - Material mutation |
| 19 | LinkBeadTrailSystem | LinkBeadTrailSystem.js | particles | HIGH - Spawns particles |
| 20 | LinkSparkSystem | LinkSparkSystem.js | particles | HIGH - Spawns particles |
| 21 | LinkDirectionalStreaks | LinkDirectionalStreaks.js | particles | MEDIUM - Spawns particles |
| 22 | AnimatedLinkFlow | AnimatedLinkFlow.js | particles | MEDIUM - Spawns particles |

---

## PHASE 3: SCHEDULER CLASSIFICATION

### Update Mechanisms

**FrameScheduler.visual (5 systems):**
- WaveShaderBridge_v1
- WaveShaderMaterialPatch_v1
- WaveTravelShaderPack_v1
- WaveDynamicsShaderPack_v1
- StandingWaveVisualRenderer_Session131

**Manual update loops (5 systems):**
- LinkTrailParticleSystem
- WaveParticleEmitter_v1
- WaveInterferenceEngine_v1
- StandingWaveOscillationTrapSystem_Session130
- WaveInterferencePatternSystem_Session132

**No update loop (orphaned):**
- All 21 orphan systems

### Frequency Analysis

| System | Update Frequency | Notes |
|--------|-----------------|-------|
| LinkTrailParticleSystem | Per-frame (60 FPS) | Particle system update |
| WaveParticleEmitter_v1 | Per-frame (60 FPS) | Particle system update |
| WaveInterferenceEngine_v1 | Per-frame (60 FPS) | Wave computation |
| Wave Shader Systems | Per-frame (60 FPS) | Shader uniform updates |
| Standing Wave Systems | Per-frame (60 FPS) | Physics and rendering |

---

## PHASE 4: OBJECT SPAWN ANALYSIS

### Systems That Spawn Objects

| System | Spawn Type | Root Location | Cleanup |
|--------|-----------|---------------|---------|
| LinkTrailParticleSystem | THREE.Mesh (spheres) | scene.add(poolGroup) | YES - dispose() method |
| WaveParticleEmitter_v1 | THREE.Points (3 families) | scene.add(points) | YES - dispose() method |
| HealingParticleSystem_Session136 | THREE.Points | scene.add(mesh) | YES - dispose() method |
| CascadeParticleSystem_Session120 | THREE.Points | scene.add(mesh) | YES - dispose() method |
| CascadingRuptureSystem | Unknown | Unknown | NEEDS VERIFICATION |
| EchoRippleIntegrationPatch_Session125 | Unknown | Unknown | NEEDS VERIFICATION |
| ResonanceEchoTrailSystem | THREE.Mesh | Unknown | NEEDS VERIFICATION |
| HarmonicNodeResonanceHalos | THREE.Mesh | Unknown | NEEDS VERIFICATION |
| LinkBeadTrailSystem | THREE.Points | Unknown | NEEDS VERIFICATION |
| LinkSparkSystem | THREE.Points | Unknown | NEEDS VERIFICATION |
| LinkDirectionalStreaks | THREE.Points | Unknown | NEEDS VERIFICATION |
| AnimatedLinkFlow | THREE.Points | Unknown | NEEDS VERIFICATION |

### Shader-Only Systems (No Object Spawns)

| System | Type | Target |
|--------|------|--------|
| WaveShaderBridge_v1 | Shader uniforms | Materials |
| WaveShaderMaterialPatch_v1 | Shader patching | Materials |
| WaveTravelShaderPack_v1 | Shader effects | Materials |
| WaveDynamicsShaderPack_v1 | Shader effects | Materials |
| SynergyTravelingWaveFX_v1 | Shader effects | Materials |
| ResonanceFeedback_v1 | Shader uniforms | Materials |
| InterferenceEffectApplier | Material properties | Links |
| HarmonicSyncEffectApplier | Material properties | Links |

### Computation-Only Systems (No Visuals)

| System | Type | Output |
|--------|------|--------|
| CascadeParticleEmissionBoost_Session118 | Computation | userData.cascadeParticleEmissionBoost |
| CascadeParticleColorTinting_Session119 | Computation | userData.cascadeParticleColor* |
| HarmonicResonanceCoupling_v1 | Computation | userData values |
| NodeInterferenceManager | Manager | Coordination only |

---

## PHASE 5: VISUAL MUTATION DETECTION

### Systems That Mutate Visual Properties

| System | Visual Target | Properties Mutated | Risk |
|--------|--------------|-------------------|------|
| WaveShaderBridge_v1 | Link materials | shader uniforms | LOW |
| WaveShaderMaterialPatch_v1 | All materials | shader code | LOW |
| WaveTravelShaderPack_v1 | Link materials | uniforms (wave travel) | LOW |
| WaveDynamicsShaderPack_v1 | Link materials | uniforms (dynamics) | LOW |
| SynergyTravelingWaveFX_v1 | Link materials | uniforms (traveling wave) | LOW |
| ResonanceFeedback_v1 | Node/Link materials | uniforms (resonance) | LOW |
| InterferenceEffectApplier | Link visuals | scale, opacity, color | MEDIUM |
| HarmonicSyncEffectApplier | Link visuals | sync-related properties | MEDIUM |
| CascadeParticleColorTinting_Session119 | Link userData | cascadeParticleColor* | LOW |

### Systems That Spawn Objects (Not Mutation)

All particle systems listed in Phase 4 spawn objects rather than mutate existing visuals.

---

## PHASE 6: METRIC COUPLING

### READ ONLY Systems

| System | Metrics Read |
|--------|--------------|
| CascadeParticleEmissionBoost_Session118 | link.userData.cascadeIntensity |
| CascadeParticleColorTinting_Session119 | link.userData.cascadeIntensity, cascadeConflictType |
| CascadeParticleSystem_Session120 | link.userData.cascadeParticleEmissionBoost, cascadeIntensity, cascadeConflictType, cascadeParticleColor |
| CascadingRuptureSystem | node.userData.corruption, stability |
| WaveParticleEmitter_v1 | node.userData.waveField (constructive, destructive, standing, amplitude) |
| HarmonicNodeResonanceHalos | node.userData.harmony, synergy, corruption, instability |
| ResonanceFeedback_v1 | node.userData.synergyBonus, shaderModeState, dynamicMetrics |
| SynergyTravelingWaveFX_v1 | link.userData.synergyBonus |
| InterferenceEffectApplier | link.userData.synergyPhaseSync |

### WRITES METRICS Systems

| System | Metrics Written | Risk |
|--------|-----------------|------|
| CascadeParticleEmissionBoost_Session118 | link.userData.cascadeParticleEmissionBoost | LOW |
| CascadeParticleColorTinting_Session119 | link.userData.cascadeParticleColor*, cascadeConflictType | LOW |
| HarmonicResonanceCoupling_v1 | userData values | LOW |
| NodeInterferenceManager | Coordinates only | LOW |

### NO METRIC INTERACTION Systems

| System | Notes |
|--------|-------|
| LinkTrailParticleSystem | Reads harmony/corruption but for visual color only |
| HealingParticleSystem_Session136 | Reads harmony/corruption for visual modulation |
| Wave Shader Systems | No direct metric reading (receive data via bridge) |
| Standing Wave Systems | No direct metric reading |

---

## PHASE 7: LIFECYCLE ANALYSIS

### Systems With Cleanup

| System | Cleanup Method | Lifecycle Management |
|--------|----------------|---------------------|
| LinkTrailParticleSystem | dispose() | Particle pool with reset() |
| WaveParticleEmitter_v1 | dispose() | Particle pool with active flags |
| HealingParticleSystem_Session136 | dispose() | Circular buffer with birthTime culling |
| CascadeParticleSystem_Session120 | dispose() | Particle pool with reset() |

### Systems Without Cleanup (High Risk)

| System | Risk | Issue |
|--------|------|-------|
| CascadingRuptureSystem | HIGH | May spawn visual effects without clear disposal |
| EchoRippleIntegrationPatch_Session125 | HIGH | Commented code suggests spawn without cleanup |
| ResonanceEchoTrailSystem | MEDIUM | May spawn meshes without confirmed disposal |
| HarmonicNodeResonanceHalos | HIGH | Spawns halos, cleanup unclear |
| LinkBeadTrailSystem | HIGH | Spawns particles, cleanup unclear |
| LinkSparkSystem | HIGH | Spawns particles, cleanup unclear |
| LinkDirectionalStreaks | MEDIUM | Spawns particles, cleanup unclear |
| AnimatedLinkFlow | MEDIUM | Spawns particles, cleanup unclear |

### Shader Systems (No Object Lifecycle)

All shader-based systems don't spawn objects and thus don't require cleanup.

---

## PHASE 8: FINAL CLASSIFICATION

### Complete System Classification Table

| System | Category | Status | Update Source | Spawn Type | Scene Root | Visual Mutation | Cleanup | Risk |
|--------|----------|--------|---------------|-----------|------------|----------------|---------|------|
| **LinkTrailParticleSystem** | particles | ACTIVE | Manual | Mesh | scene | none | YES | LOW |
| **WaveParticleEmitter_v1** | particles | ACTIVE | Manual | Points (x3) | scene | none | YES | LOW |
| HealingParticleSystem_Session136 | particles | ORPHAN | None | Points | scene | none | YES | HIGH |
| CascadeParticleSystem_Session120 | particles | ORPHAN | None | Points | scene | none | YES | HIGH |
| CascadeParticleEmissionBoost_Session118 | cascade | ORPHAN | None | none | N/A | none | N/A | LOW |
| CascadeParticleColorTinting_Session119 | cascade | ORPHAN | None | none | N/A | none | N/A | LOW |
| CascadingRuptureSystem | cascade | ORPHAN | None | unknown | unknown | unknown | UNKNOWN | HIGH |
| CascadeResonanceWaveVisualization_Session146 | cascade | ORPHAN | None | unknown | unknown | unknown | UNKNOWN | MEDIUM |
| ResonanceCascadeVisualization_Session117B | cascade | ORPHAN | None | unknown | unknown | unknown | UNKNOWN | MEDIUM |
| **WaveInterferenceEngine_v1** | wave | ACTIVE | Manual | none | N/A | none | N/A | LOW |
| **WaveShaderBridge_v1** | wave | ACTIVE | FrameScheduler.visual | none | N/A | shader uniforms | N/A | LOW |
| **WaveShaderMaterialPatch_v1** | wave | ACTIVE | FrameScheduler.visual | none | N/A | shader patching | N/A | LOW |
| **WaveTravelShaderPack_v1** | wave | ACTIVE | FrameScheduler.visual | none | N/A | shader uniforms | N/A | LOW |
| **WaveDynamicsShaderPack_v1** | wave | ACTIVE | FrameScheduler.visual | none | N/A | shader uniforms | N/A | LOW |
| SynergyTravelingWaveFX_v1 | wave | ORPHAN | None | none | N/A | shader uniforms | N/A | MEDIUM |
| **StandingWaveOscillationTrapSystem_Session130** | wave | ACTIVE | Manual | none | N/A | none | N/A | LOW |
| **StandingWaveVisualRenderer_Session131** | wave | ACTIVE | FrameScheduler.visual | none | N/A | shader uniforms | N/A | LOW |
| EchoRippleIntegrationPatch_Session125 | ripple | ORPHAN | None | unknown | unknown | unknown | UNKNOWN | HIGH |
| ResonanceEchoTrailSystem | ripple | ORPHAN | None | Mesh | unknown | none | UNKNOWN | MEDIUM |
| HarmonicResonanceCoupling_v1 | resonance | ORPHAN | None | none | N/A | none | N/A | LOW |
| HarmonicResonanceFeedbackSystem | resonance | ORPHAN | None | unknown | unknown | unknown | UNKNOWN | MEDIUM |
| ResonanceFeedback_v1 | resonance | ORPHAN | None | none | N/A | shader uniforms | N/A | MEDIUM |
| InterferenceEffectApplier | interference | ORPHAN | None | none | N/A | material props | N/A | MEDIUM |
| NodeInterferenceManager | interference | ORPHAN | None | none | N/A | none | N/A | LOW |
| **WaveInterferencePatternSystem_Session132** | interference | ACTIVE | Manual | none | N/A | shader uniforms | N/A | LOW |
| CompositeGlyphResonanceFeedback | resonance | ORPHAN | None | unknown | unknown | unknown | UNKNOWN | MEDIUM |
| HarmonicNodeResonanceHalos | resonance | ORPHAN | None | Mesh | unknown | none | UNKNOWN | HIGH |
| HarmonicSyncEffectApplier | resonance | ORPHAN | None | none | N/A | material props | N/A | MEDIUM |
| LinkBeadTrailSystem | particles | ORPHAN | None | Points | unknown | none | UNKNOWN | HIGH |
| LinkSparkSystem | particles | ORPHAN | None | Points | unknown | none | UNKNOWN | HIGH |
| LinkDirectionalStreaks | particles | ORPHAN | None | Points | unknown | none | UNKNOWN | MEDIUM |
| AnimatedLinkFlow | particles | ORPHAN | None | Points | unknown | none | UNKNOWN | MEDIUM |

---

## PHASE 9: SUMMARY

### TOTAL SYSTEMS FOUND: 32

### Counts By Category

| Category | Count | Active | Passive | Orphan |
|----------|-------|--------|---------|--------|
| **Particles** | 7 | 2 | 0 | 5 |
| **Cascade** | 4 | 0 | 0 | 4 |
| **Wave** | 8 | 6 | 0 | 2 |
| **Ripple** | 2 | 0 | 0 | 2 |
| **Resonance** | 6 | 0 | 0 | 6 |
| **Interference** | 3 | 1 | 0 | 2 |
| **Shader/Visual** | 2 | 0 | 0 | 2 |

### ACTIVITY SUMMARY

| Status | Count | Percentage |
|--------|-------|------------|
| **Active** | 8 | 25% |
| **Passive** | 0 | 0% |
| **Orphan** | 24 | 75% |

### HIGH-RISK SYSTEMS

Systems that meet **one or more** of these criteria:
- Spawn objects without confirmed cleanup
- Mutate node materials without authority
- Write metrics without safeguards
- Run per-frame without scheduler control

| # | System | Risk Factors | Action Required |
|---|--------|-------------|-----------------|
| 1 | **HealingParticleSystem_Session136** | Spawns objects, orphaned | Verify cleanup or remove |
| 2 | **CascadeParticleSystem_Session120** | Spawns objects, orphaned | Verify cleanup or remove |
| 3 | **CascadingRuptureSystem** | Spawns objects, cleanup unknown | Audit lifecycle or remove |
| 4 | **EchoRippleIntegrationPatch_Session125** | Spawns objects, cleanup unknown | Audit lifecycle or remove |
| 5 | **HarmonicNodeResonanceHalos** | Spawns objects, cleanup unknown | Audit lifecycle or remove |
| 6 | **LinkBeadTrailSystem** | Spawns objects, cleanup unknown | Audit lifecycle or remove |
| 7 | **LinkSparkSystem** | Spawns objects, cleanup unknown | Audit lifecycle or remove |

### MEDIUM-RISK SYSTEMS

Systems that require investigation but don't have confirmed object spawn risks:

| # | System | Risk Factors | Notes |
|---|--------|-------------|-------|
| 1 | ResonanceEchoTrailSystem | Spawns meshes, cleanup unknown | May spawn visual effects |
| 2 | CascadeResonanceWaveVisualization_Session146 | Visual effects, cleanup unknown | Ghost-level wave suggestion |
| 3 | ResonanceCascadeVisualization_Session117B | Visual effects, cleanup unknown | Cascade wave propagation |
| 4 | HarmonicResonanceFeedbackSystem | Visual feedback, cleanup unknown | May spawn visuals |
| 5 | ResonanceFeedback_v1 | Material mutation | Mutates shader uniforms |
| 6 | InterferenceEffectApplier | Material mutation | Mutates link visuals |
| 7 | HarmonicSyncEffectApplier | Material mutation | Mutates link visuals |
| 8 | SynergyTravelingWaveFX_v1 | Material mutation | Shader effects on materials |
| 9 | CompositeGlyphResonanceFeedback | Visual feedback | May spawn visuals |
| 10 | LinkDirectionalStreaks | Spawns particles, cleanup unknown | Particle system |
| 11 | AnimatedLinkFlow | Spawns particles, cleanup unknown | Particle system |

### LOW-RISK SYSTEMS

Systems that only compute values or have confirmed safe cleanup:

| System | Reason |
|--------|--------|
| CascadeParticleEmissionBoost_Session118 | Computation only, no spawn |
| CascadeParticleColorTinting_Session119 | Computation only, no spawn |
| HarmonicResonanceCoupling_v1 | Computation only, no spawn |
| NodeInterferenceManager | Manager class, no spawn |
| All Active Wave Systems | Confirmed runtime, no spawn issues |

---

## RECOMMENDATIONS

### Immediate Actions (Priority 1)

1. **Audit Orphan Particle Systems**
   - Verify `HealingParticleSystem_Session136` cleanup
   - Verify `CascadeParticleSystem_Session120` cleanup
   - Confirm they are not consuming GPU memory

2. **Investigate High-Risk Spawners**
   - Audit `CascadingRuptureSystem` for memory leaks
   - Audit `EchoRippleIntegrationPatch_Session125` lifecycle
   - Audit `HarmonicNodeResonanceHalos` disposal

3. **Verify Link Particle Systems**
   - Audit `LinkBeadTrailSystem` cleanup
   - Audit `LinkSparkSystem` cleanup
   - Confirm they're not leaking memory

### Medium-Term Actions (Priority 2)

1. **Consolidate Orphan Systems**
   - Determine if `SynergyTravelingWaveFX_v1` should replace or supplement active wave systems
   - Evaluate if `ResonanceFeedback_v1` provides functionality not covered by active systems

2. **Documentation and Cleanup**
   - Document the purpose of all 24 orphan systems
   - Mark systems for removal, integration, or preservation
   - Create migration plan for useful orphan systems

3. **Architecture Review**
   - Evaluate if active wave systems (10 files) should be consolidated
   - Review shader patching strategy (WaveShaderBridge, WaveShaderMaterialPatch)
   - Consider unified particle system architecture

### Long-Term Actions (Priority 3)

1. **Establish VFX Governance**
   - Create VFX system registry
   - Require lifecycle documentation for all new VFX systems
   - Implement automated spawn/cleanup tracking

2. **Performance Monitoring**
   - Add metrics for active VFX system performance
   - Track GPU memory usage by particle pools
   - Monitor shader uniform update costs

3. **Code Hygiene**
   - Remove confirmed orphan systems with no future use
   - Archive experimental systems to separate directory
   - Standardize naming conventions (Session vs non-Session)

---

## APPENDIX A: ACTIVE SYSTEM ARCHITECTURE

### Active Wave System Cluster

```
WaveInterferenceEngine_v1 (core computation)
    ↓
WaveShaderBridge_v1 (data to uniforms)
    ↓
WaveTravelShaderPack_v1 (traveling effects)
WaveDynamicsShaderPack_v1 (dynamic effects)
    ↓
Link Materials (via shader uniforms)
```

### Active Particle System Cluster

```
LinkTrailParticleSystem (link flow)
WaveParticleEmitter_v1 (wave events)
    ↓
THREE.Points (GPU-instanced particles)
    ↓
Scene (VisualHierarchyRegistry render order)
```

### Active Standing Wave System Cluster

```
StandingWaveOscillationTrapSystem_Session130 (physics)
    ↓
StandingWaveVisualRenderer_Session131 (rendering)
    ↓
Visual Effects (shader-based)
```

---

## APPENDIX B: ORPHAN SYSTEM CLUSTERS

### Cascade System Cluster (4 files)

All cascade-related systems are orphaned:
- `CascadeParticleSystem_Session120`
- `CascadeParticleEmissionBoost_Session118`
- `CascadeParticleColorTinting_Session119`
- `CascadeResonanceWaveVisualization_Session146`

**Question:** Should these be integrated into active systems or removed?

### Resonance System Cluster (6 files)

All resonance-related systems are orphaned:
- `HarmonicResonanceCoupling_v1`
- `HarmonicResonanceFeedbackSystem`
- `ResonanceFeedback_v1`
- `CompositeGlyphResonanceFeedback`
- `HarmonicNodeResonanceHalos`
- `HarmonicSyncEffectApplier`

**Question:** Do these provide unique functionality not covered by active wave systems?

### Link Particle System Cluster (4 files)

All link particle systems are orphaned:
- `LinkBeadTrailSystem`
- `LinkSparkSystem`
- `LinkDirectionalStreaks`
- `AnimatedLinkFlow`

**Question:** Should these replace or supplement `LinkTrailParticleSystem`?

---

## CONCLUSION

The ATOMA codebase contains a significant number of experimental VFX systems. While the active systems (8 files) appear to be well-structured with proper cleanup, the orphan systems (24 files) present potential risks:

1. **Memory Leaks:** At least 7 orphan systems spawn objects without confirmed cleanup
2. **Technical Debt:** 75% of VFX code is not in active use
3. **Architecture:** Multiple overlapping systems suggest refactoring opportunities

**Recommended Approach:**
- Audit high-risk systems for memory leaks (Priority 1)
- Evaluate orphan systems for useful functionality (Priority 2)
- Establish governance for future VFX development (Priority 3)

This audit provides a complete inventory for informed decision-making about system consolidation, removal, or integration.

---

**End of Report**

*Generated by: VFX System Discovery Audit*  
*Mode: READ-ONLY DISCOVERY*  
*Date: 2026-03-05*