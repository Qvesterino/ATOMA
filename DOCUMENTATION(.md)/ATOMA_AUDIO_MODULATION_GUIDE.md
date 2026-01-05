# ATOMA Audio Modulation System (Session 142+)

## Overview

The **Audio Modulation System** is a three-layer intelligent audio enrichment engine that responds to real-time network metrics. It does not create new sounds, but rather modulates the parameters of existing audio to reflect the system's internal state.

**Design Philosophy**:
- No volume spikes or jarring changes
- Subtle, perceptual shifts that build emotional resonance
- Pure read-only observation of network state
- ~0.3ms per frame performance budget
- All optional features; graceful no-op if dependencies missing

---

## Architecture

### Three Modulation Layers

#### Layer 1: SYNERGY MODULATION (Local Coherence)
**What it responds to**: Local node alignment (0-100%)

**Audio behaviors**:
- **Harmonic Clarity**: High-pass filter with dynamic Q resonance
  - Low synergy: flat, neutral response (Q=0.5)
  - High synergy: sharp peak at clarity frequency (Q=3.0)
  - Frequency slowly sweeps up (250→550 Hz) as synergy increases
- **Stereo Width**: Audio image naturally widens through filter modulation + reverb processing
  - Filter movement creates spatial perception
  - Reverb tail spreads sound field
  - Sub-bass anchor keeps coherence centered
- **Sub-bass Reinforcement**: Periodic 50Hz tone when synergy > 0.4
  - Acts as harmonic anchor/foundation
  - Volume: -35 to -20 dB (very subtle)
  - Triggered every 2 seconds at high synergy

**Emotional result**: "The system is thinking more clearly here"

---

#### Layer 2: HARMONY MODULATION (Global Stability)
**What it responds to**: Overall network stability/archetype compatibility (0-100%)

**Audio behaviors**:
- **LFO Motion**: Slow ambient motion driver
  - High harmony: slow, meditative (0.08 Hz - 2.5 octave cycles)
  - Low harmony: faster, searching (0.35 Hz - 1.4 second cycles)
  - LFO modulates filter cutoff continuously
- **Filter Cutoff**: Spectral balance
  - High harmony: bright, open (10 kHz cutoff, spacious)
  - Low harmony: duller, constrained (5 kHz cutoff, introspective)
- **Filter Q**: Slope aggression
  - High harmony: gentle rolloff (Q=0.5)
  - Low harmony: sharper cutoff (Q=1.5)
- **Ambient Noise**: Subtle pink noise layer
  - Increases slightly when harmony is low (uncertainty texture)
  - Range: -42 dB (high harmony) to -38 dB (low harmony)

**Emotional result**: "The system is stable and aware" / "The system is searching for balance"

---

#### Layer 3: CORRUPTION MODULATION (Systemic Entropy)
**What it responds to**: Void/umbra influence and systemic entropy (0-100%)

**Audio behaviors**:
- **Phase Instability**: Continuous oscillating phase shift
  - Frequency of oscillation driven by corruption level
  - Creates subtle unpredictability without glitches
  - Range: 0 to 0.3 radians
- **Texture Noise**: Brownian motion noise bursts
  - Low corruption: silent
  - High corruption: gentle, irregular texture events
  - Burst timing: random intervals increasing with corruption
- **Noise Volume**: Gentle rise in entropy texture
  - Low corruption: -48 dB (nearly inaudible)
  - High corruption: -42 dB (subtle background texture)

**Emotional result**: "The system is losing coherence, quietly" / "Subtle uncertainty"

**Important**: No distortion, glitches, or horror tropes. Only gentle unpredictability.

---

## Integration

### Initialization
```javascript
// In main.js constructor:
this.audioSystem = new AtomaAudioSystem();
this.audioModulation = new AtomaAudioModulation(this.audioSystem);
```

### Update Loop
```javascript
// In main.js animate():
if (this.audioModulation && this.coreMetricsOverlay) {
    this.audioModulation.update(
        deltaTime,
        this.coreMetricsOverlay.currentMetrics
    );
}
```

### Metrics Input
The system reads from `CoreMetricsOverlay.currentMetrics`:
```javascript
{
    synergy: 0-100,        // Local alignment (Layer 1)
    harmony: 0-100,        // Global stability (Layer 2)
    corruption: 0-100,     // System entropy (Layer 3)
    instability: 0-100,    // (unused by modulation)
    networkLoad: 0-100     // (unused by modulation)
}
```

---

## Console API

### Enable/Disable Modulation
```javascript
window.toggleAudioModulation()  // Toggle on/off
```

### Check Status
```javascript
window.audioModulationStatus()  // Show current values + description
```

### Test All Layers
```javascript
window.testAudioModulation()    // Simulate 0→1→0 for each layer
```

---

## Audio Routing

All modulation synths connect through the master reverb/limiter chain:
```
Synergy Synth       )
Harmony Noise Layer ) → Master Reverb (1.5s decay, 15% wet) → Master Limiter (-1dB) → Output
Corruption Noise    )
```

This ensures modulation textures remain coherent with the main audio system.

---

## Performance

- **Per-Frame Cost**: ~0.3ms at 60fps
- **Memory**: ~50KB for synth instances
- **CPU**: Negligible when disabled
- **Smoothing Constants**: 
  - Synergy: 0.15 (responsive, ~150ms settling)
  - Harmony: 0.10 (slower, ~300ms settling)
  - Corruption: 0.12 (medium, ~200ms settling)

---

## Design Rationale

### Why Three Layers?

1. **Synergy (Local)**: Reflects immediate network coherence
   - Perceivers at node level; most reactive
   - Drives emotional "clarity" and "focus"

2. **Harmony (Global)**: Reflects system-wide balance
   - Operates at network scale; slower timescale
   - Drives emotional "stability" and "peace/restlessness"

3. **Corruption (Systemic)**: Reflects entropy accumulation
   - Operates at fundamental level; most abstract
   - Drives emotional "ambiguity" and "uncertainty"

### Why No Volume Changes?

Volume spikes create perception of "error" or "alarm" in audio. The modulation system uses:
- Frequency filtering (subtle, intelligent)
- Phase modulation (transparent, natural)
- Texture addition (contextual, not intrusive)
- LFO motion (meditative, non-reactive)

This keeps the listener in a state of observation, not alert.

### Why Smoothing?

Direct metric-to-parameter mapping creates jitter. Exponential smoothing provides:
- Perceptually smooth transitions
- Prevents feedback artifacts
- Maintains audio quality
- Reduces CPU load (parameter changes amortized)

---

## Testing Workflow

### 1. Check System Status
```javascript
window.audioModulationStatus()
```

### 2. Test Layers Individually
```javascript
// Create high synergy, normal harmony, no corruption
window.game.audioModulation.smoothedSynergy = 0.8;
window.game.audioModulation.smoothedHarmony = 0.5;
window.game.audioModulation.smoothedCorruption = 0;
```

### 3. Watch Network in Real-Time
As you create/destroy links and nodes, observe:
- Audio clarity increasing/decreasing (synergy)
- Filter motion speeding up/slowing down (harmony)
- Subtle texture changes (corruption)

### 4. Compare With/Without
```javascript
window.toggleAudioModulation()  // Off
// (Network is quiet, boring)

window.toggleAudioModulation()  // On
// (Audio enriches with network state)
```

---

## Future Enhancements

- [ ] Visualize modulation state with spectrum analyzer overlay
- [ ] Add per-node modulation layers (spatial audio)
- [ ] Extended corruption modulation: harmonic decay curves
- [ ] Harmony-driven reverb decay modulation
- [ ] Synergy-driven link audio markers

---

## Summary

**ATOMA Audio Modulation** creates an intelligent, responsive audio environment that mirrors the network's internal state without resorting to gamey or artificial soundscapes. The three layers work in concert to communicate:

- **Clarity** (synergy) — "thinking"
- **Stability** (harmony) — "aware"
- **Ambiguity** (corruption) — "uncertain"

All reinforces the core ATOMA design philosophy: **the system feels alive, temporary, and conscious**.
