# GLYPH VISUAL SYSTEMS AUDIT

**Date:** 2026-03-26  
**Type:** Static Analysis  
**Scope:** Glyph visual systems other than GlyphLayer4_MultiFusion and LinkSemanticPictogramSystem_WithFusion

## Executive Summary

The remaining glyph systems split into three groups:

1. Scene-owning glyph roots that create and attach their own containers or child glyphs.
2. Visual transport / messaging layers that are scene-attached and scheduler-driven.
3. Visual modifiers that do not own scene objects and only reshape existing glyphs.

The strongest layering guarantees I found are:

- SemanticGlyphAI uses an explicit scanline renderOrder of 25.
- AtomaGlyphSystem4_0 assigns ARCHETYPE renderOrder through VisualHierarchyRegistry.
- ProceduralHarmonicGlyphGenerator assigns renderOrder = 3 to its generated lines.

The main structural risk is not missing scene attachment. It is the number of active layers that still rely on implicit/default ordering because they never set renderOrder explicitly.

## System Matrix

| System | Spawn / Init Condition | Wiring | Scene Attach | RenderOrder | Status |
|---|---|---|---|---|---|
| AtomaGlyphSystem3_0 | Disabled in main.js via enableGlyphSystem3 = false. Initialized only if that flag is flipped. | Constructed in main.js and kept in the visual scheduler path, but currently not instantiated. | Yes, glyphContainer is added to scene. | None found. | Disabled |
| AtomaGlyphSystem4_0 | Disabled in main.js via enableGlyphSystem4 = false. | Constructed in main.js and wired into the visual scheduler path, but currently not instantiated. | Yes, glyphContainer is added to scene. | Yes, ARCHETYPE via VisualHierarchyRegistry for the glyph group and children. | Disabled |
| SemanticGlyphAI | Requires GlyphLayer4 to exist. main.js aborts setup if glyphLayer4 is missing. | Created in main.js, updated on the visual lane, and driven by glyphLayer4 state. | Yes, helperContainer is attached to worldRoot or scene. | Yes, scanLines use SCANLINE_ORDER = 25. | Active |
| GlyphFusionOverlay4_1 | Requires SemanticGlyphAI; returns early if hoverOnlyMode is enabled. | Created in main.js and updated on the visual lane. | Yes, fusionContainer is attached to worldRoot or scene. | None found. | Active |
| LinkGlyphFlow | Requires linkingSystem and SemanticGlyphAI. | Created in main.js, frameScheduler is assigned, and update is registered on the visual lane. | Yes, containerGroup is added to scene. | None found. | Active |
| LinkedGlyphMessaging3_0 | Requires SemanticGlyphAI. | Created in main.js, frameScheduler is assigned, and update is registered on the visual lane. | Yes, messageContainer is attached to worldRoot or scene. | None found. | Active |
| RecursiveGlyphMessaging4_0 | Requires SemanticGlyphAI. | Created in main.js, frameScheduler is assigned, and update is registered on the visual lane. | Yes, chainContainer is attached to worldRoot or scene. | None found. | Active |
| RecursiveGlyphSignalSystem | Requires SemanticGlyphAI, selectionCore, linkingSystem, and frameScheduler. | Created in main.js, then bound to semantic AI, selection, linking, and dynamics context. | Yes, signalContainer is added to scene. | None found. | Conditional / active when dependencies are present |
| ProceduralHarmonicGlyphGenerator | Requires harmonicTopology. main.js skips setup if topology is not ready. | Created in main.js, assigned frameScheduler, and updated on the visual lane through the procedural glyph scheduler. | Yes, the generated glyph pool container is attached to the attach root. | Yes, line.renderOrder = 3. | Active |
| MythicSeedGlyph | Disabled when window.ATOMA_DISABLE_MYTHIC_RITUALS is true. | Constructed in main.js and used as a node-bound helper when rituals are enabled. | No scene root attachment. Glyphs attach to node.visualGroup or node directly. | None found. | Disabled by flag |
| AdaptiveGlyphRendering1_0 | Created in main.js only after initialization of the cycle-driven glyph path. | Updated on the visual lane. | No scene root attachment. It only modulates existing glyphs. | None found. | Active |
| GlyphAnimationModulator | Requires harmonicCycleController and procedural glyph instances. | Created in main.js and updated on the visual lane as a modifier. | No scene root attachment. | None found. | Active |
| CompositeGlyphResonanceFeedback | Requires scene, camera, and network context. | Created in main.js, assigned frameScheduler, and updated on the visual lane. | No direct scene root attachment found; it acts on existing glyph motion and spacing. | None found. | Active |
| GlyphPurityMode5_1 | Constructed in main.js but explicitly disabled with setPurityEnabled(false). | Enforcement-only layer; no frameScheduler registration found. | No scene root attachment. | None found. | Disabled |

## Findings

1. The legacy roots are intentionally dormant. AtomaGlyphSystem3_0 and AtomaGlyphSystem4_0 are still present in the bootstrap path, but both are disabled by flags in main.js. The 4.0 system has correct ordering via ARCHETYPE; the 3.0 system has no explicit renderOrder found.

2. The current active overlay stack is layered but partly implicit. SemanticGlyphAI, ProceduralHarmonicGlyphGenerator, and AtomaGlyphSystem4_0 have explicit ordering. GlyphFusionOverlay4_1, LinkGlyphFlow, LinkedGlyphMessaging3_0, RecursiveGlyphMessaging4_0, RecursiveGlyphSignalSystem, AdaptiveGlyphRendering1_0, GlyphAnimationModulator, and CompositeGlyphResonanceFeedback do not set renderOrder in the files reviewed, so they depend on parent ordering or insertion order.

3. The scene attachment model is mostly correct. The scene-owning systems attach their own container groups cleanly. The modifier systems do not own scene roots, which matches their role and is not a bug.

4. MythicSeedGlyph is intentionally inert right now. It attaches glyphs under node.visualGroup or node, but ritual creation is gated off by window.ATOMA_DISABLE_MYTHIC_RITUALS.

5. MegaGlyphSystem exists as a reference implementation, but I found no bootstrap in main.js. I treated it as dormant/reference rather than an active runtime system.

## Second Pass: Spawn Conditions By Glyph Type

This pass narrows the question to the exact `userData` fields and metrics that actually trigger glyph selection in the node glyph systems.

| Glyph Type | Trigger Fields in `AINodes` / `userData` | Primary Condition | Fallback / Notes |
|---|---|---|---|
| aiConsciousness | `userData.consciousness`, `userData.category` | `consciousness === true` and `category === 'consciousness'` | If `consciousness === true` but category is not `consciousness`, it falls back to `neutralFallback`. |
| mythicSeed | `userData.mythicSeedActive`, `userData.category` | `mythicSeedActive === true` | Also selected by `category === 'mythic'`. In `AINodes.js`, explicit mythic spawn APIs create `category: 'mythic'` with `archetype: 'MYTHIC-CEREMONIAL'`. |
| ascendedNode | `userData.ascended`, `userData.category` | `ascended === true` | Also selected by `category === 'ascended'`. |
| evolutionStage1 | `userData.evolutionStage`, `userData.category` | `evolutionStage === 1` | Category fallback: `input` routes here. |
| evolutionStage2 | `userData.evolutionStage`, `userData.category` | `evolutionStage === 2` | Category fallback: `storage` routes here. |
| evolutionStage3 | `userData.evolutionStage`, `userData.category` | `evolutionStage === 3` | No extra metric gate found. |
| personalityHarmony | `userData.personality`, `userData.category`, `userData.metrics.harmony` | `personality.toLowerCase() === 'harmony'` | Category fallback: `process` routes here. The glyph system also reads `metrics.harmony` in its context analysis, but that metric is contextual rather than the selection key. |
| personalityStability | `userData.personality`, `userData.category`, `userData.metrics.stability` | `personality.toLowerCase() === 'stability'` | Category fallback: `analytics` routes here. |
| personalityCorruption | `userData.personality`, `userData.category`, `userData.metrics.corruption` | `personality.toLowerCase() === 'corruption'` | Category fallback: `control` routes here. |
| personalitySynergy | `userData.personality`, `userData.category`, `userData.metrics.synergy` | `personality.toLowerCase() === 'synergy'` | Category fallback: `integration` routes here. |
| eventMythicRitual | Event payload / ritual state | Event-driven glyph creation path | Not a `userData` gate in the same sense as the category/personality glyphs. |
| eventClusterSurge | Event payload / cluster state | Event-driven glyph creation path | Not a `userData` gate in the same sense as the category/personality glyphs. |
| eventWorldEvent | Event payload / world-event state | Event-driven glyph creation path | Not a `userData` gate in the same sense as the category/personality glyphs. |

### What `AINodes.js` Actually Writes

`AINodes.js` stamps the fields that the glyph systems later read:

- `userData.category` as the primary source of node identity/category.
- `userData.archetype` and `userData.archetypeKey` as spawn-time routing metadata.
- `userData.isExtreme` and `userData.extremeArchetype` for extreme-node routing.
- `userData.extremeTier` for the extreme-system layer.
- `userData.isFallback`, `userData.spawnContext`, `userData.originalCategory`, and `userData.fallbackReason` for fallback-spawn traceability.

The node glyph systems themselves do not spawn from `AINodes.js` directly. They read those fields later and decide which glyph variant to attach.

### Practical Reading

- If the question is "what makes a glyph appear?", the answer is usually `userData.category` plus one of the explicit flags above.
- If the question is "what makes the glyph look different?", the answer is often a metric such as `metrics.synergy`, `metrics.harmony`, `metrics.corruption`, `metrics.stability`, or `metrics.loadPressure`.
- If the question is "what hard-switches the type?", look first at `consciousness`, `mythicSeedActive`, `ascended`, `evolutionStage`, and `personality`.

## Short Verdict

No hard attach failures were found in the reviewed glyph visual systems. The only clear layering gap is the lack of explicit renderOrder on several active overlay / transport / modifier layers, which is a stability risk if the scene graph or insertion order changes.

## Reference Notes

- AtomaGlyphSystem3_0 scene attach: [AtomaGlyphSystem3_0.js](../../_AtomaGlyphSystem3_0.js#L36)
- AtomaGlyphSystem4_0 scene attach and ARCHETYPE ordering: [AtomaGlyphSystem4_0.js](../../_AtomaGlyphSystem4_0.js#L39) and [AtomaGlyphSystem4_0.js](../../_AtomaGlyphSystem4_0.js#L1344)
- SemanticGlyphAI helper container and scanline order: [SemanticGlyphAI.js](../../_SemanticGlyphAI.js#L62) and [SemanticGlyphAI.js](../../_SemanticGlyphAI.js#L155)
- GlyphFusionOverlay4_1 container attach: [GlyphFusionOverlay4_1.js](../../_GlyphFusionOverlay4_1.js#L49)
- LinkGlyphFlow container attach: [LinkGlyphFlow.js](../../_LinkGlyphFlow.js#L35)
- LinkedGlyphMessaging3_0 container attach: [LinkedGlyphMessaging3_0.js](../../_LinkedGlyphMessaging3_0.js#L78)
- RecursiveGlyphMessaging4_0 container attach: [RecursiveGlyphMessaging4_0.js](../../_RecursiveGlyphMessaging4_0.js#L81)
- RecursiveGlyphSignalSystem container attach: [RecursiveGlyphSignalSystem.js](../../_RecursiveGlyphSignalSystem.js#L27)
- ProceduralHarmonicGlyphGenerator container and renderOrder: [ProceduralHarmonicGlyphGenerator.js](../../ProceduralHarmonicGlyphGenerator.js#L389) and [ProceduralHarmonicGlyphGenerator.js](../../ProceduralHarmonicGlyphGenerator.js#L409)
- MythicSeedGlyph node attachment: [MythicSeedGlyph.js](../../_MythicSeedGlyph.js#L151)
- GlyphPurityMode disabled: [main.js](../../main.js#L5905)