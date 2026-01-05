# WEEK 10: LINK AURA PROFILES — COMPLETE REFERENCE

Complete technical specification for all 6 aura profiles used by LinkAuraSystem_v1.

---

## 1. SYNERGY_AURA

### Visual Profile
```
Name:        synergy_aura
Color:       #00ff88 (Cyan-green)
Type:        Harmonic waveform
Description: High-compatibility link indicator
```

### Technical Specifications
```javascript
synergy_aura: {
  name: 'synergy_aura',
  baseColor: new THREE.Color(0x00ff88),
  lfoSpeed: 2.0,           // Moderate oscillation
  noiseStrength: 0.3,      // Subtle noise
  corruptionMult: 0.1,     // Low corruption influence
  radiusScale: 0.7,        // Tight cylinder
  intensityMapping: (synergy, quality, entropy) => synergy * 0.8,
  description: 'Harmonic cyan-green waves, driven by synergy and quality'
}
```

### Data Source
```
Primary Signal: link.userData.quality.synergyNorm (0-1)
Secondary Signal: link.userData.quality.score (0-100)
Tertiary Signal: link.userData.metrics.entropy (0-1)
```

### Intensity Equation
```
intensity = min(1.0, synergy * 0.8) * (1 - instability * 0.3)

Examples:
  synergy=1.0 → intensity ≈ 0.80
  synergy=0.75 → intensity ≈ 0.60
  synergy=0.5 → intensity ≈ 0.40
  synergy=0.25 → intensity ≈ 0.20
```

### Radius Mapping
```
radiusScale: 0.7 (tight)
radius = 0.7 * (0.5 + quality/100 * 0.7)

Examples (quality=50):
  radius = 0.7 * 0.85 = 0.595

Examples (quality=100):
  radius = 0.7 * 1.2 = 0.84
```

### LFO Modulation
```
lfoSpeed: 2.0 Hz
lfo = sin(timeScaled * 2.0) * 0.5 + 0.5

Creates 2 Hz pulsing: 0.5 → 1.0 → 0.5 per cycle
Period: 0.5 seconds
```

### Use Cases
- High synergy node pairs (AI concept compatibility)
- Complementary node characteristics
- Harmonic resonance between connections
- User-suggested optimal pairings

### User Message
> "✨ Harmonic connection detected — excellent node compatibility!"

---

## 2. STABILITY_AURA

### Visual Profile
```
Name:        stability_aura
Color:       #0088ff (Soft blue)
Type:        Calm cylindrical glow
Description: Link structural quality indicator (DEFAULT)
```

### Technical Specifications
```javascript
stability_aura: {
  name: 'stability_aura',
  baseColor: new THREE.Color(0x0088ff),
  lfoSpeed: 1.2,           // Slow oscillation
  noiseStrength: 0.2,      // Very subtle noise
  corruptionMult: 0.15,    // Minimal corruption
  radiusScale: 1.2,        // Wide cylinder
  intensityMapping: (synergy, quality, entropy) => quality / 100 * 0.7,
  description: 'Wide calm blue glow, driven by link quality'
}
```

### Data Source
```
Primary Signal: link.userData.quality.score (0-100)
Secondary Signal: link.userData.quality.synergyNorm (0-1)
Tertiary Signal: link.userData.metrics.entropy (0-1)
```

### Intensity Equation
```
intensity = min(1.0, quality/100 * 0.7) * (1 - instability * 0.3)

Quality Score Mapping:
  quality=100 → intensity ≈ 0.70 (brightest)
  quality=80 → intensity ≈ 0.56
  quality=60 → intensity ≈ 0.42
  quality=40 → intensity ≈ 0.28
  quality=20 → intensity ≈ 0.14
  quality=0 → intensity = 0.0
```

### Radius Mapping
```
radiusScale: 1.2 (wide)
radius = 1.2 * (0.5 + quality/100 * 0.7)

Max radius (quality=100): 1.2 * 1.2 = 1.44 units
Min radius (quality=0): 1.2 * 0.5 = 0.60 units
```

### LFO Modulation
```
lfoSpeed: 1.2 Hz
lfo = sin(timeScaled * 1.2) * 0.5 + 0.5

Creates 1.2 Hz gentle pulsing
Period: 0.833 seconds
```

### Use Cases
- Default aura for all stable links
- Structural quality visualization
- Safe, reliable connections
- Baseline link state
- High usage (most common profile)

### Quality Levels
```
Quality 0-20:   Weak aura (barely visible)
Quality 20-40:  Faint aura (minor instability)
Quality 40-60:  Moderate aura (acceptable)
Quality 60-80:  Strong aura (good stability)
Quality 80-100: Bright aura (excellent quality)
```

### User Message
> "🔵 Stable link — structural integrity confirmed"

---

## 3. CORRUPTION_AURA

### Visual Profile
```
Name:        corruption_aura
Color:       #ff3300 (Bright red)
Type:        Jittery fractures & spikes
Description: Link corruption indicator (WARNING)
```

### Technical Specifications
```javascript
corruption_aura: {
  name: 'corruption_aura',
  baseColor: new THREE.Color(0xff3300),
  lfoSpeed: 3.5,           // Fast oscillation
  noiseStrength: 0.8,      // High noise
  corruptionMult: 1.0,     // Full corruption influence
  radiusScale: 0.6,        // Tight, tense appearance
  intensityMapping: (synergy, quality, entropy, corruption) => 
    Math.min(1, corruption * 1.5),
  description: 'Jittery red fractures, driven by corruption signal'
}
```

### Data Source
```
Primary Signal: link.userData.metrics.corruption (0-1)
Secondary Signal: link.userData.quality.score (0-100)
Tertiary Signal: link.userData.metrics.entropy (0-1)
```

### Intensity Equation
```
intensity = min(1.0, corruption * 1.5) * (1 - instability * 0.3)

Corruption Level Mapping:
  corruption=0.67 → intensity ≈ 1.0 (max red aura)
  corruption=0.50 → intensity ≈ 0.75 (strong warning)
  corruption=0.33 → intensity ≈ 0.50 (moderate warning)
  corruption=0.17 → intensity ≈ 0.25 (minor warning)
  corruption=0.0 → intensity = 0.0 (invisible)
```

### Radius Mapping
```
radiusScale: 0.6 (tight, constricted)
radius = 0.6 * (0.5 + quality/100 * 0.7)

Max radius (quality=100): 0.6 * 1.2 = 0.72 units
Min radius (quality=0): 0.6 * 0.5 = 0.30 units

Note: Tighter radius creates "danger" visual effect
```

### LFO Modulation
```
lfoSpeed: 3.5 Hz (fast)
lfo = sin(timeScaled * 3.5) * 0.5 + 0.5

Creates 3.5 Hz rapid flickering
Period: 0.286 seconds
```

### Noise Characteristics
```
noiseStrength: 0.8 (high)
corruptionMult: 1.0 (full intensity)

Combined effect: Visible jitter and fracture patterns
Creates unease through rapid visual noise
```

### Use Cases
- Detected data corruption in link
- Protocol violations or errors
- Compromised connections
- User warning for unreliable links
- Quarantined or flagged connections

### Corruption Triggers
```
corruption > 0.45: Strong red aura
corruption > 0.60: Maximum intensity + flashing
corruption > 0.75: Extreme flickering (disconnect warning)
```

### User Message
> "🚨 CORRUPTION DETECTED — Link integrity compromised! Disconnecting..."

---

## 4. CHAOS_AURA

### Visual Profile
```
Name:        chaos_aura
Color:       #ff8800 (Bright orange)
Type:        Turbulent curl-noise flow
Description: Link entropy/instability indicator
```

### Technical Specifications
```javascript
chaos_aura: {
  name: 'chaos_aura',
  baseColor: new THREE.Color(0xff8800),
  lfoSpeed: 2.8,           // Fast-moderate oscillation
  noiseStrength: 0.7,      // High noise
  corruptionMult: 0.8,     // Significant corruption
  radiusScale: 0.8,        // Medium-tight
  intensityMapping: (synergy, quality, entropy) => entropy * 0.9,
  description: 'Turbulent orange curl-noise flow, driven by entropy'
}
```

### Data Source
```
Primary Signal: link.userData.metrics.entropy (0-1)
Secondary Signal: link.userData.metrics.entropyPenalty (0-1)
Tertiary Signal: link.userData.quality.score (0-100)
```

### Intensity Equation
```
intensity = min(1.0, entropy * 0.9) * (1 - instability * 0.3)

Entropy Level Mapping:
  entropy=1.0 → intensity ≈ 0.90 (maximum chaos)
  entropy=0.75 → intensity ≈ 0.68
  entropy=0.50 → intensity ≈ 0.45
  entropy=0.25 → intensity ≈ 0.23
  entropy=0.0 → intensity = 0.0
```

### Radius Mapping
```
radiusScale: 0.8 (medium-tight)
radius = 0.8 * (0.5 + quality/100 * 0.7)

Max radius (quality=100): 0.8 * 1.2 = 0.96 units
Min radius (quality=0): 0.8 * 0.5 = 0.40 units
```

### LFO Modulation
```
lfoSpeed: 2.8 Hz
lfo = sin(timeScaled * 2.8) * 0.5 + 0.5

Creates 2.8 Hz fast pulsing
Period: 0.357 seconds
```

### Noise Characteristics
```
noiseStrength: 0.7 (high)
corruptionMult: 0.8 (significant)

Curl noise creates organic, turbulent distortion patterns
Resembles chaotic fluid flow around the link
```

### Use Cases
- Highly unstable node connections
- Chaotic signal flow
- Temporary connection glitches
- Entropy penalty visualization
- Volatile links (high change rate)

### Entropy Triggers
```
entropy > 0.60: Orange aura appears
entropy > 0.80: Strong turbulent effect
entropy > 0.95: Extreme chaos (nearly invisible due to flickering)
```

### Distinction from Corruption
```
CHAOS:       Orange, turbulent, organic, flow-based
CORRUPTION:  Red, jittery, sharp, fracture-based
```

### User Message
> "⚡ Chaotic connection — extreme volatility detected!"

---

## 5. RESONANCE_AURA

### Visual Profile
```
Name:        resonance_aura
Color:       #88ff00 (Lime-green)
Type:        Smooth harmonic pulse
Description: Link resonance/compatibility indicator
```

### Technical Specifications
```javascript
resonance_aura: {
  name: 'resonance_aura',
  baseColor: new THREE.Color(0x88ff00),
  lfoSpeed: 1.8,           // Moderate oscillation
  noiseStrength: 0.4,      // Moderate noise
  corruptionMult: 0.2,     // Low corruption
  radiusScale: 0.9,        // Medium
  intensityMapping: (synergy, quality, entropy, corruption, resonance) => 
    resonance * 0.8,
  description: 'Smooth harmonic pulse, driven by resonance boost'
}
```

### Data Source
```
Primary Signal: link.userData.metrics.resonance (0-1)
Secondary Signal: link.userData.metrics.resonanceBoost (0-1)
Tertiary Signal: link.userData.quality.synergyNorm (0-1)
```

### Intensity Equation
```
intensity = min(1.0, resonance * 0.8) * (1 - instability * 0.3)

Resonance Level Mapping:
  resonance=1.0 → intensity ≈ 0.80 (maximum harmony)
  resonance=0.75 → intensity ≈ 0.60
  resonance=0.50 → intensity ≈ 0.40
  resonance=0.25 → intensity ≈ 0.20
  resonance=0.0 → intensity = 0.0
```

### Radius Mapping
```
radiusScale: 0.9 (medium)
radius = 0.9 * (0.5 + quality/100 * 0.7)

Max radius (quality=100): 0.9 * 1.2 = 1.08 units
Min radius (quality=0): 0.9 * 0.5 = 0.45 units
```

### LFO Modulation
```
lfoSpeed: 1.8 Hz
lfo = sin(timeScaled * 1.8) * 0.5 + 0.5

Creates 1.8 Hz smooth breathing
Period: 0.556 seconds
```

### Noise Characteristics
```
noiseStrength: 0.4 (moderate)
corruptionMult: 0.2 (low)

Clean, smooth distortion with musical quality
Resembles resonant frequencies or harmonics
```

### Use Cases
- Harmonic resonance between nodes
- Standing wave synchronization
- Musical or rhythmic connections
- Synchronized node states
- Optimal frequency matching

### Resonance Triggers
```
resonance > 0.40: Lime aura appears
resonance > 0.70: Strong harmonic effect
resonance > 0.90: Peak resonance (bright, clear glow)
```

### Distinction from Synergy
```
SYNERGY:   Cyan-green, driven by node compatibility
RESONANCE: Lime-green, driven by frequency matching/oscillation
```

### User Message
> "🎵 Harmonic resonance — nodes in perfect frequency sync!"

---

## 6. MYTHIC_SYNERGY_AURA

### Visual Profile
```
Name:        mythic_synergy_aura
Color:       #aa00ff (Purple, with gold accent blending)
Type:        Sacred geometry pattern
Description: Legendary/optimal link state indicator
```

### Technical Specifications
```javascript
mythic_synergy_aura: {
  name: 'mythic_synergy_aura',
  baseColor: new THREE.Color(0xaa00ff),
  lfoSpeed: 2.2,           // Moderate-fast oscillation
  noiseStrength: 0.5,      // Moderate noise
  corruptionMult: 0.3,     // Low-moderate
  radiusScale: 1.1,        // Slightly wide
  intensityMapping: (synergy, quality, entropy, corruption, resonance) => {
    return Math.min(1, (synergy * quality / 100) * 1.2);
  },
  description: 'High-intensity sacred purple+gold pattern, driven by synergy+quality blend'
}
```

### Data Source
```
Primary Signal: link.userData.quality.synergyNorm (0-1)
Secondary Signal: link.userData.quality.score (0-100)
Tertiary Signal: link.userData.quality.resonance (0-1)

Requires BOTH high synergy AND high quality
```

### Intensity Equation
```
intensity = min(1.0, (synergy * quality/100) * 1.2) * (1 - instability * 0.3)

Synergy × Quality Mapping:
  synergy=1.0, quality=100 → (1.0 * 1.0) * 1.2 → capped at 1.0
  synergy=1.0, quality=83 → (1.0 * 0.83) * 1.2 → ~1.0
  synergy=0.9, quality=90 → (0.9 * 0.9) * 1.2 → ~0.97
  synergy=0.8, quality=80 → (0.8 * 0.8) * 1.2 → ~0.77
  synergy=0.7, quality=70 → (0.7 * 0.7) * 1.2 → ~0.59
  synergy=0.5, quality=50 → (0.5 * 0.5) * 1.2 → ~0.30
```

### Activation Threshold
```
For mythic aura to appear at max intensity:
  synergy > 0.58 AND quality > 83
  
Safe threshold in profile resolver:
  quality > 80 AND synergy > 0.6
```

### Radius Mapping
```
radiusScale: 1.1 (slightly wide)
radius = 1.1 * (0.5 + quality/100 * 0.7)

Max radius (quality=100): 1.1 * 1.2 = 1.32 units
Min radius (quality=0): 1.1 * 0.5 = 0.55 units

Note: Wider appearance signals "special" status
```

### LFO Modulation
```
lfoSpeed: 2.2 Hz
lfo = sin(timeScaled * 2.2) * 0.5 + 0.5

Creates 2.2 Hz sacred breathing
Period: 0.455 seconds
```

### Noise Characteristics
```
noiseStrength: 0.5 (moderate)
corruptionMult: 0.3 (low)

Clean, elegant distortion with geometric quality
Resembles sacred geometry or cosmic patterns
```

### Visual Rarity
```
Mythic auras are RARE and SPECIAL
Typical occurrence rate: 1-3% of all links
Indicates "perfect" or "legendary" pairings
User celebration worthy
```

### Use Cases
- Optimal AI node pairings
- Legendary level connections
- Perfect synergy + quality match
- Rare cosmic alignments
- End-game or special event links

### Color Symbolism
```
Purple (#aa00ff):  Mystical, rare, special, transcendent
Gold accent:       Divine, legendary, ultimate achievement
Combined:          "Sacred perfect pairing"
```

### Profile Resolver Decision Point
```javascript
if (quality > 80 && synergy > 0.6) {
  return 'mythic_synergy_aura';
}
```

### User Message
> "✨🔮 MYTHIC SYNERGY ACHIEVED — Perfect cosmic alignment!"

---

## COMPARISON TABLE

| Profile | Color | Speed | Noise | Radius | Rarity | Meaning |
|---------|-------|-------|-------|--------|--------|---------|
| synergy | Cyan | 2.0 | 0.3 | 0.7 | Uncommon | High compatibility |
| stability | Blue | 1.2 | 0.2 | 1.2 | Common | Safe, reliable |
| corruption | Red | 3.5 | 0.8 | 0.6 | Rare | ⚠️ Dangerous! |
| chaos | Orange | 2.8 | 0.7 | 0.8 | Uncommon | Unstable, chaotic |
| resonance | Lime | 1.8 | 0.4 | 0.9 | Uncommon | Harmonic match |
| mythic | Purple | 2.2 | 0.5 | 1.1 | **Very Rare** | 🔮 Legendary! |

---

## INTEGRATION INTO PROFILE RESOLVER

```javascript
_resolveLinkAuraProfile(link) {
  const q = link.userData?.quality?.score ?? 50;
  const synergy = link.userData?.quality?.synergyNorm ?? 0.5;
  const corruption = link.userData?.metrics?.corruption ?? 0.0;
  const entropy = link.userData?.metrics?.entropy ?? 0.0;
  const resonance = link.userData?.metrics?.resonance ?? 0.0;

  // PRIORITY 1: Danger signals (highest priority)
  if (corruption > 0.45) {
    return 'corruption_aura';  // RED WARNING
  }

  // PRIORITY 2: Legendary (rarest, best case)
  if (q > 80 && synergy > 0.6) {
    return 'mythic_synergy_aura';  // PURPLE LEGEND
  }

  // PRIORITY 3: Quality-based selection
  if (synergy > 0.6) {
    return 'synergy_aura';  // CYAN HARMONY
  }

  if (entropy > 0.7) {
    return 'chaos_aura';  // ORANGE CHAOS
  }

  if (resonance > 0.6) {
    return 'resonance_aura';  // LIME RESONANCE
  }

  // PRIORITY 4: Quality-based
  if (q < 40) {
    return 'corruption_aura';  // RED (low quality)
  }

  // PRIORITY 5: Default fallback
  return 'stability_aura';  // BLUE STABLE
}
```

---

## VISUAL SPECTRUM

```
       Danger          Neutral         Harmony
    ←─────────────────────────────────→
   Red    Orange    Blue    Cyan    Lime    Purple
(corrupt) (chaos) (stable) (synergy) (resonance) (mythic)
   🚨      ⚡       🔵       ✨       🎵      🔮
```

---

## DEBUG: Profile Statistics

```javascript
// Enable to see aura distribution
const profileCounts = {};
for (const instance of linkAuraSystem.auras.values()) {
  const pid = instance.profileId;
  profileCounts[pid] = (profileCounts[pid] || 0) + 1;
}
console.log('Aura Distribution:', profileCounts);

// Expected output:
// {
//   stability_aura: 34,           // 50-80% (most common)
//   synergy_aura: 12,             // 10-15% (common)
//   resonance_aura: 5,            // 5-10%
//   chaos_aura: 2,                // 1-5% (rare)
//   corruption_aura: 1,           // <1% (very rare)
//   mythic_synergy_aura: 0        // <0.1% (legendary!)
// }
```

