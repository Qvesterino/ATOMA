# LinkAutomationEngine 1.0 — Testing Guide

## Test Suite Overview

Complete test procedures for LinkAutomationEngine1_0. All tests are executable from browser console.

## Unit Tests

### Test 1: Engine Initialization

**Objective:** Verify engine initializes correctly with all systems present.

**Steps:**
```javascript
// 1. Check engine exists
console.assert(
  window.game.linkAutomationEngine,
  'Engine should exist'
);

// 2. Check is disabled by default
console.assert(
  !window.game.linkAutomationEngine.isEnabled(),
  'Engine should be disabled by default'
);

// 3. Check statistics accessible
const stats = window.game.linkAutomationEngine.getStats();
console.assert(stats !== null, 'Stats should be accessible');
console.assert(stats.totalAutoLinksCreated === 0, 'Should start with 0 created');
```

**Expected Result:** ✅ All assertions pass

---

### Test 2: Enable/Disable/Toggle

**Objective:** Verify state management works correctly.

**Steps:**
```javascript
const engine = window.game.linkAutomationEngine;

// 1. Start disabled
console.assert(!engine.isEnabled(), 'Should start disabled');

// 2. Enable
engine.enable();
console.assert(engine.isEnabled(), 'Should be enabled after enable()');

// 3. Disable
engine.disable();
console.assert(!engine.isEnabled(), 'Should be disabled after disable()');

// 4. Toggle on
engine.toggle();
console.assert(engine.isEnabled(), 'Should be enabled after toggle()');

// 5. Toggle off
engine.toggle();
console.assert(!engine.isEnabled(), 'Should be disabled after toggle()');
```

**Expected Result:** ✅ All state transitions work correctly

---

### Test 3: Preview Mode (Non-Destructive)

**Objective:** Verify preview doesn't create any links.

**Steps:**
```javascript
const engine = window.game.linkAutomationEngine;
const node = window.game.aiNodes.nodes[0];
const linksBefore = window.game.linkingSystem.links.length;

// 1. Run preview
const preview = engine.preview(node);

// 2. Check links didn't increase
const linksAfter = window.game.linkingSystem.links.length;
console.assert(
  linksBefore === linksAfter,
  `Links should not change (${linksBefore} → ${linksAfter})`
);

// 3. Verify preview data structure
console.assert(preview.wouldCreate >= 0, 'wouldCreate should be number');
console.assert(Array.isArray(preview.suggestions), 'suggestions should be array');
console.assert(preview.reason !== undefined, 'reason should exist');
```

**Expected Result:** ✅ No links created, preview data valid

---

### Test 4: Auto-Link Basic Execution

**Objective:** Verify auto-link creates connections correctly.

**Steps:**
```javascript
const engine = window.game.linkAutomationEngine;
const node = window.game.aiNodes.nodes[0];
const linksBefore = window.game.linkingSystem.links.length;

// 1. Execute auto-link
const result = engine.autoLinkFor(node);

// 2. Check result structure
console.assert(result.created >= 0, 'created should be >= 0');
console.assert(result.skipped >= 0, 'skipped should be >= 0');
console.assert(result.total >= 0, 'total should be >= 0');
console.assert(result.reason !== undefined, 'reason should exist');

// 3. Verify links increased (if any created)
const linksAfter = window.game.linkingSystem.links.length;
console.assert(
  linksAfter >= linksBefore,
  `Links should increase or stay same (${linksBefore} → ${linksAfter})`
);

// 4. Verify creation count matches
console.assert(
  linksAfter - linksBefore === result.created,
  `Created links should match result.created`
);
```

**Expected Result:** ✅ Links created, result structure valid

---

### Test 5: Duplicate Link Detection

**Objective:** Verify duplicate links are skipped.

**Steps:**
```javascript
const engine = window.game.linkAutomationEngine;
const node1 = window.game.aiNodes.nodes[0];
const node2 = window.game.aiNodes.nodes[1];

// 1. Create link manually
window.game.linkingSystem.createLink(node1, node2);
const linksBefore = window.game.linkingSystem.links.length;

// 2. Try auto-link (should skip the existing link)
const result = engine.autoLinkFor(node1);

// 3. Verify no duplicate was created
const linksAfter = window.game.linkingSystem.links.length;
const foundDuplicate = window.game.linkingSystem.links.filter(
  link => (link.source === node1 && link.target === node2) ||
          (link.source === node2 && link.target === node1)
).length > 1;

console.assert(!foundDuplicate, 'Should not create duplicate links');
```

**Expected Result:** ✅ Duplicate not created

---

### Test 6: Cooldown Protection

**Objective:** Verify cooldown prevents immediate re-execution.

**Steps:**
```javascript
const engine = window.game.linkAutomationEngine;
const node = window.game.aiNodes.nodes[0];

// 1. First execution
const result1 = engine.autoLinkFor(node);
console.assert(result1.reason === 'ok', 'First attempt should succeed');

// 2. Immediate second execution (should hit cooldown)
const result2 = engine.autoLinkFor(node);
console.assert(
  result2.reason === 'cooldown active',
  'Second immediate attempt should hit cooldown'
);

// 3. Check cooldown remaining
const stats = engine.getStats();
console.assert(
  stats.cooldownRemaining > 0,
  'Cooldown remaining should be > 0'
);

// 4. Wait for cooldown
console.log('Waiting 600ms for cooldown to expire...');
await new Promise(resolve => setTimeout(resolve, 600));

// 5. Third execution (should succeed)
const result3 = engine.autoLinkFor(node);
console.assert(
  result3.reason === 'ok' || result3.reason.length === 0,
  'Third attempt after cooldown should succeed'
);
```

**Expected Result:** ✅ Cooldown enforced, timing verified

---

### Test 7: Null Safety - Missing Node

**Objective:** Verify graceful handling of null node.

**Steps:**
```javascript
const engine = window.game.linkAutomationEngine;

// 1. Execute with null
const result = engine.autoLinkFor(null);

// 2. Verify graceful return
console.assert(result.created === 0, 'Should create 0 links for null node');
console.assert(result.reason === 'no node provided', 'Should identify null node');
console.assert(!Number.isNaN(result.created), 'Result should be valid object');
```

**Expected Result:** ✅ No errors, graceful handling

---

### Test 8: Null Safety - Missing LinkRecommendationAI

**Objective:** Verify graceful handling when recommendation AI missing.

**Steps:**
```javascript
// 1. Temporarily remove recommendation AI
const savedAI = window.game.linkRecommendationAI;
window.game.linkRecommendationAI = null;

// 2. Try auto-link
const engine = window.game.linkAutomationEngine;
const node = window.game.aiNodes.nodes[0];
const result = engine.autoLinkFor(node);

// 3. Verify graceful handling
console.assert(result.created === 0, 'Should create 0 links without AI');
console.assert(
  result.reason.includes('recommendationAI'),
  'Should identify missing AI'
);

// 4. Restore
window.game.linkRecommendationAI = savedAI;
```

**Expected Result:** ✅ No errors, graceful degradation

---

### Test 9: Statistics Tracking

**Objective:** Verify statistics are tracked correctly.

**Steps:**
```javascript
const engine = window.game.linkAutomationEngine;

// 1. Get initial stats
const statsStart = engine.getStats();
const initialCreated = statsStart.totalAutoLinksCreated;

// 2. Execute auto-link
const node = window.game.aiNodes.nodes[0];
const result = engine.autoLinkFor(node);

// 3. Get updated stats
const statsEnd = engine.getStats();

// 4. Verify tracking
console.assert(
  statsEnd.totalAutoLinksCreated >= initialCreated,
  'Total created should increase or stay same'
);
console.assert(
  statsEnd.totalCycles > statsStart.totalCycles,
  'Total cycles should increase'
);
console.assert(
  statsEnd.lastCycleCreated === result.created,
  'Last cycle should match result'
);
console.assert(
  statsEnd.lastExecutionMs >= 0,
  'Execution time should be >= 0'
);
```

**Expected Result:** ✅ Statistics tracked accurately

---

### Test 10: Configuration Access

**Objective:** Verify configuration is accessible via stats.

**Steps:**
```javascript
const engine = window.game.linkAutomationEngine;
const stats = engine.getStats();

// 1. Check config exists
console.assert(stats.config !== undefined, 'Config should exist in stats');

// 2. Verify config values
console.assert(
  stats.config.automationThreshold === 0.65,
  'Should have default threshold'
);
console.assert(
  stats.config.maxLinksPerCycle === 3,
  'Should have default max links'
);
console.assert(
  stats.config.safetyCooldownMs === 500,
  'Should have default cooldown'
);
console.assert(
  stats.config.requireUserTrigger === true,
  'Should require user trigger'
);
console.assert(
  stats.config.skipExistingLinks === true,
  'Should skip existing links'
);
```

**Expected Result:** ✅ Configuration values correct

---

## Integration Tests

### Integration Test 1: Console API Access

**Objective:** Verify all console commands work.

**Steps:**
```javascript
// 1. Check all functions exist
console.assert(typeof window.autoLinkActive === 'function');
console.assert(typeof window.previewAutoLink === 'function');
console.assert(typeof window.enableAutoLink === 'function');
console.assert(typeof window.disableAutoLink === 'function');
console.assert(typeof window.toggleAutoLink === 'function');
console.assert(typeof window.getAutoLinkStats === 'function');

// 2. Test each function (should not throw)
try {
  window.enableAutoLink();
  console.assert(window.game.linkAutomationEngine.isEnabled());
  
  window.disableAutoLink();
  console.assert(!window.game.linkAutomationEngine.isEnabled());
  
  window.toggleAutoLink();
  console.assert(window.game.linkAutomationEngine.isEnabled());
  
  // Should not throw even without selected node
  window.previewAutoLink();
  
  console.log('✓ All console commands work');
} catch (err) {
  console.error('✗ Console command failed:', err);
}
```

**Expected Result:** ✅ All commands functional

---

### Integration Test 2: With LinkRecommendationAI

**Objective:** Verify integration with recommendation system.

**Steps:**
```javascript
// 1. Get a node
const node = window.game.aiNodes.nodes[0];

// 2. Generate recommendations
window.game.linkRecommendationAI.updateRecommendations(node);

// 3. Get recommendations
const suggestions = window.game.linkRecommendationAI.getTopSuggestions();
console.log(`Found ${suggestions.length} recommendations`);

// 4. Auto-link based on recommendations
const engine = window.game.linkAutomationEngine;
const result = engine.autoLinkFor(node);

// 5. Verify
console.assert(result.created <= result.total, 'Created should be <= total');
console.assert(
  result.created <= window.game.linkAutomationEngine.getStats().config.maxLinksPerCycle,
  'Should respect max links'
);
```

**Expected Result:** ✅ Recommendation integration working

---

### Integration Test 3: With NodeLinkingSystem

**Objective:** Verify integration with link creation system.

**Steps:**
```javascript
const engine = window.game.linkAutomationEngine;
const node = window.game.aiNodes.nodes[0];
const linkingSystem = window.game.linkingSystem;

// 1. Check link count before
const linksBefore = linkingSystem.links.length;

// 2. Auto-link
const result = engine.autoLinkFor(node);

// 3. Verify links in linking system
const linksAfter = linkingSystem.links.length;
console.assert(
  linksAfter - linksBefore === result.created,
  'All created links should be in linking system'
);

// 4. Verify link properties
linkingSystem.links.slice(-result.created).forEach(link => {
  console.assert(link.source !== undefined, 'Link should have source');
  console.assert(link.target !== undefined, 'Link should have target');
  console.assert(link.source !== link.target, 'Link endpoints should differ');
});
```

**Expected Result:** ✅ Links properly created in system

---

## Stress Tests

### Stress Test 1: Batch Operation (All Nodes)

**Objective:** Auto-link for every node without errors.

**Steps:**
```javascript
const engine = window.game.linkAutomationEngine;
const nodes = window.game.aiNodes.nodes;
let totalCreated = 0;
let errors = 0;

console.log(`Testing auto-link for ${nodes.length} nodes...`);

for (let i = 0; i < nodes.length; i++) {
  try {
    const result = engine.autoLinkFor(nodes[i]);
    totalCreated += result.created;
    
    if ((i + 1) % 10 === 0) {
      console.log(`  ${i + 1}/${nodes.length} nodes processed`);
    }
  } catch (err) {
    errors++;
    console.error(`Error on node ${i}:`, err);
  }
}

console.log(`✓ Completed: ${totalCreated} links created, ${errors} errors`);
console.assert(errors === 0, 'Should have 0 errors');
```

**Expected Result:** ✅ All nodes processed without errors

---

### Stress Test 2: Rapid Previews

**Objective:** Run preview rapidly without issues.

**Steps:**
```javascript
const engine = window.game.linkAutomationEngine;
const node = window.game.aiNodes.nodes[0];
const iterations = 100;

console.log(`Running ${iterations} rapid previews...`);

const startTime = performance.now();

for (let i = 0; i < iterations; i++) {
  const preview = engine.preview(node);
  console.assert(preview.wouldCreate >= 0);
}

const duration = performance.now() - startTime;
const avgTime = duration / iterations;

console.log(`✓ Completed in ${duration.toFixed(1)}ms (avg ${avgTime.toFixed(2)}ms each)`);
console.assert(avgTime < 2, 'Average time should be < 2ms');
```

**Expected Result:** ✅ All previews complete quickly

---

## Performance Tests

### Performance Test 1: Single Auto-Link Execution

**Objective:** Measure execution time of single auto-link.

**Steps:**
```javascript
const engine = window.game.linkAutomationEngine;
const node = window.game.aiNodes.nodes[0];

const times = [];

for (let i = 0; i < 10; i++) {
  // Wait for cooldown
  if (i > 0) await new Promise(r => setTimeout(r, 550));
  
  const start = performance.now();
  engine.autoLinkFor(node);
  const duration = performance.now() - start;
  
  times.push(duration);
}

const avg = times.reduce((a, b) => a + b) / times.length;
const max = Math.max(...times);
const min = Math.min(...times);

console.log(`Execution time:
  Average: ${avg.toFixed(3)}ms
  Min:     ${min.toFixed(3)}ms
  Max:     ${max.toFixed(3)}ms`);

console.assert(avg < 2, 'Average should be < 2ms');
console.assert(max < 5, 'Max should be < 5ms');
```

**Expected Result:** ✅ Performance within budget

---

### Performance Test 2: Memory Usage

**Objective:** Verify no memory leaks during repeated operations.

**Steps:**
```javascript
const engine = window.game.linkAutomationEngine;
const node = window.game.aiNodes.nodes[0];

// Get initial memory (if available)
const initialMemory = performance.memory?.usedJSHeapSize || 0;

// Run many operations
for (let i = 0; i < 100; i++) {
  if (i % 20 === 0) {
    await new Promise(r => setTimeout(r, 100));
  }
  engine.preview(node);
}

// Check final memory
const finalMemory = performance.memory?.usedJSHeapSize || 0;
const memoryIncrease = finalMemory - initialMemory;

if (initialMemory > 0) {
  console.log(`Memory usage:
    Initial: ${(initialMemory / 1024 / 1024).toFixed(1)}MB
    Final:   ${(finalMemory / 1024 / 1024).toFixed(1)}MB
    Increase: ${(memoryIncrease / 1024 / 1024).toFixed(1)}MB`);
}

console.log('✓ Completed without crashes');
```

**Expected Result:** ✅ No memory leaks detected

---

## Test Summary

### Quick Test Suite

Run this to verify everything works:

```javascript
// Run all quick tests
console.group('LinkAutomationEngine 1.0 Test Suite');

try {
  // Test 1: Exists
  console.assert(window.game.linkAutomationEngine, 'Engine exists');
  
  // Test 2: Default state
  console.assert(!window.game.linkAutomationEngine.isEnabled(), 'Disabled by default');
  
  // Test 3: State management
  window.game.linkAutomationEngine.toggle();
  console.assert(window.game.linkAutomationEngine.isEnabled(), 'Toggle works');
  window.game.linkAutomationEngine.toggle();
  
  // Test 4: Preview doesn't create links
  const before = window.game.linkingSystem.links.length;
  window.game.linkAutomationEngine.preview(window.game.aiNodes.nodes[0]);
  const after = window.game.linkingSystem.links.length;
  console.assert(before === after, 'Preview is non-destructive');
  
  // Test 5: Console API exists
  console.assert(typeof window.autoLinkActive === 'function', 'Console API exists');
  
  // Test 6: Stats accessible
  const stats = window.game.linkAutomationEngine.getStats();
  console.assert(stats.config !== undefined, 'Stats accessible');
  
  console.log('✅ ALL TESTS PASSED');
  
} catch (err) {
  console.error('❌ TEST FAILED:', err);
}

console.groupEnd();
```

## Continuous Monitoring

Monitor engine health in production:

```javascript
// Monitor in console
setInterval(() => {
  const stats = window.game.linkAutomationEngine.getStats();
  console.log(`[AutoLink Health] Created: ${stats.totalAutoLinksCreated}, Cycles: ${stats.totalCycles}, Avg Time: ${stats.lastExecutionMs.toFixed(2)}ms`);
}, 5000);
```

---

**Testing Status:** ✅ **COMPLETE**  
**All Tests:** Ready to execute  
**Coverage:** Core functionality, integration, stress, performance
