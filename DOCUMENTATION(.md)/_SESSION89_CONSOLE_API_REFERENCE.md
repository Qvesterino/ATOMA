# SESSION 89: Link Collapse System Console API

## Quick Reference

**System Access**:
```javascript
const collapseSystem = ATOMA.main.linkCollapseSystem;
```

---

## Query API

### Get Collapse Progress

```javascript
// Get collapse progress for a specific link (0.0 = stable, 1.0 = collapsed)
const progress = collapseSystem.getCollapseProgress(link);
console.log(`Link collapse progress: ${(progress * 100).toFixed(1)}%`);
```

**Output Examples**:
- `0.0` = Stable
- `0.3` = Warning state
- `0.7` = Critical state
- `1.0` = Collapsed

---

### Get Collapse State

```javascript
// Get detailed collapse state object for a link
const state = collapseSystem.getCollapseState(link);
console.log(state);
// Output:
// {
//   collapseStage: 'warning' | 'critical' | 'stable',
//   stressAccumulation: 0.45,
//   lastStressTime: 1234567890,
//   hasCollapsed: false,
//   createdAt: 1234567000
// }
```

---

### Get Warning Links

```javascript
// Get all links currently in warning state
const warningLinks = collapseSystem.getWarningLinks();
console.log(`${warningLinks.length} links in warning state`);

// Iterate over warning links
warningLinks.forEach(link => {
  const progress = collapseSystem.getCollapseProgress(link);
  console.log(`Link: ${progress.toFixed(2)} → collapse`);
});
```

---

### Get Critical Links

```javascript
// Get all links currently in critical state
const criticalLinks = collapseSystem.getCriticalLinks();
console.log(`${criticalLinks.length} links in critical state`);

// Get percentage of network at risk
const totalLinks = ATOMA.main.linkingSystem.links.length;
const riskPercentage = (criticalLinks.length / totalLinks * 100).toFixed(1);
console.log(`${riskPercentage}% of network at risk`);
```

---

### Get Collapse Statistics

```javascript
// Get network-wide collapse statistics
const stats = collapseSystem.getCollapseStatistics();
console.log(stats);
// Output:
// {
//   totalLinks: 50,
//   warningLinks: 3,
//   criticalLinks: 1,
//   collapsedLinksTracked: 4,
//   averageStress: 0.24
// }

// Use for HUD displays
console.log(`Network Stability: ${(100 - stats.averageStress * 100).toFixed(0)}%`);
```

---

## Event Monitoring

### Listen for Collapse Events

```javascript
// Listen for links entering warning state
collapseSystem.on('warning', (link, state) => {
  console.log('Link entered warning state:', link, state);
  // Trigger visual/audio warning
});

// Listen for links entering critical state
collapseSystem.on('critical', (link, state) => {
  console.log('Link entered critical state:', link, state);
  // Trigger alert
});

// Listen for link collapse
collapseSystem.on('collapse', (link, state) => {
  console.log('Link collapsed and disconnected:', link);
  // Log, trigger effects, etc.
});

// Listen for link recovery
collapseSystem.on('recovery', (link, state) => {
  console.log('Link recovered from warning/critical:', link);
  // Update UI, etc.
});
```

---

## Stress Analysis

### Calculate Link Stress Manually

```javascript
// Get stress level and remaining time to collapse
function analyzeLink(link) {
  const state = collapseSystem.getCollapseState(link);
  const progress = collapseSystem.getCollapseProgress(link);
  
  if (!state) {
    console.log('Link not tracked yet');
    return;
  }
  
  // Estimate time to collapse
  const stressRemaining = 1.0 - state.stressAccumulation;
  const accumulationRate = 0.15; // per second
  const secondsToCollapse = stressRemaining / accumulationRate;
  
  console.log(`Stress: ${(progress * 100).toFixed(1)}%`);
  console.log(`Stage: ${state.collapseStage}`);
  console.log(`Time to collapse: ${secondsToCollapse.toFixed(1)} seconds`);
}

// Use on a link
const testLink = ATOMA.main.linkingSystem.links[0];
analyzeLink(testLink);
```

---

### Network Health Score

```javascript
// Calculate overall network health
function getNetworkHealth() {
  const stats = collapseSystem.getCollapseStatistics();
  
  const totalRisk = stats.warningLinks + (stats.criticalLinks * 2);
  const healthScore = Math.max(0, 100 - (totalRisk / Math.max(1, stats.totalLinks)) * 100);
  
  return {
    score: healthScore.toFixed(0),
    totalLinks: stats.totalLinks,
    atRisk: stats.warningLinks + stats.criticalLinks,
    critical: stats.criticalLinks,
    averageStress: (stats.averageStress * 100).toFixed(1),
  };
}

// Check network health
const health = getNetworkHealth();
console.log(`Network Health: ${health.score}%`);
console.log(`At Risk: ${health.atRisk}/${health.totalLinks}`);
```

---

## Debugging

### Full Collapse State Dump

```javascript
// Export all collapse states as JSON
function dumpCollapseStates() {
  const output = {};
  
  ATOMA.main.linkingSystem.links.forEach((link, index) => {
    const state = collapseSystem.getCollapseState(link);
    const progress = collapseSystem.getCollapseProgress(link);
    
    if (state) {
      output[`link_${index}`] = {
        stage: state.collapseStage,
        progress: progress.toFixed(3),
        stress: state.stressAccumulation.toFixed(3),
        collapsed: state.hasCollapsed,
      };
    }
  });
  
  return output;
}

// Dump and log
console.table(dumpCollapseStates());
```

---

### Watch Link for Changes

```javascript
// Monitor a specific link's collapse state over time
function watchLink(link, duration = 5) {
  console.log(`Watching link for ${duration} seconds...`);
  
  const startTime = Date.now();
  const interval = setInterval(() => {
    const now = Date.now();
    const elapsed = ((now - startTime) / 1000).toFixed(1);
    const progress = (collapseSystem.getCollapseProgress(link) * 100).toFixed(1);
    const state = collapseSystem.getCollapseState(link);
    
    console.log(`[${elapsed}s] Stage: ${state.collapseStage}, Progress: ${progress}%`);
    
    if (now - startTime > duration * 1000) {
      clearInterval(interval);
    }
  }, 500);
}

// Use it
const link = ATOMA.main.linkingSystem.links[0];
watchLink(link, 10);
```

---

## Stress Simulation

### Trigger Collapse Manually (Debug)

```javascript
// Force a link into warning state for testing
function debugForceWarning(link) {
  const state = collapseSystem.getCollapseState(link);
  if (state) {
    state.stressAccumulation = 0.35; // Between warning and critical
    console.log('Link forced into warning state');
  }
}

// Force into critical state
function debugForceCritical(link) {
  const state = collapseSystem.getCollapseState(link);
  if (state) {
    state.stressAccumulation = 0.75; // Between critical and collapse
    console.log('Link forced into critical state');
  }
}

// Reset stress
function debugResetStress(link) {
  const state = collapseSystem.getCollapseState(link);
  if (state) {
    state.stressAccumulation = 0;
    console.log('Link stress reset to stable');
  }
}

// Use
const link = ATOMA.main.linkingSystem.links[0];
debugForceWarning(link);
```

---

### Simulate High Load Network

```javascript
// Create a stressful network scenario
function debugCreateStressScenario() {
  console.log('Creating stress scenario...');
  
  // Get a random node and link it to many others
  const centralNode = ATOMA.main.aiNodes.nodes[0];
  let linkCount = 0;
  
  for (let i = 1; i < 10; i++) {
    const targetNode = ATOMA.main.aiNodes.nodes[i];
    if (centralNode && targetNode) {
      ATOMA.main.linkingSystem.linkNodes(centralNode, targetNode);
      linkCount++;
    }
  }
  
  console.log(`Created ${linkCount} links on central node`);
  console.log('Monitoring for collapse warnings...');
  
  // Monitor for next 30 seconds
  const monitoring = setInterval(() => {
    const stats = collapseSystem.getCollapseStatistics();
    console.log(`Active monitoring: ${stats.warningLinks} warning, ${stats.criticalLinks} critical`);
    
    if (stats.warningLinks > 0 || stats.criticalLinks > 0) {
      console.log('Collapse conditions detected!');
      clearInterval(monitoring);
    }
  }, 1000);
  
  setTimeout(() => clearInterval(monitoring), 30000);
}

// Run scenario
debugCreateStressScenario();
```

---

## Common Queries

### "Which links are about to collapse?"

```javascript
const criticalLinks = collapseSystem.getCriticalLinks();
if (criticalLinks.length > 0) {
  console.log(`⚠️  ${criticalLinks.length} links about to collapse!`);
  criticalLinks.forEach((link, idx) => {
    const progress = (collapseSystem.getCollapseProgress(link) * 100).toFixed(0);
    console.log(`  ${idx + 1}. Progress: ${progress}%`);
  });
}
```

### "What's the network stress level?"

```javascript
const stats = collapseSystem.getCollapseStatistics();
const riskLevel = stats.averageStress;
const category = riskLevel < 0.2 ? 'SAFE' : 
                 riskLevel < 0.5 ? 'CAUTION' :
                 riskLevel < 0.8 ? 'WARNING' : 'CRITICAL';
console.log(`Network Stress: ${category} (${(riskLevel * 100).toFixed(1)}%)`);
```

### "How many links will collapse in the next minute?"

```javascript
const criticalLinks = collapseSystem.getCriticalLinks();
const potentialCollapse = criticalLinks.length +
  collapseSystem.getWarningLinks().filter(link => {
    const progress = collapseSystem.getCollapseProgress(link);
    return progress > 0.5; // More than halfway
  }).length;
console.log(`Potential collapses in 60s: ${potentialCollapse}`);
```

---

## Reset & Cleanup

### Reset All Collapse States

```javascript
// Clear all collapse tracking (useful for world resets)
collapseSystem.reset();
console.log('All collapse states reset');
```

### Destroy System (Cleanup)

```javascript
// Full cleanup before shutdown
collapseSystem.destroy();
console.log('Collapse system destroyed');
```

---

## Configuration

### View Current Config

```javascript
// View active configuration
console.log('Collapse System Configuration:');
console.log(`  Corruption Threshold: ${collapseSystem.config.corruptionThreshold}`);
console.log(`  Critical Load: ${collapseSystem.config.criticalLoadThreshold}`);
console.log(`  Min Stress Accumulation: ${collapseSystem.config.minStressAccumulation}ms`);
console.log(`  Accumulation Rate: ${collapseSystem.config.stressAccumulationRate}/sec`);
console.log(`  Recovery Rate: ${collapseSystem.config.stressRecoveryRate}/sec`);
console.log(`  Warning Threshold: ${collapseSystem.config.warningThreshold}`);
console.log(`  Critical Threshold: ${collapseSystem.config.criticalThreshold}`);
console.log(`  Collapse Threshold: ${collapseSystem.config.collapseThreshold}`);
```

---

## Performance Monitoring

### Measure Update Performance

```javascript
// Measure collapse system update performance
console.time('collapse-update');
collapseSystem.update(0.016); // One frame at 60fps
console.timeEnd('collapse-update');

// Profile over multiple frames
let totalTime = 0;
const frameCount = 60;

for (let i = 0; i < frameCount; i++) {
  const start = performance.now();
  collapseSystem.update(0.016);
  totalTime += performance.now() - start;
}

const avgTime = (totalTime / frameCount).toFixed(3);
console.log(`Average update time: ${avgTime}ms (${frameCount} frames)`);
```

---

## Examples

### Example: Alert System

```javascript
// Setup real-time collapse alerts
function setupCollapseAlerts() {
  collapseSystem.on('warning', (link, state) => {
    console.warn('🟡 Link warning:', link);
  });
  
  collapseSystem.on('critical', (link, state) => {
    console.error('🔴 Link critical:', link);
  });
  
  collapseSystem.on('collapse', (link, state) => {
    console.error('💥 Link collapsed:', link);
  });
}

setupCollapseAlerts();
```

### Example: Health Dashboard

```javascript
// Simple health dashboard
function displayHealthDashboard() {
  const stats = collapseSystem.getCollapseStatistics();
  
  console.clear();
  console.log('╔═══════════════════════════════╗');
  console.log('║   NETWORK HEALTH DASHBOARD    ║');
  console.log('╠═══════════════════════════════╣');
  console.log(`║ Total Links:      ${String(stats.totalLinks).padEnd(18)} ║`);
  console.log(`║ Warning Links:    ${String(stats.warningLinks).padEnd(18)} ║`);
  console.log(`║ Critical Links:   ${String(stats.criticalLinks).padEnd(18)} ║`);
  console.log(`║ Avg Stress:       ${(stats.averageStress * 100).toFixed(1).padEnd(15)}% ║`);
  console.log('╚═══════════════════════════════╝');
}

// Update every 2 seconds
setInterval(displayHealthDashboard, 2000);
```

---

## Summary

**Key Functions**:
- `getCollapseProgress(link)` — 0.0-1.0 progress
- `getCollapseState(link)` — Full state object
- `getWarningLinks()` — Array of warning links
- `getCriticalLinks()` — Array of critical links
- `getCollapseStatistics()` — Network-wide stats
- `on(event, callback)` — Listen for events

**Events**: `warning`, `critical`, `collapse`, `recovery`

**Config Keys**: `corruptionThreshold`, `stressAccumulationRate`, `stressRecoveryRate`, etc.

Ready to monitor and debug your network's collapse system!
