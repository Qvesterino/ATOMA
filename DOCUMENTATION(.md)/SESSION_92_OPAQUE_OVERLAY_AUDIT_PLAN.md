# SESSION 92: OPAQUE NODE OVERLAY AUDIT & NEUTRALIZATION

## TASK
Identify and neutralize all opaque node state overlays that obscure node identity and spatial clarity.

## PROBLEM
Same node renders with large opaque colored disc overlay at unpredictable times, obscuring node geometry and breaking spatial consistency.

## AUDIT RESULTS

### IDENTIFIED OPAQUE OVERLAY SOURCES:

1. **SafeNodePersonalityFX** (_SafeNodePersonalityFX.js)
   - Creates PlaneGeometry(0.4, 0.4) filled planes
   - Labeled as "analytical_symbol" for ANALYTICAL personality nodes
   - MeshBasicMaterial with varying opacity
   - Added directly to scene.add(symbol)
   - **STATUS**: CONFIRMED OPAQUE OVERLAY - MUST DISABLE

2. **GlyphFusionOverlay4_1** (_GlyphFusionOverlay4_1.js)
   - Creates planes/rings/petals with low opacity (0.7)
   - Lightweight (40 triangles max per fusion)
   - Attached as children to node.add(fusionGroup)
   - **STATUS**: LOW OPACITY - ACCEPTABLE (outlines/helper geometry)

3. **UISelectedNodeHighlight3_2** (_UISelectedNodeHighlight3_2.js)
   - Creates IcosahedronGeometry with wireframe=true
   - Opacity 0.75 on ring, 0.4 on glow
   - Only on selected node
   - **STATUS**: WIREFRAME - ACCEPTABLE (outline-based)

4. **SemanticGlyphAI** (_SemanticGlyphAI.js)
   - Helper meshes: rings, scan lines, dots (low opacity)
   - Max opacity 0.8 on tiny dots (0.01 size)
   - Small footprint (<1ms frame time)
   - **STATUS**: LOW IMPACT - ACCEPTABLE

5. **AINodeModel** (AINodeModel.js)
   - PlaneGeometry(0.4, 0.4) accent panels on data nodes
   - Opacity 0.3 - transparent accent
   - Part of node core geometry identity
   - **STATUS**: ACCEPTABLE - PART OF IDENTITY LAYER

### CRITICAL ISSUE:
**SafeNodePersonalityFX creates filled plane overlays with dynamic opacity**
- Can reach near-opaque levels depending on mood/personality state
- Directly added to scene (not attached as child to node)
- Not visually tagged as debug or helper
- No strict opacity bounds enforcement

## NEUTRALIZATION STRATEGY

### PRIMARY ACTION: Disable SafeNodePersonalityFX
- All personality VFX disabled
- Node spatial footprint stays constant
- Preserves all network topology visualization
- Zero impact to gameplay

### SECONDARY ACTION: Document All Visual Authorities
- Ensure single source of truth per visual layer
- NodeShellSizeAuthority → static shell sizes
- CoreVisualAuthoritySystem → core material
- Glyph systems → only in dedicated glyph layers
- No free-floating overlays allowed

### TERTIARY ACTION: Console Debug API
- Provide visibility into remaining visual layers
- Log any mesh addition to nodes at runtime
- Alert if unknown overlay system detected

## EXPECTED OUTCOME
- Same node always has predictable spatial footprint
- Only wireframe outlines allowed for emphasis (selection, debug)
- Filled planes forbidden in node overlay context
- Scene readability restored
- Node identity never visually overwritten

## VERIFICATION CHECKLIST
- [ ] SafeNodePersonalityFX disabled in main.js
- [ ] No opaque discs appear around nodes
- [ ] Node selection ring visible (wireframe only)
- [ ] Glyph layers still render (low opacity helpers)
- [ ] All tests pass with consistent node positioning
- [ ] Console logs show no unknown overlay systems
