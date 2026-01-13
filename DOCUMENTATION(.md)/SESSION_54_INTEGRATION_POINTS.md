# SESSION 54: INTEGRATION POINTS

## Where to Call New Functions

### 1️⃣ NODE SPAWN (Capture Base State)

**Location:** Wherever nodes are created (EnhancedNodeModels, main.js, node factory)

```javascript
// BEFORE: Node just spawned
const node = createNodeGeometry(...);
scene.add(node);

// ADD THIS:
import { captureBaseVisualState } from './NodeVisualStateBinder.js';
captureBaseVisualState(node);  // ← Capture once per node
```

**Why:** Sets immutable snapshot of core visuals before any mutations.

---

### 2️⃣ NODE LINKING (Restore + Add FX)

**Location:** LinkingSystem.js, NodeLinkingSystem.js, or wherever links are created

```javascript
// BEFORE: Link is created
function createLink(sourceNode, targetNode) {
  // ... existing link logic ...
}

// ADD THIS:
import { 
  restoreBaseVisualState, 
  applyLinkFXOnly,
  assertBaseVisualStateCorrect
} from './NodeVisualStateBinder.js';

function createLink(sourceNode, targetNode) {
  // ... existing link logic ...
  
  // CRITICAL: Restore base visuals BEFORE adding FX
  restoreBaseVisualState(sourceNode);
  restoreBaseVisualState(targetNode);
  
  // Add visual feedback for linking (separate FX layer)
  const fxResult = applyLinkFXOnly(sourceNode);
  
  // DEV MODE: Verify no mutation occurred
  if (process.env.NODE_ENV === 'development') {
    const check = assertBaseVisualStateCorrect(sourceNode);
    if (!check.passed) {
      console.warn('Visual state violated on link:', check.violations);
    }
  }
}
```

**Why:** Ensures core visuals are restored before adding link effects.

---

### 3️⃣ STATE MANAGER INTEGRATION

**Location:** main.js or wherever NodeVisualStateBinder is instantiated

```javascript
// BEFORE
const binder = new NodeVisualStateBinder();

// AFTER: Initialize with dev mode in development
const binder = new NodeVisualStateBinder({
  assertMode: process.env.NODE_ENV === 'development',
  verbose: true
});

// Register all nodes as they spawn
aiNodes.on('nodeSpawned', (node) => {
  binder.registerNode(node);  // Captures base state
});

// Listen for state changes
binder.addStateChangeCallback((node, oldState, newState, success) => {
  if (newState === 'LINKED') {
    console.log(`✅ Node ${node.userData.nodeId} linked (visual preserved)`);
  }
});
```

**Why:** Centralizes visual state tracking across all nodes.

---

### 4️⃣ VISUAL DEBUG TOOLS (Optional)

**Location:** Developer console or debug panel

```javascript
// Check single node visuals
window.checkNodeVisuals = (node) => {
  const { assertBaseVisualStateCorrect, assertAuraConstraintCorrect } = 
    await import('./NodeVisualStateBinder.js');
    
  const baseCheck = assertBaseVisualStateCorrect(node);
  const auraCheck = assertAuraConstraintCorrect(node);
  
  console.group(`Visual State: ${node.userData.nodeId}`);
  console.log('Base State:', baseCheck.passed ? '✅' : '❌', baseCheck.violations);
  console.log('Aura Constraints:', auraCheck.passed ? '✅' : '❌', auraCheck.issues);
  console.groupEnd();
};

// Use:
checkNodeVisuals(someNode);
```

---

## Files That Need Changes

### ✅ DONE (Already implemented)
- `/NodeVisualStateBinder.js` — Complete rewrite with BASE_VISUAL_STATE

### 🔧 NEEDED (Search and update these files)

Find these files and add integration:

```bash
grep -l "createNode\|NodeModels\|EnhancedNodeModels" *.js
```

Likely files:
- `main.js` — Node initialization
- `EnhancedNodeModels.js` — Node geometry creation
- `NodeLinkingSystem.js` — Linking logic
- `LinkingSystem.js` — Link creation (if exists)

### 📝 FOR EACH FILE: DO THIS

1. **Find where nodes are created/spawned**
   ```javascript
   // Add after node creation:
   captureBaseVisualState(node);
   ```

2. **Find where links are created**
   ```javascript
   // Add before/after link creation:
   restoreBaseVisualState(sourceNode);
   restoreBaseVisualState(targetNode);
   applyLinkFXOnly(sourceNode);
   ```

3. **Update manager initialization**
   ```javascript
   // Change from old to new:
   const binder = new NodeVisualStateBinder({ assertMode: true });
   ```

---

## Quick Integration Template

### Pattern 1: Manual Capture
```javascript
import { captureBaseVisualState } from './NodeVisualStateBinder.js';

// On node spawn
const node = createNodeGeometry(...);
captureBaseVisualState(node);
scene.add(node);
```

### Pattern 2: Linking with Restoration
```javascript
import { 
  restoreBaseVisualState, 
  applyLinkFXOnly,
  assertBaseVisualStateCorrect
} from './NodeVisualStateBinder.js';

// On link creation
restoreBaseVisualState(sourceNode);
restoreBaseVisualState(targetNode);
applyLinkFXOnly(sourceNode);

// Optional: dev assertions
if (dev) console.assert(assertBaseVisualStateCorrect(sourceNode).passed);
```

### Pattern 3: Manager Tracking
```javascript
import { NodeVisualStateBinder } from './NodeVisualStateBinder.js';

const binder = new NodeVisualStateBinder({ 
  assertMode: true,
  verbose: true 
});

// Auto-capture on registration
binder.registerNode(node);

// Auto-restore on link
binder.onNodeStateChange(node, 'LINKED');
```

---

## Backward Compatibility

### ✅ No Breaking Changes

Old code still works:
```javascript
// Old way (still works):
applyFinalNodeVisualState(node);

// Internally does:
// 1. Capture base state (if not already captured)
// 2. Restore to base state
// 3. Enforce visual hierarchy
// 4. Mark as applied

// Returns: true/false as before
```

### ⚠️ Behavior Change

```javascript
// BEFORE: applyFinalNodeVisualState() could override core visuals
applyFinalNodeVisualState(linkedNode);
// Result: Node could degrade visually ❌

// AFTER: Same function, new behavior
applyFinalNodeVisualState(linkedNode);
// Result: Node restored to base state, guaranteed ✅
```

---

## Testing After Integration

### Unit Tests
```javascript
// Test 1: Base state capture
const node = createTestNode();
captureBaseVisualState(node);
assert(node.userData.baseVisualState !== null);

// Test 2: Restoration
node.children[0].material.opacity = 0.5;
restoreBaseVisualState(node);
assert(node.children[0].material.opacity === 1.0);

// Test 3: Assertions
const check = assertBaseVisualStateCorrect(node);
assert(check.passed === true);
```

### Integration Test
```javascript
// Test linking doesn't degrade visuals
const node1 = createTestNode();
const node2 = createTestNode();
captureBaseVisualState(node1);
captureBaseVisualState(node2);

// Capture baseline
const baseline1 = {
  color: node1.children[0].material.color.getHex(),
  opacity: node1.children[0].material.opacity
};

// Link
visualBinder.onNodeStateChange(node1, 'LINKED');

// Check unchanged
const final1 = {
  color: node1.children[0].material.color.getHex(),
  opacity: node1.children[0].material.opacity
};

assert(baseline1.color === final1.color, 'Color should match');
assert(baseline1.opacity === final1.opacity, 'Opacity should match');
```

---

## Rollout Checklist

- [ ] Update `/NodeVisualStateBinder.js` (✅ DONE)
- [ ] Update node spawn code to call `captureBaseVisualState()`
- [ ] Update linking code to call `restoreBaseVisualState()` + `applyLinkFXOnly()`
- [ ] Update manager initialization with `{ assertMode: true }` in dev
- [ ] Run assertions on all existing nodes
- [ ] Test visual before/after linking
- [ ] Verify no color shifts
- [ ] Verify no opacity changes
- [ ] Verify glyphs unchanged
- [ ] Verify aura constrained (≤ 0.06)
- [ ] Deploy to production (non-breaking, backward compatible)

---

## Troubleshooting

### If nodes still degrade after linking:
1. Check `captureBaseVisualState()` was called on spawn
2. Check `restoreBaseVisualState()` called before adding link FX
3. Run `assertBaseVisualStateCorrect(node)` to find violations
4. Check aura constraints: `assertAuraConstraintCorrect(node)`

### If you see "Base state violated":
```javascript
// Find what changed
const check = assertBaseVisualStateCorrect(node);
check.violations.forEach(v => console.log(v));

// Likely culprits:
// - Another system mutating material after link
// - Aura opacity being set > 0.06
// - Core renderOrder changed
// - Core color or opacity modified
```

### If FX doesn't appear after linking:
- Check `applyLinkFXOnly()` returned `{ success: true }`
- Check FX mesh has correct renderOrder (50)
- Check FX mesh is added to node (not separate)
- Check material is not transparent/invisible

---

## Questions?

**Q: Do I need to call both capture and restore?**  
A: No. If you use `NodeVisualStateBinder` manager, it handles both automatically. Use manual calls only for fine-grained control.

**Q: What if a node has no base state?**  
A: `restoreBaseVisualState()` returns `false` and logs a warning. The node continues unchanged. Safe fallback.

**Q: Can I capture base state after the node is modified?**  
A: Yes, but it captures the CURRENT state as base. Better to capture immediately after spawn.

**Q: How do I enable dev assertions in production?**  
A: Don't. Set `assertMode: false` by default. Only enable in dev/debug.

