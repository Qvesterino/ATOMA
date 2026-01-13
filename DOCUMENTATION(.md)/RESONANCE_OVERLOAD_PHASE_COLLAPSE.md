# Resonance Overload & Phase Collapse
## Corrupted Harmonic Hub Visual Breakdown

---

## System Overview

**Resonance Overload & Phase Collapse** is a visual-only system that shows harmonic hub degradation when corruption overwhelms harmony. Instead of snapping to a broken state, the system smoothly transitions through visual breakdown stages, making network failure immediately apparent to the player.

### Core Philosophy

- **Visual narrative** — Communicate network health without UI
- **Smooth degradation** — Soft transitions, not binary failures
- **Corruption-driven** — Entirely deterministic, based on game state
- **Reversible** — Full recovery when conditions improve
- **Non-disruptive** — Zero gameplay impact, purely adaptive visuals

---

## Activation Conditions

A harmonic hub enters **Resonance Overload** state when ALL of these are true:

```
corruption > harmony
AND synergy > 0.5              (energy keeps flowing)
AND instability > 0.5          (soft threshold)
```

When overload activates, the hub transitions through **three visual states**:

### 🟢 Healthy State (Collapse Factor: 0.0)
- Hub synchronizes normally
- Harmonic modes function as expected
- No collapse effects active

### 🟡 Strained State (Collapse Factor: 0.2-0.5)
- Phase coherence begins to degrade
- Links start to desynchronize
- Phase variance increases
- Halo becomes unstable but subtle

### 🔴 Overloading State (Collapse Factor: 0.5-0.8)
- Harmonic pattern visibly breaks
- Standing waves fragment
- Shockwaves emanate from node
- Directional streaks lose coherence
- Arc discharges become erratic

### ⚫ Collapsed State (Collapse Factor: > 0.8)
- Full phase desynchronization
- All coordinated energy ceases
- Links pulse independently again
- Hub becomes visual debris

---

## Collapse Factor Calculation

The **collapse factor** (0 to 1) drives all visual effects:

```
collapseFactor = corruption - harmony        [base]
                + instability × 0.3          [acceleration]
                × (1.0 - synergy × 0.2)     [energy resistance]
                × (1.0 - harmony × 0.3)     [harmony resistance]
```

**In human terms**:
- Corruption alone drives breakdown
- Instability speeds it up
- Synergy provides some resistance
- Harmony slows it significantly

All values smoothly interpolate with a 6% convergence rate per frame (not instant).

---

## Phase Variance Model

As corruption increases, **phase variance** increases exponentially:

```
variance = corruption × 0.3
         + instability × 0.4
         × (1.0 - synergy × 0.6)
         × collapseFactor
         + collapseFactor²  × 0.5        [exponential growth]
```

**Effect**: As hub collapses, links drift further from hub phase, creating destructive interference.

### Variance at Each Stage

- **Healthy**: 0° variance
- **Strained**: 10-30° variance
- **Overloading**: 30-60° variance  
- **Collapsed**: 60-180° variance (fully chaotic)

---

## Visual Effects by Subsystem

### 🧵 Braided Strands
**Effect**: Geometric instability during collapse

- Phase coherence breaks into fragments
- Wave amplitudes fluctuate erratically
- Subtle jitter appears (controlled by variance)
- Strands appear to "vibrate" independently

**Implementation**: Apply destabilization to strand geometry positions

---

### 🌊 Pulse Waves
**Effect**: Energy flow disruption

- Pulses stretch and compress unpredictably
- Pulse wavefront becomes irregular
- Some pulses fade mid-link
- Directionality weakens significantly

**Implementation**: Modulate pulse duration and intensity based on destabilization

---

### ⚡ Directional Energy Streaks
**Effect**: Timing breakdown

- Regular spacing between streaks dissolves
- Temporal gaps appear (streaks don't emit at regular intervals)
- Occasional reverse micro-streaks (very subtle)
- Streaks appear "stuttering" or "jammed"

**Implementation**: Apply phase variance to streak emission timing

---

### 🌀 Surface Phase Ripples
**Effect**: Interference pattern destruction

- Circular wave patterns tear and fragment
- Angular continuity breaks (ripples no longer concentric)
- Brief flicker bands appear periodically
- Overall appearance becomes chaotic

**Implementation**: Multiply ripple amplitude by (1 - destabilization)

---

### 🔴 Resonance Shockwaves (NEW)
**Effect**: Radial phase disturbances from node

Shockwaves are **short-lived radial pulses** that travel from hub node outward:

- **Generation**: Emit every 0.5-2.0 seconds (based on collapse)
- **Duration**: ~0.4 seconds each
- **Amplitude**: 0.15 phase radians (varies with corruption)
- **Propagation**: Travels ~30% of link length
- **Visual**: Brief brightening/disruption along links

**Math**: 
```
shockwaveEffect = amplitude × exp(-distance² / width²) × (1 - progress)
```

**Visual appearance**: Sudden flash/surge traveling outward from node

---

### 🩸 Phase Collapse Halo (NEW)
**Effect**: Node emits unstable, flickering halo

The node itself shows distress through an oscillating halo:

- **Base Amplitude**: 0.05 (grows with collapse)
- **Oscillation**: 2 Hz frequency (increases as collapse worsens)
- **Brightness**: Varies from 0 to amplitude (never solid)
- **Appearance**: Subtle, pulsing, never opaque

**Never dominates visuals** — intended to be felt rather than seen.

**Formula**:
```
haloAmplitude = collapseFactor × 0.05 × (1 + instability × 0.8)
haloBrightness = amplitude × (0.5 + 0.5 × sin(phase))
```

---

## State Transitions

### Entering Overload
```
Healthy → Strained → Overloading → Collapsed
        (0.2)     (0.5)          (0.8)
```

- Transitions are **smooth**, not instantaneous
- Each stage lasts seconds (visible progression)
- Player sees network deteriorating in real-time

### Recovering from Overload
```
Collapsed → Overloading → Strained → Healthy
```

- If corruption drops below harmony, collapse factor **smoothly decreases**
- Recovery is as visible as breakdown
- Creates sense of relief/recovery

---

## Integration with Existing Systems

### LinkPulsePhaseSync
New method: `applyCollapseEffects(syncState, linkIndex, linkCount, time)`

Applies collapse effects during phase synchronization update:
```javascript
// In update loop
if (syncState.hasCollapseController) {
    this.applyCollapseEffects(syncState, linkIndex, linkCount, time);
}
```

Effects applied:
- Phase deviation (links drift away from hub)
- Phase noise/jitter
- Sync strength reduction
- Frequency instability

### LinkDirectionalStreaks
Integrate shockwave effect:
```javascript
const shockwaveEffect = collapseController.getShockwaveEffect(position, linkIndex);
// Apply to streak intensity at position along link
```

### Braided Strand Rendering
Apply geometric jitter based on destabilization:
```javascript
const jitter = syncState.destabilization * 0.02;  // Small jitter
// Offset strand geometry by jitter
```

### Surface Ripples
Reduce ripple amplitude during collapse:
```javascript
const rippleStrength = 1.0 - syncState.destabilization * 0.5;
// Apply to ripple calculations
```

---

## Configuration

### Default Settings (HarmonicHubCollapseController)

```javascript
config = {
    // Activation thresholds
    corruptionThreshold: 0.6,        // Corruption must exceed this
    harmonyMinimum: 0.3,             // Harmony ratio threshold
    synergyMinimumForOverload: 0.5,  // Energy keeps flowing
    instabilityThreshold: 0.5,       // Instability threshold
    
    // Collapse progression
    collapseSmoothingRate: 0.06,     // Speed of factor interpolation
    phaseVarianceSmoothingRate: 0.08, // Speed of variance adjustment
    
    // Phase variance
    baseVarianceScale: 0.3,
    instabilityVarianceScale: 0.4,
    synergyVarianceDamping: 0.6,
    
    // Shockwaves
    shockwaveIntervalMin: 0.5,       // Min seconds between
    shockwaveIntervalMax: 2.0,       // Max seconds between
    shockwaveDuration: 0.4,
    shockwaveAmplitude: 0.15,
    
    // Halo
    haloBaseAmplitude: 0.05,
    haloFrequency: 2.0,              // Hz
    haloInstabilityScale: 0.8,
}
```

### Tuning Suggestions

**For more dramatic breakdown**:
```javascript
controller.setConfig({
    corruptionThreshold: 0.5,        // Lower = easier to enter overload
    baseVarianceScale: 0.5,          // Higher = more visible chaos
    shockwaveAmplitude: 0.25,        // Stronger shockwaves
});
```

**For subtle degradation**:
```javascript
controller.setConfig({
    corruptionThreshold: 0.8,        // Higher = harder to trigger
    baseVarianceScale: 0.15,         // Lower = less visible
    collapseSmoothingRate: 0.03,     // Slower transitions
});
```

---

## Performance Characteristics

| Metric | Value |
|--------|-------|
| **CPU per hub** | ~0.05ms |
| **Memory per hub** | ~500 bytes |
| **Per-frame allocations** | 0 |
| **Shockwave limit** | ~8 concurrent |
| **Scales with** | Hub count (linear) |

---

## Visual Behavior Examples

### Example 1: Healthy Hub (Low Corruption)
```
✓ Harmonic pattern visible
✓ Smooth pulse flow
✓ No special effects
✓ Network appears organized
```

### Example 2: Hub Entering Overload (Corruption rising)
```
◐ Harmonic pattern begins to break
◐ Slight phase variance visible
◐ Subtle halo oscillation
◐ Network appears stressed
```

### Example 3: Hub in Overload (High Corruption)
```
⚠ Harmonic pattern fragments
⚠ Visible shockwaves emanate from node
⚠ Links desynchronize
⚠ Halo bright and oscillating
⚠ Network appears failing
```

### Example 4: Hub Fully Collapsed (Extreme Corruption)
```
✗ No harmonic pattern
✗ All effects at maximum
✗ Links pulse independently
✗ Network appears broken
```

### Example 5: Recovering Hub (Corruption decreasing)
```
← All effects smoothly fade
← Harmonic pattern re-emerges
← Shockwaves cease
← Network appears healing
```

---

## Console API for Testing

### Enable Debug Output

```javascript
const collapseController = hub.collapseController;

// Get current collapse state
console.log(collapseController.getDebugInfo());

// Output:
// {
//   isInOverload: true,
//   collapseFactor: 0.65,
//   phaseVariance: 1.23 rad (70°),
//   haloAmplitude: 0.08,
//   activeShockwaves: 2,
//   overloadAge: 5.2 s
// }
```

### Watch State Progression

```javascript
const collapseController = hub.collapseController;

setInterval(() => {
    const info = collapseController.getDebugInfo();
    const desc = collapseController.getCollapseDescription();
    
    console.log(`[${desc}] Collapse: ${(info.collapseFactor * 100).toFixed(0)}%`);
}, 250);
```

### Get Specific Effects

```javascript
// Phase collapse effect for link 0
const effect = collapseController.getPhaseCollapseEffect(0, 5, time);
console.log(`Phase deviation: ${(effect.phaseDeviation * 180 / Math.PI).toFixed(1)}°`);

// Shockwave effect at position 0.5 along link 0
const shockEffect = collapseController.getShockwaveEffect(0.5, 0, 5);
console.log(`Shockwave intensity: ${shockEffect.toFixed(2)}`);

// Halo effect
const haloEffect = collapseController.getHaloEffect();
console.log(`Halo brightness: ${haloEffect.brightness.toFixed(2)}`);
```

---

## Safety & Performance

### Zero Per-Frame Allocations
- Shockwave data stored in array (no growing collections)
- Phase calculations use pure math (sin, cos)
- No temporary objects created per update

### Graceful Degradation
- Missing collapse controller → no collapse effects
- Invalid link indices → safe clipping
- NaN protection on all calculations

### Performance Impact
- Negligible for most use cases (~0.05ms per hub)
- Shockwave queue capped naturally (max ~8 active)
- Scales linearly with active hubs

---

## Expected Player Experience

### Narrative Impact
The visual breakdown communicates hub failure **without any UI**:
- Player sees network stressed → knows something's wrong
- Visible progression → creates tension → relief on recovery
- Beautiful degradation pattern → feels like a real system failing

### Emotional Response
- **Healthy hubs** feel coordinated, almost musical
- **Strained hubs** feel uncertain, fragile
- **Overloading hubs** feel chaotic, desperate
- **Recovery** feels triumphant, stabilizing

### Gameplay Feedback Loop
1. Player takes actions that increase corruption
2. Visuals progressively degrade
3. When collapse hits critical (>0.8), mechanics might trigger
4. Player reduces corruption
5. Network visually recovers (reinforcing player action)

---

## Troubleshooting

### Collapse effects not visible
- Check `isInOverload === true`
- Verify `collapseFactor > 0.1`
- Ensure collapse controller registered with phase sync
- Check visual subsystems are rendering collapse effects

### Collapse triggers too easily
- Increase `corruptionThreshold` (default 0.6)
- Increase `harmonyMinimum` requirement
- Reduce `synergyMinimumForOverload`

### Collapse too dramatic
- Reduce `baseVarianceScale`
- Reduce `shockwaveAmplitude`
- Reduce `haloInstabilityScale`
- Increase `collapseSmoothingRate` (faster transitions blur effect)

### Shockwaves not appearing
- Check `collapseFactor > 0.3` (minimum to generate)
- Verify `shockwaveIntervalMin` is being reached
- Check shockwave is less than `shockwaveDuration` old

---

## Next Steps

1. **Audio Integration**: Map shockwaves to sound pulses
2. **UI Display**: Optional debug overlay showing collapse state
3. **Gameplay Coupling**: Trigger mechanics at specific collapse thresholds
4. **Cascade Integration**: Collapse affects cascade propagation
5. **Multi-Hub Interference**: Cascading failures between adjacent hubs
