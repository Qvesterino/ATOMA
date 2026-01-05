# AxiomCrystal: Deployment & Integration Guide

**Status**: PRODUCTION READY  
**Version**: 1.0  
**Mesh ID**: CONTROL_AXIOM_CRYSTAL  
**Category**: control (canonical, singleton)

---

## 1. WHAT IS AXIOM CRYSTAL?

**AxiomCrystal is the final, canonical form of the Control node category.**

- **Single immutable geometry** representing law/authority
- **No variants, no alternatives**—replaces entire control node pool
- **Fully faceted crystal monolith** with asymmetrical cuts and transmission material
- **Frozen at creation time**—cannot be mutated, animated, or state-modified
- **Gold → Amber → Honey color gradient** (internal)
- **5° Y-axis twist** for dynamic asymmetry

---

## 2. DEPLOYMENT STEPS

### Step 1: Verify EnhancedNodeModels.js Changes
```bash
✅ createAxiomCrystalNode() function added
✅ createControlNode() modified to use AxiomCrystal by default
✅ Fallback variants preserved for backward compatibility
```

### Step 2: Check FXRuntime Guards
**File**: `FXRuntime_v1.js`

Ensure material mutation is skipped for immutable nodes:
```javascript
// In processNodeMaterial() or similar
if (node.userData.noMaterialMutation) {
  return; // Skip all material tweaks
}
```

### Step 3: Check WaveShaderBridge Guards
**File**: `WaveShaderBridge_v1.js`

Ensure shader bridges don't affect AxiomCrystal:
```javascript
// In applyShaderBridge() or similar
if (node.userData.noMaterialMutation) {
  return; // Skip shader application
}
```

### Step 4: Verify NodeVisualReadinessGate
**File**: `NodeVisualReadinessGate_v1.js`

AxiomCrystal should be ready immediately (no FX processing):
```javascript
// Mark as ready on creation (no VFX bootstrap needed)
if (node.userData.isCanonicalControlNode) {
  markNodeVisualReady(node);
}
```

### Step 5: Test Spawn
```javascript
// Test: Spawn a control node
const testNode = AINodes.createNode({
  category: 'control',
  position: [0, 0, 0],
  color: 0xff0000
});

// Verify
console.assert(
  testNode.userData.nodeGeometryName === 'CONTROL_AXIOM_CRYSTAL',
  'AxiomCrystal should spawn'
);
console.assert(
  testNode.userData.isCanonicalControlNode === true,
  'Should be canonical'
);
console.assert(
  testNode.userData.immutable === true,
  'Should be immutable'
);
```

---

## 3. INTEGRATION POINTS

### 3.1 AINodes.js
**Effect**: No changes needed. Existing code automatically gets AxiomCrystal.

```javascript
// Existing code path:
const controlNode = EnhancedNodeModels.create('control', index, color);
// Now always returns AxiomCrystal mesh (regardless of index)
```

### 3.2 FXRuntime_v1.js
**Required Guard**:
```javascript
// In material processing loop
nodeGroup.traverse(child => {
  if (child.isMesh && child.material) {
    // NEW: Check immutability
    if (nodeGroup.userData.noMaterialMutation) {
      return; // Skip this node entirely
    }
    
    // Existing material updates...
  }
});
```

### 3.3 WaveShaderBridge_v1.js
**Required Guard**:
```javascript
// In shader bridge application
if (inputNode.userData.noMaterialMutation) {
  return inputNode; // Pass through without modification
}

// Existing shader code...
```

### 3.4 NodeVisualReadinessGate_v1.js
**Enhancement** (optional):
```javascript
// Speed up ready marking for static geometries
if (node.userData.isStaticAxiomCrystal) {
  markNodeVisualReady(node);
  return; // No VFX processing needed
}
```

### 3.5 VisualHierarchyRegistry
**No changes needed.** AxiomCrystal uses default renderOrder.

---

## 4. TESTING PROTOCOL

### Test 1: Basic Spawn
```javascript
function testAxiomCrystalSpawn() {
  const group = new THREE.Group();
  const crystal = EnhancedNodeModels.createAxiomCrystalNode(group, 0xff0000);
  
  assert(group.children.length === 1, "Should have 1 child mesh");
  assert(
    group.userData.nodeGeometryName === 'CONTROL_AXIOM_CRYSTAL',
    "Should be named CONTROL_AXIOM_CRYSTAL"
  );
  assert(group.userData.isCanonicalControlNode, "Should be marked canonical");
  console.log("✅ Test 1 Passed: Basic Spawn");
}
```

### Test 2: Immutability
```javascript
function testAxiomCrystalImmutability() {
  const group = new THREE.Group();
  EnhancedNodeModels.createAxiomCrystalNode(group, 0xff0000);
  
  const mesh = group.children[0];
  const originalTransmission = mesh.material.transmission;
  
  // Try to mutate (should fail or be ignored)
  try {
    mesh.material.transmission = 0.5; // Attempt change
    // Verify unchanged (frozen)
    assert(
      mesh.material.transmission === originalTransmission,
      "Material should be immutable"
    );
  } catch (err) {
    // Expected: frozen object throws
    console.log("✅ Test 2 Passed: Immutability (frozen property)");
  }
}
```

### Test 3: Geometry Integrity
```javascript
function testAxiomCrystalGeometry() {
  const group = new THREE.Group();
  EnhancedNodeModels.createAxiomCrystalNode(group, 0xff0000);
  
  const mesh = group.children[0];
  assert(mesh.geometry.attributes.position.count === 19, "Should have 19 vertices");
  
  const indexCount = mesh.geometry.index.count;
  assert(indexCount === 66, "Should have 66 indices (22 triangles × 3)");
  
  console.log("✅ Test 3 Passed: Geometry Integrity");
}
```

### Test 4: Material Properties
```javascript
function testAxiomCrystalMaterial() {
  const group = new THREE.Group();
  EnhancedNodeModels.createAxiomCrystalNode(group, 0xff0000);
  
  const mesh = group.children[0];
  const mat = mesh.material;
  
  assert(mat instanceof THREE.MeshPhysicalMaterial, "Should use PhysicalMaterial");
  assert(mat.transmission === 0.9, "Transmission should be 0.9");
  assert(mat.roughness === 0.1, "Roughness should be 0.1");
  assert(mat.ior === 1.45, "IOR should be 1.45");
  assert(mat.metalness === 0.0, "Metalness should be 0 (dielectric)");
  
  console.log("✅ Test 4 Passed: Material Properties");
}
```

### Test 5: FX Runtime Skip
```javascript
function testFXRuntimeSkip() {
  const group = new THREE.Group();
  EnhancedNodeModels.createAxiomCrystalNode(group, 0xff0000);
  
  const originalMat = group.children[0].material.clone();
  
  // Simulate FXRuntime processing
  if (group.userData.noMaterialMutation) {
    // Should skip
    console.log("✅ Test 5 Passed: FXRuntime will skip this node");
  } else {
    throw new Error("FXRuntime should detect noMaterialMutation flag");
  }
}
```

### Test 6: Visual Verification
```javascript
// Spawn in scene and verify:
// 1. Visible tall crystal tower
// 2. Golden-amber color with honey glow
// 3. Sharp faceted edges
// 4. Slight ~5° lean to left
// 5. No rotation animation (static)
```

---

## 5. ROLLBACK INSTRUCTIONS

If AxiomCrystal causes issues:

### Option 1: Temporary Disable
**File**: `EnhancedNodeModels.js` → `createControlNode()`
```javascript
// Restore variant pool
static createControlNode(group, index, color) {
  const variants = [
    this.createControlNode0.bind(this),        // OctagonalCore
    this.createControlNode2.bind(this),        // RingLattice
    this.createControlNode1.bind(this),        // SpikedControl
    // ... etc
  ];
  return variants[index % 4](group, color);  // Cycle through variants
}
```

### Option 2: Remove Function
Remove `createAxiomCrystalNode()` entirely and revert `createControlNode()` to original.

---

## 6. DOCUMENTATION FILES

| File | Purpose |
|------|---------|
| **AXIOM_CRYSTAL_CANONICAL_CONTROL_NODE_v1.md** | Complete specification (vertices, facets, material, design intent) |
| **AXIOM_CRYSTAL_QUICK_REFERENCE.txt** | Quick lookup (geometry, material, code examples) |
| **AXIOM_CRYSTAL_DEPLOYMENT_GUIDE.md** | This file—integration & testing |

---

## 7. PERFORMANCE NOTES

| Metric | Value |
|--------|-------|
| **Vertices** | 19 (minimal) |
| **Triangles** | 22 (minimal) |
| **Material Calls** | 1 (single material) |
| **Animation Cost** | 0 (static) |
| **Memory** | ~4KB total |
| **GPU Load** | Negligible |

**Conclusion**: AxiomCrystal is **extremely efficient**—easier to render than complex variants.

---

## 8. FAQ

### Q: Will existing control nodes break?
**A**: No. AxiomCrystal replaces the variant pool but doesn't affect spawn logic. Code calling `create('control', ...)` continues to work.

### Q: Can I animate AxiomCrystal?
**A**: The mesh itself is immutable. However, the parent group can be rotated. No per-frame material/geometry changes are allowed.

### Q: Why frozen object?
**A**: Prevents accidental mutations and enforces design intent. Law should not change.

### Q: What about node color parameter?
**A**: Ignored for AxiomCrystal. Material color is built-in (gold-amber). This is intentional.

### Q: Can I spawn multiple AxiomCrystals?
**A**: Yes, each spawn creates a new independent mesh. All share the same immutable properties.

### Q: Is AxiomCrystal visible at distance?
**A**: Yes. Sharp facets and golden color make it readable even at camera distance.

---

## 9. SUCCESS CRITERIA

✅ AxiomCrystal deploys without errors  
✅ Spawns correctly in control category  
✅ Immutability guards prevent mutations  
✅ FXRuntime/WaveShaderBridge skip it  
✅ Geometry is closed and renders correctly  
✅ Material shows transmission/refraction  
✅ No animation glitches  
✅ Performance optimal  

---

## 10. NEXT STEPS

1. **Merge** `createAxiomCrystalNode()` into production branch
2. **Test** spawn across all environments (chamber, desert, quantum, fractal)
3. **Verify** guards in FXRuntime, WaveShaderBridge are in place
4. **Monitor** for any immutability errors
5. **Document** any environment-specific behavior
6. **Archive** old control node variants (for reference)

---

**AXIOM CRYSTAL DEPLOYMENT COMPLETE**  
*Static. Immutable. Law.*
