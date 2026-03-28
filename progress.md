Original prompt: tak jako composite glyphy mali lietať po orbite nodov ako GlyphLayer4_MultiFusion. mohol by si to spraviť tak prosim ťa

## 2026-03-28
- Composite glyphs now receive an orbit anchor and orbit parameters from `GlyphFusionZone`.
- `NeuralConvergenceSingularity` now updates its world position by orbiting around the anchor instead of sitting statically on the node center.
- Goal of this pass: match the orbit feel of `GlyphLayer4_MultiFusion` while keeping the internal singularity visuals intact.
- Validation result: orbit motion is visible in runtime screenshot `output/web-game-orbit/shot-0.png`.
- Existing console error still appears in the browser loop: `[SemanticGlyphAI] Integrity mismatch: fusionRegistry.size !== aiNodes.nodes.length ...`; this was present before the orbit change and is not caused by this patch.
