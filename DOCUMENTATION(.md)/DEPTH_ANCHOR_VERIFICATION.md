# DEPTH ANCHOR VERIFICATION GUIDE

## 🎯 WHAT TO TEST

Run these 5 checks. All should PASS.

---

### ✓ CHECK 1: Detection Works
**Test:** Check if system identifies transparent cores

```javascript
// In browser console:
game.nodeSurfaceDepthAnchor.config.debugEnabled = true;
game.nodeSurfaceDepthAnchor.printStatus(game.aiNodes.nodes);
```

**Expected Output:**
```
[NodeSurfaceProtection] Status:
  ✓ Protected [FLAG] node_1_transparent
  ✓ Protected [FLAG] node_2_holographic
    Unprotected node_3_solid
    Unprotected node_4_opaque
  ...
```

**PASS if:**
- Transparent nodes marked as ✓ Protected
- Solid nodes marked as Unprotected
- No console errors

---

### ✓ CHECK 2: Anchor Mesh Created
**Test:** Verify depth anchor meshes exist in scene

```javascript
// In browser console:
let anchorCount = 0;
game.scene.traverse(obj => {
  if (obj.userData?.isDepthAnchor) {
    anchorCount++;
    console.log(`Anchor ${anchorCount}:`, obj.name, 
                'Parent:', obj.parent?.name,
                'Opacity:', obj.material?.opacity);
  }
});
console.log(`Total anchors: ${anchorCount}`);
```

**Expected Output:**
```
Anchor 1: depthAnchor Parent: node_1_transparent Opacity: 0.001
Anchor 2: depthAnchor Parent: node_2_holographic Opacity: 0.001
Total anchors: 2
```

**PASS if:**
- Anchors found (count > 0 for transparent nodes)
- Opacity = 0.001 (nearly invisible)
- Each anchor has parent node

---

### ✓ CHECK 3: Post-Link Visibility
**Test:** Link nodes and verify transparent cores remain readable

```
1. Find a transparent node (e.g., cyan holographic one)
2. Create a link to another node
3. Zoom in close
4. Observe node core
```

**Expected:**
- Node core clearly visible
- Inner geometry readable (if it exists)
- Aura visible but not occluding core
- Holographic effect preserved

**PASS if:**
- Core is readable
- NOT hidden/faded inside aura
- Aura provides context at edges

---

### ✓ CHECK 4: Zoom Test (Distance Independence)
**Test:** Verify core visibility at all zoom levels

```
1. Link transparent nodes
2. Zoom in very close (enter node)
3. Observe: inner geometry visible?
   → PASS if yes
4. Zoom out to normal distance (7–10m)
5. Observe: core visible?
   → PASS if yes
6. Zoom out far (20m+)
7. Observe: core outline visible?
   → PASS if yes
```

**Expected:**
- Core readable at all zoom levels
- Same visual quality whether zoomed in or out
- No "pop-in" or sudden visibility change

**PASS if:**
- Core visible at close, medium, and far distances
- No zoom-dependent visibility issues

---

### ✓ CHECK 5: Performance Stable
**Test:** Check FPS and memory during linking

```
1. Open browser DevTools (F12)
2. Go to Performance tab
3. Create multiple links (5–10)
4. Check FPS: should remain ~60 FPS
5. Check memory: should be stable (no leak)
6. Close DevTools
```

**Expected:**
- FPS stays 60 (or device max)
- No frame drops during linking
- Memory usage stable
- No console warnings/errors

**PASS if:**
- FPS maintained during link creation
- Memory not growing
- Console clean (no errors)

---

## 📋 QUICK CHECKLIST

| Check | Expected | Status |
|-------|----------|--------|
| Detection works | Anchors created for transparent nodes | ☐ |
| Anchors exist | 2+ depth anchor meshes in scene | ☐ |
| Core readable | Transparent core visible after linking | ☐ |
| Zoom independent | Core readable at all zoom levels | ☐ |
| Performance | 60 FPS stable, no memory leak | ☐ |

**Overall Status:**
- All checks PASS? → ✅ System working correctly
- Any check FAIL? → 🔍 Debug section below

---

## 🔍 IF CHECKS FAIL

### "Anchors not created"
- Check if node material is truly transparent
- Verify opacity < 0.95: `game.aiNodes.nodes[0].traverse(m => console.log(m.material?.opacity))`
- Force-protect: `game.nodeSurfaceDepthAnchor.forceProtectNode(node)`
- Reload page and retry

### "Core still looks faded"
- Verify renderOrder hierarchy: `game.aiNodes.nodes[0].traverse(m => console.log(m.renderOrder))`
  - Core should be 100
  - Aura should be 10
- Check aura opacity: `console.log(aura.material?.opacity)` — should be ≤0.25
- Zoom very close to verify core exists (may appear faded at distance)

### "FPS drops"
- This is normal if linking 15+ nodes rapidly
- Should recover immediately after linking stops
- If sustained drop, may be unrelated issue

### "Anchors visible"
- Anchor opacity should be 0.001 (barely visible)
- Should be nearly invisible at normal zoom
- If clearly visible, something is wrong (report bug)

### "Memory growing"
- Indicates possible WeakSet not working
- Reload page to reset
- Check console for errors

---

## 🧬 DEEP DEBUG

### Check Material Properties

```javascript
game.aiNodes.nodes.forEach((node, idx) => {
  let hasTransparent = false;
  node.traverse(mesh => {
    if (mesh.isMesh && mesh.material) {
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach(mat => {
        if (mat.transparent && mat.opacity < 0.95) {
          hasTransparent = true;
          console.log(`Node ${idx}:`, mesh.name, {
            transparent: mat.transparent,
            opacity: mat.opacity,
            blending: mat.blending
          });
        }
      });
    }
  });
  if (hasTransparent) {
    console.log(`  → Node ${idx} NEEDS anchor (transparent core detected)`);
    console.log(`  → Is protected?`, game.nodeSurfaceDepthAnchor.isProtected(node));
  }
});
```

### Check Depth Buffer

```javascript
// Find which nodes have depth anchors
let nodesByAnchorCount = {};
game.scene.traverse(obj => {
  if (obj.userData?.isDepthAnchor && obj.parent) {
    const parentName = obj.parent.name || 'unnamed';
    nodesByAnchorCount[parentName] = (nodesByAnchorCount[parentName] || 0) + 1;
  }
});
console.log('Anchor distribution:', nodesByAnchorCount);
```

### Check RenderOrder Hierarchy

```javascript
// Verify renderOrder levels
let renderOrders = {};
game.scene.traverse(obj => {
  if (obj.isMesh && obj.renderOrder) {
    const layer = obj.userData?.visualLayer || 'UNKNOWN';
    if (!renderOrders[obj.renderOrder]) renderOrders[obj.renderOrder] = [];
    renderOrders[obj.renderOrder].push({ name: obj.name, layer });
  }
});
console.table(renderOrders);
```

---

## ✨ SUCCESS CRITERIA

**All 5 checks PASS means:**

✅ Transparent nodes detected automatically  
✅ Depth anchors created and positioned correctly  
✅ Anchors prevent core occlusion  
✅ Core visibility independent of zoom level  
✅ Performance unaffected (60 FPS maintained)  

---

## 📝 TEST REPORT TEMPLATE

```
DEPTH ANCHOR VERIFICATION REPORT

Date: [TODAY]
System: [BROWSER] [OS]
Game Version: [VERSION]

CHECK 1: Detection Works
  Result: [PASS/FAIL]
  Details: [anchors created? count?]

CHECK 2: Anchors Exist
  Result: [PASS/FAIL]
  Details: [how many anchors? opacity correct?]

CHECK 3: Post-Link Visibility
  Result: [PASS/FAIL]
  Details: [core readable after linking?]

CHECK 4: Zoom Independence
  Result: [PASS/FAIL]
  Details: [readable at close/normal/far zoom?]

CHECK 5: Performance
  Result: [PASS/FAIL]
  Details: [FPS stable? memory leak?]

OVERALL: [PASS/FAIL]

Issues Found:
  - [describe any issues]

Notes:
  - [any other observations]
```

---

**Verification complete. System ready for production if all checks PASS.**
