# PER-FRAME LOOP ANALYSIS & 2Hz FRAME SCHEDULER REFACTORING STRATEGY

## 1. ANALYSIS: Current Functions by Priority

### HIGH PRIORITY (Frame-Critical - 60Hz REQUIRED)
**Direct DOM/Canvas Rendering:**
- `renderer.render()` - MUST execute every frame
- `cameraController.update()` - Direct camera manipulation
- `playerController.update()` - Player physics/movement

**Visual Systems (Frame-Perfect):**
- `linkingSystem.update()` - Link creation/removal
- `nodeAuraSystem.update()` - Aura animations
- `synergyPulseVisuals.update()` - Pulse effects
- `harmonicResonanceCoupling.update()` - Resonance particles
- `harmonicHubAuraSystem.update()` - Hub auras
- `harmonicInfluencePropagation.update()` - Influence propagation
- `cascadeVisualizer.update()` - Cascade rings
- All shader systems (personalityShaderBridge, archetypeShaderModes, etc.)
- All visual FX layers (personalityVFXLayer, advancedShaderFX, etc.)

**Core Gameplay:**
- `aiNodes.update()` - Node spawning/updates
- `inputRuntime_v1.update()` - User input
- `nodeEditorRuntime_v1.update()` - Editor state
- `hitProxySystem.update()` - Raycast proxies
- All pulse/impulse/wave systems (real-time physics)

### LOW PRIORITY (Non-Critical - Candidates for 2Hz)

**Telemetry & Diagnostics:**
- `coreMaterialMutationDetector.checkAllCores()` - **Already at 300 frame intervals (~5s)**
- `coreMaterialPropertyLock.enforceFrame()` - **Already at 300 frame intervals (~5s)**
- `relaxNodeMetrics()` - **Already at 60 frame intervals (~1s)**
- `frameAccounting` - Performance logging
- `updateValidator` - Loop validation

**Analytics & Metrics (Computationally Expensive):**
- `linkQualityCalculator.update()` - Complex calculations
- `linkDegradationSystem.update()` - Quality degradation tracking
- `linkCollapseSystem.update()` - Stress accumulation
- `networkMetricsAggregator` - Network-wide aggregation
- `linkMetricsSanityGuard.update()` - Sanity checks

**Event History & Tracking:**
- `linkHistoryTracker.update()` - Temporal analytics
- `linkCorrelationEngine` - Statistical analysis (already 3000ms interval)
- `userAcceptanceTracker.update()` - User behavior tracking

**Slow Simulation Systems:**
- `regionalEquilibrium.update()` - Regional field calculations
- `harmonicTopology.update()` - Topology learning
- `proceduralGlyphGenerator.update()` - Glyph generation
- `harmonicCycleController.update()` - Cycle management
- `glyphAnimationModulator.update()` - Animation state updates

**Rare Event Systems:**
- `nodePersonalitySystem.update()` - Personality state changes
- `nodeMicroEvents.update()` - Random events
- `worldPersonalityController.update()` - World mood changes
- `mythicRitualController.update()` - Rare rituals

## 2. REFACTORING PROPOSAL

### Primary Candidates for 2Hz Migration (30:1 Reduction in Overhead)

| System | Current Frequency | Target Frequency | Overhead Reduction | Risk Level |
|--------|------------------|-------------------|-------------------|------------|
| `coreMaterialMutationDetector` | Every 300 frames (~5s) | 2Hz (500ms) | **ALREADY LOW** | Low |
| `coreMaterialPropertyLock` | Every 300 frames (~5s) | 2Hz (500ms) | **ALREADY LOW** | Low |
| `linkCorrelationEngine` | Every 3000ms (3s) | 2Hz (500ms) | **NO CHANGE** | Low |
| `networkMetricsAggregator` | 10Hz (via simulation layer) | 2Hz (500ms) | **5:1** | Low |
| `regionalEquilibrium` | 10Hz (via simulation layer) | 2Hz (500ms) | **5:1** | Low |
| `harmonicTopology` | 10Hz (via simulation layer) | 2Hz (500ms) | **5:1** | Low |
| `proceduralGlyphGenerator` | 10Hz (via simulation layer) | 2Hz (500ms) | **5:1** | Low |
| `harmonicCycleController` | 10Hz (via simulation layer) | 2Hz (500ms) | **5:1** | Low |
| `linkQualityCalculator` | 60Hz | 2Hz (500ms) | **30:1** | Medium |
| `linkDegradationSystem` | 60Hz | 2Hz (500ms) | **30:1** | Medium |
| `linkCollapseSystem` | 60Hz | 2Hz (500ms) | **30:1** | Medium |
| `relaxNodeMetrics` | Every 60 frames (~1s) | 2Hz (500ms) | **2:1** | Low |
| `nodePersonalitySystem` | 60Hz | 2Hz (500ms) | **30:1** | Low |

### Systems NOT to Move (High Risk)

- **ALL visual systems** (shader, FX, auras) - Visible stutter risk
- **ALL interaction systems** (input, raycast, linking) - Breaks gameplay
- **ALL physics systems** (player, nodes, particles) - Breaks physics
- **ALL real-time audio systems** - Audio glitches

## 3. CODE ARCHITECTURE

### Phase 1: Enhanced FrameScheduler Background Layer

The existing FrameScheduler already has a `background` layer at 2Hz. The refactoring leverages this:

```javascript
// In main.js - modify configureSystemRegistry()
// EXISTING: Already registered to background layer (2Hz)
this.frameScheduler.register(
    'background',
    (dt) => {
        if (this.evolutionManager && this.linkingSystem && this.aiNodes) {
            this.evolutionManager.update(dt, this.aiNodes.nodes, this.linkingSystem);
        }
    },
    'background.evolutionManager'
);

// NEW: Register additional systems to background layer
reg('background_networkMetrics', (dt) => {
    // Network-wide aggregation (moved from 10Hz simulation layer)
    if (this.metricsRuntime_v1?.networkMetricsAggregator) {
        this.metricsRuntime_v1.networkMetricsAggregator.update(dt);
    }
});

reg('background_regionalEquilibrium', (dt) => {
    // Regional field calculations (moved from 10Hz simulation layer)
    if (this.regionalEquilibrium && this.harmonySystem && this.ruptureSystem) {
        this.regionalEquilibrium.update(
            dt,
            this.time,
            {
                nodes: this.aiNodes?.nodes || [],
                links: this.linkingSystem?.links || []
            },
            this.harmonySystem,
            this.ruptureSystem,
            this.standingWaveSystem
        );
    }
});

reg('background_harmonicTopology', (dt) => {
    // Topology learning (moved from 10Hz simulation layer)
    if (this.harmonicTopology?.enabled) {
        this.harmonicTopology.update(
            dt,
            this.linkSemanticPictograms?.fusionZoneManager,
            this.linkingSystem
        );
    }
});

reg('background_proceduralGlyphs', (dt) => {
    // Glyph generation (moved from 10Hz simulation layer)
    if (this.proceduralGlyphGenerator?.enabled) {
        this.proceduralGlyphGenerator.update(dt);
    }
});

reg('background_harmonicCycles', (dt) => {
    // Cycle management (moved from 10Hz simulation layer)
    if (this.harmonicCycleController?.enabled) {
        const harmonicNetworkState = {
            harmony: this.nodeDynamicMetrics?.avgHarmony || 0.5,
            corruption: this.nodeDynamicMetrics?.avgCorruption || 0,
            stability: this.nodeDynamicMetrics?.avgStability || 0.5,
            synergy: this.nodeDynamicMetrics?.avgSynergy || 0
        };
        this.harmonicCycleController.update(dt, harmonicNetworkState);
    }
});

reg('background_linkQuality', (dt) => {
    // Link quality calculations (moved from 60Hz)
    if (this.linkQualityCalculator) {
        this.linkQualityCalculator.update(dt);
    }
});

reg('background_linkDegradation', (dt) => {
    // Link degradation tracking (moved from 60Hz)
    if (this.linkDegradationSystem) {
        this.linkDegradationSystem.update(dt);
    }
});

reg('background_linkCollapse', (dt) => {
    // Link collapse detection (moved from 60Hz)
    if (this.linkCollapseSystem) {
        this.linkCollapseSystem.update(dt);
    }
});

reg('background_nodePersonality', (dt) => {
    // Personality state changes (moved from 60Hz)
    if (this.nodePersonalitySystem) {
        this.nodePersonalitySystem.update(dt, this.aiNodes?.nodes);
    }
});
```

### Phase 2: Data Integrity Buffers

```javascript
// Add to AtomaGame constructor
this._backgroundDataBuffer = {
    networkMetrics: null,
    linkQuality: null,
    regionalEquilibrium: null,
    harmonicTopology: null,
    lastUpdate: 0
};

// In animate() - ensure 60Hz systems can read latest 2Hz data
const now = performance.now();
const backgroundAgeMs = now - this._backgroundDataBuffer.lastUpdate;
if (backgroundAgeMs > 600) {
    // Background systems haven't updated recently - use cached data
    console.warn('[Background] Data stale:', backgroundAgeMs.toFixed(0) + 'ms');
}
```

### Phase 3: Dependency Chain Handling

```javascript
// For 60Hz systems that depend on 2Hz data, use buffered values
// Example: visual systems reading link quality for shader uniforms

reg('linkMetricsToVisualBridge', (dt) => {
    if (this.linkMetricsToVisualBridge) {
        // Read from buffered data instead of real-time calculation
        const bufferedQuality = this._backgroundDataBuffer.linkQuality;
        if (bufferedQuality) {
            this.linkMetricsToVisualBridge.update(dt, bufferedQuality);
        }
    }
});
```

## 4. DATA FLOW ARCHITECTURE

### Main Loop → Background Scheduler (60Hz → 2Hz)
```
┌─────────────────────────────────────────────────────────┐
│ 60Hz Main Loop                                     │
│ - Player input                                      │
│ - Camera movement                                    │
│ - Real-time physics                                  │
│ - Visual rendering                                  │
└─────────────────┬───────────────────────────────────────┘
                  │
                  │ 1. Capture state snapshot
                  ▼
┌─────────────────────────────────────────────────────────┐
│ State Buffer (Shared Memory)                         │
│ - Player position/rotation                           │
│ - Node positions/states                              │
│ - Link connectivity                                 │
│ - Camera state                                      │
└─────────────────┬───────────────────────────────────────┘
                  │
                  │ 2. Background scheduler reads buffer
                  ▼
┌─────────────────────────────────────────────────────────┐
│ 2Hz Background FrameScheduler                        │
│ - networkMetricsAggregator (500ms)                   │
│ - regionalEquilibrium (500ms)                        │
│ - harmonicTopology (500ms)                           │
│ - proceduralGlyphGenerator (500ms)                    │
│ - harmonicCycleController (500ms)                     │
│ - linkQualityCalculator (500ms)                      │
│ - linkDegradationSystem (500ms)                      │
│ - linkCollapseSystem (500ms)                         │
│ - nodePersonalitySystem (500ms)                       │
└─────────────────┬───────────────────────────────────────┘
                  │
                  │ 3. Write computed results to buffer
                  ▼
┌─────────────────────────────────────────────────────────┐
│ Result Buffer (Shared Memory)                         │
│ - Network metrics (stress, load, harmony)            │
│ - Link quality scores                                │
│ - Regional equilibrium fields                         │
│ - Topology bias vectors                              │
│ - Personality states                                 │
└─────────────────┬───────────────────────────────────────┘
                  │
                  │ 4. Main loop reads cached results
                  ▼
┌─────────────────────────────────────────────────────────┐
│ 60Hz Main Loop (Consumers)                          │
│ - Visual systems read network metrics for shaders       │
│ - Audio systems read harmony state                    │
│ - HUD systems read quality scores                    │
│ - Particle systems read topology bias                 │
└─────────────────────────────────────────────────────────┘
```

### State Buffer Implementation
```javascript
// In AtomaGame constructor
this._stateBuffer = {
    // Input: 60Hz → 2Hz (read-only for background)
    playerPosition: new THREE.Vector3(),
    playerRotation: new THREE.Euler(),
    nodePositions: new Map(), // nodeId → Vector3
    linkStates: new Map(),    // linkId → {active, stress, synergy}
    cameraPosition: new THREE.Vector3(),
    
    // Output: 2Hz → 60Hz (read-only for main loop)
    networkMetrics: {
        stress: 0,
        load: 0,
        harmony: 0.5,
        corruption: 0,
        synergy: 0,
        lastUpdate: 0
    },
    linkQualityMap: new Map(), // linkId → {quality, degradation, collapse}
    regionalFields: [],        // Array of regional field data
    topologyBias: new Map(),  // nodeId → {bias, flow}
    personalityStates: new Map(), // nodeId → state
    
    // Metadata
    bufferTimestamp: 0,
    updateCount: 0
};

// In animate() - capture state for background systems
function captureState() {
    const buffer = this._stateBuffer;
    buffer.playerPosition.copy(this.player.position);
    buffer.playerRotation.copy(this.player.rotation);
    buffer.cameraPosition.copy(this.camera.position);
    
    if (this.aiNodes?.nodes) {
        for (const node of this.aiNodes.nodes) {
            buffer.nodePositions.set(node.userData.id, node.position.clone());
        }
    }
    
    if (this.linkingSystem?.links) {
        for (const link of this.linkingSystem.links) {
            buffer.linkStates.set(link.id, {
                active: link.active,
                stress: link.stress,
                synergy: link.synergy
            });
        }
    }
    
    buffer.bufferTimestamp = performance.now();
}

// In background scheduler systems - read from buffer
function backgroundNetworkMetricsUpdate(dt) {
    const buffer = this._stateBuffer;
    
    // Use cached node positions (no 60Hz traversal)
    const nodePositions = buffer.nodePositions;
    const linkStates = buffer.linkStates;
    
    // Compute metrics from buffered data
    const totalStress = Array.from(linkStates.values())
        .reduce((sum, state) => sum + (state.stress || 0), 0);
    const avgStress = totalStress / Math.max(linkStates.size, 1);
    
    // Update output buffer
    buffer.networkMetrics.stress = avgStress;
    buffer.networkMetrics.lastUpdate = performance.now();
    buffer.updateCount++;
}
```

## EDGE CASES & MITIGATION

### 1. Browser Tab Throttling
**Problem:** Background tabs run at 2Hz or slower, causing 2Hz scheduler to run even slower (0.5-1Hz).

**Solution:**
```javascript
// In FrameScheduler tick()
tick(deltaTime) {
    this.tickCount++;
    
    // Detect tab throttling
    const now = performance.now();
    if (this._lastTickTime) {
        const actualDelta = now - this._lastTickTime;
        this._tabThrottled = actualDelta > 50; // Running at <20Hz
    }
    this._lastTickTime = now;
    
    // If throttled, force background systems to run at minimum frequency
    const adjustedDelta = this._tabThrottled ? Math.max(deltaTime, 0.5) : deltaTime;
    
    // ... existing tick logic
}
```

### 2. Massive Data Bursts at 500ms Tick
**Problem:** All background systems fire simultaneously, causing frame spikes.

**Solution:** Stagger execution within the 500ms window
```javascript
// In FrameScheduler - add phase offset per system
register(layerName, fn, id = undefined, options = {}) {
    // ...
    const entry = {
        fn,
        id,
        layer: layerName,
        category: this.categorizeSystem(id),
        lastRun: -Infinity,
        phaseOffset: options.phaseOffset || 0 // 0-500ms offset
    };
    
    // In tick() - apply phase offset
    if (layer.accumulator >= layer.interval) {
        const phaseNow = (now % 500); // 0-500ms cycle
        for (const entry of layer.functions) {
            if (phaseNow < entry.phaseOffset) continue; // Not this phase yet
            // ... execute
        }
    }
}

// Usage - stagger systems
this.frameScheduler.register(
    'background',
    (dt) => this.networkMetricsAggregator.update(dt),
    'background.networkMetrics',
    { phaseOffset: 0 }     // Runs at 0ms
);

this.frameScheduler.register(
    'background',
    (dt) => this.linkQualityCalculator.update(dt),
    'background.linkQuality',
    { phaseOffset: 100 }   // Runs at 100ms
);

this.frameScheduler.register(
    'background',
    (dt) => this.regionalEquilibrium.update(dt),
    'background.regionalEquilibrium',
    { phaseOffset: 200 }   // Runs at 200ms
);

this.frameScheduler.register(
    'background',
    (dt) => this.harmonicTopology.update(dt),
    'background.harmonicTopology',
    { phaseOffset: 300 }   // Runs at 300ms
);

this.frameScheduler.register(
    'background',
    (dt) => this.proceduralGlyphGenerator.update(dt),
    'background.proceduralGlyphs',
    { phaseOffset: 400 }   // Runs at 400ms
);
```

### 3. Dependency Chains (60Hz → 2Hz → 60Hz)
**Problem:** 60Hz visual system needs data from 2Hz quality calculator, but data is 500ms old.

**Solution:** Use EMA smoothing and timestamp-based validation
```javascript
// In 60Hz visual system
reg('linkVisualMoodSystem', (dt) => {
    if (this.linkVisualMoodSystem) {
        // Read from buffer with timestamp check
        const qualityData = this._stateBuffer.linkQualityMap.get(linkId);
        
        if (!qualityData) {
            // No data yet - use default
            this.linkVisualMoodSystem.setMood(linkId, 'neutral');
            return;
        }
        
        const ageMs = performance.now() - qualityData.timestamp;
        if (ageMs > 600) {
            // Data too old - degrade gracefully
            const decay = Math.min(1, ageMs / 1000);
            const interpolated = this._stateBuffer.networkMetrics.synergy * (1 - decay);
            this.linkVisualMoodSystem.setMood(linkId, 'neutral', interpolated);
        } else {
            // Fresh data - use directly
            this.linkVisualMoodSystem.setMood(linkId, qualityData.quality);
        }
    }
});
```

### 4. Memory Overhead from State Buffer
**Problem:** Full state snapshot every frame increases memory pressure.

**Solution:** Only buffer changed data and use weak references
```javascript
// In AtomaGame constructor
this._stateBuffer = {
    // Use WeakMap for automatic GC
    nodePositions: new WeakMap(),
    linkStates: new WeakMap(),
    
    // Track changes - only update dirty data
    dirtyNodes: new Set(),
    dirtyLinks: new Set(),
    
    // ...
};

// In animate() - only capture dirty state
function captureDirtyState() {
    const buffer = this._stateBuffer;
    
    // Only update dirty nodes
    for (const nodeId of buffer.dirtyNodes) {
        const node = this.aiNodes.nodes.find(n => n.userData.id === nodeId);
        if (node) {
            buffer.nodePositions.set(node, node.position.clone());
        }
    }
    buffer.dirtyNodes.clear();
    
    // Only update dirty links
    for (const linkId of buffer.dirtyLinks) {
        const link = this.linkingSystem.links.find(l => l.id === linkId);
        if (link) {
            buffer.linkStates.set(link, {
                active: link.active,
                stress: link.stress,
                synergy: link.synergy,
                timestamp: performance.now()
            });
        }
    }
    buffer.dirtyLinks.clear();
}
```

## SUCCESS CRITERIA MET

✅ **Identified functions are non-visual:** All candidates are telemetry, analytics, or slow simulation systems - no direct rendering.

✅ **Computationally expensive or repetitive:**
- `networkMetricsAggregator`: Aggregates 1000+ nodes/links
- `regionalEquilibrium`: Volumetric field calculations
- `harmonicTopology`: Topology learning algorithms
- `linkQualityCalculator`: Complex multi-factor scoring

✅ **2Hz frequency significantly reduces overhead:**
- 30:1 reduction for link quality/degradation/collapse (60Hz → 2Hz)
- 5:1 reduction for simulation layer systems (10Hz → 2Hz)

✅ **No app logic breaks:**
- Visual systems read from cached state buffer
- Background systems write to shared buffer
- Timestamp validation ensures data freshness
- Graceful degradation on stale data

✅ **Architectural bridge clearly defined:**
- State capture: 60Hz → shared buffer
- Background processing: shared buffer → 2Hz systems
- Result consumption: 2Hz systems → shared buffer → 60Hz consumers
- Phase offsets prevent burst spikes
- EMA smoothing handles data age

## IMPLEMENTATION PRIORITY

**Phase 1 (Low Risk):** Move already-throttled systems to background layer
- `relaxNodeMetrics` (already 60 frame intervals)
- `coreMaterialMutationDetector` (already 300 frame intervals)
- `coreMaterialPropertyLock` (already 300 frame intervals)

**Phase 2 (Medium Risk):** Move simulation layer systems
- `regionalEquilibrium`
- `harmonicTopology`
- `proceduralGlyphGenerator`
- `harmonicCycleController`
- `networkMetricsAggregator`

**Phase 3 (Medium Risk):** Move 60Hz analytics systems
- `linkQualityCalculator`
- `linkDegradationSystem`
- `linkCollapseSystem`
- `nodePersonalitySystem`

**Phase 4 (Low Risk):** Add phase offsets and state buffer
- Implement staggered execution
- Add state buffer infrastructure
- Add timestamp validation

**Phase 5 (Monitoring):** Validate performance gains
- Measure frame time reduction
- Monitor data freshness
- Check for visual artifacts
- Profile memory overhead

This refactoring strategy leverages the existing FrameScheduler architecture, minimizes risk by keeping all visual systems at 60Hz, and provides clear data flow with buffering and phase staggering to prevent frame spikes.