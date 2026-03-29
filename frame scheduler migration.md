# Frame Scheduler Migration TODO

Audit of per-frame work that still runs outside `FrameScheduler` in `main.js`.
Goal: move runtime work out of `SystemRegistry.runFrame()` / inline RAF helpers and into the correct `FrameScheduler` lane where possible.

Legend:
- `background` = 2Hz
- `simulation` = 10Hz
- `visual` = 30Hz
- `realtime` = keep only for latency-critical input / camera work

## Visual 30Hz

- [ ] `visualOverlayTick` - source: `main.js` (`runVisualOverlayTick()`) - move to `visual` 30Hz.
- [ ] `nodeEditor` - source: `NodeEditor.js` via `main.js` - move to `visual` 30Hz if it is UI-facing; otherwise keep as a simulation tick.
- [ ] `undoRedoUi` - source: `main.js` (`updateUndoRedoUI()`) - move to `visual` 30Hz.
- [ ] `dynamicLinkColorSystem` - source: `DynamicLinkColorSystem.js` - move to `visual` 30Hz.
- [ ] `linkMetricsToVisualBridge` - source: `LinkMetricsToVisualBridge_v1.js` - move to `visual` 30Hz.
- [ ] `stressBasedParticleScaler` - source: `StressBasedParticleScaler_v1.js` - move to `visual` 30Hz.
- [ ] `cascadeVisualizerTick` - source: `SynergyCascadeVisualizer.js` via `main.js` - move to `visual` 30Hz.
- [ ] `visualNetworkTimeElasticity` - source: `VisualNetworkTimeElasticity_v1.js` - move to `visual` 30Hz.
- [ ] `synergyPulseVisuals` - source: `SynergyPulseVisuals_v1.js` - move to `visual` 30Hz.
- [ ] `harmonicResonanceCoupling` - source: `HarmonicResonanceCoupling_v1.js` - move to `visual` 30Hz.
- [ ] `harmonicHubAuraSystem` - source: `HarmonicHubAuraSystem_Session126.js` - move to `visual` 30Hz.
- [ ] `harmonicInfluencePropagation` - source: `HarmonicInfluencePropagationSystem_Session127.js` - move to `visual` 30Hz.
- [ ] `linkResonanceFlowSystem` - source: `LinkResonanceFlowSystem_Session124.js` - move to `visual` 30Hz.
- [ ] `harmonicPhaseSynchronization` - source: `HarmonicPhaseSynchronization_Session146.js` - move to `visual` 30Hz.
- [ ] `harmonicNodeResonanceHalos` - source: `HarmonicNodeResonanceHalos.js` - move to `visual` 30Hz.
- [ ] `linkVisualMoodSystem` - source: `LinkVisualMoodSystem.js` - move to `visual` 30Hz.
- [ ] `echoTrailsIntegration` - source: `main.js` / `VisualEchoTrails_v1_Integration.js` - move to `visual` 30Hz.
- [ ] `topologyViz` - source: `TopologyBiasVisualizationLayer.js` - move to `visual` 30Hz.
- [ ] `nodeLinking` - source: `NodeLinkingSystem.js` / `main.js` wrapper - keep `visual` 30Hz as the primary owner; remove the `SystemRegistry` fallback once `visual.linkingSystem` is stable.

## Simulation 10Hz

- [ ] `activeWorld` - source: `main.js` / world classes (`World.js`, `SigmaRiftChamber.js`, `DreamDesert.js`, `QuantumIsland.js`, `FractalValley.js`, `MemoryLane.js`) - move to `simulation` 10Hz.
- [ ] `hazards` - source: `EnvironmentalHazards.js` - move to `simulation` 10Hz.
- [ ] `aiNodes` - source: `AINodes.js` - move to `simulation` 10Hz.
- [ ] `linkQualityCalculator` - source: `LinkQualityCalculator.js` - move to `simulation` 10Hz.
- [ ] `linkDegradationSystem` - source: `LinkDegradationSystem.js` - move to `simulation` 10Hz.
- [ ] `audioSynergyMonitor` - source: `main.js` - move to `simulation` 10Hz.
- [ ] `harmonyCascade` - source: `CascadingHarmonicResonanceAmplification.js` via `main.js` - move to `simulation` 10Hz.
- [ ] `regionalEquilibrium` - source: `RegionalEquilibriumFieldSystem.js` - move to `simulation` 10Hz.
- [ ] `cascadingRuptures` - source: `CascadingRuptureSystem.js` - move to `simulation` 10Hz.
- [ ] `criticalNodeFailure` - source: `CriticalNodeFailureSystem.js` - move to `simulation` 10Hz.

## Background 2Hz

- [ ] `slowSemanticReset` - source: `main.js` - move to `background` 2Hz.
- [ ] `coreMaterialMutationDetector` - source: `CoreMaterialMutationDetector.js` - move to `background` 2Hz if you only need periodic safety sweeps.
- [ ] `coreMaterialPropertyLock` - source: `main.js` - move to `background` 2Hz.
- [ ] `frameAccounting` - source: `main.js` - move to `background` 2Hz if you decouple exact frame counting; otherwise keep it as diagnostic-only bookkeeping.

## Realtime Exception

- [ ] `cameraController` - source: `rosie/controls/rosieControls.js` - keep `realtime` if input latency matters; do not demote to 10Hz/30Hz unless you accept control lag.

## Notes

- `frameScheduler.register(...)` already owns several of the visual cross-layer systems now. For those, the main task is to remove the `SystemRegistry` shadow fallback, not to create a second implementation.
- The biggest cleanup wins are the visual cross-layer systems that are still duplicated between `FrameScheduler` and `SystemRegistry`.
- If you want, the next pass can be a stricter table with columns: `system`, `current owner`, `source file`, `target lane`, `remove fallback?`.
