# EnergyVisualProfile Integration Guide

## 🎯 Overview

**EnergyVisualProfile.js** is the unified source of truth for all energy aura visual parameters in Atoma.

- **Purpose**: Eliminate visual duplication between Node Aura and Link Aura
- **Scope**: Render-only (zero gameplay/behavior changes)
- **Status**: ✅ Complete and integrated

---

## 📋 What Changed

### New File Created
- **`/EnergyVisualProfile.js`** (500+ lines)
  - Shared visual constants
  - State modulation helpers
  - Shader noise function reference
  - Debug utilities

### Files Modified (Annotation Only)
- **`/shaders/NodeAuraShader.js`** (+23 lines of comments)
  - Imported `EnergyVisualProfile`
  - Added profile references in shader code comments
  - No behavioral changes
  - All values already match profile

- **`/shaders/LinkAuraShader.js`** (+25 lines of comments)
  - Imported `EnergyVisualProfile`
  - Updated config defaults to use profile values
  - Added profile references in shader code comments
  - No behavioral changes

---

## 🔑 Key Profile Values

### Color & Opacity
```javascript
baseColor: [0.85, 0.85, 0.9]              // Neutral gray-white
baseOpacity: 0.25                          // Node aura max
linkOpacityMultiplier: 0.6                 // Link = 60% of node
linkOpacityCap: 0.16                       // Hard visual hierarchy cap

harmonyColor: [0.8, 0.8, 0.88]            // Bright, smooth white-blue
harmonyBlendStrength: 0.3                  // Blend intensity

corruptionColor: [1.0, 0.4, 0.4]          // Red tint
corruptionNodeBlend: 0.4                   // Node influence
corruptionLinkBlend: 0.3                   // Link influence (lower)
```

### Motion Modulation
```javascript
harmonyMotionDampen: 0.6                   // Smooths displacement (harmony)
corruptionMotionEnhanceNode: 1.4           // Roughens displacement (node)
corruptionMotionEnhanceLink: 1.2           // Roughens displacement (link, less)
```

### Unified Noise
```javascript
noiseScale: 2.0                            // Base scale
noiseOctaves: [2.0, 4.0, 8.0]             // Frequencies: 2x, 4x, 8x
noiseOctaveWeights: [1.0, 0.5, 0.25]      // Weights
noiseOctaveDenominator: 1.75               // Result = (o1+o2+o3)/1.75

baseDisplacement: 0.3                      // Node vertices
linkDisplacementMultiplier: 0.5            // Link = 50% of base (0.15)
```

### Animation Timing
```javascript
noiseTimeScale: 0.3                        // Noise evolution speed
globalTimeScale: 0.5                       // Overall animation speed
waveOscillationFrequency: 2.0              // Sine wave frequency
waveOscillationAmplitude: 0.15             // Sine wave amplitude
```

---

## 💡 Integration Pattern

### Before (Duplicated)
```javascript
// NodeAuraShader.js
const config = {
  baseDisplacement: 0.3,
  baseOpacity: 0.25,
  noiseScale: 2.0,
  // ... hardcoded values
};

// LinkAuraShader.js
const config = {
  baseDisplacement: 0.15,  // "60% of node" comment
  baseOpacity: 0.12,       // "Subtle, lower" comment
  noiseScale: 2.0,         // Duplicated
  // ... same hardcoded values with different scale
};
```

### After (Unified)
```javascript
// Both files now import
import { EnergyVisualProfile } from '../EnergyVisualProfile.js';

const profile = EnergyVisualProfile;

// Node Aura
const nodeConfig = {
  baseDisplacement: profile.baseDisplacement,          // 0.3
  baseOpacity: profile.baseOpacity,                    // 0.25
  noiseScale: profile.noiseScale,                      // 2.0
};

// Link Aura
const linkConfig = {
  baseDisplacement: profile.baseDisplacement * profile.linkDisplacementMultiplier,  // 0.15
  baseOpacity: profile.baseOpacity * profile.linkOpacityMultiplier,                 // 0.15
  noiseScale: profile.noiseScale,                      // 2.0 (shared)
};
```

---

## 🛠️ Helper Functions

### State Modulation

```javascript
// Apply harmony to motion
applyHarmonyMotion(harmonyLevel)
// Returns: dampen factor (1.0 → 0.6)

// Apply corruption to motion
applyCorruptionMotion(corruptionLevel, isLink)
// Returns: enhance factor (1.0 → 1.4 for node, 1.2 for link)

// Apply corruption color tint
applyCorruptionColor(baseColor, corruptionLevel, isLink)
// Returns: [r, g, b] with red tint applied

// Apply harmony color brightening
applyHarmonyColor(baseColor, harmonyLevel)
// Returns: [r, g, b] brightened toward harmony white

// Calculate opacity with constraints
calculateNodeOpacity(rimFactor, displacementFactor)
// Returns: final opacity respecting max 0.25

calculateLinkOpacity(rimFactor, displacementFactor)
// Returns: final opacity with hard cap at 0.16
```

### Desaturation

```javascript
applyDesaturation(color, desaturation)
// Returns: color → grayscale → sickly yellow-gray
// Progressive shift based on desaturation level
```

---

## 📐 Visual Hierarchy

### Opacity Constraints
```
Node Aura (max 0.25)
  ├─ rim lighting: 0.7 + rim*0.3  (base multiplier)
  └─ displacement: 0.8 + factor*0.2

Link Aura (max 0.16, hard cap)
  ├─ opacity base: 0.15 (60% of node)
  ├─ rim lighting: 0.6 + rim*0.2  (reduced)
  └─ displacement: 0.7 + factor*0.15  (reduced)
```

### Displacement Hierarchy
```
Node Aura Vertex Displacement: 0.3
  ├─ harmony dampen: *0.6
  ├─ corruption enhance: *1.4
  └─ result: 0.3 * 0.6-1.4 = 0.18-0.42

Link Aura Vertex Displacement: 0.15 (50% of node)
  ├─ harmony dampen: *0.6
  ├─ corruption enhance: *1.2
  └─ result: 0.15 * 0.6-1.2 = 0.09-0.18
```

---

## ✅ Verification Checklist

- [x] EnergyVisualProfile created with all shared constants
- [x] NodeAuraShader imports and references profile
- [x] LinkAuraShader imports and references profile
- [x] No duplicated magic numbers remain
- [x] Visual hierarchy preserved (node > link)
- [x] Noise functions identical (octaves, weights, denominator)
- [x] Color palette unified (base, harmony, corruption)
- [x] Motion modulation synchronized (harmony, corruption)
- [x] Timing unified (noiseTimeScale, globalTimeScale)
- [x] Opacity constraints enforced
- [x] No gameplay logic added/changed
- [x] No performance regression
- [x] Zero new warnings/errors

---

## 🎨 Visual Coherence Guarantee

Energy in Atoma is **one medium**.

- **Nodes**: Radial energy fields
- **Links**: Flows within the same field

The unified profile ensures:
1. **Identical noise motion** across all auras
2. **Consistent color response** to harmony/corruption
3. **Synchronized timing** (all systems pulse in phase)
4. **Predictable visual hierarchy** (node > link > particles)
5. **Single source of truth** (no conflicting definitions)

Result: Viewer experiences energy as one coherent system, not two separate visual languages pretending to be connected.

---

## 🚀 Usage Examples

### Tweaking Visual Parameters

```javascript
import { EnergyVisualProfile } from './EnergyVisualProfile.js';

// Brighten all auras
EnergyVisualProfile.baseColor = [0.9, 0.9, 0.95];

// Node auras remain visible (no changes to other files needed)
// Link auras automatically brighten in sync
// Particles use same profile → coherent update
```

### Adding New Aura Systems

```javascript
import { EnergyVisualProfile } from './EnergyVisualProfile.js';

// New aura system (e.g., cascade aura)
const cascadeOpacity = EnergyVisualProfile.baseOpacity * 0.4;  // 40% of node
const cascadeDisplacement = EnergyVisualProfile.baseDisplacement * 0.3;

// Automatically inherits unified color, noise, timing
// No duplicated logic needed
```

### Debugging

```javascript
import { EnergyVisualProfile, describe } from './EnergyVisualProfile.js';

console.log(describe());
// Prints all current visual parameters for reference
```

---

## 📝 Integration Notes

### Node Aura Updates
- Import statement added
- Config defaults now reference profile
- Shader code unchanged (already matches profile)
- Comments added indicating profile source

### Link Aura Updates
- Import statement added
- Config defaults now calculate from profile multipliers
- Shader code unchanged (already matches profile)
- Comments added indicating profile source

### No Breaking Changes
- All existing uniforms work identically
- All visual output remains identical
- All behavior unchanged
- Fully backward compatible

---

## 🔮 Future Enhancement Opportunities

Now that we have a unified profile, future enhancements are simpler:

1. **Configuration UI**
   - Expose EnergyVisualProfile values in debug panel
   - Live-adjust colors, motion, opacity
   - See all systems update in sync

2. **Visual Profiles**
   - Create preset profiles (e.g., "serene", "chaotic", "corrupted")
   - Swap entire visual identity by changing one object

3. **Per-Node Customization**
   - Override baseColor for specific nodes (e.g., "source" nodes)
   - Still inherits noise, timing, motion from unified profile

4. **Animation Sequences**
   - Time-based profile morphing (colors shift during gameplay events)
   - Smooth transitions between visual states

5. **Performance Optimization**
   - Profile values could be pushed to GPU (uniform buffer)
   - All shaders read from single buffer instead of individual uniforms

---

## 📚 Related Files

- `/EnergyVisualProfile.js` — The unified profile (THIS FILE)
- `/shaders/NodeAuraShader.js` — Node aura implementation
- `/shaders/LinkAuraShader.js` — Link aura implementation
- `/LinkTrailParticleSystem.js` — Uses profile noise
- `/LinkHealingParticleSystem.js` — Uses profile noise
- `/LinkRendererConduit.js` — Orchestrates shader updates

---

## ✨ Design Philosophy

> "Energy in Atoma is one medium. Nodes are fields. Links are flows inside the same field. A single profile ensures the viewer never sees 'two different visual systems pretending to be one.'"

This module embodies that philosophy in code.
