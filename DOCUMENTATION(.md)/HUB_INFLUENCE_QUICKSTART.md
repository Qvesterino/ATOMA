# HubInfluencePropagation — Quick Start

## Overview

Visual field projection from harmonic hubs that influences connected links and neighbor nodes through two zones: direct influence (Zone 1) and secondary reach (Zone 2).

**Core Concept**: Network is a continuous field, not discrete nodes. Important hubs visibly shape nearby space.

---

## Quick Integration

### 1. Import

```javascript
import { HubInfluencePropagation } from './HubInfluencePropagation.js';
```

### 2. Initialize

```javascript
const influencePropagation = new HubInfluencePropagation();
```

### 3. Add to Frame Loop

```javascript
function animate() {
  const deltaTime = clock.getDelta();
  
  // Update influence propagation
  influencePropagation.update(deltaTime, hubSystemData, nodeRegistry, linkRegistry);
  
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
```

---

## How It Works

### Two Influence Zones

**Zone 1 (Direct Influence)**:
- Direct links connected to hub
- Nodes one hop away
- 60% of hub strength
- Strong visual effect

**Zone 2 (Secondary Reach)**:
- Nodes reachable via one intermediate node
- Very subtle visual effect
- 25% of hub strength
- Suppressed if instability > 0.7

### Influence Strength

Computed from hub state:
```
strength = syncStrength × (harmony×0.5 + synergy×0.5)
         × (1 - corruption×0.3) × (1 - instability×0.4)
         × (0.7 + resilience×0.3)
```

Result: 0-1 scalar representing hub's influence capacity

### Visual Effects on Links

- **Phase bias** toward hub phase (pulls rhythm)
- **Reduced phase variance** (becomes more coherent)
- **Directional streaks** more aligned
- **Pulse timing** subtly synchronized

### Visual Effects on Nodes

**Zone 1 Nodes**:
- Faint secondary halo (0-0.15 intensity)
- Pulse synchronized with hub
- Never competes with primary halo

**Zone 2 Nodes**:
- Soft glow hint (0-0.08 intensity)
- Phase suggestion only
- Extremely subtle

---

## State Modulation

| Driver | Effect |
|--------|--------|
| **Harmony** | Expands clarity, smooths transitions |
| **Synergy** | Increases strength (+20-50%) |
| **Corruption** | Distorts field, adds phase lag |
| **Instability** | Dampens reach, suppresses Zone 2 if high |
| **Resilience** | Stabilizes field, prevents collapse |

---

## API Reference

### Constructor

```javascript
new HubInfluencePropagation()
```

### Methods

#### `update(deltaTime, hubSystemData, nodeRegistry, linkRegistry)`
Main frame update. Propagates influence from all hubs.

```javascript
influencePropagation.update(deltaTime, hubSystemData, nodeRegistry, linkRegistry);
```

#### `computeHubInfluenceStrength(hubState)`
Compute influence strength from hub state.

```javascript
const strength = influencePropagation.computeHubInfluenceStrength(hubState);
```

#### `getHubInfluenceStats(hubId)`
Get detailed influence stats for a hub.

```javascript
const stats = influencePropagation.getHubInfluenceStats('node_0');
console.log(stats);
```

#### `getStats()`
Get system statistics.

```javascript
const stats = influencePropagation.getStats();
console.log(`${stats.influencedHubCount} hubs influencing ${stats.totalInfluencedNodes} nodes`);
```

#### `invalidateCache()`
Call when network topology changes.

```javascript
influencePropagation.invalidateCache();
```

#### `dispose()`
Clean up resources.

```javascript
influencePropagation.dispose();
```

---

## Usage Examples

### Basic Setup

```javascript
const influence = new HubInfluencePropagation();

function animate() {
  const dt = clock.getDelta();
  influence.update(dt, hubSystemData, nodeRegistry, linkRegistry);
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
```

### Monitor Influence

```javascript
const stats = influence.getStats();
console.log(`Zone 1: ${stats.zone1NodeCount} nodes`);
console.log(`Zone 2: ${stats.zone2NodeCount} nodes`);
```

### Inspect Hub Influence

```javascript
const hubStats = influence.getHubInfluenceStats('node_0');
console.log(JSON.stringify(hubStats, null, 2));
// {
//   hubId: 'node_0',
//   strength: '0.650',
//   zone1Strength: '0.390',
//   zone2Strength: '0.163',
//   zone1Nodes: 4,
//   zone2Nodes: 8,
//   ...
// }
```

### React to Network Changes

```javascript
// When links are added/removed:
influencePropagation.invalidateCache();

// On next update, topology will be recomputed
```

---

## Visual Effects by Zone

### Zone 1 Links

```
Low Influence:    Normal appearance
Medium Influence: Slight phase alignment
High Influence:   Clearly coordinated streaks/pulses
```

### Zone 1 Nodes

```
Low Influence:    No secondary halo
Medium Influence: Faint secondary glow
High Influence:   Visible but subtle halo, pulse sync
```

### Zone 2 Links

```
Low Influence:    Barely perceptible
High Influence:   Slight rhythm hint
```

### Zone 2 Nodes

```
Low Influence:    Invisible
Medium Influence: Very subtle glow
High Influence:   Barely visible phase hint
```

---

## Performance

### Overhead

- **Per-hub**: ~0.5ms (neighbor computation)
- **Per-node/link update**: ~0.05ms (influence application)
- **Per-frame allocations**: 0 (cached)

### Scaling

For typical network (50 nodes, 10 hubs):
- Hub influence computation: ~5ms
- Neighbor propagation: ~3ms
- Total: ~8ms per frame

Very efficient.

---

## Integration with Visual Systems

### Link Streaks & Pulses

Links read `link.userData.influenceFields`:
```javascript
const influences = link.userData.influenceFields || [];
influences.forEach((inf) => {
  // Use inf.phaseBias to slightly pull phase
  // Use inf.streakCoherence to align streaks
  // Use inf.pulseAlignment to sync pulses
});
```

### Node Secondary Halos

Nodes read `node.userData.influenceFields`:
```javascript
const influences = node.userData.influenceFields || [];
influences.forEach((inf) => {
  // Use inf.haloIntensity for secondary halo
  // Use inf.phase for pulse synchronization
  // Use inf.isZone1 for effect strength
});
```

---

## Customization

### Adjust Zone 1 Strength

```javascript
// File: HubInfluencePropagation.js
INFLUENCE_ZONES.ZONE_1_ATTENUATION = 0.7;  // 70% instead of 60%
```

### Adjust Zone 2 Strength

```javascript
INFLUENCE_ZONES.ZONE_2_ATTENUATION = 0.35; // 35% instead of 25%
```

### Adjust Phase Bias

```javascript
// Stronger phase pull
INFLUENCE_PROPAGATION.ZONE_1_PHASE_BIAS = 0.25;  // 25% instead of 15%
```

### Adjust Node Halo Intensity

```javascript
// Brighter secondary halos
INFLUENCE_PROPAGATION.ZONE_1_NODE_HALO_MAX = 0.25;  // 25% instead of 15%
```

---

## Troubleshooting

### No influence visible?

1. Check hub system data:
   ```javascript
   const stats = influence.getStats();
   console.log('Influenced hubs:', stats.influencedHubCount);
   ```

2. Verify nodes/links have influence data:
   ```javascript
   const node = nodeRegistry.get('node_0');
   console.log('Influences:', node.userData.influenceFields);
   ```

3. Check network has links:
   ```javascript
   console.log('Links:', linkRegistry.size);
   ```

### Influence too weak/strong?

Adjust attenuation factors:
```javascript
INFLUENCE_ZONES.ZONE_1_ATTENUATION = 0.8;  // Stronger
INFLUENCE_ZONES.ZONE_2_ATTENUATION = 0.4;  // Stronger
```

### Performance issues?

- Neighbor topology cached (recomputed only on `invalidateCache()`)
- Per-frame cost scales linearly with hubs
- If many hubs, consider frustum culling

---

## Console API

```javascript
window.influencePropagation = influencePropagation;

// In console:
influencePropagation.getStats()
influencePropagation.getHubInfluenceStats('node_0')
influencePropagation.invalidateCache()
```

---

## Data Flow

```
Hub State (harmony, synergy, corruption, instability, resilience)
    ↓
Compute influence strength
    ↓
Identify neighbors (Zone 1 & Zone 2)
    ↓
Apply influence modulation
    ↓
Store in node.userData.influenceFields
Store in link.userData.influenceFields
    ↓
Visual systems read influence data and apply effects
```

---

## Next Steps

1. ✅ Import and initialize
2. ✅ Add to animation loop
3. ✅ Verify hub system data available
4. ✅ Check influence data on nodes/links
5. ✅ Wire to link streak/pulse systems
6. ✅ Wire to node secondary halo system
7. ✅ Test with various hub states
8. ✅ Monitor performance

---

## See Also

- `HubInfluencePropagation.js` — Core implementation
- `HUB_INFLUENCE_IMPLEMENTATION_GUIDE.md` — Detailed documentation
- `HUB_INFLUENCE_EXAMPLES.js` — Integration patterns
- `HarmonicNodeResonanceHalos.js` — Hub visualization
- Link visual systems (streaks, pulses)
- Node visual systems (secondary halos)
