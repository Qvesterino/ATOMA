# Session 118: Visual Reference & Effects Guide

## Visual Storytelling: Cascade → Particle Emission

### What Players See

#### 1. Cascade Spawning
```
Timeline: T=0 to T=0.5s
Location: High-conflict region (2+ hubs competing)

[Conflict Hub A] ──→ [Conflict Hub B]
      ✦ sparkle effect
      Cascades begin spawning every 0.5s
      from conflict center
```

#### 2. Cascade Propagation (Radial)
```
Timeline: T=0 to T=4s
Expansion: 8 units/sec radial + 6 hops topological

     0.5s later:
         ⭕        (ring of increased particle density)
       ⊕   ⊕      (affected links glowing)
      ⊕     ⊕     (particles emitting at 1.5x rate)

     1.5s later:
           ⭕     (expanding further)
         ⊕ ⊕ ⊕    (more links affected)
        ⊕   ⊕ ⊕   (emission boost now at peak ~2.0-2.5x)

     4.0s later:
             ⭕   (fading away)
           ⊕ ⊕ ⊕ (final particles trickling)
          ⊕ ⊕ ⊕ ⊕ (emission back to normal 1.0x)
```

#### 3. Particle Emission Boost Visualization

##### Low Cascade (intensity 0.25)
```
Link visual state:
  Base particles: ·······
  Cascade boost:  ········ (1.06x)
  
Visual effect: Almost imperceptible increase
Frequency:     2 Hz oscillation (very subtle)
```

##### Medium Cascade (intensity 0.5)
```
Link visual state:
  Base particles: ·······
  Cascade boost:  ···········  (1.25x)
  
Visual effect: Noticeably more particle density
Frequency:     5 Hz oscillation (visible pulsing)
Burst pattern:  ∿∿∿∿∿ (ripple)
```

##### High Cascade (intensity 0.75)
```
Link visual state:
  Base particles: ·······
  Cascade boost:  ················  (1.56x)
  
Visual effect: Dense particle stream, obvious visual change
Frequency:     8 Hz oscillation (clearly rhythmic)
Burst pattern:  ≈≈≈≈≈ (strong waves)
```

##### Maximum Cascade (intensity 1.0)
```
Link visual state:
  Base particles: ·······
  Cascade boost:  ······················  (3.0x!)
  
Visual effect: INTENSE particle burst, unmistakable
Frequency:     10 Hz oscillation (rapid pulsing)
Burst pattern:  ∿∿∿∿∿∿ (powerful waves)
Duration:       4 seconds then fades
```

---

## Real-Time Visual Examples

### Scenario 1: Single Cascade in Hub Cluster
```
Initial state:
  Hub-A (QNT)  ←→  Hub-B (ORB)  ←→  Hub-C (SYN)
  Normal particles

Cascade spawns at Hub-A/Hub-B conflict (intensity 0.6):
  
  T=0s: Cascade born
    Hub-A ───✦→ Hub-B ───✦→ Hub-C
    
  T=1s: Cascade expands radially + topologically
    ⊙ Hub-A (intense 0.6x)
   ╱ ╲ 
  ⊙   ⊙ Hub-B (moderate 0.4x)
       ╲
        ⊙ Hub-C (fading 0.2x)

  T=2s: Peak visual effect
    All links glowing with particles
    Emission: 1.36x, 1.16x, 1.04x respectively

  T=4s: Fading away
    Cascade dissipating
    Particles returning to normal

  T=4.5s: Complete
    Normal state resumed
```

### Scenario 2: Overlapping Cascades (Interference)
```
Two cascades from different conflicts:

Cascade-1 (from Hub-A/B): intensity 0.6
Cascade-2 (from Hub-C/D): intensity 0.5

Timeline:
  T=0s:    Cascade-1 spawns
  T=0.7s:  Cascade-2 spawns (offset)
  
  T=1.5s:  INTERFERENCE ZONE
  ┌─────────────────┐
  │   Cascade-1     │
  │      ⊙ ⊙ ⊙      │
  │     ⊙   ⊙ ⊙     │
  │    ├─ ZONE ─┤   │
  │     ⊙   ⊙ ⊙     │  ← Overlapping region
  │      ⊙ ⊙ ⊙      │
  │   Cascade-2     │
  └─────────────────┘
  
  Effect: Heterodyne-like frequency beats
  Particle pulses at: |f₁ - f₂| = |8Hz - 7Hz| = 1Hz
  Visual: "Shimmer" pattern in overlap zone

  T=4.0s: First cascade fades
  T=4.7s: Second cascade fades
  T=5.0s: Normal
```

### Scenario 3: Sustained Conflict (Multiple Cascades)
```
High conflict zone (Hub-A vs Hub-B, intensity > 0.3):

Cascades spawn every 0.5s:

  T=0s:    Cascade-1 ✦ (0s old, intensity 1.0)
  T=0.5s:  Cascade-1 (0.5s old, intensity 0.875)
           Cascade-2 ✦ (0s old, intensity 1.0)  ← Fresh spawn
  T=1.0s:  Cascade-1 (1.0s old, intensity 0.75)
           Cascade-2 (0.5s old, intensity 0.875)
           Cascade-3 ✦ (0s old, intensity 1.0)
  T=1.5s:  Cascade-1 (1.5s old, intensity 0.625)
           Cascade-2 (1.0s old, intensity 0.75)
           Cascade-3 (0.5s old, intensity 0.875)
           Cascade-4 ✦ (0s old, intensity 1.0)
  ...

  Visual result: CONTINUOUS particle activity
  Links never stop glowing
  Emission: Always 1.4-3.0x range
  Effect: Network appears "alive" and stressed
  Message: Conflict is ongoing, unresolved
```

---

## Particle Emission Multiplier Scale

### Graphical Scale
```
3.0x ║████████████████ Intense burst (max conflict)
2.8x ║███████████████  Strong pulse
2.5x ║████████████     High activity
2.0x ║██████████       Notable effect
1.5x ║████████         Moderate increase
1.25x║██████           Subtle effect
1.0x ║████             Normal (no cascade)
0.75x║                 Fading cascade
0.5x ║                 Near-zero effect
```

### Perceptual Thresholds
```
Multiplier  | Perceptual Change
------------|------------------
1.0-1.05    | Imperceptible
1.05-1.15   | Subtle (attentive players notice)
1.15-1.5    | Noticeable (obvious to most)
1.5-2.5     | Very obvious (cannot miss)
2.5-3.0     | Unmissable (dramatic visual change)
```

---

## Burst Modulation Oscillation

### Frequency Response
```
Cascade Intensity    Oscillation Frequency    Period
─────────────────────────────────────────────────────
0.0 (no cascade)     2.0 Hz                   500ms
0.25                 3.75 Hz                  267ms
0.5                  6.0 Hz                   167ms
0.75                 8.25 Hz                  121ms
1.0 (max cascade)    10.0 Hz                  100ms
```

### Visual Pulsing Pattern
```
Low intensity (2 Hz):
  ▁▂▃▂▁▂▃▂▁ (slow breathing)
  Observable as gentle pulsing

Medium intensity (6 Hz):
  ▂▃▂▁▂▃▂▁▂ (moderate rhythm)
  Clear visual oscillation

High intensity (10 Hz):
  ▂▃▂▁▂▃▂▁▂ (rapid vibration)
  Appears as shimmer/flicker
```

### Modulation Depth (±20%)
```
Base multiplier: 2.0x
Modulation:      ±(2.0 × 0.2) = ±0.4x
Min:             1.6x
Max:             2.4x

Effective range: 1.6x to 2.4x
Visual effect:   Pulsing variation, ~20% amplitude
```

---

## Network-Level Visual Effects

### Conflict Hot Spots
```
Visual signature: Intense glowing clusters
Intensity range:  2.0-3.0x particle emission
Spatial extent:   5-15 unit radius
Duration:         Sustained (multiple cascades)
Message:          "Network stress here"

Appearance:
  ─┬─ High-traffic region
   │ 
   ├─◎ (glowing hub, intense particles)
   ├─◎ 
   ├─◎ 
   │
   └─ (dimmer region, fading cascade)
```

### Cascade Fronts (Wave-Like)
```
Visual signature: Moving bands of high intensity
Intensity range:  1.5-3.0x (gradient)
Speed:            8 units/sec radial + 6 hops topo
Pattern:          Expanding rings
Duration:         4 seconds per cascade

Animation:
  Frame 0: ⭕ (origin)
  Frame 1:  ⭕  (expanded)
  Frame 2:   ⭕   (further)
  Frame 3:    ⭕    (peak)
  Frame 4:     ⭕     (dissipating)
```

### Interference Shimmer (Overlapping Cascades)
```
Visual signature: Complex pulsing in overlap zone
Pattern:          Heterodyne beats (f₁ - f₂)
Intensity range:  1.5-2.8x (variable beat)
Frequency:        0.5-2 Hz beat frequency
Message:          "Competing cascades, complex dynamics"

Appearance:
  ┌─────────────────┐
  │  Cascade A      │
  │    ◎  ◎         │
  │   ◎    ◎ ✨✨✨  │ ← Shimmer zone (beat interference)
  │    ◎  ◎ ✨✨✨   │
  │      Cascade B  │
  └─────────────────┘
```

### Calm Network (No Cascades)
```
Visual signature: Minimal particle activity
Emission rate:    1.0x baseline
Color:            Normal link colors
Pattern:          Steady, no pulsing
Message:          "Network at rest, no conflicts"

Appearance:
  ◎─────◎ (steady glow, calm)
  │     │
  ◎─────◎ (balanced, stable)
```

---

## Performance Visual Indicators

### When System Is Performing Well
- Smooth particle animation (60fps)
- No stuttering during cascade generation
- Particles emit/fade smoothly
- Pulsing rhythms are regular and smooth

### When Performance Degrades
- Particles stutter (frame drops)
- Cascade spawning lags
- Emission multiplier updates "jump" instead of smooth
- Pulsing becomes irregular

---

## Art Direction Notes

### Color Language (Future Enhancement)
```
Cascade Type        Ideal Particle Color    Current Color
────────────────────────────────────────────────────────
Destructive conflict  Orange-Red (🔴)        Link color
Harmony conflict      Cyan (🔵)               Link color
Growth cascade        Green (🟢)              Link color
Decay cascade         Purple (🟣)             Link color

→ Can extend cascadeParticleEmissionBoost to include color
  mapping in Session 119
```

### Particle Shape Language (Advanced)
```
Emission Multiplier  Suggested Shape    Current Shape
────────────────────────────────────────────────────
1.0x (normal)        Circle (●)          Point
1.5x (moderate)      Plus (+)            Point
2.0x (strong)        Star (✦)            Point
3.0x (intense)       Burst (✿)           Point

→ Can integrate with particle texture atlas for visual
  variety matching cascade intensity
```

---

## Player Communication Through Particles

### What Particles Tell Players

1. **"Cascade is happening"**
   - Particles increase suddenly
   - Links light up with activity
   - Message: "Something changed in the network"

2. **"Conflict is ongoing"**
   - Sustained high particle emission
   - Multiple cascades visible simultaneously
   - Message: "Network is under stress"

3. **"Cascades are overlapping"**
   - Complex pulsing patterns
   - Heterodyne shimmer effect
   - Message: "Multiple events interfering"

4. **"Cascade is ending"**
   - Particles fade gradually
   - Emission multiplier decreases
   - Message: "Conflict resolving, energy dissipating"

---

## Testing Checklist

- [ ] Cascade spawning produces particle increase
- [ ] Emission multiplier scales 1.0-3.0x smoothly
- [ ] Burst modulation creates visible pulsing
- [ ] Overlapping cascades show interference patterns
- [ ] Performance remains >55fps during intense cascades
- [ ] Particles fade smoothly as cascades end
- [ ] No visual stuttering or jumps
- [ ] Console API reports correct statistics
- [ ] Multiple cascades generate correctly
- [ ] System gracefully handles >400 links

---

*Session 118 | Visual Effects Reference | ATOMA Extended Development*
