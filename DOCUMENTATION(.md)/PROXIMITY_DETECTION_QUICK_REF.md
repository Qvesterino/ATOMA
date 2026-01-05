# Hub Proximity Detection — Quick Reference

## What It Does

Detects when harmonic hubs are spatially close and topologically aligned, preparing the ground for future cascade amplification.

**NO effects yet** — Pure detection system.

---

## Console Commands

### Status

```javascript
cascade_info()                          // Cascade system status
cascadeStatus()                         // Detailed proximity info
getProximityPairs()                     // List all detected pairs
getHubProximityStats()                  // Get raw statistics
```

### Debugging

```javascript
toggleCascadeDebug(true/false)          // Enable debug visualization
cascade_toggleDebug(true/false)         // Same as above
```

### Tuning

```javascript
cascade_tune('maxProximityDistance', 30.0)      // Extend detection range
cascade_tune('minHarmonyThreshold', 0.1)        // Lower harmony requirement
```

---

## Proximity Pair Data

Each detected pair contains:

```javascript
{
  hubAId: string,              // Hub A identifier
  hubBId: string,              // Hub B identifier
  distance: number,            // Actual distance (units)
  combinedHarmony: number,     // Average harmony (0-1)
  proximityStrength: number,   // Strength metric (0-1)
  harmonyA, harmonyB,          // Individual harmonies
  corruptionA, corruptionB,    // Individual corruptions
  synergyA, synergyB           // Individual synergies
}
```

---

## Proximity Criteria

Hub pair is proximal if ALL pass:

1. ✓ Distance < 24.0 units (configurable)
2. ✓ Both hubs have ≥2 links
3. ✓ Average harmony > 0.2 (configurable)
4. ✓ Corruption does NOT dominate either hub

---

## Programmatic Access

```javascript
// Get proximity pairs
game.harmonicCascadeAmplification.getProximityPairs()

// Check if two hubs proximal
game.harmonicCascadeAmplification.isHubsProximal('hub-0', 'hub-1')

// Get all hubs near a specific hub
game.harmonicCascadeAmplification.getProximalHubs('hub-0')

// Get statistics
game.harmonicCascadeAmplification.getProximityStats()
```

---

## Performance

- **Per-frame cost**: <0.2ms
- **Memory**: ~3-4 KB typical
- **Scalability**: Safe to 20+ hubs

---

## Example Session

```javascript
// 1. Check what hubs are proximal
cascadeStatus();
// Output: Lists all detected proximity pairs

// 2. Get detailed statistics
const stats = getHubProximityStats();
console.log(`${stats.pairsDetected} pairs detected`);

// 3. Extend detection range to find more pairs
cascade_tune('maxProximityDistance', 35.0);

// 4. Check again
cascadeStatus();

// 5. Restore default
cascade_tune('maxProximityDistance', 24.0);
```

---

## Tuning Scenarios

### Strict (only very close, harmonious pairs)
```javascript
cascade_tune('maxProximityDistance', 12.0);
cascade_tune('minHarmonyThreshold', 0.5);
```

### Loose (distant, weakly harmonious pairs)
```javascript
cascade_tune('maxProximityDistance', 40.0);
cascade_tune('minHarmonyThreshold', 0.1);
```

### Default (balanced)
```javascript
cascade_tune('maxProximityDistance', 24.0);
cascade_tune('minHarmonyThreshold', 0.2);
```

---

## Key Insights

- **Detection always runs** (even if cascades disabled)
- **Zero visual effects** (pure data collection)
- **Cached per frame** (efficient reuse)
- **Ready for cascades** (API prepared for amplification)

---

## Status in main.js

- ✅ Import: Enabled
- ✅ Property: Initialized
- ✅ Setup: Active
- ✅ Update loop: Active
- ✅ Console API: Exposed
- ❌ Cascade amplification: Disabled

**Proximity detection is production-ready and waiting for cascade activation.**
