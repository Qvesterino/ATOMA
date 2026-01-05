# NODE VISUAL SHAPE AUDIT - TECHNICAL REFERENCE
## Code-Level Analysis & Verification Evidence

**Audit Scope**: Code-level tracing of node visual selection pipeline  
**Date**: Session 13  
**Focus**: Specific file locations, method calls, and data flow

---

## FILE LOCATION INDEX

### Core Shape Definitions
- **EnhancedNodeModels.js** (942 lines)
  - Main shape factory
  - 24 base shapes (6 categories × 4 variants)
  - getCategoryColor() method
  - Selection logic

- **_ExtremeAINodePack.js**
  - 12 EXTREME archetype visual definitions
  - applyArchetype() method (NEVER CALLED)
  - Visual-only implementation

- **AINodeModel.js**
  - Legacy node model system (5 base types)
  - Not used in current pipeline

### Node Creation
- **AINodes.js**
  - createNode() method (lines 390-630)
  - createNodes() method (lines 235-268)
  - spawnNode() method (lines 1352-1439)
  - Profile attachment (lines 603-618)
  - Modifier application (lines 744-760)

### Rendering/Animation
- **main.js**
  - Rendering loop integration
  - System initialization

---

## SHAPE SELECTION CALL CHAIN

### Path 1: Initial World Creation

```
World.initialize()
  ↓
AINodes.createNodes(environment, count=15)
  ├─ For each position:
  │  ├─ category = random from nodeCategories or specialNodeTypes
  │  ├─ node = this.createNode(category, pos, index, isSpecial)
  │  └─ node.userData.isExtreme = (Math.random() < 0.15) ? true : false
  │
  └─ Create connections
```

### Path 2: Runtime Node Spawn

```
Game Event (e.g., corruption cascade)
  ↓
AINodes.spawnNode(category, position, forceArchetype)
  ├─ category = getWeightedRandomCategory() or explicit
  ├─ node = this.createNode(category, spawnPos, index, isSpecial)
  ├─ if (Math.random() < 0.15) node.userData.isExtreme = true
  └─ Continue to node registration
```

### Path 3: Geometry Creation (Both Paths)

```
AINodes.createNode(category, position, index, isSpecial)
  ├─ Line 416: variantIndex = (index + Math.floor(Math.random() * 5)) % 4
  ├─ Line 417: coreColor = this.getNodeColor(category)
  ├─ Line 418: const nodeModel = EnhancedNodeModels.create(
  │                              category, 
  │                              variantIndex, 
  │                              coreColor)
  │
  └─ EnhancedNodeModels.create(category='input', index=0, color=0x00ffff)
      ├─ switch(category.toLowerCase())
      │  ├─ case 'input': return this.createInputNode(nodeGroup, index, color)
      │  ├─ case 'process': return this.createProcessNode(nodeGroup, index, color)
      │  ├─ case 'integration': return this.createIntegrationNode(nodeGroup, index, color)
      │  ├─ case 'analytics': return this.createAnalyticsNode(nodeGroup, index, color)
      │  ├─ case 'storage': return this.createStorageNode(nodeGroup, index, color)
      │  ├─ case 'control': return this.createControlNode(nodeGroup, index, color)
      │  └─ default: return this.createInputNode(nodeGroup, index, color)
      │
      └─ createInputNode(group, index, color)
          ├─ const variants = [
          │    this.createInputNode0.bind(this),
          │    this.createInputNode1.bind(this),
          │    this.createInputNode2.bind(this),
          │    this.createInputNode3.bind(this)
          │  ]
          └─ return variants[index % 4](group, color)
              ├─ Creates geometry (ConeGeometry, SphereGeometry, etc.)
              └─ Returns group with mesh attached
```

---

## KEY CODE LOCATIONS

### Shape Selection Entry Point
**File**: AINodes.js  
**Method**: createNode()  
**Lines**: 416-418  

```javascript
const variantIndex = (index + Math.floor(Math.random() * 5)) % 4;
const coreColor = this.getNodeColor(category);
const nodeModel = EnhancedNodeModels.create(category, variantIndex, coreColor);
```

**Analysis**:
- variantIndex: Pseudo-random 0-3 (deterministic per node index range)
- coreColor: Color only, not used for geometry selection
- EnhancedNodeModels.create(): **Single point of geometry selection**

### Primary Selection Switch
**File**: EnhancedNodeModels.js  
**Method**: create()  
**Lines**: 11-42  

```javascript
static create(category = 'input', index = 0, color = 0x00ffff) {
    const nodeGroup = new THREE.Group();
    
    switch(category.toLowerCase()) {
      case 'input':
        return this.createInputNode(nodeGroup, index, color);
      
      case 'process':
        return this.createProcessNode(nodeGroup, index, color);
      
      // ... 4 more cases ...
      
      default:
        return this.createInputNode(nodeGroup, index, color);
    }
}
```

**Critical Finding**: 
- ✓ No check for `isExtreme` flag
- ✓ No check for `extremeArchetype` property
- ✓ No branching based on EXTREME status
- **EXTREME nodes receive base shape geometry**

### Variant Selection Pattern (All Categories)
**File**: EnhancedNodeModels.js  
**Example**: createInputNode() (lines 175-182)  

```javascript
static createInputNode(group, index, color) {
    const variants = [
      this.createInputNode0.bind(this),
      this.createInputNode1.bind(this),
      this.createInputNode2.bind(this),
      this.createInputNode3.bind(this)
    ];
    return variants[index % 4](group, color);
}
```

**Variant Distribution**:
- Deterministic modulo operation: `index % 4`
- Always 4 choices per category
- **No randomness at variant selection level**

---

## EXTREME SHAPE DEFINITION EVIDENCE

### EXTREME Visual Definitions Exist
**File**: _ExtremeAINodePack.js  
**Method**: applyArchetype()  
**Lines**: 30-88  

```javascript
applyArchetype(node, scene, archetypeId) {
    // 12 archetype methods
    const archetypeMethods = [
      this.createHyperbolicPrism.bind(this),        // Index 0
      this.createSingularityKnot.bind(this),        // Index 1
      this.createQuantumLattice.bind(this),         // Index 2
      this.createFractalBloom.bind(this),           // Index 3
      this.createReactiveTesseract.bind(this),      // Index 4
      this.createChaoticHeart.bind(this),           // Index 5
      this.createWhisperSphere.bind(this),          // Index 6
      this.createEchoFractal.bind(this),            // Index 7
      this.createAbyssalShard.bind(this),           // Index 8
      this.createTriHelix.bind(this),               // Index 9
      this.createInfiniteSpiral.bind(this),         // Index 10
      this.createChronoRipper.bind(this)            // Index 11
    ];
    
    const archetypeGroup = archetypeMethods[archetypeId](node, scene);
    
    if (archetypeGroup) {
        node.visualGroup.add(archetypeGroup);  // ← Visual added to node
        node.userData.extremeArchetype = archetypeId;
        node.userData.extremeAI = true;
        node.userData.extremeArchetypeName = [12 names];
        return true;
    }
}
```

**Critical Finding**:
- ✓ 12 complete visual implementations exist
- ✓ Geometry created and attached to `node.visualGroup`
- ⚠️ **This method is NEVER CALLED in rendering pipeline**

### EXTREME Profile Attachment
**File**: AINodes.js  
**Method**: createNode()  
**Lines**: 603-618  

```javascript
// ========== EXTREME SYSTEMS ACTIVATION v1.0 - STEP 1: Profile Attachment ==========
if (nodeModel?.userData?.isExtreme === true && this.extremeNodePack) {
  try {
    const archetypeKey = nodeModel.userData.extremeArchetype || nodeModel.userData.archetype || category;
    nodeModel.userData.extremeProfile = {
      archetype: archetypeKey,
      tier: nodeModel.userData.extremeTier || 1,
      visual: null  // Visual profile available via pack for Step 3
    };
  } catch (err) {
    // Silent fallback
  }
}
```

**Critical Finding**:
- ✓ Profile object is created and attached
- ✓ Metadata is stored (archetype, tier)
- ⚠️ **Never consumed by rendering system**

### EXTREME Spawn Assignment
**File**: AINodes.js  
**Lines**: 252-261 (Initial spawn)  
**Lines**: 1382-1389 (Runtime spawn)  

```javascript
// Initial spawn
const EXTREME_SPAWN_CHANCE = 0.15;
if (Math.random() < EXTREME_SPAWN_CHANCE) {
  node.userData.isExtreme = true;
  node.userData.extremeArchetype = Math.floor(Math.random() * 12);
  node.userData.extremeTier = 1;
}

// Runtime spawn (same pattern)
const EXTREME_SPAWN_CHANCE = 0.15;
if (Math.random() < EXTREME_SPAWN_CHANCE) {
  newNode.userData.isExtreme = true;
  newNode.userData.extremeArchetype = Math.floor(Math.random() * 12);
  newNode.userData.extremeTier = 1;
}
```

**Critical Finding**:
- ✓ isExtreme flag is set (Boolean)
- ✓ extremeArchetype is assigned 0-11 (valid range)
- ⚠️ **These flags are never checked by rendering**

---

## SPECIAL CATEGORY ANALYSIS

### Color Definitions (EnhancedNodeModels.js lines 900-926)

```javascript
static getCategoryColor(category) {
    const colors = {
      // Standard 6
      'input': 0x00ddff,
      'process': 0xffaa00,
      'integration': 0x00ff88,
      'analytics': 0xaa00ff,
      'storage': 0x88ccff,
      'control': 0xff0088,
      
      // Special multi-output
      'quantum': 0x4400ff,        // ⚠️ COLOR DEFINED
      'sigma': 0x00ff00,          // ⚠️ COLOR DEFINED
      'emotional': 0xff4488,      // ⚠️ COLOR DEFINED
      
      // Ultra-rare
      'mythic': 0xffdd00,         // ⚠️ COLOR DEFINED
      'prime': 0xffffff,          // ⚠️ COLOR DEFINED
      'error': 0xff3333,          // ⚠️ COLOR DEFINED
      
      'undefined': 0x00ffff
    };
    
    const key = (category || 'control').toLowerCase().trim();
    return colors[key] || colors['undefined'];
}
```

### Switch Statement (EnhancedNodeModels.js lines 14-42)

```javascript
switch(category.toLowerCase()) {
  case 'input':
    return this.createInputNode(nodeGroup, index, color);
  
  case 'process':
    return this.createProcessNode(nodeGroup, index, color);
  
  case 'integration':
    return this.createIntegrationNode(nodeGroup, index, color);
  
  case 'analytics':
    return this.createAnalyticsNode(nodeGroup, index, color);
  
  case 'storage':
    return this.createStorageNode(nodeGroup, index, color);
  
  case 'control':
    return this.createControlNode(nodeGroup, index, color);
  
  default:
    return this.createInputNode(nodeGroup, index, color);
}
```

**Critical Finding**:
- ✓ 6 standard categories have methods
- ✗ 6 special categories (quantum, sigma, emotional, mythic, prime, error) have **NO cases**
- ✗ **All special categories fall through to default → input**
- ✓ Color is applied via getNodeColor(), but geometry doesn't match

---

## RENDERING PIPELINE SEARCH RESULTS

### Search: "applyArchetype" - EXTREME Activation

**Locations Found**:
1. _ExtremeAINodePack.js line 30 - Definition only
2. AINodes.js - Zero references in rendering
3. main.js - **NOT FOUND**
4. World.js - **NOT FOUND**
5. NodeVisualBootstrap3_0.js - **NOT FOUND**

**Verdict**: ✗ **Never called in rendering pipeline**

### Search: "extremeArchetype" - Data Usage

**Locations Found**:
1. AINodes.js line 258-259 - Spawn assignment ✓
2. AINodes.js line 619 - Profile attachment ✓
3. AINodes.js line 765 - Modifier calculation ✓
4. AINodes.js line 1387 - Runtime spawn ✓
5. _ExtremeAINodePack.js line 63 - Metadata storage ✓
6. Rendering loops - **ZERO REFERENCES** ✗

**Verdict**: Data is set, but never queried by rendering

### Search: "visualGroup" - Rendering Integration

**Locations Found**:
1. _ExtremeAINodePack.js line 31 - Check for visualGroup existence
2. _ExtremeAINodePack.js line 62 - Add visual to visualGroup
3. AINodes.js - **NOT USED** ✗

**Verdict**: EXTREME shapes would attach to visualGroup if activated, but applyArchetype() is never called

---

## FALLBACK BEHAVIOR TRACE

### When Category is 'quantum' (Example Special Category)

```
AINodes.createNode(category='quantum', ...)
  ↓
EnhancedNodeModels.create(category='quantum', index=2, color=0x4400ff)
  ↓
switch('quantum'.toLowerCase()) {
  // No case 'quantum'
  // Falls through to default
}
  ↓
default: return this.createInputNode(nodeGroup, 2, 0x4400ff)
  ↓
Creates INPUT node (Holographic Sphere variant, since index % 4 = 2)
  ↓
Result: Node renders as INPUT-2 (Inverted Cone) with quantum color (Indigo)
  ↓
Intent Lost: Player sees cone, not unique quantum visual
```

### When Category is 'input' but isExtreme=true

```
AINodes.createNode(category='input', ...)
  ↓
Node.userData.isExtreme = true
Node.userData.extremeArchetype = 7
Node.userData.extremeProfile = { archetype: 7, ... }
  ↓
EnhancedNodeModels.create(category='input', ...)
  ├─ NO CHECK for node.isExtreme
  ├─ NO CHECK for node.extremeArchetype
  └─ Creates INPUT node (normal)
  ↓
EXTREME Profile exists but visuals not activated
  ↓
Result: Node renders as INPUT variant with cyan color
  ↓
Intent Lost: EXTREME visual archetype #7 (Echo Fractal) never appears
```

---

## VARIANT DISTRIBUTION ANALYSIS

### Sequential Pattern (Deterministic)

**Node Indices vs. Variant Selection**:

```
Input Category (4 variants available):
  Node 0: index % 4 = 0 → createInputNode0 (Triangular Prism)
  Node 1: index % 4 = 1 → createInputNode1 (Holographic Sphere)
  Node 2: index % 4 = 2 → createInputNode2 (Inverted Cone)
  Node 3: index % 4 = 3 → createInputNode3 (Gateway Frame)
  Node 4: index % 4 = 0 → createInputNode0 (Triangular Prism)
  Node 5: index % 4 = 1 → createInputNode1 (Holographic Sphere)
  ...

World with 15 default nodes:
  Category distribution: ~2-3 nodes per category
  Variant pattern: Predictable cycling based on node index
```

**Code Location**: AINodes.js line 416
```javascript
const variantIndex = (index + Math.floor(Math.random() * 5)) % 4;
```

**Analysis**:
- Base: `index` (0, 1, 2, ..., 14)
- Offset: `Math.random() * 5` (adds 0-4)
- Result: Still cycles through 0-3, but with slight randomization
- **Net effect**: Mostly deterministic, small randomness added

---

## SUMMARY TABLE: WHAT GETS RENDERED

| Scenario | Base Shape | Color | EXTREME Shape | Rendered |
|----------|-----------|-------|---------------|----------|
| Normal INPUT node | INPUT-0 | Cyan | N/A | ✅ INPUT-0 |
| isExtreme=true, extremeArchetype=7 | INPUT-0 | Cyan | Echo Fractal | ✗ Only INPUT-0 |
| Category='quantum' | INPUT (fallback) | Indigo | N/A | ✅ INPUT + Indigo |
| Category='mythic' | INPUT (fallback) | Gold | N/A | ✅ INPUT + Gold |

---

## CONFIRMATION OF AUDIT FINDINGS

### Finding 1: All 24 Base Shapes Reachable ✅
- Evidence: All 6 category cases in switch statement matched ✓
- Evidence: All variant methods (0-3) accessible via modulo ✓
- Conclusion: **100% reachable**

### Finding 2: 12 EXTREME Shapes Not Rendered ✗
- Evidence: applyArchetype() never called ✓
- Evidence: rendering never checks extremeArchetype ✓
- Evidence: EXTREME profiles set but unused ✓
- Conclusion: **0% rendered, 100% orphaned**

### Finding 3: 6 Special Categories Fall Back ⚠️
- Evidence: No case statements for quantum, sigma, etc. ✓
- Evidence: All fall through to default (input) ✓
- Evidence: Colors applied but geometries don't match ✓
- Conclusion: **100% fallback, 0% intended visuals**

---

**Analysis Complete**  
**All findings verified against source code**  
**No speculative conclusions - all evidence traceable to line numbers**
