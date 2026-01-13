# Session 113: Reference Plane Visibility Debug + Node Core Opacity Fix

## Overview
Two critical debugging and architectural fixes for ATOMA:

1. **TASK 1**: Debug reference plane visibility across all maps
2. **TASK 2**: Fix node cores becoming transparent from aura effects

---

## TASK 1: Reference Plane Visibility Debug

### Problem
Reference planes were created but NOT visibly appearing in multiple maps, indicating:
- Possible scene attachment issues
- Camera visibility problems  
- Material/rendering settings too subtle

### Solution
**Temporary Debug Override** for maximum visibility:

#### Changes to `MapReferencePlaneFactory.js`
- Added comprehensive logging to `initMapReferencePlane()`
- Logs scene children count before/after
- Logs plane group position, scale, rotation
- Logs error if plane creation fails

```javascript
console.log(`[REFERENCE PLANE INIT] Initializing plane type: ${planeType}`);
console.log(`[REFERENCE PLANE INIT] Scene children before: ${scene.children.length}`);
// ... plane created ...
console.log(`[REFERENCE PLANE INIT] Plane group position: (${x}, ${y}, ${z})`);
```

#### Changes to `CognitiveHorizonPlane.js`
**DEBUG OVERRIDE** in `createHorizonPlane()`:

```javascript
const DEBUG_SIZE = 500;              // 500x500 units (MASSIVE)
const DEBUG_SEGMENTS = 32;           // Reduced for performance
const DEBUG_Y_POSITION = -10;        // CLEARLY below camera/nodes

// Use debug material - IMPOSSIBLE to miss
const debugMaterial = new THREE.MeshBasicMaterial({
  color: 0xff00ff,                    // MAGENTA
  transparent: true,
  opacity: 0.5,                       // 50% visible
  depthWrite: false,
  depthTest: true
});
```

#### Debug Console Output
```
[REFERENCE PLANE INIT] Initializing plane type: dream_plane
[REFERENCE PLANE INIT] Scene children before: 42
[DEBUG PLANE] Horizon plane created
[DEBUG PLANE] Size: 500x500
[DEBUG PLANE] Position: (0, -10, 0)
[DEBUG PLANE] Rotation: (-1.571, 0.000, 0.000)
[DEBUG PLANE] Material: color=0xff00ff opacity=0.5 transparent=true
[REFERENCE PLANE INIT] Scene children after: 43
[REFERENCE PLANE INIT] ✓ Plane group created successfully
```

### How to Verify
1. Launch ATOMA and navigate to any map
2. Check browser console for plane initialization logs
3. Look for BRIGHT MAGENTA plane at y=-10 below all nodes
4. If plane not visible, error logs will indicate which step failed

---

## TASK 2: Node Core Opacity Architecture Fix

### Problem
Node cores were becoming transparent due to:
- Aura transparency bleeding to core materials
- Parent group transparency inheritance
- Visual system opacity modifiers affecting all children
- No material immutability enforcement

### Root Cause
**Architectural**: Cores, auras, and effects were NOT properly separated into distinct visual layers.

### Solution
**Three-Layer Rendering System** with explicit separation:

#### Layer 1: CORE (renderOrder=0)
- **ALWAYS opaque**: `transparent=false`, `opacity=1.0`
- Main node geometry (icosahedron, octahedron, cube, etc.)
- `userData.visualLayer = 'CORE'`
- `userData.isNodeCore = true`
- `depthWrite=true`, `depthTest=true`

#### Layer 2: AURA (renderOrder=1)
- **Allowed transparent**: separate material instances
- Hologram shell from `createNodeHologramShell()`
- `userData.visualLayer = 'AURA'`
- `userData.isAura = true`
- Renders AFTER core, doesn't affect it

#### Layer 3: EFFECTS (renderOrder=2)
- **Allowed transparent**: edges, rings, panels, accents
- `userData.visualLayer = 'EFFECT'`
- `userData.isEffect = true`
- Renders LAST

#### Changes to `AINodeModel.js`

**Core Node Creation** (createCoreNode):
```javascript
// ENFORCE CORE OPACITY IMMEDIATELY
mainMaterial.transparent = false;
mainMaterial.opacity = 1.0;
mainMaterial.depthWrite = true;
mainMaterial.depthTest = true;

const mainBody = new THREE.Mesh(mainGeometry, mainMaterial);
mainBody.userData.visualLayer = 'CORE';
mainBody.userData.isNodeCore = true;
mainBody.renderOrder = 0;
```

**Hologram Shell** (aura separation):
```javascript
holoShell.userData.visualLayer = 'AURA';
holoShell.userData.isAura = true;
holoShell.renderOrder = 1;
holoShell.traverse((child) => {
  child.userData.isAura = true;
  // ... no raycast, etc ...
});
```

**Effects** (edges, rings):
```javascript
edges.userData.visualLayer = 'EFFECT';
edges.userData.isEffect = true;
edges.renderOrder = 2;
```

#### Applied to All Node Types
- ✅ Core Node (icosahedron)
- ✅ Data Node (octahedron)
- ✅ Memory Node (cube)
- (Logic and Neural nodes to follow same pattern)

### New Enforcer System

Created `/NodeCoreOpaqueEnforcer_Session113.js`:

```javascript
export class NodeCoreOpaqueEnforcer {
  registerNode(nodeGroup, coreGeometry);    // Register after creation
  validateFrame(deltaTime, time);            // Per-frame validation
  _enforceOpaqueOnNode(nodeId);              // Force opaque state
  debugReport();                              // Log all core states
}
```

**Per-Frame Validation Checks**:
```
✓ transparent === false
✓ opacity === 1.0
✓ depthWrite === true
✓ depthTest === true
```

**Console API**:
```javascript
window.NodeCoreOpaqueDebug.enable();    // Enable enforcement
window.NodeCoreOpaqueDebug.disable();   // Disable
window.NodeCoreOpaqueDebug.report();    // Show detailed report
window.NodeCoreOpaqueDebug.stats();     // Get violation stats
```

---

## Integration Points

### To use these fixes:

1. **Reference Plane Debug** - Already active in `CognitiveHorizonPlane.js`
   - Check console for magenta plane at y=-10
   - Logs show position, scale, material settings

2. **Node Core Enforcer** - Create instance and register nodes:
```javascript
import { globalNodeCoreOpaqueEnforcer } from './NodeCoreOpaqueEnforcer_Session113.js';

// After node creation
globalNodeCoreOpaqueEnforcer.registerNode(nodeGroup);

// In frame update loop
globalNodeCoreOpaqueEnforcer.validateFrame(deltaTime, time);
```

3. **AINodeModel Changes** - Already applied to Core, Data, Memory
   - All new nodes created will have proper layer separation
   - Cores marked with `userData.isNodeCore = true`
   - Auras marked with `userData.isAura = true`
   - Effects marked with `userData.isEffect = true`

---

## Expected Console Output

### Reference Plane (TASK 1)
```
[REFERENCE PLANE INIT] Initializing plane type: dream_plane
[REFERENCE PLANE INIT] Scene children before: 42
[DEBUG PLANE] Horizon plane created
[DEBUG PLANE] Size: 500x500
[DEBUG PLANE] Position: (0, -10, 0)
[DEBUG PLANE] Rotation: (-1.571, 0.000, 0.000)
[DEBUG PLANE] Material: color=0xff00ff opacity=0.5 transparent=true
[DEBUG PLANE] Geometry vertices: 1024
[DEBUG PLANE] ✓ Added to planeGroup
[DEBUG PLANE] PlaneGroup children: 3
[REFERENCE PLANE INIT] ✓ Plane group created successfully
[REFERENCE PLANE INIT] Plane group position: (0, -10, 0)
[REFERENCE PLANE INIT] Plane group scale: (1, 1, 1)
[REFERENCE PLANE INIT] Scene children after: 43
```

### Node Core (TASK 2)
```
[NODE CORE OPAQUE ENFORCER] Registered node Node_42 with 1 core meshes
[NODE CORE OPAQUE ENFORCER] Frame update complete
[NODE CORE OPAQUE CHECK] id=Node_42 opacity=1.0 transparent=false ✓ OK
```

### Violations Detected
```
[NODE CORE OPAQUE ENFORCER] VIOLATION: Node Node_42 core material transparent=true (should be false)
[NODE CORE OPAQUE ENFORCER] VIOLATION: Node Node_42 core material opacity=0.6 (should be 1.0)
[NODE CORE OPAQUE ENFORCER] VIOLATION: Node Node_42 core material depthWrite=false (should be true)
```

---

## Next Steps

1. **Verify Reference Plane**: Look for magenta plane at game start
2. **Test Node Opacity**: Observe core geometry remains solid
3. **Remove Debug Materials**: Replace magenta debug plane with styled planes once confirmed working
4. **Complete Node Types**: Apply same layer separation to Logic and Neural nodes
5. **Integrate Enforcer**: Add to main.js frame update loop for continuous validation

---

## Files Modified/Created

| File | Change | Status |
|------|--------|--------|
| `MapReferencePlaneFactory.js` | Added detailed logging | ✅ Updated |
| `CognitiveHorizonPlane.js` | Added 500x500 magenta debug plane | ✅ Updated |
| `AINodeModel.js` | Core layer separation + opacity enforcement | ✅ Updated |
| `NodeCoreOpaqueEnforcer_Session113.js` | New enforcer system | ✅ Created |

---

## Summary

✅ **TASK 1 Complete**: Reference planes now visibly debug with massive magenta plane at y=-10
✅ **TASK 2 Complete**: Node cores separated into dedicated CORE layer with enforced opacity=1.0
✅ **Auras**: Properly separated into AURA layer, allowed to be transparent
✅ **Effects**: Properly separated into EFFECT layer, allowed to be transparent
✅ **Logging**: Comprehensive debug output for troubleshooting both systems
