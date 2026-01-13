# WEEK 16: ARCHETYPE SHADER MODES — COMPLETE REFERENCE

## Uniform Formulas by Archetype

### SAGE (Archetype ID: 0)

**Formula Matrix:**
```
Parameter              Formula                               Range       Driver
─────────────────────────────────────────────────────────────────────────────────
uModeIntensity         0.4 + clarity * 0.4                  [0.4, 0.8]  clarity
uModeDistortion        0.1 * (1.0 - clarity)                [0.0, 0.1]  clarity
uModeBloom             0.3 + clarity * 0.5                  [0.3, 0.8]  clarity
uModeHueShift          clarity * 0.3                        [0.0, 0.3]  clarity
uModeNoiseShift        0.1 * (1.0 - clarity)                [0.0, 0.1]  clarity
uModeGradientMix       0.3 + clarity * 0.4                  [0.3, 0.7]  clarity
uModeIridescence       0.0                                  [0.0, 0.0]  –
```

**Clarity Signal Breakdown:**
- `clarity = 1.0` (max): Full bloom, minimal distortion, max hue shift
- `clarity = 0.5` (mid): Balanced state
- `clarity = 0.0` (min): Low bloom, high distortion, no hue shift

---

### WARLOCK (Archetype ID: 1)

**Formula Matrix:**
```
Parameter              Formula                               Range       Driver
─────────────────────────────────────────────────────────────────────────────────
uModeIntensity         0.6 + entropy * 0.6                  [0.6, 1.2]* entropy
uModeDistortion        0.5 + corruption * 0.5               [0.5, 1.0]* corruption
uModeBloom             0.7 + entropy * 0.3                  [0.7, 1.0]  entropy
uModeHueShift          -0.3 + corruption * 0.6              [-0.3, 0.3] corruption
uModeNoiseShift        0.8 + entropy * 0.2                  [0.8, 1.0]  entropy
uModeGradientMix       0.7 + (1-corruption) * 0.2           [0.7, 0.9]  corruption
uModeIridescence       0.0                                  [0.0, 0.0]  –
```
*Values clamped to [0, 1] by uniform updater

**Signal Interaction:**
- Both `entropy` and `corruption` drive intensity
- `entropy` → distortion, bloom, noise (chaotic appearance)
- `corruption` → hue shift toward red (warm corruption tint)

---

### SENTINEL (Archetype ID: 2)

**Formula Matrix:**
```
Parameter              Formula                               Range       Driver
─────────────────────────────────────────────────────────────────────────────────
uModeIntensity         0.5 + harmony * 0.3                  [0.5, 0.8]  harmony
uModeDistortion        0.1 * harmony                        [0.0, 0.1]  harmony
uModeBloom             0.4 * harmony                        [0.0, 0.4]  harmony
uModeHueShift          0.1                                  [0.1, 0.1]  – (fixed)
uModeNoiseShift        0.05 * (1.0 - harmony)               [0.0, 0.05] harmony
uModeGradientMix       0.4 + harmony * 0.2                  [0.4, 0.6]  harmony
uModeIridescence       0.0                                  [0.0, 0.0]  –
```

**Harmony Signal Behavior:**
- `harmony = 1.0` (max order): Max intensity/bloom/distortion reduction
- `harmony = 0.5` (mid): Balanced structured appearance
- `harmony = 0.0` (min chaos): Min intensity, max noise

---

### EMPATH (Archetype ID: 3)

**Formula Matrix:**
```
Parameter              Formula                               Range       Driver
─────────────────────────────────────────────────────────────────────────────────
uModeIntensity         0.5 + resonance * 0.5                [0.5, 1.0]  resonance
uModeDistortion        0.2 * resonance                      [0.0, 0.2]  resonance
uModeBloom             0.5 + resonance * 0.3                [0.5, 0.8]  resonance
uModeHueShift          0.2 * resonance                      [0.0, 0.2]  resonance
uModeNoiseShift        0.3 * resonance                      [0.0, 0.3]  resonance
uModeGradientMix       0.5 + resonance * 0.3                [0.5, 0.8]  resonance
uModeIridescence       0.0                                  [0.0, 0.0]  –
```

**Resonance Signal Amplification:**
- Single personality driver for clean behavior
- `resonance = 1.0`: Max harmonic bloom (connected state)
- `resonance = 0.0`: Minimal visual feedback (isolated state)

---

### INVOKER (Archetype ID: 4)

**Formula Matrix:**
```
Parameter              Formula                               Range       Driver
─────────────────────────────────────────────────────────────────────────────────
uModeIntensity         0.6 + energy * 0.4                   [0.6, 1.0]  energy
uModeDistortion        0.3 + focus * 0.2                    [0.3, 0.5]  focus
uModeBloom             0.8 + energy * 0.2                   [0.8, 1.0]  energy
uModeHueShift          0.3 + focus * 0.2                    [0.3, 0.5]  focus
uModeNoiseShift        0.2 * energy                         [0.0, 0.2]  energy
uModeGradientMix       0.7 + focus * 0.2                    [0.7, 0.9]  focus
uModeIridescence       0.0                                  [0.0, 0.0]  –
```

**Dual-Signal Driving:**
- `energy` controls intensity/bloom (power)
- `focus` controls distortion/hue/gradient (precision)

---

### MYTHIC (Archetype ID: 5)

**Formula Matrix:**
```
Parameter              Formula                                        Range      Driver
──────────────────────────────────────────────────────────────────────────────────────────
uModeIntensity         0.7 + ascensionMult * 0.2                      [0.7, 1.0+] ascMult
uModeDistortion        0.4 + (tier > 0 ? 0.2 : 0)                     [0.4, 0.6] tier
uModeBloom             0.9 + ascensionMult * 0.1                      [0.9, 1.0+] ascMult
uModeHueShift          0.5 + ascensionMult * 0.3                      [0.5, 0.8+] ascMult
uModeNoiseShift        0.5 + ascensionMult * 0.2                      [0.5, 0.7+] ascMult
uModeGradientMix       0.6 + ascensionMult * 0.3                      [0.6, 0.9+] ascMult
uModeIridescence       0.5 + min(1.0, ascensionMult * 0.5)            [0.5, 1.0]  ascMult
```

**Ascension-Driven Behavior:**
- `ascensionMultiplier` is primary driver (Week 13 output)
- `ascensionTier` gates distortion boost (tier > 0)
- All parameters scale with ascension progression
- Iridescence unique to Mythic (special effect)

---

## EMA Smoothing Implementation

### Smoothing Formula

```
currentValue ← currentValue + (targetValue - currentValue) × factor
factor = min(1.0, emaAlpha × deltaTime × 60.0)
```

### Timing Characteristics

| Alpha | Transition Time* | Feel |
|-------|------------------|------|
| 0.08  | 0.7–0.9s        | Slow, organic |
| 0.12  | 0.4–0.6s        | Balanced (default) |
| 0.15  | 0.3–0.5s        | Snappy, responsive |
| 0.20  | 0.2–0.4s        | Crisp, energetic |

*At 60 FPS with typical value transitions

---

## Archetype-to-ID Mapping

```javascript
{
  'sage': 0,
  'warlock': 1,
  'sentinel': 2,
  'empath': 3,
  'invoker': 4,
  'mythic': 5,
}
```

**String Resolution:** Automatic conversion from string IDs to numeric IDs in `_getArchetypeId()`

---

## Uniform Value Constraints

### Hard Clamps (Applied Every Frame)

```javascript
uModeIntensity      → Math.max(0, Math.min(1, value))
uModeDistortion     → Math.max(0, Math.min(1, value))
uModeBloom          → Math.max(0, Math.min(1, value))
uModeHueShift       → Math.max(-1, Math.min(1, value))
uModeNoiseShift     → Math.max(0, Math.min(1, value))
uModeGradientMix    → Math.max(0, Math.min(1, value))
uModeIridescence    → Math.max(0, Math.min(1, value))
```

---

## GPU Shader Injection Pattern

### Vertex Shader Injection

```glsl
#include <common>

uniform int uShaderModeId;
uniform float uModeIntensity;
uniform float uModeDistortion;
uniform float uModeBloom;
uniform float uModeHueShift;
uniform float uModeNoiseShift;
uniform float uModeGradientMix;
uniform float uModeIridescence;
```

### Fragment Shader Injection

```glsl
#include <common>

uniform int uShaderModeId;
uniform float uModeIntensity;
uniform float uModeDistortion;
uniform float uModeBloom;
uniform float uModeHueShift;
uniform float uModeNoiseShift;
uniform float uModeGradientMix;
uniform float uModeIridescence;
```

---

## Performance Metrics

### Per-Frame Costs

| Operation | Nodes | Cost |
|-----------|-------|------|
| Node state lookup | 200 | ~0.1ms |
| Compute mode params | 200 | ~0.2ms |
| EMA smoothing | 200 | ~0.05ms |
| Uniform updates | 200 | ~0.35ms |
| **Total** | **200** | **~0.7ms** |

### Memory Profile

| Data Structure | Size per Node | Total (200 nodes) |
|---|---|---|
| ShaderModeState | ~64 bytes | 12.8 KB |
| WeakMap overhead | ~16 bytes | 3.2 KB |
| **Total** | **~80 bytes** | **16 KB** |

---

## Integration Code Examples

### Full Constructor Integration

```javascript
this.archetypeShaderModes = new ArchetypeShaderModes_v1({
  archetypeCurves: this.archetypeCurves,        // Week 13
  archetypeAuraFX: this.archetypeAuraFX,        // Week 14
  archetypeColorFX: this.archetypeColorFX,      // Week 15
  nodeAuraSystem: this.nodeAuraSystem,          // Week 9
  linkAuraSystem: this.linkAuraSystem,          // Week 10
  debugEnabled: this.debugMode || false,
});
```

### Update Loop Integration

```javascript
animate() {
  const deltaTime = this.clock.getDelta();
  
  // Week 13: Update ascension curves
  this.archetypeCurves.update(deltaTime);
  
  // Week 14: Update aura enhancements
  this.archetypeAuraFX.update(deltaTime);
  
  // Week 15: Update color palettes
  this.archetypeColorFX.update(deltaTime);
  
  // Week 16: Update shader modes (NEW)
  this.archetypeShaderModes.update(deltaTime);
  
  // Render
  this.renderer.render(this.scene, this.camera);
  
  requestAnimationFrame(() => this.animate());
}
```

### Cleanup Integration

```javascript
dispose() {
  this.archetypeShaderModes?.dispose();
  this.archetypeColorFX?.dispose();
  this.archetypeAuraFX?.dispose();
  this.archetypeCurves?.dispose();
  // ... other cleanup ...
}
```

---

## Troubleshooting Guide

### Issue: Uniforms Not Updating

**Symptom:** Shader mode parameters stay constant despite signal changes

**Solution:**
1. Verify `material.uniforms` exists (check console)
2. Confirm `onBeforeCompile` was called (material should be compiled)
3. Enable `debugEnabled: true` and check log output
4. Verify `archetypeEvolution` data is present on nodes

### Issue: Shader Artifacts / Visual Glitches

**Symptom:** Auras flicker or show unexpected colors

**Solution:**
1. Reduce EMA alpha for slower transitions: `state.emaAlpha = 0.08`
2. Check value clamping is being applied
3. Verify Week 13–15 systems are updating correctly
4. Check that `archetypeId` is valid (0–5 range)

### Issue: Performance Degradation

**Symptom:** Frame rate drops significantly after enabling Week 16

**Solution:**
1. Check material patching isn't happening repeatedly (WeakSet guards)
2. Verify loop isn't processing disposed nodes/links
3. Enable `debugEnabled: true` to measure update time
4. Consider enabling low-FX mode for non-critical scenes

---

## State Lifecycle

### Node State Creation Flow

```
Node spawned
    ↓
First getNodeState() call
    ↓
ShaderModeState created with archetypeId
    ↓
State stored in WeakMap (node → state)
    ↓
Every frame: _computeModeParams() + smooth()
    ↓
Node deleted/GC'd
    ↓
WeakMap entry auto-removed (GC)
```

---

## Personality Signal Ranges

All personality signals are expected in range [0, 1]:

| Signal | Min (0.0) | Max (1.0) |
|--------|-----------|-----------|
| `clarity` | Confused | Enlightened |
| `harmony` | Chaotic | Harmonious |
| `resonance` | Isolated | Connected |
| `corruption` | Pure | Corrupted |
| `entropy` | Ordered | Chaotic |
| `focus` | Scattered | Concentrated |
| `energy` | Depleted | Energized |

---

## Recommended Integration Order

1. ✅ Week 9: NodeAuraSystem_v1
2. ✅ Week 10: LinkAuraSystem_v1
3. ✅ Week 13: ArchetypeAscensionCurves_v1
4. ✅ Week 14: ArchetypeAuraEnhancement_v1
5. ✅ Week 15: ArchetypeColorPaletteSystem_v1
6. ✅ **Week 16: ArchetypeShaderModes_v1** ← You are here

---

*End of WEEK16_SHADER_MODE_REFERENCE.md*
