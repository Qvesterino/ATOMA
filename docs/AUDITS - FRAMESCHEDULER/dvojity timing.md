I have completed the ATOMA Timing Architecture Audit and generated a comprehensive refactoring plan to consolidate timing mechanisms into a single authoritative source.

## Audit Summary

**Primary Clock:** `THREE.Clock` in `AtomaGame` (authoritative frame time).
**Current Weakness:** Manual cadence accumulators (`semanticVisualAcc`, `semanticSlowAcc`) duplicate `FrameScheduler` layer logic, creating potential desync.
**Current Conflict Risk:** Direct calls to `system.update()` in `animate()` AND via `SystemRegistry.runFrame()` could cause double execution.
**Recommendation:** Enforce `FrameScheduler` as the SOLE path for all frame-level updates, removing manual accumulators and direct calls.

## Refactoring Plan

### Step 1: Simplify Clock

- Keep `this.clock` as the ONLY delta time source.
- Remove manual clamping (`Math.min(..., 0.1)`) unless necessary for physics stability; if kept, do it once.
- Remove `FrameClock` dependency from game logic (keep only for `FrameScheduler` latency tracking).

### Step 2: Centralize Shader Time

- Create a single `updateShaderTime(deltaTime)` method.
- This updates `this.time`, `VisualTime.delta`, and `VisualTime.now`.
- Call this method EXACTLY ONCE per frame, immediately after delta calculation.

### Step 3: Consolidate Cadence Control

- REMOVE manual accumulators (`semanticVisualAcc`, `semanticSlowAcc`).
- MOVE all systems dependent on manual cadence into `FrameScheduler` layers:
  - `visual` layer (30Hz): `nodeVisuals4`, `synergyPulseVisuals`, `coreMetricsOverlay`.
  - `simulation` layer (10Hz): `linkCorrelationEngine`, `synergyChainReaction`, `temporalUnitSystem`.

### Step 4: Enforce FrameScheduler Monopoly

- PROHIBIT direct calls to `system.update(dt)` inside `animate()`.
- ALL frame-level updates MUST go through `FrameScheduler.tick(deltaTime)`.
- `SystemRegistry.runFrame()` is the only entry point for registered systems.

### Step 5: Integrate Authority Guard

- `VisualAuthorityLock` should act as a PRE-CONDITION before `FrameScheduler.tick()`.
- If authority blocks visual updates, pass `{ skipVisual: true }` to `FrameScheduler.tick()`.

### Step 6: Keep Event Bus Independent

- `SemanticEventBus.drain()` remains independent of `deltaTime`.
- Continue using `performance.now()` for event timestamps.

## Optimized Code Implementation

### 1. Refactored `animate()` Loop

Location: `AtomaGame` class

```javascript
animate() {
    requestAnimationFrame(() => this.animate());

    // ============================================================
    // 1. Compute Delta Time (Single Source)
    // ============================================================
    // Remove clamping to 0.1 unless specifically required for physics
    const deltaTime = this.clock.getDelta(); 
    // (Optional: const deltaTime = Math.min(this.clock.getDelta(), 0.1);)

    // ============================================================
    // 2. Update Game & Visual Time
    // ============================================================
    this.time += deltaTime;

    // INFRA-ONLY Visual Time (Canonical source for shaders)
    VisualTime.delta = deltaTime;
    VisualTime.now = this.time;

    // ============================================================
    // 3. FrameScheduler Tick (Consolidated Execution)
    // ============================================================
    // Enforce FrameScheduler as the SOLE path for frame-level updates
    if (this.hardInteractionAuthority && !this.hardInteractionAuthority.isVisualAllowed()) {
        // Skip visual layer, allow simulation/background to run
        this.frameScheduler.tick(deltaTime, { skipVisual: true });
    } else {
        // Normal execution: all registered systems run based on their layer's frequency
        this.frameScheduler.tick(deltaTime);
    }

    // ============================================================
    // 4. Semantic Event Bus (Independent)
    // ============================================================
    // Independent event processing with its own budgets
    this.semanticBus.drain(0.8, 48);

    // ============================================================
    // 5. Render (Single Call)
    // ============================================================
    // Moved to PostProcessing or direct call; ensure only called once per frame
    // (Handled by FrameScheduler 'visual' layer in your current architecture)
}
```

### 2. Consolidated `FrameScheduler` Registration

Location: `AtomaGame.configureSystemRegistry()` or new `configureFrameScheduler()`

```javascript
configureFrameScheduler() {
    // ============================================================
    // REALTIME LAYER (60Hz)
    // ============================================================
    this.frameScheduler.register('realtime', (dt) => {
        // Camera Control (60Hz)
        this.cameraController.update(dt);
    }, 'realtime.cameraController');

    this.frameScheduler.register('realtime', (dt) => {
        // Player Control (60Hz)
        this.playerController.update(dt);
    }, 'realtime.playerController');

    // ============================================================
    // VISUAL LAYER (30Hz) - Replaces manual semanticVisualAcc
    // ============================================================
    this.frameScheduler.register('visual', (dt) => {
        // Node Visuals 4.0 (30Hz)
        this.nodeVisuals4?.update(dt);

        // Synergy Pulse Visuals (30Hz)
        this.synergyPulseVisuals?.update(dt);

        // Harmonic Resonance Coupling (30Hz)
        this.harmonicResonanceCoupling?.update(dt);

        // Core Metrics Overlay (30Hz)
        this.coreMetricsOverlay?.update(dt);
    }, 'visual.semanticVisual');

    // ============================================================
    // SIMULATION LAYER (10Hz) - Replaces manual semanticSlowAcc
    // ============================================================
    this.frameScheduler.register('simulation', (dt) => {
        // Link Correlation Engine (10Hz)
        this.linkCorrelationEngine?.update(dt);

        // Link History Tracker (10Hz)
        this.linkHistoryTracker?.update(dt);

        // Link Quality Calculator (10Hz)
        this.linkQualityCalculator?.update(dt);

        // Link Degradation System (10Hz)
        this.linkDegradationSystem?.update(dt);

        // Synergy Chain Reaction (10Hz)
        this.synergyChainReaction?.update(dt);
    }, 'simulation.linkMetrics');

    // ============================================================
    // BACKGROUND LAYER (2Hz)
    // ============================================================
    this.frameScheduler.register('background', (dt) => {
        // Weather Pack (2Hz)
        this.weatherPack?.update(dt);

        // World Events (2Hz)
        this.worldEvents?.update(dt);
    }, 'background.weather');
}
```

### 3. Helper Method: `updateShaderTime`

Location: `AtomaGame` class (New Method)

```javascript
/**
 * Centralized Game & Visual Time Update
 * Called once per frame in animate()
 * 
 * Updates:
 * - `this.time`: Game elapsed time (seconds)
 * - `VisualTime.delta`: Canonical visual frame delta (INFRA-ONLY)
 * - `VisualTime.now`: Canonical visual elapsed time (INFRA-ONLY)
 */
updateShaderTime(deltaTime) {
    this.time += deltaTime;

    // Update VisualTime (Read-Only Infrastructure)
    VisualTime.delta = deltaTime;
    VisualTime.now = this.time;
}
```

### 4. Cleaned up `animate()` (Alternative Version)

If you need to keep the clamping or other logic:

```javascript
animate() {
    requestAnimationFrame(() => this.animate());

    // 1. Delta Time
    const deltaTime = Math.min(this.clock.getDelta(), 0.1);
    const deltaTimeMs = deltaTime * 1000;

    // 2. Update Time
    this.updateShaderTime(deltaTime); // Centralizes all time updates

    // 3. FrameScheduler (Unified)
    this.frameScheduler.tick(deltaTime);

    // 4. Independent Systems
    this.semanticBus.drain(0.8, 48);

    // 5. Render
    // (Called via FrameScheduler 'visual' or explicitly if not using post-processing)
}
```
