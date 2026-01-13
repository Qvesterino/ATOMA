# SynergyEngine Quick Reference

## Initialization (30 seconds)

```typescript
import { SynergyEngine, createSynergyEngine } from './SynergyEngine';

// Method 1: Direct constructor
const engine = new SynergyEngine(nodesMap);

// Method 2: Factory with links
const engine = createSynergyEngine(nodesMap, linksMap);

// Update data
engine.setNodes(updatedNodesMap);
engine.setLinks(updatedLinksMap);
```

---

## Evaluation Methods (Quick API)

### Evaluate Pair
```typescript
const result = engine.evaluatePair('node-1', 'node-2');
// result.type: 'linear'|'complement'|'fusion'|'quantum'|'sigma'|'fractal'|'none'
// result.score: 0.0-3.0
// result.energy: 0.0-1.0
// result.visual: { color, pulseSpeed, warpIntensity, thickness, glitch }
// result.details: string[]
```

### Evaluate Link
```typescript
const link = { id: 'link-1', from: 'node-1', to: 'node-2' };
const result = engine.evaluateLink(link);
```

### Evaluate Path (2-5 nodes)
```typescript
const result = engine.evaluatePath(['node-1', 'node-2', 'node-3']);
// Combines pairwise synergies, detects fractals
```

### Explain Synergy
```typescript
const explanation = engine.explainSynergy(result);
// Returns: "Layer pair (input→process): complement → Frequency alignment: 92% → ..."
```

---

## Synergy Types at a Glance

| Type | Layer Example | Score Range | Visual |
|------|---------------|-------------|--------|
| **linear** | input→input | 0.4-0.9 | Cyan, slow pulse |
| **complement** | input→process | 0.7-2.0 | Green, medium pulse |
| **fusion** | high-match pairs | 1.5-2.5+ | Magenta, fast pulse |
| **quantum** | any→quantum | 0.3-1.7 (random) | Violet, erratic, high glitch |
| **sigma** | any→sigma | 0.2-1.0 | Neon green, slow, high warp |
| **fractal** | A→B→A→B pattern | 1.0-2.0 | Teal, layered pulse |
| **none** | incompatible | 0.0-0.5 | Grey, no effects |

---

## Visual Styling

Each synergy generates `SynergyVisual`:

```typescript
{
  color: string;              // "#00dddd" for linear, etc.
  pulseSpeed: number;         // 0.0-3.0
  warpIntensity: number;      // 0.0-1.0 spatial distortion
  thickness: number;          // 0.1-3.0 line thickness
  glitch: number;             // 0.0-1.0 signal corruption
}
```

**Usage in rendering:**
```typescript
const visual = result.visual;
shaderUniforms.linkColor = new THREE.Color(visual.color);
shaderUniforms.pulseSpeed = visual.pulseSpeed;
shaderUniforms.thickness = visual.thickness;
```

---

## Query Methods

```typescript
// Get all outgoing links' synergies
const outgoing = engine.getNodeOutgoingSynergies('node-id');
// Returns: Map<string, SynergyResult>

// Get all incoming links' synergies
const incoming = engine.getNodeIncomingSynergies('node-id');

// Validate link meets threshold
const { valid, result } = engine.validateSynergy(link, 0.8);

// Get network stats
const stats = engine.getNetworkSynergyStats();
// stats.avgScore, stats.avgEnergy, stats.typeCounts, stats.topSynergies

// Average visual for link group
const visual = engine.getGroupVisual(['link-1', 'link-2', 'link-3']);
```

---

## Node Requirements

For synergy evaluation, nodes need:

```typescript
interface Node {
  id: string;                 // Required
  layer: string;              // Required: input|process|integration|analytics|storage|control|quantum|sigma
  frequency: number;          // Required: 0.0-1.0
  behavior?: string;          // Optional: stable|reactive|volatile|fractal|quantum|sigma
}
```

**Example:**
```typescript
{
  id: 'input-1',
  layer: 'input',
  frequency: 0.8,
  behavior: 'stable'
}
```

---

## Score Breakdown

Base calculation:
```
baseScore = 0.5

+ layerBonus (layer pair):
  - linear: +0.4
  - complement: +0.7
  - quantum: +0.3 to +1.0 (randomized)
  - sigma: +0.2

+ frequencyBonus:
  - if difference < 0.15 (>85% aligned): +0.5
  - if difference < 0.3 (>70% aligned): +0.25

+ behaviorBonus:
  - if both same behavior: +0.2

+ modifierBonus:
  - from layer compatibility (0.0-0.5)

= FINAL SCORE (clamped 0.0-3.0)
```

---

## Energy Calculation

```typescript
energy = (nodeA.frequency + nodeB.frequency) / 2 + score / 6
// Clamped to 0.0-1.0
```

Higher energy = more visual intensity.

---

## Common Patterns

### Detect high-quality connections
```typescript
const result = engine.evaluatePair(a, b);
const isHighQuality = result.type !== 'none' && result.score > 1.5;
```

### Build network profile
```typescript
const stats = engine.getNetworkSynergyStats();
if (stats.avgScore > 2.0) console.log("Strong network");
if (stats.typeCounts.fusion > 5) console.log("Highly fused");
```

### Find best links
```typescript
const stats = engine.getNetworkSynergyStats();
stats.topSynergies.forEach(({ from, to, score, type }) => {
  console.log(`${from}→${to}: ${type} (${score.toFixed(2)})`);
});
```

### Monitor specific node
```typescript
const outgoing = engine.getNodeOutgoingSynergies('node-1');
outgoing.forEach((result, targetId) => {
  console.log(`${targetId}: ${result.type}, energy: ${result.energy}`);
});
```

---

## Layer Compatibility Quick Lookup

**Forward pipeline (high complement scores):**
- input → process ✓
- process → integration ✓
- integration → analytics ✓
- analytics → storage ✓

**Feedback paths (medium complement scores):**
- storage → analytics ✓
- analytics → process ✓
- control → process ✓

**Same layer (linear):**
- X → X (any layer with itself) ✓

**Special:**
- quantum → [anything] = quantum synergy
- [anything] → sigma = sigma synergy (validation/conflict)

---

## Performance Tips

1. **Cache results:** Engine auto-caches; no need for manual caching
2. **Batch updates:** Call `setNodes()` once per frame, not per node
3. **Limit path queries:** Keep to 2-5 nodes max
4. **Network stats once/tick:** Don't call per-link
5. **Check type first:** Use `result.type` to decide on expensive effects

---

## Integration Checklist

- [ ] Import SynergyEngine
- [ ] Create engine with nodes map
- [ ] Call `engine.setLinks()` if using path analysis
- [ ] Evaluate links with `evaluateLink()` or `evaluatePair()`
- [ ] Use `result.visual` for shader uniforms
- [ ] Update synergy when nodes/links change
- [ ] Call `engine.clearCache()` if data changes unexpectedly

---

## Troubleshooting

| Problem | Check |
|---------|-------|
| All synergies "none" | Nodes in engine? Call `setNodes()` |
| Weird scores | Valid layer names? Valid frequency 0.0-1.0? |
| Quantum always different | Intentional! Uses `Math.random()` |
| Path score low | Expected for 4-5 node paths (penalty applied) |
| No visual differences | Check `result.type` varies; check shader uses uniform |

---

## Type Definitions (Copy-Paste)

```typescript
export type SynergyType = 'linear'|'complement'|'fusion'|'quantum'|'sigma'|'fractal'|'none';

export interface SynergyResult {
  type: SynergyType;
  score: number;           // 0.0-3.0
  energy: number;          // 0.0-1.0
  details: string[];
  visual: SynergyVisual;
  metadata?: {
    frequencyCloseness?: number;
    behaviorMatch?: boolean;
    layerCompatibility?: string;
    hasQuantum?: boolean;
    hasSigma?: boolean;
  };
}

export interface SynergyVisual {
  color: string;
  pulseSpeed: number;      // 0.0-3.0
  warpIntensity: number;   // 0.0-1.0
  thickness: number;       // 0.1-3.0
  glitch: number;          // 0.0-1.0
}

interface Node {
  id: string;
  layer: string;
  frequency: number;       // 0.0-1.0
  behavior?: string;
  position?: THREE.Vector3;
}
```

---

## One-Minute Integration Example

```typescript
import { SynergyEngine } from './SynergyEngine';

// Setup
const engine = new SynergyEngine(nodesMap);
engine.setLinks(linksMap);

// Evaluate a link
const result = engine.evaluateLink(someLink);

// Use visual in shader
const material = new THREE.ShaderMaterial({
  uniforms: {
    linkColor: { value: new THREE.Color(result.visual.color) },
    pulseSpeed: { value: result.visual.pulseSpeed },
    thickness: { value: result.visual.thickness },
    glitch: { value: result.visual.glitch },
  },
});

// Get network health
const stats = engine.getNetworkSynergyStats();
console.log(`Network avg synergy: ${stats.avgScore.toFixed(2)}`);
```

---

Done! You now have the complete SynergyEngine. Use the full SYNERGY_ENGINE_GUIDE.md for deep integration. 🚀
