# Frame Scheduler Migration TODO

Audit of per-frame work that still runs outside `FrameScheduler` in `main.js`.
Goal: move runtime work out of `SystemRegistry.runFrame()` / inline RAF helpers and into the correct `FrameScheduler` lane where possible.

Legend:
- `background` = 2Hz
- `simulation` = 10Hz
- `visual` = 30Hz
- `realtime` = keep only for latency-critical input / camera work

## Visual 30Hz

- [x] `activeWorld` - source: `main.js` / world classes (`World.js`, `SigmaRiftChamber.js`, `DreamDesert.js`, `QuantumIsland.js`, `FractalValley.js`, `MemoryLane.js`) - owned by `visual.activeWorld`; `SystemRegistry` path is now `regGuard(...)`.
- [x] `aiNodes` - source: `AINodes.js` - owned by `visual.aiNodes`; `SystemRegistry` path is now `regGuard(...)`.
- [x] `dynamicLinkColorSystem` - source: `DynamicLinkColorSystem.js` - owned by `visual.dynamicLinkColorSystem`; `SystemRegistry` path is now `regGuard(...)`.
- [x] `cascadeVisualizerTick` - source: `SynergyCascadeVisualizer.js` via `main.js` - owned by `visual.cascadeVisualizer`; `SystemRegistry` path is now `regGuard(...)`.
- [x] `visualNetworkTimeElasticity` - source: `VisualNetworkTimeElasticity_v1.js` - owned by `visual.visualNetworkTimeElasticity`; legacy fallback only drains pending dt.
- [x] `synergyPulseVisuals` - source: `SynergyPulseVisuals_v1.js` - owned by `visual.synergyPulseVisuals`; legacy fallback only drains pending dt.
- [x] `harmonicResonanceCoupling` - source: `HarmonicResonanceCoupling_v1.js` - owned by `visual.harmonicResonanceCoupling`; `SystemRegistry` path is now `regGuard(...)`.
- [x] `harmonicHubAuraSystem` - source: `HarmonicHubAuraSystem_Session126.js` - owned by `visual.harmonicHubAuraSystem`; `SystemRegistry` path is now `regGuard(...)`.
- [x] `harmonicInfluencePropagation` - source: `HarmonicInfluencePropagationSystem_Session127.js` - owned by `visual.harmonicInfluencePropagation`; `SystemRegistry` path is now `regGuard(...)`.
- [x] `linkResonanceFlowSystem` - source: `LinkResonanceFlowSystem_Session124.js` - owned by `visual.linkResonanceFlowSystem`; `SystemRegistry` path is now `regGuard(...)`.
- [x] `harmonicPhaseSynchronization` - source: `HarmonicPhaseSynchronization_Session146.js` - owned by `visual.harmonicPhaseSynchronization`; `SystemRegistry` path is now `regGuard(...)`.
- [x] `harmonicNodeResonanceHalos` - source: `HarmonicNodeResonanceHalos.js` - owned by `visual.harmonicNodeResonanceHalos`; `SystemRegistry` path is now `regGuard(...)`.
- [x] `linkVisualMoodSystem` - source: `LinkVisualMoodSystem.js` - owned by `visual.linkVisualMoodSystem`; `SystemRegistry` path is now `regGuard(...)`.
- [x] `echoTrailsIntegration` - source: `main.js` / `VisualEchoTrails_v1_Integration.js` - owned by `visual.echoTrailsIntegration`; `SystemRegistry` path is now `regGuard(...)`.
- [ ] `topologyViz` - source: `TopologyBiasVisualizationLayer.js` - now owned by `simulation.topologyViz` because it is gated by slow semantic cadence; revisit only if it needs purely visual 30Hz behavior.
- [ ] `nodeLinking` - source: `NodeLinkingSystem.js` / `main.js` wrapper - keep `visual` 30Hz as the primary owner; remove the `SystemRegistry` fallback once `visual.linkingSystem` is stable.

## Simulation 10Hz

- [x] `nodeEditor` - source: `NodeEditor.js` via `main.js` - owned by `simulation.nodeEditor`; `SystemRegistry` path is now `regGuard(...)`.
- [x] `undoRedoUi` - source: `main.js` (`updateUndoRedoUI()`) - owned by `simulation.undoRedoUi`; `SystemRegistry` path is now `regGuard(...)`.
- [x] `visualOverlayTick` - source: `main.js` (`runVisualOverlayTick()`) - owned by `simulation.visualOverlayTick`; `SystemRegistry` path is now `regGuard(...)`.
- [x] `hazards` - source: `EnvironmentalHazards.js` - owned by `simulation.hazards`; `SystemRegistry` path is now `regGuard(...)`.
- [x] `linkMetricsToVisualBridge` - source: `LinkMetricsToVisualBridge_v1.js` - owned by `simulation.linkMetricsToVisualBridge`; `SystemRegistry` path is now `regGuard(...)`.
- [x] `stressBasedParticleScaler` - source: `StressBasedParticleScaler_v1.js` - owned by `simulation.stressBasedParticleScaler`; `SystemRegistry` path is now `regGuard(...)`.
- [x] `linkQualityCalculator` - source: `LinkQualityCalculator.js` - already owned by `simulation.linkQualityCalculator`; legacy fallback is now `regGuard(...)`.
- [x] `linkDegradationSystem` - source: `LinkDegradationSystem.js` - owned by `simulation.linkDegradationSystem`; `SystemRegistry` path is now `regGuard(...)`.
- [x] `audioSynergyMonitor` - source: `main.js` - owned by `simulation.audioSynergyMonitor`; `SystemRegistry` path is now `regGuard(...)`.
- [x] `harmonyCascade` - source: `CascadingHarmonicResonanceAmplification.js` via `main.js` - owned by `simulation.harmonyCascade`.
- [x] `regionalEquilibrium` - source: `RegionalEquilibriumFieldSystem.js` - owned by `simulation.regionalEquilibrium`; still keyed off slow semantic pending state.
- [x] `cascadingRuptures` - source: `CascadingRuptureSystem.js` - owned by `simulation.cascadingRuptures`; still keyed off slow semantic pending state.
- [x] `criticalNodeFailure` - source: `CriticalNodeFailureSystem.js` - owned by `simulation.criticalNodeFailure`; `SystemRegistry` path is now `regGuard(...)`.
- [x] `topologyViz` - source: `TopologyBiasVisualizationLayer.js` - owned by `simulation.topologyViz`; kept on slow semantic cadence instead of 30Hz visual.

## Background 2Hz

- [x] `slowSemanticReset` - source: `main.js` - owned by `background.slowSemanticReset`; now only clears stale pending state if any survives past the simulation lane.
- [x] `coreMaterialMutationDetector` - source: `CoreMaterialMutationDetector.js` - owned by `background.coreMaterialMutationDetector`; cadence preserved with a ~5s accumulator.
- [x] `coreMaterialPropertyLock` - source: `main.js` - owned by `background.coreMaterialPropertyLock`; cadence preserved with a ~5s accumulator.
- [ ] `frameAccounting` - source: `main.js` - move to `background` 2Hz if you decouple exact frame counting; otherwise keep it as diagnostic-only bookkeeping.

## Realtime Exception

- [ ] `cameraController` - source: `rosie/controls/rosieControls.js` - keep `realtime` if input latency matters; do not demote to 10Hz/30Hz unless you accept control lag.

## Notes

- Visual first wave is done for the cross-layer pending systems and mood/color lanes.
- Simulation second wave is done for `nodeEditor`, `visualOverlayTick`, `undoRedoUi`, hazards, metric/particle bridge lanes, link quality/degradation, audio synergy, regional equilibrium, rupture/failure logic, and topology visualization.
- Background second wave is done for slow semantic stale-reset and the periodic core-material safety sweeps.
- Remaining open items are mainly UI/overlay or bridge paths that still need an explicit `FrameScheduler` owner.
