# STATIC AUDIT: VFX/UX Effects Tied to Canonical Metrics

## Summary
Found **5 primary systems** with direct metric-driven visual effects. Most effects use **graduated thresholds** (progressive visual changes) rather than simple on/off triggers.

---

## 1. HARMONIC RESONANCE FEEDBACK SYSTEM
**File:** `HarmonicResonanceFeedbackSystem.js`

### Metrics Used:
- **Harmony** (harmonyBalance: 0-1)
- **Synergy** (averageSynergy: 0-1)  
- **Stability** (stability: 0-1, default 0.7)

### Visual Effects & Thresholds:

#### Resonance Field Radius
- **Harmony influence:** `HARMONY_RADIUS_MULTIPLIER = 1.35`
- **Corruption influence:** `CORRUPTION_RADIUS_MULTIPLIER = 0.6`
- Base radius: `3.5` units (min: `2.0`, max: `6.0`)

#### Alignment Strength
- Base: `0.22` (22% influence)
- Harmony boost: `1.3x` (max 28.6%)
- Corruption dampening: `0.5x` (min 11%)
- Synergy boost: `1.2x`

#### Phase Drift Speed
- Harmony: `0.6`
- Corruption: `0.25`

#### Energy Streak Influence
- Curvature strength: `0.12`
- Speed modulation: `±15%`

#### Pictogram Flow Influence
- Slow factor: `0.88` (12% slowdown)
- Spacing improvement: `1.12`
- Alignment strength: `0.5`

---

## 2. CORRUPTION VISUAL FX SYSTEM
**File:** `CorruptionVisualFX_v1.js`

### Metrics Used:
- **Corruption** (corruptionLevel: 0-1)

### Visual Effects & Thresholds:

#### Color Progression
- **0.0-0.25:** Subtle color shift + mild glow
- **0.25-0.45:** Color intensifies + glow flickers
- **0.45-0.65:** Shader distortion + particle emission
- **0.65-0.85:** Strong glitch effects + particle bursts
- **0.85-1.0:** Extreme corruption + constant visual breakdown

#### Mesh Jitter
- **Threshold:** `> 0.15`
- Amplitude: `corruptionLevel * 0.007`
- Multiple sine waves at different frequencies

#### Chaos Particle Emission
- **Start threshold:** `> 0.45`
- Emission rate: `5` to `30` particles/sec (scales with corruption)
- **Burst threshold:** `> 0.85`
- Burst: `5-10` particles at random intervals

#### Glow Flicker
- Base frequency: `1` Hz
- Max frequency: `8` Hz (at full corruption)
- Base amplitude: `0.05`
- Max amplitude: `0.6`
- Random flicker at `> 0.7`

---

## 3. HARMONY STABILIZATION SYSTEM
**File:** `HarmonyStabilizationSystem_v1.js`

### Metrics Used:
- **Harmony** (harmonyLevel: 0-1)
- **Synergy** (synergy: 0-100)

### Visual Effects & Thresholds:

#### Node Harmony Thresholds
- **0.2:** `DECAY_BEGIN` - Corruption starts decaying
- **0.4:** `LINK_SLOW` - Link corruption slowed
- **0.6:** `CASCADE_DAMPEN` - Cascade events dampened
- **0.8:** `BLOCKING` - Corruption blocked + healing pulse
- **1.0:** `ANCHOR` - Full harmony anchor state

#### Node Visual Stages
- **< 0.1:** No aura
- **0.1-0.3:** Subtle cyan aura (intensity: `0-0.5`)
- **0.3-0.6:** Growing aura + breathing pulse (intensity: `0.3-0.6`)
- **0.6-0.85:** Strong harmonious aura (intensity: `0.6-0.8`)
- **0.85-1.0:** Anchor state - brilliant harmony (intensity: `0.8-1.0`)

#### Link Harmony Thresholds
- **< 0.1:** No ribbon
- **0.1-0.4:** Flowing light ribbon (intensity: `0-0.6`)
- **0.4-0.7:** Active resonance waves (intensity: `0.3-0.8`)
- **0.7-1.0:** Strong harmony flows (intensity: `0.8-1.0`)

#### Synergy-Driven Recovery
- Recovery boost: `1.0 + min(synergy * 0.5, 0.5)` (100% to 150% speed)

---

## 4. LINK STATE VISUAL LANGUAGE (SHADER)
**File:** `shaders/LinkStateVisualLanguage.js`

### Metrics Used:
- **Network Stress** (uNetworkStress: 0-1)
- **Load Pressure** (uLocalLoad: 0-1)
- **Corruption** (uCorruption: 0-1)
- **Synergy** (uSynergy: 0-100)
- **Harmony** (uHarmony: 0-1)

### Visual Effects:

#### Color (Network Stress)
- **0.0-0.5:** Cool blue → Warm orange interpolation
- **0.5-1.0:** Warm orange → Red interpolation
- Colors: 
  - Cool: `rgb(0.2, 0.5, 0.8)`
  - Warm: `rgb(0.9, 0.6, 0.2)`
  - Hot: `rgb(1.0, 0.3, 0.2)`

#### Thickness + Pulse (Load Pressure)
- Base pulse frequency: `2.0` Hz
- Max pulse frequency: `8.0` Hz
- Pulse amplitude scales with `uLocalLoad * 0.03`

#### Edge Decay (Corruption)
- Positional jitter: `noise * uCorruption * 0.02`
- Brightness reduction: `uCorruption * 0.3-0.4`
- Edge breakup texture: `uCorruption * 0.2`

#### Smoothness (Synergy)
- High synergy → Stable, smooth edges
- Low synergy → Subtle jitter in edges
- Opacity: `mix(0.6, 1.0, normalizedSynergy)`

#### Damping (Harmony)
- Reduces ALL chaotic effects
- Damping factor: `1.0 - uHarmony`
- Never amplifies chaos

---

## 5. LINK METRICS TO VISUAL BRIDGE
**File:** `LinkMetricsToVisualBridge_v1.js`

### Metrics Used:
- Derived from link quality, collapse, corruption, contagion

### Thresholds:

#### Fracture Intensity
- **< 0.15:** No fracture (0%)
- **0.15-0.35:** Light fracture (0-50%)
- **0.35-0.65:** Medium fracture (50-90%)
- **0.65+:** Heavy fracture (90-100%)

#### Weight Configuration
- Degradation: `0.35`
- Collapse: `0.30`
- Corruption: `0.25`
- Contagion: `0.10`

#### Kink Intensity
- Max kinks: `5.0` (at full stress)
- Formula: `stress² * 3.0`

---

## SUMMARY TABLE

| Metric | File | Thresholds | Visual Effect |
|--------|------|------------|---------------|
| **Harmony** | HarmonicResonanceFeedbackSystem.js | 0-1 | Field radius (2.0-6.0), alignment (11-28.6%), phase speed (0.25-0.6) |
| **Harmony** | HarmonyStabilizationSystem_v1.js | 0.2, 0.4, 0.6, 0.8, 1.0 | Aura intensity (0-100%), pulse frequency, anchor state |
| **Synergy** | HarmonicResonanceFeedbackSystem.js | 0-1 | Alignment boost (1.2x) |
| **Synergy** | HarmonyStabilizationSystem_v1.js | 0-100 | Recovery acceleration (100-150%) |
| **Synergy** | LinkStateVisualLanguage.js | 0-100 | Edge smoothness, opacity (0.6-1.0) |
| **Stability** | HarmonicResonanceFeedbackSystem.js | 0-1 | Field initialization (default 0.7) |
| **Corruption** | CorruptionVisualFX_v1.js | 0.15, 0.45, 0.85 | Mesh jitter, particles, glow flicker, color distortion |
| **Corruption** | HarmonyStabilizationSystem_v1.js | - | Blocks corruption spread at harmony > 0.8 |
| **Corruption** | LinkStateVisualLanguage.js | 0-1 | Edge decay, brightness reduction, opacity |
| **LoadPressure** | LinkStateVisualLanguage.js | 0-1 | Thickness pulse (2-8 Hz), pulse amplitude |
| **LoadPressure** | LinkMetricsToVisualBridge_v1.js | 0.15, 0.35, 0.65 | Fracture intensity, kinks |

---

## Key Findings

1. **No hard binary triggers** - All effects use graduated thresholds for smooth transitions
2. **Cross-metric modulation** - Harmony boosts synergy effects, corruption dampens them
3. **Performance-conscious** - Most effects have minimum thresholds to avoid unnecessary computation
4. **Visual-first design** - Metrics drive appearance (color, glow, motion) rather than discrete states
5. **LoadPressure** appears primarily in shader system, affecting link thickness/pulse
6. **Synergy** mostly affects smoothness and recovery speed
7. **Stability** is less directly visualized, mainly used as initialization parameter