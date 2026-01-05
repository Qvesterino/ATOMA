# SynergyHighways2_0 Integration Guide

Quick, non-breaking integration of visual synergy route analysis into ATOMA.

---

## 30-Second Setup

```javascript
// 1. Import (at top of main.js or where systems are initialized)
import { SynergyHighways2_0 } from './SynergyHighways2_0.js';

// 2. Initialize (after linkingSystem is created)
SynergyHighways2_0.init(linkingSystem, window.linkHistoryTracker);
window.synergyHighways = SynergyHighways2_0;

// 3. Call on link changes (add to NodeLinkingSystem)
// When a link is created, removed, or synergy changes:
SynergyHighways2_0.updateOnLinkChange(link);

// Done! Highways are now computed and tracked.
```

---

## What SynergyHighways2_0 Does

Groups high-synergy links into visual **highways** representing flow routes:

- **Input → Process → Integration → Analytics → Storage → Control** (main pipeline)
- **Special paths** for Sigma, Quantum, Emotional nodes
- **Real-time metrics**: count, average synergy, trends, volatility
- **Visual properties**: color, intensity, animation speed based on quality

**Example highway:**
```
process → integration (8 links, avg synergy 0.78, trend: rising)
  └─ Color: neon green
  └─ Intensity: 0.72 (very bright)
  └─ Speed: 2.1 (fast pulse)
  └─ Visual: thick, glowing flow line
```

---

## Integration Points

### Point 1: Import & Initialize

```javascript
// main.js, top of file with other imports
import { SynergyHighways2_0 } from './SynergyHighways2_0.js';

// In setup/initialization section:
const linkingSystem = new NodeLinkingSystem(...);
const linkHistoryTracker = new LinkHistoryTracker1_0(...);

// Initialize highways (after both systems exist)
SynergyHighways2_0.init(linkingSystem, linkHistoryTracker);
window.synergyHighways = SynergyHighways2_0;
```

### Point 2: Notify on Link Creation

```javascript
// In NodeLinkingSystem.createLink()
const link = { /* ... */ };
this.links.push(link);

// [SynergyHighways] Notify of new link
if (window.synergyHighways) {
  window.synergyHighways.updateOnLinkChange(link);
}
```

### Point 3: Notify on Link Removal

```javascript
// In NodeLinkingSystem.removeLink()
const link = this.links[index];
this.links.splice(index, 1);

// [SynergyHighways] Notify of removal
if (window.synergyHighways) {
  window.synergyHighways.updateOnLinkChange(link);
}
```

### Point 4: Notify on Synergy Change

```javascript
// When link.synergyScore is updated:
link.synergyScore = newScore;

// [SynergyHighways] Update highways
if (window.synergyHighways) {
  window.synergyHighways.updateOnLinkChange(link);
}
```

### Point 5: Update Visuals (Optional)

```javascript
// In main render loop (optional, for real-time updates):
if (window.synergyHighways) {
  window.synergyHighways.updateVisuals();
}

// Or call manually when needed
window.synergyHighways.updateVisuals();
```

---

## How It Works

### 1. Highway Grouping

Links are automatically grouped by source & target **categories**:

```
input → process
process → integration
integration → analytics
analytics → storage
storage → control
control → input  (feedback)

sigma → input, process, integration
quantum → analytics, storage
emotional → control, input
```

### 2. Metrics per Highway

Each highway tracks:

- **linkCount:** How many individual links use this route
- **avgSynergy:** Average quality (0.0–1.0)
- **maxSynergy:** Best link on this highway
- **trend:** Rising, falling, or stable (from LinkHistoryTracker)
- **volatility:** How much scores fluctuate (from LinkHistoryTracker)

### 3. Visual Mapping

Like LinkGlowSynergyEngine1_0, but for routes:

```javascript
avgSynergy → width, intensity, speed, color

0.0–0.4  → Dim cyan, thin, slow
0.4–0.65 → Teal, medium, moderate speed
0.65–0.85 → Green, thick, fast
0.85–1.0 → Bright, very thick, very fast (bloom active)
```

### 4. Real-Time Updates

- **Throttled rebuild** (default: every 500ms) when links change
- **Visual updates** (every frame) recalculate metrics from current link scores
- **Event-driven:** Only recomputes affected highways

---

## API Reference

### Initialization

```javascript
// Initialize with systems
SynergyHighways2_0.init(linkingSystem, historyTracker)

// Set reference for access
window.synergyHighways = SynergyHighways2_0;
```

### Link Updates

```javascript
// Notify when links change
SynergyHighways2_0.updateOnLinkChange(link)

// Or manually schedule rebuild
SynergyHighways2_0.scheduleRebuild()

// Or force immediate rebuild
SynergyHighways2_0.rebuild()
```

### Queries

```javascript
// Get all highways
const highways = SynergyHighways2_0.getHighways();

// Get specific highway
const hw = SynergyHighways2_0.getHighway('process', 'integration');

// Get top N by synergy
const topHws = SynergyHighways2_0.getTopHighways(5);

// Get by trend
const rising = SynergyHighways2_0.getHighwaysByTrend('rising');

// Get stats
const stats = SynergyHighways2_0.getStats();
// Returns: { highwayCount, totalLinks, avgSynergy, maxSynergy, trends }
```

### Inspection

```javascript
// Inspect specific highway
const info = SynergyHighways2_0.inspect('process', 'integration');

// Inspect all highways
const all = SynergyHighways2_0.inspect();
```

### Configuration

```javascript
// Set options
SynergyHighways2_0.setConfig({
  rebuildThrottleMs: 500,    // Min time between rebuilds
  updateThrottleMs: 100,     // Min time between visual updates
  minLinkCount: 1,           // Include routes with N+ links
  minAvgSynergy: 0.0,        // Include routes with avg >= this
  enableDebugVisuals: false, // Draw wireframes
  enableLogging: false       // Console debug
});

// Get current config
const cfg = SynergyHighways2_0.getConfig();
```

### Control

```javascript
// Enable/disable
SynergyHighways2_0.setEnabled(true/false);

// Debug logging
SynergyHighways2_0.setDebug(true/false);

// Clear all
SynergyHighways2_0.clear();

// Check cache status
const valid = SynergyHighways2_0.isCacheValid();
```

---

## Debug Commands

In browser console:

```javascript
// View all highways
console.log(window.synergyHighways.getHighways());

// View statistics
console.log(window.synergyHighways.getStats());

// View top 5 highways
console.log(window.synergyHighways.getTopHighways(5));

// Inspect specific highway
console.log(window.synergyHighways.inspect('process', 'integration'));

// Enable debug logging
window.synergyHighways.setDebug(true);

// Force rebuild
window.synergyHighways.rebuild();

// Check if working
if (window.synergyHighways.getHighways().length > 0) {
  console.log('✓ Highways active');
}
```

---

## Example Output

### Highway Object Structure

```javascript
{
  id: "process→integration",
  fromCategory: "process",
  toCategory: "integration",
  linkCount: 8,
  avgSynergy: 0.78,
  maxSynergy: 0.92,
  trend: "rising",
  volatility: 0.23,
  visuals: {
    width: 1.36,        // Line width in pixels
    intensity: 0.62,    // Opacity/glow
    speed: 2.04,        // Pulse speed
    color: 0x00b385,    // Neon green
    bloomActive: true   // Critical paths have bloom
  }
}
```

### Stats Output

```javascript
{
  highwayCount: 11,
  totalLinks: 64,
  avgSynergy: 0.71,
  maxSynergy: 0.95,
  trends: {
    rising: 4,
    falling: 2,
    stable: 5
  }
}
```

---

## Common Use Cases

### 1. Monitor Network Flow Quality

```javascript
const stats = window.synergyHighways.getStats();
console.log(`Network has ${stats.highwayCount} highways, avg quality: ${(stats.avgSynergy * 100).toFixed(1)}%`);
```

### 2. Find Best Routes

```javascript
const topRoutes = window.synergyHighways.getTopHighways(3);
topRoutes.forEach(hw => {
  console.log(`${hw.fromCategory} → ${hw.toCategory}: ${hw.linkCount} links, ${(hw.avgSynergy * 100).toFixed(0)}% quality`);
});
```

### 3. Find Unstable Routes

```javascript
const risingPaths = window.synergyHighways.getHighwaysByTrend('rising');
const fallingPaths = window.synergyHighways.getHighwaysByTrend('falling');

console.log(`🔺 Rising: ${risingPaths.length}, 🔻 Falling: ${fallingPaths.length}`);
```

### 4. Identify Problematic Routes

```javascript
const allHws = window.synergyHighways.getHighways();
const problematic = allHws.filter(hw => hw.avgSynergy < 0.4 || hw.volatility > 0.5);
console.log(`⚠️ ${problematic.length} problematic routes`);
```

### 5. Export Network Analysis

```javascript
const highways = window.synergyHighways.getHighways();
const analysis = highways.map(hw => ({
  route: hw.id,
  links: hw.linkCount,
  quality: (hw.avgSynergy * 100).toFixed(1) + '%',
  stability: hw.volatility < 0.3 ? 'Stable' : 'Volatile',
  trend: hw.trend
}));

console.table(analysis);
```

---

## Performance

### Typical Metrics

| Operation | Time | Impact |
|-----------|------|--------|
| Initial rebuild (64 links) | ~8ms | One-time startup |
| Scheduled rebuild (throttled) | <2ms | Every 500ms max |
| Visual update (per frame) | <1ms | Per-frame cost |
| Query (getHighways, etc.) | <0.1ms | Negligible |

### Memory Usage

- Engine state: ~2KB
- Per-highway: ~1-2KB
- Typical (10 highways): ~15KB
- Typical (20 highways): ~25KB

### Optimization Tips

1. **Disable visual updates** if not rendering highways visually:
   ```javascript
   SynergyHighways2_0.setConfig({ enableDebugVisuals: false });
   ```

2. **Increase throttle** if rebuild is too frequent:
   ```javascript
   SynergyHighways2_0.setConfig({ rebuildThrottleMs: 1000 });
   ```

3. **Batch updates** if many links change at once:
   ```javascript
   // Don't call updateOnLinkChange for each link
   // Instead, call rebuild() once after all changes
   for (const link of newLinks) {
     linkingSystem.createLink(source, target);
   }
   SynergyHighways2_0.rebuild();
   ```

---

## Troubleshooting

### No Highways Appearing

**Check:**
1. Are links assigned categories?
   ```javascript
   const links = linkingSystem.links;
   console.log(links[0].source.userData.category); // Should show category
   ```

2. Is initialization called?
   ```javascript
   console.log(window.synergyHighways.getHighways().length);
   ```

3. Is updateOnLinkChange being called?
   ```javascript
   window.synergyHighways.setDebug(true);
   // Create a link, should see console output
   ```

**Solution:**
```javascript
// Force rebuild
window.synergyHighways.rebuild();
```

### Highways Not Updating

**Check:**
1. Is synergy score being set?
   ```javascript
   console.log(linkingSystem.links[0].synergyScore);
   ```

2. Is updateOnLinkChange called on score change?
   ```javascript
   // In ComputeSynergyScore2_0 or wherever scores change:
   if (window.synergyHighways) {
     window.synergyHighways.updateOnLinkChange(link);
   }
   ```

**Solution:**
```javascript
// Manual trigger
window.synergyHighways.updateVisuals();
```

### Performance Issues

**Check:**
1. How many highways?
   ```javascript
   console.log(window.synergyHighways.getHighways().length);
   ```

2. How frequently is rebuild called?
   ```javascript
   window.synergyHighways.setDebug(true);
   ```

**Solution:**
```javascript
// Increase throttle time
SynergyHighways2_0.setConfig({ rebuildThrottleMs: 2000 });

// Or disable visual updates if not rendering
SynergyHighways2_0.setConfig({ enableDebugVisuals: false });
```

---

## Integration with Other Systems

### LinkHistoryTracker1_0

```javascript
// Automatically used if passed to init()
SynergyHighways2_0.init(linkingSystem, linkHistoryTracker);

// Provides:
// - Trend data (rising/falling/stable)
// - Volatility metrics
// - Historical context
```

### LinkGlowSynergyEngine1_0

```javascript
// Highway visuals follow same curves as link glows:
// - Color progression: cyan → aqua → green → white
// - Width/intensity increase with synergy
// - Bloom effect at critical synergy (>0.85)
```

### ComputeSynergyScore2_0

```javascript
// Highway metrics depend on per-link synergy scores
// Ensure scores are set before calling updateOnLinkChange()
link.synergyScore = computeSynergyScore(link);
window.synergyHighways.updateOnLinkChange(link);
```

---

## Clean Integration Checklist

- [ ] Import SynergyHighways2_0.js
- [ ] Call init() with linkingSystem and linkHistoryTracker
- [ ] Add updateOnLinkChange() call on link creation
- [ ] Add updateOnLinkChange() call on link removal
- [ ] Add updateOnLinkChange() call on synergy score updates
- [ ] Verify highways appear: `SynergyHighways2_0.getHighways().length > 0`
- [ ] Test debug commands
- [ ] Monitor performance

---

## See Also

- [Implementation Details](SYNERGY_HIGHWAYS_IMPLEMENTATION.md)
- [Test Scenarios](SYNERGY_HIGHWAYS_TEST_SCENARIOS.md)
- [Visual Reference](SYNERGY_HIGHWAYS_VISUAL_REFERENCE.md)
- [LinkGlowSynergyEngine Integration](SYNERGY_GLOW_INTEGRATION.md)
- [LinkHistoryTracker Integration](README_LINK_HISTORY_TRACKER.md)
