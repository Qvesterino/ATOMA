# Node Hierarchy System v1.0 — Quick Reference

## Console API (window.hierarchyDebug)

### Query Hierarchy
```javascript
hierarchyDebug.getHierarchy()              // Full tree
hierarchyDebug.getParent('node-id')       // Parent ID
hierarchyDebug.getChildren('node-id')     // Direct children
hierarchyDebug.getDescendants('node-id')  // All descendants
hierarchyDebug.getAncestors('node-id')    // All ancestors
```

### Properties
```javascript
hierarchyDebug.setProperty('node-id', 'corruption', 0.8)
hierarchyDebug.getProperty('node-id', 'corruption')
hierarchyDebug.getMetrics('node-id')      // Aggregated metrics
```

### Manipulation
```javascript
hierarchyDebug.setParent('child', 'parent')
hierarchyDebug.detach('node-id')
```

### Visualization
```javascript
hierarchyDebug.toggleVisualization(true)
hierarchyDebug.getStats()
```

## Key Features

**Parent-Child Relationships**
- Nodes can have one parent and multiple children
- Depth-limited (max 16 levels)
- Cycle-proof (prevents A→B→A)

**Property Cascading**
- Corruption, Harmony, Stress, Stability cascade to children
- Stability reduces by 5% per level (0.95× multiplier)
- Other properties pass at 1.0× multiplier

**Metrics Aggregation**
- Node count, averaged corruption/harmony/stress
- Multiplied stability across subtree
- Lazy-calculated and cached

**Visualization**
- Cyan lines connecting parent→children
- Depth-based colors: green→cyan→blue→purple→magenta
- Yellow ancestor trails
- Automatic position tracking

## Auto-Hierarchy on Link

When enabled (default):
1. Link created: source → target
2. Hierarchy: target becomes child of source
3. Visual: cyan line drawn from source to target
4. Cascade: target inherits source's properties

```javascript
// Disable if needed
hierarchyBridge.config.autoHierarchyOnLink = false;
```

## Performance

| Operation | Time |
|-----------|------|
| Create node | <0.1ms |
| Reparent | <0.5ms |
| Cascade property | <0.3ms |
| Update visuals | <0.3ms |
| **Total/frame** | **<1.2ms** |

## Visual Configuration

```javascript
hierarchyBridge.visuals.config = {
  lineThickness: 0.08,
  lineOpacity: 0.6,
  maxVisualizationDistance: 100,
  animationSpeed: 0.15
};
```

## Statistics

```javascript
window.hierarchyDebug.getStats()
// {
//   hierarchiesCreated: 0,
//   nodesReparented: 0,
//   lineUpdates: 0,
//   propertyCascades: 0
// }
```

## Common Tasks

**Make node A parent of node B:**
```javascript
hierarchyDebug.setParent('B', 'A');
```

**Get all nodes affected by corruption at A:**
```javascript
const descendants = hierarchyDebug.getDescendants('A');
const metrics = hierarchyDebug.getMetrics('A');
console.log(`${metrics.nodeCount} nodes, avg corruption: ${metrics.corruption}`);
```

**Detach node from parent:**
```javascript
hierarchyDebug.detach('node-id');
```

**Show full hierarchy tree:**
```javascript
console.log(JSON.stringify(hierarchyDebug.getHierarchy(), null, 2));
```

**Disable hierarchy visualization:**
```javascript
hierarchyDebug.toggleVisualization(false);
```

## Events (in code)

```javascript
// Listen for hierarchy changes
nodeHierarchySystem.onHierarchyChanged.push((event) => {
  console.log(`${event.nodeId}: ${event.changeType}`);
});

// Listen for reparenting
nodeHierarchySystem.onReparented.push((event) => {
  console.log(`${event.nodeId} moved: ${event.oldParent} → ${event.newParent}`);
});

// Listen for property inheritance
nodeHierarchySystem.onPropertyInherited.push((event) => {
  console.log(`${event.nodeId} inherited ${event.property}: ${event.value}`);
});
```
