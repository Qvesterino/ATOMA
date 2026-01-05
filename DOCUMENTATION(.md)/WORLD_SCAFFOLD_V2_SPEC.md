# WorldScaffold v2 — Technical Specification

## File Location
- **Path:** `/WorldScaffold_v2.js`
- **Export:** `WorldScaffold_v2` (ES6 class)
- **Dependencies:** Three.js only

---

## Class Definition

### Constructor
```javascript
constructor()
```
- Initializes three private properties to `null`
- No side effects, safe to instantiate multiple times
- Actual initialization deferred to `init()` method

### Public Methods

#### init(scene, camera)
```javascript
init(scene: THREE.Scene, camera: THREE.Camera): void
```

**Behavior:**
- Creates all static geometry and materials
- Adds objects to scene
- Logs confirmation message to console
- **Must be called exactly once per scaffold instance**

**Parameters:**
- `scene` — The Three.js scene to add scaffold to
- `camera` — Camera reference (used for setup validation only, not stored)

**Side Effects:**
- Modifies `scene.fog` (sets static fog)
- Adds three objects to scene
- Populates `this.groundPlane`, `this.horizonOverlay`

**Performance:**
- One-time cost: ~5-10ms
- No runtime overhead after completion

---

#### validate()
```javascript
validate(): Object
```

**Returns:**
```javascript
{
  groundPlane: boolean,        // True if geometry created
  horizonOverlay: boolean,     // True if shader mesh created
  fog: boolean,                // True if fog set (always false, see note)
  hasUpdateMethod: boolean,    // False (confirming static-only)
  hasTickMethod: boolean       // False (confirming static-only)
}
```

**Purpose:** Debugging utility to confirm scaffold is static-only

**Note:** `fog` property always returns false because the system doesn't store a reference to `scene.fog` (it's immutable and belongs to scene)

---

## Visual Layers

### Layer 1: Ground Plane

**Geometry:**
- Type: `PlaneGeometry(2000, 2000)`
- Position: Y = -500
- Rotation: -90° around X-axis (horizontal orientation)

**Material:**
```javascript
MeshStandardMaterial {
  map: CanvasTexture (radial gradient),
  color: 0x1a1a2e (deep blue-black),
  metalness: 0.0,
  roughness: 0.95,
  emissive: 0x0a0a14,
  emissiveIntensity: 0.3,
  side: THREE.DoubleSide
}
```

**Texture:**
- **Type:** Canvas-based radial gradient
- **Center:** `#2a2a42` (muted purple)
- **Mid:** `#1a1a2e` (deep blue)
- **Edges:** `#0a0a1a` (near-black)
- **Noise:** 5% intensity, deterministic (seed-based)

**Shadow Behavior:**
- `receiveShadow: true` (receives projected shadows)
- `castShadow: false` (doesn't cast shadows)

---

### Layer 2: Horizon Overlay

**Geometry:**
- Type: `SphereGeometry(3000, 32, 32)`
- Position: World origin (0, 0, 0)
- Rendered from inside (BackSide rendering)

**Material:**
```javascript
ShaderMaterial {
  vertexShader: [position interpolation],
  fragmentShader: [static vertical gradient],
  side: THREE.BackSide,
  depthWrite: false,
  depthTest: true,
  fog: false,
  renderOrder: -1
}
```

**Shader Features:**
- **No Time Uniforms:** Completely static
- **No Camera Uniforms:** Not camera-reactive
- **Gradient:** Vertical Y-based (bottom → top)
- **Colors:**
  - Horizon: `vec3(0.06, 0.06, 0.12)` (deep violet)
  - Zenith: `vec3(0.02, 0.02, 0.08)` (darker blue)
- **Atmospheric Haze:** Subtle exponential fade at horizon

**Rendering:**
- `renderOrder: -1` ensures it never occludes nodes
- `depthWrite: false` prevents depth buffer corruption
- `depthTest: true` respects depth ordering

---

### Layer 3: Static Fog

**Type:** `THREE.Fog`
```javascript
Fog(
  color: 0x0a0a14,           // Deep blue-black
  far: 3000,                  // Far plane
  near: 50 + 400 = 450        // Near plane
)
```

**Behavior:**
- Applied automatically to all materials in scene
- Linear interpolation between near and far planes
- Stationary by definition (no time variation)

**Effect:**
- Adds atmospheric perspective
- Subtle depth cue without distraction
- Complements horizon overlay

---

## Color Scheme

| Element | Hex Value | RGB | Purpose |
|---------|-----------|-----|---------|
| Ground Center | `#2a2a42` | (42, 42, 66) | Muted purple, lighter |
| Ground Mid | `#1a1a2e` | (26, 26, 46) | Deep blue, base |
| Ground Edges | `#0a0a1a` | (10, 10, 26) | Near-black, vignette |
| Fog/Horizon | `#0a0a14` | (10, 10, 20) | Deep blue-black |
| Horizon Bottom | `#0f0f1e` | (15, 15, 30) | Violet at horizon |
| Horizon Top | `#050508` | (5, 5, 8) | Dark blue at zenith |

**Design Principle:** Low contrast, never competes with node visuals

---

## Constraints (MANDATORY)

### Allowed Operations
✅ Static geometry creation  
✅ Static material assignment  
✅ Static shader definitions (no time/camera uniforms)  
✅ Single `init()` call per instance  
✅ Passive validation via `validate()`  

### Forbidden Operations
❌ Per-frame updates (no `update()` method)  
❌ Animation loops  
❌ Time-based shader uniforms  
❌ Camera-reactive transformations  
❌ Interaction with game systems  
❌ Dependency on synergy/harmony/corruption  
❌ Breathing, pulsing, or drifting effects  

---

## Implementation Details

### Private Methods

#### _createGroundPlane(scene)
Creates the ground reference plane with radial gradient texture.

#### _createHorizonOverlay(scene, camera)
Creates the concentric sphere with static vertical gradient shader.

#### _createGradientCanvas(width, height)
Generates a Canvas texture with radial gradient and deterministic noise.

#### _addNoiseToCanvas(ctx, width, height, intensity)
Applies seed-based pseudo-random noise to canvas (5% intensity).

#### _createStaticFog(scene)
Assigns `THREE.Fog` to scene with static parameters.

---

## Performance Characteristics

| Metric | Value | Notes |
|--------|-------|-------|
| **Init Time** | ~5-10ms | One-time, before gameplay |
| **Runtime Cost** | 0ms | Zero per-frame updates |
| **Memory (Geom)** | ~50 KB | Plane + sphere vertices |
| **Memory (Texture)** | ~250 KB | Canvas gradient + noise |
| **Memory (Shaders)** | ~10 KB | Compiled GPU program |
| **Total Memory** | ~310 KB | Minimal, acceptable |
| **GPU Overhead** | Negligible | Simple rendering pipeline |
| **FPS Impact** | Unmeasurable | <0.1ms per frame |

---

## Integration Points

### Initialization Order
```
1. THREE.Scene creation
2. THREE.Camera creation
3. THREE.Renderer setup (optional for scaffold)
4. WorldScaffold_v2 init()        ← INSERT HERE
5. AI Nodes creation
6. Linking system setup
7. Game loop start
```

### Usage Example
```javascript
// In AtomaGame constructor
this.scene = new THREE.Scene();
this.camera = new THREE.PerspectiveCamera(...);
this.renderer = new THREE.WebGLRenderer(...);

// Create scaffold BEFORE nodes
const scaffold = new WorldScaffold_v2();
scaffold.init(this.scene, this.camera);

// Now safe to add nodes
this.aiNodes = new AINodes(...);
```

---

## Compatibility

**Three.js Versions:** 0.140+  
**Browser Support:** All modern browsers (WebGL 2.0+)  
**Mobile:** Fully compatible, minimal overhead  
**Responsive:** Camera-driven (scaffold adapts automatically)  

---

## Validation Checklist

After implementation, verify:

- [ ] No `update()`, `tick()`, `process()`, or `step()` methods exist
- [ ] Shader has no time uniform
- [ ] Ground plane visible and properly textured
- [ ] Horizon gradient smooth and non-distracting
- [ ] Fog creates subtle depth without obscuring nodes
- [ ] FPS unchanged before/after scaffold init
- [ ] Node rendering unaffected and always in foreground
- [ ] Console logs show successful initialization
- [ ] `validate()` confirms static-only status

---

## Troubleshooting Matrix

| Issue | Cause | Solution |
|-------|-------|----------|
| World feels empty | Scaffold not initialized | Call `init()` after scene creation |
| Horizon looks wrong | Shader error | Check console for WebGL errors |
| Nodes are occluded | renderOrder conflict | Verify node renderOrder > -1 |
| Performance impact | Per-frame update running | Confirm no `update()` method exists |
| Fog too thick | Far plane too close | Adjust fog far parameter in code |
| Nodes don't receive fog | Fog not applied | Verify fog created and scene assigned |

---

## Summary

**WorldScaffold_v2** is a minimal, production-ready static world context system:

- **Purpose:** Provide spatial grounding without distraction
- **Design:** Three static visual layers (ground, horizon, fog)
- **Performance:** Zero per-frame overhead, minimal memory
- **Integration:** Single `init()` call at startup
- **Maintenance:** None (completely inert after initialization)

**Status:** ✅ Production-ready, zero-cost, fully documented.
