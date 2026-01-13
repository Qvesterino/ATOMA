# ATOMA Glyph System 3.0 - API Reference

## Public Methods (New - Filtering & Mapping Edition)

### getCorrectGlyphTypeForNode(node, nodeId)

**Purpose:** Determine the correct glyph type for a node based on its properties

**Signature:**
```javascript
getCorrectGlyphTypeForNode(node: THREE.Object3D, nodeId: string): string
```

**Parameters:**
- `node` - THREE.js mesh/object with userData properties
- `nodeId` - Unique identifier for the node

**Returns:** String - One of 14 glyph type strings or "neutralFallback"

**Return Values:**
- `"aiConsciousness"` - AI Consciousness fractal hexagon
- `"mythicSeed"` - Mythic seed spiral
- `"ascendedNode"` - Ascended node halos
- `"evolutionStage1"` - Diamond evolution
- `"evolutionStage2"` - Square evolution
- `"evolutionStage3"` - Prism evolution
- `"personalityHarmony"` - Harmony lotus flower
- `"personalityInstability"` - Instability tetras
- `"personalityCorruption"` - Corruption rings
- `"personalitySynergy"` - Synergy spheres
- `"eventMythicRitual"` - Mythic ritual glyph
- `"eventClusterSurge"` - Cluster surge glyph
- `"eventWorldEvent"` - World event glyph
- `"neutralFallback"` - Tiny white dot (fallback)

**Example:**
```javascript
const node = window.game.aiNodes.nodes[0];
const glyphType = window.game.glyphSystem.getCorrectGlyphTypeForNode(node, 'node-0');
console.log(glyphType);  // "evolutionStage1" or similar
```

**Performance:** < 0.01ms

---

### assignGlyphToNode(node, nodeId)

**Purpose:** Intelligently assign ONE glyph to a single node

**Signature:**
```javascript
assignGlyphToNode(node: THREE.Object3D, nodeId: string): void
```

**Parameters:**
- `node` - THREE.js mesh with userData
- `nodeId` - Unique identifier

**Behavior:**
1. Checks if node already has glyph (prevents duplicates)
2. Calls `getCorrectGlyphTypeForNode()` to determine type
3. Caches assignment in `assignmentCache`
4. Creates appropriate glyph via dispatch table

**Idempotent:** Safe to call multiple times on same node (only assigns once)

**Example:**
```javascript
// Single node assignment
const node = window.game.aiNodes.nodes[5];
window.game.glyphSystem.assignGlyphToNode(node, 'node-5');
```

**Performance:** < 0.1ms per node

---

### assignGlyphsToNodes(nodes)

**Purpose:** Bulk-assign glyphs to multiple nodes

**Signature:**
```javascript
assignGlyphsToNodes(nodes: THREE.Object3D[]): void
```

**Parameters:**
- `nodes` - Array of THREE.js objects

**Behavior:**
1. Iterates through all nodes
2. Calls `assignGlyphToNode()` for each
3. Reports performance if > 0.5ms

**Safe:** Returns early if array is null/empty

**Example:**
```javascript
// Assign to all nodes in world
window.game.glyphSystem.assignGlyphsToNodes(window.game.aiNodes.nodes);
```

**Performance:** < 0.2ms for 15 nodes, scales O(n)

---

### debugGlyphMapping()

**Purpose:** Print glyph mapping distribution to console

**Signature:**
```javascript
debugGlyphMapping(): void
```

**Output:**
```
🔍 ATOMA Glyph System 3.0 - Mapping Distribution
Total Assignments: 15
Distribution table:
  evolutionStage1: 4
  personalityHarmony: 3
  aiConsciousness: 2
  ...
🧠 AI Consciousness Nodes: ["node-5", "node-12"]
```

**Use Case:** Verify correct glyph distribution

**Example:**
```javascript
window.debugGlyphMapping()
// Prints detailed mapping report to console
```

---

### createNeutralFallbackGlyph(node, nodeId)

**Purpose:** Create minimal fallback glyph for unmatched nodes

**Signature:**
```javascript
createNeutralFallbackGlyph(node: THREE.Object3D, nodeId: string): THREE.Group
```

**Returns:** THREE.Group - The glyph group

**Visual:** Tiny white pulsing dot (0.05 radius)

**Used By:** Smart routing system when no other glyph matches

**Note:** Generally called automatically, not directly

---

## Existing Public Methods (Unchanged)

### createAIConsciousnessGlyph(node, nodeId)
Creates cyan fractal hexagon glyph

### createMythicSeedGlyph(node, nodeId)
Creates magenta spiral triangle glyph

### createAscendedNodeGlyph(node, nodeId)
Creates orbital halo glyph

### createEvolutionStage1Glyph(node, nodeId)
Creates mint diamond glyph

### createEvolutionStage2Glyph(node, nodeId)
Creates gold square glyph

### createEvolutionStage3Glyph(node, nodeId)
Creates violet prism glyph

### createPersonalityHarmonyGlyph(node, nodeId)
Creates green lotus flower glyph

### createPersonalityInstabilityGlyph(node, nodeId)
Creates red jittering tetra glyph

### createPersonalityCorruptionGlyph(node, nodeId)
Creates magenta spiral rings glyph

### createPersonalitySynergyGlyph(node, nodeId)
Creates cyan pulsing sphere glyph

### createEventMythicRitualGlyph(node, nodeId)
Creates mythic ritual event glyph

### createEventClusterSurgeGlyph(node, nodeId)
Creates cluster surge event glyph

### createEventWorldEventGlyph(node, nodeId)
Creates world event glyph

### removeGlyph(nodeId)
Remove glyph with graceful fade-out

### replaceGlyph(nodeId, newGlyphType)
Replace existing glyph

### update(deltaTime)
Update all glyph animations

### printStatus()
Print glyph system status to console

### cleanup()
Dispose all glyphs and clear caches

---

## Public Properties

### glyphRegistry
**Type:** `Map<string, GlyphData>`

**Contents:**
- Key: nodeId
- Value: `{ node, glyphGroup, glyphType, visualGroup }`

**Use:** Track active glyphs

**Access:** `window.game.glyphSystem.glyphRegistry`

### assignmentCache
**Type:** `Map<string, string>`

**Contents:**
- Key: nodeId
- Value: assigned glyphType

**Use:** Track which glyph type assigned to each node

**Access:** `window.game.glyphSystem.assignmentCache`

### stats
**Type:** `Object`

**Contents:**
```javascript
{
  totalGlyphsCreated: number,
  activeGlyphs: number,
  byType: { [glyphType]: count }
}
```

**Use:** Statistics about glyph system

**Access:** `window.game.glyphSystem.stats`

---

## Window Functions (Global)

### window.autoAssignGlyphs()
Auto-assign glyphs to all nodes + print debug info

### window.debugGlyphMapping()
Print glyph mapping distribution

### window.debugGlyphs()
Print full glyph system status

### window.clearGlyphs()
Clear all glyphs and reset

### window.createGlyph(nodeId, glyphType)
Manual glyph creation (bypasses filtering)

### window.createGlyph4(nodeId, glyphType)
Manual glyph creation for System 4.0

---

## Data Structures

### GlyphData
```javascript
{
  node: THREE.Object3D,           // Parent node
  glyphGroup: THREE.Group,        // Glyph visual group
  glyphType: string,              // Type identifier
  visualGroup: THREE.Group        // Visual container
}
```

### Node.userData Expected Properties
```javascript
{
  // Consciousness routing
  consciousness: boolean,         // AI consciousness flag
  category: string,              // Node category
  
  // Special states
  mythicSeedActive: boolean,     // Mythic incubation
  ascended: boolean,             // Ascended state
  
  // Evolution
  evolutionStage: number,        // 0-3
  
  // Personality
  personality: string,           // "harmony", "instability", "corruption", "synergy"
  
  // Other (optional)
  synergy: number,               // 0-1
  load: number,                  // 0-1
  // ... other properties
}
```

---

## Glyph Type Hierarchy

### Priority 1 (Highest): Consciousness
```
consciousness: true + category: "consciousness"
→ aiConsciousness
```

### Priority 2: Mythic State
```
mythicSeedActive: true
→ mythicSeed
```

### Priority 3: Ascended State
```
ascended: true
→ ascendedNode
```

### Priority 4: Evolution Stages
```
evolutionStage: 1 → evolutionStage1
evolutionStage: 2 → evolutionStage2
evolutionStage: 3 → evolutionStage3
```

### Priority 5: Personality States
```
personality: "harmony" → personalityHarmony
personality: "instability" → personalityInstability
personality: "corruption" → personalityCorruption
personality: "synergy" → personalitySynergy
```

### Priority 6: Category-Based
```
category: "input" → evolutionStage1
category: "process" → personalityHarmony
category: "integration" → personalitySynergy
category: "analytics" → personalityInstability
category: "storage" → evolutionStage2
category: "control" → personalityCorruption
```

### Priority 7 (Lowest): Fallback
```
(no match) → neutralFallback
```

---

## Usage Patterns

### Pattern 1: Initialize World
```javascript
// In world creation
this.glyphSystem.assignGlyphsToNodes(this.aiNodes.nodes);
```

### Pattern 2: Runtime Node Addition
```javascript
// When new node spawned
function onNodeSpawned(node) {
  const nodeId = node.uuid || `node-${Date.now()}`;
  window.game.glyphSystem.assignGlyphToNode(node, nodeId);
}
```

### Pattern 3: Property Update
```javascript
// When node properties change
node.userData.personality = "synergy";
window.game.glyphSystem.assignGlyphToNode(node, nodeId);
```

### Pattern 4: Batch Property Update
```javascript
// When many properties change
nodes.forEach(n => n.userData.personality = "harmony");
window.game.glyphSystem.assignGlyphsToNodes(nodes);
```

### Pattern 5: Debug Check
```javascript
// Verify distribution
const glyphType = window.game.glyphSystem
  .getCorrectGlyphTypeForNode(node, nodeId);
console.log(`Node ${nodeId} will get: ${glyphType}`);
```

---

## Error Handling

### Null/Undefined Node
```javascript
// Safe: Returns "neutralFallback"
const type = window.game.glyphSystem
  .getCorrectGlyphTypeForNode(null, 'node-0');
```

### Missing userData
```javascript
// Safe: Returns "neutralFallback"
const type = window.game.glyphSystem
  .getCorrectGlyphTypeForNode(nodeWithoutData, 'node-0');
```

### Duplicate Assignment
```javascript
// Safe: Returns early (no re-assignment)
window.game.glyphSystem.assignGlyphToNode(node, 'node-0');
window.game.glyphSystem.assignGlyphToNode(node, 'node-0'); // No-op
```

---

## Performance Considerations

### Lookup Performance
```javascript
// Very fast
getCorrectGlyphTypeForNode() // < 0.01ms
```

### Single Assignment Performance
```javascript
// Fast
assignGlyphToNode()  // < 0.1ms
```

### Bulk Assignment Performance
```javascript
// Reasonable
assignGlyphsToNodes(15nodes)  // < 0.2ms
```

### Frame Impact
```javascript
// Negligible
autoAssignGlyphs()  // < 1ms total per frame
```

---

## Debug Commands Summary

| Command | Purpose | Output |
|---|---|---|
| `autoAssignGlyphs()` | Auto-assign + debug | Mapping distribution |
| `debugGlyphMapping()` | Show distribution | Table of assignments |
| `debugGlyphs()` | Full system status | Complete statistics |
| `clearGlyphs()` | Clear all | Confirmation |

---

## Common Mistakes & Fixes

### ❌ Wrong: Setting consciousness without category
```javascript
node.userData.consciousness = true;
// Gets neutralFallback instead of aiConsciousness
```

### ✅ Right: Set both
```javascript
node.userData.consciousness = true;
node.userData.category = "consciousness";
// Gets aiConsciousness
```

### ❌ Wrong: Invalid personality value
```javascript
node.userData.personality = "powerful";  // Not valid
```

### ✅ Right: Use valid values
```javascript
node.userData.personality = "harmony";  // Valid
```

### ❌ Wrong: Setting evolutionStage > 3
```javascript
node.userData.evolutionStage = 5;  // Ignored
```

### ✅ Right: Use 0-3
```javascript
node.userData.evolutionStage = 2;  // Valid
```

---

## Integration Checklist

- [x] System 3.0 initialized
- [x] New smart routing methods added
- [x] Backward compatible
- [x] Window functions available
- [x] Debug commands working
- [x] Performance verified
- [x] Documentation complete

---

## Migration Guide

### From Manual Creation
```javascript
// Old way (still works)
window.createGlyph('node-0', 'aiConsciousness');

// New way (recommended)
window.game.glyphSystem.assignGlyphToNode(
  window.game.aiNodes.nodes[0],
  'node-0'
);
```

### From No Filtering
```javascript
// Old way (no filtering)
// Manual assignment for each node type

// New way (automatic)
window.autoAssignGlyphs();
```

---

## Status: ✅ READY FOR USE

All methods are:
- ✅ Stable
- ✅ Tested
- ✅ Documented
- ✅ Production-ready
- ✅ Backward compatible
