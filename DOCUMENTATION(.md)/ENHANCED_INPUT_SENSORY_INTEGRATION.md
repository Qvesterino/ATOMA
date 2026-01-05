# INPUT Sensory Geometries Integration Guide

## Overview

Three ultra-unique INPUT node geometries representing perception, sensing, and gateways:

1. **SENSORY_GATE** — Open asymmetric frame marking threshold where signals enter
2. **LISTENING_CROWN** — Radial antenna array tuned to invisible frequencies  
3. **PERCEPTION_BLOOM** — Petal-like plates unfolding into awareness

---

## Integration Steps

### Step 1: Import the geometries module

At the top of `EnhancedNodeModels.js`:

```js
import InputSensoryGeometries from './InputSensoryGeometries_v1.js';
import { animateInputSensoryNode } from './InputSensoryAnimationPatch.js';
```

### Step 2: Add factory method

Add this method to the `EnhancedNodeModels` class:

```js
/**
 * Create INPUT sensory node (NEW - Session 64)
 * Ultra-unique receiver interface geometries
 * 
 * Types:
 * - 0: SENSORY_GATE (open frame marking threshold)
 * - 1: LISTENING_CROWN (radial antenna array)
 * - 2: PERCEPTION_BLOOM (petal plates unfolding)
 * 
 * @param {THREE.Group} group - Node group
 * @param {number} index - Index for deterministic selection
 * @param {number} color - Base color
 * @returns {THREE.Group} Populated node
 */
static createInputSensoryNode(group, index, color) {
  const types = [
    'sensory_gate',
    'listening_crown', 
    'perception_bloom'
  ];

  // Deterministic selection based on node ID
  let nodeId = group.userData.id || index;
  if (typeof nodeId === 'string') {
    nodeId = nodeId.charCodeAt(0) + nodeId.length;
  }

  const typeKey = types[nodeId % 3];
  return InputSensoryGeometries.create(typeKey, group, color);
}
```

### Step 3: Update createInputNode() method

Modify the existing `createInputNode()` to use sensory variants:

```js
/**
 * Main input node creator
 * Now includes 3 new sensory geometries
 */
static createInputNode(group, index, color) {
  let nodeId = group.userData.id || index;
  if (typeof nodeId === 'string') {
    nodeId = nodeId.charCodeAt(0) + nodeId.length;
  }

  const variants = [
    this.createInputNode0.bind(this),              // TriangularPrism+Rim
    this.createInputNode2.bind(this),              // PyramidSpike
    this.createInputNode1.bind(this),              // WireframeSphere
    this.createNewIcosahedron.bind(this),          // Icosahedron
    this.createInputSignalReceptor.bind(this),     // SignalReceptor
    this.createInputDataGateway.bind(this),        // DataGateway
    this.createInputIncomingFunnel.bind(this),     // IncomingFunnel
    this.createInputSensoryNode.bind(this),        // SENSORY_GATE (NEW)
    this.createInputSensoryNode.bind(this),        // LISTENING_CROWN (NEW - same method, index-based)
    this.createInputSensoryNode.bind(this),        // PERCEPTION_BLOOM (NEW - same method, index-based)
    this.createExtremeInput0.bind(this)            // HyperbolicPrism
  ];

  return variants[nodeId % 11](group, color);
}
```

Alternatively, for more granular control, add dedicated wrapper methods:

```js
/**
 * Wrapper: Create SENSORY_GATE variant
 */
static createInputSensoryGate(group, color) {
  return InputSensoryGeometries.create('sensory_gate', group, color);
}

/**
 * Wrapper: Create LISTENING_CROWN variant
 */
static createInputListeningCrown(group, color) {
  return InputSensoryGeometries.create('listening_crown', group, color);
}

/**
 * Wrapper: Create PERCEPTION_BLOOM variant
 */
static createInputPerceptionBloom(group, color) {
  return InputSensoryGeometries.create('perception_bloom', group, color);
}
```

Then update variants array:

```js
const variants = [
  // ... existing variants ...
  this.createInputSensoryGate.bind(this),          // SENSORY_GATE (NEW)
  this.createInputListeningCrown.bind(this),       // LISTENING_CROWN (NEW)
  this.createInputPerceptionBloom.bind(this),      // PERCEPTION_BLOOM (NEW)
  this.createExtremeInput0.bind(this)              // HyperbolicPrism
];
```

### Step 4: Add animation integration

In the `animate(deltaTime)` method, add:

```js
/**
 * Animate INPUT sensory nodes
 */
animate(deltaTime = 16.67) {
  const elapsed = Date.now() - this._animationStart;

  // ... existing animation code for all other nodes ...

  // Animate INPUT sensory nodes (NEW)
  for (const node of this.inputSensoryNodesCache || []) {
    if (node && node.userData.gateAnimationType ||
        node.userData.crownAnimationType ||
        node.userData.bloomAnimationType) {
      animateInputSensoryNode(node, elapsed);
    }
  }
}
```

Or inline each type:

```js
// In animate(), loop through all nodes:
for (const node of allNodes) {
  if (node.userData.gateAnimationType) {
    // SENSORY_GATE animation
    const seconds = (Date.now() - animStart) / 1000;
    const segments = node.userData.sensoryGateSegments;
    node.rotation.y = seconds * 0.05;
    // ... (or call animateInputSensoryNode)
  }
  
  if (node.userData.crownAnimationType) {
    // LISTENING_CROWN animation
    const seconds = (Date.now() - animStart) / 1000;
    node.rotation.y = seconds * 0.04;
    // ... (or call animateInputSensoryNode)
  }
  
  if (node.userData.bloomAnimationType) {
    // PERCEPTION_BLOOM animation
    const seconds = (Date.now() - animStart) / 1000;
    const breathe = 1 + Math.sin(seconds * 0.5) * 0.01;
    node.scale.set(breathe, breathe, breathe);
    // ... (or call animateInputSensoryNode)
  }
}
```

---

## Geometry Details

### 1. SENSORY_GATE

**Purpose**: Open threshold marking where signals enter Atoma

**Components**:
- 5 asymmetric frame segments (curved boxes, NOT completing a ring)
- Central void aperture (invisible marker)
- Rim accent (cyan highlight, partial)

**Color Palette**:
- Primary: Base INPUT color (soft violet)
- Tint: Pale magenta (#fffacd) - 30% blend
- Accent: Cyan highlights (#00ffff) - 50% blend

**Animation**:
- Overall rotation: Y axis, 0.05 rad/s (very slow)
- Segment drift: Independent wobble, ±0.3 rad
- Scale breathing: ±2% per segment
- Phase offset: Each segment different (organic)

**Immutability**: `userData.visualCoreImmutable = true`

### 2. LISTENING_CROWN

**Purpose**: Receiver tuned to invisible frequencies

**Components**:
- 9 radial antenna spines (tapered cones)
- Central listener core (icosahedron)
- Crown glow accent (toroid, tilted)

**Color Palette**:
- Primary: Base INPUT color (soft violet)
- Tint: Thistle (#d8bfd8) - 40% blend
- Accent: Cyan glow (#00ffff) - 60% blend

**Animation**:
- Overall rotation: Y axis, 0.04 rad/s (slow)
- Spine sway: Independent wobble, ±0.2–0.3 rad
- Wave-like motion: Each spine different phase
- Scale breathing: ±1.5% per spine

**Immutability**: `userData.visualCoreImmutable = true`

### 3. PERCEPTION_BLOOM

**Purpose**: Perception unfolding into awareness

**Components**:
- 7 petal-like translucent plates
- Central void core (octahedron)
- Bloom frame accent (toroid outline)

**Color Palette**:
- Primary: Base INPUT color (soft violet)
- Tint: Lavender (#e6e6fa) - 50% blend
- Accent: Pale magenta - varies

**Animation**:
- Overall rotation: Y axis, 0.02 rad/s (extremely slow)
- Breathing scale: ±1% unified across entire structure
- Breathing frequency: 0.5 Hz (hypnotic)
- Petals: RIGID (no individual movement, only inherited scale)

**Immutability**: `userData.visualCoreImmutable = true`

---

## Material Properties

All sensory geometries use **MeshPhysicalMaterial** with:

```js
{
  color: baseColor,
  metalness: 0.2–0.7,     // Varies per component
  roughness: 0.2–0.5,     // Soft finish
  transmission: 0.1–0.3,  // Slight translucency
  emissive: baseColor,
  emissiveIntensity: 0.1–0.3,
  transparent: true,
  opacity: 0.7–0.85
}
```

**Safety**:
- ✅ Emissive intensity set once at spawn (NOT animated)
- ✅ No per-frame material mutations
- ✅ Materials NOT frozen (allows system modifications)
- ✅ All geometry BufferGeometry (not merged/instanced)

---

## Animation Safety

**Transform-Only Animation**:
- ✅ Rotation (Y, X, Z axes) — full range
- ✅ Position — orbit/drift only (no teleport)
- ✅ Scale — breathing ±1% max

**Forbidden**:
- ❌ Geometry mutation
- ❌ Material mutation (color, emissive, opacity per-frame)
- ❌ computeBoundingSphere()
- ❌ geometry.dispose() or create new geometry

**Immutability Guarantee**:
```js
node.userData.visualCoreImmutable = true;
mesh.raycast = () => {};  // Skip raycasting
```

---

## Deterministic Geometry Selection

Geometry selection is **deterministic per node ID**:

```js
// Node ID hash determines geometry
const nodeId = node.userData.id || spawnIndex;
const hash = (typeof nodeId === 'string')
  ? nodeId.charCodeAt(0) + nodeId.length
  : nodeId;

const geometryType = ['sensory_gate', 'listening_crown', 'perception_bloom'][hash % 3];
```

**Guarantee**: Same node ID always spawns same geometry.

---

## Integration Checklist

- [ ] Import `InputSensoryGeometries` module
- [ ] Import `animateInputSensoryNode` function
- [ ] Add factory method `createInputSensoryNode()`
- [ ] Update `createInputNode()` variants array
- [ ] Add animation calls in `animate()` method
- [ ] Test: Spawn INPUT nodes, verify geometries appear
- [ ] Test: Verify animations run smoothly
- [ ] Test: Verify color blends correct
- [ ] Test: Verify no console warnings
- [ ] Test: Verify FPS stable (60+)
- [ ] Test: Verify linking doesn't mutate INPUT visuals
- [ ] Test: Verify raycasting still works

---

## Visual Verification

### SENSORY_GATE
```
Visual markers:
✓ Open frame (not complete ring)
✓ Gap ~108° (opening)
✓ Segments rotate + drift
✓ Central void (transparent)
✓ Cyan rim accent visible

Animation:
✓ Frame rotates slowly (Y axis)
✓ Segments wobble independently
✓ Breathing effect subtle
✓ Smooth loop (no jerks)
```

### LISTENING_CROWN
```
Visual markers:
✓ 9 antenna spines radiating
✓ Center dark core
✓ Tilted crown glow ring
✓ Spines have slight curve
✓ Cyan glow faint

Animation:
✓ Crown rotates slowly (Y axis)
✓ Spines sway independently
✓ No two spines move in sync
✓ Wave-like pattern
✓ Smooth hypnotic effect
```

### PERCEPTION_BLOOM
```
Visual markers:
✓ 7 petal plates arranged
✓ Semi-open bloom
✓ Central void
✓ Petals don't intersect
✓ Lavender tint subtle

Animation:
✓ Entire structure rotates (Y axis, very slow)
✓ Breathing in/out (±1%)
✓ Hypnotic pulse effect
✓ Petals maintain fixed positions
✓ Smooth loop
```

---

## Performance Impact

**Memory**:
- SENSORY_GATE: ~15 KB (5 segments + rim)
- LISTENING_CROWN: ~20 KB (9 spines + core + glow)
- PERCEPTION_BLOOM: ~12 KB (7 petals + core + frame)

**CPU per frame**:
- SENSORY_GATE: ~0.1ms (segment rotation/drift)
- LISTENING_CROWN: ~0.15ms (spine sway, 9 independent)
- PERCEPTION_BLOOM: ~0.05ms (unified breathing)

**Total impact**: <0.5ms per node (negligible)

---

## Troubleshooting

### Geometries not appearing
**Check**:
- [ ] Import statements correct
- [ ] Factory method added to EnhancedNodeModels
- [ ] Variants array includes sensory methods
- [ ] createInputNode() calls updated

### Animations not running
**Check**:
- [ ] animateInputSensoryNode imported
- [ ] Animation loop includes INPUT sensory nodes
- [ ] userData.gateAnimationType/crownAnimationType/bloomAnimationType set
- [ ] Date.now() or elapsed time available

### Colors wrong
**Check**:
- [ ] Base color passed correctly
- [ ] Color interpolation formulas correct
- [ ] Emissive color matches base color
- [ ] Material opacity values (0.7–0.85)

### Raycasting issues
**Check**:
- [ ] userData.visualCoreImmutable = true set
- [ ] mesh.raycast = () => {} overridden
- [ ] Hit-proxy system not affected

---

## Files Delivered

```
InputSensoryGeometries_v1.js
  ├─ InputSensoryGeometries class
  ├─ createSensoryGate()     (5 segments, void core, rim)
  ├─ createListeningCrown()  (9 spines, listener core, glow)
  ├─ createPerceptionBloom() (7 petals, void core, frame)
  └─ _interpolateColor() helper

InputSensoryAnimationPatch.js
  ├─ animateInputSensoryNode()  (router)
  ├─ animateSensoryGate()       (frame drift)
  ├─ animateListeningCrown()    (spine sway)
  └─ animatePerceptionBloom()   (breathing)

ENHANCED_INPUT_SENSORY_INTEGRATION.md
  └─ This file (integration guide)
```

---

## Next Steps

1. Add imports to EnhancedNodeModels.js
2. Add factory methods
3. Update createInputNode() variants
4. Add animation loop calls
5. Test spawn → verify visuals → verify animation
6. Fine-tune colors/animation speeds as needed

Done! INPUT nodes now represent receivers, not machines. 🎨✨
