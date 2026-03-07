# LINKPULSE RING ORIENTATION & GEOMETRY AUDIT
**Date**: 2026-03-07  
**System**: LinkPulseRing visual behavior  
**Issue**: Segmented ring opens in incorrect directions or looks spatially distorted

---

## EXECUTIVE SUMMARY

**Root Cause Identified**: Torus geometry base orientation is incorrect for ring plane alignment.

- **Problem**: `TorusGeometry` creates rings in the XY plane by default (Z-axis is normal)
- **Used**: `mesh.lookAt(tangent)` aligns the Z-axis to the link tangent
- **Result**: Ring plane is parallel to link tangent (WRONG) instead of perpendicular (CORRECT)

**Recommended Fix**: Rotate torus geometry 90° around X-axis before creating partial arcs.

**Impact**: 1 line change in LinkPulseRing.js constructor

---

## 1. LINK CURVE ORIENTATION

### Curve Generation (LinkRendererConduit.js)

**Location**: Lines ~1200-1250 in `update()` method

```javascript
// --- 1. Curve Calculation ---
const dist = start.distanceTo(end);

// Slight arc for rope slack effect
const arcHeight = Math.min(1.5, dist * 0.1);
const mid = this._vec3.lerpVectors(start, end, 0.5);
mid.y += arcHeight;

const mainCurve = new THREE.QuadraticBezierCurve3(
    start.clone(), 
    mid.clone(), 
    end.clone()
);

link.curve = mainCurve;
frameState.geometry.curve = mainCurve;
```

**Findings**:
- **Curve type**: `THREE.QuadraticBezierCurve3`
- **Coordinate space**: **World space** (all coordinates are world node positions)
- **Transformations**: None applied - curve is computed directly from world positions

### Tangent Calculation (LinkPulseRing.js)

**Location**: Lines ~280-285 in `update()` method

```javascript
const point = curve.getPointAt(t);
const tangent = curve.getTangentAt(t);
```

**Findings**:
- `getTangentAt(t)` returns a **normalized Vector3 in world space**
- Tangent represents the direction of the curve at position t
- Tangent is valid and correctly computed

---

## 2. RING ORIENTATION PIPELINE

### Current Orientation Logic (LinkPulseRing.js)

**Location**: Lines ~286-289

```javascript
this.mesh.position.copy(point);
// Align ring normal (Z-axis of Torus) to curve tangent
this._lookTarget.copy(point).add(tangent);
this.mesh.lookAt(this._lookTarget);
```

### Analysis

**THREE.js `lookAt()` behavior**:
- Aligns the **negative Z-axis** (-Z) to point at the target
- After `lookAt()`: +Z points directly away from target
- Default Z-axis points "forward" relative to the object

**THREE.js `TorusGeometry` default orientation**:
- Ring lies in the **XY plane**
- **Z-axis is perpendicular to the ring plane** (ring normal)
- Ring's "face" is along the Z-axis

### The Problem

When we call `mesh.lookAt(point + tangent)`:
1. The mesh's **+Z axis** aligns to point **away** from the target
2. Since torus geometry has its normal along Z-axis...
3. The ring plane aligns **parallel** to the tangent ❌

**What we need**:
- Ring plane should be **perpendicular** to tangent ✓
- Ring normal should align **to** tangent ✓

**Visualization**:
```
Current (WRONG):
Link direction: → (tangent points right)
Ring orientation: | (ring plane vertical, like a wall standing on the link)

Desired (CORRECT):
Link direction: → (tangent points right)
Ring orientation: ⊕ (ring plane perpendicular to link, like a coin on a table)
```

### Correct Orientation Method

Use `quaternion.setFromUnitVectors(Z, tangent)` to explicitly align Z-axis:

```javascript
// Explicit quaternion orientation (CORRECT)
const Z = new THREE.Vector3(0, 0, 1);
this.mesh.quaternion.setFromUnitVectors(Z, tangent);
```

This directly maps:
- **Mesh local +Z** → **Tangent direction**
- **Ring normal** → **Link direction**
- **Ring plane** → **Perpendicular to link**

---

## 3. SEGMENTED RING GEOMETRY

### Geometry Initialization (LinkPulseRing.js)

**Location**: Lines ~90-105 in `constructor`

```javascript
for (let i = 0; i < SEGMENTS; i++) {
    const geo = new THREE.TorusGeometry(
        TORUS_RADIUS,
        TORUS_TUBE,
        8,
        32,
        SEGMENT_ANGLE * 0.85  // Partial arc (85% of 90°)
    );
    geo.rotateX(Math.PI * 0.5);  // ← 90° rotation
    geo.rotateZ(i * SEGMENT_ANGLE); // ← Segment position

    const mat = this.material.clone();
    const seg = new THREE.Mesh(geo, mat);
    seg.frustumCulled = false;

    this.segmentGroup.add(seg);
    this.segments.push(seg);
    this.segmentDirections.push(new THREE.Vector3(
        Math.cos(i * SEGMENT_ANGLE),
        Math.sin(i * SEGMENT_ANGLE),
        0
    ));
}
```

### Analysis

**`rotateX(Math.PI * 0.5)`**:
- Rotates the torus geometry 90° around X-axis
- Changes plane from XY to XZ
- **Purpose**: This is attempting to fix the base orientation!

**`rotateZ(i * SEGMENT_ANGLE)`**:
- Positions the partial arc around the full ring
- SEGMENT_ANGLE = Math.PI / 2 = 90°
- Creates 4 segments at 0°, 90°, 180°, 270°

**Segment directions**:
```javascript
new THREE.Vector3(
    Math.cos(i * SEGMENT_ANGLE),
    Math.sin(i * SEGMENT_ANGLE),
    0
)
```
- These are in the **XY plane** (Z = 0)
- Point radially outward from ring center

### The Real Issue

The `rotateX(Math.PI * 0.5)` is **almost correct**, but:

1. **Initial torus**: XY plane (Z = normal) ❌
2. **After rotateX(90°)**: XZ plane (Y = normal) ⚠️
3. **Segment directions**: XY plane (Z = 0) ⚠️
4. **After lookAt()**: Ring rotates to align to tangent

The mismatch between geometry rotation and segment directions causes distortion!

### Corrected Initialization

```javascript
for (let i = 0; i < SEGMENTS; i++) {
    const geo = new THREE.TorusGeometry(
        TORUS_RADIUS,
        TORUS_TUBE,
        8,
        32,
        SEGMENT_ANGLE * 0.85
    );
    // Rotate 90° around X-axis to put ring in XZ plane
    // Now Y-axis is ring normal, Z-axis is in ring plane
    geo.rotateX(-Math.PI * 0.5);
    
    // Position segment around ring
    geo.rotateZ(i * SEGMENT_ANGLE);

    const mat = this.material.clone();
    const seg = new THREE.Mesh(geo, mat);
    seg.frustumCulled = false;

    this.segmentGroup.add(seg);
    this.segments.push(seg);
    
    // Segment directions in ring plane (XZ)
    this.segmentDirections.push(new THREE.Vector3(
        Math.cos(i * SEGMENT_ANGLE),  // X component
        0,                            // Y = 0 (perpendicular to ring)
        Math.sin(i * SEGMENT_ANGLE)   // Z component
    ));
}
```

---

## 4. COORDINATE SPACE VERIFICATION

### LinkPulseRing Update Flow

```javascript
// 1. Get world position on curve
const point = curve.getPointAt(t);  // World space

// 2. Get world tangent
const tangent = curve.getTangentAt(t);  // World space

// 3. Position mesh at world point
this.mesh.position.copy(point);  // World space

// 4. Orient mesh to world tangent
this._lookTarget.copy(point).add(tangent);
this.mesh.lookAt(this._lookTarget);  // World space orientation

// 5. Move segments (local to ring)
this.segments.forEach((seg, i) => {
    seg.position.copy(this.segmentDirections[i]).multiplyScalar(gap);
    // segmentDirections are in ring-local space
    // seg.position is in segmentGroup-local space
    // segmentGroup is child of mesh
    // mesh is in world space
});
```

**Coordinate Space Hierarchy**:
```
World Space
  └─ mesh (LinkPulseRing container)
      position: World point on curve
      rotation: Aligned to world tangent
      └─ segmentGroup (No transform applied)
          └─ seg[i] (Individual torus segments)
              position: segmentDirections[i] * gap
              geometry: Pre-rotated torus
```

**Verification**: All transforms are consistent ✓

---

## 5. LIFECYCLE ANALYSIS

### Constructor
- Creates geometries once
- Applies `rotateX()` and `rotateZ()` to geometries
- No transform accumulation
- ✓ No issues

### getMesh()
- Returns `this.mesh` (the container)
- No transform modifications
- ✓ No issues

### update() (per frame)
```javascript
// 1. Position
this.mesh.position.copy(point);  // Sets absolute position

// 2. Orientation
this.mesh.lookAt(this._lookTarget);  // Sets absolute orientation

// 3. Segment movement
this.segments.forEach((seg, i) => {
    seg.position.copy(this.segmentDirections[i]).multiplyScalar(gap);
    // Sets local position relative to segmentGroup
});

// 4. Scale
this.mesh.scale.setScalar(baseScale * combinedPulse);  // Sets absolute scale
```

**Accumulation Check**:
- `position`: Set absolutely each frame ✓
- `rotation`: Set by `lookAt()` each frame ✓
- `scale`: Set absolutely each frame ✓
- No accumulation detected ✓

**Order of Operations**:
1. Set position
2. Set orientation
3. Set scale
4. Move segments

**Potential Issue**: If `mesh.lookAt()` is called AFTER segments are moved, segment directions might not rotate with the mesh.

**Current Code Order**:
```javascript
this.mesh.position.copy(point);
this.mesh.lookAt(this._lookTarget);  // ← Orientation set first

// ... later ...

this.segments.forEach((seg, i) => {
    seg.position.copy(this.segmentDirections[i]).multiplyScalar(gap);
});
```

**Analysis**: Segment positions are set AFTER mesh rotation. Since segments are children of the mesh, their positions are in mesh-local space and should rotate with the mesh correctly.

---

## 6. VISUAL LAYER CONFLICTS

### Confirmed Disabled Layers

**Aura**:
```javascript
// DEBUG ISOLATION: aura layer disabled
// this.mesh.add(this.auraMesh);
this.auraMesh.visible = false;
```
✓ Disabled - cannot affect segments

**Trails**:
```javascript
// DEBUG ISOLATION: trail layer disabled
// (entire trail update code commented out)
this.trailMeshes.forEach(trail => {
    trail.visible = false;
});
```
✓ Disabled - cannot affect segments

**Arc Discharge**:
```javascript
// DEBUG ISOLATION: arc burst disabled
// if (pulseState.atPeak && !this._arcTriggeredThisPulse && this.arcSystem) {
//     // arc spawning code commented out
// }
```
✓ Disabled - cannot affect segments

**Conclusion**: No visual layer conflicts ✓

---

## DIAGNOSTIC SUMMARY

### Root Cause

**The torus geometry is oriented incorrectly for the ring plane**:

1. `TorusGeometry` creates rings in XY plane by default
2. `mesh.lookAt(tangent)` aligns Z-axis to tangent
3. Result: Ring plane is **parallel** to tangent instead of **perpendicular**

### Secondary Issue

**Segment direction vectors are in wrong coordinate space**:
- Current: XY plane (Z = 0)
- Correct: XZ plane (Y = 0, after geometry rotation)

### Visual Distortion Cause

When `lookAt()` rotates the mesh, the pre-rotated torus geometries and XY-plane segment directions create a mismatch:
- Geometry expects to be in XZ plane
- Directions are in XY plane
- Result: Segments distort when mesh rotates

---

## RECOMMENDED FIX

### Minimal Fix (1 line change)

**File**: `LinkPulseRing.js`  
**Location**: Constructor, inside segment creation loop

**Change**: Fix the initial torus rotation to match segment direction space

```javascript
// BEFORE (Lines ~96-97):
geo.rotateX(Math.PI * 0.5);
geo.rotateZ(i * SEGMENT_ANGLE);

// AFTER:
// Rotate -90° to put ring in XZ plane (Y-axis is normal)
geo.rotateX(-Math.PI * 0.5);  // ← Changed from +0.5 to -0.5
geo.rotateZ(i * SEGMENT_ANGLE);
```

**And update segment directions** (Lines ~106-110):
```javascript
// BEFORE:
this.segmentDirections.push(new THREE.Vector3(
    Math.cos(i * SEGMENT_ANGLE),
    Math.sin(i * SEGMENT_ANGLE),
    0
));

// AFTER:
this.segmentDirections.push(new THREE.Vector3(
    Math.cos(i * SEGMENT_ANGLE),  // X
    0,                            // Y = 0 (in ring plane)
    Math.sin(i * SEGMENT_ANGLE)   // Z
));
```

### Alternative Fix (Use quaternion orientation)

**File**: `LinkPulseRing.js`  
**Location**: `update()` method, around line 288

**Change**: Replace `lookAt()` with explicit quaternion:

```javascript
// BEFORE:
this._lookTarget.copy(point).add(tangent);
this.mesh.lookAt(this._lookTarget);

// AFTER:
// Align mesh Z-axis to tangent (explicit quaternion)
const Z = new THREE.Vector3(0, 0, 1);
this.mesh.quaternion.setFromUnitVectors(Z, tangent);
```

This is cleaner and more explicit, but requires verifying the base geometry orientation matches.

---

## COORDINATE SPACE DIAGRAM

```
WORLD SPACE
│
├─ Link Curve (QuadraticBezierCurve3)
│   └─ Tangent at point t
│       Direction: Normalized world vector
│
└─ LinkPulseRing.mesh
    │
    ├─ Position: curve.getPointAt(t)
    │   Space: World
    │
    ├─ Rotation: Aligned to tangent
    │   Method: lookAt() or quaternion.setFromUnitVectors()
    │   +Z axis: Points along link tangent
    │   -Z axis: Points away from link tangent
    │
    ├─ Scale: baseScale * pulse
    │   Uniform scaling
    │
    └─ segmentGroup (Three.js Group)
        │   Transform: Identity (no rotation/scale)
        │
        └─ seg[i] (TorusGeometry partial arcs)
            │
            ├─ Geometry: Pre-rotated torus
            │   Base: XY plane
            │   After rotateX(-90°): XZ plane
            │   After rotateZ(i*90°): Positioned around ring
            │
            └─ Position: segmentDirections[i] * gap
                Space: segmentGroup-local (ring-local)
                Direction: Radial outward from ring center
                Plane: XZ (Y = 0)
```

---

## FINAL RECOMMENDATION

### Preferred Approach

**Use the quaternion orientation method**:

1. Keep geometry initialization as-is (rotateX(-90°), update segment directions to XZ plane)
2. Replace `lookAt()` with `quaternion.setFromUnitVectors(Z, tangent)`
3. This provides:
   - Explicit control over orientation
   - Clear documentation of intent
   - No ambiguity about which axis aligns to what

### Keep Segmented Torus

**Recommendation**: Keep the segmented torus approach
- Provides the mechanical split effect
- More visually interesting than simple arc meshes
- Performance is acceptable (4 segments only)

### Alternative (Simpler)

If you want to eliminate complexity:
- Replace 4 torus segments with 4 simple arc meshes (TorusGeometry with arc parameter)
- Remove `segmentGroup` intermediate
- Use explicit quaternion for all transforms

---

## VERIFICATION STEPS

After applying fix:

1. **Test orientation**: Ring should appear perpendicular to link, not parallel
2. **Test segments**: All 4 segments should move symmetrically during pulse
3. **Test all link angles**: Test with links at various angles (horizontal, vertical, diagonal)
4. **Test curve arcs**: Test with highly arced links (long distance)
5. **Verify no distortion**: Segments should not skew or distort during pulse animation

---

## CODE DIFF

### LinkPulseRing.js - Segment Initialization

```diff
     const geo = new THREE.TorusGeometry(
         TORUS_RADIUS,
         TORUS_TUBE,
         8,
         32,
         SEGMENT_ANGLE * 0.85
     );
-    geo.rotateX(Math.PI * 0.5);
+    geo.rotateX(-Math.PI * 0.5);  // Fix: XZ plane
     geo.rotateZ(i * SEGMENT_ANGLE);

     const mat = this.material.clone();
     const seg = new THREE.Mesh(geo, mat);
     seg.frustumCulled = false;

     this.segmentGroup.add(seg);
     this.segments.push(seg);
     this.segmentDirections.push(new THREE.Vector3(
         Math.cos(i * SEGMENT_ANGLE),
-        Math.sin(i * SEGMENT_ANGLE),
-        0
+        0,                            // Fix: XZ plane
+        Math.sin(i * SEGMENT_ANGLE)
     ));
```

### LinkPulseRing.js - Orientation (Optional)

```diff
     this.mesh.position.copy(point);
-    // Align ring normal (Z-axis of Torus) to curve tangent
-    this._lookTarget.copy(point).add(tangent);
-    this.mesh.lookAt(this._lookTarget);
+    // Explicit quaternion orientation: Align Z-axis to tangent
+    const Z = new THREE.Vector3(0, 0, 1);
+    this.mesh.quaternion.setFromUnitVectors(Z, tangent);
```

---

## CONCLUSION

The segmented ring distortion is caused by:
1. **Base torus orientation** mismatched with lookAt() behavior
2. **Segment direction vectors** in wrong coordinate space (XY instead of XZ)

**Fix**: Rotate torus to XZ plane and update segment directions to XZ plane.

**Lines to change**: ~5 lines total
**Risk**: Low - only affects geometry initialization, no runtime logic changes
**Verification**: Visual inspection in browser