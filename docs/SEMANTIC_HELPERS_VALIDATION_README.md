# Semantic Glyph AI Helper Rendering Validation

## Overview

This validation suite provides deterministic testing of the SemanticGlyphAI helper mesh rendering pipeline.

## Files

1. **`debug_semantic_helpers_validation.js`** - Main validation script
2. **`debug_semantic_helpers_diagnostic.js`** - Diagnostic tools (use if validation fails)
3. **`SEMANTIC_HELPERS_VALIDATION_README.md`** - This file

## Quick Start

### Step 1: Load the game
Open ATOMA in your browser and wait for it to fully load.

### Step 2: Open browser console
Press F12 or right-click → Inspect → Console tab.

### Step 3: Run validation script
Copy the entire contents of `debug_semantic_helpers_validation.js` and paste it into the console.

### Step 4: Review output
The script will perform 9 validation stages and output:
- **PASS** - All stages completed successfully, scan line should be visible
- **FAIL** - Specific blocking stage identified with diagnostic information

## Validation Stages

### Stage 1: helperContainer scene graph attachment
- Verifies `helperContainer` is attached to scene
- Traces parent chain from helperContainer → scene
- **FAIL if:** Helper container is detached or parent chain broken

### Stage 2: Helper mesh count verification
- Verifies exactly 46 helper meshes exist (12 + 6 + 16 + 8 + 4)
- Checks pool counts match expected
- **FAIL if:** Helper count ≠ 46 or pool counts incorrect

### Stage 3: Force node into FOCUSED state
- Selects first available AI node
- Sets metrics: `synergy=0.95`, `corruption=0.05`, `tags=['analytics']`
- **FAIL if:** No test node available or missing nodeId

### Stage 4: Wait for semantic interpretation
- Waits 300ms (≥ 0.25s interpretation interval)
- Allows semantic state computation to complete
- **FAIL if:** Semantic interpretation never runs

### Stage 5: Verify semantic state computation
- Checks `semanticState.get(nodeId)` exists
- Verifies state type is `"focused"`
- **FAIL if:** No semantic state or wrong type

### Stage 6: Verify scanLine mesh visibility
- Finds scanLine mesh for test node
- Checks `scanLine.visible === true`
- **FAIL if:** Scan line is hidden

### Stage 7: Verify scanLine parent chain
- Traces parent chain from scanLine → scene
- **FAIL if:** Scan line not in scene graph

### Stage 8: Verify scanLine rendering properties
- Logs world position, renderOrder, depthTest, layers, etc.
- **FAIL if:** Critical rendering properties are incorrect

### Stage 9: Verify camera layer compatibility
- Checks if camera and scanLine have overlapping layers
- **FAIL if:** Layer mismatch prevents rendering

## Expected PASS Output

```
=== SEMANTIC GLYPH AI VALIDATION START ===
Time: 2026-02-28T09:33:00.000Z

--- STAGE 1: helperContainer scene graph attachment ---
✓ helperContainer parent chain to scene:
  SemanticGlyphAI_Helpers (uuid: abc12345)
    worldRoot (uuid: def67890)
      scene (uuid: ghi01234) ← SCENE

--- STAGE 2: helper mesh count verification ---
Expected helper meshes: 46
Actual helper meshes: 46
✓ Helper mesh count matches expected
✓ Pool counts are correct

--- STAGE 3: Force node into FOCUSED state ---
Test node: {nodeId: 'node-123', category: 'input', ...}
Forced metrics: {synergy: 0.95, corruption: 0.05, tags: ['analytics']}

--- STAGE 4: Wait for semantic interpretation (≥0.25s) ---
Waiting 300ms for semantic interpretation...

--- STAGE 5: Verify semantic state ---
Semantic state: {type: 'focused', parameters: {focusStrength: 0.95}, ...}
✓ Semantic state is "focused"

--- STAGE 6: Verify scanLine mesh visibility ---
Scan line: {index: 0, visible: true, ...}
✓ scanLine.visible === true

--- STAGE 7: Verify scanLine parent chain ---
✓ scanLine parent chain to scene:
  scene (uuid: ghi01234) ← SCENE

--- STAGE 8: Verify scanLine rendering properties ---
Render properties: {position: (x, y, z), renderOrder: 0, depthTest: true, ...}

--- STAGE 9: Verify camera layer compatibility ---
✓ Camera and scanLine have overlapping layers

=== VALIDATION COMPLETE ===

🎉 PASS: All validation stages completed successfully
```

## Expected Visual Result (PASS)

When validation passes, you should see:
- A **cyan scan line** sweeping vertically around the test node's glyph
- The scan line should pulse opacity based on focus strength
- Effect is subtle but visible when looking at the node

## Troubleshooting

### If validation FAILS at Stage 1 or 7

**Issue:** Helper meshes not in scene graph

**Fix:**
```javascript
// Verify patches were applied
window.game.semanticGlyphAI.helperContainer.children.length // Should be 46
```

### If validation FAILS at Stage 5

**Issue:** Semantic state not computed

**Fix:**
```javascript
// Manually trigger update
window.game.semanticGlyphAI.update(0.5, window.game.aiNodes.nodes);
```

### If validation FAILS at Stage 6

**Issue:** Scan line not becoming visible

**Fix:**
```javascript
// Force visibility manually
const nodeId = window.game.aiNodes.nodes[0].userData.nodeId;
const idx = nodeId % window.game.semanticGlyphAI.helperMeshes.scanLines.length;
window.game.semanticGlyphAI.helperMeshes.scanLines[idx].visible = true;
```

### If scan lines still don't render visually

Run the diagnostic script:
```javascript
// Copy and paste debug_semantic_helpers_diagnostic.js
```

The diagnostic script will:
1. Force all helpers visible
2. Disable frustum culling
3. Force emissive glow (make helpers bright)
4. Force renderOrder = 9999 (render on top)
5. Add a red test cube to verify Three.js is working
6. Export full diagnostic state

**Revert diagnostics:**
```javascript
window.revertSemanticDiagnostics();
```

## Common Issues

### Issue: "No AI nodes found"
**Solution:** Wait for world to fully load, or check if `createAINodes()` completed.

### Issue: "semanticGlyphAI not initialized"
**Solution:** Check if `setupSemanticGlyphAI()` was called in `main.js`.

### Issue: "No fusion data for nodeId"
**Solution:** Check if `glyphLayer4.createGlyphFusionsForNodes()` ran successfully.

### Issue: Scan lines invisible but validation passes
**Possible causes:**
1. Camera not looking at the node (move camera)
2. Material opacity too low (run diagnostic to force opacity)
3. Scene has post-processing affecting visibility
4. Node is too far away (scan line is small)

## Manual Testing

If automation doesn't work, test manually:

```javascript
// 1. Find a node
const node = window.game.aiNodes.nodes[0];
const nodeId = node.userData.nodeId;

// 2. Force focused state
node.userData.synergy = 0.95;
node.userData.corruption = 0.05;
node.userData.tags = ['analytics'];

// 3. Find scan line
const idx = nodeId % window.game.semanticGlyphAI.helperMeshes.scanLines.length;
const scanLine = window.game.semanticGlyphAI.helperMeshes.scanLines[idx];

// 4. Make it bright and visible
scanLine.visible = true;
scanLine.material.color.setHex(0x00FFFF);
scanLine.material.opacity = 1.0;
scanLine.material.emissive = new THREE.Color(0x00FFFF);
scanLine.material.emissiveIntensity = 1.0;
scanLine.material.depthTest = false;

// 5. Position it visibly
scanLine.position.copy(node.position);
scanLine.position.y += 1;

// 6. You should see a bright cyan line now
```

## Technical Details

### Helper Mesh Distribution
- **Crown rings:** 12 (leader/hub effect)
- **Scan lines:** 6 (focused effect)
- **Flicker dots:** 16 (exploring effect)
- **Link lines:** 8 (exploring connectors)
- **Split dividers:** 4 (conflict effect)
- **Total:** 46

### Focused State Conditions
Node is classified as "focused" when:
- `synergy > 75`
- `corruption < 25`
- `tags` includes `"analytics"` OR `role` is `"analyzer"`

### Scan Line Behavior
- Color: Cyan (`0x00F2FF`)
- Geometry: Plane (0.02 × 0.3)
- Animation: Vertical sweep (sine wave motion)
- Position: World-space (not local to node)
- Material: BasicMaterial, transparent

## Notes

- Validation scripts are **safe** and do not modify game state permanently
- Diagnostic script saves original values and provides revert function
- All changes are **visual only** (no gameplay effects)
- Scripts work in **any modern browser** with developer console

## Contact

If issues persist after running diagnostics:
1. Copy the full console output
2. Include the diagnostic state JSON
3. Note which stage failed
4. Describe what you see (or don't see) visually

---

**Version:** 1.0
**Last Updated:** 2026-02-28
**Compatibility:** ATOMA v2.0+
