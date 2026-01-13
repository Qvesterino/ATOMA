# LINK REPAIR SYSTEM — Console Commands Reference

## Quick Access

All commands assume systems are initialized. Access via:
```javascript
window.__linkEligibilityGate__     // Gate system
window.__linkDebugMode__            // Debug visualization
game.linkEligibilityGate            // Via game object
game.linkDebugMode                  // Via game object
```

---

## ELIGIBILITY GATE COMMANDS

### 1. Check If Link Is Possible

```javascript
// Check if nodeA can link to nodeB
const result = window.__linkEligibilityGate__.canLink(nodeA, nodeB);
console.log(result);
```

**Output (Allowed)**:
```javascript
{
  allowed: true,
  reason: 'all_checks_passed',
  details: {
    distance: '25.42',
    loadPressure: '32.1%',
    nodeADegree: 2,
    nodeBDegree: 1,
    nodeACorruption: '15.0%',
    nodeBCorruption: '8.5%'
  }
}
```

**Output (Blocked)**:
```javascript
{
  allowed: false,
  reason: 'node_degree_limit',
  message: 'Node B has reached max link degree (8)'
}
```

---

### 2. Get Statistics

```javascript
// Current statistics
const stats = window.__linkEligibilityGate__.getStats();
console.log(stats);
```

**Output**:
```javascript
{
  totalAttempts: 42,
  allowed: 38,
  blocked: 4,
  allowanceRate: '90.5%',
  rejectionBreakdown: {
    'distance_exceeded': 2,
    'node_degree_limit': 1,
    'link_exists': 1
  }
}
```

---

### 3. Print Full Report

```javascript
// Prints formatted table to console
window.__linkEligibilityGate__.getReport();
```

**Console Output**:
```
════════════════════════════════════════
  LINK ELIGIBILITY GATE — STATISTICS
════════════════════════════════════════
Total Link Attempts:     42
Allowed:                 38
Blocked:                 4
Allowance Rate:          90.5%

Rejection Reasons:
  • distance_exceeded: 2
  • node_degree_limit: 1
  • link_exists: 1
════════════════════════════════════════
```

---

### 4. Reset Statistics

```javascript
// Clear all statistics (start fresh)
window.__linkEligibilityGate__.resetStats();
console.log('Statistics reset');
```

---

## DEBUG MODE COMMANDS

### 1. Enable Debug Visualization

```javascript
// Show white lines + status text overlays
window.__linkDebugMode__.enable();
```

**What You'll See**:
- White lines between all linked nodes
- "LINK OK" text (green) at link midpoints
- Scene remains readable (no effects)

---

### 2. Disable Debug Visualization

```javascript
// Hide all debug visuals
window.__linkDebugMode__.disable();
```

**Result**: Scene returns to normal (no debug overlays)

---

### 3. Check Debug Mode Status

```javascript
// See what's currently being rendered
const status = window.__linkDebugMode__.getStatus();
console.log(status);
```

**Output**:
```javascript
{
  enabled: true,
  activeDebugLines: 8,
  activeDebugLabels: 8
}
```

---

### 4. Update Debug Visuals (Manual)

```javascript
// Update all debug visuals immediately
window.__linkDebugMode__.updateDebugVisuals();
```

**Note**: Normally called automatically in render loop

---

### 5. Clear Debug Visuals

```javascript
// Remove all debug lines and labels
window.__linkDebugMode__.clearAllDebugVisuals();
```

---

## TESTING SCENARIOS

### Test 1: Check Valid Link

```javascript
// Pick any two linked nodes from the network
const node1 = game.aiNodes.nodes[0];
const node2 = game.aiNodes.nodes[1];

const result = window.__linkEligibilityGate__.canLink(node1, node2);
console.log('Valid link?', result.allowed);
console.log('Reason:', result.reason);
```

---

### Test 2: Test Self-Link (Should Fail)

```javascript
// Try to link a node to itself
const node = game.aiNodes.nodes[0];
const result = window.__linkEligibilityGate__.canLink(node, node);

console.log('Self-link allowed?', result.allowed);  // Should be false
console.log('Reason:', result.reason);              // 'self_link_blocked'
```

---

### Test 3: Check Network Saturation

```javascript
// See how saturated the network is
const stats = window.__linkEligibilityGate__.getStats();
console.log('Total attempts:', stats.totalAttempts);
console.log('Allowance rate:', stats.allowanceRate);

// If rate drops below 50%, network is saturated
if (parseFloat(stats.allowanceRate) < 50) {
  console.warn('⚠️ Network is heavily saturated!');
}
```

---

### Test 4: Monitor Rejections in Real Time

```javascript
// Enable debug mode
window.__linkDebugMode__.enable();

// Try creating links (they'll show in debug mode)
// Check console for rejection reasons

// Get breakdown
const stats = window.__linkEligibilityGate__.getStats();
console.table(stats.rejectionBreakdown);
```

---

### Test 5: Visual Debug Check

```javascript
// 1. Enable debug mode
window.__linkDebugMode__.enable();

// 2. Look at scene — should see:
//    - White lines between linked nodes
//    - Green text "LINK OK" at midpoints
//    - No visual effects, no halos, no glows

// 3. Check status
window.__linkDebugMode__.getStatus();

// Expected: { enabled: true, activeDebugLines: N, activeDebugLabels: N }
```

---

## DIAGNOSTIC WORKFLOW

### Step 1: Enable Debug Mode & Gather Stats

```javascript
window.__linkDebugMode__.enable();
console.log('Debug mode enabled');

// Wait a few seconds for links to render
setTimeout(() => {
  const status = window.__linkDebugMode__.getStatus();
  console.log('Debug visuals:', status);
}, 1000);
```

### Step 2: Get Eligibility Statistics

```javascript
const stats = window.__linkEligibilityGate__.getStats();
console.log('Eligibility statistics:');
console.log('  Total attempts:', stats.totalAttempts);
console.log('  Allowed:', stats.allowed);
console.log('  Blocked:', stats.blocked);
console.log('  Allowance rate:', stats.allowanceRate);
```

### Step 3: Analyze Rejections

```javascript
const stats = window.__linkEligibilityGate__.getStats();
const rejections = stats.rejectionBreakdown;

console.log('\nRejection breakdown:');
Object.entries(rejections)
  .sort((a, b) => b[1] - a[1])
  .forEach(([reason, count]) => {
    const percent = (count / stats.blocked * 100).toFixed(1);
    console.log(`  ${reason}: ${count} (${percent}%)`);
  });
```

### Step 4: Check Specific Node Degrees

```javascript
// See how many links each node has
game.aiNodes.nodes.forEach((node, idx) => {
  const degree = game.linkingSystem.links.filter(link => 
    link.active && (link.nodeA.uuid === node.uuid || link.nodeB.uuid === node.uuid)
  ).length;
  
  console.log(`Node ${idx}: ${degree} links`);
});
```

### Step 5: Disable Debug Mode When Done

```javascript
window.__linkDebugMode__.disable();
console.log('Debug mode disabled');
```

---

## SCRIPTED TESTING SUITE

```javascript
// Copy-paste this entire block into console for full test

(async function testLinkRepairSystem() {
  console.log('🧪 Starting Link Repair System test...\n');

  // Test 1: Gate exists
  console.log('✓ Test 1: Gate initialization');
  console.assert(window.__linkEligibilityGate__, 'Gate not initialized!');

  // Test 2: Debug mode exists
  console.log('✓ Test 2: Debug mode initialization');
  console.assert(window.__linkDebugMode__, 'Debug mode not initialized!');

  // Test 3: Enable debug mode
  console.log('✓ Test 3: Enabling debug mode');
  window.__linkDebugMode__.enable();
  await new Promise(r => setTimeout(r, 500));

  // Test 4: Check debug status
  console.log('✓ Test 4: Checking debug status');
  const debugStatus = window.__linkDebugMode__.getStatus();
  console.log('  Debug lines:', debugStatus.activeDebugLines);
  console.log('  Debug labels:', debugStatus.activeDebugLabels);

  // Test 5: Get gate statistics
  console.log('✓ Test 5: Getting gate statistics');
  const stats = window.__linkEligibilityGate__.getStats();
  console.log('  Total attempts:', stats.totalAttempts);
  console.log('  Allowance rate:', stats.allowanceRate);

  // Test 6: Print full report
  console.log('✓ Test 6: Full report');
  window.__linkEligibilityGate__.getReport();

  // Test 7: Self-link rejection
  console.log('✓ Test 7: Testing self-link rejection');
  const node = game.aiNodes.nodes[0];
  const selfLinkResult = window.__linkEligibilityGate__.canLink(node, node);
  console.assert(!selfLinkResult.allowed, 'Self-link should be rejected!');
  console.log('  Result:', selfLinkResult.reason);

  console.log('\n✅ All tests passed!');
})();
```

---

## TROUBLESHOOTING

### Q: Debug mode enabled but no visuals showing
**A**: 
```javascript
// Check if there are any active links
console.log('Active links:', game.linkingSystem.links.filter(l => l.active).length);

// Manually update debug visuals
window.__linkDebugMode__.updateDebugVisuals();

// Check status
console.log(window.__linkDebugMode__.getStatus());
```

### Q: Gate statistics show 0% allowance
**A**:
```javascript
// Check rejection reasons
const stats = window.__linkEligibilityGate__.getStats();
console.table(stats.rejectionBreakdown);

// Most common: network saturation or nodes too far apart
```

### Q: How do I see rejection reasons?
**A**:
```javascript
// Enable gate debug logging
game.linkEligibilityGate.debugMode = true;

// Now all eligibility checks will be logged to console

// Or check programmatically:
const result = window.__linkEligibilityGate__.canLink(nodeA, nodeB);
console.log('Rejection reason:', result.reason);
console.log('Message:', result.message);
```

---

## PERFORMANCE MONITORING

```javascript
// Measure gate performance
console.time('canLink check');
for (let i = 0; i < 1000; i++) {
  window.__linkEligibilityGate__.canLink(
    game.aiNodes.nodes[0],
    game.aiNodes.nodes[1]
  );
}
console.timeEnd('canLink check');
// Expected: ~100ms for 1000 checks = 0.1ms per check
```

---

## QUICK SHORTCUTS

```javascript
// Alias for quick access
const gate = window.__linkEligibilityGate__;
const debug = window.__linkDebugMode__;

// Now use shorter names:
gate.canLink(nodeA, nodeB);
gate.getReport();
debug.enable();
debug.disable();
```

---

**Command Reference Version**: 1.0  
**Session**: 99  
**Status**: Production Ready
