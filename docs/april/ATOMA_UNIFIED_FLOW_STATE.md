# ATOMA Unified Flow State

## Overview

This document describes the unified flow state concept that integrates cascade, waves, and beads into a single "flow" concept on links.

## Flow State Structure

Each link has a `link.userData.flowState` object that serves as the single source of truth for all visual systems:

```javascript
link.userData.flowState = {
  intensity: 0.0,        // For cascade particles and beads
  direction: 1.0,         // For waves and beads (1 = forward, -1 = backflow)
  type: 'resolved_harmony', // For cascade particles (conflict type)
  energy: 0.0             // For waves (continuous field energy)
}
```

## System Responsibilities

### Cascade Particles (Discrete Events)
**Reads from:** `flowState.intensity + flowState.type`

**System:** [`CascadeParticleSystem_Session120.js`](CascadeParticleSystem_Session120.js:383-390)

**Behavior:**
- Emits particles based on intensity threshold
- Uses `type` to determine particle shape (conflict encoding)
- Higher intensity = more particles
- Different types = different visual representations

### Waves (Continuous Field)
**Reads from:** `flowState.energy + flowState.direction`

**Systems:** 
- [`WaveInterferenceEngine_v1.js`](WaveInterferenceEngine_v1.js)
- [`PulseWaveSystemBridge_v1.js`](PulseWaveSystemBridge_v1.js)
- [`StandingWaveOscillationTrapSystem_Session130.js`](StandingWaveOscillationTrapSystem_Session130.js)
- [`WaveInterferencePatternSystem_Session132.js`](WaveInterferencePatternSystem_Session132.js)

**Behavior:**
- Energy drives wave amplitude/intensity
- Direction determines wave propagation direction
- Continuous field representation (not discrete particles)

### Beads (Carriers/Transport)
**Reads from:** `flowState.direction + flowState.intensity`

**Systems:**
- [`LinkBeadSystem.js`](LinkBeadSystem.js)
- [`LinkBeadTrailSystem.js`](LinkBeadTrailSystem.js)

**Behavior:**
- Direction determines bead movement direction
- Intensity influences bead spawn rate and size
- Beads act as visual carriers along the link

## Event Mapping

Events from [`SemanticEventBus`](main.js:1075) are mapped to flow state by [`CascadeEventBridge_v1.js`](CascadeEventBridge_v1.js):

| Event | intensity | type | energy | direction |
|--------|-----------|------|--------|-----------|
| `node.synergy.high` | max(current, 0.7) | 'specialization_drift' | unchanged | 1.0 |
| `metric:corruptionRise` | max(current, 0.9) | 'corruption' | max(current, 0.8) | 1.0 |
| `link:collapsed` | 1.0 | 'destructive' | 1.0 | -1.0 |
| `node.hover` | max(current, 0.3) | 'oscillatory_balance' | max(current, 0.4) | 1.0 |

## Decay Mechanism

Flow state values decay over time to prevent frozen effects:

- **intensity:** Multiplies by 0.92 per frame (30 Hz on visual layer)
- **energy:** Multiplies by 0.97 per frame (slower decay for continuous field)
- Values reset to 0 when below 0.01 threshold

Implemented in [`CascadeEventBridge_v1.js`](CascadeEventBridge_v1.js:247-297)

## Integration Status

### ✅ Completed
- [x] Flow state structure defined in [`NodeLinkingSystem.js`](NodeLinkingSystem.js:3652-3659)
- [x] CascadeParticleSystem reads from flowState
- [x] CascadeEventBridge writes to flowState
- [x] Decay mechanism implemented
- [x] Backward compatibility maintained (legacy properties updated)

### 🔄 Future Work
- [ ] Update wave systems to read from `flowState.energy` and `flowState.direction`
- [ ] Update bead systems to read from `flowState.direction` and `flowState.intensity`
- [ ] Remove legacy cascade properties after migration complete

## Benefits

1. **Single Source of Truth:** All visual systems read from the same flow state
2. **Unified Behavior:** Cascade, waves, and beads respond to the same events
3. **Consistent Decay:** All effects fade naturally over time
4. **Easier Maintenance:** Changes to flow behavior only need to be made in one place
5. **Living Energy Channels:** Links appear as dynamic, living energy conduits

## Backward Compatibility

Legacy properties are maintained for compatibility:
- `link.userData.cascadeIntensity` = `flowState.intensity`
- `link.userData.cascadeConflictType` = `flowState.type`

Systems can be gradually migrated to read from `flowState` directly.

## Usage Example

```javascript
// Reading from flow state in a visual system
const flowState = link.userData.flowState || {};
const intensity = flowState.intensity ?? 0;
const direction = flowState.direction ?? 1.0;
const type = flowState.type ?? 'resolved_harmony';
const energy = flowState.energy ?? 0;

// Use values for visual calculations
if (intensity > 0.5) {
  // Spawn more particles
}

if (direction < 0) {
  // Reverse bead movement
}

if (energy > 0.3) {
  // Increase wave amplitude
}
```

## Related Files

- [`CascadeEventBridge_v1.js`](CascadeEventBridge_v1.js) - Event bridge that updates flow state
- [`CascadeParticleSystem_Session120.js`](CascadeParticleSystem_Session120.js) - Cascade particle system
- [`NodeLinkingSystem.js`](NodeLinkingSystem.js) - Link creation with flow state initialization
- [`main.js`](main.js) - Integration and initialization

---

*Document Version: 1.0.0*  
*Last Updated: 2026-03-18*  
*Author: ATOMA VFX Technical Director*
