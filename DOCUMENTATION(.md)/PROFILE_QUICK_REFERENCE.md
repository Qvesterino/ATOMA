# EnergyVisualProfile - Quick Reference

## 🎨 Color Constants

| System | Base Color | Harmony Color | Corruption Color |
|--------|-----------|---------------|-----------------|
| Node/Link Aura | `[0.85, 0.85, 0.9]` | `[0.8, 0.8, 0.88]` | `[1.0, 0.4, 0.4]` |
| Blend Strength | — | `0.3` | Node: `0.4` / Link: `0.3` |

## 📊 Opacity

| Component | Value | Notes |
|-----------|-------|-------|
| Node Aura Base | `0.25` | Maximum possible |
| Link Aura Multiplier | `0.6` | 60% of node |
| Link Aura Result | `~0.15` | `0.25 * 0.6` |
| Link Aura Hard Cap | `0.16` | Enforced in fragment shader |

## 🔊 Motion Modulation

| State | Node Factor | Link Factor | Effect |
|-------|------------|------------|--------|
| Harmony Motion Dampen | `0.6` | `0.6` | Smooths displacement |
| Corruption Enhance | `1.4` | `1.2` | Roughens displacement |

**Result**: `displacementFactor * mix(1.0, dampen/enhance, state)`

## 🌊 Noise Structure

| Parameter | Value | Effect |
|-----------|-------|--------|
| Base Scale | `2.0` | Noise sampling scale |
| Octave 1 | `2.0` | Full weight |
| Octave 2 | `4.0` | Weight `0.5` |
| Octave 3 | `8.0` | Weight `0.25` |
| Denominator | `1.75` | Normalization: `(o1 + o2*0.5 + o3*0.25) / 1.75` |

## 📐 Vertex Displacement

| Component | Base | Multiplier | Result |
|-----------|------|-----------|--------|
| Node Aura | `0.3` | — | `0.3` max |
| Link Aura | `0.3` | `0.5` | `0.15` max |
| After Harmony | `× 0.6` | — | `0.18-0.09` |
| After Corruption | `× 1.4-1.2` | — | `0.42-0.18` |

## ⏱️ Animation Timing

| Parameter | Value | Formula | Duration |
|-----------|-------|---------|----------|
| Noise Time Scale | `0.3` | `position + uTime * 0.3` | Gradual evolution |
| Global Time Scale | `0.5` | Applied to all systems | Unified rhythm |
| Wave Frequency | `2.0` | `sin(uTime * 2.0 + ...)` | ~3.14s cycle |
| Wave Amplitude | `0.15` | Subtle oscillation | ±0.15 variation |

## 💡 Link Birth/Removal Animations

### Birth (Aura Expansion)
| Phase | Node Aura | Link Aura | Timing |
|-------|-----------|-----------|--------|
| Expansion Amplitude | `0.35` | `0.2` | Over ~150ms |
| Ripple Amplitude | `0.15` | `0.08` | Shared frequency |
| Ease-in Duration | `30%` of cycle | `30-40%` of cycle | Offset slightly |

### Removal (Aura Contraction)
| Phase | Node Aura | Link Aura | Timing |
|-------|-----------|-----------|--------|
| Contraction Amplitude | `-0.4` | `-0.15` | Over ~330ms |
| Dissipation Amplitude | `0.12` | `0.06` | Reduced |
| Cycle Speed | `3.0×` | `3.0×` | Faster than birth |

## 🎯 Rim Lighting

| Component | Value | Effect |
|-----------|-------|--------|
| Node Rim Color | `[0.15, 0.15, 0.15]` | Subtle highlights |
| Link Rim Color | `[0.12, 0.12, 0.12]` | Reduced highlight |
| Desaturation Influence | `0.4` | Reduced at high corruption |

## 🔧 Cascade Hint System

| Parameter | Value | Effect |
|-----------|-------|--------|
| Brightening Amount | `0.05` | Very subtle |
| Brightening Influence | `0.3` | Faint yellow tint |
| Compression Strength | `0.6` | Reduces displacement randomness |

## 🏛️ Visual Hierarchy

```
Node Aura Opacity (max 0.25)
  ↓ linked by profile
Link Aura Opacity (max 0.16, hard cap)
  ↓ unified noise/timing/colors
Trail Particles (red → gray)
Healing Particles (cyan → white)
```

## 🎓 Helper Functions

```javascript
// Motion state applications
applyHarmonyMotion(harmonyLevel)          // → 1.0 to 0.6
applyCorruptionMotion(level, isLink)      // → 1.0 to 1.4/1.2

// Color state applications
applyCorruptionColor(color, level, isLink) // → progressively red
applyHarmonyColor(color, level)            // → progressively bright
applyDesaturation(color, level)            // → grayscale to sickly yellow

// Opacity calculations
calculateNodeOpacity(rim, displacement)   // → 0-0.25
calculateLinkOpacity(rim, displacement)   // → 0-0.16 (capped)

// Utilities
getNoiseFunction()                         // → GLSL code
describe()                                 // → Debug string
```

## 🔄 Common Modifications

### Brighten All Auras
```javascript
EnergyVisualProfile.baseColor = [0.9, 0.9, 0.95];
```

### Strengthen Corruption Response
```javascript
EnergyVisualProfile.corruptionMotionEnhanceNode = 1.6;  // Was 1.4
EnergyVisualProfile.corruptionMotionEnhanceLink = 1.4;  // Was 1.2
```

### Make Link Aura More Visible
```javascript
EnergyVisualProfile.linkOpacityMultiplier = 0.7;  // Was 0.6
EnergyVisualProfile.linkOpacityCap = 0.18;       // Was 0.16
```

### Slower Animation
```javascript
EnergyVisualProfile.globalTimeScale = 0.3;  // Was 0.5
```

### Faster Motion Response
```javascript
EnergyVisualProfile.harmonyMotionDampen = 0.4;  // Was 0.6 (less dampen)
```

## 📋 Implementation Checklist

When adding new aura systems:
- [ ] Use `EnergyVisualProfile.baseColor` for base color
- [ ] Use `EnergyVisualProfile.baseDisplacement` or `* multiplier`
- [ ] Use `EnergyVisualProfile.noiseOctaves` and weights
- [ ] Use `EnergyVisualProfile.globalTimeScale` for animation
- [ ] Apply harmony/corruption via helper functions
- [ ] Document any local multipliers (e.g., "cascade = 40% of node")

---

**Profile Source**: `/EnergyVisualProfile.js`  
**Last Updated**: Implementation Complete  
**Status**: ✅ Production Ready
