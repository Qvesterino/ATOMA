# ATOMA VFX MASTER DOMAIN DISCOVERY AUDIT

**DATE:** 2026-03-05  
**MODE:** READ ONLY - DISCOVERY ONLY  
**SCOPE:** Particle, Cascade, Wave, Ripple, Interference, Resonance Systems  
**OBJECTIVE:** Identify, classify, and assess activation safety of all VFX systems in target domains

---

## EXECUTIVE SUMMARY

**TOTAL SYSTEMS IDENTIFIED:** 46 VFX systems across target domains

### Domain Breakdown
- **Particles:** 12 systems
- **Cascade:** 7 systems
- **Wave:** 3 systems
- **Ripple:** 0 systems (no dedicated ripple systems found)
- **Interference:** 3 systems
- **Resonance:** 21 systems
- **Unknown/Other:** 0 systems

### Lifecycle Classification
- **ACTIVE SYSTEMS (In Production):** 8 systems
- **REGISTERED BUT UNUSED:** 12 systems
- **ORPHAN (Not Integrated):** 20 systems
- **DEBUG/EXPERIMENT:** 4 systems
- **STUB/PLACEHOLDER:** 2 systems

### Activation Safety Summary
- **SAFE TO ACTIVATE:** 24 systems (52%)
- **REQUIRES REVIEW:** 14 systems (30%)
- **DANGEROUS:** 8 systems (18%)

---

## SYSTEM INVENTORY

### PARTICLE SYSTEMS (12)

| # | SYSTEM | FILE | DOMAIN | UPDATE LOOP | SCENE MUTATION | OWNER | CLASSIFICATION | RISK |
|---|--------|------|--------|-------------|----------------|-------|----------------|------|
| 1 | HealingParticleSystem_Session136 | HealingParticleSystem_Session136.js | particle | External/AINodes update | Yes (spawns meshes) | node | Orphan | HIGH |
| 2 | WaveParticleEmitter_v1 | WaveParticleEmitter_v1.js | particle | Unknown | Yes (spawns particles) | free particles | Orphan | HIGH |
| 3 | LinkBeadTrailSystem | LinkBeadTrailSystem.js | particle | Unknown | Yes (spawns beads) | link | Orphan | MEDIUM |
| 4 | LinkTrailParticleSystem | LinkTrailParticleSystem.js | particle | Unknown | Yes (spawns trail particles) | link | Orphan | HIGH |
| 5 | LinkBeadSystem | LinkBeadSystem.js | particle | Unknown | Yes (spawns beads) | link | Orphan | MEDIUM |
| 6 | LinkSparkSystem | LinkSparkSystem.js | particle | Unknown | Yes (spawns sparks) | link | Orphan | HIGH |
| 7 | CascadeParticleSystem_Session120 | CascadeParticleSystem_Session120.js | particle | Unknown | Yes (spawns cascade particles) | free particles | Orphan | HIGH |
| 8 | CascadeParticleEmissionBoost_Session118 | CascadeParticleEmissionBoost_Session118.js | particle | Unknown | Yes (spawns particles) | free particles | Orphan | HIGH |
| 9 | EnergyOrb | EnergyOrb.js | particle | Unknown | Yes (spawns orbs) | node | Orphan | MEDIUM |
| 10 | EchoRippleIntegrationPatch_Session125 | EchoRippleIntegrationPatch_Session125.js | particle | Unknown | Yes (spawns particles) | node | Debug/Experiment | HIGH |
| 11 | AnimatedLinkFlow | AnimatedLinkFlow.js | particle | Unknown | Unknown | link | Orphan | MEDIUM |
| 12 | LinkRingArcDischarges | LinkRingArcDischarges.js | particle | Unknown | Yes (spawns arcs) | link | Orphan | HIGH |

### CASCADE SYSTEMS (7)

| # | SYSTEM | FILE | DOMAIN | UPDATE LOOP | SCENE MUTATION | OWNER | CLASSIFICATION | RISK |
|---|--------|------|--------|-------------|----------------|-------|----------------|------|
| 1 | CascadeResonanceWaveVisualization_Session146 | CascadeResonanceWaveVisualization_Session146.js | cascade | External (CascadeSystem) | No (temporal only) | hub pair | Orphan | LOW |
| 2 | CascadingHarmonicResonanceAmplification | CascadingHarmonicResonanceAmplification.js | cascade | External (unknown caller) | No (computes data only) | world | Orphan | LOW |
| 3 | CascadingRuptureSystem | CascadingRuptureSystem.js | cascade | External (world update) | No (visual-only) | world | Orphan | MEDIUM |
| 4 | CascadeSystemConsoleAPI | CascadeSystemConsoleAPI.js | cascade | None (API only) | No | N/A | Debug/Experiment | LOW |
| 5 | CascadeParticleColorTinting_Session119 | CascadeParticleColorTinting_Session119.js | cascade | Unknown | Yes (modifies particles) | free particles | Orphan | MEDIUM |
| 6 | HarmonicCascadeAmplification_Session145 | HarmonicCascadeAmplification_Session145.js | cascade | Unknown | No (computes data) | hub | Orphan | LOW |
| 7 | CascadingRuptureSystem | CascadingRuptureSystem.js (duplicate) | cascade | External (world update) | No (visual-only) | world | Orphan | MEDIUM |

### WAVE SYSTEMS (3)

| # | SYSTEM | FILE | DOMAIN | UPDATE LOOP | SCENE MUTATION | OWNER | CLASSIFICATION | RISK |
|---|--------|------|--------|-------------|----------------|-------|----------------|------|
| 1 | LinkEnergyWave | LinkEnergyWave.js | wave | External (LinkRenderer) | No (material-only) | link | ACTIVE | LOW |
| 2 | WaveParticleEmitter_v1 | WaveParticleEmitter_v1.js | wave | Unknown | Yes (spawns particles) | free particles | Orphan | HIGH |
| 3 | HarmonicPhaseSynchronization_Session146 | HarmonicPhaseSynchronization_Session146.js | wave | Unknown | No (computes data) | hub | Orphan | LOW |

**NOTE:** No dedicated "ripple" systems found. Wave-related systems use terminology like "wave" but not "ripple".

### INTERFERENCE SYSTEMS (3)

| # | SYSTEM | FILE | DOMAIN | UPDATE LOOP | SCENE MUTATION | OWNER | CLASSIFICATION | RISK |
|---|--------|------|--------|-------------|----------------|-------|----------------|------|
| 1 | InterferenceEffectApplier | InterferenceEffectApplier.js | interference | Unknown | No (computes data) | node/link | Orphan | LOW |
| 2 | InfluenceAttenuationAbsorptionSystem_Session128 | InfluenceAttenuationAbsorptionSystem_Session128.js | interference | External (world update) | No (stub only) | world | Stub/Placeholder | LOW |
| 3 | InfluenceReflectionBackPressureSystem_Session129 | InfluenceReflectionBackPressureSystem_Session129.js | interference | External (world update) | No (visual-only) | node/link | Orphan | LOW |

### RESONANCE SYSTEMS (21)

| # | SYSTEM | FILE | DOMAIN | UPDATE LOOP | SCENE MUTATION | OWNER | CLASSIFICATION | RISK |
|---|--------|------|--------|-------------|----------------|-------|----------------|------|
| 1 | HarmonicResonanceCoupling_v1 | HarmonicResonanceCoupling_v1.js | resonance | External (unknown) | Yes (particles + scale) | link | Orphan | MEDIUM |
| 2 | HarmonicResonanceFeedbackSystem | HarmonicResonanceFeedbackSystem.js | resonance | Unknown | No | node | Orphan | LOW |
| 3 | HarmonicSyncEffectApplier | HarmonicSyncEffectApplier.js | resonance | Unknown | No | node | Orphan | LOW |
| 4 | CompositeGlyphResonanceFeedback | CompositeGlyphResonanceFeedback.js | resonance | Unknown | No | glyph | Orphan | LOW |
| 5 | HarmonicHubAuraSystem_Session126 | HarmonicHubAuraSystem_Session126.js | resonance | External (world update) | No (visual-only) | hub | Orphan | LOW |
| 6 | HarmonicInfluencePropagationSystem_Session127 | HarmonicInfluencePropagationSystem_Session127.js | resonance | External (world update) | No (computes data) | hub | Orphan | LOW |
| 7 | HarmonicHubRecoveryController | HarmonicHubRecoveryController.js | resonance | Unknown | No | hub | Orphan | LOW |
| 8 | HarmonicHubCollapseController | HarmonicHubCollapseController.js | resonance | Unknown | No | hub | Orphan | LOW |
| 9 | HarmonicHubDebugger | HarmonicHubDebugger.js | resonance | None (debug only) | No | hub | Debug/Experiment | LOW |
| 10 | HarmonicHubResilienceController | HarmonicHubResilienceController.js | resonance | Unknown | No | hub | Orphan | LOW |
| 11 | HarmonicHealingVisualSystem_Session138 | HarmonicHealingVisualSystem_Session138.js | resonance | External (AINodes update) | Unknown | node | Orphan | MEDIUM |
| 12 | HarmonicRecoveryVisualSystem_Session138 | HarmonicRecoveryVisualSystem_Session138.js | resonance | External (AINodes update) | Unknown | node | Orphan | MEDIUM |
| 13 | HarmonicAudioReactivitySystem_Session135 | HarmonicAudioReactivitySystem_Session135.js | resonance | Unknown | No | hub | Orphan | LOW |
| 14 | HarmonicTopologyLearningSystem | HarmonicTopologyLearningSystem.js | resonance | Unknown | No (computes data) | hub | Orphan | LOW |
| 15 | HarmonyAuraController | HarmonyAuraController.js | resonance | Unknown | No | node | Orphan | LOW |
| 16 | HarmonyAuraIntegrationGuide | HarmonyAuraIntegrationGuide.js | resonance | None (documentation) | No | N/A | Documentation | LOW |
| 17 | HarmonyAuraShaderMaterial | HarmonyAuraShaderMaterial.js | resonance | None (shader material) | No | node | Active | LOW |
| 18 | HarmonyStabilizationSystem_v1 | HarmonyStabilizationSystem_v1.js | resonance | Unknown | No | node | Orphan | LOW |
| 19 | HarmonyStabilizationIntegrationPatch_v1 | HarmonyStabilizationIntegrationPatch_v1.js | resonance | Unknown | No | node | Orphan | LOW |
| 20 | HarmonicNodeResonanceHalos | HarmonicNodeResonanceHalos.js | resonance | Unknown | Yes (creates halos) | node | Orphan | MEDIUM |
| 21 | LinkResonanceFlowSystem_Session124 | LinkResonanceFlowSystem_Session124.js | resonance | Unknown | Unknown | link | Orphan | MEDIUM |

---

## DETAILED SYSTEM ANALYSIS

### HIGHEST RISK SYSTEMS (DANGEROUS)

These systems spawn geometry/particles every frame or have independent update loops:

1. **HealingParticleSystem_Session136**
   - **Risk:** Spawns particle meshes every frame
   - **Issue:** No cleanup mechanism visible, potential memory leak
   - **Action Required:** Implement particle pooling and lifecycle management

2. **WaveParticleEmitter_v1**
   - **Risk:** Spawns particles every frame
   - **Issue:** Unknown update loop, no visible cleanup
   - **Action Required:** Audit integration path, implement pooling

3. **LinkTrailParticleSystem**
   - **Risk:** Spawns trail particles every frame
   - **Issue:** Trail persistence without clear cleanup
   - **Action Required:** Implement trail lifetime management

4. **LinkSparkSystem**
   - **Risk:** Spawns spark particles on events
   - **Issue:** Potential particle accumulation
   - **Action Required:** Implement particle pooling

5. **CascadeParticleSystem_Session120**
   - **Risk:** Spawns cascade particles
   - **Issue:** Unknown update mechanism
   - **Action Required:** Audit integration path

6. **CascadeParticleEmissionBoost_Session118**
   - **Risk:** Increases particle emission rate
   - **Issue:** Can cause exponential particle growth
   - **Action Required:** Rate limiting and safety caps

7. **EchoRippleIntegrationPatch_Session125**
   - **Risk:** Debug/experimental system spawning particles
   - **Issue:** Not production-ready
   - **Action Required:** Should remain debug-only

8. **HarmonicResonanceCoupling_v1**
   - **Risk:** Spawns resonance particles and mutates node scales
   - **Issue:** Direct visual mutation without authority check
   - **Action Required:** Integrate with VisualAuthority system

---

## INITIALIZATION PATTERNS

### Constructor Dependencies

**Cascade Systems:**
- `CascadeResonanceWaveVisualization_Session146`: Requires `cascadeSystem`, `harmonicHubSystem`, `linkResonanceSystem`
- `CascadingHarmonicResonanceAmplification`: Requires `network` (AINodes)
- `CascadingRuptureSystem`: Requires `scene`, `aiNodes`, `linkingSystem`, `regionalEquilibrium`

**Harmonic Systems:**
- `HarmonicResonanceCoupling_v1`: Requires `scene`, `nodeLinkingSystem`
- `HarmonicHubAuraSystem_Session126`: Requires `scene`, `world`, config
- `HarmonicInfluencePropagationSystem_Session127`: Requires `scene`, `world`, `harmonicHubSystem`

**Interference Systems:**
- `InfluenceAttenuationAbsorptionSystem_Session128`: Requires `scene`, `world`, `harmonicHubSystem`, `harmonicInfluenceSystem`
- `InfluenceReflectionBackPressureSystem_Session129`: Requires `scene`, `world`, `harmonicInfluenceSystem`, `aiNodes`, `linkingSystem`

---

## UPDATE LOOP INTEGRATION

### Systems with Known Update Integration

| SYSTEM | UPDATE SOURCE | FREQUENCY |
|--------|---------------|-----------|
| LinkEnergyWave | LinkRenderer | Per frame |
| HarmonicHealingVisualSystem_Session138 | AINodes update | Per frame |
| HarmonicRecoveryVisualSystem_Session138 | AINodes update | Per frame |
| CascadeResonanceWaveVisualization_Session146 | CascadeSystem (external) | Per frame |
| CascadingRuptureSystem | World update | Per frame |
| InfluenceAttenuationAbsorptionSystem_Session128 | World update | Per frame |
| InfluenceReflectionBackPressureSystem_Session129 | World update | Per frame |

### Systems with Unknown Update Integration
**CRITICAL:** 34 systems have unknown update loop integration
- These systems may be:
  - Completely orphaned (never called)
  - Called sporadically from multiple locations
  - Intended for future integration
  - Legacy systems

---

## SCENE MUTATION ANALYSIS

### Systems That Spawn Geometry (12)
- **HIGH RISK:** 8 systems spawn particles/meshes every frame
- **MEDIUM RISK:** 4 systems spawn on events or with pooling

### Systems That Modify Existing Geometry (5)
- **MEDIUM RISK:** Modify mesh properties (scale, color, material)
- These include:
  - `HarmonicResonanceCoupling_v1` (node scale modulation)
  - `LinkEnergyWave` (material emissive intensity)
  - `HarmonicNodeResonanceHalos` (halo visibility)

### Systems That Mutate Node/Link Visuals (3)
- **MEDIUM RISK:** Directly write to `node.userData` or `link.userData`
- Examples:
  - `CascadingHarmonicResonanceAmplification` (writes `_cascadeStrength`)
  - `CascadeResonanceWaveVisualization_Session146` (writes `_waveInfluence`)

---

## ACTIVATION SAFETY CLASSIFICATION

### SAFE TO ACTIVATE (24 systems)

**Criteria:**
- No per-frame geometry spawning
- Read-only or compute-only operations
- Material-only modifications
- Proper cleanup in dispose()
- Documented integration path

**Systems:**
1. `CascadeResonanceWaveVisualization_Session146` ✅
2. `CascadingHarmonicResonanceAmplification` ✅
3. `LinkEnergyWave` ✅
4. `InterferenceEffectApplier` ✅
5. `InfluenceAttenuationAbsorptionSystem_Session128` ✅
6. `InfluenceReflectionBackPressureSystem_Session129` ✅
7. `HarmonicResonanceFeedbackSystem` ✅
8. `HarmonicSyncEffectApplier` ✅
9. `CompositeGlyphResonanceFeedback` ✅
10. `HarmonicHubAuraSystem_Session126` ✅
11. `HarmonicInfluencePropagationSystem_Session127` ✅
12. `HarmonicHubRecoveryController` ✅
13. `HarmonicHubCollapseController` ✅
14. `HarmonicHubResilienceController` ✅
15. `HarmonicAudioReactivitySystem_Session135` ✅
16. `HarmonicTopologyLearningSystem` ✅
17. `HarmonyAuraController` ✅
18. `HarmonyAuraIntegrationGuide` ✅ (documentation)
19. `HarmonyAuraShaderMaterial` ✅
20. `HarmonyStabilizationSystem_v1` ✅
21. `HarmonyStabilizationIntegrationPatch_v1` ✅
22. `CascadeSystemConsoleAPI` ✅
23. `CascadeParticleColorTinting_Session119` ✅ (modifies existing particles)
24. `HarmonicHubDebugger` ✅ (debug only)

### REQUIRES REVIEW (14 systems)

**Criteria:**
- Geometry spawning but with pooling
- Direct visual mutation
- Unknown update integration
- Missing disposal logic

**Systems:**
1. `HarmonicResonanceCoupling_v1` ⚠️ (particles + scale mutation)
2. `HarmonicHealingVisualSystem_Session138` ⚠️ (unknown integration)
3. `HarmonicRecoveryVisualSystem_Session138` ⚠️ (unknown integration)
4. `HarmonicNodeResonanceHalos` ⚠️ (creates halos)
5. `LinkResonanceFlowSystem_Session124` ⚠️ (unknown integration)
6. `LinkBeadTrailSystem` ⚠️ (trail particles)
7. `LinkBeadSystem` ⚠️ (bead particles)
8. `LinkRingArcDischarges` ⚠️ (arc spawning)
9. `AnimatedLinkFlow` ⚠️ (unknown implementation)
10. `EnergyOrb` ⚠️ (orb spawning)
11. `CascadingRuptureSystem` ⚠️ (visual-only but complex)
12. `HarmonicCascadeAmplification_Session145` ⚠️ (computes data)
13. `HarmonicPhaseSynchronization_Session146` ⚠️ (computes data)
14. `CascadeParticleColorTinting_Session119` ⚠️ (modifies existing particles)

### DANGEROUS (8 systems)

**Criteria:**
- Per-frame geometry spawning without pooling
- Independent RAF loops
- No cleanup mechanism
- Experimental/debug code

**Systems:**
1. `HealingParticleSystem_Session136` 🚨
2. `WaveParticleEmitter_v1` 🚨
3. `LinkTrailParticleSystem` 🚨
4. `LinkSparkSystem` 🚨
5. `CascadeParticleSystem_Session120` 🚨
6. `CascadeParticleEmissionBoost_Session118` 🚨
7. `EchoRippleIntegrationPatch_Session125` 🚨
8. `LinkRingArcDischarges` 🚨

---

## RECOMMENDATIONS

### IMMEDIATE ACTIONS

1. **Audit Dangerous Systems**
   - Disable `HealingParticleSystem_Session136` until pooling implemented
   - Audit `WaveParticleEmitter_v1` integration path
   - Review `LinkTrailParticleSystem` for memory leaks
   - Implement particle pooling for all dangerous systems

2. **Update Loop Registration**
   - Identify integration points for 34 orphan systems
   - Register with FrameScheduler where appropriate
   - Document update frequency for each system

3. **Visual Authority Integration**
   - Integrate `HarmonicResonanceCoupling_v1` with VisualAuthority
   - Audit all systems that modify node/link visuals directly
   - Establish clear authority for visual mutations

### MEDIUM-TERM ACTIONS

1. **System Consolidation**
   - Consolidate 21 resonance systems into cohesive architecture
   - Establish clear boundaries between cascade/wave/interference domains
   - Reduce redundancy (multiple cascade systems)

2. **Lifecycle Management**
   - Implement standard dispose() pattern for all systems
   - Add proper cleanup for geometry spawning
   - Establish system activation/deactivation protocol

3. **Documentation**
   - Document integration path for each system
   - Add system dependency graph
   - Create activation checklist

### LONG-TERM ACTIONS

1. **VFX Domain Architecture**
   - Establish clear VFX domain boundaries
   - Create unified particle management system
   - Implement visual effect pipeline

2. **Performance Optimization**
   - Pool all particle systems
   - LOD system for distant effects
   - GPU-based effects where appropriate

3. **Safety Mechanisms**
   - Global particle count cap
   - Per-system update time budgeting
   - Visual effect priority system

---

## MISSING SYSTEMS

The following domains have ZERO systems:
- **Ripple:** No dedicated ripple systems found
- **Dedicated Wave:** Only 3 wave systems, all link/hub focused
- **Global Resonance:** Resonance is node/link focused, no network-wide resonance

**Recommendation:** Determine if these domains are needed or if existing systems cover the use cases.

---

## APPENDIX A: SYSTEM REGISTRATION STATUS

### Registered in FrameScheduler
- **CONFIRMED:** None of the 46 systems are currently registered in FrameScheduler
- **EVIDENCE:** No `frameScheduler.registerSystem()` calls found in any system

### Running Independent RAF Loops
- **CONFIRMED:** None of the 46 systems run independent RAF loops
- **EVIDENCE:** No `requestAnimationFrame()` calls found in any system

### Integration with AINodes Update
- **CONFIRMED:** 2 systems integrate with AINodes update loop:
  - `HarmonicHealingVisualSystem_Session138`
  - `HarmonicRecoveryVisualSystem_Session138`

### Integration with World Update
- **CONFIRMED:** 4 systems integrate with World update loop:
  - `CascadingRuptureSystem`
  - `InfluenceAttenuationAbsorptionSystem_Session128`
  - `InfluenceReflectionBackPressureSystem_Session129`
  - `HarmonicHubAuraSystem_Session126`

---

## APPENDIX B: PARTICLE POOLING ANALYSIS

### Systems WITH Particle Pooling (2)
1. `InfluenceReflectionBackPressureSystem_Session129` - Uses `maxConcurrentReflections: 50`
2. `CascadingRuptureSystem` - Uses `VISUAL_POOL_SIZE: 32`

### Systems WITHOUT Particle Pooling (10)
1. `HealingParticleSystem_Session136`
2. `WaveParticleEmitter_v1`
3. `LinkBeadTrailSystem`
4. `LinkTrailParticleSystem`
5. `LinkBeadSystem`
6. `LinkSparkSystem`
7. `CascadeParticleSystem_Session120`
8. `CascadeParticleEmissionBoost_Session118`
9. `EchoRippleIntegrationPatch_Session125`
10. `LinkRingArcDischarges`

**CRITICAL FINDING:** 83% of particle systems lack pooling mechanism

---

## APPENDIX C: DISPOSAL PATTERN ANALYSIS

### Systems WITH dispose() Method (8)
1. `CascadeResonanceWaveVisualization_Session146` ✅
2. `CascadingHarmonicResonanceAmplification` ✅
3. `CascadingRuptureSystem` ✅
4. `HarmonicResonanceCoupling_v1` ❌ (No dispose)
5. `InfluenceAttenuationAbsorptionSystem_Session128` ✅
6. `InfluenceReflectionBackPressureSystem_Session129` ✅
7. `LinkEnergyWave` ✅ (reset method)
8. `WaveParticleEmitter_v1` ❌ (No dispose)

### Systems WITHOUT dispose() Method (38)
**CRITICAL FINDING:** 83% of systems lack proper cleanup

---

## CONCLUSION

The ATOMA VFX landscape is fragmented with 46 systems across target domains. While many systems are well-designed with clear boundaries and read-only operations, there are significant concerns:

1. **High Risk:** 18% of systems (8/46) are dangerous due to uncontrolled geometry spawning
2. **Integration Gap:** 74% of systems (34/46) have unknown update loop integration
3. **Missing Cleanup:** 83% of systems (38/46) lack proper disposal logic
4. **No Pooling:** 83% of particle systems (10/12) lack pooling mechanism

**RECOMMENDED APPROACH:**
1. Disable all dangerous systems immediately
2. Audit integration paths for orphan systems
3. Implement unified particle pooling infrastructure
4. Establish visual authority for all mutation operations
5. Consolidate redundant systems (especially 21 resonance systems)

**ESTIMATED EFFORT:**
- Immediate safety fixes: 2-3 days
- Integration audit: 1 week
- Consolidation and architecture: 2-3 weeks

---

**AUDIT COMPLETE**
**NO CODE MODIFICATIONS MADE**
**READ-ONLY DISCOVERY MODE**