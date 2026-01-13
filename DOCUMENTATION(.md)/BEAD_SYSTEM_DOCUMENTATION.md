# Bead System Documentation

## Overview

The **LinkBeadSystem** adds directional flow indicators to braided rope links in ATOMA. Small beads travel along link curves, visualizing data flow from source nodes to target nodes.

### Visual Hierarchy
1. **Node core** (primary)
2. **Node aura** (secondary)
3. **Braided rope link** (primary structure)
4. **Moving beads** (flow indicators)

Beads are intentionally subordinate to the rope, providing information without visual noise.

---

## Architecture

### Core Components

#### `LinkBeadSystem.js`
- **`Bead`**: Data object tracking position, speed, and lifetime
- **`LinkBeadPool`**: Manages bead spawning and lifecycle for a single link
- **`BeadRenderer`**: Handles mesh creation and visual updates
- **`LinkBeadVisualizer`**: Integrates pool and renderer for a link

#### `LinkRendererConduit.js`
- Creates `LinkBeadVisualizer` during link initialization
- Calls `beadVisualizer.update(deltaTime)` in main update loop
- Calls `disposeLinkVisuals(linkGroup)` for cleanup

#### `BeadSystemTuning.js`
- Provides presets and fine-tuning functions
- Easy configuration without modifying core code

---

## Configuration

### BEAD_CONFIG Structure

```javascript
{
  // Bead sizes (radius in units)
  sizes: {
    small: 0.04,
    medium: 0.06,
    large: 0.08
  },
  
  // Probability distribution of sizes
  sizeDistribution: {
    small: 0.6,    // 60% small beads
    medium: 0.35,  // 35% medium beads
    large: 0.05    // 5% large beads
  },
  
  // Movement speed (units per second)
  speedMin: 0.5,
  speedMax: 2.0,
  
  // Spawn behavior
  spawn: {
    baseRate: 3.0,           // beads/sec at max activity
    minActivityThreshold: 0.15  // minimum to spawn any beads
  },
  
  // Visual properties
  opacity: 0.7,
  emissiveIntensity: 0.35,
  roughness: 0.5,
  metalness: 0.3,
  
  // Fade-out distance
  fadeDistance: 0.1,  // As fraction of curve (10%)
  
  // Maximum beads per link
  maxBeadsPerLink: 20,
  
  // Synergy coupling
  synergyCoupling: {
    enabled: true,
    minMultiplier: 0.6,  // Low synergy = 60% opacity
    maxMultiplier: 1.2   // High synergy = 120% opacity
  }
}
```

---

## Behavior

### Spawning

Beads spawn based on **activity level**:
```
activity = (synergyScore + traffic.load) / 2
spawnRate = baseRate * activity
```

- **Low activity** (< 0.15): No beads spawn
- **Mid activity** (0.15 - 0.7): Steady spawn rate
- **High activity** (0.7 - 1.0): Frequent beads

### Movement

- Beads travel strictly along `link.curve`
- Each bead has randomized speed (0.5 - 2.0 units/sec)
- Always moves source → target (never reverses)
- Position: `t ∈ [0, 1]` updates continuously

### Lifecycle

1. **Spawn**: Created at `t = 0.0` with random speed
2. **Travel**: Position increases based on speed
3. **Fade**: Opacity decreases in final 10% of curve
4. **Deactivate**: Bead recycles when `t > 1.0`

### Visual Properties

- **Position**: On curve at parameter `t`
- **Offset**: Slightly perpendicular to rope (embedded appearance)
- **Opacity**: Base * synergy multiplier * fade amount
- **Color**: Matches link source node category
- **Glow**: Soft emissive based on intensity setting

---

## Usage

### Basic Integration

The system is automatically integrated in `LinkRendererConduit`:

```javascript
// During link creation
const beadVisualizer = new LinkBeadVisualizer(link, scene);

// In update loop
state.beads.update(deltaTime);

// During cleanup
disposeLinkVisuals(linkGroup);
```

### Applying Presets

```javascript
import BeadSystemTuning from './BeadSystemTuning.js';

// Apply a preset
BeadSystemTuning.applyPreset(BeadSystemTuning.PRESET_CONSERVATIVE);

// Or tune individually
BeadSystemTuning.setSpawnRate(4.0);
BeadSystemTuning.setOpacity(0.75);
BeadSystemTuning.setSynergyCoupling(true);
```

### Presets

| Preset | Use Case | Spawn Rate | Max Beads | Opacity |
|--------|----------|-----------|-----------|---------|
| **CONSERVATIVE** | High density networks | 1.5/sec | 10 | 0.6 |
| **BALANCED** | Standard visualization | 3.0/sec | 20 | 0.7 |
| **EXPRESSIVE** | Low density networks | 5.0/sec | 30 | 0.8 |
| **BUSY** | Dramatic effect | 8.0/sec | 50 | 0.85 |

---

## Performance

### Memory
- Beads are pooled (max 20 per link)
- Single shared material with color cloning
- Pre-created geometries (reused across all links)
- No per-frame allocations

### Computation
- `O(n)` where n = active beads per link
- Curve sampling: 10 points per bead spawn (one-time)
- Position updates: Simple interpolation + offset calculation
- Typically < 0.2ms for 100 active beads

### Optimization Tips
- **High link count**: Use `PRESET_CONSERVATIVE`
- **Static scene**: Reduce spawn rate
- **Mobile**: Reduce max beads per link
- **High-end**: Use `PRESET_EXPRESSIVE` for visual richness

---

## Synergy Integration

Beads automatically respond to link quality:

### Low Synergy (Weak Link)
- Fewer beads spawn
- Less visible (lower opacity)
- Indicates poor connection

### High Synergy (Strong Link)
- More beads spawn
- More visible (higher opacity)
- Indicates healthy connection

### No Configuration Needed
Synergy coupling is automatic—beads read directly from `link.synergyScore`.

---

## Visual Tuning Guide

### If beads are too prominent:
- Reduce `opacity` (0.7 → 0.5)
- Reduce `emissiveIntensity` (0.35 → 0.2)
- Reduce spawn rate (3.0 → 1.5)
- Use `PRESET_CONSERVATIVE`

### If beads are too subtle:
- Increase `opacity` (0.7 → 0.85)
- Increase `emissiveIntensity` (0.35 → 0.45)
- Increase spawn rate (3.0 → 5.0)
- Use `PRESET_EXPRESSIVE`

### If beads look harsh:
- Increase `roughness` (0.5 → 0.7) for matte finish
- Decrease `metalness` (0.3 → 0.1) for softer appearance
- Reduce `emissiveIntensity` to avoid harsh glow

### If beads look washed out:
- Decrease `roughness` (0.5 → 0.3) for more reflection
- Increase `metalness` (0.3 → 0.5) for polish
- Increase `emissiveIntensity` for visibility

---

## Debugging

### Get Bead Statistics

```javascript
const stats = linkBeadVisualizer.getStats();
console.log(stats);
// Output:
// {
//   active: 5,           // Currently visible beads
//   max: 20,             // Pool size
//   activity: 0.65,      // (synergy + traffic) / 2
//   spawnRate: 1.95,     // Beads per second
//   avgSpeed: 1.24       // Average bead speed
// }
```

### Check Configuration

```javascript
import BeadSystemTuning from './BeadSystemTuning.js';
const config = BeadSystemTuning.getConfig();
console.log(config);
```

### Reset to Defaults

```javascript
BeadSystemTuning.resetToDefaults(); // Back to PRESET_BALANCED
```

---

## Design Principles

### Primary: The Rope
- Braided strands are the main visual form
- Rope thickness and twist communicate structure
- Rope color indicates node category

### Secondary: The Beads
- Beads sit within/on the rope
- Movement shows direction and activity
- Size/opacity variation adds organic feel
- Never overshadow the rope

### Tertiary: The Flow
- Bead speed indicates synergy/traffic
- Frequency indicates activity level
- Color matches source node category
- Fade-out at target node is subtle

---

## Constraints (Non-Negotiable)

✅ **Can do:**
- Adjust spawn rate and opacity
- Change bead colors (via node categories)
- Tune synergy coupling
- Modify sizes and speeds

❌ **Cannot do:**
- Add particle emitters
- Add arrows or directional symbols
- Change link logic
- Modify node geometry
- Create visual noise/sparkles

---

## Future Enhancements

Potential improvements (without breaking constraints):

1. **Bead trails** (soft glow trailing behind)
2. **Pulsing beads** (intensity matches traffic)
3. **Bead collision** (subtle interaction at nodes)
4. **Instanced rendering** (for very high bead counts)
5. **Bead clustering** (visual grouping by direction)

---

## Troubleshooting

### Beads not appearing
- Check `link.curve` is set
- Verify `link.synergyScore` is defined
- Ensure scene has lights (beads are lit with MeshStandardMaterial)
- Check bead visibility with `getStats()`

### Beads moving too fast/slow
- Adjust `speedMin` and `speedMax`
- Check curve length calculation
- Verify `deltaTime` is correct (should be ~0.016 for 60fps)

### Beads disappearing suddenly
- This is correct! They fade out over final 10% of curve
- Adjust `fadeDistance` if needed
- Check `maxBeadsPerLink` not limiting spawns

### Memory leak
- Ensure `disposeLinkVisuals()` is called on link removal
- Check material cloning isn't creating unbounded references
- Monitor geometry disposal in browser dev tools

---

## References

- **LinkBeadSystem.js**: Core bead implementation
- **LinkRendererConduit.js**: Integration point
- **BeadSystemTuning.js**: Configuration presets
- **BEAD_CONFIG**: Central configuration object
