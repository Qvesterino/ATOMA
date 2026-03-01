# WORLD SWITCH LIFECYCLE MAP - COMPREHENSIVE AUDIT

## EXECUTIVE SUMMARY

The ATOMA World Switch system is an **Explicit Hard Reset Architecture** with:
- **Centralized orchestration** in `main.js` (AtomaGame class)
- **Flag-based guards** preventing re-entrant calls
- **Layered cleanup** via FrameScheduler (`simulation`, `background` layers)
- **Selective persistence** (link data survives, visuals rebuild)
- **Try-finally error handling** preventing system lock-up

**Classification:** `PARTIAL_REBUILD` with state persistence
**Risk Level:** `MEDIUM` (synchronous blocking, but reliable error handling)

---

## STEP 1 — WORLD SWITCH ENTRY POINTS

| Entry | File | Function | Guarded? | Async? | Description |
|-------|------|----------|----------|---------|-------------|
| `loadWorld(worldId)` | main.js | `AtomaGame.loadWorld` | YES (`_worldTransitionInProgress`) | NO | Direct API for loading specific world |
| `switchMode()` | main.js | `AtomaGame.switchMode` | NO | NO | Rotates through mode order |
| `switchWorld()` | main.js | `AtomaGame.switchWorld` | NO | NO | Cycles to next world in order |
| `createWorld(reason)` | main.js | `AtomaGame.createWorld` | YES (`_worldTransitionInProgress`) | NO | Core teardown/rebuild orchestrator |
| `init<World>World()` | main.js | `AtomaGame.init<World>World` | NO | NO | Wrapper calling createWorld |

**Guard Mechanism:** `_worldTransitionInProgress` boolean flag
**Cooldown:** None (only re-entrancy prevention)
**Re-entrancy Protection:** Check at start of `createWorld`, reset in `finally` block

---

## STEP 2 — DESTRUCTION MAP

### Scene Graph Cleanup
| Object Type | Removed By | File | Method | Guaranteed? | Notes |
|-------------|------------|------|--------|--------------|-------|
| `worldRoot` Group | `createWorld()` | main.js | `scene.remove(this.worldRoot)` | YES | Explicit removal before null |
| Old World Instance | `createWorld()` | main.js | `activeWorld.dispose()` | PARTIAL | Falls back to manual child disposal |
| Scene children (non-core) | `loadWorld()` | main.js | Filter + `scene.remove()` | YES | Preserves player, lights, worldRoot |
| `worldLightingRoot` | `createWorld()` | main.js | Implicit (worldRoot removal) | YES | Child of worldRoot |

### FrameScheduler Cleanup
| Layer | Reset By | File | Method | Affected Systems |
|-------|-----------|------|--------|------------------|
| `simulation` | `createWorld()` | main.js | `frameScheduler.resetLayer('simulation')` | All simulation-frequency systems |
| `background` | `createWorld()` | main.js | `frameScheduler.resetLayer('background')` | All background systems |
| `visual` | `createWorld()` | main.js | `frameScheduler.resetLayer('visual')` | Visual effects systems |

### NodeLinkingSystem Cleanup
| Object Type | Removed By | File | Method | Guaranteed? |
|-------------|------------|------|--------|--------------|
| Link Group (visuals) | `createWorld()` | NodeLinkingSystem.js | `resetForWorldRebuild()` | YES |
| Link geometries | `resetForWorldRebuild()` | NodeLinkingSystem.js | Traversal + dispose | YES |
| Link materials | `resetForWorldRebuild()` | NodeLinkingSystem.js | dispose | YES |
| `links` array | `resetForWorldRebuild()` | NodeLinkingSystem.js | Clear array | YES |
| `activeLink` ref | `resetForWorldRebuild()` | NodeLinkingSystem.js | Set to null | YES |
| `linksByNode` Map | `resetForWorldSwitch()` | NodeLinkingSystem.js | Clear map | YES |
| `_linkCategoryCache` | `resetForWorldSwitch()` | NodeLinkingSystem.js | Clear cache | YES |
| `_syncState` | `resetForWorldSwitch()` | NodeLinkingSystem.js | Reset to defaults | YES |

### Subsystem Visual Cleanup
| Subsystem | Visuals Removed By | File | Method | Guaranteed? |
|-----------|-------------------|------|--------|--------------|
| GlyphLayer4 | `createWorld()` | main.js | `glyphLayer4.dispose()` | YES |
| WorldFXPack | `createWorld()` | main.js | Parent removal + reset | YES |
| WorldEvents | `createWorld()` | main.js | Parent removal + reset | YES |
| WeatherPack | `createWorld()` | main.js | Parent removal + reset | YES |
| WorldPersonalityController | `createWorld()` | main.js | Root parent change | YES |

**Partial Removal Logic:**
- `activeWorld.dispose()` method may not exist (fallback to manual disposal)
- Some systems (nodes, links) are recreated from scratch rather than disposed

---

## STEP 3 — SURVIVOR MAP

| System | File | Survives Switch? | Intended? | Risk? |
|---------|------|------------------|------------|--------|
| **FrameScheduler Instance** | FrameScheduler.js | YES | YES | LOW - Core timing engine persists |
| **FrameScheduler `realtime` layer** | FrameScheduler.js | YES | YES | LOW - Camera/player systems continue |
| **`this.scene`** | main.js | YES | YES | NONE - Scene container never replaced |
| **`this.player`** | main.js | YES | YES | NONE - Player object persisted |
| **`this.camera`** | main.js | YES | YES | NONE - Camera reference persists |
| **`this.renderer`** | main.js | YES | YES | NONE - WebGL context maintained |
| **`this.linkingSystem`** (instance) | main.js | YES | YES | LOW - Instance survives, internals reset |
| **Link data objects** | NodeLinkingSystem.js | YES | YES | LOW - Network topology preserved |
| **`this.semanticBus`** | main.js | YES | YES | LOW - Event system continues |
| **`this.frameClock`** | main.js | YES | YES | NONE - Timing reference persists |
| **Global timers** | main.js | PARTIAL | UNKNOWN | HIGH - `_sceneAuditTimer` (setInterval) runs forever |
| **requestAnimationFrame loops** | main.js | YES | YES | LOW - Main animation loop never stopped |
| **`__ATOMA_LIVE_METRICS__`** | main.js | YES | YES | NONE - Global metrics persist |
| **`systemRegistry`** | SystemRegistry.js | YES | YES | LOW - Registry persists, systems re-register |

**High-Risk Survivors:**
- `_sceneAuditTimer` - `setInterval` running every 3 seconds, never cleared on switch
- Potential orphaned event listeners (if not registered via `addWorldListener`)

---

## STEP 4 — RE-INITIALIZATION MAP

| Component | File | Recreated Every Switch? | Reuses State? | Notes |
|-----------|------|-----------------------|----------------|-------|
| `worldRoot` | main.js | YES | NO | New `THREE.Group()` each switch |
| `worldLightingRoot` | main.js | YES | NO | New `THREE.Group()` each switch |
| **Environment Setup** | main.js | YES | NO | `setupSigmaRiftEnvironment()` etc. called |
| **Scene Background** | main.js | YES | NO | Reset per environment |
| **Scene Fog** | main.js | YES | NO | Reset per environment |
| **Lights** | main.js | YES | NO | Cleared and recreated |
| **AINodes System** | main.js | YES | NO | New instance each world |
| **Node Meshes** | AINodes.js | YES | NO | Full respawn of nodes |
| **ActiveWorld Instance** | main.js | YES | NO | New SigmaRift/DreamDesert/etc. |
| **Link Visuals** | NodeLinkingSystem.js | YES | PARTIAL | Data objects reused, meshes rebuilt |
| **GlyphLayer4** | main.js | YES | NO | New instance after nodes created |

**Double-Instantiation Risk:**
- LinkingSystem instance survives, but `resetForWorldRebuild()` called
- Risk: Old link visual references could persist if cleanup incomplete
- Mitigation: `createAINodes()` creates fresh node instances, breaking stale references

**Missing Disposal Before Re-create:**
- `worldFXPack`, `worldEvents`, `weatherPack` - root moved but not explicitly disposed
- Visuals may leak if systems don't implement proper `dispose()`

---

## STEP 5 — TIMER & LOOP CLEANUP MAP

| Timer Type | File | Created In | Cleared on Switch? | Potential Leak? | Location |
|------------|------|------------|--------------------|-----------------|----------|
| `setInterval` (scene audit) | main.js | `init()` | **NO** | **HIGH** | `_sceneAuditTimer` |
| `setInterval` (performance) | main.js | `init()` | **NO** | **HIGH** | Unknown timers |
| `setTimeout` (deferred) | main.js | `createAINodes()` | **NO** | MEDIUM | Multiple deferred inits |
| `setTimeout` (debug) | main.js | Various | **NO** | LOW | Debug timers |
| `requestAnimationFrame` | main.js | `animate()` | **NO** (intended) | NONE | Main loop |
| FrameScheduler tick | FrameScheduler.js | `requestAnimationFrame` | **NO** (intended) | NONE | Core loop |

**Leak Detection:**
- `_sceneAuditTimer` runs every 3 seconds indefinitely
- No corresponding `clearInterval(_sceneAuditTimer)` in switch logic
- Timer may access stale `this.worldRoot` references during switch
- Multiple timer accumulations possible if switch called multiple times

---

## STEP 6 — REGISTRY CONSISTENCY MAP

| Registry | Cleared? | File | Method | Risk of Desync? | Notes |
|----------|-----------|------|--------|-----------------|-------|
| **FrameScheduler Systems** | YES | FrameScheduler.js | `resetLayer()` | LOW | Explicit layer reset |
| **SystemRegistry** | PARTIAL | SystemRegistry.js | `unregister()` | MEDIUM | `aiNodes` unregistered, others not explicitly cleared |
| **NodeLinkingSystem.links** | YES | NodeLinkingSystem.js | `resetForWorldRebuild()` | LOW | Array cleared |
| **NodeLinkingSystem.linksByNode** | YES | NodeLinkingSystem.js | `resetForWorldSwitch()` | LOW | Map cleared |
| **NodeLinkingSystem._linkCategoryCache** | YES | NodeLinkingSystem.js | `resetForWorldSwitch()` | LOW | Cache cleared |
| **NodeLinkingSystem._syncState** | YES | NodeLinkingSystem.js | `resetForWorldSwitch()` | LOW | State reset |
| **World Event Disposers** | YES | main.js | `disposeWorldListeners()` | LOW | Explicit disposal |
| **Semantic Event Bus** | NO | main.js | N/A | LOW | Intended persistence |

**Desync Risk:**
- Scene graph and link registries cleared at different times
- Gap between `worldRoot` removal and `resetForWorldRebuild()` call
- Risk: Systems accessing scene during gap may find orphaned references

---

## STEP 7 — WORLD SWITCH FLOW DIAGRAM

```
USER INPUT (Key M/N/Shift+M)
   ↓
setupModeSwitch() [keydown listener]
   ↓
switchMode() OR switchWorld()
   ↓
loadWorld(worldId)
   ↓
🛡️ GUARD: _worldTransitionInProgress = true
   ↓
disposeWorldListeners()
   ├─ Iterate _worldEventDisposers[]
   └─ Remove all registered listeners
   ↓
frameScheduler.resetLayer('simulation')
frameScheduler.resetLayer('background')
   ├─ Unregister all simulation systems
   └─ Unregister all background systems
   ↓
this.scene.remove(this.worldRoot)
   ↓
⚠️ GAP: Stale references possible
   ↓
this.activeWorld.dispose()
   ├─ Call dispose() if exists
   └─ Fallback: Manual child traversal + dispose
   ↓
🔄 STALE REFERENCE RESET:
   ├─ this.aiNodes = null
   └─ this.worldLightingRoot = null
   ↓
this.linkingSystem.resetForWorldRebuild()
   ├─ Detach link.group from scene
   ├─ Dispose geometries/materials
   ├─ Clear links[] array
   └─ Clear activeLink reference
   ↓
this.linkingSystem.resetForWorldSwitch()
   ├─ Clear linksByNode Map
   ├─ Clear _linkCategoryCache
   └─ Reset _syncState
   ↓
🏗️ INFRASTRUCTURE REBUILD:
   ├─ this.worldRoot = new THREE.Group()
   ├─ this.worldLightingRoot = new THREE.Group()
   ├─ this.scene.add(this.worldRoot)
   └─ this.worldRoot.add(this.worldLightingRoot)
   ↓
SUBSYSTEM REATTACH:
   ├─ [worldFXPack, worldEvents, etc].root.parent.remove()
   ├─ sys.resetForWorldSwitch()
   └─ this.worldRoot.add(sys.root)
   ↓
WORLD INSTANTIATION:
   ├─ if (currentMode === 'sigma') → new SigmaRiftChamber()
   ├─ if (currentMode === 'desert') → new DreamDesert()
   ├─ if (currentMode === 'quantum') → new QuantumIsland()
   ├─ if (currentMode === 'fractal') → new FractalValley()
   └─ if (currentMode === 'chamber') → new World()
   ↓
ENVIRONMENT SETUP:
   ├─ setupSigmaRiftEnvironment()
   ├─ OR: setupDreamDesertEnvironment()
   ├─ OR: setupQuantumIslandEnvironment()
   ├─ OR: setupFractalValleyEnvironment()
   └─ OR: setupChamberEnvironment()
   ↓
createAINodes('MAP_SWITCH')
   ├─ this.aiNodes = new AINodes()
   ├─ Register in systemRegistry
   ├─ Initialize spawning
   ├─ Create N nodes
   └─ Enable runtime spawning
   ↓
GLYPH FUSION (deferred):
   └─ this.glyphLayer4.createGlyphFusionsForNodes(this.aiNodes.nodes)
   ↓
SYSTEM REBIND:
   ├─ FrameScheduler systems re-register
   ├─ Node observers attach
   └─ Visual systems connect
   ↓
🎯 SCHEDULER RESUME:
   ├─ frameScheduler.tick() in animate()
   ├─ Simulation layer active
   └─ Background layer active
   ↓
RUNTIME STABILIZATION:
   ├─ FrameClock continues ticking
   ├─ requestAnimationFrame loop persists
   └─ Systems settle into steady state
   ↓
🛡️ GUARD RELEASE: _worldTransitionInProgress = false
   ↓
READY FOR INPUT
```

**Critical Paths Highlighted:**
- ⚠️ GAP: Moment where scene references are stale but systems may still be accessing
- 🔄 STALE REFERENCE RESET: Explicit nulling of `aiNodes`, `worldLightingRoot`
- 🏗️ INFRASTRUCTURE REBUILD: Fresh `THREE.Group` creation prevents contamination
- 🎯 SCHEDULER RESUME: Layer reset ensures clean execution slate

---

## STEP 8 — CROSS-SYSTEM DEPENDENCY MAP

| System | Cached Reference | Invalid After Switch? | Safe? | Dependency Chain |
|---------|-----------------|----------------------|--------|------------------|
| **NodeLinkingSystem** | `links[]` array | NO (cleared) | YES | Reset explicitly |
| **NodeLinkingSystem** | `linksByNode` Map | NO (cleared) | YES | Reset explicitly |
| **WorldEvents** | `this.root` | PARTIAL (reattached) | YES | Root moved, not replaced |
| **WorldPersonalityController** | `this.root` | PARTIAL (reattached) | YES | Root moved, not replaced |
| **HitProxySystem** | Node meshes | YES (invalid) | YES | Nodes recreated, proxies recreated |
| **GlyphLayer4** | Fusion registry | YES (invalid) | YES | Disposed and recreated |
| **SemanticBus** | Event handlers | NO (intended) | YES | Event system persists |
| **MetricsRuntime_v1** | `this.aiNodes` | YES (invalid) | PARTIAL | Reference refreshed in createAINodes |
| **LinkHistoryTracker** | `this.linkingSystem` | NO (instance persists) | YES | Reference valid |
| **LinkCorrelationEngine** | `this.linkingSystem` | NO (instance persists) | YES | Reference valid |
| **Phase5MultiNetworkOrchestrator** | `this.aiNodes` | YES (invalid) | UNKNOWN | May hold stale reference |

**High-Risk Dependencies:**
- Systems holding direct node mesh references become invalid immediately
- Deferred initialization (`setTimeout`) creates risk of accessing partially-built world
- Metrics systems may read from stale `aiNodes` during rebuild window

---

## STEP 9 — ARCHITECTURE CLASSIFICATION

### Final Classification: **PARTIAL REBUILD with STATE PRESERVATION**

**Justification:**

**Cleanup Completeness: MODERATE**
- ✅ Scene graph explicitly cleared
- ✅ Scheduler layers reset
- ✅ Link data structures cleared
- ✅ Visual geometries/materials disposed
- ⚠️ Some systems (WorldFXPack, WorldEvents) not explicitly disposed
- ⚠️ Global timers not cleared

**Timer Hygiene: POOR**
- ❌ `_sceneAuditTimer` never cleared on switch
- ⚠️ No explicit `clearInterval` for any timers
- ✅ requestAnimationFrame loop correctly never stopped

**Registry Coherence: GOOD**
- ✅ FrameScheduler layers reset atomically
- ✅ LinkingSystem registries cleared
- ⚠️ SystemRegistry not explicitly cleared (systems re-register)
- ✅ World event listeners explicitly disposed

**Cross-System References: MANAGED**
- ✅ Explicit stale reference nulling (`aiNodes = null`)
- ✅ Root group replacement breaks reference chains
- ⚠️ Deferred inits create timing window for stale access
- ⚠️ Metrics systems may hold temporary stale references

**Async Safety: CONTROLLED**
- ✅ Re-entrancy guard (`_worldTransitionInProgress`)
- ✅ Try-finally ensures guard always reset
- ❌ No timeout/debounce for rapid switches
- ⚠️ Synchronous blocking causes visible stutter

---

## LEAK & RISK HIGHLIGHTS

### 🔴 CRITICAL RISKS

1. **Timer Leak: `_sceneAuditTimer`**
   - **Issue:** `setInterval` created in `init()` never cleared
   - **Impact:** Accumulating timers, potential stale scene access
   - **Recommendation:** Clear in `disposeWorldListeners()` or before scene removal

2. **Deferred Initialization Window**
   - **Issue:** `setTimeout` calls in `createAINodes()` (100ms, 200ms, 500ms)
   - **Impact:** Systems accessing partially-built world during gap
   - **Recommendation:** Use async/await or explicit state machine

### 🟡 MEDIUM RISKS

3. **Implicit Disposal**
   - **Issue:** Some systems (WorldFXPack) moved but not disposed
   - **Impact:** Potential GPU resource leaks
   - **Recommendation:** Implement strict `IWorldDisposable` interface

4. **No Switch Cooldown**
   - **Issue:** Only re-entrancy guard, no timing guard
   - **Impact:** Rapid spamming could cause instability
   - **Recommendation:** Add 1-2 second cooldown after successful switch

### 🟢 LOW RISKS

5. **Registry Desync Window**
   - **Issue:** Small gap between scene removal and registry reset
   - **Impact:** Minor risk of stale reference access
   - **Recommendation:** Atomic reset pattern (clear scene and registries together)

---

## SYSTEM SUMMARY

**Architecture Type:** Centralized Orchestrated Hard Reset
**Data Persistence:** Partial (link data survives, visuals rebuild)
**State Management:** Flag-based guard + explicit cleanup
**Error Handling:** Robust (try-finally always releases guard)
**Performance:** Synchronous blocking (expected stutter on switch)
**Memory Safety:** Moderate (disposal patterns vary by system)
**Timer Hygiene:** Poor (global timers not cleared)
**Overall Reliability:** HIGH (guards prevent broken states)

**Risk Profile:** `MEDIUM` - Reliable but has timer leak and async timing risks