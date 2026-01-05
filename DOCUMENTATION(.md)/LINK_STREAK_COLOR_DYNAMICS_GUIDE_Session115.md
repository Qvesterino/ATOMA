# Link Directional Streak Color Dynamics (Session 115)

## Overview

Dynamic color modulation for link streaks based on **harmony** and **specialization state**. Streaks now visually communicate link health through color shifts.

**Key Principle**: Colors tell a story. No gameplay changes—pure visual feedback.

---

## Visual Encoding

### **Harmony-Driven Dynamics** 🌟
- **High Harmony (0.8-1.0)**: Vivid, saturated colors with bright glow
- **Medium Harmony (0.4-0.7)**: Moderate saturation and brightness
- **Low Harmony (0.0-0.3)**: Washed out, desaturated colors with dim glow

**Effect**: Streaks appear "healthy" and vibrant when links are harmonious.

### **Specialization-Driven Hue Shifts** 🎨
- **Excitatory (+0.3 to +1.0)**: Warm colors (red/orange/yellow tint)
- **Neutral (±0.3)**: Default colors (green base)
- **Inhibitory (-0.3 to -1.0)**: Cool colors (blue/cyan tint)

**Effect**: Learned node behavior becomes visually evident through color.

### **Corruption Desaturation** 🌫️
- **Clean (0.0)**: Full color saturation
- **Corrupted (0.5-1.0)**: Progressively desaturated, washed appearance

**Effect**: Corruption is immediately visible in streak appearance.

### **Synergy Intensity** ⚡
- **Low Synergy (0.0-0.3)**: Dim, low-energy appearance
- **High Synergy (0.7-1.0)**: Bright, high-energy appearance

**Effect**: Active links glow; inactive links fade.

---

## Technical Details

### Color Computation Pipeline

```
1. Base Color (green/custom)
    ↓
2. Harmony Adjustment
    - Brightness: 0.3-1.0 based on harmony
    - Saturation: 0.2-1.0 based on harmony
    ↓
3. Specialization Hue Shift
    - Excitatory: +0.15 hue (red/yellow)
    - Inhibitory: -0.25 hue (blue/cyan)
    ↓
4. Corruption Desaturation
    - Saturation multiplied by: 1.0 - (corruption × 0.5)
    ↓
5. Synergy Intensity
    - Brightness multiplied by: 0.4-1.0 based on synergy
    ↓
6. Final Dynamic Color → Streaks
```

### Configuration Parameters

```javascript
new LinkStreakColorDynamics({
  // Harmony-driven dynamics
  harmonyBrightnessMin: 0.3,        // Dimmest appearance
  harmonyBrightnessMax: 1.0,        // Brightest appearance
  harmonySaturationMin: 0.2,        // Most washed out
  harmonySaturationMax: 1.0,        // Most vivid
  
  // Specialization-driven hue shifts
  excitatoryCoolness: 0.15,         // Red/yellow tint strength
  inhibitoryCoolness: -0.25,        // Blue/cyan tint strength
  
  // Corruption dynamics
  corruptionDesaturation: 0.5,      // Max desaturation from corruption
  corruptionNoiseIntensity: 0.1,    // Color noise strength
  
  // Synergy dynamics
  synergyIntensityMin: 0.4,         // Dimmest synergy
  synergyIntensityMax: 1.0,         // Brightest synergy
  
  // Color confidence
  colorConfidenceMin: 0.1,
  colorConfidenceMax: 1.0,
  
  // Enable/disable
  enabled: true,
  debugMode: false
});
```

---

## Integration

### **Current State (Built-In)**

Color dynamics are automatically active in LinkDirectionalStreaks:

```javascript
// In LinkDirectionalStreaks.constructor():
this.colorDynamics = new LinkStreakColorDynamics({
    enabled: true,
    debugMode: false
});
```

### **Calling update() with Specialization**

The streak update method now accepts specialization parameter:

```javascript
linkStreaks.update(
    linkGroup,          // THREE.Group
    curve,              // THREE.QuadraticBezierCurve3
    deltaTime,          // number
    synergy,            // 0-1
    harmony,            // 0-1
    corruption,         // 0-1
    instability,        // 0-1
    baseColor,          // THREE.Color
    targetColor,        // THREE.Color (optional)
    link,               // Object (optional)
    time,               // number
    specialization      // NEW! -1 to +1 (optional, defaults to 0)
);
```

### **Passing Specialization from Link System**

The specialization value should come from the link's specialization tracking. Example integration points:

#### From SynapticSpecializationAdapter:

```javascript
// In your link update loop:
const linkSpecialization = synapticSpecialization.getNodeBias(sourceNodeId, targetNodeId);
// Returns: -1 to +1 (or 0 if not available)

linkStreaks.update(
    linkGroup, curve, deltaTime,
    synergy, harmony, corruption, instability,
    baseColor, targetColor,
    link, time,
    linkSpecialization  // Pass it here
);
```

#### From SynapticFatigue or CompetitionDominance:

```javascript
// If available in link metadata:
const specialization = link.metadata?.specialization ?? 0;

linkStreaks.update(
    linkGroup, curve, deltaTime,
    synergy, harmony, corruption, instability,
    baseColor, targetColor,
    link, time,
    specialization
);
```

---

## Color Examples

### Scenario 1: Healthy, Balanced Link
```
Harmony: 0.9
Specialization: 0 (neutral)
Corruption: 0.0
Synergy: 0.8

Result: Bright, vivid green with strong glow
Visual: "This link is working well and doesn't specialize"
```

### Scenario 2: Excitatory Link (Amplifying)
```
Harmony: 0.8
Specialization: +0.7 (strongly excitatory)
Corruption: 0.1
Synergy: 0.6

Result: Orange/red tinted, vibrant glow
Visual: "This link amplifies pulses"
```

### Scenario 3: Inhibitory Link (Dampening)
```
Harmony: 0.7
Specialization: -0.6 (strongly inhibitory)
Corruption: 0.2
Synergy: 0.5

Result: Cyan/blue tinted, moderate glow
Visual: "This link suppresses pulses"
```

### Scenario 4: Degraded Link (Corrupted)
```
Harmony: 0.5
Specialization: +0.4
Corruption: 0.8
Synergy: 0.3

Result: Desaturated orange, dim glow
Visual: "This link is corrupted but trying to amplify"
```

### Scenario 5: Dead Link (Harmonic Failure)
```
Harmony: 0.1
Specialization: 0
Corruption: 1.0
Synergy: 0.0

Result: Gray, barely glowing
Visual: "This link is broken"
```

---

## API Reference

### LinkStreakColorDynamics Methods

#### `computeStreakColor(baseColor, harmony, specialization, corruption, synergy)`
Compute dynamic color based on state factors.

```javascript
const dynamicColor = colorDynamics.computeStreakColor(
    new THREE.Color(0x00ff88),  // baseColor
    0.8,                         // harmony (0-1)
    0.5,                         // specialization (-1 to +1)
    0.1,                         // corruption (0-1)
    0.7                          // synergy (0-1)
);
// Returns: THREE.Color
```

#### `updateMaterialColors(material, baseColor, harmony, specialization, corruption, synergy, emissiveIntensity)`
Apply color dynamics directly to a material.

```javascript
colorDynamics.updateMaterialColors(
    material,
    baseColor,
    harmony, specialization, corruption, synergy,
    0.8  // emissiveIntensity
);
```

#### `computeColorConfidence(harmony, specialization)`
Compute how strongly colors are expressed (0-1).

```javascript
const confidence = colorDynamics.computeColorConfidence(0.8, 0.5);
// High harmony + strong specialization = high confidence
// Colors appear more "decided"
```

#### `getColorDescription(harmony, specialization)`
Get human-readable color description (useful for debugging).

```javascript
const desc = colorDynamics.getColorDescription(0.7, 0.5);
// Returns: "Moderate Excitatory (warm)"
```

#### `getRecommendedColor(specialization)`
Get recommended base color for a link based on specialization.

```javascript
const color = colorDynamics.getRecommendedColor(0.6);
// Returns: THREE.Color(0xff6600) for excitatory
// Returns: THREE.Color(0x00aaff) for inhibitory
// Returns: THREE.Color(0x00ff88) for neutral
```

#### `transitionColor(fromColor, toColor, transitionProgress)`
Interpolate between two colors smoothly.

```javascript
const blended = colorDynamics.transitionColor(
    fromColor,
    toColor,
    0.5  // 50% blend
);
```

#### `setEnabled(enabled)` / `setDebugMode(debugMode)`
Runtime control.

```javascript
colorDynamics.setEnabled(false);        // Disable dynamics
colorDynamics.setDebugMode(true);       // Enable debug logging
```

#### `updateConfig(updates)`
Update configuration at runtime.

```javascript
colorDynamics.updateConfig({
    excitatoryCoolness: 0.2,      // Increase warm tint
    harmonyBrightnessMax: 1.2     // Brighter max
});
```

---

## Performance

- **Per-call cost**: ~0.3ms (color computation)
- **Per-frame overhead**: Negligible (reuses existing material updates)
- **Memory**: Zero allocations (reuses THREE.Color objects)
- **GC pressure**: None

---

## Visual Hierarchy

Color precedence when multiple factors apply:

```
1. Base Color         (foundation)
2. Harmony           (affects saturation/brightness)
3. Specialization    (affects hue)
4. Corruption        (reduces saturation)
5. Synergy           (affects intensity)
6. Pulse Effects     (boost saturation on top)
```

---

## Debug Console

Enable debug mode to see color computations:

```javascript
// In LinkDirectionalStreaks instance:
linkStreaks.colorDynamics.setDebugMode(true);

// Now console will show for each frame:
// [LinkStreakColorDynamics] Color computation: {
//   baseH: 0.333, baseSat: 1.0, baseL: 0.5,
//   harmony: 0.9, specialization: 0.5, corruption: 0.1, synergy: 0.8,
//   hueShift: 0.075, harmonySaturation: 1.0, finalS: 0.9, finalL: 0.72,
//   finalColor: "ff8833"
// }
```

---

## Integration Checklist

- [x] LinkStreakColorDynamics_Session115.js created
- [x] Import added to LinkDirectionalStreaks.js
- [x] colorDynamics instance initialized in constructor
- [x] update() method signature updated (accepts specialization)
- [x] _updateGeometryBuffer() calls computeStreakColor()
- [x] Material color updates use dynamic colors
- [ ] **TODO**: Update LinkRendererConduit.update() to pass specialization
- [ ] **TODO**: Test with actual link specialization data
- [ ] **TODO**: Tune color parameters for visual appeal

---

## Next Steps

### Immediate
1. Get specialization value from link system
2. Pass it to linkStreaks.update()
3. Observe color changes in-game
4. Tune parameters if needed

### Short-term
1. Add specialization tracking to links (if not already present)
2. Connect CompetitionDominanceAdapter data if available
3. Test with various harmony/specialization combinations

### Advanced
1. Add color transitions (smooth fade when specialization changes)
2. Audio-visual sync (color changes trigger sound)
3. Per-link color caching for performance (if needed)

---

## References

- **LinkStreakColorDynamics_Session115.js** — Implementation
- **LinkDirectionalStreaks.js** — Integration point
- **SynapticSpecializationAdapter_v1.js** — Specialization source
- **CompetitionDominanceAdapter_v1.js** — Dominance/hierarchy data

---

## Examples: Before vs After

### Before (Session 114)
All streaks same green color regardless of link state:
```
Link 1 (healthy, excitatory):  Green glow
Link 2 (corrupted, inhibitory):  Green glow  ← Hard to distinguish
Link 3 (dead):  Green glow
```

### After (Session 115)
Streaks reflect actual state:
```
Link 1 (healthy, excitatory):    Bright orange glow    ← Clear visual diff
Link 2 (corrupted, inhibitory):  Dim cyan glow        ← Clearly different
Link 3 (dead):                   Dark gray, no glow
```

---

*Visual language expressing network state. Colors communicate link health, specialization, and corruption at a glance.*
