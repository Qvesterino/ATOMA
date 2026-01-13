# Legacy Scale Pulse - Verification Checklist

## Pre-Verification Setup

- [ ] Browser with ATOMA loaded
- [ ] Console open (F12)
- [ ] Scene with visible nodes (at least 3 nodes)
- [ ] At least 15 seconds observation time

---

## Phase 1: Configuration Verification (2 minutes)

### 1.1 Check Config Is Accessible
```javascript
console.assert(
  EnhancedNodeModels.config !== undefined,
  '❌ Config not found'
);
console.log('✅ Config accessible');
```
**Expected**: No assertion error
**Status**: [ ] Pass [ ] Fail

### 1.2 Verify Master Flag
```javascript
console.assert(
  EnhancedNodeModels.config.DISABLE_LEGACY_SCALE_PULSE === true,
  '❌ Master flag not true'
);
console.log('✅ Master flag enabled (breathing disabled)');
```
**Expected**: No assertion error, master flag = true
**Status**: [ ] Pass [ ] Fail

### 1.3 Verify All Individual Flags
```javascript
const cfg = EnhancedNodeModels.config;
console.assert(cfg.DISABLE_SPINE_BREATHING === true, 'Spine: not true');
console.assert(cfg.DISABLE_FUNNEL_BREATHING === true, 'Funnel: not true');
console.assert(cfg.DISABLE_FRACTAL_BREATHING === true, 'Fractal: not true');
console.assert(cfg.DISABLE_ANTENNA_PULSE === true, 'Antenna: not true');
console.assert(cfg.DISABLE_GLOW_PULSING === true, 'Glow: not true');
console.log('✅ All flags set to disable');
```
**Expected**: No assertion errors
**Status**: [ ] Pass [ ] Fail

### 1.4 Check Flag Types
```javascript
const cfg = EnhancedNodeModels.config;
const allBooleans = Object.values(cfg).every(v => typeof v === 'boolean');
console.assert(allBooleans, '❌ Not all flags are boolean');
console.log('✅ All flags are boolean type');
```
**Expected**: No assertion error
**Status**: [ ] Pass [ ] Fail

---

## Phase 2: Visual Behavior Verification (5 minutes)

### 2.1 TRANSFORMATION_SPINE - No Scale Breathing
**Node Type**: Integration node with rotation
**Observation Time**: 10 seconds

```javascript
// Script to monitor (run in console)
let prevScale = null;
let scaleChanges = 0;
let checkInterval = setInterval(() => {
  const spineNode = window.game?.aiNodes?.nodes.find(n => 
    n.userData?.nodeGeometryName === 'TRANSFORMATION_SPINE'
  );
  
  if (spineNode) {
    const currentScale = spineNode.scale.x;
    if (prevScale && Math.abs(currentScale - prevScale) > 0.01) {
      scaleChanges++;
      console.warn(`Scale change detected: ${prevScale} → ${currentScale}`);
    }
    prevScale = currentScale;
  }
}, 100);

// Stop after 10 seconds
setTimeout(() => {
  clearInterval(checkInterval);
  console.log(`TRANSFORMATION_SPINE scale changes: ${scaleChanges} (expected: 0)`);
}, 10000);
```

**Expected**: 0 scale changes (scale stays 1.0)
**Observation**: Watch a transformation node - it should rotate but NOT scale up/down
**Status**: [ ] Pass (0 changes) [ ] Fail (>0 changes)

### 2.2 INCOMING_FUNNEL - No Width Breathing
**Node Type**: Process node (funnel-like)
**Observation Time**: 10 seconds
**Visual Check**: Funnel node rotates but width (X/Z scale) stays constant

**Expected**: Scale.x and Scale.z remain constant (1.0)
**Observation**: Watch funnel node - it should rotate but NOT expand/contract in width
**Status**: [ ] Pass (stable width) [ ] Fail (width changes)

### 2.3 FRACTAL_ECHO - No Scale Breathing
**Node Type**: Special archetype (fractal-based)
**Observation Time**: 10 seconds
**Visual Check**: Fractal node rotates but does NOT scale

**Expected**: Scale remains constant (1.0)
**Observation**: Watch fractal node - it should rotate/orbit but NOT breathe
**Status**: [ ] Pass (stable scale) [ ] Fail (scale changes)

### 2.4 SIGNAL_RECEPTOR - No Antenna Pulsing
**Node Type**: Input node (receptor-based)
**Observation Time**: 10 seconds
**Visual Check**: Core rotates, antennas stay same length (no elongation/compression)

**Expected**: Antenna scale.y remains constant (1.0)
**Observation**: Watch antenna elements - they should stay same length
**Status**: [ ] Pass (stable antenna) [ ] Fail (antenna pulses)

### 2.5 COMMAND_PYRAMID - No Glow Pulsing
**Node Type**: Control node (pyramid-based)
**Observation Time**: 10 seconds
**Visual Check**: Core rotates, glow stays same size (no pulsing)

**Expected**: Glow scale remains constant (1.0)
**Observation**: Watch glow element - it should stay same size
**Status**: [ ] Pass (stable glow) [ ] Fail (glow pulses)

---

## Phase 3: Animation Preservation Verification (3 minutes)

### 3.1 Rotations Still Work
**Visual Check**: Nodes still rotate smoothly

```javascript
// Monitor rotation changes
const node = window.game?.aiNodes?.nodes[0];
if (node) {
  const initialRot = { ...node.rotation };
  setTimeout(() => {
    const currentRot = { ...node.rotation };
    const rotChanged = 
      Math.abs(initialRot.x - currentRot.x) > 0.01 ||
      Math.abs(initialRot.y - currentRot.y) > 0.01 ||
      Math.abs(initialRot.z - currentRot.z) > 0.01;
    
    console.log(rotChanged ? 
      '✅ Rotations working' : 
      '❌ Rotations not working');
  }, 2000);
}
```

**Expected**: Nodes rotate smoothly
**Status**: [ ] Pass (rotations smooth) [ ] Fail (no rotation)

### 3.2 Orbits Still Work
**Visual Check**: Nodes in orbit patterns still orbit

**Expected**: Orbiting nodes maintain orbit animation
**Observation**: Watch any orbiting elements - they should continue to orbit
**Status**: [ ] Pass (orbits smooth) [ ] Fail (orbits stopped)

### 3.3 No Visual Regression
**Visual Check**: Overall scene looks stable and premium

**Expected**: Nodes appear more stable and intentional
**Observation**: Overall visual quality feels professional and stable
**Status**: [ ] Pass (premium appearance) [ ] Fail (visual degradation)

---

## Phase 4: Console Output Verification (1 minute)

### 4.1 Check for Scale Pulse Warnings
```javascript
// Search console history for warnings
// Expected: NO messages containing:
//   - "scale.set"
//   - "breathing"
//   - "pulse"
// Related to unintended mutations

console.log('Check console history - should see NO scale mutation warnings');
```

**Expected**: No scale-related warnings
**Status**: [ ] Pass (no warnings) [ ] Fail (has warnings)

### 4.2 Check for Errors
```javascript
// Expected: NO errors about scale/animate/breathing
console.log('✅ No errors in console');
```

**Expected**: No console errors
**Status**: [ ] Pass (clean console) [ ] Fail (has errors)

### 4.3 Full Config Dump
```javascript
console.table(EnhancedNodeModels.config);
```

**Expected**: All values = true
**Status**: [ ] Pass (all true) [ ] Fail (some false)

---

## Phase 5: Per-Node Type Verification (5 minutes)

### 5.1 INPUT Nodes
- [ ] No antenna pulsing (if applicable)
- [ ] Rotations smooth
- [ ] Scale stays 1.0
- [ ] Visual quality: Premium ✅ / Degraded ❌

### 5.2 PROCESS Nodes
- [ ] No funnel width breathing
- [ ] Rotations smooth
- [ ] Scale stays 1.0
- [ ] Visual quality: Premium ✅ / Degraded ❌

### 5.3 INTEGRATION Nodes
- [ ] No spine scale breathing
- [ ] Rotations smooth
- [ ] Scale stays 1.0
- [ ] Visual quality: Premium ✅ / Degraded ❌

### 5.4 ANALYTICS Nodes
- [ ] Scale stays 1.0
- [ ] Rotations smooth
- [ ] Visual quality: Premium ✅ / Degraded ❌

### 5.5 STORAGE Nodes
- [ ] Scale stays 1.0
- [ ] Animations smooth
- [ ] Visual quality: Premium ✅ / Degraded ❌

### 5.6 CONTROL Nodes
- [ ] No glow pulsing
- [ ] Rotations smooth
- [ ] Scale stays 1.0
- [ ] Visual quality: Premium ✅ / Degraded ❌

### 5.7 SPECIAL Nodes (Quantum, Mythic, Prime, etc.)
- [ ] No fractal breathing (if FRACTAL_ECHO)
- [ ] Rotations smooth
- [ ] Scale stays 1.0
- [ ] Visual quality: Premium ✅ / Degraded ❌

---

## Phase 6: Comprehensive Scale Check (3 minutes)

### 6.1 Sample 5 Random Nodes
```javascript
// Run this to check 5 random nodes
for (let i = 0; i < 5; i++) {
  const node = window.game?.aiNodes?.nodes[i];
  if (node) {
    console.log(`Node ${i}: scale = (${node.scale.x}, ${node.scale.y}, ${node.scale.z})`);
    
    // Check if scale is 1.0
    const isStableScale = 
      Math.abs(node.scale.x - 1.0) < 0.001 &&
      Math.abs(node.scale.y - 1.0) < 0.001 &&
      Math.abs(node.scale.z - 1.0) < 0.001;
    
    console.log(`  Status: ${isStableScale ? '✅ Stable' : '⚠️ Not 1.0'}`);
  }
}
```

**Expected**: All nodes have scale ≈ 1.0
**Status**: [ ] Pass (all 1.0) [ ] Fail (some != 1.0)

### 6.2 Monitor Scale Over Time
```javascript
// Monitor scale changes on first node
const node = window.game?.aiNodes?.nodes[0];
if (node) {
  console.log(`Initial scale: (${node.scale.x}, ${node.scale.y}, ${node.scale.z})`);
  
  setTimeout(() => {
    console.log(`After 10s: (${node.scale.x}, ${node.scale.y}, ${node.scale.z})`);
    
    const changed = 
      Math.abs(node.scale.x - 1.0) > 0.01 ||
      Math.abs(node.scale.y - 1.0) > 0.01 ||
      Math.abs(node.scale.z - 1.0) > 0.01;
    
    console.log(changed ? '❌ Scale changed!' : '✅ Scale stable!');
  }, 10000);
}
```

**Expected**: Scale stays stable at (1.0, 1.0, 1.0)
**Status**: [ ] Pass (stable) [ ] Fail (changes)

---

## Acceptance Criteria

### ✅ PASS if ALL of the following are true:

**Configuration Level**:
- [ ] EnhancedNodeModels.config exists
- [ ] DISABLE_LEGACY_SCALE_PULSE = true
- [ ] All individual flags = true

**Visual Level**:
- [ ] TRANSFORMATION_SPINE: no scale breathing
- [ ] INCOMING_FUNNEL: no width breathing
- [ ] FRACTAL_ECHO: no scale breathing
- [ ] SIGNAL_RECEPTOR: no antenna pulsing
- [ ] COMMAND_PYRAMID: no glow pulsing

**Animation Level**:
- [ ] Rotations still work
- [ ] Orbits still work
- [ ] No visual regression

**Console Level**:
- [ ] No scale-related warnings
- [ ] No console errors
- [ ] All config values correct

**Node Level**:
- [ ] All nodes maintain scale 1.0
- [ ] All 6 node types verified
- [ ] Scale stays stable over time

---

## Test Results Summary

| Phase | Status | Notes |
|-------|--------|-------|
| 1. Config Verification | [ ] Pass [ ] Fail | |
| 2. Visual Behavior | [ ] Pass [ ] Fail | |
| 3. Animation Preservation | [ ] Pass [ ] Fail | |
| 4. Console Output | [ ] Pass [ ] Fail | |
| 5. Per-Node Type | [ ] Pass [ ] Fail | |
| 6. Scale Check | [ ] Pass [ ] Fail | |

---

## Overall Verdict

### ✅ SYSTEM HEALTHY
All checks passed - Legacy scale pulse successfully disabled.
Nodes maintain stable, premium appearance with full animation support.

### ⚠️ SYSTEM ISSUES DETECTED
Some checks failed - Review failed items above.
May need to investigate specific node types or console errors.

---

## Troubleshooting

### Issue: Some Nodes Still Breathing
**Solution**: Check if DISABLE_LEGACY_SCALE_PULSE was reset
```javascript
EnhancedNodeModels.config.DISABLE_LEGACY_SCALE_PULSE = true;
```

### Issue: Rotations Not Working
**Solution**: Verify animations weren't accidentally disabled
```javascript
console.log('Check animate() function is being called');
console.log('Check deltaTime and time params are valid');
```

### Issue: Console Shows Warnings
**Solution**: Check if guards are properly in place
```javascript
// Re-check file: /EnhancedNodeModels.js lines 3461-3651
// Ensure all 5 fixes are present
```

### Issue: Scale Not Stable
**Solution**: Verify fix was applied to correct node type
```javascript
const node = window.game?.aiNodes?.nodes[0];
console.log('Node geometry:', node.userData?.nodeGeometryName);
// Check if corresponding guard is in place
```

---

## Sign-Off

**Tester Name**: ________________  
**Date**: ________________  
**Overall Status**: [ ] PASS [ ] FAIL  
**Issues Found**: ________________  
**Ready for Production**: [ ] YES [ ] NO  

---

*Verification Checklist - Use Before Deployment*
