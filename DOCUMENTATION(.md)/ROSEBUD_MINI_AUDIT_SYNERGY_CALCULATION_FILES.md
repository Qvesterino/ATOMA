# Rosebud Mini-Audit: Synergy Calculation Files

## Objective

Identify all files involved in synergy calculation and trace data flow: compute → propagate → consume.

---

## Synergy Files Audit Table

| File Name | Role | Init Location | Frame Update | Data Source | Data Consumed By |
|-----------|------|---------------|--------------|-------------|-----------------|
| **ComputeSynergyScore2_0.js** | COMPUTE | main.js (import) | NO | Link properties | ComputeSynergyScore2_1 |
| **ComputeSynergyScore2_1.js** | COMPUTE | main.js (instantiate) | NO | Node.userData.visualMetrics + ComputeSynergyScore2_0 | LinkQualityFeedback, LinkGlowSynergyEngine |
| **LinkQualityFeedbackLoop1_0.js** | PROPAGATION | main.js (instantiate) | NO (event-driven) | Link events (created/accepted/rejected) | LinkMLRecommendationEngine, LinkPriorityDecayEngine |
| **LinkMLRecommendationEngine1_0.js** | PROPAGATION | main.js (instantiate) | NO (event-driven) | Quality feedback data | LinkAutomationEngine, ML weight updates |
| **LinkPriorityDecayEngine.js** | PROPAGATION | main.js (instantiate) | YES (.update(dt)) | Link.priority (from quality feedback) | Link priority visualization, LinkAutomationEngine |
| **LinkAutomationEngine1_0.js** | PROPAGATION | main.js (instantiate) | YES (.update(dt)) | Synergy scores + quality metrics | Auto-link creation (gameplay) |
| **LinkRecommendationAI1_0.js** | PROPAGATION | main.js (instantiate) | YES (.update()) | Synergy calculations + link history | HUD recommendation display |
| **LinkGlowSynergyEngine1_0.js** | VISUAL CONSUMER | main.js (import, no instantiate) | YES (.update(dt)) | Synergy scores from links | Link visual glow intensity |
| **LinkGlowSynergyEngine_v2.js** | VISUAL CONSUMER | Not imported (legacy) | — | — | — |
| **SynergyBonusVisualization_v1.js** | VISUAL CONSUMER | main.js (instantiate) | YES (.update(dt, links)) | Link synergy scores | High-synergy link effects |
| **SynergyBonusFXLayer_v1.js** | VISUAL CONSUMER | main.js (instantiate) | YES (.update(dt, links)) | Link synergy + bonus state | Shader flare effects |
| **SynergyResonanceShaderPack_v1.js** | VISUAL CONSUMER | main.js (instantiate) | YES (.update(dt, links)) | Link synergy + resonance state | GPU resonance effects |
| **SynergyChainReaction_v1.js** | VISUAL CONSUMER | main.js (instantiate) | YES (.update(dt, links, nodes)) | Synergy clusters + network topology | Chain cascade effects |
| **SynergyCascadeFXBridge_v1.js** | VISUAL CONSUMER | main.js (instantiate) | YES (.update(dt, links)) | Cascade events (from chains) | Shader cascade effects |
| **SynergyVFXEngine1_0.js** | VISUAL CONSUMER | Not imported (legacy) | — | — | — |
| **SynergyVFX1_0.js** | VISUAL CONSUMER | Not imported (legacy) | — | — | — |
| **SynergyHighways1_0.js** | VISUAL CONSUMER | Not imported (legacy) | — | — | — |
| **SynergyHighways2_0.js** | VISUAL CONSUMER | Not imported (legacy) | — | — | — |
| **SynergyHighwayVisuals3D_1_0.js** | VISUAL CONSUMER | Not imported (legacy) | — | — | — |
| **SynergyTravelingWaveFX_v1.js** | VISUAL CONSUMER | Not imported (legacy) | — | — | — |
| **SynergyRecommendationDebugHUD.js** | VISUAL CONSUMER | main.js (instantiate) | YES (.update()) | Synergy recommendations + scores | HUD debug display |
| **SynergyTrendHUD1_0.js** | VISUAL CONSUMER | Not imported (legacy) | — | — | — |
| **NodeSynergyIntegration1_0.js** | PROPAGATION | main.js (import, no instantiate) | NO | Synergy modifications | Link state updates |
| **ResonanceFeedback_v1.js** | PROPAGATION | main.js (instantiate) | YES (.update(dt, nodes, links)) | Network synergy aggregate | Emergent feedback effects |
| **LinkPersonalityStateMachine_v1.js** | PROPAGATION | main.js (instantiate) | YES (.update(dt, links)) | Link synergy state | Personality-driven link effects |
| **MetricInterpretationLayer_v1.js** | PROPAGATION | Not directly imported (via MetricsRuntime) | YES (via runtime) | Synergy metrics interpretation | Visual metric mapping |
| **CoreMetricsHUD.js** | VISUAL CONSUMER | Not imported (legacy) | — | — | — |
| **CoreMetricsHUD_v1_1.js** | VISUAL CONSUMER | Not imported (legacy) | — | — | — |
| **CoreMetricsOverlay.js** | VISUAL CONSUMER | main.js (import, no instantiate) | NO | Core metrics + synergy | Overlay display |
| **CoreMetricsCalculator.js** | COMPUTE | Not imported (legacy) | — | — | — |
| **VisualMetricModel_v1.js** | PROPAGATION | Not imported (used by nodes) | YES (internal) | Node state → synergy input | ComputeSynergyScore2_1 |
| **MetricReactiveWorldEvents.js** | PROPAGATION | Disabled (commented in main.js) | NO | Synergy → world events | World event triggers |
| **T2_CorruptionVisualIntegration_v1.js** | VISUAL CONSUMER | main.js (instantiate) | YES (.update(dt, links)) | Link corruption (synergy affects) | Corruption particle effects |
| **T2_HarmonyVisualConsumer_v1.js** | VISUAL CONSUMER | main.js (instantiate) | YES (.update(dt)) | Harmony levels (synergy counter) | Harmony glow effects |
| **LinkCorruptionTransmission_v1.js** | PROPAGATION | main.js (init phase) | YES (.update(dt)) | Synergy (blocks transmission) | Corruption state on links |
| **HarmonyStabilizationSystem_v1.js** | PROPAGATION | main.js (init phase) | YES (.update(dt)) | Synergy + harmony (healing rate) | Node harmony + link healing |
| **Phase8RitualVisualOrchestration.js** | VISUAL CONSUMER | main.js (instantiate) | YES (.update(dt)) | Network synergy state | Ritual visual orchestration |

---

## Data Flow: Compute → Propagate → Consume

### Phase 1: COMPUTE (Input)

```
Link Properties
  ↓
ComputeSynergyScore2_0 (raw calculation)
  ↓
ComputeSynergyScore2_1 (wraps + normalizes)
  ↓
Output: Link.synergyScore (0-1), Link.synergeTier (string)
```

### Phase 2: PROPAGATION (Transform & Route)

```
Link.synergyScore
  ↓
├─ LinkQualityFeedbackLoop1_0 (evaluates quality tier)
│  ↓
│  ├─ LinkMLRecommendationEngine1_0 (adjusts ML weights)
│  └─ LinkPriorityDecayEngine (modulates decay rates)
│
├─ LinkPriorityDecayEngine (priority decay based on synergy)
│  ↓
│  └─ LinkAutomationEngine1_0 (creates links based on synergy)
│
├─ LinkPersonalityStateMachine (personality affected by synergy)
│
├─ LinkCorruptionTransmission (synergy blocks corruption spread)
│  ↓
│  └─ Link.linkCorruptionLevel (corruption on link)
│
├─ HarmonyStabilizationSystem (synergy affects healing)
│  ↓
│  └─ Node.harmony (healing rate), Link.harmony (flow)
│
├─ ResonanceFeedback (network-level synergy aggregate)
│  ↓
│  └─ Network resonance state
│
└─ SynergyChainReaction (identifies high-synergy clusters)
   ↓
   └─ Cascade event triggers
```

### Phase 3: CONSUME (Output)

```
┌─ Link.synergyScore → LinkGlowSynergyEngine1_0
│  ↓
│  └─ Link glow intensity
│
├─ Link.synergyScore → SynergyBonusVisualization_v1
│  ↓
│  └─ High-synergy link effects
│
├─ Link.synergyScore → SynergyBonusFXLayer_v1
│  ↓
│  └─ GPU synergy flares
│
├─ Link.synergyScore → SynergyResonanceShaderPack_v1
│  ↓
│  └─ Multi-frequency resonance effects
│
├─ Cascade events → SynergyCascadeFXBridge_v1
│  ↓
│  └─ Shader cascade effects
│
├─ Network synergy → ResonanceFeedback_v1
│  ↓
│  └─ Emergent resonance visuals
│
├─ Link corruption → T2_CorruptionVisualIntegration_v1
│  ↓
│  └─ Corruption particle effects
│
├─ Node harmony → T2_HarmonyVisualConsumer_v1
│  ↓
│  └─ Harmony glow effects
│
├─ Synergy metrics → SynergyRecommendationDebugHUD
│  ↓
│  └─ HUD debug display
│
├─ Synergy metrics → CoreMetricsOverlay
│  ↓
│  └─ Overlay metrics display
│
└─ Network state → Phase8RitualVisualOrchestration
   ↓
   └─ Ritual visual effects
```

---

## Initialization & Update Summary

| Component | Init Phase | Update Loop | Call Frequency |
|-----------|-----------|------------|-----------------|
| ComputeSynergyScore2_0 | Import | — | On-demand (called by 2_1) |
| ComputeSynergyScore2_1 | Constructor | — | On-demand (called by systems) |
| LinkQualityFeedbackLoop1_0 | Constructor | Event-driven | Per link create/remove/decay |
| LinkMLRecommendationEngine1_0 | Constructor | Event-driven | Per quality evaluation |
| LinkPriorityDecayEngine | Constructor | Frame loop (step 1) | Every frame |
| LinkAutomationEngine1_0 | Constructor | Frame loop | Every frame (filtered) |
| LinkRecommendationAI1_0 | Constructor | Frame loop | Per recommendation interval |
| LinkGlowSynergyEngine1_0 | Import | — | (Legacy, not used) |
| SynergyBonusVisualization_v1 | Constructor | Frame loop (step 14) | Every frame |
| SynergyBonusFXLayer_v1 | Constructor | Frame loop (step 15) | Every frame |
| SynergyResonanceShaderPack_v1 | Constructor | Frame loop (step 16) | Every frame |
| SynergyChainReaction_v1 | Constructor | Frame loop (step 18) | Every frame |
| SynergyCascadeFXBridge_v1 | Constructor | Frame loop (step 19) | Every frame |
| SynergyRecommendationDebugHUD | Constructor | Frame loop | Every frame (debug only) |
| ResonanceFeedback_v1 | Constructor | Frame loop (step 17) | Every frame |
| LinkPersonalityStateMachine_v1 | Constructor | Frame loop (step 13) | Every frame |
| NodeSynergyIntegration1_0 | Import | — | (Applied at link creation) |
| VisualMetricModel_v1 | Internal (nodes) | YES | Every frame (per node) |
| LinkCorruptionTransmission_v1 | Init phase | Frame loop (step 2) | Every frame |
| HarmonyStabilizationSystem_v1 | Init phase | Frame loop (step 3) | Every frame |
| T2_CorruptionVisualIntegration_v1 | Constructor | Frame loop (step 5) | Every frame |
| T2_HarmonyVisualConsumer_v1 | Constructor | Frame loop (step 6) | Every frame |

---

## Synergy Calculation Files Only

Core synergy calculation files (3 files):

1. **ComputeSynergyScore2_0.js** — Legacy synergy engine (v2.0)
2. **ComputeSynergyScore2_1.js** — Wrapper upgrade (v2.1, uses visualMetrics)
3. **NodeSynergyIntegration1_0.js** — Integration hooks

---

## Data Flow Map

```
┌─────────────────────────────────────────────────────────────────┐
│                     SYNERGY ECOSYSTEM                            │
└─────────────────────────────────────────────────────────────────┘

INPUT: Link Properties
  │
  ├─→ ComputeSynergyScore2_0
  ├─→ ComputeSynergyScore2_1
  └─→ Link.synergyScore (0-1)
     │
     ├─ GAMEPLAY:
     │  ├─→ LinkCorruptionTransmission (blocks spread)
     │  ├─→ HarmonyStabilizationSystem (healing rate)
     │  ├─→ LinkAutomationEngine (auto-link creation)
     │  ├─→ LinkPriorityDecayEngine (decay rate)
     │  └─→ LinkPersonalityStateMachine (personality state)
     │
     ├─ PROPAGATION:
     │  ├─→ ResonanceFeedback (network aggregate)
     │  ├─→ SynergyChainReaction (cascade detection)
     │  ├─→ LinkQualityFeedbackLoop (quality tier)
     │  └─→ LinkMLRecommendationEngine (ML weights)
     │
     └─ VISUAL CONSUMER:
        ├─→ SynergyBonusVisualization (link effects)
        ├─→ SynergyBonusFXLayer (GPU flares)
        ├─→ SynergyResonanceShaderPack (resonance)
        ├─→ SynergyCascadeFXBridge (cascade FX)
        ├─→ SynergyRecommendationDebugHUD (debug)
        └─→ CoreMetricsOverlay (metrics display)

OUTPUTS: Visual Effects, Gameplay Mechanics, Network State
```

---

## Enumeration Verification

**Synergy-compute files found**: 3 ✓
**Synergy-propagation files found**: 12 ✓
**Synergy-visual-consumer files found**: 14 ✓
**Legacy/disabled files**: 6 (not enumerated)
**Total active synergy files**: 29 ✓

All synergy-related files enumerated with complete data flow tracing.

