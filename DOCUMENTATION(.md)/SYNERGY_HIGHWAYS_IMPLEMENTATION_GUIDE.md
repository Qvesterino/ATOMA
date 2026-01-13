# SynergyHighways2_0 — Implementation Guide

Complete step-by-step integration with code examples.

---

## Step 1: Import & Initialize (5 minutes)

### In main.js

```javascript
// ════════════════════════════════════════════════════════════════
// IMPORT HIGHWAYS SYSTEM
// ════════════════════════════════════════════════════════════════

import { SynergyHighways2_0 } from './SynergyHighways2_0.js';

// After you create linkingSystem and linkHistoryTracker:

const linkingSystem = new NodeLinkingSystem(scene, camera, renderer, aiNodes);
const linkHistoryTracker = new LinkHistoryTracker1_0(linkingSystem, scene);

// ════════════════════════════════════════════════════════════════
// INITIALIZE HIGHWAYS
// ════════════════════════════════════════════════════════════════

SynergyHighways2_0.init(linkingSystem, linkHistoryTracker);
window.synergyHighways = SynergyHighways2_0;

console.log('✓ SynergyHighways initialized');

// Optional: Set configuration
SynergyHighways2_0.setConfig({
  rebuildThrottleMs: 500,
  enableLogging: true  // For initial debugging
});
```

---

## Step 2: Integrate with Link Creation

### In NodeLinkingSystem.createLink()

Find the location where links are pushed to the array:

```javascript
createLink(sourceNode, targetNode, extraParams = {}) {
  // ... existing link creation code ...
  
  this.links.push(link);
  
  // ════════════════════════════════════════════════════════════════
  // [SynergyHighways] Notify of new link
  // ════════════════════════════════════════════════════════════════
  if (window.synergyHighways) {
    window.synergyHighways.updateOnLinkChange(link);
  }
  
  // ... rest of method ...
}
```

---

## Step 3: Integrate with Link Removal

### In NodeLinkingSystem.removeLink()

```javascript
removeLink(link) {
  // ... existing removal code ...
  
  const index = this.links.indexOf(link);
  if (index > -1) {
    this.links.splice(index, 1);
    
    // ════════════════════════════════════════════════════════════════
    // [SynergyHighways] Notify of link removal
    // ════════════════════════════════════════════════════════════════
    if (window.synergyHighways) {
      window.synergyHighways.updateOnLinkChange(link);
    }
  }
  
  // ... rest of method ...
}
```

---

## Step 4: Integrate with Synergy Updates

### Option A: In ComputeSynergyScore2_0

```javascript
// In the synergy computation function/method:
export function computeSynergyScore(link, systemsConfig = {}) {
  // ... compute score ...
  
  const finalScore = /* calculation */;
  link.synergyScore = finalScore;
  
  // ════════════════════════════════════════════════════════════════
  // [SynergyHighways] Notify of synergy change
  // ════════════════════════════════════════════════════════════════
  if (window.synergyHighways) {
    window.synergyHighways.updateOnLinkChange(link);
  }
  
  return result;
}
```

### Option B: In NodeLinkingSystem.update() (if scores update there)

```javascript
update() {
  // ... existing code ...
  
  // Synergy score updates
  if ((frameCount % 120) === 0) {
    for (const link of this.links) {
      const newScore = computeSynergyScore(link, systemsConfig);
      if (newScore !== link.synergyScore) {
        link.synergyScore = newScore;
        
        // ════════════════════════════════════════════════════════════════
        // [SynergyHighways] Notify of synergy change
        // ════════════════════════════════════════════════════════════════
        if (window.synergyHighways) {
          window.synergyHighways.updateOnLinkChange(link);
        }
      }
    }
  }
  
  // ... rest of method ...
}
```

---

## Step 5: Optional - Update Visuals Each Frame

### In main render loop

```javascript
function animate() {
  requestAnimationFrame(animate);
  
  // ... existing updates ...
  
  linkingSystem.update();
  
  // ════════════════════════════════════════════════════════════════
  // [SynergyHighways] Update visual properties (throttled internally)
  // ════════════════════════════════════════════════════════════════
  if (window.synergyHighways) {
    window.synergyHighways.updateVisuals();
  }
  
  renderer.render(scene, camera);
}
```

---

## Step 6: Verify Integration

### Quick Verification Script

```javascript
// Run in browser console to verify integration

function verifySynergyHighways() {
  console.log('═══ Verifying SynergyHighways Integration ═══');
  
  // Check engine exists
  if (!window.synergyHighways) {
    console.error('✗ SynergyHighways not initialized');
    return false;
  }
  console.log('✓ Engine loaded');
  
  // Check highways exist
  const highways = window.synergyHighways.getHighways();
  if (highways.length === 0) {
    console.warn('⚠ No highways computed (check link categories)');
  } else {
    console.log(`✓ ${highways.length} highways computed`);
  }
  
  // Check stats
  const stats = window.synergyHighways.getStats();
  console.log('  Stats:', stats);
  
  // Check cache valid
  const valid = window.synergyHighways.isCacheValid();
  console.log(`✓ Cache valid: ${valid}`);
  
  // Sample highway
  if (highways.length > 0) {
    const first = highways[0];
    console.log('  Sample highway:', first.id, `(${first.linkCount} links, ${(first.avgSynergy*100).toFixed(0)}% quality)`);
  }
  
  console.log('═══ Verification Complete ═══');
  return highways.length > 0;
}

verifySynergyHighways();
```

---

## Step 7: Testing in Viewport

### Manual Test Sequence

```javascript
// 1. Create test nodes
const node1 = /* create INPUT node */;
const node2 = /* create PROCESS node */;

// 2. Create link between them
const link = linkingSystem.createLink(node1, node2);

// 3. Set high synergy
link.synergyScore = 0.8;
window.synergyHighways.updateOnLinkChange(link);

// 4. Check highway created
const hw = window.synergyHighways.getHighway('input', 'process');
console.log(hw); // Should show the highway

// 5. Create more links on same route
const node3 = /* create PROCESS node */;
const link2 = linkingSystem.createLink(node3, node2);
link2.synergyScore = 0.75;
window.synergyHighways.updateOnLinkChange(link2);

// 6. Check highway updated
const hw2 = window.synergyHighways.getHighway('input', 'process');
console.log(hw2); // Should show linkCount = 2
```

---

## Debugging Integration

### Enable Debug Mode

```javascript
// Enable console logging
window.synergyHighways.setDebug(true);

// Now watch console as you:
// - Create links
// - Change synergy scores
// - Remove links

// You should see output like:
// [SynergyHighways] Rebuilt 3 highways
// [SynergyHighways] Updated highway: input→process
```

### Common Issues & Solutions

#### Issue 1: No highways appear

```javascript
// Check if links have categories
const link = linkingSystem.links[0];
console.log('Source category:', link.source.userData.category);
console.log('Target category:', link.target.userData.category);

// If missing, ensure nodes are created with userData.category set:
node.userData.category = 'input'; // or 'process', etc.
```

#### Issue 2: Highways not updating on synergy change

```javascript
// Verify updateOnLinkChange is called:
window.synergyHighways.setDebug(true);

// Now change a synergy score:
link.synergyScore = 0.9;
window.synergyHighways.updateOnLinkChange(link);

// Should see debug output
```

#### Issue 3: Performance issues

```javascript
// Check how many highways exist
const count = window.synergyHighways.getHighways().length;
console.log(`${count} highways`);

// If too many, adjust config:
window.synergyHighways.setConfig({
  minLinkCount: 2,  // Only include routes with 2+ links
  minAvgSynergy: 0.3  // Only include decent quality routes
});

window.synergyHighways.rebuild(); // Rebuild with new config
```

---

## Advanced Usage

### Custom Filtering

```javascript
// Get only high-quality highways
const excellent = window.synergyHighways.getHighways()
  .filter(hw => hw.avgSynergy > 0.7);

// Get problematic highways
const problematic = window.synergyHighways.getHighways()
  .filter(hw => hw.volatility > 0.5 || hw.trend === 'falling');

// Group by trend
const byTrend = {};
window.synergyHighways.getHighways().forEach(hw => {
  if (!byTrend[hw.trend]) byTrend[hw.trend] = [];
  byTrend[hw.trend].push(hw);
});
```

### Real-Time Dashboard

```javascript
// Create a status function to call periodically
function updateHighwayStatus() {
  const stats = window.synergyHighways.getStats();
  const top = window.synergyHighways.getTopHighways(3);
  
  console.clear();
  console.log('════ NETWORK STATUS ════');
  console.log(`Highways: ${stats.highwayCount}`);
  console.log(`Total links: ${stats.totalLinks}`);
  console.log(`Avg quality: ${(stats.avgSynergy * 100).toFixed(0)}%`);
  console.log('');
  console.log('Top 3 routes:');
  top.forEach((hw, i) => {
    console.log(`${i+1}. ${hw.id}: ${hw.linkCount} links, ${(hw.avgSynergy*100).toFixed(0)}% quality`);
  });
  console.log('');
  console.log('Trends:', stats.trends);
}

// Update every 5 seconds
setInterval(updateHighwayStatus, 5000);
```

### Link Categorization

Ensure nodes are created with proper categories:

```javascript
function createCategorizedNode(scene, position, category) {
  const node = /* create mesh */;
  
  // Set category
  node.userData = {
    category: category, // 'input', 'process', etc.
    type: 'aiNode',
    color: getCategoryColor(category)
  };
  
  scene.add(node);
  return node;
}

function getCategoryColor(category) {
  const colors = {
    'input': 0x00ffff,      // Cyan
    'process': 0x00ff88,    // Green
    'integration': 0x00ffff, // Cyan
    'analytics': 0xff00ff,   // Magenta
    'storage': 0xffff00,    // Yellow
    'control': 0xff0088,    // Pink
    'sigma': 0xff00ff,      // Purple
    'quantum': 0x00ffff,    // Cyan
    'emotional': 0xff8800   // Orange
  };
  return colors[category] || 0xffffff;
}
```

---

## Integration Checklist

```
Setup Phase
- [ ] Import SynergyHighways2_0.js
- [ ] Call init() with linkingSystem and linkHistoryTracker
- [ ] Store reference in window.synergyHighways
- [ ] Set initial configuration if needed

Integration Phase
- [ ] Add updateOnLinkChange() call in createLink()
- [ ] Add updateOnLinkChange() call in removeLink()
- [ ] Add updateOnLinkChange() call when synergy scores change
- [ ] Add updateVisuals() call in main render loop (optional)

Testing Phase
- [ ] Run verifySynergyHighways() script
- [ ] Create test nodes with proper categories
- [ ] Create links between them
- [ ] Verify highways appear
- [ ] Check stats with getStats()
- [ ] Test debug commands

Optimization Phase
- [ ] Monitor performance (should be <5ms per rebuild)
- [ ] Adjust throttle times if needed
- [ ] Configure category filters if too many highways
- [ ] Enable debug logging temporarily if issues
```

---

## Performance Optimization Tips

### 1. Batch Link Creation

Instead of:
```javascript
// BAD: Rebuilds 3 times
createLink(n1, n2);
createLink(n2, n3);
createLink(n3, n4);
```

Do:
```javascript
// GOOD: Rebuild once
createLink(n1, n2);
createLink(n2, n3);
createLink(n3, n4);
window.synergyHighways.rebuild(); // One rebuild
```

### 2. Increase Throttle Time

```javascript
// Default: 500ms, increase if rebuilding too often
window.synergyHighways.setConfig({
  rebuildThrottleMs: 1000 // 1 second between rebuilds
});
```

### 3. Filter to Relevant Routes

```javascript
// Don't include all routes, only high-quality ones
window.synergyHighways.setConfig({
  minAvgSynergy: 0.4,  // Ignore routes below 40% quality
  minLinkCount: 2      // Ignore routes with only 1 link
});
```

### 4. Disable Features if Not Needed

```javascript
// If you're not rendering the highways visually:
window.synergyHighways.setConfig({
  enableDebugVisuals: false
});
```

---

## See Also

- [Quick Reference](SYNERGY_HIGHWAYS_QUICKREF.md)
- [Integration Guide](SYNERGY_HIGHWAYS_INTEGRATION.md)
- [Source Code](SynergyHighways2_0.js)
- [Test Scenarios](SYNERGY_HIGHWAYS_TEST_SCENARIOS.md)

---

**Status:** 🟢 Ready to integrate  
**Integration time:** 5-10 minutes  
**Complexity:** Low (just 4 notification calls)
