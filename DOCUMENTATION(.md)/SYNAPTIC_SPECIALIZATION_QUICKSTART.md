# Synaptic Specialization — Quick Start Guide

## What It Does

Nodes learn visual identities based on their repeated gating behavior. Amplification-heavy nodes look "excitatory," dampening-heavy nodes look "inhibitory," balanced nodes stay neutral.

**Result**: Network develops learned personalities without gameplay changes.

---

## 30-Second Setup

Already integrated! Just use:

```javascript
// Check status
synapticSpecialization.getStatus();

// Enable/disable
synapticSpecialization.enable();
synapticSpecialization.disable();

// Tune learning
synapticSpecialization.setLearningRate(0.05);      // How fast nodes learn
synapticSpecialization.setExpressionStrength(0.6); // Visual intensity

// Debug
synapticSpecialization.setDebugMode(true);
```

---

## How It Works

### Synaptic Bias

Each node develops a "bias" value [-1, +1]:

| Bias | Type | Appearance | Behavior |
|------|------|-----------|----------|
| +1.0 | Excitatory | Brighter halo, outward breathing | Confident amplifier |
| +0.5 | Learning excitatory | Gradually brightening | Leaning amplification |
| 0.0 | Neutral | Normal appearance | Balanced |
| -0.5 | Learning inhibitory | Gradually dimming | Leaning dampening |
| -1.0 | Inhibitory | Dimmer halo, inward breathing | Confident damper |

### Learning Process

1. **Observe**: Node's gating behavior (amplifies or dampens?)
2. **Accumulate**: Bias shifts toward observed behavior (SLOW)
3. **Express**: Visual appearance adapts to bias
4. **Stabilize**: Established specialization looks consistent

**Speed**: Very slow (~2–3 minutes to fully specialize)

### Relearning

If node behavior changes:
1. Old specialization gradually fades
2. New specialization gradually emerges
3. Transition is smooth (no snaps)
4. Takes ~30 seconds to fully switch

---

## Visual Effects

### Excitatory Nodes (Bias > +0.3)

- **Halo**: Brighter, smoother, outward breathing
- **Pulses**: Elongated, confident exit shape
- **Ripples**: Broad, coherent patterns
- **Feel**: "Strong amplifier, confident transmission"

### Inhibitory Nodes (Bias < -0.3)

- **Halo**: Dimmer, denser, inward breathing
- **Pulses**: Contracted, absorbed exit shape
- **Ripples**: Tight, constrained patterns
- **Feel**: "Strong damper, absorbing transmission"

### Neutral Nodes (-0.3 ≤ Bias ≤ +0.3)

- **Halo**: Standard, balanced appearance
- **Pulses**: Normal shapes
- **Ripples**: Normal patterns
- **Feel**: "Balanced, learning or undecided"

---

## Console Commands

### Status & Help

```javascript
synapticSpecialization.getStatus();    // View current settings
synapticSpecialization.help();          // Show all commands
```

### Enable/Disable

```javascript
synapticSpecialization.enable();        // Turn on
synapticSpecialization.disable();       // Turn off
```

### Debug Mode

```javascript
synapticSpecialization.setDebugMode(true);   // Show per-frame logs
synapticSpecialization.setDebugMode(false);  // Hide logs
```

### Tuning

```javascript
// Learning speed (0-0.5, default 0.05)
synapticSpecialization.setLearningRate(0.1);   // Faster learning
synapticSpecialization.setLearningRate(0.02);  // Slower learning

// Visual intensity (0-1, default 0.6)
synapticSpecialization.setExpressionStrength(1.0);  // Maximum expression
synapticSpecialization.setExpressionStrength(0.3);  // Subtle effects
```

---

## Observing Specialization

### Quick Check

```javascript
// Find a node with high synergy
const node = game.aiNodes.nodes.find(n => n.userData.synergy > 0.7);

// Check its specialization
console.log(node.userData.synapticBias);            // Current bias [-1, 1]
console.log(node.userData.synapticSpecialization); // 'excitatory'|'inhibitory'|'neutral'
```

### Watch Development

```javascript
// Pick a highly-used node
const busyNode = game.aiNodes.nodes[0];

// Monitor every second
setInterval(() => {
  console.log(`Bias: ${busyNode.userData.synapticBias.toFixed(2)}`);
}, 1000);

// You'll see it gradually shift toward +1.0 or -1.0
```

### Get Full Data

```javascript
const node = game.aiNodes.nodes[0];
const mod = game.synapticSpecializationAdapter.getVisualModulation(node.id);
console.log(mod);
// {
//   bias: 0.45,
//   specialization: 'neutral',
//   expressionIntensity: 0.27,
//   haloBrightnessBoost: 0.09,
//   haloBreathingDirection: 1.0,
//   ...
// }
```

---

## Understanding Expression

### Expression Intensity

How strongly the specialization shows:

```
Bias Value  →  Expression Intensity
0.0         →  0% (neutral, nothing shown)
0.3         →  30% (just starting)
0.5         →  50% (clear specialization)
1.0         →  100% (full excitatory)
```

### Stability

How confident the specialization is:

```
New node (just specialized)     →  40% confidence = 40% visible
Established (weeks of same behavior) →  100% confidence = fully visible
```

**Result**: Young specializations are subtle, old specializations are obvious.

---

## Interactions

### With Fatigue

Tired nodes show less specialization (suppressed expression).

```javascript
// High fatigue + high specialization
// → Specialization only 30% visible (looking worn)

// No fatigue + high specialization
// → Specialization 100% visible (full personality)
```

### With Corruption

Corrupted nodes show distorted specialization (asymmetric, chaotic).

```javascript
// High corruption + excitatory
// → Halo still brighter but unstable, flickering

// Low corruption + excitatory
// → Halo smooth and confident
```

### With Harmony

Harmonic nodes show clearer, more stable specialization.

```javascript
// High harmony + excitatory
// → Specialization crystal clear, rock-solid

// Low harmony + excitatory
// → Specialization present but noisy
```

---

## Performance

- **Per-frame cost**: <0.1ms (200 nodes)
- **Memory**: ~24KB total (200 nodes)
- **Allocations**: 0 per frame
- **Scales to**: 200+ nodes easily

---

## State & Persistence

- **Specialization resets** when you switch worlds (intentional)
- **Specialization is NOT saved** between sessions
- **Specialization rebuilds naturally** as nodes experience load

---

## Troubleshooting

### "Nodes aren't specializing"

Check:
```javascript
// 1. Is it enabled?
synapticSpecialization.getStatus();

// 2. Are nodes being strongly gated?
synapticGating.getStatus();

// 3. Is gating strong enough?
const node = game.aiNodes.nodes[0];
console.log(node.userData.synapticGateStrength);  // Need > 0.05
```

### "Specialization changed direction too fast"

Node is relearning. This is expected if gating direction changes:

```javascript
// To slow down relearning, reduce learning rate
synapticSpecialization.setLearningRate(0.02);
```

### "Visual effects aren't visible"

```javascript
// 1. Increase expression strength
synapticSpecialization.setExpressionStrength(1.0);

// 2. Check if node is even specialized
const node = game.aiNodes.nodes[0];
const bias = node.userData.synapticBias;
console.log(bias);  // Should be > 0.3 or < -0.3 for visible effects

// 3. Check if fatigue is suppressing expression
console.log(node.userData.synapticFatigue);  // If > 0.5, suppresses visuals
```

### "Too subtle/too obvious"

Adjust expression strength:

```javascript
// More subtle
synapticSpecialization.setExpressionStrength(0.3);

// More obvious
synapticSpecialization.setExpressionStrength(1.0);
```

### "Learning too slow/too fast"

Adjust learning rate:

```javascript
// Much slower learning
synapticSpecialization.setLearningRate(0.01);

// Much faster learning
synapticSpecialization.setLearningRate(0.15);
```

---

## Example Workflow

### Scenario: Observe a node specializing

```javascript
// 1. Find a high-synergy hub node
const hubNode = game.aiNodes.nodes.find(n => n.userData.isHub && n.userData.synergy > 0.8);

// 2. Start monitoring
console.log("Starting specialization watch...");

// 3. Set up logging
setInterval(() => {
  console.log(
    `Node ${hubNode.id.substring(0, 8)}: ` +
    `bias=${hubNode.userData.synapticBias.toFixed(2)}, ` +
    `spec=${hubNode.userData.synapticSpecialization}`
  );
}, 5000);

// 4. Watch over time
// You'll see: bias gradually rises (0.0 → 0.2 → 0.4 → 0.6 → 0.8)
// Visual: Halo gradually brightens and expands

// 5. When bias > 0.3, you'll see clear excitatory features:
// - Halo brighter
// - Breathing outward
// - Pulses elongated
// - Ripples broad
```

---

## Key Takeaways

✅ **Purely visual** — No gameplay changes  
✅ **Slow learning** — Biological, organic pace  
✅ **Smooth transitions** — Never snaps  
✅ **Biologically credible** — Mirrors neural specialization  
✅ **Personality-driven** — Nodes develop identities  

**Result**: Network feels alive, learning, and intelligent.

---

## Next Steps

- Use `synapticSpecialization.setDebugMode(true)` to see specialization in action
- Watch nodes develop specializations over time
- Notice how appearance changes based on behavior
- Tune learning rate and expression strength to your taste
- Integrate specialization data into custom visual systems

Enjoy watching your network develop personality! 🧠⚡
