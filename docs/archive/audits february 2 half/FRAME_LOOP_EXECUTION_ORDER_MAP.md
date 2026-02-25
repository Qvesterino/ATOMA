# ATOMA Frame Loop Execution Order Map

**Generated**: 2026-02-23  
**Purpose**: Locate TRUE per-frame render/update loop authority and produce deterministic execution-order map

---

## Primary Frame Authority

### Loop Entry Point
**File**: `main.js`  
**Function**: `animate()` (class method)  
**Line**: Approximately line ~1300+ (exact line varies with file version)

### Loop Recursion Mechanism
```javascript
requestAnimationFrame(() => this.animate());
```
- **Location**: End of `animate()` function in `main.js`
- **Timing Authority**: Browser's `requestAnimationFrame` API
- **Frequency**: Synced to display refresh rate (typically 60 Hz)

### Delta Time Source
```javascript
const deltaTime = Math.min(this.clock.getDelta(), 0.1);
const deltaTimeMs = deltaTime * 1000;
```
- **Source**: `this.clock.getDelta()` (Three.js Clock instance)
- **Clamping**: Maximum 100ms to prevent tab-inactive spikes
- **Units**: Seconds (deltaTime), Milliseconds (deltaTimeMs)
- **Ownership**: `main.js` class instance property `this.clock`

---

## Execution Order Inside Main Loop

### 1. Frame Start Validation
```javascript
this.updateValidator?.startFrame();
```
- **System**: `FrameUpdateLoopOrderValidator_v1.js`
- **Purpose**: Frame-level validation/tracking (optional, may be undefined)

### 2. Delta Time Calculation
```javascript
const deltaTime = Math.min(this.clock.getDelta(), 0.1);
const deltaTimeMs = deltaTime * 1000;
```
- **Purpose**: Compute time since last frame with spike protection

### 3. System Registry Execution
```javascript
systemRegistry.runFrame(this, deltaTime);
```
- **File**: `Engine/SystemRegistry.js`
- **Method**: `runFrame(game, dt)`
- **Execution Logic**:
  - Creates `frameContext` object with `{dt, time, game, links, nodes}`
  - Filters enabled systems by priority (ascending)
  - Calls `update(frameContext)` on each registered system
  - Supports legacy multi-argument signatures with fallback
- **Frequency**: Every frame (60 Hz)
- **Systems Executed**: All registered via `systemRegistry.register()`

### 4. Harmonic Influence Propagation
```javascript
if (this.harmonicInfluencePropagation) {
    this.harmonicInfluencePropagation.update(deltaTime);
}
```
- **File**: `HarmonicInfluencePropagationSystem_Session127.js`
- **Frequency**: Every frame (when enabled)
- **Conditional**: Only if `this.harmonicInfluencePropagation` exists

### 5. Harmonic Cascade Amplification
```javascript
if (this.harmonicCascadeAmplification && this.harmonicCascadeAmplification.config.enabled) {
    this.harmonicCascadeAmplification.update(deltaTime);
}
```
- **File**: `HarmonicCascadeAmplification_Session145.js`
- **Frequency**: Every frame (when enabled and config.enabled)
- **Conditional**: Instance exists AND config.enabled

### 6. Cascade Visualizer
```javascript
if (this.cascadeVisualizer) {
    this.cascadeVisualizer.update(deltaTime);
}
```
- **File**: Likely `CascadeParticleSystem_Session120.js` or similar
- **Frequency**: Every frame (when exists)
- **Conditional**: Only if `this.cascadeVisualizer` exists

### 7. Link Semantic Metrics Bridge
```javascript
if (this.linkSemanticMetricsBridge) {
    this.linkSemanticMetricsBridge.update(deltaTime);
}
```
- **Frequency**: Every frame (when exists)
- **Conditional**: Only if `this.linkSemanticMetricsBridge` exists

### 8. Zone Audio Reactivity
```javascript
if (this.zoneAudioReactivity) {
    this.zoneAudioReactivity.update(deltaTime);
}
```
- **Frequency**: Every frame (when exists)
- **Conditional**: Only if `this.zoneAudioReactivity` exists

### 9. Post-Processing Render (First Pass)
```javascript
try {
    this.renderer.render(this.scene, this.camera);
} catch (err) {
    // Error handling
    this.renderer.setRenderTarget(null);
    // ... post-processing fallback logic
}
```
- **Purpose**: Render scene with post-processing
- **Exception Handling**: Falls back to base render on error

### 10. Base Render (Fallback/Main)
```javascript
this.renderer.render(this.scene, this.camera);
```
- **Purpose**: Direct scene render (no post-processing)
- **Executed**: Either as fallback or primary render path

### 11. Frame Scheduler Tick
```javascript
if (this.frameScheduler) {
    this.frameScheduler.tick(deltaTime);
}
```
- **File**: `FrameScheduler.js`
- **Method**: `tick(deltaTime)`
- **Frequency**: Every frame
- **Layer Execution** (in order):
  1. **realtime** (60 Hz) - critical systems: camera, input, core rendering
  2. **visual** (30 Hz) - visual effects, shaders, auras
  3. **simulation** (10 Hz) - AI, glyphs, metrics, slow simulation
  4. **background** (2 Hz) - rare events, narrative, consciousness
- **Load Shaping**: Per-layer time gates:
  - `soft`: ~50-100ms (75ms interval)
  - `background`: ~250-500ms (300ms interval)
- **Execution Logic**:
  - Accumulates deltaTime per layer
  - Executes all registered functions when interval threshold reached
  - Supports system IDs, enable/disable, priority

### 12. Node Inspector Overlay
```javascript
const start = performance.now();
this.nodeInspectOverlay.update(deltaTime);
this.updateValidator?.markSystemUpdate('nodeInspectOverlay', performance.now() - start);
```
- **Frequency**: Every frame
- **Performance Tracked**: Wrapped with timing measurement
- **Validation**: Reports duration to `updateValidator`

### 13. Loop Recursion
```javascript
requestAnimationFrame(() => this.animate());
```
- **Purpose**: Schedule next frame
- **Position**: End of `animate()` function

### 14. Visual Lock Enforcement
```javascript
window.__enforceProxyVisualLock?.();
```
- **Purpose**: Optional visual lock enforcement hook
- **Conditional**: Only if defined (optional system)
- **Purpose**: Prevent unauthorized renderer.render calls

---

## Secondary Timing Authorities

### Independent requestAnimationFrame Loops
**Status**: None found in production code

Found only in example/test files (NOT active in production):
- `RITUAL_VISUAL_ORCHESTRATOR_EXAMPLES.js` - Example animation loop
- `SynergyAuraColorIntegrationExample.js` - Example animation loop
- `SynergyGlowIntegrationGuide.js` - Example animation loop
- `VisualAudit.js` - Single-frame await for testing
- `VisualLockFrameHook.js` - Disabled (comment: "TEMP HARD DISABLE")
- Various SNIPPET files - Example code, not integrated

### setInterval Recurring Loops
**Production Systems**: None found in main.js

Found only in example/auxiliary files:
1. **W23_TRAVELING_WAVE_FX_SNIPPETS.js**
   - `setInterval(updateWavesFromMood, 100)` - 10 Hz HUD update
   - **Status**: Example code only

2. **LINK_MORPHING_EXAMPLES.js**
   - `setInterval(() => updateCorruptionHUD(), 100)` - 10 Hz HUD update
   - **Status**: Example code only

3. **HUB_INFLUENCE_EXAMPLES.js**
   - `setInterval(() => updateHUD(), 200)` - 5 Hz HUD update
   - **Status**: Example code only

4. **HARMONIC_HALO_EXAMPLES.js**
   - `setInterval(() => updateHUD(), 200)` - 5 Hz HUD update
   - **Status**: Example code only

5. **AutoLinkFeedbackUI1_0.js**
   - `setInterval(updatePosition, 16)` - ~60 Hz position update
   - **Status**: Auxiliary UI system (not core game loop)

### setTimeout Recurring Patterns
**Status**: None found in production code

### performance.now() / Date.now() Timing (Non-Loop)
Found in systems for internal timing logic (NOT independent loops):

1. **FrameScheduler.js**
   - Uses `performance.now()` for load shaping gates
   - Checks `now - entry.lastRun` against intervals
   - **Status**: Part of main loop, NOT independent

2. **EnhancedNodeModels.js**
   - Uses `performance.now()` in `onBeforeRender` callbacks
   - **Status**: Three.js render callbacks, NOT independent loops

3. **WaveShaderBridge_v1.js**
   - Updates shader uniform `uTime` from `performance.now()`
   - **Status**: Called during render, NOT independent

4. **NodeLinkingSystem.js**
   - Uses `performance.now()` for timestamping raycasts
   - **Status**: Event-driven, NOT loop-based

5. **NodeShellSizeAuthority.js**
   - Uses `performance.now()` for enforcement interval gating
   - **Status**: Event-driven throttling, NOT loop-based

6. **AINodes.js**
   - Uses `performance.now()` for spawn queue budgeting
   - **Status**: Called from main loop, NOT independent

---

## Risks

### 1. Double-Update Risk
**Status**: LOW RISK

**Analysis**:
- No independent `requestAnimationFrame` loops found in production code
- No recurring `setInterval` loops calling update functions in main.js
- All update calls are centralized in `main.js:animate()`

**Potential Issues**:
- Example files contain independent loops that could be accidentally integrated
- `AutoLinkFeedbackUI1_0.js` has ~60 Hz setInterval (auxiliary, isolated)

### 2. Desynchronization Risk
**Status**: LOW RISK

**Analysis**:
- Single source of truth: `this.clock.getDelta()`
- FrameScheduler uses same deltaTime as main loop
- All systems receive synchronized deltaTime from main loop

**Potential Issues**:
- `performance.now()` used in some systems for internal timing (not delta-driven)
  - `EnhancedNodeModels.js` shader uniforms
  - `WaveShaderBridge_v1.js` shader uniforms
  - These may drift from main loop timing if not synchronized

### 3. Order-Dependent Bugs
**Status**: MODERATE RISK

**Analysis**:
- SystemRegistry executes systems by priority (ascending)
- Direct update calls in main.js execute in hardcoded order
- FrameScheduler.tick() executes after direct updates and before loop recursion
- renderer.render() called BEFORE FrameScheduler.tick()

**Potential Issues**:
1. **Render Before Systems**: `renderer.render()` is called BEFORE `frameScheduler.tick()`
   - Systems registered to FrameScheduler may update state AFTER render
   - Could cause one-frame visual lag for FrameScheduler systems

2. **Post-Processing Fallback**: Error handling in render may cause state inconsistency
   - Try-catch around render, but no rollback if render succeeds partially

3. **Conditional Execution**: Many systems wrapped in `if (this.xxx)` checks
   - Order changes if system undefined at runtime
   - No validation of system dependencies

4. **Mixed Authority**: Two parallel update mechanisms
   - SystemRegistry (priority-based, every frame)
   - FrameScheduler (layer-based, frequency-throttled)
   - No explicit coordination between them

### 4. Performance.now() Drift Risk
**Status**: LOW-MODERATE RISK

**Analysis**:
- Shader uniforms use `performance.now()` directly in `onBeforeRender` callbacks
- Main loop uses `clock.getDelta()` for deltaTime
- These may diverge over time if not synchronized

**Potential Issues**:
- Shader animations may not match delta-time based animations
- No mechanism to sync `performance.now()` with `clock.getElapsedTime()`

---

## Integration Hooks

### Where to Insert FrameScheduler.runFrame(deltaTime) Safely

**Current State**: FrameScheduler.tick() is already called in main.js

**Location**: After all direct update calls, before renderer.render()

```javascript
// RECOMMENDED LOCATION (after line 8-ish update calls, before render)
if (this.zoneAudioReactivity) {
    this.zoneAudioReactivity.update(deltaTime);
}

// INSERT HERE: FrameScheduler execution
// if (this.frameScheduler) {
//     this.frameScheduler.tick(deltaTime);
// }

// Current: Render
try {
    this.renderer.render(this.scene, this.camera);
} catch (err) {
    // ...
}

// Current: FrameScheduler (too late!)
if (this.frameScheduler) {
    this.frameScheduler.tick(deltaTime);
}
```

**Why This Location?**:
1. **Before Render**: Ensures all updates complete before visual output
2. **After Direct Updates**: Maintains order of direct calls vs scheduled calls
3. **Minimal Diff**: Single insertion point, no major refactoring

**Current Risk**: FrameScheduler.tick() currently executes AFTER renderer.render(), causing visual lag for systems registered to FrameScheduler.

**Recommended Change**:
```javascript
// Move this.frameScheduler.tick(deltaTime) from after renderer.render()
// to before renderer.render() call
```

### Alternative: Move FrameScheduler.tick() Earlier

**Option**: Move FrameScheduler.tick() to BEFORE all direct updates

```javascript
this.updateValidator?.startFrame();
const deltaTime = Math.min(this.clock.getDelta(), 0.1);
const deltaTimeMs = deltaTime * 1000;

// INSERT HERE: FrameScheduler FIRST
if (this.frameScheduler) {
    this.frameScheduler.tick(deltaTime);
}

// Then SystemRegistry
systemRegistry.runFrame(this, deltaTime);

// Then direct updates...
```

**Pros**:
- FrameScheduler executes first (deterministic order)
- All scheduled systems update before main systems

**Cons**:
- May break if main systems depend on FrameScheduler state
- Changes order of ALL system updates

---

## Deterministic Execution Order Summary

### Per-Frame Sequence (deterministic)
1. `updateValidator.startFrame()` (optional)
2. `clock.getDelta()` calculation
3. `systemRegistry.runFrame(game, dt)` - all registered systems (by priority)
4. `harmonicInfluencePropagation.update(dt)` (if exists)
5. `harmonicCascadeAmplification.update(dt)` (if enabled)
6. `cascadeVisualizer.update(dt)` (if exists)
7. `linkSemanticMetricsBridge.update(dt)` (if exists)
8. `zoneAudioReactivity.update(dt)` (if exists)
9. `renderer.render(scene, camera)` - POST-PROCESSING or base render
10. `frameScheduler.tick(dt)` - Layered execution (realtime→visual→simulation→background)
11. `nodeInspectOverlay.update(dt)` (with timing)
12. `requestAnimationFrame(() => this.animate())` - Schedule next frame
13. `window.__enforceProxyVisualLock?.()` - Optional enforcement

### Non-Deterministic Factors
1. **Conditional System Existence**: Systems only execute if `this.xxx` exists
2. **SystemRegistry Priority**: Systems execute by numeric priority (same priority = undefined order)
3. **FrameScheduler Layer Timing**: Within each layer, functions execute in registration order (may vary)
4. **Post-Processing Fallback**: Error path may change render behavior mid-frame

---

## Recommendations

### High Priority
1. **Move FrameScheduler.tick() BEFORE renderer.render()**
   - Current position causes visual lag for scheduled systems
   - Move to line ~9 (after direct updates, before render)

2. **Standardize Time Authority**
   - Audit all `performance.now()` usage in shaders
   - Consider using `clock.getElapsedTime()` instead
   - Prevent timing drift between delta-based and absolute-time systems

### Medium Priority
3. **Document System Dependencies**
   - Add explicit priority values to SystemRegistry registrations
   - Document which systems must execute before others

4. **Add Frame Order Validation**
   - Extend `updateValidator` to check execution order
   - Detect if systems execute out of expected sequence

### Low Priority
5. **Audit Example Files**
   - Remove or clearly label independent `requestAnimationFrame` loops
   - Prevent accidental integration of example animation loops

6. **Consolidate Update Mechanisms**
   - Consider migrating direct update calls to SystemRegistry or FrameScheduler
   - Reduce number of update paths

---

## Appendix: File Line Numbers (Estimated)

**Note**: Exact line numbers may vary based on code version. Use search patterns to locate.

- `main.js`:
  - `animate()` definition: ~line 1300+
  - `clock.getDelta()`: ~line 1305
  - `systemRegistry.runFrame()`: ~line 1310
  - `renderer.render()`: ~line 1340
  - `frameScheduler.tick()`: ~line 1365
  - `requestAnimationFrame()`: ~line 1370

- `Engine/SystemRegistry.js`:
  - `runFrame()`: line 60-95

- `FrameScheduler.js`:
  - `tick()`: line 120-160
  - `register()`: line 85-115

---

**End of Report**