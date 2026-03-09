# METRIC WRITER MAP

## NODE METRICS

| metric | writer | file | frequency | authority |
| --- | --- | --- | --- | --- |
| synergy | SafeMetricsDNAIntegration1_0 | SafeMetricsDNAIntegration1_0.js | spawn | canonical seed |
| synergy | MetricCompatibilityLayer ⚠ | MetricCompatibilityLayer.js | spawn | compatibility (guarded) |
| synergy | NodeMetricEngine ⚠ | src/metrics/NodeMetricEngine.js (`onLinkCreated/Removed`) | event-driven | canonical |
| synergy | MetricsRuntime_v1 ⚠ | MetricsRuntime_v1.js (`_step` relax/equalize) | fixed 10 Hz | canonical (runtime) |
| harmony | SafeMetricsDNAIntegration1_0 | SafeMetricsDNAIntegration1_0.js | spawn | canonical seed |
| harmony | MetricCompatibilityLayer ⚠ | MetricCompatibilityLayer.js | spawn | compatibility |
| harmony | NodeMetricEngine ⚠ | src/metrics/NodeMetricEngine.js (`onLinkCreated/Removed`) | event-driven | canonical |
| harmony | MetricsRuntime_v1 ⚠ | MetricsRuntime_v1.js (`_step` relax/equalize) | fixed 10 Hz | canonical (runtime) |
| stability | SafeMetricsDNAIntegration1_0 | SafeMetricsDNAIntegration1_0.js | spawn | canonical seed |
| stability | MetricCompatibilityLayer ⚠ | MetricCompatibilityLayer.js | spawn | compatibility |
| stability | NodeMetricEngine ⚠ | src/metrics/NodeMetricEngine.js (`onLinkCreated/Removed`, `onOverload`) | event-driven | canonical |
| stability | MetricsRuntime_v1 ⚠ | MetricsRuntime_v1.js (`_step` relax/equalize) | fixed 10 Hz | canonical (runtime) |
| stability | CriticalNodeFailureSystem ⚠ | CriticalNodeFailureSystem.js (`updateIsolatedNodeRecovery`) | per-frame when isolated | gameplay recovery |
| corruption | SafeMetricsDNAIntegration1_0 | SafeMetricsDNAIntegration1_0.js | spawn | canonical seed |
| corruption | MetricCompatibilityLayer ⚠ | MetricCompatibilityLayer.js | spawn | compatibility |
| corruption | NodeMetricEngine ⚠ | src/metrics/NodeMetricEngine.js (`onLinkCreated/Removed`) | event-driven | canonical |
| corruption | MetricsRuntime_v1 ⚠ | MetricsRuntime_v1.js (`_step` relax/equalize) | fixed 10 Hz | canonical (runtime) |
| corruption | LinkCorruptionTransmission_v1 ⚠ | LinkCorruptionTransmission_v1.js (`handleInfection`, `handleInfectionComplete`) | per-frame (corruption spread) | gameplay |
| corruption | NodeLinkingSystem ⚠ | NodeLinkingSystem.js (`_writeNodeCorruption` via contagion) | per-frame contagion | gameplay |
| loadPressure | SafeMetricsDNAIntegration1_0 | SafeMetricsDNAIntegration1_0.js | spawn | canonical seed |
| loadPressure | MetricCompatibilityLayer ⚠ | MetricCompatibilityLayer.js | spawn | compatibility |
| loadPressure | NodeMetricEngine ⚠ | src/metrics/NodeMetricEngine.js (`onLinkCreated/Removed`, `onOverload`) | event-driven | canonical |
| loadPressure | MetricsRuntime_v1 ⚠ | MetricsRuntime_v1.js (`_step` relax/equalize) | fixed 10 Hz | canonical (runtime) |

⚠ = multiple writers present (canonical + compatibility/gameplay)
❌ = visual writers (none detected)

## LINK METRICS

| metric | writer | file | frequency | authority |
| --- | --- | --- | --- | --- |
| link.userData.synergy | NodeLinkingSystem | NodeLinkingSystem.js (link creation, ComputeSynergyScore2_1 → userData.synergy) | per link creation | canonical |
| link.userData.corruptionLevel | LinkCorruptionTransmission_v1 ⚠ | LinkCorruptionTransmission_v1.js (`updateLinkCorruption`, `setLinkCorruption`) | per-frame | canonical gameplay |
| link.userData.corruptionLevel | PHASE5_NetworkSynchronization_v1 ⚠ | PHASE5_NetworkSynchronization_v1.js (`synchronizeCorruption`) | sync pass | gameplay/sync |
| link.userData.corruptionLevel | T4003/T4004 test scaffolding | _T4003_CORRUPTION_CASCADE_TEST_RUNNER.js, T4004_HARMONY_HEALING_TEST_RUNNER.js | test-only | debug |

⚠ = multiple writers on same metric (active + sync/debug)
