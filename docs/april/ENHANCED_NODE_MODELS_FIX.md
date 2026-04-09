# EnhancedNodeModels.create() Fix

**File:** EnhancedNodeModels.js
**Location:** static create() method (line ~1585)
**Change:** Add nodeId generation in factory

---

## Problem

EnhancedNodeModels.create() does NOT set `userData.nodeId`.

Current behavior:
```javascript
rootGroup.userData.visualCode = visualCode;
rootGroup.userData.factoryName = def.factoryName;
rootGroup.userData.category = cat;

return rootGroup;  // ← NO nodeId set
```

Result:
- AINodes.createNode() generates random fallback
- nodeId is NOT canonical (depends on id with random fallback)
- Hard lock would fail (no nodeId when expected)

---

## Solution

Add nodeId generation in create() method BEFORE return:

```javascript
rootGroup.userData.visualCode = visualCode;
rootGroup.userData.factoryName = def.factoryName;
rootGroup.userData.category = cat;

// Generate canonical nodeId (factory-level identity)
if (!rootGroup.userData.nodeId) {
  rootGroup.userData.nodeId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

return rootGroup;
```

---

## Placement

Insert AFTER `rootGroup.userData.category = cat;` and BEFORE `return rootGroup;`

In static create(category = 'input', visualCode = 0, color = 0x00ffff) method.

---

## Verification

After applying this fix:

1. EnhancedNodeModels.create() always sets nodeId
2. AINodes.createNode() sees nodeId present
3. No random fallback is needed
4. Hard lock can safely enforce nodeId presence

---

## Next Steps

1. Apply this fix to EnhancedNodeModels.js
2. Apply hard lock changes to AINodes.js (from IDENTITY_HARD_LOCK_DIFF.md)
3. Test: All spawn scenarios must work without random fallbacks
4. Verify: nodeId is present on all nodes after spawn
