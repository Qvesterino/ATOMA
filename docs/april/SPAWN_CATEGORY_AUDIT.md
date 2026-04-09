# ATOMA SPAWN CATEGORY SELECTION AUDIT

**Date:** 2026-03-17
**Task:** Investigate why mythic/prime categories never win spawn selection

---

## EXECUTIVE SUMMARY

The spawn category selection system uses a **deterministic cyclic algorithm** with equal probability for all categories. Mythic and prime categories ARE included in the spawn cycle and SHOULD be selected with 8.33% probability each.

**Key Finding:** No structural blockage found. Mythic/prime are fully integrated into the spawn system.

---

## 1. CATEGORY SELECTION MECHANISM

### Primary Function: `getNextCyclicSpawnCategory()`
**Location:** [`AINodes.js:998-1030`](AINodes.js:998)

**Algorithm:**
- Uses a cursor-based cyclic selection
- Iterates through `spawnCycleState.order` array
- Validates each candidate using `validateCategory()`
- Returns first valid category, advancing cursor on success

**Selection Flow:**
```
1. Check for pending candidate → return if exists
2. Get spawn cycle state and order array
3. For each position in order (starting at cursor):
   a. Get candidate category
   b. Validate category
   c. If valid → set as pending, advance cursor, return
   d. If invalid → advance cursor, continue
4. Return null if no valid category found
```

---

## 2. SPAWN CYCLE ORDER

**Location:** [`AINodes.js:699-701`](AINodes.js:699)

```javascript
order: [
  'input','process','storage','analytics','integration','control',
  'quantum','sigma','mythic','prime','error','emotional'
]
```

**Total Categories:** 12

**Position Mapping:**
| Position | Category | Index |
|----------|----------|-------|
| 0 | input | 0 |
| 1 | process | 1 |
| 2 | storage | 2 |
| 3 | analytics | 3 |
| 4 | integration | 4 |
| 5 | control | 5 |
| 6 | quantum | 6 |
| 7 | sigma | 7 |
| 8 | **mythic** | 8 |
| 9 | **prime** | 9 |
| 10 | error | 10 |
| 11 | emotional | 11 |

**✅ Mythic and prime ARE in the spawn cycle order**

---

## 3. CATEGORY VALIDATION

### Function: `validateCategory(requestedCategory)`
**Location:** [`AINodes.js:1436-1466`](AINodes.js:1436)

**Validation Logic:**
```javascript
validateCategory(requestedCategory) {
  const requested = (requestedCategory || 'input').toLowerCase().trim();
  
  // Check if SAFE (allow)
  if (AINodes.SAFE_CATEGORIES.includes(requested)) {
    return {
      valid: true,
      category: requested,
      reason: `Category '${requested}' is production-ready`,
      redirected: false
    };
  }
  
  // Check if UNSAFE (block)
  if (AINodes.UNSAFE_CATEGORIES.includes(requested)) {
    return {
      valid: false,
      category: 'input',  // Fallback
      reason: `Category '${requested}' is NOT implemented (geometry missing). Falling back to 'input'. Reason: No create${requested}Node() factory in EnhancedNodeModels.`,
      blocked: true
    };
  }
  
  // Unknown category (treat as unsafe)
  return {
    valid: false,
    category: 'input',  // Fallback
    reason: `Unknown category '${requested}'. Falling back to 'input'. Use one of: ${AINodes.SAFE_CATEGORIES.join(', ')}`,
    unknown: true
  };
}
```

---

## 4. SAFE_CATEGORIES WHITELIST

**Location:** [`AINodes.js:1420-1422`](AINodes.js:1420)

```javascript
static get SAFE_CATEGORIES() {
  return ['input', 'process', 'integration', 'analytics', 'storage', 'control', 'quantum', 'sigma', 'mythic', 'prime', 'error', 'emotional'];
}
```

**✅ Mythic and prime ARE in SAFE_CATEGORIES**

---

## 5. UNSAFE_CATEGORIES

**Location:** [`AINodes.js:1424-1426`](AINodes.js:1424)

```javascript
static get UNSAFE_CATEGORIES() {
  return [];  // [TASK 2] All categories now safe — no unsafe categories
}
```

**✅ No categories are blocked**

---

## 6. FACTORY REGISTRATION

### Factory Registry Builder: `ensureRegistryReady()`
**Location:** [`EnhancedNodeModels.js:1419-1460`](EnhancedNodeModels.js:1419)

**Process:**
1. Iterates through `NODE_VISUAL_REGISTRY`
2. Resolves factory function for each entry
3. Groups by category into `_ALL_NODE_FACTORIES`
4. Categories with missing factories are logged

### Mythic Factories (Verified)
**Location:** [`EnhancedNodeModels.js:6444-6476`](EnhancedNodeModels.js:6444)

| Factory Name | Visual Code | Status |
|--------------|-------------|--------|
| `createMythicShardClusterNode` | 901 | ✅ Exists |
| `createMythicBrokenMonolithNode` | 902 | ✅ Exists |
| `createMythicFloatingFragmentsNode` | 903 | ✅ Exists |
| `createMythicCrackedPrismNode` | 904 | ✅ Exists |
| `createMythicAncientCoreWithMissingNode` | 905 | ✅ Exists |
| `createMythicCollapsedCrownNode` | 906 | ✅ Exists |
| `createMythicNodeStyled_v2` | 908 | ✅ Exists |

### Prime Factories (Verified)
**Location:** [`EnhancedNodeModels.js:6687-6709`](EnhancedNodeModels.js:6687)

| Factory Name | Visual Code | Status |
|--------------|-------------|--------|
| `createPrimeNestedIcosahedronNode` | 1001 | ✅ Exists |
| `createPrimePerfectDodecahedronNode` | 1002 | ✅ Exists |
| `createPrimeStellaOctangulaNode` | 1003 | ✅ Exists |
| `createPrimePrecisionLatticeNode` | 1004 | ✅ Exists |
| `createPrimeTesseractProjectionNode` | 1005 | ✅ Exists |
| `createPrimeSymmetryLockedCoreNode` | 1006 | ✅ Exists |
| `createPrimeNodeStyled_v2` | 1008 | ✅ Exists |

### Error Factories (Verified)
**Location:** [`EnhancedNodeModels.js:6914-7853`](EnhancedNodeModels.js:6914)

| Factory Name | Visual Code | Status |
|--------------|-------------|--------|
| `createErrorIntersectingSolidsNode` | 1101 | ✅ Exists |
| `createErrorInvertedNormalsNode` | 1102 | ✅ Exists |
| `createErrorSelfClippingNode` | 1103 | ✅ Exists |
| `createErrorFoldedImpossibleNode` | 1104 | ✅ Exists |
| `createErrorTopologyTearNode` | 1105 | ✅ Exists |
| `createErrorCorruptedManifoldNode` | 1106 | ✅ Exists |
| `createErrorNodeStyled_v2` | 1108 | ✅ Exists |

**✅ All mythic/prime/error factories exist and are registered**

---

## 7. CATEGORY PROBABILITY TABLE

### Theoretical Probabilities (Cyclic Selection)

| Category | Position | Probability | Weight | Expected Spawn Rate |
|----------|----------|-------------|--------|---------------------|
| input | 0 | 8.33% (1/12) | 1 | Every 12 spawns |
| process | 1 | 8.33% (1/12) | 1 | Every 12 spawns |
| storage | 2 | 8.33% (1/12) | 1 | Every 12 spawns |
| analytics | 3 | 8.33% (1/12) | 1 | Every 12 spawns |
| integration | 4 | 8.33% (1/12) | 1 | Every 12 spawns |
| control | 5 | 8.33% (1/12) | 1 | Every 12 spawns |
| quantum | 6 | 8.33% (1/12) | 1 | Every 12 spawns |
| sigma | 7 | 8.33% (1/12) | 1 | Every 12 spawns |
| **mythic** | **8** | **8.33% (1/12)** | **1** | **Every 12 spawns** |
| **prime** | **9** | **8.33% (1/12)** | **1** | **Every 12 spawns** |
| error | 10 | 8.33% (1/12) | 1 | Every 12 spawns |
| emotional | 11 | 8.33% (1/12) | 1 | Every 12 spawns |

**Total:** 100% (12 categories × 8.33%)

**✅ Mythic and prime have equal probability to all other categories**

---

## 8. SPAWN REQUEST FLOW

### Entry Point: `getRuntimeSpawnCategoryIntent()`
**Location:** [`AINodes.js:3502-3514`](AINodes.js:3502)

```javascript
getRuntimeSpawnCategoryIntent() {
  const category = this.getNextCyclicSpawnCategory();
  if (category) {
    if (!this._spawnIntentLogged) {
      console.info('[SpawnIntent] runtime spawn injected category:', category);
      this._spawnIntentLogged = true;
    }
    return category;
  }

  // Hard fallback: keep scheduler alive but continue cycle next tick.
  return 'input';
}
```

### Request Queue: `requestSpawn(request)`
**Location:** [`AINodes.js:3779-3787`](AINodes.js:3779)

```javascript
requestSpawn(request) {
  if (this.spawningConfig?.disableRuntimeSpawn === true) return;
  if (Number.isFinite(this.hardSpawnCap) && this.getNodeCount() >= this.hardSpawnCap) return;
  this.spawnRequestQueue.push({
    category: request.category || null,
    // ...
  });
}
```

### Processing: `_processSpawnRequests()`
**Location:** [`AINodes.js:3795-3822`](AINodes.js:3795)

```javascript
_processSpawnRequests() {
  // ...
  while (this.spawnRequestQueue.length && processed < maxPerFrame) {
    const req = this.spawnRequestQueue.shift();
    // Acquire token to allow spawnNode() to execute
    this._spawnUpdateToken = true;
    this.#spawnNode(req.category, null, req.archetype);
    this._spawnUpdateToken = false;
  }
}
```

---

## 9. FACTORY READINESS CHECK

### Function: `ensureFactoryReadyAndVisual(category)`
**Location:** [`AINodes.js:4489-4511`](AINodes.js:4489)

**Check:**
```javascript
ensureFactoryReadyAndVisual(category) {
  if (!this.ensureFactoriesReady()) {
    spawnDiagnostics.report('abort.factoryRegistry', { category });
    return false;
  }
  EnhancedNodeModels.ensureRegistryReady?.();
  const registryEntry = EnhancedNodeModels._ALL_NODE_FACTORIES?.[category];
  const hasCanonicalVisual = Array.isArray(registryEntry) && registryEntry.length > 0;
  if (!hasCanonicalVisual) {
    // Log error and abort spawn
    return false;
  }
  return true;
}
```

**✅ Mythic and prime have canonical visuals registered**

---

## 10. DEBUG LOGGING ADDED

### Category Selection Debug
**Location:** [`AINodes.js:1015-1029`](AINodes.js:1015)

```javascript
// DEBUG: Log category selection attempt
if (window.ATOMA_FLAGS?.debug?.spawnCategory === true) {
  console.log('[SPAWN_CATEGORY_DEBUG] Candidate:', {
    candidate,
    cursor,
    valid: validation?.valid,
    category: validation?.category,
    reason: validation?.reason
  });
}

// DEBUG: Log selected category
if (window.ATOMA_FLAGS?.debug?.spawnCategory === true) {
  console.log('[SPAWN_CATEGORY_DEBUG] Selected:', {
    category: validation.category,
    cursor,
    nextCursor: (cursor + 1) % order.length
  });
}
```

### Spawn Final Category Debug
**Location:** [`AINodes.js:3961-3969`](AINodes.js:3961)

```javascript
// DEBUG: Log final category used for spawn
if (window.ATOMA_FLAGS?.debug?.spawnCategory === true) {
  console.log('[SPAWN_CATEGORY_DEBUG] Final category for spawn:', {
    requestedCategoryRaw: validation.requestedCategoryRaw,
    finalCategory: validation.category,
    isFallback: validation.isFallbackSpawn,
    fallbackReason: validation.fallbackReason
  });
}
```

### Enable Debug Logging
```javascript
// In browser console:
window.ATOMA_FLAGS = window.ATOMA_FLAGS || {};
window.ATOMA_FLAGS.debug = window.ATOMA_FLAGS.debug || {};
window.ATOMA_FLAGS.debug.spawnCategory = true;
```

---

## 11. VERIFICATION SUMMARY

### ✅ Verified: Mythic/Prime ARE in Spawn System

| Check | Status | Evidence |
|-------|--------|----------|
| In spawn cycle order | ✅ YES | [`AINodes.js:699-701`](AINodes.js:699) |
| In SAFE_CATEGORIES | ✅ YES | [`AINodes.js:1420-1422`](AINodes.js:1420) |
| Not in UNSAFE_CATEGORIES | ✅ YES | [`AINodes.js:1424-1426`](AINodes.js:1424) |
| Factories exist | ✅ YES | [`EnhancedNodeModels.js:6444-6709`](EnhancedNodeModels.js:6444) |
| In NODE_VISUAL_REGISTRY | ✅ YES | [`NodeVisualRegistry.js:100-123`](NodeVisualRegistry.js:100) |
| Have canonical visuals | ✅ YES | Verified in registry |
| Equal probability | ✅ YES | 8.33% (1/12) each |

### ❌ No Structural Blockage Found

**Conclusion:** There is NO code-level reason why mythic/prime should never spawn. They are:
1. In the spawn cycle order
2. Validated as safe
3. Have factories registered
4. Have equal probability to all other categories

---

## 12. POSSIBLE EXPLANATIONS FOR MISSING MYTHIC/PRIME SPAWNS

If mythic/prime are not appearing in practice, possible causes:

### 1. Spawn Rate Limiting
- Check `hardSpawnCap` in [`AINodes.js:1131`](AINodes.js:1131)
- Check `targetPopulation` in update loop
- Verify spawns are actually occurring

### 2. Spawn Frequency Too Low
- If total spawns < 12, mythic/prime may not have been reached yet
- Check spawn statistics via `getSpawnStats()` at [`AINodes.js:895`](AINodes.js:895)

### 3. Cursor Reset
- Check if `spawnCycleState.cursor` is being reset
- Check if `_pendingCyclicCandidate` is being cleared
- Check if `_commitSpawnCycleSuccess()` is being called

### 4. Spawn Request Filtering
- Check if `requestSpawn()` is being called with explicit category
- Check if `forceArchetype` is overriding category
- Check if event spawns are using different category selection

### 5. Spawn Abortion
- Check `_spawnAbortCounters` for abort reasons
- Check `ensureFactoryReadyAndVisual()` for factory failures
- Check `validateSpawnRequest()` for validation failures

### 6. Visual Loading Issues
- Check if `EnhancedNodeModels.ensureRegistryReady()` is completing
- Check if factories are resolving correctly
- Check if geometry families are loaded

---

## 13. RECOMMENDED NEXT STEPS

### 1. Enable Debug Logging
```javascript
window.ATOMA_FLAGS = window.ATOMA_FLAGS || {};
window.ATOMA_FLAGS.debug = window.ATOMA_FLAGS.debug || {};
window.ATOMA_FLAGS.debug.spawnCategory = true;
```

### 2. Monitor Spawn Statistics
```javascript
// Get spawn statistics
const stats = aiNodes.getSpawnStats();
console.log('Spawn Stats:', stats);

// Get category counts
const counts = aiNodes.getSpawnCategoryCounts();
console.log('Category Counts:', counts);
```

### 3. Check Spawn Cycle State
```javascript
// Check current cursor position
console.log('Spawn Cycle Cursor:', aiNodes.spawnCycleState.cursor);
console.log('Spawn Cycle Order:', aiNodes.spawnCycleState.order);
console.log('Pending Candidate:', aiNodes._pendingCyclicCandidate);
```

### 4. Manually Trigger Mythic/Prime Spawn
```javascript
// Direct API calls
aiNodes.spawnMythicNode('manual-test');
aiNodes.spawnPrimeNode('manual-test');
```

### 5. Verify Factory Registry
```javascript
// Check if mythic/prime factories are registered
console.log('Mythic Factories:', EnhancedNodeModels._ALL_NODE_FACTORIES?.mythic);
console.log('Prime Factories:', EnhancedNodeModels._ALL_NODE_FACTORIES?.prime);
```

---

## 14. ALTERNATIVE CATEGORY SELECTION

### Function: `getWeightedRandomCategory()`
**Location:** [`AINodes.js:3485-3496`](AINodes.js:3485)

**Note:** This function exists but is NOT used for runtime spawns. It provides uniform random selection across all categories.

```javascript
getWeightedRandomCategory() {
  const allCategories = [
    ...this.nodeCategories,      // Standard: input, process, integration, analytics, storage, control
    ...this.newNodeCategories,  // New: mythic, prime, error
    ...this.specialNodeTypes,   // Special: sigma, quantum, emotional
    'extreme'                 // EXTREME archetypes
  ];
  
  // Uniform random selection - each category has equal probability
  return allCategories[Math.floor(Math.random() * allCategories.length)];
}
```

**Total Categories in Random Pool:** 6 + 3 + 3 + 1 = 13

**Probability per Category:** 7.69% (1/13)

---

## 15. CONCLUSION

### Structural Analysis
✅ **No code-level blockage found**

Mythic and prime categories are:
- Fully integrated into the spawn cycle
- Validated as safe
- Have factories registered
- Have equal probability (8.33%) to all other categories

### Theoretical Probability
✅ **Equal probability confirmed**

Each category (including mythic/prime) has exactly 8.33% chance per spawn cycle iteration.

### Practical Investigation Needed
❓ **Runtime behavior verification required**

To determine why mythic/prime are not appearing in practice:
1. Enable debug logging (added in this audit)
2. Monitor spawn statistics
3. Check spawn cycle state
4. Verify factory registry is ready
5. Manually test mythic/prime spawn APIs

### Debug Logging Added
✅ **Instrumentation complete**

Debug logging has been added to:
- `getNextCyclicSpawnCategory()` - logs candidate validation and selection
- `spawnNode()` - logs final category used for spawn

Enable with: `window.ATOMA_FLAGS.debug.spawnCategory = true`

---

## 16. FILES MODIFIED

### AINodes.js
- Added debug logging to `getNextCyclicSpawnCategory()` at lines 1015-1029
- Added debug logging to `spawnNode()` at lines 3961-3969

---

## 17. REFERENCES

- Spawn cycle state: [`AINodes.js:697-706`](AINodes.js:697)
- Category validation: [`AINodes.js:1436-1466`](AINodes.js:1436)
- SAFE_CATEGORIES: [`AINodes.js:1420-1422`](AINodes.js:1420)
- Factory registry: [`EnhancedNodeModels.js:1419-1460`](EnhancedNodeModels.js:1419)
- Mythic factories: [`EnhancedNodeModels.js:6444-6476`](EnhancedNodeModels.js:6444)
- Prime factories: [`EnhancedNodeModels.js:6687-6709`](EnhancedNodeModels.js:6687)
- NODE_VISUAL_REGISTRY: [`NodeVisualRegistry.js:100-123`](NodeVisualRegistry.js:100)
- Spawn statistics: [`AINodes.js:895-897`](AINodes.js:895)
- Category counts: [`AINodes.js:4415-4417`](AINodes.js:4415)

---

**Audit Complete**
**Status:** No structural issues found. Mythic/prime are fully integrated and should spawn with 8.33% probability each.

**Next Steps:** Enable debug logging and monitor runtime behavior to identify practical issues.
