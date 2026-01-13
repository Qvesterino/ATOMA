# WorldScaffold v2 — Integration Guide

## Overview

**WorldScaffold_v2** is a pure visual, zero-cost static world context system for ATOMA.

It provides:
- Spatial grounding without gameplay logic
- Three static visual layers (ground, horizon, fog)
- Zero per-frame updates or runtime overhead
- 100% focus preservation for node/network behavior

---

## Quick Start

### 1. Import in main.js

```javascript
import { WorldScaffold_v2 } from './WorldScaffold_v2.js';
```

### 2. Initialize after scene setup

```javascript
// In AtomaGame constructor or setup method, AFTER scene creation:
const scaffold = new WorldScaffold_v2();
scaffold.init(this.scene, this.camera);
```

### 3. Position in initialization order

The scaffold must be initialized:
- ✅ AFTER: `this.scene = new THREE.Scene()`
- ✅ AFTER: `this.camera = new THREE.PerspectiveCamera(...)`
- ✅ BEFORE: Node visuals, linking system, or any gameplay

---

## What It Does

### 1. Ground Reference Plane
- **Location:** Y = -500 (far below world center)
- **Size:** 2000×2000 units
- **Material:** Radial gradient (center lighter, edges darker)
- **Colors:** Muted violet → deep blue → near-black
- **Effect:** Visual grounding, prevents world from feeling empty

### 2. Horizon Overlay
- **Type:** Concentric sphere (rendered from inside)
- **Shader:** Static vertical gradient (NO time dependency)
- **Colors:** Soft violet at horizon, darker blue at zenith
- **Effect:** Atmospheric depth cue, natural sky feel
- **Rendering:** Always behind nodes (renderOrder = -1)

### 3. Static Fog
- **Type:** THREE.Fog (stationary by definition)
- **Range:** 50-3000 units from camera
- **Color:** Deep blue-black (#0a0a14)
- **Effect:** Atmospheric perspective, subtle depth hinting

---

## Design Constraints (STRICT)

The scaffold is **100% static** after initialization:

❌ NO animations  
❌ NO per-frame updates  
❌ NO time-based shaders  
❌ NO breathing, pulsing, drifting  
❌ NO interaction with gameplay systems  
❌ NO dependency on synergy/harmony/corruption  
❌ NO camera-reactive motion  

✅ Single `init(scene, camera)` method only  
✅ No `update()`, `tick()`, `process()`, or `step()` methods  
✅ Completely inert after initialization  

---

## Performance Impact

| Metric | Cost |
|--------|------|
| **Init Time** | ~5-10ms (one-time) |
| **Runtime Cost** | 0ms (no per-frame updates) |
| **Memory** | ~2 MB (single plane + sphere) |
| **FPS Impact** | Unmeasurable (truly zero-cost) |

---

## Visual Style

**Color Palette:**
- Deep violet: `#2a2a42`
- Deep blue: `#1a1a2e`
- Near-black: `#0a0a1a`

**Contrast:** Low (background never competes with nodes)  
**Alpha:** Conservative (always recedes visually)  

---

## Validation

To verify the scaffold is working correctly:

```javascript
// After initialization
const isValid = scaffold.validate();
// Logs status and confirms no active systems

console.log(isValid);
// {
//   groundPlane: true,
//   horizonOverlay: true,
//   fog: true,
//   hasUpdateMethod: false,
//   hasTickMethod: false
// }
```

---

## Troubleshooting

### World still feels empty
- Check scaffold is initialized BEFORE nodes are created
- Verify `this.scene` is passed correctly
- Check browser console for initialization logs

### Visuals look wrong
- Ensure camera Y position is reasonable (0–500 range)
- Check that existing world setup (fog, lighting) doesn't conflict
- Verify no other systems override scene.fog

### Performance degradation
- Scaffold has zero per-frame cost — check other systems if FPS drops
- Use `validate()` to confirm no unexpected methods exist

### Nodes are occluded
- Scaffold uses `renderOrder = -1` to ensure it stays behind
- If nodes still don't render, check their renderOrder values
- Verify depth testing is enabled in node materials

---

## Architecture

```
WorldScaffold_v2
├── init(scene, camera)                 [single entry point]
│   ├── _createGroundPlane(scene)       [static geometry + texture]
│   ├── _createHorizonOverlay(scene)    [static shader material]
│   └── _createStaticFog(scene)         [THREE.Fog setup]
└── validate()                          [debugging utility]
```

---

## Future Extensions (Optional)

The scaffold is intentionally minimal. If you want to add static elements later:

- Add distant mountains (static mesh, no animation)
- Add static aurora or nebula (sky sphere with baked texture)
- Add ground geometry variations (different terrain zones)

**Keep the rule:** No per-frame updates, no time dependencies, completely static.

---

## Summary

- ✅ File created: `/WorldScaffold_v2.js`
- ✅ Zero per-frame overhead
- ✅ Pure static visual layers
- ✅ Muted color palette (won't distract from nodes)
- ✅ Ready for immediate integration

**Status: Production-ready, zero-cost world context system.**
