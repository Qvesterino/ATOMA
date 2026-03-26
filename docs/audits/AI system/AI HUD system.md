# AUDIT REPORT: AI HUD SYSTEMS

## AIAutomationHUD.js (Variant A - Frozen)

### Data Source
**NONE** - The `updateAIAutomationHUD(report)` function exists but is never called with real data.

### Connection Status
**DISCONNECTED** - No data source wired to this HUD.

### Why Inactive
1. ❌ **Never mounted** - No call to `mountAIAutomationHUD()` anywhere in codebase
2. ❌ **No data calls** - `updateAIAutomationHUD()` exists but never invoked
3. ❌ **Explicitly frozen** - File header states: "FROZEN - read-only, no data wiring, no authority"
4. ❌ **Placeholder-only** - HTML contains hardcoded "--" placeholders for all values
5. ❌ **Design intent** - Labeled as "reference implementation" for future variants

### Expected Data Structure (from code)
```javascript
{
  meta: {
    mode: string,
    generatedAt: timestamp
  },
  snapshot: {
    linksCreated: number,
    linksCollapsed: number,
    recoveryReady: string
  },
  network: {
    state: string
  },
  recommendations: Array<{
    id: string,
    severity: 'info'|'warn'|'critical',
    message: string,
    reasoning: object
  }>
}
```

---

## VariantBAdvisorHUD.js (Variant B - Compact Advisor)

### Data Source
`window.__ATOMA_AI_ADVISOR__` (global window object)

### Connection Status
**MOUNTED BUT STATIC** - HUD is mounted and visible, but data never changes.

### Why Inactive
1. ✅ **Mounted** - Called via `mountVariantBAdvisorHUD(document.body)` in main.js
2. ✅ **Initial render** - Called once with static data in main.js
3. ❌ **No dynamic updates** - `window.__ATOMA_AI_ADVISOR__` is static:
   ```javascript
   window.__ATOMA_AI_ADVISOR__ = {
     stability: 0.72,      // Static value
     risk: 0.18,           // Static value  
     recovery: 'LOW',        // Static value
     insight: 'System stable. No intervention required.' // Static message
   };
   ```
4. ❌ **No integration** - No system (metricsRuntime, networkStressAggregator, cascadeEventBridge, etc.) updates this data
5. ❌ **No update loop** - No repeated calls to `updateVariantBAdvisorHUD()` after initial paint

### Expected Data Structure
```javascript
{
  stability: number (0-1),
  risk: number (0-1),
  recovery: string,
  insight: string
}
```

---

## Summary Table

| HUD | Mounted | Data Connected | Dynamic Updates | Status |
|-----|---------|----------------|-----------------|--------|
| AIAutomationHUD | ❌ No | ❌ No | ❌ No | **Dead** - Reference only |
| VariantBAdvisorHUD | ✅ Yes | ❌ Static | ❌ No | **Static** - Shows hardcoded values |

---

## Root Cause Analysis

### Why These HUDs Are Not Active

**Both HUDs suffer from the same fundamental issue:**

1. **No Metrics Runtime Integration**
   - Neither connects to `metricsRuntime_v1` which tracks real-time:
     - `networkSynergy`
     - `harmonyFlow`
     - `corruptionLevel`
     - `networkStress`
     - `loadPressure`

2. **No Network Stress Monitoring**
   - Neither connects to `networkStressAggregator` which provides cascade tiers

3. **No Cascade Event Integration**
   - Neither subscribes to cascade events (`cascade.start`, `cascade.hop`, `cascade.end`)

4. **No Automation Engine Integration**
   - Variant A mentions "automation engine" but `LinkAutomationEngine1_0` exists yet doesn't update this HUD
   - No connection to `linkRecommendationAI` or `linkMLRecommendationEngine`

5. **Design Philosophy**
   - ATOMA emphasizes "emergent behavior" and "data-driven visuals"
   - These HUDs were designed as UI scaffolds, not production systems
   - Real AI advisories would require integration with simulation, not just display

---

## Recommended Fix (If Making Active)

To make these HUDs show real data, you would need to:

1. **Wire to MetricsRuntime**:
   ```javascript
   const liveMetrics = getCachedVisualMetrics();
   updateVariantBAdvisorHUD({
     stability: liveMetrics.avgStability,
     risk: liveMetrics.avgCorruption,
     recovery: 'HIGH',  // From harmonyStabilizationSystem
     insight: generateInsight(liveMetrics)
   });
   ```

2. **Add Update Loop**:
   ```javascript
   frameScheduler.register('simulation', (dt) => {
     const metrics = metricsRuntime_v1.getLiveMetrics();
     updateVariantBAdvisorHUD({
       stability: 1 - metrics.networkStress,
       risk: metrics.corruptionLevel,
       // ...
     });
   }, 'hud.aiAdvisorUpdate');
   ```

3. **Integrate Automation Engine** for Variant A:
   ```javascript
   linkAutomationEngine.onRecommendation((rec) => {
     updateAIAutomationHUD({
       meta: { mode: 'AUTOMATED', generatedAt: Date.now() },
       snapshot: rec.snapshot,
       recommendations: rec.recommendations
     });
   });
   ```

**However, given the "FROZEN" status and "scaffold" labels, these appear to be intentional placeholders.** The actual AI advisory system would require deeper architectural work connecting automation logic to UI display.

---

## Implementation Status (2026-03-26)

The runtime wiring has now been implemented in `main.js`:

1. `AIAutomationHUD` is mounted and refreshed from a live report object.
2. `VariantBAdvisorHUD` now reads from `window.__ATOMA_LIVE_METRICS__` via a live report builder.
3. Both HUDs are refreshed on the simulation scheduler path (`simulation.aiHudReports`).
4. `AIAutomationHUD` receives live recommendation items from `linkRecommendationAI` when a primary node is available.