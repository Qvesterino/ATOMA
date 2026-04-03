---
name: atoma-metric-authority
description: Canonical metric authority rules for ATOMA engine.
---

# ATOMA Metric Authority Skill

This skill defines the constitutional rules for how metrics behave in ATOMA.
It is the single source of truth for metric lifecycle, interaction,
mutation rights, and runtime discipline.

Current runtime convention:

- canonical node storage: `node.userData.metrics`
- canonical node metric fields: `synergy`, `harmony`, `stability`, `corruption`, `loadPressure`
- canonical node update feed: `node.metric.updated`
- public scoped tier events: `node.<metric>.<tier>`, `global.<metric>.<tier>`, `link.<metric>.<tier>`, `hub.<metric>.<tier>`
- internal debug tier hook: `metric.tier.changed`
- legacy compatibility bridge only: `metric.phase.changed`

Default validation entrypoints in this workspace:

- static runtime: `http://127.0.0.1:5500/index.html`
- Vite dev runtime: `http://localhost:5173/`
- Python server: `http://localhost:8080/`
- manual browser smoke: Microsoft Edge

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

Live global publish note:

- if no active links exist, live global publish should resolve to zeroes
- when active links exist, global publish should use the active-linked network slice, not dormant isolated nodes
- HUDs may smooth display values, but smoothing must remain presentation-only

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

Preferred scoped tier names for feature wiring:

- `node.synergy.high`
- `node.harmony.high`
- `node.stability.high`
- `node.corruption.high`
- `node.loadPressure.high`
- `global.synergy.high`
- `global.harmony.high`
- `global.stability.high`
- `global.corruption.high`
- `global.loadPressure.high`
- `link.synergy.high`
- `link.harmony.high`
- `link.stability.high`
- `link.corruption.high`
- `link.loadPressure.high`
- `hub.synergy.high`
- `hub.harmony.high`
- `hub.stability.high`
- `hub.corruption.high`
- `hub.loadPressure.high`

Tier values:

- `low`: `0.25`
- `high`: `0.75`
- `lowExit`: `0.32`
- `highExit`: `0.68`

The hysteresis window exists to prevent flapping around tier boundaries.

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

Current data flow contract:

1. `NodeLinkingSystem.attemptLink()` creates or removes links.
2. `NodeMetricEngine` mutates node metrics and emits `node.metric.updated`.
3. `MetricsRuntime_v1` aggregates active-linked nodes and publishes global metrics.
4. `CoreMetricsHUD` is read-only and may smooth presentation values.
5. `NodeInspectOverlay1_0` is read-only and must recover after link creation.

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

Public event contract:

- Use scoped tier events for features and VFX: `node.<metric>.<tier>`, `global.<metric>.<tier>`, `link.<metric>.<tier>`, `hub.<metric>.<tier>`
- Use `node.metric.updated` for canonical node metric update feeds.
- Use `metric.tier.changed` only for internal debugging/tooling.
- Use `metric.phase.changed` only for legacy compatibility.
- Keep old threshold aliases only as bridge inputs, not new feature wiring.

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
