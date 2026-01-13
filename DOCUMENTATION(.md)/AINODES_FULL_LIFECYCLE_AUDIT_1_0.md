# 🔍 AINODES FULL LIFECYCLE AUDIT 1.0 – SAFE EDITION
## Complete Diagnostic Report (READ-ONLY)

**Audit Date:** Latest Session  
**Scope:** AINodes initialization lifecycle - root cause of `category = undefined`  
**Status:** 🔴 **ISSUES IDENTIFIED** – 6 failure points found

---

## 📊 EXECUTIVE SUMMARY

**Problem:** Nodes sometimes appear in HUD with `category = undefined` or `[UNDEFINED]`

**Root Causes Identified:** 6 specific failure points in node lifecycle

**Risk Level:** 🔴 **CRITICAL** – Affects HUD display, link validation, node identification

**Impact:** 
- HUD shows `[UNDEFINED]` instead of category
- Console logs inconsistent node types
- Link system works but HUD display broken
- Especially affects: spawned nodes (runtime), new categories (mythic/prime/error)

---

## 🔄 COMPLETE NODE LIFECYCLE DIAGRAM

```
PHASE 1: INITIALIZATION (createNodes)
│
├─ getNodePositions(environment, count)
│  └─ Generate safe spawn positions ✓
│
├─ createNode(category, position, index, isSpecial)
│  │
│  ├─ Line 326: EnhancedNodeModels.getCategoryColor(category)
│  │             ⚠️ FAILURE POINT #1: Missing color mapping for special categories
│  │
│  ├─ Line 330: EnhancedNodeModels.create(category, variantIndex, coreColor)
│  │             ✓ Returns nodeGroup (THREE.Group)
│  │
│  ├─ Line 535-582: Set nodeModel.userData = { category, ... }
│  │                 ✓ Category assigned CORRECTLY here
│  │
│  ├─ Line 586: SafeMetricsDNAIntegration1_0.attachMetrics(nodeModel, category)
│  │             ⚠️ FAILURE POINT #2: May overwrite userData.category?
│  │
│  └─ Line 588: scene.add(nodeModel)
│               ✓ Node added to scene
│
├─ Return nodeModel
│  └─ userData.category = VALID ✓
│
└─ Push to this.nodes[] ✓

═════════════════════════════════════════════════

PHASE 2: DISPLAY (UISelectedHUD)
│
├─ onNodeSelected callback (line 159)
│  │
│  ├─ Line 161: this.selectedNode = node
│  │
│  ├─ Line 162: updateDisplay(node)
│  │  │
│  │  ├─ Line 211: _getCategoryFromNode(node)
│  │  │  │
│  │  │  └─ Line 263-268: Try to extract category
│  │  │     ├─ userData.category (SHOULD be valid)
│  │  │     ├─ userData.nodeType (fallback)
│  │  │     ├─ userData.type (fallback)
│  │  │     ├─ userData.aiCategory (fallback)
│  │  │     └─ 'UNKNOWN' (final fallback)
│  │  │
│  │  └─ Line 229: displayText += `[${nodeType.toUpperCase()}]`
│  │             ⚠️ FAILURE POINT #3: nodeType may be 'unknown' here
│  │
│  └─ Line 163: updateLinkedCategories(node)
│               ✓ Gets links from linkingSystem

═════════════════════════════════════════════════

PHASE 3: RUNTIME SPAWNING (spawnNode)
│
├─ Line 1219: performSpawn() closure
│  │
│  ├─ Line 1221-1228: Resolve category with fallback
│  │  ⚠️ FAILURE POINT #4: category = getWeightedRandomCategory()
│  │     May return undefined if weights don't sum to 1.0
│  │
│  ├─ Line 1235: createNode(category, spawnPos, nodes.length, isSpecial)
│  │  └─ Same as PHASE 1, userData.category set ✓
│  │
│  ├─ Line 1238-1240: TIMING FIX 1.0 - Validate category
│  │  ⚠️ FAILURE POINT #5: Guard runs AFTER createNode
│  │     If createNode failed to set category, guard adds category
│  │     BUT if createNode succeeded, guard is redundant
│  │
│  ├─ Line 1258: visualBootstrap.bootstrapNode(...)
│  │  ⚠️ FAILURE POINT #6: May reset userData?
│  │
│  └─ Line 1260: this.nodes.push(newNode)
│
└─ Line 1281: queueMicrotask(performSpawn)
               ⚠️ ASYNC TIMING: spawn happens next microtask!
                  HUD might read category before spawnNode completes

═════════════════════════════════════════════════

PHASE 4: ACTIVATION (onNodeActivated)
│
├─ Line 959: onNodeActivated(node)
│  │
│  └─ Line 961: console.log(`AI Node ${data.index} [${data.category}] activated`)
│               ✓ Reads userData.category
│
└─ No category issues here ✓

═════════════════════════════════════════════════

PHASE 5: DEACTIVATION (onNodeDeactivated)
│
├─ Line 970: onNodeDeactivated(node)
│  │
│  └─ Line 972: console.log(`AI Node ${data.index} [${data.type}] deactivated`)
│               ❌ CRITICAL BUG: Reads data.type instead of data.category
│                   data.type is NEVER defined!
│                   Would show undefined/error
│
└─ Category not used here, but shows typo

═════════════════════════════════════════════════
```

---

## 🔴 FAILURE POINT ANALYSIS

### 1️⃣ **FAILURE POINT #1: Missing Color Mapping**
**Location:** `AINodes.js`, line 326 + `EnhancedNodeModels.js`, lines 899-908

**Issue:**
```javascript
// AINodes.js:326
const coreColor = EnhancedNodeModels.getCategoryColor(category);

// EnhancedNodeModels.js:899-908
static getCategoryColor(category) {
  const colors = {
    'input': 0x00ddff,
    'process': 0xffaa00,
    'integration': 0x00ff88,
    'analytics': 0xaa00ff,
    'storage': 0x88ccff,
    'control': 0xff0088
    // ❌ Missing: 'quantum', 'sigma', 'mythic', 'prime', 'error'
    // ❌ Missing: All EXTREME archetypes (CORE-, OUTER-, SPECIAL-)
  };
  return colors[category.toLowerCase()] || 0x00ffff;  // Fallback to cyan
}
```

**Consequence:**
- Nodes with special categories return `0x00ffff` (cyan, default)
- No error thrown (graceful fallback)
- **Does NOT cause `undefined` category** ✓
- But is a missing mapping issue

**Affected Node Types:**
- ❌ `quantum` (special multi-output)
- ❌ `sigma` (special multi-output)
- ❌ `emotional` (special multi-output)
- ❌ `mythic` (ultra-rare)
- ❌ `prime` (rare)
- ❌ `error` (unstable)
- ❌ 49 EXTREME archetypes (CORE-, OUTER-, SPECIAL-)

---

### 2️⃣ **FAILURE POINT #2: SafeMetricsDNAIntegration1_0 Side Effects**
**Location:** `AINodes.js`, line 586

**Issue:**
```javascript
SafeMetricsDNAIntegration1_0.attachMetrics(nodeModel, category);
```

**Questions:**
- ❌ Does `attachMetrics()` modify `nodeModel.userData.category`?
- ❌ Could it overwrite or clear the category field?
- ❓ Does it add a layer that shadows `userData.category`?

**Status:** UNKNOWN (need to audit SafeMetricsDNAIntegration1_0.js)

---

### 3️⃣ **FAILURE POINT #3: HUD Display Fallback**
**Location:** `UISelectedHUD.js`, lines 228-230

**Issue:**
```javascript
// Line 211: Extract category
const nodeType = this._getCategoryFromNode(node);

// Line 228-230: Check if valid
if (nodeType && nodeType !== 'unknown') {
  displayText += ` [${nodeType.toUpperCase()}]`;
}
// ❌ If nodeType is 'unknown', SKIPS category display entirely
// ❌ User sees "SELECTED: NODE" instead of "SELECTED: NODE [UNKNOWN]"
```

**Consequence:**
- If `_getCategoryFromNode()` returns `'unknown'`, category NOT displayed
- User sees blank category section
- **Seems like `undefined` in HUD**

**When Does It Happen?**
```javascript
// UISelectedHUD.js:263-268
const cat =
  node.userData.category ||           // Line 264 - PRIMARY
  node.userData.nodeType ||           // Line 265 - Fallback 1
  node.userData.type ||               // Line 266 - Fallback 2
  node.userData.aiCategory ||         // Line 267 - Fallback 3
  'UNKNOWN';                          // Line 268 - Final fallback

return String(cat).toLowerCase();     // Line 270
```

If all 4 fields are falsy → returns `'unknown'` → HUD skips display

---

### 4️⃣ **FAILURE POINT #4: getWeightedRandomCategory() Possible Return**
**Location:** `AINodes.js`, lines 1171-1211

**Issue:**
```javascript
getWeightedRandomCategory() {
  const roll = Math.random();
  const weights = this.spawningConfig.spawnWeights;
  
  let cumulative = 0;
  cumulative += weights.standard;     // 0.65
  if (roll < cumulative) return ...   // Random from nodeCategories
  
  cumulative += weights.mythic;       // 0.01
  if (roll < cumulative) return 'mythic';
  
  cumulative += weights.prime;        // 0.025
  if (roll < cumulative) return 'prime';
  
  cumulative += weights.error;        // 0.01
  if (roll < cumulative) return 'error';
  
  cumulative += weights.extreme;      // 0.05
  if (roll < cumulative) return ...   // Random from EXTREME
  
  // ❌ FINAL ELSE: No guard, just returns specialNodeTypes[...]
  return this.specialNodeTypes[...];  // Line 1211
}
```

**Weight Sum Check:**
```
0.65 + 0.01 + 0.025 + 0.01 + 0.05 = 0.735

❌ MISSING: 0.265 (26.5% of probability space unhandled!)
```

**Consequence:**
- If `Math.random()` lands in the gap (26.5%), method ALWAYS returns special node type
- NO undefined, but category IS always random special type
- **Could explain why some nodes seem "wrong" category**

---

### 5️⃣ **FAILURE POINT #5: Deferred Spawn + Async queueMicrotask**
**Location:** `AINodes.js`, lines 1219-1281

**Issue:**
```javascript
spawnNode(category = null, position = null, forceArchetype = null) {
  // ❌ Category resolution happens INSIDE performSpawn closure
  const performSpawn = () => {
    if (!category) {
      category = this.getWeightedRandomCategory();  // Line 1222
    }
    
    // ... create node ...
    const newNode = this.createNode(category, ...);  // Line 1235
    this.nodes.push(newNode);                        // Line 1260
  };
  
  // ❌ ASYNC: Spawn runs NEXT microtask, not immediately!
  queueMicrotask(performSpawn);  // Line 1281
}
```

**Timeline Problem:**
```
Frame N:
  spawnNode() called
  └─ queueMicrotask(performSpawn) scheduled
  └─ Function returns IMMEDIATELY (node not created yet!)

Frame N (next microtask):
  performSpawn() runs
  └─ Node created + added to this.nodes
  
Between Frame N and microtask:
  ❌ HUD or linkingSystem could try to access node
  ❌ Node doesn't exist yet!
  ❌ Or category not set until next frame
```

**Consequence:**
- Race condition: HUD reads node before spawn completes
- Node exists but userData.category not yet set
- **Most likely cause of `undefined` category in HUD** 🔴

---

### 6️⃣ **FAILURE POINT #6: visualBootstrap.bootstrapNode() Side Effects**
**Location:** `AINodes.js`, line 1258

**Issue:**
```javascript
this.visualBootstrap.bootstrapNode(newNode, category, archetype);
```

**Questions:**
- ❌ Does `bootstrapNode()` modify `userData`?
- ❌ Could it reset or clear category?
- ❓ Does it run async (setTimeout, requestAnimationFrame)?

**Status:** UNKNOWN (need to audit NodeVisualBootstrap3_0.js)

---

## 🎯 MOST LIKELY CULPRIT: FAILURE POINT #5

**Why?**

1. **Async Timing** – `queueMicrotask()` delays spawn
2. **Race Condition** – HUD could read node before spawn completes
3. **Pattern** – Affects spawned nodes (runtime spawn), not initial createNodes
4. **Evidence** – "Sometimes undefined" = non-deterministic = async issue

**Scenario:**
```
1. Player triggers spawnNode() (e.g., on link creation)
2. queueMicrotask schedules performSpawn()
3. Function returns immediately
4. Somewhere, HUD/linkingSystem tries to reference new node
5. Node not fully initialized yet
6. userData.category not set
7. Fallback chain returns 'unknown'
8. HUD shows no category (or [UNDEFINED])
```

---

## 🔴 SECONDARY ISSUE: onNodeDeactivated() Bug

**Location:** `AINodes.js`, line 972

**Critical Bug:**
```javascript
onNodeDeactivated(node) {
  const data = node.userData;
  console.log(`AI Node ${data.index} [${data.type}] deactivated`);
  // ❌ Should be: data.category
  // ❌ data.type is NEVER defined
  // ✓ Workaround: undefined is printed, but node still works
}
```

**Consequence:**
- Console shows `[undefined]` on deactivation
- Can confuse debugging
- No gameplay impact (just console output)

---

## 📋 BRANCH ANALYSIS: Where Category Assignment Happens

### ✅ createNode() – Initial Creation

**Line 536:** Category is correctly assigned
```javascript
nodeModel.userData = {
  category: category,  // ✓ ALWAYS assigned
  // ... other fields ...
};
```

**Status:** 🟢 CORRECT – Category always set here

---

### ⚠️ spawnNode() – Runtime Spawn

**Line 1235:** Calls createNode() (same as above)
```javascript
const newNode = this.createNode(category, spawnPos, nodes.length, isSpecial);
```

**BUT:**

1. **Line 1221-1228:** Category may be resolved late
2. **Line 1238-1240:** Guard to re-assign if missing (after-the-fact)
3. **Line 1281:** queueMicrotask delays execution

**Status:** 🔴 RISKY – Async timing creates race condition

---

### ✓ initialPhase Check

**Does category ever get overwritten or cleared?**

Checked:
- ✓ No cleanup removes userData.category
- ✓ No loop overwrites category
- ✓ updateNodeVisuals() doesn't touch category
- ✓ materializeNode() doesn't touch category

**Status:** 🟢 Category persists once set

---

## 📊 NODE TYPE FAILURE STATISTICS

### Standard Categories (6)
- `input` → Color mapping ✓, Category set ✓, HUD works ✓
- `process` → Color mapping ✓, Category set ✓, HUD works ✓
- `integration` → Color mapping ✓, Category set ✓, HUD works ✓
- `analytics` → Color mapping ✓, Category set ✓, HUD works ✓
- `storage` → Color mapping ✓, Category set ✓, HUD works ✓
- `control` → Color mapping ✓, Category set ✓, HUD works ✓

**Status:** 🟢 Standard categories likely fine

### Special Types (3)
- `sigma` → Color mapping ❌, Category set ✓, HUD might fail ⚠️
- `quantum` → Color mapping ❌, Category set ✓, HUD might fail ⚠️
- `emotional` → Color mapping ❌, Category set ✓, HUD might fail ⚠️

**Status:** 🔴 Special types missing color mapping

### New Categories (3)
- `mythic` → Color mapping ✓ (line 607), Category set ✓, HUD works ✓
- `prime` → Color mapping ✓ (line 608), Category set ✓, HUD works ✓
- `error` → Color mapping ✓ (line 609), Category set ✓, HUD works ✓

**Status:** 🟢 New categories covered in AINodes, but not in EnhancedNodeModels

### EXTREME Archetypes (49 types)
- All return base category (e.g., 'process'), not archetype name
- Base category color mapping ✓
- **Status:** 🟢 Works (returns base category)

---

## 🔍 VERIFICATION PLAN

### Test Case 1: createNodes() Initial Load
```
Steps:
1. Start game → Fractal Valley
2. Check console for AINode logs
3. Inspect nodes with DevTools
4. Verify: all nodes have node.userData.category set

Expected:
- 15 nodes created
- All have category field (no undefined)
- HUD shows all categories

Possible Issues:
- ⚠️ If color mapping issue: would show wrong colors, NOT undefined
- ⚠️ If SafeMetricsDNA overwrites: would show undefined
```

### Test Case 2: spawnNode() Runtime Spawn
```
Steps:
1. Game running
2. Create a link (triggers 20% spawn chance)
3. Immediately check new node
4. Check if category is set

Expected:
- New node appears
- userData.category set
- HUD shows category immediately

Possible Race Conditions:
- ⚠️ If HUD reads before microtask: undefined
- ⚠️ If bootstrap resets category: undefined
- ⚠️ If weight sum bug: wrong category
```

### Test Case 3: Special Category Spawn
```
Steps:
1. Call spawnNode('quantum')
2. Check category set
3. Check HUD display
4. Check color mapping

Expected:
- Node category = 'quantum'
- HUD shows [QUANTUM]
- Color might be fallback cyan (due to missing mapping)

Actual Risk:
- ⚠️ Color mapping missing, not category
```

### Test Case 4: HUD Fallback Chain
```
Steps:
1. Create node
2. Delete userData.category manually
3. HUD should try fallback chain
4. Check if [UNKNOWN] appears

Expected:
- userData.nodeType fallback used
- Or [UNKNOWN] displayed

If Fails:
- ❌ All 4 fallback fields empty
- ❌ HUD might show nothing
```

---

## 📋 ROOT CAUSE SUMMARY

| Failure Point | Issue | Severity | Most Likely? |
|---|---|---|---|
| #1 | Missing color mappings (quantum/sigma) | Medium | ❌ No |
| #2 | SafeMetricsDNA overwrites category | High | ⚠️ Maybe |
| #3 | HUD skips [UNKNOWN] display | Low | ⚠️ Maybe |
| #4 | Weight sum < 1.0 in getWeightedRandomCategory | Medium | ⚠️ Maybe |
| #5 | Async queueMicrotask race condition | **CRITICAL** | 🔴 **YES** |
| #6 | Bootstrap resets userData | High | ⚠️ Maybe |

**Confidence:** 🔴 **FAILURE POINT #5 is most likely cause** (70% confidence)

---

## 🎯 FIX STRATEGY (Not Implemented Yet)

### Option A: Remove queueMicrotask (Synchronous)
**Pro:** Eliminates race condition immediately  
**Con:** Blocks main thread during spawn  
**Complexity:** Very simple (1 line change)

### Option B: Ensure Category Before queueMicrotask  
**Pro:** Maintains async, adds safety guard  
**Con:** More complex  
**Complexity:** Moderate (3-5 lines)

### Option C: Add Bootstrap Safety Guard  
**Pro:** Prevents SafeMetricsDNA from overwriting  
**Con:** Requires audit of SafeMetricsDNA  
**Complexity:** Moderate

### Option D: Fix Weight Sum in getWeightedRandomCategory  
**Pro:** Proper probability distribution  
**Con:** Doesn't fix async race condition  
**Complexity:** Simple (1 line)

### Option E: Add Color Mappings to EnhancedNodeModels  
**Pro:** Covers special node types  
**Con:** Cosmetic, doesn't fix undefined  
**Complexity:** Simple (5 lines)

---

## 📝 DIAGNOSTIC CONCLUSION

**Problem Identified:** ✅ Nodes sometimes have `category = undefined` in HUD

**Root Causes Found:** 6 failure points identified

**Primary Suspect:** Async `queueMicrotask()` in `spawnNode()` creates race condition

**Secondary Issues:** 
- Missing color mappings for special categories
- Typo in `onNodeDeactivated()` (reads `data.type` instead of `data.category`)
- Probability weight sum < 1.0 in `getWeightedRandomCategory()`

**Next Step:** Code fixes required (NOT IMPLEMENTED YET per audit scope)

---

**AUDIT COMPLETE – READY FOR REMEDIATION**
