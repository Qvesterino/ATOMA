# VISUAL AUDIT TOOL - QUICK START GUIDE

## What It Does

The VisualAudit tool captures complete visual state of nodes before/after linking and shows you EXACTLY what changed.

## Quick Usage

### Test a Link (Most Common)

```javascript
// In browser console, after linking has been disabled/fixed:

// Get two nodes
const nodeA = window.game.aiNodes.nodes[0];   // First node
const nodeB = window.game.aiNodes.nodes[5];   // Different node

// Run forensic test
await window.VisualAudit.testLink(nodeA, nodeB);

// Check console output - should see:
// ✅ NO CHANGES (core visuals preserved) for BOTH nodes
```

### Test Multiple Nodes

```javascript
// Test with different node categories
const spark = window.game.aiNodes.nodes.find(n => n.userData?.category === 'spark');
const harmony = window.game.aiNodes.nodes.find(n => n.userData?.category === 'harmony');

await window.VisualAudit.testLink(spark, harmony);
```

### Snapshot Individual Node

```javascript
// Before doing anything
const snap1 = window.VisualAudit.snap(nodeA);
console.log('Snapshot 1:', snap1);

// Do something (like link)
window.game.linkingSystem.attemptLink(nodeA, nodeB);

// After
const snap2 = window.VisualAudit.snap(nodeA);
console.log('Snapshot 2:', snap2);

// Compare manually
const diff = window.VisualAudit.diff(snap1, snap2);
console.log('Differences:', diff);
```

### View All Snapshots

```javascript
const allSnapshots = window.VisualAudit.exportSnapshots();
console.table(allSnapshots);
```

### Clear Snapshots

```javascript
window.VisualAudit.clear();
```

---

## What Gets Checked

The audit tool captures:

### Core Mesh
- UUID (must NOT change)
- Type (e.g., 'Mesh')
- Name
- RenderOrder (must NOT change)
- Visibility flags

### Geometry
- UUID (must NOT change)
- Type (e.g., 'IcosahedronGeometry')
- Vertex count

### Material
- UUID (must NOT change)
- Type (e.g., 'MeshStandardMaterial')
- Properties that must stay same:
  - color
  - emissive / emissiveIntensity
  - opacity
  - transparent
  - depthWrite
  - depthTest
  - blending

### Auras
- Count
- Opacity (should NOT change)
- RenderOrder (should NOT change)
- Properties

---

## Expected Results (After Fix)

When you run `window.VisualAudit.testLink(A, B)`:

```
[VisualAudit] TEST LINK: Spark → Harmony
[VisualAudit] BEFORE snapshot captured
Source before: {
  coreMesh: { uuid: "abc-123", renderOrder: 0, ... },
  geometry: { uuid: "def-456", ... },
  material: { uuid: "ghi-789", opacity: 1.0, ... },
  ...
}
[VisualAudit] AFTER snapshot captured
Source after: {
  coreMesh: { uuid: "abc-123", renderOrder: 0, ... },  ← SAME UUID
  geometry: { uuid: "def-456", ... },                   ← SAME UUID
  material: { uuid: "ghi-789", opacity: 1.0, ... },    ← SAME UUID
  ...
}
=== SOURCE NODE DIFF ===
✅ NO CHANGES (core visuals preserved)              ← THIS IS THE GOAL

=== TARGET NODE DIFF ===
✅ NO CHANGES (core visuals preserved)
```

---

## If You See Changes (Problems to Investigate)

### 🔴 Core Mesh Changed
```
CRITICAL: core_mesh_replaced
  before: "abc-123"
  after: "def-456"
```
**Problem:** Core mesh was replaced/swapped  
**Cause:** Code path is recreating the core geometry  
**Fix:** Find and disable the mesh recreation code  

### 🔴 Geometry Changed
```
CRITICAL: geometry_replaced
  before: "geo-123"
  after: "geo-456"
```
**Problem:** Geometry was replaced  
**Cause:** Code is rebuilding or swapping geometry  
**Fix:** Disable geometry mutation code  

### 🔴 Material Changed
```
CRITICAL: material_replaced
  before: "mat-123"
  after: "mat-456"
```
**Problem:** Material was replaced  
**Cause:** New material assigned to core  
**Fix:** Disable material replacement code  

### 🟠 RenderOrder Changed
```
HIGH: renderOrder_changed
  before: 0
  after: 100
```
**Problem:** RenderOrder was mutated post-link  
**Cause:** Code like `child.renderOrder = 100` post-link  
**Fix:** Disable renderOrder mutations  

### 🟠 Opacity Changed
```
HIGH: material_opacity_changed
  before: 1.0
  after: 0.08
```
**Problem:** Opacity was clamped or modified  
**Cause:** Code doing `mat.opacity = Math.min(mat.opacity, 0.08)`  
**Fix:** Disable opacity clamping in link observers  

---

## Typical Console Workflow

```javascript
// 1. Verify tool is ready
window.VisualAudit
// Output: VisualAudit { snap, diff, testLink, ... }

// 2. Test a link
await window.VisualAudit.testLink(
    window.game.aiNodes.nodes[0],
    window.game.aiNodes.nodes[5]
);

// 3. If you see ✅ NO CHANGES for both nodes → FIX WORKED!

// 4. If you see mutations → Find the code causing them using the diff
```

---

## Advanced: Debug Specific Node

```javascript
// Find problematic node
const nodes = window.game.aiNodes.nodes;
const problemNode = nodes.find(n => {
    // Your condition, e.g., certain category
    return n.userData?.category === 'integration';
});

// Capture before any operation
const before = window.VisualAudit.snap(problemNode);

// Do the operation (e.g., link, evolve, whatever)
// ...

// Capture after
const after = window.VisualAudit.snap(problemNode);

// See what changed
const diff = window.VisualAudit.diff(before, after);
console.log('Mutation details:', diff.changes);
```

---

## Integration Points (For Developers)

If you add NEW code that affects node visuals after linking, you should:

1. Make sure it doesn't mutate the core mesh/material
2. Test it with VisualAudit:
   ```javascript
   await window.VisualAudit.testLink(nodeA, nodeB);
   ```
3. Verify NO CHANGES reported for core properties
4. Only allow changes for FX layers (arc, pulses, glyphs)

---

## Troubleshooting

### ❓ "Cannot find VisualAudit"
- Make sure you're in the game canvas/page
- Check console for initialization message: `[main.js] ✓ VisualAudit tool initialized`
- Try: `window.VisualAudit` in console

### ❓ "testLink returns nothing"
- It's async: use `await`
- Check browser console (not game console) for output
- Might take a few frames to complete

### ❓ "Snapshots don't match visually"
- Tool captures metadata, not visual rendering
- Visual degradation is usually caused by shader/material changes
- Check material and geometry UUIDs especially

### ❓ "Want to save snapshots for comparison"
```javascript
// Export all
const data = JSON.stringify(window.VisualAudit.exportSnapshots(), null, 2);
console.log(data);

// Copy and paste to file or external editor
```

---

## Summary

Use `window.VisualAudit.testLink(nodeA, nodeB)` to verify nodes don't lose their visual properties after linking.

Expected: ✅ `NO CHANGES (core visuals preserved)`  
Anything else: 🔴 There's a mutation to investigate

---

**Happy auditing! 🔍**
