# ATOMA -- CORE CONTEXT

This document defines the technical map of ATOMA.

It describes the active subsystem model, interaction rules, shared authorities, and practical runtime constraints.

---

## Scope

This file owns:

- subsystem map
- interaction rules
- authority boundaries
- runtime and technical constraints
- practical refactor constraints

This file does not own:

- constitutional priority order
- project identity narrative
- historical memory

---

## Phase

`PROJECT_PHASE = EVOLUTION_V2`
`DOCUMENT_BASELINE = EVOLUTION_V2.2`

ATOMA operates under controlled evolution, subsystem autonomy, and bounded innovation.

---

## Shared Authorities

These systems remain global authorities:

- `FrameScheduler`
- `MetricsRuntime`
- `VisualHierarchyRegistry`

Canonical metrics:

- `synergy`
- `harmony`
- `stability`
- `corruption`
- `loadPressure`

Scheduler tiers:

- `10Hz` simulation
- `30Hz` visual
- `60Hz` runtime

Clean architecture rule:

- no parallel truth systems
- no duplicate authorities
- adapters are acceptable
- permanent duplication is not

---

## Subsystem Map

ATOMA should be reasoned about through autonomous but compatible subsystems:

- `NODE SYSTEM`
- `LINK SYSTEM`
- `METRICS SYSTEM`
- `WAVE / CASCADE SYSTEM`
- `VISUAL FX SYSTEM`
- `UI SYSTEM`

Each subsystem may be internally refactored, optimized, or modernized inside its own scope.

Default interaction rules:

- do not change another subsystem's API without concrete reason
- avoid unnecessary cross-dependencies
- keep authority ownership explicit
- prefer local improvements before cross-system rewiring

---

## Practical Interaction Rules

Before changing a subsystem, confirm:

- which subsystem owns the behavior
- whether the affected path is active or dormant
- whether the change touches shared authority
- whether compatibility must be preserved or migrated

When risk rises:

- reduce the scope
- stage the work
- migrate explicitly instead of duplicating authority

---

## Legacy Cleanup Mandate

If a system is:

- redundant
- unclear
- dormant
- or increases complexity without value

it is valid to:

- refactor it
- simplify it
- or remove it

under one of these conditions:

- system truth is preserved
- compatibility is preserved
- or migration is explicit and controlled

Legacy should be evaluated by value, not age.

---

## Runtime Constraints

ATOMA is browser-native and performance-sensitive.

Rules:

- respect `FrameScheduler` tiers
- keep simulation work in `10Hz`
- keep visual work in `30Hz`
- keep runtime responsiveness in `60Hz`
- prefer GPU and shader-driven execution where practical
- use LOD and distance-based activation where relevant
- stage heavy initialization across multiple frames
- avoid hot-loop allocations and hidden spawn spikes

---

## Rendering Constraints

Visuals should operate as layered interpretation, not as independent gameplay truth.

Rules:

- visuals read shared truth, they do not invent it
- layered hierarchy should remain `CORE -> SURFACE -> OVERLAY -> ATMOSPHERE`
- postprocessing must not destroy readability
- node and link structure must remain visually legible
- stronger effects are acceptable when they improve systemic readability

---

## WebGPU Guard

Prepare systems for future WebGPU-oriented growth.

But:

- never sacrifice current WebGL stability
- never break the current runtime in the name of future architecture
- future-facing design must remain compatible with the live browser runtime

---

## Technology Direction

Current direction:

- modular runtime
- layered rendering
- GPU-first bias where practical
- clean subsystem boundaries
- incremental modernization over uncontrolled rewrites

This file is the practical map for how ATOMA should be changed safely and effectively.
