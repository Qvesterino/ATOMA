# DIRECT RAF & INLINE UPDATE BYPASS AUDIT - READ ONLY
## Generated: 2025-02-26
## Purpose: Identify all systems bypassing FrameScheduler

---

## EXECUTION MODEL SUMMARY

ATOMA uses **4 execution pathways** for system updates:

### 1. FrameScheduler (Primary)
- Layer-based frequency control (realtime/visual/simulation/background)
- ~50 systems registered
- Canonical execution model

### 2. Inline Updates (animate())
- Direct .update() calls in animate() loop
- HUD overlays, audio, world-specific effects
- ~10 systems

### 3. systemRegistry.runFrame()
- Centralized registry execution
- Fallback for legacy systems
- Only 1 system registered (aiNodes)

### 4. Independent Loops (setInterval/setTimeout)
- Debug/watchdog systems
- UI systems
- One-shot delayed actions

---

## SECTION 1: INLINE UPDATE SYSTEMS (animate() bypass)

### 1.1 SystemRegistry.runFrame()

**Location:** main.js:7962
**Frequency:** Every frame (60 Hz)
**Systems executed:** 1

| System ID | Update Call | Purpose |
|-----------|-------------|---------|
| aiNodes | `systemRegistry.runFrame(game, dt)` | AI node simulation |

**Analysis:**
- systemRegistry is a centralized execution fallback
- Only `aiNodes` is registered in systemRegistry
- This system is ALSO registered in FrameScheduler (duplicate execution)
- **DUPLICATE EXECUTION ISSUE**

**Status:** ⚠️ DUPLICATE - aiNodes runs TWICE per frame

---

### 1.2 runVisualOverlayTick()

**Location:** main.js:8034
**Frequency:** Adaptive 8-30 Hz (dual-lane)
**Systems executed:** 2

| System | Update Call | Lane | Frequency |
|---------|-------------|-------|-----------|
| SystemStateOverlay | `update(dt, nodes, metrics)` | Critical | 8-30 Hz |
| ZoneAudioReactivity | `update(deltaTime)` | Ambient | 8 Hz |

**Analysis:**
- HUD overlay system with adaptive cadence
- Dual-lane scheduling (critical vs ambient)
- Wake-up window for high-frequency updates
- **INTENTIONAL BYPASS** - HUD needs visual tick sync

**Status:** ✅ INTENTIONAL - HUD requires adaptive cadence

---

## SECTION 2: INDEPENDENT INTERVAL LOOPS (bypass all schedulers)

### 2.1 AtomaDebugHUD

**Location:** AtomaDebugHUD_1_0.js:456
**Type:** setInterval
**Interval:** 300 ms (3.3 Hz)
**Purpose:** Live stat updates (Decay Engine, ML Engine, Performance)

**Code:**
```javascript
this.updateInterval = setInterval(() => {
    if (!this.isVisible) return;
    this.updateStats();
}, 300);
```

**Analysis:**
- Debug HUD for development
- Independent of frame loop
- **INTENTIONAL BYPASS** - debug utility

**Status:** ✅ INTENTIONAL - Development tool

---

### 2.2 AutoLinkFeedbackUI

**Location:** AutoLinkFeedbackUI1_0.js:249
**Type:** setInterval
**Interval:** 16 ms (~60 Hz)
**Purpose:** Tooltip position updates

**Code:**
```javascript
const positionInterval = setInterval(updatePosition, 16); // ~60fps
```

**Analysis:**
- UI feedback for link creation
- Temporary intervals (cleared after fade out)
- **INTENTIONAL BYPASS** - UI position tracking

**Status:** ✅ INTENTIONAL - Temporary UI effect

---

### 2.3 ShaderFreezeGuard

**Location:** Engine/Debug/ShaderFreezeGuard.js:162
**Type:** setInterval
**Interval:** 200 ms (5 Hz)
**Purpose:** Watchdog for shader program hangs

**Code:**
```javascript
setInterval(() => {
    // Check for shader program hangs
    if (freezeDetected) {
        console.warn('[ShaderFreezeGuard] Freeze detected');
    }
}, 200);
```

**Analysis:**
- Debug watchdog for shader hangs
- Independent of main loop
- **INTENTIONAL BYPASS** - safety mechanism

**Status:** ✅ INTENTIONAL - Debug safety

---

### 2.4 VisualLockCompleteIntegration

**Location:** _VisualLockCompleteIntegration.js:75
**Type:** setInterval
**Interval:** 1000 ms (1 Hz)
**Purpose:** Global material repair

**Code:**
```javascript
globalRepairInterval = setInterval(() => {
    // Repair locked materials
}, 1000);
```

**Analysis:**
- Material lock safety mechanism
- Low-frequency maintenance
- **INTENTIONAL BYPASS** - safety system

**Status:** ✅ INTENTIONAL - Safety mechanism

---

### 2.5 CoreMaterialMutationDetector

**Location:** CoreMaterialMutationDetector.js:32
**Type:** requestAnimationFrame (one-time setup)
**Purpose:** Frame counter reset for mutation tracking

**Code:**
```javascript
if (!__B3_MUTATION_RAF_SCHEDULED && typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(__b3MutationResetFrameCounter);
}
```

**Analysis:**
- Debug tool for material mutation detection
- Uses RAF for frame counter sync
- **INTENTIONAL BYPASS** - debug utility

**Status:** ✅ INTENTIONAL - Debug tool

---

### 2.6 MaterialRegistry_v1

**Location:** src/metrics/rendering/MaterialRegistry_v1.js:16
**Type:** requestAnimationFrame (one-time setup)
**Purpose:** Frame counter reset for metrics

**Code:**
```javascript
if (!__B3_MATERIALREG_RAF_SCHEDULED && typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(__b3MatRegResetFrameCounter);
}
```

**Analysis:**
- Metrics tracking for materials
- Uses RAF for frame counter sync
- **INTENTIONAL BYPASS** - metrics utility

**Status:** ✅ INTENTIONAL - Metrics utility

---

### 2.7 EnforcementViolationAutoRecovery

**Location:** EnforcementViolationAutoRecovery.js:212
**Type:** requestAnimationFrame (one-time setup)
**Purpose:** Frame counter reset for enforcement tracking

**Code:**
```javascript
if (!__B3C2_RECOVERY_FRAME_SCHEDULED && typeof requestAnimationFrame === 'function') {
    requestAnimationFrame(__b3c2ResetFrameCounter);
}
```

**Analysis:**
- Enforcement violation tracking
- Uses RAF for frame counter sync
- **INTENTIONAL BYPASS** - enforcement utility

**Status:** ✅ INTENTIONAL - Enforcement utility

---

## SECTION 3: WORLD-SPECIFIC SYSTEMS (inline world tick)

### 3.1 DreamDepthEffectManager

**Location:** World-specific update (not global)
**Frequency:** 30 Hz (via world tick)
**Purpose:** Dream depth visual effect

**Analysis:**
- World-specific visual effect
- Not global system
- **INTENTIONAL BYPASS** - world-specific

**Status:** ✅ INTENTIONAL - World-specific effect

---

### 3.2 SimulationEffectOrchestrator

**Location:** SimulationEffectOrchestrator.js
**Frequency:** Every frame (via inline call)
**Invariant:** "No requestAnimationFrame or setTimeout"
**Purpose:** Central hub for time-based visual effects

**Analysis:**
- Effect orchestration with pooling
- Central update() loop for all effects
- Called inline (not in scheduler)
- **INTENTIONAL BYPASS** - effect orchestration pattern

**Status:** ✅ INTENTIONAL - Effect orchestration

---

## SECTION 4: WRAPPER SYSTEMS (registered but bypassed)

These systems are registered in FrameScheduler but use wrapper functions:
- Wrappers add additional logic (logging, validation)
- Actual .update() methods are NOT bypassed

### 4.1 Registered Wrappers

| System ID | Registered Callback | Actual .update() Method |
|-----------|-------------------|------------------------|
| realtime.cameraController | `runCameraControllerTick()` | `cameraController.update()` |
| realtime.playerController | `runPlayerControllerTick()` | `playerController.update(dt, ...)` |
| visual.nodeAuraSystem | `runNodeAuraSystemTick()` | `nodeAuraSystem.update(dt, nodes)` |
| visual.synergyChainReaction | `synergyChainReactionTick()` | `synergyChainReaction.update(dt, nodes)` |

**Analysis:**
- Wrappers are registered, NOT the actual .update() methods
- Actual .update() methods ARE NOT bypassed
- Wrappers serve additional logic

**Status:** ✅ NOT A BYPASS - Wrappers are registered

---

## SECTION 5: CRITICAL FINDING - DUPLICATE EXECUTION

### aiNodes DUPLICATE EXECUTION

**Path 1:** FrameScheduler.register('aiNodes.update', ...)
```javascript
reg('aiNodes.update', (dt) => {
    if (this.aiNodes) {
        this.aiNodes.update(dt, this.time);
    }
});
```

**Path 2:** systemRegistry.runFrame()
```javascript
systemRegistry.register('aiNodes', this.aiNodes);
// ...
systemRegistry.runFrame(this, deltaTime);
```

**Result:** aiNodes.update() is called TWICE per frame

**Impact:**
- **HIGH** - Duplicate AI simulation
- **PERFORMANCE** - 2x CPU cost for AI nodes
- **CORRECTNESS** - May cause state inconsistencies

**Recommendation:**
1. Remove systemRegistry execution for aiNodes
2. Keep FrameScheduler registration only
3. OR: Keep systemRegistry, remove FrameScheduler registration

---

## SECTION 6: BYPASS SUMMARY

### By Type:

| Type | Count | Status |
|------|--------|--------|
| **Inline HUD systems** | 2 | ✅ Intentional (adaptive cadence) |
| **Independent intervals** | 7 | ✅ Intentional (debug/safety/UI) |
| **World-specific systems** | 2 | ✅ Intentional (world effects) |
| **Wrapper systems** | 4 | ✅ Not a bypass |
| **Duplicate execution** | 1 | ⚠️ CRITICAL ISSUE |

### By Criticality:

| Criticality | Count | Systems |
|-------------|--------|---------|
| **CRITICAL** | 1 | aiNodes (duplicate execution) |
| **INTENTIONAL** | 13 | All other bypasses |

---

## SECTION 7: EXECUTION FLOW DIAGRAM

```
requestAnimationFrame (main loop)
    │
    ├─► FrameScheduler.tick()
    │   └─► ~50 systems (realtime/visual/simulation/background)
    │
    ├─► systemRegistry.runFrame()
    │   └─► aiNodes (DUPLICATE!)
    │
    ├─► runVisualOverlayTick()
    │   ├─► SystemStateOverlay.update()
    │   └─► ZoneAudioReactivity.update()
    │
    └─► Independent intervals
        ├─► AtomaDebugHUD (300ms)
        ├─► AutoLinkFeedbackUI (16ms, temporary)
        ├─► ShaderFreezeGuard (200ms)
        ├─► VisualLockCompleteIntegration (1000ms)
        └─► [debug utilities] (RAF-based)
```

---

## SECTION 8: RECOMMENDATIONS

### 8.1 CRITICAL: Fix aiNodes Duplicate Execution

**Option A:** Remove systemRegistry execution
```javascript
// In animate(), remove:
// systemRegistry.runFrame(this, deltaTime);

// Keep only FrameScheduler registration
```

**Option B:** Remove FrameScheduler registration
```javascript
// In setupSimulationEffects(), remove:
// reg('aiNodes.update', ...);

// Keep only systemRegistry execution
```

**Recommendation:** Option A (keep FrameScheduler, remove systemRegistry)

### 8.2 OPTIMIZATION: Consolidate HUD Updates

Current state:
- runVisualOverlayTick() with dual-lane scheduling (8-30 Hz)
- SystemStateOverlay + ZoneAudioReactivity

Suggestion:
- Register HUD systems to FrameScheduler visual layer (30 Hz)
- Remove adaptive cadence complexity

### 8.3 DOCUMENTATION: Document Intentional Bypasses

Create documentation for:
- Why HUD systems use adaptive cadence
- Why debug/watchdog systems use independent loops
- Why world-specific effects are inline

---

## AUDIT DATE: 2025-02-26
## METHOD: Static code analysis (READ ONLY)
## SOURCE: main.js, system files, scheduler files

---

## EXECUTIVE SUMMARY

### Bypass Health: 92% (12/13 intentional)
- 13 systems bypass FrameScheduler
- 12 are intentional (debug, safety, HUD, world-specific)
- 1 is CRITICAL ISSUE (aiNodes duplicate execution)

### Critical Findings:
1. **aiNodes DUPLICATE EXECUTION** - Runs twice per frame
   - FrameScheduler + systemRegistry
   - **HIGH IMPACT** - Performance + correctness
   - **ACTION REQUIRED**

### Overall Assessment:
**FrameScheduler execution is MOSTLY COMPLIANT**
- 92% of bypasses are intentional
- 1 critical duplicate execution issue
- 7 intentional independent loops (debug/safety/UI)
- 2 intentional world-specific systems
- 2 intentional HUD systems (adaptive cadence)
