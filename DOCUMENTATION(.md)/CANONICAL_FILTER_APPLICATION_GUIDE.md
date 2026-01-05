# Canonical Interaction Filter - Application Guide

## Overview

**File Created:** `CanonicalInteractionFilter.js`

**Purpose:** Single source of truth for filtering raycast intersections

**Usage:** One line added to each intersectObjects() call

---

## The Canonical Filter

```javascript
import { filterRaycastIntersections } from './CanonicalInteractionFilter.js';

// BEFORE:
let intersections = raycaster.intersectObjects(objects);

// AFTER (add one line):
let intersections = raycaster.intersectObjects(objects);
intersections = filterRaycastIntersections(intersections);
```

---

## Core Principle

**RULE:** Every `.intersectObjects()` call must be followed by filtering.

```
NO EXCEPTIONS
NO SHORTCUTS
NO CATEGORY-SPECIFIC HACKS
```

---

## Files to Modify

### 1. NodeLinkingSystem.js (3 locations)

**Location 1: Node selection**
```javascript
// BEFORE:
const intersects = this.raycaster.intersectObjects(meshes, false);

// AFTER:
let intersects = this.raycaster.intersectObjects(meshes, false);
intersects = filterRaycastIntersections(intersects);
```

**Location 2: Arrow selection**
```javascript
// BEFORE:
const intersects = this.raycaster.intersectObjects(arrowMeshes, false);

// AFTER:
let intersects = this.raycaster.intersectObjects(arrowMeshes, false);
intersects = filterRaycastIntersections(intersects);
```

**Location 3: Crosshair/targeting**
```javascript
// BEFORE:
const intersects = this.raycaster.intersectObjects(nodeMeshes, false);

// AFTER:
let intersects = this.raycaster.intersectObjects(nodeMeshes, false);
intersects = filterRaycastIntersections(intersects);
```

---

### 2. NodeEditor.js (5 locations)

**Location 1: updateNodeHover**
```javascript
// BEFORE:
const intersects = this.raycaster.intersectObjects(
  this.nodes.map(n => n.mesh)
);

// AFTER:
let intersects = this.raycaster.intersectObjects(
  this.nodes.map(n => n.mesh)
);
intersects = filterRaycastIntersections(intersects);
```

**Location 2: Link source hover**
```javascript
// BEFORE:
const intersects = this.raycaster.intersectObjects(
  this.nodes.map(n => n.mesh).filter(m => m !== this.linkSource.mesh)
);

// AFTER:
let intersects = this.raycaster.intersectObjects(
  this.nodes.map(n => n.mesh).filter(m => m !== this.linkSource.mesh)
);
intersects = filterRaycastIntersections(intersects);
```

**Location 3: handleMouseClick node selection**
```javascript
// BEFORE:
const intersects = this.raycaster.intersectObjects(
  this.nodes.map(n => n.mesh)
);

// AFTER:
let intersects = this.raycaster.intersectObjects(
  this.nodes.map(n => n.mesh)
);
intersects = filterRaycastIntersections(intersects);
```

**Location 4: handleMouseDown node drag**
```javascript
// BEFORE:
const intersects = this.raycaster.intersectObjects(
  this.nodes.map(n => n.mesh)
);

// AFTER:
let intersects = this.raycaster.intersectObjects(
  this.nodes.map(n => n.mesh)
);
intersects = filterRaycastIntersections(intersects);
```

**Location 5: Link curve intersection**
```javascript
// BEFORE:
const intersects = this.raycaster.intersectObjects(
  this.links.map(l => l.curve.line)
);

// AFTER:
let intersects = this.raycaster.intersectObjects(
  this.links.map(l => l.curve.line)
);
intersects = filterRaycastIntersections(intersects);
```

---

## Import Statement

Add to top of NodeLinkingSystem.js:
```javascript
import { filterRaycastIntersections } from './CanonicalInteractionFilter.js';
```

Add to top of NodeEditor.js:
```javascript
import { filterRaycastIntersections } from './CanonicalInteractionFilter.js';
```

---

## Other Files (Secondary)

### AINodes.js
- Contains 1 intersectObjects call
- Likely in node picking logic
- Add filtering: `intersects = filterRaycastIntersections(intersects);`

### _NodeLinking2_3.js
- Legacy linking system
- Add filtering if still active

### NodeInspectOverlay1_0.js / NodeInspectOverlay3_0.js
- Inspector picking
- Add filtering (low priority, UI-only)

### _IntegrationNodeSelectionFix.js
- INTEGRATION node fallback
- Already uses userData checks (may be OK)

### SafeMobilityPack4.js
- Camera/mobility effects
- Add filtering (low priority)

---

## Implementation Pattern

```javascript
// UNIVERSAL PATTERN (use everywhere):

import { filterRaycastIntersections } from './CanonicalInteractionFilter.js';

// ... later in code ...

let intersections = raycaster.intersectObjects(someArray, true);
intersections = filterRaycastIntersections(intersections);

if (intersections.length > 0) {
  const hit = intersections[0];
  // Use hit...
} else {
  // No hits - deselect or do nothing
}
```

---

## Convenience Helpers

If you prefer shorter syntax:

```javascript
import { getFirstInteractiveIntersection } from './CanonicalInteractionFilter.js';

// SHORTER VERSION:
const hit = getFirstInteractiveIntersection(
  raycaster.intersectObjects(scene.children, true)
);

if (hit) {
  selectNode(hit.object);
} else {
  deselectNode();
}
```

---

## Testing After Application

### Test 1: Startup
```javascript
// In console
console.log(window.CanonicalInteractionFilter.test());
// Should show: { isInteractive: true, filter: true, getFirst: true }
```

### Test 2: Selection
- Click node core → Selects ✓
- Click aura → Selects core (not aura) ✓
- Click shell → Selects core (not shell) ✓

### Test 3: Deselection
- Click empty space → Deselects ✓
- Aura doesn't block deselect ✓

### Test 4: Errors
- No THREE.js errors ✓
- No "r.raycast is not a function" ✓

---

## Filter Logic

The canonical filter rejects objects with:

```javascript
obj.userData.nonInteractive === true     // Explicit marker
obj.userData.isAura === true             // Aura
obj.userData.isShell === true            // Shell
obj.userData.isHologramShell === true    // Hologram
obj.userData.isFX === true               // Effects
obj.userData.isParticle === true         // Particles
obj.userData.isGlyph === true            // Glyphs
obj.userData.isLinkVisual === true       // Link visuals
obj.userData.isHarmonyField === true     // Harmony fields
obj.userData.visualLayer === 'AURA'      // Visual layer tag
obj.userData.visualLayer === 'SHELL'     // Visual layer tag
// ... and more
```

**Accepts only:** Objects without these markers (interactive cores)

---

## Guarantees

After applying canonical filter everywhere:

✅ No THREE.js Raycaster errors
✅ Visual meshes never block selection
✅ Clicking empty space always deselects
✅ All nodes selectable through auras
✅ Deterministic selection behavior
✅ No visual changes
✅ No architecture changes

---

## Rollout Sequence

1. ✅ Create CanonicalInteractionFilter.js
2. ⏳ Add import to NodeLinkingSystem.js
3. ⏳ Apply filter to 3 locations in NodeLinkingSystem.js
4. ⏳ Add import to NodeEditor.js
5. ⏳ Apply filter to 5 locations in NodeEditor.js
6. ⏳ Test and verify
7. ⏳ Apply to secondary files (AINodes, Overlays, etc.)

---

## Minimal Change Template

```diff
  // NodeLinkingSystem.js

+ import { filterRaycastIntersections } from './CanonicalInteractionFilter.js';

  // ... existing code ...

  someMethod() {
-   const intersects = this.raycaster.intersectObjects(meshes, false);
+   let intersects = this.raycaster.intersectObjects(meshes, false);
+   intersects = filterRaycastIntersections(intersects);
    // ... rest of logic unchanged ...
  }
```

---

## Success Criteria

After all changes:

- [ ] No new imports break anything
- [ ] All 8 files have filtering applied
- [ ] Startup: No THREE.js errors
- [ ] Selection: Works through auras ✓
- [ ] Deselection: Works (click empty) ✓
- [ ] Linking: Works ✓
- [ ] No visual regression ✓
- [ ] Console shows no warnings ✓

---

## Quick Reference

**The One-Liner:**
```javascript
intersections = filterRaycastIntersections(intersections);
```

**Where:** After every `raycaster.intersectObjects()` call

**Why:** Removes visual-only meshes from selection

**Result:** Deterministic, stable interaction

---

**Status: ✅ CANONICAL FILTER READY | AWAITING APPLICATION TO SELECTION SYSTEMS**
