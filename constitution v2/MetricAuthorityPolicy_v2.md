ATOMA – Metric Authority Policy v2

Mode: Hybrid (Reality + Target Architecture)
Status: Transitional
Scope: Engine-level metric governance

1. PURPOSE

This document formalizes:

The current real-world state of the ATOMA metric system

The architectural target state

The controlled transition strategy

This is not a refactor document.
This is an authority definition.

2. CURRENT STATE (AS-IS)
2.1 Storage Model

Canonical structure:

node.userData.metrics = {
  synergy,
  harmony,
  stability,
  corruption,
  loadPressure
}

However:

Direct fields also exist (node.userData.synergy, etc.)

Multiple schemas have historically coexisted (0–1, 0–120, custom mythic)

Object overwrites occur during initialization

System classification: FRAGMENTED

2.2 Active Writers (Current Reality)
A) Bootstrap Writers

Used during node spawn:

SafeMetricsDNAIntegration

MetricCompatibilityLayer

NodeMetricEngine.ensureMetrics()

These may initialize or overwrite metric objects.

B) Event Writers

Triggered by gameplay events:

NodeMetricEngine (link events, overloads)

Ritual systems

Archetype evolution systems

These mutate metrics in response to discrete events.

C) Propagation Writers (deltaTime-based)

Continuous mutation systems:

LinkCorruptionTransmission

HarmonyStabilizationSystem

PHASE5 propagation systems

These currently use direct assignment or additive mutation.

D) Relax System

MetricsRuntime_v1 (10 Hz fixed tick)

Applies decay toward archetype baseline

This acts as a stabilizer but is currently a parallel writer.

2.3 Identified Structural Issues

12+ independent writers

Mixed = and += mutation patterns

No write coordination mechanism

Fixed-tick vs deltaTime mutation competition

Identity and dynamic state stored in same object

Destructive object overwrites during initialization

3. TARGET ARCHITECTURE (TO-BE)

The target model introduces structural clarity without immediate rewrite.

3.1 Identity vs State Separation

Metrics will be split conceptually into:

node.userData.metricIdentity   // archetype baseline (static)
node.userData.metricState      // runtime mutable state
metricIdentity

Set at spawn or evolution

Immutable during runtime

Represents archetype DNA

metricState

Dynamic gameplay state

Subject to impulses

Used for visual and gameplay systems

3.2 Centralized Runtime Mutation Authority

Target rule:

Only NodeMetricEngine may mutate metricState.

All other systems must send impulses.

Forbidden pattern (target state):

node.userData.metrics.corruption += delta;

Required pattern:

NodeMetricEngine.applyImpulse(node, {
  type: "CORRUPTION_DELTA",
  value: delta
});
3.3 Engine Responsibilities

NodeMetricEngine becomes responsible for:

Clamping

Stacking

Priority resolution

Smoothing

Decay / relax integration

Deterministic ordering

MetricsRuntime_v1 becomes an internal subsystem of NodeMetricEngine.

3.4 No Direct Object Overwrites

Target rule:

This is forbidden:

node.userData.metrics = { ... }

Initialization must use explicit API:

NodeMetricEngine.initialize(node, archetypeDNA);
4. TRANSITION STRATEGY

The transition will occur in controlled phases.

Phase 1 – Policy Formalization (Current Phase)

Document current reality

Define target model

No file modifications

Phase 2 – Audit Enforcement Mode

Nightly audit monitors:

Direct metric writes

Object overwrites

Unauthorized writers

Audit produces reports only.
No automated mutation or patching.

Phase 3 – Impulse Adapter Layer

Each propagation system:

Stops direct mutation

Calls NodeMetricEngine.applyImpulse()

Gradual migration.
No big bang refactor.

Phase 4 – Identity / State Split

Structural migration:

Separate baseline and runtime storage

Remove schema conflicts

Remove legacy compatibility layer

This phase requires careful migration planning.

5. AUTHORITATIVE RULES (EFFECTIVE IMMEDIATELY)

No new direct metric writes outside NodeMetricEngine.

No new destructive object overwrites.

All new gameplay systems must use impulse pattern.

Bootstrap layers must be explicitly labeled.

Metric schema must remain 0.0 – 1.0 normalized.

6. SYSTEM CLASSIFICATION

Current: FRAGMENTED BUT RECOVERABLE

Reasons:

Canonical authority exists

Runtime relax system is deterministic

Engine abstraction layer is already present

No total chaos; just uncoordinated mutation

This system is structurally repairable without rewrite.

7. STRATEGIC OUTCOME

After transition:

Deterministic metric evolution

Clear authority boundaries

No race conditions

Separation of identity and state

Stable foundation for AI systems and visual layers

This document supersedes any previous informal definition of "single-writer rule."