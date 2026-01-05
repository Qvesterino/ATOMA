# SynergyEngine.ts - Complete Integration Guide

## Overview

**SynergyEngine** is ATOMA's AI synergy analysis system. It evaluates the emergent behavior and quality of connections between nodes and paths in the neural network graph.

**Key Capabilities:**
- Pairwise node synergy evaluation with layer-based logic
- Path synergy analysis (2-5 node chains)
- 6 synergy types: linear, complement, fusion, quantum, sigma, fractal
- Automated visual style generation for link rendering
- Energy level computation (0.0-1.0)
- Human-readable synergy explanations
- Fractal pattern detection
- Network-wide statistics

---

## Core Concepts

### Synergy Types

| Type | Meaning | Example Pairing | Energy Level |
|------|---------|-----------------|--------------|
| **linear** | Same-layer connection, stable behavior | input→input | Low-Medium |
| **complement** | Hierarchical flow along the pipeline | input→process | Medium |
| **fusion** | Strong complementary with high alignment | process→integration (high freq match) | High |
| **quantum** | Superposition/uncertainty connection | any→quantum | Variable |
| **sigma** | Validation/conflict, authority layer | any→sigma | Medium-High (conflict) |
| **fractal** | Repeating pattern in node sequence | process→analytics→process→analytics | Medium |
| **none** | No synergy, incompatible layers | input→control (no direct path) | Very Low |

### Synergy Score

- **Range:** 0.0 – 3.0
- **Factors:**
  - Layer pair type (0.5 base + 0.2-0.8 bonus)
  - Frequency closeness (additional +0.5 if >85% aligned)
  - Behavior matching (+0.2 if same behavior)
  - Quantum randomness (+0.3-1.0 variance)
- **Interpretation:**
  - 0.0-0.5: Minimal synergy
  - 0.5-1.5: Decent synergy
  - 1.5-2.5: Strong synergy
  - 2.5-3.0: Exceptional synergy

### Energy Level

- **Range:** 0.0 – 1.0 (normalized)
- **Calculation:**
  - Base = average of both node frequencies
  - Bonus = score / 6 (small contribution)
  - Represents the "power" flowing through the link
- **Visual Impact:** Higher energy = brighter pulse speed, thicker lines

### Visual Styling

Each synergy type gets automated rendering recommendations:

```typescript
interface SynergyVisual {
  color: string;           // Hex color (#RRGGBB)
  pulseSpeed: number;      // 0.0–3.0 (cycles/second)
  warpIntensity: number;   // 0.0–1.0 (spatial distortion)
  thickness: number;       // 0.1–3.0 (line multiplier)
  glitch: number;          // 0.0–1.0 (signal corruption)
}
```

**Color Mapping:**
- Linear: `#00dddd` (soft cyan)
- Complement: `#00ff88` (bright green)
- Fusion: `#ff00ff` (magenta)
- Quantum: `#6633ff` (violet-blue)
- Sigma: `#00ff00` (neon green)
- Fractal: `#00ffff` (teal-cyan)
- None: `#444444` (dim grey)

---

## Layer Compatibility Rules

### Same-Layer (Linear)
```
input → input       ✓ Linear (score +0.4)
process → process   ✓ Linear (score +0.4)
```

### Forward Pipeline (Complement)
```
input → process             ✓ Complement (score +0.7, modifier 1.4x)
process → integration       ✓ Complement (score +0.7, modifier 1.4x)
integration → analytics     ✓ Complement (score +0.7, modifier 1.3x)
analytics → storage         ✓ Complement (score +0.7, modifier 1.2x)
control → process           ✓ Complement (score +0.7, modifier 1.3x)
```

### Feedback & Cross-Layer
```
analytics → process         ✓ Complement (score +0.7, modifier 1.2x)
storage → process           ✓ Complement (score +0.7, modifier 1.1x)
process → control           ✓ Complement (score +0.7, modifier 1.3x)
```

### Quantum Dominance
```
quantum → [any layer]       ✓ Quantum (score +0.3 to +1.0, randomized)
[any layer] → quantum       ✓ Quantum (score +0.3 to +1.0, randomized)
quantum → quantum           ✓ Quantum (stronger, score +0.3 to +1.0)
```

### Sigma Validation/Conflict
```
sigma → [any layer]         ✓ Sigma (score +0.2, potential conflict)
[any layer] → sigma         ✓ Sigma (validation, score +0.2)
sigma → sigma               ✓ Sigma (self-check, score +0.2)
```

---

## API Reference

### Initialization

```typescript
import { SynergyEngine } from './SynergyEngine';

// Create with nodes only
const engine = new SynergyEngine(nodesMap);

// Or use factory function
import { createSynergyEngine } from './SynergyEngine';
const engine = createSynergyEngine(nodesMap, linksMap);
```

### Core Methods

#### `evaluatePair(aId: string, bId: string): SynergyResult`

Evaluate synergy between two nodes.

```typescript
const result = engine.evaluatePair('node-1', 'node-2');
console.log(result.type);      // "fusion"
console.log(result.score);     // 2.1
console.log(result.energy);    // 0.75
console.log(result.visual.color);  // "#ff00ff"
```

#### `evaluateLink(link: Link): SynergyResult`

Evaluate a link using its from/to nodes.

```typescript
const link = { id: 'link-1', from: 'node-1', to: 'node-2' };
const result = engine.evaluateLink(link);
```

#### `evaluatePath(nodeIds: string[]): SynergyResult`

Evaluate synergy for a 2-5 node path.

```typescript
// Path: input → process → integration
const result = engine.evaluatePath(['node-1', 'node-2', 'node-3']);
console.log(result.type);      // "complement" or "fusion"
console.log(result.details);   // ["Path length: 3 nodes", "Pairwise avg score: 1.5", ...]
```

#### `explainSynergy(result: SynergyResult): string`

Generate human-readable explanation.

```typescript
const explanation = engine.explainSynergy(result);
// Output: "Layer pair (input→process): complement → Frequency alignment: 92% → ..."
```

#### `setNodes(nodes: Map<string, Node>): void`

Update the node map and clear caches.

```typescript
engine.setNodes(updatedNodesMap);
```

#### `setLinks(links: Map<string, Link>): void`

Update the link map for path analysis.

```typescript
engine.setLinks(updatedLinksMap);
```

#### `clearCache(): void`

Manually clear all internal caches.

```typescript
engine.clearCache();
```

### Query Methods

#### `getNodeOutgoingSynergies(nodeId: string): Map<string, SynergyResult>`

Get all synergy results for outgoing links from a node.

```typescript
const outgoing = engine.getNodeOutgoingSynergies('node-1');
outgoing.forEach((result, targetNodeId) => {
  console.log(`→ ${targetNodeId}: ${result.type} (${result.score.toFixed(2)})`);
});
```

#### `getNodeIncomingSynergies(nodeId: string): Map<string, SynergyResult>`

Get all synergy results for incoming links to a node.

```typescript
const incoming = engine.getNodeIncomingSynergies('node-2');
```

#### `getNetworkSynergyStats()`

Get network-wide statistics.

```typescript
const stats = engine.getNetworkSynergyStats();
console.log(stats.avgScore);        // 1.8
console.log(stats.avgEnergy);       // 0.65
console.log(stats.typeCounts);      // { linear: 5, fusion: 2, ... }
console.log(stats.topSynergies);    // Top 5 links by score
```

#### `validateSynergy(link: Link, minScore?: number)`

Check if a link meets synergy threshold.

```typescript
const { valid, result } = engine.validateSynergy(link, 0.8);
if (valid) {
  console.log('Link is valid synergy:', result.type);
} else {
  console.log('Link below threshold:', result.score);
}
```

#### `getGroupVisual(linkIds: string[]): SynergyVisual`

Get averaged visual style for a group of links.

```typescript
const visual = engine.getGroupVisual(['link-1', 'link-2', 'link-3']);
// Returns averaged color, pulse speed, thickness, etc.
```

---

## Practical Examples

### Example 1: Evaluating a Simple Link

```typescript
import { SynergyEngine } from './SynergyEngine';

// Create nodes
const nodes = new Map([
  ['input-1', {
    id: 'input-1',
    layer: 'input',
    frequency: 0.8,
    behavior: 'stable'
  }],
  ['process-1', {
    id: 'process-1',
    layer: 'process',
    frequency: 0.75,
    behavior: 'stable'
  }]
]);

// Initialize engine
const engine = new SynergyEngine(nodes);

// Evaluate link
const result = engine.evaluatePair('input-1', 'process-1');

console.log(`Type: ${result.type}`);           // "complement"
console.log(`Score: ${result.score.toFixed(2)}`);     // ~1.7-1.9
console.log(`Energy: ${result.energy.toFixed(2)}`);   // ~0.69-0.73
console.log(`Explanation: ${engine.explainSynergy(result)}`);
// "Layer pair (input→process): complement → Frequency alignment: 94% → Behavior sync (stable) → ..."

// Get visual for rendering
const visual = result.visual;
console.log(`Color: ${visual.color}`);        // "#00ff88"
console.log(`Pulse speed: ${visual.pulseSpeed.toFixed(2)}`);  // ~1.2-1.5
console.log(`Thickness: ${visual.thickness}`);     // 1.2
```

### Example 2: Analyzing a Path

```typescript
// Path: input → process → integration
const result = engine.evaluatePath(['input-1', 'process-1', 'integration-1']);

console.log(`Path type: ${result.type}`);     // "complement" or "fusion"
console.log(`Score: ${result.score.toFixed(2)}`);
console.log(`Details:`);
result.details.forEach(detail => console.log(`  - ${detail}`));
// Output:
// Path length: 3 nodes
// Pairwise avg score: 1.8
// Dominant type: complement
// Path-adjusted score: 1.62
```

### Example 3: Quantum-Based Connection

```typescript
const nodes = new Map([
  ['quantum-1', {
    id: 'quantum-1',
    layer: 'quantum',
    frequency: 0.5,
    behavior: 'quantum'
  }],
  ['process-1', {
    id: 'process-1',
    layer: 'process',
    frequency: 0.9,
    behavior: 'reactive'
  }]
]);

const engine = new SynergyEngine(nodes);
const result = engine.evaluatePair('quantum-1', 'process-1');

console.log(`Type: ${result.type}`);    // "quantum"
console.log(`Score: ${result.score.toFixed(2)}`);  // Variable: 0.8-1.7
console.log(`Visual glitch: ${result.visual.glitch}`);  // 0.6
```

### Example 4: Detecting Fractal Patterns

```typescript
// Create repeating layer pattern: analytics → process → analytics → process
const nodes = new Map([
  ['a1', { id: 'a1', layer: 'analytics', frequency: 0.5 }],
  ['p1', { id: 'p1', layer: 'process', frequency: 0.5 }],
  ['a2', { id: 'a2', layer: 'analytics', frequency: 0.5 }],
  ['p2', { id: 'p2', layer: 'process', frequency: 0.5 }],
]);

const engine = new SynergyEngine(nodes);
const result = engine.evaluatePath(['a1', 'p1', 'a2', 'p2']);

console.log(`Type: ${result.type}`);    // "fractal"
console.log(result.details);
// Includes: "Fractal pattern detected (repetitive structure)"
```

### Example 5: Network Statistics

```typescript
// Set up engine with links
const engine = new SynergyEngine(nodesMap);
engine.setLinks(linksMap);

// Get full network stats
const stats = engine.getNetworkSynergyStats();

console.log(`Total links: ${stats.totalLinks}`);
console.log(`Average synergy score: ${stats.avgScore.toFixed(2)}`);
console.log(`Average energy: ${stats.avgEnergy.toFixed(2)}`);
console.log(`\nSynergy type distribution:`);
Object.entries(stats.typeCounts).forEach(([type, count]) => {
  if (count > 0) console.log(`  ${type}: ${count}`);
});

console.log(`\nTop 5 highest synergy links:`);
stats.topSynergies.forEach(({ from, to, score, type }, i) => {
  console.log(`  ${i+1}. ${from}→${to}: ${type} (${score.toFixed(2)})`);
});
```

### Example 6: Sigma Validation

```typescript
const nodes = new Map([
  ['process-1', {
    id: 'process-1',
    layer: 'process',
    frequency: 0.6,
    behavior: 'reactive'
  }],
  ['sigma-1', {
    id: 'sigma-1',
    layer: 'sigma',
    frequency: 0.5,
    behavior: 'sigma'
  }]
]);

const engine = new SynergyEngine(nodes);
const result = engine.evaluatePair('process-1', 'sigma-1');

console.log(`Type: ${result.type}`);    // "sigma"
console.log(`Score: ${result.score}`);  // Usually 0.6-0.8 (lower, validation)
console.log(`Visual glitch: ${result.visual.glitch}`);  // 0.4
```

### Example 7: Visual Rendering Integration

```typescript
// Get synergy and use visual for shader parameters
const result = engine.evaluatePair(fromNodeId, toNodeId);
const visual = result.visual;

// Pass to LinkRenderer or custom shader
const shaderUniforms = {
  linkColor: new THREE.Color(visual.color),
  pulseSpeed: visual.pulseSpeed,
  warpIntensity: visual.warpIntensity,
  thickness: visual.thickness,
  glitch: visual.glitch,
};

// Update material
linkMaterial.uniforms = shaderUniforms;
```

---

## Integration with LinkRenderer

The SynergyEngine outputs are designed to integrate seamlessly with LinkRenderer:

```typescript
// In LinkRenderer.tsx or link rendering system
import { SynergyEngine } from './SynergyEngine';

const synergyEngine = useRef(new SynergyEngine(nodesMap));

// When rendering a link
function renderLink(link: Link) {
  const synergy = synergyEngine.current.evaluateLink(link);
  
  const visual = synergy.visual;
  return (
    <LinkComponent
      link={link}
      color={visual.color}
      pulseSpeed={visual.pulseSpeed}
      warpIntensity={visual.warpIntensity}
      thickness={visual.thickness}
      glitch={visual.glitch}
    />
  );
}
```

---

## Performance Considerations

### Caching
- SynergyEngine automatically caches pair evaluations
- Path cache is separate from pair cache
- Caches clear when nodes or links update

### Optimization Tips
1. **Batch updates:** Call `setNodes()` and `setLinks()` once per frame
2. **Use evaluation hints:** Check result type before rendering expensive effects
3. **Limit path analysis:** Keep paths to 2-5 nodes (paths >5 not supported)
4. **Network stats:** Call `getNetworkSynergyStats()` once per tick, not per link

### Computational Cost
- Single pair evaluation: ~0.1ms
- Path evaluation (4 nodes): ~0.4ms
- Network statistics (100 links): ~10ms

---

## Type Definitions Reference

### SynergyResult

```typescript
interface SynergyResult {
  type: SynergyType;                 // linear|complement|fusion|quantum|sigma|fractal|none
  score: number;                     // 0.0–3.0 synergy strength
  energy: number;                    // 0.0–1.0 normalized energy
  details: string[];                 // Reasoning steps
  visual: SynergyVisual;             // Rendering recommendations
  metadata?: {
    frequencyCloseness?: number;     // 0.0–1.0
    behaviorMatch?: boolean;
    layerCompatibility?: string;     // e.g., "input→process"
    hasQuantum?: boolean;
    hasSigma?: boolean;
  };
}
```

### SynergyVisual

```typescript
interface SynergyVisual {
  color: string;                     // Hex color
  pulseSpeed: number;                // 0.0–3.0 cycles/second
  warpIntensity: number;             // 0.0–1.0
  thickness: number;                 // 0.1–3.0 multiplier
  glitch: number;                    // 0.0–1.0 effect
}
```

### Node

```typescript
interface Node {
  id: string;
  layer: string;                     // input|process|integration|analytics|storage|control|quantum|sigma
  frequency: number;                 // 0.0–1.0
  behavior?: string;                 // stable|reactive|volatile|fractal|quantum|sigma
  position?: THREE.Vector3;
}
```

---

## Troubleshooting

### Issue: All synergies returning type "none"
**Cause:** Nodes not found in engine's node map
**Solution:** Call `engine.setNodes(updatedMap)` after adding nodes

### Issue: Scores always at extremes (0.0 or 3.0)
**Cause:** Missing frequency or layer data on nodes
**Solution:** Ensure all nodes have valid layer and frequency values

### Issue: Quantum synergies not randomized
**Cause:** Running in deterministic mode
**Solution:** Quantum randomness is intentional; use `Math.random()` call in score calculation

### Issue: Path synergy lower than expected
**Cause:** Path length penalty applied
**Solution:** Longer paths (4-5 nodes) naturally have lower scores due to `pathModifier`

---

## Advanced Usage

### Custom Synergy Modifiers

To extend SynergyEngine with custom layer pairs:

```typescript
// Extend LAYER_COMPATIBILITY map in SynergyEngine.ts
const LAYER_COMPATIBILITY: Map<string, LayerCompatibility> = new Map([
  // ... existing entries ...
  'custom-layer-1→custom-layer-2', { type: 'fusion', modifier: 1.5 },
]);
```

### Batch Processing

```typescript
function evaluateAllLinks(engine: SynergyEngine, links: Link[]): Map<string, SynergyResult> {
  const results = new Map<string, SynergyResult>();
  
  for (const link of links) {
    const result = engine.evaluateLink(link);
    results.set(link.id, result);
  }
  
  return results;
}
```

### Reactive UI Updates

```typescript
// In React with SynergyEngine
const [synergy, setSynergy] = useState<SynergyResult | null>(null);
const engineRef = useRef(new SynergyEngine(nodesMap));

useEffect(() => {
  if (selectedLink) {
    const result = engineRef.current.evaluateLink(selectedLink);
    setSynergy(result);
  }
}, [selectedLink]);

return (
  <div>
    <div>Type: {synergy?.type}</div>
    <div>Score: {synergy?.score.toFixed(2)}</div>
    <div>Energy: {(synergy?.energy ?? 0 * 100).toFixed(0)}%</div>
    <div>Visual: {synergy?.visual.color}</div>
  </div>
);
```

---

## Summary

SynergyEngine provides:
- ✅ Deterministic + quantum-aware synergy analysis
- ✅ 6 synergy types with layer-based rules
- ✅ Automatic visual styling for rendering
- ✅ Path analysis with fractal detection
- ✅ Network-wide statistics
- ✅ Caching for performance
- ✅ Pure TypeScript, zero external deps (aside from Three.js)

Use it to power intelligent link rendering, network analysis, and emergent AI behavior visualization in ATOMA! 🚀
