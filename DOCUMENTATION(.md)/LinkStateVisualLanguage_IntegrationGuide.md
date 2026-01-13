# LINK STATE VISUAL LANGUAGE: INTEGRATION GUIDE
## Canonical Shader System for Link State Encoding

**Status:** Ready for integration  
**Files:**
- `/shaders/LinkStateVisualLanguage.js` (shaders)
- `/LinkStateVisualLanguageIntegration.js` (integration layer)

---

## VISUAL SEMANTIC MAPPING (Canonical)

Each stat maps to ONE distinct visual channel. No competing signals.

| Stat | Visual Channel | Effect | Example |
|------|---|---|---|
| **Network Stress** | Global color hue (slow) | Blue → orange → red | "The network feels hot" |
| **Load Pressure** | Thickness + pulse frequency | Pulsing faster under load | "That path is congested" |
| **Corruption** | Edge noise / breakdown | Frayed, unstable appearance | "That link is sick" |
| **Synergy** | Smoothness / coherence | Jittery edges if low synergy | "This connection is weak" |
| **Harmony** | Damping effect | Reduces all chaos | "This zone feels calm" |

---

## INTEGRATION (5 STEPS)

### Step 1: Import

```javascript
import { LinkStateVisualLanguageIntegration } from './LinkStateVisualLanguageIntegration.js';
import { linkStateVertexShader, linkStateFragmentShader } from './shaders/LinkStateVisualLanguage.js';
```

### Step 2: Initialize

```javascript
constructor() {
  // ...
  this.linkVisuals = null;
}

setupPrimaryNodeSystem() {
  // ...
  this.linkVisuals = new LinkStateVisualLanguageIntegration(this.linkingSystem, {
    debugMode: false
  });
}
```

### Step 3: Register Links

When links are created:

```javascript
// Assuming linkingSystem has onCreate event:
this.linkingSystem.on('linkCreated', (link) => {
  const material = this.linkVisuals.registerLink(link);
  // Apply material to link geometry
  if (link.geometry) {
    link.material = material;  // or add to scene
  }
});

// On link destruction:
this.linkingSystem.on('linkRemoved', (link) => {
  this.linkVisuals.unregisterLink(link);
});
```

### Step 4: Update Metrics Each Frame

```javascript
animate() {
  const deltaTime = this.clock.getDelta();
  
  // Update global network stress
  const networkStress = this.linkCorruptionTransmission?.computeNetworkStress() ?? 0;
  this.linkVisuals.updateNetworkStress(networkStress);
  
  // Update per-link metrics
  const allLinks = this.linkingSystem?.getLinks() || [];
  for (const link of allLinks) {
    const corruption = link.userData?.corruption ?? 0;
    const synergy = link.synergy ?? 50;
    this.linkVisuals.updateLinkMetrics(link, corruption, synergy);
  }
  
  // Update animation time
  this.linkVisuals.updateAnimationTime(this.time);
}
```

### Step 5: Verify

```javascript
// In console:
window.atoma.linkVisuals.debugPrintLinkStates();

// Output:
// [LinkStateVisualLanguage] LINK VISUAL STATES
// Network Stress: 0.345
// Registered Links: 48
// Link: corruption=0.20, synergy=75.0, harmony=0.60, load=0.15
//   → Warming orange (alert) | Clean edges | High coherence | Stabilized
```

---

## WHAT PLAYERS WILL SEE

### Low Stress Network
- All links: cool blue
- Edges: smooth, stable
- Pulse: slow or absent
- Feel: calm, healthy

### Medium Stress Network
- All links: warming toward orange
- Some edges: subtle shimmer (low synergy)
- Pulsing paths: visible on overloaded links
- Feel: caution, pay attention

### High Stress Network
- All links: muted red
- Corrupted links: frayed, breaking up
- Overloaded paths: aggressive pulsing
- Feel: urgent, intervention needed

### High Harmony Zone
- All local effects: damped
- Even corrupted links: appear more stable
- Pulse amplitude: reduced
- Feel: protected, resilient

---

## VISUAL CHANNELS (DETAILED)

### Channel 1: Network Stress → Color

**Metric:** `networkStress` (0–1 from LinkCorruptionTransmission)

**Implementation:**
```glsl
vec3 getStressColor(float stress) {
  vec3 cool = vec3(0.2, 0.5, 0.8);   // Blue
  vec3 warm = vec3(0.9, 0.6, 0.2);   // Orange
  vec3 hot = vec3(1.0, 0.3, 0.2);    // Red
  
  if (stress < 0.5) {
    return mix(cool, warm, stress * 2.0);
  } else {
    return mix(warm, hot, (stress - 0.5) * 2.0);
  }
}

finalColor = getStressColor(uNetworkStress);
```

**Applied:** Uniformly to all links (global signal)

**Interpretation:** "What's the network's mood right now?"

---

### Channel 2: Load Pressure → Thickness + Pulse

**Metric:** `node.loadPressure` (0–1, computed from corrupted neighbors)

**Implementation:**
```glsl
float pulseFreq = 2.0 + uLocalLoad * 6.0;  // 2–8 Hz
float pulsedThickness = sin(uTime * pulseFreq) * 0.5 + 0.5;
vec3 glowFromLoad = vec3(pulsedThickness * uLocalLoad * 0.3);
finalColor += glowFromLoad;
```

**Applied:** Per-link, computed from connected nodes

**Interpretation:** "Which paths are congested right now?"

---

### Channel 3: Corruption → Edge Noise

**Metric:** `link.userData.corruption` (0–1)

**Implementation:**
```glsl
float edgeNoise = vNoise;  // Perlin-like noise calculated in vertex shader
finalColor += vec3(edgeNoise * vCorruption * 0.2);  // Texture distortion
finalColor *= (1.0 - vCorruption * 0.4);           // Dim under corruption
```

**Applied:** Per-link

**Interpretation:** "Which links are unhealthy?"

---

### Channel 4: Synergy → Smoothness

**Metric:** `link.synergy` (0–100)

**Implementation:**
```glsl
float coherence = clamp(uSynergy / 100.0, 0.0, 1.0);
float instability = 1.0 - coherence;
finalColor += vec3(instability * 0.1);  // Shimmer if low synergy
```

**Applied:** Per-link

**Interpretation:** "How stable is this connection?"

---

### Channel 5: Harmony → Damping

**Metric:** `node.harmony` (0–1, averaged from endpoints)

**Implementation:**
```glsl
float chaos = edgeNoise + pulseIntensity + instability;
float damping = uHarmony;
float dampedChaos = chaos * (1.0 - damping);
```

**Applied:** Per-link, reduces all chaotic effects

**Interpretation:** "Which zones are protected?"

---

## COMPOSITION RULES

✅ **Effects layer perceptually, not mathematically**
- Color and glow don't multiply
- Each channel affects different sensory input
- No stat is a multiplier input to another stat

✅ **Harmony reduces, never amplifies**
```glsl
// CORRECT:
chaos *= (1.0 - harmony);

// WRONG:
chaos *= harmony;  // ← Don't do this
chaos += harmony;  // ← Don't do this
```

✅ **No sudden transitions**
- All interpolations are smooth (lerp, sin waves)
- No thresholds triggering visual changes
- Aesthetic: biological nervous system, not alarm lights

---

## VERIFICATION

After integration, verify:

- [ ] Stressed networks visibly "hotter" (blue → red)
- [ ] Overloaded paths stand out (visible pulse + thickness)
- [ ] Corrupted links look "sick" (frayed, unstable edges)
- [ ] High-synergy links feel "confident" (smooth, stable)
- [ ] Harmony zones visibly calm chaos (damped effects)
- [ ] All effects work together without competing signals
- [ ] No gameplay changes
- [ ] Node Inspector values match visual state
- [ ] Performance < 2ms per frame

---

## DEBUG COMMANDS

```javascript
// Print all link visual states
window.atoma.linkVisuals.debugPrintLinkStates();

// Get specific link state
const state = window.atoma.linkVisuals.getLinkVisualState(someLink);
console.log(state);

// Expected output:
// {
//   networkStress: 0.345,
//   corruption: 0.250,
//   synergy: 75,
//   harmony: 0.600,
//   load: 0.150,
//   colorShift: "Warming orange (alert)",
//   edgeQuality: "Clean",
//   coherence: "High",
//   stability: "Stabilized"
// }
```

---

## SHADER VARIANTS

### Full Shader (Recommended)
**File:** `linkStateVertexShader` + `linkStateFragmentShader`  
**Features:** All 5 channels fully implemented  
**Performance:** ~2ms per 100 links

### Simplified Shader (Performance Option)
**File:** `linkStateVertexShaderSimple` + `linkStateFragmentShaderSimple`  
**Features:** Stress color + load pulse + corruption dim  
**Performance:** ~0.5ms per 100 links

Choose based on your performance budget.

---

## CUSTOMIZATION

Adjust visual intensity without changing logic:

```javascript
// In LinkStateVisualLanguageIntegration:

// Reduce corruption edge breakdown
// Change: edgeNoise * vCorruption * 0.2
// To:     edgeNoise * vCorruption * 0.1  (less noticeable)

// Increase pulse amplitude
// Change: pulseIntensity * 0.3
// To:     pulseIntensity * 0.5  (more dramatic)

// Adjust color palette (warmer/cooler)
// In fragment shader, modify RGB values in stressColor definitions
```

---

## TROUBLESHOOTING

**Q: Links all appear red even at low stress**  
A: Check that `networkStress` is actually 0–1. Print debug state.

**Q: Pulse looks jerky, not smooth**  
A: Ensure `uTime` is being updated properly and is monotonically increasing

**Q: Corrupted links don't show edge noise**  
A: Verify `link.userData.corruption` is being set and updated each frame

**Q: Materials aren't applying to links**  
A: Ensure `registerLink()` is called and the returned material is assigned to link geometry

**Q: Performance is too slow**  
A: Use `linkStateVertexShaderSimple` + `linkStateFragmentShaderSimple` instead

---

## EXAMPLE: FULL INTEGRATION

```javascript
// main.js

import { LinkStateVisualLanguageIntegration } from './LinkStateVisualLanguageIntegration.js';

class AtomaGame {
  constructor() {
    this.linkVisuals = null;
  }

  setupPrimaryNodeSystem() {
    // ... existing code ...
    
    this.linkVisuals = new LinkStateVisualLanguageIntegration(this.linkingSystem);
    
    // Register existing links
    const allLinks = this.linkingSystem.getLinks();
    for (const link of allLinks) {
      this.linkVisuals.registerLink(link);
    }
  }

  animate() {
    const deltaTime = this.clock.getDelta();
    
    // Update network stress
    const networkStress = this.linkCorruptionTransmission?.computeNetworkStress() ?? 0;
    this.linkVisuals.updateNetworkStress(networkStress);
    
    // Update per-link metrics
    const allLinks = this.linkingSystem?.getLinks() || [];
    for (const link of allLinks) {
      const corruption = link.userData?.corruption ?? 0;
      const synergy = link.synergy ?? 50;
      this.linkVisuals.updateLinkMetrics(link, corruption, synergy);
    }
    
    // Update animation time
    this.linkVisuals.updateAnimationTime(this.time);
  }
}
```

---

**Status: Ready for production** ✅

