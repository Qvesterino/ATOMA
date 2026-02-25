# ATOMA – STATIC CODE AUDIT
## PHASE: RAYCAST TARGET SOURCE ANALYSIS

**Audit Date:** 2026-02-15  
**Scope:** All `raycaster.intersectObjects()` calls and their target sources  
**Mode:** STRICTLY STATIC ANALYSIS (No code execution)

---

# EXECUTIVE SUMMARY

**Key Finding:** ATOMA uses **multiple parallel raycast target systems** with **no centralized authority**. Different systems build target collections independently using different strategies, creating architectural fragility.

**Target Systems Identified:**
1. **HitProxy Registry** – Dedicated hit-proxy system (window.hitProxySystem)
2. **RaycastTargetRegistry** – Global whitelist registry (static class)
3. **Ad-hoc Scene Traversal** – Dynamic per-frame collection (NodeLinkingSystem)
4. **Global Scene Traversal** – Direct scene.children access (AINodes)
5. **Local Node Arrays** – Encapsulated node collections (NodeEditor)

**Risk Level:** HIGH – No single source of truth, multiple unstable patterns, world switch vulnerabilities.

---

# SECTION 1 — TARGET SOURCE MAP

| File | Line | Target Variable | Built Where | Includes | Risk Level | Why |
|------|------|-----------------|--------------|-----------|-------------|-----|
| **NodeLinkingSystem.js** | ~4000 | `coreMeshes` | `getNodeAtPosition()` – Loop over `this.aiNodes.nodes` | Core meshes only (userData.isNodeCore or first visible mesh) | LOW | Explicit core targeting, filtered by visible/non-aura flags |
| **NodeLinkingSystem.js** | ~4030 | `boundedProxies` | `_getNodeAtPositionFromProxies()` → `window.hitProxySystem.registry.getAllProxies()` | Hit-proxy meshes (filtered by `_filterNodeTargetingProxies`) | MED | Dependent on global proxy registry, bounds-checked |
| **NodeLinkingSystem.js** | ~4070 | `nodeMeshes` | `_getNodeAtPositionDirect()` – Loop over `this.aiNodes.nodes` and traverse | ALL visible meshes in node hierarchy | HIGH | Debug fallback mode, includes visual-only objects |
| **NodeLinkingSystem.js** | ~4090 | `candidateMeshes` | `updateCrosshairNodeTargeting()` → `window.hitProxySystem.registry.getAllProxies()` → `_filterRaycastCandidates()` | Hit-proxy meshes (bounds + screen-space filtered) | MED | Proxy system dependency, per-frame filtering |
| **NodeInspectOverlay3_0.js** | ~140 | `allObjects` | `onMouseClick()` – `this.scene.traverse()` collecting `obj.userData.category` | ALL scene objects with userData.category | **HIGH** | Full scene traversal, no filtering, includes visual-only |
| **NodeEditor.js** | ~310 | `this.nodes.map(n => n.mesh)` | Constructor's internal `this.nodes` array | Editor's debug marker meshes only | LOW | Encapsulated, debug-only system |
| **NodeEditor.js** | ~330 | `this.nodes.map(n => n.mesh).filter(...)` | Constructor's internal `this.nodes` array | Editor's debug marker meshes (excluding link source) | LOW | Encapsulated, debug-only system |
| **NodeEditor.js** | ~380 | `this.links.map(l => l.curve.line)` | Constructor's internal `this.links` array | Link curve lines only | LOW | Encapsulated, link-only targets |
| **AINodes.js** | [Search result] | `this.scene.children` | Direct access to scene's children array | **ENTIRE SCENE** (recursive=true) | **CRITICAL** | Global scene traversal, no filtering, forbidden pattern |
| **_HitProxyIntegrationPatch.js** | ~120 | `this.__hitProxySystem.registry.getAllProxies()` | HitProxy system's registry | Registered hit-proxy meshes | LOW | Centralized proxy system (if active) |
| **_HitProxySystem_v1.js** | ~280 | `this._collectValidRaycastTargets()` | Internal collection method | Valid raycast targets from scene | MED | Internal proxy system, scene traversal with filtering |
| **_IntegrationNodeSelectionFix.js** | ~60 | `meshesToTest` | [Not visible in snippet – likely local array] | [Unknown] | MED | Unknown construction method |
| **SafeMobilityPack4.js** | ~100 | `RaycastSanitizationEngine.getInteractiveRaycastables(scene, true)` | RaycastSanitizationEngine's filtered scene traversal | Interactive raycastables (recursively filtered) | MED | Sanitization engine with recursive traversal |
| **RaycastSanitizationEngine_v1.js** | ~320 | `scene.children` | `getInteractiveRaycastables()` – `scene.traverse()` | Sanitized scene objects (filtered by visibility/geometry/bounds) | MED | Scene traversal with heavy filtering |

---

# SECTION 2 — REGISTRY USAGE

## 2.1 RaycastTargetRegistry (Static Class)

**File:** `RaycastTargetRegistry.js`  
**Status:** EXISTING BUT NOT INTEGRATED IN PRIMARY PATHS

**Purpose:** Canonical whitelist of raycast-safe meshes

**API:**
```javascript
RaycastTargetRegistry.register(mesh, nodeId)  // Register a mesh
RaycastTargetRegistry.get()                 // Get cached array of registered meshes
RaycastTargetRegistry.unregister(mesh)      // Remove a mesh
```

**Construction Method:**
- Private `#targets` Set holds registered meshes
- Private `#targetArray` provides cached array for raycasting
- `#dirty` flag triggers cache rebuild

**Metadata Applied:**
- `mesh.userData.raycastTarget = true`
- `mesh.userData.raycastTargetNodeId = nodeId`

**Actual Usage in Codebase:**
- **NOT USED** in `NodeLinkingSystem.js` (primary interaction system)
- **NOT USED** in `NodeInspectOverlay3_0.js`
- Referenced in documentation patterns only

**Assessment:** INACTIVE – Registry exists but is not wired to production raycast paths.

---

## 2.2 HitProxy System (window.hitProxySystem)

**Files:**
- `_HitProxySystem_v1.js`
- `_HitProxyIntegrationPatch.js`
- `HitProxyAutoRegistrar.js` (implied from search results)

**Status:** PARTIALLY ACTIVE

**Purpose:** Dedicated hit-proxy mesh system for reliable raycasting

**API:**
```javascript
window.hitProxySystem.registry.getAllProxies()  // Get all proxy meshes
window.hitProxySystem.raycast(raycaster, camera) // Perform raycast
```

**Construction Method:**
- Internal registry holds proxy meshes
- Proxies are dedicated collision meshes (not visual meshes)
- Auto-registration system (`HitProxyAutoRegistrar.js`)

**Gate Flag:** `window.HITPROXY_READY`
- Controls when proxy system is active
- Prevents raycasting during startup

**Actual Usage in Codebase:**
- **USED** in `NodeLinkingSystem.js` – Primary path via `window.hitProxySystem.registry.getAllProxies()`
- **USED** in `updateCrosshairNodeTargeting()` – Crosshair targeting
- **USED** in `_getNodeAtPositionFromProxies()` – Proxy-only selection
- **FALLBACK** to visual mesh raycasting when proxies unavailable

**Assessment:** SEMI-ACTIVE – Primary in NodeLinkingSystem, but has fallback paths that bypass it.

---

## 2.3 NodeLinkingSystem Internal Collections

**File:** `NodeLinkingSystem.js`

**Status:** ACTIVE – PRIMARY INTERACTION SYSTEM

**Collections:**

1. **`this.links`** – Array of active link objects
   - Built incrementally via `createLink()`
   - Persisted across frames
   - Used for link raycasting

2. **`this.aiNodes.nodes`** – External reference to AI nodes array
   - Traversed per-frame to build target arrays
   - NOT a cached collection
   - Rebuilt every raycast call

3. **Per-frame built arrays:**
   - `coreMeshes` – Built in `getNodeAtPosition()` via loop
   - `boundedProxies` – Built from `window.hitProxySystem.registry.getAllProxies()`
   - `nodeMeshes` – Built in `_getNodeAtPositionDirect()` via traversal
   - `candidateMeshes` – Built from proxies + filtering

**Stability:** UNSTABLE – Rebuilt per-frame, not cached, dependent on external state.

---

# SECTION 3 — SCENE-LEVEL USAGE

## 3.1 Forbidden Pattern: Direct Scene Traversal

### HIGH RISK: AINodes.js

**File:** `AINodes.js`  
**Line:** [Search result shows]  
**Code:**
```javascript
const intersects = raycaster.intersectObjects(this.scene.children, true);
```

**Analysis:**
- **Global scene traversal:** Uses `this.scene.children` directly
- **Recursive:** `true` parameter traverses entire scene hierarchy
- **No filtering:** Raycasts against ALL meshes (FX, auras, links, helpers)
- **Forbidden Pattern:** This is the exact pattern the RaycastTargetRegistry documentation warns against

**Risk Level:** CRITICAL

**Why Dangerous:**
1. Raycasts against visual-only objects (auras, particles, effects)
2. Hits FX meshes that may have invalid geometries
3. Hits link meshes (should use dedicated proxy system)
4. Performance impact (entire scene traversal)
5. No identity metadata guarantee

---

## 3.2 Scene Traversal with Filtering: NodeInspectOverlay3_0.js

**File:** `NodeInspectOverlay3_0.js`  
**Line:** ~140  
**Code:**
```javascript
// Find all nodes in scene
const allObjects = [];
this.scene.traverse((obj) => {
  if (obj.userData && obj.userData.category && obj !== this.scene) {
    allObjects.push(obj);
  }
});

// Get intersections
const intersects = this.raycaster.intersectObjects(allObjects);
const filtered = filterRaycastIntersections(intersects);
```

**Analysis:**
- **Global scene traversal:** Uses `this.scene.traverse()`
- **Filtering:** Checks `obj.userData.category` exists
- **Excludes scene root:** `obj !== this.scene`
- **Post-filter:** Uses `filterRaycastIntersections()` after raycast

**Risk Level:** HIGH

**Why Dangerous:**
1. Scene traversal is expensive (every click)
2. No explicit whitelist (any object with `userData.category` is a target)
3. Includes visual-only objects that have category metadata
4. Depends on post-raycast filtering (inefficient)
5. No guarantee of mesh validity or bounds

---

## 3.3 Scene Traversal with Heavy Filtering: RaycastSanitizationEngine_v1.js

**File:** `RaycastSanitizationEngine_v1.js`  
**Line:** ~320  
**Code:**
```javascript
static getInteractiveRaycastables(scene, options = {}) {
  const {
    includeInvisible = false,
    minimalCheck = false
  } = options;

  const raycastables = [];

  scene.traverse(obj => {
    // Skip non-meshes
    if (!obj.isMesh || !obj.geometry) return;

    // Skip if invisible
    if (!includeInvisible && !obj.visible) return;

    // Skip if raycast is disabled
    if (obj.raycast === this._RAYCAST_DISABLED) return;

    // Skip if marked as non-interactive
    if (obj.userData?.nonInteractive === true) return;

    // Minimal check: just verify geometry exists
    if (minimalCheck) {
      raycastables.push(obj);
      return
    }

    // Full check: verify bounding volumes exist
    const geo = obj.geometry;
    if (
      geo.boundingSphere !== null &&
      geo.boundingSphere !== undefined &&
      (geo.userData?.raycastSanitized === true || geo.boundingSphere.radius > 0)
    ) {
      raycastables.push(obj);
    }
  });

  return raycastables;
}
```

**Analysis:**
- **Global scene traversal:** Uses `scene.traverse()`
- **Heavy filtering:** Multiple checks (mesh, geometry, visible, raycast disabled, non-interactive, bounds)
- **Sanitization:** Requires `geo.userData.raycastSanitized === true`
- **Recursive:** `getInteractiveRaycastables(scene, true)` passes `recursive=true` to raycaster

**Risk Level:** MEDIUM

**Why Safer:**
1. Multiple filters reduce target set
2. Explicit raycast disabling via `_RAYCAST_DISABLED` marker
3. Geometry validation (boundingSphere check)
4. Sanitization flag requirement

**Still Risky:**
1. Scene traversal is still expensive
2. Per-frame rebuilding (no cache)
3. Dependent on correct metadata flags

---

# SECTION 4 — STABILITY ASSESSMENT

## 4.1 Per-Frame Rebuilding

**Systems that rebuild target arrays every frame:**

1. **NodeLinkingSystem.js**
   - `getNodeAtPosition()` – Rebuilds `coreMeshes` from `this.aiNodes.nodes`
   - `_getNodeAtPositionDirect()` – Rebuilds `nodeMeshes` from `this.aiNodes.nodes`
   - `updateCrosshairNodeTargeting()` – Rebuilds `candidateMeshes` from proxy registry
   - **Frequency:** Every mouse move, every click, every frame (crosshair)

2. **NodeInspectOverlay3_0.js**
   - `onMouseClick()` – Rebuilds `allObjects` via `scene.traverse()`
   - **Frequency:** Every click

3. **RaycastSanitizationEngine_v1.js**
   - `getInteractiveRaycastables()` – Rebuilds filtered array via `scene.traverse()`
   - **Frequency:** Every raycast call (caller-dependent)

**Stability:** LOW – High frequency rebuilding is expensive and error-prone.

---

## 4.2 World Switch Safety

**Gate Flags:**

1. **`window.HITPROXY_READY`**
   - **Purpose:** Prevent raycasting during startup
   - **Used in:** `NodeLinkingSystem.js` crosshair targeting
   - **Effect:** Disables raycasting until proxies are registered
   - **Assessment:** PARTIAL PROTECTION

2. **`this.worldReady`** (NodeLinkingSystem)
   - **Purpose:** Skip updates during world transitions
   - **Used in:** `update()` method
   - **Effect:** Skips link updates but NOT raycasting
   - **Assessment:** INADEQUATE

**World Switch Vulnerabilities:**

1. **Proxy Registry Cleared:**
   - `window.hitProxySystem.registry` is cleared on world reset
   - Raycasting during reset period falls back to visual mesh paths
   - **Risk:** Visual-only objects become targets

2. **No World Switch Gate for Scene Traversal:**
   - `NodeInspectOverlay3_0.js` has no world switch check
   - `AINodes.js` scene traversal has no world switch check
   - **Risk:** Stale scene objects are raycast during transitions

3. **RaycastTargetRegistry.clear() Not Called:**
   - Registry has `clear()` method
   - No evidence it's called on world switch
   - **Risk:** Stale references remain in registry

**Stability Across World Switch:** POOR

---

## 4.3 Identity Metadata

**Systems with identity metadata:**

1. **RaycastTargetRegistry**
   - `mesh.userData.raycastTargetNodeId = nodeId`
   - **Status:** Not wired to production

2. **HitProxy System**
   - `proxy.userData.targetNodeId = nodeId`
   - **Status:** Active in NodeLinkingSystem

3. **NodeLinkingSystem Core Meshes**
   - `mesh.userData.isNodeCore = true`
   - `mesh.userData.nodeId` (from parent node)
   - **Status:** Active in per-frame building

**Systems without identity metadata:**

1. **NodeInspectOverlay3_0.js**
   - Relies on `obj.userData.category` only
   - No node ID guarantee

2. **AINodes.js**
   - Direct scene traversal
   - No metadata filtering

**Identity Coverage:** PARTIAL

---

# SECTION 5 — ARCHITECTURAL RISK SUMMARY

## 5.1 Centralized Registry Status

**Question:** Is there a centralized HitProxy registry?

**Answer:** YES, but **not universally adopted**.

- `RaycastTargetRegistry` exists as a canonical whitelist system
- `HitProxy` system exists as a dedicated collision mesh system
- **Primary system (NodeLinkingSystem) uses HitProxy**
- **Secondary systems (NodeInspectOverlay, AINodes) do NOT use either**
- **RaycastTargetRegistry is not integrated** anywhere in production code

**Risk:** Multiple systems building independent target collections = fragmentation.

---

## 5.2 Ad-Hoc vs Centralized

**Ad-Hoc Target Collection:** YES

Evidence:
- `NodeLinkingSystem.js` – Rebuilds `coreMeshes` per-frame from `this.aiNodes.nodes`
- `NodeInspectOverlay3_0.js` – Rebuilds `allObjects` per-click via `scene.traverse()`
- `AINodes.js` – Uses `scene.children` directly

**Centralized Target Collection:** PARTIAL

Evidence:
- `RaycastTargetRegistry` – Centralized but inactive
- `HitProxy` system – Centralized and partially active

**Assessment:** MIXED – Centralization exists but is not consistently adopted.

---

## 5.3 Forbidden Patterns Detected

| Pattern | File | Line | Risk | Status |
|----------|-------|-------|-------|--------|
| **Raycast directly against scene.children** | AINodes.js | [Search] | CRITICAL | **PRESENT** |
| **Raycast with recursive=true** | SafeMobilityPack4.js | ~100 | HIGH | PRESENT |
| **Scene traversal without whitelist** | NodeInspectOverlay3_0.js | ~140 | HIGH | PRESENT |
| **Inclusion of visual-only objects** | NodeLinkingSystem.js (debug mode) | ~4070 | HIGH | PRESENT |
| **No identity metadata on targets** | AINodes.js | [Search] | CRITICAL | PRESENT |

---

## 5.4 Target List Mutations During Iteration

**Status:** NOT DETECTED in code inspection

**Analysis:**
- All target arrays are built BEFORE raycasting
- No mutations occur during iteration
- Arrays are rebuilt fresh each time

**Assessment:** SAFE on this dimension.

---

## 5.5 Filtering Strategies

### userData Flag Filtering

**Used in:**
- `NodeLinkingSystem.js` – Checks `userData.isNodeCore`, `userData.isAura`, `userData.isShell`, etc.
- `RaycastSanitizationEngine_v1.js` – Checks `userData.nonInteractive`
- `NodeInspectOverlay3_0.js` – Checks `userData.category`

**Assessment:** INCONSISTENT – Different systems check different flags.

### object.name Heuristics

**Used in:**
- `NodeLinkingSystem.js` – Checks `child.userData` only (no name heuristics)
- `RaycastSanitizationEngine_v1.js` – No name heuristics

**Assessment:** NOT USED – Good (name-based filtering is fragile).

### Fallback Traversal to Parent Object

**Used in:**
- `NodeLinkingSystem.js` – YES – `findParentAINode()` traverses up hierarchy after raycast hit
- `NodeEditor.js` – YES – Traverses up from hit mesh to node object

**Assessment:** PRESENT – Required when raycast hits child meshes, not core node.

---

## 5.6 Architectural Vulnerabilities

### VULNERABILITY 1: No Single Source of Truth

**Problem:**
- Multiple independent target collection systems
- No canonical registry enforced
- Different systems use different strategies

**Impact:**
- Inconsistent behavior across interaction points
- Impossible to audit all raycast targets in one place
- World switch must coordinate multiple systems

**Risk Level:** HIGH

---

### VULNERABILITY 2: Global Scene Traversal in Production Code

**Problem:**
- `AINodes.js` uses `scene.children` with `recursive=true`
- `NodeInspectOverlay3_0.js` uses `scene.traverse()`
- No whitelist or explicit registration

**Impact:**
- Raycasts against ALL meshes (FX, auras, links, helpers)
- Performance degradation
- Crashes if invalid geometries are in scene
- Unintended targets (visual-only objects)

**Risk Level:** CRITICAL

---

### VULNERABILITY 3: Inactive Canonical Registry

**Problem:**
- `RaycastTargetRegistry` exists but is not wired
- Documentation says "MUST use this, never scene.children"
- Production code ignores it

**Impact:**
- False sense of safety (registry exists but unused)
- Technical debt (registry code not providing value)
- Future maintainers may assume registry is active

**Risk Level:** MEDIUM

---

### VULNERABILITY 4: World Switch Gaps

**Problem:**
- `window.HITPROXY_READY` gate exists but is partial
- `this.worldReady` skips updates but not raycasting
- No global "world switching" flag checked by all systems
- RaycastTargetRegistry.clear() not called

**Impact:**
- Stale targets during world transitions
- Fallback to unsafe raycast paths during reset
- Potential crashes from accessing destroyed objects

**Risk Level:** HIGH

---

### VULNERABILITY 5: Per-Frame Rebuilding

**Problem:**
- Most systems rebuild target arrays every frame
- No caching across frames
- Expensive scene traversals repeated

**Impact:**
- Performance overhead
- Unnecessary allocations (garbage collection pressure)
- Inconsistent results if node state changes mid-frame

**Risk Level:** MEDIUM

---

# RECOMMENDATIONS (FOR FUTURE REFACTORING)

> **NOTE:** This audit is strictly analytical. No refactors suggested here.
> The following recommendations are for future planning only.

## Priority 1: Eliminate Global Scene Traversal

- Remove `scene.children` and `scene.traverse()` from production raycast paths
- Enforce HitProxy or RaycastTargetRegistry usage
- Add linter rule to forbid `intersectObjects(scene.children, ...)`

## Priority 2: Centralize Target Collection

- Choose ONE registry system (HitProxy or RaycastTargetRegistry)
- Wire all systems to use it
- Deprecate ad-hoc collection methods

## Priority 3: World Switch Safety

- Add global `window.ATOMA_WORLD_SWITCHING` flag
- All raycasting systems must check this flag
- Clear registries on world reset
- Gate raycasting during transitions

## Priority 4: Identity Metadata

- Enforce `userData.nodeId` on all targetable meshes
- Add validation that targets have identity
- Fail fast on targets without metadata

## Priority 5: Caching Strategy

- Cache target arrays between frames
- Invalidate cache only when nodes added/removed
- Reduce scene traversal frequency

---

# CONCLUSION

ATOMA's raycast target architecture is **fragmented and inconsistent**. Multiple systems build target collections independently using different strategies, with only partial adoption of centralized registries. Critical forbidden patterns (direct scene traversal, recursive raycasting) exist in production code. World switch safety is incomplete, with stale targets possible during transitions.

**Overall Risk Level:** HIGH

**Key Issues:**
1. No single source of truth for raycast targets
2. Global scene traversal in production code
3. Inactive canonical registry
4. Incomplete world switch gating
5. Expensive per-frame rebuilding

**Stability Assessment:** POOR

**Architectural Health:** NEEDS CONSOLIDATION

---

**END OF AUDIT**