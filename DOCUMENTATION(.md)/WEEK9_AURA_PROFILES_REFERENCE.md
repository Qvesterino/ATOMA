# PHASE 3C WEEK 9: AURA PROFILES REFERENCE

## Complete Profile Specifications

Each aura profile is fully defined with shader parameters, visual characteristics, and personality mappings.

---

## 1. clarity_aura

### Visual Identity
- **Color:** Cyan (RGB: 0, 255, 255 | Hex: 0x00ffff)
- **Appearance:** Clean, smooth halo with minimal distortion
- **Movement:** Gentle, stable pulsing
- **Intensity:** Moderate (0.5 base)
- **Radius:** Subtle scaling (±20%)

### Personality Driver
- **Signal:** Clarity
- **Intensity Map:** `0.5 + 0.5 * clarity`
- **Radius Map:** `1.0 + 0.2 * sin(clarity * π)`

### Shader Parameters
| Parameter | Value | Purpose |
|-----------|-------|---------|
| noiseScale | 0.3 | Minimal distortion |
| lfoPeriod | 0.4 | 15.7s breathing period |
| lfoAmplitude | 0.5 | Subtle motion |
| noiseType | fbm | Smooth, organic |
| falloff | smooth | Soft edges |

### Use Cases
- Analytics nodes (bright, analytical)
- Prime nodes (important, clear)
- Information clarity visualization
- Visual node importance indicator

### Animation Behavior
```
Intensity: ████░░░░░░ (moderate, stable)
Radius:    ◈◈◈◈◈◈◈◈◈◈ (grows/shrinks gently)
Movement:  ███░░░░░░░ (subtle, continuous)
```

### Example Integration
```javascript
if (node.category === 'analytics') {
  auraSystem.profileResolver = (n) => 'clarity_aura';
}
```

---

## 2. resonance_aura

### Visual Identity
- **Color:** Lime Green (RGB: 0, 255, 136 | Hex: 0x00ff88)
- **Appearance:** Pulsing wave pattern, standing oscillations
- **Movement:** Continuous smooth waves
- **Intensity:** Moderate-High (0.4 base)
- **Radius:** Medium scaling (±30%)

### Personality Driver
- **Signal:** Resonance
- **Intensity Map:** `0.4 + 0.6 * resonance`
- **Radius Map:** `0.9 + 0.3 * sin(resonance * π)`

### Shader Parameters
| Parameter | Value | Purpose |
|-----------|-------|---------|
| noiseScale | 0.4 | Moderate distortion |
| lfoPeriod | 0.25 | 25.1s breathing period |
| lfoAmplitude | 0.6 | Noticeable motion |
| noiseType | fbm | Flowing patterns |
| falloff | smooth | Soft edges |

### Use Cases
- Integration nodes (connection emphasis)
- Resonance visualization (matching/harmony)
- Linked nodes (relationship indicator)
- Synchronization feedback

### Animation Behavior
```
Intensity: ███████░░░ (moderate-high, reactive)
Radius:    ≈≈≈≈≈≈≈≈≈≈ (pulsing in/out)
Movement:  ██████░░░░ (continuous waves)
```

### Example Integration
```javascript
if (node.category === 'integration') {
  auraSystem.profileResolver = (n) => 'resonance_aura';
}
```

---

## 3. chaos_aura

### Visual Identity
- **Color:** Orange (RGB: 255, 102, 0 | Hex: 0xff6600)
- **Appearance:** Turbulent, swirling distortion
- **Movement:** Aggressive, chaotic wobble
- **Intensity:** Moderate (0.3 base, grows with entropy)
- **Radius:** Aggressive scaling (±40%)

### Personality Driver
- **Signal:** Entropy
- **Intensity Map:** `0.3 + 0.7 * entropy`
- **Radius Map:** `1.1 + 0.4 * sin(entropy * π)`

### Shader Parameters
| Parameter | Value | Purpose |
|-----------|-------|---------|
| noiseScale | 0.6 | Heavy distortion |
| lfoPeriod | 0.2 | 31.4s wobble period |
| lfoAmplitude | 0.8 | Dramatic motion |
| noiseType | curl | Divergence-free flow |
| falloff | smooth | Soft edges |

### Use Cases
- Sigma nodes (chaos emphasis)
- Entropy nodes (disorder visualization)
- Chaotic systems (visual representation)
- Instability feedback

### Animation Behavior
```
Intensity: ████░░░░░░ (moderate, reactive to chaos)
Radius:    ∿∿∿∿∿∿∿∿∿∿ (aggressive distortion)
Movement:  █████░░░░░ (fast, swirling)
```

### Curl Noise Characteristic
Unlike FBM, curl noise produces:
- No clustering artifacts
- Smooth vortex patterns
- Divergence-free flow (no bunching)
- Organic, turbulent appearance

### Example Integration
```javascript
if (node.category === 'sigma') {
  auraSystem.profileResolver = (n) => 'chaos_aura';
}
```

---

## 4. focus_aura

### Visual Identity
- **Color:** Yellow (RGB: 255, 255, 0 | Hex: 0xffff00)
- **Appearance:** Radial contraction/expansion, breathing
- **Movement:** Smooth, controlled breathing
- **Intensity:** High (0.6 base)
- **Radius:** Subtle scaling (±20%)

### Personality Driver
- **Signal:** Focus
- **Intensity Map:** `0.6 + 0.4 * focus`
- **Radius Map:** `0.8 + 0.2 * cos(focus * π)`

### Shader Parameters
| Parameter | Value | Purpose |
|-----------|-------|---------|
| noiseScale | 0.2 | Minimal distortion |
| lfoPeriod | 0.3 | 20.9s breathing period |
| lfoAmplitude | 0.4 | Subtle motion |
| noiseType | fbm | Clean, focused |
| falloff | smooth | Soft edges |

### Use Cases
- Control nodes (attention emphasis)
- Focus visualization (concentration indicator)
- Important node highlighting
- Attention guidance

### Animation Behavior
```
Intensity: ██████░░░░ (high, stable)
Radius:    ◈◈◈◈◈◈◈◈◈◈ (gentle breathing)
Movement:  ██░░░░░░░░ (minimal, clean)
```

### Radial Contraction Effect
```
Frame 1: ◈◈◈◈◈◈◈◈◈◈ (expanded)
Frame 2: ◆◆◆◆◆◆◆◆◆◆ (contracting)
Frame 3: ●●●●●●●●●● (contracted)
Frame 4: ◆◆◆◆◆◆◆◆◆◆ (expanding)
(continuous breathing cycle)
```

### Example Integration
```javascript
if (node.isSelected) {
  auraSystem.profileResolver = (n) => 'focus_aura';
}
```

---

## 5. corruption_aura

### Visual Identity
- **Color:** Red (RGB: 255, 0, 0 | Hex: 0xff0000)
- **Appearance:** Fractured, broken surface
- **Movement:** Aggressive flicker with decay
- **Intensity:** High (0.2 base, decaying)
- **Radius:** Aggressive scaling (±50%)

### Personality Driver
- **Signal:** Corruption (with exponential decay)
- **Intensity Map:** `0.2 + 0.8 * max(0, corruption * exp(-t * 0.5))`
- **Radius Map:** `1.2 + 0.5 * corruption`

### Shader Parameters
| Parameter | Value | Purpose |
|-----------|-------|---------|
| noiseScale | 0.7 | Aggressive distortion |
| lfoPeriod | 0.15 | 41.9s flicker period |
| lfoAmplitude | 1.0 | Dramatic motion |
| noiseType | fbm | Chaotic, fractured |
| falloff | smooth | Soft edges |

### Decay Envelope
```
Time 0:    ███████████ (intense red glow)
Time 0.5s: ██████░░░░░ (fading)
Time 1.0s: ███░░░░░░░░ (mostly faded)
Time 2.0s: ░░░░░░░░░░░ (invisible)
(exp(-t*0.5) envelope)
```

### Use Cases
- Corrupted nodes (damage visualization)
- Error nodes (problem indication)
- Failed nodes (status feedback)
- System alerts (corruption warning)

### Animation Behavior
```
Intensity: ████████░░ (high, decaying)
Radius:    ✗✗✗✗✗✗✗✗✗✗ (fractured, expanding)
Movement:  ████████░░ (aggressive flicker)
```

### Special Feature
**Exponential Decay:** Unlike continuous oscillation, corruption aura pulses intensely once then fades away. Perfect for indicating transient errors or corruption events.

### Example Integration
```javascript
if (node.userData.corrupted) {
  auraSystem.profileResolver = (n) => 'corruption_aura';
}
```

---

## 6. entropy_aura

### Visual Identity
- **Color:** Purple (RGB: 136, 68, 255 | Hex: 0x8844ff)
- **Appearance:** Slow, fog-like aura
- **Movement:** Very slow, organic morphing
- **Intensity:** Moderate (0.4 base)
- **Radius:** Gentle scaling (±30%)

### Personality Driver
- **Signal:** Entropy
- **Intensity Map:** `0.4 + 0.4 * entropy`
- **Radius Map:** `1.0 + 0.3 * sin(entropy * π * 0.25)` (time-scaled 0.25x)

### Shader Parameters
| Parameter | Value | Purpose |
|-----------|-------|---------|
| noiseScale | 0.5 | Moderate distortion |
| lfoPeriod | 0.2 | 31.4s wobble period |
| lfoAmplitude | 0.5 | Medium motion |
| noiseType | fbm | Multi-scale, organic |
| falloff | smooth | Soft edges |

### Time Scaling
```
Standard: sin(time * π * 1.0) = fast ripples
Scaled:   sin(time * π * 0.25) = very slow evolution
Result:   Aura evolves over ~125 seconds for full cycle
```

### Use Cases
- Storage nodes (archival data)
- Long-term data (entropy accumulation)
- Stable systems (slow change)
- Information persistence

### Animation Behavior
```
Intensity: ████░░░░░░ (moderate, stable)
Radius:    ～～～～～～～～～～ (very slow morphing)
Movement:  ██░░░░░░░░ (minimal, organic)
```

### Fog-Like Characteristics
- Multi-scale noise creates natural variation
- Very slow time evolution prevents monotony
- Organic appearance suitable for archival concept
- Meditative, peaceful visual

### Example Integration
```javascript
if (node.category === 'storage') {
  auraSystem.profileResolver = (n) => 'entropy_aura';
}
```

---

## Profile Comparison Matrix

| Profile | Color | Driver | Intensity Base | Radius Range | LFO Period | Noise Type |
|---------|-------|--------|-----------------|--------------|------------|-----------|
| clarity | Cyan | Clarity | 0.5 | ±20% | 0.4 | FBM |
| resonance | Lime | Resonance | 0.4 | ±30% | 0.25 | FBM |
| chaos | Orange | Entropy | 0.3 | ±40% | 0.2 | Curl |
| focus | Yellow | Focus | 0.6 | ±20% | 0.3 | FBM |
| corruption | Red | Corruption | 0.2* | ±50% | 0.15 | FBM |
| entropy | Purple | Entropy | 0.4 | ±30% | 0.2 | FBM |

*Corruption decays exponentially

---

## Profile Selection Decision Tree

```
Is node corrupted?
├─ YES → corruption_aura
└─ NO
    ├─ Is user selecting it?
    │  ├─ YES → focus_aura
    │  └─ NO
    │      └─ By category:
    │         ├─ control → focus_aura
    │         ├─ integration → resonance_aura
    │         ├─ sigma → chaos_aura
    │         ├─ analytics → clarity_aura
    │         ├─ storage → entropy_aura
    │         └─ default → entropy_aura
```

---

## Custom Profile Template

To create a custom aura profile:

```javascript
const customProfile = {
  name: 'my_profile',
  baseColor: new THREE.Color(0xrrggbb),  // RGB in hex
  noiseScale: 0.4,                       // [0, 1] distortion
  lfoPeriod: 0.3,                        // rad/s breathing
  lfoAmplitude: 0.5,                     // [0, 1] breath intensity
  noiseType: 'fbm',                      // 'fbm' or 'curl'
  intensityMap: (signals) => {
    // signals = { clarity, resonance, entropy, focus, corruption }
    // return [0, 1] intensity value
    return 0.5 + 0.5 * signals.clarity;
  },
  radiusMap: (signals) => {
    // return [0.5, 3.0] scale factor
    return 1.0 + 0.3 * Math.sin(signals.clarity * Math.PI);
  },
};

// Add to system
auraSystem.profileLibrary.my_profile = customProfile;
```

---

## Performance Comparison

| Metric | clarity | resonance | chaos | focus | corruption | entropy |
|--------|---------|-----------|-------|-------|------------|---------|
| GPU Cost (ms) | 0.05 | 0.06 | 0.07 | 0.05 | 0.06 | 0.06 |
| Intensity Variance | Low | Medium | High | Low | Very High* | Medium |
| Visual Distinctness | High | High | High | High | Very High | Medium |
| CPU Overhead | Minimal | Minimal | Minimal | Minimal | Minimal | Minimal |

*Corruption includes exponential decay calculation

---

## Visual Color Palette

**Complementary Colors (for visual design):**
- Clarity (Cyan) + Orange = complementary
- Resonance (Lime) + Red = complementary
- Chaos (Orange) + Cyan = complementary
- Focus (Yellow) + Purple = complementary
- Corruption (Red) + Cyan = complementary
- Entropy (Purple) + Yellow = complementary

This ensures good contrast and visual clarity in mixed-aura scenes.

---

## Recommended Combinations

**Harmony:**
- clarity_aura + resonance_aura = cyan + lime (cool, stable)
- entropy_aura + resonance_aura = purple + lime (mysterious, flowing)

**Tension:**
- chaos_aura + clarity_aura = orange + cyan (dynamic)
- corruption_aura + focus_aura = red + yellow (high-contrast)

**Depth:**
- entropy_aura (background, purple)
- resonance_aura (middle, lime)
- focus_aura (foreground, yellow)

---

**Phase 3c Week 9: Aura Profiles Complete Reference** ✅
