# EXTREME AI GPU SHADER PACK — VISUAL EFFECTS GUIDE

## 🎨 DETAILED SHADER BREAKDOWN (12 Archetypes)

---

## 1️⃣ HYPERBOLIC NEURAL PRISM

### Effect Type: Glassy Refraction + Fresnel Rim Lighting

```
Visual Composition:
┌─────────────────────────┐
│      ╱─────╲            │
│     ╱ ◊◊◊◊◊ ╲           │  ← Glassy surface with subtle distortion
│    ╱ ◊◊   ◊◊ ╲          │  ← Fresnel rim glow
│    ╲ ◊◊   ◊◊ ╱          │  ← Cyan ↔ Magenta color shift
│     ╲ ◊◊◊◊◊ ╱           │
│      ╲─────╱            │
└─────────────────────────┘

Animation:
- Color lerp: cyan (0x00ffff) → magenta (0xff00ff) → cyan (2s cycle)
- Fresnel intensity: sin(time * 0.5) * 0.5 + 0.5
- Distortion amount: fresnel * 0.1

Metric Reactivity:
- Synergy → Increases rim glow (synergy * 0.5)
- No other metrics
```

**Shader Type:** THREE.ShaderMaterial (glass effect)
**Color Scheme:** Cyan, Magenta, Yellow
**Feel:** Ethereal, refracting light, mystical portal-like

---

## 2️⃣ SINGULARITY KNOT NODE

### Effect Type: Radial Falloff + Gravity Lens

```
Visual Composition:
┌─────────────────────────┐
│        ◇ ╱╲ ◇           │  ← Dark edges (radial falloff)
│       ╱  ·  ╲            │  ← Vignette effect
│      ◇  ◇ ◇  ◇          │  ← Gravity lens distortion
│       ╲  ·  ╱            │
│        ◇ ╲╱ ◇           │  ← Bright core
│          ◉            │  ← Intense center glow
└─────────────────────────┘

Animation:
- Falloff: smoothstep(0.0, 0.5, distance)
- Normal distortion: vNormal + sin(dist * 3 + time) * 0.1
- Core glow: exp(-dist * 5) * (1 + corruption * 0.5)

Metric Reactivity:
- Corruption → Increases core glow intensity

Falloff Types:
- Near edge: Transparent, dark
- Middle zone: Visible but dim
- Core: Intense magenta glow
```

**Shader Type:** THREE.ShaderMaterial (radial effect)
**Base Color:** Magenta (0xff00ff)
**Feel:** Dark gravity well, event horizon, collapsing singularity

---

## 3️⃣ QUANTUM LATTICE NODE

### Effect Type: Procedural Grid Pattern + Noise Flicker

```
Visual Composition:
┌─────────────────────────┐
│  ●─────●───────●        │
│  │  ┌──·──┐  │          │  ← Grid lines (procedural)
│  ●─ ┤ · · ├──●          │  ← Noise-driven flicker
│  │  └──·──┘  │          │  ← Time-based glitch offset
│  ●─────●───────●        │
│     (glitch!)           │
└─────────────────────────┘

Animation:
- Grid pattern: abs(fract(uv * 5)) - 0.5
- Line smoothness: smoothstep(0.05, 0.01, min(grid.x, grid.y))
- Flicker: 0.7 + noise * 0.3 (noise from sin(dot(...) * time))
- Glitch offset: sin(time * 5) * 0.02, cos(time * 3) * 0.01
- Glitch spike: sin(time * 10) > 0.9 ? 0.2 : 0.0

Metric Reactivity:
- Harmony → (1.0 + harmony * 0.3) intensity multiplier

Grid Characteristics:
- Spacing: 5x grid cells
- Line opacity: alpha = gridPattern + 0.3
- Glitch probability: Random at sin(time * 10)
```

**Shader Type:** THREE.ShaderMaterial (procedural grid)
**Line Color:** Aqua (0x00ffaa)
**Feel:** Digital, quantum computer, glitchy matrix

---

## 4️⃣ FRACTAL BLOOM NODE

### Effect Type: Pulsing Emissive + Rim Glow

```
Visual Composition:
┌─────────────────────────┐
│        △△△             │
│       △   △            │  ← Petals with soft glow
│      △  ●  △           │  ← Central breathing pulse
│       △   △            │  ← Rim light enhancement
│        △△△             │
│                         │
└─────────────────────────┘

Animation:
- Pulse: sin(time * 2) * 0.5 + 0.5
- Intensity: 0.5 + pulse * 0.5 + synergy * 0.3
- Rim light: pow(1 - abs(dot(vNormal, viewDir)), 2) * 0.2

Emissive Behavior:
- At pulse peak: Bright cyan glow
- At pulse trough: Dim, subtle
- Breathing effect: Smooth sine wave, 2 sec cycle

Metric Reactivity:
- Synergy → Boosts base intensity (synergy * 0.3)
- Creates warm, inviting feel at high synergy

Petal Effects:
- Each petal breathes together
- Slight color variation per layer
- Soft halo around entire mesh
```

**Shader Type:** THREE.ShaderMaterial (pulsing)
**Color:** Aqua (0x00ffaa)
**Feel:** Breathing flower, organic, alive, inviting

---

## 5️⃣ REACTIVE TESSERACT

### Effect Type: Fresnel Edge Highlights

```
Visual Composition:
┌─────────────────────────┐
│  □───────────────□      │
│  │  ╱─────╲    │       │  ← Edge-highlighted boxes
│  │ ╱  ◊◊◊◊  ╲  │       │  ← Synergy-reactive color
│  │╱  ◊◊◊◊◊  ╲│       │
│  ●─────────────●        │
│                         │
└─────────────────────────┘

Animation:
- Fresnel: pow(1 - abs(dot(vNormal, viewDir)), 2)
- Edge intensity: fresnel * (1 + synergy * 0.5)
- Color mix: mix(baseColor, edgeColor, fresnel)
- Edge glow: edgeColor * edgeIntensity * 0.3

Wireframe Feel:
- Nested boxes highlight edges
- Inner boxes more visible at certain angles
- Outer box less visible, acts as envelope

Metric Reactivity:
- Synergy → Brightens edge highlights significantly
- High synergy = bright wireframe appearance
- Low synergy = subtle edge hint

Rotation:
- Boxes rotate on different axes
- Creates 4D tesseract impression
```

**Shader Type:** THREE.ShaderMaterial (fresnel)
**Colors:** Magenta base, Cyan edges
**Feel:** Wireframe tesseract, dimensional, reactive intelligence

---

## 6️⃣ CHAOTIC HEART

### Effect Type: Noise Distortion + Surface Perturbation

```
Visual Composition:
┌─────────────────────────┐
│     ╱∿╲                │
│    ╱∿◆∿╲                │  ← Noise-based color variation
│   ╱∿◆◆◆∿╲               │  ← Normal surface perturbation
│   ╲∿◆◆◆∿╱               │  ← Instability-driven distortion
│    ╲∿◆∿╱                │
│     ╲∿╱                 │
└─────────────────────────┘

Animation:
- Color noise: noise(vPosition + vec3(time) * 0.5)
- Color variance: colorVar = n * instability
- Normal perturbation: (noise(...) - 0.5) * instability * 0.5
- Distortion factor: dot(perturbedNormal, viewDir) * (1 + instability * 0.3)

Surface Behavior:
- At low instability: Smooth, slightly metallic
- At high instability: Rough, turbulent surface
- Color waves across surface
- Continuous wave motion

Metric Reactivity:
- Instability → Controls noise intensity and perturbation
- Higher instability = more chaotic appearance
- Creates "heartbeat" of chaos effect

Noise Quality:
- Pseudo-Perlin approximation
- Multiple octaves if possible
- Time-evolved for continuous flow
```

**Shader Type:** THREE.ShaderMaterial (noise)
**Color:** Red (0xff0055) with noise variation
**Feel:** Chaotic, turbulent, unstable, dangerous

---

## 7️⃣ WHISPER SPHERE

### Effect Type: Scrolling UV + Traveling Light Band

```
Visual Composition:
┌─────────────────────────┐
│       ◯◯◯◯            │
│      ◯ ╱─╲ ◯          │  ← Scrolling gradient bands
│     ◯ ╱ ► ╲ ◯         │  ← Traveling light effect
│      ◯ ╲─╱ ◯          │  ← Ethereal glow
│       ◯◯◯◯            │
│                         │
└─────────────────────────┘

Animation:
- Scrolling UV: scrollUv = uv + vec2(time * 0.5, time * 0.3)
- Gradient scroll: fract(scrollUv.y)
- Light band: step(0.45, scroll) - step(0.55, scroll)
- Traveling effect: smoothstep(0.0, 1.0, scroll)

Visual Effect:
- Bands flow around sphere
- Bright band travels continuously
- Bands cycle with period of ~6 seconds
- Harmony increases overall intensity

Inner Rim Light:
- Subtle rim glow always present
- Increases with harmony metric
- Creates hollow sphere effect

Metric Reactivity:
- Harmony → Increases glow intensity (0.3 * harmony)
- Creates "whispered" connection effect
```

**Shader Type:** THREE.ShaderMaterial (scrolling UV)
**Color:** Cyan (0x00ffff)
**Feel:** Ethereal, whispering, communicating, flowing energy

---

## 8️⃣ ECHO FRACTAL NODE

### Effect Type: Multi-Layer Radial Gradient

```
Visual Composition:
┌─────────────────────────┐
│     ◆─◆─◆─◆─◆        │
│   ◆─     ◇─◇─◆        │  ← Multiple gradient layers
│  ◆─  ◇─◆─◇  ◇─◆      │  ← Radial expansion waves
│   ◆─     ◇─◇─◆        │  ← Echo fade effect
│     ◆─◆─◆─◆─◆        │
└─────────────────────────┘

Animation:
- Distance calculation: dist = length(vPosition) * 3
- Multi-layer: sin(dist - time)
- Layer 1 opacity: smoothstep(0.0, 0.5, gradient)
- Layer 2 opacity: smoothstep(0.3, 0.8, gradient)
- Echo fade: exp(-dist * 0.5)

Wave Behavior:
- Waves propagate outward continuously
- Multiple echoes at different distances
- Soft additive blending of layers
- Colors lerp between A and B based on gradient

Soft Additive Blend:
- Outer echoes nearly transparent
- Inner layers more opaque
- Creates depth and dimensionality
- Additive blending gives glow effect

Visual Progression:
- Center: Bright, solid color
- Middle: Gradient transition
- Outer: Fading echoes, transparent
```

**Shader Type:** THREE.ShaderMaterial (radial gradient)
**Colors:** Aqua (0x00ffaa), Cyan (0x00ffff)
**Feel:** Expanding ripples, echoing waves, fractal depth

---

## 9️⃣ ABYSSAL SHARD

### Effect Type: Dark Absorbing + Sharp Specular Highlights

```
Visual Composition:
┌─────────────────────────┐
│         │              │
│        │◊│             │  ← Dark, light-absorbing
│       │◊◉◊│            │  ← Sharp metallic highlights
│        │◊│             │  ← Inner red/orange glow
│         │              │  ← Corruption-driven intensity
│    ◆◆◆◆╱◊╲◆◆◆         │
└─────────────────────────┘

Animation:
- Base color: u_baseColor * 0.2 (very dark)
- Specular highlight: pow(max(0, dot(reflected, viewDir)), 16)
- Specular intensity: specular * 0.8
- Corruption glow: sin(time + corruption * 3.14159) * 0.5 + 0.5
- Glow amount: glowColor * corruption * glowIntensity * 0.3

Metallic Feel:
- Razor-sharp specular highlights
- Highly reflective appearance
- Minimal ambient light
- High-frequency reflection

Corruption Effect:
- Red/orange inner glow
- Pulsates with sin(time)
- Intensity driven by corruption metric
- Creates malevolent "infected" feel

Colors:
- Base: Very dark (0x001111)
- Highlights: Nearly white
- Glow: Red-orange (0xff6644)

Appearance:
- Like obsidian or dark crystal
- Evil, malevolent aura
- Dangerous, sharp edges
```

**Shader Type:** THREE.ShaderMaterial (dark + specular)
**Colors:** Dark, Red-Orange glow
**Feel:** Malevolent, absorbing, dangerous, corrupted

---

## 🔟 TRI-HELIX NODE

### Effect Type: Scrolling UV (DNA-like Pattern)

```
Visual Composition:
┌─────────────────────────┐
│    ╱╲ ╱╲ ╱╲            │
│   ╱  ╲╱  ╲╱  ╲         │  ← Helical pattern (DNA-like)
│  │ ╱╱╱╱╱ ║  │        │  ← Flowing gradient
│   ╲  ╱  ╱  ╱          │  ← Traveling light band
│    ╲╱ ╲╱ ╲╱            │
│     (flowing)           │
└─────────────────────────┘

Animation:
- Scrolling UV: scrollUv = vUv + vec2(u_time * 0.5, u_time * 0.3)
- Scroll value: fract(scrollUv.y)
- Gradient: smoothstep(0.0, 1.0, scroll)
- Traveling band: step(0.45, scroll) - step(0.55, scroll)
- Intensity boost: 0.3 * harmony

Helix Characteristics:
- Spheres positioned along spiral path
- Lines connect helix points
- Creates DNA strand appearance
- Three helical strands intertwine

Flow Behavior:
- Gradient flows from bottom to top
- Continuously scrolling
- Harmony increases overall glow
- Traveling light band always visible

Biotic Feel:
- Organic flowing motion
- Living structure appearance
- Rhythmic pulsation
- Genetic code visualization
```

**Shader Type:** THREE.ShaderMaterial (scrolling UV)
**Color:** Magenta (0xff00ff)
**Feel:** Living DNA helix, genetic code, flowing life

---

## 1️⃣1️⃣ INFINITE SPIRAL NODE

### Effect Type: Spiral UV Mapping + Traveling Highlight

```
Visual Composition:
┌─────────────────────────┐
│      ╱ ◆ ╲              │
│    ◆╱     ╲◆            │  ← Spiral pattern from UVs
│  ◆╱        ╲◆          │  ← Rotating highlight
│    ◆╲     ╱◆            │  ← Continuous "traveling" light
│      ╲ ◆ ╱              │  ← Expanding spiral
└─────────────────────────┘

Animation:
- Scrolling UV: Same as Tri-Helix + rotation
- UV spiral mapping: vUv rotated + scrolled
- Traveling light: Smooth band moving along spiral
- Continuous highlight: Step function at fixed position, offset by time
- Expansion: sin(time * variation) for radial pulsing

Visual Effect:
- Spiral arms extend outward
- Highlight travels along spiral continuously
- Multi-turn spiral (3+ turns)
- Additive highlight on top of base gradient

Infinite Feeling:
- Never-ending spiral expansion
- Continuous motion without loops
- Fractal-like complexity
- Always moving, never stationary

Metric Reactivity:
- Harmony → Increases glow (0.3 * harmony)
- Higher harmony = brighter spiral
```

**Shader Type:** THREE.ShaderMaterial (scrolling UV)
**Color:** Aqua (0x00ffaa)
**Feel:** Infinite expansion, hypnotic spiral, recursive pattern

---

## 1️⃣2️⃣ CHRONO RIPPER NODE

### Effect Type: Time-Glitch Effect with Color Spikes

```
Visual Composition:
┌─────────────────────────┐
│  ╱╲    ┌─┐   ╱╲        │
│ ╱  ╲   │·│  ╱  ╲       │  ← Time-glitch artifacts
││ ◊◊ │←│·│→│ ◊◊ │      │  ← Color shift spikes
│ ╲  ╱   │·│  ╲  ╱       │  ← Subtle displacement
│  ╲╱    └─┘   ╲╱        │  ← Chaotic appearance
│  (glitch!)   (glitch!)  │
└─────────────────────────┘

Animation:
- Glitch offset: sin(time * 8) > 0.5 ? 0.05 : 0.0
- UV offset: vPosition.xy + vec2(glitch)
- Color spike: max(0, sin(time * 10 + 1.57079) * 0.5)
- Spike probability: Occurs when sin(...) crosses threshold
- Displacement: vPosition + vec3(glitch * 0.1)

Glitch Behavior:
- Random UV offset every few frames
- Creates temporal distortion
- Fragments appear displaced briefly
- Pattern repeats every ~0.8 seconds

Color Shift Spikes:
- Sharp color transitions at intervals
- Time-driven phase shift
- Adds visual "corruption" effect
- Emphasizes temporal distortion

Visual Impression:
- Like watching a video glitch
- Temporal fragmentation
- Fragments flickering in/out
- Chaotic but rhythmic pattern

Three Fragment Orbits:
- Central core pulses
- Outer fragments orbit chaotically
- Glitch effects apply to all parts
- Creates "broken time" feeling
```

**Shader Type:** THREE.ShaderMaterial (glitch)
**Color:** White (0xffffff) with time-based shifts
**Feel:** Temporal glitch, broken time, chaotic discontinuity

---

## 📊 SHADER SUMMARY TABLE

| # | Archetype | Shader Type | Primary Effect | Colors | Metric |
|---|-----------|-------------|-----------------|--------|--------|
| 1 | Hyperbolic Prism | Refraction | Fresnel + Distort | Cyan/Magenta | Synergy |
| 2 | Singularity Knot | Radial | Vignette + Lens | Magenta | Corruption |
| 3 | Quantum Lattice | Procedural | Grid + Flicker | Aqua | Harmony |
| 4 | Fractal Bloom | Emissive | Pulsing + Rim | Aqua | Synergy |
| 5 | Reactive Tesseract | Fresnel | Edge Highlight | Magenta/Cyan | Synergy |
| 6 | Chaotic Heart | Noise | Distortion | Red | Instability |
| 7 | Whisper Sphere | Scrolling | UV Flow + Light | Cyan | Harmony |
| 8 | Echo Fractal | Gradient | Multi-Layer | Aqua/Cyan | - |
| 9 | Abyssal Shard | Dark | Specular + Glow | Dark/Orange | Corruption |
| 10 | Tri-Helix | Scrolling | DNA Pattern | Magenta | Harmony |
| 11 | Infinite Spiral | Scrolling | Spiral + Travel | Aqua | Harmony |
| 12 | Chrono Ripper | Glitch | Time Effect | White | - |

---

## 🎯 Visual Quality Goals

✅ All shaders maintain clarity and readability
✅ No performance degradation from shader complexity
✅ Smooth animation cycles (2-6 seconds typical)
✅ Metric reactivity adds visual feedback without chaos
✅ Colors chosen for ATOMA neon aesthetic
✅ Each shader is distinctly unique
✅ Archetype identity preserved even with shader

---

**Result:** 12 visually distinct, beautiful GPU shader effects that enhance Extreme AI node aesthetics while maintaining performance and clarity.
