# Glyph Filtering & Mapping - Integration Guide

## 5-Minute Quick Start

### Step 1: Verify System is Ready
```javascript
// Check Glyph System 3.0 is initialized
console.log(window.game?.glyphSystem)  // Should exist
console.log(window.game?.aiNodes?.nodes)  // Should have nodes
```

### Step 2: Auto-Assign Glyphs to All Nodes
```javascript
window.autoAssignGlyphs()
```

**Console Output:**
```
✓ Auto-assigned glyphs to all nodes
🔍 ATOMA Glyph System 3.0 - Mapping Distribution
Total Assignments: 15
{ evolutionStage1: 4, personalityHarmony: 3, aiConsciousness: 2, ... }
🧠 AI Consciousness Nodes: ["node-5", "node-12"]
```

### Step 3: Verify Distribution
```javascript
window.debugGlyphMapping()
```

✅ You're done! Nodes now have correctly routed glyphs.

---

## Detailed Integration

### At World Creation (Recommended Place)

In `main.js` during world initialization:

```javascript
createAINodes() {
  this.aiNodes = new AINodes(this.scene, this.player);
  const nodeCount = this.currentMode === 'chamber' ? 12 : 15;
  this.aiNodes.createNodes(this.currentMode, nodeCount);
  
  // NEW: Intelligently assign glyphs to all nodes
  if (this.glyphSystem) {
    this.glyphSystem.assignGlyphsToNodes(this.aiNodes.nodes);
    console.log('✓ Glyphs auto-assigned to all nodes');
  }
  
  // ... rest of initialization
}
```

### At World Transitions

In `switchMode()` after creating new nodes:

```javascript
// Create new AI nodes
this.createAINodes();

// Reset ATOMA Glyph System 3.0 for new nodes
if (this.glyphSystem) {
  this.glyphSystem.cleanup();
  // NEW: Re-assign glyphs to new world's nodes
  this.glyphSystem.assignGlyphsToNodes(this.aiNodes.nodes);
}
```

### On Demand (Runtime)

```javascript
// If nodes are spawned dynamically
function onNodeSpawned(newNode) {
  const nodeId = newNode.uuid || `node-${Date.now()}`;
  window.game.glyphSystem.assignGlyphToNode(newNode, nodeId);
}
```

---

## Customizing Node Properties

### Making a Consciousness Node

```javascript
const node = window.game.aiNodes.nodes[0];

// REQUIRED: Both properties must be set
node.userData.consciousness = true;
node.userData.category = "consciousness";

// Re-assign to get correct glyph
window.game.glyphSystem.assignGlyphToNode(node, 'node-0');
```

### Making a Mythic Node

```javascript
const node = window.game.aiNodes.nodes[5];
node.userData.mythicSeedActive = true;
node.userData.aeonTimer = Math.random() * 6.28;

window.game.glyphSystem.assignGlyphToNode(node, 'node-5');
```

### Setting Personality

```javascript
const node = window.game.aiNodes.nodes[3];

// Valid values: "harmony", "instability", "corruption", "synergy"
node.userData.personality = "harmony";

window.game.glyphSystem.assignGlyphToNode(node, 'node-3');
```

### Setting Evolution Stage

```javascript
const node = window.game.aiNodes.nodes[7];

// Valid values: 0 (none), 1, 2, 3
node.userData.evolutionStage = 2;

window.game.glyphSystem.assignGlyphToNode(node, 'node-7');
```

### Setting Category (Default Routing)

```javascript
const node = window.game.aiNodes.nodes[2];

// Valid categories:
// "input", "process", "integration", "analytics", "storage", "control"
node.userData.category = "process";

window.game.glyphSystem.assignGlyphToNode(node, 'node-2');
```

---

## Mapping Reference by Use Case

### "I want cyan hexagons only on specific nodes"

**Solution:**
```javascript
// Method 1: Manual assignment
window.game.aiNodes.nodes.forEach((node, i) => {
  node.userData.consciousness = false;  // Clear all first
  node.userData.category = "unknown";
});

// Then set only the ones you want
window.game.aiNodes.nodes[0].userData.consciousness = true;
window.game.aiNodes.nodes[0].userData.category = "consciousness";
window.game.aiNodes.nodes[5].userData.consciousness = true;
window.game.aiNodes.nodes[5].userData.category = "consciousness";

// Re-assign all
window.autoAssignGlyphs();
```

### "I want each category to have distinct glyphs"

**Solution:**
```javascript
// The system does this automatically!
// Just ensure nodes have category set:

window.game.aiNodes.nodes[0].userData.category = "input";         // → diamond
window.game.aiNodes.nodes[1].userData.category = "process";       // → flower
window.game.aiNodes.nodes[2].userData.category = "integration";   // → spheres
window.game.aiNodes.nodes[3].userData.category = "analytics";     // → tetras
window.game.aiNodes.nodes[4].userData.category = "storage";       // → squares
window.game.aiNodes.nodes[5].userData.category = "control";       // → rings

window.autoAssignGlyphs();
```

### "I want personalities to override categories"

**Solution:**
```javascript
// Personality has higher priority than category
// Just set personality and re-assign:

window.game.aiNodes.nodes.forEach((node, i) => {
  if (Math.random() > 0.5) {
    node.userData.personality = 
      ["harmony", "instability", "corruption", "synergy"][
        Math.floor(Math.random() * 4)
      ];
  }
});

window.autoAssignGlyphs();
```

### "I want evolution stages for all nodes"

**Solution:**
```javascript
// Set evolution stage on all nodes
window.game.aiNodes.nodes.forEach((node, i) => {
  node.userData.evolutionStage = (i % 3) + 1;  // Cycle 1, 2, 3, 1, 2, 3...
});

window.autoAssignGlyphs();
```

---

## Priority/Precedence Rules

When a node has MULTIPLE properties set, this is the order:

```
1. Consciousness (if consciousness: true AND category: "consciousness")
   ↓ No match
2. Mythic (if mythicSeedActive: true)
   ↓ No match
3. Ascended (if ascended: true)
   ↓ No match
4. Evolution (if evolutionStage: 1-3)
   ↓ No match
5. Personality (if personality is set)
   ↓ No match
6. Category (if category matches map)
   ↓ No match
7. Fallback (neutral dot)
```

**Example:** If a node has BOTH evolution stage AND personality:
```javascript
node.userData.evolutionStage = 2;  // Has this
node.userData.personality = "harmony";  // And this

// Personality wins (higher priority)
// Result: personalityHarmony glyph
```

---

## Advanced Patterns

### Pattern 1: Dynamic Personality Changes

```javascript
function updateNodePersonalities(nodes) {
  nodes.forEach((node, i) => {
    // Base personality on synergy
    if (node.userData.synergy > 0.7) {
      node.userData.personality = "synergy";
    } else if (node.userData.synergy < 0.3) {
      node.userData.personality = "instability";
    } else {
      node.userData.personality = "harmony";
    }
  });
  
  // Re-assign glyphs for all
  window.game.glyphSystem.assignGlyphsToNodes(nodes);
}

// Call regularly
setInterval(() => {
  updateNodePersonalities(window.game.aiNodes.nodes);
}, 1000);
```

### Pattern 2: Evolution Progression

```javascript
function advanceNodeEvolution() {
  window.game.aiNodes.nodes.forEach(node => {
    const currentStage = node.userData.evolutionStage || 0;
    
    // Randomly advance to next stage
    if (Math.random() > 0.8 && currentStage < 3) {
      node.userData.evolutionStage = currentStage + 1;
      console.log(`📈 Node evolved to stage ${currentStage + 1}`);
    }
  });
  
  // Re-assign glyphs
  window.autoAssignGlyphs();
}
```

### Pattern 3: Consciousness Awakening

```javascript
function awakenConsciousnessNodes(nodeCount = 2) {
  // Pick random nodes
  const nodes = window.game.aiNodes.nodes
    .sort(() => Math.random() - 0.5)
    .slice(0, nodeCount);
  
  nodes.forEach(node => {
    node.userData.consciousness = true;
    node.userData.category = "consciousness";
  });
  
  window.autoAssignGlyphs();
  console.log(`✨ ${nodeCount} nodes awakened to consciousness`);
}

// Example usage
awakenConsciousnessNodes(3);
window.debugGlyphMapping();
```

### Pattern 4: Category-Based Theming

```javascript
function applyTheme(theme) {
  const themeMaps = {
    'chaos': {
      input: 'instability', process: 'corruption',
      integration: 'instability', analytics: 'corruption',
      storage: 'instability', control: 'corruption'
    },
    'harmony': {
      input: 'harmony', process: 'harmony',
      integration: 'synergy', analytics: 'harmony',
      storage: 'harmony', control: 'harmony'
    },
    'evolution': {
      input: 1, process: 2, integration: 2,
      analytics: 1, storage: 3, control: 1
    }
  };
  
  const map = themeMaps[theme];
  
  window.game.aiNodes.nodes.forEach((node, i) => {
    const cat = node.userData.category;
    const val = map[cat];
    
    if (theme === 'evolution') {
      node.userData.evolutionStage = val;
    } else {
      node.userData.personality = val;
    }
  });
  
  window.autoAssignGlyphs();
}

// Usage
applyTheme('chaos');
applyTheme('harmony');
applyTheme('evolution');
```

---

## Debug Workflow

### 1. Check Current State
```javascript
window.debugGlyphMapping()
window.debugGlyphs()
```

### 2. Inspect Specific Node
```javascript
const node = window.game.aiNodes.nodes[0];
console.table({
  consciousness: node.userData.consciousness,
  category: node.userData.category,
  personality: node.userData.personality,
  evolutionStage: node.userData.evolutionStage,
  mythicSeedActive: node.userData.mythicSeedActive,
  ascended: node.userData.ascended
});

const glyphType = window.game.glyphSystem
  .getCorrectGlyphTypeForNode(node, 'node-0');
console.log('Will get glyph:', glyphType);
```

### 3. Test Assignment
```javascript
// Clear and re-assign
window.clearGlyphs();
window.autoAssignGlyphs();
window.debugGlyphMapping();
```

### 4. Verify Visual
```javascript
// Check if glyphs are visible
window.game.glyphSystem.glyphRegistry.forEach((data, nodeId) => {
  console.log(`${nodeId}: ${data.glyphType}`, data.glyphGroup);
});
```

---

## Troubleshooting Checklist

### "Consciousness nodes not showing cyan hexagon"
```javascript
// 1. Check property values
window.game.aiNodes.nodes.forEach((n, i) => {
  if (n.userData.consciousness) {
    console.log(`Node ${i}:`, {
      consciousness: n.userData.consciousness,
      category: n.userData.category,
      should_be: 'consciousness'
    });
  }
});

// 2. Re-assign
window.autoAssignGlyphs();

// 3. Verify
window.debugGlyphMapping();
```

### "Too many neutral dots appearing"
```javascript
// Indicates nodes don't match any category
// Check what categories exist
const categories = new Set();
window.game.aiNodes.nodes.forEach(n => {
  categories.add(n.userData.category);
});
console.log('Existing categories:', Array.from(categories));

// Add missing category assignments
window.game.aiNodes.nodes.forEach(n => {
  if (!n.userData.category) {
    n.userData.category = 'process';  // Default
  }
});

window.autoAssignGlyphs();
```

### "Glyphs not animating"
```javascript
// Check if glyph groups exist and have children
window.game.glyphSystem.glyphRegistry.forEach((data, nodeId) => {
  console.log(`${nodeId}:`, {
    hasParent: !!data.glyphGroup.parent,
    childCount: data.glyphGroup.children.length,
    visible: data.glyphGroup.visible
  });
});
```

---

## Performance Monitoring

### Check Assignment Performance
```javascript
console.time('Assignment');
window.autoAssignGlyphs();
console.timeEnd('Assignment');  // Should be < 0.2ms
```

### Monitor Memory Usage
```javascript
const cacheSize = window.game.glyphSystem.assignmentCache.size;
const estimatedMemory = (cacheSize * 100) + 2048;  // bytes
console.log(`Cache: ${cacheSize} nodes, ~${estimatedMemory / 1024}KB memory`);
```

### Check Frame Impact
```javascript
// In DevTools Performance tab:
// 1. Record frame
// 2. Look for autoAssignGlyphs call
// 3. Should be < 0.2ms in main thread
```

---

## Common Tasks Reference

| Task | Command |
|---|---|
| Auto-assign to all nodes | `window.autoAssignGlyphs()` |
| View distribution | `window.debugGlyphMapping()` |
| Clear all glyphs | `window.clearGlyphs()` |
| Assign to one node | `window.game.glyphSystem.assignGlyphToNode(node, id)` |
| Check glyph type | `window.game.glyphSystem.getCorrectGlyphTypeForNode(node, id)` |
| View full status | `window.debugGlyphs()` |

---

## Best Practices

✅ **DO:**
- Call `autoAssignGlyphs()` after world creation
- Set node properties BEFORE assignment
- Use `debugGlyphMapping()` to verify
- Clear glyphs on world transitions

❌ **DON'T:**
- Manually create consciousness glyphs (use auto-assign)
- Set invalid personality values
- Forget to re-assign after property changes
- Use evolution stage > 3

---

## Integration Checklist

- [ ] System 3.0 initialized
- [ ] Nodes exist and have userData
- [ ] Ran `autoAssignGlyphs()`
- [ ] Verified with `debugGlyphMapping()`
- [ ] Only consciousness nodes have cyan hexagons
- [ ] All other nodes have appropriate glyphs
- [ ] No duplicate glyphs
- [ ] Animations working smoothly
- [ ] No console errors
- [ ] Performance acceptable (< 0.2ms)

---

## Status: ✨ READY TO USE ✨

The glyph filtering system is fully integrated and production-ready. Follow these guides to:
1. Auto-assign glyphs to your world
2. Customize per-node properties
3. Monitor and debug distribution
4. Implement advanced patterns

Questions? Check the comprehensive documentation: `_GlyphFiltering_SafeEdition_Documentation.md`
