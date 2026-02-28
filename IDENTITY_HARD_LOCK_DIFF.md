# IDENTITY HARD LOCK: Minimal Diff

**File:** AINodes.js
**Status:** PROPOSAL (do not implement yet)

---

## Diff 1: _finalizeSpawnedNode() - Line 3338-3347

```diff
     // Minimal identity + category guarantees
     const rootUserData = ensureUserDataObject(node);
-    if (rootUserData && !rootUserData.id) {
-      rootUserData.id = rootUserData.nodeId || `node-${Date.now()}-${Math.random()}`;
-    }
-    if (rootUserData && !rootUserData.nodeId) {
-      // ENFORCEMENT: Mirror id to nodeId (canonical identity for glyph fusion)
-      rootUserData.nodeId = rootUserData.id;
-    }
+    // HARD LOCK: nodeId is canonical - throw if missing
+    if (!rootUserData.nodeId) {
+      throw new Error('[IdentityLock] Node missing canonical identity (nodeId)');
+    }
+    
+    // Mirror nodeId to id (legacy compatibility)
+    if (!rootUserData.id) {
+      rootUserData.id = rootUserData.nodeId;
+    }
     if (rootUserData && !rootUserData.category && category) {
       rootUserData.category = category;
     }
```

---

## Diff 2: createNode() - updateSpawning path - Line 3817-3824

```diff
     // Primary category assignment (GUARANTEED before HUD/LinkRegistry reads)
-    newNode.userData.id = newNode.userData.id || `node-${Date.now()}-${Math.random()}`;
-    if (newNode.userData.nodeId && newNode.userData.nodeId !== newNode.userData.id) {
-      console.warn('[SpawnIdentity] nodeId diverged; mirroring id');
-    }
-    newNode.userData.nodeId = newNode.userData.id;
+    // HARD LOCK: nodeId is canonical - throw if missing
+    if (!newNode.userData.nodeId) {
+      throw new Error('[IdentityLock] Node missing canonical identity (nodeId)');
+    }
+    
+    // Mirror nodeId to id (legacy compatibility)
+    newNode.userData.id = newNode.userData.nodeId;
+    
     newNode.userData.category = category;  // <- PRIMARY SOURCE
     newNode.userData.archetype = forceArchetype || category || 'default';
     newNode.userData.archetypeKey = archetypeKey || category;
```

---

## Diff 3: EnhancedNodeModels integration - After line 1482

```diff
     try {
       nodeModel = EnhancedNodeModels.create(poolCategory, finalVisualCode, coreColor);
       // === SPAWN VISUAL DEBUG TRACE (NON-DESTRUCTIVE) ===
       if (nodeModel) {
         copySpawnIdentity(nodeModel, nodeModel);
+        // HARD LOCK: nodeId is canonical - throw if missing
+        if (!nodeModel.userData.nodeId) {
+          throw new Error('[IdentityLock] EnhancedNodeModels.create() did not set canonical nodeId');
+        }
         const visualCodeLog = nodeModel.userData?.visualCode ?? 'UNKNOWN';
         const factoryName = nodeModel.userData?.factoryName ?? 'UNKNOWN';
         const childCount = nodeModel.children?.length ?? 0;

         console.log(
           '[SPAWN_TRACE]',
           {
             category,
             visualCode: visualCodeLog,
             factoryName,
             childCount,
             nodeId: nodeModel.userData?.nodeId ?? nodeModel.uuid
           }
         );
       } else {
         console.warn('[SPAWN_TRACE_NULL]', { category });
       }
     } catch (err) {
       return failClosedVisual(null, err?.message || 'EnhancedNodeModels.create threw');
     }
```

---

## Summary of Changes

### Lines Removed: ~8
- Random `id` generation (2 locations)
- Dual-field mirroring (2 locations)
- Divergence warning (1 location)

### Lines Added: ~8
- Hard error on missing `nodeId` (3 locations)
- Single-direction mirroring `nodeId` → `id` (2 locations)
- EnhancedNodeModels validation (1 location)

### Net Change: 0 lines (pure replacement)

---

## External Systems: No Changes Required

### HitProxySystem_v1.js
- Current: Uses `userData.id` or `userData.nodeId` or `uuid`
- After: Will always see `userData.id` (now mirrors `nodeId`)
- **No change needed**

### GlyphLayer4_MultiFusion.js
- Current: Uses `userData.id || userData.nodeId`
- After: Will always use `userData.id` (now mirrors `nodeId`)
- **No change needed**

### SemanticGlyphAI.js
- Current: Uses `userData.nodeId`
- After: No change (already canonical)
- **No change needed**

---

## Testing Checklist

Before approving implementation:

- [ ] EnhancedNodeModels.create() is internal (can be audited)
- [ ] Error messages are actionable and clear
- [ ] Spawn failures are safe (return null, log error)
- [ ] No external systems write to `nodeId` outside spawn authority
- [ ] Legacy compatibility maintained (`id` field still exists)
- [ ] No random identity generation in any path

---

**Status:** READY FOR REVIEW
**Do not implement without approval**
