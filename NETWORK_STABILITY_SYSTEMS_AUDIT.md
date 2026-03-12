# Network Stability / Instability / NetworkStress Audit  
Date: 2026-03-12  
Scope: Locate stability/instability/network-stress/load-pressure systems, map metric usage and activation, highlight visual + simulation effects and problems.

## System Map
| SYSTEM | FILE | METRIC | TYPE | ACTIVE | SCHEDULER |
| --- | --- | --- | --- | --- | --- |
| MetricsRuntime_v1 | `D:\ATOMA_CLEAN\MetricsRuntime_v1.js` | Reads `node.userData.metrics` (stability, loadPressure); writes relaxed/equalized metrics and publishes `networkStress` to `__ATOMA_LIVE_METRICS__`/`world.metrics.global`. | simulation / metrics orchestrator | Yes | Animate loop (per RAF, not FrameScheduler) |
| NetworkMetricsAggregator | `D:\ATOMA_CLEAN\src\metrics\NetworkMetricsAggregator.js` | Aggregates `metrics.stability` → `networkStress`, plus synergy/harmony/loadPressure. | simulation / aggregator | Event-driven (called via `MetricsRuntime_v1.runNetworkMetricsAggregator`, triggered by `NodeLinkingSystem` link events; external control flag ON) | Triggered from `NodeLinkingSystem` (no persistent scheduler) |
| NodeMetricEngine | `D:\ATOMA_CLEAN\src\metrics\NodeMetricEngine.js` | Writes canonical `node.userData.metrics` (`stability`, `loadPressure`, etc.) via `applyMetricImpulse`, `onLinkCreated/Removed`, `onOverload`. | simulation / metric writer | Yes (event hooks in `NodeLinkingSystem`, recovery paths) | Event-driven (link spawn/removal, overload, recovery) |
| LinkCorruptionTransmission_v1 | `D:\ATOMA_CLEAN\LinkCorruptionTransmission_v1.js` | Computes `networkStress` = collapsed-links ratio; uses for rebuild gating. No stability writes. | simulation | Yes | FrameScheduler `simulation.linkCorruptionTransmission` (safeTick) |
| ParticleEmissionScaler | `D:\ATOMA_CLEAN\ParticleEmissionScaler.js` | Reads per-node corruption + computes `networkStress` from link load (currentLinks/maxLinkCapacity) → emission multiplier; mirrors to `loadPressure/networkLoad` cache. | visual / particle scaling | Yes | FrameScheduler `visual.particleEmissionScaler` (shouldRunVisual guard, ~30 Hz) |
| CriticalNodeFailureSystem | `D:\ATOMA_CLEAN\CriticalNodeFailureSystem.js` | Reads `metrics.stability`/corruption; writes stability recovery via `applyMetricImpulse`; drives stress auras + link strain visuals. | simulation + visual | No (instantiated but `enabled = false` by default) | SystemRegistry entry `criticalNodeFailure` gated by `_runSlowSemanticPending`; not run unless enabled |
| CascadingRuptureSystem | `D:\ATOMA_CLEAN\CascadingRuptureSystem.js` | Reads `metrics.stability` (<0.4) + corruption → cascade triggers; visual particle hooks. | simulation + visual | No (instantiated, disabled by default) | SystemRegistry entry `cascadingRuptures` gated by `_runSlowSemanticPending`; not run unless enabled |
| MetricInterpretationLayer_v1 | `D:\ATOMA_CLEAN\MetricInterpretationLayer_v1.js` | Derives per-node `networkStress` from collapsed links; writes `visualNetworkStressDensity` & other visual metrics. | visual prep | No (not instantiated in `main.js`) | None |
| CanonicalTemplate3_StressVisuals | `D:\ATOMA_CLEAN\CanonicalTemplate3_StressVisuals.js` | Consumes `networkStress` + `node.loadPressure` → fog color shift, ambient jitter. | visual | No (template only; no runtime wiring found) | None |

## Visual & Simulation Effects Detected
- **MetricsRuntime_v1** relaxes/equalizes stability + loadPressure across nodes and equalizes stability over links (weak rate), effectively a simulation stabilizer.
- **ParticleEmissionScaler** scales all particle systems (links/nodes/glyphs) with stress: higher load → jitterier emission; uses derived load-based stress, not published `__ATOMA_LIVE_METRICS__.networkStress`.
- **CriticalNodeFailureSystem** (when enabled) applies node stress aura, link strain wobble, and sever visuals during countdowns; recovery nudges stability upward.
- **CascadingRuptureSystem** (when enabled) triggers cascade particles/waves when low stability + high corruption.
- **LinkCorruptionTransmission_v1** uses collapsed-link stress to block rebuilds; drives corruption spread visuals via its own internal phases (not tied to published metrics).
- **MetricInterpretationLayer_v1** would write per-node visual stress density (jitter/chaos scaling) but is currently dormant.
- **CanonicalTemplate3_StressVisuals** defines fog tint + node jitter for stress/load; unused.

## Detected Problems / Conflicts
- **NetworkStress has three separate definitions**  
  - MetricsRuntime_v1: average node `metrics.stability` (published).  
  - LinkCorruptionTransmission_v1: collapsed-link ratio (simulation gating).  
  - ParticleEmissionScaler: average link-capacity load.  
  These shadow each other; visuals (ParticleEmissionScaler) ignore the published metric, and rebuild gating uses a different measure → fragmented authority.
- **Dual writers to `node.metrics.stability`**  
  - NodeMetricEngine (event impulses) and MetricsRuntime_v1 (continuous relaxation + link equalization) both mutate stability; risk of hiding spikes or undoing recovery signals.
- **Stress visuals not connected to canonical metric**  
  - CanonicalTemplate3_StressVisuals + MetricInterpretationLayer_v1 are defined but never instantiated; live visuals instead use load-derived stress via ParticleEmissionScaler. Network stress UI/visuals therefore do not reflect the published `__ATOMA_LIVE_METRICS__.networkStress`.
- **Critical safety systems inactive by default**  
  - CascadingRuptureSystem and CriticalNodeFailureSystem are instantiated but disabled; stability-driven safeguards and their visuals never run unless manually enabled.

## Activation Notes
- FrameScheduler: active for `ParticleEmissionScaler` (visual) and `LinkCorruptionTransmission_v1` (simulation).  
- Animate loop: `MetricsRuntime_v1.update()` runs every RAF outside FrameScheduler.  
- SystemRegistry: contains slow-semantic entries for CascadingRupture/CriticalNodeFailure but gated and disabled.  
- No main.js instantiation for MetricInterpretationLayer_v1 or CanonicalTemplate3_StressVisuals → currently dead templates.
