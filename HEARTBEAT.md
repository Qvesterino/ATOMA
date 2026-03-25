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

---

## Active Assumptions

Start every session assuming:

- dormant or partial systems may exist
- explicit wiring matters
- performance matters because ATOMA runs in the browser
- evolution is allowed when core invariants are preserved

Default mode: `EVOLUTION_V2 MODE`

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

If impact is unclear, investigate first.

---

## Execution Discipline

During implementation:

- prefer coherent steps
- keep scope aligned with the task
- refactor when it improves modularity, readability, or performance
- verify with the lightest valid method
- surface real risks explicitly
- keep changes inside the responsible subsystem unless cross-system work is required

Do not perform random expansion unrelated to the task.

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

Do not start unrelated implementation during heartbeat.

If nothing important requires attention, respond:

`HEARTBEAT_OK`
