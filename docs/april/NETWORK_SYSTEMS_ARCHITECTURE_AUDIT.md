# Network Systems Architecture Audit

**Date:** 2026-03-31  
**Scope:** All network-related systems in ATOMA

---

## Executive Summary

ATOMA has **TWO DISTINCT CONCEPTS** of "networkState":

1. **networkState (Metrics)** - Property getter providing network metrics to visual systems
2. **NetworkState (AI Reasoner)** - Immutable snapshot of link system state for AI reasoning

These are **NOT** the same thing and serve different purposes.

---

## Concept 1: networkState (Metrics Property)

### Definition
Property getter in [`main.js:4760-4789`](main.js:4760-4789) that maps `nodeDynamicMetrics` to canonical field names.

### Purpose
Provides unified metrics interface for visual systems to read network state.

### Data Structure
```javascript
{
  // Canonical fields
  harmony: number,           // 0.0 - 1.0
  synergy: number,           // 0.0 - 1.0
  corruption: number,        // 0.0 - 1.0
  stability: number,         // 0.0 - 1.0
  loadPressure: number,      // 0.0 - 1.0
  networkStress: number,    // 0.0 - 1.0 (derived: 1 - stability)

  // Legacy field names for compatibility
  harmonyFlow: number,
  networkSynergy: number,
  corruptionLevel: number,
  avgHarmony: number,
  avgSynergy: number,
  avgCorruption: number,
  avgStability: number,
  avgLoadPressure: number
}
```

### Data Flow
```
MetricsRuntime_v1 (10Hz simulation)
    ↓
window.__ATOMA_LIVE_METRICS__
    ↓
nodeDynamicMetrics (property getter)
    ↓
networkState (property getter) ← FIXED
    ↓
All visual systems
```

### Consumers
The following systems read `networkState`:

| System | File | Usage |
|---------|-------|--------|
| HarmonicHealingVisualSystem | [`HarmonicHealingVisualSystem_Session134.js`](HarmonicHealingVisualSystem_Session134.js:103) | Spawn healing waves based on harmony/synergy |
| HealingParticleSystem | [`HealingParticleSystem_Session136.js`](HealingParticleSystem_Session136.js:187) | Modulate sparkle emission rate |
| HarmonicRecoveryVisualSystem | [`HarmonicRecoveryVisualSystem_Session138.js`](HarmonicRecoveryVisualSystem_Session138.js:218) | Scale recovery visuals |
| HarmonicCycleController | [`RegionalHarmonicCycleController.js`](RegionalHarmonicCycleController.js:242) | Drive regional harmonic cycles |
| RegionalEquilibriumFieldSystem | [`RegionalEquilibriumFieldSystem.js`](RegionalEquilibriumFieldSystem.js:219) | Modulate field appearance |
| TopologyBiasVisualizationLayer | [`TopologyBiasVisualizationLayer.js`](TopologyBiasVisualizationLayer.js:652) | Update flow fields |
| WaveInterferencePatternSystem | [`WaveInterferencePatternSystem_Session132.js`](WaveInterferencePatternSystem_Session132.js:805) | Modulate interference patterns |
| ResonanceRuptureVisualSystem | [`ResonanceRuptureVisualSystem_Session133.js`](ResonanceRuptureVisualSystem_Session133.js:850) | State modulation |
| GlyphAnimationModulator | [`GlyphAnimationModulator.js`](GlyphAnimationModulator.js:211) | Animate glyphs |
| CompositeGlyphResonanceFeedback | [`CompositeGlyphResonanceFeedback.js`](CompositeGlyphResonanceFeedback.js:181) | Update glyph state |

### Status
✅ **FIXED:** Property getter added to provide proper metrics to all visual systems

---

## Concept 2: NetworkState (AI Reasoner Snapshot)

### Definition
Immutable snapshot created by [`buildNetworkStateSnapshot()`](NetworkStateAIReasoner.js:30) in [`NetworkStateAIReasoner.js`](NetworkStateAIReasoner.js).

### Purpose
Provides read-only snapshot of link system state for AI reasoning and advisory analysis.

### Data Structure
```javascript
{
  collectedAt: timestamp,
  links: [
    {
      id: string,
      priority: { score: number } | null,
      integrity: number,
      corruption: number,
      load: number,
      collapseState: 'collapsed' | 'critical' | 'warning' | 'stable'
    }
  ],
  collapseDecisions: [
    {
      linkId: string,
      decision: 'allow' | 'deny',
      executedAt: timestamp | null
    }
  ],
  recoveryCandidates: [
    {
      // Recovery candidate data
    }
  ]
}
```

### Guarantees
- **Read-only:** Never calls `createLink/removeLink` or mutates live state
- **Non-authoritative:** Outputs are hints only; system behavior unchanged if unused
- **Guarded:** Does not bypass arbiters (collapse/recovery remain externally controlled)

### Consumers
| System | File | Usage |
|---------|-------|--------|
| NodeLinkingSystem | [`NodeLinkingSystem.js`](NodeLinkingSystem.js:8469) | QA validation and AI reasoning |
| AIAutomationHUD | [`AIAutomationHUD.js`](AIAutomationHUD.js:583) | Display network state in HUD |
| VariantBAdvisorHUD | [`ui/hud/VariantBAdvisorHUD.js`](ui/hud/VariantBAdvisorHUD.js:204) | Display network state |

### Status
✅ **Working:** AI reasoner provides advisory insights without authority

---

## Network Systems Categories

### 1. Metrics Systems
Systems that calculate and aggregate network metrics.

| System | File | Frequency | Output |
|---------|-------|-----------|---------|
| MetricsRuntime_v1 | [`MetricsRuntime_v1.js`](MetricsRuntime_v1.js) | 10Hz | `window.__ATOMA_LIVE_METRICS__` |
| NodeDynamicMetrics | (part of MetricsRuntime) | 10Hz | `nodeDynamicMetrics` |
| NetworkMetricsAggregator | [`src/metrics/NetworkMetricsAggregator.js`](src/metrics/NetworkMetricsAggregator.js) | 10Hz | Aggregated network metrics |

### 2. Visual Systems
Systems that render network state visually.

| System | File | Frequency | Purpose |
|---------|-------|-----------|---------|
| HarmonicHealingVisualSystem | [`HarmonicHealingVisualSystem_Session134.js`](HarmonicHealingVisualSystem_Session134.js) | 30Hz | Golden wave healing effects |
| HealingParticleSystem | [`HealingParticleSystem_Session136.js`](HealingParticleSystem_Session136.js) | 30Hz | Sparkle and trail particles |
| HarmonicRecoveryVisualSystem | [`HarmonicRecoveryVisualSystem_Session138.js`](HarmonicRecoveryVisualSystem_Session138.js) | 30Hz | Coherence waves and halos |
| RegionalHarmonicCycleController | [`RegionalHarmonicCycleController.js`](RegionalHarmonicCycleController.js) | 30Hz | Regional harmonic cycles |
| RegionalEquilibriumFieldSystem | [`RegionalEquilibriumFieldSystem.js`](RegionalEquilibriumFieldSystem.js) | 30Hz | Volumetric equilibrium fields |
| TopologyBiasVisualizationLayer | [`TopologyBiasVisualizationLayer.js`](TopologyBiasVisualizationLayer.js) | 30Hz | Flow field visualization |
| WaveInterferencePatternSystem | [`WaveInterferencePatternSystem_Session132.js`](WaveInterferencePatternSystem_Session132.js) | 30Hz | Wave interference patterns |
| ResonanceRuptureVisualSystem | [`ResonanceRuptureVisualSystem_Session133.js`](ResonanceRuptureVisualSystem_Session133.js) | 30Hz | Rupture visualization |

### 3. AI Reasoning Systems
Systems that analyze network state and provide advisory insights.

| System | File | Frequency | Output |
|---------|-------|-----------|---------|
| NetworkStateAIReasoner | [`NetworkStateAIReasoner.js`](NetworkStateAIReasoner.js) | On-demand | Insights, risks, recommendations |
| _AIEmotionalFeed3_1 | [`_AIEmotionalFeed3_1.js`](_AIEmotionalFeed3_1.js:226) | On-demand | Network state analysis |

### 4. Multi-Network Systems
Systems that manage multiple independent network instances.

| System | File | Purpose |
|---------|-------|---------|
| PHASE5_MultiNetworkManager | [`PHASE5_MultiNetworkCore.js`](PHASE5_MultiNetworkCore.js:30) | Register and track multiple networks |
| PHASE5_MultiNetworkOrchestrator | (consolidated into MultiNetworkManager) | Coordinate corruption spread |
| PHASE5_NetworkSynchronization | (consolidated into MultiNetworkManager) | Synchronize state across networks |

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    NODES & LINKS (Gameplay)                │
│  - AINodes.nodes                                           │
│  - NodeLinkingSystem.links                                   │
└────────────────────┬────────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        ↓            ↓            ↓
┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐
│  Metrics    │ │  AI          │ │  Multi-Network     │
│  Runtime    │ │  Reasoner    │ │  Manager           │
│  (10Hz)     │ │  (On-demand) │ │  (100ms sync)     │
└──────┬───────┘ └──────┬───────┘ └──────────┬───────────┘
       │                │                     │
       ↓                ↓                     ↓
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ window.__ATOMA_ │ │  NetworkState   │ │  Network        │
│ LIVE_METRICS__  │ │  Snapshot      │ │  Connections   │
└──────┬───────────┘ └──────────────────┘ └──────────────────┘
       │
       ↓
┌──────────────────┐
│ nodeDynamic     │
│ Metrics        │
│ (property)     │
└──────┬───────────┘
       │
       ↓
┌──────────────────┐
│ networkState    │
│ (property)      │ ← FIXED
└──────┬───────────┘
       │
       ↓
┌──────────────────────────────────────────────────────────────┐
│              ALL VISUAL SYSTEMS (30Hz)                  │
│  - HarmonicHealingVisualSystem                           │
│  - HealingParticleSystem                                 │
│  - HarmonicRecoveryVisualSystem                           │
│  - RegionalHarmonicCycleController                         │
│  - RegionalEquilibriumFieldSystem                         │
│  - TopologyBiasVisualizationLayer                          │
│  - WaveInterferencePatternSystem                          │
│  - ResonanceRuptureVisualSystem                          │
│  - GlyphAnimationModulator                                │
│  - CompositeGlyphResonanceFeedback                        │
└──────────────────────────────────────────────────────────────┘
```

---

## Key Findings

### Issues Found
1. ❌ **CRITICAL (FIXED):** `this.networkState` was undefined in [`main.js`](main.js:4760-4789)
   - **Impact:** All visual systems received empty object `{}` instead of metrics
   - **Fix:** Added property getter mapping `nodeDynamicMetrics` to canonical field names

### Strengths
1. ✅ **Clear separation:** Metrics, visual, AI, and multi-network systems are well-separated
2. ✅ **Immutable snapshots:** AI reasoner uses frozen snapshots for safety
3. ✅ **Non-authoritative AI:** AI reasoner provides advisory insights only
4. ✅ **Frequency discipline:** Metrics at 10Hz, visuals at 30Hz
5. ✅ **Canonical field names:** `projectHudMetrics()` provides consistent interface

### Potential Improvements
1. ⚠️ **Naming confusion:** Two different concepts both called "networkState"
   - **Recommendation:** Rename AI reasoner snapshot to `NetworkStateSnapshot` or `LinkSystemSnapshot`
2. ⚠️ **Direct access:** Some systems directly access `this.nodeDynamicMetrics` instead of `this.networkState`
   - **Recommendation:** Standardize on `this.networkState` for all visual systems
3. ⚠️ **Multi-network integration:** Multi-network manager exists but may not be fully integrated
   - **Recommendation:** Audit multi-network usage and integration points

---

## File Inventory

### Core Network Files
- [`main.js`](main.js) - Main orchestration, networkState property getter
- [`MetricsRuntime_v1.js`](MetricsRuntime_v1.js) - Metrics calculation and aggregation
- [`NetworkStateAIReasoner.js`](NetworkStateAIReasoner.js) - AI reasoning and advisory analysis
- [`PHASE5_MultiNetworkCore.js`](PHASE5_MultiNetworkCore.js) - Multi-network management

### Visual System Files
- [`HarmonicHealingVisualSystem_Session134.js`](HarmonicHealingVisualSystem_Session134.js) - Golden wave healing
- [`HealingParticleSystem_Session136.js`](HealingParticleSystem_Session136.js) - Sparkle and trail particles
- [`HarmonicRecoveryVisualSystem_Session138.js`](HarmonicRecoveryVisualSystem_Session138.js) - Coherence waves and halos
- [`RegionalHarmonicCycleController.js`](RegionalHarmonicCycleController.js) - Regional harmonic cycles
- [`RegionalEquilibriumFieldSystem.js`](RegionalEquilibriumFieldSystem.js) - Volumetric equilibrium fields
- [`TopologyBiasVisualizationLayer.js`](TopologyBiasVisualizationLayer.js) - Flow field visualization
- [`WaveInterferencePatternSystem_Session132.js`](WaveInterferencePatternSystem_Session132.js) - Wave interference
- [`ResonanceRuptureVisualSystem_Session133.js`](ResonanceRuptureVisualSystem_Session133.js) - Rupture visualization
- [`GlyphAnimationModulator.js`](GlyphAnimationModulator.js) - Glyph animation
- [`CompositeGlyphResonanceFeedback.js`](CompositeGlyphResonanceFeedback.js) - Glyph resonance feedback

### HUD/UI Files
- [`AIAutomationHUD.js`](AIAutomationHUD.js) - AI automation HUD
- [`ui/hud/VariantBAdvisorHUD.js`](ui/hud/VariantBAdvisorHUD.js) - Advisor HUD

### Supporting Files
- [`SemanticMetricAdapter.js`](SemanticMetricAdapter.js) - Metric field name mapping
- [`NodeLinkingSystem.js`](NodeLinkingSystem.js) - Link system with AI reasoner integration
- [`_AIEmotionalFeed3_1.js`](_AIEmotionalFeed3_1.js) - Emotional feed analysis

---

## Connectivity Status

### NetworkStateAIReasoner.js
**Status:** ⚠️ **QA/DEBUG ONLY**

- **Imported by:** [`NodeLinkingSystem.js`](NodeLinkingSystem.js:25)
- **Used in:** `_runAIReasoningDebug()` method at [`NodeLinkingSystem.js:8467-8473`](NodeLinkingSystem.js:8467-8473)
- **Activation:** Only when `window.__ATOMA_QA__` is enabled
- **Purpose:** QA validation and advisory analysis
- **Impact:** NOT used in production runtime

**Code:**
```javascript
_runAIReasoningDebug() {
    if (!window.__ATOMA_QA__) return;
    const snapshot = buildNetworkStateSnapshot(this);
    const ai = new NetworkStateAIReasoner();
    const report = ai.analyze(snapshot);
    this._lastAIReport = Object.freeze(report);
}
```

### PHASE5_MultiNetworkCore.js
**Status:** ⚠️ **MINIMAL IMPLEMENTATION**

- **Imported by:** [`main.js`](main.js:72)
- **Instantiated:** [`main.js:7873-7876`](main.js:7873-7876)
- **Registered networks:** Single network 'world' at [`main.js:7875-7876`](main.js:7875-7876)
- **Used for:**
  - Event emission at [`main.js:3971-3972`](main.js:3971-3972)
  - Threshold listener at [`main.js:7914`](main.js:7914)
  - FrameScheduler assignment at [`main.js:9236`](main.js:9236)
- **Impact:** Infrastructure exists but only single network registered

**Code:**
```javascript
// Initialization
this.multiNetworkManager = new PHASE5_MultiNetworkManager();
this.multiNetworkManager.frameScheduler = this.frameScheduler;
this.multiNetworkManager.registerNetwork('world', this, { /* metadata */ });

// Event emission
if (this.multiNetworkManager?.emitEvent) {
    this.multiNetworkManager.emitEvent(eventName, payload);
}
```

### CoreMetricsHUD.js
**Status:** ✅ **FULLY CONNECTED**

- **Metrics source:** `window.__ATOMA_LIVE_METRICS__` (published by MetricsRuntime_v1)
- **Fallback:** CoreMetricsCalculator (backward compatibility)
- **Reads at:** [`CoreMetricsHUD.js:247-254`](CoreMetricsHUD.js:247-254)
- **Update frequency:** 2Hz (throttled, 500ms interval)

**Metrics read:**
```javascript
const liveMetrics = window.__ATOMA_LIVE_METRICS__;
if (liveMetrics) {
    synergy = liveMetrics.networkSynergy ?? 0;
    harmony = liveMetrics.harmonyFlow ?? 0;
    stress = liveMetrics.networkStress ?? 0;
    corruption = liveMetrics.corruptionLevel ?? 0;
    load = liveMetrics.loadPressure ?? 0;
}
```

**Displays:**
- Network Synergy (cyan bar)
- Harmony Flow (green-teal bar)
- Network Stress (amber bar)
- Corruption Level (magenta bar)
- Load Pressure (violet bar)
- Network Time (cyan/gold counter)
- Cycle Time, Epoch Number, Aeon Number

---

## Recommendations

### Immediate (Completed)
1. ✅ Add `networkState` property getter to [`main.js`](main.js:4760-4789)

### Short-term
1. Consider renaming AI reasoner snapshot to avoid confusion
2. Audit multi-network manager usage and integration
3. Standardize all visual systems to use `this.networkState`

### Long-term
1. Consider consolidating network state into a single authoritative source
2. Evaluate if multi-network system is still needed
3. Document network state flow in system architecture docs

---

## Key Findings Summary

1. ✅ **FIXED:** `networkState` property getter added to provide metrics to visual systems
2. ✅ **VERIFIED:** CoreMetricsHUD correctly reads from `window.__ATOMA_LIVE_METRICS__`
3. ⚠️ **QA ONLY:** NetworkStateAIReasoner is not used in production
4. ⚠️ **MINIMAL:** Multi-network manager only has single network registered

---

## Conclusion

ATOMA has a well-structured network systems architecture with clear separation of concerns:

1. **Metrics systems** calculate network state at 10Hz
2. **Visual systems** render network state at 30Hz
3. **AI reasoner** provides advisory insights on demand
4. **Multi-network manager** coordinates multiple network instances

The critical bug where `networkState` was undefined has been fixed. All visual systems now receive proper metrics and can respond to network state changes.

The main area for improvement is the naming confusion between the two "networkState" concepts, which should be addressed to improve code clarity.
