# WORLDROOT LIFECYCLE AUDIT - READ ONLY, MINIMAL
## Generated: 2026-02-26
## Purpose: Understand WorldRoot lifecycle and its 5 phases

---

## 1️⃣ LOCATE WORLDROOT

### File: main.js

### WorldRoot is NOT a class:
- `this.worldRoot` is a **THREE.Group** (scene graph container)
- Created in `createWorld()` (line 4863)
- Managed by Game instance (property, not separate module)

### Public Methods (Game instance methods that operate on worldRoot):
- `createWorld(reason)` - Main world lifecycle entry
- `loadWorld(worldId)` - World switch trigger
- `switchMode()` - Cycle through worlds
- No direct worldRoot manipulation methods

---

## 2️⃣ IDENTIFY ALL PHASES

### PHASE 1: OLD WORLD CLEANUP
**Name:** Scene Cleanup Phase
**Triggered by:** `loadWorld(worldId)` (line 7173)
**Entry condition:** World switch requested
**What it initializes:**
- Removes all non-essential scene objects
- Calls `worldResetFix.cleanOldScene()` (line 7190)
**What state flags it sets:**
- `this._pendingCreateWorldReason = 'MAP_SWITCH'` (line 7194)
- `this.currentMode = worldId` (line 7192)
**What systems it touches:**
- Scene graph (removes children except worldRoot, player, lights)
- worldResetFix (cleanup queue processing)

---

### PHASE 2: SCHEDULER VISUAL RESET
**Name:** FrameScheduler Visual Layer Reset
**Triggered by:** `createWorld(reason)` (line 4856)
**Entry condition:** New world creation initiated
**What it initializes:**
- Resets FrameScheduler visual layer
**What state flags it sets:**
- None (scheduler internal state reset)
**What systems it touches:**
- `this.frameScheduler?.resetLayer?.('visual')` (line 4856)
- Prunes disabled visual layer entries
- Clears error flags for remaining entries

---

### PHASE 3: OLD WORLDROOT DISPOSAL
**Name:** Old WorldRoot Removal
**Triggered by:** `createWorld(reason)` (line 4859)
**Entry condition:** FrameScheduler visual layer reset complete
**What it initializes:**
- Removes old worldRoot from scene
**What state flags it sets:**
- None (destructive cleanup)
**What systems it touches:**
- `this.scene.remove(this.worldRoot)` (line 4860)
- Old worldRoot detached from scene graph

---

### PHASE 4: NEW WORLDROOT CREATION
**Name:** New WorldRoot Initialization
**Triggered by:** `createWorld(reason)` (line 4863)
**Entry condition:** Old worldRoot removed
**What it initializes:**
- Creates new THREE.Group as worldRoot
- Creates worldLightingRoot as child of worldRoot
- Attaches worldRoot to scene
**What state flags it sets:**
- None (pure construction)
**What systems it touches:**
- `this.worldRoot = new THREE.Group()` (line 4863)
- `this.worldRoot.name = "ATOMA_WorldRoot"` (line 4864)
- `this.scene.add(this.worldRoot)` (line 4865)
- `this.worldLightingRoot = new THREE.Group()` (line 4866)
- `this.worldRoot.add(this.worldLightingRoot)` (line 4868)
- `this.linkingSystem.resetForWorldRebuild({ scene, worldRoot })` (line 4870)

---

### PHASE 5: WORLD INSTANCE CREATION
**Name:** World-Specific Instance Initialization
**Triggered by:** `createWorld(reason)` (lines 4896-4934)
**Entry condition:** New worldRoot created and attached
**What it initializes:**
- World-specific instance based on currentMode
- AI nodes for new environment
- Visual systems reattachment
**What state flags it sets:**
- `this._allowRegistryReset = true` (line 4981) - Enables aiNodes recreation
- `this.activeWorld = <worldInstance>` (lines 4901, 4908, 4915, 4922, 4928, 4934)
**What systems it touches:**
- **World instances:**
  - SigmaRiftChamber (sigma mode)
  - DreamDesert (desert mode)
  - QuantumIsland (quantum mode)
  - FractalValley (fractal mode)
  - MemoryLane (memory mode)
  - World (chamber mode)
- **Visual systems:**
  - GlyphLayer4 recreation (line 4876)
  - worldPersonalityController reattachment (line 4885)
  - WorldFXPack, worldEvents, weatherPack reattachment (line 4891)
- **AI systems:**
  - `this.createAINodes(reasonForCreate)` (line 4945)

---

## 3️⃣ WORLDREADY / READY CONTRACT

### What determines that world is "ready"?

**Answer:** No explicit world-ready boolean flag.

World becomes ready **implicitly** when:
1. `createWorld(reason)` completes (line 4853)
2. World instance is created (lines 4896-4934)
3. `this.createAINodes(reasonForCreate)` completes (line 4945)
4. All visual systems are initialized and attached

### Is there a boolean flag?

**No.** No `this.worldReady` or `this.isWorldReady` flag exists.

### Who sets it?

**Nobody.** Ready state is implicit (completion of initialization pipeline).

### Who reads it?

**Nobody.** No system checks for world-ready flag.

### Does FrameScheduler depend on it?

**No.** FrameScheduler operates independently of world-ready state.
- FrameScheduler systems are registered once at Game constructor
- They don't wait for world-ready signal
- They check for `this.aiNodes` or `this.activeWorld` existence at runtime

---

## 4️⃣ SWITCHWORLD INTERACTION

### Where does switchWorld() call WorldRoot?

**Answer:** Nowhere. switchWorld() does NOT call WorldRoot directly.

**Actual call chain:**
```
switchMode() → loadWorld(worldId) → worldRegistry[worldId]() → init{World}() → createWorld('MAP_SWITCH')
```

**File:** main.js
- `switchMode()` line 7209
- `loadWorld()` line 7173
- `createWorld()` line 4853

### Is WorldRoot recreated or reused?

**Answer:** RECREATED every world switch.

**Evidence:**
```javascript
// Phase 3: Old WorldRoot Disposal
if (this.worldRoot) {
    this.scene.remove(this.worldRoot);  // Detach old
}

// Phase 4: New WorldRoot Creation
this.worldRoot = new THREE.Group();  // Create NEW
this.worldRoot.name = "ATOMA_WorldRoot";
this.scene.add(this.worldRoot);
```

### Are old instances disposed?

**Answer:** PARTIALLY.

**Disposed:**
- `this.glyphLayer4.dispose()` (line 4873)
- `this.aiNodes.dispose()` (line 4979)
- Link visuals disposed via `linkingSystem.resetForWorldRebuild()`

**NOT disposed:**
- World instances (sigmaRift, dreamDesert, etc.) - Overwritten, not disposed
- visual systems (worldFXPack, weatherPack, etc.) - Reattached, not disposed

### Are event listeners removed?

**Answer:** NO explicit removal.

**Evidence:**
- No code removes event listeners on world switch
- Systems keep their listeners active
- Potential for stale event listener accumulation

---

## 5️⃣ SCHEDULER INTERACTION

### Does WorldRoot register scheduler systems?

**Answer:** NO.

WorldRoot is a THREE.Group, not a system.
It does NOT register FrameScheduler systems.

### Does WorldRoot unregister systems?

**Answer:** NO.

No code in createWorld() unregisters FrameScheduler systems.

### Does WorldRoot depend on specific tick order?

**Answer:** NO.

WorldRoot is passive scene graph container.
It does NOT depend on update order.

### Does WorldRoot assume scheduler is running?

**Answer:** NO.

WorldRoot has NO update() method.
It does NOT require scheduler.

---

## 6️⃣ POTENTIAL RISK FLAGS (NO FIXES, JUST FLAGS)

### Multiple entry into same phase possible?

**Answer:** YES - UNPROTECTED.

**Evidence:**
- No phase state flags (e.g., `this._inPhase1`)
- `createWorld()` can be called multiple times rapidly
- No protection against re-entry

**Example:**
```javascript
// If loadWorld() called twice quickly:
loadWorld('sigma')  // Phase 1→5 runs
loadWorld('desert') // Phase 1→5 runs AGAIN (no protection)
```

### Phase re-entrancy safe?

**Answer:** NO - NOT SAFE.

**Evidence:**
- No re-entrancy guards
- No state machine for phases
- Multiple simultaneous calls would cause race conditions

**Potential failure:**
- FrameScheduler resetLayer called mid-creation
- Old worldRoot removed while still in use
- AI nodes recreated while previous nodes still updating

### WorldRoot reused across maps?

**Answer:** NO - RECREATED every time.

**Evidence:**
```javascript
this.worldRoot = new THREE.Group();  // Always creates NEW instance
```

### Stale references possible?

**Answer:** YES - MEDIUM RISK.

**Evidence:**
- World instances overwritten (sigmaRift, dreamDesert, etc.) not disposed
- Link metadata may persist (from FRAME_SCHEDULER_LIFECYCLE_INTEGRITY_AUDIT.md)
- Event listeners not removed

**Stale reference example:**
```javascript
// Old world instance still referenced somewhere:
const oldWorld = this.sigmaRift;  // Stale reference after switch
this.sigmaRift = new SigmaRiftChamber(...);  // Overwritten
// oldWorld reference still valid but no longer in scene
```

### Lifecycle deterministic?

**Answer:** YES - DETERMINISTIC.

**Evidence:**
- Phases execute in fixed order (1→2→3→4→5)
- No conditional branching in lifecycle
- Same sequence every world switch

**BUT:**
- No protection against re-entrancy
- No state machine validation
- Deterministic but NOT re-entrancy-safe

---

## FINAL SUMMARY

### Is WorldRoot lifecycle clearly defined?

**Answer:** YES - 5 phases in fixed order.

1. Old world cleanup (loadWorld → worldResetFix)
2. Scheduler visual reset (createWorld → resetLayer)
3. Old worldRoot disposal (createWorld → scene.remove)
4. New worldRoot creation (createWorld → new THREE.Group)
5. World instance creation (createWorld → world-specific init)

### Is it isolated from scheduler?

**Answer:** YES - COMPLETELY ISOLATED.

- WorldRoot is passive THREE.Group
- Does NOT register scheduler systems
- Does NOT depend on scheduler tick order
- Does NOT assume scheduler is running

**Interaction:**
- FrameScheduler.resetLayer('visual') called in Phase 2
- This is UNIDIRECTIONAL (WorldRoot → Scheduler)
- No feedback from Scheduler to WorldRoot

### Is it safe to introduce a transition barrier above it?

**Answer:** YES - SAFE to introduce barrier.

**Reasoning:**
1. WorldRoot lifecycle is isolated from scheduler
2. WorldRoot has NO update() method
3. WorldRoot is passive scene graph container
4. Transition barrier would NOT break existing behavior
5. Barrier could protect against re-entrancy

**Where to place barrier:**
- Above `loadWorld()` entry
- Above `createWorld()` entry
- Wrap Phase 1 (scene cleanup) through Phase 5 (world creation)

---

## AUDIT DATE: 2026-02-26
## METHOD: Static code analysis (READ ONLY, MINIMAL)
## SOURCE: main.js, SafeWorldResetFix1_0.js

---

## EXECUTIVE SUMMARY

### WorldRoot Lifecycle: CLEARLY DEFINED (5 phases)
- Phase 1: Old world cleanup (loadWorld → worldResetFix)
- Phase 2: Scheduler visual reset (createWorld → resetLayer)
- Phase 3: Old worldRoot disposal (createWorld → scene.remove)
- Phase 4: New worldRoot creation (createWorld → new THREE.Group)
- Phase 5: World instance creation (createWorld → world-specific init)

### WorldReady Contract: IMPLICIT (no explicit flag)
- No `worldReady` boolean exists
- Ready state is implicit (completion of initialization pipeline)
- FrameScheduler does NOT depend on world-ready signal

### Scheduler Isolation: COMPLETE
- WorldRoot is passive THREE.Group (scene graph container)
- Does NOT register scheduler systems
- Unidirectional interaction (WorldRoot → Scheduler only via resetLayer)
- Does NOT depend on scheduler tick order

### Risk Flags:
- **Re-entrancy:** NOT SAFE (no protection)
- **WorldRoot reuse:** NO (always recreated)
- **Stale references:** YES - MEDIUM RISK (world instances not disposed)
- **Lifecycle deterministic:** YES (fixed order 1→2→3→4→5)

---

**READ-ONLY, MINIMAL AUDIT COMPLETE**
