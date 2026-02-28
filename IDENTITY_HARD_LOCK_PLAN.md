# IDENTITY HARD LOCK: Single Canonical Authority
**Date:** 2026-02-28
**Task:** Declare `userData.nodeId` as ONLY canonical runtime identity
**Scope:** AINodes.js only (no external refactor)

---

## ROOT CAUSE ANALYSIS

### Current State: Fragmented Identity System

**Three separate identity paths exist:**

1. **EnhancedNodeModels.create()** - Factory creates node
   - ❌ Does NOT set `userData.nodeId`
   - May or may not set other fields

2. **AINodes.createNode()** - Spawning layer
   - Line 3819: `userData.id = userData.id || random-fallback`
   - Line 3823: `userData.nodeId = userData.id`
   - ⚠️ Mirrors `id` to `nodeId` (backwards)

3. **AINodes._finalizeSpawnedNode()** - Finalization layer
   - Line 3342: `userData.id = userData.nodeId || random-fallback`
   - Line 3346: `userData.nodeId = userData.id`
   - ⚠️ Mirrors `id` to `nodeId` (backwards)

### Critical Issue

**Pattern:** Both paths create random `id` as fallback, then mirror to `nodeId`

**Problem:** `nodeId` depends on `id`, but `id` may be generated randomly

**Result:** Inconsistent identity authority, potential for divergence

---

## PROPOSED SOLUTION: HARD LOCK ON nodeId

### Principle

**`userData.nodeId` is the ONLY canonical field.**

- `userData.id` exists ONLY for legacy compatibility (read-only mirror)
- No system generates random `id`
- No system writes `nodeId` from `id`
- Missing `nodeId` = hard error (spawn fails safely)

### Assignment Order (Canonical)

```javascript
// 1. ENSURE nodeId exists (THROW if not)
if (!node.userData.nodeId) {
  throw new Error('[IdentityLock] Node missing canonical identity (nodeId)');
}

// 2. Mirror nodeId to id (legacy compatibility)
node.userData.id = node.userData.nodeId;
```

---

## MINIMAL DIFF: AINodes.js

### Change 1: Fix _finalizeSpawnedNode()

**Location:** Lines 3338-3347

**Before:**
```javascript
// Minimal identity + category guarantees
const rootUserData = ensureUserDataObject(node);
if (rootUserData && !rootUserData.id) {
  rootUserData.id = rootUserData.nodeId || `node-${Date.now()}-${Math.random()}`;
}
if (rootUserData && !rootUserData.nodeId) {
  // ENFORCEMENT: Mirror id to nodeId (canonical identity for glyph fusion)
  rootUserData.nodeId = rootUserData.id;
}
if (rootUserData && !rootUserData.category && category) {
  rootUserData.category = category;
}
```

**After:**
```javascript
// Minimal identity + category guarantees
const rootUserData = ensureUserDataObject(node);

// HARD LOCK: nodeId is canonical - throw if missing
if (!rootUserData.nodeId) {
  throw new Error('[IdentityLock] Node missing canonical identity (nodeId)');
}

// Mirror nodeId to id (legacy compatibility)
if (!rootUserData.id) {
  rootUserData.id = rootUserData.nodeId;
}

if (!rootUserData.category && category) {
  rootUserData.category = category;
}
```

**Changes:**
- ❌ Removed: Random `id` fallback (`\`node-${Date.now()}-${Math.random()}\``)
- ❌ Removed: Dual-field mirroring logic
- ✅ Added: Hard error on missing `nodeId`
- ✅ Changed: Single-direction mirror (`nodeId` → `id`)

---

### Change 2: Fix createNode() updateSpawning path

**Location:** Lines 3817-3823

**Before:**
```javascript
// Primary category assignment (GUARANTEED before HUD/LinkRegistry reads)
newNode.userData.id = newNode.userData.id || `node-${Date.now()}-${Math.random()}`;
if (newNode.userData.nodeId && newNode.userData.nodeId !== newNode.userData.id) {
  console.warn('[SpawnIdentity] nodeId diverged; mirroring id');
}
newNode.userData.nodeId = newNode.userData.id;
newNode.userData.category = category;  // <- PRIMARY SOURCE
```

**After:**
```javascript
// HARD LOCK: nodeId is canonical - throw if missing
if (!newNode.userData.nodeId) {
  throw new Error('[IdentityLock] Node missing canonical identity (nodeId)');
}

// Mirror nodeId to id (legacy compatibility)
newNode.userData.id = newNode.userData.nodeId;

// Primary category assignment (GUARANTEED before HUD/LinkRegistry reads)
newNode.userData.category = category;
```

**Changes:**
- ❌ Removed: Random `id` fallback (`\`node-${Date.now()}-${Math.random()}\``)
- ❌ Removed: Divergence warning (unnecessary with hard lock)
- ✅ Added: Hard error on missing `nodeId`
- ✅ Changed: Single-direction mirror (`nodeId` → `id`)

---

### Change 3: Fix EnhancedNodeModels Integration

**Location:** After line 1482 (where `nodeModel` is created)

**Insertion:**
```javascript
// After line 1482:
if (nodeModel) {
  copySpawnIdentity(nodeModel, nodeModel);
  const visualCodeLog = nodeModel.userData?.visualCode ?? 'UNKNOWN';

  // HARD LOCK: nodeId is canonical - throw if missing
  if (!nodeModel.userData.nodeId) {
    throw new Error('[IdentityLock] EnhancedNodeModels.create() did not set canonical nodeId');
  }

  const visualCodeLog = nodeModel.userData?.visualCode ?? 'UNKNOWN';
  // ... rest of existing code
```

**Changes:**
- ✅ Added: Hard error after EnhancedNodeModels.create() returns node without `nodeId`
- ✅ Ensures factory failure is caught immediately

---

## BEHAVIOR CHANGES

### Before (Current)

1. EnhancedNodeModels.create() creates node (may not set `nodeId`)
2. createNode() generates random `id` as fallback
3. _finalizeSpawnedNode() generates random `id` as fallback
4. Both paths mirror `id` → `nodeId`
5. System continues with potentially random identity

### After (Proposed)

1. EnhancedNodeModels.create() creates node
2. **HARD ERROR** if `nodeId` missing → spawn fails safely
3. _finalizeSpawnedNode() **HARD ERROR** if `nodeId` missing → spawn fails safely
4. Both paths mirror `nodeId` → `id` (single direction)
5. **NO RANDOM IDENTITY GENERATION EVER**

---

## INVARIANTS ENFORCED

### Invariant 1: nodeId is ALWAYS present
**Before:** May be missing, filled with random fallback
**After:** Required → hard error if missing

### Invariant 2: id mirrors nodeId (read-only)
**Before:** id may be primary, nodeId mirrors it
**After:** nodeId is primary, id mirrors it (single direction)

### Invariant 3: No random identity generation
**Before:** Two locations generate random `id` as fallback
**After:** Zero random generation → strict validation

### Invariant 4: Single source of truth
**Before:** Two masters (id and nodeId) with fallback logic
**After:** One master (nodeId), one mirror (id)

---

## EDGE CASES HANDLED

### Edge Case 1: EnhancedNodeModels returns null
**Current:** Handled (returns null, no spawn)
**Proposed:** No change (same behavior)

### Edge Case 2: EnhancedNodeModels creates node without nodeId
**Current:** Generates random `id`, mirrors to `nodeId`
**Proposed:** **HARD ERROR**, spawn fails safely

### Edge Case 3: Existing node with nodeId missing id
**Current:** No issue (nodeId exists)
**Proposed:** Mirrors `nodeId` → `id` (fixes legacy compatibility)

### Edge Case 4: Runtime mutation of nodeId
**Current:** No protection
**Proposed:** Not in scope (spawn-time enforcement only)

---

## EXTERNAL SYSTEMS: NO CHANGES

### Systems That Require `id` (Legacy Compatibility)

**HitProxySystem_v1.js:**
- Uses: `userData.id` or `userData.nodeId` or `uuid`
- Impact: Will still work (id is now always present as mirror)
- Change: None needed

**GlyphLayer4_MultiFusion.js:**
- Uses: `node.userData.id` (line 807)
- Impact: Will still work (id is now always present as mirror)
- Change: None needed

### Systems That Already Use `nodeId` (No Change)

**SemanticGlyphAI.js:**
- Uses: `node.userData.nodeId`
- Impact: No change (already canonical)
- Change: None needed

---

## RISK ASSESSMENT

### Benefits

1. **Single Source of Truth** - `nodeId` is the only canonical field
2. **Eliminated Divergence** - No two masters to conflict
3. **Hard Validation** - Missing identity detected immediately (hard error)
4. **No Random Generation** - All identities are deterministic
5. **Legacy Compatible** - `id` still exists as mirror

### Risks

1. **Breaking Change** - If EnhancedNodeModels is external, may need update
2. **Spawn Failure** - Hard errors prevent spawning (fails safely)
3. **Dependency** - Requires EnhancedNodeModels to set `nodeId` consistently

### Mitigation

- Spawn failures are **safe** (return null, log error)
- EnhancedNodeModels is internal (can be audited)
- Error messages are **actionable** (clear what's missing)

---

## MIGRATION COMPLEXITY

### Changes Required
- **AINodes.js:** 3 changes (2 identity fixes + 1 validation)
- **EnhancedNodeModels.js:** 1 change (ensure nodeId is set)
- **Total:** 4 changes, ~15 lines modified

### Files Changed
- **AINodes.js** - 3 diffs
- **EnhancedNodeModels.js** - 1 diff

### Lines Modified
- **Removed:** ~8 lines (random generation, dual mirroring)
- **Added:** ~8 lines (hard error, single-direction mirror)
- **Net:** 0 lines changed, but behavior hardened

---

## ACCEPTANCE CRITERIA

### Functional Requirements
- ✅ `userData.nodeId` is the ONLY canonical field
- ✅ `userData.id` mirrors `nodeId` (read-only after spawn)
- ✅ No random `id` generation exists
- ✅ No system writes `nodeId` from `id` outside spawn authority
- ✅ Missing `nodeId` throws hard error
- ✅ Behavior unchanged when `nodeId` is present

### Safety Requirements
- ✅ Spawn fails safely (returns null) if identity missing
- ✅ Error messages are actionable and clear
- ✅ No refactoring of external systems
- ✅ Legacy compatibility maintained (id field still exists)

### Code Quality Requirements
- ✅ Minimal diff (no refactoring)
- ✅ Clear invariants enforced
- ✅ Single source of truth established

---

## SUMMARY

**Status:** 🎯 **PROPOSAL READY**

**Approach:** Hard lock on `userData.nodeId` as single canonical identity

**Key Changes:**
1. Remove random `id` generation (2 locations)
2. Remove dual-field mirroring (2 locations)
3. Add hard error on missing `nodeId` (3 locations)
4. Establish `nodeId` → `id` single-direction mirror (2 locations)

**Impact:**
- Eliminates identity divergence
- Enforces deterministic identity
- Maintains legacy compatibility
- No external system changes required

**Decision Required:** Review and approve before implementation

---

*Prepared by:* ATOMA Resident Architect
*Review Date:* 2026-02-28
*Next Review:* As needed
