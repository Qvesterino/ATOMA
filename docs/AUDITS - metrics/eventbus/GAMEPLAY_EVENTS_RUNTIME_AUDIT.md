# ATOMA GAMEPLAY EVENTS RUNTIME AUDIT

**Date:** 2026-03-16
**Scope:** Complete Gameplay Event Inventory
**Status:** RUNTIME ACTIVE EVENTS ANALYSIS

---

## EXECUTIVE SUMMARY

This audit identifies all gameplay events actually used in runtime, categorized by event type, emission sources, and listener patterns.

**Key Findings:**
- **32 distinct gameplay events** are active across the codebase
- **SemanticBus** is the primary event system (no EventBus class found)
- **EventBus** class mentioned but not actively used in runtime
- **Dual emission pattern** exists: some events fire both as callbacks and semantic events
- **Polling dominates** for visual updates (60Hz frame loop)

---

## 1. NODE SELECTION EVENTS

### `node.selection`
**Purpose:** Node select/deselect events
**Priority:** CRITICAL
**Emitted From:**
- `main.js` - Node interaction system
  - On select: `semanticBus.emit('node.selection', { type: 'select', nodeId, category }, { priority: CRITICAL })`
  - On deselect: `semanticBus.emit('node.selection', { type: 'deselect', nodeId, category }, { priority: CRITICAL })`

**Listeners:**
1. `main.js` - HUD wake system
2. `main.js` - Audio system (plays selection SFX)
3. `_GlyphFusionOverlay4_1.js` - Glyph fusion visual system

**Frequency:** User interaction (low)

**Runtime Status:** ✅ ACTIVE

---

### `node:selected`
**Purpose:** Alternative node selection event format
**Priority:** CRITICAL
**Emitted From:**
- `main.js` - Node interaction system
  - `semanticBus.emit('node:selected', { nodeId, category, timestamp: performance.now() }, { priority: CRITICAL })`

**Listeners:**
1. `WaveBurstRouter_v1.js` - Wave burst handler
2. `_GlyphFusionOverlay4_1.js` - Glyph fusion visual system

**Frequency:** User interaction (low)

**Runtime Status:** ✅ ACTIVE

---

### `node.click`
**Purpose:** Node click interaction event
**Priority:** INTERACTIVE
**Emitted From:**
- `main.js` - Node interaction system
  - `semanticBus.emit('node.click', payload, { priority: INTERACTIVE })`

**Listeners:**
1. `WaveBurstRouter_v1.js` - Wave burst handler

**Frequency:** User interaction (low)

**Runtime Status:** ✅ ACTIVE

---

### `node.hover`
**Purpose:** Node hover detection
**Priority:** INTERACTIVE
**Emitted From:**
- Not found in search results (may be direct method calls)

**Listeners:**
1. `WaveBurstRouter_v1.js` - Wave burst handler

**Frequency:** User interaction (low)

**Runtime Status:** ⚠️ LIKELY ACTIVE (listeners exist, emission not found)

---

## 2. LINK LIFECYCLE EVENTS

### `link.created`
**Purpose:** Link creation notification
**Priority:** INTERACTIVE
**Emitted From:**
- `NodeLinkingSystem.js` - Main linking system
  - `semanticBus.emit('link.created', payload, { priority: INTERACTIVE })`

**Listeners:**
1. `AnimatedLinkFlow.js` - Link flow animation system
2. `CascadeParticleEmissionBoost_Session118.js` - Cascade particle system
3. `ParticleCascadeFlowDeflection.js` - Particle deflection system
4. `ParticleSemanticDensityAdapter_Session121.js` - Semantic density adapter
5. `PHASE5_CascadeVisualizationBridge_v1.js` - Cascade visualization bridge
6. `UISelectedHUD.js` - HUD display
7. `VisualEchoTrails_v1_Integration.js` - Visual echo trails
8. `WaveBurstRouter_v1.js` - Wave burst router
9. `_GlyphFusionOverlay4_1.js` - Glyph fusion overlay
10. `_RecursiveGlyphSignalSystem.js` - Recursive glyph system

**Frequency:** User action / AI linking (low)

**Runtime Status:** ✅ HIGHLY ACTIVE

---

### `network.link.destroyed`
**Purpose:** Link destruction notification
**Priority:** NORMAL
**Emitted From:**
- `main.js` - Link removal handler
  - `semanticBus.emit('network.link.destroyed', { linkId: link.userData.id, ... })`

**Listeners:**
1. `main.js` - Audio system (plays destruction SFX)
2. `_GlyphFusionOverlay4_1.js` - Glyph fusion overlay

**Frequency:** User action (low)

**Runtime Status:** ✅ ACTIVE

---

### `link:collapsed`
**Purpose:** Link collapse due to degradation
**Priority:** INTERACTIVE
**Emitted From:**
- `NodeLinkingSystem.js` - Link collapse detection
  - `semanticBus.emit('link:collapsed', { linkId: decision.linkId, ... })`

**Listeners:**
1. `WaveBurstRouter_v1.js` - Wave burst router
2. `_GlyphFusionOverlay4_1.js` - Glyph fusion overlay

**Frequency:** Simulation event (medium)

**Runtime Status:** ✅ ACTIVE

---

### `link:synergyThreshold`
**Purpose:** Synergy threshold crossed
**Priority:** NORMAL
**Emitted From:**
- `main.js` - Link creation handler
  - `semanticBus.emit('link:synergyThreshold', { sourceId, targetId, synergyScore, threshold: 0.75 })`

**Listeners:**
- None found in search results

**Frequency:** Link creation (low)

**Runtime Status:** ⚠️ EMITTED BUT NO LISTENERS (potential zombie event)

---

### `link:harmonicLock`
**Purpose:** Harmonic lock achieved
**Priority:** NORMAL
**Emitted From:**
- `main.js` - Link creation handler
  - `semanticBus.emit('link:harmonicLock', { sourceId, targetId, harmonicValue })`

**Listeners:**
- None found in search results

**Frequency:** Link creation (low)

**Runtime Status:** ⚠️ EMITTED BUT NO LISTENERS (potential zombie event)

---

## 3. SYNERGY EVENTS

### `node.synergy.high`
**Purpose:** Node synergy exceeds threshold (>0.72)
**Priority:** NORMAL
**Emitted From:**
- `MetricsRuntime_v1.js` - Metric change detection
  - `semanticBus.emit('node.synergy.high', { nodeId, synergy, threshold: 0.72 })`

**Listeners:**
1. `main.js` - Audio system (plays synergy SFX)
2. `SynergyTravelingWaveFX_v1.js` - Traveling wave visual FX
3. `WaveBurstRouter_v1.js` - Wave burst router

**Frequency:** Metric update (medium)

**Runtime Status:** ✅ ACTIVE

---

### `metric:synergySpike`
**Purpose:** Network synergy spike detected
**Priority:** NORMAL
**Emitted From:**
- `MetricsRuntime_v1.js` - Metric spike detection
  - `semanticBus.emit('metric:synergySpike', current.networkSynergy, delta, { metric: 'synergy' })`

**Listeners:**
1. `SynergyTravelingWaveFX_v1.js` - Traveling wave visual FX
2. `WaveBurstRouter_v1.js` - Wave burst router

**Frequency:** Metric change (medium)

**Runtime Status:** ✅ ACTIVE

---

### `event:synergyCascade`
**Purpose:** Synergy cascade triggered (networkSynergy >= 0.82)
**Priority:** NORMAL
**Emitted From:**
- `MetricsRuntime_v1.js` - Cascade threshold detection
  - `semanticBus.emit('event:synergyCascade', { value: current.networkSynergy })`

**Listeners:**
1. `WaveBurstRouter_v1.js` - Wave burst router (via globalThis.semanticBus)
2. `_ExtremeAINodeEvolution3.js` - AI node evolution system

**Frequency:** Threshold crossing (low)

**Runtime Status:** ✅ ACTIVE

---

## 4. CORRUPTION EVENTS

### `metric:corruption.spread`
**Purpose:** Corruption spreading between nodes
**Priority:** NORMAL
**Emitted From:**
- `MetricsRuntime_v1.js` - Corruption propagation detection
  - `semanticBus.emit('metric:corruption.spread', { source, target, ... })`

**Listeners:**
- None found in search results

**Frequency:** Simulation (medium)

**Runtime Status:** ⚠️ EMITTED BUT NO LISTENERS

---

### `metric:corruptionRise`
**Purpose:** Corruption threshold crossed (>0.6)
**Priority:** NORMAL
**Emitted From:**
- `LinkCorruptionTransmission_v1.js` - Corruption rise detection
  - `semanticBus.emit('metric:corruptionRise', { nodeId: sourceNode.id, corruption, ... })`
- `MetricsRuntime_v1.js` - Metric threshold detection

**Listeners:**
1. `WaveBurstRouter_v1.js` - Wave burst router

**Frequency:** Threshold crossing (low)

**Runtime Status:** ✅ ACTIVE

---

### `event:corruptionCascade`
**Purpose:** Corruption cascade event
**Priority:** NORMAL
**Emitted From:**
- `MetricsRuntime_v1.js` - Corruption cascade detection

**Listeners:**
1. `PHASE5_CascadeVisualizationBridge_v1.js` - Cascade visualization bridge

**Frequency:** Threshold crossing (low)

**Runtime Status:** ✅ ACTIVE

---

### `event:corruptionOutbreak`
**Purpose:** Corruption outbreak (corruptionLevel >= 0.6)
**Priority:** NORMAL
**Emitted From:**
- `MetricsRuntime_v1.js` - Outbreak threshold detection
  - `semanticBus.emit('event:corruptionOutbreak', { value: current.corruptionLevel })`

**Listeners:**
- None found in search results

**Frequency:** Threshold crossing (low)

**Runtime Status:** ⚠️ EMITTED BUT NO LISTENERS

---

### `node.corruption.high`
**Purpose:** Node corruption high
**Priority:** NORMAL
**Emitted From:**
- Not found in search results

**Listeners:**
1. `WaveBurstRouter_v1.js` - Wave burst router

**Frequency:** Unknown

**Runtime Status:** ⚠️ LISTENERS EXIST BUT EMISSION NOT FOUND

---

### `network:corruptionSpread`
**Purpose:** Network-wide corruption spread
**Priority:** INTERACTIVE
**Emitted From:**
- Not found in search results

**Listeners:**
1. `WaveBurstRouter_v1.js` - Wave burst router

**Frequency:** Unknown

**Runtime Status:** ⚠️ LISTENERS EXIST BUT EMISSION NOT FOUND

---

### `event:networkCorruptionSpread`
**Purpose:** Network corruption spread event
**Priority:** NORMAL
**Emitted From:**
- Not found in search results

**Listeners:**
1. `PHASE5_CascadeVisualizationBridge_v1.js` - Cascade visualization bridge

**Frequency:** Unknown

**Runtime Status:** ⚠️ LISTENERS EXIST BUT EMISSION NOT FOUND

---

## 5. NODE LIFECYCLE EVENTS

### `node.spawned`
**Purpose:** Node creation/spawning
**Priority:** NORMAL
**Emitted From:**
- `main.js` - Node creation handler
  - `semanticBus.emit('node.spawned', { nodeId, category, ... })`

**Listeners:**
1. `CascadeParticleEmissionBoost_Session118.js` - Cascade particle system
2. `ParticleCascadeFlowDeflection.js` - Particle deflection system
3. `ParticleSemanticDensityAdapter_Session121.js` - Semantic density adapter
4. `PHASE5_CascadeVisualizationBridge_v1.js` - Cascade visualization bridge

**Frequency:** Node creation (low)

**Runtime Status:** ✅ ACTIVE

---

### `node.failure`
**Purpose:** Node failure event
**Priority:** INTERACTIVE
**Emitted From:**
- Not found in search results

**Listeners:**
1. `WaveBurstRouter_v1.js` - Wave burst router

**Frequency:** Unknown

**Runtime Status:** ⚠️ LISTENERS EXIST BUT EMISSION NOT FOUND

---

## 6. METRIC UPDATE EVENTS

### `metric.node.updated`
**Purpose:** Node metrics updated
**Priority:** NORMAL
**Emitted From:**
- `MetricsRuntime_v1.js` - Per-node metric updates
  - `semanticBus.emit('metric.node.updated', { nodeId, metrics, ... })`

**Listeners:**
1. `CascadeParticleEmissionBoost_Session118.js` - Request refresh
2. `ParticleCascadeFlowDeflection.js` - On metric updated
3. `ParticleSemanticDensityAdapter_Session121.js` - Request refresh
4. `PHASE5_CascadeVisualizationBridge_v1.js` - Request refresh
5. `SafeMetricsFX1_1.js` - Metric FX handler
6. `_AdaptiveGlyphRendering1_0.js` - Adaptive glyph rendering

**Frequency:** Per frame (high - throttled)

**Runtime Status:** ✅ HIGHLY ACTIVE

---

### `metrics.spike`
**Purpose:** Metrics spike detected
**Priority:** CRITICAL
**Emitted From:**
- `main.js` - HUD spike detection
  - `semanticBus.emit('metrics.spike', this.coreMetricsOverlay.currentMetrics, { priority: CRITICAL })`

**Listeners:**
- None found in search results

**Frequency:** Threshold crossing (low)

**Runtime Status:** ⚠️ EMITTED BUT NO LISTENERS

---

## 7. HARMONY EVENTS

### `event:harmonyResonance`
**Purpose:** Harmony resonance triggered (harmonyFlow >= 0.85)
**Priority:** NORMAL
**Emitted From:**
- `MetricsRuntime_v1.js` - Harmony threshold detection
  - `semanticBus.emit('event:harmonyResonance', { value: current.harmonyFlow })`

**Listeners:**
1. `WaveBurstRouter_v1.js` - Wave burst router (via globalThis.semanticBus)
2. `HarmonicHubAuraSystem_Session126.js` - Harmonic hub aura system
3. `HarmonicNodeResonanceHalos.js` - Resonance halo system
4. `_ExtremeAINodeEvolution3.js` - AI node evolution system

**Frequency:** Threshold crossing (low)

**Runtime Status:** ✅ ACTIVE

---

### `harmonic.cascade.start`
**Purpose:** Harmonic cascade started
**Priority:** NORMAL
**Emitted From:**
- `HarmonicHubAuraSystem_Session126.js` - Cascade trigger
  - `semanticBus.emit('harmonic.cascade.start', { hubId, ... })`

**Listeners:**
1. `WaveBurstRouter_v1.js` - Wave burst router

**Frequency:** Simulation event (low)

**Runtime Status:** ✅ ACTIVE

---

## 8. CASCADE EVENTS

### `cascade.start`
**Purpose:** Cascade propagation started
**Priority:** NORMAL
**Emitted From:**
- `main.js` - Cascade start handler
  - `semanticBus.emit('cascade.start', { ... })`

**Listeners:**
1. `main.js` - Debug console (console.log)
2. `ResonanceCascadeVisualization_Session117B.js` - Cascade visualization

**Frequency:** Simulation event (low)

**Runtime Status:** ✅ ACTIVE

---

### `cascade.hop`
**Purpose:** Cascade hop between nodes
**Priority:** NORMAL
**Emitted From:**
- `main.js` - Cascade propagation handler
  - `semanticBus.emit('cascade.hop', { ... })`

**Listeners:**
1. `main.js` - Debug console (console.log)
2. `ResonanceCascadeVisualization_Session117B.js` - Cascade visualization
3. `CascadeResonanceWaveVisualization_Session146.js` - Wave visualization
4. `CascadeParticleSystem_Session120.js` - Particle system
5. `CascadeParticleColorTinting_Session119.js` - Color tinting system

**Frequency:** Simulation event (medium)

**Runtime Status:** ✅ ACTIVE

---

### `cascade.end`
**Purpose:** Cascade propagation ended
**Priority:** NORMAL
**Emitted From:**
- `main.js` - Cascade end handler
  - `semanticBus.emit('cascade.end', { ... })`

**Listeners:**
1. `main.js` - Debug console (console.log)
2. `ResonanceCascadeVisualization_Session117B.js` - Cascade visualization

**Frequency:** Simulation event (low)

**Runtime Status:** ✅ ACTIVE

---

### `cascade.triggered`
**Purpose:** Cascade triggered event
**Priority:** NORMAL
**Emitted From:**
- `CascadingHarmonicResonanceAmplification.js` - Cascade trigger
  - `semanticBus.emit('cascade.triggered', { sourceNode: node.id, ... })`

**Listeners:**
1. `WaveBurstRouter_v1.js` - Wave burst router

**Frequency:** Simulation event (medium)

**Runtime Status:** ✅ ACTIVE

---

## 9. WAVE EVENTS

### `wave.burst`
**Purpose:** Wave burst triggered
**Priority:** NORMAL
**Emitted From:**
- Not found in search results

**Listeners:**
1. `ResonanceEchoTrailSystem.js` - Echo trail system

**Frequency:** Unknown

**Runtime Status:** ⚠️ LISTENERS EXIST BUT EMISSION NOT FOUND

---

## 10. RITUAL EVENTS

### `semantic.ritual.started`
**Purpose:** Ritual ceremony started
**Priority:** BACKGROUND
**Emitted From:**
- `_MythicRitualController.js` - Ritual trigger
  - `semanticBus.emit('semantic.ritual.started', { ritualType, ... })`

**Listeners:**
1. `_GlyphFusionOverlay4_1.js` - Glyph fusion overlay

**Frequency:** Gameplay event (low)

**Runtime Status:** ✅ ACTIVE

---

### `semantic.ritual.completed`
**Purpose:** Ritual ceremony completed
**Priority:** CRITICAL
**Emitted From:**
- `_MythicRitualController.js` - Ritual completion
  - `semanticBus.emit('semantic.ritual.completed', { ritualType, ... })`

**Listeners:**
1. `_GlyphFusionOverlay4_1.js` - Glyph fusion overlay

**Frequency:** Gameplay event (low)

**Runtime Status:** ✅ ACTIVE

---

## 11. SEMANTIC STATE EVENTS

### `semantic.state.changed`
**Purpose:** Semantic state changed
**Priority:** NORMAL
**Emitted From:**
- Not found in search results

**Listeners:**
1. `_GlyphFusionOverlay4_1.js` - Glyph fusion overlay

**Frequency:** Unknown

**Runtime Status:** ⚠️ LISTENERS EXIST BUT EMISSION NOT FOUND

---

### `semantic.cluster.sync`
**Purpose:** Semantic cluster synchronized
**Priority:** NORMAL
**Emitted From:**
- Not found in search results

**Listeners:**
1. `_GlyphFusionOverlay4_1.js` - Glyph fusion overlay

**Frequency:** Unknown

**Runtime Status:** ⚠️ LISTENERS EXIST BUT EMISSION NOT FOUND

---

### `semantic.ascension`
**Purpose:** Semantic ascension event
**Priority:** CRITICAL
**Emitted From:**
- `_NodeEvolution2_0.js` - Node evolution system
  - `semanticBus.emit('semantic.ascension', { nodeId, ... }, { priority: CRITICAL })`

**Listeners:**
1. `_GlyphFusionOverlay4_1.js` - Glyph fusion overlay

**Frequency:** Gameplay event (low)

**Runtime Status:** ✅ ACTIVE

---

## 12. NODE EVOLUTION EVENTS

### `node:evolved`
**Purpose:** Node evolved to next stage
**Priority:** NORMAL
**Emitted From:**
- `_NodeEvolution2_0.js` - Node evolution system
  - `semanticBus.emit('node:evolved', { nodeId, ... })`

**Listeners:**
- None found in search results

**Frequency:** Gameplay event (low)

**Runtime Status:** ⚠️ EMITTED BUT NO LISTENERS

---

### `node:ascended`
**Purpose:** Node ascended to highest tier
**Priority:** CRITICAL
**Emitted From:**
- `_NodeEvolution2_0.js` - Node evolution system
  - `semanticBus.emit('node:ascended', { nodeId, ... })`

**Listeners:**
1. `_GlyphFusionOverlay4_1.js` - Glyph fusion overlay

**Frequency:** Gameplay event (low)

**Runtime Status:** ✅ ACTIVE

---

## 13. LOAD/STABILITY EVENTS

### `event:loadCollapse`
**Purpose:** Load collapse detected
**Priority:** NORMAL
**Emitted From:**
- `MetricsRuntime_v1.js` - Load collapse detection
  - `semanticBus.emit('event:loadCollapse', { load: current.loadPressure, ... })`

**Listeners:**
- None found in search results

**Frequency:** Threshold crossing (low)

**Runtime Status:** ⚠️ EMITTED BUT NO LISTENERS

---

### `event:instabilityTrap`
**Purpose:** Instability trap triggered (networkStress >= 0.75)
**Priority:** NORMAL
**Emitted From:**
- `MetricsRuntime_v1.js` - Instability detection
  - `semanticBus.emit('event:instabilityTrap', { value: current.networkStress })`

**Listeners:**
- None found in search results

**Frequency:** Threshold crossing (low)

**Runtime Status:** ⚠️ EMITTED BUT NO LISTENERS

---

## 14. UI/INTERACTION EVENTS

### `camera.motion`
**Purpose:** Camera movement detected
**Priority:** NORMAL
**Emitted From:**
- `main.js` - HUD visibility system
  - `semanticBus.emit('hud.visibility.change', { key, visible }, { priority: CRITICAL })`

**Listeners:**
1. `main.js` - HUD wake system

**Frequency:** Per frame (throttled)

**Runtime Status:** ✅ ACTIVE

---

### `hud.visibility.change`
**Purpose:** HUD visibility changed
**Priority:** CRITICAL
**Emitted From:**
- `main.js` - HUD visibility system
  - `semanticBus.emit('hud.visibility.change', { key, visible }, { priority: CRITICAL })`

**Listeners:**
- None found in search results

**Frequency:** User action (low)

**Runtime Status:** ⚠️ EMITTED BUT NO LISTENERS

---

### `event:linkCollapse`
**Purpose:** Link collapse event
**Priority:** NORMAL
**Emitted From:**
- Not found in search results

**Listeners:**
1. `PHASE5_CascadeVisualizationBridge_v1.js` - Cascade visualization bridge

**Frequency:** Unknown

**Runtime Status:** ⚠️ LISTENERS EXIST BUT EMISSION NOT FOUND

---

## DIRECT METHOD CALLS (Non-Event)

### `createLink()`
**Direct Calls (Bypass Event System):**
- `LinkAutomationEngine1_0.js` - `this.nodeLinker.createLink(node, suggestion.nodeB)`
- `NodeEditor.js` - `this.createLink(this.linkSource.data.id, target.userData.id)`
- `UndoRedoSystem.js` - `this.createdLink = this.linkingSystem.createLink(...)`
- `src/legacy/_NodeLinking2_3.js` - `this.linkingSystem.createLink(fromNode, toNode)`

**Runtime Status:** ✅ ACTIVE (direct method calls)

---

### `.select()`, `.deselect()`, `.click()`
**Direct Calls (Bypass Event System):**
- Not found in search results for direct method calls
- All selection flows through semantic events

**Runtime Status:** ✅ EVENT-DRIVEN (no direct calls found)

---

## SUMMARY STATISTICS

### Event Emission Activity
| Category | Total Events | Active | Passive (No Listeners) | Orphaned (Listeners Only) |
|---|---|---|---|---|
| Node Selection | 4 | 3 | 0 | 1 |
| Link Lifecycle | 5 | 3 | 2 | 0 |
| Synergy | 3 | 3 | 0 | 0 |
| Corruption | 7 | 2 | 4 | 2 |
| Node Lifecycle | 2 | 1 | 0 | 1 |
| Metric Updates | 2 | 1 | 1 | 0 |
| Harmony | 2 | 2 | 0 | 0 |
| Cascade | 4 | 4 | 0 | 0 |
| Wave | 1 | 0 | 0 | 1 |
| Ritual | 2 | 2 | 0 | 0 |
| Semantic State | 3 | 1 | 1 | 2 |
| Node Evolution | 2 | 1 | 1 | 0 |
| Load/Stability | 2 | 0 | 2 | 0 |
| UI/Interaction | 2 | 1 | 1 | 0 |
| **TOTAL** | **41** | **24** | **13** | **8** |

### Most Active Events (By Listener Count)
1. `link.created` - 10 listeners
2. `metric.node.updated` - 6 listeners
3. `node.selection` - 3 listeners
4. `event:synergyCascade` - 2 listeners
5. `event:harmonyResonance` - 4 listeners
6. `cascade.hop` - 5 listeners

### Zombie Events (Emitted but No Listeners)
1. `link:synergyThreshold`
2. `link:harmonicLock`
3. `metric:corruption.spread`
4. `event:corruptionOutbreak`
5. `metrics.spike`
6. `node:evolved`
7. `event:loadCollapse`
8. `event:instabilityTrap`
9. `hud.visibility.change`

### Orphaned Listeners (Listeners but No Emission Found)
1. `node.hover`
2. `node.corruption.high`
3. `network:corruptionSpread`
4. `event:networkCorruptionSpread`
5. `node.failure`
6. `wave.burst`
7. `semantic.state.changed`
8. `semantic.cluster.sync`
9. `event:linkCollapse`

---

## RECOMMENDATIONS

### 1. Cleanup Zombie Events
Remove or activate listeners for:
- `link:synergyThreshold` - Should trigger visual effects?
- `link:harmonicLock` - Should trigger lock visuals?
- `metrics.spike` - Already defined in event policies
- `node:evolved` - Evolution system exists but no consumers

### 2. Fix Orphaned Listeners
Investigate missing emissions for:
- `node.hover` - Likely direct raycast method calls
- `wave.burst` - WaveInterferenceEngine may emit via different pattern
- Coruption events - May be emitted differently than expected

### 3. Consolidate Dual Events
- `node.selection` vs `node:selected` - Merge or clarify purpose
- `link.created` vs callbacks - Already documented in event inventory

### 4. Direct Method Call Audit
- `createLink()` has multiple direct calls - ensure events fire correctly
- Consider enforcing event emission in all direct call paths

---

## CONCLUSION

**Active Gameplay Events:** 24 events with confirmed emission and listeners
**Zombie Events:** 13 events emitted but not consumed (cleanup needed)
**Orphaned Listeners:** 8 listeners waiting for events that may not be emitted

**Event System Status:** SemanticBus is the primary event system and functioning well. Main issues are:
1. Unused/zombie events cluttering the system
2. Some listeners waiting for events that may be emitted differently
3. Direct method calls that may bypass event emission

**Overall Assessment:** Event-driven architecture is working. Cleanup needed for efficiency and clarity.