🧠 ATOMA – Linking System Design Contract
Version 0.2 (Authority & Domains Spec)
0. Purpose of This Contract

This document defines non-negotiable architectural rules for the ATOMA Linking System.

Its purpose is to:

establish clear authority ownership

prevent hidden side-effects

preserve emergent behavior

enable safe long-term evolution

This contract is binding for all future work on linking.

1. Core Principles (Invariants)
I1 — Single Authority per Responsibility

Each responsibility must have exactly one owning domain.

If a subsystem:

mutates multiple responsibility types
→ it is an architectural risk, not a feature.

I2 — Direction of Influence Is One-Way

The only valid direction of influence is:

Structural → Semantic → Visual → Interpretive


Reverse influence is forbidden.

I3 — Linking Never Owns Node Visuals

The Linking System:

may emit influence signals

may request visual responses

It may never directly own or restore node visuals.

I4 — Semantics Cannot Mutate Structure Directly

Semantic systems:

may evaluate

may request

may recommend

They may never directly create or remove links.

I5 — Visual Systems Are Read-Only by Definition

Visual systems:

may read any semantic state

may animate freely

They may never mutate:

link.userData

node.userData

structural topology

I6 — Time Is an Explicit Responsibility

Execution timing is a first-class concern.

No system may:

silently change its cadence

mix frame logic and tick logic without orchestration

2. Linking Domains (Authoritative Separation)
2.1 Structural Domain
Purpose

Owns the existence and topology of links.

Responsibilities

create / remove links

validate endpoints

maintain link indices

repair and hardening logic

Allowed Writes

link topology

link indices / registries

structural metadata only

Forbidden

semantic evaluation (quality, corruption, priority)

visual state mutation

time-based decay logic

Examples

NodeLinker repair layers

Hardening / guard wrappers

Index healing logic

2.2 Semantic Domain
Purpose

Owns meaning, health, stress, and evolution of links.

Responsibilities

corruption / harmony / synergy propagation

quality evaluation

degradation and aging

collapse decisions

priority modeling

Allowed Writes

semantic state on links

semantic influence on nodes (via controlled surfaces)

Forbidden

direct structural mutation

direct visual mutation

ownership of render state

Mandatory Rule

Structural changes must be expressed as requests, not actions.

2.3 Visual Domain
Purpose

Owns appearance only.

Responsibilities

curves, conduits, flow

color, thickness, particles

transitions and effects

Allowed Writes

shader uniforms

material parameters

visual-only derived state

Forbidden

logic mutation

semantic mutation

structural calls

Design Guarantee

Visuals must always reflect truth, never create it.

2.4 Temporal Orchestration Domain
Purpose

Owns WHEN, never WHAT.

Responsibilities

define execution domains:

frame

tick

slow

event-driven

enforce ordering

prevent cadence drift

Allowed Writes

none

Forbidden

logic

evaluation

state mutation

3. Semantic Order Invariant

Within a single evaluation window (frame or tick), semantic processing must follow this order:

Corruption / contagion propagation

Quality evaluation

Degradation + priority updates

Collapse evaluation

Emission of structural requests

Breaking this order is a systemic instability risk.

4. Mutation Contract
Structural Mutation

may only be executed by Structural Domain

must be triggered by:

user intent

validated semantic request

repair/hardening logic

Semantic Mutation

may not cause immediate topology change

must be deterministic within its time domain

Visual Mutation

must be reversible

must not persist as authoritative state

5. Do / Don’t Rules
✅ DO

treat authority boundaries as hard contracts

flag multi-authority systems explicitly

preserve emergent behavior through separation

document ownership before optimization

❌ DON’T

refactor without authority clarity

introduce new writers to shared state

let visuals drive logic

“just throttle it” to fix architectural tension

6. Glossary

Authority
The exclusive right to mutate a specific class of state.

Domain
A bounded context with a single type of authority.

Structural Mutation
Any change that alters link existence or topology.

Semantic Mutation
A change in meaning, health, or evaluative state.

Visual Mutation
A change that affects appearance only.

Request (Structural)
A semantic signal asking for topology change, not executing it.

Emergent Behavior
System-level behavior arising from interactions, not explicit rules.

7. Status

This contract is:

Design-complete

Implementation-agnostic

Binding for future phases

Next valid steps after this document:

Pilot Design (non-invasive)

Authority-safe refactors

Temporal orchestration implementation