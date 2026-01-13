# T3-003 — Frame Update Loop Wiring

## Frame Update Order in animate() Loop

All systems update **every frame** in the following exact order. No conditional skips. No duplicate calls.

---

## Gameplay Compute Systems Update (Before Visuals)

These systems compute new gameplay state that visuals will consume.

### 1. Link Priority & Decay
```
linkPriorityDecayEngine.update(deltaTime, time)
```
- Decays link priority values
- Updates link lifespan timers
- Feeds into quality feedback

### 2. Link Corruption Transmission (Gameplay)
```
// [Not explicitly called in main loop — integrated via linkingSystem.update()]
// Called within: linkingSystem.update(deltaTime, time)
// Or explicitly: this.linkCorruptionTransmission.update(deltaTime)
```
- Propagates corruption through network
- Updates linkCorruptionLevel on each link
- Cascades corruption between nodes
- **Must run before** HarmonyStabilizationSystem (reads corruption state to heal)

### 3. Harmony Stabilization (Gameplay Counter-Force)
```
// [Integrated via T2_HarmonyVisualConsumer or explicit call]
// Explicit call recommended: this.harmonyStabilizationSystem.update(deltaTime)
```
- Spreads harmony through network
- Heals corruption on nodes/links
- Increases stability
- Dampens cascade events
- **Must run after** LinkCorruptionTransmission (reads link corruption to oppose)

### 4. Link System Core Update
```
linkingSystem.update(deltaTime, time)
```
- Updates Bézier curves
- Manages traffic simulation
- Maintains link visual state
- Updates link visuals (NeonLinkVisuals)
- **Critical**: All visual systems read link state after this

---

## Visual System Updates (After Gameplay Compute)

These systems consume gameplay state computed above.

### 5. Corruption Visual Integration (Visual Consumer)
```
t2CorruptionVisualIntegration.update(deltaTime, linkingSystem.links)
```
- Reads linkCorruptionLevel from each link
- Applies corruption particle effects
- Modulates link colors (red tint)
- Applies shader distortion
- **Depends on**: Link corruption state (from step 2)

### 6. Harmony Visual Consumer (Visual Consumer)
```
t2HarmonyVisualConsumer.update(deltaTime, aiNodes, harmonyStabilizationSystem)
```
- Reads node harmony levels
- Renders harmony particle effects
- Applies healing glow
- Dampens corruption visuals
- **Depends on**: Harmony state (from step 3)

### 7. Gameplay Feedback UI (Visual Consumer)
```
tier4GameplayIntegration.update(deltaTime)
```
- Updates gameplay indicators
- Renders feedback notifications
- Updates player HUD
- **Depends on**: Corruption + Harmony state

---

## Node Hierarchy Updates

### 8. Node Hierarchy System
```
nodeHierarchyBridge.update()
```
- Updates parent-child relationships
- Syncs hierarchy visual lines
- Cascades properties through families
- **Independent**: Reads node state but doesn't affect core gameplay

---

## Multi-Network Synchronization

### 9. Phase 5: Multi-Network Orchestrator
```
phase5MultiNetworkOrchestrator.update(deltaTime)
```
- Syncs between multiple networks
- Updates cross-network corruption flow
- **Depends on**: Individual network state (from steps 2-3)

### 10. Phase 5: Inter-Network Visualization Bridge
```
phase5InterNetworkVisualizationBridge.update(deltaTime)
```
- Renders inter-network connection visuals
- Shows corruption/harmony flow between networks
- **Depends on**: Multi-network orchestrator state

### 11. Phase 5: Cascade Propagation Visuals
```
phase5CascadePropagationVisuals.update(deltaTime)
```
- Renders cascade rings and expansion effects
- Animates cascade events
- **Depends on**: Corruption cascade state

### 12. Phase 5: Cascade Visualization Bridge
```
phase5CascadeVisualizationBridge.update(deltaTime)
```
- Bridges cascade logic to shader system
- Updates cascade-driven GPU effects
- **Depends on**: Cascade visual state

---

## Synergy & Resonance Systems

### 13. Link Personality State Machine
```
linkPersonalityStateMachine.update(deltaTime, linkingSystem.links)
```
- Updates link personality states
- Transitions between emotional states
- **Reads**: Link properties

### 14. Synergy Bonus Visualization
```
synergyBonusVisualization.update(deltaTime, linkingSystem.links)
```
- Detects high-synergy links
- Applies bonus visual effects
- **Reads**: Synergy scores from links

### 15. Synergy Bonus FX Layer
```
synergyBonusFXLayer.update(deltaTime, linkingSystem.links)
```
- GPU-based synergy flare effects
- Shader-driven bonus visuals
- **Reads**: Synergy state

### 16. Synergy Resonance Shader Pack
```
synergyResonanceShaderPack.update(deltaTime, linkingSystem.links)
```
- Multi-frequency resonance effects
- GPU shader updates
- **Reads**: Resonance state

### 17. Resonance Feedback System
```
resonanceFeedback.update(deltaTimeMs, aiNodes.nodes, linkingSystem.links)
```
- Network-level resonance feedback
- Emergent effects from synergy patterns
- **Reads**: Network topology + synergy

### 18. Synergy Chain Reaction
```
synergyChainReaction.update(deltaTimeMs, linkingSystem.links, aiNodes.nodes)
```
- Detects cascade opportunities
- Triggers emergent chain effects
- **Reads**: High-synergy clusters

### 19. Synergy Cascade FX Bridge
```
synergyCascadeFXBridge.update(deltaTimeMs, linkingSystem.links)
```
- Converts cascade logic to shader effects
- GPU particle system updates
- **Reads**: Cascade events

---

## Wave Dynamics & Advanced FX

### 20. Wave Interference Engine
```
waveInterferenceEngine.update(deltaTimeMs, { energyLevel, centerPos })
```
- Computes multi-origin wave interference
- Generates wave front data
- **Independent**: Can run anytime

### 21. Wave Shader Bridge
```
waveShaderBridge.update(deltaTime, { waveOrigins, interference })
```
- Injects wave data into GPU shaders
- Updates wave uniforms
- **Depends on**: Wave interference state

### 22. Wave Travel Shader Pack
```
waveTravelShaderPack.update(deltaTime)
```
- Animates wave travel effects
- GPU motion updates
- **Independent**: Renders computed waves

### 23. Wave Dynamics Shader Pack
```
waveDynamicsShaderPack.update(deltaTime)
```
- Advanced wave distortion layers
- Shader effects composition
- **Depends on**: Wave state

---

## Node & Personality Updates

### 24. AINodes System
```
aiNodes.update(deltaTime, time)
```
- Updates node lifecycle
- Applies natural decay
- Updates node internal states
- **Critical for**: All node-based systems

### 25. Node Personality System
```
nodePersonalitySystem.update(deltaTime, aiNodes.nodes)
```
- Updates personality traits
- Modulates node behavior
- **Reads**: Node state

### 26. Node Micro-Events
```
nodeMicroEvents.update(deltaTime, aiNodes.nodes)
```
- Triggers spontaneous node events
- Personality-driven behaviors
- **Reads**: Personality state

### 27. World Personality Controller
```
worldPersonalityController.update(deltaTime, aiNodes.nodes)
```
- Computes global mood
- Triggers world events
- **Reads**: Network personality aggregate

### 28. Mythic Ritual Controller
```
mythicRitualController.update(deltaTime, aiNodes.nodes)
```
- Manages rare ritual events
- **Reads**: Network state

---

## Glyph & Language Systems

### 29. Glyph System (3.0 & 4.0)
```
glyphSystem.update(deltaTime)
glyphSystem4.update(deltaTime, aiNodes.nodes)
```
- Updates glyph rendering
- Glyph state transitions
- **Reads**: Network activity

### 30. Glyph Layer 4 Multi-Fusion
```
glyphLayer4.update(deltaTime)
```
- Fuses multiple glyph layers
- Advanced glyph composition
- **Reads**: Multi-layer state

### 31. Semantic Glyph AI
```
semanticGlyphAI.update(deltaTime, aiNodes.nodes)
```
- AI-driven glyph meaning
- Semantic state updates
- **Reads**: Node semantics

### 32. Procedural Meaning Engine
```
proceduralMeaningEngine.update(deltaTime, aiNodes.nodes, semanticGlyphAI)
```
- Generates procedural meanings
- Combines semantic + glyph state
- **Reads**: AI semantic state

### 33. Link Glyph Flow
```
linkGlyphFlow.update(deltaTime)
```
- Animates glyph flow on links
- Flow direction/speed updates
- **Reads**: Link state

### 34. Linked Glyph Synchronization
```
linkedGlyphSync.update(deltaTime, aiNodes, linkingSystem)
```
- Keeps glyphs synced across links
- Harmony between connected nodes
- **Reads**: Link + node state

### 35. Linked Glyph Messaging
```
linkedGlyphMessaging.update(deltaTime, aiNodes, linkingSystem)
```
- Message passing via glyphs
- Information flow visualization
- **Reads**: Link connections

### 36. Recursive Glyph Messaging
```
recursiveGlyphMessaging.update(deltaTime, aiNodes, linkingSystem)
```
- Deep recursive message layers
- Complex information patterns
- **Reads**: Multi-hop link paths

### 37. Emergent Thought Storms
```
emergentThoughtStorms.update(deltaTime, aiNodes, linkingSystem)
```
- Emergent cognitive patterns
- Storm event generation
- **Reads**: Network topology

### 38. Narrative Patterns
```
narrativePatterns.update(deltaTime, aiNodes.nodes, linkingSystem.links, worldMetrics)
```
- Extracts narrative from network
- Story generation
- **Reads**: Global network state

---

## Personality & Shader Integration

### 39. Personality Visual Adapter
```
personalityVisualAdapter.update(deltaTime)
```
- Converts personality to visuals
- **Reads**: Personality state

### 40. Personality VFX Layer
```
personalityVFXLayer.update(deltaTime, time)
```
- Personality visual effects
- Particle + glow updates
- **Reads**: Personality traits

### 41. Personality Shader Bridge
```
personalityShaderBridge.update(deltaTime)
```
- GPU shader personality mapping
- Material updates
- **Reads**: Personality traits

### 42. Personality Shader Advanced FX
```
advancedShaderFX.update(deltaTime)
```
- Advanced distortion/effects
- GPU composition
- **Reads**: Shader state

### 43. Archetype Ascension Curves
```
archetypeCurves.update(deltaTime)
```
- Personality-driven curves
- Archetype evolution
- **Reads**: Node archetype

### 44. Archetype Aura Enhancement
```
archetypeAuraFX.update(deltaTime)
```
- Aura visual enhancement
- **Reads**: Archetype aura state

### 45. Archetype Color Palette
```
archetypeColorFX.update(deltaTime)
```
- Color palette transitions
- Archetype-driven colors
- **Reads**: Color state

---

## Camera & Rendering

### 46. Camera Systems (Polish Packs)
```
cameraPolishPack.update(deltaTime)
cameraPolishPack3.update(deltaTime)
```
- Camera smoothing
- Stabilization
- Anti-tilt fixes

### 47. Node Visuals 4.0
```
nodeVisuals4.update(deltaTime)
```
- Updates all node visual elements
- Holograms, rings, halos
- **Reads**: Node state

### 48. Final Render
```
renderer.render(scene, camera)
```
- Renders complete scene
- All systems should be updated before this

---

## Complete Execution Order (Numbered List)

1. LinkPriorityDecayEngine.update(dt, time)
2. LinkCorruptionTransmission_v1.update(dt) [game logic: corruption spreads]
3. HarmonyStabilizationSystem_v1.update(dt) [game logic: healing/counter]
4. LinkingSystem.update(dt, time) [core link state updated]
5. T2_CorruptionVisualIntegration.update(dt, links) [visual: reads corruption]
6. T2_HarmonyVisualConsumer.update(dt, nodes, harmony) [visual: reads harmony]
7. TIER4_GameplayIntegration.update(dt) [gameplay feedback]
8. NodeHierarchyBridge.update() [hierarchy sync]
9. PHASE5_MultiNetworkOrchestrator.update(dt)
10. PHASE5_InterNetworkVisualizationBridge.update(dt)
11. PHASE5_CascadePropagationVisuals.update(dt)
12. PHASE5_CascadeVisualizationBridge.update(dt)
13. LinkPersonalityStateMachine.update(dt, links)
14. SynergyBonusVisualization.update(dt, links)
15. SynergyBonusFXLayer.update(dt, links)
16. SynergyResonanceShaderPack.update(dt, links)
17. ResonanceFeedback.update(dt, nodes, links)
18. SynergyChainReaction.update(dt, links, nodes)
19. SynergyCascadeFXBridge.update(dt, links)
20. WaveInterferenceEngine.update(dt, {…})
21. WaveShaderBridge.update(dt, {…})
22. WaveTravelShaderPack.update(dt)
23. WaveDynamicsShaderPack.update(dt)
24. AINodes.update(dt, time)
25. NodePersonalitySystem.update(dt, nodes)
26. NodeMicroEvents.update(dt, nodes)
27. WorldPersonalityController.update(dt, nodes)
28. MythicRitualController.update(dt, nodes)
29. GlyphSystem.update(dt)
30. GlyphSystem4.update(dt, nodes)
31. GlyphLayer4.update(dt)
32. SemanticGlyphAI.update(dt, nodes)
33. ProceduralMeaningEngine.update(dt, nodes, glyphAI)
34. LinkGlyphFlow.update(dt)
35. LinkedGlyphSync.update(dt, nodes, links)
36. LinkedGlyphMessaging.update(dt, nodes, links)
37. RecursiveGlyphMessaging.update(dt, nodes, links)
38. EmergentThoughtStorms.update(dt, nodes, links)
39. NarrativePatterns.update(dt, nodes, links, worldMetrics)
40. PersonalityVisualAdapter.update(dt)
41. PersonalityVFXLayer.update(dt, time)
42. PersonalityShaderBridge.update(dt)
43. PersonalityShaderAdvancedFX.update(dt)
44. ArchetypeCurves.update(dt)
45. ArchetypeAuraFX.update(dt)
46. ArchetypeColorFX.update(dt)
47. CameraPolishPack.update(dt)
48. CameraPolishPack3.update(dt)
49. NodeVisuals4_0.update(dt)
50. Renderer.render(scene, camera)

---

## Critical Dependencies

| Step | Depends On | Reason |
|------|-----------|--------|
| 2 | 4 (Link state exists) | Must read links before spreading corruption |
| 3 | 2 (Corruption exists) | Harmony heals corruption |
| 5 | 4 (Link state exists) | Visual reads link corruption |
| 6 | 3 (Harmony exists) | Visual reads harmony state |
| 39-46 | 24-28 (Node state computed) | Personality visuals need node data |
| 50 | 1-49 (All systems updated) | Render must happen last |

---

## No-Skip Rule

All .update() calls execute **every frame**. No conditional skips (e.g., `if (enabled)`). 

Exception: Legacy systems marked DISABLED in imports do not run.

---

## Verification Checklist

- [ ] Step 2 runs before Step 3 (corruption before healing)
- [ ] Step 4 (LinkingSystem) runs before all visual systems
- [ ] Steps 5-7 (visual consumers) run after Steps 2-4
- [ ] Step 24 (AINodes) runs before personality systems
- [ ] All gameplay systems (1-4) run before visual systems (5-50)
- [ ] Renderer.render() is last call
- [ ] No duplicate .update() calls for same system
- [ ] No conditional skips of active systems

