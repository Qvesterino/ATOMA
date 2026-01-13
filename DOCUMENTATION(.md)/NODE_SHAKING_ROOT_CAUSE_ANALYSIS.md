# NODE SHAKING ROOT CAUSE ANALYSIS & ELIMINATION PLAN

## EXECUTIVE SUMMARY

The node shaking is caused by **THREE PRIMARY SOURCES** all combining into visible jitter:

1. **microBlink** (visible toggle + position reset jitter) - _NodeMicroEvents.js
2. **jitterBurst** (random positional offsets) - _NodeMicroEvents.js
3. **driftingGesture** (random offset vector) - _NodeMicroEvents.js
4. **Shader jitter** (high-frequency vertex displacement) - LinkLine.vertex.glsl

## DETAILED ROOT CAUSE ANALYSIS

### SOURCE 1: microBlink Effect ❌ PROBLEM
**File**: `/_NodeMicroEvents.js` lines 909-912

```javascript
case 'micro_blink':
  const blinkPhase = progress * visual.blinkCount * 2;
  visual.node.visible = Math.floor(blinkPhase) % 2 === 0;
  break;
```

**Issue**: 
- Toggling `visible` causes sudden opacity changes
- Does NOT cause position shaking directly
- **Status**: CAN STAY (no position jitter)

**Severity**: LOW (no position movement)

---

### SOURCE 2: emissiveSpike Effect ❌ PROBLEM
**File**: `/_NodeMicroEvents.js` lines 914-918

```javascript
case 'emissive_spike':
  if (visual.node.material.emissiveIntensity !== undefined) {
    visual.node.material.emissiveIntensity = visual.originalIntensity + 
      (visual.spikeIntensity - visual.originalIntensity) * Math.sin(progress * Math.PI);
  }
  break;
```

**Issue**:
- Uses smooth sinusoidal interpolation (GOOD)
- Does NOT cause position jitter
- **Status**: SAFE (no position movement)

**Severity**: LOW (no position jitter)

---

### SOURCE 3: jitterBurst Effect ⚠️ **MAJOR CULPRIT**
**File**: `/_NodeMicroEvents.js` lines 961-966

```javascript
case 'jitter_burst':
  const jitterX = (Math.random() - 0.5) * visual.jitterIntensity * (1 - progress);
  const jitterY = (Math.random() - 0.5) * visual.jitterIntensity * (1 - progress);
  const jitterZ = (Math.random() - 0.5) * visual.jitterIntensity * (1 - progress);
  visual.node.position.copy(visual.originalPosition).add(new THREE.Vector3(jitterX, jitterY, jitterZ));
  break;
```

**Issue**:
- ✅ **DIRECT POSITION MODIFICATION** using `Math.random()`
- Triggered when `instabilityFactor > 60` (line 618)
- **Per-frame random jitter** creates visible shake
- Amplitude: ±0.015 units × 0.5 decay = **±0.0075 final shake**

**Severity**: 🔴 **CRITICAL** (direct position randomness)

**Fix Strategy**: Replace with smooth sinusoidal micro-motion:
```javascript
case 'jitter_burst':
  const smoothPhase = progress * Math.PI; // Smooth phase progression
  const smoothJitterX = Math.sin(progress * Math.PI * 3.0) * visual.jitterIntensity * 0.3;
  const smoothJitterY = Math.sin(progress * Math.PI * 2.5 + 1.0) * visual.jitterIntensity * 0.2;
  const smoothJitterZ = Math.sin(progress * Math.PI * 4.0 + 2.0) * visual.jitterIntensity * 0.3;
  visual.node.position.copy(visual.originalPosition).add(
    new THREE.Vector3(smoothJitterX, smoothJitterY, smoothJitterZ)
  );
  break;
```

---

### SOURCE 4: driftingGesture Effect ⚠️ **MAJOR CULPRIT**
**File**: `/_NodeMicroEvents.js` lines 531-547 (CREATE) and 934-939 (UPDATE)

**Create Function**:
```javascript
createDriftingGesture(node) {
  const visual = {
    type: 'drifting_gesture',
    node,
    startTime: Date.now(),
    duration: 1.5,
    driftOffset: new THREE.Vector3(
      (Math.random() - 0.5) * 0.1,  // ← RANDOM!
      (Math.random() - 0.5) * 0.05, // ← RANDOM!
      (Math.random() - 0.5) * 0.1   // ← RANDOM!
    ),
    originalPosition: node.position.clone(),
  };
  this.activeVisuals.set(`${node.uuid}_drifting_gesture`, visual);
}
```

**Update Function**:
```javascript
case 'drifting_gesture':
  const driftAmount = Math.sin(progress * Math.PI);
  visual.node.position.copy(visual.originalPosition).add(
    visual.driftOffset.clone().multiplyScalar(driftAmount)
  );
  break;
```

**Issue**:
- Creates random drift vector per event
- Applied as smooth sine wave (GOOD part)
- But the initial random offset + frame-jitter residue creates visible shake

**Severity**: 🔴 **CRITICAL** (random offset initialization)

**Fix Strategy**: Deterministic drift patterns based on node UUID:
```javascript
createDriftingGesture(node) {
  // Use node UUID hash for deterministic "random" values
  const hash1 = Math.sin(node.uuid.charCodeAt(0) * 12.9898) * 43758.5453;
  const hash2 = Math.sin(node.uuid.charCodeAt(1) * 78.233) * 43758.5453;
  const hash3 = Math.sin(node.uuid.charCodeAt(2) * 45.1234) * 43758.5453;
  
  const visual = {
    type: 'drifting_gesture',
    node,
    startTime: Date.now(),
    duration: 1.5,
    driftOffset: new THREE.Vector3(
      (hash1 - Math.floor(hash1)) * 0.08,    // Deterministic
      (hash2 - Math.floor(hash2)) * 0.04,    // Deterministic
      (hash3 - Math.floor(hash3)) * 0.08     // Deterministic
    ),
    originalPosition: node.position.clone(),
  };
  this.activeVisuals.set(`${node.uuid}_drifting_gesture`, visual);
}
```

---

### SOURCE 5: irregularRotation Effect ✅ **MINOR ISSUE**
**File**: `/_NodeMicroEvents.js` lines 460-471 (CREATE) and 905-907 (UPDATE)

**Create Function**:
```javascript
createIrregularRotation(node) {
  const visual = {
    type: 'irregular_rotation',
    node,
    startTime: Date.now(),
    duration: 0.8,
    rotationSpeed: (Math.random() - 0.5) * 0.02,  // ← RANDOM!
  };
  this.activeVisuals.set(`${node.uuid}_irregular_rotation`, visual);
}
```

**Update Function**:
```javascript
case 'irregular_rotation':
  visual.node.rotation.y += visual.rotationSpeed * deltaTime * (1 + Math.sin(progress * Math.PI * 4));
  break;
```

**Issue**:
- Random rotation speed is created once per event (not per-frame)
- Applied multiplicatively with smooth sine wave
- **Does NOT cause position jitter** (only rotation)
- Rotation jitter is less visible than position jitter

**Severity**: 🟡 **LOW** (rotation only, not position)

**Status**: CAN STAY with deterministic speed

---

### SOURCE 6: Shader Jitter ⚠️ **SECONDARY CULPRIT**
**File**: `/shaders/LinkLine.vertex.glsl` lines 107-117

```glsl
// GLITCH JITTER
if (glitch > 0.0) {
  // High-frequency jitter (synchronized with glitch amount)
  float jitterFreq = 20.0 + glitch * 10.0;
  float jitter = sin(time * jitterFreq * 2.7 + vUv.x * 13.0) * 0.01;
  jitter += cos(time * jitterFreq * 3.1 + vUv.y * 11.0) * 0.01;
  
  pos += jitter * glitch;  // ← Applies high-frequency shake
}
```

**Issue**:
- High-frequency sine waves (20-30 Hz oscillation)
- While **deterministic**, the **high frequency** creates visible jitter
- Amplitude: ±0.01 per component = **±0.02 total**

**Severity**: 🟡 **MEDIUM** (visible but deterministic)

**Fix Strategy**: Lower frequency + amplitude:
```glsl
if (glitch > 0.0) {
  // Smooth low-frequency undulation instead of jitter
  float jitterFreq = 2.0 + glitch * 1.5;  // Reduced from 20-30 to 2-3
  float jitter = sin(time * jitterFreq * 0.8 + vUv.x * 3.0) * 0.003;  // Amplitude 1/3
  jitter += cos(time * jitterFreq * 0.6 + vUv.y * 2.5) * 0.003;       // Amplitude 1/3
  
  pos += jitter * glitch;
}
```

---

## SUMMARY: ROOT CAUSES

| Culprit | Type | Severity | Solution |
|---------|------|----------|----------|
| jitterBurst | Random position per-frame | 🔴 CRITICAL | Replace random with smooth sine |
| driftingGesture | Random offset initialization | 🔴 CRITICAL | Use deterministic hash-based offset |
| irregularRotation | Random speed (rotation only) | 🟡 LOW | Use deterministic speed |
| Shader jitter | High-frequency vertex shake | 🟡 MEDIUM | Reduce frequency & amplitude |
| emissiveSpike | Smooth emissive | ✅ SAFE | Keep as-is |
| microBlink | Visibility toggle | ✅ SAFE | Keep as-is |

---

## PRESERVATION REQUIREMENTS

**MUST REMAIN UNCHANGED**:
- ✅ balanced_oscillation (smooth scale pulse)
- ✅ clarity_spark (emissive flash)
- ✅ slow_tilt (rotation drift)
- ✅ All resonance rings and halos

**CAN BE IMPROVED**:
- ⚠️ jitterBurst → smoothed to sine wave
- ⚠️ driftingGesture → deterministic values
- ⚠️ Shader jitter → lower frequency

---

## IMPACT ASSESSMENT

### Before Patch:
- Nodes shake visibly when instability is high
- Random jitter creates non-deterministic movement
- Shader adds high-frequency noise on top

### After Patch:
- All node movement is smooth and sinusoidal
- Deterministic (same node always same pattern)
- Visual richness preserved (all effects remain, just smoother)
- Zero position randomness
- Frequency reduced from 20-30 Hz to 2-4 Hz (below perception threshold for micro-movements)

