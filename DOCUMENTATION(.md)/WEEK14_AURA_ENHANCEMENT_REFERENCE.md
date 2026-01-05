# WEEK 14: AURA ENHANCEMENT — TECHNICAL REFERENCE

**Phase 3C | Week 14 | API & Uniform Reference**

---

## 📋 TABLE OF CONTENTS

1. [API Reference](#api-reference)
2. [GPU Uniforms](#gpu-uniforms)
3. [Enhancement Formulas](#enhancement-formulas)
4. [Integration Checklist](#integration-checklist)
5. [Troubleshooting](#troubleshooting)

---

## API REFERENCE

### Constructor

```javascript
new ArchetypeAuraEnhancement_v1(config)
```

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `config.nodeAura` | NodeAuraSystem_v1 | ✅ | — | Week 9 aura system |
| `config.linkAura` | LinkAuraSystem_v1 | ❌ | null | Week 10 aura system (optional) |
| `config.archetypeCurves` | ArchetypeAscensionCurves_v1 | ✅ | — | Week 13 archetype system |
| `config.debugEnabled` | Boolean | ❌ | false | Enable 1% sampling logs |

**Example:**

```javascript
const archetypeAuraFX = new ArchetypeAuraEnhancement_v1({
  nodeAura: this.nodeAuraSystem,
  linkAura: this.linkAuraSystem,
  archetypeCurves: this.archetypeCurves,
  debugEnabled: false,
});
```

---

### Methods

#### `update(deltaTime)`

Main update loop - computes and applies enhancements.

```javascript
archetypeAuraFX.update(0.016);  // ~60 FPS
```

**Behavior:**
- Reads archetype evolution from all nodes
- Computes enhancement parameters per archetype
- Applies EMA smoothing
- Updates material uniforms
- O(N) complexity where N = number of nodes

**Must be called AFTER `archetypeCurves.update()`**

---

#### `getNodeEnhancement(node)`

Retrieve enhancement state for a specific node.

```javascript
const enhancement = archetypeAuraFX.getNodeEnhancement(myNode);
```

**Returns:**

```javascript
{
  currentIntensity: 1.24,
  targetIntensity: 1.28,
  currentRadiusBoost: 1.15,
  targetRadiusBoost: 1.18,
  currentColorShift: { r: 0.05, g: 0.02, b: 0.08 },
  targetColorShift: { r: 0.06, g: 0.03, b: 0.10 },
  currentBloomBoost: 1.12,
  targetBloomBoost: 1.14,
  currentDistortion: 0.18,
  targetDistortion: 0.20,
  emaAlpha: 0.12,
  // ... (internal state)
}
```

**or `null` if node not enhanced**

---

#### `getStats()`

Get aggregate enhancement statistics.

```javascript
const stats = archetypeAuraFX.getStats();
```

**Returns:**

```javascript
{
  enhancedNodeCount: 42,        // Nodes with active enhancements
  avgIntensity: 1.34,           // Average intensity across nodes
  maxIntensity: 2.18,           // Maximum intensity observed
}
```

---

#### `registerMaterialHook(material)`

Manually register shader compilation hook (advanced).

```javascript
archetypeAuraFX.registerMaterialHook(myMaterial);
```

**Purpose:** Ensures uniforms are injected at shader compile time

**Normally called automatically during update()**

---

#### `dispose()`

Clean up system (call on shutdown).

```javascript
archetypeAuraFX.dispose();
```

---

## GPU UNIFORMS

### Complete Uniform Table

| Uniform | GLSL Type | CPU Type | Range | Initial | Purpose |
|---------|-----------|----------|-------|---------|---------|
| `uArchetypeIntensity` | float | Number | [0.5, 2.5] | 1.0 | Aura glow strength |
| `uArchetypeRadiusBoost` | float | Number | [0.5, 2.0] | 1.0 | Sphere radius scale |
| `uArchetypeColorShift` | vec3 | Vector3 | [0,0,0]–[1,1,1] | (0,0,0) | RGB additive shift |
| `uArchetypeBloomBoost` | float | Number | [0.5, 2.5] | 1.0 | Bloom/glow strength |
| `uArchetypeDistortionAmount` | float | Number | [0.0, 1.0] | 0.0 | Noise/distortion |

### Injection Code Pattern

**JavaScript side:**

```javascript
// In update loop:
material.uniforms.uArchetypeIntensity.value = 1.24;
material.uniforms.uArchetypeColorShift.value.set(0.05, 0.02, 0.08);
```

**GLSL Shader side (fragment shader example):**

```glsl
uniform float uArchetypeIntensity;
uniform vec3 uArchetypeColorShift;
uniform float uArchetypeBloomBoost;

void main() {
  vec3 baseColor = /* ... */;
  
  // Apply archetype enhancements
  baseColor *= uArchetypeIntensity;
  baseColor += uArchetypeColorShift * 0.5;
  baseColor *= (1.0 + uArchetypeBloomBoost * 0.3);
  
  gl_FragColor = vec4(baseColor, 1.0);
}
```

---

## ENHANCEMENT FORMULAS

### Per-Archetype Enhancement Equations

#### SAGE

```javascript
intensityBoost = 1.0 + (ascMod * 0.4)
radiusBoost = 1.0 + (ascMod * 0.3)
bloomBoost = 0.7 + (ascMod * 0.3)
distortion = ascMod * 0.2
colorShift = (0, 0, 0.1)

// Range at ascMod ∈ [0, 1]:
// Intensity: 1.0 → 1.4
// Radius: 1.0 → 1.3
// Bloom: 0.7 → 1.0
// Distortion: 0.0 → 0.2
```

#### WARLOCK

```javascript
intensityBoost = 0.8 + (ascMod * 0.8) + sin(time * 4) * 0.3
radiusBoost = 1.0 + sin(time * 3) * 0.4
bloomBoost = 1.2 + (ascMod * 0.5)
distortion = 0.3 + (ascMod * 0.6)
colorShift = (0.15, 0, 0)

// Range (oscillatory):
// Intensity: 0.5 → 1.6 + sin variation
// Radius: 0.6 → 1.4 (flickers!)
// Bloom: 1.2 → 1.7
// Distortion: 0.3 → 0.9
```

#### SENTINEL

```javascript
intensityBoost = 1.0 + (ascMod * 0.2) + sin(time * 1.5) * 0.1
radiusBoost = 1.0 + (ascMod * 0.15) + sin(time * 1.2) * 0.05
bloomBoost = 0.5 + (ascMod * 0.2)
distortion = ascMod * 0.1
colorShift = (0, 0, 0.05)

// Range (slow breathing):
// Intensity: 0.9 → 1.3 (slow oscillation)
// Radius: 0.95 → 1.15 (slow oscillation)
// Bloom: 0.5 → 0.7
// Distortion: 0.0 → 0.1
```

#### EMPATH

```javascript
intensityBoost = 1.0 + (ascMod * 0.5) + sin(time * 2.5) * 0.15
radiusBoost = 0.95 + (ascMod * 0.4)
bloomBoost = 0.8 + (ascMod * 0.4)
distortion = ascMod * 0.3
colorShift = (0.05, 0.1, 0)

// Range (harmonic oscillation):
// Intensity: 0.85 → 1.65
// Radius: 0.95 → 1.35
// Bloom: 0.8 → 1.2
// Distortion: 0.0 → 0.3
```

#### INVOKER

```javascript
intensityBoost = 1.1 + (ascMod * 0.6)
radiusBoost = 1.0 + (ascMod * 0.35)
bloomBoost = 1.0 + (ascMod * 0.5)
distortion = 0.2 + (ascMod * 0.4)
colorShift = (0.1, 0.05, 0)

// Range (steady, strong):
// Intensity: 1.1 → 1.7
// Radius: 1.0 → 1.35
// Bloom: 1.0 → 1.5
// Distortion: 0.2 → 0.6
```

#### MYTHIC

```javascript
intensityBoost = 1.2 + (mult * 0.3)        // mult = ascensionMultiplier!
radiusBoost = 1.1 + (ascMod * 0.5)
bloomBoost = 1.3 + (mult * 0.4)
distortion = 0.5 + (ascMod * 0.5)
colorShift = (0.1, 0.1, 0.2)

// Range (global multiplier!):
// Intensity: 1.2 → 2.5+ (uses mult, not ascMod!)
// Radius: 1.1 → 1.6
// Bloom: 1.3 → 2.5+
// Distortion: 0.5 → 1.0
```

---

## INTEGRATION CHECKLIST

### Pre-Integration

- [ ] NodeAuraSystem_v1 initialized and working
- [ ] LinkAuraSystem_v1 initialized and working (or null is OK)
- [ ] ArchetypeAscensionCurves_v1 initialized and working
- [ ] All dependencies imported correctly

### Integration Steps

- [ ] Import ArchetypeAuraEnhancement_v1
- [ ] Create instance in game constructor
- [ ] Pass correct references (nodeAura, linkAura, archetypeCurves)
- [ ] Call update() in game loop AFTER archetypeCurves.update()
- [ ] Call dispose() in cleanup

### Verification

- [ ] No console errors on startup
- [ ] Aura systems still render (no visual breaks)
- [ ] Nodes show enhanced auras based on archetype
- [ ] Sage nodes show cyan glow
- [ ] Warlock nodes show red flickering
- [ ] Sentinel nodes show blue breathing
- [ ] Empath nodes show warm waves
- [ ] Invoker nodes show golden glow
- [ ] Mythic nodes show purple maximum glow
- [ ] Transitions are smooth (no jarring jumps)
- [ ] Performance is acceptable (<0.5ms for 200 nodes)

### Testing Commands (Console)

```javascript
// Check if system initialized
console.log(game.archetypeAuraFX);  // Should show object

// Get stats
const stats = game.archetypeAuraFX.getStats();
console.log(stats);

// Get enhancement for a node
const enhance = game.archetypeAuraFX.getNodeEnhancement(game.aiNodes.nodes[0]);
console.log(enhance);

// Check material uniforms
const auraInstance = game.nodeAuraSystem.auras.values().next().value;
console.log(auraInstance.material.uniforms.uArchetypeIntensity);
```

---

## TROUBLESHOOTING

### Issue: "Cannot read property 'auras' of undefined"

**Cause:** NodeAuraSystem_v1 not initialized or missing

**Fix:**
```javascript
// Check that nodeAura is initialized BEFORE archetypeAuraFX:
console.log(this.nodeAuraSystem);  // Should show object
console.log(this.nodeAuraSystem.auras);  // Should be a Map
```

### Issue: Auras not enhancing (no visible changes)

**Cause:** 
1. archetypeAuraFX.update() not called
2. archetype evolution missing
3. Materials don't support uniforms

**Fix:**
```javascript
// Check call order:
this.archetypeCurves.update(deltaTime);      // Must be first
this.archetypeAuraFX.update(deltaTime);      // Must be second

// Check archetype evolution:
const ae = game.aiNodes.nodes[0]?.userData?.archetypeEvolution;
console.log(ae);  // Should show full state

// Check material uniforms:
const mat = game.nodeAuraSystem.auras.values().next().value.material;
console.log(mat.uniforms);  // Should include uArchetypeIntensity
```

### Issue: Performance degradation

**Cause:** Too many nodes, or other systems adding overhead

**Fix:**
```javascript
// Profile in DevTools:
// 1. Open Performance tab
// 2. Record 10 seconds
// 3. Look for ArchetypeAuraEnhancement calls
// 4. Should be <0.5ms per frame

// Or check stats:
const stats = game.archetypeAuraFX.getStats();
console.log(`Enhanced nodes: ${stats.enhancedNodeCount}`);
// If > 500, may need optimization
```

### Issue: "uArchetypeIntensity is not defined" in shader console

**Cause:** Uniform not injected into shader

**Fix:**
```javascript
// Check material compilation:
// 1. Material must support onBeforeCompile
// 2. ShaderMaterial types support this
// 3. StandardMaterial may not

// Manually trigger update:
game.archetypeAuraFX.update(0.016);
game.archetypeAuraFX.update(0.016);  // Twice to ensure injection
```

### Issue: Color shifts not visible

**Cause:** Color shift too subtle or shader not using uniform

**Fix:**
```javascript
// Increase color shift in archetype formula:
// Current: colorShift = { r: 0.05, g: 0.1, b: 0 }
// Try: colorShift = { r: 0.15, g: 0.25, b: 0 }

// In shader, make sure uniform is used:
baseColor += uArchetypeColorShift * 0.5;  // or increase multiplier
```

### Issue: Smooth transitions choppy or delayed

**Cause:** EMA alpha too low or too high

**Fix:**
```javascript
// Current EMA alpha = 0.12 (fairly responsive)
// Lower = smoother but more delayed
// Higher = more responsive but choppier

// Try adjusting (edit ArchetypeEnhancementState constructor):
this.emaAlpha = 0.20;  // More responsive
// or
this.emaAlpha = 0.08;  // Smoother
```

---

## REFERENCE TABLES

### Archetype Enhancement Summary

| Archetype | Intensity | Radius | Bloom | Distortion | Color | Behavior |
|-----------|-----------|--------|-------|------------|-------|----------|
| Sage | 1.0–1.4 | 1.0–1.3 | 0.7–1.0 | 0.0–0.2 | Cyan | Smooth |
| Warlock | 0.5–1.6* | 0.6–1.4* | 1.2–1.7 | 0.3–0.9 | Red | Chaotic |
| Sentinel | 0.9–1.3* | 0.95–1.15* | 0.5–0.7 | 0.0–0.1 | Steel | Breathing |
| Empath | 0.85–1.65* | 0.95–1.35 | 0.8–1.2 | 0.0–0.3 | Warm | Harmonic |
| Invoker | 1.1–1.7 | 1.0–1.35 | 1.0–1.5 | 0.2–0.6 | Gold | Energetic |
| Mythic | 1.2–2.5+ | 1.1–1.6 | 1.3–2.5+ | 0.5–1.0 | Purple | Legendary |

*Includes oscillation (sin variation)*

### Tier Boost Multiplier

| Tier | Name | Boost to Intensity | Boost to Bloom |
|------|------|-------------------|-----------------|
| 0 | Dormant | 0.5–1.0 | 0.5–1.0 |
| 1 | Awakened | 0.6–1.2 | 0.6–1.2 |
| 2 | Ascending | 0.7–1.4 | 0.7–1.4 |
| 3 | Mythic | 0.85–1.7 | 0.85–1.7 |
| 4 | Transcendent | 1.0–2.0 | 1.0–2.0 |

### Oscillation Frequencies

| Archetype | Signal | Frequency | Amplitude |
|-----------|--------|-----------|-----------|
| Warlock | Intensity | 4x/sec | ±0.3 |
| Warlock | Radius | 3x/sec | ±0.4 |
| Sentinel | Intensity | 1.5x/sec | ±0.1 |
| Sentinel | Radius | 1.2x/sec | ±0.05 |
| Empath | Intensity | 2.5x/sec | ±0.15 |

---

*Reference Version: 1.0 | Week 14 | Phase 3C*
