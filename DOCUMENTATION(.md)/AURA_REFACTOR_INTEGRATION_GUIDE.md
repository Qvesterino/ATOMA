# Node Aura Refactor — Integration Guide

## Overview

This guide covers replacing the existing aura system with the elegant, rim-only `NodeAuraRefactor_ElegantRim` system.

**Goal**: Subtle, boundary-aware energetic outlines that enhance node presence without obscuring geometry.

## Key Changes

### What's New

✅ **Rim-only lighting** - Intensity peaks at silhouette edges, fades toward center
✅ **Fresnel-based** - Physics-based rim effect disappears when viewed head-on
✅ **Separate geometry** - Scales 1.25x from core, never intersects
✅ **Elegant colors** - Cool palette (cyan, teal, violet, amber)
✅ **Subtle breathing** - Low-speed intensity modulation, no scale pulsing
✅ **Debug toggle** - F3 console API for validation

### Breaking Changes

- **Old**: `NodeAuraSystem_v1` uses full glow spheres with noise
- **New**: `NodeAuraRefactor_ElegantRim` uses Fresnel rim-lighting only
- **Impact**: Visual hierarchy is cleaner; auras no longer dominate

## Integration Steps

### Step 1: Update Import in main.js

**Find**:
```javascript
import { NodeAuraSystem_v1 } from './NodeAuraSystem_v1.js';
```

**Replace with**:
```javascript
import { NodeAuraRefactor_ElegantRim } from './NodeAuraRefactor_ElegantRim.js';
```

### Step 2: Initialize Aura System

**Find** (in main.js, around line 500-600):
```javascript
const auraSystem = new NodeAuraSystem_v1({
  scene: this.scene,
  fxPerformance: this.fxPerformance,
});
```

**Replace with**:
```javascript
const auraSystem = new NodeAuraRefactor_ElegantRim({
  scene: this.scene,
  camera: this.camera,
  debugEnabled: false,          // Enable with toggleAuraDebug()
  rimWidthScale: 1.25,          // 1.15-1.35 range
  baseOpacity: 0.10,            // 0.05-0.15 range
});
```

### Step 3: Register Nodes

**Pattern stays the same**:
```javascript
// On node spawn
auraSystem.registerNode(node, 'clarity');  // or 'default', 'resonance', 'corrupted', 'harmony'

// On node destroy
auraSystem.unregisterNode(node);
```

### Step 4: Update Frame Loop

**Pattern stays the same**:
```javascript
// In render loop
auraSystem.update(deltaTime);
```

### Step 5: Update Profile Based on State

**New capability**: Change aura appearance dynamically
```javascript
// Update profile when node state changes
auraSystem.updateNodeProfile(node, 'corrupted');

// Control visibility
auraSystem.setNodeAuraVisible(node, true);
```

## Available Profiles

| Profile | Color | Tone | Use Case |
|---------|-------|------|----------|
| `default` | Aquamarine cyan | Neutral, balanced | General nodes |
| `clarity` | Bright cyan | Sharp, focused | High-signal nodes |
| `resonance` | Light sea green (teal) | Harmonic, deep | Resonant nodes |
| `corrupted` | Pale violet | Unstable, degraded | Corrupted nodes |
| `harmony` | Soft amber/gold | Warm, unified | Harmony/balanced |

## Debug Console API

### Enable Debug Mode

```javascript
// In browser console
toggleAuraDebug()

// Output:
// [AURA DEBUG] Aura debugging ENABLED
```

### Log All Auras

```javascript
logAuraStatus()

// Output:
// [AURA STATUS] 42 auras registered
//   Node=SignalKnot rimIntensity=0.120 rimWidth=125% profile=default visible=true
//   Node=ControllerNode rimIntensity=0.100 rimWidth=125% profile=corrupted visible=true
//   ...
```

## Expected Console Output

When debug is enabled during runtime:

```
[AURA] Registered SignalKnot#a3e2f1 rimIntensity=0.10 rimWidth=125% color=#7fffd4
[AURA] Update SignalKnot#a3e2f1 → clarity
[AURA DEBUG] Node=SignalKnot rimIntensity=0.12 rimWidth=25%
```

## Visual Validation Checklist

- [ ] Auras only visible at node edges (silhouette)
- [ ] Auras completely fade when node faces camera
- [ ] Core geometry fully opaque and unobscured
- [ ] No "bubble" or "thick halo" appearance
- [ ] Colors are cool and restrained (not neon)
- [ ] Breathing is smooth and slow (~1 cycle per 3 seconds)
- [ ] No flickering or noise artifacts
- [ ] Aura disappears when node is hidden

## Performance Tuning

### Reduce Aura Intensity

```javascript
auraSystem.baseOpacity = 0.05;  // Minimum: 0.05
```

### Adjust Rim Width

```javascript
auraSystem.rimWidthScale = 1.15;  // Narrower (1.15-1.20)
auraSystem.rimWidthScale = 1.35;  // Wider (1.30-1.35)
```

### Disable Auras Entirely

```javascript
auraSystem.enabled = false;
```

### Update on Profile Change

If auras are already registered, update them:
```javascript
for (const node of nodesList) {
  auraSystem.updateNodeProfile(node, newProfileName);
}
```

## Troubleshooting

### Auras Not Visible

1. **Check debug console**:
   ```javascript
   toggleAuraDebug();
   logAuraStatus();
   ```

2. **Verify registration**:
   - Nodes should appear in `logAuraStatus()` output
   - Check `visible=true` in debug info

3. **Check opacity settings**:
   - Default is `0.10` (10% opacity)
   - Increase to `0.15` for stronger effect

### Auras Too Bright

1. **Reduce opacity**:
   ```javascript
   auraSystem.baseOpacity = 0.05;
   ```

2. **Reduce rim intensity** in specific profile:
   - Edit `AURA_PROFILES` in source
   - Lower `rimIntensity` (e.g., 0.10 → 0.08)

### Auras Look Grainy/Noisy

- This is expected behavior when near silhouette edges
- Adjust `rimPower` (2.0 = sharp, 1.5 = soft)
- Increase `rimIntensity` to smooth out

### Performance Impact

- **Geometry cost**: One shared sphere (16 segments)
- **Material cost**: Additive blending, no expensive effects
- **Update cost**: Position + scale copy per node per frame
- **Expected**: <0.5ms for 100+ nodes

## Migration from Old System

### If using `NodeAuraSystem_v1`:

1. **Backup current aura settings** (if customized)
2. **Replace initialization** (see Step 2)
3. **Update profile names**:
   - `'aura-clarity'` → `'clarity'`
   - `'aura-resonance'` → `'resonance'`
   - etc.

4. **Test in debug mode**:
   ```javascript
   toggleAuraDebug();
   // Orbit camera around nodes
   // Verify rim visibility at edges
   // Verify fade at center
   ```

5. **Adjust settings** as needed (see Performance Tuning)

## API Reference

### Constructor Options

```javascript
{
  scene,               // Required: THREE.Scene
  camera,              // Optional: THREE.Camera for distance effects
  debugEnabled,        // Optional: boolean, default false
  rimWidthScale,       // Optional: 1.15-1.35, default 1.25
  baseOpacity,         // Optional: 0.05-0.15, default 0.10
}
```

### Methods

```javascript
// Lifecycle
auraSystem.registerNode(node, profileName)
auraSystem.unregisterNode(node)
auraSystem.update(deltaTime)
auraSystem.dispose()

// State
auraSystem.updateNodeProfile(node, profileName)
auraSystem.setNodeAuraVisible(node, visible)

// Debug
auraSystem.getNodeAuraDebugInfo(node)
auraSystem.logAllAurasDebug()
```

## Notes for Artists/Designers

### Color Palette

The color palette is intentionally **cool and restrained**:
- **Cyan** (0x7fffd4, 0x00d9ff) - Primary, clarity focus
- **Teal** (0x20b2aa) - Harmonic, resonant
- **Violet** (0xb0a0e6) - Degraded, corrupted state
- **Amber** (0xffd700) - Harmony, unified state

**Do not use**: Neon, saturated colors, white glow

### Breathing Animation

- **Speed**: 1.0-2.0 cycles per 3 seconds
- **Amplitude**: 0.4 (intensity ranges 0.6-1.4x)
- **Effect**: Subtle pulsation, no visual "throb"

### Rim Width

- **Narrow**: 1.15-1.20 (delicate, elegant)
- **Standard**: 1.25 (default, balanced)
- **Wide**: 1.30-1.35 (pronounced, dramatic)

## Support

For issues or questions:
- Check debug console output
- Review visual validation checklist
- Verify node registration in `logAuraStatus()`
- Test with `debugEnabled: true`
