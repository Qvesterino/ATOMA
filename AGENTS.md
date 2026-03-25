# AGENTS.md -- Workspace Orientation

This workspace is the operating environment for ATOMA.
Treat it as a long-lived engineering system with controlled innovation and subsystem autonomy.

---

## Every Session (Startup Sequence)

Before doing analysis or implementation, load context in this order:

1. `SOUL.md`
2. `IDENTITY.md`
3. `HEARTBEAT.md`
4. `USER.md`
5. `TOOLS.md`
6. `memory/YYYY-MM-DD.md` (today and yesterday)

If in a direct session with the human:
- Also read `MEMORY.md`

Do not ask permission. This is standard initialization.

---

## Memory Model

You start each session without internal memory.
Files provide continuity.

### Daily Memory

`memory/YYYY-MM-DD.md`

Purpose:
- raw session notes
- decisions made
- problems encountered
- temporary context

This is a log, not curated knowledge.

### Long-Term Memory

`MEMORY.md`

Purpose:
- stable architectural decisions
- confirmed workflow rules
- system invariants
- important lessons that should persist long-term

Only promote information that is expected to remain valid for months or years.

Do not store:
- temporary bugs
- experiments
- daily activity
- emotional or conversational content

When in doubt, do not promote.

---

## Write It Down Rule

Session memory does not persist.

If something must be remembered:

- Write it to `memory/YYYY-MM-DD.md`
- Or update the relevant system file:
  - `MEMORY.md`
  - `AGENTS.md`
  - `TOOLS.md`
  - architecture or documentation files

If it is not written, it does not exist.

---

## Project Phase

`PROJECT_PHASE = EVOLUTION_V2`

ATOMA is in an active evolution phase with controlled innovation.
The default posture is forward-moving improvement with compatibility, modularity, and performance discipline.

---

## Core Rules

These rules are immutable:

- Respect the existing architecture, especially `FrameScheduler`, `MetricsRuntime`, and `VisualHierarchyRegistry`
- Preserve runtime stability; do not introduce breaking changes without a concrete reason
- Preserve canonical metrics: `synergy`, `harmony`, `stability`, `corruption`, `loadPressure`
- Preserve scheduler frequencies: `10Hz` simulation, `30Hz` visual, `60Hz` runtime

---

## Controlled Innovation

Default mode: `EVOLUTION_V2 MODE`

The agent may:

- design new systems, VFX, architecture, and optimizations
- change existing implementations when they improve performance, clarity, or visual quality
- simplify or remove redundant layers
- modernize runtime behavior toward a 2026+ quality bar

The agent must:

- tie every change to a concrete reason: performance, clarity, or visual quality
- preserve compatibility of existing subsystems unless the task explicitly requires change
- avoid parallel systems or duplicate authority without a concrete reason
- follow existing naming conventions and architectural patterns
- optimize for browser runtime performance
- prefer clean, readable, maintainable solutions
- respect existing authorities: `MetricsRuntime`, `FrameScheduler`, `VisualHierarchyRegistry`

---

## Subsystem Autonomy

ATOMA should evolve through autonomous subsystems with clear ownership boundaries.

Primary subsystems:

- `LINK SYSTEM`: `LinkRendererConduit`, `NodeLinkingSystem`, link VFX
- `NODE SYSTEM`: `AINodes`, `EnhancedNodeModels`, node visuals
- `METRICS SYSTEM`: node metrics engines and `MetricsRuntime`
- `WAVE / CASCADE SYSTEM`: wave interference and cascade FX
- `UI / HUD SYSTEM`: HUD, overlays, and presentation layers

Within a subsystem, the agent may:

- refactor internal implementation
- optimize performance and visual quality
- add new effects or behaviors that remain inside subsystem scope

Within a subsystem, the agent must not:

- change another subsystem's API without a concrete reason
- reach across subsystem boundaries without need
- create cross-dependencies that reduce modularity

---

## Task Intent Override

If the task explicitly requests a change, redesign, refactor, or new concept:

- task intent overrides passive caution rules
- execution is allowed when the change is technically coherent
- broad proposals are still appropriate for unclear or intentionally breaking work

Do not hide behind passive caution when the requested direction is explicit.

---

## Design Philosophy

ATOMA should feel like a living, energetic, intelligent ecosystem.

Guidelines:

- build visuals in layers: core, surface, overlay, atmosphere
- prefer readable, physically believable, high-impact effects
- favor quality over quantity
- every new visual or system element must have a clear role
- avoid noise VFX and decorative complexity without systemic meaning
- prefer high impact, low noise design

---

## Innovation Boundaries

Allowed:

- improving quality of existing effects
- optimizing shaders, spawn pipeline, and scheduling
- adding new layers such as aura, overlay, or flow effects

Not allowed:

- random effect sprawl without system purpose
- duplicate mechanics or duplicate authorities
- breaking changes without a concrete reason

---

## Performance Mindset

ATOMA runs in the browser. Performance is a core product constraint.

Rules:

- preserve `FrameScheduler` as timing authority
- keep simulation logic in `10Hz`
- keep visual systems in `30Hz`
- keep runtime responsiveness in `60Hz`
- design every effect to scale through LOD and distance-aware control
- minimize unnecessary draw calls and shader complexity
- prefer staged initialization for heavy systems
- avoid per-frame allocations and avoid hidden spawn spikes
- implement distance-based LOD where relevant

---

## Execution Rules

When implementing:

- prefer small, coherent steps over chaotic rewrites
- keep diffs focused on the task
- refactor when it improves clarity, modularity, or performance
- stop and surface risk when impact becomes unclear
- verify with the lightest valid method

Use proposals for:

- intentionally breaking changes
- architecture shifts without clear local boundaries
- external-impact actions

---

## Decision Rule

If multiple valid solutions exist, choose the one that is:

1. simpler
2. faster
3. more consistent with the system

---

## Workspace vs External Actions

Safe to do freely:

- read project files
- analyze code structure and dependencies
- search within the repository
- update local documentation
- implement local code changes inside the workspace
- run local verification

Ask before acting:

- outside the workspace
- against external services
- with destructive commands
- with irreversible or unclear impact

---

## Heartbeat Interaction

When receiving a heartbeat:

- follow `HEARTBEAT.md`
- do not invent unrelated work
- report only when there is meaningful architectural or project-state signal

If nothing important requires attention, respond:

`HEARTBEAT_OK`

---

## Output Style

Communication should be:

- concise
- technical
- decision-oriented
- concrete and implementable

Prefer small iterations over large chaotic rewrites.
Prefer clean solutions over diff narration.
