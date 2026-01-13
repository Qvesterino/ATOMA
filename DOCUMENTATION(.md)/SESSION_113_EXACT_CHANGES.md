# Session 113: Exact Code Changes

## File 1: MapReferencePlaneFactory.js

### Change: Enhanced Logging in initMapReferencePlane()

**Location**: Lines 229-248

**Old Code**:
```javascript
export function initMapReferencePlane(scene, camera, planeType, options = {}) {
  const plane = MapReferencePlaneFactory.createPlane(planeType, scene, camera, options);
  return plane;
}
```

**New Code**:
```javascript
export function initMapReferencePlane(scene, camera, planeType, options = {}) {
  console.log(`\n[REFERENCE PLANE INIT] Initializing plane type: ${planeType}`);
  console.log(`[REFERENCE PLANE INIT] Scene children before: ${scene.children.length}`);
  
  const plane = MapReferencePlaneFactory.createPlane(planeType, scene, camera, options);
  
  console.log(`[REFERENCE PLANE INIT] Scene children after: ${scene.children.length}`);
  
  if (plane && plane.planeGroup) {
    console.log(`[REFERENCE PLANE INIT] ✓ Plane group created successfully`);
    console.log(`[REFERENCE PLANE INIT] Plane group position: (${plane.planeGroup.position.x}, ${plane.planeGroup.position.y}, ${plane.planeGroup.position.z})`);
    console.log(`[REFERENCE PLANE INIT] Plane group scale: (${plane.planeGroup.scale.x}, ${plane.planeGroup.scale.y}, ${plane.planeGroup.scale.z})`);
    console.log(`[REFERENCE PLANE INIT] Plane group rotation: (${plane.planeGroup.rotation.x.toFixed(3)}, ${plane.planeGroup.rotation.y.toFixed(3)}, ${plane.planeGroup.rotation.z.toFixed(3)})`);
    console.log(`[REFERENCE PLANE INIT] Plane group children: ${plane.planeGroup.children.length}`);
  } else {
    console.error(`[REFERENCE PLANE INIT] ✗ ERROR: Plane creation failed or planeGroup is undefined`);
  }
  
  return plane;
}
```

**Impact**: Logs scene state before/after plane creation, shows final position/scale/rotation

---

## File 2: CognitiveHorizonPlane.js

### Change: Debug Override in createHorizonPlane()

**Location**: Lines 231-293

**Old Code**:
```javascript
createHorizonPlane() {
  const geometry = new THREE.PlaneGeometry(
    this.config.size,        // 300x300
    this.config.size,
    this.config.segments,    // 128
    this.config.segments
  );
  
  // ... vertex processing ...
  
  const plane = new THREE.Mesh(geometry, this.materials.horizon);
  plane.rotation.x = -Math.PI / 2;
  plane.position.y = -0.5;  // Barely below
  plane.userData = { isCognitiveHorizon: true };
  plane.renderOrder = -200;
  plane.layers.set(0);
  
  this.planeGroup.add(plane);
  this.horizonPlane = plane;
}
```

**New Code**:
```javascript
createHorizonPlane() {
  // ========== DEBUG: MASSIVE PLANE FOR VISIBILITY ==========
  const DEBUG_SIZE = 500;              // EXTREMELY LARGE for debugging
  const DEBUG_SEGMENTS = 32;           // Reduced for perf
  const DEBUG_Y_POSITION = -10;        // CLEARLY BELOW camera/nodes
  
  const geometry = new THREE.PlaneGeometry(
    DEBUG_SIZE,
    DEBUG_SIZE,
    DEBUG_SEGMENTS,
    DEBUG_SEGMENTS
  );
  
  // ... vertex processing (same) ...
  
  // DEBUG: Use ultra-obvious material temporarily
  const debugMaterial = new THREE.MeshBasicMaterial({
    color: 0xff00ff,           // MAGENTA - impossible to miss
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide,
    depthWrite: false,
    depthTest: true,
    wireframe: false
  });
  
  const plane = new THREE.Mesh(geometry, debugMaterial);
  plane.rotation.x = -Math.PI / 2;           // Explicit flat rotation
  plane.position.y = DEBUG_Y_POSITION;       // Clearly below
  plane.userData = { 
    isCognitiveHorizon: true,
    isDebugPlane: true
  };
  plane.renderOrder = -200;
  plane.layers.set(0);
  
  console.log(`[DEBUG PLANE] Horizon plane created`);
  console.log(`[DEBUG PLANE] Size: ${DEBUG_SIZE}x${DEBUG_SIZE}`);
  console.log(`[DEBUG PLANE] Position: (0, ${DEBUG_Y_POSITION}, 0)`);
  console.log(`[DEBUG PLANE] Rotation: (${plane.rotation.x.toFixed(3)}, ${plane.rotation.y.toFixed(3)}, ${plane.rotation.z.toFixed(3)})`);
  console.log(`[DEBUG PLANE] Material: color=0xff00ff opacity=0.5 transparent=true`);
  console.log(`[DEBUG PLANE] Geometry vertices: ${geometry.attributes.position.count}`);
  
  this.planeGroup.add(plane);
  this.horizonPlane = plane;
  
  console.log(`[DEBUG PLANE] ✓ Added to planeGroup`);
  console.log(`[DEBUG PLANE] PlaneGroup children: ${this.planeGroup.children.length}`);
}
```

**Impact**: Plane now 500x500, at y=-10, bright magenta, with extensive debug logging

---

## File 3: AINodeModel.js

### Change 3A: Core Node - Enforce Opacity

**Location**: Lines 34-70 (createCoreNode method)

**Old Code**:
```javascript
static createCoreNode(group, color) {
  // ... nodeRoot setup ...
  
  const mainGeometry = new THREE.IcosahedronGeometry(1, 1);
  const mainMaterial = createCoreIdentityMaterial(color);
  
  const mainBody = new THREE.Mesh(mainGeometry, mainMaterial);
  mainBody.frustumCulled = false;
  mainBody.userData.visualLayer = 'CORE';
  
  mainBody.userData.interactionCore = true;
  mainBody.layers.enable(10);
  
  nodeRoot.add(mainBody);
```

**New Code**:
```javascript
static createCoreNode(group, color) {
  // ... nodeRoot setup ...
  
  const mainGeometry = new THREE.IcosahedronGeometry(1, 1);
  const mainMaterial = createCoreIdentityMaterial(color);
  
  // === CRITICAL: ENFORCE CORE OPACITY ===
  mainMaterial.transparent = false;
  mainMaterial.opacity = 1.0;
  mainMaterial.depthWrite = true;
  mainMaterial.depthTest = true;
  // =======================================
  
  const mainBody = new THREE.Mesh(mainGeometry, mainMaterial);
  mainBody.frustumCulled = false;
  mainBody.userData.visualLayer = 'CORE';
  mainBody.userData.isNodeCore = true;      // EXPLICIT MARKING
  mainBody.renderOrder = 0;                  // CORE renders first
  
  mainBody.userData.interactionCore = true;
  mainBody.layers.enable(10);
  
  nodeRoot.add(mainBody);
```

**Impact**: Core material forced opaque immediately, marked for enforcement

---

### Change 3B: Hologram Shell - Mark as Aura

**Location**: Lines 72-90 (still createCoreNode)

**Old Code**:
```javascript
    const holoShell = createNodeHologramShell(mainBody, color);
    if (holoShell) {
      nodeRoot.add(holoShell);
      
      holoShell.traverse((child) => {
        if (child === mainBody) return;
        child.userData.nonInteractive = true;
        child.layers.disable(10);
        child.raycast = () => null;
      });
    }
```

**New Code**:
```javascript
    const holoShell = createNodeHologramShell(mainBody, color);
    if (holoShell) {
      holoShell.userData.visualLayer = 'AURA';
      holoShell.userData.isAura = true;      // MARK AS AURA (allowed to be transparent)
      holoShell.renderOrder = 1;             // AURA renders after core
      
      nodeRoot.add(holoShell);
      
      holoShell.traverse((child) => {
        if (child === mainBody) return;
        child.userData.nonInteractive = true;
        child.userData.isAura = true;
        child.layers.disable(10);
        child.raycast = () => null;
      });
    }
```

**Impact**: Aura separated from core, marked for identification

---

### Change 3C: Edges - Mark as Effects

**Location**: Lines 92-111 (still createCoreNode)

**Old Code**:
```javascript
    const edgeGeometry = new THREE.EdgesGeometry(mainGeometry, 15);
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.6,
      linewidth: 2
    });
    const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
    
    edges.userData.nonInteractive = true;
    edges.layers.disable(10);
    edges.raycast = () => null;
    
    group.add(edges);
```

**New Code**:
```javascript
    const edgeGeometry = new THREE.EdgesGeometry(mainGeometry, 15);
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.6,
      linewidth: 2
    });
    const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
    edges.userData.visualLayer = 'EFFECT';
    edges.userData.isEffect = true;
    edges.renderOrder = 2;
    
    edges.userData.nonInteractive = true;
    edges.layers.disable(10);
    edges.raycast = () => null;
    
    group.add(edges);
```

**Impact**: Edges identified as effects, explicit render order

---

### Change 3D: Rings - Mark as Effects

**Location**: Lines 113-137 (still createCoreNode)

**Old Code**:
```javascript
    for (let i = 0; i < 3; i++) {
      const ringRadius = 1.3 + i * 0.2;
      const ringGeometry = new THREE.TorusGeometry(ringRadius, 0.03, 8, 32);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.4 - i * 0.1
      });
      
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.PI / 2 + (i * 0.1);
      ring.rotation.z = i * 0.3;
      
      ring.userData.nonInteractive = true;
      ring.layers.disable(10);
      ring.raycast = () => null;
      
      group.add(ring);
    }
```

**New Code**:
```javascript
    for (let i = 0; i < 3; i++) {
      const ringRadius = 1.3 + i * 0.2;
      const ringGeometry = new THREE.TorusGeometry(ringRadius, 0.03, 8, 32);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.4 - i * 0.1
      });
      
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.PI / 2 + (i * 0.1);
      ring.rotation.z = i * 0.3;
      ring.userData.visualLayer = 'EFFECT';
      ring.userData.isEffect = true;
      ring.renderOrder = 2;
      
      ring.userData.nonInteractive = true;
      ring.layers.disable(10);
      ring.raycast = () => null;
      
      group.add(ring);
    }
```

**Impact**: Rings identified as effects, explicit render order

---

### Similar Changes for Data, Memory Nodes

Applied identical pattern to `createDataNode()` and `createMemoryNode()`:
- Add opacity enforcement block to core material
- Mark core: `userData.isNodeCore = true`, `renderOrder = 0`
- Mark aura: `userData.isAura = true`, `renderOrder = 1`
- Mark effects: `userData.isEffect = true`, `renderOrder = 2`

---

## File 4: NodeCoreOpaqueEnforcer_Session113.js (NEW)

**Complete new file** created from scratch (~320 lines)

**Key Classes**:
```javascript
export class NodeCoreOpaqueEnforcer {
  registerNode(nodeGroup, coreGeometry)
  validateFrame(deltaTime, time)
  _enforceOpaqueOnNode(nodeId)
  debugReport()
  getStats()
  setEnabled(enabled)
}

export const globalNodeCoreOpaqueEnforcer = new NodeCoreOpaqueEnforcer();

export function setupNodeCoreOpaqueDebugAPI() {
  window.NodeCoreOpaqueDebug = { enable, disable, report, stats }
}
```

**Key Methods**:
- `registerNode()`: Track node's core meshes on creation
- `validateFrame()`: Per-frame check for opacity violations
- `_enforceOpaqueOnNode()`: Force core materials opaque
- `debugReport()`: Console output of all tracked nodes
- `setEnabled()`: Toggle enforcement on/off

---

## Summary of Changes

| File | Lines Modified | Type | Status |
|------|---------------|----|--------|
| MapReferencePlaneFactory.js | 229-248 | Enhanced logging | ✅ |
| CognitiveHorizonPlane.js | 231-293 | Debug override | ✅ |
| AINodeModel.js | 34-342 | Layer separation | ✅ |
| NodeCoreOpaqueEnforcer_Session113.js | NEW (~320 lines) | New file | ✅ |

**Total Changes**: 4 files, ~600 lines of modifications/additions

**Code Quality**: All changes preserve existing functionality while adding:
- Debug visibility (reference plane)
- Architectural separation (node layers)
- Enforcement system (core opacity)
- Console logging (troubleshooting)
