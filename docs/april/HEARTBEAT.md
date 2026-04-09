# HEARTBEAT.md -- ATOMA Runtime Alignment

This file defines session re-alignment and heartbeat behavior.

The agent does not remember.
Each session begins with context restoration.

---

## Session Start Alignment

Before substantial work, internally align with:

- `ATOMA_CORE_CONTEXT.md`
- `CORE_PRINCIPLES.md`
- `ATOMA_OVERVIEW.md`
- `SOUL.md`
- `IDENTITY.md`
- `USER.md`
- `TOOLS.md`

Goal:

- restore project direction
- restore architectural invariants
- restore current working discipline
- restore documentation coherence

---

## Active Assumptions

Start every session assuming:

- dormant or partial systems may exist
- explicit wiring matters
- performance matters because ATOMA runs in the browser
- evolution is allowed when core invariants are preserved

Default mode: `EVOLUTION_V2 MODE`
Innovation mode: `CONTROLLED`

---

## Workflow Awareness

Before implementation, classify:

- task type
- task scope
- affected subsystem

Then choose the appropriate workflow.

---

## Workflow Selection

`SIMPLE FLOW`

- `LOW` tasks
- fast path
- minimal analysis

`STRUCTURED FLOW`

- `MEDIUM` tasks
- short plan
- implementation
- targeted verification

`CAREFUL FLOW`

- `HIGH` tasks
- analysis first
- design or proposal framing
- staged execution

Use the smallest workflow that still controls risk.

---

## Innovation Budget

Classify task scope before implementation:

`LOW`

- bugfixes
- local tweaks
- small visual adjustments
- local changes without architecture impact

`MEDIUM`

- one-subsystem refactors
- performance optimization
- VFX pipeline improvements
- changes inside one module or subsystem

`HIGH`

- architecture changes
- new system introduction
- changes spanning multiple subsystems

Default rule:

- if scope is not specified, prefer `LOW` or `MEDIUM`
- allow `HIGH` only when explicitly requested or when there is a strong technical reason

---

## Evolution Bias

When the system appears stable and constraints remain respected:

- prefer improvement over preservation
- prefer clarity over legacy complexity
- prefer stronger visual expression when it improves readability
- prefer removing weak or redundant systems over keeping them

If a subsystem is redundant, unclear, or unnecessarily complex, simplification, refactor, or removal is valid within budget.

The system should not remain static out of caution alone.

---

## Documentation Drift Check

During heartbeat and during normal alignment, check for:

- duplicated rules across `CORE_PRINCIPLES.md`, `ATOMA_OVERVIEW.md`, `ATOMA_CORE_CONTEXT.md`, and `MEMORY.md`
- conflicting instructions across those files
- content stored in the wrong layer
- stale information that no longer matches the active project phase

Role enforcement:

- `CORE_PRINCIPLES.md` should contain invariants only
- `ATOMA_OVERVIEW.md` should contain identity, philosophy, and direction only
- `ATOMA_CORE_CONTEXT.md` should contain technical context and subsystem rules only
- `MEMORY.md` should contain stable facts and historical decisions only

If the problem is found:

- identify it explicitly
- propose the smallest precise fix
- prefer move or removal over duplication

`MEMORY.md` purity rule:

- no philosophy
- no experiments
- no temporary notes
- no workflow instructions

`CORE_PRINCIPLES.md` protection rule:

- propose changes if needed
- do not edit core principles without explicit approval

---

## Pre-Change Check

Before substantial change, verify:

- architecture anchors remain valid
- canonical metrics stay canonical
- scheduler frequency tiers stay intact
- performance cost is understood
- compatibility impact is understood
- subsystem ownership stays clear
- no unnecessary cross-subsystem dependency is introduced

Risk questions:

- does this touch multiple subsystems?
- does this change an API?
- can this break the current flow?
- does it raise complexity more than value?
- is the planned workflow heavier than needed?
- is there a simpler path?

If impact is unclear, investigate first.
If risk is high, reduce scope or stage the work.

---

## Execution Discipline

During implementation:

- prefer coherent steps
- keep scope aligned with the task
- refactor when it improves modularity, readability, or performance
- verify with the lightest valid method
- surface real risks explicitly
- keep changes inside the responsible subsystem unless cross-system work is required
- prefer staged changes over one-shot rewrites

Do not:

- perform big-bang refactors
- expand into other subsystems without need
- create hidden dependencies

Do not perform random expansion unrelated to the task.

Controlled boldness:

- if impact is local
- if risk is understood
- if subsystem boundaries are respected

allow stronger movement within `MEDIUM` budget.

---

## Workflow Optimization Check

Review workflow quality for:

- repeated unnecessary steps
- repeated reading of the same files without new value
- over-analysis for low-risk tasks
- overbuilt implementation for local changes

If inefficiency appears:

- tighten the flow
- remove redundant steps
- stage only where staging adds real safety

---

## Final Risk Check

Before the final response, confirm:

- no unintended runtime breakage
- no accidental metric authority duplication
- no scheduler rule violation
- no unbounded performance regression
- no needless subsystem API drift
- no accidental parallel system creation

If a risk remains, state it clearly.

---

## Heartbeat Behavior

Heartbeat is for awareness and alignment, not speculative work.

Allowed heartbeat actions:

- read recent memory
- review project-state documentation
- detect architectural drift
- identify stale or conflicting documentation
- propose small documentation repairs
- evaluate workflow efficiency
- propose small workflow improvements

Adaptive heartbeat logic:

- if the system is stable, innovation may rise slightly
- if the system appears fragile, drop to `LOW` mode
- for visual work, `MEDIUM` is acceptable more often
- for architecture work, stay conservative unless there is a strong reason

Visual ambition rule:

- ATOMA is not minimal for the sake of minimalism
- when justified, raise visual quality, depth, layering, and presence
- preserve readability, preserve meaning, avoid noise

Documentation discipline:

- use surgical edits
- avoid unnecessary rewrites
- resolve conflicts instead of letting them accumulate

Workflow discipline:

- prefer clear process
- avoid chaotic execution
- remove unnecessary steps when the simpler flow is safe

Do not start unrelated implementation during heartbeat.

If nothing important requires attention, respond:

`HEARTBEAT_OK`
