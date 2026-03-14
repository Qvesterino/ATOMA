# Metrics Authority Contract v2

Status: ACTIVE (authoritative)
Scope: Node canonical metrics, derived metrics, network/global aggregation.

## 1. Canonical Node Metrics

All node metrics are stored in:

`node.userData.metrics`

Required keys (all float 0.0..1.0):

- `stability`
- `corruption`
- `loadPressure`
- `harmony`
- `synergy`

Meaning:

- `stability`: resistance to instability and collapse.
- `corruption`: entropy/risk level.
- `loadPressure`: operational/network pressure on the node.
- `harmony`: coherence with network state.
- `synergy`: quality of node cooperation (derived metric).

## 2. Architecture Layers (official)

### Base layer (authoritative state)

- `stability`
- `corruption`
- `loadPressure`
- `harmony`

These are canonical state variables and may be written only by authorized writers.

### Derived layer

- `synergy`

`synergy` is strictly derived from base metrics.
It is not an independent canonical writer target.

Required rule:

`synergy = f(harmony, stability, corruption, loadPressure)`

No direct manual writes to `node.userData.metrics.synergy` outside authorized derivation step.

### Network/global layer

Aggregated from node/link truth:

- `networkSynergy`
- `harmonyFlow`
- `networkStress`
- `corruptionLevel`
- `loadPressure`

## 3. Write Authority Matrix

### Allowed writers

- `SafeMetricsDNAIntegration*`:
  - spawn snapshot only (initial values only, no runtime ownership)
- `NodeMetricEngine`:
  - canonical runtime writer for node metrics (event impulses + fixed tick integration)
- `MetricsRuntime_v1`:
  - orchestration/scheduling/sanitization + global aggregation/publish
  - NOT the long-term canonical writer of node metric dynamics

### Long-term authority decision

Node metric dynamics belong to `NodeMetricEngine`.
`MetricsRuntime_v1` should coordinate and publish, not own metric semantics.

## 4. Forbidden

- Per-frame ad-hoc writes from random systems to `node.userData.metrics.*`
- Legacy writes to `node.userData.synergy/harmony/stability/corruption/loadPressure`
- Mixed scales (0..100 or percentages) in canonical storage
- Independent direct writes to `synergy` without derivation path

## 5. Interaction Rules (official semantics)

- Higher `harmony` tends to increase `synergy`.
- Higher `corruption` reduces `harmony` and `synergy`.
- Higher `loadPressure` increases `corruption`.
- Higher `loadPressure` decreases `harmony`.
- Lower `stability` amplifies corruption growth.
- Higher `stability` damps noise/instability propagation.

## 6. Mandatory Runtime Behavior

### Event-driven impulses (fast path)

Event systems can apply impulses through `NodeMetricEngine.applyMetricImpulse(...)`.

### Fixed tick integration (stable path)

At fixed tick (recommended 10 Hz):

1. Integrate base metric interactions (`stability`, `corruption`, `loadPressure`, `harmony`)
2. Recompute derived metric `synergy`
3. Clamp all metrics to `0..1`

### Global publish path

`MetricsRuntime_v1` aggregates and publishes global metrics after node truth is updated.

## 7. Integrated Notes (from review)

### 7.1 Synergy must not be canonical independent writer

Accepted and locked:

- `synergy` is a derived metric only.
- Runtime systems must not treat `synergy` as an independent source-of-truth input writer.

### 7.2 Stability must be functionally stronger

`stability` must actively influence:

- corruption growth damping/amplification
- event noise damping
- link jitter suppression/amplification

Simple baseline relaxation alone is not enough for final design.

### 7.3 LoadPressure must be active, not passive

`loadPressure` must be a live driver in:

- node/link traffic dynamics
- corruption pressure growth
- harmony/synergy degradation under stress
- integration points in linking/packet/bead traffic subsystems

## 8. Current Codebase Direction

If code paths conflict with this contract, this contract is normative.
Migration target:

1. Keep node truth in `NodeMetricEngine`
2. Keep orchestration and publish in `MetricsRuntime_v1`
3. Keep global metrics as aggregated outputs, not independent truth

