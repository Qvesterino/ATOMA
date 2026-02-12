# RAYCAST-SYSTEM-FORENSIC-AUDIT REPORT
**ATOMA Project - Complete Node Interaction/Raycast Pipeline Analysis**

---

## EXECUTIVE SUMMARY

This report provides a complete static forensic audit of the node interaction/raycast pipeline in ATOMA. The analysis reveals a complex, fragmented architecture with multiple overlapping systems, redundant filtering layers, and numerous failure points.

**CRITICAL FINDINGS:**
- **7 distinct raycast filtering/filtering systems** operating simultaneously
- **15+ global kill switches** that can prevent node selection
- **3 different target collection strategies** with unclear priority
- **Multiple raycast integrity violations** (raycast = null, layer conflicts)
- **5 overlapping "authority" systems** that conflict with each other

---

## 1. PIPELINE LIFECYCLE MAP

```
USER INPUT → DOM EVENT → HANDLER → getNodeAtPosition → RAYCASTER CONFIG → TARGET COLLECTION → FILTERING → INTERSECTION → NODE RESOLUTION → SELECTION DISPATCH → GLYPH/LINKING SYSTEMS
```

### Step-by-Step Execution Chain:

#### 1. User Input → DOM Event
**File:** `NodeLinkingSystem.js`
**Functions:** 
- `handleMouseDown()` (lines ~1800-1850)
- `handleMouseUp()` (lines ~1850-1900)
- `handleMouseMove()` (lines ~1900-1950)

**Event Listeners:**
```javascript
this.renderer.domElement.addEventListener('mousedown', this.onMouseDown);
this.renderer.domElement.addEventListener('mousemove', this.onMouseMove);
this.renderer.domElement.addEventListener('mouseup', this.onMouseUp);
```

**Called from:** Main event system, attached to renderer DOM element
**When:** User mouse interaction
**Blocking conditions:** None (DOM events always fire)

---

#### 2. Handler → getNodeAtPosition
**File:** `NodeLinkingSystem.js`
**Function:** `getNodeAtPosition(clientX, clientY, callsite = 'unknown')` (lines ~2000-2150)

**Called from:**
- `handleMouseDown()` → RMB click for hover/crosshair
- `handleMouseUp()` → LMB/RMB click for selection/unlink
- `onClick()` → Click handler (lines ~1950-2000)

**When:** On mouse events (click, mousedown, mouseup)
**Blocking conditions:**
```javascript
// Guard 1: DOM safety check
if (typeof document === 'undefined' || !document.body) return null;

// Guard 2: Raycaster check
if (!this.raycaster) return null;

// Guard 3: Camera check
if (!this.camera) return null;
```

---

#### 3. Raycaster Configuration
**File:** `NodeLinkingSystem.js`
**Location:** `getNodeAtPosition()` function body

**When:** Every call to `getNodeAtPosition()`
**Blocking conditions:**
```javascript
// Raycaster might be null or undefined
this.raycaster.setFromCamera(mouse, this.camera); // Throws if camera null
```

**Layer Configuration:**
- Default: `raycaster.layers.enableAll()` (from `_IntegrationNodeSelectionFix.js`)
- BUT: Multiple systems override this

---

#### 4. Target Collection
**File:** `NodeLinkingSystem.js`
**Function:** `getNodeAtPosition()`

**THREE PATHS** (priority unclear):

**Path A - Direct Node Colliders:**
```javascript
const raycastTargets = [];
for (const node of aiNodes.nodes) {
  if (!this._nodeWithinTargetingBounds(node)) continue;
  const target = node.userData?.interactionCollider;
  if (target && target.isMesh) {
    raycastTargets.push(target);
  }
}
```

**Path B - Hit Proxies:**
```javascript
const boundedProxies = window.hitProxySystem?.registry?.getAllProxies();
```

**Path C - Direct Raycast (fallback):**
```javascript
// _getNodeAtPositionDirect() - emergency recovery path
const nodeColliders = aiNodes.nodes.map(n => n.userData?.interactionCollider || n);
```

**Called from:** `getNodeAtPosition()`
**When:** Every raycast request
**Blocking conditions:**
```javascript
// Path A: Interaction collider check
if (!node.userData?.interactionCollider) continue;
if (!node.userData?.interactionCollider.isMesh) continue;

// Path B: Hit proxy availability
if (!window.hitProxySystem) return [];
if (!window.hitProxySystem.registry) return [];

// Path C: Fallback only if A and B fail
```

---

#### 5. Filtering
**File:** `NodeLinkingSystem.js`
**Function:** `_applyInteractionIsolationFilter(intersections)`

**Multiple Overlapping Filters:**

**Filter 1 - Interaction Isolation:**
```javascript
const isolationFiltered = this._applyInteractionIsolationFilter(intersections);
```

**Filter 2 - CanonicalInteractionFilter:**
```javascript
import { filterRaycastIntersections } from './CanonicalInteractionFilter.js';
const filtered = filterRaycastIntersections(intersections);
```

**Filter 3 - Hard Interaction Authority:**
```javascript
// From HARD_INTERACTION_AUTHORITY_SYSTEM.js
// Checks: userData.isInteractionCore === true
```

**Called from:** After `raycaster.intersectObjects()`
**When:** Every raycast result
**Blocking conditions:**
```javascript
// Rejections:
if (mesh.userData.nonInteractive === true) // Filtered out
if (mesh.userData.isAura === true) // Filtered out
if (mesh.userData.isShell === true) // Filtered out
if (mesh.userData.isHologramShell === true) // Filtered out
if (mesh.userData.isFX === true) // Filtered out
if (mesh.userData.isParticle === true) // Filtered out
if (mesh.userData.isEffect === true) // Filtered out
if (mesh.userData.isGlyph === true) // Filtered out
if (mesh.userData.isLinkVisual === true) // Filtered out
if (mesh.userData.isLinkGlow === true) // Filtered out
if (mesh.userData.isNeuralCurve === true) // Filtered out
if (mesh.userData.isHarmonyField === true) // Filtered out
if (mesh.userData.isIntegrationField === true) // Filtered out
if (mesh.userData.visualLayer === 'AURA') // Filtered out
if (mesh.userData.visualLayer === 'SHELL') // Filtered out
if (mesh.userData.visualLayer === 'VISUAL_ONLY') // Filtered out

// Material-based rejection (fallback)
if (material.transparent === true &&
    material.blending === THREE.AdditiveBlending &&
    material.depthWrite === false) {
  // Filtered out
}
```

---

#### 6. Intersection
**File:** `NodeLinkingSystem.js`
**Function:** `raycaster.intersectObjects()`

**Called from:** `getNodeAtPosition()`
**When:** After target collection and raycaster setup
**Blocking conditions:**
```javascript
// Returns empty array if:
// - No valid targets
// - All targets filtered by layer
// - All targets have raycast = null
// - All targets outside ray bounds
```

---

#### 7. Node Resolution
**File:** `NodeLinkingSystem.js`
**Function:** `getNodeAtPosition()` return value

**Called from:** `handleMouseDown()`, `handleMouseUp()`, `onClick()`
**When:** After intersection filtering
**Blocking conditions:**
```javascript
// Node ID extraction failures:
const nodeId = intersection.object.userData.nodeId;
if (!nodeId) return null;

// Node lookup failures:
const node = aiNodes.nodes.find(n => n.userData.id === nodeId);
if (!node) return null;
```

---

#### 8. Selection Dispatch
**File:** `NodeLinkingSystem.js`
**Functions:**
- `selectNode(node)` (lines ~1500-1600)
- `deselectNode()` (lines ~1600-1650)

**Called from:** `handleMouseUp()`, `onClick()`
**When:** After successful node resolution
**Blocking conditions:**
```javascript
// Selection guards:
if (!this.enabled) return; // Main system disable
if (!node) return;

// Check for existing selection
if (this.selectedNode === node) return;
```

---

#### 9. Glyph/Linking Systems
**File:** `NodeLinkingSystem.js`
**Functions:**
- `createLink(sourceNode, targetNode)`
- Various linking hooks

**Called from:** After selection dispatch
**When:** On linking operations
**Blocking conditions:**
```javascript
if (!this.linkSource) return;
if (!this.linkTarget) return;
if (this.linkSource === this.linkTarget) return;
```

---

## 2. GLOBAL KILL SWITCHES

### HARD KILL SWITCHES (System-Stopping)

| # | Condition | File | Line (approx) | Severity | Default |
|---|-----------|------|---------------|----------|---------|
| 1 | `!this.enabled` | `NodeLinkingSystem.js` | Constructor | HARD | `true` |
| 2 | `!this.worldReady` | `NodeLinkingSystem.js` | `processNodeTargeting()`, `update()` | HARD | `true` (after init) |
| 3 | `!window.HITPROXY_READY` | `NodeLinkingSystem.js` | Crosshair targeting | HARD | `false` (until proxies created) |
| 4 | `!this.linkingSystem.isReady` | `main.js` | Update loop guard | HARD | `false` (until init) |
| 5 | `!this.raycaster` | `NodeLinkingSystem.js` | `getNodeAtPosition()` | HARD | `false` (throws error) |
| 6 | `!this.camera` | `NodeLinkingSystem.js` | `getNodeAtPosition()` | HARD | `false` (throws error) |

### SOFT KILL SWITCHES (Filtering)

| # | Condition | File | Line (approx) | Severity | Default |
|---|-----------|------|---------------|----------|---------|
| 7 | `mesh.userData.nonInteractive === true` | Multiple | Everywhere | SOFT | `false` |
| 8 | `mesh.userData.isAura === true` | Multiple | Everywhere | SOFT | `false` |
| 9 | `mesh.userData.isShell === true` | Multiple | Everywhere | SOFT | `false` |
| 10 | `mesh.userData.isHologramShell === true` | Multiple | Everywhere | SOFT | `false` |
| 11 | `mesh.userData.isFX === true` | Multiple | Everywhere | SOFT | `false` |
| 12 | `mesh.userData.isParticle === true` | Multiple | Everywhere | SOFT | `false` |
| 13 | `mesh.userData.isEffect === true` | Multiple | Everywhere | SOFT | `false` |
| 14 | `mesh.userData.isGlyph === true` | Multiple | Everywhere | SOFT | `false` |
| 15 | `mesh.userData.isLinkVisual === true` | Multiple | Everywhere | SOFT | `false` |
| 16 | `mesh.userData.isLinkGlow === true` | Multiple | Everywhere | SOFT | `false` |
| 17 | `mesh.userData.isNeuralCurve === true` | Multiple | Everywhere | SOFT | `false` |
| 18 | `mesh.userData.isHarmonyField === true` | Multiple | Everywhere | SOFT | `false` |
| 19 | `mesh.userData.isIntegrationField === true` | Multiple | Everywhere | SOFT | `false` |
| 20 | `mesh.userData.visualLayer === 'AURA'` | Multiple | Everywhere | SOFT | `false` |
| 21 | `mesh.userData.visualLayer === 'SHELL'` | Multiple | Everywhere | SOFT | `false` |
| 22 | `mesh.userData.visualLayer === 'VISUAL_ONLY'` | Multiple | Everywhere | SOFT | `false` |

### PERFORMANCE KILL SWITCHES

| # | Condition | File | Line (approx) | Severity | Default |
|---|-----------|------|---------------|----------|---------|
| 23 | `_nodeWithinTargetingBounds()` fails | `NodeLinkingSystem.js` | Target collection | PERFORMANCE | Depends on camera distance |
| 24 | FrameScheduler throttles update | `FrameScheduler.js` | Various | PERFORMANCE | System-specific |
| 25 | Empty `raycastTargets` array | `NodeLinkingSystem.js` | `getNodeAtPosition()` | PERFORMANCE | If no valid colliders |

### RAYCAST DISABLING (CRITICAL)

| # | Condition | File | Severity | Notes |
|---|-----------|------|----------|-------|
| 26 | `mesh.raycast = null` | `VisualInteractionIsolationPatch.js` (v1 - DEPRECATED) | CRITICAL | Causes THREE.js TypeError |
| 27 | `mesh.raycast = () => null` | `HARD_INTERACTION_AUTHORITY_SYSTEM.js` | CRITICAL | Intentional disable |
| 28 | `mesh.raycast = THREE.Mesh.prototype.raycast` | Multiple files | RESTORE | Used to fix raycast=null issues |

### LAYER-BASED KILLS

| # | Condition | File | Severity | Default |
|---|-----------|------|----------|---------|
| 29 | `mesh.layers.disable(10)` | Multiple | SOFT | Default layer 0, layer 10 for interaction |
| 30 | `raycaster.layers.set(10)` | Multiple | SOFT | Raycaster restricted to layer 10 only |

### VISIBILITY KILLS

| # | Condition | File | Severity | Notes |
|---|-----------|------|----------|-------|
| 31 | `mesh.visible = false` | Multiple | HARD | Standard Three.js behavior |
| 32 | `material.visible = false` | Multiple | HARD | Material-level visibility |
| 33 | `material.opacity = 0` | Hit proxies | SOFT | Used for invisible proxies |

---

## 3. TARGET SOURCE ANALYSIS

### Path A: Interaction Collider Array

**Source:** `NodeLinkingSystem.js` - `getNodeAtPosition()`

```javascript
const raycastTargets = [];
for (const node of aiNodes.nodes) {
  if (!this._nodeWithinTargetingBounds(node)) continue;
  const target = node.userData?.interactionCollider;
  if (target && target.isMesh) {
    raycastTargets.push(target);
  }
}
```

**Where Created:**
- Node spawn pipeline (see spawn docs)
- Stored in `node.userData.interactionCollider`

**When Populated:**
- During node spawn
- Must be explicitly set for each node

**Empty Behavior:**
- Returns empty array → no raycast hits possible

**nodeId Presence:**
- ✅ Preserves `node.userData.nodeId` if set on collider
- ❌ May be missing if collider created without nodeId

**Traversed:** No (direct array access)

**Exclusion Conditions:**
- `_nodeWithinTargetingBounds()` - distance/camera check
- `!target.isMesh` - must be Mesh type

**Target Source Reliability:** `MEDIUM` - depends on spawn pipeline setting interactionCollider correctly

---

### Path B: Hit Proxy Registry

**Source:** `_HitProxySystem_v1.js` - `HitProxyRegistry`

```javascript
getAllProxies() {
  return [...this.proxyMeshes];
}
```

**Where Created:**
- `HitProxyFactory.createProxySphere()` or `createProxyCube()` or `createProxyCapsule()`
- Automatically created for each node during `HitProxySystem.initialize()`

**When Populated:**
- System initialization: `setupHitProxySystem(scene, aiNodes, options)`
- Auto-registered during node spawn (if `autoHookSpawning` enabled)

**Empty Behavior:**
- Returns empty array → no raycast hits
- `window.HITPROXY_READY` remains `false`

**nodeId Presence:**
- ✅ Guaranteed: `proxy.userData.targetNodeId = nodeId` (explicitly set in registry)

**Traversed:** No (direct registry access)

**Exclusion Conditions:**
- System not initialized
- Proxies not created for some nodes
- Proxies disabled from interaction layer

**Target Source Reliability:** `HIGH` - explicit nodeId mapping, dedicated system

---

### Path C: Direct Visual Raycast (FALLBACK)

**Source:** `NodeLinkingSystem.js` - `_getNodeAtPositionDirect()`

```javascript
const nodeColliders = aiNodes.nodes.map(n => n.userData?.interactionCollider || n);
const intersects = this.raycaster.intersectObjects(nodeColliders, false);
```

**Where Created:**
- Uses existing node meshes directly
- Falls back to node group if no interactionCollider

**When Populated:**
- Always (all nodes have at least a group)

**Empty Behavior:**
- Never empty (unless no nodes exist)

**nodeId Presence:**
- ❌ UNRELIABLE: Depends on which mesh is hit
- May hit aura, shell, glyph, etc. → nodeId missing

**Traversed:** Yes (recursive = false, but still hits multiple mesh types)

**Exclusion Conditions:**
- All meshes must pass filtering layers
- Visual-only meshes will be filtered out

**Target Source Reliability:** `BROKEN` - hits any mesh, nodeId frequently missing

---

### Path D: Hit Proxy Redirecting Raycaster

**Source:** `_HitProxyIntegrationPatch.js`

```javascript
function createProxyRedirectingRaycaster(raycaster, hitProxySystem) {
  const originalIntersect = raycaster.intersectObjects.bind(raycaster);
  raycaster.intersectObjects = function(objects, recursive, optionalTarget) {
    // Always use hit-proxy system
    return hitProxySystem.raycast(raycaster, camera, hitProxySystem.registry.getAllProxies());
  };
}
```

**Where Created:**
- Patch applied to existing raycaster

**When Populated:**
- After patch application
- Uses hit proxy registry

**Empty Behavior:**
- Same as Path B

**nodeId Presence:**
- ✅ Guaranteed (inherits from Path B)

**Traversed:** No

**Exclusion Conditions:**
- Same as Path B
- Patch may not be applied

**Target Source Reliability:** `HIGH` (if patch applied)

---

### TARGET SOURCE CONFLICTS

**Problem:** Multiple systems can modify or replace `raycaster.intersectObjects()`:

1. `_HitProxyIntegrationPatch.js` - Redirects to proxies
2. `HARD_INTERACTION_AUTHORITY_SYSTEM.js` - Filters to interaction layer only
3. `CustomRaycastOverride.js` - Custom override logic
4. `RaycastSanitizationEngine_v1.js` - Safety wrapper
5. `RaycastTargetRegistry.js` - Registry-based targets

**Result:** Unpredictable behavior depending on which patch was applied last.

---

## 4. RAYCAST OBJECT INTEGRITY

### Raycast Function Modifications

| System | File | When Executed | Scope | Affects Core | Type |
|--------|------|---------------|-------|--------------|------|
| HitProxyFactory | `_HitProxySystem_v1.js` | On proxy creation | Proxy meshes only | NO | SET: `THREE.Mesh.prototype.raycast` |
| VisualInteractionIsolation v1 | `VisualInteractionIsolationPatch.js` (DEPRECATED) | On node processing | All node meshes | YES | SET: `null` (BREAKING) |
| VisualInteractionIsolation v2 | `VisualInteractionIsolationPatch_v2_CRITICAL_FIX.js` | On node processing | All node meshes | YES | RESTORE: `THREE.Mesh.prototype.raycast` |
| HardInteractionAuthority | `HARD_INTERACTION_AUTHORITY_SYSTEM.js` | On enforcement | All node meshes | YES | SET: `() => null` (for visuals) |
| HardInteractionAuthority | `HARD_INTERACTION_AUTHORITY_SYSTEM.js` | On enforcement | Core only | YES | DELETE: `raycast` property (for core) |

### Layer Modifications

| System | File | When Executed | Scope | Layer Value |
|--------|------|---------------|-------|-------------|
| HitProxyInteractionLayer | `_HitProxySystem_v1.js` | On proxy creation | Proxies only | Enable 10 |
| HitProxyInteractionLayer | `_HitProxySystem_v1.js` | On raycaster setup | Raycaster only | Set 10 |
| VisualInteractionIsolation v2 | `VisualInteractionIsolationPatch_v2_CRITICAL_FIX.js` | On node processing | Core mesh | Enable 10 |
| VisualInteractionIsolation v2 | `VisualInteractionIsolationPatch_v2_CRITICAL_FIX.js` | On node processing | Visual meshes | Disable 10 |
| HardInteractionAuthority | `HARD_INTERACTION_AUTHORITY_SYSTEM.js` | On enforcement | Core mesh | Enable 10 |
| HardInteractionAuthority | `HARD_INTERACTION_AUTHORITY_SYSTEM.js` | On enforcement | Visual meshes | Disable 10 |

### Visibility Modifications

| System | File | When Executed | Scope | Value |
|--------|------|---------------|-------|-------|
| HitProxyFactory | `_HitProxySystem_v1.js` | On proxy creation | Proxy meshes | `visible = false` |
| HitProxyFactory | `_HitProxySystem_v1.js` | On proxy creation | Proxy materials | `visible = false, opacity = 0` |
| VisualHierarchyCorrectionSystem | `_VisualHierarchyCorrectionSystem_v1.js` | Per frame | Various visual meshes | `visible = false` (if scaled) |
| VisualLayerEnforcementIntegrationHelpers | `VisualLayerEnforcementIntegrationHelpers.js` | On enforcement | Visual meshes | `visible = false` |

### userData Modifications

| System | File | Property | Set On | Purpose |
|--------|------|----------|--------|---------|
| HitProxyFactory | `_HitProxySystem_v1.js` | `isHitProxy` | Proxy meshes | Mark as proxy |
| HitProxyFactory | `_HitProxySystem_v1.js` | `__hitProxy` | Proxy meshes | Internal mark |
| HitProxyFactory | `_HitProxySystem_v1.js` | `__hardInvisibleProxy` | Proxy meshes | Enforce invisibility |
| HitProxyRegistry | `_HitProxySystem_v1.js` | `targetNodeId` | Proxy meshes | Node ID mapping |
| VisualInteractionIsolation v2 | `VisualInteractionIsolationPatch_v2_CRITICAL_FIX.js` | `nonInteractive` | Visual meshes | Block interaction |
| VisualInteractionIsolation v2 | `VisualInteractionIsolationPatch_v2_CRITICAL_FIX.js` | `isVisualOnly` | Visual meshes | Mark as visual |
| VisualInteractionIsolation v2 | `VisualInteractionIsolationPatch_v2_CRITICAL_FIX.js` | `isInteractionCore` | Core mesh | Mark as interactive |
| HardInteractionAuthority | `HARD_INTERACTION_AUTHORITY_SYSTEM.js` | `isInteractionCore` | Core mesh | Mark as interactive |
| HardInteractionAuthority | `HARD_INTERACTION_AUTHORITY_SYSTEM.js` | `nonInteractive` | Visual meshes | Block interaction |

---

## 5. IDENTITY CHAIN AUDIT

### Flow: Node.userData.nodeId → Interaction → Raycast → Resolution

```
NODE GROUP (userData.id)
    ↓
INTERACTION COLLIDER (userData.nodeId) [MAY BE MISSING]
    ↓
HIT PROXY (userData.targetNodeId) [IF USING PROXIES]
    ↓
RAYCAST INTERSECTION (object.userData.nodeId) [DETERMINES SUCCESS]
    ↓
NODE LOOKUP (find by nodeId) [FINAL RESOLUTION]
```

### Potential Identity Loss Points

**Point 1: Node Group → Interaction Collider**

**File:** Node spawn pipeline (see spawn docs)

**Identity Transfer:**
```javascript
// Expected:
interactionCollider.userData.nodeId = node.userData.id;
```

**Failure Modes:**
- Collider created without `userData.nodeId`
- Collision mesh is shared geometry (BufferGeometry)
- Node.userData.id vs nodeId inconsistency

**Status:** ⚠️ **UNVERIFIED** - depends on spawn pipeline

---

**Point 2: Node Group → Hit Proxy**

**File:** `_HitProxySystem_v1.js` - `HitProxyRegistry.registerProxy()`

**Identity Transfer:**
```javascript
proxyMesh.userData.targetNodeId = nodeId;
```

**Identity Resolution:**
```javascript
const getNodeIdentity = function(node) {
  if (!node) return null;
  const ud = node.userData || {};
  return ud.id || ud.nodeId || node.uuid || null;
};
```

**Failure Modes:**
- Node has neither `userData.id` nor `userData.nodeId`
- Falls back to `node.uuid` (not used for lookup)

**Status:** ✅ **ROBUST** - handles multiple ID sources

---

**Point 3: Interaction Collider → Raycast Intersection**

**File:** `NodeLinkingSystem.js` - `getNodeAtPosition()`

**Identity Transfer:**
```javascript
const nodeId = intersection.object.userData.nodeId;
```

**Failure Modes:**
- Collider missing `userData.nodeId`
- Raycast hits wrong mesh (visual, not collider)

**Status:** ⚠️ **FRAGILE** - depends on correct mesh being hit

---

**Point 4: Hit Proxy → Raycast Intersection**

**File:** `_HitProxySystem_v1.js` - `raycast()` method

**Identity Transfer:**
```javascript
return filtered.map(intersection => ({
  ...intersection,
  nodeId: intersection.object.userData.targetNodeId,
  proxyMesh: intersection.object
}));
```

**Status:** ✅ **GUARANTEED** - proxy always has targetNodeId

---

**Point 5: Intersection → Node Lookup**

**File:** `NodeLinkingSystem.js` - `getNodeAtPosition()`

**Identity Resolution:**
```javascript
const node = aiNodes.nodes.find(n => n.userData.id === nodeId);
```

**Failure Modes:**
- Node.userData.id vs nodeId mismatch
- Node removed from aiNodes.nodes array
- Node recreated with different ID

**Status:** ⚠️ **UNVERIFIED** - assumes consistent ID storage

---

### Critical Identity Inconsistencies Found

**Inconsistency 1:** `node.userData.id` vs `node.userData.nodeId`

- HitProxySystem checks both: `ud.id \|\| ud.nodeId`
- NodeLinkingSystem looks for: `node.userData.id`
- Spawn pipeline may use either

**Risk:** Node created with `nodeId` but lookup expects `id`

---

**Inconsistency 2:** Interaction Collider nodeId

- Expected: `interactionCollider.userData.nodeId = node.userData.id`
- Actual: **NOT VERIFIED** - spawn code not audited

**Risk:** Collider missing nodeId → null resolution

---

**Inconsistency 3:** Hit Proxy targetNodeId

- Set to: `node.userData.id \|\| node.userData.nodeId \|\| node.uuid`
- But lookup expects: `node.userData.id`

**Risk:** Proxy has different ID than expected by lookup

---

### Recommended Identity Chain

```
STANDARDIZE ON: node.userData.id
ENSURE: interactionCollider.userData.nodeId = node.userData.id
ENSURE: proxy.userData.targetNodeId = node.userData.id
LOOKUP: aiNodes.nodes.find(n => n.userData.id === nodeId)
```

---

## 6. SCHEDULER / LIFECYCLE RISKS

### FrameScheduler Gates

**File:** `FrameScheduler.js`

**Gating Methods:**
- `shouldRunVisual()` - Controls visual updates
- `shouldRunSimulation()` - Controls simulation updates
- `shouldRunBackground()` - Controls background tasks

**Systems Using FrameScheduler Gates:**
- `SynergyHighways1_0.js` - `if (!this.frameScheduler?.shouldRunVisual?.()) return;`
- `SynergyTravelingWaveFX_v1.js` - `if (!this.frameScheduler?.shouldRunVisual?.()) return;`
- `TopologyBiasVisualizationLayer.js` - `if (!this.frameScheduler?.shouldRunVisual?.()) return;`
- `VisualMetricModel_v1.js` - `if (!this.frameScheduler?.shouldRunVisual?.()) return;`
- `_RecursiveGlyphSignalSystem.js` - No explicit gate (uses enabled check)
- `_RareNodeSpawner.js` - `if (!this.frameScheduler?.shouldRunSimulation?.()) return;`
- `_NodeEvolution3_ExtremeSafe.js` - `if (!this.frameScheduler?.shouldRunVisual?.()) return;`
- `_MythicNodeCreation.js` - `if (!this.frameScheduler?.shouldRunSimulation?.()) return;`
- `_AtomaGlyphSystem3_0.js` - `if (!this.frameScheduler?.shouldRunVisual?.()) return;`
- `_AmbientEntityManager.js` - `if (!this.frameScheduler?.shouldRunBackground?.()) return;`

**Impact on Interaction:**
- **INDIRECT** - FrameScheduler does NOT gate interaction directly
- **RISK** - If proxies/visuals aren't updated, raycasts may fail silently

---

### Update Loop Timing

**File:** `main.js`

**Update Order:**
```javascript
(dt) => {
  if (this.linkingSystem && this.linkingSystem.isReady === true) {
    this.linkingSystem.update(dt, this.time);
  }
}
```

**Risk:** Interaction depends on `linkingSystem.update()` completing

---

### World Ready Gates

**File:** `NodeLinkingSystem.js`

**Method:** `setWorldReady(ready)`

**Gated Operations:**
```javascript
// [Audit 6.2] World not ready - skip update
if (!this.worldReady) {
  return;
}
```

**Locations:**
- `update()` - Main update loop
- `processNodeTargeting()` - Node targeting logic

**Impact:** **HARD** - All interaction blocked during world transitions

---

### HITPROXY_READY Gate

**File:** `NodeLinkingSystem.js`, `HitProxyAutoRegistrar.js`

**Condition:** `window.HITPROXY_READY`

**Gated Operations:**
- Crosshair targeting in `processNodeTargeting()`

**Set When:**
- `HitProxyAutoRegistrar.updateReadyGate()` called
- Proxies exist and are valid

**Impact:** **HARD** - Crosshair UI blocked until proxies ready

---

### Async Initialization Risks

**Hit Proxy System:**
- Async: No (synchronous initialization)
- Race: Possible if called before nodes spawned

**Visual Interaction Isolation:**
- Async: No (synchronous node processing)
- Race: Possible if called before spawn complete

**Node Spawning:**
- Async: **POSSIBLE** - some spawn systems async
- Race: Interaction collider may be missing

**Impact:** Interaction available before interaction colliders ready → clicks fail silently

---

### Lifecycle States Where Clicking Disabled

1. **World Reset**
   - `worldReady = false`
   - All interaction blocked

2. **System Initialization**
   - `linkingSystem.isReady = false`
   - Update loop blocked

3. **Hit Proxy Creation**
   - `HITPROXY_READY = false`
   - Crosshair targeting blocked

4. **System Disabled**
   - `linkingSystem.enabled = false`
   - All handlers return early

5. **Camera/Raycaster Missing**
   - `!this.camera` or `!this.raycaster`
   - `getNodeAtPosition()` returns null

6. **FrameScheduler Gating**
   - Indirect: proxies/visuals not updated
   - Raycasts may fail (outdated positions)

---

## 7. POLICY / SYSTEM CONFLICTS

### Overlapping Systems

#### Conflict 1: Raycast Filtering Duplication

**Systems Involved:**
1. `CanonicalInteractionFilter.js` - Centralized filter
2. `VisualInteractionIsolationPatch_v2_CRITICAL_FIX.js` - Node-level filtering
3. `HARD_INTERACTION_AUTHORITY_SYSTEM.js` - Enforcement filtering
4. `RaycastSanitizationEngine_v1.js` - Safety filtering

**Conflict:**
- All 4 systems filter on similar criteria (`nonInteractive`, `isAura`, etc.)
- No clear priority
- Filtering applied multiple times (wasted cycles)

**Resolution:** Choose one authoritative filter, remove others

---

#### Conflict 2: Layer Management

**Systems Involved:**
1. `HitProxyInteractionLayer` - Layer 10 for proxies
2. `VisualInteractionIsolationPatch_v2` - Layer 10 for cores, disable for visuals
3. `HARD_INTERACTION_AUTHORITY_SYSTEM.js` - Layer 10 for cores, disable for visuals
4. Post-processing systems - Layer 1 for bloom

**Conflict:**
- Multiple systems setting/disabling layer 10
- Order-dependent behavior
- No single source of truth for layer configuration

**Resolution:** Centralize layer management

---

#### Conflict 3: Raycast Function Overrides

**Systems Involved:**
1. `VisualInteractionIsolationPatch.js` (v1) - Sets `raycast = null` (DEPRECATED)
2. `VisualInteractionIsolationPatch_v2_CRITICAL_FIX.js` - Restores `THREE.Mesh.prototype.raycast`
3. `HARD_INTERACTION_AUTHORITY_SYSTEM.js` - Sets `raycast = () => null` or deletes property
4. `EnhancedNodeModels.js` - Ensures raycast is not null

**Conflict:**
- Multiple systems modifying the same property
- v1 patch still exists (deprecated)
- Unpredictable final state

**Resolution:** Remove all raycast function modifications, use layers/filtering only

---

#### Conflict 4: Target Collection Strategies

**Systems Involved:**
1. `NodeLinkingSystem.js` - Uses `interactionCollider` array
2. `_HitProxySystem_v1.js` - Uses proxy registry
3. `_HitProxyIntegrationPatch.js` - Overrides `intersectObjects()` to use proxies
4. `RaycastTargetRegistry.js` - Registry-based targets
5. `RaycastSanitizationEngine_v1.js` - Sanitized targets

**Conflict:**
- 5 different ways to collect raycast targets
- Unclear which is active at runtime
- Possible all active (wasted computation)

**Resolution:** Choose ONE target source strategy, remove others

---

#### Conflict 5: Node Identity

**Systems Involved:**
1. `AINodes.js` - Uses `userData.id`
2. `HitProxySystem` - Checks `userData.id || userData.nodeId`
3. `NodeLinkingSystem.js` - Looks for `userData.id`
4. Spawn pipeline (unverified) - May set either `id` or `nodeId`

**Conflict:**
- Inconsistent identity storage
- Different systems check different properties
- Silent failures when mismatched

**Resolution:** Standardize on ONE identity property

---

#### Conflict 6: Interaction Authority

**Systems Involved:**
1. `HARD_INTERACTION_AUTHORITY_SYSTEM.js` - Enforces interaction cores
2. `CoreVisualAuthoritySystem.js` - Visual authority
3. `HologramShellAuthoritySystem.js` - Shell authority
4. `VisualAuthority.js` - General visual authority

**Conflict:**
- Multiple "authority" systems
- Overlapping responsibilities
- Unclear which takes precedence

**Resolution:** Consolidate into single authority system

---

### System Map: Who Does What?

| System | Primary Responsibility | Secondary | Conflicts With |
|--------|----------------------|-----------|----------------|
| `HitProxySystem` | Create/manage proxy meshes | Sync proxy positions | VisualInteractionIsolation, HardInteractionAuthority |
| `VisualInteractionIsolationPatch_v2` | Mark visual meshes non-interactive | Find/create interaction cores | HitProxySystem, HardInteractionAuthority |
| `HardInteractionAuthoritySystem` | Enforce single interaction core per node | Layer management | VisualInteractionIsolationPatch_v2 |
| `CanonicalInteractionFilter` | Filter raycast results | None | VisualInteractionIsolationPatch_v2 (duplicate filtering) |
| `RaycastSanitizationEngine` | Safe target collection | Validation | All target collection systems |
| `RaycastTargetRegistry` | Registry of raycast targets | Target collection | NodeLinkingSystem, HitProxySystem |
| `HitProxyIntegrationPatch` | Override intersectObjects | None | All other target collection |
| `CoreVisualAuthoritySystem` | Manage visual state | Layer management | HardInteractionAuthoritySystem |

---

## 8. FAILURE MODES SUMMARY

### Top 5 Hard Blockers

| # | Failure Mode | Root Cause | Location | Severity |
|---|--------------|------------|----------|----------|
| 1 | `worldReady = false` | World transition/reset | `NodeLinkingSystem.js` | HARD |
| 2 | `HITPROXY_READY = false` | Proxies not created/ready | `NodeLinkingSystem.js` | HARD |
| 3 | `interactionCollider` missing on node | Spawn pipeline incomplete | Node spawn (unverified) | HARD |
| 4 | Raycast hits visual mesh (not collider) | Wrong target in raycast array | `NodeLinkingSystem.js` | HARD |
| 5 | `mesh.userData.nodeId` missing | Identity not set on collider | Node spawn (unverified) | HARD |

### Additional Failure Modes

| # | Failure Mode | Root Cause | Location | Severity |
|---|--------------|------------|----------|----------|
| 6 | Empty `raycastTargets` array | No valid colliders found | `NodeLinkingSystem.js` | HARD |
| 7 | All intersections filtered out | Over-aggressive filtering | Multiple filter systems | SOFT |
| 8 | Node lookup fails | ID mismatch (id vs nodeId) | `NodeLinkingSystem.js` | HARD |
| 9 | Layer 10 disabled on target | Visual layer disabled | Multiple systems | SOFT |
| 10 | `mesh.raycast = null` | Deprecated patch still active | `VisualInteractionIsolationPatch.js` (v1) | CRITICAL |
| 11 | Camera missing during raycast | Not initialized yet | `NodeLinkingSystem.js` | HARD |
| 12 | FrameScheduler blocks proxy update | Visuals out of sync | `FrameScheduler.js` | PERFORMANCE |
| 13 | Proxy position desync | Auto-sync disabled/throttled | `_HitProxySystem_v1.js` | SOFT |
| 14 | Hit proxy system not initialized | Setup not called | `_HitProxySystem_v1.js` | HARD |
| 15 | Interaction filter conflicts | Multiple filters applied | Multiple files | SOFT |

---

## 9. PURGE CANDIDATES

### Systems to Remove (SAFE TO REMOVE)

| # | System | Reason | Replacement |
|---|--------|--------|-------------|
| 1 | `VisualInteractionIsolationPatch.js` (v1) | Deprecated, sets `raycast = null` (breaking) | Use v2 |
| 2 | `_HitProxyIntegrationPatch.js` | Overrides `intersectObjects()`, unclear if active | Use HitProxySystem directly |
| 3 | `RaycastTargetRegistry.js` | Duplicate of HitProxyRegistry | Use HitProxySystem |
| 4 | `RaycastSanitizationEngine_v1.js` | Redundant validation | Remove validation, trust data |
| 5 | `CanonicalInteractionFilter.js` | Duplicate filtering (v2 already filters) | Use v2 filter |
| 6 | `HardInteractionAuthoritySystem.js` | Overlapping with VisualInteractionIsolation v2 | Use v2 only |
| 7 | `CoreVisualAuthoritySystem.js` | Overlapping authority | Consolidate |
| 8 | `HologramShellAuthoritySystem.js` | Overlapping authority | Consolidate |
| 9 | `VisualAuthority.js` | Overlapping authority | Consolidate |
| 10 | `VisualLayerEnforcementIntegrationHelpers.js` | Duplicate layer management | Consolidate |

### Systems to Keep (ESSENTIAL)

| # | System | Reason |
|---|--------|--------|
| 1 | `NodeLinkingSystem.js` | Core interaction logic |
| 2 | `AINodes.js` | Node management |
| 3 | `_HitProxySystem_v1.js` | Proxy-based raycasting |
| 4 | `VisualInteractionIsolationPatch_v2_CRITICAL_FIX.js` | Visual isolation (fixed) |
| 5 | `HitProxyAutoRegistrar.js` | Proxy lifecycle management |
| 6 | `FrameScheduler.js` | Performance gating |

### Systems to Audit (RISKY)

| # | System | Reason | Action Needed |
|---|--------|--------|---------------|
| 1 | Node spawn pipeline | Identity setting not verified | Ensure `userData.id` set correctly |
| 2 | `_NodeLinking2_3.js` | Alternative linking system | Integrate or remove |
| 3 | `CustomRaycastOverride.js` | Custom override logic | Verify if active |
| 4 | `_RecursiveGlyphSignalSystem.js` | May interact with selection | Verify integration |
| 5 | `_MythicRitualController.js` | Rituals may block interaction | Verify gating |

### Recommended Architecture (Simplified)

```
USER INPUT
  ↓
NodeLinkingSystem (handlers)
  ↓
getNodeAtPosition()
  ↓
HitProxySystem (targets via registry)
  ↓
Raycast (layer 10 only)
  ↓
VisualInteractionIsolation v2 (filter nonInteractive)
  ↓
Node lookup via userData.id
  ↓
Selection dispatch
```

---

## 10. FINAL OUTPUT

### Full Pipeline Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INPUT                                  │
│                    (mousedown/move/up)                           │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              DOM EVENT HANDLER                                   │
│        (handleMouseDown/Move/Up)                                 │
├─────────────────────────────────────────────────────────────────┤
│ Kill Switches:                                                    │
│   ❌ !this.enabled (NodeLinkingSystem)                           │
│   ❌ !this.worldReady (world transition)                         │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              getNodeAtPosition(clientX, clientY)                 │
├─────────────────────────────────────────────────────────────────┤
│ Kill Switches:                                                    │
│   ❌ !this.raycaster                                             │
│   ❌ !this.camera                                                │
│   ❌ !window.HITPROXY_READY (crosshair)                          │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              RAYCASTER CONFIGURATION                             │
├─────────────────────────────────────────────────────────────────┤
│   raycaster.setFromCamera(mouse, this.camera)                   │
│   raycaster.layers.set(10)  ← Layer 10 only                     │
│                                                                │
│ Conflicts:                                                        │
│   ⚠️  Multiple systems may override layers                      │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              TARGET COLLECTION (3 Paths)                         │
├─────────────────────────────────────────────────────────────────┤
│ Path A: Interaction Colliders (NodeLinkingSystem)                │
│   for (node of aiNodes.nodes) {                                  │
│     target = node.userData.interactionCollider                   │
│     if (target && target.isMesh) raycastTargets.push(target)     │
│   }                                                               │
│   Reliability: MEDIUM                                            │
│                                                                │
│ Path B: Hit Proxies (_HitProxySystem_v1.js)                     │
│   proxies = hitProxySystem.registry.getAllProxies()              │
│   Reliability: HIGH                                              │
│                                                                │
│ Path C: Direct Fallback (_getNodeAtPositionDirect)              │
│   nodeColliders = aiNodes.nodes.map(n => n.userData.collider || n)│
│   Reliability: BROKEN                                            │
│                                                                │
│ Kill Switches:                                                    │
│   ❌ _nodeWithinTargetingBounds() fails                           │
│   ❌ Empty raycastTargets array                                  │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              RAYCAST INTERSECTION                                 │
├─────────────────────────────────────────────────────────────────┤
│   intersects = raycaster.intersectObjects(raycastTargets, false) │
│                                                                │
│ Kill Switches:                                                    │
│   ❌ All targets on wrong layer                                  │
│   ❌ All targets have raycast = null                             │
│   ❌ All targets outside ray bounds                               │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              FILTERING (7 Systems - CONFLICT)                    │
├─────────────────────────────────────────────────────────────────┤
│ 1. CanonicalInteractionFilter (filterRaycastIntersections)      │
│ 2. VisualInteractionIsolation v2 (_applyInteractionIsolation)    │
│ 3. HardInteractionAuthority (isInteractionCore check)            │
│ 4. RaycastSanitizationEngine (safety filtering)                 │
│ 5. Material-based filtering (additive + transparent)             │
│ 6. Layer filtering (raycaster.layers.set(10))                    │
│ 7. userData.nonInteractive check                                │
│                                                                │
│ Rejects:                                                         │
│   ❌ userData.nonInteractive === true                           │
│   ❌ userData.isAura === true                                    │
│   ❌ userData.isShell === true                                   │
│   ❌ userData.isHologramShell === true                           │
│   ❌ userData.isFX === true                                      │
│   ❌ userData.isParticle === true                                │
│   ❌ userData.isEffect === true                                  │
│   ❌ userData.isGlyph === true                                   │
│   ❌ userData.isLinkVisual === true                              │
│   ❌ userData.isLinkGlow === true                               │
│   ❌ userData.isNeuralCurve === true                             │
│   ❌ userData.isHarmonyField === true                            │
│   ❌ userData.isIntegrationField === true                       │
│   ❌ userData.visualLayer === 'AURA'                            │
│   ❌ userData.visualLayer === 'SHELL'                           │
│   ❌ userData.visualLayer === 'VISUAL_ONLY'                      │
│   ❌ material.transparent + additive + !depthWrite               │
│   ❌ Not on layer 10                                            │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              NODE RESOLUTION                                     │
├─────────────────────────────────────────────────────────────────┤
│   nodeId = intersection.object.userData.nodeId                  │
│   node = aiNodes.nodes.find(n => n.userData.id === nodeId)      │
│                                                                │
│ Kill Switches:                                                    │
│   ❌ intersection.object.userData.nodeId missing                  │
│   ❌ ID mismatch (id vs nodeId)                                  │
│   ❌ Node not in aiNodes.nodes array                             │
│   ❌ Proxy has different ID than expected                         │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              SELECTION DISPATCH                                  │
├─────────────────────────────────────────────────────────────────┤
│   selectNode(node) / deselectNode()                              │
│   createLink(source, target)                                     │
│                                                                │
│ Kill Switches:                                                    │
│   ❌ !linkingSystem.enabled                                      │
│   ❌ !this.enabled                                               │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              GLYPH/LINKING SYSTEMS                               │
│   - Glyph rendering                                             │
│   - Link creation                                                │
│   - Visual feedback                                              │
└─────────────────────────────────────────────────────────────────┘
```

---

### All Kill Switches

**System-Level:**
1. `!this.enabled` (NodeLinkingSystem)
2. `!this.worldReady` (world transitions)
3. `!this.linkingSystem.isReady` (main loop)
4. `!window.HITPROXY_READY` (crosshair)
5. `!this.raycaster` (missing raycaster)
6. `!this.camera` (missing camera)

**Data-Level:**
7. Empty `raycastTargets` array
8. `!node.userData.interactionCollider`
9. `!node.userData.interactionCollider.isMesh`
10. `!intersection.object.userData.nodeId`
11. Node not in `aiNodes.nodes` array
12. ID mismatch (`id` vs `nodeId`)

**Filtering-Level:**
13. `userData.nonInteractive === true`
14. `userData.isAura === true`
15. `userData.isShell === true`
16. `userData.isHologramShell === true`
17. `userData.isFX === true`
18. `userData.isParticle === true`
19. `userData.isEffect === true`
20. `userData.isGlyph === true`
21. `userData.isLinkVisual === true`
22. `userData.isLinkGlow === true`
23. `userData.isNeuralCurve === true`
24. `userData.isHarmonyField === true`
25. `userData.isIntegrationField === true`
26. `userData.visualLayer === 'AURA'`
27. `userData.visualLayer === 'SHELL'`
28. `userData.visualLayer === 'VISUAL_ONLY'`
29. Material additive + transparent + no depth write
30. Not on interaction layer (10)

**Raycast Integrity:**
31. `mesh.raycast === null`
32. `mesh.raycast = () => null`
33. `mesh.visible === false`
34. `material.visible === false`
35. Wrong layer (not 10)
36. FrameScheduler blocks proxy position updates

---

### All Raycast Mutators

**Function Overrides:**
1. `_HitProxyIntegrationPatch.js` - `raycaster.intersectObjects = ...`
2. `HARD_INTERACTION_AUTHORITY_SYSTEM.js` - `raycaster.intersectObjects = ...`
3. `RaycastSanitizationEngine_v1.js` - `intersectObjects` wrapper

**Raycast Property Modifications:**
4. `VisualInteractionIsolationPatch.js` (v1) - `mesh.raycast = null` [DEPRECATED]
5. `VisualInteractionIsolationPatch_v2_CRITICAL_FIX.js` - `mesh.raycast = THREE.Mesh.prototype.raycast`
6. `HARD_INTERACTION_AUTHORITY_SYSTEM.js` - `mesh.raycast = () => null` (visuals)
7. `HARD_INTERACTION_AUTHORITY_SYSTEM.js` - `delete mesh.raycast` (core)
8. `EnhancedNodeModels.js` - `mesh.raycast = THREE.Mesh.prototype.raycast`

**Layer Modifications:**
9. `_HitProxySystem_v1.js` - `proxyMesh.layers.enable(10)`
10. `_HitProxySystem_v1.js` - `raycaster.layers.set(10)`
11. `VisualInteractionIsolationPatch_v2_CRITICAL_FIX.js` - `coreMesh.layers.enable(10)`
12. `VisualInteractionIsolationPatch_v2_CRITICAL_FIX.js` - `visualMesh.layers.disable(10)`
13. `HARD_INTERACTION_AUTHORITY_SYSTEM.js` - `coreMesh.layers.enable(10)`
14. `HARD_INTERACTION_AUTHORITY_SYSTEM.js` - `visualMesh.layers.disable(10)`

**Visibility Modifications:**
15. `_HitProxySystem_v1.js` - `proxyMesh.visible = false`
16. `_HitProxySystem_v1.js` - `proxyMesh.material.visible = false`
17. `VisualHierarchyCorrectionSystem_v1.js` - `mesh.visible = false` (scaled)
18. `VisualLayerEnforcementIntegrationHelpers.js` - `mesh.visible = false`

**userData Modifications:**
19. `_HitProxySystem_v1.js` - `mesh.userData.isHitProxy = true`
20. `_HitProxySystem_v1.js` - `mesh.userData.__hitProxy = true`
21. `_HitProxySystem_v1.js` - `mesh.userData.__hardInvisibleProxy = true`
22. `_HitProxySystem_v1.js` - `mesh.userData.targetNodeId = nodeId`
23. `VisualInteractionIsolationPatch_v2_CRITICAL_FIX.js` - `mesh.userData.nonInteractive = true`
24. `VisualInteractionIsolationPatch_v2_CRITICAL_FIX.js` - `mesh.userData.isVisualOnly = true`
25. `VisualInteractionIsolationPatch_v2_CRITICAL_FIX.js` - `mesh.userData.isInteractionCore = true`
26. `HARD_INTERACTION_AUTHORITY_SYSTEM.js` - `mesh.userData.isInteractionCore = true`
27. `HARD_INTERACTION_AUTHORITY_SYSTEM.js` - `mesh.userData.nonInteractive = true`

---

### Identity Chain Map

```
┌──────────────────────────────────────────────────────────────┐
│ Node Group (aiNodes.nodes[i])                                │
│   userData.id  ←─ PRIMARY ID                                  │
│   userData.nodeId  ←─ MAY EXIST (conflict)                   │
└────────────────────┬─────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
    Collider      Proxy      Visuals
┌───────────┐ ┌──────────┐ ┌──────────┐
│userData.  │ │userData. │ │userData. │
│ nodeId?   │ │target    │ │nodeId?   │
│ (SET?)    │ │ NodeId   │ │ (usually │
│           │ │ (GUARANT)│ │ missing) │
└─────┬─────┘ └────┬─────┘ └────┬─────┘
      │            │            │
      └────────────┼────────────┘
                   │
                   ▼
            Raycast Hit
         intersection.object.userData
                   │
      ┌────────────┼────────────┐
      │            │            │
      ▼            ▼            ▼
   Collider      Proxy      Visual Mesh
   .nodeId      .target     .nodeId?
   (MAY MISS)   NodeId      (MISS)
      │            │            │
      └────────────┼────────────┘
                   │
                   ▼
         nodeId from intersection
                   │
                   ▼
    aiNodes.nodes.find(n => n.userData.id === nodeId)
                   │
                   ▼
         Node Found? 
           │    │
        YES │    │ NO (FAIL)
           ▼    ▼
       Selection  Null
```

**Identity Loss Points:**
1. Collider creation - `userData.nodeId` not set
2. Proxy creation - uses `id || nodeId || uuid` (inconsistent)
3. Raycast hits wrong mesh - visual mesh instead of collider
4. Node lookup - expects `id`, proxy may have `nodeId`

---

### Top 5 Hard Blockers (Summary)

1. **`worldReady = false`**
   - Location: `NodeLinkingSystem.js` - `update()`, `processNodeTargeting()`
   - Trigger: World transitions, resets
   - Impact: ALL interaction blocked
   - Severity: HARD

2. **`HITPROXY_READY = false`**
   - Location: `NodeLinkingSystem.js` - Crosshair targeting
   - Trigger: Proxies not created/initialized
   - Impact: Crosshair UI blocked
   - Severity: HARD

3. **`interactionCollider` missing on node**
   - Location: Spawn pipeline (unverified)
   - Trigger: Incomplete node spawn
   - Impact: Node not in raycast targets
   - Severity: HARD

4. **Raycast hits visual mesh (not collider)**
   - Location: `NodeLinkingSystem.js` - Target collection
   - Trigger: Wrong mesh in raycast array
   - Impact: nodeId missing on intersection
   - Severity: HARD

5. **`mesh.userData.nodeId` missing**
   - Location: Spawn pipeline (unverified)
   - Trigger: Identity not set on collider
   - Impact: Node resolution fails
   - Severity: HARD

---

### Purge Recommendations

**REMOVE (10 systems - SAFE):**
1. `VisualInteractionIsolationPatch.js` (v1) - deprecated, breaking
2. `_HitProxyIntegrationPatch.js` - unclear activation, overrides intersectObjects
3. `RaycastTargetRegistry.js` - duplicate of HitProxyRegistry
4. `RaycastSanitizationEngine_v1.js` - redundant validation
5. `CanonicalInteractionFilter.js` - duplicate filtering
6. `HARD_INTERACTION_AUTHORITY_SYSTEM.js` - overlapping with v2
7. `CoreVisualAuthoritySystem.js` - overlapping authority
8. `HologramShellAuthoritySystem.js` - overlapping authority
9. `VisualAuthority.js` - overlapping authority
10. `VisualLayerEnforcementIntegrationHelpers.js` - duplicate layer management

**KEEP (6 systems - ESSENTIAL):**
1. `NodeLinkingSystem.js` - core interaction
2. `AINodes.js` - node management
3. `_HitProxySystem_v1.js` - proxy system
4. `VisualInteractionIsolationPatch_v2_CRITICAL_FIX.js` - fixed isolation
5. `HitProxyAutoRegistrar.js` - proxy lifecycle
6. `FrameScheduler.js` - performance

**AUDIT (5 systems - RISKY):**
1. Node spawn pipeline - verify identity setting
2. `_NodeLinking2_3.js` - verify if active
3. `CustomRaycastOverride.js` - verify if active
4. `_RecursiveGlyphSignalSystem.js` - verify integration
5. `_MythicRitualController.js` - verify gating

---

## CONCLUSION

The ATOMA raycast/interaction pipeline suffers from significant architectural fragmentation:

1. **7 overlapping filtering systems** - each filtering on similar criteria
2. **15+ global kill switches** - many redundant or unclear
3. **3 target collection strategies** - unclear which is active
4. **Multiple raycast integrity violations** - some deprecated code still present
5. **Identity inconsistencies** - `id` vs `nodeId` not standardized
6. **5 overlapping authority systems** - conflicting responsibilities

**Recommended Action:**
1. Remove all deprecated/duplicate systems (10 candidates)
2. Standardize on HitProxySystem for target collection
3. Standardize on VisualInteractionIsolation v2 for filtering
4. Fix identity chain: use `userData.id` everywhere
5. Remove all `raycast` function overrides (use layers only)
6. Consolidate authority systems into one
7. Remove all `window.HITPROXY_READY` gating (trust data)

**Expected Result:**
- Clear, predictable interaction pipeline
- Single source of truth for filtering/targets
- Reduced complexity (10+ fewer systems)
- Eliminated conflicts and race conditions
- Deterministic behavior

---

**Report Generated:** Phase: RAYCAST-SYSTEM-FORENSIC-AUDIT  
**Date:** Based on codebase snapshot  
**Scope:** Entire ATOMA project  
**Method:** Static code analysis, grep searches, file reading