# EXTRACTION PACK V1.2 — TECHNICAL REFERENCE

## NodeEditorRuntime_v1 API Documentation

**File:** `/NodeEditorRuntime_v1.js`  
**Version:** 1.2  
**Type:** ES6 Module (ESM)  
**Classification:** Orchestration Layer  

---

## CLASS: NodeEditorRuntime_v1

### Overview

Pure orchestration runtime for coordinating 14+ editor and UI interaction systems in ATOMA. Provides unified initialization, update, and disposal lifecycle management with per-system error isolation.

```javascript
import { NodeEditorRuntime_v1 } from './NodeEditorRuntime_v1.js';

const runtime = new NodeEditorRuntime_v1({ game: gameInstance });
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
2. Creates empty `this.editorSystems` registry object
3. Scans game object for all 14 editor systems
4. Registers each system found (null if not present)
5. Counts active systems
6. Logs warning if no systems available

### Errors Handled

- Game reference is null/undefined → Warning logged, continues
- Individual system references are null → Silently registered as null
- No systems found → Warning logged

### Returns

RuntimeEditorRuntime_v1 instance, ready for initialization

### Example

```javascript
const runtime = new NodeEditorRuntime_v1({
    game: this  // AtomaGame instance
});

// Runtime is ready but not initialized yet
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

Initializes all editor systems in dependency order. Each system's `init()` method is called independently with isolated error handling.

### Initialization Order

```
1. Foundation
   ├─ selectionCore
   └─ nodeLinking

2. Inspection
   ├─ nodeInspectPanel
   ├─ contextMenu
   └─ linguisticOverlay

3. Visual Feedback
   ├─ selectedNodeBadge
   ├─ selectedNodeHighlight
   ├─ selectedNodeLabel
   └─ selectedNodeTopBar

4. Primary Linking
   ├─ primaryNodeAura
   └─ primaryNodeTopBar

5. Status Display
   ├─ categoryLegend
   └─ emotionalFeed

6. Optional
   └─ debugHUD
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
[NodeEditorRuntime_v1] initialized ✓
```

**Failure:**
```
[NodeEditorRuntime_v1] init failed: <error>
```

**Per-System Failure:**
```
[NodeEditorRuntime_v1] <systemName>.init() failed: <error>
```

### Example

```javascript
runtime.init?.();
// Initializes all systems
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

Updates all editor systems each frame. Each system's `update(delta)` method is called independently with isolated error handling. Called automatically by main.js animate() method ~60 times per second.

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
[NodeEditorRuntime_v1] system update failed: <error>
```

**Outer Error:**
```
[NodeEditorRuntime_v1] update failed: <error>
```

### Performance

- Should execute in <0.5ms per frame
- No allocation, pure method calls
- Scales linearly with number of active systems

### Example

```javascript
// Called automatically in animate() loop:
this.nodeEditorRuntime_v1?.update?.(deltaTime);

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

Safely cleans up all editor systems in reverse initialization order. Each system's `dispose()` method is called independently with isolated error handling.

### Cleanup Order (Reverse of Init)

```
1. debugHUD
2. emotionalFeed
3. categoryLegend
4. primaryNodeTopBar
5. primaryNodeAura
6. selectedNodeTopBar
7. selectedNodeLabel
8. selectedNodeHighlight
9. selectedNodeBadge
10. linguisticOverlay
11. contextMenu
12. nodeInspectPanel
13. nodeLinking
14. selectionCore
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
[NodeEditorRuntime_v1] disposed ✓
```

**Failure:**
```
[NodeEditorRuntime_v1] dispose failed: <error>
```

**Per-System Failure:**
```
[NodeEditorRuntime_v1] <systemName>.dispose() failed: <error>
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
**Value:** Count of non-null editor systems (0-14)

### Description

Counts how many editor systems are currently available for orchestration. Does not count systems that are null.

### Performance

O(n) where n = 14 systems. Fast operation (<0.1ms).

### Example

```javascript
const count = runtime.getActiveSystemCount();
console.log(`${count} editor systems active`);
// Output: "12 editor systems active"
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

Lists all active (non-null) editor system names. Useful for debugging and introspection.

### Return Format

```javascript
[
    "selectionCore",
    "nodeLinking",
    "nodeInspectPanel",
    "contextMenu",
    "linguisticOverlay",
    "selectedNodeBadge",
    "selectedNodeHighlight",
    "selectedNodeLabel",
    "selectedNodeTopBar",
    "primaryNodeAura",
    "primaryNodeTopBar",
    "categoryLegend",
    "emotionalFeed"
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

Checks whether a specific editor system is currently active and available for orchestration.

### Valid System Names

- `selectionCore`
- `nodeLinking`
- `nodeInspectPanel`
- `contextMenu`
- `linguisticOverlay`
- `selectedNodeBadge`
- `selectedNodeHighlight`
- `selectedNodeLabel`
- `selectedNodeTopBar`
- `primaryNodeAura`
- `primaryNodeTopBar`
- `categoryLegend`
- `emotionalFeed`
- `debugHUD`

### Performance

O(1). Constant-time lookup.

### Example

```javascript
if (runtime.isSystemActive('selectionCore')) {
    console.log('Selection system is active');
}

if (!runtime.isSystemActive('debugHUD')) {
    console.log('Debug HUD is not available');
}
```

---

## EDITOR SYSTEMS REGISTRY

### System: selectionCore

**Type:** Core System  
**Optional:** No (required for editor)  
**Depends On:** NodeSelectionCore3_4  

Provides single source of truth for which node is currently selected.

```javascript
editorSystems.selectionCore?.init?.()
editorSystems.selectionCore?.update?.(delta)
editorSystems.selectionCore?.dispose?.()
```

### System: nodeLinking

**Type:** Core System  
**Optional:** No (required for editor)  
**Depends On:** NodeLinking2_3  

Manages dynamic link creation between nodes.

```javascript
editorSystems.nodeLinking?.init?.()
editorSystems.nodeLinking?.update?.(delta)
editorSystems.nodeLinking?.dispose?.()
```

### System: nodeInspectPanel

**Type:** Inspection System  
**Optional:** Yes  
**Depends On:** UINodeInspectPanel  

Displays detailed information about selected node.

```javascript
editorSystems.nodeInspectPanel?.init?.()
editorSystems.nodeInspectPanel?.update?.(delta)
editorSystems.nodeInspectPanel?.dispose?.()
```

### System: contextMenu

**Type:** Inspection System  
**Optional:** Yes  
**Depends On:** UINodeContextMenu  

Provides right-click context menu for node interactions.

```javascript
editorSystems.contextMenu?.init?.()
editorSystems.contextMenu?.update?.(delta)
editorSystems.contextMenu?.dispose?.()
```

### System: linguisticOverlay

**Type:** Inspection System  
**Optional:** Yes  
**Depends On:** NodeInspectLinguisticOverlay  

Displays semantic/linguistic information about selected node.

```javascript
editorSystems.linguisticOverlay?.init?.()
editorSystems.linguisticOverlay?.update?.(delta)
editorSystems.linguisticOverlay?.dispose?.()
```

### System: selectedNodeBadge

**Type:** Visual Feedback  
**Optional:** Yes  
**Depends On:** UISelectedNodeBadge3_2  

Shows selected node metrics badge (QNT-ORB-SYN) under crosshair.

```javascript
editorSystems.selectedNodeBadge?.init?.()
editorSystems.selectedNodeBadge?.update?.(delta)
editorSystems.selectedNodeBadge?.dispose?.()
```

### System: selectedNodeHighlight

**Type:** Visual Feedback  
**Optional:** Yes  
**Depends On:** UISelectedNodeHighlight3_2  

Renders pulsing highlight shader on selected node.

```javascript
editorSystems.selectedNodeHighlight?.init?.()
editorSystems.selectedNodeHighlight?.update?.(delta)
editorSystems.selectedNodeHighlight?.dispose?.()
```

### System: selectedNodeLabel

**Type:** Visual Feedback  
**Optional:** Yes  
**Depends On:** UISelectedNodeLabel3_3  

Displays floating text label above selected node.

```javascript
editorSystems.selectedNodeLabel?.init?.()
editorSystems.selectedNodeLabel?.update?.(delta)
editorSystems.selectedNodeLabel?.dispose?.()
```

### System: selectedNodeTopBar

**Type:** Visual Feedback  
**Optional:** Yes  
**Depends On:** UISelectedNodeTopBar3_4  

Shows HUD bar at top center displaying selected node information.

```javascript
editorSystems.selectedNodeTopBar?.init?.()
editorSystems.selectedNodeTopBar?.update?.(delta)
editorSystems.selectedNodeTopBar?.dispose?.()
```

### System: primaryNodeAura

**Type:** Primary Linking  
**Optional:** Yes  
**Depends On:** UIPrimaryNodeAura3_7  

Visual aura showing which node is the primary linking source (double-clicked).

```javascript
editorSystems.primaryNodeAura?.init?.()
editorSystems.primaryNodeAura?.update?.(delta)
editorSystems.primaryNodeAura?.dispose?.()
```

### System: primaryNodeTopBar

**Type:** Primary Linking  
**Optional:** Yes  
**Depends On:** UIPrimaryNodeTopBar3_7  

HUD bar displaying primary node information (double-click source).

```javascript
editorSystems.primaryNodeTopBar?.init?.()
editorSystems.primaryNodeTopBar?.update?.(delta)
editorSystems.primaryNodeTopBar?.dispose?.()
```

### System: categoryLegend

**Type:** Status Display  
**Optional:** Yes  
**Depends On:** UICategoryLegend3_1  

Reference panel showing all 14 node categories.

```javascript
editorSystems.categoryLegend?.init?.()
editorSystems.categoryLegend?.update?.(delta)
editorSystems.categoryLegend?.dispose?.()
```

### System: emotionalFeed

**Type:** Status Display  
**Optional:** Yes  
**Depends On:** AIEmotionalFeed3_1  

Poetic reflections of network mood and status.

```javascript
editorSystems.emotionalFeed?.init?.()
editorSystems.emotionalFeed?.update?.(delta)
editorSystems.emotionalFeed?.dispose?.()
```

### System: debugHUD

**Type:** Optional Debug  
**Optional:** Yes  
**Depends On:** AtomaDebugHUD_1_0  

In-game debug monitoring and diagnostics (optional).

```javascript
editorSystems.debugHUD?.init?.()
editorSystems.debugHUD?.update?.(delta)
editorSystems.debugHUD?.dispose?.()
```

---

## ERROR HANDLING PATTERNS

### Pattern 1: Safe Initialization

```javascript
try {
    this.nodeEditorRuntime_v1 = new NodeEditorRuntime_v1({ game: this });
    this.nodeEditorRuntime_v1.init?.();
    console.log('[main.js] NodeEditorRuntime_v1 initialized ✓');
} catch (err) {
    console.warn('[main.js] NodeEditorRuntime_v1 failed:', err);
}
```

### Pattern 2: Per-System Error Isolation (Internal)

```javascript
for (const [sysName, sys] of Object.entries(this.editorSystems)) {
    if (sys) {
        try {
            sys.init?.();
        } catch (e) {
            console.warn(`[NodeEditorRuntime_v1] ${sysName}.init() failed:`, e);
            // Continue with next system
        }
    }
}
```

### Pattern 3: Safe Update Call

```javascript
this.nodeEditorRuntime_v1?.update?.(deltaTime);
// No try-catch needed here (error isolation happens internally)
```

### Pattern 4: Safe Cleanup

```javascript
this.nodeEditorRuntime_v1?.dispose?.();
this.nodeEditorRuntime_v1 = null;
```

---

## LIFECYCLE DIAGRAM

```
┌─ Construction ─────────────────────────────────────────┐
│ new NodeEditorRuntime_v1({ game: this })               │
│  ├─ Register editor systems from game object           │
│  ├─ Count active systems                               │
│  └─ Ready for initialization                           │
└────────────────────────────────────────────────────────┘
                          ↓
┌─ Initialization ───────────────────────────────────────┐
│ runtime.init?.()                                        │
│  ├─ Call init() on foundation systems                  │
│  ├─ Call init() on inspection systems                  │
│  ├─ Call init() on visual feedback systems             │
│  ├─ Call init() on primary linking systems             │
│  ├─ Call init() on status display systems              │
│  ├─ Call init() on optional systems                    │
│  ├─ Error-isolated per system                          │
│  └─ Systems ready for updates                          │
└────────────────────────────────────────────────────────┘
                          ↓
┌─ Active Loop (Per Frame) ──────────────────────────────┐
│ runtime.update?.(deltaTime)                             │
│  ├─ Update all systems with deltaTime                  │
│  ├─ Handle selection, linking, UI updates              │
│  ├─ Error-isolated per system                          │
│  └─ Repeat every frame (~60 FPS)                       │
└────────────────────────────────────────────────────────┘
                          ↓
┌─ Cleanup/Transition ───────────────────────────────────┐
│ runtime.dispose?.()                                     │
│  ├─ Call dispose() on systems in reverse order         │
│  ├─ Error-isolated per system                          │
│  ├─ Clean up all resources                             │
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

- [x] Console shows "[main.js] NodeEditorRuntime_v1 initialized ✓"
- [x] Editor systems respond normally
- [x] Selection/linking works as before
- [x] World switching (M key) cleans up and reinitializes properly
- [x] No new console errors

### Troubleshooting

**Issue:** "[main.js] NodeEditorRuntime_v1 failed" in console

**Solution:** Check that game reference is valid and all editor systems are properly initialized before NodeEditorRuntime_v1.

**Issue:** One editor system not working

**Solution:** Check per-system error logs. NodeEditorRuntime_v1 will have logged which system failed.

**Issue:** All editor systems not working after world switch

**Solution:** Verify switchMode() includes disposal of NodeEditorRuntime_v1 and reinitialization in new world.

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

---

**Document Version:** 1.2  
**Last Updated:** Current Session  
**Status:** Complete
