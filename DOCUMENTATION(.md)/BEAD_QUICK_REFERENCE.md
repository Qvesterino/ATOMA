# Bead System Quick Reference

## TL;DR

Beads are small spheres that travel along braided rope links. They visualize data flow and are automatically managed by the system.

---

## Quick Start

### No Configuration Needed
Beads work out of the box with sensible defaults. Just create links normally.

### Apply a Preset
```javascript
import BeadSystemTuning from './BeadSystemTuning.js';

// Conservative (sparse beads)
BeadSystemTuning.applyPreset(BeadSystemTuning.PRESET_CONSERVATIVE);

// Balanced (default)
BeadSystemTuning.applyPreset(BeadSystemTuning.PRESET_BALANCED);

// Expressive (many beads)
BeadSystemTuning.applyPreset(BeadSystemTuning.PRESET_EXPRESSIVE);

// Busy (maximum beads)
BeadSystemTuning.applyPreset(BeadSystemTuning.PRESET_BUSY);
```

### Tune Individual Parameters
```javascript
BeadSystemTuning.setSpawnRate(3.0);      // Beads per second
BeadSystemTuning.setOpacity(0.7);        // 0.0 - 1.0
BeadSystemTuning.setEmissiveIntensity(0.35); // Glow strength
BeadSystemTuning.setRoughness(0.5);      // Surface finish
BeadSystemTuning.setMaxBeadsPerLink(20); // Pool size
```

---

## How Beads Work

| Aspect | Behavior |
|--------|----------|
| **Position** | Travel along link curve from source to target |
| **Speed** | Random 0.5-2.0 units/sec per bead |
| **Spawn Rate** | Higher with synergy + traffic |
| **Color** | Matches source node category |
| **Visibility** | Fades out in final 10% of rope |
| **Size** | 60% small, 35% medium, 5% large |
| **Offset** | Slightly perpendicular to rope (embedded) |

---

## Configuration Reference

### Spawn Behavior
```javascript
BEAD_CONFIG.spawn = {
  baseRate: 3.0,              // Beads/sec at max activity
  minActivityThreshold: 0.15  // Min to spawn any beads
};
```

### Visual Properties
```javascript
BEAD_CONFIG.opacity = 0.7;              // Base transparency
BEAD_CONFIG.emissiveIntensity = 0.35;   // Glow strength
BEAD_CONFIG.roughness = 0.5;            // Surface matte-ness
BEAD_CONFIG.metalness = 0.3;            // Shine amount
```

### Lifecycle
```javascript
BEAD_CONFIG.fadeDistance = 0.1;         // Fade-out distance (10% of curve)
BEAD_CONFIG.maxBeadsPerLink = 20;       // Max beads per link
```

### Speed
```javascript
BEAD_CONFIG.speedMin = 0.5;             // Min units/sec
BEAD_CONFIG.speedMax = 2.0;             // Max units/sec
```

### Synergy Coupling
```javascript
BEAD_CONFIG.synergyCoupling = {
  enabled: true,           // Scale visibility with link health
  minMultiplier: 0.6,      // At low synergy
  maxMultiplier: 1.2       // At high synergy
};
```

---

## Common Adjustments

### Too Many Beads?
```javascript
BeadSystemTuning.setSpawnRate(1.5);      // Reduce spawn rate
// OR
BeadSystemTuning.applyPreset(BeadSystemTuning.PRESET_CONSERVATIVE);
```

### Too Few Beads?
```javascript
BeadSystemTuning.setSpawnRate(5.0);      // Increase spawn rate
// OR
BeadSystemTuning.applyPreset(BeadSystemTuning.PRESET_EXPRESSIVE);
```

### Beads Look Too Bright?
```javascript
BeadSystemTuning.setOpacity(0.5);            // Less transparent
BeadSystemTuning.setEmissiveIntensity(0.2);  // Less glow
```

### Beads Look Too Subtle?
```javascript
BeadSystemTuning.setOpacity(0.85);           // More transparent
BeadSystemTuning.setEmissiveIntensity(0.45); // More glow
```

### Beads Look Harsh?
```javascript
BeadSystemTuning.setRoughness(0.7);      // Matte finish
BeadSystemTuning.setMetalness(0.1);      // Less shiny
```

### Beads Look Washed Out?
```javascript
BeadSystemTuning.setRoughness(0.3);      // Shinier
BeadSystemTuning.setMetalness(0.5);      // More metallic
```

---

## Debug Commands

### Get Bead Statistics
```javascript
// In browser console:
const stats = window.game.nodeLinkingSystem.links[0].group
  .userData.conduitState.beads.getStats();
console.table(stats);

// Output:
// {
//   active: 5,           // Currently visible
//   max: 20,             // Pool size
//   activity: 0.65,      // (synergy + traffic) / 2
//   spawnRate: 1.95,     // Beads/second
//   avgSpeed: 1.24       // Average bead speed
// }
```

### Check Configuration
```javascript
import BeadSystemTuning from './BeadSystemTuning.js';
console.log(BeadSystemTuning.getConfig());
```

### Reset to Defaults
```javascript
import BeadSystemTuning from './BeadSystemTuning.js';
BeadSystemTuning.resetToDefaults();
```

---

## Visual Behavior Quick Reference

| Scenario | Expected Behavior |
|----------|-------------------|
| New link created | No beads (synergy building) |
| Synergy → 0.5 | Occasional beads |
| Synergy → 1.0 | Steady stream of beads |
| Traffic low | Few beads spawn |
| Traffic high | Many beads spawn |
| Bead reaches target | Fades smoothly over 10% distance |
| Link removed | Beads cleaned up (no memory leak) |

---

## Performance Notes

- **Each bead**: ~1-2 microseconds update time
- **100 active beads**: ~0.2ms per frame
- **Memory per link**: ~8KB for bead pool + materials
- **No garbage collection during operation** (object pooling)

---

## Constraints (Can't Change)

❌ Can't add particle emitters
❌ Can't add arrows/symbols
❌ Can't change link game logic
❌ Can't deform nodes
❌ Can't create visual noise

---

## Common Patterns

### High-Density Network
```javascript
BeadSystemTuning.applyPreset(BeadSystemTuning.PRESET_CONSERVATIVE);
```

### Normal Network
```javascript
BeadSystemTuning.applyPreset(BeadSystemTuning.PRESET_BALANCED);
// Or just leave at defaults
```

### Sparse Network (Show Details)
```javascript
BeadSystemTuning.applyPreset(BeadSystemTuning.PRESET_EXPRESSIVE);
```

### Dramatic Effect (Low Node Count)
```javascript
BeadSystemTuning.applyPreset(BeadSystemTuning.PRESET_BUSY);
```

### Custom Fine-Tuning
```javascript
BeadSystemTuning.setSpawnRate(3.5);
BeadSystemTuning.setOpacity(0.75);
BeadSystemTuning.setSynergyCouplingRange(0.5, 1.1);
```

---

## Files to Know

| File | Purpose |
|------|---------|
| `LinkBeadSystem.js` | Core implementation (don't modify) |
| `LinkRendererConduit.js` | Integration point |
| `BeadSystemTuning.js` | Configuration (modify for tuning) |
| `NodeLinkingSystem.js` | Cleanup integration |
| `BEAD_SYSTEM_DOCUMENTATION.md` | Full technical docs |

---

## When Things Go Wrong

**Beads not appearing?**
→ Check synergy > 0.15 and link has valid curve

**Beads moving wrong?**
→ Check `deltaTime` is ~0.016 and curve length is correct

**Memory leak?**
→ Ensure `removeLink()` is called when links are deleted

**Too much CPU?**
→ Reduce `maxBeadsPerLink` or spawn rate

**Beads look ugly?**
→ Adjust `roughness` and `metalness` values

---

## Need More Info?

- **Details**: See `BEAD_SYSTEM_DOCUMENTATION.md`
- **Implementation**: See `LinkBeadSystem.js`
- **Tuning**: See `BeadSystemTuning.js`
- **Integration**: See `LinkRendererConduit.js`

---

That's it! Beads are designed to work seamlessly with minimal configuration.
