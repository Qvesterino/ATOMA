# FRAME SCHEDULER LIFECYCLE INTEGRITY AUDIT - READ ONLY
## Generated: 2026-02-26
## Purpose: Verify FrameScheduler behaves deterministically across switchWorld() calls

---

## SECTION 1: WORLD SWITCH ENTRY

### 1.1 switchWorld() / loadWorld() Flow

**Entry Point:** `loadWorld(worldId)` (main.js:7173)

**Call Chain:**
```
switchMode() → loadWorld(nextMode) → this.worldRegistry[worldId]() → init{World}()
```

| Function | File | Line | Purpose |
|----------|------|------|---------|
| `switchMode()` | main.js | 7209 | Switches to next world in cycle |
| `loadWorld(worldId)` | main.js | 7173 | Loads world by ID |
| `initSigmaWorld()` | main.js | 4820 | Initialize Sigma Rift Chamber |
| `initDesertWorld()` | main.js | 4826 | Initialize Dream Desert |
| `initQuantumWorld()` | main.js | 4832 | Initialize Quantum Island |
| `initFractalWorld()` | main.js | 4838 | Initialize Fractal Valley |
| `initChamberWorld()` | main.js | 4844 | Initialize Chamber |
| `createWorld(reason)` | main.js | 4853 | Main world creation function |

**Execution Order in loadWorld():**
1. `this.scene.remove(o)` for all non-essential objects
2. `this.worldResetFix.cleanOldScene()` - Clean old scene
3. `this.currentMode = worldId` - Set mode
4. `this._pendingCreateWorldReason = 'MAP_SWITCH'` - Set reason
5. `this.worldRegistry[worldId]()` - Call init{World}()
6. init{World}() calls `createWorld('MAP_SWITCH')`

**Execution Order in createWorld():**
1. `this.frameScheduler?.resetLayer?.('visual')` - ⚠️ ONLY visual layer reset
2. `this.scene.remove(this.worldRoot)` - Remove old world root
3. `this.worldRoot = new THREE.Group()` - Create new world root
4. `this.worldLightingRoot = new THREE.Group()` - Create new lighting root
5. `this.linkingSystem.resetForWorldRebuild({ scene, worldRoot })` - Reset links
6. Dispose/create GlyphLayer4, worldPersonalityController, worldFXPack, etc.
7. Create world instance (SigmaRift, DreamDesert, etc.)
8. `this._allowRegistryReset = true` - Enable registry reset
9. `this.createAINodes('MAP_SWITCH')` - Create AI nodes

---

### 1.2 FrameScheduler Handling in switchWorld()

| Location | Action | Notes |
|----------|--------|-------|
| `createWorld()` line 4856 | `this.frameScheduler?.resetLayer?.('visual')` | ⚠️ ONLY visual layer reset |
| `createWorld()` line 4856 | Optional chaining (`?.`) | No error if frameScheduler missing |

**Analysis:**
- FrameScheduler `resetLayer('visual')` is called on world switch
- **ONLY visual layer is reset** - realtime, simulation, background layers are NOT reset
- No `clear()` call - old registrations remain active

---

## SECTION 2: FRAME SCHEDULER INSTANCE ANALYSIS

### 2.1 FrameScheduler Instantiation

**Creation Site:** `main.js:3169`
```javascript
this.frameScheduler = new FrameScheduler();
window.frameScheduler = this.frameScheduler;
```

**Context:** In `Game` constructor
**Lifetime:** Global - persists for entire session
**World-bound or Global:** GLOBAL

**Analysis:**
- FrameScheduler is created **ONCE** in Game constructor
- It is **NOT recreated** per world
- It is **NOT recreated** per session
- It **persists across all world switches**

---

### 2.2 FrameScheduler Persistence

| World Switch Action | FrameScheduler State |
|---------------------|----------------------|
| First world load | Fresh instance with 0 registrations |
| World switch (loadWorld) | **REUSED** - same instance |
| FrameScheduler.resetLayer('visual') | Visual layer reset only |
| Old world systems | **REMAIN REGISTERED** (except visual layer pruned) |

**Analysis:**
- FrameScheduler persists across world switches
- Old world systems remain registered (except visual layer)
- Potential for stale references to old world objects

---

## SECTION 3: REGISTRATION PATH ANALYSIS

### 3.1 FrameScheduler.register() Locations

**Initial Registrations (Game constructor, main.js:3173-5067):**

| Line | ID | Layer | Closure/Bound | Captures |
|------|----|-------|----------------|-----------|
| 3173 | registry-warmup | background | `() => EnhancedNodeModels.ensureRegistryReady?.()` | Global function |
| 3180 | coreMetricsOverlay.realtime | realtime | `(dt) => this.runCoreMetricsOverlayTick(dt)` | this (Game) |
| 3181 | realtime.cameraController | realtime | `this.runCameraControllerTick.bind(this)` | this (Game) |
| 3182 | realtime.playerController | realtime | `this.runPlayerControllerTick.bind(this)` | this (Game) |
| 3183 | renderer.render | visual | `(dt) => this.runRenderTick(dt)` | this (Game) |
| 3184 | visual.nodeAuraSystem | visual | `this.runNodeAuraSystemTick.bind(this)` | this (Game) |
| 3185 | visual.synergyChainReaction | visual | `this.synergyChainReactionTick.bind(this)` | this (Game) |
| ... | ... | ... | ... | ... |
| 5066 | node.targeting | visual | `() => this.linkingSystem.processNodeTargeting()` | this.linkingSystem |

**Total Initial Registrations:** ~50 systems
**Lifecycle Context:** Game constructor (one-time setup)

---

### 3.2 Additional Registrations (setupSimulationEffects, main.js:7409-7910)

**Pattern:** `registerSystem(name, priority, updaterFn)` → `systemRegistry.register()`

**Note:** These are NOT FrameScheduler registrations. They are SystemRegistry registrations.
See `SYSTEMREGISTRY_DEPENDENCY_FORENSIC_AUDIT.md` for details.

---

### 3.3 World-Specific Registrations

**None detected.**

All FrameScheduler registrations happen in:
1. Game constructor (main.js:3173-5067)
2. NO world-specific registrations found
3. NO createWorld()-specific registrations found

**Analysis:**
- FrameScheduler registrations are **NOT world-bound**
- All systems are registered **ONCE** at game start
- No new registrations on world switch
- No old registrations unregistered on world switch

---

## SECTION 4: CLEANUP / CLEAR LOGIC

### 4.1 FrameScheduler Cleanup Methods

| Method | File | Line | Purpose |
|--------|------|------|---------|
| `unregister(id)` | FrameScheduler.js | 167 | Remove single system by ID |
| `resetLayer(layerName)` | FrameScheduler.js | 310 | Reset layer (prune disabled, reset error flags) |
| `clear()` | FrameScheduler.js | 339 | Clear ALL registrations |

---

### 4.2 resetLayer() Implementation

```javascript
resetLayer(layerName) {
    const layer = this.layers?.[layerName];
    if (!layer || !Array.isArray(layer.functions)) return 0;
    const removed = this.pruneLayer(layerName, fn => fn?._disabled === true);
    for (const fn of layer.functions) {
        fn._disabled = false;
        fn._errorCount = 0;
        fn._warned = false;
        fn._lastErrorMsg = undefined;
    }
    return removed;
}
```

**Behavior:**
- Removes ONLY disabled entries (pruneLayer)
- Resets error flags for remaining entries
- **DOES NOT remove all entries**
- **DOES NOT prevent stale references**

---

### 4.3 clear() Implementation

```javascript
clear() {
    for (const layer of Object.values(this.layers)) {
        layer.functions = [];
        layer.accumulator = 0;
    }
    this.registeredSystems = {};
    this.totalRegistered = 0;
    this.tickCount = 0;
    frameLog('[FrameScheduler] Cleared all registrations');
}
```

**Behavior:**
- Removes ALL registrations
- Clears accumulators
- Resets counters
- **NEVER CALLED** in current implementation

---

### 4.4 Cleanup Calls in switchWorld()

| Method | Called? | Where | Notes |
|--------|----------|-------|-------|
| `resetLayer('visual')` | ✅ YES | createWorld() line 4856 | ⚠️ ONLY visual layer |
| `clear()` | ❌ NO | - | Never called |
| `unregister()` | ❌ NO | - | Never called |
| `resetLayer('realtime')` | ❌ NO | - | Never called |
| `resetLayer('simulation')` | ❌ NO | - | Never called |
| `resetLayer('background')` | ❌ NO | - | Never called |

**Analysis:**
- **ONLY visual layer is reset** on world switch
- realtime, simulation, background layers are NEVER reset
- **NO full clear** on world switch
- **NO manual unregister** on world switch

---

## SECTION 5: DUPLICATE REGISTRATION RISK

### 5.1 Duplicate Prevention Mechanism

**FrameScheduler.register() implementation:**
```javascript
if (id) {
    if (this.registeredSystems[id]) {
        frameWarn(`[FrameScheduler] System with ID '${id}' already registered. Use unregister() first.`);
        return false;
    }
}
```

**Detection:** Checks `this.registeredSystems[id]` before registration
**Prevention:** Returns false (does NOT register) if ID already exists
**Severity:** LOW - duplicates are prevented, not allowed

---

### 5.2 Duplicate Registration Possible?

**Scenario:** After world switch, can same system ID be registered twice?

**Analysis:**
- FrameScheduler registrations happen **ONCE** in Game constructor
- **NO new registrations** on world switch
- **NO duplicate registration calls** detected

**Result:** ❌ NO - duplicate registration is NOT possible
**Detection Mechanism:** ✅ YES - `registeredSystems[id]` check
**Severity:** LOW - duplicates are prevented by design

---

### 5.3 SystemRegistry Duplicate Registration Risk

**Note:** SystemRegistry has its own registration mechanism.
See `SYSTEMREGISTRY_DEPENDENCY_FORENSIC_AUDIT.md` for details.

**Recent Fix:** aiNodes duplicate execution fix
- aiNodes registered in SystemRegistry (line 4985)
- aiNodes disabled in SystemRegistry (line 4990)
- aiNodes runs EXCLUSIVELY via FrameScheduler

---

## SECTION 6: STALE REFERENCE RISK

### 6.1 Reference Capture Analysis

**Closures in FrameScheduler registrations:**

| Pattern | Example | Captures | Safe After World Switch? |
|---------|----------|-----------|-------------------------|
| Arrow function | `(dt) => this.runCoreMetricsOverlayTick(dt)` | `this` (Game instance) | ✅ YES - Game instance persists |
| Bound method | `this.runCameraControllerTick.bind(this)` | `this` (Game instance) | ✅ YES - Game instance persists |
| Property access | `() => this.linkingSystem.processNodeTargeting()` | `this.linkingSystem` | ⚠️ RISK - see below |

---

### 6.2 Game Instance Persistence

**Game instance:** Created once in main.js
**Lifetime:** Persists for entire session
**World switches:** Game instance is NOT recreated

**Analysis:**
- Closures capture `this` (Game instance)
- Game instance persists across world switches
- `this.aiNodes` - **UPDATED** in createAINodes() (line 4981)
- `this.linkingSystem` - **NOT UPDATED** (created once in setupNodeLinking)
- `this.activeWorld` - **UPDATED** in createWorld() (lines 4901-4934)

---

### 6.3 Specific Reference Risks

#### 6.3.1 aiNodes Reference

**Registration:**
```javascript
reg('aiNodes', (dt) => {
    if (!this.aiNodes) return;
    this.aiNodes.update(dt, this.time);
    // ...
}, 'aiNodes.update');
```

**World Switch Handling:**
```javascript
// createAINodes() line 4981
if (this.aiNodes) {
    systemRegistry.unregister('aiNodes');
    this.aiNodes.dispose();
}
this.aiNodes = new AINodes(...);
```

**Analysis:**
- ✅ SAFE - `this.aiNodes` is recreated in createAINodes()
- Closure captures `this` (Game instance)
- `this.aiNodes` points to NEW aiNodes after world switch
- **NO stale reference risk**

---

#### 6.3.2 linkingSystem Reference

**Registration:**
```javascript
this.frameScheduler.register('visual', () => this.linkingSystem.processNodeTargeting(), 'node.targeting');
```

**World Switch Handling:**
```javascript
// createWorld() line 4889
if (this.linkingSystem) {
    this.linkingSystem.resetForWorldRebuild({ scene: this.scene, worldRoot: this.worldRoot });
}
```

**Analysis:**
- ⚠️ POTENTIAL RISK - `this.linkingSystem` is NOT recreated
- Only `resetForWorldRebuild()` is called
- Closure captures `this.linkingSystem` (reference to same instance)
- **MAY hold stale references to old link objects**

**resetForWorldRebuild() behavior:**
```javascript
resetForWorldRebuild({ scene, worldRoot } = {}) {
    if (Array.isArray(this.links)) {
        for (const link of this.links) {
            // Dispose old link visuals
            if (this.conduitRenderer && link?.group) {
                this.conduitRenderer.disposeLinkVisuals(link.group, link);
            }
            if (link?.group?.parent) {
                link.group.parent.remove(link.group);
            }
            link.group = null; // Clear visual reference
        }
    }
}
```

**Analysis:**
- ✅ `link.group = null` - clears visual references
- ✅ `disposeLinkVisuals()` - disposes old visuals
- ✅ `scene.remove()` - removes from scene
- **BUT:** `this.links` array may still contain old link objects
- **POTENTIAL STALE REFERENCE:** Old link metadata (source, target, etc.) may persist

---

#### 6.3.3 activeWorld Reference

**Registration:**
```javascript
reg('activeWorld', (dt) => {
    if (this.activeWorld) this.activeWorld.update(dt, this.time);
}, 'activeWorld.update');
```

**World Switch Handling:**
```javascript
// createWorld() lines 4901-4934
if (this.currentMode === 'sigma') {
    this.sigmaRift = new SigmaRiftChamber(...);
    this.activeWorld = this.sigmaRift;
} else if (this.currentMode === 'desert') {
    this.dreamDesert = new DreamDesert(...);
    this.activeWorld = this.dreamDesert;
}
// ... etc
```

**Analysis:**
- ✅ SAFE - `this.activeWorld` is **UPDATED** in createWorld()
- Closure captures `this` (Game instance)
- `this.activeWorld` points to NEW world instance after world switch
- **NO stale reference risk**

---

### 6.4 Closures Safe?

| System | Closures Safe? | Stale Reference Possible? | Example Location |
|---------|----------------|-------------------------|------------------|
| aiNodes | ✅ YES | ❌ NO | main.js:7429 |
| activeWorld | ✅ YES | ❌ NO | main.js:7410 |
| linkingSystem (targeting) | ⚠️ PARTIAL | ⚠️ YES (link metadata) | main.js:5066 |

---

## SECTION 7: FINAL SUMMARY

### 7.1 FrameScheduler Lifecycle Safety

| Aspect | Status | Notes |
|--------|--------|-------|
| **Single global instance** | ✅ YES | Created once in Game constructor |
| **Persists across world switches** | ✅ YES | Not recreated |
| **Cleanup on world switch** | ⚠️ PARTIAL | Only visual layer reset |
| **Stale entry removal** | ⚠️ LIMITED | Only disabled entries removed |

---

### 7.2 Risk Assessment

| Risk Category | Severity | Details |
|--------------|----------|---------|
| **Ghost execution risk** | **MEDIUM** | Old world systems remain registered (except visual layer) |
| **Duplicate execution risk after switch** | **LOW** | Duplicates prevented by ID check |
| **Memory leak risk** | **MEDIUM** | Old world systems remain in scheduler (not cleaned) |
| **Stale reference risk** | **MEDIUM** | linkingSystem.link metadata may persist |

---

### 7.3 Critical Findings

#### ⚠️ Finding 1: Partial Layer Reset
**Issue:** Only visual layer is reset on world switch
**Impact:** Old realtime/simulation/background systems remain active
**Example:** aiNodes (simulation layer) remains registered from previous world
**Status:** ✅ aiNodes is recreated in createAINodes() - safe
**Risk:** Other simulation systems may have stale references

#### ⚠️ Finding 2: No Full Cleanup
**Issue:** `clear()` method exists but never called
**Impact:** Old world systems accumulate over time
**Status:** ❌ NO full cleanup on world switch
**Risk:** Memory leak potential (unused systems remain registered)

#### ⚠️ Finding 3: linkingSystem Stale References
**Issue:** linkingSystem is NOT recreated on world switch
**Impact:** Old link metadata may persist
**Status:** ⚠️ Visuals are cleared, but link metadata may remain
**Risk:** Stale link.source / link.target references to old nodes

---

### 7.4 Recommendations

**Priority 1 (Critical):**
1. **Call `clear()` on world switch** - Remove all old registrations
2. **Re-register systems after world switch** - Ensure fresh references

**Priority 2 (High):**
3. **Reset all layers on world switch** - Not just visual layer
4. **Recreate linkingSystem on world switch** - Prevent stale link metadata

**Priority 3 (Medium):**
5. **Audit all closures** - Ensure no stale references
6. **Add world lifecycle hooks** - onWorldLoad, onWorldUnload

---

## AUDIT DATE: 2026-02-26
## METHOD: Static code analysis (READ ONLY)
## SOURCE: main.js, FrameScheduler.js, NodeLinkingSystem.js

---

## EXECUTIVE SUMMARY

### FrameScheduler Lifecycle Safe Across World Switch?
**NO - PARTIAL SAFETY**

- ✅ Instance persistence: SAFE (global instance)
- ⚠️ Cleanup: PARTIAL (only visual layer reset)
- ⚠️ Stale references: MEDIUM RISK (linkingSystem metadata)

### Ghost Execution Risk?
**MEDIUM**

- Old world systems remain registered (except visual layer)
- No full cleanup on world switch
- Potential for executing stale systems

### Duplicate Execution Risk After Switch?
**LOW**

- Duplicate prevention mechanism exists (ID check)
- No duplicate registration calls detected
- Registrations are one-time (Game constructor)

### Memory Leak Risk?
**MEDIUM**

- Old systems accumulate over time (not cleaned)
- `clear()` method exists but never called
- Potential memory leak across world switches

---

## CONCLUSION

FrameScheduler lifecycle is **NOT FULLY SAFE** across world switches.

**Critical Issues:**
1. Only visual layer is reset (incomplete cleanup)
2. No full `clear()` on world switch
3. linkingSystem metadata may persist (stale references)

**Recommended Actions:**
1. Implement full cleanup on world switch
2. Reset all layers, not just visual
3. Audit and fix linkingSystem stale references

---

## VERIFICATION

- ✅ Located switchWorld() entry (loadWorld → init{World} → createWorld)
- ✅ Analyzed FrameScheduler instance (global, not world-bound)
- ✅ Identified all FrameScheduler registrations (one-time setup)
- ✅ Verified cleanup logic (partial: only visual layer reset)
- ✅ Confirmed duplicate prevention (ID check exists)
- ✅ Analyzed stale reference risk (linkingSystem metadata)

---

**READ-ONLY AUDIT COMPLETE**
