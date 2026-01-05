# Node Aura Refactor — Complete Specification

## Executive Summary

The **NodeAuraRefactor_ElegantRim** system replaces existing node auras with a refined, physics-based Fresnel rim-lighting approach. The result is **subtle, elegant, boundary-aware energetic outlines** that enhance visual hierarchy without obscuring node geometry.

---

## Design Philosophy

### What Makes It Elegant

1. **Rim-Only Visibility** — Auras only appear at silhouette edges
   - Fresnel effect peaks at grazing angles
   - Completely fades when viewed head-on
   - Creates "boundary awareness" without dominating

2. **Geometric Clarity** — Core nodes remain fully opaque
   - Separate aura mesh (1.25x scale, never intersects)
   - Doesn't affect depth or silhouette
   - Core materials unchanged

3. **Restrained Color Palette** — Cool, intentional colors
   - Cyan (clarity focus)
   - Teal (harmonic resonance)
   - Violet (corruption/degradation)
   - Amber (harmony/unity)
   - **No neon, no saturation**

4. **Subtle Motion** — Breathing, not pulsing
   - Low-speed intensity modulation (1-2 cycles/3s)
   - No scale changes, no flickering
   - Organic, calming rhythm

---

## Technical Architecture

### Geometry

```
Node Core
  (original geometry, unchanged)
    ↓
Aura Shell (Icosahedron)
  - Scale: 1.25x core size (configurable: 1.15-1.35x)
  - Position: Synced to core every frame
  - Vertices: 16 subdivisions (shared between all nodes)
  - Culled: Respects node visibility
```

**Why Icosahedron?**
- Uniform distribution across sphere
- No obvious seams or artifacts
- 16 subdivisions provides smooth gradients
- Single shared geometry (memory efficient)

### Material

```
Shader: Custom GLSL with Fresnel calculation
  - Vertex: Pass normal + view direction
  - Fragment: Compute Schlick fresnel term
  
Blending: THREE.AdditiveBlending
  - Colors add (no darkening)
  - Transparent-friendly
  
Depth:
  - depthWrite: false (doesn't affect depth buffer)
  - depthTest: true (respects existing depth)
  
Side: THREE.FrontSide (no back faces rendered)
```

### Fresnel Calculation

```glsl
// Schlick Fresnel Approximation
float fresnel(float nDotV, float power) {
  float f0 = 0.04; // Base reflectivity
  return f0 + (1.0 - f0) * pow(1.0 - nDotV, power);
}

// Where:
// nDotV = dot(normal, viewDirection)
// power = rimPower (controls edge sharpness)
//
// Result:
// - nDotV near 1.0 (front-facing) → fresnel ≈ 0 (invisible)
// - nDotV near 0.0 (side-facing) → fresnel ≈ 1 (bright)
```

**Effect**:
- At center (nDotV ≈ 1): rimLight ≈ fresnel_min (0.01)
- At edges (nDotV ≈ 0): rimLight ≈ fresnel_max (1.0)
- Smooth falloff controlled by rimPower (1.5-3.0)

---

## Shader Architecture

### Vertex Shader

```glsl
// Input: position, normal, uv
// Output: vNormal, vViewDir, vUv

// Calculate world-space normal
vNormal = normalize(normalMatrix * normal);

// Calculate view direction from vertex to camera
vViewDir = normalize(cameraPosition - worldPosition);

// Pass to fragment shader
```

### Fragment Shader

```glsl
// Input: vNormal, vViewDir
// Process: Fresnel → Breathing → Color

// 1. FRESNEL: Physics-based rim term
rimLight = fresnel(dot(normalize(vNormal), normalize(vViewDir)))
rimLight = mix(uFresnelMin, uFresnelMax, rimLight)

// 2. BREATHING: Smooth intensity modulation
breathing = sin(time * speed) * amplitude + (1 - amplitude)
rimLight *= breathing

// 3. COLOR: Combine with aura parameters
rimLight *= uRimScale
rimLight *= uAuraStrength
rimColor = uAuraColor * rimLight

// 4. ALPHA: Compute final opacity
alpha = rimLight * uAuraOpacity

// 5. OUTPUT: Additive blend
gl_FragColor = vec4(rimColor, alpha)
```

---

## Animation System

### Breathing Effect

**Formula**:
```
intensity = sin(time * speed) * amplitude + (1 - amplitude)
```

**Parameters**:
- `speed`: 0.5-2.0 (cycles per second)
- `amplitude`: 0.3-0.5 (oscillation range)

**Result**:
- At peak: intensity ≈ 1.0 + amplitude (e.g., 1.3x)
- At trough: intensity ≈ 1.0 - amplitude (e.g., 0.7x)
- Cycle time: ~3 seconds (default)

**Why This Works**:
- Slow enough to be calming, not distracting
- Smooth sine curve (no sudden jumps)
- Amplitude controls subtlety (0.3-0.4 ideal)

### Alternative Animations (Future)

Could add:
- Position jitter (subtle, <0.1x scale)
- Color temperature cycling (warm → cool)
- Pulsed sync between linked nodes

**Currently excluded**:
- Scale changes (looks cheap)
- Noise-based effects (looks chaotic)
- Fast flickering (causes eye strain)

---

## Color Palette

All colors use cool tones (cyan→blue→violet→amber range):

| Name | Hex | RGB | Profile | Meaning |
|------|-----|-----|---------|---------|
| Aquamarine | #7fffd4 | (127, 255, 212) | default | Neutral, balanced |
| Bright Cyan | #00d9ff | (0, 217, 255) | clarity | Sharp, focused, signal |
| Light Sea Green | #20b2aa | (32, 178, 170) | resonance | Harmonic, connected |
| Pale Violet | #b0a0e6 | (176, 160, 230) | corrupted | Degraded, unstable |
| Soft Amber | #ffd700 | (255, 215, 0) | harmony | Unified, balanced |

**Design Constraints**:
- ✅ Cooler hues preferred (cyan, teal, violet, amber)
- ❌ No pure neon (saturated fluorescent)
- ❌ No pure white glow
- ❌ No red/orange (reserved for danger/corruption visual language)

---

## Parameter Reference

### Per-Profile Settings

```javascript
{
  default: {
    color: 0x7fffd4,           // Aquamarine cyan
    rimIntensity: 0.10,        // Base rim strength (0.0-0.15)
    rimWidth: 0.20,            // Shell scale (0.15-0.35 relative)
    rimPower: 1.8,             // Fresnel falloff (1.5-3.0)
    breathingSpeed: 1.5,       // Cycles per 3s (0.5-2.0)
  },
  // ... clarity, resonance, corrupted, harmony
}
```

### System-Wide Settings

```javascript
{
  rimWidthScale: 1.25,         // Shell scale multiplier (1.15-1.35)
  baseOpacity: 0.10,           // Alpha multiplier (0.05-0.15)
  debugEnabled: false,         // Console debug output
}
```

### Shader Uniforms

| Uniform | Range | Purpose |
|---------|-------|---------|
| `uTime` | [0, ∞) | Animation timeline |
| `uRimPower` | [1.0, 3.0] | Fresnel exponent (controls edge sharpness) |
| `uRimIntensity` | [0.05, 0.15] | Base rim strength |
| `uFresnelMin` | [0.0, 0.1] | Minimum fresnel (center visibility) |
| `uFresnelMax` | [0.8, 1.0] | Maximum fresnel (edge brightness) |
| `uAuraOpacity` | [0.05, 0.15] | Final alpha multiplier |
| `uBreathingIntensity` | [0.5, 2.0] | Animation speed |
| `uBreathingAmplitude` | [0.2, 0.5] | Oscillation range |

---

## Validation Checklist

### Visual Validation

- [ ] **Silhouette Test**: Rotate camera around node; aura only visible at edges
- [ ] **Head-On Test**: Face camera directly at node; aura fades completely
- [ ] **Core Integrity**: Core geometry fully opaque, colors unchanged
- [ ] **Color Taste**: Colors are cool and restrained (not neon)
- [ ] **Animation Smoothness**: Breathing is smooth sine curve (~1 cycle/3s)
- [ ] **No Artifacts**: No flickering, no noise, no seams
- [ ] **Visibility Toggle**: Aura disappears when node is hidden

### Technical Validation

- [ ] **Geometry**: Separate mesh, properly scaled (1.25x)
- [ ] **Material**: Additive blending, depthWrite=false
- [ ] **Shader**: Fresnel calculation correct (inverse dot product)
- [ ] **Registration**: All nodes registered on spawn, unregistered on destroy
- [ ] **Update Loop**: Position/scale/time updated each frame
- [ ] **Performance**: <0.5ms for 100+ nodes

### Debug Validation

```javascript
// Run in console with debug enabled
aura.test()                    // Full suite
aura.validateCore(node)        // Geometry checks
aura.validateRim(node)         // Fresnel checks
aura.validateBreathing()       // Animation checks
aura.inspect(node)             // Deep dive
```

---

## Performance Analysis

### Memory

**Per Aura**:
- Mesh: 3-point references
- Material: One ShaderMaterial clone
- Uniforms: 10-12 floats/vectors

**Shared**:
- Geometry: 1 IcosahedronGeometry (reused)
- Total overhead: ~50KB for 100 nodes

### CPU

**Per Frame**:
- Position update: O(n) copy operations
- Scale update: O(n) multiplications
- Time uniform: O(n) updates
- Expected: 0.1-0.5ms for 100+ nodes

**No:**
- Geometry recalculation
- Material recompilation
- Expensive math operations

### GPU

**Per Fragment**:
- Fresnel calculation: 3 multiplications + 1 power
- Breathing: 1 sin + 2 multiplications
- Color blend: additive
- Expected: ~10-15 instructions per pixel

**Optimization**:
- Early discard for alpha < 0.005
- Additive blending (simpler than transparency)
- Single shared geometry

---

## Integration Points

### Node Spawn

```javascript
function onNodeSpawn(node) {
  // Determine profile based on node state
  const profile = determineAuraProfile(node);
  
  // Register aura
  auraSystem.registerNode(node, profile);
}
```

### Node Update

```javascript
function onNodeStateChange(node, newState) {
  // Update aura profile if state changed
  const newProfile = determineAuraProfile(node);
  auraSystem.updateNodeProfile(node, newProfile);
}
```

### Render Loop

```javascript
function animate(deltaTime) {
  // Update all auras
  auraSystem.update(deltaTime);
  
  // Render scene
  renderer.render(scene, camera);
}
```

### Cleanup

```javascript
function onShutdown() {
  auraSystem.dispose();
}
```

---

## Debug Console API

### Enable Debug Mode

```javascript
toggleAuraDebug()
// Output: [AURA DEBUG] Aura debugging ENABLED
```

### Log All Auras

```javascript
logAuraStatus()
// Output:
// [AURA STATUS] 42 auras registered
//   Node=SignalKnot rimIntensity=0.120 rimWidth=125% profile=clarity visible=true
//   ...
```

### Full Validation Suite

```javascript
aura.test()
// Output: Full validation report with PASS/FAIL for each check
```

### Inspect Single Aura

```javascript
aura.inspect(node)
// Output: Deep dive into geometry, material, uniforms, color, state
```

### Deep Checks

```javascript
aura.validateCore(node)      // Geometry integrity
aura.validateRim(node)       // Fresnel parameters
aura.validateBreathing()     // Animation smoothness
```

---

## Troubleshooting

### Problem: Auras Not Visible

**Diagnosis**:
```javascript
toggleAuraDebug()
logAuraStatus()
aura.test()
```

**Likely Causes**:
1. Nodes not registered (check `logAuraStatus()`)
2. Opacity too low (try `baseOpacity = 0.15`)
3. Geometry clipped by scene camera
4. Material not applied to correct layer

**Fix**:
```javascript
// Verify registration
const node = someNode;
auraSystem.registerNode(node, 'clarity');

// Check debug info
aura.inspect(node);

// Increase opacity
auraSystem.baseOpacity = 0.15;
```

### Problem: Auras Too Bright

**Fix**:
```javascript
auraSystem.baseOpacity = 0.05;  // Reduce opacity
auraSystem.rimWidthScale = 1.15; // Narrow rim
```

### Problem: Flickering/Noise

**Diagnosis**: Usually texture sampling or precision issue

**Fix**:
1. Verify rimPower in valid range (1.5-3.0)
2. Check fresnel min/max correct (0.01-1.0)
3. Ensure smooth breathing (sine wave, not noise)

### Problem: Performance Degradation

**Diagnosis**: Check GPU thread

**Fixes**:
```javascript
// Reduce geometry detail
auraSystem.auraGeometry = new THREE.IcosahedronGeometry(1, 12); // 12 instead of 16

// Disable on low-end devices
if (lowEndDevice) {
  auraSystem.enabled = false;
}
```

---

## Future Enhancements

### Phase 2: Advanced Features

1. **Distance Modulation** — Intensity fades with camera distance
2. **Synergy Coupling** — Linked auras pulse in sync
3. **State Transitions** — Smooth color shifts between profiles
4. **Custom Profiles** — User-defined color + parameter sets

### Phase 3: Visual Polish

1. **Glyph Integration** — Aura reacts to glyph state
2. **Particle Trails** — Optional trailing particles
3. **Harmonic Resonance** — Visual feedback for harmony state
4. **Corruption Bloom** — Subtle corruption aura variations

### Phase 4: Performance

1. **LOD System** — Fewer polygons at distance
2. **Culling** — Frustum/distance culling
3. **Batch Rendering** — Single material for all auras
4. **GPU Instancing** — DirectX 11+ optimization

---

## References

### Physics & Math

- **Fresnel Effect**: https://en.wikipedia.org/wiki/Fresnel_equations
- **Schlick Approximation**: https://en.wikipedia.org/wiki/Schlick%27s_approximation
- **Rim Lighting**: Standard CG technique (used in games, films)

### Three.js

- **ShaderMaterial**: https://threejs.org/docs/#api/en/materials/ShaderMaterial
- **AdditiveBlending**: https://threejs.org/docs/#api/en/constants/Materials
- **IcosahedronGeometry**: https://threejs.org/docs/#api/en/geometries/IcosahedronGeometry

### Color Science

- **Web Color Names**: https://en.wikipedia.org/wiki/Web_colors
- **Color Perception**: https://en.wikipedia.org/wiki/Color_theory

---

## Appendix: Test Plan

### Unit Tests

- [ ] Aura registers without crashing
- [ ] Aura unregisters cleanly
- [ ] Geometry doesn't cause memory leaks
- [ ] Material uniforms update correctly

### Integration Tests

- [ ] Aura follows node position
- [ ] Aura scales with node
- [ ] Aura hides when node hides
- [ ] Multiple auras don't interfere
- [ ] Scene performance acceptable

### Visual Tests

- [ ] Fresnel effect visible at edges
- [ ] Aura fades head-on
- [ ] Breathing smooth and subtle
- [ ] Colors appropriate for state
- [ ] No visual artifacts

### Edge Cases

- [ ] Nodes at extreme distances
- [ ] Nodes with scale = 0
- [ ] Nodes with unusual geometries
- [ ] Rapid spawn/despawn cycles
- [ ] Scene with 1000+ nodes

---

## Conclusion

The **NodeAuraRefactor_ElegantRim** system provides a refined, physics-based aura implementation that enhances visual hierarchy while maintaining clarity and elegance. By leveraging Fresnel effects and restrained design principles, it achieves "boundary awareness" without spectacle — the perfect complement to ATOMA's sophisticated node-network visualization.

