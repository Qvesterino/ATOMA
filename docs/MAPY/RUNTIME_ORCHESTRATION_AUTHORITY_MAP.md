# RUNTIME ORCHESTRATION AUTHORITY MAP
**Phase: READ-ONLY Audit**
**Generated: 2026-03-03**

---

## EXECUTIVE SUMMARY

ATOMA has **THREE concurrent orchestration systems**:

1. **FrameScheduler** - Modern, layered frequency control (83+ systems registered)
2. **SystemRegistry** - Legacy fallback (aiNodes DISABLED to prevent duplicates)
3. **Independent RAF Loops** - 123+ scattered `requestAnimationFrame` calls

**CRITICAL FINDINGS:**
- Scene graph has NO single authority (300+ direct `scene.add/remove` calls)
- Node visuals have 10+ competing writers
- Link visuals have 4+ overlapping pipelines
- Aura systems have 7+ competing authorities
- Multiple independent timing systems (RAF, Date.now, performance.now)

---

## A) AUTHORITY TABLE

| Domain | Creator | Updater | Scheduler Layer | Independent Timing? | Conflict Risk | Classification |
|--------|---------|---------|-----------------|-------------------|---------------|----------------|
| **Scene Graph** | main.js.createWorld() | NONE (distributed) | NONE | YES (300+ direct calls) | **CRITICAL** | Critical |
| worldRoot | main.js.createWorld() | WorldRuntime_v1.update() | NONE | NO | LOW | Low |
| World Switch | main.js.switchMode() | WorldRuntime_v1.switchWorld() | NONE | NO | LOW | Low |
| **Node Creation** | AINodes.spawnNode() | NONE | NONE | NO | LOW | Low |
| Node State | AINodes.update() | AINodes.update() | simulation (10Hz) | NO | MEDIUM | Medium |
| Node Visuals | EnhancedNodeModels | EnhancedNodeModels.animate() | simulation (via AINodes) | NO | **CRITICAL** | Critical |
| Node Aura | NodeAuraSystem_v1 | NodeAuraSystem_v1 | visual (30Hz) | NO | **CRITICAL** | Critical |
| Node Hologram | HologramShellAuthority | HologramShellAuthority | visual (30Hz) | NO | HIGH | High |
| **Link Creation** | NodeLinkingSystem.createLink() | NONE | NONE | NO | LOW | Low |
| Link State | NodeLinkingSystem.update() | NodeLinkingSystem.update() | SystemRegistry | NO | MEDIUM | Medium |
| Link Conduit | LinkRendererConduit | NodeLinkingSystem.conduitRenderer.update() | SystemRegistry | NO | MEDIUM | Medium |
| Link Neon | NeonLinkVisuals | NeonLinkVisuals.update() | NOT registered | NO | HIGH | High |
| Link Synergy | SynergyVFXEngine1_0 | SynergyVFXEngine1_0 | NOT registered | NO | HIGH | High |
| Link Sparks | LinkSparkSystem | NodeLinkingSystem.conduitRenderer.update() | SystemRegistry | NO | LOW | Low |
| **Aura System** | Multiple creators | 7+ updaters | Multiple layers | NO | **CRITICAL** | Critical |
| - Node Aura | NodeAuraSystem_v1 | NodeAuraSystem_v1 | visual (30Hz) | NO | **CRITICAL** | Critical |
| - Linked Aura | NodeLinkedAuraSystem | NodeLinkedAuraSystem | NOT registered | NO | HIGH | High |
| - Harmony Aura | HarmonyAuraController | HarmonyAuraController | NOT registered | NO | HIGH | High |
| - Fresnel Aura | FresnelAuraSystem | FresnelAuraSystem | NOT registered | NO | HIGH | High |
| - Primary Aura | UIPrimaryNodeAura | UIPrimaryNodeAura | visual (30Hz) | NO | HIGH | High |
| - Hub Aura | HarmonicHubAuraSystem | HarmonicHubAuraSystem | realtime (60Hz) | NO | HIGH | High |
| **Particle Systems** | 100+ creators | Multiple | Multiple layers | YES | **CRITICAL** | Critical |
| - Cascade Particles | CascadeParticleSystem | CascadeParticleSystem | visual (30Hz) | NO | MEDIUM | Medium |
| - Healing Particles | HealingParticleSystem | HealingParticleSystem | visual (30Hz) | NO | LOW | Low |
| - Trail Particles | LinkTrailParticleSystem | LinkTrailParticleSystem | visual (30Hz) | NO | LOW | Low |
| - Memory Trails | MemoryTrails | MemoryTrails | visual (30Hz) | NO | LOW | Low |
| - Quantum Illusions | QuantumIllusions | QuantumIllusions | visual (30Hz) | NO | MEDIUM | Medium |
| - Dream Depth | DreamDepthEffectManager | DreamDepthEffectManager | NOT registered | NO | MEDIUM | Medium |
| - Wave Particles | WaveParticleEmitter_v1 | WaveParticleEmitter_v1 | NOT registered | NO | HIGH | High |
| **Wave/Shader Systems** | Multiple creators | Multiple | Multiple layers | YES | HIGH | High |
| - Pulse Wave | PulseWaveSystemBridge | PulseWaveSystemBridge | visual (30Hz) | NO | MEDIUM | Medium |
| - Wave Interference | WaveInterferenceEngine | WaveInterferenceEngine | NOT registered | NO | HIGH | High |
| - Standing Wave | StandingWaveRenderer | StandingWaveRenderer | visual (30Hz) | NO | HIGH | High |
| - Wave Shader Bridge | WaveShaderBridge_v1 | WaveShaderBridge_v1 | visual (30Hz) | NO | MEDIUM | Medium |
| - Wave Travel Shader | WaveTravelShaderPack | WaveTravelShaderPack | visual (30Hz) | NO | MEDIUM | Medium |
| - Wave Dynamics | WaveDynamicsShaderPack | WaveDynamicsShaderPack | visual (30Hz) | NO | MEDIUM | Medium |
| **Glyph Systems** | Multiple creators | Multiple | Multiple layers | NO | HIGH | High |
| - Glyph System | _AtomaGlyphSystem4_0 | _AtomaGlyphSystem4_0 | visual (30Hz) | NO | MEDIUM | Medium |
| - Glyph Fusion | _GlyphLayer4_MultiFusion | _GlyphLayer4_MultiFusion | NOT registered | NO | MEDIUM | Medium |
| - Procedural Glyphs | ProceduralMeaningEngine | ProceduralMeaningEngine | visual (30Hz) | NO | MEDIUM | Medium |
| - Semantic Glyphs | _SemanticGlyphAI | _SemanticGlyphAI | visual (30Hz) | NO | MEDIUM | Medium |
| - Recursive Signals | _RecursiveGlyphSignalSystem | _RecursiveGlyphSignalSystem | visual (30Hz) | NO | LOW | Low |
| **Camera/Input** | main.js | CameraController/PlayerController | realtime (60Hz) | NO | LOW | Low |
| **Renderer** | main.js | renderer.render() | visual (30Hz) | NO | LOW | Low |
| **Metrics** | Multiple | CoreMetricsEngine | background (2Hz) | NO | LOW | Low |
| **Network Metrics** | MetricsRuntime_v1 | MetricsRuntime_v1 | background (2Hz) | NO | LOW | Low |

---

## B) CONFLICT MAP

### CRITICAL CONFLICTS

#### 1. Scene Graph (CRITICAL)
**Domain:** Scene graph management
**Conflict:** 300+ direct `scene.add/remove` calls from multiple systems

**Systems competing:**
- NodeLinkingSystem (nodes, links, selection highlights, pulses)
- NodeAuraSystem_v1 (auras)
- NeonLinkVisuals (link glows, trails, rings)
- SynergyVFXEngine1_0 (synergy effects)
- _AtomaGlyphSystem4_0 (glyphs)
- _RecursiveGlyphSignalSystem (signals)
- _HitProxySystem_v1 (hit proxies)
- _LinkGlyphFlow (glyph packets)
- _MythicRitualPlayer (ritual FX)
- _SafeLegendaryNodePack (legendary FX)
- _NodeMicroEvents (micro events)
- WaveParticleEmitter_v1 (wave particles)
- VisualUpgradeSuperpack (superpack FX)
- SystemStateOverlay (state overlays)
- CascadeParticleSystem (cascade FX)
- LinkTrailParticleSystem (trails)
- StandingWaveVisualRenderer (wave FX)
- WaveInterferencePatternSystem (interference FX)
- RegionalHarmonyZones (harmony zones)
- RegionalEquilibriumFieldSystem (field meshes)
- PulseIntersectionImpulseAdapter (impulse FX)
- PHASE5_CascadePropagationVisuals (propagation FX)
- ParticleTrailSystem (trail FX)
- NodeHierarchyVisuals (hierarchy lines)
- NodeEditor (debug markers, link preview)
- _UIPrimaryNodeAura (auras)
- _UISelectedNodeHighlight (highlights)
- _UISelectedNodeLabel (labels)
- _SafeNodePersonalityFX (personality FX)
- T2_CorruptionVisualIntegration (corruption particles)
- T2_HarmonyVisualConsumer (harmony pulses)
- ... 50+ more systems

**Risk:** Uncontrolled scene graph growth, memory leaks, visual glitches, performance degradation

---

#### 2. Node Visuals (CRITICAL)
**Domain:** Node mesh properties (visible, opacity, scale, renderOrder)
**Conflict:** 10+ systems writing to node visual properties

**Systems competing:**
- VisualAuthority (enforces properties, but RENDER_AUTHORITY_LOCKDOWN = true disables enforcement)
- EnhancedNodeModels (animates nodes)
- NodeAuraSystem_v1 (manages auras)
- HologramShellAuthoritySystem (hologram shells)
- UIPrimaryNodeAura (primary auras)
- _SafeLegendaryNodePack (legendary FX)
- _SafeNodePersonalityFX (personality FX)
- NodeHierarchyVisuals (hierarchy effects)
- _NodeMicroEvents (micro FX)
- T2_CorruptionVisualIntegration (corruption FX)
- T2_HarmonyVisualConsumer (harmony FX)

**Shared properties:**
- `node.visible`
- `node.material.opacity`
- `node.scale`
- `node.renderOrder`
- `node.material.emissive`
- `node.material.color`
- `node.userData` (multiple systems write to userData)

**Risk:** Visual flickering, contradictory states, unpredictable behavior

---

#### 3. Aura Systems (CRITICAL)
**Domain:** Node aura rendering and animation
**Conflict:** 7+ independent aura systems

**Systems competing:**
- NodeAuraSystem_v1 (visual: 30Hz)
- NodeLinkedAuraSystem (NOT registered)
- NodeLinkedAuraRenderer_Session146 (NOT registered)
- HarmonyAuraController (NOT registered)
- FresnelAuraSystem (NOT registered)
- UIPrimaryNodeAura (visual: 30Hz)
- HarmonicHubAuraSystem (realtime: 60Hz)

**Shared properties:**
- `aura.mesh.visible`
- `aura.mesh.opacity`
- `aura.mesh.scale`
- `aura.material.emissiveIntensity`
- `aura.userData`

**Risk:** Multiple auras per node, visual chaos, performance waste

---

#### 4. Link Visuals (HIGH)
**Domain:** Link rendering and effects
**Conflict:** 4+ overlapping visual pipelines

**Systems competing:**
- LinkRendererConduit (conduit renderer, SystemRegistry)
- NeonLinkVisuals (neon effects, NOT registered)
- SynergyVFXEngine1_0 (synergy FX, NOT registered)
- SynergyHighwayVisuals3D_1_0 (highways, NOT registered)
- LinkSparkSystem (sparks, updated in NodeLinkingSystem)

**Shared properties:**
- `link.group.visible`
- `link.material.opacity`
- `link.material.thickness`
- `link.material.color`
- `link.userData`

**Risk:** Duplicate rendering, visual conflicts, performance waste

---

#### 5. Particle Systems (CRITICAL)
**Domain:** Particle creation, update, and cleanup
**Conflict:** 100+ particle systems with independent lifecycles

**Systems competing:**
- CascadeParticleSystem (visual: 30Hz)
- CascadeParticleEmissionBoost (visual: 30Hz)
- CascadeParticleColorTinting (visual: 30Hz)
- HealingParticleSystem (visual: 30Hz)
- LinkTrailParticleSystem (visual: 30Hz)
- MemoryTrails (visual: 30Hz)
- QuantumIllusions (visual: 30Hz)
- WaveParticleEmitter_v1 (NOT registered)
- DreamDepthEffectManager (NOT registered)
- WaveInterferencePatternSystem (NOT registered)
- StandingWaveVisualRenderer (visual: 30Hz)
- PulseIntersectionImpulseAdapter (NOT registered)
- ParticleTrailSystem (NOT registered)
- ... 90+ more systems

**Shared properties:**
- `particle.mesh.visible`
- `particle.mesh.position`
- `particle.mesh.scale`
- `particle.userData`
- Scene graph (all call `scene.add/remove`)

**Risk:** Memory leaks, uncontrolled particle growth, performance degradation

---

#### 6. Independent RAF Loops (CRITICAL)
**Domain:** Animation timing
**Conflict:** 123+ independent `requestAnimationFrame` calls

**Systems with independent RAF:**
- W23_TRAVELING_WAVE_FX_SNIPPETS.js (multiple RAF loops)
- WEEK16_SHADER_MODE_SNIPPETS.js
- WEEK25_CASCADE_FX_SNIPPETS.js
- WORLD_SWITCH_LIFECYCLE_EXAMPLES.js
- _AtomaGlyphSystem3_0.js (transition animations)
- _AtomaGlyphSystem4_0.js (transition animations)
- _FractalHexMarker.js (animation out)
- _TASK_AUDIT_DEBUG_HELPERS.js (animation out)
- _MythicSeedGlyph.js (animation out)
- NodeHierarchyVisuals_v1.js (animation loop)
- MAIN_JS_PATCH_GLOW.js (main animate loop)
- VisualAudit.js (wait for RAF)
- ... 110+ more systems

**Timing methods:**
- `requestAnimationFrame` (primary)
- `performance.now()` (many systems)
- `Date.now()` (some legacy systems)
- `THREE.Clock.getDelta()` (many systems)

**Risk:** Duplicate updates, timing drift, unpredictable behavior, performance waste

---

### MEDIUM RISK CONFLICTS

#### 7. Wave/Shader Systems (HIGH)
**Domain:** Wave animation and shader uniform updates
**Conflict:** 6+ independent wave systems

**Systems competing:**
- PulseWaveSystemBridge (visual: 30Hz)
- WaveInterferenceEngine (NOT registered, independent timing)
- StandingWaveRenderer (visual: 30Hz)
- WaveShaderBridge_v1 (visual: 30Hz)
- WaveTravelShaderPack (visual: 30Hz)
- WaveDynamicsShaderPack (visual: 30Hz)

**Shared properties:**
- Shader uniforms (time, amplitude, frequency)
- Wave mesh properties
- Timing (some use independent RAF, some use FrameScheduler)

**Risk:** Shader uniform conflicts, timing drift

---

#### 8. Glyph Systems (HIGH)
**Domain:** Glyph rendering and animation
**Conflict:** 5+ independent glyph systems

**Systems competing:**
- _AtomaGlyphSystem4_0 (visual: 30Hz)
- _GlyphLayer4_MultiFusion (NOT registered)
- ProceduralMeaningEngine (visual: 30Hz)
- _SemanticGlyphAI (visual: 30Hz)
- _RecursiveGlyphSignalSystem (visual: 30Hz)

**Shared properties:**
- `glyph.mesh.visible`
- `glyph.mesh.scale`
- `glyph.material.opacity`
- Scene graph (all call `scene.add/remove`)

**Risk:** Visual conflicts, duplicate glyphs

---

#### 9. Harmonic Systems (HIGH)
**Domain:** Harmonic effects and resonance
**Conflict:** 8+ harmonic systems

**Systems competing:**
- HarmonicHubAuraSystem (realtime: 60Hz)
- HarmonicHubRecoveryController
- HarmonicHubResilienceController
- HarmonicHubCollapseController
- HarmonicInfluencePropagation (realtime: 60Hz)
- HarmonicResonanceCoupling (realtime: 60Hz)
- HarmonyStabilizationSystem (simulation: 10Hz)
- HarmonicCascadeAmplification (realtime: 60Hz)

**Shared properties:**
- Node harmony values
- Aura properties
- Network metrics

**Risk:** Conflicting harmonic states, visual chaos

---

## C) CLEAR OWNERSHIP RECOMMENDATIONS

### 1. SCENE ORCHESTRATION (CRITICAL)

**CURRENT STATE:**
- No single authority
- 300+ direct `scene.add/remove` calls
- Uncontrolled scene graph growth

**RECOMMENDATION:**
```
Canonical Owner: SceneOrchestrator (NEW)
- Single source of truth for ALL scene.add/remove operations
- All systems must register with SceneOrchestrator
- SceneOrchestrator manages scene graph lifecycle
- SceneOrchestrator provides API: add(obj), remove(obj), clear()

Systems to Integrate:
- All 300+ systems calling scene.add/remove
- Replace direct calls with SceneOrchestrator.add/remove

Systems to Deprecate:
- Direct scene.add/remove access (phase out over time)
```

**Implementation Priority:** CRITICAL

---

### 2. NODE SYSTEM (HIGH)

**CURRENT STATE:**
- Creator: AINodes.spawnNode() (GOOD - single owner)
- Updater: AINodes.update() (GOOD - single owner)
- Visuals: 10+ competing writers (CRITICAL)

**RECOMMENDATION:**
```
Canonical Owner: NodeVisualAuthority (UNIFIED)

Structure:
- NodeVisualAuthority owns ALL node visual properties
- EnhancedNodeModels delegates to NodeVisualAuthority
- NodeAuraSystem_v1 registers with NodeVisualAuthority
- All other node visual systems register with NodeVisualAuthority

API:
- NodeVisualAuthority.updateNodeVisual(node, visualData)
- NodeVisualAuthority.updateNodeAura(node, auraData)
- NodeVisualAuthority.updateNodeScale(node, scale)
- NodeVisualAuthority.updateNodeColor(node, color)

Systems to Integrate:
- EnhancedNodeModels (animate through API)
- NodeAuraSystem_v1 (auras through API)
- HologramShellAuthoritySystem (shells through API)
- UIPrimaryNodeAura (auras through API)
- _SafeLegendaryNodePack (FX through API)
- _SafeNodePersonalityFX (FX through API)
- NodeHierarchyVisuals (FX through API)
- _NodeMicroEvents (FX through API)
- T2_CorruptionVisualIntegration (FX through API)
- T2_HarmonyVisualConsumer (FX through API)

Systems to Deprecate:
- Direct node visual property access
- Direct node.userData writing (phase out)
```

**Implementation Priority:** CRITICAL

---

### 3. LINK SYSTEM (MEDIUM)

**CURRENT STATE:**
- Creator: NodeLinkingSystem.createLink() (GOOD)
- Updater: NodeLinkingSystem.update() (GOOD)
- Visuals: 4+ competing pipelines (HIGH)

**RECOMMENDATION:**
```
Canonical Owner: LinkVisualAuthority (NEW)

Structure:
- LinkVisualAuthority owns ALL link visual properties
- LinkRendererConduit delegates to LinkVisualAuthority
- NeonLinkVisuals registers with LinkVisualAuthority
- SynergyVFXEngine1_0 registers with LinkVisualAuthority

API:
- LinkVisualAuthority.updateLinkVisual(link, visualData)
- LinkVisualAuthority.updateLinkAura(link, auraData)
- LinkVisualAuthority.updateLinkEffect(link, effectData)

Systems to Integrate:
- LinkRendererConduit (conduit through API)
- NeonLinkVisuals (neon through API)
- SynergyVFXEngine1_0 (synergy through API)
- SynergyHighwayVisuals3D_1_0 (highways through API)

Systems to Deprecate:
- Direct link visual property access
- Independent link update loops
```

**Implementation Priority:** HIGH

---

### 4. AURA SYSTEMS (CRITICAL)

**CURRENT STATE:**
- 7+ independent aura systems
- Multiple auras per node
- Visual chaos

**RECOMMENDATION:**
```
Canonical Owner: UnifiedAuraSystem (NEW)

Structure:
- Single aura manager for all node auras
- UnifiedAuraSystem owns aura lifecycle
- Aura types: PRIMARY, LINKED, HARMONY, HUB, FRESNEL
- Each node has exactly ONE aura object with multiple layers

API:
- UnifiedAuraSystem.createAura(node, auraType)
- UnifiedAuraSystem.updateAuraLayer(node, layer, data)
- UnifiedAuraSystem.setAuraVisible(node, layer, visible)
- UnifiedAuraSystem.setAuraOpacity(node, layer, opacity)
- UnifiedAuraSystem.removeAuraLayer(node, layer)
- UnifiedAuraSystem.removeAura(node)

Aura Layers:
- PRIMARY (UIPrimaryNodeAura)
- LINKED (NodeLinkedAuraSystem)
- HARMONY (HarmonyAuraController)
- HUB (HarmonicHubAuraSystem)
- FRESNEL (FresnelAuraSystem)

Systems to Integrate:
- NodeAuraSystem_v1 (PRIMARY layer)
- NodeLinkedAuraSystem (LINKED layer)
- HarmonyAuraController (HARMONY layer)
- FresnelAuraSystem (FRESNEL layer)
- UIPrimaryNodeAura (PRIMARY layer)
- HarmonicHubAuraSystem (HUB layer)

Systems to Deprecate:
- All independent aura systems
- Direct aura.mesh access
```

**Implementation Priority:** CRITICAL

---

### 5. PARTICLE SYSTEMS (CRITICAL)

**CURRENT STATE:**
- 100+ independent particle systems
- Uncontrolled particle growth
- Memory leaks

**RECOMMENDATION:**
```
Canonical Owner: ParticleOrchestrator (NEW)

Structure:
- ParticleOrchestrator manages ALL particle lifecycles
- Particle pools for performance
- Automatic cleanup
- Particle type registration

API:
- ParticleOrchestrator.spawnParticle(type, config)
- ParticleOrchestrator.updateParticles(deltaTime)
- ParticleOrchestrator.cleanupParticles()
- ParticleOrchestrator.registerParticleType(type, factory)

Particle Types:
- CASCADE (CascadeParticleSystem)
- HEALING (HealingParticleSystem)
- TRAIL (LinkTrailParticleSystem, MemoryTrails)
- WAVE (WaveParticleEmitter_v1)
- QUANTUM (QuantumIllusions)
- DREAM (DreamDepthEffectManager)
- STANDING_WAVE (StandingWaveVisualRenderer)
- PULSE (PulseIntersectionImpulseAdapter)

Systems to Integrate:
- CascadeParticleSystem (CASCADE type)
- CascadeParticleEmissionBoost (CASCADE type)
- CascadeParticleColorTinting (CASCADE type)
- HealingParticleSystem (HEALING type)
- LinkTrailParticleSystem (TRAIL type)
- MemoryTrails (TRAIL type)
- QuantumIllusions (QUANTUM type)
- WaveParticleEmitter_v1 (WAVE type)
- DreamDepthEffectManager (DREAM type)
- StandingWaveVisualRenderer (STANDING_WAVE type)
- PulseIntersectionImpulseAdapter (PULSE type)
- ... 90+ more particle systems

Systems to Deprecate:
- All independent particle systems
- Direct scene.add/remove for particles
- Independent particle update loops
```

**Implementation Priority:** CRITICAL

---

### 6. WAVE/SHADER SYSTEMS (HIGH)

**CURRENT STATE:**
- 6+ independent wave systems
- Some use FrameScheduler, some independent
- Shader uniform conflicts

**RECOMMENDATION:**
```
Canonical Owner: WaveOrchestrator (NEW)

Structure:
- WaveOrchestrator manages ALL wave animations
- Centralized shader uniform updates
- Single timing source (FrameScheduler)

API:
- WaveOrchestrator.registerWaveSystem(name, system)
- WaveOrchestrator.updateWaves(deltaTime)
- WaveOrchestrator.updateShaderUniforms(time)

Wave Systems:
- PULSE_WAVE (PulseWaveSystemBridge)
- INTERFERENCE (WaveInterferenceEngine)
- STANDING_WAVE (StandingWaveRenderer)
- SHADER_BRIDGE (WaveShaderBridge_v1)
- TRAVEL_SHADER (WaveTravelShaderPack)
- DYNAMICS_SHADER (WaveDynamicsShaderPack)

Systems to Integrate:
- PulseWaveSystemBridge (PULSE_WAVE)
- WaveInterferenceEngine (INTERFERENCE)
- StandingWaveRenderer (STANDING_WAVE)
- WaveShaderBridge_v1 (SHADER_BRIDGE)
- WaveTravelShaderPack (TRAVEL_SHADER)
- WaveDynamicsShaderPack (DYNAMICS_SHADER)

Systems to Deprecate:
- Independent wave update loops
- Direct shader uniform updates
- Independent RAF loops for wave timing
```

**Implementation Priority:** HIGH

---

### 7. GLYPH SYSTEMS (HIGH)

**CURRENT STATE:**
- 5+ independent glyph systems
- Visual conflicts

**RECOMMENDATION:**
```
Canonical Owner: GlyphOrchestrator (NEW)

Structure:
- GlyphOrchestrator manages ALL glyph lifecycles
- Centralized glyph rendering
- Single timing source

API:
- GlyphOrchestrator.registerGlyphSystem(name, system)
- GlyphOrchestrator.updateGlyphs(deltaTime)
- GlyphOrchestrator.spawnGlyph(node, type, config)

Glyph Systems:
- MAIN (_AtomaGlyphSystem4_0)
- FUSION (_GlyphLayer4_MultiFusion)
- PROCEDURAL (ProceduralMeaningEngine)
- SEMANTIC (_SemanticGlyphAI)
- RECURSIVE (_RecursiveGlyphSignalSystem)

Systems to Integrate:
- _AtomaGlyphSystem4_0 (MAIN)
- _GlyphLayer4_MultiFusion (FUSION)
- ProceduralMeaningEngine (PROCEDURAL)
- _SemanticGlyphAI (SEMANTIC)
- _RecursiveGlyphSignalSystem (RECURSIVE)

Systems to Deprecate:
- Independent glyph update loops
- Direct glyph.mesh access
```

**Implementation Priority:** HIGH

---

### 8. INDEPENDENT RAF LOOPS (CRITICAL)

**CURRENT STATE:**
- 123+ independent `requestAnimationFrame` calls
- Timing drift
- Duplicate updates

**RECOMMENDATION:**
```
Action: ELIMINATE ALL INDEPENDENT RAF LOOPS

Steps:
1. Audit all 123+ RAF loops
2. Categorize by purpose:
   - Transition animations → FrameScheduler visual layer
   - Continuous updates → FrameScheduler appropriate layer
   - One-shot animations → Promise-based or callback-based
3. Replace with FrameScheduler.register()
4. Use central timing (deltaTime from main loop)
5. Remove performance.now() and Date.now() usage

Exception:
- Main loop in main.js (ONLY legitimate RAF loop)

Systems to Fix:
- W23_TRAVELING_WAVE_FX_SNIPPETS.js
- WEEK16_SHADER_MODE_SNIPPETS.js
- WEEK25_CASCADE_FX_SNIPPETS.js
- _AtomaGlyphSystem3_0.js
- _AtomaGlyphSystem4_0.js
- _FractalHexMarker.js
- _TASK_AUDIT_DEBUG_HELPERS.js
- _MythicSeedGlyph.js
- NodeHierarchyVisuals_v1.js
- MAIN_JS_PATCH_GLOW.js
- VisualAudit.js
- ... 110+ more systems
```

**Implementation Priority:** CRITICAL

---

## D) IMPLEMENTATION ROADMAP

### Phase 1: Critical Stabilization (Week 1-2)
1. Create SceneOrchestrator
2. Create NodeVisualAuthority
3. Create UnifiedAuraSystem
4. Create ParticleOrchestrator
5. Eliminate top 20 most critical independent RAF loops

### Phase 2: High Risk Integration (Week 3-4)
1. Integrate NodeVisualAuthority with all node visual systems
2. Integrate UnifiedAuraSystem with all aura systems
3. Integrate ParticleOrchestrator with top 50 particle systems
4. Create LinkVisualAuthority
5. Create WaveOrchestrator

### Phase 3: Medium Risk Integration (Week 5-6)
1. Integrate LinkVisualAuthority with all link visual systems
2. Integrate WaveOrchestrator with all wave systems
3. Create GlyphOrchestrator
4. Integrate GlyphOrchestrator with all glyph systems
5. Eliminate remaining independent RAF loops (100+ systems)

### Phase 4: Cleanup (Week 7-8)
1. Deprecate direct scene.add/remove access
2. Deprecate direct node/link visual property access
3. Deprecate independent aura systems
4. Deprecate independent particle systems
5. Final testing and validation

---

## E) VERIFICATION CHECKLIST

### Scene Orchestration
- [ ] SceneOrchestrator created and integrated
- [ ] All 300+ scene.add/remove calls replaced
- [ ] No direct scene.graph access
- [ ] Scene graph growth controlled
- [ ] Memory leaks eliminated

### Node System
- [ ] NodeVisualAuthority created and integrated
- [ ] All 10+ node visual systems integrated
- [ ] No direct node visual property access
- [ ] Visual conflicts eliminated
- [ ] Performance improved

### Link System
- [ ] LinkVisualAuthority created and integrated
- [ ] All 4+ link visual systems integrated
- [ ] No direct link visual property access
- [ ] Visual conflicts eliminated
- [ ] Duplicate rendering eliminated

### Aura System
- [ ] UnifiedAuraSystem created and integrated
- [ ] All 7+ aura systems integrated
- [ ] No independent aura systems
- [ ] Multiple auras per node eliminated
- [ ] Visual chaos resolved

### Particle System
- [ ] ParticleOrchestrator created and integrated
- [ ] All 100+ particle systems integrated
- [ ] No direct scene.add/remove for particles
- [ ] Automatic cleanup working
- [ ] Memory leaks eliminated

### Wave/Shader System
- [ ] WaveOrchestrator created and integrated
- [ ] All 6+ wave systems integrated
- [ ] No independent wave update loops
- [ ] Shader uniform conflicts resolved
- [ ] Timing synchronized

### Glyph System
- [ ] GlyphOrchestrator created and integrated
- [ ] All 5+ glyph systems integrated
- [ ] No independent glyph update loops
- [ ] Visual conflicts resolved

### Independent RAF Loops
- [ ] All 123+ independent RAF loops eliminated
- [ ] All timing centralized in FrameScheduler
- [ ] No performance.now() usage (except debug)
- [ ] No Date.now() usage (except debug)
- [ ] Timing drift eliminated

---

## F. RISK ASSESSMENT

### Critical Risks (Must Fix)
1. **Scene graph chaos** - Uncontrolled growth, memory leaks
2. **Node visual conflicts** - 10+ writers to same properties
3. **Aura system chaos** - 7+ independent systems, multiple auras per node
4. **Particle system explosion** - 100+ systems, uncontrolled growth
5. **Independent RAF loops** - 123+ independent timing sources

### High Risks
6. **Link visual conflicts** - 4+ overlapping pipelines
7. **Wave/shader conflicts** - Independent timing, shader uniform conflicts
8. **Glyph system conflicts** - Multiple independent systems

### Medium Risks
9. **Harmonic system conflicts** - 8+ harmonic systems
10. **Legacy SystemRegistry** - aiNodes disabled to prevent duplicates

---

## G. CONCLUSION

ATOMA's runtime orchestration is in a **CRITICAL STATE**:

- **THREE** concurrent orchestration systems (FrameScheduler, SystemRegistry, independent RAF)
- **NO** single authority for scene graph, node visuals, auras, or particles
- **300+** direct scene.add/remove calls from distributed systems
- **123+** independent RAF loops causing timing drift
- **100+** independent particle systems with uncontrolled growth

**IMMEDIATE ACTION REQUIRED:**
1. Create SceneOrchestrator
2. Create NodeVisualAuthority
3. Create UnifiedAuraSystem
4. Create ParticleOrchestrator
5. Eliminate independent RAF loops

**ESTIMATED EFFORT:** 8 weeks full-time

---

**END OF REPORT**