# Session 113: Visual Architecture

## TASK 1: Reference Plane Debug Visibility

### Before vs After

```
BEFORE (Subtle, hard to see):
- Size: 300x300
- Position: y = -0.5
- Color: Deep blue-teal gradient
- Opacity: 0.15-0.35
- Result: Almost invisible in viewport

↓↓↓ DEBUG OVERRIDE ↓↓↓

AFTER (IMPOSSIBLE to miss):
- Size: 500x500 (67% larger)
- Position: y = -10 (20x lower)
- Color: BRIGHT MAGENTA (0xFF00FF)
- Opacity: 0.5 (50% visible)
- Result: CLEARLY visible magenta floor surface
```

### Scene Structure (Reference Plane)

```
Scene
├── DreamDesert / QuantumIsland / etc
│   ├── Nodes (at y ≈ 0-5)
│   ├── Links (at y ≈ -5 to +5)
│   └── ReferencePlane (at y = -10) ← DEBUG: MAGENTA FLOOR
│       ├── horizon mesh (500x500, magenta)
│       ├── grid overlay (subtle)
│       └── glow gradient (subtle)
└── ...
```

### Debug Console Flow

```
[REFERENCE PLANE INIT] Initializing plane type: dream_plane
    ↓
[REFERENCE PLANE INIT] Scene children before: 42
    ↓
[DEBUG PLANE] Horizon plane created
[DEBUG PLANE] Size: 500x500
[DEBUG PLANE] Position: (0, -10, 0)
[DEBUG PLANE] Rotation: (-1.571, 0.000, 0.000)
[DEBUG PLANE] Material: color=0xff00ff opacity=0.5 transparent=true
[DEBUG PLANE] Geometry vertices: 1024
    ↓
[DEBUG PLANE] ✓ Added to planeGroup
[DEBUG PLANE] PlaneGroup children: 3
    ↓
[REFERENCE PLANE INIT] ✓ Plane group created successfully
[REFERENCE PLANE INIT] Plane group position: (0, -10, 0)
[REFERENCE PLANE INIT] Plane group scale: (1, 1, 1)
[REFERENCE PLANE INIT] Scene children after: 43
```

---

## TASK 2: Node Core Opacity Architecture

### Three-Layer Rendering System

```
┌─────────────────────────────────────┐
│      Node Visual Layers             │
├─────────────────────────────────────┤
│                                     │
│  Layer 2: EFFECTS                   │
│  ├─ Edges (transparent)             │
│  ├─ Rings (transparent)             │
│  ├─ Panels (transparent)            │
│  └─ renderOrder = 2                 │
│                                     │
│  Layer 1: AURA                      │
│  ├─ Hologram shell (transparent)    │
│  ├─ Glow effects (transparent)      │
│  └─ renderOrder = 1                 │
│                                     │
│  Layer 0: CORE ◆ ALWAYS OPAQUE ◆   │
│  ├─ Main geometry (solid)           │
│  ├─ opacity = 1.0                   │
│  ├─ transparent = false             │
│  └─ renderOrder = 0                 │
│                                     │
└─────────────────────────────────────┘
```

### Before: Mixed Architecture (BROKEN)

```
NodeGroup
├─ hologram (transparent)
├─ main body (opacity inherited from parent → becomes transparent!)
├─ rings (transparent)
├─ edges (transparent)
└─ panels (transparent)

PROBLEM: Parent opacity applies to main body → CORE becomes transparent
```

### After: Separated Architecture (FIXED)

```
NodeGroup
├─ NodeRoot
│  ├─ main body (CORE)
│  │  ├─ userData.visualLayer = 'CORE'
│  │  ├─ userData.isNodeCore = true
│  │  ├─ transparent = false          ← LOCKED
│  │  ├─ opacity = 1.0                ← LOCKED
│  │  ├─ depthWrite = true            ← LOCKED
│  │  ├─ depthTest = true             ← LOCKED
│  │  └─ renderOrder = 0
│  │
│  └─ hologram shell (AURA)
│     ├─ userData.visualLayer = 'AURA'
│     ├─ userData.isAura = true
│     ├─ transparent = true           ← ALLOWED
│     ├─ opacity = 0.3                ← ALLOWED
│     └─ renderOrder = 1
│
├─ edges (EFFECT)
│  ├─ userData.visualLayer = 'EFFECT'
│  ├─ userData.isEffect = true
│  ├─ transparent = true              ← ALLOWED
│  ├─ opacity = 0.6                   ← ALLOWED
│  └─ renderOrder = 2
│
└─ rings (EFFECT)
   ├─ userData.visualLayer = 'EFFECT'
   ├─ userData.isEffect = true
   ├─ transparent = true              ← ALLOWED
   └─ renderOrder = 2
```

### Material Authority Lock

```
┌─────────────────────────────────────┐
│   CORE Material Properties          │
├─────────────────────────────────────┤
│                                     │
│  transparent: false (LOCKED)        │
│  opacity: 1.0 (LOCKED)              │
│  depthWrite: true (LOCKED)          │
│  depthTest: true (LOCKED)           │
│  needsUpdate: true (when changed)   │
│                                     │
│  ✓ Cannot be modified by other     │
│    visual systems                   │
│  ✓ Enforced per-frame               │
│  ✓ Violations detected & logged     │
│                                     │
└─────────────────────────────────────┘
```

### Per-Frame Validation Flow

```
Frame Update
    ↓
NodeCoreOpaqueEnforcer.validateFrame()
    ↓
For each tracked node:
    ├─ For each core mesh:
    │  └─ For each material:
    │     ├─ Check: transparent === false
    │     ├─ Check: opacity === 1.0
    │     ├─ Check: depthWrite === true
    │     ├─ Check: depthTest === true
    │     └─ If violation → LOG ERROR + FIX
    └─ Return violation count
    ↓
Console Output:
[NODE CORE OPAQUE ENFORCER] VIOLATION: ...
[NODE CORE OPAQUE ENFORCER] Frame violations: 2
```

### Visual Result: Node Rendering

```
BEFORE (BROKEN):
┌──────────────┐
│ Fading core  │  ← Core becomes transparent as aura fades
│   (opacity   │     
│    0.2)      │  Main body disappears into background
│ ╱────────╲   │
└─────────────┘


AFTER (FIXED):
┌──────────────┐
│ SOLID core   │  ← Core ALWAYS solid
│ (opacity 1.0)│     
│   ★★★★★★     │  Aura fades but core stays visible
│ ╱────────╲   │
└─────────────┘
```

### Console Debug Report Example

```
========== NODE CORE OPAQUE ENFORCER DEBUG REPORT ==========
Tracked nodes: 12

[NODE] 1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p
  Core meshes: 1
  Violations: 0

  [MESH 0.MAT 0] ✓ OK
    transparent: false
    opacity: 1
    depthWrite: true
    depthTest: true

[NODE] a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6
  Core meshes: 1
  Violations: 2

  [MESH 0.MAT 0] ✗ FAIL
    transparent: true        ← VIOLATION
    opacity: 0.6             ← VIOLATION
    depthWrite: true
    depthTest: true

=========================================================
```

---

## Integration Points

### 1. Reference Plane Creation

```javascript
// In DreamDesert.js, QuantumIsland.js, etc:

initializeReferencePlane() {
  this.referencePlane = initMapReferencePlane(
    this.scene,
    this.camera,
    'dream_plane'  // from map config
  );
  
  // DEBUG PLANE IS NOW:
  // - 500x500 units
  // - At y=-10
  // - BRIGHT MAGENTA
  // - Clearly visible
}
```

### 2. Node Creation with Enforcement

```javascript
// In node creation code:

const nodeGroup = AINodeModel.create('core', 0x00ddff);

// Cores are NOW:
// - transparent = false
// - opacity = 1.0
// - depthWrite = true
// - depthTest = true
// - renderOrder = 0

// Auras are MARKED:
// - userData.isAura = true
// - renderOrder = 1

// Effects are MARKED:
// - userData.isEffect = true
// - renderOrder = 2
```

### 3. Per-Frame Validation

```javascript
// In main game loop:

function update(deltaTime, time) {
  // ... other updates ...
  
  // NEW: Validate node core opacity
  const violations = globalNodeCoreOpaqueEnforcer.validateFrame(
    deltaTime,
    time
  );
  
  if (violations > 0) {
    console.warn(`Core opacity violations detected: ${violations}`);
  }
}
```

---

## Material Property Immutability

### CORE Materials (Sacred)

```javascript
transparent = false       // NEVER transparent
opacity = 1.0            // ALWAYS full opacity
depthWrite = true        // ALWAYS write to Z-buffer
depthTest = true         // ALWAYS test depth

// Violations detected & corrected per frame
```

### AURA Materials (Allowed Transparent)

```javascript
transparent = true       // Can be transparent
opacity = 0.3           // Can be faded
depthWrite = false      // Optional
depthTest = true        // Usually enabled
```

### EFFECT Materials (Allowed Transparent)

```javascript
transparent = true       // Can be transparent
opacity = 0.6           // Can be faded
depthWrite = false      // Usually disabled
depthTest = true        // Usually enabled
```

---

## Summary

**TASK 1**: Reference planes now VISIBLE (magenta 500x500 at y=-10)
**TASK 2**: Node cores now IMMUTABLE (opacity always 1.0)

Both systems provide clear console logging for debugging and validation.
