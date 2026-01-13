# AutoConnectEngine - Quick Reference

Fast lookup for AutoConnectEngine API and usage.

---

## Quick Start

```typescript
import { AutoConnectEngine } from './AutoConnectEngine';

// Create engine
const engine = new AutoConnectEngine(nodes, existingLinks, {
  auto: false,              // Suggestion mode
  synergyThreshold: 1.2,
  suggestThreshold: 0.8,
  distanceThreshold: 10.0
});

// Analyze
const result = engine.applyAutoConnect();

// Process results
result.created.forEach(link => console.log('Created:', link));
result.suggested.forEach(s => console.log('Suggested:', s));
result.ignored.forEach(r => console.log('Rejected:', r));
```

---

## Configuration Presets

### Conservative (Few Connections)
```typescript
{
  synergyThreshold: 1.5,
  suggestThreshold: 1.0,
  maxConnections: 2,
  frequencyTolerance: 0.1
}
```

### Balanced (Default)
```typescript
{
  synergyThreshold: 1.2,
  suggestThreshold: 0.8,
  maxConnections: 3,
  frequencyTolerance: 0.15
}
```

### Aggressive (Many Connections)
```typescript
{
  synergyThreshold: 0.8,
  suggestThreshold: 0.5,
  maxConnections: 5,
  frequencyTolerance: 0.25
}
```

### Quantum Network (With Randomization)
```typescript
{
  allowQuantumRandom: true,
  synergyThreshold: 1.0,
  maxConnections: 4,
  auto: false
}
```

---

## API Methods

### Analysis

| Method | Returns | Purpose |
|--------|---------|---------|
| `applyAutoConnect()` | `AutoConnectResult` | Analyze full graph |
| `analyzePair(a, b)` | `AnalysisResult` | Analyze two nodes |
| `getStatistics()` | `Statistics` | Network stats |

### Suggestions

| Method | Returns | Purpose |
|--------|---------|---------|
| `getSuggestedLinks()` | `ConnectionSuggestion[]` | Get suggestions |
| `acceptSuggestion(a, b)` | `Link \| null` | Accept suggestion |
| `rejectSuggestion(a, b)` | `boolean` | Reject suggestion |

### Data Management

| Method | Returns | Purpose |
|--------|---------|---------|
| `addNode(node)` | `void` | Add node |
| `removeNode(id)` | `void` | Remove node |
| `updateExistingLinks(links)` | `void` | Update links |
| `getCreatedLinks()` | `Link[]` | Get created links |
| `getRejectedConnections()` | `RejectedConnection[]` | Get rejections |

### Utility

| Method | Returns | Purpose |
|--------|---------|---------|
| `exportState()` | `State` | Export current state |
| `clear()` | `void` | Clear results |
| `reset()` | `void` | Reset engine |
| `getLayerCompatibilityMatrix()` | `Record<string, string[]>` | Get compatibility |

---

## Node Structure

```typescript
interface AutoConnectNode {
  id: string;              // Unique ID
  layer: string;           // input|process|integration|analytics|storage|control|quantum|sigma
  frequency: number;       // 0.0 - 1.0
  position: Vector3;       // 3D position
  priority?: number;       // 0.0 - 1.0 (optional)
}
```

---

## Result Structures

### AutoConnectResult

```typescript
{
  created: Link[],                    // Created links
  suggested: ConnectionSuggestion[],  // Suggested links
  ignored: RejectedConnection[],      // Rejected connections
  stats: {
    totalEvaluated: number,
    created: number,
    suggested: number,
    ignored: number,
    avgSynergyScore: number
  }
}
```

### ConnectionSuggestion

```typescript
{
  from: string,              // Source node ID
  to: string,                // Target node ID
  synergyScore: number,      // 0.0 - 3.0+
  reasons: string[]          // Why this suggestion
}
```

### RejectedConnection

```typescript
{
  from: string,
  to: string,
  reason: string,            // Why rejected
  synergyScore?: number
}
```

---

## Layer Compatibility

### Default Matrix

```
input      → process
process    → integration, control, quantum
integration → analytics, quantum
analytics  → storage, control, quantum
storage    → control, quantum
control    → process, integration
quantum    → any
sigma      → any
```

---

## Synergy Scoring

### Formula

```
Base: 1.0
+ Compatible layers: 1.0
+ Close frequencies: 0.5
+ Quantum: 0.0-1.0 (random)
- Sigma: -0.5
+ Layer pair modifiers: 0.2-0.4
+ Priority alignment: 0.3
```

### Score Ranges

```
< 0.8  → Ignored
0.8-1.2 → Suggested
≥ 1.2  → Created (auto mode) or Suggested (suggestion mode)
```

---

## Common Patterns

### Pattern 1: Auto-Create Mode

```typescript
const engine = new AutoConnectEngine(nodes, links, {
  auto: true,
  synergyThreshold: 1.2
});

const result = engine.applyAutoConnect();
console.log(`Created ${result.created.length} links`);
```

### Pattern 2: Suggestion Workflow

```typescript
const result = engine.applyAutoConnect();

for (const suggestion of result.suggested) {
  if (userApproves(suggestion)) {
    engine.acceptSuggestion(suggestion.from, suggestion.to);
  }
}

const final = engine.getCreatedLinks();
```

### Pattern 3: Pair Analysis

```typescript
const analysis = engine.analyzePair('node_1', 'node_2');

console.log(`
  Score: ${analysis.score}
  Compatible: ${analysis.compatible}
  Valid: ${analysis.valid}
  Reasons: ${analysis.reasons.join(', ')}
`);
```

### Pattern 4: Dynamic Updates

```typescript
// Add new node
engine.addNode(newNode);

// Update links
engine.updateExistingLinks(currentLinks);

// Reanalyze
const result = engine.applyAutoConnect();
```

### Pattern 5: Reporting

```typescript
import { generateConnectionReport } from './AutoConnectEngine';

const result = engine.applyAutoConnect();
console.log(generateConnectionReport(result));
```

---

## Configuration Reference

| Option | Type | Default | Purpose |
|--------|------|---------|---------|
| `auto` | bool | `false` | Auto-create or suggest |
| `maxConnections` | num | `3` | Max outgoing per node |
| `distanceThreshold` | num | `10.0` | Search radius |
| `synergyThreshold` | num | `1.2` | Creation threshold |
| `suggestThreshold` | num | `0.8` | Suggestion threshold |
| `allowCircular` | bool | `false` | Allow cycles |
| `allowQuantumRandom` | bool | `true` | Use randomization |
| `frequencyTolerance` | num | `0.15` | Frequency tolerance |

---

## Debugging

### Check Pair Analysis

```typescript
const result = engine.analyzePair('node_1', 'node_2');
console.log(result);
```

### View Compatibility Matrix

```typescript
const matrix = engine.getLayerCompatibilityMatrix();
console.log(matrix);
```

### Get Statistics

```typescript
const stats = engine.getStatistics();
console.log({
  nodes: stats.totalNodes,
  links: stats.totalExistingLinks,
  avg: stats.avgNodeConnections,
  layers: stats.layerDistribution
});
```

### Generate Report

```typescript
import { generateConnectionReport } from './AutoConnectEngine';

const result = engine.applyAutoConnect();
console.log(generateConnectionReport(result));
```

---

## Utility Functions

```typescript
// Distance between nodes
computeDistance(nodeA, nodeB): number

// Check if link exists
linkExists(from, to, links): boolean

// Detect cycles
wouldCreateCycle(from, to, links): boolean

// Get nearby nodes
getNeighbors(node, allNodes, maxDist): AutoConnectNode[]

// Create link
makeLink(from, to): Link
```

---

## Performance Tips

- Set appropriate `distanceThreshold` to limit search area
- Use `maxConnections` to prevent over-connection
- Call `applyAutoConnect()` once per update cycle
- Use `auto: true` to skip UI overhead
- Consider `allowQuantumRandom: false` for deterministic results

---

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| Too many suggestions | Raise `suggestThreshold` |
| Too few connections | Lower `synergyThreshold` |
| Cycles appearing | Set `allowCircular: false` |
| Over-connection | Lower `maxConnections` |
| Unpredictable results | Set `allowQuantumRandom: false` |
| Wrong layers connecting | Check `layerCompatibilityMap` |
| High average synergy? | Network is well-optimized |
| Low average synergy? | Adjust threshold or check frequencies |

---

## Types

```typescript
type LayerType = 'input' | 'process' | 'integration' | 
                 'analytics' | 'storage' | 'control' | 
                 'quantum' | 'sigma'

interface AutoConnectResult { created, suggested, ignored, stats }
interface ConnectionSuggestion { from, to, synergyScore, reasons }
interface RejectedConnection { from, to, reason, synergyScore }
interface AutoConnectNode { id, layer, frequency, position, priority }
```

---

## Export/Import

```typescript
// Export state
const state = engine.exportState();

// Save
JSON.stringify(state);

// Load
engine.updateExistingLinks(state.created);
// Reapply analysis
```

---

**Quick Reference for AutoConnectEngine**  
**Production Ready** ✅
