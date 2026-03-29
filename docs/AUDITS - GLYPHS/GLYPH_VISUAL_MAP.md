# Glyph Visual Map

This is a compact orientation map for the main glyph visual systems in ATOMA.

## Big Picture

```mermaid
flowchart TD
    A[AI Nodes / node.userData] --> B[Node Glyph Stack]
    A --> C[Link Graph]

    B --> B1[GlyphLayer4_MultiFusion\n(node glyphs / fusion registry)]
    B --> B2[SemanticGlyphAI\n(scanlines / semantic overlays)]

    C --> D[LinkSemanticPictogramSystem_Enhanced]
    D --> D1[Link pictograms\n(signal / modulator / memory)]
    D --> E[LinkSemanticPictogramSystem_WithFusion]
    E --> F[GlyphFusionZoneManager]
    F --> G[CompositeGlyphGenerator]
    F --> H[NeuralConvergenceSingularity]
    H --> I[ResonanceEchoTrailSystem]

    C --> J[LinkGlyphFlow]
    C --> K[LinkedGlyphMessaging3_0]
    C --> L[RecursiveGlyphMessaging4_0]
    C --> M[RecursiveGlyphSignalSystem]

    A --> P[ProceduralHarmonicGlyphGenerator]
    P --> P1[Procedural learned glyphs\n(topology history / stable hubs)]

    A --> N[NodeAuraSystem / NodeLinkedAuraSystem]
    C --> O[Link aura / link FX systems]
```

## What Each Layer Does

### 1. Node glyphs
- `GlyphLayer4_MultiFusion` is the node-facing glyph layer.
- It owns the fusion registry and creates the multi-part glyph look for nodes.
- In the current runtime it is hover-driven, so it can be present but still look empty until the right node becomes active.

### 2. Semantic overlays
- `SemanticGlyphAI` adds semantic scanlines and helper overlays.
- It reads node state and acts more like a semantic visual modifier than a primary spawner.

### 3. Link pictograms
- `LinkSemanticPictogramSystem_Enhanced` creates the glyphs that travel along links.
- It decides glyph family, state, and spawn budget.
- `LinkSemanticPictogramSystem_WithFusion` wraps that layer and adds fusion zones on top.

### 4. Fusion / composite visuals
- `GlyphFusionZoneManager` detects convergences and starts fusion.
- `CompositeGlyphGenerator` builds the generated composite geometry or visual root.
- `NeuralConvergenceSingularity` is the visible runtime shell for an active composite.
- `ResonanceEchoTrailSystem` spawns the memory / afterimage trail after composites are active.

### 5. Transport / messaging visuals
- `LinkGlyphFlow` is the simpler flowing packet layer.
- `LinkedGlyphMessaging3_0` and `RecursiveGlyphMessaging4_0` carry message-like glyph traces.
- `RecursiveGlyphSignalSystem` handles attention / signal pings.

### 6. Aura layers
- `NodeAuraSystem` and `NodeLinkedAuraSystem` sit under the node and link presentation stack.
- These are the surrounding field visuals, not the glyph core itself.

### 7. Procedural learned glyphs
- `ProceduralHarmonicGlyphGenerator` creates rare glyphs from topology learning history.
- It is not part of the link pictogram path and does not depend on link convergence.
- It emerges from learned hubs, reinforced routes, and stability over time.

## Spawn Order, In Plain Language

1. Nodes exist in `AINodes`.
2. Link glyph systems create active link pictograms.
3. Pictograms accumulate near link ends.
4. When enough pictograms converge, fusion zones activate.
5. Fusion zones spawn composite glyphs.
6. Composite glyphs can emit resonance echoes.
7. Stable topology history can also emit procedural harmonic glyphs.

## Why Glyphs Can Look "Too Many" Or "Missing"

- Too many on one node usually means the spawn budget is too generous or minimum-spawn logic is filling one link before others.
- Missing on some nodes usually means the current runtime is in hover-only mode, the world just switched, or the fusion registry has not rehydrated yet.
- If link pictograms are present but fusion zones stay at zero, the problem is usually in the convergence rule, not in the node glyph layer.

## Quick Debug Checklist

- Check `window.game.linkSemanticPictograms.pictogramSystem.pictograms.length`.
- Check `window.game.linkSemanticPictograms.fusionZoneManager.zones.filter(z => z.active).length`.
- Check `window.game.glyphLayer4.hoverOnlyMode`.
- Check `window.game.glyphLayer4.fusionRegistry.size`.
- Check `window.game.linkingSystem.links.length` and `window.game.aiNodes.nodes.length`.
- Check `window.game.proceduralGlyphGenerator?.getStatus?.()` for the learned glyph branch.

## File References

- [GlyphLayer4_MultiFusion.js](../../_GlyphLayer4_MultiFusion.js)
- [LinkSemanticPictogramSystem_Enhanced.js](../../LinkSemanticPictogramSystem_Enhanced.js)
- [LinkSemanticPictogramSystem_WithFusion.js](../../LinkSemanticPictogramSystem_WithFusion.js)
- [GlyphFusionZone.js](../../GlyphFusionZone.js)
- [CompositeGlyphGenerator.js](../../CompositeGlyphGenerator.js)
- [NeuralConvergenceSingularity.js](../../NeuralConvergenceSingularity.js)
- [ResonanceEchoTrailSystem.js](../../ResonanceEchoTrailSystem.js)
- [SemanticGlyphAI.js](../../_SemanticGlyphAI.js)
- [ProceduralHarmonicGlyphGenerator.js](../../ProceduralHarmonicGlyphGenerator.js)
