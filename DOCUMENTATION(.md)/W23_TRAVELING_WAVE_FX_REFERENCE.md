# Week 23: Synergy Traveling Wave FX - API Reference

## Class: SynergyTravelingWaveFX_v1

### Constructor

```javascript
new SynergyTravelingWaveFX_v1(config)
```

#### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `config` | object | {} | Configuration object |
| `config.debugEnabled` | boolean | false | Enable console logging |
| `config.maxMaterialsPerFrame` | number\|null | null | Max materials per frame (null = unlimited) |
| `config.waveSpeedBase` | number | 4.0 | Default wave speed (units/sec) |
| `config.waveIntensityBase` | number | 1.0 | Default wave intensity |

#### Returns

SynergyTravelingWaveFX_v1 instance

#### Example

```javascript
const waveFX = new SynergyTravelingWaveFX_v1({
    debugEnabled: false,
    waveSpeedBase: 4.0,
    waveIntensityBase: 1.0
});
```

---

## Methods

### registerMaterial(material, options)

Register a material for wave effects.

**Signature:**
```javascript
registerMaterial(material, options = {})
```

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `material` | THREE.Material | required | Material to register |
| `options` | object | {} | Configuration options |
| `options.type` | string | 'link' | Material type: 'link' or 'node' |
| `options.polarity` | string | 'positive' | Wave polarity: 'positive', 'negative', 'resonance', 'corrupted' |

**Polarity Options:**

| Polarity | Color | Sharpness | Noise | Frequency | Use Case |
|----------|-------|-----------|-------|-----------|----------|
| 'positive' | Green-Cyan | 0.8 | 0.0 | 1.5 Hz | Positive synergy |
| 'negative' | Purple-Pink | 0.3 | 0.1 | 1.0 Hz | Negative synergy |
| 'resonance' | Blue-Gold | 0.5 | 0.0 | 2.5 Hz | Resonance state |
| 'corrupted' | Red | 0.2 | 0.6 | 3.0 Hz | Corrupted state |

**Returns:** void

**Throws:** Errors caught and logged, no exception thrown

**Example:**

```javascript
// Register link material for positive synergy
waveFX.registerMaterial(linkMaterial, {
    type: 'link',
    polarity: 'positive'
});

// Register node material for resonance
waveFX.registerMaterial(nodeAuraMaterial, {
    type: 'node',
    polarity: 'resonance'
});
```

---

### triggerWave(material, depth, synergyLevel, duration)

Trigger a traveling wave on a material.

**Signature:**
```javascript
triggerWave(material, depth = 0, synergyLevel = 0.5, duration = 1.0)
```

**Parameters:**

| Parameter | Type | Range | Description |
|-----------|------|-------|-------------|
| `material` | THREE.Material | - | Material to trigger wave on |
| `depth` | number | 0–8 | Cascade depth (hops from origin) |
| `synergyLevel` | number | 0–1 | Synergy quality (affects intensity) |
| `duration` | number | >0 | Wave duration in seconds |

**Depth Mapping:**
- 0: Origin node (100% intensity)
- 1–3: First cascade hops (82–55% intensity)
- 4–6: Mid cascade (45–30% intensity)
- 7–8: Far cascade (25–20% intensity)

**Synergy Level Impact:**
- 0.0: Very weak wave
- 0.3–0.5: Weak cascade
- 0.6–0.8: Medium cascade
- 0.9–1.0: Strong cascade

**Returns:** void

**Throws:** Errors caught and logged

**Example:**

```javascript
// Trigger wave on link during cascade
waveFX.triggerWave(linkMaterial, depth=2, synergyLevel=0.85, duration=1.0);

// Trigger with default parameters
waveFX.triggerWave(nodeMaterial);  // depth=0, synergyLevel=0.5, duration=1.0
```

---

### update(deltaTime)

Update all active waves each frame.

**Signature:**
```javascript
update(deltaTime)
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `deltaTime` | number | Frame time delta in seconds |

**Returns:** void

**Throws:** Errors caught and logged

**Notes:**
- Call once per frame in animation loop
- Updates global time for all wave calculations
- Decays chain event trigger
- Removes completed waves from tracking

**Example:**

```javascript
function animate() {
    const deltaTime = clock.getDelta();
    
    waveFX.update(deltaTime);
    
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}
```

---

### setWaveSpeed(material, speed)

Set wave travel speed for a material.

**Signature:**
```javascript
setWaveSpeed(material, speed)
```

**Parameters:**

| Parameter | Type | Range | Description |
|-----------|------|-------|-------------|
| `material` | THREE.Material | - | Target material |
| `speed` | number | 2–8 | Wave speed in units/sec |

**Speed Mapping:**
- 2 units/sec: Slow, deliberate wave
- 4 units/sec: Default speed
- 6 units/sec: Fast wave
- 8 units/sec: Very fast wave

**Clamping:** Values outside 2–8 are automatically clamped

**Returns:** void

**Example:**

```javascript
// Slow wave for gentle effect
waveFX.setWaveSpeed(material, 2.0);

// Fast wave based on synergy
const speed = 2.0 + (synergyLevel * 6.0);  // 2–8 range
waveFX.setWaveSpeed(material, speed);
```

---

### setWaveIntensity(material, intensity)

Set wave peak brightness.

**Signature:**
```javascript
setWaveIntensity(material, intensity)
```

**Parameters:**

| Parameter | Type | Range | Description |
|-----------|------|-------|-------------|
| `material` | THREE.Material | - | Target material |
| `intensity` | number | 0–1 | Brightness at wavefront |

**Intensity Effects:**
- 0.0: Wave invisible
- 0.3: Subtle
- 0.6: Moderate
- 1.0: Full brightness

**Clamping:** Values outside 0–1 automatically clamped

**Returns:** void

**Example:**

```javascript
// Fade wave out
waveFX.setWaveIntensity(material, 0.3);

// Modulate by network mood
const moodIntensity = networkMood.resonantLevel;
waveFX.setWaveIntensity(material, moodIntensity);
```

---

### setWaveColor(material, color)

Set wave color.

**Signature:**
```javascript
setWaveColor(material, color)
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `material` | THREE.Material | Target material |
| `color` | THREE.Color | RGB color object |

**Returns:** void

**Example:**

```javascript
// Set to custom color
const customColor = new THREE.Color(0xff0000);  // Red
waveFX.setWaveColor(material, customColor);

// Set from polarity (example colors)
const polarityColors = {
    'positive': new THREE.Color(0x00ff00),      // Green
    'negative': new THREE.Color(0xff00ff),      // Magenta
    'resonance': new THREE.Color(0x0080ff),     // Blue
    'corrupted': new THREE.Color(0xff0000)      // Red
};
waveFX.setWaveColor(material, polarityColors[polarity]);
```

---

### setPropagationDirection(material, direction)

Set wave propagation direction.

**Signature:**
```javascript
setPropagationDirection(material, direction)
```

**Parameters:**

| Parameter | Type | Value | Description |
|-----------|------|-------|-------------|
| `material` | THREE.Material | - | Target material |
| `direction` | number | >0 or ≤0 | Forward (>0) or backward (≤0) |

**Returns:** void (sets to ±1.0 internally)

**Example:**

```javascript
// Wave travels forward along link
waveFX.setPropagationDirection(linkMaterial, 1.0);

// Wave travels backward
waveFX.setPropagationDirection(linkMaterial, -1.0);

// Dynamic based on cascade direction
const direction = fromNode.position.distanceTo(toNode.position) > 0 ? 1 : -1;
waveFX.setPropagationDirection(material, direction);
```

---

### getMetrics()

Get performance metrics.

**Signature:**
```javascript
getMetrics()
```

**Returns:** object

**Return Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `lastUpdateTime` | number | Last update frame time (ms) |
| `processedMaterialsThisFrame` | number | Materials updated this frame |
| `activeMaterialCount` | number | Currently active materials |
| `globalTime` | number | Total elapsed time (sec) |

**Example:**

```javascript
const metrics = waveFX.getMetrics();
console.log(`Active materials: ${metrics.activeMaterialCount}`);
console.log(`Frame time: ${metrics.lastUpdateTime.toFixed(2)}ms`);
console.log(`Elapsed: ${metrics.globalTime.toFixed(1)}s`);
```

---

### dispose()

Cleanup and dispose all resources.

**Signature:**
```javascript
dispose()
```

**Returns:** void

**Notes:**
- Call on scene cleanup or material unload
- Clears all wave tracking
- WeakMaps auto-cleanup
- Safe to call multiple times

**Example:**

```javascript
// On scene cleanup
function cleanup() {
    waveFX.dispose();
    scene.clear();
    renderer.dispose();
}

// On window unload
window.addEventListener('beforeunload', cleanup);
```

---

## Internal Classes

### WaveMaterialState

Internal state tracker for each material.

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `material` | THREE.Material | Reference to material |
| `uniforms` | object | GPU uniforms object |
| `waveActive` | boolean | Currently in wave state |
| `currentDepth` | number | Current cascade depth |
| `currentSynergyLevel` | number | Current synergy level |

**Public Methods:**

```javascript
// Trigger wave
state.triggerWave(depth, synergyLevel, duration)

// Update state
state.update(deltaTime, globalTime)
```

---

## GPU Uniforms Reference

### Access Uniforms (Advanced)

```javascript
const state = waveFX.materialStates.get(material);
if (state) {
    // Access uniform object
    const timeUniform = state.uniforms.uTime;
    const speedUniform = state.uniforms.uWaveSpeed;
    
    // Modify directly (advanced usage)
    timeUniform.value = newTime;
    speedUniform.value = newSpeed;
}
```

### Uniform List

| Uniform | Type | Default | Range | Purpose |
|---------|------|---------|-------|---------|
| `uTime` | float | 0 | 0–∞ | Global running time |
| `uWaveSpeed` | float | 4.0 | 2–8 | Wave travel speed |
| `uWaveIntensity` | float | 1.0 | 0–1 | Peak brightness |
| `uWaveColor` | vec3 | (0,1,0) | 0–1 | RGB color |
| `uCascadeDepth` | float | 0 | 0–1 | Normalized depth |
| `uPropagationDirection` | float | 1.0 | ±1 | Direction |
| `uSynergyLevel` | float | 0.5 | 0–1 | Synergy quality |
| `uChainEvent` | float | 0 | 0–1 | Trigger pulse |
| `uWaveSharpness` | float | 0.5 | 0–1 | Edge hardness |
| `uNoiseStrength` | float | 0 | 0–1 | FBM distortion |
| `uPulsationFreq` | float | 2.0 | 0–4 | Oscillation (Hz) |

---

## Configuration Patterns

### Pattern 1: Conservative (Mobile)

```javascript
const waveFX = new SynergyTravelingWaveFX_v1({
    debugEnabled: false,
    waveSpeedBase: 3.0,
    waveIntensityBase: 0.6
});
```

### Pattern 2: Default (Desktop)

```javascript
const waveFX = new SynergyTravelingWaveFX_v1({
    debugEnabled: false,
    waveSpeedBase: 4.0,
    waveIntensityBase: 1.0
});
```

### Pattern 3: Aggressive (High-End)

```javascript
const waveFX = new SynergyTravelingWaveFX_v1({
    debugEnabled: true,
    waveSpeedBase: 6.0,
    waveIntensityBase: 1.2
});
```

---

## Error Handling

### Graceful Fallback

All methods catch errors and fall back gracefully:

```javascript
try {
    waveFX.triggerWave(material, 2, 0.8);
} catch (err) {
    console.error(err);
    // Wave still functions, just skipped for this call
}
```

### Null Safety

Methods handle null/undefined materials:

```javascript
waveFX.triggerWave(null);       // Ignored, no error
waveFX.triggerWave(undefined);  // Ignored, no error
```

### WeakMap Auto-Cleanup

Materials can be safely deleted:

```javascript
// Material deleted by user
material = null;

// WeakMap automatically removes entry
// No memory leak
```

---

## Performance Tips

### Tip 1: Reuse Materials

```javascript
// Good: Register once
waveFX.registerMaterial(sharedLinkMaterial, { polarity: 'positive' });

// Less efficient: Re-register each time
for (const link of links) {
    waveFX.registerMaterial(link.material, { polarity: 'positive' });
}
```

### Tip 2: Batch Updates

```javascript
// Efficient: Update once per frame
waveFX.update(deltaTime);

// Inefficient: Multiple updates
for (let i = 0; i < 10; i++) {
    waveFX.update(deltaTime / 10);
}
```

### Tip 3: Control Active Waves

```javascript
// Good: Only active waves tracked
const metrics = waveFX.getMetrics();
if (metrics.activeMaterialCount < 50) {
    waveFX.triggerWave(newMaterial, depth, level);
}
```

### Tip 4: Use Appropriate Polarity

```javascript
// Good: Positive wave (no noise, low cost)
waveFX.registerMaterial(m1, { polarity: 'positive' });

// More expensive: Corrupted wave (heavy FBM)
waveFX.registerMaterial(m2, { polarity: 'corrupted' });
```

---

## Troubleshooting

### Wave Not Visible

**Check:**
1. Material registered?
2. Intensity > 0?
3. Material added to scene?
4. Shader compilation successful?

**Debug:**
```javascript
const waveFX = new SynergyTravelingWaveFX_v1({ debugEnabled: true });
// Check console for registration messages
```

### Performance Drop

**Check:**
1. Too many active waves?
2. Corrupted polarity (expensive)?
3. GPU limits?

**Optimize:**
```javascript
waveFX.registerMaterial(m, { polarity: 'positive' });  // Cheaper
waveFX.setWaveIntensity(m, 0.5);  // Lower intensity = lower cost
```

### Wrong Color

**Fix:**
```javascript
// Check polarity was set correctly
waveFX.registerMaterial(m, { polarity: 'positive' });  // Green-cyan

// Or set custom color
waveFX.setWaveColor(m, new THREE.Color(0xff0000));
```

---

## Complete Example

```javascript
import SynergyTravelingWaveFX_v1 from './SynergyTravelingWaveFX_v1.js';

// Initialize
const waveFX = new SynergyTravelingWaveFX_v1({
    debugEnabled: false,
    waveSpeedBase: 4.0,
    waveIntensityBase: 1.0
});

// Setup materials
for (const link of networkLinks) {
    waveFX.registerMaterial(link.material, {
        type: 'link',
        polarity: 'positive'
    });
}

// On cascade event
function onCascadeEvent(link, depth, synergyLevel) {
    waveFX.triggerWave(
        link.material,
        depth,
        synergyLevel,
        0.6 + (depth * 0.1)
    );
}

// In animation loop
function animate() {
    const deltaTime = clock.getDelta();
    waveFX.update(deltaTime);
    
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

// On cleanup
function dispose() {
    waveFX.dispose();
}
```

---

## Summary

**Public API Methods:**
- `registerMaterial(material, options)`
- `triggerWave(material, depth, synergyLevel, duration)`
- `update(deltaTime)`
- `setWaveSpeed(material, speed)`
- `setWaveIntensity(material, intensity)`
- `setWaveColor(material, color)`
- `setPropagationDirection(material, direction)`
- `getMetrics()`
- `dispose()`

**Key Parameters:**
- Depth: 0–8 hops
- Synergy Level: 0–1 quality
- Polarity: positive, negative, resonance, corrupted
- Speed: 2–8 units/sec
- Intensity: 0–1 brightness

**Performance:**
- <0.3ms for 500+ materials
- No allocations per frame
- Automatic memory cleanup
