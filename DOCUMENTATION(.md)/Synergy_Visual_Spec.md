# Synergy Visual System 1.0 - Complete Visual Specification

## Table of Contents

1. [SynergyVFX1_0 Visual Layers](#synergyvfx10-visual-layers)
2. [SynergyHighways1_0 Specification](#synergyhighways10-specification)
3. [Animation Curves & Timing](#animation-curves--timing)
4. [Color Blending Rules](#color-blending-rules)
5. [Motion & Physics Models](#motion--physics-models)
6. [Rendering & Blending](#rendering--blending)
7. [Configuration Reference](#configuration-reference)
8. [Visual Example Diagrams](#visual-example-diagrams)

---

## SynergyVFX1_0 Visual Layers

### Layer A: Glow Pulse Effect

**Purpose:** Visualize link synergy with dynamic, pulsing glow

**Visual Behavior:**
```
Low Synergy (0.2):     ░░░━━━░░░  (subtle pulse, 40% peak opacity)
Medium Synergy (0.5):  ░░━━━━━░░  (moderate pulse, 60% peak opacity)
High Synergy (0.8):    ░━━━━━━━░  (strong pulse, 90% peak opacity)
```

**Specifications:**

| Parameter | Value | Formula |
|-----------|-------|---------|
| Pulse Min | 0.8 | Fixed |
| Pulse Max | 1.3 | Fixed |
| Pulse Speed | 2.0 Hz | Constant |
| Wave Function | `sin(time * speed + phase)` | 1-2 Hz oscillation |
| Base Intensity | 0.15 | `glowBaseIntensity` |
| Active Intensity | `base * synergy * intensity` | Applied to glow |
| Color | Blend(source, target) | 50/50 mix |
| Blend Mode | Additive | Non-destructive |
| Render Layer | Above core link | Z-bias positive |

**Animation Curve:**

```
Glow Intensity Over Time (synergyStrength = 0.5)
1.3│      ╱╲      ╱╲      ╱╲
1.0│     ╱  ╲    ╱  ╲    ╱  ╲
0.8│____╱____╲__╱____╲__╱____╲____
   └─────────────────────────────
   Time →
   
Duration per cycle: 1 / 2.0Hz = 0.5 seconds
```

**Implementation Details:**

- Mesh: `THREE.Line` with `glowGeometry`
- Material: `THREE.LineBasicMaterial` with `AdditiveBlending`
- Updates: Every frame (position-tracking)
- Memory: ~200 bytes per link

---

### Layer B: Chromatic Trails

**Purpose:** Show particle flow along links with color gradient

**Visual Behavior:**

```
Source (Node A)                        Target (Node B)
  ↓                                      ↑
  ●━●━●━●━●   (trail particles)   ━●━●━●
  │ ↙ ↙ ↙ ↙ ↙  (velocity vectors)
  └─────────────────────────────────────┘
```

**Specifications:**

| Parameter | Value | Scale Factor |
|-----------|-------|--------------|
| Particle Count | 6 | `trailParticleCount` |
| Particle Size | 0.04 units | Fixed size |
| Base Velocity | 0.02 units/s | `trailVelocityBase` |
| Synergy Velocity | +0.05 multiplier | `* (0.02 + synergy * 0.05)` |
| Spawn Rate | 0.1-0.5s | Based on synergy |
| Particle Life | 1.0-1.5s | `1.0 + synergy * 0.5` |
| Color Shift | Source → Target | Lerp at spawn time |
| Perpendicular Spread | ±0.02 units | Random wobble |
| Fade Distance | 0.8 units | `trailFadeDistance` |

**Spawn Pattern:**

- Spawn location: Random point along link (0-1 interpolation)
- Spawn velocity: Along link direction + perpendicular wobble
- Spawn frequency: Proportional to synergy strength
- Batch: 2 particles per spawn event

**Color Interpolation:**

```
Source Color (e.g., cyan)     Target Color (e.g., magenta)
    ●                              ●
    │ 25% spawn → color @25%       │
    │ 50% spawn → color @50%       │
    │ 75% spawn → color @75%       │
    └──────────────────────────────┘
```

**Motion Model:**

```
Particle (age, life):
  position += velocity * deltaTime
  opacity = 1.0 - (age / life)
  life = 1.0 + synergyStrength * 0.5
  
Velocity:
  v = direction * (baseVel + synergy * 0.05)
    + perpendicular * random(-0.02, 0.02)
```

---

### Layer C: Outer Synergy Aura

**Purpose:** Visual indicator of high-synergy node connections

**Visual Behavior:**

```
                    ╭─────────╮
                   ╱           ╲
                  │   Node      │
                  │   (Color)   │
                   ╲    ↻      ╱  ← Rotating halos
                    ╰─────────╯
                    ↻ ↻ ↻ ↻
```

**Specifications:**

| Parameter | Value | Formula |
|-----------|-------|---------|
| Visibility Threshold | 0.4 | `auraThreshold` |
| Base Radius | 0.35 units | `auraBaseRadius` |
| Max Radius Scale | +0.5 | `1 + synergy * 0.5` |
| Ring Count | 1-3 | `1 + synergy * 2` |
| Rotation Speed | 0.3 rad/s | `auraRotationSpeed` |
| Max Opacity | 0.6 | `auraMaxOpacity` |
| Color Source | Node color | Inherited per node |
| Blend Mode | Additive | Multiplicative on screen |
| Ring Geometry | Torus (0.1 thickness) | Animated rings |

**Ring Visibility:**

```
Synergy 0.2:   [hidden, below threshold]
Synergy 0.4:   ★ (1 ring visible)
Synergy 0.6:   ★★ (2 rings)
Synergy 0.8:   ★★★ (3 rings)
Synergy 1.0:   ★★★ (max 3)
```

**Animation Pattern:**

```
Ring A (base):     0° → 360° over 20.94s (1/0.3 * 2π)
Ring B (offset):   120° offset
Ring C (offset):   240° offset

Each ring: visible = currentOpacity * (1 - ringIndex * 0.3)
```

**Radius Growth:**

```
Radius = baseRadius * (1 + synergyStrength * 0.5)

Synergy 0.4:   radius = 0.35 * 1.2 = 0.42
Synergy 0.7:   radius = 0.35 * 1.35 = 0.47
Synergy 1.0:   radius = 0.35 * 1.5 = 0.525
```

---

### Layer D: Synergy Burst Event

**Purpose:** Trigger temporary visual feedback on synergy events

**Visual Behavior:**

```
Frame 0:     ●
Frame 1:    ╱─╲
Frame 2:   ╱   ╲
Frame 3:  │  ✦  │  ← Expanding ring + particles
Frame 4:  │  ✧  │
...
Frame end:  ╲   ╱
            ╲─╱
             ●
```

**Specifications:**

| Parameter | Value | Description |
|-----------|-------|-------------|
| Duration | 0.7s | `burstDuration` |
| Max Radius | 3.0 units | `burstMaxRadius` |
| Expand Speed | 2.5 u/s | `burstExpandSpeed` |
| Ring Initial Radius | 0.1 units | Starting size |
| Ring Thickness | 0.05 units | Torus thickness |
| Particle Count | 12 | `burstParticleCount` |
| Particle Speed | 3.0 u/s | Radial velocity |
| Initial Opacity | 0.8 | Starting glow |
| Color | Custom (param) | `triggerBurst(link, color)` |
| Blend Mode | Additive | Over scene |

**Expansion Timeline:**

```
Time:          0ms     200ms    400ms    600ms    700ms
Radius:        0.1u    0.6u     1.1u     1.6u     2.1u (capped at 3.0u)
Opacity:       0.8     0.6      0.4      0.2      0.0
Scale:         1.0x    6.0x    11.0x    16.0x    21.0x
```

**Particle Distribution:**

```
12 particles radiating from center:
Angle = (particleIndex / 12) * 360°
Direction = normalize([cos(angle), sin(angle), random(-1, 1)])
Velocity = direction * 3.0 u/s

Each particle:
  - Spawns at midpoint between nodes
  - Travels radially outward
  - Fades over 0.7s duration
  - Color matches ring (custom)
```

**Trigger Example:**

```javascript
// Usage
window.game.synergyVFX.triggerBurst(link, "#44EEFF");

// Visual result:
// - Cyan expanding ring at link midpoint
// - 12 cyan particles scatter in all directions
// - Fade complete in 700ms
// - System auto-cleans up
```

---

## SynergyHighways1_0 Specification

### Overview

Large arc-shaped ribbons connecting high-synergy node pairs, visible only when synergy > 0.7.

**Visual Behavior:**

```
Node A (color: cyan)          Node B (color: magenta)
  ●                              ●
  │ ╱════════════╲              │
  │╱              ╲═════════════╲
  │  (shimmer)     ╲    (fade)    ●
  │                 ╲
  ●─ ─ ─ ─ ─ ─ ─ ─ ─
```

### Ribbon Specifications

| Parameter | Value | Details |
|-----------|-------|---------|
| Visibility Threshold | 0.7 | `synergyThreshold` |
| Arc Height | 15 units | `arcHeight` |
| Arc Resolution | 40 vertices | `arcResolution` |
| Ribbon Width (Low) | 0.3 units | Synergy 0.7-0.8 |
| Ribbon Width (Med) | 0.6 units | Synergy 0.8-0.9 |
| Ribbon Width (High) | 1.0 units | Synergy 0.9-1.0 |
| Geometry Type | Quad strip | 2-sided mesh |
| Blend Mode | Additive | Over scene |
| Render Order | -1 | Behind normal links |
| Depth Write | False | No depth buffer write |

### Arc Geometry

**Bézier Quadratic Curve:**

```
P(t) = (1-t)² * P0 + 2(1-t)t * P1 + t² * P2

Where:
  P0 = Source node position
  P1 = Apex point (above midpoint)
  P2 = Target node position
  t = 0 to 1 (parametric)

Arc Height = Y component of apex
Apex = midpoint + [0, arcHeight, 0]
```

**Curve Calculation:**

```javascript
// 40 points along arc
for (let i = 0; i <= 40; i++) {
  t = i / 40;
  mt = 1 - t;
  
  p = mt² * p0 + 2*mt*t * apex + t² * p2;
  points[i] = p;
}
```

**Visual Shape:**

```
Top view:
  Node A ───→ ← ← ← ← ← ← ← ── Node B
  (source)                     (target)
  
Side view:
                Apex
                 ↑
  Source ═════════════════════ Target
   ╱───────────╲  ╱───────────╲
  / (Curve)    \/ (Shimmer)    \
```

### Ribbon Width Mapping

```
Synergy (0.7-1.0) → Ribbon Width:

0.70: ░░░ (0.30)  Low
0.75: ░░░░ (0.45) Low→Medium blend
0.80: ░░░░░ (0.60) Medium
0.85: ░░░░░░ (0.80) Medium→High blend
0.90: ░░░░░░░ (1.00) High
1.00: ░░░░░░░ (1.00) High (max)
```

### Shimmer Animation

**Wave Pattern:**

```
Shimmer(i) = sin(t_frame * speed + i * frequency) * amplitude

Where:
  i = vertex index
  t_frame = time * synergyStrength * shimmerSpeed
  frequency = 8 (8 waves along ribbon)
  amplitude = 0.15 * synergyStrength (max deviation)
  speed = 1.5 Hz base
```

**Visual Shimmer:**

```
Time: 0ms
  ╱════════════╲  (baseline)

Time: 250ms
  ╱══╱╲═╱╲═╱═╲╲  (wave scrolling)

Time: 500ms
  ╱══╱╲═╱╲═╱═╲╲  (continues scrolling)

Time: 700ms
  ╱════════════╲  (back to baseline)
```

**Shimmer Intensity by Synergy:**

```
Synergy 0.7: amplitude = 0.15 * 0.7 = 0.105 (subtle)
Synergy 0.8: amplitude = 0.15 * 0.8 = 0.120
Synergy 0.9: amplitude = 0.15 * 0.9 = 0.135
Synergy 1.0: amplitude = 0.15 * 1.0 = 0.150 (intense)

Speed scale: baseSpeed * synergy
Synergy 0.7: 1.5 * 0.7 = 1.05 Hz
Synergy 1.0: 1.5 * 1.0 = 1.50 Hz (fastest)
```

### Color Gradient

**Gradient Direction:**

```
Source Node      Midpoint        Target Node
(cyan)           (blend)         (magenta)

0%               50%             100%
↓                ↓               ↓
#00ddff ─────── #7f6eff ─────── #ff00ff
```

**Per-Vertex Color:**

```javascript
// For each vertex on ribbon:
t = vertexPosition / arcLength;
color = sourceColor.lerp(targetColor, t);
material.vertexColors = true;
```

**Gradient Resolution:**

- 16 distinct color bands across ribbon
- Smooth interpolation between vertices
- Inherits node colors automatically

### Opacity and Blending

**Base Opacity:**

```
opacity = baseOpacity + synergy * (maxOpacity - baseOpacity)
        = 0.5 + synergy * 0.35

Synergy 0.7: opacity = 0.5 + 0.245 = 0.745
Synergy 0.8: opacity = 0.5 + 0.280 = 0.780
Synergy 0.9: opacity = 0.5 + 0.315 = 0.815
Synergy 1.0: opacity = 0.5 + 0.350 = 0.850
```

**Blending Equation (Additive):**

```
finalColor = existingColor + (ribbonColor * ribbonOpacity)

This allows:
- Stacking of multiple highways without darkening
- Non-destructive rendering over scene
- Bright highlights at intersections
```

---

## Animation Curves & Timing

### Glow Pulse Curve

```
Intensity = sin(t * 2π * speed + phase) * 0.5 + 0.5
           * (pulseMax - pulseMin) + pulseMin

Normalized: [0.8, 1.3] range
Frequency: 2.0 Hz (0.5s period)

Visualization:
1.3 │     ╱╲      ╱╲
1.0 │    ╱  ╲    ╱  ╲
0.8 │___╱____╲__╱____╲___
    └───────────────────
    0s    0.25s  0.5s  0.75s
```

### Trail Particle Fade

```
Opacity(age, life) = 1.0 - (age / life)

Life = 1.0 + synergyStrength * 0.5

Synergy 0.5: life = 1.25s
Synergy 0.8: life = 1.40s
Synergy 1.0: life = 1.50s
```

### Aura Rotation

```
Angle(t) = t * rotationSpeed (radians)
         = t * 0.3 (radians/frame)

Full rotation: 2π / 0.3 ≈ 20.94 seconds
```

### Shimmer Wave

```
Displacement(i, t) = sin(i * 2π/8 + t * 1.5Hz) * amplitude

8 waves per ribbon
Frequency matches synergy strength
Period: 0.67 seconds at max synergy
```

---

## Color Blending Rules

### Basic Blending

```
blendedColor = sourceColor * (1 - t) + targetColor * t

Where t = 0 to 1 (position along link/highway)
```

### Glow Pulse Color

```
glowColor = 50% sourceColor + 50% targetColor
          = (source + target) / 2

Example:
  source = [0, 221, 255] (cyan)
  target = [255, 0, 255] (magenta)
  glow = [127, 110, 255] (blue-magenta)
```

### Trail Particle Colors

```
For each particle at spawn:
  t_spawn = random(0, 1)
  color = sourceColor.lerp(targetColor, t_spawn)

This creates varying hues along trail
```

### Highway Gradient

```
For each vertex i (0 to 40):
  t = i / 40
  color = sourceColor.lerp(targetColor, t)
  
Result: smooth gradient across entire ribbon
```

---

## Motion & Physics Models

### Trail Particle Physics

```
Acceleration: None (constant velocity)
Velocity: direction * (baseVel + synergy * 0.05)
         + perpendicular * random(-0.02, 0.02)

Update:
  position += velocity * deltaTime
  opacity *= (1 - deltaTime / lifeSpan)
  
Removal: opacity <= 0 or age > life
```

### Burst Particle Physics

```
Initial Position: link midpoint
Initial Velocity: radial * 3.0 u/s
Direction: (cos(angle), sin(angle), random(-1,1))
Angle: particleIndex / 12 * 360°

Update:
  position += velocity * deltaTime
  opacity *= (1 - time / burstDuration)
  
Removal: time > 0.7s
```

### Node Aura Rotation

```
No physics simulation
Pure rotational animation:
  angle += rotationSpeed * deltaTime
  
Constant speed regardless of synergy
```

### Highway Shimmer

```
No physics simulation
Pure wave pattern:
  offset[i] = sin(t * 1.5Hz * synergy + i * 8 * 2π) * amplitude
  
Smooth, predictable wave motion
```

---

## Rendering & Blending

### Material Specifications

**SynergyVFX Materials:**

```javascript
// Glow Line
{
  type: LineBasicMaterial,
  transparent: true,
  depthWrite: false,
  blending: AdditiveBlending,
  color: [0-255, 0-255, 0-255]
}

// Trail Points
{
  type: PointsMaterial,
  transparent: true,
  depthWrite: false,
  blending: AdditiveBlending,
  sizeAttenuation: true
}

// Node Aura
{
  type: MeshBasicMaterial,
  transparent: true,
  depthWrite: false,
  blending: AdditiveBlending,
  side: FrontSide
}
```

**SynergyHighways Material:**

```javascript
{
  type: MeshPhongMaterial,
  transparent: true,
  depthWrite: false,
  blending: AdditiveBlending,
  side: DoubleSide,
  emissive: 0x000000,
  emissiveIntensity: 0.5,
  vertexColors: true
}
```

### Render Order

```
1. NeonLinkVisuals (core links, particles)
2. SynergyVFX glows & trails (additive)
3. SynergyHighways (renderOrder: -1, background)
4. SynergyVFX auras (additive)
5. UI overlay
```

### Blending Modes Explained

**Additive Blending:**
```
finalPixel = existingPixel + sourcePixel

Results:
- Black stays black (0 + 0 = 0)
- Adds light (non-destructive)
- Bright colors stack nicely
- No darkening possible
```

### Depth Testing

```
depthWrite: false → Don't write to depth buffer
  Allows overlapping additive effects

Maintains:
- Proper 3D layering
- Z-fighting prevention
- Efficient rendering
```

---

## Configuration Reference

### SynergyVFX1_0 Config

```javascript
{
  // Glow Pulse Layer
  glowPulseMin: 0.8,              // Min intensity
  glowPulseMax: 1.3,              // Max intensity
  glowPulseSpeed: 2.0,            // Hz frequency
  glowBaseIntensity: 0.15,        // Base strength
  
  // Chromatic Trails
  trailParticleCount: 6,          // Particles per spawn
  trailParticleSize: 0.04,        // Units
  trailVelocityBase: 0.02,        // Base units/s
  trailFadeDistance: 0.8,         // Units before fade
  
  // Synergy Aura
  auraThreshold: 0.4,             // Min synergy to show
  auraBaseRadius: 0.35,           // Base ring size
  auraRadiusScale: 0.5,           // Scale multiplier
  auraMaxOpacity: 0.6,            // Peak opacity
  auraRotationSpeed: 0.3,         // Radians/frame
  
  // Synergy Burst
  burstDuration: 0.7,             // Seconds
  burstExpandSpeed: 2.5,          // Units/s
  burstMaxRadius: 3.0,            // Units
  burstParticleCount: 12,         // Particles
  burstParticleSpeed: 3.0,        // Units/s
}
```

### SynergyHighways1_0 Config

```javascript
{
  // Visibility
  synergyThreshold: 0.7,          // Min synergy to show
  
  // Arc Geometry
  arcHeight: 15,                  // Units above world
  arcResolution: 40,              // Vertices per arc
  curveSegments: 3,               // Bezier points
  
  // Ribbon Parameters
  ribbonWidth: {
    low: 0.3,                     // 0.7-0.8 synergy
    medium: 0.6,                  // 0.8-0.9 synergy
    high: 1.0,                    // 0.9-1.0 synergy
  },
  
  // Shimmer Animation
  shimmerSpeed: 1.5,              // Hz base
  shimmerAmplitude: 0.15,         // Units max
  shimmerFrequency: 8,            // Waves
  
  // Opacity
  baseOpacity: 0.5,               // Starting opacity
  maxOpacity: 0.85,               // Peak opacity
  
  // Performance
  maxHighways: 100,               // Culling limit
  updateFrequency: 1,             // Every N frames
}
```

---

## Visual Example Diagrams

### Link Synergy Visualization

```
Low Synergy (0.2):
  ●─────●
  (thin line, no glow, no trails)

Medium Synergy (0.5):
  ●═════●  ← glow visible
  │✦ ✦ ✦│  ← some particles
  (medium thickness, subtle effects)

High Synergy (0.8):
  ●▓▓▓▓▓●  ← strong glow
  │✧✧✧✧✧│  ← many particles
   ╰─────╯  ← visible auras
  (thick appearance, intense effects)

Critical Synergy (1.0):
  ●▓▓▓▓▓●  ← maximum glow
  │✦✧✦✧✦│  ← dense particle stream
   ╰═════╯  ← rotating halos
  ═════════  ← highway visible above
  (all effects active)
```

### Node Aura Ring Patterns

```
Synergy 0.4 (1 ring):        Synergy 0.7 (2 rings):
     ◯                            ◯
    ╱ ╲                          ╱ ╲
   ╱   ╲                        ╱   ╲
  │  ●  │                      │  ●  │
   ╲   ╱                        ╲   ╱
    ╲ ╱     (rotating)           ╲ ◯ ╱
     ◯                            ╲ ╱
                                   ◯

Synergy 1.0 (3 rings):
     ◯
    ╱ ╲
   ◯   ◯
  │  ●  │
   ◯   ◯
    ╲ ╱
     ◯
```

### Highway Arc Profile

```
Side View (showing arc height):

        Apex (15 units high)
          ▲
         ╱│╲
        ╱ │ ╲
       ╱  │  ╲
      ╱   │   ╲
  ●──────────────●  ← Nodes
  source       target
  ←────────────→
   arc horizontal distance
```

### Burst Effect Timeline

```
t=0ms (trigger):
  ●  (ring radius: 0.1u, opacity: 0.8)
  
t=175ms:
 ╭─╮  (expanding, opacity: 0.6)
 │✧│  ✧ = particles
 ╰─╯  
  
t=350ms:
╭───╮  (more expansion, opacity: 0.4)
│ ✧ │
╰───╯

t=525ms:
╭─────╮  (approaching max, opacity: 0.2)
│  ✧  │
╰─────╯

t=700ms (end):
  ●  (faded completely, cleaned up)
```

---

## Performance Characteristics

### Frame Time Budget

```
SynergyVFX (100 links):
  - Update loop: 0.5-0.8ms
  - Trail particles: 0.3-0.5ms
  - Burst cleanup: 0.1-0.2ms
  Total: ~1.0-1.5ms per frame

SynergyHighways (50 highways):
  - Geometry updates: 0.3-0.5ms
  - Shimmer animation: 0.2-0.3ms
  - Visibility culling: 0.1-0.2ms
  Total: ~0.6-1.0ms per frame

Combined (realistic scene):
  - 100 links + 50 highways ≈ 2.0-2.5ms
  - Leaves ~13.5ms budget for rest of engine @ 60fps
```

### Memory per Effect

```
SynergyVFX:
  - Link entry: ~200 bytes
  - Trail particles (6×): ~360 bytes
  - Per-node aura: ~150 bytes
  Total per link: ~560 bytes
  100 links = 56KB

SynergyHighways:
  - Highway entry: ~300 bytes
  - Geometry (40pts): ~1.5KB
  - Material clone: ~200 bytes
  Total per highway: ~2KB
  50 highways = 100KB

Total typical scene: ~156KB
```

---

**Status: ✅ Complete Specification**

All visual layers, animations, and configurations fully documented.
Ready for implementation and iteration.
