# NETWORK DASHBOARD INTEGRATION PATCHES

**Quick Reference:** Exact locations and code snippets for all 6 integration points

---

## 1. AINodes.js — Node Activation Event

### Location: `spawnNode()` method (approximately line 150–200)

**Find this code:**
```javascript
spawnNode(position, name, category, archetype) {
  // ... existing code ...
  const node = new AINodeModel({
    position: position,
    // ... other parameters
  });
  
  this.nodes.push(node);
  node.position.copy(position);
  // ... rest of method
}
```

**Add this line after `node.position.copy(position);`:**
```javascript
  node.position.copy(position);
  
  // ✅ DASHBOARD: Node activation event
  window.networkDashboard?.emit?.('nodeActivated', {
    nodeId: node.id,
    category: node.category || 'unknown',
  });
```

---

## 2. AINodes.js — Node Deactivation Event

### Location: `destroyNode()` method (approximately line 200–250)

**Find this code:**
```javascript
destroyNode(nodeId) {
  const index = this.nodes.findIndex(n => n.id === nodeId);
  if (index === -1) return;
  
  const node = this.nodes[index];
  // ... cleanup code ...
  
  nodes.splice(index, 1);
}
```

**Add this line after `nodes.splice(index, 1);`:**
```javascript
  this.nodes.splice(index, 1);
  
  // ✅ DASHBOARD: Node deactivation event
  window.networkDashboard?.emit?.('nodeDeactivated', {
    nodeId: nodeId,
  });
```

---

## 3. NodeLinkingSystem.js — Link Creation Event

### Location: `linkNodes()` method (approximately line 300–350)

**Find this code:**
```javascript
linkNodes(sourceNode, targetNode, strength = 1.0) {
  // ... validation code ...
  
  const link = {
    id: this.generateLinkId(),
    sourceNode: sourceNode,
    targetNode: targetNode,
    strength: strength,
    quality: this.calculateLinkQuality(sourceNode, targetNode),
    // ... other properties
  };
  
  this.links.push(link);
  // ... event dispatching
}
```

**Add this code after `this.links.push(link);`:**
```javascript
  this.links.push(link);
  
  // ✅ DASHBOARD: Link creation event
  window.networkDashboard?.emit?.('linkCreated', {
    linkId: link.id,
    source: sourceNode.id,
    target: targetNode.id,
    quality: link.quality || 0.5,
  });
```

---

## 4. NodeLinkingSystem.js — Link Removal Event

### Location: `unlinkNodes()` method (approximately line 380–430)

**Find this code:**
```javascript
unlinkNodes(sourceNode, targetNode) {
  const linkIndex = this.links.findIndex(
    link => link.sourceNode === sourceNode && link.targetNode === targetNode
  );
  
  if (linkIndex === -1) return;
  
  const link = this.links[linkIndex];
  // ... cleanup code ...
  
  this.links.splice(linkIndex, 1);
}
```

**Add this code after `this.links.splice(linkIndex, 1);`:**
```javascript
  this.links.splice(linkIndex, 1);
  
  // ✅ DASHBOARD: Link removal event
  window.networkDashboard?.emit?.('linkRemoved', {
    linkId: link.id,
    source: sourceNode.id,
    target: targetNode.id,
  });
```

---

## 5. SynergyHighways2_0.js — Highway Update Event

### Location: `update()` method (approximately line 150–200)

**Find this code:**
```javascript
update() {
  // ... highway calculation logic ...
  
  for (const highway of this.highways) {
    highway.recalculateRoute();
    highway.updateVisuals();
    // ... more logic
  }
  
  // ... method continues
}
```

**Add this code in the highway loop:**
```javascript
  for (const highway of this.highways) {
    highway.recalculateRoute();
    highway.updateVisuals();
    
    // ✅ DASHBOARD: Highway update event
    const flowIntensity = highway.calculateIntensity?.() || 0;
    window.networkDashboard?.emit?.('highwayUpdate', {
      highwayId: highway.id,
      flowIntensity: flowIntensity,
      activeCount: highway.nodes?.length || 0,
    });
  }
```

---

## 6. ComputeSynergyScore2_0.js — Synergy Update Event

### Location: `computeScore()` or similar method (approximately line 200–250)

**Find this code:**
```javascript
computeScore(sourceNode, targetNode) {
  // ... scoring calculation ...
  
  const score = this.hybridScore + boostScore;
  
  // ... store results
  
  return score;
}
```

Or in an `update()` method that tracks trends:

```javascript
update() {
  const previousScore = this.lastScore || 0;
  const currentScore = this.calculateTotalScore();
  const deltaScore = currentScore - previousScore;
  
  // Calculate trend
  let trend = 'stable';
  if (deltaScore > 0.05) trend = 'rising';
  else if (deltaScore < -0.05) trend = 'falling';
  
  // ... other logic
}
```

**Add this code after trend calculation:**
```javascript
  let trend = 'stable';
  if (deltaScore > 0.05) trend = 'rising';
  else if (deltaScore < -0.05) trend = 'falling';
  
  // ✅ DASHBOARD: Synergy update event
  window.networkDashboard?.emit?.('synergyUpdate', {
    trend: trend,
    magnitude: Math.abs(deltaScore),
    score: currentScore,
  });
  
  this.lastScore = currentScore;
```

---

## Verification Script

After adding all 6 patches, run this in the browser console to verify:

```javascript
// 1. Check dashboard is initialized
console.log('Dashboard initialized:', window.networkDashboard._initialized);

// 2. Show the dashboard
window.networkDashboard.show();

// 3. Test each event manually
window.networkDashboard.emit('nodeActivated', { nodeId: 'test-1', category: 'input' });
window.networkDashboard.emit('nodeDeactivated', { nodeId: 'test-1' });
window.networkDashboard.emit('linkCreated', { linkId: 'link-1', source: 'n1', target: 'n2', quality: 0.8 });
window.networkDashboard.emit('linkRemoved', { linkId: 'link-1' });
window.networkDashboard.emit('highwayUpdate', { flowIntensity: 0.75, activeCount: 3 });
window.networkDashboard.emit('synergyUpdate', { trend: 'rising', magnitude: 0.6 });

// 4. Check dashboard metrics
const metrics = window.networkDashboard.getMetrics();
console.log('Recent events:', metrics.recentEvents);
console.log('Counters:', metrics.counters);

// 5. Check engine health
window.engineDiagnostics.quickHealth();  // Should return status
window.engineDiagnostics.printFullSystemReport();  // Detailed report
```

---

## Common Pitfalls & Solutions

### Pitfall 1: Using non-existent methods

**Wrong:**
```javascript
window.networkDashboard.emit('nodeActivated', {...})  // May fail if undefined
```

**Right:**
```javascript
window.networkDashboard?.emit?.('nodeActivated', {...})  // Safe optional chaining
```

### Pitfall 2: Missing required parameters

**Wrong:**
```javascript
window.networkDashboard?.emit?.('nodeActivated', { })  // Missing nodeId
```

**Right:**
```javascript
window.networkDashboard?.emit?.('nodeActivated', { 
  nodeId: node.id,  // Required
  category: node.category || 'unknown'  // Optional but recommended
})
```

### Pitfall 3: Emitting from wrong location

**Wrong:**
```javascript
// Emitting before node is created
window.networkDashboard?.emit?.('nodeActivated', {...});
const node = new AINodeModel();  // Node created AFTER event
```

**Right:**
```javascript
const node = new AINodeModel();
node.position.copy(position);
// Emit AFTER node is ready
window.networkDashboard?.emit?.('nodeActivated', {...});
```

### Pitfall 4: Forgetting dashboard import

**Wrong:**
```javascript
// main.js - missing import
// ... no import of dashboard ...
console.log(window.networkDashboard);  // undefined!
```

**Right:**
```javascript
// main.js - add at top
import { dashboard as networkDashboard } from './NetworkVisualizationDashboard1_0.js';

// Now window.networkDashboard is available
```

---

## Integration Checklist

### Pre-Integration
- [ ] Review this file
- [ ] Understand event structure
- [ ] Review examples in documentation

### During Integration
- [ ] Import dashboard in main.js
- [ ] Add 6 event emissions (exact 6 locations from above)
- [ ] Use optional chaining (`?.`) for safety
- [ ] Include required parameters

### Testing
- [ ] Run verification script (above)
- [ ] Check dashboard shows up
- [ ] Manually emit each event type
- [ ] Watch metrics update
- [ ] Check console for errors

### Deployment
- [ ] Verify FPS (should be >50 in dashboard)
- [ ] Check engine health (should be >70)
- [ ] Run React fix tests: `window.UIControlledStateFixAPI.runTests()`
- [ ] Monitor for 5 minutes in-game
- [ ] Commit and push

---

## Estimated Time Per Integration Point

| Location | Time | Difficulty |
|----------|------|------------|
| AINodes spawnNode() | 2 min | Easy |
| AINodes destroyNode() | 2 min | Easy |
| NodeLinkingSystem linkNodes() | 3 min | Easy |
| NodeLinkingSystem unlinkNodes() | 3 min | Easy |
| SynergyHighways2_0 update() | 5 min | Medium |
| ComputeSynergyScore2_0 update() | 5 min | Medium |
| **Testing & verification** | 10 min | Easy |
| **TOTAL** | **30 min** | **Easy** |

---

## Support

If integration points are unclear:

1. **Check the exact line numbers** in your files (may differ by a few lines)
2. **Search for method names** mentioned above in your editor
3. **Use Ctrl+F** to find `spawnNode`, `destroyNode`, etc.
4. **Review the full guide** at `/NETWORK_DASHBOARD_INTEGRATION.md`
5. **Run diagnostics:** `window.engineDiagnostics.printFullSystemReport()`

---

**Status:** Ready to integrate  
**Complexity:** 🟢 Easy (straightforward additions)  
**Time:** ~30 minutes + testing  
**Risk:** Low (safe optional chaining used throughout)
