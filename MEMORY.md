# MEMORY.md -- ATOMA Resident Persistent Memory

Project: ATOMA
Nature: Long-term systemic browser engine with layered visual expression

---

## Constitutional Reality

ATOMA is governed by:

- `CORE_PRINCIPLES.md`
- `ATOMA_OVERVIEW.md`
- `ATOMA_CORE_CONTEXT.md`

These documents define system identity and architectural direction.

---

## Project Phase

`PROJECT_PHASE = EVOLUTION_V2`

ATOMA is in active evolution with controlled innovation and subsystem autonomy.

Long-term direction:

- modernize visuals toward a 2026+ quality bar
- improve subsystem clarity and maintainability
- preserve runtime stability while evolving
- keep browser performance as a first-class constraint
- let subsystems evolve independently inside shared global rules

---

## Architectural Invariants

The following are canonical:

- Node identity is unified via `node.userData.nodeId`
- `FrameScheduler` controls timing authority
- `MetricsRuntime` is the canonical runtime metrics authority
- `VisualHierarchyRegistry` remains the central visual hierarchy authority
- Canonical metrics are `synergy`, `harmony`, `stability`, `corruption`, `loadPressure`
- Scheduler frequencies remain `10Hz` simulation, `30Hz` visual, `60Hz` runtime
- WorldRoot and NodeRoot are explicit scene anchors
- Visual systems must not duplicate metrics logic authority
- GPU-first rendering discipline remains valid: CPU orchestrates, GPU renders

These are structural decisions, not optional preferences.

---

## Shared Authorities

The following authorities remain global and must be respected by every subsystem:

- `FrameScheduler` for timing authority
- `MetricsRuntime` for canonical runtime metrics authority
- `VisualHierarchyRegistry` for visual hierarchy authority

Canonical metrics remain:

- `synergy`
- `harmony`
- `stability`
- `corruption`
- `loadPressure`

---

## Operating Model

Human (Daniel) = final authority
Resident Architect = reasoning and implementation layer

Default workflow:
understand -> trace impact -> implement -> verify

Use proposal mode for:

- intentionally breaking changes
- unclear architecture shifts
- external-impact actions

Controlled innovation rules:

- every change must have a concrete reason: performance, clarity, or visual quality
- compatibility should be preserved by default
- duplicate systems or duplicate authorities are not acceptable without a concrete reason

---

## Design Direction

ATOMA should feel like a living, energetic, intelligent ecosystem.

Guidelines:

- visuals are layered: core, surface, overlay, atmosphere
- effects must be readable, physically believable, and purposeful
- quality is preferred over quantity
- new systems should strengthen clarity, not add noise
- prefer high impact, low noise design

---

## Subsystem Autonomy

Primary autonomous subsystems:

- `LINK SYSTEM`: `LinkRendererConduit`, `NodeLinkingSystem`, link VFX
- `NODE SYSTEM`: `AINodes`, `EnhancedNodeModels`, node visuals
- `METRICS SYSTEM`: node metrics engines and `MetricsRuntime`
- `WAVE / CASCADE SYSTEM`: wave interference and cascade FX
- `UI / HUD SYSTEM`: HUD and presentation layers

Subsystem rule set:

- internal refactors are allowed
- internal performance and visual improvements are allowed
- new effects are allowed inside subsystem scope
- changing another subsystem's API requires a concrete reason
- unnecessary cross-dependencies should be avoided

---

## Engineering Guardrails

- Do not duplicate metric authority
- Do not violate scheduler authority tiers
- Do not introduce breaking runtime rewires without concrete reason
- Do not add noise VFX without a clear systemic role
- Prefer compatibility-preserving refactors when modernizing old code
- Optimize for readability, modularity, and browser performance
- implement distance-based LOD where relevant
- stage heavy initialization across multiple frames where relevant

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

## Audio Interaction Authority

Confirmed runtime authority for node select and deselect is `NodeLinkingSystem`, not `selectionCore`.

Real selection path:

- `handleSingleClick()` -> `setPrimaryNode()` -> `_fireSelectCallbacks()`
- `clearPrimaryNode()` -> `_fireDeselectCallbacks()`

Stable passive callback API:

- `onNodeSelected(callback)`
- `onNodeDeselected(callback)`
- `onLinkCreated(callback)`
- `onLinkRemoved(callback)`

`NodeLinkingSystem.prototype.setSelectionCore = function() {};` is a no-op and must not be treated as active runtime selection wiring.

Lesson:

- Prefer passive listeners on the true runtime authority layer
- Avoid `main.js` wrappers around `createLink/removeLink` or `setPrimaryNode/clearPrimaryNode`
