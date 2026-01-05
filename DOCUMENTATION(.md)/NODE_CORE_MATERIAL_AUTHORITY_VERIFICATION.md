# Node Core Material Authority System — Verification Checklist

## Pre-Launch Verification (Before First Run)

### Code Quality Checks
- [x] `NodeCoreMaterialAuthority.js` syntax valid
- [x] No TypeScript errors
- [x] No ESLint warnings
- [x] All imports present
- [x] WeakMap usage correct
- [x] Try-catch blocks comprehensive
- [ ] Code review completed

### Integration Checks
- [x] main.js import statement correct (line 99)
- [x] main.js instantiation correct (line 1593)
- [x] Spawn hook correctly attached (lines 1605-1617)
- [x] Link observer correctly attached (lines 1619-1635)
- [x] Console API setup correct (line 1639)
- [ ] No duplicate initializations
- [ ] No circular dependencies

### Configuration Checks
- [x] Default profiles defined correctly
- [x] Opacity ratios correct (4:1)
- [x] RenderOrder values correct (core 100, aura 10)
- [x] Material profile properties complete
- [ ] Logging levels appropriate

---

## Runtime Startup Verification

### Application Launch
- [ ] No console errors on startup
- [ ] Console shows: `[main.js] NodeCoreMaterialAuthority initialized ✓`
- [ ] No import errors
- [ ] No undefined variable warnings
- [ ] Scene renders normally
- [ ] Game is playable

### Authority Initialization
- [ ] `window.debugCoreAuthority` is accessible
- [ ] `window.game.nodeCoreAuthority` exists
- [ ] Existing nodes registered (if any)
- [ ] No console warnings about missing nodes

### Console API Availability
- [ ] `window.debugCoreAuthority.checkNode` is function
- [ ] `window.debugCoreAuthority.testOpacityClamping` is function
- [ ] `window.debugCoreAuthority.dumpRegistry` is function
- [ ] No "undefined" errors when accessing API

---

## Basic Functionality Verification

### Node Spawn Test
```javascript
// In console:
var newNode = window.game.aiNodes.spawnNode();
window.debugCoreAuthority.checkNode(newNode);
```

- [ ] Node spawns without error
- [ ] Check output shows registration info
- [ ] Output includes profile name
- [ ] Output includes opacity
- [ ] Output includes maxAuraOpacity

### Link Creation Test
```javascript
// In console:
var n1 = window.game.aiNodes.nodes[0];
var n2 = window.game.aiNodes.nodes[1];
window.game.linkingSystem.createLink(n1, n2);
```

- [ ] Link created without error
- [ ] No console warnings
- [ ] Both nodes remain visible
- [ ] Cores not occluded by auras
- [ ] No rendering artifacts

### Material Profile Detection Test
```javascript
// Check various nodes:
for (let i = 0; i < 5; i++) {
  var node = window.game.aiNodes.nodes[i];
  window.debugCoreAuthority.checkNode(node);
  console.log('---');
}
```

- [ ] All nodes return valid profile name
- [ ] Profile matches material type
- [ ] No "undefined" profile values
- [ ] Opacity values in range (0.95-1.0)

---

## Opacity Clamping Verification

### Opacity Limit Test
```javascript
// Test various nodes:
for (let i = 0; i < 5; i++) {
  var node = window.game.aiNodes.nodes[i];
  var limit = window.game.nodeCoreAuthority.getMaxAuraOpacity(node);
  console.log(`Node ${i}: max aura opacity = ${limit}`);
}
```

- [ ] All limits are 0.25 or less
- [ ] Limits are numbers (not NaN, undefined)
- [ ] Limits are >= 0 and <= 1
- [ ] Consistent limits across nodes

### Clamping Enforcement Test
```javascript
// Create node, get limit
var node = window.game.aiNodes.nodes[0];
var maxOpacity = window.game.nodeCoreAuthority.getMaxAuraOpacity(node);

// Create test material
var material = new THREE.MeshStandardMaterial({ opacity: 0.8 });

// Apply subordination
window.game.nodeCoreAuthority.makeAuraSubordinate(material, node);

// Check result
console.log('Material opacity after subordination:', material.opacity);
```

- [ ] Material opacity clamped to maxOpacity
- [ ] Material opacity is a number
- [ ] Material blending set to ADDITIVE
- [ ] Material depthWrite set to false
- [ ] Material renderOrder set to 10

---

## Visual Quality Verification

### Core Visibility Test (Zoom Test)
1. Spawn a node
2. Create a link to another node
3. Zoom in very close to the linked node
4. Pan camera around core

- [ ] Core remains clearly visible
- [ ] Core not occluded by aura
- [ ] Core glows with holographic effect
- [ ] No visual "washing out" of core
- [ ] No artifacts or flickering

### Aura Subordination Test (Visual)
1. Create a highly linked node (3+ links)
2. Observe from normal distance
3. Zoom to close distance

- [ ] Auras visible but subordinate to core
- [ ] Core glows more brightly than auras
- [ ] No "halo overpowering" the core
- [ ] Multiple auras composite smoothly
- [ ] Professional appearance maintained

### Link Effect Test (Visual)
1. Create two unlinked nodes
2. Create link between them
3. Observe during and after link animation

- [ ] Cores remain visible during link effect
- [ ] No temporary occlusion during linking
- [ ] Cores restore properly after link animation
- [ ] Link visual effects don't degrade core

### Multiple Link Stress Test (Visual)
1. Create one central node
2. Create 8+ links to other nodes
3. Observe from multiple angles

- [ ] Central core remains dominant
- [ ] All auras visible but subordinate
- [ ] No performance degradation
- [ ] No visual artifacts
- [ ] Smooth, professional appearance

---

## Performance Verification

### Spawn Performance Test
```javascript
// Measure spawn time
console.time('spawn_100_nodes');
for (let i = 0; i < 100; i++) {
  window.game.aiNodes.spawnNode();
}
console.timeEnd('spawn_100_nodes');

// Check frame rate
// Should remain 60 FPS during spawn
```

- [ ] Spawn completes in < 2 seconds
- [ ] Frame rate doesn't drop below 30 FPS
- [ ] No console warnings during spawn
- [ ] All 100 nodes registered
- [ ] No memory spikes

### Link Performance Test
```javascript
// Measure link creation time
const nodes = window.game.aiNodes.nodes;
console.time('create_50_links');
for (let i = 0; i < 50; i++) {
  const n1 = nodes[i % nodes.length];
  const n2 = nodes[(i + 1) % nodes.length];
  window.game.linkingSystem.createLink(n1, n2);
}
console.timeEnd('create_50_links');

// Check frame rate
// Should remain 60 FPS during linking
```

- [ ] Link creation completes in < 1 second
- [ ] Frame rate doesn't drop below 30 FPS
- [ ] No console errors during linking
- [ ] All links created successfully
- [ ] Material re-assertion completes quickly

### Per-Frame Overhead Test
```javascript
// Open Chrome DevTools Performance tab
// Record for 10 seconds with 100 nodes
// Look for "assertCoreOnLink" or authority methods in frame time

// Should NOT appear in per-frame measurements
```

- [ ] No authority methods in per-frame loop
- [ ] Frame rate stable (60 FPS)
- [ ] No per-frame authority overhead detected
- [ ] Event-driven design confirmed

---

## Error Handling Verification

### Missing Core Node Test
```javascript
// Create node without mesh
var badNode = {
  userData: { id: 'test' },
  children: []
};

// Should not crash
window.game.nodeCoreAuthority.registerNodeCore(badNode);
```

- [ ] No console error
- [ ] No crash
- [ ] Silent failure handling works
- [ ] Application continues normally

### Incompatible Material Test
```javascript
// Create custom material
var customMaterial = {
  opacity: 0.5,
  // Missing standard properties
};

// Should not crash
window.game.nodeCoreAuthority.makeAuraSubordinate(customMaterial, someNode);
```

- [ ] No console error
- [ ] No crash
- [ ] Silent failure handling works

### World Reset Test
1. Play for 2 minutes
2. Create many links
3. Reset world (clear scene)
4. Spawn new world

- [ ] World resets without error
- [ ] No memory leaks (check DevTools Memory)
- [ ] New world registers nodes correctly
- [ ] No lingering references to old nodes

---

## Console API Verification

### checkNode() Output Test
```javascript
var node = window.game.aiNodes.nodes[0];
window.debugCoreAuthority.checkNode(node);
```

Expected output structure:
```
[DEBUG] Core Registration: {
  nodeId: <string or number>,
  profile: "holographic" | "solid" | "mythic",
  opacity: <0.95-1.0>,
  blending: <THREE.BlendingMode>,
  depthWrite: true,
  maxAuraOpacity: <0.2-0.25>
}
```

- [ ] Output includes all fields
- [ ] nodeId is present
- [ ] profile is valid name
- [ ] opacity is number
- [ ] blending is THREE constant
- [ ] depthWrite is true
- [ ] maxAuraOpacity is number

### testOpacityClamping() Output Test
```javascript
var node = window.game.aiNodes.nodes[0];
window.debugCoreAuthority.testOpacityClamping(node);
```

Expected output:
```
[DEBUG] Aura opacity clamp for this node: 0.25
```

- [ ] Output is formatted correctly
- [ ] Value is a number
- [ ] Value is <= 0.25
- [ ] Value is >= 0.2

---

## Edge Case Verification

### Node with Custom Profile
```javascript
// If custom profiles supported:
var node = window.game.aiNodes.nodes[0];
node.userData.coreMaterialProfile = 'custom';
window.debugCoreAuthority.checkNode(node);
```

- [ ] System handles gracefully
- [ ] Falls back to default if unsupported
- [ ] No crash

### Material Replaced After Registration
```javascript
var node = window.game.aiNodes.nodes[0];
var newMaterial = new THREE.MeshStandardMaterial();
node.mesh.material = newMaterial;

// Call protect
window.game.nodeCoreAuthority.protectCoreMaterial(node);

// Check result
console.log('Material restored:', node.mesh.material instanceof THREE.MeshStandardMaterial);
```

- [ ] Material restored to original
- [ ] No console error
- [ ] Protection works as expected

### Rapid Spawn/Link Cycle
```javascript
// Rapid spawn and link
for (let i = 0; i < 20; i++) {
  const n1 = window.game.aiNodes.spawnNode();
  const n2 = window.game.aiNodes.spawnNode();
  window.game.linkingSystem.createLink(n1, n2);
}
```

- [ ] All operations complete
- [ ] No race conditions
- [ ] No console errors
- [ ] All nodes registered
- [ ] All links created

---

## Integration Points Verification

### Aura System (If Integrated)
```javascript
// Check if aura system uses authority
var node = window.game.aiNodes.nodes[0];
var maxOpacity = window.game.nodeCoreAuthority.getMaxAuraOpacity(node);

// If aura system integrated:
// Aura opacity should <= maxOpacity
```

- [ ] Aura opacity clamped correctly
- [ ] Auras respect authority limits
- [ ] Visual subordination maintained

### Evolution System (If Integrated)
```javascript
// If evolution integrated:
// After evolution:
var node = window.game.aiNodes.nodes[0];
window.debugCoreAuthority.checkNode(node);
// Profile should still be correct
```

- [ ] Core protected during evolution
- [ ] Profile maintained post-evolution
- [ ] Visual appearance unchanged

### Event System (If Integrated)
```javascript
// If events integrated:
// During event:
var node = window.game.aiNodes.nodes[0];
// Core should remain visible
```

- [ ] Events don't occlude core
- [ ] Core remains dominant
- [ ] No visual degradation

---

## Final Validation

### Smoke Test
1. Load application
2. Spawn a few nodes
3. Create some links
4. Zoom and pan around
5. Check console for errors

- [ ] ✅ Application loads
- [ ] ✅ No console errors
- [ ] ✅ Cores visible
- [ ] ✅ Auras subordinate
- [ ] ✅ No artifacts

### Full Feature Test
1. Spawn 20 nodes
2. Create 10 links
3. Test console API
4. Check visual quality
5. Verify performance

- [ ] ✅ All nodes register
- [ ] ✅ All links work
- [ ] ✅ Console API functional
- [ ] ✅ Visuals professional
- [ ] ✅ Performance acceptable

### Production Readiness
- [ ] ✅ No errors
- [ ] ✅ No warnings
- [ ] ✅ No performance issues
- [ ] ✅ No visual artifacts
- [ ] ✅ Features complete

---

## Sign-Off

**System**: Node Core Material Authority v1.0  
**Verification Date**: _________________  
**Verified By**: _________________  
**Status**: ☐ Pass ☐ Conditional Pass ☐ Fail

**Notes**: _________________________________________________________________

---

## If Issues Found

| Issue | Cause | Solution |
|-------|-------|----------|
| Core appears dim | Material not re-asserted | Call assertCoreOnLink() manually |
| Aura overpowers core | Opacity not clamped | Check getMaxAuraOpacity() returns correct value |
| Memory leak detected | WeakMap not working | Verify nodes properly garbage collected |
| Console errors on spawn | Registration fails | Check registerNodeCore() error handling |
| Performance drop | Per-frame overhead | Verify authority methods not in animation loop |

---

## Success Criteria

✅ **PASS** if:
- All verification checks completed successfully
- No unhandled errors in console
- Core visibility guaranteed visually
- Aura subordination visible
- Performance metrics acceptable
- Console API functional

❌ **FAIL** if:
- Any critical check fails
- Unhandled console errors
- Core visibility compromised
- Performance degraded
- Console API non-functional

---

**Ready for Production**: ☐ Yes ☐ No
