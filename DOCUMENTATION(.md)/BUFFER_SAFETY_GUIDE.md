# Link Visual Buffer Safety Guide

## Problem: THREE.WebGLAttributes Error

```
THREE.WebGLAttributes: Unsupported buffer data format: [object Object]
```

This error occurs when attempting to assign non-TypedArray data to WebGL buffers:
- Plain JavaScript Arrays: ❌ `[1, 2, 3]`
- Objects: ❌ `{ x: 1, y: 2, z: 3 }`
- Vector3 instances: ❌ `new THREE.Vector3()`
- BufferAttribute objects: ❌ Wrapping twice
- Regular numbers: ❌ Unpacked scalar values

## Solution: Always Use TypedArrays

### ✅ Correct Approaches

**1. Create BufferAttribute with TypedArray**
```javascript
const positions = new Float32Array([0, 0, 0, 1, 1, 1]);
const attr = new THREE.BufferAttribute(positions, 3);
geometry.setAttribute('position', attr);
```

**2. Copy Vector3 components into TypedArray**
```javascript
const vectors = [vec1, vec2, vec3];
const positions = new Float32Array(vectors.length * 3);
let idx = 0;
for (let v of vectors) {
    positions[idx++] = v.x;
    positions[idx++] = v.y;
    positions[idx++] = v.z;
}
const attr = new THREE.BufferAttribute(positions, 3);
```

**3. Update existing attribute safely**
```javascript
const newData = new Float32Array([...]);
attribute.array.set(newData, 0);
attribute.needsUpdate = true;
```

**4. Use LinkBufferSafetyAudit utilities**
```javascript
import { LinkBufferSafetyAudit } from './LinkBufferSafetyAudit.js';

const positions = LinkBufferSafetyAudit.createLineGeometry(vectorArray);
const verified = LinkBufferSafetyAudit.verifyGeometrySafety(geometry);
```

## TypedArray Types

| Type | Range | Use Case |
|------|-------|----------|
| Float32Array | ±3.4e38 | Positions, normals, colors, UVs |
| Uint32Array | 0-4.3B | 32-bit indices |
| Uint16Array | 0-65535 | 16-bit indices |
| Int16Array | -32768-32767 | Signed 16-bit data |
| Int32Array | -2.1B to 2.1B | Signed 32-bit data |

## Common Pitfalls

### ❌ WRONG: Assigning Vector3 array
```javascript
const vectors = [new THREE.Vector3(1,0,0), new THREE.Vector3(0,1,0)];
geometry.setAttribute('position', new THREE.BufferAttribute(vectors, 3)); // CRASH!
```

### ✅ CORRECT: Extract components first
```javascript
const positions = new Float32Array(6);
positions[0] = vectors[0].x; positions[1] = vectors[0].y; positions[2] = vectors[0].z;
positions[3] = vectors[1].x; positions[4] = vectors[1].y; positions[5] = vectors[1].z;
geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
```

### ❌ WRONG: Assigning plain array
```javascript
const data = [1, 2, 3, 4, 5, 6];
geometry.setAttribute('position', new THREE.BufferAttribute(data, 3)); // CRASH!
```

### ✅ CORRECT: Convert to TypedArray
```javascript
const positions = new Float32Array([1, 2, 3, 4, 5, 6]);
geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
```

### ❌ WRONG: Wrapping BufferAttribute twice
```javascript
const attr = this.generateArcPath(); // returns BufferAttribute
geometry.setAttribute('position', new THREE.BufferAttribute(attr, 3)); // CRASH!
```

### ✅ CORRECT: Use BufferAttribute directly
```javascript
const attr = this.generateArcPath(); // returns BufferAttribute
geometry.setAttribute('position', attr); // Direct assignment
```

## Buffer Update Pattern

For dynamic updates (e.g., positions changing each frame):

```javascript
// 1. Initialize with DynamicDrawUsage
const positions = new Float32Array(maxPointCount * 3);
const attr = new THREE.BufferAttribute(positions, 3);
attr.usage = THREE.DynamicDrawUsage;
geometry.setAttribute('position', attr);

// 2. Update data via .set()
const newPositions = new Float32Array([...]);
attribute.array.set(newPositions, 0);
attribute.needsUpdate = true; // Signal GPU upload

// 3. Never do this:
// ❌ attribute.array = newPositions;  // WRONG!
// ❌ geometry.attributes.position = newPositions; // WRONG!
```

## Pre-Allocation Strategy

Avoid per-frame allocations:

```javascript
// ❌ BAD: New allocation every frame
update(frame) {
    const positions = new Float32Array(...); // Garbage collection!
}

// ✅ GOOD: Pre-allocate once, reuse
constructor() {
    this.positions = new Float32Array(maxSize * 3);
    this.posAttribute = new THREE.BufferAttribute(this.positions, 3);
    geometry.setAttribute('position', this.posAttribute);
}

update(frame) {
    // Just write to existing array
    this.positions[0] = newX;
    this.positions[1] = newY;
    this.posAttribute.needsUpdate = true;
}
```

## Verification

Use LinkBufferSafetyAudit to verify geometry safety:

```javascript
import { LinkBufferSafetyAudit } from './LinkBufferSafetyAudit.js';

const isSafe = LinkBufferSafetyAudit.verifyGeometrySafety(geometry);
if (!isSafe) {
    console.error('Geometry has unsafe buffer formats');
}
```

## Link Visual Components - Audit Status

| Component | Status | Notes |
|-----------|--------|-------|
| LinkRingArcDischarges | ✅ Fixed | Now uses Float32Array, pre-allocated |
| LinkSparkSystem | ✅ Safe | Uses proper TypedArrays |
| LinkBeadTrailSystem | ✅ Safe | Uses dynamic draw usage correctly |
| LinkRendererConduit | ✅ Safe | TubeGeometry allocation safe |

## Key Takeaway

**Never assign objects or arrays directly to WebGL buffers. Always use TypedArrays (Float32Array, Uint32Array, etc.) and update via `.set()` or direct index assignment.**
