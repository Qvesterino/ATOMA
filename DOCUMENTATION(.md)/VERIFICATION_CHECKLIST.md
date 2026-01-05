# STABILIZATION PATCH — VERIFICATION CHECKLIST

## 🎯 WHAT TO TEST

Run these 8 checks. All should PASS.

---

### ✓ CHECK 1: Iterable Safety (Console Clean)
**Test:** Link 2 nodes
```
Expected: Zero "is not iterable" errors in console
Look for: No console.error or console.warn spam
Result: PASS if console is clean
```

---

### ✓ CHECK 2: Post-Link Visual (Core Readable)
**Test:** Create a link between any 2 nodes
```
Expected: Node core remains visible/readable
NOT expected: Node becomes dark/ghosted/invisible
Result: PASS if core is clearly visible
```

---

### ✓ CHECK 3: Zoom Test (Close-Up)
**Test:** Link nodes, then zoom in very close to a node
```
Expected: Inner geometry clearly visible through aura
NOT expected: Core hidden by aura halo
Result: PASS if inner geometry is readable
```

---

### ✓ CHECK 4: Zoom Out (Distance View)
**Test:** Link nodes, then zoom out to normal distance
```
Expected: Node core visible at normal zoom
NOT expected: Node lost in aura glare
Result: PASS if core is still clearly visible
```

---

### ✓ CHECK 5: Multiple Links (Stress)
**Test:** Create 5–10 links rapidly
```
Expected: All linked nodes remain readable
NOT expected: Any nodes disappear or become dark
Result: PASS if all cores remain visible
```

---

### ✓ CHECK 6: Performance (FPS Stable)
**Test:** Open browser dev tools (F12), check FPS during linking
```
Expected: 60 FPS maintained, no frame drops
NOT expected: FPS drops below 55
Result: PASS if FPS stable
```

---

### ✓ CHECK 7: Transparent Nodes (Holographic)
**Test:** Link transparent/holographic nodes (if available)
```
Expected: Transparent core remains visible through aura
NOT expected: Transparency becomes opaque
Result: PASS if transparency effect preserved
```

---

### ✓ CHECK 8: World Transitions (Persistence)
**Test:** Link nodes, switch world (M key), return to original world
```
Expected: Linking still works, cores still readable
NOT expected: Visual occlusion returns
Result: PASS if linking works in all worlds
```

---

## 📋 QUICK REFERENCE

| Check | Expected | Status |
|-------|----------|--------|
| Console clean | Zero iterable errors | ☐ |
| Link creation | Instant, works smoothly | ☐ |
| Core visible | Always readable after linking | ☐ |
| Zoom in | Inner geometry visible | ☐ |
| Zoom out | Node readable at distance | ☐ |
| 10 links | All cores visible | ☐ |
| FPS stable | 60 FPS, no drops | ☐ |
| Transparent cores | Transparency preserved | ☐ |

---

## 🔧 IF ISSUE OCCURS

### "Nodes look dark after linking"
- Check renderOrder values (core should be 100, aura 10)
- Verify opacity clamp (aura.opacity should be ≤ 0.25)
- Zoom in close to verify core is there (may just look dim)

### "Console has iterable errors"
- System still works, but guards may not be applied yet
- Reload page and try linking again
- Check browser console for specific error messages

### "FPS drops during linking"
- This is normal if linking 20+ nodes rapidly
- Should recover to 60 FPS immediately after
- If sustained FPS drop, may indicate other issue

### "Cores still hidden"
- Verify `correctPostLinkLayering()` is being called
- Check if nodes have proper userData.visualLayer tags
- May need to zoom very close to verify core exists

---

## ✨ SUCCESS CRITERIA

**ALL 8 checks PASS = System is working correctly**

```
✅ Iterable safety active (no console errors)
✅ Post-link dominance active (cores always readable)
✅ Aura opacity capped (transparency controlled)
✅ RenderOrder hierarchy enforced (correct layering)
✅ Performance maintained (60 FPS)
✅ All node types supported (opaque, transparent, holographic)
✅ No regressions (all existing systems functional)
✅ Silent operation (zero unwanted logging)
```

---

## 📊 METRICS TO TRACK

If you want to verify more deeply:

```javascript
// Check renderOrder hierarchy
let coreOrders = [];
let auraOrders = [];
game.scene.traverse(obj => {
  if (obj.isMesh) {
    if (obj.userData?.visualLayer === 'CORE') coreOrders.push(obj.renderOrder);
    if (obj.userData?.visualLayer === 'AURA') auraOrders.push(obj.renderOrder);
  }
});
console.log('Core orders:', [...new Set(coreOrders)]);  // Should show [100]
console.log('Aura orders:', [...new Set(auraOrders)]);  // Should show [10]

// Check aura opacity
game.scene.traverse(obj => {
  if (obj.isMesh && obj.userData?.visualLayer === 'AURA') {
    const mat = Array.isArray(obj.material) ? obj.material[0] : obj.material;
    if (mat) console.log(obj.name, 'opacity:', mat.opacity);  // Should be ≤ 0.25
  }
});
```

---

## 🎬 NEXT STEPS

1. Run all 8 checks above
2. Mark ☐ with ✅ as each passes
3. If all pass: **System is ready for production**
4. If any fail: Check debug section and retry

---

**Verification Status:** Ready to test
