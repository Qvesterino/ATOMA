# ATOMA Cascade Event Contract

## Overview

This document defines the unified event contract for all cascade-related systems. All cascade systems must emit and listen to events in a consistent format to ensure compatibility.

## Event Definitions

### 1. cascade.triggered

Emitted when a cascade is initiated at a source node.

**Payload:**
```javascript
{
  sourceId: string,      // Source node ID
  position: { x, y, z }, // Source node position
  strength: number,       // Cascade strength (0-1)
  type: string           // Cascade type/conflict type
}
```

**Emitted by:**
- CascadingHarmonicResonanceAmplification
- CascadingRuptureSystem
- CascadeEventBridge (when cascade intensity exceeds threshold)

**Listened by:**
- CascadeParticleSystem (triggers particle emission)
- CascadeResonanceWaveVisualization (starts ripple effects)

---

### 2. cascade.hop

Emitted when a cascade propagates from one node to another.

**Payload:**
```javascript
{
  fromId: string,         // Source node ID
  toId: string,           // Target node ID
  position: { x, y, z }, // Hop position (midpoint or target)
  intensity: number,       // Cascade intensity (0-1)
  hopIndex: number        // Current hop index (0, 1, 2, ...)
}
```

**Emitted by:**
- CascadeParticleSystem (when particles are spawned, with 0.3s cooldown per link)

**Listened by:**
- CascadeResonanceWaveVisualization (renders ripple effects)
- WaveInterferenceEngine (via WaveBurstRouter)

---

### 3. cascade.completed

Emitted when a cascade finishes propagating through the network.

**Payload:**
```javascript
{
  sourceId: string,       // Original source node ID
  totalHops: number,     // Total number of hops
  finalIntensity: number  // Final cascade intensity
}
```

**Emitted by:**
- CascadingHarmonicResonanceAmplification (when cascade propagation completes)
- CascadingRuptureSystem (when cascade finishes)

**Listened by:**
- CascadeParticleSystem (resets cascade state)
- CascadeResonanceWaveVisualization (ends ripple effects)

---

## Event Flow Diagram

```
cascade.triggered
       ↓
cascade.hop (repeated for each link)
       ↓
cascade.completed
```

## Implementation Guidelines

### Emitters

When emitting cascade events, use the following pattern:

```javascript
// Emit cascade.triggered
this.semanticBus.emit('cascade.triggered', {
  sourceId: nodeId,
  position: node.position,
  strength: intensity,
  type: conflictType
}, { priority: this.semanticBus.priority.INTERACTIVE });

// Emit cascade.hop
this.semanticBus.emit('cascade.hop', {
  fromId: sourceNodeId,
  toId: targetNodeId,
  position: midpoint,
  intensity: currentIntensity,
  hopIndex: hopIndex
}, { priority: this.semanticBus.priority.INTERACTIVE });

// Emit cascade.completed
this.semanticBus.emit('cascade.completed', {
  sourceId: originalSourceId,
  totalHops: hopCount,
  finalIntensity: finalIntensity
}, { priority: this.semanticBus.priority.INTERACTIVE });
```

### Listeners

When listening to cascade events, handle the payload with proper fallbacks:

```javascript
// Listen to cascade.triggered
this.semanticBus.on('cascade.triggered', (event) => {
  const sourceId = event.sourceId;
  const position = event.position || { x: 0, y: 0, z: 0 };
  const strength = event.strength ?? 0;
  const type = event.type || 'unknown';
  
  // Handle cascade trigger
});

// Listen to cascade.hop
this.semanticBus.on('cascade.hop', (event) => {
  const fromId = event.fromId;
  const toId = event.toId;
  const position = event.position || { x: 0, y: 0, z: 0 };
  const intensity = event.intensity ?? 0;
  const hopIndex = event.hopIndex ?? 0;
  
  // Handle cascade hop
});

// Listen to cascade.completed
this.semanticBus.on('cascade.completed', (event) => {
  const sourceId = event.sourceId;
  const totalHops = event.totalHops ?? 0;
  const finalIntensity = event.finalIntensity ?? 0;
  
  // Handle cascade completion
});
```

## Backward Compatibility

To maintain compatibility with existing systems, event emitters should:

1. **Include legacy properties** when needed:
   - For cascade.hop: Include `link` object for systems expecting it
   - For cascade.triggered: Include `link` if applicable

2. **Use semanticBus priority:** Always include priority in emit calls
   - Use `INTERACTIVE` for user-facing events
   - Use `NORMAL` for internal events

3. **Handle missing fields gracefully:** Always provide fallback values
   - Use `??` operator for optional fields
   - Default positions to `{ x: 0, y: 0, z: 0 }`
   - Default intensity to `0`

## Migration Path

### Phase 1: Contract Definition (Current)
- ✅ Define event contracts
- ✅ Document payload structures
- ✅ Create implementation guidelines

### Phase 2: Emitter Updates (Next)
- [ ] Update CascadingHarmonicResonanceAmplification to emit cascade.triggered
- [ ] Update CascadingRuptureSystem to emit cascade.triggered
- [ ] Update CascadingRuptureSystem to emit cascade.completed
- [ ] Update CascadeParticleSystem to emit cascade.completed

### Phase 3: Listener Updates (Future)
- [ ] Update CascadeResonanceWaveVisualization to listen to cascade.triggered
- [ ] Update CascadeResonanceWaveVisualization to listen to cascade.completed
- [ ] Update WaveInterferenceEngine to listen to cascade.triggered

## Related Files

- [`CascadeEventBridge_v1.js`](CascadeEventBridge_v1.js) - Event bridge
- [`CascadeParticleSystem_Session120.js`](CascadeParticleSystem_Session120.js) - Particle system
- [`CascadeResonanceWaveVisualization_Session146.js`](CascadeResonanceWaveVisualization_Session146.js) - Wave visualization
- [`CascadingHarmonicResonanceAmplification.js`](CascadingHarmonicResonanceAmplification.js) - Cascade amplification
- [`CascadingRuptureSystem.js`](CascadingRuptureSystem.js) - Rupture system

---

*Document Version: 1.0.0*  
*Last Updated: 2026-03-18*  
*Author: ATOMA VFX Technical Director*
