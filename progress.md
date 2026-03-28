Original prompt: tak jako composite glyphy mali lietať po orbite nodov ako GlyphLayer4_MultiFusion. mohol by si to spraviť tak prosim ťa

## 2026-03-28
- Composite glyphs now receive an orbit anchor and orbit parameters from `GlyphFusionZone`.
- `NeuralConvergenceSingularity` now updates its world position by orbiting around the anchor instead of sitting statically on the node center.
- Goal of this pass: match the orbit feel of `GlyphLayer4_MultiFusion` while keeping the internal singularity visuals intact.
- Validation result: orbit motion is visible in runtime screenshot `output/web-game-orbit/shot-0.png`.
- Existing console error still appears in the browser loop: `[SemanticGlyphAI] Integrity mismatch: fusionRegistry.size !== aiNodes.nodes.length ...`; this was present before the orbit change and is not caused by this patch.
- Root cause refinement: `CompositeGlyphGenerator` was flattening the orbit structure into a merged `BufferGeometry`, which can turn the visual into a static blob. Added `generateCompositeVisual()` so fusion can keep a live `Object3D` instead.
- Fixed a missing `getCompositeColor()` helper in `CompositeGlyphGenerator` that broke the new live visual path at runtime.
- Runtime smoke test now confirms `generateCompositeVisual(['RING','ARROW'], ...)` returns an `Object3D` with children instead of a geometry blob.
- Added an origin safety guard in `ProceduralHarmonicGlyphGenerator` so procedural glyphs do not spawn in the center cluster when `region.center` is near the map origin.
- Found the middle-map pictogram artifact source: `LinkSemanticPictogramSystem_Enhanced` was resolving link endpoints only from `link.userData.nodeA/nodeB`, while active links in `main.js` store endpoints on `sourceNode/targetNode` and `source/target`. This left pictograms stuck at `(0,0,0)` when no curve was present.
- Fixed the enhanced pictogram link resolver to use the same endpoint fallbacks as the rest of the link stack so glyphs travel on links instead of accumulating at the world origin.
- Unlink cleanup pass: `main.js` now directly unregisters `LinkedGlyphMessaging3_0`, clears `SynergyCascadeVisualizer`, and clears `ResonanceCascadeVisualization_Session117B` from the link removal wrapper so unlinking a node removes the live visual residue immediately instead of waiting for fade-out.
- `SynergyCascadeVisualizer` now supports `clearLink(...)`, tags particles with link metadata, hides pooled meshes when they are returned, and fully clears active particles/ripples on cleanup.
- `ResonanceCascadeVisualization_Session117B` now supports `clearLink(...)` so active resonance waves tied to a removed link can be dropped instead of decaying in place.
- `LinkedGlyphMessaging3_0.unregisterLink()` now synchronizes its debug stats immediately after removal so the unlink state is reflected without waiting for the next update tick.
- `StandingWaveVisualRenderer_Session131` now gives antinode torus meshes a short lifetime, 5s cooldown, and a noisy dissolve profile so they fade out instead of popping.
- Runtime smoke test on `output/web-game-antinode/shot-0.png` stayed visually stable; only the pre-existing `SemanticGlyphAI` integrity mismatch console error remains in `output/web-game-antinode/errors-0.json`.
- The wave debug overlay in `main.js` now reports reflection pulses, active trap count, and trap amplitude peak/average under the existing `R/T/A` line.
- The wave debug overlay now also reports the primary standing-wave trap `state` and `trapRadius` so trap lifecycle is visible without opening the system internals.
- Fixed `StandingWaveVisualRenderer_Session131.clearLink(...)` by adding its missing `_resolveLinkId(...)` helper; unlinking a node no longer throws `this._resolveLinkId is not a function`.
