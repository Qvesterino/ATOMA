# ATOMA Cascade System Runtime State

## Overview

This document provides a comprehensive audit of all cascade-related systems and their runtime states.

## Systems Analyzed

### 1. CascadingHarmonicResonanceAmplification (harmonyCascade)

**File:** [`CascadingHarmonicResonanceAmplification.js`](CascadingHarmonicResonanceAmplification.js)

**Initialization:**
- Location: [`main.js:3551`](main.js:3551)
- Lazy-init in FrameScheduler callback
- Stored in: `this.harmonyCascade`

**FrameScheduler Registration:**
- ID: [`'simulation.harmonyCascade'`](main.js:3548)
- Layer: `simulation` (10 Hz)
- Update method: [`this.harmonyCascade.update(dt)`](main.js:3569)

**Status:** ✅ **ACTIVE**
- Instantiated: Yes
- Stored in game/context: Yes
- Update loop: Yes (via FrameScheduler)
- Runtime: Active and updating

---

### 2. CascadingRuptureSystem (cascadingRuptures)

**File:** [`CascadingRuptureSystem.js`](CascadingRuptureSystem.js)

**Initialization:**
- Location: [`main.js:11621`](main.js:11621)
- Stored in: `this.cascadingRuptures`
- Console message: "DISABLED BY DEFAULT - Enable via console: game.cascadingRuptures.enable()"

**FrameScheduler Registration:**
- Not found (system appears to be event-driven only)

**Status:** ⚠️ **PASSIVE**
- Instantiated: Yes
- Stored in game/context: Yes
- Update loop: No (event-driven, not registered in FrameScheduler)
- Runtime: Instantiated but disabled by default
- Note: Can be enabled via console: `game.cascadingRuptures.enable()`

---

### 3. CascadeParticleSystem_Session120 (cascadeParticleSystem)

**File:** [`CascadeParticleSystem_Session120.js`](CascadeParticleSystem_Session120.js)

**Initialization:**
- Location: [`main.js:8854`](main.js:8854)
- Stored in: `this.cascadeParticleSystem`
- Console message: "CascadeParticleSystem initialized ✓"

**FrameScheduler Registration:**
- ID: [`'visual.cascadeParticleSystem'`](main.js:3972)
- Layer: `visual` (30 Hz)
- Update method: [`this.cascadeParticleSystem.update(dt, this.time)`](main.js:3974)

**Status:** ✅ **ACTIVE**
- Instantiated: Yes
- Stored in game/context: Yes
- Update loop: Yes (via FrameScheduler)
- Runtime: Active and updating
- Features:
  - Emits cascade particles
  - Emits `cascade.hop` events (0.3s cooldown per link)
  - Reads from `flowState.intensity` and `flowState.type`

---

### 4. HarmonicCascadeAmplification_Session145 (harmonicCascadeAmplification)

**File:** [`HarmonicCascadeAmplification_Session145.js`](HarmonicCascadeAmplification_Session145.js)

**Initialization:**
- Location: [`main.js:12252`](main.js:12252)
- Stored in: `this.harmonicCascadeAmplification`
- Init method called: [`this.harmonicCascadeAmplification.init()`](main.js:12263)
- Console message: "✓ Harmonic Cascade Amplification System (Session 145) initialized"

**FrameScheduler Registration:**
- Not found (system is called via tick function, not registered directly)

**Update Loop:**
- Tick function: [`harmonicCascadeAmplificationTick(deltaTime)`](main.js:9069)
- Called from: [`main.js:3838`](main.js:3838) (realtime layer)
- Update method: [`this.harmonicCascadeAmplification.update(deltaTime)`](main.js:9071)

**Status:** ✅ **ACTIVE**
- Instantiated: Yes
- Stored in game/context: Yes
- Update loop: Yes (via tick function called from FrameScheduler)
- Runtime: Active and updating
- Note: Uses tick function wrapper, not direct FrameScheduler registration

---

## Summary Table

| System | Variable Name | Instantiated | Stored | FrameScheduler ID | Update Loop | Status |
|--------|---------------|-------------|--------|-------------------|-------------|--------|
| CascadingHarmonicResonanceAmplification | haromyCascade | ✅ | ✅ | simulation.harmonyCascade | ✅ | **ACTIVE** |
| CascadingRuptureSystem | cascadingRuptures | ✅ | ✅ | None | ❌ | **PASSIVE** |
| CascadeParticleSystem_Session120 | cascadeParticleSystem | ✅ | ✅ | visual.cascadeParticleSystem | ✅ | **ACTIVE** |
| HarmonicCascadeAmplification_Session145 | harmonicCascadeAmplification | ✅ | ✅ | None (via tick) | ✅ | **ACTIVE** |

## Legend

- **ACTIVE:** System is instantiated, stored in game/context, and has an active update loop
- **PASSIVE:** System is instantiated and stored but has no update loop (event-driven or disabled)
- **DEAD:** System is never instantiated or created

## Key Findings

1. **No Ghost Systems:** All cascade systems are properly instantiated and stored
2. **Three Active Systems:** CascadingHarmonicResonanceAmplification, CascadeParticleSystem, HarmonicCascadeAmplification_Session145
3. **One Passive System:** CascadingRuptureSystem (disabled by default)
4. **Cascade Event Flow:**
   - Events trigger flowState updates via CascadeEventBridge
   - CascadeParticleSystem reads flowState and emits particles
   - CascadeParticleSystem emits `cascade.hop` events for visualization
   - CascadeEventBridge generates wave bursts via WaveInterferenceEngine

## Related Systems

- [`CascadeEventBridge_v1.js`](CascadeEventBridge_v1.js) - Event bridge that updates flowState
- [`CascadeResonanceWaveVisualization_Session146.js`](CascadeResonanceWaveVisualization_Session146.js) - Visualizes cascade hops
- [`WaveInterferenceEngine_v1.js`](WaveInterferenceEngine_v1.js) - Generates wave bursts

---

*Document Version: 1.0.0*  
*Last Updated: 2026-03-18*  
*Author: ATOMA VFX Technical Director*
