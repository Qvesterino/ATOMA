# Pulse Boundary Interactions — Quick Start Guide

## What It Does

When energy pulses reach node endpoints, they interact with the node based on network state. The network visually "tells a story" about whether it's healthy, unstable, chaotic, or resonant.

## Four Interaction Modes

### 🟢 Absorption (Healthy)
- **When**: Network is harmonious and stable
- **Visual**: Node halo glows and intensifies
- **Feel**: Energy being "swallowed" productively

### 🔴 Dissipation (Unstable)
- **When**: Network is unstable or weak
- **Visual**: Pulse fades with heat haze flicker near endpoint
- **Feel**: Energy "leaking" or being lost

### 🟡 Reflection (Chaotic)
- **When**: High corruption + medium instability (rare)
- **Visual**: Weaker pulse rebounds back, glowing amber
- **Feel**: Network "rejecting" the energy
- **Note**: Max 1 reflection (prevents bouncing)

### 🔵 Split (Hub Routing)
- **When**: Harmonic hub with high synergy
- **Visual**: Energy branches into other connected links
- **Feel**: Intelligent energy routing through network

## Real-Time Tuning

### Adjust Reflection Strength
```javascript
pulseBoundary.setReflectionAmplitude(0.5)  // Default 0.45
```
- Lower = weaker rebounds
- Higher = stronger rebounds (max 0.8)

### Enable Debug Logging
```javascript
pulseBoundary.setDebugMode(true)
```
See console messages showing which mode fired, where, and why.

### Check Current Status
```javascript
pulseBoundary.getStatus()
```
Shows active effects, durations, mode counts, etc.

### Toggle On/Off
```javascript
pulseBoundary.disable()  // Turn off temporarily
pulseBoundary.enable()   // Turn back on
```

### Full API
```javascript
pulseBoundary.help()
```

## Understanding the Behavior

### Why does this mode appear?

Use debug mode to see:
```javascript
pulseBoundary.setDebugMode(true)
// Then watch console as pulses reach boundaries
// You'll see messages like:
// [PulseBoundaryInteraction] absorption: link=xyz, node=abc, amplitude=0.75
```

### Triggering Each Mode

**Absorption** (smooth): Create healthy links with high synergy  
**Dissipation** (fading): Let network stress build (corruption/instability)  
**Reflection** (rebound): Push network to high corruption + medium chaos  
**Split** (routing): Link harmonic hubs together with high synergy flow  

## Visual Design Principles

The system uses **no UI overlays** — the network itself communicates state:

| Network State | Visual Pattern | Meaning |
|---|---|---|
| Healthy, harmonious | Bright, smooth absorption | Everything flowing well |
| Stressed, unstable | Heat haze dissipation | Network losing energy |
| Corrupted, chaotic | Amber reflections | Network fighting back |
| Resonant hub | Energy splitting out | Smart routing active |

## Performance

- Negligible overhead (<0.3ms per frame)
- Works smoothly at 60+ FPS
- Scales with link count (not pulse count)

## Troubleshooting

### No boundary effects visible?

1. Check system is enabled:
   ```javascript
   pulseBoundary.getStatus()  // Should show enabled: true
   ```

2. Enable debug to see what's happening:
   ```javascript
   pulseBoundary.setDebugMode(true)
   ```

3. Verify pulses exist in network:
   - Make sure links have active waves
   - Check network metrics show wave activity

### Wrong mode appearing?

Run debug mode to see why:
```javascript
pulseBoundary.setDebugMode(true)
// Console will show:
// "absorption: link=X, node=Y, amplitude=0.75"
// Including which state metrics drove the decision
```

The decision is deterministic based on:
- Pulse harmony/synergy/corruption
- Node instability
- Hub status (if applicable)

### Want to adjust visual intensity?

```javascript
pulseBoundary.setReflectionAmplitude(0.3)  // Weak
pulseBoundary.setReflectionAmplitude(0.7)  // Strong
```

This affects reflection amplitude only. Absorption/dissipation/split scale automatically with network state.

## Console Reference

```javascript
// Control
pulseBoundary.enable()
pulseBoundary.disable()

// Tune
pulseBoundary.setReflectionAmplitude(0-0.8)

// Debug
pulseBoundary.setDebugMode(true/false)
pulseBoundary.getStatus()
pulseBoundary.help()
```

## What You'll See

When pulses reach nodes:

1. **Smooth, bright absorption**: Node halo glows, energy cleanly absorbed
2. **Flickering dissipation**: Pulse fades with heat-haze effect at endpoint
3. **Amber reflection**: Weaker pulse bounces back (rare, looks "sick")
4. **Energy split**: Multiple weaker pulses branch from hub into other links

All effects are **transient** — they last 100-180ms then fade.

## Watching It Happen

Best way to observe:

1. Open browser console
2. Create several linked nodes
3. Wait for or trigger wave activity
4. Watch pulses reach node boundaries
5. Observe how boundary behavior changes based on network state
6. Toggle debug mode to understand why each behavior occurred

```javascript
// Watch boundary effects in realtime
pulseBoundary.setDebugMode(true)
// Now create links and trigger activity
// Console will narrate each boundary interaction
```

## Combining Systems

The boundary system works together with:

- **WaveInterferenceEngine**: Provides wave physics (amplitude, phase)
- **PulseWaveSystemBridge**: Converts waves to pulse positions
- **PulseIntersectionAdapter**: Fires neural impulses along links
- **PulseBoundaryInteractionAdapter** ← YOU ARE HERE

Together they create a complete "living nervous system" experience.

---

**Tip**: Network state is always visible through energy behavior. No UI needed!

Enjoy your network's story. ⚡🧠
