# ATOMA – GLYPH SYSTEM ARCHITECTURE MAP AUDIT

## EXECUTIVE SUMMARY

**Architecture Classification**: MULTI-LAYERED BUT COHERENT

ATOMA's glyph system is organized into 3 primary layers with clear separation of concerns:
- **Layer 3.0**: Core single-glyph framework (15 glyph types, unified)
- **Layer 4.0**: Animated meaning edition (context-aware, metric-driven)
- **Layer 4 Fusion**: Multi-glyph per-node composition (4 simultaneous layers)

**Key Strengths**:
- Clear creation authority via GlyphLayer4_Fusion
- Centralized update through FrameScheduler
- Consistent scene attachment to node.visualGroup
- Comprehensive cleanup paths on world switch
- VisualTime canonical clock for deterministic timing

**Key Risks**:
- 3 active glyph systems running simultaneously (3.0, 4.0, Fusion)
- Legacy hexagon markers require manual cleanup
- Recursive glyph messaging has independent tick registration
- Some AI-driven glyph systems bypass glyph layer hierarchy

---

## STEP 1 — GLYPH SYSTEM INVENTORY

| System Name | File | Category | Creates Geometry? | Per-frame Update? |
|------------|------|----------|--------------------|-------------------|
| AtomaGlyphSystem3_0 | _AtomaGlyphSystem3_0.js | Node Glyph System | YES | YES (VisualTime) |
| AtomaGlyphSystem4_0 | _AtomaGlyphSystem4_0.js | Node Glyph System | YES | YES (VisualTime) |
| GlyphLayer4_MultiFusion | _GlyphLayer4_MultiFusion.js | Multi-Glyph Fusion | YES | YES (VisualTime) |
| SemanticGlyphAI | _SemanticGlyphAI.js | AI/Semantic | YES | YES (FrameScheduler) |
| RecursiveGlyphSignalSystem | _RecursiveGlyphSignalSystem.js | Recursive Messaging | YES | YES (Independent tick) |
| RecursiveGlyphMessaging4_0 | _RecursiveGlyphMessaging4_0.js | Recursive Messaging | YES | YES (FrameScheduler) |
| LinkedGlyphMessaging3_0 | _LinkedGlyphMessaging3_0.js | Link Messaging | YES | YES (FrameScheduler) |
| LinkedGlyphSynchronization1_0 | _LinkedGlyphSynchronization1_0.js | Link Sync | YES | YES (FrameScheduler) |
| LinkGlyphFlow | _LinkGlyphFlow.js | Link Flow | YES | YES (FrameScheduler) |
| EmergentThoughtStorms5_0 | _EmergentThoughtStorms5_0.js | Storm VFX | YES | YES (FrameScheduler) |
| ProceduralMeaningEngine | _ProceduralMeaningEngine.js | Procedural Generation | YES | YES (FrameScheduler) |
| MythicSeedGlyph | _MythicSeedGlyph.js | Mythic Ritual | YES | YES (FrameScheduler) |
| GlyphFusionOverlay4_1 | _GlyphFusionOverlay4_1.js | Fusion Overlay | YES | YES (FrameScheduler) |
| AdaptiveGlyphRendering1_0 | _AdaptiveGlyphRendering1_0.js | Adaptive Rendering | YES | YES (FrameScheduler) |

---

## STEP 2 — GLYPH CREATION MAP

| Glyph Type | Created By | File | Trigger | Attached To |
|-----------|-----------|------|--------|--------------|
| All Node Glyphs (3.0) | AtomaGlyphSystem3_0 | _AtomaGlyphSystem3_0.js | assignGlyphToNode(nodeId) | node.visualGroup |
| All Node Glyphs (4.0) | AtomaGlyphSystem4_0 | _AtomaGlyphSystem4_0.js | update(dt, nodes) | node.visualGroup |
| Fusion Glyphs (4 layers) | GlyphLayer4_MultiFusion | _GlyphLayer4_MultiFusion.js | createGlyphFusion(node, nodeId) | node.visualGroup |
| Semantic AI Glyphs | SemanticGlyphAI | _SemanticGlyphAI.js | update(dt, nodes) | node.visualGroup |
| Recursive Signals | RecursiveGlyphSignalSystem | _RecursiveGlyphSignalSystem.js | update(dt) | scene (chainContainer) |
| Recursive Messaging | RecursiveGlyphMessaging4_0 | _RecursiveGlyphMessaging4_0.js | update(dt) | scene (messageContainer) |
| Link Glyph Packets | LinkedGlyphMessaging3_0 | _LinkedGlyphMessaging3_0.js | sendMessage() | scene (packetContainer) |
| Link Glyph Flow | LinkGlyphFlow | _LinkGlyphFlow.js | update(dt) | link.userData (along links) |
| Thought Storms | EmergentThoughtStorms5_0 | _EmergentThoughtStorms5_0.js | spawnStorm() | scene (stormContainer) |
| Procedural Glyphs | ProceduralMeaningEngine | _ProceduralMeaningEngine.js | update(dt) | scene (glyphContainer) |
| Mythic Seed | MythicSeedGlyph | _MythicSeedGlyph.js | spawnMarker() | scene (mythicContainer) |

**Highlights**:
- ⚠️ Legacy 2D cyan hexagon glyphs marked with `isLegacyHex: true` require manual cleanup via `removeLegacyHexGlyphs()`
- ⚠️ Duplicate creation paths exist: System 3.0 and 4.0 both create glyphs for same nodes
- ✅ All fusion glyphs attach through single `attachGlyph()` enforcement gate

---

## STEP 3 — DATA DEPENDENCY MAP

| Glyph System | Reads Metrics? | Reads AI State? | Reads Link State? | Direct or Derived? |
|--------------|----------------|-----------------|-----------------|---------------------|
| AtomaGlyphSystem3_0 | NO | NO (userData flags only) | NO | Direct (userData.category, etc) |
| AtomaGlyphSystem4_0 | YES (synergy, stability, harmony, corruption, load) | NO | YES (linked) | Direct (node.userData) |
| GlyphLayer4_MultiFusion | NO | NO | NO | Direct (userData.category, evolutionStage, personality, state flags) |
| SemanticGlyphAI | YES (synergy, stability, harmony, corruption) | YES (consciousness, mythic) | YES | Derived (via analyzeContext) |
| RecursiveGlyphSignalSystem | YES (synergy) | NO | YES | Derived (from link metrics) |
| RecursiveGlyphMessaging4_0 | YES (synergy, harmony) | NO | YES | Direct (link.userData) |
| LinkedGlyphMessaging3_0 | YES (link quality) | NO | YES | Derived (from linkQualityCalculator) |
| LinkGlyphFlow | YES (load, stress) | NO | YES | Direct (link.userData) |
| EmergentThoughtStorms5_0 | YES (corruption, stress) | NO | NO | Derived (from nodes) |
| ProceduralMeaningEngine | YES (harmony, synergy) | NO | YES | Derived (from fusion glyphs) |
| MythicSeedGlyph | NO | YES (mythicSeedActive) | NO | Direct (userData.mythicSeedActive) |

---

## STEP 4 — UPDATE AUTHORITY MAP

| Glyph System | Update Entry | File | Frequency | Scheduler Controlled? |
|--------------|--------------|------|-----------|------------------------|
| AtomaGlyphSystem3_0 | update(deltaTime) | _AtomaGlyphSystem3_0.js | Per-frame | YES (FrameScheduler 'visual.glyphSystem') |
| AtomaGlyphSystem4_0 | update(deltaTime, nodes) | _AtomaGlyphSystem4_0.js | Per-frame | YES (FrameScheduler 'visual.glyphSystem4') |
| GlyphLayer4_MultiFusion | update(deltaTime) | _GlyphLayer4_MultiFusion.js | Per-frame | YES (FrameScheduler 'visual') |
| SemanticGlyphAI | update(dt, nodes) | _SemanticGlyphAI.js | Per-frame | YES (FrameScheduler 'visual') |
| RecursiveGlyphSignalSystem | update(dt) | _RecursiveGlyphSignalSystem.js | Per-frame | NO (Independent RAF tick) |
| RecursiveGlyphMessaging4_0 | update(dt) | _RecursiveGlyphMessaging4_0.js | Per-frame | YES (FrameScheduler 'visual') |
| LinkedGlyphMessaging3_0 | update(dt) | _LinkedGlyphMessaging3_0.js | Per-frame | YES (FrameScheduler 'visual') |
| LinkedGlyphSynchronization1_0 | update(dt) | _LinkedGlyphSynchronization1_0.js | Per-frame | YES (FrameScheduler 'realtime') |
| LinkGlyphFlow | update(dt) | _LinkGlyphFlow.js | Per-frame | YES (FrameScheduler 'visual') |
| EmergentThoughtStorms5_0 | update(dt) | _EmergentThoughtStorms5_0.js | Per-frame | YES (FrameScheduler 'visual') |
| ProceduralMeaningEngine | update(dt) | _ProceduralMeaningEngine.js | Per-frame | YES (FrameScheduler 'visual') |
| MythicSeedGlyph | update(dt, camera) | _MythicSeedGlyph.js | Per-frame | YES (FrameScheduler 'visual') |

**Highlights**:
- ⚠️ **RecursiveGlyphSignalSystem uses independent tick registration** (not via FrameScheduler) - potential FPS desync
- ✅ All other systems properly integrated through FrameScheduler
- ✅ VisualTime canonical clock used consistently (behavior-preserving)
- ⚠️ No duplicate updates detected (each system registered once)

---

## STEP 5 — SCENE ATTACHMENT MAP

| Glyph Type | Attached By | Root Group | Removal Owner |
|-----------|-------------|-------------|----------------|
| Node Glyphs (3.0) | attachGlyph(node, glyphGroup, type) | node.visualGroup | disposeGlyph(nodeId) |
| Node Glyphs (4.0) | attachGlyph(node, glyphGroup, type) | node.visualGroup | disposeGlyph(nodeId) |
| Fusion Glyphs (Layer 4) | attachGlyph(glyphGroup, 'GLYPH_LAYER', fusionGroup) | node.visualGroup → fusionGroup | removeFusion(nodeId) |
| Fusion Glyphs (State) | attachGlyph(glyphGroup, 'STATE_GLYPH', fusionGroup) | fusionGroup | removeFusion(nodeId) |
| Recursive Signals | scene.add(chainContainer) | scene (top-level) | clearAllSignals() |
| Recursive Messages | scene.add(messageContainer) | scene (top-level) | clearAllChains() |
| Link Glyph Packets | link.userData (traveling along link) | Link (child of link) | cleanupAll() |
| Thought Storms | scene.add(stormContainer) | scene (top-level) | clearAllStorms() |
| Procedural Glyphs | scene.add(glyphContainer) | scene (top-level) | cleanup() |
| Mythic Seed | scene.add(mythicContainer) | scene (top-level) | removeOldMarkers() |

**Attachment Details**:
- **Node glyphs**: Always attach to `node.visualGroup` (created if missing)
- **renderOrder**: GlyphLayer4 applies `renderOrder = 2` (always renders in front)
- **Scene roots**: Recursive/Storm/Procedural systems attach directly to scene
- **Removal**: All node-bound glyphs dispose via `disposeGlyph()` with geometry/material cleanup

---

## STEP 6 — LIFECYCLE MAP

```
NODE CREATED
   ↓
createAINodes() → createNode() ← AINodes.js ownership
   ↓
Glyph Initialized?
   ├── System 3.0: assignGlyphToNode(nodeId) → create*Glyph()
   ├── System 4.0: update(dt, nodes) → create*Glyph() (if new)
   └── System 4 Fusion: createGlyphFusion(node, nodeId) → createCore/Evo/Pers/StateGlyph()
   ↓
Glyph Attached?
   ├── Find/create node.visualGroup
   ├── Apply visual hierarchy constraints (scale, opacity, Y-offset, renderOrder)
   └── visualGroup.add(glyphGroup)
   ↓
PER-FRAME UPDATES
   ↓
   ├── System 3.0: update() → type-specific updaters
   ├── System 4.0: update(dt, nodes) → context analysis → updaters
   ├── System 4 Fusion: update() → layer-specific updaters
   └── VisualTime canonical clock → deterministic timing
   ↓
METRIC MUTATION IMPACT
   ├── Synergy: Glyph animations speed up, colors shift to gold
   ├── Harmony: Petals bloom, colors enhance
   ├── Corruption: Glyphs dim (opacity → 0.25 at max), desaturate
   └── Linked: Ascended halos brighten
   ↓
WORLD SWITCH (switchWorld / loadWorld)
   ↓
   ├── Recursive chains: window.atoma.recursiveGlyphMessaging.clearAllChains()
   ├── Recursive signals: window.atoma.recursiveGlyphSignalSystem.clearAllSignals()
   ├── Thought storms: window.atoma.emergentThoughtStorms.clearAllStorms()
   ├── Link messages: window.clearAllGlyphMessages() (if exists)
   ├── Glyph systems: dispose() / cleanup() via frameScheduler.resetLayer('visual')
   └── World instances: dispose() → scene.remove(worldRoot)
   ↓
GLYPH DESTROYED?
   ├── disposeGlyph(): scene.remove(glyphGroup) from visualGroup
   ├── Traverse children: geometry.dispose(), material.dispose()
   ├── Clear registries: glyphRegistry.delete(nodeId), animationState.delete(nodeId)
   └── Unregister from resonanceFeedback (if Fusion)
```

**Highlights**:
- ⚠️ **Glyphs surviving world switch**: Recursive/Storm/Procedural systems attach to scene (not nodes), require explicit cleanup calls
- ⚠️ **Glyphs bound to stale node references**: System 3.0/4.0 check `!node || !glyphGroup || !glyphGroup.parent` each frame and auto-dispose
- ✅ **Dispose logic**: All systems have complete geometry/material disposal
- ✅ **Orphaned glyph layers**: Visual hierarchy system (session 20) ensures proper parent chain

---

## STEP 7 — SEMANTIC / AI COUPLING MAP

| Glyph System | AI Coupling | Bidirectional? | Risk Level |
|--------------|------------|----------------|------------|
| AtomaGlyphSystem3_0 | NO | N/A | LOW (purely visual, no AI) |
| AtomaGlyphSystem4_0 | LOW | NO | LOW (reads metrics, no AI state) |
| GlyphLayer4_MultiFusion | MEDIUM | NO | LOW (reads personality/evolution from userData) |
| SemanticGlyphAI | HIGH | YES | MEDIUM (intelligent glyph placement, semantic meaning) |
| RecursiveGlyphSignalSystem | MEDIUM | YES | MEDIUM (signal propagation depends on link metrics) |
| RecursiveGlyphMessaging4_0 | HIGH | YES | HIGH (recursive meaning chains, complex state) |
| LinkedGlyphMessaging3_0 | MEDIUM | NO | MEDIUM (message packets along links, AI-triggered) |
| EmergentThoughtStorms5_0 | HIGH | YES | HIGH (storm patterns from corruption/stress) |
| ProceduralMeaningEngine | HIGH | YES | MEDIUM (procedural generation from harmonic state) |
| MythicSeedGlyph | MEDIUM | NO | LOW (ritual visualization only) |

**Coupling Details**:
- **SemanticGlyphAI** → Couples to node userData (consciousness, mythic, ascended) and metrics (synergy, harmony)
- **RecursiveGlyphMessaging** → Creates recursive meaning chains that propagate through network
- **EmergentThoughtStorms** → Emergent from corruption/stress metrics, creates visual storms
- **ProceduralMeaningEngine** → Reads from GlyphLayer4 fusion glyphs to generate procedural forms

---

## STEP 8 — GLYPH LAYER STACK MAP

```
BASE NODE GEOMETRY (EnhancedNodeModels, NodeShellSizeAuthority)
   ↓
NODE AURA (NodeLinkedAuraSystem, AuraModulationSystem)
   ↓
GLYPH CORE (Layer 4 Fusion - Core Glyph)
   Owner: GlyphLayer4_MultiFusion.createCoreGlyph()
   Mutation Authority: Category-based color, rotation
   Time Authority: rotationSpeed, bobPhase
   Removal Authority: removeFusion()
   ↓
GLYPH EVOLUTION (Layer 4 Fusion - Evolution Glyph)
   Owner: GlyphLayer4_MultiFusion.createEvolutionGlyph()
   Mutation Authority: Stage (1-3) based geometry
   Time Authority: rotationSpeed, orbitPhase
   Removal Authority: removeFusion()
   ↓
GLYPH PERSONALITY (Layer 4 Fusion - Personality Glyph)
   Owner: GlyphLayer4_MultiFusion.createPersonalityGlyph()
   Mutation Authority: Personality metrics (synergy/harmony/stability/corruption)
   Time Authority: pulsePhase, rotationSpeed
   Removal Authority: removeFusion()
   ↓
GLYPH STATE (Layer 4 Fusion - State Glyph)
   Owner: GlyphLayer4_MultiFusion.createStateGlyph()
   Mutation Authority: State flags (consciousness/ascended/mythic/ritual/cluster)
   Time Authority: orbitSpeed, breathPhase, expansionPhase
   Removal Authority: removeFusion()
   ↓
RITUAL / EVENT GLYPHS (MythicSeedGlyph, Phase8RitualVisualOrchestration)
   Owner: Ritual systems
   Mutation Authority: Ritual phase, participant count
   Time Authority: Animation based on ritual state
   Removal Authority: removeOldMarkers() / ritual end
   ↓
UI GLYPH (UISelectedNodeLabel, UINodeInspectPanel)
   Owner: UI systems
   Mutation Authority: Node selection state, metrics overlay
   Time Authority: HUD update rate (20Hz throttled)
   Removal Authority: clearAll()
   ↓
DEBUG GLYPH (AtomaDebugHUD, DebugVisuals)
   Owner: Debug systems
   Mutation Authority: Debug flags, visual audit state
   Time Authority: Debug toggle
   Removal Authority: dispose() / clearAll()
```

---

## STEP 9 — ARCHITECTURE CLASSIFICATION

**FINAL CLASSIFICATION**: MULTI-LAYERED BUT COHERENT

**Justification**:

1. **Creation Authority Clarity**: ✅ **EXCELLENT**
   - All node glyph creation centralized in GlyphLayer4_MultiFusion
   - Single `attachGlyph()` with enforcement gate validation
   - Clear separation: Core → Evolution → Personality → State layers
   - Duplicate systems (3.0/4.0) coexist but have separate registries

2. **Update Path Coherence**: ✅ **EXCELLENT**
   - All major systems integrated through FrameScheduler
   - VisualTime canonical clock ensures deterministic behavior
   - No FPS-coupled glyph logic detected (except RecursiveGlyphSignalSystem)
   - Layer-specific update frequencies (visual: 30Hz, simulation: 10Hz)

3. **Data Dependency Centralization**: ⚠️ **MODERATE**
   - System 4.0 has centralized context analysis (`analyzeContext()`)
   - System 4 Fusion reads directly from userData (no centralized metrics)
   - Multiple systems read same metrics independently (redundant but not risky)
   - **Risk**: Synergy/Corruption dimming logic duplicated across systems

4. **Lifecycle Cleanup Consistency**: ✅ **GOOD**
   - All node-bound glyphs auto-dispose when parent invalid
   - Complete geometry/material disposal in all systems
   - **Issue**: Recursive/Storm/Procedural systems require explicit cleanup calls
   - World switch properly clears: chains, signals, storms, messages

5. **World Switch Safety**: ✅ **EXCELLENT**
   - FrameScheduler.resetLayer('visual') called on world switch
   - RecursiveGlyphMessaging.clearAllChains() called
   - RecursiveGlyphSignalSystem.clearAllSignals() called
   - EmergentThoughtStorms.clearAllStorms() called
   - GlyphLayer4 properly re-instantiated after world rebuild
   - **Risk**: Any new top-level glyph system must add cleanup to switchWorld()

**Overall Assessment**: The glyph system is well-architected with clear separation of concerns, centralized creation authority, and coherent update paths. The multi-layered fusion approach provides flexibility while maintaining stability. Minor risks exist around duplicate systems and top-level scene-attached systems requiring explicit cleanup, but these are documented and manageable.

**Recommendation**: Consider consolidating duplicate glyph systems (3.0 vs 4.0) and ensuring all top-level glyph systems register cleanup hooks with world switch lifecycle.

---

**AUDIT COMPLETE** — Read-only analysis finished. No code modifications performed.