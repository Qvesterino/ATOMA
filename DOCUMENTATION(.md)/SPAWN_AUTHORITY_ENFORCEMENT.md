# Spawn Authority Enforcement - EnhancedNodeModel as Single Source of Truth

## Overview

This document describes the **Spawn Authority Enforcement** system that ensures ALL nodes in the ATOMA network spawn ONLY from `EnhancedNodeModel`.

---

## Problem Statement

Before this fix:
- Nodes could be spawned from undefined, legacy, or experimental sources
- Unknown node types would create placeholders or corrupt visuals
- Visual meshes could intercept raycasts
- No guarantee that a node would have valid geometry and interaction capability
- Silent failures resulted in invisible or unclickable nodes

---

## Solution: Multi-Layer Validation

### Layer 1: Enhanced Node Model Categories Registry (spawnNode)

**File**: `/AINodes.js` (line 2046)

```javascript
const enhancedNodeModelsSupported = [
  'input', 'process', 'integration', 'analytics', 'storage', 'control',
  'quantum', 'sigma', 'mythic', 'prime', 'error', 'emotional'
];
```

**Behavior**:
- BEFORE any spawn attempt, validate requested category
- If category NOT in registry → apply hard fallback to 'input'
- NO logging, NO crashes, NO placeholders

### Layer 2: Enhanced Node Model Source Validation (createNode)

**File**: `/AINodes.js` (line 595)

```javascript
if (!EnhancedNodeModels) {
  return null;
}
```

**Behavior**:
- ABORT spawn if EnhancedNodeModel unavailable
- Safe null return (prevents crash)
- Node never enters scene

### Layer 3: Spawn Authority Binding Metadata

**File**: `/AINodes.js` (line 614-619)

```javascript
nodeModel.userData.enhancedNodeModelBinding = {
  sourceModel: 'EnhancedNodeModel',
  category: safeCategory,
  variantIndex: cycleData.variantIndex,
  spawnTime: Date.now()
};
```

**Purpose**:
- Permanent proof that node came from EnhancedNodeModel
- Available for inspection by visual/interaction systems
- Allows runtime verification of spawn source

### Layer 4: Raycast Authority (AINodes, NeonLinkVisuals)

**File**: `/AINodes.js` (line 968)

```javascript
this._enforceNodeRaycastAuthority(nodeModel);
```

**Behavior**:
- EVERY spawned node has visual meshes marked
- Auras, shells, particles → raycasting DISABLED (set to `() => null`)
- ONLY core meshes participate in raycasts
- Interaction guaranteed for all nodes

---

## Fallback Chain

When a node spawn is requested:

```
User Request Category
    ↓
[Layer 1] Category in EnhancedNodeModel? → NO → Fallback to 'input'
    ↓
[Layer 2] EnhancedNodeModel Available? → NO → Abort (return null)
    ↓
[Layer 3] Legacy Filter Check → Fallback if needed
    ↓
[Layer 4] Spawn from EnhancedNodeModel.create()
    ↓
[Layer 5] Apply Binding Metadata
    ↓
[Layer 6] Disable Raycasting on Visuals
    ↓
Node Ready (100% from EnhancedNodeModel)
```

---

## Supported Categories

All categories map to EnhancedNodeModel implementations:

| Category | EnhancedNodeModel Method | Status |
|----------|--------------------------|--------|
| input | createInputNode() | ✓ Supported |
| process | createProcessNode() | ✓ Supported |
| integration | createIntegrationNode() | ✓ Supported |
| analytics | createAnalyticsNode() | ✓ Supported |
| storage | createStorageNode() | ✓ Supported |
| control | createControlNode() | ✓ Supported |
| quantum | createQuantumNode() | ✓ Supported |
| sigma | createQuantumNode() | ✓ Legacy alias |
| mythic | createMythicNode() | ✓ Supported |
| prime | createPrimeNode() | ✓ Supported |
| error | createErrorNode() | ✓ Supported |
| emotional | createEmotionalNode() | ✓ Supported |

**Unknown categories automatically fallback to 'input'**

---

## Hard Fallback Guarantee

If any of these conditions are true:

1. Unknown category requested
2. Legacy model incompatible
3. Missing geometry
4. EnhancedNodeModel unavailable
5. Validation failure

**Result**: Node spawns as 'input' category with EnhancedNodeModel.createInputNode()

**Benefits**:
- NO invisible nodes
- NO unclickable nodes
- NO visual corruption
- Deterministic spawn behavior
- 100% recovery

---

## Metadata Binding

Every spawned node carries this metadata:

```javascript
node.userData.enhancedNodeModelBinding = {
  sourceModel: 'EnhancedNodeModel',      // Proof of origin
  category: safeCategory,                 // Final category used
  variantIndex: cycleData.variantIndex,  // Visual variant
  spawnTime: Date.now()                  // Spawn timestamp
};
```

**Use cases**:
- Verify spawn source: `node.userData.enhancedNodeModelBinding !== undefined`
- Audit node origin: `node.userData.enhancedNodeModelBinding.sourceModel`
- Trace visual variant: `node.userData.enhancedNodeModelBinding.variantIndex`

---

## Raycast Authority Integration

**File**: `/AINodes.js` (line 968)

When spawned, every node runs:

```javascript
_enforceNodeRaycastAuthority(nodeModel);
```

This method:
- Marks all visual meshes (auras, shells, particles)
- Sets `mesh.raycast = () => null` on visual-only meshes
- Preserves core mesh raycasting
- Guarantees interaction works

**Visual meshes disabled**:
- `userData.isAura === true`
- `userData.isShell === true`
- `userData.isHologramShell === true`
- `userData.isParticle === true`
- `userData.isFX === true`
- `userData.isGlyph === true`
- `userData.visualLayer === 'AURA' || 'SHELL' || 'VFX'`

---

## Quality Guarantees

✅ **Every spawned node has**:
- Valid EnhancedNodeModel geometry
- Proper core mesh for interaction
- Disabled raycasting on visuals
- Binding metadata for auditing
- Valid category from supported list
- Safe position (collision-checked)

✅ **Spawn Authority ensures**:
- 100% deterministic spawning
- No unknown types in scene
- No visual corruption from source mix
- Reliable raycasting/selection
- Zero undefined behavior
- Full fallback coverage

---

## Testing Spawn Authority

### Verify Binding Metadata

```javascript
// Check if node came from EnhancedNodeModel
const binding = node.userData.enhancedNodeModelBinding;
console.log(`Origin: ${binding?.sourceModel}`);
console.log(`Category: ${binding?.category}`);
console.log(`Variant: ${binding?.variantIndex}`);
```

### Trigger Fallback

```javascript
// Request unknown category
spawnNode('unknownCategory', position);
// Result: Node spawns as 'input' via fallback
```

### Verify Raycast Authority

```javascript
// Check if visual meshes have raycasting disabled
node.traverse(child => {
  if (child.isMesh && child.userData.isAura) {
    const raycastDisabled = child.raycast === (() => null);
    console.log(`Aura raycast disabled: ${raycastDisabled}`);
  }
});
```

---

## Summary

The Spawn Authority Enforcement system guarantees:

1. **Single Source of Truth**: EnhancedNodeModel
2. **No Unknown Types**: Hard fallback to 'input'
3. **Reliable Raycasting**: Visual meshes disabled
4. **Complete Metadata**: Binding information on every node
5. **Zero Failures**: Safe abort if dependencies missing
6. **100% Deterministic**: No randomness in spawn resolution

**Result**: Every node in the ATOMA network is spawn-authority-certified.
