# SYNERGY INTEGRATION — VISUAL REFERENCE
## Complete Visual Behavior Guide with Examples

---

## SYSTEM OVERVIEW DIAGRAM

```
┌─────────────────────────────────────────────────────────────────┐
│                    SYNERGY THRESHOLD                            │
│                                                                  │
│  0.0          0.70         0.75         0.80      0.85    1.0   │
│  ├────────────┼────────────┼────────────┼────────┼─────────┤   │
│  HIDDEN       ENGAGED      TIER 1       HARMONY  TIER 2         │
│                            REVEAL       ACTIVE   REVEAL         │
│                                                                  │
│  Links:     Normal    Preparing  Fading In   Smoothing  Bonded  │
│  Nodes:     Normal    Preparing  Revealing   Damping    Glow    │
│  Glyphs:    Hidden    Engaged    Appearing   Accent     Bright  │
└─────────────────────────────────────────────────────────────────┘
```

---

## SYNERGY LEVELS: DETAILED BREAKDOWN

### Level 1: Hidden (0.00–0.69)

**What Players See:**
```
Link:    ━━━━━━━━━━━━━  (standard neon beam)
Node:    ◉             (solid with standard aura)
Glyph:   [invisible]   (not visible)
```

**State:**
- Link: Standard opacity, no structural changes
- Node: Standard geometry, all internal layers hidden
- Glyph: Not rendered, no animation boost
- Motion: Normal oscillations present

**Feeling:** "These nodes are barely connected"

---

### Level 2: Engaged (0.70–0.74)

**What Players See:**
```
Link:    ━━━━━━━━━━━━━  (preparing for reveal)
Node:    ◉ ○           (hint of internal layers)
Glyph:   ░░░░░░░░░░░░  (faint, barely visible)
```

**State:**
- Link: Still normal, internal flow becoming visible
- Node: Internal layers starting to engage
- Glyph: Very faint, about to reveal
- Motion: Beginning to regularize

**Feeling:** "Something is forming between these nodes"

---

### Level 3: Tier 1 Reveal (0.75–0.84)

**What Players See:**
```
Link:    ━━━━━━━━━━━━━  (segments becoming visible)
         ━━━━━━━━━━━━━  (internal bonding structure)
Node:    ◉▒○           (internal geometry revealed)
         ◉▒○▒          (multiple layers visible)
Glyph:   ░░░░░░░░░░░░  (progressively brightening)
         ▒▒▒▒▒▒▒▒▒▒▒▒
```

**Progressive Opacity Formula:**
```
fadeProgress = (synergy - 0.75) / (0.85 - 0.75)
revealOpacity = fadeProgress × 0.35
displayOpacity = baseOpacity + revealOpacity
```

**At 0.75:** 0% revealed opacity
**At 0.80:** 50% revealed opacity
**At 0.84:** 95% revealed opacity

**State:**
- Link: Opacity +8%, segments bonded appearance
- Node: Internal geometry +15% opacity on dim layers
- Glyph: Smooth fade-in (0→35% extra opacity)
- Motion: Subtle damping begins

**Feeling:** "The connection is strengthening! I can see the complexity now"

---

### Level 4: Tier 2 Reveal (≥0.85)

**What Players See:**
```
Link:    ═══════════════  (thick, bonded structure)
         ══════════════╪══ (internal mesh visible)
         ⟿⟿⟿⟿⟿⟿⟿⟿⟿⟿⟿  (particles flowing)
Node:    ⊙▒▒▒▒▒⊙        (fully revealed geometry)
         ▒▒▒▒▒▒▒▒▒▒▒▒   (internal layers bright)
         [gold glow]    (synergy accent visible)
Glyph:   ★★★★★★★★★★★★  (full brightness)
         ⟲ FASTER       (animation accelerated 30%)
```

**Full Opacity Calculation:**
```
displayOpacity = baseOpacity × 1.15
displayOpacity = Math.min(0.85, displayOpacity)
colorShift = (synergy - 0.85) × 2
colorBlend = toward GOLD, max 25%
animationSpeed = baseSpeed × 1.3
```

**State:**
- Link: Opacity +15%, fully segmented, motion smooth
- Node: Opacity +15%, all internal geometry visible, motion dampened 20%
- Glyph: Full opacity (+15%), gold accent applied, animation 30% faster
- Particles: Flowing smoothly without jitter

**Feeling:** "PEAK COOPERATION ACHIEVED! This is a perfect connection!"

---

## VISUAL PROGRESSION EXAMPLE: Single Link

### Time: 0s (Synergy 0.65 → Hidden)
```
SOURCE ╱════════════╲ TARGET
       └──●─────●──┘ (glyph not visible)
       ◉         ◉
```
- Link: Normal neon beam
- Nodes: Standard appearance
- Glyphs: Hidden

### Time: 5s (Synergy 0.72 → Engaged)
```
SOURCE ╱════════════╲ TARGET
       └──░─────░──┘ (glyph barely visible)
       ◉         ◉
```
- Link: Still normal but engaging
- Glyphs: Very faint shadow

### Time: 10s (Synergy 0.80 → Tier 1 Reveal)
```
SOURCE ╱╱════════════╲╲ TARGET
       └──▒─────▒──┘ (glyph clearly visible)
       ◉▒        ◉▒
```
- Link: Opacity increased, segments visible
- Nodes: Internal layers becoming visible
- Glyphs: At 50% of tier 1 brightness

### Time: 15s (Synergy 0.87 → Tier 2 Reveal)
```
SOURCE ╱╱╱═══════════╱╱╱ TARGET
       ⟿⟿ ★★★★★ ⟿⟿ (glyph glowing!)
       ⊙▒▒▒▒▒▒▒⊙
       ⟲ Animation 30% faster
```
- Link: Fully bonded appearance, thick structure
- Nodes: Internal geometry fully revealed + gold glow
- Glyphs: At full brightness with gold accent
- Animation: Running faster, motion smooth

---

## ANIMATED TRANSITIONS

### Opacity Fade-In (Tier 1)

```
Synergy    Tier 1 Opacity  Glyph Appearance
0.75       0% (0.00)       [just visible]
0.76       14% (0.07)      [░░░░░░░░░░░░]
0.78       28% (0.14)      [▒▒▒▒▒▒▒▒▒▒▒▒]
0.80       42% (0.21)      [▓▓▓▓▓▓▓▓▓▓▓▓]
0.82       71% (0.28)      [██████████████]
0.84       85% (0.33)      [███████████████]
0.85       → TIER 2        [★★★★★★★★★★★★]
```

### Color Shift (Tier 2)

```
Synergy    Color Blend     Visual Effect
0.85       0% (cyan)       Symbol appears normally colored
0.90       100% (gold)     Symbol has gold/cyan blend
1.00       100% (gold)     Maximum gold accent
```

### Animation Speed Boost (Tier 2)

```
Animation Type    Speed at <0.85   Speed at ≥0.85   Factor
────────────────────────────────────────────────────────────
Rotation          0.3 rad/s        0.39 rad/s       × 1.3
Pulse             2 Hz             2.6 Hz           × 1.3
Shimmer           1 Hz             1.3 Hz           × 1.3
Bob/Float         0.5 Hz           0.65 Hz          × 1.3
```

---

## MULTI-LINK SCENARIO

When a node has multiple connections at different synergy levels:

```
           Link A (synergy 0.88, TIER 2)
                    ╱
                  ▲ ★ (glowing, accelerated)
                 ╱ │ ╲
        NODES  ◉▒▒│▒▒◉ (both revealed)
               │ ◉ │  (central node)
                 ╲ │ ╱
                  ▼ ░ (faint, tier 1)
                    ╲
           Link B (synergy 0.78, TIER 1)
```

**Central Node Synergy State:**
- Considers highest linked synergy
- Glyphs reflect the strongest connection
- If any link ≥0.85, node reaches Tier 2
- If highest link 0.75–0.84, node at Tier 1
- If all links <0.70, node hidden

---

## MOTION BEHAVIOR COMPARISON

### Link Motion: Before & After Harmony

```
WITHOUT HARMONY (chaos):
━┓━━┓━━┓━━┓━━┓━━┓  (irregular segments)
  ┗━━┗━━┗━━┗━━┗    (jittery flow)

WITH HARMONY (smooth):
═════════════════  (regular segments)
═════════════════  (smooth flow)
```

### Node Animation: Before & After Harmony

```
WITHOUT HARMONY (jittery):      WITH HARMONY (smooth):
◉ → ◉ → ◉ → ◉ → ◉              ◉ → ◉ → ◉ → ◉ → ◉
  oscillates frequently           oscillates gently
  rotation jerks                  rotation smooth
  position drifts                 position centered

(rapid micro-movements)         (minimal micro-movements)
```

---

## HUD/DEBUG VIEW

### Console Output During Synergy Progression

```javascript
// At synergy 0.70
[NodeLinkingSystem] Synergy 0.70: Engagement threshold reached
[Glyph] Node updated: revealLevel=0 (engaged)

// At synergy 0.75
[NodeLinkingSystem] Synergy 0.75: Tier 1 reveal activated
[Glyph] Node updated: revealLevel=1 (revealing)
[Glyph] Opacity boost: +0% → +35% over 0.10s

// At synergy 0.85
[NodeLinkingSystem] Synergy 0.85: Tier 2 full reveal activated
[Glyph] Node updated: revealLevel=2 (full reveal)
[Glyph] Animation boost: 1.0x → 1.3x
[Glyph] Color shift: cyan → gold (25%)
[Harmony] Motion damping: 0.2x applied
```

---

## SIDE-BY-SIDE COMPARISON: LOW VS HIGH SYNERGY

### Low Synergy (0.50)

```
VISUAL STATE:
  Link:  ─────────────  (thin, standard color)
  Node:  ◉             (solid, no internal detail)
  Glyph: [hidden]      (not visible)
  
ANIMATION:
  Speed: 1.0×          (normal)
  Motion: Jittery      (oscillating)
  
FEELING: "Barely connected"
```

### High Synergy (0.90)

```
VISUAL STATE:
  Link:  ═════════════  (thick, bonded, segmented)
  Node:  ⊙▒▒▒▒▒⊙       (internal fully revealed)
  Glyph: ★★★★★★★★★★ (bright, gold-tinted)
  
ANIMATION:
  Speed: 1.3×          (30% faster)
  Motion: Smooth       (synchronized)
  
FEELING: "Perfect cooperation!"
```

---

## TECHNICAL REFERENCE: OPACITY FORMULAS

### Tier 1 (0.75–0.84) Formula

```javascript
// Progress from 0 (at 0.75) to 1 (at 0.85)
const fadeProgress = (synergy - 0.75) / (0.85 - 0.75);
const extraOpacity = fadeProgress * 0.35;
const displayOpacity = Math.min(0.60, baseOpacity + extraOpacity);
```

**Examples:**
- synergy=0.75 → extraOpacity=0.00 → visible but very dim
- synergy=0.80 → extraOpacity=0.175 → increasingly bright
- synergy=0.84 → extraOpacity=0.315 → almost full

### Tier 2 (≥0.85) Formula

```javascript
// Direct opacity boost
const displayOpacity = Math.min(0.85, baseOpacity * 1.15);

// Color shift intensifies above 0.85
const colorShift = (synergy - 0.85) * 2;
const goldBlend = Math.min(0.25 * colorShift, 0.25);
material.color.lerpColors(originalColor, goldColor, goldBlend);
```

**Examples:**
- synergy=0.85 → displayOpacity+=15% → colorShift=0%
- synergy=0.90 → displayOpacity+=15% → colorShift=100% (full gold)
- synergy=1.00 → displayOpacity+=15% → colorShift=300% (capped at 25%)

---

## PLAYER PERCEPTION TIMELINE

```
PLAYER SEES → PLAYER FEELS → PLAYER DOES

Synergy 0.70
  "Glyph engaging..."         Curiosity            Watches connection
  
Synergy 0.75
  "Symbol appearing!"         Interest intensifies Maintains connection
  
Synergy 0.80
  "Motion smoothing..."       Satisfaction         Optimizes link
  
Synergy 0.85
  "PEAK COOPERATION!"         Elation              Protects connection
  ★ Glyph glowing
  ⟲ Animation faster
  ═ Link bonded
```

---

## SUMMARY: THE VISUAL JOURNEY

```
START              TIER 1              TIER 2             PEAK
(0.0–0.69)        (0.75–0.84)         (≥0.85)            (1.0)
┌────────┐        ┌────────┐          ┌────────┐          ┌────────┐
│ Hidden │──→    │Fading  │──→       │ Glowing│──→      │★★★★★★★★│
│ ◉      │       │ ◉▒▒▒▒ ░│         │ ⊙▒▒▒▒▒⊙│        │⊙▒▒▒▒▒▒⊙│
│        │       │ ──────│         │ ═════  │        │═════════│
└────────┘        └────────┘         └────────┘         └────────┘
 Generic         Becoming            Amazing           Transcendent
```

═══════════════════════════════════════════════════════════════════════════════

This visual reference shows exactly what players will see as the synergy system
progresses. All three integrated systems (link bonding, node revelation, glyph
reveals) combine to create a compelling visual narrative of increasing connection.
