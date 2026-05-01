# RUNTIME BREAKPOINT INSTRUCTIONS
## Torus/Ring Geometry Source Tracker

**Purpose:** Runtime intercept to identify the exact source of TorusGeometry and RingGeometry additions to the scene.

---

## Setup

### 1. Injection Complete ✅

The breakpoint interceptor has been injected into `main.js` (lines 63-72):

```javascript
const _add = THREE.Object3D.prototype.add;
THREE.Object3D.prototype.add = function(obj) {
    if (
        obj?.geometry?.type === 'TorusGeometry' ||
        obj?.geometry?.type === 'RingGeometry'
    ) {
        debugger;
    }
    return _add.call(this, obj);
};
```

**Location:** After `window.THREE = THREE` assignment, before any scene initialization.
**Scope:** Intercepts ALL Object3D additions (Scene, Group, Mesh, etc.) — not just Scene.

---

### 2. How to Use

#### Chrome / Edge / Firefox DevTools

1. **Open DevTools**
   - Chrome/Edge: `F12` or `Ctrl+Shift+I`
   - Firefox: `F12` or `Ctrl+Shift+I`

2. **Enable Pause on Debugger**
   - Chrome/Edge: `Ctrl+\` (or click "Pause" icon in top-right)
   - Firefox: `Ctrl+Shift+S` (or click "Pause" icon)
   
   *The debugger statement will trigger a pause when hit.*

3. **Reload the Page**
   - `F5` or `Ctrl+R`
   - With DevTools open and "Pause" enabled

4. **Execution Will Pause**
   - When any TorusGeometry or RingGeometry is added to the scene
   - The debugger will stop at the `debugger;` statement

5. **Inspect the Call Stack**
   - Look at the "Call Stack" panel in DevTools
   - Expand each frame to see:
     - **File name** (e.g., `AINodes.js`, `CorruptionVisualFX_v1.js`)
     - **Function name** (e.g., `createNode`, `applyCorruptionEffects`)
     - **Line number** (exact line of `scene.add()` call)

6. **Identify the Source**
   - Top of stack = where `scene.add()` was called
   - Follow the chain down to find the originating system
   - Check local variables to see which object is being added

---

## Expected Output

When the breakpoint hits, you will see:

### Call Stack Example
```
(anonymous) @ main.js:52          ← debugger statement
Scene.add @ main.js:50          ← our interceptor
_createNodeVisuals @ AINodes.js:2278  ← where geometry is created
createNode @ AINodes.js:1883    ← node creation
update @ AINodes.js:2980        ← main update loop
```

### Key Information to Capture

1. **Source File:** Which .js file called `scene.add()`
2. **Function Name:** Which function performed the addition
3. **Line Number:** Exact line of the `scene.add()` call
4. **Object Details:**
   - `obj.geometry.type` (TorusGeometry or RingGeometry)
   - `obj.name` (if set)
   - `obj.userData` (system identifiers)
5. **Call Chain:** Full stack trace showing how we got there

---

## What This Reveals

### The Multi-Effect Geometry Sources

Based on the forensic audit, Torus/Ring geometries are created by:

1. **CorruptionVisualFX_v1** — Corruption rings (corona effects)
2. **LinkCorruptionTransmission_v1** — Expanding rings (cascade visualization)
3. **HarmonyStabilization** — Healing halos (blue-cyan rings)
4. **T2_CorruptionVisualIntegration_v1** — Chaos particle rings
5. **AINodes.js** — Orbit rings (node decoration)

### Which One Is It?

The breakpoint will tell you exactly which system is adding geometry at runtime:

- If it's **CorruptionVisualFX_v1** → corruption ≥ 0.7 on nodes
- If it's **LinkCorruptionTransmission_v1** → cascade thresholds hit
- If it's **HarmonyStabilization** → harmony ≥ 0.85
- If it's **T2_CorruptionVisualIntegration_v1** → particle burst
- If it's **AINodes.js** → node decoration (orbit rings)

---

## Verification Steps

### Test 1: Breakpoint Triggers
```
1. Open DevTools
2. Enable "Pause on debugger" (Ctrl+\)
3. Reload page
4. Result: Execution pauses at debugger statement
```

### Test 2: Identify Source
```
1. When paused, check Call Stack
2. Look at top frame (after debugger)
3. Identify file and function
4. Result: Clear source identification
```

### Test 3: Multiple Hits
```
1. Continue execution (F8)
2. More torus/ring additions will trigger again
3. Each hit shows different source
4. Result: All geometry sources identified
```

---

## Runtime Behavior

### With Breakpoint Enabled
- Execution pauses on every Torus/Ring addition
- Can step through code (F10/F11)
- Can inspect variables
- Can continue (F8) to next hit

### Without Breakpoint
- Remove or comment out the `debugger;` statement
- Or disable "Pause on debugger" in DevTools
- Code runs normally, no interruption

---

## Troubleshooting

### Breakpoint Not Triggering?

1. **DevTools not open** → Open DevTools before reload
2. **Pause disabled** → Enable "Pause on debugger" (Ctrl+\)
3. **Cached code** → Hard reload (Ctrl+F5)
4. **No torus/ring added** → Check if corruption levels are high enough

### Too Many Hits?

- Each geometry addition triggers the breakpoint
- Continue (F8) to skip to the next one
- Focus on the first few hits to identify the main source

### Can't See Call Stack?

- Make sure DevTools is in "Sources" tab
- Check the "Call Stack" panel on the right
- Expand frames to see details

---

## Cleanup

### Remove the Interceptor

Comment out or remove lines 63-72 in `main.js`:

```javascript
// const _add = THREE.Object3D.prototype.add;
// THREE.Object3D.prototype.add = function(obj) {
//     if (
//         obj?.geometry?.type === 'TorusGeometry' ||
//         obj?.geometry?.type === 'RingGeometry'
//     ) {
//         debugger;
//     }
//     return _add.call(this, obj);
// };
```

### Or Disable Temporarily

```javascript
const _add = THREE.Object3D.prototype.add;
THREE.Object3D.prototype.add = function(obj) {
    // if (obj?.geometry?.type === 'TorusGeometry' || ...) {
    //     debugger;
    // }
    return _add.call(this, obj);
};
```

---

## Summary

✅ **Interceptor Injected** — `main.js` lines 63-72
✅ **Scope:** Object3D.prototype (all 3D objects, not just Scene)
✅ **No console.log** — Pure debugger breakpoint
✅ **No refactor** — Minimal injection
✅ **Runtime only** — No permanent changes
✅ **Precise source identification** — Full stack trace

**Next Step:** Open DevTools, enable "Pause on debugger", reload, and inspect the call stack when execution pauses.

---

**Status:** ✅ READY TO RUN
**Date:** 2026-05-01
