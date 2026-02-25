# ATOMA – STATIC CODE AUDIT
## PHASE: ENTITY ID RESOLVE PATH ANALYSIS

**Audit Date:** 2026-02-15  
**Scope:** Entire codebase  
**Mode:** STRICTLY STATIC ANALYSIS (No code execution, no modifications)

---

# EXECUTIVE SUMMARY

**Key Finding:** ATOMA uses **NO canonical identity resolver function**. Each system implements its own resolve logic with inconsistent patterns. Parent traversal is present in multiple locations, and fallback anti-patterns (OR-chains) are widespread in the primary `getNodeId()` helper.

**Identity Resolution Paths:**
1. **Hit-proxy path** – `proxyHits[0].nodeId || proxyHits[0].object?.userData?.targetNodeId`
2. **Visual core mesh path** – Parent traversal to find node in `aiNodes.nodes` array
3. **Fallback path** – `getNodeId()` helper with OR-chain: `userData.nodeId || uuid || id`

**Risk Level:** HIGH – Inconsistent identity resolution, no centralized authority, fallback chains throughout.

---

# SECTION 1 — IDENTITY RESOLVE MAP

## 1.1 NodeLinkingSystem.js

| Line | Resolve Method | Traversal? | Fallback Used? | Identity Source | Deterministic? | Notes |
|------|----------------|-------------|-----------------|----------------|----------------|-------|
| **~4000** | `getNodeAtPosition()` - Hit-proxy path | N | **YES** | `proxyHits[0].nodeId \| proxyHits[0].object?.userData?.targetNodeId` | **NO** | OR-chain fallback between nodeId and targetNodeId |
| **~4020** | `getNodeAtPosition()` - Node lookup | N | **YES** | `window.getNodeIdentity(n) \| n.userData?.id \| n.userData?.nodeId \| n.uuid` | **NO** | 4-way OR-chain fallback |
| **~4070** | `getNodeAtPosition()` - Visual core raycast | **YES** | N | Parent traversal via `while (parentNode)` | **YES** | `aiNodes.nodes.includes(parentNode)` check |
| **~2000** | `getNodeId()` helper | N | **YES** | `userData.nodeId \|\| uuid \|\| id` | **NO** | **ANTI-PATTERN**: 3-way OR-chain fallback |
| **~2100** | `findParentAINode()` | **YES** | N | Parent traversal | **YES** | `while (current)` loop checking `aiNodes.nodes.includes(current)` |
| **~4300** | `_getNodeAtPositionFromProxies()` | N | N | `filtered[0].object?.userData?.targetNodeId` | **YES** | Direct userData access |
| **~4400** | `_getNodeAtPositionDirect()` | **YES** | N | Parent traversal | **YES** | `while (obj)` loop checking `obj.userData?.id` |
| **~3500** | `updateCrosshairNodeTargeting()` | N | **YES** | `filtered[0].object?.userData?.targetNodeId \| filtered[0].nodeId` | **NO** | OR-chain fallback, then 3-way lookup |
| **~1800** | `_getNodeId()` (private helper) | N | **YES** | `userData.id \|\| userData.nodeId \| uuid` | **NO** | 3-way OR-chain fallback |

## 1.2 NodeInspectOverlay3_0.js

| Line | Resolve Method | Traversal? | Fallback Used? | Identity Source | Deterministic? | Notes |
|------|----------------|-------------|-----------------|----------------|----------------|-------|
| **~140** | `onMouseClick()` | N | N | `obj.userData.category` | **NO** | Only checks category, no node ID |
| **~145** | Post-filter | N | N | `filterRaycastIntersections()` | **UNKNOWN** | Delegates to external filter function |

## 1.3 AINodes.js

| Line | Resolve Method | Traversal? | Fallback Used? | Identity Source | Deterministic? | Notes |
|------|----------------|-------------|-----------------|----------------|----------------|-------|
| **[search result]** | Direct scene raycast | N | N | `this.scene.children` | **NO** | **CRITICAL**: No identity metadata extracted |

## 1.4 NodeEditor.js

| Line | Resolve Method | Traversal? | Fallback Used? | Identity Source | Deterministic? | Notes |
|------|----------------|-------------|-----------------|----------------|----------------|-------|
| **~310** | Constructor internal array | N | N | `this.nodes` array | **YES** | Debug-only system |
| **~380** | Link line array | N | N | `this.links.map(l => l.curve.line)` | **YES** | Debug-only, link-only |

---

# SECTION 2 — PARENT TRAVERSAL PATTERNS

## 2.1 Explicit Parent Traversal Functions

### Function: `findParentAINode(mesh)` (NodeLinkingSystem.js, ~2100)

```javascript
findParentAINode(mesh) {
  let current = mesh;
  while (current) {
    if (this.aiNodes.nodes.includes(current)) {
      return current;
    }
    current = current.parent;
  }
  return null;
}
```

**Pattern:** `while(obj) { if (aiNodes.nodes.includes(obj)) return obj; obj = obj.parent; }`

**Usage Locations:**
- Called from `getNodeAtPosition()` after core mesh raycast hit
- Called from visual mesh raycast fallback paths

**Deterministic:** YES (if node is in hierarchy)

**Complexity:** O(depth) where depth = hierarchy depth

---

### Inline Parent Traversal in `getNodeAtPosition()` (NodeLinkingSystem.js, ~4070)

```javascript
if (intersects.length > 0) {
  const hitMesh = intersects[0].object;
  let parentNode = hitMesh;
  
  while (parentNode) {
    if (this.aiNodes.nodes.includes(parentNode)) {
      return parentNode;
    }
    parentNode = parentNode.parent;
  }
}
```

**Pattern:** Same as `findParentAINode()` but inline

**Usage:** Visual core mesh raycast path

---

### Inline Parent Traversal in `_getNodeAtPositionDirect()` (NodeLinkingSystem.js, ~4400)

```javascript
if (intersects.length > 0) {
  for (const intersection of intersects) {
    let obj = intersection.object;
    while (obj) {
      if (obj.userData?.id && this.aiNodes.nodes.includes(obj)) {
        return obj;
      }
      obj = obj.parent;
    }
  }
}
```

**Pattern:** Parent traversal with `userData?.id` check

**Usage:** Debug mode direct node selection

---

## 2.2 Recursive Traversal Patterns

**Status:** NO recursive traversal patterns detected in identity resolution

All parent traversals use iterative `while(obj)` loops, not recursive functions.

---

## 2.3 findParentNode Variants

**Status:** NO `findParentNode()` function found

Found: `findParentAINode(mesh)` only

---

# SECTION 3 — FALLBACK IDENTITY PATTERNS

## 3.1 Critical Anti-Pattern: `getNodeId()` Helper (NodeLinkingSystem.js, ~2000)

```javascript
getNodeId(node) {
  if (!node) return null;
  
  // Primary: Dedicated nodeId field
  if (node.userData && node.userData.nodeId) {
    return node.userData.nodeId;
  }
  
  // Fallback 1: THREE.js uuid (always present)
  if (node.uuid) {
    return node.uuid;
  }
  
  // Fallback 2: Legacy id field
  if (node.id) {
    return String(node.id);
  }
  
  return null;
}
```

**Anti-Pattern:** 3-way OR-chain fallback

**Issues:**
1. **Non-deterministic**: Different nodes may resolve via different paths
2. **Identity drift**: Node could return `userData.nodeId` today, `uuid` tomorrow if userData is cleared
3. **Debugging nightmare**: Cannot trace which ID was used
4. **Lookup inconsistency**: Maps/sets built with `getNodeId()` may contain mixed ID types

**Priority:** CRITICAL

---

## 3.2 Hit-Proxy Identity OR-Chain (NodeLinkingSystem.js, ~3500)

```javascript
const nodeId = proxyHits[0].nodeId || proxyHits[0].object?.userData?.targetNodeId;
```

**Anti-Pattern:** 2-way OR-chain fallback

**Issues:**
1. **Inconsistent metadata**: Some proxies use `.nodeId`, others use `.userData.targetNodeId`
2. **No validation**: No check that both values refer to same node
3. **Silent fallback**: Fallback happens without logging/debug visibility

**Priority:** HIGH

---

## 3.3 Crosshair Targeting Identity OR-Chain (NodeLinkingSystem.js, ~3500)

```javascript
const nodeId = filtered[0].object?.userData?.targetNodeId || filtered[0].nodeId;

const hitNode = this.aiNodes.nodes.find(n => {
  const identity = (typeof window !== 'undefined' && window.getNodeIdentity)
    ? window.getNodeIdentity(n)
    : (n.userData?.id || n.userData?.nodeId || n.uuid);
  return identity === nodeId || n.userData?.id === nodeId || n.userData?.nodeId === nodeId;
});
```

**Anti-Pattern:** 4-way OR-chain fallback

**Issues:**
1. **Double OR-chain**: One OR-chain to get `nodeId`, another OR-chain to compare
2. **Mixed comparison**: Comparing `identity === nodeId` (OR-chain result) against three different node properties
3. **Window function dependency**: Falls back to internal OR-chain if `window.getNodeIdentity` missing

**Priority:** CRITICAL

---

## 3.4 Fallback Summary

| Location | OR-Chain Length | Properties | Risk Level |
|----------|-----------------|------------|-------------|
| `getNodeId()` | 3-way | `userData.nodeId \|\| uuid \|\| id` | CRITICAL |
| Hit-proxy resolve | 2-way | `nodeId \|\| userData.targetNodeId` | HIGH |
| Crosshair lookup | 4-way | `getNodeIdentity() \|\| userData.id \|\| userData.nodeId \|\| uuid` | CRITICAL |

---

# SECTION 4 — CANONICAL RESOLVER PRESENCE

## 4.1 Is There a Canonical Identity Resolver Function?

**Answer:** NO

**Evidence:**
1. `getNodeId()` exists but is **NOT canonical** (has fallbacks)
2. No `resolveEntityFromRaycast()` function
3. No `getEntityIdentity()` function
4. Each system implements its own resolve logic

---

## 4.2 Does Each System Implement Its Own Resolve Logic?

**Answer:** YES

**Systems with Custom Resolve Logic:**

1. **NodeLinkingSystem.js**
   - `getNodeAtPosition()` – Custom hit-proxy + visual mesh logic
   - `getNodeId()` – Custom fallback helper
   - `findParentAINode()` – Custom parent traversal
   - `_getNodeAtPositionFromProxies()` – Custom proxy-only logic
   - `_getNodeAtPositionDirect()` – Custom debug mode logic

2. **NodeInspectOverlay3_0.js**
   - `onMouseClick()` – Custom scene traversal + category filter
   - Delegates to `filterRaycastIntersections()` (external)

3. **AINodes.js**
   - Direct `scene.children` raycast (no resolve logic at all)

4. **NodeEditor.js**
   - Internal array lookups (debug-only, not production)

---

## 4.3 Shared Resolve Functions?

**Status:** PARTIAL

**Shared Functions:**
- `filterRaycastIntersections()` – Used in multiple places (external import)
- `getNodeId()` – Used only within NodeLinkingSystem.js

**NOT Shared:**
- No global `resolveNodeIdentity()` function
- No global `getEntityFromRaycast()` function

---

# SECTION 5 — DETERMINISM ASSESSMENT

## 5.1 Deterministic vs Non-Deterministic Patterns

### DETERMINISTIC PATTERNS ✓

| Pattern | Location | Why Deterministic |
|---------|-----------|-------------------|
| `userData.targetNodeId` | Hit-proxy system | Direct property access, no fallback |
| Parent traversal to `aiNodes.nodes.includes()` | NodeLinkingSystem | Always returns same node if in hierarchy |
| Direct array lookup | NodeEditor | Array reference comparison |

### NON-DETERMINISTIC PATTERNS ✗

| Pattern | Location | Why Non-Deterministic |
|---------|-----------|----------------------|
| `userData.nodeId \|\| uuid \|\| id` | `getNodeId()` | Different nodes may use different fallback paths |
| `nodeId \|\| userData.targetNodeId` | Hit-proxy resolve | Inconsistent metadata across proxies |
| `getNodeIdentity() \|\| userData.id \|\| userData.nodeId \|\| uuid` | Crosshair lookup | 4-way OR-chain with mixed sources |

---

## 5.2 Identity Drift Risk

**Risk Level:** HIGH

**Scenarios:**

1. **World Switch / Reset**
   - `userData.nodeId` may be cleared
   - Falls back to `uuid`
   - Existing maps/sets with old IDs break

2. **Node Cloning**
   - Cloned node has same `userData.nodeId`
   - But different `uuid`
   - Which ID wins in OR-chain?

3. **Memory Corruption**
   - `userData` object may be garbage collected
   - Falls back to `uuid`
   - Different identity for same logical node

4. **Serialization / Deserialization**
   - `userData.nodeId` may be preserved
   - `uuid` may change (THREE.js generates new UUID)
   - Which ID is authoritative?

---

## 5.3 Lookup Consistency

**Problem:** Different systems use different properties to identify nodes

| System | Identity Property | Fallback? |
|--------|------------------|------------|
| Hit-proxy registry | `userData.targetNodeId` | No |
| NodeLinkingSystem | `userData.nodeId` | YES (`uuid`, `id`) |
| Crosshair targeting | `targetNodeId` OR `nodeId` | YES |
| AI nodes array | Array reference | No |

**Impact:**
- Same logical node may have multiple identities in different systems
- Maps built with one ID cannot be queried with another
- Debugging requires checking all possible ID properties

---

## 5.4 Overall Determinism Assessment

**Score: 3/10** (Poor)

**Justification:**
1. **No canonical ID**: Multiple competing ID sources
2. **OR-chain fallbacks**: Non-deterministic which ID is used
3. **Inconsistent across systems**: Different systems use different properties
4. **Parent traversal adds uncertainty**: Depends on hierarchy structure
5. **No validation**: No checks that different ID sources agree

---

# CONCLUSION

ATOMA's entity identity resolution architecture is **fragmented and inconsistent**. There is no canonical resolver function, and each system implements its own logic with varying patterns. Widespread OR-chain fallbacks create non-deterministic behavior where the same logical node may be identified by different IDs in different contexts. Parent traversal is used in multiple locations, adding complexity and dependency on scene hierarchy structure.

**Overall Risk Level:** HIGH

**Critical Issues:**
1. No canonical identity resolver function
2. 3-way OR-chain fallback in `getNodeId()` helper
3. Inconsistent metadata across hit-proxy system (`nodeId` vs `targetNodeId`)
4. Non-deterministic identity resolution across systems
5. Identity drift risk during world switches / node lifecycle events

**Architectural Health:** NEEDS CONSOLIDATION

**Stability Assessment:** POOR

**Recommendations (for future refactoring only, not implemented):**
1. Create canonical `resolveNodeIdentity(node)` function with no fallbacks
2. Standardize on single metadata property (`userData.nodeId`) across all systems
3. Eliminate OR-chain fallbacks entirely
4. Validate that all ID sources agree (assertion checks in development)
5. Deprecate `uuid` and `id` as identity sources, use only for debugging

---

**END OF AUDIT**