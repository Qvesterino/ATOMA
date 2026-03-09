# AUDIT — GLOBAL METRICS ZERO STATE

Goal: Understand why `NetworkMetricsAggregator` still emits non-zero globals when the map has zero links.

## Findings (static analysis + instrumentation)

- **Link source inspected**
  - Aggregator guard now counts `totalLinks` from `this.networkResolver.linkSystem?.links` (adapter created in `MetricsRuntime_v1._createLinkSystemAdapter`). The adapter provides `getLinksForNode` but **has no `links` array**, so `totalLinks` logs as `0` unless the original link system (with a `.links` array) is passed directly.  
  - Added audit logs in `NetworkMetricsAggregator.compute()/computeWeighted()`:
    ```js
    console.log("ATOMA AUDIT");
    console.log("totalLinks:", totalLinks);
    console.log("contributingNodes:", contributingNodes);
    ```

- **Entry point**
  - `MetricsRuntime_v1.runNetworkMetricsAggregator()` is called from `main.js` around line 3279 when `useNetworkMetricsAggregator` is enabled. In current config (`main.js` ~7745), `externalNetworkMetricsAggregatorControl: true`, so the runtime **does not auto-run** the aggregator unless something else calls `runNetworkMetricsAggregator()`.
  - If `runNetworkMetricsAggregator()` is not invoked after link system init, the HUD falls back to `MetricsRuntime_v1._aggregateNodeMetrics()` (node average), which ignores link count.

- **Node filter**
  - Aggregator now skips nodes with zero degree (uses `getLinksForNode(nodeId)`), so `contributingNodes` reflects only connected nodes. The fallback node aggregator inside `MetricsRuntime_v1._aggregateNodeMetrics()` **still includes all nodes**, regardless of links.

- **Fallback path**
  - When no aggregator override is present (e.g., aggregator not run, or returns empty), `_publishLiveMetrics()` publishes the baseline node averages. This path does **not** check link count, so globals can be non-zero even with zero links.

## What to check at runtime

1. Open the console and observe the audit logs on startup:
   - `totalLinks:` (expected 0 on empty map)
   - `contributingNodes:` (expected 0 if no links)
2. Verify whether `runNetworkMetricsAggregator()` is called after the link system is initialized. If not, HUD values come from node averages.
3. Confirm which link container the adapter sees (`linkSystem.links`, `activeLinks`, `linkMap`). If the adapter lacks a `.links` array, `totalLinks` will stay 0 even when links exist.

## Likely root cause (before runtime confirmation)

- Globals shown on HUD likely come from the **baseline node aggregation fallback** rather than the NetworkMetricsAggregator override, because the aggregator isn’t being run (external control enabled) or its override isn’t applied. The fallback ignores link count, so metrics stay non-zero even when the link graph is empty.

> Next step: run with the new audit logs and capture the console output at map start to confirm `totalLinks`/`contributingNodes` and whether the aggregator override is ever published.
