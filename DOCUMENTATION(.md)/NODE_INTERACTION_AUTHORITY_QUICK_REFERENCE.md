# Node Interaction Authority — Quick Reference

## Core Concept

```
┌─────────────────────────────────────────┐
│  NODE GROUP (root)                      │
├─────────────────────────────────────────┤
│                                         │
│  ✅ CORE MESH (CLICKABLE)               │
│     userData.interactionCore = true     │
│     layers: INTERACTION_LAYER enabled   │
│                                         │
│  ❌ HOLOGRAM SHELL (gated)              │
│     userData.nonInteractive = true      │
│     layers: INTERACTION_LAYER disabled  │
│     raycast: () => null                 │
│                                         │
│  ❌ EDGE GLOW (gated)                   │
│     userData.nonInteractive = true      │
│     layers: INTERACTION_LAYER disabled  │
│     raycast: () => null                 │
│                                         │
│  ❌ FLOATING RINGS (gated)              │
│     userData.nonInteractive = true      │
│     layers: INTERACTION_LAYER disabled  │
│     raycast: () => null                 │
│                                         │
└─────────────────────────────────────────┘
```

---

## STEP 1: Designate Core

**Exactly ONCE per node:**

```javascript
coreMesh.userData.interactionCore = true;
coreMesh.userData.interactionCoreNodeId = nodeId;
coreMesh.layers.enable(10); // INTERACTION_LAYER
```

### ✅ DONE IN:
- `AINodeModel.js` - automatically when node is created
- `NodeInteractionEngine.registerNode()` - when registering
- Manual: `markAsInteractionCore(mesh, nodeId)`

---

## STEP 2: Hard Raycast Gate

**For ALL non-core meshes:**

```javascript
mesh.userData.nonInteractive = true;
mesh.layers.disable(10);      // INTERACTION_LAYER
mesh.raycast = () => null;    // HARD GATE
```

### ✅ DONE IN:
- `AINodeModel.js` - automatically for shells, edges, rings
- `NodeInteractionEngine.registerNode()` - auto-gates all children
- Manual: `applyHardRaycastGate(mesh)`

---

## STEP 3: Raycast Filtering

**In raycasting loop (automatic):**

```javascript
for (const intersection of intersections) {
  const hitObject = intersection.object;
  
  // Only accept interaction cores
  if (hitObject.userData?.interactionCore === true) {
    hoveredNodeId = hitObject.userData?.interactionCoreNodeId;
    break;
  }
  
  // Skip non-interactive meshes
  if (hitObject.userData?.nonInteractive === true) {
    continue;
  }
}
```

### ✅ DONE IN:
- `NodeInteractionEngine.ts` - in `tick()` method
- Automatically enforced globally

---

## Helper Functions

### Setup Complete Authority
```javascript
// Auto-detects core, gates all others
setupNodeInteractionAuthority(nodeGroup, nodeId);
```

### Mark Single Mesh
```javascript
markAsInteractionCore(coreMesh, nodeId);
```

### Gate Visual Layer
```javascript
// Call when adding aura, shell, effect, etc.
applyHardRaycastGate(visualMesh);
```

### Validate Setup
```javascript
const report = validateNodeInteractionAuthority(nodeGroup, nodeId);
console.log(report); // { valid, coreCount, issues }
```

---

## Integration Points

### When Creating a Node
```javascript
import { AINodeModel } from './AINodeModel.js';

// ✅ Automatic - core marked, all visuals gated
const node = AINodeModel.create('core', color);
```

### When Registering with Engine
```javascript
import { NodeInteractionEngine } from './NodeInteractionEngine.ts';

const engine = new NodeInteractionEngine();

// ✅ Automatic - re-validates and gates if needed
engine.registerNode(nodeGroup, 'node-001', radius, coreMesh);
```

### When Adding a New Visual Layer
```javascript
import { applyHardRaycastGate } from './VisualLayerEnforcementIntegrationHelpers.js';

// Create new aura/shell/effect
const newVisual = createNewAura();

// ✅ Manual - gate it immediately
applyHardRaycastGate(newVisual);

// Add to node
nodeGroup.add(newVisual);
```

---

## Validation & Debugging

### Check Node Setup
```javascript
const validation = validateNodeInteractionAuthority(nodeGroup, 'node-id');

// Returns:
{
  nodeId: 'node-id',
  valid: true,                    // Is it properly set up?
  coreCount: 1,                   // How many cores? (should be 1)
  nonInteractiveCount: 5,         // How many visual layers gated?
  issues: []                      // Any problems?
}
```

### Test Clicking
```javascript
// Manual click test on node:
// 1. Click core → should register ✅
// 2. Click aura → should NOT register ❌
// 3. Click edge → should NOT register ❌
// 4. Click ring → should NOT register ❌
```

---

## Constants

```javascript
const INTERACTION_LAYER = 10;  // THREE.js layer for interaction

// userData flags
userData.interactionCore = true;           // Core mesh marker
userData.interactionCoreNodeId = 'id';     // Link back to node
userData.nonInteractive = true;            // Visual layer marker
```

---

## Checklist: Is My Node Properly Set Up?

- [ ] Core mesh has `userData.interactionCore = true`?
- [ ] Core mesh is on INTERACTION_LAYER (10)?
- [ ] All visual meshes have `userData.nonInteractive = true`?
- [ ] All visual meshes removed from INTERACTION_LAYER?
- [ ] All visual meshes have `raycast = () => null`?
- [ ] Exactly ONE mesh is the core?
- [ ] Multiple cores trigger validation error?
- [ ] Clicking core registers interaction?
- [ ] Clicking visuals does NOT register?

---

## Common Mistakes ❌ → Fixes ✅

### ❌ Core mesh not marked
```javascript
// Wrong
const node = new THREE.Group();
node.add(coreMesh);

// Right
markAsInteractionCore(coreMesh, nodeId);
node.add(coreMesh);
```

### ❌ Visual mesh not gated
```javascript
// Wrong
const aura = createAura();
node.add(aura);  // ❌ Can intercept raycasts

// Right
const aura = createAura();
applyHardRaycastGate(aura);
node.add(aura);  // ✅ Now properly gated
```

### ❌ Multiple cores designated
```javascript
// Wrong
markAsInteractionCore(mesh1, nodeId);
markAsInteractionCore(mesh2, nodeId);  // ❌ Duplicate!

// Right
markAsInteractionCore(mesh1, nodeId);  // ✅ Only one
```

---

## Performance Tips

- ✅ Gates applied at node creation (zero runtime cost)
- ✅ Filtering happens in normal raycast loop (negligible overhead)
- ✅ Validation optional (DEV-only, no production impact)
- ✅ No additional draw calls or geometry
- ✅ Memory overhead: < 1% per node

---

## When Authority Applies

| Situation | Interaction | Core | Visual |
|-----------|-------------|------|--------|
| Creating node | ✅ Auto | ✅ Marked | ✅ Gated |
| Registering node | ✅ Auto | ✅ Checked | ✅ Gated |
| Adding visual layer | ⚠️ Manual | - | ⚠️ Gate it |
| Clicking core | ✅ Works | ✅ Registered | - |
| Clicking visual | ❌ Blocked | - | ❌ Gated |
| Moving node | ✅ Still works | - | - |
| Resizing node | ✅ Still works | - | - |

---

## Files to Know

| File | What It Does |
|------|--------------|
| `AINodeModel.js` | Marks core, gates visuals (auto) |
| `NodeInteractionEngine.ts` | Registers authority, filters raycasts |
| `VisualLayerEnforcementIntegrationHelpers.js` | Helper functions for manual setup |

---

## Quick Troubleshooting

**Problem**: Node not clickable  
**Solution**: Check if core is marked and on INTERACTION_LAYER
```javascript
validateNodeInteractionAuthority(node, 'node-id')
```

**Problem**: Visual layer intercepting clicks  
**Solution**: Gate it with `applyHardRaycastGate()`

**Problem**: Multiple cores causing issues  
**Solution**: Ensure exactly ONE mesh is marked as core

**Problem**: Validation shows issues  
**Solution**: Run `setupNodeInteractionAuthority()` to fix automatically

---

## Success Indicators ✅

- ✅ Every node is clickable 100% reliably
- ✅ Clicking is stable at any zoom/angle
- ✅ Visual layers can overlap without breaking interaction
- ✅ No "unclickable" or "missing" nodes
- ✅ No gameplay changes
- ✅ No visual changes

---

**READY TO USE** 🚀
