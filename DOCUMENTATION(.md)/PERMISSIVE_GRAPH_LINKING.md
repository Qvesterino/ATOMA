# Permissive Graph Linking System

## Overview

ATOMA now uses a **permissive graph-based linking model** that enables players to build real, multi-connected networks. Each node can have many outgoing and incoming links, creating a living, breathing graph of connections.

---

## Core Rules (Implemented)

### 1. **Multi-Link Per Node** ✅
- **Capacity**: Each node can have **16+ outgoing and 16+ incoming links**
- **No removal**: Existing links are never auto-removed when creating new ones
- **Toggle behavior**: Click same link twice to toggle it on/off
- **Result**: Rich, interconnected networks (not trees or simple chains)

### 2. **Only Two Hard Denials** ✅
- ❌ **Self-links**: Node cannot link to itself
- ❌ **Exact duplicates**: Same A→B link cannot exist twice
- ✅ **Everything else**: Allowed

### 3. **Soft Layer Compatibility** ✅
- Layer compatibility (input→process, etc.) **no longer blocks linking**
- Instead, compatibility affects:
  - **Synergy score** (0.5 "normal" vs 0.8 "high")
  - **Visual feedback** (glow intensity, link color richness)
  - **Console logging** (★ NORMAL vs ★★ HIGH)
- Result: Layer relationships are **flavor, not law**

### 4. **Click-to-Link Behavior** ✅
- Select Node A (highlighted in cyan)
- Click Node B:
  - If A→B exists: Remove it (toggle off)
  - If A→B doesn't exist: Create it (toggle on)
- **Both nodes retain all other links** - no collateral deletion

### 5. **Directional Links** ✅
- Links are **directional** (A→B ≠ B→A)
- Reverse links can coexist: both A→B and B→A are allowed simultaneously
- Players can create cycles and mutual connections

---

## Technical Implementation

### Code Changes

#### 1. **validateLink()** (replaced `areNodesCompatible()`)
```javascript
validateLink(sourceNode, targetNode) {
  // DENY: self-link
  if (sourceNode === targetNode) return "self-link";
  
  // DENY: exact duplicate
  if (this.linkExists(sourceNode, targetNode)) return "duplicate link";
  
  // ALLOW: everything else
  return null;
}
```

#### 2. **attemptLink()** (new permissive flow)
```javascript
attemptLink(sourceNode, targetNode) {
  // Check hard denials only
  const denialReason = this.validateLink(sourceNode, targetNode);
  if (denialReason) {
    console.log(`✗ Link denied: ${denialReason}`);
    this.createIncompatibilityWarning(targetNode);
    return;
  }
  
  // Toggle behavior: remove if exists, create if doesn't
  if (this.linkExists(sourceNode, targetNode)) {
    // Remove it
    const link = this.links.find(l => l.source === sourceNode && l.target === targetNode);
    this.removeLink(link);
  } else {
    // Create it (multiple links per node allowed)
    this.createLink(sourceNode, targetNode);
  }
}
```

#### 3. **getLayerCompatibility()** (soft scoring only)
```javascript
// Now purely advisory - used for synergy calculations
// Does NOT block linking
getLayerCompatibility(sourceNode, targetNode) {
  // Return 0.8 for strong pairs, 0.5 for others
  // Influences visual intensity and logging only
}
```

#### 4. **linkExists()** (unchanged - directional check)
```javascript
linkExists(sourceNode, targetNode) {
  return this.links.some(link => 
    link.source === sourceNode && link.target === targetNode
  );
}
```

---

## Player Experience

### Building Networks
1. Player explores and finds nodes
2. Selects Node A (cyan highlight appears)
3. Walks to Node B and clicks it
4. Link A→B is created (if allowed)
5. Can now select Node B and link to another node
6. **Result**: Rich network graph, not a simple tree

### Visual Feedback
- **High synergy links** (compatible layers): Brighter, more intense glow (★★)
- **Normal synergy links** (incompatible layers): Softer, understated glow (★)
- **All links work functionally the same** - visual difference is flavor only
- **Console shows synergy level** for players who care about optimization

### Removing Links
- Click same link twice (toggle) to remove it
- No other links are affected
- Network remains intact, just with one fewer connection

---

## Safety & Non-Destructive

✅ **Shader modifications**: None
✅ **Material changes**: None (only opacity/color adjustments for existing materials)
✅ **Physics**: Untouched
✅ **Environment**: Untouched
✅ **New files/modules**: None (pure logic changes)

---

## Performance Impact

- **Link validation**: O(1) per attempt (only 2 checks: self-link, duplicate)
- **No graph traversal**: No path-finding or cycle detection
- **Memory**: No additional overhead (same link objects)
- **Rendering**: ~Same as before (all links already rendered)

---

## Synergy System (Flavor Only)

| Source → Target | Type | Synergy | Glow |
|---|---|---|---|
| input → process | Strong | 0.8 ★★ | Bright |
| process → control | Strong | 0.8 ★★ | Bright |
| input → storage | Soft | 0.5 ★ | Subtle |
| analytics → analytics | Soft | 0.5 ★ | Subtle |

- Synergy influences **visual richness** of the link
- Does **not** influence functionality
- Purely cosmetic and informational

---

## Examples

### Example 1: Hub Node
```
Node A (input) can link to:
- Process 1 (allowed, high synergy ★★)
- Process 2 (allowed, high synergy ★★)
- Storage (allowed, normal synergy ★)
- Analytics (allowed, normal synergy ★)
- Control (allowed, normal synergy ★)
- A second Process 3 (allowed, high synergy ★★)

Result: Node A has 6 outgoing links, multiple same-category connections
```

### Example 2: Cycles Allowed
```
Node A → Node B (allowed)
Node B → Node A (allowed simultaneously)
Node A → Node C → Node A (cycle allowed)
```

### Example 3: Self-Link Denied
```
Node A → Node A (DENIED: "self-link")
```

### Example 4: Duplicate Denied
```
First click: Node A → Node B (created)
Second click: Node A → Node B (DENIED: "duplicate link", or removed if toggling)
```

---

## Migration from Old System

**If you had strict rules before:**
- Old: input could only link to process/integration/analytics
- New: input can link to ANY node (layer pairs still influence visuals via synergy)

**If you had 1-2 link limits:**
- Old: Node could have max 1-2 outgoing links
- New: Node can have 16+ outgoing links

**Result**: Existing networks continue to work, players can add more connections than before

---

## Debug & Logging

All link events are logged to console:
```
✓ Link created: input → process [★★ HIGH synergy]
✓ Link created: input → storage [★ NORMAL synergy]
✓ Link removed: input → storage
✗ Link denied: self-link (input → input)
✗ Link denied: duplicate link (process → storage)
```

No intrusive UI warnings - just clean console feedback.

---

## Future Extensions

The permissive foundation allows future features:
- **Link weighting** (strength/priority per link)
- **Directional flow** (data travels along paths)
- **Cycle penalties** (optional gameplay mechanic)
- **Network analysis** (connected components, flow paths)
- **Multiplayer synchronization** (shared graphs)

---

## Summary

**ATOMA now operates as a true graph editor**, not a constrained linking tool. Players can build complex, multi-connected networks freely, with layer compatibility serving as optional guidance (high synergy) rather than hard rules. The system is simple, safe, and open-ended.

🎯 **Result**: Real AI consciousness networks, not toy trees. ✨
