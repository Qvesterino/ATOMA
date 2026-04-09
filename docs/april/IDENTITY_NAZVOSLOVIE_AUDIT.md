# IDENTITY NAZVOSLOVIE AUDIT

**Status:** Current state of ID fields across all systems
**Scope:** Nodes, Links, Glyphs
**Goal:** Document what IDs are currently used

---

## OVERALL STATISTICS

| ID Field | Total Uses | Systems Using |
|-----------|-------------|----------------|
| `userData.id` | 49 | AINodes, HitProxy, AutoRegistrar, ColonyExpansion, ControlSpine |
| `userData.nodeId` | 56 | AINodes, SemanticGlyphAI, GlyphLayer4, HitProxy, SafeEvolution, SafeLegendary, SafeNodePersonality, EnhancedNodeModels |
| `userData.linkId` | 13 | LinkRegistry, LinkManager |
| `userData.glyphId` | 0 | **NOT USED** |

---

## NODES (Uzly)

### Current Usage

| System | Primary ID | Fallback | Pattern |
|---------|-----------|-----------|---------|
| **AINodes** | `userData.nodeId` | `userData.id` | Mirrors id → nodeId |
| **EnhancedNodeModels** | `userData.nodeId` | None | Factory generates |
| **SemanticGlyphAI** | `userData.nodeId` | None | Throws if missing |
| **GlyphLayer4** | `userData.id` | `userData.nodeId` | Uses id OR nodeId |
| **HitProxy** | `userData.id` | `userData.nodeId` | Uses id OR nodeId OR uuid |
| **SafeEvolution** | `userData.nodeId` | None | Throws if missing |
| **SafeLegendary** | `userData.nodeId` | None | Throws if missing |
| **SafeNodePersonality** | `userData.nodeId` | None | Throws if missing |

### Problem Areas

**❌ Fragmented:**
- AINodes uses BOTH id and nodeId
- GlyphLayer4 uses id OR nodeId (fallback)
- HitProxy uses id OR nodeId OR uuid (fallback)

**❌ No Consistency:**
- Some systems require nodeId
- Some systems require id
- Some systems use fallbacks

---

## LINKS (Spojenia)

### Current Usage

| System | Primary ID | Pattern |
|---------|-----------|---------|
| **LinkRegistry** | `userData.linkId` | Uses linkId |
| **LinkManager** | `userData.linkId` | Uses linkId |

### Status

**✅ Consistent:**
- All link systems use `userData.linkId`
- No fallbacks found
- Clean pattern

---

## GLYPHS (Vizuálne znaky)

### Current Usage

| System | Primary ID | Pattern |
|---------|-----------|---------|
| **GlyphLayer4** | `userData.id` (on fusion group) | Fusion tracking |
| **SemanticGlyphAI** | `userData.nodeId` (on node) | Node identity |

### Status

**❌ Mixed:**
- GlyphLayer4 uses `id` for fusion group tracking
- SemanticGlyphAI uses `nodeId` for semantic effects
- `userData.glyphId` field exists but is **NEVER USED**

---

## ID FIELD BREAKDOWN BY SYSTEM

### 1. AINodes.js (Node Management)
**Uses:** `id`, `nodeId`

**Pattern:**
```javascript
// Line 3342: Mirrors nodeId → id
userData.id = userData.nodeId || random;

// Line 3346: Mirrors id → nodeId
userData.nodeId = userData.id;
```

**Problem:** Dual identity (id and nodeId both masters)

---

### 2. EnhancedNodeModels.js (Node Factory)
**Uses:** `nodeId`

**Pattern:**
```javascript
// Line 1585: Generates nodeId
rootGroup.userData.nodeId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
```

**Status:** ✅ Consistent (uses nodeId only)

---

### 3. SemanticGlyphAI.js (Semantic Effects)
**Uses:** `nodeId`

**Pattern:**
```javascript
// Line 265: Reads nodeId
const nodeId = node.userData.nodeId;
```

**Status:** ✅ Consistent (uses nodeId only)

---

### 4. GlyphLayer4_MultiFusion.js (Fusion System)
**Uses:** `id`, `nodeId`

**Pattern:**
```javascript
// Line 807: Fallback pattern
nodeId: node.userData.id || node.uuid

// Line 987: Fallback pattern
nodeId: node.userData.id || node.uuid
```

**Problem:** Uses id with fallback (bypasses canonical nodeId)

---

### 5. HitProxySystem_v1.js (Hit Testing)
**Uses:** `id`, `nodeId`, `uuid`

**Pattern:**
```javascript
// Line 285: Fallback pattern
return ud.id || ud.nodeId || node.uuid || null;
```

**Problem:** Triple fallback (id OR nodeId OR uuid)

---

### 6. LinkRegistry.js (Link Management)
**Uses:** `linkId`

**Pattern:**
```javascript
// Uses linkId for link tracking
```

**Status:** ✅ Consistent (uses linkId only)

---

## RECOMMENDATIONS

### IMMEDIATE: Standardize Node Identity

**Current State:**
- **4 patterns:** id, nodeId, id OR nodeId, id OR nodeId OR uuid
- **3 systems require nodeId** (SemanticGlyphAI, SafeEvolution, SafeLegendary, SafeNodePersonality)
- **2 systems use fallbacks** (GlyphLayer4, HitProxy)

**Recommended Standard:**
```
NODES: userData.nodeId (canonical)
NODES: userData.id (read-only mirror for legacy)
LINKS: userData.linkId (already consistent)
GLYPHS: userData.nodeId (on fusion group, same as node)
```

---

### MIGRATION PLAN

#### Phase 1: Hard Lock (Already Planned)
- Make `userData.nodeId` canonical for nodes
- Mirror `nodeId` → `id` (read-only)
- Remove random fallbacks
- Apply IDENTITY_HARD_LOCK_DIFF.md changes

#### Phase 2: Remove Fallbacks
- GlyphLayer4: Remove `id || uuid` fallback
- HitProxy: Remove `id || nodeId || uuid` fallback
- Force explicit use of `nodeId`

#### Phase 3: Standardize Glyph Identity
- Use `userData.nodeId` on fusion groups
- Remove `userData.id` from fusion groups
- Consistent with node identity

---

### FIELD USAGE MATRIX

| Entity | Current | Recommended | Rationale |
|--------|----------|-------------|-----------|
| **Node** | `id` OR `nodeId` | `nodeId` | Most systems already use nodeId |
| **Node (legacy)** | `id` | `id` (mirror) | Legacy compatibility |
| **Link** | `linkId` | `linkId` | Already consistent |
| **Glyph/Fusion** | `id` | `nodeId` | Same as node identity |

---

## SUMMARY

**Current State:** ❌ FRAGMENTED
- 4 different patterns for node identity
- 2 systems use fallbacks
- No single source of truth

**After Standardization:** ✅ CONSISTENT
- Nodes: `nodeId` (canonical) + `id` (mirror)
- Links: `linkId` (already consistent)
- Glyphs: `nodeId` (same as node)

**Migration Complexity:** MEDIUM
- Phase 1: Hard lock (AINodes changes only)
- Phase 2: Remove fallbacks (GlyphLayer4, HitProxy)
- Phase 3: Standardize glyph identity (GlyphLayer4 fusion groups)

---

**Status:** Audit complete, recommendations ready
