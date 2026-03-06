**1) Runtime glyph creation (GlyphLayer4_MultiFusion)**  
- `createGlyphFusion` builds a `fusionGroup` (`THREE.Group`) per node, then instantiates layer meshes:  
  - Core layer: `THREE.OctahedronGeometry` + `THREE.MeshBasicMaterial` (transparent, opacity ~0.6).  
  - Evolution layer: single mesh (Octahedron/Box/Sphere depending on stage).  
  - Personality layer: small set of meshes (e.g., 6 petal spheres, shards, spirals).  
  - State layer: a few meshes (rings/torus/lines) when applicable.  
  => Minimum ≈1 mesh (core) per node; typical nodes get 3–8 small meshes.  
- `createGlyphFusionsForNodes` just iterates nodes and calls `createGlyphFusion`. No dummy/placeholder paths—every layer constructs real `Mesh`/`Group` objects (no shared instancing).  

**2) Scene graph attachment**  
- In `createGlyphFusion`:  
  `node` → ensures/creates `visualGroup` (`node.add(visualGroup)`) → creates `fusionGroup` and `visualGroup.add(fusionGroup)` → all layer meshes added under `fusionGroup`. Attachment chain matches expected structure; no alternative parent.

**3) Visibility flags**  
- No `visible = false` assignments in `_GlyphLayer4_MultiFusion.js`.  
- No global flags named `ENABLE_GLYPHS`, `ENABLE_NODE_GLYPHS`, `GLYPH_LAYER_ENABLED` found in repo.  
- Class has `enabled` boolean (default `true`); `update` early‑returns if `!enabled`. Enable/disable only via explicit console helpers (`window.disableGlyphLayer4`, `enableGlyphLayer4`).

**4) Material state**  
- Materials are `MeshBasicMaterial` or `LineBasicMaterial` with `transparent: true`, `opacity` typically 0.5–0.8.  
- No `alphaTest`, `depthWrite`, or `visible` overrides; default `depthTest`/`depthWrite` remain `true`.  
- No code sets opacity to 0.0; dimming ranges keep opacity above ~0.3.

**5) Render order**  
- `renderOrder` is never set for fusionGroup or child meshes (all default 0). Node core/aura renderOrder is not overridden here, so draw order relies on depth test. This could allow partial occlusion by node core, but not full invisibility (materials are transparent).

**6) Scale & position**  
- Mesh scales are normal (>0): sizes 0.08–0.3 units; no zero scaling.  
- Positions: most meshes sit at node origin; some add slight offsets (petal radii, orbit radii 0.3–0.4). No code collapses them to zero or pushes them far away.  
- No global scale applied to fusionGroup; only per-layer animation scaling (breathing ± small percent).

**7) Policy / gate systems**  
- `_safeAttachGlyph` currently just `targetContainer.add(...)`; no enforcement gate or suppression.  
- No policy/lock/guard wrapping glyphLayer4. Event suppression systems in repo target other visuals (links, auras) and do not reference glyphLayer4.  
- SemanticGlyphAI reads fusionRegistry but does not disable visibility.

**8) Runtime registry / enablement**  
- `this.enabled = true` by default; `update` runs via FrameScheduler.visual.  
- Console helpers can `disable()` (sets `enabled=false`) or `enable()`; status printed in `printStatus`. No automatic disable pathways observed.

**Summary**  
1. **Meshes exist:** GlyphLayer4 builds real Groups/Meshes for each fused node.  
2. **Attachment:** Meshes are attached under `node → visualGroup → fusionGroup` as intended.  
3. **Visibility flags:** None set to false; only manual `enabled` toggle could stop updates.  
4. **Materials:** Transparent MeshBasic/LineBasic with opacity ~0.5–0.8; no zero/hidden states.  
5. **RenderOrder/depth:** Defaults (0, depthTest on). Possible mild occlusion by node core but not full suppression.  
6. **Scale/position:** Normal small scales; no zero-size/offset issues.  
7. **Policies/flags:** No suppression or gate around glyphLayer4; only manual enable/disable.