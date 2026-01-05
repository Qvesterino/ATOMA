# Harmony Aura Influence — Quick Reference

## What It Does

Extends node-linked auras to visually reflect harmony state:
- **High harmony** → Smooth, light, coherent motion, restored upward flow
- **Low harmony** → Slight smoothing only, minimal effect
- **Synergistic** → Works with corruption system to balance visual state

## Visual Effects Applied

| Effect | Parameter | Range |
|--------|-----------|-------|
| Phase Alignment | Layer phase offset reduction | -0% to -50% |
| Frequency Restoration | Noise frequency increase | +5% to +10% |
| Silhouette Smoothing | Amplitude variance reduction | -10% to -20% |
| Drift Restoration | Upward bias increase | +0% to +30% |
| Opacity Uniformity | Oscillation amplitude reduction | -0% to -8% |

## Console Commands

```javascript
// View harmony effects
nodeAuraStatus()

// Shows:
// - Harmonized Auras: count of stabilized nodes
// - Max Harmony Stabilization: highest stabilization factor (0-0.4)
```

## Testing Quick Links

### Low Harmony (Minimal Effect)
```javascript
const node = window.game.aiNodes.nodes[0];
node.userData.harmony = 0.2;
// Creates links to see subtle smoothing
```

### High Harmony (Strong Effect)
```javascript
const node = window.game.aiNodes.nodes[0];
node.userData.harmony = 0.9;
// Creates links to see smooth, coherent motion
```

### Harmony vs Corruption
```javascript
const node = window.game.aiNodes.nodes[0];
node.userData.corruption = 0.8;
node.userData.harmony = 0.7;  // Counteracts ~28% of corruption effect
// See balanced, stable aura despite high corruption
```

## Implementation Details

**File**: `NodeLinkedAuraSystem.js`
- Harmony calculation: Line 368-371
- Phase alignment: Line 399-402
- Layer frequency stabilization: Line 407-432
- Drift restoration: Line 445-453
- Opacity uniformity: Line 331-344
- Status tracking: Line 546-582

**File**: `main.js`
- Console output: Line 11480

## Performance Impact

- **Zero per-frame allocations**
- **Early exit if no harmony**
- **~0.1-0.2ms added per frame** (negligible)

## Rules Compliance

✅ Visual-only (no gameplay changes)
✅ No particles
✅ No glow
✅ No color changes
✅ No flashing
✅ Smooth, deterministic behavior

## Integration

- Works additively with corruption (balances, not overrides)
- Works with link creation spikes
- Works with undo/redo
- Works with debug mode

## Harmony Stabilization Factor

| Harmony | Effective Stabilization | Effect Magnitude |
|---------|-----------|---|
| 0.0 | 0.0 | No stabilization |
| 0.25 | 0.1 | Subtle smoothing |
| 0.5 | 0.2 | Clear improvement |
| 0.75 | 0.3 | Strong stabilization |
| 1.0 | 0.4 | Maximum smoothing |

## Interaction Matrix

```
High Corruption + High Harmony = Controlled but visible effect
High Corruption + Low Harmony = Strong chaotic effect
Low Corruption + High Harmony = Smooth, light, effortless
Low Corruption + Low Harmony = Subtle natural motion
```

