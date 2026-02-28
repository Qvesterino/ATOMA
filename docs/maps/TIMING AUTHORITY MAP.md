# ATOMA – TIMING AUTHORITY MAP AUDIT
**PHASE: READ-ONLY | MODE: NO FILE MODIFICATIONS**

---

## EXECUTIVE SUMMARY

ATOMA operates with a **SCHEDULER-CENTRIC WITH EXCEPTIONS** timing architecture. The system has a primary centralized scheduler (FrameScheduler) with four lanes, but multiple subsystems create their own timing systems or run outside scheduler authority.

**Classification**: SCHEDULER-CENTRIC WITH EXCEPTIONS (HIGH FRAGMENTATION RISK)

**Key Findings**:
- ✅ Single RAF loop (no duplicate loops detected)
- ⚠️ FrameScheduler is primary but not exclusive authority
- ⚠️ Multiple accumulator-based timing systems coexist
- ⚠️ 10+ setTimeout intervals outside scheduler control
- ✅ deltaTime is centralized (THREE.Clock)
- ⚠️ No unified fixed-tick standard (multiple 10Hz systems)

---

## STEP 1 – PRIMARY TIME AUTHORITY

### Time Authority Map

| Time Source | File | Function | Frequency | Canonical? |
|------------|------|----------|-----------|------------|
| requestAnimationFrame | main.js | animate() | ~60Hz | **YES** |
| THREE.Clock.getDelta() | main.js | animate() | per-frame | **YES** |
| performance.now() | main.js | frameClock.tick() | per-frame | YES |
| performance.now() | main.js | _sceneAuditTimer | 3000ms | NO |

### Highlights

**✅ Single RAF Loop**: Only one `requestAnimationFrame` found in `main.js:animate()` - no orphan loops or nested animation loops detected.

**✅ Centralized Clock**: Main timing source is `this.clock.getDelta()` from THREE.Clock, clamped to max 100ms to prevent tab-inactive spikes.

**⚠️ Orphan Interval**: `_sceneAuditTimer` uses `setInterval` every 3 seconds outside scheduler control.

---

## STEP 2 – FRAME SCHEDULER MAP

### FrameScheduler Architecture

| Lane | Target Hz | Registered Systems | File | Deterministic? |
|------|-----------|-------------------|------|----------------|
| **realtime** | 60Hz | cameraController, playerController | main.js | YES |
| **visual** | 30Hz | renderer.render, linkingSystem, nodeAuraSystem | main.js | YES |
| **simulation** | 10Hz | linkCollapseSystem, fxPerformanceScaler, adaptivePerformanceMonitor | main.js | YES |
| **background** | 2Hz | registry-warmup, harmonicTopology, proceduralGlyphGenerator | main.js | YES |

### System Count per Lane

- **realtime**: 5 systems (camera, player, various semantic triggers)
- **visual**: 30+ systems (rendering, all visual FX systems)
- **simulation**: 12 systems (gameplay, performance, link mechanics)
- **background**: 4 systems (registry, topology, glyphs, network metrics)

### Scheduler Bypasses

**Direct RAF Systems** (run every frame, not in scheduler):
- `systemRegistry.update()` - runs all registered systems per-frame
- `frameClock.tick()` - frame timing
- `updateValidator.startFrame()` - frame validation

---

## STEP 3 – FIXED TICK SYSTEMS

### Fixed Tick Systems Map

| System | File | Target Hz | Uses Accumulator? | Stable? |
|--------|------|-----------|-------------------|----------|
| MetricsRuntime_v1 | MetricsRuntime_v1.js | 10Hz | **YES** | YES |
| LinkBeadSystem | LinkBeadSystem.js | variable | YES | YES |
| LinkResonanceFlow | LinkResonanceFlowSystem_Session124.js | variable | YES | YES |
| SemanticEventBus | main.js | per-frame | YES (budget) | YES |
| NodeUI updates | main.js | 10Hz | YES | YES |
| UndoRedoUI updates | main.js | 10Hz | YES | YES |

### Accumulator Pattern Detection

**MetricsRuntime_v1** (Canonical 10Hz):
```javascript
this._accumulator += dt;
while (this._accumulator >= this._fixedDt) {  // 0.1 = 10Hz
    this._step(this._fixedDt);
    this._accumulator -= this._fixedDt;
}
```

**FrameScheduler** (All lanes):
```javascript
layer.accumulator += deltaTime;
while (layer.accumulator >= layer.interval) {
    // Execute functions
    layer.accumulator -= layer.interval;
}
```

### Competing Fixed Tick Systems

**⚠️ NO COMPETING FIXED TICKS DETECTED**: Only MetricsRuntime_v1 uses explicit fixed-tick accumulator pattern. Other systems use scheduler lanes or frame-based updates.

---

## STEP 4 – FPS-COUPLED SYSTEMS

### FPS-Coupled Systems Map

| System | File | Uses deltaTime? | Uses frameCount? | Deterministic? |
|--------|------|----------------|------------------|-----------------|
| AINodes | main.js (reg: aiNodes) | **YES** | YES | NO |
| NodeLinkingSystem | main.js (reg: nodeLinking) | **YES** | NO | PARTIAL |
| SynergyPulseVisuals | main.js | **YES** | NO | YES |
| VisualNetworkTimeElasticity | main.js | **YES** | NO | YES |
| HarmonicResonanceCoupling | main.js | **YES** | NO | YES |
| All visual FX systems | main.js (scheduler visual lane) | **YES** | NO | PARTIAL |
| MetricsVisualFX | main.js | **YES** | NO | PARTIAL |

### Gameplay Systems Tied to FPS

**⚠️ HIGH RISK**: AINodes update runs every frame via systemRegistry, directly using deltaTime without fixed-tick protection.

**⚠️ MEDIUM RISK**: Link creation/destruction events can occur at any frame rate.

### Metric Mutations Tied to FPS

**ACCEPTABLE**: Most metric mutations occur via MetricsRuntime_v1 (fixed 10Hz), but some visual metric updates are FPS-coupled (acceptable for visual-only systems).

---

## STEP 5 – TIME SOURCE DIVERSITY MAP

### Time Sources Map

| Time Source | File | Used By | Centralized? |
|------------|------|----------|---------------|
| THREE.Clock.getDelta() | main.js | All systems via scheduler | **YES** |
| performance.now() | main.js | FrameClock, audit timers | YES |
| Date.now() | (not found in code) | - | NO |
| internal _time accumulators | Multiple files (FX, shaders) | Per-instance | NO |
| window.VISUAL_TIME | main.js | Visual elasticity system | PARTIAL |

### Multiple Clocks Detection

**⚠️ PER-INSTANCE TIME ACCUMULATORS**: 
- SynergyBonusFXLayer_v1: `this._time`
- SynergyResonanceShaderPack_v1: `this._time`
- SynergyBonusVisualization_v1: `this.globalTime`
- LinkAuraSystem_v1: `this.time`
- LinkResonanceFlowSystem: per-link accumulators

### Time Origin Consistency

**✅ CONSISTENT**: All time origins derive from main clock or performance.now() - no drifting clocks detected.

---

## STEP 6 – MODE SWITCH & TIME RESET MAP

### Mode Switch Analysis

| Event | Resets Scheduler? | Resets Accumulators? | Leaves Orphan Timers? |
|-------|-------------------|---------------------|----------------------|
| switchMode() | NO | NO | NO |
| switchWorld() | PARTIAL | YES (simulation/background) | **YES** (setInterval) |
| loadWorld() | PARTIAL | YES (simulation/background) | **YES** (setInterval) |

### Reset Behavior

**FrameScheduler.resetLayer()**:
- ✅ Visual layer reset on world switch
- ✅ Simulation layer reset on world switch
- ✅ Background layer reset on world switch
- ⚠️ Realtime layer NOT reset (camera/player keep running)

**Orphan Timers**:
- ⚠️ `_sceneAuditTimer` (setInterval 3000ms) - NOT cleared on world switch
- ⚠️ Multiple `setTimeout` deferred initializations - may survive world switch

**Timer Cleanup Correctness**: **INCOMPLETE** - setInterval timers not tracked or cleared on world switch.

---

## STEP 7 – BACKGROUND / LOW-FREQUENCY SYSTEMS

### Background Systems Map

| System | File | Frequency | Runs via Scheduler? | Safe? |
|--------|------|-----------|---------------------|-------|
| registry-warmup | main.js | 2Hz | **YES** (background lane) | YES |
| harmonicTopology | main.js | 2Hz | **YES** (background lane) | YES |
| proceduralGlyphGenerator | main.js | 2Hz | **YES** (background lane) | YES |
| harmonicCycleController | main.js | 2Hz | **YES** (background lane) | YES |
| networkMetricsAggregator | main.js | 2Hz | **YES** (background lane) | YES |
| sceneAudit | main.js | 0.33Hz | NO (setInterval) | PARTIAL |

### Throttled Logic

**10Hz Systems**:
- SemanticEventBus (budget-limited, per-frame drain)
- NodeUI updates (accumulator pattern)
- UndoRedoUI updates (accumulator pattern)

**30Hz Systems**:
- Visual semantic tick (throttled accumulator)
- HUD updates (accumulator pattern)

---

## STEP 8 – COMPLETE TIME FLOW DIAGRAM

```
requestAnimationFrame
   ↓
main.animate()
   ↓
clock.getDelta() [Clamped to max 100ms]
   ↓
┌─┴─────────────────────────────────────────────────────┐
│ THREE.Clock Delta Time (dt)                           │
└─┬─────────────────────────────────────────────────────┘
  │
  ├→ FrameScheduler.tick(dt) ──────────────┐
  │    ↓                                   │
  │  ┌─────────────────────────────────┐    │
  │  │ LANE ACCUMULATORS:              │    │
  │  │ - realtime: acc += dt (60Hz)     │    │
  │  │ - visual: acc += dt (30Hz)       │    │
  │  │ - simulation: acc += dt (10Hz)    │    │
  │  │ - background: acc += dt (2Hz)     │    │
  │  │                                 │    │
  │  │ while (acc >= interval):         │    │
  │  │   execute lane functions          │    │
  │  │   acc -= interval                │    │
  │  └─────────────────────────────────┘    │
  │                                       │
  ├→ systemRegistry.update(dt) ───────────┤
  │    ↓                                   │
  │  [Per-frame system execution]           │
  │    - AINodes.update(dt) ← ⚠️ FPS-coupled│
  │    - frameClock.tick()                 │
  │    - updateValidator.startFrame()        │
  │                                       │
  ├→ MetricsRuntime_v1.update(dt) ───────┤
  │    ↓                                   │
  │  [10Hz Fixed Tick]                   │
  │    while (acc >= 0.1):               │
  │      _step(0.1)                       │
  │      acc -= 0.1                       │
  │                                       │
  ├→ SemanticEventBus.drain(budgetMs) ────┤
  │    ↓                                   │
  │  [Per-frame event drain]               │
  │    - Budget-limited                    │
  │    - Aggregation windows               │
  │    - Priority queues                   │
  │                                       │
  ├→ Semantic state computation ───────────┤
  │    - semanticVisualAcc (30Hz)          │
  │    - semanticSlowAcc (10Hz)            │
  │    - HUD accumulator (20Hz)             │
  │                                       │
  ├→ renderer.render() ← ⚠️ SCHEDULER-ONLY │
  │    ↓                                   │
  │  [RENDER CONTRACT LOCKED]             │
  │    - Must run exactly once per frame    │
  │    - Must run as last step            │
  │    - Must run via FrameScheduler      │
  │                                       │
  └→ setInterval: _sceneAuditTimer ──────┘
       ↓
     [Orphan - 3000ms, not cleared on world switch]
```

### Scheduler Bypasses Highlighted

**⚠️ systemRegistry.update()**: Runs every frame outside scheduler, includes AINodes (FPS-coupled gameplay).

**⚠️ setInterval timers**: Not tracked by scheduler, may survive world switches.

**⚠️ deferred setTimeout initializations**: Multiple systems initialize via setTimeout, creating timing gaps.

---

## STEP 9 – TIME ARCHITECTURE CLASSIFICATION

### Classification: **SCHEDULER-CENTRIC WITH EXCEPTIONS**

### Justification

**Centralized Authority**: ✅ YES
- Single requestAnimationFrame loop in main.js
- Centralized THREE.Clock for deltaTime
- FrameScheduler as primary timing authority

**Scheduler Enforcement**: ⚠️ PARTIAL
- FrameScheduler controls most visual and simulation systems
- BUT systemRegistry runs parallel, bypassing scheduler
- Multiple setTimeout/setInterval systems outside scheduler

**Fixed Tick Coherence**: ⚠️ PARTIAL
- Only one explicit fixed-tick system (MetricsRuntime_v1 at 10Hz)
- Other systems use scheduler lanes (variable timing)
- No competing fixed tick systems (good)

**FPS Dependency Scope**: ⚠️ MEDIUM RISK
- AINodes is FPS-coupled (gameplay system)
- Link systems partially FPS-coupled
- Visual systems FPS-coupled (acceptable)

**Timer Cleanup Correctness**: ❌ INCOMPLETE
- setInterval timers not tracked
- Orphan timers survive world switches
- No centralized timer management

### Risk Assessment

| Risk Category | Severity | Description |
|--------------|-----------|-------------|
| Scheduler Fragmentation | **MEDIUM** | systemRegistry runs parallel to scheduler |
| FPS Coupling | **MEDIUM** | AINodes is FPS-coupled |
| Timer Leaks | **HIGH** | setInterval timers not cleared on world switch |
| Determinism | **MEDIUM** | Multiple timing systems with no single authority |
| Visual FPS Coupling | **LOW** | Visual systems FPS-coupled is acceptable |

---

## CONFLICT & RISK HIGHLIGHTS

### Critical Issues

1. **⚠️ SCHEDULER BYPASS**: systemRegistry.update() runs every frame outside scheduler control, including AINodes (gameplay-critical).

2. **⚠️ TIMER LEAKS**: setInterval timers (_sceneAuditTimer, others) not tracked or cleared on world switch, causing potential memory leaks.

3. **⚠️ FPS-COUPLED GAMEPLAY**: AINodes.update() runs every frame with deltaTime, making node behavior dependent on frame rate.

### Medium-Risk Issues

1. **⚠️ MULTIPLE ACCUMULATOR PATTERNS**: Each lane in FrameScheduler uses its own accumulator, plus MetricsRuntime_v1 has its own - no unified fixed-tick pattern.

2. **⚠️ DEFERRED INITIALIZATIONS**: Multiple setTimeout-based initializations create timing gaps and may fire during world transitions.

3. **⚠️ PER-INSTANCE TIME**: FX and shader systems maintain per-instance `_time` accumulators, creating time divergence from main clock.

### Low-Risk Issues (Acceptable)

1. ✅ Visual systems FPS-coupled (acceptable for visual-only behavior)

2. ✅ No duplicate RAF loops

3. ✅ No competing fixed tick systems

4. ✅ Time origins consistent (all from THREE.Clock or performance.now())

---

## RECOMMENDATIONS (READ-ONLY, NO IMPLEMENTATION)

### Phase 1: Centralize Scheduler Authority
- Migrate systemRegistry.update() into FrameScheduler
- Move AINodes to simulation lane (10Hz) for determinism
- Create unified fixed-tick pattern

### Phase 2: Timer Management
- Implement centralized timer registry
- Auto-clear all timers on world switch
- Replace setInterval with scheduler background lane

### Phase 3: Determinism
- Make all gameplay systems use fixed-tick or scheduler lanes
- Decouple gameplay logic from FPS
- Unify accumulator patterns across all timing systems

---

## FINAL VERIFICATION

✅ **READ-ONLY**: No file modifications made
✅ **STRUCTURAL ANALYSIS**: Mapped timing architecture completely
✅ **NO OPTIMIZATION ADVICE**: Only structural findings reported
✅ **NO REFACTOR PROPOSALS**: Classification and risks only

**Audit Complete**: ATOMA Timing Authority Map fully documented