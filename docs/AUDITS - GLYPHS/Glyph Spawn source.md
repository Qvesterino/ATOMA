**Glyph Spawn Functions**
- `_GlyphLayer4_MultiFusion.js` → `createGlyphFusion`, `createGlyphFusionsForNodes`, layer creators `createCoreGlyph`, `createEvolutionGlyph`, `createPersonalityGlyph`, `createStateGlyph`, `createFallbackGlyph`.
- `_LinkGlyphFlow.js` → `createGlyphPacket` (called from `createPacketsForLink` / `refreshPacketsForLinks`), plus `forceRefresh` → rebuilds packets.
- `_LinkedGlyphMessaging3_0.js` → `spawnMessage` (mesh per link message), `despawnMessage`.
- `_RecursiveGlyphSignalSystem.js` → `_spawnSignal` (called by `triggerAttentionSignal` and `triggerResidueSignal`).
- `_AtomaGlyphSystem3_0.js` → `assignGlyphToNode`, `assignGlyphsToNodes`, individual creators (`createAIConsciousnessGlyph`, `createMythicSeedGlyph`, `createAscendedNodeGlyph`, `createEvolutionStage1/2/3Glyph`, `createPersonality*Glyph`, `createEvent*Glyph`, `createNeutralFallbackGlyph`).
- `_AtomaGlyphSystem4_0.js` → same creator set as 3.0 (AI, MythicSeed, Ascended, Evolution1/2/3, Personality*, Event*), `attachGlyph`, `removeGlyph`.
- `_GlyphFusionOverlay4_1.js` → `createOverlayGlyph` (wraps existing fusion glyphs for semantic overlay).
- `_ProceduralMeaningEngine.js` → `createProceduralGlyphForNode` (builds transient procedural glyph meshes from SemanticGlyphAI meaning).
- `_MythicSeedGlyph.js` → `createMythicSeedGlyph` (standalone seed marker).
- `_CompositeGlyphResonanceFeedback.js` → `registerCompositeGlyph` (spawns resonance aura mesh around fusion glyph).
- `_GlyphFusionZone.js` → `spawn` method on zone composites (used by resonance feedback).
- `_CompositeGlyphGenerator.js` → `createCompositeGlyph` (generates fusion-style glyph mesh).
- `_AdaptiveGlyphRendering1_0.js` → `createGlyphInstance` (instanced helper for adaptive rendering).
- `_LinkedGlyphSynchronization1_0.js` → `spawnGlyphRing` (sync ring around linked nodes).

**Systems Creating Glyph Meshes (Three.js use)**
- GlyphLayer4 (core runtime): `THREE.Group` for fusion container; per-layer meshes use `MeshBasicMaterial` + `OctahedronGeometry`, `BufferGeometry` line loops, small torus/sphere shapes.
- LinkGlyphFlow: pooled `Mesh` packets using shared `BufferGeometry` shapes (circle/triangle/lotus/hex/shard/diamond/ring), `MeshBasicMaterial`.
- LinkedGlyphMessaging3_0: message glyphs as grouped `Mesh`/`Line` meshes (cone, ring, trail).
- RecursiveGlyphSignalSystem: signals as `Mesh` (tetra/prism shards) plus `LineSegments`; created in `_spawnSignal`.
- AtomaGlyphSystem3_0 / 4_0: per-node `Group` glyphs composed of `LineSegments`, `Mesh` (torus, cone, octahedron, sphere), `LineLoop`.
- ProceduralMeaningEngine: procedural glyphs built from `THREE.Mesh` + parametric `BufferGeometry`.
- CompositeGlyphResonanceFeedback / GlyphFusionZone: `Mesh` and `InstancedMesh` fields for resonance halos.
- AdaptiveGlyphRendering1_0: `InstancedMesh` via `createGlyphInstance`.

**Runtime Triggers (event → spawn function)**
- Node creation/initial load: `main.js` calls `glyphLayer4.createGlyphFusionsForNodes(aiNodes.nodes)` and registers `aiNodes.registerPostSpawnObserver('glyph-layer-fusion', createGlyphFusion)` → triggers fusion glyph spawn per node.
- Link traffic: `LinkGlyphFlow.update` builds packets via `createGlyphPacket` for each active link; packet count scales with link strength/synergy.
- Link message transport: `LinkedGlyphMessaging3_0.update` spawns messages per link track when under `maxMessagesPerLink`; messages traverse link direction.
- Attention/selection/hover/link create/remove: `RecursiveGlyphSignalSystem` hooks `selectionCore.onNodeSelected`, `linkingSystem.onLinkCreated/Removed`, hover polling → calls `triggerAttentionSignal` / `triggerResidueSignal` → `_spawnSignal`.
- Procedural meaning: `ProceduralMeaningEngine.update` reads SemanticGlyphAI meaning per node and calls `createProceduralGlyphForNode` for qualifying nodes (semantic events / meaning change).
- Fusion resonance: `GlyphLayer4` registers composite glyphs with `CompositeGlyphResonanceFeedback`; resonance zones call `GlyphFusionZone.spawn` when zones activate.
- Manual/debug triggers: global helpers in `main.js` (`createGlyph`, `createGlyph4`) call creator functions in AtomaGlyphSystem3_0/4_0; `autoCreateGlyphFusions`, `refreshLinkGlyphFlow`, debug commands for signals/messages.

**Scheduler Context**
- `FrameScheduler.visual` (main.js): runs `glyphLayer4.update`, `semanticGlyphAI.update`, `linkGlyphFlow.update`, `linkedGlyphMessaging.update`, `recursiveGlyphMessaging.update`, `recursiveGlyphSignalSystem.update` (registered inside system), `glyphSystem.update` (3.0), `glyphSystem4.update` (4.0). Guarded via `regGuard` entries (`visual.glyphLayer4`, `visual.semanticGlyphAI`, `linkedGlyphMessaging`, `recursiveGlyphMessaging`, `recursiveGlyphSignalSystem`, `linkGlyphFlow`, `visual.glyphSystem`, `visual.glyphSystem4`).
- Event-based without scheduler loops: `aiNodes.registerPostSpawnObserver` for late node glyph fusion; linkingSystem callbacks inside RecursiveGlyphSignalSystem for link events.

**Dead / Legacy / Duplicate Paths**
- MegaGlyphSystem.js and MegaGlyphConduit.js are not referenced by `main.js` (no runtime instantiation) → legacy aggregates (dead spawn path).
- AtomaGlyphSystem3_0 and AtomaGlyphSystem4_0 are instantiated and ticked but never automatically assign glyphs; creation only reachable via manual debug helpers → effectively dormant.
- AdaptiveGlyphRendering1_0, CompositeGlyphGenerator, GlyphFusionOverlay4_1, CompositeGlyphResonanceFeedback used only as optional helpers; core glyph spawn handled by GlyphLayer4.
- `_AtomaGlyphSystem3_0` vs `_GlyphLayer4_MultiFusion` overlap in glyph purpose; GlyphLayer4 is the canonical runtime path, others should be considered legacy unless explicitly invoked.
- No matches for requested names `spawnGlyph`, `createGlyph`, `emitGlyph`, `spawnGlyphRing`, `spawnSemanticGlyph`, `spawnSeed`, `spawnFusionGlyph`, `createProceduralGlyph` (except AdaptiveGlyphRendering `createGlyphInstance`) indicating older APIs removed.

**Recommended Canonical Spawn System**
- Use `GlyphLayer4_MultiFusion` for node glyphs (core/evolution/personality/state layers) with SemanticGlyphAI overlays; keep LinkGlyphFlow + LinkedGlyphMessaging3_0 for link-level glyph traffic and RecursiveGlyphSignalSystem for attention/residue signals. Treat AtomaGlyphSystem3_0/4_0 and MegaGlyph* as legacy/debug only.

**Verification**
- Read-only audit; no files modified.  
- Checked runtime wiring via `main.js` imports/initialization and FrameScheduler registrations.

NO gameplay changes  
NO visual changes  
NO performance impact