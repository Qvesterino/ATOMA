# SPAWN-TIME CATEGORY WHITELIST VALIDATION v1.0

## Overview

**Purpose**: Prevent UNSAFE node categories (mythic, prime, error, emotional) from spawning until their geometry is fully implemented.

**Location**: AINodes.js (createNode method)

**Status**: ✅ **DEPLOYED AND ACTIVE**

---

## What It Does

When you call `aiNodes.createNode(category, position)`:

1. **Validates** the requested category against whitelist
2. **Redirects** deprecated categories to safe equivalents (sigma → quantum)
3. **Blocks** UNSAFE categories, logs warning, falls back to 'input'
4. **Allows** SAFE categories to spawn normally
5. **Stores** validation result in node.userData for debugging

---

## Category Lists

### SAFE_CATEGORIES (7) — Production-Ready

```javascript
AINodes.SAFE_CATEGORIES = [
  'input',        // ✅ Fully implemented
  'process',      // ✅ Fully implemented
  'integration',  // ✅ Fully implemented
  'analytics',    // ✅ Fully implemented
  'storage',      // ✅ Fully implemented
  'control',      // ✅ Fully implemented
  'quantum'       // ✅ Fully implemented
];
```

**Behavior**: Spawn normally, full geometry and materials applied

### UNSAFE_CATEGORIES (4) — Not Implemented

```javascript
AINodes.UNSAFE_CATEGORIES = [
  'mythic',       // ❌ No geometry factory
  'prime',        // ❌ No geometry factory
  'error',        // ❌ No geometry factory
  'emotional'     // ❌ No geometry factory
];
```

**Behavior**: Blocked from spawn, warning logged, falls back to 'input'

### DEPRECATED_CATEGORIES (1) — Redirect

```javascript
AINodes.DEPRECATED_CATEGORIES = {
  'sigma': 'quantum'  // Alias → canonical name
};
```

**Behavior**: Redirected to 'quantum', info logged

---

## Implementation Details

### API: Static Properties

```javascript
// Read-only category lists
AINodes.SAFE_CATEGORIES      // Array of 7 safe categories
AINodes.UNSAFE_CATEGORIES    // Array of 4 unsafe categories
AINodes.DEPRECATED_CATEGORIES // Object mapping old → new
```

### API: validateCategory(requestedCategory)

**Signature**:
```javascript
validateCategory(requestedCategory: string): {
  valid: boolean,           // true if safe to spawn
  category: string,         // final category to use
  reason: string,           // explanation
  redirected?: boolean,     // true if redirected
  blocked?: boolean,        // true if blocked
  unknown?: boolean         // true if unrecognized
}
```

**Returns Object**:

| Key | Type | Meaning |
|-----|------|---------|
| `valid` | boolean | true = safe to spawn, false = unsafe/unknown |
| `category` | string | Final category to use (may differ from requested) |
| `reason` | string | Explanation of validation result |
| `redirected` | boolean | true if deprecated → safe redirect |
| `blocked` | boolean | true if UNSAFE category blocked |
| `unknown` | boolean | true if unrecognized category |

### Validation Logic

```javascript
validateCategory(requestedCategory) {
  const requested = normalize(requestedCategory);
  
  // 1. Check DEPRECATED (redirect)
  if (DEPRECATED_CATEGORIES[requested]) {
    return { valid: true, category: redirectTarget, redirected: true };
  }
  
  // 2. Check SAFE (allow)
  if (SAFE_CATEGORIES.includes(requested)) {
    return { valid: true, category: requested, redirected: false };
  }
  
  // 3. Check UNSAFE (block)
  if (UNSAFE_CATEGORIES.includes(requested)) {
    return { valid: false, category: 'input', blocked: true };
  }
  
  // 4. Unknown (block)
  return { valid: false, category: 'input', unknown: true };
}
```

---

## Console Output

### When Spawning SAFE Category

```javascript
const node = aiNodes.createNode('control', position);
// No output (silent success)
```

### When Spawning DEPRECATED Category

```javascript
const node = aiNodes.createNode('sigma', position);
// Console: [AINodes] ℹ️ CATEGORY REDIRECT: Category 'sigma' is deprecated, redirecting to 'quantum'
```

### When Spawning UNSAFE Category

```javascript
const node = aiNodes.createNode('mythic', position);
// Console: [AINodes] ⚠️ UNSAFE SPAWN ATTEMPT: Category 'mythic' is NOT implemented (geometry missing). Falling back to 'input'. Reason: No createMythicNode() factory in EnhancedNodeModels.
// Console: [AINodes] Category 'mythic' is incomplete. Implement geometry in EnhancedNodeModels.js before spawning.
// Console: [AINodes] See: CANONICAL_NODE_CATEGORY_AUDIT_FINAL_v2.md for details on unsafe categories.
```

### When Spawning UNKNOWN Category

```javascript
const node = aiNodes.createNode('foobar', position);
// Console: [AINodes] ⚠️ UNSAFE SPAWN ATTEMPT: Unknown category 'foobar'. Falling back to 'input'. Use one of: input, process, integration, analytics, storage, control, quantum
```

---

## Node.userData Storage

Validation result stored in spawned node:

```javascript
node.userData = {
  category: 'input',        // Final category (safe)
  requestedCategory: 'mythic', // What user requested
  categoryValidation: {      // Complete validation result
    valid: false,
    category: 'input',
    reason: '...',
    blocked: true
  },
  // ... rest of node userData
}
```

**Usage**:
```javascript
// Check if node had category validation issues
if (!node.userData.categoryValidation.valid) {
  console.log('Node category was unsafe, fallback used');
  console.log('Requested:', node.userData.requestedCategory);
  console.log('Actual:', node.userData.category);
}
```

---

## Behavior Matrix

| Requested | SAFE? | Redirected? | Blocked? | Final Category | Fallback? | Logs |
|-----------|-------|------------|---------|-----------------|-----------|------|
| 'input' | YES | NO | NO | 'input' | NO | silent |
| 'process' | YES | NO | NO | 'process' | NO | silent |
| 'quantum' | YES | NO | NO | 'quantum' | NO | silent |
| 'sigma' | DEPRECATED | YES | NO | 'quantum' | NO | INFO |
| 'mythic' | NO | NO | YES | 'input' | YES | WARN |
| 'prime' | NO | NO | YES | 'input' | YES | WARN |
| 'error' | NO | NO | YES | 'input' | YES | WARN |
| 'emotional' | NO | NO | YES | 'input' | YES | WARN |
| 'foobar' | UNKNOWN | NO | NO | 'input' | YES | WARN |

---

## Code Integration

### In AINodes.createNode()

```javascript
createNode(category, position, index, isSpecial = false) {
  // ========== SPAWN-TIME CATEGORY VALIDATION ==========
  const validation = this.validateCategory(category);
  
  if (!validation.valid) {
    console.warn(`[AINodes] ⚠️ UNSAFE SPAWN ATTEMPT: ${validation.reason}`);
    if (validation.blocked) {
      console.warn(`[AINodes] Category '${category}' is incomplete...`);
    }
  } else if (validation.redirected) {
    console.log(`[AINodes] ℹ️ CATEGORY REDIRECT: ${validation.reason}`);
  }
  
  // Use validated category (may be redirected)
  const safeCategory = validation.category;
  
  // ... rest of spawn logic using safeCategory
}
```

### In Node Data

```javascript
nodeModel.userData = {
  category: safeCategory,         // ✅ Final safe category
  requestedCategory: category,    // 📝 Original request
  categoryValidation: validation,  // 📋 Full result
  // ... other userData
}
```

---

## Use Cases

### 1. Preventing Silent Fallback

**Before**:
- User spawns 'mythic' node
- Silently falls back to INPUT geometry
- User sees INPUT node but metadata says 'mythic'
- Visual degradation after linking

**After**:
- User spawns 'mythic' node
- Console warning explains why it's unsafe
- Documentation link provided
- Geometry developer knows what needs implementation
- Node spawns as 'input' (safe fallback)

### 2. Transparent Deprecation

**Before**:
- User spawns 'sigma' node
- Silently creates quantum node
- No indication that deprecation occurred

**After**:
- User spawns 'sigma' node
- Console info: "Redirecting to 'quantum'"
- Developers know to update code
- Smooth transition path

### 3. Debugging Category Issues

**Before**:
- User reports: "Why does my node look wrong?"
- No way to know what category was requested vs used

**After**:
```javascript
console.log(node.userData.categoryValidation);
// Shows exactly what happened to the category
```

---

## Testing

### Test SAFE Category

```javascript
const node = aiNodes.createNode('control', new THREE.Vector3(0, 0, 0));
console.assert(node.userData.category === 'control', 'Control node spawned');
console.assert(node.userData.categoryValidation.valid === true, 'Validation passed');
```

### Test DEPRECATED Category

```javascript
const node = aiNodes.createNode('sigma', new THREE.Vector3(0, 0, 0));
console.assert(node.userData.category === 'quantum', 'Sigma redirected to quantum');
console.assert(node.userData.categoryValidation.redirected === true, 'Redirected flag set');
```

### Test UNSAFE Category

```javascript
const node = aiNodes.createNode('mythic', new THREE.Vector3(0, 0, 0));
console.assert(node.userData.category === 'input', 'Mythic fell back to input');
console.assert(node.userData.categoryValidation.valid === false, 'Validation failed');
console.assert(node.userData.categoryValidation.blocked === true, 'Blocked flag set');
```

### Test UNKNOWN Category

```javascript
const node = aiNodes.createNode('unknown', new THREE.Vector3(0, 0, 0));
console.assert(node.userData.category === 'input', 'Unknown fell back to input');
console.assert(node.userData.categoryValidation.unknown === true, 'Unknown flag set');
```

---

## Future Enhancements

### Optional: Strict Mode (Throw on Invalid)

```javascript
AINodes.STRICT_MODE = true;  // Default false (graceful fallback)

if (this.strictMode && !validation.valid) {
  throw new Error(`Cannot spawn unsafe category: ${category}`);
}
```

### Optional: Custom Blocklist

```javascript
AINodes.blockedCategories = ['mythic', 'prime'];  // Block specific ones
```

### Optional: Validation Hooks

```javascript
AINodes.onCategoryValidation = (validation) => {
  // Custom handling, logging, telemetry, etc
};
```

---

## Deployment Checklist

- [x] Whitelist constants defined (SAFE, UNSAFE, DEPRECATED)
- [x] validateCategory() method implemented
- [x] Category validation integrated into createNode()
- [x] Console logging for all cases
- [x] Node userData updated with validation result
- [x] Backward compatible (no breaking changes)
- [x] Documentation complete
- [x] Ready for testing

---

## Migration Guide

### For Developers

**If using 'sigma'**:
- Update code to use 'quantum' directly
- Old code still works (redirected automatically)
- Console log will remind you to update

**If using UNSAFE categories** (mythic, prime, error, emotional):
- Cannot spawn until geometry implemented
- Implement the missing factory methods in EnhancedNodeModels.js:
  - `createMythicNode0-3()`
  - `createPrimeNode0-3()`
  - `createErrorNode0-3()`
  - `createEmotionalNode0-3()`
- Add switch cases in `EnhancedNodeModels.create()`
- Update color mappings in `getCategoryColor()`

### For Game Scripts

**Before**:
```javascript
// Might silently fall back to INPUT
const node = aiNodes.createNode('mythic', pos);
```

**After**:
```javascript
// Check validation if you want to know what happened
const node = aiNodes.createNode('mythic', pos);
if (!node.userData.categoryValidation.valid) {
  console.log('Node used fallback:', node.userData.category);
}
```

---

## References

- **Full Audit**: CANONICAL_NODE_CATEGORY_AUDIT_FINAL_v2.md
- **Quick Ref**: NODE_CATEGORY_QUICK_REFERENCE.txt
- **AINodes**: AINodes.js (createNode method)
- **Models**: EnhancedNodeModels.js (geometry factories)

---

## Summary

✅ **What Changed**:
- Category validation added to node spawn
- SAFE categories allowed, UNSAFE blocked, DEPRECATED redirected
- Console logging for transparency
- Validation result stored in node.userData

✅ **What's Protected**:
- Visual integrity (UNSAFE categories can't degrade visuals)
- Developer clarity (console tells you exactly what happened)
- Backward compatibility (existing code still works)

✅ **What's Next**:
- Implement missing 4 geometries for UNSAFE categories
- Test across all environments
- Update documentation as needed

---

**Version**: 1.0 (Stable)  
**Status**: Deployed & Active  
**Created**: Session 60+
