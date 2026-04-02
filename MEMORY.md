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
- `SynergyCascadeVisualizer` should also keep a heartbeat-driven flow repeat path keyed by canonical link IDs, so the visual is not create-only
- `SynergyCascadeVisualizer.flowParticles` is now a batch `THREE.Points` emitter; burst particles remain mesh-based for readability, and this split is the preferred balance of performance and visual quality
- `SynergyCascadeVisualizer` cascade bands are intentionally low-threshold now (`0.1 / 0.2 / 0.3`) so low-synergy links still visibly spawn instead of looking dormant
- `window.__DEBUG.triggerCascadeAtNodeId(nodeId, intensity)` is the preferred thin console helper for manual cascade spawning when testing the visualizer
- `SynergyCascadeVisualizer` also has a forced burst beat every 3 seconds per live link; this is intentionally independent of synergy gating so burst visibility stays alive in runtime
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
## Synergy Cascade Visual Contract
- `SynergyCascadeVisualizer` uses `flowParticles` as the recurring 3-second beat on live links.
- `burstParticles` are kept smaller and metric-gated with a 5-second cooldown window.
- This split is the preferred visual contract for synergy readability: flow carries the repeated signature, burst stays secondary.
- `SynergyCascadeVisualizer.flowParticles` and `SynergyCascadeVisualizer.burstParticles` are both `THREE.Points` paths and now share the point-FX scaffold via `LinkPointFXBase`.
- The burst path is intentionally still visually secondary to the ripple / wave / link glow language, but it no longer relies on per-particle mesh draw calls.

## Corruption Glyph Contract
- `LinkCorruptionSpreadAnimator` uses a bright chain-link glyph texture for dust wave markers so corruption reads as linked chain motion rather than a generic runic splat.

## Link Resonance Repeat Contract
- `LinkResonanceFlowSystem_Session124` now repeats pulses on any live link with a fixed 3-second cadence.
- Metrics are used for pulse styling and motion bias, not for spawn eligibility.
- This system is intentionally link-only: if a link exists, it should pulse.

## Resonance Rupture Scar Lesson
- `ResonanceRuptureVisualSystem_Session133` scar visuals now use a dedicated particle-burst root that must remain attached to the active scene graph during runtime.
- If world lifecycle or cleanup logic detaches the scar root, the system should reattach it during update instead of relying on one-time setup attachment.
- Link-born scar visuals are a separate path from rupture burst visuals; keep the scar root renderable and the rupture burst independent.

## Healing Probe Lesson
- `HealingParticleSystem_Session136` debug proof particles must have a shader bypass path when they share the same `THREE.Points` warp as the main healing trail.
- A debug probe that is rendered through the same hypercube-style projection can become visually indistinguishable even when it is correctly spawned.
- For visible runtime confirmation, keep the probe inside the same point system but route it through a dedicated debug branch with direct-space placement and stronger size/alpha emphasis.

## Strand Spark Contract
- `LinkRendererConduit` strand-tip sparks are now `THREE.Points` objects created through `LinkPointFXBase`, so geometry/material/cleanup follow the shared point-FX scaffold while preserving the existing spark shader look.

## Strand Filament Motion Contract
- `LinkRendererConduit` strand filaments now use a slower, heavier motion profile with a modest flow wave and a `linewidth` hint in place; the visible gain comes from motion shaping, not line width alone.

## Healing Point Scaffold
- `HealingParticleSystem_Session136` healing trail particles now use `LinkPointFXBase` for shared geometry / material / attach / cleanup handling while preserving the existing shader look and debug probe behavior.

## Bead Point Contract
- `LinkBeadSystem` beads are now rendered as a shared `THREE.Points` cloud through `LinkPointFXBase` instead of individual meshes.
- Bead runtime behavior was intentionally simplified: fewer beads per link, slower travel, and more spacing so bead trails stay secondary to the strand trails.

## LinkPointFXBase Material Pool Contract
- `LinkPointFXBase` now owns a shared sprite-texture cache and a reference-counted shared material cache for shareable point-cloud materials.
- Shader-less point clouds can share one material instance by default when their material signature matches.
- Custom shader materials stay unique by default unless a caller explicitly opts into sharing, because mutable uniforms can otherwise collide across live instances.
- Shared `PointsMaterial` instances must stay materially stable; per-instance intensity should move through geometry, transforms, or separate state, not shared `material.opacity` / `material.size` mutation.

## Link Spark Render Contract
- `LinkSparkSystem` uses `VisualHierarchyRegistry` for the canonical `LINK_SPARKS` render order and still applies `LinkRenderLayerPolicy` for layer material discipline.

## Link Resonance Render Contract
- `LinkResonanceFlowSystem_Session124` uses `LinkRenderLayerPolicy` for the canonical `LINK_RESONANCE` layer on the pulse group and its pulse parts, so render order and material policy stay centralized.

## Link Arc Visibility Contract
- `LinkRingArcDischarges` now renders arcs as a core line plus a lightweight glow line, with glow strength controlled by a small parameter instead of a render-layer change.
- The arc glow pass was later intensified again by raising the default glow strength and opacity scaling while keeping the same core-plus-glow structure.
- `linewidth` tweaks on arc lines and filaments are treated as best-effort hints; the reliable visual change remains glow intensity and motion shaping.

## Main Lookup Contract
- `main.js` runtime node lookup helpers should prefer `aiNodes.nodes` or canonical registries over `scene.traverse(...)` when resolving nodes by id, code, or name.
- The resonance-only debug visibility toggle now caches hide targets after its first scene scan, so repeated toggles avoid another full scene traversal.

## Link Braid Rebuild Contract
- `LinkRendererConduit` braid geometry rebuilds now use a short cooldown so small link motion does not trigger a fresh `TubeGeometry` rebuild every eligible tick.

## Link Trail Readability Contract
- `LinkTrailParticleSystem` remains at its baseline particle sizing and opacity after the reverted visibility experiment; no hidden/collapsed pool tweak is currently part of the stable implementation.

## Link Healing Dual-Variant Contract
- `LinkHealingParticleSystem` now uses a 50/50 split between the original knot sprite and a `Bloom Petal` sprite variant, both still rendered as a single `THREE.Points` pool.

## Link Arc Cleanup Contract
- `LinkRingArcDischarges` disposes each arc bundle directly from the active-arc lifecycle when it expires, including its glow mesh and glow geometry.

## LinkMicroImpulse Adapter Contract
- `LinkMicroImpulseAdapter_v1.js` is the active micro-impulse implementation; the older `LEGACY/LinkMicroImpulseAdapter.js` exists only as a legacy copy.
- `LinkMicroImpulseAdapter_v1.js` now applies micro-impulse color/opacity at draw time via `onBeforeRender`, and the visuals are layered through `LINK_SPARKS` to keep spawn-time work low while shared materials stay stable.
