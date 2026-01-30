🧠 P3.1 – Meaning Contracts (Tightened)
🔻 COLLAPSE CONTRACT (v1.1)
Definition

Collapse is an authoritative semantic state indicating that a link or region has failed beyond the point of recovery.
Structural unlinking/removal is only allowed as a consequence of an explicit collapse request, not as an implicit effect of the state itself.

Inputs

Integrity state machine (primary gate)

Stress / Load severity (advisory inputs)

Quality / Corruption degradation

Optional priority-derived thresholds (read-only)

Outputs

Semantic flags: collapsed, unstable→collapsed

Explicit collapse request (signal, not action)

Visual cues (critical warnings, VFX)

Eligibility gating for healing/reconstruction

Authority

Semantic systems may declare a collapse state.

Structural systems may only perform unlink/removal in response to an explicit collapse request approved by the integrity gate.

Forbidden Behaviors (Non-Negotiable)

No implicit unlink based on visuals.

No visual system may cause collapse.

No interaction system may force collapse.

No bypassing integrity/stress preconditions.

No dual writers of collapse state.

Invariants

Collapse never changes the topology by itself.

Every structural act must have an auditable request.

Collapse request ≠ Collapse execution.

Edge Cases

Rapid oscillation (unstable ↔ collapsed): must be damped by the integrity gate (cooldown / hysteresis).

Region vs. link collapse: a regional collapse must not automatically cascade unlinks to individual links without a per-link request.

Recovery race: if healing starts before execution, the collapse request must be canceled or expired.

Notes

Collapse is a semantic authoritative signal, not a mechanical action. The visual is descriptive, not causal.

⚙️ LOAD CONTRACT (v1.1)
Definition

Load is a semantic measure of the operational pressure (traffic, throughput, work) on nodes/links.

Inputs

Traffic / usage signals

Throughput metrics

Category modifiers

Time under sustained activity

Outputs

Semantic load metrics (e.g. loadPressure)

Advisory impact on stress / instability / priority

Read-only visual scaling

Authority

Metrics systems own the load calculation.

Load is an advisory input for downstream systems.

It has no structural authority.

Forbidden Behaviors

Load never directly causes an unlink or collapse.

Load must not bypass integrity.

Load must not be driven by visuals or interactions.

Invariants

Load ≠ Stress ≠ Collapse.

Load can influence decisions, not execute them.

Edge Cases

Burst vs. sustained: short spikes must not lead to collapse without stress/integrity confirmation.

Zero-activity decay: load must decay at a defined cadence, not in leaps.

Notes

Load is an input quantity. If it turns into an action, it violates the contract.

🎭 TENSION CONTRACT (v1.1)
Definition

Tension is a perceptual and narrative signal of conflict or latent tension. It is primarily metaphorical.

Inputs

Narrative/contest metrics

Derivations of instability/stress

Designer-defined weights

Outputs

Perceptual cues (visual tension, pacing)

Advisory flags for mood/pacing

Authority

Non-authoritative.

Visual/narrative systems can render and pace.

Mechanical systems ignore it or only read advisories.

Forbidden Behaviors

Tension must not trigger collapse, unlink, or change topology.

Tension must not mutate integrity or priorities.

Interaction systems must not elevate tension to authority.

Invariants

Tension is information for the player, not a rule for the system.

Edge Cases

Feedback loop: visual increases in tension must not increase stress/load.

Designer overrides: manual increases in tension must not have a mechanical effect.

Notes

Tension is atmosphere. If it starts to "decide", it's a bug.

🔒 Cross-Contract Invariants (Global)

No visual will ever cause a structural change.

All structural changes must be auditable (request → gate → execute).

Advisory ≠ Authority.

Single-writer rules (P2) also apply in P3.