# Environment Event Trigger Notes

This note summarizes the event-bridge work done in this session.
The main change was to connect world mood, ritual lifecycle, and player ritual FX through metric/event tags while keeping the existing fallback behavior intact.

## File / Effect / Trigger

| File | Effect | Trigger |
| --- | --- | --- |
| `_WorldPersonalityController.js` | Computes aggregate world mood, emits `world.mood.snapshot` and `world.mood.changed`, and broadcasts global mood metric tags. | Aggregate node metrics cross mood thresholds or the mood label changes. |
| `_MythicRitualController.js` | Consumes world mood snapshots from the bus and starts ritual checks from event-driven updates instead of only polling. | `world.mood.snapshot` / `world.mood.changed`, with cooldown gating and polling fallback when the bus is unavailable. |
| `_MythicRitualPlayer.js` | Requests ritual energy pulses from metric tags while keeping `E` key input as a fallback. | `global.synergy.high`, `global.harmony.high`, `world.mood.changed` for matching moods, or the `E` key. |
| `MetricReactiveWorldEvents.js` | Converts local world metric changes into global bridge tags. | Threshold crossings for synergy, harmony, stability, corruption, load pressure, and temporal states. |
| `Phase8RitualVisualOrchestration.js` | Reacts to metric tags and modulates ritual visual intensity. | `global.synergy.*`, `global.harmony.*`, `global.stability.high`, `global.loadPressure.high`. |
| `NetworkRituals_v1.js` | Bridges ritual lifecycle events into global metric tags. | `ritual:start`, `ritual:progress`, `ritual:complete`, `ritual:abort`. |
| `_SafeLegendaryWorldEvents.js` | Maps high-tier metric tags to major world event states. | High synergy, harmony, corruption, stability, and load tags. |
| `TemporalEventEffects.js` | Converts metric tags into temporal milestone effects. | `global.harmony.mid`, `global.loadPressure.high`, `global.synergy.high`, `global.stability.high`. |
| `_NodeMicroEvents.js` | Emits node-level micro event tags from local node metric changes. | `node.stability.high`, `node.harmony.high`, `node.synergy.high`, `node.loadPressure.high`. |
| `RitualVisualOrchestrator.js` | Uses metric signals to bias ritual modifier intensity and damping. | `global.synergy.high`, `global.harmony.high`, `global.loadPressure.high`. |

## Not Part Of This Map

These are orchestration, read-only, or wrapper-only systems and were not part of the trigger bridge work:

- `EnvironmentDomainController.js`
- `NetworkStateAIReasoner.js`
- `PHASE5_MultiNetworkManager_v1.js`
- `PHASE5_InterNetworkVisualizationBridge_v1.js`
