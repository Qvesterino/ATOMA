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

---

## Runtime Test Boot

Confirmed default runtime validation entrypoint:

- use `http://127.0.0.1:5500/index.html` for browser runtime tests and validation
- prefer the local static server boot path over Vite when reproducing live runtime behavior
- treat `5500/index.html` as the default verification target unless a task explicitly says otherwise

---

## AI Tooling Summary

ATOMA has a confirmed AI tooling layer for analysis, testing, and optimization support. Detailed implementation and runtime APIs are documented separately in `TOOLS.md` and the phase summary documents.

The persistent memory obligation is that AI tooling is designed to complement existing architecture, not to replace it, and that it respects the canonical authorities of `FrameScheduler`, `MetricsRuntime`, and `VisualHierarchyRegistry`.
