# MEMORY.md -- ATOMA Resident Persistent Memory

This document is the stable memory layer of ATOMA.

It stores confirmed facts, durable decisions, and historical notes that should remain useful across sessions.

---

## Scope

This file owns:

- stable architectural decisions
- confirmed invariants
- historical facts
- durable lessons

This file does not own:

- project philosophy
- subsystem design rules
- active workflow tactics

---

## Phase Record

`PROJECT_PHASE = EVOLUTION_V2`
`DOCUMENT_BASELINE = EVOLUTION_V2.2`

ATOMA is in controlled evolution with subsystem autonomy and bounded innovation.

---

## Confirmed Invariants

The following are confirmed and should be treated as stable:

- Node identity is unified via `node.userData.nodeId`
- `FrameScheduler` is the timing authority
- `MetricsRuntime` is the canonical runtime metrics authority
- `VisualHierarchyRegistry` is the visual hierarchy authority
- Canonical metrics are `synergy`, `harmony`, `stability`, `corruption`, `loadPressure`
- Scheduler frequencies remain `10Hz` simulation, `30Hz` visual, `60Hz` runtime
- WorldRoot and NodeRoot are explicit scene anchors
- Visual systems must not become parallel metric authorities
- GPU-first execution remains the preferred runtime bias where practical

---

## Legacy Cleanup Mandate

Confirmed long-term policy:

If a system is redundant, unclear, dormant, or adds complexity without value, it is valid to refactor, simplify, or remove it when:

- system truth is preserved
- compatibility is preserved
- or migration is explicit and controlled

Legacy is not preserved for its own sake.

---

## Historical Stable Decisions

Removed systems confirmed on 2026-03-03:

- `UniqueSpawnService.js`
- `UniqueSpawnRegistry.js`
- `NodeSpawnRegistry.js`

Rationale:

- uniqueness enforcement is not part of the active ATOMA model

Legacy systems moved out of the active path on 2026-03-03:

- `_NodeLinking2_3.js`
- `_RareNodeSpawner.js`
- `SpawnerConsolidationDetector_v1.js` remains referenced only where explicitly wired

---

## Confirmed Runtime Lessons

- Node select/deselect authority is `NodeLinkingSystem`, not `selectionCore`.
- Prefer passive listeners on the true runtime authority layer; avoid duplicate `main.js` wrappers around `createLink/removeLink` or `setPrimaryNode/clearPrimaryNode`.
- `NodeLinkingSystem.createLinkById(sourceNodeId, targetNodeId)` is the canonical helper, and debug helpers should remain thin passthroughs.
- Link-resonance and cascade systems must derive state from live link authority and remain tolerant of partial `link.userData.metrics` hydration.
- Cascade and wave systems should seed from canonical link lifecycle events and preserve short-lived birth history through unlink instead of deleting it immediately.
- Link visuals and supporting systems may be refactored, but the runtime authority and event-binding contract remain the durable memory.
- In normal runtime, `renderer.debug.checkShaderErrors` should stay disabled and shader programs should be precompiled after world build so cold `getProgramInfoLog` work does not land in `runRenderTick()`.
- Post-processing has its own effect scene, so shader warmup must cover `scene_scene` separately from the main world scene.
- When meshes only differ by uniform values, reuse one `ShaderMaterial` instance and override per-mesh uniforms in `onBeforeRender` instead of cloning the material.
- Late material creation after warmup should be audited explicitly via `checkLateMaterialCreation` so post-warmup GPU churn is visible during profiling.
- Selective bloom refresh should prefer explicit refresh requests, with the periodic scene traversal acting as fallback only.
- Shader patchers that wrap `onBeforeCompile` should preserve/combine `customProgramCacheKey` so identical shader source reuses one program variant.
- Late shader priming should be followed by a scene warmup pass so patched programs compile outside the first render frame.
- Runtime browser A/B tests must first confirm the game is in a stable gameplay state, not menu/boot overlay. If `window.game` is absent, the page falls back to menu, or `render_game_to_text` does not reflect live gameplay, the result is invalid and must be discarded before drawing conclusions.
- Semantic pictogram teardown must happen after the link is removed from live link arrays, otherwise the pictogram system can respawn stale glyphs from `_lastLinks` / live-link cache.
- Link semantic pictogram builder logic is now separated from lifecycle/state management into `LinkSemanticPictogramGlyphBuilders.js`; keep glyph construction and unlink cleanup isolated from pool/state orchestration.

---

## Unified Cleanup Contract

Confirmed on 2026-04-06: All 20 high-risk systems now follow the unified cleanup contract.

### Contract Pattern

**Track Created Objects:**
```javascript
constructor(scene, ...args) {
    this.scene = scene;
    this._createdObjects = [];  // UNIFIED CLEANUP CONTRACT
}

// After each scene.add(obj):
scene.add(obj);
this._createdObjects.push(obj);  // UNIFIED CLEANUP CONTRACT
```

**Dispose Implementation:**
```javascript
dispose() {
    // UNIFIED CLEANUP CONTRACT - Remove and dispose all tracked objects
    this._createdObjects.forEach(obj => {
        if (this.scene) this.scene.remove(obj);
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
    });
    this._createdObjects = [];
}
```

### Completed Systems (20/20)

**Implemented cleanup contract (15 systems):**
1. NodeEditor.js
2. LinkPointFXBase.js
3. _MythicRitualController.js
4. ResonanceRuptureVisualSystem_Session133.js
5. LinkGlyphFlow.js
6. SynergyVFXEngine1_0.js
7. T2_CorruptionVisualIntegration_v1.js
8. TIER4_CorruptionFeedbackVisuals_v1.js
9. WaveInterferencePatternSystem_Session132.js
10. CorruptionVisualFX_v1.js
11. SynergyCascadeVisualizer.js
12. CompositeGlyphResonanceFeedback.js
13. HarmonicHealingVisualSystem_Session134.js
14. HarmonicRecoveryVisualSystem_Session138.js
15. HealingParticleSystem_Session136.js

**Already compliant (5 systems):**
16. NodeLinkingSystem.js
17. LinkingSystemHardening.js
18. ResonanceCascadeVisualization_Session117B.js
19. AINodes.js
20. Multiple smaller VFX systems

### Stability Impact

- Zero orphan objects on scene switch
- Zero memory leaks from missed disposal
- Consistent pattern across all VFX and visual systems
- Safe to add `nodesRoot`, `linksRoot`, `debugRoot` without breaking cleanup

---

## Runtime Test Boot

Confirmed default runtime validation entrypoint:

- use `http://127.0.0.1:5500/index.html` for browser runtime tests and validation
- prefer the local static server boot path over Vite when reproducing live runtime behavior
- treat `5500/index.html` as the default verification target unless a task explicitly says otherwise

## Open Follow-Up

- Deterministic node growth spawn is prewired; live Edge verification still needs a clean fresh-session smoke test.

---

## AI Tooling Summary

ATOMA has a confirmed AI tooling layer for analysis, testing, and optimization support. Detailed implementation and runtime APIs are documented separately in `TOOLS.md` and the phase summary documents.

The persistent memory obligation is that AI tooling is designed to complement existing architecture, not to replace it, and that it respects the canonical authorities of `FrameScheduler`, `MetricsRuntime`, and `VisualHierarchyRegistry`.
