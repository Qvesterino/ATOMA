# CONTROL Special Governors — Visual Reference

## Visual Comparison

```
STANDARD CONTROL NODES (Examples)          vs        SPECIAL GOVERNORS

┌─────────────────────────────────┐                 ┌─────────────────────┐
│  AxiomCrystal                   │                 │  ΦRIX (Flow Arbiter)│
│  Vertical crystal monolith      │                 │  Asymmetric spinner │
│  Sharp facets, twisted          │                 │  4 irregular arms   │
│  IMMUTABLE (no animation)       │                 │  Orbiting shards    │
└─────────────────────────────────┘                 │  LEARNS?: No        │
                                                    └─────────────────────┘

┌─────────────────────────────────┐                 ┌─────────────────────┐
│  CommandPyramid                 │                 │ CRUCIS (Suppression)│
│  Tall pyramid with beams        │                 │ Cross frame         │
│  Radiating command structure    │                 │ Grip-arms compress  │
│  Slow rotation                  │                 │ Pressure pump glows │
└─────────────────────────────────┘                 │ LEARNS?: No         │
                                                    └─────────────────────┘

┌─────────────────────────────────┐                 ┌─────────────────────┐
│  HierarchyTower                 │                 │ VERTEX (Temporal)   │
│  Stacked levels narrowing up    │                 │ Spinning cage rings │
│  Chain of command visualized    │                 │ Oscillating spikes  │
│  Slow rotation + bobbing        │                 │ Rotating chrono core│
└─────────────────────────────────┘                 │ LEARNS?: Yes! (8-15m)
                                                    └─────────────────────┘
```

---

## ΦRIX — Detailed Visual Breakdown

```
                        ↑ ARM 3
                        |
                   ╱────○────╲
                  ╱      │     ╲
            ARM 4 ○      │ SPINE ○ ARM 1
                  ╲      │     ╱
                   ╲────○────╱
                        |
                        ↓ ARM 2

CENTRAL SPHERE:
  • Color: Magenta (0xff00ff) or custom color
  • Glow: Emissive intensity 0.6
  • Size: 0.25 units
  • Rotates slowly

DECISION SPINE:
  • Asymmetric curved tube
  • 8 segments, tapers slightly
  • Spins around Y-axis
  • Spin speed = traffic load
  • Thickness: 0.15 units

IRREGULAR ARMS (4x):
  • Positioned at 4 cardinal + offset directions
  • NOT symmetrical (key design feature)
  • Box geometry (0.18×0.08×0.6 units)
  • Point outward/upward
  • Show "tension" via emissive intensity variation

ORBITING SHARDS (6x):
  • Tetrahedron geometry (0.12 units)
  • Orbit 0.5 units out from center
  • Staggered heights (sin pattern)
  • Rotate randomly (static at creation)
  • Color matches center sphere

ANIMATION STATE:
  • Spine: rotates based on trafficLoad
  • Arms: emissive flickers (decision flashes in magenta)
  • Shards: gentle orbit (no movement, just static positioning)
  • Phase: updates decision phase counter
```

### ΦRIX Example Animation
```
Traffic Light:  0.0 (idle)    → Spine barely rotates (< 0.5 rad/s)
                0.5 (moderate) → Spine spins steadily (1.0 rad/s)
                1.0 (congested)→ Spine spins fast (2.0 rad/s)

Decision Flash: Arms glow magenta → Pulse routed ✓
                Arms dim         → No route available ✗
```

---

## CRUCIS — Detailed Visual Breakdown

```
        FRAME (Cross-shaped)
         _______
        |   |   |
     ───┼───○───┼───  ← Horizontal beam (1.0 × 0.12 × 0.12)
        |   |   |
        |___|___|
    ↑ Vertical beam (0.12 × 1.0 × 0.12)

CROSS INTERSECTION:
  • Central sphere (pressure pump)
  • Color: Magenta with orange glow
  • Size: 0.35 units
  • Glow intensity: 0.3 → 0.8 (driven by suppressionForce)

GRIP ARMS (4x):
  • Positioned on the 4 ends of cross
  • Box geometry (0.25×0.18×0.12 units each)
  • Located at: (+0.6,0,0), (-0.6,0,0), (0,+0.6,0), (0,-0.6,0)
  • COMPRESS vertically when suppressing (scale.y reduced)
  • When active: emissive intensity rises
  • When inactive: dim (0.35 intensity)

TENSION CABLES (4x):
  • Connect pump to each grip arm
  • Box geometry (0.04×0.04×0.8 units each)
  • Run diagonally from center to each arm
  • Glow orange when under tension
  • Emissive intensity follows suppressionForce

FRAME BEAMS:
  • Metallic appearance (0.85 metalness)
  • Minimal glow (0.3 intensity)
  • Static (no animation)
  • Provide structural support visual

ANIMATION STATE:
  • Pump: pulsing glow (emissive 0.3 + suppressionForce × 0.5)
  • Grips: compress inward (scale.y = 1.0 - compression × 0.4)
  • Cables: tension glow increases with force
  • Color shift: stays magenta but brightness varies
```

### CRUCIS Example Animation
```
Suppression Level 0.0 (idle):
  ┌─────┐
  │  O  │  ← Pump glows faintly
  └─────┘
  ↑     ↑  ← Grips wide open
  
Suppression Level 0.5 (medium):
  ┌─────┐
  │ 🔶  │  ← Pump glows orange
  └─────┘
  ↓     ↓  ← Grips partially compressed
  
Suppression Level 1.0 (maximum):
  ┌─────┐
  │⚠️🔶│  ← Pump fully glowing
  └─────┘
  ↓     ↓  ← Grips nearly closed
```

---

## VERTEX — Detailed Visual Breakdown

```
                    ↑ INDICATOR (Cyan)
                    ◯
              
          ╱───────────────╲
         ╱    CAGE RING 1   ╲    ← Outer torus (0.75 R)
        │                   │
        │    ╱─────────╲    │
        │   ╱  RING 2   ╲   │    ← Middle torus (0.6 R)
        │  │   ╱───╲    │   │
        │  │  │  ◎  │   │   │    ◎ = Chrono core (0.3 unit)
        │  │  │ ◯◯◯ │   │   │    ◯ = Servo cams (4x)
        │  │   ╲───╱    │   │
        │   ╲  RING 3  ╱    │    ← Inner torus (0.45 R)
        │    ╲─────────╱     │
         ╲                  ╱
          ╲───────────────╱
        
        12x SPIKES radiating outward
        (oscillate in/out based on gating)
                    
                    ↓ INDICATOR (Red)
                    ◯
```

### Component Details

**CAGE RINGS (3x)**:
- Torus geometry (ring × ring spacing)
- Radii: 0.45, 0.60, 0.75 units
- Rotate independently (different speeds/axes)
- Thickness: 0.08 units each
- Create periodic "gating window"

**OSCILLATING SPIKES (12x)**:
- Cone geometry (0.08 radius, 0.4 height each)
- Positioned 0.75 units out from center
- Spaced evenly around circle (30° apart)
- Move in/out as cage rotates past them
- Glow when pulse is in-phase (accepting)

**CHRONO REGULATOR CORE**:
- Octahedron geometry (0.3 units)
- Centered in structure
- Rotates continuously (internal clock)
- Spin speed driven by learned pattern frequency
- Color: magenta with high emissive (0.6)

**SERVO CAMS (4x)**:
- Box geometry (0.15×0.25×0.08 units each)
- Positioned around core (4 cardinal directions)
- **KEY FEATURE**: Rotate gradually as learning happens
- Visible servo rotation = learning in progress
- Rotation speed = learning rate × elapsed time

**PHASE INDICATORS (2x)**:
- Sphere geometry (0.15 units each)
- Top sphere: Cyan (0x00ffff) — pulse accepted
- Bottom sphere: Red (0xff0000) — pulse blocked
- Flash opacity based on gating state

### VERTEX Example Animation

```
IDLE STATE (no pulses):
  Ring rotation: slow (0.5 rad/s)
  Spikes: rest state (not oscillating)
  Cams: minimal rotation (adaptation 0%)
  Indicators: dark (opacity 0)

PULSE ARRIVING (in phase):
  Spike oscillation: ±0.1 units amplitude
  Cyan indicator: flash (opacity → 1.0 → 0)
  Cage rotation: steady at 1 rad/s

PULSE ARRIVING (out of phase):
  Red indicator: flash (opacity → 1.0 → 0)
  Spike oscillation: blocked (minimal motion)
  
LEARNING IN PROGRESS (8-15 min):
  Servo cams: visible rotation (increases over time)
  Cage rotation speed: gradually increases
  Learned frequency: converges to dominant pulse freq
  
AFTER FULL ADAPTATION (15+ min):
  Cage rotation: matches pulse frequency exactly
  Servo cams: fully rotated (rotation complete)
  Only that frequency passes through (temporal monopoly)
```

---

## Side-by-Side Comparison Table

| Aspect | ΦRIX | CRUCIS | VERTEX |
|--------|------|--------|--------|
| **Symmetry** | Asymmetric ✗ | Cross symmetric | Radial symmetric |
| **Primary Material** | 0.75 metalness | 0.8 metalness | 0.7 metalness |
| **Size** | 1.5 units | 1.2 units | 1.4 units |
| **Key Mechanic** | Spin speed | Grip compression | Cage rotation |
| **Animation Type** | Rotation + flashing | Scale + glow | Complex rotation + learning |
| **Learns** | No (stateless) | No (mechanical) | Yes (adapts over time) |
| **Coolness Factor** | Traffic cop energy | Steampunk vibes | Clockwork mystery |

---

## Color Schemes

### Default (Magenta/Red)
```
ΦRIX:    0xff00ff (pure magenta)
CRUCIS:  0xff00ff base, 0xff6600 orange pump glow
VERTEX:  0xff00ff base, 0x00ffff (cyan accepted), 0xff0000 (red blocked)
```

### Alternative Schemes

**Amber/Gold Theme**:
```
ΦRIX:    0xffaa00
CRUCIS:  0xffbb33 with 0xffdd00 pump
VERTEX:  0xffaa00 base, 0x00ff00 (green accepted), 0xff3300 (red blocked)
```

**Cool/Blue Theme**:
```
ΦRIX:    0x0099ff
CRUCIS:  0x0099ff with 0x00ddff pump
VERTEX:  0x0099ff base, 0x00ffff (cyan accepted), 0xff00ff (magenta blocked)
```

---

## Lighting Recommendations

For optimal visibility of governors:

```
ΦRIX (Flow Arbiter):
  ✓ Bright overhead lighting
  ✓ Side light to show arm asymmetry
  ✗ Backlighting (hides spin motion)

CRUCIS (Suppression Governor):
  ✓ Front/side lighting to show grip arms
  ✓ Slight warm tint for hydraulic pump feeling
  ✗ Top-only lighting (arms may be in shadow)

VERTEX (Temporal Gate):
  ✓ Surround lighting (shows cage rings clearly)
  ✓ Rim lighting to separate cage from core
  ✓ Spotlight from above (shows spike oscillation)
  ✗ Flat lighting (cage rings appear as blobs)
```

---

## Quick Recognition Guide

**Spot them in game**:

🔹 **Rotating spine with orbiting shards** → ΦRIX (traffic patterns)
🔹 **Cross with glowing pump & gripping arms** → CRUCIS (suppression active)
🔹 **Spinning cage with spikes & flashing lights** → VERTEX (gating in progress)

---

*Visual language expresses mechanical logic. Geometry = Behavior.*
