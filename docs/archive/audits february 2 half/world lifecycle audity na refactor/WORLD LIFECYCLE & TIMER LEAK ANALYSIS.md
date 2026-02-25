# WORLD LIFECYCLE & TIMER LEAK ANALYSIS

**Date:** 2025-02-15
**Scope:** World-related lifecycle code only
**Audit Type:** Static code analysis

---

## EXECUTIVE SUMMARY

**❌ CRITICAL FINDING: TIMER LEAKS DETECTED**

The ATOMA world lifecycle has **ZERO timer cleanup mechanisms** in place. Multiple independent time sources exist with no corresponding disposal logic, creating guaranteed memory and performance leaks on world switches.

---

## A) TIMER INVENTORY

| File | Line | Type | Cleared? | Risk |
|------|------|------|-----------|------|
| **main.js** | ~2038 | `setInterval` | ❌ **NO** | 🔴 **CRITICAL** |
| **main.js** | ~6359 | `requestAnimationFrame` | ❌ **NO** | 🟡 **HIGH** |
| **FrameScheduler.js** | 152 | `performance.now()` | N/A | 🟢 **LOW** (read-only) |
| **FrameClock.js** | Multiple | `performance.now()` | N/A | 🟢 **LOW** (read-only) |

### Details

#### 1. setInterval - **CRITICAL LEAK**
**Location:** `main.js` (~line 2038)
```javascript
// Scene census (every 3 seconds) to identify draw-call owners
this._sceneAuditTimer = setInterval(() => {
    if (typeof this.auditSceneObjects === 'function') {
        this.auditSceneObjects(this.scene);
    }
}, 3000);
```

**Risk Assessment:**
- ❌ **NO matching `clearInterval()` found in entire codebase**
- Timer created in `AtomaGame.init()`
- Never cleared during `switchMode()`
- Never cleared in any dispose/cleanup method
- **Leak on every world switch: setInterval continues running**

#### 2. requestAnimationFrame - **HIGH RISK**
**Location:** `main.js` (~line 6359)
```javascript
animate() {
    this.updateValidator?.startFrame();
    requestAnimationFrame(() => this.animate());
    // ... rest of animation loop
}
```

**Risk Assessment:**
- ❌ **NO matching `cancelAnimationFrame()` found in entire codebase**
- Single RAF loop drives entire game
- Started once in `AtomaGame.constructor()` via `this.animate()`
- Never cancelled/stopped in any lifecycle method
- **Continues running even during world transitions**
- FrameScheduler may throttle systems, but RAF loop never stops

#### 3. performance.now() - **ACCEPTABLE**
**Locations:**
- `FrameScheduler.js` line 152: Used for delta time calculation
- `FrameClock.js` multiple lines: Passive time tracking
- `main.js` multiple locations: Performance measurement

**Risk Assessment:**
- ✅ Read-only time source
- ✅ No timer creation
- ✅ No state mutation
- ✅ Safe for lifecycle

---

## B) EVENT LISTENER INVENTORY

| File | Line | Event | Removed? | Risk |
|------|------|--------|-----------|------|
| **main.js** | ~4789 | `window.resize` | ❌ **NO** | 🟡 **HIGH** |
| **main.js** | ~7350 | `keydown (KeyM)` | ❌ **NO** | 🟢 **LOW** (intentional) |
| **main.js** | ~7360 | `keydown (F7)` | ❌ **NO** | 🟢 **LOW** (intentional) |
| **main.js** | ~5400 | `click (audio start)` | ❌ **NO** | 🟢 **LOW** (intentional) |
| **main.js** | ~5420 | `keydown (audio start)` | ❌ **NO** | 🟢 **LOW** (intentional) |

### Details

#### 1. window.resize - **HIGH RISK**
**Location:** `main.js` (~line 4789)
```javascript
setupModeSwitch() {
    document.addEventListener('keydown', (e) => {
        if (e.code === 'KeyM') {
            this.switchMode();
        }
    });
}

setupPerformanceMode() {
    document.addEventListener('keydown', (e) => {
        if (e.code === 'F7') {
            // Performance mode toggle
        }
    });
}

// In init():
window.addEventListener('resize', () => this.onWindowResize());
```

**Risk Assessment:**
- ❌ **NO matching `removeEventListener()` found in entire codebase**
- window.resize listener never removed
- Game controls (KeyM, F7) never removed
- Audio start listeners never removed
- **However**: These are intentionally global, so risk is LOW

---

## C) TIME AUTHORITY MAP

### What Drives World Timing?

```
┌─────────────────────────────────────────────────────────┐
│              TIME AUTHORITY CHAIN                      │
└─────────────────────────────────────────────────────────┘

1. BROWSER CLOCK (Source of Truth)
   │
   ├─> requestAnimationFrame()  [main.js:6359]
   │    │
   │    └─> FrameClock.tick()   [FrameClock.js]
   │         │
   │         └─> FrameScheduler.tick()  [FrameScheduler.js]
   │              │
   │              ├─> realtime layer (60Hz)
   │              ├─> visual layer (30Hz)
   │              ├─> simulation layer (10Hz)
   │              └─> background layer (2Hz)
   │
   └─> setInterval (audit)   [main.js:2038] ← INDEPENDENT LOOP

2. TIME CONSUMPTION (Read-only)
   ├─> performance.now()  [FrameScheduler.js:152]
   ├─> this.clock.getDelta()  [THREE.Clock]
   └─> deltaTime / time parameters passed to update()
```

### Critical Findings

#### ✅ GOOD: Single Authority for Game Loop
- **requestAnimationFrame** is the single driver for game updates
- FrameScheduler provides controlled frequency layers
- All world systems receive time from scheduler, not independent sources

#### ❌ BAD: Independent Audit Timer
- **setInterval** at 3000ms runs independently of game loop
- Uses separate time source (system clock, not performance.now)
- Not synchronized with frame lifecycle
- **Never stops even when game pauses or world switches**

---

## D) LIFECYCLE SAFETY VERDICT

### ❌ **NO** - Teardown Does NOT Stop All World Activity

### Explanation

#### CRITICAL ISSUES

1. **setInterval Leak (CRITICAL)**
   - Timer created in `AtomaGame.init()`
   - Never cleared in `switchMode()`, `dispose()`, or any cleanup
   - **Continues running indefinitely, accumulating timers on world switches**
   - Calls `this.auditSceneObjects(this.scene)` every 3 seconds
   - **During world transition:** Timer references OLD scene objects that may be disposed
   - **Risk:** Exceptions, stale references, memory leaks

2. **requestAnimationFrame Never Stopped (HIGH RISK)**
   - RAF loop started once and never cancelled
   - FrameScheduler may throttle registered systems
   - **But RAF loop itself continues even during world switch**
   - May call update() on disposed world objects
   - **Risk:** Undefined behavior, crashes during transition

3. **No Cleanup Pattern Exists**
   - Search for `clearInterval` returned **ZERO RESULTS**
   - Search for `clearTimeout` returned **ZERO RESULTS**
   - Search for `cancelAnimationFrame` returned **ZERO RESULTS**
   - **No timer cleanup infrastructure exists**

4. **World Objects Use External Time**
   - ✅ World classes DO NOT create their own timers (verified)
   - ✅ World classes DO NOT use Date.now() directly (verified)
   - ✅ World classes DO NOT use performance.now() directly (verified)
   - ✅ World.update(deltaTime, time) relies on external time
   - **However:** The external time source (RAF) never stops

#### SAFE ASPECTS

1. **World Classes Are Clean**
   - `World.js`, `DreamDesert.js`, `FractalValley.js`, `SigmaRiftChamber.js` all:
     - Have `update(deltaTime, time)` methods
     - Receive time as parameters (no independent time sources)
     - Do NOT create timers
     - Do NOT add event listeners
     - **Pure update contracts**

2. **FrameScheduler Provides Control**
   - Layers: realtime, visual, simulation, background
   - Systems can be unregistered: `frameScheduler.unregister(id)`
   - **But RAF loop itself is never stopped**

3. **Scene Cleanup Exists (Partial)**
   - `switchMode()` calls `this.linkingSystem.dispose()`
   - `switchMode()` calls `this.aiNodes.dispose()`
   - `switchMode()` uses `scene.children.filter()` brute force
   - **Removes objects from scene, but does not stop time**

---

## E) WORLD SWITCH SEQUENCE ANALYSIS

### Current switchMode() Flow

```javascript
async switchMode() {
    // PHASE 1: Begin transition
    this.worldResetFix.beginMapTransition(...);
    
    // PHASE 2: Disable visual systems
    this.worldFXPack?.disableAll();
    // ... many disableAll() calls
    
    // PHASE 3: Dispose AI nodes and links
    if (this.linkingSystem) this.linkingSystem.dispose();
    if (this.aiNodes) this.aiNodes.dispose();
    
    // PHASE 4: Clean old scene
    this.worldResetFix.cleanOldScene();
    
    // PHASE 5: BRUTE FORCE SCENE CLEAR
    this.scene.children = this.scene.children.filter(child =>
        child === this.player || child instanceof THREE.Light
    );
    
    // PHASE 6: Create new world
    this.createAINodes();
    
    // PHASE 7: Reinitialize visual systems
    // ... many system reinitializations
}
```

### Missing Lifecycle Steps

1. ❌ **Stop RAF loop**
   - No `cancelAnimationFrame()` call
   - Animation continues during transition

2. ❌ **Clear setInterval**
   - No `clearInterval(this._sceneAuditTimer)` call
   - Audit timer continues referencing disposed scene

3. ❌ **Pause FrameScheduler**
   - No `frameScheduler.stop()` or pause mechanism
   - Registered systems may still receive ticks

4. ❌ **Remove Event Listeners**
   - No global listener cleanup
   - However, most listeners are intentionally global

5. ❌ **Wait for Frame Completion**
   - No `await nextFrame()` or similar sync
   - Scene may be modified mid-frame

---

## F) SPECIFIC TIMER ANALYSIS

### setInterval Audit Timer

**Code Location:** `main.js` (~line 2038)
```javascript
this._sceneAuditTimer = setInterval(() => {
    if (typeof this.auditSceneObjects === 'function') {
        this.auditSceneObjects(this.scene);
    }
}, 3000);
```

**Lifecycle:**
- Created in: `AtomaGame.init()` (constructor phase)
- Execution: Every 3000ms (3 seconds)
- Action: Calls `this.auditSceneObjects(this.scene)`
- Cleanup: **NONE**

**Leak Scenario:**
1. World switch triggers `switchMode()`
2. Old scene objects are disposed
3. `this._sceneAuditTimer` is NOT cleared
4. Timer fires 3 seconds later
5. `this.auditSceneObjects(this.scene)` runs on NEW scene
6. If `auditSceneObjects` has stale references to old objects: CRASH
7. Timer accumulates: Never cleared across world switches

**Required Fix:**
```javascript
// In switchMode() - PHASE 1
if (this._sceneAuditTimer) {
    clearInterval(this._sceneAuditTimer);
    this._sceneAuditTimer = null;
}
```

### requestAnimationFrame Main Loop

**Code Location:** `main.js` (~line 6359)
```javascript
animate() {
    this.updateValidator?.startFrame();
    requestAnimationFrame(() => this.animate());
    // ... update logic
}

// Started in constructor:
this.animate();
```

**Lifecycle:**
- Created in: `AtomaGame.constructor()`
- Execution: Every frame (typically 60fps)
- Action: Drives all game systems
- Cleanup: **NONE**

**Leak Scenario:**
1. World switch triggers `switchMode()`
2. RAF loop continues
3. `animate()` calls `requestAnimationFrame(() => this.animate())` again
4. If `animate()` is re-entrant: **Double RAF loops**
5. If systems reference disposed objects: CRASH
6. No cancellation mechanism exists

**Required Fix:**
```javascript
// In constructor
this._rafId = null;
this._isRunning = false;

startAnimation() {
    if (this._isRunning) return;
    this._isRunning = true;
    this._rafId = requestAnimationFrame(() => this.animate());
}

stopAnimation() {
    if (!this._isRunning) return;
    this._isRunning = false;
    if (this._rafId) {
        cancelAnimationFrame(this._rafId);
        this._rafId = null;
    }
}

// In switchMode() - PHASE 1
this.stopAnimation();

// ... switch logic ...

// In switchMode() - PHASE 7 (after all systems ready)
this.startAnimation();
```

---

## G) WORLD-RELATED SYSTEMS AUDIT

### World Classes (Checked for Timers)

| File | Timers Found | Event Listeners | Time Sources | Verdict |
|------|--------------|-----------------|---------------|---------|
| `World.js` | ❌ None | ❌ None | External only (deltaTime, time) | ✅ CLEAN |
| `DreamDesert.js` | ❌ None | ❌ None | External only (deltaTime, time) | ✅ CLEAN |
| `FractalValley.js` | ❌ None | ❌ None | External only (deltaTime, time) | ✅ CLEAN |
| `SigmaRiftChamber.js` | ❌ None | ❌ None | External only (deltaTime, time) | ✅ CLEAN |
| `QuantumIsland.js` | ❌ None | ❌ None | External only (deltaTime, time) | ✅ CLEAN |
| `MemoryLane.js` | ❌ None | ❌ None | External only (deltaTime, time) | ✅ CLEAN |
| `NeuralSea.js` | ❌ None | ❌ None | External only (deltaTime, time) | ✅ CLEAN |

**Conclusion:** All world classes are CLEAN - they properly rely on external time sources.

### Time Authority Systems

| System | Role | Timers | Cleanup | Verdict |
|--------|------|--------|----------|---------|
| `FrameClock.js` | Passive time tracking | None | None | ✅ SAFE (stateless) |
| `FrameScheduler.js` | Frequency control | None | `unregister()` exists | ✅ SAFE (partial) |
| `THREE.Clock` | Delta time calculation | None | None | ✅ SAFE (read-only) |

---

## H) RECOMMENDATIONS

### PRIORITY 0 (CRITICAL - Fix Immediately)

1. **Stop RAF Loop During World Switch**
   ```javascript
   // Add to AtomaGame class
   stopAnimation() {
       if (this._rafId) {
           cancelAnimationFrame(this._rafId);
           this._rafId = null;
       }
       if (this._isRunning) {
           this._isRunning = false;
       }
   }
   
   startAnimation() {
       if (this._isRunning) return;
       this._isRunning = true;
       this.animate();
   }
   
   // Modify animate()
   animate() {
       if (!this._isRunning) return;
       this.updateValidator?.startFrame();
       this._rafId = requestAnimationFrame(() => this.animate());
       // ... rest of loop
   }
   
   // Use in switchMode()
   async switchMode() {
       this.stopAnimation();  // ← ADD THIS
       // ... switch logic ...
       this.startAnimation();  // ← ADD THIS
   }
   ```

2. **Clear setInterval During World Switch**
   ```javascript
   // Add to AtomaGame class
   clearTimers() {
       if (this._sceneAuditTimer) {
           clearInterval(this._sceneAuditTimer);
           this._sceneAuditTimer = null;
       }
   }
   
   // Use in switchMode()
   async switchMode() {
       this.clearTimers();  // ← ADD THIS
       // ... switch logic ...
   }
   ```

### PRIORITY 1 (HIGH - Fix Soon)

3. **Add Timer Registry**
   ```javascript
   // Add to AtomaGame constructor
   this._timers = new Set();
   this._rafIds = new Set();
   
   // Helper methods
   registerTimer(timerId) {
       this._timers.add(timerId);
       return timerId;
   }
   
   clearAllTimers() {
       this._timers.forEach(id => clearInterval(id));
       this._timers.clear();
   }
   
   registerRaf(rafId) {
       this._rafIds.add(rafId);
       return rafId;
   }
   
   cancelAllRaf() {
       this._rafIds.forEach(id => cancelAnimationFrame(id));
       this._rafIds.clear();
   }
   ```

4. **Add FrameScheduler Stop/Start**
   ```javascript
   // Modify FrameScheduler.js
   stop() {
       this._isStopped = true;
   }
   
   start() {
       this._isStopped = false;
   }
   
   tick(deltaTime) {
       if (this._isStopped) return;
       // ... existing logic
   }
   ```

### PRIORITY 2 (MEDIUM - Fix When Possible)

5. **Add World Lifecycle Hooks**
   ```javascript
   // Add to all world classes
   constructor(scene) {
       this.scene = scene;
       this.isAlive = true;
   }
   
   update(deltaTime, time) {
       if (!this.isAlive) return;
       // ... existing logic
   }
   
   dispose() {
       this.isAlive = false;
       // ... cleanup logic
   }
   ```

6. **Add Scene Cleanup Wait**
   ```javascript
   // Add to switchMode()
   async switchMode() {
       // ... existing teardown ...
       
       // Wait for RAF to finish
       await new Promise(resolve => {
           requestAnimationFrame(() => requestAnimationFrame(resolve));
       });
       
       // ... create new world ...
   }
   ```

---

## I) ROOT CAUSE ANALYSIS

### Why Timer Leaks Exist

1. **Architectural Gap**
   - No lifecycle phase concept (INIT → RUN → TEARDOWN → STOP)
   - Only INIT and RUN phases exist
   - No STOP phase for cleanup

2. **Missing Abstraction**
   - Timer creation is direct: `setInterval()`, `requestAnimationFrame()`
   - No timer registry or manager
   - No centralized cleanup

3. **Assumption of "Forever"**
   - Code assumes game runs forever
   - No consideration for world switches
   - No cleanup for restart scenarios

4. **Single RAF Loop Assumption**
   - Single RAF loop is idiomatic for games
   - But world switching needs RAF lifecycle
   - No "pause" or "stop" concept

---

## J) TESTING RECOMMENDATIONS

### Manual Verification Steps

1. **Test RAF Leak**
   ```javascript
   // In console before world switch
   let frameCount = 0;
   const originalAnimate = window.game.animate.bind(window.game);
   window.game.animate = function() {
       frameCount++;
       console.log('Frame:', frameCount);
       originalAnimate();
   };
   
   // Press 'M' to switch worlds
   // If frameCount keeps incrementing during switch: RAF LEAK
   ```

2. **Test setInterval Leak**
   ```javascript
   // In console
   let auditCount = 0;
   const originalAudit = window.game.auditSceneObjects.bind(window.game);
   window.game.auditSceneObjects = function() {
       auditCount++;
       console.log('Audit call:', auditCount);
       originalAudit(...arguments);
   };
   
   // Press 'M' to switch worlds
   // Wait 3+ seconds
   // If auditCount keeps incrementing: setInterval LEAK
   ```

3. **Test Memory Leak**
   ```javascript
   // In console
   const memoryBefore = performance.memory?.usedJSHeapSize;
   
   // Switch worlds 10 times
   for (let i = 0; i < 10; i++) {
       window.game.switchMode();
       await new Promise(r => setTimeout(r, 100));
   }
   
   const memoryAfter = performance.memory?.usedJSHeapSize;
   const leak = (memoryAfter - memoryBefore) / 1024 / 1024;
   console.log('Memory leak (MB):', leak);
   ```

---

## K) CONCLUSION

### Overall Assessment

**❌ FAILING** - World lifecycle is NOT safe

**Critical Failures:**
1. setInterval never cleared → Timer leak
2. requestAnimationFrame never cancelled → RAF continues during transition
3. No timer cleanup infrastructure → Cannot be fixed without code changes
4. No lifecycle stop phase → No cleanup point

**Passing Areas:**
1. World classes are clean (no independent timers)
2. Single time authority (RAF drives everything)
3. External time sources used correctly

### Impact

- **Immediate:** Potential crashes during world switch
- **Short-term:** Stale object references, exceptions
- **Long-term:** Memory exhaustion from accumulating timers

### Risk Level

🔴 **CRITICAL** - Timer leaks are severe and will cause issues over time

---

**END OF REPORT**