# Harmonic Hub Phase Synchronization
## Cross-Link Pulse Phase Coupling with Deterministic Harmonic Modes

---

## System Overview

**Harmonic Hub Phase Synchronization** transforms multiple links connected to a single node into a coherent energy system. Instead of pulsing independently, connected links synchronize their pulse phases based on the node's health state, creating visible patterns that reflect network coordination.

### Core Philosophy

- **Visual resonance without gameplay changes** — purely visual-only layer
- **Deterministic patterns** — no randomness, fully reproducible rhythms
- **Smooth interpolation** — links gently drift toward synchronization, never snap
- **Health-driven** — synergy/harmony strengthen sync, corruption/instability weaken it
- **Harmonic modes** — link pattern changes based on link count, creating musical rhythms

---

## Harmonic Modes

Links connected to a hub follow one of three harmonic patterns, determined by **link count**:

### 1. **Mirrored Mode** (2 Links)
**Activation**: When hub has exactly 2 active links

**Pattern**: Push-pull oscillation — the two links pulse in opposite phase (180° apart)
- Link 0: Phase offset = 0° (normal)
- Link 1: Phase offset = 180° (opposite)

**Visual Effect**: Alternating energy surges create a "breathing" effect, like two heartbeats in sync

**Use case**: Simple two-node connections feel coordinated without overwhelming

---

### 2. **Standing Wave Mode** (3-4 Links)
**Activation**: When hub has 3 or 4 active links

**Pattern**: Evenly spaced phase offsets creating a standing wave
- 3 links: 120° spacing (0°, 120°, 240°)
- 4 links: 90° spacing (0°, 90°, 180°, 270°)

**Visual Effect**: Energy cascades through links in sequence, creating a visible "wave" rotating around the hub

**Use case**: Medium-complexity networks show sophisticated coordination patterns

---

### 3. **Orbital Mode** (5+ Links)
**Activation**: When hub has 5 or more active links

**Pattern**: Links orbit around the hub phase with gentle sinusoidal motion
- Base angle: Link index × (360° / link count)
- Orbital drift: ±90° sinusoidal motion over time
- Orbital period: ~20 seconds (0.3 rad/s)

**Visual Effect**: A slow, graceful dance of energy flowing through the network, creating an organic "pulse" around the hub

**Use case**: High-complexity networks feel alive and coordinated

---

## Phase Coupling Mechanism

### 1. Hub Phase Computation

```
hubPhase = circularMean(link.phases)
```

The hub computes a circular mean of all connected link pulse phases:

```
sinSum = Σ sin(linkPhase_i) / N
cosSum = Σ cos(linkPhase_i) / N
hubPhase = atan2(sinSum, cosSum)
```

This creates a stable "resonant frequency" that links gradually synchronize toward.

### 2. Harmonic Mode Phase Offset

For each link, compute its harmonic mode offset:

```
phaseOffset = getHarmonicPhaseOffset(linkIndex, linkCount, time)
```

- **Mirrored**: `linkIndex % 2 === 0 ? 0 : π`
- **Standing Wave**: `linkIndex × (2π / linkCount)`
- **Orbital**: `(π/2) × sin(time × 0.3 + baseAngle)`

### 3. Synchronization Strength

Links are gently pulled toward their harmonic phase:

```
linkPhase += shortestPhaseDelta(linkPhase, targetPhase) 
           × syncStrength 
           × deltaTime
```

**Sync strength** depends on node health:

```
syncStrength = (synergy × 0.4) 
             + (harmony × 0.3)
             - (corruption × 0.8)
             - (instability × 0.6)
```

- **Synergy** increases coupling (links move together)
- **Harmony** smooths interpolation (gentler phase drift)
- **Corruption** creates variance (phases desynchronize)
- **Instability** dampens coupling (phases lag behind target)

### 4. Beat Patterns

When corruption/instability are high, intentional desynchronization creates visible "beat" patterns:

```
beatModulation = sin(time × beatFrequency) × beatIntensity × corruption
```

This creates a rhythmic pulsing artifact that visually communicates network illness.

---

## Hub Activation Conditions

A node becomes a harmonic hub only when conditions are met:

```
isHub = activeLinkCount >= 2
     && avgSynergy >= 0.5
     && harmony >= corruption × 1.2
     && instability <= 0.4
```

When conditions fail, synchronization strength **smoothly decays** to zero (not a hard cutoff).

---

## Visual Effects

### Directional Energy Streaks
- **Pulse timing alignment**: Synchronized links have correlated pulse arrival times at the hub
- **Flow coherence**: Reduced phase drift creates a smooth, unified "flow" through the node
- **Color saturation**: Harmonic patterns boost saturation, making sync visible

### Pulse Wave Patterns
- **Synchronized emission**: Pulses emit near the same time for coherent links
- **Cascade triggering**: Arc discharges trigger when phase alignment peaks

### Arc Discharges
- **Rhythmic periodicity**: Become periodic instead of random
- **Intensity modulation**: Intensity correlates with phase coupling strength

---

## Integration

### LinkPulsePhaseSync Integration

The `LinkPulsePhaseSync` system applies harmonic mode offsets during update:

```javascript
// In LinkPulsePhaseSync.update()
const linkIndex = hubController.connectedLinks.findIndex(cl => cl.link === state.link);
const linkCount = hubController.connectedLinks.length;
const harmonicPhaseOffset = hubController.getHarmonicPhaseOffset(linkIndex, linkCount, time);

syncState.targetPhaseOffset = directionOffset + harmonicPhaseOffset + beatModulation;
```

### NodeHarmonicSyncController API

```javascript
// Get the harmonic mode for this hub
const mode = controller.getHarmonicMode(linkCount);
// Returns: 'mirrored' | 'standing-wave' | 'orbital'

// Get phase offset for a specific link
const offset = controller.getHarmonicPhaseOffset(linkIndex, linkCount, time);
// Returns: phase in radians

// Get sync feedback with harmonic data
const feedback = controller.getSyncFeedbackWithTime(linkIndex, time);
// Returns: { syncTargetPhase, harmonicMode, phaseOffset, ... }

// Debug info showing all phase offsets
const debug = controller.getDebugInfo(time);
// Returns: { harmonicMode, phaseOffsets: [offset0, offset1, ...], ... }
```

---

## Configuration

### NodeHarmonicSyncController config

```javascript
{
    // Hub activation thresholds
    minLinksForHub: 3,              // Min links to activate (can be lowered to 2)
    minAverageSynergy: 0.5,         // Min average synergy (0-1)
    harmonyCorruptionRatio: 1.2,   // Harmony must exceed corruption by this factor
    maxInstability: 0.4,             // Max instability to maintain sync
    
    // Sync strength modifiers
    synergyStrengthScale: 0.4,      // How strongly synergy affects sync
    harmonyStrengthBoost: 0.3,      // Harmony bonus to sync strength
    instabilityDamping: 0.5,        // How much instability reduces sync
    linkCountBoost: 0.1,            // Strength increase per extra link
    
    // Phase interpolation
    phaseInterpolationRate: 0.08,   // Speed of phase adjustment (0-1)
    frequencyInterpolationRate: 0.05, // Speed of frequency adjustment
}
```

### Harmonic Mode Parameters

Located in `getHarmonicPhaseOffset()`:

```javascript
// Orbital mode (5+ links)
const orbitSpeed = 0.3;             // Radians per second
const orbitRadius = Math.PI * 0.5;  // Amplitude of orbital drift
```

Tune these to adjust the "dance" speed of high-link-count hubs.

---

## Console API for Testing

### Enable Debug Logging

```javascript
// In your test code:
const hub = myNode.harmonicController;

// Get current state
console.log(hub.getDebugInfo(performance.now() * 0.001));

// Output:
// {
//   nodeId: "n:123",
//   isActive: true,
//   linkCount: 5,
//   harmonicMode: "orbital",
//   phaseOffsets: [0, 1.26, 2.51, 3.77, 5.03],
//   hubPhase: 0.45,
//   hubFrequency: 1.2,
//   hubStrength: 0.75
// }
```

### Simulate State Changes

```javascript
// Force harmonic mode by controlling link counts
hub.connectedLinks = newLinkArray;
hub.update(harmony, corruption, instability);

// Watch phase offsets change as harmonic mode shifts
setInterval(() => {
    console.log(hub.getDebugInfo(performance.now() * 0.001));
}, 100);
```

### Visual Inspection

Look for these patterns when hub is active:

- **Mirrored (2 links)**: Energy alternates between two links
- **Standing Wave (3-4 links)**: Rotating cascade of bright spots
- **Orbital (5+ links)**: Smooth wavelike motion through all links

---

## Safety & Performance

### Zero Per-Frame Allocations
- Phase offsets computed via pure math (no new arrays/objects)
- Harmonic mode lookup via simple if-chain (O(1))
- No garbage collection pressure

### Graceful Degradation
- Missing link data → skipped (no error)
- Hub deactivates cleanly → links decouple smoothly
- Invalid link count → fallback to 'mirrored' mode

### Performance Impact
- ~0.1ms per hub per frame (negligible)
- Scales linearly with hub count, not link count

---

## Expected Visual Behavior

### Healthy Hub (high synergy, high harmony)
- Links pulse in tight synchronization
- Harmonic mode pattern is clearly visible
- Energy flows smoothly through the network
- Subtle saturation boost when in sync

### Corrupted Hub (high corruption, high instability)
- Links desynchronize → visible "beats" / interference patterns
- Harmonic mode becomes less coherent
- Energy appears chaotic rather than coordinated

### Transitioning Hub (activating/deactivating)
- Phase offsets smoothly converge/diverge
- No snapping or sudden jumps
- Corruption/instability gradually reduce sync strength

---

## Troubleshooting

### Harmonic mode not changing with link count
- Check that `getHarmonicMode()` is being called with correct link count
- Verify harmonic mode is stored in `syncState.harmonicMode`

### Phases not synchronizing
- Check hub activation conditions: `minLinksForHub`, synergy threshold, etc.
- Verify `hubController.isActive === true`
- Ensure sync strength is above 0

### Orbital mode appears frozen (not rotating)
- Check `orbitSpeed` parameter (default 0.3 rad/s = ~20s period)
- Verify `time` parameter is incrementing in frame update
- Confirm 5+ links connected to hub

### Beat patterns too strong or not visible
- Adjust `beatIntensity` (default 0.3)
- Check corruption level is high enough to trigger
- Verify beat frequency matches expected rhythm

---

## Next Steps

1. **Audio Sync**: Map harmonic modes to frequency patterns for audio feedback
2. **Visual Indicators**: Add UI overlay showing current harmonic mode
3. **Cascade Integration**: Harmonic modes affect cascade propagation patterns
4. **Adaptive Frequency**: Hubs adjust pulse rate based on synergy/harmony
5. **Phase Visualization**: Debug overlay showing phase relationships
