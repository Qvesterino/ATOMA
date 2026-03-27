# FLOW DIAGRAM: propagation.intensity Lifecycle

```
EVENTS (writers) → Bridge (state) → Events (transport) → Visualizer (particles)

1. WRITERS (CascadeEventBridge_v1.js):
   - _handleNodeSynergyHigh: flowState.intensity = 0.7
   - _handleMetricCorruptionRise: flowState.intensity = 0.9
   - _handleLinkCollapsed: flowState.intensity = 1.0
   - _handleNodeHover: flowState.intensity = 0.3

2. BRIDGE DECAY (CascadeEventBridge_v1.js, _decayUpdate):
   flowState.intensity = (targetIntensity - current) * blend
   → Clamp 0-1
   → Reset to 0 if < minIntensityThreshold (0.01)

3. EMITTER (_emitCascadeHop):
   - Emits cascade.hop ONLY if flowState.intensity >= cascadeWaveThreshold (0.6) ⚠️
   - Cooldown: 550ms per link
   - Payload: { intensity: flowState.intensity, link, ... }

4. READER (SynergyCascadeVisualizer.js, spawnFlowParticles):
   particleCount = Math.ceil(particleCount * propagation.intensity * 0.85)
   Default: 14 * intensity * 0.85

5. PARTICLE SYSTEM (CascadeParticleSystem_Session120.js):
   Uses separate intensity sources (cascadeIntensity, flowState.intensity, metrics.synergy)
   baseCascadeParticles: 60
   Hop decay: 0.82^hopIndex
```

# ROOT CAUSE

**Problem**: The cascadeWaveThreshold (0.6) in CascadeEventBridge is TOO HIGH.

When cascade.hop fires (HUD shows activity), particles should spawn but don't because:
1. cascadeWaveThreshold (0.6) prevents cascade.hop emission for normal activity
2. Even when cascade.hop DOES fire, SynergyCascadeVisualizer's particleCount multiplier (0.85) is too low

**Calculation Example**:
- If intensity = 0.6 (barely above threshold)
- Particle count = ceil(14 * 0.6 * 0.85) = ceil(7.14) = 7 particles
- These particles are spread across hop duration → NOT visible enough

- If intensity = 0.4 (typical cascade, but below threshold)
- No cascade.hop emitted → NO particles from SynergyCascadeVisualizer
- CascadeParticleSystem might emit, but intensity decay reduces visibility

# MINIMAL FIX (1-2 line patch)

**File**: CascadeEventBridge_v1.js

```javascript
// Line ~32 (config):
cascadeWaveThreshold: 0.15,  // Was 0.6 - emit for normal cascade activity
```

**OR Alternative (if CascadeEventBridge threshold must stay high)**:

**File**: SynergyCascadeVisualizer.js

```javascript
// Line ~42 (config):
particleCount: 30,  // Was 14 - spawn more particles

// Line ~553 (spawnFlowParticles):
const particleCount = Math.ceil(this.config.particleCount * propagation.intensity * 1.5);  // Was 0.85
```

**RECOMMENDATION**: Use the first option (cascadeWaveThreshold: 0.15) because:
- Enables cascade.hop emission for normal activity (0.3-0.5 range)
- Minimal change, respects existing architecture
- SynergyCascadeVisualizer will then spawn particles normally
- 1 line change

**Result with first fix**:
- Intensity 0.3 → particleCount = ceil(14 * 0.3 * 0.85) = ceil(3.57) = 4 particles
- Intensity 0.5 → particleCount = ceil(14 * 0.5 * 0.85) = ceil(5.95) = 6 particles
- Visible flow particles at normal cascade activity levels