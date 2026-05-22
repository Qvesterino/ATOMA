# MEMORY.md -- ATOMA Resident Persistent Memory

This is the stable memory layer of ATOMA.

It stores durable facts, confirmed invariants, and lessons that should remain useful across sessions.

---

## Scope

This file owns:

- stable architectural decisions
- confirmed invariants
- durable runtime lessons
- important historical decisions that still matter

This file does not own:

- project philosophy
- startup identity framing
- giant system catalogs
- daily activity logs
- temporary bugs or experiments

---

## Phase Record

`PROJECT_PHASE = EVOLUTION_V2`
`DOCUMENT_BASELINE = EVOLUTION_V2.2+`

ATOMA is in controlled evolution with subsystem autonomy, browser-performance discipline, and explicit documentation governance.

---

## Confirmed Invariants

- `FrameScheduler` is the timing authority.
- `MetricsRuntime_v1` is the canonical runtime metrics authority.
- `VisualHierarchyRegistry` is the visual hierarchy authority.
- Canonical metrics are:
  - `synergy`
  - `harmony`
  - `stability`
  - `corruption`
  - `loadPressure`
- Scheduler frequencies remain:
  - `10Hz` simulation
  - `30Hz` visual
  - `60Hz` runtime
- Node identity is unified via `node.userData.nodeId`.
- `WorldRoot` and `NodeRoot` are explicit scene anchors.
- Visual systems must not become parallel metric authorities.
- GPU-first execution remains the preferred runtime bias where practical.

---

## Current Stable Release Slice

These facts are current and durable enough to keep in memory:

- The canonical live runtime validation target is `http://127.0.0.1:5173/`.
- The current release-priority worlds are:
  - `Quantum Island`
  - `Dream Desert`
- The game is currently centered on a **stabilizer gameplay loop** with `REWIND` and `WON` framing.
- The active release slice includes:
  - build-state readability
  - first-run guidance
  - run identity packages/world states
  - curated signature setpieces
  - procedural audio-reactive identity
  - adaptive browser-performance discipline
  - pause/resume and soft-failure UX polish
- ATOMA currently behaves as a recoverable soft-failure game, not a traditional hard-loss-screen game.

---

## Confirmed Runtime Lessons

- Node select/deselect authority is `NodeLinkingSystem`, not `selectionCore`.
- Prefer passive listeners on the true runtime authority layer; avoid duplicate `main.js` wrappers around `createLink/removeLink` or `setPrimaryNode/clearPrimaryNode`.
- `NodeLinkingSystem.createLinkById(sourceNodeId, targetNodeId)` is the canonical helper, and debug helpers should remain thin passthroughs.
- Link-resonance and cascade systems must derive state from live link authority and remain tolerant of partial `link.userData.metrics` hydration.
- Cascade and wave systems should seed from canonical link lifecycle events and preserve short-lived birth history through unlink instead of deleting it immediately.
- Link visuals and supporting systems may be refactored, but the runtime authority and event-binding contract remain durable.
- In normal runtime, `renderer.debug.checkShaderErrors` should stay disabled and shader programs should be precompiled after world build so cold `getProgramInfoLog` work does not land in `runRenderTick()`.
- Post-processing has its own effect scene, so shader warmup must cover `scene_scene` separately from the main world scene.
- When meshes only differ by uniform values, reuse one `ShaderMaterial` instance and override per-mesh uniforms in `onBeforeRender` instead of cloning the material.
- Late material creation after warmup should be audited explicitly so post-warmup GPU churn is visible during profiling.
- Selective bloom refresh should prefer explicit refresh requests, with periodic scene traversal only as fallback.
- Shader patchers that wrap `onBeforeCompile` should preserve/combine `customProgramCacheKey` so identical shader source reuses one program variant.
- Late shader priming should be followed by a scene warmup pass so patched programs compile outside the first render frame.
- Hot metric update loops should batch alias/clamp writes by touched node instead of rewriting the same proxy-backed fields repeatedly in the same tick.
- Constructive wave particle bursts should preserve straight radial emission; cascade acceleration / flow deflection should not distort that family.
- Runtime browser A/B tests must first confirm the game is in stable gameplay state, not menu/boot overlay.
- Semantic pictogram teardown must happen after the link is removed from live link arrays, otherwise stale glyphs can respawn from cached link state.
- Link semantic pictogram builder logic is intentionally separated from lifecycle/state management into `LinkSemanticPictogramGlyphBuilders.js`.

---

## Durable Contracts

### Unified Cleanup Contract

Scene-owning visual systems must:

- track created scene objects
- remove them on dispose
- dispose geometry/material resources deterministically

This contract was already rolled out broadly and should remain the standard pattern for new VFX systems.

### Event Registration Contract

Semantic bus consumers must:

- register through `Engine/EventRegistrationRegistry.js`
- dispose by returned disposer or `disposeOwner(owner)`
- avoid bare untracked `bus.on()` / `bus.subscribe()` usage

This is a stable runtime safety rule.

---

## Runtime Validation Defaults

- Prefer `http://127.0.0.1:5173/` for browser runtime tests and smoke validation.
- Treat the Vite dev runtime as canonical live gameplay truth.
- Use legacy/static boot paths only when a task explicitly requires them.
- Use Microsoft Edge for manual smoke when browser choice matters.

---

## Reference Boundaries

For large catalogs or audits, use dedicated sources rather than inflating this file.

Examples:

- startup/identity framing -> `ATOMA_OVERVIEW.md`, `IDENTITY.md`
- runtime/system truth -> `ATOMA_CORE_CONTEXT.md`
- invariants -> `CORE_PRINCIPLES.md`
- constitution sources -> `ATOMA_CONSTITUTION.md`
- practical boot/smoke flow -> `BOOT.md`
- evolving session notes -> `memory/YYYY-MM-DD.md`
