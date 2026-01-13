# AutoConnectEngine - Complete Guide

Intelligent automatic connection system for ATOMA node networks.

---

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Core Concepts](#core-concepts)
4. [Configuration](#configuration)
5. [Synergy Scoring](#synergy-scoring)
6. [Layer Compatibility](#layer-compatibility)
7. [API Reference](#api-reference)
8. [Examples](#examples)
9. [Best Practices](#best-practices)

---

## Overview

### Purpose

The **AutoConnectEngine** analyzes node networks and automatically suggests or creates intelligent connections based on:

- **Distance Proximity** - Nearest neighbors
- **Layer Compatibility** - Valid layer transitions
- **Frequency Synergy** - Harmonic alignment
- **Node Priorities** - Importance weighting
- **Special Rules** - Quantum & Sigma handling
- **Network Topology** - Cycle prevention

### Key Features

- ✅ Deterministic analysis (except quantum randomization)
- ✅ Duplicate prevention
- ✅ Circular loop detection
- ✅ Suggested vs auto-create modes
- ✅ Detailed rejection reasons
- ✅ Network statistics
- ✅ Pair-wise analysis
- ✅ Batch reporting

---

## Quick Start

### Basic Setup

```typescript
import { AutoConnectEngine } from './AutoConnectEngine';
import * as THREE from 'three';

// Create nodes
const nodes = new Map([
  ['node_1', {
    id: 'node_1',
    layer: 'input',
    frequency: 0.5,
    position: new THREE.Vector3(0, 0, 0)
  }],
  ['node_2', {
    id: 'node_2',
    layer: 'process',
    frequency: 0.6,
    position: new THREE.Vector3(3, 0, 0)
  }]
]);

// Initialize engine
const engine = new AutoConnectEngine(nodes, [], {
  auto: false,
  synergyThreshold: 1.2
});

// Analyze
const result = engine.applyAutoConnect();

console.log(result);
// {
//   created: [],
//   suggested: [{ from: 'node_1', to: 'node_2', synergyScore: 1.8, ... }],
//   ignored: [],
//   stats: { ... }
// }
```

### Auto-Create Mode

```typescript
// Automatically create all high-synergy links
const engine = new AutoConnectEngine(nodes, [], {
  auto: true,
  synergyThreshold: 1.2
});

const result = engine.applyAutoConnect();
console.log('Created links:', result.created);
```

### Suggested Mode

```typescript
// Suggest links for user review
const engine = new AutoConnectEngine(nodes, [], {
  auto: false,
  synergyThreshold: 1.5,
  suggestThreshold: 0.8
});

const result = engine.applyAutoConnect();

// User accepts suggestions
result.suggested.forEach(suggestion => {
  engine.acceptSuggestion(suggestion.from, suggestion.to);
});

const finalLinks = engine.getCreatedLinks();
```

---

## Core Concepts

### AutoConnectNode Structure

Each node requires:

```typescript
interface AutoConnectNode {
  id: string;                 // Unique identifier
  layer: string;              // input|process|integration|analytics|storage|control|quantum|sigma
  frequency: number;          // 0.0 - 1.0 (wave frequency or priority)
  position: THREE.Vector3;    // 3D position for distance calculation
  priority?: number;          // 0.0 - 1.0 (optional, affects synergy)
}
```

### AutoConnectResult Structure

Result of analysis:

```typescript
interface AutoConnectResult {
  created: Link[];                    // Links that were created
  suggested: ConnectionSuggestion[];  // Links for user review
  ignored: RejectedConnection[];      // Connections rejected with reasons
  stats: {
    totalEvaluated: number;
    created: number;
    suggested: number;
    ignored: number;
    avgSynergyScore: number;
  };
}
```

---

## Configuration

### Default Configuration

```typescript
{
  auto: false,                    // Suggested mode (not auto-create)
  maxConnections: 3,              // Max outgoing links per node
  distanceThreshold: 10.0,        // Max distance for consideration
  synergyThreshold: 1.2,          // Min synergy for creation
  suggestThreshold: 0.8,          // Min synergy for suggestion
  allowCircular: false,           // Prevent cycles
  allowQuantumRandom: true,       // Use quantum randomization
  layerCompatibilityMap: {...},   // Custom compatibility rules
  frequencyTolerance: 0.15        // Frequency difference tolerance
}
```

### Custom Configuration

```typescript
const engine = new AutoConnectEngine(nodes, links, {
  auto: true,                         // Auto-create valid links
  maxConnections: 5,                  // More lenient
  distanceThreshold: 15.0,            // Larger radius
  synergyThreshold: 1.0,              // Lower threshold
  allowCircular: true,                // Allow cycles
  frequencyTolerance: 0.2,            // More tolerance
  layerCompatibilityMap: {
    // Custom compatibility rules
    input: new Set(['process', 'control']),
    process: new Set(['integration', 'storage'])
  }
});
```

---

## Synergy Scoring

### Scoring Formula

The synergy score combines multiple factors:

```
Score = 1.0 (base)
      + 1.0 (if compatible layers)
      + 0.5 (if frequencies close)
      + 0.0-1.0 (if quantum involved, random)
      - 0.5 (if sigma involved)
      + 0.2-0.4 (layer pair modifiers)
      + 0.3 (priority alignment)
```

### Example Scoring

```typescript
// Nodes: input (freq 0.5) → process (freq 0.6)
Score = 1.0       // base
      + 1.0       // compatible layers (input→process)
      + 0.5       // close frequencies (diff = 0.1)
      + 0.0       // no quantum/sigma
      + 0.0       // no special modifiers
      + 0.29      // priority alignment
      = 2.79      // High synergy!

// Nodes: storage (freq 0.3) → analytics (freq 0.9)
Score = 1.0       // base
      + 1.0       // compatible layers
      + 0.0       // far frequencies (diff = 0.6)
      + 0.0       // no quantum/sigma
      + 0.3       // storage→analytics modifier
      + 0.0       // priority mismatch
      = 2.30      // Still good
```

### Thresholds

```typescript
// Auto-create if score >= synergyThreshold (default 1.2)
if (score >= 1.2) {
  // Create link immediately
}

// Suggest if 0.8 <= score < 1.2
if (score >= 0.8 && score < 1.2) {
  // Add to suggestions for user review
}

// Ignore if score < 0.8
if (score < 0.8) {
  // Reject, add to ignored list
}
```

---

## Layer Compatibility

### Default Compatibility Matrix

```
input      → process
process    → integration, control, quantum
integration → analytics, quantum
analytics  → storage, control, quantum
storage    → control, quantum
control    → process, integration
quantum    → any (wildcard)
sigma      → any (wildcard)
```

### Compatibility Rules

1. **input** - Data sources only connect to process nodes
2. **process** - Processing logic connects to integration or control
3. **integration** - Integration logic connects to analytics
4. **analytics** - Analysis results go to storage
5. **storage** - Storage connects to control systems
6. **control** - Control nodes influence process/integration
7. **quantum** - Unstable; connects to anything (probabilistic)
8. **sigma** - System validation; connects to anything (strict)

### Custom Compatibility

```typescript
const customMap = {
  input: new Set(['process', 'quantum']),
  process: new Set(['integration', 'storage']),
  // ... etc
};

const engine = new AutoConnectEngine(nodes, links, {
  layerCompatibilityMap: customMap
});
```

---

## API Reference

### Main Methods

#### `applyAutoConnect(): AutoConnectResult`

Analyze entire graph and generate results.

```typescript
const result = engine.applyAutoConnect();

// result.created - links that were created
// result.suggested - links for review
// result.ignored - rejected connections with reasons
// result.stats - statistics
```

#### `getSuggestedLinks(): ConnectionSuggestion[]`

Get all suggested links.

```typescript
const suggestions = engine.getSuggestedLinks();

suggestions.forEach(s => {
  console.log(`${s.from} → ${s.to} (score: ${s.synergyScore})`);
  console.log(`Reasons: ${s.reasons.join(', ')}`);
});
```

#### `getCreatedLinks(): Link[]`

Get all links created by engine.

```typescript
const created = engine.getCreatedLinks();
```

#### `acceptSuggestion(from: string, to: string): Link | null`

Accept a suggested link.

```typescript
const link = engine.acceptSuggestion('node_1', 'node_2');
if (link) {
  console.log('Link accepted:', link);
}
```

#### `rejectSuggestion(from: string, to: string): boolean`

Reject a suggested link.

```typescript
const rejected = engine.rejectSuggestion('node_1', 'node_2');
if (rejected) {
  console.log('Suggestion rejected');
}
```

#### `analyzePair(fromId: string, toId: string): AnalysisResult`

Analyze specific node pair.

```typescript
const analysis = engine.analyzePair('node_1', 'node_2');

console.log({
  score: analysis.score,
  compatible: analysis.compatible,
  valid: analysis.valid,
  reasons: analysis.reasons
});
```

#### `getStatistics(): Statistics`

Get network statistics.

```typescript
const stats = engine.getStatistics();

console.log({
  totalNodes: stats.totalNodes,
  avgNodeConnections: stats.avgNodeConnections,
  layerDistribution: stats.layerDistribution
});
```

### Node Management

#### `addNode(node: AutoConnectNode): void`

Add a node to the engine.

```typescript
engine.addNode({
  id: 'new_node',
  layer: 'process',
  frequency: 0.7,
  position: new THREE.Vector3(5, 0, 0)
});
```

#### `removeNode(nodeId: string): void`

Remove a node (also removes associated links).

```typescript
engine.removeNode('node_5');
```

#### `updateExistingLinks(links: Link[]): void`

Update the links the engine should consider.

```typescript
engine.updateExistingLinks(newLinks);
```

---

## Examples

### Example 1: Analyze Existing Network

```typescript
const existingNodes = new Map([
  ['n1', { id: 'n1', layer: 'input', frequency: 0.5, position: v(0, 0, 0) }],
  ['n2', { id: 'n2', layer: 'process', frequency: 0.6, position: v(3, 0, 0) }],
  ['n3', { id: 'n3', layer: 'analytics', frequency: 0.4, position: v(6, 0, 0) }]
]);

const existingLinks = [
  { id: 'l1', from: 'n1', to: 'n2' }
];

const engine = new AutoConnectEngine(existingNodes, existingLinks);
const result = engine.applyAutoConnect();

console.log(`
  Total nodes: ${result.stats.totalEvaluated}
  Created: ${result.created.length}
  Suggested: ${result.suggested.length}
  Rejected: ${result.ignored.length}
`);
```

### Example 2: Smart Suggestion Workflow

```typescript
// Get suggestions
const result = engine.applyAutoConnect();

// Filter high-quality suggestions
const highQuality = result.suggested.filter(s => s.synergyScore > 1.5);

// Apply top suggestions
highQuality.slice(0, 3).forEach(s => {
  engine.acceptSuggestion(s.from, s.to);
});

// Get final links
const finalLinks = engine.getCreatedLinks();
```

### Example 3: Quantum Network Analysis

```typescript
const nodes = new Map([
  ['quantum_node', {
    id: 'quantum_node',
    layer: 'quantum',
    frequency: Math.random(),  // Probabilistic
    position: v(0, 0, 0),
    priority: 0.8
  }],
  ['regular_node', {
    id: 'regular_node',
    layer: 'process',
    frequency: 0.5,
    position: v(3, 0, 0),
    priority: 0.6
  }]
]);

const engine = new AutoConnectEngine(nodes, [], {
  allowQuantumRandom: true
});

// Multiple runs show different results due to quantum randomization
for (let i = 0; i < 3; i++) {
  const result = engine.applyAutoConnect();
  console.log(`Run ${i + 1}: synergy = ${result.suggested[0]?.synergyScore}`);
}
```

### Example 4: Custom Layer Rules

```typescript
const customMap = {
  sensor: new Set(['processor']),
  processor: new Set(['aggregator', 'analyzer']),
  aggregator: new Set(['analyzer']),
  analyzer: new Set(['decision_maker']),
  decision_maker: new Set(['actuator'])
};

const engine = new AutoConnectEngine(nodes, [], {
  layerCompatibilityMap: customMap,
  synergyThreshold: 1.0
});

const result = engine.applyAutoConnect();
```

### Example 5: Batch Report

```typescript
import { generateConnectionReport } from './AutoConnectEngine';

const result = engine.applyAutoConnect();
const report = generateConnectionReport(result);

console.log(report);
// === AUTO-CONNECT REPORT ===
// Total Evaluated: 42
// Created: 8
// Suggested: 5
// Ignored: 29
// ...
```

---

## Best Practices

### 1. Start Conservative

```typescript
// High thresholds = fewer connections
const engine = new AutoConnectEngine(nodes, [], {
  synergyThreshold: 1.5,
  suggestThreshold: 1.0,
  maxConnections: 2
});
```

### 2. Review Suggestions First

```typescript
// Use suggestion mode for interactive control
const engine = new AutoConnectEngine(nodes, [], {
  auto: false,
  synergyThreshold: 1.5
});

const result = engine.applyAutoConnect();

// Review and accept manually
result.suggested.forEach(s => {
  if (shouldAccept(s)) {
    engine.acceptSuggestion(s.from, s.to);
  }
});
```

### 3. Monitor Synergy Scores

```typescript
// High average = good network
const stats = engine.getStatistics();
const result = engine.applyAutoConnect();

console.log(`Average synergy: ${result.stats.avgSynergyScore}`);

// Adjust thresholds if needed
if (result.stats.avgSynergyScore < 1.0) {
  console.warn('Network synergy low - consider adjusting thresholds');
}
```

### 4. Handle Quantum Carefully

```typescript
const engine = new AutoConnectEngine(nodes, [], {
  allowQuantumRandom: true,  // Enable randomization
  auto: false                // Review before committing
});

// Multiple runs to understand probability
const results = [];
for (let i = 0; i < 5; i++) {
  engine.clear();
  results.push(engine.applyAutoConnect());
}

// Analyze probability distribution
const suggestions = results.flatMap(r => r.suggested);
```

### 5. Validate Cycles

```typescript
const engine = new AutoConnectEngine(nodes, [], {
  allowCircular: false  // Prevent cycles
});

// Check for any cycles in existing graph
const existing = linkEngine.getLinks();
engine.updateExistingLinks(existing);

const result = engine.applyAutoConnect();
// All created links will be cycle-free
```

---

## Common Issues

### Issue: Too Many Suggestions

**Solution:** Raise `suggestThreshold`

```typescript
// Instead of
{ suggestThreshold: 0.8 }

// Use
{ suggestThreshold: 1.2 }
```

### Issue: Few/No Connections

**Solution:** Lower `synergyThreshold` and check layer compatibility

```typescript
{
  synergyThreshold: 1.0,
  frequencyTolerance: 0.25,  // More lenient
  distanceThreshold: 15.0    // Larger search area
}
```

### Issue: Unwanted Cycles

**Solution:** Ensure `allowCircular: false`

```typescript
{
  allowCircular: false
}
```

### Issue: Quantum Randomization Too Chaotic

**Solution:** Disable or set lower threshold

```typescript
{
  allowQuantumRandom: false,  // No randomization
  // OR
  synergyThreshold: 1.5      // Higher threshold
}
```

---

## Performance Considerations

### Time Complexity

- **Time:** O(n² × m) where n = nodes, m = evaluation per pair
- **Space:** O(n²) for distance calculations

### Optimization Tips

1. **Batch Analysis** - Call `applyAutoConnect()` once per update cycle
2. **Distance Precomputation** - Cache distances between nodes
3. **Layer Filtering** - Pre-filter incompatible pairs
4. **Limit Search Radius** - Set appropriate `distanceThreshold`

### Example Optimization

```typescript
const engine = new AutoConnectEngine(nodes, links, {
  distanceThreshold: 10.0,    // Limit search area
  maxConnections: 3,          // Fewer connections
  auto: true                  // No UI overhead
});

// Single call per frame
const result = engine.applyAutoConnect();
```

---

## Type Reference

```typescript
// Connection suggestion
interface ConnectionSuggestion {
  from: string;
  to: string;
  synergyScore: number;
  reasons: string[];
}

// Rejected connection
interface RejectedConnection {
  from: string;
  to: string;
  reason: string;
  synergyScore?: number;
}

// Layer types
type LayerType = 
  | 'input'
  | 'process'
  | 'integration'
  | 'analytics'
  | 'storage'
  | 'control'
  | 'quantum'
  | 'sigma';
```

---

## Summary

The **AutoConnectEngine** provides intelligent, configurable automatic connections for ATOMA networks:

- ✅ Distance-based analysis
- ✅ Layer compatibility checking
- ✅ Frequency synergy scoring
- ✅ Quantum & Sigma special handling
- ✅ Cycle prevention
- ✅ Suggested vs auto modes
- ✅ Detailed reporting

Perfect for building dynamic AI consciousness simulations!

---

**Version**: 1.0  
**Status**: Production Ready ✅
