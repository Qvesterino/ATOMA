# FIX — METRIC AGGREGATION LINK TRIGGER

Change: After link creation in `NodeLinkingSystem.createLink()`, immediately trigger global metric aggregation:
```js
if (this.metricsRuntime?.runNetworkMetricsAggregator) {
  this.metricsRuntime.runNetworkMetricsAggregator();
} else if (window?.metricsRuntime?.runNetworkMetricsAggregator) {
  window.metricsRuntime.runNetworkMetricsAggregator();
}
```

Behavior:
- Creating a link now forces `NetworkMetricsAggregator` to run right away (fallback to `window.metricsRuntime` if instance not on `this`), ensuring CoreMetricsHUD updates instantly with new link data.
- Wrapped in try/catch with warning logs on failure; no new schedulers added.

Scope: Minimal hook in the existing createLink flow; no other systems touched.
