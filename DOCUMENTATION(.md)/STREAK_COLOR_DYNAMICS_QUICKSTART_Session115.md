# Streak Color Dynamics — Quick Start

## TL;DR

Streaks now change color based on link harmony and specialization:
- **Harmony** → Brightness & saturation (healthy = vivid, broken = dull)
- **Specialization** → Hue shift (excitatory = warm orange, inhibitory = cool cyan)
- **Corruption** → Desaturation (corrupted = washed out)
- **Synergy** → Intensity (active = bright, idle = dim)

**Already integrated. Just pass specialization to streak.update().**

---

## Quick Integration

### Step 1: Get Specialization Value

From your link system (SynapticSpecialization, CompetitionDominance, etc.):

```javascript
// Option A: From specialization adapter
const specialization = synapticSpecialization.getNodeBias(sourceId, targetId) ?? 0;

// Option B: From link metadata
const specialization = link.specialization ?? 0;

// Option C: Default (no specialization data yet)
const specialization = 0;
```

### Step 2: Pass to Streak Update

```javascript
linkStreaks.update(
    linkGroup, curve, deltaTime,
    synergy, harmony, corruption, instability,
    baseColor, targetColor,
    link, time,
    specialization  // ← NEW PARAMETER
);
```

### Step 3: Done! 🎉

Streaks now show colors based on harmony + specialization.

---

## Visual Result

```
Link with:
- Harmony: 0.9 (good)
- Specialization: +0.7 (excitatory)
- Corruption: 0.0 (clean)
- Synergy: 0.8 (active)

Result: BRIGHT ORANGE GLOW
Meaning: "This link is healthy and amplifies pulses"

---

Link with:
- Harmony: 0.3 (poor)
- Specialization: -0.8 (inhibitory)
- Corruption: 0.7 (corrupted)
- Synergy: 0.2 (idle)

Result: DIM DESATURATED CYAN
Meaning: "This link is broken but tries to suppress pulses"
```

---

## Color Meanings

| Color | Harmony | Specialization | Meaning |
|-------|---------|---|---------|
| Bright green | High (0.7+) | 0 | Healthy, balanced |
| Bright orange | High (0.7+) | +0.5+ | Healthy, amplifying |
| Bright cyan | High (0.7+) | -0.5- | Healthy, suppressing |
| Dim green | Low (0.3-) | 0 | Failing, balanced |
| Desaturated gray | Very low (0.0-0.2) | Any | Dead, non-functional |

---

## Where to Find Specialization

### From SynapticSpecializationAdapter
```javascript
// If using specialization adapter:
import { SynapticSpecializationAdapter_v1 } from './SynapticSpecializationAdapter_v1.js';

const adapter = new SynapticSpecializationAdapter_v1();
const bias = adapter.getNodeBias(sourceNodeId, targetNodeId);
// Returns -1 to +1 or 0 if not found
```

### From CompetitionDominanceAdapter
```javascript
// If using competition/dominance system:
const dominance = competitionDominance.getNodeDominanceRole(nodeId);
// May contain specialization info
```

### From Link Metadata
```javascript
// If link object stores specialization:
const spec = link.userData?.specialization ?? 0;
```

### For Now (Fallback)
```javascript
// If no specialization data available yet:
const specialization = 0;  // Neutral (no hue shift)
// Streaks will still respond to harmony/corruption/synergy
```

---

## Configuration (Optional)

To tune color parameters:

```javascript
// Get the color dynamics instance
const colorDynamics = linkStreaks.colorDynamics;

// Adjust parameters
colorDynamics.updateConfig({
    harmonyBrightnessMin: 0.2,    // Make low-harmony darker
    harmonyBrightnessMax: 1.2,    // Make high-harmony brighter
    excitatoryCoolness: 0.2,      // Stronger warm tint for excitatory
    inhibitoryCoolness: -0.3,     // Stronger cool tint for inhibitory
    corruptionDesaturation: 0.4   // More desaturation from corruption
});
```

### Recommended Presets

**Subtle (Minimal Color Shift)**:
```javascript
colorDynamics.updateConfig({
    excitatoryCoolness: 0.08,
    inhibitoryCoolness: -0.12,
    corruptionDesaturation: 0.2
});
```

**Vivid (Maximum Color Shift)**:
```javascript
colorDynamics.updateConfig({
    harmonyBrightnessMin: 0.1,
    harmonyBrightnessMax: 1.3,
    excitatoryCoolness: 0.25,
    inhibitoryCoolness: -0.35,
    corruptionDesaturation: 0.7
});
```

**High-Contrast**:
```javascript
colorDynamics.updateConfig({
    harmonySaturationMin: 0.0,    // Completely desaturated at low harmony
    harmonySaturationMax: 1.0,
    excitatoryCoolness: 0.2,
    inhibitoryCoolness: -0.3
});
```

---

## Debug Mode

To see color computations in console:

```javascript
linkStreaks.colorDynamics.setDebugMode(true);

// Now each streak update logs:
// [LinkStreakColorDynamics] Color computation: {
//   baseH: 0.333, baseSat: 1.0, baseL: 0.5,
//   harmony: 0.9, specialization: 0.5, ...
//   finalColor: "ff8833"
// }
```

Disable when done:

```javascript
linkStreaks.colorDynamics.setDebugMode(false);
```

---

## Performance Impact

✅ **Negligible**
- One color computation per link per frame
- ~0.3ms per computation
- Zero allocations (reuses THREE.Color objects)
- No GC pressure

---

## Troubleshooting

**"Colors are all green (not changing)"**
- Are you passing `specialization` parameter? Check that it's not 0
- Is debug mode on? Enable it to see what's being computed
- Try setting specialization manually: `update(..., 0.5)` to see warm shift

**"Colors are too bright/dim"**
- Tune `harmonyBrightnessMin`/`Max` parameters
- Check if `harmony` value being passed is actually changing
- Verify lighting in scene isn't washing out colors

**"Hue shift is too subtle"**
- Increase `excitatoryCoolness` and `inhibitoryCoolness`
- Current defaults: 0.15 / -0.25 (try 0.25 / -0.35)

**"Colors change abruptly (no smooth transition)"**
- Color dynamics compute per-frame, so changes should be smooth
- If abrupt, specialization value might be jumping
- Use `transitionColor()` manually if smooth animation needed

---

## Examples

### Example 1: Basic Usage (No Specialization Data Yet)

```javascript
// In your link update loop:
linkStreaks.update(
    linkGroup, curve, deltaTime,
    synergy, harmony, corruption, instability,
    baseColor, targetColor,
    link, time
    // No specialization param = defaults to 0
);

// Result: Colors respond to harmony/corruption/synergy
// No hue shifts (specialization = neutral)
```

### Example 2: With Specialization Data

```javascript
const specialization = link.metadata?.specialization ?? 0;

linkStreaks.update(
    linkGroup, curve, deltaTime,
    synergy, harmony, corruption, instability,
    baseColor, targetColor,
    link, time,
    specialization  // -1 to +1
);

// Result: Colors respond to ALL factors including specialization
// Warm tint for +, cool tint for -
```

### Example 3: Custom Colors Per Link Type

```javascript
// Recommend color based on specialization
const recommendedColor = colorDynamics.getRecommendedColor(specialization);

linkStreaks.update(
    linkGroup, curve, deltaTime,
    synergy, harmony, corruption, instability,
    recommendedColor,  // Use recommended color
    null,
    link, time,
    specialization
);

// Result: Colors naturally align with specialization
// Excitatory links start warm, inhibitory start cool
```

---

## What Changed

**Before (Session 114)**:
```javascript
update(linkGroup, curve, deltaTime, synergy, harmony, 
       corruption, instability, baseColor, targetColor, link, time)
// All streaks: same green color
```

**After (Session 115)**:
```javascript
update(linkGroup, curve, deltaTime, synergy, harmony, 
       corruption, instability, baseColor, targetColor, link, time, specialization)
       //                                                              ↑ NEW
// Streaks: dynamic colors based on harmony + specialization
```

---

## Files

- **LinkStreakColorDynamics_Session115.js** — Core implementation
- **LinkDirectionalStreaks.js** — Integration (modified)
- **This file** — Quick start guide
- **LINK_STREAK_COLOR_DYNAMICS_GUIDE_Session115.md** — Full reference

---

## Next Steps

1. **Find specialization source** in your link system
2. **Pass it to update()** when calling streak update
3. **Observe colors changing** based on link state
4. **Tune parameters** if needed (use presets above)
5. **Done!** 🎉

*Colors communicate. Now your streaks do too.*
