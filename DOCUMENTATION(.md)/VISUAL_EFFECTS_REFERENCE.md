# Synergy Visuals — Visual Reference Guide

## 🎨 Visual Hierarchy

```
SYNERGY ≥ 0.85 (AWAKENED)
├─ Particles: BRIGHT CYAN flowing fast
├─ Link Color: Enhanced via base metric color
├─ Link Pulse: BRIGHT & RAPID (3 Hz, ×0.4 boost)
├─ Node Aura: Ready for amplification (foundation laid)
└─ Message: "POWERFUL SYNCHRONIZATION!"

SYNERGY 0.75-0.85 (STRONG)
├─ Particles: SOFT BLUE flowing slowly
├─ Link Color: Stable metric coloring
├─ Link Pulse: GENTLE & STEADY (0.5 Hz, ×0.1 boost)
├─ Node Aura: Stable (ready for gentle boost)
└─ Message: "Stable Connection"

SYNERGY < 0.75 (ACTIVE/LOW)
├─ Particles: NONE
├─ Link Color: Metric-based (corruption/harmony)
├─ Link Pulse: Metric pulse only
├─ Node Aura: Normal state
└─ Message: "Connection developing..."
```

---

## 🎬 Animation Timeline

### AWAKENED State (Per Cycle: 333ms)

```
Time:  0ms ════════════════════════════════════ 333ms
       │                                        │
Link  ╱─────╲ (pulse: 0 → 1 → 0)               ╱─────╲
      │start │ bright       emissive boost     │ repeat
      │cyan  │ 0.4×         dims to 0           │
      └──────┘                                  └──────┘
       │      │             │
Glow:  dim   bright        dim  (matches link pulse)
```

**Frequency**: 3 cycles per second = 3 Hz
**Appearance**: Rapid, energetic pulsing
**Intensity**: Bright (0.4 additional boost to base)

### STRONG State (Per Cycle: 2000ms)

```
Time:  0ms ═════════════════════════════════════════════ 2000ms
       │                                                  │
Link  ╱────────────╲ (pulse: 0 → 1 → 0)                 ╱────────────╲
      │soft        │ steady        emissive boost       │ repeat
      │blue        │ 0.1×          dims to 0             │
      └────────────┘                                     └────────────┘
       │           │                 │
Glow:  dim       gentle             dim  (matches link pulse)
```

**Frequency**: 0.5 cycles per second = gentle rhythm
**Appearance**: Calm, steady pulsing
**Intensity**: Subtle (0.1 additional boost to base)

---

## 🌊 Particle Flow Visualization

### AWAKENED: Fast Cyan Flow

```
Source Node ━━━━━━━━━━━━━━━━━━━ Target Node
(cyan particles traveling at 0.15 speed/frame)

Frame 1:  ●  ●  ●  ●  ●  ●  ●
Frame 2:   ●  ●  ●  ●  ●  ●  ●
Frame 3:    ●  ●  ●  ●  ●  ●  ●
...
Result: "Stream" effect — continuous flow visible
```

**Particle Count**: 7 active
**Speed**: 0.15 per frame (100 frames ≈ 1.67 seconds curve traverse)
**Spawn Rate**: New particle every 0.3 time units
**Color**: Bright cyan (0x00ffff)
**Opacity**: 0.9 (nearly opaque)
**Size**: 0.12 units

### STRONG: Slow Blue Flow

```
Source Node ——·——·——·——·——·—— Target Node
(blue particles traveling at 0.05 speed/frame)

Frame 1:  ·
Frame 2:   ·
Frame 3:    ·
...
Result: "Dots" effect — discrete markers visible
```

**Particle Count**: 2 active
**Speed**: 0.05 per frame (300 frames ≈ 5 seconds curve traverse)
**Spawn Rate**: New particle every 0.8 time units
**Color**: Softer blue (0x0088ff)
**Opacity**: 0.6 (semi-transparent)
**Size**: 0.08 units

---

## 🔄 Particle Lifecycle

### For AWAKENED Particles

```
Creation
   │
   ├─ Position: Random along curve (staggered)
   ├─ Color: Bright cyan (0x00ffff)
   ├─ Opacity: 0.9
   ├─ Size: 0.12
   └─ Speed: +0.15/frame
        │
        ├─ Moves along curve
        ├─ Trail recorded (optional visualization)
        ├─ Emissive: Same as link
        │
        └─ Reaches curve end
             │
             └─ Removed by updateParticles()
                  │
                  └─ Geometry disposed
                  └─ Material disposed
                  └─ Mesh removed from scene
```

**Total Journey**: ~100 frames at 60 FPS ≈ 1.67 seconds

### For STRONG Particles

```
Creation
   │
   ├─ Position: Random along curve (staggered)
   ├─ Color: Softer blue (0x0088ff)
   ├─ Opacity: 0.6
   ├─ Size: 0.08
   └─ Speed: +0.05/frame
        │
        ├─ Moves along curve (slower)
        ├─ Trail recorded (optional visualization)
        ├─ Emissive: Same as link
        │
        └─ Reaches curve end
             │
             └─ Removed by updateParticles()
```

**Total Journey**: ~300 frames at 60 FPS ≈ 5 seconds

---

## 📊 Emissive Intensity Curve

### AWAKENED Pulsing (3 Hz)

```
Intensity
    │     ╱╲    ╱╲    ╱╲
 +0.4│    ╱  ╲  ╱  ╲  ╱  ╲
    │   ╱    ╲╱    ╲╱    ╲
    │  ╱                   ╲
 +0.2│ ╱ (baseline pulse)   ╲
    │╱________________________╲
    └────────────────────────────── Time (seconds)
    0  0.33  0.67  1.0   1.33

Formula: intensity = pulse.intensity + (sin(time * 3.0) * 0.5 + 0.5) * 0.4
Range: pulse.base + (0 to 0.4 additional)
```

### STRONG Pulsing (0.5 Hz)

```
Intensity
    │         ╱╲
 +0.1│       ╱  ╲         ╱╲
    │      ╱    ╲       ╱  ╲
    │     ╱      ╲     ╱    ╲
 +0.05│   ╱       ╲   ╱      ╲
    │__╱__________╲_╱__________╲__
    └────────────────────────────── Time (seconds)
    0   1.0   2.0   3.0   4.0

Formula: intensity = pulse.intensity + (sin(time * 0.5) * 0.5 + 0.5) * 0.1
Range: pulse.base + (0 to 0.1 additional)
```

---

## 🎨 Color Palette

| State | Particle Color | RGB | Hex | Link Pulse |
|-------|----------------|-----|-----|-----------|
| AWAKENED | Bright Cyan | (0, 255, 255) | 0x00ffff | Bright boost |
| STRONG | Softer Blue | (0, 136, 255) | 0x0088ff | Gentle boost |

---

## 🔊 Visual "Volume"

Think of synergy visibility as having different "volumes":

```
MUTED (synergy < 0.75)
  └─ No particles
  └─ Link pulse only (metric-based)
  └─ Visual: Quiet

QUIET (0.75 ≤ synergy < 0.85)
  └─ 2 blue dots flowing slowly
  └─ Gentle pulsing (0.5 Hz)
  └─ Visual: Subtle whisper

LOUD (synergy ≥ 0.85)
  └─ 7 cyan particles flowing fast
  └─ Fast pulsing (3 Hz)
  └─ Visual: Energetic rhythm
```

---

## 🎭 Transactional Effects

### When Synergy INCREASES to AWAKENED

```
Frame N:   STRONG (soft blue, 0.5 Hz)
Frame N+1: TRANSITION
  - Old STRONG particles continue (fade naturally)
  - New AWAKENED particles start spawning
  - Pulse frequency speeds up (0.5 Hz → 3 Hz)
  - Intensity boost increases (0.1 → 0.4)
Frame N+5: FULL AWAKENED (bright cyan, 3 Hz)
  - Old particles all gone
  - New particles dominant
  - Full visual effect
```

**Appearance**: Smooth acceleration, no pops

### When Synergy DECREASES from AWAKENED

```
Frame N:   AWAKENED (bright cyan, 3 Hz)
Frame N+1: TRANSITION
  - Old AWAKENED particles continue (fade naturally)
  - New STRONG particles start spawning (slower)
  - Pulse frequency slows (3 Hz → 0.5 Hz)
  - Intensity boost decreases (0.4 → 0.1)
Frame N+10: FULL STRONG (soft blue, 0.5 Hz)
  - Old particles all gone
  - New particles dominant
  - Gentle visual effect
```

**Appearance**: Smooth deceleration, no pops

---

## 📐 Particle Geometry

```
SphereGeometry:
  - Radius: 0.12 (AWAKENED) or 0.08 (STRONG)
  - WidthSegments: 4 (low-poly for performance)
  - HeightSegments: 4
  - Result: Faceted sphere (performance efficient)
  
Material:
  - Type: MeshBasicMaterial (fast)
  - Color: 0x00ffff or 0x0088ff
  - Transparent: true
  - Opacity: 0.9 or 0.6
  - Fog: false (no fog rendering)
```

---

## 🎯 Target Visual Feel

**AWAKENED**: 
- Like electricity flowing between nodes
- Energy crackling along connections
- Powerful synchronization visible
- Player feels: "This connection is ALIVE!"

**STRONG**:
- Like data flowing steadily
- Calm, reliable transmission
- Stable partnership
- Player feels: "This connection is stable"

---

## 🔧 Customization Points

If you want to adjust the visuals:

```javascript
// In _createSynergyFlowParticles():

// AWAKENED config
const flowConfig = {
  color: new THREE.Color(0x00ffff),  // ← Change color
  speed: 0.15,                        // ← Increase for faster flow
  count: 7,                           // ← Add more particles
  size: 0.12,                         // ← Make bigger
  opacity: 0.9,                       // ← Make more/less transparent
  frequency: 0.3                      // ← Spawn more/less often
};

// In _computeSynergyPulse():

frequency = 3.0;    // ← Hz (slower = fewer cycles per second)
boostAmount = 0.4;  // ← Max intensity boost
```

---

## ✨ Polish Details

- **Staggered spawning**: Particles don't all spawn at once → flowing stream
- **Natural cleanup**: Particles die when reaching end → no pop-out
- **Smooth sine waves**: Pulsing follows smooth curves → not robotic
- **Color consistency**: Particle color matches link base → visual unity
- **No z-fighting**: Particles positioned along curve → no clipping

