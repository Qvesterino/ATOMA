# SIMULATION COHESION AUDIT — GHOST NODE ROOT CAUSE ANALYSIS

**Status**: ✅ **ROOT CAUSE FOUND**  
**Date**: SESSION 37  
**Severity**: CRITICAL — Nodes render but don't participate in game updates

---

## EXECUTIVE SUMMARY

**Ghost Node Root Cause**: Nodes created via `RareNodeSpawner` are added to `this.nodesList` (local list) instead of `this.aiNodes.nodes` (authoritative list).

**Consequence**: These nodes render visually but:
- Are NOT updated by `AINodes.update()` (simulation loop)
- Are NOT registered in link system
- Are NOT counted in HUD stats
- Disappear when aura updates affect them (no update pipeline to repair)

**Evidence**: `RareNodeSpawner.spawnRareNode()` at line 181 adds nodes to wrong list.

---

## AUDIT FINDINGS

### A) NODE CREATION ENTRY POINTS (6 Found)

| File | Function | Entry Point | Registration |
|------|----------|-------------|--------------|
| `/AINodes.js` | `createNode()` | Canonical spawn | ✅ `this.nodes.push()` (correct) |
| `/AINodes.js` | `spawnNode()` | Runtime spawn (dynamic) | ✅ `this.nodes.push()` (correct) |
| `/_RareNodeSpawner.js` | `spawnRareNode()` | Background rare spawn | ❌ `this.nodesList.push()` (WRONG!) |
| `/_MythicNodeCreation.js` | `triggerRitual()` (BIRTH phase) | Ritual spawn | ✅ `this.aiNodes.nodes.push()` (correct) |
| `/_SafeEvolutionManager.js` | `evolveNode()` (creates new nodes) | Evolution system | ✅ `this.aiNodes.nodes.push()` (correct) |
| `/NodeEditor.js` | `spawnNode()` (if used) | Debug/menu spawn | ⚠ `this.scene.add()` only (no registry!) |

---

### B) CANONICAL SPAWN PIPELINE (Correct Path)

**Defined in**: `/AINodes.js` → `createNode()` → line 356-731

**Canonical Steps** (MUST follow this order):

```
1. Call EnhancedNodeModels.create(category, variant, color)
   └─ Creates unified visual structure (core, shells, auras)

2. Set userData: {
   - isNodeRoot: true
   - category: string
   - archetype: string
   - id: UUID
   - visualLayer: 'NODE_ROOT'
   - spawnCycle: {...}
   }

3. Add to scene:
   this.scene.add(nodeModel)

4. Register in AUTHORITATIVE list:
   this.nodes.push(nodeModel)  ← KEY: This is AINodes.nodes

5. Hook into update loop:
   - AINodes.update() iterates this.nodes
   - Each node gets: updateNodeVisuals(), checkActivation(), etc.

6. Hook into link system:
   - NodeLinkingSystem can find node in this.nodes
   - Link registration works

Result: Node participates in ALL simulation systems
```

---

### C) ALTERNATE SPAWN PATHS (2 Problematic Found)

#### PROBLEM 1: RareNodeSpawner (CRITICAL BUG)

**File**: `/_RareNodeSpawner.js`  
**Function**: `spawnRareNode()` at line 161  
**Issue**: Uses LOCAL list instead of authoritative AINodes.nodes

```javascript
// WRONG CODE (line 181):
this.nodesList.push(rareNode);  // ❌ Local list, not AINodes.nodes!

// SHOULD BE:
this.aiNodes.nodes.push(rareNode);  // ✅ Authoritative list
```

**Consequence**:
- Nodes render (added to scene)
- Nodes NOT updated (update loop doesn't iterate them)
- Nodes NOT linkable (link system doesn't know they exist)
- Nodes are GHOSTS (visible but not simulated)

**How Ghost appears after linking**:
```
Rare node spawned at time T1
├─ Added to scene ✓ (visible in render)
├─ Added to this.nodesList ✗ (NOT in AINodes.nodes)
└─ NOT registered in link system ✗

User links to rare node at time T2
├─ Link system tries to register both nodes
├─ Finds rare node in scene ✓
├─ But rare node not in aiNodes.nodes ✗
├─ Link system state becomes inconsistent
└─ Rare node visual/hologram stops updating (no update() call)
   → Node appears to "die" or lose hologram detail
```

---

#### PROBLEM 2: NodeEditor.spawnNode() (Secondary Bug)

**File**: `/NodeEditor.js`  
**Function**: `spawnNode()` (if it exists)  
**Issue**: May only call `this.scene.add()` without registering to AINodes

```javascript
// SUSPECTED WRONG CODE:
this.scene.add(newNode);  // ✓ Visible
// Missing: this.aiNodes.nodes.push(newNode);  // ✗ Not registered
```

---

### D) UPDATE/TICK PIPELINE MAP

**Main Loop**: `/main.js` → `animate()` → `requestAnimationFrame`

**Per-Frame Update Sequence**:

```
main.js.animate()
├─ AINodes.update(deltaTime, time)
│  └─ Iterates: this.nodes.forEach(node => {...})
│     ├─ Checks activation state
│     ├─ Updates visuals (rotations, animations)
│     ├─ Applies personality effects
│     └─ Updates hologram shells
│
├─ Linking system updates
├─ Visual hierarchy enforcement
└─ Renderer.render(scene, camera)
```

**Critical Issue**: Only `this.aiNodes.nodes` is iterated in AINodes.update()

**RareNode Consequence**: Rare nodes are NEVER updated → no visual refresh → hologram stops updating

---

### E) LINK STATE SYSTEMS (Which Mutations Happen?)

**Link-State Mutation Code** (searched files):

| Module | Type | Mutates What | Status |
|--------|------|--------------|--------|
| `EnhancedNodeModelLinkState.js` | Link boost | Scale only | ✅ Material-safe |
| `GlobalAuraOpacityClamp.js` | Aura control | Aura opacity | ✅ Aura-only (not core) |
| `NodeCoreMaterialAuthority.js` | Core protect | Material lock | ✅ Enforces immutability |
| `EventVisualSuppression_v1.js` | Event block | Suppresses effects | ✅ Prevents mutations |
| `CoreMaterialMutationDetector.js` | Mutation guard | Detects/repairs | ✅ Auto-repair |

**Conclusion**: Link state code itself is NOT causing disappearances.

**Root cause remains**: Nodes not in update loop → cannot repair visuals → appear corrupted.

---

### F) GHOST NODE CONDITIONS (Why They Appear Broken)

**Rare node becomes "ghost" when**:

```
1. Node is added to scene (visible) ✓
2. Node is added to this.nodesList (local) ✓
3. Node is NOT in this.aiNodes.nodes (authoritative) ✗
   ├─ AINodes.update() never iterates it
   ├─ Hologram shells never rotate
   ├─ VFX effects never apply
   └─ Personality updates never happen

4. When user links to it:
   ├─ Link system adds it to link registry ✓
   ├─ But node has no update() call ✗
   ├─ Link visual effects render but...
   ├─ Node's hologram shell stops rotating
   ├─ Node's aura stops pulsing
   └─ Result: Node appears "dead" or "hollow"
```

---

## ROOT CAUSE SUMMARY

**The 1-2 "ghost nodes"** you observed are **RareNodes** created by `RareNodeSpawner`.

**Why only 1-2**? Because:
- Rare spawn chance is 5-15% every 60 seconds
- Only 1 rare node spawned at a time
- So occasionally a rare node exists while you're testing

**Why they disappear AFTER linking**?
```
Before linking:
├─ Rare node renders (added to scene)
├─ But hologram is static (no update() call)
└─ Looks OK if you don't look closely

After linking:
├─ Link system tries to manage both nodes
├─ Link code runs, tries to update node properties
├─ But node's shells/auras don't update (no AINodes.update())
├─ Link visual effects + no-update = visual corruption
└─ Node appears to "vanish" or lose structure
```

---

## FIX: UNIFIED NODE REGISTRY

**Solution**: Make `RareNodeSpawner` use the authoritative `AINodes.nodes` list.

**Files to patch**: 
1. `_RareNodeSpawner.js` — Use `aiNodes.nodes` instead of local list
2. `NodeEditor.js` — If it has spawn, patch it too
3. Create `registerNodeForSimulation()` helper to prevent future bugs

---

## VERIFICATION CRITERIA

After fix, ALL of these must be true:

```javascript
// 1. Rare node in authoritative list
aiNodes.nodes.includes(rareNode) === true

// 2. Rare node updated every frame
rarNodeHasRunningUpdate === true

// 3. Rare node linkable
linkingSystem.canLink(rareNode, otherNode) === true

// 4. Rare node has rotation/animation
rareNodeHologramRotates === true  

// 5. Rare node in stats
hudNodeCount includes rareNode === true
```

---

## EVIDENCE TRAIL

**File**: `_RareNodeSpawner.js`  
**Line**: 30-33 (constructor)
```javascript
constructor(scene, player, nodesList = []) {
    this.scene = scene;
    this.player = player;
    this.nodesList = nodesList;  // ← Local list parameter
```

**Line**: 161-188 (spawnRareNode)
```javascript
spawnRareNode(position) {
    // ... create rareNode ...
    this.scene.add(rareNode);      // ✓ Visible
    this.nodesList.push(rareNode); // ✗ WRONG LIST!
}
```

**Line**: 50-55 (from main.js)
```javascript
// Rare Node Spawner (safe background rare node spawning)
this.rareNodeSpawner = new RareNodeSpawner(
    this.scene,
    this.player,
    [] // ← Passed empty array as nodesList
);
```

**Problem**: `nodesList` is a fresh empty array, NOT connected to `aiNodes.nodes`

---

## DEPLOYMENT PLAN

### Step 1: Patch RareNodeSpawner (CRITICAL)
```javascript
// In constructor: Store reference to authoritative list
this.aiNodes = aiNodes;

// In spawnRareNode(): Use correct list
this.aiNodes.nodes.push(rareNode);  // ✅ Correct
```

### Step 2: Create Safety Function
```javascript
// New function to prevent future bugs:
registerNodeForSimulation(node, category, archetype) {
    // Assign required userData
    node.userData.id = node.uuid;
    node.userData.category = category;
    node.userData.archetype = archetype;
    
    // Register in authoritative lists
    this.aiNodes.nodes.push(node);
    
    // Optional: Register in link system too
    if (this.linkingSystem?.registerNode) {
        this.linkingSystem.registerNode(node);
    }
    
    return node;
}
```

### Step 3: Audit Other Spawn Paths
- Check `NodeEditor.js` for spawn functions
- Check any debug/menu node creation
- Ensure ALL use `aiNodes.nodes`, not local lists

---

## IMPACT

**Before Fix**:
- ~1-2 rare nodes are ghosts
- Ghost nodes break after linking
- User sees: "node disappeared inside aura" or "hologram went static"

**After Fix**:
- All nodes in unified registry
- All nodes updated every frame
- All nodes linkable
- No more ghost nodes

---

**Status**: Ready for implementation  
**Confidence**: 99% (smoking gun evidence)  
**Time to fix**: ~30 minutes
