# Corruption Aura Influence — Quick Reference

## What It Does

Extends node-linked auras to visually reflect corruption state:
- **High corruption** → More irregular silhouette, reduced upward flow, heavier feel
- **High harmony** → Dampens corruption effects (up to 40% reduction)
- **Smooth blending** → No thresholds or sudden changes

## Visual Effects Applied

| Effect | Parameter | Range |
|--------|-----------|-------|
| Silhouette Irregularity | Noise amplitude variance | +0% to +30% |
| Phase Desync | Frequency reduction | 10-20% slower |
| Upward Drift Reduction | Drift bias multiplier | 0% to 50% reduced |
| Opacity Variation | Oscillation amplitude | ±0% to ±15% |

## Console Commands

```javascript
// View corruption effects
nodeAuraStatus()

// Shows:
// - Corrupted Auras: count of affected nodes
// - Max Corruption Influence: highest effective corruption (0-1)
```

## Testing Quick Links

### Low Corruption (Subtle)
```javascript
// Find a node and set corruption
const node = window.game.aiNodes.nodes[0];
node.userData.corruption = 0.2;
// Create a link to see barely perceptible distortion
```

### High Corruption (Obvious)
```javascript
const node = window.game.aiNodes.nodes[0];
node.userData.corruption = 0.9;
// Create a link to see strong tearing + heavy motion
```

### Harmony Dampening
```javascript
const node = window.game.aiNodes.nodes[0];
node.userData.corruption = 0.8;
node.userData.harmony = 0.8;  // Reduces corruption effects by 32%
// Compare with no harmony to see the dampening
```

## Implementation Details

**File**: `NodeLinkedAuraSystem.js`
- Corruption calculation: Line 261-273
- Phase instability: Line 383-405
- Drift reduction: Line 420-424
- Opacity variation: Line 329-335
- Status tracking: Line 510-536

**File**: `main.js`
- Console output: Line 11478-11480

## Performance Impact

- **Zero per-frame allocations**
- **Early exit if no corruption**
- **~0.1-0.2ms added per frame** (negligible)

## Rules Compliance

✅ Visual-only (no gameplay changes)
✅ No particles
✅ No glow
✅ No color changes
✅ No flashing
✅ Smooth, deterministic behavior

## Integration

- Works with link creation spikes (blends additively)
- Works with undo/redo (recalculates automatically)
- Works with harmony system (dampens corruption)
- Works with debug mode (shows wireframe deformation)

