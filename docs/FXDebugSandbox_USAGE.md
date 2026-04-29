# FXDebugSandbox - VFX Debug Spawn Interface

**Created:** 2026-03-06  
**Purpose:** Console-accessible testing interface for all VFX systems

---

## Overview

FXDebugSandbox provides instant console access to spawn and test any VFX system in ATOMA without modifying the main application architecture. It's designed for rapid visual debugging and experimentation.

---

## Quick Start

### 1. Initialization (Automatic)

The sandbox initializes automatically when ATOMA starts:
- Imports all VFX systems
- Creates `window.FX` object in browser console
- Initializes with scene and renderer

Check initialization in console:
```javascript
FX.listActive()
```

---

## Usage - Quick Access Methods

### Short Aliases (Fastest)

```javascript
FX.harmony()      // Spawn healing particles
FX.cascade()      // Spawn cascade particles
FX.wave()         // Spawn wave particles
FX.trail()        // Spawn link trail particles
FX.spark()        // Spawn link sparks
FX.halo()         // Spawn resonance halos
```

### Spawn Object (More Control)

```javascript
// Available spawn methods
FX.spawn.particles()
FX.spawn.waves()
FX.spawn.cascade()
FX.spawn.healing()
FX.spawn.corruption()
FX.spawn.resonance()
FX.spawn.ripples()
FX.spawn.interference()
FX.spawn.standingWave()
FX.spawn.sparks()
FX.spawn.halos()

// Spawn everything
FX.spawnAll()
```

---

## Usage - Full Method List

### Particle Systems

```javascript
// Link Trail Particles - Organic particle trails along links
FX.spawnLinkTrailParticles({ maxLinks: 100, particlesPerLink: 20 })

// Wave Particle Emitter - 3 particle families for wave interference
FX.spawnWaveParticleEmitter({ 
  maxParticlesPerFamily: 2000, 
  emissionRate: 1.0,
  debugMode: true 
})

// Healing Particles - Healing sparkles and scar dissipation
FX.spawnHealingParticles()

// Cascade Particles - Cascade particle emission along links
FX.spawnCascadeParticles({ 
  maxParticles: 3000, 
  baseSize: 4.0, 
  emissionRate: 1.0,
  debugMode: true 
})

// Link Corruption Particles
FX.spawnLinkCorruptionParticles()

// Link Healing Particles (Legacy)
FX.spawnLinkHealingParticles()
```

### Cascade Systems

```javascript
FX.spawnCascadeEmissionBoost()      // Computation only
FX.spawnCascadeColorTinting()       // Computation only
FX.spawnCascadingRupture()          // Rupture visuals
FX.spawnCascadeResonanceWave()      // Resonance wave visuals
FX.spawnResonanceCascade()          // Cascade visualization
```

### Wave Systems

```javascript
FX.spawnWaveInterferenceEngine()
FX.spawnWaveShaderBridge()
FX.spawnWaveShaderMaterialPatch()
FX.spawnWaveTravelShaderPack()
FX.spawnWaveDynamicsShaderPack()
FX.spawnSynergyTravelingWave()
FX.spawnStandingWaveTrap()
FX.spawnStandingWaveRenderer()
FX.spawnWaveInterferencePattern()
```

### Resonance Systems

```javascript
FX.spawnHarmonicResonanceCoupling()  // Computation only
FX.spawnHarmonicResonanceFeedback() // Visual feedback
FX.spawnResonanceFeedback()         // Material mutation
FX.spawnCompositeGlyphResonance()   // Visual feedback
FX.spawnHarmonicNodeHalos()         // Halo visuals
FX.spawnHarmonicSyncEffect()        // Material mutation
```

### Ripple Systems

```javascript
FX.spawnEchoRipple()           // Echo ripple effects
FX.spawnResonanceEchoTrail()   // Echo trail effects
```

### Interference Systems

```javascript
FX.spawnInterferenceEffect()    // Material mutation
FX.spawnNodeInterferenceManager() // Manager class
```

### Link Particle Systems

```javascript
FX.spawnLinkBeadTrail()         // Bead trail particles
FX.spawnLinkSpark()             // Link sparks
FX.spawnLinkDirectionalStreaks() // Directional streaks
FX.spawnAnimatedLinkFlow()      // Animated flow particles
```

---

## Node FX Debug HUD

The FXDebugSandbox includes a powerful HUD for toggling individual VFX systems on/off without restarting ATOMA.

### Toggle HUD

```javascript
// Press 'L' key in browser
// OR use console:
FX.toggleNodeFxHud()
FX.showNodeFxHud()  // Force show
FX.hideNodeFxHud()  // Force hide
```

### System Categories in HUD

The HUD organizes systems into groups:
- **AI / Orbit** - Orbit, consciousness, cluster systems
- **Glyph / Orbit** - Semantic, pictogram systems
- **Link FX** - Ring, energy, fracture systems
- **Node Core** - Evolution, node systems
- **Corruption** - Corruption-related systems
- **Healing / Rupture** - Healing, recovery systems
- **Cascade / Wave** - Cascade, wave systems
- **Waves / Particles** - Wave, particle systems
- **Resonance** - Resonance, harmonic systems
- **Glyph / Overlay** - Glyph, aura, overlay systems
- **Aura / Visual** - Aura, visual systems
- **Metrics / Overlay** - Metrics, inspect systems

### Toggle Individual Systems

```javascript
// Toggle specific system (auto-detects current state)
FX.toggleNodeFx('harmonicResonanceCoupling')
FX.toggleNodeFx('aiConsciousnessLayer')
FX.toggleNodeFx('linkSemanticPictogramSystem')
FX.toggleNodeFx('cascadeResonanceWave')

// Force enable/disable
FX.toggleNodeFx('harmonicNodeResonanceHalos', true)   // Enable
FX.toggleNodeFx('harmonicNodeResonanceHalos', false)  // Disable
```

### System States

Each system shows one of four states:
- **active** - System is enabled and running
- **disabled** - System is present but disabled
- **forced-off** - System is hard-disabled in code
- **missing** - System is not present in game yet

### Persistence

All toggle states persist in localStorage:
- States survive page refreshes
- States persist across ATOMA restarts
- Clear browser data to reset all states

### View Available Systems

```javascript
// List all registered systems
FX.listNodeFxRegistry()

// Refresh registry (after game state changes)
FX.refreshNodeFxRegistry()
```

### Key Systems from Metric Midpoint Audit

These systems are now toggleable in the HUD:

#### Tier 1 (High Probability)
- `aiConsciousnessLayer` - AI Consciousness Layer (orbit LineLoop, ring stacks)
- `linkSemanticPictogramSystem` - Link Semantic Pictogram System (orbiting glyphs)
- `cascadeResonanceWave` - Cascade Resonance Wave (midpoint beam visualization)
- `harmonicResonanceCoupling` - Harmonic Resonance Coupling (midpoint polyhedron)

#### Tier 2 (Medium Probability)
- `linkEnergyRingSystem` - Link Energy Ring System (ring geometries, icosahedron cores)

#### Related Systems
- `harmonicNodeResonanceHalos` - Harmonic Node Resonance Halos (metric-reactive halos)
- `harmonicHubAuraSystem` - Harmonic Hub Aura System (hub auras)
- `harmonicInfluencePropagation` - Harmonic Influence Propagation (influence spread)
- `t2CorruptionVisualIntegration` - T2 Corruption Visual Integration (corruption colors)

---

## System Management

### List Active Systems

```javascript
FX.listActive()
```

### Clear All Effects

```javascript
FX.clear()
```

### Manual Update (if needed)

```javascript
FX.update(deltaTime)
```
  +++++++ REPLACE

---

## Available System Categories

### Active Systems (Production-Ready)
- LinkTrailParticleSystem
- WaveParticleEmitter_v1
- WaveInterferenceEngine_v1
- Wave Shader Pack (Bridge, MaterialPatch, Travel, Dynamics)
- Standing Wave Systems (Trap, Renderer, Pattern)

### Orphan Systems (Debug/Experimental)
- HealingParticleSystem_Session136
- CascadeParticleSystem_Session120
- All cascade-related systems
- All resonance-related systems
- All link particle variants (BeadTrail, DirectionalStreaks, AnimatedFlow)

### Status Codes
- **ACTIVE** - Confirmed runtime, safe to use
- **ORPHAN** - Not integrated, may spawn without cleanup
- **COMPUTATION ONLY** - No visual spawn, safe to use
- **MATERIAL MUTATION** - Mutates materials, may affect visuals

---

## Safety Notes

### High-Risk Systems (Handle with Care)
Systems that spawn objects without confirmed cleanup:
- `CascadeParticleSystem_Session120`
- `CascadingRuptureSystem`
- `CascadeResonanceWaveVisualization_Session146`
- `HarmonicNodeResonanceHalos`
- `LinkBeadTrailSystem`
- `LinkSparkSystem`

**Recommendation:** Test these systems individually and call `FX.clear()` after testing.

### Material Mutation Systems
These systems modify existing materials:
- All Wave Shader systems
- ResonanceFeedback_v1
- InterferenceEffectApplier
- HarmonicSyncEffectApplier

**Recommendation:** Effects are permanent until scene reload. Test in isolated environment.

---

## Debugging

### Check if Sandbox is Loaded

```javascript
typeof window.FX !== 'undefined'
```

### Verify Initialization

```javascript
FX.initialized
FX.scene
```

### Console Logging

Sandbox logs all system spawns:
```
[FX] Spawning CascadeParticles...
[FXDebugSandbox] Registered: cascadeParticles
```

---

## Examples

### Test One System
```javascript
FX.harmony()
// Wait 10 seconds
FX.clear()
```

### Test All Particles
```javascript
FX.spawn.particles()
FX.spawn.waves()
FX.spawn.cascade()
FX.spawn.healing()
FX.listActive()
```

### Stress Test
```javascript
FX.spawnAll()
FX.listActive()
// Check performance
FX.clear()
```

### Comparative Testing
```javascript
// Test particle systems
FX.spawn.particles()
// Wait
FX.clear()

FX.spawn.waves()
// Wait
FX.clear()
```

---

## Architecture Notes

### No Refactor Policy
FXDebugSandbox is designed as a debug layer:
- Does not modify core VFX architecture
- Does not change update chains
- Does not affect production systems
- Isolated cleanup and lifecycle management

### System Registration
Each spawned system is registered with:
- System reference
- Update function (if applicable)
- Dispose function (if available)

Cleanup is automatic via `FX.clear()`.

---

## Troubleshooting

### "Not initialized" Error
```javascript
// Fix: Ensure scene is available
window.FX.init(scene)
```

### No Visuals Appearing
- Check if system requires renderer initialization
- Verify system status (ACTIVE vs ORPHAN)
- Check debugMode in config

### Performance Issues
- Clear all effects: `FX.clear()`
- Test systems individually
- Check particle counts in config

---

## Integration with Existing Systems

FXDebugSandbox coexists with production VFX systems:
- Active systems (LinkTrailParticleSystem, Wave systems) are already running
- Sandbox can spawn additional instances for testing
- Production systems are not affected by sandbox operations
- Clearing sandbox does not clear production systems

---

## File Structure

```
ATOMA_CLEAN/
├── FXDebugSandbox.js              // Sandbox implementation
├── main.js                         // Import and initialization
└── docs/
    └── FXDebugSandbox_USAGE.md     // This file
```

---

## Future Enhancements

Potential improvements:
- Individual effect removal (not just clear all)
- Effect configuration presets
- Visual inspector for active systems
- Performance profiling per effect
- Screenshot capture on spawn

---

## Author Notes

Created for rapid VFX testing without architectural changes.  
Debug spawn only - no production use intended.  
All spawned effects are isolated and cleanup is explicit.

**Use responsibly. Test. Clear. Repeat.**
