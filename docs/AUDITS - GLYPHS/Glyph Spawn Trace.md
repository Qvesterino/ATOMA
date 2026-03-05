**Glyph Spawn Sources (pattern matches)**  
- `_GlyphLayer4_MultiFusion.js`: class `GlyphLayer4_MultiFusion`, `createGlyphFusion` (line ~828), `createGlyphFusionsForNodes` (line ~948). Creates `THREE.Group` + multiple `THREE.Mesh` layers.  
- `_LinkGlyphFlow.js`: class `LinkGlyphFlow`, `createGlyphPacket` (line ~252). Creates `THREE.Mesh` packet per link.  
- `_ExtremeLinkVisualPack3.js`: class `ExtremeLinkVisualPack3`, `createGlyphStream` (line ~229) → calls `createGlyph` (line ~253) which builds a `THREE.Mesh` sphere glyph.  
- `_ProceduralMeaningEngine.js`: class `ProceduralMeaningEngine`, `createProceduralGlyph` (line ~196). Creates `THREE.Group` with multiple `THREE.Mesh` parts.  
- `_RecursiveGlyphMessaging4_0.js`: class `RecursiveGlyphMessaging4_0`, `createGlyphMesh` (line ~569). Creates `THREE.Mesh` from prebuilt glyph shapes.  
- `_MythicSeedGlyph.js`: class `MythicSeedGlyph`, `createGlyph` (line ~76). Builds `THREE.Group` + meshes for seed marker. (Not currently invoked; see Dead section.)  
- `_ExtremeLinkVisualPack3.js`: `createGlyphStream` (line ~229) and `createGlyph` (line ~253) both create meshes.  
- `_NodeMicroEvents.js`: `createGlyphFlash` (line ~568) — **does not** create new THREE objects; only tweaks existing node material.

**Runtime Call Chains & Triggers**  
- `createGlyphFusionsForNodes` → `createGlyphFusion` (GlyphLayer4). Called in `main.js` at init (lines ~5094, ~5680) and via `aiNodes.registerPostSpawnObserver('glyph-layer-fusion', line ~9763). Trigger: node creation/load. Scheduler: `FrameScheduler.visual` (`visual.glyphLayer4`).  
- `createGlyphPacket` (LinkGlyphFlow). Invoked inside `refreshPacketsForLinks`/`createPacketsForLink` during `LinkGlyphFlow.update`. Trigger: active links & traffic/synergy. Scheduler: `FrameScheduler.visual` (`linkGlyphFlow`).  
- `createGlyphStream`/`createGlyph` (ExtremeLinkVisualPack3). Called from `registerLink` when system is initialized (`main.js` ~11718) and during per-frame `extremeLinkVisuals.update` (registered to `FrameScheduler.visual`). Trigger: link registration/updates.  
- `createProceduralGlyph` (ProceduralMeaningEngine). Called in `update` when SemanticGlyphAI meaning changes (`main.js` registers `proceduralMeaningEngine.update` alongside semantic AI). Trigger: semantic state changes per node. Scheduler: `FrameScheduler.visual` (`visual.semanticGlyphAI` path).  
- `createGlyphMesh` (RecursiveGlyphMessaging4_0). Called inside `createChainMeshes` during `generateChainForLink`. Trigger sources: autonomous 5% per-link in `update` (line ~643) and optional calls from LinkedGlyphMessaging (commented entry point). Scheduler: `FrameScheduler.visual` (`recursiveGlyphMessaging`).  
- `createGlyph` (MythicSeedGlyph). Only reachable via `scanAndApplyGlyphs`, but that function is never called from `main.js`; no runtime trigger observed.  
- `createGlyphFlash` (NodeMicroEvents). Triggered when micro-event type `glyph_flash` occurs in `NodeMicroEvents.update`; scheduler `visual.nodeMicroEvents`. No new geometry.

**Table (requested fields)**  
SYSTEM | SPAWN FUNCTION | TRIGGER | THREE OBJECT CREATED  
- GlyphLayer4_MultiFusion | createGlyphFusion / createGlyphFusionsForNodes | Node load & post-spawn observer | `Group`, multiple `Mesh`  
- LinkGlyphFlow | createGlyphPacket | Link packets refreshed each update (link traffic) | `Mesh`  
- ExtremeLinkVisualPack3 | createGlyphStream → createGlyph | Link registered; per-frame packet regen | `Mesh`  
- ProceduralMeaningEngine | createProceduralGlyph | Semantic meaning change during update | `Group` + `Mesh`  
- RecursiveGlyphMessaging4_0 | createGlyphMesh | Recursive chain generation (autonomous per-link) | `Mesh`  
- MythicSeedGlyph | createGlyph | (No active trigger) | `Group` + `Mesh`  
- NodeMicroEvents | createGlyphFlash | Micro-event “glyph_flash” | **No** (reuses node material)

**Dead / Dormant Glyph Systems**  
- `MythicSeedGlyph`: never calls `scanAndApplyGlyphs`; no main.js trigger.  
- `MegaGlyphConduit`, `MegaGlyphSystem`: not imported or constructed in main.js.  
- `AtomaGlyphSystem3_0` / `AtomaGlyphSystem4_0`: instantiated but no automatic `assignGlyphsToNodes`; only manual debug helpers in main.js → effectively inactive for runtime glyph creation.  
- Debug helper log in `debug_semantic_helpers_validation.js` (no spawn).

**Most Active Glyph System**  
- `GlyphLayer4_MultiFusion` (creates fusion glyph per node at load and on each new node; continuously updated in FrameScheduler.visual).

**Recommended Canonical Glyph Authority**  
- Keep `GlyphLayer4_MultiFusion` as the canonical node glyph spawner (paired with SemanticGlyphAI overlays); use `LinkGlyphFlow` + `LinkedGlyphMessaging/RecursiveGlyphMessaging` for link/channel glyph traffic; treat other spawn paths as legacy or debug-only.