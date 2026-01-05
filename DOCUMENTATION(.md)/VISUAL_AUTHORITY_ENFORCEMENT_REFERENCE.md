# VISUAL AUTHORITY ENFORCEMENT — QUICK REFERENCE

## The Rule (Absolute)

```
BaseVisualState is the ONLY visual authority for node appearance.
Linking ≠ Visual mutation
LinkedState = BaseVisualState + LinkFX (additive only)
```

## When Linking a Node

### ✅ DO THIS
- Restore base visual state first
- Add FX as separate meshes (renderOrder 50+)
- Apply arc, glow, pulse effects
- Keep core mesh/material/opacity unchanged
- Make glyphs provide hints (don't mutate core)

### ❌ DON'T DO THIS
- Boost core opacity on link
- Increase emissive intensity on link
- Change core material on link
- Swap mesh geometry on link
- Apply category-specific visual overrides
- Use fallback/proxy meshes
- Mutate core renderOrder for linking
- Apply visual "downgrades" after linking

## Code Pattern

```javascript
// When creating a link:

// 1. BEFORE linking, capture base state (once per node lifetime)
if (!node.userData.baseVisualState) {
  captureBaseVisualState(node);
}

// 2. CREATE the link
createLink(sourceNode, targetNode);

// 3. AFTER linking, restore base state
applyFinalNodeVisualState(sourceNode, { verbose: false });
applyFinalNodeVisualState(targetNode, { verbose: false });

// 4. OPTIONAL: Add FX as separate layer
applyLinkFXOnly(sourceNode, { /* options */ });
```

## Visual Priority (Render Order)

```
-1   AURA           (behind everything, opacity ≤ 0.06)
 0   CORE           (primary, immutable)
10   GLYPHS         (symbols, icons)
50   LINK_FX        (arcs, pulses, effects)
200  DEBUG          (diagnostics only)
```

## Base State Components (Immutable)

```javascript
baseVisualState = {
  coreMeshId:       UUID,           // Which mesh is core
  coreMaterial: {
    color:          0xHEXCODE,      // Primary color
    emissive:       0xHEXCODE,      // Glow color
    opacity:        1.0,            // Transparency
    transparent:    boolean,        // Transparency flag
    depthWrite:     boolean,        // Depth buffer
    depthTest:      boolean,        // Depth test
    metalness:      0-1,            // Material properties
    roughness:      0-1,
  },
  coreGeometryId:   UUID,           // Geometry reference
  coreRenderOrder:  0,              // Z-ordering
  auraMesh:         UUID,           // Aura mesh ID
  auraOpacity:      ≤ 0.06,         // Max aura visibility
  color:            0xHEXCODE,      // Node overall color
  capturedAt:       timestamp       // When captured
}
```

## Assertion Pattern (Dev Mode)

```javascript
// Check that base state wasn't mutated
const result = assertBaseVisualStateCorrect(node);

if (!result.passed) {
  console.warn('VIOLATION:', result.violations);
  // Violations include:
  // - Core color mutated
  // - Core opacity mutated
  // - Core renderOrder mutated
  // - Core depthWrite/depthTest changed
  // - Core mesh removed
}
```

## Systems That Respect Authority

| System | Status | Notes |
|--------|--------|-------|
| NodeVisualStateBinder | ✅ Active | Enforces base state |
| NodeLinkingSystem | ✅ Active | Calls restore functions |
| NeonLinkVisuals | ✅ Active | FX-only (separate meshes) |
| VisualHierarchyRegistry | ✅ Active | Manages render orders |
| LinkEventOrderValidator | ✅ Active | Validates link sequence |

## Systems That Violate Authority (DISABLED)

| System | Status | Reason |
|--------|--------|--------|
| EnhancedNodeModelLinkState | ❌ DISABLED | Boosted core opacity/emissive on link |
| Any link-based boost | ❌ FORBIDDEN | Violates immutability |
| Category-specific mutations | ❌ FORBIDDEN | No exceptions to base state rule |
| Proxy/fallback meshes | ❌ FORBIDDEN | Core must never be replaced |

## Debugging / Verification

### Console Commands (When Available)

```javascript
// Verify a node's base state
const state = window.nodeVisualStateBinder?.assertBaseVisualStateCorrect(node);
console.log('Passed:', state.passed);
console.log('Violations:', state.violations);

// Check if base state was captured
console.log('Base state captured:', !!node.userData.baseVisualState);

// Verify render order hierarchy
node.traverse(obj => {
  if (obj.userData?.visualLayer) {
    console.log(`${obj.userData.visualLayer}: renderOrder=${obj.renderOrder}`);
  }
});
```

### Visual Inspection

Before/After linking, verify:
- ✓ Node mesh unchanged (same geometry)
- ✓ Core color unchanged
- ✓ Core opacity unchanged (1.0)
- ✓ Aura size unchanged (opacity still ≤ 0.06)
- ✓ Only new element is link arc (thin line)
- ✓ All glyphs unchanged
- ✓ Scale/position unchanged

## Future Additions

When adding new link-related visuals:

1. **Ask first:** Does this change core mesh/material/opacity?
   - YES → ❌ Don't do it (violates authority)
   - NO → ✅ Continue

2. **Is it additive?** (Separate mesh, renderOrder 50+?)
   - YES → ✅ Proceed
   - NO → ❌ Don't do it

3. **Apply to all nodes?** (No category exceptions)
   - YES → ✅ Proceed
   - NO → ❌ Require override exception

## Reference Implementation

See these files for correct patterns:

- `/NodeVisualStateBinder.js` — Base state management
- `/NodeLinkingSystem.js` — Link event handler
- `/VisualHierarchyRegistry.js` — Render order authority
- `/NeonLinkVisuals.js` — FX rendering (additive only)

---

**Rule Summary:** Base state = immutable authority. Link events may only add FX layers. No mutations to core mesh, material, opacity, or category-specific exceptions ever.
