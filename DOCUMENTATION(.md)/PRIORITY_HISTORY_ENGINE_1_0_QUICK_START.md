# Priority History Engine 1.0 — Quick Start (5 Minutes)

---

## 🚀 Installation (3 Steps)

### Step 1: Import
```javascript
import { PriorityHistoryEngine1_0 } from './PriorityHistoryEngine1_0.js';
```

### Step 2: Initialize (AFTER PriorityDecayEngine)
```javascript
window.game.priorityHistoryEngine = new PriorityHistoryEngine1_0(
  window.game.linkingSystem,
  window.game.priorityDecayEngine || null,
  window.game.metricsSystem || null
);
```

### Step 3: Add to Animation Loop (AFTER PriorityDecayEngine tick)
```javascript
function animate(now) {
  const deltaMs = now - lastFrameTime;
  lastFrameTime = now;

  // PriorityDecayEngine updates link.priority.score
  if (window.game.priorityDecayEngine) {
    window.game.priorityDecayEngine.tick(deltaMs);
  }

  // PriorityHistoryEngine reads updated scores and records samples
  if (window.game.priorityHistoryEngine) {
    window.game.priorityHistoryEngine.tick(deltaMs);
  }

  renderer.render(scene, camera);
}
```

**⚠️ IMPORTANT:** Call history engine AFTER decay engine so it captures updated scores!

---

## 📊 Verify It Works (Developer Console)

```javascript
// Check status
window.game.priorityHistoryEngine.status()

// Expected output:
{
  enabled: true,
  linksTracked: 15,
  samplesTotal: 450,
  errors: 0,
  bufferSize: 60,
  memoryEstimate: "30KB",
  lastTick: 1699825600123
}
```

If `enabled: true` and `linksTracked > 0` → **✓ It's working!**

---

## 📈 What It Records

For **each link**, the engine tracks:

```
Every 500ms:
  • Score (0-1)      — Priority value
  • Tier (0-3)       — Priority level
  • Traffic (0-1)    — Activity intensity
  • Timestamp (ms)   — When sample recorded

Stores last 60 samples = ~30 second window
```

---

## 🎯 Console Commands (Quick Reference)

### Get History for Link
```javascript
// Get all samples for link (chronological order)
window.game.priorityHistoryEngine.getLinkHistory('node-1_to_node-2')

// Output: Array of { t, score, tier, traffic }
```

### Get Stats for Link
```javascript
// Get comprehensive stats for link
window.game.priorityHistoryEngine.getLinkStats('node-1_to_node-2')

// Output: 
{
  id: 'node-1_to_node-2',
  score: { current, min, max, avg, range },
  trend: { risingTicks, fallingTicks, stableTicks },
  activity: { activeTicks, idleTicks, activityRatio }
}
```

### Get Trend
```javascript
// Determine if link is rising, falling, or stable
window.game.priorityHistoryEngine.getTrend('node-1_to_node-2')

// Output: 'rising' | 'falling' | 'stable' | 'unknown'
```

### Top Links by Metric
```javascript
// Top 5 most active links
window.game.priorityHistoryEngine.getTopBy('activity.activeTicks', 5)

// Top 10 highest average score
window.game.priorityHistoryEngine.getTopBy('score.avg', 10)

// Output: Array of stats objects sorted descending
```

### Global Snapshot
```javascript
// Get overview of all tracked links
window.game.priorityHistoryEngine.getSnapshotSummary()

// Output: 
{
  linksTracked: 150,
  scoreStats: { globalAvg, highestLink, lowestLink },
  activityStats: { totalActiveTicks, globalActivityRatio },
  trends: { rising, falling, stable }
}
```

### Control
```javascript
window.game.priorityHistoryEngine.enable()      // Resume tracking
window.game.priorityHistoryEngine.disable()     // Pause tracking
window.game.priorityHistoryEngine.reset()       // Clear all history
window.game.priorityHistoryEngine.cleanup()     // Remove old data
```

### Full Report
```javascript
console.log(window.game.priorityHistoryEngine.getDiagnosticReport())
```

---

## 📚 Common Queries

### "Which links are currently rising in priority?"
```javascript
const summary = window.game.priorityHistoryEngine.getSnapshotSummary();
console.log(`${summary.trends.rising} links are rising`);

// Get all rising links:
const allStats = [];
const links = window.game.linkingSystem.links;
for (const link of links) {
  const trend = window.game.priorityHistoryEngine.getTrend(link.id);
  if (trend === 'rising') {
    allStats.push(link);
  }
}
```

### "What's the average priority score across all links?"
```javascript
const summary = window.game.priorityHistoryEngine.getSnapshotSummary();
console.log(`Global avg score: ${summary.scoreStats.globalAvg.toFixed(3)}`);
```

### "Which link has been active the most?"
```javascript
const topActive = window.game.priorityHistoryEngine.getTopBy('activity.activeTicks', 1);
console.log(topActive[0]);  // Most active link
```

### "Show me link history for debugging"
```javascript
const history = window.game.priorityHistoryEngine.getLinkHistory('link-id');
console.table(history);  // Display in table format
```

---

## ⚙️ Configuration

Default settings (adjust if needed):

```javascript
window.game.priorityHistoryEngine.setConfig({
  bufferSize: 60,        // Don't change after init
  minDeltaScore: 0.01,   // Threshold for trend detection
  trendWindow: 10,       // How many samples for trend
});
```

**Note:** `bufferSize` cannot be changed after initialization (safety).

---

## ✅ Testing (5 Minutes)

### Test 1: Verify Tracking
```javascript
// 1. Create linked nodes
// 2. Generate traffic on them
// 3. Check after 30 seconds:
const history = window.game.priorityHistoryEngine.getLinkHistory('link-id');
console.log(`Recorded ${history.length} samples`);
// Should show 60 samples (full buffer after 30s at 500ms interval)
```

### Test 2: Detect Rising Trend
```javascript
// 1. Create high-traffic link
// 2. Keep traffic steady
// 3. Check trend:
const trend = window.game.priorityHistoryEngine.getTrend('link-id');
console.log(`Link is ${trend}`);  // Should be 'stable' or 'rising'
```

### Test 3: Detect Falling Trend
```javascript
// 1. Create link with traffic
// 2. Stop all traffic (idle for 5+ seconds)
// 3. Check trend:
const trend = window.game.priorityHistoryEngine.getTrend('link-id');
console.log(`Link is ${trend}`);  // Should be 'falling'
```

### Test 4: Top Queries
```javascript
// Get most active links
const topActive = window.game.priorityHistoryEngine.getTopBy('activity.activeTicks', 5);
console.log('Top 5 active:', topActive.map(s => s.id));
```

### Test 5: Memory Check
```javascript
const status = window.game.priorityHistoryEngine.status();
console.log(`Tracking ${status.linksTracked} links, ~${status.memoryEstimate}`);
// Should be efficient even with 100+ links
```

---

## 🔍 Troubleshooting

| Problem | Solution |
|---------|----------|
| `linksTracked: 0` | Create some nodes and links in ATOMA |
| `errors > 0` | Check console for error messages |
| Memory growing | Run `.cleanup()` periodically |
| Trend always 'unknown' | Need at least 2 samples (wait 1 second) |
| Inconsistent data | Make sure decay engine called first |

---

## 📊 Data Structure (What's Stored)

### Per Link
```
Buffer of 60 samples:
  ├─ Timestamp (when recorded)
  ├─ Score (0-1)
  ├─ Tier (0-3)
  └─ Traffic (0-1)

Aggregates:
  ├─ Min/Max/Avg Score
  ├─ Rising/Falling/Stable Ticks
  ├─ Active/Idle Ticks
  └─ Creation & Last Update times
```

### Memory Usage
- Per link: ~1-2 KB (60 samples × 16 bytes)
- 100 links: ~100-200 KB (negligible)
- 1000 links: ~1-2 MB (still fine)

---

## 🎓 How It Works (30 Seconds)

```
1. Every 500ms (tick):
   Read: link.priority.score, tier, traffic
   
2. Store in circular buffer:
   buffer[writeIndex] = { timestamp, score, tier, traffic }
   
3. Update aggregates:
   Track min/max/avg scores
   Count rising/falling/stable changes
   Count active/idle time
   
4. Provide analytics:
   Get history (chronological samples)
   Get stats (aggregates)
   Get trend (rising/falling/stable)
   Top N queries
```

---

## 🚀 Next Steps

1. ✓ Copy `PriorityHistoryEngine1_0.js`
2. ✓ Add import & initialization
3. ✓ Add tick to animation loop (AFTER decay engine)
4. ✓ Run console test
5. ✓ Deploy! 🎉

---

## 📞 Need Help?

Get full diagnostic:
```javascript
console.log(window.game.priorityHistoryEngine.getDiagnosticReport())
```

Read complete guide: `PRIORITY_HISTORY_ENGINE_1_0_IMPLEMENTATION_SUMMARY.md`

---

**Status:** 🟢 **READY TO GO!**

Install in 5 minutes, test in 5 minutes, deploy! 🎉
