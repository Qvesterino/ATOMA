# ATOMA EVENT MAP - ASCII TOPOLOGY

**Date:** 2026-03-15  
**Scope:** Complete SemanticEventBus topology  
**Status:** READ-ONLY ARCHITECTURAL DOCUMENT

---

## 1. EVENT INVENTORY

### All SemanticBus Events (Emitters)

| Event Name | Producer | Layer | Frequency |
|------------|----------|-------|-----------|
| `link.created` | NodeLinkingSystem | [INPUT / INTERACTION] | User Action |
| `link:collapsed` | NodeLinkingSystem | [INPUT / INTERACTION] | User Action |
| `network.link.destroyed` | main.js | [INPUT / INTERACTION] | User Action |
| `link:synergyThreshold` | main.js | [SIMULATION] | Threshold |
| `link:harmonicLock` | main.js | [SIMULATION] | Threshold |
| `node.spawned` | main.js | [INPUT / INTERACTION] | Spawn |
| `node.selection` | main.js | [INPUT / INTERACTION] | User Action |
| `node:selected` | main.js | [INPUT / INTERACTION] | User Action |
| `node:evolved` | _NodeEvolution2_0 | [SIMULATION] | Evolution |
| `node:ascended` | _NodeEvolution2_0 | [SIMULATION] | Evolution |
| `semantic.ascension` | _NodeEvolution2_0 | [SIMULATION] | Evolution |
| `semantic.ritual.started` | _MythicRitualController | [SIMULATION] | Ritual |
| `semantic.ritual.completed` | _MythicRitualController | [SIMULATION] | Ritual |
| `harmonic.cascade.start` | HarmonicHubAuraSystem_Session126 | [SIMULATION] | Cascade |
| `metric.node.updated` | MetricsRuntime_v1 | [METRICS] | Per Update |
| `metric.corruption.spread` | MetricsRuntime_v1 | [METRICS] | Spread |
| `event:synergyCascade` | MetricsRuntime_v1 | [METRICS] | Threshold |
| `event:harmonyResonance` | MetricsRuntime_v1 | [METRICS] | Threshold |
| `event:corruptionOutbreak` | MetricsRuntime_v1 | [METRICS] | Threshold |
| `event:loadCollapse` | MetricsRuntime_v1 | [METRICS] | Threshold |
| `event:instabilityTrap` | MetricsRuntime_v1 | [METRICS] | Threshold |
| `metrics.spike` | main.js | [METRICS] | Spike |
| `hud.visibility.change` | main.js | [HUD / UI] | UI Change |
| `camera.motion` | main.js | [INPUT / INTERACTION] | Per-frame (throttled) |

### All SemanticBus Subscriptions (Consumers)

| Consumer | Subscribed Events | Layer |
|----------|-------------------|-------|
| **AnimatedLinkFlow.js** | `link.created` | [VISUAL / FX] |
| **HarmonicHubAuraSystem_Session126.js** | `event:harmonyResonance` | [VISUAL / FX] |
| **main.js (HUD)** | `camera.motion`, `node.selection` | [HUD / UI] |
| **UISelectedHUD.js** | `link.created` | [HUD / UI] |
| **VisualEchoTrails_v1_Integration.js** | `link.created` | [VISUAL / FX] |
| **WaveBurstRouter_v1.js** | `node.synergy.high`, `metric:synergySpike`, `cascade.triggered`, `harmonic.cascade.start`, `link.created`, `node.corruption.high`, `node.failure`, `metric:corruptionRise`, `network:corruptionSpread`, `link:collapsed`, `node.hover`, `node.click`, `node:selected` | [VISUAL / FX] |
| **_GlyphFusionOverlay4_1.js** | `link.created`, `network.link.destroyed`, `link:collapsed`, `semantic.state.changed`, `semantic.cluster.sync`, `semantic.ascension`, `node:ascended`, `semantic.ritual.started`, `semantic.ritual.completed`, `node.selection`, `node:selected` | [VISUAL / FX] |
| **_RecursiveGlyphSignalSystem.js** | `link.created` | [VISUAL / FX] |

---

## 2. ASCII EVENT TOPOLOGY MAP

### [INPUT / INTERACTION] LAYER

```
[NodeLinkingSystem]
   └── emits: link.created
           ├──> [AnimatedLinkFlow]
           ├──> [UISelectedHUD]
           ├──> [VisualEchoTrails_v1_Integration]
           ├──> [WaveBurstRouter]
           ├──> [_GlyphFusionOverlay4_1]
           └──> [_RecursiveGlyphSignalSystem]

[NodeLinkingSystem]
   └── emits: link:collapsed
           ├──> [WaveBurstRouter]
           └──> [_GlyphFusionOverlay4_1]

[main.js (Network Manager)]
   └── emits: network.link.destroyed
           └──> [_GlyphFusionOverlay4_1]

[main.js (Node Spawner)]
   └── emits: node.spawned
           └──> [NO CONSUMERS - ORPHAN EVENT]

[main.js (Interaction Engine)]
   └── emits: node.selection
           ├──> [main.js (HUD System)]
           └──> [_GlyphFusionOverlay4_1]

[main.js (Interaction Engine)]
   └── emits: node:selected
           ├──> [WaveBurstRouter]
           └──> [_GlyphFusionOverlay4_1]

[main.js (Camera System)]
   └── emits: camera.motion
           └──> [main.js (HUD System)]
```

### [SIMULATION] LAYER

```
[main.js (Link Logic)]
   └── emits: link:synergyThreshold
           └──> [NO CONSUMERS - ORPHAN EVENT]

[main.js (Link Logic)]
   └── emits: link:harmonicLock
           └──> [NO CONSUMERS - ORPHAN EVENT]

[_NodeEvolution2_0]
   └── emits: node:evolved
           └──> [NO CONSUMERS - ORPHAN EVENT]

[_NodeEvolution2_0]
   └── emits: node:ascended
           └──> [_GlyphFusionOverlay4_1]

[_NodeEvolution2_0]
   └── emits: semantic.ascension
           └──> [_GlyphFusionOverlay4_1]

[_MythicRitualController]
   └── emits: semantic.ritual.started
           └──> [_GlyphFusionOverlay4_1]

[_MythicRitualController]
   └── emits: semantic.ritual.completed
           └──> [_GlyphFusionOverlay4_1]

[HarmonicHubAuraSystem_Session126]
   └── emits: harmonic.cascade.start
           └──> [WaveBurstRouter]
```

### [METRICS] LAYER

```
[MetricsRuntime_v1]
   └── emits: metric.node.updated
           └──> [NO CONSUMERS - ORPHAN EVENT]

[MetricsRuntime_v1]
   └── emits: metric.corruption.spread
           └──> [NO CONSUMERS - ORPHAN EVENT]

[MetricsRuntime_v1]
   └── emits: event:synergyCascade
           └──> [NO CONSUMERS - ORPHAN EVENT]

[MetricsRuntime_v1]
   └── emits: event:harmonyResonance
           └──> [HarmonicHubAuraSystem_Session126]

[MetricsRuntime_v1]
   └── emits: event:corruptionOutbreak
           └──> [NO CONSUMERS - ORPHAN EVENT]

[MetricsRuntime_v1]
   └── emits: event:loadCollapse
           └──> [NO CONSUMERS - ORPHAN EVENT]

[MetricsRuntime_v1]
   └── emits: event:instabilityTrap
           └──> [NO CONSUMERS - ORPHAN EVENT]

[main.js (Metrics Overlay)]
   └── emits: metrics.spike
           └──> [NO CONSUMERS - ORPHAN EVENT]
```

### [VISUAL / FX] LAYER

```
[WaveBurstRouter_v1] (Visual Router)
   └── subscribes to:
       ├── node.synergy.high [NOT EMITTED - ORPHAN SUBSCRIPTION]
       ├── metric:synergySpike [NOT EMITTED - ORPHAN SUBSCRIPTION]
       ├── cascade.triggered [NOT EMITTED - ORPHAN SUBSCRIPTION]
       ├── harmonic.cascade.start [CONSUMED]
       ├── link.created [CONSUMED]
       ├── node.corruption.high [NOT EMITTED - ORPHAN SUBSCRIPTION]
       ├── node.failure [NOT EMITTED - ORPHAN SUBSCRIPTION]
       ├── metric:corruptionRise [NOT EMITTED - ORPHAN SUBSCRIPTION]
       ├── network:corruptionSpread [NOT EMITTED - ORPHAN SUBSCRIPTION]
       ├── link:collapsed [CONSUMED]
       ├── node.hover [NOT EMITTED - ORPHAN SUBSCRIPTION]
       ├── node.click [NOT EMITTED - ORPHAN SUBSCRIPTION]
       └── node:selected [CONSUMED]
```

### [HUD / UI] LAYER

```
[main.js (HUD System)]
   └── emits: hud.visibility.change
           └──> [NO CONSUMERS - ORPHAN EVENT]

[_GlyphFusionOverlay4_1] (HUD Overlay)
   └── subscribes to:
       ├── link.created [CONSUMED]
       ├── network.link.destroyed [CONSUMED]
       ├── link:collapsed [CONSUMED]
       ├── semantic.state.changed [NOT EMITTED - ORPHAN SUBSCRIPTION]
       ├── semantic.cluster.sync [NOT EMITTED - ORPHAN SUBSCRIPTION]
       ├── semantic.ascension [CONSUMED]
       ├── node:ascended [CONSUMED]
       ├── semantic.ritual.started [CONSUMED]
       ├── semantic.ritual.completed [CONSUMED]
       ├── node.selection [CONSUMED]
       └── node:selected [CONSUMED]
```

---

## 3. HIGH-LEVEL EVENT FLOW

```
[INPUT / INTERACTION]
   │
   ├── User creates link
   │   └── [NodeLinkingSystem] emits: link.created
   │       └── [VISUAL / FX] systems react
   │
   ├── User destroys link
   │   └── [NodeLinkingSystem] emits: link:collapsed
   │       └── [VISUAL / FX] systems react
   │
   ├── User selects node
   │   └── [main.js] emits: node.selection, node:selected
   │       └── [HUD / UI] and [VISUAL / FX] systems react
   │
   ├── Camera moves
   │   └── [main.js] emits: camera.motion
   │       └── [HUD / UI] wakes up
   │
   └── Node spawns
       └── [main.js] emits: node.spawned
           └── [NO CONSUMERS]
   ↓
[LINK / NODE LIFECYCLE]
   │
   ├── Node evolution
   │   └── [_NodeEvolution2_0] emits: node:evolved, node:ascended, semantic.ascension
   │       └── [VISUAL / FX] systems react
   │
   └── Ritual system
       └── [_MythicRitualController] emits: semantic.ritual.started, semantic.ritual.completed
           └── [VISUAL / FX] systems react
   ↓
[METRICS RUNTIME]
   │
   └── [MetricsRuntime_v1] emits:
       ├── metric.node.updated [NO CONSUMERS]
       ├── metric.corruption.spread [NO CONSUMERS]
       ├── event:synergyCascade [NO CONSUMERS]
       ├── event:harmonyResonance [CONSUMED by HarmonicHubAuraSystem]
       ├── event:corruptionOutbreak [NO CONSUMERS]
       ├── event:loadCollapse [NO CONSUMERS]
       └── event:instabilityTrap [NO CONSUMERS]
   ↓
[SEMANTIC EVENT BUS]
   │
   ├── Priority Queue: CRITICAL, INTERACTIVE, NORMAL, BACKGROUND
   ├── Aggregation & Decay policies
   └── Budgeting system
   ↓
[VISUAL SYSTEMS]
   │
   ├── [WaveBurstRouter] - Routes events to visual effects
   ├── [_GlyphFusionOverlay4_1] - HUD overlay reactions
   ├── [AnimatedLinkFlow] - Link visual effects
   ├── [VisualEchoTrails_v1_Integration] - Echo trails
   ├── [_RecursiveGlyphSignalSystem] - Glyph signals
   └── [HarmonicHubAuraSystem_Session126] - Aura effects
   ↓
[HUD / OVERLAY / DEBUG]
   │
   ├── [main.js (HUD System)] - Main HUD
   ├── [UISelectedHUD] - Selection HUD
   └── [_GlyphFusionOverlay4_1] - Fusion overlay
```

---

## 4. PROBLEM ANALYSIS

### DUPLICATE EVENTS

**NONE DETECTED**

The SemanticBus events are unique. However, there is a **DUAL-SIGNAL ARCHITECTURE**:

```
[NodeLinkingSystem] fires BOTH:
   1. Legacy Callback: onLinkCreated(link, source, target)
   2. Semantic Event: semanticBus.emit('link.created')

Consumers split between the two:
   - Callback consumers: AudioSystem, SparkSystem, SynergyHighways, Phase5
   - Semantic consumers: AnimatedLinkFlow, UISelectedHUD, WaveBurstRouter, etc.
```

**Impact:** Redundant signaling, potential double-reaction if systems migrate incorrectly.

---

### ORPHAN EVENTS (Emitted but No Consumers)

| Event Name | Producer | Issue |
|------------|----------|-------|
| `node.spawned` | main.js | No consumers - should trigger VFX? |
| `link:synergyThreshold` | main.js | No consumers - should trigger particles? |
| `link:harmonicLock` | main.js | No consumers - should trigger visual feedback? |
| `node:evolved` | _NodeEvolution2_0 | No consumers - should trigger VFX? |
| `metric.node.updated` | MetricsRuntime_v1 | No consumers - HUD should listen? |
| `metric.corruption.spread` | MetricsRuntime_v1 | No consumers - visual system should listen? |
| `event:synergyCascade` | MetricsRuntime_v1 | No consumers - should trigger cascade VFX? |
| `event:corruptionOutbreak` | MetricsRuntime_v1 | No consumers - should trigger outbreak VFX? |
| `event:loadCollapse` | MetricsRuntime_v1 | No consumers - should trigger collapse VFX? |
| `event:instabilityTrap` | MetricsRuntime_v1 | No consumers - should trigger instability VFX? |
| `metrics.spike` | main.js | No consumers - HUD should listen? |
| `hud.visibility.change` | main.js | No consumers - internal use only? |

**Total Orphan Events: 11**

---

### ORPHAN SUBSCRIPTIONS (Subscribed but Not Emitted)

| Event Name | Consumer | Issue |
|------------|----------|-------|
| `node.synergy.high` | WaveBurstRouter_v1 | Not emitted - should be emitted by MetricsRuntime? |
| `metric:synergySpike` | WaveBurstRouter_v1 | Not emitted - should be emitted by MetricsRuntime? |
| `cascade.triggered` | WaveBurstRouter_v1 | Not emitted - should be emitted by cascade system? |
| `node.corruption.high` | WaveBurstRouter_v1 | Not emitted - should be emitted by MetricsRuntime? |
| `node.failure` | WaveBurstRouter_v1 | Not emitted - should be emitted by failure system? |
| `metric:corruptionRise` | WaveBurstRouter_v1 | Not emitted - should be emitted by MetricsRuntime? |
| `network:corruptionSpread` | WaveBurstRouter_v1 | Not emitted - should be emitted by MetricsRuntime? |
| `node.hover` | WaveBurstRouter_v1 | Not emitted - should be emitted by interaction system? |
| `node.click` | WaveBurstRouter_v1 | Not emitted - should be emitted by interaction system? |
| `semantic.state.changed` | _GlyphFusionOverlay4_1 | Not emitted - should be emitted by state system? |
| `semantic.cluster.sync` | _GlyphFusionOverlay4_1 | Not emitted - should be emitted by cluster system? |

**Total Orphan Subscriptions: 11**

---

### MISSING CONSUMERS

**Events that should have consumers but don't:**

1. **`node.spawned`** - Should trigger spawn VFX/particles
2. **`link:synergyThreshold`** - Should trigger synergy visual feedback
3. **`link:harmonicLock`** - Should trigger harmonic lock visual feedback
4. **`node:evolved`** - Should trigger evolution VFX
5. **`metric.node.updated`** - HUD should listen for metric changes
6. **`metric.corruption.spread`** - Visual systems should react
7. **`event:synergyCascade`** - Should trigger cascade VFX
8. **`event:corruptionOutbreak`** - Should trigger outbreak VFX
9. **`event:loadCollapse`** - Should trigger collapse VFX
10. **`event:instabilityTrap`** - Should trigger instability VFX
11. **`metrics.spike`** - HUD should listen for spikes

---

### POLLING SYSTEMS THAT SHOULD MIGRATE TO EVENTS

**HIGH PRIORITY (30Hz Visual Systems):**

| System | Currently Polls | Should Subscribe To |
|--------|----------------|---------------------|
| HarmonicNodeResonanceHalos.js | `node.userData.metrics.harmony` @ 30Hz | `event:harmonyResonance` |
| SynergyCascadeVisualizer.js | `node.userData.metrics.synergy` @ 30Hz | `event:synergyCascade` |
| NodeDynamicMetrics.js | `node.userData.metrics` @ 30Hz | `metric.node.updated` |
| SafeMetricsFX1_1.js | `node.userData.metrics` @ 30Hz | `metric.node.updated` |
| AdaptiveGlyphRendering1_0.js | `node.userData.metrics` @ 30Hz | `metric.node.updated` |
| _ExtremeAINodeEvolution3.js | `node.userData.metrics.synergy, harmony` @ 30Hz | `event:synergyCascade`, `event:harmonyResonance` |
| _ExtremeAIShaderPack.js | `node.userData.metrics` @ 30Hz | `metric.node.updated` |

**MEDIUM PRIORITY (10Hz Simulation System):**

| System | Currently Polls | Should Subscribe To |
|--------|----------------|---------------------|
| LinkCorruptionTransmission_v1.js | `link.userData.synergy.score` @ 10Hz | `metric:corruptionRise` |

---

### LEGACY CALLBACK DEPENDENCIES

**Systems still using legacy callbacks instead of SemanticBus:**

1. **NodeHierarchyBridge_v1.js** - Uses `linkingSystem.onLinkCreatedCallbacks`
2. **_RecursiveGlyphSignalSystem.js** - Uses `linkingSystem.onLinkCreated()` AND SemanticBus (partial migration)
3. **UISelectedHUD.js** - Uses `linkingSystem.onLinkCreated()` AND SemanticBus (partial migration)
4. **main.js** - Uses `linkingSystem.onLinkCreatedCallbacks` for audio/harmonic coupling
5. **AnimatedLinkFlow.js** - Uses `linkingSystem.onLinkCreatedCallbacks` AND SemanticBus (partial migration)
6. **VisualEchoTrails_v1_Integration.js** - Uses `linkingSystem.onLinkCreatedCallbacks` AND SemanticBus (partial migration)
7. **NodeLinkingSystem.js** - Internal self-registration (keep as-is)
8. **NodeShaderActivation_v1.js** - Uses `selectionCore.onPrimaryNodeChanged()`
9. **NodeInteractionEngine.ts** - Uses `linkingSystem.onHoverStart`, `onHoverEnd`

**Total Legacy Callback Systems: 9**

---

## 5. EVENT LAYER SUMMARY

### [INPUT / INTERACTION] LAYER

**Active Events:** 7  
**Active Consumers:** 6  
**Orphan Events:** 1 (`node.spawned`)  
**Status:** Functional but missing spawn feedback

---

### [SIMULATION] LAYER

**Active Events:** 6  
**Active Consumers:** 2  
**Orphan Events:** 3 (`link:synergyThreshold`, `link:harmonicLock`, `node:evolved`)  
**Status:** Partially connected - many simulation events have no visual consumers

---

### [METRICS] LAYER

**Active Events:** 8  
**Active Consumers:** 1 (`event:harmonyResonance` → HarmonicHubAuraSystem)  
**Orphan Events:** 7  
**Orphan Subscriptions:** 8 (WaveBurstRouter waiting for events that don't exist)  
**Status:** Severely disconnected - MetricsRuntime emits events but almost nothing consumes them

---

### [VISUAL / FX] LAYER

**Active Consumers:** 6  
**Orphan Subscriptions:** 11  
**Status:** WaveBurstRouter and _GlyphFusionOverlay4_1 are waiting for events that are never emitted

---

### [HUD / UI] LAYER

**Active Events:** 2  
**Active Consumers:** 2  
**Orphan Events:** 1 (`hud.visibility.change`)  
**Status:** Functional

---

## 6. ARCHITECTURAL ASSESSMENT

### STRENGTHS

1. **SemanticBus is well-designed** - Priority queue, aggregation, decay, budgeting
2. **Input layer is functional** - User interactions properly emit events
3. **Visual systems are ready** - Many consumers already subscribe to events

### WEAKNESSES

1. **Dual-signal architecture** - Legacy callbacks + SemanticBus creates redundancy
2. **Metrics layer is disconnected** - MetricsRuntime emits events but nothing consumes them
3. **11 orphan events** - Events emitted but no consumers
4. **11 orphan subscriptions** - Consumers waiting for events that don't exist
5. **Massive polling architecture** - 19 systems poll metrics instead of using events
6. **WaveBurstRouter is mostly idle** - Subscribes to 12 events but only 3 are emitted

### CRITICAL ISSUES

1. **MetricsRuntime_v1** emits 8 events, but only 1 has a consumer
2. **WaveBurstRouter_v1** subscribes to 12 events, but only 3 are emitted
3. **Visual systems poll at 30Hz** instead of reacting to metric change events
4. **Legacy callbacks** still used by 9 systems alongside SemanticBus

---

## 7. RECOMMENDATIONS (Architecture Only)

### PHASE 1: Connect Metrics Layer

1. **Emit missing events from MetricsRuntime_v1:**
   - `metric:synergySpike` (when synergy spikes)
   - `metric:corruptionRise` (when corruption rises)
   - `node.corruption.high` (when node corruption exceeds threshold)
   - `node.synergy.high` (when node synergy exceeds threshold)

2. **Connect orphan events to consumers:**
   - `node.spawned` → Particle system
   - `link:synergyThreshold` → Visual feedback system
   - `link:harmonicLock` → Visual feedback system
   - `node:evolved` → Evolution VFX system
   - `event:synergyCascade` → Cascade VFX system
   - `event:corruptionOutbreak` → Outbreak VFX system
   - `event:loadCollapse` → Collapse VFX system
   - `event:instabilityTrap` → Instability VFX system

### PHASE 2: Migrate Polling to Events

1. **Migrate 30Hz visual systems** to subscribe to metric change events:
   - HarmonicNodeResonanceHalos → `event:harmonyResonance`
   - SynergyCascadeVisualizer → `event:synergyCascade`
   - NodeDynamicMetrics → `metric.node.updated`
   - SafeMetricsFX1_1 → `metric.node.updated`
   - AdaptiveGlyphRendering1_0 → `metric.node.updated`
   - _ExtremeAINodeEvolution3 → `event:synergyCascade`, `event:harmonyResonance`
   - _ExtremeAIShaderPack → `metric.node.updated`

2. **Migrate 10Hz simulation system:**
   - LinkCorruptionTransmission → `metric:corruptionRise`

### PHASE 3: Eliminate Dual-Signal Architecture

1. **Migrate legacy callback systems to SemanticBus:**
   - NodeHierarchyBridge_v1.js
   - _RecursiveGlyphSignalSystem.js (remove callbacks)
   - UISelectedHUD.js (remove callbacks)
   - main.js audio/harmonic coupling
   - AnimatedLinkFlow.js (remove callbacks)
   - VisualEchoTrails_v1_Integration.js (remove callbacks)

2. **Deprecate callback arrays:**
   - `linkingSystem.onLinkCreatedCallbacks`
   - `linkingSystem.onLinkRemovedCallbacks`
   - `selectionCore.onNodeSelected`
   - `selectionCore.onNodeDeselected`

---

## 8. CONCLUSION

**Event System Status:** Hybrid transitional state

**SemanticBus:** Well-designed but underutilized  
**Legacy Callbacks:** Still active, causing redundancy  
**Polling Architecture:** Dominant (19 systems), should migrate to events  
**Orphan Events:** 11 events emitted but not consumed  
**Orphan Subscriptions:** 11 subscriptions waiting for non-existent events  

**Primary Bottleneck:** MetricsRuntime_v1 emits events that no one consumes, while visual systems poll metrics at 30Hz.

**Immediate Action Required:** Connect MetricsRuntime_v1 events to visual systems to eliminate 30Hz polling.

---

**END OF DOCUMENT**
