# Synaptic Gating — Quick Start Guide

## What It Does

Each node in the network acts like a **synapse** — it intelligently filters, amplifies, or dampens pulse waves based on how healthy it is:

- **Healthy node** (high harmony) → **Amplifies signals** (brighter, stronger)
- **Balanced node** (neutral) → **Passes signals** (unchanged)
- **Corrupted/Unstable node** → **Dampens signals** (weaker, fades)

This is **purely visual** — it tells the story of how the network makes decisions.

## How to Observe

### Watch Pulses at Boundaries

When a pulse reaches a node, the node's gate determines what happens to outgoing pulses:

1. **Create healthy links** (high synergy)
2. **Watch pulses reach node boundaries**
3. **Observe outgoing pulses**:
   - From healthy nodes: **Brighter, stronger, longer**
   - From corrupted nodes: **Dimmer, weaker, shorter**

### Enable Debug Logging

```javascript
synapticGating.setDebugMode(true)
// Console shows gate strengths: "harmony=0.9, corruption=0.1 → gateStrength=0.53"
```

## Gate Strength Explained

### The Scale

```
-1.0  ─────────  0.0  ─────────  +1.0
 ↓              ↓              ↓
SEVERE         NEUTRAL       STRONG
DAMPENING      PASS-THROUGH   AMPLIFICATION
```

### Real Examples

```
Healthy Hub:
  harmony=0.9, corruption=0.1, instability=0.1
  → Gate ≈ +0.5 (AMPLIFY)
  → Outgoing pulses: 1.3x stronger

Sick Node:
  harmony=0.3, corruption=0.8, instability=0.5
  → Gate ≈ -0.4 (DAMPEN)
  → Outgoing pulses: 0.8x weaker

Chaotic Node:
  harmony=0.5, corruption=0.4, instability=0.9
  → Gate ≈ -0.2 (SLIGHT DAMPEN)
  → Outgoing pulses: 0.95x, unstable
```

## Real-Time Tuning

### Adjust Harmony Influence

```javascript
synapticGating.setHarmonyWeight(0.8)  // Harmony matters more
```
- Higher = Healthy nodes amplify more
- Lower = Health has less effect

### Adjust Corruption Influence

```javascript
// (via setHarmonyWeight combined with harmony-corruption difference)
```

### Adjust Max Amplification

```javascript
synapticGating.setMaxAmplification(1.8)  // Default: 1.6
```
- Higher = Healthy nodes can amplify up to 1.8x
- Lower = Cap amplification lower (1.4x, 1.2x, etc.)

### Adjust Min Dampening

```javascript
synapticGating.setMinDampening(0.3)  // Default: 0.4
```
- Lower = Sick nodes can dampen down to 0.3x
- Higher = Never dampen below certain threshold

### Debug Individual Nodes

```javascript
synapticGating.setDebugMode(true)
// Watch console for 1% sample of node gate computations
// See: "harmony=X, corruption=Y, instability=Z → gateStrength=N"
```

### Check Overall Status

```javascript
synapticGating.getStatus()
```

Shows:
- Current weights
- Amplification/dampening bounds
- Cached nodes count
- Debug mode status

## Console Reference

```javascript
// Control
synapticGating.enable()
synapticGating.disable()

// Tune Weights
synapticGating.setHarmonyWeight(0.4-1.0)      // Default 0.6
synapticGating.setInstabilityWeight(0.1-0.7)  // Default 0.4

// Tune Bounds
synapticGating.setMaxAmplification(1.1-3.0)   // Default 1.6
synapticGating.setMinDampening(0.1-0.9)       // Default 0.4

// Debug
synapticGating.setDebugMode(true/false)
synapticGating.getStatus()
synapticGating.help()
```

## Visual Cues

### Amplification (Green/Bright)
- Outgoing pulses brighter and stronger
- Halo "breathes in" (slightly expands)
- Emissive intensity increases
- **Meaning**: "Node is healthy and strengthening signals"

### Neutral (White/Normal)
- Pulses pass through unchanged
- Minimal halo response
- Normal appearance
- **Meaning**: "Node is balanced"

### Dampening (Red/Dim)
- Outgoing pulses dimmer and weaker
- Halo "breathes out" (slightly contracts)
- Emissive intensity decreases
- **Meaning**: "Node is struggling and weakening signals"

## How Gates Work With Boundary Effects

**Synaptic Gating** decides the **intensity** of boundary effects:

- **Absorption**: How much the node halo brightens
- **Dissipation**: How quickly the pulse fades
- **Reflection**: How strong the rebound pulse is
- **Split**: How many/strong the outgoing splits are

Example:
```
Healthy Hub splits a pulse:
  Gate: +0.6
  Split effect: Creates 2-3 outgoing pulses
  Outgoing strength: 1.3x original
  Result: Hub efficiently routes strong signals

Corrupted Node splits same pulse:
  Gate: -0.4
  Split effect: Creates 1 weak outgoing pulse
  Outgoing strength: 0.8x original
  Result: Node barely distributes signal
```

## Testing

Try these scenarios to see gating in action:

```javascript
// Test 1: Healthy Network
// 1. Create multiple links between high-harmony nodes
// 2. Enable debug: synapticGating.setDebugMode(true)
// 3. Trigger activity (e.g., link creation)
// 4. Watch pulses amplify as they travel through healthy nodes

// Test 2: Stressed Network
// 1. Increase network corruption/instability
// 2. Watch pulses dampen and dissipate faster
// 3. Check console: gates should be negative

// Test 3: Mixed Network
// 1. Create network with healthy hub + corrupted edges
// 2. Watch: Hub amplifies, edges dampen
// 3. Result: Network routes through healthy core

// Test 4: Tune in Real-Time
// 1. Set harmonyWeight high: synapticGating.setHarmonyWeight(0.9)
// 2. Healthy nodes amplify more prominently
// 3. Set it low: synapticGating.setHarmonyWeight(0.3)
// 4. Health matters less, corruption dominates
```

## Understanding Gating Formula

Don't need to memorize, but if curious:

```
gateStrength = (harmony - corruption) × 0.6 - instability × 0.4

High harmony - Low corruption = Positive gate (amplify)
Low harmony - High corruption = Negative gate (dampen)
High instability = Reduces gating effectiveness
Synergy = Scales magnitude but never reverses direction
```

**Key insight**: Network health directly translates to information flow quality.

## Combining With Other Systems

Synaptic Gating works together with:

- **Pulse Boundary Interactions**: Gating scales the intensity
- **Pulse Intersection Adapter**: Gating modulates impulse patterns
- **Pulse Wave Bridge**: Gating affects how far pulses travel
- **Harmonic Hubs**: Gating determines hub efficiency

All systems work together to create **emergent network intelligence** — no UI, pure visuals.

## Troubleshooting

### No gate effects visible?

1. Check enabled:
   ```javascript
   synapticGating.getStatus()  // Should show enabled: true
   ```

2. Verify nodes have state:
   ```javascript
   synapticGating.setDebugMode(true)
   // Should see console messages about harmonies/corruptions
   ```

3. Check bounds aren't too tight:
   ```javascript
   synapticGating.setMaxAmplification(2.0)  // Increase range
   synapticGating.setMinDampening(0.2)      // Increase dampening
   ```

### Gating too subtle?

```javascript
synapticGating.setHarmonyWeight(0.9)       // Make harmony matter more
synapticGating.setMaxAmplification(2.0)    // Increase amplification cap
```

### Gating too extreme?

```javascript
synapticGating.setHarmonyWeight(0.4)       // Make harmony matter less
synapticGating.setMaxAmplification(1.3)    // Lower amplification cap
```

### Want to disable temporarily?

```javascript
synapticGating.disable()
// Do something...
synapticGating.enable()
```

---

**Remember**: Synaptic Gating is purely visual. It tells the story of how the network makes intelligent decisions about signal flow. No UI, no explanations — just watch the network respond to its own state. ⚡🧠

Enjoy your network's decision-making!
