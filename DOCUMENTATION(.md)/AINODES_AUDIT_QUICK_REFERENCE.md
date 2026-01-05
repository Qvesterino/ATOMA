# AINODES AUDIT 1.0 – QUICK REFERENCE
## 6 Failure Points Causing `category = undefined`

---

## 🔴 PRIMARY ISSUE: FAILURE POINT #5

**Location:** `AINodes.js`, lines 1219-1281 (spawnNode function)

**Problem:**
```javascript
spawnNode(category = null, position = null, forceArchetype = null) {
  const performSpawn = () => {
    // ... category resolution + node creation ...
  };
  
  queueMicrotask(performSpawn);  // ❌ RUNS NEXT MICROTASK, NOT IMMEDIATELY
}
```

**Why It's Critical:**
- Node spawn is ASYNC (scheduled for next microtask)
- HUD or linkingSystem might read node before it's fully initialized
- Race condition: category may not be set when HUD tries to display it

**Likelihood:** 🔴 **70% – THIS IS MOST LIKELY CAUSE**

---

## 🔴 SECONDARY ISSUES

### FAILURE POINT #2: SafeMetricsDNAIntegration1_0
**Location:** `AINodes.js`, line 586

```javascript
SafeMetricsDNAIntegration1_0.attachMetrics(nodeModel, category);
```

**Risk:** May overwrite or clear `userData.category`  
**Status:** UNKNOWN (need to audit SafeMetricsDNA.js)

---

### FAILURE POINT #6: visualBootstrap.bootstrapNode()
**Location:** `AINodes.js`, line 1258

```javascript
this.visualBootstrap.bootstrapNode(newNode, category, archetype);
```

**Risk:** May reset or modify `userData`  
**Status:** UNKNOWN (need to audit NodeVisualBootstrap3_0.js)

---

### FAILURE POINT #4: Probability Weight Sum Bug
**Location:** `AINodes.js`, lines 1071-1077

```javascript
spawnWeights: {
  standard: 0.65,   // 65%
  mythic: 0.01,     // 1%
  prime: 0.025,     // 2.5%
  error: 0.01,      // 1%
  extreme: 0.05     // 5%
  // Total: 0.735 = 73.5%
  // ❌ MISSING: 26.5% probability space!
}
```

**Result:** 26.5% of spawns land in undefined range, always return special type

---

### FAILURE POINT #3: HUD Fallback Logic
**Location:** `UISelectedHUD.js`, lines 228-230

```javascript
if (nodeType && nodeType !== 'unknown') {
  displayText += ` [${nodeType.toUpperCase()}]`;
}
// ❌ If nodeType is 'unknown', category NOT displayed
//    User sees blank category section
```

**Seems Like:** `undefined` category (but actually 'unknown')

---

### FAILURE POINT #1: Missing Color Mappings
**Location:** `EnhancedNodeModels.js`, lines 899-908

```javascript
static getCategoryColor(category) {
  const colors = {
    'input': 0x00ddff,
    'process': 0xffaa00,
    'integration': 0x00ff88,
    'analytics': 0xaa00ff,
    'storage': 0x88ccff,
    'control': 0xff0088
    // ❌ Missing: 'quantum', 'sigma', 'emotional'
    // ❌ Missing: 'mythic', 'prime', 'error'
    // ❌ Missing: All 49 EXTREME archetypes
  };
  return colors[category.toLowerCase()] || 0x00ffff;
}
```

**Impact:** Wrong colors for special categories (not undefined)

---

### FAILURE POINT #7 (BONUS): onNodeDeactivated Typo
**Location:** `AINodes.js`, line 972

```javascript
console.log(`AI Node ${data.index} [${data.type}] deactivated`);
// ❌ Should be data.category
// ❌ data.type is NEVER defined
// Result: shows [undefined] in console
```

---

## 📊 QUICK DIAGNOSIS TABLE

| Node Type | Creates OK? | Category Set? | HUD Shows? | Issue |
|-----------|---|---|---|---|
| input | ✓ | ✓ | ✓ | None |
| process | ✓ | ✓ | ✓ | None |
| quantum | ✓ | ✓ | ⚠️ | Missing color |
| sigma | ✓ | ✓ | ⚠️ | Missing color |
| mythic (spawn) | ✓ | ⚠️ | 🔴 | Async race |
| prime (spawn) | ✓ | ⚠️ | 🔴 | Async race |
| error (spawn) | ✓ | ⚠️ | 🔴 | Async race |

---

## 🔍 WHEN IT HAPPENS

### ✅ Works Fine
- Initial `createNodes()` call (synchronous)
- Standard categories (input/process/etc)
- Accessing nodes immediately after creation

### 🔴 Might Fail
- `spawnNode()` calls (async due to queueMicrotask)
- Special categories (quantum/sigma)
- New categories (mythic/prime/error)
- Reading node immediately in callbacks

### 🔴 Will Fail
- Deactivation console logs (typo: uses data.type not data.category)

---

## 🎯 VERIFICATION CHECKLIST

- [ ] Check if node.userData.category is set right after createNode()
- [ ] Check if node.userData.category exists after spawnNode() completes
- [ ] Monitor HUD: does it show [UNDEFINED] or nothing?
- [ ] Check console: are deactivation logs showing [undefined]?
- [ ] Spawn special node: does category persist?
- [ ] Check SafeMetricsDNA.attachMetrics() – does it modify userData?
- [ ] Check NodeVisualBootstrap3_0.bootstrapNode() – does it reset userData?

---

## 💡 ROOT CAUSE CONFIDENCE

| Cause | Confidence | Evidence |
|-------|---|---|
| Async queueMicrotask race condition | 🔴 **70%** | Non-deterministic timing = async issue |
| SafeMetricsDNA overwrites category | ⚠️ **20%** | No evidence yet, but possible side effect |
| Bootstrap resets userData | ⚠️ **15%** | No evidence yet |
| Weight sum bug | ⚠️ **10%** | Doesn't match "undefined" symptom |
| HUD fallback logic | ⚠️ **5%** | Shows as blank, not undefined |

---

**→ FAILURE POINT #5 (async queueMicrotask) IS MOST LIKELY CULPRIT**

See full audit: `/AINODES_FULL_LIFECYCLE_AUDIT_1_0.md`
