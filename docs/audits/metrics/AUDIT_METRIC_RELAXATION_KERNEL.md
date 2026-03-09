# METRIC RELAXATION KERNEL AUDIT (MetricsRuntime_v1)

- Fixed tick: `_fixedDt = 0.1s` (10 Hz).
- Relaxation pass runs inside `_step(dt)` for every node that has `userData.metrics` and `userData.archetypeMetrics`.
- Clamp: `_clamp01` applied after every relax (0..1).
- Damping form: exponential decay toward archetype baseline with rate `relaxSpeed = 0.02` per 10 Hz tick (≈2% toward target each step).
- Additional equalization: synergy & harmony equalized across linked nodes at `equalizeRate = 0.05` per tick (also clamped).
- No per-metric smoothing beyond the above; stability/corruption/loadPressure are not equalized across links.

## Metric Details

| Metric | Relax formula (per tick) | Damping | Min / Max | Extras |
|--------|--------------------------|---------|-----------|--------|
| synergy | `m.synergy += (base.synergy - m.synergy) * 0.02` → `_clamp01` | exponential 2% step toward base each 0.1s | 0 / 1 | Link equalization: `dS = (mb.synergy - ma.synergy) * 0.05`; `ma.synergy += dS`, `mb.synergy -= dS`, both clamped. |
| harmony | `m.harmony += (base.harmony - m.harmony) * 0.02` → `_clamp01` | exponential 2% step | 0 / 1 | Link equalization: `dH = (mb.harmony - ma.harmony) * 0.05`; clamped. |
| stability | `m.stability += (base.stability - m.stability) * 0.02` → `_clamp01` | exponential 2% step | 0 / 1 | No link equalization. |
| corruption | `m.corruption += (base.corruption - m.corruption) * 0.02` → `_clamp01` | exponential 2% step | 0 / 1 | No link equalization. |
| loadPressure | `m.loadPressure += (base.loadPressure - m.loadPressure) * 0.02` → `_clamp01` | exponential 2% step | 0 / 1 | No link equalization. |

## Notes

- Relaxation requires both `node.userData.metrics` and `node.userData.archetypeMetrics`; nodes lacking either are skipped.
- No separate smoothing kernels (EMA) are applied to these node metrics inside `_step`; the only smoothing is the relaxSpeed damping and optional link equalization for synergy/harmony.
- Live network metrics published later in `_publishLiveMetrics()` use a separate smoothing factor `_dampingFactor = 0.1`, but that affects HUD outputs, not the node metrics themselves.
