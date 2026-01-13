# LinkGlowSynergyEngine1_0 — Visual Reference Guide

Complete visual specifications for how synergy scores transform link appearance.

---

## Visual Spectrum

### Color Progression by Score

```
Score: 0.0                           0.5                           1.0
       |                             |                             |
       v                             v                             v
     ▓▓▓▓                         ▓▓▓▓▓                         ▓▓▓▓▓
     ░░░░ Desaturated Cyan       ░░░░░ Aqua                    ░░░░░ White-Hot
     #4daaff                      #4dffd2                       #ffffff
     (Low)                        (Medium)                      (Critical)
     
    RGB: 77,170,255             RGB: 77,255,210                RGB: 255,255,255
    Perception: Dim             Perception: Bright             Perception: Max
    Glow: Subtle                Glow: Visible                  Glow: Intense
    
    ────────────────────────────────────────────────────────────────
    Tier: LOW                   MEDIUM        HIGH              CRITICAL
    ────────────────────────────────────────────────────────────────
    Range: 0.0-0.4              0.4-0.65      0.65-0.85         0.85-1.0
```

---

## Glow Intensity Curve

### Visual Representation

```
Intensity
    ▲
  1.5│                                                      ●
    │                                              ╱
  1.3│                                         ╱
    │                                    ╱
  1.0│                              ●╱
    │                         ╱
  0.8│                   ╱
    │              ╱
  0.5│         ╱
    │    ╱
  0.3│●
    │
    └─────────────────────────────────────────────────▶
      0.0  0.25  0.5  0.75  1.0
      Synergy Score

Formula: intensity = 0.1 + (1.5 - 0.1) × score
                   = 0.1 + 1.4 × score

Key Points:
- At 0.0:  intensity = 0.1  (very dim)
- At 0.5:  intensity = 0.8  (medium)
- At 1.0:  intensity = 1.5  (very bright)
```

### Visual Effect by Intensity

```
Intensity 0.1  →  Link barely visible, subtle glow
Intensity 0.5  →  Link noticeably dim, light glow
Intensity 0.8  →  Link clearly visible, medium glow
Intensity 1.2  →  Link bright, strong glow
Intensity 1.5  →  Link extremely bright, intense glow
```

---

## Line Width Curve

### Visual Representation

```
Width (pixels)
    ▲
  4.0│                                                      ●
    │                                              ╱
  3.5│                                         ╱
    │                                    ╱
  3.0│                              ●╱
    │                         ╱
  2.0│                   ╱
    │              ╱
  1.5│         ╱
    │    ╱
  0.5│●
    │
    └─────────────────────────────────────────────────▶
      0.0  0.25  0.5  0.75  1.0
      Synergy Score

Formula: width = 0.5 + (4.0 - 0.5) × score
               = 0.5 + 3.5 × score

Key Points:
- At 0.0:  width = 0.5   (very thin)
- At 0.5:  width = 2.25  (medium)
- At 1.0:  width = 4.0   (very thick)
```

### Visual Effect by Width

```
Width 0.5  →  Hairline connection, barely visible
Width 1.5  →  Thin line, subtle
Width 2.25 →  Medium line, clearly visible
Width 3.5  →  Thick line, prominent
Width 4.0  →  Very thick line, dominant
```

---

## Pulse Speed Curve

### Visual Representation

```
Speed (cycles/sec)
    ▲
  2.5│                                                      ●
    │                                              ╱
  2.0│                                         ╱
    │                                    ╱
  1.5│                              ●╱
    │                         ╱
  1.0│                   ╱
    │              ╱
  0.5│         ╱
    │    ╱
  0.2│●
    │
    └─────────────────────────────────────────────────▶
      0.0  0.25  0.5  0.75  1.0
      Synergy Score

Formula: speed = 0.2 + (2.5 - 0.2) × score
               = 0.2 + 2.3 × score

Key Points:
- At 0.0:  speed = 0.2   (very slow, barely perceptible)
- At 0.5:  speed = 1.35  (moderate pulse)
- At 1.0:  speed = 2.5   (fast, energetic pulse)
```

### Visual Effect by Speed

```
Speed 0.2  →  Slow, subtle pulse (1/5 cycles/sec)
Speed 0.5  →  Gentle pulse (1/2 cycles/sec)
Speed 1.35 →  Moderate pulse (1.35 cycles/sec)
Speed 2.0  →  Fast pulse (2 cycles/sec)
Speed 2.5  →  Very fast pulse (2.5 cycles/sec)
```

---

## Emissive Boost Curve

### Visual Representation

```
Emissive (intensity)
    ▲
  1.0│                                                      ●
    │                                              ╱
  0.8│                                         ╱
    │                                    ╱
  0.6│                              ●╱
    │                         ╱
  0.4│                   ╱
    │              ╱
  0.2│●
    │
    └─────────────────────────────────────────────────▶
      0.0  0.25  0.5  0.75  1.0
      Synergy Score

Formula: emissive = 0.2 + (1.0 - 0.2) × score
                  = 0.2 + 0.8 × score

Key Points:
- At 0.0:  emissive = 0.2  (subtle emissive)
- At 0.5:  emissive = 0.6  (medium glow)
- At 1.0:  emissive = 1.0  (full brightness)
```

### Visual Effect by Emissive

```
Emissive 0.2 → Dim glow, material barely self-lit
Emissive 0.4 → Light glow, noticeable self-illumination
Emissive 0.6 → Medium glow, bright self-lit
Emissive 0.8 → Strong glow, very bright
Emissive 1.0 → Maximum glow, brightest possible
```

---

## Bloom Overdrive Effect

### Trigger Condition

```
Score: 0.0 ──→ 0.50 ──→ 0.75 ──→ 0.85 ──→ 1.0
       │                         │       │
       │                         │       └── BLOOM OVERDRIVE TRIGGERED
       │                         │
       └─ No Bloom              └─ No Bloom (yet)

Bloom Overdrive: Enabled when score > 0.85
Visual Effect: White-hot core with enhanced bloom halo
Color Lock: #ffffff (pure white)
```

### Visual Effect Progression

```
Score 0.0–0.85: Normal glow
  └─ Color varies with score (cyan → aqua → green)
  └─ Glow increases smoothly
  └─ No special effects

Score 0.85–1.0: Bloom Overdrive
  └─ Color locked to white (#ffffff)
  └─ Extremely bright core
  └─ Enhanced bloom halo
  └─ Maximum intensity effects
```

---

## Material Updates by Component

### Core Line

```
At Score 0.3:
  └─ Color: #4daaff (cyan)
  └─ Opacity: 0.32
  └─ Emissive: #4daaff
  └─ Width: 1.55

At Score 0.7:
  └─ Color: #00ffbf (green)
  └─ Opacity: 0.98
  └─ Emissive: #00ffbf
  └─ Width: 2.95

At Score 0.95:
  └─ Color: #ffffff (white)
  └─ Opacity: 1.43
  └─ Emissive: #ffffff
  └─ Width: 3.83
```

### Glow Layers (midGlow, halo, bloom)

```
All glow layers follow same opacity curve:

Score 0.0 → Opacity 0.1  (very faint glow)
Score 0.5 → Opacity 0.8  (visible glow)
Score 1.0 → Opacity 1.5  (intense glow)

Color updates:
  - Score 0.0–0.4:   Cyan (#4daaff)
  - Score 0.4–0.65:  Aqua (#4dffd2)
  - Score 0.65–0.85: Green (#00ffbf)
  - Score 0.85–1.0:  White (#ffffff)
```

### Veins & Particles

```
Opacity follows main intensity curve

Color follows progression curve:
  Cyan → Aqua → Green → White

Animation Speed:
  Score 0.0 → Speed 0.2  (slow)
  Score 0.5 → Speed 1.35 (moderate)
  Score 1.0 → Speed 2.5  (fast)

Result: Veins and particles pulse faster at higher scores
```

---

## Complete Visual Example

### Low Synergy (Score = 0.3)

```
Appearance:
  ┌─────────────────────────────┐
  │ Link Color: Cyan (#4daaff)  │
  │ Glow Intensity: 0.32        │
  │ Line Width: 1.55px          │
  │ Pulse Speed: 0.49 cycles/s  │
  │ Emissive: 0.36              │
  └─────────────────────────────┘

Visual Effect:
  - Dim blue-cyan line
  - Subtle glow around connection
  - Slow, barely-noticeable pulse
  - Low importance indicated
```

### Medium Synergy (Score = 0.65)

```
Appearance:
  ┌──────────────────────────────┐
  │ Link Color: Green (#00ffbf)  │
  │ Glow Intensity: 0.81         │
  │ Line Width: 2.78px           │
  │ Pulse Speed: 1.69 cycles/s   │
  │ Emissive: 0.72               │
  └──────────────────────────────┘

Visual Effect:
  - Bright neon-green line
  - Clear, visible glow
  - Moderate pulse animation
  - Good quality connection indicated
```

### High Synergy (Score = 0.9)

```
Appearance:
  ┌──────────────────────────────┐
  │ Link Color: White (#ffffff)  │
  │ Glow Intensity: 1.36         │
  │ Line Width: 3.65px           │
  │ Pulse Speed: 2.27 cycles/s   │
  │ Emissive: 0.92               │
  │ Bloom Overdrive: ACTIVE      │
  └──────────────────────────────┘

Visual Effect:
  - Bright white line
  - Intense glow halo
  - Fast, energetic pulse
  - Enhanced bloom effect
  - Excellent quality indicated
```

---

## Animation Frame-by-Frame

### Pulse Animation at Different Scores

```
Low Score (0.2):
  Frame 0:  ░░░░    (dim)
  Frame 1:  ░░░░    (dim)
  Frame 2:  ░░░░░   (slightly brighter)
  Frame 3:  ░░░░    (dim)
  Cycle time: ~5 seconds

Medium Score (0.5):
  Frame 0:  ░░░░░   (medium)
  Frame 1:  ░░░░░░  (brighter)
  Frame 2:  ░░░░░░░ (brightest)
  Frame 3:  ░░░░░░  (brighter)
  Frame 4:  ░░░░░   (medium)
  Cycle time: ~0.74 seconds

High Score (0.9):
  Frame 0:  ░░░░░░░░ (very bright)
  Frame 1:  ░░░░░░░░ (very bright)
  Frame 2:  ░░░░░░░░░ (maximum)
  Frame 3:  ░░░░░░░░ (very bright)
  Cycle time: ~0.44 seconds
```

---

## Visual Comparison Table

| Aspect | Low (0.2) | Medium (0.5) | High (0.8) | Critical (0.95) |
|--------|-----------|--------------|-----------|-----------------|
| **Color** | Cyan | Aqua | Green | White |
| **Hex** | #4daaff | #4dffd2 | #00ffbf | #ffffff |
| **Intensity** | 0.38 | 0.80 | 1.22 | 1.43 |
| **Width** | 1.19 | 2.25 | 3.30 | 3.83 |
| **Speed** | 0.66 | 1.35 | 1.99 | 2.27 |
| **Visibility** | Dim | Visible | Bright | Intense |
| **Glow** | Subtle | Clear | Strong | Maximum |
| **Bloom** | None | None | None | Yes |
| **Pulse** | Slow | Moderate | Fast | Very Fast |

---

## Color Palette Reference

### Hex Color Values

```
Low Synergy     → #4daaff  RGB(77, 170, 255)  HSL(212, 100%, 67%)
Medium Synergy  → #4dffd2  RGB(77, 255, 210)  HSL(164, 100%, 67%)
High Synergy    → #00ffbf  RGB(0, 255, 191)   HSL(168, 100%, 50%)
Critical        → #ffffff  RGB(255, 255, 255) HSL(0, 0%, 100%)
```

### Color Family Characteristics

```
Cyan Family (#4daaff):
  - Cool tone
  - Subdued brightness
  - Indicates lower quality
  - Professional, calm appearance

Aqua Family (#4dffd2):
  - Transition color
  - Medium vibrancy
  - Balanced appearance
  - Indicates adequate quality

Green Family (#00ffbf):
  - Vibrant tone
  - High saturation
  - Energetic appearance
  - Indicates good quality

White (#ffffff):
  - Neutral tone
  - Maximum brightness
  - Creates bloom effect
  - Indicates critical importance
```

---

## Performance Visual Optimization

### Visibility by Distance

```
Distance from Player:
  0–50 units   → Full quality, all effects visible
  50–200 units → Full quality, slight fade
  200–500 units → Reduced quality, faster updates
  500+ units   → Minimal updates, cache optimized
```

### Quality Tiers by Load

```
CPU Load < 20%  → Maximum quality
                  - All materials updated per frame
                  - Full bloom effects
                  - Smooth animations

CPU Load 20–50% → High quality
                  - Updated every 2 frames
                  - Bloom on critical only
                  - Standard animations

CPU Load 50%+   → Standard quality
                  - Updated every 4 frames
                  - Bloom disabled
                  - Color updates only
```

---

## Expected Visual Results

### What You Should See

✅ **Low Synergy Links:**
- Dim blue glow around connection
- Thin, barely-visible line
- Slow, subtle pulse
- Looks unimportant or weak

✅ **Medium Synergy Links:**
- Clear teal/aqua glow
- Visible line thickness
- Moderate pulse animation
- Looks balanced and good

✅ **High Synergy Links:**
- Bright neon green
- Thick, prominent line
- Fast, energetic animation
- Looks important and strong

✅ **Critical Synergy Links:**
- Bright white core
- Very thick line
- Very fast pulse
- Intense bloom effect
- Looks critically important

---

## Debugging Visual Issues

### If Colors Are Wrong

```
Expected: Blue → Aqua → Green → White
If Seeing: All same color
  → Check: Material.color is being updated
  → Check: Material has color property
  → Check: Score is being set

If Seeing: Only blue
  → Check: Score extraction working
  → Check: Score actually varies
  → Use: LinkGlowEngine.forceScore(0.7)
```

### If Glow Is Not Visible

```
Expected: Glow increases with score
If Seeing: No glow at all
  → Check: Material has opacity property
  → Check: Material is transparent
  → Check: emissiveIntensity > 0

If Seeing: Same glow everywhere
  → Check: Material.opacity is being updated
  → Use: LinkGlowEngine.inspect(link)
```

### If Animation Is Not Working

```
Expected: Fast pulse at high scores
If Seeing: No animation
  → Check: Animation state exists
  → Check: Pulse phase being updated
  → Check: Speed is > 0

If Seeing: Same speed everywhere
  → Check: Speed curve computation
  → Use: LinkGlowEngine.forceScore(0.2/0.5/1.0)
```

---

## Reference Implementation

### Visual Properties Object

```javascript
{
  score: 0.75,
  glowIntensity: 1.20,
  lineWidth: 3.13,
  pulseSpeed: 1.93,
  emissiveBoost: 0.76,
  color: 0x00ffbf,           // Green
  bloomOverdrive: false
}
```

### Expected Material State

```javascript
// At score 0.75:
material = {
  color: Color(0x00ffbf),    // Green
  opacity: 1.20,             // Bright
  emissive: Color(0x00ffbf), // Green glow
  emissiveIntensity: 0.76,   // Strong glow
  linewidth: 3.13            // Thick line
}
```

---

## Visual Verification Checklist

- [ ] Low scores show blue color
- [ ] High scores show green/white color
- [ ] Glow intensity increases with score
- [ ] Line width increases with score
- [ ] Pulse speed increases with score
- [ ] Critical score (>0.85) shows white
- [ ] Bloom effect visible on critical
- [ ] Animation is smooth, no stuttering
- [ ] Color transitions are gradual
- [ ] All materials update together
- [ ] No visual artifacts or glitches
- [ ] Performance is smooth (60fps)

---

## See Also

- [SYNERGY_GLOW_INTEGRATION.md](SYNERGY_GLOW_INTEGRATION.md) — Integration guide
- [SYNERGY_GLOW_QUICKREF.md](SYNERGY_GLOW_QUICKREF.md) — Quick reference
- [LinkGlowSynergyEngine1_0.js](LinkGlowSynergyEngine1_0.js) — Source code
