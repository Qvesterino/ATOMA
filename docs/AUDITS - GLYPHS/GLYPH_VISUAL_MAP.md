# Glyph Visual Map

Compact orientation map pre hlavné glyph systémy v ATOMA.

---

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

    A --> N[ProceduralHarmonicGlyphGenerator]
    N --> N1[Procedural learned glyphs\n(topology history / stable hubs)]

    A --> O[AINarrativePatterns6_0\n(narrative event consumer)]
    K --> O
    L --> O
    F --> O
    N --> O

    A --> P[NodeAuraSystem / NodeLinkedAuraSystem]
    C --> Q[Link aura / link FX systems]
```

---

## Layer Hierarchy (z discoveries)

**Layer 1: LinkedGlyphMessaging3_0** - Basic message packets traveling along links

**Layer 2: RecursiveGlyphMessaging4_0** - Hierarchical recursive chains extending from 3.0

**Layer 3: EmergentThoughtStorms5_0** - Collision phenomena, emergent visual storms

**Layer 4: SemanticGlyphAI** - Node semantic expression, scanlines and semantic overlays

**Layer 5: AdaptiveGlyphRendering + LinkedGlyphSync** - Visual coherence layer

**Layer 6: AINarrativePatterns6_0** - Narrative structure layer, consumes events from multiple glyph systems

---

## What Each Layer Does

### 1. Node Glyphs
**Owner:** `GlyphLayer4_MultiFusion`
- Hlavná node-facing glyph layer
- Owns fusion registry a vytvára multi-part glyph look pre nodes
- Current runtime je hover-driven, takže môže byť prítomný ale prázdny až kým node neaktívny

### 2. Semantic Overlays
**Owner:** `SemanticGlyphAI`
- Pridáva semantic scanlines a helper overlays
- Číta node state a pôsobí ako semantic visual modifier, nie primary spawner

### 3. Link Pictograms
**Owner:** `LinkSemanticPictogramSystem_Enhanced` → `LinkSemanticPictogramSystem_WithFusion`
- Vytvára glyphy, ktoré cestujú po linkoch
- Rozhoduje o glyph family, state, a spawn budget
- `LinkSemanticPictogramSystem_WithFusion` pridáva fusion zones na top

### 4. Fusion / Composite Visuals
**Owner:** `GlyphFusionZoneManager` → `CompositeGlyphGenerator` → `NeuralConvergenceSingularity`
- `GlyphFusionZoneManager`: Detekuje convergences a startuje fusion
- `CompositeGlyphGenerator`: Buduje generated composite geometry alebo visual root
- `NeuralConvergenceSingularity`: Visible runtime shell pre active composite
- `ResonanceEchoTrailSystem`: Spawnuje memory / afterimage trail po aktivite composites

### 5. Transport / Messaging Visuals
**Owners:** `LinkGlyphFlow`, `LinkedGlyphMessaging3_0`, `RecursiveGlyphMessaging4_0`, `RecursiveGlyphSignalSystem`
- `LinkGlyphFlow`: Jednoduchšia flowing packet layer
- `LinkedGlyphMessaging3_0`: Carries message-like glyph traces (Layer 1)
- `RecursiveGlyphMessaging4_0`: Hierarchical recursive chains (Layer 2)
- `RecursiveGlyphSignalSystem`: Attention / signal pings

### 6. Aura Layers
**Owner:** `NodeAuraSystem` / `NodeLinkedAuraSystem`
- Sedia pod node a link presentation stack
- Sú surrounding field visuals, nie glyph core

### 7. Procedural Learned Glyphs
**Owner:** `ProceduralHarmonicGlyphGenerator`
- Vytvára rare glyphs z topology learning history
- Nie je súčasťou link pictogram path
- Nezávisí na link convergence
- Emerges z learned hubs, reinforced routes, a stability over time

### 8. Narrative Event Consumer
**Owner:** `AINarrativePatterns6_0`
- Consumes events z:
  - `LinkedGlyphMessaging3_0` (message spawned)
  - `GlyphFusionZone` (fusion triggered)
  - `ProceduralHarmonicGlyphGenerator` (procedural glyph spawned)
- Provides narrative structure pre glyph activity

---

## Spawn Order (plain language)

1. Nodes exist in `AINodes`
2. Link glyph systems create active link pictograms
3. Pictograms accumulate near link ends
4. When enough pictograms converge, fusion zones activate
5. Fusion zones spawn composite glyphs
6. Composite glyphs can emit resonance echoes
7. Stable topology history can emit procedural harmonic glyphs
8. AINarrativePatterns6_0 consumes all glyph events pre narrative structure

---

## Visibility Notes

**Prečo glyphy vyzerajú "príliš veľa" alebo "chýbajú":**

- **Príliš veľa na jednom node:** Spawn budget je príliš generózny alebo minimum-spawn logic plní jeden link pred ostatnými
- **Chýbajú na niektorých nodoch:** Runtime je v hover-only móde, world sa práve prepol, alebo fusion registry sa ešte nerehydratoval
- **Link pictograms sú ale fusion zones zostávajú na nule:** Problém je v convergence rule, nie v node glyph layer

**ProceduralHarmonicGlyphGenerator visibility fix (2026-04-10):**
- Opacity: 0.45 → 0.65 (+44%)
- Color: grey → cyan (0x66ddff)
- Scale: 1.2 → 1.4 (+17%)
- Spawn thresholds lowered (hub age: 45s → 30s, learning strength: 0.4 → 0.3)

---

## Quick Debug Checklist

- `window.game.linkSemanticPictograms.pictogramSystem.pictograms.length`
- `window.game.linkSemanticPictograms.fusionZoneManager.zones.filter(z => z.active).length`
- `window.game.glyphLayer4.hoverOnlyMode`
- `window.game.glyphLayer4.fusionRegistry.size`
- `window.game.linkingSystem.links.length` a `window.game.aiNodes.nodes.length`
- `window.game.proceduralGlyphGenerator?.getStatus?.()` pre learned glyph branch
- `window.game.narrativePatterns?.getQueueStatus?.()` pre narrative event queue

---

## File References

### Core Glyph Systems
- [GlyphLayer4_MultiFusion.js](../../_GlyphLayer4_MultiFusion.js)
- [LinkSemanticPictogramSystem_Enhanced.js](../../LinkSemanticPictogramSystem_Enhanced.js)
- [LinkSemanticPictogramSystem_WithFusion.js](../../LinkSemanticPictogramSystem_WithFusion.js)
- [GlyphFusionZone.js](../../GlyphFusionZone.js)
- [CompositeGlyphGenerator.js](../../CompositeGlyphGenerator.js)
- [NeuralConvergenceSingularity.js](../../NeuralConvergenceSingularity.js)
- [ResonanceEchoTrailSystem.js](../../ResonanceEchoTrailSystem.js)
- [SemanticGlyphAI.js](../../_SemanticGlyphAI.js)
- [ProceduralHarmonicGlyphGenerator.js](../../ProceduralHarmonicGlyphGenerator.js)

### Messaging Systems
- [LinkedGlyphMessaging3_0.js](../../_LinkedGlyphMessaging3_0.js)
- [RecursiveGlyphMessaging4_0.js](../../_RecursiveGlyphMessaging4_0.js)
- [RecursiveGlyphSignalSystem.js](../../_RecursiveGlyphSignalSystem.js)
- [LinkGlyphFlow.js](../../_LinkGlyphFlow.js)

### Narrative Layer
- [AINarrativePatterns6_0.js](../../_AINarrativePatterns6_0.js)

### Supporting Documentation
- [mapa glyph systemov.md](./mapa%20glyph%20systemov.md) - Chronologická spawn trigger mapa
- [ATOMA GLYPH SYSTEM ARCHITECTURE MAP AUDIT.md](../MAPY/ATOMA%20GLYPH%20SYSTEM%20ARCHITECTURE%20MAP.md) - Kompletný audit 15 systémov

---

**Last Updated:** 2026-04-10
**Author:** Bystrik Matajzik
**Phase:** EVOLUTION_V2
