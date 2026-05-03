# Semantic Bus Connectivity Audit Report

**Date:** 2026-05-03
**Scope:** Event flow verification across ATOMA FX systems
**Classification:** MEDIUM — subsystem audit, no code changes

---

## 1. Executive Summary

`globalThis.semanticBus` is **properly initialized** and actively drained. Event flow is structurally sound, with 40+ FX systems subscribing to semantic events. Most systems implement unsubscribe/dispose hygiene. A small number of systems appear to hold bus references without active subscriptions, and several legacy systems use mixed `.on()` / `.subscribe()` APIs without risk because the bus aliases them.

**Verdict:** Events are flowing. The bus is not dead. Individual FX silence is more likely caused by **emitter starvation** (cooldown/aggregation/suppression policies) or **subscriber logic errors** than by bus failure.

---

## 2. Bus Initialization & Drain Authority

### Initialization
- **Location:** [`main.js:4053`](main.js:4053)
- **Code:**
  ```js
  this.semanticBus = new SemanticEventBus();
  window.semanticBus = this.semanticBus;
  ```
- **Class:** [`SemanticEventBus`](main.js:1546) — fully implemented with priority queues, policies, aliases, trace buffer, budgeting, and fairness.

### Drain Scheduling
- **Primary drain:** [`main.js:12187`](main.js:12187) inside `runVisualOverlayTick()`
  - `this.semanticBus?.drain(0.8, 48);` — 0.8ms budget, 48 events max
  - `this.semanticBus?.drainTasks(0.5, 32);` — task queue drain
- **Scheduler registration:** [`main.js:4500`](main.js:4500) via `FrameScheduler` at visual layer (`visual.visualOverlayTick`)
- **Manual API:** `window.__ATOMA_SEMANTIC_DRAIN__(ms)` for debugging

### Audit Loop (Non-Draining)
- `semanticBus.animate()` starts a `requestAnimationFrame` loop at [`main.js:2118`](main.js:2118)
- This loop only calls `logEventAudit()` (5-second throttled console logging)
- **It does NOT drain the bus** — draining is FrameScheduler-driven

---

## 3. Event Emission Inventory

### High-Frequency Emitters

| Emitter File | Events Emitted | Trigger Frequency |
|--------------|----------------|-------------------|
| [`MetricsRuntime_v1.js`](MetricsRuntime_v1.js) | `node.metric.updated`, `link.corruption.spread`, `metric.corruption.spread`, `network:stressRise`, `network:stabilityDrop`, `network:corruptionSpread`, `network:harmonyShift`, `event:synergyCascade`, `event:harmonyResonance`, `event:corruptionOutbreak`, `event:loadCollapse`, `event:instabilityTrap`, `metric.tier.changed`, scoped tier events | 10Hz simulation tick + link change callbacks |
| [`NodeMetricEngine.js`](src/metrics/NodeMetricEngine.js) | `node.metric.updated` | Per-node metric change with cooldown |
| [`NodeLinkingSystem.js`](NodeLinkingSystem.js) | `link.created` | Every player link creation |
| [`LinkQualityCalculator.js`](LinkQualityCalculator.js) | `cascade.start`, `cascade.hop` | Per-link quality update when intensity crosses thresholds |
| [`LinkSemanticMetricsBridge_v1.js`](LinkSemanticMetricsBridge_v1.js) | `cascade.start`, `cascade.hop`, `cascade.end` | Per-link cascade state change |
| [`CascadeEventBridge_v1.js`](CascadeEventBridge_v1.js) | `cascade.start`, `cascade.end`, `cascade.hop` | Cascade lifecycle transitions |
| [`HarmonicHubAuraSystem_Session126.js`](HarmonicHubAuraSystem_Session126.js) | `hub.harmony.high/mid/low`, `metric.tier.changed`, `harmonic.cascade.start` | Hub metric tier changes |
| [`HarmonicHubCascade.js`](HarmonicHubCascade.js) | `cascade.start` | Node cascade strength > 0.65 |
| [`main.js`](main.js) | `node.spawned`, `node.selection`, `node:selected`, `node.click`, `cascade.start`, `cascade.hop` | Node spawn, player click, cascade trigger |
| [`CascadingRuptureSystem.js`](CascadingRuptureSystem.js) | `topology.rupture` | Link removal / node death |
| [`HarmonicHealingVisualSystem_Session134.js`](HarmonicHealingVisualSystem_Session134.js) | `topology.healing` | Healing wave arrival |
| [`HarmonicRecoveryVisualSystem_Session138.js`](HarmonicRecoveryVisualSystem_Session138.js) | `topology.healing` | Recovery completion |
| [`LinkCollapseSystem.js`](LinkCollapseSystem.js) | `link.collapse.*`, scoped tier events | Link collapse state changes |
| [`EventDramaturgyEngine.js`](EventDramaturgyEngine.js) | `dramaturgy.sequence.start`, `dramaturgy.sequence.end`, `dramaturgy.phase` | Sequence phase transitions |
| [`AIConsciousnessLayer.js`](AIConsciousnessLayer.js) | `consciousness.state.changed`, `consciousness.snapshot` | Consciousness signature change |
| [`AtomaAudioSystem.js`](AtomaAudioSystem.js) | `world.macroState.changed` | World context transitions |
| [`InputRuntime_v1.js`](InputRuntime_v1.js) | `signature.moment.nudge` | Player input during signature moments |
| [`LinkCascadeInfectionSystem.js`](LinkCascadeInfectionSystem.js) | `cascade.hop` | Infection propagation hop |

### Event Policies (Built-in Throttling)
The bus applies per-event policies at [`main.js:1606`](main.js:1606). Key examples:
- `link.created`: 100ms cooldown, 100ms aggregation window
- `cascade.start/hop/end`: 100ms cooldown, 100ms aggregation
- `node.metric.updated`: no explicit policy (relies on emitter-side cooldown in `NodeMetricEngine`)
- `node.selection`: 200ms cooldown, 250ms aggregation
- Network events (`network:stressRise`, etc.): 250ms cooldown, 500ms aggregation

**Implication:** If an FX system expects to see every single event instance, it will miss some due to aggregation. This is by design — consumers should react to the latest aggregated payload, not count events.

---

## 4. FX Subscription Health

### Active Subscriptions with Proper Hygiene

| System | Events Subscribed | Unsubscribe/Dispose Path | Health |
|--------|-------------------|--------------------------|--------|
| [`HarmonicHubAuraSystem_Session126`](HarmonicHubAuraSystem_Session126.js) | `hub.harmony.high/mid/low` | `dispose()` → `semanticBus.unsubscribe()` | ✅ Healthy |
| [`HarmonicHealingVisualSystem_Session134`](HarmonicHealingVisualSystem_Session134.js) | `link.harmony.high/mid/low`, `link.corruption.high`, `link.stability.low`, `node.corruption.high` | `_teardownEventSubscriptions()` | ✅ Healthy |
| [`HarmonicNodeResonanceHalos`](HarmonicNodeResonanceHalos.js) | `node.harmony.high/mid/low` | `dispose()` → unsubscribe | ✅ Healthy |
| [`HarmonicRecoveryVisualSystem_Session138`](HarmonicRecoveryVisualSystem_Session138.js) | `link.harmony.high/mid`, `link.stability.mid`, `node.stability.low` | `_teardownEventSubscriptions()` | ✅ Healthy |
| [`CascadeEventBridge_v1`](CascadeEventBridge_v1.js) | `node.synergy.high`, `node.corruption.high`, `link:collapsed` | `_unsubscribeFromEvents()` | ✅ Healthy |
| [`CascadeResonanceWaveVisualization_Session146`](CascadeResonanceWaveVisualization_Session146.js) | `cascade.start`, `cascade.hop` | `_unsubscribeCascadeEvents()` | ✅ Healthy |
| [`CascadeToWaveBridge_v1`](CascadeToWaveBridge_v1.js) | `cascade.hop` | `_unbind()` → `bus.unsubscribe/off()` | ✅ Healthy |
| [`EventDramaturgyEngine`](EventDramaturgyEngine.js) | Trigger + end event catalog | `_unsubscribeAll()` | ✅ Healthy |
| [`EnvironmentEventCoordinator`](EnvironmentEventCoordinator.js) | Metric/consciousness/ritual triggers | `_unsubscribeAll()` | ✅ Healthy |
| [`MetricsRuntime_v1`](MetricsRuntime_v1.js) | `link.created`, `link.removed` | `_trackDisposer()` | ✅ Healthy |
| [`LinkMicroImpulseAdapter_v1`](LinkMicroImpulseAdapter_v1.js) | `link.created`, `link.removed`, `node.metric.updated`, `cascade.start/hop/end` | `_unhookSemanticBusListeners()` | ✅ Healthy |
| [`ResonanceCascadeVisualization_Session117B`](ResonanceCascadeVisualization_Session117B.js) | `link.created`, `global.loadPressure.high` | `dispose()` → unsubscribe | ✅ Healthy |
| [`PHASE5_CascadeVisuals`](PHASE5_CascadeVisuals.js) | `cascade.hop/start`, `link.harmony.low/high`, `node.stability.low/mid`, `node.metric.updated`, `link.created`, `node.spawned` | `_unsubscribeSemanticEvents()` | ✅ Healthy |
| [`T2_HarmonyVisualConsumer_v1`](T2_HarmonyVisualConsumer_v1.js) | `node.harmony.high/mid` | `_unsubscribeSemanticEvents()` | ✅ Healthy |
| [`T2_CorruptionVisualIntegration_v1`](T2_CorruptionVisualIntegration_v1.js) | `node.corruption.high` | `_unsubscribeCorruption()` | ✅ Healthy |
| [`VisualEchoTrails_v1_Integration`](VisualEchoTrails_v1_Integration.js) | `link.created` | `_unbindSemanticBus()` | ✅ Healthy |
| [`UISelectedHUD`](HUD/UISelectedHUD.js) | `link.created` | `_unbindSemanticBus()` | ✅ Healthy |
| [`_GlyphFusionOverlay4_1`](_GlyphFusionOverlay4_1.js) | `link.created` | Inline (no explicit unbind found) | ⚠️ No cleanup |
| [`_RecursiveGlyphSignalSystem`](_RecursiveGlyphSignalSystem.js) | `link.created` | `_unbindSemanticBus()` | ✅ Healthy |
| [`NodeInspectOverlay1_0`](NodeInspectOverlay1_0.js) | `link.created` | `_linkCreatedDismissDisposer` | ✅ Healthy |
| [`SafeMetricsFX1_1`](SafeMetricsFX1_1.js) | `node.metric.updated` | `_unsubscribeMetricNodeUpdated` | ✅ Healthy |
| [`_AdaptiveGlyphRendering1_0`](_AdaptiveGlyphRendering1_0.js) | `node.metric.updated` | `_unsubscribeMetricUpdated` | ✅ Healthy |
| [`_ExtremeAIShaderPack`](_ExtremeAIShaderPack.js) | `node.metric.updated` | `_unsubscribeMetricUpdated` | ✅ Healthy |
| [`CoreMetricsOverlay`](HUD/CoreMetricsOverlay.js) | `node.metric.updated` | `_metricSubscriptionDisposer` | ✅ Healthy |
| [`LinkRendererConduit`](LinkRendererConduit.js) | `node.metric.updated` | `_metricSubscriptionDisposer` | ✅ Healthy |
| [`LoreUnlockEngine`](LoreUnlockEngine.js) | Trigger catalog via `semanticBus.on()` | No explicit cleanup | ⚠️ No cleanup |
| [`LoreFragmentEmitter`](LoreSystem/LoreFragmentEmitter.js) | Stats + trigger events | `_subscriptions` array | ✅ Healthy |
| [`NetworkChronicle`](LoreSystem/NetworkChronicle.js) | Various | `_subscriptions` array | ✅ Healthy |
| [`AtomaAudioEventManifest`](AtomaAudioEventManifest.js) | `AUDIO_EVENT_MANIFEST` catalog | Returns unsubscribe function | ✅ Healthy |
| [`HarmonicTopologyLearningSystem`](HarmonicTopologyLearningSystem.js) | `topology.rupture`, `topology.healing` | `setEventBus(null)` would clear, but no explicit unbind | ⚠️ Weak cleanup |
| [`EventFrequencyAudit`](Engine/Debug/EventFrequencyAudit.js) | `node.selection`, `link.created`, `network.link.destroyed`, `node.synergy.high` | `reset()` | ✅ Debug tool |
| [`CascadeBurstVisual_Session147`](CascadeBurstVisual_Session147.js) | `node.stability.low` | `_unsubscribeCascadeEvents()` → `bus.off()` | ✅ Healthy |

### Systems with Bus Reference but No Visible Subscription

| System | Bus Access Pattern | Assessment |
|--------|-------------------|------------|
| [`CorruptionVisualFX_v1`](CorruptionVisualFX_v1.js) | `_getSemanticBus()` returns `globalThis?.semanticBus` | Reads bus for emit only; no subscription found |
| [`LinkCorruptionParticleSystem`](LinkCorruptionParticleSystem.js) | `_getSemanticBus()` | Same as above |
| [`NeonLinkVisuals`](NeonLinkVisuals.js) | `_getSemanticBus()` | Same as above |
| [`CascadeWaveParticles`](CascadeWaveParticles.js) | `this._semanticBus = null` | Fields present but no subscription setup visible |
| [`CognitiveHorizonPlane`](CognitiveHorizonPlane.js) | `_resolveSemanticBus()` | `_setupResidueCoupling()` exists but subscription detail not in search scope |
| [`CanonicalTemplate3_StressVisuals`](CanonicalTemplate3_StressVisuals.js) | `_resolveSemanticBus()` | Only emits `_emitPressurePhaseEvent()`; no subscription |
| [`EnvironmentalHazards`](EnvironmentalHazards.js) | `_resolveMetricBus()` | Bus resolution only; subscriptions in other methods |

**Assessment:** These systems are likely **emitters or conditional consumers**, not dead subscribers. They hold bus references to emit events or to check bus state reactively.

---

## 5. API Compatibility Notes

The `SemanticEventBus` provides both `.subscribe()` / `.unsubscribe()` and `.on()` / `.off()` aliases:
- [`main.js:2140`](main.js:2140): `on(tag, handler, opts) { this.subscribe(tag, handler, opts); }`
- [`main.js:2158`](main.js:2158): `off(tag, handler) { this.unsubscribe(tag, handler); }`

**Result:** Mixed usage across the codebase is safe. A subscriber using `bus.on()` can be removed with `bus.off()` or `bus.unsubscribe()` — both resolve to the same internal handler list.

---

## 6. Potential Risks & Recommendations

### Risk 1: Event Suppression Hiding Activity
- The bus suppresses events under overload (`maxQueueDepth`, `dropRateThreshold`)
- If the visual layer is under heavy load, FX events may be dropped silently
- **Check:** `semanticBus.stats.suppressedEvents` and `semanticBus.stats.droppedEvents` at runtime

### Risk 2: Aggregation Merging Payloads
- Events like `cascade.hop` aggregate within 100ms windows
- A system expecting per-hop granularity will only see the latest payload
- **Recommendation:** FX systems should read `payload.__aggregation.count` if they need multiplicity

### Risk 3: Missing Cleanup in Lore & Glyph Systems
- [`LoreUnlockEngine.js`](LoreUnlockEngine.js) and [`_GlyphFusionOverlay4_1.js`](_GlyphFusionOverlay4_1.js) lack explicit unsubscribe on disposal
- On world switch, old handlers may persist if the bus instance is reused
- **Recommendation:** Add `_unsubscribeAll()` methods to these systems

### Risk 4: `HarmonicTopologyLearningSystem` Weak Cleanup
- Uses `semanticBus.on()` but cleanup is only via `setEventBus(null)`
- If the system is disposed without calling `setEventBus(null)`, handlers leak
- **Recommendation:** Add explicit `dispose()` with `bus.off()` calls

### Risk 5: No Runtime Subscription Registry
- There is no central registry of "who is subscribed to what"
- Debugging a silent FX requires manual code search
- **Recommendation:** The existing `semantic_event_mapper.py` tool can generate this map; run it periodically

---

## 7. How to Verify Live Event Flow

### Browser Console Commands
```js
// Check bus exists
window.semanticBus ? 'BUS OK' : 'BUS MISSING'

// Check queue backlog
window.__ATOMA_SEMANTIC_QUEUE__()

// Manual drain
window.__ATOMA_SEMANTIC_DRAIN__(2)

// Event counters (last 5s window)
window.semanticBus.getEventCounters()

// Full stats
window.semanticBus.stats

// Trace buffer (last 500 events)
window.semanticBus.semanticTrace.entries.slice(-20)

// Aggregation buffers
window.semanticBus.getAggregationBufferSummary()

// Check specific event handlers
window.semanticBus.handlers.get('cascade.start')?.length
window.semanticBus.handlers.get('node.corruption.high')?.length
window.semanticBus.handlers.get('link.created')?.length
```

### Python Tool
```bash
cd "ai tools (python)"
python semantic_event_mapper.py scan
python semantic_event_mapper.py report
```

---

## 8. `semantic_event_mapper.py` Scan Results

Ran `python semantic_event_mapper.py scan --output json` on 8,815 JS files.

**Raw counts:**
- **1,172 emit patterns** found
- **777 subscribe patterns** found

### Tool Limitation Warning
The mapper uses regex (`bus.emit('string')` / `bus.subscribe('string')`). It **misses**:
- Dynamic event names: `bus.emit(buildScopedMetricEventName('node', 'corruption', 'high'), ...)`
- `emitImmediate()` calls
- `onPrefix()` subscriptions

This means **scoped metric tier events** (`node.*.high/mid/low`, `link.*.high/mid/low`, `hub.*.high/mid/low`, `global.*.high/mid/low`) may be falsely flagged as "dead handlers" or "orphan emits" when they are actually wired dynamically. Treat those classifications with skepticism.

### Confirmed Dead Handlers (Subscribed → Never Emitted via Static String)

| Event | Subscribers | Affected Systems | Verdict |
|-------|-------------|------------------|---------|
| `camera.motion` | 20 | `main.js` (multiple), `frameschedulerson.js` | **LIKELY REAL** — no static `emit('camera.motion')` found; may be emitted dynamically or not at all |
| `lore.unlocked` | 7 | `main.js` lore bridge | **LIKELY REAL** — no static emit found |
| `link.removed` | 6 | `MetricsRuntime_v1.js` | **LIKELY REAL** — `NodeLinkingSystem` may emit dynamically |
| `wave.burst.lifecycle` | 10 | `ResonanceEchoTrailSystem.js` | **LIKELY REAL** — no static emit found |
| `ritual:update` / `ritual:complete` | 9 each | `RITUAL_VISUAL_ORCHESTRATOR_EXAMPLES.js` | **LIKELY REAL** — example/orchestrator file may be dormant |
| `semantic.state.changed` / `semantic.cluster.sync` | 11 each | `_GlyphFusionOverlay4_1.js` | **LIKELY REAL** — no static emit found |

### Confirmed Orphan Emits (Emitted → Never Subscribed via Static String)

| Event | Emit Count | Emitters | Assessment |
|-------|------------|----------|------------|
| `consciousness.state.changed` | 16 | `AIConsciousnessLayer.js` | **Orphan** — no consumer listens to consciousness events |
| `consciousness.snapshot` | 16 | `AIConsciousnessLayer.js` | **Orphan** — same as above |
| `world.macroState.changed` | 2 | `AtomaAudioSystem.js` | **Orphan** — no subscriber found |
| `environment.pressure.phase` | 4 | `CanonicalTemplate3_StressVisuals.js` | **Orphan** — internal emitter only |
| `healing.arrival` | 8 | `HarmonicHealingVisualSystem_Session134.js` | **Orphan** — emitted but no listener |
| `signature.moment.nudge` | 4 | `InputRuntime_v1.js` | **Orphan** — no subscriber found |
| `metric:corruptionRise` | 14 | `LinkCorruptionTransmission_v1.js` | **Orphan** — legacy metric event, no consumer |
| `world.loaded` | 8 | `main.js` | **Orphan** — no subscriber found |
| `game:won` | 8 | `main.js` | **Orphan** — no subscriber found |
| `node.click` | 22 | `main.js` | **Orphan** — no subscriber found |
| `network.node.created` | 2 | `main.js` | **Orphan** — no subscriber found |

### Over-Subscription Hotspots

| Event | Subscribers | Risk |
|-------|-------------|------|
| `link.created` | **103** | 🔴 **CRITICAL** — every link creation fires 103 handlers. Budget/deferral likely active, but this is a performance landmine. |
| `node.selection` | **42** | 🟠 High — player click triggers 42 handlers |
| `cascade.hop` | **28** | 🟠 High — cascade propagation triggers 28 handlers |
| `network.link.destroyed` | **28** | 🟠 High — link removal triggers 28 handlers |
| `node.metric.updated` | **28** | 🟠 High — metric update triggers 28 handlers |
| `cascade.start` | **26** | 🟡 Medium — 26 subscribers |
| `node.spawned` | **26** | 🟡 Medium — 26 subscribers |
| `link.harmony.high` | **31** | 🟡 Medium — but may include false positives from dynamic tier aliases |

### Over-Emit Hotspots (Potential Event Storms)

| Event | Emit Count | Risk |
|-------|------------|------|
| `cascade.start` | **96** | 🟠 High — 96 static emit sites; dynamic emits may add more |
| `cascade.hop` | **84** | 🟠 High — 84 static emit sites |
| `metric.tier.changed` | **46** | 🟠 High — 46 emits, **0 static subscribers**. This is the internal diagnostics hook. If no tooling consumes it, it's pure overhead. |
| `topology.rupture` | **42** | 🟡 Medium |
| `topology.healing` | **42** | 🟡 Medium |
| `synergy.fade` | **44** | 🟡 Medium |
| `node.selection` | **52** | 🟡 Medium |

---

## 9. Conclusion

| Question | Answer |
|----------|--------|
| Is `globalThis.semanticBus` properly initialized? | **YES** — initialized in `main.js`, exposed to `window`, drained by FrameScheduler |
| Which events are emitted and how often? | **1,172 emit patterns** from 8,815 files; `cascade.start/hop` are the most frequent (96/84 static sites). Many events are dynamically emitted and undercounted by static analysis. |
| Which FX subscriptions are active vs. dead? | **777 subscribe patterns** found. **~25+ events have dead handlers** (subscribed but no static emit). **~30+ events are orphan emits** (emitted but no static subscriber). **Scoped metric tier events are likely falsely classified** due to dynamic naming. |

**Bottom line:** The semantic bus is alive and wired, but it carries significant **wiring debt**:
1. **103 subscribers to `link.created`** — performance risk under load
2. **Many orphan events** — emitters firing into the void (wasted CPU + queue pressure)
3. **Many dead handlers** — FX systems waiting for events that never come (silent failure)
4. **Dynamic metric tier events** evade static analysis — the real wiring may be healthier than it looks, or it may be worse

**Recommended actions:**
1. **Immediate:** Verify `link.created` subscriber count at runtime. If truly 103, implement an aggregation proxy or reduce subscribers.
2. **Short-term:** Remove or wire orphan events (`consciousness.state.changed`, `healing.arrival`, `world.macroState.changed`, etc.) — either find consumers or stop emitting.
3. **Medium-term:** Add runtime subscription registry to `SemanticEventBus` so `window.semanticBus.handlers` can be inspected live.
4. **Verification:** Load the game, open console, run:
   ```js
   window.semanticBus.handlers.get('link.created')?.length
   window.semanticBus.handlers.get('cascade.start')?.length
   window.semanticBus.stats
   ```

---

## 10. Phase 1 Live Baseline + Truth-Source Validation (2026-05-03)

Runtime used: `http://127.0.0.1:5501/` (live gameplay session)

Method:
- Read truth-source directly from runtime bus internals:
  - `window.semanticBus.handlers`
  - `window.semanticBus.prefixListeners`
  - `window.semanticBus.resolveEventAliases(...)`
  - `window.semanticBus.stats`
- Captured one 10s idle window and one 10s stress window.

### 10.1 Live Handler Counts (Truth Source)

Tracked hot events:

| Event | Exact handlers (live) | Prefix listeners (live) | Effective potential |
|-------|------------------------|--------------------------|---------------------|
| `link.created` | **20** | 0 | 20 |
| `cascade.start` | **9** | 0 | 9 |
| `cascade.hop` | **7** | 0 | 7 |
| `node.selection` | **3** | 0 | 3 |

Key correction:
- The previous static audit claim (`link.created` = 103 subscribers) is **not reflected in this live runtime instance**.
- Live truth-source at measurement time is **20 exact handlers** for `link.created`.

### 10.2 Queue Pressure (10s Idle vs 10s Stress)

Idle 10s window:
- Queue depth end: p0=0, p1=0, p2=0, p3=0
- Stats delta: essentially flat (no suppression/drop/budget pressure)

Stress 10s window (3 smoke links + synthetic `node.selection` + `cascade.hop` at 25Hz):
- Queue depth end: p0=0, **p1=237**, p2=0, p3=0
- Stats delta:
  - `droppedEvents`: **+424**
  - `decayedEvents`: **+640**
  - `aggregatedEvents`: **+75**
  - `budgetDeferredEvents`: **+351**
  - `budgetOverflows`: **+34**
  - `starvedEventsRecovered`: **+1019**
  - `starvationSkips`: **+302**
  - `fairnessBoostsApplied`: **+1604**

Interpretation:
- Under pressure, the bus **does** enter fairness/budget mitigation and starts dropping/deferring events.
- Risk is real, but in this run it manifests more as **queue pressure + budget contention** than as raw `link.created` handler explosion.

### 10.3 False-Positive Classification (Do Not Cut Blindly)

#### Confirmed false positives from prior static-only view

- `consciousness.state.changed`:
  - Live handlers: 2
  - Not orphan in runtime.

- `world.macroState.changed`:
  - Live handlers: 1
  - Not orphan in runtime.

- `lore.unlocked`, `link.removed`, `wave.burst.lifecycle`, `semantic.state.changed`, `semantic.cluster.sync`:
  - Live handlers present (non-zero in this run).
  - Not dead in current runtime instance.

- `metric:corruptionRise`:
  - Live exact handlers: 0
  - Alias target resolves to `node.corruption.high`
  - Static "orphan" label is partially misleading due to alias wiring.

#### Still likely true or environment-dependent

- `consciousness.snapshot`: 0 live handlers in this run.
- `healing.arrival`: 0 live handlers in this run.
- `signature.moment.nudge`: 0 live handlers in this run.
- `node.click`: 0 live handlers in this run.
- `network.node.created`: 0 live handlers in this run.
- `metric.tier.changed`: 0 live handlers in this run (appears diagnostics/internal lane).

Important caveat:
- Zero live handlers in one runtime sample does **not** always mean dead forever; some listeners are world/system-conditional.

### 10.4 Phase 1 Outcome

Completed:
- Baseline live handler count captured.
- Queue-pressure and budget-pressure measured under stress.
- False-positive set identified using runtime truth-source.

Next (Phase 2 candidate):
- Implement `link.created` load-shed/fanout bridge based on live count truth (20 exact handlers), while preserving behavior and prioritizing cleanup/idempotent binding.

---

## 11. Phase 4 Implementation + Phase 5 Regression Gate (2026-05-03)

Scope of this section:
- Document post-implementation behavior after Phase 2/3/4 semantic-bus hardening.
- Compare Phase 1 baseline stress behavior with Phase 5 post-change measurements.
- Confirm no visible FX regression on `link.created` cascade path.

### 11.1 Implemented Runtime Changes (Already Landed in Code)

- `main.js`:
  - Added storm-governance targeting for hot tags (`cascade.start`, `cascade.hop`, `node.selection`).
  - Added immediate fast-lane handling for critical/interactive hot tags to reduce backlog latency.
  - Tuned mitigation path to prefer suppression/deferral over hard drop under sustained storms.
  - Added `link.created` fanout edge support and stronger disposer semantics.

- Migrated heavy `link.created` consumers to fanout + hard unbind lifecycle:
  - `PHASE5_CascadeVisuals.js`
  - `SynergyCascadeVisualizer.js`
  - `VisualEchoTrails_v1_Integration.js`

- Subscriber hygiene hardening:
  - `_GlyphFusionOverlay4_1.js`: idempotent bind + explicit unbind on reset/dispose
  - `LoreUnlockEngine.js`: tracked unsubscribers + disposal guard

### 11.2 Regression Measurements (Live Runtime)

Runtime used: `http://127.0.0.1:5501/`.

#### A) Idle 10s (post-Phase 4, clean session)

- Queue depth end: p0=0, p1=0, p2=0, p3=0
- Stats delta:
  - `droppedEvents`: +0
  - `decayedEvents`: +0
  - `aggregatedEvents`: +0
  - `suppressedEvents`: +0
  - `budgetDeferredEvents`: +50
  - `budgetOverflows`: +0
- Handler counts now:
  - `link.created`: 16
  - `cascade.start`: 9
  - `cascade.hop`: 7
  - `node.selection`: 3
- Fanout state:
  - `edgeBound`: true
  - `fanoutConsumers`: 4

Result: idle remains stable (no queue accumulation, no drops).

#### B) Stress 10s apples-to-apples (post-Phase 4)

Load shape (matched to Phase 1):
- 3 smoke links
- Synthetic `node.selection` + `cascade.hop` at 25Hz for 10s

Post-change stress snapshot:
- Queue depth end: p0=0, p1=888, p2=39, p3=0
- Stats delta:
  - `droppedEvents`: +16
  - `decayedEvents`: +0
  - `aggregatedEvents`: +8
  - `suppressedEvents`: +96
  - `budgetDeferredEvents`: +253
  - `budgetOverflows`: +24
  - `starvedEventsRecovered`: +1250
  - `starvationSkips`: +252
  - `fairnessBoostsApplied`: +2149
- Processed delta (10s): [40, 1269, 0, 0]
- FX gate:
  - `cascadeHistory`: increased during run
  - `link.created` fanout edge remained bound with 4 consumers

#### C) Before vs After (Phase 1 baseline vs post-Phase 4)

| Metric (10s stress) | Phase 1 baseline | Post-Phase 4 | Direction |
|---------------------|------------------|---------------|-----------|
| `droppedEvents` | 424 | 16 | ✅ Major improvement |
| `decayedEvents` | 640 | 0 | ✅ Major improvement |
| `aggregatedEvents` | 75 | 8 | ✅ Lower merge pressure |
| `budgetDeferredEvents` | 351 | 253 | ✅ Reduced |
| `budgetOverflows` | 34 | 24 | ✅ Reduced |
| `starvedEventsRecovered` | 1019 | 1250 | ⚠️ Higher recovery activity |
| `fairnessBoostsApplied` | 1604 | 2149 | ⚠️ More fairness intervention |
| Queue depth end p1 | 237 | 888 | ⚠️ Higher backlog in this run |

Interpretation:
- The governance path shifted storm handling away from drop/decay and toward suppression/defer/fairness.
- Hard-drop pressure is substantially lower under equivalent synthetic load.
- Backlog can still grow under sustained stress; this is now primarily a queue management concern, not immediate event loss.

### 11.3 Phase 5 Gate Verdict

Gate status: **PASS WITH RISK**

Pass criteria met:
- No new runtime crashes observed in measured windows.
- `link.created` fanout path is active and functional (`edgeBound=true`, 4 consumers).
- Cascade visual path still reacts under load (`cascadeHistory` advances).
- Drop/decay pressure materially reduced vs Phase 1 baseline.

Residual risks:
- Priority-1 backlog can still accumulate during sustained synthetic storms.
- Fairness intervention remains high, indicating the system is still operating near budget edges in stress scenarios.

Optional next tuning pass (not required for this phase completion):
1. Increase adaptive drain allowance when p1 backlog exceeds threshold.
2. Add bounded sampling on non-critical `cascade.hop` payload fields before enqueue.
3. Add automated perf gate script to replay this exact stress profile and fail CI on regression thresholds.

---

*Audit updated by agent. Includes static scan findings and Phase 1-5 live runtime verification snapshots.*
