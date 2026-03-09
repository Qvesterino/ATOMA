# AUDIT — METRIC AGGREGATOR EXECUTION

Objective: verify whether `NetworkMetricsAggregator` runs after link creation.

## Instrumentation
- Added log at the start of `MetricsRuntime_v1.runNetworkMetricsAggregator()`:
  - `console.log("ATOMA METRICS AGGREGATOR RUNNING");`
- Added log in `_publishLiveMetrics()` right before publishing:
  - `console.log("ATOMA METRICS PUBLISHED", { ... });`

## Call sites for `runNetworkMetricsAggregator()`
- `main.js` (~3279): manual call when external control is enabled.
- `NodeLinkingSystem.createLink()` (post-link creation hook): triggers immediately after a link is added (fallback to `window.metricsRuntime` if needed).
- No other callers found.

## Expected execution flow
1) `createLink()` (NodeLinkingSystem) → triggers `runNetworkMetricsAggregator()` if `metricsRuntime` is wired.
2) `runNetworkMetricsAggregator()` logs `ATOMA METRICS AGGREGATOR RUNNING` and runs the aggregator when `useNetworkMetricsAggregator` is true.
3) `_publishLiveMetrics()` logs `ATOMA METRICS PUBLISHED ...` each tick that publishes metrics.

## Unknowns pending runtime check
- Whether `metricsRuntime` is present on the NodeLinkingSystem instance at link creation time.
- Whether the main loop actually invokes `runNetworkMetricsAggregator()` (external control flag is true in config).
- Console logs will confirm if the aggregator runs and if publish executes after link creation.

Action: run the app, create a link, and watch the console for the audit logs to confirm execution order.
