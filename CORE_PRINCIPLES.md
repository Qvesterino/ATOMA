# Core Principles

This file contains ATOMA's stable non-negotiable invariants.

If a proposed change conflicts with these rules, the change must be reworked or explicitly escalated.

---

## Authority

- `FrameScheduler` is the timing authority.
- `MetricsRuntime_v1` is the canonical runtime metrics authority.
- `VisualHierarchyRegistry` is the visual hierarchy authority.
- Visual, HUD, audio, and FX systems must not become parallel gameplay authorities.
- `NodeLinkingSystem` is the canonical node selection and link-creation authority.

---

## Metrics

- Canonical metrics are:
  - `synergy`
  - `harmony`
  - `stability`
  - `corruption`
  - `loadPressure`
- Do not introduce duplicate metric authorities without an explicit architectural reason.
- Prefer one canonical writer and many readers over repeated local truth recomputation.

---

## Scheduler Cadence

- Simulation cadence remains `10Hz`.
- Visual cadence remains `30Hz`.
- Runtime responsiveness remains `60Hz`.
- New loops must not bypass the scheduler without an explicit, justified exception.

---

## Subsystem Boundaries

- Subsystems may evolve internally, but should not casually change another subsystem's API.
- Cross-subsystem coupling must be explicit and justified.
- Hidden helper truths, fallback truths, and duplicate pseudo-authorities are not acceptable architecture.

---

## Runtime Safety

- World switches must clean up subscriptions, timers, and scene objects.
- Semantic bus consumers must use the tracked registration lifecycle.
- Visual systems must not sacrifice browser stability for spectacle.
- Performance is a product constraint, not an optional later pass.

---

## Browser Runtime

- The canonical live validation target is `http://127.0.0.1:5173/`.
- The Vite runtime is the default truth source for smoke tests and gameplay verification.
