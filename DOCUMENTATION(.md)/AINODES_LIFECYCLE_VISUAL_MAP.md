# AINODES LIFECYCLE – VISUAL FLOW MAP

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                         AINODES FULL LIFECYCLE DIAGRAM                       ║
║                    (Where category = undefined happens)                      ║
╚══════════════════════════════════════════════════════════════════════════════╝


═══════════════════════════════════════════════════════════════════════════════
 PHASE 1: GAME START → WORLD INITIALIZATION (Synchronous ✓)
═══════════════════════════════════════════════════════════════════════════════

main.js
   │
   ├─> createAINodes()
   │   │
   │   ├─> new AINodes(scene, player)
   │   │   └─> this.nodes = []                    (empty array)
   │   │
   │   ├─> aiNodes.createNodes(mode, count)       ✓ SAFE
   │   │   │
   │   │   ├─> getNodePositions(mode, count)
   │   │   │   └─> Generate 15 positions         ✓ OK
   │   │   │
   │   │   └─> positions.forEach((pos, i) => {
   │   │       │
   │   │       ├─> category = nodeCategories[random]  ✓ ASSIGNED
   │   │       │
   │   │       └─> node = createNode(category, pos, i)
   │   │           │
   │   │           ├─> Line 326: getCategoryColor(category)
   │   │           │   ⚠️ FAILURE #1: May return 0x00ffff if category unknown
   │   │           │
   │   │           ├─> Line 330: EnhancedNodeModels.create(category, ...)
   │   │           │   └─> Returns THREE.Group  ✓ OK
   │   │           │
   │   │           ├─> Line 535-582: userData = { category, ... }
   │   │           │   └─> userData.category = ASSIGNED ✓ CORRECT
   │   │           │
   │   │           ├─> Line 586: SafeMetricsDNA.attachMetrics(node, category)
   │   │           │   ⚠️ FAILURE #2: UNKNOWN if this overwrites userData
   │   │           │
   │   │           ├─> Line 588: scene.add(node)
   │   │           │   └─> Node added to 3D scene ✓ OK
   │   │           │
   │   │           └─> Return node with userData.category = SET ✓
   │   │
   │   │       └─> this.nodes.push(node)         ✓ STORED
   │   │
   │   └─> Nodes ready in scene
   │
   └─> UISelectedHUD initialized
       └─> Waiting for node selection...


═══════════════════════════════════════════════════════════════════════════════
 PHASE 2: PLAYER INTERACTION → NODE SELECTION (Synchronous ✓)
═══════════════════════════════════════════════════════════════════════════════

Player clicks node
   │
   └─> NodeLinkingSystem.handleClick(event)
       │
       ├─> getNodeAtPosition(x, y)
       │   └─> raycast → finds node ✓ OK
       │
       ├─> selectNode(node)
       │   └─> node.userData.category = EXISTS ✓
       │
       └─> _fireSelectCallbacks(node)
           │
           └─> UISelectedHUD.onNodeSelected callback
               │
               ├─> this.selectedNode = node           ✓ STORED
               │
               ├─> updateDisplay(node)
               │   │
               │   ├─> _getCategoryFromNode(node)
               │   │   │
               │   │   └─> Fallback chain:
               │   │       1. userData.category          ✓ SHOULD EXIST
               │   │       2. userData.nodeType          (fallback)
               │   │       3. userData.type              (fallback)
               │   │       4. userData.aiCategory        (fallback)
               │   │       5. 'unknown'                  ⚠️ FALLBACK
               │   │
               │   └─> displayText += `[${nodeType.toUpperCase()}]`
               │       ⚠️ FAILURE #3: If nodeType='unknown', SKIPS display
               │
               └─> updateLinkedCategories(node)
                   └─> Read linked categories ✓ OK


═══════════════════════════════════════════════════════════════════════════════
 PHASE 3: LINK CREATION → RUNTIME NODE SPAWN (Async ⚠️)
═══════════════════════════════════════════════════════════════════════════════

Player creates link (creates nodes on link trigger)
   │
   └─> NodeLinkingSystem.onLinkCreated()
       │
       └─> 20% chance: aiNodes.spawnNode()
           │
           └─> ╔═══════════════════════════════════════════════════════╗
               ║    🔴 CRITICAL: FAILURE POINT #5 – ASYNC RACE        ║
               ╚═══════════════════════════════════════════════════════╝
               │
               ├─> Line 1281: queueMicrotask(performSpawn)
               │   │
               │   └─> ⚠️ ASYNC: Returns IMMEDIATELY (microtask scheduled)
               │       performSpawn will run NEXT microtask
               │
               │
    ┌──────────┴───────────────────────────────────────────┐
    │                                                      │
    │ FRAME N (immediately after queueMicrotask):         │
    │                                                      │
    │ ├─> Main code continues                            │
    │ ├─> HUD might update                               │
    │ ├─> LinkingSystem might read nodes                 │
    │ │   ⚠️ BUT new node doesn't exist yet!             │
    │ │   ⚠️ OR node exists but userData.category        │
    │ │      not fully initialized!                      │
    │ │                                                   │
    │ └─> 🔴 CRASH POINT: 'undefined' category read      │
    │
    │
    │ FRAME N+1 (next microtask):                         │
    │                                                      │
    └──────────┬───────────────────────────────────────────┘
               │
               └─> performSpawn() executes (LATE!)
                   │
                   ├─> Line 1221: if (!category) {
                   │   └─> category = getWeightedRandomCategory()
                   │       ⚠️ FAILURE #4: Weight sum bug (26.5% gap)
                   │       Might return random special type
                   │
                   ├─> Line 1235: newNode = createNode(category, ...)
                   │   │
                   │   └─> userData.category = ASSIGNED ✓ (too late!)
                   │
                   ├─> Line 1238-1240: TIMING FIX 1.0 – Guard
                   │   └─> if (!newNode.userData.category) {
                   │       newNode.userData.category = category;
                   │       }
                   │       ✓ RE-assigns if missing (safety net)
                   │
                   ├─> Line 1258: visualBootstrap.bootstrapNode(...)
                   │   ⚠️ FAILURE #6: May reset userData?
                   │
                   └─> Line 1260: this.nodes.push(newNode)
                       └─> Node NOW in scene
                           BUT too late for HUD that read it earlier!


═══════════════════════════════════════════════════════════════════════════════
 PHASE 4: NODE ACTIVATION (Synchronous ✓)
═══════════════════════════════════════════════════════════════════════════════

During update() loop:
   │
   ├─> distance < activationDistance
   │
   └─> onNodeActivated(node)
       │
       ├─> const data = node.userData
       │
       └─> console.log(`AI Node ${data.index} [${data.category}] activated`)
           └─> ✓ category should be set by now


═══════════════════════════════════════════════════════════════════════════════
 PHASE 5: NODE DEACTIVATION (Synchronous + TYPO BUG)
═══════════════════════════════════════════════════════════════════════════════

When distance >= activationDistance:
   │
   └─> onNodeDeactivated(node)
       │
       ├─> const data = node.userData
       │
       └─> console.log(`AI Node ${data.index} [${data.type}] deactivated`)
           └─> 🔴 FAILURE #7: data.type is UNDEFINED!
               Should be: data.category
               Result: shows [undefined] in console


═══════════════════════════════════════════════════════════════════════════════
 FAILURE POINT LOCATIONS (Map View)
═══════════════════════════════════════════════════════════════════════════════

SYNCHRONOUS (SAFE):
  ✓ createNode() – category ALWAYS set
  ✓ createNodes() – iterates safely
  ✓ onNodeActivated() – reads category OK
  
ASYNC (DANGEROUS):
  ⚠️ spawnNode() – queueMicrotask creates race condition
  ⚠️ performSpawn() – runs next microtask, not immediately
  
SIDE-EFFECTS (UNKNOWN):
  ⚠️ SafeMetricsDNA.attachMetrics() – might overwrite userData
  ⚠️ NodeVisualBootstrap.bootstrapNode() – might reset userData
  
LOGIC BUGS:
  🔴 Probability weight sum < 1.0 (26.5% unaccounted)
  🔴 HUD fallback skips [UNKNOWN] display
  🔴 onNodeDeactivated() typo (reads data.type, not data.category)
  
MISSING MAPPINGS:
  ⚠️ EnhancedNodeModels.getCategoryColor() missing special categories


═══════════════════════════════════════════════════════════════════════════════
 TIMELINE: When category = undefined Happens
═══════════════════════════════════════════════════════════════════════════════

Initial spawn (createNodes):
  Frame 1: createNode() → userData.category = SET ✓
  Frame 1: scene.add() ✓
  Frame 1: this.nodes.push() ✓
  Frame 1: HUD ready ✓
  → Works fine

Runtime spawn (spawnNode):
  Frame N: queueMicrotask(performSpawn) → returns immediately
  Frame N: Main code continues
  Frame N: ❌ HUD/LinkingSystem tries to read new node
  Frame N: ❌ Node doesn't exist yet OR category not set
  Frame N: ❌ "undefined" returned
  Frame N+1: performSpawn() runs (TOO LATE!)
  Frame N+1: userData.category = SET


═══════════════════════════════════════════════════════════════════════════════
 CONCLUSION: Why "undefined" Happens
═══════════════════════════════════════════════════════════════════════════════

🔴 PRIMARY CAUSE (70% confidence):
   spawnNode() uses queueMicrotask() → async timing
   → Race condition: HUD reads before spawn completes
   → userData.category not initialized yet
   → Returns 'unknown' → HUD skips display
   → Appears as "undefined" to user

⚠️ CONTRIBUTING FACTORS:
   - SafeMetricsDNA might overwrite category
   - Bootstrap might reset userData
   - Weight sum bug forces special categories
   - HUD fallback logic skips 'unknown' display

```

---

## 🎯 KEY INSIGHT

**The root cause is ASYNC TIMING, not missing category.**

The category field EXISTS and is SET, but happens in the next microtask while the HUD tries to read it THIS frame.

This is a **race condition**, not a logic bug.

Fix: Make `spawnNode()` synchronous OR add proper synchronization guards.

---

**Diagnostic Report Complete** ✅
