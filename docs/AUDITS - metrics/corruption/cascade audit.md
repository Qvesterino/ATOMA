# ATOMA CASCADE SYSTEM INVENTORY AUDIT

## EXECUTIVE SUMMARY
Audit completed. Identified 6 cascade-related systems in the codebase. Two systems from the task list (CascadePropagationVisuals, CascadeVisualizationBridge) do not exist.

---

## ACTIVE CASCADE SYSTEMS

### 1. **CascadingRuptureSystem** (Core Gameplay System)
**File:** `CascadingRuptureSystem.js`  
**Status:** ACTIVE - Instantiated as `game.cascadingRuptures` in main.js  
**Purpose:** Manages rupture energy propagation across network regions under high corruption/low stability conditions.  
**Integration:** 
- Not registered in FrameScheduler
- Updated directly in main.js loop
- Console API integration via CascadeSystemConsoleAPI

**Key Functionality:**
- Automatic cascade detection based on corruption/stability thresholds
- Propagation follows network topology with energy decay per hop
- Triggers visual effects: `tear`, `destabilize`, `coherence_loss`
- Can trigger CriticalNodeFailureSystem via `onNodeCritical` callback
- Max 8 simultaneous cascades, max 3 hops depth

---

### 2. **CascadeParticleSystem_Session120** (Visual System)
**File:** `CascadeParticleSystem_Session120.js`  
**Status:** ACTIVE - Instantiated as `game.cascadeParticleSystem` in main.js  
**Purpose:** Three.js particle system for visualizing cascade events.

**Key Functionality:**
- Spawns particles from link endpoints
- Particle emission rate scaling
- Velocity/movement along link direction
- Supports emission boost and color tinting

**Dependencies:**
- `CascadeParticleEmissionBoost_Session118` (instantiated separately)
- `CascadeParticleColorTinting_Session119` (instantiated separately)

---

### 3. **CascadeParticleEmissionBoost_Session118** (Visual Enhancement)
**File:** `CascadeParticleEmissionBoost_Session118.js`  
**Status:** ACTIVE - Instantiated as `game.emissionBoost` in main.js  
**Purpose:** Dynamically adjusts particle emission rate based on system state (synergy, corruption, stability).

**Key Functionality:**
- Modifies emission rate based on 3 metrics
- `emissionRate = baseRate × (1 + synergyBonus + corruptionModifier + stabilityModifier)`
- Synergy increases emission
- Corruption increases emission
- Low stability increases emission

---

### 4. **CascadeParticleColorTinting_Session119** (Visual Enhancement)
**File:** `CascadeParticleColorTinting_Session119.js`  
**Status:** ACTIVE - Instantiated as `game.cascadeParticleColorTinting` in main.js  
**Purpose:** Dynamically adjusts particle colors based on node metrics.

**Key Functionality:**
- Tints particles based on corruption (0.0-1.0)
- Uses HSV color interpolation
- Low corruption: cyan/blue
- High corruption: orange/red
- Applies color in `update()` loop

---

### 5. **CascadeResonanceWaveVisualization_Session146** (Harmonic Visual System)
**File:** `CascadeResonanceWaveVisualization_Session146.js`  
**Status:** ACTIVE - Instantiated as `game.cascadeResonanceWave` in main.js  
**Purpose:** Visualizes harmonic resonance waves propagating across the network.

**Key Functionality:**
- Wave-based visualization (not particles)
- Visualizes resonance propagation
- Separate from CascadingRuptureSystem's particle effects
- Likely tied to HarmonicCascadeAmplification_Session145

---

### 6. **CascadeSystemConsoleAPI** (Developer Tool)
**File:** `CascadeSystemConsoleAPI.js`  
**Status:** ACTIVE - Setup function called in main.js  
**Purpose:** Provides console commands for debugging/testing cascade systems.

**Commands Available:**
- `game.enableCascades()` / `game.disableCascades()`
- `game.enableNodeFailure()` / `game.disableNodeFailure()`
- `game.cascadeStatus()` - Show active cascades
- `game.triggerCascade(nodeIndex)` - Manual cascade trigger
- `game.listCriticalNodes()` - List nodes near failure

---

## LEGACY SYSTEMS

None identified. All cascade systems found are active and instantiated.

---

## DUPLICATE SYSTEMS

### Potential Overlap: CascadeVisualization vs CascadingRupture

**CascadeParticleSystem_Session120 + CascadingRuptureSystem**
- **Overlap:** Both create visual effects for cascade events
  - CascadingRuptureSystem: Creates `CascadeVisualEffect` with phase/tear/coherence_loss effects
  - CascadeParticleSystem: Creates Three.js particles

- **Differentiation:**
  - CascadingRuptureSystem: Structural/mechanical visuals (phase destabilization, link tearing)
  - CascadeParticleSystem: Decorative particle effects
  - They complement each other rather than duplicate

**CascadeResonanceWaveVisualization vs CascadingRuptureSystem**
- **Overlap:** Both visualize cascade-like propagation
  - CascadeResonanceWave: Harmonic resonance waves
  - CascadingRupture: Rupture energy propagation

- **Differentiation:**
  - Different trigger conditions (harmony vs corruption/stability)
  - Different visual styles (waves vs particles/phase effects)
  - Separate semantic purposes (amplification vs rupture)

---

## SYSTEMS FROM TASK LIST THAT DO NOT EXIST

1. **CascadePropagationVisuals** - NOT FOUND
2. **CascadeVisualizationBridge** - NOT FOUND

These may have been planned but never implemented, or renamed/deprecated.

---

## RECOMMENDED PRIMARY CASCADE SYSTEM

**Primary:** **CascadingRuptureSystem** (gameplay mechanics + core visuals)

**Supporting Visuals:**
- **CascadeParticleSystem_Session120** for particle effects (recommended for use with CascadingRuptureSystem)
- **CascadeParticleEmissionBoost_Session118** for dynamic emission control
- **CascadeParticleColorTinting_Session119** for metric-based coloring

**Separate System:**
- **CascadeResonanceWaveVisualization_Session146** (harmonic resonance, distinct from corruption cascades)

---

## INTEGRATION NOTES

- **FrameScheduler Registration:** None of the cascade systems are registered in FrameScheduler
- **Event Triggers:** No external systems trigger cascades programmatically (only via Console API)
- **Update Loop:** All systems updated directly in main.js
- **Inter-system Communication:** Limited - no direct wiring found between cascade systems and other gameplay systems

---

## OBSERVATION

The cascade visual systems (CascadeParticleSystem + enhancements) appear to be designed to work with CascadingRuptureSystem but currently have no wired connection. The particle system has `trigger()` and `spawnParticles()` methods that are never called in the codebase, suggesting incomplete integration.

This suggests the cascade particle visual layer exists but is not automatically triggered by the CascadingRuptureSystem events.