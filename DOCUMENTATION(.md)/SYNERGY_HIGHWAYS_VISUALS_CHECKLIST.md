# SynergyHighwayVisuals3D_1_0 — Integration Checklist

Quick checklist for copy-paste integration into main.js.

---

## Pre-Integration

- [ ] SynergyHighways2_0 is already implemented
- [ ] SynergyHighways2_0 is initialized and working
- [ ] window.synergyHighways is available
- [ ] Three.js scene, camera, renderer ready

---

## Integration Steps

### Step 1: Copy File
- [ ] Copy `SynergyHighwayVisuals3D_1_0.js` to project root

### Step 2: Import (main.js, top)
```javascript
import { SynergyHighwayVisuals3D_1_0 } from './SynergyHighwayVisuals3D_1_0.js';
```
- [ ] Add import line

### Step 3: Initialize (after scene creation)
```javascript
SynergyHighwayVisuals3D_1_0.init(scene, camera, renderer, window.synergyHighways);
window.synergyHighwayVisuals = SynergyHighwayVisuals3D_1_0;
```
- [ ] Add initialization call
- [ ] Store reference in window

### Step 4: Update Loop (in animate function)
```javascript
// Every frame
SynergyHighwayVisuals3D_1_0.update(deltaTime);

// Periodically (e.g., every 10 frames)
if (frameCount++ % 10 === 0) {
  SynergyHighwayVisuals3D_1_0.refreshFromHighways();
}
```
- [ ] Add update call (every frame)
- [ ] Add refresh call (periodically)

---

## Testing

### Visual Verification
- [ ] Highway tubes visible in viewport
- [ ] Colors match synergy (cyan→green→white)
- [ ] Thickness varies by quality
- [ ] Animation flowing (not static)
- [ ] Bloom halo on bright routes

### Performance Verification
```javascript
// Check in browser console
window.synergyHighwayVisuals.debugPrintTopRoutes();
window.synergyHighwayVisuals.getHighwayCount();
```
- [ ] Some highways rendering (count > 0)
- [ ] No console errors
- [ ] Framerate smooth (60fps or target)

### Functional Verification
- [ ] Highways appear after link creation
- [ ] Colors update when synergy changes
- [ ] Animation smooth and continuous
- [ ] Can disable: `setEnabled(false)`
- [ ] Can rebuild: `rebuild()`

---

## Optional Enhancements

### Position Customization
```javascript
SynergyHighwayVisuals3D_1_0.setCategoryPosition('input', 
  new THREE.Vector3(x, y, z)
);
```
- [ ] If needed, set custom category positions

### Performance Tuning
```javascript
SynergyHighwayVisuals3D_1_0.setConfig({
  curveResolution: 24,  // Lower = faster
  enableHaloEffect: false  // Disable blooms
});
```
- [ ] If framerate issues, reduce resolution

### Debug Mode
```javascript
SynergyHighwayVisuals3D_1_0.setDebug(true);
window.synergyHighwayVisuals.debugPrintStats();
```
- [ ] If issues, enable debug and check console

---

## Deployment

- [ ] All tests passing
- [ ] No console errors
- [ ] Performance acceptable (<1ms per frame)
- [ ] Highways display correctly
- [ ] Animation smooth
- [ ] Works on world resets (if applicable)
- [ ] Ready for production

---

## Rollback

If issues occur:

```javascript
// Disable temporarily
window.synergyHighwayVisuals.setEnabled(false);

// Or remove completely
window.synergyHighwayVisuals.dispose();
```

- [ ] Can disable via `setEnabled(false)`
- [ ] Can remove via `dispose()`
- [ ] No core systems affected

---

## Reference

**Copy-Paste Template for main.js:**

```javascript
// ═══════════════════════════════════════════════════════════════
// IMPORTS
// ═══════════════════════════════════════════════════════════════
import { SynergyHighwayVisuals3D_1_0 } from './SynergyHighwayVisuals3D_1_0.js';

// ═══════════════════════════════════════════════════════════════
// SETUP (after scene/camera/renderer created)
// ═══════════════════════════════════════════════════════════════
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, w/h, 0.1, 10000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

// ... other setup ...

// Initialize highways visualization
if (window.synergyHighways) {
  SynergyHighwayVisuals3D_1_0.init(scene, camera, renderer, window.synergyHighways);
  window.synergyHighwayVisuals = SynergyHighwayVisuals3D_1_0;
}

// ═══════════════════════════════════════════════════════════════
// ANIMATE LOOP
// ═══════════════════════════════════════════════════════════════
let frameCount = 0;

function animate() {
  requestAnimationFrame(animate);
  
  const deltaTime = clock.getDelta();
  
  // Update highway animations
  if (window.synergyHighwayVisuals) {
    window.synergyHighwayVisuals.update(deltaTime);
    
    // Refresh highway data periodically
    if (frameCount++ % 10 === 0) {
      window.synergyHighwayVisuals.refreshFromHighways();
    }
  }
  
  // ... existing render code ...
  renderer.render(scene, camera);
}

animate();
```

---

## Troubleshooting Quick Guide

| Issue | Check | Fix |
|-------|-------|-----|
| No highways | `getHighwayCount() === 0` | Call `refreshFromHighways()` |
| Wrong positions | Category anchors match scene? | Use `setCategoryPosition()` |
| Slow FPS | Resolution too high? | `.setConfig({ curveResolution: 16 })` |
| No animation | `update()` called every frame? | Add to animate loop |
| Disappeared | After world reset? | Call `init()` again |

---

## Quick Commands

```javascript
// See what's rendering
window.synergyHighwayVisuals.debugPrintTopRoutes();

// Stats
window.synergyHighwayVisuals.debugPrintStats();

// Toggle on/off
window.synergyHighwayVisuals.setEnabled(false);
window.synergyHighwayVisuals.setEnabled(true);

// Rebuild
window.synergyHighwayVisuals.rebuild();

// Debug
window.synergyHighwayVisuals.setDebug(true);
```

---

**Next:** Follow [SYNERGY_HIGHWAYS_VISUALS_QUICKREF.md](SYNERGY_HIGHWAYS_VISUALS_QUICKREF.md) for detailed reference.

---

**Status:** 🟢 Ready to integrate  
**Time:** ~10 minutes  
**Complexity:** Very low
