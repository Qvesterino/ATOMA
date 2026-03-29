The user wanted to understand and integrate multiple glyph systems in the ATOMA project:

## Kedy sa ktory glyph realne spawnne

| System | Kedy sa spawnne | Realny trigger | Poznamka |
| --- | --- | --- | --- |
| `_GlyphLayer4_MultiFusion` | pri inicializacii worldu a potom pri novych nodoch | `main.js` zavola `createGlyphFusionsForNodes(aiNodes.nodes)` a registruje `postSpawnObserver` pre `createGlyphFusion` | 1x na node; toto je hlavna node-glyph cesta |
| `_LinkGlyphFlow.js` | pri aktivnom linku v kazdom visual ticku | `LinkGlyphFlow.update()` buduje packet cez `createGlyphPacket()` / `refreshPacketsForLinks()` | spawn je priebezny a zavisi od sily linku |
| `_LinkedGlyphMessaging3_0.js` | ked sa generuje link message | `update()` spawnuje `spawnMessage()` pod limitom `maxMessagesPerLink` | message glyph je transportna vrstva |
| `_RecursiveGlyphSignalSystem.js` | pri selection / hover / link create / link remove | `triggerAttentionSignal()` alebo `triggerResidueSignal()` -> `_spawnSignal()` | burst signal glyph, nie permanentny objekt |
| `GlyphFusionZone.js` + `CompositeGlyphGenerator.js` | ked sa pri node zidu 2+ glyphy a zona vstupi do fusion fazy | convergence detection v link/fusion update ceste, potom `createCompositeGlyph()` | composite vznikne az po realnej konvergencii |
| `_CompositeGlyphResonanceFeedback.js` | hned po registracii composite glyphu | `registerCompositeGlyph()` prida resonance halo okolo fusion glyphu | je to doplnkovy visual after-effect |
| `ProceduralHarmonicGlyphGenerator.js` | len pre stabilne huby v periodickom checku | hub age priblizne 45s, learning strength nad threshold, reinforcement nad threshold | velmi zriedkavy learned glyph |
| `_AtomaGlyphSystem3_0.js` / `_AtomaGlyphSystem4_0.js` | len manualne alebo debug helperom | `createGlyph()`, `createGlyph4()`, `assignGlyphToNode()` a pribuzne helpery | nie je to canonical live spawn path |

Poznamka: `AINarrativePatterns6_0` je v tejto mape len consumer eventov (`onMessageSpawned()`, `onGlyphFusion()`, `onProceduralGlyphSpawned()`), nie primary spawn zdroj. Mythic glyph system som nechal mimo tabulky schvalne.

First, understand the relationship between _LinkedGlyphMessaging3_0 and _RecursiveGlyphMessaging4_0
Connect these two systems so 4.0 extends messages from 3.0
Analyze why some glyph systems are visible while others aren't
Integrate AINarrativePatterns6_0 with multiple glyph systems (LinkedGlyphMessaging, GlyphFusionZone, ProceduralHarmonicGlyphGenerator)
Increase visibility of ProceduralHarmonicGlyphGenerator which was hard to see
Instructions
User speaks Slovak, respond in Slovak when appropriate
User wanted to connect glyph systems together for better visual feedback
User specifically wanted:
AINarrativePatterns6_0.onMessageSpawned() - when messages spawn
AINarrativePatterns6_0.onGlyphFusion() - when fusion zone triggers
AINarrativePatterns6_0.onProceduralGlyphSpawned() - when procedural glyphs spawn
Mythic glyph system should be ignored
Increase visibility of ProceduralHarmonicGlyphGenerator (opacity, color, scale)
Discoveries
Glyph System Hierarchy:

Layer 1: LinkedGlyphMessaging3_0 - basic message packets traveling along links
Layer 2: RecursiveGlyphMessaging4_0 - hierarchical recursive chains extending from 3.0
Layer 3: EmergentThoughtStorms5_0 - collision phenomena
Layer 4: SemanticGlyphAI - node semantic expression
Layer 5: AdaptiveGlyphRendering + LinkedGlyphSync - visual coherence
Layer 6: AINarrativePatterns6_0 - narrative structure layer
Why some systems weren't visible:

ProceduralHarmonicGlyphGenerator: Very conservative spawn conditions (45s hub age, 0.4 learning strength) + subtle visuals (45% opacity, grey color)
CompositeGlyphGenerator: Helper for GlyphFusionZone, not standalone
GlyphFusionZone: Requires 2+ glyphs converging at a node
GlyphFusionZone gets convergence data from:

LinkSemanticPictogramSystem_WithFusion wraps LinkSemanticPictogramSystem_Enhanced
Passes pictograms to fusionZoneManager.update()
Detects convergence when glyphs are within FUSION_RADIUS of a node
Accomplished
Connected _LinkedGlyphMessaging3_0 ↔ _RecursiveGlyphMessaging4_0:
Added setRecursiveGlyphMessaging() to 3.0
Added setLinkedGlyphMessaging() to 4.0
Added onMessageSpawned() callback in 4.0
Added generateChainFromMessage() to create chains from message data
Wired in main.js
Integrated AINarrativePatterns6_0 with glyph systems:
Added onMessageSpawned(), onGlyphFusion(), onProceduralGlyphSpawned() event handlers
Added findClusterForNode(), findClusterForPosition() helpers
Added _queueMotifShift() for motif transitions
Updated initializeNarrative() to store nodeIds and centerPos
Added processing of pending motif shifts in updateNarrativePhase()
Connected event sources:
_LinkedGlyphMessaging3_0: Added narrativePatterns reference and calls onMessageSpawned()
GlyphFusionZone.js: Added narrativePatterns to GlyphFusionZoneManager, calls onGlyphFusion() after initiateFusion()
ProceduralHarmonicGlyphGenerator.js: Added narrativePatterns reference, calls onProceduralGlyphSpawned() after glyph initialization
Wired in main.js:
Updated setupNarrativePatterns() to connect all systems
Increased ProceduralHarmonicGlyphGenerator visibility:
GLYPH_OPACITY: 0.45 → 0.65
GLYPH_COLOR: 0xd8d8d8 → 0x66ddff (cyan instead of grey)
GLYPH_SCALE: 1.2 → 1.4
MIN_HUB_AGE_SECONDS: 45 → 30
MIN_LEARNING_STRENGTH: 0.4 → 0.3
MIN_REINFORCEMENT_LEVEL: 0.5 → 0.4
GLYPH_EMERGE_DURATION: 3.0 → 2.0
Relevant files / directories
_LinkedGlyphMessaging3_0.js - Basic glyph messaging, added integration with RecursiveMessaging4.0 and NarrativePatterns6.0
_RecursiveGlyphMessaging4_0.js - Recursive chains, added setLinkedGlyphMessaging(), onMessageSpawned(), generateChainFromMessage()
_AINarrativePatterns6_0.js - Narrative layer, added event handlers for message/fusion/procedural events
GlyphFusionZone.js - Fusion zone manager, added setNarrativePatterns() and callback
ProceduralHarmonicGlyphGenerator.js - Procedural glyphs, added setNarrativePatterns() and increased visibility config
main.js - Wired all integrations in setupLinkedGlyphMessaging(), setupRecursiveGlyphMessaging(), setupNarrativePatterns()
LinkSemanticPictogramSystem_WithFusion.js - Wraps Enhanced + FusionZone (read for understanding)
LinkRendererConduit.js - Creates LinkSemanticPictogramSystem_WithFusion (read for understanding)