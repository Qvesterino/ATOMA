# SESSION 54: CANONICAL BASE VISUAL STATE ARCHITECTURE

## 🎯 THE PROBLEM (OBSERVED)

**ATOMA nodes look correct BEFORE linking, but degrade visually AFTER linking:**
- Core mesh becomes flattened
- Aura appears to dominate instead of frame
- Overall appearance becomes proxy-like
- Color shifts
- Opacity collapses

**ROOT CAUSE:**
`NodeVisualStateBinder` was applying a **LINKED visual preset** that overrode:
- Core materials
- Core opacity
- Core renderOrder / layer priority

This preset was meant for temporary feedback, not final persistent visuals.

---

## ✅ THE SOLUTION: CANONICAL BASE VISUAL STATE

### Core Philosophy
```
Linking is a RELATIONSHIP, not a visual mutation.

Nodes should look IDENTICAL before and after linking.
Only new visual element: subtle link FX (arc, glow, pulse).
```

### Three Pillars

#### 1️⃣ **BASE_VISUAL_STATE Capture**
```javascript
// Capture on spawn (once per node lifetime)
captureBaseVisualState(node);
  └─ Stores immutable snapshot of:
     - Core mesh geometry
     - Core material (color, opacity, depthWrite, etc.)
     - Core renderOrder
     - Aura state (if present)
     - Original color
```

**Key: This state is IMMUTABLE and PERSISTENT.**

#### 2️⃣ **Restoration After Linking**
```javascript
// On link event
onNodeStateChange(node, 'LINKED'):
  1. Restore to BASE_VISUAL_STATE (undo mutations)
  2. Ensure core visual integrity (no proxy meshes)
  3. Add link FX only (separate mesh, renderOrder 50)
  4. Verify aura doesn't dominate (opacity ≤ 0.06)
```

**Key: Restore BEFORE adding FX, never override base.**

#### 3️⃣ **Visual Priority Enforcement**
```
STRICT renderOrder hierarchy:

-1    AURA           (behind everything)
 0    CORE           (primary node mesh)
10    GLYPHS         (symbols, icons)
50    LINK_FX        (arcs, glows, pulses)
200   DEBUG          (debug overlays only)

No exceptions. No mutations. No exceptions.
```

---

## 📊 API REFERENCE

### Capture & Restore

#### `captureBaseVisualState(node)`
```javascript
// Capture immutable base state on spawn
const baseState = captureBaseVisualState(node);

// Stores in node.userData.baseVisualState (immutable)
// Contains: coreMesh, material, opacity, color, timestamp
```

#### `restoreBaseVisualState(node)`
```javascript
// Restore node to pre-link appearance
const success = restoreBaseVisualState(node);

// Restores:
// - Core material (color, emissive, opacity)
// - Core depthWrite/depthTest
// - Core renderOrder
// - Aura opacity (if present)
// Returns: true if restored, false if no base state
```

### Assertion & Verification

#### `assertBaseVisualStateCorrect(node)`
```javascript
// Dev-mode check: verify core wasn't mutated
const assertion = assertBaseVisualStateCorrect(node);

// Returns:
{
  passed: boolean,
  violations: [
    "Core color mutated: expected 0xffaa00, got 0xff00ff",
    "Core opacity mutated: expected 1.0, got 0.5",
    "Core renderOrder mutated: expected 0, got -1"
  ]
}
```

### Linking & FX

#### `applyLinkFXOnly(node, options)`
```javascript
// Apply link visual feedback WITHOUT mutating core
const result = applyLinkFXOnly(node, {
  arcColor: 0x00ff00,
  arcThickness: 0.1,
  pulseSpeed: 1.0
});

// Returns:
{
  success: boolean,
  fxMesh: THREE.Mesh | null
}

// Side effects:
// 1. Restores base visual state
// 2. Ensures core integrity
// 3. Adds link arc (separate mesh, renderOrder 50)
```

### Aura Isolation

#### `isolateAndConstrainAura(node)`
```javascript
// Ensure aura doesn't dominate core
isolateAndConstrainAura(node);

// Enforces:
// - Opacity ≤ 0.06 (6% max)
// - renderOrder = -1 (BEHIND core)
// - depthWrite = false
// - transparent = true
```

#### `assertAuraConstraintCorrect(node)`
```javascript
// Verify aura doesn't exceed limits
const auraCheck = assertAuraConstraintCorrect(node);

// Returns:
{
  passed: boolean,
  issues: [
    "Aura opacity too high: 0.5 (max 0.06)",
    "Aura renderOrder 0 should be < core 0"
  ]
}
```

### Visual Priority

#### `enforceCanonicalVisualPriority(node)`
```javascript
// Enforce strict renderOrder hierarchy
enforceCanonicalVisualPriority(node);

// Sets renderOrder for all meshes:
// AURA: -1
// CORE: 0
// GLYPHS: 10
// LINK_FX: 50
// DEBUG: 200
```

### Manager Class

#### `new NodeVisualStateBinder(options)`
```javascript
const binder = new NodeVisualStateBinder({
  assertMode: true,  // Enable dev assertions
  verbose: true      // Log operations
});

// Methods:
binder.registerNode(node)           // Capture base state
binder.onNodeStateChange(node, state)  // Handle linking
binder.addStateChangeCallback(fn)   // Listen for changes
binder.dispose()                    // Cleanup
```

---

## 🔄 LINKING FLOW (NEW)

### Before Linking
```
Node State: UNLINKED

Visuals:
├─ CORE (renderOrder 0)
│  └─ Solid geometry, opaque material
├─ GLYPHS (renderOrder 10)
│  └─ Optional symbols
└─ AURA (renderOrder -1)
   └─ Optional halo (opacity 0.06)

Appearance: ✅ Correct and intended
```

### Link Event
```
onNodeStateChange(node, 'LINKED'):

Step 1: Restore base visual state
  └─ Undo any mutations from previous operations
  
Step 2: Ensure core integrity
  └─ Verify core mesh exists and is opaque
  └─ Verify renderOrder = 0
  
Step 3: Add link FX (separate mesh)
  └─ Create arc connecting to target node
  └─ renderOrder = 50 (above core)
  └─ Glow/emission material
  └─ Pure FX, no core mutation

Step 4: Assertion check (dev mode)
  └─ Verify base state wasn't violated
  └─ Log any anomalies
```

### After Linking
```
Node State: LINKED

Visuals:
├─ CORE (renderOrder 0)          ← UNCHANGED
│  └─ Same geometry, same material
├─ GLYPHS (renderOrder 10)        ← UNCHANGED
│  └─ Same symbols
├─ AURA (renderOrder -1)          ← UNCHANGED
│  └─ Same halo
└─ LINK_FX (renderOrder 50)       ← NEW: arc to target
   └─ Animated curve connecting nodes

Appearance: ✅ IDENTICAL to before + subtle arc
```

---

## 🛡️ SAFETY GUARANTEES

### The Mutation Rule
```
✅ ALLOWED:
  - Add separate FX meshes (renderOrder > 100)
  - Modify aura opacity (down to 0.06 minimum)
  - Modify non-core materials
  - Add visual feedback layers
  
❌ FORBIDDEN:
  - Modify core material (color, opacity, etc.)
  - Modify core geometry
  - Change core renderOrder
  - Move core mesh to different parent
  - Replace core material
```

### Assertion Modes

#### Development Mode (recommended for debugging)
```javascript
const binder = new NodeVisualStateBinder({ assertMode: true });

// After every link, checks:
assertBaseVisualStateCorrect(node)
assertAuraConstraintCorrect(node)

// Logs violations:
[NodeVisualStateBinder] BASE STATE VIOLATION after linking:
  - Core color mutated: expected 0xffaa00, got 0xff00ff
  - Core opacity mutated: expected 1.0, got 0.5
```

#### Production Mode
```javascript
const binder = new NodeVisualStateBinder({ assertMode: false });

// Assertions disabled
// Performance optimized
// Non-breaking errors handled silently
```

---

## 📋 IMPLEMENTATION CHECKLIST

### Before Deployment
- [ ] All nodes have `baseVisualState` captured on spawn
- [ ] `restoreBaseVisualState()` called before EVERY link
- [ ] No material mutations on linked nodes
- [ ] Aura opacity clamped to ≤ 0.06 always
- [ ] Core renderOrder = 0 always
- [ ] Link FX is separate mesh (not core modification)

### Testing Checklist
- [ ] Node looks identical before linking
- [ ] Only new element is link arc
- [ ] No color shift after linking
- [ ] No opacity collapse
- [ ] Glyphs unchanged
- [ ] Aura doesn't dominate core
- [ ] Multiple links don't degrade appearance
- [ ] Assertions pass in dev mode

### Verification Commands
```javascript
// Check single node
const check = assertBaseVisualStateCorrect(node);
console.log(check.passed ? '✅ OK' : '❌ VIOLATED', check.violations);

// Check aura constraints
const auraCheck = assertAuraConstraintCorrect(node);
console.log(auraCheck.passed ? '✅ OK' : '❌ VIOLATED', auraCheck.issues);

// Enable dev mode
window.nodeBinder = new NodeVisualStateBinder({ assertMode: true });
```

---

## 🚫 WHAT NOT TO DO

### ❌ Don't:
```javascript
// Don't mutate core on link
VisualHierarchyRegistry.registerNode(node)  // ← phantom method anyway

// Don't apply LINKED preset
applyLinkedMaterialPreset(node)  // ← causes degradation

// Don't override core opacity
coreMesh.material.opacity = 0.5  // ← violates base state

// Don't change core renderOrder
coreMesh.renderOrder = -100  // ← puts core behind aura

// Don't add aura-only visual feedback
auraMesh.material.opacity = 0.8  // ← aura dominates core
```

### ✅ Do:
```javascript
// Restore to base state
restoreBaseVisualState(node);

// Add FX separately
applyLinkFXOnly(node);

// Keep core unchanged
// Keep aura isolated
// Keep visual priority strict
```

---

## 📊 VISUAL COMPARISON

### BEFORE (v1.0 — BROKEN)
```
Before Link:    After Link:     Problem:
┌─────────────┐ ┌─────────────┐
│ CORE (opaq) │ │ CORE (dull) │ ← Material overridden
│   #00ff00   │ │   #007700   │ ← Color mutated
│  opacity 1  │ │  opacity .5 │ ← Opacity collapsed
└─────────────┘ └─────────────┘
│ AURA        │ │ AURA        │ ← Aura dominates
│ .06 opaque  │ │ .06 opaque  │ ✅ (unchanged, but seems worse)
└─────────────┘ └─────────────┘

Result: Node degraded, flattened, proxy-like ❌
```

### AFTER (v2.0 — FIXED)
```
Before Link:    After Link:       Achievement:
┌─────────────┐ ┌─────────────┐
│ CORE (opaq) │ │ CORE (opaq) │ ← Material IDENTICAL
│   #00ff00   │ │   #00ff00   │ ← Color UNCHANGED
│  opacity 1  │ │  opacity 1  │ ← Opacity UNCHANGED
└─────────────┘ └─────────────┘
│ AURA        │ │ AURA        │ ← Isolated, subtle
│ .06 opaque  │ │ .06 opaque  │ ✅ (unchanged)
└─────────────┘ └─────────────┘
                │ LINK_FX (50)│ ← Pure FX layer
                │ Arc to node │ ← Subtle feedback
                │ #00ffff    │
                └─────────────┘

Result: Node unchanged + subtle link arc ✅
```

---

## 🎬 USAGE EXAMPLE

```javascript
import { 
  captureBaseVisualState, 
  applyLinkFXOnly, 
  NodeVisualStateBinder 
} from './NodeVisualStateBinder.js';

// Initialize manager
const visualBinder = new NodeVisualStateBinder({ 
  assertMode: true,
  verbose: true 
});

// On node spawn
function onNodeSpawned(node) {
  visualBinder.registerNode(node);
  // └─ Captures base state automatically
}

// On link event
function onNodeLinked(sourceNode, targetNode) {
  // Manager handles it
  visualBinder.onNodeStateChange(sourceNode, 'LINKED');
  
  // Internally:
  // 1. Restores base visual state
  // 2. Adds link FX only
  // 3. Verifies assertions
  // 4. Node looks identical to before
  // 5. Only new element: arc FX
}

// Verify at any time
function debugNodeVisuals(node) {
  const baseCheck = assertBaseVisualStateCorrect(node);
  const auraCheck = assertAuraConstraintCorrect(node);
  
  console.log('Base State:', baseCheck.passed ? '✅' : '❌', baseCheck.violations);
  console.log('Aura Constraint:', auraCheck.passed ? '✅' : '❌', auraCheck.issues);
}
```

---

## 🔑 KEY INSIGHTS

1. **Immutable Base State**: Once captured, base state never changes for a node's lifetime.

2. **Restoration Pattern**: Always restore BEFORE adding new visual elements.

3. **Visual Priority Strict**: renderOrder is the law. AURA=-1, CORE=0, FX=50. No exceptions.

4. **Linking ≠ Visual Change**: Linking adds a relationship, not a mutation.

5. **Assertions in Dev**: Enable `assertMode: true` to catch violations early.

6. **Non-Breaking**: Old code using `applyFinalNodeVisualState()` still works, just uses new system.

---

## 📝 FINAL RULE

```
When a node links:

  It MUST look identical to before linking.
  
  Only new visual element: subtle linking FX.
  
  No mutations. No exceptions.
```

✅ **This is now guaranteed by the BASE_VISUAL_STATE system.**
