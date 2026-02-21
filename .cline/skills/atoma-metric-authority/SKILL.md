---
name: atoma-metric-authority
description: Canonical metric authority rules for ATOMA engine.
---

# ATOMA Metric Authority Skill

This skill defines the constitutional rules for how metrics behave in ATOMA.
It is the single source of truth for metric lifecycle, interaction,
mutation rights, and runtime discipline.

---

# I. Canonical Metrics (Gameplay Truth Layer)

Each node owns exactly five canonical metrics:

- synergy
- harmony
- stability
- corruption
- loadPressure

Storage location:

node.userData.metrics = {
  synergy: number,       // 0..1 float
  harmony: number,       // 0..1 float
  stability: number,     // 0..1 float
  corruption: number,    // 0..1 float
  loadPressure: number   // 0..1 float
}

Rules:
- Range is strictly 0.0 – 1.0
- Float only
- No percentage reinterpretation
- No hidden scaling
- HUD may display ×100 but must not alter value

Global metrics are derived only:

- networkSynergy = avg(node.synergy)
- harmonyFlow = avg(node.harmony)
- networkStress = avg(node.loadPressure)
- corruptionLevel = avg(node.corruption)
- loadPressure (global) = weighted avg or max

Global metrics never overwrite node metrics.

---

# II. Single Writer Law

Only the following systems may mutate metrics:

1. NodeMetricEngine
   - May create and initialize node metrics
   - May apply event-driven raw impulses

2. MetricsRuntime (Fixed Relax Tick)
   - May apply interaction kernel updates
   - May perform smoothing and stabilization

Forbidden writers:

- Visual systems
- HUD systems
- Shader systems
- Gameplay scripts
- Node constructors
- Arbitrary subsystems
- Direct property assignments outside MetricEngine/Runtime

Forbidden pattern examples:

node.userData.metrics.harmony += 0.1        ❌
node.metrics = {}                           ❌
mesh.material.opacity = f(metrics) that feeds back ❌

If a system requires metric change:
→ it must emit an event consumed by NodeMetricEngine.

---

# III. Interaction Kernel Authority

All cross-metric interactions must be centralized
inside a single interaction kernel.

No ad-hoc adjustments allowed elsewhere.

Core principles:

- corruption reduces harmony
- harmony suppresses corruption
- loadPressure increases corruption
- corruption reduces stability
- harmony increases synergy

All interactions must:
- operate on normalized 0..1 values
- use deltaTime or fixed tick
- be deterministic
- clamp results to 0..1

No subsystem may implement partial versions of these rules.

---

# IV. Event Impulse Discipline

Event-driven changes are allowed only as raw impulses.

Examples of allowed impulses:

onLinkCreated:
  loadRaw += X

onNodeLinked:
  synergyRaw += Y

Not allowed:

node.userData.metrics.harmony += 0.3      ❌
node.userData.metrics.corruption = 1      ❌

All impulses must be normalized through the canonical
normalization function before affecting canonical metrics.

Normalization function:

norm(x, K) = 1 - e^(-x/K)

---

# V. Fixed Relax Tick Law

Metrics must evolve via fixed tick.

Default:
- 10 Hz (0.1s)

Implementation model:

ACC += realDt
while (ACC >= FIXED_DT):
  updateMetrics(FIXED_DT)
  ACC -= FIXED_DT

Rules:
- dt must be clamped (max 0.25)
- coefficients express per-second change
- no FPS-dependent metric logic allowed

Metrics must not depend on render loop frequency.

---

# VI. Map Switch Contract

On map switch:

1. metricsRuntime.dispose() must be called
2. New runtime must be initialized only after:
   - aiNodes
   - linkingSystem
   - scene graph

Runtime must never hold stale references.

Failure to rebind runtime is a constitutional violation.

---

# VII. Determinism Requirements

Metric updates must be:

- Order-independent (no race conditions)
- Free of randomness unless explicitly seeded
- Frame-rate independent
- Free of hidden feedback from visuals

Metrics define world state.
Visual systems reflect metrics.
Never the inverse.

---

# VIII. Forbidden Patterns (Strict)

The following actions are unconstitutional:

- Multiple metric writers
- Direct mutation outside MetricEngine/Runtime
- Reinterpreting metric meaning in UI
- Shader feedback loops altering metrics
- Aggregator writing back to nodes
- Global metric overwriting per-node metrics
- Bypassing normalization
- Creating additional canonical metrics

If ambiguity arises:
STOP.
Request clarification.

---

# IX. Intent of This Skill

This skill exists to ensure:

- Metric determinism
- Behavioral stability
- Architectural clarity
- Long-term maintainability
- Single source of truth

Metrics are the nervous system of ATOMA.

If they fragment, the engine fragments.