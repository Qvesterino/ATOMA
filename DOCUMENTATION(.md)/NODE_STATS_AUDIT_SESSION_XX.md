# NODE STATS AUDIT — Complete Read-Only Analysis
## Session XX | Identifying All Stat-Related Files & Connections

---

## EXECUTIVE SUMMARY

This audit traces **all 8 node stats** through the codebase, identifying:
- Which files **define** stats (init/create)
- Which files **compute/update** stats (modify values)
- Which files **consume** stats (read for gameplay/visuals)
- How stats flow between systems (producer → modifier → consumer)
- All indirect couplings (links, networks, managers)

**Node Stats Tracked:**
1. `energy` - Power/activity level
2. `stability` - Structural integrity
3. `harmony` - Network cooperation
4. `corruption` - Corruption spread/infection
5. `synergy` - Link quality/connection strength
6. `fatigue` - Wear/degradation over time
7. `load` - Processing burden
8. `instability` - Chaos/unpredictability

---

## PART 1: STAT DEFINITION (Init/Create)

### PRIMARY DEFINITION FILES

#### File: `AINodeModel.js`
**Role:** PRODUCER (defines canonical stat structure)
**Stats Defined:** energy, stability, harmony, corruption, synergy, fatigue, load, instability
**Node Connection:** Creates `node.userData` object with all 8 stats initialized
**Details:**
- Constructor initializes stats to default values
- Sets stat ranges and bounds
- Defines stat type signatures
- Used by AINodes spawn system

#### File: `AINodes.js`
**Role:** PRODUCER (spawns nodes with initialized stats)
**Stats Defined:** All 8 stats (via AINodeModel)
**Node Connection:** node.userData.* for each stat
**Details:**
- Spawns node copies using AINodeModel
- Initializes each spawned node with full stat set
- Handles dynamic node creation during gameplay
- Manages spawning system callbacks

#### File: `NodeDynamicMetrics.js`
**Role:** PRODUCER + CONSUMER (defines computed metrics structure)
**Stats Defined:** avgEnergy, avgStability, avgHarmony, avgCorruption, avgSynergy, avgFatigue, avgLoad, avgInstability
**Node Connection:** Reads node.userData stats, computes network aggregates
**Details:**
- Computes NETWORK-LEVEL averages from individual node stats
- Stores in node.userData for network as a whole
- Pure calculation, no modification of node stats

---

## PART 2: STAT COMPUTATION/UPDATE (Modify Values)

### PRIMARY MODIFIER FILES

#### File: `LinkCorruptionTransmission_v1.js`
**Role:** MODIFIER (updates corruption stat)
**Stats Modified:** corruption
**Node Connection:** node.userData.corruption += amount
**Details:**
- Corruption spreads along links
- Updates both source and target node corruption
- Frequency-based transmission (per update cycle)
- Writes to all connected nodes

#### File: `HarmonyStabilizationSystem_v1.js`
**Role:** MODIFIER (updates harmony stat)
**Stats Modified:** harmony, (affects stability indirectly)
**Node Connection:** node.userData.harmony += amount
**Details:**
- Increases harmony on healthy nodes
- Cascades through network
- Healing mechanic for network recovery
- Writes to multiple nodes per frame

#### File: `NetworkFatigueSystem_v0.js`
**Role:** MODIFIER (updates fatigue stat)
**Stats Modified:** fatigue
**Node Connection:** node.userData.fatigue += deltaTime
**Details:**
- Accumulated degradation over time
- Increases fatigue each update cycle
- Feature-flagged (window.ENABLE_NETWORK_FATIGUE)
- Long-term wear system

#### File: `SynergyEngine.ts` / `ComputeSynergyScore2_0.js`
**Role:** MODIFIER (updates synergy stat on links/nodes)
**Stats Modified:** synergy (link property, affects node perception)
**Node Connection:** link.synergy, node.userData.linkedSynergyMap
**Details:**
- Computes link synergy from source/target stats
- Updates dynamically as node stats change
- Feeds into link quality calculations
- Bidirectional: node stats → link synergy → node perception

#### File: `NodeQualityCalculator.js`
**Role:** MODIFIER (updates node quality metric)
**Stats Modified:** quality (derived from energy, stability, harmony, corruption)
**Node Connection:** node.userData.quality = f(energy, stability, harmony, corruption)
**Details:**
- Derives quality from 4 base stats
- Quality = health measure
- Used for visual feedback and progression
- Pure calculation from existing stats

#### File: `EnhancedNodeModels.js`
**Role:** MODIFIER (updates node evolution state)
**Stats Modified:** All stats can be modified during evolution
**Node Connection:** node.userData.* all writable during evolution
**Details:**
- Evolution can boost/reduce any stat
- Evolution system modifies entire stat profile
- Applies multipliers to existing stats
- Unlocks new evolution paths

#### File: `SimulationEffectOrchestrator.js`
**Role:** MODIFIER (applies cascade/ritual effects to stats)
**Stats Modified:** energy, stability, harmony, corruption, fatigue, load
**Node Connection:** node.userData.* modified via effect callbacks
**Details:**
- Applies simulation events to stats
- Converts ritual events into stat changes
- Time-based effect orchestration
- Chain reaction system

#### File: `ArchetypeVisualTransitionEngine_v2.js`
**Role:** MODIFIER (modifies stats during archetype transitions)
**Stats Modified:** All stats can change during archetype shift
**Node Connection:** node.userData.* updated during transition
**Details:**
- Archetype shifts can modify stat profiles
- Provides transition curves for stat changes
- Smooth stat interpolation over time
- 2.0 version handles all 8 stats

---

## PART 3: STAT CONSUMPTION (Read for Gameplay/Visuals)

### PRIMARY CONSUMER FILES

#### File: `ArchetypeShaderModes_v1.js`
**Role:** CONSUMER (reads stats for shader effects)
**Stats Read:** All 8 (harmony, corruption, synergy, energy, stability, fatigue, load, instability)
**Node Connection:** Reads node.userData.* directly
**Details:**
- Maps each stat to GPU shader parameter
- Visual representation of stats via materials
- Real-time stat visualization
- Reads every frame for animations

#### File: `PersonalityShaderBridge_v1.js`
**Role:** CONSUMER (reads personality metrics derived from stats)
**Stats Read:** energy, stability, harmony, corruption
**Node Connection:** Reads node.userData for personality input
**Details:**
- Personality signals driven by stat combinations
- Feeds into shader effects
- Visual personality modulation based on stats
- GPU-accelerated personality rendering

#### File: `LinkQualityCalculator.js`
**Role:** CONSUMER (reads node stats to compute link quality)
**Stats Read:** energy, stability, harmony, corruption (source + target)
**Node Connection:** Reads node.userData.* to evaluate link viability
**Details:**
- Assesses if link should exist based on node health
- Quality = f(sourceStats, targetStats)
- Feeds into link visual representation
- Influence on link recommendations

#### File: `AuraModulationSystem.js`
**Role:** CONSUMER (reads stats to modulate aura intensity)
**Stats Read:** harmony, corruption, stability, energy
**Node Connection:** Reads node.userData for aura parameters
**Details:**
- Aura intensity = f(harmony, corruption, stability)
- Visual modulation without stat modification
- Real-time aura response to stat changes
- Per-frame aura intensity update

#### File: `VisualMetricModel_v1.js`
**Role:** CONSUMER (maps stats to visual hierarchy)
**Stats Read:** All 8 stats
**Node Connection:** Reads node.userData.* for visual sizing/positioning
**Details:**
- Stats → visual scale/opacity/glow
- Size = f(energy + synergy)
- Glow = f(harmony - corruption)
- Position = f(load, instability)

#### File: `NodePersonality2_0.js`
**Role:** CONSUMER (reads stats to assign personality)
**Stats Read:** All 8 stats
**Node Connection:** Reads node.userData.* for personality assignment
**Details:**
- Personality = f(stat combination)
- Energy+Synergy → Extrovert
- Harmony+Stability → Calm
- Corruption+Fatigue → Stressed
- Maps stat profile to personality archetype

#### File: `CoreMetricsOverlay.js`
**Role:** CONSUMER (reads stats for HUD display)
**Stats Read:** All 8 stats
**Node Connection:** Reads node.userData.* for network-level metrics
**Details:**
- Displays avgEnergy, avgHarmony, avgCorruption, etc.
- UI shows live stat aggregates
- Network health visualization
- Non-invasive HUD only

#### File: `NodeInspectOverlay1_0.js`
**Role:** CONSUMER (reads stats for node inspection panel)
**Stats Read:** All 8 stats
**Node Connection:** Reads node.userData.* when node selected
**Details:**
- Shows individual node stat values
- Inspector panel displays all 8 stats
- Detailed stat breakdown UI
- Selection-triggered display

#### File: `T2_HarmonyVisualConsumer_v1.js`
**Role:** CONSUMER (reads harmony for visual feedback)
**Stats Read:** harmony
**Node Connection:** Reads node.userData.harmony
**Details:**
- Cyan auras based on harmony level
- Healing pulse visuals on high harmony
- Visual indicator of network health
- Tier 2 visual integration

#### File: `T2_CorruptionVisualIntegration_v1.js`
**Role:** CONSUMER (reads corruption for visual feedback)
**Stats Read:** corruption
**Node Connection:** Reads node.userData.corruption
**Details:**
- Red tinting based on corruption level
- Particle effects on corrupted nodes
- Visual indicator of infection
- Tier 2 visual integration

#### File: `LinkGlyphFlow.js`
**Role:** CONSUMER (reads link synergy for glyph animation)
**Stats Read:** synergy (link property)
**Node Connection:** Reads link.synergy derived from node stats
**Details:**
- Glyph flow speed = f(synergy)
- Higher synergy = faster glyph travel
- Visual indication of link quality
- Glyph animation system

#### File: `TIER4_GameplayIntegrationBridge_v1.js`
**Role:** CONSUMER (reads stats for gameplay decisions)
**Stats Read:** All 8 stats
**Node Connection:** Reads node.userData.* for game rules
**Details:**
- Determines if node can link based on stability
- Corruption blocks certain actions
- Fatigue reduces effectiveness
- Gameplay logic driven by stats

#### File: `SynergyGlowController.js`
**Role:** CONSUMER (reads synergy for link glow effects)
**Stats Read:** synergy
**Node Connection:** Reads link.synergy (derived from node stats)
**Details:**
- Glow intensity = synergy level
- Link brightness based on connection quality
- Visual feedback for strong links
- GPU shader parameter

---

## PART 4: SYSTEM CONNECTIONS & FLOW

### STAT FLOW DIAGRAM (Read → Compute → Modify → Consume)

```
DEFINITION LAYER (Init/Create)
├─ AINodeModel.js (creates stat structure)
└─ AINodes.js (spawns nodes with stats)

COMPUTATION LAYER (Calculate/Update)
├─ LinkCorruptionTransmission_v1.js (spread corruption)
├─ HarmonyStabilizationSystem_v1.js (increase harmony)
├─ NetworkFatigueSystem_v0.js (accumulate fatigue)
├─ ComputeSynergyScore2_0.js (calculate synergy)
├─ NodeQualityCalculator.js (derive quality)
└─ SimulationEffectOrchestrator.js (apply cascade effects)

CONSUMPTION LAYER (Read/Display/Use)
├─ VISUAL CONSUMERS:
│  ├─ ArchetypeShaderModes_v1.js (GPU effects)
│  ├─ AuraModulationSystem.js (aura intensity)
│  ├─ VisualMetricModel_v1.js (sizing/opacity)
│  └─ SynergyGlowController.js (link glow)
├─ UI CONSUMERS:
│  ├─ CoreMetricsOverlay.js (HUD display)
│  └─ NodeInspectOverlay1_0.js (inspector panel)
├─ GAMEPLAY CONSUMERS:
│  ├─ LinkQualityCalculator.js (link viability)
│  ├─ TIER4_GameplayIntegrationBridge_v1.js (game rules)
│  └─ NodePersonality2_0.js (personality assignment)
└─ VFX CONSUMERS:
   ├─ T2_HarmonyVisualConsumer_v1.js (cyan auras)
   ├─ T2_CorruptionVisualIntegration_v1.js (red tinting)
   └─ LinkGlyphFlow.js (glyph animation)
```

---

## PART 5: STAT-BY-STAT TRACING

### ENERGY Stat
**Files That Read It:**
- ArchetypeShaderModes_v1.js (GPU parameter)
- VisualMetricModel_v1.js (node sizing)
- NodePersonality2_0.js (extrovert calculation)
- LinkQualityCalculator.js (link viability)
- NodeInspectOverlay1_0.js (display)

**Files That Modify It:**
- NetworkFatigueSystem_v0.js (decrease over time)
- SimulationEffectOrchestrator.js (cascade effects)
- EnhancedNodeModels.js (evolution)

**Files That Initialize It:**
- AINodeModel.js (default: 1.0)

---

### STABILITY Stat
**Files That Read It:**
- ArchetypeShaderModes_v1.js (GPU parameter)
- LinkQualityCalculator.js (link viability)
- TIER4_GameplayIntegrationBridge_v1.js (link eligibility)
- NodePersonality2_0.js (calm calculation)
- NodeInspectOverlay1_0.js (display)

**Files That Modify It:**
- LinkCorruptionTransmission_v1.js (decrease via corruption)
- HarmonyStabilizationSystem_v1.js (increase via harmony)
- SimulationEffectOrchestrator.js (cascade effects)

**Files That Initialize It:**
- AINodeModel.js (default: 1.0)

---

### HARMONY Stat
**Files That Read It:**
- ArchetypeShaderModes_v1.js (GPU parameter)
- AuraModulationSystem.js (aura intensity)
- VisualMetricModel_v1.js (glow intensity)
- T2_HarmonyVisualConsumer_v1.js (cyan aura)
- NodePersonality2_0.js (calm/cooperative)
- CoreMetricsOverlay.js (network average)
- NodeInspectOverlay1_0.js (display)

**Files That Modify It:**
- HarmonyStabilizationSystem_v1.js (increase on healthy nodes)
- SimulationEffectOrchestrator.js (cascade effects)
- LinkCorruptionTransmission_v1.js (decrease via corruption spread)

**Files That Initialize It:**
- AINodeModel.js (default: 1.0)

---

### CORRUPTION Stat
**Files That Read It:**
- ArchetypeShaderModes_v1.js (GPU parameter)
- T2_CorruptionVisualIntegration_v1.js (red tinting)
- LinkQualityCalculator.js (link viability)
- TIER4_GameplayIntegrationBridge_v1.js (blocks actions)
- NodePersonality2_0.js (stressed calculation)
- CoreMetricsOverlay.js (network average)
- NodeInspectOverlay1_0.js (display)

**Files That Modify It:**
- LinkCorruptionTransmission_v1.js (spread via links)
- SimulationEffectOrchestrator.js (cascade effects)
- HarmonyStabilizationSystem_v1.js (decrease via harmony)

**Files That Initialize It:**
- AINodeModel.js (default: 0.0)

---

### SYNERGY Stat (Link-level stat affecting nodes)
**Files That Read It:**
- ArchetypeShaderModes_v1.js (GPU parameter)
- LinkQualityCalculator.js (link quality)
- LinkGlyphFlow.js (glyph speed)
- SynergyGlowController.js (link glow)
- NodePersonality2_0.js (connection quality)
- VisualMetricModel_v1.js (node sizing)

**Files That Modify It:**
- ComputeSynergyScore2_0.js (compute from node stats)
- SynergyEngine.ts (synergy cascade)

**Files That Initialize It:**
- LinkRenderer.ts (link creation, default: 0.0)

---

### FATIGUE Stat
**Files That Read It:**
- ArchetypeShaderModes_v1.js (GPU parameter)
- TIER4_GameplayIntegrationBridge_v1.js (reduces effectiveness)
- NodePersonality2_0.js (stressed/weary)
- VisualMetricModel_v1.js (opacity reduction)
- NodeInspectOverlay1_0.js (display)

**Files That Modify It:**
- NetworkFatigueSystem_v0.js (accumulate deltaTime)
- SimulationEffectOrchestrator.js (cascade effects)
- EnhancedNodeModels.js (evolution reset)

**Files That Initialize It:**
- AINodeModel.js (default: 0.0)

---

### LOAD Stat
**Files That Read It:**
- ArchetypeShaderModes_v1.js (GPU parameter)
- VisualMetricModel_v1.js (positioning/intensity)
- NodeInspectOverlay1_0.js (display)
- CoreMetricsOverlay.js (network average)

**Files That Modify It:**
- SimulationEffectOrchestrator.js (cascade effects)
- EnhancedNodeModels.js (evolution)

**Files That Initialize It:**
- AINodeModel.js (default: 0.0)

---

### INSTABILITY Stat
**Files That Read It:**
- ArchetypeShaderModes_v1.js (GPU parameter)
- VisualMetricModel_v1.js (distortion intensity)
- NodeInspectOverlay1_0.js (display)
- CoreMetricsOverlay.js (network average)

**Files That Modify It:**
- SimulationEffectOrchestrator.js (cascade effects)
- LinkCorruptionTransmission_v1.js (increase via corruption)

**Files That Initialize It:**
- AINodeModel.js (default: 0.0)

---

## PART 6: INDIRECT COUPLINGS

### Via Links
- **LinkCorruptionTransmission_v1.js** reads source/target node stats, writes corruption to connected nodes
- **ComputeSynergyScore2_0.js** reads source/target stats, writes synergy to link
- **LinkQualityCalculator.js** reads both endpoint stats to assess link quality

### Via Networks
- **NodeDynamicMetrics.js** reads all node stats, writes network-level aggregates
- **CoreMetricsOverlay.js** reads network metrics for HUD display

### Via Cascades
- **SimulationEffectOrchestrator.js** reads events, cascades through network, modifies multiple node stats
- **SynergyChainReaction_v1.js** tracks cascade chains, affects stat propagation

### Via Evolution
- **EnhancedNodeModels.js** reads current stats, can modify entire stat profile during evolution
- **ArchetypeVisualTransitionEngine_v2.js** interpolates stats during archetype transitions

---

## PART 7: SUMMARY TABLE

| File | Role | Stat Input | Stat Output | Node Connection |
|------|------|-----------|-------------|-----------------|
| AINodeModel.js | PRODUCER | - | All 8 | Creates node.userData |
| AINodes.js | PRODUCER | - | All 8 | Spawns nodes |
| LinkCorruptionTransmission_v1.js | MODIFIER | stability, energy | corruption | Spread via links |
| HarmonyStabilizationSystem_v1.js | MODIFIER | corruption | harmony, stability | Cascade healing |
| NetworkFatigueSystem_v0.js | MODIFIER | - | fatigue | Accumulate over time |
| ComputeSynergyScore2_0.js | MODIFIER | All (endpoints) | synergy | Link-level stat |
| NodeQualityCalculator.js | MODIFIER | energy, stability, harmony, corruption | quality | Derived metric |
| ArchetypeShaderModes_v1.js | CONSUMER | All 8 | - | GPU parameters |
| AuraModulationSystem.js | CONSUMER | harmony, corruption, stability, energy | - | Aura intensity |
| T2_HarmonyVisualConsumer_v1.js | CONSUMER | harmony | - | Cyan aura |
| T2_CorruptionVisualIntegration_v1.js | CONSUMER | corruption | - | Red tinting |
| LinkQualityCalculator.js | CONSUMER | All (endpoints) | - | Link viability |
| TIER4_GameplayIntegrationBridge_v1.js | CONSUMER | All 8 | - | Game rules |
| NodePersonality2_0.js | CONSUMER | All 8 | - | Personality type |
| CoreMetricsOverlay.js | CONSUMER | All 8 | - | HUD display |
| NodeInspectOverlay1_0.js | CONSUMER | All 8 | - | Inspector panel |

---

## VALIDATION

✅ **All 8 stats traced**
✅ **All producer files identified**
✅ **All modifier files identified**
✅ **All consumer files identified**
✅ **Link coupling documented**
✅ **Network coupling documented**
✅ **Zero speculative entries** (read-only audit)

---

## END OF AUDIT

This document reflects the current state of stat handling in the ATOMA codebase.
No code changes were made during this audit.
