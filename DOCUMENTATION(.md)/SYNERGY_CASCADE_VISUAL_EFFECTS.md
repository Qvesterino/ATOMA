# SYNERGY CASCADE — VISUAL EFFECTS DETAILED GUIDE

## 🎨 Five Cascade Visualization Types

---

## 1️⃣ WAVE FRONT EFFECT

### What It Is
Animated pulse that travels along cascade links from source to target node.

### Visual Appearance
- **Color**: Bright cyan (0x00ffff)
- **Shape**: Longitudinal wave traveling end-to-end
- **Width**: ~30% of link length
- **Motion**: Continuous smooth travel along link
- **Frequency**: Oscillating shimmer for visual interest

### How It Works

```
Source Node ─────◆═══════════════◆─── Target Node
                 Wave front traveling →
```

1. Cascade initiates at source node
2. Wave front spawns at source end
3. Travels along link toward target at `propagationSpeed` units/sec
4. Reaches target node and completes
5. Link material emissive brightens at wave position

### Technical Details

```javascript
// Wave position calculation
const wavePos = propagation.position;  // 0.0 to 1.0

// Distance from wave center determines brightness
const distance = Math.abs(wavePos - waveCenter) * 2;
const waveBrightness = Math.max(0, 1.0 - (distance / waveWidth));

// Material enhancement
material.emissive = waveColor;
material.emissiveIntensity = waveBrightness * intensity;
```

### Configuration

```javascript
// Width of wave front (0.1 = thin line, 0.5 = thick band)
visualizer.config.waveWidth = 0.3;

// Speed cascade travels along link
visualizer.config.propagationSpeed = 2.0;  // units/sec

// Color (try different cyan shades)
visualizer.config.waveColor = new THREE.Color(0x00ffff);
```

### Visual Tuning

```javascript
// More visible wave front
cascadeDebug.visualizer.config.waveWidth = 0.5;

// Faster travel
cascadeDebug.setSpeed(4.0);

// Slower travel
cascadeDebug.setSpeed(0.5);
```

---

## 2️⃣ CASCADE GLOW EFFECT

### What It Is
Progressive brightening of link material as cascade energy passes through.

### Visual Appearance
- **Color**: Bright yellow (0xffff00)
- **Effect**: Emissive glow that intensifies with cascade energy
- **Duration**: Active only while cascade is on the link
- **Intensity**: Scales from 0% to 150%+ based on cascade intensity
- **Fade**: Quickly returns to baseline after cascade passes

### How It Works

```
Timeline:
Before:  Link appears normal (baseline glow)
During:  Link brightens to yellow (peak glow)
After:   Link returns to baseline
```

1. Cascade starts: Material emissive set to baseline
2. Wave passes: Emissive intensity increases gradually
3. Wave peak: Material at maximum brightness
4. Wave end: Emissive fades back to baseline
5. Link idle: Returns to normal state

### Technical Details

```javascript
// Cascade intensity drives glow
const cascadeIntensity = propagation.intensity;  // 0.0 to 1.0

// Material enhancement
material.emissive.copy(cascadeColor);  // Yellow
material.emissiveIntensity = Math.max(
  material.emissiveIntensity || 0,
  cascadeIntensity * 1.5
);
```

### Configuration

```javascript
// Cascade color (yellow = standard)
visualizer.config.cascadeColor = new THREE.Color(0xffff00);

// Try custom colors:
visualizer.config.cascadeColor = new THREE.Color(0xff00ff);  // Magenta
visualizer.config.cascadeColor = new THREE.Color(0x00ff00);  // Green

// Base intensity (how bright cascades appear)
// (Controlled by intensity decay system)
```

### Visual Effect Combinations

```javascript
// Subtle glow
cascadeDebug.setParticles(0);  // No particles
// Only see glow effect

// Combined with other effects
cascadeDebug.setVisualizations({
  waveFront: false,
  cascadeGlow: true,      // Just glow
  flowParticles: false,
  rippleEffect: false,
  harmonicShimmer: false
});
cascadeDebug.triggerMultiple(3);
```

---

## 3️⃣ FLOW PARTICLES EFFECT

### What It Is
Directional particles spawned and propelled along cascade paths.

### Visual Appearance
- **Color**: Bright yellow (0xffff00) fading to transparency
- **Shape**: Small spheres (~0.05 unit radius)
- **Count**: 8 per cascade (configurable)
- **Motion**: Flow in cascade direction with fading
- **Lifetime**: 2 seconds from spawn to complete fade
- **Opacity**: Fades from 80% to 0% over lifetime

### How It Works

```
Time 0.0s:  ● ● ● (spawned, full opacity)
Time 1.0s:  ◐ ◐ ◐ (halfway, 40% opacity)
Time 2.0s:  ◌ ◌ ◌ (fading, disappearing)
```

1. Cascade detected: Spawn N particles near wave front
2. Particles initialize with velocity matching cascade direction
3. Each frame: Advance position along cascade path
4. Particle ages: Opacity and size decrease smoothly
5. Max age: Particle deactivated and returned to pool

### Technical Details

```javascript
// Particle initialization
particle.position = wavePosition;
particle.velocity = cascadeDirection * propagationSpeed * intensity;
particle.lifetime = 2.0;  // seconds
particle.age = 0;

// Per-frame update
particle.position.addScaledVector(particle.velocity, deltaTime);
particle.age += deltaTime;

// Opacity calculation
const fadeRatio = 1.0 - (particle.age / particle.lifetime);
particle.mesh.material.opacity = fadeRatio * 0.8;
particle.mesh.scale.setScalar(1.0 - (particle.age / particle.lifetime) * 0.5);
```

### Configuration

```javascript
// Particles per cascade
cascadeDebug.setParticles(8);      // Default
cascadeDebug.setParticles(15);     // More = denser effect
cascadeDebug.setParticles(2);      // Less = subtle effect

// Particle speed (relative to cascade speed)
visualizer.config.particleSpeed = 1.5;

// Particle lifetime (how long they persist)
visualizer.config.particleLifetime = 2.0;  // seconds
```

### Visual Effects

```javascript
// Subtle particle flow
cascadeDebug.setParticles(2);

// Heavy particle flow
cascadeDebug.setParticles(20);

// Fast particles
visualizer.config.particleSpeed = 3.0;

// Slow particles
visualizer.config.particleSpeed = 0.5;
```

---

## 4️⃣ RIPPLE EFFECT

### What It Is
Expanding concentric rings that appear at cascade source and propagation targets.

### Visual Appearance
- **Color**: Bright yellow (0xffff00)
- **Shape**: Expanding ring/circle (line geometry)
- **Expansion**: Grows from center outward over 1 second
- **Opacity**: Starts at intensity level, fades to transparent
- **Frequency**: One ripple per cascade initiation + one per target reached
- **Scale**: Size proportional to cascade intensity

### How It Works

```
Initiation (t=0):      Expanding (t=0.5s):    Fading (t=1.0s):
       ◆                      ◆                      ◆
                           ○ ○ ○                   ◌ ◌ ◌
```

1. Cascade initiates: Ripple spawned at source
2. Ring geometry created with N segments (32 default)
3. Ring expands outward: `radius = maxRadius * (1.0 - fadeRatio)`
4. Opacity decreases: From `intensity * 0.8` to `0`
5. Lifetime: 1.0 second total
6. Cleanup: Ring removed, geometry disposed

### Technical Details

```javascript
// Ripple creation
const ripple = {
  center: position.clone(),
  startRadius: 0,
  maxRadius: 3.0 + intensity * 2.0,  // Size based on intensity
  lifetime: 1.0,
  age: 0,
  intensity: intensity
};

// Per-frame update
ripple.age += deltaTime;
const fadeRatio = 1.0 - (ripple.age / ripple.lifetime);

// Update mesh
const radius = ripple.startRadius + (ripple.maxRadius * (1.0 - fadeRatio));
ripple.mesh.scale.setScalar(radius / 0.01);
ripple.mesh.material.opacity = fadeRatio * ripple.intensity * 0.6;
```

### Configuration

```javascript
// Ripples appear at:
// 1. Cascade source (always)
// 2. Each node reached by cascade (propagation targets)
// 3. Multi-hop: Each new hop gets a ripple

// No per-ripple configuration currently
// Controlled by cascade intensity (larger cascades = larger ripples)
```

### Visual Effect

```javascript
// Watch ripples
cascadeDebug.triggerMultiple(1);  // One cascade
// You'll see: 1 ripple at source + N ripples at targets

// Multiple cascades = multiple ripples
cascadeDebug.triggerMultiple(5);  // 5 cascades
// You'll see: Overlapping expanding rings throughout network
```

---

## 5️⃣ HARMONIC SHIMMER EFFECT

### What It Is
Oscillating color bands traveling along cascade links with wave-like frequency variations.

### Visual Appearance
- **Color**: Yellow ↔ Cyan oscillation (0xffff00 ↔ 0x00ffff)
- **Pattern**: Sinusoidal color wave traveling along link
- **Frequency**: 8 oscillations per unit link length
- **Animation**: Continuous oscillation at high frequency
- **Intensity**: Scales with cascade intensity
- **Phase**: Animated over time for hypnotic effect

### How It Works

```
Link representation (showing color shimmer):
Source: 🟡 → 🔵 → 🟡 → 🔵 → 🟡 Target
        └─ oscillating color wave ─┘

Shimmer travels along link:
Frame 0:  Y C Y C Y
Frame 1:  C Y C Y C  (phase shift)
Frame 2:  Y C Y C Y  (cycles)
```

1. Wave position along link: `0.0 (source)` to `1.0 (target)`
2. Shimmer frequency: `sin(position * 8.0 + phase)`
3. Color blend: Interpolate from yellow to cyan based on shimmer
4. Phase update: Animates continuously for motion effect
5. Material update: Emissive color modulated by shimmer

### Technical Details

```javascript
// Shimmer calculation
const shimmerFrequency = 8.0;  // Oscillations per unit
const shimmerPhase = (Date.now() % 1000) / 1000 * Math.PI * 2;

const shimmerWave = Math.sin(position * shimmerFrequency + shimmerPhase);
const shimmerAmount = Math.abs(shimmerWave) * intensity;

// Color blend
const shimmerColor = cascadeColor.clone();
shimmerColor.lerp(waveColor, shimmerWave * 0.5 + 0.5);  // Oscillate between

// Material update
material.emissive.copy(shimmerColor);
material.emissiveIntensity = shimmerAmount * 2.0;
```

### Configuration

```javascript
// Controlled indirectly by:
// - Cascade intensity (higher = more intense shimmer)
// - Wave position (shimmer frequency constant at 8.0/unit)
// - Colors (cascadeColor and waveColor)

// Custom colors for shimmer
visualizer.config.cascadeColor = new THREE.Color(0xff00ff);  // Magenta
visualizer.config.waveColor = new THREE.Color(0x00ff00);    // Green
// Now shimmers: Magenta ↔ Green
```

### Visual Effect

```javascript
// Disable other effects, see shimmer alone
cascadeDebug.setVisualizations({
  waveFront: false,
  cascadeGlow: false,
  flowParticles: false,
  rippleEffect: false,
  harmonicShimmer: true   // Only this
});
cascadeDebug.triggerMultiple(3);
// Watch hypnotic oscillating colors!
```

---

## 🎭 COMBINED EFFECTS

### Default Configuration (All Enabled)

When all five effects are enabled simultaneously, you get:

```
Cascade Timeline:
t=0s:     Ripple appears at source
          Wave front starts traveling (cyan)
          Harmonic shimmer begins (yellow ↔ cyan)
          Cascade glow intensifies (yellow)
          
t=0.1s:   Particles spawned, flowing outward
          Wave continues traveling
          Shimmer oscillates
          Glow maintains
          
t=0.5s:   Wave reaches target node
          Ripple at target
          Particles halfway through lifetime
          Shimmer continues
          
t=1.0s:   Ripples start fading
          Particles start fading
          Wave completes, glow returns to baseline
          Shimmer fades
          
t=2.0s:   Particles fully faded
          All effects complete
          Link returns to baseline
```

### Effect Combinations

```javascript
// Minimalist (most performant)
cascadeDebug.setVisualizations({
  waveFront: true,
  cascadeGlow: true,
  flowParticles: false,
  rippleEffect: false,
  harmonicShimmer: false
});

// Balanced (good performance + visual impact)
cascadeDebug.setVisualizations({
  waveFront: true,
  cascadeGlow: true,
  flowParticles: true,
  rippleEffect: true,
  harmonicShimmer: false
});

// Full (best visual, more intensive)
cascadeDebug.setVisualizations({
  waveFront: true,
  cascadeGlow: true,
  flowParticles: true,
  rippleEffect: true,
  harmonicShimmer: true
});

// Artistic (harmonic focus)
cascadeDebug.setVisualizations({
  waveFront: false,
  cascadeGlow: false,
  flowParticles: true,
  rippleEffect: false,
  harmonicShimmer: true
});
```

---

## 🎨 COLOR CUSTOMIZATION

### Default Palette

```javascript
cascadeColor:  0xffff00  // Bright yellow
waveColor:     0x00ffff  // Bright cyan
fadeColor:     0xff00ff  // Magenta (unused currently)
```

### Alternative Palettes

```javascript
// Cyberpunk
cascadeColor = 0xff00ff  // Magenta
waveColor = 0x00ffff    // Cyan

// Nature
cascadeColor = 0x00ff00  // Green
waveColor = 0xff8800    // Orange

// Cool
cascadeColor = 0x0088ff  // Blue
waveColor = 0x00ffff    // Cyan

// Warm
cascadeColor = 0xff8800  // Orange
waveColor = 0xffff00    // Yellow

// Exotic
cascadeColor = 0xff00ff  // Magenta
waveColor = 0xffff00    // Yellow
```

### Apply Custom Palette

```javascript
const viz = window.cascadeDebug.visualizer;

// Cyberpunk palette
viz.config.cascadeColor = new THREE.Color(0xff00ff);
viz.config.waveColor = new THREE.Color(0x00ffff);

// Nature palette
viz.config.cascadeColor = new THREE.Color(0x00ff00);
viz.config.waveColor = new THREE.Color(0xff8800);
```

---

## 📊 INTENSITY SCALING

### How Cascade Intensity Affects Visuals

```javascript
Intensity 0.1 (very weak):
  ├─ Wave front: Barely visible
  ├─ Cascade glow: Minimal
  ├─ Particles: 1 or none
  ├─ Ripple: Tiny radius
  └─ Shimmer: Subtle

Intensity 0.5 (medium):
  ├─ Wave front: Clear and visible
  ├─ Cascade glow: Bright
  ├─ Particles: ~4 particles
  ├─ Ripple: Medium radius
  └─ Shimmer: Pronounced

Intensity 1.0 (maximum):
  ├─ Wave front: Very bright, eye-catching
  ├─ Cascade glow: Intense and bright
  ├─ Particles: 8 particles per cascade
  ├─ Ripple: Large radius
  └─ Shimmer: Maximum intensity
```

### Control Intensity Distribution

```javascript
// All cascades strong
cascadeDebug.setThreshold(0.85);  // Only high-synergy triggers

// Mix of intensities
cascadeDebug.setThreshold(0.70);  // Both strong and medium

// Many weak cascades
cascadeDebug.setThreshold(0.50);  // Any decent synergy triggers
```

---

## ⚙️ ADVANCED CUSTOMIZATION

### Modify Effect Intensity

```javascript
// Access visualizer
const viz = window.cascadeDebug.visualizer;

// Particle size (adjust scale multiplier)
// Currently: size = 1.0 - (age/lifetime) * 0.5
// Modify in: SynergyCascadeVisualizer.updateCascadeParticles()

// Wave width (0.1 to 0.5)
viz.config.waveWidth = 0.4;  // Thicker wave

// Shimmer frequency (currently fixed at 8.0)
// Modify in: applyHarmonicShimmerEffect()
// shimmerFrequency = 16.0;  // More oscillations

// Ripple expansion speed
// Currently: linear expansion over 1.0 second
// Modify in: updateRipples()
```

### Performance vs Quality Tradeoff

```javascript
// High quality (may lag)
cascadeDebug.setParticles(20);
cascadeDebug.setSpeed(3.0);
cascadeDebug.setVisualizations({
  waveFront: true,
  cascadeGlow: true,
  flowParticles: true,
  rippleEffect: true,
  harmonicShimmer: true
});

// Balanced
cascadeDebug.setParticles(8);
cascadeDebug.setSpeed(2.0);
cascadeDebug.setVisualizations({
  waveFront: true,
  cascadeGlow: true,
  flowParticles: true,
  rippleEffect: true,
  harmonicShimmer: false  // Disable intensive effect
});

// High performance
cascadeDebug.setParticles(2);
cascadeDebug.setSpeed(1.0);
cascadeDebug.setVisualizations({
  waveFront: true,
  cascadeGlow: true,
  flowParticles: false,
  rippleEffect: false,
  harmonicShimmer: false
});
```

---

## 🎬 ANIMATION TIMING

### Cascade Lifecycle

```
EVENT                      TIME        VISUAL STATE
─────────────────────────────────────────────────────
1. Cascade initiated       t = 0.0s    Ripple appears
2. Wave spawns            t = 0.0s    Cyan wave at source
3. Particles spawn        t = 0.05s   Yellow particles flowing
4. Shimmer begins         t = 0.0s    Color oscillation
5. Glow intensifies       t = 0.0s    Material brightens
6. Wave travels           t = 0s-0.3s Wave moves (depends on link length)
7. Wave reaches target    t = +Δt     Ripple at target
8. Wave ends              t = +Δt     Link returns to baseline
9. Shimmer fades          t = +Δt     Color fades
10. Particles fade        t = +2.0s   Opacity → 0%
11. Ripples fade          t = +1.0s   Opacity → 0%
12. Cascade complete      t = +2.0s   All effects gone
```

### Multi-Hop Cascade Timeline

```
Link 1 (hop 0):
  t=0.0s: Start → t=0.5s: End (intensity=1.0)

Link 2 (hop 1):
  t=0.2s: Start → t=0.7s: End (intensity=0.75)

Link 3 (hop 2):
  t=0.4s: Start → t=0.9s: End (intensity=0.56)
```

---

## 🔍 VISUAL DEBUGGING

### See Individual Effects

```javascript
// Wave front only
cascadeDebug.setVisualizations({
  waveFront: true,
  cascadeGlow: false,
  flowParticles: false,
  rippleEffect: false,
  harmonicShimmer: false
});
cascadeDebug.triggerMultiple(3);

// Cascade glow only
cascadeDebug.setVisualizations({
  waveFront: false,
  cascadeGlow: true,
  flowParticles: false,
  rippleEffect: false,
  harmonicShimmer: false
});
cascadeDebug.triggerMultiple(3);

// Particles only
cascadeDebug.setVisualizations({
  waveFront: false,
  cascadeGlow: false,
  flowParticles: true,
  rippleEffect: false,
  harmonicShimmer: false
});
cascadeDebug.triggerMultiple(3);

// Ripples only
cascadeDebug.setVisualizations({
  waveFront: false,
  cascadeGlow: false,
  flowParticles: false,
  rippleEffect: true,
  harmonicShimmer: false
});
cascadeDebug.triggerMultiple(3);

// Shimmer only
cascadeDebug.setVisualizations({
  waveFront: false,
  cascadeGlow: false,
  flowParticles: false,
  rippleEffect: false,
  harmonicShimmer: true
});
cascadeDebug.triggerMultiple(3);
```

---

## ✨ VISUAL RECOMMENDATIONS

### Best Visual Settings

```javascript
// Cinematic (for demonstration)
cascadeDebug.setSpeed(1.5);
cascadeDebug.setParticles(12);
cascadeDebug.setThreshold(0.65);
cascadeDebug.setVisualizations({
  waveFront: true,
  cascadeGlow: true,
  flowParticles: true,
  rippleEffect: true,
  harmonicShimmer: true
});

// Performance (for production)
cascadeDebug.setSpeed(2.0);
cascadeDebug.setParticles(4);
cascadeDebug.setThreshold(0.75);
cascadeDebug.setVisualizations({
  waveFront: true,
  cascadeGlow: true,
  flowParticles: false,
  rippleEffect: true,
  harmonicShimmer: false
});

// Artistic (for creative scenes)
cascadeDebug.setSpeed(3.0);
cascadeDebug.setParticles(8);
cascadeDebug.setThreshold(0.60);

// Custom colors
const viz = cascadeDebug.visualizer;
viz.config.cascadeColor = new THREE.Color(0xff00ff);
viz.config.waveColor = new THREE.Color(0x00ff00);
```

---

**Visual Effects Documentation Complete** ✨

For implementation details, see: `/SYNERGY_CASCADE_IMPLEMENTATION.md`
For quick usage, see: `/SYNERGY_CASCADE_QUICK_START.md`
