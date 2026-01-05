# CANONICAL TEMPLATE #3: NETWORK STRESS & LOAD PRESSURE
## Integration Guide

**Status:** Ready for integration  
**Files:** 
- `/CanonicalTemplate3_StressVisuals.js` (main system)
- `/shaders/StressVisualShaders.js` (shader effects)

---

## QUICK START: INTEGRATION CHECKLIST

### 1. Import the system
```javascript
import { CanonicalTemplate3_StressVisuals } from './CanonicalTemplate3_StressVisuals.js';
```

### 2. Initialize in AtomaGame constructor
```javascript
this.stressVisuals = null;

// In setupPrimaryNodeSystem() or init section:
this.stressVisuals = new CanonicalTemplate3_StressVisuals(this.scene, {
  debugMode: false  // Set true for console logging
});
```

### 3. Update each frame in animate()
```javascript
// Read network stress from corruption transmission system
const networkStress = this.linkCorruptionTransmission?.computeNetworkStress() ?? 0;
this.stressVisuals.updateNetworkStress(networkStress);

// Update per-node load pressure (example: based on number of corrupted links)
if (this.aiNodes?.nodes) {
  for (const node of this.aiNodes.nodes) {
    const loadPressure = this.computeNodeLoadPressure(node);
    this.stressVisuals.updateNodeLoadPressure(node, loadPressure);
  }
}

// Update visuals each frame
this.stressVisuals.update(deltaTime, this.time);
```

### 4. Compute node load pressure (helper)
```javascript
computeNodeLoadPressure(node) {
  if (!node || !node.userData) return 0;
  
  // Option A: Count corrupted links
  const links = node.userData.links || [];
  const corruptedCount = links.filter(link => {
    const linkCorruption = link.userData?.corruption ?? 0;
    return linkCorruption > 0.3; // Moderate corruption threshold
  }).length;
  
  // Normalize to 0–1 scale
  const maxLinks = Math.max(1, links.length);
  return Math.min(1, corruptedCount / maxLinks);
  
  // Option B: Use harmony (lower = higher pressure)
  // const harmony = node.userData?.harmonyLevel ?? 1;
  // return 1 - harmony;
  
  // Option C: Combine both
  // const harmonyPressure = 1 - (node.userData?.harmonyLevel ?? 1);
  // const corruptionPressure = corruptedCount / maxLinks;
  // return Math.max(harmonyPressure, corruptionPressure);
}
```

---

## VISUAL BEHAVIOR

### Network Stress (Global)
- **Input:** `networkStress` (0–1, from LinkCorruptionTransmission)
- **Output:** 
  - Color shift: blue (cool) → orange → red (hot)
  - Fog density increase (visibility reduction)
  - Ambient light dimming (ominous feel)
  - Subtle background turbulence

**Effect:** Players feel network tension before seeing numbers

### Load Pressure (Node-Local)
- **Input:** `node.loadPressure` (0–1, computed locally)
- **Output:**
  - Node jitter/vibration (intensity = load)
  - Pulse rate acceleration (up to 3× normal)
  - Connector glow emphasis
  - Stress overlay intensity

**Effect:** Overloaded nodes are immediately identifiable

---

## DATA FLOW (READ-ONLY)

```
LinkCorruptionTransmission_v1.computeNetworkStress()
  ↓
  networkStress (0–1)
  ↓
  CanonicalTemplate3_StressVisuals.updateNetworkStress()
  ↓
  Ambient effects (fog, light, color)

Per-node corruption analysis
  ↓
  node.loadPressure (0–1)
  ↓
  CanonicalTemplate3_StressVisuals.updateNodeLoadPressure()
  ↓
  Node jitter, pulse, glow effects
```

**No reverse flow. No modification. Read-only only.**

---

## SHADER INTEGRATION (OPTIONAL)

For advanced visual effects, consume stress values in shaders:

### 1. Network Stress in Post-Processing
```glsl
uniform float uNetworkStress;

void main() {
  // Add distortion based on network stress
  vec2 distort = vec2(
    sin(uNetworkStress * vUv.y * 10.0) * 0.02,
    cos(uNetworkStress * vUv.x * 10.0) * 0.02
  );
  
  gl_FragColor = texture2D(tDiffuse, vUv + distort);
}
```

### 2. Node Stress in Material
```javascript
const stressMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uStressIntensity: { value: 0 },
    uStressPulsePhase: { value: 0 },
    uTime: { value: 0 }
  },
  vertexShader: nodeStressVertexShader,
  fragmentShader: nodeStressFragmentShader,
  transparent: true
});

// Update each frame
stressMaterial.uniforms.uStressIntensity.value = node.userData.stressIntensity ?? 0;
stressMaterial.uniforms.uStressPulsePhase.value = node.userData.stressPulsePhase ?? 0;
```

---

## VERIFICATION

After integration, verify:

- [ ] Increasing network stress visibly changes ambient feel (color → fog → light)
- [ ] Overloaded nodes jitter and pulse
- [ ] Visuals calm down when stress/load decreases
- [ ] No gameplay changes (stats, mechanics unchanged)
- [ ] Node Inspector values match visual state
- [ ] Performance impact < 1ms per frame

---

## DEBUG COMMANDS

In browser console:

```javascript
// Print current stress levels
window.atoma.stressVisuals.debugPrintStress();

// Check global network stress
console.log(window.atoma.stressVisuals.getNetworkStress());

// Check specific node load
console.log(window.atoma.stressVisuals.getNodeLoadPressure(someNode));

// Enable debug logging
window.atoma.stressVisuals.debugMode = true;
```

---

## COMPATIBILITY

- ✅ Works with existing visual systems (non-invasive)
- ✅ Reads-only from existing metrics (no mutations)
- ✅ Pure visualization (no gameplay logic)
- ✅ Canonical Visual Template compliant
- ✅ Zero dependency on TIER 1 systems (orthogonal)

---

## CUSTOMIZATION

To adjust visual intensity without changing logic:

```javascript
// In CanonicalTemplate3_StressVisuals constructor:
this.maxJitterAmount = 0.02;        // Reduce for subtler jitter
this.maxFogDensity = 0.03;          // Reduce for less fog
this.maxPulseRate = 3.0;            // Reduce for slower pulses
```

---

## TROUBLESHOOTING

**Q: Jitter looks too extreme**
A: Reduce `maxJitterAmount` in constructor (default 0.02)

**Q: Fog too opaque**
A: Reduce `maxFogDensity` in constructor (default 0.03)

**Q: Nodes don't show load pressure**
A: Verify `updateNodeLoadPressure()` is called each frame and returns 0–1 values

**Q: Shaders aren't rendering**
A: Ensure shaders are imported and materials created with correct uniforms

---

**Status: Ready for production** ✅

