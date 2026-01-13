# VISUAL HIERARCHY REGISTRY — Quick Integration Reference

**TL;DR**: Add 1–2 lines to mesh creation code to use canonical renderOrder values.

---

## ✨ 3-MINUTE INTEGRATION

### Step 1: Import Registry

```javascript
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';
```

### Step 2: Query When Creating Mesh

**BEFORE** (hardcoded):
```javascript
const mesh = new THREE.Mesh(geometry, material);
mesh.renderOrder = 50;  // ← Magic number, unclear what layer this is
```

**AFTER** (registry):
```javascript
const mesh = new THREE.Mesh(geometry, material);
mesh.renderOrder = VisualHierarchyRegistry?.getRenderOrder('EVOLUTION', 50) ?? 50;
mesh.userData.visualLayer = 'EVOLUTION';
```

### Step 3: (Optional) Use Opacity Bounds

```javascript
const bounds = VisualHierarchyRegistry.getOpacityBounds('EVOLUTION');
mesh.material.opacity = Math.max(bounds.min, Math.min(bounds.max, targetOpacity));
```

**That's it!** Your system now:
- ✅ Uses canonical renderOrder from registry
- ✅ Falls back to hardcoded if registry unavailable
- ✅ Tags mesh with visual layer for debugging
- ✅ Respects opacity constraints

---

## 🎯 LAYER QUICK REFERENCE

| Layer | RenderOrder | Use For |
|-------|-------------|---------|
| `AURA` | -1 | Halos, rings, ambient fields (behind core) |
| `CORE` | 0 | Primary node geometry |
| `ARCHETYPE` | 1 | Inner/extreme geometries (part of core) |
| `EVOLUTION` | 50 | Evolution visuals, personality overlays |
| `FX` | 100 | Particles, pulses, temporary effects |
| `DEBUG` | 200 | Debug overlays (legacy, fading out) |

---

## 💡 COMMON PATTERNS

### Pattern 1: Simple Mesh in A Specific Layer

```javascript
// Evolution overlay
const mesh = new THREE.Mesh(geom, mat);
mesh.renderOrder = VisualHierarchyRegistry?.getRenderOrder('EVOLUTION', 50) ?? 50;
mesh.userData.visualLayer = 'EVOLUTION';
scene.add(mesh);
```

### Pattern 2: With Opacity Constraint

```javascript
// Aura halo
const mesh = new THREE.Mesh(geom, mat);
const layer = VisualHierarchyRegistry.getLayer('AURA');
mesh.renderOrder = layer?.renderOrder ?? -1;
mesh.userData.visualLayer = 'AURA';
mesh.material.opacity = VisualHierarchyRegistry.clampOpacity('AURA', targetOpacity);
scene.add(mesh);
```

### Pattern 3: Batch of Meshes

```javascript
// Multiple evolution meshes in a group
const group = new THREE.Group();
const layer = VisualHierarchyRegistry.getLayer('EVOLUTION');

geometries.forEach(geom => {
  const mesh = new THREE.Mesh(geom, material);
  mesh.renderOrder = layer?.renderOrder ?? 50;
  mesh.userData.visualLayer = layer?.id ?? 'EVOLUTION';
  group.add(mesh);
});

node.add(group);
```

### Pattern 4: In Existing Method (Minimal Change)

```javascript
// Before: createNodeVisuals(node) { ... mesh.renderOrder = 50; ... }
// After: Just replace the hardcoded value

createNodeVisuals(node) {
  // ... other code ...
  
  // OLD: mesh.renderOrder = 50;
  // NEW:
  mesh.renderOrder = VisualHierarchyRegistry?.getRenderOrder('EVOLUTION', 50) ?? 50;
  mesh.userData.visualLayer = 'EVOLUTION';
  
  // ... rest of code ...
}
```

---

## 🔄 BEFORE/AFTER: REAL EXAMPLES

### Example 1: Evolution Visualizer

**BEFORE**:
```javascript
// In EvolutionRegistry.js
const overlayMesh = new THREE.Mesh(geometry, material);
overlayMesh.renderOrder = 60;  // Hardcoded, priority unclear
```

**AFTER**:
```javascript
// In EvolutionRegistry.js
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';

const overlayMesh = new THREE.Mesh(geometry, material);
overlayMesh.renderOrder = VisualHierarchyRegistry?.getRenderOrder('EVOLUTION', 50) ?? 50;
overlayMesh.userData.visualLayer = 'EVOLUTION';
```

**Benefit**: Now it's obvious this is part of the visual hierarchy, and renderOrder is consistent across all evolution visuals.

---

### Example 2: Link Aura

**BEFORE**:
```javascript
// In LinkAuraSystem_v1.js
const auraMesh = new THREE.Mesh(geom, mat);
auraMesh.renderOrder = undefined;  // Oops, no renderOrder set!
```

**AFTER**:
```javascript
// In LinkAuraSystem_v1.js
import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';

const auraMesh = new THREE.Mesh(geom, mat);
// Link auras are similar to evolution effects, so use EVOLUTION layer
auraMesh.renderOrder = VisualHierarchyRegistry?.getRenderOrder('EVOLUTION', 50) ?? 50;
auraMesh.userData.visualLayer = 'EVOLUTION';
```

**Benefit**: Link auras now render in correct priority, consistent with other overlays.

---

## ⚡ PERFORMANCE IMPACT

**Cost**: ~0.001ms per query (negligible)

```javascript
// This is very cheap:
VisualHierarchyRegistry.getRenderOrder('EVOLUTION', 50);  // ← Object lookup, ~0.001ms

// Safe for per-frame operations (but typically called at mesh creation, not per-frame)
```

---

## ✅ SAFETY GUARANTEES

1. **Falls back gracefully** — If registry unavailable, uses hardcoded fallback
2. **No crashes** — All queries check for null/undefined
3. **No breaking changes** — Existing code continues to work
4. **Zero config** — No initialization needed, uses immutable constants
5. **Backward compatible** — Old code without registry still works

---

## 🐛 DEBUGGING

### Print visual hierarchy

```javascript
// In browser console:
window.printVisualHierarchy();

// Output:
// [VisualHierarchyRegistry] Visual Layer Hierarchy
//   1. [RO=-1]   AURA              — Aura / Halo
//   2. [RO=0]    CORE              — Core Geometry
//   3. [RO=1]    ARCHETYPE         — Archetype / Extreme
//   4. [RO=50]   EVOLUTION         — Evolution Visual
//   5. [RO=100]  FX                — Effects
//   6. [RO=200]  DEBUG             — Debug / Legacy
```

### Check a mesh's visual layer

```javascript
// In browser console:
console.log(scene.getObjectByName('myNode').children[0].userData.visualLayer);
// Output: "AURA"
```

### Verify renderOrder is correct

```javascript
// In browser console:
const layer = VisualHierarchyRegistry.getLayer('EVOLUTION');
console.log('Expected RO:', layer.renderOrder);  // 50
console.log('Actual RO:', myMesh.renderOrder);    // 50 ✓
```

---

## 📋 SYSTEMS READY FOR INTEGRATION

**Already Integrated** ✅:
1. EnhancedNodeModels.js — CORE, ARCHETYPE layers (Input Node 0 proof of concept)
2. NodeAuraSystem_v1.js — AURA layer

**Ready for Next Integration** ⏳:
3. EvolutionRegistry / evolution visuals — EVOLUTION layer
4. LinkAuraSystem / link effects — EVOLUTION or FX layer
5. Ritual effects — FX layer

**Process**:
1. Find mesh creation code
2. Add `import { VisualHierarchyRegistry }...` at top
3. Replace hardcoded renderOrder with query
4. Add userData.visualLayer for debugging
5. Test (should look identical; just renderOrder now canonical)

---

## ⚠️ COMMON MISTAKES & FIXES

### ❌ Mistake 1: Forgetting fallback

```javascript
// WRONG: Will crash if registry unavailable
mesh.renderOrder = VisualHierarchyRegistry.getRenderOrder('EVOLUTION');
```

```javascript
// CORRECT: Safe fallback
mesh.renderOrder = VisualHierarchyRegistry?.getRenderOrder('EVOLUTION', 50) ?? 50;
```

### ❌ Mistake 2: Querying but not using

```javascript
// WRONG: Query executed but result ignored
VisualHierarchyRegistry.getRenderOrder('EVOLUTION', 50);
mesh.renderOrder = 50;  // ← Still hardcoded!
```

```javascript
// CORRECT: Use the query result
mesh.renderOrder = VisualHierarchyRegistry?.getRenderOrder('EVOLUTION', 50) ?? 50;
```

### ❌ Mistake 3: Wrong layer name

```javascript
// WRONG: Layer doesn't exist
mesh.renderOrder = VisualHierarchyRegistry.getRenderOrder('EXTREME', 50);
```

```javascript
// CORRECT: Use canonical layer name
mesh.renderOrder = VisualHierarchyRegistry.getRenderOrder('EVOLUTION', 50);
```

**Tip**: Check layer names in registry constant list: `LAYER_AURA`, `LAYER_CORE`, `LAYER_EVOLUTION`, etc.

---

## 🎓 LEARNING PATH

**For Casual Developers**:
1. Read this document (5 min)
2. Run `window.printVisualHierarchy()` in console to see stack
3. Next time you create a mesh: add 1 line with registry query
4. Done!

**For System Integrators**:
1. Read full guide: `/VISUAL_HIERARCHY_REGISTRY_GUIDE.md`
2. Examine proof of concept: `EnhancedNodeModels.js` input node, `NodeAuraSystem_v1.js` aura
3. Pick next system to integrate (evolution, link aura, ritual effects)
4. Follow pattern: import → query → apply → test
5. Submit PR with 3–5 affected systems

**For Architecture Review**:
1. Read `/BRUTAL_NODE_VISUAL_SPAWN_AUDIT_SESSION21.md` (Rule 1 context)
2. Review registry design in `VisualHierarchyRegistry.js`
3. Verify proof of concept integrations
4. Plan remaining phases (Session 22–26)

---

## 📞 QUICK REFERENCE

**File**: `/VisualHierarchyRegistry.js`  
**Import**: `import { VisualHierarchyRegistry } from './VisualHierarchyRegistry.js';`  
**Main Method**: `VisualHierarchyRegistry.getRenderOrder(layerId, fallback)`  

**Example**:
```javascript
const order = VisualHierarchyRegistry?.getRenderOrder('AURA', -1) ?? -1;
```

That's it! 🎉

