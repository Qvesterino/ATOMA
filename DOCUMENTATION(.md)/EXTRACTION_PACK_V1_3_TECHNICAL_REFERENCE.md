# EXTRACTION PACK V1.3 — TECHNICAL REFERENCE

## InputRuntime_v1 API Documentation

**File:** `/InputRuntime_v1.js`  
**Version:** 1.3  
**Type:** ES6 Module (ESM)  
**Classification:** Orchestration Layer  

---

## CLASS: InputRuntime_v1

### Overview

Pure orchestration runtime for coordinating 14+ input handling systems in ATOMA. Provides unified initialization, update, and disposal lifecycle management with per-system error isolation, global key state tracking, and modifier detection helpers.

```javascript
import { InputRuntime_v1 } from './InputRuntime_v1.js';

const runtime = new InputRuntime_v1({ game: gameInstance });
runtime.init?.();
```

---

## CONSTRUCTOR

### Signature

```javascript
constructor({ game })
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `game` | Object | Yes* | Reference to main.js AtomaGame instance |

*Optional in practice (null-safe). Warning logged if missing.

### Behavior

1. Stores game reference in `this.game`
2. Creates empty `this.inputSystems` registry object
3. Creates empty `this.keyState` tracking object
4. Stores event handler function references
5. Ready for initialization

### Errors Handled

- Game reference is null/undefined → Warning logged, continues
- Individual system references are null → Silently registered as null
- No systems found → Warning logged

### Returns

InputRuntime_v1 instance, ready for initialization

### Example

```javascript
const runtime = new InputRuntime_v1({
    game: this  // AtomaGame instance
});

console.log(runtime.getActiveSystemCount());  // Returns number of available systems
```

---

## METHOD: init()

### Signature

```javascript
init()
```

### Parameters

None

### Description

Initializes all input systems in dependency order. Collects available systems, initializes them in priority, and attaches global keyboard listeners.

### Initialization Order

```
1. Keyboard Foundation
   ├─ keyboard
   ├─ hotkeyManager
   └─ debugHotkeyLayer

2. Editor Keyboard (depends on keyboard)
   └─ editorKeyboardControls

3. Mouse Foundation
   ├─ mouse
   └─ pointer

4. Editor Interactions (depends on mouse + keyboard)
   ├─ dragController
   ├─ linkCreationController
   ├─ contextMenu
   ├─ nodeHoverInspector
   └─ selectionInput

5. Camera (independent but benefits from keyboard)
   ├─ cameraOrbitControls
   ├─ cameraPanControls
   └─ cameraZoomControls
```

### Error Handling

- Outer try-catch: Catches if init() itself throws
- Per-system try-catch: Catches if any system.init() throws
- Error isolation: One system failure doesn't affect others
- Logging: Each error logged with system name

### Return Value

None. Check console for success message.

### Console Output

**Success:**
```
[InputRuntime_v1] initialized ✓
```

**Failure:**
```
[InputRuntime_v1] init failed: <error>
```

**Per-System Failure:**
```
[InputRuntime_v1] <systemName>.init() failed: <error>
```

### Example

```javascript
runtime.init?.();
// Initializes all systems
// Attaches global keyboard listeners
// Check console for success or any per-system failures
```

---

## METHOD: update(delta)

### Signature

```javascript
update(delta)
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `delta` | number | Yes | Time delta since last frame (seconds) |

### Description

Updates all input systems each frame. Each system's `update(delta)` method is called independently with isolated error handling. Called automatically by main.js animate() method ~60 times per second.

### Error Handling

- Outer try-catch: Catches if update() itself throws
- Per-system try-catch: Catches if any system.update() throws
- Error isolation: One system failure doesn't stop other updates
- Logging: Each error logged with system name

### Return Value

None

### Console Output

**Per-System Error (if caught):**
```
[InputRuntime_v1] system update failed: <error>
```

**Outer Error:**
```
[InputRuntime_v1] update failed: <error>
```

### Performance

- Should execute in <0.5ms per frame
- No allocation, pure method calls
- Scales linearly with number of active systems

### Example

```javascript
// Called automatically in animate() loop:
this.inputRuntime_v1?.update?.(deltaTime);

// Can be called manually if needed:
const deltaTime = 0.016;  // 60 FPS
runtime.update?.(deltaTime);
```

---

## METHOD: dispose()

### Signature

```javascript
dispose()
```

### Parameters

None

### Description

Safely cleans up all input systems in reverse initialization order. Detaches global listeners first, then disposes systems, then clears key state.

### Cleanup Order (Reverse of Init)

```
1. Detach global listeners (keydown, keyup)
2. Camera systems
   ├─ cameraZoomControls
   ├─ cameraPanControls
   └─ cameraOrbitControls
3. Editor interactions
   ├─ selectionInput
   ├─ nodeHoverInspector
   ├─ contextMenu
   ├─ linkCreationController
   └─ dragController
4. Mouse systems
   ├─ pointer
   └─ mouse
5. Keyboard systems
   ├─ editorKeyboardControls
   ├─ debugHotkeyLayer
   ├─ hotkeyManager
   └─ keyboard
6. Clear key state
```

### Error Handling

- Outer try-catch: Catches if dispose() itself throws
- Per-system try-catch: Catches if any system.dispose() throws
- Error isolation: One system failure doesn't stop cleanup of others
- Logging: Each error logged with system name

### Return Value

None

### Console Output

**Success:**
```
[InputRuntime_v1] disposed ✓
```

**Failure:**
```
[InputRuntime_v1] dispose failed: <error>
```

**Per-System Failure:**
```
[InputRuntime_v1] <systemName>.dispose() failed: <error>
```

### Example

```javascript
// Called automatically on world switch (switchMode):
runtime.dispose?.();
runtime = null;

// Can be called manually if needed:
if (runtime) {
    runtime.dispose?.();
    runtime = null;
}
```

---

## METHOD: getActiveSystemCount()

### Signature

```javascript
getActiveSystemCount()
```

### Parameters

None

### Returns

**Type:** number  
**Value:** Count of non-null input systems (0-14)

### Description

Counts how many input systems are currently available for orchestration. Does not count systems that are null.

### Performance

O(n) where n = 14 systems. Fast operation (<0.1ms).

### Example

```javascript
const count = runtime.getActiveSystemCount();
console.log(`${count} input systems active`);
// Output: "12 input systems active"
```

---

## METHOD: getActiveSystemNames()

### Signature

```javascript
getActiveSystemNames()
```

### Parameters

None

### Returns

**Type:** string[]  
**Value:** Array of active system names

### Description

Lists all active (non-null) input system names. Useful for debugging and introspection.

### Return Format

```javascript
[
    "keyboard",
    "mouse",
    "dragController",
    "cameraOrbitControls",
    // ... other active systems
]
```

### Performance

O(n) where n = 14 systems. Fast operation (<0.1ms).

### Example

```javascript
const systems = runtime.getActiveSystemNames();
systems.forEach(name => {
    console.log(`- ${name}`);
});
```

---

## METHOD: isSystemActive(systemName)

### Signature

```javascript
isSystemActive(systemName)
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `systemName` | string | Yes | Name of system to check |

### Returns

**Type:** boolean  
**Value:** true if system is active, false if null or not found

### Description

Checks whether a specific input system is currently active and available for orchestration.

### Valid System Names

**Keyboard:**
- `keyboard`
- `hotkeyManager`
- `editorKeyboardControls`
- `debugHotkeyLayer`

**Mouse/Pointer:**
- `mouse`
- `pointer`

**Editor Input:**
- `dragController`
- `linkCreationController`
- `contextMenu`
- `nodeHoverInspector`
- `selectionInput`

**Camera:**
- `cameraOrbitControls`
- `cameraPanControls`
- `cameraZoomControls`

### Performance

O(1). Constant-time lookup.

### Example

```javascript
if (runtime.isSystemActive('keyboard')) {
    console.log('Keyboard system is active');
}

if (!runtime.isSystemActive('debugHotkeyLayer')) {
    console.log('Debug hotkeys not available');
}
```

---

## PROPERTY: keyState

### Type

Object (key-value store)

### Description

Global key state registry tracking which keys are currently pressed. Updated each frame from keyboard input events.

### Structure

```javascript
{
    'Shift': true,
    'Control': false,
    'a': true,
    'b': false,
    'code:KeyA': true,
    'code:KeyB': false,
    // ...
}
```

### Tracking

- Keys tracked by name (e.g., 'Shift', 'Control', 'a', 'b')
- Codes tracked with 'code:' prefix (e.g., 'code:KeyA', 'code:ShiftLeft')
- Both updated simultaneously for redundancy
- Cleared on dispose()

### Direct Access

```javascript
// Check if shift is pressed
const shiftDown = runtime.keyState['Shift'];

// Check if 'a' key is pressed
const aDown = runtime.keyState['a'];

// Check by key code
const aCodeDown = runtime.keyState['code:KeyA'];
```

### Performance

O(1). Constant-time lookup.

---

## METHOD: isKeyPressed(key)

### Signature

```javascript
isKeyPressed(key)
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | Yes | Key name or code to check |

### Returns

**Type:** boolean  
**Value:** true if key is currently pressed, false otherwise

### Description

Convenience method to check if a specific key is currently pressed. Queries keyState directly.

### Key Names

- Modifier keys: 'Shift', 'Control', 'Alt', 'Meta'
- Single char: 'a', 'b', 'c', ..., 'z'
- Numbers: '0', '1', '2', ..., '9'
- Special: ' ' (space), 'Enter', 'Escape', etc.

### Key Codes

- Format: 'code:' + code (e.g., 'code:KeyA', 'code:ShiftLeft')
- Useful for location-specific keys

### Performance

O(1). Constant-time lookup.

### Example

```javascript
if (runtime.isKeyPressed('a')) {
    console.log('A key is pressed');
}

if (runtime.isKeyPressed('Enter')) {
    console.log('Enter key is pressed');
}

// Check by code
if (runtime.isKeyPressed('code:KeyA')) {
    console.log('Physical A key is pressed');
}
```

---

## METHOD: isModifierActive(modifier)

### Signature

```javascript
isModifierActive(modifier)
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `modifier` | string | Yes | Modifier name: 'shift', 'ctrl', 'alt', 'meta' |

### Returns

**Type:** boolean  
**Value:** true if modifier is currently active, false otherwise

### Description

Checks whether a modifier key is currently pressed. Case-insensitive with aliases.

### Supported Modifiers

| Name | Aliases | Checks |
|------|---------|--------|
| 'shift' | (none) | Shift key |
| 'ctrl' | 'control' | Control key |
| 'alt' | (none) | Alt key |
| 'meta' | (none) | Meta/Windows key |

### Behavior

- Case-insensitive: 'Shift', 'SHIFT', 'shift' all work
- Unknown modifiers return false
- No exceptions thrown

### Performance

O(1). Constant-time lookup via switch statement.

### Example

```javascript
if (runtime.isModifierActive('shift')) {
    console.log('Shift is pressed');
}

if (runtime.isModifierActive('ctrl')) {
    console.log('Control is pressed');
}

// Can use alias
if (runtime.isModifierActive('control')) {
    console.log('Control is pressed (via alias)');
}

// Check multiple modifiers
if (runtime.isModifierActive('shift') && runtime.isModifierActive('ctrl')) {
    console.log('Shift + Ctrl pressed');
}
```

---

## INPUT SYSTEMS REGISTRY

### Keyboard Systems

#### System: keyboard

**Type:** Keyboard Foundation  
**Optional:** Yes  
**Purpose:** Global keyboard handler

```javascript
inputSystems.keyboard?.init?.()
inputSystems.keyboard?.update?.(delta)
inputSystems.keyboard?.dispose?.()
```

#### System: hotkeyManager

**Type:** Keyboard Foundation  
**Optional:** Yes  
**Purpose:** Keyboard shortcuts and hotkeys

```javascript
inputSystems.hotkeyManager?.init?.()
inputSystems.hotkeyManager?.update?.(delta)
inputSystems.hotkeyManager?.dispose?.()
```

#### System: editorKeyboardControls

**Type:** Editor Keyboard  
**Optional:** Yes  
**Purpose:** Editor-specific keyboard input

```javascript
inputSystems.editorKeyboardControls?.init?.()
inputSystems.editorKeyboardControls?.update?.(delta)
inputSystems.editorKeyboardControls?.dispose?.()
```

#### System: debugHotkeyLayer

**Type:** Keyboard Foundation  
**Optional:** Yes  
**Purpose:** Debug mode keyboard shortcuts

```javascript
inputSystems.debugHotkeyLayer?.init?.()
inputSystems.debugHotkeyLayer?.update?.(delta)
inputSystems.debugHotkeyLayer?.dispose?.()
```

### Mouse/Pointer Systems

#### System: mouse

**Type:** Mouse Foundation  
**Optional:** Yes  
**Purpose:** Mouse tracking and basic input

```javascript
inputSystems.mouse?.init?.()
inputSystems.mouse?.update?.(delta)
inputSystems.mouse?.dispose?.()
```

#### System: pointer

**Type:** Mouse Foundation  
**Optional:** Yes  
**Purpose:** Pointer/device tracking

```javascript
inputSystems.pointer?.init?.()
inputSystems.pointer?.update?.(delta)
inputSystems.pointer?.dispose?.()
```

### Editor Input Systems

#### System: dragController

**Type:** Editor Interaction  
**Optional:** Yes  
**Depends On:** mouse/pointer  
**Purpose:** Node dragging interaction

```javascript
inputSystems.dragController?.init?.()
inputSystems.dragController?.update?.(delta)
inputSystems.dragController?.dispose?.()
```

#### System: linkCreationController

**Type:** Editor Interaction  
**Optional:** Yes  
**Depends On:** mouse  
**Purpose:** Link creation interactions

```javascript
inputSystems.linkCreationController?.init?.()
inputSystems.linkCreationController?.update?.(delta)
inputSystems.linkCreationController?.dispose?.()
```

#### System: contextMenu

**Type:** Editor Interaction  
**Optional:** Yes  
**Depends On:** mouse/keyboard  
**Purpose:** Right-click menu activation

```javascript
inputSystems.contextMenu?.init?.()
inputSystems.contextMenu?.update?.(delta)
inputSystems.contextMenu?.dispose?.()
```

#### System: nodeHoverInspector

**Type:** Editor Interaction  
**Optional:** Yes  
**Depends On:** mouse  
**Purpose:** Hover-based node inspection

```javascript
inputSystems.nodeHoverInspector?.init?.()
inputSystems.nodeHoverInspector?.update?.(delta)
inputSystems.nodeHoverInspector?.dispose?.()
```

#### System: selectionInput

**Type:** Editor Interaction  
**Optional:** Yes  
**Depends On:** mouse/keyboard  
**Purpose:** Node selection input handling

```javascript
inputSystems.selectionInput?.init?.()
inputSystems.selectionInput?.update?.(delta)
inputSystems.selectionInput?.dispose?.()
```

### Camera Control Systems

#### System: cameraOrbitControls

**Type:** Camera Control  
**Optional:** Yes  
**Purpose:** Camera rotation controls

```javascript
inputSystems.cameraOrbitControls?.init?.()
inputSystems.cameraOrbitControls?.update?.(delta)
inputSystems.cameraOrbitControls?.dispose?.()
```

#### System: cameraPanControls

**Type:** Camera Control  
**Optional:** Yes  
**Purpose:** Camera panning controls

```javascript
inputSystems.cameraPanControls?.init?.()
inputSystems.cameraPanControls?.update?.(delta)
inputSystems.cameraPanControls?.dispose?.()
```

#### System: cameraZoomControls

**Type:** Camera Control  
**Optional:** Yes  
**Purpose:** Camera zoom controls

```javascript
inputSystems.cameraZoomControls?.init?.()
inputSystems.cameraZoomControls?.update?.(delta)
inputSystems.cameraZoomControls?.dispose?.()
```

---

## ERROR HANDLING PATTERNS

### Pattern 1: Safe Initialization

```javascript
try {
    this.inputRuntime_v1 = new InputRuntime_v1({ game: this });
    this.inputRuntime_v1.init?.();
    console.log('[main.js] InputRuntime_v1 initialized ✓');
} catch (err) {
    console.warn('[main.js] InputRuntime_v1 failed:', err);
}
```

### Pattern 2: Per-System Error Isolation (Internal)

```javascript
for (const [sysName, sys] of Object.entries(this.inputSystems)) {
    if (sys) {
        try {
            sys.init?.();
        } catch (e) {
            console.warn(`[InputRuntime_v1] ${sysName}.init() failed:`, e);
            // Continue with next system
        }
    }
}
```

### Pattern 3: Safe Update Call

```javascript
this.inputRuntime_v1?.update?.(deltaTime);
// No try-catch needed here (error isolation happens internally)
```

### Pattern 4: Safe Cleanup

```javascript
this.inputRuntime_v1?.dispose?.();
this.inputRuntime_v1 = null;
```

### Pattern 5: Event Handler Storage

```javascript
this._keyDownHandler = (e) => this._onKeyDown(e);
this._keyUpHandler = (e) => this._onKeyUp(e);

// Later...
window.addEventListener('keydown', this._keyDownHandler);
window.removeEventListener('keydown', this._keyDownHandler);
// Exact reference ensures proper removal
```

---

## LIFECYCLE DIAGRAM

```
┌─ Construction ─────────────────────────────────────────┐
│ new InputRuntime_v1({ game: this })                    │
│  ├─ Register input systems from game object            │
│  ├─ Initialize key state tracker                       │
│  ├─ Store event handler references                     │
│  └─ Ready for initialization                           │
└────────────────────────────────────────────────────────┘
                          ↓
┌─ Initialization ───────────────────────────────────────┐
│ runtime.init?.()                                        │
│  ├─ Collect input systems                              │
│  ├─ Initialize foundation keyboard systems             │
│  ├─ Initialize editor keyboard systems                 │
│  ├─ Initialize foundation mouse systems                │
│  ├─ Initialize editor interaction systems              │
│  ├─ Initialize camera control systems                  │
│  ├─ Error-isolated per system                          │
│  ├─ Attach global keyboard listeners                   │
│  └─ Systems ready for updates                          │
└────────────────────────────────────────────────────────┘
                          ↓
┌─ Active Loop (Per Frame) ──────────────────────────────┐
│ runtime.update?.(deltaTime)                             │
│  ├─ Update all systems with deltaTime                  │
│  ├─ Handle keyboard input                              │
│  ├─ Handle mouse input                                 │
│  ├─ Handle editor interactions                         │
│  ├─ Handle camera controls                             │
│  ├─ Error-isolated per system                          │
│  └─ Repeat every frame (~60 FPS)                       │
└────────────────────────────────────────────────────────┘
                          ↓
┌─ Cleanup/Transition ───────────────────────────────────┐
│ runtime.dispose?.()                                     │
│  ├─ Detach global keyboard listeners                   │
│  ├─ Call dispose() on systems in reverse order         │
│  ├─ Error-isolated per system                          │
│  ├─ Clear key state                                    │
│  └─ Ready for reinitialization                         │
└────────────────────────────────────────────────────────┘
                          ↓
┌─ Nullification ────────────────────────────────────────┐
│ runtime = null                                          │
│  ├─ Garbage collect runtime                            │
│  └─ New runtime can be created                         │
└────────────────────────────────────────────────────────┘
```

---

## INTEGRATION CHECKLIST FOR DEVELOPERS

### Before Using

- [x] Import statement added to main.js
- [x] Constructor field initialized in AtomaGame constructor
- [x] Initialization block added to createAINodes()
- [x] Update call added to animate() loop
- [x] Cleanup block added to switchMode()

### After Using

- [x] Console shows "[main.js] InputRuntime_v1 initialized ✓"
- [x] All input systems respond normally
- [x] Keyboard input works as before
- [x] Mouse input works as before
- [x] Camera controls work as before
- [x] World switching (M key) cleans up and reinitializes properly
- [x] No new console errors

### Troubleshooting

**Issue:** "[main.js] InputRuntime_v1 failed" in console

**Solution:** Check that game reference is valid and all input systems are properly initialized before InputRuntime_v1.

**Issue:** One input system not working

**Solution:** Check per-system error logs. InputRuntime_v1 will have logged which system failed.

**Issue:** Key state not updating

**Solution:** Verify global keyboard listeners were attached (check for try-catch failures in _attachGlobalListeners).

**Issue:** All input systems not working after world switch

**Solution:** Verify switchMode() includes disposal of InputRuntime_v1 and reinitialization in new world.

---

## PERFORMANCE CHARACTERISTICS

| Operation | Time Complexity | Typical Duration |
|-----------|-----------------|------------------|
| Construction | O(1) | <1ms |
| init() | O(n) | ~5-10ms (n=14 systems) |
| update(delta) | O(n) | <0.5ms per frame |
| dispose() | O(n) | ~5-10ms |
| getActiveSystemCount() | O(n) | <0.1ms |
| getActiveSystemNames() | O(n) | <0.1ms |
| isSystemActive() | O(1) | <0.01ms |
| isKeyPressed() | O(1) | <0.01ms |
| isModifierActive() | O(1) | <0.01ms |
| keyState lookup | O(1) | <0.01ms |

---

**Document Version:** 1.3  
**Last Updated:** Current Session  
**Status:** Complete
