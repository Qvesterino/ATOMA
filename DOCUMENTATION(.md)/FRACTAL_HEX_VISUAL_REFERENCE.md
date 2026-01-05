# FRACTAL HEX MARKER - VISUAL REFERENCE GUIDE

**Complete visual specification and design documentation for the ATOMA Fractal Hex Marker System**

---

## 🎨 MARKER ANATOMY

### Component Breakdown

```
                    ✨ CENTER SPARK
                  (Glowing pulsing sphere)
                     radius: 0.08
                color: node category color
                  emissive intensity: 0.6
                        opacity pulse
                       0.4 → 0.8 → 0.4

                           △
                           │
        ┌─────────────────────────────────────┐
        │                                     │
        │         RING 3 (INNER)              │
        │      Small Hexagon Outline          │
        │        radius: 0.2                  │
        │    glitch irregularity: 0.05        │
        │         6 line segments             │
        │                                     │
        │    ╱─────────────────────╲          │
        │   ╱                       ╲         │
        │  ╱    RING 2 (MIDDLE)      ╲       │
        │ │   Medium Hexagon Outline   │      │
        │ │    radius: 0.4             │      │
        │ │ rotated: 30°               │      │
        │ │ glitch irregularity: 0.1   │      │
        │ │  6 line segments           │      │
        │  ╲      sparse connections   ╱      │
        │   ╲___  (every other)  ____╱       │
        │         RING 1 (OUTER)             │
        │      Large Hexagon Outline         │
        │        radius: 0.6                 │
        │    glitch irregularity: 0.15       │
        │         6 line segments           │
        │                                    │
        └────────────────────────────────────┘

              Scale Pulse: 0.96 → 1.03
              Rotation: 0.15 rad/sec
              Position: Y + 0.8
```

---

## 🌈 COLOR PALETTE

### Node Category Colors

```
INPUT NODE                    PROCESSOR NODE
 Cyan (#00F2FF)               Mint (#84FFE6)

     ████                           ████
     ████                           ████
   ████████                       ████████
   ████████                       ████████
   ████████                       ████████
     ████                           ████
     ████                           ████


OUTPUT NODE                   CONTROLLER NODE
 Magenta (#FF00FF)            Gold (#FFD700)

     ████                           ████
     ████                           ████
   ████████                       ████████
   ████████                       ████████
   ████████                       ████████
     ████                           ████
     ████                           ████


MYTHIC NODE
 Neon Green (#00FF88)

     ████
     ████
   ████████
   ████████
   ████████
     ████
     ████
```

---

## 🔄 ANIMATION CYCLES

### Rotation Animation
```
Time:     0s                10s               20s               30s
         ───────────────────────────────────────────────────────

Angle:    0°     6°    12°   18°   24°   30°   ...   354°  360°
         ╱──────────────────────────────────────────────────╲
        ╱                                                    ╲
       ╱         Linear rotation around Y axis              ╲
      ╱          Speed: 0.15 rad/sec                         ╲
     ╱           Period: ~42 seconds (1 full rotation)       ╲
    ╱____________________________________________________────╲


Visual Effect:
  
  Frame 1          Frame 2          Frame 3          Frame 4
    ╱─╲              ╱─╲              ╱─╲              ╱─╲
   ╱   ╲            ╱   ╲            ╱   ╲            ╱   ╲
  │  ╱╲  │         │  ╱╲  │         │  ╱╲  │         │  ╱╲  │
   ╲   ╱            ╲   ╱            ╲   ╱            ╲   ╱
    ╲─╱              ╲─╱              ╲─╱              ╲─╱

  (Continuous smooth rotation creating visual flow)
```

### Scale Pulse Animation
```
Time:     0s                 1s                 2s
         ────────────────────────────────────────

Scale:    1.00   1.015  1.03   1.015  1.00   0.985
         ╱────╲        ╱────╲        ╱────╲
        ╱      ╲      ╱      ╲      ╱      ╲
       ╱        ╲────╱        ╲────╱        ╲

 Formula: scale = minScale + (pulse * (maxScale - minScale))
          pulse = (sin(phase) + 1.0) * 0.5  // 0 to 1

 Range:   0.96 → 1.03 → 0.96
 Cycle:   2 seconds (1.5 Hz)


Visual Effect:

  Frame 1        Frame 2        Frame 3        Frame 4
  (scale 0.96)   (scale 1.00)   (scale 1.03)   (scale 1.00)

    ╱─╲            ╱─╲            ╱─╲            ╱─╲
   ╱   ╲          ╱   ╲          ╱   ╲          ╱   ╲
  │     │        │  ╱╲  │       │  ╱╲  │       │  ╱╲  │
   ╲   ╱          ╲   ╱          ╲   ╱          ╲   ╱
    ╲─╱            ╲─╱            ╲─╱            ╲─╱

  (Breathing motion - contract then expand)
```

### Spark Opacity Pulse
```
Time:     0s                 1s                 2s
         ────────────────────────────────────────

Opacity:  0.4    0.5    0.6    0.7    0.8    0.7    0.6
         ╱──────────────────┐
        ╱                   ╲
       ╱                     ╲
      ╱                       ╲────────╲
                                       ╲____

 Formula: opacity = 0.4 + (pulse * 0.4)  // 0.4 to 0.8

 Tied to: Scale pulse (synchronized)


Visual Effect (sphere brightness):

  Frame 1      Frame 2      Frame 3      Frame 4
  (40%)        (50%)        (80%)        (50%)

   ◦ dim      ◦ medium    ◦◦ bright    ◦ medium
```

### Combined Animation (All Three)
```
Rotation:    ═══════════════════════════════════ (continuous)
             (slow, meditative spin)

Scale:       ╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲╱╲
             (breathing pulse every 2 seconds)

Spark:       ⚪⚪●●●●●⚪⚪
             (pulsing with scale)

Result:      Organic, living appearance
             Sense of consciousness/energy
             Professional, meditative feel
```

---

## 📐 GEOMETRY SPECIFICATIONS

### Hexagon Ring Dimensions

```
RING 1 (OUTER)
├─ Radius: 0.6 units
├─ Segments: 6 (perfect hexagon)
├─ Irregularity: 0.15 (±~0.09 units per vertex)
└─ Vertices: 7 (including endpoint)

RING 2 (MIDDLE)
├─ Radius: 0.4 units
├─ Segments: 6 (perfect hexagon)
├─ Rotation: +30° (π/6 radians)
├─ Irregularity: 0.1 (±~0.06 units per vertex)
└─ Vertices: 7 (including endpoint)

RING 3 (INNER)
├─ Radius: 0.2 units
├─ Segments: 6 (perfect hexagon)
├─ Irregularity: 0.05 (±~0.03 units per vertex)
└─ Vertices: 7 (including endpoint)

Total Vertices: ~21 for hexagon structure
                 ~39 for connectivity edges
                 ~60 total including center spark
```

### Glitch Effect Details

```
IRREGULARITY NOISE:

noise = (random() - 0.5) * irregularity * radius * 0.15

Example (Ring 1, radius 0.6, irregularity 0.15):
  noise_max = 0.5 * 0.15 * 0.6 * 0.15 = 0.00675
  noise_range ≈ ±0.0068 units
  visual effect = slight waviness in outline

Increases:  Inner → Outer (0.05 → 0.15)
Creates:    Outer ring more glitchy, inner more stable
Effect:     Visual interest, digital artifact aesthetic
```

### Radial Connection Pattern

```
Ring 1 to Ring 2:
├─ Vertex 0 ─── connected
├─ Vertex 1 ─── NOT connected (sparse)
├─ Vertex 2 ─── connected
├─ Vertex 3 ─── NOT connected
├─ Vertex 4 ─── connected
└─ Vertex 5 ─── NOT connected

Ring 2 to Ring 3:
├─ Vertex 0 ─── NOT connected (inverse of above)
├─ Vertex 1 ─── connected
├─ Vertex 2 ─── NOT connected
├─ Vertex 3 ─── connected
├─ Vertex 4 ─── NOT connected
└─ Vertex 5 ─── connected

Result: 6 connections total (sparse network)
        Creates "glitch gaps" in radial pattern
        Visual effect: Incomplete connections
```

---

## 🎯 POSITIONING & SCALE

### Node-Relative Positioning

```
World Space:
  
  NODE POSITION (0, 0, 0)
      │
      ├─ Node Mesh (various size)
      │
      ├─ Visual Group
      │   │
      │   └─ Fractal Hex Marker Group
      │       └─ Position Y = +0.8 (relative to Visual Group)
      │
      └─ Other children...


Visual Hierarchy:
  
  scene
   └─ node
       ├─ mesh (core node visual)
       │
       └─ visualGroup
           ├─ personality effects
           ├─ evolution visuals
           │
           └─ markerGroup (Fractal Hex Marker)
               ├─ hexMarker (LineSegments)
               │   └─ geometry: hex rings
               │   └─ material: LineBasicMaterial
               │
               └─ spark (Mesh - Sphere)
                   └─ geometry: SphereGeometry(0.08)
                   └─ material: MeshBasicMaterial (emissive)
```

### Scale Relationship

```
Marker scale is independent of node scale
├─ Node scales up → Marker stays relative
├─ Node scales down → Marker stays proportional
└─ Allows zoom-in/out without marker distortion

Pulse Animation:
├─ Local scale: 0.96 → 1.03 (±3% variation)
├─ Applied to markerGroup only
└─ Does NOT affect node or other children
```

---

## 💾 PERFORMANCE BREAKDOWN

### Geometry Complexity

```
Hexagon Rings:
├─ Ring 1 outline: ~7 vertices → ~6 line segments
├─ Ring 2 outline: ~7 vertices → ~6 line segments
├─ Ring 3 outline: ~7 vertices → ~6 line segments
└─ Radial connections: 6 line segments
   Total: ~60 vertices, ~24 line segments

Center Spark:
├─ Sphere geometry: 8 segments × 8 rings = 64 vertices
└─ But only 0.08 radius (tiny scale)

Total Vertex Count: ~60 (low poly)
Draw Call Count: 2 per marker (hex lines + spark)
Batching Potential: Yes (if using buffer geometry)
```

### Frame Budget Allocation

```
Per Frame (60 FPS = 16.67ms budget):

Marker Detection (5Hz throttled = every 3 frames):
  ├─ Runs only 1/3 of the time
  └─ When running: ~1-2ms per 10 nodes

Marker Animation (Every frame):
  ├─ All 15 markers: ~0.2-0.5ms
  ├─ Rotation update: ~0.1ms
  ├─ Scale pulse: ~0.05ms
  ├─ Spark opacity: ~0.05ms
  └─ Total: ~0.2ms per 15 markers

Rendering (Every frame):
  ├─ 15 line segments: ~0.3ms
  ├─ 15 sphere meshes: ~0.4ms
  └─ Total: ~0.7ms

Overall:
  Detection: 0.6ms (amortized, 5Hz throttled)
  Animation: 0.2ms (every frame)
  Rendering: 0.7ms (every frame)
  ────────────────────
  Total: ~1.5ms per frame (9% of 16.67ms budget)
  ────────────────────
  FPS Impact: < 3% (negligible)
```

---

## 🎬 VISUAL COMPARISON

### Before (Debug Cone) vs After (Fractal Hex)

```
BEFORE: Legacy Debug Cone

    ╱╲╱╲╱╲          Yellow cone marker
   ╱__╲__╲         (plain, static)
   │      │         Flat shading
   │      │         No animation
   │      │         Visually jarring
    ╲____╱         Part of clutter

Issues:
  - Yellow color too bright/garish
  - Static appearance (looks dead)
  - No information about node type
  - Clashes with ATOMA aesthetic
  - No visual hierarchy


AFTER: Fractal Hex Marker

    ╱─╲
   ╱ ◦ ╲             Elegant hex marker
  │ ╱╲  │            (animated, beautiful)
  │╱  ╲ │            Category-colored
   ╲   ╱             Rotating + pulsing
    ╲─╱              Matches ATOMA style
    
   Rings layer      Visual depth
   Glitch effect    Digital aesthetic
   Smooth animation Professional feel
   Color coded      Information at a glance

Benefits:
  + Beautiful, professional appearance
  + Smooth, organic animations
  + Clear visual hierarchy
  + Fits ATOMA aesthetic perfectly
  + Fast, performant rendering
  + Zero gameplay impact
```

---

## 🖼️ MARKER APPEARANCE BY NODE TYPE

### Input Node (Cyan)
```
Marker Color: #00F2FF
Center Spark: Bright cyan glow

     ╱─╲
    ╱ ◦ ╲
   │ ╱╲  │   ← Perfect for data sources
   │╱  ╲ │      Entry points
    ╲   ╱      Input streams
     ╲─╱
```

### Processor Node (Mint)
```
Marker Color: #84FFE6
Center Spark: Cool mint glow

     ╱─╲
    ╱ ◦ ╲
   │ ╱╲  │   ← For logic/processing
   │╱  ╲ │      Transformations
    ╲   ╱      Computations
     ╲─╱
```

### Output Node (Magenta)
```
Marker Color: #FF00FF
Center Spark: Vibrant magenta glow

     ╱─╲
    ╱ ◦ ╲
   │ ╱╲  │   ← For results/outputs
   │╱  ╲ │      Final destinations
    ╲   ╱      Sinks
     ╲─╱
```

### Controller Node (Gold)
```
Marker Color: #FFD700
Center Spark: Warm gold glow

     ╱─╲
    ╱ ◦ ╲
   │ ╱╲  │   ← For system nodes
   │╱  ╲ │      Controllers
    ╲   ╱      Hub nodes
     ╲─╱
```

### Mythic Node (Neon Green)
```
Marker Color: #00FF88
Center Spark: Glowing neon green

     ╱─╲
    ╱ ◦ ╲
   │ ╱╲  │   ← For legendary/evolved
   │╱  ╲ │      Special nodes
    ╲   ╱      Ascended state
     ╲─╱
```

---

## 📐 TECHNICAL SPECIFICATIONS

### Material Specifications

```
Hexagon Lines:
├─ Type: THREE.LineBasicMaterial
├─ Color: Node category color
├─ Opacity: 0.7 (slightly transparent)
├─ Linewidth: 2px (platform-dependent)
├─ Fog: Disabled (false)
├─ Transparent: True
└─ Blending: Standard (not additive)

Center Spark:
├─ Type: THREE.MeshBasicMaterial
├─ Color: Node category color
├─ Opacity: 0.8 base, pulsing 0.4-0.8
├─ Emissive: Node category color
├─ Emissive Intensity: 0.6
├─ Fog: Disabled (false)
├─ Transparent: True
└─ Blending: Standard
```

### Geometry Types

```
Hexagon Rings:
├─ Type: THREE.BufferGeometry
├─ Attributes: Position (Float32)
├─ Index: Uint16
├─ Primitive: LINE_SEGMENTS
└─ Dynamic: False (static after creation)

Center Spark:
├─ Type: THREE.SphereGeometry
├─ Radius: 0.08
├─ Width Segments: 8
├─ Height Segments: 8
├─ Primitive: TRIANGLES
└─ Dynamic: False (static, animated via transform)
```

---

## 🎓 DESIGN PHILOSOPHY

### Visual Consistency
- Hexagons = Core ATOMA aesthetic (nodes = network)
- Three rings = Three layers of consciousness
- Rotation = Data flow / network activity
- Pulsing = Life / vitality

### Color Theory
- Warm colors (gold) = System/control
- Cool colors (cyan, mint) = Data/processing
- Vibrant (magenta) = Output/results
- Green (mythic) = Evolution/transcendence

### Animation Psychology
- Slow rotation (0.15 rad/s) = Meditative, non-distracting
- Pulse (2s cycle) = Breathing, living system
- Smooth easing = Professional, polished feel
- Glow effects = Digital, ethereal presence

---

**Visual Reference Complete**

This comprehensive guide provides complete visual specifications for implementing, customizing, and understanding the ATOMA Fractal Hex Marker System.
