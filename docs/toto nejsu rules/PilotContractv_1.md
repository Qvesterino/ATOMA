🧠 ATOMA – Linking System
Pilot Contracts v0.1 (Non-Invasive Design Pilots)
0. Purpose of Pilot Contracts

Pilot Contracts define minimal, additive behavioral agreements that:

reduce architectural risk

introduce explicit boundaries

preserve all existing functionality

prepare the system for future refactors

⚠️ These pilots do NOT mandate immediate code changes.
They define how future changes must behave.

Pilot 1 — Request-Based Collapse Contract
Problem Addressed

Currently, semantic systems (e.g. LinkCollapseSystem) can:

evaluate collapse conditions

directly trigger structural unlinking

This violates authority separation and creates order-sensitive side effects.

🎯 Objective

Separate collapse decision from collapse execution.

Semantic systems decide that a link should collapse.
Structural systems decide when and how it is removed.

Contract Definition
Collapse Request (Conceptual)

A collapse must be expressed as a request, not an action.

Required properties (conceptual, not code):

linkId

reason (quality, corruption, overload, priority, etc.)

severity (soft / critical / forced)

timestamp

sourceSystem

Authority Rules
Semantic Domain

✅ MAY evaluate collapse conditions

✅ MAY emit a collapse request

❌ MAY NOT remove links

❌ MAY NOT call unlink/remove APIs directly

Structural Domain

✅ MAY accept or reject collapse requests

✅ MAY schedule unlinking safely

✅ MAY perform actual link removal

❌ MAY NOT reinterpret semantic meaning

Invariants

Collapse evaluation is pure semantic logic

Structural unlinking is the only topology mutation

Visual systems react after structural change

Acceptance Criteria (Design-Level)

It is possible to identify all collapse causes without executing unlink

Structural unlink can be delayed, batched, or denied

Collapse visuals never cause unlinking themselves

Pilot 2 — Priority Single-Writer Contract
Problem Addressed

link.priority is currently mutated by:

LinkPrioritySystem

LinkPriorityDecayEngine

This creates:

dual authority

temporal drift

hard-to-debug behavior

🎯 Objective

Ensure exactly one authoritative writer for link priority state.

Other systems may:

read

suggest

estimate

But only one may write.

Contract Definition
Priority Ownership

One system is designated as Priority Authority

All priority mutation flows through it

Other systems become priority contributors, not writers.

Authority Rules
Priority Authority System

✅ MAY write link.priority

✅ MAY apply decay, aging, tier changes

❌ MAY NOT evaluate unrelated semantics

Priority Contributor Systems

✅ MAY compute decay suggestions

✅ MAY emit priority influence signals

❌ MAY NOT write to link.priority

❌ MAY NOT persist priority state

Invariants

link.priority has exactly one writer

Priority changes are time-consistent

Priority is semantically meaningful, not visually driven

Acceptance Criteria (Design-Level)

It is always clear which system owns priority

Removing contributors does not break correctness

Visual thickness reacts, but never decides priority

Pilot 3 — Interaction Fence Contract
Problem Addressed

Interaction systems (raycast, hover, crosshair) risk:

leaking into semantic state

mutating shared data

coupling input to logic

🎯 Objective

Create a hard fence between interaction state and link semantics.

Interaction affects selection and perception only.

Contract Definition
Interaction State

Interaction systems may write only to:

transient interaction state

selection / hover flags

cursor / targeting context

They may never write to:

link.userData

node.userData (except interaction namespace)

semantic metrics

Authority Rules
Interaction Systems

✅ MAY read topology

✅ MAY read semantic state (for feedback)

❌ MAY NOT mutate semantic or structural state

❌ MAY NOT trigger collapse, decay, or corruption

Invariants

Interaction is non-authoritative

Disabling interaction does not alter simulation

Input never becomes logic

Acceptance Criteria (Design-Level)

Interaction systems can be disabled without changing outcomes

Hover/crosshair never affect link health or structure

Interaction state is isolated and ephemeral

4. Cross-Pilot Guarantees

If all three pilots are respected:

Structural mutations are predictable

Semantic evolution is explainable

Visual truth is preserved

Interaction remains safe and debuggable

These pilots together form the minimum viable authority separation.

5. Status & Next Steps

Pilot Contracts v0.1 are:

non-invasive

backward-compatible

implementation-agnostic

Valid next phases:

Pilot instrumentation (logging only)

Authority-safe refactor planning

Temporal orchestration pilot