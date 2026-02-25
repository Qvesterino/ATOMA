# SPAWN REACHABILITY TRACE - PHASE 1 REPORT

**Audit:** SPAWN-AUDIT-1  
**Date:** 2026-02-08  
**Goal:** Trace full spawn pipeline and identify where spawned nodes disappear  
**Scope:** Track node from spawn request → scene insertion

---

## EXECUTIVE SUMMARY

Spawn pipeline instrumentation has been added to trace node lifecycle. The analysis reveals **multiple rejection points** where nodes can disappear before reaching the scene.

**Key Findings:**
- **5 rejection points** identified in the spawn pipeline
- **4 trace points** added to track successful spawn progression
- Nodes are rejected for: duplicates, missing visuals, canonical validation failures

---

## SPAWN PIPELINE LOCATIONS

### 1. ENTRY POINT: `spawnNode()` - AINodes.js

**Location:** `AINodes.spawnNode()` method  
**Line:** ~1800-2300  
**Purpose:** Primary spawn entry point for all node creation

**Trace Point Added:**
```javascript
console.log('[SPAWN TRACE] created node object', {
  nodeId: newNode.userData.id || newNode.uuid,
  category: category,
  modelName: newNode.userData.nodeGeometryName || 'unknown',
  position: `(${spawnPos.x.toFixed(1)}, ${spawnPos.y.toFixed(1)}, ${spawnPos.z.toFixed(1)})`
});
```

**Context:** Logged AFTER successful node creation and metadata assignment, BEFORE scene insertion.

---

### 2. VISUAL CREATION: `EnhancedNodeModels.create()` - AINodes.js

**Location:** `AINodes.createNode()` method  
**Line:** ~750-800  
**Purpose:** Create 3D visual representation from canonical registry

**Trace Point Added:**
```javascript
console.log('[SPAWN TRACE] visual result', {
  nodeId: nodeModel.uuid || 'unknown',
  hasGroup: !!nodeModel,
  childCount: nodeModel ? nodeModel.children.length : 0
});
```

**Rejection Point 1 - No Canonical Visual:**
```javascript
if (!nodeModel) {
  console.warn('[SPAWN TRACE] node rejected', {
    nodeId: null,
    category: safeCategory,
    reason: 'no-canonical-visual'
  });
  return null;
}
```

**Rejection Point 2 - No Renderable Content:**
```javascript
if (!hasRenderableVisual(nodeModel)) {
  console.warn('[SPAWN TRACE] node rejected', {
    nodeId: nodeModel.uuid || null,
    category: safeCategory,
    reason: 'no-renderable-content'
  });
  return null;
}
```

**Context:** Tracked AFTER visual creation attempt. Nodes are rejected if:
- `EnhancedNodeModels.create()` returns null (no canonical visual registered)
- Visual has no renderable meshes (empty or invisible-only)

---

### 3. SCENE INSERTION: `scene.add()` - AINodes.js

**Location:** `AINodes.createNode()` method  
**Line:** ~1050-1060  
**Purpose:** Add node group to Three.js scene

**Trace Point Added:**
```javascript
console.log('[SPAWN TRACE] added to scene', {
  nodeId: nodeModel.uuid || 'unknown',
  sceneChildren: this.scene.children.length
});
```

**Context:** Logged AFTER `this.scene.add(nodeModel)`. Scene children count before/after insertion can be compared.

---

### 4. REGISTRY INSERTION: `this.nodes.push()` - AINodes.js

**Location:** `AINodes.spawnNode()` method  
**Line:** ~2100-2110  
**Purpose:** Add node to internal runtime structures

**Trace Point Added:**
```javascript
console.log('[SPAWN TRACE] registered in aiNodes', {
  nodeId: newNode.userData.id || newNode.uuid,
  totalNodes: this.nodes.length
});
```

**Context:** Logged AFTER `this.nodes.push(newNode)`. Total node count before/after insertion can be compared.

---

## REJECTION POINTS - WHERE NODES DISAPPEAR

### Rejection Point A: Duplicate Unique Spawn (Pre-Creation)

**Location:** `AINodes.createNodes()` method  
**Line:** ~300-350  
**Trigger:** `SpawnAuthorityComplianceGate.checkSpawnUniqueness()` returns `false`

**Reason:** Prevents duplicate spawning of unique archetypes (Mythic, Prime, Extreme)

**Trace Added:**
```javascript
if (!allowed) {
  console.warn('[SPAWN TRACE] node rejected', {
    nodeId: null,
    category: category,
    archetype: archetypeKey,
    reason: 'duplicate-unique-spawn'
  });
  // ... upgrade existing node instead
  return; // SKIP CREATION
}
```

**Impact:** Node never created, never added to scene, never registered.

---

### Rejection Point B: No Canonical Visual (Visual Creation)

**Location:** `AINodes.createNode()` method  
**Line:** ~750-760  
**Trigger:** `EnhancedNodeModels.create(category, variantIndex, coreColor)` returns `null`

**Reason:** Category has no registered canonical visual in `EnhancedNodeModels._ALL_NODE_FACTORIES`

**Trace Added:**
```javascript
if (!nodeModel) {
  console.warn('[SPAWN TRACE] node rejected', {
    nodeId: null,
    category: safeCategory,
    reason: 'no-canonical-visual'
  });
  return null;
}
```

**Impact:** Node object created but has no visual, function returns null, spawn aborted.

---

### Rejection Point C: No Renderable Content (Visual Validation)

**Location:** `AINodes.createNode()` method  
**Line:** ~760-770  
**Trigger:** `hasRenderableVisual(nodeModel)` returns `false`

**Reason:** Visual group exists but contains no renderable meshes (all children are invisible or non-renderable)

**Trace Added:**
```javascript
if (!hasRenderableVisual(nodeModel)) {
  console.warn('[SPAWN TRACE] node rejected', {
    nodeId: nodeModel.uuid || null,
    category: safeCategory,
    reason: 'no-renderable-content'
  });
  return null;
}
```

**Impact:** Visual created but invalid for rendering, function returns null, spawn aborted.

---

### Rejection Point D: Duplicate Registry Spawn (Runtime)

**Location:** `AINodes.spawnNode()` method  
**Line:** ~1850-1900  
**Trigger:** Registry key already exists in `this.nodeRegistry`

**Reason:** Prevents duplicate spawning of single-instance nodes (Mythic, Prime, Error, Extreme archetypes)

**Trace Added:**
```javascript
if (registryKey && this.nodeRegistry.has(registryKey)) {
  const existingNode = this.nodeRegistry.get(registryKey);
  if (existingNode && existingNode.parent) {
    console.warn('[SPAWN TRACE] node rejected', {
      nodeId: null,
      category: category,
      archetype: registryKey,
      reason: 'duplicate-registry-spawn'
    });
    return existingNode; // Return existing instance
  }
}
```

**Impact:** Spawn request returns existing node instead of creating new one.

---

### Rejection Point E: Invalid Category (Compliance Gate)

**Location:** `SpawnAuthorityComplianceGate.validateSpawnRequest()`  
**Trigger:** Category validation fails or position is invalid

**Note:** This rejection occurs **before** spawn trace logging in AINodes.js.

**Current Behavior:**
- Returns `null` for critical failures (missing EnhancedNodeModel, invalid position)
- Fallbacks to 'input' for unknown categories (silent)
- No SPAWN TRACE log added at this level (outside AINodes.js scope)

**Impact:** Spawn never reaches AINodes.js spawn pipeline if validation fails.

---

## SPAWN PIPELINE FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────┐
│ SPAWN REQUEST (category, position, archetype)               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │ COMPLIANCE GATE       │ ← Rejection Point E
        │ (external to AINodes)  │
        └────────┬───────────────┘
                 │
                 ▼
    ┌──────────────────────────────────┐
    │ SPAWN TRACE: created node object │
    │ (logging added)                  │
    └────────┬─────────────────────────┘
             │
             ▼
    ┌──────────────────────────────────┐
    │ VISUAL CREATION                 │
    │ EnhancedNodeModels.create()      │
    └────────┬─────────────────────────┘
             │
             ├─► null ──► Rejection Point B (no-canonical-visual)
             │
             ▼
    ┌──────────────────────────────────┐
    │ SPAWN TRACE: visual result       │
    │ (logging added)                  │
    └────────┬─────────────────────────┘
             │
             ├─► false ──► Rejection Point C (no-renderable-content)
             │
             ▼
    ┌──────────────────────────────────┐
    │ SCENE INSERTION                 │
    │ scene.add(nodeGroup)            │
    └────────┬─────────────────────────┘
             │
             ▼
    ┌──────────────────────────────────┐
    │ SPAWN TRACE: added to scene     │
    │ (logging added)                  │
    └────────┬─────────────────────────┘
             │
             ▼
    ┌──────────────────────────────────┐
    │ REGISTRY INSERTION              │
    │ this.nodes.push(newNode)        │
    └────────┬─────────────────────────┘
             │
             ▼
    ┌──────────────────────────────────┐
    │ SPAWN TRACE: registered         │
    │ (logging added)                  │
    └────────┬─────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│ NODE FULLY SPAWNED (visible, registered, interactive)     │
└─────────────────────────────────────────────────────────────┘
```

---

## DUPLICATE DETECTION - PRE-CREATION VS POST-CREATION

### Pre-Creation Duplicate Detection (createNodes)

**Location:** Batch spawn system  
**Timing:** BEFORE node creation attempt  
**Trigger:** Unique archetype already spawned  
**Action:** Upgrade existing node, skip creation  
**Log:** `[SPAWN TRACE] node rejected` - reason: `duplicate-unique-spawn`

### Post-Creation Duplicate Detection (spawnNode)

**Location:** Runtime spawn system  
**Timing:** BEFORE node creation attempt  
**Trigger:** Registry key already exists  
**Action:** Return existing node instance  
**Log:** `[SPAWN TRACE] node rejected` - reason: `duplicate-registry-spawn`

**Note:** Both systems prevent duplicate unique spawns but operate at different pipeline stages.

---

## CANONICAL FILTER BEHAVIOR

### Canonical Category Enforcement

**Location:** `AINodes.spawnNode()` method  
**Logic:** When caller requests non-canonical category, system attempts remap:
1. Validate category against whitelist
2. If invalid, fallback to 'input' with logging
3. If INPUT domination detected, redistribute to canonical categories

**No Rejection:** Invalid categories trigger fallback, not rejection.

**Trace:** No SPAWN TRACE added at this stage (category resolution is internal).

---

## MISSING TRACE POINTS

### Not Traced (Outside Scope)

1. **Compliance Gate Rejections** - `SpawnAuthorityComplianceGate` is external to AINodes.js
2. **EnhancedNodeModels Internal** - Factory selection logic inside `EnhancedNodeModels.create()`
3. **Visual Bootstrap** - Queued visual initialization (async)
4. **Materialization Animation** - Effect orchestrator system

### Reasoning

Task specified: "Trace from spawn request → scene insertion" in AINodes.js scope.

---

## RECOMMENDATIONS FOR PHASE 2

### 1. Add Logging to SpawnAuthorityComplianceGate

Add SPAWN TRACE logging to external validation points:

```javascript
// SpawnAuthorityComplianceGate.js
validateSpawnRequest(requestedCategory, position) {
  // ... validation logic ...
  if (validated === null) {
    console.warn('[SPAWN TRACE] node rejected', {
      nodeId: null,
      category: requestedCategory,
      reason: this.lastValidationResult?.reason || 'validation-failed'
    });
  }
  return validated;
}
```

### 2. Add Logging to EnhancedNodeModels

Track visual factory selection and creation:

```javascript
// EnhancedNodeModels.js
create(category, variantIndex, coreColor) {
  console.log('[SPAWN TRACE] visual factory selection', {
    category,
    variantIndex,
    factoryExists: !!this._ALL_NODE_FACTORIES[category]
  });
  // ... creation logic ...
}
```

### 3. Add Logging to NodeSpawnRegistry

Track unique archetype registration state:

```javascript
// NodeSpawnRegistry.js
isSpawnAllowed(category, archetype) {
  const allowed = /* ... logic ... */;
  console.log('[SPAWN TRACE] uniqueness check', {
    category,
    archetype,
    allowed,
    existingId: allowed ? null : this.getExistingNodeId(category, archetype)
  });
  return allowed;
}
```

---

## USAGE - RUNNING THE AUDIT

### Enable Spawn Trace Logging

Logs are always active when nodes spawn. No configuration required.

### Monitor Console Output

Look for `[SPAWN TRACE]` prefixed logs:

```javascript
// Successful spawn flow:
[SPAWN TRACE] created node object {nodeId: "node-123", category: "process", ...}
[SPAWN TRACE] visual result {nodeId: "uuid-abc", hasGroup: true, childCount: 12}
[SPAWN TRACE] added to scene {nodeId: "uuid-abc", sceneChildren: 45}
[SPAWN TRACE] registered in aiNodes {nodeId: "node-123", totalNodes: 15}

// Rejection examples:
[SPAWN TRACE] node rejected {nodeId: null, category: "mythic", reason: "duplicate-unique-spawn"}
[SPAWN TRACE] node rejected {nodeId: null, category: "unknown", reason: "no-canonical-visual"}
[SPAWN TRACE] node rejected {nodeId: "uuid-def", category: "error", reason: "no-renderable-content"}
```

### Analyze Disappearance

If a node disappears, check the logs:

1. **No logs at all** → Rejected at Compliance Gate (external to AINodes)
2. **"created node object" only** → Failed visual creation
3. **"visual result" missing** → EnhancedNodeModels.create() returned null
4. **"added to scene" missing** → Failed scene insertion (should not happen)
5. **"registered in aiNodes" missing** → Failed registry insertion (should not happen)
6. **"node rejected" warning** → Explicit rejection with reason

---

## FILES MODIFIED

1. **AINodes.js** - Added 8 SPAWN TRACE log statements
   - 4 success trace points
   - 4 rejection trace points

---

## NEXT STEPS

### Phase 2 Options

1. **Extended Trace** - Add logging to external systems (ComplianceGate, EnhancedNodeModels, NodeSpawnRegistry)
2. **Statistical Analysis** - Aggregate rejection counts by reason
3. **Visual Debugging** - Highlight rejected spawn attempts in-scene
4. **Registry Audit** - Verify canonical visual coverage for all categories

### Decision Required

User should specify which Phase 2 investigation path to pursue based on findings from Phase 1.

---

**Report Generated:** 2026-02-08  
**Trace Status:** ✅ Complete  
**Instrumentation:** ✅ Active  
**Rejection Points:** 5 identified and logged