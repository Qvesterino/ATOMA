# RUNTIME BURST MAPPING VERIFICATION

**Date:** 2026-03-20  
**Scope:** Active WaveBurstRouter ingress flow after regime-source implementation  
**Focus:** Event -> burst type mapping, regime source, travel context, source identity

---

## Executive Summary

The active burst ingress path is now centered in `WaveBurstRouter_v1.js`.

Verified behavior:

1. All router-bound semantic events are converted into `WaveInterferenceEngine.requestBurstIntent(intent)` calls.
2. Non-cascade events map to fixed burst families.
3. Cascade events map dynamically based on `conflictType`, `link.userData.flowState.type`, or node metrics fallback.
4. Regime boundaries are now derived locally in the router from existing metrics/flow state, with per-source previous/current memory.
5. Link travel context is now forwarded for cascade link events.

---

## Verified Entry Path

Active ingress path:

```text
semanticBus event
  -> WaveBurstRouter_v1.emitIntent(...)
  -> resolveType(...)
  -> resolveBoundary(...)
  -> waveInterferenceEngine.requestBurstIntent(intent)
```

Verified in:

- `WaveBurstRouter_v1.js`
- `WaveInterferenceEngine_v1.js`

---

## Fixed Event Mappings

These events map to fixed burst families without cascade-family heuristics.

| Event Tag | Burst Type | Regime Source Priority | Travel | Source Identity |
|---|---|---|---|---|
| `node.synergy.high` | `synergy` | node metrics, then link flow state fallback | no | node-centric |
| `link:synergyThreshold` | `synergy` | node metrics, then link flow state fallback | no | link if available, else node |
| `metric:synergySpike` | `synergy` | node metrics, then link flow state fallback | no | node-centric |
| `metric.synergy.burst` | `synergy` | node metrics, then link flow state fallback | no | node-centric |
| `link:harmonicLock` | `harmonic` | node metrics, then link flow state fallback | no | link if available, else node |
| `metric:harmonyPeak` | `harmonic` | node metrics, then link flow state fallback | no | node-centric |
| `network:harmonyShift` | `harmonic` | node metrics, then link flow state fallback | no | semantic fallback if no source |
| `metric:stabilityDrop` | `stability` | node metrics, then link flow state fallback | no | node-centric |
| `metric:loadPressureHigh` | `stability` | node metrics, then link flow state fallback | no | node-centric |
| `network:stressRise` | `stability` | node metrics, then link flow state fallback | no | semantic fallback if no source |
| `metric:corruptionRise` | `corruption` | node metrics, then link flow state fallback | no | node-centric |
| `metric.corruption.spike` | `corruption` | node metrics, then link flow state fallback | no | node-centric |
| `metric.corruption.spread` | `corruption` | node metrics, then link flow state fallback | no | node-centric |
| `network:corruptionSpread` | `corruption` | node metrics, then link flow state fallback | no | semantic fallback if no source |
| `metrics.spike` | `corruption` | node metrics, then link flow state fallback | no | semantic fallback if no source |
| `link:collapsed` | `corruption` | node metrics, then link flow state fallback | no | link-centric |

---

## Cascade Event Mappings

These tags enter the router as `cascade` and are resolved dynamically:

| Event Tag | Dynamic Resolution Path | Regime Source Priority | Travel | Source Identity |
|---|---|---|---|---|
| `cascade.triggered` | `conflictType` -> `flowState.type` -> node metrics fallback | node metrics first, then link flow state | no | node-centric unless explicit `linkId` present |
| `harmonic.cascade.start` | `conflictType` -> `flowState.type` -> link fallback -> `synergy` fallback | link flow state first, then node metrics | yes | link-centric when `linkId` exists |
| `cascade.start` | `conflictType` -> `flowState.type` -> link fallback -> `synergy` fallback | link flow state first, then node metrics | yes | link-centric when `linkId` exists |
| `cascade.hop` | `conflictType` -> `flowState.type` -> link fallback -> `synergy` fallback | link flow state first, then node metrics | yes | link-centric when `linkId` exists |

---

## Cascade Family Resolution Table

### Conflict-Type Driven Mapping

When cascade payload contains `conflictType` or the link contains `link.userData.flowState.type`, the router resolves burst family like this:

| Conflict / Flow Type | Resolved Burst Type |
|---|---|
| `corruption` | `corruption` |
| `destructive` | `corruption` |
| `oscillatory_balance` | `harmonic` |
| `resolved_harmony` | `harmonic` |
| `fatigue_yield` | `stability` |
| `stability` | `stability` |
| `specialization_drift` | `synergy` |

### Cascade Triggered Node-Metric Fallback

If `cascade.triggered` does not provide a usable conflict type, router falls back to source-node metrics:

| Condition | Resolved Burst Type |
|---|---|
| corruption dominates and `corruption >= 0.45` | `corruption` |
| instability dominates and `instability >= 0.55` | `stability` |
| harmony >= synergy | `harmonic` |
| otherwise | `synergy` |

Where:

```text
instability = max(1 - stability, loadPressure)
```

### Link-Event Fallback

If `cascade.hop` or `cascade.start` has no usable conflict type and no usable `flowState.type`, router falls back to:

| Condition | Resolved Burst Type |
|---|---|
| link flowState type found later via resolved link | recurse through conflict mapping |
| still unresolved | `synergy` |

---

## Regime Source Rules

### Node-Derived Regimes

Node-derived regimes are read from `node.userData.metrics` or `node.metrics`.

Metrics used:

- `synergy`
- `harmony`
- `corruption`
- `stability`
- `loadPressure`

Resolved regimes:

| Burst Type | Regime Rule |
|---|---|
| `synergy` | `baseline` / `collaborative` / `convergent` / `reinforced` with `decoherent` low-state fallback |
| `harmonic` | `diffuse` / `coherent` / `aligned`, plus `resolved` for explicit harmony flow type |
| `corruption` | `contained` / `contaminated` / `critical_divergence` / `rupture` |
| `stability` | `stable` / `unstable` / `fragmented` / `turbulent` |

### Link-Derived Regimes

Link-derived regimes are read from `link.userData.flowState`.

Fields used:

- `intensity`
- `energy`
- `type`

Link events prioritize link-derived regime resolution for:

- `cascade.hop`
- `cascade.start`
- `harmonic.cascade.start`

### Previous/Current Boundary Memory

Router stores per-source regime memory locally in:

```text
state.regimeBySource : Map<`${type}:${sourceId}`, lastRegime>
```

Boundary rule:

- `fromRegime` = previously tracked regime or `baseline`
- `toRegime` = currently resolved regime

No global `node.userData.regime` or `regimeHistory` is written.

---

## Travel Context Verification

Travel context is now forwarded into burst intent when all of the following are true:

1. event tag is one of:
   - `cascade.hop`
   - `cascade.start`
   - `harmonic.cascade.start`
2. `linkId` can be resolved

Forwarded fields:

- `linkId`
- `link`
- `sourceNode`
- `targetNode`
- `travel: true`

This enables `WaveInterferenceEngine` link-aware travel packet behavior for link-based cascade bursts.

---

## Source Identity Rules

Router currently resolves `sourceId` in this order:

1. travel link id when travel is active
2. explicit/resolved link id
3. resolved source node id
4. payload ids (`sourceNodeId`, `nodeId`, `sourceId`, `id`, `source`)
5. semantic fallback `${type}:semantic`

Result:

- link-travel cascade events are link-centric
- node-driven cascade trigger events are node-centric
- network events may remain semantic-fallback based

---

## Verified Upstream Producers

### Cascade Triggered

Observed producer shape:

- `CascadingHarmonicResonanceAmplification.js`
- emits `cascade.triggered`
- payload contains source node reference or position and strength/intensity

### Cascade Hop

Observed producer shapes:

1. `CascadeParticleSystem_Session120.js`
   - emits `cascade.hop`
   - carries `link`, `linkId`, `sourceId`, `targetId`, `position`, `intensity`, `conflictType`

2. `CascadeEventBridge_v1.js`
   - writes canonical `link.userData.flowState`
   - flow types verified:
     - `specialization_drift`
     - `corruption`
     - `destructive`
     - `oscillatory_balance`

This means current cascade-family resolution is aligned with real upstream producer semantics.

---

## Residual Risks

1. `destructive` currently maps to `corruption` family.
   This is coherent with collapse/rupture semantics, but remains a design choice.

2. `network:*` events without resolvable node/link context may still use semantic fallback identity and baseline boundary start.

3. Regime heuristics are now structured and family-aware, but still heuristic, not yet backed by a canonical project-wide semantic authority layer.

---

## Verification Verdict

**APPROVE_WITH_RISK**

Reason:

1. Burst ingress is active and coherent.
2. Event-to-family mapping is now explicit and family-aware.
3. Cascade events no longer collapse blindly into synergy bursts.
4. Regime source is derived from existing authorities without introducing a new subsystem.
5. Remaining risks are semantic-policy choices, not broken wiring or duplicate ingress.
