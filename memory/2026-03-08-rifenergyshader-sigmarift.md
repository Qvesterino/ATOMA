# Memory 2026-03-08 — RiftEnergyShader Integration into SigmaRiftChamber

## Task
Initialize RiftEnergyShader into Sigma Rift Chamber map.

## Changes Made

### File: SigmaRiftChamber.js

1. **Import added:**
   ```javascript
   import { createSigmaRift, updateRiftEnergyTime } from './shaders/RiftEnergyShader.js';
   ```

2. **Replaced createRiftCore() with createSigmaRiftCore():**
   - Old: Inline shader with basic fractal pattern
   - New: Uses `createSigmaRift()` from RiftEnergyShader
   - Benefits: Consistent shader architecture, better visual quality

3. **Updated createCentralRift():**
   - Changed from: `this.createRiftCore(riftRadius)`
   - Changed to: `this.createSigmaRiftCore(riftRadius)`

4. **Updated update loop (line ~715):**
   - Old: `obj.object.material.uniforms.time.value = time`
   - New: `updateRiftEnergyTime(obj.object.material, deltaTime)`
   - Benefits: Proper time accumulation via shader utility

## Shader Configuration

SigmaRiftCore uses these RiftEnergyShader parameters:
- `riftColor`: 0x00ff88 (green)
- `edgeColor`: 0x00ddff (cyan)
- `riftPosition`: 0.5
- `riftWidth`: 0.15
- `swirl`: 0.3
- `voidDensity`: 0.6
- `particleThreads`: 5
- `scale`: 1.0

## Change Classification

**Class A - Safe Surgery**
- Replaces inline shader with standardized shader system
- No gameplay changes
- Visual improvement only (better fractal rift effect)
- Minimal diff
- Reversible

## Impact

- Sigma Rift Chamber now uses RiftEnergyShader for central rift
- Better fractal line effects
- Improved particle threads along rift
- Consistent with other rift effects in ATOMA
- Shader time properly accumulated via deltaTime
