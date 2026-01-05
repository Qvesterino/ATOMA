# PHASE 3 GUARDS - VERIFICATION & TESTING

## Overview

This document provides comprehensive testing procedures for Phase 3 guards. Use these to verify proper guard activation and visual authority enforcement.

---

## Test 1: Rapid Spawn (Visual Overlap Prevention)

### Setup
```javascript
// Spawn 10 nodes in tight cluster within 150ms
const cluster = [];
for (let i = 0; i < 10; i++) {
  const pos = new THREE.Vector3(
    Math.random() * 2 - 1,
    Math.random() * 2 - 1,
    Math.random() * 2 - 1
  );
  cluster.push(aiNodes.createNode('input', pos, i));
}
```

### Expected Behavior
- ✅ First 1-3 nodes: `visualReady = true` (immediate visual activation)
- ✅ Next 7 nodes: `visualReady = false` initially (collision detected)
- ✅ After ~150ms: All `visualReady = true` (collision cleared)
- ✅ Console: `[MythicRitualController] Delaying ritual visuals...` messages appear

### Verification
```javascript
// In console:
cluster.forEach((n, i) => {
  console.log(`Node ${i}: visualReady = ${n.userData.visualReady}`);
});

// Expected output (immediately after spawn):
// Node 0: visualReady = true
// Node 1: visualReady = false
// Node 2: visualReady = false
// ... (nodes 3-9 false or mixed)

// After 200ms:
// Node 0-9: visualReady = true (all true now)
```

### Pass Criteria
- [ ] No visual aura overlaps visible
- [ ] All auras eventually appear
- [ ] Console shows visualReady transitions

---

## Test 2: Dense Network with Rituals

### Setup
```javascript
// Create dense network with high personality metrics
const positions = [];
for (let i = 0; i < 20; i++) {
  const angle = (i / 20) * Math.PI * 2;
  const radius = 5 + Math.random() * 3;
  positions.push(new THREE.Vector3(
    Math.cos(angle) * radius,
    Math.random() * 4 - 2,
    Math.sin(angle) * radius
  ));
}

// Create nodes and trigger ritual conditions
positions.forEach((pos, i) => {
  const node = aiNodes.createNode('mythic', pos, i);
  // Manually set personality to trigger ritual
  if (!node.userData.personality) node.userData.personality = {};
  node.userData.personality.harmony = 80;
});
```

### Expected Behavior
- ✅ Ritual triggered when conditions met
- ✅ Initial ritual visual delay if nodes not visualReady
- ✅ Log: `[MythicRitualController] Delaying ritual visuals...`
- ✅ After node visuals ready: Ritual visuals appear
- ✅ No freezing or frame drops
- ✅ No aura conflicts during ritual

### Verification
```javascript
// Watch console during test:
// [MythicRitualController] Delaying ritual visuals until nodes visualReady
// [NodeAuraSystem_v1] Skip aura update if node visual not ready
// (after ~150-300ms)
// ✨ MYTHIC RITUAL TRIGGERED: HARMONY_CONVERGENCE
```

### Pass Criteria
- [ ] Ritual triggers without visual conflicts
- [ ] Visual delays imperceptible to player
- [ ] Console shows proper guard activation
- [ ] No performance degradation

---

## Test 3: Sparse Network (Immediate Activation)

### Setup
```javascript
// Create sparse network where nodes spawn far apart
const positions = [
  new THREE.Vector3(-10, 0, -10),
  new THREE.Vector3(10, 0, -10),
  new THREE.Vector3(-10, 0, 10),
  new THREE.Vector3(10, 0, 10),
  new THREE.Vector3(0, 10, 0),
  new THREE.Vector3(0, -10, 0)
];

positions.forEach((pos, i) => {
  aiNodes.createNode('process', pos, i);
});
```

### Expected Behavior
- ✅ All nodes: `visualReady = true` immediately
- ✅ No delayed visual activation
- ✅ All auras visible immediately
- ✅ No `Delaying ritual visuals` messages in console

### Verification
```javascript
// In console (immediately after spawn):
window.debugNodes.forEach(n => {
  console.log(`${n.userData.category}: visualReady=${n.userData.visualReady}`);
});

// Expected output:
// process: visualReady=true
// process: visualReady=true
// process: visualReady=true
// ... (all true, no delays)
```

### Pass Criteria
- [ ] All nodes activate visuals immediately
- [ ] Zero visualization delays
- [ ] Sparse networks don't trigger false collision detections

---

## Test 4: Collision Radius Tuning

### Setup A: Current Default (occupancyRadius = 1.5)
```javascript
// Spawn two nodes 1.4 units apart (should collide)
const node1 = aiNodes.createNode('input', new THREE.Vector3(0, 0, 0), 0);
const node2 = aiNodes.createNode('input', new THREE.Vector3(1.4, 0, 0), 1);

// Spawn two nodes 1.6 units apart (should NOT collide)
const node3 = aiNodes.createNode('input', new THREE.Vector3(0, 0, 3), 2);
const node4 = aiNodes.createNode('input', new THREE.Vector3(1.6, 0, 3), 3);
```

### Expected Behavior (occupancyRadius = 1.5)
- ✅ node1: visualReady = true (first spawn)
- ✅ node2: visualReady = false (1.4 < 1.5, collision detected)
- ✅ node3: visualReady = true (new area, no collision)
- ✅ node4: visualReady = true (1.6 > 1.5, no collision)

### Verification
```javascript
console.log(`node1.userData.visualReady = ${node1.userData.visualReady}`); // true
console.log(`node2.userData.visualReady = ${node2.userData.visualReady}`); // false (initially)
console.log(`node3.userData.visualReady = ${node3.userData.visualReady}`); // true
console.log(`node4.userData.visualReady = ${node4.userData.visualReady}`); // true

// After 200ms, node2 should be true
setTimeout(() => {
  console.log(`node2 after delay: ${node2.userData.visualReady}`); // true
}, 200);
```

### Pass Criteria
- [ ] Collision detection works at occupancyRadius boundary
- [ ] Non-colliding nodes activate immediately

### Setup B: Aggressive Tuning (occupancyRadius = 2.0)
**Edit AINodes.js line 656**: `const occupancyRadius = 2.0;`

```javascript
// Spawn nodes at various distances
const testNodes = [
  new THREE.Vector3(0, 0, 0),     // Reference
  new THREE.Vector3(1.8, 0, 0),   // 1.8 < 2.0 (should collide)
  new THREE.Vector3(2.2, 0, 0),   // 2.2 > 2.0 (should NOT collide)
];
```

### Expected Behavior (occupancyRadius = 2.0)
- ✅ First node: visualReady = true
- ✅ Second node (1.8 away): visualReady = false (collision)
- ✅ Third node (2.2 away): visualReady = true (no collision)

### Verification
```javascript
// Same verification pattern as above
console.log(`Node at 1.8: ${testNodes[1].userData.visualReady}`); // false
console.log(`Node at 2.2: ${testNodes[2].userData.visualReady}`); // true
```

### Pass Criteria
- [ ] Aggressive radius properly detects collisions further away
- [ ] Non-colliding nodes still activate immediately

---

## Test 5: Delay Parameter Tuning

### Setup A: Quick Delay (visualActivationDelay = 100)
**Edit AINodes.js line 664**: `const visualActivationDelay = 100;`

```javascript
// Spawn cluster, measure time until visualReady = true
const node1 = aiNodes.createNode('input', new THREE.Vector3(0, 0, 0), 0);
const spawnTime = Date.now();
const node2 = aiNodes.createNode('input', new THREE.Vector3(1.0, 0, 0), 1);
const delayStart = Date.now();

// Poll for visualReady = true
let readyTime = null;
const checkInterval = setInterval(() => {
  if (node2.userData.visualReady && !readyTime) {
    readyTime = Date.now() - delayStart;
    console.log(`Visual ready after: ${readyTime}ms`);
    clearInterval(checkInterval);
  }
}, 10);
```

### Expected Behavior (visualActivationDelay = 100)
- ✅ Collision detected: visualReady = false
- ✅ After ~100-150ms: visualReady = true
- ⚠️ May not clear if collision still present (false positive prevention)

### Setup B: Patient Delay (visualActivationDelay = 250)
**Edit AINodes.js line 664**: `const visualActivationDelay = 250;`

Run same test as Setup A; expect ~250-300ms before visualReady = true.

### Pass Criteria
- [ ] Delay parameter controls re-check timing
- [ ] Smaller delays = faster visual activation
- [ ] Larger delays = more collision settling time

---

## Test 6: Node Glow Boost Guard

### Setup
```javascript
// Create node and manually trigger ritual
const node = aiNodes.createNode('mythic', new THREE.Vector3(0, 0, 0), 0);

// Manually start ritual (normally triggers on conditions)
window.world.mythicRitualController.activeRitual = 'HARMONY_CONVERGENCE';
window.world.mythicRitualController.ritualPhase = 'PEAK';
window.world.mythicRitualController.ritualProgress = 1.0;

// Track material state
console.log(`Before: emissiveIntensity = ${node.material.emissiveIntensity}`);

// Simulate ritual glow boost
window.world.mythicRitualController.updateNodeGlowBoosts([node], 0.016);

console.log(`After (visualReady=${node.userData.visualReady}): emissiveIntensity = ${node.material.emissiveIntensity}`);
```

### Expected Behavior
- ✅ visualReady = true: Node material emissiveIntensity increases
- ✅ visualReady = false: Node material emissiveIntensity unchanged (guard blocked)

### Verification
```javascript
// Compare outputs:
// visualReady=true:  emissiveIntensity increases (e.g., 0.5 → 0.75)
// visualReady=false: emissiveIntensity unchanged (stays 0.5)
```

### Pass Criteria
- [ ] Guard prevents glow modifications when visualReady = false
- [ ] Guard allows modifications when visualReady = true

---

## Test 7: Ritual Visual Guard

### Setup
```javascript
// Manually trigger ritual while nodes initializing
const nodes = [];
for (let i = 0; i < 5; i++) {
  nodes.push(aiNodes.createNode('input', new THREE.Vector3(i, 0, 0), i));
}

// Force all nodes to visualReady = false (simulating initialization)
nodes.forEach(n => n.userData.visualReady = false);

// Trigger ritual
window.world.mythicRitualController.triggerRitual('ASCENSION_RITUAL', nodes);
```

### Expected Behavior
- ✅ Ritual triggered but visuals delayed
- ✅ Console: `[MythicRitualController] Delaying ritual visuals until nodes visualReady`
- ✅ No ritual visual meshes added to scene yet
- ✅ After nodes become visualReady: Ritual visuals appear

### Verification
```javascript
// Check ritual visual count before node visuals ready
console.log(`Ritual visuals active: ${window.world.mythicRitualController.ritualVisuals.size}`);
// Expected: 0 (no visuals due to guard)

// Set nodes to visualReady and trigger ritual again
nodes.forEach(n => n.userData.visualReady = true);
window.world.mythicRitualController.triggerRitual('ASCENSION_RITUAL', nodes);

// Check again
console.log(`Ritual visuals active: ${window.world.mythicRitualController.ritualVisuals.size}`);
// Expected: > 0 (visuals now created)
```

### Pass Criteria
- [ ] Ritual visuals blocked until visualReady = true
- [ ] Guard logs appear in console
- [ ] Ritual visuals spawn once guard condition met

---

## Regression Tests

### Test 8: Existing Systems Still Work

Verify that Phase 3 guards don't break existing functionality:

```javascript
// Test 1: Node linking still works
const node1 = aiNodes.createNode('input', pos1, 0);
const node2 = aiNodes.createNode('input', pos2, 1);
nodeLinkingSystem.createConnection(node1, node2);
// Expected: Link created successfully ✓

// Test 2: Node personality still updates
const personality = nodePersonalitySystem.calculatePersonality(node1);
// Expected: Personality calculated correctly ✓

// Test 3: Aura system still works
const aura = nodeAuraSystem.registerNode(node1);
// Expected: Aura mesh created ✓

// Test 4: Evolution system still works
const evolution = safeEvolutionManager.registerNode(node1);
// Expected: Evolution state created ✓
```

### Pass Criteria
- [ ] All existing systems function normally
- [ ] No broken dependencies
- [ ] No console errors

---

## Performance Tests

### Test 9: Frame Rate Impact

```javascript
// Measure FPS with and without guards active

// With guards (current):
// Spawn 50 nodes rapidly, measure frame rate
// Expected: 60 FPS maintained (or native refresh rate)

// Without guards (hypothetical):
// (Guards are too minimal to affect performance, <0.1ms overhead)
// Expected: Essentially identical FPS
```

### Pass Criteria
- [ ] FPS maintained above 30 (minimum playable)
- [ ] FPS at 60+ with typical node counts (<30 nodes)
- [ ] No hitches or stutters during spawn/ritual

---

## Summary Checklist

Use this checklist to verify complete Phase 3 guard implementation:

- [ ] Test 1: Rapid Spawn ✓
- [ ] Test 2: Dense Network with Rituals ✓
- [ ] Test 3: Sparse Network ✓
- [ ] Test 4: Collision Radius Tuning ✓
- [ ] Test 5: Delay Parameter Tuning ✓
- [ ] Test 6: Node Glow Boost Guard ✓
- [ ] Test 7: Ritual Visual Guard ✓
- [ ] Test 8: Regression Tests ✓
- [ ] Test 9: Performance Tests ✓

**ALL TESTS PASS**: Phase 3 Guards Verified ✓

---

## Debug Commands (Copy-Paste)

```javascript
// Check all nodes visualReady status
window.checkVisualReady = () => {
  window.debugNodes.forEach((n, i) => {
    const category = n.userData.category;
    const ready = n.userData.visualReady;
    const delay = n.userData.visualActivationDelay || 'none';
    console.log(`Node ${i} [${category}]: visualReady=${ready}, delay=${delay}ms`);
  });
};

// Watch for Phase 3 guard logs
window.startGuardWatch = () => {
  const originalLog = console.log;
  console.log = function(...args) {
    if (args[0]?.includes?.('Delaying') || args[0]?.includes?.('visualReady')) {
      console.style = 'background: yellow; padding: 5px;';
    }
    originalLog.apply(console, args);
  };
};

// Measure guard performance
window.measureGuardPerf = () => {
  const t0 = performance.now();
  for (let i = 0; i < 1000; i++) {
    // Simulate guard check
    if (!window.debugNodes[0]?.userData?.visualReady) continue;
  }
  const t1 = performance.now();
  console.log(`Guard check overhead: ${((t1 - t0) / 1000).toFixed(4)}ms per node`);
};
```

Run these in browser console during testing!

