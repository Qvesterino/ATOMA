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

## Clean Architecture Memory

Confirmed long-term rule:

- no parallel truth systems
- no duplicate permanent authorities
- adapters and migration layers are acceptable
- permanent architectural duplication is not

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

## Confirmed Runtime Lesson

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

- prefer passive listeners on the true runtime authority layer
- avoid `main.js` wrappers around `createLink/removeLink` or `setPrimaryNode/clearPrimaryNode`

Canonical debug-only link creation path:

- `NodeLinkingSystem.createLinkById(sourceNodeId, targetNodeId)` is the thin runtime helper
- `window.__DEBUG.createLinkById(idA, idB)` is only a passthrough to the same authority
- no duplicate link construction logic should live in `main.js`

Canonical link-flow metric lesson:

- `LinkResonanceFlowSystem_Session124` must derive load/stability from link endpoints when `link.userData.metrics` is sparse or zeroed
- do not assume `link.userData.metrics` is the authoritative source for flow spawning
- the flow system should remain tolerant of partial link metric hydration during creation

Canonical cascade-seed lesson:

- `SynergyCascadeVisualizer` should seed its birth lifecycle from the canonical `link.created` event with the live link object
- do not rely only on a transient `onLinkCreated` callback path for cascade history seeding
- cascade history should be retained with age-based cleanup and link liveness checks, not random per-frame history deletion

Canonical wave-birth lesson:

- `WaveInterferencePatternSystem_Session132` should seed birth interference from live link creation and keep orphaned birth pairs on a short grace lifecycle instead of deleting them immediately on unlink
- do not depend only on center collision flashes; birth-seeded pairs are a first-class visible path
- `main.js` should seed current links into wave interference setup and register link-created / link-removed bridge callbacks against the canonical linking authority

Wave lifecycle smoke lesson:

- when validating link lifetime in the browser, avoid editing files mid-smoke because dev-server live reload can reset the world and create a false zero-link state
- a continuous Playwright session with no intervening edits kept 10 links alive for 30 seconds, so the earlier 10-second zero-state was a test artifact rather than a runtime cleanup timer

Wave birth visual lesson:

- `WaveInterferencePatternSystem_Session132` birth-seeded interference now gets a distinct torus pulse ring and stronger spike bias so link birth reads as a separate event instead of a generic center flash

Standing wave polish lesson:

- `StandingWaveVisualRenderer_Session131` trap zones now benefit from a small seed-like pulse ring so the standing-wave language stays aligned with the newer birth-seed interference visuals

## Runtime Test Boot

Confirmed default runtime validation entrypoint:

- use `http://127.0.0.1:5500/index.html` for browser runtime tests and validation
- prefer the local static server boot path over Vite when reproducing live runtime behavior
- treat `5500/index.html` as the default verification target unless a task explicitly says otherwise
