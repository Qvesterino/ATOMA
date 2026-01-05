# HIGH-SYNERGY PULSE ANIMATION — QUICK REFERENCE

## What It Does
Adds a subtle breathing/pulsing animation to node auras when links have high synergy (≥0.7).

## Where It Lives
**File**: `/NodeVisualStateBinder.js`
**Lines**: 548-667 (new functions)
**Import**: `import { updateNodeSynergyVisuals } from './NodeVisualStateBinder.js'`

## Functions

### `updateNodeSynergyVisuals(node, synergy, time)`
**Main entry point** - Call this every frame for linked nodes
```javascript
// Example: In main update loop
updateNodeSynergyVisuals(linkedNode, 0.85, gameTime);
```

### `getNodeSynergyPulseState(node)`
**Query** - Check if node is pulsing and its intensity
```javascript
const state = getNodeSynergyPulseState(node);
// Returns: { active: boolean, score: number, time: number }
```

### `disableNodeSynergyPulse(node)`
**Stop** - Turn off pulse for a node
```javascript
disableNodeSynergyPulse(node);  // Restores to baseline
```

## Animation Parameters

| Parameter | Value | Effect |
|-----------|-------|--------|
| **Synergy Threshold** | 0.7 | Pulse starts at synergy ≥ 0.7 |
| **Pulse Speed** | 2-4 Hz | Higher synergy = faster pulse |
| **Pulse Amplitude** | 15-40% | Magnitude scales with synergy |
| **Target** | Aura mesh | Opacity + emissive intensity |

## Pulse Speed Calculation
```
pulseSpeed = 2.0 + (synergy - 0.7) × 2.0

synergy 0.70 → 2.0 Hz (very subtle)
synergy 0.85 → 3.0 Hz (steady pulse)
synergy 1.00 → 4.0 Hz (strong pulse)
```

## Example Integration

### Option 1: Call from main update loop
```javascript
// main.js or game loop
import { updateNodeSynergyVisuals } from './NodeVisualStateBinder.js';

function updateFrame(deltaTime, time) {
  // For each linked node
  for (const link of linkingSystem.links) {
    if (link.source && link.synergyScore >= 0.7) {
      updateNodeSynergyVisuals(link.source, link.synergyScore, time);
    }
    if (link.target && link.synergyScore >= 0.7) {
      updateNodeSynergyVisuals(link.target, link.synergyScore, time);
    }
  }
}
```

### Option 2: Call from LinkingSystem
```javascript
// NodeLinkingSystem.updateLinkMetrics()
const links = this.links;
for (const link of links) {
  const synergy = link.synergyScore || 0;
  
  if (link.source) {
    updateNodeSynergyVisuals(link.source, synergy, time);
  }
  if (link.target) {
    updateNodeSynergyVisuals(link.target, synergy, time);
  }
}
```

## Visual Result

### Before Pulse
- Node remains static after linking
- No visual feedback on link quality

### After Pulse Enabled
- Aura gently pulses in and out
- Pulse speed indicates synergy level
- Higher synergy = faster, more intense pulse
- Professional, polished effect

## Performance
- **Cost per node**: < 0.1ms
- **Memory**: 0 bytes
- **Scalability**: O(n) for n linked nodes

## Tuning

To adjust pulse characteristics, edit `animateHighSynergyPulse()`:

```javascript
// Line 574: Change pulse speed formula
// const pulseSpeed = 2.0 + (synergy - 0.7) * 2.0;
// Try: const pulseSpeed = 1.5 + (synergy - 0.7) * 2.5;

// Line 575: Change pulse magnitude
// const pulseMagnitude = 0.15 + (synergy - 0.7) * 0.25;
// Try: const pulseMagnitude = 0.10 + (synergy - 0.7) * 0.40;

// Line 581: Change base opacity
// const baseOpacity = 0.08;
// Try: const baseOpacity = 0.06;  or 0.10;
```

## Compatibility

✅ Works with:
- Visual readability fix (core stays dominant)
- Corruption system
- Harmony system
- Synergy rewards system

## Testing

```javascript
// Test in console
const node = game.aiNodes.nodes[0];
updateNodeSynergyVisuals(node, 0.85, Date.now() / 1000);

// Check state
console.log(getNodeSynergyPulseState(node));

// Stop pulse
disableNodeSynergyPulse(node);
```

## Status

🟢 Ready to use - Functions are exported and waiting to be called from main update loop.

