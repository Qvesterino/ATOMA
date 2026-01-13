# Integration Guide — Node Aura Renderer

## Quick Integration (3 Steps)

### Step 1: Add Import to main.js

Find the imports section and add:

```javascript
import { NodeLinkedAuraRenderer_Session146, setupNodeAuraConsoleAPI } from './NodeLinkedAuraRenderer_Session146.js';
```

### Step 2: Initialize in Game Setup

Find the area where other renderers are initialized (around `setupHarmonicCascadeAmplification()`) and add:

```javascript
setupNodeAuraRenderer() {
  try {
    this.nodeAuraRenderer = new NodeLinkedAuraRenderer_Session146(
      this.scene,
      this.aiNodes,
      {
        enabled: false,  // Disabled by default (safe)
        debugMode: false,
      }
    );
    
    // Setup console API
    setupNodeAuraConsoleAPI(window, this.nodeAuraRenderer);
    
    console.log('✓ Node Aura Renderer initialized (disabled by default)');
  } catch (err) {
    console.warn('⚠ Node Aura Renderer initialization failed:', err);
  }
}
```

Then call it from the main initialization (in the boot/setup sequence):

```javascript
// Add this line in the constructor or boot sequence:
this.setupNodeAuraRenderer();
```

### Step 3: Add to Update Loop

Find the main update/animate loop where systems are updated and add:

```javascript
// Update node aura renderer
if (this.nodeAuraRenderer) {
  this.nodeAuraRenderer.update(deltaTime);
}
```

---

## Detailed Integration

### Location in main.js Constructor

```javascript
// In constructor or setup() function:

// ========================================================================
// SETUP CASCADING VISUAL SYSTEMS
// ========================================================================
this.setupHarmonicCascadeAmplification();
this.setupNodeAuraRenderer();  // ← ADD THIS LINE
```

### Location in Animate Loop

```javascript
// In animate() function, after other system updates:

// Update cascade systems
if (this.harmonicCascadeAmplification) {
  this.harmonicCascadeAmplification.update(deltaTime);
}

// Update node aura renderer
if (this.nodeAuraRenderer) {
  this.nodeAuraRenderer.update(deltaTime);
}
```

---

## File Structure

Make sure files are in correct locations:

```
Project Root
├── main.js (needs updates)
├── NodeLinkedAuraRenderer_Session146.js (NEW)
└── shaders/
    └── NodeAuraShader.js (NEW)
```

The shader file must be in a `shaders/` subdirectory or update the import path accordingly.

---

## Verification Checklist

After integration:

1. **No console errors on startup**
   - Check browser console for errors
   - Should show: "✓ Node Aura Renderer initialized (disabled by default)"

2. **Console API available**
   ```javascript
   // In console:
   nodeAuraStatus();  // Should return status object
   ```

3. **Can enable auras**
   ```javascript
   enableNodeAuras();
   ```

4. **Auras render correctly**
   - Should see gray-white translucent meshes around nodes
   - Meshes should have torn/irregular silhouettes
   - Should deform organically

5. **Performance acceptable**
   ```javascript
   nodeAuraStatus();
   // Should show: lastUpdateTime < 1ms
   ```

---

## Console Testing

### Quick Test Sequence

```javascript
// 1. Check initialization
nodeAuraStatus();
// Output: active auras, update time, etc.

// 2. Enable auras
enableNodeAuras();
// Look for gray meshes around nodes

// 3. Check they're updating
toggleNodeAuraDebug(true);
// Console should show per-frame updates: [NodeAuraRenderer] active=... | ...

// 4. Try tuning
tune_node_aura('baseRadius', 1.5);
// Auras should appear larger

// 5. Disable auras
disableNodeAuras();
// Auras should disappear

// 6. Re-enable
enableNodeAuras();
// Auras should reappear
```

---

## Common Integration Issues

### Issue: "Cannot find module 'NodeLinkedAuraRenderer_Session146'"

**Solution**: Check import path and filename match exactly

```javascript
// Correct:
import { NodeLinkedAuraRenderer_Session146, setupNodeAuraConsoleAPI } from './NodeLinkedAuraRenderer_Session146.js';

// Incorrect:
import { NodeLinkedAuraRenderer_Session146 } from './node-aura-renderer.js';  // Wrong filename
```

### Issue: "Cannot find module './shaders/NodeAuraShader.js'"

**Solution**: Make sure shader file exists in correct location

```
Project/
├── NodeLinkedAuraRenderer_Session146.js
└── shaders/
    └── NodeAuraShader.js  ← Must be here
```

### Issue: Auras not rendering

**Solution 1**: Check if enabled
```javascript
nodeAuraStatus();
// Should show: enabled: true
```

**Solution 2**: Check if nodes exist
```javascript
// In console:
console.log(game.aiNodes.nodes.size);  // Should be > 0
```

**Solution 3**: Check performance issue
```javascript
toggleNodeAuraDebug(true);
// Check console for "active auras" count
```

### Issue: Poor performance / framerates dropping

**Solution 1**: Reduce max updates per frame
```javascript
tune_node_aura('maxAurasPerFrame', 30);  // Reduce from 100
```

**Solution 2**: Reduce visual quality
```javascript
tune_node_aura('meshSubdivisions', 1);   // Reduce detail
tune_node_aura('baseOpacity', 0.15);     // Make more transparent
```

**Solution 3**: Check if running on old hardware
```javascript
// Profile in Chrome DevTools:
// - Open DevTools → Performance tab
// - Record 5 seconds
// - Look for main thread bottlenecks
// - If >1ms per frame: reduce quality further
```

---

## Code Snippet: Complete Integration

If you want to copy-paste the complete integration:

### In main.js imports section (at top):

```javascript
import { NodeLinkedAuraRenderer_Session146, setupNodeAuraConsoleAPI } from './NodeLinkedAuraRenderer_Session146.js';
```

### In main.js class (in constructor/boot):

```javascript
setupNodeAuraRenderer() {
  try {
    this.nodeAuraRenderer = new NodeLinkedAuraRenderer_Session146(
      this.scene,
      this.aiNodes,
      {
        enabled: false,
        debugMode: false,
        baseRadius: 1.2,
        baseOpacity: 0.25,
        baseDisplacement: 0.3,
      }
    );
    
    setupNodeAuraConsoleAPI(window, this.nodeAuraRenderer);
    console.log('✓ Node Aura Renderer initialized');
  } catch (err) {
    console.warn('⚠ Node Aura Renderer failed:', err);
  }
}

// Call from constructor:
this.setupNodeAuraRenderer();
```

### In main.js update loop:

```javascript
// In animate() or main update function:
if (this.nodeAuraRenderer) {
  this.nodeAuraRenderer.update(deltaTime);
}
```

### In main.js cleanup (if exists):

```javascript
// In dispose() or cleanup function:
if (this.nodeAuraRenderer) {
  this.nodeAuraRenderer.dispose();
}
```

---

## Validation After Integration

### Checklist

- [ ] No console errors on startup
- [ ] `nodeAuraStatus()` works in console
- [ ] `enableNodeAuras()` makes auras visible
- [ ] Auras appear around nodes as gray-white meshes
- [ ] Auras have organic deformation (not rigid)
- [ ] Performance acceptable (< 1ms in DevTools)
- [ ] Can disable/enable smoothly
- [ ] Can tune parameters with `tune_node_aura()`

---

## Performance Baseline

After integration, expected performance:

| Scenario | Update Time | Notes |
|----------|------------|-------|
| 5 nodes | <0.1ms | Very fast |
| 10 nodes | <0.2ms | Excellent |
| 20 nodes | <0.5ms | Good |
| 50 nodes | <1.2ms | Acceptable |
| 100 nodes | <2.5ms | Consider LOD |

If exceeding these targets:

1. Reduce `maxAurasPerFrame`: `tune_node_aura('maxAurasPerFrame', 50)`
2. Reduce subdivisions: `tune_node_aura('meshSubdivisions', 1)`
3. Consider disabling for certain cameras/views

---

## Deployment Order

1. **Add NodeAuraRenderer import** (no impact)
2. **Initialize in setup** (creates pools, no scene objects yet)
3. **Add to update loop** (disabled by default, minimal overhead)
4. **Enable in console** (auras become visible)
5. **Tune as desired** (customize appearance)

---

## Rollback / Disabling

If you need to completely disable:

```javascript
// Option 1: In console
disableNodeAuras();

// Option 2: Don't call setupNodeAuraRenderer()
// (Requires code change and restart)

// Option 3: Comment out update loop call
// if (this.nodeAuraRenderer) {
//   this.nodeAuraRenderer.update(deltaTime);
// }
```

---

## Next Steps

1. **Integrate** using the code snippets above
2. **Test** by enabling auras in console
3. **Tune** intensity and appearance
4. **Profile** in Chrome DevTools
5. **Deploy** when satisfied

---

## Support

If issues arise:

1. Check console for errors
2. Run `nodeAuraStatus()` to get current state
3. Enable debug: `toggleNodeAuraDebug(true)`
4. Check this guide's "Common Integration Issues" section
5. Review `NODE_AURA_RENDERER_GUIDE.md` for detailed reference

---

**Integration Time**: ~5 minutes  
**Testing Time**: ~2 minutes  
**Difficulty**: Easy  
**Impact**: Render-only, zero gameplay effect  

Ready to integrate!
