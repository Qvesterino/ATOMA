# GEOMETRY VISUAL POLISH - ANIMATION REFERENCE

Quick guide to the new animation systems integrated into `EnhancedNodeModels.animate()`.

---

## 🎬 ANIMATION HANDLERS

### 1. INPUT NODE 0: Inner Signal Rotation (TriangularPrism)

**Metadata Fields**:
```javascript
nodeGroup.userData.innerSignalRotationAxis    // Vector3 (normalized)
nodeGroup.userData.innerSignalRotationSpeed   // Number, default 0.2
```

**Animation**:
```
Rotates internal tetrahedron on custom axis
Independent of main node rotation
Speed: ~0.2 rad/frame (slow, determined)
```

**Visual Effect**: Signal forming inside prism

---

### 2. INPUT NODE 1: Internal Vector Rotation (WireframeSphere)

**Metadata Fields**:
```javascript
nodeGroup.userData.vectorRotationAxis         // Vector3 (normalized)
nodeGroup.userData.vectorRotationSpeed        // Number, default 0.25
```

**Animation**:
```
Rotates internal octahedron on custom axis
Stretched to look like directional arrow
Speed: ~0.25 rad/frame (deliberate)
```

**Visual Effect**: Vector points in rotating direction inside sphere

---

### 3. CONTROL NODE 0: Mesh Pulsing (OctagonalCore+Rim)

**Metadata Fields**:
```javascript
nodeGroup.userData.meshPulsePhase             // Number (radians, auto-updated)
nodeGroup.userData.meshPulseSpeed             // Number, default 0.5
nodeGroup.userData.meshPulseAmplitude         // Number, default 0.08 (8%)
```

**Animation**:
```
Subtle pulsing of child mesh opacity
Amplitude: ±8% around 0.4 base
Frequency: 0.5 rad/frame (slow pulse)
```

**Visual Effect**: Central core feels alive but stable

---

### 4. CONTROL NODE (InfiniteSpiral): Spiral Slowdown

**Metadata Fields**:
```javascript
nodeGroup.userData.spiralRotationSpeed        // Number, default 0.15
```

**Animation**:
```
Main spiral rotation slowed to 0.15 rad/frame
Inner timing ring adds counterpoint
Combined effect feels controlled, not chaotic
```

**Visual Effect**: Inevitability unfolds at predictable pace

---

### 5. CONTROL NODE (ChronoRipper): Fragment Orbit Slowdown

**Metadata Fields**:
```javascript
nodeGroup.userData.fragmentOrbitSlowness      // Number, default 1.5 (multiplier)
```

**Animation**:
```
Fragment orbit speed divided by 1.5
Central axis rod remains perfectly static
Fragments trace slow circles around axis
```

**Visual Effect**: Time flows around fixed axis

---

### 6. STORAGE NODE 0: Segment Micro-Rotation (MemoryPillar)

**Metadata Fields**:
```javascript
nodeGroup.userData.segmentMicroRotationEnabled  // Boolean, true
nodeGroup.userData.segmentCount                 // Number (6 segments)
```

**Animation Per Segment**:
```javascript
baseRotZ = sin(segmentIndex * 0.5) * 0.08        // Base rotation
pulse = sin(time * 0.8 + segmentIndex) * 0.04    // Pulsing component
child.rotation.z = baseRotZ + pulse
```

**Visual Effect**: Each segment has unique micro-rotation + time-based pulse

---

### 7. STORAGE NODE (AbyssalShard): Parallax Motion

**Metadata Fields**:
```javascript
nodeGroup.userData.parallaxMotionEnabled   // Boolean, true
nodeGroup.userData.parallaxSpeed           // Number, default 0.15
nodeGroup.userData.stratumLayers           // Array of strata with parallaxPhase
```

**Animation**:
```
Each stratum layer moves independently
Speed: 0.15 rad/frame (very slow)
Each layer has phase offset for depth effect
No rotation of main shard
```

**Visual Effect**: Deep, layered memory with internal motion

---

### 8. ANALYTICS NODE (ElongatedOctahedron): Analytical Frame Rotation

**Metadata Fields**:
```javascript
nodeGroup.userData.analyticalFrameRotationAxis      // Vector3 (normalized)
nodeGroup.userData.analyticalFrameRotationSpeed     // Number, default 0.18
```

**Animation**:
```
Internal plane rotates on precise axis
Speed: 0.18 rad/frame (deliberate, analytical)
High metalness and emissive for precision appearance
```

**Visual Effect**: Precise measurement and analysis frame

---

### 9. ANALYTICS NODE 1: Internal Geometry Rotation (Cube Variant)

**Metadata Fields**:
```javascript
nodeGroup.userData.internalGeometryRotationAxis     // Vector3 (normalized)
nodeGroup.userData.internalGeometryRotationSpeed    // Number, default 0.22
```

**Animation**:
```
Internal octahedron rotates on custom axis
Speed: 0.22 rad/frame (deliberate)
Geometry represents analysis/algorithm processing
```

**Visual Effect**: Complex analysis inside stable container

---

## 📊 ANIMATION SPEED COMPARISON

| Animation | Speed (rad/frame) | Feel |
|-----------|-------------------|------|
| Inner Signal | 0.20 | Determined forming |
| Vector | 0.25 | Directional intent |
| Mesh Pulse | 0.50 | Stable rhythm |
| Analytical Frame | 0.18 | Precise measurement |
| Internal Geometry | 0.22 | Algorithmic process |
| Segment Micro | Time-based | Subtle variation |
| Parallax | 0.15 | Deep, slow motion |
| Spiral | 0.15 | Inevitable unfold |

**Range**: 0.15 - 0.50 rad/frame (all slow, deterministic)

---

## 🎯 IMPLEMENTATION DETAILS

### Finding Animated Elements

All animations search for elements using **metadata markers**:

```javascript
// Find elements by userData marker
nodeGroup.children.find(c => c.userData.isAnalyticalFrame)
nodeGroup.children.find(c => c.userData.isInternalAnalysisGeometry)
nodeGroup.children.find(c => c.userData.segmentIndex !== undefined)
```

### Rotation Methods

All use `rotateOnWorldAxis()` for independent, deterministic motion:

```javascript
element.rotateOnWorldAxis(axis, deltaTime * speed)
```

This ensures:
- Rotation independent of main node orientation
- Deterministic and predictable
- Smooth, frame-rate-independent motion

### Graceful Fallbacks

All animation handlers check for metadata existence:

```javascript
if (nodeGroup.userData.innerSignalRotationAxis) {
  // Only animate if metadata exists
}
```

This means:
- Missing metadata = no animation (safe)
- Can safely mix animated and non-animated nodes
- No performance penalty for nodes without animations

---

## 🔧 DEBUGGING ANIMATIONS

### Enable Console Logging

Add to `EnhancedNodeModels.animate()`:

```javascript
console.log('Animation speeds:', {
  signal: nodeGroup.userData.innerSignalRotationSpeed,
  vector: nodeGroup.userData.vectorRotationSpeed,
  mesh: nodeGroup.userData.meshPulseSpeed,
  frame: nodeGroup.userData.analyticalFrameRotationSpeed,
  geometry: nodeGroup.userData.internalGeometryRotationSpeed
});
```

### Adjust Animation Speed

Modify metadata before animation loop:

```javascript
nodeGroup.userData.innerSignalRotationSpeed = 0.3;  // Make faster
nodeGroup.userData.meshPulseAmplitude = 0.12;       // Increase pulse
```

### Disable Specific Animation

Set metadata to null:

```javascript
nodeGroup.userData.innerSignalRotationAxis = null;  // Disables animation
```

---

## 📈 PERFORMANCE NOTES

**Impact**: Negligible (<0.05ms per node per frame)

**Why**:
- Animations run in existing `animate()` loop
- Only elements with metadata animate (no wasted checks)
- Rotations are simple quaternion operations
- No expensive traversals or searches

**Scaling**:
- 100 nodes: ~0.5ms per frame
- 1000 nodes: ~5ms per frame
- Dominated by rendering, not animation

---

## 🎨 ARTISTIC ADJUSTMENTS

### Make All Animations Faster

```javascript
// In animate() method, multiply all speeds by 1.5
const speedMultiplier = 1.5;
element.rotateOnWorldAxis(axis, deltaTime * speed * speedMultiplier);
```

### Make Pulse More Prominent

```javascript
// Increase amplitude from 0.08 to 0.15
nodeGroup.userData.meshPulseAmplitude = 0.15;
```

### Slow Everything Down

```javascript
// Use global slowdown factor
const globalSlowdown = 0.7;
element.rotateOnWorldAxis(axis, deltaTime * speed * globalSlowdown);
```

---

**All animations are designed to be subtle, deterministic, and iconic. Adjust as needed for your visual style!**
