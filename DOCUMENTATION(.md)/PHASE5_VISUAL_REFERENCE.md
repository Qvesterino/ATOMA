# PHASE 5: Inter-Network Visuals — Quick Reference

## Visual Elements Overview

### Network Anchor (Per Network)

```
                    ✦ Point Light
                    │ (range: 50)
                    │
        ╔═══════════╬═══════════╗
        ║                       ║
      ┏━┫ Glow Sphere          ┃
      ║ ║ (r=3.5)              ┃
      ║ ║ (transparent)        ┃
      ║ ╚═══════════╬═══════════╛
      ║             │
      ║         ╔═══◆═══╗
      ║         ║ Core  ║
      ║         ║ Mesh  ║
      ║         ║(r=2)  ║
      ║         ╚═══════╝
      ║             │
      ┗━━ Pulsing  ━┛
      
Colors:
├─ Harmony   (corruption = 0%)   → Cyan #00ffff
├─ Balanced  (corruption = 50%)  → Teal #008888  
└─ Corrupted (corruption = 100%) → Red #ff4444
```

### Connection Cable (Between Networks)

```
    Network A (Anchor)
             │
             │ Corruption
             │ (0.8 = Red)
             │
    ╔════════O════════╗
    ║ Connection     ║
    ║ Cable          ║
    ║ Tube geometry  ║
    ║ radius=0.4     ║
    ╚════════O════════╝
             │
             ▼ Harmony
             │ (0.2 = Cyan)
    
    Network B (Anchor)

Cable thickness: Opacity × connection strength
Cable color:   Interpolated corruption state
Particles:     8 × strength (flowing along cable)
```

### Flow Particles Animation

```
Frame t=0.0                Frame t=0.5              Frame t=1.0
                                          
    Source ─────────────── Target   Source ────●────── Target  Source ──────────── Target
    Network A (●●●●●●●●●)  Network B   A (●●●●●●●●●●●) B  A (●●●●●●●●●)  B

Particle progression:
├─ Phase offset: (elapsed + particleIndex / count) % 2
├─ Position:    Lerp(source, target, t) where t = phase / 2
├─ Speed:       flowSpeed × 2.0 units/second (configurable)
└─ Count:       8 × connection.strength

Color:        Same as cable (corruption/harmony interpolated)
Size:         0.8 points (sizeAttenuation = true)
Opacity:      0.8 base intensity
```

## Color Spectrum

```
Pure      Mostly       Balanced        Mostly      Pure
Harmony   Harmony                      Corrupted   Corruption
  │         │            │              │           │
  0%        25%           50%            75%        100%
  │         │            │              │           │
  ◼─────────◼─────────────◼──────────────◼─────────◼
  
#00ffff   #00ccaa    #008888     #ff8844    #ff4444
Cyan     Light Teal   Teal      Orange      Red

Animated interpretation:
• Corruption = 0.0 → Pure cyan glow + slow pulse (2 Hz)
• Corruption = 0.5 → Teal glow + medium pulse (4 Hz)  
• Corruption = 1.0 → Pure red glow + fast pulse (6 Hz)
```

## Animation Cycles

### Anchor Pulsing

```
Pulse intensity over 2 seconds (at corruption=0.5):

Intensity │     
   0.8    │    ╱╲      ╱╲
   0.6    │   ╱  ╲    ╱  ╲
   0.4    │  ╱    ╲  ╱    ╲
   0.2    │ ╱      ╲╱      ╲
   0.0    └─────────────────────
          0    0.5    1.0   1.5   2.0 seconds

Calculation:
pulse = Math.sin(elapsed × pulseSpeed) × 0.5 + 0.5
pulseSpeed = 2 + corruption × 2  (0.0 = 2 Hz, 1.0 = 4 Hz)
glowOpacity = 0.2 + pulse × (0.4 × pulseIntensity)
```

### Flow Particle Motion

```
Time progression (single particle):

Position X axis (left to right):

t=0.0  ◆─────────────────────────────────────  ✦
       │                                       │
       Source                               Target
       Network A                            Network B
       
t=0.25 ────────◆─────────────────────────────── ✦
       
t=0.5  ──────────────────◆────────────────────── ✦
       
t=0.75 ─────────────────────────────◆──────────── ✦
       
t=1.0  ◆─────────────────────────────────────  ✦
       (Wraps back to start)

Particles emit continuously, creating the illusion
of continuous flow along the connection.
```

## State Indicators

### Network Health at a Glance

```
Anchor State                 What It Means
═════════════════════════════════════════════════════
Bright cyan, slow pulse    ✓ Healthy network
                           • Low corruption (0-25%)
                           • High harmony levels
                           
Teal, medium pulse        ⊕ Balanced network
                          • Moderate corruption (40-60%)
                          • Active corruption spread
                          
Orange-red, fast pulse    ✗ Corrupted network
                          • High corruption (75-100%)
                          • Cascade risk

Dim/fading                ⊘ Distant network
                          • Beyond fade start (80 units)
                          • Still visible but dimmed
```

### Cable State Indicators

```
Cable Appearance         Meaning
═════════════════════════════════════════════════════
Thin cyan cable       ✓ Weak harmony connection
Thick cyan cable      ✓ Strong harmony connection
Thin red cable        ✗ Weak corruption spread
Thick red cable       ✗ Strong corruption spread
Teal cable            ⊕ Balanced transfer
No particles          ○ No active transfer
Many fast particles   ✗ High corruption transfer
Many slow particles   ✓ High harmony transfer
```

## Performance Metrics

### Frame Time Budget (60 FPS = 16.67 ms)

```
Total animation budget:     │████░░░░░░░░░░░░░░│ 16.67 ms

PHASE 5 breakdown:
  Orchestrator update:      │██░░░░░░░│ 1.0 ms
  Corruption bridge:        │████░░░░░│ 2.0 ms
  Synchronization:          │█░░░░░░░░│ 0.5 ms
  ─────────────────────────────────────
  Subtotal PHASE 5:         │███████░░│ 3.5 ms (21%)

  Visualization update:     │████░░░░░│ 2.0 ms
  Visualization render:     │██░░░░░░░│ 1.0 ms
  ─────────────────────────────────────
  Subtotal PHASE 5 visuals: │██░░░░░░░│ 3.0 ms (18%)

Remaining for other systems: │████████░│ 10.2 ms (61%)
```

## Layout Examples

### Single Network (Default)

```
View from above:

               ┌──────────────────┐
               │                  │
               │    Network A     │
               │    (Anchor)      │
               │       ✦          │
               │                  │
               └──────────────────┘
               
Center origin, visible from camera
```

### Two Networks (Close Connection)

```
View from above:

    ┌──────────────────┐       ┌──────────────────┐
    │                  │       │                  │
    │   Network A      │───────│   Network B      │
    │      ✦           │ Cable │        ✦         │
    │  Cyan glow       │       │   Red glow       │
    │                  │       │                  │
    └──────────────────┘       └──────────────────┘
    
    Particle flow: A → B (corruption transfer)
```

### Three Networks (Triangle)

```
View from above:

              ┌──────────────┐
              │  Network A   │
              │      ✦       │
              └──────┬───────┘
                  ╱ │ ╲
                ╱   │   ╲
              ╱     │     ╲
            ╱       │       ╲
          ✦         │         ✦
      Network B ────●──── Network C
    (Cyan flow)   (center) (Red flow)

Three interconnected networks with bidirectional
corruption/harmony flow.
```

## Interaction Examples

### Creating a Connection Visually

```
Step 1: Networks initialized
═══════════════════════════════════════════════════
Two isolated anchors appear in scene
Each with own color (based on health)
No cables visible


Step 2: Connection registered
═══════════════════════════════════════════════════
orchestrator.connectNetworks('A', 'B', 0.7)
         ↓
Immediately: Cable appears between anchors
Animation: Tube geometry created with 32-segment curve
Particles: 8 × 0.7 = ~5-6 particles spawn


Step 3: Corruption spreads
═══════════════════════════════════════════════════
Over time: Cable color shifts (depends on transfer)
Particles: Flow speeds up if corruption increasing
Anchors: Pulsing intensifies as corruption spreads
```

## Customization Reference

### Common Tweaks

| Want | Parameter | Default → Value |
|------|-----------|-----------------|
| Faster particles | `flowSpeed` | 2.0 → 4.0 |
| Bigger glows | `anchorGlowRadius` | 3.5 → 6.0 |
| Thicker cables | `cableRadius` | 0.4 → 0.8 |
| Fewer cables visible | `maxConnections` | 20 → 5 |
| Smoother updates | `updateFrequency` | 32 → 16 |
| Higher contrast | `flowIntensity` | 0.8 → 1.0 |
| Dimmer effect | `anchorOpacity` | 0.7 → 0.4 |

---

## Debug Visualization

```javascript
// Log real-time stats
setInterval(() => {
  console.clear();
  const stats = PHASE5_InterNetworkConnectionVisuals_API.getStats();
  console.log(`
    Anchors:     ${stats.anchorsRendered}
    Connections: ${stats.connectionsRendered}
    Update ms:   ${stats.updateDuration.toFixed(2)}
    Memory:      ${(stats.totalMemory / 1024).toFixed(1)} KB
  `);
}, 500);
```

---

## End Reference

This visual system transforms abstract multi-network data into intuitive 3D indicators showing corruption spread and harmony flow between networks in real-time.
