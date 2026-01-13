# Streak Color Dynamics — Visual Reference

## Color State Matrix

### Harmony vs Specialization Grid

```
                     NEUTRAL (0)    EXCITATORY (+1)    INHIBITORY (-1)
┌─────────────────┬──────────────┬────────────────┬──────────────────┐
│ HARMONY  (1.0)  │  Bright Green│  Bright Orange│  Bright Cyan     │
│ Healthy         │  ✓✓✓✓✓       │  🔥🔥🔥🔥🔥    │  ❄️❄️❄️❄️❄️     │
├─────────────────┼──────────────┼────────────────┼──────────────────┤
│ HARMONY  (0.5)  │  Moderate G  │  Moderate Org │  Moderate Cyan   │
│ Fair            │  ✓✓✓         │  🔥🔥🔥        │  ❄️❄️❄️       │
├─────────────────┼──────────────┼────────────────┼──────────────────┤
│ HARMONY  (0.2)  │  Dim Green   │  Dim Orange   │  Dim Cyan        │
│ Poor            │  ✓           │  🔥            │  ❄️           │
├─────────────────┼──────────────┼────────────────┼──────────────────┤
│ HARMONY  (0.0)  │  Dark Gray   │  Dark Gray    │  Dark Gray       │
│ Dead            │  ✗✗✗✗✗       │  ✗✗✗✗✗         │  ✗✗✗✗✗      │
└─────────────────┴──────────────┴────────────────┴──────────────────┘

Legend:
  ✓ = Healthy glow
  🔥 = Excitatory (warming)
  ❄️ = Inhibitory (cooling)
  ✗ = Dead (no glow)
```

---

## Corruption Levels (At Various Harmonies)

```
HARMONY: 0.9 (Healthy) + Varying Corruption

Corruption 0.0:  ■■■■■■■■■■  Vivid, full glow
Corruption 0.2:  ■■■■■■■■░░  Mostly vivid, slight fade
Corruption 0.4:  ■■■■■■░░░░  Half saturation
Corruption 0.6:  ■■■░░░░░░░  Mostly washed
Corruption 0.8:  ■░░░░░░░░░  Nearly gray
Corruption 1.0:  ░░░░░░░░░░  Dead gray


HARMONY: 0.5 (Fair) + Varying Corruption

Corruption 0.0:  ■■■■■■■░░░  Moderate saturation
Corruption 0.2:  ■■■■■░░░░░  Reduced saturation
Corruption 0.4:  ■■■░░░░░░░  Low saturation
Corruption 0.6:  ■■░░░░░░░░  Very low
Corruption 0.8:  ■░░░░░░░░░  Barely colored
Corruption 1.0:  ░░░░░░░░░░  Complete gray
```

---

## Synergy Intensity (Brightness Modulation)

```
Low Synergy (0.0-0.2):
░░░░░░░░░░  Dim, almost invisible

Low-Mid Synergy (0.3-0.4):
■■■░░░░░░░  Dim but visible

Mid Synergy (0.5):
■■■■■░░░░░  Normal brightness

Mid-High Synergy (0.6-0.7):
■■■■■■■░░░  Bright

High Synergy (0.8-1.0):
■■■■■■■■■■  Very bright
```

---

## Hue Shift Examples

### Base Color: Green (0x00ff88)

```
Specialization: 0.0 (Neutral)
Base:    🟢 RGB(0, 255, 136)
Result:  🟢 RGB(0, 255, 136)  [No shift]


Specialization: +0.5 (Excitatory)
Base:    🟢 RGB(0, 255, 136)
Shift:   +0.075 hue
Result:  🟡 RGB(255, 200, 80)  [Warm orange-yellow]


Specialization: +1.0 (Maximum Excitatory)
Base:    🟢 RGB(0, 255, 136)
Shift:   +0.15 hue
Result:  🟠 RGB(255, 150, 50)  [Warm orange]


Specialization: -0.5 (Inhibitory)
Base:    🟢 RGB(0, 255, 136)
Shift:   -0.125 hue
Result:  🔵 RGB(50, 200, 255)  [Cool cyan]


Specialization: -1.0 (Maximum Inhibitory)
Base:    🟢 RGB(0, 255, 136)
Shift:   -0.25 hue
Result:  🔵 RGB(30, 150, 220)  [Deep cyan]
```

---

## Complete State Examples

### Example 1: Thriving Excitatory Link

```
┌─────────────────────────────────────┐
│ Link Status: HEALTHY & AMPLIFYING   │
├─────────────────────────────────────┤
│ Harmony:        0.95                │
│ Specialization: +0.8 (Excitatory)   │
│ Corruption:     0.0                 │
│ Synergy:        0.9                 │
├─────────────────────────────────────┤
│ Visual: BRIGHT VIBRANT ORANGE       │
│         🔥🔥🔥🔥🔥                   │
│                                     │
│ Appearance: Vivid orange glow,      │
│ strong luminosity, pure saturation  │
│ Interpretation: "This link is       │
│ working perfectly and amplifies     │
│ pulses with confidence"             │
└─────────────────────────────────────┘
```

### Example 2: Struggling Inhibitory Link

```
┌─────────────────────────────────────┐
│ Link Status: DEGRADED & SUPPRESSING │
├─────────────────────────────────────┤
│ Harmony:        0.4                 │
│ Specialization: -0.7 (Inhibitory)   │
│ Corruption:     0.5                 │
│ Synergy:        0.2                 │
├─────────────────────────────────────┤
│ Visual: DIM DESATURATED CYAN        │
│         ❄️░░❄️░░                    │
│                                     │
│ Appearance: Muted cyan, low glow,   │
│ partially desaturated               │
│ Interpretation: "This link is       │
│ failing but still tries to suppress │
│ pulses; corruption is visible"      │
└─────────────────────────────────────┘
```

### Example 3: Dead Neutral Link

```
┌─────────────────────────────────────┐
│ Link Status: FAILED & NEUTRAL       │
├─────────────────────────────────────┤
│ Harmony:        0.05                │
│ Specialization: 0.1 (Near-neutral)  │
│ Corruption:     0.95                │
│ Synergy:        0.0                 │
├─────────────────────────────────────┤
│ Visual: DARK GRAY, NO GLOW          │
│         ░░░░░░░░░░                  │
│                                     │
│ Appearance: Nearly invisible,       │
│ completely desaturated, no glow     │
│ Interpretation: "This link is       │
│ broken and non-functional"          │
└─────────────────────────────────────┘
```

### Example 4: Recovering Neutral Link

```
┌─────────────────────────────────────┐
│ Link Status: RECOVERING & BALANCED  │
├─────────────────────────────────────┤
│ Harmony:        0.65                │
│ Specialization: -0.05 (Neutral)     │
│ Corruption:     0.3                 │
│ Synergy:        0.5                 │
├─────────────────────────────────────┤
│ Visual: MODERATE GREEN, WARM GLOW   │
│         🟢🟢🟢🟢░░░░░░            │
│                                     │
│ Appearance: Natural green, moderate │
│ glow, slight corruption visible     │
│ Interpretation: "This link is       │
│ recovering; not specialized yet"    │
└─────────────────────────────────────┘
```

---

## Color Transition Visualization

### Specialization Shift (Over Time)

```
Time 0s   (Neutral):        🟢
Time 30s  (Slight excit):   🟢🟡
Time 60s  (Moderate excit): 🟡
Time 90s  (Strong excit):   🟠
Time 120s (Very excit):     🔴

Opposite direction (inhibitory):
Time 0s   (Neutral):        🟢
Time 30s  (Slight inhibit): 🟢🔵
Time 60s  (Moderate inhibit): 🔵
Time 90s  (Strong inhibit): 🔵
Time 120s (Very inhibit):   ➖
```

### Harmony Degradation (Over Time)

```
Time 0s   (Healthy):    ████████████
Time 30s  (Fair):       ████████░░░░
Time 60s  (Poor):       ████░░░░░░░░
Time 90s  (Critical):   ██░░░░░░░░░░
Time 120s (Dead):       ░░░░░░░░░░░░
```

### Corruption Building Up (Over Time)

```
Time 0s   (Clean):      ■■■■■■■■■■
Time 30s  (Slight):     ■■■■■■■■░░
Time 60s  (Moderate):   ■■■■■░░░░░
Time 90s  (Severe):     ■■░░░░░░░░
Time 120s (Critical):   ░░░░░░░░░░
```

---

## Network Color Palette (Recommended)

For consistent visual language across the network:

```
HEALTHY STATE:
  Neutral:    🟢 #00ff88  (Default green)
  Excitatory: 🟠 #ff8833  (Warm orange)
  Inhibitory: 🔵 #00aaff  (Cool cyan)

COMPROMISED STATE:
  Neutral:    🟡 #ffbb44  (Muddy yellow)
  Excitatory: 🟠 #dd6633  (Muted orange)
  Inhibitory: 🔷 #0088dd  (Muted blue)

DEAD STATE:
  All:        ⬜ #666666  (Gray)
  Critical:   ⬛ #333333  (Dark gray)
```

---

## Quick Recognition Guide

**Spot link status at a glance**:

```
BRIGHT VIVID COLORS       → Link is healthy
  Orange                    → Excitatory + healthy
  Cyan                      → Inhibitory + healthy
  Green                     → Neutral + healthy

MODERATE MUTED COLORS    → Link is stressed
  Muddy orange              → Excitatory + degrading
  Dull cyan                 → Inhibitory + degrading
  Dull green                → Neutral + degrading

DIM DESATURATED COLORS   → Link is failing
  Pale everything           → Heavily corrupted
  Nearly invisible          → Critical state

COMPLETELY GRAY          → Link is dead
  Just gray                 → Non-functional
  Almost black              → Irreversibly broken
```

---

## Implementation Guide for Artists

If customizing colors:

1. **Choose base color** (usually green for neutral)
2. **Define excitatory shift** (typically +15 to +25% hue rotation)
3. **Define inhibitory shift** (typically -20 to -30% hue rotation)
4. **Set harmony range** (0.3-1.0 brightness, 0.2-1.0 saturation)
5. **Apply corruption curve** (0.0-1.0 desaturation)
6. **Test combinations** (verify readability in-game)

---

## Accessibility Notes

Color meanings:

- ✓ Bright/Dim = Easily distinguishable by luminosity
- ✓ Saturated/Desaturated = Clear contrast
- ✓ Warm/Cool = Temperature differences noticeable
- ⚠️ Colorblind-friendly: Use brightness + saturation primarily, not hue alone

For colorblind users, ensure:
- Brightness differences are clear (0.3 to 1.0 range)
- Saturation differences are obvious (0.2 to 1.0 range)
- Don't rely solely on hue (excitatory orange vs inhibitory cyan)

---

*Colors tell stories. These streaks communicate link health, specialization, and corruption at a glance.*
